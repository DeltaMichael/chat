import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installKeyboardViewport } from '../src/forum/utils/keyboardViewport.ts';

test('composer follows the visual viewport and restores the normal layout', () => {
  const original = { window: globalThis.window, document: globalThis.document, HTMLElement: globalThis.HTMLElement };
  class Element extends EventTarget {
    constructor() {
      super();
      this.styles = new Map();
      this.classes = new Set();
      this.style = { setProperty: (key, value) => this.styles.set(key, value), removeProperty: (key) => this.styles.delete(key) };
      this.classList = { add: (value) => this.classes.add(value), remove: (value) => this.classes.delete(value) };
    }
    matches(selector) {
      return selector === '.ChatComposer-input' && this.composer;
    }
    contains(child) {
      return child === input;
    }
    getBoundingClientRect() {
      return { top: 46 };
    }
  }
  const input = new Element();
  input.composer = true;
  const page = new Element();
  const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
  const win = Object.assign(new EventTarget(), {
    visualViewport: viewport,
    scrollX: 0,
    scrollY: 0,
    scrollTo(x, y) {
      this.scrollX = x;
      this.scrollY = y;
    },
  });
  globalThis.HTMLElement = Element;
  globalThis.window = win;
  globalThis.document = { activeElement: input };

  try {
    let narrow = true;
    const cleanup = installKeyboardViewport(page, () => narrow);
    page.dispatchEvent(new Event('focusin'));
    assert.equal(page.styles.get('--chat-keyboard-height'), '754px');
    viewport.height = 470;
    win.scrollY = 250;
    viewport.dispatchEvent(new Event('resize'));
    assert.equal(win.scrollY, 0);
    assert.equal(page.styles.get('--chat-keyboard-height'), '424px');
    assert.equal(page.classes.has('ChatPage--keyboard'), true);
    viewport.scale = 2;
    viewport.dispatchEvent(new Event('resize'));
    assert.equal(page.classes.has('ChatPage--keyboard'), false);
    viewport.scale = 1;
    viewport.dispatchEvent(new Event('resize'));
    page.dispatchEvent(new Event('focusout'));
    assert.equal(page.styles.has('--chat-keyboard-height'), false);
    narrow = false;
    page.dispatchEvent(new Event('focusin'));
    assert.equal(page.classes.has('ChatPage--keyboard'), false);
    narrow = true;
    page.dispatchEvent(new Event('focusin'));
    cleanup();
    viewport.dispatchEvent(new Event('resize'));
    assert.equal(page.classes.has('ChatPage--keyboard'), false);
  } finally {
    globalThis.window = original.window;
    globalThis.document = original.document;
    globalThis.HTMLElement = original.HTMLElement;
  }
});
