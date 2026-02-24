import { clsx } from "clsx";

/**
 * Reusable Stepper component.
 *
 * @param {Object} props
 * @param {Array<{ label: string, description?: string }>} props.steps
 * @param {number} props.currentStep - 0-indexed current step
 * @param {function} [props.onStepClick] - Optional click handler for completed steps
 */
function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted || !onStepClick}
                onClick={() => isCompleted && onStepClick?.(index)}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                  isCompleted &&
                    "bg-brand-600 border-brand-600 text-white cursor-pointer hover:bg-brand-700",
                  isActive &&
                    "bg-surface-elevated border-brand-500 text-brand-600 shadow-md ring-4 ring-brand-500/20",
                  !isCompleted &&
                    !isActive &&
                    "bg-surface-muted border-border text-text-muted",
                )}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={clsx(
                  "mt-2 text-xs font-medium text-center whitespace-nowrap",
                  isActive
                    ? "text-brand-600"
                    : isCompleted
                      ? "text-text-primary"
                      : "text-text-muted",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-3 mt-[-1.25rem]">
                <div
                  className={clsx(
                    "h-0.5 rounded-full transition-all duration-500",
                    isCompleted ? "bg-brand-600" : "bg-border",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
