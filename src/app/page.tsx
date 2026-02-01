"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";
import { FaInstagram, FaTiktok, FaTelegram } from "react-icons/fa";
import { SiKick } from "react-icons/si";
import styles from "./page.module.css";

export default function Home() {
  const [showToast, setShowToast] = useState(false);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <main className={styles.main}>
      {/* Toast Notification */}
      <div className={`${styles.toast} ${showToast ? styles.showToast : ''}`}>
        Coming soon
      </div>

      {/* Floating Bubbles */}
      <div className={styles.bubbles}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.bubble}></div>
        ))}
      </div>

      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>ItsNadchos</h1>
          <p className={styles.tagline}>
            don't love the game, love the <span>player</span>
          </p>
        </div>

        <div className={styles.heroImageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/hero.png"
            alt="ItsNadchos"
            className={styles.heroImage}
          />
        </div>

        <div className={styles.heroCTA}>
          <Link href="#" onClick={handleComingSoon} className={styles.btnPrimary}>
            <MessageCircle size={20} />
            Come say Hi!
          </Link>
          <Link href="https://kick.com/itsnadchos" target="_blank" className={styles.btnSecondary}>
            <SiKick size={20} />
            Watch Stream
          </Link>
        </div>
      </section>

      {/* GALLERY SECTION - Floating Photos */}
      <section className={styles.gallerySection}>
        <h2 className={styles.sectionTitle}>Visuals</h2>

        <div className={styles.floatingGallery}>
          <div className={`${styles.floatingPhoto} ${styles.photo1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/photo1.png" alt="Nadchos" />
          </div>
          <div className={`${styles.floatingPhoto} ${styles.photo2}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/photo2.png" alt="Nadchos" />
          </div>
        </div>
      </section>

      {/* CONNECT SECTION */}
      <section className={styles.connectSection}>
        <h2 className={styles.sectionTitle}>Connect</h2>

        <div className={styles.linkCards}>
          <div className={styles.topRow}>
            <Link href="https://tiktok.com/@itsnadchos" target="_blank" className={styles.linkCard}>
              <FaTiktok size={28} />
              <div>
                <span className={styles.linkTitle}>TikTok</span>
                <span className={styles.linkSub}>@itsnadchos</span>
              </div>
              <ArrowRight size={20} />
            </Link>

            <Link href="https://kick.com/itsnadchos" target="_blank" className={styles.linkCard}>
              <SiKick size={28} />
              <div>
                <span className={styles.linkTitle}>Kick</span>
                <span className={styles.linkSub}>@ItsNadchos</span>
              </div>
              <ArrowRight size={20} />
            </Link>

            <Link href="https://instagram.com/itsnadchos" target="_blank" className={styles.linkCard}>
              <FaInstagram size={28} />
              <div>
                <span className={styles.linkTitle}>Instagram</span>
                <span className={styles.linkSub}>@itsnadchos</span>
              </div>
              <ArrowRight size={20} />
            </Link>
          </div>

          <Link href="#" onClick={handleComingSoon} className={`${styles.linkCard} ${styles.telegramCard}`}>
            <FaTelegram size={28} />
            <div>
              <span className={styles.linkTitle}>Telegram</span>
              <span className={styles.linkSub}>Say hi to me directly!</span>
            </div>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* QUOTE SECTION */}
      <section className={styles.quoteSection}>
        <div className={styles.quoteCard}>
          <p>
            "It's not just about the game, it's about the <span>vibes</span> we create together."
          </p>
          <Heart className={styles.heartIcon} size={28} fill="currentColor" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerSocials}>
          <Link href="https://kick.com/itsnadchos" target="_blank"><SiKick size={22} /></Link>
          <Link href="#" onClick={handleComingSoon}><FaTelegram size={22} /></Link>
          <Link href="https://instagram.com/itsnadchos" target="_blank"><FaInstagram size={22} /></Link>
          <Link href="https://tiktok.com/@itsnadchos" target="_blank"><FaTiktok size={22} /></Link>
        </div>
        <p>© 2025 ItsNadchos</p>
      </footer>
    </main>
  );
}
