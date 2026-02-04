"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, MessageCircle, Users } from "lucide-react";
import styles from "../admin.module.css";

interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  messages: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  conversions: {
    freeToTier1: number;
    tier1ToTier2: number;
    tier2ToVip: number;
  };
  topUsers: Array<{
    id: string;
    display_name: string;
    total_messages: number;
    total_spent: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setData({
        revenue: { total: 0, thisMonth: 0, lastMonth: 0, change: 0 },
        users: { total: 0, thisMonth: 0, lastMonth: 0, change: 0 },
        messages: { total: 0, thisMonth: 0, lastMonth: 0, change: 0 },
        conversions: { freeToTier1: 0, tier1ToTier2: 0, tier2ToVip: 0 },
        topUsers: [],
      });
      setLoading(false);
    };
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Analytics</h2>
        <p>Track your bot performance and revenue</p>
      </div>

      {/* Time Range Selector */}
      <div style={{ marginBottom: "24px" }}>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          className={styles.input}
          style={{ width: "150px" }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <DollarSign size={20} style={{ color: "#4ade80" }} />
            <h3>Revenue</h3>
          </div>
          <div className={styles.statValue}>
            ${((data?.revenue.thisMonth ?? 0) / 100).toFixed(2)}
          </div>
          <div className={`${styles.statChange} ${(data?.revenue.change ?? 0) < 0 ? styles.negative : ""}`}>
            {(data?.revenue.change ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(data?.revenue.change ?? 0)}% vs last month
          </div>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Users size={20} style={{ color: "#ff69b4" }} />
            <h3>New Users</h3>
          </div>
          <div className={styles.statValue}>{data?.users.thisMonth ?? 0}</div>
          <div className={`${styles.statChange} ${(data?.users.change ?? 0) < 0 ? styles.negative : ""}`}>
            {(data?.users.change ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(data?.users.change ?? 0)}% vs last month
          </div>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <MessageCircle size={20} style={{ color: "#a855f7" }} />
            <h3>Messages</h3>
          </div>
          <div className={styles.statValue}>{data?.messages.thisMonth ?? 0}</div>
          <div className={`${styles.statChange} ${(data?.messages.change ?? 0) < 0 ? styles.negative : ""}`}>
            {(data?.messages.change ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(data?.messages.change ?? 0)}% vs last month
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className={styles.chartContainer}>
        <h3 style={{ marginBottom: "24px" }}>Conversion Funnel</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Free → Tier 1</h3>
            <div className={styles.statValue}>{data?.conversions.freeToTier1 ?? 0}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Tier 1 → Tier 2</h3>
            <div className={styles.statValue}>{data?.conversions.tier1ToTier2 ?? 0}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Tier 2 → VIP</h3>
            <div className={styles.statValue}>{data?.conversions.tier2ToVip ?? 0}%</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className={styles.chartContainer}>
        <h3 style={{ marginBottom: "24px" }}>Revenue Over Time</h3>
        <div className={styles.chartPlaceholder}>
          Chart visualization would go here.
          <br />
          Consider using a charting library like Recharts or Chart.js.
        </div>
      </div>

      {/* Top Users */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Top Users by Engagement</h3>
        </div>

        {(data?.topUsers.length ?? 0) === 0 ? (
          <div className={styles.emptyState}>
            <p>No user data yet</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Messages</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {data?.topUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.display_name}</td>
                  <td>{user.total_messages}</td>
                  <td>${(user.total_spent / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
