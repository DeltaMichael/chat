import type User from 'flarum/common/models/User';
import Channel from '../common/models/Channel';
import Message from '../common/models/Message';
import Thread from '../common/models/Thread';
import Upload from '../common/models/Upload';
import MessageFlag from '../common/models/MessageFlag';
import chatState from './state/chat';
import ChatState from './state/ChatState';
import ChatNavButton from './components/ChatNavButton';
import ChatDrawer from './components/ChatDrawer';
import ChannelInviteNotification from './components/ChannelInviteNotification';
import ChannelInviteDeclinedNotification from './components/ChannelInviteDeclinedNotification';
import MessageFlaggedNotification from './components/MessageFlaggedNotification';
import ModeratorPromotedNotification from './components/ModeratorPromotedNotification';
import OwnershipTransferNotification from './components/OwnershipTransferNotification';
import OwnershipTransferDeclinedNotification from './components/OwnershipTransferDeclinedNotification';
import OwnershipInheritedNotification from './components/OwnershipInheritedNotification';
import { realtimeBound, realtimeDelivered, realtimeLive } from './realtime';
export { default as extend } from './extend';
export { Channel, Message, Thread, Upload, MessageFlag, ChatState, chatState, ChatNavButton, ChatDrawer, ChannelInviteNotification, ChannelInviteDeclinedNotification, MessageFlaggedNotification, ModeratorPromotedNotification, OwnershipTransferNotification, OwnershipTransferDeclinedNotification, OwnershipInheritedNotification, realtimeBound, realtimeDelivered, realtimeLive, };
/**
 * Abre (ou cria) a conversa direta com o usuário. Fica exportada para outras
 * extensões; o trabalho está em `utils/startDirect`.
 */
export declare function startDirectMessage(user: User): Promise<void>;
