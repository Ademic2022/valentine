import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import "./App.css";

function App() {
  const [showNoButton, setShowNoButton] = useState(false);
  const [noButtonPosition, setNoButtonPosition] = useState({
    x: "50%",
    y: "50%",
  });
  const [yesClicked, setYesClicked] = useState(false);
  const [yesButtonScale, setYesButtonScale] = useState(1);
  const [hearts, setHearts] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [lastPosition, setLastPosition] = useState(null);
  const lastSoundTime = useRef(0);

  // Predefined safe positions using percentage (always visible)
  const safePositions = [
    { x: "15%", y: "15%" },
    { x: "50%", y: "15%" },
    { x: "75%", y: "15%" },
    { x: "15%", y: "40%" },
    { x: "75%", y: "40%" },
    { x: "15%", y: "65%" },
    { x: "50%", y: "65%" },
    { x: "75%", y: "65%" },
    { x: "30%", y: "30%" },
    { x: "60%", y: "30%" },
    { x: "30%", y: "80%" },
    { x: "60%", y: "80%" },
  ];

  const isMobile = useMemo(() => window.innerWidth < 768, []);

  useEffect(() => {
    // Generate floating hearts - fewer on mobile
    const heartEmojis = ["💕", "💖", "💗", "💓", "💝", "❤️", "💘"];
    const heartCount = isMobile ? 12 : 25;
    const newHearts = Array.from({ length: heartCount }, (_, i) => ({
      id: i,
      emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
      left: Math.random() * 100,
      animationDelay: Math.random() * 8,
      size: 15 + Math.random() * 35,
      duration: 6 + Math.random() * 6,
    }));
    setHearts(newHearts);

    // Generate floating orbs - fewer on mobile
    const orbCount = isMobile ? 4 : 8;
    const newOrbs = Array.from({ length: orbCount }, (_, i) => ({
      id: i,
      size: 100 + Math.random() * 250,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 5,
      opacity: 0.15 + Math.random() * 0.15,
    }));
    setOrbs(newOrbs);
  }, [isMobile]);

  // Reuse audio context for better performance
  const getAudioContext = () => {
    if (!window.audioCtx) {
      window.audioCtx = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    return window.audioCtx;
  };

  // Sound effect functions using Web Audio API
  const playPopSound = () => {
    // Debounce: only play if at least 150ms has passed since last sound
    const now = Date.now();
    if (now - lastSoundTime.current < 150) {
      return;
    }
    lastSoundTime.current = now;

    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        audioContext.currentTime + 0.1,
      );

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio not supported
    }
  };

  const playCelebrationSound = () => {
    try {
      const audioContext = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C (major chord)

      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = "sine";

        const startTime = audioContext.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
      });
    } catch (e) {
      // Silently fail if audio not supported
    }
  };

  const handleYesClick = () => {
    setYesClicked(true);
    playCelebrationSound();

    const particleCount = isMobile ? 3 : 5;

    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff69b4", "#ff1493", "#ff6b9d", "#ffc0cb"],
      });
      confetti({
        particleCount: particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff69b4", "#ff1493", "#ff6b9d", "#ffc0cb"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Additional heart burst - fewer particles on mobile
    setTimeout(() => {
      confetti({
        particleCount: isMobile ? 50 : 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff69b4", "#ff1493", "#ff6b9d", "#ffc0cb", "#ff0000"],
        shapes: ["circle"],
        scalar: isMobile ? 1.5 : 2,
      });
    }, 300);
  };

  const handleTryOtherOption = () => {
    setShowNoButton(true);
    setYesButtonScale((prev) => prev + 0.1);

    // Pick a random safe position for initial appearance
    const randomPos =
      safePositions[Math.floor(Math.random() * safePositions.length)];
    setNoButtonPosition(randomPos);
    setLastPosition(randomPos);
  };

  const moveNoButton = (e) => {
    e.preventDefault();
    playPopSound();

    // Filter out the current position to avoid staying in same place
    const availablePositions = safePositions.filter(
      (pos) => pos.x !== lastPosition?.x || pos.y !== lastPosition?.y,
    );

    // Pick a random position from available ones
    const newPos =
      availablePositions[Math.floor(Math.random() * availablePositions.length)];

    setNoButtonPosition(newPos);
    setLastPosition(newPos);
  };

  return (
    <div className="app-container">
      {/* Floating orbs for background depth */}
      <div className="orbs-container">
        {orbs.map((orb) => (
          <motion.div
            key={orb.id}
            className="floating-orb"
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              opacity: orb.opacity,
            }}
            animate={
              isMobile
                ? {
                    scale: [1, 1.1, 1],
                  }
                : {
                    x: [0, 50, -30, 40, 0],
                    y: [0, -40, 60, -30, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1],
                  }
            }
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating hearts background */}
      <div className="hearts-container">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="floating-heart"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.animationDelay}s`,
              animationDuration: `${heart.duration}s`,
              fontSize: `${heart.size}px`,
            }}
          >
            {heart.emoji}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!yesClicked ? (
          <motion.div
            key="question"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="content-container"
          >
            <motion.h1
              className="main-message"
              animate={{
                y: [0, -10, 0],
                rotateZ: [-1, 1, -1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Deal!!! Will you be my Valentine? ❤️
            </motion.h1>

            <div className="buttons-container">
              <motion.button
                className="yes-button"
                onClick={handleYesClick}
                whileHover={{
                  scale: 1.15,
                  rotateZ: [0, -5, 5, 0],
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: yesButtonScale,
                  boxShadow:
                    yesButtonScale > 1
                      ? "0 20px 40px rgba(255, 107, 157, 0.6), 0 0 80px rgba(255, 107, 157, 0.8)"
                      : "0 10px 25px rgba(0, 0, 0, 0.2)",
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Yes 💖
              </motion.button>

              {!showNoButton ? (
                <motion.button
                  className="other-button"
                  onClick={handleTryOtherOption}
                  whileHover={{
                    scale: 1.1,
                    rotateZ: [0, 3, -3, 0],
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Try other option 🤔
                </motion.button>
              ) : (
                <motion.button
                  className="no-button"
                  onMouseEnter={moveNoButton}
                  onTouchStart={moveNoButton}
                  onClick={(e) => e.preventDefault()}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    left: noButtonPosition.x,
                    top: noButtonPosition.y,
                  }}
                  transition={{
                    left: { type: "tween", duration: 0.08, ease: "easeOut" },
                    top: { type: "tween", duration: 0.08, ease: "easeOut" },
                    opacity: { duration: 0.1 },
                  }}
                  style={{
                    position: "fixed",
                    zIndex: 9999,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  No 😅
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              type: "spring",
              bounce: 0.5,
            }}
            className="content-container success-message"
          >
            <motion.h1
              className="main-message success-text"
              animate={
                isMobile
                  ? {
                      scale: [1, 1.02, 1],
                    }
                  : {
                      scale: [1, 1.05, 1],
                      rotateZ: [-2, 2, -2],
                    }
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Yay!!! I knew you would say yes! 💘✨
            </motion.h1>

            <motion.div
              className="celebration-hearts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Array.from({ length: isMobile ? 10 : 30 }, (_, i) => (
                <motion.div
                  key={i}
                  className="celebration-heart"
                  initial={{ y: 0, opacity: 1, scale: 0 }}
                  animate={
                    isMobile
                      ? {
                          y: -300,
                          opacity: 0,
                          scale: [0, 1, 0],
                        }
                      : {
                          y: -400,
                          x: [0, (Math.random() - 0.5) * 100],
                          opacity: 0,
                          scale: [0, 1.2, 1, 0],
                          rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                        }
                  }
                  transition={{
                    duration: isMobile ? 2.5 : 3 + Math.random() * 2,
                    delay: i * 0.08,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeOut",
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    fontSize: `${1.5 + Math.random()}rem`,
                  }}
                >
                  {
                    ["❤️", "💕", "💖", "💗", "💓", "💝"][
                      Math.floor(Math.random() * 6)
                    ]
                  }
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
