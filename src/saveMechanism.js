/*jslint browser: true*/
/*global JSZip, typeContainer*/

function saveToFile(){
    var tasks = [];
    for(var i=0; i < taskObjects.length; i++){
        var task = taskObjects[i];
        if(task.taskType === null)continue;

        var taskSave = {};
        if(task.animation){
            taskSave.animation = {};
            taskSave.animation.duration = task.animation.duration;
            taskSave.animation.meshAddTaskID = task.mesh.addTask.id;
            c(task);
        }
        else if(task.mesh){
            taskSave.mesh = JSON.stringify(task.mesh.toJSON());
        }
//        else{
//            console.warn("Ignoring empty task.");
//            continue;
//        }
        taskSave.id = task.id;
        taskSave.step = task.step;
        taskSave.taskType = {};
        taskSave.taskType.typeID = task.taskType.typeID;
        taskSave.taskType.name = task.taskType.name;
        taskSave.safe = task.taskType.safe;
        
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
function loadFromFile(e){
    if(steps > 0){
        alert("Please refresh this site before loading a new presentation.");
        return;
    }
    var file = e.target.files[0];
    if (!file) {return;}

    var reader = new FileReader();
    reader.onload = parseSave;
    reader.readAsArrayBuffer(file);
}
function parseSave(f){
    var i = 0;
    var task;
    
    //Get zip content
    var zip = new JSZip(f.target.result);
    var contents = zip.file("save").asText();
    //Get Tasks
    var data = JSON.parse(contents);
    var tasksJSON = JSON.parse(data.tasks);
    var tasks = [];
    
    //Prepare Tasks (parse meshes)
    var highestStep = 0;
    var loader = new THREE.ObjectLoader();
    for(i=0; i < tasksJSON.length; i++){
        task = JSON.parse(tasksJSON[i]);
        if(task.mesh)task.mesh = loader.parse(JSON.parse(task.mesh));
        if(task.step > highestStep)highestStep = task.step;
        tasks[task.id] = task;
    }
    
    //Create steps
    var steps = [];
    for(i=0; i <= highestStep; i++){
        steps.push(addStep());
    }
    
    //Create tasks
    for(i=0; i < tasks.length; i++){
        task = tasks[i];
        if(!task){console.warn("Ignoring empty task");continue;}
        var typeID = task.taskType.typeID;
        if(!typeContainer[typeID]) throw "Unknown type " + typeID;
        
        var taskObj = addTask(steps[task.step]);
        clickedTask = taskObj;
        var tt;
        //Mesh task
        if(task.mesh){
            tt = typeContainer[typeID].getTaskType(task.mesh, task.safe);
            tt.mesh = task.mesh;
            tt.safe = task.safe;
            tt.typeID = typeID;
            tt.name = task.taskType.name;
            addCanvasTask(tt);
            addEmptyTask(tt);
        }
        //Animation task
        else if(task.animation){
            //TODO first all meshes 
            tt = typeContainer[typeID].getTaskType(task.safe);
            tt.animation.duration = task.animation.duration;
            tt.safe = task.safe;
            tt.typeID = typeID;
            tt.name = task.taskType.name;
            var mesh = tasks[task.animation.meshAddTaskID].mesh;
            prepAnimationTask(clickedTask, tt, mesh);
            addEmptyTask(tt);
        }
        //Empty task
        else{
            tt = typeContainer[typeID].getTaskType(task.safe);
            tt.safe = task.safe;
            tt.typeID = typeID;
            tt.name = task.taskType.name;
            addEmptyTask(tt);
        }
    }
    currentStep = 0;
    updateStep();
}