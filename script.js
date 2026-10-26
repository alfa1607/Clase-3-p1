
const YOUTUBE_VIDEO_ID = "OYi85wHUIuQ";

const overlay = document.getElementById("challengeOverlay");
const finalOverlay = document.getElementById("finalOverlay");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const continueBtn = document.getElementById("continueBtn");
const restartBtn = document.getElementById("restartBtn");
const xpEl = document.getElementById("xp");
const correctEl = document.getElementById("correctCount");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const missionCount = document.getElementById("missionCount");
const missionTitle = document.getElementById("missionTitle");
const missionDescription = document.getElementById("missionDescription");
const timerEl = document.getElementById("timer");

// Preguntas integradas en el propio JavaScript.
// Nota: esto no oculta las respuestas al inspeccionar el código.
// "time" = segundo del video en que se pausa. "answer" = posición de la correcta (0 = A, 1 = B, 2 = C).
const lessonData = {
  lessonTitle: "Laplace Challenge — Clase 3, parte 1",
  lessonDescription: "Estabilidad de sistemas, ubicación de polos y simulación en MATLAB y Simulink",
  challenges: [
    { time: 105, title: "Define la estabilidad", icon: "⚖️", question: "Según la clase, ¿cuándo se considera estable un sistema?", options: ["Cuando la salida es siempre igual a cero", "Cuando para una entrada acotada responde con una salida acotada", "Cuando la entrada y la salida son la misma señal"], answer: 1, explanation: "Un sistema es estable si, ante una entrada acotada, produce una salida acotada (finita).", xp: 100 },
    { time: 340, title: "Respuesta de un sistema estable", icon: "📈", question: "En la gráfica de respuesta en el tiempo de un sistema estable, ¿qué le pasa a la salida?", options: ["Crece sin límite con el tiempo", "Oscila para siempre con amplitud creciente", "Se estabiliza en un valor finito"], answer: 2, explanation: "En un sistema estable la salida converge a un valor finito, ya sea subamortiguada o críticamente amortiguada.", xp: 100 },
    { time: 520, title: "Ubicación de polos", icon: "📍", question: "Para que un sistema sea estable, ¿en qué zona del plano complejo deben estar sus polos?", options: ["En el semiplano izquierdo (parte real negativa)", "En el semiplano derecho (parte real positiva)", "Únicamente en el origen"], answer: 0, explanation: "Los polos de un sistema estable tienen parte real negativa, es decir, están en el semiplano izquierdo.", xp: 100 },
    { time: 690, title: "Sistema inestable", icon: "💥", question: "En un sistema inestable, ¿cómo se comporta la salida y dónde aparecen sus polos?", options: ["Converge a un valor finito y los polos están a la izquierda", "Crece sin límite y hay polos en el semiplano derecho", "Se mantiene siempre en cero y no tiene polos"], answer: 1, explanation: "En un sistema inestable la salida se dispara con el tiempo y hay polos con parte real positiva.", xp: 150 },
    { time: 780, title: "Cómo se obtienen los polos", icon: "🧮", question: "¿Cómo se obtienen los polos de un sistema a partir de su función de transferencia F(s)?", options: ["Igualando el numerador a cero", "Derivando F(s) respecto al tiempo", "Igualando el denominador a cero (ecuación característica)"], answer: 2, explanation: "Los polos son las raíces del denominador de F(s), llamado ecuación característica.", xp: 150 },
    { time: 870, title: "Aplica el ejemplo", icon: "✏️", question: "Para F(s) = 10/(s − 2), ¿cuál es el polo y qué concluyes?", options: ["s = −2, el sistema es estable", "s = +2, el sistema es inestable", "s = 10, el sistema es estable"], answer: 1, explanation: "Al igualar s − 2 = 0 se obtiene s = +2: polo en el semiplano derecho, por lo tanto el sistema es inestable.", xp: 150 },
    { time: 1010, title: "Código en MATLAB", icon: "💻", question: "En MATLAB, ¿qué representan num = 10 y den = [1 −2] cuando se usa step(num, den)?", options: ["El numerador y el denominador de F(s) = 10/(s − 2), para ver su respuesta al escalón", "Los valores de entrada y salida del sistema en el tiempo", "El tamaño del archivo y su duración"], answer: 0, explanation: "num y den definen la función de transferencia, y step grafica su respuesta ante una entrada escalón.", xp: 150 },
    { time: 1195, title: "Desafío final", icon: "🏆", question: "En la simulación final de 10/(s − 2) ante un escalón, ¿qué muestra la gráfica de salida?", options: ["La salida se estabiliza rápidamente en un valor finito", "La salida es siempre cero", "La salida crece sin límite, confirmando que el sistema es inestable"], answer: 2, explanation: "La salida diverge: es la confirmación de que el polo en s = +2 hace inestable al sistema.", xp: 200 }
  ]
};
let challenges = lessonData.challenges;

let current = 0;
let xp = 0;
let correct = 0;
let challengeOpen = false;
let answered = false;
let timer = null;
let seconds = 20;


// YOUTUBE: reproductor + revisión del tiempo

let player = null;        // objeto del reproductor de YouTube
let playerReady = false;  // true cuando el reproductor terminó de cargar
let watcher = null;       // intervalo que revisa el tiempo del video
let pendingPlay = false;  // por si se pide play antes de que cargue

// Carga la librería de YouTube. Cuando está lista, YouTube llama
// automáticamente a onYouTubeIframeAPIReady (debe ser una función global).
(function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function () {
  
  player = new YT.Player("lessonVideo", {
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: {
      rel: 0,            // al pausar, solo sugiere videos de tu canal
      modestbranding: 1, // logo de YouTube más discreto
      playsinline: 1,    // reproduce dentro de la página en iPhone
      fs: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady() {
  playerReady = true;
  if (pendingPlay) playVideo();
}

// YouTube avisa cada vez que el video cambia de estado:
// 1 = reproduciendo, 2 = en pausa, 0 = terminó, 3 = cargando...
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    startWatcher();
  } else {
    stopWatcher();
  }
  if (event.data === YT.PlayerState.ENDED) {
    handleEnded();
  }
}

// Reemplaza al evento "timeupdate" del <video>, que YouTube no tiene:
// mientras el video se reproduce, consultamos el tiempo cada 250 ms.
function startWatcher() {
  stopWatcher();
  watcher = setInterval(checkChallenge, 250);
}

function stopWatcher() {
  clearInterval(watcher);
  watcher = null;
}

function checkChallenge() {
  if (!playerReady || challengeOpen || current >= challenges.length) return;
  const c = challenges[current];
  if (player.getCurrentTime() >= c.time) {
    pauseVideo();
    showChallenge(c);
  }
}

function handleEnded() {
  if (current < challenges.length && !challengeOpen) {
    current = challenges.length;
    updateDashboard();
    finish();
  }
}

// Funciones auxiliares para no repetir código ni fallar si
// el reproductor todavía no ha cargado.
function playVideo() {
  if (!playerReady) { pendingPlay = true; return; }
  pendingPlay = false;
  player.playVideo();
}

function pauseVideo() {
  if (playerReady) player.pauseVideo();
}

function restartVideo() {
  if (playerReady) player.seekTo(0, true);
}


// LÓGICA DE LA ACTIVIDAD (igual que antes)

function updateDashboard() {
  const done = current;
  const total = challenges.length || 1;
  const pct = Math.round((done / total) * 100);
  progressBar.style.width = `${pct}%`;
  progressText.textContent = `Misión ${done} de ${challenges.length}`;
  progressPercent.textContent = `${pct}%`;
  xpEl.textContent = xp;
  correctEl.textContent = correct;
  missionCount.textContent = `${String(Math.min(current + 1, challenges.length)).padStart(2,"0")} / ${String(challenges.length).padStart(2,"0")}`;
}

function showChallenge(c) {
  challengeOpen = true;
  answered = false;
  seconds = 20;
  clearInterval(timer);
  timerEl.textContent = seconds;

  document.getElementById("challengeTitle").textContent = c.title;
  document.getElementById("challengeQuestion").textContent = c.question;
  document.getElementById("challengeIcon").textContent = c.icon;
  feedback.textContent = "";
  feedback.className = "feedback";
  continueBtn.classList.add("hidden");
  answers.innerHTML = "";

  c.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    btn.addEventListener("click", () => chooseAnswer(index));
    answers.appendChild(btn);
  });

  missionTitle.textContent = c.title;
  missionDescription.textContent = "Responde el reto para continuar con la clase.";
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  timer = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      if (!answered) chooseAnswer(-1);
    }
  }, 1000);
}

function chooseAnswer(index) {
  if (answered) return;
  answered = true;
  clearInterval(timer);

  const c = challenges[current];
  const buttons = [...answers.querySelectorAll(".answer")];
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === c.answer) b.classList.add("correct");
    if (i === index && index !== c.answer) b.classList.add("wrong");
  });

  if (index === c.answer) {
    correct++;
    xp += c.xp;
    feedback.textContent = `✓ ${c.explanation} +${c.xp} XP`;
    feedback.className = "feedback good";
  } else {
    feedback.textContent = index === -1
      ? `⏱️ Se acabó el tiempo. ${c.explanation}`
      : `✕ No esta vez. ${c.explanation}`;
    feedback.className = "feedback bad";
  }

  xpEl.textContent = xp;
  correctEl.textContent = correct;
  continueBtn.classList.remove("hidden");
}

continueBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  challengeOpen = false;
  current++;
  updateDashboard();

  if (current >= challenges.length) {
    finish();
    return;
  }

  missionTitle.textContent = "Sigue observando";
  missionDescription.textContent = "El siguiente reto aparecerá automáticamente durante la explicación.";
  playVideo();
});

function finish() {
  pauseVideo();
  document.getElementById("finalXP").textContent = xp;
  document.getElementById("finalCorrect").textContent = `${correct}/${challenges.length}`;
  document.getElementById("finalMessage").textContent =
    correct >= 5
      ? "Excelente trabajo. Completaste todos los retos de esta clase."
      : "Actividad completada. Puedes repetirla para reforzar los conceptos.";
  finalOverlay.classList.remove("hidden");
  finalOverlay.setAttribute("aria-hidden", "false");
  progressBar.style.width = "100%";
  progressText.textContent = `Misión ${challenges.length} de ${challenges.length}`;
  progressPercent.textContent = "100%";
}

restartBtn.addEventListener("click", () => {
  current = 0;
  xp = 0;
  correct = 0;
  challengeOpen = false;
  clearInterval(timer);
  finalOverlay.classList.add("hidden");
  finalOverlay.setAttribute("aria-hidden", "true");
  restartVideo();
  updateDashboard();
  missionTitle.textContent = "Prepárate";
  missionDescription.textContent = "Mira la clase y presta atención: aparecerán retos durante la explicación.";
  playVideo();
});

function loadQuestions() {
  document.title = lessonData.lessonTitle || document.title;
  document.querySelector(".topbar h1").textContent = lessonData.lessonTitle || "Laplace Challenge";
  document.querySelector(".topbar p").textContent = lessonData.lessonDescription || "Actividad interactiva";
  document.querySelector(".stats div:nth-child(2) strong").textContent = challenges.length;
  document.getElementById("missionCount").textContent = `01 / ${String(challenges.length).padStart(2,"0")}`;
  document.getElementById("progressText").textContent = `Misión 0 de ${challenges.length}`;
  document.getElementById("finalCorrect").textContent = `0/${challenges.length}`;
  updateDashboard();
}

loadQuestions();
