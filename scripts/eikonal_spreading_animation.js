class node {
    constructor(x, y){
        this.isWall = false;
        this.dist = 999;
        this.display_dist = 999;
        this.wasVisited = false;
        this.vector_angle = 0;
        this.display_vector_angle = 0;
        this.x = x;
        this.y = y;
    }
}

const eikonal_spreading_animation_sketch = (p, sketch_name) => {

    const arg = {
        screen: {
            w: 500,
            h: 500,
        },

        grid : {
            tile_size: 10,  // 50x50 grid
            w: 0,
            h: 0,
        }
    }

    var node_grid;
    var gfx_heatmap;

    var target = {
        x: 0,
        y: 0,
    };

    // Store all intermediate states during solving
    var timeSteps = [];
    var currentTimeStep = 0;
    var maxTimeSteps = 0;
    var timeSlider;
    var colorScheme = 'hue'; // 'hue' or 'grayscale'
    var isDrawingWalls = false;
    var isErasingWalls = false;

    p.setup = () => {
        let canva = p.createCanvas(arg.screen.w, arg.screen.h);
        canva.parent(sketch_name);

        arg.grid.w = p.floor(arg.screen.w / arg.grid.tile_size);
        arg.grid.h = p.floor(arg.screen.h / arg.grid.tile_size);

        // Initialize node grid
        node_grid = new Array(arg.grid.h).fill().map((_,y) =>
            new Array(arg.grid.w).fill().map((_,x) => new node(x, y))
        );

        // Create random walls
        generateRandomWalls();

        // Set target at center
        target.x = p.floor(arg.grid.w / 2);
        target.y = p.floor(arg.grid.h / 2);
        node_grid[target.y][target.x].isWall = false; // Ensure target is not a wall

        // Create controls
        createControls();

        // Solve eikonal and capture time steps
        solveEikonalWithTimeSteps();

        gfx_heatmap = p.createGraphics(arg.screen.w, arg.screen.h);
    }

    function createControls() {
        const container = document.getElementById(sketch_name);

        // Create main controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.style.marginTop = '10px';
        controlsDiv.style.marginBottom = '10px';

        // Time slider
        const sliderDiv = document.createElement('div');
        sliderDiv.style.marginBottom = '10px';

        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = 'Time Step: ';
        sliderLabel.style.marginRight = '10px';

        timeSlider = document.createElement('input');
        timeSlider.type = 'range';
        timeSlider.min = '0';
        timeSlider.max = '100';
        timeSlider.value = '0';
        timeSlider.step = '1';
        timeSlider.style.width = '300px';

        const valueDisplay = document.createElement('span');
        valueDisplay.id = sketch_name + '_time_value';
        valueDisplay.style.marginLeft = '10px';
        valueDisplay.textContent = '0';

        timeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            currentTimeStep = Math.floor((value / 100) * (maxTimeSteps - 1));
            valueDisplay.textContent = currentTimeStep;
            updateHeatmapFromTimeStep();
        });

        sliderDiv.appendChild(sliderLabel);
        sliderDiv.appendChild(timeSlider);
        sliderDiv.appendChild(valueDisplay);

        // Buttons row
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.marginBottom = '10px';

        // Change seed button
        const changeSeedBtn = document.createElement('button');
        changeSeedBtn.textContent = 'Change Wall Seed';
        changeSeedBtn.style.marginRight = '10px';
        changeSeedBtn.style.padding = '5px 10px';
        changeSeedBtn.addEventListener('click', () => {
            regenerateWalls();
        });

        // Erase all walls button
        const eraseAllBtn = document.createElement('button');
        eraseAllBtn.textContent = 'Erase All Walls';
        eraseAllBtn.style.marginRight = '10px';
        eraseAllBtn.style.padding = '5px 10px';
        eraseAllBtn.addEventListener('click', () => {
            eraseAllWalls();
        });

        // Draw walls button (toggle)
        const drawWallsBtn = document.createElement('button');
        drawWallsBtn.textContent = 'Draw Walls: OFF';
        drawWallsBtn.id = sketch_name + '_draw_walls_btn';
        drawWallsBtn.style.marginRight = '10px';
        drawWallsBtn.style.padding = '5px 10px';
        drawWallsBtn.addEventListener('click', () => {
            isDrawingWalls = !isDrawingWalls;
            isErasingWalls = false;
            drawWallsBtn.textContent = isDrawingWalls ? 'Draw Walls: ON' : 'Draw Walls: OFF';
            drawWallsBtn.style.backgroundColor = isDrawingWalls ? '#4CAF50' : '';
            eraseWallsBtn.textContent = 'Erase Walls: OFF';
            eraseWallsBtn.style.backgroundColor = '';
        });

        // Erase walls button (toggle)
        const eraseWallsBtn = document.createElement('button');
        eraseWallsBtn.textContent = 'Erase Walls: OFF';
        eraseWallsBtn.id = sketch_name + '_erase_walls_btn';
        eraseWallsBtn.style.marginRight = '10px';
        eraseWallsBtn.style.padding = '5px 10px';
        eraseWallsBtn.addEventListener('click', () => {
            isErasingWalls = !isErasingWalls;
            isDrawingWalls = false;
            eraseWallsBtn.textContent = isErasingWalls ? 'Erase Walls: ON' : 'Erase Walls: OFF';
            eraseWallsBtn.style.backgroundColor = isErasingWalls ? '#f44336' : '';
            drawWallsBtn.textContent = 'Draw Walls: OFF';
            drawWallsBtn.style.backgroundColor = '';
        });

        buttonsDiv.appendChild(changeSeedBtn);
        buttonsDiv.appendChild(eraseAllBtn);
        buttonsDiv.appendChild(drawWallsBtn);
        buttonsDiv.appendChild(eraseWallsBtn);

        // Color scheme dropdown
        const colorSchemeDiv = document.createElement('div');
        colorSchemeDiv.style.marginBottom = '10px';

        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Color Scheme: ';
        colorLabel.style.marginRight = '10px';

        const colorSelect = document.createElement('select');
        colorSelect.style.padding = '5px';

        const hueOption = document.createElement('option');
        hueOption.value = 'hue';
        hueOption.textContent = 'Color (Blue to Red)';

        const grayscaleOption = document.createElement('option');
        grayscaleOption.value = 'grayscale';
        grayscaleOption.textContent = 'Grayscale';

        colorSelect.appendChild(hueOption);
        colorSelect.appendChild(grayscaleOption);

        colorSelect.addEventListener('change', (e) => {
            colorScheme = e.target.value;
            updateHeatmapFromTimeStep();
        });

        colorSchemeDiv.appendChild(colorLabel);
        colorSchemeDiv.appendChild(colorSelect);

        // Assemble all controls
        controlsDiv.appendChild(sliderDiv);
        controlsDiv.appendChild(buttonsDiv);
        controlsDiv.appendChild(colorSchemeDiv);
        container.appendChild(controlsDiv);
    }

    function regenerateWalls() {
        // Clear existing walls
        for(let y = 0; y < arg.grid.h; y++){
            for(let x = 0; x < arg.grid.w; x++){
                node_grid[y][x].isWall = false;
            }
        }

        // Generate new walls
        generateRandomWalls();

        // Re-solve and update
        solveEikonalWithTimeSteps();
        currentTimeStep = 0;
        timeSlider.value = '0';
        document.getElementById(sketch_name + '_time_value').textContent = '0';
        updateHeatmapFromTimeStep();
    }

    function eraseAllWalls() {
        // Clear all walls
        for(let y = 0; y < arg.grid.h; y++){
            for(let x = 0; x < arg.grid.w; x++){
                node_grid[y][x].isWall = false;
            }
        }

        // Re-solve and update
        solveEikonalWithTimeSteps();
        currentTimeStep = 0;
        timeSlider.value = '0';
        document.getElementById(sketch_name + '_time_value').textContent = '0';
        updateHeatmapFromTimeStep();
    }

    function generateRandomWalls() {
        const minClearRadius = 8; // Clear area around center (in grid cells)
        const centerX = arg.grid.w / 2;
        const centerY = arg.grid.h / 2;
        const minWallSpacing = 7; // Minimum distance between parallel walls

        let verticalWallPositions = [];
        let horizontalWallPositions = [];

        // Create vertical walls (with spacing)
        const numVerticalWalls = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numVerticalWalls; i++) {
            let x;
            let attempts = 0;

            // Try to find a position with enough spacing
            do {
                x = Math.floor(Math.random() * arg.grid.w);
                attempts++;
            } while (
                attempts < 50 &&
                verticalWallPositions.some(pos => Math.abs(pos - x) < minWallSpacing)
            );

            if (attempts >= 50) continue; // Skip if couldn't find good position

            verticalWallPositions.push(x);

            // Random start and length for wall
            const startY = Math.floor(Math.random() * arg.grid.h * 0.2);
            const height = Math.floor(arg.grid.h * 0.4 + Math.random() * arg.grid.h * 0.4);

            for (let y = startY; y < Math.min(startY + height, arg.grid.h); y++) {
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (dist > minClearRadius) {
                    node_grid[y][x].isWall = true;
                }
            }
        }

        // Create horizontal walls (with spacing)
        const numHorizontalWalls = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numHorizontalWalls; i++) {
            let y;
            let attempts = 0;

            // Try to find a position with enough spacing
            do {
                y = Math.floor(Math.random() * arg.grid.h);
                attempts++;
            } while (
                attempts < 50 &&
                horizontalWallPositions.some(pos => Math.abs(pos - y) < minWallSpacing)
            );

            if (attempts >= 50) continue; // Skip if couldn't find good position

            horizontalWallPositions.push(y);

            // Random start and length for wall
            const startX = Math.floor(Math.random() * arg.grid.w * 0.2);
            const width = Math.floor(arg.grid.w * 0.4 + Math.random() * arg.grid.w * 0.4);

            for (let x = startX; x < Math.min(startX + width, arg.grid.w); x++) {
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (dist > minClearRadius) {
                    node_grid[y][x].isWall = true;
                }
            }
        }
    }

    function solveEikonalWithTimeSteps() {
        const rows = node_grid.length;
        const cols = node_grid[0].length;

        // Use Fast Marching Method for smooth spreading animation
        let distanceField = Array(rows).fill().map(() => Array(cols).fill(Infinity));
        let accepted = Array(rows).fill().map(() => Array(cols).fill(false));

        distanceField[target.y][target.x] = 0;

        // Store initial state
        timeSteps = [];
        timeSteps.push(JSON.parse(JSON.stringify(distanceField)));

        // Priority queue: simple array sorted by distance
        let heap = [{ x: target.x, y: target.y, dist: 0 }];

        function getSpeed(x, y) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return 0;
            const cell = node_grid[y][x];
            if (cell.isWall) return 0;
            return 1;
        }

        function solveEikonalUpdate(x, y) {
            if (y === target.y && x === target.x) return 0;

            const speed = getSpeed(x, y);
            if (speed === 0) return Infinity;

            // Get minimum accepted neighbor values
            let minX = Infinity;
            if (x > 0 && accepted[y][x-1]) minX = Math.min(minX, distanceField[y][x-1]);
            if (x < cols-1 && accepted[y][x+1]) minX = Math.min(minX, distanceField[y][x+1]);

            let minY = Infinity;
            if (y > 0 && accepted[y-1][x]) minY = Math.min(minY, distanceField[y-1][x]);
            if (y < rows-1 && accepted[y+1][x]) minY = Math.min(minY, distanceField[y+1][x]);

            if (minX > minY) [minX, minY] = [minY, minX];

            const h = 1.0;

            if (minX === Infinity) return Infinity;
            if (minY === Infinity) return minX + h/speed;

            const simpleUpdate = minX + h/speed;
            if (simpleUpdate <= minY) return simpleUpdate;

            const a = 2;
            const b = -2 * (minX + minY);
            const c = minX*minX + minY*minY - (h/speed)*(h/speed);
            const discriminant = b*b - 4*a*c;

            if (discriminant < 0) return minX + h/speed;

            return (-b + Math.sqrt(discriminant)) / (2*a);
        }

        function getNeighbors(x, y) {
            const neighbors = [];
            const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];

            for (let [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                    if (!node_grid[ny][nx].isWall && !accepted[ny][nx]) {
                        neighbors.push({ x: nx, y: ny });
                    }
                }
            }
            return neighbors;
        }

        let processedCount = 0;
        const captureInterval = Math.max(1, Math.floor(rows * cols / 200)); // Capture ~200 frames

        // Fast Marching Method main loop
        while (heap.length > 0) {
            // Sort heap by distance
            heap.sort((a, b) => a.dist - b.dist);

            // Get cell with minimum distance
            const current = heap.shift();

            if (accepted[current.y][current.x]) continue;

            // Accept this cell
            accepted[current.y][current.x] = true;
            processedCount++;

            // Update neighbors
            const neighbors = getNeighbors(current.x, current.y);
            for (let neighbor of neighbors) {
                const newDist = solveEikonalUpdate(neighbor.x, neighbor.y);

                if (newDist < distanceField[neighbor.y][neighbor.x]) {
                    distanceField[neighbor.y][neighbor.x] = newDist;

                    // Add or update in heap
                    const existing = heap.findIndex(
                        item => item.x === neighbor.x && item.y === neighbor.y
                    );
                    if (existing >= 0) {
                        heap[existing].dist = newDist;
                    } else {
                        heap.push({ x: neighbor.x, y: neighbor.y, dist: newDist });
                    }
                }
            }

            // Capture state periodically to create smooth animation
            if (processedCount % captureInterval === 0) {
                timeSteps.push(JSON.parse(JSON.stringify(distanceField)));
            }
        }

        // Capture final state
        timeSteps.push(JSON.parse(JSON.stringify(distanceField)));

        maxTimeSteps = timeSteps.length;
        console.log(`Captured ${maxTimeSteps} time steps`);
    }

    function updateHeatmapFromTimeStep() {
        if (currentTimeStep >= timeSteps.length) {
            currentTimeStep = timeSteps.length - 1;
        }

        const distanceField = timeSteps[currentTimeStep];

        // Update node grid with current time step
        for(let y = 0; y < arg.grid.h; y++){
            for(let x = 0; x < arg.grid.w; x++){
                node_grid[y][x].dist = distanceField[y][x];
                node_grid[y][x].display_dist = distanceField[y][x];
            }
        }

        drawHeatmap();
    }

    function drawHeatmap() {
        gfx_heatmap.clear();

        // Find max distance for color scaling
        let maxDist = 0;
        for(let y = 0; y < arg.grid.h; y++){
            for(let x = 0; x < arg.grid.w; x++){
                const dist = node_grid[y][x].display_dist;
                if (dist !== Infinity && !node_grid[y][x].isWall) {
                    maxDist = Math.max(maxDist, dist);
                }
            }
        }

        for(let y = 0; y < arg.grid.h; y++){
            for(let x = 0; x < arg.grid.w; x++){
                let current_node = node_grid[y][x];

                if(current_node.isWall) {
                    // Dark gray for walls (same for both schemes)
                    gfx_heatmap.colorMode(p.RGB);
                    gfx_heatmap.fill(50);
                } else if(current_node.dist === Infinity) {
                    // Very dark for unreached areas
                    gfx_heatmap.colorMode(p.RGB);
                    gfx_heatmap.fill(30);
                } else {
                    const normalizedDist = maxDist > 0 ? current_node.dist / maxDist : 0;

                    if (colorScheme === 'grayscale') {
                        // Grayscale: white (near) to black (far)
                        gfx_heatmap.colorMode(p.RGB);
                        const brightness = Math.floor(255 * (1 - normalizedDist));
                        gfx_heatmap.fill(brightness);
                    } else {
                        // Hue: blue (near) to red (far)
                        gfx_heatmap.colorMode(p.HSB);
                        const hue = 240 - normalizedDist * 240; // 240 (blue) to 0 (red)
                        gfx_heatmap.fill(hue, 100, 90);
                    }
                }

                gfx_heatmap.noStroke();
                gfx_heatmap.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }

        // Draw target
        gfx_heatmap.colorMode(p.RGB);
        gfx_heatmap.fill(255, 255, 255); // White
        gfx_heatmap.ellipse(
            (target.x + 0.5) * arg.grid.tile_size,
            (target.y + 0.5) * arg.grid.tile_size,
            arg.grid.tile_size * 2,
            arg.grid.tile_size * 2
        );
    }

    p.draw = () => {
        p.image(gfx_heatmap, 0, 0);
    }

    p.mousePressed = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > arg.screen.w || p.mouseY < 0 || p.mouseY > arg.screen.h) return;

        if (isDrawingWalls || isErasingWalls) {
            handleWallDrawing();
        }
    }

    p.mouseDragged = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > arg.screen.w || p.mouseY < 0 || p.mouseY > arg.screen.h) return;

        if (isDrawingWalls || isErasingWalls) {
            handleWallDrawing();
        }
    }

    p.mouseReleased = () => {
        if (isDrawingWalls || isErasingWalls) {
            // Re-solve when done drawing
            solveEikonalWithTimeSteps();
            currentTimeStep = 0;
            timeSlider.value = '0';
            document.getElementById(sketch_name + '_time_value').textContent = '0';
            updateHeatmapFromTimeStep();
        }
    }

    function handleWallDrawing() {
        const gridX = p.floor(p.mouseX / arg.grid.tile_size);
        const gridY = p.floor(p.mouseY / arg.grid.tile_size);

        if (gridX >= 0 && gridX < arg.grid.w && gridY >= 0 && gridY < arg.grid.h) {
            // Don't allow drawing on target
            if (gridX === target.x && gridY === target.y) return;

            if (isDrawingWalls) {
                node_grid[gridY][gridX].isWall = true;
            } else if (isErasingWalls) {
                node_grid[gridY][gridX].isWall = false;
            }

            // Update heatmap display immediately (without re-solving yet)
            drawHeatmap();
        }
    }
}

export default eikonal_spreading_animation_sketch;
