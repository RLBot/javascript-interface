import * as net from "net";
import { env } from "process";
import * as flatbuffers from "flatbuffers";
import EventEmitter, { once } from "events";
import { flat, util } from "./index.js";

const DEFAULT_SERVER_IP = "127.0.0.1";
const DEFAULT_SERVER_PORT = 23234;

export class RLBotConnection {
  private socket: net.Socket;
  private packetBuf: util.ValidCoreMessage[] = [];
  private flatbuffersBuilder: flatbuffers.Builder = new flatbuffers.Builder();
  private internalEvents: EventEmitter = new EventEmitter();

  constructor(
    host: string | undefined = undefined,
    port: number | undefined = undefined,
  ) {
    if (
      host === undefined &&
      port === undefined &&
      env["RLBOT_SERVER_ADDR"] !== undefined
    ) {
      let split = env["RLBOT_SERVER_ADDR"].split(":");
      let pop = split.pop();
      port = pop !== undefined ? +pop : undefined;
      host = split.join(":");
    }

    host ??= env["RLBOT_SERVER_IP"] ?? DEFAULT_SERVER_IP;
    port ??=
      (env["RLBOT_SERVER_PORT"] ? +env["RLBOT_SERVER_PORT"] : undefined) ??
      DEFAULT_SERVER_PORT;

    this.socket = new net.Socket();
    this.socket.connect({ host, port, noDelay: true });
    this.socket.on("error", console.error);

    let localBuf = Buffer.alloc(0);
    this.socket.on("data", (chunk) => {
      // @ts-ignore this works shut up
      localBuf = Buffer.concat([localBuf, chunk]);

      while (localBuf.length > 0) {
        if (localBuf.length < 2) return;
        let packetLen = localBuf.readUint16BE(0);
        if (localBuf.length < 2 + packetLen) return;
        let packetPayload = localBuf.subarray(2, 2 + packetLen);

        let corePacket = flat.CorePacketFlat.getRootAsCorePacket(
          new flatbuffers.ByteBuffer(packetPayload),
        ).unpack();
        // Use NonNullable here to tell TS that it wont be null
        // TS should still warn us if the schema updates but not the util help type
        this.packetBuf.push(
          corePacket.message as NonNullable<typeof corePacket>,
        );

        this.internalEvents.emit("processedPacket");

        // Remove processed packet
        localBuf = localBuf.subarray(2 + packetLen);
      }
    });

    let droppedPackets = 0;
    this.internalEvents.on("processedPacket", () => {
      // Automatically clean up when we store over 64 packets in this.packetBuf
      if (this.packetBuf.length > 64) {
        droppedPackets += this.packetBuf.length - 64;
        this.packetBuf = this.packetBuf.slice(-64);
      }
    });

    setInterval(() => {
      if (droppedPackets != 0) {
        console.warn(
          `packetBuf.length > 64; dropped ${droppedPackets} packets`,
        );
        droppedPackets = 0;
      }
    }, 2000).unref();
  }

  public async sendPacket(packet: util.ValidInterfaceMessage): Promise<void> {
    let offset: flatbuffers.Offset = new flat.InterfacePacket(
      util.interfaceMessageFromType(packet),
      packet,
    ).pack(this.flatbuffersBuilder);
    this.flatbuffersBuilder.finish(offset);
    let buf = this.flatbuffersBuilder.asUint8Array();

    let header_buf = new ArrayBuffer(2); // u16 is 2 bytes
    let view = new DataView(header_buf);
    view.setUint16(0, buf.length, false);
    let header = Buffer.from(header_buf);

    let finishedBuf = new Uint8Array(2 + buf.length);
    finishedBuf.set(header, 0);
    finishedBuf.set(buf, 2);
    this.flatbuffersBuilder.clear();

    let drained = this.socket.write(finishedBuf);
    if (!drained) {
      await once(this.socket, "drain");
    }
  }

  public async recvPacket(): Promise<util.ValidCoreMessage> {
    let packet = this.packetBuf.shift();
    if (packet === undefined) {
      await once(this.internalEvents, "processedPacket");
      packet = this.packetBuf.shift() as NonNullable<typeof packet>;
    }
    return packet;
  }

  public async disconnect(): Promise<void> {
    this.sendPacket(new flat.DisconnectSignal());
    setTimeout(() => {
      if (!this.socket.closed) {
        console.log("DisconnectSignal timed out after 1s, closing socket");
        this.socket.end();
      }
    }, 1000).unref();
  }
}
