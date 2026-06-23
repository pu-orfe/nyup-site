/**
 * @file
 * Assign heading levels to labels in structured nodes.
 */

(function ($) {
  'use strict';

  $('.block-ps-node-view .field__label').each(function () {
    $(this).attr({
      'role': 'heading',
      'aria-level': 2
    });
  });

})(jQuery);
