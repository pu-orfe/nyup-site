/**
 * @file
 * JS for showing enlarged event poster in modal window.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.show_enlarged_poster= {
    attach: function (context, settings) {
      const showEnlargedPosterBtns = once('show_enlarged_poster', '.show-enlarged-poster');
      showEnlargedPosterBtns.forEach(showEnlargedPosterBtn => {
        showEnlargedPosterBtn.addEventListener("click", function () {
          let eventPosterDialog = document.getElementById('event-poster-modal');
          eventPosterDialog.showModal();
          let closeButton = document.getElementById('postermodal-close');
          closeButton.addEventListener('click', () => {
            eventPosterDialog.close('close');
          });
        });
      });

    }
  };


})(Drupal, once);
