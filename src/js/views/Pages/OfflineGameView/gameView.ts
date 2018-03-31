///<reference path="../../../typings/fabric/index.d.ts"/>
import Button from '../../../blocks/button';

import {StartMessage} from '../../../game/gameLogic/Message';
import {game, GameOnline} from '../../../game/gameLogic/gameOnline';

import BaseView from '../../../modules/BaseView';

interface Size {
  height: number;
  width: number;
}

const GameViewTmpl = require('./gameView.pug') as TemplateRenderFunc;
import {b2Vec2} from 'box2d.ts/Box2D/Box2D/Common/b2Math';
import SoundButton from '../../../blocks/Buttons/SoundButton';
import {assignScaleConf, SCALE_COEFF_X, SCALE_COEFF_Y} from '../../../game/board/config';
import {GameOffline} from '../../../game/gameLogic/gameOffline';
import eventBus from '../../../modules/eventBus';
import ViewService from '../../../services/ViewService';
import './gameView.scss';

export default class OfflineGameView extends BaseView {
  private readyButton: Button;
  private backButton: Button;
  private startButton: Button;
  private muteButton: Button;
  private mapMeta: Map.Meta;

  private wincb = (data: any) => {
    data = data || {};
    data.offline = true;
    return this.router.showOverlay(ViewService.OverlayNames.game.win, data);
  }

  private losecb = () => this.router.showOverlay(ViewService.OverlayNames.game.lose, {offline: true});


  constructor(parentElement: HTMLElement) {
    super(parentElement, 'Game #');
  }

  public async start(friend: any): Promise<void> {
    this.RenderPage(GameViewTmpl);
    console.log('offline');

    GameOffline.game.load(this.initCanvas());

    this.initButtons();

    document.ontouchend = (event) => {
    };
    (document.querySelector('.canvas-container') as HTMLElement).style.margin = '0 auto';

    this.bus.on('game', 'win', this.wincb);
    this.bus.on('game', 'lose', this.losecb);
  }

  public async destroy(): Promise<void> {
    this.rootElement.innerHTML = '';
    this.bus.off('game', 'win', this.wincb);
    this.bus.off('game', 'lose', this.losecb);
  }

  public async resume(mapMeta: Map.Meta): Promise<void> {
    this.start(mapMeta);
  }

  public async pause(): Promise<void> {
    this.destroy();
  }

  private chooseCanvasSize(canvas: HTMLCanvasElement): Size {
    const x = canvas.offsetWidth;
    const y = canvas.offsetHeight;

    const new_x = y * 16 / 9;
    if (x > new_x) {
      return {height: y, width: new_x};
    } else {
      return {height: x * 9 / 16, width: x};
    }
  }

  private initCanvas(): HTMLCanvasElement {
    const canvas = document.querySelector('.main-frame__game-canvas') as HTMLCanvasElement;
    const canvasSize = this.chooseCanvasSize(canvas);
    let parent = document.querySelector('.main-frame__wrapper__container__canvas-container') as HTMLDivElement;


    let size = {width: parent.offsetWidth, height: parent.offsetHeight};
    console.log(size);
    if (size.height / 9 * 16 < size.width) {
      size.width = size.height / 9 * 16;
    } else {
      size.height = size.width / 16 * 9;
    }
    console.log(size);

    canvas.height = size.height;
    canvas.width = size.width;

    let resize = () => {

      let size = {width: parent.offsetWidth, height: parent.offsetHeight};
      if (size.height / 9 * 16 < size.width) {
        size.width = size.height / 9 * 16;
      } else {
        size.height = size.width / 16 * 9;
      }

      console.log(size);

      let c = game.board.canvas;

      let widthScale = size.width / c.getWidth();
      let heightScale = size.height / c.getHeight();

      c.setHeight(size.height);
      c.setWidth(c.getWidth() * widthScale);

      let objects = c.getObjects();
      for (let i in objects) {
        let scaleX = objects[i].scaleX;
        let scaleY = objects[i].scaleY;
        let left = objects[i].left;
        let top = objects[i].top;

        let tempScaleX = scaleX * widthScale;
        let tempScaleY = scaleY * widthScale;
        let tempLeft = left * widthScale;
        let tempTop = top * widthScale;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
      }

      c.renderAll();
      assignScaleConf(c.getWidth(), c.getHeight());
      game._world.SetGravity(new b2Vec2(0, 10 * SCALE_COEFF_Y));

    };
    window.onresize = resize;
    return canvas;
  }

  private initButtons() {
    this.backButton = new Button(document
      .querySelector('.main-frame__header__back-button') as HTMLElement);
    this.backButton.onClick(() => this.router.go(ViewService.ViewPaths.offline.lobbyPage));
    this.backButton.onClick(() => this.bus.emit('game', 'quit'));

    // this.settingsButton = new Button(document.querySelector('.main-frame__header__settings-button') as HTMLElement);
    // this.settingsButton.onClick(() => this.router.showOverlay(ViewService.OverlayNames.application.settings));
    this.muteButton = new SoundButton(document
      .querySelector('.main_frame__header__sound-button') as HTMLElement);
    // this.readyButton = new Button(document.querySelector('.main-frame__header__ready-button__not-ready') as HTMLElement);
    // this.readyButton.onClick(() => {
    //     eventBus.emit('game', 'subscribe');
    // });
    this.startButton = new Button(document.querySelector('.main-frame__header__ready-button__not-ready') as HTMLElement);
    this.startButton.onClick(() => {
      eventBus.emit('game', 'start');
    });
  }
}