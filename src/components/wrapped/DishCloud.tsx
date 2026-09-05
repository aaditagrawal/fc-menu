import * as stylex from "@stylexjs/stylex";
import { sxc } from "@/lib/utils";
import type { DishVariation } from "@/lib/wrapped/types";

const styles = stylex.create({
  tag: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "color-mix(in oklab, var(--border) 30%, transparent)",
  },
  mutedBg: {
    backgroundColor: "var(--muted)",
  },
  topText: {
    color: "var(--dish-cloud-contrast)",
    fontWeight: 600,
  },
  count: {
    marginLeft: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  count80: {
    opacity: 0.8,
  },
  count60: {
    opacity: 0.6,
  },
});

interface DishCloudProps {
  variations: DishVariation[];
  maxCount?: number;
  accentColor?: "rose" | "yellow";
}

export function DishCloud({ variations, maxCount = 15, accentColor = "rose" }: DishCloudProps) {
  const displayed = variations.slice(0, maxCount);
  const maxFreq = Math.max(...displayed.map((v) => v.count));

  const getSizeClass = (count: number): string => {
    const ratio = count / maxFreq;
    if (ratio > 0.8) return "dish-tag-lg";
    if (ratio < 0.3) return "dish-tag-sm";
    return "";
  };

  const getBgClass = (index: number): string => {
    if (index === 0) {
      // Top item gets accent background with contrast text
      return accentColor === "rose" ? "bg-rose" : "bg-yellow";
    }
    return "";
  };

  return (
    <div className="dish-cloud">
      {displayed.map((variation, index) => {
        const isTop = index === 0;
        const tagProps = sxc(
          ["dish-tag", getSizeClass(variation.count), getBgClass(index)].filter(Boolean).join(" "),
          styles.tag,
          !isTop && styles.mutedBg,
          isTop && styles.topText,
        );
        return (
          <span
            key={variation.name}
            {...tagProps}
            style={{
              ...tagProps.style,
              animationDelay: `${index * 50}ms`,
            }}
          >
            {variation.name}
            {variation.count > 1 && (
              <span {...stylex.props(styles.count, isTop ? styles.count80 : styles.count60)}>
                ×{variation.count}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
