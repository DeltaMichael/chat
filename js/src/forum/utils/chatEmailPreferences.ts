const CHAT_EMAIL = 'ramon-chat.emailNotifications';
const CORE_EMAIL = 'notify_chatMention_email';

type PreferenceUser = {
  preferences(): Record<string, unknown> | null | undefined;
  savePreferences(preferences: Record<string, unknown>): Promise<unknown>;
};

export function chatMentionEmailEnabled(user: PreferenceUser): boolean {
  const preferences = user.preferences();
  return preferences?.[CHAT_EMAIL] !== false && preferences?.[CORE_EMAIL] !== false;
}

export async function saveChatMentionEmailPreference(user: PreferenceUser, enabled: boolean): Promise<void> {
  const preferences = user.preferences();
  const previous = [CHAT_EMAIL, CORE_EMAIL].map((key) => ({
    key,
    present: preferences ? Object.prototype.hasOwnProperty.call(preferences, key) : false,
    value: preferences?.[key],
  }));

  try {
    await user.savePreferences({ [CHAT_EMAIL]: enabled, [CORE_EMAIL]: enabled });
  } catch (error) {
    if (preferences) {
      for (const { key, present, value } of previous) {
        if (preferences[key] !== enabled) continue;
        if (present) preferences[key] = value;
        else delete preferences[key];
      }
    }
    throw error;
  }
}
