import app from 'flarum/forum/app';
import type User from 'flarum/common/models/User';

import type Channel from '../../common/models/Channel';
import ChatDrawer from '../components/ChatDrawer';
import chatState from '../state/chat';
import { shouldUseChatDrawer } from './surface';

/**
 * Abre (ou cria) a conversa direta com essas pessoas e a mostra. Uma pessoa dá
 * uma conversa a dois; várias, um grupo. O endpoint só reusa a conversa enquanto
 * todos os participantes estão nela; depois que alguém sai, um novo início abre
 * outro canal.
 *
 * Devolve se a conversa abriu; a falha já foi mostrada num alerta.
 */
export async function startDirect(users: User[]): Promise<boolean> {
  try {
    const payload = await app.request<{
      data?: { id?: string };
      meta?: { created?: boolean; serialized?: boolean };
    }>({
      method: 'POST',
      url: `${app.forum.attribute('apiUrl')}/chat/direct`,
      body: { data: { attributes: { userIds: users.map((user) => Number(user.id())) } } },
    });

    const channelId = Number(payload?.data?.id);

    if (!channelId) return false;

    // O endpoint serializa o canal encontrado ou criado, então a conversa chega com o
    // POST (ver StartDirectController::serialize).
    let channel: Channel | null = null;

    if (payload.meta?.serialized) {
      try {
        channel = app.store.pushPayload(payload as never) as unknown as Channel;
      } catch {
        // Cai no fetch abaixo.
      }
    }

    if (!channel) {
      try {
        channel = (await app.store.find('chat-channels', String(channelId))) as unknown as Channel;
      } catch {
        // O canal existe; um fetch falho só adia a atualização da lista.
      }
    }

    if (channel) chatState.rememberChannel(channel);

    // Conversa recém-criada não tem histórico nem fixada; semear os dois evita dois
    // requests que voltariam vazios.
    if (payload.meta?.created) {
      chatState.seedEmptyChannel(channelId);
    }

    chatState.setActiveChannel(channelId);

    // Na página cheia do chat (o botão da seção de mensagens diretas), a conversa
    // abre ali mesmo; a gaveta só serve a quem chega de fora, como o perfil.
    const onChatPage = String(app.current.get('routeName') ?? '').startsWith('chat.');

    if (!onChatPage && shouldUseChatDrawer()) {
      // Sem await: a gaveta pinta no primeiro frame e a lista de canais não é o que o
      // leitor veio ver.
      ChatDrawer.open().catch(() => {});
    } else {
      m.route.set(app.route('chat.channel', { id: channelId }));
    }

    return true;
  } catch (e: any) {
    app.alerts.show({ type: 'error' }, e?.response?.errors?.[0]?.detail ?? app.translator.trans('ramon-chat.forum.user_controls.start_chat_failed'));

    return false;
  }
}
