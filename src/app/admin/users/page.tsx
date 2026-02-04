"use client";

import { useEffect, useState } from "react";
import { Search, Ban, MessageCircle } from "lucide-react";
import styles from "../admin.module.css";

interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  total_messages: number;
  is_blocked: boolean;
  created_at: string;
  relationship_tier: string;
  last_message_at: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "tier1" | "tier2" | "vip" | "blocked">("all");

  useEffect(() => {
    // In production, fetch from API with search/filter params
    const fetchUsers = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUsers([]);
      setLoading(false);
    };
    fetchUsers();
  }, [search, filter]);

  const filteredUsers = users.filter((user) => {
    if (filter === "blocked" && !user.is_blocked) return false;
    if (filter !== "all" && filter !== "blocked" && user.relationship_tier !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.display_name?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.telegram_id.toString().includes(search)
      );
    }
    return true;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Users</h2>
        <p>Manage your bot users</p>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.4)",
                }}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.input}
                style={{ paddingLeft: "40px", width: "250px" }}
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className={styles.input}
              style={{ width: "150px" }}
            >
              <option value="all">All Users</option>
              <option value="free">Free</option>
              <option value="tier1">Tier 1</option>
              <option value="tier2">Tier 2</option>
              <option value="vip">VIP</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {filteredUsers.length} users
          </span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <p>Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No users found</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Telegram ID</th>
                <th>Messages</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {user.display_name || "Unknown"}
                      </div>
                      {user.username && (
                        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{user.telegram_id}</td>
                  <td>{user.total_messages}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[user.relationship_tier]}`}>
                      {user.relationship_tier}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.is_blocked ? styles.blocked : styles.active}`}>
                      {user.is_blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        style={{ padding: "6px 10px" }}
                        title="View messages"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        className={`${styles.button} ${styles.buttonDanger}`}
                        style={{ padding: "6px 10px" }}
                        title={user.is_blocked ? "Unblock" : "Block"}
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
