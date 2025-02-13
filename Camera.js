class Camera {
    constructor() {
        // Initialize camera position and orientation
        this.eye = new Vector3([0, 2, 5]);
        this.at = new Vector3([0, 2, 0]);
        this.up = new Vector3([0, 1, 0]);
        
        // Movement settings
        this.moveSpeed = 0.2;
        this.turnSpeed = 3; // degrees per turn
    }

    moveForward() {
        console.log('Moving forward');
        // Calculate forward direction vector
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        forward.normalize();
        forward.mul(this.moveSpeed);
        
        // Update position
        this.eye.add(forward);
        this.at.add(forward);
    }

    moveBackward() {
        console.log('Moving backward');
        let backward = new Vector3();
        backward.set(this.eye);
        backward.sub(this.at);
        backward.normalize();
        backward.mul(this.moveSpeed);
        
        this.eye.add(backward);
        this.at.add(backward);
    }

    moveLeft() {
        console.log('Moving left');
        // Calculate forward vector
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        // Calculate left vector by cross product with up vector
        let left = Vector3.cross(this.up, forward);
        left.normalize();
        left.mul(this.moveSpeed);
        
        this.eye.add(left);
        this.at.add(left);
    }

    moveRight() {
        console.log('Moving right');
        // Calculate forward vector
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        // Calculate right vector
        let right = Vector3.cross(forward, this.up);
        right.normalize();
        right.mul(this.moveSpeed);
        
        this.eye.add(right);
        this.at.add(right);
    }

    turnLeft() {
        console.log('Turning left');
        // Get forward vector
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        // Create rotation matrix
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(this.turnSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // Apply rotation to forward vector
        let rotated = rotMatrix.multiplyVector3(forward);
        
        // Update at point
        this.at.set(this.eye);
        this.at.add(rotated);
    }

    turnRight() {
        console.log('Turning right');
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        
        let rotMatrix = new Matrix4();
        rotMatrix.setRotate(-this.turnSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        let rotated = rotMatrix.multiplyVector3(forward);
        
        this.at.set(this.eye);
        this.at.add(rotated);
    }
}