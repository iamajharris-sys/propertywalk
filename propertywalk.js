// ── MAP IMAGE ──────────────────────────────────────────────────────
// Paste your Webflow map URL here. The game loads it as the world.
// Until a real map is set, a placeholder grid world is used so you can
// still see the camera-follow + walking working.
var MAP_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1b803aedaee5a60b52c2f9_New%20Map.png';

// ── SPRITE SHEET (Sarah v7 hybrid, 4x4 grid of 512px cells) ──
// Layout:  row 0 = facing DOWN (4 frames, mostly static)
//          row 1 = SIDE WALK (4-frame walk cycle, nice shuffle, badge removed)
//                  → used for LEFT as-is, mirrored horizontally for RIGHT
//          row 2 = (kept for reference, unused now)
//          row 3 = facing UP    (4 frames, static back view)
var SHEET_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1a123b82851905195d55d1_sarah_v7_final.png';
var CELL = 512;
// Map facing direction to {row, mirror, dx, dy}. dx/dy nudge the sprite
// relative to the footbox anchor (P.x, P.y = bottom-center of footbox).
// ZEROED OUT for clean tuning baseline. Turn on Edit mode to see the footbox
// rectangle and align Sarah's feet to it one direction at a time.
// Negative dx = move LEFT, positive dx = move RIGHT.
// Negative dy = move UP, positive dy = move DOWN.
var FACING_FRAME = {
  down:  { row:0, mirror:false, dx:-10, dy:0, hScale:1.0,  wScale:1.17 },
  left:  { row:1, mirror:false, dx:-10, dy:0, hScale:1.0,  wScale:1.0  },
  right: { row:1, mirror:true,  dx:10,  dy:0, hScale:1.0,  wScale:1.0  },
  up:    { row:3, mirror:false, dx:-10, dy:0, hScale:1.0,  wScale:1.0  },
};
// Number of frames per walk cycle (4 in our new sheet).
var WALK_LEN   = 4;
// How many game-loop ticks each frame is held (lower = faster animation).
var FRAME_TICK = 7;
var PROFILE_ASPECT = 0.78;

var sheet = new Image(); sheet.src = SHEET_URL;

// ── CELEBRATION SPRITE SHEET ─────────────────────────────────────
// 3 frames horizontally arranged in a 2048×2048 image. Frame 1 (peak) has
// Sarah airborne, so her feet are NOT at the same y as frames 0 and 2.
// CELEB_FEET_Y_SRC stores the source-pixel feet-y for each frame so we can
// anchor each frame's feet to Sarah's world position regardless of where
// the art draws them within the cell.
var CELEBRATION_SHEET_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1bb9a7ba03ba59ac722312_EDIT_the_existing_Sarah_charac_Nano_Banana_2_54005-removebg.png';
var CELEBRATION_CELL_W = 2048 / 3;       // ~682.67px per cell horizontally
var CELEBRATION_SHEET_H = 2048;
// Measured pixel positions of feet in each frame's source cell:
//   Frame 0 (anticipation, on ground):  feet at y=1943
//   Frame 1 (peak, airborne):           feet at y=1573 (370px higher)
//   Frame 2 (landing, on ground):       feet at y=1943
var CELEB_FEET_Y_SRC = [1943, 1573, 1943];
// Animation parameters
var CELEBRATION_DURATION = 600;          // ms — total celebration length
var CELEBRATION_JUMP_HEIGHT = 75;        // world-px peak elevation
var celebrationSheet = new Image(); celebrationSheet.src = CELEBRATION_SHEET_URL;
var mapImg = new Image(); var mapReady=false, mapFailed=false;

// World dimensions (set once the map loads; placeholder until then)
var WORLD = { w: 2048, h: 2048 };

// ── COLLISION BOXES (world-pixel coords for the 2048x2048 New Map) ──
// v7 — AJ's second hand-tuned export with deeper coverage (113 boxes):
// interior walls, furniture, statues, planters, smaller obstacles, and
// the roof-access door frame.
var COLLISION_DEFAULTS = [
  {x:290,  y:178,  w:1425, h:20},
  {x:140,  y:1780, w:1667, h:50},
  {x:103,  y:500,  w:77,   h:1530},
  {x:1838, y:250,  w:45,   h:1530},
  {x:133,  y:97,   w:273,  h:320},
  {x:700,  y:657,  w:83,   h:220},
  {x:897,  y:1263, w:70,   h:93},
  {x:1620, y:1680, w:157,  h:40},
  {x:130,  y:100,  w:440,  h:80},
  {x:1610, y:983,  w:147,  h:47},
  {x:140,  y:260,  w:110,  h:80},
  {x:340,  y:260,  w:120,  h:50},
  {x:120,  y:350,  w:140,  h:110},
  {x:110,  y:260,  w:50,   h:140},
  {x:190,  y:413,  w:97,   h:113},
  {x:290,  y:80,   w:150,  h:90},
  {x:800,  y:135,  w:37,   h:320},
  {x:1377, y:153,  w:40,   h:280},
  {x:807,  y:107,  w:280,  h:50},
  {x:1447, y:157,  w:420,  h:40},
  {x:1387, y:280,  w:45,   h:250},
  {x:1620, y:150,  w:140,  h:100},
  {x:1263, y:193,  w:130,  h:150},
  {x:1840, y:230,  w:100,  h:140},
  {x:180,  y:470,  w:103,  h:120},
  {x:120,  y:618,  w:243,  h:203},
  {x:120,  y:780,  w:50,   h:80},
  {x:877,  y:1487, w:290,  h:57},
  {x:185,  y:942,  w:240,  h:212},
  {x:740,  y:793,  w:73,   h:60},
  {x:598,  y:547,  w:152,  h:123},
  {x:1157, y:617,  w:83,   h:127},
  {x:827,  y:380,  w:440,  h:93},
  {x:767,  y:753,  w:93,   h:100},
  {x:1107, y:830,  w:398,  h:115},
  {x:1000, y:853,  w:37,   h:180},
  {x:1320, y:1133, w:116,  h:97},
  {x:1512, y:571,  w:342,  h:73},
  {x:1467, y:613,  w:420,  h:40},
  {x:580,  y:1510, w:23,   h:273},
  {x:1157, y:510,  w:110,  h:23},
  {x:1378, y:870,  w:115,  h:317},
  {x:1658, y:710,  w:213,  h:148},
  {x:1183, y:620,  w:123,  h:113},
  {x:833,  y:1087, w:60,   h:140},
  {x:670,  y:1443, w:67,   h:73},
  {x:761,  y:1156, w:72,   h:60},
  {x:897,  y:1617, w:370,  h:350},
  {x:237,  y:1343, w:305,  h:87},
  {x:1380, y:1510, w:90,   h:263},
  {x:220,  y:1410, w:263,  h:140},
  {x:940,  y:1253, w:87,   h:73},
  {x:170,  y:1310, w:420,  h:40},
  {x:1500, y:1740, w:420,  h:40},
  {x:1113, y:1100, w:113,  h:120},
  {x:1533, y:1273, w:280,  h:70},
  {x:1513, y:1343, w:357,  h:80},
  {x:100,  y:1073, w:320,  h:73},
  {x:643,  y:1467, w:50,   h:303},
  {x:1180, y:1700, w:60,   h:260},
  {x:757,  y:1633, w:80,   h:140},
  {x:1337, y:1497, w:87,   h:280},
  {x:807,  y:714,  w:97,   h:70},
  {x:767,  y:649,  w:111,  h:82},
  {x:608,  y:783,  w:108,  h:97},
  {x:599,  y:662,  w:155,  h:129},
  {x:851,  y:1321, w:67,   h:107},
  {x:991,  y:1374, w:67,   h:53},
  {x:1119, y:1336, w:82,   h:81},
  {x:1601, y:1400, w:163,  h:185},
  {x:1524, y:631,  w:347,  h:87},
  {x:714,  y:1174, w:57,   h:73},
  {x:664,  y:1241, w:47,   h:37},
  {x:537,  y:1151, w:83,   h:147},
  {x:597,  y:1274, w:70,   h:53},
  {x:1244, y:151,  w:30,   h:387},
  {x:220,  y:1110, w:60,   h:95},
  {x:240,  y:859,  w:60,   h:102},
  {x:362,  y:238,  w:140,  h:43},
  {x:445,  y:273,  w:55,   h:70},
  {x:750,  y:167,  w:72,   h:287},
  {x:662,  y:167,  w:132,  h:83},
  {x:817,  y:765,  w:73,   h:60},
  {x:1579, y:520,  w:145,  h:45},
  {x:1779, y:470,  w:70,   h:118},
  {x:1657, y:518,  w:185,  h:68},
  {x:1487, y:1310, w:58,   h:85},
  {x:1247, y:653,  w:100,  h:45},
  {x:1509, y:313,  w:58,   h:155},
  {x:1522, y:420,  w:135,  h:50},
  {x:1729, y:338,  w:123,  h:93},
  {x:1779, y:408,  w:58,   h:85},
  {x:667,  y:608,  w:123,  h:55},
  {x:522,  y:1325, w:65,   h:68},
  {x:1274, y:330,  w:28,   h:105},
  {x:794,  y:628,  w:58,   h:38},
  {x:1347, y:805,  w:130,  h:53},
  {x:1397, y:780,  w:73,   h:68},
  {x:1407, y:758,  w:38,   h:100},
  {x:742,  y:1155, w:30,   h:25},
  {x:744,  y:1203, w:50,   h:35},
  {x:697,  y:1230, w:68,   h:43},
  {x:787,  y:1178, w:53,   h:48},
  {x:739,  y:585,  w:35,   h:70},
  {x:1422, y:223,  w:63,   h:55},
  {x:1324, y:1226, w:43,   h:85},
  {x:1362, y:1233, w:45,   h:35},
  {x:1459, y:1343, w:50,   h:43},
  {x:1387, y:478,  w:33,   h:83},
  {x:834,  y:423,  w:25,   h:105},
  {x:767,  y:830,  w:55,   h:63},
  {x:679,  y:853,  w:138,  h:73},
];

// Per-session edits (overrides). Persists to localStorage on the live site.
// v7 = AJ's second hand-tuned export (113 boxes). Bumping the key flushes
//      the v6 cache from any returning users so they pull the new defaults.
var LS_KEY = 'pw_collisions_v7';
var COLLISIONS = [];
var LS_OK = true;  // becomes false if localStorage is blocked (e.g. preview sandbox)
function loadCollisions(){
  try{ var s=localStorage.getItem(LS_KEY); if(s){ COLLISIONS=JSON.parse(s); return; } }catch(e){ LS_OK=false; }
  COLLISIONS = COLLISION_DEFAULTS.map(function(b){ return {x:b.x,y:b.y,w:b.w,h:b.h}; });
}
function saveCollisions(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(COLLISIONS)); flashSaveStatus(true); }
  catch(e){ LS_OK=false; flashSaveStatus(false); }
}
function flashSaveStatus(ok){
  var el = document.getElementById('save-status'); if(!el) return;
  el.textContent = ok ? '✓ saved ('+COLLISIONS.length+')' : '⚠ LS blocked — use Export';
  el.style.color = ok ? '#7CFC9A' : '#F5A623';
  clearTimeout(flashSaveStatus._t);
  flashSaveStatus._t = setTimeout(function(){ if(ok) el.style.opacity='0.5'; }, 1500);
  el.style.opacity='1';
}

// Editor state
var SHOW_COLL = false;
var EDIT = false;
var SEL = -1;
var FOOT_SEL = false;     // player foot-box selected (resizable, not movable)
var DRAG = null;
var HANDLE_SIZE = 14;

function loadMap(){
  if(!MAP_URL || MAP_URL==='PASTE_MAP_CDN_URL_HERE'){ mapFailed=true; document.getElementById('mapstatus').textContent='placeholder world (no map set)'; return; }
  mapImg.onload=function(){ mapReady=true; WORLD.w=mapImg.naturalWidth; WORLD.h=mapImg.naturalHeight; document.getElementById('mapstatus').textContent='map '+WORLD.w+'×'+WORLD.h; placePlayer(); };
  mapImg.onerror=function(){ mapFailed=true; document.getElementById('mapstatus').textContent='map failed to load — placeholder'; };
  mapImg.src=MAP_URL;
}

// ── CANVAS / CAMERA ─────────────────────────────────────────────────
var canvas, ctx, VW, VH;        // viewport (canvas) size in CSS px
var ZOOM = 1.0;                 // how zoomed-in the camera is
var cam = { x:0, y:0 };         // camera top-left in WORLD coords

var P = { x:1024, y:1024, w:72, h:152, facing:'down', moving:false, fr:0, frT:0, spd:5, bob:0, bobT:0, celebrating:false, celebrateStart:0 };

// ── SPARKLE PARTICLES (celebration flourish) ─────────────────────
// Particle pool — pushed on celebration start, updated/drawn each frame,
// removed when their life expires.
var sparkles = [];
var SPARKLE_COLORS = ['#FFD700', '#FFFFFF'];  // gold and white only

function spawnCelebrationSparkles(x, y){
  // 12 sparkles burst around Sarah's body center
  for(var i=0; i<12; i++){
    var angle = Math.random() * Math.PI * 2;
    var speed = 1.5 + Math.random() * 2.5;
    sparkles.push({
      x: x,
      y: y - 60,                           // start at her body, not feet
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,    // bias upward
      life: 600 + Math.random()*250,
      born: performance.now(),
      color: SPARKLE_COLORS[Math.floor(Math.random()*SPARKLE_COLORS.length)],
      size: 6 + Math.random()*5,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random()-0.5) * 0.2,
    });
  }
}

function updateAndDrawSparkles(){
  var now = performance.now();
  for(var i=sparkles.length-1; i>=0; i--){
    var s = sparkles[i];
    var age = now - s.born;
    if(age >= s.life){ sparkles.splice(i, 1); continue; }
    // physics
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.05;     // slight gravity so they arc back down
    s.vx *= 0.98;     // air resistance
    s.rot += s.rotSpd;
    // alpha fades out over the lifetime (quadratic for smoother end)
    var lifeT = age / s.life;
    var alpha = 1 - lifeT * lifeT;
    // draw as a 4-pointed star
    var screenX = w2sX(s.x);
    var screenY = w2sY(s.y);
    var size = s.size * ZOOM;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(s.rot);
    ctx.fillStyle = hexToRgba(s.color, alpha);
    // 4-pointed star path
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size*0.3, -size*0.3);
    ctx.lineTo(size, 0);
    ctx.lineTo(size*0.3, size*0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size*0.3, size*0.3);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size*0.3, -size*0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
var K = { up:false, down:false, left:false, right:false };
var JOY = { active:false, vx:0, vy:0, id:null, bx:0, by:0 };

function sizeCanvas(){
  VW=canvas.offsetWidth; VH=canvas.offsetHeight;
  var dpr=window.devicePixelRatio||1;
  canvas.width=VW*dpr; canvas.height=VH*dpr;
  canvas.style.width=VW+'px'; canvas.style.height=VH+'px';
  ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
}

function placePlayer(){
  // Spawn next to Sarah's desk in the UNREAD EMAILS office (top-left).
  // Coords locked from AJ's in-game placement.
  P.x=566; P.y=375;
  // If that lands inside a wall, spiral outward to find clear ground
  if(!canStand(P.x, P.y)){
    var step = 40;
    outer: for(var r=1;r<60;r++){
      for(var a=0;a<8;a++){
        var ang=a*Math.PI/4;
        var tx=P.x+Math.cos(ang)*step*r, ty=P.y+Math.sin(ang)*step*r;
        if(canStand(tx,ty)){ P.x=tx; P.y=ty; break outer; }
      }
    }
  }
}

// Convert world coords to screen coords given the camera + zoom
function w2sX(wx){ return (wx - cam.x)*ZOOM; }
function w2sY(wy){ return (wy - cam.y)*ZOOM; }

function updateCamera(){
  // Center camera on player, then clamp so we never show outside the world.
  var halfW = VW/(2*ZOOM), halfH = VH/(2*ZOOM);
  cam.x = P.x - halfW;
  cam.y = P.y - halfH;
  // Clamp. If the world is smaller than the viewport at this zoom, center it.
  var maxX = WORLD.w - VW/ZOOM, maxY = WORLD.h - VH/ZOOM;
  if(maxX < 0) cam.x = maxX/2; else cam.x = Math.max(0, Math.min(maxX, cam.x));
  if(maxY < 0) cam.y = maxY/2; else cam.y = Math.max(0, Math.min(maxY, cam.y));
}

// Player's collision footprint is a small box at her feet (not the full sprite),
// so she can stand next to walls without her head clipping things.
// Player's collision footprint — small box at her feet, editable in edit mode.
var FOOT = { w:54, h:30 };

// ── HIDE ZONES (doorways / archways) ────────────────────────────
// When Sarah's feet (P.x, P.y) land inside any zone, her sprite is hidden
// (shadow stays visible). Creates a "walking through a doorway" effect.
// Coords are world-space {x, y, w, h} rectangles.
// Cleared for new map — add back per-doorway after collision is dialed in.
var HIDE_ZONES = [];
var LS_FOOT_KEY = 'pw_foot_v1';
function loadFoot(){
  try{ var s=localStorage.getItem(LS_FOOT_KEY); if(s){ var f=JSON.parse(s); if(f && f.w>0 && f.h>0){ FOOT=f; } } }catch(e){}
}
function saveFoot(){ try{ localStorage.setItem(LS_FOOT_KEY, JSON.stringify(FOOT)); flashSaveStatus(true); }catch(e){ flashSaveStatus(false); } }
function footBox(x,y){ return {x:x-FOOT.w/2, y:y-FOOT.h, w:FOOT.w, h:FOOT.h}; }
function rectOverlap(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
function canStand(x,y){
  var f = footBox(x,y);
  for(var i=0;i<COLLISIONS.length;i++){ if(rectOverlap(f, COLLISIONS[i])) return false; }
  return true;
}

function drawWorld(){
  // Paint full canvas black first — anything outside the map's world bounds
  // (e.g. when zoomed out or camera clamped at edges) renders black instead
  // of whatever the canvas default background is.
  ctx.fillStyle='#000';
  ctx.fillRect(0, 0, VW, VH);

  if(mapReady){
    // Map the world rect (0,0)..(WORLD.w, WORLD.h) into screen space.
    // The black fill above remains visible anywhere outside this rect.
    ctx.imageSmoothingEnabled=true;
    var sx = w2sX(0), sy = w2sY(0);
    var sw = WORLD.w * ZOOM, sh = WORLD.h * ZOOM;
    ctx.drawImage(mapImg, 0, 0, mapImg.naturalWidth, mapImg.naturalHeight, sx, sy, sw, sh);
  } else {
    // placeholder: checker/grid world so camera motion is visible
    ctx.fillStyle='#e9ecf1'; ctx.fillRect(0,0,VW,VH);
    var grid=128; // world units
    ctx.strokeStyle='rgba(40,60,90,0.18)'; ctx.lineWidth=1;
    var startX = Math.floor(cam.x/grid)*grid;
    for(var gx=startX; gx<cam.x+VW/ZOOM; gx+=grid){
      var sx=w2sX(gx); ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,VH); ctx.stroke();
    }
    var startY = Math.floor(cam.y/grid)*grid;
    for(var gy=startY; gy<cam.y+VH/ZOOM; gy+=grid){
      var sy=w2sY(gy); ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(VW,sy); ctx.stroke();
    }
    // world border
    ctx.strokeStyle='rgba(204,34,0,0.6)'; ctx.lineWidth=3;
    ctx.strokeRect(w2sX(0), w2sY(0), WORLD.w*ZOOM, WORLD.h*ZOOM);
    ctx.fillStyle='rgba(40,60,90,0.4)'; ctx.font='12px IBM Plex Mono'; ctx.textAlign='center';
    ctx.fillText('PLACEHOLDER WORLD — paste MAP_URL to load your map', VW/2, 20);
  }
}

// World coords for a screen point (used by editor mouse input)
function s2wX(sx){ return sx/ZOOM + cam.x; }
function s2wY(sy){ return sy/ZOOM + cam.y; }

function drawCollisions(){
  if(!SHOW_COLL && !EDIT) return;
  for(var i=0;i<COLLISIONS.length;i++){
    var b=COLLISIONS[i];
    var x=w2sX(b.x), y=w2sY(b.y), w=b.w*ZOOM, h=b.h*ZOOM;
    if(x+w<-10||y+h<-10||x>VW+10||y>VH+10) continue;  // cull offscreen
    var isSel = EDIT && i===SEL;
    ctx.fillStyle = isSel ? 'rgba(41,171,226,0.30)' : 'rgba(204,34,0,0.22)';
    ctx.fillRect(x,y,w,h);
    ctx.strokeStyle = isSel ? 'rgba(41,171,226,1)' : 'rgba(255,60,30,0.85)';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.strokeRect(x,y,w,h);
    if(EDIT){
      ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.font='9px IBM Plex Mono'; ctx.textAlign='left';
      ctx.fillText(i, x+3, y+10);
      if(isSel){
        // resize handles
        var hs=HANDLE_SIZE;
        handlePoints(b).forEach(function(hp){
          var hx=w2sX(hp.x), hy=w2sY(hp.y);
          ctx.fillStyle='#fff'; ctx.fillRect(hx-hs/2,hy-hs/2,hs,hs);
          ctx.strokeStyle='#29ABE2'; ctx.lineWidth=1; ctx.strokeRect(hx-hs/2,hy-hs/2,hs,hs);
        });
      }
    }
  }
  // ── Player foot-box (always shown in edit mode) ──
  if(EDIT){
    var f = footBox(P.x, P.y);
    var fx=w2sX(f.x), fy=w2sY(f.y), fw=f.w*ZOOM, fh=f.h*ZOOM;
    ctx.fillStyle = FOOT_SEL ? 'rgba(245,166,35,0.32)' : 'rgba(41,171,226,0.30)';
    ctx.fillRect(fx,fy,fw,fh);
    ctx.strokeStyle = FOOT_SEL ? 'rgba(245,166,35,1)' : 'rgba(41,171,226,1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx,fy,fw,fh);
    ctx.fillStyle='#fff'; ctx.font='bold 9px IBM Plex Mono'; ctx.textAlign='left';
    ctx.fillText('PLAYER w:'+Math.round(FOOT.w)+' h:'+Math.round(FOOT.h), fx+3, fy-4);
    if(FOOT_SEL){
      var hs=HANDLE_SIZE;
      handlePoints(f).forEach(function(hp){
        var hx=w2sX(hp.x), hy=w2sY(hp.y);
        ctx.fillStyle='#fff'; ctx.fillRect(hx-hs/2,hy-hs/2,hs,hs);
        ctx.strokeStyle='#F5A623'; ctx.lineWidth=1; ctx.strokeRect(hx-hs/2,hy-hs/2,hs,hs);
      });
    }
  }
}

// 8 handle positions on a world-coord box
function handlePoints(b){
  return [
    {k:'nw',x:b.x,        y:b.y       },
    {k:'n', x:b.x+b.w/2,  y:b.y       },
    {k:'ne',x:b.x+b.w,    y:b.y       },
    {k:'e', x:b.x+b.w,    y:b.y+b.h/2 },
    {k:'se',x:b.x+b.w,    y:b.y+b.h   },
    {k:'s', x:b.x+b.w/2,  y:b.y+b.h   },
    {k:'sw',x:b.x,        y:b.y+b.h   },
    {k:'w', x:b.x,        y:b.y+b.h/2 },
  ];
}

// ── EDITOR ───────────────────────────────────────────────────────────
function toggleColl(){ SHOW_COLL=!SHOW_COLL; var b=document.getElementById('btn-coll'); b.textContent='Collision: '+(SHOW_COLL?'ON':'OFF'); b.classList.toggle('on',SHOW_COLL); }
function toggleEdit(){
  EDIT=!EDIT;
  var b=document.getElementById('btn-edit');
  b.textContent='✎ Edit: '+(EDIT?'ON':'OFF');
  b.classList.toggle('on',EDIT);
  document.getElementById('edit-bar').classList.toggle('show',EDIT);
  if(!EDIT) SEL=-1;
}

function pointInRect(px,py,r){ return px>=r.x && px<=r.x+r.w && py>=r.y && py<=r.y+r.h; }
function evToWorld(e){
  var r=canvas.getBoundingClientRect();
  var cx=(e.touches?e.touches[0].clientX:e.clientX) - r.left;
  var cy=(e.touches?e.touches[0].clientY:e.clientY) - r.top;
  return {x:s2wX(cx), y:s2wY(cy), sx:cx, sy:cy};
}

function editStart(e){
  if(!EDIT) return;
  e.preventDefault();
  var m=evToWorld(e);
  var hsW = HANDLE_SIZE/ZOOM;

  // PRIORITY 1: if foot box is selected, check its handles
  if(FOOT_SEL){
    var fb = footBox(P.x, P.y);
    var fpts = handlePoints(fb);
    for(var i=0;i<fpts.length;i++){
      if(Math.abs(m.x-fpts[i].x) < hsW && Math.abs(m.y-fpts[i].y) < hsW){
        DRAG = {target:'foot', handle:fpts[i].k, mx:m.x, my:m.y, orig:{w:FOOT.w, h:FOOT.h}};
        return;
      }
    }
  }
  // PRIORITY 2: if a wall box is selected, check its handles
  if(SEL>=0 && COLLISIONS[SEL]){
    var b=COLLISIONS[SEL];
    var pts=handlePoints(b);
    for(var i=0;i<pts.length;i++){
      if(Math.abs(m.x-pts[i].x) < hsW && Math.abs(m.y-pts[i].y) < hsW){
        DRAG = {target:'box', mode:'resize', handle:pts[i].k, mx:m.x, my:m.y, orig:{x:b.x,y:b.y,w:b.w,h:b.h}};
        return;
      }
    }
  }
  // PRIORITY 3: clicked the foot box body? Select foot, don't drag (position locked)
  var fb2 = footBox(P.x, P.y);
  if(pointInRect(m.x, m.y, fb2)){
    FOOT_SEL = true; SEL = -1; DRAG = null;
    return;
  }
  // PRIORITY 4: topmost wall box under cursor
  var idx=-1;
  for(var j=COLLISIONS.length-1;j>=0;j--){
    if(pointInRect(m.x,m.y,COLLISIONS[j])){ idx=j; break; }
  }
  SEL = idx; FOOT_SEL = false;
  if(idx>=0){
    var b2=COLLISIONS[idx];
    DRAG={target:'box', mode:'move', mx:m.x, my:m.y, orig:{x:b2.x,y:b2.y,w:b2.w,h:b2.h}};
  } else { DRAG=null; }
}
function editMove(e){
  if(!EDIT||!DRAG) return;
  e.preventDefault();
  var m=evToWorld(e), g=DRAG.orig;
  var dx=m.x-DRAG.mx, dy=m.y-DRAG.my;
  var MIN=20;
  if(DRAG.target==='foot'){
    // Resize the player foot box, keeping it centered on the player.
    // Handle direction determines whether we change W, H, or both.
    var nw=g.w, nh=g.h, hk=DRAG.handle;
    if(hk.indexOf('w')>=0) nw = g.w - dx*2;       // pulling west: expand symmetrically
    if(hk.indexOf('e')>=0) nw = g.w + dx*2;
    if(hk.indexOf('n')>=0) nh = g.h - dy*2;
    if(hk.indexOf('s')>=0) nh = g.h + dy*2;
    FOOT.w = Math.max(MIN, nw);
    FOOT.h = Math.max(MIN, nh);
    return;
  }
  // Wall box drag/resize (existing logic)
  if(SEL<0) return;
  var b=COLLISIONS[SEL];
  if(DRAG.mode==='move'){ b.x=g.x+dx; b.y=g.y+dy; }
  else {
    var nx=g.x, ny=g.y, nw=g.w, nh=g.h, hk=DRAG.handle;
    if(hk.indexOf('w')>=0){ nx=g.x+dx; nw=g.w-dx; }
    if(hk.indexOf('e')>=0){ nw=g.w+dx; }
    if(hk.indexOf('n')>=0){ ny=g.y+dy; nh=g.h-dy; }
    if(hk.indexOf('s')>=0){ nh=g.h+dy; }
    if(nw<MIN){ if(hk.indexOf('w')>=0) nx=g.x+g.w-MIN; nw=MIN; }
    if(nh<MIN){ if(hk.indexOf('n')>=0) ny=g.y+g.h-MIN; nh=MIN; }
    b.x=nx; b.y=ny; b.w=nw; b.h=nh;
  }
}
function editEnd(){
  if(DRAG){
    if(DRAG.target==='foot') saveFoot();
    else saveCollisions();
    DRAG=null;
  }
}

function addBox(){
  if(!EDIT) return;
  // Place at the CURRENT VIEW CENTER (camera + half viewport in world units)
  // so it always appears on screen no matter where you're looking.
  var cxW = cam.x + (VW/2)/ZOOM;
  var cyW = cam.y + (VH/2)/ZOOM;
  var sizeW = 200/ZOOM > 80 ? 200/ZOOM : 80;  // scale so it's a reasonable on-screen size
  var nb = { x: cxW - sizeW/2, y: cyW - sizeW/2, w: sizeW, h: sizeW };
  COLLISIONS.push(nb);
  SEL = COLLISIONS.length-1;
  saveCollisions();
}
function deleteSelected(){
  if(!EDIT||SEL<0) return;
  COLLISIONS.splice(SEL,1); SEL=-1; saveCollisions();
}
function resetBoxes(){
  if(!confirm('Reset all collision boxes to the defaults? Your edits will be lost.')) return;
  COLLISIONS = COLLISION_DEFAULTS.map(function(b){ return {x:b.x,y:b.y,w:b.w,h:b.h}; });
  SEL=-1; saveCollisions();
}
function exportBoxes(){
  var body = COLLISIONS.map(function(b){
    return '  {x:'+Math.round(b.x)+',y:'+Math.round(b.y)+',w:'+Math.round(b.w)+',h:'+Math.round(b.h)+'}';
  }).join(',\n');
  var out = '// player foot box\nFOOT = {w:'+Math.round(FOOT.w)+', h:'+Math.round(FOOT.h)+'};\n\n'
         + '// collision boxes\n[\n'+body+'\n]';
  document.getElementById('export-text').value = out;
  document.getElementById('export-pane').classList.add('show');
}
function closeExport(){ document.getElementById('export-pane').classList.remove('show'); }
function copyExport(){
  var ta=document.getElementById('export-text'); ta.select();
  try{ navigator.clipboard.writeText(ta.value); }catch(e){ document.execCommand('copy'); }
}

function drawPlayer(){
  var a = PROFILE_ASPECT;
  var sh = P.h*ZOOM;
  var sw = sh*a;
  var footX = w2sX(P.x), footY = w2sY(P.y);

  // ── doorway hide check: if Sarah's feet are inside any HIDE_ZONE,
  //    skip drawing her sprite (shadow still shows so player knows she's there).
  for(var i=0; i<HIDE_ZONES.length; i++){
    var z = HIDE_ZONES[i];
    if(P.x >= z.x && P.x <= z.x+z.w && P.y >= z.y && P.y <= z.y+z.h){
      // still draw the shadow (always visible)
      var shWh = sw*0.55, shHh = shWh*0.35;
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(footX, footY, shWh/2, shHh/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      return;
    }
  }

  // ── CELEBRATION ANIMATION (priority over normal walking draw) ──
  // If she's celebrating AND the sheet is loaded, draw the celebration frame
  // with a jump-arc Y offset and a shrinking shadow at the peak.
  if(P.celebrating && celebrationSheet.complete && celebrationSheet.naturalWidth){
    var elapsed = performance.now() - P.celebrateStart;
    if(elapsed >= CELEBRATION_DURATION){
      // celebration done — clear state, reset facing to forward (down),
      // and fall through to normal walking draw
      P.celebrating = false;
      P.facing = 'down';
      P.fr = 0;
      P.frT = 0;
    } else {
      var t = elapsed / CELEBRATION_DURATION;   // 0..1
      // Frame timing: 0..25% = frame 0, 25..75% = frame 1, 75..100% = frame 2
      var frameIdx = (t < 0.25) ? 0 : (t < 0.75 ? 1 : 2);
      // Sin-arc jump: 0 → 1 → 0, peaks at t=0.5
      var jumpArc = Math.sin(t * Math.PI);
      var jumpOffsetY = jumpArc * CELEBRATION_JUMP_HEIGHT * ZOOM;
      // Shadow shrinks at peak — same trick as items
      var shadowScale = 1 - jumpArc * 0.45;
      var shW = sw * 0.55 * shadowScale, shH = shW * 0.35;
      // Draw shadow first (on the ground, stays at footY)
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(footX, footY, shW/2, shH/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      // Compute scale: map her standing height (1314 source px) to her world sprite height.
      var S = sh / 1314;
      // Source rect for this frame's cell (full vertical extent)
      var srcX = frameIdx * CELEBRATION_CELL_W;
      var srcY = 0;
      var srcW = CELEBRATION_CELL_W;
      var srcH = CELEBRATION_SHEET_H;
      // Destination size
      var destW = srcW * S;
      var destH = srcH * S;
      // Anchor: her feet (in source pixels) should map to footY on screen,
      // minus the jump arc offset. Center horizontally on footX.
      var feetYInSrc = CELEB_FEET_Y_SRC[frameIdx];
      var destX = footX - destW/2;
      var destY = footY - feetYInSrc * S - jumpOffsetY;
      ctx.drawImage(celebrationSheet, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
      return;
    }
  }

  // ── NORMAL WALKING DRAW (default) ──
  // ── shadow circle on the ground (always drawn) ──
  var shW = sw*0.55, shH = shW*0.35;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(footX, footY, shW/2, shH/2, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  var dx = footX - sw/2, dy = footY - sh;

  if(sheet.complete && sheet.naturalWidth){
    // Look up which row and whether to mirror, based on facing direction.
    var f = FACING_FRAME[P.facing] || FACING_FRAME.down;
    var col = P.moving ? (P.fr % WALK_LEN) : 0;
    // Per-direction width and height scales — applied independently so we can
    // make her chunkier/cuter in one direction without affecting others.
    var hScale = (f.hScale !== undefined) ? f.hScale : 1.0;
    var wScale = (f.wScale !== undefined) ? f.wScale : 1.0;
    var sh2 = sh * hScale;
    var sw2 = sw * wScale;
    // Re-anchor so feet stay at footY (P.y in world)
    var dx2 = footX - sw2/2, dy2 = footY - sh2;
    // Per-direction nudge so Sarah's body stays centered on the shadow.
    // Scales with zoom so it stays visually consistent at any zoom level.
    var offX = (f.dx||0) * ZOOM;
    var offY = (f.dy||0) * ZOOM;
    if(f.mirror){
      // Flip the sprite horizontally by scaling x by -1.
      ctx.save();
      ctx.translate(dx2 + sw2 + offX, dy2 + offY);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, col*CELL, f.row*CELL, CELL, CELL, 0, 0, sw2, sh2);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, col*CELL, f.row*CELL, CELL, CELL, dx2+offX, dy2+offY, sw2, sh2);
    }
  } else {
    ctx.fillStyle='#1A2B4A'; ctx.fillRect(dx,dy,sw,sh);
  }
}

// ── MENU MUSIC ────────────────────────────────────────────────────
// Plays on the menu screen, fades out when game starts, fades back in on return.
// Starts MUTED with a "tap to unmute" hint — the user's tap unlocks autoplay AND
// is treated as them choosing to enable music. Mute state persists.
var MENU_MUSIC_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17767e0994d0963646739d_cozypuzzleclearmix.ogg';
var menuMusic = new Audio(MENU_MUSIC_URL);
menuMusic.loop = true;
menuMusic.volume = 0.6;
var MUSIC_VOL = 0.6;
// Always boot muted on page load so the user explicitly opts in to audio.
// We no longer persist this across refreshes — every fresh visit starts
// with the "tap to unmute" prompt visible.
var LS_MUTE_KEY = 'pw_muted_v1';
var IS_MUTED = true;
var musicFadeT = null;

function tryPlayMenuMusic(){
  if(IS_MUTED) return;
  var p = menuMusic.play();
  if(p && p.catch){ p.catch(function(){ /* autoplay blocked — handled by toggleMute */ }); }
}

function toggleMute(e){
  if(e){ e.stopPropagation(); }
  IS_MUTED = !IS_MUTED;
  // Persist user's choice so it survives refresh
  try { localStorage.setItem(LS_MUTE_KEY, IS_MUTED ? 'true' : 'false'); } catch(err) {}
  var btn = document.getElementById('mute-btn');
  var iconOn  = document.getElementById('mute-icon-on');
  var iconOff = document.getElementById('mute-icon-off');
  if(IS_MUTED){
    menuMusic.pause();
    btn.classList.remove('unmuted');
    iconOn.style.display='none';
    iconOff.style.display='block';
  } else {
    btn.classList.add('unmuted');
    iconOn.style.display='block';
    iconOff.style.display='none';
    menuMusic.volume = MUSIC_VOL;
    var p = menuMusic.play();
    if(p && p.catch){ p.catch(function(){}); }
    // NOTE: iOS audio unlock for gameplay sounds happens in startGame(),
    // not here — keeps gameplay audio isolated from the menu.
  }
}

function fadeOutMenuMusic(){
  if(IS_MUTED){ return; }
  if(musicFadeT){ clearInterval(musicFadeT); musicFadeT=null; }
  musicFadeT = setInterval(function(){
    if(menuMusic.volume > 0.04){ menuMusic.volume -= 0.04; }
    else { menuMusic.pause(); menuMusic.currentTime=0; menuMusic.volume=MUSIC_VOL; clearInterval(musicFadeT); musicFadeT=null; }
  }, 60);
}

function fadeInMenuMusic(){
  if(IS_MUTED){ return; }
  if(musicFadeT){ clearInterval(musicFadeT); musicFadeT=null; }
  menuMusic.volume = 0;
  var p = menuMusic.play();
  if(p && p.catch){ p.catch(function(){}); }
  musicFadeT = setInterval(function(){
    if(menuMusic.volume < MUSIC_VOL-0.04){ menuMusic.volume += 0.04; }
    else { menuMusic.volume = MUSIC_VOL; clearInterval(musicFadeT); musicFadeT=null; }
  }, 60);
}

// ── GAMEPLAY MUSIC ────────────────────────────────────────────────
// Plays in a loop while STATE === 'playing'. Fades out on game over,
// fades back in on next play.
var GAMEPLAY_MUSIC_URL = 'https://cdn.jsdelivr.net/gh/iamajharris-sys/propertywalk@main/happy_adveture.mp3';
var gameplayMusic = new Audio(GAMEPLAY_MUSIC_URL);
gameplayMusic.loop = true;
gameplayMusic.volume = MUSIC_VOL;
var gameplayFadeT = null;

function startGameplayMusic(){
  if(IS_MUTED){ return; }
  if(gameplayFadeT){ clearInterval(gameplayFadeT); gameplayFadeT=null; }
  gameplayMusic.currentTime = 0;
  gameplayMusic.volume = 0;
  var p = gameplayMusic.play();
  if(p && p.catch){ p.catch(function(){}); }
  gameplayFadeT = setInterval(function(){
    if(gameplayMusic.volume < MUSIC_VOL-0.04){ gameplayMusic.volume += 0.04; }
    else { gameplayMusic.volume = MUSIC_VOL; clearInterval(gameplayFadeT); gameplayFadeT=null; }
  }, 60);
}

function stopGameplayMusic(){
  if(gameplayFadeT){ clearInterval(gameplayFadeT); gameplayFadeT=null; }
  gameplayFadeT = setInterval(function(){
    if(gameplayMusic.volume > 0.04){ gameplayMusic.volume -= 0.04; }
    else { gameplayMusic.pause(); gameplayMusic.currentTime=0; gameplayMusic.volume=MUSIC_VOL; clearInterval(gameplayFadeT); gameplayFadeT=null; }
  }, 60);
}

// ── PICKUP SFX ────────────────────────────────────────────────────
// Plays when Sarah collects an item. Respects mute. Supports overlap on
// rapid pickups by cloning the audio element each play so two SFX can
// layer on top of each other.
var PICKUP_SFX_URL = 'https://cdn.jsdelivr.net/gh/iamajharris-sys/propertywalk@main/magical_1.ogg';
var pickupSfx = new Audio(PICKUP_SFX_URL);
pickupSfx.volume = 0.7;
pickupSfx.preload = 'auto';

function playPickupSfx(){
  if(IS_MUTED) return;
  try {
    // Rewind the original (already-unlocked-on-iOS) element. We lose the
    // ability to overlap two pickups within ~700ms, but that's better than
    // silence on mobile. Cloned audio elements aren't unlocked on iOS.
    pickupSfx.currentTime = 0;
    pickupSfx.volume = 0.7;
    var p = pickupSfx.play();
    if(p && p.catch){ p.catch(function(){}); }
  } catch(err) { /* silently ignore — pickup still works without sound */ }
}

// ──────────────────────────────────────────────────────────────────
// GAME STATE MACHINE
// ──────────────────────────────────────────────────────────────────
var STATE = 'menu';   // 'menu' | 'playing' (more states later: 'won','lost')

// Power-item sprite sheet — 3×3 grid layout with 5 items (some cells empty,
// some duplicates ignored — we pick the cells we want via ITEM_CELL).
var ITEMS_SHEET_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1baebe5999bd42268ad97e_A_51_sprite_sheet_of_power-up__Nano_Banana_2_34254-removebg.png';
var ITEMS_SHEET_COLS = 3;
var ITEMS_SHEET_ROWS = 3;
// Each item maps to {c, r} (column, row) in the 3×3 grid.
//   ROW 0:  [key]      [phone]    [coffee A — unused]
//   ROW 1:  [coffee B] [cash A — unused] [cash B]
//   ROW 2:  [empty]    [empty]    [package]
var ITEM_CELL = {
  key:     {c:0, r:0},
  phone:   {c:1, r:0},
  coffee:  {c:0, r:1},
  cash:    {c:2, r:1},
  package: {c:2, r:2},
};
var ITEM_COLORS = {
  key:     '#F5C518',  // gold
  phone:   '#29ABE2',  // sky blue (matches phone screen)
  coffee:  '#8B5A2B',  // coffee brown
  cash:    '#7CB342',  // bill green
  package: '#A0522D',  // cardboard brown
};
var ITEM_EMOJI  = { key:'🔑', phone:'📞', coffee:'☕', cash:'💵', package:'📦' };
// Quick affirmation shown in the pickup pill each time an item is collected
var ITEM_PICKUP_MSG = {
  key:     "You've collected a master key!",
  phone:   "You've collected a phone!",
  coffee:  "You've collected a coffee!",
  cash:    "You've collected rent money!",
  package: "You've collected a package!",
};
var itemsSheet = new Image(); itemsSheet.src = ITEMS_SHEET_URL;

// Item world objects: each {id, x, y, taken:false, bobT}
var ITEMS = [];
// Inventory: which item ids have been picked up
var INV = { key:false, phone:false, coffee:false, cash:false, package:false };
// Pickup order — needed so the chain-link inventory bar fills left-to-right
// regardless of which item the player happened to grab first.
var PICKUP_ORDER = [];

// Victory state — set true when all 5 items collected, triggers end screen.
var VICTORY = false;

// Zombies
// Each zombie character has a 2x2 sprite sheet: down/up/right/left.
// (Same layout as Sarah v1 / Grumpy / Karen.)
// ── DEV TOGGLE: zombies on/off
var ZOMBIES_ENABLED = true;

var ZOMBIE_CHARACTERS = {
  // mirrorDir: 'none' | 'left' | 'right' — workaround for sheets where one of
  // the side rows is unreliable. The opposite row is mirrored to fill the
  // bad row. e.g. mirrorDir='left' means use right row mirrored for left.
  // spawn: fixed world-pixel start position (marketing tool — no randomness)
  grumpy: {
    url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1c90f365d062b2a6e7ee6d_Grumpy_guywalking.png',
    name:'Grumpy', enabled:true, chaseSpeed:0.4,
    spawn:{x:505, y:912},
    frameMap:{
      down:  [[0,0],[0,1],[0,2],[0,3]],
      left:  [[1,0],[2,3],[1,0]],
      right: [[2,0],[2,1],[2,2]],
      up:    [[3,0],[3,1],[3,2],[3,3]],
    },
  },
  karen:      { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17a74497f7299d29d06199_Karen_sprites.png',    name:'Karen',      enabled:false, mirrorDir:'none',  chaseSpeed:0.5 },
  complainer: { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1bc11755af9680ca4dc350_Angry_lady.png',       name:'Complainer', enabled:true,  mirrorDir:'left',  chaseSpeed:0.5, spawn:{x:1279, y:1365} },
  talkative:  { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1c93206b8fa6046c5ee76e_Talkative%20guy.png',  name:'Talkative',  enabled:true,  mirrorDir:'left',  chaseSpeed:0.6, rows:{down:0, right:1, left:2, up:3}, spawn:{x:1255, y:1080} },
};
// 4×4 sprite sheet layout — each direction is a row, each row has 4 walk frames.
//   ROW 0: facing DOWN   (4-frame walk cycle)
//   ROW 1: facing LEFT   (4-frame walk cycle)
//   ROW 2: facing RIGHT  (4-frame walk cycle)
//   ROW 3: facing UP     (4-frame walk cycle)
//   COL 0 = idle/stride-neutral (mouth closed)
//   COL 1 = mid-stride (mouth small open)
//   COL 2 = stride-pass (mouth closed)
//   COL 3 = mid-stride other side (mouth wide open / yelling)
var ZOMBIE_ROW = { down:0, left:1, right:2, up:3 };
var ZOMBIE_WALK_LEN = 4;
var ZOMBIE_FRAME_TICK = 8;       // game-loop ticks per walk frame
var ZOMBIE_SHEET_COLS = 4;
var ZOMBIE_SHEET_ROWS = 4;
// Load zombie sprite images
var zombieImgs = {};
Object.keys(ZOMBIE_CHARACTERS).forEach(function(k){
  var im = new Image(); im.src = ZOMBIE_CHARACTERS[k].url;
  zombieImgs[k] = im;
});

// One zombie of each enabled character on the map.
// Detection is 360° (full circle) within ZOMBIE_DETECT radius — she "senses"
// Sarah regardless of which way she's facing.
var ZOMBIE_DETECT = 320;       // world-px detection radius
var ZOMBIE_ALERT_MS = 1000;    // ms pause after spotting Sarah, before chase
// Distance Sarah must come within during alert state to trigger chase.
// If she stays outside this and outside detection escalates, after the
// give-up window the tenant returns to idle.
var ZOMBIE_CHASE_TRIGGER = 220;
var ZOMBIE_GIVEUP_MS = 5000;   // ms before alert tenant gives up and returns idle
var ZOMBIE_CHASE_SPD = 0.5;    // 50% of player speed when chasing
var ZOMBIE_TOUCH_RADIUS = 55;  // touch distance for game-over
var ZOMBIES = [];

function rand(a,b){ return a + Math.random()*(b-a); }

// Find a random walkable point on the map (not inside any collision box).
// Used for spawning items and zombies at the start of each game.
function randomWalkablePoint(){
  for(var tries=0; tries<200; tries++){
    var x = rand(150, WORLD.w-150);
    var y = rand(150, WORLD.h-200);
    if(canStand(x,y)) return {x:x, y:y};
  }
  // Fallback to map center area if we can't find one
  return {x: WORLD.w*0.5, y: WORLD.h*0.4};
}

// Fixed spawn coordinates for each item (world pixels, 2048x2048 map).
// Marketing tool — no randomness so players always hit reachable positions.
var ITEM_SPAWNS = {
  key:     {x:1258, y:1549},
  phone:   {x:210,  y:1700},
  coffee:  {x:1747, y:1123},
  cash:    {x:1643, y:412},
  package: {x:472,  y:594},
};

function spawnItems(){
  ITEMS = [];
  var ids = ['key','phone','coffee','cash','package'];
  ids.forEach(function(id){
    var p = ITEM_SPAWNS[id];
    ITEMS.push({ id:id, x:p.x, y:p.y, taken:false, bobT:Math.random()*Math.PI*2 });
  });
}

function spawnZombies(){
  ZOMBIES = [];
  if(!ZOMBIES_ENABLED) return;
  Object.keys(ZOMBIE_CHARACTERS).forEach(function(charKey){
    var charDef = ZOMBIE_CHARACTERS[charKey];
    if(!charDef.enabled) return;   // skip characters whose sprite isn't ready yet
    var p;
    if(charDef.spawn){
      // Fixed spawn — marketing tool, no randomness
      p = { x: charDef.spawn.x, y: charDef.spawn.y };
    } else {
      // Fallback: random walkable point, biased far from player
      var dx, dy, tries=0;
      do {
        p = randomWalkablePoint();
        dx = p.x-P.x; dy = p.y-P.y;
        tries++;
      } while(Math.sqrt(dx*dx+dy*dy) < 500 && tries<50);
    }
    ZOMBIES.push({
      char: charKey,
      x: p.x, y: p.y,
      facing: 'down',
      state: 'idle',
      fr: 0,
      frT: 0,
      alertStart: 0,
      relentless: false,     // becomes true via triggers (e.g. coffee pickup)
    });
  });
}

// Convert a movement angle to the closest 4-way facing for sprite display
function dirToFacing(angle){
  // angle 0 = +X (right), PI/2 = +Y (down). Normalize and bucket.
  var a = ((angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  if(a < Math.PI*0.25 || a >= Math.PI*1.75) return 'right';
  if(a < Math.PI*0.75) return 'down';
  if(a < Math.PI*1.25) return 'left';
  return 'up';
}

function resetInventory(){
  INV.key=false; INV.phone=false; INV.coffee=false; INV.cash=false; INV.package=false;
  PICKUP_ORDER.length = 0;
  updateInventoryHUD();
}

function updateInventoryHUD(){
  var collected = PICKUP_ORDER.length;
  var slotIds = ['inv-key','inv-phone','inv-coffee','inv-cash','inv-package'];
  var icons = { key:'🔑', phone:'📞', coffee:'☕', cash:'💵', package:'📦' };

  slotIds.forEach(function(slotId, i){
    var el = document.getElementById(slotId);
    if(!el) return;
    var iconSpan = el.querySelector('.seg-icon');
    if(i < collected){
      el.classList.add('filled');
      if(iconSpan && PICKUP_ORDER[i]) iconSpan.textContent = icons[PICKUP_ORDER[i]];
    } else {
      el.classList.remove('filled');
      if(iconSpan) iconSpan.textContent = '';
    }
  });
  // Bridge i fills once collected > i (gold flows continuously left-to-right)
  for(var i=1; i<=4; i++){
    var bridge = document.getElementById('bridge-'+i);
    if(!bridge) continue;
    if(collected > i){ bridge.classList.add('filled'); }
    else             { bridge.classList.remove('filled'); }
  }
  var bar = document.getElementById('inv-bar');
  if(bar) bar.setAttribute('data-filled', String(collected));
}

// ── OBJECTIVE BANNER + ITEM COUNTER ─────────────────────────────
// Total items in the current build.
var TOTAL_ITEMS = 5;

// Pickup pill — shows "..." briefly first, then pokemon-style char-by-char
// reveal of the message, then holds, then fades.
var _pickupTimer = null;
var _pickupTypeTimer = null;
function showPickupMsg(text){
  var el = document.getElementById('pickup-msg');
  if(!el) return;
  // Cancel any in-flight reveal
  if(_pickupTypeTimer) clearInterval(_pickupTypeTimer);
  if(_pickupTimer)     clearTimeout(_pickupTimer);
  el.textContent = '';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  // Phase 1: show "..." typing for half a second
  var dots = ['.', '..', '...'];
  var di = 0;
  el.textContent = dots[0];
  var dotsTimer = setInterval(function(){
    di = (di + 1) % dots.length;
    el.textContent = dots[di];
  }, 160);
  // Phase 2: after 500ms, clear and type the real message
  setTimeout(function(){
    clearInterval(dotsTimer);
    el.textContent = '';
    var i = 0;
    _pickupTypeTimer = setInterval(function(){
      if(i >= text.length){
        clearInterval(_pickupTypeTimer);
        _pickupTypeTimer = null;
        _pickupTimer = setTimeout(function(){ el.classList.remove('show'); }, 1800);
        return;
      }
      el.textContent += text.charAt(i);
      i++;
    }, 40);
  }, 500);
}

// showObjectiveBanner(text, opts)
// opts = { delay (default 1500), hold (default 8200), typed (default false) }
// When typed=true, message reveals char-by-char like the pickup pill.
var _objTypeTimer = null;
var _objHideTimer = null;
function showObjectiveBanner(text, opts){
  opts = opts || {};
  var delay = (opts.delay !== undefined) ? opts.delay : 1500;
  var hold  = (opts.hold  !== undefined) ? opts.hold  : 8200;
  var typed = !!opts.typed;
  var el = document.getElementById('obj-banner');
  var textEl = document.getElementById('obj-text');
  if(!el || !textEl) return;
  el.style.top = 'calc(50% + 36px)';
  el.classList.remove('show');
  // Clear in-flight timers from a previous call
  if(_objTypeTimer){ clearInterval(_objTypeTimer); _objTypeTimer = null; }
  if(_objHideTimer){ clearTimeout(_objHideTimer); _objHideTimer = null; }
  setTimeout(function(){
    if(typed){
      // Type characters in one at a time
      textEl.textContent = '';
      void el.offsetWidth;
      el.classList.add('show');
      var i = 0;
      _objTypeTimer = setInterval(function(){
        if(i >= text.length){
          clearInterval(_objTypeTimer);
          _objTypeTimer = null;
          _objHideTimer = setTimeout(function(){ el.classList.remove('show'); }, hold);
          return;
        }
        textEl.textContent += text.charAt(i);
        i++;
      }, 40);
    } else {
      // Instant reveal
      textEl.textContent = text;
      void el.offsetWidth;
      el.classList.add('show');
      _objHideTimer = setTimeout(function(){ el.classList.remove('show'); }, hold);
    }
  }, delay);
}

function updateItemCounter(){
  var cur = (INV.key?1:0) + (INV.phone?1:0) + (INV.coffee?1:0) + (INV.cash?1:0) + (INV.package?1:0);
  var curEl = document.getElementById('ic-cur');
  var maxEl = document.getElementById('ic-max');
  if(curEl) curEl.textContent = cur;
  if(maxEl) maxEl.textContent = TOTAL_ITEMS;
}

function showItemCounter(){
  var el = document.getElementById('item-counter');
  if(el) el.classList.add('show');
  updateItemCounter();
}
function hideItemCounter(){
  var el = document.getElementById('item-counter');
  if(el) el.classList.remove('show');
}

function startGame(){
  // "Start Game" button click → hide menu, kill music, play cutscene.
  // When cutscene ends, beginGameplay() runs.
  STATE = 'cutscene';
  // ── iOS audio + video unlock: this click is a user gesture, so we touch
  //    each Audio and Video element here to register them as user-gesture-
  //    approved. iOS requires play() to be called inside the gesture handler
  //    — even if we pause immediately. Once unlocked, subsequent play()
  //    calls work, including for the final cutscene video shown later.
  try {
    [menuMusic, gameplayMusic, pickupSfx].forEach(function(audio){
      if(audio){
        audio.muted = true;
        var p = audio.play();
        if(p && p.then){
          p.then(function(){
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          }).catch(function(){
            audio.muted = false;
          });
        } else {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        }
      }
    });
    // Also unlock the final cutscene video — same gesture
    var finalVid = document.getElementById('final-cutscene-video');
    if(finalVid){
      finalVid.muted = true;
      var fp = finalVid.play();
      if(fp && fp.then){
        fp.then(function(){
          finalVid.pause();
          finalVid.currentTime = 0;
          finalVid.muted = false;
        }).catch(function(){
          finalVid.muted = false;
        });
      }
    }
  } catch(err) { /* ignore unlock errors — fall through to cutscene */ }
  document.getElementById('menu-screen').classList.add('hidden');
  // Hard-stop menu music (not fade — cutscene has its own audio)
  if(menuMusic){ menuMusic.pause(); menuMusic.currentTime = 0; }
  if(musicFadeT){ clearInterval(musicFadeT); musicFadeT = null; }
  // Show and play the cutscene
  var screen = document.getElementById('cutscene-screen');
  var video  = document.getElementById('cutscene-video');
  screen.classList.add('show');
  video.currentTime = 0;
  // Wire up the end handler once
  if(!video._wired){
    video.addEventListener('ended', beginGameplay);
    // Safety net: if the video errors or stalls, start gameplay after 9s
    setTimeout(function(){ if(STATE==='cutscene') beginGameplay(); }, 9000);
    video._wired = true;
  }
  var p = video.play();
  if(p && p.catch){ p.catch(function(){ /* shouldn't happen — Start click counts as user gesture */ beginGameplay(); }); }
}

function beginGameplay(){
  if(STATE === 'playing') return;  // guard against double-fire
  STATE = 'playing';
  document.getElementById('cutscene-screen').classList.remove('show');
  document.getElementById('inv-hud').classList.add('show');
  // Reset world state
  placePlayer();
  resetInventory();
  VICTORY = false;
  spawnItems();
  spawnZombies();
  startGameplayMusic();
  showItemCounter();
  // Opening sequence: short intro, then objective types out
  showObjectiveBanner('This is your property!', { delay:1500, hold:1950 });
  showObjectiveBanner('Collect all 5 power items before the tenants catch you...', { delay:4000, hold:5500, typed:true });
}

function triggerVictory(){
  if(VICTORY) return;
  VICTORY = true;
  STATE = 'won';
  // Hide in-game HUD layers
  document.getElementById('inv-hud').classList.remove('show');
  document.getElementById('obj-banner').classList.remove('show');
  hideItemCounter();
  stopGameplayMusic();
  // Play the final cutscene
  playFinalCutscene();
}

function playFinalCutscene(){
  var cs        = document.getElementById('cutscene-screen');
  var openVid   = document.getElementById('cutscene-video');
  var video     = document.getElementById('final-cutscene-video');
  if(!cs || !video){
    // Fallback to victory screen if cutscene elements missing
    var el = document.getElementById('victory-screen');
    if(el) el.classList.add('show');
    return;
  }
  // Hide opening video, show final video
  if(openVid){ openVid.style.display = 'none'; }
  video.style.display = 'block';
  cs.classList.add('show');
  video.currentTime = 0;
  video.muted = IS_MUTED;
  // Track whether we've already advanced past the cutscene to prevent double-fire
  var advanced = false;
  function advance(){
    if(advanced) return;
    advanced = true;
    cs.classList.remove('show');
    if(video) video.style.display = 'none';
    showQuoteCTA();
  }
  video.onended = advance;
  // Safety fallback: if the video doesn't start playing within 3 seconds
  // (mobile autoplay block, network failure, etc), advance anyway
  var playPromise = video.play();
  if(playPromise && playPromise.catch){
    playPromise.catch(function(){
      // Play was blocked — advance after a short visual beat
      setTimeout(advance, 1500);
    });
  }
  // Hard timeout: even if play() succeeded, force advance after 30s
  // (covers cases where 'ended' never fires due to encoding issues)
  setTimeout(function(){ if(!advanced) advance(); }, 30000);
}

function showQuoteCTA(){
  var cta = document.getElementById('quote-cta-screen');
  if(cta){
    cta.classList.add('show');
    document.body.classList.add('cta-active');
  } else {
    // Fallback to old victory screen if CTA not present
    var el = document.getElementById('victory-screen');
    if(el) el.classList.add('show');
  }
}

// ── ITEMS: pickup, draw with bobbing float + shadow ──────────────
function updateItems(){
  for(var i=0; i<ITEMS.length; i++){
    var it = ITEMS[i];
    if(it.taken) continue;
    it.bobT += 0.06;
    // Pickup if player walks over
    var dx = P.x-it.x, dy = P.y-it.y;
    if(Math.sqrt(dx*dx+dy*dy) < 60){
      it.taken = true;
      INV[it.id] = true;
      PICKUP_ORDER.push(it.id);
      playPickupSfx();
      // Start celebration animation — restarts cleanly if already celebrating
      P.celebrating = true;
      P.celebrateStart = performance.now();
      spawnCelebrationSparkles(P.x, P.y);
      updateInventoryHUD();
      updateItemCounter();
      // Pickup message — small pill just above the inventory bar
      showPickupMsg(ITEM_PICKUP_MSG[it.id]);
      // ── Package trigger: Grumpy snaps into chase mode when the package
      //    is collected. Package is the most likely first grab, so this
      //    guarantees the chase starts even if he hasn't detected Sarah yet.
      if(it.id === 'package'){
        for(var zi=0; zi<ZOMBIES.length; zi++){
          if(ZOMBIES[zi].char === 'grumpy'){
            ZOMBIES[zi].state = 'chase';
            ZOMBIES[zi]._detourUntil = 0;
            ZOMBIES[zi]._stuckTrackStart = undefined;
            break;
          }
        }
      }
      // ── Coffee trigger: Complainer locks into permanent chase. Once she
      //    starts chasing, the hysteresis check that returns her to idle is
      //    disabled — she keeps coming no matter how far Sarah runs.
      if(it.id === 'coffee'){
        for(var zi=0; zi<ZOMBIES.length; zi++){
          if(ZOMBIES[zi].char === 'complainer'){
            ZOMBIES[zi].state = 'chase';
            ZOMBIES[zi].relentless = true;
            ZOMBIES[zi]._detourUntil = 0;
            ZOMBIES[zi]._stuckTrackStart = undefined;
            break;
          }
        }
      }
      // ── 4-item trigger: when sarah has collected 4 of 5 items, all
      //    tenants commit to chase regardless of state or distance.
      //    Forces the endgame pressure as she runs for the roof.
      if(PICKUP_ORDER.length === 4){
        for(var zi=0; zi<ZOMBIES.length; zi++){
          ZOMBIES[zi].state = 'chase';
          ZOMBIES[zi].relentless = true;
          ZOMBIES[zi]._detourUntil = 0;
          ZOMBIES[zi]._stuckTrackStart = undefined;
        }
      }
      // Check if all 5 collected -> victory
      if(INV.key && INV.phone && INV.coffee && INV.cash && INV.package){
        setTimeout(triggerVictory, 250);
      }
    }
  }
}

function drawItems(){
  for(var i=0; i<ITEMS.length; i++){
    var it = ITEMS[i];
    if(it.taken) continue;
    var bob = Math.sin(it.bobT) * 12;            // world-px bob amount
    var screenX = w2sX(it.x), screenY = w2sY(it.y);
    // Shadow: expands as item rises (counter-intuitive — shadow grows when high
    // makes it look weird; the convention is shadow SHRINKS when item is high).
    // We'll shrink shadow as bob goes UP (negative).
    var shadowScale = 1 + (bob/22);  // when bob=-12 shadow=0.45, when bob=+12 shadow=1.55
    if(shadowScale<0.4) shadowScale=0.4;
    var shW = 40*ZOOM*shadowScale, shH = shW*0.32;
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, shW/2, shH/2, 0, 0, Math.PI*2);
    ctx.fill();
    // Item floats above the shadow
    var drawY = screenY + bob*ZOOM;
    var size = 62 * ZOOM;

    // ── Mario-esque pulsing glow behind the item ──
    // Two-layer halo: outer soft glow + inner hot center. Both pulse with
    // the bob — brightest at peak, dimmer at trough. Always-on so items
    // are easy to spot even at glow's lowest point.
    var glowPhase = (Math.sin(it.bobT) + 1) / 2;  // 0..1 cycle synced to bob
    var glowColor = ITEM_COLORS[it.id] || '#F5A623';
    var glowCenterX = screenX;
    var glowCenterY = drawY - size/2;

    // OUTER halo — bigger, softer, breathes wide
    var outerAlpha = 0.50 + glowPhase * 0.45;       // 0.50 → 0.95
    var outerRadius = size * (1.0 + glowPhase * 0.35);
    var outerGrad = ctx.createRadialGradient(glowCenterX, glowCenterY, 0, glowCenterX, glowCenterY, outerRadius);
    outerGrad.addColorStop(0,    hexToRgba(glowColor, outerAlpha * 0.7));
    outerGrad.addColorStop(0.45, hexToRgba(glowColor, outerAlpha * 0.35));
    outerGrad.addColorStop(1,    hexToRgba(glowColor, 0));
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(glowCenterX, glowCenterY, outerRadius, 0, Math.PI*2);
    ctx.fill();

    // INNER hot center — smaller, brighter, gives a "lit-up" core
    var innerAlpha = 0.6 + glowPhase * 0.4;          // 0.6 → 1.0
    var innerRadius = size * 0.55;
    var innerGrad = ctx.createRadialGradient(glowCenterX, glowCenterY, 0, glowCenterX, glowCenterY, innerRadius);
    innerGrad.addColorStop(0,    hexToRgba(glowColor, innerAlpha));
    innerGrad.addColorStop(0.6,  hexToRgba(glowColor, innerAlpha * 0.4));
    innerGrad.addColorStop(1,    hexToRgba(glowColor, 0));
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(glowCenterX, glowCenterY, innerRadius, 0, Math.PI*2);
    ctx.fill();

    if(itemsSheet.complete && itemsSheet.naturalWidth){
      // Slice the cell for this item from the 3×3 sheet. Cells are even
      // divisions of the image. The new icons fill their cells well, so we
      // use the full cell dimensions (no inner crop band needed).
      var cellW = itemsSheet.naturalWidth / ITEMS_SHEET_COLS;
      var cellH = itemsSheet.naturalHeight / ITEMS_SHEET_ROWS;
      var cell = ITEM_CELL[it.id];
      // Draw as a square, preserving aspect
      ctx.drawImage(itemsSheet, cell.c*cellW, cell.r*cellH, cellW, cellH,
                    screenX-size/2, drawY-size, size, size);
    } else {
      // Placeholder: colored circle with emoji while the sheet loads
      ctx.fillStyle = ITEM_COLORS[it.id];
      ctx.beginPath();
      ctx.arc(screenX, drawY-size/2, size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.stroke();
      ctx.font = (size*0.55)+'px serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#fff';
      ctx.fillText(ITEM_EMOJI[it.id], screenX, drawY-size/2);
    }
  }
}

// Helper: convert "#RRGGBB" to "rgba(r,g,b,a)" string for canvas gradient stops.
function hexToRgba(hex, alpha){
  var h = hex.replace('#','');
  var r = parseInt(h.substring(0,2), 16);
  var g = parseInt(h.substring(2,4), 16);
  var b = parseInt(h.substring(4,6), 16);
  return 'rgba('+r+','+g+','+b+','+alpha+')';
}

// ── ZOMBIES: idle until Sarah is within detection radius, then chase ──
function updateZombies(){
  for(var i=0; i<ZOMBIES.length; i++){
    var z = ZOMBIES[i];
    var dx = P.x - z.x, dy = P.y - z.y;
    var dist = Math.sqrt(dx*dx + dy*dy);

    // ── State transitions (360° detection — no vision cone) ──
    if(z.state === 'chase'){
      // Lose interest if Sarah escapes far beyond detection (hysteresis).
      // Relentless tenants ignore this — they keep coming once triggered.
      if(!z.relentless && dist > ZOMBIE_DETECT * 1.5){
        z.state = 'idle';
        // Clear stuck-detection / detour state for next chase
        z._detourUntil = 0;
        z._stuckTrackStart = undefined;
      }
    } else if(z.state === 'alert'){
      // Holding alert pose, facing Sarah. Three exit conditions:
      //  (1) Sarah escaped detection radius → return to idle immediately
      //  (2) Sarah came within chase trigger distance → start chasing
      //  (3) Stayed in alert too long without (2) → give up, return to idle
      if(dist > ZOMBIE_DETECT * 1.5){
        z.state = 'idle';
      } else if(dist <= ZOMBIE_CHASE_TRIGGER && performance.now() - z.alertStart >= ZOMBIE_ALERT_MS){
        z.state = 'chase';
      } else if(performance.now() - z.alertStart >= ZOMBIE_GIVEUP_MS){
        z.state = 'idle';
        z.facing = 'down';   // turn back to default facing
      }
    } else {
      // Idle: detect Sarah anywhere within radius → enter alert (turn + pause)
      if(dist <= ZOMBIE_DETECT){
        z.state = 'alert';
        z.alertStart = performance.now();
        z.facing = dirToFacing(Math.atan2(dy, dx));
      }
    }

    // ── Movement + animation ──
    if(z.state === 'chase'){
      var charDef = ZOMBIE_CHARACTERS[z.char];
      var chaseMul = (charDef && charDef.chaseSpeed !== undefined) ? charDef.chaseSpeed : ZOMBIE_CHASE_SPD;
      var spd = P.spd * chaseMul;
      var now = performance.now();

      // ── Stuck detection ──
      // Track position over short windows; if we've barely moved while
      // chasing, we're wedged against a wall. Pick a perpendicular detour
      // direction and commit to it for ~1.5s before resuming direct chase.
      if(z._stuckTrackStart === undefined){
        z._stuckTrackStart = now;
        z._stuckTrackX = z.x;
        z._stuckTrackY = z.y;
      }
      if(z._detourUntil && now < z._detourUntil){
        // Stay on detour — overrides direct chase axis
      } else if(now - z._stuckTrackStart > 600){
        var moved = Math.hypot(z.x - z._stuckTrackX, z.y - z._stuckTrackY);
        if(moved < 4){
          // Wedged. Pick a perpendicular axis to slide along. Choose the
          // perpendicular direction whose component toward Sarah is larger,
          // so the detour at least tracks generally toward her.
          var pxA = -dy, pyA = dx;       // 90° rotation of (dx,dy)
          var pxB =  dy, pyB = -dx;
          var aLen = Math.hypot(pxA, pyA) || 1;
          var bLen = Math.hypot(pxB, pyB) || 1;
          // Prefer the perpendicular that points more toward Sarah.
          // Tie-break: alternate sides per stuck event so we don't loop.
          var dot = (z._lastDetourSide === 'A') ? -1 : 1; // flip last time
          var sideAScore = dot * ((pxA*dx + pyA*dy));
          var sideBScore = -dot * ((pxB*dx + pyB*dy));
          if(sideAScore >= sideBScore){
            z._detourDx = pxA / aLen;
            z._detourDy = pyA / aLen;
            z._lastDetourSide = 'A';
          } else {
            z._detourDx = pxB / bLen;
            z._detourDy = pyB / bLen;
            z._lastDetourSide = 'B';
          }
          z._detourUntil = now + 1500;
        }
        // Reset tracking window
        z._stuckTrackStart = now;
        z._stuckTrackX = z.x;
        z._stuckTrackY = z.y;
      }

      var moveX = 0, moveY = 0;
      if(z._detourUntil && now < z._detourUntil){
        // Moving along the detour direction (e.g. wall-following)
        moveX = z._detourDx * spd;
        moveY = z._detourDy * spd;
      } else if(dist > 0){
        // Normal direct chase toward Sarah
        moveX = (dx/dist) * spd;
        moveY = (dy/dist) * spd;
      }
      // Update facing — use the actual movement direction, not toward Sarah,
      // so the sprite reads correctly while detouring along a wall.
      var moveLen = Math.hypot(moveX, moveY);
      if(moveLen > 0.01){
        z.facing = dirToFacing(Math.atan2(moveY, moveX));
      }
      // Animate walk cycle while chasing — alternating mouth open/closed
      z.frT++;
      if(z.frT > ZOMBIE_FRAME_TICK){
        z.fr = (z.fr + 1) % ZOMBIE_WALK_LEN;
        z.frT = 0;
      }
      // Apply movement with collision
      var ZFB_W = 50, ZFB_H = 30;
      var tryX = z.x + moveX;
      var fbX = {x:tryX-ZFB_W/2, y:z.y-ZFB_H/2, w:ZFB_W, h:ZFB_H};
      var blocked = false;
      for(var c=0; c<COLLISIONS.length; c++){
        if(rectOverlap(fbX, COLLISIONS[c])){ blocked = true; break; }
      }
      if(!blocked && tryX >= 50 && tryX <= WORLD.w-50) z.x = tryX;
      var tryY = z.y + moveY;
      var fbY = {x:z.x-ZFB_W/2, y:tryY-ZFB_H/2, w:ZFB_W, h:ZFB_H};
      blocked = false;
      for(var c=0; c<COLLISIONS.length; c++){
        if(rectOverlap(fbY, COLLISIONS[c])){ blocked = true; break; }
      }
      if(!blocked && tryY >= 50 && tryY <= WORLD.h-50) z.y = tryY;
    } else if(z.state === 'alert'){
      // Frozen in alert pose — face Sarah, mouth closed (frame 0), no movement
      z.facing = dirToFacing(Math.atan2(dy, dx));
      z.fr = 0;
      z.frT = 0;
    } else {
      // Idle: stand still, neutral frame
      z.fr = 0;
      z.frT = 0;
    }

    // ── TOUCH DETECTION: game over if zombie touches player ──
    if(STATE === 'playing' && dist < ZOMBIE_TOUCH_RADIUS){
      triggerGameOver(z);
      return;
    }
  }
}

function drawZombies(){
  for(var i=0; i<ZOMBIES.length; i++){
    var z = ZOMBIES[i];
    var x = w2sX(z.x), y = w2sY(z.y);
    // Zombie sprite size in world units (scaled to match Sarah)
    var spriteH = 152, spriteW = spriteH*0.78;
    var sw = spriteW*ZOOM, sh = spriteH*ZOOM;

    // shadow on the ground (anchored at z.y, the zombie's feet)
    var shW = sw*0.55, shH = shW*0.35;
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, shW/2, shH/2, 0, 0, Math.PI*2); ctx.fill();

    // sprite — 4×4 sheet, row = facing direction, col = walk frame (or 0 if idle)
    var img = zombieImgs[z.char];
    var charDef = ZOMBIE_CHARACTERS[z.char];
    var dx = x - sw/2, dy = y - sh;
    if(img && img.complete && img.naturalWidth){
      var cellW = img.naturalWidth / ZOMBIE_SHEET_COLS;
      var cellH = img.naturalHeight / ZOMBIE_SHEET_ROWS;
      var srcRow, srcCol;
      var useMirror = false;
      // PRIORITY 1: frameMap — explicit list of (row, col) cells for this facing.
      // Used for sheets where direction frames are scattered, not row-aligned.
      if(charDef && charDef.frameMap && charDef.frameMap[z.facing]){
        var frames = charDef.frameMap[z.facing];
        var idx = (z.state === 'chase') ? (z.fr % frames.length) : 0;
        srcRow = frames[idx][0];
        srcCol = frames[idx][1];
      } else {
        // PRIORITY 2: default — row from facing, col from walk frame.
        // mirrorDir: if set to 'left' or 'right', that side's row is replaced
        // by mirroring the opposite row.
        var mirrorDir = charDef && charDef.mirrorDir;
        useMirror = (mirrorDir === z.facing);
        var rowKey = z.facing;
        if(useMirror){
          rowKey = (z.facing === 'left') ? 'right' : 'left';
        }
        var rowMap = (charDef && charDef.rows) || ZOMBIE_ROW;
        srcRow = (rowMap[rowKey] !== undefined) ? rowMap[rowKey] : rowMap.down;
        srcCol = (z.state === 'chase') ? (z.fr % ZOMBIE_WALK_LEN) : 0;
      }
      if(useMirror){
        ctx.save();
        ctx.translate(dx + sw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, srcCol*cellW, srcRow*cellH, cellW, cellH, 0, 0, sw, sh);
        ctx.restore();
      } else {
        ctx.drawImage(img, srcCol*cellW, srcRow*cellH, cellW, cellH, dx, dy, sw, sh);
      }
    } else {
      // Fallback dot while sprite loads
      var color = z.state==='chase' ? '#CC2200' : '#29ABE2';
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y - sh*0.35, sh*0.18, 0, Math.PI*2); ctx.fill();
    }

    // chase indicator (small ! above their head) — shown during alert + chase
    if(z.state === 'chase' || z.state === 'alert'){
      ctx.fillStyle='#CC2200';
      ctx.strokeStyle='#fff'; ctx.lineWidth=3;
      ctx.font='bold '+Math.round(24*ZOOM)+'px Bebas Neue, sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.strokeText('!', x, dy - 8);
      ctx.fillText('!', x, dy - 8);
    }
  }
}

// ── GAME OVER ────────────────────────────────────────────────────
function triggerGameOver(byZombie){
  if(STATE!=='playing') return;
  STATE = 'lost';
  document.getElementById('inv-hud').classList.remove('show');
  document.getElementById('obj-banner').classList.remove('show');
  hideItemCounter();
  // Count items collected for the resign screen
  var collected = (INV.key?1:0) + (INV.phone?1:0) + (INV.coffee?1:0) + (INV.cash?1:0) + (INV.package?1:0);
  document.getElementById('resign-items').textContent = collected;
  var byName = ZOMBIE_CHARACTERS[byZombie.char].name;
  document.getElementById('resign-by').textContent = byName;
  document.getElementById('resign-screen').classList.add('show');
  stopGameplayMusic();
}
function returnToMenu(){
  STATE = 'menu';
  document.getElementById('resign-screen').classList.remove('show');
  var v = document.getElementById('victory-screen');
  if(v) v.classList.remove('show');
  var cta = document.getElementById('quote-cta-screen');
  if(cta) cta.classList.remove('show');
  document.body.classList.remove('cta-active');
  document.getElementById('menu-screen').classList.remove('hidden');
  // Hard-stop gameplay music immediately (no fade) so it doesn't bleed
  // into the menu when player taps "Play Again" on mobile
  if(gameplayFadeT){ clearInterval(gameplayFadeT); gameplayFadeT = null; }
  gameplayMusic.pause();
  gameplayMusic.currentTime = 0;
  gameplayMusic.volume = MUSIC_VOL;
  // Resume menu music. If the user previously unmuted (we infer from the
  // mute button state), keep menu unmuted for this returning session.
  var muteBtn = document.getElementById('mute-btn');
  if(muteBtn && muteBtn.classList.contains('unmuted')){
    IS_MUTED = false;
  }
  fadeInMenuMusic();
}

var loop=function(){
  requestAnimationFrame(loop);
  P.spd = parseFloat(document.getElementById('speed').value);
  ZOOM = parseFloat(document.getElementById('zoom').value);
  // On mobile (narrow viewport), zoom out an extra 0.1 so more of the
  // map is visible at once. Desktop is untouched.
  if(window.innerWidth <= 768){ ZOOM = Math.max(0.3, ZOOM - 0.2); }

  // movement (normalized; keyboard or joystick) — only when playing AND not celebrating
  var ix=0, iy=0;
  if(STATE==='playing' && !EDIT && !P.celebrating){
    if(JOY.active){ ix=JOY.vx; iy=JOY.vy; }
    else {
      if(K.up)iy-=1; if(K.down)iy+=1; if(K.left)ix-=1; if(K.right)ix+=1;
    }
  }
  // Update 4-way facing: prefer horizontal direction whenever it's pressed
  // alongside a vertical (e.g. up+left = face left, up+right = face right).
  // Side-walking is the most visually polished animation so we bias toward it.
  if(Math.abs(ix) >= Math.abs(iy)){
    if(ix > 0.05) P.facing = 'right';
    else if(ix < -0.05) P.facing = 'left';
  } else {
    if(iy > 0.05) P.facing = 'down';
    else if(iy < -0.05) P.facing = 'up';
  }

  var mag=Math.sqrt(ix*ix+iy*iy);
  if(mag>0.12){
    var vx=(ix/mag)*P.spd, vy=(iy/mag)*P.spd;
    var tryX = Math.max(0,Math.min(WORLD.w, P.x+vx));
    if(canStand(tryX, P.y)) P.x = tryX;
    var tryY = Math.max(0,Math.min(WORLD.h, P.y+vy));
    if(canStand(P.x, tryY)) P.y = tryY;
    P.moving=true;
    P.frT++; if(P.frT>FRAME_TICK){ P.fr=(P.fr+1)%WALK_LEN; P.frT=0; }
  } else { P.moving=false; P.fr=0; }

  // Update game systems
  if(STATE==='playing' && !EDIT){
    updateItems();
    updateZombies();
  }

  updateCamera();
  drawWorld();
  drawCollisions();
  if(STATE==='playing' || STATE==='lost'){
    drawItems();
    drawZombies();
  }
  drawPlayer();
  updateAndDrawSparkles();

  document.getElementById('cx').textContent=Math.round(P.x);
  document.getElementById('cy').textContent=Math.round(P.y);
  document.getElementById('hud-pos').textContent=Math.round(P.x)+','+Math.round(P.y);
};

// ── INPUT ───────────────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
  if(e.key==='ArrowUp'||e.key==='w'||e.key==='W')K.up=true;
  if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')K.down=true;
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')K.left=true;
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')K.right=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
});
document.addEventListener('keyup',function(e){
  if(e.key==='ArrowUp'||e.key==='w'||e.key==='W')K.up=false;
  if(e.key==='ArrowDown'||e.key==='s'||e.key==='S')K.down=false;
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')K.left=false;
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')K.right=false;
});

var joyBase, joyStick, JOY_R=55;
function relPos(t){ var r=canvas.getBoundingClientRect(); return {x:t.clientX-r.left, y:t.clientY-r.top}; }
function joyStart(e){ if(EDIT) return; if(JOY.active)return; var t=e.changedTouches[0]; JOY.id=t.identifier; JOY.active=true;
  var p=relPos(t); JOY.bx=p.x; JOY.by=p.y; JOY.vx=0; JOY.vy=0;
  var cr=canvas.getBoundingClientRect(), hr=document.getElementById('s-game').getBoundingClientRect();
  joyBase.style.left=(cr.left-hr.left+p.x)+'px'; joyBase.style.top=(cr.top-hr.top+p.y)+'px';
  joyStick.style.left='50%'; joyStick.style.top='50%'; joyBase.classList.add('show'); e.preventDefault();
}
function joyMove(e){ if(!JOY.active)return;
  for(var i=0;i<e.changedTouches.length;i++){ var t=e.changedTouches[i]; if(t.identifier!==JOY.id)continue;
    var p=relPos(t), dx=p.x-JOY.bx, dy=p.y-JOY.by, dist=Math.sqrt(dx*dx+dy*dy), cl=Math.min(dist,JOY_R), ang=Math.atan2(dy,dx);
    var sx=Math.cos(ang)*cl, sy=Math.sin(ang)*cl;
    joyStick.style.left=(50+sx/120*100)+'%'; joyStick.style.top=(50+sy/120*100)+'%';
    JOY.vx=sx/JOY_R; JOY.vy=sy/JOY_R; e.preventDefault();
  }
}
function joyEnd(e){ for(var i=0;i<e.changedTouches.length;i++){ if(e.changedTouches[i].identifier===JOY.id){ JOY.active=false; JOY.vx=0; JOY.vy=0; JOY.id=null; joyBase.classList.remove('show'); } } }

var rzT=null;
window.addEventListener('resize',function(){ clearTimeout(rzT); rzT=setTimeout(sizeCanvas,150); });

window.addEventListener('load',function(){
  canvas=document.getElementById('game-canvas');
  joyBase=document.getElementById('joy-base'); joyStick=document.getElementById('joy-stick');
  sizeCanvas();
  canvas.addEventListener('touchstart',joyStart,{passive:false});
  canvas.addEventListener('touchmove',joyMove,{passive:false});
  canvas.addEventListener('touchend',joyEnd);
  canvas.addEventListener('touchcancel',joyEnd);
  // editor: mouse (desktop) + touch (mobile). They bail if !EDIT.
  canvas.addEventListener('mousedown', editStart);
  window.addEventListener('mousemove', editMove);
  window.addEventListener('mouseup',   editEnd);
  canvas.addEventListener('touchstart', editStart, {passive:false});
  canvas.addEventListener('touchmove',  editMove,  {passive:false});
  canvas.addEventListener('touchend',   editEnd);
  loadCollisions();
  loadFoot();
  loadMap();
  placePlayer();
  // Mute is always ON at boot — user must tap to unmute on every visit.
  tryPlayMenuMusic();
  requestAnimationFrame(loop);
});
