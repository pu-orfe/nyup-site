/**
 * @file
 * Utility functions.
 */

(function ($) {
  'use strict';

  // Determine the heading level of the passed in element. Assumes
  // it's proper HTML heading element or an element with the aria
  // "heading" role.
  window.getHeadingLevelOfElement = function ($element) {
    let headingTagMatch = $element.prop('tagName').match(/^H([1-9])$/);
    if (headingTagMatch) {
      return parseInt(headingTagMatch[1]);
    }
    else if ($element.attr('role') === 'heading') {
      // All heading roles should also have a level defined. If they don't
      // assume it's an H2.
      let level = parseInt($element.attr('aria-level'));
      if (!level) {
        level = 2;
      }
      return level;
    }
    else {
      // This is not a heading element.
      return null;
    }
  }

})(jQuery);

/**
 * @function
 * Debounced Resize events.
 *
 * Example usage:
 * document.addEventListener('debouncedResize', function() {}, false);
 */
const debouncedResize = document.createEvent('event');
debouncedResize.initEvent('debouncedResize', true, true);
let psResizeTimeout;
function psResizeWatch() {
  clearTimeout(psResizeTimeout);
  psResizeTimeout = setTimeout(function () {
    document.dispatchEvent(debouncedResize);
  }, 100);
}
window.addEventListener('resize', function () {
  psResizeWatch();
});

// Also automatically trigger resize on font size change.
function psFontChangeWatch() {
  // IE can't do this.
  if ("ResizeObserver" in window) {
    let psFontTemplate = document.createElement('template');
    psFontTemplate.innerHTML = '<div id="font-watch" aria-hidden="true" ' +
        'style="visibility: hidden; position: fixed; z-index: -1;">m</div>';
    document.body.appendChild(psFontTemplate.content);
    const watchElem = document.getElementById('font-watch');
    const resizeObserver = new ResizeObserver(function () {
      psResizeWatch();
    });
    resizeObserver.observe(watchElem);
  }
}
psFontChangeWatch();

/**
 * @function
 * Debounced scroll events.
 *
 * Example usage:
 * document.addEventListener('debouncedScroll', function() {}, false);
 */
const debouncedScroll = document.createEvent('event');
debouncedScroll.initEvent('debouncedScroll', true, true);
let psScrollTimeout;
function psScrollWatch() {
  clearTimeout(psScrollTimeout);
  psScrollTimeout = setTimeout(function () {
    document.dispatchEvent(debouncedScroll);
  }, 100);
}

window.addEventListener('scroll', function() {
  psScrollWatch();
});

/**
 * @function
 * Returns sizing based on ems
 *
 * Example usage:
 * console.log(psWindowEmWidth());
 */

// Returns size of 1em at browser's current font scaling.
function psEmSize() {
  return getComputedStyle(
    document.querySelector('body')
  )['font-size'];
}

// Returns width of browser in ems.
function psWindowEmWidth() {
  let windowWidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  windowWidth = windowWidth / parseFloat(psEmSize());
  return windowWidth;
}
