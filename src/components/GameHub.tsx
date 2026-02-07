"use client";

import { useState } from "react";
import styles from "./GameHub.module.css";
import FlappyNadhira from "./FlappyNadhira";
import Blackjack from "./Blackjack";
import { ArrowLeft } from "lucide-react";

type GameType = null | "flappy" | "blackjack";

export default function GameHub() {
    const [activeGame, setActiveGame] = useState<GameType>(null);

    return (
        <div className={styles.arcadeContainer}>

            {/* MENU */}
            {!activeGame && (
                <div className={styles.menuGrid}>
                    {/* Flappy Nadhira */}
                    <div
                        className={`${styles.gameCard} ${styles.flappyCard}`}
                        onClick={() => setActiveGame("flappy")}
                    >
                        <span className={styles.cardIcon}>🦋</span>
                        <h3 className={styles.cardTitle}>Flappy Nadhira</h3>
                        <p className={styles.cardDesc}>Help little Nadhira fly through the nachos!</p>
                        <span className={styles.playButton}>Play Now</span>
                    </div>

                    {/* Blackjack */}
                    <div
                        className={`${styles.gameCard} ${styles.blackjackCard}`}
                        onClick={() => setActiveGame("blackjack")}
                    >
                        <span className={styles.cardIcon}>🃏</span>
                        <h3 className={styles.cardTitle}>Blackjack</h3>
                        <p className={styles.cardDesc}>Beat Dealer Nadhira to 21!</p>
                        <span className={styles.playButton}>Play Now</span>
                    </div>

                    {/* Coming Soon */}
                    <div className={`${styles.gameCard} ${styles.comingSoonCard}`}>
                        <span className={styles.cardIcon}>🔒</span>
                        <h3 className={styles.cardTitle}>Coming Soon</h3>
                        <p className={styles.cardDesc}>More games unlocking soon...</p>
                    </div>
                </div>
            )}

            {/* ACTIVE GAME WRAPPER */}
            {activeGame && (
                <div className={styles.activeGameWrapper}>
                    <button
                        className={styles.backButton}
                        onClick={() => setActiveGame(null)}
                    >
                        <ArrowLeft size={18} />
                        Back to Arcade
                    </button>

                    {activeGame === "flappy" && <FlappyNadhira />}
                    {activeGame === "blackjack" && <Blackjack />}
                </div>
            )}

        </div>
    );
}
