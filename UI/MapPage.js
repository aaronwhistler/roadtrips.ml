// Expands and contracts ui from click of button
function expandOverlay() {
    const but = document.getElementById("overlay");
    const countoverlay = document.getElementById("counterOverlay");
    const div = document.getElementById("divStop");
    if(but.className == "overlay") {
        but.className = "overlaySmall";
        countoverlay.hidden = true;
        div.hidden = true;
    }
    else {
        but.className = "overlay";
        countoverlay.hidden = false;
        div.hidden = false;
    }
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
    counterdiv.hidden = true;

    const stopText = document.createElement("h3");
    stopText.textContent = "Use the arrow buttons to select the number of stops you would like to make take on your trip.";
    stopText.className = "errorText";
    stopText.style.marginLeft = "1%";
    stopText.style.marginRight = "1%";
    counterdiv.appendChild(stopText);

    const lessbutton = document.createElement("button");
    lessbutton.id = "lessbutton";
    lessbutton.textContent = "⮜";
    lessbutton.style.marginLeft = "10px";
    lessbutton.style.marginTop = "5px";
    lessbutton.onclick = function(){decCount()};
    counterdiv.appendChild(lessbutton);

    const counter = document.createElement("pre");
    counter.textContent = "1";
    counter.id = "tripCount";
    counterdiv.appendChild(counter);

    const greaterbutton = document.createElement("button");
    greaterbutton.id = "greaterbutton";
    greaterbutton.textContent = "⮞";
    greaterbutton.style.marginLeft = "1%";
    greaterbutton.style.marginTop = "1%";
    greaterbutton.onclick = function(){incCount()};
    counterdiv.appendChild(greaterbutton);

    controlUI.appendChild(counterdiv);

    //div for each stop
    const stopDiv = document.createElement("div");
    stopDiv.id = "divStop";
    stopDiv.hidden = true;
    controlUI.appendChild(stopDiv);

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