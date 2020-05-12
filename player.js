function Player (n, circleID, s) {
    this.name = n;
    this.CID = circleID;
    this.socket = s;
}
Player.prototype.getName = function () {
    return this.name;
};

Player.prototype.getCID = function () {
    return this.CID;
};

Player.prototype.getSocket = function () {
    return this.socket;
};
    
Player.prototype.setName = function (nName) {
    this.name = nName;
};
    
Player.prototype.setCID = function (nCID) {
    this.CID = nCID;
};

module.exports = Player;