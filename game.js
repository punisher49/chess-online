let board;
game = new Chess();
let socket = io();

let color = "white";
let players;
let roomId;
let play = true;

let room = document.getElementById("room")
let roomNumber = document.getElementById("roomNumbers")
let button = document.getElementById("button")
let state = document.getElementById('state')
// let messages = document.getElementById('chat')
// messages.hide();
// let timer = document.getElementById('timer')

let connect = function(){
    roomId = room.value;
    if (roomId !== "" && parseInt(roomId) <= 1000000) {
        room.remove();
        roomNumber.innerHTML = "Room Number " + roomId;
        button.remove();
        // socket.emit('joined', roomId);
        socket.emit('join-room', roomId);
        $("div#chat").removeClass("hidden");



    }
}
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(players + msg));
});

socket.on('full', function (msg) {
    if(roomId == msg)
        window.location.assign(window.location.href+ 'full.html');
});

socket.on('timer-set', function(timer){
  console.log('Got event: timer-set', timer);
  if(players === 2){
    // Only player 2 should respond to this event
    startPlayer2(timer);
  }
});

socket.on('play', function (msg) {
  // THIS CODE ONLY RUNS FOR player1
    console.log('ws: play');
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in Progress"
        console.log('timer', $("div#timer"));
        $("#timer").removeClass("hidden");
        $("#section").removeClass("hidenSection")
        // start()

    }//if
    // console.log(msg)
});

socket.on('move', function (msg) {
    console.log('got move', msg);
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved")
        switchTurn()

    }
});


let removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

let greySquare = function (square) {
    let squareEl = $('#board .square-' + square);

    let background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

let onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

let onDrop = function (source, target) {
    removeGreySquares();

    // see if the move is legal
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    if (game.game_over()) {
        state.innerHTML = '<div class="red">GAME OVER</div>';
        socket.emit('gameOver', roomId)
    }

    // illegal move
    if (move === null) return 'snapback';
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};

let onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    let moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

let onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

let onSnapEnd = function () {
    board.position(game.fen())
    switchTurn()
    // messages.position(game.fen());

};


$(function () {
  let socket = io();

  $('#room').focus();

  $('form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    // socket.to(roomId).emit('chat message', $('#m').val());

    socket.emit('chat message', roomId, $('#m').val() );

    // socket.in(roomId).emit('chat message', $('#m').val() + `(room: ${roomId})`);

    $('#m').val('');
    return false;


  });

  // socket.on('chat message', function(msg){
  //   $('#messages').append($('<li>').text(msg));
  // });
  //
});

socket.on('player', (msg) => {
    let plno = document.getElementById('player')
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players === 2){
      // THIS CODE ONLY RUNS FOR THE SECOND PLAYER THAT JOINS player2
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress";
        $("#timer").removeClass("hidden")


    }
    else
        state.innerHTML = "Waiting for Second player";


    let cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);
    // $("#timer").removeClass("hidden");
});
// console.log(color)




function getTime(time) {
    let min = Math.floor(time / 60);
    let sec = time % 60;
    return min + ":" + (sec < 10 ? "0" + sec : sec);
}

function getSeconds(min, sec) {
    let time = min * 60 + sec;
    return time;
}

let move = "green";
let times, timer;

function printTime() {
    $("#" + move + "Time").text(getTime(times[move]));
}

function switchTurn() {
    if (move == "green") move = "white";
    else move = "green";
}

function start() {
  // Only the first user triggers this function
  console.log('start()');
    $("section").css("display", "none");
    $("main").css("display", "block");

    let seconds = parseInt($("#seconds").val());
    let minutes = parseInt($("#minutes").val());


    // Tell the second user what the timer value is
    // TODO: don't send roomId, use socket.io rooms to scope these messages
    socket.emit('timer-set', roomId, { minutes, seconds });

    times = {
      green: getSeconds(minutes, seconds),
        white: getSeconds(minutes, seconds)
    }

    $("#greenTime").text(getTime(getSeconds(minutes, seconds)));
    $("#whiteTime").text(getTime(getSeconds(minutes, seconds)));


    timer = setInterval(function() {
        times[move]--;
        printTime();

        if (times[move] == 0) {
            navigator.vibrate(1000);
            clearInterval(timer);
            timer = false;
              state.innerHTML = '<div class="red">GAME OVER!!! Black Won</div>';
        }


    }, 1000);

  // start();

    return true

}


function startPlayer2({ minutes, seconds }) {
    console.log('start2()');

    $("section").css("display", "none");
    $("main").css("display", "block");

    times = {
      green: getSeconds(minutes, seconds),
        white: getSeconds(minutes, seconds)
    }

    $("#greenTime").text(getTime(getSeconds(minutes, seconds)));
    $("#whiteTime").text(getTime(getSeconds(minutes, seconds)));


    timer = setInterval(function() {
        times[move]--;
        printTime();

        if (times[move] == 0) {
            navigator.vibrate(1000);
            clearInterval(timer);
            timer = false;
          state.innerHTML = '<div class="red">GAME OVER!!! White Won</div>';

        }


    }, 1000);

} // startPlayer2()


$(function() {

    $("main").click(function() {
        if (timer) switchTurn();
        else {
            $("section").css("display", "block");
            $("main").css("display", "none");
        }
    });

    $("#start").click(start);

});
