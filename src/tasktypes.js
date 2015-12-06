/*jslint browser: true*/
/*global THREE, EasingFunctions*/

var TaskType = function(){
    this.menu = {};
};
TaskType.prototype = {
    mesh: null,
    animation: null,
    name: "name",
    menu: null,
    
    onUpdate: function(){},
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

var sliderTextField = function(name, func){
    var value = 50;
    var textField = document.createElement("input");
    textField.type= "text";
    textField.value = value;
    textField.onchange = function(){
        value = textField.value;
        var p = Number(textField.value)/100;
        func(p);
    };
    
    var click = false;
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = value;
    slider.onchange = function(){
        click = true;
        sliderMove();
        click = false;
    };
    slider.addEventListener("mousemove", sliderMove);
    slider.addEventListener("touchmove", sliderMove);
    slider.addEventListener("touchstart", function(){click = true;});
    slider.addEventListener("mousedown", function(){click = true;});
    slider.addEventListener("touchend", function(){click = false;});
    slider.addEventListener("mouseup", function(){click = false;});
    
    function sliderMove(){
        if(!click)return;
        
        value = slider.value;
        textField.value = slider.value;
        var p = Number(value)/100;
        func(p);
    }
    
    var div = document.createElement("div");
    var div2 = document.createElement("div");
    var div3 = document.createElement("div");
    div2.appendChild(slider);
    div3.appendChild(textField);
    div.appendChild(div2);
    div.appendChild(div3);
    
    var button = createTaskMenuButton(name, div);
    
    this.html = button;
};
var meshColorPicker = function(func, defaultColor){
    var colorPick = document.createElement("input");
    colorPick.type = "text";
    var color = createTaskMenuButton("Color", colorPick);
    
    $(colorPick).spectrum({
        color: defaultColor || "#000000",
        flat: true,
        preferredFormat: "hex",
        showInput: true,
        
//        showPalette: true,
//        palette: [ ],
//        showSelectionPalette: true,
//        maxSelectionSize: 10,
        
        move: function(c){func(c);},
        change: function(c){func(c);}
    });
    
    this.html = color;
};
var Menu3D = function(mesh){
    var scope = this;
    this.depth = new sliderTextField("Depth", function(p){
        mesh.position.z = -1000 + (-500 + p*1000);
    });
    this.rotation = {
        html: document.querySelector("#rotation-button")
    };
    this.alpha = new sliderTextField("Alpha", function(p){
        mesh.material.transparent = true;
        mesh.material.opacity = p;
        if(scope.animation)scope.animation.onEdit();
    });
};


var typeContainer = {};
//------- Text
typeContainer["ov-add-text"] ={
    meta:{
        category: "text",
        name: "Text",
        background: "<div style='font-size:80px;font-family:serif;'><center>T|</center></div>",
        description: "Add a new Text element."
    },
    standartSize: 50,
    standartColor: 0,
    defaultFont: "lora",
    generateMesh: function(){
        var geometry = new THREE.TextGeometry("Text", {size: this.standartSize, height: 0.01, font: this.defaultFont});
        var material = new THREE.MeshBasicMaterial({color: this.standartColor});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -1000;
        return mesh;
    },
    getTaskType: function(mesh, safe){
        var scope = this;
        
        //load from safe
        var font = safe.font ? safe.font : this.defaultFont;
        if(safe.color)changeColor(safe.color);
        if(!safe.size)safe.size = this.standartSize;
        
        var textField = document.createElement("input");
        textField.type = "text";
        textField.value = safe.textInfo ? safe.textInfo.text : "Text";
        var text = createTaskMenuButton("Text", textField);

        textField.onchange = function(){
            changeText(textField.value, {
                size: safe.size, 
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
        
        var fontContainer = document.createElement("div");
        var fontDiv = createTaskMenuButton("Font", fontContainer);
        
        function onFontClick(selection){
            return function(){
                font = selection;
                safe.font = font;
                changeText(textField.value, {
                    size: safe.size, 
                    height: 0.01,
                    font: font
                });
            };
        }
        
        for(var f in THREE.FontUtils.faces){
            if(f == "fontawesome")continue;
            var option = document.createElement("div");
            option.className = "task-menu-font mdl-card__actions mdl-card--border";
            option.style.fontFamily = f;
            
            option.innerHTML = f;
            option.onclick = onFontClick(f);
            fontContainer.appendChild(option);
        }
        
        function changeColor(color) {
            safe.color = color;
            scope.standartColor = color;
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial({color: color});
        }

        var taskType = new TaskType();
        taskType.mesh = mesh;
        taskType.name = "Text";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.text = {
            html: text
        };
        taskType.menu.color = new meshColorPicker(function(color){
            changeColor(parseInt("0x"+color.toHex()));
        });
        taskType.menu.font = {
            html: fontDiv
        };
        taskType.menu.size = new sliderTextField("Size", function(p){
            mesh.scale.x = p*2 || 0.001;
            mesh.scale.y = p*2 || 0.001;
            mesh.scale.z = p*2 || 0.001;
        });

        return taskType;
    }
};
typeContainer["ov-add-symbol"] ={
    meta:{
        category: "text",
        name: "Symbol",
        background: "<div style='font-size:80px;font-family:fontawesome;'><center>\uf087</center></div>",
        description: "A collection of great symbols."
    },
    standartSize: 50,
    standartColor: 0,
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
        //Symbol Select
        var symbols = document.createElement("div");
        symbols.style.fontFamily = "FontAwesome";
        symbols.style.fontSize = "large";
        
        function onSymboleClick(symbole){
            return function(){
                changesymbol(symbole);
            };
        }
        for(var g in THREE.FontUtils.faces.fontawesome.normal.normal.glyphs){
            var option = document.createElement("div");
            option.style.display = "inline-block";
            option.style.padding = "1px";
            option.style.cursor = "pointer";
            option.innerHTML = g;
            option.onclick = onSymboleClick(g);
            symbols.appendChild(option);
        }
        var symbol = createTaskMenuButton("Symbol", symbols);
        symbol.dropdown.style.width = "50%";
        
        //Mesh functions
        function changesymbol(uni){
            safe.symbolUni = uni;
            mesh.geometry.dispose();
            mesh.geometry = new THREE.TextGeometry(uni, {
                font:"fontawesome", 
                size: safe.size ? safe.size : this.standartSize, 
                height: 0.01
            });
        }
        function changeColor(color) {
            safe.color = color;
            scope.standartColor = color;
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial({color: color});
            mesh.material.transparent = true;
        }
        
        //TaskType Object
        var taskType = new TaskType();
        taskType.mesh = mesh;
        taskType.name = "Symbol";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.symbol = {
            html: symbol
        };
        taskType.menu.color = new meshColorPicker(function(color) {
            changeColor(parseInt("0x"+color.toHex()));
        });
        taskType.menu.size =  new sliderTextField("Size", function(p){
            safe.size = p*100 || 0.0001;
            scope.standartSize = safe.size;
            changesymbol(safe.symbolUni);
        });

        return taskType;
    }
};
/*typeContainer["ov-add-text-field"] = {
    meta:{
        category: "text",
        name: "Text field",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenan convallis."
    },
    generateMesh: function(){
        var elem = document.createElement("div");//document.querySelector('#editor');
        elem.style.width = "128px";
        elem.style.height = "128px";
        elem.style.position = "fixed";
        elem.style.top = "0px";
        window.document.body.appendChild(elem);

        var editor = carota.editor.create(elem);
        editor.load([
                { text: 'Text' }
            ]);
        editor.select(0, 4);

        var canvas = elem.querySelector('canvas');
//        canvas.style.visibility = "hidden";
        var selector = elem.querySelector('.carotaSpacer');
        selector.style.border = "solid";
        selector.style.borderWidth = "1px";

        var texture = new THREE.Texture(canvas);
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
        
        return mesh;
    },
    getTaskType: function(mesh, safe){

        var taskType = {};
        taskType.name = "Text field";
        taskType.mesh = mesh;

        return taskType;
    }
};*/
//------- Geometrys
typeContainer["ov-add-circle"] = {
    meta:{
        category: "geometry",
        name: "Circle",
        background: "<div style='font-size:80px;font-family:fontawesome;'><center>\uf111</center></div>",
        description: "Adds a circle geometry."
    },
    defaultRadius: 100,
    defaultSegments: 64,
    defaultColor: 0,
    
    generateMesh: function(){
        var geometry = new THREE.CircleGeometry(this.defaultRadius, this.defaultSegments);
        var material = new THREE.MeshBasicMaterial({color: this.defaultColor});
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.z = -1000;
        return mesh;
    },
    getTaskType: function(mesh){
        var scope = this;
        var taskType = new TaskType();
        taskType.name = "Circle";
        
        taskType.menu = new Menu3D(mesh);
        taskType.menu.color = new meshColorPicker(function(color) {
            scope.defaultColor = parseInt("0x"+color.toHex());
            mesh.material.dispose();
            mesh.material = new THREE.MeshBasicMaterial({color: scope.defaultColor});
        });
        taskType.menu.size = new sliderTextField("Size", function(p){
            mesh.scale.x = p*2;
            mesh.scale.y = p*2;
            mesh.scale.z = p*2;
        });
        taskType.menu.segments = new sliderTextField("Segments", function(p){
            mesh.geometry.dispose();
            scope.defaultSegments = 3+p*100;
            mesh.geometry = new THREE.CircleGeometry(scope.defaultRadius, scope.defaultSegments);
        });

        return taskType; 
    }
};
typeContainer["ov-add-cube"] = {
    meta:{
        category: "geometry",
        name: "Cube",
        background: "<div style='font-size:80px;font-family:fontawesome;'><center>\uf1b2</center></div>",
        description: "Adds a cube geometry."
    },
    defaultColor: 0x999999,
    generateMesh: function(){
        var scope = this;
        var geometry = new THREE.BoxGeometry( 100, 100, 100 );
        var material = new THREE.MeshLambertMaterial({color: scope.defaultColor});
        var cube = new THREE.Mesh( geometry, material );
        cube.position.z = -1000;
        return cube;
    },
    getTaskType: function(mesh){
        var scope = this;
        var taskType = new TaskType();
        taskType.name = "3D Cube";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.color = new meshColorPicker(function(color) {
            scope.defaultColor = parseInt("0x"+color.toHex());
            mesh.material.dispose();
            mesh.material = new THREE.MeshLambertMaterial({color: scope.defaultColor});
        });
        taskType.menu.size = new sliderTextField("Size", function(p){
            mesh.scale.x = p * 2;
            mesh.scale.y = p * 2;
            mesh.scale.z = p * 2;
        });

        return taskType; 
    }
};
typeContainer.image = {
    meta:{
        category: "geometry",
        name: "Image",
        background: "<div style='font-size:80px;font-family:fontawesome;'><center>\uf03e</center></div>",
        description: "Adds an image."
    },
    defaultImage: "assets/default.png",
    textureLoader: new THREE.TextureLoader(),
    loadTexture: function(mesh, path){
        this.textureLoader.crossOrigin = '';
        this.textureLoader.load(
            path,
            function ( texture ) {
                texture.minFilter = THREE.LinearFilter;
                mesh.scale.x = (texture.image.width/texture.image.height);
                mesh.material.dispose();
                mesh.material = new THREE.MeshBasicMaterial( {
                    transparent: true,
                    map: texture
                } );
            },
            function ( xhr ) {},
            function ( xhr ) {}
        );
        
    },
    generateMesh: function(){
        var material = new THREE.MeshBasicMaterial({
            color : 0xAAAAAA
        });
        var geometry = new THREE.PlaneGeometry( 100, 100, 100 );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.z = -1000;
        this.loadTexture(mesh, this.defaultImage);
        
        return mesh;
    },
    getTaskType: function(mesh, safe){
        var scope = this;
        
        if(safe.path){
            scope.loadTexture(mesh, safe.path);
        }
        
        var textField = document.createElement("input");
        textField.type= "text";
        textField.value = "Image URL";
        textField.onchange = function(){
            scope.loadTexture(mesh, textField.value);
            safe.path = textField.value;
        };
        var image = createTaskMenuButton("Image", textField);
        
        var taskType = new TaskType();
        taskType.name = "Image";
        taskType.menu = new Menu3D(mesh);
        taskType.menu.image = {
            html: image
        };

        return taskType; 
    }
};
//------- Animations
typeContainer["ov-add-aniamtion"] = {
    meta:{
        category: "animation",
        name: "Property Saver",
        background: "<div style='font-size:50px;font-family:fontawesome;'><center>\uf005</center></div>",
        description: "Saves the properties of an element."
    },
    isAnimation: true,
    aniCollection: [],
    getTaskType: function(safe){
        var scope = this;
        var mesh;
        
        //Create TaskType Object and TaskMenu
        var taskType = new TaskType();
        taskType.animation = new TaskAnimation();
        if(safe.easing){taskType.animation.easing = EasingFunctions[safe.easing];}
        
        var meshData = safe.meshData || {animationValues: {}};
//        meshData.id = this.aniCollection.length;
        safe.meshData = meshData;
        this.aniCollection.push(meshData);
        
        var prevData = null;
        
        //Easing selection
        var easingContainer = document.createElement("div");
        var easingDiv = createTaskMenuButton("Easing", easingContainer);
        function onEasingClick(selection){
            return function(){
                safe.easing = selection;
                var easing = EasingFunctions[selection];
                taskType.animation.easing = easing;
                previousStep = -1;
                updateStep();
            };
        }
        for(var e in EasingFunctions){
            var option = document.createElement("div");
            option.className = "task-menu-font";
            option.innerHTML = e;
            option.onclick = onEasingClick(e);
            easingContainer.appendChild(option);
        }

        //TaskType Menu
        taskType.name = "Animation Save";
        taskType.menu.duration = new sliderTextField("Duration", function(p){
            taskType.animation.duration = p*2000;
            safe.duration = taskType.animation.duration;
            previousStep = -1;
            updateStep();
        });
//        taskType.menu.alpha = new sliderTextField("Alpha", function(p){
//            mesh.material.transparent = true;
//            mesh.material.opacity = p;
//            taskType.animation.onEdit();
//        });
        taskType.menu.easing = {
            html: easingDiv
        };
        taskType.onUpdate = function(step){
            //Update step
            meshData.step = step;
            getPrevData();
        };
        taskType.onDelete = function(){
            var i = scope.aniCollection.indexOf(meshData);
            if(i >= 0)scope.aniCollection.splice(i, 1);
        };
        
        function getPrevData(){
            prevData = null;
            for(var i=0; i < scope.aniCollection.length; i++){
                var data = scope.aniCollection[i];
                if(mesh.id === data.meshID){
                    if(data.step < meshData.step && (!prevData || data.step > prevData.step)){
                        prevData = data;
                    }
                }
            }
        }
        function prepAttr(mesh, animationValues, name, values){
            if(animationValues[name])return;
            
            var m = mesh[name];
            var a = animationValues[name] = {};
            for(var i=0; i < values.length; i++){
                a[values[i]] = m[values[i]];
            }
        }
        
        //set TaskType properties
        taskType.animation.onInit = function(m){
            m.material.transparent = true;
            m.material.opacity = 1.0;
            mesh = m;
            meshData.meshID = mesh.id;
            var aniData = meshData.animationValues;
            
            prepAttr(mesh, aniData, "position", ["x", "y", "z"]);
            prepAttr(mesh, aniData, "rotation", ["x", "y", "z"]);
            prepAttr(mesh, aniData, "scale", ["x", "y", "z"]);
            prepAttr(mesh, aniData, "material", ["opacity"]);
        };
        taskType.animation.onStart = function(){
            var aniData = meshData.animationValues;
            for(var value in aniData){
                var e = prevData ? prevData.animationValues[value] : null;
                if(e){
                    var m = mesh[value];
                    for(var i in e){
                        m[i] = e[i];
                    }
                }
            }
        };
        taskType.animation.onLoop = function(progress){
            var p = progress;
            var q = 1.0 - p;
            
            var aniData = meshData.animationValues;
            for(var value in aniData){
                var f = prevData ? prevData.animationValues[value] : null;
                var t = aniData[value];
                if(f && t){
                    var m = mesh[value];
                    for(var i in t){
                        m[i] = f[i]*q + t[i]*p;
                    }
                }
            }
        };
        taskType.animation.onEnd = function(){
            var aniData = meshData.animationValues;
            for(var value in aniData){
                var s = aniData[value];
                if(s){
                    var m = mesh[value];
                    for(var i in s){
                        m[i] = s[i];
                    }
                }
            }
        };
        taskType.animation.onEdit = function(){
            if(currentStep != meshData.step)return;
            
            var aniData = meshData.animationValues;
            for(var value in aniData){
                var a = aniData[value];
                var b = mesh[value];
                for(var i in a){
                    a[i] = b[i];
                }
            }
        };

        return taskType;
    }
};
//------- Remove
typeContainer["ov-remove"] = {
    meta:{
        category: "animation",
        name: "Remove",
        background: "<div style='font-size:80px;font-family:fontawesome;'><center>\uf056</center></div>",
        description: "Hides an element."
    },
    getTaskType: function(safe){
        var select = document.createElement("select");
        var button = createTaskMenuButton("3D Object", select);

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

function createTaskMenuButton(text, content){
    var div = document.createElement("div");
    div.className = "mdl-button mdl-js-button mdl-button--raised mdl-button--colored task-menu-button";
    div.innerHTML = text || "";
    
    div.dropdown = document.createElement("div");
    div.dropdown.className = "dropdown-task-menu mdl-card mdl-shadow--2dp";
    if(content)div.dropdown.appendChild(content);
    
    div.onclick = function(){
        var d = div.dropdown.style.display;
        div.dropdown.style.top = div.clientHeight+"px";
        div.dropdown.style.left = div.offsetLeft+"px";
        div.dropdown.style.display = (d==="block") ? "none" : "block";
        
        document.addEventListener("mousedown", function(event){
            if(!div.dropdown.contains(event.target) || div === event.target){
                div.dropdown.style.display = "none";
                document.removeEventListener('mousedown', arguments.callee);
            }
        });
//        div.dropdown.addEventListener("mouseleave", function(){
//           div.dropdown.style.display = "none";
//        });
    };
    
    return div;
}