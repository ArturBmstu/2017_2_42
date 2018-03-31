import {b2Vec2} from '@flyover/box2d/Box2D/Box2D/Common/b2Math';
import {b2BodyType} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2Body';
import {b2World} from '@flyover/box2d/Box2D/Box2D/Dynamics/b2World';
import '../../../img/static_body_pattern.png';
import '../../../img/texture1.png';
import eventBus from '../../modules/eventBus';
import {Board} from '../board/board';
import {assignScaleConf, SCALE_COEFF_X, SCALE_COEFF_Y} from '../board/config';
import {BucketBody, CircleBody} from '../body/body';
import {Message, SnapMessage, StartMessage, SubscribeMessage} from './Message';
import {GameService} from './gameService';
import {FinishState, GameState, InitState, LoadState, PrepareState, RunningState} from './gameState';
import {Timer, TimerEvents} from './timer';


export interface MapMeta {
    id: number;
    name: string;
    level?: number;
    timer?: number;
    rating?: number;
    created?: string;
    preview?: string;
    players: number;
    playedTimes?: number;
}

let game: GameOnline;

export {game};

export abstract class Game {
    board: Board;
    timer: Timer;
    meta: MapMeta;
    gameService?: GameService;
    playerID?: number;
    _world: b2World;
    state: GameState;
    running: boolean;
    frame: number;

    abstract load(canvas: string | HTMLCanvasElement): void;

    abstract prepare(): void;

    abstract finish(success: boolean): void;

    abstract start(): void;

    abstract run?(): void;

    abstract sendSnapToServer?(): void;
}

export type States = 'loadBoards' | 'run' | 'pause' | 'successfulFinish' | 'failedFinish';

export enum GameEvents {
    subscribe = 'subscribe',
    subscribed = 'subscribed',
    loadSuccess = 'loadSuccess',
    loadFailed = 'loadFailed',
    start = 'start',
    started = 'started',
    quit = 'quit',
    finish = 'finish',
    win = 'win',
    lose = 'lose',
}


export class GameOnline implements Game {
    public playerID?: number;
    public board: Board;
    public timer: Timer;
    public meta: MapMeta;
    public _world: b2World;
    public gameService?: GameService;
    public state: GameState;
    public frame: number = 1;
    public running: boolean;

    constructor(mapMeta: MapMeta) {
        this.meta = mapMeta;
        this._world = new b2World(new b2Vec2(0, 10));
        this._world.SetContinuousPhysics(false);
        this.gameService = new GameService(this);
        this.state = new InitState(this);

        const cb = () => {
          let msg = new SubscribeMessage(this, this.meta.id);
          msg.HandleRequest();
          eventBus.off('game', <string>GameEvents.subscribe, cb);
        };
        eventBus.on('game', <string>GameEvents.subscribe, cb);
        const startcb = () => {
          eventBus.off('game', <string>GameEvents.start, startcb);
          let startMsg = new StartMessage(game);
          startMsg.HandleRequest();
        };
        eventBus.on('game', <string>GameEvents.start, startcb );
        eventBus.on('game', <string>GameEvents.quit, () => {
            this.gameService.closed = true;
            this.gameService.closeConnection();
            game = null;
        });
        eventBus.on('timer', TimerEvents.finished, () => {
            this.board.timerText.text = '00.00';
        });
    }

    public static Create(mapMeta: MapMeta): GameOnline {
        game = new GameOnline(mapMeta);
        return game;
    }

    public static Destroy() {
        game = null;
    }

    public load(canvas: HTMLCanvasElement | string): void {
        this.timer = new Timer(this.meta.timer);
        this.state.onLoad(canvas);
    }

    public prepare(): void {
        this.state.onPrepare();
    }

    public finish(success: boolean) {
        if (success) {
            this.state.onSuccessFinish();
        } else {
            this.state.onFailedFinish();
        }
    }

    public start(): void {
        this.state.onRun();
        this.running = true;
        this.timer.start();
        this.run();
    }

    public run?(): void {
        if (this.running) {
            for (let body = this._world.GetBodyList(); body.GetNext() !== null; body = body.GetNext()) {
                let b = body.GetUserData();
                if (b.isDeleted) {
                    this._world.DestroyBody(body);
                    this.board.canvas.remove(b.shape);
                } else {
                    b.update();
                    this.board.canvas.renderAll();
                }
            }
            if (this.frame % 2 === 0 && !(this.state instanceof FinishState)) {
                this.sendSnapToServer();
                this.timer.step(this.frame);
            }
            this._world.Step(1 / 60, 10, 10);
            this._world.ClearForces();
            requestAnimationFrame(this.run.bind(this));
            this.frame++;
        } else {
            for (let body = this._world.GetBodyList(); body.GetNext() !== null; body = body.GetNext()) {
                this._world.DestroyBody(body);
            }
        }
    }

    public sendSnapToServer?() {
        let data: any = {
            frame: this.frame,
            bodies: [],

        };
        for (let body = this._world.GetBodyList(); body.GetNext() !== null; body = body.GetNext()) {
            if (body.GetType() === b2BodyType.b2_dynamicBody && !body.GetUserData().isDeleted) {
                let body_data: any = {};
                body_data.id = body.GetUserData().ID;
                body_data.position = {};
                body_data.position.x = body.GetPosition().x / SCALE_COEFF_X;
                body_data.position.y = body.GetPosition().y / SCALE_COEFF_Y;
                body_data.angle = body.GetAngle();
                body_data.linVelocity = {};
                body_data.linVelocity.x = body.GetLinearVelocity().x / SCALE_COEFF_X;
                body_data.linVelocity.y = body.GetLinearVelocity().y / SCALE_COEFF_Y;
                body_data.angVelocity = body.GetAngularVelocity();
                data.bodies.push(body_data);
            }
        }
        let msg: SnapMessage = new SnapMessage(this, data);
        msg.HandleRequest();
    }
}