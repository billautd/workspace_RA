import * as Common from "./common"
import * as XLSX from "xlsx-js-style";

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
    achieved: boolean
}

export function parseGameAchievementData(json: any, game: OwnedGame): OwnedGame {
    if (json) {
        const achievements: any[] = [...json];
        //Reset previous data, just in case
        let achievementData: AchievementData[] = []
        for (let val of achievements) {
            achievementData.push({
                achieved: val.achieved === 1
            })
        }
        game.achievements = achievementData;
    }
    return game;
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
    for (let i = 0; i < jsonRes.games.length; i++) {
        const ownedGame: OwnedGame = parseJsonToOwnedGame(jsonRes.games[i])
        console.log("PROCESSING " + (i + 1) + "/" + jsonRes.games.length + " : " + ownedGame.name + ", " + ownedGame.appId);
        const achievementsData: any = (await getAchievements(steamId, steamApiKey, ownedGame.appId)).playerstats.achievements || {};
        parseGameAchievementData(achievementsData, ownedGame)
        if (ownedGame.achievements.length === 0) {
            console.log("No achievements")
        } else {
            console.log("Achievements : " + ownedGame.achievements.length)
        }
        ownedGamesResponse.push(ownedGame)
    }

    return writeSteamSheet(ownedGamesResponse)
}

function writeSteamSheet(ownedGames: OwnedGamesResponse): Promise<OwnedGamesResponse> {
    console.log("Writing Steam sheet...")
    let gamesArray = [steamHeader]
    for (let ownedGame of ownedGames) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame.name }]
        let status: Common.CompletionStatusData | undefined;
        if (ownedGame.achievements.length === 0) {
            status = Common.completionStatus.get("No achievements");
        }
        else if (ownedGame.achievements.every((a) => a.achieved)) {
            status = Common.completionStatus.get("Mastered")
        }
        else if (ownedGame.achievements.some((a) => a.achieved)) {
            status = Common.completionStatus.get("Tried")
        } else {
            status = Common.completionStatus.get("Not played")
        }
        gameDataArray.push({ "v": status?.name, "s": status?.style })
        let numAwarded: number = ownedGame.achievements.filter(a => a.achieved).length;
        gameDataArray.push({ t: "n", v: numAwarded })
        gameDataArray.push({ t: "n", v: ownedGame.achievements.length })
        if (status?.name !== "No achievements") {
            gameDataArray.push({ t: "n", v: numAwarded / ownedGame.achievements.length, z: "0.00%" })
        } else {
            gameDataArray.push({})
        }
        gameDataArray.push({ t: "n", v: ownedGame.appId })
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    gamesWs['!cols'] = steamColumns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "SteamGames")
    return new Promise((resolve) => resolve(ownedGames));
}