export default class AnimationLoader {

    constructor(scene) {
        this.scene = scene;

        this._collectionNames = {};

        this._init();
    }

    _init()
    {
        let directions = this.scene.data.directions;
        let animations = this.scene.data.animations;

        for(let aKey in animations) {
            let resourceName = animations[aKey].resourceName;
            let animationsData = animations[aKey].data;
            let animationKeysArr = [];
            for(let animationName in animationsData) {
                let animationData = animationsData[animationName];
                for (let directionName in directions) {
                    let directionData = directions[directionName];
                    let animationKey = animationName + '-' + directionName;
                    let startFrame = animationData.startFrame +(32 * (directionData.lineNumber-1));
                    let endFrame = animationData.endFrame +(32 * (directionData.lineNumber-1));
                    let config = {
                        key: animationKey,
                        frames: this.scene.anims.generateFrameNumbers(resourceName, {
                            prefix: animationKey,
                            start: startFrame,
                            end: endFrame
                        }),
                        frameRate: animationData.frameRate,
                        repeat: animationData.repeat
                    };
                    this.scene.anims.create(config);
                    animationKeysArr.push(animationKey)
                }
            }
            this._collectionNames[resourceName] = animationKeysArr;
        }
    }

    getCollection() {
        return this._collectionNames;
    }

}