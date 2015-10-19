/*jslint browser: true*/
/*global THREE*/

var typeContainer = {};

var TaskAnimation = function(){};
TaskAnimation.prototype = {
    duration: 0,
    safe: {},
    onInit: function(m){},
    onStart: function(){},
    onLoop: function(progress){},
    isActive: function(){},
    onEnd: function(){},
    onCancel: function(){},
    onEdit: function(){}
};

var TaskType = function(){
    this.menu = {};
};
TaskType.prototype = {
    mesh: null,
    animation: null,
    name: "name",
    menu: null
};

var Menu3D = function(mesh){
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = "50";
    slider.addEventListener("mousemove", function(){
        mesh.position.z = -1000 + (slider.value-50)*2;
    });
    var button = createHTMLButton("Depth");
    button.appendChild(slider);
    
    this.depth = {
        html: button
    };
};

typeContainer["ov-add-text"] = function(){
    var text = createHTMLButton("Text: ");
    var textField = document.createElement("input");
    textField.type = "text";
    textField.value = "Hello World!";
    text.appendChild(textField);

    var geometry = new THREE.TextGeometry(textField.value, {size: 50, height: 0.01});
    var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -1000;
    
    textField.onchange = function(){
        mesh.geometry.dispose();
        mesh.geometry = new THREE.TextGeometry(textField.value, {size: 50, height: 0.01});
    };
    
    var color = createHTMLButton("Color");
    var colorPick = document.createElement("input");
    colorPick.type = "text";
    color.appendChild(colorPick);
    $(colorPick).spectrum({
        color: "#f00",
        move: function(color) {
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial({color: parseInt("0x"+color.toHex())});
        }
    });
    
    var taskType = new TaskType();
    taskType.mesh = mesh;
    taskType.name = "3D Text";
    taskType.menu = new Menu3D(mesh);
    taskType.menu.text = {
        html: text
    };
    taskType.menu.color = {
        html: color
    };
    
    return taskType;
};
typeContainer["ov-add-cube"] = function(){
    var geometry = new THREE.BoxGeometry( 100, 100, 100 );
    var material = new THREE.MeshNormalMaterial();
    var cube = new THREE.Mesh( geometry, material );
    cube.position.z = -1000;
    
    var taskType = new TaskType();
    taskType.name = "3D Cube";
    taskType.mesh = cube;
    taskType.menu = new Menu3D(cube);
    
    return taskType;
};
typeContainer["ov-add-text-field"] = function(){
    var elem = document.createElement("div");//document.querySelector('#editor');
    elem.style.width = "128px";
    elem.style.height = "128px";
    elem.style.position = "absolute";
    elem.style.top = "0px";
    window.document.body.appendChild(elem);

    var editor = carota.editor.create(elem);
    editor.load([
            { text: 'Text' }
        ]);
    editor.select(0, 4);

    var canvas = elem.querySelector('canvas');
    canvas.style.visibility = "hidden";
    var selector = elem.querySelector('.carotaSpacer');
    selector.style.border = "solid";
    selector.style.borderWidth = "1px";

    var texture = new THREE.Texture(canvas);
//    texture.minFilter = THREE.NearestFilter;
    textures.push(texture);//TODO

    var material = new THREE.MeshBasicMaterial({
        map : texture,
        side: THREE.DoubleSide
    });
    material.transparent = true;

    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(128, 128), material);
    mesh.doubleSided = true;
    mesh.onClick = function(){
        canvas.parentNode.parentNode.querySelector('textarea').focus();
    };

    mesh.position.z = -1000;
    
    var taskType = {};
    taskType.name = "Text field";
    taskType.mesh = mesh;
    
    return taskType;
};
typeContainer["ov-add-aniamtion"] = function(){
    var mesh;
    var active = true;
    var startPos = new THREE.Vector3();
    var endPos = new THREE.Vector3();
    var startTime = 0;
    
    var start = createHTMLButton("Set Start");
    start.onclick = function(){
        var p = mesh.position;
        startPos.set(p.x, p.y, p.z);
    };
    var end = createHTMLButton("Set End");
    end.onclick = function(){
        var p = mesh.position;
        endPos.set(p.x, p.y, p.z);
    };
    var durationDiv = createHTMLButton("Duration");
    durationDiv.onclick = function(){
        
    };
    
    //Menu
    var taskType = new TaskType();
    taskType.name = "3D Animation";
    taskType.menu.start = {
        html: start
    };
    taskType.menu.end = {
        html: end
    };
    taskType.menu.duration = {
        html: durationDiv
    };
    
    //Animation
    taskType.animation = new TaskAnimation();
    taskType.animation.duration = 1000;
    taskType.animation.onInit = function(m){
        mesh = m;
        var p = mesh.position;
        startPos.set(p.x, p.y, p.z);
        endPos.set(p.x, p.y, p.z);
    };
    taskType.animation.onStart = function(){
        active = true;
        startTime = Date.now();
        mesh.position.set(startPos.x, startPos.y, startPos.z);
    };
    taskType.animation.onLoop = function(progress){
        if(progress > 1 || progress < 0){
            active = false;
            return;
        }
        var p = progress;
        var q = 1.0 - p;
        var f = startPos;
        var t = endPos;
        mesh.position.set(f.x*q + t.x*p, f.y*q + t.y*p, f.z*q + t.z*p);
    };
    taskType.animation.isActive = function(){
        return active;
    };
    taskType.animation.onEnd = function(){
        mesh.position.set(endPos.x, endPos.y, endPos.z);
    };
    taskType.animation.onCancel = function(){
        mesh.position.set(endPos.x, endPos.y, endPos.z);
    };
    taskType.animation.onEdit = function(){
        
    };
    
    return taskType;
};
typeContainer["ov-remove"] = function(){
    var button = createHTMLButton("3D Object: ");
    var select = document.createElement("select");
    button.appendChild(select);
    
    var selectedMesh = null;
    var meshSave = null;
    var onStep = NaN;
    select.onchange = function(){
        if(isNaN(onStep))return;
        
        if(selectedMesh)selectedMesh.removeOnStep = undefined;
        
        selectedMesh = select.options[select.selectedIndex].mesh;
        
        if(meshSave){
            for(var i=0; i<meshSave.length; i++){
                var mesh = meshSave[i];
                mesh.removeOnStep = undefined;
            }
            meshSave = null;
        }
        
        if(selectedMesh === "all"){
            meshSave = [];
            var meshes = getMeshes();
            for(var i=0; i<meshes.length; i++){
                var mesh = meshes[i];
                if(mesh.removeOnStep === undefined && mesh.addTask.step <= onStep){
                    mesh.removeOnStep = onStep;
                    meshSave.push(mesh);
                }
            }
        }
        else if(selectedMesh){
            selectedMesh.removeOnStep = onStep;
        }
        updateStep();
    };
    
    var taskType = new TaskType();
    taskType.name = "Remove Object";
    taskType.menu.meshSelect = {
        html: button
    };
    taskType.onUpdate = function(taskStep){
        //Remove old entries
        var child;
        while ((child = select.firstChild)) {
          select.removeChild(child);
        }
        
        //Add default: All
        var option = document.createElement("option");
        option.innerHTML = "none";
        if(!selectedMesh)option.selected = "selected";
        select.appendChild(option);option = document.createElement("option");
        option.innerHTML = "All";
        option.mesh = "all";
        if(selectedMesh === "all")option.selected = "selected";
        select.appendChild(option);
        
        //Add Meshes
        var meshes = getMeshes();
        for(var i=0; i<meshes.length; i++){
            var mesh = meshes[i];
            if((mesh.removeOnStep === undefined || selectedMesh === mesh) && mesh.addTask.step <= taskStep){
                option = document.createElement("option");
                option.innerHTML = mesh.addTask.taskType.name;
                option.mesh = mesh;
                if(selectedMesh === mesh)option.selected = "selected";
                select.appendChild(option);
            }
        }
        onStep = taskStep;
        select.onchange();
    };
    return taskType;
};

function createHTMLButton(text){
    var div = document.createElement("div");
    div.className = "task-menu-button";
    if(text)div.innerHTML = text;
    return div;
}