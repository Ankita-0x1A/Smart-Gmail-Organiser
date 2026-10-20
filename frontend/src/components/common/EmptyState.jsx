import React from "react";
import { Mail, Inbox, AlertCircle, RefreshCw } from "lucide-react";
import "./common.css";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No emails found",
  description = "There are no emails matching this category or filter.",
  actionLabel,
  onAction,
  loading = false,
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">
        <Icon size={28} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="empty-state-btn"
          onClick={onAction}
          disabled={loading}
        >
          {loading && <RefreshCw size={14} className="spin-icon" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
