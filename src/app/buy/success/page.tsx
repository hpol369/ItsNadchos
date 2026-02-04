"use client";

import Link from "next/link";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import styles from "../buy.module.css";

export default function SuccessPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.errorContainer} style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <Sparkles size={48} style={{ color: "var(--color-pink-hot)" }} />
          </div>
          <h1 style={{ color: "var(--color-pink-deep)", marginBottom: "0.5rem" }}>
            Payment Successful!
          </h1>
          <p style={{ marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Your credits have been added to your account.
            <br />
            Head back to Telegram to start chatting! 💕
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <Link href="https://t.me/ItsNadchos_bot" className={styles.telegramBtn}>
              <FaTelegram size={20} />
              Back to Telegram
              <ArrowRight size={16} />
            </Link>
          </div>
          <p style={{
            marginTop: "2rem",
            fontSize: "0.9rem",
            opacity: 0.7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <Heart size={16} fill="currentColor" />
            thank you for your support!
          </p>
        </div>
      </div>
    </main>
  );
}
