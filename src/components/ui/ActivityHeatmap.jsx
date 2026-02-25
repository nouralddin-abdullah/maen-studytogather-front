import { useMemo, useState } from "react";

/**
 * Day names (Arabic, short) — Saturday to Friday to match the Arabic week.
 */
const DAY_LABELS = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];

/**
 * Month names (Arabic, short).
 */
const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/**
 * Format a Date to YYYY-MM-DD using local time (avoids UTC timezone shift).
 */
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Map minutes to intensity level 0–4.
 */
function getLevel(minutes) {
  if (minutes === 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
}

/**
 * Color classes per level (uses CSS custom properties for theme compat).
 */
const LEVEL_COLORS = {
  light: [
    "#ebedf0", // 0 — none
    "#d9edff", // 1 — low  (brand-100)
    "#8eccff", // 2 — medium (brand-300)
    "#338dfc", // 3 — high  (brand-500)
    "#1558de", // 4 — very high (brand-700)
  ],
  dark: [
    "#2d333b", // 0 — none
    "#142856", // 1 — low  (brand-950)
    "#193f8d", // 2 — medium (brand-900)
    "#1d6ef1", // 3 — high  (brand-600)
    "#59aeff", // 4 — very high (brand-400)
  ],
};

/**
 * Build week-column grid data from the heatmap API response.
 * Returns array of 53 columns, each with up to 7 day cells.
 */
function buildGrid(data, year) {
  // Build a date → minutes lookup
  const lookup = {};
  if (data) {
    for (const d of data) {
      lookup[d.date] = d.minutes;
    }
  }

  // Start from Jan 1 of the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const columns = [];
  let currentCol = [];

  // Pad empty cells for the first week (days before Jan 1)
  const startDay = startDate.getDay(); // 0=Sun … 6=Sat
  // Convert to Sat-based: Sat=0, Sun=1, … Fri=6
  const satBasedStart = (startDay + 1) % 7;
  for (let i = 0; i < satBasedStart; i++) {
    currentCol.push(null);
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = formatLocalDate(current);
    const minutes = lookup[dateStr] || 0;

    currentCol.push({ date: dateStr, minutes, level: getLevel(minutes) });

    // If this is Friday (day 5 in our grid), start new column
    const dayOfWeek = current.getDay();
    const satBased = (dayOfWeek + 1) % 7;
    if (satBased === 6) {
      columns.push(currentCol);
      currentCol = [];
    }

    current.setDate(current.getDate() + 1);
  }

  // Push remaining days
  if (currentCol.length > 0) {
    columns.push(currentCol);
  }

  return columns;
}

/**
 * Get month label positions based on grid columns and year.
 */
function getMonthLabels(columns, year) {
  const labels = [];
  let lastMonth = -1;

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const cell of columns[colIdx]) {
      if (!cell) continue;
      const month = parseInt(cell.date.split("-")[1], 10) - 1;
      if (month !== lastMonth) {
        labels.push({ month, colIdx });
        lastMonth = month;
      }
      break; // Only check first non-null cell per column
    }
  }

  return labels;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;

/**
 * ActivityHeatmap — GitHub-style contribution graph.
 *
 * Props:
 *   data — array of { date, minutes } from the heatmap API
 *   year — the year being displayed
 *   isLoading — show skeleton
 *   isDark — dark mode flag
 *   onYearChange — callback to change year
 */
function ActivityHeatmap({
  data,
  year,
  isLoading,
  isDark = false,
  onYearChange,
}) {
  const [tooltip, setTooltip] = useState(null);

  const columns = useMemo(() => buildGrid(data, year), [data, year]);
  const monthLabels = useMemo(
    () => getMonthLabels(columns, year),
    [columns, year],
  );
  const colors = isDark ? LEVEL_COLORS.dark : LEVEL_COLORS.light;

  const totalMinutes = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, d) => sum + d.minutes, 0);
  }, [data]);

  const svgWidth = columns.length * CELL_STEP + 30; // extra for day labels
  const svgHeight = 7 * CELL_STEP + 28; // extra for month labels

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          {Math.round(totalMinutes / 60)} ساعة تركيز في {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange?.(year - 1)}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-sm px-2 py-1 rounded-lg hover:bg-surface-muted"
          >
            {year - 1}
          </button>
          <span className="text-sm font-bold text-brand-600">{year}</span>
          <button
            onClick={() => onYearChange?.(year + 1)}
            disabled={year >= new Date().getFullYear()}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-sm px-2 py-1 rounded-lg hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {year + 1}
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto pb-2" dir="ltr">
        {isLoading ? (
          <div className="h-[140px] bg-surface-muted rounded-xl animate-pulse" />
        ) : (
          <div className="relative">
            <svg
              width={svgWidth}
              height={svgHeight}
              className="block"
              role="img"
              aria-label={`Activity heatmap for ${year}`}
            >
              {/* Month labels */}
              {monthLabels.map(({ month, colIdx }) => (
                <text
                  key={`month-${colIdx}`}
                  x={colIdx * CELL_STEP + 28}
                  y={10}
                  className="fill-text-muted"
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                >
                  {MONTH_LABELS[month]}
                </text>
              ))}

              {/* Day labels */}
              {[1, 3, 5].map((dayIdx) => (
                <text
                  key={`day-${dayIdx}`}
                  x={0}
                  y={dayIdx * CELL_STEP + 26}
                  className="fill-text-muted"
                  fontSize={9}
                  fontFamily="var(--font-sans)"
                  dominantBaseline="middle"
                >
                  {DAY_LABELS[dayIdx]}
                </text>
              ))}

              {/* Cells */}
              {columns.map((col, colIdx) =>
                col.map((cell, rowIdx) => {
                  if (!cell) return null;
                  const x = colIdx * CELL_STEP + 22;
                  const y = rowIdx * CELL_STEP + 18;

                  return (
                    <rect
                      key={cell.date}
                      x={x}
                      y={y}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={2}
                      ry={2}
                      fill={colors[cell.level]}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onMouseEnter={(e) => {
                        const rect = e.target.getBoundingClientRect();
                        setTooltip({
                          date: cell.date,
                          minutes: cell.minutes,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                }),
              )}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border shadow-elevated text-xs font-medium text-text-primary pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y - 36,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="font-mono">{tooltip.minutes}</span> دقيقة —{" "}
                {tooltip.date}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-2 text-xs text-text-muted"
        dir="ltr"
      >
        <span>أقل</span>
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>أكثر</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
