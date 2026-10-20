import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import "./CategoryModal.css";

export default function CategoryModal({
  isOpen,
  onClose,
  onCreate,
  loading = false,
  error = null,
}) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FolderPlus size={18} color="var(--primary-600)" />
            <h3 className="modal-title">New Custom Category</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="modal-error-box">{error}</div>}

            <div className="modal-form-group">
              <label htmlFor="category-name" className="modal-label">
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                className="modal-input"
                placeholder="e.g. Invoices, Subscriptions, Newsletters"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={50}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
