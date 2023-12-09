import * as XLSX from "xlsx-js-style";
import * as CommonSteam from "../common/commonSteam"
import * as Common from "../common/common"

const steamIdValue: string = "76561198338570606";
const steamApiKey: string = "6E8852492618E7EA2A09D98144F2C9EE"



//MAIN
const url: string = "http://api.steampowered.com/";
//METHODS
const getUserStatesForGame: string = "ISteamUserStats/GetPlayerAchievements/v0001/?";
const getOwnedGames: string = "IPlayerService/GetOwnedGames/v0001/?";
//PARAMS
const appId: string = "appId="
const key: string = "key=" + steamApiKey + "&";
const steamId: string = "steamid=" + steamIdValue + "&";
const format: string = "format=json&"
const includeFreeGames: string = "include_played_free_games=true&"
const includeAppInfo: string = "include_appinfo=true&"

const requestOwnedGames: string = url + getOwnedGames + key + steamId + format + includeFreeGames + includeAppInfo;
// console.log(requestOwnedGames)

fetch(requestOwnedGames).then(response => {
    return response.json()
}).then(async json => {
    const ownedGames: CommonSteam.OwnedGamesResponse = CommonSteam.parseJsonToOwnedGamesResponse(json)
    // const ownedGames: CommonSteam.OwnedGamesResponse =
    //     [{
    //         name: "Half-Life",
    //         appId: 70,
    //         achievements: []
    //     }, {
    //         name: "Day of Defeat:Source",
    //         appId: 300,
    //         achievements: []
    //     }, {
    //         name: "The Messenger",
    //         appId: 764790,
    //         achievements: []
    //     }, {
    //         name: "Celeste",
    //         appId: 504230,
    //         achievements: []
    //     }
    //     ];
    for (let i = 0; i < 40; i++) {
        const ownedGame: CommonSteam.OwnedGame = ownedGames[i];
        console.log("Processing " + (i + 1) + "/" + ownedGames.length + " => " + ownedGame.name)
        requestGameData(ownedGame.appId).then(achievementDataResponse => {
            achievementDataResponse.json().then((achievementData: any) => {
                if (achievementDataResponse.ok) {
                    CommonSteam.parseGameAchievementData(achievementData.playerstats.achievements, ownedGame)
                    console.log(ownedGame.name + ", Achievements : " + ownedGame.achievements.length + "\n")
                } else {
                    console.log(ownedGame.name + " : ERROR " + achievementDataResponse.status + "... Setting game as 'No achievements'\n")
                }
            })
        });
        await Common.timer(500);
    }
    writeFile(ownedGames);
});

function writeFile(ownedGames: CommonSteam.OwnedGamesResponse): void {
    const wb: XLSX.WorkBook = XLSX.readFile("../Achievements.xlsx")
    let gamesArray = [[{ t: "s", v: "Name" }, { t: "s", v: "Completion status" }]]
    for (let ownedGame of ownedGames) {
        console.log(ownedGame)
        const gameDataArray = [{ t: "s", v: ownedGame.name }]
        if (ownedGame.achievements.length === 0) {
            gameDataArray.push(Common.completionStatus[4])
        }
        else if (ownedGame.achievements.every((a) => a.achieved)) {
            gameDataArray.push(Common.completionStatus[3])
        }
        else if (ownedGame.achievements.some((a) => a.achieved)) {
            gameDataArray.push(Common.completionStatus[1])
        } else {
            gameDataArray.push(Common.completionStatus[0])
        }
        gamesArray.push(gameDataArray)
    }
    const gamesWs = XLSX.utils.aoa_to_sheet(gamesArray)
    XLSX.utils.book_append_sheet(wb, gamesWs, "Steam Games")

    //Add steam data to existing RA data
    // const consoleDataWs = wb.Sheets["Console data"]

    //Add steam completion status to existing RA completion status
    // const completionDataWs = wb.Sheets("Completion data")

    XLSX.writeFile(wb, "../All_Achievements.xlsx");
}

async function requestGameData(appIdValue: number): Promise<any> {
    return fetch(url + getUserStatesForGame + appId + appIdValue + "&" + key + steamId)
}