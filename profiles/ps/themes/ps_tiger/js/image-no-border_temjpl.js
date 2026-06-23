/**
 * @file
 * Removes borders from images wrapped in links.
 */

(function ($) {
  'use strict';

  $(document).ready(function () {
    $("a").has("img").addClass("no-border");
  });
})(jQuery);
