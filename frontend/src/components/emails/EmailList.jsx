import React from "react";
import { RefreshCw, Inbox, AlertTriangle } from "lucide-react";
import EmailRow from "./EmailRow";
import { EmailListSkeleton } from "../common/SkeletonLoader";
import EmptyState from "../common/EmptyState";
import "./EmailList.css";

export default function EmailList({
  emails = [],
  selectedEmail = null,
  onSelectEmail,
  loading = false,
  error = null,
  onRefresh,
  filter = "all", // "all", "unread", "important"
  onFilterChange,
  emailCategoriesMap = {}, // emailId -> array of category names
  importantCategoryId = null,
  onOpenGmailConnect,
  hasConnectedAccount = true,
}) {
  return (
    <section className="email-list-panel" aria-label="Email List">
      {/* Sub-header Filter Toolbar */}
      <div className="email-filter-bar">
        <div className="email-filter-pills">
          <button
            type="button"
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === "unread" ? "active" : ""}`}
            onClick={() => onFilterChange("unread")}
          >
            Unread
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === "important" ? "active" : ""}`}
            onClick={() => onFilterChange("important")}
          >
            Important
          </button>
        </div>

        <button
          type="button"
          className="filter-refresh-btn"
          onClick={onRefresh}
          title="Refresh email list"
          aria-label="Refresh email list"
        >
          <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
        </button>
      </div>

      {/* Main List Body */}
      <div className="email-items-container">
        {loading && emails.length === 0 ? (
          <EmailListSkeleton count={8} />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load emails"
            description={error}
            actionLabel="Try Again"
            onAction={onRefresh}
          />
        ) : emails.length === 0 ? (
          !hasConnectedAccount ? (
            <EmptyState
              icon={Inbox}
              title="Connect your Gmail"
              description="Connect your Gmail account to sync and organize your inbox with AI classification."
              actionLabel="Connect Gmail"
              onAction={onOpenGmailConnect}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No emails here"
              description={
                filter === "unread"
                  ? "You have caught up with all unread emails!"
                  : "No emails found matching your current view or filter."
              }
              actionLabel="Sync Inbox"
              onAction={onRefresh}
            />
          )
        ) : (
          emails.map((email) => {
            const isSelected = selectedEmail?.id === email.id;
            const assignedCats = emailCategoriesMap[email.id] || [];
            const isImportant =
              assignedCats.some((c) => c.toLowerCase() === "important") ||
              filter === "important";

            return (
              <EmailRow
                key={email.id}
                email={email}
                isSelected={isSelected}
                onSelect={onSelectEmail}
                categories={assignedCats}
                isImportant={isImportant}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
