var Vector3d = require('./vector3d.js');

function Circle(startX, startY, startZ, startVX, startVY, startVZ, startMass) {
    this.p = new Vector3d(startX, startY, startZ);
    this.v = new Vector3d(startVX, startVY, startVZ);
    this.o = new Vector3d(1, 1, 1);
    this.o.makeTangent(this.p);
    this.o.normalize();
    this.mass = startMass;
};

Circle.prototype.update = function (dt) {
    
    var dc = this.v.magnitude() * dt;
    //distance that will be traveled over the curve surface of the sphere, also angle in radians between initial and final position
    
    this.p = this.moveDistanceAlongSphere(this.p, this.v, dc);
    this.v.makeTangent(this.p);
    this.o.makeTangent(this.p);
};

Circle.prototype.moveDistanceAlongSphere = function (position, direction, length) {
    
    var dir = direction.clone();
    var pos = position.clone();
    
    if (length == 0) {
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

Circle.prototype.gainMass = function (sv, smass) {
    this.v.scale(this.mass);
    var sm = sv.clone();
    sm.scale(smass);
    this.v.add(sm);
    this.mass += smass;
    this.v.scale(1 / this.mass);
}


Circle.prototype.removeMass = function (smass) {
    this.mass -= smass;
}

Circle.prototype.shoot = function (sv, r, sp) {
    
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
    
    var np = this.moveDistanceAlongSphere(this.p, sv, dist);
    sv.add(this.v);
    
    sv.makeTangent(np);
    
    return new Circle(sp.x , sp.y, sp.z, sv.x, sv.y, sv.z, smass);
    
};

Circle.prototype.angleTo = function (tp) {
    var veca = tp.clone();
    veca.sub(this.p);
    veca.makeTangent(this.p);
    veca.normalize();
    var o2 = this.o.crossProduct(this.p)
    var dp = veca.dotProduct(this.o);
    var o2 = veca.dotProduct(o2);
    if (o2 > 0) {
        return Math.acos(dp);
    } else {
        return 2 * Math.PI - Math.acos(dp);
    }
};

Circle.prototype.getRadius = function () {
    //mass = 2pi(1 - (1 - r^2)^1/2)
    //(1 - (1 - mass/(2pi))^2)^(1/2) = r
    return Math.sqrt(1 - (1 - this.mass / (2 * Math.PI)) * (1 - this.mass / (2 * Math.PI)));
};

Circle.prototype.getCRadius = function () {
    return Math.acos(1 - this.mass / (Math.PI * 2));
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

module.exports = Circle;