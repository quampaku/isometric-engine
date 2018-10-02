import Phaser from "phaser";

export default class Character
{

    constructor (scene, id)
    {
        this.scene = scene;
        this.world = scene.world;

        this.id = id;
        this.tempx = 32;
        this.tempy =  0;
        this.tempz = 32;
        this.speed = 1;
        this.feeler = 10;
        this.width = 10;
        this.xmov = 0;
        this.zmov = 0;
        this.ymov = 0;
        this.moving = false;
        this.sprite = null;
        this.direction = null;
        this.motion = 'idle';
        this.anim = null;
        this.f = null;
        this.animationEvent = null;

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
        this.buildCharacter();
    }

    changeFrame ()
    {
        this.f++;
        let delay = this.anim.speed;

        if (this.f === this.anim.endFrame) {
            switch (this.motion) {
                case 'walk':
                    this.f = this.anim.startFrame;
                    this.sprite.frame = this.sprite.texture.get(this.direction.offset + this.f);
                    this.animationEvent = this.scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
                    break;
                case 'attack':
                    delay = Math.random() * 2;
                    this.animationEvent = this.scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'idle':
                    delay = 0.5 + Math.random();
                    this.animationEvent = this.scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;

                case 'die':
                    delay = 6 + Math.random() * 6;
                    this.animationEvent = this.scene.time.delayedCall(delay * 1000, this.resetAnimation, [], this);
                    break;
            }
        }
        else {
            this.sprite.frame = this.sprite.texture.get(this.direction.offset + this.f);
            this.animationEvent = this.scene.time.delayedCall(delay * 1000, this.changeFrame, [], this);
        }
    }

    resetAnimation ()
    {
        this.f = this.anim.startFrame;
        this.sprite.frame = this.sprite.texture.get(this.direction.offset + this.f);

        this.animationEvent = this.scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
    }

    stopAnimation ()
    {
        if(this.animationEvent) {
            this.animationEvent.remove(false);
        }
    }

    setAnimation(val)
    {
        this.stopAnimation();
        this.motion = val;
        this.anim = this.animations[this.motion];
        this.resetAnimation();
    }

    buildCharacter()
    {
        this.anim = this.animations[this.motion];
        this.f = this.anim.startFrame;
        this.direction = this.directions[8];
        this.sprite = this.scene.add.image(0, 0, 'skeleton', 0).setOrigin(0.5, 1);
        this.scene.tiles.add(this.sprite);
        this.animationEvent = this.scene.time.delayedCall(this.anim.speed * 1000, this.changeFrame, [], this);
        // this.positionCharacter();
        /*let cell_x = Math.ceil(this.tempx / this.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(this.tempz) / this.world.cellWidth);
        this.astar.s.x = cell_x;
        this.astar.s.y = cell_z;*/
    }

    positionCharacter()
    {
        console.log('двигаем позицию персонажа ага');
        this.x = this.tempx;
        this.y = this.tempy;
        this.z = this.tempz;
        let temp = this.scene.iso.mapToScreen(this.x, this.y, this.z);
        let cell_x = Math.ceil(this.x / this.world.cellWidth);
        let cell_z = Math.ceil(Math.abs(this.z) / this.world.cellWidth);
        this.cell_x = cell_x;
        this.cell_z = cell_z;
        // тут вот рили нужное
        this.sprite.depth = this.scene.iso.calculateDepth(cell_x, 0, cell_z) + 1;
        this.sprite.x = temp[0];
        this.sprite.y = temp[1] + 50;
    }

    // по-сути тут только остановка персонажа задается, а ну и промежуточные координаты да
    moveCharacter()
    {
        if (this.moving) {
            this.tempx = this.x+this.xmov;
            this.tempz = this.z+this.zmov;
            this.tempy = this.y+this.ymov;
            let sx = this.startx;
            let sz = this.startz;
            let ex = this.endx;
            let ez = this.endz;
            let tempx = this.tempx;
            let tempz = this.tempz;
            if ((ex-sx)/Math.abs(ex-sx) != (ex-tempx)/Math.abs(ex-tempx) || (ez-sz)/Math.abs(ez-sz) != (ez-tempz)/Math.abs(ez-tempz)) {
                this.setAnimation('idle');
                this.moving = false;
                this.xmov = 0;
                this.zmov = 0;
                this.tempx = ex;
                this.tempz = ez;
            }
        }
    }

    moveToPointer(pointer)
    {
        let x, y;
        x = pointer.x - 350;
        y = pointer.y - 220;
        let temp = this.scene.iso.mapToIsoWorld(x, y);
        let xm = temp[0];
        let zm = temp[1];
        let checkZone = 0;
        let x_tile = Math.ceil((xm + checkZone)/this.world.cellWidth);
        let z_tile = Math.ceil(Math.abs(zm + checkZone)/this.world.cellWidth);

        // вычисляем направление анимации
        if (xm>=0 && xm <= this.world.width && zm >= this.world.length && zm<=0 ) {
            let x = this.x;
            let z = this.z;
            this.startx = x;
            this.startz = z;
            this.endx = xm;
            this.endz = zm;
            let angleSpan = 360/8;
            let angle = Math.atan2(zm-z, xm-x);
            let realAngle = angle*180/Math.PI;
            realAngle += angleSpan/2;
            if (realAngle<0) {
                realAngle += 360;
            }
            this.direction = this.directions[Math.ceil(realAngle/angleSpan)];
            this.setAnimation('walk');
            this.moving = true;
            let cosAngle = Math.cos(angle);
            let sinAngle = Math.sin(angle);
            this.xmov = this.speed*cosAngle;
            this.zmov = this.speed*sinAngle;
            console.log('speed name = ' +this.direction.name);
            console.log('speed x = ' +this.xmov);
            console.log('speed z = ' +this.zmov);
            this.feelerx = this.feeler*cosAngle;
            this.feelerz = this.feeler*sinAngle;
        }
    }

    getState()
    {
        return {
            moving: this.moving,
            direction: this.direction,
            x: this.x,
            z: this.z,
            y: this.y,
            xmov: this.xmov,
            zmov: this.zmov,
            feelerx: this.feelerx,
            feelerz: this.feelerz,
            motion: this.motion,
            anim: this.anim
        }
    }

    setState(state)
    {
        this.moving = state.moving;
        this.direction = state.direction;
        this.x = state.x;
        this.z = state.z;
        this.y = state.y;
        this.xmov = state.xmov;
        this.zmov = state.zmov;
        this.feelerx = state.feelerx;
        this.feelerz = state.feelerz;
        this.motion = state.motion;
        this.anim = state.anim;
    }

    update()
    {
        if(this.moving) {
            this.moveCharacter();
            this.positionCharacter();
        }
    }
}