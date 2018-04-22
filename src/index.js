import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor () {
        super({ key: 'mainScene'});
        this.tileW = 16;
        this.tileH = 16;

        this.map = [[1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,1],
            [1,0,1,0,0,0,0,1],
            [1,0,0,0,0,1,0,1],
            [1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1]];
        this.charPos = [1, 2];

        this.char = null;

        this.keyUp = null;
        this.keyDown = null;
        this.keyLeft = null;
        this.keyRight = null;
        this.dir = null;
        this.speed = 2;

    }

    preload () {
        this.load.image('tile_1', 'assets/wall.png');
        this.load.image('tile_0', 'assets/ground.png');
        this.load.image('char', 'assets/char.png');
    }

    create () {
        this.buildMap();
        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    update () {
        if(this.keyUp.isDown) {
            this.dir = 'up';
        } else if(this.keyDown.isDown) {
            this.dir = 'down';
        } else if(this.keyLeft.isDown) {
            this.dir = 'left';
        } else if(this.keyRight.isDown) {
            this.dir = 'right';
        } else {
            this.dir = null;
        }

        this.walk();
    }

    walk () {
        if(!this.dir) {
            return;
        }

        let downY   = Math.floor((this.char.y + (this.char.height/2)) / this.tileH);
        let upY     = Math.floor((this.char.y - (this.char.height/2)) / this.tileH);
        let leftX   = Math.floor((this.char.x - (this.char.width/2)) / this.tileW);
        let rightX  = Math.floor((this.char.x + (this.char.width/2)) / this.tileW);

        let centerX = Math.floor( this.char.x / this.tileW );
        let centerY = Math.floor( this.char.y / this.tileH );

        if ( this.dir === "up" && this.map[upY][centerX] !== 1 ) {
            this.char.y -= this.speed;
        }
        if ( this.dir === "down" && this.map[downY][centerX] !== 1 ) {
            this.char.y += this.speed;
        }
        if ( this.dir === "left" && this.map[centerY][leftX] !== 1 ) {
            this.char.x -= this.speed;
        }
        if ( this.dir === "right" && this.map[centerY][rightX] !== 1 ) {
            this.char.x += this.speed;
        }
    }

    buildMap () {
        let mapW = this.map[0].length;
        let mapH = this.map.length;
        let depth = 0;
        for (let i = 0; i < mapH; i++) {
            for (let j = 0; j < mapW; j++) {
                let tile = this.add.image(j * this.tileW, i * this.tileH, 'tile_' + this.map[i][j]).setOrigin(0);
                tile.depth = ++depth;
                console.log(tile.depth);
                if(i === this.charPos[1] && j === this.charPos[0]) {
                    this.char = this.add.image((j * this.tileW) + this.tileW/2, (i * this.tileH) + this.tileH/2, 'char');
                    this.char.depth = mapW * mapH + 1;
                }
            }
        }
    }
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [ MainScene ]
};

let game = new Phaser.Game(config);

