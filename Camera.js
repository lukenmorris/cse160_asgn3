class Camera {
    constructor() {
        // Movement settings
        this.moveSpeed = 0.2;
        this.turnSpeed = 3;
        this.collisionRadius = 0.2;
        this.height = 1.8;

        // Initialize vectors (will be set properly in findSafeSpawn)
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);

        // Find and set safe spawn position
        this.setToSafeSpawn();
    }

    setToSafeSpawn() {
        // Try to find a safe spawn point
        const spawnPoint = this.findSafeSpawn();
        
        // Set camera position to spawn point
        this.eye.elements[0] = spawnPoint.x;
        this.eye.elements[1] = spawnPoint.y + this.height;  // Place eyes at head level
        this.eye.elements[2] = spawnPoint.z;

        // Set looking direction
        this.at.elements[0] = spawnPoint.x;
        this.at.elements[1] = spawnPoint.y + this.height;
        this.at.elements[2] = spawnPoint.z - 1;  // Look forward by default
    }

    findSafeSpawn() {
        // Start from the center and spiral outward
        const centerX = 16;
        const centerZ = 16;
        const spiralDirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];  // Spiral direction vectors
        let x = centerX;
        let z = centerZ;
        let dirIndex = 0;
        let stepSize = 1;
        let stepCount = 0;
        let segmentCount = 0;

        while (x >= 0 && x < 32 && z >= 0 && z < 32) {
            // Check if this position is safe
            if (this.isSpawnSafe(x - 16, z - 16)) {  // Convert to world coordinates
                const y = this.getGroundLevel(x, z);
                return {
                    x: x - 16,  // Convert back to world coordinates
                    y: y,
                    z: z - 16
                };
            }

            // Move in spiral pattern
            x += spiralDirs[dirIndex][0];
            z += spiralDirs[dirIndex][1];
            stepCount++;

            if (stepCount === stepSize) {
                stepCount = 0;
                dirIndex = (dirIndex + 1) % 4;
                segmentCount++;
                if (segmentCount === 2) {
                    segmentCount = 0;
                    stepSize++;
                }
            }
        }

        // Fallback to a high position if no safe spot found
        console.warn("No ideal spawn point found, using fallback position");
        return {
            x: 0,
            y: 10,  // High up in the air
            z: 0
        };
    }

    isSpawnSafe(worldX, worldZ) {
        // Convert to map coordinates
        const mapX = Math.floor(worldX + 16);
        const mapZ = Math.floor(worldZ + 16);

        // Check if coordinates are within bounds
        if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
            return false;
        }

        // Get ground level height
        const groundY = this.getGroundLevel(mapX, mapZ);
        
        // Check if there's enough headroom
        const headY = groundY + this.height;
        
        // Check if position is safe (no blocks at head level)
        return !this.checkCollision(new Vector3([worldX, headY, worldZ]));
    }

    getGroundLevel(mapX, mapZ) {
        // Return the height of the block plus a small offset
        return g_map[mapX][mapZ] + 0.1;  // Small offset to prevent floating point issues
    }

    checkCollision(position) {
        // Convert world coordinates to map coordinates
        const mapX = Math.floor(position.elements[0] + 16);
        const mapY = Math.floor(position.elements[1] + 0.5);
        const mapZ = Math.floor(position.elements[2] + 16);

        // Check if coordinates are within map bounds
        if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32 || mapY < 0) {
            return true; // Collide with world boundaries
        }

        // Check if there's a block at this position
        if (g_map[mapX] && g_map[mapX][mapZ] > mapY) {
            return true;
        }

        return false;
    }

    // Rest of the Camera class methods remain the same...
    canMoveTo(newPosition) {
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        const footPosition = new Vector3([
            newPosition.elements[0],
            newPosition.elements[1] - this.height/2,
            newPosition.elements[2]
        ]);
        const headPosition = new Vector3([
            newPosition.elements[0],
            newPosition.elements[1] + this.height/2,
            newPosition.elements[2]
        ]);

        if (this.checkCollision(footPosition) || this.checkCollision(headPosition)) {
            return false;
        }

        for (let angle of angles) {
            const radians = angle * Math.PI / 180;
            const offsetX = this.collisionRadius * Math.cos(radians);
            const offsetZ = this.collisionRadius * Math.sin(radians);

            const footCheck = new Vector3([
                footPosition.elements[0] + offsetX,
                footPosition.elements[1],
                footPosition.elements[2] + offsetZ
            ]);

            const headCheck = new Vector3([
                headPosition.elements[0] + offsetX,
                headPosition.elements[1],
                headPosition.elements[2] + offsetZ
            ]);

            if (this.checkCollision(footCheck) || this.checkCollision(headCheck)) {
                return false;
            }
        }

        return true;
    }

    moveForward() {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        forward.normalize();
        forward.mul(this.moveSpeed);

        let newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(forward);

        if (this.canMoveTo(newEye)) {
            this.eye.add(forward);
            this.at.add(forward);
        }
    }

    moveBackward() {
        let backward = new Vector3();
        backward.set(this.eye);
        backward.sub(this.at);
        backward.normalize();
        backward.mul(this.moveSpeed);

        let newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(backward);

        if (this.canMoveTo(newEye)) {
            this.eye.add(backward);
            this.at.add(backward);
        }
    }

    moveLeft() {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        let left = Vector3.cross(this.up, forward);
        left.normalize();
        left.mul(this.moveSpeed);

        let newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(left);

        if (this.canMoveTo(newEye)) {
            this.eye.add(left);
            this.at.add(left);
        }
    }

    moveRight() {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        let right = Vector3.cross(forward, this.up);
        right.normalize();
        right.mul(this.moveSpeed);

        let newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(right);

        if (this.canMoveTo(newEye)) {
            this.eye.add(right);
            this.at.add(right);
        }
    }

    rotateYaw(angle) {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        forward.normalize();

        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        let rotated = rotMatrix.multiplyVector3(forward);
        this.at.set(this.eye);
        this.at.add(rotated);
    }

    pitch(angle) {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        forward.normalize();

        let right = Vector3.cross(forward, this.up);
        right.normalize();

        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(angle, right.elements[0], right.elements[1], right.elements[2]);

        let rotatedForward = rotMatrix.multiplyVector3(forward);
        rotatedForward.normalize();

        let dot = Vector3.dot(rotatedForward, this.up);
        if (Math.abs(dot) > 0.98) return;

        this.at.set(this.eye);
        this.at.add(rotatedForward);
    }

    lookAround(deltaX, deltaY) {
        const sensitivity = 0.1;
        this.rotateYaw(-deltaX * sensitivity);
        this.pitch(-deltaY * sensitivity);
    }

    turnLeft() {
        this.rotateYaw(this.turnSpeed);
    }

    turnRight() {
        this.rotateYaw(-this.turnSpeed);
    }
}