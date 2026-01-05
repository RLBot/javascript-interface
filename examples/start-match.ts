import { RLBotConnection, flat } from "../dist/index.js";
import { env } from "process";

let conn = new RLBotConnection();

let connSettings = new flat.ConnectionSettings();
connSettings.agentId = ""; // Match managers should have agentId === ""
connSettings.wantsBallPredictions = false;
connSettings.wantsComms = false;
connSettings.closeBetweenMatches = true;
await conn.sendPacket(connSettings);

let matchConfig = new flat.MatchConfiguration();
matchConfig.launcherArg = "";
matchConfig.gameMapUpk = "Stadium_P";
matchConfig.playerConfigurations = [];
matchConfig.scriptConfigurations = [];
matchConfig.mutators = new flat.MutatorSettings();
matchConfig.mutators.matchLength = flat.MatchLengthMutator.Unlimited;

let botConfig = new flat.PlayerConfiguration();
botConfig.team = 0;
botConfig.varietyType = flat.PlayerClass.CustomBot;
botConfig.variety = new flat.CustomBot();
(botConfig.variety as flat.CustomBot).name = "Bot";
(botConfig.variety as flat.CustomBot).agentId =
  env["RLBOT_AGENT_ID"] ?? "rlbot/javascript-example";
(botConfig.variety as flat.CustomBot).rootDir = "/tmp";
(botConfig.variety as flat.CustomBot).runCommand = "";
matchConfig.playerConfigurations.push(botConfig);

let humanConfig = new flat.PlayerConfiguration();
humanConfig.team = 1;
humanConfig.varietyType = flat.PlayerClass.Human;
humanConfig.variety = new flat.Human();
matchConfig.playerConfigurations.push(humanConfig);

await conn.sendPacket(matchConfig);

// wait for fieldinfo and matchconfig
let requiredPacketsReceived = 0;
while (requiredPacketsReceived < 2) {
  let packet = await conn.recvPacket();
  if (
    packet instanceof flat.FieldInfo ||
    packet instanceof flat.MatchConfiguration
  ) {
    requiredPacketsReceived++;
  }
}

console.log("Match started");

await conn.disconnect();
