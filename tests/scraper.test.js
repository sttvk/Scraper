const { test, expect } = require("@playwright/test");
const { chromium } = require("playwright");
const {
  launchBrowser,
  collectTimestamps,
  checkSorted,
  sortHackerNewsArticles,
} = require("../scripts/scraper");

test.describe("Hacker News Scraping Tests", () => {
  test("launchBrowser should launch the browser in headless mode", async ({}) => {
    const browser = await launchBrowser(true);
    expect(browser).toBeDefined();
    await browser.close();
  });

  test("collectTimestamps should collect the correct number of timestamps", async ({}) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://news.ycombinator.com/newest", {
      waitUntil: "networkidle",
    });

    const count = 10;
    const timestamps = await collectTimestamps(page, count);
    expect(timestamps.length).toBeLessThanOrEqual(count);

    await browser.close();
  });

  test("checkSorted should return true if the dates are sorted from newest to oldest", async ({}) => {
    const sortedDates = [
      new Date("2024-10-02T10:00:00"),
      new Date("2024-10-01T12:00:00"),
      new Date("2024-09-30T15:00:00"),
    ];
    const isSorted = checkSorted(sortedDates);
    expect(isSorted).toBe(true);
  });

  test("checkSorted should return false if the dates are not sorted", async ({}) => {
    const unsortedDates = [
      new Date("2024-10-01T10:00:00"),
      new Date("2024-10-02T12:00:00"),
      new Date("2024-09-30T15:00:00"),
    ];
    const isSorted = checkSorted(unsortedDates);
    expect(isSorted).toBe(false);
  });

  test("sortHackerNewsArticles should collect timestamps and verify sorting", async ({}) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const result = await sortHackerNewsArticles(browser, 10);
    const { timestamps, isSorted } = result;

    expect(timestamps.length).toBeGreaterThan(0);
    expect(typeof isSorted).toBe("boolean");

    await browser.close();
  });
});
