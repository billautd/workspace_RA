import * as RA from "@retroachievements/api";
import * as Common from "./common"
import * as XLSX from "xlsx-js-style";

export const consolesToIgnore: string[] = ["Events", "Hubs"];

export const raColumns: XLSX.ColInfo[] = [{ wch: 30 }, { wch: 70 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]

export const raHeader: any[] = [{ t: "s", v: "Console", s: Common.headerStyle2 },
{ t: "s", v: "Name", s: Common.headerStyle2 },
{ t: "s", v: "Completion status", s: Common.headerStyle2 },
{ t: "s", v: "Earned achievements", s: Common.headerStyle2 },
{ t: "s", v: "Total achievements", s: Common.headerStyle2 },
{ t: "s", v: "Percentage", s: Common.headerStyle2 },
{ t: "s", v: "APPID", s: Common.headerStyle2 }]

//AUTH
export let auth: RA.AuthObject;

export function setAuth(pAuth: RA.AuthObject) {
    auth = pAuth
}

/*************************************************** */
/*********** MAIN CALL *******************************/
/*************************************************** */
export function getRAPromise(raUsername: string, raApiKey: string): Promise<Map<string, RA.GameList>> {
    //Completed games
    const completedGamesPromise: Promise<RA.UserCompletedGames> = getUserCompletedGames();

    //GAME LIST
    const gameListPromise: Promise<Map<string, RA.GameList>> = getGameListPromise()

    //USER AWARDS
    const userAwardsPromise: Promise<RA.UserAwards> = getUserAwards()

    return Promise.all([completedGamesPromise, gameListPromise, userAwardsPromise]).then(val => {
        const completedGames: RA.UserCompletedGames = val[0];
        const gameListMap: Map<string, RA.GameList> = val[1];
        const userAwards: RA.UserAwards = val[2];
        return writeRASheet(completedGames, userAwards, gameListMap);
    });
}

/*************************************************** */
/*********** WRITE SHEET ******************************/
/*************************************************** */
function writeRASheet(completedGames: RA.UserCompletedGames, userAwards: RA.UserAwards, gameListMap: Map<string, RA.GameList>): Promise<Map<string, RA.GameList>> {
    console.log("Writing RA sheet...")
    //GAMES SHEET
    let gamesArray: any[][] = [raHeader];
    gameListMap.forEach((gameList, consoleName) => {
        for (let i = 0; i < gameList.length; i++) {
            const index: number = i + 2;
            const entity = gameList[i]
            const gameData: any[] = [{ t: "s", v: consoleName }, { t: "s", v: entity.title }];
            let status: Common.CompletionStatusData | undefined;
            //Cannot check for game id, we then take (console, title) as key
            if (userAwards.visibleUserAwards.some(award => award.awardType === "Mastery/Completion" && award.title === entity.title && award.consoleName === consoleName)) {
                status = Common.completionStatus.get("Mastered")
            }
            else if (userAwards.visibleUserAwards.some(award => award.awardType === "Game Beaten" && award.title === entity.title && award.consoleName === consoleName)) {
                status = Common.completionStatus.get("Beaten")
            }
            else if (completedGames.some(completedGame => completedGame.numAwarded > 0 && completedGame.gameId === entity.id)) {
                status = Common.completionStatus.get("Tried")
            }
            else {
                status = Common.completionStatus.get("Not played")
            }
            gameData.push({ v: status?.name, s: status?.style })
            let numAwarded: number | undefined;
            if (status?.name === "Mastered") {
                numAwarded = entity.numAchievements
            } else if (status?.name === "Not played") {
                numAwarded = 0;
            } else {
                const game: RA.UserCompletedGame | undefined = completedGames.find(game => game.consoleName === consoleName && game.title === entity.title)
                numAwarded = game?.numAwarded;
            }
            gameData.push({ t: "n", v: numAwarded })
            gameData.push({ t: "n", v: entity.numAchievements })
            gameData.push({ t: "n", f: "D" + index + "/E" + index, z: "0.00%" })
            gameData.push({ t: "n", v: entity.id })
            gamesArray.push(gameData)
        }
    });
    const gamesWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(gamesArray);
    gamesWs['!cols'] = raColumns
    XLSX.utils.book_append_sheet(Common.wb, gamesWs, "RAGames");


    return new Promise((resolve) => resolve(gameListMap));
}

export function getConsoleIds(): Promise<RA.ConsoleId[]> {
    return RA.getConsoleIds(auth).then(consoleIds => {
        //Remove consoles to ignore
        consolesToIgnore.forEach(toIgnore => {
            const toDelete: RA.ConsoleId | undefined = consoleIds.find(val => toIgnore === val.name);
            if (toDelete) {
                consoleIds.splice(consoleIds.indexOf(toDelete), 1);
            }
        });
        return new Promise((resolve) => resolve(consoleIds));
    })
}

export function getUserCompletedGames(): Promise<RA.UserCompletedGames> {
    return RA.getUserCompletedGames(auth, { userName: auth.userName })
}

export function getUserAwards(): Promise<RA.UserAwards> {
    return RA.getUserAwards(auth, { userName: auth.userName })
}

export function getGameListPromise(): Promise<Map<string, RA.GameList>> {
    const consoleDataListPromise: Promise<RA.ConsoleId[]> = getConsoleIds();
    return consoleDataListPromise.then(async consoleDataList => {
        let total: number = 0;
        const gameListMap: Map<string, RA.GameList> = new Map();
        // consoleDataList = [{ id: 1, name: "Mega Drive" }]
        for (let i = 0; i < consoleDataList.length; i++) {
            const consoleData: RA.ConsoleId = consoleDataList[i];
            console.log("GAME LIST : " + (i + 1) + "/" + consoleDataList.length);
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
            await Common.timer(500);
        }
        return new Promise(resolve => { resolve(gameListMap) });
    });
}

export async function getRecentGamesPromise(): Promise<RA.UserRecentlyPlayedGames> {
    return await RA.getUserRecentlyPlayedGames(auth, { userName: auth.userName, count: 50 });
}