/**
 * Used to authenticate users against the authentication service
 * Also handles query errors
*/

'use strict';

var cognitoRegion = "eu-west-1";
var cognitoIdentityPoolId = "eu-west-1:72f9916c-eb9a-4ff2-9c0a-9c0fe19e6745";
var cognitoUserPoolId = "eu-west-1_8d92gzCo4";
var cognitoClientId = "7sn1nlqferjdvjl0ufurg0dga4";

var accessToken = undefined;
var cognitoUser = getUser();

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

function registerUser(name, email, phoneNumber, password) {

  // User Pool
  var data = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);

  // Registration Information
  var attributeList = [];

  var dataName = {
    Name: "name",
    Value: name
  };

  var dataEmail = {
    Name: "email",
    Value: email
  };

  var dataPhone = {
    Name: "phone_number",
    Value: phoneNumber
  };

  var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
  var attributePhone = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhone);

  attributeList.push(attributeName);
  attributeList.push(attributeEmail);
  attributeList.push(attributePhone);

  // Sign up
  var username = email;
  var password = password;

  userPool.signUp(username, password, attributeList, null, (err, result) => {
    if (err) {
      console.error(err, err.stack);
      alert(err.message);
      return;
    }
    var cognitoUser = result.user;
    console.log("User name is " + cognitoUser.getUsername());

    // Display code verification dialog
    $("#modalCodeVerification").modal();

  });
}

function confirmUser(username, password, verificationCode) {
  var poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  var userData = {
    Username: username,
    Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
    if (err) {
      console.error(err, err.stack);
      if (err.message.includes("Current status is CONFIRMED")) {
        loginUser(username, password, true);
        return;
      }
      alert(err.message);
      return;
    }

    console.log("Code verification result:", result);
    if (result === "SUCCESS") {
      // Login user
      console.log("username:", cognitoUser.getUsername())
      loginUser(cognitoUser.getUsername(), password, "/portal");
    } else {
      alert("Code verification failed");
    }
  });
}

function resendCode(username) {
  var poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  var userData = {
    Username: username,
    Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.resendConfirmationCode(function (err, result) {
    if (err) {
      alert(err.message || JSON.stringify(err));
      return;
    }
    console.log('call result: ' + result);
  });
}

function signIn(username, password, redirectUrl) {

  console.log("signIn called");
  console.log("username:", username);

  $("#loginerror").html("");
  $("#loginerror").hide();

  $("#updateerror").html("");
  $("#updateerror").hide();

  let authenticationData = {
    Username: username,
    Password: password
  };

  let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  let poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  let userData = {
    Username: username,
    Pool: userPool
  };

  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  console.log("Authenticating user...");
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      //let accessToken = result.getAccessToken().getJwtToken();
      AWS.config.region = cognitoRegion;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: cognitoIdentityPoolId,
        Logins: {
          [`cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`]: result.getIdToken().getJwtToken()
        }
      });

      //refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
      AWS.config.credentials.refresh((error) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Successfully logged!');
          $(location).attr("href", "/portal");
        }
      });
    },
    onFailure: function (err) {
      console.log(err);
      //alert(err.message || JSON.stringify(err));
      $("#loginerror").html(err.message);
      $("#loginerror").show();
    },
    newPasswordRequired: function (userAttributes, requiredAttributes) {
      $("#loginform").slideUp();
      $("#updatepasswordform").fadeIn();

      $("#updatepasswordform").on("submit", (e) => {
        e.preventDefault();

        if ($("#updatepasswordform").valid()) {
          console.log("User Attributes:", userAttributes);
          console.log("Required Attributes:", requiredAttributes);
          cognitoUser.completeNewPasswordChallenge($("#newpassword").val(), { "name": $("#name").val() }, {
            onSuccess: result => {
              console.log("New Password Challenge: Success!");
              AWS.config.credentials.refresh(err => {
                if (err) {
                  showMessage(err, true);
                } else {
                  showMessage("Password updated");
                  redirect(redirectUrl);
                }
              });
            },
            onFailure: function (err) {
              console.error("New Password Challenge: Failure!");
              console.error(err);
              showMessage(err.message);
              $("#updateerror").html(err.message);
              $("#updateerror").show();
            }
          });
        }
      });
    }
  });
}

function loginUser(username, password, redirectUrl) {

  var authenticationData = {
    Username: username,
    Password: password
  };

  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  var poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  var userData = {
    Username: username,
    Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      accessToken = result.getAccessToken().getJwtToken();
      if (redirectUrl) {
        redirect(redirectUrl);
      }
    },
    onFailure: function (err) {
      alert(err);
    },
    mfaRequired: function (codeDeliveryDetails) {
      var verificationCode = prompt('Please input verification code', '');
      cognitoUser.sendMFACode(verificationCode, this);
    }
  });
}

function isLoggedIn() {

  var data = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
  var cognitoUser = userPool.getCurrentUser();

  if (cognitoUser != null) {
    cognitoUser.getSession(function (err, session) {
      if (err) {
        showMessage(err.message, true);
        return;
      }

      if (!session.isValid()) {
        console.log("User session is not valid. Redirecting to login page.");
        redirect("/portal/login.html");
        return;
      }
      console.log("User session is valid");
    });
  } else {
    redirect("/portal/login.html");
  }
}

function getUser() {
  var data = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
  cognitoUser = userPool.getCurrentUser();
  console.log("cognito user:", cognitoUser);
  getAccessToken(cognitoUser).then((retrievedAccessToken) => {
    //console.log("Access token:", retrievedAccessToken);
    accessToken = retrievedAccessToken;
  }).catch((error) => {
    console.error("Error while retrieving access token:", error);
  });
  return cognitoUser;
}

function logout() {
  console.log("logout called:", cognitoUser);
  if (!cognitoUser) {
    getUser();
  }
  console.log("cognitoUser:", cognitoUser);
  cognitoUser.signOut();
  AWS.config.credentials.clearCachedId(); // Clears the cached Cognito ID associated with the currently configured identity pool ID
  redirect("/portal/login.html");
}

function forgotPassword(username) {
  var poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  var userData = {
    Username: username,
    Pool: userPool
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.forgotPassword({
    onSuccess: function (result) {
      showMessage("Password changed successfully!");
      setTimeout(() => {
        redirect("/portal/login.html");
      }, 2000);
    },
    onFailure: function (err) {
      console.error(err);
      alert(err.message);
    },
    //Optional automatic callback
    inputVerificationCode: function (data) {
      var verificationCode = prompt('We have sent you a new verification code by email. Please input it here:', '');
      var newPassword = prompt('Enter new password ', '');
      cognitoUser.confirmPassword(verificationCode, newPassword, this);
    }
  });
}

function redirect(page) {
  $(location).attr("href", page);
}

function getAccessToken(cognitoUser) {
  return new Promise((resolve, reject) => {
    if (cognitoUser != null) {
      return cognitoUser.getSession(function (err, result) {
        if (result) {
          console.log('getAccessToken: logged in.');

          // Add the User's Id Token to the Cognito credentials login map.
          AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: cognitoIdentityPoolId,
            Logins: {
              [`cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`]: result.getIdToken().getJwtToken()
            }
          });
          //console.log("Access Token is:", result.getAccessToken().getJwtToken());
          resolve(result.getAccessToken().getJwtToken());
          return;
        }
      });
    }
    reject();
  });
}

function setRequiredHeaders(xhr) {
  xhr.setRequestHeader("accesstoken", accessToken); // Get from local storage
}
