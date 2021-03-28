let activityName = [];
let activityValue = [];
let idNum = 0;

function HobbycallAPI(method, url, type, callback, params = 0) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = type;
    xhr.onload = function() {
        callback(xhr.response);
    };

    console.log(params);

    xhr.send(JSON.stringify(params));
}

async function setupDropdown() {
    //const config = require('../data/all_hobbies.txt');

    // Get all data from file as string
    const prom = await FetchHobbies();
    //console.log(prom['hobbies']);
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
    //tempVal.id = buttonPassed.textContent;
    tempVal.id = idNum.toString();
    idNum++;
    tempVal.value = "3";
    tempVal.style.width = "50px";

    //Add to global vars
    activityName.push(buttonPassed.textContent);
    activityValue.push('3');

    tempRange.addEventListener("change",function () {
        updateVal(tempVal, tempRange.value);
    })

    document.getElementById('scoreBox').appendChild(tempLab);
    document.getElementById('scoreBox').appendChild(tempRange);
    document.getElementById('scoreBox').appendChild(tempVal);
    document.getElementById('scoreBox').appendChild(br);

    //add to json file

    buttonPassed.remove();

}

function updateVal(box, val) {
    // update json file use idNum to change json
    box.value = val;
    activityValue[parseInt(box.id)] = val;
}

function submitActivities() {
    /*let jsonObject = {
        'activity': activityName.join(),
        'value': activityValue.join()
    };*/
    if(activityName.length < 5)
        alert("Select at least 5 activities");
    else {
        let interests = "";
        let jj = 0;
        for (jj = 0; jj < activityName.length; jj++) {
            if (jj == activityName.length - 1)
                interests += '"' + activityName[jj] + '": ' + activityValue[jj];
            else
                interests += '"' + activityName[jj] + '": ' + activityValue[jj] + ',';
        }

        interests = '"' + "interests" + '": { ' + interests + '}';
        let email = "aaron.whistler@oit.edu" //need to set as actual email

        let jsonText = '{ "' + "email" + '"' + ": " + '"' + email + '", ' + interests + '}';

        //console.log(jsonText);
        let jsonObj = JSON.parse(jsonText);
        PassInterests(jsonObj);
        //console.log(jsonObj);
    }
}

function PassInterests(jsonOBJ) {
    console.log(jsonOBJ);
    let tempURL = "https://roadtrips-ml.herokuapp.com/interests/addInterests";
    HobbycallAPI("POST", tempURL, "json", AdvanceInterestPage, jsonOBJ);
}

function AdvanceInterestPage()
{
    console.log("A P I   D O N E");
    //window.location.href = "MapPage.html";
}
