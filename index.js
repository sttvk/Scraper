const { launchBrowser, sortHackerNewsArticles } = require("./scripts/scraper");

(async () => {
  const browser = await launchBrowser(false);
  try {
    const { timestamps, dateObjects, isSorted } = await sortHackerNewsArticles(
      browser
    );

    console.log(`Collected ${timestamps.length} timestamps`);
    console.log("--------------------------------------------------");
    if (isSorted) {
      console.log("SORTED FROM NEWEST to OLDEST.");
    } else {
      console.log("NOT SORTED FROM NEWEST to OLDEST.");
      for (let i = 0; i < dateObjects.length - 1; i++) {
        if (dateObjects[i] < dateObjects[i + 1]) {
          console.log(`Unsorted pair found:`);
          console.log(`  Article ${i + 1}: ${dateObjects[i].toLocaleString()}`);
          console.log(
            `  Article ${i + 2}: ${dateObjects[i + 1].toLocaleString()}`
          );
          break;
        }
      }
    }
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("An error occurred during the execution:", error.message);
  } finally {
    await browser.close();
  }
})();
