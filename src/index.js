import Phaser from "phaser";
import MainScene from "./scene/main";
import BasicLocationScene from "./scene/basic_location";

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#030303',
    scene: [ MainScene, BasicLocationScene ]
};

let game = new Phaser.Game(config);