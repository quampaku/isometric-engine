export default class Char {

    constructor(scene) {
        this.scene = scene;
        this.world = scene.world;

        this.uid = this._generateUid();
        this.socketId = null;

        this.defaultAnimationName = 'idle';
        this.defaultDirectionName = 'southEast';
        this.baseSpeed = 1;

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

        this._init();
    }

    getCurrAnimationKey() {
        return this.state.currAnimationName + '-' + this.state.currDirectionName;
    }

    update() {
        this._updateAnimationPlay(this.getCurrAnimationKey());
        if(this.state.isMoving) {
            this._updatePosition(this.state.position.x, this.state.position.y, this.state.depth)
        }
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



    _init() {
        this.state.currAnimationName = this.defaultAnimationName;
        this.state.currDirectionName = this.defaultDirectionName;
        this.sprite = this.scene.add.sprite(0, 0, 'skeleton', 0);
        this.scene.tiles.add(this.sprite);

        this._initAnimations();

        this.sprite.anims.play(this.getCurrAnimationKey());
    }

    _initAnimations() {
        let animationCollection = this.scene.animationLoader.getCollection()['skeleton'];
        animationCollection.forEach((animationKey) => {
            this.sprite.anims.load(animationKey);
        });
    }

    _generateUid () {
        return Math.random().toString(36).substr(2, 16);
    }

    _updateAnimationPlay(currKey) {
        if(this.sprite.anims.getCurrentKey() !== currKey) {
            this.sprite.anims.play(currKey);
        }
    }

    _updatePosition(x, y, depth) {
        this.sprite.depth = depth;
        this.sprite.x = x;
        this.sprite.y = y;
    }

}