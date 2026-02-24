import { forwardRef } from "react";
import { clsx } from "clsx";

/**
 * Reusable Select dropdown with label and error support.
 */
const Select = forwardRef(
  (
    { label, error, id, options = [], placeholder, className, ...props },
    ref,
  ) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={clsx(
              "w-full px-4 py-2.5 pe-10 rounded-xl border bg-surface-elevated text-text-primary transition-all duration-200 appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
              error
                ? "border-error focus:ring-error/40 focus:border-error"
                : "border-border hover:border-border-strong",
              className,
            )}
            defaultValue=""
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-text-muted">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Dropdown chevron */}
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <svg
              className="w-4 h-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
