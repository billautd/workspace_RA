import * as XLSX from "xlsx-js-style";
import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as RA from "@retroachievements/api"
import * as SheetService from "./mainSheetService"

const numberOfRandomGames: number = 5
const numberOfPlayingGames: number = 3

let fullscan: string = ""
let raUsername: string = ""
let raApiKey: string = ""
let steamId: string = ""
let steamKey: string = ""

//Parse parameters
process.argv.forEach((value, index) => {
    if (value.startsWith("fullscan")) {
        fullscan = value.split("=")[1]
    }
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
});
console.log("FULLSCAN = " + fullscan)
if (fullscan !== "ra" && fullscan !== "steam" && fullscan !== "all" && fullscan !== "none") {
    throw new Error("fullscan parameter is not correct. Should be ra, all, steam or none")
}
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
//Build authorization
CommonRA.setAuth(RA.buildAuthorization({ userName: raUsername, webApiKey: raApiKey }));


/**************************************** */
/**********        STEAM          ******* */
/**************************************** */
let promisesArray: Promise<any>[] = [];
promisesArray.push(Common.hasSteamScan(fullscan) ? CommonSteam.getSteamPromise(steamId, steamKey) : new Promise((resolve) => { resolve(undefined) }))

/**************************************** */
/******    RETRO ACHIEVEMENTS       ***** */
/**************************************** */
promisesArray.push(Common.hasRAScan(fullscan) ? CommonRA.getRAPromise(raUsername, raApiKey) : new Promise((resolve) => { resolve(undefined) }))

let existingWb: XLSX.WorkBook | undefined;
try {
    existingWb = XLSX.readFile("Achievements.xlsx", { cellStyles: true, cellNF: true })
} catch (e) {
    console.log("Cannot find existing achievements file")
}
//Promises array contains all promises that have to be parsed based on fullscan value
Promise.all(promisesArray).then(async val => {
    console.log("Writing main file...")

    //If no RA scan, get previous RA sheet
    if (!Common.hasRAScan(fullscan) && existingWb) {
        const existingRASheet: XLSX.WorkSheet = existingWb.Sheets["RAGames"]
        //Reparse style because it can only be done in pro
        let i: number = 2;
        let cell;
        while (cell = existingRASheet["C" + i]) {
            cell['s'] = Common.completionStatus.get(cell['v'])?.style
            i++
        }
        XLSX.utils.book_append_sheet(Common.wb, existingRASheet, "RAGames")
    }
    //If no Steam scan, get previous Steam sheet
    if (!Common.hasSteamScan(fullscan) && existingWb) {
        const existingSteamSheet: XLSX.WorkSheet = existingWb.Sheets["SteamGames"]
        //Reparse style because it can only be done in pro
        let i: number = 2;
        let cell;
        while (cell = existingSteamSheet["B" + i]) {
            cell['s'] = Common.completionStatus.get(cell['v'])?.style
            i++
        }
        XLSX.utils.book_append_sheet(Common.wb, existingSteamSheet, "SteamGames")
    }

    const consoleDataSheet: XLSX.WorkSheet = await SheetService.createConsoleDataSheet();
    const completionDataSheet: XLSX.WorkSheet = SheetService.createCompletionDataSheet();

    XLSX.utils.book_append_sheet(Common.wb, consoleDataSheet, "ConsoleData")
    XLSX.utils.book_append_sheet(Common.wb, completionDataSheet, "CompletionData")

    XLSX.writeFile(Common.wb, "Achievements.xlsx");
})