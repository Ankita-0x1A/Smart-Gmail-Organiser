import React, { useState } from "react";
import {
  Mail,
  CheckCircle,
  Sparkles,
  Plus,
  Calendar,
  User,
  X,
  RefreshCw,
  AlertCircle,
  Tag,
  Check,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import { EmailDetailSkeleton } from "../common/SkeletonLoader";
import "./EmailDetailPanel.css";

function formatFullDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseSenderFull(senderStr = "") {
  const match = senderStr.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/["']/g, "").trim(),
      email: match[2].trim(),
    };
  }
  return {
    name: senderStr.replace(/["']/g, "").trim() || "Unknown Sender",
    email: senderStr,
  };
}

export default function EmailDetailPanel({
  email,
  loading = false,
  onMarkAsRead,
  markingAsRead = false,
  onClassifyAI,
  classifyingAI = false,
  aiReason = "",
  allCategories = [],
  assignedCategoryIds = [],
  onAssignCategory,
  onRemoveCategory,
  onClose,
}) {
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [selectedMultiCatIds, setSelectedMultiCatIds] = useState([]);

  if (loading) {
    return (
      <section className="email-detail-pane">
        <EmailDetailSkeleton />
      </section>
    );
  }

  if (!email) {
    return (
      <section className="email-detail-pane" aria-label="Email details placeholder">
        <div className="email-detail-placeholder">
          <div className="email-detail-placeholder-icon">
            <Mail size={32} />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>
            Select an email to view
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "300px" }}>
            Choose an email from the list on the left to read its full contents and manage categories.
          </p>
        </div>
      </section>
    );
  }

  const { name: senderName, email: senderEmail } = parseSenderFull(email.sender);
  const formattedDate = formatFullDate(email.received_at);

  // Map category IDs to full category objects
  const assignedCats = allCategories.filter((c) =>
    assignedCategoryIds.some((id) => String(id) === String(c.id))
  );

  const unassignedCats = allCategories.filter(
    (c) => !assignedCategoryIds.some((id) => String(id) === String(c.id))
  );

  const handleToggleMultiSelect = (catId) => {
    setSelectedMultiCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleCommitMultiAssign = () => {
    if (selectedMultiCatIds.length > 0 && onAssignCategory) {
      onAssignCategory(email.id, selectedMultiCatIds);
      setSelectedMultiCatIds([]);
      setShowCatMenu(false);
    }
  };

  return (
    <article className="email-detail-pane" aria-label="Email Reader">
      {/* Top Toolbar */}
      <div className="detail-toolbar">
        <div className="detail-toolbar-left">
          {/* Mark as read */}
          {!email.is_read && onMarkAsRead && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => onMarkAsRead(email.id)}
              disabled={markingAsRead}
              title="Mark email as read"
            >
              {markingAsRead ? (
                <RefreshCw size={13} className="spin-icon" />
              ) : (
                <CheckCircle size={13} />
              )}
              <span>Mark as Read</span>
            </button>
          )}

          {/* AI Auto-Classify Action */}
          {onClassifyAI && (
            <button
              type="button"
              className="toolbar-btn ai-classify-btn"
              onClick={() => onClassifyAI(email.id)}
              disabled={classifyingAI}
              title="Classify with OpenRouter AI"
            >
              <Sparkles size={13} className={classifyingAI ? "spin-icon" : ""} />
              <span>{classifyingAI ? "AI Classifying..." : "Classify with AI"}</span>
            </button>
          )}
        </div>

        {onClose && (
          <div className="detail-toolbar-right">
            <button
              type="button"
              className="toolbar-btn"
              onClick={onClose}
              title="Close email details"
              aria-label="Close email details"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Main Email Content */}
      <div className="detail-scroll-area">
        {/* Subject */}
        <div className="detail-subject-header">
          <h2 className="detail-subject">{email.subject || "(No Subject)"}</h2>
        </div>

        {/* Sender and Date Meta */}
        <div className="detail-meta-box">
          <div className="detail-sender-row">
            <div className="detail-avatar">
              {(senderName || "U")[0]?.toUpperCase()}
            </div>
            <div className="detail-sender-meta">
              <span className="detail-sender-name">{senderName}</span>
              <span className="detail-sender-email">{senderEmail}</span>
            </div>
          </div>
          <div className="detail-date">{formattedDate}</div>
        </div>

        {/* Categories Bar */}
        <div className="detail-categories-bar">
          <span className="categories-bar-label">Categories:</span>
          <div className="categories-chip-list">
            {assignedCats.length === 0 ? (
              <span style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic" }}>
                Uncategorized
              </span>
            ) : (
              assignedCats.map((cat) => (
                <CategoryBadge
                  key={cat.id}
                  name={cat.name}
                  removable={Boolean(onRemoveCategory)}
                  onRemove={() => onRemoveCategory && onRemoveCategory(email.id, cat.id)}
                />
              ))
            )}

            {/* Dropdown to assign multiple or single categories */}
            {onAssignCategory && (
              <div className="assign-cat-wrapper">
                <button
                  type="button"
                  className="assign-cat-btn"
                  onClick={() => {
                    setShowCatMenu(!showCatMenu);
                    setSelectedMultiCatIds([]);
                  }}
                  title="Assign categories"
                >
                  <Plus size={11} />
                  <span>Assign</span>
                </button>

                {showCatMenu && (
                  <div className="assign-cat-menu">
                    <div className="assign-cat-header">Select Categories</div>
                    {unassignedCats.length === 0 ? (
                      <div
                        style={{
                          padding: "8px 12px",
                          fontSize: "11px",
                          color: "var(--text-dim)",
                          fontStyle: "italic",
                        }}
                      >
                        All categories assigned
                      </div>
                    ) : (
                      <>
                        {unassignedCats.map((cat) => {
                          const isChecked = selectedMultiCatIds.includes(Number(cat.id));
                          return (
                            <div
                              key={cat.id}
                              className={`assign-cat-item ${isChecked ? "already-assigned" : ""}`}
                              onClick={() => handleToggleMultiSelect(Number(cat.id))}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  style={{ cursor: "pointer" }}
                                />
                                <span>{cat.name}</span>
                              </div>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-dim)",
                                }}
                              >
                                {cat.type}
                              </span>
                            </div>
                          );
                        })}

                        {selectedMultiCatIds.length > 0 && (
                          <div style={{ padding: "6px 12px 2px", borderTop: "1px solid var(--border-light)" }}>
                            <button
                              type="button"
                              className="modal-btn modal-btn-primary"
                              style={{ width: "100%", padding: "4px 8px", fontSize: "11px" }}
                              onClick={handleCommitMultiAssign}
                            >
                              Assign Selected ({selectedMultiCatIds.length})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Reason Banner */}
        {aiReason && (
          <div className="ai-reason-banner">
            <Sparkles size={16} className="ai-reason-icon" />
            <div>
              <strong>AI Classification Insight:</strong> {aiReason}
            </div>
          </div>
        )}

        {/* Full Email Body */}
        <div className="detail-body-content">
          {email.body ? (
            <pre>{email.body}</pre>
          ) : (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              (No message body content)
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
