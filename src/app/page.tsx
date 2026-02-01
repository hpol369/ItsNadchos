import Link from "next/link";
import { Play, Heart, MessageCircle, ArrowRight } from "lucide-react";
import { FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Floating Bubbles */}
      <div className={styles.bubbles}>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
        <div className={styles.bubble}></div>
      </div>

      {/*
        HERO SECTION
      */}
      <section className={styles.hero}>

        {/* Layer 1: Ambient Background */}
        <div className={styles.heroBackground} />

        {/* Layer 2: The Girl (Cutout) */}
        <div className={styles.heroImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/hero.png"
            alt="ItsNadchos"
            className={styles.heroImage}
          />
        </div>

        {/* Layer 3: Title at TOP */}
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            ItsNadchos
          </h1>
          <p className={styles.tagline}>
            Confident. Playful. <span>Yours.</span>
          </p>
        </div>

        {/* Layer 4: Buttons at BOTTOM */}
        <div className={styles.buttonContainer}>
          <div className={styles.buttonGroup}>
            <Link
              href="#live"
              className={styles.btnPrimary}
            >
              <Play size={20} fill="currentColor" />
              Watch Me Live
            </Link>

            <Link
              href="#community"
              className={styles.btnSecondary}
            >
              <Heart size={20} fill="currentColor" />
              Join Community
            </Link>
          </div>
        </div>
      </section>

      {/*
        VISUAL GALLERY
      */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          ✨ Visuals ✨
        </h2>

        <div className={styles.galleryGrid}>
          {/* Item 1 - Large vertical */}
          <div className={`${styles.galleryItem} ${styles.galleryItemLarge}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1616091093158-7755c3c0d832?q=80&w=1500&auto=format&fit=crop"
              alt="Nadchos Mood"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 2 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1606814893907-c2e42943c91f?q=80&w=1500&auto=format&fit=crop"
              alt="Stream Setup"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 3 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=1500&auto=format&fit=crop"
              alt="Gaming Vibe"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 4 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1534008779836-397a7da931d6?q=80&w=1500&auto=format&fit=crop"
              alt="Lifestyle"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 5 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1493612276216-9c7837066e90?q=80&w=1500&auto=format&fit=crop"
              alt="Community"
              className={styles.galleryImage}
            />
          </div>
        </div>
      </section>

      {/*
        LINKS / ACTIONS
      */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          💖 Connect 💖
        </h2>
        <div className={styles.actions}>
          <Link href="#" className={styles.actionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Play className={styles.actionIcon} />
              <div>
                <div className={styles.actionTitle}>Twitch Stream</div>
                <div className={styles.actionSubtitle}>Live every mon, wed, fri</div>
              </div>
            </div>
            <ArrowRight size={20} className={styles.actionIcon} />
          </Link>

          <Link href="#" className={styles.actionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <MessageCircle className={styles.actionIcon} />
              <div>
                <div className={styles.actionTitle}>Discord Community</div>
                <div className={styles.actionSubtitle}>Join the inner circle</div>
              </div>
            </div>
            <ArrowRight size={20} className={styles.actionIcon} />
          </Link>

          <Link href="#" className={styles.actionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaInstagram className={styles.actionIcon} size={24} />
              <div>
                <div className={styles.actionTitle}>Instagram</div>
                <div className={styles.actionSubtitle}>Behind the scenes</div>
              </div>
            </div>
            <ArrowRight size={20} className={styles.actionIcon} />
          </Link>
        </div>
      </section>

      {/*
        PERSONALITY
      */}
      <section className={styles.section}>
        <div className={styles.personality}>
          <p className={styles.personalityText}>
            "It's not just about the game, it's about the <span>vibes</span> we create together.
            Come say hi, don't be shy."
          </p>
          <Heart className={`${styles.heartIcon} animate-heartbeat`} size={32} fill="currentColor" />
        </div>
      </section>

      {/*
        FOOTER
      */}
      <footer className={styles.footer}>
        <div className={styles.socials}>
          <Link href="#" className={styles.socialIcon}><FaTwitter size={20} /></Link>
          <Link href="#" className={styles.socialIcon}><FaInstagram size={20} /></Link>
          <Link href="#" className={styles.socialIcon}><FaTiktok size={20} /></Link>
        </div>
        <p>© 2024 ItsNadchos. 18+ Content Disclaimer.</p>
      </footer>

    </main>
  );
}
