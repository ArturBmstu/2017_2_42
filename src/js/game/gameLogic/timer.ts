/**
 * Created by zwirec on 27.11.2017.
 */


import eventBus from '../../modules/eventBus';
export enum TimerEvents {
    finished = 'finished',
    started = 'started',
    update = 'update',
}

const FPS = 60;
const msInSec = 1000;
const precision = 100;

export class Timer extends Object {
    public seconds: number;
    public milliseconds: number;
    public target_time: number;
    private intervalID: number;
    private running: boolean;
    private pause: boolean;

    constructor(time: number) {
        super();
        this.milliseconds = 0;
        this.seconds = time;
        this.target_time = time;
    }


    public start(mode: boolean = true): void {
        if (mode) {
            this.seconds--;
            this.target_time--;
            this.running = true;
        } else {
            this.intervalID = setInterval(() => {
                this.updateTimer();
            }, 10);
            this.running = true;
        }
        eventBus.emit('timer', <string>TimerEvents.started, this);
    }

    private reset() {
        this.seconds = 0;
        this.milliseconds = 0;
    }

    private isTargetAchieved(): boolean {
        return (this.milliseconds === 0 && this.seconds === 0)
            || (this.seconds < 0);
    }

    public stop(): void {
        this.running = false;
        eventBus.emit('timer', <string>TimerEvents.finished, this);
        clearInterval(this.intervalID);
        if (location.pathname.startsWith('/offline')) {
          eventBus.emit('game', 'lose');
        }
        this.reset();
    }

    private updateTimer(): void {
        if (this.isTargetAchieved()) {
            this.stop();
            return;
        }
        if (this.milliseconds === 0) {
            this.seconds--;
            this.milliseconds = precision - 1;
        } else {
            this.milliseconds--;
        }
        eventBus.emit('timer', <string>TimerEvents.update, this);
    }

    public step(frame: number) {
        if (this.running) {
            const seconds = div(frame, FPS);
            const ms = div((frame % FPS) * msInSec / FPS, precision / 10);
            this.seconds = this.target_time - seconds;
            this.milliseconds = precision - ms;
            eventBus.emit('timer', <string>TimerEvents.update, this);
            if (this.isTargetAchieved()) {
                this.running = false;
                eventBus.emit('timer', <string>TimerEvents.finished, this);
                this.reset();
            }
        }

    }

    public toString(): string {
        let time: string = '';
        time = '0' + this.seconds;
        time = time.slice(-2);
        time += '.';
        time += ('0' + this.milliseconds).slice(-2);
        return time;
    }


}

function div(val, by): number {
    return (val - val % by) / by;
}
