
function Vector3d (vx, vy, vz) {
    this.x = vx;
    this.y = vy;
    this.z = vz;
};

Vector3d.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

Vector3d.prototype.normalize = function () {
    var m = this.magnitude();
    if (m != 0) {
        this.x /= m;
        this.y /= m;
        this.z /= m;
    }
};

Vector3d.prototype.dotProduct = function (vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
};

Vector3d.prototype.crossProduct = function (vec) {
    return new Vector3d(this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
};

Vector3d.prototype.scale = function (s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
};

Vector3d.prototype.add = function (vec) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
};

Vector3d.prototype.sub = function (vec) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
};

Vector3d.prototype.makeTangent = function (pos) {

    var p = pos.clone();
    var d = this.dotProduct(pos);
    var m = this.magnitude();

    p.scale(-d);
    this.add(p);
    this.normalize();
    this.scale(m);

};

Vector3d.prototype.clone = function () {
    return new Vector3d(this.x, this.y, this.z);
};

module.exports = Vector3d;