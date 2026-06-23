/**
 * @file
 * Add JS behaviors for the enhanced date field formatter.
 */

(function ($, Drupal, once) {

  'use strict';

  Drupal.behaviors.enhanced_date_field_formatter = {
    attach: function (context, settings) {
      // For each date, add a class that indicates if the date is in the past or future.
      // We do this with JS instead of PHP so that we don't need to worry about
      // caching.
      $(once('enhanced-date-field-formatter', '.field--type-daterange-enhanced', context)).each(function () {
        let now = new Date();
        now.setHours(0, 0, 0, 0);

        $(this).find('.field__item').each(function () {
          // Add past/future date classes to each date. Themes can use this to hide/show dates
          // based on these values.
          // The actual start and end date for this occurance is stored as a timestamp in the DOM.
          // See EnhancedDateDateRangeCustomFormatter.php for how that's added.
          // Note that we zero out the time value, since it's easier to just compare days.
          let start = new Date($(this).data('start-timestamp') * 1000);
          start.setHours(0, 0, 0, 0);
          let end;
          if ($(this).data('end-timestamp')) {
            end = new Date($(this).data('end-timestamp') * 1000);
          }
          else {
            end = new Date($(this).data('start-timestamp') * 1000);
          }
          end.setHours(0, 0, 0, 0);

          if (now > end) {
            $(this).addClass('past-date');
          }
          else if (now <= start) {
            $(this).addClass('future-date');
          }
        });

        // Create 'add to calendar' links for each future date if configured
        // to do so.
        if (settings.enhanced_date.add_to_calendar_links) {
          let multipleFutureDates = $(this).find('.future-date').length > 1;
          $(this).find('.future-date').each(function () {
            // Create an "add to calendar" icon/link that, when clicked, opens a
            // modal dialog giving the user options for how to add the event to
            // their calendar.
            let $dateItem = $(this);

            let googleUrl = $dateItem.data('add-to-calendar-url-google');
            let outlookUrl = $dateItem.data('add-to-calendar-url-outlook');
            if (!googleUrl || !outlookUrl) {
              return;
            }

            let dateText = $dateItem.text();
            let allyText = 'Add to calendar';
            // If there is more than one date that can be added, help screen readers
            // identify which is which by including the date in the link text.
            if (multipleFutureDates) {
              allyText += ': ' + dateText;
            }
            let $addToCalLink = $('<a href="#" class="add-to-calendar" role="button"><span class="visually-hidden">' + allyText + '</span><span class="add-to-calendar-icon" title="Add to calendar">&#128197;</span></a>');

            let openCalendarChoiceDialog = function () {
              // Build the dialog that lets the user choose the format.
              let $dialog = $('<div id="add-to-calendar-dialog"></div>').hide().appendTo($('body'));

              // Add links for each calendar format to the dialog.
              $('<p></p>').text('Please choose the type of calendar application you use:').appendTo($dialog);
              let $list = $('<ul class="add-to-calendar-link-list"></ul>');
              $('<a class="add-to-calendar-link--google">Google Calendar</a>')
                .attr('href', googleUrl)
                .wrap('<li></li>')
                .parent()
                .appendTo($list);
              $('<a class="add-to-calendar-link--outlook">Outlook/iCal/Other</a>')
                .attr('href', outlookUrl)
                .wrap('<li></li>')
                .parent()
                .appendTo($list);
              $list.appendTo($dialog);

              // Initialize and show the modal dialog.
              let myDialog = Drupal.dialog($dialog[0], {
                title: 'Add to Calendar',
                close: function (event, ui) {
                  // Completely remove the dialog from the UI when it's closed.
                  $(this).dialog('destroy').remove();
                },
                open: function (event, ui) {
                  // jQuery UI set automatically set focus to the first link in
                  // the dialog, which is visually confusing because we style
                  // the focused link dramatically differently from the unfocused
                  // link. To prevent this, shift focus to the dialog itself.
                  // See https://stackoverflow.com/questions/1202079.
                  $(this).parent().focus();
                }
              });
              myDialog.showModal();
            };

            $addToCalLink.on('click', function (e) {
              e.preventDefault();
              openCalendarChoiceDialog();
            });
            $addToCalLink.on('keydown', function (e) {
              // Since we are not using a native <button> element for the link,
              // we need to mimic native behavior by also activating the action
              // if the spacebar is pressed.
              if (e.which === 32) {
                e.preventDefault();
                openCalendarChoiceDialog();
              }
            });
            $addToCalLink.appendTo($(this));
          });
        }
      });
    }
  };

})(jQuery, Drupal, once);
