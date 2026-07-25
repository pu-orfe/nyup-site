/**
 * @file
 * Regression tests for the CodeQL-reported XSS issues in the site's JS.
 *
 * Each test feeds a script payload through the DOM text or data attribute that
 * the reported code path reads, then asserts the payload is treated as inert
 * text rather than markup.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironment, SITE_ORIGIN } from './helpers/drupal-env.mjs';

const PAYLOAD = '<img src=x onerror="window.__xss = true">Jan 1, 2026';

const CONTENT_LIST_BEHAVIOR =
  'profiles/ps/modules/custom/ps_core/js/content_list_a11y_enhancer_temjpl.js';
const ENHANCED_DATE_BEHAVIOR =
  'profiles/ps/modules/custom/enhanced_date/js/enhanced_date_field_formatter_temjpl.js';
const RANDOM_IMAGE_BEHAVIOR =
  'profiles/ps/modules/custom/ps_core/js/random-image_temjpl.js';
const POSITION_PLUGIN = 'core/misc/position.js';

test('content list date badge text is not reinterpreted as HTML', async () => {
  const env = createEnvironment(`
    <div class="content-list">
      <h2 class="content-list-title">News</h2>
      <div class="content-list-item">
        <div class="field--name-title"><a href="/news/one">Item one</a></div>
        <div class="content-list-item-date-badge" data-prepend="true"></div>
      </div>
    </div>
  `);
  await env.load(CONTENT_LIST_BEHAVIOR);

  // The badge text is DOM text, so set it after parsing rather than inlining
  // it in the fixture markup.
  env.document.querySelector('.content-list-item-date-badge').textContent =
    PAYLOAD;

  env.Drupal.behaviors.content_list_a11y_enhancer.attach(env.document, {});

  const label = env.document.querySelector('.field--name-title .sr-only');
  assert.ok(label, 'a screen-reader label is prepended to the title');
  assert.equal(label.textContent, `${PAYLOAD}: `);
  assert.equal(label.children.length, 0, 'the label holds text only');
  assert.equal(env.document.querySelectorAll('img').length, 0);
  assert.equal(env.window.__xss, undefined);
});

test('add to calendar label is not reinterpreted as HTML', async () => {
  const futureStart = Math.floor(Date.now() / 1000) + 86400 * 30;
  const env = createEnvironment(`
    <div class="field--type-daterange-enhanced">
      <div class="field__item"
           data-start-timestamp="${futureStart}"
           data-add-to-calendar-url-google="https://calendar.google.com/event?a=1"
           data-add-to-calendar-url-outlook="https://outlook.office.com/event?a=1"></div>
      <div class="field__item"
           data-start-timestamp="${futureStart + 86400}"
           data-add-to-calendar-url-google="https://calendar.google.com/event?a=2"
           data-add-to-calendar-url-outlook="https://outlook.office.com/event?a=2"></div>
    </div>
  `);
  await env.load(ENHANCED_DATE_BEHAVIOR);

  // More than one future date makes the behavior append the date text — the
  // tainted value — to the link label.
  env.document.querySelectorAll('.field__item').forEach((item) => {
    item.textContent = PAYLOAD;
  });

  env.Drupal.behaviors.enhanced_date_field_formatter.attach(env.document, {
    enhanced_date: { add_to_calendar_links: true },
  });

  const links = env.document.querySelectorAll('a.add-to-calendar');
  assert.equal(links.length, 2, 'each future date gets a calendar link');

  links.forEach((link) => {
    const label = link.querySelector('.visually-hidden');
    assert.equal(label.textContent, `Add to calendar: ${PAYLOAD}`);
    assert.equal(label.children.length, 0, 'the label holds text only');
    // The static part of the link markup must survive the change.
    const icon = link.querySelector('.add-to-calendar-icon');
    assert.equal(icon.getAttribute('title'), 'Add to calendar');
    assert.equal(icon.textContent, '\u{1F4C5}');
  });

  assert.equal(env.document.querySelectorAll('img').length, 0);
  assert.equal(env.window.__xss, undefined);
});

test('add to calendar dialog still exposes the configured URLs', async () => {
  const futureStart = Math.floor(Date.now() / 1000) + 86400 * 30;
  const env = createEnvironment(`
    <div class="field--type-daterange-enhanced">
      <div class="field__item"
           data-start-timestamp="${futureStart}"
           data-add-to-calendar-url-google="https://calendar.google.com/event?a=1"
           data-add-to-calendar-url-outlook="https://outlook.office.com/event?a=1">Jan 1</div>
    </div>
  `);
  await env.load(ENHANCED_DATE_BEHAVIOR);
  env.Drupal.behaviors.enhanced_date_field_formatter.attach(env.document, {
    enhanced_date: { add_to_calendar_links: true },
  });

  const link = env.document.querySelector('a.add-to-calendar');
  assert.equal(
    link.querySelector('.visually-hidden').textContent,
    'Add to calendar',
    'a single date omits the date text from the label',
  );

  env.$(link).trigger('click');
  assert.equal(env.Drupal.dialogs.length, 1, 'the chooser dialog is opened');
  assert.ok(env.Drupal.dialogs[0].shown);
  const hrefs = Array.from(
    env.document.querySelectorAll('#add-to-calendar-dialog a'),
  ).map((anchor) => anchor.getAttribute('href'));
  assert.deepEqual(hrefs, [
    'https://calendar.google.com/event?a=1',
    'https://outlook.office.com/event?a=1',
  ]);
});

/**
 * Runs the random image behavior over a single figure.
 *
 * @param {object} dataAttributes
 *   The data-src and/or data-srcset attributes to place on the image.
 *
 * @return {Promise<object>}
 *   The resolved image element and its environment.
 */
async function attachRandomImage(dataAttributes) {
  const attributes = Object.entries(dataAttributes)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ');
  // A single figure makes the "random" choice deterministic.
  const env = createEnvironment(`
    <div class="block-ps-image">
      <figure class="random-image invisible" aria-hidden="true" tabindex="-1">
        <img alt="" ${attributes}>
      </figure>
    </div>
  `);
  await env.load(RANDOM_IMAGE_BEHAVIOR);
  env.Drupal.behaviors.random_image.attach(env.document, {});
  return { env, image: env.document.querySelector('img') };
}

test('random image reveals the figure and copies safe URLs', async () => {
  const { env, image } = await attachRandomImage({
    'data-src': '/sites/default/files/photo.jpg',
    'data-srcset': '/sites/default/files/photo.jpg 1x, /files/photo2x.jpg 2x',
  });

  const figure = env.document.querySelector('figure.random-image');
  assert.equal(figure.classList.contains('invisible'), false);
  assert.equal(figure.hasAttribute('aria-hidden'), false);
  assert.equal(figure.hasAttribute('tabindex'), false);
  // src carries the resolved absolute URL: only a value that parsed as http(s)
  // is ever assigned, and the parsed result is what gets written.
  assert.equal(
    image.getAttribute('src'),
    `${SITE_ORIGIN}sites/default/files/photo.jpg`,
  );
  // srcset keeps its original relative candidates, since rewriting a whole
  // candidate list would change which image the browser picks.
  assert.equal(
    image.getAttribute('srcset'),
    '/sites/default/files/photo.jpg 1x, /files/photo2x.jpg 2x',
  );
});

test('random image accepts absolute http(s) URLs', async () => {
  const { image } = await attachRandomImage({
    'data-src': 'https://example.com/photo.jpg',
  });
  assert.equal(image.getAttribute('src'), 'https://example.com/photo.jpg');
});

test('random image accepts a document-relative path', async () => {
  const { image } = await attachRandomImage({ 'data-src': 'photo.jpg' });
  assert.equal(image.getAttribute('src'), `${SITE_ORIGIN}photo.jpg`);
});

test('random image accepts a protocol-relative URL and a port', async () => {
  const protocolRelative = await attachRandomImage({
    'data-src': '//cdn.example.com/photo.jpg',
  });
  assert.equal(
    protocolRelative.image.getAttribute('src'),
    'https://cdn.example.com/photo.jpg',
  );

  const withPort = await attachRandomImage({
    'data-src': 'https://cdn.example.com:8443/photo.jpg',
  });
  assert.equal(
    withPort.image.getAttribute('src'),
    'https://cdn.example.com:8443/photo.jpg',
  );
});

const REJECTED_URLS = [
  ['a javascript: URL', 'javascript:window.__xss = true'],
  ['an upper case JavaScript: URL', 'JaVaScRiPt:window.__xss = true'],
  ['a leading-whitespace javascript: URL', ' javascript:window.__xss = true'],
  ['a tab-obfuscated javascript: URL', 'java\tscript:window.__xss = true'],
  ['a newline-obfuscated javascript: URL', 'java\nscript:window.__xss = true'],
  ['a vbscript: URL', 'vbscript:MsgBox 1'],
  ['a data: URL', 'data:text/html;base64,PHNjcmlwdD48L3NjcmlwdD4='],
];

REJECTED_URLS.forEach(([description, url]) => {
  test(`random image rejects ${description} in data-src`, async () => {
    const { image } = await attachRandomImage({ 'data-src': url });
    assert.equal(
      image.hasAttribute('src'),
      false,
      'no src attribute is written',
    );
  });

  test(`random image rejects ${description} in data-srcset`, async () => {
    const { image } = await attachRandomImage({
      'data-srcset': `/files/photo.jpg 1x, ${url} 2x`,
    });
    assert.equal(
      image.hasAttribute('srcset'),
      false,
      'a single bad candidate rejects the whole set',
    );
  });
});

test('position plugin never turns its "of" option into markup', async () => {
  const env = createEnvironment('<div id="anchor"></div><div id="tip"></div>');
  await env.load(POSITION_PLUGIN);

  assert.equal(typeof env.$.fn.position, 'function');
  assert.ok(env.$.ui.position, 'the legacy $.ui.position API is present');

  const options = {
    my: 'left top',
    at: 'left bottom',
    of: '<img src=x onerror="window.__xss = true">',
  };
  // jQuery's find() rejects a markup string as a selector; what matters is that
  // the plugin never builds an element from the option.
  try {
    env.$('#tip').position(options);
  } catch (error) {
    assert.match(String(error), /(?:Syntax|unrecognized expression)/);
  }
  assert.equal(env.document.querySelectorAll('img').length, 0);
  assert.equal(env.window.__xss, undefined);
});

test('position plugin still accepts selectors and elements', async () => {
  const env = createEnvironment('<div id="anchor"></div><div id="tip"></div>');
  await env.load(POSITION_PLUGIN);

  const $tip = env.$('#tip');
  assert.equal(
    $tip.position({ my: 'left top', at: 'left bottom', of: '#anchor' })[0],
    $tip[0],
    'positioning by selector returns the jQuery object',
  );
  assert.equal(
    $tip.position({
      my: 'left top',
      at: 'left bottom',
      of: env.document.getElementById('anchor'),
    })[0],
    $tip[0],
    'positioning by element returns the jQuery object',
  );
});
