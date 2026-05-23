import { parse } from 'mathjs';
import { is_in_grid } from './utils_function.js';

function get_node_dist(node_grid, ax, ay, nx, ny, arg, fallback_type = 'center') {
    if (!is_in_grid(nx, ny, arg)) {
        return get_fallback_value(node_grid, ax, ay, arg, fallback_type);
    }
    const current_node = node_grid[ny][nx];
    if (current_node.isWall) {
        return get_fallback_value(node_grid, ax, ay, arg, fallback_type);
    }
    return current_node.dist;
}

function get_fallback_value(node_grid, x, y, arg, fallback_type) {
    if (fallback_type === 'none' || fallback_type === 'zero') {
        return 0;
    }
    // Default to 'center'
    return node_grid[y][x].dist;
}
var sobel_matrix = {
    x: [
        [-1, 0 ,1],
        [-2, 0 ,2],
        [-1, 0 ,1],
    ],
    y: [
        [-1,-2,-1],
        [0, 0, 0],
        [1, 2, 1],
    ]
}

const neighbor_pos_arr = [
    [-1,-1], [0,-1], [1,-1],
    [-1,0],           [1,0],
    [-1,1], [0,1], [1,1]
]

export function update_vectorfield(p, node_grid, arg, type, options = {}){
    let code = null;
    if (type === 'function') {
        const equation = options.equation || '-log(x+1)';
        try {
            const node = parse(equation);
            code = node.compile();
        } catch(e) {
            console.error("MathJS parse error: ", e);
            const node = parse('-log(x+1)');
            code = node.compile();
        }
    }

    for(let y = 0; y < arg.grid.h; y++){
        for(let x = 0; x < arg.grid.w; x++){
            let current_node = node_grid[y][x];
            if(current_node.isWall) continue;

            let node_gradient;

            let use_min_fallback = false;
            if (options.fallback === 'min') {
                for (const pos of neighbor_pos_arr) {
                    let nx = x + pos[0];
                    let ny = y + pos[1];
                    if (!is_in_grid(nx, ny, arg) || node_grid[ny][nx].isWall) {
                        use_min_fallback = true;
                        break;
                    }
                }
            }

            if (use_min_fallback) {
                node_gradient = kernel_min(node_grid, x, y, arg);
            } else {
                switch(type){
                    case "sobel":
                        node_gradient = kernel_sobel(node_grid, x, y, arg, options);
                        break;
                    case "min":
                        node_gradient = kernel_min(node_grid, x, y, arg);
                        break;
                    case "function":
                        node_gradient = kernel_f_function(node_grid, x, y, code, arg, options);
                }
            }
            
            let angle = p.atan2(node_gradient.y, node_gradient.x) - p.PI/2;
            current_node.vector_angle = angle;
        }
    }
}

export function kernel_min(node_grid, x, y, arg){
    let min_dist = Infinity;
    let vector = [0, 0];

    for(const neighbor_pos of neighbor_pos_arr){
        let dx = neighbor_pos[0];
        let dy = neighbor_pos[1];

        let neighbor_x = x + dx;
        let neighbor_y = y + dy;

        if(!is_in_grid(neighbor_x, neighbor_y, arg)) continue;

        let current_node = node_grid[neighbor_y][neighbor_x];
        if(current_node.isWall) continue;

        if(current_node.dist < min_dist){
            min_dist = current_node.dist;
            vector = neighbor_pos;
        }
    }

    return {x: vector[0], y: vector[1]};
}

export function kernel_sobel(node_grid, x, y, arg, options = {}){
    let g_x = 0;
    let g_y = 0;

    for (const neighbor_pos of neighbor_pos_arr) {
        const dx = neighbor_pos[0];
        const dy = neighbor_pos[1];
    
        const neighbor_x = x + dx;
        const neighbor_y = y + dy;
    
        let node_dist = get_node_dist(node_grid, x, y, neighbor_x, neighbor_y, arg, options.fallback);

        if (!Number.isFinite(node_dist)) {
            node_dist = 0;
        }
    
        g_x -= node_dist * sobel_matrix.x[dy + 1][dx + 1];
        g_y -= node_dist * sobel_matrix.y[dy + 1][dx + 1];
    }

    return {x: g_x, y: g_y};
}

export function kernel_f_function(node_grid, x, y, math_code, arg, options = {}){
    let vector = [0, 0];

    for(const neighbor_pos of neighbor_pos_arr){
        const dx = neighbor_pos[0];
        const dy = neighbor_pos[1];
    
        const neighbor_x = x + dx;
        const neighbor_y = y + dy;

        let node_dist = get_node_dist(node_grid, x, y, neighbor_x, neighbor_y, arg, options.fallback);

        if (!Number.isFinite(node_dist)) {
            node_dist = 0;
        }

        node_dist = math_code.evaluate({x : node_dist});
        vector = vector.map((v,i) => v + neighbor_pos[i] * node_dist);
    }

    return {x: vector[0], y: vector[1]};
}