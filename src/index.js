import Phaser from 'phaser';
import io from 'socket.io-client';
import Isometric from './isometric';
import AStar from './astar';
import Character from './character';

class MainScene extends Phaser.Scene {
    constructor () {
        super({ key: 'mainScene'});
        this.tileWidthHalf = null;
        this.tileHeigthHalf = null;
        this.scene = this;
        this.skeletons = {};
        this.charsData = {};
        this.socket = io.connect('http://localhost:5000');

        this.directions = {
            1: { offset: 160, x: 2, y: 1,name: 'southEast', opposite: 'northWest' },
            2: { offset: 128, x: 2, y: 0, name: 'east', opposite: 'west' },
            3: { offset: 96, x: 2, y: -1, name: 'northEast', opposite: 'southWest' },
            4: { offset: 64, x: -1, y: 2, name: 'north', opposite: 'south' },
            5: { offset: 32, x: -2, y: -1, name: 'northWest', opposite: 'southEast' },
            6: { offset: 0, x: -2, y: 0, name: 'west', opposite: 'east' },
            7: { offset: 224, x: -2, y: 1, name: 'southWest', opposite: 'northEast' },
            8: { offset: 192, x: 2, y: -1, name: 'south', opposite: 'north' },
        };

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
    }

    preload () {
        this.load.json('map', 'assets/isometric-grass-and-water-sm.json');
        this.load.spritesheet('tiles', 'assets/isometric-grass-and-water.png', { frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('skeleton', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }

    create () {

        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.tiles = this.add.container(350,200);
        this.tiles.setInteractive();

        this.astar = new AStar();

        this.buildFloor();
        this.char = new Character(this);

        this.input.on('pointerdown', (pointer) => {
            // this.char.sprite.destroy();
            // this.socket.emit('move-to', {x: pointer.x, y: pointer.y});
            this.socket.emit('clientRequest_playerUpdate', this.char.getState());
            // console.log(2);
            this.char.moveToPointer(pointer);
        });

        this.socket.emit('clientRequest_playerConnect', this.char.getState());

        this.listener();
        //this.skeletons.push(this.add.existing(new Skeleton(this, 460, 180, 'walk', 'southWest', 1000)));
    }

    update () {
        for(let id in this.skeletons) {
            if(this.char.uid !== id) {
                console.log('update =' + id);
                this.skeletons[id].update();
            }
        }
        this.char.tempx += 1;
        this.char.tempz += 1;
        this.char.update();
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
        this.socket.on('serverResponse_playerConnect_success', () => {
            console.log('connected to the server');
        });

        this.socket.on('serverRequest_networkPlayersUpdate',(state) => {
            console.log('serverRequest_networkPlayersUpdate');
            console.log('state uid id = ' + state.uid);
            console.log('state socket id = ' + state.socketId);
            if(state && state.uid && state.uid !== this.char.uid) {
                if(!this.skeletons[state.uid]) {
                    console.log('new network player connected');
                    this.skeletons[state.uid] = new Character(this);
                }
                this.skeletons[state.uid].setState(state);
            } else {
                return false;
            }
        });

        this.socket.on('serverResponse_playerDisconnected',(id) => {
            this.skeletons[id].sprite.destroy();
            delete this.skeletons[id];
            // console.log(this.charsData);
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

