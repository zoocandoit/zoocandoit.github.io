// Run with Playwright installed, or set PLAYWRIGHT_MODULE to its absolute path.
const assert = require('node:assert/strict');
const { readFile, readdir, mkdir } = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    const data = await readFile(file);
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});



(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.route('**/*', route=>route.request().url().startsWith(base)?route.continue():route.abort());
    const docs=['/', '/security/', '/conductor/', ...(await readdir(path.join(root,'security/career'))).filter(f=>f.endsWith('.html')).map(f=>'/security/career/'+f)];
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:900});
      for (const doc of docs) {
        await page.goto(base+doc);
        const targets=await page.locator('[data-nav-link]').evaluateAll(es=>es.map(e=>e.dataset.target));
        for (const target of targets.length?targets:[null]) {
          if (target) {
            await page.locator(`[data-target="${target}"]`).click();
            assert.equal(await page.locator('[data-page]:not([hidden])').getAttribute('id'),target);
            assert.equal(await page.locator('.skip-link').getAttribute('href'),'#'+target);
            assert(await page.locator('.navbar-list').evaluate(list=>{
              const tab=list.querySelector('.active');
              return Math.abs(parseFloat(list.style.getPropertyValue('--tab-left'))-tab.offsetLeft)<1 && Math.abs(parseFloat(list.style.getPropertyValue('--tab-width'))-tab.offsetWidth)<1;
            }), 'Indicator alignment');
          }
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Overflow '+doc+' '+target+' '+width);
          assert(await page.locator('.navbar-link').evaluateAll(es=>es.every(e=>e.offsetHeight>=44&&e.offsetHeight<=48)), 'Navigation size');
          if (process.env.SCREENSHOT_DIR&&[390,1440].includes(width)) {
            await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
            await page.mouse.move(0,0);
            await page.evaluate(async()=>{
              await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().duration!==Infinity && a.timeline instanceof DocumentTimeline).map(a=>a.finished.catch(()=>{})));
              window.scrollTo(0,0);
            });
            await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,doc.replaceAll('/','_')+(target||'page')+'-'+width+'.png'),fullPage:true});
          }
        }
      }
    }
    await page.goto(base+'/security/');
    await page.locator('[data-target="resume"]').click();
    await page.locator('[data-target="publications"]').click();
    await page.goBack();
    assert.equal(await page.locator('[data-page]:not([hidden])').getAttribute('id'),'resume');
    await page.locator('[data-target="resume"]').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('[data-page]:not([hidden])').getAttribute('id'),'news');
    assert(await page.locator('#news').evaluate(e=>e.getAnimations().length>0), 'Tab transition starts');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('[data-target="about"]').click();
    assert.equal(await page.locator('#about').evaluate(e=>e.getAnimations().length),0);
    assert.equal(await page.locator('.navbar-list').evaluate(e=>getComputedStyle(e,'::after').transitionDuration),'0s');
    await page.goto(base+'/conductor/#repository');
    const videos=page.locator('.video-record');
    assert.equal(await videos.count(),9);
    await videos.nth(0).locator('summary').click();
    await videos.nth(0).locator('.video-card-detail').waitFor({state:'visible'});
    assert(await videos.nth(0).locator('.video-card-detail').isVisible());
    assert.equal(await videos.nth(0).evaluate(e=>getComputedStyle(e,'::details-content').transitionDuration),'0s');
    await videos.nth(1).locator('summary').click();
    assert.equal(await page.locator('.video-record[open]').count(),1);
    assert.equal(await page.locator('.conductor-intro p').count(),6);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await videos.nth(2).locator('summary').click();
    await videos.nth(2).locator('.video-card-detail').waitFor({state:'visible'});
    await videos.nth(1).locator('.video-card-detail').waitFor({state:'hidden'});
    const nojs=await browser.newPage({javaScriptEnabled:false});
    await nojs.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    for (const profile of ['security','conductor']) {
      await nojs.goto(base+'/'+profile+'/');
      for (const article of await nojs.locator('[data-page]').all()) assert(await article.isVisible());
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: 8 documents, 4 widths, tabs, indicator alignment, history, keyboard, reduced motion, native accordions and no-JS content.');
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1});
