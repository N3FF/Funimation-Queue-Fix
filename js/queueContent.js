/* Original Author: Justin N. 3/21/2021 */

// Actions sent through Chrome to our other scripts such as telling the background script that
// it needs to GET_QUEUE (get the queue) from the server
const ACTION = {
    LOADED: 0,
    SAVED: 1,
    GET_QUEUE: 2,
    REORDER_QUEUE: 3,
    REMOVE_FROM_QUEUE: 4,
    ADD_TO_QUEUE: 5
}

// Defaultly enabled unless overwritten by the toggle switch in the extension menu
let extension = {
    queueSortFixEnabled: 1
}

let loadingSpinner = spinner();

// Get the stored value of the toggle and see if the extension should be enabled or not.
chrome.storage.local.get(["queueSortFixEnabled"], function (result) {
    // If it's not defined enable it by default. If they just downloaded it they probably want to use it.
    if (result.queueSortFixEnabled === undefined) {
        chrome.storage.local.set({ "queueSortFixEnabled": 1 }, function () {
        });
    } else {
        // set the extension enabled or disabled based on the toggle switch in the extension icon dropdown menu
        extension.queueSortFixEnabled = result.queueSortFixEnabled;
    }

    // If it is enabled start our process
    if (extension.queueSortFixEnabled) {
        // This tells funimation that they have finished loading their queue.
        // This will prevent funimation and the extension from both trying to load the queue at the same time.
        $(".account-queue-list")[0].dataset.loaded = true;
        // We are going to starting loading the queue in a moment so show our "loading" spinner (purple loading circle)
        loading(true);
        // Get rid of anything funimation has loaded into the area where the queue will be inserted by us
        $(".queue-list-wrap").remove();
        $(".queue-paging-target").remove();
        // Tell the background that the webpage is loaded and we are ready to start inserting the queue's data
        chrome.runtime.sendMessage({ action: ACTION.LOADED }, (reply) => {
            if (reply.action === ACTION.GET_QUEUE) {
                // HTML Tag that will hold the queue
                $("#queue h2").html("Queue");
                // Start building the list from the queue data we just received
                buildList(reply.data);
                // The queue list is finished being built on the webpage so disable the purple spinner to show everything
                loading(false);
            }
        });
    }
});

// Starts building the UL (List) that will contain all of the LIs (show blocks)
// "shows" is the array (your queue) of shows in the JSON response.
function buildList(shows) {

    let queueWrap = document.createElement("div");
    queueWrap.className = "queue-list-wrap";

    if (shows.count > 0) { // If there is atleast one show in your queue
        let ul = document.createElement("ul");
        ul.className = "results queue-list";

        $.each(shows.items, (k, v) => {
            var block = buildBlock(k, v);
            ul.appendChild(block);
        });

        queueWrap.appendChild(ul);

        let position = {
            start: 0,
            end: 0
        };

        // Makes the shows in the queue sortable by dragging and dropping
        $(ul).sortable({
            opacity: 0.6,
            cursor: 'move',
            tolerance: 'pointer',
            'ui-floating': true,
            // Find the position of the show you are currently dragging
            start: function (e, list) {
                position.start = list.item.index();
            },
            // Get the position of where you dropped the show
            update: function (e, list) {
                position.end = list.item.index();
                // Update the values of each show's position in the list
                sortUpdate(position)
            }
        });
    } else { // If there are now shows in your queue
        let p = document.createElement("p");
        p.className = "no-items";
        p.innerText = "There are no items in your queue";
        queueWrap.appendChild(p);
    }

    // Queuewrap is the wrapper that holds the entire list of Queue elements.
    // This will make sure that the queue isn't making changes to the webpage while it's trying to be built.
    $(".account-queue-list").prepend(queueWrap);

}

// When the queue is resorted update the order and save it using the SaveQueueAPI
function sortUpdate(position, ul) {
    let listItems = $(".queue-item");

    let indexStart;
    let indexEnd;
    if (position.start < position.end) {
        indexStart = position.start;
        indexEnd = position.end;
    } else {
        indexStart = position.end;
        indexEnd = position.start;
    }

    for (i = indexStart; i <= indexEnd; i++) {
        listItems[i].dataset.index = i + 1;
    }

    saveQueueApi();
}

// Builds a list item (HTML LI) displayed as a show's "block" in the list
function buildBlock(index, block) {
    let li = document.createElement("li");
    li.className = "queue-item clearfix";
    li.dataset.id = block.show.id;
    li.dataset.title = block.show.title;
    li.dataset.showid = block.show.external_item_id;
    li.dataset.index = index + 1;

    li.appendChild(sortControlElements());

    let divRow = document.createElement("div");
    divRow.className = "row evenSpacedColumns";

    divRow.appendChild(itemDraggable());
    divRow.appendChild(itemSeriesImg(block.show));
    divRow.appendChild(itemDetails(block));
    divRow.appendChild(itemVideos(block));

    li.appendChild(divRow);
    return li;
}

// Up and down arrows used to sort the queue when the browser's width it small.
function sortControlElements() {

    // the starting letter in the variable name will tell you what the HTML tag type is
    let divSort = document.createElement("div");
    divSort.className = "sort-controls";
    divSort.innerText = "Sort:";

    let aMoveTop = document.createElement("a");
    aMoveTop.href = "#";
    aMoveTop.className = "move-top sort-btn";
    aMoveTop.title = "Move to Top";
    aMoveTop.style.marginRight = "10px";
    aMoveTop.dataset.direction = "top";
    aMoveTop.addEventListener("click", (e) => { moveToTopQueue(e) });

    let aMoveUp = document.createElement("a");
    aMoveUp.addEventListener("click", (e) => { sortArrow(e) });
    aMoveUp.href = "#";
    aMoveUp.className = "move-up sort-btn";
    aMoveUp.title = "Move Up";
    aMoveUp.dataset.direction = "up";

    let aMoveDown = document.createElement("a");
    aMoveDown.addEventListener("click", (e) => { sortArrow(e) });
    aMoveDown.href = "#";
    aMoveDown.className = "move-down sort-btn";
    aMoveDown.title = "Move Down";
    aMoveDown.dataset.direction = "down";

    let iArrowTop = document.createElement("i")
    iArrowTop.className = "fa fa-arrow-up";

    let iCircleUp = document.createElement("i");
    iCircleUp.className = "fa fa-arrow-circle-up";

    let iCircleDown = document.createElement("i")
    iCircleDown.className = "fa fa-arrow-circle-down";

    aMoveTop.appendChild(iArrowTop);
    aMoveUp.appendChild(iCircleUp);
    aMoveDown.appendChild(iCircleDown)
    divSort.appendChild(aMoveTop);
    divSort.appendChild(aMoveUp);
    divSort.appendChild(aMoveDown);

    return divSort;
}

// Creates the drag portion of the show's block for when the browser is at a high enough
// resolution where the up and down sort arrows aren't visible.
function itemDraggable() {
    let queueDrag = document.createElement("div");
    queueDrag.className = "account-queue-drag col-md-1 col-sm-1 hidden-xs hidden-sm";

    let imgDrag = document.createElement("img");
    imgDrag.src = "https://static.funimation.com/static/img/icons/icon-drag.png";
    imgDrag.alt = "";

    let aMoveTop = document.createElement("a");
    aMoveTop.href = "#";
    aMoveTop.className = "move-top sort-btn";
    aMoveTop.title = "Move to Top";
    aMoveTop.style.position = "relative";
    aMoveTop.style.left = "52%";
    aMoveTop.dataset.direction = "top";
    aMoveTop.addEventListener("click", (e) => { moveToTopQueue(e) });

    let iArrowTop = document.createElement("i")
    iArrowTop.className = "fa fa-arrow-up";

    aMoveTop.appendChild(iArrowTop);

    queueDrag.appendChild(aMoveTop);
    queueDrag.appendChild(imgDrag);

    return queueDrag;
}

// Image portion of the show's block
function itemSeriesImg(show) {
    let svod = show.most_recent_svod;
    let imgSplit = show.title_images.show_thumbnail.split("oth");

    let img = imgSplit[0] + "w_277,c_fill,q_60/oth" + imgSplit[1];

    let aImgLink = document.createElement("a");
    aImgLink.href = "/shows/" + show.slug + "/";

    if (svod === null) {
        aImgLink.href += "/?qid=";
    } else if (Object.keys(svod).length > 0)
        aImgLink.href += svod.item.episodeSlug + "/?qid=";

    aImgLink.className = "account-queue-thumbnail col-md-2 col-sm-2 col-xs-12";

    let imgSeries = document.createElement("img");
    imgSeries.className = "img-responsive";
    imgSeries.src = img;
    imgSeries.alt = "";
    imgSeries.dataset.src = img;

    aImgLink.appendChild(imgSeries);

    return aImgLink;
}

// Details section of the show's block
function itemDetails(block) {
    let show = block.show;

    // Gets the rating with is a long decimal number and converts it into
    // a numnber that can be used to determine the number of stars to be shown
    let rating = show.star_rating;
    let frac = rating % 1;
    if (frac < .25)
        rating = Math.floor(rating);
    else if (frac >= 0.25 && frac <= 0.75) {
        rating = Math.floor(rating) + 0.5;
    } else {
        rating = Math.ceil(rating);
    }

    let video = show.video;
    let videoHasItems = video === null ? false : Object.keys(video).length > 0;

    let mainDiv = document.createElement("div");
    mainDiv.className = "col-md-6 col-sm-7 col-xs-12 account-queue-details";

    let divTitle = document.createElement("div");
    divTitle.className = "title";

    let aSeries = document.createElement("a");
    aSeries.href = "/shows/" + show.slug + "/?qid=";
    aSeries.innerText = show.title;

    divTitle.appendChild(aSeries);

    let divRating = document.createElement("div");
    divRating.className = "rating stars";
    divRating.dataset.rating = rating;
    divRating.dataset.deviceid = "";
    divRating.dataset.queryid = "";

    let span = document.createElement("span");

    $(span).clone().appendTo(divRating);
    $(span).clone().appendTo(divRating);
    $(span).clone().appendTo(divRating);
    $(span).clone().appendTo(divRating);
    $(span).clone().appendTo(divRating);

    let divWatched = document.createElement("div");
    divWatched.className = "action";
    divWatched.innerHTML = videoHasItems ? block.type_prefix + ":" : "";

    let divStatus = document.createElement("div");
    divStatus.className = "status";

    let aEpisode = document.createElement("a");
    aEpisode.href = "/shows/" + show.slug + "/";

    if (videoHasItems) {
        aEpisode.href += video.slug + "/?qid=";
        aEpisode.innerHTML = "Episode " + video.number + " - " + video.episode_title;
    } else {
        aEpisode.innerHTML = "No videos available.";
    }


    divStatus.appendChild(aEpisode);

    mainDiv.appendChild(divTitle);
    mainDiv.appendChild(divRating);
    mainDiv.appendChild(divWatched);
    mainDiv.appendChild(divStatus);

    return mainDiv;
}

// "block" is the show information in the JSON response. This function will get the information needed for form
// the HTML in the "Videos" section of the list item
// All of the classnames are for Funimation's CSS file and shouldn't be changed unless Funimation updates them.
function itemVideos(block) {
    let hasEpisodes = block.show.most_recent_svod === null ? false : Object.keys(block.show.most_recent_svod).length > 0;
    let isMovie;
    let episodes = "";
    if (hasEpisodes) {
        isMovie = block.show.most_recent_svod.media_category === "movie";
        if (!isMovie) {
            episodes = block.show.total_episodes.episode;
        }
    }

    let mainDiv = document.createElement("div");
    mainDiv.className = "col-sm-3";

    let divRow = document.createElement("div");
    divRow.className = "row";

    let divVidCount = document.createElement("div");
    divVidCount.className = "col-md-6 account-queue-videocount";
    divVidCount.innerHTML = (hasEpisodes ? episodes : 0) + " videos";

    divRow.appendChild(divVidCount);

    let divRemove = document.createElement("div");
    divRemove.className = "col-md-6 account-queue-action";

    divRow.appendChild(divRemove);

    let aRemove = document.createElement("a");
    aRemove.addEventListener("click", removeLink);
    aRemove.href = "#";
    aRemove.className = "remove";
    aRemove.innerHTML = "Remove";
    aRemove.dataset.id = block.show.id;

    divRemove.appendChild(aRemove);

    mainDiv.appendChild(divRow);

    return mainDiv;
}

// When the move to top arrow is clicked move it to the start of the parent list
// and save the changes
function moveToTopQueue(e) {
    let ul = 0;
    let li = 0;
    for(let pathIndex=0;pathIndex < e.path.length; pathIndex++){
        if(e.path[pathIndex].nodeName == "UL"){
            ul = e.path[pathIndex];
            li = e.path[pathIndex - 1];
        }
    }
    $(ul).prepend(li);
    reIndexQueueItems();
    saveQueueApi();
}

// When the view is smaller the queue list shows up and down arrows. When an arrow is clicked
// This will save the changes and update the html order
function sortArrow(event) {
    event.preventDefault();
    let li = event.path[3];
    let listItems = $(".queue-item");
    let direction = event.path[1].dataset.direction;
    let index = parseInt(li.dataset.index);

    if (direction === "up" && index > 1) {
        let liAbove = listItems[index - 2];
        liAbove.dataset.index = index;
        $(li).insertBefore(liAbove);
        li.dataset.index = index - 1;
    } else if (direction === "down" && index < listItems.length) {
        let liBelow = listItems[index];
        liBelow.dataset.index = index;
        $(li).insertAfter(liBelow);
        li.dataset.index = index + 1;
    } else {
        return;
    }
    saveQueueApi();
}

// Build the spinner html and css and add it to the page
function spinner() {
    let body = document.createElement("div");
    body.style.padding = "90px 0";
    body.style.position = "relative";
    body.style.textAlign = "center";
    body.style.marginTop = "-200px";

    let wrap = document.createElement("div");
    wrap.className = "mini-loader-wrap large light"
    wrap.style.opacity = 1;

    let spinner = document.createElement("div");
    spinner.className = "mini-loader";

    let text = document.createElement("div");
    text.className = "mini-loader-message";
    text.innerHTML = "Loading..."

    wrap.appendChild(spinner);
    wrap.appendChild(text);
    body.appendChild(wrap);
    return body;
}

// Purple loading circle while the queue is loading true = on / false = off
function loading(status) {
    if (status) {
        $("#queue").append(loadingSpinner);
    } else {
        $(loadingSpinner).remove();
    }
}

// Sends a message to the background process to submit and API Queue reorder
function saveQueueApi() {
    let queue = updateKaneQueue();
    chrome.runtime.sendMessage({ action: ACTION.REORDER_QUEUE, data: queue }, (reply) => {
    });
}

// "remove" link on the show list that removes shows from your queue
function removeLink(event) {
    let show = {
        show_id: $(event.target).closest('[data-id]').attr('data-id'),
        device_id: window.localStorage.getItem("userId"),
        query_id: "None",
        sortname_id: $(event.target).closest('[data-showid]').attr('data-showid')
    }

    let li = event.path[5];
    let ul = event.path[6];


    reIndexQueueItems();
    updateKaneQueue();

    chrome.runtime.sendMessage({ action: ACTION.REMOVE_FROM_QUEUE, data: show }, (reply) => {
        if (reply.action === ACTION.REMOVE_FROM_QUEUE) {
            if (reply.data.status === "OK") {
                modalBox(li.dataset.title + " REMOVED FROM Queue.", "success");
                $(li).fadeOut("fast");
                ul.removeChild(li);

            } else {
                modalBox("UNABLE TO REMOVE " + li.dataset.title + " FROM QUEUE. TRY AGAIN LATER", "error");
            }
        }
    });
}

// The local storage values pushed into the kaneQueue is what causes all of the problems
// Updating the queue with the correct values allows you to make changes successfully
function updateKaneQueue() {
    let queue = {};
    $(".queue-item").each((k, v) => {
        queue[v.dataset.id.toString()] = parseInt(v.dataset.index);
    });

    window.localStorage.setItem("kaneQueue", JSON.stringify(queue));

    return queue;
}

// Upon reordering update the dataset values
function reIndexQueueItems() {
    $(".queue-list").children().each((k, v) => {
        v.dataset.index = k + 1;
    });
}

// Box that appears at the top of the screen saying shows have been removed and then fades away
// type "error" is a red toast, "success" is a green toast.
function modalBox(text, type) {
    let box = document.createElement("div");
    box.className = "gs_modal-wrap fade-out transparent " + type;

    let p = document.createElement("p");
    p.innerText = text;

    box.appendChild(p);

    $("#funimation-main-site-header").append(box);

    //Shows box
    setTimeout(() => {
        $(box).removeClass("transparent");
    }, 10);

    //Causes box to fade away
    setTimeout(() => {
        $(box).addClass('transparent');
        setTimeout(() => {
            $(box).remove();
        }, 2000);
    }, 2000);
}

