import * as XLSX from "xlsx-js-style";
import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as RA from "@retroachievements/api"

// const numberOfRandomGames: number = 5

let fullscan: string = "all"
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
if (fullscan !== "ra" && fullscan !== "steam" && fullscan !== "all") {
    throw new Error("fullscan parameter is not correct. Should be ra, all or steam")
}


/**************************************** */
/**********        STEAM          ******* */
/**************************************** */
let promisesArray: Promise<any>[] = [];
promisesArray.push(Common.hasSteamScan(fullscan) ? CommonSteam.getSteamPromise(steamId, steamKey) : new Promise((resolve) => { resolve(undefined) }))

/**************************************** */
/******    RETRO ACHIEVEMENTS       ***** */
/**************************************** */
promisesArray.push(Common.hasRAScan(fullscan) ? CommonRA.getRAPromise(raUsername, raApiKey) : new Promise((resolve) => { resolve(undefined) }))

Promise.all(promisesArray).then(async val => {
    console.log("Writing main file...")
    let existingWb: XLSX.WorkBook | undefined;
    try {
        existingWb = XLSX.readFile("Achievements.xlsx", { cellStyles: true, cellNF: true })
    } catch (e) {
        console.log("Cannot find existing achievements file")
    }

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
    const consoleDataSheet: XLSX.WorkSheet = await createConsoleDataSheet();
    const completionDataSheet: XLSX.WorkSheet = createCompletionDataSheet();
    //TODO
    // const randomGamesSheet: XLSX.WorkSheet = createRandomGamesSheet();

    XLSX.utils.book_append_sheet(Common.wb, consoleDataSheet, "ConsoleData")
    XLSX.utils.book_append_sheet(Common.wb, completionDataSheet, "CompletionData")
    //TODO
    // XLSX.utils.book_append_sheet(Common.wb, randomGamesSheet, "RandomGames")

    XLSX.writeFile(Common.wb, "Achievements.xlsx");
})

async function createConsoleDataSheet(): Promise<XLSX.WorkSheet> {
    //CONSOLE DATA SHEET
    let consoleDataArray: any[][] = [[{ t: "s", v: "Console" }, { t: "s", v: "Number of games" }, { t: "s", v: "Achievements" }, { t: "s", v: "Ach. total " }, { t: "n", f: "SUM(C2:C1000)" }, { t: "s", v: "Games total" }, { t: "n", f: "SUM(B2:B1000)" }]];
    const consoleIds: RA.ConsoleId[] = await CommonRA.getConsoleIds(CommonRA.auth)
    for (let i = 0; i < consoleIds.length; i++) {
        const consoleId: RA.ConsoleId = consoleIds[i];
        consoleDataArray.push([{ t: "s", v: consoleId.name }, { t: "n", f: "COUNTIF(RAGames!A2:A20000, A" + (i + 2) }, { t: "n", f: "SUMIF(RAGames!A2:A20000, A" + (i + 2) + ", RAGames!E2:E20000)" }])
    }
    consoleDataArray.push([{ t: "s", v: "Steam" }, { t: "n", f: "COUNTA(SteamGames!A2:A20000)" }, { t: "n", f: "SUM(SteamGames!D2:D20000" }])
    const consoleDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(consoleDataArray);
    consoleDataWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    return new Promise((resolve) => resolve(consoleDataWs));
}

function createCompletionDataSheet(): XLSX.WorkSheet {
    //COMPLETION DATA SHEET
    let completionDataArray: any[][] = []
    //Setup RA + Steam data
    completionDataArray[0] = []
    completionDataArray[0][0] = { t: "s", "v": "RA" };
    completionDataArray[0][5] = { t: "s", "v": "Steam" };
    completionDataArray[1] = [{ t: "s", v: "Status" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B3:B" + (2 + Common.completionStatusLength) + ")" },
    {},
    { t: "s", v: "Status" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(G3:G" + (2 + Common.completionStatusLength) + ")" }
    ];
    let i = 0;
    //Setup global data
    completionDataArray[3 + Common.completionStatusLength] = [{ t: "s", v: "Total" }]
    completionDataArray[4 + Common.completionStatusLength] = [{ t: "s", v: "Status" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B" + (6 + Common.completionStatusLength) + ":B" + (10 + Common.completionStatusLength) + ")" }]
    //RA + Steam data
    Common.completionStatus.forEach(completionStatus => {
        const raCell = {
            t: "n",
            f: "COUNTIF(RAGames!C2:C20000, A" + (i + 3)
        }
        const steamCell = {
            t: "n",
            f: "COUNTIF(SteamGames!B2:B20000, F" + (i + 3)
        }
        const totalCell = {
            t: "n",
            f: "SUM(B" + (i + 3) + ", G" + (i + 3)
        }
        completionDataArray[i + 2] = [{ t: "s", v: completionStatus.name, s: completionStatus.style }, raCell, { t: "n", f: "B" + (i + 3) + "/D2", z: "0.00%" }, {}, {}, { t: "s", v: completionStatus.name, s: completionStatus.style }, steamCell, { t: "n", f: "G" + (i + 3) + "/I2", z: "0.00%" }]
        completionDataArray[i + 5 + Common.completionStatusLength] = [{ t: "s", v: completionStatus.name, s: completionStatus.style }, totalCell, { t: "n", f: "B" + (i + 6 + Common.completionStatusLength) + "/D" + (5 + Common.completionStatusLength), z: "0.00%" }]
        i++;
    });

    //Setup achievements data
    completionDataArray[10 + 2 * Common.completionStatusLength] = []
    completionDataArray[10 + 2 * Common.completionStatusLength][0] = { t: "s", v: "RA Achievements" }
    completionDataArray[10 + 2 * Common.completionStatusLength][5] = { t: "s", v: "Steam Achievements" }
    completionDataArray[11 + 2 * Common.completionStatusLength] = [{ t: "s", v: "Earned" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(RAGames!E2:E20000)" }, {}, {}, { t: "s", v: "Earned" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(SteamGames!D2:D20000)" }]
    completionDataArray[12 + 2 * Common.completionStatusLength] = [{ t: "n", f: "SUM(RAGames!D2:D20000)" }, { t: "n", f: "A" + (13 + 2 * Common.completionStatusLength) + "/C" + (12 + 2 * Common.completionStatusLength), z: "0.00%" },
    {}, {}, {},
    { t: "n", f: "SUM(SteamGames!C2:C20000)" }, { t: "n", f: "F" + (13 + 2 * Common.completionStatusLength) + "/H" + (12 + 2 * Common.completionStatusLength), z: "0.00%" }
    ]

    //Add sheet
    const completionDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(completionDataArray);
    completionDataWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    return completionDataWs;
}

//TODO
// function createRandomGamesSheet(): XLSX.WorkSheet {

// }