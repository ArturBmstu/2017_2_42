import {b2CircleShape} from '@flyover/box2d/Box2D/Box2D/Collision/Shapes/b2CircleShape';
import {b2Vec2} from '@flyover/box2d/Box2D/Box2D/Common/b2Math';
import {b2_pi} from '@flyover/box2d/Box2D/Box2D/Common/b2Settings';
import {b2Body, b2BodyDef, b2BodyType} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Body';
import {b2FixtureDef} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Fixture';
import {b2World} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2World';
import 'fabric';

import {b2PolygonShape} from '@flyover/box2d/Box2D/Box2D/Collision/Shapes/b2PolygonShape';
import {SCALE_COEFF_X} from '../board/config';
import {
    BucketConfig, CircleBucketConfig, InitOptions, JSONBody, KeyBodies, METERS_TO_PIXEL, Options,
    PIXEL_TO_METERS,
} from './config';
import {Colors} from './config';
declare const fabric: any;

export abstract class Body {
    private static counter = 1;

    public ID: number;

    public owned: boolean;
    public bodyDef: b2BodyDef;
    public fixDefs: b2FixtureDef[];
    public body: b2Body;
    public shape: fabric.Object;
    public pattern: fabric.Image;
    public keyBody: number;

    public isDeleted: boolean = false;
    public initOptions: InitOptions;
    private options_: Options;

    constructor(bodyDef: b2BodyDef, fixDefs: b2FixtureDef[], shape: fabric.Object, options: Options) {
        this.bodyDef = bodyDef;
        this.bodyDef.type = options.bodyType || b2BodyType.b2_staticBody;
        this.bodyDef.userData = this;
        this.fixDefs = fixDefs;
        this.initOptions = {
            position: bodyDef.position,
            angle: bodyDef.angle,
            selectable: options.isOwner || false,
            keyBodyID: options.keyBodyID,
            playerID: options.playerID,
        };
        this.shape = shape;
        this.initShapes(options);
        this.ID = Body.counter++;
        this.options_ = options;
        this.keyBody = options.keyBodyID;
    }

    get isKeyBody(): boolean {
        return this.keyBody === KeyBodies.KEY_BODY_1;
    }


    private initShapes(option: Options): void {
        this.shape.originX = 'center';
        this.shape.originY = 'center';
        this.shape.lockScalingX = this.shape.lockScalingY = option.lockScale || true;
        // this.shapes.hasBorders = false;
        this.shape.borderColor = 'white';
        this.shape.setControlVisible('tl', false);
        this.shape.setControlVisible('ml', false);
        this.shape.setControlVisible('bl', false);
        this.shape.setControlVisible('mb', false);
        this.shape.setControlVisible('br', false);
        this.shape.setControlVisible('mr', false);
        this.shape.setControlVisible('tr', false);
        this.shape.setControlVisible('mt', false);
        this.shape.perPixelTargetFind = true;
        this.shape.padding = -2;
        this.shape['borderDashArray'] = [5, 5];
        this.shape.strokeWidth = 5;
        this.shape.strokeLineCap = 'round';
        this.shape.cornerSize = 15;
        this.shape.transparentCorners = true;
        this.shape.cornerColor = 'white';
        this.shape['cornerStyle'] = 'circle';
        // this.shapes['statefulCache'] = true;
        // this.shapes['objectCaching'] = true;
        this.shape.toObject = () => {
            return {
                body: this,
            };
        };
    }

    get angle(): number {
        return fabric.util.degreesToRadians(this.shape.angle);
    }


    public Create(world: b2World) {
        this.body = world.CreateBody(this.bodyDef);
        this.fixDefs.forEach((fixDef, index, array) => {
            fixDef.density = this.options_.density || 0.2;
            fixDef.friction = this.options_.friction || 0.3;
            fixDef.restitution = this.options_.restitution || 0.1;
        });
        this.fixDefs.forEach(this.body.CreateFixture, this.body);
        this.body.SetUserData(this);
        this.body.SetPosition(new b2Vec2(this.shape.left * PIXEL_TO_METERS,
            this.shape.top * PIXEL_TO_METERS));
        this.body.SetAngle(fabric.util.degreesToRadians(this.shape.angle));
    }

    public getPosition(inPixel: boolean = false): b2Vec2 {
        if (inPixel) {
            return new b2Vec2(this.shape.left * PIXEL_TO_METERS, this.shape.top * PIXEL_TO_METERS);
        }
        let out: b2Vec2 = b2Vec2.ZERO;
        b2Vec2.MulSV(METERS_TO_PIXEL, this.bodyDef.position, out);
        return out;
    }

    set position(position: b2Vec2) {
        this.bodyDef.position = position.SelfMul(PIXEL_TO_METERS);
    }

    public setPrepOptions() {
        this.shape.selectable = false;
        this.bodyDef.position = this.initOptions.position;
        this.bodyDef.angle = this.initOptions.angle;
        this.shape.left = this.bodyDef.position.x * METERS_TO_PIXEL;
        this.shape.top = this.bodyDef.position.y * METERS_TO_PIXEL;
        this.shape.angle = fabric.util.radiansToDegrees(this.bodyDef.angle);
    }

    public setMovingOptions() {
        this.shape.selectable = this.initOptions.selectable;
    }

    public setRunOptions(): void {
        this.shape.selectable = false;
    }

    setSelectable(is: boolean = true) {
        this.shape.set('selectable', is);
    }

    public update(): void {
        this.shape.set('left', this.body.GetPosition().x * METERS_TO_PIXEL);
        this.shape.set('top', this.body.GetPosition().y * METERS_TO_PIXEL);
        this.shape.set('angle', fabric.util.radiansToDegrees(this.body.GetAngle()));
        this.shape.setCoords();
    }

    public getKind(): string {
        return 'abstract body';
    }

    get type() {
        return this.bodyDef.type;
    }

    public toJSON(): JSONBody {
        throw Error('Method not implemented');
    }

    public resetPattern(): void {
        this.shape.setPatternFill(
            {
                source: this.pattern.getElement(),
                repeat: 'repeat',
            });
    }

    public setPattern(img: HTMLImageElement): void {
        this.pattern = new fabric.Image(img);
        if (this.shape instanceof fabric.Group) {
            (<fabric.Group>this.shape).getObjects().forEach((shape, i, j) => {
                this.pattern.scaleToHeight(shape.height);
                this.pattern.scaleToWidth(shape.width);
                shape.setPatternFill({source: this.pattern.getElement()});
            });
        } else {
            this.pattern.scaleToHeight(this.shape.height);
            this.pattern.scaleToWidth(this.shape.width);
            this.shape.setPatternFill({source: this.pattern.getElement(), repeat: 'repeat'});
        }
        this.shape.opacity = 1;
        console.log(this.shape);
    }

    public setColorFilter(color: string): void {
        this.pattern.filters.pop();
        this.pattern.filters.push(new fabric.Image.filters.BlendColor(
            {
                color: color,
            }));
        this.pattern.applyFilters();
        this.shape.setPatternFill(
            {
                source: this.pattern.getElement(),
                repeat: 'repeat',
            });
    }
}

export class RectBody extends Body {
    private size: b2Vec2;
    private fixture: b2FixtureDef;
    private options: Options;

    constructor(position: b2Vec2 = b2Vec2.ZERO, angle: number = 0, size: b2Vec2 = new b2Vec2(50, 50), option: Options = {}) {

        let bodyDef = new b2BodyDef();
        b2Vec2.MulVS(position, PIXEL_TO_METERS, bodyDef.position);

        bodyDef.angle = fabric.util.degreesToRadians(angle);

        let shape = new fabric.Rect({
            left: position.x,
            top: position.y,
            width: size.x,
            height: size.y,
            angle: angle,
            opacity: option.opacity || 0.7,
            selectable: option.selectable && true,
        });
        super(bodyDef, [], shape, option);
        this.size = size;
        this.options = option;
    }

    getKind(): string {
        return 'rect';
    }

    Create(world: b2World) {
        let fixDef = new b2FixtureDef();
        fixDef.shape = new b2PolygonShape()
            .SetAsBox(
                (this.shape as fabric.Rect).width * PIXEL_TO_METERS / 2 * this.shape.scaleX,
                (this.shape as fabric.Rect).height * PIXEL_TO_METERS / 2 * this.shape.scaleY);

        if (this.options.sensor) {
            fixDef.filter.categoryBits = this.options.keyBodyID;
            fixDef.filter.maskBits = this.options.keyBodyID | KeyBodies.NOT_KEY_BODY;
        }
        this.fixDefs = [fixDef];
        this.fixture = fixDef;
        super.Create(world);
    }

    toJSON(): JSONBody {
        let json: any = {};
        json.playerID = this.owned;
        json.position = {
            x: this.bodyDef.position.x,
            y: this.bodyDef.position.y,
        };
        json.angle = this.bodyDef.angle;
        json.size = this.size;
        json.size.x = json.size.x * PIXEL_TO_METERS;
        json.size.y = json.size.y * PIXEL_TO_METERS;
        json.options = {
            density: this.fixture.density,
            restitution: this.fixture.restitution,
            friction: this.fixture.friction,
            sensor: this.fixture.isSensor,
            keyBodyID: this.initOptions.keyBodyID,
        };
        json.type = this.bodyDef.type;
        return json;
    }
}


export class CircleBody extends Body {
    private fixture: b2FixtureDef;
    private options: Options;

    constructor(position: b2Vec2 = b2Vec2.ZERO, radius: number = 50, option: Options = {}) {
        let bodyDef = new b2BodyDef();
        b2Vec2.MulVS(position, PIXEL_TO_METERS, bodyDef.position);

        let shape = new fabric.Circle({
            left: position.x,
            top: position.y,
            radius: radius,
            angle: 0,
            opacity: option.opacity || 0.7,
            selectable: option.selectable || false,
        });
        super(bodyDef, [], shape, option);
        this.options = option;
    }

    get radius(): number {
        return this.fixDefs[0].shape.m_radius * METERS_TO_PIXEL;
    }

    set radius(r: number) {
        this.fixDefs[0].shape.m_radius = r * PIXEL_TO_METERS;
    }

    getKind(): string {
        return 'circle';
    }

    Create(world: b2World) {
        let fixDef = new b2FixtureDef();
        fixDef.shape = new b2CircleShape((this.shape as fabric.Circle).radius * PIXEL_TO_METERS * this.shape.scaleX);
        this.fixture = fixDef;

        if (this.options.keyBodyID) {
            fixDef.filter.categoryBits = this.options.keyBodyID;
            fixDef.filter.maskBits = this.options.keyBodyID | KeyBodies.NOT_KEY_BODY;
        }
        this.fixDefs = [fixDef];
        super.Create(world);
    }

    toJSON(): JSONBody {
        let json: any = {};
        json.playerID = this.owned;
        json.position = {
            x: this.bodyDef.position.x,
            y: this.bodyDef.position.y,
        };
        json.angle = this.bodyDef.angle;
        json.radius = this.fixture.shape.m_radius;
        json.options = {
            density: this.fixture.density,
            restitution: this.fixture.restitution,
            friction: this.fixture.friction,
            sensor: this.fixture.isSensor,
            keyBodyID: this.initOptions.keyBodyID,
        };
        json.type = this.bodyDef.type;
        return json;
    }

}

export class BucketBody extends Body {
    private config: BucketConfig;
    private options: Options;

    constructor(position: b2Vec2 = b2Vec2.ZERO, config: BucketConfig = {}, angle = 0, option: Options = {}) {
        let wallThickness = (config.wallThickness || 10) * PIXEL_TO_METERS;
        let bottomLength = (config.bottomLength || 70) * PIXEL_TO_METERS;
        let height = (config.height || 100) * PIXEL_TO_METERS;


        let bodyDef = new b2BodyDef();

        b2Vec2.MulVS(position, PIXEL_TO_METERS, bodyDef.position);

        let sensor = new fabric.Rect({
            width: config.bottomLength,
            height: config.height - config.wallThickness,
            originX: 'center',
            originY: 'center',
            left: config.wallThickness + config.bottomLength / 2,
            top: config.height / 2 - config.wallThickness / 2,
            fill: 'blue',
            opacity: 0.0,
        });

        let left = new fabric.Rect({
            width: config.wallThickness,
            height: config.height,
            fill: option.color || 'red',
            opacity: option.opacity || 0.7,
            left: config.wallThickness / 2,
            top: config.height / 2,
            originX: 'center',
            originY: 'center',
            stroke: null,
            selectable: true,
        });

        let down = new fabric.Rect({
            width: config.bottomLength,
            height: config.wallThickness,
            left: config.wallThickness + config.bottomLength / 2,
            top: config.height - config.wallThickness / 2,
            originX: 'center',
            originY: 'center',
            opacity: option.opacity || 0.7,
            stroke: null,
        });

        let right = new fabric.Rect({
            width: config.wallThickness,
            height: config.height,
            left: config.wallThickness + config.bottomLength + config.wallThickness / 2,
            top: config.height / 2,
            originX: 'center',
            originY: 'center',
            opacity: option.opacity || 0.7,
            stroke: null,
        });

        let group = new fabric.Group([left, down, right, sensor], {
            originX: 'center',
            originY: 'center',
            left: position.x,
            top: position.y,
            angle: angle,
            // fill: 'red',
            stroke: null,
            subTargetCheck: true,
            selectable: false,
        });

        super(bodyDef, [], group, option);
        this.config = config;
        this.config.height = height;
        this.config.wallThickness = wallThickness;
        this.config.bottomLength = bottomLength;
        this.options = option;
    }

    getKind(): string {
        return 'bucket';
    }

    Create(world: b2World) {
        let group = (this.shape as fabric.Group);

        let wallThickness = (this.config.wallThickness || 10) * this.shape.scaleX;
        let bottomLength = (this.config.bottomLength || 70) * this.shape.scaleX;
        let height = (this.config.height || 100) * this.shape.scaleY;


        let fixDefDown = new b2FixtureDef();
        let fixDefLeft = new b2FixtureDef();
        let fixDefRight = new b2FixtureDef();
        let fixDefSensor = new b2FixtureDef();

        let fixDefs: b2FixtureDef[] = [fixDefLeft, fixDefDown, fixDefRight, fixDefSensor];

        fixDefLeft.shape = new b2PolygonShape()
            .SetAsBox(
                wallThickness / 2,
                height / 2,
                new b2Vec2(-(bottomLength + wallThickness) / 2, 0));

        fixDefDown.shape = new b2PolygonShape()
            .SetAsBox(
                bottomLength / 2,
                wallThickness / 2,
                new b2Vec2(0, (height - wallThickness) / 2));

        fixDefRight.shape = new b2PolygonShape()
            .SetAsBox(
                wallThickness / 2,
                height / 2,
                new b2Vec2((bottomLength + wallThickness) / 2, 0),

            );

        fixDefSensor.shape = new b2PolygonShape()
            .SetAsBox(
                bottomLength / 2,
                (height - wallThickness) / 2,
                new b2Vec2(0, -wallThickness / 2),

            );

        fixDefSensor.isSensor = this.options.sensor || false;
        if (this.options.keyBodyID) {
            fixDefSensor.filter.categoryBits = this.options.keyBodyID;
            fixDefSensor.filter.maskBits = this.options.keyBodyID | KeyBodies.NOT_KEY_BODY;
        }
        this.fixDefs = fixDefs;
        super.Create(world);

    }

    toJSON(): JSONBody {
        let json: any = {};
        json.playerID = this.owned;
        json.position = {
            x: this.bodyDef.position.x,
            y: this.bodyDef.position.y,
        };
        json.size = {x: 1, y: 1};
        json.config = this.config;
        json.config.angle = 3;
        json.angle = this.bodyDef.angle;
        json.options = {
            density: this.fixDefs[0].density,
            restitution: this.fixDefs[0].restitution,
            friction: this.fixDefs[0].friction,
            sensor: this.fixDefs[3].isSensor,
            keyBodyID: this.initOptions.keyBodyID,
        };
        json.type = this.bodyDef.type;
        return json;
    }
}

export class CircleBucketBody extends Body {
    constructor(position: b2Vec2 = b2Vec2.ZERO, config: CircleBucketConfig = {}, option: Options = {}) {
        let wallThickness = (config.wallThickness || 10) * PIXEL_TO_METERS;
        let radius = (config.radius || 50) * PIXEL_TO_METERS;
        let fixDefs: b2FixtureDef[] = [];
        let shapes: fabric.Object[] = [];

        for (let i = -180; i < 20; i += 20) {
            let fixDef: b2FixtureDef = new b2FixtureDef();
            fixDef.shape = new b2PolygonShape()
                .SetAsBox(
                    2 * radius * Math.tan(Math.PI / 18) / 2,
                    wallThickness / 2,
                    new b2Vec2(radius * Math.cos(i * Math.PI / 180), radius * Math.sin(i * Math.PI / 180)),
                    (180 + i) * Math.PI / 180);
            fixDefs.push(fixDef);
            let shape = new fabric.Rect({
                width: 2 * (config.radius || 50) * Math.tan(Math.PI / 18),
                height: config.wallThickness || 10,
                fill: option.color || 'red',
                left: -(config.radius || 50) * Math.cos(i * Math.PI / 180),
                top: -(config.radius || 50) * Math.sin(i * Math.PI / 180),
                angle: (90 + i),
                originX: 'center',
                originY: 'center',
                opacity: option.opacity || 0.7,
                stroke: null,
            });
            shapes.push(shape);
        }

        let bodyDef: b2BodyDef = new b2BodyDef();
        b2Vec2.MulVS(position, PIXEL_TO_METERS, bodyDef.position);
        let group = new fabric.Group(shapes, {
            // originX: 'center',
            // originY: 'center',
            left: position.x,
            top: position.y,
            stroke: null,
            subTargetCheck: true,
            // selectable: true,
        });
        super(bodyDef, fixDefs, group, option);
    }
}