import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BoardSetup,
  MirrorSetup,
  PluginDefinition,
  Server2Client,
  WidgetConfig,
} from '@smartmirror.one/types';

import SocketServer from './socket-server';
import './widget-wrapper';

@customElement('smart-mirror')
class SmartMirror extends LitElement {
  @state() socket: SocketServer;
  @state() boardSetup: BoardSetup;
  @state() widgets: WidgetConfig[] = [];
  @state() plugins: PluginDefinition[] = [];

  static styles = [
    css`
    :host {
      --fg: hsl(0, 0%, 100%);
      --bg: hsl(0, 0%, 0%);
      display: block;
      width: 100%;
      height: 100%;
      font-family: sans-serif;
      color: var(--fg);
      background-color: var(--bg);
    }
    .stage {
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-columns: repeat(var(--width), 1fr);
      grid-template-rows: repeat(var(--height), 1fr);
    }`
  ];

  connectedCallback(): void {
    this.socket = new SocketServer('ws://localhost:3000');
    this.socket.addEventListener(
      Server2Client.connect,
      () => this.setupBoard(),
    );
    this.socket.addEventListener(
      Server2Client.setup,
      (ev: MirrorSetup) => this.handleSetup(ev),
    );
    this.socket.addEventListener(
      Server2Client.elementUpdate,
      (ev: WidgetConfig[]) => this.handleWidgetUpdate(ev),
    );
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    this.socket.removeEventListener(
      Server2Client.connect,
      () => this.setupBoard(),
    );
    this.socket.removeEventListener(
      Server2Client.setup,
      (ev: MirrorSetup) => this.handleSetup(ev),
    );
    this.socket.removeEventListener(
      Server2Client.elementUpdate,
      (ev: WidgetConfig[]) => this.handleWidgetUpdate(ev),
    );
    super.disconnectedCallback();
  }

  setupBoard() {
    this.socket.send('requestSetup');
  }

  handleSetup(payload: MirrorSetup) {
    this.boardSetup = {...payload.boardSetup};
    this.widgets = [...payload.widgets];
    this.plugins = [...payload.plugins];
  }

  handleWidgetUpdate(payload: WidgetConfig[]) {
    this.widgets = [...payload];
  }

  renderWidget(widgetConfig: WidgetConfig) {
    const styles = styleMap({
      'grid-column': `${widgetConfig.position.left} / span ${widgetConfig.position.width}`,
      'grid-row': `${widgetConfig.position.top} / span ${widgetConfig.position.height}`,
      border: this.boardSetup.testMode ? '1px solid var(--fg)' : null,
    });

    const [reqPlugin, reqWidget] = widgetConfig.widget.split('.');
    const foundPlugin = this.plugins.find(p => p.name === reqPlugin && p.widgets.hasOwnProperty(reqWidget));
    const foundWidget = foundPlugin.widgets[reqWidget];

    return html`
      <widget-wrapper
        element-id=${widgetConfig.id}
        .css=${foundWidget.css}
        .html=${foundWidget.html}
        .js=${foundWidget.frontend}
        .inputs=${widgetConfig.inputs}
        style=${styles}>
      </widget-wrapper>
    `;
  }

  render() {
    const stageStyle = styleMap({
      '--width': this.boardSetup ? this.boardSetup.width.toString() : '',
      '--height': this.boardSetup ? this.boardSetup.height.toString() : '',
    });
    return html`
      <div class="stage" style=${stageStyle}>
        ${this.widgets.map((w) => this.renderWidget(w))}
      </div>
    `;
  }
}