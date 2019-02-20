/**
 * Used to authenticate users against the authentication service
 * Also handles query errors
*/

'use strict';

const features = [
  "feature-compliance",
  "feature-aianalysis",
  "feature-cloudanalytics",
  "feature-ucautomation",
  "feature-gdpr",
  "MasterAdmin"
];

//#region Login

function login(username, password, redirectPage) {

  $.ajax({
    url: apiPathLogin,
    method: "POST",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
    },
    success: function (data, textStatus, jqXHR) {
      switch (jqXHR.status) {
        case 200:
          console.log(jqXHR);
          showMessage('Authentication successful');

          setCookie("comply-username", jqXHR.getResponseHeader("comply-username"), 2592000); // valid for a month
          setCookie("comply-groups", jqXHR.getResponseHeader("comply-groups"), 2592000); // valid for a month
          setCookie("comply-organization", jqXHR.getResponseHeader("comply-organization"), 2592000); // valid for a month
          setCookie("comply-orgId", jqXHR.getResponseHeader("comply-orgId"), 2592000); // valid for a month
          setCookie("Authorization", jqXHR.getResponseHeader("Authorization"), 2592000); // valid for a month

          // Redirect user to redirect URL or to main page
          $(location).attr('href', $.urlParam("redirectUrl") ? decodeURIComponent($.urlParam("redirectUrl")) : decodeURIComponent(redirectPage));
          break;
        default:
          showMessage("Unexpected response: " + textStatus);
          break;
      }
    },
    error: function (error) {
      console.error(error);
      showMessage("An error occurred. Please check your credentials.", true);
    }
  });
}

//#endregion

//#region Logout

// Top-right logout button
$("#logout").click(function () {
  logout();
});

// Also called by the logout <a> in the left sidebar
function logout() {
  deleteCookie("comply-groups");
  deleteCookie("Authorization");
  deleteCookie("comply-organization");
  deleteCookie("comply-orgId");
  $(location).attr('href', "pages-login.html");
}

//#endregion

//#region Groups

function isInGroup(groupName) {
  return $.ajax({
    url: `${apiPathLogin}/isInGroup?groupName=${groupName}`,
    method: "GET",
    beforeSend: setRequiredHeaders
  }).fail((jqXHR, textStatus, errorThrown) => {
    console.error(jqXHR);
    console.error(textStatus);
    console.error(errorThrown);
    throw errorThrown;
  });
}

function checkPageAccess() {

  // Are cookies set?
  if (getCookie("comply-groups") === "" || getCookie("comply-orgId") === "" || getCookie("comply-organization") === "" || getCookie("comply-username") === "" || getCookie("Authorization") === "") {
    redirect("pages-login.html");
  }

  switch (window.location.pathname) {
    case "/pages-cloud-analytics-purecloud.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-cloudanalytics"]);
      break;
    case "/pages-doc-analyzer.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-aianalysis"]);
      break;
    case "/pages-gdpr.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-gdpr"]);
      break;
    case "/pages-journeys.html":
    case "/pages-survey-questions.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-compliance"]);
      break;
    case "/pages-organizations.html":
      checkAccess(["MasterAdmin", "MasterUser"]);
      break;
    case "/pages-uc-automation-purecloud.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-ucautomation"]);
      break;
    case "/pages-processes.html":
      checkAccess(["MasterAdmin", "MasterUser", "feature-compliance"]);
      break;
    default:
      console.debug("Page is not covered by access check");
      break;
  }
}

function checkAccess(groupsAllowed) {
  let canAccess = false;
  let deferreds = [];

  $.each(groupsAllowed, (i, groupAllowed) => {
    deferreds.push(isInGroup(groupAllowed));
  });

  $.when.apply(null, deferreds).done(() => {
    $.each(deferreds, (i, deferred) => {
      if (deferred.status == 200 && deferred.responseJSON) {
        canAccess = true;
        return false; // Exit each loop
      }
    });
    if (!canAccess) {
      redirect("index.html");
    }
  });
}

//#endregion

//#region Query Errors

function handleQueryError(jqXHR, textStatus, errorThrown) {
  console.error(jqXHR);
  console.error(textStatus);
  console.error(errorThrown);
  switch (jqXHR.status) {
    case 0:
      // Browser refused to connect for some reason
      showMessage("Failed to retrieve data (are you still connected?)", true);
      console.error(jqXHR);
      console.error(textStatus);
      console.error(errorThrown);
      break;
    case 400:
      showMessage("Bad Request", true);
      console.error("Bad Request");
      break;
    case 401:
      showMessage("Unauthorized", true);
      console.error("Unauthorized");
      redirect("pages-login.html?redirectUrl=" + encodeURIComponent($(location).attr('href')));
      break;
    case 404:
      console.error("Not found");
    default:
      showMessage(`(${textStatus}) ${errorThrown}`, true);
      console.error(`Unknown error: ${textStatus}, ${errorThrown}`);
      console.error(jqXHR);
      break;
  }
}

//#endregion

//#region Features

if (window.location.pathname != "/pages-login.html") {
  $.each(features, (i, feature) => {
    isInGroup(feature).then((isEnabled) => {
      if (isEnabled) {
        $("." + feature).show();
      } else {
        $("." + feature).hide();
      }
      //isEnabled ? $("." + feature).show() : $("." + feature).hide();
    }).catch((err) => {
      console.error(err);
    });
  });
}

//#endregion

//#region Headers

function setRequiredHeaders(xhr) {
  xhr.setRequestHeader("Authorization", getCookie("Authorization"));
  xhr.setRequestHeader("comply-username", getCookie("comply-username"));
  xhr.setRequestHeader("comply-groups", getCookie("comply-groups"));
  xhr.setRequestHeader("comply-organization", getCookie("comply-organization"));
  xhr.setRequestHeader("comply-orgId", getCookie("comply-orgId"));
}

//#endregion

//#region Kafka

// Publish kafka message
function publishMessage(topic, key, message) {
  let data = {
    "orgId": getCookie("comply-orgId"),
    "username": getCookie("comply-username"),
    "topic": topic,
    "key": key,
    "message": message
  };

  console.log("Publishing", data);

  $.ajax({
    url: apiPathKafka,
    dataType: "json",
    method: "POST",
    beforeSend: setRequiredHeaders,
    data: data,
    dataType: "text" // https://stackoverflow.com/a/12936894/2667890
  }).done((data, textStatus, jqXHR) => {
    switch (jqXHR.status) {
      case 201:
        console.log("kafka message published");
        break;
      default:
        console.error("Failed to publish kafka message");
        break;
    }
  }).fail(handleQueryError);
}
//#endregion

function redirect(page) {
  $(location).attr("href", page);
}