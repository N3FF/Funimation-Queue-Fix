# Funimation-Queue-Fix
Chrome Extension: Funimation - Queue Fix

I'm no longer able to keep updating this and keeping it functional when things change on the site, so I am passing this on to others if they would like to continue it.

In the .JSON folder there is a JSON response to a queue query. This might help you if you are trying to understand their format. It's probably a little bit old now so the series information may have changed.

If you would like to edit things and load the extension locally, you can do so by going to the menu on the top right ( ⋮ )-> More Tools -> Extensions. Then in the top right there is a switch to turn on "Developer Mode". This will allow you to load your own extensions. From there just select "Load Unpacked" and select the folder that this extension is in.

Note: Currently the removing shows that are NOT in your queue feature doesn't work. Funimation changed their process. Before you could just remove the "remove" class from the "Remove from queue" button and it would become an "Add to queue" button and the javascript on their side would pick it up as an add button. Now a POST request will need to be implemented in order to add the show. It will look almost the same as the DELETE.
