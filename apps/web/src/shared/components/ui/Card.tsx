import { cn } from "@/shared/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("glass-panel glass-panel-hover rounded-xl p-6 transition-all duration-300", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn("text-lg font-bold tracking-tight font-heading text-[var(--color-text-primary)]", className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={className}>{children}</div>;
}