import * as CommonRA from "./common/commonRA"
import * as CommonSteam from "./common/commonSteam"
import * as CommonPS3 from "./common/commonPS3"
import * as CommonPSVita from "./common/commonPSVita"
import * as Common from "./common/common";
import * as XLSX from "xlsx-js-style";

export interface LocalGameData {
    name: string,
    completionStatus: string
}

const nameColumn:string = "A";
const completionStatusColumn:string = "B";
const platformColumn:string = "C";
const sourceColumn:string = "D";

const steamSource:string= "Steam";
const raSource:string= "RetroAchievements";
const standaloneSource:string = "Standalone";
const ps3Platform:string = "PlayStation 3";
const psVitaPlatform:string = "PlayStation Vita";

export const raDataMap: Map<string, LocalGameData[]> = new Map();
export const steamDataList: LocalGameData[] = [];
export const ps3DataList: LocalGameData[] = [];
export const psVitaDataList: LocalGameData[] = [];

export function compareData(filepath:string){
    let workbook;
    try{
         workbook = XLSX.readFile(filepath, {raw:true});
        }
        catch(err){
            Common.logger.error(err);
            return;
        }
        const sheet:XLSX.WorkSheet = workbook.Sheets["Sheet1"];
        let i:number = 1;
        while(sheet[nameColumn+i]){
            const name:string = sheet[nameColumn+i].v;
            const completionStatus:string = sheet[completionStatusColumn+i].v;
            const platform:string = sheet[platformColumn+i].v;
            const source:string = sheet[sourceColumn+i].v;
            const data:LocalGameData = {name:name, completionStatus:completionStatus};
        if(source === steamSource){
            steamDataList.push(data)
        }else if(source === standaloneSource){
            if(platform === ps3Platform){
                ps3DataList.push(data)
            }else if(platform === psVitaPlatform){
                psVitaDataList.push(data)
            }
        }else if(source === raSource){
            if(!raDataMap.get(platform)){
                raDataMap.set(platform, []);
            }
            raDataMap.get(platform)?.push(data)
        }
        i++;
        Common.logger.debug(data.name + " for " + source + ", Status : " + data.completionStatus);
    }
    CommonRA.compareRAData(raDataMap);
    CommonSteam.compareSteamData(steamDataList);
    CommonPS3.comparePS3Data(ps3DataList);
    CommonPSVita.comparePSVitaData(psVitaDataList);
}

export function compareCompletionStatus(playniteStatus:string, externalStatus:string):boolean{
    switch(playniteStatus){
        //Ignore games currently playing
        case "1 - Playing":
            return true;
        case "2 - Not Played":
            return externalStatus == "Not played";
        case "3 - Tried":
            return externalStatus == "Tried";
        case "4 - Beaten":
            return externalStatus == "Beaten";
        case "5 - Mastered":
            return externalStatus == "Mastered";
        case "6 - No Achievements & Not Interested":
            return externalStatus == "No achievements";
        //Ignore cannot play because they're mostly software
        case "7 - Cannot Play":
            return true;
        default:
            return false;
    }
}