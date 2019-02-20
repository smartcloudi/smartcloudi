
var prodLogin = true; // If true, uses production to authenticate
var prodServices = true; // If false, local dev paths will be used for services

var prodPath = "https://api.comply-online.com/api/v1"
var devPath = "http://localhost:3000/api/v1";
var devPath2 = "http://localhost:3001/api/v1";

// Login
var apiPathLogin = `${prodLogin ? prodPath : devPath}/login`;

// Organizations
var apiPathOrganizations = `${prodServices ? prodPath : devPath}/organizations`;
var apiPathCountries = `${prodServices ? prodPath : devPath}/organizations/${$.urlParam("orgId")}/countries`;
var apiPathLocations = `${prodServices ? prodPath : devPath}/organizations/${$.urlParam("orgId")}/countries/${$.urlParam("countryId")}/locations`;
var apiPathTaskGroups = `${prodServices ? prodPath : devPath}/organizations/${$.urlParam("orgId")}/countries/${$.urlParam("countryId")}/locations/${$.urlParam("locationId")}/taskgroups`;

// Processes
var apiPathTags = `${prodServices ? prodPath : devPath}/tags`;
//var apiPathTags = `${devPath2}/tags`;
var apiPathProcesses = `${prodServices ? prodPath : devPath}/processes`;
//var apiPathProcesses = `${devPath2}/processes`;
var apiPathItems = `${prodServices ? prodPath : devPath}/processes/${$.urlParam("processId")}/items`;
//var apiPathItems = `${devPath2}/processes/${$.urlParam("processId")}/items`;
var apiPathSections = `${prodServices ? prodPath : devPath}/processes/${$.urlParam("processId")}/items/${$.urlParam("itemId")}/sections`;
//var apiPathSections = `${devPath2}/processes/${$.urlParam("processId")}/items/${$.urlParam("itemId")}/sections`;
var apiPathCategories = `${prodServices ? prodPath : devPath}/categories`;
//var apiPathCategories = `${devPath2}/categories`;
var apiPathRequirements = `${prodServices ? prodPath : devPath}/requirements`;
//var apiPathRequirements = `${devPath2}/requirements`;
var apiPathAvailableQuestions = `${prodServices ? prodPath : devPath}/questions`;
//var apiPathAvailableQuestions = `${devPath2}/questions`;
var apiPathTasks = `${prodServices ? prodPath : devPath}/tasks`;
//var apiPathTasks = `${devPath2}/tasks`;

// Journeys
var apiPathJourneys = `${prodServices ? prodPath : devPath}/organizations/${getCookie("comply-orgId")}/journeys`;
//var apiPathJourneys = `${devPath}/organizations/${getCookie("comply-orgId")}/journeys`;
var apiPathSurveys = `${prodServices ? prodPath : devPath}/organizations/${getCookie("comply-orgId")}/journeys/${$.urlParam("journeyId")}/surveys`;
//var apiPathSurveys = `${devPath}/organizations/${getCookie("comply-orgId")}/journeys/${$.urlParam("journeyId")}/surveys`;

// Questions
var apiPathSelectedQuestions = `${prodServices ? prodPath : devPath}/organizations/${$.urlParam("orgId")}/journeys/${$.urlParam("journeyId")}/surveys/${$.urlParam("surveyId")}/surveyquestions`;
// var apiPathSelectedQuestions = `${devPath}/organizations/${$.urlParam("orgId")}/journeys/${$.urlParam("journeyId")}/surveys/${$.urlParam("surveyId")}/surveyquestions`;

// Cloud Analytics
var apiPathCloudAnalyticsJobs = `${prodServices ? prodPath : devPath}/organizations/${getCookie("comply-orgId")}/jobs`;
var apiPathCloudAnalyticsCronJobs = `${prodServices ? prodPath : devPath}/organizations/${getCookie("comply-orgId")}/cronjobs`;

// PureCloud Connector
var apiPathPureCloudConnector = `${prodServices ? prodPath : devPath}/connector-purecloud`;

// Activities
var apiPathActivities = `${prodServices ? prodPath : devPath}/activities`;

// Activities - Post kafka message
var apiPathKafka = `${prodServices ? prodPath : devPath}/kafka/message`;

$(document).ready(() => {
  //Setting link for journeys
  $(".journeysLink").prop("href", `/pages-journeys.html?orgId=${getCookie("comply-orgId")}`);
  $("#surveysLink").prop("href", `/pages-surveys.html?orgId=${getCookie("comply-orgId")}&journeyId=${$.urlParam("journeyId")}`);
});
