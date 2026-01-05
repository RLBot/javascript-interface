// This file needs to be maintained manually >:(

import { flat } from "./index.js";

export type ValidCoreMessage =
  | flat.BallPrediction
  | flat.ControllableTeamInfo
  | flat.DisconnectSignal
  | flat.FieldInfo
  | flat.GamePacket
  | flat.MatchComm
  | flat.MatchConfiguration
  | flat.PingRequest
  | flat.PingResponse
  | flat.RenderingStatus;

export type ValidInterfaceMessage =
  | flat.ConnectionSettings
  | flat.DesiredGameState
  | flat.DisconnectSignal
  | flat.InitComplete
  | flat.MatchComm
  | flat.MatchConfiguration
  | flat.PingRequest
  | flat.PingResponse
  | flat.PlayerInput
  | flat.RemoveRenderGroup
  | flat.RenderGroup
  | flat.RenderingStatus
  | flat.SetLoadout
  | flat.StartCommand
  | flat.StopCommand;

export function interfaceMessageFromType(type: ValidInterfaceMessage) {
  switch (true) {
    case type instanceof flat.ConnectionSettings:
      return flat.InterfaceMessage.ConnectionSettings;
    case type instanceof flat.DesiredGameState:
      return flat.InterfaceMessage.DesiredGameState;
    case type instanceof flat.DisconnectSignal:
      return flat.InterfaceMessage.DisconnectSignal;
    case type instanceof flat.InitComplete:
      return flat.InterfaceMessage.InitComplete;
    case type instanceof flat.MatchComm:
      return flat.InterfaceMessage.MatchComm;
    case type instanceof flat.MatchConfiguration:
      return flat.InterfaceMessage.MatchConfiguration;
    case type instanceof flat.PingRequest:
      return flat.InterfaceMessage.PingRequest;
    case type instanceof flat.PingResponse:
      return flat.InterfaceMessage.PingResponse;
    case type instanceof flat.PlayerInput:
      return flat.InterfaceMessage.PlayerInput;
    case type instanceof flat.RemoveRenderGroup:
      return flat.InterfaceMessage.RemoveRenderGroup;
    case type instanceof flat.RenderGroup:
      return flat.InterfaceMessage.RenderGroup;
    case type instanceof flat.RenderingStatus:
      return flat.InterfaceMessage.RenderingStatus;
    case type instanceof flat.SetLoadout:
      return flat.InterfaceMessage.SetLoadout;
    case type instanceof flat.StartCommand:
      return flat.InterfaceMessage.StartCommand;
    case type instanceof flat.StopCommand:
      return flat.InterfaceMessage.StopCommand;
    default:
      throw new Error(
        // @ts-expect-error The type here is never, but if it isn't, it is likely a class
        `Unknown interface message type: ${type.constructor.name}`,
      );
  }
}
