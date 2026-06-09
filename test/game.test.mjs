import test from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};

global.window = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener(name, handler) {
    listeners[name] = listeners[name] || [];
    listeners[name].push(handler);
  },
  removeEventListener(name, handler) {
    listeners[name] = (listeners[name] || []).filter((fn) => fn !== handler);
  },
};

global.localStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
};

global.requestAnimationFrame = () => 1;

test('starts in a ready state and begins playing after first input', async () => {
  const { default: Game } = await import('../src/game.js');
  const ctx = {
    clearRect() {},
    fillRect() {},
    beginPath() {},
    ellipse() {},
    fill() {},
    setTransform() {},
    fillText() {},
  };
  const ui = { innerHTML: '' };
  const canvas = { width: 800, height: 600, style: {} };

  const game = new Game(ctx, ui, canvas);

  assert.equal(game.state, 'ready');
  assert.equal(game.running, false);

  game._onKey({ type: 'pointerdown' });

  assert.equal(game.state, 'playing');
  assert.equal(game.running, true);
  assert.ok(game.bird.vy < 0);
});
