class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Front face
        gl.uniform4f(u_FragColor, 
            this.color[0], 
            this.color[1], 
            this.color[2], 
            this.color[3]);
        drawTriangle3D([0,0,0, 1,1,0, 1,0,0]);
        drawTriangle3D([0,0,0, 0,1,0, 1,1,0]);

        // Back face - slightly darker
        gl.uniform4f(u_FragColor, 
            this.color[0] * 0.9, 
            this.color[1] * 0.9, 
            this.color[2] * 0.9, 
            this.color[3]);
        drawTriangle3D([0,0,1, 1,1,1, 1,0,1]);
        drawTriangle3D([0,0,1, 0,1,1, 1,1,1]);

        // Top face - brighter
        gl.uniform4f(u_FragColor, 
            this.color[0], 
            this.color[1], 
            this.color[2], 
            this.color[3]);
        drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);
        drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);

        // Bottom face - darker
        gl.uniform4f(u_FragColor, 
            this.color[0] * 0.8, 
            this.color[1] * 0.8, 
            this.color[2] * 0.8, 
            this.color[3]);
        drawTriangle3D([0,0,0, 1,0,1, 1,0,0]);
        drawTriangle3D([0,0,0, 0,0,1, 1,0,1]);

        // Left face - medium dark
        gl.uniform4f(u_FragColor, 
            this.color[0] * 0.85, 
            this.color[1] * 0.85, 
            this.color[2] * 0.85, 
            this.color[3]);
        drawTriangle3D([0,0,0, 0,1,1, 0,1,0]);
        drawTriangle3D([0,0,0, 0,0,1, 0,1,1]);

        // Right face - medium dark
        gl.uniform4f(u_FragColor, 
            this.color[0] * 0.85, 
            this.color[1] * 0.85, 
            this.color[2] * 0.85, 
            this.color[3]);
        drawTriangle3D([1,0,0, 1,1,1, 1,1,0]);
        drawTriangle3D([1,0,0, 1,0,1, 1,1,1]);
    }
}