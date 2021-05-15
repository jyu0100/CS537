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

// standard lighting for hand
var lightPosition = vec4(-5.0, 0.0, -5.0, 0.0);
var lightAmbient = vec4(0.7, 0.7, 0.7, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(0.7, 0.7, 0.7, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 50.0;
var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);

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

// stop camera + slider
var stop_cam = false;
var enable_slide = false;
var path_index = 0;

// move hand
var tx_h;
var ty_h;
var txh_Loc;
var tyh_Loc;

// TODO: reflective mapping
var cubeMap;
var white = new Uint8Array([255, 255, 255, 255]);
var silver = new Uint8Array([187, 194, 204, 255]);
var red = new Uint8Array([255, 0, 0, 255]);
var green = new Uint8Array([0, 255, 0, 255]);
var blue = new Uint8Array([31, 81, 255, 255]);
var cyan = new Uint8Array([0, 255, 255, 255]);
var magenta = new Uint8Array([255, 0, 255, 255]);
var yellow = new Uint8Array([255, 255, 0, 255]);
// var pointsArray = [];
// var normalsArray = [];
// var vertices = [
//     vec4( -0.5, -0.5,  0.5, 1.0 ),
//     vec4( -0.5,  0.5,  0.5, 1.0 ),
//     vec4( 0.5,  0.5,  0.5, 1.0 ),
//     vec4( 0.5, -0.5,  0.5, 1.0 ),
//     vec4( -0.5, -0.5, -0.5, 1.0 ),
//     vec4( -0.5,  0.5, -0.5, 1.0 ),
//     vec4( 0.5,  0.5, -0.5, 1.0 ),
//     vec4( 0.5, -0.5, -0.5, 1.0 )
// ];
// function quad(a, b, c, d) {

// 	var t1 = subtract(vertices[b], vertices[a]);
// 	var t2 = subtract(vertices[c], vertices[a]);
// 	var normal = cross(t1, t2);
// 	normal[3] = 0.0;

// 	pointsArray.push(vertices[a]); 
// 	normalsArray.push(normal); 

// 	pointsArray.push(vertices[b]); 
// 	normalsArray.push(normal);  

// 	pointsArray.push(vertices[c]); 
// 	normalsArray.push(normal);;  
   
// 	pointsArray.push(vertices[a]); 
// 	normalsArray.push(normal);;  

// 	pointsArray.push(vertices[c]); 
// 	normalsArray.push(normal);;  

// 	pointsArray.push(vertices[d]); 
// 	normalsArray.push(normal);;     
// }
// function colorCube()
// {
//     quad( 1, 0, 3, 2 );
//     quad( 2, 3, 7, 6 );
//     quad( 3, 0, 4, 7 );
//     quad( 6, 5, 1, 2 );
//     quad( 4, 5, 6, 7 );
//     quad( 5, 4, 0, 1 );
// }


window.onload = function init() {
    // setup canvas
	canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.0, 1.0, 1.0, 0.2 ); // CHANGE LATER?

	// camera revolution around hand
	revolve();

	//colorCube();

	// load hand obj file using objLoader.js, and then call func to load bullet;
	loadOBJFromPath("Hand.obj", loadedHand, readBullet);
}

window.onresize = function() {
	var min = innerWidth;

	if (innerHeight < min) {
		min = innerHeight;
	}
	if (min < canvas.width || min < canvas.height) {
		gl.viewport(0, canvas.height-min, min, min)
	}
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
	hand_normals = orderCoords(hand_object, "normal");
	hand_texture_coords = orderCoords(hand_object, "texture");
	_callback();
}

function loadedBullet(data, _callback) {
	// assign the obj's various vertices/indices to respective variables
	bullet_object = loadOBJFromBuffer(data);
	console.log(bullet_object);
	bullet_indices = bullet_object.i_verts;
	bullet_vertices = bullet_object.c_verts;
	numVerticesInAllBulletFaces = bullet_indices.length;
	bullet_normals = orderCoords(bullet_object, "normal");
	bullet_texture_coords = orderCoords(hand_object, "texture");
	_callback();
}

// order coordinates of texture/normal to match ordering of vertices
function orderCoords(obj_object, flag){
	if (flag == "texture") {
		var texCoordsOrderedWithVertices = [];

		// separate tex coords into (u,v)
		var u_verts = [];
		var v_verts = [];
		for (var i=0; i<obj_object.c_uvt.length; i+=2) {
			u_verts.push(obj_object.c_uvt[i]);
			v_verts.push(obj_object.c_uvt[i+1]);
		}

		// match orderings of c_verts from i_verts
		for (var i=0; i<obj_object.i_verts.length; i++) {
			// i_verts[i] = a 	so GPU gets c_verts[a]
			// i_uvt[i] = 	b 	so orderTex[a] = c_uvt[b]
			// i_norms[i] = c 	so orderNorm[a] = c_norm[c]
			var a = obj_object.i_verts[i];
			var b = obj_object.i_uvt[i];
			texCoordsOrderedWithVertices[a] = vec2(u_verts[b], v_verts[b]);
		}
		
		// flatten array of arrays to single array
		texCoordsOrderedWithVertices = [].concat.apply([], texCoordsOrderedWithVertices);
		
		return texCoordsOrderedWithVertices;
	}
	else if (flag == "normal") {
		var normalsOrderedWithVertices = [];

		// separate norm coords into (x,y,z)
		var x_verts = [];
		var y_verts = [];
		var z_verts = [];
		for (var i=0; i<obj_object.c_norms.length; i+=3) {
			x_verts.push(obj_object.c_norms[i]);
			y_verts.push(obj_object.c_norms[i+1]);
			z_verts.push(obj_object.c_norms[i+2]);
		}

		// match ordering of c_verts from i_verts
		for (var i=0; i<obj_object.i_verts.length; i++) {
			// i_verts[i] = a 	so GPU gets c_verts[a] <- (x,y,z)
			// i_uvt[i] = 	b 	so orderTex[a] = c_uvt[b]
			// i_norms[i] = c 	so orderNorm[a] = c_norm[c]
			var a = obj_object.i_verts[i];
			var c = obj_object.i_norms[i];
			normalsOrderedWithVertices[a] = vec3(x_verts[c], y_verts[c], z_verts[c]);
		}
		
		// flatten array of arrays to single array
		normalsOrderedWithVertices = [].concat.apply([], normalsOrderedWithVertices);

		return normalsOrderedWithVertices;
	}
}

var texture1;
//var texture2;

function setupAfterDataLoad() {
	gl.enable(gl.DEPTH_TEST);
	
    setupFirstShaderBuffers();
	
	setupSecondShaderBuffers();
	setupThirdShaderBuffers();
	setupFourthShaderBuffers();
	
	var image = document.getElementById("hand_tex");
	texture1 = configureTexture(image);
	//configureCubeMap();
	
    render();	
}

function configureTexture(image) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	// cannot use mipmap on texture image (not power of 2) so use wrapping
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	return texture;
}

function configureCubeMap() {
    cubeMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, silver);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, blue);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, silver);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, blue);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, silver);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ,0,gl.RGBA,
       1,1,0,gl.RGBA,gl.UNSIGNED_BYTE, silver);
    
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
}

// variables for shader passing and acquiring location
var program_shader1, program_shader2, program_shader3, program_shader4;
var vBuffer1, vBuffer2, vBuffer3, vBuffer4; 
var vPosition1, vPosition2, vPosition3, vPosition4;
var iBuffer1, iBuffer2, iBuffer3, iBuffer4;
var projectionMatrixLoc1, modelViewMatrixLoc1;
var projectionMatrixLoc2, modelViewMatrixLoc2;
var projectionMatrixLoc3, modelViewMatrixLoc3;
var projectionMatrixLoc4, modelViewMatrixLoc4;
var normalMatrix, normalMatrixLoc, normalMatrixLoc2, normalMatrixLoc3, normalMatrixLoc4;

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

	// pass vertex normals to GPU
	var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(hand_normals), gl.STATIC_DRAW);

	// pass vertex normals to shader 
	var vNormal = gl.getAttribLocation(program_shader1, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

	// pass texture coords to GPU
	var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(hand_texture_coords), gl.STATIC_DRAW);
    
	// pass texture coords to shader
	var vTexCoord = gl.getAttribLocation(program_shader1, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
	 
	// location of modelView, projection, and normal matrices in shader
	modelViewMatrixLoc1 = gl.getUniformLocation(program_shader1, "modelViewMatrix");
    projectionMatrixLoc1 = gl.getUniformLocation(program_shader1, "projectionMatrix");
	normalMatrixLoc = gl.getUniformLocation(program_shader1, "normalMatrix");

    // location of vPosition in shader
	vPosition1 = gl.getAttribLocation(program_shader1, "vPosition");

	canvas.addEventListener("mousedown", function(event){
        tx_h = 2*event.clientX/canvas.width-1;
        ty_h = 2*(canvas.height-event.clientY)/canvas.height-1;
    } );

	txh_Loc = gl.getUniformLocation(program_shader1, "tx");
    tyh_Loc = gl.getUniformLocation(program_shader1, "ty");
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
	 
	// pass vertex normals to GPU
	var nBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bullet_normals), gl.STATIC_DRAW);

	// pass vertex normals to shader 
	// var vNormal = gl.getAttribLocation(program_shader2, "vNormal");
    // gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vNormal);

	//TODO:
	// var nBufferC = gl.createBuffer();
    // gl.bindBuffer( gl.ARRAY_BUFFER, nBufferC);
    // gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    // var vNormalC = gl.getAttribLocation( program_shader2, "vNormalC");
    // gl.vertexAttribPointer( vNormalC, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray( vNormalC);

    // var vBufferC = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vBufferC);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    // var vPositionC = gl.getAttribLocation( program_shader2, "vPositionC");
    // gl.vertexAttribPointer(vPositionC, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vPositionC);
	
	// location of modelView and projection matrices in shader 
	modelViewMatrixLoc2 = gl.getUniformLocation(program_shader2, "modelViewMatrix");
    projectionMatrixLoc2 = gl.getUniformLocation(program_shader2, "projectionMatrix");
	normalMatrixLoc2 = gl.getUniformLocation(program_shader2, "normalMatrix");

    // location of vPosition in shader
	vPosition2 = gl.getAttribLocation(program_shader2, "vPosition");

	// for fading bullets
	// event listeners
	// doesnt work when you put these outside a function
	var camera_checkbox = document.getElementById("c1");

	camera_checkbox.addEventListener('change', function() {
		if (this.checked) {
			stop_cam = true;
			console.log("camera_checkbox checked")
		} else {
			stop_cam = false;
			enable_slide = false;
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

	document.getElementById("slide").onchange= function() {
		if (stop_cam) {
			if (event.target.value == 0 || event.target.value == 360) {
				enable_slide = true;
				path_index = 0;
			} else {
				enable_slide = true;
				path_index = parseInt(event.target.value);
			}
		}
		//console.log(path_index)
		//console.log(enable_slide) 
	};
	
	// get locations in shader
	size_Loc = gl.getUniformLocation(program_shader2, "b");
	move_Loc = gl.getUniformLocation(program_shader2, "move");
	tx_Loc = gl.getUniformLocation(program_shader2, "tx");
	r_Loc = gl.getUniformLocation(program_shader2, "r");
}

function setupThirdShaderBuffers(){
	// load vertex and fragment shaders
    program_shader3 = initShaders(gl, "vertex-shader3", "fragment-shader3");
    gl.useProgram(program_shader3);

    // array element buffer
    iBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bullet_indices), gl.STATIC_DRAW);
	
    // vertex array attribute buffer
    vBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bullet_vertices), gl.STATIC_DRAW);
	 
	// pass vertex normals to GPU
	var nBuffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer3);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bullet_normals), gl.STATIC_DRAW);
	
	// location of modelView and projection matrices in shader 
	modelViewMatrixLoc3 = gl.getUniformLocation(program_shader3, "modelViewMatrix");
    projectionMatrixLoc3 = gl.getUniformLocation(program_shader3, "projectionMatrix");
	normalMatrixLoc3 = gl.getUniformLocation(program_shader3, "normalMatrix");

    // location of vPosition in shader
	vPosition3 = gl.getAttribLocation(program_shader3, "vPosition");
}

function setupFourthShaderBuffers(){
	// load vertex and fragment shaders
    program_shader4 = initShaders(gl, "vertex-shader4", "fragment-shader4");
    gl.useProgram(program_shader4);

    // array element buffer
    iBuffer4 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer4);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bullet_indices), gl.STATIC_DRAW);
	
    // vertex array attribute buffer
    vBuffer4 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer4);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bullet_vertices), gl.STATIC_DRAW);
	 
	// pass vertex normals to GPU
	var nBuffer4 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer4);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bullet_normals), gl.STATIC_DRAW);
	
	// location of modelView and projection matrices in shader 
	modelViewMatrixLoc4 = gl.getUniformLocation(program_shader4, "modelViewMatrix");
    projectionMatrixLoc4 = gl.getUniformLocation(program_shader4, "projectionMatrix");
	normalMatrixLoc4 = gl.getUniformLocation(program_shader4, "normalMatrix");

    // location of vPosition in shader
	vPosition3 = gl.getAttribLocation(program_shader4, "vPosition");
}

function renderFirstObject() {
	gl.useProgram(program_shader1);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer1);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.vertexAttribPointer(vPosition1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition1);
	
	// send modelView, projection, and normal matrices to shader
	gl.uniformMatrix4fv(modelViewMatrixLoc1, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc1, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

	// set tech texture as current texture to apply to hand
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture1);
	gl.uniform1i(gl.getUniformLocation(program_shader1, "texture"), 0);

    // send light components to shader
	gl.uniform4fv(gl.getUniformLocation(program_shader1, "lightPosition"), flatten(lightPosition));
	gl.uniform4fv(gl.getUniformLocation(program_shader1, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program_shader1, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program_shader1, "specularProduct"), flatten(specularProduct));	
	gl.uniform1f(gl.getUniformLocation(program_shader1, "shininess"), materialShininess);
	
	gl.drawElements(gl.TRIANGLES, numVerticesInAllHandFaces, gl.UNSIGNED_SHORT, 0);

	// had to drop these in here instead of render function to work
	gl.uniform1f(txh_Loc, tx_h);
    gl.uniform1f(tyh_Loc, ty_h);
}

function renderSecondObject() {
	gl.useProgram(program_shader2);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.vertexAttribPointer(vPosition2, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);
	
	gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix2));
    gl.uniformMatrix4fv(projectionMatrixLoc2, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc2, false, flatten(normalMatrix));

	// gl.activeTexture(gl.TEXTURE0);
	// gl.bindTexture(gl.TEXTURE_2D, texture2);
	// gl.uniform1i(gl.getUniformLocation(program_shader2, "texture"), 0);

	configureCubeMap();
    gl.activeTexture( gl.TEXTURE0 );
	//gl.bindTexture(gl.TEXTURE_2D, cubeMap);
    gl.uniform1i(gl.getUniformLocation(program_shader2, "texMap"),0); 

    gl.drawElements(gl.TRIANGLES, numVerticesInAllBulletFaces, gl.UNSIGNED_SHORT, 0);
}

function renderThirdObject() {
	gl.useProgram(program_shader3);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer3);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer3);
    gl.vertexAttribPointer(vPosition3, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition3);
	
	gl.uniformMatrix4fv(modelViewMatrixLoc3, false, flatten(modelViewMatrix3));
    gl.uniformMatrix4fv(projectionMatrixLoc3, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc3, false, flatten(normalMatrix));


	configureCubeMap();
    gl.activeTexture( gl.TEXTURE0 );
	//gl.bindTexture(gl.TEXTURE_2D, cubeMap);
    gl.uniform1i(gl.getUniformLocation(program_shader3, "texMap"),0); 

    gl.drawElements(gl.TRIANGLES, numVerticesInAllBulletFaces, gl.UNSIGNED_SHORT, 0);
}

function renderFourthObject() {
	gl.useProgram(program_shader4);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer4);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer4);
    gl.vertexAttribPointer(vPosition4, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition4);
	
	gl.uniformMatrix4fv(modelViewMatrixLoc4, false, flatten(modelViewMatrix4));
    gl.uniformMatrix4fv(projectionMatrixLoc4, false, flatten(projectionMatrix));
	gl.uniformMatrix3fv(normalMatrixLoc4, false, flatten(normalMatrix));


	configureCubeMap();
    gl.activeTexture( gl.TEXTURE0 );
	//gl.bindTexture(gl.TEXTURE_2D, cubeMap);
    gl.uniform1i(gl.getUniformLocation(program_shader4, "texMap"),0); 

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
var modelViewMatrix2, modelViewMatrix3, modelViewMatrix4;
var idx = 0;
var stop_popup = false;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// camera for hand
	var cameraScale = 1;
	var eye1;
	if (!enable_slide) {
		eye1 = vec3(cameraScale*circlePoints[idx%360][0],
			cameraScale*circlePoints[idx%360][1],
			cameraScale*circlePoints[idx%360][2]);
	}
	if (enable_slide) {
		eye1 = vec3(cameraScale*circlePoints[path_index][0],
			cameraScale*circlePoints[path_index][1],
			cameraScale*circlePoints[path_index][2]);
	}
	var at1 = vec3(0.0, 0.0, 0.0);
	var up1 = circleNormal;

	// camera for bullet
	var eye2 = vec3(0.0, 0.0, 0.0);
	var at2 = vec3(0.0, 0.0, 0.0);
	var up2 = vec3(0.0, 0.0, 0.0);

	// var eye3 = vec3(0.0, 0.0, 0.0);
	// var at3 = vec3(0.0, 0.0, 0.0);
	// var up3 = vec3(0.0, 0.0, 0.0);

	// var eye4 = vec3(0.0, 0.0, 0.0);
	// var at4 = vec3(0.0, 0.0, 0.0);
	// var up4 = vec3(0.0, 0.0, 0.0);

	modelViewMatrix = lookAt(eye1, at1, up1);
	modelViewMatrix2 = lookAt(eye2, at2, up2);
	// modelViewMatrix3 = lookAt(eye3, at3, up3);
	// modelViewMatrix4 = lookAt(eye4, at4, up4);

	var scale = 6;
	projectionMatrix = ortho(-1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale);

	// normal matrix for lighting
	normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

	if (!stop_cam & !enable_slide) {
		idx++;
	}
	
	renderFirstObject();
	
	renderSecondObject();

	// renderThirdObject();
	//renderFourthObject();

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

	if (tx >= tx_h & !stop_popup) {
		alert("You got hit")
		stop_popup = true;
	}
	
    requestAnimFrame(render);
}