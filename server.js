

var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , ffi = require('ffi');

server.listen(8080);

app.use(express.static(__dirname + '/public'));

var Player = require('./player.js');
//var Circle = require('./circle.js');
//var CircleEngineModule = require('./a.out.js');
var CircleEngine = require('./circleEngine.js');

var engine = new /*CircleEngineModule.*/CircleEngine();
var players = [];
var c = 20;

function getNewCID(){
    c++;
    var ecs = engine.getCircles();
    while (ecs[c] == null) {
        c++;
        if (c >= ecs.length)
            c = 0;
    }
    return c;
};
/*
function sendableCircles(){
    var cs = [];
    var ecs = engine.getCircles();
    for (var i = 0; i < ecs.size(); i++) {
        var c = ecs.get(i);
        if (c.getMass() > .0000000000000000000000000001) {
            cs.push(new Circle(c.getP().getX(), c.getP().getY(), c.getP().getZ(), c.getV().getX(), c.getV().getY(), c.getV().getZ(), c.getMass()));
        } else {
            cs.push(null);
        }
    }
    return cs;
}*/

io.on('connection', function (socket) {
    console.log('a user connected');
    var thisPlayer = new Player("new player", getNewCID(), socket.id);
    players.push(thisPlayer);
    socket.emit('assign CID', thisPlayer.getCID());
    socket.emit('circles update', engine.getCircles());
    socket.emit('players update', players);
    io.emit('new player', thisPlayer);
    socket.on('set name', function (n) {
        var data = [thisPlayer];
        thisPlayer.setName(n);
        data.push(thisPlayer);
        io.emit('name change', data);
        console.log('name change: ' + n);
    });
    socket.on('shoot', function (o) {
        engine.sendShoot(thisPlayer.getCID(), o.sv, o.r, o.sp);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

var time = (new Date()).getTime();

var intervalID = setInterval(function () {
    
//while (true) {
    var d = new Date();
    var dt = d.getTime() - time;
    engine.update(dt / 1000);
    var updates = engine.getUpdates();
    for (var i = 0; i < updates.length; i++) {
        if (updates[i] < 0) {
            //console.log('circle deleted: ' + -updates[i]);
            io.emit('circle delete', -updates[i]);
        }
    }
    io.emit('circles update', engine.getCircles());
    io.emit('players update', players);
    console.log('time step: ' + dt);
    time += dt;
//};

}, 20);
