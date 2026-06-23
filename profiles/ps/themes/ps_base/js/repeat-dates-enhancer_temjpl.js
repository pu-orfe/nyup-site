/**
 * @file
 * Improves UX of repeat dates on detail pages by hiding past dates and far future dates.
 */

(function ($, Drupal, once) {
  'use strict';
  Drupal.behaviors.repeat_dates_enhancer = {
    attach: function (context, settings) {
      // Attach our behaviors to each date field on the full detail page node views.
      $(once('repeat-dates-enhancer', '.node--view-mode-full .field--type-daterange-enhanced', context)).each(function () {
        let $dateFieldWrapper = $(this);
        let $dateItems = $(this).find('.field__item');
        // Do nothing if there are 3 or fewer dates. That amount is OK to show all.
        if ($dateItems.length <= 3) {
          return;
        }

        // If there are more than 3 future dates, only show 3 and hide the rest.
        let $futureDates = $(this).find('.future-date');
        if ($futureDates.length > 3) {
          $futureDates.each(function (i) {
            if (i >= 3) {
              $(this).addClass('far-future-date');
            }
          });
        }
        let $farFutureDates = $(this).find('.far-future-date');
        $farFutureDates.hide();

        // Add a link to show previous dates if we've got any.
        // If the only dates we have to show are past dates, display the most
        // recent date with a link to show more.
        let pastDatesButtonPressed = function (e) {
          let $pastDates = $('.node--type-ps-events.design-v2 .past-dates');

          if ($(this).hasClass('is-closed')) {
            $pastDates.show();
            $(this)
              .text('Hide past dates')
              .attr('aria-pressed', 'true')
              .removeClass('is-closed')
              .addClass('is-open');
          }
          else {
            $pastDates.hide();
            $(this)
              .text('Show past dates')
              .attr('aria-pressed', 'false')
              .removeClass('is-open')
              .addClass('is-closed');
          }
          e.preventDefault();
        };

        let $pastDatesItems = $dateFieldWrapper.find('.past-date');
        let $pastDatesItemsCount = $pastDatesItems.length;
        if ($pastDatesItemsCount > 0) {
          let $showPastDatesLink = $('<a href="#" class="is-closed" role="button" aria-pressed="false">Show past dates</a>');
          $showPastDatesLink
            .on('click', pastDatesButtonPressed)
            .on('keydown', function (e) {
              // Since we are not using a native <button> element for the link,
              // we need to mimic native behavior by also activating the action
              // if the spacebar is pressed.
              if (e.which === 32) {
                pastDatesButtonPressed(e);
              }
            });

          $showPastDatesLink.attr('aria-controls', 'past-dates-list');
          // Extract the past dates into a separate list which we will place
          // at the bottom of the event metadata header div.
          let $pastDatesWrapper = $('<div class="past-dates-wrapper"></div>');
          let $pastDatesList = $('<ul class="past-dates" id="past-dates-list"></ul>').hide();
          if ($futureDates.length === 0) {
            // We don't want an empty date area, so if all dates are past, add
            // all but the most-recent date to the past dates list.
            $pastDatesList.append($pastDatesItems.slice(0, $pastDatesItemsCount - 1).detach());
          }
          else {
            // Add all dates to the past-date list.
            $pastDatesList.append($dateFieldWrapper.find('.past-date').detach());
          }
          $pastDatesWrapper.append($showPastDatesLink);
          $pastDatesWrapper.append($pastDatesList);
          $('.events-detail-meta .left').append($pastDatesWrapper);
        }

        let farFutureDatesButtonPressed = function (e) {
          if ($(this).hasClass('is-closed')) {
            $farFutureDates.show();
            $(this)
              .text('Hide (' + ($farFutureDates.length) + ') additional dates')
              .attr('aria-pressed', 'true')
              .removeClass('is-closed')
              .addClass('is-open');
          }
          else {
            $farFutureDates.hide();
            $(this)
              .text('Show (' + ($farFutureDates.length) + ') additional dates')
              .attr('aria-pressed', 'true')
              .removeClass('is-open')
              .addClass('is-closed');
          }
          e.preventDefault();
        };

        // Add a link to show all future dates if we've hidden any.
        if ($farFutureDates.length > 0) {
          let $showFutureDatesLink = $('<li class="future-dates-link"><a href="#" class="is-closed" role="button" aria-pressed="false">Show (' + ($farFutureDates.length) + ') additional dates</a></li>');
          $showFutureDatesLink.find('a')
            .on('click', farFutureDatesButtonPressed)
            .on('keydown', function (e) {
              // Since we are not using a native <button> element for the link,
              // we need to mimic native behavior by also activating the action
              // if the spacebar is pressed.
              if (e.which === 32) {
                farFutureDatesButtonPressed(e);
              }
            });
          $dateFieldWrapper.find('.field__items').append($showFutureDatesLink);
        }
      });
    }
  };

}(jQuery, Drupal, once));
