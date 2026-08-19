import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  aggregateYears,
  calculateStreaks,
  normalizeDays,
  renderSnakeSvg,
  renderStatsSvg,
} from "./contribution-assets.mjs";

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const CARD_THEMES = ["professional", "cyber", "modern"];

const CONTRIBUTION_YEARS_QUERY = `
  query ContributionYears($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

const CONTRIBUTION_YEAR_QUERY = `
  query Contributions(
    $login: String!
    $from: DateTime!
    $to: DateTime!
  ) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        restrictedContributionsCount
      }
    }
  }
`;

export function validateGraphqlResponse(response) {
  if (response?.errors?.length) {
    const messages = response.errors
      .map(({ message }) => message || "Unknown GraphQL error")
      .join("; ");
    throw new Error(`GraphQL request failed: ${messages}`);
  }

  if (!response?.data) {
    throw new Error("GraphQL response is missing data");
  }

  return response.data;
}

export function validateYears(years) {
  if (!Array.isArray(years) || years.length === 0) {
    throw new Error("GitHub returned no contribution years");
  }

  const normalized = [
    ...new Set(
      years.filter(
        (year) => Number.isInteger(year) && year >= 2008,
      ),
    ),
  ].sort((left, right) => left - right);

  if (normalized.length === 0) {
    throw new Error("GitHub returned no valid contribution years");
  }

  return normalized;
}

export function buildYearRange(year, today) {
  const currentYear = Number(today.slice(0, 4));
  if (!Number.isInteger(year) || year > currentYear) {
    throw new Error(`Invalid contribution year: ${year}`);
  }

  const endDate = year === currentYear ? today : `${year}-12-31`;
  return {
    from: `${year}-01-01T00:00:00Z`,
    to: `${endDate}T23:59:59Z`,
  };
}

export function extractYearRecord(year, collection) {
  const calendar = collection?.contributionCalendar;
  if (
    !calendar ||
    !Number.isInteger(calendar.totalContributions) ||
    !Array.isArray(calendar.weeks) ||
    !Number.isInteger(collection.restrictedContributionsCount)
  ) {
    throw new Error(`Missing contribution calendar data for ${year}`);
  }

  const days = calendar.weeks.flatMap((week) => {
    if (!Array.isArray(week?.contributionDays)) {
      throw new Error(`Missing contribution days for ${year}`);
    }

    return week.contributionDays.map((day) => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day?.date) ||
        !Number.isInteger(day?.contributionCount) ||
        day.contributionCount < 0
      ) {
        throw new Error(`Malformed contribution day for ${year}`);
      }

      return {
        date: day.date,
        contributionCount: day.contributionCount,
      };
    });
  });

  return {
    year,
    totalContributions: calendar.totalContributions,
    restrictedContributionsCount:
      collection.restrictedContributionsCount,
    days,
  };
}

async function graphqlRequest(token, query, variables) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "edomod-profile-contribution-assets",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL HTTP ${response.status}: ${response.statusText}`,
    );
  }

  return validateGraphqlResponse(await response.json());
}

async function fetchContributionRecords({ token, login, today }) {
  const yearsData = await graphqlRequest(
    token,
    CONTRIBUTION_YEARS_QUERY,
    { login },
  );
  const user = yearsData.user;
  if (!user) {
    throw new Error(`GitHub user not found: ${login}`);
  }

  const years = validateYears(
    user.contributionsCollection?.contributionYears,
  );

  return Promise.all(
    years.map(async (year) => {
      const range = buildYearRange(year, today);
      const data = await graphqlRequest(
        token,
        CONTRIBUTION_YEAR_QUERY,
        { login, ...range },
      );

      if (!data.user) {
        throw new Error(`GitHub user not found: ${login}`);
      }

      return extractYearRecord(
        year,
        data.user.contributionsCollection,
      );
    }),
  );
}

export async function updateContributionAssets({
  token,
  login,
  today = new Date().toISOString().slice(0, 10),
  outputDirectory = "dist/profile",
  tokenIsPersonal = false,
}) {
  if (!token) {
    throw new Error("GH_GRAPHQL_TOKEN is required");
  }
  if (!login) {
    throw new Error("PROFILE_LOGIN is required");
  }

  const records = await fetchContributionRecords({
    token,
    login,
    today,
  });
  const totals = aggregateYears(records);

  if (
    !tokenIsPersonal &&
    totals.restrictedContributions === 0
  ) {
    throw new Error(
      "Restricted contribution counts are unavailable. " +
        "Add a PROFILE_STATS_TOKEN secret with read:user permission.",
    );
  }

  const days = normalizeDays(records, today);
  const streaks = calculateStreaks(days, today);
  const stats = {
    totalContributions: totals.totalContributions,
    current: streaks.current,
    longest: streaks.longest,
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    ...CARD_THEMES.map((theme) =>
      writeFile(
        path.join(
          outputDirectory,
          `github-contribution-stats-${theme}.svg`,
        ),
        renderStatsSvg(stats, theme),
        "utf8",
      ),
    ),
    writeFile(
      path.join(
        outputDirectory,
        "github-contribution-snake.svg",
      ),
      renderSnakeSvg(days),
      "utf8",
    ),
  ]);

  return {
    ...stats,
    years: records.map(({ year }) => year),
    restrictedContributions:
      totals.restrictedContributions,
    outputDirectory,
  };
}

async function main() {
  const result = await updateContributionAssets({
    token: process.env.GH_GRAPHQL_TOKEN,
    login:
      process.env.PROFILE_LOGIN ||
      process.env.GITHUB_REPOSITORY_OWNER,
    today:
      process.env.PROFILE_TODAY ||
      new Date().toISOString().slice(0, 10),
    outputDirectory:
      process.env.PROFILE_OUTPUT_DIRECTORY || "dist/profile",
    tokenIsPersonal:
      process.env.PROFILE_TOKEN_IS_PERSONAL === "true",
  });

  console.log(
    `Generated verified profile assets: ${JSON.stringify(result)}`,
  );
}

const entryPoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (import.meta.url === entryPoint) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
