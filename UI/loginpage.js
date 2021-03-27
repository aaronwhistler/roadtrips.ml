//function that makes password toggle from hidden to visible text
function passwordHide() {
    var x = document.getElementById("passwordLogin");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}