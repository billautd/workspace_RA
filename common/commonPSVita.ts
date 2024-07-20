import * as Common from "./common"
import * as XLSX from "xlsx-js-style";
import * as rd from "readline";
import * as fs from "fs";

export const psVitaColumns: XLSX.ColInfo[] = [{ wch: 50 }, { wch: 20 }]

export const psVitaHeader: any[] = [{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 }]

export async function getPSVitaPromise(): Promise<string[]> {
    return writePSVitaSheet();
}

async function getPSVitaGames(): Promise<string[]> {
    let psVitaGames: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PSVitaGames.txt"));
    for await (const l of reader) {
        psVitaGames.push(l)
    }
    return psVitaGames
}

async function getPSVitaBeaten(): Promise<string[]> {
    let psVitaBeaten: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PSVitaGamesBeaten.txt"));
    for await (const l of reader) {
        psVitaBeaten.push(l)
    }
    return psVitaBeaten
}

async function getPSVitaMastered(): Promise<string[]> {
    let psVitaMastered: string[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PSVitaGamesMastered.txt"));
    for await (const l of reader) {
        psVitaMastered.push(l)
    }
    return psVitaMastered
}

async function writePSVitaSheet(): Promise<string[]> {
    console.log("Writing PSVita sheet...")
    let localPSVitaGames: string[] = await getPSVitaGames()
    let localPSVitaBeatenGames: string[] = await getPSVitaBeaten()
    let localPSVitaMasteredGames: string[] = await getPSVitaMastered()
    let gamesArray = [psVitaHeader]
    for (let ownedGame of localPSVitaGames) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame }]
        let status: Common.CompletionStatusData | undefined;
        let isInLocalBeaten = localPSVitaBeatenGames.find(n => n === ownedGame)
        let isInLocalMastered = localPSVitaMasteredGames.find(n => n === ownedGame)

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
    gamesWs['!cols'] = psVitaColumns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "PSVitaGames")
    return new Promise((resolve) => resolve(localPSVitaGames));
}