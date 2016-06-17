/* Copyright (c) 2013-2016 The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */

"use strict";
/* globals Mousetrap */

var isCordova;
var isWin;
var isWeb;

$(document).ready(function() {
  isCordova = parent.isCordova;
  isWin = parent.isWin;
  isWeb = parent.isWeb;
  
  initSearch();
});

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);

  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function showSearchPanel(e) {
  //$('#searchToolbar').slideDown(500);
  $('#searchToolbar').show();
  $('#searchBox').val('');
  $('#searchBox').focus();
}

function cancelSearch() {
  //$('#searchToolbar').slideUp(500);
  $('#htmlContent').unhighlight();
  $('#searchToolbar').hide();
  //$('#searchBox').hide();
}

function initSearch() {
  $("#findInFile").on('click', function() {
    showSearchPanel();
  });

  $("#searchExtButton").on('click', function() {
    doSearch();
  });

  $('#clearSearchExtButton').on('click', function(e) {
    cancelSearch();
  });

  $('#searchBox').keyup(function(e) {
    if (e.keyCode === 13) { // Start the search on ENTER
      doSearch();
    } else if (e.keyCode == 27) { // Hide search on ESC
      cancelSearch();
    }
  });

  Mousetrap.bind(['command+f', 'ctrl+f'], function(e) {
    showSearchPanel();
    return false;
  });
}

function doSearch() {
  $('#htmlContent').unhighlight();
  $('#searchBox').attr('placeholder', 'Search');
  var givenString = document.getElementById("searchBox").value;

  var selector = $('#htmlContent') || 'body';
  var caseSensitiveString = $('#htmlContent').highlight(givenString, {wordsOnly: false});
  var found, getSelection;

  if (window.find) { // Firefox, Google Chrome, Safari
    found = window.find(givenString);
    $('#htmlContent').highlight(givenString, {wordsOnly: false});

    var searchTermRegEx = new RegExp(found, "ig");
    var matches = $(selector).text().match(searchTermRegEx);
    if (matches) {
      if ($('.highlight:first').length) {//if match found, scroll to where the first one appears
        //$(window).animate({scrollTo:($("*:contains('"+ givenString +"')").offset().top)},"fast");
        //$(selector).animate({scrollTop: $('#htmlContent .highlight::selection').offset().top}, "fast");
        //window.find(givenString);
        //$(window).animate({scrollTop: window.find(givenString)}, "fast");
      }
    }
    if (!found || (!found && !caseSensitiveString) || !caseSensitiveString) {
      var topOfContent = $(selector).animate({scrollTop: $('#htmlContent').offset().top}, "fast");
      $('#htmlContent').unhighlight();
      $('#searchBox').val('');
      $('#searchBox').attr('placeholder', 'Search text not found. Try again.');
      return topOfContent;
    }
  }
}
