const GRAVITY = 0.6;
const FLAP = -9;

export default class Game {
  constructor(ctx, ui, canvas) {
    this.ctx = ctx;
    this.ui = ui;
    this.canvas = canvas;
    this.reset();
    this._onKey = this._onKey.bind(this);
  }

  reset() {
    this.bird = { x: 80, y: 120, w: 34, h: 24, vy: 0 }; // simple rectangle bird
    this.pipes = [];
    this.ticks = 0;
    this.score = 0;
    this.high = Number(localStorage.getItem('cutie-high') || 0);
    this.running = false;
    this.gameOver = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('pointerdown', this._onKey);
    this._loop();
  }

  _onKey(e){
    if (e.code === 'Space' || e.type === 'pointerdown') {
      if (this.gameOver) {
        this.reset();
        this.gameOver = false;
        return;
      }
      this.bird.vy = FLAP;
    }
  }

  _loop(){
    if (!this.running) return;
    this._update();
    this._render();
    requestAnimationFrame(()=>this._loop());
  }

  _update(){
    this.ticks++;
    // physics
    this.bird.vy += GRAVITY;
    this.bird.y += this.bird.vy;
    // ground
    const ground = this.canvas.height / (window.devicePixelRatio || 1) - 48;
    if (this.bird.y + this.bird.h > ground) {
      this.bird.y = ground - this.bird.h;
      this.bird.vy = 0;
      this._die();
    }

    // pipes
    if (this.ticks % 90 === 0) this._spawnPipe();
    for (let p of this.pipes) p.x -= 2;
    if (this.pipes.length && this.pipes[0].x + this.pipes[0].w < 0) this.pipes.shift();

    // score
    for (let p of this.pipes) {
      if (!p.passed && p.x + p.w < this.bird.x) { p.passed = true; this.score++; if (this.score>this.high){this.high=this.score; localStorage.setItem('cutie-high', this.high);} }
    }

    // collision
    for (let p of this.pipes) {
      if (this._collideRect(this.bird, {x:p.x,y:0,w:p.w,h:p.top}) || this._collideRect(this.bird, {x:p.x,y:p.bottom,w:p.w,h:this.canvas.height})) {
        this._die();
      }
    }
  }

  _die(){
    this.gameOver = true;
    this.running = false;
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('pointerdown', this._onKey);
  }

  _spawnPipe(){
    const w = 60;
    const gap = 140;
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const top = 60 + Math.random() * (h - 240 - gap);
    const bottom = top + gap;
    this.pipes.push({ x: this.canvas.width/(window.devicePixelRatio||1) + 10, w, top, bottom, passed:false });
  }

  _collideRect(a,b){
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  _render(){
    const ctx = this.ctx;
    const w = this.canvas.width/(window.devicePixelRatio||1);
    const h = this.canvas.height/(window.devicePixelRatio||1);
    ctx.clearRect(0,0,w,h);

    // background
    ctx.fillStyle = '#8ed2ff';
    ctx.fillRect(0,0,w,h);

    // pipes
    ctx.fillStyle = '#2b8a3e';
    for (let p of this.pipes){
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.bottom, p.w, h - p.bottom);
    }

    // bird
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(this.bird.x + this.bird.w/2, this.bird.y + this.bird.h/2, this.bird.w/2, this.bird.h/2, 0, 0, Math.PI*2);
    ctx.fill();

    // ground
    ctx.fillStyle = '#c2a45a';
    ctx.fillRect(0, h - 48, w, 48);

    // ui
    this.ui.innerHTML = `Score: ${this.score} · High: ${this.high}` + (this.gameOver ? ' · Game Over — tap/space to restart' : '');
  }
}
