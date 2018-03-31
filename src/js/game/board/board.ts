import {b2World} from 'box2d.ts/Box2D/Box2D/Dynamics/b2World';
import 'fabric';
import eventBus from '../../modules/eventBus';
import {Body} from '../body/body';
import {MovingMessage} from '../gameLogic/Message';
import {GameOnline} from '../gameLogic/gameOnline';
import {
    assignScaleConf, patterns_path, BACKGROUND_IMAGE, DEFAULT_SIZE_X, DEFAULT_SIZE_Y, SCALE_COEFF_X,
    SCALE_COEFF_Y,
} from './config';

declare const fabric: any;

export class Board {
    public bodies: Map<number, Body>;
    public canvas: fabric.Canvas;
    private promise: Promise<any>;
    private patterns: Map<number, fabric.Image>;
    public timerText: any = new fabric.Text('Hello', {
        top: 100,
        fontSize: 40 * SCALE_COEFF_X,
        left: 100,
        selectable: false,
        fill: 'white',
        originX: 'center',
        originY: 'center',
    });

    private game: GameOnline;

    constructor(bodies: Map<number, Body>, canvasElem: fabric.Canvas, game: GameOnline) {
        this.bodies = bodies;
        this.canvas = canvasElem;
        this.game = game;
        this.patterns = new Map<number, fabric.Image>();
        this.tuneCanvas();
        this.loadPatterns();
        this.setPatterns();
        this.registerEvent();
    }


    private registerEvent(): void {
        let movingHandler = (option) => {
            let isIntersect: boolean = false;
            this.canvas.forEachObject((obj) => {
                if (obj === option.target) return;
                option.target.setCoords();
                if (option.target.intersectsWithObject(obj)) {
                    isIntersect = true;
                }
            });
            let pattern: fabric.Image = this.patterns.get(option.target.toObject().body.type) as fabric.Image;
            if (isIntersect) {
                if (pattern.filters.length === 0) {
                    pattern.applyFilters([new fabric.Image.filters.BlendColor({color: '#FF4444'})]);
                    option.target.setPatternFill({source: pattern.getElement()});
                }
            } else {
                option.target.toObject().body.resetPattern();
            }
            isIntersect = false;

            if (option.target.left < 0 || option.target.top < 0 ||
                option.target.top > this.canvas.getHeight() || option.target.left > this.canvas.getWidth()) {
                option.target.left = this.canvas.getWidth() / 2;
                option.target.top = this.canvas.getHeight() / 2;
                option.target.setCoords();
                this.canvas.renderAll();
            }
            option.target.setCoords();

            if (this.game.meta.players !== 1) {
                let data: any = {};
                data.snap = {};
                data.snap.id = option.target.toObject().body.ID;
                data.snap.position = {
                    x: option.target.left / SCALE_COEFF_X,
                    y: option.target.top / SCALE_COEFF_Y,
                };
                data.snap.angle = option.target.angle;
                let msg: MovingMessage = new MovingMessage(this.game, data);
                msg.HandleRequest();
            }

        };
        this.canvas.on('object:moving', movingHandler);
        this.canvas.on('object:rotating', movingHandler);
    }

    public prepare(): void {
        this.canvas.clear();
        eventBus.on('timer', 'update', (timer) => {
            this.timerText.text = timer.toString();
        });
        this.timerText.text = this.game.timer.toString();
        this.timerText.top = 30 * SCALE_COEFF_X;
        this.timerText.left = this.canvas.getWidth() - 120;
        this.canvas.add(this.timerText);
        this.canvas.renderAll();
        for (let body of this.bodies.values()) {
            body.setPrepOptions();
            this.promise.then(() => this.canvas.add(body.shape));
        }
        // let myfont = new FontFaceObserver('KGTenThousandReasons');
        // myfont.load()
        //     .then(() => {
        //         this.timerText.set('fontFamily', 'KGTenThousandReasons');
        //         this.canvas.add(this.timerText);
        //         this.canvas.renderAll();
        //     }).catch(function (e) {
        //     console.log(e);
        //     alert('font loading failed');
        // });
        this.canvas.add(this.timerText);
        this.promise.then(() => {
            this.game.board.setOwn();
            this.game.board.setPlayersColor();
            this.game.board.setMovingOptions();
        });
    }

    public setMovingOptions(): void {
        for (let body of this.bodies.values()) {
            body.setMovingOptions();
        }
    }

    public setOwn(): void {
        if (location.pathname.startsWith('/online')) {
          for (let body of this.bodies.values()) {
            if (body.initOptions.playerID !== null) {
              body.owned = this.game.playerID === body.initOptions.playerID;
            }
            body.initOptions.selectable = body.owned;
          }
        } else {
          for (let body of this.bodies.values()) {
            if (body.initOptions.playerID !== null) {
              body.owned = true;
            }
            body.initOptions.selectable = body.owned;
          }
          }
    }

    public create(world: b2World): void {
        this.canvas.discardActiveObject();
        this.bodies.forEach((body, index, array) => {
            body.setRunOptions();
            body.Create(world);
        });
    }

    private tuneCanvas() {
        this.canvas.selection = false;
    }

    private setPatterns() {
        this.promise.then(() => {
            for (let body of this.bodies.values()) {
                let img: HTMLImageElement = this.patterns.get(body.type).getElement();
                body.setPattern(img);
            }
        });
    }

    private loadPatterns(): void {
        let promises = [];
        patterns_path.forEach((pattern_name, key, map) => {
            promises.push(new Promise((resolve) => {
                fabric.util.loadImage('/img/' + pattern_name, (img) => {
                    if (img === null) {
                        console.log('Failed to load image!');
                        eventBus.emit('game', 'patternLoadFailed');
                        return;
                    }
                    img = new fabric.Image(img);
                    img.scaleToWidth(500);
                    img.scaleToHeight(500);
                    this.patterns.set(key, img);
                    resolve();
                });
            }));
        });
        this.promise = Promise.all(promises);
    }

    public setPlayersColor() {
        for (let body of this.bodies.values()) {
            if (body.owned !== undefined) {
                if (body.owned) {
                    body.setColorFilter('#2E97BD');
                    this.canvas.renderAll();
                } else {
                    body.setColorFilter('#FFCF56');
                    this.canvas.renderAll();
                }
            }
            if (body.isKeyBody) {
                // body.setColorFilter('#124E78');

            }
        }
    }
}