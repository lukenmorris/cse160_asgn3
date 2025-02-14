class BlockSystem {
    constructor(worldMap) {
        this.worldMap = worldMap;
        this.maxDistance = 5; // Maximum reach distance
        this.selectedBlock = null; // Currently highlighted block
    }

    raycast(camera) {
        const rayOrigin = new Vector3(camera.eye.elements);
        const rayDirection = new Vector3();
        
        // Get forward vector (direction player is looking)
        rayDirection.set(camera.at);
        rayDirection.sub(camera.eye);
        rayDirection.normalize();

        let currentPos = new Vector3(rayOrigin.elements);
        const step = 0.1; // Step size for ray march

        // March ray forward until we hit something or reach max distance
        for (let dist = 0; dist < this.maxDistance; dist += step) {
            currentPos.elements[0] = rayOrigin.elements[0] + rayDirection.elements[0] * dist;
            currentPos.elements[1] = rayOrigin.elements[1] + rayDirection.elements[1] * dist;
            currentPos.elements[2] = rayOrigin.elements[2] + rayDirection.elements[2] * dist;

            // Convert world coordinates to map coordinates
            const mapX = Math.floor(currentPos.elements[0] + 16);
            const mapY = Math.floor(currentPos.elements[1] + 0.5);
            const mapZ = Math.floor(currentPos.elements[2] + 16);

            // Check if coordinates are within map bounds
            if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32 && mapY >= 0) {
                // Check if we hit a block
                if (this.worldMap[mapX][mapZ] > mapY) {
                    return {
                        x: mapX,
                        y: mapY,
                        z: mapZ,
                        face: this.getHitFace(currentPos, rayDirection),
                        worldPos: currentPos
                    };
                }
            }
        }
        return null;
    }

    getHitFace(hitPos, rayDir) {
        // Convert world position to block-local position
        const localX = hitPos.elements[0] - Math.floor(hitPos.elements[0]);
        const localY = hitPos.elements[1] - Math.floor(hitPos.elements[1]);
        const localZ = hitPos.elements[2] - Math.floor(hitPos.elements[2]);

        // Find which face was hit based on position and ray direction
        if (localX < 0.01 && rayDir.elements[0] > 0) return 'left';
        if (localX > 0.99 && rayDir.elements[0] < 0) return 'right';
        if (localY < 0.01 && rayDir.elements[1] > 0) return 'bottom';
        if (localY > 0.99 && rayDir.elements[1] < 0) return 'top';
        if (localZ < 0.01 && rayDir.elements[2] > 0) return 'front';
        if (localZ > 0.99 && rayDir.elements[2] < 0) return 'back';
        
        return 'top'; // Default to top if uncertain
    }

    addBlock(camera) {
        const hit = this.raycast(camera);
        if (!hit) return false;

        // Calculate new block position based on hit face
        let newX = hit.x;
        let newY = hit.y;
        let newZ = hit.z;

        switch(hit.face) {
            case 'left': newX -= 1; break;
            case 'right': newX += 1; break;
            case 'bottom': newY -= 1; break;
            case 'top': newY += 1; break;
            case 'front': newZ -= 1; break;
            case 'back': newZ += 1; break;
        }

        // Check if new position is valid
        if (newX >= 0 && newX < 32 && newZ >= 0 && newZ < 32 && newY >= 0) {
            // Update map height if placing block higher than current height
            if (newY >= this.worldMap[newX][newZ]) {
                this.worldMap[newX][newZ] = newY + 1;
                return true;
            }
        }
        return false;
    }

    removeBlock(camera) {
        const hit = this.raycast(camera);
        if (!hit) return false;

        // Don't allow removing bottom layer
        if (hit.y === 0) return false;

        // Update map height if removing top block
        if (hit.y === this.worldMap[hit.x][hit.z] - 1) {
            this.worldMap[hit.x][hit.z]--;
            return true;
        }

        return false;
    }

    updateSelectedBlock(camera) {
        this.selectedBlock = this.raycast(camera);
    }

    renderSelectedBlock(gl, a_Position, u_FragColor, u_ModelMatrix) {
        if (!this.selectedBlock) return;

        // Save current depth test state
        const depthTest = gl.isEnabled(gl.DEPTH_TEST);
        gl.disable(gl.DEPTH_TEST);

        // Draw wireframe cube at selected block
        const wireframe = new Cube();
        wireframe.color = [1.0, 1.0, 1.0, 0.5]; // White, semi-transparent
        wireframe.matrix.translate(
            this.selectedBlock.x - 16,
            this.selectedBlock.y,
            this.selectedBlock.z - 16
        );
        wireframe.matrix.scale(1.001, 1.001, 1.001); // Slightly larger than block
        
        // Draw wireframe
        gl.uniform4fv(u_FragColor, wireframe.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, wireframe.matrix.elements);
        gl.drawArrays(gl.LINES, 0, 24); // Draw cube edges only

        // Restore depth test state
        if (depthTest) gl.enable(gl.DEPTH_TEST);
    }
}