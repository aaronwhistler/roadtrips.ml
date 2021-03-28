async function setupDropdown() {
    //const config = require('../data/all_hobbies.txt');

    // Get all data from file as string
    const prom = await FetchHobbies();
    console.log(prom['hobbies']);

    //parse string by ','
    let parsed = prom['hobbies'].split(',');

    //Add items as buttons
    /*let tempBut = document.createElement("button");
    tempBut.textContent = parsed[0];
    document.getElementById('output').appendChild(tempBut);*/
    let ii;
    for(ii = 0; ii < 100; ii++)
    {
        let tempBut = document.createElement("button");
        tempBut.textContent = parsed[ii];
        tempBut.className = "listButton";
        tempBut.addEventListener('click', function () {
            RatingClick(tempBut);
        })
        document.getElementById('output').appendChild(tempBut);
    }
    //document.getElementById('output').textContent = (prom['hobbies']);
    //document.getElementById('output').textContent = (parsed[3]);

}

async function FetchHobbies()
{
    return fetch('../data/hobbies.json')
        .then(response => response.json())
        .then(data => {
            //console.log(data['hobbies']);
            return data;
        });
}

async function RatingClick(buttonPassed) {
    let br = document.createElement("br");

    /*let temp = document.createTextNode(buttonPassed.textContent);
    let br = document.createElement("br");
    document.getElementById('scoreBox').appendChild(temp);
    document.getElementById('scoreBox').appendChild(br);*/
    let tempLab = document.createElement("label");
    let tempRange = document.createElement("input");
    let tempVal = document.createElement("input");

    tempLab.textContent = buttonPassed.textContent;
    tempLab.style.fontSize = "26px";
    tempRange.type = "range";
    tempRange.id = buttonPassed.textContent;
    tempRange.min = '1';
    tempRange.max = '5';
    tempRange.value = '3';

    tempVal.type = "text";
    tempVal.id = "textInput";
    tempVal.value = "3";
    tempVal.style.width = "50px";

    tempRange.addEventListener("change",function () {
        updateVal(tempVal, tempRange.value);
    })

    document.getElementById('scoreBox').appendChild(tempLab);
    document.getElementById('scoreBox').appendChild(tempRange);
    document.getElementById('scoreBox').appendChild(tempVal);
    document.getElementById('scoreBox').appendChild(br);

    buttonPassed.remove();
}

function updateVal(box, val) {
    box.value = val;
}
