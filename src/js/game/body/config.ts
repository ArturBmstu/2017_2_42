import {b2Vec2} from '@flyover/box2d/Box2D/Box2D/Common/b2Math';
import {b2BodyType} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Body';
export const PIXEL_TO_METERS = 1 / 30;
export const METERS_TO_PIXEL = 30;

export enum Colors {
    DEFAULT_DYNAMIC_BODY_COLOR = 'red',
    DEFAULT_STATIC_BODY_COLOR = 'green',
}


export enum KeyBodies {
    NOT_KEY_BODY = 0x0001,
    KEY_BODY_1 = 0x0002,
    KEY_BODY_2 = 0x0004,
    KEY_BODY_3 = 0x0008,
    KEY_BODY_4 = 0x0010,
}

export interface DrawOptions {
    opacity?: number;
    color?: string | number;
    lockScale?: boolean;
    selectable?: boolean;
}


export interface PhysicsOptions {
    density?: number;
    restitution?: number;
    friction?: number;
    bodyType?: b2BodyType;
    sensor?: boolean;
    collision?: boolean;
}

export interface Options extends DrawOptions, PhysicsOptions {
    keyBodyID?: KeyBodies;
    isOwner?: boolean;
    playerID?: number;
}

export interface InitOptions extends Options {
    position: b2Vec2;
    angle: number;
}

export interface Config {
}

export interface JSONBody {
    position: b2Vec2;
    size?: b2Vec2;
    radius?: number;
    angle: number;
    type: b2BodyType;
    options: Options;
    config?: Config;
    playerID: number;
}

export interface BucketConfig extends Config {
    wallThickness?: number;
    bottomLength?: number;
    height?: number;
}

export interface CircleBucketConfig extends Config {
    radius?: number;
    wallThickness?: number;
}