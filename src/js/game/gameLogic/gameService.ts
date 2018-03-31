import {b2Vec2} from '@flyover/box2d/Box2D/Box2D/Box2D';
import {b2BodyType} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Body';
import 'fabric';
import {Board} from '../board/board';
import {assignScaleConf, SCALE_COEFF_X, SCALE_COEFF_Y} from '../board/config';
import {
    Body, BucketBody, CircleBody, CircleBucketBody, RectBody,
} from '../body/body';
import {BucketConfig, KeyBodies, METERS_TO_PIXEL, Options} from '../body/config';
import {Message} from './Message';
import {Game, GameOnline} from './gameOnline';
import {GameEvents} from './gameOnline';

declare const fabric: any;

const PATH_GET_MAP = 'https://physicsio.tech/backend/api/game/map/';
const PATH_WEBSOCKET = 'wss://physicsio.tech/backend/handler';

export class GameService {
    private socket: WebSocket;
    public closed: boolean;
    private game: GameOnline;
    private count_conn = 1;

    constructor(game: GameOnline) {
        this.game = game;
        this.socket = new WebSocket(PATH_WEBSOCKET);
        this._initWebSocket();
    }

    private _initWebSocket(): void {
        this.socket.onmessage = (ev) => {
            this.handleSocketResponse(ev);
        };
        this.socket.onclose = (event) => {
            if (event.wasClean) {
                console.log('Соединение закрыто чисто');
            } else {
                console.log('Обрыв соединения');
            }
            console.log('Код: ' + event.code + ' причина: ' + event.reason);
        };
    }

    public closeConnection() {
        this.socket.close();
    }

    public sendSocketMessage(message: string | Object) {
        if (!this.closed) {
            if (this.socket.readyState === WebSocket.OPEN) {
                if (message instanceof Object) {
                    this.socket.send(JSON.stringify(message));
                } else {
                    this.socket.send(message);
                }
            } else {
                let id = setInterval(() => {
                    console.log('Try connect...');
                    if (this.count_conn === 5 || this.closed) {
                        clearInterval(id);
                        this.count_conn = 1;
                    }
                    this.socket = new WebSocket(PATH_WEBSOCKET);
                    this.count_conn++;
                    this.socket.onopen = (ev) => {
                        console.log('Connect OK');
                        clearInterval(id);
                        this.count_conn = 1;
                        this._initWebSocket();
                        this.sendSocketMessage(message);
                    };
                }, 2000);

            }
        }

    }

    public handleSocketResponse(ev: MessageEvent) {
        let message: Message = Message.Create(this.game, ev.data);
        message.HandleResponse();
    }

    public createMap(c: HTMLCanvasElement | string): Board {
        let canvas = new fabric.Canvas(c);
        let bodies: Body[] = [];
        let groundDown = new RectBody(
            new b2Vec2(canvas.getWidth() / 2, canvas.getHeight() - 7.5),
            0,
            new b2Vec2(canvas.getWidth() - 30, 15),
            {
                keyBodyID: KeyBodies.NOT_KEY_BODY,
            },
        );
        bodies.push(groundDown);

        // let sensor = new RectBody(
        //     new b2Vec2(9 * canvas.getWidth() / 10, canvas.getHeight() - 110),
        //     0,
        //     new b2Vec2(70, 70),
        //     {
        //         key: KeyBodies.KEY_BODY_1,
        //         sensor: true,
        //     },
        // );
        // bodies.push(sensor);
        let groundRight = new RectBody(
            new b2Vec2(canvas.getWidth() - 7.5, canvas.getHeight() / 2),
            0,
            new b2Vec2(15, canvas.getHeight()),
            {
                keyBodyID: KeyBodies.NOT_KEY_BODY,
                selectable: false,
            });
        bodies.push(groundRight);
        let groundLeft = new RectBody(
            new b2Vec2(7.5, canvas.getHeight() / 2),
            0,
            new b2Vec2(15, canvas.getHeight()),
            {
                keyBodyID: KeyBodies.NOT_KEY_BODY,
                selectable: false,
            },
        );
        bodies.push(groundLeft);
        let circle = new CircleBody(new b2Vec2(550, 100), 20, {
            bodyType: b2BodyType.b2_dynamicBody,
            restitution: 0.5,
            collision: true,
            keyBodyID: KeyBodies.KEY_BODY_1,
            selectable: false,
        });
        bodies.push(circle);

        let leftRect = new RectBody(new b2Vec2(500, 400), 30, new b2Vec2(200, 20), {
            restitution: 0.5,
            color: 'green',
            opacity: 0.5,
            collision: false,
            selectable: true,
            keyBodyID: KeyBodies.NOT_KEY_BODY,
            playerID: 1,
        });
        bodies.push(leftRect);
        let rightRect = new RectBody(new b2Vec2(canvas.getWidth() - 500, 400), -30, new b2Vec2(200, 20), {
            restitution: 0.5,
            color: 'green',
            opacity: 0.5,
            collision: false,
            selectable: true,
            keyBodyID: KeyBodies.NOT_KEY_BODY,
            playerID: 2,
        });
        bodies.push(rightRect);

        let bucket = new BucketBody(
            new b2Vec2(canvas.getWidth() / 2,
                canvas.getHeight() - 100),
            {
                wallThickness: 10,
                bottomLength: 45,
                height: 150,
            },
            0,
            {
                bodyType: b2BodyType.b2_dynamicBody,
                keyBodyID: KeyBodies.KEY_BODY_1,
                sensor: true,
            });
        bodies.push(bucket);

        // let bucket1 = new BucketBody(
        //     new b2Vec2(canvas.getWidth() / 4,
        //         canvas.getHeight() - 120),
        //     {
        //         wallThickness: 20,
        //         bottomLength: 100,
        //         height: 200,
        //     },
        //     {
        //         bodyType: b2BodyType.b2_dynamicBody,
        //         color: 'green',
        //         key: KeyBodies.KEY_BODY_1,
        //         sensor: true,
        //     });
        // bodies.push(bucket1);*/

        // let circleTop = new CircleBody(
        //     new b2Vec2(canvas.getWidth() / 2, 10),
        //     5,
        //     {
        //         bodyType: b2BodyType.b2_dynamicBody,
        //         key: KeyBodies.KEY_BODY_1,
        //     });
        // bodies.push(circleTop);
        // let circleTwo = new CircleBody(
        //     new b2Vec2(canvas.getWidth() / 2, 25),
        //     5,
        //     {
        //         bodyType: b2BodyType.b2_dynamicBody,
        //         key: KeyBodies.NOT_KEY_BODY,
        //     });
        // bodies.push(circleTwo);
        //
        // for (let i = 0; i < 30; i++) {
        //     let circle = new CircleBody(
        //         new b2Vec2(1200 * Math.random() + 40, 680 * Math.random()),
        //         Math.random() * 20,
        //         {
        //             bodyType: b2BodyType.b2_dynamicBody,
        //             key: KeyBodies.NOT_KEY_BODY,
        //         });
        //     bodies.push(circle);
        // }

        let meta = {
            'level': 3,
            'timer': 10,
            'preview': 'localhost',
            'players': 2,
        };

        let obj: any = {
            bodies: [],
            joints: [],
        };

        bodies.forEach((body, index, array) => {
            let info: any = {};
            info.id = index;
            info.kind = body.getKind();
            info.playerID = body.owned;
            info.selectable = body.initOptions.selectable;
            info.data = body.toJSON();
            obj.bodies.push(info);
        });

        let body = {meta: meta, data: obj};

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        fetch('https://physicsio.tech/backend/api/game/map/12233sss/create', {
            body: JSON.stringify(body),
            headers: headers,
            method: 'POST',
        })
            .then((resp) => resp.json())
            .then((resp) => console.log(resp));

        console.log(JSON.stringify(body, null, 2));

        let mapBody: Map<number, Body> = new Map<number, Body>();
        bodies.forEach((value, index, array) => {
            mapBody.set(index, value);
        });
        return new Board(mapBody, canvas, this.game);
    }


    public async loadBoard(canvas: HTMLCanvasElement | string, id: number): Promise<any> {
        let cvs: fabric.Canvas = new fabric.Canvas(canvas);

        assignScaleConf(cvs.getWidth(), cvs.getHeight());

        this.game._world.SetGravity(new b2Vec2(0, 10 * SCALE_COEFF_Y));

        let mapExists: boolean = false;
        let bodies: Map<number, Body> = new Map<number, Body>();
        let mapString;
        let map;

        if (localStorage.getItem(`${id}`) != null) {
            mapExists = true;
            mapString = localStorage.getItem(`${id}`);
            map = JSON.parse(mapString);
        } else {
            let resp;
            try {
                let headers = new Headers();
                headers.append('Content-Type', 'application/json');
                resp = await fetch(PATH_GET_MAP + id, {
                    method: 'GET',
                    headers: headers,
                });
            }
            catch (e) {
                console.log('Network pizdec');
                return Promise.reject({});
            }
            try {
                map = await resp.json();
                console.log(map);
            } catch (e) {
                console.log(e);
                return Promise.reject({});
            }
        }

        if (!mapExists) {
            localStorage.setItem(`${id}`, JSON.stringify(map));
        }

        for (let body of map.bodies) {
            let options: Options = {};
            options = body.data.options;
            options.selectable = body.selectable;
            options.bodyType = body.data.type;
            options.keyBodyID = body.data.options.keyBodyID;
            options.playerID = body.playerID;
            body.data.position.x *= SCALE_COEFF_X;
            body.data.position.y *= SCALE_COEFF_Y;
            switch (body.kind) {
                case 'rect':
                    body.data.size.x *= SCALE_COEFF_X;
                    body.data.size.y *= SCALE_COEFF_Y;
                    let rect = new RectBody(
                        b2Vec2.MulVS(body.data.position, METERS_TO_PIXEL, new b2Vec2()),
                        fabric.util.radiansToDegrees(body.data.angle),
                        b2Vec2.MulVS(body.data.size, METERS_TO_PIXEL, new b2Vec2()),
                        options);
                    rect.ID = body.id;
                    bodies.set(body.id, rect);
                    break;
                case 'circle':
                    body.data.radius *= SCALE_COEFF_Y;
                    let circle = new CircleBody(
                        b2Vec2.MulVS(body.data.position, METERS_TO_PIXEL, new b2Vec2()),
                        body.data.radius * METERS_TO_PIXEL,
                        options);
                    circle.ID = body.id;
                    bodies.set(body.id, circle);
                    break;
                case 'bucket':
                    let config: BucketConfig = {};
                    config = body.data.config;
                    config.bottomLength *= (METERS_TO_PIXEL * SCALE_COEFF_X);
                    config.height *= (METERS_TO_PIXEL * SCALE_COEFF_Y);
                    config.wallThickness *= (METERS_TO_PIXEL * SCALE_COEFF_X);

                    let bucket = new BucketBody(
                        b2Vec2.MulVS(body.data.position, METERS_TO_PIXEL, new b2Vec2()),
                        config,
                        fabric.util.radiansToDegrees(body.data.angle),
                        options);
                    bucket.ID = body.id;
                    bodies.set(body.id, bucket);
                    break;
            }
        }
        let circleBucket = new CircleBucketBody(new b2Vec2(cvs.getWidth() / 4,
                cvs.getHeight() - 120),
            {},
            {},
        );
        // bodies.set(circleBucket.ID, circleBucket);
        let board = new Board(bodies, cvs, this.game);
        // let board = this.game.gameService.createMap(canvas);
        return Promise.resolve(board);
    }
}