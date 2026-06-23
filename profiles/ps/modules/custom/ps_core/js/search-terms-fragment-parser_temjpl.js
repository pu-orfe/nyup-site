/**
 * @file
 * Helper function to parse search terms from the URL fragment.
 *
 * This is used by various other JS we wrote to detect if someone
 * arrived at a page via search results, then to search page contents for the
 * search terms and make sure they are revealed. For example, our accordion
 * block will check each accordion item for the keywords and expand the
 * appropriate item if found.
 *
 * See search-terms-fragment-appender.js,
 */
function getSearchPhrasesFromFragment() {
  let regex = new RegExp('#:-:text=([^#]*)');
  let results = regex.exec(location.hash);
  if (results === null) {
    return [];
  }
  // Space char may be represented as a +, so convert back to space.
  let searchText = decodeURIComponent(results[1].replace(/\+/g, ' '));

  // Create an array of search phrases to look for on the page. We always
  // include the full search phrase first. If it's made up of multiple words,
  // we also split them up into individual words. The idea is that we should
  // first search for the full complete search phrase and reveal/highlight it.
  // If no hidden content contains it, then look for hidden content that
  // contains the individual words.
  let searchPhrases = [];
  searchPhrases.push(searchText);
  let brokenDownPhrase = searchText.split(' ');
  brokenDownPhrase.forEach(function (word) {
    // Only consider words that are at least two chars long. This ensures we
    // don't match on super common words.
    if (word.length > 2) {
      searchPhrases.push(word);
    }
  });

  return searchPhrases;
}
