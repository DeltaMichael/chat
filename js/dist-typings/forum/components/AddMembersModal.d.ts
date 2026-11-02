import FormModal from 'flarum/common/components/FormModal';
import type { IFormModalAttrs } from 'flarum/common/components/FormModal';
import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';
import type Channel from '../../common/models/Channel';
/** O que o seletor de pessoas precisa, com ou sem canal. */
export interface UserPickerAttrs extends IFormModalAttrs {
    /** Já no canal: aparecem, mas não são selecionáveis. */
    members?: User[];
    /** Convite pendente: aparecem, mas não são selecionáveis. */
    invited?: User[];
}
export interface AddMembersModalAttrs extends UserPickerAttrs {
    channel: Channel;
    members: User[];
    invited: User[];
    /** Recebe as pessoas enviadas ao servidor para convite. */
    onAdded: (users: User[]) => void;
}
/**
 * Escolhe pessoas para convidar a um canal, num campo de tokens.
 *
 * Sem digitação, sugere quem foi visto por último. Membros e convidados aparecem
 * marcados e não selecionáveis. Setas navegam, Enter escolhe, Backspace no campo
 * vazio remove o último chip e Escape limpa a busca.
 *
 * O seletor serve a outros fluxos: subclasses trocam o texto, o limite e o envio
 * (ver NewDirectModal).
 */
export default class AddMembersModal<A extends UserPickerAttrs = AddMembersModalAttrs> extends FormModal<A> {
    private query;
    private results;
    private suggestions;
    private selected;
    private searching;
    private loadingSuggestions;
    private highlighted;
    private timer;
    /** Impede que uma busca antiga resolva depois de uma mais nova. */
    private sequence;
    oninit(vnode: Mithril.Vnode<A, this>): void;
    onremove(vnode: Mithril.VnodeDOM<A, this>): void;
    className(): string;
    title(): Mithril.Children;
    content(): Mithril.Children;
    /** Sugestões até duas letras digitadas; depois, a busca. */
    protected list(): Mithril.Children;
    /**
     * O destaque conta só as linhas selecionáveis, como as setas, para uma linha
     * marcada no meio não deslocá-lo.
     */
    protected rows(users: User[]): Mithril.Children;
    protected row(user: User, index: number): Mithril.Children;
    protected intro(): Mithril.Children;
    /** Quantas pessoas cabem num envio. */
    protected maxSelection(): number;
    protected tooManyText(max: number): Mithril.Children;
    protected submitText(count: number): Mithril.Children;
    /** Envia a seleção. Resolve true para fechar o modal; false o deixa aberto. */
    protected submit(chosen: User[]): Promise<boolean>;
    /** Os attrs do convite, que só este fluxo tem. */
    protected invite(): AddMembersModalAttrs;
    protected footer(): Mithril.Children;
    protected inner(): Mithril.Children;
    /** Por que a pessoa não pode ser escolhida, ou null se pode. */
    protected statusOf(user: User): 'you' | 'member' | 'invited' | null;
    protected isSelected(user: User): boolean;
    protected toggle(user: User): void;
    protected offered(): User[];
    protected onKey(e: KeyboardEvent): void;
    protected focusInput(): void;
    /**
     * Sugestões antes da digitação, buscadas uma vez por abertura. Ordena por
     * `lastSeenAt` quando possível (o core exige `user.viewLastSeenAt`, e sem ela a
     * API responde 400); senão, por quem mais posta.
     */
    protected loadSuggestions(): Promise<void>;
    /** Com debounce, para não disparar uma requisição por tecla. */
    protected search(value: string): void;
    onsubmit(e: SubmitEvent): void;
    /** O convite ao canal: uma requisição para a seleção inteira. */
    protected sendInvites(chosen: User[]): Promise<boolean>;
}
