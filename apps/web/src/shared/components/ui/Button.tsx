import { cn } from "@/shared/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_18px_rgba(245,158,11,0.4)] border border-[var(--color-accent-border)]",
      secondary: "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] border border-[var(--color-border)]",
      outline: "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]",
      ghost: "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-lg",
      md: "px-4 py-2 text-sm rounded-xl",
      lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "btn-premium font-semibold transition-all duration-200 ease-in-out disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };