"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FlappyNadhira.module.css";
import { Trophy, RefreshCw, Play } from "lucide-react";

export default function FlappyNadhira() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAME_OVER">("START");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game constants
    const GRAVITY = 0.2; // Very light gravity - super floaty
    const JUMP = -5; // Gentle jump
    const PIPE_SPEED = 2.5; // Slower pipes
    const PIPE_SPAWN_RATE = 110; // More time between pipes
    const FIRST_PIPE_DELAY = 180; // Extra time before first pipe
    const PIPE_GAP = 170; // Bigger gap - easier to fly through

    // Mutable game state refs for the loop
    const birdRef = useRef({ y: 200, velocity: 0, radius: 20 });
    const pipesRef = useRef<{ x: number; topHeight: number; passed: boolean }[]>([]);
    const frameRef = useRef(0);
    const animationRef = useRef<number>(0);
    const birdImgRef = useRef<HTMLImageElement | null>(null);

    // Load High Score
    useEffect(() => {
        const saved = localStorage.getItem("flappyNadhiraHighScore");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setHighScore(parseInt(saved));

        // Preload image
        const img = new Image();
        img.src = "/Nadhira5.jpg";
        img.onload = () => {
            birdImgRef.current = img;
        };
    }, []);

    const startGame = () => {
        setGameState("PLAYING");
        setScore(0);
        birdRef.current = { y: 200, velocity: 0, radius: 20 };
        pipesRef.current = [];
        frameRef.current = 0;
    };

    const jump = () => {
        if (gameState === "PLAYING") {
            birdRef.current.velocity = JUMP;
        } else if (gameState === "START" || gameState === "GAME_OVER") {
            // Optional: click to start handling if we want single-tap restart
            // startGame(); // Delegated to button for now
        }
    };

    const gameOver = useCallback(() => {
        setGameState("GAME_OVER");
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("flappyNadhiraHighScore", score.toString());
        }
    }, [score, highScore]);

    useEffect(() => {
        if (gameState !== "PLAYING") return;

        let lastTime = performance.now();
        let gameTime = 0; // Total elapsed time in ms
        let lastPipeTime = 0;
        const TARGET_FPS = 60;
        const FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms

        const loop = (currentTime: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;

            // Calculate delta time and normalize to 60fps
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            const delta = deltaTime / FRAME_TIME; // 1.0 at 60fps, 0.5 at 120fps, 2.0 at 30fps
            gameTime += deltaTime;

            // --- UPDATE ---
            frameRef.current++;

            // Bird Physics (scaled by delta)
            birdRef.current.velocity += GRAVITY * delta;
            birdRef.current.y += birdRef.current.velocity * delta;

            // Pipe Spawning (time-based instead of frame-based)
            const FIRST_PIPE_TIME = 3000; // 3 seconds before first pipe
            const PIPE_INTERVAL = 1800; // 1.8 seconds between pipes

            if (gameTime > FIRST_PIPE_TIME && gameTime - lastPipeTime > PIPE_INTERVAL) {
                lastPipeTime = gameTime;
                const minPipe = 50;
                const maxPipe = canvas.height - PIPE_GAP - 50;
                const randomHeight = Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;
                pipesRef.current.push({
                    x: canvas.width,
                    topHeight: randomHeight,
                    passed: false
                });
            }

            // Pipe Movement (scaled by delta)
            pipesRef.current.forEach(pipe => {
                pipe.x -= PIPE_SPEED * delta;
            });

            // Remove off-screen pipes
            if (pipesRef.current.length > 0 && pipesRef.current[0].x < -60) {
                pipesRef.current.shift();
            }

            // Collision Check
            const bird = birdRef.current;

            // Bounds (Floor/Ceiling)
            if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
                gameOver();
                return;
            }

            // Pipes
            pipesRef.current.forEach(pipe => {
                // Hit detection (AABB vs Circle approx)
                const pipeWidth = 50;

                // Check if within pipe horizontal area
                if (bird.radius + 10 + pipe.x > pipe.x && pipe.x < pipe.x + pipeWidth + bird.radius) {
                    // Rough horizontal overlap
                    // Check vertical: Hit TOP pipe OR Hit BOTTOM pipe
                    if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + PIPE_GAP) {
                        // Precise hitbox check not strictly needed for this simple version, but let's be fair
                        // Use simple box check for now
                        if (bird.y < pipe.topHeight + bird.radius || bird.y > pipe.topHeight + PIPE_GAP - bird.radius) {
                            // Only die if we are actually INSIDE the x-range purely
                            if (pipe.x < 100 && pipe.x + pipeWidth > 60) { // Approx bird x is usually center or fixed
                                // Actually, let's fix bird X
                            }
                        }
                    }
                }
            });

            // Better Collision: Bird is fixed at X = 80 (visual) but we draw it there.
            // Let's assume Bird X center is 80.
            const birdX = 80;

            for (const pipe of pipesRef.current) {
                const pipeW = 50;

                // Horizontal overlap
                if (birdX + bird.radius > pipe.x && birdX - bird.radius < pipe.x + pipeW) {
                    // Vertical overlap (Collision with pipe material)
                    if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + PIPE_GAP) {
                        gameOver();
                        return;
                    }
                }

                // Score update
                if (!pipe.passed && birdX > pipe.x + pipeW) {
                    setScore(s => s + 1);
                    pipe.passed = true;
                }
            }


            // --- DRAW ---
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background (Sky is CSS, maybe add clouds here if we want)

            // Pipes
            ctx.fillStyle = "#ff5c8d"; // Pink pipe
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;

            pipesRef.current.forEach(pipe => {
                const w = 50;

                // Top Pipe
                ctx.fillRect(pipe.x, 0, w, pipe.topHeight);
                ctx.strokeRect(pipe.x, 0, w, pipe.topHeight);

                // Bottom Pipe
                const bottomY = pipe.topHeight + PIPE_GAP;
                ctx.fillRect(pipe.x, bottomY, w, canvas.height - bottomY);
                ctx.strokeRect(pipe.x, bottomY, w, canvas.height - bottomY);

                // Optional: Decorate pipe caps
                ctx.fillStyle = "#ffe4ec"; // Lighter pink details
                ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, w + 4, 20); // Top Cap
                ctx.fillRect(pipe.x - 2, bottomY, w + 4, 20); // Bottom Cap
                ctx.fillStyle = "#ff5c8d"; // Reset
            });

            // Bird
            ctx.save();
            ctx.translate(birdX, bird.y);
            // Rotate based on velocity
            const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));
            ctx.rotate(rotation);

            if (birdImgRef.current) {
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(birdImgRef.current, -bird.radius, -bird.radius, bird.radius * 2, bird.radius * 2);
                // Border
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                // Fallback
                ctx.beginPath();
                ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#FFD700";
                ctx.fill();
            }
            ctx.restore();

            // Floor
            // (Handled by CSS border but we check collision against height)

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationRef.current);
    }, [gameState, gameOver]);

    return (
        <div className={styles.container}>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className={styles.canvas}
                onMouseDown={jump}
                onTouchStart={(e) => { e.preventDefault(); jump(); }} // Prevent scrolling
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
