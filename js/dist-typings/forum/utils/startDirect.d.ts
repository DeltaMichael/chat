import type User from 'flarum/common/models/User';
/**
 * Abre (ou cria) a conversa direta com essas pessoas e a mostra. Uma pessoa dá
 * uma conversa a dois; várias, um grupo. O endpoint só reusa a conversa enquanto
 * todos os participantes estão nela; depois que alguém sai, um novo início abre
 * outro canal.
 *
 * Devolve se a conversa abriu; a falha já foi mostrada num alerta.
 */
export declare function startDirect(users: User[]): Promise<boolean>;
