import {b2Manifold} from 'box2d.ts/Box2D/Box2D/Collision/b2Collision';
import {b2Contact} from 'box2d.ts/Box2D/Box2D/Dynamics/Contacts/b2Contact';
import {b2ContactImpulse, b2ContactListener} from 'box2d.ts/Box2D/Box2D/Dynamics/b2WorldCallbacks';
import eventBus from '../modules/eventBus';
import {CircleBody} from './body/body';
import {KeyBodies} from './body/config';
import {FinishMessage} from './gameLogic/Message';
import {Game, GameOnline} from './gameLogic/gameOnline';
import {FinishState, InitState} from './gameLogic/gameState';

export class ListenerOnline extends b2ContactListener {
    public game: Game;

    constructor(game: Game) {
        super();
        this.game = game;
    }

    BeginContact(contact: b2Contact) {
        let bodyA = contact.GetFixtureA().GetBody().GetUserData();
        let bodyB = contact.GetFixtureB().GetBody().GetUserData();
        let A = contact.GetFixtureA().GetFilterData().categoryBits;
        let B = contact.GetFixtureB().GetFilterData().categoryBits;
        if (A === KeyBodies.KEY_BODY_1 && B === KeyBodies.KEY_BODY_1) {
            if (contact.GetFixtureA().GetBody().GetUserData() instanceof CircleBody) {
                // bodyA.isDeleted = true;
                // bodyA.body.SetActive(false);
                // bodyA.body.GetWorld().DestroyBody(bodyA);
                this.game.state = new FinishState(this.game);
                // this.game.running = false;
            } else {
                // bodyB.isDeleted = true;
                // bodyB.body.SetActive(false);
                // bodyB.body.GetWorld().DestroyBody(bodyB);
                this.game.state = new FinishState(this.game);
                // this.game.running = false;

            }
            // this.game.changeState(new FinishState(this.game));
            let message = {
                frames: this.game.frame,
            };
            let finMessage = new FinishMessage(this.game, message);
            finMessage.HandleRequest();
            console.log('finish');
            eventBus.emit('game', 'finish', {});
        }
    }

    PreSolve(contact: b2Contact, oldManifold: b2Manifold) {

    }

    PostSolve(contact: b2Contact, oldManifold: b2ContactImpulse) {

    }

    EndContact(contact: b2Contact) {

    }
}


export class ListenerOffline extends b2ContactListener {
    public game: Game;

    constructor(game: Game) {
        super();
        this.game = game;
    }

    BeginContact(contact: b2Contact) {
        let bodyA = contact.GetFixtureA().GetBody().GetUserData();
        let bodyB = contact.GetFixtureB().GetBody().GetUserData();
        let A = contact.GetFixtureA().GetFilterData().categoryBits;
        let B = contact.GetFixtureB().GetFilterData().categoryBits;
        if (A === KeyBodies.KEY_BODY_1 && B === KeyBodies.KEY_BODY_1) {
            if (contact.GetFixtureA().GetBody().GetUserData() instanceof CircleBody) {
                // bodyA.isDeleted = true;
                // bodyA.body.SetActive(false);
                // bodyA.body.GetWorld().DestroyBody(bodyA);
                this.game.state = new FinishState(this.game);
                // this.game.running = false;
            } else {
                // bodyB.isDeleted = true;
                // bodyB.body.SetActive(false);
                // bodyB.body.GetWorld().DestroyBody(bodyB);
                this.game.state = new FinishState(this.game);
                // this.game.running = false;

            }
            // this.game.changeState(new FinishState(this.game));
            let message = {
                frames: this.game.frame,
            };
            eventBus.emit('game', 'win');
            eventBus.emit('game', 'finish', {});
        }
    }

    PreSolve(contact: b2Contact, oldManifold: b2Manifold) {

    }

    PostSolve(contact: b2Contact, oldManifold: b2ContactImpulse) {

    }

    EndContact(contact: b2Contact) {

    }
}
