/*jslint browser: true*/

var domElement;
var position = 0;

function initTaskMenu(){
    domElement = document.getElementById("task-menu");
    updatePosition(-domElement.clientHeight);
}

//Animation
function taskMenuOpen(taskObj){
    if(!taskObj.taskType)return;
    
    var children = domElement.childNodes;
    for(var i=0; i<children.length;i++){
        var child = children[i];
        child.style.display = "none";
    }
    
    var elements = taskObj.taskType.menu;
    for(var type in elements){
        var dom = elements[type];
        dom.html.style.display = "block";
        
        if(!domElement.contains(dom.html)){
            domElement.appendChild(dom.html);
        }
    }
    
    upAnimation();
}
function taskMenuClose(){
    downAnimation();
}
function upAnimation(){
    updatePosition(position+5);
    
    if(position < 0){
        requestAnimationFrame(upAnimation);
    }else{
        updatePosition(0);
    }
}
function downAnimation(){
    updatePosition(position-5);
    
    if(Math.abs(position) < domElement.clientHeight){
        requestAnimationFrame(downAnimation);
    }else{
        updatePosition(-domElement.clientHeight);
    }
}
function updatePosition(pos){
    position = pos;
    domElement.style.bottom = position+"px";
}