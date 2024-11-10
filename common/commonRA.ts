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
export function getRAPromise(raUsername: string, raApiKey: string): Promise<Map<RA.ConsoleId, RA.GameList>> {
    //Completed games
    const completedGamesPromise: Promise<RA.UserCompletedGames> = getUserCompletedGames();

    //GAME LIST
    const gameListPromise: Promise<Map<RA.ConsoleId, RA.GameList>> = getGameListPromise()

    //USER AWARDS
    const userAwardsPromise: Promise<RA.UserAwards> = getUserAwards()

    return Promise.all([completedGamesPromise, gameListPromise, userAwardsPromise]).then(val => {
        const completedGames: RA.UserCompletedGames = val[0];
        const gameListMap: Map<RA.ConsoleId, RA.GameList> = val[1];
        const userAwards: RA.UserAwards = val[2];
        return writeRASheet(completedGames, userAwards, gameListMap);
    });
}

/*************************************************** */
/*********** WRITE SHEET ******************************/
/*************************************************** */
function writeRASheet(completedGames: RA.UserCompletedGames, userAwards: RA.UserAwards, gameListMap: Map<RA.ConsoleId, RA.GameList>): Promise<Map<RA.ConsoleId, RA.GameList>> {
    console.log("Writing RA sheet...")
    //GAMES SHEET
    let gamesArray: any[][] = [raHeader];
    let consoleIndex = 1;
    let gameIndex = 1;
    gameListMap.forEach((gameList, consoleData) => {
        for (let i = 0; i < gameList.length; i++) {
            const entity = gameList[i]
            const gameData: any[] = [{ t: "s", v: consoleData.name }, { t: "s", v: entity.title }];
            let status: Common.CompletionStatusData | undefined;

            const game: RA.UserCompletedGame | undefined = completedGames.find(game => game.consoleName === consoleData.name && game.title === entity.title)
            let numAwarded: number | undefined = game === undefined ? 0 : game.numAwarded;

            //Cannot check for game id, we then take (console, title) as key
            if (userAwards.visibleUserAwards.some(award => award.awardType === "Mastery/Completion" && award.title === entity.title && award.consoleName === consoleData.name)) {
                if(numAwarded == entity.numAchievements){
                    status = Common.completionStatus.get("Mastered")
                }else{
                    status = Common.completionStatus.get("Beaten")
                }
            }
            else if (userAwards.visibleUserAwards.some(award => award.awardType === "Game Beaten" && award.title === entity.title && award.consoleName === consoleData.name)) {
                status = Common.completionStatus.get("Beaten")
            }
            else if (completedGames.some(completedGame => completedGame.numAwarded > 0 && completedGame.gameId === entity.id)) {
                status = Common.completionStatus.get("Tried")
            }
            else {
                status = Common.completionStatus.get("Not played")
            }

            gameData.push({ v: status?.name, s: status?.style })
            gameData.push({ t: "n", v: numAwarded })
            gameData.push({ t: "n", v: entity.numAchievements })
            gameData.push({ t: "n", f: "D" + (gameIndex+1) + "/E" + (gameIndex+1), z: "0.00%" })
            gameData.push({ t: "n", v: entity.id })
            gamesArray.push(gameData);

            console.log("PROCESSING " + consoleData.name + " " + (i + 1) + "/" + gameList.length + " : " + entity.title + " (" + entity.id + ") -> " + status?.name + " (" + numAwarded + "/" + entity.numAchievements +")");
            gameIndex++;
        }
        console.log("")
        consoleIndex++;
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

export function getGameListPromise(): Promise<Map<RA.ConsoleId, RA.GameList>> {
    const consoleDataListPromise: Promise<RA.ConsoleId[]> = getConsoleIds();
    let total:number = 0;
    return consoleDataListPromise.then(async consoleDataList => {
        const gameListMap: Map<RA.ConsoleId, RA.GameList> = new Map();
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
                console.log("TOTAL : " + total + "\n\n");
                gameListMap.set(consoleData, gameList);
            });
            await Common.timer(500);
        }
        return new Promise(resolve => { resolve(gameListMap) });
    });
}

export function getAchievementsForGame(gameId: number, getRandom: boolean):void{
    RA.getGameInfoAndUserProgress(auth, {
        gameId:gameId,
        userName:auth.userName
    }).then(progress => {
        let earnedAchs: RA.GameExtendedAchievementEntityWithUserProgress[] = [];
        let notEarnedAchs: RA.GameExtendedAchievementEntityWithUserProgress[] = [];
        Object.values(progress.achievements).forEach(ach => {
            if(ach.dateEarned){
                earnedAchs.push(ach);
            }else{
                notEarnedAchs.push(ach);
            }
        })
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
    })
}