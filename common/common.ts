import * as XLSX from "xlsx-js-style";
import {Logger} from "@tsed/logger";
import "@tsed/logger-file";

//Setup logger
export const logger:Logger = new Logger(); 
logger.appenders.set("info", {
    type:"file",
    filename:"logs/info.log",
    levels:["error", "fatal", "warn", "info"],
    pattern: ".yyyy-MM-dd_hh:mm:ss"
});
logger.appenders.set("debug", {
    type:"file",
    filename:"logs/debug.log",
    levels:["error", "fatal", "warn", "info", "debug"],
    pattern: ".yyyy-MM-dd_hh:mm:ss"
});

export function timer(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

export interface CompletionStatusData {
    name: string,
    style: any
}

export enum CompletionStatusType{
    NOT_PLAYED,
    TRIED,
    BEATEN,
    MASTERED,
    NO_ACHIEVEMENTS,
    CANNOT_PLAY
}

export const completionStatus: Map<CompletionStatusType, CompletionStatusData> = new Map([
    [CompletionStatusType.NOT_PLAYED, { name: "Not played", style: { fill: { fgColor: { rgb: "AAAAAA" } } } }],
    [CompletionStatusType.TRIED, { name: "Tried", style: { fill: { fgColor: { rgb: "7777FF" } } } }],
    [CompletionStatusType.BEATEN, { name: "Beaten", style: { fill: { fgColor: { rgb: "FFFF22" } } } }],
    [CompletionStatusType.MASTERED, { name: "Mastered", style: { fill: { fgColor: { rgb: "22FF22" } } } }],
    [CompletionStatusType.NO_ACHIEVEMENTS, { name: "No achievements", style: { fill: { fgColor: { rgb: "444444" } } } }]
])

export const headerStyle1 = { font: { bold: true, sz: 13, color: { rgb: "990099" }, underline: true } };
export const headerStyle2 = { font: { bold: true, sz: 11, underline: true } };

export const completionStatusLength: number = completionStatus.size;

//Workbook
export const wb: XLSX.WorkBook = XLSX.utils.book_new();