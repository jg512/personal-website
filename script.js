const bootScreen = document.getElementById("bootScreen");
const clock = document.getElementById("clock");
const terminalBody = document.querySelector(".terminal-body");

function hideBootScreen() {
  if (!bootScreen) {
    return;
  }

  bootScreen.style.display = "none";
}

function renderClock() {
  if (!clock) {
    return;
  }

  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function typeNode(sourceNode, targetParent, speed) {
  if (sourceNode.nodeType === Node.TEXT_NODE) {
    const textNode = document.createTextNode("");
    targetParent.appendChild(textNode);

    for (const character of sourceNode.textContent) {
      textNode.textContent += character;
      await sleep(speed);
    }

    return;
  }

  if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const clone = sourceNode.cloneNode(false);
  targetParent.appendChild(clone);

  for (const childNode of sourceNode.childNodes) {
    await typeNode(childNode, clone, speed);
  }
}

async function animateLine(element) {
  if (!element || element.dataset.typed === "true") {
    return;
  }

  element.dataset.typed = "true";
  const originalNodes = Array.from(element.childNodes).map((node) => node.cloneNode(true));
  const height = element.offsetHeight;

  element.classList.add("is-active");
  element.style.minHeight = `${height}px`;
  element.textContent = "";

  for (const node of originalNodes) {
    await typeNode(node, element, 3);
  }

  element.classList.remove("is-active");
  element.classList.add("is-done");
  element.style.minHeight = "";
  await sleep(35);
}

function getSequenceLines(sequence) {
  if (sequence.matches(".line, .meta, .terminal-list li")) {
    return [sequence];
  }

  return Array.from(sequence.querySelectorAll(".line, .meta, .terminal-list li"));
}

function prepareAnimations() {
  if (!terminalBody) {
    return [];
  }

  const sequences = Array.from(terminalBody.children);
  const lines = terminalBody.querySelectorAll(".line, .meta, .terminal-list li");

  lines.forEach((line) => {
    line.classList.add("anim-line");
  });

  return sequences;
}

function setupScrollAnimations() {
  const sequences = prepareAnimations();

  if (!sequences.length) {
    return;
  }

  let animationQueue = Promise.resolve();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.sequenceAnimated === "true") {
          return;
        }

        entry.target.dataset.sequenceAnimated = "true";
        observer.unobserve(entry.target);

        animationQueue = animationQueue.then(async () => {
          const lines = getSequenceLines(entry.target);

          for (const line of lines) {
            await animateLine(line);
          }
        });
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.2,
    }
  );

  sequences.forEach((sequence) => observer.observe(sequence));
}

setTimeout(hideBootScreen, 3600);
renderClock();
setInterval(renderClock, 1000);
setupScrollAnimations();
