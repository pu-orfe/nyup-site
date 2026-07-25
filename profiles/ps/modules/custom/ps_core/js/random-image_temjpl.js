/**
 * @file
 * Contains JS functionality for random image loading for an Image block.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Resolves a lazy-loading image URL read from a data attribute.
   *
   * The URL is parsed so that only http and https URLs are ever assigned, and
   * every other scheme (javascript:, data:, vbscript:, ...) is rejected.
   * Parsing also normalises away the whitespace and control characters that
   * browsers ignore when reading a scheme, so a scheme with a tab or newline
   * inside it cannot slip past.
   *
   * @param {string} url
   *   The candidate URL, absolute or relative to the current document.
   *
   * @return {?string}
   *   The resolved absolute URL, or null when it is not safe to assign.
   */
  function resolveImageUrl(url) {
    let parsed;
    try {
      parsed = new URL(url, window.location.href);
    }
    catch (e) {
      // Not a URL we can make sense of, so refuse to assign it.
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  }

  /**
   * Validates a lazy-loading srcset value read from a data attribute.
   *
   * Each comma separated candidate is resolved whole, descriptor included, so
   * that a scheme split across whitespace cannot hide from the check.
   *
   * @param {string} srcSet
   *   The candidate srcset, a comma separated list of URL/descriptor pairs.
   *
   * @return {boolean}
   *   TRUE when every candidate in the set is safe to assign.
   */
  function isValidImageSrcSet(srcSet) {
    return srcSet.split(',').every(function (candidate) {
      return resolveImageUrl(candidate) !== null;
    });
  }

  Drupal.behaviors.random_image = {
    attach: function (context, settings) {

      $(once('ps-random-image', '.block-ps-image', context)).each(function () {
        let $figures = $(this).find('figure.random-image');
        const randomIndex = Math.floor(Math.random() * $figures.length);
        $figures.each(function (index) {
          // Reveal a random image and remove others.
          if (index === randomIndex) {
            $(this).removeClass('invisible')
              .removeAttr('aria-hidden')
              .removeAttr('tabindex');
            let $image = $('img', this);
            if ($image.length) {
              const dataSrc = $($image).attr('data-src');
              // Assign the resolved URL rather than the raw attribute value,
              // so only a URL that parsed as http(s) can reach src.
              const resolvedSrc = dataSrc ? resolveImageUrl(dataSrc) : null;
              if (resolvedSrc) {
                $($image).attr('src', resolvedSrc)
              }
              const dataSrcSet = $($image).attr('data-srcset');
              if (dataSrcSet && isValidImageSrcSet(dataSrcSet)) {
                $($image).attr('srcset', dataSrcSet)
              }
            }
          }
          else {
            $(this).remove();
          }
        });
      });
    }
  };

}(jQuery, Drupal, once));
