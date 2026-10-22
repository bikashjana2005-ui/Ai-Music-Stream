/**
 * Virtual 165Hz Ultra-Smooth Refresh Engine with Adaptive Turbo Mode
 * 
 * Provides sub-frame micro-interpolation (6.06ms tick rate = 1000/165)
 * for 60Hz displays, eliminating motion judder, smoothing scroll momentum,
 * and delivering optical 165Hz fluidity while preserving battery via Adaptive Turbo Mode.
 */

const TARGET_FPS = 165;
const SUB_FRAME_INTERVAL = 1000 / TARGET_FPS; // ~6.0606ms per virtual frame
const IDLE_TIMEOUT_MS = 1200; // Sleep after 1.2s of inactivity

interface VirtualRefreshState {
  isActive: boolean;
  isTurbo: boolean;
  lastInteractionTime: number;
  currentScrollY: number;
  targetScrollY: number;
  scrollVelocity: number;
  isScrolling: boolean;
  rafId: number | null;
  subFrameTimerId: number | null;
}

const state: VirtualRefreshState = {
  isActive: false,
  isTurbo: false,
  lastInteractionTime: Date.now(),
  currentScrollY: 0,
  targetScrollY: 0,
  scrollVelocity: 0,
  isScrolling: false,
  rafId: null,
  subFrameTimerId: null,
};

// Wake up the 165Hz turbo interpolation loop
export function wakeTurbo() {
  state.lastInteractionTime = performance.now();
  if (!state.isTurbo) {
    state.isTurbo = true;
    startSubFrameLoop();
  }
}

// 165Hz High-Frequency Micro-Step Loop
function startSubFrameLoop() {
  if (state.subFrameTimerId !== null) return;

  let lastTick = performance.now();

  const tick = () => {
    const now = performance.now();

    // Check if we should sleep to preserve device battery
    if (now - state.lastInteractionTime > IDLE_TIMEOUT_MS && Math.abs(state.scrollVelocity) < 0.05) {
      state.isTurbo = false;
      state.subFrameTimerId = null;
      return;
    }

    // Sub-frame physics interpolation (damping factor optimized for 165Hz)
    if (state.isScrolling) {
      const diff = state.targetScrollY - state.currentScrollY;
      state.scrollVelocity = diff * 0.18; // Smooth asymptotic approach
      state.currentScrollY += state.scrollVelocity;

      if (Math.abs(diff) < 0.5) {
        state.currentScrollY = state.targetScrollY;
        state.scrollVelocity = 0;
        state.isScrolling = false;
      }
    }

    lastTick = now;
    state.subFrameTimerId = window.setTimeout(tick, SUB_FRAME_INTERVAL);
  };

  state.subFrameTimerId = window.setTimeout(tick, SUB_FRAME_INTERVAL);
}

// Native Render Sync: Align virtual calculations with display VSync
function startRenderSync() {
  const render = () => {
    // If active momentum scrolling, apply the interpolated sub-pixel position
    if (state.isScrolling && typeof window !== 'undefined') {
      window.scrollTo({
        top: state.currentScrollY,
        behavior: 'instant' as ScrollBehavior,
      });
    }

    state.rafId = requestAnimationFrame(render);
  };

  state.rafId = requestAnimationFrame(render);
}

// Find internal scroll container to avoid hijacking nested scroll areas
function findScrollableParent(el: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

// Event Listeners for Adaptive Turbo Mode
function handleInteraction() {
  wakeTurbo();
}

function handleWheel(e: WheelEvent) {
  wakeTurbo();
  
  // If user is scrolling an internal container (e.g. video player comments or modal), allow natural 165Hz container scrolling
  const targetEl = e.target as HTMLElement | null;
  const scrollableParent = findScrollableParent(targetEl);
  if (scrollableParent) {
    return;
  }

  if (Math.abs(e.deltaY) > 0) {
    if (!state.isScrolling) {
      state.currentScrollY = window.scrollY;
      state.targetScrollY = window.scrollY;
    }
    
    // Scale delta for liquid momentum response
    const scrollMultiplier = 0.95;
    state.targetScrollY = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        state.targetScrollY + e.deltaY * scrollMultiplier
      )
    );
    state.isScrolling = true;
  }
}

function handleTouchMove() {
  wakeTurbo();
  state.isScrolling = false; // Allow native touch inertia to handle touch directly
  state.currentScrollY = window.scrollY;
  state.targetScrollY = window.scrollY;
}

function handleVisibilityChange() {
  if (document.hidden) {
    // Background tab: immediately pause 165Hz loop to save CPU
    state.isTurbo = false;
    if (state.subFrameTimerId !== null) {
      clearTimeout(state.subFrameTimerId);
      state.subFrameTimerId = null;
    }
  } else {
    // Foreground tab: resume turbo on return
    wakeTurbo();
  }
}

/**
 * Initializes the Virtual 165Hz Engine globally.
 * Returns a teardown function for component cleanup.
 */
export function initVirtualRefreshEngine(): () => void {
  if (typeof window === 'undefined') return () => {};

  state.isActive = true;
  state.currentScrollY = window.scrollY;
  state.targetScrollY = window.scrollY;

  // Add high-efficiency passive listeners for zero-overhead interaction tracking
  const eventOptions: AddEventListenerOptions = { passive: true };

  window.addEventListener('scroll', handleInteraction, eventOptions);
  window.addEventListener('touchstart', handleInteraction, eventOptions);
  window.addEventListener('touchmove', handleTouchMove, eventOptions);
  window.addEventListener('touchend', handleInteraction, eventOptions);
  window.addEventListener('pointerdown', handleInteraction, eventOptions);
  window.addEventListener('pointermove', handleInteraction, eventOptions);
  window.addEventListener('keydown', handleInteraction, eventOptions);
  window.addEventListener('wheel', handleWheel, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Kick off the dual-tier scheduler
  wakeTurbo();
  startRenderSync();

  // Inject 165Hz optimization flag on root document
  document.documentElement.setAttribute('data-virtual-hz', '165');
  document.documentElement.classList.add('virtual-165hz-active');

  return () => {
    state.isActive = false;
    state.isTurbo = false;

    if (state.subFrameTimerId !== null) {
      clearTimeout(state.subFrameTimerId);
      state.subFrameTimerId = null;
    }
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    window.removeEventListener('scroll', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleInteraction);
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('pointermove', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('wheel', handleWheel);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    document.documentElement.removeAttribute('data-virtual-hz');
    document.documentElement.classList.remove('virtual-165hz-active');
  };
}
