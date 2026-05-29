// ── MAP IMAGE ──────────────────────────────────────────────────────
// Paste your Webflow map URL here. The game loads it as the world.
// Until a real map is set, a placeholder grid world is used so you can
// still see the camera-follow + walking working.
var MAP_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a18fb36eaf2c95302ebeb26_Map%20V3.png';

// ── SPRITE SHEET (Sarah v4, 4x4 grid of 512px cells) ──
// Layout:  row 0 = facing DOWN (4 frames)
//          row 1 = facing LEFT (4-frame walk)
//          row 2 = facing RIGHT (4-frame walk)
//          row 3 = facing UP (4 frames)
var SHEET_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a1919e451d287b8843ba526_sarah_v4_sprite_transparent.png';
var CELL = 512;
// Which row of the sprite sheet to use for each facing direction.
var FACING_ROW = { down:0, left:1, right:2, up:3 };
// Number of frames per walk cycle (4 in our new sheet).
var WALK_LEN   = 4;
// How many game-loop ticks each frame is held (lower = faster animation).
var FRAME_TICK = 7;
var PROFILE_ASPECT = 0.78;

var sheet = new Image(); sheet.src = SHEET_URL;
var mapImg = new Image(); var mapReady=false, mapFailed=false;

// World dimensions (set once the map loads; placeholder until then)
var WORLD = { w: 2048, h: 2048 };

// ── COLLISION BOXES (world-pixel coords for the 2048x2048 V3 map) ──
// Tuned by AJ in the edit layer.
var COLLISION_DEFAULTS = [
  {x:0,y:0,w:280,h:140},
  {x:1770,y:0,w:280,h:140},
  {x:0,y:1900,w:300,h:148},
  {x:1750,y:1900,w:300,h:148},
  {x:0,y:0,w:2048,h:80},
  {x:0,y:0,w:80,h:2048},
  {x:1970,y:0,w:80,h:2048},
  {x:0,y:1980,w:880,h:70},
  {x:1180,y:1980,w:870,h:70},
  {x:505,y:223,w:58,h:133},
  {x:700,y:1221,w:54,h:39},
  {x:607,y:237,w:80,h:157},
  {x:224,y:402,w:138,h:66},
  {x:220,y:513,w:135,h:53},
  {x:200,y:1050,w:153,h:57},
  {x:190,y:1170,w:170,h:60},
  {x:597,y:943,w:123,h:60},
  {x:390,y:240,w:62,h:103},
  {x:1218,y:113,w:51,h:450},
  {x:1374,y:786,w:102,h:65},
  {x:780,y:140,w:280,h:100},
  {x:830,y:329,w:71,h:150},
  {x:763,y:250,w:65,h:107},
  {x:1379,y:129,w:31,h:421},
  {x:1501,y:555,w:469,h:20},
  {x:1880,y:1220,w:117,h:147},
  {x:1847,y:250,w:37,h:317},
  {x:1544,y:692,w:342,h:28},
  {x:1440,y:1290,w:530,h:35},
  {x:1078,y:726,w:214,h:34},
  {x:816,y:783,w:95,h:100},
  {x:1096,y:1074,w:20,h:120},
  {x:1106,y:828,w:395,h:92},
  {x:1121,y:1133,w:107,h:86},
  {x:791,y:909,w:50,h:201},
  {x:263,y:1823,w:235,h:37},
  {x:80,y:1380,w:480,h:35},
  {x:220,y:1303,w:380,h:80},
  {x:590,y:1527,w:32,h:250},
  {x:960,y:1380,w:35,h:430},
  {x:580,y:1800,w:415,h:35},
  {x:721,y:1386,w:20,h:143},
  {x:880,y:1820,w:35,h:180},
  {x:1145,y:1820,w:35,h:180},
  {x:1340,y:1340,w:35,h:640},
  {x:1880,y:678,w:147,h:127},
  {x:597,y:550,w:137,h:130},
  {x:1700,y:1380,w:240,h:300},
  {x:1400,y:1750,w:540,h:200},
  {x:879,y:729,w:71,h:101},
  {x:811,y:796,w:128,h:64},
  {x:964,y:991,w:54,h:58},
  {x:1096,y:831,w:20,h:180},
  {x:1142,y:987,w:96,h:59},
  {x:1322,y:1133,w:108,h:90},
  {x:932,y:1235,w:70,h:119},
  {x:922,y:1248,w:61,h:50},
  {x:832,y:1333,w:134,h:28},
  {x:876,y:1292,w:71,h:29},
  {x:758,y:1158,w:55,h:44},
  {x:717,y:1193,w:44,h:36},
  {x:671,y:1242,w:24,h:35},
  {x:656,y:1293,w:35,h:26},
  {x:863,y:1269,w:20,h:48},
  {x:632,y:1305,w:34,h:35},
  {x:596,y:1328,w:43,h:33},
  {x:807,y:1367,w:151,h:33},
  {x:701,y:1405,w:29,h:34},
  {x:672,y:1432,w:31,h:26},
  {x:653,y:1458,w:35,h:24},
  {x:997,y:1265,w:35,h:25},
  {x:999,y:1314,w:221,h:20},
  {x:1024,y:1289,w:34,h:20},
  {x:1511,y:577,w:262,h:104},
  {x:1467,y:619,w:48,h:42},
  {x:1147,y:629,w:170,h:86},
  {x:1399,y:765,w:50,h:56},
  {x:1274,y:235,w:110,h:107},
  {x:1435,y:828,w:20,h:433},
  {x:1340,y:986,w:98,h:55},
  {x:1173,y:1051,w:31,h:31},
  {x:1369,y:1064,w:29,h:20},
  {x:1489,y:602,w:37,h:31},
  {x:1316,y:660,w:39,h:30},
  {x:950,y:287,w:141,h:104},
  {x:926,y:477,w:33,h:70},
  {x:1083,y:469,w:43,h:76},
  {x:284,y:143,w:493,h:67},
  {x:224,y:714,w:120,h:58},
  {x:212,y:824,w:139,h:63},
  {x:171,y:240,w:43,h:530},
  {x:196,y:169,w:93,h:125},
  {x:664,y:667,w:191,h:116},
  {x:699,y:607,w:91,h:59},
  {x:606,y:660,w:66,h:61},
  {x:716,y:784,w:104,h:64},
  {x:692,y:579,w:65,h:56},
  {x:687,y:753,w:83,h:54},
  {x:630,y:708,w:56,h:46},
  {x:768,y:1114,w:58,h:36},
  {x:73,y:1173,w:140,h:209},
  {x:72,y:734,w:99,h:141},
];

// Per-session edits (overrides). Persists to localStorage on the live site.
var LS_KEY = 'pw_collisions_v2';
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
var SHOW_COLL = true;
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
var ZOOM = 2.2;                 // how zoomed-in the camera is
var cam = { x:0, y:0 };         // camera top-left in WORLD coords

var P = { x:1024, y:1024, w:72, h:120, facing:'down', moving:false, fr:0, frT:0, spd:5, bob:0, bobT:0 };
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
  // V2 map: spawn in central lobby hallway hub (around the round desk)
  P.x=WORLD.w*0.45; P.y=WORLD.h*0.48;
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
  if(mapReady){
    // draw the visible slice of the map, scaled by zoom
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(mapImg, cam.x, cam.y, VW/ZOOM, VH/ZOOM, 0, 0, VW, VH);
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

  // ── shadow circle on the ground ──
  var shW = sw*0.55, shH = shW*0.35;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(footX, footY, shW/2, shH/2, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  var dx = footX - sw/2, dy = footY - sh;

  if(sheet.complete && sheet.naturalWidth){
    // Pick row based on facing direction; pick column based on walk frame.
    // When standing still, lock to frame 0 (the "neutral standing" pose).
    var row = FACING_ROW[P.facing] !== undefined ? FACING_ROW[P.facing] : FACING_ROW.down;
    var col = P.moving ? (P.fr % WALK_LEN) : 0;
    ctx.drawImage(sheet, col*CELL, row*CELL, CELL, CELL, dx, dy, sw, sh);
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
var IS_MUTED = true;            // start muted, user taps to enable
var musicFadeT = null;

function tryPlayMenuMusic(){
  if(IS_MUTED) return;
  var p = menuMusic.play();
  if(p && p.catch){ p.catch(function(){ /* autoplay blocked — handled by toggleMute */ }); }
}

function toggleMute(e){
  if(e){ e.stopPropagation(); }
  IS_MUTED = !IS_MUTED;
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

// ──────────────────────────────────────────────────────────────────
// GAME STATE MACHINE
// ──────────────────────────────────────────────────────────────────
var STATE = 'menu';   // 'menu' | 'playing' (more states later: 'won','lost')

// Power-item sprite sheet — single image with 5 items in a row.
// We use 3 of them by their column index: present(2), phone(3), key(4).
var ITEMS_SHEET_URL = 'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17aa21c4c836a09c426dbb_Task_icons.png';
var ITEMS_SHEET_COLS = 5;
var ITEM_CELL = {       // which column of the sheet each item uses
  key:     4,
  phone:   3,
  present: 2,
};
var ITEM_COLORS = { key:'#F5A623', phone:'#CC2200', present:'#D2691E' };
var ITEM_EMOJI  = { key:'🔑', phone:'📞', present:'🎁' };
var itemsSheet = new Image(); itemsSheet.src = ITEMS_SHEET_URL;

// Item world objects: each {id, x, y, taken:false, bobT}
var ITEMS = [];
// Inventory: which item ids have been picked up
var INV = { key:false, phone:false, present:false };

// Power Mode
var POWER_MODE = false;
var POWER_MS = 15000;          // 15-second window
var powerEnds = 0;             // performance.now() ms when power expires

// Zombies
// Each zombie character has a 2x2 sprite sheet: down/up/right/left.
// (Same layout as Sarah v1 / Grumpy / Karen.)
// ── DEV TOGGLE: flip to true to enable zombies, false to remove them
//    (useful when tuning collision so they don't chase you)
var ZOMBIES_ENABLED = false;

var ZOMBIE_CHARACTERS = {
  grumpy:     { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17a7444c5deaf6ef798a00_Grumpy_man.png',      name:'Grumpy' },
  karen:      { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17a74497f7299d29d06199_Karen_sprites.png',    name:'Karen' },
  complainer: { url:'https://cdn.prod.website-files.com/69e1dd322050cba61d94bb9a/6a17a77971435c1aee6471ee_Complainer_sprites.png',name:'Complainer' },
};
// Cell map for 2x2 (col,row) — same convention as Grumpy: r0c0 down, r0c1 up, r1c0 right, r1c1 left
var ZOMBIE_CELL = {
  down:  {c:0,r:0},
  up:    {c:1,r:0},
  right: {c:0,r:1},
  left:  {c:1,r:1},
};
// Load zombie sprite images
var zombieImgs = {};
Object.keys(ZOMBIE_CHARACTERS).forEach(function(k){
  var im = new Image(); im.src = ZOMBIE_CHARACTERS[k].url;
  zombieImgs[k] = im;
});

// One zombie of each character on the map
var ZOMBIE_DETECT = 280;       // px proximity for detection
var ZOMBIE_VISION_CONE = 120 * Math.PI/180;  // 120° vision cone in front of zombie
var ZOMBIE_BASE_SPD = 0.5;     // wander speed multiplier (relative to P.spd)
var ZOMBIE_CHASE_SPD = 0.8;    // chase speed (0.8 of player)
var ZOMBIE_FLEE_SPD = 1.0;     // flee speed in power mode (matches player)
var ZOMBIE_TOUCH_RADIUS = 70;  // touch distance for game-over (slightly generous)
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

function spawnItems(){
  ITEMS = [];
  var ids = ['key','phone','present'];
  ids.forEach(function(id){
    var p = randomWalkablePoint();
    ITEMS.push({ id:id, x:p.x, y:p.y, taken:false, bobT:Math.random()*Math.PI*2 });
  });
}

function spawnZombies(){
  ZOMBIES = [];
  if(!ZOMBIES_ENABLED) return;   // dev toggle — set to false for collision tuning
  var charKeys = Object.keys(ZOMBIE_CHARACTERS);
  charKeys.forEach(function(charKey){
    var p, dx, dy, tries=0;
    do {
      p = randomWalkablePoint();
      dx = p.x-P.x; dy = p.y-P.y;
      tries++;
    } while(Math.sqrt(dx*dx+dy*dy) < 500 && tries<50);
    var initialDir = Math.random()*Math.PI*2;
    ZOMBIES.push({
      char: charKey,
      x: p.x, y: p.y,
      dir: initialDir,                  // current heading (radians)
      facing: dirToFacing(initialDir),  // 'down'|'up'|'right'|'left' for sprite
      dirT: 0,
      state: 'wander',                  // 'wander' | 'chase' | 'flee'
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
  INV.key=false; INV.phone=false; INV.present=false;
  updateInventoryHUD();
}

function updateInventoryHUD(){
  ['key','phone','present'].forEach(function(id){
    var el = document.getElementById('inv-'+id);
    if(!el) return;
    if(INV[id]){
      el.classList.add('filled');
      el.textContent = ITEM_EMOJI[id];
    } else {
      el.classList.remove('filled');
      el.textContent = '';
    }
  });
}

function startGame(){
  // "Start Game" button click → hide menu, kill music, play cutscene.
  // When cutscene ends, beginGameplay() runs.
  STATE = 'cutscene';
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
  POWER_MODE = false;
  document.getElementById('power-banner').classList.remove('show');
  spawnItems();
  spawnZombies();
}

function activatePowerMode(){
  POWER_MODE = true;
  powerEnds = performance.now() + POWER_MS;
  document.getElementById('power-banner').classList.add('show');
  // Flip all zombies to flee state immediately
  ZOMBIES.forEach(function(z){ z.state='flee'; });
}

function endPowerMode(){
  POWER_MODE = false;
  document.getElementById('power-banner').classList.remove('show');
  // Zombies return to wander; they'll re-detect player if in range
  ZOMBIES.forEach(function(z){ z.state='wander'; });
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
      updateInventoryHUD();
      // Check if all 3 collected -> power mode
      if(INV.key && INV.phone && INV.present){
        setTimeout(activatePowerMode, 150);
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
    var size = 56 * ZOOM;
    if(itemsSheet.complete && itemsSheet.naturalWidth){
      // Slice the cell for this item from the sheet (5 columns).
      // The items occupy a vertical band roughly 35%-68% of the image height,
      // with empty space above and below — so we crop to that band to avoid squish.
      var cellW = itemsSheet.naturalWidth / ITEMS_SHEET_COLS;
      var sheetH = itemsSheet.naturalHeight;
      var srcY = sheetH * 0.34;
      var srcH = sheetH * 0.34;
      var col   = ITEM_CELL[it.id];
      // Draw as a square, preserving the actual item aspect (roughly 1:1)
      ctx.drawImage(itemsSheet, col*cellW, srcY, cellW, srcH,
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

// ── ZOMBIES: wander, chase, flee with directional vision ─────────
// Returns true if the player is within the zombie's vision cone in front of it.
// Vision = within radius AND within VISION_CONE angle of zombie's current facing.
function playerInZombieVision(z, dist){
  if(dist > ZOMBIE_DETECT) return false;
  if(dist < 30) return true;  // touching counts as seen (avoid divide issues)
  // angle from zombie to player
  var ang = Math.atan2(P.y - z.y, P.x - z.x);
  // zombie's facing direction as an angle
  var facingAng = { right:0, down:Math.PI/2, left:Math.PI, up:-Math.PI/2 }[z.facing];
  // smallest angle difference
  var diff = Math.abs(((ang - facingAng + Math.PI) % (Math.PI*2)) - Math.PI);
  return diff <= ZOMBIE_VISION_CONE/2;
}

function updateZombies(){
  // End power mode when timer runs out
  if(POWER_MODE){
    var remaining = (powerEnds - performance.now())/1000;
    if(remaining<=0){ endPowerMode(); }
    else { document.getElementById('pb-secs').textContent = Math.ceil(remaining); }
  }

  for(var i=0; i<ZOMBIES.length; i++){
    var z = ZOMBIES[i];
    var dx = P.x - z.x, dy = P.y - z.y;
    var dist = Math.sqrt(dx*dx + dy*dy);

    // ── State transitions ──
    if(POWER_MODE){
      z.state = 'flee';
    } else {
      // Stay in chase if already chasing AND still within larger radius (hysteresis)
      // Otherwise: enter chase only via vision cone detection
      if(z.state==='chase'){
        if(dist > ZOMBIE_DETECT*1.4) z.state='wander';
      } else if(z.state==='flee'){
        z.state='wander';   // power mode ended
      } else {
        // wandering: check vision cone
        if(playerInZombieVision(z, dist)) z.state='chase';
      }
    }

    // ── Movement based on state ──
    var spd = P.spd * ZOMBIE_BASE_SPD;
    var moveX = 0, moveY = 0;
    if(z.state==='chase'){
      spd = P.spd * ZOMBIE_CHASE_SPD;
      if(dist>0){ moveX = (dx/dist)*spd; moveY = (dy/dist)*spd; }
      // face the player while chasing
      z.facing = dirToFacing(Math.atan2(dy,dx));
    } else if(z.state==='flee'){
      spd = P.spd * ZOMBIE_FLEE_SPD;
      if(dist>0){ moveX = -(dx/dist)*spd; moveY = -(dy/dist)*spd; }
      // face away from player while fleeing
      z.facing = dirToFacing(Math.atan2(-dy,-dx));
    } else {
      // wander: pick new heading periodically; update facing each time
      z.dirT--;
      if(z.dirT<=0){
        z.dir = Math.random()*Math.PI*2;
        z.dirT = 80 + Math.random()*140;
        z.facing = dirToFacing(z.dir);
      }
      moveX = Math.cos(z.dir)*spd; moveY = Math.sin(z.dir)*spd;
    }

    // ── Apply move with collision ──
    var ZFB_W=50, ZFB_H=30;
    var tryX = z.x + moveX;
    var fbX = {x:tryX-ZFB_W/2, y:z.y-ZFB_H/2, w:ZFB_W, h:ZFB_H};
    var blocked=false;
    for(var c=0;c<COLLISIONS.length;c++){ if(rectOverlap(fbX,COLLISIONS[c])){ blocked=true; break; } }
    if(!blocked && tryX>=50 && tryX<=WORLD.w-50) z.x = tryX;
    else if(z.state==='wander'){ z.dir = Math.random()*Math.PI*2; z.facing = dirToFacing(z.dir); }

    var tryY = z.y + moveY;
    var fbY = {x:z.x-ZFB_W/2, y:tryY-ZFB_H/2, w:ZFB_W, h:ZFB_H};
    blocked=false;
    for(var c=0;c<COLLISIONS.length;c++){ if(rectOverlap(fbY,COLLISIONS[c])){ blocked=true; break; } }
    if(!blocked && tryY>=50 && tryY<=WORLD.h-50) z.y = tryY;
    else if(z.state==='wander'){ z.dir = Math.random()*Math.PI*2; z.facing = dirToFacing(z.dir); }

    // ── TOUCH DETECTION: game over if zombie touches player ──
    // Skip touch if in power mode (zombies are fleeing, can't catch you)
    if(!POWER_MODE && STATE==='playing' && dist < ZOMBIE_TOUCH_RADIUS){
      triggerGameOver(z);
      return;
    }
  }
}

function drawZombies(){
  for(var i=0; i<ZOMBIES.length; i++){
    var z = ZOMBIES[i];
    var x = w2sX(z.x), y = w2sY(z.y);
    // Zombie sprite size in world units
    var spriteH = 150, spriteW = spriteH*0.78;  // similar proportions to Sarah
    var sw = spriteW*ZOOM, sh = spriteH*ZOOM;

    // shadow on the ground (anchored at z.y, the zombie's feet)
    var shW = sw*0.55, shH = shW*0.35;
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, shW/2, shH/2, 0, 0, Math.PI*2); ctx.fill();

    // sprite
    var img = zombieImgs[z.char];
    var dx = x - sw/2, dy = y - sh;
    if(img && img.complete && img.naturalWidth){
      var cellW = img.naturalWidth / 2;
      var cellH = img.naturalHeight / 2;
      var cell = ZOMBIE_CELL[z.facing] || ZOMBIE_CELL.down;
      ctx.drawImage(img, cell.c*cellW, cell.r*cellH, cellW, cellH, dx, dy, sw, sh);
    } else {
      // Fallback to colored dot while sprite loads
      var color = z.state==='chase' ? '#CC2200' : (z.state==='flee' ? '#7CFC9A' : '#29ABE2');
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y - sh*0.35, sh*0.18, 0, Math.PI*2); ctx.fill();
    }

    // chase indicator (small ! above their head)
    if(z.state==='chase'){
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
  document.getElementById('power-banner').classList.remove('show');
  // Count items collected for the resign screen
  var collected = (INV.key?1:0) + (INV.phone?1:0) + (INV.present?1:0);
  document.getElementById('resign-items').textContent = collected;
  var byName = ZOMBIE_CHARACTERS[byZombie.char].name;
  document.getElementById('resign-by').textContent = byName;
  document.getElementById('resign-screen').classList.add('show');
}
function returnToMenu(){
  STATE = 'menu';
  document.getElementById('resign-screen').classList.remove('show');
  document.getElementById('menu-screen').classList.remove('hidden');
  fadeInMenuMusic();
}

var loop=function(){
  requestAnimationFrame(loop);
  P.spd = parseFloat(document.getElementById('speed').value);
  ZOOM = parseFloat(document.getElementById('zoom').value);

  // movement (normalized; keyboard or joystick) — only when playing
  var ix=0, iy=0;
  if(STATE==='playing' && !EDIT){
    if(JOY.active){ ix=JOY.vx; iy=JOY.vy; }
    else {
      if(K.up)iy-=1; if(K.down)iy+=1; if(K.left)ix-=1; if(K.right)ix+=1;
    }
  }
  // Update 4-way facing: prefer horizontal direction if both axes are pressed
  // (matches the side-walking animation which is the most visually polished).
  if(Math.abs(ix) > Math.abs(iy)){
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
  tryPlayMenuMusic();
  requestAnimationFrame(loop);
});
