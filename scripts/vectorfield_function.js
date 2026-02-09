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

function update_vectorfield(p, node_grid, arg){
    const node = math.parse('-log(x + 1)');
    const code = node.compile();

    for(let y = 0; y < arg.grid.h; y++){
        for(let x = 0; x < arg.grid.w; x++){
            let current_node = node_grid[y][x];
            if(current_node.isWall) continue;

            //let node_gradient = kernel_min(node_grid, x, y, arg);
            let node_gradient = kernel_f_function(node_grid, x, y, code, arg);
            let angle = p.atan2(node_gradient.y, node_gradient.x) - p.PI/2;
            current_node.vector_angle = angle;
        }
    }
}

function kernel_min(node_grid, x, y, arg){
    let min_dist = Infinity;
    let vector;

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

function kernel_sobel(node_grid, x, y, arg){
    let g_x = 0;
    let g_y = 0;

    for (const neighbor_pos of neighbor_pos_arr) {
        const dx = neighbor_pos[0];
        const dy = neighbor_pos[1];
    
        const neighbor_x = x + dx;
        const neighbor_y = y + dy;
    
        let node_dist;
    
        if (!is_in_grid(neighbor_x, neighbor_y, arg)) {
            node_dist = node_grid[y][x].dist; // Fallback to current node
        } else {
            const current_node = node_grid[neighbor_y][neighbor_x];
            node_dist = current_node.isWall ? node_grid[y][x].dist : current_node.dist;
        }
    
        g_x -= node_dist * sobel_matrix.x[dy + 1][dx + 1];
        g_y -= node_dist * sobel_matrix.y[dy + 1][dx + 1];
    }

    return {x: g_x, y: g_y};
}

function kernel_f_function(node_grid, x, y, math_code, arg){
    let vector = [0, 0];

    for(const neighbor_pos of neighbor_pos_arr){
        const dx = neighbor_pos[0];
        const dy = neighbor_pos[1];
    
        const neighbor_x = x + dx;
        const neighbor_y = y + dy;

        let node_dist;
    
        if (!is_in_grid(neighbor_x, neighbor_y, arg)) {
            node_dist = node_grid[y][x].dist; // Fallback to current node
        } else {
            const current_node = node_grid[neighbor_y][neighbor_x];
            node_dist = current_node.isWall ? node_grid[y][x].dist : current_node.dist;
        }

        node_dist = math_code.evaluate({x : node_dist});
        vector = vector.map((x,i) => x + neighbor_pos[i] * node_dist);
    }

    return {x: vector[0], y: vector[1]};
}