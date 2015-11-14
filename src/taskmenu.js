/*jslint browser: true*/

var domElement;
var position = 0;

function initTaskMenu(){
    domElement = document.getElementById("task-menu");
    var trans = "translate(0px, -200px)";
    domElement.style.transform = trans;
    domElement.style.webkitProperty = trans;
    domElement.style.MozProperty = trans;
    domElement.style.msProperty = trans;
    domElement.style.OProperty = trans; 
}

//Animation
function taskMenuOpen(taskObj){
    if(!taskObj.taskType)return;
    
    hideTaskMenuButtons();
    
    var elements = taskObj.taskType.menu;
    for(var type in elements){
        var dom = elements[type];
        dom.html.style.display = "block";
        
        if(!domElement.contains(dom.html)){
            domElement.appendChild(dom.html);
            domElement.appendChild(dom.html.dropdown);
        }
    }
    
    showAnimation();
}
function taskMenuClose(){
    hideAnimation();
//    hideTaskMenuButtons();
}

function showAnimation(){
    var trans = "translate(0px, 0px)";
    domElement.style.transform = trans;
    domElement.style.webkitProperty = trans;
    domElement.style.MozProperty = trans;
    domElement.style.msProperty = trans;
    domElement.style.OProperty = trans;
}
function hideAnimation(){
    var trans = "translate(0px, -"+domElement.clientHeight+"px)";
    domElement.style.transform = trans;
    domElement.style.webkitProperty = trans;
    domElement.style.MozProperty = trans;
    domElement.style.msProperty = trans;
    domElement.style.OProperty = trans;   
}

function hideTaskMenuButtons(){
    var children = domElement.children;
    for(var i=0; i<children.length;i++){
        var child = children[i];
        child.style.display = "none";
    }
}