import * as XLSX from "xlsx-js-style";
import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as CommonPS3 from "./common/commonPS3"
import * as CommonPSVita from "./common/commonPSVita"
import * as RA from "@retroachievements/api"
import * as SheetService from "./mainSheetService"
import * as CompareService from "./compareService"

let raUsername: string = ""
let raApiKey: string = ""
let steamId: string = ""
let steamKey: string = ""
let compareFile: string = ""

//Parse parameters
process.argv.forEach((value, index) => {
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
    if(value.startsWith("compareFile")){
        compareFile = value.split("=")[1]
    }
});
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
if(compareFile === ""){
    Common.logger.error("No compare file given")
}
//Build authorization
CommonRA.setAuth(RA.buildAuthorization({ userName: raUsername, webApiKey: raApiKey }));


let promisesArray: Promise<any>[] = [];

promisesArray.push(CommonSteam.getSteamPromise(steamId, steamKey)); //Steam
promisesArray.push(CommonRA.getRAPromise(raUsername, raApiKey)); //RA
promisesArray.push(CommonPS3.getPS3Promise()); //PS3
promisesArray.push(CommonPSVita.getPSVitaPromise()); //PSVita



//Promises array contains all promises that have to be parsed based on fullscan value
Promise.all(promisesArray).then(async val => {
    Common.logger.info("Writing main file...")

    const consoleDataSheet: XLSX.WorkSheet = await SheetService.createConsoleDataSheet();
    const completionDataSheet: XLSX.WorkSheet = SheetService.createCompletionDataSheet();

    XLSX.utils.book_append_sheet(Common.wb, consoleDataSheet, "ConsoleData")
    XLSX.utils.book_append_sheet(Common.wb, completionDataSheet, "CompletionData")

    XLSX.writeFile(Common.wb, "Files/Achievements.xlsx");
    if(compareFile !== ""){
        CompareService.compareData(compareFile);
    }
})