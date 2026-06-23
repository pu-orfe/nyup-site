/**
 * @file
 * Monitor layout builder column widths.
 */

(function ($) {
  'use strict';

  // Adds a sizing indicator class to the content list items, removing any
  // previously added indicator classes.
  let psGridLabeler = function (elem, label) {
    let sizingIndicatorClasses = 'list-is-xs list-is-sm list-is-med list-is-lg';
    sizingIndicatorClasses = sizingIndicatorClasses.replace(label, '');
    if ($(elem).hasClass(label) === false) {
      $(elem)
          .removeClass(sizingIndicatorClasses)
          .addClass(label);
    }
  };

  // Adds a sizing indicator class to the layout, removing any
  // previously added indicator classes.
  let psColumnLabeler = function (elem, label) {
    let sizingIndicatorClasses = 'layout-is-xs layout-is-sm layout-is-med layout-is-lg layout-is-xl layout-is-2xl';
    sizingIndicatorClasses = sizingIndicatorClasses.replace(label, '');
    if ($(elem).hasClass(label) === false) {
      $(elem)
          .removeClass(sizingIndicatorClasses)
          .addClass(label)
          .trigger('columnSized');
    }
    else {
      $(elem).trigger('columnSized');
    }
  };

  let psColumnWidths = function() {
    // Check each list's width (inner grid set by CSS).
    $('.content-list').each(function() {
      let gridWidth = $(this).find('.content-list-item:first-child').innerWidth() / parseFloat(psEmSize());
      if (gridWidth < 12.5) {
        // 200px; 1/6 column grid.
        psGridLabeler(this, 'list-is-xs')
      }
      else if (gridWidth < 32) {
        // 512px; 1/5 to 1/3 grids at desktop; mobile.
        psGridLabeler(this, 'list-is-sm')
      }
      else if (gridWidth < 44) {
        // 704px; tablet and large mobile, 1/2 grids at desktop.
        psGridLabeler(this, 'list-is-med')
      }
      else {
        // Desktop full width.
        psGridLabeler(this, 'list-is-lg')
      }
    });

    // Check each column's width (set by CSS).
    // NB: there are SASS breakpoint variables used for styling found in
    // ps_base/sass/base/_variables.scss. The classes added with this code
    // loosely follow the same pattern. The advantage with classes added here is
    // that they are based on column measurements rather than viewport size.
    $('.layout__region').each(function () {
      let columnWidth = $(this).innerWidth() / parseFloat(psEmSize());
      if (columnWidth < 20) {
        // 320px.
        psColumnLabeler(this, 'layout-is-xs');
      }
      else if (columnWidth < 36) {
        // 576px.
        psColumnLabeler(this, 'layout-is-sm');
      }
      else if (columnWidth < 48) {
        // 768px.
        psColumnLabeler(this, 'layout-is-med');
      }
      else if (columnWidth < 62) {
        // 992px.
        psColumnLabeler(this, 'layout-is-lg');
      }
      else if (columnWidth < 70) {
        // 1120px.
        psColumnLabeler(this, 'layout-is-xl');
      }
      else {
        psColumnLabeler(this, 'layout-is-2xl');
      }
    });
  };

  // Reset sizing indicator classes when the viewport is resized.
  document.addEventListener('debouncedResize', function() {
    psColumnWidths();
  }, false);

  // And also when the document is first ready.
  $(function() {
    psColumnWidths();
  });

  // The opening and closing of the off canvas dialog affects the columns
  // widths so the must be recalculated. There are events for dialog:aftercreate
  // and dialog:afterclose, but those aren't appropriate because the main canvas
  // area has a slow CSS transition on it. So we need to wait for that
  // transition to end.
  // Note that I experimented with removing the CSS transition entirely but
  // some people may like having it there.
  if (document.querySelector('[data-off-canvas-main-canvas]')) {
    const mainCanvas = document.querySelector('[data-off-canvas-main-canvas]');
    mainCanvas.addEventListener('transitionend', function () {
      psColumnWidths();
    });
  }

})(jQuery);
