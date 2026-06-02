// dock-two.tsx — adapted for Vite/React dark theme (no shadcn CSS vars)
import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface DockItem {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
}

interface DockProps {
  items: DockItem[];
  className?: string;
}

/* subtle continuous float — the whole pill breathes vertically */
const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: { duration: 5, repeat: Infinity, ease: [0.42, 0, 0.58, 1] },
  },
};

/* ─── Individual icon button ─────────────────────────────────── */
const DockIconButton = React.forwardRef<HTMLButtonElement, DockItem>(
  ({ icon: Icon, label, onClick, className }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.2, y: -4 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      onClick={onClick}
      className={cn(
        "relative group flex items-center justify-center",
        "w-10 h-10 rounded-xl cursor-pointer",
        "transition-colors duration-150 hover:bg-white/10",
        className
      )}
      aria-label={label}
    >
      <Icon
        className="w-[18px] h-[18px] transition-colors duration-150 text-white/45 group-hover:text-white"
        strokeWidth={1.75}
      />

      {/* Tooltip — slides up on hover */}
      <span
        className={cn(
          "absolute -top-10 left-1/2 -translate-x-1/2",
          "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none",
          "border backdrop-blur-md",
          "opacity-0 group-hover:opacity-100",
          "transition-all duration-150",
          "translate-y-1 group-hover:translate-y-0",
        )}
        style={{
          background: "rgba(0,0,0,0.82)",
          borderColor: "rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {label}
      </span>
    </motion.button>
  )
);
DockIconButton.displayName = "DockIconButton";

/* ─── Dock container ─────────────────────────────────────────── */
const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-center", className)}>
      <motion.div
        initial="initial"
        animate="animate"
        variants={floatingAnimation}
        className="flex items-center gap-0.5 p-2 rounded-2xl backdrop-blur-xl"
        style={{
          background: "rgba(0,0,0,0.48)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
        }}
      >
        {items.map((item) => (
          <DockIconButton key={item.label} {...item} />
        ))}
      </motion.div>
    </div>
  )
);
Dock.displayName = "Dock";

export { Dock };
