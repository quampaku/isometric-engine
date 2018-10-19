import Phaser from "phaser";


export default class MainScene extends Phaser.Scene {

    constructor() {
        super({key: 'mainScene'});
        this.scene = this;

    }

    preload() {

    }

    create() {
        this.scene.switch('basicLocationScene');
        console.log(this);
        // this.scene.start('basicLocationScene');
    }

    update() {

    }
}