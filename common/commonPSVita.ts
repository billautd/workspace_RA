import * as Common from "./common"
import * as XLSX from "xlsx-js-style";
import * as rd from "readline";
import * as fs from "fs";
import { compareCompletionStatus, LocalGameData } from "../compareService";

export const psVitaColumns: XLSX.ColInfo[] = [{ wch: 50 }, { wch: 20 }]

export const psVitaHeader: any[] = [{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 }]

let gameList:GameData[] = [];

interface GameData{
    name:string,
    status:Common.CompletionStatusData
}

export async function getPSVitaPromise(): Promise<GameData[]> {
    return writePSVitaSheet();
}

async function getPSVitaGames(): Promise<GameData[]> {
    let psVitaGames: GameData[] = [];
    const reader = rd.createInterface(fs.createReadStream("Files/PSVitaGames.txt"));
    for await (const l of reader) {
        psVitaGames.push({name:l, status:Common.completionStatus.get(Common.CompletionStatusType.NOT_PLAYED)!})
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

async function writePSVitaSheet(): Promise<GameData[]> {
    Common.logger.info("Writing PSVita sheet...")
    gameList = await getPSVitaGames()
    let localPSVitaBeatenGames: string[] = await getPSVitaBeaten()
    let localPSVitaMasteredGames: string[] = await getPSVitaMastered()
    let gamesArray = [psVitaHeader]
    for (let ownedGame of gameList) {
        const gameDataArray: any[] = [{ t: "s", v: ownedGame.name }]
        let status: Common.CompletionStatusData | undefined;
        let isInLocalBeaten = localPSVitaBeatenGames.find(n => n === ownedGame.name)
        let isInLocalMastered = localPSVitaMasteredGames.find(n => n === ownedGame.name)

        if (isInLocalMastered) {
            status = Common.completionStatus.get(Common.CompletionStatusType.MASTERED)
        }
        else if (isInLocalBeaten) {
            status = Common.completionStatus.get(Common.CompletionStatusType.BEATEN)
        }
        else {
            status = Common.completionStatus.get(Common.CompletionStatusType.NOT_PLAYED)
        }
        Common.logger.debug(ownedGame.name + " -> " + status?.name)
        gameDataArray.push({ "v": status?.name, "s": status?.style })
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    gamesWs['!cols'] = psVitaColumns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "PSVitaGames")
    return new Promise((resolve) => resolve(gameList));
}

export function comparePSVitaData(localPSVitaDataList:LocalGameData[]):void{
    Common.logger.info("Comparing PSVita data");

    //Check if local is correct
    localPSVitaDataList.forEach(data => {
        const gameFound = gameList.find(g => g.name == data.name);
        if(!gameFound){
            Common.logger.error(data.name + " for PSVita => In Playnite but not in PSVita");
        }else{
            if(!compareCompletionStatus(data.completionStatus, gameFound.status.name)){
                Common.logger.error(data.name + " for PSVita => " + data.completionStatus + " in Playnite but " + gameFound.status.name + " in PSVita");
            }
            else{
                Common.logger.debug(data.name + " for PSVita => OK");
            }
        }
    });
    //Check if PSVita is correct
    gameList.forEach(data => {
        const gameFound = localPSVitaDataList.find(g => data.name == g.name);
        if(!gameFound){
            Common.logger.error(data.name + " for PSVita => In PSVita but not in Playnite");
        }
    });
}