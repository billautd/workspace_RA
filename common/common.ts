import * as XLSX from "xlsx-js-style";
import { OwnedGame } from "./commonSteam";

export function timer(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
}

export interface CompletionStatusData {
    name: string,
    style: any
}

export const completionStatus: Map<string, CompletionStatusData> = new Map([
    ["Not played", { name: "Not played", style: { fill: { fgColor: { rgb: "AAAAAA" } } } }],
    ["Tried", { name: "Tried", style: { fill: { fgColor: { rgb: "7777FF" } } } }],
    ["Beaten", { name: "Beaten", style: { fill: { fgColor: { rgb: "FFFF22" } } } }],
    ["Mastered", { name: "Mastered", style: { fill: { fgColor: { rgb: "22FF22" } } } }],
    ["No achievements", { name: "No achievements", style: { fill: { fgColor: { rgb: "444444" } } } }],
])

export const headerStyle1 = { font: { bold: true, sz: 13, color: { rgb: "990099" }, underline: true } };
export const headerStyle2 = { font: { bold: true, sz: 11, underline: true } };



export const completionStatusLength: number = completionStatus.size;

//Workbook
export const wb: XLSX.WorkBook = XLSX.utils.book_new();

export function hasSteamScan(fullscan: string) {
    return fullscan === "all" || fullscan === "steam"
}

export function hasRAScan(fullscan: string) {
    return fullscan === "all" || fullscan === "ra"
}
