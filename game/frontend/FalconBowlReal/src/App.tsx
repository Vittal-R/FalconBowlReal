import React, { useState, useRef, useEffect } from 'react';

type Question = {
  quarter: number;
  number: string;
  question: string;
  answer: string;
};

type QuestionStatus = 'QuestionRead' | 'Buzzed' | 'AnswerChecked';

const initialState = {
  questions: [] as Question[],
  categories: [] as string[],
  currentQuestionIndex: 0,
  points: 0,
  power: 10,
};

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [state, setState] = useState<QuestionStatus>('QuestionRead');
  const [buzzed, setBuzzed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState('');
  const [points, setPoints] = useState(0);
  const [power, setPower] = useState(10);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [q3TimeLeft, setQ3TimeLeft] = useState(60);
  const [q3Active, setQ3Active] = useState(false);

  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const jsonData = JSON.parse(ev.target?.result as string);
        setQuestions(jsonData.questions || jsonData);
        setCategories(jsonData.categories || []);
        setCurrentQuestionIndex(0);
        setCurrentQuestion((jsonData.questions || jsonData)[0]);
        setShowCategoryModal(false);
        setResult('');
        setPoints(0);
      } catch (err) {
        setResult('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Display question logic
  useEffect(() => {
    if (questions.length === 0) return;
    const q = questions[currentQuestionIndex];
    setCurrentQuestion(q);
    setDisplayedText('');
    setCharIndex(0);
    setBuzzed(false);
    setState('QuestionRead');
    setAnswer('');
    setResult('');
    setPower(q?.quarter === 4 ? 30 : 10);

    if (typingInterval.current) clearInterval(typingInterval.current);

    if (q?.quarter === 3 && !showCategoryModal) {
      setShowCategoryModal(true);
      return;
    }

    typingInterval.current = setInterval(() => {
      setDisplayedText((prev) => {
        if (charIndex < q.question.length) {
          setCharIndex((idx) => idx + 1);
          return prev + q.question[charIndex];
        } else {
          if (typingInterval.current) clearInterval(typingInterval.current);
          return prev;
        }
      });
    }, 50);

    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  }, [currentQuestionIndex, questions, showCategoryModal]);

  // Buzz in
  const buzzIn = () => {
    if (!buzzed && state === 'QuestionRead') {
      setBuzzed(true);
      setState('Buzzed');
    }
  };

  // Skip question
  const skipQuestion = () => {
    if (state === 'Buzzed') return;
    setBuzzed(true);
    setState('Buzzed');
    setAnswer('');
    checkAnswer();
  };

  // Check answer
  const checkAnswer = () => {
    if (state !== 'Buzzed' || !currentQuestion) return;
    setState('AnswerChecked');
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.toLowerCase();
    const cleanAnswer = correctAnswer.split('(')[0].trim();
    let isCorrect = false;
    if (userAnswer === cleanAnswer || userAnswer === correctAnswer) isCorrect = true;
    if (cleanAnswer.includes(userAnswer) && userAnswer.length > 3) isCorrect = true;
    if (isCorrect) {
      setResult(`✅ ${currentQuestion.answer}`);
      setPoints((pts) => pts + power);
    } else {
      setResult(`❌ Incorrect! The correct answer was "${currentQuestion.answer}".`);
    }
  };

  // Next question
  const goToNextQuestion = () => {
    if (state === 'QuestionRead' || state === 'Buzzed') return;
    if (currentQuestionIndex + 1 >= questions.length) {
      setResult('🎉 Game Over!');
      return;
    }
    setCurrentQuestionIndex((idx) => idx + 1);
  };

  // Category modal handler
  const handleCategorySelect = (idx: number) => {
    setShowCategoryModal(false);
    // Filter Q3 questions based on category
    const quarter3Questions = questions.filter(q => q.quarter === 3);
    let startPart = 1, endPart = 8;
    if (idx === 1) { startPart = 9; endPart = 16; }
    else if (idx === 2) { startPart = 17; endPart = 24; }
    const filteredQ3 = quarter3Questions.filter(q => {
      const parts = q.number.split('.');
      const questionPart = parseInt(parts[1], 10);
      return questionPart >= startPart && questionPart <= endPart;
    });
    const quarter4Questions = questions.filter(q => q.quarter === 4);
    setQuestions([...filteredQ3, ...quarter4Questions]);
    setCurrentQuestionIndex(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showCategoryModal) return;
      if (e.code === 'Space') buzzIn();
      if (e.code === 'Enter') checkAnswer();
      if (e.key.toLowerCase() === 'n') goToNextQuestion();
      if (e.key.toLowerCase() === 's') skipQuestion();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="quiz-container">
      {showCategoryModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Select a Category</h2>
            <div>
              {categories.map((cat, i) => (
                <button key={cat} onClick={() => handleCategorySelect(i)}>{cat}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <input type="file" accept=".json" onChange={handleFileUpload} />
      <h2>
        {currentQuestion
          ? `Quarter ${currentQuestion.quarter} - Question ${currentQuestion.number.substring(2) || (currentQuestionIndex + 1)}`
          : 'Quiz Game'}
      </h2>
      <div style={{ fontSize: 24, fontWeight: 'bold' }}>
        {/* Timer logic can be added here */}
      </div>
      <h1>FalconBowl</h1>
      <div className="question-text">{displayedText}</div>
      {buzzed && state === 'Buzzed' && (
        <div className="answer-area">
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here"
          />
          <button onClick={checkAnswer}>Submit</button>
        </div>
      )}
      {!buzzed && (
        <button className="buzz-btn" onClick={buzzIn}>Buzz</button>
      )}
      <div className="result">{result}</div>
      <div id="pointsDisplay">Points: {points}</div>
      {state === 'AnswerChecked' && (
        <button onClick={goToNextQuestion}>Next Question</button>
      )}
      {state === 'QuestionRead' && (
        <button onClick={skipQuestion}>Give Up</button>
      )}
    </div>
  );
}

export default App;