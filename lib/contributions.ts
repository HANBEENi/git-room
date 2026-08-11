// lib/contributions.ts
// 두 가지 방법으로 커밋(잔디) 데이터를 가져온다.
// 1) fetchPublicContributions: 토큰 없이 github.com의 공개 잔디 그래프 HTML을 스크래핑.
//    -> README 위젯(/api/room)처럼 "로그인 없이 아무 유저나 조회"할 때 사용.
// 2) fetchViewerContributions: 로그인한 사용자의 OAuth 토큰으로 GraphQL 호출.
//    -> 대시보드에서 더 정확한 본인 데이터가 필요할 때 사용.

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ContributionResult {
  days: ContributionDay[];
  daysSinceLastCommit: number;
  currentStreak: number;
}

function computeStats(days: ContributionDay[]): Omit<ContributionResult, "days"> {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1)); // 최신순
  const todayStr = new Date().toISOString().slice(0, 10);

  let daysSinceLastCommit = Infinity;
  for (const d of sorted) {
    if (d.count > 0) {
      const diff = Math.floor(
        (new Date(todayStr).getTime() - new Date(d.date).getTime()) / 86400000
      );
      daysSinceLastCommit = diff;
      break;
    }
  }
  if (!isFinite(daysSinceLastCommit)) daysSinceLastCommit = 365;

  let currentStreak = 0;
  for (const d of sorted) {
    if (d.date > todayStr) continue;
    if (d.count > 0) currentStreak++;
    else break;
  }

  return { daysSinceLastCommit, currentStreak };
}

/** 토큰 없이 공개 잔디 그래프를 스크래핑 (README 위젯용). */
export async function fetchPublicContributions(username: string): Promise<ContributionResult> {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
    headers: { "User-Agent": "git-room-app" },
    // README 위젯은 캐시를 짧게 둬서 너무 자주 GitHub에 부담 주지 않도록 함
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GitHub contributions page fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const days: ContributionDay[] = [];

  // <td ... data-date="2024-05-01" ... data-level="2" ...> 형태(순서 무관)를 파싱
  const cellRegex = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = cellRegex.exec(html)) !== null) {
    const tag = match[0];
    const date = match[1];
    const levelMatch = tag.match(/data-level="(\d+)"/);
    const countMatch = tag.match(/data-count="(\d+)"/);
    const count = countMatch ? parseInt(countMatch[1], 10) : levelMatch ? parseInt(levelMatch[1], 10) : 0;
    days.push({ date, count });
  }

  if (days.length === 0) {
    throw new Error("잔디 데이터를 파싱하지 못했습니다. GitHub 마크업이 변경되었을 수 있습니다.");
  }

  return { days, ...computeStats(days) };
}

/** 로그인한 사용자의 토큰으로 GraphQL 조회 (대시보드용, 더 정확함). */
export async function fetchViewerContributions(accessToken: string): Promise<ContributionResult> {
  const query = `
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const weeks = json?.data?.viewer?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days: ContributionDay[] = weeks.flatMap((w: any) =>
    w.contributionDays.map((d: any) => ({ date: d.date, count: d.contributionCount }))
  );

  return { days, ...computeStats(days) };
}
