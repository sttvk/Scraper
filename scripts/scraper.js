const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

// Function to launch the browser
async function launchBrowser(headless = true) {
  return await chromium.launch({ headless });
}

// Function to log network activity to a .txt file
async function logToFile(logMessage) {
  const logFilePath = path.join(__dirname, "..", "network_logs.txt");

  // Append the log message to the file
  try {
    await fs.appendFile(logFilePath, logMessage + "\n");
  } catch (err) {
    console.error("Error writing to log file:", err);
  }
}

// Function to monitor and log network activity
async function monitorNetworkActivity(page) {
  page.on("request", async (request) => {
    const logMessage = `Request: ${request.method()} ${request.url()}`;
    await logToFile(logMessage);
  });

  page.on("response", async (response) => {
    const logMessage = `Response: ${response.status()} ${response.url()}`;
    await logToFile(logMessage);
  });

  page.on("requestfailed", async (request) => {
    const logMessage = `Request Failed: ${request.url()} - ${
      request.failure().errorText
    }`;
    await logToFile(logMessage);
  });
}

// Function to collect timestamps for a specific page number range
async function collectTimestamps(page, count) {
  let timestamps = [];
  let pageNum = 1;
  let lastTimestamp = "";

  // Create the screenshots directory one level above the current directory
  const screenshotsDir = path.join(__dirname, "..", "screenshots");
  await fs.mkdir(screenshotsDir, { recursive: true });

  while (timestamps.length < count) {
    console.log(`Processing page ${pageNum}...`);

    // Wait for the page to load and for the first timestamp element to appear
    await page.waitForSelector(".age", { timeout: 10000 });

    // Capture a screenshot for the current page
    const screenshotPath = path.join(screenshotsDir, `page-${pageNum}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved for page ${pageNum}: ${screenshotPath}`);

    // Collect timestamps from the articles on the current page
    const newTimestamps = await page.$$eval(".age", (elements) =>
      elements.map((el) => el.getAttribute("title"))
    );

    // Check if there are no new timestamps or duplicate content
    if (newTimestamps.length === 0 || newTimestamps[0] === lastTimestamp) {
      console.log(
        `No new timestamps or duplicate content found on page ${pageNum}. Stopping.`
      );
      break;
    }

    // Track the first timestamp to detect duplicate pages
    lastTimestamp = newTimestamps[0];
    timestamps = timestamps.concat(newTimestamps);
    pageNum++;

    // Check if we have enough timestamps
    if (timestamps.length >= count) break;

    // Simulate clicking the "More" button to go to the next page
    const moreButton = await page.$("a.morelink");
    if (moreButton) {
      await moreButton.click();
      await page.waitForTimeout(500);
    } else {
      console.log('No "More" button found. Stopping pagination.');
      break;
    }

    // Small delay to avoid overloading the server
    await page.waitForTimeout(500);
  }

  return timestamps.slice(0, count);
}

// Function to check if dates are sorted (from newest to oldest)
function checkSorted(dateObjects) {
  for (let i = 0; i < dateObjects.length - 1; i++) {
    if (dateObjects[i] < dateObjects[i + 1]) {
      return false;
    }
  }
  return true;
}

// Function to scrape Hacker News articles and check if they are sorted
async function sortHackerNewsArticles(browserInstance, count = 100) {
  const context = await browserInstance.newContext();
  const page = await context.newPage();

  try {
    // Monitor network activity
    await monitorNetworkActivity(page);

    // Navigate to the Hacker News "newest" page
    await page.goto("https://news.ycombinator.com/newest", {
      waitUntil: "networkidle",
    });

    // Collect timestamps and check if sorted
    const timestamps = await collectTimestamps(page, count);
    const dateObjects = timestamps.map((timestamp) => new Date(timestamp));
    const isSorted = checkSorted(dateObjects);

    return { timestamps, dateObjects, isSorted };
  } finally {
    await context.close();
  }
}

// Export functions
module.exports = {
  launchBrowser,
  collectTimestamps,
  checkSorted,
  sortHackerNewsArticles,
};
