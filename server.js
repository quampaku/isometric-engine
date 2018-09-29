let express = require('express'); // Express contains some boilerplate to for routing and such
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http); // Here's where we include socket.io as a node module

// Serve the index page
app.get("/", function (request, response) {
    response.sendFile(__dirname + '/index.html');
});

// Listen on port 5000
app.set('port', (process.env.PORT || 5000));
http.listen(app.get('port'), function(){
    console.log('listening on port',app.get('port'));
});
//
let players = {}; //Keeps a table of all players, the key is the socket id

// // Tell Socket.io to start accepting connections
io.on('connection', function(socket) {
    console.log("New player joined with state:");
    // Listen for a new player trying to connect
    socket.on('new-player',function(state){
        console.log("New player joined with state:",state);
        players[socket.id] = state;
        // Broadcast a signal to everyone containing the updated players list
        io.emit('update-players',players);
    });

    // Listen for a disconnection and update our player table
    socket.on('disconnect',function(state){
        delete players[socket.id];
        io.emit('update-players',players);
    });

    // Listen for move events and tell all other clients that something has moved
    socket.on('move-player',function(position_data){
        console.log('player move to coords {x: ' + position_data.x +'; z: '+ position_data.z +'; y: '+ position_data.y + '}' );
        if(players[socket.id] == undefined) return; // Happens if the server restarts and a client is still connected
        players[socket.id].x = position_data.x;
        players[socket.id].y = position_data.y;
        players[socket.id].z = position_data.z;
        io.emit('update-players',players);
    })

});

// Update the bullets 60 times per frame and send updates
function ServerGameLoop(){
    console.log('denis belous');
    // Tell everyone where all the bullets are by sending the whole array
    // io.emit("bullets-update",bullet_array);
}

// setInterval(ServerGameLoop, 16);