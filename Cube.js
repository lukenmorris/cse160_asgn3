class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
        
        // Vertices for a unit cube centered at origin
        this.vertices = new Float32Array([
            // Front face
            -0.5, -0.5,  0.5,    0.5, -0.5,  0.5,    0.5,  0.5,  0.5,    // Triangle 1
            -0.5, -0.5,  0.5,    0.5,  0.5,  0.5,   -0.5,  0.5,  0.5,    // Triangle 2
            // Back face
            -0.5, -0.5, -0.5,   -0.5,  0.5, -0.5,    0.5,  0.5, -0.5,    // Triangle 3
            -0.5, -0.5, -0.5,    0.5,  0.5, -0.5,    0.5, -0.5, -0.5,    // Triangle 4
            // Top face
            -0.5,  0.5, -0.5,   -0.5,  0.5,  0.5,    0.5,  0.5,  0.5,    // Triangle 5
            -0.5,  0.5, -0.5,    0.5,  0.5,  0.5,    0.5,  0.5, -0.5,    // Triangle 6
            // Bottom face
            -0.5, -0.5, -0.5,    0.5, -0.5, -0.5,    0.5, -0.5,  0.5,    // Triangle 7
            -0.5, -0.5, -0.5,    0.5, -0.5,  0.5,   -0.5, -0.5,  0.5,    // Triangle 8
            // Right face
             0.5, -0.5, -0.5,    0.5,  0.5, -0.5,    0.5,  0.5,  0.5,    // Triangle 9
             0.5, -0.5, -0.5,    0.5,  0.5,  0.5,    0.5, -0.5,  0.5,    // Triangle 10
            // Left face
            -0.5, -0.5, -0.5,   -0.5, -0.5,  0.5,   -0.5,  0.5,  0.5,    // Triangle 11
            -0.5, -0.5, -0.5,   -0.5,  0.5,  0.5,   -0.5,  0.5, -0.5     // Triangle 12
        ]);

        // UV coordinates for texture mapping
        this.uvCoords = new Float32Array([
            // Front face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
            0.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            // Back face
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            1.0, 0.0,   0.0, 1.0,   0.0, 0.0,
            // Top face
            0.0, 1.0,   0.0, 0.0,   1.0, 0.0,
            0.0, 1.0,   1.0, 0.0,   1.0, 1.0,
            // Bottom face
            1.0, 1.0,   0.0, 1.0,   0.0, 0.0,
            1.0, 1.0,   0.0, 0.0,   1.0, 0.0,
            // Right face
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
            1.0, 0.0,   0.0, 1.0,   0.0, 0.0,
            // Left face
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,
            0.0, 0.0,   1.0, 1.0,   0.0, 1.0,
        ]);
    }

    render() {
        // Set texture
        gl.uniform1i(u_whichTexture, this.textureNum);
        
        // Set color
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        
        // Set transformation matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Create and set up vertex buffer
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create vertex buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Create and set up UV buffer
        let uvBuffer = gl.createBuffer();
        if (!uvBuffer) {
            console.log('Failed to create UV buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        // Draw the cube
        gl.drawArrays(gl.TRIANGLES, 0, 36);  // 36 vertices = 12 triangles * 3 vertices each
    }
}