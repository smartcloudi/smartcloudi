/**
 * Used to read and write cookies
*/

'use strict';

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function setCookie(cname, cvalue, exseconds) {
  if (!exseconds) {
    exseconds = 3600; // 1 hour
  }

  var d = new Date();
  d.setTime(d.getTime() + (exseconds * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function deleteCookie(cname) {
  var d = new Date(); //Create an date object
  d.setTime(d.getTime() - (1000 * 60 * 60 * 24)); //Set the time to the past. 1000 milliseonds = 1 second
  var expires = "expires=" + d.toGMTString(); //Compose the expiration date
  window.document.cookie = cname + "=" + "; " + expires; //Set the cookie with name and the expiration date
}

function tryGetOrganization(control) {
  var currentOrganization = getCookie("organization");
  if (currentOrganization) {
    $(control).val(currentOrganization);
  }
}
