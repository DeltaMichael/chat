import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatMentionEmailEnabled, saveChatMentionEmailPreference } from '../src/forum/utils/chatEmailPreferences.ts';

function userWith(preferences, failure = null) {
  return {
    preferences: () => preferences,
    savePreferences: async (updates) => {
      Object.assign(preferences, updates);
      if (failure) throw failure;
    },
  };
}

test('reads the effective state from both chat email preferences', () => {
  assert.equal(chatMentionEmailEnabled(userWith({})), true);
  assert.equal(chatMentionEmailEnabled(userWith({ 'ramon-chat.emailNotifications': false })), false);
  assert.equal(chatMentionEmailEnabled(userWith({ notify_chatMention_email: false })), false);
  assert.equal(chatMentionEmailEnabled(userWith({ 'ramon-chat.emailNotifications': true, notify_chatMention_email: true })), true);
});

test('turns both chat preferences on and off without changing other notifications', async () => {
  const preferences = { notify_postMentioned_email: true, notify_chatMention_email: false };
  const user = userWith(preferences);
  await saveChatMentionEmailPreference(user, true);
  assert.equal(chatMentionEmailEnabled(user), true);
  await saveChatMentionEmailPreference(user, false);
  assert.equal(chatMentionEmailEnabled(user), false);
  assert.equal(preferences.notify_postMentioned_email, true);
  assert.equal(preferences.notify_chatMention_email, false);
});

test('restores previous preferences when saving fails', async () => {
  const preferences = { notify_chatMention_email: true, other: 'unchanged' };
  const error = new Error('save failed');
  await assert.rejects(saveChatMentionEmailPreference(userWith(preferences, error), false), error);
  assert.deepEqual(preferences, { notify_chatMention_email: true, other: 'unchanged' });
});
