const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const message = document.getElementById("message");
const fireworksCanvas = document.getElementById("fireworks");
const actions = document.getElementById("actions");

const state = {
  noCount: 0,
  yesScale: 1,
  noScale: 1,
  movingIndex: 0,
  dynamicMove: false,
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
  noButton.style.transform = `scale(${state.noScale})`;
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
  noButton.style.left = `${randomX}px`;
  noButton.style.top = `${randomY}px`;
};

const handleNoClick = () => {
  state.noCount += 1;
  message.textContent = "";

  if (state.noCount <= 3) {
    state.yesScale += 0.2;
    state.noScale = Math.max(0.6, state.noScale - 0.15);
    updateButtonSizes();
    return;
  }

  if (state.noCount <= 7) {
    const position = staticPositions[state.movingIndex % staticPositions.length];
    moveNoButtonTo(position);
    state.movingIndex += 1;
    return;
  }

  state.dynamicMove = true;
  noButton.classList.add("moving");
  noButton.style.position = "absolute";
  moveNoButtonRandomly();
};

const handleNoHover = () => {
  if (!state.dynamicMove) {
    return;
  }
  moveNoButtonRandomly();
};

const handleYesClick = () => {
  message.textContent = "¡Bien! I'm so happy. You are my valentine. I love you.";
  yesButton.disabled = true;
  noButton.disabled = true;
  fireworks.active = true;
  createBurst();
  animateFireworks();
};

noButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleNoClick();
});

noButton.addEventListener("mouseenter", handleNoHover);

yesButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleYesClick();
});
