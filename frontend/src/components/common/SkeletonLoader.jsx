import React from "react";
import "./common.css";

export function EmailListSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-container" aria-label="Loading emails">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-line skeleton-avatar" />
          <div className="skeleton-body">
            <div className="skeleton-line-group">
              <div className="skeleton-line skeleton-sender" />
              <div className="skeleton-line skeleton-date" />
            </div>
            <div className="skeleton-line skeleton-subject" />
            <div className="skeleton-line skeleton-preview" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmailDetailSkeleton() {
  return (
    <div className="skeleton-detail-container" aria-label="Loading email details">
      <div className="skeleton-line skeleton-detail-title" />
      <div className="skeleton-detail-meta">
        <div className="skeleton-line skeleton-avatar-large" />
        <div style={{ flex: 1 }}>
          <div className="skeleton-line skeleton-sender" style={{ width: "220px" }} />
          <div className="skeleton-line skeleton-date" style={{ width: "140px", marginTop: "6px" }} />
        </div>
      </div>
      <div className="skeleton-detail-body">
        <div className="skeleton-line skeleton-preview" style={{ width: "100%", height: "14px" }} />
        <div className="skeleton-line skeleton-preview" style={{ width: "95%", height: "14px" }} />
        <div className="skeleton-line skeleton-preview" style={{ width: "90%", height: "14px" }} />
        <div className="skeleton-line skeleton-preview" style={{ width: "80%", height: "14px" }} />
      </div>
    </div>
  );
}
