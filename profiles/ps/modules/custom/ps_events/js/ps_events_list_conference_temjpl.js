/**
 * @file
 * JS behaviors for events list conference blocks.
 */
(function (Drupal, Tabby, once) {
  'use strict';
  Drupal.behaviors.ps_events_list_conference = {
    attach: function (context, settings) {
      const conferencesList = once('events-list-conference-day-tabs', '.events-list-conference-day-tabs', context);
      conferencesList.forEach(function (element) {

        // Before initializing the Tabby library, check if any of the tabs match
        // today's date, and set them as the default selected tab if so.
        // This is good for conference schedules so the current day's schedule
        // will display automatically.
        // If someone already specified a date as a fragment though, don't
        // do anything. We don't want to override an explicit tab selection.
        if (!window.location.hash || !window.location.hash.match(/#show-\d\d\d\d-\d\d-\d\d/)) {
          // The date from the tab is in the NYC timezone. We need to get the
          // current date in NYC timezone before checking if there's a match.
          // Note that toLocaleDateString *should* return in format MM/DD/YYYY,
          // but verify that just in case. The mozilla docs indicate isn't not
          // a guarantee and thus shouldn't be used for static comparison.
          const dateInNyc = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/New_York'});
          if (/^\d\d\/\d\d\/\d\d\d\d$/.test(dateInNyc)) {
            // Reformat to YYYY-MM-DD which is what our tabs date data is in.
            let todayDateStringParts = dateInNyc.split('/');
            let todayDateString = todayDateStringParts[2] + "-" + todayDateStringParts[0] + "-" + todayDateStringParts[1];

            let currentDefaultTab = null;
            let newDefaultTab = null;
            element.querySelectorAll('a').forEach(function (tabLink) {
              if (tabLink.hasAttribute('data-tabby-default')) {
                currentDefaultTab = tabLink;
              }
              let tabDateString = tabLink.dataset.date;
              if (todayDateString === tabDateString) {
                newDefaultTab = tabLink;
              }
            });

            if (newDefaultTab) {
              if (currentDefaultTab && currentDefaultTab !== newDefaultTab) {
                currentDefaultTab.removeAttribute('data-tabby-default');
              }
              newDefaultTab.setAttribute('data-tabby-default', '');
            }
          }
        }
        let tabs = new Tabby(element);

        // Add any clicked tab IDs to the URL as a fragment so that someone can
        // copy and paste the address to someone to share a specific day in the
        // schedule.
        document.addEventListener('tabby', function (event) {
          window.history.replaceState({}, '', '#' + event.detail.content.id);
        });
      });

      // Enhance accessibility by providing proper heading labels.
      // If the conference schedule block  includes a title in the output, then
      // identify what heading level was specified for the title. Then give each
      // row's date field a heading level that is one lower. If NO title was
      // output, we assume that it's OK to use a heading level of 2 for each item.
      const conferenceBlocks = once('conference-blocks', '.block-ps-events-list-conference');
      conferenceBlocks.forEach(function (block) {
        let headingElement = block.querySelector('.block-heading');
        let rowHeadingLevel = 2;
        if (headingElement) {
          if (headingElement.tagName === 'H2') {
            rowHeadingLevel = 3;
          }
          else if (headingElement.tagName === 'H3') {
            rowHeadingLevel = 4;
          }
        }

        // Set the heading of each row to the correct heading level. We use
        // the date field as the heading because it appears first in the DOM
        // for each row.
        block.querySelectorAll('.field--name-field-ps-events-date').forEach(function (dateElement) {
          dateElement.setAttribute('role', 'heading');
          dateElement.setAttribute('aria-level', rowHeadingLevel);
        });

        // Aria-hide the headshots of speakers if output. These are output
        // as links which are redundant to the speaker name which is also
        // linked. The alt text for the images is not important here either
        // as they are all headshots of the person.
        block.querySelectorAll('.field--name-field-ps-featured-image a').forEach(function (imageLinkElement) {
          imageLinkElement.setAttribute('aria-hidden', 'true');
          imageLinkElement.setAttribute('tabindex', '-1');
        });

      });
    }
  };
})(Drupal, Tabby, once);
