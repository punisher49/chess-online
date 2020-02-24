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

    socket.on('chat message', function(roomId, msg){
      // console.log('ON', roomId, msg);
      // console.log('global socket .on, rooms', socket.rooms);
      // console.log(io.sockets.adapter.sids[socket.id]);

      // debugger;
      // io.emit('chat message', socket);

      io.to(roomId).emit('chat message', msg);


      // const roomKey = Object.keys(socket.rooms)[0];
      // const room = socket.rooms[roomKey];
      // io.to(roomId).emit('chat message', msg); // broadcast to everyone (NO!)
    });


    // socket.on('joined', function (roomId) {
    socket.on('join-room', function (roomId) {
        // games[roomId] = {}
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;

            socket.join(roomId, err => {
              console.log('joining', roomId, err);
              console.log('ROOMS: ', socket.rooms );

              io.to(roomId).emit('chat message', 'joined!')

              socket.on('chat message', function(msg){
                console.log('[LOCAL join] socket .on, rooms', socket.rooms);
                // const roomKey = Object.keys(socket.rooms)[0];
                // const room = socket.rooms[roomKey];
                // io.to(roomId).emit('chat message', msg); // broadcast to everyone (NO!)
              });

              socket.in(roomId).on('chat message', function(msg){
                console.log('socket.in(room).on, rooms', socket.rooms);
                // const roomKey = Object.keys(socket.rooms)[0];
                // const room = socket.rooms[roomKey];
                io.to(roomId).emit('chat message', msg); // broadcast to everyone (NO!)
              });

              io.in(roomId).on('chat message', function(msg){
                console.log('io.in(room).on, rooms', socket.rooms);
                // const roomKey = Object.keys(socket.rooms)[0];
                // const room = socket.rooms[roomKey];
                io.to(roomId).emit('chat message', msg); // broadcast to everyone (NO!)
              });

            }); // join the room in socket.io system



            console.log('JOINED A ROOM', roomId);
            console.log(socket.rooms);

            // When we get a message in this room, send it only to the other
            // player in the same room


        }  else {
            socket.emit('full', roomId)
            return;
        }

        console.log(games[roomId]);
        players = games[roomId].players


        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;


    }); // on 'joined'



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

}); // socket.on('connection')

// io.on('connection', function(socket){
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg); // broadcast to everyone (NO!)
//   });
// });

server.listen(port);


console.log('Connected on localhost:3000');
