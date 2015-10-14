/*jslint browser: true*/
/*global THREE*/

var typeContainer = {};

var TaskAnimation = function(){};
TaskAnimation.prototype = {
    duration: 0,
    onInit: function(m){},
    onStart: function(){},
    onLoop: function(progress){},
    isActive: function(){},
    onEnd: function(){},
    onCancel: function(){},
    onEdit: function(){}
};

var TaskType = function(){};
TaskType.prototype = {
    mesh: null,
    animation: null,
    menu: {}
};

typeContainer["ov-add-text"] = function(){
    var value = document.getElementById("3d-text-value");

    var geometry = new THREE.TextGeometry(value.value, {size: 50, height: 0.01});
//    var material = new THREE.MeshNormalMaterial();
    var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -1000;
    
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = "50";
    slider.addEventListener("mousemove", function(){
        mesh.position.z = -1000 + (slider.value-50)*2;
    });
    
    var taskType = {
        mesh: mesh,
        menu: {
            depth:{
                html: slider
            }
        }
    };

    addCanvasTask(taskType);
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
    taskType.mesh = mesh;

    addCanvasTask(taskType);
};
typeContainer["ov-add-cube"] = function(){
    var geometry = new THREE.BoxGeometry( 100, 100, 100 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.z = -1000;
    
    var bla = document.createElement("div");
    bla.innerHTML = "Test";
    
    var taskType = {
        mesh: cube,
        menu: {
            depth:{
                html: bla
            }
        }
    };

    addCanvasTask(taskType);
};
typeContainer["ov-add-aniamtion"] = function(){
    var mesh;
    var count = 0;
    var active = true;
    var startPos = new THREE.Vector3();
    var endPos = new THREE.Vector3();
    var startTime = 0;
    
    var start = document.createElement("div");
    start.innerHTML = "Set Start";
    start.onclick = function(){
        var p = mesh.position;
        startPos.set(p.x, p.y, p.z);
    };
    var end = document.createElement("div");
    end.innerHTML = "Set End";
    end.onclick = function(){
        var p = mesh.position;
        endPos.set(p.x, p.y, p.z);
    };
    var durationDiv = document.createElement("div");
    durationDiv.innerHTML = "Duration";
    durationDiv.onclick = function(){
        
    };
    
    //Menu
    var taskType = new TaskType();
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
        count = 0;
        startTime = Date.now();
    };
    taskType.animation.onLoop = function(progress){
        if(progress >= 1){
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
    
    addAnimationTask(taskType);
};