import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground shadow-button hover:bg-accent-hover",
        secondary: "border border-border bg-surface text-foreground shadow-card hover:border-border-strong hover:bg-surface-2",
        ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
        outline: "border border-navy bg-surface text-navy hover:bg-surface-2 dark:border-border-strong dark:text-foreground",
        dark: "bg-navy text-white hover:bg-navy-2 dark:bg-lime dark:text-navy dark:hover:bg-[#cdee98]",
        green: "bg-[#2f7d4f] text-white hover:bg-[#1f5a37]",
        lime: "bg-lime font-bold text-navy hover:bg-[#a8d662]",
        link: "h-auto px-0 text-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-[13px]",
        lg: "h-9 px-4 text-sm",
        site: "h-11 rounded-lg px-5 text-[15px] font-semibold [&_svg]:size-4",
        "site-sm": "h-9 rounded-md px-3 text-[14px] font-semibold",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, type, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
