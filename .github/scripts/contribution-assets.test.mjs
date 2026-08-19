import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateYears,
  calculateStreaks,
  normalizeDays,
  renderSnakeSvg,
  renderStatsSvg,
} from "./contribution-assets.mjs";
import {
  buildYearRange,
  extractYearRecord,
  validateGraphqlResponse,
  validateYears,
} from "./update-contribution-assets.mjs";

test("sums calendar totals without double-counting restricted contributions", () => {
  const result = aggregateYears([
    {
      totalContributions: 120,
      restrictedContributionsCount: 80,
      days: [],
    },
    {
      totalContributions: 380,
      restrictedContributionsCount: 260,
      days: [],
    },
  ]);

  assert.equal(result.totalContributions, 500);
  assert.equal(result.restrictedContributions, 340);
});

test("normalizes contribution days and removes duplicates and future dates", () => {
  const result = normalizeDays(
    [
      {
        year: 2025,
        days: [
          { date: "2025-12-31", contributionCount: 1 },
          { date: "2026-01-01", contributionCount: 99 },
        ],
      },
      {
        year: 2026,
        days: [
          { date: "2025-12-31", contributionCount: 1 },
          { date: "2026-01-01", contributionCount: 2 },
          { date: "2026-01-03", contributionCount: 5 },
        ],
      },
    ],
    "2026-01-02",
  );

  assert.deepEqual(result, [
    { date: "2025-12-31", contributionCount: 1 },
    { date: "2026-01-01", contributionCount: 2 },
  ]);
});

test("calculates current and longest streaks across a year boundary", () => {
  const days = [
    { date: "2025-12-30", contributionCount: 0 },
    { date: "2025-12-31", contributionCount: 1 },
    { date: "2026-01-01", contributionCount: 2 },
    { date: "2026-01-02", contributionCount: 1 },
  ];

  assert.deepEqual(calculateStreaks(days, "2026-01-02"), {
    current: 3,
    longest: 3,
  });
});

test("keeps the current streak through yesterday when today is inactive", () => {
  const days = [
    { date: "2026-01-01", contributionCount: 1 },
    { date: "2026-01-02", contributionCount: 1 },
    { date: "2026-01-03", contributionCount: 0 },
  ];

  assert.deepEqual(calculateStreaks(days, "2026-01-03"), {
    current: 2,
    longest: 2,
  });
});

test("renders all three contribution card themes with the required columns", () => {
  const stats = {
    totalContributions: 520,
    current: 3,
    longest: 5,
  };

  for (const theme of ["professional", "cyber", "modern"]) {
    const svg = renderStatsSvg(stats, theme);

    assert.match(svg, /^<svg /);
    assert.match(svg, />520</);
    assert.match(svg, />3</);
    assert.match(svg, />5</);
    assert.match(svg, /Total Contributions/);
    assert.match(svg, /Current Streak/);
    assert.match(svg, /Longest Streak/);
  }
});

test("rejects an unknown contribution card theme", () => {
  assert.throws(
    () =>
      renderStatsSvg(
        { totalContributions: 1, current: 1, longest: 1 },
        "unknown",
      ),
    /Unknown theme/,
  );
});

test("renders an animated snake over verified contribution cells", () => {
  const svg = renderSnakeSvg([
    { date: "2026-01-01", contributionCount: 1 },
    { date: "2026-01-02", contributionCount: 4 },
  ]);

  assert.match(svg, /^<svg /);
  assert.match(svg, /Contribution snake/);
  assert.match(svg, /data-date="2026-01-01"/);
  assert.match(svg, /data-count="4"/);
  assert.match(svg, /<animateMotion/);
});

test("rejects GraphQL errors instead of publishing stale assets", () => {
  assert.throws(
    () =>
      validateGraphqlResponse({
        errors: [{ message: "Bad credentials" }],
      }),
    /GraphQL.*Bad credentials/,
  );
});

test("rejects an empty contribution year list", () => {
  assert.throws(() => validateYears([]), /contribution years/i);
});

test("normalizes and sorts contribution years", () => {
  assert.deepEqual(validateYears([2026, 2024, 2026, 2025]), [
    2024,
    2025,
    2026,
  ]);
});

test("builds a bounded range for the current contribution year", () => {
  assert.deepEqual(buildYearRange(2026, "2026-07-28"), {
    from: "2026-01-01T00:00:00Z",
    to: "2026-07-28T23:59:59Z",
  });
});

test("extracts totals, restricted counts, and daily contribution data", () => {
  const result = extractYearRecord(2026, {
    contributionCalendar: {
      totalContributions: 520,
      weeks: [
        {
          contributionDays: [
            { date: "2026-07-28", contributionCount: 10 },
          ],
        },
      ],
    },
    restrictedContributionsCount: 397,
  });

  assert.deepEqual(result, {
    year: 2026,
    totalContributions: 520,
    restrictedContributionsCount: 397,
    days: [{ date: "2026-07-28", contributionCount: 10 }],
  });
});
