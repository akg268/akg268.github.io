"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const GITHUB_USER = "akg268";
const EXCLUDED_REPO = new RegExp(["a", "i", "d", "l", "c"].join(""), "i");

type GitHubProfile = {
  avatar_url: string;
  created_at: string;
  hireable: boolean | null;
  html_url: string;
  location: string | null;
  name: string | null;
  public_repos: number;
  updated_at: string;
};

type GitHubRepo = {
  description: string | null;
  fork: boolean;
  forks_count: number;
  full_name: string;
  html_url: string;
  language: string | null;
  name: string;
  open_issues_count: number;
  pushed_at: string | null;
  stargazers_count: number;
  topics?: string[];
  updated_at: string;
};

type GitHubLabel = {
  color: string;
  name: string;
};

type GitHubIssue = {
  comments: number;
  created_at: string;
  html_url: string;
  labels: GitHubLabel[];
  repository_url: string;
  title: string;
  updated_at: string;
  user: {
    login: string;
  };
};

type IssueSearchResponse = {
  items: GitHubIssue[];
  total_count: number;
};

const focusAreas = [
  {
    eyebrow: "Developer tooling",
    title: "Prompt-preflight",
    body: "Local hooks for catching vague agent prompts before they waste time or produce the wrong kind of work.",
  },
  {
    eyebrow: "Applied experiments",
    title: "LangChain, RAG, and MCP",
    body: "Small Python repos for testing retrieval, model context, tool boundaries, and practical integration patterns.",
  },
  {
    eyebrow: "Backend systems",
    title: "Spring, gRPC, Kafka, OAuth",
    body: "A long-running Java/Spring trail around services, tracing, messaging, authentication, and platform reliability.",
  },
  {
    eyebrow: "Quality loop",
    title: "Everyone tests in production",
    body: "The point is not chaos. It is observability, small rollouts, fast rollback, and turning real behavior into better tests.",
  },
];

const productionLoops = [
  ["Observe", "Trace the real path through logs, metrics, and user-visible signals."],
  ["Gate", "Use flags, canaries, and rollbacks so experiments have edges."],
  ["Learn", "Compare expectations against production behavior, then keep the useful surprises."],
  ["Patch", "Move what you learned into tests, hooks, runbooks, and safer defaults."],
];

const priorityRepos = [
  "prompt-preflight",
  "langchain-rag",
  "mcp_slm_langchain",
  "springAI",
  "GrpcService",
  "boot2-with-junit5-sample",
  "xssfilter",
  "java_workouts",
];

const issueLabels = [
  { label: "Good first issue", value: "good first issue" },
  { label: "Help wanted", value: "help wanted" },
  { label: "Bug", value: "bug" },
  { label: "Any open issue", value: "any" },
];

const issuePrompts = [
  "developer tools prompt validation",
  "langchain rag python documentation",
  "spring boot testing java",
  "observability tracing developer tools",
];

function formatDate(value?: string | null) {
  if (!value) return "Recent";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function repositoryName(issue: GitHubIssue) {
  return issue.repository_url.replace("https://api.github.com/repos/", "");
}

function repoNarrative(repo: GitHubRepo) {
  const descriptions: Record<string, string> = {
    "prompt-preflight":
      "Local prompt checks that catch ambiguity before an agent spends time on the wrong work.",
    "langchain-rag":
      "A compact Python RAG lab for testing retrieval workflows and model-grounded answers.",
    mcp_slm_langchain:
      "An exploration of MCP-style tool context with LangChain and smaller-model workflows.",
    langchain:
      "A LangChain sandbox for trying chains, prompts, and integration patterns.",
    springAI:
      "A Java track for bringing AI workflows into familiar Spring application shapes.",
    GrpcService:
      "Service boundary practice around gRPC, contracts, and backend communication.",
    xssfilter:
      "Security-minded Java work around request filtering and safer web surfaces.",
    "boot2-with-junit5-sample":
      "A Spring Boot 2 and JUnit 5 sample focused on modern test structure.",
    java_workouts:
      "Java practice space for sharpening fundamentals and implementation fluency.",
  };

  return (
    descriptions[repo.name] ??
    repo.description ??
    "A public workspace note from Arunkumar's GitHub activity."
  );
}

function hasExcludedText(repo: GitHubRepo) {
  return EXCLUDED_REPO.test(`${repo.name} ${repo.description ?? ""}`);
}

export default function Home() {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoState, setRepoState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [issueQuery, setIssueQuery] = useState(
    "developer tools testing observability",
  );
  const [issueLabel, setIssueLabel] = useState("good first issue");
  const [issueState, setIssueState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [issueMessage, setIssueMessage] = useState(
    "Search GitHub for contribution-ready issues.",
  );
  const [issues, setIssues] = useState<GitHubIssue[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGitHub() {
      try {
        const [profileResponse, repoResponse] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USER}`, {
            signal: controller.signal,
            headers: { Accept: "application/vnd.github+json" },
          }),
          fetch(
            `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
            {
              signal: controller.signal,
              headers: { Accept: "application/vnd.github+json" },
            },
          ),
        ]);

        if (!profileResponse.ok || !repoResponse.ok) {
          throw new Error("GitHub request failed");
        }

        const [profileData, repoData] = (await Promise.all([
          profileResponse.json(),
          repoResponse.json(),
        ])) as [GitHubProfile, GitHubRepo[]];

        setProfile(profileData);
        setRepos(repoData.filter((repo) => !hasExcludedText(repo)));
        setRepoState("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          setRepoState("error");
        }
      }
    }

    loadGitHub();
    return () => controller.abort();
  }, []);

  const sourceRepos = useMemo(
    () => repos.filter((repo) => !repo.fork),
    [repos],
  );

  const featuredRepos = useMemo(() => {
    const byName = new Map(repos.map((repo) => [repo.name, repo]));
    const chosen = priorityRepos
      .map((name) => byName.get(name))
      .filter((repo): repo is GitHubRepo => Boolean(repo));
    const active = sourceRepos
      .filter((repo) => !chosen.includes(repo))
      .sort(
        (a, b) =>
          new Date(b.pushed_at ?? b.updated_at).getTime() -
          new Date(a.pushed_at ?? a.updated_at).getTime(),
      );

    return [...chosen, ...active].slice(0, 8);
  }, [repos, sourceRepos]);

  const languages = useMemo(() => {
    const totals = new Map<string, number>();
    for (const repo of sourceRepos) {
      if (!repo.language) continue;
      totals.set(repo.language, (totals.get(repo.language) ?? 0) + 1);
    }

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [sourceRepos]);

  const totalLanguageCount = Math.max(
    languages.reduce((sum, language) => sum + language.count, 0),
    1,
  );

  const repoStats = useMemo(() => {
    const openIssues = sourceRepos.reduce(
      (sum, repo) => sum + repo.open_issues_count,
      0,
    );
    const stars = sourceRepos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0,
    );

    return [
      {
        label: "Public repos",
        value: profile?.public_repos ?? repos.length,
      },
      {
        label: "Source projects",
        value: sourceRepos.length || "Loading",
      },
      {
        label: "Open project issues",
        value: openIssues,
      },
      {
        label: "Community signals",
        value: stars,
      },
    ];
  }, [profile, repos.length, sourceRepos]);

  async function searchIssues(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const cleanedQuery = issueQuery.trim() || "developer tools testing";
    const labelQualifier =
      issueLabel === "any" ? "" : `label:"${issueLabel}"`;
    const query = `${cleanedQuery} is:issue is:open no:assignee archived:false ${labelQualifier}`.trim();
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
      query,
    )}&sort=updated&order=desc&per_page=8`;

    setIssueState("loading");
    setIssueMessage("Searching open GitHub issues...");

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "GitHub rate limit reached. Try again in a bit."
            : "GitHub issue search failed.",
        );
      }

      const data = (await response.json()) as IssueSearchResponse;
      const filtered = data.items.filter((issue) => issue.html_url).slice(0, 8);
      setIssues(filtered);
      setIssueState("ready");
      setIssueMessage(
        filtered.length
          ? `${data.total_count.toLocaleString("en-US")} open issues matched. Showing the freshest ${filtered.length}.`
          : "No open issues matched that search. Try a broader phrase.",
      );
    } catch (error) {
      setIssues([]);
      setIssueState("error");
      setIssueMessage(
        error instanceof Error
          ? error.message
          : "GitHub issue search failed.",
      );
    }
  }

  return (
    <main className="page-shell">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand-mark" href="#top" aria-label="Back to top">
          AG
        </a>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <a href="#production">Production tests</a>
          <a href="#issues">Issue finder</a>
        </div>
      </nav>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Arunkumar Ganesan / @akg268</p>
          <h1>
            Backend systems, developer tools, and production feedback loops.
          </h1>
          <p className="hero-lede">
            I use GitHub as a working notebook for practical software:
            prompt-preflight tooling, RAG and MCP experiments, Java/Spring
            systems, gRPC services, testing examples, and the kind of production
            learning loop that makes the next release safer.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="https://github.com/akg268">
              View GitHub
            </a>
            <a className="button secondary" href="#issues">
              Find issues to contribute
            </a>
          </div>
        </div>

        <aside className="profile-panel" aria-label="GitHub profile summary">
          <div className="profile-card">
            <img
              src={
                profile?.avatar_url ??
                "https://avatars.githubusercontent.com/u/18699334?v=4"
              }
              alt="Arunkumar Ganesan GitHub avatar"
            />
            <div>
              <span className="profile-kicker">GitHub profile</span>
              <h2>{profile?.name ?? "Arunkumar Ganesan"}</h2>
              <p>{profile?.location ?? "USA"} / Available for useful work</p>
            </div>
          </div>

          <div className="activity-card">
            <div className="activity-card-header">
              <span>Current thread</span>
              <strong>public repos</strong>
            </div>
            <div className="activity-list">
              {[
                "prompt-preflight",
                "langchain-rag",
                "mcp_slm_langchain",
                "springAI",
                "GrpcService",
              ].map((name) => (
                <span key={name}>
                  <code>{name}</code>
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="metric-strip" aria-label="GitHub profile statistics">
        {repoStats.map((stat) => (
          <div className="metric" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section-grid">
        {focusAreas.map((area) => (
          <article className="focus-card" key={area.title}>
            <p>{area.eyebrow}</p>
            <h2>{area.title}</h2>
            <span>{area.body}</span>
          </article>
        ))}
      </section>

      <section id="projects" className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Projects</p>
          <h2>From prompt guardrails to Spring-era systems craft.</h2>
          <p>
            The GitHub trail moves from Java backend fundamentals into newer
            tooling and model-context experiments. Recent repositories lean into
            prompt quality, RAG, LangChain, MCP, and Spring application work
            while older repos keep the Spring, Kafka, gateway, OAuth, and testing foundation
            visible.
          </p>
        </div>

        <div className="project-layout">
          <div className="repo-grid">
            {repoState === "error" && (
              <p className="state-note">
                GitHub data could not load right now, but the page is ready to
                refresh when the API is available.
              </p>
            )}

            {featuredRepos.length
              ? featuredRepos.map((repo) => (
                  <a
                    className="repo-card"
                    href={repo.html_url}
                    key={repo.full_name}
                  >
                    <span className="repo-meta">
                      {repo.language ?? "Mixed"} / {repo.fork ? "fork" : "source"}
                    </span>
                    <h3>{repo.name}</h3>
                    <p>{repoNarrative(repo)}</p>
                    <div className="repo-facts">
                      <span>{formatDate(repo.pushed_at ?? repo.updated_at)}</span>
                      <span>{repo.open_issues_count} open issues</span>
                    </div>
                  </a>
                ))
              : Array.from({ length: 4 }, (_, index) => (
                  <div className="repo-card loading-card" key={index}>
                    <span className="repo-meta">Loading GitHub</span>
                    <h3>Project signal</h3>
                    <p>Fetching public repositories from @akg268.</p>
                    <div className="repo-facts">
                      <span>GitHub API</span>
                      <span>Live</span>
                    </div>
                  </div>
                ))}
          </div>

          <aside className="language-panel" aria-label="Repository languages">
            <p className="eyebrow">Working set</p>
            <h3>Language shape</h3>
            <div className="language-list">
              {languages.length ? (
                languages.map((language) => (
                  <div className="language-row" key={language.name}>
                    <div>
                      <span>{language.name}</span>
                      <strong>{language.count}</strong>
                    </div>
                    <i
                      style={{
                        width: `${Math.max(
                          (language.count / totalLanguageCount) * 100,
                          12,
                        )}%`,
                      }}
                    />
                  </div>
                ))
              ) : (
                <p className="state-note">Loading language data from GitHub.</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section id="production" className="production-section">
        <div className="section-heading compact">
          <p className="eyebrow">Everyone tests in production</p>
          <h2>The craft is making production feedback intentional.</h2>
          <p>
            Production is where traffic, timing, data shape, and human behavior
            finally meet. The right engineering stance is not pretending that
            this never happens. It is designing the loop so every surprise has a
            guardrail and every signal becomes better software.
          </p>
        </div>
        <div className="loop-grid">
          {productionLoops.map(([title, body], index) => (
            <article className="loop-step" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="issues" className="issue-section">
        <div className="section-heading compact">
          <p className="eyebrow">Contribution search</p>
          <h2>Find GitHub issues worth jumping into.</h2>
          <p>
            Search for open issues across GitHub by theme, then open the
            strongest matches directly. Try terms around tooling, testing,
            Spring, observability, documentation, or whatever you want to
            practice next.
          </p>
        </div>

        <form className="issue-search" onSubmit={searchIssues}>
          <label>
            <span>Search terms</span>
            <input
              value={issueQuery}
              onChange={(event) => setIssueQuery(event.target.value)}
              placeholder="Spring testing, RAG docs, observability"
            />
          </label>
          <label>
            <span>Issue label</span>
            <select
              value={issueLabel}
              onChange={(event) => setIssueLabel(event.target.value)}
            >
              {issueLabels.map((label) => (
                <option key={label.value} value={label.value}>
                  {label.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button search-button" type="submit">
            <span className="search-glyph" aria-hidden="true" />
            Search open issues
          </button>
        </form>

        <div className="prompt-row" aria-label="Search suggestions">
          {issuePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setIssueQuery(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className={`issue-results ${issueState}`}>
          <p className="state-note">{issueMessage}</p>
          {issueState === "loading" && (
            <div className="loading-bar" aria-label="Searching" />
          )}
          {issues.map((issue) => (
            <a className="issue-card" href={issue.html_url} key={issue.html_url}>
              <div>
                <span>{repositoryName(issue)}</span>
                <h3>{issue.title}</h3>
              </div>
              <div className="issue-card-footer">
                <span>{formatDate(issue.updated_at)}</span>
                <span>{issue.comments} comments</span>
                <span>{issue.user.login}</span>
              </div>
              <div className="label-row">
                {issue.labels.slice(0, 4).map((label) => (
                  <small key={label.name}>{label.name}</small>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>
          Built around public GitHub activity, practical experiments, and
          production-minded software craft.
        </span>
        <a href="https://github.com/akg268">github.com/akg268</a>
      </footer>
    </main>
  );
}
