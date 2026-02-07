"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./Blackjack.module.css";
import Image from "next/image";
// Icons/Assets managed via CSS or standard img

type Suit = "♠" | "♥" | "♣" | "♦";
type Value = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Card = { suit: Suit; value: Value; hidden?: boolean };
type GameState = "BETTING" | "PLAYER_TURN" | "DEALER_TURN" | "GAME_OVER";

const SUITS: Suit[] = ["♠", "♥", "♣", "♦"];
const VALUES: Value[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export default function Blackjack() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<GameState>("BETTING");
    const [message, setMessage] = useState("Place your bet!");
    const [dealerMessage, setDealerMessage] = useState("Ready to lose? 😉");

    // --- GAME LOGIC ---

    const createDeck = () => {
        const newDeck: Card[] = [];
        for (const suit of SUITS) {
            for (const value of VALUES) {
                newDeck.push({ suit, value });
            }
        }
        return shuffle(newDeck);
    };

    const shuffle = (deck: Card[]) => {
        const newDeck = [...deck];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    };

    // Helper functions moved outside component


    // --- ACTIONS ---

    const startNewGame = () => {
        const newDeck = createDeck();
        const pHand = [newDeck.pop()!, newDeck.pop()!];

        // Define dealer hand explicitly to avoid type errors
        const dCard1 = newDeck.pop()!;
        const dCard2 = newDeck.pop()!;
        const dHand: Card[] = [dCard1, { ...dCard2, hidden: true }];

        setDeck(newDeck);
        setPlayerHand(pHand);
        setDealerHand(dHand);
        setGameState("PLAYER_TURN");
        setMessage("Your turn! Hit or Stand?");
        setDealerMessage(getRandomDealerQuote("start"));

        // Check blackjack immediately
        const pScore = calculateScore(pHand);
        if (pScore === 21) {
            // Technically should check dealer too, but simplifying
            handleGameOver("BLACKJACK", pHand, dHand);
        }
    };

    // Helper for delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleHit = () => {
        const newDeck = [...deck];
        const card = newDeck.pop()!;
        const newHand = [...playerHand, card];

        setDeck(newDeck);
        setPlayerHand(newHand);

        if (calculateScore(newHand) > 21) {
            handleGameOver("BUST", newHand, dealerHand);
        } else {
            setDealerMessage(getRandomDealerQuote("hit"));
        }
    };

    const handleStand = async () => {
        setGameState("DEALER_TURN");
        setDealerMessage("Let me see... 🤔");

        // Step 1: Reveal hidden card with suspense
        await delay(800);
        const revealedHand = dealerHand.map(c => ({ ...c, hidden: false }));
        setDealerHand(revealedHand);

        let currentHand = [...revealedHand];
        let dScore = calculateScore(currentHand);
        const deckCopy = [...deck];

        await delay(600);

        // Step 2: Dealer draws cards one by one
        while (dScore < 17) {
            setDealerMessage("I need another card...");
            await delay(900);

            const card = deckCopy.pop();
            if (!card) break;

            currentHand = [...currentHand, { ...card, hidden: false }];
            setDealerHand(currentHand);
            dScore = calculateScore(currentHand);

            if (dScore > 21) {
                setDealerMessage("No way! 😱");
            } else if (dScore >= 17) {
                setDealerMessage("That'll do.");
            }

            await delay(600);
        }

        setDeck(deckCopy);

        // Step 3: Show result
        await delay(400);
        handleGameOver("COMPARE", playerHand, currentHand);
    };

    const handleGameOver = (reason: "BUST" | "BLACKJACK" | "COMPARE", pHand: Card[], dHand: Card[]) => {
        setGameState("GAME_OVER");

        // Ensure dealer hidden card is shown if not already
        const finalDHand = dHand.map(c => ({ ...c, hidden: false }));
        setDealerHand(finalDHand); // Update visual immediately

        const pScore = calculateScore(pHand);
        const dScore = calculateScore(finalDHand);

        if (reason === "BUST") {
            setMessage("Busted! You lose.");
            setDealerMessage("Ouch! That hurts. 🤭");
        } else if (reason === "BLACKJACK") {
            setMessage("Blackjack! You win!");
            setDealerMessage("Wow! Pure luck... 💅");
        } else {
            // Compare
            if (dScore > 21) {
                setMessage("Dealer Busted! You win!");
                setDealerMessage("I... I can't believe it.");
            } else if (pScore > dScore) {
                setMessage("You Win!");
                setDealerMessage("Okay, you're good.");
            } else if (dScore > pScore) {
                setMessage("Dealer Wins!");
                setDealerMessage("House always wins, babe. 💋");
            } else {
                setMessage("Push! It's a tie.");
                setDealerMessage("Boring... let's go again.");
            }
        }
    };

    // --- QUOTES ---
    const getRandomDealerQuote = (type: "start" | "hit" | "win" | "lose") => {
        const quotes = {
            start: ["Feeling lucky?", "Don't disappoint me.", "Let's see what you got."],
            hit: ["Risky...", "I like your style.", "Another one?"],
            win: ["I knew I'd win.", "Too easy.", "Try again?"],
            lose: ["Nice hand!", "beginner's luck.", "Impressive."]
        };
        // fallback
        return quotes[type][Math.floor(Math.random() * quotes[type].length)];
    };

    // Initial load
    useEffect(() => {
        // Optional: Start immediately or wait for user to click "Deal"
        // Let's wait for user to click deal (better UX)
    }, []);

    return (
        <div className={styles.table}>

            {/* DEALER */}
            <div className={styles.dealerArea}>
                <div className={styles.dealerBubble}>{dealerMessage}</div>
                <Image
                    src="/Nadchos3.jpg"
                    alt="Dealer Nadhira"
                    className={styles.dealerAvatar}
                    width={80}
                    height={80}
                />
                <div className={styles.score}>Dealer: {gameState === "PLAYER_TURN" ? "?" : calculateScore(dealerHand)}</div>
                <div className={styles.cardsContainer}>
                    {dealerHand.map((card, i) => (
                        <CardView key={i} card={card} />
                    ))}
                </div>
            </div>

            {/* RESULT OVERLAY */}
            {gameState === "GAME_OVER" && (
                <div className={styles.resultOverlay}>
                    <h2 className={`${styles.resultTitle} ${message.includes("Win") ? styles.win : (message.includes("Push") ? styles.push : styles.lose)}`}>
                        {message}
                    </h2>
                    <button className={`${styles.btnAction} ${styles.btnNew}`} onClick={startNewGame}>
                        Play Again
                    </button>
                </div>
            )}

            {/* PLAYER */}
            <div className={styles.playerArea}>
                <div className={styles.cardsContainer}>
                    {playerHand.map((card, i) => (
                        <CardView key={i} card={card} />
                    ))}
                </div>
                <div className={styles.score}>Player: {calculateScore(playerHand)}</div>

                <div className={styles.controls}>
                    {gameState === "BETTING" && (
                        <button className={`${styles.btnAction} ${styles.btnNew}`} onClick={startNewGame}>
                            Deal Cards
                        </button>
                    )}
                    {gameState === "PLAYER_TURN" && (
                        <>
                            <button className={`${styles.btnAction} ${styles.btnHit}`} onClick={handleHit}>Hit</button>
                            <button className={`${styles.btnAction} ${styles.btnStand}`} onClick={handleStand}>Stand</button>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}

function CardView({ card }: { card: Card }) {
    if (card.hidden) {
        return <div className={`${styles.card} ${styles.cardBack}`}></div>;
    }
    const isRed = ["♥", "♦"].includes(card.suit);
    return (
        <div className={`${styles.card} ${isRed ? styles.cardRed : styles.cardBlack}`}>
            <div style={{ fontSize: '1.5rem' }}>{card.value}</div>
            <div style={{ fontSize: '1.5rem' }}>{card.suit}</div>
        </div>
    );
}

// --- HELPERS ---

const getCardValue = (card: Card) => {
    if (["J", "Q", "K"].includes(card.value)) return 10;
    if (card.value === "A") return 11;
    return parseInt(card.value);
};

const calculateScore = (hand: Card[]) => {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.hidden) continue;
        score += getCardValue(card);
        if (card.value === "A") aces += 1;
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
};
