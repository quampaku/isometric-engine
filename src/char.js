export default class Char {

    constructor(scene, id) {
        this.scene = scene;
        this.world = scene.world;

        this.id = id;

        this.defaultAnimationName = 'idle';
        this.defaultDirectionName = 'south';

        this.state = {
            isMoving: false,
            directionName: null,
            currAnimationName: null,
            position: {
                x: 0,
                y: 0,
                z: 0,
            },
            moveSpeed: {
                x: 0,
                y: 0,
                z: 0
            }
        };
        this.sprite = null;

        this.directions = this.scene.data.directions;

        this.animations = this.scene.data.animations;

        this.init();
    }

    init()
    {
        this.state.currAnimationName = this.defaultAnimationName;
        this.state.directionName = this.defaultDirectionName;
        this.sprite = this.scene.add.sprite(0, 0, 'skeleton', 0).setOrigin(0.5, 1);
        this.scene.tiles.add(this.sprite);

        let config = {
            key: 'walk',
            frames: this.scene.anims.generateFrameNumbers('skeleton'),
            frameRate: 6,
            yoyo: true,
            repeat: -1
        };

        let anim = this.scene.anims.create(config);

        this.sprite.anims.load('walk');

        this.sprite.anims.play('walk');
    }

    update()
    {

    }

}