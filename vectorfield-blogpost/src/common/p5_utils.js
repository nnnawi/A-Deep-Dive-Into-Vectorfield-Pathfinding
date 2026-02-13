/**
 * Pauses a p5 sketch's draw loop when scrolled off-screen and
 * resumes it when scrolled back into view, using IntersectionObserver.
 *
 * @param {object} instance - The p5 instance returned by `new p5(...)`
 * @param {string} containerId - The DOM id of the canvas container div
 */
export function setupVisibilityPause(instance, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Pause immediately — p5's setup() still runs once to initialize the canvas,
  // but the draw loop won't start until the observer sees the element on screen.
  instance.noLoop();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          instance.loop();
        } else {
          instance.noLoop();
        }
      });
    },
    {
      threshold: 0,
      // Start/stop 200px before entering/leaving the viewport for a smooth experience
      rootMargin: '200px 0px',
    }
  );

  observer.observe(container);
}
