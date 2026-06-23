/**
 * @file
 * Contains JS functionality for alerts.
 *
 * Alerts can be dismissed by users. Once dismissed, we set a cookie
 * that contains the revision ID of the alert. We hide any previously
 * dismissed alerts by checking this cookie before showing the alerts.
 * We use the revision ID so that any updates to an alert will force
 * it to be shown again to anyone that dismissed it.
 */

(function ($, Drupal, cookies) {
  'use strict';

  let alertsCookieName = 'ps_alerts_dismissed';

  // Check if we have any alerts that were already dismissed by the visitor.
  let dismissedAlertsCookie = cookies.get(alertsCookieName);
  let dismissedAlertsVids = [];
  if (!$.isEmptyObject(dismissedAlertsCookie)) {
    dismissedAlertsVids = dismissedAlertsCookie.split(',');
  }

  // Remove dismissed alerts from the DOM. We do this instead of just hiding
  // them so that screen readers don't pick them up.
  dismissedAlertsVids.forEach(function (vid) {
    $('.alert-rev-' + vid).remove();
  });

  // Now that all previously dismissed alerts have been removed, we can show
  // view containing all alerts to reveal any remaining.
  // @see ps_alerts_preprocess_views_view().
  $('.view-alerts').removeClass('hidden');

  // Dismisses an alert with the given revision ID.
  function dismissAlert(alertRevisionId, dismissedAlertsVids) {
    // Add it to our existing list of previously dismissed alerts
    // if it's not already there.
    if (dismissedAlertsVids.indexOf(alertRevisionId) === -1) {
      dismissedAlertsVids.push(alertRevisionId);
    }

    $('.alert-rev-' + alertRevisionId).hide();

    // Save the set of dismissed alerts back to the cookie.
    // We set the cookie to expire after 14 days so it doesn't stick around forever
    // and potentially balloon in size for users that never clear cookies
    // and sites that create/update alerts frequently.
    cookies.set(alertsCookieName, dismissedAlertsVids.toString(), { path: '/', expires: 14 });

    // If there are no alerts left visible, then hide the whole region
    // so screen readers aren't exposed to it anymore and set focus to
    // the main region.
    if ($('.view-alerts .alert-row').filter(':visible').length === 0) {
      $('.view-alerts').hide();
      let $mainRegion = $('main');
      if ($mainRegion.length) {
        // Temporarily make the main content region focusable.
        $mainRegion.attr('tabindex', -1).on('blur focusout', function () {
          $mainRegion.removeAttr('tabindex');
        });
        $mainRegion.focus();
      }
    }
  }

  Drupal.behaviors.ps_alerts = {
    attach: function (context) {
      // Hide an alert and update the cookie when the dismiss button is clicked.
      $('.close-alert', context)
        .one('click', function (e) {
          e.preventDefault();
          dismissAlert($(this).data('alert-rev'), dismissedAlertsVids);
        })
        // Since we are not using a native <button> element for close,
        // we need to mimic native behavior by also activating the action
        // if the spacebar is pressed.
        .one('keydown', function (e) {
          if (e.which === 32) {
            e.preventDefault();
            dismissAlert($(this).data('alert-rev'), dismissedAlertsVids);
          }
        });
    }
  }

})(jQuery, Drupal, window.Cookies);
