//Not that this file needs to be a .js file otherwise eel won't be able to detect it.
//Second the expose function needs to be literally "eel.expose...", since the way eel
//works is to scan .js files for the occurance of eel . expose(...)

var eel = window['eel'];
if(eel){
    console.log("eelJsInterface.js: eel found, exposing functions");
    function progress(x,msg) {
        window.__eel_js_progress(x,msg);
    }
    function asyncFinished(callbackID,data) {
        window.__eel_js_asyncFinished(callbackID,data);
    }
    function asyncError(callbackID,data) {
        window.__eel_js_asyncError(callbackID,data);
    }
    eel.expose(progress,'progress');
    eel.expose(asyncFinished,'asyncFinished');
    eel.expose(asyncError,'asyncError');
}


