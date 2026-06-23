/**
 * @file
 * Monitor layout builder column widths.
 */

(function ($) {
  'use strict';

  $('.main-container table').each(function() {
    $(this).wrap('<section class="scrolltable" aria-label="scrollable table"></section>');
  });

  let tablePos = { top: 0, left: 0, x: 0, y: 0 };
  let activeDrag;

  const mouseDownHandler = function(e) {
    let $target = $(e.target);
    if ($target.not('a')) {
      activeDrag = $target.parents('section')[0];
      activeDrag.style.cursor = 'grabbing';
      activeDrag.style.userSelect = 'none';

      tablePos = {
        left: activeDrag.scrollLeft,
        top: activeDrag.scrollTop,
        // Get the current mouse tablePosition
        x: e.clientX,
        y: e.clientY,
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    }
  };

  const mouseMoveHandler = function(e) {
    // How far the mouse has been moved
    const dx = e.clientX - tablePos.x;
    const dy = e.clientY - tablePos.y;

    // Scroll the activeDragment
    activeDrag.scrollTop = tablePos.top - dy;
    activeDrag.scrollLeft = tablePos.left - dx;
  };

  const mouseUpHandler = function() {
    activeDrag.style.removeProperty('cursor');
    activeDrag.style.removeProperty('user-select');

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };

  function grabbableTables() {
    $('.main-container table').each(function() {
      let thisWidth = $(this).find('tr').first().width();
      if (thisWidth > $(this).parent().width() + 6 )  {
        $(this).parent('.scrolltable').addClass('grabtable');
        $(this)[0].addEventListener('mousedown', mouseDownHandler);
      }
      else {
        $(this).parent('.scrolltable').removeClass('grabtable');
        $(this)[0].removeEventListener('mousedown', mouseDownHandler);
      }
    });
  }
  grabbableTables();

  // Reset sizing indicator classes when the viewport is resized.
  document.addEventListener('debouncedResize', function() {
    grabbableTables();
  }, false);


})(jQuery);
