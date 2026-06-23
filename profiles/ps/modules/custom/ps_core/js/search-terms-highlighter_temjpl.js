/**
 * @file
 * Highlights keywords from search on a page.
 *
 * We append the search terms from a search in the search result links as
 * a URL fragment. If we find them on the search result page, we highlight them
 * by wrapping in a <mark> element, making them easier to find for users.
 */
(function () {
  'use strict';

  /**
   * Highlight keywords inside a DOM element.
   *
   * See https://stackoverflow.com/a/49092029/899199.
   */
  function highlightSearchTerms(elem, keywords) {
    // Sort longer matches first to avoid
    // highlighting keywords within keywords.
    keywords.sort(function (a, b) {
      return b.length - a.length;
    });
    for (let i = 0, count = elem.childNodes.length; i < count; i++) {
      let child = elem.childNodes[i];
      const keywordRegex = RegExp('\\b(?:' + keywords.join('|') + ')\\b', 'gi');
      if (child.nodeType !== 3) { // not a text node
        highlightSearchTerms(child, keywords);
      }
      else if (keywordRegex.test(child.textContent)) {
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        child.textContent.replace(keywordRegex, function (match, idx) {
          const part = document.createTextNode(child.textContent.slice(lastIdx, idx));
          const highlighted = document.createElement('mark');
          highlighted.textContent = match;
          frag.appendChild(part);
          frag.appendChild(highlighted);
          lastIdx = idx + match.length;
        });
        const end = document.createTextNode(child.textContent.slice(lastIdx));
        frag.appendChild(end);
        child.parentNode.replaceChild(frag, child);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function (e) {
    let searchPhrases = getSearchPhrasesFromFragment();
    if (searchPhrases.length > 0) {
      // We limit the search to the content block, since that's the only thing
      // that's indexed by search anyway.
      let mainBlockEl = document.querySelector('.block-system-main-block');
      if (mainBlockEl) {
        highlightSearchTerms(mainBlockEl, searchPhrases);
      }
    }
  });
})();
