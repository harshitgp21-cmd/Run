const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

function load(file, url) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => console.log('  [jsdom error]', e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, file), 'utf8'), {
    url: url || ('http://localhost/' + file),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  dom.window.matchMedia = dom.window.matchMedia || function (q) {
    return { matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
  };
  dom.window.eval(js);
  return dom;
}

/* ---------- 1. shared chrome on every page ---------- */
for (const f of ['index.html','services.html','projects.html','contact.html','404.html']) {
  console.log('\n== ' + f + ' ==');
  const dom = load(f);
  const w = dom.window, d = w.document;

  check('theme set on <html>', ['light','dark'].includes(d.documentElement.getAttribute('data-theme')));
  check('footer year injected', d.querySelector('#year').textContent === String(new Date().getFullYear()), d.querySelector('#year').textContent);

  const toggle = d.querySelector('#themeToggle');
  const before = d.documentElement.getAttribute('data-theme');
  toggle.click();
  const after = d.documentElement.getAttribute('data-theme');
  check('theme toggle flips', before !== after, before + ' -> ' + after);
  check('theme persisted', w.localStorage.getItem('theme') === after, w.localStorage.getItem('theme'));
  check('toggle aria-label updated', /mode/i.test(toggle.getAttribute('aria-label')), toggle.getAttribute('aria-label'));

  const nt = d.querySelector('#navToggle'), nav = d.querySelector('#nav');
  nt.click();
  check('mobile nav opens', nav.classList.contains('is-open') && nt.getAttribute('aria-expanded') === 'true');
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
  check('Escape closes nav', !nav.classList.contains('is-open') && nt.getAttribute('aria-expanded') === 'false');

  const current = d.querySelectorAll('.nav__link[aria-current="page"]');
  const expectedActive = f === '404.html' ? 0 : 1;
  check('active nav link count == ' + expectedActive, current.length === expectedActive, String(current.length));

  const reveals = d.querySelectorAll('[data-reveal]');
  check('reveal elements present', reveals.length > 0, String(reveals.length));
  check('reveal fallback applied (no IntersectionObserver)',
    Array.from(reveals).every(el => el.classList.contains('is-in')));

  const counters = d.querySelectorAll('[data-count]');
  if (counters.length) {
    check('counters show final values',
      Array.from(counters).every(el => el.textContent.startsWith(el.getAttribute('data-count'))),
      Array.from(counters).map(e => e.textContent).join(','));
  }
  dom.window.close();
}

/* ---------- 2. project filtering ---------- */
console.log('\n== projects.html filtering ==');
{
  const dom = load('projects.html');
  const d = dom.window.document;
  const visible = () => Array.from(d.querySelectorAll('[data-category]')).filter(c => !c.classList.contains('is-hidden'));
  const count = () => d.querySelector('#projectCount').textContent;

  check('all 6 shown initially', visible().length === 6, String(visible().length));
  check('count label initial', count() === '6 projects', count());

  const clickFilter = (f) => d.querySelector(`.filter[data-filter="${f}"]`).click();

  clickFilter('performance');
  check('performance filter narrows list', visible().length === 3, String(visible().length));
  check('count updates', count() === '3 projects', count());
  check('aria-pressed moved', d.querySelector('.filter[data-filter="performance"]').getAttribute('aria-pressed') === 'true'
        && d.querySelector('.filter[data-filter="all"]').getAttribute('aria-pressed') === 'false');
  check('every visible card matches filter',
    visible().every(c => c.getAttribute('data-category').split(/\s+/).includes('performance')));

  clickFilter('ecommerce');
  check('ecommerce filter', visible().length === 1 && count() === '1 project', visible().length + ' / ' + count());

  clickFilter('fullstack');
  check('fullstack filter', visible().length === 4, String(visible().length));

  clickFilter('all');
  check('reset shows all', visible().length === 6 && count() === '6 projects', visible().length + ' / ' + count());
  dom.window.close();
}

/* ---------- 3. contact form ---------- */
console.log('\n== contact.html form ==');
{
  const dom = load('contact.html');
  const w = dom.window, d = w.document;
  const form = d.querySelector('form[data-validate]');
  const status = d.querySelector('.form__status');
  const fieldOf = id => d.querySelector('#' + id).closest('.field');
  const submit = () => form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));

  check('status hidden initially', !status.classList.contains('is-visible'));

  submit();
  check('empty submit blocked', !status.classList.contains('is-visible'));
  check('name flagged', fieldOf('name').classList.contains('has-error'));
  check('email flagged', fieldOf('email').classList.contains('has-error'));
  check('message flagged', fieldOf('message').classList.contains('has-error'));
  check('consent flagged', fieldOf('consent').classList.contains('has-error'));
  check('aria-invalid set', d.querySelector('#name').getAttribute('aria-invalid') === 'true');

  d.querySelector('#name').value = 'Jane Cooper';
  d.querySelector('#email').value = 'not-an-email';
  d.querySelector('#message').value = 'We need a new marketing site with a CMS, launching in Q4.';
  d.querySelector('#consent').checked = true;
  submit();
  check('bad email still blocked', !status.classList.contains('is-visible'));
  check('only email flagged', fieldOf('email').classList.contains('has-error') && !fieldOf('name').classList.contains('has-error'));

  d.querySelector('#email').value = 'jane@company.com';
  d.querySelector('#message').value = 'too short';
  submit();
  check('short message blocked (minlength)', !status.classList.contains('is-visible') && fieldOf('message').classList.contains('has-error'));

  d.querySelector('#message').value = 'We need a new marketing site with a CMS, launching in Q4.';
  submit();
  check('submit button enters pending state', d.querySelector('[type="submit"]').disabled === true);

  return new Promise(res => setTimeout(() => {
    check('success message shown', status.classList.contains('is-visible'));
    check('form reset', d.querySelector('#name').value === '');
    check('submit button restored', d.querySelector('[type="submit"]').disabled === false);
    dom.window.close();
    /* deep link: ?service=care should preselect the dropdown */
    {
      const dl = load('contact.html', 'http://localhost/contact.html?service=care');
      const sel = dl.window.document.querySelector('#service');
      check('?service=care preselects dropdown', sel.value === 'care', sel.value);
      const bad = load('contact.html', 'http://localhost/contact.html?service=nope');
      check('unknown service value ignored', bad.window.document.querySelector('#service').value === '', bad.window.document.querySelector('#service').value);
      dl.window.close(); bad.window.close();
    }

    console.log('\n' + pass + ' passed, ' + fail + ' failed');
    process.exit(fail ? 1 : 0);
  }, 1100));
}
