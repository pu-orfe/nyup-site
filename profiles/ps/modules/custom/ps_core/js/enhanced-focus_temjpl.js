/**
 * @file
 * JS behaviors for enhanced focus.
 */

(function ($) {
  'use strict';

  $(document).ready(function () {
    // Add a special body class when that tab key is used to tab
    // though a link. This action indicates a visitor is using a
    // keyboard to navigate links instead of a mouse. This body
    // class allows themes to show more prominent focus indicators
    // so the current focus is clearer for keyboard users.
    function tabWatch(e) {
      if (e.key === 'Tab' && document.activeElement.tagName === 'A') {
        $('body').addClass('enhance-focus');
        tabWatcher.removeEventListener('keyup', tabWatch);
      }
    }
    let tabWatcher = document.querySelector('body');
    tabWatcher.addEventListener('keyup', tabWatch);
  });
})(jQuery);
