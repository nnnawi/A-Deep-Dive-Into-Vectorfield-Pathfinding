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

const vf_heatmap_eikonal_sketch = (p, sketch_name) => {

    const arg = {
        screen: {
            w: 720,
            h: 480,
        },
        
        grid : {
            tile_size: 30,
            w: 0,
            h: 0,
            stroke: 100,
            stroke_weight: 1,
        }
    }

    var node_grid;

    var gfx_grid;
    var gfx_heatmap;

    var is_dragging = false;
    var wallpen_state = true;

    var target = {
        x: 0,
        y: 0,
    };

    p.setup = () => {
        let canva = p.createCanvas(arg.screen.w, arg.screen.h);
        canva.parent(sketch_name);

        arg.grid.w = p.floor(arg.screen.w / arg.grid.tile_size);
        arg.grid.h = p.floor(arg.screen.h / arg.grid.tile_size);

        node_grid = new Array(arg.grid.h).fill().map((_,y) => new Array(arg.grid.w).fill().map((_,x) => new node(x, y)));

        gfx_grid = p.createGraphics(arg.screen.w, arg.screen.h);
        gfx_draw_grid(p, gfx_grid, arg);

        gfx_heatmap = p.createGraphics(arg.screen.w, arg.screen.h);
        eikonal_solver(node_grid, target);
    }

    p.draw = () => {
        p.image(gfx_heatmap, 0, 0);
        p.image(gfx_grid, 0, 0);

        for(let y = 0; y < node_grid.length; y++){
            for(let x = 0; x < node_grid[0].length; x++){
                node_grid[y][x].update_display_dist(p, 0.1);
            }
        } 

        gfx_draw_heatmap(p, gfx_heatmap, node_grid, target, arg);
    }

    p.mouseDragged = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > arg.screen.w || p.mouseY < 0 || p.mouseY > arg.screen.h) return;

        let x = p.floor(p.mouseX / arg.grid.tile_size);
        let y = p.floor(p.mouseY / arg.grid.tile_size);

        if(!is_in_grid(x, y, arg)) return;

        let current_node = node_grid[y][x];

        if(!is_dragging){
            wallpen_state = !current_node.isWall;
            is_dragging = true;
        }

        current_node.isWall = wallpen_state;
        reset_node_grid(node_grid);
        eikonal_solver(node_grid, target);
    }

    p.mouseReleased = () => {
        if(is_dragging) is_dragging = false;
    }

    p.mouseMoved = () => {
        // Only respond to mouse events if mouse is over the canvas
        if (p.mouseX < 0 || p.mouseX > arg.screen.w || p.mouseY < 0 || p.mouseY > arg.screen.h) return;
        if (!is_in_screen(p.mouseX, p.mouseY, arg) || true) return;
        let grid_x = p.floor(p.mouseX / arg.grid.tile_size);
        let grid_y = p.floor(p.mouseY / arg.grid.tile_size);
        
        target.x = grid_x;
        target.y = grid_y;
        reset_node_grid(node_grid);
        eikonal_solver(node_grid, target);
    }
}

export default vf_heatmap_eikonal_sketch;