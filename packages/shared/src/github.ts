import { Octokit } from "octokit";

export const TIL_REPO_NAME = "my-daily-learning";

export function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

/** TIL 전용 레포가 없으면 자동 생성 (README.md auto_init). 이미 있으면 그대로 반환. */
export async function ensureTilRepo(octokit: Octokit, login: string) {
  try {
    const { data } = await octokit.rest.repos.get({ owner: login, repo: TIL_REPO_NAME });
    return { repo: data, created: false };
  } catch (err: any) {
    if (err.status !== 404) throw err;
  }

  const { data } = await octokit.rest.repos.createForAuthenticatedUser({
    name: TIL_REPO_NAME,
    description: "Git-Room 🧹 매일 배운 것 한 줄씩 기록하는 TIL 레포 (자동 생성됨)",
    auto_init: true,
    private: false,
  });

  // 최초 README 형태를 TIL 로그용으로 세팅
  const initial = `# 📚 my-daily-learning\n\nGit-Room이 관리하는 TIL(Today I Learned) 기록 레포입니다.\n매일 한 줄씩 배운 것을 남기면 [Git-Room](https://github.com/${login}) 방이 깨끗하게 유지돼요.\n\n---\n\n## Log\n`;

  const readme = await octokit.rest.repos.getContent({ owner: login, repo: TIL_REPO_NAME, path: "README.md" });
  const sha = Array.isArray(readme.data) ? undefined : (readme.data as any).sha;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: login,
    repo: TIL_REPO_NAME,
    path: "README.md",
    message: "chore: init TIL log via Git-Room",
    content: Buffer.from(initial, "utf-8").toString("base64"),
    sha,
  });

  return { repo: data, created: true };
}

/** README.md의 "## Log" 섹션 바로 아래에 오늘 TIL 한 줄을 커밋. */
export async function commitTil(octokit: Octokit, login: string, message: string) {
  const { data } = await octokit.rest.repos.getContent({
    owner: login,
    repo: TIL_REPO_NAME,
    path: "README.md",
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("README.md를 찾을 수 없습니다.");
  }

  const current = Buffer.from(data.content, "base64").toString("utf-8");
  const today = new Date().toISOString().slice(0, 10);
  const entry = `\n- **${today}**: ${message}`;

  const marker = "## Log";
  const idx = current.indexOf(marker);
  const updated =
    idx === -1
      ? `${current}\n${marker}\n${entry}\n`
      : current.slice(0, idx + marker.length) + entry + current.slice(idx + marker.length);

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: login,
    repo: TIL_REPO_NAME,
    path: "README.md",
    message: `TIL: ${today}`,
    content: Buffer.from(updated, "utf-8").toString("base64"),
    sha: data.sha,
  });
}

/** TIL 레포의 모든 폴더 경로를 조회 (레포가 없으면 빈 배열). */
export async function listRepoFolders(octokit: Octokit, login: string): Promise<string[]> {
  let defaultBranch: string;
  try {
    const { data } = await octokit.rest.repos.get({ owner: login, repo: TIL_REPO_NAME });
    defaultBranch = data.default_branch;
  } catch (err: any) {
    if (err.status === 404) return [];
    throw err;
  }

  const { data: ref } = await octokit.rest.git.getRef({
    owner: login,
    repo: TIL_REPO_NAME,
    ref: `heads/${defaultBranch}`,
  });

  const { data: tree } = await octokit.rest.git.getTree({
    owner: login,
    repo: TIL_REPO_NAME,
    tree_sha: ref.object.sha,
    recursive: "true",
  });

  return tree.tree
    .filter((entry) => entry.type === "tree" && entry.path)
    .map((entry) => entry.path as string)
    .sort();
}

/** 지정한 경로에 새 마크다운 문서를 커밋 (이미 존재하는 경로면 GitHub API 에러를 그대로 전파). */
export async function commitTilDoc(
  octokit: Octokit,
  login: string,
  path: string,
  content: string,
  message: string
) {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: login,
    repo: TIL_REPO_NAME,
    path,
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
  });
}
