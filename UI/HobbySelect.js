function setupDropdown() {
    //const config = require('../data/all_hobbies.txt');
    let fr = new FileReader();
    var path1 = ['G:\\github\\hackOR\\data\\all_hobbies.txt'];
    let file = new Blob(path1);
    fr.readAsText(file);

    fr.onload = function() {
        console.log(fr.result);
    };

    fr.onerror = function() {
        console.log(fr.error);
    };
    //document.getElementById('output').textContent = (fr.result);
}