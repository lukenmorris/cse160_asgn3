const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`;

const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`;

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

// Animation and control angles
let g_wingAngle = 0;
let g_leftUpperLegAngle = 0;
let g_leftLowerLegAngle = 0;
let g_leftFootAngle = 0;
let g_rightUpperLegAngle = 0;
let g_rightLowerLegAngle = 0;
let g_rightFootAngle = 0;
let g_tailAngle = 0;
let g_neckAngle = 0;
let g_beakAngle = 0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;

// Animation states
let g_animationActive = false;
let g_pokeAnimationActive = false;
let g_pokeStartTime = 0;

// Mouse tracking
let g_isDragging = false;
let g_lastX = 0;
let g_lastY = 0;

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
}

function addActionsForHtmlUI() {
    // Setup sliders
    document.getElementById('wingFlapSlider').addEventListener('input', function() { 
        g_wingAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('leftUpperLegSlider').addEventListener('input', function() { 
        g_leftUpperLegAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('leftLowerLegSlider').addEventListener('input', function() { 
        g_leftLowerLegAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('leftFootSlider').addEventListener('input', function() { 
        g_leftFootAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('rightUpperLegSlider').addEventListener('input', function() { 
        g_rightUpperLegAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('rightLowerLegSlider').addEventListener('input', function() { 
        g_rightLowerLegAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('rightFootSlider').addEventListener('input', function() { 
        g_rightFootAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('neckSlider').addEventListener('input', function() { 
        g_neckAngle = this.value; 
        renderAllShapes(); 
    });

    document.getElementById('tailSlider').addEventListener('input', function() { 
        g_tailAngle = this.value; 
        renderAllShapes(); 
    });

    // Animation toggle
    document.getElementById('animationButton').onclick = function() { 
        g_animationActive = !g_animationActive; 
    };

    // Mouse events for rotation
    canvas.onmousedown = function(ev) {
        if(ev.shiftKey) {
            g_pokeAnimationActive = true;
            g_pokeStartTime = performance.now();
        } else {
            g_isDragging = true;
            g_lastX = ev.clientX;
            g_lastY = ev.clientY;
        }
    };

    canvas.onmouseup = function() { 
        g_isDragging = false; 
    };

    canvas.onmousemove = function(ev) {
        if (g_isDragging) {
            let deltaX = ev.clientX - g_lastX;
            let deltaY = ev.clientY - g_lastY;
            
            g_globalAngleY += deltaX * 0.5;
            g_globalAngleX += deltaY * 0.5;

            g_lastX = ev.clientX;
            g_lastY = ev.clientY;
        }
    };
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    const now = performance.now();
    const timeElapsed = now * 0.001; // Convert to seconds

    if (g_animationActive) {
        g_wingAngle = 20 * Math.sin(timeElapsed * 5);
        g_tailAngle = 10 * Math.sin(timeElapsed * 3);
        g_neckAngle = 5 * Math.sin(timeElapsed * 2);
    }

    if (g_pokeAnimationActive) {
        const pokeElapsed = (now - g_pokeStartTime) * 0.001;
        if (pokeElapsed < 1) {
            g_neckAngle = 30 * Math.sin(pokeElapsed * Math.PI * 2);
            g_wingAngle = 45 * Math.sin(pokeElapsed * Math.PI * 4);
        } else {
            g_pokeAnimationActive = false;
        }
    }
}

function tick() {
    updateAnimationAngles();
    renderAllShapes();
    requestAnimationFrame(tick);
}

function renderAllShapes() {
    const startTime = performance.now();

    // Clear canvas and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up global rotation
    let globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Draw body (main cube)
    let body = new Cube();
    body.color = [0.6, 0.6, 1.0, 1.0];
    body.matrix.translate(-0.2, 0, 0);
    body.matrix.scale(0.6, 0.4, 0.4);
    body.render();
    let bodyMatrix = new Matrix4(body.matrix);

    // Draw neck
    let neck = new Cube();
    neck.color = [0.5, 0.5, 0.9, 1.0];
    neck.matrix.translate(0, 0.2, -0.15);
    neck.matrix.rotate(g_neckAngle, 1, 0, 0);
    let neckMatrix = new Matrix4(neck.matrix);
    neck.matrix.scale(0.15, 0.25, 0.15);
    neck.render();

    // Draw head
    let head = new Cube();
    head.color = [0.5, 0.5, 0.9, 1.0];
    head.matrix = neckMatrix;
    head.matrix.translate(-0.015, 0.25, 0);
    let headMatrix = new Matrix4(head.matrix);
    head.matrix.scale(0.2, 0.2, 0.2);
    head.render();

    // Draw beak
    let beak = new Cone();
    beak.color = [1.0, 0.7, 0, 1.0];
    beak.matrix = headMatrix;
    beak.matrix.translate(0.09, 0, 0);
    beak.matrix.rotate(-90, 1, 0, 0);
    beak.matrix.scale(0.1, 0.2, 0.1);
    beak.render();

    // Draw wings
    let leftWing = new Cube();
    leftWing.color = [0.5, 0.5, 0.9, 1.0];
    leftWing.matrix = bodyMatrix;
    leftWing.matrix.translate(1, 0.5, 0.26);
    leftWing.matrix.rotate(g_wingAngle, 0, 0, 1);
    leftWing.matrix.scale(0.4, 0.1, 0.3);
    leftWing.render();

    let rightWing = new Cube();
    rightWing.color = [0.5, 0.5, 0.9, 1.0];
    rightWing.matrix.translate(-0.20, 0.2, 0.1);
    rightWing.matrix.rotate(90, 0, 0, 1);
    rightWing.matrix.rotate(g_wingAngle, 0, 0, 1);  // Rotate 45 degrees around Z-axis
    rightWing.matrix.scale(0.04, 0.24, 0.13);
    rightWing.render();

    // Draw tail
    let tail = new Cube();
    tail.color = [0.5, 0.5, 0.9, 1.0];
    tail.matrix = bodyMatrix;
    tail.matrix.translate(-1.4, -1, 2);
    tail.matrix.rotate(g_tailAngle, 5, 0, 0);
    tail.matrix.scale(0.4, 3, 5);
    tail.render();

    // Draw legs (with joints)
    // Left leg chain
    let leftUpperLeg = new Cube();
    leftUpperLeg.color = [0.5, 0.5, 0.9, 1.0];
    leftUpperLeg.matrix.translate(0.3, -0.15, 0.2);
    leftUpperLeg.matrix.rotate(g_leftUpperLegAngle, 1, 0, 0);
    let leftUpperLegMatrix = new Matrix4(leftUpperLeg.matrix);
    leftUpperLeg.matrix.scale(0.05, 0.15, 0.05);
    leftUpperLeg.render();

    let leftLowerLeg = new Cube();
    leftLowerLeg.color = [0.5, 0.5, 0.9, 1.0];
    leftLowerLeg.matrix = leftUpperLegMatrix;
    leftLowerLeg.matrix.translate(0, -0.15, 0);
    leftLowerLeg.matrix.rotate(g_leftLowerLegAngle, 1, 0, 0);
    let leftLowerLegMatrix = new Matrix4(leftLowerLeg.matrix);
    leftLowerLeg.matrix.scale(0.05, 0.15, 0.05);
    leftLowerLeg.render();

    let leftFoot = new Cube();
    leftFoot.color = [0.5, 0.5, 0.9, 1.0];
    leftFoot.matrix = leftLowerLegMatrix;
    leftFoot.matrix.translate(-0.02, 0, -0.05);
    leftFoot.matrix.rotate(g_leftFootAngle, 1, 0, 0);
    leftFoot.matrix.scale(0.08, 0.03, 0.12);
    leftFoot.render();

    // Right leg chain (mirror of left)
    let rightUpperLeg = new Cube();
    rightUpperLeg.color = [0.5, 0.5, 0.9, 1.0];
    rightUpperLeg.matrix.translate(-0.15, -0.15, 0.2);
    rightUpperLeg.matrix.rotate(g_rightUpperLegAngle, 1, 0, 0);
    let rightUpperLegMatrix = new Matrix4(rightUpperLeg.matrix);
    rightUpperLeg.matrix.scale(0.05, 0.15, 0.05);
    rightUpperLeg.render();

    let rightLowerLeg = new Cube();
    rightLowerLeg.color = [0.5, 0.5, 0.9, 1.0];
    rightLowerLeg.matrix = rightUpperLegMatrix;
    rightLowerLeg.matrix.translate(0, -0.15, 0);
    rightLowerLeg.matrix.rotate(g_rightLowerLegAngle, 1, 0, 0);
    let rightLowerLegMatrix = new Matrix4(rightLowerLeg.matrix);
    rightLowerLeg.matrix.scale(0.05, 0.15, 0.05);
    rightLowerLeg.render();

    let rightFoot = new Cube();
    rightFoot.color = [0.5, 0.5, 0.9, 1.0];
    rightFoot.matrix = rightLowerLegMatrix;
    rightFoot.matrix.translate(-0.01, 0, -0.05);
    rightFoot.matrix.rotate(g_rightFootAngle, 1, 0, 0);
    rightFoot.matrix.scale(0.08, 0.03, 0.12);
    rightFoot.render();

    // Calculate and display FPS
    const duration = performance.now() - startTime;
    const fps = Math.round(1000 / duration);
    document.getElementById('fps').innerHTML = `FPS: ${fps}`;
}