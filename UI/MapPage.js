// Expands and contracts ui from click of button
function MapCallAPI(method, url, type, callback, params = 0) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = type;
    xhr.onload = function() {
        callback(xhr.response);
    };

    //console.log(params);

    xhr.send(JSON.stringify(params));
}

function expandOverlay() {
    const but = document.getElementById("overlay");
    const countoverlay = document.getElementById("counterOverlay");
    const div = document.getElementById("divStop");
    const bdiv = document.getElementById("buttondiv");
    if(but.className == "overlay") {
        but.className = "overlaySmall";
        countoverlay.hidden = true;
        div.hidden = true;
        bdiv.hidden = true;
    }
    else {
        but.className = "overlay";
        countoverlay.hidden = false;
        div.hidden = false;
        bdiv.hidden = false;
    }
}

function recallHobby() {
    window.location.href = "HobbySelectPage.html";
}

function incCount() {
    const count = document.getElementById("tripCount");
    let a = parseInt(count.textContent);
    a++;
    count.textContent = a.toString();
}

function decCount() {
    const count = document.getElementById("tripCount");
    let a = parseInt(count.textContent);
    if(a !== 0) {
        a--;
        count.textContent = a.toString();
    }
}

//add api function to this javascript function and call it when time comes
function journeyChart() {

    SetStopCount(document.getElementById("tripCount").textContent);
    let jsonObj = '{"userEmail": "' + GetEmail() + '",' + '"numPlaces": '
        + GetStopCount() + ',' + '"originCity": "' +  document.getElementById("start").value + '",'
        + '"destCity": "' + document.getElementById("destination").value + '"}';
    console.log(GetStopCount());
    console.log("BEFORE PARSE");
    console.log(jsonObj);
    jsonObj = JSON.parse(jsonObj);
    console.log(jsonObj);
    PassObj(jsonObj);

    //window.location.href = "MapPage.html";
}

function PassObj(jsonOBJ) {
    //console.log(jsonOBJ);
    let tempURL = "https://roadtrips-ml.herokuapp.com/trips/createTrip";
    let ret = MapCallAPI("POST", tempURL, "json", CallBack, jsonOBJ);
    console.log(ret);
    return ret;
}

function CallBack(result)
{
    console.log("IN CALLBACK");
    let ApiObj = result;
    console.log(ApiObj)
    SetMapPath(JSON.stringify(result));
    //window.location.href = "MapPage.html";
}

async function ShowMap() {

    //this should refresh allow new polyline.json to run
    const count = document.getElementById("tripCount");
    const div = document.getElementById("divStop");

    console.log("IN SHOW MAP");
    let fp = JSON.parse(GetMapPath());
    console.log(fp);

    //deletes all current stops
    while (div.firstChild) {
        div.removeChild(div.lastChild);
    }

    //sets up all new stops
    let a = parseInt(count.textContent);
    let i = 0;
    while(i < a)
    {
        let tempdiv = document.createElement("div");
        let temp = document.createElement("p");
        /*let temppic = document.createElement("img");
        temppic.src="https://i1.sndcdn.com/artworks-000501566619-j7ipmx-t500x500.jpg";
        temppic.style="width:100%;height:100%;";*/
        temp.textContent = "Step " + (i+1).toString() + ": " + await fp.names[i]['name'];
        temp.className="errorText";
        tempdiv.className="divbox";
        tempdiv.appendChild(temp);
        //tempdiv.appendChild(temppic);

        div.appendChild(tempdiv);
        i++;
    }
    //map.setZoom(map.getZoom());
}

// Creates UI Overlay onto map
function CenterControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.style.overflow = "auto";
    controlUI.className = "overlaySmall";
    controlUI.id = "overlay";

    //creates form and inputs
    const locationForm = document.createElement("form");
    const inputStart = document.createElement("input");
    const inputDest = document.createElement("input");

    //makes start
    inputStart.className = "mapInput";
    inputStart.required = true;
    inputStart.name = "start";
    inputStart.id = "start";
    inputStart.placeholder = "Start";

    //makes destination
    inputDest.className = "mapInput";
    inputDest.required = true;
    inputDest.name = "destination";
    inputDest.id = "destination";
    inputDest.placeholder = "Destination";

    //adds inputs to the form
    locationForm.appendChild(inputStart);
    locationForm.appendChild(inputDest);
    //adds the form to the ui
    controlUI.appendChild(locationForm);

    //create search button
    const search = document.createElement("button");
    search.id = "chart";
    search.textContent = "Chart Journey!";
    search.style.marginLeft = "10px";
    search.style.marginTop = "5px";
    search.onclick = function(){journeyChart()};
    controlUI.appendChild(search);

    const showMap = document.createElement("button");
    showMap.id = "showmap";
    showMap.textContent = "Show Stops";
    showMap.style.marginLeft = "10px";
    showMap.style.marginTop = "5px";
    showMap.onclick = function(){ShowMap()};
    controlUI.appendChild(showMap);

    //creates button
    const expand = document.createElement("button");
    expand.textContent = "???";
    expand.style.marginLeft = "10px";
    expand.style.marginTop = "5px";
    expand.onclick = function(){expandOverlay()};
    //adds button to ui
    controlUI.appendChild(expand);

    //Setup number of stops counter
    const brline = document.createElement("br");
    controlUI.appendChild(brline);

    const counterdiv = document.createElement( "div");
    counterdiv.id = "counterOverlay";
    counterdiv.className = "divbox";
    counterdiv.hidden = true;

    const stopText = document.createElement("h3");
    stopText.textContent = "Use the arrow buttons to select the number of stops you would like to make take on your trip.";
    stopText.className = "errorText";
    stopText.style.marginLeft = "1%";
    stopText.style.marginRight = "1%";
    counterdiv.appendChild(stopText);

    const centeringdiv = document.createElement("div");
    centeringdiv.style.marginLeft = "20%";

    const lessbutton = document.createElement("button");
    lessbutton.id = "lessbutton";
    lessbutton.textContent = "???";
    lessbutton.className="listButton";
    lessbutton.onclick = function(){decCount()};
    centeringdiv.appendChild(lessbutton);

    const counter = document.createElement("span");
    if(GetStopCount() === null || GetStopCount() === undefined)
        SetStopCount(1);
    console.log("HERE!:");
    console.log(GetStopCount());
    counter.textContent = GetStopCount();
    counter.className= "largerText";
    counter.id = "tripCount";
    centeringdiv.appendChild(counter);

    const greaterbutton = document.createElement("button");
    greaterbutton.id = "greaterbutton";
    greaterbutton.textContent = "???";
    greaterbutton.className="listButton";
    greaterbutton.onclick = function(){incCount()};
    centeringdiv.appendChild(greaterbutton);

    counterdiv.appendChild(centeringdiv);

    controlUI.appendChild(counterdiv);

    //div for each stop
    const stopDiv = document.createElement("div");
    stopDiv.id = "divStop";
    stopDiv.hidden = true;
    controlUI.appendChild(stopDiv);

    const buttondiv = document.createElement("div");
    buttondiv.id = "buttondiv";
    buttondiv.hidden = true;


    const HobbyButton = document.createElement("button");
    HobbyButton.textContent = "Reselect Hobbies.";
    HobbyButton.className = "listButton";
    HobbyButton.onclick = function(){recallHobby()};

    const NewHobbyButton = document.createElement("button");
    NewHobbyButton.textContent = "Hobby Suggestion";
    NewHobbyButton.className = "listButton";
    NewHobbyButton.onclick = function(){GetSuggestion()};

    buttondiv.appendChild(HobbyButton);
    buttondiv.appendChild(NewHobbyButton);
    controlUI.appendChild(buttondiv);
    //adds the ui to maps
    controlDiv.appendChild(controlUI);
}

function GetSuggestion() {
    let hobs = GetInterests();
    console.log("BELOW IS ML");
    console.log(hobs);
    let hobbyName = "Swimming";
    if (confirm("Should we add " + hobbyName + " to your interests?")) {
        // Add suggestion to user interests here
        let interests = '"' + "interests" + '": { ' + '"' + hobbyName + '": ' + 3 + '}';
        let email = GetEmail();
        let jsonText = '{ "' + "email" + '"' + ": " + '"' + email + '", ' + interests + '}';
        let jsonObj = JSON.parse(jsonText);
        console.log(jsonObj);
        //PassInterests(jsonObj);
        alert("We added " + hobbyName + " to your interests.");
    } else {
    }
}

async function FetchPolyline()
{
    return fetch('../data/polyline.json')
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            return data;
        });
}


async function initMap() {

    console.log(GetEmail());
    // The location of Uluru
    const KFalls = { lat: 42.224, lng: -121.781 };
    // The map, centered at Uluru
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: KFalls,
    });

    const centerControlDiv = document.createElement("div");
    centerControlDiv.style.height = "100%";
    await CenterControl(centerControlDiv);
    map.controls[google.maps.ControlPosition.LEFT_CENTER].push(
        centerControlDiv
    );

    /*let fp = await FetchPolyline();
    console.log(fp);*/
    //SetMapPath(JSON.stringify(fp));

    if(JSON.parse(GetMapPath()) != null) {

        console.log(JSON.parse(GetMapPath()));
        //DrawPolyline(flightPlanCoordinates);
        const flightPath = new google.maps.Polyline({
            path: JSON.parse(GetMapPath()).coords,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });


        makeMarkers(GetStopCount(), JSON.parse(GetMapPath()), map);

        flightPath.setMap(map);
        console.log(JSON.parse(GetMapPath()));
    }
}

//args: number of markers, flightpath markse
function makeMarkers(num, flightP,map)
{
    let ii = 0;
    for(ii; ii < num; ii++)
    {
        console.log(flightP.names[ii]['name']);
        const marker = new google.maps.Marker({
            position: flightP.markers[ii],
            map: map,
            title: flightP.names[ii]['name']
        });
    }
}

function GetInterests() {
    let tempURL = "http://localhost:5000/ml/suggest";

    let temp = MapCallAPI("GET", tempURL, "json", GetInterestsDone, GetEmail());
    console.log(temp);
    return temp;
}

function GetInterestsDone()
{
    console.log("A P I   D O N E");
    //window.location.href = "MapPage.html";
}