import * as Common from "./common"
import * as XLSX from "xlsx-js-style";
import * as rd from "readline";
import * as fs from "fs";
import { LocalGameData } from "../compareService";
import { Game } from "@retroachievements/api";

export const ps3Columns: XLSX.ColInfo[] = [{ wch: 50 }, { wch: 20 }]

export const ps3Header: any[] = [{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 }]

interface GameData{
    name:string,
    status:Common.CompletionStatusData
}

let gameList:GameData[] = [];

export async function getPS3Promise(): Promise<GameData[]> {
    return writePS3Sheet();
}

async function getPS3Games(): Promise<GameData[]> {
    let ps3Games: GameData[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PS3Games.txt"));
    for await (const l of reader) {
        ps3Games.push({name:l, status:Common.completionStatus.get("Not played")!})
    }
    return ps3Games
}

async function getPS3Beaten(): Promise<string[]> {
    let ps3Beaten: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PS3GamesBeaten.txt"));
    for await (const l of reader) {
        ps3Beaten.push(l)
    }
    return ps3Beaten
}

async function getPS3Mastered(): Promise<string[]> {
    let ps3Mastered: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PS3GamesMastered.txt"));
    for await (const l of reader) {
        ps3Mastered.push(l)
    }
    return ps3Mastered
}

async function writePS3Sheet(): Promise<GameData[]> {
    console.log("Writing PS3 sheet...")
    gameList = await getPS3Games()
    let localPS3BeatenGames: string[] = await getPS3Beaten()
    let localPS3MasteredGames: string[] = await getPS3Mastered()
    let gamesArray = [ps3Header]
    for (let ownedGame of gameList) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame }]
        let status: Common.CompletionStatusData | undefined;
        let isInLocalBeaten = localPS3BeatenGames.find(n => n === ownedGame.name)
        let isInLocalMastered = localPS3MasteredGames.find(n => n === ownedGame.name)

        if (isInLocalMastered) {
            status = Common.completionStatus.get("Mastered")
        }
        else if (isInLocalBeaten) {
            status = Common.completionStatus.get("Beaten")
        }
        else {
            status = Common.completionStatus.get("Not played")
        }
        ownedGame.status = status!;
        console.log(ownedGame.name + " -> " + status?.name)
        gameDataArray.push({ "v": status?.name, "s": status?.style })
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    gamesWs['!cols'] = ps3Columns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "PS3Games")
    return new Promise((resolve) => resolve(gameList));
}

export function comparePS3Data(localPS3DataList:LocalGameData[]):void{
    //Check if local is correct
    localPS3DataList.forEach(data => {
        const gameFound = gameList.find(g => g.name === data.name);
        if(!gameFound){
            console.log(data.name + " for PS3 => In Playnite but not in PS3");
        }else{
            if(!data.completionStatus.toLowerCase().includes(gameFound.status.name.toLocaleLowerCase())){
                console.log(data.name + " for PS3 => " + data.completionStatus + " in Playnite but " + gameFound.status.name + " in PS3");
            }
        }
        console.log("\n")
    });

    //Check if PS3 is correct
    gameList.forEach(data => {
        const gameFound = localPS3DataList.find(g => data.name === g.name);
        if(!gameFound){
            console.log(data.name + " for PS3 => In PS3 but not in Playnite");
        }
        console.log("\n")
    });
}