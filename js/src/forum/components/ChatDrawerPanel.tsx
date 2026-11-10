import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Dropdown from 'flarum/common/components/Dropdown';
import classList from 'flarum/common/utils/classList';
import type Mithril from 'mithril';

import type Channel from '../../common/models/Channel';
import chatState from '../state/chat';
import { channelIcon } from '../utils/channelIcon';
import { channelActions, openChannelInfo } from '../utils/channelActions';
import ChatSidebar from './ChatSidebar';
import ErrorBoundary from './ErrorBoundary';
import ChannelView from './ChannelView';
import PinnedPanel from './PinnedPanel';
import ChatSearch from './ChatSearch';
import ThreadPanel from './ThreadPanel';
import ThreadsList from './ThreadsList';
import { chatTitle, chatIcon } from '../utils/branding';
import { isNarrowViewport } from '../utils/surface';
import iconLabel from '../utils/iconLabel';
import { morphIn, rememberOrigin } from '../utils/morph';

/**
 * Painel flutuante do chat, ancorado no canto inferior direito até ser movido.
 *
 * Montado uma vez na raiz do app, para navegar pelo fórum não fechar a conversa.
 * Em telas estreitas vira um botão flutuante que abre a página cheia (ver
 * `shouldUseChatDrawer`). Fica no chunk lazy; o ChatDrawer é a casca que o monta.
 */
export default class ChatDrawerPanel extends Component<ComponentAttrs> {
  private drag: {
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    drawer: HTMLElement;
    moved: boolean;
  } | null = null;

  private suppressHeaderClick = false;

  /** Último `isNarrowViewport()`, para detectar mudanças no resize. */
  private narrow = isNarrowViewport();

  /**
   * A escolha entre painel e botão é feita em `view()`, não por media query; sem
   * isto uma rotação manteria o formato antigo até outro redraw.
   */
  private onResize = () => {
    const narrow = isNarrowViewport();
    const drawer = document.querySelector<HTMLElement>('.ChatDrawer');
    let positionChanged = false;

    if (drawer && chatState.drawerPosition) {
      const rect = drawer.getBoundingClientRect();
      const position = this.clampPosition(chatState.drawerPosition.x, chatState.drawerPosition.y, rect.width, rect.height);

      if (position.x !== chatState.drawerPosition.x || position.y !== chatState.drawerPosition.y) {
        chatState.setDrawerPosition(position, chatState.drawerPinned);
        positionChanged = true;
      }
    }

    if (narrow === this.narrow && !positionChanged) return;

    this.narrow = narrow;
    m.redraw();
  };

  /** Se a caixa do drawer estava na tela no último render. */
  private shown = false;

  oncreate(vnode: Mithril.VnodeDOM<ComponentAttrs, this>): void {
    super.oncreate(vnode);

    window.addEventListener('resize', this.onResize);
    this.clampRestoredPosition(vnode.dom);
    this.morphWhenShown(vnode.dom);
  }

  onupdate(vnode: Mithril.VnodeDOM<ComponentAttrs, this>): void {
    super.onupdate(vnode);

    this.morphWhenShown(vnode.dom);
  }

  /**
   * Ao aparecer, o drawer cresce a partir de quem o abriu (botão do cabeçalho ou
   * página cheia). Sem origem recente não faz nada (ver utils/morph).
   */
  protected morphWhenShown(dom: Element | null): void {
    const box = dom instanceof HTMLElement && dom.classList.contains('ChatDrawer') ? dom : null;

    if (box && !this.shown) morphIn(box, 'drawer');

    this.shown = box !== null;
  }

  onremove(vnode: Mithril.VnodeDOM<ComponentAttrs, this>): void {
    super.onremove(vnode);

    window.removeEventListener('resize', this.onResize);
  }

  view(): Mithril.Children {
    if (!chatState.drawerOpen) return null;

    // Lido aqui também: o drawer pode abrir em qualquer largura sem resize.
    this.narrow = isNarrowViewport();

    if (this.narrow) return this.floatingButton();

    const channel = chatState.channel(chatState.activeChannelId);
    const title = chatTitle();
    const icon = chatIcon();
    const unread = chatState.unreadSummary();

    return (
      <div
        className={classList('ChatDrawer', {
          'ChatDrawer--collapsed': chatState.drawerCollapsed,
          'ChatDrawer--dragging': this.drag !== null,
          'ChatDrawer--pinned': chatState.drawerPinned,
        })}
        style={this.drawerStyle()}
        role="complementary"
        aria-label={title}
      >
        <div
          className="ChatDrawer-header"
          onpointerdown={(e: PointerEvent) => this.startDrag(e)}
          onpointermove={(e: PointerEvent) => this.moveDrag(e)}
          onpointerup={(e: PointerEvent) => this.endDrag(e)}
          onpointercancel={(e: PointerEvent) => this.endDrag(e)}
          onclick={(e: Event) => this.onHeaderClick(e)}
        >
          {channel ? (
            <Button
              className="Button Button--icon Button--flat"
              icon="fas fa-chevron-left"
              {...iconLabel(app.translator.trans('ramon-chat.forum.sidebar.back_to_channels', {}, true))}
              onclick={() => {
                // Os painéis sobrepostos pertencem ao canal que está sendo deixado.
                chatState.closeOverlays();
                chatState.setActiveChannel(null);
              }}
            />
          ) : icon ? (
            <i className={icon} aria-hidden="true" />
          ) : null}

          {/* Ícone e nome do canal na barra do drawer, já que o ChannelView embedded
              não desenha cabeçalho. O clique abre os detalhes, como no título. */}
          {channel ? (
            <button
              type="button"
              className="ChatDrawer-title ChatDrawer-title--channel"
              onclick={(e: MouseEvent) => {
                if (this.suppressHeaderClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }

                openChannelInfo(channel);
              }}
            >
              {channelIcon(channel, 'ChatDrawer-icon')}
              <span className="ChatDrawer-titleText">{channel.displayName()}</span>
            </button>
          ) : (
            <span className="ChatDrawer-title">{title}</span>
          )}

          {/* Recolhido, as não lidas aparecem na própria barra, com número.
              Menções têm cor própria. */}
          {chatState.drawerCollapsed && unread.mentions > 0 ? (
            <span
              className="ChatDrawer-badge ChatDrawer-badge--mention"
              title={app.translator.trans('ramon-chat.forum.nav.unread_mentions', { count: unread.mentions }, true)}
            >
              {unread.mentions > 99 ? '99+' : unread.mentions}
            </span>
          ) : chatState.drawerCollapsed && unread.messages > 0 ? (
            <span className="ChatDrawer-badge" title={app.translator.trans('ramon-chat.forum.nav.unread_messages', { count: unread.messages }, true)}>
              {unread.messages > 99 ? '99+' : unread.messages}
            </span>
          ) : null}

          <div className="ChatDrawer-actions">
            {/* As ações do canal (utils/channelActions) num menu só: sete ícones não
                cabem em 320px. Some quando recolhido. */}
            {channel && !chatState.drawerCollapsed ? this.channelMenu(channel) : null}

            <Button
              className={classList('Button Button--icon Button--flat ChatDrawer-pinButton', {
                'ChatDrawer-pinButton--active': chatState.drawerPinned,
              })}
              icon="fas fa-thumbtack"
              {...iconLabel(app.translator.trans(chatState.drawerPinned ? 'ramon-chat.forum.drawer.unpin' : 'ramon-chat.forum.drawer.pin', {}, true))}
              onclick={() => {
                this.togglePinned();
              }}
            />
            <Button
              className="Button Button--icon Button--flat"
              icon="fas fa-expand"
              {...iconLabel(app.translator.trans('ramon-chat.forum.drawer.full_screen', {}, true))}
              onclick={() => {
                this.goFullScreen();
              }}
            />
            <Button
              className="Button Button--icon Button--flat"
              icon={chatState.drawerCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}
              {...iconLabel(
                app.translator.trans(chatState.drawerCollapsed ? 'ramon-chat.forum.drawer.expand' : 'ramon-chat.forum.drawer.collapse', {}, true)
              )}
              onclick={() => {
                this.toggleCollapsed();
              }}
            />
            <Button
              className="Button Button--icon Button--flat"
              icon="fas fa-times"
              {...iconLabel(app.translator.trans('ramon-chat.forum.drawer.close', {}, true))}
              onclick={() => {
                this.close();
              }}
            />
          </div>
        </div>

        {chatState.drawerCollapsed ? null : (
          <div className="ChatDrawer-body">
            <ErrorBoundary area="drawer" render={() => this.body(channel)} />
          </div>
        )}
      </div>
    );
  }

  /**
   * Clicar na barra recolhe o drawer, a menos que o clique seja num controle.
   *
   * Verifica o alvo em vez de usar `stopPropagation`: o Bootstrap abre dropdowns
   * por um handler delegado no `document`. `.Dropdown` entra na lista porque o
   * padding do menu não é botão.
   */
  protected onHeaderClick(e: Event): void {
    if (this.suppressHeaderClick) {
      this.suppressHeaderClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const target = e.target as HTMLElement | null;

    if (target?.closest('button, a, input, .Dropdown')) return;

    this.toggleCollapsed();
  }

  protected startDrag(e: PointerEvent): void {
    if (
      chatState.drawerPinned ||
      e.button !== 0 ||
      !(e.target instanceof Element) ||
      e.target.closest('button:not(.ChatDrawer-title--channel), a, input, .Dropdown')
    )
      return;

    const header = e.currentTarget;
    const drawer = header instanceof HTMLElement ? header.closest<HTMLElement>('.ChatDrawer') : null;

    if (!drawer) return;

    const rect = drawer.getBoundingClientRect();

    this.drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      drawer,
      moved: false,
    };
    if (header instanceof HTMLElement) header.setPointerCapture(e.pointerId);
    if (!e.target.closest('.ChatDrawer-title--channel')) e.preventDefault();
    m.redraw();
  }

  protected moveDrag(e: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== e.pointerId) return;

    const drag = this.drag;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

    drag.moved = true;
    const position = this.clampPosition(drag.originX + dx, drag.originY + dy, drag.drawer.offsetWidth, drag.drawer.offsetHeight);
    chatState.setDrawerPosition(position);
    Object.assign(drag.drawer.style, this.drawerStyle());
  }

  protected endDrag(e: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== e.pointerId) return;

    const header = e.currentTarget;
    const drag = this.drag;
    this.drag = null;
    this.suppressHeaderClick = drag.moved;
    if (drag.moved) {
      window.setTimeout(() => {
        this.suppressHeaderClick = false;
      }, 0);
    }

    if (header instanceof HTMLElement && header.hasPointerCapture(e.pointerId)) {
      header.releasePointerCapture(e.pointerId);
    }

    if (chatState.drawerPinned && drag.moved) {
      chatState.setDrawerPosition(chatState.drawerPosition, true);
    }

    m.redraw();
  }

  protected togglePinned(): void {
    if (chatState.drawerPinned) {
      chatState.setDrawerPinned(false);
    } else {
      const drawer = document.querySelector<HTMLElement>('.ChatDrawer');
      const rect = drawer?.getBoundingClientRect();
      const position = rect ? this.clampPosition(rect.left, rect.top, rect.width, rect.height) : chatState.drawerPosition;

      chatState.setDrawerPinned(true, position);
    }

    m.redraw();
  }

  protected clampPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const inset = 0;

    return {
      x: Math.max(inset, Math.min(x, window.innerWidth - width - inset)),
      y: Math.max(inset, Math.min(y, window.innerHeight - height - inset)),
    };
  }

  protected clampRestoredPosition(dom: Element | null): void {
    if (!chatState.drawerPosition || !(dom instanceof HTMLElement)) return;

    const rect = dom.getBoundingClientRect();
    const position = this.clampPosition(chatState.drawerPosition.x, chatState.drawerPosition.y, rect.width, rect.height);

    if (position.x !== chatState.drawerPosition.x || position.y !== chatState.drawerPosition.y) {
      chatState.setDrawerPosition(position, chatState.drawerPinned);
      m.redraw();
    }
  }

  protected drawerStyle() {
    const position = chatState.drawerPosition;

    return position
      ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          right: 'auto',
          bottom: 'auto',
        }
      : {};
  }

  /**
   * Menu de ações do canal. O wrapper não pode ter handler de clique: o Bootstrap
   * abre o dropdown por handler delegado no `document`, e um `stopPropagation` no
   * caminho o impediria (ver `onHeaderClick`).
   */
  protected channelMenu(channel: Channel): Mithril.Children {
    const actions = channelActions(channel, chatState, { embedded: true });

    if (actions.length === 0) return null;

    return (
      <span className="ChatDrawer-channelMenu">
        <Dropdown
          buttonClassName="Button Button--icon Button--flat"
          icon="fas fa-ellipsis"
          label={app.translator.trans('ramon-chat.forum.drawer.channel_actions', {}, true)}
          accessibleToggleLabel={app.translator.trans('ramon-chat.forum.drawer.channel_actions', {}, true)}
        >
          {actions.map((action) => (
            <Button
              key={action.key}
              // `active` não é attr do Button; o core marca o item com a classe.
              className={classList({ active: action.active })}
              icon={action.icon}
              loading={action.loading}
              onclick={action.onclick}
            >
              {action.label}
            </Button>
          ))}
        </Dropdown>
      </span>
    );
  }

  /**
   * O drawer em telas estreitas: um botão no canto que abre o chat em tela cheia,
   * sem cobrir o fórum. Tem um X porque `drawerOpen` sobrevive a recargas e o
   * botão do cabeçalho só abre o chat.
   */
  protected floatingButton(): Mithril.Children {
    const label = chatTitle();
    const unread = chatState.unreadSummary();
    const count = unread.mentions > 0 ? unread.mentions : unread.messages;

    // Aqui sempre há ícone: sem ícone nem texto o botão seria um círculo vazio.
    const icon = chatIcon() ?? 'fas fa-comments';

    const close = app.translator.trans('ramon-chat.forum.drawer.close', {}, true);

    return (
      <div className="ChatFab">
        <button className="ChatFab-button" type="button" aria-label={label} title={label} onclick={() => this.goFullScreen()}>
          <i className={icon} aria-hidden="true" />

          {count > 0 ? (
            <span
              className={classList('ChatFab-badge', {
                'ChatFab-badge--mention': unread.mentions > 0,
              })}
            >
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>

        <Button className="Button Button--icon ChatFab-dismiss" icon="fas fa-times" title={close} aria-label={close} onclick={() => this.close()} />
      </div>
    );
  }

  /**
   * Conteúdo do drawer: a conversa ou a lista de canais, mais o painel sobreposto.
   *
   * Array, não fragment com slot condicional: o Mithril exige que todos os filhos
   * tenham key se o primeiro tiver, e conta `null` como sem key.
   */
  protected body(channel: Channel | null): Mithril.Children {
    const panes: Mithril.Children[] = [
      channel ? (
        <ChannelView key={`channel-${channel.id()}`} channel={channel} state={chatState} embedded />
      ) : (
        <ChatSidebar key="sidebar" state={chatState} onSelect={(c: Channel) => this.select(c)} />
      ),
    ];

    // Thread e fixadas dividem o slot sobreposto; só uma abre por vez.
    if (channel && chatState.activeThreadId !== null) {
      panes.push(
        <ThreadPanel
          key={`thread-${chatState.activeThreadId}`}
          channel={channel}
          threadId={chatState.activeThreadId}
          state={chatState}
          onClose={() => {
            chatState.closeThread();
            m.redraw();
          }}
        />
      );

      return panes;
    }

    // `chat.threads` é página; rotear fecharia o drawer.
    if (channel && chatState.showThreads) {
      panes.push(
        <ThreadsList
          key={`threads-${channel.id()}`}
          state={chatState}
          channelId={Number(channel.id())}
          embedded
          onClose={() => {
            chatState.showThreads = false;
            m.redraw();
          }}
        />
      );

      return panes;
    }

    // `chat.search` é página; rotear fecharia o drawer.
    if (channel && chatState.showSearch) {
      panes.push(
        <ChatSearch
          key={`search-${channel.id()}`}
          state={chatState}
          channelId={Number(channel.id())}
          embedded
          onClose={() => {
            chatState.showSearch = false;
            m.redraw();
          }}
        />
      );

      return panes;
    }

    // Sem espaço para painel lateral, as fixadas cobrem a conversa.
    if (channel && chatState.showPinned) {
      panes.push(
        <PinnedPanel
          key={`pinned-${channel.id()}`}
          channel={channel}
          state={chatState}
          embedded
          onClose={() => {
            chatState.showPinned = false;
            m.redraw();
          }}
        />
      );
    }

    return panes;
  }

  protected select(channel: Channel): void {
    // Como no botão de voltar: o próximo canal não deve abrir com a busca anterior.
    chatState.closeOverlays();
    chatState.setActiveChannel(Number(channel.id()));
    m.redraw();
  }

  protected toggleCollapsed(): void {
    chatState.setDrawerCollapsed(!chatState.drawerCollapsed);
    m.redraw();
  }

  /**
   * Única forma de fechar o drawer; navegar, recarregar e recolher o mantêm aberto.
   */
  protected close(): void {
    chatState.setDrawerOpen(false);
    m.redraw();
  }

  /**
   * Passa o canal atual para a página cheia. O drawer fica suspenso, não fechado:
   * ao sair da página ele volta (ChatPage.onremove).
   */
  protected goFullScreen(): void {
    const id = chatState.activeChannelId;

    rememberOrigin(document.querySelector('.ChatDrawer'), 'page');

    chatState.suspendDrawer();

    m.route.set(id ? app.route('chat.channel', { id }) : app.route('chat.index'));
  }
}
