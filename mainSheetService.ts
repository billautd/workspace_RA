import * as XLSX from "xlsx-js-style";
import * as Common from "./common/common"
import * as CommonSteam from "./common/commonSteam"
import * as CommonRA from "./common/commonRA"
import * as RA from "@retroachievements/api"

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
    
    //List of RA consoles + number of games and number of achievements
    for (let i = 0; i < CommonRA.consoleList.length; i++) {
        const consoleId: RA.ConsoleId = CommonRA.consoleList[i];
        consoleDataArray.push([{ t: "s", v: consoleId.name }, { t: "n", f: "COUNTIF(RAGames!A2:A20000, A" + (i + 2) }, { t: "n", f: "SUMIF(RAGames!A2:A20000, A" + (i + 2) + ", RAGames!E2:E20000)" }])
    }
    //Steam + number of games and number of achievements
    consoleDataArray.push([{ t: "s", v: "Steam" }, { t: "n", f: "COUNTA(SteamGames!A2:A20000)" }, { t: "n", f: "SUM(SteamGames!D2:D20000" }])
    
    //PS3 + number of games
    consoleDataArray.push([{ t: "s", v: "PlayStation 3" }, { t: "n", f: "COUNTA(PS3Games!A2:A20000)" }, { t: "n", f: "0" }])

    //PS3 + number of games
    consoleDataArray.push([{ t: "s", v: "PlayStation Vita" }, { t: "n", f: "COUNTA(PSVitaGames!A2:A20000)" }, { t: "n", f: "0" }])

    const consoleDataWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(consoleDataArray);
    consoleDataWs['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    return new Promise((resolve) => resolve(consoleDataWs));
}

export function createCompletionDataSheet(): XLSX.WorkSheet {
    console.log("Creating completion data sheet")
    //COMPLETION DATA SHEET
    let completionDataArray: any[][] = []
    //Setup RA + Steam data + PS3 data + PSVita data
    completionDataArray[0] = []
    completionDataArray[0][0] = { t: "s", "v": "RA", s: Common.headerStyle1 };
    completionDataArray[0][5] = { t: "s", "v": "Steam", s: Common.headerStyle1 };
    completionDataArray[0][10] = { t: "s", "v": "PS3", s: Common.headerStyle1 };
    completionDataArray[0][15] = { t: "s", "v": "PSVita", s: Common.headerStyle1 };
    completionDataArray[1] = [
    { t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(B3:B" + (2 + Common.completionStatusLength) + ")" },
    {},
    { t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(G3:G" + (2 + Common.completionStatusLength) + ")" },
    {},
    { t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(L3:L" + (2 + Common.completionStatusLength) + ")" },
    {},
    { t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(Q3:Q" + (2 + Common.completionStatusLength) + ")" }
    ];
    let i = 0;
    //Setup global data
    completionDataArray[3 + Common.completionStatusLength] = [{ t: "s", v: "Total", s: Common.headerStyle1 }]
    completionDataArray[4 + Common.completionStatusLength] = [{ t: "s", v: "Status", s: Common.headerStyle2 },
    { t: "s", v: "Number of games", s: Common.headerStyle2 },
    { t: "s", v: "Total", s: Common.headerStyle2 },
    { t: "n", f: "SUM(B" + (6 + Common.completionStatusLength) + ":B" + (10 + Common.completionStatusLength) + ")" }]
    //RA + Steam data + PS3 + PSVita
    Common.completionStatus.forEach(completionStatus => {
        const raCell = {
            t: "n",
            f: "COUNTIF(RAGames!C2:C20000, A" + (i + 3)
        }
        const steamCell = {
            t: "n",
            f: "COUNTIF(SteamGames!B2:B20000, F" + (i + 3)
        }
        const ps3Cell = {
            t: "n",
            f: "COUNTIF(PS3Games!B2:B20000, F" + (i + 3)
        }
        const psVitaCell = {
            t: "n",
            f: "COUNTIF(PSVitaGames!B2:B20000, F" + (i + 3)
        }
        const totalCell = {
            t: "n",
            f: "SUM(B" + (i + 3) + ", G" + (i + 3) + ", L" + (i + 3) + ", Q" + (i + 3)
        }
        completionDataArray[i + 2] = [{ t: "s", v: completionStatus.name, s: completionStatus.style }, raCell, { t: "n", f: "B" + (i + 3) + "/D2", z: "0.00%" }, {}, {},
         { t: "s", v: completionStatus.name, s: completionStatus.style }, steamCell, { t: "n", f: "G" + (i + 3) + "/I2", z: "0.00%" }, {}, {},
         { t: "s", v: completionStatus.name, s: completionStatus.style }, ps3Cell, { t: "n", f: "L" + (i + 3) + "/N2", z: "0.00%" }, {}, {},
         { t: "s", v: completionStatus.name, s: completionStatus.style }, psVitaCell, { t: "n", f: "Q" + (i + 3) + "/S2", z: "0.00%" }, {}, {},
        ]
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
    completionDataWs['!cols'] = [
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 },
        { wch:20 }
    ];
    return completionDataWs;
}