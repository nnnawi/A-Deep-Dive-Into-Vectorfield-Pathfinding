const GRADIENT_STOPS = [
  [0.00, 255, 255, 210],
  [0.15, 255, 230,  50],
  [0.30, 255, 155,   0],
  [0.45, 240,  70,  10],
  [0.60, 190,  10,  50],
  [0.75, 130,   0, 130],
  [0.88,  60,   0, 100],
  [1.00,   0,   0,   0],
];

function gradient_color(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const [t0, r0, g0, b0] = GRADIENT_STOPS[i];
    const [t1, r1, g1, b1] = GRADIENT_STOPS[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return [
        Math.round(r0 + (r1 - r0) * u),
        Math.round(g0 + (g1 - g0) * u),
        Math.round(b0 + (b1 - b0) * u),
      ];
    }
  }
  return [0, 0, 0];
}

export function gfx_draw_grid(p, gfx, arg){
    gfx.colorMode(p.RGB);
    gfx.stroke(arg.grid.stroke);
    gfx.strokeWeight(arg.grid.stroke_weight);
    
    let x = 1;
    while(x < arg.grid.w){
        gfx.line(x * arg.grid.tile_size, 0, x * arg.grid.tile_size, arg.screen.h);
        x++;
    }

    let y = 1;
    while(y < arg.grid.h){
        gfx.line(0, y * arg.grid.tile_size, arg.screen.w, y * arg.grid.tile_size);
        y++;
    }
}

export function gfx_draw_heatmap(p, gfx, node_grid, target, arg, mode = 'hue', colorIntensity = 10){
    gfx.clear();
    
    if (mode === 'hue') {
        gfx.colorMode(p.HSB);
    } else {
        gfx.colorMode(p.RGB);
    }

    for(let y = 0; y < arg.grid.h; y++){
        for(let x = 0; x < arg.grid.w; x++){
            let current_node = node_grid[y][x];
            
            if (current_node.isWall) {
                if (mode === 'hue') {
                    gfx.fill(0);
                } else if (mode === 'gradient') {
                    gfx.fill(20, 70, 200);
                } else {
                    gfx.fill(19, 53, 156);
                }
            } else if (current_node.dist === Infinity) {
                continue;
            } else {
                if (mode === 'hue') {
                    gfx.fill((current_node.display_dist * 5) % 360, 255, 100);
                } else if (mode === 'gradient') {
                    let t = Math.min(current_node.display_dist / colorIntensity, 1);
                    let [r, g, b] = gradient_color(t);
                    gfx.fill(r, g, b);
                } else {
                    let brightness = p.map(current_node.display_dist, 0, colorIntensity, 255, 0);
                    gfx.fill(brightness);
                }
            }

            gfx.rect(
                x * arg.grid.tile_size,
                y * arg.grid.tile_size,
                arg.grid.tile_size,
                arg.grid.tile_size
            )
        }
    }

    gfx.noStroke();
    if (mode === 'hue') {
        gfx.fill(0, 0, 0);
    } else if (mode === 'gradient') {
        gfx.fill(20, 70, 200);
    } else {
        gfx.fill(255, 0, 0);
    }
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