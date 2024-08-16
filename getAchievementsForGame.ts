import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as RA from "@retroachievements/api"

let raUsername: string = ""
let raApiKey: string = ""
let steamId: string = ""
let steamKey: string = ""
let source:string = ""
let gameId:number = -1;

//Parse parameters
process.argv.forEach((value, index) => {
    if (value.startsWith("raUsername")) {
        raUsername = value.split("=")[1]
    }
    if (value.startsWith("raApiKey")) {
        raApiKey = value.split("=")[1]
    }
    if (value.startsWith("steamId")) {
        steamId = value.split("=")[1]
    }
    if (value.startsWith("steamKey")) {
        steamKey = value.split("=")[1]
    }
    if(value.startsWith("source")){
        source = value.split("=")[1]
    }
    if(value.startsWith("gameId")){
        gameId = Number.parseInt(value.split("=")[1])
    }
});
if (raUsername === "") {
    throw new Error("raUsername parameter is not defined")
}
if (raApiKey === "") {
    throw new Error("raApiKey parameter is not defined")
}
if (steamId === "") {
    throw new Error("steamId parameter is not defined")
}
if (steamKey === "") {
    throw new Error("steamKey parameter is not defined")
}
if(source === ""){
    throw new Error("source parameter is not defined")
}
if(gameId === -1){
    throw new Error("gameId parameter is not defined")
}

//Build authorization
CommonRA.setAuth(RA.buildAuthorization({ userName: raUsername, webApiKey: raApiKey }));

if(source === "ra"){
    CommonRA.getAchievementsForGame(gameId, true);
}else if(source === "steam"){
    CommonSteam.getAchievementsForGame(steamId, steamKey, gameId, true);
}else{
    throw new Error("source " + source + " is unknown");
}

