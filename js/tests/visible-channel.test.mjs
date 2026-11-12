import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isChannelDisplayed } from '../src/forum/utils/visibleChannel.ts';

function root(elements) {
  return {
    querySelectorAll: (selector) => {
      assert.equal(selector, '.ChatChannel[data-channel-id]');
      return elements;
    },
  };
}

function channel(id, visible = true) {
  return {
    dataset: { channelId: String(id) },
    getClientRects: () => (visible ? [{}] : []),
  };
}

test('only rendered and displayed channel views count as open', () => {
  assert.equal(isChannelDisplayed(1, root([])), false);
  assert.equal(isChannelDisplayed(1, root([channel(1, false)])), false);
  assert.equal(isChannelDisplayed(1, root([channel(2)])), false);
  assert.equal(isChannelDisplayed(1, root([channel(2), channel(1)])), true);
});
