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
            position: {
                x: 0,
                y: 0,
                z: 0,
            }
        };
        this.sprite = null;

        this.directions = this.scene.data.directions;

        this.animations = this.scene.data.animations.character;

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
        for (let animationName in this.animations) {
            let animationData = this.animations[animationName];
            for (let directionName in this.directions) {
                let directionData = this.directions[directionName];
                let animationKey = animationName + '-' + directionName;
                let startFrame = animationData.startFrame +(32 * (directionData.lineNumber-1));
                let endFrame = animationData.endFrame +(32 * (directionData.lineNumber-1));
                let config = {
                    key: animationKey,
                    frames: this.scene.anims.generateFrameNumbers('skeleton', {
                        prefix: animationKey,
                        start: startFrame,
                        end: endFrame
                    }),
                    frameRate: 6,
                    repeat: -1
                };
                this.scene.anims.create(config);
                this.sprite.anims.load(animationKey);
            }
        }
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
        let realAngle = Math.ceil(angle*57.2958)
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

    updateAnimationPlay(currKey) {
        if(this.sprite.anims.getCurrentKey() !== currKey) {
            this.sprite.anims.play(currKey);
        }
    }

    updatePosition(x, y, depth) {
        this.sprite.depth = depth + 1;
        this.sprite.x = x;
        this.sprite.y = y;
    }

    update() {
        // console.log(this.getCurrAnimationKey());
        this.updateAnimationPlay(this.getCurrAnimationKey());
        if(this.state.isMoving) {
            this.updatePosition(this.state.position.x, this.state.position.y, 1)
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
            this.state.position.x = this.state.position.x + this.moveData.moveSpeed.x;
            this.state.position.y = this.state.position.y + this.moveData.moveSpeed.y;
            this.state.position.z = this.state.position.z + this.moveData.moveSpeed.z;
            if(pointer.x === this.state.position.x &&
                pointer.y === this.state.position.z) {
                this.state.currAnimationName = 'idle';
                this.moveData.pointer = null;
            }
            this.scene.socket.emit('clientRequest_playerUpdate', this.getState());
        }
        this.update();
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