import * as XLSX from "xlsx-js-style";
import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as RA from "@retroachievements/api"

const numberOfRandomGames: number = 5
const numberOfPlayingGames: number = 3

export async function createConsoleDataSheet(): Promise<XLSX.WorkSheet> {
    //CONSOLE DATA SHEET
    console.log("Creating console data sheet")
    let consoleDataArray: any[][] = [[{ t: "s", v: "Console", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Achievements", s: Common.headerStyle2 },
    { t: "s", v: "Ach. total ", s: Common.headerStyle2 },
    { t: "n", f: "SUM(C2:C1000)" },
    { t: "s", v: "Games total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(B2:B1000)" }]];
    const consoleIds: RA.ConsoleId[] = await CommonRA.getConsoleIds()
    //List of RA consoles + number of games and number of achievements
    for (let i = 0; i < consoleIds.length; i++) {
        const consoleId: RA.ConsoleId = consoleIds[i];
        consoleDataArray.push([{ t: "s", v: consoleId.name }, { t: "n", f: "COUNTIF(RAGames!A2:A20000, A" + (i + 2) }, { t: "n", f: "SUMIF(RAGames!A2:A20000, A" + (i + 2) + ", RAGames!E2:E20000)" }])
    }
    //Steam + number of games and number of achievements
    consoleDataArray.push([{ t: "s", v: "Steam" }, { t: "n", f: "COUNTA(SteamGames!A2:A20000)" }, { t: "n", f: "SUM(SteamGames!D2:D20000" }])
    const consoleDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(consoleDataArray);
    consoleDataWs['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    return new Promise((resolve) => resolve(consoleDataWs));
}

export function createCompletionDataSheet(): XLSX.WorkSheet {
    console.log("Creating completion data sheet")
    //COMPLETION DATA SHEET
    let completionDataArray: any[][] = []
    //Setup RA + Steam data
    completionDataArray[0] = []
    completionDataArray[0][0] = { t: "s", "v": "RA", s: Common.headerStyle1 };
    completionDataArray[0][5] = { t: "s", "v": "Steam", s: Common.headerStyle1 };
    completionDataArray[1] = [{ t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(B3:B" + (2 + Common.completionStatusLength) + ")" },
    {},
    { t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(G3:G" + (2 + Common.completionStatusLength) + ")" }
    ];
    let i = 0;
    //Setup global data
    completionDataArray[3 + Common.completionStatusLength] = [{ t: "s", v: "Total", s: Common.headerStyle1 }]
    completionDataArray[4 + Common.completionStatusLength] = [{ t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(B" + (6 + Common.completionStatusLength) + ":B" + (10 + Common.completionStatusLength) + ")" }]
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
    completionDataArray[10 + 2 * Common.completionStatusLength][0] = { t: "s", v: "RA Achievements", s: Common.headerStyle1 }
    completionDataArray[10 + 2 * Common.completionStatusLength][5] = { t: "s", v: "Steam Achievements", s: Common.headerStyle1 }
    completionDataArray[11 + 2 * Common.completionStatusLength] = [{ t: "s", v: "Earned", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(RAGames!E2:E20000)" },
    {}, {},
    { t: "s", v: "Earned", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(SteamGames!D2:D20000)" }]
    completionDataArray[12 + 2 * Common.completionStatusLength] = [{ t: "n", f: "SUM(RAGames!D2:D20000)" }, { t: "n", f: "A" + (13 + 2 * Common.completionStatusLength) + "/C" + (12 + 2 * Common.completionStatusLength), z: "0.00%" },
    {}, {}, {},
    { t: "n", f: "SUM(SteamGames!C2:C20000)" }, { t: "n", f: "F" + (13 + 2 * Common.completionStatusLength) + "/H" + (12 + 2 * Common.completionStatusLength), z: "0.00%" }
    ]

    //Add sheet
    const completionDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(completionDataArray);
    completionDataWs['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }]
    return completionDataWs;
}

export function createRandomGamesSheet(): XLSX.WorkSheet {
    console.log("Creating random data sheet")
    let randomGamesArray: any[][] = []
    randomGamesArray[0] = [{ t: "s", v: "RA", s: Common.headerStyle1 }]
    randomGamesArray[1] = [{ t: "s", v: "Index", s: Common.headerStyle2 }].concat(CommonRA.raHeader)
    randomGamesArray[3 + numberOfRandomGames] = [{ t: "s", v: "Steam", s: Common.headerStyle1 }]
    randomGamesArray[4 + numberOfRandomGames] = [{ t: "s", v: "Index", s: Common.headerStyle2 }, { t: "s", v: "Console", s: Common.headerStyle2 }].concat(CommonSteam.steamHeader)

    //Lines for random games
    for (let i = 0; i < numberOfRandomGames; i++) {
        //RA
        const indexRA: number = 2 + i
        randomGamesArray[indexRA] = [{ t: "n", f: "RANDBETWEEN(1,VALUE(CompletionData!D2))" }].concat(getRandomRARow(indexRA + 1))

        //Steam
        const indexSteam: number = 5 + numberOfRandomGames + i;
        randomGamesArray[indexSteam] = [{ t: "n", f: "RANDBETWEEN(1,VALUE(CompletionData!I2))" }].concat(getRandomSteamRow(indexSteam + 1))
    }

    //Lines for playing games
    randomGamesArray[6 + 2 * numberOfRandomGames] = [{ t: "s", v: "Playing", s: Common.headerStyle1 }]
    randomGamesArray[7 + 2 * numberOfRandomGames] = [{ t: "s", v: "RA", s: Common.headerStyle1 }]
    randomGamesArray[8 + 2 * numberOfRandomGames + numberOfPlayingGames] = [{ t: "s", v: "Steam", s: Common.headerStyle1 }]
    for (let i = 0; i < numberOfPlayingGames; i++) {
        //RA
        const indexRA: number = 8 + 2 * numberOfRandomGames + i;
        randomGamesArray[indexRA] = [{}].concat(getRandomRARow(indexRA + 1))

        //Steam
        const indexSteam: number = 9 + 2 * numberOfRandomGames + numberOfPlayingGames + i;
        randomGamesArray[indexSteam] = [{}].concat(getRandomSteamRow(indexSteam + 1))
    }


    //Add sheet
    const randomGamesWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(randomGamesArray);
    randomGamesWs['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    return randomGamesWs;
}

function getRandomRARow(i: number): any[] {
    return [
        { t: "s", f: "INDEX(RAGames!A2:A20000, A" + i },
        { t: "s", f: "INDEX(RAGames!B2:B20000, A" + i },
        { t: "s", f: "INDEX(RAGames!C2:C20000, A" + i },
        { t: "s", f: "INDEX(RAGames!D2:D20000, A" + i },
        { t: "s", f: "INDEX(RAGames!E2:E20000, A" + i },
        { t: "s", f: "INDEX(RAGames!F2:F20000, A" + i },
        { t: "s", f: "INDEX(RAGames!G2:G20000, A" + i }]
}

function getRandomSteamRow(i: number): any[] {
    return [
        { t: "s", v: "Steam" },
        { t: "s", f: "INDEX(SteamGames!A2:A20000, A" + i },
        { t: "s", f: "INDEX(SteamGames!B2:B20000, A" + i },
        { t: "s", f: "INDEX(SteamGames!C2:C20000, A" + i },
        { t: "s", f: "INDEX(SteamGames!D2:D20000, A" + i },
        { t: "s", f: "INDEX(SteamGames!E2:E20000, A" + i },
        { t: "s", f: "INDEX(SteamGames!F2:F20000, A" + i }]
}