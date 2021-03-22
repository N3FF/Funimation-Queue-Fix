/* Original Author: Justin N. 3/21/2021 */

/*
    A COUPLE OF COMMENTS WERE MADE SAYING IT DIDN'T WORK PROPERLY.
    Some changes need to be made somewhere in the extension enabled block
    or the methods used in it.
*/

// Stores if enabled/disabled
let extension = {
    removeFromQueueFix: 1
}

// Gets current enable/disable status from chrome that is saved by the toggles in the drop-down menu
chrome.storage.local.get(["removeFromQueueFix"], function (result) {

    // If the toggle hasn't been used yet then set it to enabled by default
    if (result.removeFromQueueFix === undefined) {
        chrome.storage.local.set({ "removeFromQueueFix": 1 }, function () {
        });
    } else {
        // If it has been saved then update the current status
        extension.removeFromQueueFix = result.removeFromQueueFix;
    }

    // If the extension is enabled
    if (extension.removeFromQueueFix) {
        // When you move your mouse over a remove button
        $(".remove").on("mousemove", mouseMoveQueueAddFix);
        // When you click the remove button
        $(".remove").on("click", removeQueueAddFixListeners);
    }
});

/*
    There is probably some simple logic messed up below.
    Removing the "remove" class makes it into an add button.

    Here is the difference between an Add button and a Remove button 

    <span class="btn add-queue-btn remove">Remove from Queue</span>
    <span class="btn add-queue-btn">Add to Queue</span>
*/
function mouseMoveQueueAddFix(e) {
    if (e.shiftKey) {
        $(this).removeClass("remove");
        $(this)[0].firstChild.textContent = "Add to Queue";
    } else {
        $(this).addClass("remove");
        $(this)[0].firstChild.textContent = "Remove from Queue";
    }
}
function removeQueueAddFixListeners(e) {
    if (e.shiftKey) {
        $(this).off("mouseover", mouseMoveQueueAddFix);
        $(this).off("click", removeQueueAddFixListeners);
        $(this).addClass("remove");
        $(this)[0].firstChild.textContent = "Remove from Queue";
    }
}