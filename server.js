let express = require('express'); // Express contains some boilerplate to for routing and such
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http); // Here's where we include socket.io as a node module

app.get("/", function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.set('port', (process.env.PORT || 5000));

http.listen(app.get('port'), function() {
    console.log('listening on port',app.get('port'));
});
//
let playersData = {}; //Keeps a table of all players, the key is the socket id

io.on('connection', function(socket) {
    console.log("New player joined with state:");
    socket.on('clientRequest_playerConnect', function (state) {
        console.log("New player joined with state:", state);
        if (state) {
            state.socketId = socket.id;
            playersData[state.uid] = state;
            io.to(socket.id).emit('serverResponse_playerConnect_success');
            io.emit('serverRequest_networkPlayersUpdate', state);
        }
        //playersData[socket.id] = state;
        //io.to(socket.id).emit('serverRequest_networkPlayerCreate',playersData);
    });

    // Listen for a disconnection and update our player table
    socket.on('clientRequest_playerDisconnect',function(state) {
        console.log('есть дисконнект');
        delete playersData[state.uid];
        io.emit('serverResponse_playerDisconnected', state.uid);
    });

    // Listen for move events and tell all other clients that something has moved
    socket.on('clientRequest_playerUpdate',function(state) {
        // console.log('player move to coords {x: ' + position_data.x +'; z: '+ position_data.z +'; y: '+ position_data.y + '}' );
        // if(playersData[socket.id] == undefined) return; // Happens if the server restarts and a client is still connected
        state.socketId = socket.id;
        playersData[state.uid] = state;
        // console.log(playersData[socket.id]);
        io.emit('serverRequest_networkPlayersUpdate', state);
    });

    /*socket.on('move-to',function(data) {
        console.log('игрок '+ socket.id+' побежал на точку ' + data.x);
        io.emit('move-player',{
            id: socket.id,
            x: data.x,
            y: data.y
        });
    });*/
});

// Update the bullets 60 times per frame and send updates
function ServerGameLoop() {
    console.log('denis belous');
    // Tell everyone where all the bullets are by sending the whole array
    // io.emit("bullets-update",bullet_array);
}

// setInterval(ServerGameLoop, 16);