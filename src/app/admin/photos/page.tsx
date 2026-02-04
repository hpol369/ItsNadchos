"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2, Plus } from "lucide-react";
import styles from "../admin.module.css";

interface PhotoPack {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  photo_count: number;
  is_active: boolean;
}

interface Photo {
  id: string;
  pack_id: string;
  storage_path: string;
  description: string | null;
  sort_order: number;
}

export default function PhotosPage() {
  const [packs] = useState<PhotoPack[]>([
    { id: "tier1", name: "Exclusive Starter Pack", description: "5 exclusive photos", price_cents: 499, photo_count: 5, is_active: true },
    { id: "tier2", name: "Premium Collection", description: "10 premium photos", price_cents: 1499, photo_count: 10, is_active: true },
    { id: "bundle", name: "VIP All Access", description: "20 photos + future releases", price_cents: 2499, photo_count: 20, is_active: true },
  ]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPack, setSelectedPack] = useState<string>("tier1");
  const [loading] = useState(false);

  useEffect(() => {
    // Fetch photos for selected pack
    const fetchPhotos = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setPhotos([]);
    };
    fetchPhotos();
  }, [selectedPack]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In production, upload to Supabase Storage
    console.log("Uploading files:", files);
  };

  const selectedPackData = packs.find((p) => p.id === selectedPack);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Photos</h2>
        <p>Manage photo packs and uploads</p>
      </div>

      {/* Pack Selection */}
      <div className={styles.statsGrid}>
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={styles.statCard}
            style={{
              cursor: "pointer",
              border: selectedPack === pack.id ? "2px solid #ff69b4" : "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={() => setSelectedPack(pack.id)}
          >
            <h3>{pack.name}</h3>
            <div className={styles.statValue}>${(pack.price_cents / 100).toFixed(2)}</div>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
              {pack.photo_count} photos
            </p>
          </div>
        ))}
      </div>

      {/* Photos Section */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>{selectedPackData?.name} Photos</h3>
          <label className={`${styles.button} ${styles.buttonPrimary}`}>
            <Upload size={18} />
            Upload Photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <p>Loading...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={{ padding: "24px" }}>
            <div className={styles.uploadArea}>
              <Upload size={48} style={{ color: "rgba(255,255,255,0.3)" }} />
              <p>Drag and drop photos here or click to upload</p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                Supports: JPG, PNG, WebP (max 10MB each)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.photoGrid}>
            {photos.map((photo) => (
              <div key={photo.id} className={styles.photoCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.storage_path} alt={photo.description || "Photo"} />
                <div className={styles.photoCardInfo}>
                  <h4>Photo {photo.sort_order + 1}</h4>
                  {photo.description && <p>{photo.description}</p>}
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add more placeholder */}
            <div
              className={styles.photoCard}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "250px",
                cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <label style={{ cursor: "pointer", textAlign: "center", padding: "24px" }}>
                <Plus size={32} style={{ color: "rgba(255,255,255,0.3)" }} />
                <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
                  Add Photo
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Pack Settings */}
      <div className={styles.tableContainer} style={{ marginTop: "24px" }}>
        <div className={styles.tableHeader}>
          <h3>Pack Settings</h3>
        </div>
        <div style={{ padding: "24px" }}>
          <div className={styles.formGroup}>
            <label>Pack Name</label>
            <input
              type="text"
              className={styles.input}
              value={selectedPackData?.name || ""}
              readOnly
            />
          </div>
          <div className={styles.formGroup}>
            <label>Price (cents)</label>
            <input
              type="number"
              className={styles.input}
              value={selectedPackData?.price_cents || 0}
              readOnly
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description</label>
            <input
              type="text"
              className={styles.input}
              value={selectedPackData?.description || ""}
              readOnly
            />
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
            To modify pack settings, update them directly in Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
