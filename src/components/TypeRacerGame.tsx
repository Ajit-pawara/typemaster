import React, { useState, useEffect, useRef } from 'react';

// Racetrack Texts Bank
const RACE_TEXTS = [
  "The engine roared to life as the driver shifted into first gear, flooring the accelerator.",
  "Success on the track is not just about raw horsepower; it is about steering precision and braking control.",
  "In typing as in racing, finding a smooth and consistent rhythm is the key to achieving ultimate speed.",
  "Under the bright floodlights of the night circuit, the sleek sports cars jostled for the leading position.",
  "A true champion learns to focus entirely on the path ahead, ignoring all distractions on the sidelines."
];

// AudioContext & Synthesizer Setup (Matching TypingTest.tsx for reliable keypress beeps)
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(err => console.error('Failed to resume AudioContext:', err));
  }
  return sharedAudioCtx;
};

const playKeySound = (type: 'correct' | 'wrong' | 'space' | 'enter' | 'countdown' | 'go', volume: number = 0.2) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'space') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 1.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'enter') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(volume * 1.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(volume * 0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'countdown') {
      // Short beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(volume * 1.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'go') {
      // Long high pitch beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(volume * 2.0, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
};

interface Opponent {
  id: string;
  name: string;
  avatar: string;
  color: string;
  progress: number; // 0 to 100
  wpm: number;      // target average WPM
  finished: boolean;
  finishTime?: number;
  finalWpm?: number;
}

interface TypeRacerProps {
  user: any;
}

export default function TypeRacerGame({ user }: TypeRacerProps) {
  // Game Modes & States
  const [gameMode, setGameMode] = useState<'lobby' | 'countdown' | 'racing' | 'finished'>('lobby');
  const [raceType, setRaceType] = useState<'bots' | 'multiplayer'>('bots');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Lobby states
  const [lobbyStatus, setLobbyStatus] = useState<string>('');
  const [playersJoined, setPlayersJoined] = useState<number>(1);
  const [lobbyProgress, setLobbyProgress] = useState<number>(20); // 1 to 5 players
  
  // Race states
  const [text, setText] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);
  const [playerProgress, setPlayerProgress] = useState<number>(0);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Player Stats
  const [playerWpm, setPlayerWpm] = useState<number>(0);
  const [playerAccuracy, setPlayerAccuracy] = useState<number>(0);
  const [playerFinished, setPlayerFinished] = useState<boolean>(false);
  const [playerRank, setPlayerRank] = useState<number>(0);
  
  // Final Scoreboard
  const [scoreboard, setScoreboard] = useState<any[]>([]);
  const [savingResult, setSavingResult] = useState<boolean>(false);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const countdownTimerRef = useRef<any>(null);
  const botIntervalRef = useRef<any>(null);

  // Load sound preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typemaster_sound_enabled');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('typemaster_sound_enabled', String(newVal));
      if (newVal) getAudioContext();
    }
  };

  // Join Game / Lobby Simulation
  const handleStartRace = (type: 'bots' | 'multiplayer') => {
    setRaceType(type);
    getAudioContext(); // Warm up context

    // Reset Race States
    setTypedText('');
    setPlayerProgress(0);
    setPlayerFinished(false);
    setPlayerWpm(0);
    setPlayerAccuracy(0);
    setPlayerRank(0);
    setScoreboard([]);

    // Select text
    const selectedText = RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
    setText(selectedText);

    if (type === 'bots') {
      // Instantly generate bots based on difficulty
      let botSpeeds = [30, 45, 60, 75]; // default
      if (botDifficulty === 'easy') botSpeeds = [20, 25, 30, 35];
      else if (botDifficulty === 'hard') botSpeeds = [70, 85, 95, 110];

      const generatedBots: Opponent[] = [
        { id: 'bot1', name: 'Slow Turtle 🐢', avatar: '🐢', color: 'bg-green-500', progress: 0, wpm: botSpeeds[0], finished: false },
        { id: 'bot2', name: 'Scooter Bot 🛵', avatar: '🛵', color: 'bg-yellow-500', progress: 0, wpm: botSpeeds[1], finished: false },
        { id: 'bot3', name: 'Racer Bot 🏎️', avatar: '🏎️', color: 'bg-orange-500', progress: 0, wpm: botSpeeds[2], finished: false },
        { id: 'bot4', name: 'Cyber Speed 🚀', avatar: '🚀', color: 'bg-brand-violet', progress: 0, wpm: botSpeeds[3], finished: false },
      ];
      setOpponents(generatedBots);
      startCountdown();
    } else {
      // Simulate multiplayer match finding
      setGameMode('lobby');
      setPlayersJoined(1);
      setLobbyStatus('Searching for online opponents...');
      
      const opponentPool = [
        { name: 'ApexTypist', avatar: '🦁', color: 'bg-red-500', wpm: 72 },
        { name: 'SwiftFinger', avatar: '🦅', color: 'bg-emerald-500', wpm: 58 },
        { name: 'NeonRider', avatar: '🐺', color: 'bg-cyan-500', wpm: 84 },
        { name: 'KeyStriker', avatar: '⚡', color: 'bg-pink-500', wpm: 63 },
        { name: 'TurboWpm', avatar: '🦊', color: 'bg-amber-500', wpm: 48 },
        { name: 'MatrixType', avatar: '🦖', color: 'bg-indigo-500', wpm: 92 },
      ];

      // Shuffle pool
      const shuffled = opponentPool.sort(() => 0.5 - Math.random()).slice(0, 4);

      let currentJoined = 1;
      const interval = setInterval(() => {
        currentJoined++;
        setPlayersJoined(currentJoined);
        if (currentJoined === 5) {
          clearInterval(interval);
          setLobbyStatus('Match Found! Preparing track...');
          
          const lobbyBots: Opponent[] = shuffled.map((p, idx) => ({
            id: `player${idx + 1}`,
            name: p.name,
            avatar: p.avatar,
            color: p.color,
            progress: 0,
            wpm: p.wpm,
            finished: false
          }));
          setOpponents(lobbyBots);
          
          setTimeout(() => {
            startCountdown();
          }, 1000);
        }
      }, 800 + Math.random() * 800);
    }
  };

  // Start Countdown Sequence
  const startCountdown = () => {
    setGameMode('countdown');
    setCountdown(5);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    let currentCount = 5;
    if (soundEnabled) playKeySound('countdown');

    countdownTimerRef.current = setInterval(() => {
      currentCount--;
      setCountdown(currentCount);

      if (currentCount > 0) {
        if (soundEnabled) playKeySound('countdown');
      } else {
        clearInterval(countdownTimerRef.current);
        if (soundEnabled) playKeySound('go');
        startRace();
      }
    }, 1000);
  };

  // Start Race
  const startRace = () => {
    setGameMode('racing');
    setStartTime(Date.now());
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // Bots Progression Simulation Loop
  useEffect(() => {
    if (gameMode !== 'racing') {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      return;
    }

    botIntervalRef.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      
      setOpponents(prevBots => {
        let allFinished = true;
        const updated = prevBots.map(bot => {
          if (bot.finished) return bot;
          
          allFinished = false;
          
          // Calculate realistic incremental typing progress
          // WPM * 5 chars per word = total characters per minute.
          // Characters per 100ms interval = (WPM * 5) / 600.
          // Add organic deviation to look like human typing
          const variation = 0.8 + Math.random() * 0.4; // 80% to 120% speed fluctuation
          const charsTypedThisTick = ((bot.wpm * 5) / 600) * variation;
          const incrementalProgress = (charsTypedThisTick / text.length) * 100;
          
          let nextProgress = bot.progress + incrementalProgress;
          let isFinished = false;
          let finishTime = bot.finishTime;
          let finalWpm = bot.finalWpm;

          if (nextProgress >= 100) {
            nextProgress = 100;
            isFinished = true;
            finishTime = Date.now();
            finalWpm = bot.wpm;
          }

          return {
            ...bot,
            progress: nextProgress,
            finished: isFinished,
            finishTime,
            finalWpm
          };
        });

        return updated;
      });
    }, 100);

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [gameMode, text, startTime]);

  // Handle Typing Input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (playerFinished || gameMode !== 'racing') return;

    // Trigger AudioContext warming on typing
    getAudioContext();

    const inputVal = e.target.value;
    const currentLen = inputVal.length;

    // Restrict input to match text index
    if (inputVal !== text.substring(0, currentLen)) {
      // Wrong character typed
      if (soundEnabled) playKeySound('wrong');
      return;
    }

    // Play keystroke sounds
    if (soundEnabled && currentLen > typedText.length) {
      const lastChar = inputVal[currentLen - 1];
      if (lastChar === ' ') playKeySound('space');
      else if (lastChar === '\n') playKeySound('enter');
      else playKeySound('correct');
    }

    setTypedText(inputVal);
    
    // Update player progress
    const progressPercent = (currentLen / text.length) * 100;
    setPlayerProgress(progressPercent);

    // Calculate Live WPM and Accuracy
    const timeElapsedSec = (Date.now() - startTime) / 1000;
    const currentWpm = Math.round((currentLen / 5) / (timeElapsedSec / 60)) || 0;
    setPlayerWpm(currentWpm);
    setPlayerAccuracy(100); // Because we block wrong characters from accumulating, accuracy is 100% correct inputs.

    // Finish Condition
    if (currentLen === text.length) {
      handlePlayerFinish();
    }
  };

  // Handle Player Crossing Finish Line
  const handlePlayerFinish = () => {
    const finishTimestamp = Date.now();
    setPlayerFinished(true);

    // Count how many opponents are already finished to determine rank
    const finishedBots = opponents.filter(b => b.finished).length;
    const rank = finishedBots + 1;
    setPlayerRank(rank);

    // Build the scoreboard
    setTimeout(() => {
      const playerEntry = {
        name: user ? user.username : 'You (Guest)',
        avatar: '🏎️',
        wpm: playerWpm,
        finishTime: finishTimestamp,
        isPlayer: true
      };

      const botEntries = opponents.map(b => ({
        name: b.name,
        avatar: b.avatar,
        wpm: b.finalWpm || b.wpm,
        finishTime: b.finishTime || (startTime + (text.length / ((b.wpm * 5) / 60)) * 1000),
        isPlayer: false
      }));

      const allRacers = [playerEntry, ...botEntries].sort((a, b) => a.finishTime - b.finishTime);
      
      // Map ranks
      const finalRanks = allRacers.map((r, idx) => ({
        ...r,
        rank: idx + 1,
        timeTaken: ((r.finishTime - startTime) / 1000).toFixed(2)
      }));

      setScoreboard(finalRanks);
      setGameMode('finished');

      // Submit score to database if logged in
      if (user) {
        submitRaceResult(playerWpm);
      }
    }, 500);
  };

  // Submit Results to backend
  const submitRaceResult = async (wpm: number) => {
    setSavingResult(true);
    try {
      await fetch('/api/results/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm,
          accuracy: 100,
          mode: `typeracer_${raceType}`,
          duration: 30,
          errors: 0,
          errorKeys: {}
        })
      });
    } catch (err) {
      console.error('Failed to save race statistics:', err);
    } finally {
      setSavingResult(false);
    }
  };

  // Live Position Finder during race
  const getLivePosition = () => {
    if (playerFinished) return playerRank;
    
    // Sort all racers by current progress
    const racers = [
      { id: 'player', progress: playerProgress },
      ...opponents.map(b => ({ id: b.id, progress: b.progress }))
    ];
    racers.sort((a, b) => b.progress - a.progress);
    const index = racers.findIndex(r => r.id === 'player');
    return index + 1;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* 1. LOBBY VIEW */}
      {gameMode === 'lobby' && (
        <div className="p-8 border border-hairline bg-canvas-soft rounded-lg shadow-level-2 space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink">Select Race Mode</h2>
            <p className="text-xs text-body">Practice solo against intelligent bots or join the Arena to race against simulated live players.</p>
          </div>

          {playersJoined > 1 ? (
            // Simulated lobby join animation
            <div className="space-y-6 max-w-md mx-auto p-6 bg-canvas-soft-2 border border-hairline rounded-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-semibold text-brand-cyan">{lobbyStatus}</span>
                <span className="text-xs font-mono bg-brand-cyan/20 px-2 py-0.5 rounded text-brand-cyan font-bold">{playersJoined}/5 Players</span>
              </div>
              <div className="flex justify-center space-x-4">
                {Array.from({ length: 5 }).map((_, index) => {
                  const isJoined = index < playersJoined;
                  return (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-lg shadow-inner transition-all duration-300 ${
                        isJoined 
                          ? 'bg-ink border-brand-cyan/30 scale-105 opacity-100' 
                          : 'bg-canvas-soft border-hairline opacity-40'
                      }`}>
                        {index === 0 ? '🏎️' : (isJoined ? ['🦁', '🦅', '🐺', '⚡', '🦊', '🦖'][index] : '?')}
                      </div>
                      <span className="text-[9px] font-mono text-mute">
                        {index === 0 ? 'You' : (isJoined ? 'Joined' : 'Waiting')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="w-full bg-hairline rounded-full h-1">
                <div 
                  className="bg-brand-cyan h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(playersJoined / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            // Mode buttons
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              
              {/* Bot practice */}
              <div className="p-6 border border-hairline hover:border-brand-cyan/20 bg-canvas-soft-2 rounded-lg flex flex-col justify-between items-center space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🤖</div>
                  <h3 className="font-semibold text-ink">Single Player vs Bots</h3>
                  <p className="text-xs text-mute">Test your typing speed against AI bots. Set your desired challenge level.</p>
                </div>
                
                <div className="space-y-4 w-full">
                  {/* Difficulty choices */}
                  <div className="flex justify-center space-x-1.5 bg-canvas p-1 rounded-full border border-hairline max-w-xs mx-auto">
                    {(['easy', 'normal', 'hard'] as const).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setBotDifficulty(diff)}
                        className={`flex-1 py-1 px-3 rounded-full text-[10px] font-mono capitalize transition-all ${
                          botDifficulty === diff
                            ? 'bg-ink text-canvas font-bold'
                            : 'text-body hover:text-ink'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStartRace('bots')}
                    className="w-full py-2 bg-ink hover:opacity-90 transition-opacity text-canvas rounded text-xs font-semibold shadow-level-1"
                  >
                    Start Bot Race
                  </button>
                </div>
              </div>

              {/* Online simulator */}
              <div className="p-6 border border-hairline hover:border-brand-violet/20 bg-canvas-soft-2 rounded-lg flex flex-col justify-between items-center space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🏁</div>
                  <h3 className="font-semibold text-ink">Online Arena (5 Players)</h3>
                  <p className="text-xs text-mute">Join a matchmaking lobby. Compete in real-time on a 5-lane speed track.</p>
                </div>

                <div className="w-full">
                  <button
                    onClick={() => handleStartRace('multiplayer')}
                    className="w-full py-2 bg-brand-violet text-canvas hover:opacity-90 transition-opacity rounded text-xs font-semibold shadow-level-1"
                  >
                    Find Match & Race
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sound Toggle */}
          <div className="flex justify-center pt-2">
            <button
              onClick={toggleSound}
              className="flex items-center space-x-2 text-xs font-mono text-body hover:text-ink border border-hairline px-3 py-1 rounded bg-canvas-soft-2"
            >
              <span>{soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. COUNTDOWN VIEW */}
      {gameMode === 'countdown' && (
        <div className="p-12 border border-hairline bg-canvas-soft rounded-lg shadow-level-2 text-center space-y-6">
          <span className="text-xs uppercase font-mono text-mute tracking-widest">Get Ready to Type</span>
          <div className="text-8xl font-bold font-mono text-brand-cyan select-none animate-pulse">
            {countdown}
          </div>
          <p className="text-xs text-body font-mono">Keep your hands on the home row keys!</p>
        </div>
      )}

      {/* 3. RACING STATE */}
      {gameMode === 'racing' && (
        <div className="space-y-6">
          
          {/* RACETRACK LANES */}
          <div className="p-6 border border-hairline bg-canvas-soft rounded-lg shadow-level-2 space-y-4 relative overflow-hidden">
            {/* Start Line */}
            <div className="absolute left-[80px] top-0 bottom-0 w-[2px] bg-dashed border-l border-hairline-strong z-0"></div>
            {/* Finish Line */}
            <div className="absolute right-[50px] top-0 bottom-0 w-[4px] border-r-2 border-dashed border-brand-cyan z-0"></div>

            {/* Racetrack Lanes wrapper */}
            <div className="space-y-3 relative z-10">
              
              {/* Lane 0: Player */}
              <div className="flex items-center h-10 bg-canvas-soft-2 rounded border border-brand-cyan/20 px-3 relative">
                <span className="w-[68px] text-[10px] font-mono font-bold text-ink truncate pr-2">
                  You
                </span>
                
                {/* Lane Track bar */}
                <div className="flex-1 h-full relative">
                  {/* Player Car */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-100"
                    style={{ left: `${playerProgress}%` }}
                  >
                    <span className="text-2xl filter drop-shadow-md">🏎️</span>
                    <span className="text-[9px] font-mono bg-brand-cyan text-canvas px-1 rounded-sm ml-1 font-bold">
                      {playerWpm} WPM
                    </span>
                  </div>
                </div>

                <span className="w-8 text-right text-xs font-semibold font-mono text-brand-cyan">
                  {Math.round(playerProgress)}%
                </span>
              </div>

              {/* Lanes 1-4: Opponents */}
              {opponents.map((bot) => (
                <div key={bot.id} className="flex items-center h-10 bg-canvas-soft-2 rounded border border-hairline px-3 relative">
                  <span className="w-[68px] text-[10px] font-mono text-body truncate pr-2">
                    {bot.name}
                  </span>
                  
                  {/* Lane Track bar */}
                  <div className="flex-1 h-full relative">
                    {/* Bot Car */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-100"
                      style={{ left: `${bot.progress}%` }}
                    >
                      <span className="text-xl filter grayscale contrast-125 opacity-90">{bot.avatar}</span>
                    </div>
                  </div>

                  <span className="w-8 text-right text-xs font-mono text-body">
                    {Math.round(bot.progress)}%
                  </span>
                </div>
              ))}

            </div>
          </div>

          {/* RACING TYPING AREA */}
          <div className="p-6 border border-hairline bg-canvas rounded-lg shadow-level-2 space-y-6">
            
            {/* Live Stats Bar */}
            <div className="flex justify-between items-center text-xs font-mono border-b border-hairline pb-4 text-mute">
              <div className="flex items-center space-x-6">
                <div>Position: <span className="text-ink font-bold text-sm">{getLivePosition() === 1 ? '🥇 1st' : getLivePosition() === 2 ? '🥈 2nd' : getLivePosition() === 3 ? '🥉 3rd' : `${getLivePosition()}th`}</span></div>
                <div>WPM: <span className="text-ink font-bold text-sm">{playerWpm}</span></div>
              </div>
              <button
                onClick={toggleSound}
                className="text-mute hover:text-ink font-semibold"
              >
                {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
              </button>
            </div>

            {/* Paragraph Text Rendering */}
            <div className="relative font-mono text-base leading-relaxed tracking-wider select-none p-2 bg-canvas-soft rounded border border-hairline min-h-[80px]">
              {text.split('').map((char, index) => {
                let colorClass = 'text-mute';
                const isTyped = index < typedText.length;
                const isCurrent = index === typedText.length;

                if (isTyped) {
                  colorClass = 'text-brand-cyan font-bold';
                }

                return (
                  <span 
                    key={index} 
                    className={`relative inline ${colorClass}`}
                  >
                    {isCurrent && (
                      <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-brand-cyan caret-blink h-[1.2em] self-center"></span>
                    )}
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Input Box */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={typedText}
                onChange={handleInput}
                disabled={playerFinished}
                rows={1}
                placeholder="Click inside the box and type the words above..."
                className="w-full p-4 font-mono text-sm bg-canvas-soft border border-hairline rounded focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 resize-none overflow-hidden text-ink placeholder-mute"
                style={{ caretColor: 'transparent' }}
              />
            </div>

          </div>
        </div>
      )}

      {/* 4. FINISHED STATE / SCOREBOARD */}
      {gameMode === 'finished' && (
        <div className="p-8 border border-hairline bg-canvas-soft rounded-lg shadow-level-3 space-y-8 max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-5xl">
              {playerRank === 1 ? '🏆' : playerRank === 2 ? '🥈' : playerRank === 3 ? '🥉' : '🏁'}
            </span>
            <h2 className="text-2xl font-bold text-ink">
              {playerRank === 1 ? 'You won the race!' : `You finished in ${playerRank === 2 ? '2nd' : playerRank === 3 ? '3rd' : `${playerRank}th`} place!`}
            </h2>
            <p className="text-xs text-body">Here is the final standings and statistics from the race.</p>
          </div>

          {/* Standings Table */}
          <div className="border border-hairline rounded-lg overflow-hidden bg-canvas">
            <div className="grid grid-cols-12 bg-canvas-soft-2 text-[10px] font-mono text-mute uppercase tracking-wider font-semibold border-b border-hairline p-3">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-5">Driver</div>
              <div className="col-span-2 text-center">Time (s)</div>
              <div className="col-span-3 text-right">Avg Speed</div>
            </div>
            
            <div className="divide-y divide-hairline">
              {scoreboard.map((racer) => (
                <div 
                  key={racer.name} 
                  className={`grid grid-cols-12 items-center p-3 text-xs ${
                    racer.isPlayer 
                      ? 'bg-brand-cyan-soft/40 font-bold border-l-4 border-brand-cyan' 
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="col-span-2 text-center font-mono">
                    {racer.rank === 1 ? '🥇' : racer.rank === 2 ? '🥈' : racer.rank === 3 ? '🥉' : racer.rank}
                  </div>
                  <div className="col-span-5 flex items-center space-x-2">
                    <span className="text-lg">{racer.avatar}</span>
                    <span className="text-ink truncate">{racer.name}</span>
                  </div>
                  <div className="col-span-2 text-center font-mono">{racer.timeTaken}s</div>
                  <div className="col-span-3 text-right font-mono font-bold text-brand-cyan">
                    {racer.wpm} <span className="text-[9px] text-mute font-normal">WPM</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleStartRace(raceType)}
              className="py-2.5 px-6 bg-ink text-canvas hover:opacity-90 transition-opacity text-xs font-semibold rounded shadow-level-1"
            >
              Race Again
            </button>
            <button
              onClick={() => setGameMode('lobby')}
              className="py-2.5 px-6 border border-hairline text-body hover:text-ink hover:bg-canvas-soft-2 transition-colors text-xs font-semibold rounded"
            >
              Back to Lobby
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
