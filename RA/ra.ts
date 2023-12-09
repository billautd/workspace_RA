import * as RA from "@retroachievements/api";
import * as fs from "fs"
import * as XLSX from "xlsx-js-style";

//AUTH
const userName: string = "Appotheozz";
const webApiKey: string = "pIaSRkvZuWJUStkvjp3eRnXxmXLfWHdn";
const auth: RA.AuthObject = RA.buildAuthorization({ userName: userName, webApiKey: webApiKey });

//GAMES MASTERED
const completedGamesPromise: Promise<RA.UserCompletedGames> = RA.getUserCompletedGames(auth, { userName: userName });
const completionStatus: any[] = [{ "v": "Not Played", "s": { fill: { fgColor: { rgb: "AAAAAA" } } } },
{ "v": "Tried", "s": { fill: { fgColor: { rgb: "7777FF" } } } },
{ "v": "Beaten", "s": { fill: { fgColor: { rgb: "FFFF22" } } } },
{ "v": "Mastered", "s": { fill: { fgColor: { rgb: "22FF22" } } } }];

//CONSOLE IDS
const consoleDataListPromise: Promise<RA.ConsoleId[]> = RA.getConsoleIds(auth);
const consolesToIgnore: string[] = ["Events", "Hubs"];

//USER AWARDS
const userAwardsPromise: Promise<RA.UserAwards> = RA.getUserAwards(auth, { userName: userName })

//GAME LIST
const gameListPromise: Promise<Map<string, RA.GameList>> = consoleDataListPromise.then(consoleDataList => {
    return getGameList(consoleDataList);
});

//Result
Promise.all([completedGamesPromise, gameListPromise, userAwardsPromise]).then(val => {
    const completedGames: RA.UserCompletedGames = val[0];
    const gameListMap: Map<string, RA.GameList> = val[1];
    const userAwards: RA.UserAwards = val[2];
    writeFile(completedGames, userAwards, gameListMap);
});

/************************************************ */
/**********METHODS ****************************** */
/************************************************ */
async function getGameList(consoleDataList: RA.ConsoleId[]): Promise<Map<string, RA.GameList>> {
    let total: number = 0;
    const gameListMap: Map<string, RA.GameList> = new Map();
    const i: number = 0;
    for (let i = 0; i < consoleDataList.length; i++) {
        const consoleData: RA.ConsoleId = consoleDataList[i];
        if (consolesToIgnore.some(data => data === consoleData.name)) {
            continue;
        }
        console.log("GAME LIST : " + i + "/" + consoleDataList.length);
        //Create promise for given console data, add to gameListPromises list
        RA.getGameList(auth, {
            consoleId: consoleData.id,
            shouldOnlyRetrieveGamesWithAchievements: true,
            shouldRetrieveGameHashes: false
        }).then(gameList => {
            console.log("CONSOLE : " + consoleData.name + ", GAMES : " + gameList.length);
            total += gameList.length;
            console.log("TOTAL : " + total);
            gameListMap.set(consoleData.name, gameList);
            console.log("\n")
        });
        await timer(1000);
    }
    return new Promise(resolve => { resolve(gameListMap) });
}

function writeFile(completedGames: RA.UserCompletedGames, userAwards: RA.UserAwards, gameListMap: Map<string, RA.GameList>) {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    //GAMES SHEET
    let gamesArray: any[][] = [[{ t: "s", v: "Console" }, { t: "s", v: "Name" }, { t: "s", v: "Completion status" }]];
    gameListMap.forEach((gameList, consoleName) => {
        for (const entity of gameList) {
            const gameData: any[] = [{ t: "s", v: consoleName }, { t: "s", v: entity.title }];
            if (userAwards.visibleUserAwards.some(award => award.awardType === "Mastery/Completion" && award.title === entity.title && award.consoleName === consoleName)) {
                gameData.push(completionStatus[3]);
            }
            else if (userAwards.visibleUserAwards.some(award => award.awardType === "Game Beaten" && award.title === entity.title && award.consoleName === consoleName)) {
                gameData.push(completionStatus[2]);
            }
            else if (completedGames.some(completedGame => completedGame.numAwarded > 0 && completedGame.title === entity.title && completedGame.consoleName === consoleName)) {
                gameData.push(completionStatus[1]);
            }
            else {
                gameData.push(completionStatus[0]);
            }
            gamesArray.push(gameData)
        }
    });
    const gamesWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(gamesArray);
    XLSX.utils.book_append_sheet(wb, gamesWs, "RAGames");

    //CONSOLE DATA SHEET
    let consoleDataArray: any[][] = [[{ t: "s", v: "Console" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B2:B1000)" }]];
    gameListMap.forEach((gameList, consoleName) => {
        consoleDataArray.push([{ t: "s", v: consoleName }, { t: "n", v: gameList.length }])
    });
    const consoleDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(consoleDataArray);
    XLSX.utils.book_append_sheet(wb, consoleDataWs, "Console data")

    //COMPLETION DATA SHEET
    let completionDataArray: any[][] = [[{ t: "s", v: "Status" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B2:B1000)" }]];
    for (let i = 0; i < completionStatus.length; i++) {
        const cell = {
            t: "n",
            f: "COUNTIF(RAGames!C2:C20000, A" + (i + 2)
        }
        completionDataArray.push([{ t: "s", v: completionStatus[i]["v"], s: completionStatus[i]["s"] }, cell]);
    }
    const completionDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(completionDataArray);
    XLSX.utils.book_append_sheet(wb, completionDataWs, "Completion data")

    XLSX.writeFile(wb, "../Achievements.xlsx");
}

function timer(ms: number) { return new Promise(res => setTimeout(res, ms)); }