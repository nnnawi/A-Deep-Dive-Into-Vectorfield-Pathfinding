import { is_in_grid } from './utils_function.js';
import { gfx_draw_grid } from './gfx_function.js';
import { djikstra_algorithm } from './solver_function.js';

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

const sobel_heatmap_sketch = (p, sketch_name) => {
    const arg = {
        screen: {
            w: 450,
            h: 450,
        },
        grid: {
            tile_size: 30,
            w: 15,
            h: 15,
            stroke: 100,
            stroke_weight: 1,
        }
    }

    const dist_arr = {
        Manhattan: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
        ]
    }

    var node_grid;
    var current_mode = "original"; // Track current visualization mode

    var gfx_grid;
    var gfx_visualization;

    // Sobel values for each node
    var sobel_values = [];

    var target = {
        x: 13,  // Bottom right with padding
        y: 13,
    }

    p.setup = () => {
        let canvas = p.createCanvas(arg.screen.w, arg.screen.h);
        canvas.parent(sketch_name);

        // Initialize node grid
        node_grid = new Array(arg.grid.h).fill().map((_, y) =>
            new Array(arg.grid.w).fill().map((_, x) => new node(x, y))
        );

        // Create vertical wall at column 7, rows 2-12
        for (let y = 2; y <= 12; y++) {
            node_grid[y][7].isWall = true;
        }

        gfx_grid = p.createGraphics(arg.screen.w, arg.screen.h);
        gfx_draw_grid(p, gfx_grid, arg);

        gfx_visualization = p.createGraphics(arg.screen.w, arg.screen.h);

        // Compute initial heatmap
        djikstra_algorithm(node_grid, target, dist_arr.Manhattan, arg);

        // Compute Sobel values
        compute_sobel_values();

        // Add event listener for radio buttons
        const radioButtons = document.querySelectorAll('input[name="sobel_mode"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                current_mode = e.target.value;
            });
        });
    }

    p.draw = () => {
        p.background(0);

        // Update display distances
        for (let y = 0; y < node_grid.length; y++) {
            for (let x = 0; x < node_grid[0].length; x++) {
                let current_node = node_grid[y][x];
                current_node.update_display_dist(p, 0.05);
            }
        }

        // Draw visualization based on current mode
        draw_visualization();

        p.image(gfx_visualization, 0, 0);
        // p.image(gfx_grid, 0, 0);
    }

    function compute_sobel_values() {
        sobel_values = new Array(arg.grid.h).fill().map(() =>
            new Array(arg.grid.w).fill().map(() => ({gx: 0, gy: 0, magnitude: 0, angle: 0}))
        );

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                if (node_grid[y][x].isWall) continue;

                let sobel = compute_sobel_at(x, y);
                sobel_values[y][x] = sobel;
            }
        }
    }

    function compute_sobel_at(x, y) {
        let gx = 0;
        let gy = 0;

        const sobel_x = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1],
        ];

        const sobel_y = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1],
        ];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let neighbor_x = x + dx;
                let neighbor_y = y + dy;

                let node_dist;

                // Handle boundaries and walls
                if (!is_in_grid(neighbor_x, neighbor_y, arg)) {
                    node_dist = node_grid[y][x].display_dist;
                } else {
                    let neighbor_node = node_grid[neighbor_y][neighbor_x];
                    node_dist = neighbor_node.isWall ? node_grid[y][x].display_dist : neighbor_node.display_dist;
                }

                gx += node_dist * sobel_x[dy + 1][dx + 1];
                gy += node_dist * sobel_y[dy + 1][dx + 1];
            }
        }

        let magnitude = Math.sqrt(gx * gx + gy * gy);
        let angle = p.atan2(gy, gx);

        return { gx, gy, magnitude, angle };
    }

    function draw_visualization() {
        gfx_visualization.clear();
        gfx_visualization.noStroke();

        if (current_mode === "original") {
            draw_original_heatmap();
        } else if (current_mode === "sobel_horizontal") {
            draw_sobel_horizontal();
        } else if (current_mode === "sobel_vertical") {
            draw_sobel_vertical();
        } else if (current_mode === "sobel_magnitude") {
            draw_sobel_magnitude();
        } else if (current_mode === "sobel_orientation") {
            draw_sobel_orientation();
        }

        // Always draw target node
        gfx_visualization.fill(255, 0, 0);
        gfx_visualization.ellipse(
            (target.x + 0.5) * arg.grid.tile_size,
            (target.y + 0.5) * arg.grid.tile_size,
            arg.grid.tile_size ,
            arg.grid.tile_size
        );
    }

    function draw_original_heatmap() {
        gfx_visualization.colorMode(p.RGB);

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall) {
                    gfx_visualization.fill(50, 50, 50);
                } else {
                            gfx_visualization.strokeWeight(0);

                    // Map distance 1-40 to grayscale (light to dark)
                    // distance 1 = 200 (light gray), distance 40 = 0 (black)
                    let dist = p.constrain(current_node.display_dist, 1, 40);
                    let gray_value = p.map(dist, 1, 20, 200, 0);
                    gfx_visualization.fill(gray_value, 0, 0);
                }

                gfx_visualization.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }
    }

    function draw_sobel_horizontal() {
        // Recompute sobel with current display distances
        compute_sobel_values();

        gfx_visualization.colorMode(p.RGB);

        // Find min/max for normalization
        let min_gx = Infinity;
        let max_gx = -Infinity;

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                if (node_grid[y][x].isWall) continue;
                let gx = sobel_values[y][x].gx;
                min_gx = Math.min(min_gx, gx);
                max_gx = Math.max(max_gx, gx);
            }
        }

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall) {
                    gfx_visualization.fill(50, 50, 50);
                } else {
                    let gx = sobel_values[y][x].gx;
                    // Map to 0-255 grayscale
                    let gray_value = p.map(gx, min_gx, max_gx, 150, 255);
                    gfx_visualization.fill(gray_value);
                }

                gfx_visualization.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }
    }

    function draw_sobel_vertical() {
        // Recompute sobel with current display distances
        compute_sobel_values();

        gfx_visualization.colorMode(p.RGB);

        // Find min/max for normalization
        let min_gy = Infinity;
        let max_gy = -Infinity;

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                if (node_grid[y][x].isWall) continue;
                let gy = sobel_values[y][x].gy;
                min_gy = Math.min(min_gy, gy);
                max_gy = Math.max(max_gy, gy);
            }
        }

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall) {
                    gfx_visualization.fill(50, 50, 50);
                } else {
                    let gy = sobel_values[y][x].gy;
                    // Map to 0-255 grayscale
                    let gray_value = p.map(gy, min_gy, max_gy, 0, 255);
                    gfx_visualization.fill(gray_value);
                }

                gfx_visualization.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }
    }

    function draw_sobel_magnitude() {
        // Recompute sobel with current display distances
        compute_sobel_values();

        gfx_visualization.colorMode(p.RGB);

        // Find max magnitude for normalization
        let max_magnitude = 0;

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                if (node_grid[y][x].isWall) continue;
                let magnitude = sobel_values[y][x].magnitude;
                max_magnitude = Math.max(max_magnitude, magnitude);
            }
        }


        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall) {
                    gfx_visualization.fill(50, 50, 50);
                } else {
                    let magnitude = sobel_values[y][x].magnitude;
                    // Map to 0-255 grayscale
                    let gray_value = p.map(magnitude, 0, max_magnitude, 200, 255);
                    gfx_visualization.fill(gray_value);
                }

                gfx_visualization.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }
    }

    function draw_sobel_orientation() {
        // Recompute sobel with current display distances
        compute_sobel_values();

        gfx_visualization.colorMode(p.HSB);

        for (let y = 0; y < arg.grid.h; y++) {
            for (let x = 0; x < arg.grid.w; x++) {
                let current_node = node_grid[y][x];

                if (current_node.isWall) {
                    gfx_visualization.fill(0, 0, 20);
                } else {
                    let angle = sobel_values[y][x].angle;
                    // Map angle from [-PI, PI] to [0, 360]
                    let hue = p.map(angle, -p.PI, p.PI, 0, 360);
                    gfx_visualization.fill(hue, 80, 90);
                }

                gfx_visualization.rect(
                    x * arg.grid.tile_size,
                    y * arg.grid.tile_size,
                    arg.grid.tile_size,
                    arg.grid.tile_size
                );
            }
        }
    }
}

export default sobel_heatmap_sketch;
