import {b2Vec2} from 'box2d.ts/Box2D/Box2D/Common/b2Math';
import {b2World} from 'box2d.ts/Box2D/Box2D/Dynamics/b2World';
import {Board} from '../board/board';
import {BucketBody, CircleBody} from '../body/body';
import {GameService} from './gameService';
import {FinishState, GameState, InitState, LoadState, PrepareState, RunningState} from './gameState';
import {Message, SnapMessage, SubscribeMessage} from './Message';
import {b2BodyType} from 'box2d.ts/Box2D/Box2D/Dynamics/b2Body';
import {Timer} from './timer';
import {assignScaleConf, SCALE_COEFF_X, SCALE_COEFF_Y} from '../board/config';
import {Game, game} from './gameOnline';


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

export type States = 'loadBoards' | 'run' | 'pause' | 'successfulFinish' | 'failedFinish';

export enum GameEvents {
    subscribe = 'subscribe',
    subscribed = 'subscribed',
    loadSuccess = 'loadSuccess',
    loadFailed = 'loadFailed',
    start = 'start',
    started = 'started',
}


export class GameOffline implements Game {
    gameService: GameService;
    playerID: number;
    public board: Board;
    public timer: Timer;
    public meta: MapMeta;
    public _world: b2World;
    // public gameService: GameService;
    public state: GameState;
    public frame: number = 1;
    public running: boolean;

    constructor(mapMeta: MapMeta) {
        this.meta = mapMeta;
        this._world = new b2World(new b2Vec2(0, 10));
        this._world.SetContinuousPhysics(false);
        // this.gameService = new GameService(this);
        this.state = new InitState(this);
    }

    public load(canvas: HTMLCanvasElement | string): void {
        this.timer = new Timer(this.meta.timer);
        this.state.onLoad(canvas);
    }

    public static Create(mapMeta: MapMeta): GameOffline {
        game = new GameOffline(mapMeta);
        return game;
    }

    public static Destroy() {
        game = null;
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

    public run(): void {
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
}