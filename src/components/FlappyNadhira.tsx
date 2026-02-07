"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FlappyNadhira.module.css";
import { Trophy, RefreshCw, Play } from "lucide-react";

export default function FlappyNadhira() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAME_OVER">("START");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("flappyNadhiraHighScore");
            return saved ? parseInt(saved) : 0;
        }
        return 0;
    });

    // Physics Constants - tuned for 60fps reference
    // These value are multiplied by delta (1.0 at 60fps)
    const GRAVITY = 0.4;
    const JUMP = -7;
    const PIPE_SPEED = 3;
    const PIPE_SPAWN_INTERVAL = 1800; // ms
    const FIRST_PIPE_DELAY = 2000; // ms
    const PIPE_GAP = 160;

    // Mutable game state
    const birdRef = useRef({ y: 200, velocity: 0, radius: 20 });
    const pipesRef = useRef<{ x: number; topHeight: number; passed: boolean }[]>([]);
    const frameRef = useRef(0);
    const animationRef = useRef<number>(0);
    const birdImgRef = useRef<HTMLImageElement | null>(null);

    // Load assets
    useEffect(() => {

        const img = new Image();
        img.src = "/Nadchos3.jpg";
        img.onload = () => { birdImgRef.current = img; };

        // Handle high-DPI scaling
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Get the display size
            const displayWidth = Math.min(window.innerWidth - 32, 600); // Responsive width
            const displayHeight = 400;

            // Scale by DPR
            const dpr = window.devicePixelRatio || 1;
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;

            // Normalize coordinate system to logical pixels
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);

            // Style width/height must match display size
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial setup

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startGame = () => {
        setGameState("PLAYING");
        setScore(0);
        birdRef.current = { y: 200, velocity: 0, radius: 20 };
        pipesRef.current = [];
        frameRef.current = 0;
    };

    const jump = useCallback(() => {
        if (gameState === "PLAYING") {
            birdRef.current.velocity = JUMP;
        }
    }, [gameState, JUMP]);

    const gameOver = useCallback(() => {
        setGameState("GAME_OVER");
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        // Check local storage directly to ensure we have latest, or trust state if sync
        const currentHigh = parseInt(localStorage.getItem("flappyNadhiraHighScore") || "0");
        if (score > currentHigh) {
            setHighScore(score);
            localStorage.setItem("flappyNadhiraHighScore", score.toString());
        }
    }, [score]);

    useEffect(() => {
        if (gameState !== "PLAYING") return;

        let lastTime = performance.now();
        let gameTime = 0;
        let lastPipeTime = 0;

        const loop = (currentTime: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;

            // Logical size (independent of pixel density)
            const width = parseFloat(canvas.style.width);
            const height = parseFloat(canvas.style.height);

            // Time calculation
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Cap delta time to prevent spiraling (max ~100ms or 10fps)
            // This prevents the bird from teleporting through floor if tab was backgrounded
            const safeDelta = Math.min(deltaTime, 100);

            // Normalize to 60fps (16.67ms per frame)
            const delta = safeDelta / 16.67;

            gameTime += safeDelta;
            frameRef.current++;

            // --- UPDATE PHYSICS ---
            const bird = birdRef.current;
            bird.velocity += GRAVITY * delta;
            bird.y += bird.velocity * delta;

            // Pipe Logic
            if (gameTime > FIRST_PIPE_DELAY && gameTime - lastPipeTime > PIPE_SPAWN_INTERVAL) {
                lastPipeTime = gameTime;

                const minPipe = 50;
                const maxPipe = height - PIPE_GAP - 50;
                const randomHeight = Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;

                pipesRef.current.push({
                    x: width,
                    topHeight: randomHeight,
                    passed: false
                });
            }

            // Move Pipes
            for (let i = pipesRef.current.length - 1; i >= 0; i--) {
                const pipe = pipesRef.current[i];
                pipe.x -= PIPE_SPEED * delta;

                // Remove if offscreen
                if (pipe.x < -60) {
                    pipesRef.current.splice(i, 1);
                }
            }

            // --- COLLISION ---
            // Floor/Ceiling
            if (bird.y + bird.radius >= height || bird.y - bird.radius <= 0) {
                gameOver();
                return;
            }

            // Pipes
            // Bird X is fixed at 80px visual
            const birdX = 80;
            const pad = 6; // slightly forgiving hitbox

            for (const pipe of pipesRef.current) {
                const pipeW = 50;

                // Horizontal overlap
                // Bird right > Pipe left AND Bird left < Pipe right
                if (birdX + bird.radius - pad > pipe.x && birdX - bird.radius + pad < pipe.x + pipeW) {
                    // Vertical overlap
                    // Bird Top < Pipe Top Height OR Bird Bottom > Pipe Bottom Start
                    if (bird.y - bird.radius + pad < pipe.topHeight ||
                        bird.y + bird.radius - pad > pipe.topHeight + PIPE_GAP) {
                        gameOver();
                        return;
                    }
                }

                // Score
                if (!pipe.passed && birdX > pipe.x + pipeW) {
                    setScore(s => s + 1);
                    pipe.passed = true;
                }
            }

            // --- DRAW ---
            // We use the scaled context, so we draw in logical pixels (0..width, 0..height)
            ctx.clearRect(0, 0, width, height);

            // Pipes
            ctx.fillStyle = "#ff5c8d";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;

            pipesRef.current.forEach(pipe => {
                const w = 50;

                // Top Pipe
                ctx.fillRect(pipe.x, 0, w, pipe.topHeight);
                ctx.strokeRect(pipe.x, 0, w, pipe.topHeight);

                // Bottom Pipe
                const bottomY = pipe.topHeight + PIPE_GAP;
                const bottomH = Math.max(0, height - bottomY); // Ensure valid height
                ctx.fillRect(pipe.x, bottomY, w, bottomH);
                ctx.strokeRect(pipe.x, bottomY, w, bottomH);

                // Caps
                ctx.fillStyle = "#ffe4ec";
                ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, w + 4, 20);
                ctx.fillRect(pipe.x - 2, bottomY, w + 4, 20);
                ctx.fillStyle = "#ff5c8d";
            });

            // Bird
            ctx.save();
            ctx.translate(birdX, bird.y);
            const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));
            ctx.rotate(rotation);

            if (birdImgRef.current) {
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(birdImgRef.current, -bird.radius, -bird.radius, bird.radius * 2, bird.radius * 2);
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#FFD700";
                ctx.fill();
            }
            ctx.restore();

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationRef.current);
    }, [gameState, gameOver]);

    return (
        <div className={styles.container}>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={(e) => {
                    // Only jump if primary button
                    if (e.button === 0) jump();
                }}
                onTouchStart={(e) => {
                    e.preventDefault(); // Prevent scrolling
                    // prevent ghost clicks if needed, but usually e.preventDefault is enough
                    jump();
                }}
                style={{ touchAction: 'none' }} // Critical for mobile
            />

            {gameState === "PLAYING" && (
                <div className={styles.scoreBoard}>{score}</div>
            )}

            {gameState === "START" && (
                <div className={styles.overlay}>
                    <h2 className={styles.title}>Flappy Nadhira</h2>
                    <p className={styles.subtitle}>Help little Nadhira fly!</p>
                    <button className={styles.startButton} onClick={startGame}>
                        <Play size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                        Start Game
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                        Tap or Click to Jump
                    </p>
                </div>
            )}

            {gameState === "GAME_OVER" && (
                <div className={styles.overlay}>
                    <h2 className={styles.title} style={{ color: '#ff69b4' }}>Game Over!</h2>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', backdropFilter: 'blur(4px)' }}>
                        <p className={styles.subtitle} style={{ margin: '0.5rem 0' }}>Score: {score}</p>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <Trophy size={16} color="#FFD700" />
                            Best: {highScore}
                        </p>
                    </div>
                    <button className={styles.startButton} onClick={startGame}>
                        <RefreshCw size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
