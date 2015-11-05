/*jslint browser: true*/
/*global THREE*/

var fov = 20;
var scene, raycaster, mainRenderer, mainCamera, currentBGColor;
var renderers = [];
var meshes = [];
var bboxHelper = [];
var rotationHandles = [];
var rotationAxis = null;
var rotationEmpty;
var bbox, selectedMesh, clickedMesh;
var selection = false;
var mouseDownStart = new THREE.Vector2();
var textures = [];

function initCanvas() {
	scene = new THREE.Scene();

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 0, 1 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffff00, 0.75 );
	light.position.set( 0, 0, - 1 );
	scene.add( light );
    
    createAspectPlane(16/9);
//    createAspectPlane(4/3);
    
	var main = document.getElementById("main");
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
    changeBackgroundColor(0x87CEFA);
	animate();
    
    var geometry = new THREE.TorusGeometry( 100, 3, 16, 100 );
    var red = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    var green = new THREE.MeshBasicMaterial( { color: 0x00FF00 } );
    var blue = new THREE.MeshBasicMaterial( { color: 0x0000FF } );
    
    rotationEmpty = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), new THREE.MeshNormalMaterial());
    rotationEmpty.material.visible = false;
    scene.add(rotationEmpty);
    rotationEmpty.visible = false;
    rotationEmpty.hide = true;
    
    
    var rotationHandle = new THREE.Mesh( geometry, blue );
    rotationHandle.rotationAxis = new THREE.Vector3(0, 0, 1);
    rotationEmpty.add(rotationHandle);
    rotationHandles.push(rotationHandle);
    
    rotationHandle = new THREE.Mesh( geometry, green );
    rotationHandle.rotationAxis = new THREE.Vector3(1, 0, 0);
    rotationHandle.rotation.y = Math.PI/2;
    rotationEmpty.add(rotationHandle);
    rotationHandles.push(rotationHandle);
    
    rotationHandle = new THREE.Mesh( geometry, red );
    rotationHandle.rotationAxis = new THREE.Vector3(0, 1, 0);
    rotationHandle.rotation.x = Math.PI/2;
    rotationEmpty.add(rotationHandle);
    rotationHandles.push(rotationHandle);
    
    var rButton = document.querySelector("#rotation-button");
    rButton.onclick = function(){
        rotationEmpty.visible = !rotationEmpty.visible;
        rotationEmpty.hide = !rotationEmpty.visible;
    };
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

function animate() {
	requestAnimationFrame( animate );
    var i=0;
    
    for(i=0; i < textures.length; i++){
        //TODO only on change
        textures[i].needsUpdate = true;
    }
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

//Input
function onCanvasMouseDown( event ) {
    var dpi = window.devicePixelRatio || 1;
    mouseDownStart.x = event.offsetX;
    mouseDownStart.y = event.offsetY;
    
    var mouse = new THREE.Vector2();
	mouse.x =  (event.offsetX / (mainRenderer.domElement.width  / dpi)) * 2 - 1;
	mouse.y = -(event.offsetY / (mainRenderer.domElement.height / dpi)) * 2 + 1;
    
    getObjectSelection(mouse);
	event.preventDefault();
}
function onCanvasMouseUp(event){
    clickedMesh = undefined;
    rotationAxis = null;
    selection = false;
}
function onCanvasMouseMove(event){
    if(clickedMesh){
        var x = event.offsetX;
        var y = event.offsetY;
    
        var oP = clickedMesh.originalPosition;
        clickedMesh.position.set(oP.x + (x-mouseDownStart.x)/1.4, oP.y - (y-mouseDownStart.y)/1.4, oP.z);//TODO 1.4
        select(clickedMesh);
        onMeshChange(clickedMesh);
        
        if(rotationEmpty){
            rotationEmpty.position.set(clickedMesh.position.x, clickedMesh.position.y, clickedMesh.position.z);
        }
    }
    else if(selectedMesh && rotationAxis){
        var x = event.offsetX - mouseDownStart.x;
        var y = event.offsetY - mouseDownStart.y;
        var d = Math.sqrt(x*x + y*y);
        if(x < 0 || y < 0) d = -d;
        
        rotationEmpty.rotateOnAxis(rotationAxis, d*(Math.PI/180)/360);
        selectedMesh.rotateOnAxis(rotationAxis, d*(Math.PI/180)/360);
    }
}

function onCanvasTouchStart( event ) {
    var dpi = window.devicePixelRatio || 1;
    
    var t = event.touches[0];
	event.offsetX = t.clientX - t.target.getBoundingClientRect().top  / dpi;
	event.offsetY = t.clientY - t.target.getBoundingClientRect().left / dpi;
	onCanvasMouseDown( event );
	
    event.preventDefault();
}
function onCanvasTouchMove(event) {
    var dpi = window.devicePixelRatio || 1;
    
    var t = event.touches[0];
	event.offsetX = t.clientX - t.target.getBoundingClientRect().top  / dpi;
	event.offsetY = t.clientY - t.target.getBoundingClientRect().left / dpi;
	onCanvasMouseMove(event);
	
    event.preventDefault();
}
function onCanvasTouchEnd(event) {
    onCanvasMouseUp(event);
}

function getObjectSelection(point){
    var mesh = getObjectOn(point, bboxHelper);
    if(mesh)mesh = mesh.object;
    var clickedRotation = getObjectOn(point, rotationHandles);
    if(clickedRotation && !clickedRotation.parent.visible)clickedRotation = null;
    
    if(mesh && !clickedRotation){
        var p = mesh.position;
        mesh.originalPosition = new THREE.Vector3(p.x, p.y, p.z);
    
        selectionOnCanvas(mesh);
        select(mesh);
        clickedMesh = mesh;
        rotationAxis = null;
    }
    else if(clickedRotation && selectedMesh){
        rotationAxis = clickedRotation.rotationAxis;
    }
    else{
        clickedMesh = null;
        rotationAxis = null;
        deselect();
        deselectionOnCanvas();
    }
    
}
function getObjectOn(point, meshContainer){
    raycaster.setFromCamera(point, mainCamera);
	var intersects = raycaster.intersectObjects(meshContainer);

	if (intersects.length > 0) {
        return intersects[0].object;
	}
    return null;
}

function changeBackgroundColor(color){
    if(isNaN(color))color = Number("0x"+color.toHex());
    currentBGColor = color;
    for(var i=0; i < renderers.length; i++){
        renderers[i].renderer.setClearColor(color);
    }
}

function prepMesh(mesh){
    //TODO
    //make sure if you use scene.remove(mesh), you also call mesh.geometry.dispose(), mesh.material.dispose() and mesh.texture.dispose()
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
    
//    THREE.SceneUtils.detach(rotationEmpty, rotationEmpty.parent, scene);
//    THREE.SceneUtils.attach(rotationEmpty, scene, mesh);
    rotationEmpty.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    rotationEmpty.rotation.set(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
    if(!rotationEmpty.hide)rotationEmpty.visible = true;
}
function deselect(){
    if(!bbox || !bbox.visible)return;
    selectedMesh = undefined;
    bbox.visible = false;
    if(!rotationEmpty.hide)rotationEmpty.visible = false;
}