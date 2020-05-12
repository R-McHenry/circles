var Vector3d = require('./vector3d.js');
var Circle = require('./circle.js');

function CircleEngine() {
    this.circles = [];
    this.updates = [];
    this.populate();
};

CircleEngine.prototype.populate = function () {
    for (var i = 0; i < 500; i++) {
        var xx = Math.random() * 2 - 1;
        var yy = Math.random() * 2 - 1;
        var zz = Math.random() * 2 - 1;
        var m = Math.sqrt(xx * xx + yy * yy + zz * zz);
        if (m < 1) {
            var vx = Math.random() * .01 - .005;
            var vy = Math.random() * .01 - .005;
            var vz = Math.random() * .01 - .005;
            xx /= m;
            yy /= m;
            zz /= m;
            var vv = new Vector3d(vx, vy, vz);
            vv.makeTangent(new Vector3d(xx, yy, zz));
            this.circles.push(new Circle(xx / m, yy / m, zz / m, vv.x, vv.y, vv.z, 5 * Math.random() / (1000 + i * 5)));
        } else {
            i--;
        }
    };
};

CircleEngine.prototype.update = function (dt) {
    this.updates = [];
    var xx = Math.random() * 2 - 1;
    var yy = Math.random() * 2 - 1;
    var zz = Math.random() * 2 - 1;
    var m = Math.sqrt(xx * xx + yy * yy + zz * zz);
    if (m < 1) {
        var vx = Math.random() * .01 - .005 + xx / 10;
        var vy = Math.random() * .01 - .005 - yy / 10;
        var vz = Math.random() * .01 - .005;
        xx /= m;
        yy /= m;
        zz /= m;
        var vv = new Vector3d(vx, vy, vz);
        vv.makeTangent(new Vector3d(xx, yy, zz));
        this.circles.push(new Circle(xx / m, yy / m, zz / m, vv.x, vv.y, vv.z, 5 * Math.random() / 10000));
    }
    for (var i = 0; i < this.circles.length; i++) {
        if (this.circles[i])
            this.circles[i].update(dt);
    }
    for (var i = 0; i < this.circles.length; i++) {
        if (this.circles[i]) {
            for (var h = i + 1; h < this.circles.length; h++) {
                if (this.circles[i] && this.circles[h])
                    if (this.broadTestCollision(i, h))
                        if (this.testCollision(i, h))
                            h--;
            }
        }
    }
};

CircleEngine.prototype.broadTestCollision = function(i, h) {
    var d = this.circles[i].getP().clone();
    d.sub(this.circles[h].getP());
    var dist = d.x + d.y + d.z;
    return (dist / 2 < this.circles[h].getCRadius() + this.circles[i].getCRadius());
};

CircleEngine.prototype.testCollision = function (i, h) {
    if (i != h) {
        var d = this.circles[i].getP().clone();
        d.sub(this.circles[h].getP());
        var dist = 2 * Math.asin(d.magnitude() / 2);
        var tcr = this.circles[h].getCRadius();
        var ocr = this.circles[i].getCRadius();
        if (ocr < tcr) {
            if (dist < tcr) {
                this.circles[h].gainMass(this.circles[i].getV(), this.circles[i].getMass());
                this.circles[i] = null;
                this.updates.push(h);
                this.updates.push(-i);
                return true;
            } else {
                if (dist < tcr + ocr) {
                    var m1 = this.circles[h].getMass();
                    var m2 = this.circles[i].getMass();
                    var f = function (x) {
                        return Math.acos(1 - (m1 + x) / (2 * Math.PI)) + Math.acos(1 - (m2 - x) / (2 * Math.PI)) - dist;
                    }
                    var fp = function (x) {
                        return 1 / (Math.PI * 2 * Math.sqrt(1 - Math.pow(1 - (m1 + x) / (2 * Math.PI), 2))) - 1 / (Math.PI * 2 * Math.sqrt(1 - Math.pow(1 - (m2 - x) / (2 * Math.PI), 2)));
                    }
                    var x0 = 0;
                    while (Math.abs(f(x0)) > .001 * Math.min(tcr, ocr)) {
                        x0 = x0 - f(x0) / fp(x0);
                    }
                    if (x0 > this.circles[i].mass) {
                        this.circles[h].gainMass(this.circles[i].getV(), this.circles[i].getMass());
                        this.circles[i] = null;
                        this.updates.push(h);
                        this.updates.push(-i);
                        return true;
                    } else {
                        this.circles[h].gainMass(this.circles[i].getV(), x0);
                        this.circles[i].removeMass(x0);
                        this.updates.push(h);
                        this.updates.push(i);
                    }
                }
            }
        } else {
            if (dist < ocr) {
                this.circles[i].gainMass(this.circles[h].getV(), this.circles[h].getMass());
                this.circles[h] = null;
                this.updates.push(i);
                this.updates.push(-h);
                return true;
            } else {
                if (dist < tcr + ocr) {
                    var m1 = this.circles[i].getMass();
                    var m2 = this.circles[h].getMass();
                    var f = function (x) {
                        return Math.acos(1 - (m1 + x) / (2 * Math.PI)) + Math.acos(1 - (m2 - x) / (2 * Math.PI)) - dist;
                    }
                    var fp = function (x) {
                        return 1 / (Math.PI * 2 * Math.sqrt(1 - Math.pow(1 - (m1 + x) / (2 * Math.PI), 2))) - 1 / (Math.PI * 2 * Math.sqrt(1 - Math.pow(1 - (m2 - x) / (2 * Math.PI), 2)));
                    }
                    var x0 = 0;
                    while (Math.abs(f(x0)) > .001 * Math.min(tcr, ocr)) {
                        x0 = x0 - f(x0) / fp(x0);
                    }
                    if (x0 > this.circles[h].mass) {
                        this.circles[i].gainMass(this.circles[h].getV(), this.circles[h].getMass());
                        this.circles[h] = null;
                        this.updates.push(i);
                        this.updates.push(-h);
                        return true;
                    } else {
                        this.circles[i].gainMass(this.circles[h].getV(), x0);
                        this.circles[h].removeMass(x0);
                        this.updates.push(i);
                        this.updates.push(h);
                    }
                }
            }
        }
    }
    return false;
};

CircleEngine.prototype.getCircles = function () {
    return this.circles;
};

CircleEngine.prototype.getUpdates = function () {
    return this.updates;
};

CircleEngine.prototype.sendShoot = function (i, sv, r, sp) {
    this.circles.push(this.circles[i].shoot(new Vector3d(sv.x, sv.y, sv.z), r, new Vector3d(sp.x, sp.y, sp.z)));
    this.updates.push(i);
    this.updates.push(this.circles.length - 1);
}

module.exports = CircleEngine;