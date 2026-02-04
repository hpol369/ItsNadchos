"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Image, BarChart3, MessageCircle } from "lucide-react";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/chats", label: "Chats", icon: MessageCircle },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/photos", label: "Photos", icon: Image },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>ItsNadchos</h1>
          <span>Admin Panel</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink}>
            ← Back to Site
          </Link>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
