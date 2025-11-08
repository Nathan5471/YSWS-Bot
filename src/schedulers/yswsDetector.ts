import parseRSSFeed from "../utils/parseRSSFeed";
import YSWS from "../models/ysws";

const yswsDetector = async () => {
  const rssFeedUrl = "https://ysws.hackclub.com/feed.xml";
  const newItems: any[] = [];
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
      const parsedContent = item.content
        .replace(/\n+/g, " ")
        .replace(/<p>/g, " ")
        .replace(/<\/p>/g, " ")
        .replace(/<strong>/g, " ")
        .replace(/<\/strong>/g, " ")
        .trim();
      const splitContent = parsedContent.split(/\s{3,}/g).map((s) => s.trim());
      const finalContent = splitContent.join("\n");

      const existingEntry = await YSWS.findOne({ guid: item.guid });
      if (!existingEntry) {
        const newYSWS = new YSWS({
          title: item.title,
          link: item.link,
          guid: item.guid,
          pubDate: new Date(item.pubDate),
          description: finalContent,
        });
        await newYSWS.save();
        console.log(`New YSWS entry saved: ${item.title}`);
        newItems.push(newYSWS);
      }
    }
    return newItems;
  } catch (error) {
    console.error(`YSWS Detector Error: ${error}`);
  }
};

export default yswsDetector;
