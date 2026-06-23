/**
 * @file
 * Contains JS functionality for some link behaviors.
 */
(function ($, drupalSettings, Drupal, once) {
  'use strict';
  Drupal.behaviors.ps_core_link_behavior = {
    attach: function (context, settings) {
      if (!drupalSettings.hasOwnProperty('all_documents_new_window') || !drupalSettings.all_documents_new_window) {
        return;
      }

      // Regexes for detecting links directly to a document via our special
      // document system path or directly to the document file. The list of
      // file extensions matches the list that we allow for upload in Document
      // entities.
      let documentAliasRegex = new RegExp('\/document\/[0-9]+$');
      let directLinkRegex = new RegExp('\.(txt|doc|docx|xls|xlsx|xlsm|pdf|ppt|pptx|pps|ppsx|odt|ods|odp|dat|dta|sav|por|cls|tex)$', 'i');

      // Find all links that link to a document path and open them in a new window.
      $(once('ps-core-link-behavior', 'a', context)).each(function () {
        // Skip any links that already have a value for target.
        if ($(this).attr('target')) {
          return;
        }

        let href = $(this).attr('href');
        if (documentAliasRegex.test(href) || directLinkRegex.test(href)) {
          $(this).attr('target', '_blank');
        }
      });
    }
  };
}(jQuery, drupalSettings, Drupal, once));
