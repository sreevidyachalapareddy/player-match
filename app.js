const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let dataBase = null;

const initializationServer = async () => {
  try {
    dataBase = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (error) {
    console.log(`DB error : ${error.message}`);
    process.exit(1);
  }
};

initializationServer();

const convertDbPlayerDetailsObjToRespObj = (dataObject) =>{
    return{
        playerId : dataObject.player_id;
        playerName : dataObject.player_name;
    }
};

const convertDbMatchDetailsObjToRespObj = (dataObject) =>{
    return{
        matchId : dataObject.match_id;
        match : dataObject.match;
        year : dataObject.year;
    }
};

const convertDbPlayerMatchDetailsObjToRespObj = (dataObject) =>{
    return{
        playerMatchId : dataObject.player_match_id;
        playerId : dataObject.player_id;
        matchId : dataObject.match_id;
        score : dataObject.score;
        fours : dataObject.fours;
        sixes : dataObject.sixes;
    }
};

app.get("/players/", async (request,response) =>{
const player = `
SELECT *
FROM
player_details;`;
const playerData = await dataBase.all(player);
response.send(playerData.map((eachPlayer) => 
convertDbPlayerDetailsObjToRespObj(eachPlayer)));
});

app.get("/players/:playerId/", async (request,response) =>{
    const {playerId} = request.params;
    const playerDetailsData = `
    SELECT * 
    FROM 
    player_details
    WHERE
    player_id = ${playerId};`;
    const data = await dataBase.get(playerDetailsData);
    response.send(convertDbPlayerDetailsObjToRespObj(data));
});

app.put("/players/:playerId/", async (request,response) =>{
const {playerName} = request.body;
const {playerId} = request.params;
const updatePlayer = `
UPDATE
player_details
SET
player_name = '${playerName}'
WHERE
player_id = ${playerId};`;
await dataBase.run(updatePlayer);
response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request,response) =>{
    const match = `
    SELECT*
    FROM
    match_details;`;
    const matchData = await dataBase.all(match);
    response.send(matchData.map((eachMatch) => 
    convertDbMatchDetailsObjToRespObj(eachMatch)));
});

app.get("/players/:playerId/matches/", async (request,response) =>{
const {playerId} = request.params;
const playerMatchDetails = `
SELECT *
FROM
player_match_score NATURAL JOIN match_details
WHERE
player_id = ${playerId};`;
const playerList = await dataBase.all(playerMatchDetails);
response.send(playerList.map((eachDetails) =>
convertDbMatchDetailsObjToRespObj(eachDetails)));
});

app.get("/matches/:matchId/players/", async (request,response) =>{
    const {matchId} = request.params;
    const matchPlayerDetails = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    match_id = ${matchId};`;
    const matchList = await dataBase.all(matchPlayerDetails);
    response.send(matchList.map((eachData) =>
    convertDbPlayerDetailsObjToRespObj(eachData)));
});

app.get("/players/:playerId/playerScores/", async (request,response) =>{
    const {playerId} = request.params;
    const getDetails =`
    SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM
    player_details INNER JOIN player_match_score
    ON
    player_details.player_id = player_match_score.player_id
    WHERE
    player_id = ${playerId};`;
   const data1 = await dataBase.all(getDetails);
    response.send(data1);
});

module.exports = app;