/*jslint browser: true*/
/*global THREE, interact*/

var fov = 20;

var scene, raycaster, mainRenderer, mainCamera, 
    currentBGColor, bbox, selectedMesh, clickedMesh;
var meshIDs = 0;
var renderers = [];
var textures = [];
var meshes = [];
var bboxHelper = [];

var multiTouchAngle = 0;
var mouseDownStart = new THREE.Vector2();
var selection, isRotationActive = false;

//Render managment
function initCanvas() {
	scene = new THREE.Scene();

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 0, 1 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.75 );
	light.position.set( 0, 0, - 1 );
	scene.add( light );
    
    createAspectPlane(16/9);
//    createAspectPlane(4/3);
    
	var main = document.getElementById("main-canvas");
	var rendererObj = createRenderer(main);
    mainRenderer = rendererObj.renderer;
    mainCamera = rendererObj.camera;
	
	raycaster = new THREE.Raycaster();
    
	window.addEventListener( 'resize', onWindowResize, false );
	rendererObj.canvas.addEventListener( 'mousedown', onCanvasMouseDown, true );
	rendererObj.canvas.addEventListener( 'mousemove', onCanvasMouseMove, true );
	rendererObj.canvas.addEventListener( 'mouseup', onCanvasMouseUp, true );
    
	rendererObj.canvas.addEventListener( 'touchstart', onCanvasTouchStart, false );
	rendererObj.canvas.addEventListener( 'touchmove', onCanvasTouchMove, false );
	rendererObj.canvas.addEventListener( 'touchend', onCanvasTouchEnd, false );
    changeBackgroundColor(0xFFFFFF);
	animate();
    
    var rButton = document.querySelector("#rotation-button");
    rButton.style.display = "none";
    rButton.onclick = function(){
        isRotationActive = !isRotationActive;
        
        if(isRotationActive){
            if(bbox)bbox.material.color.setHex(0x0000FF);
//            rButton.classList.add("mdl-button--colored");
            rButton.innerHTML = "Position";
        }
        else{
            if(bbox)bbox.material.color.setHex(0xFF0000);
//            rButton.classList.remove("mdl-button--colored");
            rButton.innerHTML = "Rotation";
        }
    };

    interact('#main-canvas').gesturable({
      onmove: function (event) {
        multiTouchAngle += event.da;
      }
});
    
}
function createRenderer(canvas){
    //TODO delete renderer
    if(!canvas){
        canvas = document.createElement('canvas');
    }
    
	var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(canvas.width, canvas.height);
    
	var camera = new THREE.PerspectiveCamera(fov, canvas.width/canvas.height, 1, 10000);
    
    var save = renderers[renderers.length] = {
        renderer: renderer,
        canvas: canvas,
        camera: camera
    };
    onWindowResize();
    
	return save;
}
function openCanvasWindow(){
    var window2 = window.open("", "_blank", "directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,height=500,width=500");
    window2.addEventListener( 'resize', onWindowResize, false );

    var rendererObj = createRenderer();
    var canvas = rendererObj.renderer.domElement;
    canvas.onclick = function () {
        if (canvas.requestFullscreen) {
          canvas.requestFullscreen();
        } else if (canvas.msRequestFullscreen) {
          canvas.msRequestFullscreen();
        } else if (canvas.mozRequestFullScreen) {
          canvas.mozRequestFullScreen();
        } else if (canvas.webkitRequestFullscreen) {
          canvas.webkitRequestFullscreen();
        }
    };
    window2.document.body.style.margin = 0;
    window2.document.body.appendChild(canvas);
    changeBackgroundColor(currentBGColor);
}

//canvas management
function animate() {
	requestAnimationFrame( animate );
    var i=0;
    
//    for(i=0; i < textures.length; i++){
//        //TODO only on change
//        textures[i].needsUpdate = true;
//    }
    
    // update scene
    for(i=0; i<meshes.length; i++){
        var mesh = meshes[i];
        if(!mesh.boundingBoxHelper)continue;
        mesh.boundingBoxHelper.update();
        mesh.boundingBoxHelper.scale.z = 0.01;//TODO
    }
    if(selectedMesh){
        bbox.update(selectedMesh);
    }

    for(i=0; i<renderers.length; i++){
        var renderer = renderers[i].renderer;
        var camera = renderers[i].camera;
        camera.lookAt( scene.position );
        renderer.render( scene, camera );
    }
}
function onWindowResize(){
    for(var i=0; i<renderers.length; i++){
        var renderer = renderers[i].renderer;
        var canvas = renderers[i].canvas;
        var camera = renderers[i].camera;
        
        //Resize canvas element
        var parent = canvas.parentNode;
        if(parent){
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            canvas.style.width = parent.clientWidth;
            canvas.style.height = parent.clientHeight;
        }
        camera.aspect = canvas.width/canvas.height;
        camera.updateProjectionMatrix();

        renderer.setSize(canvas.width, canvas.height);
    }
}
function changeBackgroundColor(color){
    if(isNaN(color))color = Number("0x"+color.toHex());
    currentBGColor = color;
    for(var i=0; i < renderers.length; i++){
        renderers[i].renderer.setClearColor(color);
    }
}
function createAspectPlane(aspect){
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3(-aspect/2, -0.5, 0),
        new THREE.Vector3( aspect/2, -0.5, 0),
        new THREE.Vector3( aspect/2,  0.5, 0),
        new THREE.Vector3(-aspect/2,  0.5, 0),
        new THREE.Vector3(-aspect/2, -0.5, 0)
    );
    var material = new THREE.LineBasicMaterial({
        color: 0x000000
    });
    var plane = new THREE.Line(geometry, material);
    var planeHeight = 0.5;
    var degToRad = Math.PI/180;
    var alpha = (90-(fov/2))*degToRad;
    plane.position.set(0, 0, -(Math.tan(alpha)*planeHeight));
    scene.add(plane);
    return plane;
}

//Input
//touch -> translate to mouse
function onCanvasTouchStart(event) {
    var dpi = window.devicePixelRatio || 1;
    
    var t = event.touches[0];
	event.offsetX = t.clientX - t.target.getBoundingClientRect().left;
	event.offsetY = t.clientY - t.target.getBoundingClientRect().top;
	onCanvasMouseDown( event );
	
    event.preventDefault();
}
function onCanvasTouchMove(event) {
    var dpi = window.devicePixelRatio || 1;
    
    var t = event.touches[0];
	event.offsetX = t.clientX - t.target.getBoundingClientRect().left;
	event.offsetY = t.clientY - t.target.getBoundingClientRect().top;
	onCanvasMouseMove(event);
	
    event.preventDefault();
}
function onCanvasTouchEnd(event) {
    onCanvasMouseUp(event);
}

//mouse
function onCanvasMouseDown( event ) {
    var dpi = window.devicePixelRatio || 1;
    mouseDownStart.x = event.offsetX;
    mouseDownStart.y = event.offsetY;
    
    var mouse = new THREE.Vector2();
	mouse.x =  (event.offsetX / (mainRenderer.domElement.clientWidth  )) * 2 - 1;
	mouse.y = -(event.offsetY / (mainRenderer.domElement.clientHeight )) * 2 + 1;
    
    getObjectSelection(mouse);
	event.preventDefault();
}
function onCanvasMouseUp(event){
    clickedMesh = undefined;
    selection = false;
    multiTouchAngle = 0;
}
function onCanvasMouseMove(event){
    if(clickedMesh){
        var x = event.offsetX;
        var y = event.offsetY;
        var scaleFactor = 1.4;//TODO 1.4
        var xDis = x-mouseDownStart.x;
        var yDis = y-mouseDownStart.y;
        
        if(!isRotationActive){
            var oP = clickedMesh.originalPosition;
            clickedMesh.position.set(oP.x + xDis/scaleFactor, oP.y - yDis/scaleFactor, oP.z);
        }
        else{
            var toQ = new THREE.Quaternion();
            var yRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), xDis/2 * (Math.PI/180));
            var xRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), yDis/2 * (Math.PI/180));
            var zRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -multiTouchAngle * (Math.PI/180));
            toQ.copy(xRot);
            toQ.multiply(yRot);
            toQ.multiply(zRot);
            toQ.multiply(clickedMesh.originalRotation);
            clickedMesh.rotation.setFromQuaternion(toQ);
        }
        
        select(clickedMesh);
        onMeshChange(clickedMesh);
    }
}

//mesh management
function prepMesh(mesh){
    //TODO
    //make sure if you use scene.remove(mesh), you also call mesh.geometry.dispose(), mesh.material.dispose() and mesh.texture.dispose()
	mesh.id = meshIDs++;
    scene.add(mesh);
    
    var box = new THREE.BoundingBoxHelper(mesh, 0xFF0000);
    box.update();
    box.material.visible = false;
    box.scale.z = 0.01;//TODO
    scene.add(box);
    bboxHelper.push(box);
    
    mesh.boundingBoxHelper = box;
    mesh.setVisible = function(bool){
        mesh.visible = bool;
        box.visible = bool;
    };
    meshes.push(mesh);
}
function deleteMesh(mesh){
    var bboxInx = bboxHelper.indexOf(mesh.boundingBoxHelper);
    if(bboxInx >= 0)bboxHelper.splice(bboxInx, 1);
    mesh.boundingBoxHelper.geometry.dispose();
    mesh.boundingBoxHelper.material.dispose();
    scene.remove(mesh.boundingBoxHelper);
    
    var meshInx = meshes.indexOf(mesh);
    if(meshInx >= 0)meshes.splice(meshInx, 1);
    mesh.geometry.dispose();
    mesh.material.dispose();
    scene.remove(mesh);
}
function select(mesh){
    if(mesh === selectedMesh)return;
    //check for bbox mesh
    if(!bbox){
        bbox = new THREE.BoxHelper(mesh);
        bbox.material.color.setHex(0xFF0000);
        scene.add(bbox);
    }
    
    bbox.visible = true;
    bbox.update(mesh);
    
    if(!selection){
        if(mesh.onClick){mesh.onClick();}
        selection = true;
    }
    //TODO if(mesh.onClicked){mesh.onClicked();}
    
    selectedMesh = mesh;
}
function deselect(){
    if(!bbox || !bbox.visible)return;
    selectedMesh = undefined;
    bbox.visible = false;
}
function getObjectSelection(point){
    var mesh = getObjectOn(point, bboxHelper);
    if(mesh)mesh = mesh.object;
    
    if(mesh){
        var p = mesh.position;
        mesh.originalPosition = new THREE.Vector3(p.x, p.y, p.z);
        mesh.originalRotation = new THREE.Quaternion();
        mesh.originalRotation.setFromEuler(mesh.rotation);
    
        selectionOnCanvas(mesh);
        select(mesh);
        clickedMesh = mesh;
    }
    else{
        clickedMesh = null;
        deselect();
        deselectionOnCanvas();
    }
    
}
function getObjectOn(point, meshContainer){
    raycaster.setFromCamera(point, mainCamera);
	var intersects = raycaster.intersectObjects(meshContainer);

	if (intersects.length > 0) {
        var mesh = intersects[0].object;
        var distance = NaN;
        for(var i=0; i<intersects.length; i++){
            var m = intersects[i].object;
            var dis = mainCamera.position.distanceTo(m.position);
            if(isNaN(distance) || dis < distance){
                mesh = m;
                distance = dis;
            }
        }
        return mesh;
	}
    return null;
}