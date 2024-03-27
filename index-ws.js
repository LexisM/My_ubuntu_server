const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
});



server.on('request', app);
server.listen(3000, function () { console.log("Server started on port 3000"); });


process.on('SIGINT', () => {
    console.log('sigint received');

    wss.clients.forEach(function each(client) {
        client.close();
    });


    server.close((err) => {

        console.log("Server closed successfully");
        shutdownDB();

    });


});

/** **** WebSocket  **** ****/

const SocketServer = require('ws').Server;
const wss = new SocketServer({ server: server });

wss.on('connection', function connection(ws) {
    const numClients = wss.clients.size;
    console.log('Clients connected', numClients);

    wss.broadcast(`Current visitors: ${numClients}`);

    if (ws.readyState === ws.OPEN) {
        ws.send(`Welcome to my Server`);
        recordVisitorCount(numClients);
    }

    // Writing data to database
    db.run(`INSERT INTO visitors (count, time) 
    VALUES (${numClients}, DATETIME('now'))
    `);

    ws.on('close', function close() {
        wss.broadcast(`Current visitors: ${numClients}`);
        console.log("A Client has disconnected");
    });
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
}

/* ---------End Websockets ----------*/

/* --------- Start Database ----------*/


const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(':memory:');

db.serialize(() => {   // .serialize make sure there is a table in the database
    db.run(`
        CREATE TABLE  visitors (
                count INTEGER,
                time TEXT    
                )
            `)
}); // run create table

function recordVisitorCount(numClients) {
    db.run(`INSERT INTO visitors (count, time) 
        VALUES (${numClients}, DATETIME('now'))
    `);
}

function shutdownDB() {
    console.log("shutting down database");
    getCounts();

    db.close((err) => {
        if (err) {
            console.error("Error while closing database:", err);
        } else {
            console.log("Database connection closed successfully");
        }
    });
}


function getCounts() {
    db.each("SELECT * FROM visitors", function (err, row) {
        if (err) {
            console.error("Error while fetching counts:", err);
        } else {
            console.log(row);
        }
    });
}



