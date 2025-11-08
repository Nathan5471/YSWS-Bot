import cron from "node-cron";
import parseRSSFeed from "../utils/parseRSSFeed";
import YSWS from "../models/ysws";

cron.schedule("* * * * *", async () => {
  // Runs every 30 minutes

  const rssFeedUrl = "https://ysws.hackclub.com/feed.xml";
  try {
    const items = await parseRSSFeed(rssFeedUrl);
    for (const item of items) {
      if (
        !item.title ||
        !item.link ||
        !item.guid ||
        !item.pubDate ||
        !item.content
      ) {
        console.warn(
          `Skipping item due to missing fields: ${JSON.stringify(item)}`
        );
        continue;
      }
      // content contains a combination of "\n" and "<p>" tags with +s.
      const parsedContent = item.content
        .replace(/\n+/g, " ")
        .replace(/<p>/g, " ")
        .replace(/<\/p>/g, " ")
        .replace(/<strong>/g, " ")
        .replace(/<\/strong>/g, " ")
        .trim();
      const splitContent = parsedContent.split("                       ");
      console.log("Split content:", splitContent);
      console.log("Parsed content:", parsedContent);
      continue;
    }
  } catch (error) {
    console.error(`YSWS Detector Error: ${error}`);
  }
});
