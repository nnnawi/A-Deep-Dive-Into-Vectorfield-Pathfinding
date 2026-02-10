export function reset_node_grid(node_grid){
    for(let y = 0; y < node_grid.length; y++){
        for(let x = 0; x < node_grid[0].length; x++){
            let current_node = node_grid[y][x];

            current_node.dist = 999;
            current_node.wasVisited = false;
        }
    }
}

export function is_in_screen(x, y, arg){
    return x > 0 && x < arg.screen.w && y > 0 && y < arg.screen.h;
}

export function is_in_grid(x, y, arg){
    return x >= 0 && x < arg.grid.w && y >= 0 && y < arg.grid.h;
}

export function angle_lerp(p, a, b, lerpFactor){
    return a + (b - a) * lerpFactor;
}

export function u_angle_lerp(p, a, b, lerpFactor)

{
    let angleDiff = b - a
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    a += angleDiff * lerpFactor;

    // Normalize final angle
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;

    return a
}



