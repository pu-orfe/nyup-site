(function (Drupal, drupalSettings, once, AriaAutocomplete) {
  Drupal.behaviors.select2_simple = {
    attach: function (context) {
      if (drupalSettings.select2_simple && drupalSettings.select2_simple.selector) {

        once('select2-simple', drupalSettings.select2_simple.selector).forEach(function (el) {

          // Only run on admin for multiselects and selects with many options.
          let multi = el.matches('[multiple]');
          let canProceed = multi || !drupalSettings.path.currentPathIsAdmin;

          if (!canProceed && el.querySelectorAll('option')?.length > 10) {
            canProceed = true;
          }

          if (canProceed) {
            const options = {
              deleteOnBackspace: true,
              autoGrow: true,
              maxResults: 25,
              create: false,
              minLength: 0
            };
            if (multi) {
              options.placeholder = '- Select -';
              // Remove "- None -" option because it's added automatically as
              // selected option which is confusing.
              el.querySelectorAll('option[value="_none"]').forEach(option => option.remove());
            }
            AriaAutocomplete(el, options);
          }
        });
      }
    }
  };
})(Drupal, drupalSettings, once, AriaAutocomplete);
