// A fork of https://github.com/cferdinandi/tabby created of the commit 04754591c18339bff20c229f553e5e3be15b807e
// Reason for the fork:
// https://jira.princeton.edu/jira/browse/PS-2114 (based on the work in https://jira.princeton.edu/jira/browse/PS-1757)
// To accommodate the new scroll and dropdown functionality, the tabs structure had to be changed, which lead to
// duplicated code in several different places, some added in templates, other as a js script.
// To accommodate the changes and prevent duplicates and rewrites, the tabby js was forked and modified to suit our needs.
// The main changes were:
// - Adding the custom html around the tab list that has the necessary classes and elements.
// - Switching to receive the entire4 tabs object instead of a selector, to prevent confusion in case there are multiple
//    instances on the same page
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(root);
  } else {
    root.Tabby = factory(root);
  }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {

  'use strict';

  //
  // Variables
  //

  var defaults = {
    idPrefix: 'tabby-toggle_',
    default: '[data-tabby-default]'
  };

  let isSubnavOpened = false;

  // Only slide animate if user has not requested reducing motion.
  const animationBehavior = window.matchMedia("(prefers-reduced-motion)").matches || document.body.matches(':not(.btn-v1)') ? 'auto' : 'smooth';

  // PS-3193 Pill animations.
  const pillStylesEnabled = document.querySelector('body:not(.btn-v1)');
  const animatePill = function (targetLink, suppressAnimation = false, delay = 250, loop = 0) {

    if (!pillStylesEnabled) {
      return;
    }

    if (loop < 2) {
      loop++;
      window.setTimeout( () => {
        const rects = targetLink.getBoundingClientRect();
        const menu = targetLink.closest('.tabby-menu__nav-wrapper');
        if (menu) {
          const menuRects = menu.getBoundingClientRect();
          const pill = menu.querySelector('.pill-bg');
          pill.style.setProperty('left', `calc(${rects.left - menuRects.left}px)`);
          pill.style.setProperty('width', `${rects.width - 4}px`);
          if (suppressAnimation) {
            pill.style.setProperty('transition', 'none');
          } else {
            pill.style.removeProperty('transition');
          }
          menu.classList.add('pill-ready');
        }
        animatePill(targetLink, false, 250, loop);
      }, delay, targetLink, loop);
    }

  };

  //
  // Methods
  //

  /**
   * Merge two or more objects together.
   * @param   {Object}   objects  The objects to merge together
   * @returns {Object}            Merged values of defaults and options
   */
  var extend = function () {
    var merged = {};
    Array.prototype.forEach.call(arguments, function (obj) {
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) return;
        merged[key] = obj[key];
      }
    });
    return merged;
  };

  /**
   * Emit a custom event
   * @param  {String} type    The event type
   * @param  {Node}   tab     The tab to attach the event to
   * @param  {Node}   details Details about the event
   */
  var emitEvent = function (tab, details) {

    // Create a new event
    var event;
    if (typeof window.CustomEvent === 'function') {
      event = new CustomEvent('tabby', {
        bubbles: true,
        cancelable: true,
        detail: details
      });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('tabby', true, true, details);
    }

    // Dispatch the event
    tab.dispatchEvent(event);

  };

  /**
   * Remove roles and attributes from a tab and its content
   * @param  {Node}   tab      The tab
   * @param  {Node}   content  The tab content
   * @param  {Object} settings User settings and options
   */
  var destroyTab = function (tab, content, settings) {

    // Remove the generated ID
    if (tab.id.slice(0, settings.idPrefix.length) === settings.idPrefix) {
      tab.id = '';
    }

    // Remove roles
    tab.removeAttribute('role');
    tab.removeAttribute('aria-controls');
    tab.removeAttribute('aria-selected');
    tab.removeAttribute('tabindex');
    tab.closest('li').removeAttribute('role');
    content.removeAttribute('role');
    content.removeAttribute('aria-labelledby');
    content.removeAttribute('hidden');

    // Remove handlers
    // PS-2415 added handler removal; may not work correctly.
    tab.removeEventListener('click', clickHandler);
    tab.removeEventListener('keydown', maybeSpaceHandler);

  };

  /**
   * Add the required roles and attributes to a tab and its content
   * @param  {Node}   tab      The tab
   * @param  {Node}   content  The tab content
   * @param  {Object} settings User settings and options
   */
  var setupTab = function (tab, content, settings, hashMatch) {

    // Give tab an ID if it doesn't already have one
    if (!tab.id) {
      tab.id = settings.idPrefix + content.id;
    }

    // Add roles
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', content.id);
    tab.closest('li').setAttribute('role', 'presentation');
    content.setAttribute('role', 'tabpanel');
    // Disabling content tabindex see PS-2561.
    // content.setAttribute('tabindex', '0');
    content.setAttribute('aria-labelledby', tab.id);

    // Add selected state
    // PS-2415: check for hash match first to prevent race condition.
    if (hashMatch && tab.getAttribute('href') === window.location.hash) {
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
    // PS-324: scroll to hash match on load.
      window.setTimeout(function () {
        tab.scrollIntoView();
        animatePill(tab);
      },500,tab);
    } else if (!hashMatch && tab.matches(settings.default)) {
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      animatePill(tab);
    } else {
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('tabindex', '-1');
      content.setAttribute('hidden', 'hidden');
    }


  };

  /**
   * Hide a tab and its content
   * @param  {Node} newTab The new tab that's replacing it
   */
  var hide = function (newTab) {
    // Variables
    const tabGroup = newTab.closest('ul');
    if (!tabGroup) {return;}
    const prevTab = tabGroup.querySelector('[role="tab"][aria-selected="true"]');
    if (!prevTab) {return;}

    let prevContent;
    // Hide the tab
    prevContent = document.querySelector(`${prevTab.getAttribute('href')}`);
    // Hide the content
    if (!prevContent) {
      return; //previousTab: tabs[0];};
    }
    prevContent.setAttribute('hidden', 'hidden');
    prevTab.setAttribute('aria-selected', 'false');
    prevTab.setAttribute('tabindex', '-1');

    // Return the hidden tab and content
    return {
      previousTab: prevTab,
      previousContent: prevContent,
    };

  };

  var closeMenu = function () {
    let navToggle = document.querySelector('button.tabby-menu__open-dropdown');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.nextElementSibling.classList.remove('opened');
    isSubnavOpened = false;
  };

  /**
   * Show a tab and its content
   * @param  {Node} tab      The tab
   * @param  {Node} content  The tab content
   */
  var show = function (tab, content) {
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    if (tab.closest('ul').querySelector(':focus')) {
      tab.focus();
    }
    content.removeAttribute('hidden');

    animatePill(tab, 0);
  };

  /**
   * Toggle a new tab
   * @param  {Node} tab The tab to show
   */
  var toggle = function (tab) {

    // Make sure there's a tab to toggle and it's not already active
    if (!tab || tab.getAttribute('aria-selected') === 'true') {
      return;
    }

    // Variables
    var content = document.querySelector(`${tab.getAttribute('href')}`);
    if (!content) {
      return;
    }

    // Hide active tab and content
    var details = hide(tab);

    // Show new tab and content
    show(tab, content);

    // Add event details
    details.tab = tab;
    details.content = content;

    // Emit a custom event
    emitEvent(tab, details);
  };

  /**
   * Get all of the tabs in a tablist
   * @param  {Node}   tab  A tab from the list
   * @return {Object}      The tabs and the index of the currently active one
   */
  var getTabsMap = function (tab) {
    var tabGroup = tab.closest('[role="tablist"]');
    var tabs = tabGroup ? tabGroup.querySelectorAll('[role="tab"]') : null;
    if (!tabs) return;
    return {
      tabs: tabs,
      index: Array.prototype.indexOf.call(tabs, tab)
    };
  };

  /**
   * Switch the active tab based on keyboard activity
   * @param  {Node} tab The currently active tab
   * @param  {Key}  key The key that was pressed
   */
  var switchTabs = function (tab, key) {

    // Get a map of tabs
    var map = getTabsMap(tab);
    if (!map) {return;}
    var length = map.tabs.length - 1;
    var index = false;

    // PS-2561: hard-coded to horizontal.
    // Go to previous tab.
    if (['ArrowLeft', 'Left'].indexOf(key) > -1) {
      index = map.index < 1 ? length : map.index - 1;
    }

    // Go to next tab.
    else if (['ArrowRight', 'Right'].indexOf(key) > -1) {
      index = map.index === length ? 0 : map.index + 1;
    }

    // Go to home.
    // PS-2415: this was not working correctly and is optional.
    /*    else if (key === 'Home') {
          index = 0;
        }

        // Go to end
        else if (key === 'End') {
          index = length;
        }*/

    // Toggle the tab
    toggle(map.tabs[index]);

  };

  /**
   * Create the Constructor object
   */
  var Constructor = function (selector, options) {

    //
    // Variables
    //

    var publicAPIs = {};
    var settings, tabWrapper;
    const initialElement = selector.cloneNode(true);


    // Make sure the id for the current tabs is unique
    const allTabs = document.querySelectorAll('[id*="tabby-wrapper"]');
    let newId = 'tabby-wrapper-1';
    if (allTabs.length) {
      let ids = Object.values(allTabs).map((item) => {
        return parseInt(item.id.split("-", 3)[2]);
      });
      newId = `tabby-wrapper-${Math.max.apply(null, ids) + 1}`;
    }

    // Checks for spacebar press on tab control buttons.
    const maybeSpaceHandler = (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        clickHandler(event);
      }
    }

    // Rewrap the tabs to add the needed markup
    // Note: as of PS-6328 the Select tab button never appears and can be removed in future sprints.
    let currentTabs = document.createElement('div');
    currentTabs.setAttribute('id', newId);
    currentTabs.classList.add('tabby-menu', 'tabby-menu-populated', 'tabby-menu-horizontal');
    currentTabs.innerHTML = '<div class="tabby-menu__wrapper">' +
      '<div class="tabby-menu__dropdown">' +
      '<button aria-expanded="false" type="button" class="tabby-menu__open-dropdown">Select tab</button>' +
      '<ul class="tabby-menu__dropdown-nav" data-tabs></ul>' +
      '</div>' +
      '<div class="tabby-menu__nav-wrapper">' +
      '<div class="tabby-menu__nav-left">' +
      '<button type="button" aria-label="Scroll left">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sc-gsDKAQ gxFfgh"> <path fill-rule="evenodd" clip-rule="evenodd" d="M14.2071 7.29289C14.5976 7.68342 14.5976 8.31658 14.2071 8.70711L10.9142 12L14.2071 15.2929C14.5976 15.6834 14.5976 16.3166 14.2071 16.7071C13.8166 17.0976 13.1834 17.0976 12.7929 16.7071L8.79289 12.7071C8.60536 12.5196 8.5 12.2652 8.5 12C8.5 11.7348 8.60536 11.4804 8.79289 11.2929L12.7929 7.29289C13.1834 6.90237 13.8166 6.90237 14.2071 7.29289Z" fill="currentColor"></path> </svg> ' +
      '</button>' +
      '</div>' +
      '<ul class="tabby-menu__nav" data-tabs role="tablist" aria-orientation="horizontal"></ul>' +
      '<div class="tabby-menu__nav-right">' +
      '<button type="button" aria-label="Scroll right">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sc-gsDKAQ gxFfgh"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.79289 16.7071C9.40237 16.3166 9.40237 15.6834 9.79289 15.2929L13.0858 12L9.79289 8.70711C9.40237 8.31658 9.40237 7.68342 9.79289 7.29289C10.1834 6.90237 10.8166 6.90237 11.2071 7.29289L15.2071 11.2929C15.3946 11.4804 15.5 11.7348 15.5 12C15.5 12.2652 15.3946 12.5196 15.2071 12.7071L11.2071 16.7071C10.8166 17.0976 10.1834 17.0976 9.79289 16.7071Z" fill="currentColor"></path></svg>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>';
    if (document.body.matches(':not(.btn-v1')) {
      const innerWrap = currentTabs.querySelector('.tabby-menu__nav-wrapper');
      const pillBg = document.createElement('div');
      pillBg.classList.add('pill-bg');
      innerWrap.insertAdjacentElement('afterbegin', pillBg);
    }

    // Insert the newly wrapped list before the old one
    selector.parentNode.insertBefore(currentTabs, selector);
    // Replace the initial selector with the new element
    newId = `#${newId}`;
    // Remove the old element
    currentTabs.nextElementSibling.remove();
    currentTabs.getElementsByClassName("tabby-menu__dropdown-nav")[0].innerHTML = initialElement.innerHTML;
    currentTabs.getElementsByClassName("tabby-menu__nav")[0].innerHTML = initialElement.innerHTML;
    currentTabs.getElementsByClassName('tabby-menu__wrapper')[0].classList.add("show");

    window.setTimeout( function() {
      // Detach the debouncedHandleFragmentLinkClickOrHashChange handler from core/misc/form.js
      // This was added in PS-2307 and removed in PS-2894. The hashchange handler messes with focus.
      // jQuery(document).off('click.form-fragment', 'a[href*="#"]');

      // Add our click handler instead
      currentTabs.querySelectorAll('a').forEach( (el) => {
        el.addEventListener('click', clickHandler);
        el.addEventListener('keydown', maybeSpaceHandler);
      });

      // Short timeout in hopes we run after that.
    }, 100, currentTabs);



    // Dropdown nav open/close
    currentTabs.querySelector('.tabby-menu__open-dropdown').addEventListener("click", (e) => {
      isSubnavOpened = !isSubnavOpened;

      const nav = e.target.nextElementSibling;
      if (isSubnavOpened) {
        nav.classList.add('opened');
      } else {
        nav.classList.remove('opened');
      }
      e.target.setAttribute('aria-expanded', isSubnavOpened);
    });

    const menu = currentTabs.getElementsByClassName("tabby-menu__nav")[0];
    const wrapper = currentTabs.getElementsByClassName("tabby-menu__wrapper")[0];
    let links = menu.querySelectorAll('a');

    // On resize check if the menu is too long and  dropdown nav and arrows are needed.
    const controlsOnResize = () => {
      if (menu.clientWidth + menu.scrollLeft === menu.scrollWidth) {
        wrapper.classList.add('no-arrows');
      } else {
        menu.scroll({
          left: menuItemCenterOffset(currentTabs.querySelector('.tabby-menu__nav [aria-selected="true"]')),
          top: 0,
          behavior: animationBehavior
        });
        wrapper.classList.remove('no-arrows');
      }
    };

    const clickViaArrow = (links, direction) => {
      // PS-3193 Pill design.
      let activeIndex;
      Array.from(links).some((link, i) => {
        if (link.matches('[aria-selected="true"]')) {
          activeIndex = i;
          return true;
        }
      });
      let targetLink;
      if (direction === 'right') {
        targetLink = activeIndex < links.length - 1 ? links[activeIndex + 1] : links[0];
      } else {
        targetLink = activeIndex > 0 ? links[activeIndex - 1] : links[links.length - 1];
      }
      targetLink.click();

      if (pillStylesEnabled) {
        animatePill(targetLink);
      }
    };

    // Check the position of the menu; figure out which arrow should be visible.
    const arrowsOnScroll = (suppressAnimation) => {
      const left = currentTabs.getElementsByClassName("tabby-menu__nav-left")[0];
      const right = currentTabs.getElementsByClassName("tabby-menu__nav-right")[0];
      if (menu.scrollLeft === 0) {
        // Move focus before removing a focused element from the tab index.
        if (document.activeElement === left.querySelector('button')) {
          const transfer = document.activeElement.closest('.tabby-menu__nav-wrapper').querySelector('li:first-child a');
          if (transfer && transfer.matches('.enhance-focus a')) {
            transfer.focus();
          }
        }
        left.classList.remove('show');
      } else {
        left.classList.add('show');
      }
      // allow 2px for rounding errors
      if ((menu.clientWidth + menu.scrollLeft) >= menu.scrollWidth - 2) {
        if (document.activeElement === right.querySelector('button')) {
          // Move focus before removing a focused element from the tab index.
          const transfer = document.activeElement.closest('.tabby-menu__nav-wrapper').querySelector('li:last-child a');
          if (transfer && transfer.matches('.enhance-focus a')) {
            transfer.focus();
          }
        }
        right.classList.remove('show');
      } else {
        right.classList.add('show');
      }

      if (pillStylesEnabled) {
        const selected = currentTabs.querySelector('.tabby-menu__nav-wrapper a[aria-selected="true"]');
        animatePill(selected, suppressAnimation);
      }

    };

    window.setTimeout(
      // Wait until browser has folded tabs together to check offsets.
      function () {
        controlsOnResize();
        arrowsOnScroll();
      }, 100);

    window.onresize = function () {
      controlsOnResize();
      arrowsOnScroll(true);
    };

    menu.addEventListener('scroll', () => {
      // handle the scroll event
      arrowsOnScroll();
    });

    // On arrow click scroll the menu
    currentTabs.getElementsByClassName("tabby-menu__nav-left")[0].addEventListener("click", function (e) {
      // Find the link that intersects the LEFT edge AND will fit.
      let links = e.target.closest('.tabby-menu__nav-wrapper').querySelectorAll('a');
      clickViaArrow(links, 'left');
    });

    currentTabs.getElementsByClassName("tabby-menu__nav-right")[0].addEventListener("click", function (e) {
      // Find the first link that intersects the RIGHT edge AND will fit.
      let push = 0;
      let links = e.target.closest('.tabby-menu__nav-wrapper').querySelectorAll('a');
      clickViaArrow(links, 'right');
    });

    //
    // Methods
    //
    /**
     * Calculate how to align the active element
     */
    var menuItemCenterOffset = function( item ) {
      let menuWidth = currentTabs.querySelector('.tabby-menu__nav').clientWidth;
      let menuItemWidth = item.clientWidth;
      let arrowButtonWidth = 2 * parseFloat(psEmSize());
      let scrollTo = item.offsetLeft;
      if (item && menuItemWidth + (2 * arrowButtonWidth) < menuWidth) {
        // Room to center item between the two arrow buttons.
        scrollTo = scrollTo + arrowButtonWidth - ((menuWidth - menuItemWidth) / 2);
      } else {
        // Left align overflowing item.
        scrollTo = scrollTo - arrowButtonWidth;
      }
      return scrollTo;
    };

    /**
     * Handle click events
     */
    var clickHandler = function (event) {

      // Only run on toggles
      var tab = event.target.closest(newId + ' [role="tab"]');
      if (!tab) return;

      // Prevent link behavior
      event.preventDefault();

      // Toggle the tab
      toggle(tab);

      menu.scroll({
        left: menuItemCenterOffset(currentTabs.querySelector('.tabby-menu__nav [aria-selected="true"]')) - 32,
        top: 0,
        behavior: animationBehavior
      });

      closeMenu();

    };

    /**
     * Handle keydown events
     */

    var keyHandler = function (e) {

      // Only run if a tab is in focus
      var tab = document.activeElement;
      if (!tab.matches(newId + ' [role="tab"]')) {
        return;
      }

      // Only run for specific keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Up', 'Down', 'Left', 'Right'].indexOf(e.key) < 0) return;

      e.preventDefault();

      // Switch tabs
      switchTabs(tab.closest('ul').querySelector('[aria-selected="true"]'), e.key);

    };

    publicAPIs.destroy = function () {

      // Get all tabs
      var tabs = tabWrapper.querySelectorAll('a');

      // Add roles to tabs
      Array.prototype.forEach.call(tabs, function (tab) {

        // Get the tab content
        var content = document.querySelector(`#${tab.getAttribute('aria-controls')}`);
        if (!content) return;

        // Setup the tab
        destroyTab(tab, content, settings);

      });

      // Remove role from wrapper
      tabWrapper.removeAttribute('role');

      // Remove event listeners
      document.documentElement.removeEventListener('click', clickHandler, true);
      tabWrapper.removeEventListener('keydown', keyHandler, true);

      // Reset variables
      settings = null;
      tabWrapper = null;

    };

    /**
     * Setup the DOM with the proper attributes
     */
    publicAPIs.setup = function () {

      // Variables
      tabWrapper = currentTabs;
      if (!tabWrapper) return;
      var tabs = tabWrapper.querySelectorAll('a');

      // Thanks once again to https://stackoverflow.com/questions/34849001/check-if-css-selector-is-valid
      const queryCheck = (s) => document.createDocumentFragment().querySelector(s)

      const isSelectorValid = (selector) => {
        try { queryCheck(selector) } catch { return false }
        return true
      }
      const hashMatch = window.location.hash && isSelectorValid(window.location.hash) && tabWrapper.querySelector(`[href='${window.location.hash}'`);

      // Add roles to tabs
      Array.prototype.forEach.call(tabs, function (tab) {

        // Get the tab content
        var content = document.querySelector(`${tab.getAttribute('href')}`);
        if (!content) return;

        // Setup the tab
        setupTab(tab, content, settings, hashMatch);

      });

    };

    /**
     * Toggle a tab based on an ID
     * @param  {String|Node} id The tab to toggle
     */
    publicAPIs.toggle = function (id) {

      // Get the tab
      var tab = id;
      if (typeof id === 'string') {
        tab = document.querySelectorAll(newId + ' [role="tab"][href*="' + id + '"]');
      }

      // Toggle the tab
      toggle(tab);

    };

    /**
     * Initialize the instance
     */
    var init = function () {

      // Merge user options with defaults
      settings = extend(defaults, options || {});

      // Setup the DOM
      publicAPIs.setup();

      // Add event listener
      tabWrapper.addEventListener('keyup', keyHandler, true);

    };


    //
    // Initialize and return the Public APIs
    //

    init();
    return publicAPIs;

  };


  //
  // Return the Constructor
  //

  return Constructor;

});
