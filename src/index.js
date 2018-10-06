import Phaser from 'phaser';
import io from 'socket.io-client';
import Isometric from './isometric';
import AStar from './astar';
import AnimationLoader from './animation_loader';
import Character from './character';
import Char from './char';

class MainScene extends Phaser.Scene {
    constructor () {
        super({ key: 'mainScene'});
        this.tileWidthHalf = null;
        this.tileHeigthHalf = null;
        this.scene = this;
        this.skeletons = {};
        this.socket = null;
        this.animationLoader = null;

        this.world = {
            maxx: 0,
            maxz: 0,
            cellWidth: 0,
            width: 0,
            length: 0,
            path: {},
        };

        this.floor = {
            tile: {
                _visible: true
            }
        };

        this.iso = null;
        this.tiles = null;
        this.astar = null;

        this.data = null;

    }

    preload () {
        this.load.json('map', 'assets/isometric-grass-and-water-sm.json');
        this.load.json('data', 'data/data.json');
        this.load.json('config', 'config.json');
        this.load.spritesheet('tiles', 'assets/isometric-grass-and-water.png', { frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('skeleton', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }

    create () {
        this.data = this.cache.json.get('data');
        this.config = this.cache.json.get('config');
        this.socket = io.connect(this.config.serverAddress);

        this.animationLoader = new AnimationLoader(this);

        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.tiles = this.add.container(350,200);
        this.tiles.setInteractive();

        this.astar = new AStar();

        this.buildFloor();
        this.char = new Char(this, this.socket.id);

        this.socket.emit('clientRequest_playerConnect', this.char.getState());

        this.input.on('pointerdown', (pointer) => {
            this.char.state.currAnimationName = 'idle';
            this.char.setMoveTo(pointer);
            this.char.setDirectionToPointer(pointer);
            // console.log(this.char.state.currDirectionName);
            this.socket.emit('clientRequest_playerUpdate', this.char.getState());
        });

        this.listener();
    }

    update () {
        if (this.keyUp.isDown) {
            this.dir = 'up';
        } else if (this.keyDown.isDown) {
            this.dir = 'down';
        } else if (this.keyLeft.isDown) {
            this.dir = 'left';
        } else if (this.keyRight.isDown) {
            this.dir = 'right';
        } else {
            this.dir = null;
        }

        this.char.updateChar();
        // for(let id in this.skeletons) {
        //     // let state = this.charsData[id];
        //     // if(state) {
        //     //     console.log('хуй');
        //     //     console.log(this.charsData);
        //     //     this.skeletons[id].setState(state);
        //     // }
        //     this.skeletons[id].update();
        // }
        //
        // if (this.char.moving) {
        //     this.char.moveCharacter();
        //     // this.char.detectObjects();
        //     this.char.positionCharacter();
        // }

        //this.walk();
        for(let id in this.skeletons) {
            if(this.char.uid !== id) {
                // console.log('update =' + id);
                this.skeletons[id].update();
            }
        }

    }

    buildFloor () {
        let data =  this.cache.json.get('map');
        let tileWidth = data.tilewidth;
        let tileHeight = data.tileheight;
        this.tileWidthHalf = tileWidth/2;
        this.tileHeigthHalf = tileHeight/2;
        let layer = data.layers[0].data;
        let mapWidth = data.layers[0].width;
        let mapHeight = data.layers[0].height;
        let centerX = mapWidth * this.tileWidthHalf;
        let centerY = 16;

        this.world.maxx = mapWidth;
        this.world.maxz = mapHeight;
        this.world.cellWidth = tileWidth/1.414;
        this.world.width = mapWidth * this.world.cellWidth;
        this.world.length = -mapHeight * this.world.cellWidth;
        this.world.path = this.floor;
        let path = this.world.path;
        path.tile._visible = false;
        this.world.tiles = [];

        this.iso = new Isometric(mapWidth, mapHeight);
        let k = 0;
        let y = 0;
        for(let j = 1; j <= mapHeight; j++) {
            for(let i = 1; i <= mapWidth; i++) {
                let id = layer[k] - 1;
                let x = (i-1) * this.world.cellWidth;
                let z = -(j-1) * this.world.cellWidth;
                let depth = this.iso.calculateDepth(i, y, j);
                let temp = this.iso.mapToScreen(x, y, z);
                //console.log(temp);
                let tile = this.add.image(temp[0], temp[1], 'tiles', id).setOrigin(0.5, 0);
                tile.depth = depth;
                //tile.setInteractive();
                this.tiles.add(tile);
                k++;
                if(j === 1) {
                    this.world.tiles[i] = [];
                }
                this.world.tiles[i][j] = {x:i, y:y, z:j, depth:depth};
            }
        }
    }

    detectObjects() {
        //Extend a little in the direction of motion
        let x = this.world.char.tempx+this.world.char.feelerx;
        let z = Math.abs(this.world.char.tempz+this.world.char.feelerz);
        let x_tile = Math.ceil(x/this.world.cellWidth);
        let z_tile = Math.ceil(z/this.world.cellWidth);
        if (!this.world.tiles[x_tile] || !this.world.tiles[x_tile][z_tile] || !this.world.tiles[x_tile][z_tile].isObject) {
            x = this.world.char.tempx;
            z = Math.abs(this.world.char.tempz);
            x_tile = Math.ceil(x/this.world.cellWidth);
            z_tile = Math.ceil(z/this.world.cellWidth);
            let depth = this.world.tiles[x_tile][z_tile].depth+1;
            //console.log(depth);
            this.world.char.sprite.depth = depth;
        } else {
            this.world.char.tempx = this.world.char.x;
            this.world.char.tempz = this.world.char.z;
            this.world.char.xmov = 0;
            this.world.char.ymov = 0;
            this.world.char.moving = false;
        }
    }

    listener() {
        // ты законнектился на сервак
        this.socket.on('serverResponse_playerConnect_success', (charList) => {
            for(let uid in charList) {
                if(uid !== this.char.uid) {
                    let state = charList[uid];
                    this.skeletons[uid] = new Char(this);
                    this.skeletons[uid].setState(state);
                }
            }
            console.log('connected to the server');
        });

        // обновляем игроков
        this.socket.on('serverRequest_networkPlayersUpdate',(state) => {
            // console.log('serverRequest_networkPlayersUpdate');
            // console.log('state uid id = ' + state.uid);
            // console.log('state socket id = ' + state.socketId);
            if(state && state.uid && state.uid !== this.char.uid) {
                if(!this.skeletons[state.uid]) {
                    console.log('new network player connected');
                    this.skeletons[state.uid] = new Char(this);
                }
                this.skeletons[state.uid].setState(state);
            } else {
                return false;
            }
        });

        // один из игроков вышел из игры
        this.socket.on('serverResponse_playerDisconnected',(id) => {
            this.skeletons[id].sprite.destroy();
            delete this.skeletons[id];
        });
    }
}


let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ababab',
    scene: [ MainScene ]
};

let game = new Phaser.Game(config);

