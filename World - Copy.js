var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }`;

var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'varying vec2 v_UV;' +
    'uniform vec4 u_FragColor;\n' +
    'uniform sampler2D u_Sampler0;' +
    'uniform sampler2D u_Sampler1;' +
    'uniform sampler2D u_Sampler2;' +
    'uniform int u_whichTexture;'+
    'void main() {\n' +
    '   if(u_whichTexture == -2){' +
    '       gl_FragColor = u_FragColor;\n'+
    '   } else if (u_whichTexture ==-1){' +
    '       gl_FragColor = vec4(v_UV,1.0,1.0);' +
    '   } else if(u_whichTexture == 0){' +
    '       gl_FragColor = texture2D(u_Sampler0, v_UV);' +
    '   } else if(u_whichTexture == 1){' +
    '       gl_FragColor = texture2D(u_Sampler1, v_UV);'+
    '   } else if(u_whichTexture == 2){' +
    '       gl_FragColor = texture2D(u_Sampler2, v_UV);'+
    '   } else{' +
    '       gl_FragColor = vec4(1,.2,.2,1);' +
    '   }\n' +
    '}';

// Global variables
let canvas;
let gl;
let a_Position;
let a_UV
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;

function setupWebGL() { // done
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    gl.enable(gl.DEPTH_TEST);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
}

function connectVariablesToGLSL() { // done

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Get location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }


    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if(!u_Sampler0){
        console.log('Failed to get the storage location of u_Sampler0');
        return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if(!u_Sampler1){
        console.log('Failed to get the storage location of u_Sampler1');
        return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if(!u_Sampler2){
        console.log('Failed to get the storage location of u_Sampler2');
        return false;
    }

    u_whichTextures = gl.getUniformLocation(gl.program, 'u_whichTextures');
    if(!u_whichTextures){
        console.log('Failed to get the storage location of u_whichTextures');
        return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

function initTextures(){ // done

  var image0 = new Image(); // Create an image object
    if(!image0){
    console.log('Failed to create the image1 object');
    return false;
  }

  var image1 = new Image(); // Create an image object
    if(!image1){
    console.log('Failed to create the image2 object');
    return false;
  }

  var image2 = new Image(); // Create an image object
    if(!image2){
    console.log('Failed to create the image3 object');
    return false;
  }

  image.onload = function(){ sendTextureToGLSL(image0, 0); };
  image.onload = function(){ sendTextureToGLSL(image1, 1); };
  image.onload = function(){ sendTextureToGLSL(image2, 2); };

  image0.src = 'dirt.png';
  image1.src = 'grass.png';
  image2.src = 'sky.jpg';

  return true;
}

function sendImageToTexture (image, texNum) { // done

  texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if(texNum == 0){
    gl.activeTexture(gl.TEXTURE0);
  } else if (texNum == 1){
    gl.activeTexture(gl.TEXTURE1);
  } else if (texNum == 2){
    gl.activeTexture(gl.TEXTURE2);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  if(texNum == 0){
    gl.uniform1i(u_Sampler0, 0);
  } else if (texNum == 1){
    gl.uniform1i(u_Sampler1, 1);
  } else if (texNum == 2){
    gl.uniform1i(u_Sampler2, 2);
  
  //gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
  console.log("finished loadTexture");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    requestAnimationFrame(tick);
}

function updateAnimationAngles() {

}

var g_startTime = performance.now()/1000;
var g_seconds = performance.now()/1000-g_startTime;

function tick() { // done

    g_seconds = performance.now()/1000-g_startTime;

    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function keydown(ev){

    if(ev.keyCode == 83){
        g_camera.moveBack();
    }

    else if(ev.keyCode == 81){
        g_camera.panLeft();
    }

    else if(ev.keyCode == 65){
        g_camera.moveLeft();
    }

    else if(ev.keyCode == 68){
        g_camera.moveRight();
    }

    else if(ev.keyCode == 69){
        g_camera.panRight();
    }

    else if(ev.keyCode == 87){
        g_camera.moveForward();
    }
    else if(ev.keyCode == 67){
        placeblock()
    }
    else if(ev.keyCode == 88){
        deleteblock()
    }

  console.log(ev.keyCode);
  renderAllShapes();

}

function renderAllShapes() {
    const startTime = performance.now();

    // Pass the projection matrix
    var projMat = new Matrix4();
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements)

    // Pass the view matrix
    var viewMat = new Matrix4();
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements)

    // Set up global rotation
    let globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear canvas and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Calculate and display FPS
    const duration = performance.now() - startTime;
    const fps = Math.round(1000 / duration);
    document.getElementById('fps').innerHTML = `FPS: ${fps}`;
}