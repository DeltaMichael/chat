import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Switch from 'flarum/common/components/Switch';
import type User from 'flarum/common/models/User';
import { chatMentionEmailEnabled, saveChatMentionEmailPreference } from '../utils/chatEmailPreferences';

export default class ChatMentionEmailSetting extends Component<{ user: User }> {
  private loading = false;

  view() {
    return (
      <Switch
        state={chatMentionEmailEnabled(this.attrs.user)}
        loading={this.loading}
        disabled={this.loading}
        onchange={(enabled: boolean) => {
          this.loading = true;
          saveChatMentionEmailPreference(this.attrs.user, enabled)
            .catch((error) => console.error('[ramon-chat] could not save chat mention email preference', error))
            .finally(() => {
              this.loading = false;
              m.redraw();
            });
        }}
      >
        {app.translator.trans('ramon-chat.forum.settings.email_notifications')}
      </Switch>
    );
  }
}
