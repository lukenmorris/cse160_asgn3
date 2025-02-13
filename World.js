// Vertex shader program
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

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform int u_whichTexture;
    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV); // Sky
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV); // Dirt
        } else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV); // Grass
        } else {
            gl_FragColor = vec4(1, 1, 1, 1);
        }
    }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let g_camera;

// World map initialization
let g_map = [];

function initializeMap() {
    console.log('Initializing map...');
    // First create the array structure
    for(let i = 0; i < 32; i++) {
        g_map[i] = new Array(32).fill(0);
    }
    
    // Add terrain features
    for(let x = 0; x < 32; x++) {
        for(let z = 0; z < 32; z++) {
            // Create border walls
            if(x === 0 || x === 31 || z === 0 || z === 31) {
                g_map[x][z] = 2; // Border walls are 2 blocks high
                console.log(`Added border wall at (${x}, ${z})`);
            }
            // Add some random terrain blocks
            else if(Math.random() < 0.1) {
                g_map[x][z] = Math.floor(Math.random() * 2) + 1;
                console.log(`Added terrain block at (${x}, ${z}) with height ${g_map[x][z]}`);
            }
        }
    }
    
    // Add some test blocks near spawn
    g_map[16][16] = 1;  // Center block
    g_map[15][15] = 2;  // Nearby blocks
    g_map[17][17] = 2;
    
    console.log('Map initialization complete');
}

function setupWebGL() {
    console.log('Setting up WebGL...');
    canvas = document.getElementById('webgl');
    if (!canvas) {
        console.error('Failed to get canvas element');
        return;
    }
    console.log('Canvas element found:', canvas);

    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.error('Failed to get WebGL context');
        return;
    }
    console.log('WebGL context created successfully');

    gl.enable(gl.DEPTH_TEST);
    console.log('Depth testing enabled');
}

function connectVariablesToGLSL() {
    console.log('Connecting variables to GLSL...');

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders');
        return;
    }
    console.log('Shaders initialized successfully');

    // Get attributes and uniforms
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    
    // Get uniform locations
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');

    // Check for errors
    if (!u_FragColor || !u_ModelMatrix || !u_GlobalRotateMatrix || !u_ViewMatrix || 
        !u_ProjectionMatrix || !u_Sampler0 || !u_Sampler1 || !u_Sampler2 || !u_whichTexture) {
        console.error('Failed to get uniform locations');
        return;
    }

    console.log('All variables connected successfully');
}

function initTextures() {
    console.log('Initializing textures...');

    // Sky texture
    let skyImage = new Image();
    skyImage.onload = function() { 
        console.log('Sky texture loaded successfully');
        sendImageToTexture(skyImage, 0); 
    };
    skyImage.onerror = function() {
        console.error('Failed to load sky texture');
    };
    skyImage.src = 'sky.png';

    // Dirt texture
    let dirtImage = new Image();
    dirtImage.onload = function() { 
        console.log('Dirt texture loaded successfully');
        sendImageToTexture(dirtImage, 1); 
    };
    dirtImage.onerror = function() {
        console.error('Failed to load dirt texture');
    };
    dirtImage.src = 'dirt.png';

    // Grass texture
    let grassImage = new Image();
    grassImage.onload = function() { 
        console.log('Grass texture loaded successfully');
        sendImageToTexture(grassImage, 2); 
    };
    grassImage.onerror = function() {
        console.error('Failed to load grass texture');
    };
    grassImage.src = 'grass.png';
}

function sendImageToTexture(image, texNum) {
    console.log(`Setting up texture ${texNum}...`);
    let texture = gl.createTexture();
    if (!texture) {
        console.error(`Failed to create texture ${texNum}`);
        return;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + texNum);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(eval(`u_Sampler${texNum}`), texNum);
    console.log(`Texture ${texNum} set up successfully`);
}

function drawMap() {
    console.log('Drawing map...');
    for(let x = 0; x < 32; x++) {
        for(let z = 0; z < 32; z++) {
            let height = g_map[x][z];
            if(height > 0) {
                console.log(`Drawing block at (${x}, ${z}) with height ${height}`);
                for(let y = 0; y < height; y++) {
                    let cube = new Cube();
                    cube.textureNum = (y === height-1) ? 2 : 1; // Top block uses grass, others use dirt
                    cube.matrix.translate(x-16, y-0.5, z-16);
                    cube.render();
                }
            }
        }
    }
}

function keydown(ev) {
    console.log('Key pressed:', ev.keyCode);
    switch(ev.keyCode) {
        case 87: // W key
            console.log('Moving forward');
            g_camera.moveForward();
            break;
        case 83: // S key
            console.log('Moving backward');
            g_camera.moveBackward();
            break;
        case 65: // A key
            console.log('Moving left');
            g_camera.moveLeft();
            break;
        case 68: // D key
            console.log('Moving right');
            g_camera.moveRight();
            break;
        case 81: // Q key
            console.log('Turning left');
            g_camera.turnLeft();
            break;
        case 69: // E key
            console.log('Turning right');
            g_camera.turnRight();
            break;
    }
    renderAllShapes();
}

function renderAllShapes() {
    let startTime = performance.now();
    console.log('Starting render cycle...');
    console.log('Camera position:', {
        eye: g_camera.eye.elements,
        at: g_camera.at.elements,
        up: g_camera.up.elements
    });

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up projection matrix
    let projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    // Set up view matrix
    let viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Set default global rotation
    let globalRotMat = new Matrix4();
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Draw sky box
    console.log('Drawing sky box...');
    let sky = new Cube();
    sky.color = [0.6, 0.8, 1.0, 1.0];  // Light blue color
    sky.textureNum = -2;  // Use solid color instead of texture
    sky.matrix.scale(100, 100, 100);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.render();

    // Draw ground plane
    console.log('Drawing ground plane...');
    let ground = new Cube();
    ground.textureNum = 1;
    ground.matrix.translate(0, -1, 0);
    ground.matrix.scale(32, 0.1, 32);
    ground.matrix.translate(-0.5, 0, -0.5);
    ground.render();

    // Draw all blocks
    drawMap();

    let duration = performance.now() - startTime;
    console.log(`Render cycle completed in ${duration}ms`);
}

function tick() {
    renderAllShapes();
    requestAnimationFrame(tick);
}

function main() {
    console.log('Starting main...');
    setupWebGL();
    connectVariablesToGLSL();
    initTextures();
    
    // Initialize map and camera
    console.log('Initializing game world...');
    initializeMap();
    
    console.log('Initializing camera...');
    g_camera = new Camera();
    console.log('Camera initialized:', g_camera);

    // Set up event listeners
    document.onkeydown = keydown;
    
    // Set initial clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    console.log('Main initialization complete, starting render loop');
    
    // Initial render
    renderAllShapes();
    requestAnimationFrame(tick);
}

function sendTextToHTML(text, htmlID) {
    let htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.error('Failed to get HTML element:', htmlID);
        return;
    }
    htmlElement.innerHTML = text;
}