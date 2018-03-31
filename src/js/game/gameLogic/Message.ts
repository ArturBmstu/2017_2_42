import {b2Vec2} from '@flyover/box2d/Box2D/Box2D/Common/b2Math';
import eventBus from '../../modules/eventBus';
import {SCALE_COEFF_X, SCALE_COEFF_Y} from '../board/config';
import {Game, GameOnline} from './gameOnline';
import {GameEvents} from './gameOnline';
import {FinishState, RunningState} from './gameState';


export enum Messages {
    BoardMessage = 'BoardMessage',
    MovingMessage = 'MovingMessage',
    SnapMessage = 'SnapMessage',
    StartedMessage = 'StartedMessage',
    SubscribeMessage = 'SubscribeMessage',
    StartMessage = 'StartMessage',
    FinishedMessage = 'FinishedMessage',
    FinishMessage = 'FinishMessage',
}

export abstract class Message {
    protected game: GameOnline;
    protected class: string;

    static Create(game: GameOnline, msg: string): Message {
        let message;
        try {
            message = JSON.parse(msg);
        } catch (err) {
            console.error(err);
            console.log(msg);
            eventBus.emit('game', 'parseFailed', {'msg': 'parseFailed at "CreateMessage"'});
            return;
        }

        if (message && message.class === Messages.MovingMessage) {
            return new MovingMessage(game, message);
        } else if (message && message.class === Messages.BoardMessage) {
            return BoardMessage.fromRecievedData(game, message);
        } else if (message && message.class === Messages.StartedMessage) {
            return new StartedMessage(game, message);
        } else if (message && message.class === Messages.SnapMessage) {
            return new SnapMessage(game, message);
        } else if (message && message.class === Messages.FinishedMessage) {
            return new FinishedMessage(game, message);
        }
    }

    abstract HandleResponse();

    abstract HandleRequest();

}


export class BoardMessage extends Message {

    static fromRecievedData(game: GameOnline, msg: any): Message {
        let playerID = msg.playerID;
        console.log(msg);
        return new this(game, playerID, msg.friend, msg.level);
    }

    private playerID: number;
    private friend: string;
    private level: number;


    constructor(game: GameOnline, playerID: number, friend: string, level_friend: number) {
        super();
        this.game = game;
        this.playerID = playerID;
        this.friend = friend;
        this.level = level_friend;
        this.class = this.constructor.name;
    }

    HandleRequest() {
        throw new Error('Method not implemented.');
    }

    HandleResponse() {
        this.game.playerID = this.playerID;
        eventBus.emit('game', <string>GameEvents.subscribed, {friend: this.friend, level: this.level});
    }
}

export class SubscribeMessage extends Message {
    private board: number;
    private message;

    constructor(game: GameOnline, board: number) {
        super();
        this.game = game;
        this.class = 'SubscribeMessage';
        console.log(this.class);
        this.board = board;
        this.message = {class: this.class, board: this.board};
    }

    HandleRequest() {
        this.game.gameService.sendSocketMessage(this.message);
    }

    HandleResponse() {

    }
}

interface Snap {
    id: number;
    position: b2Vec2;
    angle: number;
}

export class MovingMessage extends Message {
    private snap: Snap;
    private message: any;
    private playerID: number;


    constructor(game: GameOnline, messageObj: any) {
        super();
        this.game = game;
        this.snap = messageObj.snap;
        this.class = <string>Messages.MovingMessage;
        this.message = {
            class: this.class,
            snap: messageObj.snap,
        };
    }

    HandleResponse() {
        this.game.playerID = this.playerID;
        this.game.board.bodies.get(this.snap.id).shape.set('left', this.snap.position.x * SCALE_COEFF_X);
        this.game.board.bodies.get(this.snap.id).shape.set('top', this.snap.position.y * SCALE_COEFF_Y);
        this.game.board.bodies.get(this.snap.id).shape.set('angle', this.snap.angle);
        this.game.board.bodies.get(this.snap.id).shape.set('angle', this.snap.angle);
        this.game.board.bodies.get(this.snap.id).shape.setCoords();
        this.game.board.canvas.renderAll();
    }

    HandleRequest() {
        this.game.gameService.sendSocketMessage(this.message);
    }
}

export interface Frame {
    id?: number;
    position?: b2Vec2;
    angle?: number;
    velocity?: b2Vec2;
}

type Frames = Frame[];

export class StartMessage extends Message {
    private frames: Frames = [];

    constructor(game: GameOnline) {
        super();
        this.game = game;
        this.class = <string>Messages.StartMessage;
    }

    HandleRequest() {
        for (let body of this.game.board.bodies.values()) {
            if (body.owned) {
                let frame: Frame = {};
                frame.id = body.ID;
                frame.position = body.getPosition(true);
                frame.position.x /= SCALE_COEFF_X;
                frame.position.y /= SCALE_COEFF_Y;
                frame.angle = body.angle;
                this.frames.push(frame);
            }
        }
        let message = {
            class: this.class,
            bodies: this.frames,
        };
        console.log(message);
        this.game.gameService.sendSocketMessage(message);
    }

    HandleResponse() {
    }

}

export class StartedMessage extends Message {

    constructor(game: GameOnline, messageObj: any) {
        super();
        this.game = game;
        this.class = this.constructor.name;
        console.log(messageObj);
    }

    HandleRequest() {

    }

    HandleResponse() {
        this.game.state = new RunningState(this.game);
        this.game.start();
    }

}

export class SnapMessage extends Message {
    private message;
    private bodies;
    private frame;

    constructor(game: GameOnline, messageObj: any) {
        super();
        this.game = game;
        this.class = <string>Messages.SnapMessage;
        this.message = messageObj;
        this.bodies = messageObj.bodies;
        this.frame = messageObj.frame;
        this.message.class = this.class;
        this.message.frame = this.frame;
        this.message.bodies = this.bodies;
    }

    HandleRequest() {
        this.game.gameService.sendSocketMessage(this.message);
    }

    HandleResponse() {
        console.log(this.message);
        for (let body of this.bodies) {
            body.position.x *= SCALE_COEFF_X;
            body.position.y *= SCALE_COEFF_Y;
            this.game.board.bodies.get(body.id).body.SetPosition(body.position);
            this.game.board.bodies.get(body.id).body.SetLinearVelocity(new b2Vec2(body.linVelocity.x * SCALE_COEFF_X, body.linVelocity.y * SCALE_COEFF_Y));
            this.game.board.bodies.get(body.id).body.SetAngularVelocity(body.angVelocity);
            this.game.frame = this.frame;
        }
    }

}

export class FinishedMessage extends Message {
    private message;

    constructor(game: GameOnline, messageObj: any) {
        super();
        this.game = game;
        this.class = <string>Messages.FinishedMessage;
        this.message = messageObj;
        this.message.class = this.class;
    }

    HandleRequest() {
        throw new Error('method not implemented');
    }

    HandleResponse() {
        console.log(this.message);
        this.game.state = new FinishState(this.game);
        if (this.message.reason === 'TIMEOUT') {
            eventBus.emit('game', <string>GameEvents.lose, {});
        } else if (this.message.reason === 'SUCCESS') {
            eventBus.emit('game', <string>GameEvents.win, {score: this.message.score, time: this.game.timer.toString()});
        }
        this.game.finish(true);
    }

}

export class FinishMessage extends Message {
    private message;

    constructor(game: GameOnline, messageObj: any) {
        super();
        this.game = game;
        this.class = <string>Messages.FinishMessage;
        this.message = messageObj;
        this.message.class = this.class;
    }

    HandleRequest() {
        this.game.gameService.sendSocketMessage(this.message);
    }

    HandleResponse() {
        throw new Error('method not implemented');
    }

}