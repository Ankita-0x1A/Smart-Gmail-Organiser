import React from "react";
import {
  Inbox,
  Briefcase,
  GraduationCap,
  Building2,
  Heart,
  Star,
  Tag,
  Plus,
  RefreshCw,
  LogOut,
  Settings,
  Mail,
  Folder,
} from "lucide-react";
import "./Sidebar.css";

function getSystemCategoryIcon(name = "") {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("job") || normalized.includes("placement")) return Briefcase;
  if (normalized.includes("edu")) return GraduationCap;
  if (normalized.includes("work")) return Building2;
  if (normalized.includes("personal")) return Heart;
  if (normalized.includes("important")) return Star;
  return Tag;
}

function getCategoryDotClass(name = "") {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("job") || normalized.includes("placement")) return "cat-job";
  if (normalized.includes("edu")) return "cat-edu";
  if (normalized.includes("work")) return "cat-work";
  if (normalized.includes("personal")) return "cat-personal";
  if (normalized.includes("important")) return "cat-important";
  return "cat-custom";
}

export default function Sidebar({
  categories = [],
  activeNav = "all", // "all" or categoryId
  onSelectNav,
  onSync,
  syncing = false,
  onOpenAddCategory,
  unreadCount = 0,
  user = { name: "User", email: "user@example.com" },
  onLogout,
  onOpenSettings,
}) {
  const systemCategories = categories.filter((c) => c.type === "system");
  const customCategories = categories.filter((c) => c.type === "custom");

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Mail size={18} />
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-title">Smart Gmail</span>
          <span className="sidebar-brand-subtitle">AI Organizer</span>
        </div>
      </div>

      {/* Primary Action Button: Sync */}
      <div className="sidebar-action-wrap">
        <button
          type="button"
          className="sidebar-sync-btn"
          onClick={onSync}
          disabled={syncing}
        >
          <RefreshCw size={15} className={syncing ? "spin-icon" : ""} />
          <span>{syncing ? "Syncing..." : "Sync Emails"}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {/* All Emails */}
        <div
          role="button"
          tabIndex={0}
          className={`sidebar-nav-item ${activeNav === "all" ? "active" : ""}`}
          onClick={() => onSelectNav("all")}
          onKeyDown={(e) => e.key === "Enter" && onSelectNav("all")}
        >
          <div className="sidebar-nav-item-left">
            <Inbox size={16} className="sidebar-nav-item-icon" />
            <span className="sidebar-nav-item-label">All Emails</span>
          </div>
          {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
        </div>

        {/* System Categories */}
        <div className="sidebar-section-title">
          <span>Categories</span>
        </div>

        {systemCategories.map((cat) => {
          const Icon = getSystemCategoryIcon(cat.name);
          const dotClass = getCategoryDotClass(cat.name);
          const isActive = String(activeNav) === String(cat.id);

          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectNav(cat.id)}
              onKeyDown={(e) => e.key === "Enter" && onSelectNav(cat.id)}
            >
              <div className="sidebar-nav-item-left">
                <span className={`sidebar-category-dot ${dotClass}`} />
                <Icon size={16} className="sidebar-nav-item-icon" />
                <span className="sidebar-nav-item-label">{cat.name}</span>
              </div>
            </div>
          );
        })}

        {/* Custom Categories Section */}
        <div className="sidebar-section-title">
          <span>Custom</span>
          {onOpenAddCategory && (
            <button
              type="button"
              className="sidebar-add-btn"
              onClick={onOpenAddCategory}
              title="Add custom category"
              aria-label="Add custom category"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {customCategories.length === 0 ? (
          <div
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              color: "var(--sidebar-text-dim)",
              fontStyle: "italic",
            }}
          >
            No custom tags yet
          </div>
        ) : (
          customCategories.map((cat) => {
            const isActive = String(activeNav) === String(cat.id);
            return (
              <div
                key={cat.id}
                role="button"
                tabIndex={0}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectNav(cat.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelectNav(cat.id)}
              >
                <div className="sidebar-nav-item-left">
                  <span className="sidebar-category-dot cat-custom" />
                  <Folder size={15} className="sidebar-nav-item-icon" />
                  <span className="sidebar-nav-item-label">{cat.name}</span>
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Footer / User Settings */}
      <div className="sidebar-footer">
        {onOpenSettings && (
          <button
            type="button"
            className="sidebar-nav-item"
            style={{ width: "100%" }}
            onClick={onOpenSettings}
          >
            <div className="sidebar-nav-item-left">
              <Settings size={16} className="sidebar-nav-item-icon" />
              <span className="sidebar-nav-item-label">Settings</span>
            </div>
          </button>
        )}

        <div className="sidebar-user-pill">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {(user?.name || "U")[0]?.toUpperCase()}
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{user?.name || "Guest"}</span>
              <span className="sidebar-user-email">{user?.email || "Signed in"}</span>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
