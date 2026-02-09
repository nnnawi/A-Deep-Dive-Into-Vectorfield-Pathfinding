const grid_djikstra_animation_sketch = (p, sketch_name) => {
    const GRID_WIDTH = 15;
    const GRID_HEIGHT = 9;
    const CELL_SIZE = 40;
    
    let grid = [];
    let distances = [];
    let previous = [];
    let visited = [];
    let queue = [];
    let source = { x: 1, y: 4 };
    let target = { x: 13, y: 4 };
    let originalTarget = { x: 13, y: 4 };
    let isRunning = false;
    let found = false;
    let path = [];
    let mouseModeActive = false;
    let isDragging = false;
    let drawingWalls = true; // true = drawing walls, false = erasing walls
    let useDottedLine = true; // true = dotted line, false = solid line
    
    // Animation variables
    let pathAnimationOffset = 0;
    let tileAnimations = {};
    let pathReadyToShow = false;
    
    const WALL = -1;
    const EMPTY = 0;
    const SOURCE = 1;
    const TARGET = 2;
    
    p.setup = () => {
        let canvas = p.createCanvas(GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
        canvas.parent(sketch_name);
        initializeGrid();
        
        document.getElementById('startBtn').addEventListener('click', startDijkstra);
        document.getElementById('mouseModeBtn').addEventListener('click', toggleMouseMode);
        //document.getElementById('lineStyleBtn').addEventListener('click', toggleLineStyle);
        //updateLineStyleButton();
    };
    
    function initializeGrid() {
        // Initialize grid with empty cells
        for (let x = 0; x < GRID_WIDTH; x++) {
            grid[x] = [];
            distances[x] = [];
            previous[x] = [];
            visited[x] = [];
            for (let y = 0; y < GRID_HEIGHT; y++) {
                grid[x][y] = EMPTY;
                distances[x][y] = Infinity;
                previous[x][y] = null;
                visited[x][y] = false;
            }
        }
        
        // Add vertical wall
        for (let y = 1; y < 8; y++) {
            grid[7][y] = WALL;
        }
        
        // Set source and target
        grid[source.x][source.y] = SOURCE;
        grid[target.x][target.y] = TARGET;
        
        // Reset algorithm state
        isRunning = false;
        found = false;
        path = [];
        queue = [];
        tileAnimations = {};
        pathReadyToShow = false;
    }
    
    function startDijkstra() {
        if (isRunning) return;
        
        // Disable mouse mode and reset target to original position
        mouseModeActive = false;
        target = { x: originalTarget.x, y: originalTarget.y };
        updateMouseModeButton();
        
        // Reset grid target position
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (grid[x][y] === TARGET) {
                    grid[x][y] = EMPTY;
                }
            }
        }
        grid[target.x][target.y] = TARGET;
        
        // Reset distances and visited
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                distances[x][y] = Infinity;
                previous[x][y] = null;
                visited[x][y] = false;
            }
        }
        
        // Initialize algorithm
        distances[source.x][source.y] = 0;
        queue = [{ x: source.x, y: source.y, dist: 0 }];
        isRunning = true;
        found = false;
        path = [];
        tileAnimations = {};
        pathReadyToShow = false;
        
        document.getElementById('startBtn').disabled = true;
    }
    
    function toggleMouseMode() {
        if (isRunning) return;
        
        mouseModeActive = !mouseModeActive;
        updateMouseModeButton();
        
        if (mouseModeActive) {
            // Run initial pathfinding calculation
            calculateInstantPath();
        } else {
            // Reset to original target position
            target = { x: originalTarget.x, y: originalTarget.y };
            for (let x = 0; x < GRID_WIDTH; x++) {
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    if (grid[x][y] === TARGET) {
                        grid[x][y] = EMPTY;
                    }
                }
            }
            grid[target.x][target.y] = TARGET;
            
            // Clear visualization
            for (let x = 0; x < GRID_WIDTH; x++) {
                for (let y = 0; y < GRID_HEIGHT; y++) {
                    distances[x][y] = Infinity;
                    previous[x][y] = null;
                    visited[x][y] = false;
                }
            }
            path = [];
            tileAnimations = {};
            pathReadyToShow = false;
        }
    }
    
    function toggleLineStyle() {
        useDottedLine = !useDottedLine;
        updateLineStyleButton();
    }
    
    function updateMouseModeButton() {
        const btn = document.getElementById('mouseModeBtn');
        btn.textContent = mouseModeActive ? 'Exit Free Mouse Mode' : 'Toggle Free Mouse Mode';
        btn.style.backgroundColor = mouseModeActive ? '#ff6b6b' : '#4CAF50';
    }
    
    /*
    function updateLineStyleButton() {
        const btn = document.getElementById('lineStyleBtn');
        btn.textContent = useDottedLine ? 'Switch to Solid Line' : 'Switch to Dotted Line';
        btn.style.backgroundColor = useDottedLine ? '#9b59b6' : '#3498db';
    }
    */
    
    function getNeighbors(x, y) {
        const neighbors = [];
        // 8-neighbor connectivity (including diagonals)
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (let [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                if (grid[nx][ny] !== WALL) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        
        return neighbors;
    }
    
    function manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    function reconstructPath() {
        path = [];
        let current = { x: target.x, y: target.y };
        
        while (current && !(current.x === source.x && current.y === source.y)) {
            path.push({ x: current.x, y: current.y });
            current = previous[current.x][current.y];
        }
        
        if (current) {
            path.push({ x: source.x, y: source.y });
        }
        
        path.reverse();
        pathReadyToShow = true;
    }
    
    function calculateInstantPath() {
        // Reset state
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                distances[x][y] = Infinity;
                previous[x][y] = null;
                visited[x][y] = false;
            }
        }
        
        // Run complete Dijkstra instantly
        distances[source.x][source.y] = 0;
        let tempQueue = [{ x: source.x, y: source.y, dist: 0 }];
        
        while (tempQueue.length > 0) {
            tempQueue.sort((a, b) => a.dist - b.dist);
            const current = tempQueue.shift();
            
            if (visited[current.x][current.y]) continue;
            visited[current.x][current.y] = true;
            
            if (current.x === target.x && current.y === target.y) {
                break;
            }
            
            const neighbors = getNeighbors(current.x, current.y);
            for (let neighbor of neighbors) {
                if (!visited[neighbor.x][neighbor.y]) {
                    const edgeWeight = manhattanDistance(current.x, current.y, neighbor.x, neighbor.y);
                    const newDist = distances[current.x][current.y] + edgeWeight;
                    
                    if (newDist < distances[neighbor.x][neighbor.y]) {
                        distances[neighbor.x][neighbor.y] = newDist;
                        previous[neighbor.x][neighbor.y] = { x: current.x, y: current.y };
                        tempQueue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
                    }
                }
            }
        }
        
        reconstructPath();
    }
    
    function addTileAnimation(x, y) {
        const key = `${x}_${y}`;
        tileAnimations[key] = {
            startTime: p.millis(),
            duration: 500,
            x: x,
            y: y
        };
    }
    
    function updateAnimations() {
        const currentTime = p.millis();
        const keysToRemove = [];
        
        for (let key in tileAnimations) {
            const anim = tileAnimations[key];
            if (currentTime - anim.startTime > anim.duration) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => delete tileAnimations[key]);
    }
    
    function getAnimationScale(x, y) {
        const key = `${x}_${y}`;
        const anim = tileAnimations[key];
        if (!anim) return 1;
        
        const elapsed = p.millis() - anim.startTime;
        const progress = elapsed / anim.duration;
        
        if (progress >= 1) return 1;
        
        // Bouncy spring animation with quick bounce
        const bounce = -Math.pow(2, -8 * progress) * Math.sin((progress * 3 + 0.5) * Math.PI) + 1;
        return 1 + bounce * 0.3;
    }
    
    function getTextAlpha(x, y) {
        const key = `${x}_${y}`;
        const anim = tileAnimations[key];
        if (!anim) return 255;
        
        const elapsed = p.millis() - anim.startTime;
        const progress = elapsed / anim.duration;
        
        if (progress >= 1) return 255;
        
        // Smooth fade in for text
        return Math.floor(255 * progress);
    }
    
    p.draw = () => {
        p.background(255);
        
        // Update animations
        updateAnimations();
        
        // Update path animation offset with perfect loop
        pathAnimationOffset += 0.4;
        const dotSpacing = 25; // Increased spacing between dots
        if (pathAnimationOffset >= dotSpacing) {
            pathAnimationOffset = 0;
        }
        
        // Run one step of Dijkstra if algorithm is running
        if (isRunning && !found && queue.length > 0) {
            // Sort queue by distance (simple priority queue)
            queue.sort((a, b) => a.dist - b.dist);
            
            const current = queue.shift();
            
            if (visited[current.x][current.y]) {
                return;
            }
            
            visited[current.x][current.y] = true;
            
            // Add tile animation when visiting a new tile
            if (!(current.x === source.x && current.y === source.y)) {
                addTileAnimation(current.x, current.y);
            }
            
            // Check if we reached the target
            if (current.x === target.x && current.y === target.y) {
                found = true;
                isRunning = false;
                // Wait for animations to finish before showing path
                setTimeout(() => {
                    reconstructPath();
                    document.getElementById('startBtn').disabled = false;
                }, 300);
                return;
            }
            
            // Check neighbors
            const neighbors = getNeighbors(current.x, current.y);
            
            for (let neighbor of neighbors) {
                if (!visited[neighbor.x][neighbor.y]) {
                    // Use Manhattan distance for edge weight
                    const edgeWeight = manhattanDistance(current.x, current.y, neighbor.x, neighbor.y);
                    const newDist = distances[current.x][current.y] + edgeWeight;
                    
                    if (newDist < distances[neighbor.x][neighbor.y]) {
                        distances[neighbor.x][neighbor.y] = newDist;
                        previous[neighbor.x][neighbor.y] = { x: current.x, y: current.y };
                        queue.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
                    }
                }
            }
        }
        
        // Stop algorithm if queue is empty and target not found
        if (isRunning && queue.length === 0) {
            isRunning = false;
            document.getElementById('startBtn').disabled = false;
        }
        
        // Draw grid
        drawGrid();
        
        // Draw path only when ready and algorithm is complete
        if ((pathReadyToShow || mouseModeActive) && path.length > 1) {
            if (useDottedLine) {
                drawAnimatedDottedPath();
            } else {
                drawSolidPath();
            }
        }
    };
    
    function drawGrid() {
        // Draw grid lines first
        p.stroke(200);
        p.strokeWeight(1);
        
        // Draw vertical lines
        for (let x = 0; x <= GRID_WIDTH; x++) {
            p.line(x * CELL_SIZE, 0, x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            p.line(0, y * CELL_SIZE, GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
        }
        
        // Find max distance for color scaling
        let maxDist = 0;
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                if (distances[x][y] !== Infinity && visited[x][y]) {
                    maxDist = Math.max(maxDist, distances[x][y]);
                }
            }
        }
        
        // Draw tiles with transparency
        p.noStroke();
        
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                const cellX = x * CELL_SIZE;
                const cellY = y * CELL_SIZE;
                
                // Get animation scale for this tile
                const scale = getAnimationScale(x, y);
                const scaledSize = CELL_SIZE * scale;
                const offset = (CELL_SIZE - scaledSize) / 2;
                
                // Determine cell color with alpha
                if (grid[x][y] === WALL) {
                    p.fill(60, 220);
                } else if (grid[x][y] === SOURCE) {
                    p.fill(0, 255, 0, 220);
                } else if (grid[x][y] === TARGET) {
                    p.fill(255, 0, 0, 220);
                } else if (visited[x][y] && distances[x][y] !== Infinity) {
                    // Color based on distance (red shades) with alpha
                    const intensity = maxDist > 0 ? (distances[x][y] / maxDist) : 0;
                    const redValue = Math.floor(255 * (1 - intensity * 0.7));
                    p.fill(255, redValue, redValue, 200);
                } else {
                    // Skip drawing empty cells to keep grid visible
                    continue;
                }
                
                p.rect(cellX + offset, cellY + offset, scaledSize, scaledSize);
                
                // Draw distance numbers for visited cells
                if (visited[x][y] && distances[x][y] !== Infinity && grid[x][y] !== SOURCE && grid[x][y] !== TARGET) {
                    const textAlpha = getTextAlpha(x, y);
                    p.fill(0, textAlpha);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(12);
                    p.text(distances[x][y], cellX + CELL_SIZE/2, cellY + CELL_SIZE/2);
                }
            }
        }
    }
    
    function drawSolidPath() {
        if (path.length < 2) return;

        p.stroke(255, 255, 255);
        p.strokeWeight(3);
        p.strokeCap(p.ROUND);
        p.strokeJoin(p.ROUND);
        p.noFill();
        
        p.beginShape();
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const x = point.x * CELL_SIZE + CELL_SIZE / 2;
            const y = point.y * CELL_SIZE + CELL_SIZE / 2;
            p.vertex(x, y);
        }
        p.endShape();
        
        // Reset stroke for grid
        p.stroke(200);
        p.strokeWeight(1);
        p.strokeCap(p.SQUARE);
        p.strokeJoin(p.MITER);
    }
    
    function drawAnimatedDottedPath() {
        if (path.length < 2) return;
        
        // Calculate total path length for proper dot spacing
        let totalLength = 0;
        let segments = [];
        
        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];
            const startX = start.x * CELL_SIZE + CELL_SIZE / 2;
            const startY = start.y * CELL_SIZE + CELL_SIZE / 2;
            const endX = end.x * CELL_SIZE + CELL_SIZE / 2;
            const endY = end.y * CELL_SIZE + CELL_SIZE / 2;
            
            const segmentLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            segments.push({
                startX, startY, endX, endY, length: segmentLength, cumulativeLength: totalLength
            });
            totalLength += segmentLength;
        }
        
        // Draw dotted line with perfect animation loop
        p.stroke(255, 255, 255);
        p.strokeWeight(3);
        p.strokeCap(p.ROUND);
        
        const dotSpacing = 25; // Increased spacing between dots
        const dotLength = 10;
        
        for (let distance = pathAnimationOffset; distance < totalLength; distance += dotSpacing) {
            // Find which segment this dot belongs to
            let currentSegment = null;
            for (let seg of segments) {
                if (distance >= seg.cumulativeLength && distance < seg.cumulativeLength + seg.length) {
                    currentSegment = seg;
                    break;
                }
            }
            
            if (currentSegment) {
                const segmentProgress = (distance - currentSegment.cumulativeLength) / currentSegment.length;
                const dotStartX = p.lerp(currentSegment.startX, currentSegment.endX, segmentProgress);
                const dotStartY = p.lerp(currentSegment.startY, currentSegment.endY, segmentProgress);
                
                // Calculate direction for the dot length
                const dx = currentSegment.endX - currentSegment.startX;
                const dy = currentSegment.endY - currentSegment.startY;
                const segLength = Math.sqrt(dx * dx + dy * dy);
                const unitX = dx / segLength;
                const unitY = dy / segLength;
                
                const dotEndX = dotStartX + unitX * dotLength;
                const dotEndY = dotStartY + unitY * dotLength;
                
                p.line(dotStartX, dotStartY, dotEndX, dotEndY);
            }
        }
        
        // Reset stroke for grid
        p.stroke(200);
        p.strokeWeight(1);
        p.strokeCap(p.SQUARE);
    }
    
    p.mouseMoved = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > GRID_WIDTH * CELL_SIZE || p.mouseY < 0 || p.mouseY > GRID_HEIGHT * CELL_SIZE) return;
        if (!mouseModeActive || isRunning) return;
        
        // Convert mouse position to grid coordinates
        const gridX = Math.floor(p.mouseX / CELL_SIZE);
        const gridY = Math.floor(p.mouseY / CELL_SIZE);
        
        // Check if mouse is within grid bounds and not on a wall or source
        if (gridX >= 0 && gridX < GRID_WIDTH && 
            gridY >= 0 && gridY < GRID_HEIGHT &&
            grid[gridX][gridY] !== WALL &&
            !(gridX === source.x && gridY === source.y) &&
            !(gridX === target.x && gridY === target.y)) {
            
            // Clear old target
            if (grid[target.x][target.y] === TARGET) {
                grid[target.x][target.y] = EMPTY;
            }
            
            // Set new target
            target = { x: gridX, y: gridY };
            grid[target.x][target.y] = TARGET;
            
            // Recalculate path
            calculateInstantPath();
        }
    };
    
    p.mousePressed = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > GRID_WIDTH * CELL_SIZE || p.mouseY < 0 || p.mouseY > GRID_HEIGHT * CELL_SIZE) return;
        if (isRunning) return;
        
        const gridX = Math.floor(p.mouseX / CELL_SIZE);
        const gridY = Math.floor(p.mouseY / CELL_SIZE);
        
        // Check if mouse is within grid bounds
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            // Don't allow drawing on source or target
            if ((gridX === source.x && gridY === source.y) || 
                (gridX === target.x && gridY === target.y)) {
                return;
            }
            
            isDragging = true;
            
            // Determine drawing mode based on what's under the mouse
            if (grid[gridX][gridY] === WALL) {
                drawingWalls = false; // Erase walls
                grid[gridX][gridY] = EMPTY;
            } else if (grid[gridX][gridY] === EMPTY) {
                drawingWalls = true; // Draw walls
                grid[gridX][gridY] = WALL;
            }
            
            // Update visualization if in mouse mode
            if (mouseModeActive) {
                calculateInstantPath();
            }
        }
    };
    
    p.mouseDragged = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > GRID_WIDTH * CELL_SIZE || p.mouseY < 0 || p.mouseY > GRID_HEIGHT * CELL_SIZE) return;
        if (!isDragging || isRunning) return;
        
        const gridX = Math.floor(p.mouseX / CELL_SIZE);
        const gridY = Math.floor(p.mouseY / CELL_SIZE);
        
        // Check if mouse is within grid bounds
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            // Don't allow drawing on source or target
            if ((gridX === source.x && gridY === source.y) || 
                (gridX === target.x && gridY === target.y)) {
                return;
            }
            
            // Continue the drawing/erasing action
            if (drawingWalls && grid[gridX][gridY] === EMPTY) {
                grid[gridX][gridY] = WALL;
                // Update visualization if in mouse mode
                if (mouseModeActive) {
                    calculateInstantPath();
                }
            } else if (!drawingWalls && grid[gridX][gridY] === WALL) {
                grid[gridX][gridY] = EMPTY;
                // Update visualization if in mouse mode
                if (mouseModeActive) {
                    calculateInstantPath();
                }
            }
        }
    };
    
    p.mouseReleased = () => {
        isDragging = false;
    };
};

export default grid_djikstra_animation_sketch;