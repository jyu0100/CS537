"use strict";

var canvas;
var gl;

// hand obj variables
var hand_object;
var hand_vertices;
var hand_indices;
var hand_normals;
var hand_texture_coords;
var numVerticesInAllHandFaces;

// bullet obj variables
var bullet_object;
var bullet_vertices;
var bullet_indices;
var bullet_normals;
var bullet_texture_coords;
var numVerticesInAllBulletFaces;

// for fading bullets
var size_Loc;
var size;

window.onload = function init() {
    // setup canvas
	canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 1.0, 1.0, 0.2 ); // CHANGE TO WHITE LATER
	
	//ellipse();

	// load hand obj file using objLoader.js, and then call func to load bullet;
	loadOBJFromPath("Hand.obj", loadedHand, readBullet);
}

function readBullet() {
	// load bullet obj using objLoader.js, and then call func to setup data
	loadOBJFromPath("Bullet.obj", loadedBullet, setupAfterDataLoad);
}

function loadedHand(data, _callback) {
	// assign the obj's various vertices/indices to respective variables
	hand_object = loadOBJFromBuffer(data);
	console.log(hand_object);
	hand_indices = hand_object.i_verts;
	hand_vertices = hand_object.c_verts;
	numVerticesInAllHandFaces = hand_indices.length;
	hand_normals = hand_object.c_norms;
	hand_texture_coords = hand_object.c_uvt;
	// need normal/texture indices here?
	_callback();
}

function loadedBullet(data, _callback) {
	// assign the obj's various vertices/indices to respective variables
	bullet_object = loadOBJFromBuffer(data);
	console.log(bullet_object);
	bullet_indices = bullet_object.i_verts;
	bullet_vertices = bullet_object.c_verts;
	numVerticesInAllBulletFaces = bullet_indices.length;
	bullet_normals = bullet_object.c_norms;
	bullet_texture_coords = bullet_object.c_uvt;
	// need normal/texture indices here?
	_callback();
}

function setupAfterDataLoad() {
	gl.enable(gl.DEPTH_TEST);
	
    setupFirstShaderBuffers();
	
	setupSecondShaderBuffers();
	
	// var image = document.getElementById("texImage");
	// texture1 = configureTexture( image );
	
    render();	
}

// variables for shader passing and acquiring location
var program_shader1, program_shader2;
var vBuffer1, vBuffer2; 
var vPosition1, vPosition2;
var iBuffer1, iBuffer2;
var projectionMatrixLoc1, modelViewMatrixLoc1;
var projectionMatrixLoc2, modelViewMatrixLoc2;

function setupFirstShaderBuffers(){
	// load vertex and fragment shaders
    program_shader1 = initShaders(gl, "vertex-shader1", "fragment-shader1");
    gl.useProgram(program_shader1);

    // array element buffer
    iBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hand_indices), gl.STATIC_DRAW);
	
    // vertex array attribute buffer
    vBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hand_vertices), gl.STATIC_DRAW);
	 
	// location of modelView and projection matrices in shader
	modelViewMatrixLoc1 = gl.getUniformLocation(program_shader1, "modelViewMatrix");
    projectionMatrixLoc1 = gl.getUniformLocation(program_shader1, "projectionMatrix");

    // location of vPosition in shader
	vPosition1 = gl.getAttribLocation(program_shader1, "vPosition");
}

function setupSecondShaderBuffers(){
	// load vertex and fragment shaders
    program_shader2 = initShaders(gl, "vertex-shader2", "fragment-shader2");
    gl.useProgram(program_shader2);

    // array element buffer
    iBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bullet_indices), gl.STATIC_DRAW);
	
    // vertex array attribute buffer
    vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bullet_vertices), gl.STATIC_DRAW);
	 
	// location of modelView and projection matrices in shader 
	modelViewMatrixLoc2 = gl.getUniformLocation(program_shader2, "modelViewMatrix");
    projectionMatrixLoc2 = gl.getUniformLocation(program_shader2, "projectionMatrix");

    // location of vPosition in shader
	vPosition2 = gl.getAttribLocation(program_shader2, "vPosition");

	// for fading bullets
	// event listeners
	// doesnt work when you put these outside a function
	var camera_checkbox = document.getElementById("c1");

	camera_checkbox.addEventListener('change', function() {
		if (this.checked) {
			console.log("camera_checkbox checked")
		} else {
			console.log("camera_checkbox unchecked")
		}
	})

	var bullet_checkbox = document.getElementById("c2");

	bullet_checkbox.addEventListener('change', function() {
		if (this.checked) {
			size = 0.0;
			console.log("bullet_checkbox checked")
		} else {
			size = 1.0; //any value other than 0 should work
			console.log("bullet_checkbox unchecked")
		}
	})

	// document.getElementById("slide").onchange= function() {
	
	// };
	size_Loc = gl.getUniformLocation(program_shader2, "b");
}

function renderFirstObject() {
	gl.useProgram(program_shader1);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition1);
	
	// send modelView and projection matrices to shader
	gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc1, false, flatten(projectionMatrix));

    gl.drawElements(gl.TRIANGLES, numVerticesInAllHandFaces, gl.UNSIGNED_SHORT, 0);
}

function renderSecondObject() {
	gl.useProgram(program_shader2);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.vertexAttribPointer(vPosition2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);
	
	// send modelView and projection matrices to shader
	gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc2, false, flatten(projectionMatrix));

    gl.drawElements(gl.TRIANGLES, numVerticesInAllBulletFaces, gl.UNSIGNED_SHORT, 0);
}


// variables for setting up camera view
var modelViewMatrix, projectionMatrix;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	//Setup ModelView and Projection Matrices.
	var eye = vec3(1.0, 0.0, 0.0);
	var at = vec3(0.0, 0.0, 0.0);
	var up = vec3(0.0, 1.0, 0.0);

	modelViewMatrix = lookAt(eye, at, up);
	var scale = 6;
	projectionMatrix = ortho(-1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale);
	
	renderFirstObject();
	
	renderSecondObject();

	
	gl.uniform1f(size_Loc, size);

    requestAnimFrame( render );
}