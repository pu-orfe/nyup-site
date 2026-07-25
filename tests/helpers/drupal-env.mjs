/**
 * @file
 * Minimal Drupal-like browser environment for testing behavior files.
 *
 * The site's behavior files are plain IIFEs that expect `jQuery`, `Drupal` and
 * `once` as globals, so this helper builds a jsdom window, populates those
 * globals, and evaluates a behavior file inside it.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import jQueryFactory from 'jquery';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/**
 * Resolves a repository-relative path.
 *
 * @param {string} relativePath
 *   Path relative to the repository root.
 *
 * @return {string}
 *   The absolute path.
 */
export function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

/**
 * Creates a jsdom environment with the globals Drupal behaviors expect.
 *
 * @param {string} bodyHtml
 *   Markup to use as the document body.
 *
 * @return {object}
 *   An object with `window`, `document`, `$`, `Drupal` and `load()`.
 */
export function createEnvironment(bodyHtml = '') {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const $ = jQueryFactory(window);

  // Drupal's `once` library, reduced to the parts the behaviors use.
  const once = (id, selector, context) => {
    const root = context || window.document;
    return Array.prototype.filter.call(
      root.querySelectorAll(selector),
      (element) => {
        const ids = (element.getAttribute('data-once') || '')
          .split(' ')
          .filter(Boolean);
        if (ids.includes(id)) {
          return false;
        }
        ids.push(id);
        element.setAttribute('data-once', ids.join(' '));
        return true;
      },
    );
  };

  const Drupal = {
    behaviors: {},
    // Captures dialog creation so tests can assert on it without jQuery UI.
    dialogs: [],
    dialog(element, options) {
      const record = { element, options, shown: false };
      Drupal.dialogs.push(record);
      return {
        showModal() {
          record.shown = true;
        },
      };
    },
  };

  window.jQuery = $;
  window.$ = $;
  window.Drupal = Drupal;
  window.once = once;

  return {
    window,
    document: window.document,
    $,
    Drupal,
    /**
     * Evaluates a repository JavaScript file inside this window.
     *
     * @param {string} relativePath
     *   Path to the file, relative to the repository root.
     */
    async load(relativePath) {
      const source = await readFile(repoPath(relativePath), 'utf8');
      window.eval(source);
    },
  };
}
