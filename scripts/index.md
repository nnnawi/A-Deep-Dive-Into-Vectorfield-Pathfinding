---
layout: layout.njk
title: Vector Field Pathfinding
---

<div style="display: flex; justify-content: center">
    <video autoplay muted loop playsinline style="width: 100%; max-width: 1000px;">
    <source src="assets/videos/Last Comp.mp4" type="video/mp4">
    Your browser does not support the video tag.
    </video>
</div>

# A Deep Dive into Goal-based Vector Field Pathfinding

## Table of Contents

1. [Introduction](#introduction)
2. [What is pathfinding?](#what-is-pathfinding)
   - [Defining the problem](#defining-the-problem)
   - [Setting up our pathfinding environment](#setting-up-our-pathfinding-environment)
   - [The plural applications of pathfinding](#the-plural-applications-of-pathfinding)
3. [Overview of Dijkstra algorithm](#overview-of-djikstra-algorithm)
   - [Initialisation](#initialisation)
   - [Main loop](#main-loop)
   - [Neighbor Evaluation & Distance Update](#neighbor-evaluation--distance-update-relaxation)
   - [Dijkstra algorithm pseudo-code and implementation example](#djikstra-algorithm-pseudo-code-and-implementation-example)
4. [How to construct Vectorfield Pathfinding](#how-to-construct-vectorfield-pathfinding)
   - [Step 1: Building the grid/graph heatmap](#step---1--building-the-gridgraph-heatmap)
     - [Using the Dijkstra algorithm](#using-the-djisktra-algorithm)
     - [Using the Eikonal equation](#using-the-eikonal-equation)
   - [Step 2: Building the vectorfield](#step---2--building-the-vectorfield)
     - [Using the Sobel-operator](#using-the-sobel-operator)
     - [Using the minimum distance neighbor direction](#using-the-minimum-distance-neighbor-direction)
     - [Using the function weighted neighbor sum method](#using-the-function-weighted-neighbor-sum-method)

## Introduction

Back in 2018, while building a clone of the Wii Play [tank game](https://nintendo.fandom.com/wiki/Tanks!) ,  I ran into my first real pathfinding challenge. I needed a way for multiple enemy agents to chase the player around while dodging walls. After digging into the topic, I came across goal-based vector pathfinding (or just Vector Field Pathfinding - VFP). And it just clicked - it did exactly what I needed, but in a way that felt more visual & intuitive than A\* or Dijkstra. I liked it so much that I even made a video about it in 2020 — just to share how cool and practical this approach really is.

<iframe 
  width="560" 
  height="315" 
    src="https://www.youtube.com/embed/ZJZu3zLMYAc?start=1" 
  title="YouTube video player" 
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
  allowfullscreen>
</iframe>

The video ended up doing very well for a niche subject! It sparked a lot of great discussions in the comments — people sharing alternative approaches, asking smart questions, or diving deeper into the method. 

But looking back, my younger self definitely made a few mistakes. There were some unverified claims, oversimplified explanations, and a lot I just didn’t know back then. Now, more than six years later, I finally decided to revisit this topic — something I’d been wanting to do for a long time, especially as the comments kept rolling in over the years.

That’s what this blogpost is: a deep dive into vector field pathfinding. How it works, where it fits in the broader landscape of pathfinding algorithms, the many ways you can build and tweak it to fit different needs, and when it really shines compared to more classic approaches.

## What is pathfinding ?

Before jumping straight into VFP (Vector Field Pathfinding), it’s worth taking a moment to remind ourselves **what pathfinding really is ?**—where it comes from, and why it exists in the first place.

### Defining the problem _(a bit of graph theory)_:

At its core, pathfinding is a **graph theory** problem. A graph consists of a set of **vertices** $V$ connected by a set of **edges** $E$ _(ie. pairs of vertices)_.
Graphs can also be weighted, meaning each edge has an associated value _(or weight)_ that can represent **a distance, a cost, or any other metrics**.

<div style="display: flex; justify-content: center">
    <div style="display: flex; flex-direction: row; align-items: center; gap: 1rem;">
        <div>
            $$
            \begin{align*}
            &\text{Let } G = (V,E) \text{ be a graph with:} \\[10pt]
            & \quad V = \text{Set of Vertices} = \{X_1, X_2, X_3, X_4, X_5 \} \\[10pt]
            & \quad E = \text{Set of Edges} = \{
                (X_1,X_4),
                (X_1,X_3), \\
                & \qquad (X_1,X_5),
                (X_5,X_3),
                ...
            \}
            \end{align*}
            $$
        </div>
        <div style="display: flex; flex-direction: column; align-items: center"> 
            <div id="interactive_graph_canva"></div>
            <span> A graphic representation of $G$ </span>
        </div>
    </div>
</div>

We can thus define **pathfinding** as finding the **shortest path between two vertices of a graph**,
or more precisely the path $P^*$ between two vertices $A, B \in V$ of a graph $G = (V,E)$ such that the sum of the weights of its constituent edges is minimized.

<div style="display: flex; justify-content: center">
    <div style="display: flex; flex-direction: row; align-items: center">
        <div style="display: flex; flex-direction: column"> 
            <span>
            $$
            P^* = \arg\min_{P \in \mathcal{P}(A, B)} \sum_{(x, y) \in P} w(x, y)
            $$
            </span>
            <div style="font-size: 14px">
            $$
            \begin{align*}
            &\text{Where : }\\[7pt]
            & \quad \mathcal{P}(A,B) = \text{set of all possible paths from A to B}\\[3pt]
            & \quad P = \text{a path from A to B } \text{(defined as a set of edges)}\\[3pt]
            & \quad (x,y) = \text{an edge defined by its two constituent nodes.}\\[3pt]
            & \quad w(x,y) = \text{weight of the $(x,y)$ edge.}
            \end{align*}
            $$
            </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center"> 
            <div id="interactive_graph_djikstra_canva"></div>
            <span> Hover over any node to see its shortest path to $X_2$ </span>
        </div>
    </div>
</div>

### Setting up our pathfinding environment :

In this post, we'll explore a specific type of graph: the **8-neighbor grid graph**, _(also known as a [King's graph](https://en.wikipedia.org/wiki/King%27s_graph))_.
We can think of it as **a 2D grid** where each tile connects to all 8 surrounding neighbors—like how a king moves in chess.

This graph is undirected, meaning connections flow both ways between tiles and
each connection (edge) carries **a weight determined by a distance kernel**—a predefined matrix that might, for instance, make diagonal connections stronger than horizontal or vertical ones.

<div style="display: flex; justify-content: center">
    <div style="display: flex; flex-direction: column; align-items: center"> 
        <div id="graph_grid_relation_canva"></div>
        <span> Equivalence between 2D grid & Underlying graph (Interactive visual) </span>
    </div>
</div>

With our 2D grid in place, we can now define which tiles are **walkable** and which act as **walls**.
In graph terms, walkable tiles stay as nodes while walls are simply removed from the graph entirely.

The **8-neighbor grid graph approach** provides a **universal way to discretize any 2D space** and apply pathfinding—_whether for robotic, video games, etc..._
Therefore finding the shortest path between two tiles while avoiding walls becomes finding the shortest path between two vertices in our modified graph.

### The plural applications of pathfinding :

As simple as this problem may seem, it yielded very clever algorithm to solve it as well as a lot of relevant and plural applications :

<div style="display: flex; justify-content: center; padding: 40px 0px">
        <div style="display: flex; flex-direction: row; column-gap: 30px">
            <div class="image-container">
                <img src="assets/images/pdf/image_paper_pdf.jpg" style="height: 340px; width: auto" class="gallery-image">
                <h3 class="image-title">Image Paper</h3>
            </div>
            <div class="image-container">
                <img src="assets/images/pdf/robot_paper_pdf.jpg" style="height: 340px; width: auto" class="gallery-image">
                <h3 class="image-title">Robot Paper</h3>
            </div>
            <div class="image-container">
                <img src="assets/images/pdf/videogame_paper_pdf.jpg" style="height: 340px; width: auto" class="gallery-image">
                <h3 class="image-title">Video Game Paper</h3>
            </div>
        </div>
    </div>

## Overview of Djikstra algorithm

If you are already familiar with classic pathfinding algorithm, you can skip directly to VFP implementation. If not, it’s helpful to review one of the most well-known and foundational pathfinding algorithms: **Dijkstra’s algorithm**. Understanding how Dijkstra’s algorithm works provides **a solid framework** for the general steps involved in any pathfinding method.

Vector field pathfinding builds directly on each of these steps, which is why we begin our study here. Similarly, algorithms like $A^\star$ also extend Dijkstra’s approach, though they serve different purposes.

### Initialisation

The algorithm starts by preparing each node. All nodes are given **a tentative distance** _(to the starting node)_ of infinity _(ie. $\text{dist}[v] = \infty$)_, reflecting that we don’t yet know how to reach them. The $\text{previous}[v]$ value is also initialized to $\text{undefined}$ — this will let us **retrace the shortest path** later. The starting node _(or $\text{source}$)_ is given a distance of $0$, since it’s the point of origin.

All nodes are placed in a set $Q$, which represents the **pool of nodes we still need to process.**

<div class="algorithm-content" style="font-size: 14px; padding: 10px 0px;">
$$
\begin{array}{l}
\textbf{Djikstra algorithm initialisation (Pseudo-code)} \\ 
\hline \\
\begin{aligned}
&\quad \textbf{for each } \text{vertex } v \text{ in Graph}: \quad \textcolor{gray}{\text{// Initialization}} \\
&\quad \quad \text{dist}[v] = \infty \quad \textcolor{gray}{\text{// Initial distance from source to vertex } v \text{ is set to infinite}} \\
&\quad \quad \text{previous}[v] = \text{undefined} \quad \textcolor{gray}{\text{// Previous node in optimal path from source}} \\
&\quad \text{dist}[\text{source}] = 0 \quad \textcolor{gray}{\text{// Distance from source to source}} \\
&\quad Q = \text{the set of all nodes in Graph} \quad \textcolor{gray}{\text{// all nodes in the graph are unoptimized - thus are in } Q}
\end{aligned}
\end{array}
$$
</div>

### Main loop

The main loop **runs as long as there are nodes in $Q$**, the set of unvisited nodes. This ensures that we eventually visit all nodes in the graph, allowing us to compute the shortest path from the source to every other node. Intuitively, this loop mimics the **spreading of information outward** from the source.

<div class="algorithm-content" style="font-size: 14px; padding: 10px 0px">
$$
\begin{array}{l}
\textbf{Djikstra algorithm main loop (Pseudo-code)} \\ 
\hline \\
\begin{aligned}
&\quad \textbf{while } Q \textbf{ is not empty}: \quad \textcolor{gray}{\text{// main loop}} \\
&\quad \quad u = \text{node in } Q \text{ with smallest dist}[\cdot] \\
&\quad \quad\text{remove } u \text{ from } Q \\
&\quad \quad\textbf{for each } \text{neighbor } v \text{ of } u: \quad \textcolor{gray}{\text{// where } v \text{ has not yet been removed from } Q.} \\
&\quad \quad \quad \dots
\end{aligned}
\end{array}
$$
</div>

At each iteration, we select the node $u$ with the smallest tentative distance — _the most promising frontier_ — and examine its neighbors. Choosing the closest node first ensures that the search expands gradually across the graph, like a wave, refining distance estimates as it reaches new areas.

The selected node is then removed from $Q$, marking it as processed.

#### Neighbor Evaluation & Distance Update (Relaxation)

For the selected node u, we look at **each of its neighbors $v$** and we calculate **a new tentative distance $\text{alt}$** for each of them. If $\text{alt}$ is shorter than $\text{dist}[v]$, we update it — this is the relaxation step. At the same time, we record $u$ as the previous node that leads to $v$ on the current best-known path.

<div class="algorithm-content" style="font-size: 14px">
$$
\begin{array}{l}
\textbf{Djikstra Neighbor Evaluation & Distance Update (Pseudo-code)} \\ 
\hline \\
\begin{align}
&\quad  \textbf{for each } \text{neighbor } v \text{ of } u: \quad \textcolor{gray}{\text{// where } v \text{ has not yet been removed from } Q.} \\
&\quad \quad \text{alt} = \text{dist}[u] + \text{dist_between}(u, v) \\
&\quad \quad \textbf{if } \text{alt} < \text{dist}[v] \quad \textcolor{gray}{\text{// Relax } (u,v)} \\
&\quad \quad \quad \text{dist}[v] = \text{alt} \\
&\quad \quad \quad \text{previous}[v] = u \\
\end{align}
\end{array}
$$
</div>

This process essentially spreads a “wavefront” of shortest distances to the source across the graph, updating nodes as more efficient paths are discovered.

### Djikstra algorithm pseudo-code and implementation example :

Here’s the full pseudo-code for this version of Dijkstra’s algorithm, along with a plain JavaScript implementation.
Since we’re working with an 8-neighbor grid, the graph is stored as a 2D array where each cell is a Node object—a custom class built for this project.
Of course, this is just one way to represent a graph in code. Other common formats include adjacency matrices or adjacency lists for instance, depending on the problem’s needs and the kind of operations you want to optimize for.

<div class="algorithm-content" style="font-size: 14px">
$$
\begin{align}
&\textbf{function } \text{Dijkstra}(\text{Graph}, \text{source}): \\
&\quad \textbf{for each } \text{vertex } v \text{ in Graph}: \quad \textcolor{gray}{\text{// Initialization}} \\
&\quad \quad \text{dist}[v] = \infty \quad \textcolor{gray}{\text{// initial distance from source to vertex } v \text{ is set to infinite}} \\
&\quad \quad \text{previous}[v] = \text{undefined} \quad \textcolor{gray}{\text{// Previous node in optimal path from source}} \\
&\quad \text{dist}[\text{source}] = 0 \quad \textcolor{gray}{\text{// Distance from source to source}} \\
&\quad Q = \text{the set of all nodes in Graph} \quad \textcolor{gray}{\text{// all nodes in the graph are unoptimized - thus are in } Q} \\
&\quad \textbf{while } Q \textbf{ is not empty}: \quad \textcolor{gray}{\text{// main loop}} \\
&\quad \quad u = \text{node in } Q \text{ with smallest dist}[\cdot] \\
&\quad \quad \text{remove } u \text{ from } Q \\
&\quad \quad \textbf{for each } \text{neighbor } v \text{ of } u: \quad \textcolor{gray}{\text{// where } v \text{ has not yet been removed from } Q.} \\
&\quad \quad \quad \text{alt} = \text{dist}[u] + \text{dist_between}(u, v) \\
&\quad \quad \quad \textbf{if } \text{alt} < \text{dist}[v] \quad \textcolor{gray}{\text{// Relax } (u,v)} \\
&\quad \quad \quad \quad \text{dist}[v] = \text{alt} \\
&\quad \quad \quad \quad \text{previous}[v] = u \\
&\quad \textbf{return } \text{previous}[ \;]
\end{align}
$$
</div>

Note that I refer to this version of Dijkstra’s algorithm because many variations exist. I chose this one because it’s one of the simplest to follow and understand, especially in the context of grid-based pathfinding. That said, Dijkstra’s algorithm can be implemented in much more efficient ways—like using a Fibonacci heap to improve time complexity, which is especially useful on sparse graphs (even if that’s not quite our case here).

Another thing worth mentioning is that this version runs until all nodes are visited. But in practice, if you’re only interested in the path to a specific target node, you can stop the algorithm as soon as that target is reached. Also, while we start here by filling the queue with all nodes from the beginning, there’s a common variation where you start with just the source node. If you go that route, just make sure to add neighboring nodes to the queue as you visit them—since they won’t be preloaded like in this version.

```js
class Particle {
  constructor(x, y, isWall = false) {
    this.x = x;
    this.y = y;
    this.isWall = isWall;
    this.distance = Infinity;
    this.previous = null;
  }
}

function dijkstra(grid, start, distanceKernel) {
  const rows = grid.length;
  const cols = grid[0].length;

  // Map direction offsets to kernel indices (3x3 matrix centered at [1][1])
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  start.distance = 0;

  const Q = [];
  for (let row of grid) {
    for (let node of row) {
      Q.push(node);
    }
  }

  while (Q.length > 0) {
    Q.sort((a, b) => a.distance - b.distance);
    const u = Q.shift();
    if (u.isWall) continue;

    for (let [dx, dy] of directions) {
      const nx = u.x + dx;
      const ny = u.y + dy;

      if (nx < 0 || ny < 0 || nx >= rows || ny >= cols) continue;

      const neighbor = grid[nx][ny];
      if (neighbor.isWall) continue;

      const kernelX = dx + 1;
      const kernelY = dy + 1;
      const weight = distanceKernel[kernelX][kernelY];

      const alt = u.distance + weight;

      if (alt < neighbor.distance) {
        neighbor.distance = alt;
        neighbor.previous = u;
      }
    }
  }

  return grid;
}
```

<div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <button id="startBtn" style="padding: 5px 10px;">Start Dijkstra Algorithm</button>
        <button id="mouseModeBtn" style="padding: 5px 10px;">Toggle Free Mouse Mode</button>
    </div>
<div id="grid_djikstra_animation_canva"></div>

## How to construct Vectorfield Pathfinding

As mentioned earlier, vectorfield pathfinding builds directly on the Dijkstra algorithm. It reuses the two fundamental steps of Dijkstra’s method to perform pathfinding on a grid or graph with obstacles:

- Generate a distance heatmap of the grid — that is, assign to each tile the length of the shortest path to the target node.

- Reconstruct the shortest path from any tile by following this distance information.

The key innovation in vectorfield pathfinding lies in how the second step is interpreted. Instead of tracing paths explicitly, the algorithm assigns a vector (a 2D arrow) to each tile, pointing in the direction of the next step along the shortest path toward the target. This results in a “vector field” that intuitively guides movement across the grid.

We’ll later see that even the first step — building the heatmap — can be adapted in vectorfield pathfinding. This opens the door to greater control and customization, allowing the algorithm to be tailored to specific constraints or use cases.

### Step - 1 : Building the grid/graph heatmap :

#### Using the Djisktra algorithm

The first step of Vectorfield Pathfinding (VFP) is to build a distance heatmap — a mapping that assigns to each tile the length of the shortest path to the target node. To compute this heatmap, we can use a modified version of Dijkstra’s algorithm that propagates distance values outward from the target node, taking walls or obstacles into account. However, unlike the original Dijkstra algorithm, this version does not store the previous node for each tile, since we don’t need to explicitly reconstruct paths.

**ADD PSEUDO-CODE**

<div id='vf_heatmap_distance_matrix_canva'> </div>

<div class="controls">
    <div class="distance-controls">
        <label>
            <input type="radio" name="distance" value="Manhattan" checked> Manhattan
        </label>
        <label>
            <input type="radio" name="distance" value="Euclidian"> Euclidian
        </label>
        <label>
            <input type="radio" name="distance" value="Tchebishev"> Tchebyshev
        </label>
    </div>
    <div class="dynamic-target-control">
        <label>
            <input type="checkbox" id="dynamic-target-toggle"> Dynamic Target Node
        </label>
    </div>
</div>

We can visually represent this heatmap by assigning a given color to a tile, determined by the "real-distance" of this tile to the target as you can see with the animation above.

One important customization at this stage involves the choice of distance kernel. As mentioned earlier, the distances between a node and its eight neighbors are determined by a kernel or weight matrix. By selecting different distance matrices, we can control how distances are accumulated — which directly affects the shape of the heatmap and the resulting behavior of the pathfinding. (See above).

#### Using the Eikonal equation

Another way to compute the distance heatmap on a 2D grid with walls is by solving the Eikonal Equation. When I first made a video about Vector Field Pathfinding (VFP), I didn’t know about this method—but after discovering it, I found it so elegant and intuitive that I had to share it.

Another way to obtain the distance heatmap of a given 2D grid populated with walls is by solving the Eikonal Equation. When I first made a video about VFP, I was unaware of this method but I now found it so elegant and intuitive that I had to share it.

For a bit of context the Eikonal equation is originally a non-linear partial differential equation that helps models how a wavefront propagates through a medium with varying properties.
Intuitively we can think of it as the equation that computes the shortest travel time or minimum distance from a source point to every other point in a domain, taking into account varying speeds or costs throughout the space. It answers the fundamental question: "What's the fastest way to get from here to there?".

$$
|\nabla T(x)| = \frac{1}{F(x)}
$$

With :

- $T(x)$ is the travel time function (what we seek)
- $F(x)$ is the speed function (how fast you can travel at postion $x$)
- $|\nabla T(x)|$ is the magnitude of the gradient of $T(x)$

In our case, we define the source by setting the initial condition: $T(\text{source}) = 0$

We also define the speed function $F(x)$ as follows:

- $F(x) = 0$ if the node $x$ is a wall (i.e., not walkable)
- $F(x) = 1$ if the node $x$ is walkable

With these settings, computing the distance heatmap reduces to solving the Eikonal equation over the grid domain. To do this efficiently, we can use a numerical solver like the Fast Sweeping Method (FSM).

<div id='vf_heatmap_eikonal_canva'></div>
The eikonal equation offers a continuous alternative to Dijkstra’s algorithm for heatmap generation—though it’s originally from a different field and wasn’t designed for graph problems.

Because it’s continuous, the eikonal solver produces smooth, floating-point distance values, unlike Dijkstra, which gives discrete steps. In the eikonal model, the wavefront spreads out in a circular pattern, like a ripple in water. In contrast, Dijkstra’s wavefront can look square, diamond-shaped, or roughly round depending on the distance kernel used. This makes the eikonal approach appealing: it gives a more natural, physics-inspired result with smoother, more organic heatmaps and fewer artifacts compared to Dijkstra-based methods.

### Step - 2 : Building the vectorfield

Once we’ve generated the distance heatmap, the next step is to compute the vector field — a map that assigns to each grid cell a direction pointing toward the shortest path to the target. In other words, it tells an agent standing on any tile which way to go to reach the goal as quickly as possible.

But how do we do that? How do we compute the vector field from the distance heatmap? The key lies in computing the gradient of the heatmap.

Since our heatmap is defined over a 2D grid, computing its gradient gives us a 2D vector at each point. This vector describes how fast and in which direction the heatmap’s values increase around that point — in other words, the direction of steepest ascent. This comes directly from the definition of the gradient: in a scalar field, the gradient points toward the direction of the fastest increase in value.

Now here’s the clever part: since our heatmap stores distances to the target, the gradient tells us where the distance increases the most — so going against that direction leads us along the path where the distance decreases the fastest, i.e., the shortest path to the target.

So for each point on the grid, the gradient gives us a direction — and we turn that into a vector. By normalizing it (so that all vectors have the same length), we get a consistent, direction-only field that an agent can follow step-by-step to reach the goal as efficiently as possible.

So by simply following these vectors, an agent can continuously make locally optimal decisions that guide it along a globally efficient route. This approach transforms the scalar heatmap into a powerful navigational tool, usable even in dynamic or complex environments.

#### Using the Sobel-operator :

One effective way to compute the gradient of the distance heatmap — and thus derive the vector field — is to use a classic image processing tool: the Sobel operator. Originally designed to detect edges in images, the Sobel operator highlights regions with sharp changes in intensity, which correspond to areas with a strong gradient. While its original purpose was edge detection, we can repurpose it here to estimate the direction of steepest descent across the grid.

The Sobel operator consists of two small convolution kernels (or matrices): one estimates the gradient in the x-direction, and the other estimates it in the y-direction. When we apply these filters to our heatmap (which is just a 2D grid of values), we obtain for each tile two values:

- $G_x$: the local rate of change in the horizontal direction,
- $G_y$: the local rate of change in the vertical direction.

To understand how it works on a practical level, imagine we’re applying the Sobel operator to a specific tile in the grid. We look at the 3×3 neighborhood around that tile — including the tile itself and its 8 immediate neighbors. For each of these 9 positions, we take its heatmap value and multiply it by the corresponding coefficient in the Sobel matrix. We do this separately for the horizontal (x) and vertical (y) matrices. Once we sum up these products, we get two numbers: $G_x$ and $G_y$, which represent the estimated gradient in each direction at that tile.

These two components together define the gradient vector at that point. Now, to extract the orientation of the gradient, we use the arctangent function:

$$\theta = \text{atan2}(G_y, G_x)$$

This gives us the angle \theta, which represents the direction in which the heatmap increases the fastest. But remember — our goal is to reach the target, which lies in the direction where the distance decreases the fastest. So, we simply flip the direction by adding \pi:

$$\theta\_{\text{final}} = \theta + \pi$$

From this angle, we can easily construct a unit vector (i.e., a vector of length 1) pointing in that direction:

$$
\vec{v} =
\begin{bmatrix}
\cos(\theta*{\text{final}}),\\
\sin(\theta*{\text{final}})
\end{bmatrix}
$$

Doing this for every tile on the grid gives us the full vector field: a smooth, direction-only map that guides agents step-by-step toward the goal, following the shortest possible path based on the heatmap.

<div id="vf_sobel_canva"></div>

### Using the minimum distance neighbor direction :

A simpler — yet surprisingly effective — method to derive the vector field from the distance heatmap skips convolution and gradients altogether. Instead, it relies on a straightforward observation: the next step toward the goal is always the neighbor with the lowest distance value.

Here’s how it works: for each tile on the grid, we look at its 8-connected neighbors (those directly adjacent in all directions, including diagonals). Among these, we find the neighbor with the lowest distance value on the heatmap — that is, the one closest to the goal. We then draw a vector from the current tile to that neighbor. This vector becomes the local direction for that tile in the vector field.

But why does this work?

Well, think back to how we defined the vector field in the first place — as being aligned with the direction of steepest descent on the distance heatmap. In a continuous space, we found this by computing the gradient of the heatmap and pointing in the opposite direction. But in our grid-based world, we’re working with discrete tiles and a finite number of directions. So instead of estimating the gradient with derivatives, we estimate it by simply comparing neighboring values.

When we move toward the neighbor with the smallest value, we’re essentially making the locally steepest step down the distance heatmap — a discrete approximation of following the negative gradient. It’s a cruder method than the Sobel operator, but in practice, it captures the same principle: move in the direction that decreases distance the fastest.

This method is easy to implement, efficient to compute, and often good enough to produce smooth and accurate path guidance, especially when the grid is dense enough.

The interactive demo below shows this method in action. Move your mouse to relocate the target node, and drag to draw or erase walls. Each arrow points from a tile directly toward its neighbor with the lowest distance value. Notice how the resulting vector field naturally guides movement toward the goal while avoiding obstacles.

<div id='min_neighbor_vf_canva'></div>

### Using the function weighted neighbor sum method :

Years ago, while exploring vector field pathfinding, I found the usual “minimum neighbor” method a bit too rigid. It always pointed in one of eight directions — clean, yes, but lacking nuance. I wanted something smoother, something that could reflect more subtle gradients without needing advanced filters or convolution. That’s when I devised what I now call the Weighted Neighbor Sum method. Let me explain how it works.

For any given tile, look at its eight neighbors. From the tile to each neighbor, define a unit vector — these represent all the possible local directions. The key idea is to weight each of these eight vectors not equally, but according to the neighbor’s value in the distance heatmap. Specifically, the weight should come from a decreasing function of the distance — something like -x, -x², or 1/x. The lower the distance (i.e., the closer to the goal), the higher the influence that neighbor exerts.

Next, sum all eight of these weighted vectors. This produces a kind of local average direction — but one that heavily favors movement toward neighbors with lower distances. Finally, normalize the resulting vector to get a clean unit direction for the field.

Why does this work? It serves as a discrete approximation of the gradient's opposite — pointing in the direction of steepest descent. The decreasing function sharpens this effect, pulling more strongly toward lower-cost paths and naturally shaping the vector field to flow downhill. While it doesn't compute derivatives explicitly like the Sobel operator, it captures the essence of gradient behavior through a purely geometric and local mechanism.

The interactive demo below demonstrates this method. Move your mouse to relocate the target, and drag to draw or erase walls. You can switch between different weighting functions to see how they affect the resulting vector field:

- **$-\log(x + 1)$**: Logarithmic weighting (default) - provides smooth, balanced results
- **$-x$**: Linear weighting - simple and straightforward
- **$-x^2$**: Quadratic weighting - stronger preference for closer neighbors
- **$1/x$**: Inverse weighting - very strong preference for nearest neighbors

Notice how the vectors become smoother and more nuanced compared to the minimum neighbor method, as each direction is influenced by multiple neighbors rather than just the single closest one.

<div class="controls">
    <div class="weight-function-controls">
        <label>
            <input type="radio" name="weight_function" value="-log(x + 1)" checked> -log(x + 1)
        </label>
        <label>
            <input type="radio" name="weight_function" value="-x"> -x
        </label>
        <label>
            <input type="radio" name="weight_function" value="-x*x"> -x²
        </label>
        <label>
            <input type="radio" name="weight_function" value="1/x"> 1/x
        </label>
    </div>
</div>

<div id='weighted_neighbor_vf_canva'></div>

## Agent Motion Over a Vector Field

Once the vector field has been computed, guiding an agent becomes straightforward. The grid contains a 2D vector at each cell that points toward the goal. At each frame, the agent reads the vector beneath its feet and uses it to update its position.

Let the agent’s current position be $p = (x, y)$, and let the vector field at that position be v(p). The agent’s motion equation is:

$$\mathbf{p}_{t+1} = \mathbf{p}_t + s \cdot \mathbf{v}(\lfloor \mathbf{p}_t \rfloor)$$

Where:
-	$\mathbf{p}_t$ is the agent’s current position (a float, not an integer),
-	$\lfloor \mathbf{p}_t \rfloor$ maps to the current tile in the grid,
-	$\mathbf{v}(\lfloor \mathbf{p}_t \rfloor)$ is the normalized vector stored in the tile,
-	$s$ is a scalar representing the agent’s speed per time step.

This yields basic motion that aligns the agent with the vector field.

### Velocity Smoothing with LERP

To avoid jittery or abrupt changes in direction when crossing from one tile to another, you can smooth the velocity using linear interpolation (LERP). Instead of directly applying the grid vector as velocity, define a target velocity and smoothly interpolate toward it:
$$
\mathbf{v}{\text{target}} = \mathbf{v}(\lfloor \mathbf{p}t \rfloor) \\
\mathbf{v}{t+1} = \text{lerp}(\mathbf{v}t, \mathbf{v}{\text{target}}, \alpha) \\
\mathbf{p}{t+1} = \mathbf{p}t + s \cdot \mathbf{v}{t+1}
$$
Where $\alpha \in [0, 1]$ controls smoothing — low $\alpha$ yields slower turning, high $\alpha$ makes the agent more responsive.

The interactive demo below shows both approaches in action. Ten white agents navigate the vector field toward the moving target. You can:

- **Toggle between Normal and LERP motion** to see the difference in smoothness
- **Adjust agent speed** using the slider to observe how different velocities affect pathfinding behavior
- **Move your mouse** to relocate the target and watch agents adapt their paths
- **Drag** to draw or erase walls and see how agents navigate around obstacles

Notice how LERP motion produces smoother, more natural-looking trajectories, while normal motion can appear more direct but jittery when crossing tile boundaries. The vector field is computed using the Sobel operator with a Euclidean distance kernel.

<div class="controls">
    <div class="agent-controls" style="display: flex; flex-direction: column; gap: 10px; margin: 10px 0;">
        <div style="display: flex; gap: 20px; align-items: center;">
            <div>
                <strong>Motion Type:</strong>
                <label style="margin-left: 10px;">
                    <input type="radio" name="agent_lerp" value="normal" checked> Normal
                </label>
                <label style="margin-left: 10px;">
                    <input type="radio" name="agent_lerp" value="lerp"> LERP
                </label>
            </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <strong>Agent Speed:</strong>
            <input type="range" id="agent-speed-slider" min="0.5" max="5" step="0.1" value="2.0" style="width: 200px;">
            <span id="agent-speed-value">2.0</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <strong>Number of Particles:</strong>
            <input type="range" id="agent-count-slider" min="1" max="40" step="1" value="10" style="width: 200px;">
            <span id="agent-count-value">10</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <strong>LERP Alpha:</strong>
            <input type="range" id="agent-lerp-alpha-slider" min="0.01" max="1" step="0.01" value="0.15" style="width: 200px;">
            <span id="agent-lerp-alpha-value">0.15</span>
        </div>
    </div>
</div>

<div id='agent_motion_canva'></div>

## Local Limitations and Edge Cases in Vector Field Computation

When computing a vector field for pathfinding, two major types of edge cases arise: grid boundaries and walls in neighbor positions. Both situations present the same core issue: some of the 8-connected neighbors used to compute a vector may either be out of bounds or non-walkable. This becomes especially problematic when using methods like Sobel gradient or weighted neighbor vector summation, which depend on aggregating information from all neighbors.

The difficulty is that walls and out-of-bound cells either lack a meaningful distance value or distort the local gradient. Ignoring them leads to undefined behavior (e.g., division by zero or null vectors), and assigning them arbitrary values often causes the resulting vector to point toward or directly into the wall or grid edge. This may lead to path-following artifacts like jitter, backtracking, or agents getting stuck in corners.

A practical fallback solution — although not theoretically grounded at first glance — is to assign out-of-bound or wall neighbors the same distance value as the current node. This flattens the local gradient and avoids introducing artificial directionality. Intuitively, it creates a “neutral slope” at the problematic boundary, allowing surrounding vectors to guide the direction. The resulting vector field is smoother, naturally diverges from impassable walls and edges, and helps agents follow walls or slide along boundaries without getting trapped.

Why does this work? By assigning the same distance value to invalid neighbors, we effectively remove their influence from the directional gradient. For gradient-based methods like Sobel or weighted sum, this avoids introducing false minima or maxima and lets the vector field be shaped primarily by valid walkable neighbors. The fallback rule doesn’t add new information — it just ensures invalid points don’t skew the result.

Alternatively, a more robust approach is to use the minNeighbor method for these edge cases. Since it doesn’t compute a weighted sum or derivative, but instead selects the neighbor with the lowest distance and points toward it, it handles walls and out-of-bounds naturally: any invalid neighbor is simply excluded from consideration. This ensures correctness without the need for fallback values. Since the method only looks at valid neighbors, it’s inherently more resistant to edge distortions and works well for tiles bordering walls or edges.

## Visualizing the Sobel Operator on Distance Heatmaps

To better understand how the Sobel operator extracts directional information from a distance heatmap, we can visualize its intermediate results. The interactive demo below shows a 15×15 grid with a target node (red dot) in the bottom-right corner and a vertical wall obstacle in the middle. The distance heatmap is computed using Dijkstra's algorithm.

You can switch between different visualization modes to see:

- **Original**: The raw distance heatmap, with tiles shaded from light gray (distance 1) to black (distance 40)
- **Sobel Horizontal**: The horizontal gradient $G_x$, showing how distance changes in the x-direction
- **Sobel Vertical**: The vertical gradient $G_y$, showing how distance changes in the y-direction
- **Sobel Magnitude**: The gradient magnitude $\sqrt{G_x^2 + G_y^2}$, representing the strength of the distance change
- **Sobel Orientation**: The gradient direction $\text{atan2}(G_y, G_x)$ visualized using hue (0-360°), showing which way the gradient points

This visualization helps illustrate how the Sobel operator transforms a scalar distance field into directional information that can guide pathfinding agents toward their goal.

<div id="eikonal_spreading_animation_canva">

</div>
