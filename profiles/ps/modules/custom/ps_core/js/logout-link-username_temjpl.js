/**
 * @file
 * Contains JS functionality to dynamically add the current username to the log out link.
 */
(function (Drupal, once) {
  'use strict';
  Drupal.behaviors.logout_link_username = {
    attach: function (context, settings) {
      // The username span is loaded via Bigpipe. Let's see if it's here yet.
      const usernameSpan = document.getElementById('ps-current-username');
      if (usernameSpan && usernameSpan.dataset.username) {
        // Update the logout link text to include the username. Just run this
        // logic once in case there's a lot of behaviors running on this page.
        once('logout-link-username', '.ps-logout-link').forEach(logoutLink => {
          if (logoutLink.textContent === 'Log out') {
            logoutLink.textContent = `Log out (${usernameSpan.dataset.username})`;
          }
        });
      }
    }
  };
}(Drupal, once));
