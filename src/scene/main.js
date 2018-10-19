import Phaser from "phaser";


export default class MainScene extends Phaser.Scene {

    constructor() {
        super({key: 'mainScene'});
        this.scene = this;

    }

    preload() {

    }

    create() {
        let clickCount = 0;
        this.clickCountText = this.add.text(100, 200, '');

        this.clickButton = this.add.text(340, 280, 'Начать игру', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => this.startScene() );
    }

    startScene(){
        this.scene.switch('basicLocationScene');
    }
    update() {

    }
}