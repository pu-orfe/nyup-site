/**
 * Activate the smartquotes library once on load.
 */
let psSmartQuotesOK = true;
let psSmartQuotes = function() {
    // Prevent running if forbidden elements are present.
    if (!document.querySelectorAll('#layout-builder, .cke, .ck-editor').length) {
        smartquotes();
    } else {
        psSmartQuotesOK = false;
    }
};
psSmartQuotes();

/**
 * Re-run script when content is added to the page
 * via via jQuery AJAX, which triggers a global callback.
 * This will need to be replaced with behaviors
 * if Views ever converts to Vanilla JS.
 */
jQuery(document).ajaxSuccess( function() {
    if (psSmartQuotesOK) {
        psSmartQuotes();
    }
});
