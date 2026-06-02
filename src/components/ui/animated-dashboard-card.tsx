"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

interface FinanceImpactCardProps {
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryValue?: number;
  secondaryValue?: number;
  primaryDelta?: string;
  secondaryDelta?: string;
  totalLabel?: string;
  currency?: string;
  borderColor?: string;
  backgroundColor?: string;
  outerDotsCount?: number;
  innerDotsCount?: number;
  enableAnimations?: boolean;
  onMoreDetails?: () => void;
}

const defaultProps: Partial<FinanceImpactCardProps> = {
  title: "Portfolio Exposure",
  primaryLabel: "Risk Capital",
  secondaryLabel: "Hedge Offset",
  primaryValue: 1250,
  secondaryValue: 875,
  primaryDelta: "-12.4%",
  secondaryDelta: "+4.8%",
  totalLabel: "NET IMPACT",
  currency: "$",
  borderColor: "border-white/5",
  backgroundColor: "bg-white/[0.03]",
  outerDotsCount: 48,
  innerDotsCount: 36,
  enableAnimations: true,
};

function formatMoney(value: number, currency: string) {
  const abs = Math.abs(value);
  const formatted = abs >= 1_000_000
    ? `${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
      ? `${(abs / 1_000).toFixed(1)}k`
      : Math.round(abs).toLocaleString("en-US");
  return `${value < 0 ? "-" : ""}${currency}${formatted}`;
}

export function FinanceImpactCard(props: FinanceImpactCardProps) {
  const {
    title,
    primaryLabel,
    secondaryLabel,
    primaryValue,
    secondaryValue,
    primaryDelta,
    secondaryDelta,
    totalLabel,
    currency,
    borderColor,
    backgroundColor,
    outerDotsCount,
    innerDotsCount,
    enableAnimations,
    onMoreDetails,
  } = { ...defaultProps, ...props };

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const generateDots = (count: number, radius: number, centerX: number, centerY: number) => {
    const dots = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const x = Math.round((centerX + radius * Math.cos(angle)) * 1000) / 1000;
      const y = Math.round((centerY + radius * Math.sin(angle)) * 1000) / 1000;
      dots.push({ x, y, delay: i * 0.018 });
    }
    return dots;
  };

  const outerDots = generateDots(outerDotsCount!, 185, 203, 200);
  const innerDots = generateDots(innerDotsCount!, 155, 203, 200);
  const netValue = primaryValue! + secondaryValue!;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.06,
        delayChildren: 0.08,
      },
    },
  };

  const dotVariants: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 0.5,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="w-full"
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      variants={shouldAnimate ? containerVariants : undefined}
    >
      <motion.div
        className={`${backgroundColor} ${borderColor} relative overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(0,0,0,0.32)]`}
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-7">
          <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_10%,rgba(138,164,255,0.11),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]" />

          <div className="relative z-10 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/36">{title}</span>
            <span className="rounded-full border border-white/7 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/48">Scenario</span>
          </div>

          <div className="relative z-10 mx-auto h-[17.5rem] w-[17.5rem] max-w-full">
            <svg className="h-full w-full" viewBox="0 0 448 448" aria-hidden="true">
              {outerDots.map((dot, index) => (
                <motion.circle
                  key={`outer-${index}`}
                  cx={dot.x}
                  cy={dot.y}
                  r="9"
                  fill="currentColor"
                  style={{ color: "#7da7ff" }}
                  variants={shouldAnimate ? dotVariants : undefined}
                  initial="hidden"
                  animate="visible"
                />
              ))}
              {innerDots.map((dot, index) => (
                <motion.circle
                  key={`inner-${index}`}
                  cx={dot.x}
                  cy={dot.y}
                  r="9"
                  fill="currentColor"
                  style={{ color: "#55d99a" }}
                  variants={shouldAnimate ? dotVariants : undefined}
                  initial="hidden"
                  animate="visible"
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-0 -mt-8 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  className="mb-2 text-lg font-semibold text-white/58"
                  initial={shouldAnimate ? { opacity: 0, y: -8, scale: 0.96 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
                  transition={{ delay: 0.25, type: "spring", stiffness: 380, damping: 25 }}
                >
                  {totalLabel}
                </motion.div>
                <motion.div
                  className={`text-4xl font-bold tracking-[-0.05em] ${netValue >= 0 ? "text-emerald-200" : "text-rose-200"}`}
                  initial={shouldAnimate ? { opacity: 0, y: 16, scale: 0.86, filter: "blur(4px)" } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : undefined}
                  transition={{ delay: 0.38, type: "spring", stiffness: 300, damping: 28 }}
                >
                  {formatMoney(netValue, currency!)}
                </motion.div>
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-48 rounded-[28px]"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, transparent 36%, rgba(7,9,13,0.72) 48%, rgba(7,9,13,0.92) 62%, rgba(7,9,13,1) 76%)",
              zIndex: 5,
            }}
          />

          <div className="relative z-10 -mt-14 px-1 pb-1 pt-4">
            <div className="mb-4 grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <motion.div className="h-4 w-0.5 rounded-full bg-[#7da7ff]" initial={shouldAnimate ? { opacity: 0, scaleY: 0 } : undefined} animate={shouldAnimate ? { opacity: 1, scaleY: 1 } : undefined} transition={{ delay: 0.35, type: "spring" }} />
                  <motion.div className="text-sm font-medium text-white/48" initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.42 }}>
                    {primaryLabel}
                  </motion.div>
                </div>
                <motion.div className="text-xl font-bold text-white" initial={shouldAnimate ? { opacity: 0, y: -8 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.5 }}>
                  {formatMoney(primaryValue!, currency!)}
                </motion.div>
                <motion.div className="text-xs font-semibold text-[#7da7ff]" initial={shouldAnimate ? { opacity: 0, y: -8 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.58 }}>
                  {primaryDelta}
                </motion.div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <motion.div className="h-4 w-0.5 rounded-full bg-[#55d99a]" initial={shouldAnimate ? { opacity: 0, scaleY: 0 } : undefined} animate={shouldAnimate ? { opacity: 1, scaleY: 1 } : undefined} transition={{ delay: 0.65, type: "spring" }} />
                  <motion.div className="text-sm font-medium text-white/48" initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.72 }}>
                    {secondaryLabel}
                  </motion.div>
                </div>
                <motion.div className="text-xl font-bold text-white" initial={shouldAnimate ? { opacity: 0, y: -8 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.8 }}>
                  {formatMoney(secondaryValue!, currency!)}
                </motion.div>
                <motion.div className="text-xs font-semibold text-[#55d99a]" initial={shouldAnimate ? { opacity: 0, y: -8 } : undefined} animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.88 }}>
                  {secondaryDelta}
                </motion.div>
              </div>
            </div>

            <motion.button
              className="w-full rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/78 shadow-sm transition-colors hover:bg-white/[0.07]"
              initial={shouldAnimate ? { opacity: 0, y: 14 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.96 }}
              whileHover={shouldAnimate ? { scale: 1.012 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.985 } : undefined}
              onClick={onMoreDetails}
            >
              View Exposure Details
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function BonusesIncentivesCard(props: FinanceImpactCardProps) {
  return <FinanceImpactCard {...props} />;
}
