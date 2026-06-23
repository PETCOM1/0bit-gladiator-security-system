import { cn } from "@/shared/utils/cn";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] font-heading uppercase">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border px-4 py-2.5 bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-border)] focus:border-[var(--color-accent)] transition-all duration-200 border-[var(--color-border)] placeholder:text-[var(--color-text-muted)] text-sm",
            error ? "border-red-500 focus:ring-red-500/20" : "",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };