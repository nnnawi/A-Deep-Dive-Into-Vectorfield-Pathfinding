export function gfx_draw_grid(p, gfx, arg){
    gfx.colorMode(p.RGB);
    gfx.stroke(arg.grid.stroke);
    gfx.strokeWeight(arg.grid.stroke_weight);
    
    let x = 0;
    while(x < arg.grid.w){
        gfx.line(x * arg.grid.tile_size, 0, x * arg.grid.tile_size, arg.screen.h);
        x++;
    }

    let y = 0;
    while(y < arg.grid.h){
        gfx.line(0, y * arg.grid.tile_size, arg.screen.w, y * arg.grid.tile_size);
        y++;
    }
}

export function gfx_draw_heatmap(p, gfx, node_grid, target, arg){
    gfx.clear();
    gfx.colorMode(p.HSB);

    for(let y = 0; y < arg.grid.h; y++){
        for(let x = 0; x < arg.grid.w; x++){
            let current_node = node_grid[y][x];
            
            gfx.fill(current_node.display_dist * 10, 255, 100);
            if(current_node.dist == Infinity) gfx.fill(0, 0, 255);
            if(current_node.isWall) gfx.fill(0, 0, 0);

            gfx.rect(
                x * arg.grid.tile_size,
                y * arg.grid.tile_size,
                arg.grid.tile_size,
                arg.grid.tile_size
            )
        }
    }

    gfx.noStroke();
    gfx.fill(0, 0, 0);
    gfx.ellipse((target.x + .5) * arg.grid.tile_size, (target.y + .5) * arg.grid.tile_size, arg.grid.tile_size, arg.grid.tile_size);
}

export function gfx_draw_vectorfield(p, gfx, node_grid, target, arg){
    gfx.clear();

    //gfx.stroke(arg.arrow.stroke, arg.arrow.stroke, arg.arrow.stroke, 100);
    gfx.strokeWeight(arg.arrow.stroke_weight);
    
    gfx.push();
    gfx.colorMode(p.HSB);
    
    p.drawingContext.shadowOffsetX = 0;
    p.drawingContext.shadowOffsetY = 0;
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'gray';
    gfx.translate(arg.grid.tile_size/2, arg.grid.tile_size/2);
    

    for(let y = 0; y < arg.grid.h; y++){
        gfx.push();

        for(let x = 0; x < arg.grid.w; x++){
            let current_node = node_grid[y][x];
        
            if(current_node.isWall || (x == target.x && y == target.y)) {
                gfx.translate(arg.grid.tile_size, 0); 
                continue;
            }

            let dist = current_node.display_dist;
            let angle = current_node.display_vector_angle;
            gfx.push();
            gfx.stroke(0, 0, 255)
            gfx.rotate(angle);
            gfx_draw_arrow(p, gfx, arg)
            gfx.pop();

            gfx.translate(arg.grid.tile_size, 0);
        }
        gfx.pop();
        gfx.translate(0, arg.grid.tile_size);
    }
    gfx.pop();
}

export function gfx_draw_arrow(p, gfx, arg){
    gfx.push();
    gfx.line(0,0,0,arg.arrow.main_len);
    gfx.translate(0,arg.arrow.main_len);
    gfx.push();
    gfx.rotate(-arg.arrow.angle);
    gfx.line(0,0,0,arg.arrow.scd_len);
    gfx.pop();
    gfx.rotate(arg.arrow.angle);
    gfx.line(0,0,0,arg.arrow.scd_len);
    gfx.pop();
}