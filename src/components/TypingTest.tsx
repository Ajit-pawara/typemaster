import React, { useState, useEffect, useRef } from 'react';
import AdUnit from './AdUnit';

// Predefined texts for different practice modes
const TEXT_BANKS: Record<string, string[]> = {
  beginner: [
    'the quick brown fox jumps over the lazy dog',
    'practice makes perfect when learning to type fast and clean',
    'always try to keep your fingers on the home row keys',
    'focus on accuracy first and then speed will follow naturally',
    'typing is an essential skill for developers and office workers',
    'daily training will slowly build muscle memory in your hands'
  ],
  intermediate: [
    'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    'Strive not to be a success, but rather to be of value to those around you.',
    'The only way to do great work is to love what you do. If you haven not found it yet, keep looking.',
    'Vercel offers an amazing developer experience for hosting modern frontend frameworks with ease.',
    'TypeScript adds static type definitions to JavaScript, making it safer and more structured to write.'
  ],
  advanced: [
    'To be, or not to be, that is the question: Whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles...',
    'According to quantum mechanics, particles can exist in multiple states simultaneously until they are observed, collapsing the probability wave function.',
    'A database index is a data structure that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space.',
    'The Astro framework utilizes an Islands Architecture, rendering HTML on the server and hydration of interactive components only where necessary.'
  ],
  stories: [
    'Once upon a time, in a deep, whispering forest, lived a tiny clockwork dragon named Barnaby. Unlike standard dragons who breathed fire and hoarded gold, Barnaby breathed soft, glowing bubbles that smelled of lavender and hoarded lost clock gears. Every night, Barnaby would wander the forest floor, searching for discarded parts from travelers pocketwatches, dreaming of one day building a grand clock tower.',
    'Beneath the neon canopy of Neo-Tokyo, Kenji adjusted his cybernetic visor. The rain-slicked streets reflected the towering holographic advertisements of mega-corporations. Tonight was the night he would attempt to breach the firewall of Arasaka Systems. With a deep breath, his fingers flew across the virtual projection keyboard, writing lines of code that would rewrite his destiny.',
    'Deep in the Marianas Trench, where sunlight is but a distant memory, a glowing submarine named the Nautilus lowered its robotic arm. Dr. Elena Vance watched the video feed as a bizarre, luminous coral-like structure came into focus. It pulsed with a rhythmic green light, defying all known biology. This discovery could unlock clean, endless energy for the surface world.',
    'Under the heavy heat of the Serengeti, a young cheetah named Kaelen stretched his sleek, spotted limbs. The golden grasslands rippled under the afternoon breeze. A herd of gazelles grazed peacefully in the distance. Kaelen knew he had to be patient; one wrong movement or rustle of grass could alert his prey, ending the hunt before it even began.'
  ],
  spelling_easy: [
    'the cat sat on the red mat and fell asleep',
    'we like to play in the park on a sunny day',
    'he went to the small shop to buy some milk and bread',
    'she can run very fast when she wears her blue shoes',
    'it is good to drink water and eat fresh fruit every day',
    'my dog loves to run after the yellow ball'
  ],
  spelling_medium: [
    'A beautiful garden requires daily maintenance and regular watering.',
    'The calendar schedule was changed due to an unexpected challenge.',
    'Playing rhythm instruments can help children develop coordination skills.',
    'We traveled through the quiet mountain valley during our autumn vacation.',
    'A positive attitude can significantly improve your daily performance.',
    'The scientist made an important discovery about animal behavior.'
  ],
  spelling_hard: [
    'Achieving proper accommodation requires understanding complex bureaucracy.',
    'His idiosyncrasy was to maintain a colloquial yet conscientious tone.',
    'She sent a detailed questionnaire to confirm the occurrence of the event.',
    'A liaison officer is responsible for coordinating international relations.',
    'The pharmaceutical company developed an effective cure for the disease.',
    'His thesis on physics was a brilliant piece of academic writing.'
  ],
  numbers: [
    '1029 3847 5620 9182 7364 8593 2018 4756 9302 1284 7392 4810',
    '982.10 472.03 104.94 829.40 572.11 394.02 810.59 274.66',
    '12 345 6789 0123 4567 8901 2345 6789 0123 4567 8901 2345 67'
  ],
  symbols: [
    'const total = (a + b) * c; if (total >= 100) { return true; }',
    'data.map(item => item.id); // filter && format inline',
    '[{ id: 1, tags: ["web", "dev"] }, { id: 2, tags: ["css", "html"] }]',
    '!@#$%^&*()_+ `-=[]\\{}|;:\',./<>?~'
  ],
  coding: [
    'const calculateWpm = (chars, time) => {\n  return Math.round((chars / 5) / (time / 60));\n};',
    'import React, { useState, useEffect } from \'react\';\nexport default function App() {\n  const [count, setCount] = useState(0);\n}',
    'function parseUrl(url) {\n  const match = url.match(/^(https?:)\\/\\/([^\\/?#]+)/);\n  return match && match[2];\n}',
    'export async function getStaticProps() {\n  const res = await fetch(\'https://api.example.com\');\n  return { props: { data: await res.json() } };\n}'
  ]
};

const MODES_INFO: Record<string, { label: string; category: string }> = {
  beginner: { label: 'Beginner', category: 'Standard' },
  intermediate: { label: 'Intermediate', category: 'Standard' },
  advanced: { label: 'Advanced', category: 'Standard' },
  stories: { label: 'Stories', category: 'Standard' },
  coding: { label: 'Coding', category: 'Technical' },
  numbers: { label: 'Numbers', category: 'Technical' },
  symbols: { label: 'Symbols', category: 'Technical' },
  spelling_easy: { label: 'Easy Spelling', category: 'Spelling' },
  spelling_medium: { label: 'Medium Spelling', category: 'Spelling' },
  spelling_hard: { label: 'Hard Spelling', category: 'Spelling' }
};

// Web Audio API Synthesizer for high-performance sound effects
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended (browser autoplay policy security measure)
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(err => console.error('Failed to resume AudioContext:', err));
  }
  return sharedAudioCtx;
};

const playKeySound = (type: 'correct' | 'wrong' | 'space' | 'enter', volume: number = 0.25) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      // Gentle mechanical-like click: short decay, medium pitch
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'space') {
      // Woodblock-like spacebar sound: slightly lower pitch, slightly longer decay
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(volume * 1.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'enter') {
      // Typewriter bell/ding sound or crisp enter click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(volume * 1.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'wrong') {
      // Low friction error buzz: sawtooth, pitch decline
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(volume * 0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
};

interface TypingTestProps {
  user: any;
  isChallenge?: boolean;
  challengeText?: string;
  challengeDuration?: number;
}

export const TypingTest: React.FC<TypingTestProps> = ({
  user,
  isChallenge = false,
  challengeText = '',
  challengeDuration = 60
}) => {
  // Config
  const [mode, setMode] = useState<string>(isChallenge ? 'challenge' : 'beginner');
  const [duration, setDuration] = useState<number>(isChallenge ? challengeDuration : 30);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Test State
  const [text, setText] = useState<string>('');

  // Initialize Sound preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('typemaster_sound_enabled');
      if (stored !== null) {
        setSoundEnabled(stored === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('typemaster_sound_enabled', String(newVal));
      if (newVal) {
        getAudioContext();
      }
    }
  };
  const [typedText, setTypedText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  
  // Analytics
  const [correctChars, setCorrectChars] = useState<number>(0);
  const [totalTyped, setTotalTyped] = useState<number>(0);
  const [errorKeys, setErrorKeys] = useState<Record<string, number>>({});
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [liveAccuracy, setLiveAccuracy] = useState<number>(100);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [savingResult, setSavingResult] = useState<boolean>(false);
  const [isSubmittingSuccess, setIsSubmittingSuccess] = useState<boolean>(false);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Text
  useEffect(() => {
    resetTest();
  }, [mode, duration, challengeText]);

  // Handle Timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  // Live Stats Calculator
  useEffect(() => {
    if (!isActive || isFinished) return;
    
    const timeElapsed = duration - timeLeft;
    if (timeElapsed <= 0) return;

    // Standard WPM: (correct characters / 5) / minutes
    const wpm = Math.round((correctChars / 5) / (timeElapsed / 60));
    setLiveWpm(wpm);

    const acc = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
    setLiveAccuracy(acc);
  }, [correctChars, totalTyped, timeLeft, duration, isActive]);

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let selectedText = '';
    if (isChallenge && challengeText) {
      selectedText = challengeText;
    } else {
      const bank = TEXT_BANKS[mode] || TEXT_BANKS.beginner;
      selectedText = bank[Math.floor(Math.random() * bank.length)];
    }

    setText(selectedText);
    setTypedText('');
    setIsActive(false);
    setTimeLeft(isChallenge ? challengeDuration : duration);
    setIsFinished(false);
    setCorrectChars(0);
    setTotalTyped(0);
    setErrorKeys({});
    setLiveWpm(0);
    setLiveAccuracy(100);
    setUnlockedAchievements([]);
    setIsSubmittingSuccess(false);

    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 10);
  };

  const startTest = () => {
    setIsActive(true);
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalTimeElapsed = duration - timeLeft;
    const timeFactor = finalTimeElapsed > 0 ? finalTimeElapsed : duration;
    
    // Final check on WPM and Accuracy
    const finalWpm = Math.round((correctChars / 5) / (timeFactor / 60));
    const finalAcc = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
    const errorsCount = Math.max(0, totalTyped - correctChars);

    // If logged in, submit results
    if (user) {
      setSavingResult(true);
      try {
        const endpoint = isChallenge ? '/api/challenge/submit' : '/api/results/submit';
        const payload = isChallenge
          ? { wpm: finalWpm, accuracy: finalAcc }
          : {
              wpm: finalWpm,
              accuracy: finalAcc,
              mode,
              duration,
              errors: errorsCount,
              errorKeys
            };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          const data = await res.json();
          setIsSubmittingSuccess(true);
          if (data.newAchievements && data.newAchievements.length > 0) {
            setUnlockedAchievements(data.newAchievements);
          }
        }
      } catch (err) {
        console.error('Failed to submit results:', err);
      } finally {
        setSavingResult(false);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;
    
    // Ensure AudioContext is initialized/resumed on keystroke user gesture
    getAudioContext();
    
    const inputVal = e.target.value;
    
    // Start on first character typed
    if (!isActive && inputVal.length > 0) {
      startTest();
    }

    const currentLen = inputVal.length;
    const expectedChar = text[currentLen - 1];
    const typedChar = inputVal[currentLen - 1];

    if (currentLen > typedText.length) {
      // Character typed
      setTotalTyped(prev => prev + 1);
      const isCorrect = typedChar === expectedChar;
      if (isCorrect) {
        setCorrectChars(prev => prev + 1);
      } else if (expectedChar) {
        // Track mistake for heatmap (expected key was missed)
        const key = expectedChar.toLowerCase();
        // Ignore space and enter in key tracking to keep visual clean
        if (key !== ' ' && key !== '\n') {
          setErrorKeys(prev => ({
            ...prev,
            [key]: (prev[key] || 0) + 1
          }));
        }
      }

      // Play Sound Effects if enabled
      if (soundEnabled) {
        if (!isCorrect) {
          playKeySound('wrong');
        } else if (typedChar === ' ') {
          playKeySound('space');
        } else if (typedChar === '\n') {
          playKeySound('enter');
        } else {
          playKeySound('correct');
        }
      }
    } else {
      // Backspace
      // Standard typing games don't let you cheat correct character counts easily
      // Calculate correct characters on the fly by scanning typed text
      let correct = 0;
      for (let i = 0; i < inputVal.length; i++) {
        if (inputVal[i] === text[i]) correct++;
      }
      setCorrectChars(correct);
    }

    setTypedText(inputVal);

    // Auto-finish if all text is typed
    if (inputVal.length >= text.length) {
      if (isChallenge) {
        finishTest();
      } else {
        // Infinite mode: append another random text from the active bank
        const bank = TEXT_BANKS[mode] || TEXT_BANKS.beginner;
        const newText = bank[Math.floor(Math.random() * bank.length)];
        setText(prev => prev + ' ' + newText);
      }
    }
  };

  // Generate PNG Share Card client side via HTML5 Canvas
  const downloadShareCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Stark Dark Theme Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Mesh Gradient Circles/Spotlights
    ctx.globalCompositeOperation = 'screen';
    
    // Cyan spotlight
    let gradient = ctx.createRadialGradient(100, 100, 50, 200, 200, 300);
    gradient.addColorStop(0, 'rgba(80, 227, 194, 0.15)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(200, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    // Violet spotlight
    gradient = ctx.createRadialGradient(700, 350, 50, 600, 300, 300);
    gradient.addColorStop(0, 'rgba(121, 40, 202, 0.12)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(600, 300, 300, 0, Math.PI * 2);
    ctx.fill();

    // Magenta spotlight
    gradient = ctx.createRadialGradient(400, 225, 20, 400, 225, 250);
    gradient.addColorStop(0, 'rgba(255, 0, 128, 0.08)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(400, 225, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';

    // 3. Draw Outlines/Borders
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // 4. Logo Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px Inter, system-ui, sans-serif';
    ctx.fillText('TypeMaster', 50, 70);
    
    ctx.fillStyle = '#50e3c2';
    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillText('.dev', 185, 58);

    // 5. Drawing WPM & Accuracy values in bold typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 80px Inter, system-ui, sans-serif';
    ctx.fillText(String(liveWpm), 90, 230);
    
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText('WORDS PER MINUTE', 90, 270);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 80px Inter, system-ui, sans-serif';
    ctx.fillText(`${liveAccuracy}%`, 450, 230);

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText('TYPING ACCURACY', 450, 280);

    // 6. Test Settings Info
    ctx.fillStyle = '#555555';
    ctx.fillRect(50, 340, canvas.width - 100, 1); // Divider line

    ctx.fillStyle = '#888888';
    ctx.font = '400 12px "JetBrains Mono", monospace';
    ctx.fillText(`MODE: ${mode.toUpperCase()}`, 70, 385);
    ctx.fillText(`DURATION: ${duration} SECONDS`, 270, 385);
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 540, 385);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `typemaster-${liveWpm}wpm-${mode}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleContainerClick = () => {
    if (inputRef.current) inputRef.current.focus();
    // Warm up the AudioContext on click user gesture
    getAudioContext();
  };

  // Render typing letters
  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = 'text-mute'; // Default un-typed
      let isCurrent = index === typedText.length;
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className = 'text-brand-cyan font-medium';
        } else {
          className = char === ' ' 
            ? 'text-brand-pink bg-brand-pink-soft border-b border-brand-pink' 
            : 'text-brand-pink bg-brand-pink-soft';
        }
      }

      return (
        <span key={index} className={`relative inline ${className}`}>
          {isCurrent && (
            <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-brand-cyan caret-blink h-[1.2em] self-center"></span>
          )}
          {char === '\n' ? <br /> : char}
        </span>
      );
    });
  };

  return (
    <div className="w-full" ref={containerRef}>
      {/* Test Options Selection (Not displayed in daily challenges) */}
      {!isChallenge && !isActive && !isFinished && (
        <div className="flex flex-col gap-4 mb-6 border-b border-hairline pb-4">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            {/* Standard Modes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-mute uppercase font-mono tracking-wider font-semibold">Standard Modes</span>
              <div className="flex flex-wrap gap-1">
                {['beginner', 'intermediate', 'advanced', 'stories'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
                      mode === m
                        ? 'bg-ink text-canvas font-semibold shadow-level-1'
                        : 'text-body hover:bg-canvas-soft-2 border border-hairline'
                    }`}
                  >
                    {MODES_INFO[m]?.label || m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Spelling Complexity */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-mute uppercase font-mono tracking-wider font-semibold">Spelling Complexity</span>
              <div className="flex flex-wrap gap-1">
                {['spelling_easy', 'spelling_medium', 'spelling_hard'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
                      mode === m
                        ? 'bg-ink text-canvas font-semibold shadow-level-1'
                        : 'text-body hover:bg-canvas-soft-2 border border-hairline'
                    }`}
                  >
                    {MODES_INFO[m]?.label.replace(' Spelling', '') || m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Modes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-mute uppercase font-mono tracking-wider font-semibold">Specialty</span>
              <div className="flex flex-wrap gap-1">
                {['coding', 'numbers', 'symbols'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
                      mode === m
                        ? 'bg-ink text-canvas font-semibold shadow-level-1'
                        : 'text-body hover:bg-canvas-soft-2 border border-hairline'
                    }`}
                  >
                    {MODES_INFO[m]?.label || m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Time Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-hairline">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-mute uppercase font-mono tracking-wider font-semibold">Duration:</span>
              <div className="flex flex-wrap gap-1.5">
                {[30, 60, 120, 300, 600, 900, 1200, 1800].map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDuration(d);
                      setTimeLeft(d);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono transition-colors rounded-md ${
                      duration === d
                        ? 'bg-brand-cyan/20 text-brand-cyan font-bold border border-brand-cyan/30'
                        : 'text-body hover:text-ink hover:bg-canvas-soft border border-transparent'
                    }`}
                  >
                    {d >= 60 ? `${d / 60}m` : `${d}s`}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-mute font-mono">
              Selected mode: <span className="text-brand-cyan font-semibold">{MODES_INFO[mode]?.label || mode}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Typing Interface */}
      {!isFinished ? (
        <div className="relative">
          {/* Active stats bar */}
          <div className="flex items-center justify-between mb-4 px-2 font-mono text-xs text-body">
            <div className="flex items-center space-x-4">
              <div>Time: <span className="text-ink font-bold text-sm">{timeLeft}s</span></div>
              {isActive && (
                <>
                  <div>WPM: <span className="text-brand-cyan font-bold">{liveWpm}</span></div>
                  <div>Acc: <span className="text-brand-violet font-bold">{liveAccuracy}%</span></div>
                </>
              )}
            </div>
            <div className="text-[10px] text-mute uppercase tracking-widest">
              {isChallenge ? 'Daily Challenge' : `${mode} mode`}
            </div>
          </div>

          {/* Typing Area */}
          <div
            onClick={handleContainerClick}
            className="w-full min-h-[140px] p-6 rounded-lg border border-hairline bg-canvas-soft shadow-level-2 cursor-text relative overflow-hidden flex items-start justify-start text-lg md:text-xl font-mono leading-relaxed select-none focus-within:border-hairline-strong transition-colors"
          >
            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleInput}
              disabled={isFinished}
              className="absolute inset-0 opacity-0 w-full h-full cursor-text resize-none outline-none"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <div className="w-full whitespace-pre-wrap break-words">
              {renderText()}
            </div>
            
            {/* Click to Focus Overlay when not focused */}
            <div className="absolute inset-0 bg-canvas/40 backdrop-blur-[1px] opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none font-sans text-xs text-body font-medium">
              Click typing test box to type...
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center px-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={resetTest}
                className="px-4 py-1.5 border border-hairline bg-canvas-soft-2 hover:bg-hairline/20 rounded-md text-xs font-medium text-body hover:text-ink transition-colors flex items-center space-x-1"
              >
                <span>🔄</span> <span>Restart (Esc)</span>
              </button>
              
              <button
                onClick={toggleSound}
                className="px-3 py-1.5 border border-hairline bg-canvas-soft-2 hover:bg-hairline/20 rounded-md text-xs font-medium text-body hover:text-ink transition-colors flex items-center space-x-1"
                title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
                <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            <span className="text-[10px] text-mute font-mono">Tip: Just start typing to launch timer.</span>
          </div>

          {/* Banner Ad Slot underneath the active test (Never interrupts typing!) */}
          <AdUnit type="banner" />
        </div>
      ) : (
        /* Results view */
        <div className="w-full p-8 border border-hairline bg-canvas-soft rounded-lg shadow-level-3">
          <h2 className="text-xl font-semibold text-center text-ink mb-6 flex items-center justify-center space-x-2">
            <span>🎉</span>
            <span>{isChallenge ? 'Daily Challenge Complete!' : 'Test Complete!'}</span>
          </h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
            <div className="p-4 border border-hairline bg-canvas-soft-2 rounded-md shadow-level-1">
              <div className="text-3xl md:text-4xl font-semibold text-brand-cyan">{liveWpm}</div>
              <div className="text-[10px] font-mono text-mute mt-1">WORDS PER MINUTE</div>
            </div>
            <div className="p-4 border border-hairline bg-canvas-soft-2 rounded-md shadow-level-1">
              <div className="text-3xl md:text-4xl font-semibold text-brand-violet">{liveAccuracy}%</div>
              <div className="text-[10px] font-mono text-mute mt-1">TYPING ACCURACY</div>
            </div>
            <div className="p-4 border border-hairline bg-canvas-soft-2 rounded-md shadow-level-1">
              <div className="text-3xl md:text-4xl font-semibold text-brand-pink">
                {Math.max(0, totalTyped - correctChars)}
              </div>
              <div className="text-[10px] font-mono text-mute mt-1">TYPING ERRORS</div>
            </div>
            <div className="p-4 border border-hairline bg-canvas-soft-2 rounded-md shadow-level-1">
              <div className="text-3xl md:text-4xl font-semibold text-ink">{duration}s</div>
              <div className="text-[10px] font-mono text-mute mt-1">TEST DURATION</div>
            </div>
          </div>

          {/* Achievement Alert */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-6 p-4 border border-brand-cyan/20 bg-brand-cyan-soft rounded-md">
              <h4 className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-2 font-mono">🏆 Achievement Unlocked!</h4>
              {unlockedAchievements.map((ach, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm text-ink mb-1">
                  <span>{ach.icon}</span>
                  <span className="font-semibold">{ach.name}</span>
                  <span className="text-mute">— {ach.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* DB Save Status */}
          {user ? (
            <div className="mb-6 text-center text-xs text-mute font-mono">
              {savingResult ? 'Saving stats to history...' : isSubmittingSuccess ? '✓ Saved to personal history' : 'Failed to save stats to server.'}
            </div>
          ) : (
            <div className="mb-6 p-3 border border-warning/20 bg-warning-soft rounded-md text-xs text-warning text-center">
              💡 Register or Log In to save your history, track streaks, unlock achievements, and join the leaderboards!
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={resetTest}
              className="w-full sm:w-auto px-6 py-2.5 bg-ink text-canvas hover:opacity-90 rounded-full font-semibold text-sm transition-opacity shadow-level-2"
            >
              Try Again
            </button>
            <button
              onClick={downloadShareCard}
              className="w-full sm:w-auto px-6 py-2.5 border border-hairline bg-canvas hover:bg-canvas-soft-2 rounded-full font-semibold text-sm text-ink transition-colors flex items-center justify-center space-x-2"
            >
              <span>🖼️</span>
              <span>Download Share Card</span>
            </button>
          </div>

          {/* Interstitial Ad Unit shown post-test */}
          <div className="mt-8 border-t border-hairline pt-6">
            <AdUnit type="inter-test" />
          </div>
        </div>
      )}
    </div>
  );
};
export default TypingTest;
