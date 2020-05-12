var vector3d = function (vx, vy, vz){
    this.x = vx;
    this.y = vy;
    this.z = vz;
};

vector3d.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

vector3d.prototype.normalize = function () {
    var m = this.magnitude();
	if (m != 0){
		this.x /= m;
		this.y /= m;
		this.z /= m;
	}
};
    
vector3d.prototype.dotProduct = function (vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
};
    
vector3d.prototype.crossProduct = function (vec) {
    return new vector3d( this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
};
    
vector3d.prototype.scale = function (s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
};
    
vector3d.prototype.add = function (vec) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
};

vector3d.prototype.sub = function (vec) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
};

vector3d.prototype.makeTangent = function (pos) {

    var p = pos.clone();
    var d = this.dotProduct(pos);
    var m = this.magnitude();

    p.scale(-d);
    this.add(p);
    this.normalize();
    this.scale(m);

};

vector3d.prototype.clone = function () {
    return new vector3d(this.x, this.y, this.z);
};

var moveDistanceAlongSphere = function (position, direction, length) {

    var dir = direction.clone();
    var pos = position.clone();

	if (length == 0){
		return pos;
	}
	
    var d = 2 * Math.sin(length / 2);
    var b = d * d * Math.sqrt(1 / (d * d) - .25);
    var a = Math.sqrt(1 - b * b);

    pos.scale(a);
    dir.normalize();
    dir.scale(b);

    pos.add(dir);
    pos.normalize();
    return pos;
};

/**************************************************
** GAME Circle CLASS
**************************************************/
var Circle = function (startX, startY, startZ, startVX, startVY, startVZ, startMass) {
    this.p = new vector3d(startX, startY, startZ);
    this.v = new vector3d(startVX, startVY, startVZ);
    this.o = new vector3d(1,1,1);
	this.o.makeTangent(this.p);
    this.o.normalize();
    this.mass = startMass;
};

Circle.prototype.setTo = function (obj) {
    this.p = new vector3d(obj.p.x, obj.p.y, obj.p.z);
    this.v = new vector3d(obj.v.x, obj.v.y, obj.v.z);
    this.o = new vector3d(obj.o.x, obj.o.y, obj.o.z);
    this.mass = obj.mass;
}

Circle.prototype.update = function (dt) {
        
    var dc = this.v.magnitude() * dt;
    //distance that will be traveled over the curve surface of the sphere, also angle in radians between initial and final position
       
    this.p = moveDistanceAlongSphere(this.p, this.v, dc);
    this.v.makeTangent(this.p);
    this.o.makeTangent(this.p);
};

Circle.prototype.gainMass = function(sv, smass) {
	this.v.scale(this.mass);
	var sm = sv.clone();
	sm.scale(smass);
	this.v.add(sm);
	this.mass += smass;
	this.v.scale(1 / this.mass);
}


Circle.prototype.removeMass = function(smass) {
	this.mass -= smass;
}

Circle.prototype.shoot = function (sv, r) {
        
    var momentum = this.v.magnitude() * this.mass;
    var smass = r * this.mass;
    var smm = smass * sv.magnitude();
    
    var sm = sv.clone();
    sm.normalize();
    sm.scale(smm);
    
    this.mass -= smass;
    sm.scale(1 / this.mass);
    this.v.sub(sm);
    
    var srad = Math.asin(Math.sqrt(1 - (1 - smass / (2 * Math.PI)) * (1 - smass / (2 * Math.PI))));
    var dist = Math.asin(srad) + this.getCRadius();
    
    var np = moveDistanceAlongSphere(this.p, sv, dist);
    sv.add(this.v);
    
    sv.makeTangent(np);
    
    return new Circle(np.x ,np.y, np.z, sv.x, sv.y, sv.z, smass);
    
};
    
Circle.prototype.angleTo = function(tp){
    var veca = tp.clone();
    veca.sub(this.p);
    veca.makeTangent(this.p);
    veca.normalize();
	var o2 = this.o.crossProduct(this.p)
	var dp = veca.dotProduct(this.o);
	var o2 = veca.dotProduct(o2);
	if (o2 > 0){
		return Math.acos(dp);
	} else {
		return 2*Math.PI-Math.acos(dp);
	}
};
    
Circle.prototype.getRadius = function () {
    //mass = 2pi(1 - (1 - r^2)^1/2)
    //(1 - (1 - mass/(2pi))^2)^(1/2) = r
    return Math.sqrt(1 - (1 - this.mass / (2 * Math.PI)) * (1 - this.mass / (2 * Math.PI)));
};
    
Circle.prototype.getCRadius = function () {
    return Math.acos(1-this.mass / (Math.PI * 2));
};
    
Circle.prototype.getX = function () {
    return this.p.x;
};
    
Circle.prototype.getY = function () {
    return this.p.y;
};
    
Circle.prototype.getZ = function () {
    return this.p.z;
};
    
Circle.prototype.getVX = function () {
    return this.v.x;
};
    
Circle.prototype.getVY = function () {
    return this.v.y;
};
    
Circle.prototype.getVZ = function () {
    return this.v.z;
};
    
Circle.prototype.getMass = function () {
    return this.mass;
};
    
Circle.prototype.getP = function () {
    return this.p;
}
    
Circle.prototype.getV = function () {
    return this.v;
}
    
Circle.prototype.getO = function () {
    return this.o;
}