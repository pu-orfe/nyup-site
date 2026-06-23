/**
 * @file
 * Fixes bug where some browsers only scroll to anchors, w/o transferring focus.
 *
 * Based on github.com/selfthinker/dokuwiki_template_writr/blob/master/js/skip-link-focus-fix.js.
 */

(function ($) {

  jQuery.extend(jQuery.expr[':'], {
    focusable: function (el, index, selector) {
      let $element = $(el);
      return $element.is(':input:enabled, a[href], area[href], object, [tabindex]') && !$element.is(':hidden');
    }
  });

  function focusOnElement($element) {
    if (!$element.length) {
      return;
    }
    if (!$element.is(':focusable')) {
      // Add tabindex to make focusable and remove again.
      $element.attr('tabindex', -1).on('blur focusout', function () {
        $(this).removeAttr('tabindex');
      });
    }
    $element.focus();
  }

  $(document).ready(function () {
    // If there is a '#' in the URL (someone linking directly to a page with an anchor).
    if (document.location.hash) {
      focusOnElement($($.escapeSelector(document.location.hash)));
    }

    // If the hash has been changed (activation of an in-page link).
    $(window).bind('hashchange', function () {
      let hash = "#" + window.location.hash.replace(/^#/,'');
      focusOnElement($(hash));
    });
  });
})(jQuery);
