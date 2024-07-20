import * as Common from "./common"
import * as XLSX from "xlsx-js-style";
import * as rd from "readline";
import * as fs from "fs";

export const ps3Columns: XLSX.ColInfo[] = [{ wch: 50 }, { wch: 20 }]

export const ps3Header: any[] = [{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 }]

export async function getPS3Promise(): Promise<string[]> {
    return writePS3Sheet();
}

async function getPS3Games(): Promise<string[]> {
    let ps3Games: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PS3Games.txt"));
    for await (const l of reader) {
        ps3Games.push(l)
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

async function writePS3Sheet(): Promise<string[]> {
    console.log("Writing PS3 sheet...")
    let localPS3Games: string[] = await getPS3Games()
    let localPS3BeatenGames: string[] = await getPS3Beaten()
    let localPS3MasteredGames: string[] = await getPS3Mastered()
    let gamesArray = [ps3Header]
    for (let ownedGame of localPS3Games) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame }]
        let status: Common.CompletionStatusData | undefined;
        let isInLocalBeaten = localPS3BeatenGames.find(n => n === ownedGame)
        let isInLocalMastered = localPS3MasteredGames.find(n => n === ownedGame)

        if (isInLocalMastered) {
            status = Common.completionStatus.get("Mastered")
        }
        else if (isInLocalBeaten) {
            status = Common.completionStatus.get("Beaten")
        }
        else {
            status = Common.completionStatus.get("Not played")
        }
        console.log(ownedGame + " -> " + status?.name)
        gameDataArray.push({ "v": status?.name, "s": status?.style })
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    gamesWs['!cols'] = ps3Columns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "PS3Games")
    return new Promise((resolve) => resolve(localPS3Games));
}