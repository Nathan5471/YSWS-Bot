import parseRSSFeed from "../utils/parseRSSFeed";
import YSWS from "../models/ysws";

const yswsDetector = async () => {
  const rssFeedUrl = "https://ysws.hackclub.com/feed.xml";
  const oldYSWSs = await YSWS.find({});
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

      const existingEntry = await YSWS.findOne({ title: item.title });
      if (!existingEntry) {
        const newYSWS = new YSWS({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate),
          description: finalContent,
        });
        await newYSWS.save();
        console.log(`New YSWS entry saved: ${item.title}`);
        newItems.push(newYSWS);
      } else {
        oldYSWSs.filter((old) => old.title === item.title);
      }
    }
    for (const oldYSWS of oldYSWSs) {
      const stillExists = items.find((item) => item.title === oldYSWS.title);
      if (!stillExists) {
        await YSWS.deleteOne({ _id: oldYSWS._id });
        console.log(`Deleted old YSWS entry: ${oldYSWS.title}`);
      }
    }
    return newItems;
  } catch (error) {
    console.error(`YSWS Detector Error: ${error}`);
  }
};

export default yswsDetector;
