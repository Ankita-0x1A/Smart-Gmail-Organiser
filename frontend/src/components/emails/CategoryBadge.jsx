import React from "react";
import { X } from "lucide-react";
import "./CategoryBadge.css";

function getCategoryClass(name = "") {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("job") || normalized.includes("placement")) return "cat-job";
  if (normalized.includes("edu")) return "cat-education";
  if (normalized.includes("work")) return "cat-work";
  if (normalized.includes("personal")) return "cat-personal";
  if (normalized.includes("important")) return "cat-important";
  return "cat-custom";
}

export default function CategoryBadge({ name, onRemove, removable = false, size = "md" }) {
  const catClass = getCategoryClass(name);

  return (
    <span className={`category-chip ${catClass} chip-${size}`} title={name}>
      <span className="chip-dot" />
      <span className="chip-name">{name}</span>
      {removable && onRemove && (
        <button
          type="button"
          className="chip-remove-btn"
          aria-label={`Remove ${name} category`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
