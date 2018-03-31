import {b2BodyType} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Body';
/**
 * Created by zwirec on 03.12.2017.
 */


export const BACKGROUND_IMAGE = 'ChalkboardBG-min.jpg';

export const patterns_path: Map<b2BodyType, string> = new Map([
    [b2BodyType.b2_staticBody, 'static_body_pattern.png'],
    [b2BodyType.b2_dynamicBody, 'texture1.png'],
]);

let SCALE_COEFF_X = 1;
let SCALE_COEFF_Y = 1;
let DEFAULT_SIZE_X = 1280;
let DEFAULT_SIZE_Y = 720;
export {SCALE_COEFF_X, SCALE_COEFF_Y, DEFAULT_SIZE_X, DEFAULT_SIZE_Y, assignScaleConf};

function assignScaleConf(x, y: number) {
    SCALE_COEFF_X = x / DEFAULT_SIZE_X;
    SCALE_COEFF_Y = SCALE_COEFF_X;
    console.log(SCALE_COEFF_X, SCALE_COEFF_Y);
}
