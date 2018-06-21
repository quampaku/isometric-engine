export default class Isometric {
    constructor (maxx, maxz) {
        this.maxx = maxx;
        this.maxz = maxz;
        this.theta = 30;
        this.alpha = 45;
        this.theta = this.theta * 0.017453;
        this.alpha = this.alpha * 0.017453;
        this.sinTheta = Math.sin(this.theta);
        this.cosTheta = Math.cos(this.theta);
        this.sinAlpha = Math.sin(this.alpha);
        this.cosAlpha = Math.cos(this.alpha);
    }

    mapToScreen (xpp, ypp, zpp) {
        let yp = ypp;
        let xp = xpp * this.cosAlpha + zpp * this.sinAlpha;
        let zp = zpp * this.cosAlpha - xpp * this.sinAlpha;
        let x = xp;
        let y = yp * this.cosTheta - zp * this.sinTheta;
        return ([x, y]);
    }

    mapToIsoWorld (screenX, screenY) {
        let z = (screenX / this.cosAlpha - screenY / (this.sinAlpha * this.sinTheta)) * (1 / (this.cosAlpha / this.sinAlpha + this.sinAlpha / this.cosAlpha));
        let x = 1 / this.cosAlpha * (screenX - z * this.sinAlpha);
        return ([x, z]);
    }

    calculateDepth (xp, yp, zp) {
        let leeway = 5;
        let x = Math.abs(xp) * leeway;
        let y = Math.abs(yp);
        let z = Math.abs(zp) * leeway;
        let a = this.maxx;
        let b = this.maxz;
        let floor = a * (b - 1) + x;
        let depth = a * (z - 1) + x + floor * y;
        return (depth);
    }
}

