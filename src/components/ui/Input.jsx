import { forwardRef } from "react";
import { clsx } from "clsx";

/**
 * Reusable Input component with label and error support.
 */
const Input = forwardRef(
  ({ label, error, id, className, type = "text", ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          type={type}
          className={clsx(
            "w-full px-4 py-2.5 rounded-md border bg-surface-elevated text-text-primary placeholder:text-text-muted transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
            error
              ? "border-error focus:ring-error/40 focus:border-error"
              : "border-border hover:border-border-strong",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
