//******************************/
// Purpose: General API call method
// method: HTTP method
// url: url to call (must call buildURL for Get Method with parameters)
// type: type of response (generally "json")
// callback: the method to call once response is received
// params: (optional) JSON body of POST request. ignored on GET requests.
function callAPI(method, url, type, callback, params = 0) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = type;
    xhr.onload = function() {
        callback(xhr.response);
    };
    xhr.send(JSON.stringify(params));
}

//******************************/
// Purpose: build a URL for a GET request
// url: url to build off of (adds params to url)
// params: JSON key-value for URL
function buildURL(url, params) {
    let builtURL = url;
    let length = Object.keys(params).length;
    let lengthCount = 0;

    if (length) {
        builtURL += "?";
    } 
    for (var key in params) {
        // Ensure key is not from object prototype
        if (params.hasOwnProperty(key)) {
            builtURL += key + "=" + params[key];
            lengthCount = lengthCount + 1;
            if (lengthCount < length) {
                builtURL += "&";
            }
        }
    }
    return builtURL;
}

//******************************/
// Callback method (can be anything)
// result: the result to print
function printResult(result) {
    let printObj = JSON.parse(result);
    console.log(printObj);
}

// Sample JSON object that is passed
var jsonObject = {
    'email': 'cole@jason',
    'password': 'wasdwasdwasd'
}

var tempURL = "https://roadtrips-ml.herokuapp.com/users/checkPass"
var tempURL2 = "https://roadtrips-ml.herokuapp.com/users/createUsers"

let realURL = buildURL(tempURL, jsonObject);
callAPI("POST", tempURL2, "json", printResult, jsonObject);
//callAPI("GET", realURL, "json", printResult, jsonObject);
