import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the GitHub homepage shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Arunkumar Ganesan \| GitHub Home<\/title>/i);
  assert.match(html, /Backend systems, developer tools, and production feedback loops/i);
  assert.match(html, /Thule AI Dev Skills/i);
  assert.match(html, /AI-assisted development/i);
  assert.match(html, /src="\/profile\.png"/i);
  assert.match(html, /Everyone tests in production/i);
  assert.match(html, /Search open issues/i);
  assert.match(html, /unassigned issues no one has commented on/i);
  assert.match(html, /github\.com\/akg268/i);
  assert.doesNotMatch(html, new RegExp(["a", "i", "d", "l", "c"].join(""), "i"));
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("removes starter preview assets and metadata", async () => {
  const [css, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /const GITHUB_USER = "akg268"/);
  assert.match(page, /const EXCLUDED_REPO = new RegExp/);
  assert.match(page, /api\.github\.com\/search\/issues/);
  assert.match(page, /comments:0/);
  assert.match(page, /no:assignee/);
  assert.match(layout, /Arunkumar Ganesan \| GitHub Home/);
  assert.doesNotMatch(layout, /\/og\.png/);
  assert.match(css, /--accent:/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);

  await assert.rejects(
    access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)),
  );
});
