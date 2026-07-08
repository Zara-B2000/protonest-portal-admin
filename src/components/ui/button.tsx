import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("", {
  variants: {
    variant: {
      primary:   "pn-btn-primary",
      secondary: "pn-btn-secondary",
      ghost:     "pn-btn-ghost",
      google:    "pn-btn-google",
      // keep shadcn originals for any existing shadcn component usage
      default:     "pn-btn-primary",
      destructive: "pn-btn-primary bg-red-600 hover:bg-red-700 shadow-none",
      outline:   "pn-btn-secondary",
      link:      "text-[#9D82F8] underline-offset-4 hover:underline bg-transparent border-none h-auto p-0",
    },
    size: {
      default: "",
      md:   "pn-btn-md",
      sm:   "pn-btn-sm",
      lg:   "",       // lg is the natural size of pn-btn-primary
      icon: "h-10 w-10 p-0 rounded-xl border border-white/10 bg-white/[0.04] text-[#C4B5FD] hover:bg-white/[0.08] hover:text-[#EEF0FB]",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              style={{ width: 16, height: 16, flexShrink: 0 }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
