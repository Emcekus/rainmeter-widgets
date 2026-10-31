// Rasterizes the "Katana Desktop" widgets (clock, cpu, mem, battery, text) into cell maps,
// using the same draw code, hash and wear rule as the design.
// Usage: node rasterize.js <out.json> [wear=0.12]
//
// A piece is { x, y, w, h, cells } in widget design-pixel coordinates. cells is a string, one
// char per design pixel: '0' off, '1'-'5' bright palette, '6'-'8' dim palette.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = process.argv[2] || 'cells.json';
  const wear = parseFloat(process.argv[3] ?? '0.12');
  const font = fs.readFileSync(path.join(__dirname, 'fonts', 'ReggaeOne-latin.woff2')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<style>@font-face{font-family:'Reggae One';src:url(data:font/woff2;base64,${font})}</style>`);
  await page.evaluate(() => document.fonts.load("400 40px 'Reggae One'", 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%.:'));

  const data = await page.evaluate((wear) => {
    // ---- from the design -------------------------------------------------------------
    const F = "'Reggae One', sans-serif";
    const B = '#ffffff', D = '#808080';
    const NPAL = 5, NPAL_D = 3;
    const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    function T(o, s, x, y, size, align, col) { o.font = `${size}px ${F}`; o.textAlign = align || 'left'; o.fillStyle = col || B; o.fillText(s, x, y); return o.measureText(s).width; }
    function lab(o, s, x, align) { return T(o, s, x ?? 1, 14, 14, align); }
    function R(o, x, y, w, h, c) { o.fillStyle = c || B; o.fillRect(x, y, w, h); }
    // ----------------------------------------------------------------------------------

    const PAD = 3; // empty design pixels left of a glyph's origin in glyph images
    const mctx = document.createElement('canvas').getContext('2d');
    const measure = (s, size) => { mctx.font = `${size}px ${F}`; return mctx.measureText(s).width; };

    // Draw with fn on a cols x rows canvas, apply the design's cell rule, return region.
    function render(cols, rows, seed, fn, region) {
      const c = document.createElement('canvas'); c.width = cols; c.height = rows;
      const o = c.getContext('2d'); o.textBaseline = 'alphabetic';
      fn(o);
      const a = o.getImageData(0, 0, cols, rows).data;
      const [rx, ry, rw, rh] = region || [0, 0, cols, rows];
      let s = '';
      for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) { s += '0'; continue; }
        const i = (y * cols + x) * 4, al = a[i + 3] / 255, r = a[i], b = a[i + 2], rnd = hash(x, y, seed);
        let pal = 0; // 0 none, 1 bright, 2 dim
        if (al > 0.5) { const nowear = b < 128; if (nowear || rnd > wear) pal = r > 200 ? 1 : 2; }
        else if (al > 0.12 && r > 200 && b >= 128 && rnd < 0.3) pal = 1;
        if (!pal) { s += '0'; continue; }
        const n = pal === 1 ? NPAL : NPAL_D;
        s += String((pal === 1 ? 1 : 6) + Math.floor(hash(y, x, 3) * n));
      }
      return { x: rx, y: ry, w: rw, h: rh, cells: s };
    }

    // A glyph set: one piece per character code, drawn with its origin at x=PAD.
    function glyphs(chars, size, baseline, rows, seed) {
      const g = {}, adv = {}, kern = {};
      for (const ch of chars) {
        const code = ch.charCodeAt(0);
        adv[code] = measure(ch, size);
        if (ch !== ' ') g[code] = render(48, rows, seed, o => T(o, ch, PAD, baseline, size), [0, 0, 48, rows]);
      }
      for (const a of chars) for (const b of chars) {
        const k = measure(a + b, size) - adv[a.charCodeAt(0)] - adv[b.charCodeAt(0)];
        if (Math.abs(k) >= 0.25) kern[a.charCodeAt(0) * 256 + b.charCodeAt(0)] = +k.toFixed(3);
      }
      return { pad: PAD, glyphs: g, adv, kern };
    }

    const out = {};

    // ---- Clock (220 x 82), 24h + date
    {
      const seed = 101, c = { time: {}, weekday: {}, day: {}, month: {} };
      for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m++) {
        const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        c.time[t.replace(':', '')] = render(220, 82, seed, o => T(o, t, 2, 54, 52), [0, 0, 220, 58]);
      }
      const part = s => Object.assign(render(80, 82, seed, o => T(o, s, PAD, 80, 21), [0, 56, 80, 26]), { adv: measure(s, 21) });
      DAYS.forEach((d, i) => c.weekday[i] = part(d));
      for (let d = 1; d <= 31; d++) c.day[String(d).padStart(2, '0')] = part(String(d).padStart(2, '0'));
      MONTHS.forEach((m, i) => c.month[String(i + 1).padStart(2, '0')] = part(m));
      c.meta = { pad: PAD, space: measure(' ', 21), dateX: 3 };
      out.clock = c;
    }

    // ---- CPU (112 x 72)
    {
      const seed = 202, c = { bar: {} };
      c.static = render(112, 72, seed, o => lab(o, 'CPU'));
      for (let i = 0; i < 18; i++) for (let h = 1; h <= 18; h++)
        c.bar[`${i}_${h}`] = render(112, 72, seed, o => { R(o, i * 6 + 1, 52, 4, 18, D); R(o, i * 6 + 1, 70 - h, 4, h, B); }, [i * 6 + 1, 52, 4, 18]);
      c.big = glyphs('0123456789%', 30, 46, 72, seed + 1);
      out.cpu = c;
    }

    // ---- Memory (112 x 72)
    {
      const seed = 303, c = { seg: {} };
      c.static = render(112, 72, seed, o => lab(o, 'MEM'));
      c.big = glyphs('0123456789.', 30, 46, 72, seed + 1);
      c.unit = glyphs('GB', 14, 46, 72, seed + 2);
      for (let i = 0; i < 12; i++) for (const on of [0, 1])
        c.seg[`${i}_${on}`] = render(112, 72, seed, o => R(o, 1 + i * 9, 58, 7, 10, on ? B : D), [1 + i * 9, 58, 7, 10]);
      out.mem = c;
    }

    // ---- Battery (96 x 72)
    {
      const seed = 404, c = { gauge: {} };
      c.static = render(96, 72, seed, o => lab(o, 'BAT'));
      c.chg = render(96, 72, seed, o => lab(o, 'CHG', 95, 'right'));
      c.big = glyphs('0123456789%', 30, 46, 72, seed + 1);
      for (let fw = 0; fw <= 78; fw++)
        c.gauge[fw] = render(96, 72, seed, o => {
          o.strokeStyle = B; o.lineWidth = 2; o.strokeRect(2, 55, 84, 14);
          R(o, 87, 59, 4, 6); R(o, 5, 58, 78, 8, D); R(o, 5, 58, fw, 8, B);
        }, [0, 53, 96, 19]);
      out.bat = c;
    }

    // ---- Text (variable width x 30), printable ASCII
    {
      let chars = ''; for (let k = 32; k <= 126; k++) chars += String.fromCharCode(k);
      out.text = { g: glyphs(chars, 22, 24, 30, 505) };
    }

    out.meta = { wear };
    return out;
  }, wear);

  fs.writeFileSync(out, JSON.stringify(data));
  await browser.close();
  console.log('wrote', out);
})();
