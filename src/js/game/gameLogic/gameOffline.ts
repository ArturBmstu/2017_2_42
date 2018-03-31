import {b2Vec2} from 'box2d.ts/Box2D/Box2D/Common/b2Math';
import {b2World} from 'box2d.ts/Box2D/Box2D/Dynamics/b2World';
import eventBus from '../../modules/eventBus';
import {Board} from '../board/board';
import {assignScaleConf, SCALE_COEFF_X, SCALE_COEFF_Y} from '../board/config';
import {BucketBody, CircleBody} from '../body/body';
import {Message, SnapMessage, SubscribeMessage} from './Message';
import {Game} from './gameOnline';
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

  static game: GameOffline;

  constructor(mapMeta: MapMeta) {
    this.meta = mapMeta;
    this._world = new b2World(new b2Vec2(0, 10));
    this._world.SetContinuousPhysics(false);
    this.gameService = new GameService(this);
    this.state = new InitState(this);
    const cb = () => {
      eventBus.emit('game', <string>GameEvents.subscribed, {});
      eventBus.off('game', <string>GameEvents.subscribe, cb);
    };
    eventBus.on('game', <string>GameEvents.subscribe, cb);

    const startcb = () => {
      this.state = new RunningState(this);
      this.start();
      eventBus.off('game', <string>GameEvents.start, startcb);
    };
    eventBus.on('game', <string>GameEvents.start, startcb);

    eventBus.on('timer', TimerEvents.finished, () => {
      if (location.pathname.startsWith('/offline')) {
        eventBus.emit('game', 'lose');
      }
      this.board.timerText.text = '00.00';
    });
  }


  public load(canvas: HTMLCanvasElement | string): void {
    this.timer = new Timer(this.meta.timer);
    this.state.onLoad(canvas);
  }


  public static Create(mapMeta: MapMeta): GameOffline {
    GameOffline.game = new GameOffline(mapMeta);
    return GameOffline.game;
  }

  public static Destroy() {
    GameOffline.game = null;
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