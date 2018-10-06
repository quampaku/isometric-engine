export default class Char {

    constructor(scene) {
        this.scene = scene;
        this.world = scene.world;

        this.uid = this.generateUid();
        this.socketId = null;

        this.defaultAnimationName = 'idle';
        this.defaultDirectionName = 'southEast';
        this.baseSpeed = 1;

        this.moveData = {
            pointer: null,
            moveSpeed: {
                x: 0,
                y: 0,
                z: 0
            },

        };

        this.state = {
            isMoving: false,
            currDirectionName: null,
            currAnimationName: null,
            depth: 0,
            position: {
                x: 0,
                y: 0,
                z: 0,
            }
        };
        this.sprite = null;

        this.directions = this.scene.data.directions;

        this.animations = this.scene.data.animations.skeleton.data;

        this.init();
    }

    init() {
        this.state.currAnimationName = this.defaultAnimationName;
        this.state.currDirectionName = this.defaultDirectionName;
        this.sprite = this.scene.add.sprite(0, 0, 'skeleton', 0).setOrigin(0.5, 1);
        this.scene.tiles.add(this.sprite);

        this.initAnimations();

        this.sprite.anims.play(this.getCurrAnimationKey());
        // console.log()
    }

    initAnimations() {
        let animationCollection = this.scene.animationLoader.getCollection()['skeleton'];
        animationCollection.forEach((animationKey) => {
            this.sprite.anims.load(animationKey);
        });
    }

    getCurrAnimationKey() {
        return this.state.currAnimationName + '-' + this.state.currDirectionName;
    }

    setDirectionToPointer(pointer) {
        let x = this.sprite.x;
        let y = this.sprite.y;
        this.state.currDirectionName = this._calculateDirection(pointer,x,y);
    }
    _calculateDirection(pointer, currX, currY) {
        let angle = this._calculateAngle(pointer, currX, currY);
        let realAngle = Math.ceil(angle*57.2958);
        if (realAngle<=0) {
            realAngle += 360;
        }
        let angleSpan = 360/8;

        let costyl = {
            1: 'east',
            2: 'southEast',
            3: 'south',
            4: 'southWest',
            5: 'west',
            6: 'northWest',
            7: 'north',
            8: 'northEast',
        };
        let lineNumb = Math.ceil(realAngle/angleSpan);
        let key = costyl[lineNumb];
        console.log(lineNumb);
        return this.directions[key].name;
    }

    _calculateAngle(pointer, currX, currY) {
        let temp = this.scene.iso.mapToIsoWorld(pointer.x, pointer.y);
        let xm = temp[0];
        let zm = temp[1];
        let angle = Phaser.Math.Angle.Between(currX, currY, pointer.x - 350, pointer.y - 220);

        return angle;
    }

    _calculateDepth(x, z) {
        let cell_x = Math.ceil(x / this.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(z) / this.world.cellWidth);

        return this.scene.iso.calculateDepth(cell_x, 0, cell_z) + 1;
    }

    updateAnimationPlay(currKey) {
        if(this.sprite.anims.getCurrentKey() !== currKey) {
            this.sprite.anims.play(currKey);
        }
    }

    updatePosition(x, y, depth) {
        this.sprite.depth = depth;
        this.sprite.x = x;
        this.sprite.y = y;
    }

    update() {
        // console.log(this.getCurrAnimationKey());
        this.updateAnimationPlay(this.getCurrAnimationKey());
        if(this.state.isMoving) {
            this.updatePosition(this.state.position.x, this.state.position.y, this.state.depth)
        }
    }

    setMoveTo(pointer) {
        this.state.currAnimationName = 'walk';
        this.state.isMoving = true;
        this.moveData.pointer = pointer;
        this.moveData.moveSpeed = this.calculateMoveSpeed(pointer);
    }

    calculateMoveSpeed(pointer) {
        let angle = this._calculateAngle(pointer, this.state.position.x, this.state.position.y);
        let cosAngle = Math.cos(angle);
        let sinAngle = Math.sin(angle);
        let xSpeed = this.baseSpeed*cosAngle;
        let zSpeed = this.baseSpeed*sinAngle;

        return {
            x: xSpeed,
            y: zSpeed,
            z: zSpeed
        }
    }

    updateChar() {
        let pointer = this.moveData.pointer;
        if(pointer) {
            this.state.position.x += this.moveData.moveSpeed.x;
            this.state.position.y += this.moveData.moveSpeed.y;
            this.state.position.z += this.moveData.moveSpeed.z;
            this.state.depth = this._calculateDepth(this.state.position.x, this.state.position.y);
            if(pointer.x === this.state.position.x &&
                pointer.y === this.state.position.z) {
                this.stopMoving();
            }
            this.scene.socket.emit('clientRequest_playerUpdate', this.getState());
        }
        this.update();
    }

    stopMoving() {
        this.state.currAnimationName = 'idle';
        this.moveData.pointer = null;
        this.state.isMoving = false;
    }
    generateUid () {
        return Math.random().toString(36).substr(2, 16);
    }

    getState() {
        return {
            uid: this.uid,
            socketId: this.socketId,
            state: this.state
        }
    }

    setState(state) {
        this.socketId = state.socketId;
        this.state = state.state;
    }

}