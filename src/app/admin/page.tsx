"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.css";

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  totalRevenue: number;
  totalMessages: number;
  tier1Users: number;
  tier2Users: number;
  vipUsers: number;
}

interface RecentUser {
  id: string;
  display_name: string;
  telegram_id: number;
  total_messages: number;
  relationship_tier: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from your API
    const fetchData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      setStats({
        totalUsers: 0,
        activeToday: 0,
        totalRevenue: 0,
        totalMessages: 0,
        tier1Users: 0,
        tier2Users: 0,
        vipUsers: 0,
      });
      setRecentUsers([]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Dashboard</h2>
        <p>Overview of your Telegram bot performance</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <div className={styles.statValue}>{stats?.totalUsers ?? 0}</div>
        </div>

        <div className={styles.statCard}>
          <h3>Active Today</h3>
          <div className={styles.statValue}>{stats?.activeToday ?? 0}</div>
        </div>

        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <div className={styles.statValue}>
            ${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}
          </div>
        </div>

        <div className={styles.statCard}>
          <h3>Total Messages</h3>
          <div className={styles.statValue}>{stats?.totalMessages ?? 0}</div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Tier 1 Users</h3>
          <div className={styles.statValue}>{stats?.tier1Users ?? 0}</div>
        </div>

        <div className={styles.statCard}>
          <h3>Tier 2 Users</h3>
          <div className={styles.statValue}>{stats?.tier2Users ?? 0}</div>
        </div>

        <div className={styles.statCard}>
          <h3>VIP Users</h3>
          <div className={styles.statValue}>{stats?.vipUsers ?? 0}</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Recent Users</h3>
        </div>

        {recentUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No users yet. Start promoting your bot!</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Telegram ID</th>
                <th>Messages</th>
                <th>Tier</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.display_name || "Unknown"}</td>
                  <td>{user.telegram_id}</td>
                  <td>{user.total_messages}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[user.relationship_tier]}`}>
                      {user.relationship_tier}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
