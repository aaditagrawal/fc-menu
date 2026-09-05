"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import type { WeekMenu, MealKey, DayMenu, Meal } from "@/lib/types";
import { MealCard } from "@/components/MealCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, UtensilsCrossed, Cookie, Moon } from "lucide-react";
import { filterMenuItems } from "@/lib/exceptions";
import { sxc } from "@/lib/utils";
import { easing } from "@/lib/tokens.stylex";

interface ComprehensiveWeekViewProps {
  week: WeekMenu;
}

const mealOrder: MealKey[] = ["breakfast", "lunch", "snacks", "dinner"];

const mealIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  snacks: Cookie,
  dinner: Moon,
};

const mealTitles = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
};

const styles = stylex.create({
  // Former `space-y-*` containers: flex column + gap is identical for these
  // block children.
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: "2rem",
  },
  mobileWrap: {
    display: {
      default: "flex",
      "@media (min-width: 1024px)": "none",
    },
    flexDirection: "column",
    rowGap: "1.5rem",
  },
  // alignSelf keeps the old inline-flex shrink-to-fit width now that the
  // parent is a flex column (which would otherwise stretch it).
  modeToggle: {
    display: "inline-flex",
    alignSelf: "flex-start",
    borderRadius: "var(--radius)",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--muted) 40%, transparent)",
    paddingBlock: "0.25rem",
    paddingInline: "0.25rem",
  },
  modeToggleButton: {
    height: "2rem",
    paddingInline: "0.75rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  desktopWrap: {
    display: {
      default: "none",
      "@media (min-width: 1024px)": "block",
    },
  },
  desktopScroll: {
    overflowX: "auto",
  },
  desktopGrid: {
    display: "grid",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    minWidth: "max-content",
    paddingBottom: "1rem",
    alignItems: "flex-start",
    scrollSnapType: "x mandatory",
    scrollPadding: "1rem",
  },
  gridCols: (cols: string) => ({
    gridTemplateColumns: cols,
  }),
  stickyHeaderRow: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "color-mix(in oklab, var(--background) 95%, transparent)",
    WebkitBackdropFilter: "blur(8px)",
    backdropFilter: "blur(8px)",
    borderBottomWidth: "1px",
    borderBottomColor: "color-mix(in oklab, var(--border) 50%, transparent)",
    gridColumn: "1 / -1",
  },
  headerGrid: {
    display: "grid",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    alignItems: "flex-start",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
  },
  mealsHeading: {
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: "calc(1.75 / 1.125)",
  },
  dayHeaderCell: {
    textAlign: "center",
  },
  semibold: {
    fontWeight: 600,
  },
  dayHeaderDate: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
    marginTop: "0.25rem",
  },
  contentGrid: {
    display: "grid",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    alignItems: "flex-start",
    gridColumn: "1 / -1",
    paddingTop: "1rem",
  },
  mealRowGrid: {
    display: "grid",
    rowGap: "0.75rem",
    columnGap: "0.75rem",
    alignItems: "flex-start",
    borderTopWidth: "1px",
    borderTopColor: "color-mix(in oklab, var(--border) 50%, transparent)",
    gridColumn: "1 / -1",
  },
  snapStart: {
    scrollSnapAlign: "start",
  },
  mealTypeHeader: {
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
  },
  mealTypeRow: {
    display: "flex",
    alignItems: "center",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
  mealTypeIconCircle: {
    display: "inline-flex",
    height: "2rem",
    width: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    backgroundColor: "color-mix(in oklab, var(--primary) 15%, transparent)",
  },
  icon16: {
    height: "1rem",
    width: "1rem",
    color: "var(--primary)",
  },
  medium: {
    fontWeight: 500,
  },
  dayCell: {
    paddingBlock: "0.75rem",
    paddingInline: "0.75rem",
    scrollSnapAlign: "start",
  },
  noMealCell: {
    paddingBlock: "1rem",
    paddingInline: "1rem",
    borderRadius: "var(--radius)",
    borderWidth: "2px",
    borderStyle: "dashed",
    borderColor: "color-mix(in oklab, var(--muted-foreground) 20%, transparent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "8rem",
  },
  mutedSm: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
});

type MobileViewMode = "detailed" | "compact";

export function ComprehensiveWeekView({ week }: ComprehensiveWeekViewProps) {
  // Sort days chronologically
  const sortedDays = React.useMemo(() => Object.keys(week.menu).sort(), [week.menu]);
  const dayCount = sortedDays.length;
  const [mobileViewMode, setMobileViewMode] = React.useState<MobileViewMode>("detailed");

  const desktopCols = `200px repeat(${dayCount}, minmax(280px, 1fr))`;

  return (
    <div {...stylex.props(styles.root)}>
      {/* Mobile/Tablet View - Days stacked vertically */}
      <div {...stylex.props(styles.mobileWrap)}>
        <div {...stylex.props(styles.modeToggle)}>
          <Button
            type="button"
            size="sm"
            variant={mobileViewMode === "detailed" ? "default" : "ghost"}
            onClick={() => setMobileViewMode("detailed")}
            style={styles.modeToggleButton}
          >
            Detailed
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mobileViewMode === "compact" ? "default" : "ghost"}
            onClick={() => setMobileViewMode("compact")}
            style={styles.modeToggleButton}
          >
            Compact Grid
          </Button>
        </div>

        {mobileViewMode === "detailed" ? (
          sortedDays.map((dateKey) => {
            const day = week.menu[dateKey];
            return <DaySection key={dateKey} day={day} dateKey={dateKey} />;
          })
        ) : (
          <MobileCompactWeekGrid week={week} sortedDays={sortedDays} />
        )}
      </div>

      {/* Desktop View - Transposed grid: Meals as rows, Days as columns */}
      <div {...stylex.props(styles.desktopWrap)}>
        <div {...sxc("scroll-container", styles.desktopScroll)}>
          <div {...sxc("scroll-grid", styles.desktopGrid, styles.gridCols(desktopCols))}>
            {/* Sticky Header row with days */}
            <div {...stylex.props(styles.stickyHeaderRow)}>
              <div {...stylex.props(styles.headerGrid, styles.gridCols(desktopCols))}>
                <div>
                  <h3 {...stylex.props(styles.mealsHeading)}>Meals</h3>
                </div>
                {sortedDays.map((dateKey) => {
                  const day = week.menu[dateKey];
                  return (
                    <div key={`header-${dateKey}`} {...stylex.props(styles.dayHeaderCell)}>
                      <h3 {...stylex.props(styles.semibold)}>{day.day}</h3>
                      <p {...stylex.props(styles.dayHeaderDate)}>{dateKey}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content rows */}
            <div {...stylex.props(styles.contentGrid, styles.gridCols(desktopCols))}>
              {/* Empty cell for meal type headers */}
              <div></div>
              {sortedDays.map((dateKey) => (
                <div key={`spacer-${dateKey}`} {...stylex.props(styles.snapStart)}></div>
              ))}
            </div>

            {/* Meal rows */}
            {mealOrder.map((mealKey) => (
              <React.Fragment key={mealKey}>
                {/* Meal type header and content row */}
                <div {...stylex.props(styles.mealRowGrid, styles.gridCols(desktopCols))}>
                  {/* Meal type header */}
                  <div {...stylex.props(styles.mealTypeHeader)}>
                    <div {...stylex.props(styles.mealTypeRow)}>
                      <span {...stylex.props(styles.mealTypeIconCircle)}>
                        {React.createElement(mealIcons[mealKey], {
                          ...stylex.props(styles.icon16),
                        })}
                      </span>
                      <div>
                        <span {...stylex.props(styles.medium)}>{mealTitles[mealKey]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meal content for each day */}
                  {sortedDays.map((dateKey) => {
                    const day = week.menu[dateKey];
                    const meal = day.meals[mealKey];

                    return (
                      <div key={`${mealKey}-${dateKey}`} {...stylex.props(styles.dayCell)}>
                        {meal ? (
                          <MealGridCard
                            meal={meal}
                            mealKey={mealKey}
                            timeRange={`${meal.startTime} – ${meal.endTime} IST`}
                          />
                        ) : (
                          <div {...stylex.props(styles.noMealCell)}>
                            <span {...stylex.props(styles.mutedSm)}>No meal</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const compactStyles = stylex.create({
  cardClip: {
    overflow: "hidden",
  },
  headerPad: {
    paddingBottom: "0.5rem",
  },
  // Only the font-size changes: the CardTitle base `leading-none` (line-height
  // 1) won over `text-base`'s line-height in the old cascade.
  titleBase: {
    fontSize: "1rem",
  },
  headerHint: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  scrollWrap: {
    overflowX: "auto",
  },
  grid: {
    display: "grid",
    minWidth: "max-content",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
  gridCols: (cols: string) => ({
    gridTemplateColumns: cols,
  }),
  cornerCell: {
    position: "sticky",
    left: 0,
    zIndex: 10,
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "color-mix(in oklab, var(--background) 95%, transparent)",
    WebkitBackdropFilter: "blur(8px)",
    backdropFilter: "blur(8px)",
    paddingBlock: "0.5rem",
    paddingInline: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 600,
    color: "var(--muted-foreground)",
  },
  dayHeadCell: {
    borderRadius: "calc(var(--radius) - 2px)",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--muted) 30%, transparent)",
    paddingBlock: "0.5rem",
    paddingInline: "0.5rem",
    textAlign: "center",
  },
  dayHeadName: {
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1.25,
  },
  dayHeadDate: {
    fontSize: "10px",
    color: "var(--muted-foreground)",
    lineHeight: 1.25,
  },
  mealLabelCell: {
    position: "sticky",
    left: 0,
    zIndex: 10,
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "color-mix(in oklab, var(--background) 95%, transparent)",
    WebkitBackdropFilter: "blur(8px)",
    backdropFilter: "blur(8px)",
    paddingInline: "0.375rem",
    paddingBlock: "0.5rem",
  },
  mealLabelRow: {
    display: "flex",
    alignItems: "center",
    rowGap: "0.25rem",
    columnGap: "0.25rem",
  },
  icon12: {
    height: "0.75rem",
    width: "0.75rem",
    color: "var(--primary)",
    flexShrink: 0,
  },
  mealLabelName: {
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  mealLabelTimeWrap: {
    minWidth: 0,
    marginTop: "0.125rem",
  },
  mealLabelTime: {
    fontSize: "9px",
    color: "var(--muted-foreground)",
    lineHeight: 1.25,
  },
  cell: {
    borderRadius: "calc(var(--radius) - 2px)",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    paddingBlock: "0.5rem",
    paddingInline: "0.5rem",
  },
  itemsStack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.25rem",
  },
  itemText: {
    fontSize: "10px",
    lineHeight: 1.25,
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
  noItemsText: {
    fontSize: "10px",
    color: "var(--muted-foreground)",
    lineHeight: 1.25,
  },
  noMealText: {
    fontSize: "10px",
    color: "var(--muted-foreground)",
  },
});

function MobileCompactWeekGrid({ week, sortedDays }: { week: WeekMenu; sortedDays: string[] }) {
  const getMealTimeLabel = React.useCallback(
    (mealKey: MealKey): string => {
      const uniqueRanges = new Set<string>();

      for (const dateKey of sortedDays) {
        const meal = week.menu[dateKey]?.meals[mealKey];
        if (meal) {
          uniqueRanges.add(`${meal.startTime} - ${meal.endTime}`);
        }
      }

      if (uniqueRanges.size === 0) return "No timing";
      if (uniqueRanges.size === 1) return [...uniqueRanges][0];
      return "Times vary";
    },
    [sortedDays, week.menu],
  );

  const compactCols = `72px repeat(${sortedDays.length}, minmax(116px, 1fr))`;

  return (
    <Card style={compactStyles.cardClip}>
      <CardHeader style={compactStyles.headerPad}>
        <CardTitle style={compactStyles.titleBase}>Compact Week Grid</CardTitle>
        <p {...stylex.props(compactStyles.headerHint)}>
          Meals as rows, days as columns for quick scanning.
        </p>
      </CardHeader>
      <CardContent>
        <div {...sxc("scrollbar-hide", compactStyles.scrollWrap)}>
          <div {...stylex.props(compactStyles.grid, compactStyles.gridCols(compactCols))}>
            <div {...stylex.props(compactStyles.cornerCell)}>Meal</div>
            {sortedDays.map((dateKey) => {
              const day = week.menu[dateKey];
              return (
                <div key={`compact-header-${dateKey}`} {...stylex.props(compactStyles.dayHeadCell)}>
                  <p {...stylex.props(compactStyles.dayHeadName)}>{day.day.slice(0, 3)}</p>
                  <p {...stylex.props(compactStyles.dayHeadDate)}>{dateKey.slice(5)}</p>
                </div>
              );
            })}

            {mealOrder.map((mealKey) => (
              <React.Fragment key={`compact-row-${mealKey}`}>
                <div {...stylex.props(compactStyles.mealLabelCell)}>
                  <div {...stylex.props(compactStyles.mealLabelRow)}>
                    {React.createElement(mealIcons[mealKey], {
                      ...stylex.props(compactStyles.icon12),
                    })}
                    <p {...stylex.props(compactStyles.mealLabelName)}>{mealTitles[mealKey]}</p>
                  </div>
                  <div {...stylex.props(compactStyles.mealLabelTimeWrap)}>
                    <p {...stylex.props(compactStyles.mealLabelTime)}>
                      {getMealTimeLabel(mealKey)}
                    </p>
                  </div>
                </div>
                {sortedDays.map((dateKey) => {
                  const day = week.menu[dateKey];
                  const meal = day.meals[mealKey];
                  const filteredItems = meal ? filterMenuItems(meal.items) : [];

                  return (
                    <div
                      key={`compact-cell-${mealKey}-${dateKey}`}
                      {...stylex.props(compactStyles.cell)}
                    >
                      {meal ? (
                        <div {...stylex.props(compactStyles.itemsStack)}>
                          {filteredItems.length > 0 ? (
                            <div {...stylex.props(compactStyles.itemsStack)}>
                              {filteredItems.map((item, idx) => (
                                <p
                                  key={`${mealKey}-${dateKey}-${idx}`}
                                  {...stylex.props(compactStyles.itemText)}
                                >
                                  {item.name}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p {...stylex.props(compactStyles.noItemsText)}>No items</p>
                          )}
                        </div>
                      ) : (
                        <p {...stylex.props(compactStyles.noMealText)}>No meal</p>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const dayStyles = stylex.create({
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 400,
    color: "var(--muted-foreground)",
  },
  mealsGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(1, minmax(0, 1fr))",
      "@media (min-width: 640px)": "repeat(2, minmax(0, 1fr))",
    },
    rowGap: "1rem",
    columnGap: "1rem",
  },
});

function DaySection({ day, dateKey }: { day: DayMenu; dateKey: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={dayStyles.titleRow}>
          <span>{day.day}</span>
          <span {...stylex.props(dayStyles.dateLabel)}>{dateKey}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div {...stylex.props(dayStyles.mealsGrid)}>
          {mealOrder.map((mealKey) => {
            const meal = day.meals[mealKey];
            if (!meal) return null;

            return (
              <MealCard
                key={mealKey}
                title={mealTitles[mealKey]}
                timeRange={`${meal.startTime} – ${meal.endTime} IST`}
                meal={meal}
                mealKey={mealKey}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const gridCardStyles = stylex.create({
  // `smooth-transition` (globals.css) can't be applied to Card as a class
  // string anymore, so its transition shorthand is replicated as longhands.
  card: {
    boxShadow: {
      default: null,
      ":hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    },
    transitionProperty: "transform, opacity, box-shadow",
    transitionDuration: "0.12s",
    transitionTimingFunction: easing.spring,
  },
  headerPad: {
    paddingBottom: "0.5rem",
  },
  // font-size only: the CardTitle base `leading-none` won over `text-sm`'s
  // line-height in the old cascade.
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
    fontSize: "0.875rem",
  },
  titleLeft: {
    display: "flex",
    alignItems: "center",
    rowGap: "0.25rem",
    columnGap: "0.25rem",
  },
  icon12: {
    height: "0.75rem",
    width: "0.75rem",
    color: "var(--primary)",
  },
  medium: {
    fontWeight: 500,
  },
  timeLabel: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    fontWeight: 400,
  },
  itemsStack: {
    display: "flex",
    flexDirection: "column",
    rowGap: "0.25rem",
  },
  item: {
    fontSize: "0.75rem",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "color-mix(in oklab, var(--muted) 50%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    lineHeight: 1.25,
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 20%, transparent)",
  },
  noItems: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    fontStyle: "italic",
    paddingBlock: "0.5rem",
  },
});

const MealGridCard = React.memo(function MealGridCard({
  meal,
  mealKey,
  timeRange,
}: {
  meal: Meal;
  mealKey: MealKey;
  timeRange: string;
}) {
  const Icon = mealIcons[mealKey];
  const filteredItems = React.useMemo(() => filterMenuItems(meal.items), [meal.items]);

  return (
    <Card style={gridCardStyles.card}>
      <CardHeader style={gridCardStyles.headerPad}>
        <CardTitle style={gridCardStyles.title}>
          <span {...stylex.props(gridCardStyles.titleLeft)}>
            <Icon {...stylex.props(gridCardStyles.icon12)} />
            <span {...stylex.props(gridCardStyles.medium)}>{mealTitles[mealKey]}</span>
          </span>
          <span {...stylex.props(gridCardStyles.timeLabel)}>{timeRange}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div {...stylex.props(gridCardStyles.itemsStack)}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <div key={idx} {...stylex.props(gridCardStyles.item)}>
                {item.name}
              </div>
            ))
          ) : (
            <div {...stylex.props(gridCardStyles.noItems)}>No items available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
