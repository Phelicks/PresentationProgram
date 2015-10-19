/*jslint browser: true*/
/*global THREE*/

var scene, raycaster, mainRenderer, mainCamera;
var renderers = [];
var meshes = [];
var bboxHelper = [];
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
    
	var main = document.getElementById("main");
	var rendererObj = createRenderer(main);
    mainRenderer = rendererObj.renderer;
    mainCamera = rendererObj.camera;
	
	raycaster = new THREE.Raycaster();
    
	window.addEventListener( 'resize', onWindowResize, false );
	rendererObj.canvas.addEventListener( 'mousedown', onCanvasMouseDown, true );
	rendererObj.canvas.addEventListener( 'mousemove', onCanvasMouseMove, true );
	rendererObj.canvas.addEventListener( 'mouseup', onCanvasMouseUp, true );
//	rendererObj.canvas.addEventListener( 'touchstart', onCanvasTouchStart, false ); //TODO
	animate();
}
function createRenderer(canvas){
    //TODO delete renderer
    if(!canvas){
        canvas = document.createElement('canvas');
    }
    
	var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true } );
	renderer.setClearColor( 0x87CEFA );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(canvas.width, canvas.height);
    
	var camera = new THREE.PerspectiveCamera(20, canvas.width/canvas.height, 1, 10000);
    
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
        mesh.boundingBoxHelper.update();
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
function onCanvasTouchStart( event ) {
	event.preventDefault();
	
	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	onCanvasMouseDown( event );
}
function onCanvasMouseDown( event ) {
	event.preventDefault();
    mouseDownStart.x = event.offsetX;
    mouseDownStart.y = event.offsetY;
    
    var mouse = new THREE.Vector2();
	mouse.x =  (event.offsetX / mainRenderer.domElement.width ) * 2 - 1;
	mouse.y = -(event.offsetY / mainRenderer.domElement.height) * 2 + 1;
    
    getObjectSelection(mouse);
}
function onCanvasMouseUp(event){
    clickedMesh = undefined;
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
    }
}
function getObjectSelection(point){
    clickedMesh = getObjectOn(point);
    if(clickedMesh){
        var p = clickedMesh.position;
        clickedMesh.originalPosition = new THREE.Vector3(p.x, p.y, p.z);
    
        selectionOnCanvas(clickedMesh);
        select(clickedMesh);
    }
    else{
        deselect();
        deselectionOnCanvas();
    }
}
function getObjectOn(point){
    raycaster.setFromCamera(point, mainCamera);
	var intersects = raycaster.intersectObjects(bboxHelper);

	if (intersects.length > 0) {
        return intersects[0].object.object;
	}
    return null;
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
}
function deselect(){
    if(!bbox || !bbox.visible)return;
    selectedMesh = undefined;
    bbox.visible = false;
}