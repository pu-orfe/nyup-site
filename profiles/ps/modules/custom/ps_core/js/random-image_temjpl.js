/**
 * @file
 * Contains JS functionality for random image loading for an Image block.
 */

(function ($, Drupal, once) {
  'use strict';

  /**
   * Validates a lazy-loading image URL read from a data attribute.
   *
   * Only URLs without a scheme (relative paths) or with an http/https scheme
   * are allowed, so values such as "javascript:" or "data:" can never reach a
   * src or srcset attribute.
   *
   * @param {string} url
   *   The candidate URL.
   *
   * @return {boolean}
   *   TRUE when the URL is safe to assign.
   */
  function isValidImageUrl(url) {
    // Browsers ignore ASCII whitespace and control characters when parsing a
    // scheme, so strip them before checking for one.
    const normalized = url.replace(/[\u0000-\u0020]/g, '');
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
    return !scheme || /^https?$/i.test(scheme[1]);
  }

  /**
   * Validates a lazy-loading srcset value read from a data attribute.
   *
   * Each comma separated candidate is checked whole, descriptor included, so
   * that a scheme split across whitespace cannot hide from the URL check.
   *
   * @param {string} srcSet
   *   The candidate srcset, a comma separated list of URL/descriptor pairs.
   *
   * @return {boolean}
   *   TRUE when every candidate in the set is safe to assign.
   */
  function isValidImageSrcSet(srcSet) {
    return srcSet.split(',').every(function (candidate) {
      return isValidImageUrl(candidate);
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
              if (dataSrc && isValidImageUrl(dataSrc)) {
                $($image).attr('src', dataSrc)
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
