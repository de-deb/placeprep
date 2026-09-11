/* eslint-disable no-console */
// Integration check: real login → workspace → Monaco loads → run code.
// Run: node --experimental-strip-types scripts/judge-check.ts  (or via tsx)
import puppeteer from "puppeteer-core";

const BASE = process.env.APP_URL ?? "http://localhost:5173";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1600,1000"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 200)}`);
  });

  // Login (SPA: wait for route change, not a full navigation)
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  // Form is prefilled + React-controlled: set via native setters + input events.
  await page.evaluate(() => {
    const set = (sel: string, v: string) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set('input[type="email"]', "student@placeprep.local");
    set('input[type="password"]', "Student@123");
  });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 30000 });
  console.log("login ok:", page.url());

  // Workspace (Two Sum)
  const probId = process.env.PROBLEM_ID;
  if (!probId) throw new Error("PROBLEM_ID required");
  await page.goto(`${BASE}/coding/${probId}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(
    () => document.body.textContent?.includes("Two Sum") || document.body.textContent?.includes("not found"),
    { timeout: 30000 }
  );
  // Monaco present?
  await page.waitForSelector(".monaco-editor", { timeout: 60000 });
  console.log("monaco editor rendered");

  // Type solution via Monaco API
  await page.evaluate(() => {
    const ed = (window as unknown as { monaco?: { editor: { getModels: () => { setValue: (s: string) => void }[] } } }).monaco;
    const models = ed?.editor.getModels() ?? [];
    if (models[0]) {
      models[0].setValue(
        "import sys\nd=list(map(int,sys.stdin.read().split()))\nn=d[0];a=d[1:1+n];t=d[1+n]\nseen={}\nfor i,x in enumerate(a):\n if t-x in seen:\n  print(seen[t-x],i)\n  break\n seen[x]=i"
      );
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  // Click Run
  const runBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns.find((b) => b.textContent?.includes("Run")) ?? null;
  });
  if (!runBtn) throw new Error("Run button not found");
  // @ts-expect-error puppeteer handle
  await runBtn.click();
  await page.waitForFunction(() => document.body.textContent?.includes("Sample tests:"), { timeout: 90000 });
  console.log("run completed");

  // Click Submit
  const subBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns.find((b) => b.textContent?.includes("Submit")) ?? null;
  });
  // @ts-expect-error puppeteer handle
  await subBtn.click();
  await page.waitForFunction(() => document.body.textContent?.includes("Accepted") || document.body.textContent?.includes("Wrong Answer"), { timeout: 120000 });
  const verdict = await page.evaluate(() => document.body.textContent?.includes("Accepted 🎉") ? "ACCEPTED" : "NOT-ACCEPTED");
  console.log("submit verdict:", verdict);

  await page.screenshot({ path: "/tmp/shots/workspace-live.png" });
  console.log("errors:", errors.length ? errors.slice(0, 8) : "none");
  await browser.close();
  if (verdict !== "ACCEPTED") process.exit(2);
}

main().catch((e) => {
  console.error("CHECK FAILED:", e.message);
  process.exit(1);
});
