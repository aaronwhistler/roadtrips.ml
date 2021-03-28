function GetEmail() {
    return sessionStorage.getItem("email");
}

function SetEmail(email) {
    sessionStorage.setItem("email", email);
}