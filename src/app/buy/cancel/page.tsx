"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import styles from "../buy.module.css";

export default function CancelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.errorContainer} style={{ textAlign: "center" }}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1>Payment Cancelled</h1>
          <p>
            No worries! Your payment was cancelled.
            <br />
            You can try again anytime 💕
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <Link href="https://t.me/ItsNadchos_bot" className={styles.telegramBtn}>
              <FaTelegram size={20} />
              Back to Telegram
            </Link>
            <button
              onClick={() => window.history.back()}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-pink-hot)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.95rem",
              }}
            >
              <ArrowLeft size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
