/**
 * Drupal initializer.
 * Launch as behavior and pull variables from config.
 */

((Drupal, drupalSettings) => {
  // Prevent multiple inits in modules that re-trigger the document context.
  let linkPurposeOnce;

  Drupal.behaviors.linkPurpose = {
    attach: (context) => {
      if (
        context === document &&
        !linkPurposeOnce &&
        CSS.supports('selector(:is(body))')
      ) {
        // "Supports" selector drops old browsers.
        linkPurposeOnce = true;

        const invalidClass = /([^A-Za-z0-9\-_])+/g;
        const invalidClasses = /([^A-Za-z0-9,\-_])+/g;

        const sanitizeClass = (string, defaultString) => {
          const cleanClass = string
            ? string.replaceAll(invalidClass, '')
            : false;
          return cleanClass || defaultString;
        };

        const classArray = (source, defaults) => {
          if (!source) {
            return defaults;
          }

          // Normalize spaces to commas.
          source = source.replaceAll(/(,*\s+)/g, ',');

          // Sanitize
          source = source.replaceAll(invalidClasses, '');

          // Split and remove empties.
          source = source.split(',').filter(Boolean);

          return source.length > 0 ? source : defaults;
        };

        const queryCheck = document.createDocumentFragment();
        const validateSelector = (string, fallback, selector) => {
          if (string && string.trim()) {
            // Selector exists
            try {
              queryCheck.querySelector(string);
            } catch (e) {
              console.warn(
                `Invalid selector in Link Purpose Icons for "${selector}."`,
              );
              return fallback;
            }
            return string;
          }
          return fallback;
        };

        const ignores = validateSelector(
          drupalSettings.linkpurpose.ignore,
          '',
          'Ignore elements',
        );
        let options = {
          domain: drupalSettings.linkpurpose.domain,
          roots: validateSelector(
            drupalSettings.linkpurpose.roots,
            'body',
            'Check roots',
          ),
          shadowComponents: validateSelector(
            drupalSettings.linkpurpose.shadowComponents,
            '',
            'Shadow components',
          ),
          shadowCSS: drupalSettings.linkpurpose.css_url
            ? [
                `${drupalSettings.linkpurpose.css_url}/library/css/linkpurpose.css`,
              ]
            : false,
          ignore: ignores
            ? `${ignores}, .ck-editor a, .form-textarea-wrapper a`
            : '.ck-editor, .form-textarea-wrapper',
          hideIcon: validateSelector(
            drupalSettings.linkpurpose.hideIcon,
            false,
            'Hide icon on element',
          ),
          noRunIfPresent: validateSelector(
            drupalSettings.linkpurpose.noRunIfPresent,
            '#quickedit-entity-toolbar, .layout-builder-form',
            'No run if present',
          ),
          noRunIfAbsent: validateSelector(
            drupalSettings.linkpurpose.noRunIfAbsent,
            '',
            'No run if absent',
          ),
          baseSelector: validateSelector(
            drupalSettings.linkpurpose.baseSelector,
            'a[href]',
            'Base selector',
          ),
          baseLinkClass: sanitizeClass(
            drupalSettings.linkpurpose.baseLinkClass,
            'link-purpose',
          ),
          baseIconWrapperClass: sanitizeClass(
            drupalSettings.linkpurpose.baseIconWrapperClass,
            'link-purpose-icon',
          ),
          noBreakClass: sanitizeClass(
            drupalSettings.linkpurpose.noBreakClass,
            'link-purpose-nobreak',
          ),
          noReferrer: !!drupalSettings.linkpurpose.purposeExternalNoReferrer,
          noIconOnImages: !!drupalSettings.linkpurpose.noIconOnImages,
          suppressNoBreak: validateSelector(
            drupalSettings.linkpurpose.suppressNoBreak,
            false,
            'Suppress no-break',
          ),
          insertIconOutsideHiddenSpan: validateSelector(
            drupalSettings.linkpurpose.insertIconOutsideHiddenSpan,
            '.sr-only, .visually-hidden',
            'Insert icon outside hidden span',
          ),

          purposes: {
            external: {
              selector: drupalSettings.linkpurpose.purposeExternal
                ? '[href^="https://"], [href^="http://"], [href^="//"]'
                : false,
              additionalSelector: validateSelector(
                drupalSettings.linkpurpose.purposeExternalSelector,
                '',
                'External link selector',
              ),
              newWindow: !!drupalSettings.linkpurpose.purposeExternalNewWindow,
              message: drupalSettings.linkpurpose.purposeExternalMessage
                ? drupalSettings.linkpurpose.purposeExternalMessage
                : 'Link is external',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeExternalClass,
                'link-purpose-external',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeExternalIconWrapperClass,
                'link-purpose-external-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeExternalIconType
                ? drupalSettings.linkpurpose.purposeExternalIconType
                : 'html',
              iconPosition: drupalSettings.linkpurpose
                .purposeExternalIconPosition
                ? drupalSettings.linkpurpose.purposeExternalIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeExternalIconClasses,
                ['fa-solid', 'fa-up-right-from-square'],
              ),
            },

            document: {
              selector: drupalSettings.linkpurpose.purposeDocument
                ? validateSelector(
                    drupalSettings.linkpurpose.purposeDocumentSelector,
                    "[href^='/document/'], [href$='.pdf'], [href*='.pdf?'], [href$='.doc'], [href$='.docx'], [href*='.doc?'], [href*='.docx?'], [href$='.ppt'], [href$='.pptx'], [href*='.ppt?'], [href*='.pptx?'], [href^='https://docs.google']",
                    'Document selector',
                  )
                : false,
              message: drupalSettings.linkpurpose.purposeDocumentMessage
                ? drupalSettings.linkpurpose.purposeDocumentMessage
                : 'Link downloads document',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeDocumentClass,
                'link-purpose-document',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeDocumentIconWrapperClass,
                'link-purpose-document-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeDocumentIconType
                ? drupalSettings.linkpurpose.purposeDocumentIconType
                : 'html',
              iconPosition: drupalSettings.linkpurpose
                .purposeDocumentIconPosition
                ? drupalSettings.linkpurpose.purposeDocumentIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeDocumentIconClasses,
                ['fa-regular', 'fa-file-lines'],
              ),
            },

            download: {
              selector: drupalSettings.linkpurpose.purposeDownload
                ? validateSelector(
                    drupalSettings.linkpurpose.purposeDownloadSelector,
                    '[download]',
                    'Download selector',
                  )
                : false,
              message: drupalSettings.linkpurpose.purposeDownloadMessage
                ? drupalSettings.linkpurpose.purposeDownloadMessage
                : 'Link downloads file',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeDownloadClass,
                'link-purpose-download',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeDownloadIconWrapperClass,
                'link-purpose-download-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeDownloadIconType
                ? drupalSettings.linkpurpose.purposeDownloadIconType
                : 'html',
              iconPosition: drupalSettings.linkpurpose
                .purposeDownloadIconPosition
                ? drupalSettings.linkpurpose.purposeDownloadIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeDownloadIconClasses,
                ['fa-regular', 'fa-download'],
              ),
            },

            app: {
              selector: drupalSettings.linkpurpose.purposeApp
                ? validateSelector(
                    drupalSettings.linkpurpose.purposeAppSelector,
                    ':is([href*="://"]):not([href^="/"], [href^="https:"], [href^="http:"], [href^="file:"])',
                    'App selector',
                  )
                : false,
              message: drupalSettings.linkpurpose.purposeAppMessage
                ? drupalSettings.linkpurpose.purposeAppMessage
                : 'Link opens app',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeAppClass,
                'link-purpose-app',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeAppIconWrapperClass,
                'link-purpose-app-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeAppIconType
                ? drupalSettings.linkpurpose.purposeAppIconType
                : 'html',
              iconPosition: drupalSettings.linkpurpose.purposeAppIconPosition
                ? drupalSettings.linkpurpose.purposeAppIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeAppIconClasses,
                ['fa-regular', 'fa-window-restore'],
              ),
            },

            mail: {
              selector: drupalSettings.linkpurpose.purposeMail
                ? '[href^="mailto:"]'
                : false,
              message: drupalSettings.linkpurpose.purposeMailMessage
                ? drupalSettings.linkpurpose.purposeMailMessage
                : 'Link opens email app',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeMailClass,
                'link-purpose-mailto',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeMailIconWrapperClass,
                'link-purpose-mail-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeMailIconType
                ? drupalSettings.linkpurpose.purposeMailIconType
                : 'html',
              iconPosition: drupalSettings.linkpurpose.purposeMailIconPosition
                ? drupalSettings.linkpurpose.purposeMailIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeMailIconClasses,
                ['fa-regular', 'fa-envelope'],
              ),
            },

            newWindow: {
              selector: drupalSettings.linkpurpose.purposeNewWindow
                ? '[target="_blank"]'
                : false,
              message: drupalSettings.linkpurpose.purposeNewWindowMessage
                ? drupalSettings.linkpurpose.purposeNewWindowMessage
                : 'Link opens phone app',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeNewWindowClass,
                'link-purpose-window',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeNewWindowIconWrapperClass,
                'link-purpose-window-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeNewWindowIconType
                ? drupalSettings.linkpurpose.purposeNewWindowIconType
                : 'html', // html, src or classes
              iconPosition: drupalSettings.linkpurpose
                .purposeNewWindowIconPosition
                ? drupalSettings.linkpurpose.purposeNewWindowIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeNewWindowIconClasses,
                ['fa-regular', 'fa-window-restore'],
              ),
            },

            tel: {
              selector: drupalSettings.linkpurpose.purposeTel
                ? '[href^="tel:"]'
                : false,
              message: drupalSettings.linkpurpose.purposeTelMessage
                ? drupalSettings.linkpurpose.purposeTelMessage
                : 'Link opens in new window',
              linkClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeTelClass,
                'link-purpose-tel',
              ),
              iconWrapperClass: sanitizeClass(
                drupalSettings.linkpurpose.purposeTelIconWrapperClass,
                'link-purpose-tel-icon',
              ),
              iconType: drupalSettings.linkpurpose.purposeTelIconType
                ? drupalSettings.linkpurpose.purposeTelIconType
                : 'html', // html, src or classes
              iconPosition: drupalSettings.linkpurpose.purposeTelIconPosition
                ? drupalSettings.linkpurpose.purposeTelIconPosition
                : 'beforeend',
              iconClasses: classArray(
                drupalSettings.linkpurpose.purposeTelIconClasses,
                ['fa-solid', 'fa-square-phone'],
              ),
            },
          },
        };

        if (typeof linkPurposeOptionsOverride !== 'undefined') { // eslint-disable-line
          options = linkPurposeOptions(options); // eslint-disable-line
        }

        const linkPurpose = new LinkPurpose(options); //eslint-disable-line
      }
    },
  };
})(Drupal, drupalSettings); // eslint-disable-line no-undef
