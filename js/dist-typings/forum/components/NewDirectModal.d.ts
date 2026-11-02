import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';
import AddMembersModal from './AddMembersModal';
import type { UserPickerAttrs } from './AddMembersModal';
/**
 * Escolhe com quem conversar e abre a conversa direta: uma pessoa dá uma conversa
 * a dois, várias dão um grupo. Se a conversa com as mesmas pessoas já existe, o
 * servidor a reabre em vez de criar outra.
 *
 * Mesmo seletor do convite a canal, sem canal: só o texto, o limite e o envio mudam.
 */
export default class NewDirectModal extends AddMembersModal<UserPickerAttrs> {
    className(): string;
    title(): Mithril.Children;
    protected intro(): Mithril.Children;
    protected maxSelection(): number;
    protected tooManyText(max: number): Mithril.Children;
    protected submitText(count: number): Mithril.Children;
    protected submit(chosen: User[]): Promise<boolean>;
}
