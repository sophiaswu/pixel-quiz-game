import { useState } from 'react';
import { Gamepad2, Loader2, Trophy, Skull } from 'lucide-react';

type Question = {
  id: string | number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
};

type GameStatus = 'LOGIN' | 'LOADING' | 'PLAYING' | 'SUBMITTING' | 'RESULT';

function App() {
  const [status, setStatus] = useState<GameStatus>('LOGIN');
  const [playerId, setPlayerId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL || '';
  const PASS_THRESHOLD = parseInt(import.meta.env.VITE_PASS_THRESHOLD || '3');
  const QUESTION_COUNT = parseInt(import.meta.env.VITE_QUESTION_COUNT || '5');

  const startGame = async () => {
    if (!playerId.trim()) {
      setErrorMsg('請輸入玩家 ID');
      return;
    }
    if (!GAS_URL || GAS_URL.includes('這裡請填入')) {
      setErrorMsg('後端 URL 尚未設定！');
      return;
    }
    setErrorMsg('');
    setStatus('LOADING');
    try {
      const res = await fetch(`${GAS_URL}?action=getQuestions&count=${QUESTION_COUNT}`);
      const text = await res.text();
      // Handle potential HTML error response from GAS redirects
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('API 無法解析，請確認 GAS 網址與部署狀態');
      }
      
      if (data.error) throw new Error(data.error);
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('找不到題目');
      }
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setStatus('PLAYING');
    } catch (err: any) {
      setErrorMsg(err.message || '載入題目失敗');
      setStatus('LOGIN');
    }
  };

  const handleAnswer = (optionKey: string) => {
    const currentQ = questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: optionKey };
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitGame(newAnswers);
    }
  };

  const submitGame = async (finalAnswers: Record<string, string>) => {
    setStatus('SUBMITTING');
    try {
      const payload = {
        action: 'submit',
        id: playerId,
        answers: finalAnswers,
        threshold: PASS_THRESHOLD,
      };
      const res = await fetch(GAS_URL, {
        method: 'POST',
        // Use text/plain to avoid CORS preflight issues with GAS
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
      setStatus('RESULT');
    } catch (err: any) {
      setErrorMsg('傳送成績失敗...');
      setStatus('LOGIN'); 
    }
  };

  const resetGame = () => {
    setStatus('LOGIN');
    setResult(null);
    setCurrentIndex(0);
    setAnswers({});
    setPlayerId('');
  };

  if (status === 'LOGIN') {
    return (
      <div className="app-container">
        <div className="center-content">
          <Gamepad2 size={64} color="var(--primary-color)" style={{ marginBottom: 20 }} />
          <h1>像素問答挑戰</h1>
          <p style={{ marginBottom: 40, color: 'var(--secondary-color)' }}>
            輸入 ID 開始你的冒險
          </p>
          <input
            type="text"
            className="pixel-input"
            placeholder="PLAYER ID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startGame()}
          />
          {errorMsg && <p className="error-text blink">{errorMsg}</p>}
          <button className="pixel-btn" onClick={startGame}>INSERT COIN (START)</button>
        </div>
      </div>
    );
  }

  if (status === 'LOADING' || status === 'SUBMITTING') {
    return (
      <div className="app-container">
        <div className="center-content">
          <Loader2 size={48} className="blink" color="var(--secondary-color)" />
          <h2 style={{ marginTop: 20 }}>
            {status === 'LOADING' ? 'LOADING STAGE...' : 'CALCULATING SCORE...'}
          </h2>
        </div>
      </div>
    );
  }

  if (status === 'PLAYING') {
    const q = questions[currentIndex];
    // DiceBear Pixel-art style boss image based on question ID
    const bossImgUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=boss_${q.id}`;
    
    return (
      <div className="app-container">
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <p>STAGE {currentIndex + 1}/{questions.length}</p>
          <p>PLAYER: {playerId}</p>
        </div>

        <div className="boss-container">
          <img src={bossImgUrl} alt="boss" className="boss-img" />
        </div>

        <p className="question-text">{q.question}</p>

        <div className="options-grid">
          {Object.entries(q.options).map(([key, text]) => (
            <button key={key} className="pixel-btn" onClick={() => handleAnswer(key)}>
              {key}. {text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'RESULT' && result) {
    return (
      <div className="app-container">
        <div className="center-content">
          {result.passed ? (
            <Trophy size={80} color="#ffd700" style={{ marginBottom: 20 }} />
          ) : (
            <Skull size={80} color="var(--primary-color)" style={{ marginBottom: 20 }} />
          )}
          
          <h1 style={{ color: result.passed ? '#ffd700' : 'var(--primary-color)' }}>
            {result.passed ? 'STAGE CLEAR' : 'GAME OVER'}
          </h1>
          
          <div style={{ margin: '30px 0', fontSize: '14px', lineHeight: '2' }}>
            <p>SCORE: {result.score} / {result.total}</p>
            <p>REQUIRED: {PASS_THRESHOLD}</p>
            <br />
            <p className={result.passed ? 'blink' : ''} style={{ color: result.passed ? '#0f0' : '#888' }}>
              {result.passed ? 'MISSION ACCOMPLISHED' : 'YOU FAILED THE MISSION'}
            </p>
          </div>

          <button className="pixel-btn" onClick={resetGame}>CONTINUE?</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
