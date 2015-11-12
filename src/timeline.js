/*jslint browser: true*/
/*global JSZip, typeContainer*/

var steps = 0;
var currentStep = 0;
var previousStep = 0;
var forward = true;
var lastWasForward = true;
var lastStepDiv;

var zip;
var taskObjects = [];
var taskIDs = 0;
var draggedTaskDiv, clickedTask, selectedTask;
var highlightedTasks = [];
var typeCount = [];
var activeAnimations = 0;

var addDialog       = "ov-add-dialog";
var selectionDialog = "ov-selection-dialog";
var settingsDialog  = "ov-settings-dialog";

var stepClassName = "tl-step mdl-card mdl-shadow--2dp";
var stepIDprefix = "tl-step-";
var stepContent = function(number){return"<div>Step " + number + "</div>" +
        "<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>" +
            "<i class='material-icons'>add</i>" +
        "</a>";};
var stepContainerIDName = "el-container";

var taskDivName = "tl-task-";
var taskClassName = "mdl-button mdl-js-button mdl-button--raised mdl-button--accent tl-element";
var taskClassNameDrag = taskClassName  + " drag";

function initTimeline() {
    var addStepDiv = document.getElementById("tl-add");
    addStepDiv.onclick = addStep;
    
    var prevStepDiv = document.getElementById("prev-step");
    prevStepDiv.onclick = function(){
        forward = false;
        prevStep();
    }
    var nextStepDiv = document.getElementById("next-step");
    nextStepDiv.onclick = function(){
        forward = true;
        nextStep();
    }
    
    var overlay = document.getElementById("overlay-black");
    overlay.onclick = hideOverlay;
    
    var save = document.getElementById("top-menu-save");
    save.onclick = saveToFile;
    
    var load = document.getElementById("top-menu-load");
    load.addEventListener('change', loadFromFile, false);
    
    var settings = document.getElementById("top-menu-settings");
    settings.onclick = openSettings;
    
    initTaskTypes();
}
function initTaskTypes(){
    for(var id in typeContainer){
        setTaskType(id, typeContainer[id]);
    }
}
function setTaskType(id, taskTypeContainer){
//    var domElement = document.getElementById(id);
    var domElement = document.createElement("div");
    domElement.innerHTML = "" +
        "<div id='ov-add-text' class='add-card mdl-card mdl-shadow--2dp'>" +
          "<div class='mdl-card__title mdl-card--expand'>" +
            "<h2 class='mdl-card__title-text'>"+taskTypeContainer.meta.name +"</h2>" +
          "</div>" +
          "<div class='mdl-card__supporting-text'>" +
            taskTypeContainer.meta.description +
          "</div>" +
        "</div>";
    var overlay = document.getElementById("add-category-"+taskTypeContainer.meta.category);
    overlay.appendChild(domElement);
    
    
    if(!typeCount[id])typeCount[id] = 1;
    domElement.onclick = function(){
        var tt;
        var safe = {};
        if(taskTypeContainer.generateMesh){
            var mesh = taskTypeContainer.generateMesh();
            tt = taskTypeContainer.getTaskType(mesh, safe);
            tt.mesh = mesh;
        }
        else if(taskTypeContainer.isAnimation){
            tt = taskTypeContainer.getTaskType(safe);
        }
        else{
            tt = taskTypeContainer.getTaskType(safe);
        }
        
        tt.typeID = id;
        tt.name += " "+(typeCount[id]++);
        tt.safe = safe;
        
        if(tt.animation){
            addAnimationTask(tt);    
        }
        else if(tt.mesh){
            addCanvasTask(tt);
            addEmptyTask(tt);
        }
        else{
            addEmptyTask(tt);
        }
    };
}

//Settings
function openSettings(){
    showOverlay();
    dialogVisible(addDialog, false);
    dialogVisible(settingsDialog, true);
}

//Step management
function addStep(){
    //Create a new step element
    var tlStep = document.createElement("div");
    tlStep.id = stepIDprefix+(steps);
    tlStep.stepID = steps;
    tlStep.className = stepClassName;
    tlStep.innerHTML = stepContent(steps);
    steps++;
    
    //Create
    var addElement = tlStep.querySelector("a");
    
    addElement.onclick = function(){addTask(tlStep);};
    addElement.ondragenter = function(e){
        addElement.parentNode.insertBefore(draggedTaskDiv, addElement);
        event.preventDefault();//TODO check for right element
    };
    addElement.ondragover = function(e){
        event.preventDefault();//TODO check for right element
    };
    
    //Add an empty Task
//    addTask(tlStep);
    
    var container = document.getElementById(stepContainerIDName);
    container.insertBefore(tlStep, container.lastElementChild);
    currentStep = tlStep.stepID;
    updateStep();
    return tlStep;
}
function prevStep(){
    if(currentStep === 0)return;
    if(currentStep > 0 && !lastWasForward){
        currentStep--;
    }
    updateStep();
    lastWasForward = false;
}
function nextStep(){
    if(currentStep === (steps-1))return;
    if(currentStep < steps-1 && lastWasForward){
        currentStep++;
    }
    updateStep();
    lastWasForward = true;
}
function updateStep(){
    updateStepStyle();
    //Update steps
    //---->current<---
    var i=0;
    var task = null;
    var lastTask = null;

    //---->c
    while(i < taskObjects.length){
        task = taskObjects[i];
        if(task.step >= currentStep){
            lastTask = task;
            break;
        }
        else{
            updateTask(task);
            i++;
        }
    }
    //     c<--- 
    i = (taskObjects.length-1);
    while(lastTask && i >= 0){
        task = taskObjects[i];
        updateTask(task);
        i--;
        if(task === lastTask){
            break;
        }
    }
    
    previousStep = currentStep;
}
function updateStepStyle(){
    if(lastStepDiv)lastStepDiv.style.border = "none";
    var currentStepDiv = document.getElementById(stepIDprefix+currentStep);
    currentStepDiv.style.border = "solid";
    currentStepDiv.style.borderWidth = "1px";
    currentStepDiv.style.borderColor = "#FF0000";
    lastStepDiv = currentStepDiv;
}
function updateTask(task){
    //Task is an Animation
    if(task.animation){
        if(currentStep < task.step){
            task.animation.onStart();
            task.animation.onLoop(0);
        }
        else if(currentStep > task.step){
            task.animation.onLoop(1);
            task.animation.onEnd();                
        }
        else if(task.step === currentStep){
            task.animation.startTime = Date.now();
            if(!forward){//previousStep > currentStep || 
                task.animation.onEnd();
                activateAnimation(task, true);
                activeAnimations++;
            }
            else{
                task.animation.onStart();
                activateAnimation(task, false);
                activeAnimations++;
            }
        }
    }
    //Task is an Mesh
    else if(task.mesh){
        var removed = Boolean(task.mesh.removeOnStep) && task.mesh.removeOnStep <= currentStep;
        if(task.step <= currentStep && !removed){
            task.mesh.setVisible(true);
        }
        else{
            if(clickedTask.mesh && task.mesh === clickedTask.mesh)deselect();
            task.mesh.setVisible(false);
        }
    }
}

function activateAnimation(taskObj, reverse){
    var mesh = taskObj.mesh;
    var ani = taskObj.animation;
    var duration = Date.now() - ani.startTime;
    var p = reverse ? 1.0-(duration/ani.duration) : (duration/ani.duration);
    var active = (p >= 0) && (p <= 1);
        
    if(active && currentStep === taskObj.step){
        p = ani.easing ? ani.easing(p) : p;
        ani.onLoop(p);
        window.requestAnimationFrame(function(){activateAnimation(taskObj, reverse);});
    }
    else{
        if(reverse){
            ani.onStart();
        }
        else{
            ani.onEnd();
        }
        
        activeAnimations--;
        if(activeAnimations === 0 && !forward && currentStep !== 0){
            currentStep += -1;
            updateStepStyle();
            lastWasForward = true;
        }
        
        if(ani.loop){
            ani.startTime = Date.now();
            if(reverse){
                ani.onEnd();
            }
            else{
                ani.onStart();
            }
            window.requestAnimationFrame(function(){activateAnimation(taskObj, reverse);});
            activeAnimations++;
        }
    }
    
//  deselect();
//  if(clickedMesh === mesh)select(mesh);
}

//Task management
function addTask(tlStep){
    var taskDiv = document.createElement("button");
    
    var taskObj = taskObjects[taskObjects.length] = {
        id: taskIDs++,
        taskType: null,
        animation: null,
        mesh: null,
        step: tlStep.stepID,
        htmlElement: taskDiv
    };
    
    taskDiv.className = taskClassName;
    taskDiv.id = taskDivName+taskObj.id;
    taskDiv.onclick = function(){onTaskClicked(taskObj);};
    taskDiv.oncontextmenu = function(){
        if(taskObj.taskType)taskObj.taskType.onDelete();
        removeTask(taskObj);
        taskMenuClose();
        event.preventDefault();
    };
    taskDiv.innerHTML = "Empty";
    taskDiv.draggable = true;
    taskDiv.taskObj = taskObj;
    
    taskDiv.ondragstart = function(e){
        draggedTaskDiv = e.target;
        e.target.className = taskClassNameDrag;
        taskMenuClose();
    };
    taskDiv.ondragenter = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
        //TODO check for right element
        event.preventDefault();
    };
    taskDiv.ondragover = function(e){
        //TODO check for right element
        event.preventDefault();
    };
    taskDiv.ondrop = function(e){
        taskObj.step = draggedTaskDiv.parentNode.stepID;
        updateTaskDiv(taskObj);
        updateStep();
        updateAllTaskTypes();
    };
    taskDiv.ondragend = function(e){
        e.target.className = taskClassName;
        draggedTaskDiv = undefined;
    };
    
    tlStep.insertBefore(taskDiv, tlStep.lastElementChild);
    return taskObj;
}
function addTaskToMesh(mesh, task){
    if(!mesh.tasks){
        mesh.tasks = [];
        mesh.addTask = task;
        mesh.removeOnStep = undefined;
    }
    mesh.tasks.push(task);
    mesh.tasks.sort(function (a, b) {
      if (a.step > b.step) {
        return 1;
      }
      if (a.step < b.step) {
        return -1;
      }
      return 0;
    });
}
function onTaskClicked(taskObj){
//    if(taskObj === selectedTask)return;
    clickedTask = taskObj;
    
    if(!taskObj.taskType){
        showOverlay();
        dialogVisible(addDialog, true);
    }
    else{
        selectedTask = taskObj;
        if(taskObj.mesh)select(taskObj.mesh);
        if(taskObj.taskType.onUpdate)taskObj.taskType.onUpdate(taskObj.step);
        taskMenuOpen(taskObj);
    }
    
    currentStep = taskObj.step;
    updateStep();
}
function removeTask(taskObj){
    var div = taskObj.htmlElement;
    div.parentNode.removeChild(div);
    
    var inx = taskObjects.indexOf(taskObj);
    if(inx >= 0)taskObjects.splice(inx, 1);
    
    if(taskObj.mesh && taskObj.mesh.addTask === taskObj){
        deleteMesh(taskObj.mesh);
    }
    taskObj = null;
}

function updateTaskDiv(taskObj){
    var tlElement = document.getElementById(taskDivName+taskObj.id);
    if(taskObj.taskType){
        tlElement.innerHTML = taskObj.taskType.name;
    }
    else{
        tlElement.innerHTML = "Empty";
    }
}
function updateAllTaskTypes(){
    for(var i=0; i<taskObjects.length; i++){
        var taskType = taskObjects[i].taskType;
        if(taskType && taskType.onUpdate)taskType.onUpdate(taskObjects[i].step);
    }
}

function addCanvasTask(taskType){
    prepMesh(taskType.mesh);
    clickedTask.mesh = taskType.mesh;
    addTaskToMesh(taskType.mesh, clickedTask);
}
function prepAnimationTask(taskObj, taskType, mesh){
    addTaskToMesh(mesh, taskObj);

    taskType.animation.onInit(mesh);
    
    taskObj.htmlElement.style.backgroundColor = "#BBDD00";
    taskObj.mesh = mesh;
    taskObj.animation = taskType.animation;
}
function addAnimationTask(taskType){
    dialogVisible(addDialog, false);
    var overlay = document.getElementById(selectionDialog);
    
    var meshes = getMeshes();
    for(var i=0; i<meshes.length; i++){
        var mesh = meshes[i];
        var div = document.createElement("div");
        div.innerHTML = mesh.addTask.taskType.name;
        meshSelect(div, mesh);
        
        overlay.appendChild(div);
    }
    
    function meshSelect(div, mesh){
        div.onclick = function(){
            prepAnimationTask(clickedTask, taskType, mesh);
            addEmptyTask(taskType);
            
            //remove mesh selection
            var child;
            while ((child = overlay.firstChild)) {
              overlay.removeChild(child);
            }
        };
    }
}
function addEmptyTask(taskType){
    clickedTask.taskType = taskType;
    if(taskType.onUpdate)taskType.onUpdate(clickedTask.step);
    
    taskMenuOpen(clickedTask);
    updateTaskDiv(clickedTask);
    currentStep = clickedTask.step;
    selectedTask = clickedTask;
    
    hideOverlay();
    updateStep();
}

//Canvas
function selectionOnCanvas(mesh){
    if(mesh.addTask === selectedTask)return;
    var tasks = mesh.tasks;
    
    while(highlightedTasks.length > 0){
        var div = highlightedTasks.pop();
        div.style.borderColor = "#000000";
    }
    
    for(var i=0; i<tasks.length; i++){
        var div = tasks[i].htmlElement;
        div.style.borderColor = "#AAAA00";
        highlightedTasks.push(div);
    }
    
    if(tasks.indexOf(selectedTask) === -1){
        clickedTask = mesh.addTask;
        selectedTask = mesh.addTask;
        taskMenuOpen(mesh.addTask);
    }
}
function deselectionOnCanvas(){
    while(highlightedTasks.length > 0){
        var div = highlightedTasks.pop();
        div.style.borderColor = "#000000";
    }
    selectedTask = undefined;
    taskMenuClose();
}
function onMeshChange(mesh){
    var tasks = mesh.tasks;
    for(var i=0; i<tasks.length; i++){
        var task = tasks[i];
        if(task.animation){
            task.animation.onEdit();
        }
    }
}
function getMeshes(){
    var meshes = [];
    for(var i=0; i<taskObjects.length; i++){
        var taskObj = taskObjects[i];
        var mesh = taskObj.mesh;
        var ani = taskObj.animation;
        if(!mesh || ani)continue;
        meshes.push(mesh);
    }
    return meshes;
}

//Overlay
function showOverlay(){
    var overlay = document.getElementById("overlay-black");
    overlay.style.display = "inline";
    var dialog = document.getElementById("overlay-dialog");
    dialog.style.display = "inline";
    
    dialogVisible(addDialog, false);
    dialogVisible(settingsDialog, false);
}
function hideOverlay(){
    var overlay = document.getElementById("overlay-black");
    overlay.style.display = "none";
    var dialog = document.getElementById("overlay-dialog");
    dialog.style.display = "none";
}
function dialogVisible(element, bool){
    var dialog = document.getElementById(element);
    dialog.style.display = bool ? "block" : "none";
}