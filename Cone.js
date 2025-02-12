class Cone {
    constructor() {
        this.type = 'cone';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 12;
    }

    render() {
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        const angleStep = 360 / this.segments;
        const vertices = [];

        // Create bottom circle vertices
        for (let angle = 0; angle < 360; angle += angleStep) {
            const rad = angle * Math.PI / 180;
            const nextRad = (angle + angleStep) * Math.PI / 180;

            // Center of base
            const centerX = 0;
            const centerY = 0;
            const centerZ = 0;

            // Points on circle
            const x1 = Math.cos(rad) * 0.5;
            const z1 = Math.sin(rad) * 0.5;
            const x2 = Math.cos(nextRad) * 0.5;
            const z2 = Math.sin(nextRad) * 0.5;

            // Bottom circle
            gl.uniform4f(u_FragColor, 
                this.color[0] * 0.9, 
                this.color[1] * 0.9, 
                this.color[2] * 0.9, 
                this.color[3]);
            drawTriangle3D([
                centerX, centerY, centerZ,
                x1, centerY, z1,
                x2, centerY, z2
            ]);

            // Side faces
            gl.uniform4f(u_FragColor, 
                this.color[0], 
                this.color[1], 
                this.color[2], 
                this.color[3]);
            drawTriangle3D([
                x1, centerY, z1,
                0, 1, 0,  // Tip of cone
                x2, centerY, z2
            ]);
        }
    }
}