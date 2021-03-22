// Keeps track of if the toggle in the menu is on or off.
let settings = {
    queueSortFixEnabled: 1,
    removeFromQueueFix: 1
};

// Sliders in order that they are displayed on the list
let sliders = {
    queueFix:0,
    removeFix:1
}

document.addEventListener('DOMContentLoaded', function () {
    // Get the status of each toggle from chromes local storage.
    chrome.storage.local.get(["queueSortFixEnabled", "removeFromQueueFix"], function (result) {
        // If this is the first time used set it to enabled and save it's status
        if (result.queueSortFixEnabled === undefined) {
            chrome.storage.local.set({ "queueSortFixEnabled": 1 }, function () {
            });
        } else {
            // If it has a value save it for use later in the code
            settings.queueSortFixEnabled = result.queueSortFixEnabled;
        }

        // Same logic as above
        if (result.removeFromQueueFix === undefined) {
            chrome.storage.local.set({ "removeFromQueueFix": 1 }, function () {
            });
        } else {
            settings.removeFromQueueFix = result.removeFromQueueFix;
        }
        // Creates the toggle buttons
        createToggles();
        // Add listeneres to the toggles
        addListeners();
    });

});

function addListeners() {
    // gets a reference to the sliders on the page
    let slider = document.getElementsByClassName("slider");
    
    // Listeners are added to the sliders in the array
    slider[sliders.queueFix].addEventListener("click", (e) => {
        // When toggled swap beteen true and false
        settings.queueSortFixEnabled = !settings.queueSortFixEnabled;
        // Update Chrome's storage so it will keep it's enabled or disabled status the next time loaded
        chrome.storage.local.set({ "queueSortFixEnabled": settings.queueSortFixEnabled }, function () { });
    });

    // Same logic as above
    slider[sliders.removeFix].addEventListener("click", (e) => {
        settings.removeFromQueueFix = !settings.removeFromQueueFix;
        chrome.storage.local.set({ "removeFromQueueFix": settings.removeFromQueueFix }, function () { });
    });
}

function createToggles() {
    // Creates the toggle for queue fix
    buildToggle(settings.queueSortFixEnabled, "queueToggle");
    // Creates the toggle for the remove shows fix
    buildToggle(settings.removeFromQueueFix, "removeToggle");
}

// Creates the HTML nodes to be added to the menu
function buildToggle(setting, nodeId){
    let input = document.createElement("input");
    input.type = "checkbox"
    input.checked = setting;

    let span = document.createElement("span");
    span.className = "slider";

    let node = document.getElementById(nodeId);
    node.appendChild(input);
    node.appendChild(span);
}