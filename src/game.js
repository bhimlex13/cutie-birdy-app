const GRAVITY = 0.6;
const FLAP = -9;
const STATE_READY = 'ready';
const STATE_PLAYING = 'playing';
const STATE_GAME_OVER = 'gameover';

export default class Game {
  constructor(ctx, ui, canvas) {
    this.ctx = ctx;
    this.ui = ui;
    this.canvas = canvas;
    this._onKey = this._onKey.bind(this);
    this.reset();
  }

  reset() {
    this.bird = { x: 80, y: 120, w: 34, h: 24, vy: 0 };
    this.pipes = [];
    this.ticks = 0;
    this.score = 0;
    this.high = Number(localStorage.getItem('cutie-high') || 0);
    this.running = false;
    this.gameOver = false;
    this.state = STATE_READY;
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('pointerdown', this._onKey);
    this._loop();
  }

  _onKey(e) {
    if (e.code !== 'Space' && e.type !== 'pointerdown') return;

    if (this.state === STATE_GAME_OVER || this.gameOver) {
      this.reset();
      this.state = STATE_PLAYING;
      this.start();
      this.bird.vy = FLAP;
      return;
    }

    if (this.state === STATE_READY) {
      this.state = STATE_PLAYING;
      this.start();
    }

    this.bird.vy = FLAP;
  }

  _loop() {
    if (!this.running) return;
    this._update();
    this._render();
    requestAnimationFrame(() => this._loop());
  }

  _update() {
    if (this.state !== STATE_PLAYING) return;

    this.ticks++;
    this.bird.vy += GRAVITY;
    this.bird.y += this.bird.vy;

    const ground = this.canvas.height / (window.devicePixelRatio || 1) - 48;
    if (this.bird.y + this.bird.h > ground) {
      this.bird.y = ground - this.bird.h;
      this.bird.vy = 0;
      this._die();
      return;
    }

    if (this.ticks % 90 === 0) this._spawnPipe();
    for (let p of this.pipes) p.x -= 2;
    if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < 0) this.pipes.shift();

    for (let p of this.pipes) {
      if (!p.passed && p.x + p.w < this.bird.x) {
        p.passed = true;
        this.score++;
        if (this.score > this.high) {
          this.high = this.score;
          localStorage.setItem('cutie-high', this.high);
        }
      }
    }

    for (let p of this.pipes) {
      if (
        this._collideRect(this.bird, { x: p.x, y: 0, w: p.w, h: p.top }) ||
        this._collideRect(this.bird, { x: p.x, y: p.bottom, w: p.w, h: this.canvas.height })
      ) {
        this._die();
      }
    }
  }

  _die() {
    this.gameOver = true;
    this.state = STATE_GAME_OVER;
    this.running = false;
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('pointerdown', this._onKey);
  }

  _spawnPipe() {
    const w = 60;
    const gap = 140;
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const top = 60 + Math.random() * (h - 240 - gap);
    const bottom = top + gap;
    this.pipes.push({ x: this.canvas.width / (window.devicePixelRatio || 1) + 10, w, top, bottom, passed: false });
  }

  _collideRect(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#8ed2ff';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#2b8a3e';
    for (let p of this.pipes) {
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.bottom, p.w, h - p.bottom);
    }

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(this.bird.x + this.bird.w / 2, this.bird.y + this.bird.h / 2, this.bird.w / 2, this.bird.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c2a45a';
    ctx.fillRect(0, h - 48, w, 48);

    if (this.state === STATE_READY) {
      ctx.fillStyle = '#111';
      ctx.font = '20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tap or press space to start', w / 2, h / 2 - 8);
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText('Avoid the pipes and flap to survive', w / 2, h / 2 + 24);
    } else if (this.state === STATE_GAME_OVER) {
      ctx.fillStyle = '#111';
      ctx.font = '24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2 - 8);
      ctx.font = '16px Inter, system-ui, sans-serif';
      ctx.fillText('Tap or press space to restart', w / 2, h / 2 + 24);
    }

    const stateMessage = this.state === STATE_GAME_OVER
      ? ' · Game Over — tap/space to restart'
      : this.state === STATE_READY
        ? ' · Tap/space to start'
        : '';

    this.ui.innerHTML = `Score: ${this.score} · High: ${this.high}${stateMessage}`;
  }
}
