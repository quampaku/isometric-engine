import Char from './char';

export default class Player {

    constructor(scene) {
        this.baseSpeed = 1;
        this.moveData = {
            pointer: null,
            moveSpeed: {
                x: 0,
                y: 0,
                z: 0
            },

        };

        this.scene = scene;
        this.char = new Char(scene);
        this.uid = this.char.uid;
    }

    setDirectionToPointer(pointer) {
        let x = this.char.sprite.x;
        let y = this.char.sprite.y;
        this.char.state.currDirectionName = this._calculateDirection(pointer,x,y);
    }

    setMoveTo(pointer) {
        this.char.state.currAnimationName = 'walk';
        this.char.state.isMoving = true;
        this.moveData.pointer = pointer;
        this.moveData.moveSpeed = this._calculateMoveSpeed(pointer);
    }

    update() {
        let pointer = this.moveData.pointer;
        if(pointer) {
            this.char.state.position.x += this.moveData.moveSpeed.x;
            this.char.state.position.y += this.moveData.moveSpeed.y;
            this.char.state.position.z += this.moveData.moveSpeed.z;
            this.char.state.depth = this._calculateDepth(this.char.state.position.x, this.char.state.position.y);
            if(pointer.x === this.char.state.position.x &&
                pointer.y === this.char.state.position.z) {
                this.stopMoving();
            }
            this.char.scene.socket.emit('clientRequest_playerUpdate', this.char.getState());
        }
        this.char.update();
    }

    stopMoving() {
        this.char.state.currAnimationName = 'idle';
        this.char.state.isMoving = false;
        this.moveData.pointer = null;
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
        return this.char.directions[key].name;
    }

    _calculateMoveSpeed(pointer) {
        let angle = this._calculateAngle(pointer, this.char.state.position.x, this.char.state.position.y);
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

    _calculateDepth(x, z) {
        let cell_x = Math.ceil(x / this.scene.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(z) / this.scene.world.cellWidth);

        return this.scene.iso.calculateDepth(cell_x, 0, cell_z) + 1;
    }

    _calculateAngle(pointer, currX, currY) {
        let temp = this.scene.iso.mapToIsoWorld(pointer.x, pointer.y);
        let xm = temp[0];
        let zm = temp[1];
        let angle = Phaser.Math.Angle.Between(currX, currY, pointer.x - 350, pointer.y - 220);

        return angle;
    }


    getState() {
        return this.char.getState();
    }

    setState(state) {
        this.char.setState(state);
    }
}