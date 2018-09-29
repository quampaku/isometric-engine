import Phaser from 'phaser';
import Isometric from './isometric';
import AStar from './astar';

class MainScene extends Phaser.Scene {
    constructor () {
        super({ key: 'mainScene'});
        this.tileWidthHalf = null;
        this.tileHeigthHalf = null;
        this.scene = this;
        this.skeletons = [];

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

        this.animations = {
            idle: {
                startFrame: 0,
                endFrame: 4,
                speed: 0.2
            },
            walk: {
                startFrame: 4,
                endFrame: 12,
                speed: 0.09
            },
            attack: {
                startFrame: 12,
                endFrame: 20,
                speed: 0.11
            },
            die: {
                startFrame: 20,
                endFrame: 28,
                speed: 0.2
            },
            shoot: {
                startFrame: 28,
                endFrame: 32,
                speed: 0.1
            }
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

        this.animationEvent = null;

    }

    preload () {
        this.load.json('map', 'assets/isometric-grass-and-water-sm.json');
        this.load.spritesheet('tiles', 'assets/isometric-grass-and-water.png', { frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('skeleton', 'assets/skeleton8.png', { frameWidth: 128, frameHeight: 128 });
    }

    create () {
        let self = this;

        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.tiles = this.add.container(350,200);
        this.tiles.setInteractive();

        this.astar = new AStar();

        this.input.on('pointerdown', function (pointer) {
            let x, y;
            x = pointer.x - 350;
            y = pointer.y - 220;
            //y = pointer.y - 217;
            //console.log('screen x = ' + x + ' y = ' +y);
            let temp = self.iso.mapToIsoWorld(x, y);
            let xm = temp[0];
            let zm = temp[1];
            let checkZone = 0;
            //console.log('iso xm = ' + xm + ' zm = ' +zm);
            let x_tile = Math.ceil((xm + checkZone)/self.world.cellWidth);
            let z_tile = Math.ceil(Math.abs(zm + checkZone)/self.world.cellWidth);
            //console.log(self.world.length);
            if (xm>=0 && xm <= self.world.width && zm >= self.world.length && zm<=0 ) {
                console.log('x_tile = ' + x_tile + ' z_tile = ' + z_tile);
            }

            if (/*!self.world.char.moving &&*/ xm>=0 && xm <= self.world.width && zm >= self.world.length && zm<=0 ) {
                let x = self.world.char.x;
                let z = self.world.char.z;
                self.world.char.startx = x;
                self.world.char.startz = z;
                self.world.char.endx = xm;
                self.world.char.endz = zm;
                let angleSpan = 360/8;
                let angle = Math.atan2(zm-z, xm-x);
                let realAngle = angle*180/Math.PI;
                realAngle += angleSpan/2;
                if (realAngle<0) {
                    realAngle += 360;
                }
                self.world.char.direction = self.directions[Math.ceil(realAngle/angleSpan)];
                self.setAnimation('walk');
                self.world.char.moving = true;
                let cosAngle = Math.cos(angle);
                let sinAngle = Math.sin(angle);
                self.world.char.xmov = self.world.char.speed*cosAngle;
                self.world.char.zmov = self.world.char.speed*sinAngle;
                console.log('speed name = ' +self.world.char.direction.name);
                console.log('speed x = ' +self.world.char.xmov);
                console.log('speed z = ' +self.world.char.zmov);
                self.world.char.feelerx = self.world.char.feeler*cosAngle;
                self.world.char.feelerz = self.world.char.feeler*sinAngle;
            }
        });

        this.buildFloor();
        this.buildCharacter();
        //this.skeletons.push(this.add.existing(new Skeleton(this, 460, 180, 'walk', 'southWest', 1000)));
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

        this.skeletons.forEach(function (skeleton) {
            skeleton.update();
        });

        if (this.world.char.moving) {
            this.moveCharacter();
            this.detectObjects();
            this.positionCharacter();
        }

        //this.walk();
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

    changeFrame () {
        // console.log('f = ' + this.world.char.f);
        this.world.char.f++;
        //console.log(this.world.char.motion);
        let delay = this.world.char.anim.speed;

        if (this.world.char.f === this.world.char.anim.endFrame) {
            switch (this.world.char.motion) {
                case 'walk':
                    this.world.char.f = this.world.char.anim.startFrame;
                    this.world.char.sprite.frame = this.world.char.sprite.texture.get(this.world.char.direction.offset + this.world.char.f);
                    this.animationEvent = this.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                    break;
                case 'attack':
                    delay = Math.random() * 2;
                    this.animationEvent = this.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'idle':
                    delay = 0.5 + Math.random();
                    this.animationEvent = this.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'die':
                    delay = 6 + Math.random() * 6;
                    this.animationEvent = this.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;
            }
        }
        else {
            this.world.char.sprite.frame = this.world.char.sprite.texture.get(this.world.char.direction.offset + this.world.char.f);
            this.animationEvent = this.time.delayedCall(delay * 1000, this.changeFrame, [], this);
        }
    }

    resetAnimation () {
        this.world.char.f = this.world.char.anim.startFrame;
        this.world.char.sprite.frame = this.world.char.sprite.texture.get(this.world.char.direction.offset + this.world.char.f);

        this.animationEvent = this.time.delayedCall(this.world.char.anim.speed * 1000, this.changeFrame, [], this);
    }

    stopAnimation () {
        if(this.animationEvent) {
            this.animationEvent.remove(false);
        }
    }

    setAnimation(val) {
        this.stopAnimation();
        this.world.char.motion = val;
        this.world.char.anim = this.animations[this.world.char.motion];
        this.resetAnimation();
    }

    buildCharacter() {
        this.world.char = {
            tempx: 32,
            tempy: 0,
            tempz: -32,
            speed: 1,
            feeler: 10,
            width: 10,
            xmov: 0,
            zmov:0,
            ymov:0,
            moving: false,
            sprite: null,
            direction: null,
            motion: 'idle',
            anim: null,
            f: null
        };
        this.world.char.anim = this.animations[this.world.char.motion];
        this.world.char.f = this.world.char.anim.startFrame;
        this.world.char.direction = this.directions[8];
        let char = this.add.image(0, 0, 'skeleton', 0).setOrigin(0.5, 1);
        this.tiles.add(char);
        this.world.char.sprite = char;
        this.animationEvent = this.time.delayedCall(this.world.char.anim.speed * 1000, this.changeFrame, [], this);
        this.positionCharacter();
        /*let cell_x = Math.ceil(this.world.char.tempx / this.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(this.world.char.tempz) / this.world.cellWidth);
        this.astar.s.x = cell_x;
        this.astar.s.y = cell_z;*/
    }

    positionCharacter() {
        this.world.char.x = this.world.char.tempx;
        this.world.char.y = this.world.char.tempy;
        this.world.char.z = this.world.char.tempz;
        let temp = this.iso.mapToScreen(this.world.char.x, this.world.char.y, this.world.char.z);
        let cell_x = Math.ceil(this.world.char.x / this.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(this.world.char.z) / this.world.cellWidth);
        this.world.char.cell_x = cell_x;
        this.world.char.cell_z = cell_z;
        this.world.char.sprite.depth = this.iso.calculateDepth(cell_x, 0, cell_z) + 1;
        this.world.char.sprite.x = temp[0];
        this.world.char.sprite.y = temp[1] + 50;
    }

    moveCharacter() {
        if (this.world.char.moving) {
            this.world.char.tempx = this.world.char.x+this.world.char.xmov;
            this.world.char.tempz = this.world.char.z+this.world.char.zmov;
            this.world.char.tempy = this.world.char.y+this.world.char.ymov;
            let sx = this.world.char.startx;
            let sz = this.world.char.startz;
            let ex = this.world.char.endx;
            let ez = this.world.char.endz;
            let tempx = this.world.char.tempx;
            let tempz = this.world.char.tempz;
            if ((ex-sx)/Math.abs(ex-sx) != (ex-tempx)/Math.abs(ex-tempx) || (ez-sz)/Math.abs(ez-sz) != (ez-tempz)/Math.abs(ez-tempz)) {
                this.setAnimation('idle');
                this.world.char.moving = false;
                this.world.char.xmov = 0;
                this.world.char.zmov = 0;
                this.world.char.tempx = ex;
                this.world.char.tempz = ez;
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


}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#ababab',
    scene: [ MainScene ],
    //antialias: false
};

let game = new Phaser.Game(config);

