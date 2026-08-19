const DAY_IN_MS = 24 * 60 * 60 * 1000;

function dateToTimestamp(date) {
  return Date.parse(`${date}T00:00:00Z`);
}

function timestampToDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function aggregateYears(years) {
  return years.reduce(
    (totals, year) => ({
      totalContributions:
        totals.totalContributions + year.totalContributions,
      restrictedContributions:
        totals.restrictedContributions +
        year.restrictedContributionsCount,
    }),
    { totalContributions: 0, restrictedContributions: 0 },
  );
}

export function normalizeDays(years, today) {
  const latestTimestamp = dateToTimestamp(today);
  const daysByDate = new Map();

  for (const year of years) {
    for (const day of year.days) {
      if (
        year.year &&
        !day.date.startsWith(`${year.year}-`)
      ) {
        continue;
      }

      if (dateToTimestamp(day.date) > latestTimestamp) {
        continue;
      }

      const currentCount = daysByDate.get(day.date) ?? 0;
      daysByDate.set(
        day.date,
        Math.max(currentCount, day.contributionCount),
      );
    }
  }

  return [...daysByDate]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, contributionCount]) => ({
      date,
      contributionCount,
    }));
}

export function calculateStreaks(days, today) {
  const counts = new Map(
    days.map(({ date, contributionCount }) => [
      date,
      contributionCount,
    ]),
  );
  const todayTimestamp = dateToTimestamp(today);
  const firstTimestamp = days.length
    ? dateToTimestamp(days[0].date)
    : todayTimestamp;

  let longest = 0;
  let running = 0;

  for (
    let timestamp = firstTimestamp;
    timestamp <= todayTimestamp;
    timestamp += DAY_IN_MS
  ) {
    if ((counts.get(timestampToDate(timestamp)) ?? 0) > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let currentTimestamp = todayTimestamp;
  if ((counts.get(today) ?? 0) === 0) {
    currentTimestamp -= DAY_IN_MS;
  }

  let current = 0;
  while (
    currentTimestamp >= firstTimestamp &&
    (counts.get(timestampToDate(currentTimestamp)) ?? 0) > 0
  ) {
    current += 1;
    currentTimestamp -= DAY_IN_MS;
  }

  return { current, longest };
}

const THEMES = {
  professional: {
    background: "#ffffff",
    surface: "#f6f8fa",
    border: "#d0d7de",
    text: "#1f2328",
    muted: "#656d76",
    accent: "#0969da",
    secondary: "#1f883d",
  },
  cyber: {
    background: "#0d1117",
    surface: "#111820",
    border: "#00ff41",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#00ff41",
    secondary: "#39d0d8",
  },
  modern: {
    background: "#0d1117",
    surface: "#15111f",
    border: "#30363d",
    text: "#f0f3f6",
    muted: "#8b949e",
    accent: "#a371f7",
    secondary: "#39d0d8",
  },
};

function assertMetric(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative integer`);
  }
}

function metricColumn({
  center,
  value,
  label,
  caption,
  color,
}) {
  return `
    <circle cx="${center}" cy="43" r="12" fill="${color}" opacity=".16"/>
    <circle cx="${center}" cy="43" r="4" fill="${color}"/>
    <text x="${center}" y="92" class="metric" text-anchor="middle">${value}</text>
    <text x="${center}" y="124" class="label" text-anchor="middle">${label}</text>
    <text x="${center}" y="151" class="caption" text-anchor="middle">${caption}</text>`;
}

export function renderStatsSvg(stats, themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }

  assertMetric(stats.totalContributions, "totalContributions");
  assertMetric(stats.current, "current");
  assertMetric(stats.longest, "longest");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="195" viewBox="0 0 780 195" role="img" aria-labelledby="title description">
  <title id="title">Verified GitHub contribution statistics</title>
  <desc id="description">All-time contributions, current contribution streak, and longest contribution streak calculated from GitHub GraphQL data.</desc>
  <defs>
    <linearGradient id="background-accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity=".12"/>
      <stop offset=".55" stop-color="${theme.background}" stop-opacity="0"/>
      <stop offset="1" stop-color="${theme.secondary}" stop-opacity=".1"/>
    </linearGradient>
    <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .metric { fill: ${theme.text}; font: 700 36px ui-monospace, SFMono-Regular, Consolas, monospace; }
      .label { fill: ${theme.text}; font: 600 15px Inter, Segoe UI, sans-serif; }
      .caption { fill: ${theme.muted}; font: 600 10px Inter, Segoe UI, sans-serif; letter-spacing: 1.8px; }
    </style>
  </defs>
  <rect x="1" y="1" width="778" height="193" rx="18" fill="${theme.background}" stroke="${theme.border}" stroke-width="2"/>
  <rect x="2" y="2" width="776" height="191" rx="17" fill="url(#background-accent)"/>
  <path d="M260 27V168M520 27V168" stroke="${theme.border}" stroke-opacity=".75"/>
  <g filter="url(#soft-glow)">
${metricColumn({
    center: 130,
    value: stats.totalContributions.toLocaleString("en-US"),
    label: "Total Contributions",
    caption: "ALL TIME",
    color: theme.accent,
  })}
${metricColumn({
    center: 390,
    value: String(stats.current),
    label: "Current Streak",
    caption: "ACTIVE DAYS",
    color: theme.secondary,
  })}
${metricColumn({
    center: 650,
    value: String(stats.longest),
    label: "Longest Streak",
    caption: "PERSONAL BEST",
    color: theme.accent,
  })}
  </g>
  <text x="390" y="181" fill="${theme.muted}" font-family="Inter, Segoe UI, sans-serif" font-size="9" text-anchor="middle" letter-spacing="1.2">VERIFIED VIA GITHUB GRAPHQL</text>
</svg>`;
}

function contributionColor(count) {
  if (count === 0) return "#161b22";
  if (count <= 2) return "#0e4429";
  if (count <= 5) return "#006d32";
  if (count <= 9) return "#26a641";
  return "#39d353";
}

export function renderSnakeSvg(days) {
  const counts = new Map(
    days.map(({ date, contributionCount }) => [
      date,
      contributionCount,
    ]),
  );
  const latestTimestamp = days.length
    ? Math.max(...days.map(({ date }) => dateToTimestamp(date)))
    : Date.now();
  const latestDate = new Date(latestTimestamp);
  const endTimestamp =
    latestTimestamp + (6 - latestDate.getUTCDay()) * DAY_IN_MS;
  const totalDays = 52 * 7;
  const startTimestamp =
    endTimestamp - (totalDays - 1) * DAY_IN_MS;
  const cellSize = 11;
  const gap = 4;
  const step = cellSize + gap;
  const offsetX = 61;
  const offsetY = 48;
  const cells = [];

  for (let index = 0; index < totalDays; index += 1) {
    const timestamp = startTimestamp + index * DAY_IN_MS;
    const date = timestampToDate(timestamp);
    const column = Math.floor(index / 7);
    const row = index % 7;
    const count = counts.get(date) ?? 0;
    cells.push(
      `<rect x="${offsetX + column * step}" y="${offsetY + row * step}" width="${cellSize}" height="${cellSize}" rx="2" fill="${contributionColor(count)}" data-date="${date}" data-count="${count}"/>`,
    );
  }

  const routeParts = [];
  for (let row = 0; row < 7; row += 1) {
    const y = offsetY + row * step + cellSize / 2;
    const left = offsetX + cellSize / 2;
    const right = offsetX + 51 * step + cellSize / 2;
    routeParts.push(
      `${row === 0 ? "M" : "L"}${row % 2 === 0 ? left : right} ${y}`,
      `H${row % 2 === 0 ? right : left}`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="180" viewBox="0 0 900 180" role="img" aria-labelledby="snake-title snake-description">
  <title id="snake-title">Contribution snake</title>
  <desc id="snake-description">Animated snake moving through the latest 52 weeks of verified GitHub contribution activity.</desc>
  <defs>
    <filter id="snake-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <path id="snake-route" d="${routeParts.join(" ")}" fill="none"/>
  </defs>
  <rect width="900" height="180" rx="16" fill="#0d1117"/>
  <text x="61" y="27" fill="#39d353" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="12" font-weight="700" letter-spacing="2">CONTRIBUTION SNAKE // VERIFIED GRAPHQL DATA</text>
  <g>${cells.join("")}</g>
  <use href="#snake-route" fill="none" stroke="#39d353" stroke-linecap="round" stroke-width="7" stroke-dasharray="45 6000" filter="url(#snake-glow)">
    <animate attributeName="stroke-dashoffset" from="0" to="-6000" dur="8s" repeatCount="indefinite"/>
  </use>
  <circle r="6" fill="#39d353" filter="url(#snake-glow)">
    <animateMotion dur="8s" repeatCount="indefinite"><mpath href="#snake-route"/></animateMotion>
  </circle>
  <text x="839" y="164" fill="#8b949e" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="10" text-anchor="end">LATEST 52 WEEKS</text>
</svg>`;
}
