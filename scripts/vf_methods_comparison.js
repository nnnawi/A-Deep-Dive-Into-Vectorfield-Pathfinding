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

const vf_comparison_sketch = (p, sketch_name) => {
    const arg = {
        screen: {
            w: 800,
            h: 290,
        },
        grid: {
            tile_size: 24,
            w: 10,
            h: 10,
            stroke: 100,
            stroke_weight: 1,
        },
        arrow: {
            stroke: 125,
            stroke_weight: 1.5,
            main_len: 10,
            scd_len: 4,
            angle: 210,
        },
        layout: {
            grid_width: 240,
            grid_height: 240,
            gap: 40,
            start_x: 0,
            title_height: 50,
        }
    }

    const dist_arr = {
        Euclidian: [
            [1.41, 1, 1.41],
            [1, 0, 1],
            [1.41, 1, 1.41],
        ]
    }

    // Graphics layers for each grid
    var gfx_grids = [];
    var gfx_heatmaps = [];
    var gfx_vectorfields = [];

    // Three separate node grids
    var node_grids = [];

    var current_function = "-log(x + 1)"; // Default weighting function
    var math_code;

    var target = {
        x: 0,
        y: 0,
    }

    // Calculate grid positions
    arg.layout.start_x = (arg.screen.w - (arg.layout.grid_width * 3 + arg.layout.gap * 2)) / 2;

    function getGridX(gridIndex) {
        return arg.layout.start_x + gridIndex * (arg.layout.grid_width + arg.layout.gap);
    }

    // Initialize wall pattern (plus/cross shape)
    function initializeWallPattern(node_grid) {
        const centerX = Math.floor(arg.grid.w / 2);
        const centerY = Math.floor(arg.grid.h / 2);

        // Vertical wall
        for (let y = 2; y < arg.grid.h - 2; y++) {
            node_grid[y][centerX].isWall = true;
        }

        // Horizontal wall
        for (let x = 2; x < arg.grid.w - 2; x++) {
            node_grid[centerY][x].isWall = true;
        }
    }

    p.setup = () => {
        let canvas = p.createCanvas(arg.screen.w, arg.screen.h);
        canvas.parent(sketch_name);

        // Create three node grids with the same wall pattern
        for (let i = 0; i < 3; i++) {
            let node_grid = new Array(arg.grid.h).fill().map((_, y) =>
                new Array(arg.grid.w).fill().map((_, x) => new node(x, y))
            );
            initializeWallPattern(node_grid);
            node_grids.push(node_grid);

            // Create graphics for each grid (using grid dimensions only)
            gfx_grids.push(p.createGraphics(arg.grid.w * arg.grid.tile_size, arg.grid.h * arg.grid.tile_size));
            gfx_heatmaps.push(p.createGraphics(arg.grid.w * arg.grid.tile_size, arg.grid.h * arg.grid.tile_size));
            gfx_vectorfields.push(p.createGraphics(arg.grid.w * arg.grid.tile_size, arg.grid.h * arg.grid.tile_size));
        }

        // Compile the weighting function
        const mathNode = math.parse(current_function);
        math_code = mathNode.compile();

        // Compute heatmap for all grids (using first grid, then copy to others)
        djikstra_algorithm(node_grids[0], target, dist_arr.Euclidian, arg);

        // Copy distances to other grids
        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                node_grids[1][y][x].dist = node_grids[0][y][x].dist;
                node_grids[2][y][x].dist = node_grids[0][y][x].dist;
            }
        }

        // Compute vector fields for each method
        update_vectorfield_sobel(p, node_grids[0], arg);
        update_vectorfield_min(p, node_grids[1], arg);
        update_vectorfield_weighted(p, node_grids[2], arg, math_code);

        // Setup event listeners for radio buttons
        const radioButtons = document.querySelectorAll('input[name="vf_comparison_weight_function"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                current_function = e.target.value;
                const mathNode = math.parse(current_function);
                math_code = mathNode.compile();
                update_vectorfield_weighted(p, node_grids[2], arg, math_code);
            });
        });
    }

    p.draw = () => {
        p.background(0);

        // Update display values for all grids
        for (let gridIndex = 0; gridIndex < 3; gridIndex++) {
            for (let y = 0; y < arg.grid.h; y++) {
                for (let x = 0; x < arg.grid.w; x++) {
                    let current_node = node_grids[gridIndex][y][x];
                    current_node.update_display_dist(p, 0.05);
                    current_node.update_display_vector_angle(p, 0.05);
                }
            }
        }

        // Draw each grid
        for (let gridIndex = 0; gridIndex < 3; gridIndex++) {
            let gridX = getGridX(gridIndex);

            // Draw heatmap
            gfx_draw_heatmap_local(p, gfx_heatmaps[gridIndex], node_grids[gridIndex], target, arg);

            // Draw vector field based on method
            if (gridIndex === 0) {
                gfx_draw_vectorfield_local(p, gfx_vectorfields[gridIndex], node_grids[gridIndex], target, arg);
            } else if (gridIndex === 1) {
                gfx_draw_vectorfield_local(p, gfx_vectorfields[gridIndex], node_grids[gridIndex], target, arg);
            } else {
                gfx_draw_vectorfield_local(p, gfx_vectorfields[gridIndex], node_grids[gridIndex], target, arg);
            }

            // Display layers
            p.push();
            p.translate(gridX, 0);
            p.image(gfx_heatmaps[gridIndex], 0, 0);
            p.image(gfx_vectorfields[gridIndex], 0, 0);
            p.pop();
        }

        // Draw titles
        drawTitles();
    }

    function drawTitles() {
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(14);

        const titles = ["Sobel Method", "Min Distance Method", "Weighted Function"];

        for (let i = 0; i < 3; i++) {
            let gridX = getGridX(i);
            let titleX = gridX + arg.layout.grid_width / 2;
            let titleY = arg.layout.grid_height + 10;
            p.text(titles[i], titleX, titleY);
        }
    }

    p.mouseMoved = () => {
        updateTargetFromMouse();
    }

    p.mouseDragged = () => {
        updateTargetFromMouse();
    }

    function updateTargetFromMouse() {
        // Check if mouse is over any of the three grids
        for (let gridIndex = 0; gridIndex < 3; gridIndex++) {
            let gridX = getGridX(gridIndex);

            if (p.mouseX >= gridX &&
                p.mouseX < gridX + arg.layout.grid_width &&
                p.mouseY >= 0 &&
                p.mouseY < arg.layout.grid_height) {

                let localX = p.mouseX - gridX;
                let localY = p.mouseY;

                let grid_x = p.floor(localX / arg.grid.tile_size);
                let grid_y = p.floor(localY / arg.grid.tile_size);

                if (grid_x >= 0 && grid_x < arg.grid.w && grid_y >= 0 && grid_y < arg.grid.h) {
                    target.x = grid_x;
                    target.y = grid_y;

                    // Recompute heatmap for first grid
                    reset_node_grid(node_grids[0]);
                    initializeWallPattern(node_grids[0]);
                    djikstra_algorithm(node_grids[0], target, dist_arr.Euclidian, arg);

                    // Copy distances and walls to other grids
                    for (let y = 0; y < arg.grid.h; y++) {
                        for (let x = 0; x < arg.grid.w; x++) {
                            node_grids[1][y][x].dist = node_grids[0][y][x].dist;
                            node_grids[1][y][x].isWall = node_grids[0][y][x].isWall;
                            node_grids[2][y][x].dist = node_grids[0][y][x].dist;
                            node_grids[2][y][x].isWall = node_grids[0][y][x].isWall;
                        }
                    }

                    // Recompute vector fields
                    update_vectorfield_sobel(p, node_grids[0], arg);
                    update_vectorfield_min(p, node_grids[1], arg);
                    update_vectorfield_weighted(p, node_grids[2], arg, math_code);
                }
                break;
            }
        }
    }

    // Vectorfield computation methods

    function update_vectorfield_sobel(p, node_grid, arg) {
        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];
                if (current_node.isWall) continue;

                let gradient = kernel_sobel(node_grid, x, y, arg);
                let angle = p.atan2(gradient.y, gradient.x) - p.PI / 2;
                current_node.vector_angle = angle;
            }
        }
    }

    function update_vectorfield_min(p, node_grid, arg) {
        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];
                if (current_node.isWall) continue;

                let min_dist = Infinity;
                let min_neighbor_pos = [0, 0];

                for (const neighbor_pos of neighbor_pos_arr) {
                    let dx = neighbor_pos[0];
                    let dy = neighbor_pos[1];

                    let neighbor_x = x + dx;
                    let neighbor_y = y + dy;

                    if (!is_in_grid(neighbor_x, neighbor_y, arg)) continue;

                    let neighbor_node = node_grid[neighbor_y][neighbor_x];
                    if (neighbor_node.isWall) continue;

                    if (neighbor_node.dist < min_dist) {
                        min_dist = neighbor_node.dist;
                        min_neighbor_pos = [dx, dy];
                    }
                }

                let angle = p.atan2(min_neighbor_pos[1], min_neighbor_pos[0]) - p.PI / 2;
                current_node.vector_angle = angle;
            }
        }
    }

    function update_vectorfield_weighted(p, node_grid, arg, math_code) {
        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];
                if (current_node.isWall) continue;

                let vector = [0, 0];

                for (const neighbor_pos of neighbor_pos_arr) {
                    const dx = neighbor_pos[0];
                    const dy = neighbor_pos[1];

                    const neighbor_x = x + dx;
                    const neighbor_y = y + dy;

                    let node_dist;

                    if (!is_in_grid(neighbor_x, neighbor_y, arg)) {
                        node_dist = current_node.dist;
                    } else {
                        const neighbor_node = node_grid[neighbor_y][neighbor_x];
                        node_dist = neighbor_node.isWall ? current_node.dist : neighbor_node.dist;
                    }

                    let weight = math_code.evaluate({ x: node_dist });
                    vector[0] += neighbor_pos[0] * weight;
                    vector[1] += neighbor_pos[1] * weight;
                }

                let magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
                if (magnitude > 0) {
                    vector[0] /= magnitude;
                    vector[1] /= magnitude;
                }

                let angle = p.atan2(vector[1], vector[0]) - p.PI / 2;
                current_node.vector_angle = angle;
            }
        }
    }

    // Drawing functions

    function gfx_draw_heatmap_local(p, gfx, node_grid, target, arg) {
        gfx.clear();
        gfx.colorMode(p.HSB);

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                gfx.noStroke();
                gfx.fill(current_node.display_dist * 10, 255, 100);
                if (current_node.dist == Infinity) gfx.fill(0, 0, 255);
                if (current_node.isWall) gfx.fill(0, 0, 0);

                gfx.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }

        // Draw target
        gfx.noStroke();
        gfx.fill(0, 0, 0);
        gfx.ellipse(
            (target.x + 0.5) * arg.grid.tile_size,
            (target.y + 0.5) * arg.grid.tile_size,
            arg.grid.tile_size,
            arg.grid.tile_size
        );
    }

    function gfx_draw_vectorfield_local(p, gfx, node_grid, target, arg) {
        gfx.clear();
        gfx.strokeWeight(arg.arrow.stroke_weight);

        gfx.push();
        gfx.colorMode(p.HSB);

        gfx.drawingContext.shadowOffsetX = 0;
        gfx.drawingContext.shadowOffsetY = 0;
        gfx.drawingContext.shadowBlur = 10;
        gfx.drawingContext.shadowColor = 'gray';
        gfx.translate(arg.grid.tile_size / 2, arg.grid.tile_size / 2);

        for (let y = 0; y < arg.grid.h; y++) {
            gfx.push();

            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall || (x == target.x && y == target.y)) {
                    gfx.translate(arg.grid.tile_size, 0);
                    continue;
                }

                let angle = current_node.display_vector_angle;
                gfx.push();
                gfx.stroke(0, 0, 255);
                gfx.rotate(angle);
                gfx_draw_arrow(p, gfx, arg);
                gfx.pop();

                gfx.translate(arg.grid.tile_size, 0);
            }
            gfx.pop();
            gfx.translate(0, arg.grid.tile_size);
        }
        gfx.pop();
    }
}

export default vf_comparison_sketch;
