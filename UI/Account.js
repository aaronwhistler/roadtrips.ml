function GetEmail() {
    return sessionStorage.getItem("email");
}
function SetEmail(email) {
    sessionStorage.setItem("email", email);
}

function GetMapPath() {
    return sessionStorage.getItem("mappath");
}
function SetMapPath(path) {
    sessionStorage.setItem("mappath", path);
}

function GetStopCount() {
    return console.log(sessionStorage.getItem("stopcount"));
}
function SetStopCount(path) {
    console.log(path);
    sessionStorage.setItem("stopcount", path);
}