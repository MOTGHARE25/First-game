const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Logical game size (kept for game math). Canvas will scale to fit display.
const LOGICAL_W = 480, LOGICAL_H = 640;
let DPR = window.devicePixelRatio || 1;
let W = LOGICAL_W, H = LOGICAL_H;

let frame = 0;
let score = 0;
let level = 1;

// Level settings: [gapSize, pipeSpeed, spawnIntervalFrames]
const LEVELS = [
  [180, 2, 120],
  [160, 2.4, 110],
  [140, 2.8, 100],
  [120, 3.4, 90],
  [100, 4.2, 80]
];

const bird = {
  x: 100,
  y: H/2,
  r: 16,
  vy: 0,
  gravity: 0.45,
  flapPower: -8
};

let pipes = [];
let gameOver = false;
let running = false;

function reset(){
  frame = 0; score = 0; level = 1; pipes = []; bird.y = H/2; bird.vy = 0; gameOver = false; running = true;
}

function spawnPipe(){
  const [gap] = LEVELS[level-1];
  const topH = Math.random()*(H - gap - 160) + 40;
  pipes.push({x: W + 20, top: topH, bottom: topH + gap, passed: false});
}

function update(){
  if(!running) return;
  frame++;
  // Level progression
  level = Math.min(5, Math.floor(score/5)+1);

  const [gap, speed, spawnInt] = LEVELS[level-1];

  // Spawn
  if(frame % spawnInt === 0) spawnPipe();

  // Bird physics
  bird.vy += bird.gravity;
  bird.y += bird.vy;

  // Pipes movement
  for(let p of pipes){
    p.x -= speed;
    if(!p.passed && p.x + 30 < bird.x){ p.passed = true; score++; }
  }
  // Remove offscreen
  pipes = pipes.filter(p => p.x > -60);

  // Collisions
  if(bird.y + bird.r > H || bird.y - bird.r < 0) endGame();
  for(let p of pipes){
    // top pipe box
    if(circleRectCollision(bird.x, bird.y, bird.r, p.x, 0, 52, p.top)) endGame();
    // bottom
    if(circleRectCollision(bird.x, bird.y, bird.r, p.x, p.bottom, 52, H - p.bottom)) endGame();
  }
}

function circleRectCollision(cx,cy,r,rx,ry,rw,rh){
  const nearestX = Math.max(rx, Math.min(cx, rx+rw));
  const nearestY = Math.max(ry, Math.min(cy, ry+rh));
  const dx = cx - nearestX; const dy = cy - nearestY;
  return (dx*dx + dy*dy) <= r*r;
}

function draw(){
  // BG
  ctx.clearRect(0,0,W,H);
  // soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0,0,W,H);

  // pipes
  for(let p of pipes){
    // top
    ctx.fillStyle = '#2e8b57';
    ctx.fillRect(p.x, 0, 52, p.top);
    // bottom
    ctx.fillRect(p.x, p.bottom, 52, H - p.bottom);
    // decor
    ctx.fillStyle = '#1e5c3f';
    ctx.fillRect(p.x+34, Math.min(p.top-14, p.top), 18, 8);
  }

  // bird
  ctx.beginPath(); ctx.fillStyle = '#ffd166'; ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff6b6b'; ctx.fillRect(bird.x+12, bird.y-6, 16, 12);

  // HUD
  document.getElementById('score').textContent = 'Score: '+score;
  document.getElementById('level').textContent = 'Level: '+level;

  if(!running){
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(40, H/2-56, W-80, 112);
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font='20px Arial';
    ctx.fillText(gameOver ? 'Game Over — Click or Space to restart' : 'Click or Space to start', W/2, H/2);
  }
}

function endGame(){
  running = false; gameOver = true;
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }

// controls
window.addEventListener('keydown', e=>{ if(e.code==='Space') flap(); });
canvas.addEventListener('click', ()=> flap());
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, {passive:false});

function flap(){
  if(!running){ reset(); return; }
  bird.vy = bird.flapPower;
}

// Responsive canvas resize: scale logical game to element size
function resizeCanvas(){
  DPR = window.devicePixelRatio || 1;
  const maxWidth = Math.min(window.innerWidth - 40, 520);
  const scale = Math.min(1, maxWidth / LOGICAL_W);
  const displayW = Math.round(LOGICAL_W * scale);
  const displayH = Math.round(LOGICAL_H * scale);
  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
  canvas.width = Math.round(displayW * DPR);
  canvas.height = Math.round(displayH * DPR);
  // scale drawing so game math stays in LOGICAL coords
  ctx.setTransform(DPR * (displayW/LOGICAL_W), 0, 0, DPR * (displayH/LOGICAL_H), 0, 0);
  W = LOGICAL_W; H = LOGICAL_H;
}

window.addEventListener('resize', resizeCanvas);

// Start loop
resizeCanvas(); reset(); loop();
