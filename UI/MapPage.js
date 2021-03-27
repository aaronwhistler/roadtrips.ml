function expandOverlay() {
    const but = document.getElementById("overlay");
    if(but.className == "overlay")
        but.className = "overlaySmall";
    else
        but.className = "overlay";

}

function CenterControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.className = "overlaySmall";
    controlUI.id = "overlay"

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

    //creates button
    const expand = document.createElement("button");
    expand.textContent = "▼";
    expand.style.marginLeft = "10px";
    expand.style.marginTop = "5px";
    expand.onclick = function(){expandOverlay()};
    //adds button to ui
    controlUI.appendChild(expand);
    //adds the ui to maps
    controlDiv.appendChild(controlUI);
}

function initMap() {
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