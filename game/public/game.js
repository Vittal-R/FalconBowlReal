const fileInput = document.getElementById('fileInput');
const questionElement = document.getElementById('question');
const buzzBtn = document.getElementById('buzzBtn');
const answerArea = document.getElementById('answerArea');
const answerInput = document.getElementById('answerInput');
const submitAnswer = document.getElementById('submitAnswer');
const resultElement = document.getElementById('result');
const questionHeader = document.getElementById('questionHeader');
const pointsDisplay = document.getElementById('pointsDisplay'); 
const categoryModal = document.getElementById('categoryModal');
const categoryButtons = document.getElementById('categoryButtons');
const timerElement = document.getElementById('timer');

console.log("start");

// --- Buttons ---
const nextBtn = document.createElement('button');
nextBtn.textContent = "Next Question";
nextBtn.style.display = "none";
document.body.appendChild(nextBtn);

const skipBtn = document.createElement('button');
skipBtn.textContent = "Give Up";
skipBtn.style.display = "none";
document.body.appendChild(skipBtn);

// --- ENUM for question state ---
const QuestionStatus = Object.freeze({
  QUESTION_READ: "QuestionRead",
  BUZZED: "Buzzed",
  ANSWER_CHECKED: "AnswerChecked"
});

// --- Global variables ---
let questions = [];
let categories = [];
let currentQuestionIndex = 0;
let currentQuestion = null;
let state = QuestionStatus.QUESTION_READ;
let buzzed = false;
let charIndex = 0;
let typingInterval = null;
let isCorrect = false;
let points = 0;
let power = 10;
let timerStart = false;
// Q3 timer
let q3Timer = null;
let q3TimeLeft = 60;
let q3Active = false;

// Q1/Q2/Q4 auto skip
let autoSkipTimer = null;
let q3Counter = 0;

// --- Game pause flag ---
let gamePaused = false; // NEW: freezes the game during Q3 modal

// --- File upload ---
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonData = JSON.parse(e.target.result);
      questions = jsonData.questions || jsonData;
      categories = jsonData.categories || [];
      currentQuestionIndex = 0;
      currentQuestion = questions[currentQuestionIndex];

      // Reset Q3 modal
      window.categoryChosen = false;

      displayQuestion();
    } catch (err) {
      console.error("Invalid JSON file", err);
    }
  };
  reader.readAsText(file);
});

// --- Display Q3 questions based on category ---
function displayQuarter3Questions(selectedCategoryIndex) {
  const quarter3Questions = questions.filter(q => q.quarter === 3);

  let startPart = 1, endPart = 8;
  if (selectedCategoryIndex === 1) { startPart = 9; endPart = 16; }
  else if (selectedCategoryIndex === 2) { startPart = 17; endPart = 24; }

  const filteredQ3 = quarter3Questions.filter(q => {
    const parts = q.number.split('.');
    const questionPart = parseInt(parts[1], 10);
    return questionPart >= startPart && questionPart <= endPart;
  });

  const quarter4Questions = questions.filter(q => q.quarter === 4);

  questions = [...filteredQ3, ...quarter4Questions];
  currentQuestionIndex = 0;
  displayQuestion();
}

// --- Start Q3 timer ---
function startQ3Timer() {
  console.log("EEEEEEE")
  q3TimeLeft = 60;
  timerElement.style.display = "block";
  timerElement.textContent = `Time Left: ${q3TimeLeft}s`;
  q3Active = true;

  q3Timer = setInterval(() => {
    q3TimeLeft--;
    timerElement.textContent = `Time Left: ${q3TimeLeft}s`;
    if (q3TimeLeft <= 0) {
      stopQ3Timer();
      if (currentQuestionIndex < 7) currentQuestionIndex = 7; // end Q3 questions
      state = QuestionStatus.BUZZED;
      checkAnswer();
    }
  }, 1000);
}

function stopQ3Timer() {
  if (q3Timer) {
    clearInterval(q3Timer);
    q3Timer = null;
  }
  q3Active = false;
  timerElement.style.display = "none";
  timerElement.textContent = "";
}

function stopAutoSkipTimer() {
  if (autoSkipTimer) clearTimeout(autoSkipTimer);
  autoSkipTimer = null;
}

// --- Main display function ---
function displayQuestion() {
  if (gamePaused) return; // <-- freeze everything if modal is active
  buzzBtn.style.display = "inline-block";
  currentQuestion = questions[currentQuestionIndex];

  if (currentQuestion.quarter === 3 && !window.categoryChosen) {
    window.categoryChosen = true;
    gamePaused = true; // <-- pause the game when modal is open
    showCategoryModal(categories);
    return;
  }

  if (currentQuestion.quarter === 3) q3Counter++;

  // Reset UI
  questionElement.textContent = "";
  resultElement.textContent = "";
  answerArea.style.display = "none";
  answerInput.value = "";
  buzzBtn.disabled = false;
  nextBtn.style.display = "none";
  skipBtn.style.display = "inline-block";
  buzzed = false;
  state = QuestionStatus.QUESTION_READ;
  charIndex = 0;
  isCorrect = false;

  const quarter = currentQuestion.quarter;
  const qNum = currentQuestion.number.substring(2) || (currentQuestionIndex + 1);
  questionHeader.textContent = `Quarter ${quarter} - Question ${qNum}`;
  const fullQuestionText = currentQuestion.question;

  if (typingInterval) clearInterval(typingInterval);
  power = (quarter === 4 && questionElement.textContent === "") ? 30 : 10;
  if (quarter === 3 && timerStart === false) {
    startQ3Timer();
    timerStart = true;
  }

  typingInterval = setInterval(() => {
    if (gamePaused) return; // <-- freeze typing if modal active
    if (charIndex < fullQuestionText.length && state === QuestionStatus.QUESTION_READ) {
      if (quarter === 4) {
        if (fullQuestionText[charIndex] === "+") power = 20;
        if (fullQuestionText[charIndex] === "*") power = 10;
      }
      questionElement.textContent += fullQuestionText[charIndex];
      charIndex++;
    } else {
      if (quarter !== 3) {
        stopAutoSkipTimer();
        autoSkipTimer = setTimeout(() => {
          if (state === QuestionStatus.QUESTION_READ) skipQuestion();
        }, 3000);
      }
      clearInterval(typingInterval);
    }
  }, 50);
}

// --- Buzz in ---
function buzzIn() {
  if (gamePaused) return; // <-- prevent buzz while modal active
  if (!buzzed && state === QuestionStatus.QUESTION_READ) {
    skipBtn.style.display = "none";
    buzzed = true;
    state = QuestionStatus.BUZZED;
    clearInterval(typingInterval);
    stopAutoSkipTimer();
    answerArea.style.display = "block";
    answerInput.focus();
    buzzBtn.disabled = true;
  }
}

// --- Skip (Give Up) ---
function skipQuestion() {
  if (gamePaused || state === QuestionStatus.BUZZED) return; // <-- prevent skip while modal active
  console.log("HEIF");
  buzzed = true;
  state = QuestionStatus.BUZZED;
  clearInterval(typingInterval);
  stopAutoSkipTimer();
  answerInput.value = "";
  checkAnswer();
}

// --- Check answer ---
function checkAnswer() {
  if (gamePaused) return; // <-- prevent checking while modal active
  if (state !== QuestionStatus.BUZZED) return;
  buzzBtn.style.display = "none";
  const userAnswer = answerInput.value.trim().toLowerCase();
  state = QuestionStatus.ANSWER_CHECKED;
  const correctAnswer = currentQuestion.answer.toLowerCase();
  const cleanAnswer = correctAnswer.split('(')[0].trim();

  if (userAnswer === cleanAnswer || userAnswer === correctAnswer) isCorrect = true;
  if (cleanAnswer.includes(userAnswer) && userAnswer.length > 3) isCorrect = true;

  if (isCorrect) {
    resultElement.textContent = "✅ " + currentQuestion.answer;
    points += power;
    pointsDisplay.textContent = `Points: ${points}`;
  } else {
    resultElement.textContent = `❌ Incorrect! The correct answer was "${currentQuestion.answer}".`;
    if (currentQuestion.quarter == "2" && currentQuestion.number.length == 3) {
      currentQuestionIndex += 1;
    }
    console.log(currentQuestion.number.length);
  }

  answerArea.style.display = "none";
  nextBtn.style.display = "inline-block";
  skipBtn.style.display = "none";

  // Stop timers
  stopAutoSkipTimer();
  if (currentQuestion.quarter === 3 && q3Counter >= 8) stopQ3Timer();
}

// --- Show category modal ---
function showCategoryModal(categories) {
  categoryButtons.innerHTML = "";

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      categoryModal.style.display = "none";
      gamePaused = false; // <-- unpause game when category chosen
      displayQuarter3Questions(i);
    });
    categoryButtons.appendChild(btn);
  });

  categoryModal.style.display = "block";
}

// --- Next question ---
function goToNextQuestion() {
  if (gamePaused) return; // <-- freeze next while modal active
  console.log(state);
  if (state === QuestionStatus.QUESTION_READ || state === QuestionStatus.BUZZED) {
    return;
  }
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length) {
    resultElement.textContent = "🎉 Game Over!";
    nextBtn.style.display = "none";
    skipBtn.style.display = "none";
    return;
  }
  displayQuestion();
}

// --- Keyboard controls ---
document.addEventListener('keydown', (e) => {
  if (gamePaused) return; // <-- freeze keys while modal active
  if (e.code === 'Space') buzzIn();
  if (e.code === 'Enter') checkAnswer();
  if (e.key.toLowerCase() === 'n') goToNextQuestion();
  if (e.key.toLowerCase() === 's') skipQuestion();
});

// --- Button events ---
buzzBtn.addEventListener('click', buzzIn);
submitAnswer.addEventListener('click', checkAnswer);
nextBtn.addEventListener('click', goToNextQuestion);
skipBtn.addEventListener('click', skipQuestion);
