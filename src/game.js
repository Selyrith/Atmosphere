/* ============================================================
   Атмосфера — RP-свидание. Один файл, без ES-модулей.
   v1.1: STUN/TURN для PeerJS + устойчивость к сворачиванию
   Telegram Mini App.
   ============================================================ */
(function () {
'use strict';

/* ============================================================
   TELEGRAM MINI APP
   ============================================================ */
var TG = (window.Telegram && window.Telegram.WebApp) || null;
var TG_USER = TG && TG.initDataUnsafe && TG.initDataUnsafe.user;
var START_PARAM = TG && TG.initDataUnsafe && TG.initDataUnsafe.start_param;
var DEFAULT_NAME = (TG_USER && TG_USER.first_name) ? String(TG_USER.first_name).slice(0, 14) : 'Ты';

var BOT_USERNAME = '';
var BOT_APPNAME  = '';

if (TG) {
  try {
    TG.ready();
    TG.expand();
    if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();
    document.body.classList.add('tg-mini');
  } catch (e) { /* no-op */ }
}

function getStartParam() {
  if (START_PARAM) return START_PARAM;
  try {
    var m = window.location.search.match(/[?&]startapp=([A-Za-z0-9_-]+)/);
    if (m) return m[1];
  } catch (e) {}
  return null;
}

/* ============================================================
   ПЕРЕХВАТ ОШИБОК
   Фильтруем cross-origin "Script error." — это не наша ошибка,
   а шум от CDN (PeerJS/Telegram SDK). Показываем баннер только
   на настоящие падения.
   ============================================================ */
function showFatal(label, detail) {
  var el = document.getElementById('boot-status');
  if (el) {
    el.style.display = 'block';
    el.style.background = '#d02020';
    el.style.color = '#fff';
    el.style.padding = '12px 14px';
    el.style.textAlign = 'left';
    el.style.fontSize = '13px';
    el.style.fontFamily = 'monospace';
    el.style.whiteSpace = 'pre-wrap';
    el.style.maxHeight = '70vh';
    el.style.overflow = 'auto';
    el.textContent = label + '\n' + (detail || '');
  } else console.error(label, detail);
}

window.addEventListener('error', function (e) {
  // Игнорируем cross-origin ошибки — они не имеют .filename и пишут "Script error."
  if (!e.filename && (!e.message || e.message === 'Script error.')) {
    console.warn('[cross-origin error ignored]', e);
    return;
  }
  if (e.message) {
    showFatal('Ошибка:', e.message + '\n' + (e.filename || '') + ':' + (e.lineno || ''));
  }
});

window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  var msg = r && (r.message || r.stack || String(r)) || '';
  // Промисы тоже могут отклоняться cross-origin кодом
  if (msg === 'Script error.' || msg === '') {
    console.warn('[cross-origin rejection ignored]', e);
    return;
  }
  showFatal('Promise:', msg);
});

/* ============================================================
   Палитра
   ============================================================ */
var P = {
  black:'#000000', navy:'#1D2B53', plum:'#7E2553', forest:'#008751',
  brown:'#AB5236', slate:'#5F574F', silver:'#C2C3C7', white:'#FFF1E8',
  red:'#FF004D', orange:'#FFA300', yellow:'#FFEC27', green:'#00E436',
  blue:'#29ADFF', lilac:'#83769C', pink:'#FF77A8', peach:'#FFCCAA'
};
var SKIN = [P.peach,'#E8B088','#C98B5E','#8E5A3B','#5E3A26','#F5D5B8','#A9714B',P.orange,'#6B4423','#FFE0C2','#D9A06B','#3E2A1C'];
var HAIR = [P.black,P.brown,P.orange,P.yellow,P.white,P.pink,P.blue,P.green,P.plum,P.lilac,P.silver,P.red];
var SHIRT_COLORS = [P.blue,P.red,P.green,P.yellow,P.pink,P.lilac,P.orange,P.white,P.navy,P.plum,P.silver,P.forest];
var EYE_COLORS = [P.navy,P.black,P.blue,P.green,P.brown,P.plum,P.silver,P.red,P.lilac,P.orange];
var HAIR_STYLES = ['bob','long','short','curly','pony','bun','mohawk','bald','spiky','wavy','braids','afro'];
var EYE_STYLES = ['round','dot','wide','sleepy','star','smile','angry','calm','wink','heart'];
var SHIRT_STYLES = ['tee','hoodie','shirt','dress','jacket','sweater','tank','coat','vest','kimono','uniform','poncho'];
var ACCESSORIES = ['none','glasses','cap','beanie','earring','scarf','bow','headphones','mustache','flower','mask','crown'];
var HAIR_NAMES = { bob:'Каре', long:'Длинные', short:'Короткие', curly:'Кудри', pony:'Хвост', bun:'Пучок', mohawk:'Ирокез', bald:'Лысый', spiky:'Ёжик', wavy:'Волнистые', braids:'Косички', afro:'Афро' };
var EYE_NAMES = { round:'Круглые', dot:'Точки', wide:'Большие', sleepy:'Сонные', star:'Звёзды', smile:'Улыбка', angry:'Сердитые', calm:'Спокойные', wink:'Подмигивают', heart:'Сердечки' };
var SHIRT_NAMES = { tee:'Футболка', hoodie:'Худи', shirt:'Рубашка', dress:'Платье', jacket:'Куртка', sweater:'Свитер', tank:'Майка', coat:'Пальто', vest:'Жилет', kimono:'Кимоно', uniform:'Форма', poncho:'Пончо' };
var ACC_NAMES = { none:'Нет', glasses:'Очки', cap:'Кепка', beanie:'Шапка', earring:'Серьга', scarf:'Шарф', bow:'Бант', headphones:'Наушники', mustache:'Усы', flower:'Цветок', mask:'Маска', crown:'Корона' };

function px(c, x, y, col) { c.fillStyle = col; c.fillRect(x|0, y|0, 1, 1); }
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x|0, y|0, w|0, h|0); }
function r(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x|0, y|0, w|0, h|0); }

function defaultProfile(name) {
  return { name: name || DEFAULT_NAME, skin:0, hair:0, hairColor:0, eyes:0, eyeColor:0, shirt:0, shirtColor:0, acc:0 };
}
function randomProfile(name) {
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  return { name: name || DEFAULT_NAME, skin: rnd(SKIN.length), hair: rnd(HAIR_STYLES.length), hairColor: rnd(HAIR.length),
    eyes: rnd(EYE_STYLES.length), eyeColor: rnd(EYE_COLORS.length),
    shirt: rnd(SHIRT_STYLES.length), shirtColor: rnd(SHIRT_COLORS.length), acc: rnd(ACCESSORIES.length) };
}

function hairBack(c, ox, y, style, col) {
  switch (style) {
    case 1: rect(c, ox+3, y+2, 10, 17, col); break;
    case 3: rect(c, ox+2, y+1, 12, 4, col); rect(c, ox+2, y+5, 2, 6, col); rect(c, ox+12, y+5, 2, 6, col); break;
    case 4: rect(c, ox+3, y+2, 10, 8, col); rect(c, ox+12, y+4, 3, 9, col); break;
    case 10: rect(c, ox+3, y+2, 10, 8, col); rect(c, ox+3, y+10, 2, 7, col); rect(c, ox+11, y+10, 2, 7, col); break;
    case 11: rect(c, ox+2, y, 12, 10, col); break;
    case 6: case 7: break;
    default: rect(c, ox+3, y+2, 10, 8, col);
  }
}
function hairFront(c, ox, y, style, col) {
  switch (style) {
    case 0: rect(c, ox+4, y+1, 8, 3, col); px(c, ox+3, y+4, col); px(c, ox+12, y+4, col); break;
    case 1: rect(c, ox+4, y+1, 8, 4, col); break;
    case 2: rect(c, ox+4, y+1, 8, 2, col); break;
    case 3: rect(c, ox+3, y+1, 10, 3, col); rect(c, ox+3, y+4, 2, 2, col); rect(c, ox+11, y+4, 2, 2, col); break;
    case 4: rect(c, ox+4, y+1, 8, 3, col); break;
    case 5: rect(c, ox+4, y+1, 8, 3, col); rect(c, ox+6, y-2, 4, 3, col); break;
    case 6: rect(c, ox+7, y-1, 2, 6, col); break;
    case 7: break;
    case 8: for (var i = 0; i < 4; i++) rect(c, ox+4+i*2, y+1, 2, 2+(i%2), col); break;
    case 9: rect(c, ox+4, y+1, 8, 3, col); px(c, ox+4, y+4, col); px(c, ox+11, y+4, col); break;
    case 10: rect(c, ox+4, y+1, 8, 3, col); break;
    case 11: rect(c, ox+3, y, 10, 4, col); break;
  }
}
function shirtBody(c, ox, y, style, col) {
  switch (style) {
    case 1: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+6, y+9, 4, 2, P.navy); break;
    case 2: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+7, y+9, 2, 5, P.silver); break;
    case 3: rect(c, ox+4, y+9, 8, 8, col); rect(c, ox+3, y+15, 10, 4, col); break;
    case 4: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+7, y+9, 2, 9, P.white); break;
    case 5: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+4, y+15, 8, 1, P.silver); break;
    case 6: rect(c, ox+5, y+9, 6, 9, col); break;
    case 7: rect(c, ox+4, y+9, 8, 11, col); rect(c, ox+7, y+9, 2, 9, P.slate); break;
    case 8: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+4, y+12, 8, 1, P.black); break;
    case 9: rect(c, ox+4, y+9, 8, 9, col); rect(c, ox+4, y+13, 8, 1, P.red); break;
    case 10: rect(c, ox+4, y+9, 8, 9, col); px(c, ox+7, y+10, P.yellow); px(c, ox+8, y+11, P.yellow); break;
    case 11: rect(c, ox+3, y+9, 10, 9, col); rect(c, ox+3, y+16, 10, 1, P.brown); break;
    default: rect(c, ox+4, y+9, 8, 9, col);
  }
  rect(c, ox+4, y+17, 8, 1, P.black);
}
function drawEyes(c, ox, y, style, col) {
  var L = ox+5, R = ox+9, ey = y+5;
  switch (style) {
    case 1: px(c, L, ey, col); px(c, R, ey, col); break;
    case 2: rect(c, L, ey-1, 2, 2, P.white); px(c, L, ey, col); rect(c, R, ey-1, 2, 2, P.white); px(c, R+1, ey, col); break;
    case 3: rect(c, L, ey, 2, 1, col); rect(c, R, ey, 2, 1, col); break;
    case 4: px(c, L, ey, P.yellow); px(c, R, ey, P.yellow); px(c, L, ey-1, P.yellow); px(c, R, ey-1, P.yellow); break;
    case 5: rect(c, L, ey, 2, 1, col); rect(c, R, ey, 2, 1, col); px(c, L-1, ey-1, col); px(c, R+2, ey-1, col); break;
    case 6: rect(c, L, ey, 2, 1, col); rect(c, R, ey, 2, 1, col); px(c, L+1, ey-1, col); px(c, R, ey-1, col); break;
    case 7: rect(c, L, ey, 2, 1, col); rect(c, R, ey, 2, 1, col); break;
    case 8: rect(c, L, ey, 2, 1, col); rect(c, R, ey, 2, 1, P.plum); px(c, R+1, ey-1, col); break;
    case 9: px(c, L, ey, P.red); px(c, L+1, ey, P.red); px(c, R, ey, P.red); px(c, R+1, ey, P.red); break;
    default: rect(c, L, ey-1, 2, 2, col); rect(c, R, ey-1, 2, 2, col);
  }
}
function accessory(c, ox, y, style) {
  switch (style) {
    case 1: rect(c, ox+4, y+4, 3, 1, P.navy); rect(c, ox+8, y+4, 3, 1, P.navy); px(c, ox+7, y+4, P.navy); break;
    case 2: rect(c, ox+3, y+1, 10, 2, P.red); rect(c, ox+10, y+3, 5, 1, P.red); break;
    case 3: rect(c, ox+3, y, 10, 4, P.green); rect(c, ox+3, y+4, 10, 1, P.white); break;
    case 4: px(c, ox+12, y+6, P.yellow); break;
    case 5: rect(c, ox+4, y+9, 8, 2, P.pink); rect(c, ox+3, y+11, 1, 3, P.pink); break;
    case 6: rect(c, ox+6, y-1, 4, 2, P.pink); px(c, ox+7, y+1, P.pink); px(c, ox+8, y+1, P.pink); break;
    case 7: rect(c, ox+2, y+3, 2, 5, P.slate); rect(c, ox+12, y+3, 2, 5, P.slate); rect(c, ox+2, y+1, 12, 2, P.slate); break;
    case 8: rect(c, ox+6, y+7, 4, 1, P.brown); px(c, ox+6, y+8, P.brown); px(c, ox+9, y+8, P.brown); break;
    case 9: px(c, ox+3, y+2, P.pink); px(c, ox+3, y+3, P.yellow); px(c, ox+12, y+2, P.yellow); break;
    case 10: rect(c, ox+4, y+6, 8, 3, P.silver); break;
    case 11: rect(c, ox+4, y-2, 8, 2, P.yellow); px(c, ox+4, y-3, P.yellow); px(c, ox+11, y-3, P.yellow); px(c, ox+7, y-3, P.yellow); px(c, ox+8, y-3, P.yellow); break;
  }
}
function drawAvatar(ctx, ox, oy, cfg, opts) {
  opts = opts || {};
  var t = opts.t || 0;
  var talking = !!opts.talking;
  var bob = Math.sin(t * 2.4) > 0 ? 0 : 1;
  var y = oy + bob;
  var skin = SKIN[cfg.skin % SKIN.length];
  var hairC = HAIR[cfg.hairColor % HAIR.length];
  var shirtC = SHIRT_COLORS[cfg.shirtColor % SHIRT_COLORS.length];
  var eyeC = EYE_COLORS[cfg.eyeColor % EYE_COLORS.length];
  hairBack(ctx, ox, y, cfg.hair, hairC);
  rect(ctx, ox+5, y+18, 2, 5, P.navy); rect(ctx, ox+9, y+18, 2, 5, P.navy);
  rect(ctx, ox+5, y+22, 2, 1, P.black); rect(ctx, ox+9, y+22, 2, 1, P.black);
  shirtBody(ctx, ox, y, cfg.shirt, shirtC);
  rect(ctx, ox+3, y+10, 1, 6, skin); rect(ctx, ox+12, y+10, 1, 6, skin);
  rect(ctx, ox+7, y+8, 2, 1, skin);
  rect(ctx, ox+4, y+2, 8, 7, skin);
  px(ctx, ox+3, y+5, skin); px(ctx, ox+12, y+5, skin);
  drawEyes(ctx, ox, y, cfg.eyes, eyeC);
  if (talking) rect(ctx, ox+7, y+7, 2, 1, P.plum);
  else { px(ctx, ox+7, y+7, P.plum); px(ctx, ox+8, y+7, P.plum); }
  hairFront(ctx, ox, y, cfg.hair, hairC);
  accessory(ctx, ox, y, cfg.acc);
}
function drawAvatarScaled(ctx, x, y, scale, cfg, opts) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); drawAvatar(ctx, 0, 0, cfg, opts); ctx.restore();
}
function drawLipsSprite(ctx, cx, cy, sc, flipped) {
  var pattern = [
    [0,0,0,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0]
  ];
  var W = 10, H = 6;
  var ox = Math.floor(cx - W*sc/2), oy = Math.floor(cy - H*sc/2);
  ctx.fillStyle = P.red;
  for (var yy = 0; yy < H; yy++) {
    var drawY = flipped ? (H - 1 - yy) : yy;
    for (var xx = 0; xx < W; xx++) if (pattern[yy][xx]) ctx.fillRect(ox + xx*sc, oy + drawY*sc, sc, sc);
  }
}
function drawHeartSprite(ctx, x, y, s) {
  ctx.fillStyle = P.red;
  ctx.beginPath(); ctx.arc(x - s*0.5, y - s*0.2, s*0.55, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s*0.5, y - s*0.2, s*0.55, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s*1.05, y - s*0.05); ctx.lineTo(x, y + s*1.1); ctx.lineTo(x + s*1.05, y - s*0.05); ctx.closePath(); ctx.fill();
}
function drawHandSprite(ctx, cx, cy, sc) {
  var ox = Math.floor(cx - 5*sc), oy = Math.floor(cy - 5*sc);
  ctx.fillStyle = P.peach;
  ctx.fillRect(ox, oy + 5*sc, 10*sc, 5*sc);
  ctx.fillRect(ox, oy, 2*sc, 5*sc);
  ctx.fillRect(ox + 2*sc, oy - 3*sc, 2*sc, 8*sc);
  ctx.fillRect(ox + 4*sc, oy - 4*sc, 2*sc, 9*sc);
  ctx.fillRect(ox + 6*sc, oy - 2*sc, 2*sc, 7*sc);
  ctx.fillRect(ox + 8*sc, oy, 2*sc, 5*sc);
  ctx.fillStyle = '#c98b5e'; ctx.fillRect(ox, oy + 9*sc, 10*sc, 1*sc);
}

/* ============================================================
   Локации
   ============================================================ */
function sky(c, top, bottom) { for (var i = 0; i < 10; i++) r(c, 0, i * 6, 160, 6, i < 5 ? top : bottom); }

function locCafe(c, t) {
  r(c, 0, 0, 160, 62, '#3a2a22'); r(c, 0, 62, 160, 18, P.brown); r(c, 0, 60, 160, 2, '#5a4030');
  r(c, 14, 10, 56, 40, P.navy); r(c, 14, 10, 56, 2, P.slate); r(c, 14, 48, 56, 2, P.slate); r(c, 41, 10, 2, 40, P.slate);
  var rain = Math.floor(t * 14) % 10;
  for (var i = 0; i < 14; i++) { var x = 16 + ((i * 23) % 52), y = 12 + ((i * 17 + rain * 3) % 34); r(c, x, y, 1, 2, '#4a6a9a'); }
  r(c, 30, 26, 6, 6, P.slate); r(c, 50, 34, 8, 6, P.slate);
  r(c, 118, 0, 1, 14, P.black); r(c, 112, 14, 14, 4, P.yellow);
  c.globalAlpha = (0.55 + 0.2 * Math.sin(t * 3)) * 0.25; r(c, 104, 18, 30, 26, P.yellow); c.globalAlpha = 1;
  r(c, 24, 58, 112, 3, P.brown); r(c, 30, 61, 3, 7, P.brown); r(c, 127, 61, 3, 7, P.brown);
  r(c, 4, 0, 8, 6, P.forest); r(c, 148, 0, 8, 4, P.forest);
}
function locPark(c, t) {
  sky(c, '#7ec8f0', '#c8e8f8'); r(c, 128, 18, 12, 12, P.yellow);
  for (var i = 0; i < 3; i++) { var x = ((i * 60 + t * 4) % 190) - 20; r(c, x, 14 + i * 6, 22, 5, P.white); r(c, x + 6, 10 + i * 6, 14, 5, P.white); }
  r(c, 16, 40, 4, 22, P.brown); r(c, 4, 24, 28, 18, P.forest); r(c, 8, 20, 20, 8, P.green);
  r(c, 138, 44, 4, 18, P.brown); r(c, 128, 30, 24, 16, P.forest); r(c, 132, 26, 16, 8, P.green);
  r(c, 0, 62, 160, 18, P.green); r(c, 0, 68, 160, 12, '#d8c890');
  r(c, 56, 56, 48, 3, P.brown); r(c, 58, 59, 2, 6, P.brown); r(c, 100, 59, 2, 6, P.brown); r(c, 56, 50, 48, 2, P.brown);
}
function locBar(c, t) {
  r(c, 0, 0, 160, 56, '#1a1220'); r(c, 0, 56, 160, 24, '#2a1a2a'); r(c, 0, 54, 160, 2, P.plum);
  c.globalAlpha = Math.sin(t * 9) > -0.85 ? 1 : 0.3;
  r(c, 118, 10, 32, 3, P.pink); r(c, 126, 16, 16, 3, P.pink); c.globalAlpha = 1;
  r(c, 12, 18, 60, 2, P.brown); r(c, 12, 34, 60, 2, P.brown);
  for (var i = 0; i < 8; i++) { var h = 5 + (i * 3) % 5; r(c, 16 + i * 7, 18 - h, 3, h, [P.green, P.blue, P.orange, P.red][i % 4]); }
  r(c, 0, 52, 160, 4, P.brown); r(c, 0, 56, 160, 2, '#4a2a1a');
}
function locAirport(c, t) {
  r(c, 0, 0, 160, 56, '#1c2430'); r(c, 0, 56, 160, 24, P.slate);
  r(c, 8, 8, 144, 44, '#2a3a52');
  for (var i = 0; i < 5; i++) r(c, 8 + i * 29, 8, 2, 44, P.slate);
  r(c, 8, 30, 144, 2, P.slate);
  var px0 = 24 + Math.sin(t * 0.4) * 6;
  r(c, px0, 22, 40, 4, P.silver); r(c, px0 + 10, 18, 8, 4, P.silver);
  r(c, 108, 4, 44, 10, P.black);
  for (var k = 0; k < 6; k++) { r(c, 6 + k * 26, 60, 18, 4, P.navy); r(c, 6 + k * 26, 64, 18, 10, P.slate); }
  r(c, 0, 74, 160, 6, '#3a3a44');
}
function locRooftop(c, t) {
  sky(c, '#0e1024', '#2a2048');
  for (var i = 0; i < 30; i++) { c.globalAlpha = Math.sin(t * 2 + i) > 0 ? 1 : 0.35; r(c, (i * 47) % 160, (i * 29) % 48, 1, 1, P.white); }
  c.globalAlpha = 1;
  r(c, 128, 10, 10, 10, P.white); r(c, 132, 10, 6, 10, '#0e1024');
  var bs = [[0,44,18],[20,38,12],[34,48,16],[52,34,14],[68,46,20],[90,40,14],[106,50,12],[120,36,16],[138,46,22]];
  for (var b = 0; b < bs.length; b++) {
    var bx = bs[b][0], by = bs[b][1], bw = bs[b][2];
    r(c, bx, by, bw, 62 - by, '#161a30');
    for (var wy = by + 3; wy < 58; wy += 5) for (var wx = bx + 2; wx < bx + bw - 2; wx += 4) if ((wx + wy + Math.floor(t)) % 7 < 2) r(c, wx, wy, 2, 2, P.yellow);
  }
  r(c, 0, 62, 160, 18, '#2a2a34'); r(c, 0, 62, 160, 2, P.slate); r(c, 0, 54, 160, 2, P.silver);
  for (var k = 0; k < 16; k++) r(c, k * 10, 54, 1, 8, P.silver);
}
function locBeach(c, t) {
  sky(c, '#ffb870', '#ffd9a0'); r(c, 100, 16, 14, 14, P.orange);
  for (var y = 44; y < 62; y += 3) {
    var off = Math.sin(t * 1.5 + y) * 3;
    r(c, 0, y, 160, 2, y < 50 ? P.blue : '#1a7aa8');
    for (var i = 0; i < 8; i++) r(c, ((i * 24 + off + y * 2) % 160), y, 4, 1, P.white);
  }
  r(c, 0, 62, 160, 18, P.peach); r(c, 0, 62, 160, 1, '#e8b088');
  r(c, 22, 30, 3, 34, P.brown);
  r(c, 6, 24, 20, 6, P.forest); r(c, 22, 20, 20, 6, P.forest); r(c, 12, 18, 12, 5, P.green);
}
function locMuseum(c, t) {
  r(c, 0, 0, 160, 60, '#efe6d8'); r(c, 0, 60, 160, 20, '#c8b8a0'); r(c, 0, 58, 160, 2, P.brown);
  for (var i = 0; i < 4; i++) { var x = 8 + i * 40; r(c, x, 14, 8, 44, '#f8f0e0'); r(c, x - 2, 12, 12, 3, '#f8f0e0'); r(c, x - 2, 56, 12, 3, '#f8f0e0'); }
  var ps = [[20,24,P.blue],[60,28,P.forest],[100,22,P.plum],[128,30,P.orange]];
  for (var k = 0; k < ps.length; k++) { var pp = ps[k]; r(c, pp[0], pp[1], 16, 12, P.brown); r(c, pp[0] + 1, pp[1] + 1, 14, 10, pp[2]); r(c, pp[0] + 4, pp[1] + 3, 8, 6, P.white); }
  r(c, 74, 40, 12, 4, '#d8cbb5'); r(c, 77, 24, 6, 16, '#f8f0e0'); r(c, 78, 18, 4, 6, '#f8f0e0');
}
function locArcade(c, t) {
  r(c, 0, 0, 160, 60, '#12081c'); r(c, 0, 60, 160, 20, '#1a1024'); r(c, 0, 58, 160, 2, P.plum);
  var neon = [P.pink, P.blue, P.green, P.yellow];
  for (var i = 0; i < 4; i++) {
    var x = 8 + i * 38;
    r(c, x, 20, 28, 42, '#2a1a3a'); r(c, x + 3, 24, 22, 16, neon[i]);
    c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4 + i); r(c, x + 5, 26, 18, 12, P.white); c.globalAlpha = 1;
    r(c, x + 6, 44, 16, 3, P.slate);
  }
  c.globalAlpha = Math.sin(t * 6) > -0.7 ? 1 : 0.4;
  r(c, 52, 6, 56, 3, P.pink); r(c, 60, 12, 40, 3, P.blue); c.globalAlpha = 1;
}
function locCinema(c, t) {
  r(c, 0, 0, 160, 80, '#0a0610');
  r(c, 0, 60, 160, 20, '#2a1a2a');
  r(c, 20, 20, 120, 40, '#000');
  r(c, 20, 20, 120, 2, P.slate); r(c, 20, 58, 120, 2, P.slate);
  r(c, 20, 20, 2, 40, P.slate); r(c, 138, 20, 2, 40, P.slate);
  for (var i = 0; i < 6; i++) {
    r(c, 4 + i * 26, 65, 20, 5, P.red);
    r(c, 4 + i * 26, 70, 20, 10, P.plum);
  }
}
function locClub(c, t) {
  r(c, 0, 0, 160, 60, '#180a2e'); r(c, 0, 60, 160, 20, '#2a1a3e');
  var beat = Math.floor(t * 4) % 2;
  for (var i = 0; i < 4; i++) {
    var hue = [P.pink, P.blue, P.green, P.yellow][(i + beat) % 4];
    c.globalAlpha = 0.35; r(c, 0, 62 + i * 4, 160, 3, hue); c.globalAlpha = 1;
  }
  r(c, 4, 8, 16, 50, P.black); r(c, 140, 8, 16, 50, P.black);
  for (var s = 0; s < 4; s++) { r(c, 6, 12 + s * 12, 12, 8, '#2a1a2a'); r(c, 8, 14 + s * 12, 8, 4, P.slate); }
  c.globalAlpha = 0.2 + 0.1 * Math.sin(t * 8);
  for (var b = 0; b < 5; b++) {
    var ang = t * 2 + b * 1.2;
    r(c, 80 + Math.cos(ang) * 60 - 3, 30 + Math.sin(ang) * 20 - 3, 6, 6, [P.pink, P.blue, P.green][b % 3]);
  }
  c.globalAlpha = 1;
}

var LOCATIONS = [
  { id: 'cafe', name: 'Кафе у окна', draw: locCafe },
  { id: 'park', name: 'Парк на закате', draw: locPark },
  { id: 'bar', name: 'Бар в подвале', draw: locBar },
  { id: 'airport', name: 'Аэропорт', draw: locAirport },
  { id: 'rooftop', name: 'Крыша дома', draw: locRooftop },
  { id: 'beach', name: 'Пляж вечером', draw: locBeach },
  { id: 'museum', name: 'Музей', draw: locMuseum },
  { id: 'arcade', name: 'Игровые автоматы', draw: locArcade },
  { id: 'cinema', name: 'Кинотеатр', draw: locCinema },
  { id: 'club', name: 'Ночной клуб', draw: locClub }
];
function getLocation(id) {
  for (var i = 0; i < LOCATIONS.length; i++) if (LOCATIONS[i].id === id) return LOCATIONS[i];
  return LOCATIONS[0];
}
var LOCATION_IDS = LOCATIONS.map(function (l) { return l.id; }).join(', ');

/* ============================================================
   Интерактивные предметы
   ============================================================ */
var INTERACTIVES = {
  beach: {
    init: function () { return { ball: { x: 80, y: 60, vx: 0, vy: 0, r: 5 } }; },
    update: function (dt, s) {
      var b = s.ball;
      b.vy += 180 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * 0.75; }
      if (b.x > 160 - b.r) { b.x = 160 - b.r; b.vx = -b.vx * 0.75; }
      if (b.y > 82 - b.r) { b.y = 82 - b.r; b.vy = -b.vy * 0.6; b.vx *= 0.85; }
      b.vx *= 0.992;
    },
    render: function (ctx, s) {
      var b = s.ball;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      var sw = Math.max(2, b.r * 2 - Math.abs(b.y - 82) * 0.12);
      ctx.fillRect(b.x - sw/2, 82, sw, 2);
      ctx.fillStyle = '#FF004D';
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      ctx.fillStyle = '#FFF1E8';
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, Math.max(1, Math.round(b.r * 0.7)));
    },
    pointer: function (x, y, type, s) {
      if (type !== 'down') return null;
      var b = s.ball;
      var dx = x - b.x, dy = y - b.y;
      var d = Math.sqrt(dx*dx + dy*dy) || 1;
      b.vx = (dx / d) * 220; b.vy = (dy / d) * 220 - 100;
      return { action: 'throw', data: { x: b.x, y: b.y, vx: b.vx, vy: b.vy } };
    },
    apply: function (a, d, s) { if (a === 'throw') { s.ball.x = d.x; s.ball.y = d.y; s.ball.vx = d.vx; s.ball.vy = d.vy; } }
  },
  cafe: {
    init: function () { return { brew: { level: 0, steamT: 0, pouring: false } }; },
    update: function (dt, s) {
      if (s.brew.pouring) {
        s.brew.level = Math.min(1, s.brew.level + dt * 0.7);
        s.brew.steamT += dt;
        if (s.brew.level >= 1) s.brew.pouring = false;
      }
    },
    render: function (ctx, s) {
      var lx = 76, ly = 50;
      ctx.fillStyle = '#FFF1E8'; ctx.fillRect(lx - 3, ly, 6, 8); ctx.fillRect(lx + 3, ly + 2, 1, 3);
      if (s.brew.level > 0) {
        var h = Math.max(1, Math.round(7 * s.brew.level));
        ctx.fillStyle = '#AB5236'; ctx.fillRect(lx - 2, ly + 7 - h, 4, h);
      }
      if (s.brew.level > 0.3) {
        var st = Math.sin(s.brew.steamT * 6);
        ctx.fillStyle = '#C2C3C7';
        ctx.fillRect(lx - 2 + st, ly - 4, 1, 2);
        ctx.fillRect(lx + 1 - st, ly - 5, 1, 2);
      }
    },
    pointer: function (x, y, type, s) {
      if (type !== 'down') return null;
      s.brew.level = 0; s.brew.steamT = 0; s.brew.pouring = true;
      return { action: 'pour', data: {} };
    },
    apply: function (a, d, s) { if (a === 'pour') { s.brew.level = 0; s.brew.steamT = 0; s.brew.pouring = true; } }
  },
  park: {
    init: function () { return { leaves: [] }; },
    update: function (dt, s) {
      for (var i = 0; i < s.leaves.length; i++) {
        var l = s.leaves[i];
        l.t += dt; l.x += Math.sin(l.t * 2) * 15 * dt; l.y += l.vy * dt;
      }
      s.leaves = s.leaves.filter(function (l) { return l.y < 100; });
    },
    render: function (ctx, s) {
      for (var i = 0; i < s.leaves.length; i++) {
        ctx.fillStyle = s.leaves[i].color;
        ctx.fillRect(s.leaves[i].x, s.leaves[i].y, 2, 2);
      }
    },
    pointer: function (x, y, type, s) {
      if (type !== 'down') return null;
      var leaves = [];
      for (var i = 0; i < 8; i++) leaves.push({ x: Math.random() * 160, y: -5 - Math.random() * 20, vy: 15 + Math.random() * 20, t: Math.random() * 10, color: ['#00E436','#008751','#FFEC27'][Math.floor(Math.random()*3)] });
      s.leaves = s.leaves.concat(leaves);
      return { action: 'shake', data: { leaves: leaves } };
    },
    apply: function (a, d, s) { if (a === 'shake') s.leaves = s.leaves.concat(d.leaves); }
  },
  rooftop: {
    init: function () { return { planes: [] }; },
    update: function (dt, s) {
      for (var i = 0; i < s.planes.length; i++) {
        var p = s.planes[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 22 * dt; p.t += dt;
      }
      s.planes = s.planes.filter(function (p) { return p.x > -20 && p.x < 180 && p.y < 120; });
    },
    render: function (ctx, s) {
      for (var i = 0; i < s.planes.length; i++) {
        var p = s.planes[i];
        ctx.fillStyle = '#FFF1E8';
        ctx.fillRect(p.x, p.y, 6, 2);
        ctx.fillRect(p.x + 6, p.y - 1, 2, 1);
        ctx.fillRect(p.x + 6, p.y + 2, 2, 1);
      }
    },
    pointer: function (x, y, type, s) {
      if (type !== 'down') return null;
      var plane = { x: 34, y: 40, vx: (x - 34) * 0.6 + 40, vy: -30, t: 0 };
      s.planes.push(plane);
      return { action: 'fly', data: { plane: plane } };
    },
    apply: function (a, d, s) { if (a === 'fly') s.planes.push(d.plane); }
  },
  museum: {
    init: function () { return { zoom: null }; },
    update: function () {},
    render: function (ctx, s) {
      if (!s.zoom) return;
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, 0, 160, 80);
      ctx.fillStyle = P.brown; ctx.fillRect(28, 12, 104, 56);
      ctx.fillStyle = s.zoom.color; ctx.fillRect(30, 14, 100, 52);
      ctx.fillStyle = P.white; ctx.fillRect(46, 22, 68, 36);
      ctx.fillStyle = P.navy; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(s.zoom.title, 80, 66);
      ctx.fillStyle = P.silver; ctx.font = '6px sans-serif';
      ctx.fillText('коснись — закрыть', 80, 75);
    },
    pointer: function (x, y, type, s) {
      if (type !== 'down') return null;
      if (s.zoom) { s.zoom = null; return { action: 'unzoom', data: {} }; }
      var paintings = [
        { x: 20, y: 24, title: 'Портрет', color: P.blue },
        { x: 60, y: 28, title: 'Пейзаж', color: P.forest },
        { x: 100, y: 22, title: 'Натюрморт', color: P.plum },
        { x: 128, y: 30, title: 'Сон', color: P.orange }
      ];
      for (var i = 0; i < paintings.length; i++) {
        var p = paintings[i];
        if (x >= p.x && x <= p.x + 16 && y >= p.y && y <= p.y + 12) {
          s.zoom = p; return { action: 'zoom', data: { zoom: p } };
        }
      }
      return null;
    },
    apply: function (a, d, s) {
      if (a === 'zoom') s.zoom = d.zoom;
      if (a === 'unzoom') s.zoom = null;
    }
  }
};

/* ============================================================
   Промпт
   ============================================================ */
var ATMOSPHERE_PROMPT = [
  'ЯЗЫК ОТВЕТА: ТОЛЬКО РУССКИЙ. Ни одного английского слова. Это критическое правило.',
  '',
  'Ты — «Атмосфера». Голос мира вокруг двух людей на свидании.',
  'Ты НЕ играешь за персонажей, НЕ говоришь за них, НЕ описываешь их мысли.',
  'Ты — мир вокруг: официант, музыка, дождь, прохожий, скрип двери.',
  '',
  'ЗАДАЧА: тебе дают ПОСЛЕДНЮЮ ПАРУ ДЕЙСТВИЙ — что сделал A и что сделал B. Реагируй на ОБОИХ вместе.',
  '',
  'ПРАВИЛА: 1) Ровно 2–4 коротких предложения. 2) Не пиши за A и B. 3) NPC-реплику вплети ВНУТРЬ.',
  '4) moodDelta (-10..+10), chemDelta (-10..+10). 5) Редко (1 из 8) можешь сменить локацию.',
  '',
  'ФОРМАТ — строго валидный JSON:',
  '{"narration":"...","moodDelta":0,"chemDelta":0,"location":null}'
].join('\n');

function buildContext(ctx) {
  var a = ctx.profiles.a, b = ctx.profiles.b;
  var lastA = '(не действовал)', lastB = '(не действовал)';
  for (var i = ctx.history.length - 1; i >= 0; i--) {
    var m = ctx.history[i];
    if (m.who === 'a' && lastA === '(не действовал)') lastA = m.text;
    if (m.who === 'b' && lastB === '(не действовал)') lastB = m.text;
    if (lastA !== '(не действовал)' && lastB !== '(не действовал)') break;
  }
  var recent = ctx.history.slice(-6).map(function (m) {
    return m.who === 'a' ? 'A: ' + m.text : m.who === 'b' ? 'B: ' + m.text : 'Мир: ' + m.text;
  }).join('\n');
  return 'Локация: ' + ctx.location + ' (' + ctx.scenario + ')\nНастроение: ' + ctx.mood + '/100. Химия: ' + ctx.chemistry + '/100.\nA: ' + a.name + '. B: ' + b.name + '.\nПОСЛЕДНЯЯ ПАРА:\n- A: ' + lastA + '\n- B: ' + lastB + '\nПРЕДЫДУЩИЕ: ' + recent + '\nДоступные локации: ' + LOCATION_IDS;
}

/* ============================================================
   AI
   ============================================================ */
function extractJSON(text) {
  if (!text) return null;
  var s = String(text);
  try { return JSON.parse(s); } catch (e) {}
  var fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch (e) {} }
  var m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}
function clamp(v, a, b, fb) {
  if (fb === undefined) fb = 0;
  var n = Number(v);
  if (!isFinite(n)) return fb;
  return Math.max(a, Math.min(b, n));
}
function hashStr(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); }
function isRussianText(text) {
  if (!text) return false;
  var s = String(text); if (s.length < 5) return true;
  var cyr = 0, lat = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c >= 0x0400 && c <= 0x04FF) cyr++;
    else if ((c >= 0x0041 && c <= 0x005A) || (c >= 0x0061 && c <= 0x007A)) lat++;
  }
  return cyr >= lat;
}

var REACT_POSITIVE = ['Воздух становится теплее. Кто-то рядом тихо улыбается.','Свет падает мягче обычного. Мир словно на твоей стороне.','Слышится едва различимый смех.','Время будто замедляется.'];
var REACT_NEGATIVE = ['Повисает пауза. Где-то скрипнула дверь — не вовремя.','Холодный сквозняк проходит между вами.','Кто-то слишком громко кашляет.','Свет мигает. Один раз.'];
var REACT_NEUTRAL = ['Мир не спешит вмешиваться. Он просто наблюдает.','За окном проходит человек — и исчезает.','Тишина. Не тяжёлая, но заметная.','Где-то далеко играет музыка.'];
var POS_WORDS = ['улыб','смех','комплимент','обня','поцел','нежн','флирт','шутк','взгляд','спасибо','мило','приятн'];
var NEG_WORDS = ['груб','крич','уход','молч','отказ','зл','игнор','скучн','плох','ужас'];

function localNarrate(ctx) {
  var combined = ctx.history.slice(-2).filter(function (m) { return m.who === 'a' || m.who === 'b'; })
    .map(function (m) { return m.text; }).join(' ').toLowerCase();
  var moodDelta = 0, chemDelta = 0, pool = REACT_NEUTRAL, pos = 0, neg = 0;
  for (var i = 0; i < POS_WORDS.length; i++) if (combined.indexOf(POS_WORDS[i]) >= 0) pos++;
  for (var j = 0; j < NEG_WORDS.length; j++) if (combined.indexOf(NEG_WORDS[j]) >= 0) neg++;
  if (pos > neg) { moodDelta = 2 + pos * 2; chemDelta = 1 + pos * 2; pool = REACT_POSITIVE; }
  else if (neg > pos) { moodDelta = -2 - neg * 2; chemDelta = -1 - neg * 2; pool = REACT_NEGATIVE; }
  else { moodDelta = (Math.random() * 4 - 1) | 0; chemDelta = (Math.random() * 4 - 2) | 0; }
  moodDelta = clamp(moodDelta, -10, 10); chemDelta = clamp(chemDelta, -10, 10);
  var location = null;
  if (Math.random() < 0.12) {
    var other = LOCATIONS.filter(function (l) { return l.id !== ctx.location && l.id !== 'cinema' && l.id !== 'club'; });
    location = other[Math.floor(Math.random() * other.length)].id;
  }
  var narration = pool[Math.floor(Math.random() * pool.length)];
  var npcs = {
    cafe: ['Официант: «Ещё по одной?»','Бариста: «У нас закрывается через час.»'],
    park: ['Прохожий: «Хорошая погода сегодня.»','Собака тянет поводок к вам.'],
    bar: ['Бармен: «Повторить?»','Кто-то на сцене берёт первую ноту.'],
    airport: ['Голос по громкой: «Рейс задержан.»','Уборщица: «Не переживайте.»'],
    rooftop: ['Ветер срывает чей-то листок.','Где-то внизу сигналит машина.'],
    beach: ['Волна накрывает ноги.','Чайка кричит над головой.'],
    museum: ['Смотритель: «Мы закрываемся через десять минут.»','Скрип паркета.'],
    arcade: ['Автомат мигает «GAME OVER».','Мальчик рядом: «Высокий счёт!»'],
    cinema: ['Кто-то в зале шуршит попкорном.','Проектор тихо гудит.'],
    club: ['Басы отдают в груди.','Бармен: «Что-нибудь покрепче?»']
  };
  if (Math.random() < 0.35) {
    var p2 = npcs[ctx.location] || npcs.cafe;
    narration += ' ' + p2[Math.floor(Math.random() * p2.length)];
  }
  return { narration: narration, moodDelta: moodDelta, chemDelta: chemDelta, location: location, offline: true };
}
function localEpilogue(ctx) {
  var a = ctx.profiles.a.name, b = ctx.profiles.b.name;
  if (ctx.chemistry > 75 && ctx.mood > 60) return a + ' и ' + b + ' выходят на улицу вместе. Слова уже не так важны — всё сказано взглядами. Что-то начинается.';
  if (ctx.chemistry > 75) return a + ' и ' + b + ' уходят в разные стороны, но оба оборачиваются. Между ними осталось что-то незаконченное.';
  if (ctx.chemistry > 40) return 'Разговор получился неровным, но живым. ' + a + ' и ' + b + ' расходятся с ощущением, что стоило бы попробовать ещё раз.';
  if (ctx.mood < 30) return 'Вечер закончился раньше, чем планировалось. ' + a + ' и ' + b + ' вежливо прощаются.';
  return a + ' и ' + b + ' прощаются. Ничего не случилось — но и ничего не сломалось.';
}

function callOpenRouterNarration(ctx) {
  return _openRouterNarrOnce(ctx, false).then(function (res) {
    if (isRussianText(res.narration)) return res;
    return _openRouterNarrOnce(ctx, true).then(function (res2) {
      if (isRussianText(res2.narration)) return res2;
      return localNarrate(ctx);
    });
  });
}
function _openRouterNarrOnce(ctx, forceRussian) {
  var systemPrompt = forceRussian ? 'ВАЖНО: ПИШИ ТОЛЬКО НА РУССКОМ.\n\n' + ATMOSPHERE_PROMPT : ATMOSPHERE_PROMPT;
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + G.ai.apiKey,
      'HTTP-Referer': window.location.origin || 'http://localhost',
      'X-Title': 'Atmosfera'
    },
    body: JSON.stringify({
      model: G.ai.model || 'openrouter/free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildContext(ctx) }
      ],
      temperature: 0.9, max_tokens: 400
    })
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) {
    var raw = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
    var parsed = extractJSON(raw);
    if (!parsed || typeof parsed.narration !== 'string') throw new Error('Плохой формат');
    return {
      narration: String(parsed.narration).slice(0, 600),
      moodDelta: clamp(parsed.moodDelta, -10, 10),
      chemDelta: clamp(parsed.chemDelta, -10, 10),
      location: LOCATIONS.some(function (l) { return l.id === parsed.location; }) ? parsed.location : null,
      offline: false
    };
  });
}
function callOpenRouterEpilogue(ctx) {
  var prompt = 'Напиши короткий эпилог свидания на РУССКОМ языке. A: ' + ctx.profiles.a.name + ', B: ' + ctx.profiles.b.name + '. ' +
    'Локация: ' + ctx.location + '. Настроение: ' + ctx.mood + '/100. Химия: ' + ctx.chemistry + '/100. ' +
    '4–6 предложений. Без markdown.';
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + G.ai.apiKey,
      'HTTP-Referer': window.location.origin || 'http://localhost',
      'X-Title': 'Atmosfera'
    },
    body: JSON.stringify({ model: G.ai.model || 'openrouter/free', messages: [{ role: 'user', content: prompt }], temperature: 0.9, max_tokens: 600 })
  }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(function (j) {
    var raw = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
    if (raw && raw.length > 40 && isRussianText(raw)) return String(raw).slice(0, 900);
    return localEpilogue(ctx);
  });
}
function puterAvailable() { return typeof window.puter !== 'undefined' && window.puter && window.puter.ai && window.puter.ai.chat; }
function callPuterNarration(ctx) {
  var prompt = ATMOSPHERE_PROMPT + '\n\n---\n\n' + buildContext(ctx);
  return window.puter.ai.chat(prompt, { model: 'gpt-4.1-nano' }).then(function (res) {
    var raw = (res && res.message && res.message.content) || (res && res.text) || '';
    var parsed = extractJSON(raw);
    if (!parsed || typeof parsed.narration !== 'string') return localNarrate(ctx);
    var narr = String(parsed.narration).slice(0, 600);
    if (!isRussianText(narr)) return localNarrate(ctx);
    return {
      narration: narr,
      moodDelta: clamp(parsed.moodDelta, -10, 10),
      chemDelta: clamp(parsed.chemDelta, -10, 10),
      location: LOCATIONS.some(function (l) { return l.id === parsed.location; }) ? parsed.location : null,
      offline: false
    };
  }).catch(function () { return localNarrate(ctx); });
}
function narrate(ctx) {
  if (G.mode === 'guest') return Promise.resolve(localNarrate(ctx));
  if (G.ai && G.ai.apiKey) return callOpenRouterNarration(ctx).catch(function () { return localNarrate(ctx); });
  if (puterAvailable()) return callPuterNarration(ctx);
  return Promise.resolve(localNarrate(ctx));
}
function makeEpilogue(ctx) {
  if (G.mode === 'guest') return Promise.resolve(localEpilogue(ctx));
  if (G.ai && G.ai.apiKey) return callOpenRouterEpilogue(ctx).catch(function () { return localEpilogue(ctx); });
  return Promise.resolve(localEpilogue(ctx));
}

/* ============================================================
   СЕТЬ С STUN/TURN
   ============================================================ */
var ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Бесплатный публичный TURN (openrelay.metered.ca)
    { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:3478', username: 'openrelayproject', credential: 'openrelayproject' }
  ],
  iceTransportPolicy: 'all'
};

function NetCtor() {
  this.peer = null; this.conn = null; this.isHost = false; this.roomCode = null;
  this.onMessage = function () {}; this.onOpen = function () {}; this.onClose = function () {};
}
NetCtor.prototype._destroyPeer = function () { if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; } };
NetCtor.prototype._waitForPeerJs = function (ms) {
  ms = ms || 8000;
  if (typeof window.Peer !== 'undefined') return Promise.resolve(true);
  return new Promise(function (resolve) {
    var start = Date.now();
    var step = function () {
      if (typeof window.Peer !== 'undefined') return resolve(true);
      if (Date.now() - start > ms) return resolve(false);
      setTimeout(step, 150);
    };
    step();
  });
};
NetCtor.prototype.host = function (code) {
  var self = this;
  return this._waitForPeerJs().then(function (ok) {
    if (!ok) { self.onMessage({ t: 'error', text: 'PeerJS не загрузился.' }); return false; }
    self.isHost = true; self.roomCode = code; self._destroyPeer();
    self.peer = new window.Peer('atmos-' + code, { debug: 0, config: ICE_CONFIG });
    self.peer.on('open', function () { self.onOpen(); });
    self.peer.on('error', function (e) { self.onMessage({ t: 'error', text: 'Сеть: ' + (e.type || 'ошибка') }); });
    self.peer.on('connection', function (conn) {
      if (self.conn && self.conn.open) { try { conn.close(); } catch (e) {} return; }
      self.conn = conn; self._wire(conn);
    });
    return true;
  });
};
NetCtor.prototype.join = function (code) {
  var self = this;
  return this._waitForPeerJs().then(function (ok) {
    if (!ok) { self.onMessage({ t: 'error', text: 'PeerJS не загрузился.' }); return false; }
    self.isHost = false; self.roomCode = code; self._destroyPeer();
    self.peer = new window.Peer({ debug: 0, config: ICE_CONFIG });
    self.peer.on('open', function () {
      var conn = self.peer.connect('atmos-' + code, { reliable: true });
      self.conn = conn; self._wire(conn);
    });
    self.peer.on('error', function (e) { self.onMessage({ t: 'error', text: 'Сеть: ' + (e.type || 'ошибка') }); });
    return true;
  });
};
NetCtor.prototype._wire = function (conn) {
  var self = this;
  conn.on('open', function () { self.onOpen(); });
  conn.on('data', function (d) { try { self.onMessage(typeof d === 'string' ? JSON.parse(d) : d); } catch (e) {} });
  conn.on('close', function () { self.onClose(); });
  conn.on('error', function () { self.onClose(); });
};
NetCtor.prototype.send = function (obj) {
  if (this.conn && this.conn.open) {
    try { this.conn.send(JSON.stringify(obj)); } catch (e) { console.warn('[send]', e); }
  }
};
NetCtor.prototype.close = function () {
  try { if (this.conn) this.conn.close(); } catch (e) {}
  this.conn = null; this._destroyPeer();
};
function makeCode() {
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

/* ============================================================
   Мини-игры
   ============================================================ */
var MINIGAMES = {
  kiss: {
    title: 'Лети к поцелую', hint: 'Тапай — губы подпрыгивают. Пролети 3 пары губ.',
    init: function (st) { st.y = 100; st.vy = 0; st.angle = 0; st.obstacles = []; st.spawnTimer = 0.5; st.spawnInterval = 1.6; st.passed = 0; st.targetPassed = 3; st.won = false; st.lost = false; st.kissAnim = 0; },
    update: function (dt, st, mg) {
      if (st.won || st.lost) return;
      if (st.kissAnim > 0) { st.kissAnim -= dt; if (st.kissAnim <= 0) { st.won = true; mg.finish('win'); } return; }
      st.vy += 340 * dt; if (st.vy > 240) st.vy = 240;
      st.y += st.vy * dt; st.angle = Math.max(-0.5, Math.min(0.7, st.vy / 220));
      if (st.y < 10) { st.y = 10; st.vy = 0; }
      if (st.y > 190) { st.lost = true; mg.finish('lose'); return; }
      st.spawnTimer -= dt;
      var pending = 0;
      for (var i = 0; i < st.obstacles.length; i++) if (!st.obstacles[i].scored) pending++;
      if (st.spawnTimer <= 0 && (st.passed + pending) < st.targetPassed) {
        st.spawnTimer = st.spawnInterval;
        st.obstacles.push({ x: 200, gapY: 55 + Math.random() * 90, gapH: 62, scored: false });
      }
      var px1 = 25, px2 = 45, py1 = st.y - 6, py2 = st.y + 6;
      for (var j = 0; j < st.obstacles.length; j++) {
        var ob = st.obstacles[j];
        ob.x -= 75 * dt;
        if (px2 > ob.x && px1 < ob.x + 20 && (py1 < ob.gapY || py2 > ob.gapY + ob.gapH)) { st.lost = true; mg.finish('lose'); return; }
        if (!ob.scored && (ob.x + 20) < px1) { ob.scored = true; st.passed++; if (st.passed >= st.targetPassed) st.kissAnim = 1.8; }
      }
      st.obstacles = st.obstacles.filter(function (o) { return o.x > -30; });
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#ffe8f0'); r(ctx, 0, 170, 160, 30, '#ffb0c8');
      for (var d = 0; d < 12; d++) r(ctx, (d * 23) % 160, (d * 17) % 160, 2, 2, '#ffd0e0');
      if (st.kissAnim > 0) {
        var tt = 1 - st.kissAnim / 1.8, ease = tt * tt * (3 - 2 * tt);
        var gap = 30 * (1 - ease);
        drawLipsSprite(ctx, 80 - gap - 10, 100, 2, false);
        drawLipsSprite(ctx, 80 + gap + 10, 100, 2, false);
        for (var k = 0; k < 5; k++) drawHeartSprite(ctx, 80 + (k - 2) * 14, 70 - ease * 40 - Math.sin(k + tt * 3) * 8, 3 + ease * 3);
        return;
      }
      for (var i = 0; i < st.obstacles.length; i++) {
        var ob = st.obstacles[i];
        r(ctx, ob.x, 0, 20, ob.gapY - 12, P.pink); r(ctx, ob.x + 2, 0, 16, ob.gapY - 12, '#ff90b8');
        r(ctx, ob.x, ob.gapY - 14, 20, 14, '#e04070'); drawLipsSprite(ctx, ob.x + 10, ob.gapY - 4, 2, true);
        r(ctx, ob.x, ob.gapY + ob.gapH + 4, 20, 200 - (ob.gapY + ob.gapH + 4), P.pink);
        r(ctx, ob.x + 2, ob.gapY + ob.gapH + 4, 16, 200 - (ob.gapY + ob.gapH + 4), '#ff90b8');
        r(ctx, ob.x, ob.gapY + ob.gapH, 20, 14, '#e04070'); drawLipsSprite(ctx, ob.x + 10, ob.gapY + ob.gapH + 8, 2, false);
      }
      ctx.fillStyle = '#8a1f4a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(st.passed + ' / ' + st.targetPassed, 80, 22);
      ctx.save(); ctx.translate(35, st.y); ctx.rotate(st.angle); drawLipsSprite(ctx, 0, 0, 2, false); ctx.restore();
    },
    pointer: function (x, y, type, st) {
      if (type !== 'down' || st.won || st.lost || st.kissAnim > 0) return;
      st.vy = -110;
    }
  },
  hug: {
    title: 'Попади в такт', hint: 'Тапай, когда стрелка в зелёной зоне. 3 раза.',
    init: function (st) { st.angle = 0; st.speed = 3.5; st.hits = 0; st.targetHits = 3; st.won = false; st.lost = false; st.cooldown = 0; MINIGAMES.hug._newZone(st); },
    _newZone: function (st) { var start = Math.random() * Math.PI * 2; st.zoneStart = start; st.zoneEnd = start + Math.PI / 3; },
    update: function (dt, st) {
      if (st.won || st.lost) return;
      st.angle += st.speed * dt; if (st.angle > Math.PI * 2) st.angle -= Math.PI * 2;
      st.cooldown = Math.max(0, st.cooldown - dt);
    },
    _inZone: function (st) {
      var a = st.angle % (Math.PI * 2), zs = st.zoneStart % (Math.PI * 2), ze = st.zoneEnd % (Math.PI * 2);
      return ze < zs ? (a >= zs || a <= ze) : (a >= zs && a <= ze);
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#e8f0ff');
      var cx = 80, cy = 100, R = 65;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, st.zoneStart, st.zoneEnd); ctx.closePath();
      ctx.fillStyle = '#88dd88'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = P.navy; ctx.stroke();
      var ex = cx + Math.cos(st.angle) * (R - 6), ey = cy + Math.sin(st.angle) * (R - 6);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.lineWidth = 5; ctx.strokeStyle = P.navy; ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fillStyle = P.red; ctx.fill();
      for (var i = 0; i < st.targetHits; i++) {
        var px = 60 + i * 20;
        r(ctx, px - 5, 176, 10, 10, i < st.hits ? P.green : '#c0c0d0');
      }
    },
    pointer: function (x, y, type, st, mg) {
      if (type !== 'down' || st.cooldown > 0) return;
      st.cooldown = 0.2;
      if (MINIGAMES.hug._inZone(st)) {
        st.hits++;
        if (st.hits >= st.targetHits) { st.won = true; mg.finish('win'); return; }
        MINIGAMES.hug._newZone(st); st.speed += 0.6;
      } else { st.lost = true; mg.finish('lose'); }
    }
  },
  dance: {
    title: 'В ритме танца', hint: 'Тапай по стрелкам в нижней зоне. 5 попаданий.',
    init: function (st) { st.arrows = []; st.spawnTimer = 0.4; st.spawnInterval = 1.1; st.hits = 0; st.targetHits = 5; st.zoneY = 155; st.zoneH = 35; st.won = false; st.lost = false; st.flash = 0; st.columnX = [20, 60, 100, 140]; },
    update: function (dt, st, mg) {
      if (st.won || st.lost) return;
      st.flash = Math.max(0, st.flash - dt * 4);
      st.spawnTimer -= dt;
      if (st.spawnTimer <= 0) {
        st.spawnTimer = st.spawnInterval;
        st.arrows.push({ x: st.columnX[Math.floor(Math.random() * 4)], y: -12, vy: 130, hit: false });
      }
      for (var i = 0; i < st.arrows.length; i++) {
        st.arrows[i].y += st.arrows[i].vy * dt;
        if (!st.arrows[i].hit && st.arrows[i].y > st.zoneY + st.zoneH + 20) { st.lost = true; mg.finish('lose'); return; }
      }
      st.arrows = st.arrows.filter(function (a) { return !a.hit && a.y < 220; });
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#1a0e2e');
      for (var i = 0; i < 4; i++) r(ctx, st.columnX[i] - 14, 0, 28, 200, 'rgba(77,107,254,0.08)');
      r(ctx, 0, st.zoneY, 160, st.zoneH, st.flash > 0 ? 'rgba(77,255,120,0.4)' : 'rgba(77,255,120,0.15)');
      r(ctx, 0, st.zoneY, 160, 2, 'rgba(77,255,120,0.7)');
      r(ctx, 0, st.zoneY + st.zoneH, 160, 2, 'rgba(77,255,120,0.7)');
      for (var j = 0; j < 4; j++) {
        var bx = st.columnX[j];
        r(ctx, bx - 6, st.zoneY + 12, 12, 4, '#4d6bfe'); r(ctx, bx - 4, st.zoneY + 16, 8, 4, '#4d6bfe'); r(ctx, bx - 2, st.zoneY + 20, 4, 4, '#4d6bfe');
      }
      for (var k = 0; k < st.arrows.length; k++) {
        var a = st.arrows[k];
        r(ctx, a.x - 7, a.y, 14, 4, P.yellow); r(ctx, a.x - 5, a.y + 4, 10, 4, P.yellow); r(ctx, a.x - 3, a.y + 8, 6, 4, P.yellow);
      }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(st.hits + ' / ' + st.targetHits, 80, 22);
    },
    pointer: function (x, y, type, st, mg) {
      if (type !== 'down' || st.won || st.lost) return;
      for (var i = 0; i < st.arrows.length; i++) {
        var a = st.arrows[i];
        if (a.hit) continue;
        if (Math.abs(x - a.x) < 25 && Math.abs(y - a.y) < 30 && a.y > st.zoneY - 15 && a.y < st.zoneY + st.zoneH + 15) {
          a.hit = true; st.hits++; st.flash = 1;
          if (st.hits >= st.targetHits) { st.won = true; mg.finish('win'); }
          return;
        }
      }
    }
  },
  hand: {
    title: 'Возьми за руку', hint: 'Коснись руки 3 раза. Она двигается.',
    init: function (st) { st.handX = 80; st.handY = 100; st.vx = 45; st.vy = 30; st.touches = 0; st.targetTouches = 3; st.timeLeft = 6; st.shake = 0; st.won = false; st.lost = false; },
    update: function (dt, st, mg) {
      if (st.won || st.lost) return;
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) { st.lost = true; mg.finish('lose'); return; }
      st.handX += st.vx * dt; st.handY += st.vy * dt;
      if (st.handX < 35) { st.handX = 35; st.vx = -st.vx; }
      if (st.handX > 125) { st.handX = 125; st.vx = -st.vx; }
      if (st.handY < 55) { st.handY = 55; st.vy = -st.vy; }
      if (st.handY > 130) { st.handY = 130; st.vy = -st.vy; }
      st.shake = Math.max(0, st.shake - dt * 4);
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#ffe8f0');
      for (var i = 0; i < 12; i++) r(ctx, (i * 37) % 160, (i * 23) % 200, 2, 2, '#ffd0e0');
      drawHandSprite(ctx, st.handX + (Math.random() - 0.5) * st.shake * 4, st.handY + (Math.random() - 0.5) * st.shake * 4, 3);
      for (var k = 0; k < st.targetTouches; k++) {
        ctx.beginPath(); ctx.arc(60 + k * 20, 180, 6, 0, Math.PI * 2);
        ctx.fillStyle = k < st.touches ? P.green : '#c0c0d0'; ctx.fill();
      }
      ctx.fillStyle = P.navy; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(st.timeLeft.toFixed(1) + 'с', 80, 22);
    },
    pointer: function (x, y, type, st, mg) {
      if (type !== 'down' || st.won || st.lost) return;
      var dx = x - st.handX, dy = y - st.handY;
      if (Math.sqrt(dx*dx + dy*dy) < 40) {
        st.touches++; st.shake = 1;
        st.vx *= 1.25; st.vy *= 1.25;
        st.handX = 45 + Math.random() * 70; st.handY = 65 + Math.random() * 65;
        if (st.touches >= st.targetTouches) { st.won = true; mg.finish('win'); }
      }
    }
  },
  compliment: {
    title: 'Подбери слова', hint: 'Тапни хороший комплимент за 4 секунды',
    init: function (st) {
      var good = ['Ты прекрасно\nвыглядишь','Твоя улыбка —\nлучшее','С тобой\nинтересно','Твои глаза\nкрасивы','Ты классно\nпахнешь','Мне хорошо\nс тобой'];
      var bad = ['Скучный вечер','У меня дела','Мне пора','Ты странный','Хочу домой','Мне скучно'];
      var g = good[Math.floor(Math.random() * good.length)];
      var shuffledBad = bad.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
      var opts = [{ text: g, good: true }].concat(shuffledBad.map(function (b) { return { text: b, good: false }; }));
      opts.sort(function () { return Math.random() - 0.5; });
      st.options = opts; st.timeLeft = 4; st.won = false; st.lost = false; st.tapped = -1;
    },
    update: function (dt, st, mg) {
      if (st.won || st.lost) return;
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) { st.lost = true; mg.finish('lose'); }
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#e8f0ff');
      ctx.fillStyle = P.navy; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(st.timeLeft.toFixed(1) + 'с', 80, 22);
      var positions = [[10, 40], [85, 40], [10, 110], [85, 110]];
      for (var i = 0; i < 4; i++) {
        var opt = st.options[i], pos = positions[i], tapped = st.tapped === i;
        var fill = opt.good ? (tapped ? P.green : '#d8f8d8') : (tapped ? P.red : '#f8d8d8');
        r(ctx, pos[0], pos[1], 65, 60, fill);
        r(ctx, pos[0], pos[1], 65, 2, opt.good ? P.green : P.red);
        ctx.fillStyle = P.navy; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        var lines = opt.text.split('\n');
        var lineY = pos[1] + 26 - (lines.length - 1) * 6;
        for (var l = 0; l < lines.length; l++) { ctx.fillText(lines[l], pos[0] + 32, lineY); lineY += 12; }
      }
    },
    pointer: function (x, y, type, st, mg) {
      if (type !== 'down' || st.won || st.lost) return;
      var positions = [[10, 40], [85, 40], [10, 110], [85, 110]];
      for (var i = 0; i < 4; i++) {
        var p = positions[i];
        if (x >= p[0] && x <= p[0] + 65 && y >= p[1] && y <= p[1] + 60) {
          st.tapped = i;
          if (st.options[i].good) { st.won = true; mg.finish('win'); }
          else { st.lost = true; mg.finish('lose'); }
          return;
        }
      }
    }
  },
  catch: {
    title: 'Поймай искру', hint: 'Тапни по искре 3 раза за 8 секунд',
    init: function (st) { st.x = 80; st.y = 100; st.vx = 90; st.vy = 70; st.r = 14; st.hits = 0; st.targetHits = 3; st.timeLeft = 8; st.won = false; st.lost = false; st.flash = 0; },
    update: function (dt, st, mg) {
      if (st.won || st.lost) return;
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) { st.lost = true; mg.finish('lose'); return; }
      st.x += st.vx * dt; st.y += st.vy * dt;
      if (st.x < st.r) { st.x = st.r; st.vx = Math.abs(st.vx); }
      if (st.x > 160 - st.r) { st.x = 160 - st.r; st.vx = -Math.abs(st.vx); }
      if (st.y < st.r) { st.y = st.r; st.vy = Math.abs(st.vy); }
      if (st.y > 200 - st.r) { st.y = 200 - st.r; st.vy = -Math.abs(st.vy); }
      st.flash = Math.max(0, st.flash - dt * 4);
    },
    render: function (ctx, st) {
      r(ctx, 0, 0, 160, 200, '#0e1024');
      for (var i = 0; i < 20; i++) { ctx.globalAlpha = 0.3 + 0.3 * Math.sin(i * 2.3); r(ctx, (i * 47) % 160, (i * 29) % 200, 1, 1, '#fff'); }
      ctx.globalAlpha = 1;
      var pulse = 1 + 0.2 * Math.sin(st.timeLeft * 10), rad = st.r * pulse;
      ctx.beginPath(); ctx.arc(st.x, st.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = st.flash > 0 ? P.white : P.yellow; ctx.fill();
      ctx.fillStyle = P.white; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Попаданий: ' + st.hits + '/' + st.targetHits, 6, 16);
      ctx.textAlign = 'right';
      ctx.fillText(st.timeLeft.toFixed(1) + 'с', 154, 16);
    },
    pointer: function (x, y, type, st, mg) {
      if (type !== 'down') return;
      var dx = x - st.x, dy = y - st.y;
      if (dx*dx + dy*dy <= (st.r + 8) * (st.r + 8)) {
        st.hits++; st.flash = 1;
        if (st.hits >= st.targetHits) { st.won = true; mg.finish('win'); return; }
        st.vx = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 60);
        st.vy = (Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 60);
        st.x = 40 + Math.random() * 80; st.y = 60 + Math.random() * 80;
      }
    }
  }
};

function detectMinigame(text) {
  var t = String(text).toLowerCase();
  if (/поцел|целу|чмок|kiss/.test(t)) return 'kiss';
  if (/обн|обня|прижм|прильн|hug/.test(t)) return 'hug';
  if (/танец|танц|вальс|dance|пляс|круж/.test(t)) return 'dance';
  if (/за руку|руку|ладон|пальц|коснут|поглад|touch/.test(t)) return 'hand';
  if (/комплимент|похвал|шепн|признан|compliment|ласков/.test(t)) return 'compliment';
  var pool = ['kiss', 'hug', 'dance', 'hand', 'compliment', 'catch'];
  return pool[hashStr(t) % pool.length];
}

function MiniGame(id, action, opts) {
  this.id = id; this.action = action; this.opts = opts || {};
  this.def = MINIGAMES[id] || MINIGAMES.catch;
  this.state = {}; this.result = null; this.t = 0;
  this.def.init(this.state);
}
MiniGame.prototype.update = function (dt) {
  if (this.result) return;
  this.t += dt; this.def.update(dt, this.state, this);
};
MiniGame.prototype.render = function (ctx) {
  ctx.clearRect(0, 0, 160, 200); ctx.imageSmoothingEnabled = false;
  this.def.render(ctx, this.state, this.t);
  if (this.result) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 160, 200);
    ctx.fillStyle = this.result === 'win' ? P.green : P.red;
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(this.result === 'win' ? 'УСПЕХ' : 'ПРОВАЛ', 80, 100);
  }
};
MiniGame.prototype.pointer = function (x, y, type) { if (!this.result) this.def.pointer(x, y, type, this.state, this); };
MiniGame.prototype.finish = function (res) { if (this.result) return; this.result = res; if (typeof this.onFinish === 'function') this.onFinish(res); };

/* ============================================================
   Приложение
   ============================================================ */
var S = { menu:'menu', join:'join', creator:'creator', lobby:'lobby', vote:'vote', play:'play', minigame:'minigame', over:'over', settings:'settings' };

var G = {
  state: S.menu, mode: 'idle', myRole: 'a',
  profile: defaultProfile(DEFAULT_NAME), peerProfile: null,
  location: 'cafe', mood: 50, chemistry: 50, turn: 'a',
  history: [], t: 0, thinking: false,
  talking: { a: 0, b: 0 }, transition: 0, pendingLocation: null,
  moodShown: 50, chemShown: 50, over: null,
  voteChoices: [], votes: { a: null, b: null }, voteTimer: null,
  ai: { apiKey: '', model: 'openrouter/free' },
  minigame: null, minigameCtx: null,
  myResult: null, peerResult: null,
  minigamesEnabled: true,
  locationState: {},
  video: { active: false, kind: null, src: null, el: null, wallStart: 0, videoStart: 0, playing: false, lastStateId: null, pendingFileSrc: null, pendingState: null },
  audioState: { active: false, wallStart: 0, videoStart: 0, playing: false },
  audioEl: null
};

var net = new NetCtor();
function $(id) { return document.getElementById(id); }
function safeOn(id, ev, fn) { var el = $(id); if (el) el[ev] = fn; }

var screens = {
  menu: $('scr-menu'), join: $('scr-join'), creator: $('scr-creator'),
  lobby: $('scr-lobby'), vote: $('scr-vote'), play: $('scr-play'),
  minigame: $('scr-minigame'), over: $('scr-over'), settings: $('scr-settings')
};

function go(state) {
  G.state = state;
  for (var k in screens) {
    var s = screens[k];
    if (!s) continue;
    s.classList.toggle('active', k === state);
    if (k !== state && s.scrollTop) s.scrollTop = 0;
  }
}
function toast(msg) {
  var el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
}

/* ---- Видео ---- */
function parseYouTubeId(url) {
  if (!url) return null;
  var s = String(url).trim();
  var m = s.match(/[?&]v=([A-Za-z0-9_-]{6,15})/);
  if (m) return m[1];
  m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,15})/);
  if (m) return m[1];
  m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,15})/);
  if (m) return m[1];
  m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,15})/);
  if (m) return m[1];
  return null;
}
function showCinemaOverlay() { var el = $('cinema-overlay'); if (el) { el.classList.add('active'); el.innerHTML = ''; } }
function hideCinemaOverlay() { var el = $('cinema-overlay'); if (el) { el.classList.remove('active'); el.innerHTML = ''; } }
function youtubeCmd(func, args) {
  if (!G.video.el || G.video.kind !== 'youtube') return;
  try { G.video.el.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), '*'); } catch (e) {}
}
function stopVideo(broadcast) {
  if (G.video.el) {
    try {
      if (G.video.kind === 'youtube') youtubeCmd('pauseVideo');
      else if (G.video.el.tagName === 'VIDEO') { G.video.el.pause(); G.video.el.src = ''; }
    } catch (e) {}
  }
  G.video = { active: false, kind: null, src: null, el: null, wallStart: 0, videoStart: 0, playing: false, lastStateId: null, pendingFileSrc: null, pendingState: null };
  hideCinemaOverlay();
  updateInteractiveBar();
  if (broadcast !== false && G.mode === 'host' && net.conn && net.conn.open) net.send({ t: 'video-stop' });
}
function startVideo(kind, src, opts, broadcast) {
  opts = opts || {};
  if (G.video.el) {
    try {
      if (G.video.kind === 'youtube') youtubeCmd('pauseVideo');
      else if (G.video.el.tagName === 'VIDEO') { G.video.el.pause(); G.video.el.src = ''; }
    } catch (e) {}
  }
  showCinemaOverlay();
  var overlay = $('cinema-overlay'); if (!overlay) return;
  var wallStart = opts.wallStart || Date.now();
  var videoStart = opts.videoStart || 0;
  var el;
  if (kind === 'youtube') {
    var id = parseYouTubeId(src) || src;
    var expected = videoStart;
    if (opts.wallStart) expected += (Date.now() - opts.wallStart) / 1000;
    el = document.createElement('iframe');
    el.src = 'https://www.youtube.com/embed/' + id + '?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&playsinline=1&start=' + Math.max(0, Math.floor(expected));
    el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    el.allowFullscreen = true;
    el.setAttribute('frameborder', '0');
    overlay.appendChild(el);
    G.video = { active: true, kind: 'youtube', src: id, el: el, wallStart: wallStart, videoStart: videoStart, playing: true, lastStateId: null, pendingFileSrc: null, pendingState: null };
  } else {
    el = document.createElement('video');
    el.src = src;
    el.controls = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.playsInline = true;
    overlay.appendChild(el);
    var startT = videoStart;
    if (opts.wallStart) startT += (Date.now() - opts.wallStart) / 1000;
    el.addEventListener('loadedmetadata', function () {
      try { if (startT > 0.5 && (!el.duration || startT < el.duration - 1)) el.currentTime = startT; } catch (e) {}
      el.play().catch(function () { el.muted = true; el.play().catch(function(){}); });
    });
    el.addEventListener('play', function () {
      G.video.wallStart = Date.now(); G.video.videoStart = el.currentTime; G.video.playing = true;
      if (G.mode === 'host' && net.conn && net.conn.open) sendVideoState();
    });
    el.addEventListener('pause', function () {
      if (G.video.active) {
        G.video.playing = false;
        if (G.mode === 'host' && net.conn && net.conn.open) net.send({ t: 'video-pause', time: el.currentTime });
      }
    });
    el.addEventListener('seeked', function () {
      G.video.wallStart = Date.now(); G.video.videoStart = el.currentTime;
      if (G.mode === 'host' && net.conn && net.conn.open) sendVideoState();
    });
    G.video = { active: true, kind: kind, src: src, el: el, wallStart: wallStart, videoStart: videoStart, playing: true, lastStateId: null, pendingFileSrc: null, pendingState: null };
  }
  updateInteractiveBar();
  if (broadcast !== false && G.mode === 'host' && net.conn && net.conn.open) sendVideoState();
}
function sendVideoState() {
  if (G.mode !== 'host' || !net.conn || !net.conn.open || !G.video.active) return;
  net.send({ t: 'video-state', kind: G.video.kind, src: G.video.kind === 'file' ? null : G.video.src,
    wallStart: G.video.wallStart, videoStart: G.video.videoStart, playing: G.video.playing });
}
function applyVideoState(msg) {
  if (!msg || !msg.kind) { stopVideo(false); return; }
  if (msg.kind === 'file') {
    if (G.video.pendingFileSrc) {
      var src = G.video.pendingFileSrc; G.video.pendingFileSrc = null;
      startVideo('file', src, { wallStart: msg.wallStart, videoStart: msg.videoStart }, false);
    } else { G.video.pendingState = msg; toast('Ждём загрузку видео…'); }
    return;
  }
  if (G.video.active && G.video.kind === msg.kind && G.video.src === msg.src) { correctDrift(msg); return; }
  startVideo(msg.kind, msg.src, { wallStart: msg.wallStart, videoStart: msg.videoStart }, false);
}
function correctDrift(msg) {
  if (!G.video.el) return;
  var stateId = msg.wallStart + '|' + (msg.playing ? '1' : '0') + '|' + (msg.videoStart || 0);
  var isNewState = G.video.lastStateId !== stateId;
  G.video.lastStateId = stateId;
  if (msg.playing === false) {
    if (G.video.kind !== 'youtube') { try { G.video.el.pause(); G.video.el.currentTime = msg.videoStart || 0; } catch (e) {} }
    else youtubeCmd('pauseVideo');
    return;
  }
  var expected = (msg.videoStart || 0);
  if (msg.wallStart) expected += (Date.now() - msg.wallStart) / 1000;
  if (G.video.kind !== 'youtube') {
    var ct = 0;
    try { ct = G.video.el.currentTime || 0; } catch (e) {}
    if (Math.abs(ct - expected) > 2.0) { try { G.video.el.currentTime = expected; } catch (e) {} }
    if (G.video.el.paused) G.video.el.play().catch(function () { G.video.el.muted = true; G.video.el.play().catch(function(){}); });
  } else {
    if (isNewState) { youtubeCmd('seekTo', [expected, true]); youtubeCmd('playVideo'); }
  }
}
function stopAudio(broadcast) {
  if (G.audioEl) {
    try { G.audioEl.pause(); G.audioEl.src = ''; } catch (e) {}
    G.audioEl.classList.remove('active');
  }
  G.audioState = { active: false, wallStart: 0, videoStart: 0, playing: false };
  updateInteractiveBar();
  if (broadcast !== false && G.mode === 'host' && net.conn && net.conn.open) net.send({ t: 'audio-stop' });
}
function startAudio(src, opts, broadcast) {
  opts = opts || {};
  G.audioEl = G.audioEl || $('club-player');
  if (!G.audioEl) return;
  G.audioEl.src = src;
  G.audioEl.classList.add('active');
  var startT = opts.videoStart || 0;
  if (opts.wallStart) startT += (Date.now() - opts.wallStart) / 1000;
  G.audioEl.addEventListener('loadedmetadata', function () {
    try { if (startT > 0.5 && (!G.audioEl.duration || startT < G.audioEl.duration - 1)) G.audioEl.currentTime = startT; } catch (e) {}
    G.audioEl.play().catch(function () {});
  }, { once: true });
  G.audioState = { active: true, wallStart: opts.wallStart || Date.now(), videoStart: opts.videoStart || 0, playing: true };
  updateInteractiveBar();
  if (broadcast !== false && G.mode === 'host' && net.conn && net.conn.open) {
    net.send({ t: 'audio-state', wallStart: G.audioState.wallStart, videoStart: G.audioState.videoStart, playing: true });
  }
}
function applyAudioState(msg) {
  if (!msg.active) { stopAudio(false); return; }
  var expected = (msg.videoStart || 0);
  if (msg.wallStart) expected += (Date.now() - msg.wallStart) / 1000;
  if (G.audioState.active && G.audioEl) {
    if (Math.abs((G.audioEl.currentTime || 0) - expected) > 2.0) { try { G.audioEl.currentTime = expected; } catch (e) {} }
    if (G.audioEl.paused) G.audioEl.play().catch(function(){});
  }
}

setInterval(function () {
  if (G.mode !== 'host' || !net.conn || !net.conn.open) return;
  if (G.video.active && G.video.playing) sendVideoState();
  if (G.audioState.active && G.audioEl && !G.audioEl.paused) {
    net.send({ t: 'audio-state', wallStart: G.audioState.wallStart, videoStart: G.audioState.videoStart, playing: true });
  }
}, 4000);

var FILE_CHUNK = 16384;
var FILE_MAX = 50 * 1024 * 1024;
var incoming = null;
function transferFile(file, type, onDone) {
  var total = Math.ceil(file.size / FILE_CHUNK);
  net.send({ t: 'file-start', name: file.name, type: type, size: file.size, total: total });
  var idx = 0;
  function sendNext() {
    if (idx >= total) { net.send({ t: 'file-end' }); if (typeof onDone === 'function') onDone(); return; }
    var slice = file.slice(idx * FILE_CHUNK, (idx + 1) * FILE_CHUNK);
    var reader = new FileReader();
    reader.onload = function () {
      var bytes = new Uint8Array(reader.result);
      net.send({ t: 'file-chunk', idx: idx, data: Array.prototype.slice.call(bytes) });
      idx++;
      setTimeout(sendNext, 0);
    };
    reader.readAsArrayBuffer(slice);
  }
  sendNext();
  toast('Передаю файл…');
}
function handleVideoFile(file) {
  if (file.size > FILE_MAX) { toast('Файл больше 50 МБ'); return; }
  var type = file.type || 'video/mp4';
  var blobUrl = URL.createObjectURL(file);
  startVideo('file', blobUrl, {}, false);
  G.video.wallStart = Date.now(); G.video.videoStart = 0;
  if (G.mode === 'host' && net.conn && net.conn.open) {
    transferFile(file, type, function () {
      net.send({ t: 'video-state', kind: 'file', src: null, wallStart: G.video.wallStart, videoStart: G.video.videoStart, playing: true });
    });
  }
}
function handleAudioFile(file) {
  if (file.size > FILE_MAX) { toast('Файл больше 50 МБ'); return; }
  var type = file.type || 'audio/mpeg';
  var blobUrl = URL.createObjectURL(file);
  startAudio(blobUrl, {}, false);
  G.audioState.wallStart = Date.now(); G.audioState.videoStart = 
