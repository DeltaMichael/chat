import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reactionValue } from '../src/forum/utils/emoji.ts';

test('accepts Unicode and custom Flamoji reaction values', () => {
  assert.equal(reactionValue('🔥'), '🔥');
  assert.equal(reactionValue('👨‍👩‍👧‍👦'), '👨‍👩‍👧‍👦');
  assert.equal(reactionValue('🇧🇬'), '🇧🇬');
  assert.equal(reactionValue('1️⃣'), '1️⃣');
  assert.equal(reactionValue(':partyparrot:'), 'partyparrot');
});

test('rejects values that are neither emoji nor valid shortcodes', () => {
  assert.equal(reactionValue('not an emoji!'), null);
});
