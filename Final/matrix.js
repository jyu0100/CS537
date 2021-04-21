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

// fading bullets
var size_Loc;
var size;

// moving bullets
var move;
var move_Loc;
var tx = -1.0;
var tx_Loc;
var r = 1.0;
var r_Loc;

window.onload = function init() {
    // setup canvas
	canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.0, 1.0, 1.0, 0.2 ); // CHANGE TO WHITE LATER
	
	revolve();

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

	// event listener for moving bullet
	var move_checkbox = document.getElementById("c3");
	move_checkbox.addEventListener('change', function() {
		if (this.checked) {
			move = 1.0;
			console.log("move_checkbox checked")
		} else {
			move = 0.0;
			console.log("move_checkbox unchecked")
		}
	})

	// document.getElementById("slide").onchange= function() {
	
	// };
	
	// get locations in shader
	size_Loc = gl.getUniformLocation(program_shader2, "b");
	move_Loc = gl.getUniformLocation(program_shader2, "move");
	tx_Loc = gl.getUniformLocation(program_shader2, "tx");
	r_Loc = gl.getUniformLocation(program_shader2, "r");
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
	gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix2));
    gl.uniformMatrix4fv(projectionMatrixLoc2, false, flatten(projectionMatrix));

    gl.drawElements(gl.TRIANGLES, numVerticesInAllBulletFaces, gl.UNSIGNED_SHORT, 0);
}

var circlePoints = [];
var circleNormal;

// revolve camera around hand
function revolve() {
	// circular path: C + a cos(theta) U + b sin(theta) V, where a=b
	
	// major axis scale
	var a = 1.0;
	// minor axis scale
	var b = 1.0;
	// center point of sphere
	var C = vec3(0.0, 0.0, 0.0);
	// major axis vector U
	var U = (vec3(0.0, -1.0, 0.0));
	// minor axis vector V
	var V = (vec3(1.0, 0.0, 0.0));
	// normal is cross of U and V
	circleNormal = (cross(U, V));
	
	// iterate through theta for sphere points [0,2π]
	for (var i=0; i<360; i++) {
		var theta = radians(i);
		
		var acos = a*Math.cos(theta);
		var bsin = b*Math.sin(theta);
		
		var U_calc = vec3(acos*U[0], acos*U[1], acos*U[2]);
		var V_calc = vec3(bsin*V[0], bsin*V[1], bsin*V[2]);
		
		var UV = add(U_calc, V_calc);
		var point = add(C, UV);

		circlePoints.push(point);
	}
}

// variables for setting up camera view
var modelViewMatrix, projectionMatrix;
var modelViewMatrix2;
var idx = 0;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// camera for hand
	var cameraScale = 1;
	var eye1 = vec3(cameraScale*circlePoints[idx%360][0],
					cameraScale*circlePoints[idx%360][1],
					cameraScale*circlePoints[idx%360][2]);
	var at1 = vec3(0.0, 0.0, 0.0);
	var up1 = circleNormal;

	// camera for bullet
	var eye2 = vec3(0.0, 0.0, 0.0);
	var at2 = vec3(0.0, 0.0, 0.0);
	var up2 = vec3(0.0, 0.0, 0.0);

	modelViewMatrix = lookAt(eye1, at1, up1);
	modelViewMatrix2 = lookAt(eye2, at2, up2);
	idx++;

	var scale = 6;
	projectionMatrix = ortho(-1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale);
	
	renderFirstObject();
	
	renderSecondObject();

	// positive bullet direction
	if (move == 1.0) {
		// facing towards hand
		r = 1.0;
		// forward movement
		tx += 0.02;
		if (tx >= 0.3) {
			// move backwards now
			move = -1.0;
		}
	}
	// negative bullet direction
	if (move == -1.0) {
		// facing away from hand
		r = -1.0;
		// backwards movement
		tx -= 0.02;
		if (tx <= -1.3) {
			// move forwards now
			move = 1.0;
		}
	}

	// send values to shader
	gl.uniform1f(size_Loc, size);
	gl.uniform1f(move_Loc, move);
	gl.uniform1f(tx_Loc, tx);
	gl.uniform1f(r_Loc, r);

    requestAnimFrame(render);
}