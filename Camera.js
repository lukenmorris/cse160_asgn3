class Camera {
    constructor() {
        // Movement settings
        this.moveSpeed = 0.2;
        this.turnSpeed = 3;
        this.collisionRadius = 0.15;
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

        // Check for trees in a 3x3 area around spawn point
        if (g_treeSystem && g_treeSystem.treeLocations) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const checkX = mapX + dx;
                    const checkZ = mapZ + dz;
                    
                    // Check if there's a tree at this location
                    const tree = g_treeSystem.treeLocations.find(t => 
                        t.x === checkX && t.z === checkZ
                    );
                    
                    if (tree) {
                        // If there's a tree nearby, this isn't a safe spawn
                        return false;
                    }
                }
            }
        }
        
        // Check if position is safe (no blocks at head level)
        return !this.checkCollision(new Vector3([worldX, headY, worldZ]));
    }

    getGroundLevel(mapX, mapZ) {
        // Return the height of the block plus a small offset
        return g_map[mapX][mapZ] + 0.1;  // Small offset to prevent floating point issues
    }

    checkCollision(position) {
        const margin = 0.2;
        const verticalMargin = 0.3;
        const checkPoints = [
            [0, 0, 0],
            [margin, -verticalMargin, margin],
            [margin, -verticalMargin, -margin],
            [-margin, -verticalMargin, margin],
            [-margin, -verticalMargin, -margin],
            [margin, verticalMargin, margin],
            [margin, verticalMargin, -margin],
            [-margin, verticalMargin, margin],
            [-margin, verticalMargin, -margin],
            [margin, 0, 0],
            [-margin, 0, 0],
            [0, verticalMargin, 0],
            [0, -verticalMargin, 0],
            [0, 0, margin],
            [0, 0, -margin]
        ];

        for (let point of checkPoints) {
            const checkPos = new Vector3([
                position.elements[0] + point[0],
                position.elements[1] + point[1],
                position.elements[2] + point[2]
            ]);

            // Convert to map coordinates
            const mapX = Math.floor(checkPos.elements[0] + 16);
            const mapY = Math.floor(checkPos.elements[1] + 0.5);
            const mapZ = Math.floor(checkPos.elements[2] + 16);

            // Check map bounds
            if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
                return true;
            }

            // Check terrain collision
            if (mapY >= 0 && g_map[mapX] && g_map[mapX][mapZ] > mapY) {
                return true;
            }

            // Check tree collision
            if (g_treeSystem && g_treeSystem.treeLocations) {
                for (let tree of g_treeSystem.treeLocations) {
                    // Check if we're within the tree's trunk bounds
                    if (mapX === tree.x && mapZ === tree.z) {
                        // Only collide with trunk, not leaves
                        const trunkTop = tree.y + tree.trunkHeight;
                        if (mapY >= tree.y && mapY < trunkTop) {
                            // Additional check for trunk hitbox
                            const trunkMargin = 0.3;
                            const trunkX = tree.x - 16 + 0.5; // Center of trunk
                            const trunkZ = tree.z - 16 + 0.5;
                            const dx = Math.abs(checkPos.elements[0] - trunkX);
                            const dz = Math.abs(checkPos.elements[2] - trunkZ);
                            
                            if (dx < trunkMargin && dz < trunkMargin) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    canMoveTo(newPosition) {
        let adjustedPosition = new Vector3(newPosition.elements);
        
        const currentX = Math.floor(this.eye.elements[0] + 16);
        const currentZ = Math.floor(this.eye.elements[2] + 16);
        const targetX = Math.floor(adjustedPosition.elements[0] + 16);
        const targetZ = Math.floor(adjustedPosition.elements[2] + 16);

        // Height adjustment for terrain
        if (currentX !== targetX || currentZ !== targetZ) {
            if (targetX >= 0 && targetX < 32 && targetZ >= 0 && targetZ < 32) {
                const currentHeight = g_map[currentX][currentZ];
                const targetHeight = g_map[targetX][targetZ];
                
                // Check for tree trunks in the path
                let treeHeight = 0;
                if (g_treeSystem && g_treeSystem.trees) {
                    const tree = g_treeSystem.trees.find(t => t.x === targetX && t.z === targetZ);
                    if (tree) {
                        treeHeight = tree.y + tree.trunkHeight;
                    }
                }
                
                // Use the higher of terrain or tree height for adjustment
                const effectiveTargetHeight = Math.max(targetHeight, treeHeight);
                if (effectiveTargetHeight > currentHeight) {
                    adjustedPosition.elements[1] += 0.2 * (effectiveTargetHeight - currentHeight);
                }
            }
        }

        if (!this.checkCollision(adjustedPosition)) {
            newPosition.elements[1] = adjustedPosition.elements[1];
            return true;
        }

        return false;
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