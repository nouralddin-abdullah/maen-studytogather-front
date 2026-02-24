import { clsx } from "clsx";

/**
 * Reusable Button component with variants.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
    secondary:
      "bg-surface-muted text-text-primary border border-border hover:bg-surface hover:border-border-strong",
    ghost: "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
    danger: "bg-error text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          جاري التحميل...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
