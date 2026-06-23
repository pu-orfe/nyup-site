/**
 * @file
 * Defines behavior for content list AJAX functionality.
 *
 * Our content list, event calendar, event list conference blocks, and
 * accordion item list blocks all have the ability to submit their exposed
 * filters via AJAX and to paginate using AJAX.
 */
(function (Drupal, $, drupalSettings, once) {
  'use strict';

  // Help function for building the AJAX URL for this block's updates.
  function buildAjaxUrl($contentListBlock, params) {
    // The block's div should have various identifiers attached. We need these
    // so the block can be looked up in the backend to retrieve it's setting
    // and re-render.
    let componentParams = 'uuid=' + $contentListBlock.data('component-uuid') +
      '&et=' + $contentListBlock.data('et') +
      '&ei=' + $contentListBlock.data('ei') +
      '&evd=' + $contentListBlock.data('evd');
    let url = '/lbc-ajax?' + componentParams;
    // Attach any additional parameters that were provided.
    if (params) {
      url += '&' + params;
    }
    return url;
  }

  // Helper function to make an AJAX request to the special route
  // for rendering an individual layout builder component.
  function reloadViaAjax($originalBlock, params, callback) {
    // Add CSS class to allow designers to show a loading indicator.
    $originalBlock.addClass('ajax-processing');
    $.ajax({
      url: buildAjaxUrl($originalBlock, params),
      success: function (html) {
        if (html.length > 0) {
          // When content lists are removed and rebuilt, the browser may scroll
          // a user up on the page since the page gets smaller for a brief. This
          // can be annoying, especially with the calendar. Save the current
          // scroll position and scroll back to it after the new block is
          // loaded in.
          let $scrollTarget;
          if ($('body').scrollTop() !== 0) {
            $scrollTarget = $('body');
          }
          else {
            $scrollTarget = $('html');
          }
          const currentScrollPos = $scrollTarget.scrollTop();

          let $newBlock = $($.parseHTML(html, document, true));
          Drupal.detachBehaviors($originalBlock.get(0), drupalSettings);
          $originalBlock.replaceWith($newBlock);

          // Attach behaviors to all element nodes.
          // See core's ajax JS file for where this was taken from.
          $newBlock.each(function (index, element) {
            if (element.nodeType === Node.ELEMENT_NODE) {
              Drupal.attachBehaviors(element, drupalSettings);
            }
          });

          $scrollTarget.scrollTop(currentScrollPos);

          let itemsCount = $newBlock.find('.content-list-item,.events-list-conference-item,.ps-accordion-item').length;
          if (itemsCount > 0) {
            Drupal.announce(Drupal.t('@count items are now shown in the list.', {"@count": itemsCount}));
          }
          else {
            Drupal.announce(Drupal.t('No items were returned in the list.'));
          }

          if (callback) {
            callback($newBlock);
          }
        }
      },
      error: function () {
        let msg = 'There was an error processing your request. Please reload the page and try again.';
        let $error = $('<p></p>').text(msg);
        $originalBlock.replaceWith($error);
        Drupal.announce(Drupal.t(msg));
      },
      complete: function () {
        $originalBlock.removeClass('ajax-processing');
      }
    });
  }

  // Helper function for making a "next page" AJAX request, extracting the
  // new items, and appending them to the existing list of items. This is for
  // use with the "Load more" style pager.
  function appendNextPage($originalBlock, params) {
    // Add CSS class to allow designers to show a loading indicator.
    $originalBlock.addClass('ajax-processing');
    $.ajax({
      url: buildAjaxUrl($originalBlock, params),
      success: function (html) {
        if (html.length > 0) {
          const $newBlock = $($.parseHTML(html, document, true));
          let $newContentItems = $newBlock.find('.content-list-item');

          // We need to have Drupal run the behaviors callbacks for the newly
          // added content items.
          $newContentItems.each((i, el) => {
            if (el.nodeType === Node.ELEMENT_NODE) {
              Drupal.attachBehaviors(el, drupalSettings);
            }
          });

          // Update the existing "Load more" button to set the correct query
          // params attribute on it, so if it's clicked again, it loads the
          // correct next page. We hide the button entirely if the new block
          // contained no "next" page link, indicating we've reached the last
          // page.
          let existingLoadMoreButton = $originalBlock[0].querySelector('.load-more');
          $originalBlock.find('.content-list-items').append($newContentItems);
          const $newNextPageLink = $newBlock.find('.pager__item--next a');
          if ($newNextPageLink.length) {
            existingLoadMoreButton.setAttribute('data-next-page-query-params', $newNextPageLink[0].getAttribute('href').split(/\?/)[1]);
          }
          else {
            existingLoadMoreButton.remove();
          }

          Drupal.announce(Drupal.t('@count new items have been loaded.', {"@count": $newContentItems.length}));
          let $firstLink = $newContentItems.first().find('a:not([aria-hidden])');
          if ($firstLink) {
            $firstLink.focus();
          }
        }
      },
      error: function () {
        let msg = 'There was an error processing your request. Please reload the page and try again.';
        let $error = $('<p></p>').text(msg);
        $originalBlock.replaceWith($error);
        Drupal.announce(Drupal.t(msg));
      },
      complete: function () {
        $originalBlock.removeClass('ajax-processing');
      }
    });
  }

  // Helper function to extract the current values of the exposed
  // filter form.
  function getExposedFilterFormParams($form) {
    let formData = $form.serializeArray();
    // Clear out empty values.
    return $.map(formData, function (param) {
      if (param.value.length === 0) {
        return null;
      }
      else {
        return param;
      }
    });
  }

  Drupal.behaviors.content_list_ajax = {
    attach: function (context, settings) {
      $(once('ps-content-list-ajax', '.content-list[data-ajax="on"],.events-list-conference[data-ajax="on"],.ps-fullcalendar,.ps-accordion[data-ajax="on"]')).each(function () {

        let $block = $(this).closest('.block');
        $block.append('<div class="icon-loading-throbber"></div>');

        // Handle AJAX submission of exposed filters form.
        $block.find('.ps-content-list-filters').on('submit', function (e) {
          e.preventDefault();
          let $block = $(this).closest('.block');
          let ajaxParams = $.param(getExposedFilterFormParams($(this)));
          reloadViaAjax($block, ajaxParams);
        });

        // Handle AJAX reset. We just reload the form with no params set.
        $block.find('.content-list-reset').on('click', function (e) {
          e.preventDefault();
          let $block = $(this).closest('.block');
          reloadViaAjax($block, []);
        });

        // Replace traditional pager with a "Load more" button if configured.
        if (this.dataset.pagerLoadMore && $block[0].querySelector('.pager')) {
          const traditionalPager = $block[0].querySelector('.pager');
          const nextPageLink = traditionalPager.querySelector('.pager__item--next a');
          if (nextPageLink) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.classList.add('load-more');
            loadMoreButton.setAttribute('data-next-page-query-params', nextPageLink.getAttribute('href').split(/\?/)[1]);
            const loadMoreLabel = document.createTextNode('Load more');
            loadMoreButton.appendChild(loadMoreLabel);

            loadMoreButton.addEventListener('click', function () {
              appendNextPage($block, this.dataset.nextPageQueryParams);
            });

            traditionalPager.after(loadMoreButton);
          }
          traditionalPager.remove();
        }
        // Otherwise, override pager & alpha links to load via ajax.
        else {
          $block.find('.pager__item a, .people-last-name-links a').on('click', function (e) {
            e.preventDefault();

            // Do nothing if we're already loading.
            let $block = $(this).closest('.block');
            if ($block.hasClass('ajax-processing')) {
              return;
            }

            // The links already have the correct query string parameters,
            // which should include both the current page's parameters and the
            // param for the link itself. We just carry those over when submitting
            // the AJAX request.
            let linkQueryParams = $(this).attr('href').split(/\?/)[1];
            reloadViaAjax($block, linkQueryParams, function ($newBlock) {
              // If the top of the content list is not already in the viewport, then
              // scroll to it so the user can read the top of the list without
              // scrolling manually.
              // We also scroll a bit higher than we need to since there may be
              // sticky headers which would obscure the content list.

              // The element we need to scroll is either the HTML or BODY, depending
              // on the browser. We check based on the value of scroll top for each.
              let $scrollTarget;
              if ($('body').scrollTop() !== 0) {
                $scrollTarget = $('body');
              }
              else {
                $scrollTarget = $('html');
              }

              let currentScrollPos = $scrollTarget.scrollTop();
              let scrollTo = $newBlock.find('.content-list').offset().top - 100;
              if (scrollTo < currentScrollPos) {
                $scrollTarget.animate({ scrollTop: scrollTo });
              }
            });
          });
        }
      });
    },
  };
})(Drupal, jQuery, drupalSettings, once);
