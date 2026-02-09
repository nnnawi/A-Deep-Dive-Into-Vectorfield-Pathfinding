/**
 * Lazy P5.js Sketch Loader with Pause/Resume
 *
 * Automatically initializes p5.js sketches when they appear on screen
 * and pauses them when they scroll out of view to save performance.
 *
 * Usage:
 *   lazyLoadP5(sketchFunction, 'target-div-id');
 */

function lazyLoadP5(sketchFunction, targetId, options = {}) {
    const targetDiv = document.getElementById(targetId);

    // If target div doesn't exist, don't initialize
    if (!targetDiv) {
        console.warn(`lazyLoadP5: Target element '${targetId}' not found. Sketch will not be initialized.`);
        return;
    }

    let sketchInstance = null;

    // Default options
    const config = {
        rootMargin: options.rootMargin || '100px', // Start loading slightly before visible
        threshold: options.threshold || 0.1 // Consider visible when 10% is in view
    };

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        const isVisible = entries[0].isIntersecting;

        if (isVisible) {
            if (!sketchInstance) {
                // Initialize sketch on first appearance
                console.log(`Initializing sketch for '${targetId}'`);
                sketchInstance = new p5((p) => sketchFunction(p, targetId), targetId);
            } else {
                // Resume if already created
                console.log(`Resuming sketch for '${targetId}'`);
                sketchInstance.loop();
            }
        } else {
            // Pause when off-screen
            if (sketchInstance) {
                console.log(`Pausing sketch for '${targetId}'`);
                sketchInstance.noLoop();
            }
        }
    }, config);

    // Start observing
    observer.observe(targetDiv);

    // Return cleanup function if needed
    return {
        destroy: () => {
            observer.disconnect();
            if (sketchInstance) {
                sketchInstance.remove();
                sketchInstance = null;
            }
        },
        getInstance: () => sketchInstance
    };
}
