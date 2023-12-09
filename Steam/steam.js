"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var XLSX = require("xlsx-js-style");
var CommonSteam = require("../common/commonSteam");
var Common = require("../common/common");
var steamIdValue = "76561198338570606";
var steamApiKey = "6E8852492618E7EA2A09D98144F2C9EE";
//MAIN
var url = "http://api.steampowered.com/";
//METHODS
var getUserStatesForGame = "ISteamUserStats/GetPlayerAchievements/v0001/?";
var getOwnedGames = "IPlayerService/GetOwnedGames/v0001/?";
//PARAMS
var appId = "appId=";
var key = "key=" + steamApiKey + "&";
var steamId = "steamid=" + steamIdValue + "&";
var format = "format=json&";
var includeFreeGames = "include_played_free_games=true&";
var includeAppInfo = "include_appinfo=true&";
var requestOwnedGames = url + getOwnedGames + key + steamId + format + includeFreeGames + includeAppInfo;
// console.log(requestOwnedGames)
fetch(requestOwnedGames).then(function (response) {
    return response.json();
}).then(function (json) { return __awaiter(void 0, void 0, void 0, function () {
    var ownedGames, _loop_1, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ownedGames = CommonSteam.parseJsonToOwnedGamesResponse(json);
                _loop_1 = function (i) {
                    var ownedGame;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                ownedGame = ownedGames[i];
                                console.log("Processing " + (i + 1) + "/" + ownedGames.length + " => " + ownedGame.name);
                                requestGameData(ownedGame.appId).then(function (achievementDataResponse) {
                                    achievementDataResponse.json().then(function (achievementData) {
                                        if (achievementDataResponse.ok) {
                                            CommonSteam.parseGameAchievementData(achievementData.playerstats.achievements, ownedGame);
                                            console.log(ownedGame.name + ", Achievements : " + ownedGame.achievements.length + "\n");
                                        }
                                        else {
                                            console.log(ownedGame.name + " : ERROR " + achievementDataResponse.status + "... Setting game as 'No achievements'\n");
                                        }
                                    });
                                });
                                return [4 /*yield*/, Common.timer(500)];
                            case 1:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                i = 0;
                _a.label = 1;
            case 1:
                if (!(i < 40)) return [3 /*break*/, 4];
                return [5 /*yield**/, _loop_1(i)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                i++;
                return [3 /*break*/, 1];
            case 4:
                writeFile(ownedGames);
                return [2 /*return*/];
        }
    });
}); });
function writeFile(ownedGames) {
    var wb = XLSX.readFile("../Achievements.xlsx");
    var gamesArray = [[{ t: "s", v: "Name" }, { t: "s", v: "Completion status" }]];
    for (var _i = 0, ownedGames_1 = ownedGames; _i < ownedGames_1.length; _i++) {
        var ownedGame = ownedGames_1[_i];
        console.log(ownedGame);
        var gameDataArray = [{ t: "s", v: ownedGame.name }];
        if (ownedGame.achievements.length === 0) {
            gameDataArray.push(Common.completionStatus[4]);
        }
        else if (ownedGame.achievements.every(function (a) { return a.achieved; })) {
            gameDataArray.push(Common.completionStatus[3]);
        }
        else if (ownedGame.achievements.some(function (a) { return a.achieved; })) {
            gameDataArray.push(Common.completionStatus[1]);
        }
        else {
            gameDataArray.push(Common.completionStatus[0]);
        }
        gamesArray.push(gameDataArray);
    }
    var gamesWs = XLSX.utils.aoa_to_sheet(gamesArray);
    XLSX.utils.book_append_sheet(wb, gamesWs, "Steam Games");
    //Add steam data to existing RA data
    // const consoleDataWs = wb.Sheets["Console data"]
    //Add steam completion status to existing RA completion status
    // const completionDataWs = wb.Sheets("Completion data")
    XLSX.writeFile(wb, "../All_Achievements.xlsx");
}
function requestGameData(appIdValue) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch(url + getUserStatesForGame + appId + appIdValue + "&" + key + steamId)];
        });
    });
}
