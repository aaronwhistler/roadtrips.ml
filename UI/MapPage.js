// Expands and contracts ui from click of button
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
    //console.log("IN CLICK");
    const count = document.getElementById("tripCount");
    const div = document.getElementById("divStop");

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
        let temppic = document.createElement("img");
        temppic.src="https://i1.sndcdn.com/artworks-000501566619-j7ipmx-t500x500.jpg";
        temppic.style="width:100%;height:100%;";
        temp.textContent = "Peter Undertale" + i.toString();
        temp.className="errorText";
        tempdiv.className="divbox";
        tempdiv.appendChild(temp);
        tempdiv.appendChild(temppic);

        div.appendChild(tempdiv);
        i++;
    }
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
    inputStart.placeholder = "Start";

    //makes destination
    inputDest.className = "mapInput";
    inputDest.required = true;
    inputDest.name = "destination";
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

    //creates button
    const expand = document.createElement("button");
    expand.textContent = "▼";
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
    lessbutton.textContent = "⮜";
    lessbutton.className="listButton";
    lessbutton.onclick = function(){decCount()};
    centeringdiv.appendChild(lessbutton);

    const counter = document.createElement("span");
    counter.textContent = "1";
    counter.className= "largerText";
    counter.id = "tripCount";
    centeringdiv.appendChild(counter);

    const greaterbutton = document.createElement("button");
    greaterbutton.id = "greaterbutton";
    greaterbutton.textContent = "⮞";
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

    buttondiv.appendChild(HobbyButton);
    controlUI.appendChild(buttondiv);
    //adds the ui to maps
    controlDiv.appendChild(controlUI);
}

function initMap() {
    console.log(GetEmail());
    // The location of Uluru
    const uluru = { lat: -25.344, lng: 131.036 };
    // The map, centered at Uluru
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: uluru,
    });
    // The marker, positioned at Uluru
    const marker = new google.maps.Marker({
        position: uluru,
        map: map,
    });

    const centerControlDiv = document.createElement("div");
    centerControlDiv.style.height = "100%";
    CenterControl(centerControlDiv);
    map.controls[google.maps.ControlPosition.LEFT_CENTER].push(
        centerControlDiv
    );
}