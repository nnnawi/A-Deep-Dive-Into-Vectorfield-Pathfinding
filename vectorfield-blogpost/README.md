# Vector Field Pathfinding Blog

An interactive blog post built with Astro, featuring markdown content with LaTeX equations and interactive p5.js visualizations.

## Project Structure

```
vectorfield-blogpost/
├── src/
│   ├── components/          # Reusable components
│   │   ├── VectorFieldVisualization.astro
│   │   ├── WaveSimulation.astro
│   │   ├── PathfindingDemo.astro
│   │   └── MathExamples.mdx
│   ├── layouts/
│   │   └── Layout.astro     # Base layout with custom fonts
│   └── pages/
│       └── index.astro      # Main blog post page
├── astro.config.mjs         # Astro config with MDX and math support
└── package.json
```

## Features

### 1. Custom Typography

- **Body text**: Merriweather (serif) for comfortable reading
- **Headings**: Inter (sans-serif) for modern, clean headers
- **Font size**: 18px base for optimal readability

### 2. LaTeX Math Support

Write inline math with single dollar signs:

```markdown
The equation $E = mc^2$ shows the relationship...
```

Write display equations with double dollar signs:

```markdown
$$
\mathbf{F}(x, y) = P(x,y)\mathbf{i} + Q(x,y)\mathbf{j}
$$
```

### 3. Interactive p5.js Components

Each visualization is a self-contained Astro component with:

- p5.js canvas for rendering
- Interactive controls (sliders, checkboxes)
- Responsive layout

## Creating New p5.js Components

Here's the pattern for creating interactive visualizations:

### Component Structure

```astro
---
// Component props
const { title = 'My Visualization' } = Astro.props;
---

<div class="p5-component">
  <h3>{title}</h3>
  <div class="p5-container">
    <!-- Controls sidebar -->
    <div class="controls">
      <div class="control-group">
        <label for="myParam"
          >Parameter: <span id="valueDisplay">1.0</span></label
        >
        <input
          type="range"
          id="myParam"
          min="0"
          max="2"
          step="0.1"
          value="1.0"
        />
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" id="myCheckbox" checked />
          Show Feature
        </label>
      </div>
    </div>

    <!-- Canvas container -->
    <div id="my-canvas"></div>
  </div>
</div>

<script>
  // p5 is loaded globally from the Layout - no need to import
  let myParam = 1.0;
  let showFeature = true;

  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(600, 400);
      canvas.parent('my-canvas');
    };

    p.draw = () => {
      p.background(255);
      // Your drawing code here
    };
  };

  new p5(sketch);

  // Event listeners for controls
  document.getElementById('myParam')?.addEventListener('input', (e) => {
    myParam = parseFloat(e.target.value);
    document.getElementById('valueDisplay').textContent = myParam.toFixed(1);
  });

  document.getElementById('myCheckbox')?.addEventListener('change', (e) => {
    showFeature = e.target.checked;
  });
</script>

<style>
  /* Component styles */
  .p5-component {
    margin: 3rem 0;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  }

  .p5-container {
    display: flex;
    gap: 2rem;
  }

  .controls {
    flex: 0 0 250px;
  }

  #my-canvas {
    flex: 1;
    border: 2px solid #dee2e6;
    background: white;
  }
</style>
```

### Key Points

1. **Canvas ID**: Use a unique ID for each canvas container
2. **Controls**: Use `document.getElementById()` with optional chaining (`?.`)
3. **p5 Global**: p5.js is loaded globally in Layout.astro - no import needed
4. **Variables**: Declare reactive variables outside the sketch for control access
5. **Styling**: Include responsive styles for mobile

## Using Components in Your Blog Post

**Important**: Markdown with LaTeX only works in `.mdx` files, not `.astro` files!

### Method 1: Create an MDX file (Recommended)

Create your blog content in an MDX file like [BlogContent.mdx](src/components/BlogContent.mdx):

```mdx
import MyVisualization from './MyVisualization.astro';

# My Blog Post Title

Some introductory text with inline math: $x^2 + y^2 = r^2$

## Section with Equation

$$
\nabla \cdot \mathbf{F} = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}
$$

Now let's visualize this concept:

<MyVisualization title="Interactive Demo" />

More text continues here...
```

Then import it in [index.astro](src/pages/index.astro):

```astro
---
import Layout from '../layouts/Layout.astro';
import BlogContent from '../components/BlogContent.mdx';
---

<Layout>
  <BlogContent />
</Layout>
```

### Method 2: Use HTML in Astro files

If you prefer `.astro` files, use HTML tags instead of markdown:

```astro
<Layout>
  <h1>My Blog Post Title</h1>
  <p>Some text...</p>
  <MyVisualization title="Interactive Demo" />
</Layout>
```

Note: LaTeX math syntax (`$...$` and `$$...$$`) only works in MDX files.

## Development

### Setup

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4321` to see your blog post.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Tips and Best Practices

### Math Equations

- Use `$...$` for inline math
- Use `$$...$$` for display equations
- Common symbols: `\alpha, \beta, \nabla, \partial, \int, \sum`
- Matrices: `\begin{bmatrix}...\end{bmatrix}`
- Vectors: `\mathbf{v}` for bold vectors

### p5.js Visualizations

- Keep canvas size around 600x400 for good balance
- Use 250px width for control sidebars
- Add responsive styles for mobile (`@media`)
- Use `?.` operator for safer event listener attachment
- Clean up with `p.remove()` if recreating sketches

### Performance

- Limit particle count to 100-500 for smooth animation
- Use `p.background()` each frame to clear canvas
- Avoid heavy computations in `draw()` loop
- Consider using `p.noLoop()` and `p.redraw()` for static visualizations

### Styling

- Follow the existing color scheme (primary: #007acc)
- Use Merriweather for body text
- Use Inter for headings
- Maintain consistent spacing (margins: 2-3rem)

## Examples Included

1. **VectorFieldVisualization.astro**: Shows circular vector field with flow particles
2. **WaveSimulation.astro**: Demonstrates wave interference with 3D option
3. **PathfindingDemo.astro**: Interactive gradient-based pathfinding with obstacles

Each example demonstrates different interaction patterns and visualization techniques.

## Customization

### Change Fonts

Edit [Layout.astro](src/layouts/Layout.astro) Google Fonts import:

```html
<link
  href="https://fonts.googleapis.com/css2?family=YourFont&display=swap"
  rel="stylesheet"
/>
```

Update CSS variables:

```css
:root {
  --font-body: 'YourFont', serif;
  --font-heading: 'YourHeadingFont', sans-serif;
}
```

### Change Colors

Update CSS variables in [Layout.astro](src/layouts/Layout.astro):

```css
:root {
  --color-primary: #007acc;
  --color-text: #2c3e50;
  --color-bg: #f5f5f5;
}
```

## Resources

- [Astro Documentation](https://docs.astro.build)
- [p5.js Reference](https://p5js.org/reference/)
- [MathJax Documentation](https://docs.mathjax.org/)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [Merriweather Font](https://fonts.google.com/specimen/Merriweather)
