class Point {
    constructor(position, color, size) {
        this.position = position;
        this.color = color;
        this.size = size;
    }

    render() {
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.position[0], this.position[1]]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, ...this.color);
        gl.uniform1f(u_Size, this.size);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}