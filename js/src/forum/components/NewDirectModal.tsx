import app from 'flarum/forum/app';
import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';

import AddMembersModal from './AddMembersModal';
import type { UserPickerAttrs } from './AddMembersModal';
import { startDirect } from '../utils/startDirect';

/** Espelha Channel::MAX_DIRECT_PARTICIPANTS, que conta quem abre a conversa. */
const MAX_PARTICIPANTS = 20;

/**
 * Escolhe com quem conversar e abre a conversa direta: uma pessoa dá uma conversa
 * a dois, várias dão um grupo. Se a conversa com as mesmas pessoas já existe, o
 * servidor a reabre em vez de criar outra.
 *
 * Mesmo seletor do convite a canal, sem canal: só o texto, o limite e o envio mudam.
 */
export default class NewDirectModal extends AddMembersModal<UserPickerAttrs> {
  className(): string {
    return 'ChatModal ChatAddMembers ChatNewDirect Modal--medium';
  }

  title(): Mithril.Children {
    return app.translator.trans('ramon-chat.forum.new_direct.title');
  }

  protected intro(): Mithril.Children {
    return app.translator.trans('ramon-chat.forum.new_direct.intro');
  }

  protected maxSelection(): number {
    return MAX_PARTICIPANTS - 1;
  }

  protected tooManyText(max: number): Mithril.Children {
    return app.translator.trans('ramon-chat.forum.new_direct.too_many', { max });
  }

  protected submitText(count: number): Mithril.Children {
    return count > 1 ? app.translator.trans('ramon-chat.forum.new_direct.submit_group') : app.translator.trans('ramon-chat.forum.new_direct.submit');
  }

  protected submit(chosen: User[]): Promise<boolean> {
    return startDirect(chosen);
  }
}
