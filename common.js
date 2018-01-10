/* Copyright (c) 2013-present The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

'use strict';

const isCordova = document.URL.indexOf('file:///android_asset') === 0; // TODO consider ios case
const isWeb =
  document.URL.startsWith('http') &&
  !document.URL.startsWith('http://localhost:1212/');

function getParameterByName(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(location.search);

  return results === null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function getFileContentPromise(fullPath, type) {
  return new Promise((resolve, reject) => {
    let fileURL = fullPath;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileURL, true);
    xhr.responseType = type || 'arraybuffer';
    xhr.onerror = reject;

    xhr.onload = () => {
      const response = xhr.response || xhr.responseText;
      if (response) {
        resolve(response);
      } else {
        reject('getFileContentPromise error');
      }
    };
    xhr.send();
  });
}

function initI18N(locale, filename) {
  getFileContentPromise('./locales/en_US/' + filename, 'text') // loading fallback lng
    .then(enLocale => {
      var i18noptions = {
        lng: locale,
        // debug: true,
        resources: {},
        fallbackLng: 'en_US'
      };
      i18noptions.resources['en_US'] = {};
      i18noptions.resources['en_US'].translation = JSON.parse(enLocale);
      getFileContentPromise('./locales/' + locale + '/' + filename, 'text')
        .then(content => {
          i18noptions.resources[locale] = {};
          i18noptions.resources[locale].translation = JSON.parse(content);
          i18next.init(i18noptions, () => {
            jqueryI18next.init(i18next, $); // console.log(i18next.t('startSearch'));
            $('body').localize();
          });
          return true;
        })
        .catch(error => {
          console.log('Error getting specific i18n locale: ' + error);
          i18next.init(i18noptions, () => {
            jqueryI18next.init(i18next, $); // console.log(i18next.t('startSearch'));
            $('body').localize();
          });
        });
      return true;
    })
    .catch(error => console.log('Error getting default i18n locale: ' + error));
}

function sendMessageToHost(message) {
  if (typeof sendToParent === 'function') {
    sendToParent(message);
  } else {
    window.parent.postMessage(JSON.stringify(message), '*');
  }
}

$(document).ready(function() {
  // Disable drag events in extensions
  $(document).on('drop dragend dragenter dragover', function(event) {
    event.preventDefault();
  });

  // Hide all menus in TS on click in extension
  $(document).on('click', function(event) {
    fireHideAllMenusEvent();
  });

  function fireHideAllMenusEvent() {
    var msg = { command: 'hideAllMenus' };
    sendMessageToHost(msg);
  }

  // Init about box functionality
  $('#aboutExtensionModal').on('show.bs.modal', function() {
    $.ajax({
      url: 'README.md',
      type: 'GET'
    })
      .done(function(mdData) {
        //console.log("DATA: " + mdData);
        if (marked) {
          var modalBody = $('#aboutExtensionModal .modal-body');
          modalBody.html(marked(mdData, { sanitize: true }));
          handleLinks(modalBody);
        } else {
          console.log('markdown to html transformer not found');
        }
      })
      .fail(function(data) {
        console.warn('Loading file failed ' + data);
      });
  });

  function handleLinks($element) {
    $element.find('a[href]').each(function() {
      var currentSrc = $(this).attr('href');
      $(this).bind('click', function(e) {
        e.preventDefault();
        var msg = { command: 'openLinkExternally', link: currentSrc };
        sendMessageToHost(msg);
      });
    });
  }

  $('#aboutButton').on('click', function(e) {
    $('#aboutExtensionModal').modal({ show: true });
  });

  $('.roundButton').on('click', function(e) {
    fireHideAllMenusEvent();
  });

  // Activating the print functionality
  $('#printButton').on('click', function(e) {
    window.print();
  });

  if (isCordova) {
    $('#printButton').hide();
  }

  initSearch();
});

function showSearchPanel(e) {
  //$('#searchToolbar').slideDown(500);
  $('#searchToolbar').show();
  $('#searchBox').val('');
  $('#searchBox').focus();
}

function cancelSearch() {
  //$('#searchToolbar').slideUp(500);
  //$('#htmlContent').unhighlight();
  $('#searchToolbar').hide();
  //$('#searchBox').hide();
}

function initSearch() {
  $('#findInFile').on('click', function() {
    showSearchPanel();
  });

  $('#searchExtButton').on('click', function() {
    doSearch();
  });

  $('#clearSearchExtButton').on('click', function(e) {
    cancelSearch();
  });

  $('#searchBox').keyup(function(e) {
    if (e.keyCode === 13) {
      // Start the search on ENTER
      doSearch();
    }
  });

  $(window).keyup(function(e) {
    if (e.keyCode == 27) {
      // Hide search on ESC
      cancelSearch();
    }
  });
  //
  //Mousetrap.bind(['command+f', 'ctrl+f'], function(e) {
  //  showSearchPanel();
  //  return false;
  //});
  window.addEventListener('keyup', function keyup(evt) {
    var handled = false;
    var cmd =
      (evt.ctrlKey ? 1 : 0) |
      (evt.altKey ? 2 : 0) |
      (evt.shiftKey ? 4 : 0) |
      (evt.metaKey ? 8 : 0);
    /*
     First, handle the key bindings that are independent whether an input
     control is selected or not.
     */
    if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
      // either CTRL or META key with optional SHIFT.
      switch (evt.keyCode) {
        case 70: // f
          //open custom search/find text
          handled = true;
          break;
        case 71: //g
          //find next
          handled = true;
          break;
        case 61: // FF/Mac "="
        case 107: // FF "+" and "="
        case 187: // Chrome "+"
        case 171: // FF with German keyboard
          //zoom in
          handled = true;
          break;
        case 173: // FF/Mac "-"
        case 109: // FF "-"
        case 189: // Chrome "-"
          //zoom out
          handled = true;
          break;
      }
    }

    // CTRL or META without shift
    if (cmd === 1 || cmd === 8) {
      switch (evt.keyCode) {
        case 70: // f
          showSearchPanel(); //open custom search/find text
          handled = true;
          break;
      }
    }

    // CTRL+ALT or Option+Command
    if (cmd === 3 || cmd === 10) {
      switch (evt.keyCode) {
        case 80: //p
          //presentaion mode
          handled = true;
          break;
        case 71: //g
          //focus page number dialoge
          handled = true;
          break;
      }
    }
    if (handled) {
      evt.preventDefault();
      return;
    }
  });
}

function doSearch() {
  //$('#htmlContent').unhighlight();
  $('#searchBox').attr('placeholder', 'Search');
  var givenString = document.getElementById('searchBox').value;

  var selector = $('#htmlContent') || 'body';
  var caseSensitiveString = $('#htmlContent').highlight(givenString, {
    wordsOnly: false
  });
  var found, getSelection;

  if (window.find) {
    // Firefox, Google Chrome, Safari
    found = window.find(givenString);
    $('#htmlContent').highlight(givenString, { wordsOnly: false });

    var searchTermRegEx = new RegExp(found, 'ig');
    var matches = $(selector)
      .text()
      .match(searchTermRegEx);
    if (matches) {
      if ($('.highlight:first').length) {
        //if match found, scroll to where the first one appears
        //$(window).animate({scrollTo:($("*:contains('"+ givenString +"')").offset().top)},"fast");
        //$(selector).animate({scrollTop: $('#htmlContent .highlight::selection').offset().top}, "fast");
        //window.find(givenString);
        //$(window).animate({scrollTop: window.find(givenString)}, "fast");
      }
    }
    if (!found || (!found && !caseSensitiveString) || !caseSensitiveString) {
      var topOfContent = $(selector).animate(
        { scrollTop: $('#htmlContent').offset().top },
        'fast'
      );
      //$('#htmlContent').unhighlight();
      $('#searchBox').val('');
      $('#searchBox').attr('placeholder', 'Search text not found. Try again.');
      return topOfContent;
    }
  }
}
