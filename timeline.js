/*jslint browser: true*/
/*global typeContainer*/

var steps = 0;
var currentStep = 0;
var lastStepDiv, stepInfoDiv;

var taskObjects = [];
var taskIDs = 0;
var taskDivName = "tl-element-";
var draggedTaskDiv, clickedTask, selectedTask;
var highlightedTasks = [];

function initTimeline() {
    var addStepDiv = document.getElementById("tl-add");
    addStepDiv.onclick = addStep;
    
    var prevStepDiv = document.getElementById("prev-step");
    prevStepDiv.onclick = prevStep;
    var nextStepDiv = document.getElementById("next-step");
    nextStepDiv.onclick = nextStep;
    stepInfoDiv = document.getElementById("info-current-step");
    
    var overlay = document.getElementById("overlay-black");
    overlay.onclick = hideOverlay;
    
    initTaskTypes();
}
function initTaskTypes(){
    for(var id in typeContainer){
        setTaskType(id, typeContainer[id]);
    }
}
function setTaskType(id, taskType){
    var domElement = document.getElementById(id);
    domElement.onclick = taskType;
}

//Step management
function addStep(){
    var tlStep = document.createElement("div");
    tlStep.className = "tl-step";
    tlStep.id = "tl-step-"+(steps);
    tlStep.innerHTML = tlStep.id;
    tlStep.stepID = steps;
    steps++;
    
    var addElement = document.createElement("div");
    addElement.className = "tl-element";
    addElement.innerHTML = "+";
    addElement.style.background = "white";
    addElement.onclick = function(){addTask(tlStep);};
    addElement.ondragenter = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
        event.preventDefault();//TODO check for right element
    };
    addElement.ondragover = function(e){
        event.preventDefault();//TODO check for right element
    };
    tlStep.appendChild(addElement);
    
    //Add an empty Task
    addTask(tlStep);
    
    document.getElementById("el-container").appendChild(tlStep);
    currentStep = tlStep.stepID;
    updateStep();
}
function prevStep(){
    if(currentStep > 0)currentStep--;
    updateStep();
}
function nextStep(){
    if(currentStep < steps-1)currentStep++;
    updateStep();
}
function updateStep(){
    stepInfoDiv.innerHTML = "Current Step: " + currentStep;
    
    if(lastStepDiv)lastStepDiv.style.border = "none";
    var currentStepDiv = document.getElementById("tl-step-"+currentStep);
    currentStepDiv.style.border = "solid";
    currentStepDiv.style.borderWidth = "1px";
    currentStepDiv.style.borderColor = "#FF0000";
    lastStepDiv = currentStepDiv;
    
    for(var i=0; i < taskObjects.length; i++){
        var task = taskObjects[i];
        
        //Task is an Animation
        if(task.animation){
            if(task.step === currentStep){
                task.animation.onStart();
                task.animation.startTime = Date.now();
                activateAnimation(task);
            }
            else if(currentStep < task.step){
                task.animation.onStart();
                task.animation.onLoop(0);
            }
            else if(currentStep > task.step){
                task.animation.onLoop(1);
                task.animation.onEnd();                
            }
        }
        //Task is an Mesh
        else if(task.mesh){
            if(task.step <= currentStep){
                task.mesh.setVisible(true);
            }
            else{
                if(clickedTask.mesh && task.mesh === clickedTask.mesh)deselect();
                task.mesh.setVisible(false);
            }
        }
    }
}
function activateAnimation(taskObj){
    var mesh = taskObj.mesh;
    var ani = taskObj.animation;
    deselect();
    if(ani.isActive()){
        if(currentStep === taskObj.step){
            var duration = Date.now() - ani.startTime;
            ani.onLoop(duration/ani.duration);
            window.requestAnimationFrame(function(){activateAnimation(taskObj);});
        }
        else if(currentStep > taskObj.step){
            ani.onCancel();
        }
    }
    else{
        ani.onEnd();
        if(clickedMesh === mesh)select(mesh);
    }
}

//Task management
function addTask(tlStep){
    var taskDiv = document.createElement("div");
    
    var taskObj = taskObjects[taskObjects.length] = {
        id: taskIDs++,
        animation: null,
        mesh: null,
        step: tlStep.stepID,
        htmlElement: taskDiv
    };
    
    taskDiv.className = "tl-element";
    taskDiv.id = taskDivName+taskObj.id;
    taskDiv.onclick = function(){taskClicked(taskObj);};
    taskDiv.innerHTML = taskDiv.id+"<br>"+taskObj.mesh+"<br>"+taskObj.step;
    taskDiv.draggable = true;
    taskDiv.taskObj = taskObj;
    
    taskDiv.ondragstart = function(e){
        draggedTaskDiv = e.target;
        e.target.className = "tl-element-ph";
    };
    taskDiv.ondragenter = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
        event.preventDefault();//TODO check for right element
    };
    taskDiv.ondragover = function(e){
        event.preventDefault();//TODO check for right element
    };
    taskDiv.ondrop = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
    };
    taskDiv.ondragend = function(e){
        e.target.className = "tl-element";
        taskObj.step = draggedTaskDiv.parentNode.stepID;
        draggedTaskDiv = undefined;
        updateTaskDiv(taskObj);
        updateStep();
    };
    
    tlStep.insertBefore(taskDiv, tlStep.lastChild);
}
function taskClicked(taskObj){
    if(taskObj === selectedTask)return;
    clickedTask = taskObj;
    
    if(!taskObj.mesh){
        showOverlay();
        showAddDialog();
    }
    else{
        selectedTask = taskObj;
        select(taskObj.mesh);
        taskMenuOpen(taskObj);
    }
    
    currentStep = taskObj.step;
    updateStep();
}
function hideAddDialog(){
    var dialog = document.getElementById("ov-add-dialog");
    dialog.style.display = "none";
}
function showAddDialog(){
    var dialog = document.getElementById("ov-add-dialog");
    dialog.style.display = "block";
}
function addCanvasTask(taskType){
    var mesh = taskType.mesh;
    prepMesh(mesh);
    clickedTask.mesh = mesh;
    clickedTask.taskType = taskType;
    
    addTaskToMesh(mesh, clickedTask);
    
    updateTaskDiv(clickedTask);
    currentStep = clickedTask.step;
    
    hideOverlay();
    updateStep();
}
function addAnimationTask(taskType){
    hideAddDialog();
    var overlay = document.getElementById("ov-selection-dialog");
    clickedTask.taskType = taskType;
    
    function meshSelect(div, mesh){
        div.onclick = function(){
            
            var init = taskType.animation.onInit;
            if(init)init(mesh);
            addTaskToMesh(mesh, clickedTask);
            
            clickedTask.htmlElement.style.backgroundColor = "#BBDD00";
            clickedTask.mesh = mesh;
            clickedTask.animation = taskType.animation;
            updateTaskDiv(clickedTask);
            
            hideOverlay();
            
            //remove mesh selection
            var child;
            while ((child = overlay.firstChild)) {
              overlay.removeChild(child);
            }
        };
    }
    
    for(var i=0; i<taskObjects.length; i++){
        var taskObj = taskObjects[i];
        var mesh = taskObj.mesh;
        if(mesh === null)continue;
        
        var div = document.createElement("div");
        div.innerHTML = mesh + i;
        meshSelect(div, mesh);
        
        overlay.appendChild(div);
    }
}
function addTaskToMesh(mesh, task){
    if(!mesh.tasks){
        mesh.tasks = [];
        mesh.addTask = task;
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
    console.log(mesh.tasks);
}
function updateTaskDiv(taskObj){
    var tlElement = document.getElementById(taskDivName+taskObj.id);
    tlElement.innerHTML = tlElement.id+"<br>"+taskObj.mesh+"<br>"+taskObj.step;
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
//    clickedTask = mesh.addTask;
//    selectedTask = mesh.addTask;
//    taskMenuOpen(mesh.addTask);
}
function deselectionOnCanvas(){
    while(highlightedTasks.length > 0){
        var div = highlightedTasks.pop();
        div.style.borderColor = "#000000";
    }
    selectedTask = undefined;
//    taskMenuClose();
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

//Overlay
function showOverlay(){
    var overlay = document.getElementById("overlay-black");
    overlay.style.display = "inline";
    var dialog = document.getElementById("overlay-dialog");
    dialog.style.display = "inline";
}
function hideOverlay(){
    var overlay = document.getElementById("overlay-black");
    overlay.style.display = "none";
    var dialog = document.getElementById("overlay-dialog");
    dialog.style.display = "none";
}