let express = require('express'); // Express contains some boilerplate to for routing and such
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http); // Here's where we include socket.io as a node module

// app.get("/", function (request, response) {
//     response.sendFile(__dirname + '/index.html');
// });

app.set('port', (process.env.PORT || 5000));

http.listen(app.get('port'), function() {
    console.log('listening on port',app.get('port'));
});
//
let playersData = {}; //Keeps a table of all players, the key is the socket id
let playerIds = {}; // набор id вида socketId => uid

io.on('connection', function(socket) {
    console.log("New player joined with state:");

    // зашел новый клиент
    socket.on('clientRequest_playerConnect', function (state) {
        console.log("New player joined with state:", state);
        if (state) {
            playerIds[socket.id] = state.uid;

            state.socketId = socket.id;
            playersData[state.uid] = state;
            io.to(socket.id).emit('serverResponse_playerConnect_success', playersData);
            io.emit('serverRequest_networkPlayersUpdate', state);
        }
    });

    // осознаный лог-аут клиента
    socket.on('clientRequest_playerLogout',function(state) {
        delete playersData[state.uid];
        io.emit('serverResponse_playerLogout', state.uid);
    });

    // дисконнект клиента
    socket.on('disconnect',function() {
        console.log('есть дисконнект');
        let uid = playerIds[socket.id];
        delete playersData[uid];
        io.emit('serverResponse_playerDisconnected', uid);
        delete playerIds[socket.id];
    });

    // обновление игроков
    socket.on('clientRequest_playerUpdate',function(state) {
        state.socketId = socket.id;
        playersData[state.uid] = state;
        io.emit('serverRequest_networkPlayersUpdate', state);
    });

});

function ServerGameLoop() {
    console.log('denis belous');
}

// setInterval(ServerGameLoop, 16);