import * as Common from "./common"
import * as XLSX from "xlsx-js-style";
import * as fs from "fs";
import * as rd from "readline";
import { json } from "stream/consumers";

export const steamColumns: XLSX.ColInfo[] = [{ wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]

export const steamHeader: any[] = [{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 },
{ t: "s", v: "Earned achievements", s: Common.headerStyle2 },
{ t: "s", v: "Total achievements", s: Common.headerStyle2 },
{ t: "s", v: "Percentage", s: Common.headerStyle2 },
{ t: "s", v: "APPID", s: Common.headerStyle2 }]

//Data used to get achievement data from steam game
export interface OwnedGame {
    name: string,
    appId: number,
    achievements: AchievementData[]
}

export function parseJsonToOwnedGame(json: any): OwnedGame {
    const ownedGame: OwnedGame = {
        name: json.name,
        appId: json.appid,
        achievements: []
    }
    return ownedGame;
}

//Steam owned games data
export type OwnedGamesResponse = OwnedGame[];

export function parseJsonToOwnedGamesResponse(json: any): OwnedGamesResponse {
    const gamesList: OwnedGame[] = [];
    for (let game of json.response.games) {
        const ownedGame: OwnedGame = parseJsonToOwnedGame(game)
        gamesList.push(ownedGame)
        console.log("PARSED GAME : " + ownedGame.name + ", " + ownedGame.appId)
    }
    return gamesList;
}

//Achievement data
export interface AchievementData {
    apiName:string,
    title:string,
    description:string,
    achieved: boolean
}

export function parseGameAchievementData(json: any, game: OwnedGame): OwnedGame {
    if (json) {
        const achievements: any[] = [...json];
        //Reset previous data, just in case
        let achievementData: AchievementData[] = []
        for (let val of achievements) {
            achievementData.push({
                apiName:"",
                title:"",
                description:"",
                achieved: val.achieved === 1
            })
        }
        game.achievements = achievementData;
    }
    return game;
}

function parseDetailsGameAchievementData(json:any):AchievementData{
    return {
        apiName:json.name,
        title:json.displayName,
        description:json.description,
        achieved:false
    };
}

async function getAchievements(steamId: string, steamApiKey: string, appId: number) {
    const result = await fetch('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=' + appId + '&key=' + steamApiKey + '&steamid=' + steamId);
    const jsonRes = await result.json();
    return jsonRes;
}

export async function getSteamPromise(steamId: string, steamApiKey: string): Promise<OwnedGamesResponse> {
    const result = await fetch('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + steamApiKey + '&steamid=' + steamId + '&format=json&include_appinfo=1&include_played_free_games=1&skip_unvetted_apps=0');
    const jsonRes = (await result.json()).response;

    const ownedGamesResponse: OwnedGamesResponse = [];
    const achievementsData: any = {}
    // for (let i = 0; i < 50; i++) {
    for (let i = 0; i < jsonRes.games.length; i++) {
        const ownedGame: OwnedGame = parseJsonToOwnedGame(jsonRes.games[i])
        const achievementsData: any = (await getAchievements(steamId, steamApiKey, ownedGame.appId)).playerstats.achievements || {};
        parseGameAchievementData(achievementsData, ownedGame)
        let statusLog = "";
        if (ownedGame.achievements.length === 0) {
            statusLog = "No achievements";
        } else {
            statusLog = ("Achievements : " + ownedGame.achievements.length);
        }
        console.log("PROCESSING " + (i + 1) + "/" + jsonRes.games.length + " : " + ownedGame.name + " (" + ownedGame.appId + ") -> " + statusLog);
        ownedGamesResponse.push(ownedGame)
    }

    return writeSteamSheet(ownedGamesResponse)
}

async function getLocalSteamBeaten(): Promise<string[]> {
    let beatenGames: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/SteamBeaten.txt"));
    for await (const l of reader) {
        beatenGames.push(l)
    }
    return beatenGames
}

async function getLocalSteamMastered(): Promise<string[]> {
    let masteredGames: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/SteamMastered.txt"));
    for await (const l of reader) {
        masteredGames.push(l)
    }
    return masteredGames
}


async function writeSteamSheet(ownedGames: OwnedGamesResponse): Promise<OwnedGamesResponse> {
    console.log("Writing Steam sheet...")
    let localSteamBeatenGames: string[] = await getLocalSteamBeaten()
    let localSteamMasteredGames: string[] = await getLocalSteamMastered()
    let gamesArray = [steamHeader]
    for (let ownedGame of ownedGames) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame.name }]
        let status: Common.CompletionStatusData | undefined;
        let isNoAchievements: boolean = ownedGame.achievements.length === 0;
        let isInLocalBeaten = localSteamBeatenGames.find(n => n === ownedGame.name)
        let isInLocalMastered = localSteamMasteredGames.find(n => n === ownedGame.name)
        let isTried = !isNoAchievements && ownedGame.achievements.some((a) => a.achieved)
        let isMastered = !isNoAchievements && ownedGame.achievements.every((a) => a.achieved)

        if (isNoAchievements && !isInLocalBeaten && !isInLocalMastered) {
            status = Common.completionStatus.get("No achievements");
        }
        else if (isMastered || isInLocalMastered) {
            status = Common.completionStatus.get("Mastered")
        }
        else if (isInLocalBeaten) {
            status = Common.completionStatus.get("Beaten")
        }
        else if (isTried) {
            status = Common.completionStatus.get("Tried")
        }
        else {
            status = Common.completionStatus.get("Not played")
        }
        console.log(ownedGame.appId + " -> " + (isNoAchievements ? "No achievements : " : "") + status?.name)
        gameDataArray.push({ "v": status?.name, "s": status?.style })
        let numAwarded: number;
        let totalAchievements: number;
        let completionPercentage: number = 0;
        if (isNoAchievements) {
            numAwarded = 0;
            totalAchievements = 0;
            if (isInLocalBeaten) {
                completionPercentage = 0.5
            }
            else if (isInLocalMastered) {
                completionPercentage = 1
            }
        } else {
            numAwarded = ownedGame.achievements.filter(a => a.achieved).length;
            totalAchievements = ownedGame.achievements.length;
            completionPercentage = numAwarded / ownedGame.achievements.length;
        }
        gameDataArray.push({ t: "n", v: numAwarded })
        gameDataArray.push({ t: "n", v: totalAchievements })
        gameDataArray.push({ t: "n", v: completionPercentage, z: "0.00%" })
        gameDataArray.push({ t: "n", v: ownedGame.appId })
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    gamesWs['!cols'] = steamColumns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "SteamGames")
    return new Promise((resolve) => resolve(ownedGames));
}

export async function getAchievementsForGame(steamId:string, steamApiKey:string, gameId: number, getRandom: boolean){
    const gameData = await fetch('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?appid=' + gameId + '&key=' + steamApiKey + '&steamid=' + steamId + '&format=json&include_appinfo=1&include_played_free_games=1&skip_unvetted_apps=0');
    const gameDataJsonRes = (await gameData.json());
    const userData = await fetch('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=' + gameId + '&key=' + steamApiKey + '&steamid=' + steamId + '&format=json&include_appinfo=1&include_played_free_games=1&skip_unvetted_apps=0');
    const userDataJsonRes = (await userData.json());

    let earnedAchs:AchievementData[]  = [];
    let notEarnedAchs: AchievementData[] = [];

    let gameDataAchievements:any[] = gameDataJsonRes.game.availableGameStats.achievements;
    let userDataAchievements:any[] = userDataJsonRes.playerstats.achievements;
    for(let i = 0; i < gameDataAchievements.length; i++){
        let ach: AchievementData = parseDetailsGameAchievementData(gameDataAchievements[i]);
        if(userDataAchievements.find(userAch => userAch.apiname == ach.apiName && userAch.achieved)){
            ach.achieved = true;
            earnedAchs.push(ach)
        }else{
            ach.achieved = false;
            notEarnedAchs.push(ach)
        }
    }

    console.log("Earned")
    earnedAchs.forEach(earnedAch =>{
        console.log("\t" + earnedAch.title + " : " + earnedAch.description)
    })
    console.log("")

    console.log("Not earned")
    notEarnedAchs.forEach(notEarnedAch =>{
        console.log("\t" + notEarnedAch.title + " : " + notEarnedAch.description)
    })
    console.log("")

    if(getRandom){
        let id = Math.floor(Math.random() * (notEarnedAchs.length));
        console.log("Random cheevo")
        console.log("\t" + notEarnedAchs[id].title + " : " + notEarnedAchs[id].description);
    }
}