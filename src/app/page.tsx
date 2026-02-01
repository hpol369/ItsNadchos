import Link from "next/link";
import { Play, Heart, MessageCircle, ArrowRight } from "lucide-react";
import { FaInstagram, FaTiktok, FaTelegram } from "react-icons/fa";
import { SiKick } from "react-icons/si";
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
              href="https://t.me/your_telegram"
              className={styles.btnPrimary}
            >
              <MessageCircle size={20} fill="currentColor" />
              Come say Hi to me!
            </Link>

            <Link
              href="https://kick.com/your_channel"
              className={styles.btnSecondary}
            >
              <SiKick size={20} />
              Watch My Stream
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
              src="/photos/photo2.jpg"
              alt="Nadchos - Lace dress"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 2 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/photo1.jpg"
              alt="Nadchos - Black bodysuit"
              className={styles.galleryImage}
            />
          </div>

          {/* Item 3 */}
          <div className={styles.galleryItem}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/photo3.jpg"
              alt="Nadchos - Cowgirl style"
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
          <Link href="https://t.me/your_telegram" className={styles.actionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <MessageCircle className={styles.actionIcon} />
              <div>
                <div className={styles.actionTitle}>Telegram Channel</div>
                <div className={styles.actionSubtitle}>Come say hi to me directly!</div>
              </div>
            </div>
            <ArrowRight size={20} className={styles.actionIcon} />
          </Link>

          <Link href="https://kick.com/your_channel" className={styles.actionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <SiKick className={styles.actionIcon} size={24} />
              <div>
                <div className={styles.actionTitle}>Kick Stream</div>
                <div className={styles.actionSubtitle}>Watch me live!</div>
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
          <Link href="https://kick.com/your_channel" className={styles.socialIcon}><SiKick size={20} /></Link>
          <Link href="https://t.me/your_telegram" className={styles.socialIcon}><FaTelegram size={20} /></Link>
          <Link href="#" className={styles.socialIcon}><FaInstagram size={20} /></Link>
          <Link href="#" className={styles.socialIcon}><FaTiktok size={20} /></Link>
        </div>
        <p>© 2024 ItsNadchos. 18+ Content Disclaimer.</p>
      </footer>

    </main>
  );
}
