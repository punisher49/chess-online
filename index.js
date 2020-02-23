const express = require('express');
const http = require('http')
const socket = require('socket.io');

const port = process.env.PORT || 3000

let app = express();
const server = http.createServer(app)
const io = socket(server)
let players;
let joined = true;

app.use(express.static(__dirname + "/"));

let games = Array(1000000);
for (let i = 0; i < 1000000; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
    // console.log(pid);
}

io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets
app.get('/', (req, res) => {
  console.log(res);
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    // console.log(players);
    let color;
    let playerId =  Math.floor((Math.random() * 100) + 1)


    // console.log(playerId + ' connected');

    socket.on('joined', function (roomId) {
        // games[roomId] = {}
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
        }
        else{
            socket.emit('full', roomId)
            return;
        }

        console.log(games[roomId]);
        players = games[roomId].players


        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;


    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        console.log(msg);
    });

    socket.on('play', function (msg) {
        socket.broadcast.emit('play', msg);
        console.log("ready " + msg);
    });

    socket.on('disconnect', function () {
        for (let i = 0; i < 1000000; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        console.log(playerId + ' disconnected');

    });

});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

server.listen(port);


console.log('Connected on localhost:3000');
