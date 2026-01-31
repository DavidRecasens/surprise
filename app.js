// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const message = document.getElementById("message");
const fireworksCanvas = document.getElementById("fireworks");
const actions = document.getElementById("actions");
const gifDisplay = document.getElementById("gifDisplay");

if (!yesButton || !noButton || !gifDisplay) {
  console.error("Required elements not found");
  return;
}

const state = {
  noCount: 0,
  yesScale: 1,
  noScale: 1,
  movingIndex: 0,
  dynamicMove: false,
  currentGif: 0, // 0 = gif0.gif, 1-12 = gif1.gif to gif12.gif (skipping original gif7), -1 = gif_final.gif, -2 = gif_plotting.gif
  moveInterval: null,
  moveSpeedLevel: 0,
  moveAngle: 0,
  moveJitter: 0,
  moveDirection: 1,
};

const staticPositions = [
  { top: "10%", left: "10%" },
  { top: "10%", left: "70%" },
  { top: "70%", left: "15%" },
  { top: "50%", left: "50%" },
];

const fireworks = {
  ctx: fireworksCanvas.getContext("2d"),
  particles: [],
  active: false,
};

const resizeCanvas = () => {
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
};

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const createBurst = () => {
  const centerX = randomBetween(100, fireworksCanvas.width - 100);
  const centerY = randomBetween(100, fireworksCanvas.height - 200);
  const count = 80;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = randomBetween(2, 6);
    fireworks.particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: `hsl(${Math.floor(randomBetween(0, 360))}, 90%, 60%)`,
    });
  }
};

const animateFireworks = () => {
  if (!fireworks.active) {
    return;
  }
  const { ctx } = fireworks;
  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  if (Math.random() > 0.9) {
    createBurst();
  }

  fireworks.particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.alpha -= 0.015;
  });

  fireworks.particles = fireworks.particles.filter((particle) => particle.alpha > 0);

  fireworks.particles.forEach((particle) => {
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  requestAnimationFrame(animateFireworks);
};

const updateButtonSizes = () => {
  yesButton.style.transform = `scale(${state.yesScale})`;
  // Only update noButton transform if it doesn't have rotation effects (clicks 8+)
  if (state.noCount <= 7) {
    noButton.style.transform = `scale(${state.noScale})`;
  }
  // For clicks 8+, the transform is set in handleNoClick with rotation effects
};

const moveNoButtonTo = (position) => {
  actions.classList.add("moving");
  actions.style.position = "relative";
  noButton.style.position = "absolute";
  noButton.style.top = position.top;
  noButton.style.left = position.left;
};

const moveNoButtonRandomly = () => {
  const bounds = actions.getBoundingClientRect();
  const maxX = Math.max(0, bounds.width - noButton.offsetWidth);
  const maxY = Math.max(0, bounds.height - noButton.offsetHeight);
  const randomX = randomBetween(0, maxX);
  const randomY = randomBetween(0, maxY);
  noButton.style.position = "absolute";
  noButton.style.transition = "none"; // Remove transition for instant movement
  noButton.style.left = `${randomX}px`;
  noButton.style.top = `${randomY}px`;
  noButton.style.right = "auto";
  noButton.style.bottom = "auto";
  noButton.style.margin = "0"; // Remove any margin that might interfere
};

const moveNoButtonOrbit = (speedLevel) => {
  const actionsRect = actions.getBoundingClientRect();
  const yesRect = yesButton.getBoundingClientRect();

  const centerX = yesRect.left + yesRect.width / 2 - actionsRect.left;
  const centerY = yesRect.top + yesRect.height / 2 - actionsRect.top;

  const baseRadius = Math.max(
    60,
    Math.min(actionsRect.width, actionsRect.height) * 0.22
  );
  const radius = baseRadius + speedLevel * 4;

  const cappedSpeed = Math.min(speedLevel, 5);
  state.moveAngle =
    (state.moveAngle + state.moveDirection * (0.048 + cappedSpeed * 0.008)) %
    (Math.PI * 2);
  state.moveJitter =
    (state.moveJitter + 0.072 + cappedSpeed * 0.0056) % (Math.PI * 2);

  const radiusJitter = Math.sin(state.moveJitter * 1.7) * 8;
  const wobbleX = Math.sin(state.moveJitter * 2.3) * 6;
  const wobbleY = Math.cos(state.moveJitter * 1.3) * 5;

  const targetX =
    centerX +
    Math.cos(state.moveAngle) * (radius + radiusJitter) +
    wobbleX -
    noButton.offsetWidth / 2;
  const targetY =
    centerY +
    Math.sin(state.moveAngle) * (radius - radiusJitter) +
    wobbleY -
    noButton.offsetHeight / 2;

  noButton.style.position = "absolute";
  noButton.style.transition = "none";
  noButton.style.left = `${targetX}px`;
  noButton.style.top = `${targetY}px`;
  noButton.style.right = "auto";
  noButton.style.bottom = "auto";
  noButton.style.margin = "0";
};

const stopNoButtonMovement = () => {
  if (state.moveInterval) {
    clearInterval(state.moveInterval);
    state.moveInterval = null;
  }
};

const startNoButtonMovement = (speedLevel) => {
  stopNoButtonMovement();
  const interval = 80;
  moveNoButtonOrbit(speedLevel);
  state.moveInterval = setInterval(() => {
    moveNoButtonOrbit(speedLevel);
  }, interval);
};

const updateNoButtonMovementForGifRange = () => {
  if (state.currentGif >= 8 && state.currentGif <= 12) {
    startNoButtonMovement(state.moveSpeedLevel);
  } else {
    stopNoButtonMovement();
  }
};

const updateGif = () => {
  if (!gifDisplay) {
    console.error("gifDisplay element not found");
    return;
  }
  
  let newSrc;
  if (state.currentGif === -1) {
    newSrc = "assets/gifs/gif_final.gif";
  } else if (state.currentGif === -2) {
    newSrc = "assets/gifs/gif_plotting.gif";
  } else {
    newSrc = `assets/gifs/gif${state.currentGif}.gif`;
  }
  
  // Force reload by adding timestamp to bypass cache
  const separator = newSrc.includes("?") ? "&" : "?";
  gifDisplay.src = newSrc + separator + "t=" + Date.now();
};

const handleNoClick = () => {
  // If we're already on gif_plotting, disable the button completely
  if (state.currentGif === -2) {
    return; // Button should be disabled, but if somehow clicked, do nothing
  }

  state.noCount += 1;
  message.textContent = "";

  // Progress through gifs: gif0 -> gif1 -> ... -> gif6 -> gif7 (old gif8) -> ... -> gif12 (old gif13) -> gif_plotting
  // Sequence: 0,1,2,3,4,5,6,7,8,9,10,11,12 (skipping the original gif7)
  // Special case: when on gif11, move button before changing to gif12
  if (state.currentGif === 11) {
    // Move button to a new position when clicking No on gif11
    actions.style.position = "relative";
    actions.style.display = "flex";
    yesButton.style.position = "static";
    noButton.style.position = "absolute";
    noButton.style.transition = "none";
    const position = staticPositions[state.movingIndex % staticPositions.length];
    noButton.style.top = position.top;
    noButton.style.left = position.left;
    noButton.style.right = "auto";
    noButton.style.bottom = "auto";
    noButton.style.margin = "0";
    state.movingIndex += 1;
    // Then change to gif12
    state.currentGif = 12;
    updateGif();
    if (state.noCount >= 8) {
      state.moveSpeedLevel += 5;
      state.moveDirection = Math.random() < 0.5 ? -1 : 1;
      state.moveAngle += (Math.random() - 0.5) * 0.6;
    }
    updateNoButtonMovementForGifRange();
    return; // Button is still clickable on gif12
  }
  
  // This must happen FIRST before any returns (except for gif11 case above)
  if (state.currentGif >= 0 && state.currentGif < 12) {
    state.currentGif += 1;
    updateGif();
    updateNoButtonMovementForGifRange();
  } else if (state.currentGif === 12) {
    // After gif12 (the last numbered gif), move button first, then go to gif_plotting
    // Move button to a new position before changing to gif_plotting
    actions.style.position = "relative";
    actions.style.display = "flex";
    yesButton.style.position = "static";
    noButton.style.position = "absolute";
    noButton.style.transition = "none";
    const position = staticPositions[state.movingIndex % staticPositions.length];
    noButton.style.top = position.top;
    noButton.style.left = position.left;
    noButton.style.right = "auto";
    noButton.style.bottom = "auto";
    noButton.style.margin = "0";
    state.movingIndex += 1;
    
    // Now change to gif_plotting (button stays in the position it just moved to)
    state.currentGif = -2;
    updateGif();
    stopNoButtonMovement();
    state.dynamicMove = true;
    noButton.disabled = true; // Disable the button completely
    noButton.style.pointerEvents = "none"; // Make it unclickable
    noButton.classList.add("moving");
    // Button position is already set above, don't change it
    // Clear any existing interval (no continuous movement)
    if (state.moveInterval) {
      clearInterval(state.moveInterval);
      state.moveInterval = null;
    }
    return; // Return here since we've handled the gif_plotting case
  }

  // Keep button easy to click until we reach gif12
  if (state.currentGif < 12) {
    if (state.noCount <= 3) {
      // First 3 clicks (clicks 1, 2, 3): make yes button bigger and no button smaller
      state.yesScale += 0.2;
      state.noScale = Math.max(0.8, state.noScale - 0.1);
      updateButtonSizes();
    } else if (state.noCount <= 7) {
      // Clicks 4-7: move button to different positions and make it smaller
      state.noScale = Math.max(0.75, state.noScale - 0.05);
      updateButtonSizes();
      // Move to static positions
      actions.style.position = "relative";
      actions.style.display = "flex";
      yesButton.style.position = "static";
      noButton.style.position = "absolute";
      noButton.style.transition = "none";
      const position = staticPositions[state.movingIndex % staticPositions.length];
      noButton.style.top = position.top;
      noButton.style.left = position.left;
      noButton.style.right = "auto";
      noButton.style.bottom = "auto";
      noButton.style.margin = "0";
      state.movingIndex += 1;
    } else {
      // Clicks 8-12: funny effects - rotation, shake, color change, etc.
      state.noScale = Math.max(0.75, state.noScale - 0.02);
      state.moveSpeedLevel += 1;
      updateButtonSizes();
      
      // Ensure button is positioned absolutely
      actions.style.position = "relative";
      actions.style.display = "flex";
      yesButton.style.position = "static";
      noButton.style.position = "absolute";
      noButton.style.transition = "none";
      
      // Apply different funny effects based on click count
      const effectIndex = (state.noCount - 8) % 5;
      
      switch(effectIndex) {
        case 0: // Subtle pulse via scale only
          noButton.style.transform = `scale(${state.noScale})`;
          break;
        case 1: // Normal (no shake to avoid size jumps)
          noButton.style.transform = `scale(${state.noScale})`;
          break;
        case 2: // Normal
          noButton.style.transform = `scale(${state.noScale})`;
          break;
        case 3: // Normal (duplicate to keep variety in other effects)
          noButton.style.transform = `scale(${state.noScale})`;
          break;
        case 4: // Normal but very small
          noButton.style.transform = `scale(${state.noScale})`;
          break;
      }
      
      // Move to random position (not just static positions)
      const bounds = actions.getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - noButton.offsetWidth);
      const maxY = Math.max(0, bounds.height - noButton.offsetHeight);
      const randomX = randomBetween(0, maxX);
      const randomY = randomBetween(0, maxY);
      noButton.style.top = `${randomY}px`;
      noButton.style.left = `${randomX}px`;
      noButton.style.right = "auto";
      noButton.style.bottom = "auto";
      noButton.style.margin = "0";
      
      // Change color slightly for variety
      const colors = ["#ff8fab", "#ff9fbb", "#ffa5c0", "#ffb3cc", "#ffc0d9"];
      noButton.style.background = colors[effectIndex % colors.length];
      // Jump instantly to a new orbit position on click, then keep moving slowly
      state.moveAngle = Math.random() * Math.PI * 2;
      moveNoButtonOrbit(state.moveSpeedLevel);
      updateNoButtonMovementForGifRange();
    }
    return; // Button can still be clicked but is harder
  }
};

let lastMoveTime = 0;
const MOVE_COOLDOWN = 50; // Minimum milliseconds between moves

const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const handleMouseMove = (event) => {
  // Only check proximity when on gif_plotting (currentGif === -2)
  if (state.currentGif === -2) {
    const now = Date.now();
    // Small cooldown to prevent excessive movement
    if (now - lastMoveTime < MOVE_COOLDOWN) {
      return;
    }
    
    const buttonRect = noButton.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Check if mouse is about to enter the button area (within 1-2 pixels of the button edge)
    // Calculate distance from mouse to the nearest edge of the button
    const distanceToLeft = Math.abs(mouseX - buttonRect.left);
    const distanceToRight = Math.abs(mouseX - buttonRect.right);
    const distanceToTop = Math.abs(mouseY - buttonRect.top);
    const distanceToBottom = Math.abs(mouseY - buttonRect.bottom);
    
    // Find the minimum distance to any edge
    const minDistanceToEdge = Math.min(
      distanceToLeft,
      distanceToRight,
      distanceToTop,
      distanceToBottom
    );
    
    // Check if mouse is inside the button or very close (within 2 pixels)
    const isInsideButton = mouseX >= buttonRect.left && 
                          mouseX <= buttonRect.right && 
                          mouseY >= buttonRect.top && 
                          mouseY <= buttonRect.bottom;
    
    // If mouse is inside button or within 2 pixels of entering, move it instantly
    const proximityThreshold = 2; // Very close, almost touching
    if (isInsideButton || minDistanceToEdge < proximityThreshold) {
      moveNoButtonRandomly();
      lastMoveTime = now;
    }
  }
};

document.addEventListener("mousemove", handleMouseMove);

const handleNoHover = () => {
  // For gif_plotting, movement is handled by proximity detection in handleMouseMove
  // For all other gifs (0-12), don't move the button on hover
};

const handleYesClick = () => {
  // Change to gif_final.gif when yes is clicked
  state.currentGif = -1;
  updateGif();
  stopNoButtonMovement();
  message.textContent = "YAY! PINGI PENGU SIIIIII YOU ARE MY VALENTINE🤗🤗🤗";
  yesButton.disabled = true;
  noButton.disabled = true;
  yesButton.style.display = "none";
  noButton.style.display = "none";
  if (actions) {
    actions.style.display = "none";
  }
  fireworks.active = true;
  createBurst();
  animateFireworks();
};

noButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleNoClick();
});

// Note: mouseenter on noButton is not needed for gif_plotting
// Proximity detection is handled by mousemove event on document
noButton.addEventListener("mouseenter", handleNoHover);

yesButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleYesClick();
});

} // End of initializeApp
