import Parser from "rss-parser";

const rssParser = new Parser();

async function parseRSSFeed(url: string) {
  try {
    const feed = await rssParser.parseURL(url);
    const items = feed.items;
    return items;
  } catch (error) {
    console.error(`Error parsing ${url}: ${error}`);
    throw new Error(`Failed to parse RSS feed from ${url}`);
  }
}

export default parseRSSFeed;
