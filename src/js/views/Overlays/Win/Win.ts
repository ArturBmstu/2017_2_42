import Button from '../../../blocks/button';
import BaseOverlay from '../../../modules/BaseOverlay';
import eventBus from '../../../modules/eventBus';
import router from '../../../modules/router';
import ViewService from '../../../services/ViewService';
import './Win.scss';

const InfoOverlayTmpl = (require('./Win.pug') as TemplateRenderFunc);

export default class Win extends BaseOverlay {

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  public async start(data?: any): Promise<void> {
    // return undefined;
    this.RenderOverlay(InfoOverlayTmpl);

    this.backButton = new Button(document
      .querySelector('.main-block__frame__footer__back-section') as HTMLElement);
    this.backButton.onClick(() => eventBus.emit('game', 'quit'));
    this.backButton.onClick(() => data.offline ?
      router.go(ViewService.ViewPaths.offline.lobbyPage) :
      router.go(ViewService.ViewPaths.online.lobbyPage));

    if (!location.pathname.startsWith('/offline')) {
      (document.querySelector('.main-block__frame__score') as HTMLElement).innerText = `Score: ${data.score}`;
      (document.querySelector('.main-block__frame__score') as HTMLElement).style.display = 'flex';
      (document.querySelector('.main-block__frame__time') as HTMLElement).innerText = `Time left: ${data.time}`;
      (document.querySelector('.main-block__frame__time') as HTMLElement).style.display = 'flex';
    } else {
      (document.querySelector('.main-block__frame__score') as HTMLElement).style.display = 'none';
      (document.querySelector('.main-block__frame__time') as HTMLElement).style.display = 'none';
    }
  }

  public async stop(): Promise<void> {
    // return undefined;
  }

  private backButton: Button;
  private logoutButton: Button;
}
