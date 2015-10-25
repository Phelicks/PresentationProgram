/*jslint browser: true*/
/*global THREE, EasingFunctions*/

var typeContainer = {};

var TaskType = function(){
    this.menu = {};
};
TaskType.prototype = {
    mesh: null,
    animation: null,
    name: "name",
    menu: null,
    
    onDelete: function(){}
};

var TaskAnimation = function(){
    this.safe = null;
};
TaskAnimation.prototype = {
    duration: 1000,
    easing: EasingFunctions.linear,
    loop: false,
    
    onInit: function(m){},
    onStart: function(){},
    onLoop: function(progress){},
    onEnd: function(){},
    onEdit: function(){}
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
var sliderTextField = function(mesh, name, func){
    var value = 50;
    var textField = document.createElement("input");
    textField.type= "text";
    textField.value = value;
    textField.onchange = function(){
        value = textField.value;
        var p = Number(textField.value)/100;
        func(p);
    };
    
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = value;
    slider.addEventListener("mousemove", function(){
        value = slider.value;
        textField.value = slider.value;
        var p = Number(value)/100;
        func(p);
    });
    
    var button = createHTMLButton(name);
    button.appendChild(slider);
    button.appendChild(textField);
    
    this.html = button;
};

var meshColorPicker = function(mesh){
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
    
    this.html = color;
};

//------- Text
typeContainer["ov-add-text"] ={
    generateMesh: function(){
        var geometry = new THREE.TextGeometry("Text", {size: 50, height: 0.01});
        var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -1000;
        return mesh;
    },
    getTaskType: function(mesh, safe){
        var text = createHTMLButton("Text: ");
        var textField = document.createElement("input");
        textField.type = "text";
        textField.value = safe.textInfo ? safe.textInfo.text : "Text";
        text.appendChild(textField);
        var font = safe.font ? safe.font : "helvetiker";

        textField.onchange = function(){
            changeText(textField.value, {
                size: 50, 
                height: 0.01,
                font: font
            });
        };
        function changeText(text, parameters){
            mesh.geometry.dispose();
            mesh.geometry = new THREE.TextGeometry(text, parameters);
            safe.textInfo = {
                text: text,
                parameters: parameters
            };
            
        }
        if(safe.textInfo){
            var info = safe.textInfo;
            changeText(info.text, info.parameters);
        }
        
        var fontDiv = createHTMLButton("Font: ");
        var select = document.createElement("select");
        fontDiv.appendChild(select);
        for(var f in THREE.FontUtils.faces){
            if(f == "fontawesome")continue;
            var option = document.createElement("option");
            option.innerHTML = f;
            option.textFont = f;
            if(font === f)option.selected = "selected";
            select.appendChild(option);
        }
        select.onchange = function(){
            var selection = select.options[select.selectedIndex].textFont;
            font = selection;
            safe.font = font;
            changeText(textField.value, {
                size: 50, 
                height: 0.01,
                font: font
            });
        };

        var taskType = new TaskType();
        taskType.mesh = mesh;
        taskType.name = "3D Text";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.text = {
            html: text
        };
        taskType.menu.color = new meshColorPicker();
        taskType.menu.font = {
            html: fontDiv
        };

        return taskType;
    }
};
typeContainer["ov-add-symbol"] ={
    standartSize: 50,
    standartColor: Math.random() * 0xffffff,
    generateMesh: function(){
        var geometry = new THREE.TextGeometry("\uf087", {font:"fontawesome", size: this.standartSize, height: 0.01});
        var material = new THREE.MeshBasicMaterial({color: this.standartColor});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -1000;
        return mesh;
    },
    getTaskType: function(mesh, safe){
        var scope = this;
        
        if(safe.symbolUni){
            changesymbol(safe.symbolUni);
        }else{
            safe.symbolUni = "\uf087";
        }
        
        if(safe.color){
            changeColor(safe.color);
        }else{
            safe.color = scope.standartColor;
        }
        
        //TaskMenu
        //Symbol selection
        var symbol = createHTMLButton("symbol: ");
        var symbolSelect = document.createElement("select");
        symbolSelect.style.fontFamily = "FontAwesome";
        symbol.appendChild(symbolSelect);
        
        for(var g in THREE.FontUtils.faces.fontawesome.normal.normal.glyphs){
            var option = document.createElement("option");
            option.innerHTML = g;
            option.symbolUni = g;
            if(safe.symbolUni === g)option.selected = "selected";
            symbolSelect.appendChild(option);
        }
        symbolSelect.onchange = function(){
            var uni = symbolSelect.options[symbolSelect.selectedIndex].symbolUni;
            safe.symbolUni = uni;
            changesymbol(uni);
        };
        
        //Color selection
        var color = createHTMLButton("Color");
        var colorPick = document.createElement("input");
        colorPick.type = "text";
        color.appendChild(colorPick);
        $(colorPick).spectrum({
            color: "#f00",
            move: function(color){
                color = parseInt("0x"+color.toHex());
                changeColor(color);
                safe.color = color;
                scope.standartColor = color;
            }
        });
        
        //Size Selection
        var size = createHTMLButton("Size");
        var sizeField = document.createElement("input");
        sizeField.type = "text";
        sizeField.value = safe.size ? safe.size : this.standartSize;
        size.appendChild(sizeField);
        sizeField.onchange = function(){
            if(isNaN(sizeField.value))return;
            safe.size = sizeField.value;
            scope.standartSize = sizeField.value;
            changesymbol(safe.symbolUni);
        };
        
        //Mesh functions
        function changesymbol(uni){
            mesh.geometry.dispose();
            mesh.geometry = new THREE.TextGeometry(uni, {
                font:"fontawesome", 
                size: safe.size ? safe.size : this.standartSize, 
                height: 0.01
            });
        }
        function changeColor(color) {
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial({color: color});
        }
        
        //TaskType Object
        var taskType = new TaskType();
        taskType.mesh = mesh;
        taskType.name = "Symbole";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.symbol = {
            html: symbol
        };
        taskType.menu.color = {
            html: color
        };
        taskType.menu.size = {
            html: size
        };

        return taskType;
    }
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
//------- Geometrys
typeContainer["ov-add-circle"] = {
    defaultRadius: 100,
    defaultSegments: 32,
    defaultColor: Math.random()*0xFFFFFF,
    
    generateMesh: function(){
        var geometry = new THREE.CircleGeometry(this.defaultRadius, this.defaultSegments);
        var material = new THREE.MeshBasicMaterial(this.defaultColor);
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.z = -1000;
        return mesh;
    },
    getTaskType: function(mesh){
        var scope = this;
        var taskType = new TaskType();
        taskType.name = "Circle";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.color = new meshColorPicker(mesh);
        taskType.menu.size = new sliderTextField(mesh, "Size: ", function(p){
            mesh.geometry = new THREE.CircleGeometry(200*p, scope.defaultSegments);
        });

        return taskType; 
    }
};
typeContainer["ov-add-cube"] = {
    generateMesh: function(){
        var geometry = new THREE.BoxGeometry( 100, 100, 100 );
        var material = new THREE.MeshNormalMaterial();
        var cube = new THREE.Mesh( geometry, material );
        cube.position.z = -1000;
        return cube;
    },
    getTaskType: function(mesh){
        var taskType = new TaskType();
        taskType.name = "3D Cube";
        taskType.menu = new Menu3D(mesh);

        return taskType; 
    }
};
//------- Animations
typeContainer["ov-add-aniamtion"] = {
    isAnimation: true,
    getTaskType: function(safe){
        //Create TaskType Object and TaskMenu
        var taskType = new TaskType();
        taskType.animation = new TaskAnimation();
        
        var mesh;
        var startPos = safe.startPos;
        var endPos = safe.endPos;
        if(safe.easing){
            var easing = EasingFunctions[safe.easing];
            taskType.animation.easing = easing;
        }
        
        //Start Button
        var start = createHTMLButton("Set Start");
        start.onclick = function(){
            var p = mesh.position;
            if(!startPos)safe.startPos = startPos = {x:0, y:0, z: 0};
            startPos.x = p.x;
            startPos.y = p.y;
            startPos.z = p.z;
        };
        
        //End Button
        var end = createHTMLButton("Set End");
        end.onclick = function(){
            var p = mesh.position;
            if(!endPos)safe.endPos = endPos = {x:0, y:0, z: 0};
            endPos.x = p.x;
            endPos.y = p.y;
            endPos.z = p.z;
        };
        
        //Duration input
        var durationDiv = createHTMLButton("Duration");
        var textField = document.createElement("input");
        textField.type = "text";
        durationDiv.appendChild(textField);
        textField.onchange = function(){
            taskType.animation.duration = textField.value;
            previousStep = -1;
            updateStep();
        };
        
        //Easing selection
        var easingDiv = createHTMLButton("Easing: ");
        var select = document.createElement("select");
        easingDiv.appendChild(select);
        for(var e in EasingFunctions){
            var option = document.createElement("option");
            option.innerHTML = e;
            option.easingFunction = e;
            if(taskType.animation.easing === EasingFunctions[e])option.selected = "selected";
            select.appendChild(option);
        }
        select.onchange = function(){
            var selection = select.options[select.selectedIndex].easingFunction;
            safe.easing = selection;
            var easing = EasingFunctions[selection];
            taskType.animation.easing = easing;
            previousStep = -1;
            updateStep();
        };

        //TaskType Menu
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
        taskType.menu.easing = {
            html: easingDiv
        };
        taskType.onUpdate = function(step){
            textField.value = taskType.animation.duration;
        };

        //set TaskType properties
        taskType.animation.onInit = function(m){
            mesh = m;
        };
        taskType.animation.onStart = function(){
            if(!startPos || !endPos) return;
            mesh.position.set(startPos.x, startPos.y, startPos.z);
        };
        taskType.animation.onLoop = function(progress){
            var p = progress;
            var q = 1.0 - p;
            var f = startPos;
            var t = endPos;
            mesh.position.set(f.x*q + t.x*p, f.y*q + t.y*p, f.z*q + t.z*p);
        };
        taskType.animation.onEnd = function(){
            if(!startPos || !endPos) return;
            mesh.position.set(endPos.x, endPos.y, endPos.z);
        };
        taskType.animation.onEdit = function(){

        };

        return taskType;
    }
};
typeContainer["ov-add-aniamtion2"] = {
    isAnimation: true,
    aniCollection: [],
    getTaskType: function(safe){
        var scope = this;
        //Create TaskType Object and TaskMenu
        var taskType = new TaskType();
        taskType.animation = new TaskAnimation();
        
        var mesh;
        if(safe.easing){
            var easing = EasingFunctions[safe.easing];
            taskType.animation.easing = easing;
        }
        var meshData = safe.meshData || {};
        safe.meshData = meshData;
        
        //Duration input
        var durationDiv = createHTMLButton("Duration");
        var textField = document.createElement("input");
        textField.type = "text";
        durationDiv.appendChild(textField);
        textField.onchange = function(){
            taskType.animation.duration = textField.value;
            previousStep = -1;
            updateStep();
        };
        
        //Easing selection
        var easingDiv = createHTMLButton("Easing: ");
        var select = document.createElement("select");
        easingDiv.appendChild(select);
        for(var e in EasingFunctions){
            var option = document.createElement("option");
            option.innerHTML = e;
            option.easingFunction = e;
            if(taskType.animation.easing === EasingFunctions[e])option.selected = "selected";
            select.appendChild(option);
        }
        select.onchange = function(){
            var selection = select.options[select.selectedIndex].easingFunction;
            safe.easing = selection;
            var easing = EasingFunctions[selection];
            taskType.animation.easing = easing;
            previousStep = -1;
            updateStep();
        };

        //TaskType Menu
        taskType.name = "Animation Save";
        taskType.menu.duration = {
            html: durationDiv
        };
        taskType.menu.easing = {
            html: easingDiv
        };
        taskType.onUpdate = function(s){
            textField.value = taskType.animation.duration;
            meshData.step = s;
            var i = scope.aniCollection.indexOf(meshData);
            if(i >= 0)scope.aniCollection[i] = undefined;
            scope.aniCollection[s] = meshData;
        };
        taskType.onDelete = function(){
            
        };

        var startPos = null;
        var endPos = null;
        
        function setPositions(){
            startPos = null;
            for(var i=(meshData.step-1); i >= 0; i--){
                var a = scope.aniCollection[i];
                if(a){
                    startPos = a.position;
                    break;
                }
            }
            endPos = meshData.position || null;
        }
        
        //set TaskType properties
        taskType.animation.onInit = function(m){
            mesh = m;
            if(!meshData.position)meshData.position = {
                x: m.position.x, 
                y: m.position.y, 
                z: m.position.z
            };
        };
        taskType.animation.onStart = function(){
            setPositions();
            if(startPos && endPos){
                mesh.position.set(startPos.x, startPos.y, startPos.z);
            }
        };
        taskType.animation.onLoop = function(progress){
            if(!(startPos && endPos))return;
            var p = progress;
            var q = 1.0 - p;
            var f = startPos;
            var t = endPos;
            mesh.position.set(f.x*q + t.x*p, f.y*q + t.y*p, f.z*q + t.z*p);
        };
        taskType.animation.onEnd = function(){
            setPositions();
            if(startPos && endPos){
                mesh.position.set(endPos.x, endPos.y, endPos.z);
            }
        };
        taskType.animation.onEdit = function(){
            if(currentStep != meshData.step)return;
            meshData.position.x = mesh.position.x;
            meshData.position.y = mesh.position.y;
            meshData.position.z = mesh.position.z;
        };

        return taskType;
    }
};
//------- Remove
typeContainer["ov-remove"] = {
    getTaskType: function(safe){
        var button = createHTMLButton("3D Object: ");
        var select = document.createElement("select");
        button.appendChild(select);

        var selectedMesh = null;
        var meshSave = null;
        var onStep = NaN;
        select.onchange = function(){
            if(isNaN(onStep))return;
            
            var meshes = getMeshes();
            
            //Remove old 
            removeFrom(meshes);
            
            //Set selectedMesh 
            if(select.options[select.selectedIndex]){
                selectedMesh = select.options[select.selectedIndex].meshID;
            }
            if(selectedMesh === "all"){
                meshSave = [];
                for(var i=0; i<meshes.length; i++){
                    var mesh = meshes[i];
                    if(mesh.removeOnStep === undefined && mesh.addTask.step <= onStep){
                        mesh.removeOnStep = onStep;
                        meshSave.push(mesh);
                    }
                }
            }
            else if(!isNaN(selectedMesh)){
                for(var i=0; i<meshes.length; i++){
                    var mesh = meshes[i];
                    if(mesh.addTask.id === selectedMesh){
                        mesh.removeOnStep = onStep;
                        break;
                    }
                }
            }
            safe.selectedMesh = selectedMesh;
            updateStep();
        };
        function removeFrom(meshes){
            if(!meshes)meshes = getMeshes();
            
            if(meshSave){
                for(var i=0; i<meshSave.length; i++){
                    var mesh = meshSave[i];
                    mesh.removeOnStep = undefined;
                }
                meshSave = null;
            }
            else if(!isNaN(selectedMesh)){
                for(var i=0; i<meshes.length; i++){
                    var mesh = meshes[i];
                    if(mesh.addTask.id === selectedMesh){
                        mesh.removeOnStep = undefined;
                        break;
                    }
                }
            }
        }
        
        onStep = safe.onStep === undefined ? NaN : safe.onStep;
        selectedMesh = safe.selectedMesh === undefined ? null : safe.selectedMesh;
        select.onchange();

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
            if(selectedMesh === null)option.selected = "selected";
            select.appendChild(option);
            
            option = document.createElement("option");
            option.innerHTML = "All";
            option.meshID = "all";
            if(selectedMesh === "all")option.selected = "selected";
            select.appendChild(option);

            //Add Meshes
            var meshes = getMeshes();
            for(var i=0; i<meshes.length; i++){
                var mesh = meshes[i];
                if((mesh.removeOnStep === undefined || selectedMesh === mesh.addTask.id) && mesh.addTask.step <= taskStep){
                    option = document.createElement("option");
                    option.innerHTML = mesh.addTask.taskType.name;
                    option.meshID = mesh.addTask.id;
                    if(selectedMesh === mesh.addTask.id)option.selected = "selected";
                    select.appendChild(option);
                }
            }
            onStep = taskStep;
            safe.onStep = onStep;
            select.onchange();
        };
        taskType.onDelete = function(){
            removeFrom();
        };
        return taskType;
    }
};

function createHTMLButton(text){
    var div = document.createElement("div");
    div.className = "task-menu-button";
    if(text)div.innerHTML = text;
    return div;
}