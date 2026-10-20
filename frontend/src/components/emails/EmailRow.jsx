import React from "react";
import { Star, Mail, CheckCircle2 } from "lucide-react";
import CategoryBadge from "./CategoryBadge";

function formatEmailDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" });
}

function parseSender(senderStr = "") {
  // If formatted like "John Doe <john@example.com>", extract "John Doe" or email
  const match = senderStr.match(/^(.*?)\s*<.*?>$/);
  if (match && match[1]) {
    return match[1].replace(/["']/g, "").trim();
  }
  return senderStr.replace(/["']/g, "").trim() || "Unknown Sender";
}

export default function EmailRow({
  email,
  isSelected = false,
  onSelect,
  categories = [],
  isImportant = false,
}) {
  const isUnread = !email.is_read;
  const senderDisplay = parseSender(email.sender);
  const formattedDate = formatEmailDate(email.received_at);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`email-row ${isUnread ? "unread" : "read"} ${
        isSelected ? "selected" : ""
      }`}
      onClick={() => onSelect(email)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(email)}
      aria-selected={isSelected}
    >
      {/* Unread indicator bar / dot */}
      <div className="email-row-status">
        {isUnread && <span className="email-unread-dot" title="Unread" />}
        {isImportant && <Star size={13} className="email-star-icon" fill="currentColor" />}
      </div>

      <div className="email-row-content">
        {/* Top Line: Sender and Date */}
        <div className="email-row-top">
          <span className="email-row-sender" title={email.sender}>
            {senderDisplay}
          </span>
          <span className="email-row-date">{formattedDate}</span>
        </div>

        {/* Middle Line: Subject */}
        <div className="email-row-subject-wrap">
          <span className="email-row-subject">
            {email.subject || "(No subject)"}
          </span>
        </div>

        {/* Bottom Line: Preview snippet */}
        <div className="email-row-preview">
          {email.body_preview || "No message preview available."}
        </div>

        {/* Category Chips row (if any categories assigned) */}
        {categories && categories.length > 0 && (
          <div className="email-row-chips">
            {categories.slice(0, 3).map((catName, idx) => (
              <CategoryBadge key={idx} name={catName} size="sm" />
            ))}
            {categories.length > 3 && (
              <span className="email-chips-more">+{categories.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
