import Phaser from "phaser";


export default class MainScene extends Phaser.Scene {

    constructor() {
        super({key: 'mainScene'});
        this.scene = this;

    }

    preload() {
        this.load.json('map', 'assets/loc1.json');
        this.load.json('data', 'data/data.json');
        this.load.json('config', 'config.json');
        this.load.image('logo', 'assets/logo1.jpg');
        this.load.spritesheet('tiles', 'assets/grassland.png', { frameWidth: 64, frameHeight: 128});
        this.load.spritesheet('trees', 'assets/grassland.png', { frameWidth: 128, frameHeight: 256});
        this.load.spritesheet('skeleton', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        this.add.image(400, 180, 'logo');

        this.clickButton = this.add.text(310, 340, 'Начать игру', { fill: '#0f0', fontSize: '30px' })
            .setInteractive({ useHandCursor: true  })
            .on('pointerdown', () => this.startScene() );
    }

    startScene(){
        this.scene.switch('basicLocationScene');
    }
    update() {

    }
}