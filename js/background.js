const FUNIMATION = {
    URL: "https://www.funimation.com/",
    COOKIE: {
        URL: "https://www.funimation.com",
        TOKEN: "src_token"
    },
    API: {
        // Base URL
        URL: "https://prod-api-funimationnow.dadcdigital.com/api/",
        // Appended to the URL above based on the functionality needed
        GET_QUEUE: "source/funimation/queue/",
        REORDER_QUEUE: "source/funimation/queue/reorder/",
        DELETE: "source/funimation/queue/",
    }
}
const ACTION = {
    LOADED: 0, // Page is loaded and the extension is enabled.
    SAVED: 1, // Removed from current implementation (not currently in use)
    GET_QUEUE: 2, // Get the queue from the API
    REORDER_QUEUE: 3, // Submit new queue order
    REMOVE_FROM_QUEUE: 4, // Remove a show from the queue
    ADD_TO_QUEUE: 5 // Add a show to the queue
}

// When multiple queue queries are made to the Funimation API
// the queues will be combined into one object. 
let queueBuilder = {
    count: 0,
    items: [],
    offset: 0,
    total: 0
};

//Listen for events send from the webpage
chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id === chrome.runtime.id) {
        switch (message.action) {
            case ACTION.LOADED: // Queue page has loaded
                jsonQuery(ACTION.GET_QUEUE, reply, ""); // Download queue and send to page
                break;
            case ACTION.REORDER_QUEUE: // Queue has been reordered
                jsonQuery(ACTION.REORDER_QUEUE, reply, message.data) // Send updated queue to Funimation API
                break;
            case ACTION.REMOVE_FROM_QUEUE: // Show was removed from the queue
                jsonQuery(ACTION.REMOVE_FROM_QUEUE, reply, message.data) // Submit remove from queue request to Funimation API
                break;
        }
        return true;
    }
});

function jsonQuery(action, reply, queryData) {
    // Get current session token to make API queries
    chrome.cookies.get({ url: FUNIMATION.COOKIE.URL, name: FUNIMATION.COOKIE.TOKEN }, (cookie) => {
        //Base API URL
        let apiURL = FUNIMATION.API.URL;
        //API Request type
        let reqType;
        //Appends on parameters based on what type of query it is.
        switch (action) {
            case ACTION.GET_QUEUE:
                // Queue will load a max of 50 shows at a time. So if there is 110 shows you have to
                // Offset 0 and query, then offset 50 to get the next 50 shows, and then offset 100 to get the last 10 shows.
                apiURL += FUNIMATION.API.GET_QUEUE + "?offset=" + queueBuilder.count;
                reqType = "GET";
                break;
            case ACTION.REORDER_QUEUE:
                // When posted it will just save the queue in the order sent in "queryData"
                apiURL += FUNIMATION.API.REORDER_QUEUE;
                reqType = "POST";
                break;
                // Appends on the show id for the remove call
            case ACTION.REMOVE_FROM_QUEUE:
                apiURL += FUNIMATION.API.GET_QUEUE + queryData.show_id + "/";
                reqType = "DELETE";
                break;
        }

        // Submit requests
        if (action === ACTION.GET_QUEUE) {
            $.ajax({
                url: apiURL,
                headers: {
                    type: reqType,
                    accept: "application/json",
                    authorization: "Token " + cookie.value
                },
                success: (queue) => {
                    // Since it is only able to receive 50 shows at a time we have to keep requerying and building up
                    // an array of all of the shows
                    queueBuilder.count += queue.count;
                    queueBuilder.offset = queue.offset;
                    queueBuilder.total = queue.total;
                    Array.prototype.push.apply(queueBuilder.items, queue.items);
                    // Once the number of shows in the array are the same as the number of shows in your queue, return them
                    // in the reply and empty the array so if there are changes made to the queue and it's reloaded the
                    // correct shows are loaded
                    if (queueBuilder.total === queueBuilder.count) {
                        reply({
                            action: action,
                            data: queueBuilder
                        });
                        emptyQueueBuilder();
                    } else {
                        // Getting the next 50 if all the shows aren't loaded yet.
                        jsonQuery(ACTION.GET_QUEUE, reply, queryData);
                    }
                }
            });
            //Reordering the queue as stated below. 
        } else if (action === ACTION.REORDER_QUEUE) {
            $.ajax({
                url: apiURL,
                method: reqType,
                data: jQuery.param(queryData),
                headers: {
                    type: reqType,
                    dataType: "application/json",
                    authorization: "Token " + cookie.value
                },
                // returns if the reorder was successful or not
                success: (queue) => {
                    reply({
                        action: action,
                        data: queue
                    });
                }
            });
        } else if (action === ACTION.REMOVE_FROM_QUEUE) {
            $.ajax({
                url: apiURL,
                type: reqType,
                data: jQuery.param(queryData),
                headers: {
                    type: reqType,
                    dataType: "application/json",
                    authorization: "Token " + cookie.value
                },
                // Reply with the status update if it is successfully removed
                success: (update) => {
                    reply({
                        action: action,
                        data: update
                    });
                },
                // Reply with an error if the API request fails.
                error: (update) => {
                    reply({
                        action: action,
                        data: {
                            status: "FAIL",
                            error: update.error
                        }
                    })

                }
            });
        }
    });
}

// Empties the queue array that was holding all of the shows.
function emptyQueueBuilder() {
    queueBuilder.count = 0;
    queueBuilder.items = [];
    queueBuilder.offset = 0;
    queueBuilder.total = 0;
}