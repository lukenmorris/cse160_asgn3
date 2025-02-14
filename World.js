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

let g_dirtVertexBuffer, g_dirtUVBuffer, g_grassVertexBuffer, g_grassUVBuffer;
let g_dirtVertices, g_dirtUVs, g_grassVertices, g_grassUVs;

function setupBuffers() {
    console.log('Setting up WebGL buffers...');
    
    // Dirt buffers
    g_dirtVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_dirtVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_dirtVertices, gl.STATIC_DRAW);

    g_dirtUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_dirtUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_dirtUVs, gl.STATIC_DRAW);

    // Grass buffers
    g_grassVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_grassVertices, gl.STATIC_DRAW);

    g_grassUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_grassUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, g_grassUVs, gl.STATIC_DRAW);
}

function initializeMap() {
    console.log('Initializing world with Perlin noise...');
    noise.seed(Math.random());
    let noiseScale = 0.1;
    g_map = new Array(32);

    // Arrays to collect geometry data
    let dirtVertices = [];
    let dirtUVs = [];
    let grassVertices = [];
    let grassUVs = [];

    // Track minimum height to determine base layer
    let minHeight = Infinity;
    
    // First pass: determine minimum height
    for (let x = 0; x < 32; x++) {
        g_map[x] = new Array(32);
        for (let z = 0; z < 32; z++) {
            let height = Math.floor(3 * noise.simplex2(x * noiseScale, z * noiseScale)) + 2;
            height = Math.max(1, Math.min(height, 4));
            g_map[x][z] = height;
            minHeight = Math.min(minHeight, height);
        }
    }

    // Second pass: generate geometry with proper textures
    for (let x = 0; x < 32; x++) {
        for (let z = 0; z < 32; z++) {
            let height = g_map[x][z];

            for (let y = 0; y < height; y++) {
                const isBaseLayer = (y === 0);  // Bottom layer is always grass
                const tx = x - 16;
                const ty = y - 0.5;
                const tz = z - 16;

                // Get cube geometry
                const cube = new Cube();
                const verts = cube.vertices;
                const uvs = cube.uvCoords;

                // Process vertices
                for (let i = 0; i < verts.length; i += 3) {
                    const xPos = verts[i] + tx;
                    const yPos = verts[i+1] + ty;
                    const zPos = verts[i+2] + tz;
                    
                    if (isBaseLayer) {
                        grassVertices.push(xPos, yPos, zPos);
                    } else {
                        dirtVertices.push(xPos, yPos, zPos);
                    }
                }

                // Process UVs
                if (isBaseLayer) {
                    grassUVs.push(...uvs);
                } else {
                    dirtUVs.push(...uvs);
                }
            }
        }
    }

    // Convert to Float32Arrays
    g_dirtVertices = new Float32Array(dirtVertices);
    g_dirtUVs = new Float32Array(dirtUVs);
    g_grassVertices = new Float32Array(grassVertices);
    g_grassUVs = new Float32Array(grassUVs);
    
    console.log('World buffers prepared', {
        dirtVertices: dirtVertices.length/3,
        grassVertices: grassVertices.length/3,
        minHeight: minHeight
    });
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
    // Use identity matrix for pre-transformed geometry
    const identityMat = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityMat.elements);

    // Draw dirt cubes
    gl.uniform1i(u_whichTexture, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_dirtVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_dirtUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, g_dirtVertices.length/3);

    // Draw grass cubes
    gl.uniform1i(u_whichTexture, 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, g_grassUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, g_grassVertices.length/3);
}

function drawSkybox() {
    let sky = new Cube();
    sky.textureNum = -2; // Use solid color
    sky.color = [0.53, 0.81, 0.98, 1.0]; // Light sky blue
    
    // Position skybox at camera position
    sky.matrix.translate(
        g_camera.eye.elements[0],
        g_camera.eye.elements[1],
        g_camera.eye.elements[2]
    );
    sky.matrix.scale(100, 100, 100);
    
    // Disable depth testing for sky
    gl.disable(gl.DEPTH_TEST);
    sky.render();
    gl.enable(gl.DEPTH_TEST);
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

function onMouseMove(e) {
    if (!document.pointerLockElement) return;
    g_camera.lookAround(e.movementX, e.movementY);
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

    drawSkybox();

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
    setupWebGL();
    connectVariablesToGLSL();
    initTextures();
    initializeMap();    // Must come before setupBuffers
    setupBuffers();     // New buffer initialization
    
    g_camera = new Camera();

    const canvas = document.getElementById('webgl');

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            document.addEventListener('mousemove', onMouseMove);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
    document.onkeydown = keydown;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
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