/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	circles,
	CID,
	zoom,
	smoothr,
    socket,
    players,
    time


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
    var d = new Date();
    time = d.getTime();

    players = [];

	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Initialise keyboard controls
	keys = new Keys();

	// Initialise the local Circle
	circles = [new Circle(0, 0, 1, 0, 0, 0, .0003)];
	
    CID = 0;
    
    socket = io();
    
    
    socket.on('assign CID', function (n) {
        CID = n;
    });

    socket.on('circle delete', function (n) {
        circles[n] = null;
    });
    
    socket.on('circles update', function (cs) {
        for (var i = 0; i < cs.length; i++){
            if (!circles[i]) {
                circles[i] = new Circle(0, 0, 0, 0, 0, 0, 0);
            }
            if (cs[i]) {
                circles[i].setTo(cs[i]);
            } else {
                circles[i] = null;
            }
        }
        circles = circles.slice(0, cs.length);
    });

    socket.on('players update', function (ps) {
        players = ps;
    });
    
    socket.emit('set name', 'a new player');
    
    
    $('form').submit(function () {
        socket.emit('set name', $('#m').val());
        return false;
    });

	smoothr = circles[CID].getCRadius();
	
	zoom = 100;
	
	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	
	// Mouse press
	window.addEventListener("click", onClick, false);	

	// Window resize
	window.addEventListener("resize", onResize, false);
	
	window.addEventListener("mousewheel", MouseWheelHandler, false);
	
};

// Keyboard key down
function onKeydown(e) {
	if (circles[CID]) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (circles[CID]) {
		keys.onKeyUp(e);
	};
};

// Mouse click
function onClick(e) {
    if (circles[CID]) {
        var dx = e.x - canvas.width / 2;
        var dy = e.y - canvas.height / 2;
        var theta = Math.atan(dy / dx);
        if (dx < 0)
            theta += Math.PI;
        if (dy < 0 && dx > 0) {
            theta += Math.PI * 2;
        }
        console.log(theta);
        if (d > circles[CID].getCRadius()) {
            dx /= d / circles[CID].getCRadius();
            dy /= d / circles[CID].getCRadius();
        }
        var d = Math.sqrt(dx * dx + dy * dy);
        var o = circles[CID].getO().clone();
        var n = circles[CID].getP().clone();
        var p = o.crossProduct(n);
        o.scale(Math.cos(theta));
        p.scale(Math.sin(theta));
        o.add(p);
        o.normalize();
        o.scale(d / 800);
        circles.push(circles[CID].shoot(o, .01));
        socket.emit('shoot', { sv: o, r: .01, sp: circles[circles.length - 1].getP() });
    }
};

function MouseWheelHandler(e) {

	// cross-browser wheel delta
	var e = window.event || e; // old IE support
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	zoom *= 1 + delta / 10;
}

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
    if (circles[CID]) {
        var d = new Date();
        var dt = d.getTime() - time;
        update(dt / 1000);
        time += dt;
        draw();
    }

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update(t) {
    for (var i = 0; i < circles.length; i++) {
        if(circles[i])
		    circles[i].update(t);
	}
	/*for (var i = 0; i < circles.length; i++){
		for (var h = i + 1; h < circles.length; h++){
			if (broadTestCollision(i, h))
				if (testCollision(i,h))
					h--;
		}
	}*/
    for (var i = 0; i < circles.length; i++) {
        if (circles[i])
            if (broadTestCollision(i, CID))
                testCollision(i, CID);
	}

};

function broadTestCollision(i, h){
	var d = circles[i].getP().clone();
	d.sub(circles[h].getP());
	var dist = d.x+d.y+d.z;
	return (dist / 2 < circles[h].getCRadius() + circles[i].getCRadius());
}

function testCollision(i, h){
	if (i != h) {
		var d = circles[i].getP().clone();
		d.sub(circles[h].getP());
		var dist = 2 * Math.asin(d.magnitude() / 2);
		var tcr = circles[h].getCRadius();
		var ocr = circles[i].getCRadius();
		if (ocr < tcr) {
			if (dist < tcr) {
				circles[h].gainMass(circles[i].getV(), circles[i].getMass());
				circles[i]=null;
				return true;
			} else {
				if (dist < tcr + ocr) {
					var m1 = circles[h].getMass();
					var m2 = circles[i].getMass();
					var f = function(x) {
						return Math.acos(1-(m1+x)/(2*Math.PI)) + Math.acos(1-(m2-x)/(2*Math.PI)) - dist;
					}
					var fp = function(x) {
						return 1 / (Math.PI * 2 * Math.sqrt(1-Math.pow(1-(m1+x)/(2*Math.PI),2))) - 1 / (Math.PI * 2 * Math.sqrt(1-Math.pow(1-(m2-x)/(2*Math.PI),2)));
					}
					var x0 = 0;
					while(Math.abs(f(x0)) > .001 * Math.min(tcr,ocr)){
						x0 = x0 - f(x0)/fp(x0);
					}
					if(x0 > circles[i].mass){
						circles[h].gainMass(circles[i].getV(), circles[i].getMass());
                        circles[i] = null;
						return true;
					} else {
						circles[h].gainMass(circles[i].getV(), x0);
						circles[i].removeMass(x0);
					}
				}
			}
		} else {
			if (dist < ocr) {
				circles[i].gainMass(circles[h].getV(), circles[h].getMass());
                circles[h] = null;
				return true;
			} else {
				if (dist < tcr + ocr) {
					var m1 = circles[i].getMass();
					var m2 = circles[h].getMass();
					var f = function(x) {
						return Math.acos(1-(m1+x)/(2*Math.PI)) + Math.acos(1-(m2-x)/(2*Math.PI)) - dist;
					}
					var fp = function(x) {
						return 1 / (Math.PI * 2 * Math.sqrt(1-Math.pow(1-(m1+x)/(2*Math.PI),2))) - 1 / (Math.PI * 2 * Math.sqrt(1-Math.pow(1-(m2-x)/(2*Math.PI),2)));
					}
						var x0 = 0;
					while(Math.abs(f(x0)) > .001 * Math.min(tcr,ocr)){
						x0 = x0 - f(x0)/fp(x0);
					}
					if(x0 > circles[h].mass){
						circles[i].gainMass(circles[h].getV(), circles[h].getMass());
						circles[h] = null;
						return true;
					} else {
						circles[i].gainMass(circles[h].getV(), x0);
						circles[h].removeMass(x0);
					}
				}
			}
		}
	}
	return false;
}

/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var cx = canvas.width / 2;
	var cy = canvas.height / 2;
	var tcr = circles[CID].getCRadius();
	var scale = zoom / smoothr;
	smoothr = smoothr + .1 * (tcr - smoothr)
	
	
	ctx.beginPath();
	ctx.strokeStyle = '#000000';
	ctx.arc(cx, cy, Math.PI * scale, 0, 2*Math.PI);
	ctx.stroke();
	
    for (var i = 0; i < players.length; i++) {
        if (circles[players[i].CID]) {
            var theta = circles[CID].angleTo(circles[players[i].CID].getP());
            var d = circles[players[i].CID].getP().clone();
            d.sub(circles[CID].getP());
            var dist = 2 * Math.asin(d.magnitude() / 2);
            ctx.font = "13px Comic Sans MS";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText(players[i].name, cx + scale * dist * Math.cos(theta), cy + scale * dist * Math.sin(theta));
        }
    }
	
	for (var i = 0; i < circles.length; i++){
		if (i != CID && circles[i]) {
			var theta = circles[CID].angleTo(circles[i].getP());
			var d = circles[i].getP().clone();
			d.sub(circles[CID].getP());
			var dist = 2 * Math.asin(d.magnitude() / 2);
			var ocr = circles[i].getCRadius();
			if (scale*ocr > 1){
				ctx.beginPath();
				if (ocr > tcr){
					ctx.strokeStyle = '#ff0000';
				} else {
					ctx.strokeStyle = '#00ff00';
				}
				ctx.arc(cx + scale * dist * Math.cos(theta), cy + scale * dist * Math.sin(theta), scale*circles[i].getCRadius(), 0, 2*Math.PI);
				ctx.stroke();
			}
		}
    }
    ctx.fillStyle = "black";
	for (var d = - Math.PI / 2; d < Math.PI / 2; d += Math.PI/80){
		for (var t = 0; t < Math.PI * 2; t += Math.PI/40){
			var p = new vector3d(Math.cos(t)*Math.cos(d), Math.sin(t)*Math.cos(d), Math.sin(d));
			var theta = circles[CID].angleTo(p);
			p.sub(circles[CID].getP());
			var dist = 2 * Math.asin(p.magnitude() / 2);
			ctx.beginPath();
			ctx.fillRect(cx + scale * dist * Math.cos(theta), cy + scale * dist * Math.sin(theta), 1, 1);
			ctx.stroke();
		}
	}
	ctx.beginPath();
	ctx.strokeStyle = '#000000';
	ctx.arc(cx, cy, circles[CID].getCRadius() * scale, 0, 2*Math.PI);
	ctx.stroke();
};