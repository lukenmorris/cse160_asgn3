// GameSystem.js
class GameSystem {
    constructor() {
        this.isPlaying = false;
        this.score = 0;
        this.highScore = localStorage.getItem('blockFinderHighScore') || 0;
        this.timeRemaining = 60;
        this.stoneBlock = null;
        this.gameInterval = null;
        this.overlayColor = [0.5, 0.5, 0.5, 0.7];
        this.textColor = [1.0, 1.0, 1.0, 1.0];
    }

    startGame() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.score = 0;
        this.timeRemaining = 60;
        this.placeStoneBlock();
        
        // Start timer
        this.gameInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateHUD();
            
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);

        // Update HUD
        this.updateHUD();
    }

    stopGame() {
        if (!this.isPlaying) return;
        this.endGame();
    }

    endGame() {
        this.isPlaying = false;
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }

        // Update high score if needed
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('blockFinderHighScore', this.highScore);
        }

        // Reset camera position
        g_camera.setToSafeSpawn();

        // Show end game overlay
        this.showEndGameOverlay();
        this.updateHUD();
    }

    placeStoneBlock() {
        // Find a random visible position
        let validPositions = [];
        
        for (let x = 0; x < 32; x++) {
            for (let z = 0; z < 32; z++) {
                const height = g_map[x][z];
                
                // Check if position is visible (not under anything)
                let isVisible = true;
                for (let y = height + 1; y < 32; y++) {
                    if (g_map[x][y] > 0) {
                        isVisible = false;
                        break;
                    }
                }
                
                // Check if not too close to a tree
                let nearTree = false;
                if (g_treeSystem.treeLocations) {
                    for (const tree of g_treeSystem.treeLocations) {
                        const dx = Math.abs(tree.x - x);
                        const dz = Math.abs(tree.z - z);
                        if (dx <= 1 && dz <= 1) {
                            nearTree = true;
                            break;
                        }
                    }
                }

                if (isVisible && !nearTree) {
                    validPositions.push({x, y: height, z});
                }
            }
        }

        // Select random position
        if (validPositions.length > 0) {
            const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
            this.stoneBlock = pos;
        }
    }

    handleBlockClick(x, y, z) {
        if (!this.isPlaying || !this.stoneBlock) return false;

        if (x === this.stoneBlock.x && y === this.stoneBlock.y && z === this.stoneBlock.z) {
            this.score++;
            this.placeStoneBlock();
            this.updateHUD();
            return true;
        }

        return false;
    }

    updateHUD() {
        const hudElement = document.getElementById('gameHUD');
        if (hudElement) {
            hudElement.innerHTML = `
                Time: ${this.timeRemaining}s | 
                Score: ${this.score} | 
                High Score: ${this.highScore}
            `;
        }
    }

    showEndGameOverlay() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="overlay-content">
                    <h2>Game Over!</h2>
                    <p>Final Score: ${this.score}</p>
                    <p>High Score: ${this.highScore}</p>
                    <button onclick="document.getElementById('gameOverlay').style.display='none'">Close</button>
                </div>
            `;
        }
    }

    renderStoneBlock() {
        if (!this.isPlaying || !this.stoneBlock) return;

        // Render stone block
        const stoneBlock = new Cube();
        stoneBlock.color = [0.5, 0.5, 0.5, 1.0];  // Gray color for stone
        stoneBlock.textureNum = -2;  // Solid color
        stoneBlock.matrix.translate(
            this.stoneBlock.x - 16,
            this.stoneBlock.y - 0.5,
            this.stoneBlock.z - 16
        );
        stoneBlock.render();
    }
}