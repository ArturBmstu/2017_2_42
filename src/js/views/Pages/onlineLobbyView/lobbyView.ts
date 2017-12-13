import Button from '../../../blocks/button';
import MapTile from '../../../blocks/mapTile';
import User from '../../../models/user';
import BaseView from '../../../modules/BaseView';
import mapService from '../../../services/mapService';
import userService from '../../../services/userService';
import ViewPaths from '../../pagePaths';
import './lobbyView.scss';

const lobbyTmpl = require('./lobbyView.pug') as TemplateRenderFunc;

export default class OnlineLobbyView extends BaseView {
  private maps: Map.Meta[];
  private user: User;

  private backButton: Button;
  private settingsButton: Button;
  private logoutButton: Button;

  constructor(parentElement) {
    super(parentElement, 'Physics.io | lobby');
  }

  public async start(): Promise<void> {
    this.user = await userService.getUser();
    this.maps = this.maps || await mapService.getMaps(true);

    this.RenderPage(lobbyTmpl);

    this.backButton = new Button(document.querySelector('.main-frame__header__back-button') as HTMLElement);
    //////!!!!!!
    // this.soundButton = new Button(document.querySelector('.main-frame__header__sound-button') as HTMLElement);
    this.settingsButton = new Button(document.querySelector('.main-frame__header__settings-button') as HTMLElement);
    this.logoutButton = new Button(document.querySelector('.main-frame__header__logout-button') as HTMLElement);

    const mapPlaceholder = document.querySelector('.main-frame__lobby-content__maps') as HTMLElement;

    this.maps.forEach((map) => {
      const mapTileElement = new MapTile(map).renderElement();

      mapPlaceholder.appendChild(mapTileElement);

      mapTileElement.onclick = () => this.router.go(ViewPaths.online_game, map);
    });

    this.backButton.onClick(() => this.router.go(ViewPaths.start));
    this.settingsButton.onClick(() => console.log('settings overlay'));

    this.logoutButton.onClick(async () => {
      try {
        await userService.logout();
        this.router.go(ViewPaths.login);
      } catch (error) {
        this.router.go(ViewPaths.start);
      }
    });
  }

  public async destroy(): Promise<void> {
    this.rootElement.innerHTML = '';

    this.backButton = undefined;
    this.settingsButton = undefined;
  }

  public async resume(): Promise<void> {
    return this.start();
  }

  public async pause(): Promise<void> {
    return this.destroy();
  }
}
