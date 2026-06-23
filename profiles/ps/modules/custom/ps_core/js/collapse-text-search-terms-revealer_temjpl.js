/**
 * @file
 * Check if search terms exist in collapsed text and open the item.
 *
 * If someone arrives on a page from search results, we append the search terms
 * as a hash to the URL. This JS looks for that, and checks of any collapsed
 * text (accordion items) from the Collapse Text module have the search terms in
 * them, and it opens the items. This makes it a bit easier for someone to
 * find the content they were actually searching for.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function (e) {
    let searchPhrases = getSearchPhrasesFromFragment();
    if (searchPhrases.length > 0) {
      // The collapse text module works by creating <details> elements with a
      // specific class name. We just check for all the closed ones, and open
      // them if they contain the keywords.
      let collapsedDetails = document.querySelectorAll('details.collapsible:not([open])');
      for (let i = 0, count = collapsedDetails.length; i < count; i++) {
        let detailsEl = collapsedDetails[i];
        let found = false;
        searchPhrases.forEach(function (searchPhrase) {
          let regex = new RegExp('\\b' + searchPhrase + '\\b', 'i');
          if (!found && regex.test(detailsEl.textContent)) {
            found = true;
            detailsEl.open = 'true';
          }
        });
      }
    }
  });
})();
