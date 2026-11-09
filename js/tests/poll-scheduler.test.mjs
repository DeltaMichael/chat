import { test } from 'node:test';
import assert from 'node:assert/strict';
import PollScheduler from '../src/forum/utils/PollScheduler.ts';

function clock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  return {
    now: () => now,
    set: (callback, delay) => {
      const id = ++nextId;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clear: (id) => timers.delete(id),
    advance: async (ms) => {
      const end = now + ms;
      for (;;) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
        await new Promise((resolve) => setImmediate(resolve));
      }
      now = end;
      await new Promise((resolve) => setImmediate(resolve));
    },
    count: () => timers.size,
  };
}

test('slow polls never overlap and wakeups coalesce', async () => {
  const c = clock();
  let calls = 0;
  let finish;
  const scheduler = new PollScheduler(
    () => {
      calls++;
      return new Promise((resolve) => (finish = resolve));
    },
    () => 3000,
    c.now,
    c.set,
    c.clear
  );
  scheduler.start();
  scheduler.start();
  await c.advance(3000);
  scheduler.wake();
  scheduler.wake();
  scheduler.reschedule();
  await c.advance(60000);
  assert.equal(calls, 1);
  assert.equal(c.count(), 0);
  finish(true);
  await new Promise((resolve) => setImmediate(resolve));
  await c.advance(0);
  assert.equal(calls, 2);
});

test('failures back off to a minute; wake and reschedule cannot bypass it; success resets it', async () => {
  const c = clock();
  let calls = 0;
  let fail = true;
  const warning = console.warn;
  console.warn = () => {};
  try {
    const scheduler = new PollScheduler(
      async () => {
        calls++;
        if (fail) throw new Error('offline');
        return true;
      },
      () => 3000,
      c.now,
      c.set,
      c.clear
    );
    scheduler.start();
    await c.advance(3000);
    for (const delay of [3000, 6000, 12000, 24000, 48000, 60000, 60000]) {
      scheduler.wake();
      scheduler.reschedule();
      const before = calls;
      await c.advance(delay - 1);
      assert.equal(calls, before);
      await c.advance(1);
      assert.equal(calls, before + 1);
    }
    fail = false;
    await c.advance(60000);
    const before = calls;
    await c.advance(3000);
    assert.equal(calls, before + 1);
  } finally {
    console.warn = warning;
  }
});

test('empty polls and realtime interval changes reschedule', async () => {
  const c = clock();
  let interval = 3000;
  let calls = 0;
  const scheduler = new PollScheduler(
    async () => {
      calls++;
      return false;
    },
    () => interval,
    c.now,
    c.set,
    c.clear
  );
  scheduler.start();
  interval = 15000;
  scheduler.reschedule();
  await c.advance(14999);
  assert.equal(calls, 0);
  await c.advance(1);
  assert.equal(calls, 1);
  scheduler.wake();
  await c.advance(0);
  assert.equal(calls, 2);
});
