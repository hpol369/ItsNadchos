"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Camera, Sparkles, AlertCircle } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import styles from "./buy.module.css";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
}

interface TokenValidation {
  valid: boolean;
  userId?: string;
  displayName?: string;
  error?: string;
}

function LoadingState() {
  return (
    <main className={styles.main}>
      <div className={styles.loadingContainer}>
        <Heart className={styles.loadingHeart} size={48} />
        <p>Loading...</p>
      </div>
    </main>
  );
}

function BuyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidation({ valid: false, error: "No token provided" });
        setLoading(false);
        return;
      }

      setValidating(true);
      try {
        const response = await fetch(`/api/validate-token?token=${token}`);
        const data = await response.json();
        setValidation(data);

        if (data.valid && data.packages) {
          setPackages(data.packages);
          // Select "popular" package by default
          setSelectedPackage("popular");
        }
      } catch {
        setValidation({ valid: false, error: "Failed to validate token" });
      } finally {
        setValidating(false);
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleCheckout() {
    if (!token || !selectedPackage) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          packageId: selectedPackage,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading || validating) {
    return <LoadingState />;
  }

  if (!validation?.valid) {
    return (
      <main className={styles.main}>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h1>Oops!</h1>
          <p>
            {validation?.error === "Token expired"
              ? "This link has expired. Please request a new one from Telegram."
              : validation?.error === "Token already used"
              ? "This link has already been used."
              : "Invalid or missing link. Please request a new one from Telegram."}
          </p>
          <Link href="https://t.me/ItsNadchos_bot" className={styles.telegramBtn}>
            <FaTelegram size={20} />
            Open Telegram
          </Link>
        </div>
      </main>
    );
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>
            <Sparkles size={24} /> Nadchos Credits
          </h1>
          {validation.displayName && (
            <p className={styles.greeting}>hey {validation.displayName} 💕</p>
          )}
        </div>

        {/* What are credits */}
        <div className={styles.infoCard}>
          <h2>What are credits?</h2>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <MessageCircle size={20} />
              <span>
                <strong>1 credit</strong> = 1 message
              </span>
            </div>
            <div className={styles.infoItem}>
              <Camera size={20} />
              <span>
                <strong>10 credits</strong> = unlock a photo
              </span>
            </div>
            <div className={styles.infoItem}>
              <Heart size={20} />
              <span>
                <strong>3 free</strong> messages daily
              </span>
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className={styles.packages}>
          {packages.map((pkg) => {
            const isPopular = pkg.id === "popular";
            const isBestValue = pkg.id === "best_value";
            const isSelected = selectedPackage === pkg.id;

            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`${styles.packageCard} ${isSelected ? styles.selected : ""} ${
                  isPopular ? styles.popular : ""
                }`}
              >
                {isPopular && <span className={styles.badge}>Most Popular</span>}
                {isBestValue && <span className={styles.badgeBest}>Best Value</span>}
                <div className={styles.credits}>{pkg.credits}</div>
                <div className={styles.creditsLabel}>credits</div>
                <div className={styles.price}>${(pkg.price_cents / 100).toFixed(2)}</div>
                <div className={styles.perCredit}>
                  ${(pkg.price_cents / 100 / pkg.credits).toFixed(3)}/credit
                </div>
              </button>
            );
          })}
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={!selectedPackage || checkoutLoading}
          className={styles.checkoutBtn}
        >
          {checkoutLoading ? (
            "Processing..."
          ) : selectedPkg ? (
            <>
              <Heart size={20} />
              Get {selectedPkg.credits} Credits - ${(selectedPkg.price_cents / 100).toFixed(2)}
            </>
          ) : (
            "Select a package"
          )}
        </button>

        {/* Footer */}
        <p className={styles.footer}>
          Secure payment powered by Stripe 💕
        </p>
      </div>
    </main>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BuyPageContent />
    </Suspense>
  );
}
