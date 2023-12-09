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
var RA = require("@retroachievements/api");
var XLSX = require("xlsx-js-style");
//AUTH
var userName = "Appotheozz";
var webApiKey = "pIaSRkvZuWJUStkvjp3eRnXxmXLfWHdn";
var auth = RA.buildAuthorization({ userName: userName, webApiKey: webApiKey });
//GAMES MASTERED
var completedGamesPromise = RA.getUserCompletedGames(auth, { userName: userName });
var completionStatus = [{ "v": "Not Played", "s": { fill: { fgColor: { rgb: "AAAAAA" } } } },
    { "v": "Tried", "s": { fill: { fgColor: { rgb: "7777FF" } } } },
    { "v": "Beaten", "s": { fill: { fgColor: { rgb: "FFFF22" } } } },
    { "v": "Mastered", "s": { fill: { fgColor: { rgb: "22FF22" } } } }];
//CONSOLE IDS
var consoleDataListPromise = RA.getConsoleIds(auth);
var consolesToIgnore = ["Events", "Hubs"];
//USER AWARDS
var userAwardsPromise = RA.getUserAwards(auth, { userName: userName });
//GAME LIST
var gameListPromise = consoleDataListPromise.then(function (consoleDataList) {
    return getGameList(consoleDataList);
});
//Result
Promise.all([completedGamesPromise, gameListPromise, userAwardsPromise]).then(function (val) {
    var completedGames = val[0];
    var gameListMap = val[1];
    var userAwards = val[2];
    writeFile(completedGames, userAwards, gameListMap);
});
/************************************************ */
/**********METHODS ****************************** */
/************************************************ */
function getGameList(consoleDataList) {
    return __awaiter(this, void 0, void 0, function () {
        var total, gameListMap, i, _loop_1, i_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    total = 0;
                    gameListMap = new Map();
                    i = 0;
                    _loop_1 = function (i_1) {
                        var consoleData;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    consoleData = consoleDataList[i_1];
                                    if (consolesToIgnore.some(function (data) { return data === consoleData.name; })) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    console.log("GAME LIST : " + i_1 + "/" + consoleDataList.length);
                                    //Create promise for given console data, add to gameListPromises list
                                    RA.getGameList(auth, {
                                        consoleId: consoleData.id,
                                        shouldOnlyRetrieveGamesWithAchievements: true,
                                        shouldRetrieveGameHashes: false
                                    }).then(function (gameList) {
                                        console.log("CONSOLE : " + consoleData.name + ", GAMES : " + gameList.length);
                                        total += gameList.length;
                                        console.log("TOTAL : " + total);
                                        gameListMap.set(consoleData.name, gameList);
                                        console.log("\n");
                                    });
                                    return [4 /*yield*/, timer(1000)];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i_1 = 0;
                    _a.label = 1;
                case 1:
                    if (!(i_1 < consoleDataList.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i_1)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i_1++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, new Promise(function (resolve) { resolve(gameListMap); })];
            }
        });
    });
}
function writeFile(completedGames, userAwards, gameListMap) {
    var wb = XLSX.utils.book_new();
    //GAMES SHEET
    var gamesArray = [[{ t: "s", v: "Console" }, { t: "s", v: "Name" }, { t: "s", v: "Completion status" }]];
    gameListMap.forEach(function (gameList, consoleName) {
        var _loop_2 = function (entity) {
            var gameData = [{ t: "s", v: consoleName }, { t: "s", v: entity.title }];
            if (userAwards.visibleUserAwards.some(function (award) { return award.awardType === "Mastery/Completion" && award.title === entity.title && award.consoleName === consoleName; })) {
                gameData.push(completionStatus[3]);
            }
            else if (userAwards.visibleUserAwards.some(function (award) { return award.awardType === "Game Beaten" && award.title === entity.title && award.consoleName === consoleName; })) {
                gameData.push(completionStatus[2]);
            }
            else if (completedGames.some(function (completedGame) { return completedGame.numAwarded > 0 && completedGame.title === entity.title && completedGame.consoleName === consoleName; })) {
                gameData.push(completionStatus[1]);
            }
            else {
                gameData.push(completionStatus[0]);
            }
            gamesArray.push(gameData);
        };
        for (var _i = 0, gameList_1 = gameList; _i < gameList_1.length; _i++) {
            var entity = gameList_1[_i];
            _loop_2(entity);
        }
    });
    var gamesWs = XLSX.utils.aoa_to_sheet(gamesArray);
    XLSX.utils.book_append_sheet(wb, gamesWs, "RAGames");
    //CONSOLE DATA SHEET
    var consoleDataArray = [[{ t: "s", v: "Console" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B2:B1000)" }]];
    gameListMap.forEach(function (gameList, consoleName) {
        consoleDataArray.push([{ t: "s", v: consoleName }, { t: "n", v: gameList.length }]);
    });
    var consoleDataWs = XLSX.utils.aoa_to_sheet(consoleDataArray);
    XLSX.utils.book_append_sheet(wb, consoleDataWs, "Console data");
    //COMPLETION DATA SHEET
    var completionDataArray = [[{ t: "s", v: "Status" }, { t: "s", v: "Number of games" }, { t: "s", v: "Total" }, { t: "n", f: "SUM(B2:B1000)" }]];
    for (var i = 0; i < completionStatus.length; i++) {
        var cell = {
            t: "n",
            f: "COUNTIF(RAGames!C2:C20000, A" + (i + 2)
        };
        completionDataArray.push([{ t: "s", v: completionStatus[i]["v"], s: completionStatus[i]["s"] }, cell]);
    }
    var completionDataWs = XLSX.utils.aoa_to_sheet(completionDataArray);
    XLSX.utils.book_append_sheet(wb, completionDataWs, "Completion data");
    XLSX.writeFile(wb, "../Achievements.xlsx");
}
function timer(ms) { return new Promise(function (res) { return setTimeout(res, ms); }); }
