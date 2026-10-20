import React from "react";
import { Search, X, CheckCircle2, AlertCircle } from "lucide-react";
import "./Header.css";

export default function Header({
  title = "All Emails",
  emailCount = 0,
  searchQuery = "",
  onSearchChange,
  onClearSearch,
  connectedEmail = null,
  onOpenGmailConnect,
}) {
  return (
    <header className="header" role="banner">
      {/* Title & Count */}
      <div className="header-left">
        <div className="header-title-wrap">
          <h1 className="header-title">{title}</h1>
          {emailCount !== undefined && emailCount !== null && (
            <span className="header-count-badge">{emailCount}</span>
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="header-search-wrap">
        <Search size={16} className="header-search-icon" />
        <input
          type="text"
          className="header-search-input"
          placeholder="Search by sender or subject..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search emails"
        />
        {searchQuery && (
          <button
            type="button"
            className="header-search-clear"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right Controls: Gmail Status Pill */}
      <div className="header-right">
        {connectedEmail ? (
          <div
            className="gmail-status-pill connected"
            title={`Connected to ${connectedEmail}`}
          >
            <span className="status-dot active" />
            <span>{connectedEmail}</span>
          </div>
        ) : (
          <button
            type="button"
            className="gmail-status-pill not-connected"
            onClick={onOpenGmailConnect}
            title="Connect Gmail to start syncing"
          >
            <span className="status-dot idle" />
            <span>Connect Gmail</span>
          </button>
        )}
      </div>
    </header>
  );
}
