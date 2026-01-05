import { RLBotConnection, flat } from "../dist/index.js";

let conn = new RLBotConnection();

let connSettings = new flat.ConnectionSettings();
connSettings.agentId = process.env.RLBOT_AGENT_ID ?? "rlbot/javascript-example";
connSettings.wantsBallPredictions = false;
connSettings.wantsComms = false;
connSettings.closeBetweenMatches = true;

await conn.sendPacket(connSettings);
await conn.sendPacket(new flat.InitComplete());

let controllableInfo: flat.ControllableInfo | undefined = undefined;
while (true) {
  let packet = await conn.recvPacket();

  if (packet instanceof flat.DisconnectSignal) break;

  if (packet instanceof flat.ControllableTeamInfo) {
    if (packet.controllables.length != 1) {
      throw "Bot doesn't support hivemind";
    }
    controllableInfo = packet.controllables[0];

    console.log("Bot is ready");
  }

  if (packet instanceof flat.GamePacket && controllableInfo !== undefined) {
    let ball = packet.balls[0];
    if (ball === undefined) continue;

    let index = controllableInfo.index;

    // We're not in the gtp, skip this tick
    if (packet.players.length <= index) continue;

    let target = ball.physics as flat.Physics;
    let car = packet.players[index].physics as flat.Physics;

    let botToTargetAngle = Math.atan2(
      (target.location as flat.Vector3).y - (car.location as flat.Vector3).y,
      (target.location as flat.Vector3).x - (car.location as flat.Vector3).x,
    );

    let botFrontToTargetAngle =
      botToTargetAngle - (car.rotation as flat.Rotator).yaw;

    function remEuclid(a: number, b: number): number {
      return ((a % b) + b) % b;
    }

    botFrontToTargetAngle =
      remEuclid(botFrontToTargetAngle + Math.PI, 2 * Math.PI) - Math.PI;

    let controller = new flat.ControllerState();

    if (botFrontToTargetAngle > 0) {
      controller.steer = 1;
    } else {
      controller.steer = -1;
    }

    controller.throttle = 1;

    let input = new flat.PlayerInput(index, controller);
    await conn.sendPacket(input);
  }
}
