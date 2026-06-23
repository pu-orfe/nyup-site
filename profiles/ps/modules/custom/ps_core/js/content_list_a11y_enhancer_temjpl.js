/**
 * @file
 * Improve accessibility for content lists where it's easier with JS than PHP.
 */

(function (Drupal, $, once) {
  'use strict';

  Drupal.behaviors.content_list_a11y_enhancer = {
    attach: function (context, settings) {
      // Fixes for our standard content list and publications list.
      $(once('content-list-a11y-enhancer', '.content-list, .publications-list', context)).each(function () {
        // If the content list includes a title in the output, then identify what
        // heading level was specified for the title. Then give each row's title field
        // a heading level that is one lower. If NO title was output, we assume that
        // it's OK to use a heading level of 2 for each item.
        let contentListHeadingTag = '';
        if (this.classList.contains('content-list')) {
          contentListHeadingTag = $(this).find('.content-list-title').prop('tagName');
        }
        // Publication lists use the normal block heading output for the block
        // title.
        else if (this.classList.contains('publications-list')) {
          let $blockHeadingElement = $(this).parent().find('.block-heading');
          if ($blockHeadingElement.length) {
            contentListHeadingTag = $blockHeadingElement.prop('tagName');
          }
        }
        let titleFieldHeadingLevel = 2;
        if (contentListHeadingTag === 'H2') {
          titleFieldHeadingLevel = 3;
        }
        else if (contentListHeadingTag === 'H3') {
          titleFieldHeadingLevel = 4;
        }

        const $filterHeading =  $(this).find('.ps-filters-heading');
        if ($filterHeading.length > 0 && titleFieldHeadingLevel !== 3) {
          $filterHeading.attr({'aria-level': titleFieldHeadingLevel});
        }

        $(this).find('.content-list-item').each(function () {
          let $titleField = $(this).find('.field--name-title');
          if ($titleField.length) {
            $titleField.attr({'role': 'heading', 'aria-level': titleFieldHeadingLevel});
            let $imageField = $(this).find('.field--name-field-ps-featured-image, .field--name-field-ps-featured-icon');
            if ($imageField.length) {
              let titleFieldIsWrappedInLink = $titleField.find('a').length > 0;
              let imageFieldIsWrappedInLink = $imageField.find('a').length > 0;

              // If the featured image is configured to be output as a link and the title
              // is also linked, then aria-hide the link around the image to avoid screen
              // readers picking up two links to the same destination.
              // This is FAR easier to do in JS than wrestle the field formatter and
              // and image template to account for this scenario.
              if (titleFieldIsWrappedInLink && imageFieldIsWrappedInLink) {
                $imageField.find('a').attr({'aria-hidden': 'true', 'tabindex': '-1'});
              }
              // If the featured image is output as a link but the title is NOT output as
              // a link, assign the title as the label for the link so screen readers are not
              // at the mercy of whatever alt text the editor put in the for image.
              else if (!titleFieldIsWrappedInLink && imageFieldIsWrappedInLink) {
                $imageField.find('a').attr('aria-label', $titleField.text());
              }
            }
            let $dateBadge = $(this).find('.content-list-item-date-badge');
            if ($dateBadge.length) {
              if ($dateBadge.data('prepend')) {
                let markup = '<span class="sr-only">' + $dateBadge.text() + ': </span>';
                $(this).find('.field--name-title').prepend(markup);
              }
            }
          }
        });
      });
    }
  };

})(Drupal, jQuery, once);
