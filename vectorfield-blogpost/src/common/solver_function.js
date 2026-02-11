import { neighbor_pos_arr } from './constant.js';
import { is_in_grid, u_angle_lerp } from './utils_function.js';
export function djisktra_algorithm_step(open_list, node_grid, dist_arr, arg){

    //Find node w/ the minimum distance in the open_list
    let minDistIndex = 0;
    for (let i = 1; i < open_list.length; i++) {
        if (open_list[i].dist < open_list[minDistIndex].dist) {
            minDistIndex = i;
        }
    }
    let current_node = open_list[minDistIndex];

    //Remove this node from the open_list
    open_list.splice(minDistIndex, 1);

    if(current_node.wasVisited) return;
    current_node.wasVisited = true;

    for(const neighbor_pos of neighbor_pos_arr){
        let dx = neighbor_pos[0];
        let dy = neighbor_pos[1];

        let neighbor_x = current_node.x + dx;
        let neighbor_y = current_node.y + dy;


        if(!is_in_grid(neighbor_x, neighbor_y, arg)) continue;

        let neighbor_node = node_grid[neighbor_y][neighbor_x];

        if(neighbor_node.isWall || neighbor_node.wasVisited) continue;

        let new_dist = current_node.dist + dist_arr[dy+1][dx+1];

        if(new_dist < neighbor_node.dist){
            neighbor_node.dist = new_dist;

            let in_open_list = open_list.find(x => x == neighbor_node) == undefined ? false : true;

            if(!in_open_list) open_list.push(neighbor_node);
        }
    }
}

export function djikstra_algorithm(node_grid, target, dist_arr, arg){
    let target_node = node_grid[target.y][target.x];
    target_node.dist = 0;
    let open_list = [target_node];
    
    while(open_list.length > 0){
        djisktra_algorithm_step(open_list, node_grid, dist_arr, arg);
    }
}

export function eikonal_solver(NODE_grid, target, options = {}) {
    const rows = NODE_grid.length;
    const cols = NODE_grid[0].length;
    
    // Default options
    const maxSweeps = options.maxSweeps || 10;
    const speeds = options.speeds || { open: 1, wall: 0 };
    const epsilon = 1e-6; // Small value to compare floating point values
    
    // Initialize distance field with infinity
    const distanceField = Array(rows).fill().map(() => Array(cols).fill(Infinity));
    
    // Set target distance to 0
    distanceField[target.y][target.x] = 0;
    
    // Define speed function - 0 for walls, 1 for open spaces (or custom values)
    function getSpeed(x, y) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return 0; // Out of bounds
        
        const cell = NODE_grid[y][x];
        if (cell.isWall) return speeds.wall;
        return speeds.open;
    }
    
    // Helper function to solve the quadratic equation for one grid point
    function solveEikonalUpdate(i, j) {
        // Skip the target node - it's already set to 0
        if (i === target.y && j === target.x) return 0;
        
        const speed = getSpeed(j, i);
        if (speed === 0) return Infinity; // Wall/obstacle
        
        // Find minimum values from neighbors (using upwind difference)
        let minX = Infinity;
        if (j > 0) minX = Math.min(minX, distanceField[i][j-1]);
        if (j < cols-1) minX = Math.min(minX, distanceField[i][j+1]);
        
        let minY = Infinity;
        if (i > 0) minY = Math.min(minY, distanceField[i-1][j]);
        if (i < rows-1) minY = Math.min(minY, distanceField[i+1][j]);
        
        // Sort them so that minX <= minY
        if (minX > minY) [minX, minY] = [minY, minX];
        
        const h = 1.0; // Grid spacing
        
        // If we have no valid neighbors, we can't update
        if (minX === Infinity) return Infinity;
        
        // If we only have one valid neighbor
        if (minY === Infinity) return minX + h/speed;
        
        // Attempt simple solution first
        const simpleUpdate = minX + h/speed;
        
        // Check if solution satisfies the constraint
        if (simpleUpdate <= minY) return simpleUpdate;
        
        // Solve the full quadratic equation
        // We're solving: (T - minX)² + (T - minY)² = (h/speed)²
        const a = 2;
        const b = -2 * (minX + minY);
        const c = minX*minX + minY*minY - (h/speed)*(h/speed);
        const discriminant = b*b - 4*a*c;
        
        if (discriminant < 0) return Infinity; // No solution
        
        return (-b + Math.sqrt(discriminant)) / (2*a);
    }
    
    // Perform multiple sweeps until convergence
    let hasChanged = true;
    let sweepCount = 0;
    
    while (hasChanged && sweepCount < maxSweeps) {
        hasChanged = false;
        sweepCount++;
        
        // Sweep in all directions to propagate information in every direction
        
        // 1. Top-left to bottom-right
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const newValue = solveEikonalUpdate(i, j);
                if (newValue < distanceField[i][j] - epsilon) { // Use epsilon for floating point comparison
                    distanceField[i][j] = newValue;
                    hasChanged = true;
                }
            }
        }
        
        // 2. Top-right to bottom-left
        for (let i = 0; i < rows; i++) {
            for (let j = cols-1; j >= 0; j--) {
                const newValue = solveEikonalUpdate(i, j);
                if (newValue < distanceField[i][j] - epsilon) {
                    distanceField[i][j] = newValue;
                    hasChanged = true;
                }
            }
        }
        
        // 3. Bottom-left to top-right
        for (let i = rows-1; i >= 0; i--) {
            for (let j = 0; j < cols; j++) {
                const newValue = solveEikonalUpdate(i, j);
                if (newValue < distanceField[i][j] - epsilon) {
                    distanceField[i][j] = newValue;
                    hasChanged = true;
                }
            }
        }
        
        // 4. Bottom-right to top-left
        for (let i = rows-1; i >= 0; i--) {
            for (let j = cols-1; j >= 0; j--) {
                const newValue = solveEikonalUpdate(i, j);
                if (newValue < distanceField[i][j] - epsilon) {
                    distanceField[i][j] = newValue;
                    hasChanged = true;
                }
            }
        }
    }
    
    NODE_grid.map((arr, y) => arr.map((node, x) => node.dist = distanceField[y][x]));
}

export class node {
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

    update_display_dist(p, lerpFactor){
        if(this.isWall) return;
        this.display_dist = p.lerp(this.display_dist, this.dist, lerpFactor);
    }

    update_display_vector_angle(p, lerpFactor){
        if(this.isWall) return;
        this.display_vector_angle = u_angle_lerp(p, this.display_vector_angle, this.vector_angle, lerpFactor); 
    }
}
