/*jslint browser: true*/
/*global JSZip, typeContainer*/

var steps = 0;
var currentStep = 0;
var previousStep = 0;
var lastStepDiv, stepInfoDiv;

var zip;
var taskObjects = [];
var taskIDs = 0;
var taskDivName = "tl-task-";
var draggedTaskDiv, clickedTask, selectedTask;
var highlightedTasks = [];
var typeCount = [];

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
    
    var save = document.getElementById("top-menu-save");
    save.onclick = saveAll;
    
    var load = document.getElementById("top-menu-load");
//    load.onclick = loadAll;
    load.addEventListener('change', loadAll, false);
    
    initTaskTypes();
}
function initTaskTypes(){
    for(var id in typeContainer){
        setTaskType(id, typeContainer[id]);
    }
}
function setTaskType(id, taskTypeFunc){
    var domElement = document.getElementById(id);
    if(!typeCount[id])typeCount[id] = 1;
    domElement.onclick = function(){
        var tt = taskTypeFunc();
        tt.typeID = id;
        tt.name += " "+(typeCount[id]++);
        if(tt.animation){
            addAnimationTask(tt);    
        }
        else if(tt.mesh){
            addCanvasTask(tt);
        }
        else{
            addEmptyTask(tt);
        }
    };
}
function saveAll(){
//    c(taskObjects);

//    var sceneSave = JSON.stringify(scene.toJSON());
//    c(sceneSave);
    var tasks = [];
    for(var i=0; i < taskObjects.length; i++){
        var task = taskObjects[i];

        var taskSave = {};
        if(task.animation){
            taskSave.animation = {};
            taskSave.animation.duration = task.animation.duration;
        }
        else if(task.mesh){
            taskSave.mesh = JSON.stringify(task.mesh.toJSON());
        }
        else{
            c("Ignoring empty task.");
            continue;
        }
        taskSave.id = task.id;
        taskSave.step = task.step;
        taskSave.taskType = {};
        taskSave.taskType.taskID = task.taskType.taskID;
        taskSave.taskType.name = task.taskType.name;
        
        tasks[tasks.length] = (JSON.stringify(taskSave));
    }
    
    var saveFile = {};
    saveFile.tasks = JSON.stringify(tasks);
    saveFile = JSON.stringify(saveFile);
    zip = new JSZip();
    zip.file("save", saveFile);
    var blob = zip.generate({
        type:"blob",
        compression: "DEFLATE",
        compressionOptions: {level: 5}
    });
    saveAs(blob, "presentation.ppno");
}
function loadAll(e){
    var file = e.target.files[0];
    if (!file) {return;}

    var reader = new FileReader();
    reader.onload = loadFile;
    reader.readAsArrayBuffer(file);
    
    function loadFile(f){
        var zip = new JSZip(f.target.result);
        var contents = zip.file("save").asText();
        
        var save = JSON.parse(contents);
        var tasks = JSON.parse(save.tasks);
        
        for(var i=0; i < tasks.length; i++){
            var task = JSON.parse(tasks[i]);
            if(task.mesh)task.mesh = JSON.parse(task.mesh);
            
            c(task);
        }
    }
}

//Step management
function addStep(){
    var tlStep = document.createElement("div");
    tlStep.className = "tl-step";
    tlStep.id = "tl-step-"+(steps);
    tlStep.innerHTML = "Step " + steps;
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
    
    //Update steps
    //---->c<--
    var i=0;
    var task = null;
    var lastTask = null;

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
    
    i = (taskObjects.length-1);
    while(lastTask && i >= 0){
        task = taskObjects[i];
        updateTask(task);
        i--;
        if(task === lastTask){
            break;
        }
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
                if(previousStep > currentStep){
                    task.animation.onStart();
                    task.animation.onEnd();
                    activateAnimation(task, true);
                }
                else{
                    task.animation.onStart();
                    activateAnimation(task, false);
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
    previousStep = currentStep;
}
function activateAnimation(taskObj, reverse){
    var mesh = taskObj.mesh;
    var ani = taskObj.animation;
    deselect();
    if(ani.isActive()){
        if(currentStep === taskObj.step){
            var duration = Date.now() - ani.startTime;
            var p = (reverse) ? 1.0-(duration/ani.duration) : (duration/ani.duration);
            ani.onLoop(p);
            window.requestAnimationFrame(function(){activateAnimation(taskObj, reverse);});
        }
        else if(currentStep > taskObj.step){
            //TODO better cancel
            ani.onCancel();
        }
    }
    else{
        if(reverse){
            ani.onStart();
        }
        else{
            ani.onEnd();
        }
        if(clickedMesh === mesh)select(mesh);
    }
}

//Task management
function addTask(tlStep){
    var taskDiv = document.createElement("div");
    
    var taskObj = taskObjects[taskObjects.length] = {
        id: taskIDs++,
        taskType: null,
        animation: null,
        mesh: null,
        step: tlStep.stepID,
        htmlElement: taskDiv
    };
    
    taskDiv.className = "tl-element";
    taskDiv.id = taskDivName+taskObj.id;
    taskDiv.onclick = function(){onTaskClicked(taskObj);};
    taskDiv.oncontextmenu = function(){
        removeTask(taskObj);
        taskMenuClose();
        event.preventDefault();
    };
    taskDiv.innerHTML = "Empty";
    taskDiv.draggable = true;
    taskDiv.taskObj = taskObj;
    
    taskDiv.ondragstart = function(e){
        draggedTaskDiv = e.target;
        e.target.className = "tl-element-ph";
        taskMenuClose();
    };
    taskDiv.ondragenter = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
        event.preventDefault();//TODO check for right element
    };
    taskDiv.ondragover = function(e){
        //TODO check for right element
        event.preventDefault();
    };
    taskDiv.ondrop = function(e){
        var target = e.target;
        var step = target.parentNode;
        step.insertBefore(draggedTaskDiv, target);
        taskObj.step = draggedTaskDiv.parentNode.stepID;
        updateTaskDiv(taskObj);
        updateStep();
        updateAllTaskTypes();
    };
    taskDiv.ondragend = function(e){
        e.target.className = "tl-element";
        draggedTaskDiv = undefined;
    };
    
    tlStep.insertBefore(taskDiv, tlStep.lastChild);
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
        showAddDialog();
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
    addEmptyTask(taskType);
}
function addAnimationTask(taskType){
    hideAddDialog();
    var overlay = document.getElementById("ov-selection-dialog");
    
    function meshSelect(div, mesh){
        div.onclick = function(){
            var init = taskType.animation.onInit;
            if(init)init(mesh);
            addTaskToMesh(mesh, clickedTask);
            
            clickedTask.htmlElement.style.backgroundColor = "#BBDD00";
            clickedTask.mesh = mesh;
            clickedTask.animation = taskType.animation;
            addEmptyTask(taskType);
            
            //remove mesh selection
            var child;
            while ((child = overlay.firstChild)) {
              overlay.removeChild(child);
            }
        };
    }
    
    var meshes = getMeshes();
    for(var i=0; i<meshes.length; i++){
        var mesh = meshes[i];
        var div = document.createElement("div");
        div.innerHTML = mesh.addTask.taskType.name;
        meshSelect(div, mesh);
        
        overlay.appendChild(div);
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
}
function hideOverlay(){
    var overlay = document.getElementById("overlay-black");
    overlay.style.display = "none";
    var dialog = document.getElementById("overlay-dialog");
    dialog.style.display = "none";
}
function hideAddDialog(){
    var dialog = document.getElementById("ov-add-dialog");
    dialog.style.display = "none";
}
function showAddDialog(){
    var dialog = document.getElementById("ov-add-dialog");
    dialog.style.display = "block";
}