import { GoogleGenAI } from "@google/genai";
import Parser from "rss-parser";

const parser = new Parser();

export async function fetchSignals() {
  try {
    const nitterUrl = process.env.NITTER_URL || "https://nitter.privacydev.net";
    const feedUrl = `${nitterUrl}/karpathy/rss`;
    
    console.log(`Fetching RSS feed from: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    
    const posts = feed.items.slice(0, 5);
    let ai = null;
    
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    
    const results = await Promise.all(posts.map(async (post) => {
      const id = post.guid || post.link || Math.random().toString(36).substring(7);
      let summary = "Summary unavailable. Please set GEMINI_API_KEY.";
      
      if (ai) {
        const prompt = `Here is a recent post from Andrej Karpathy: "${post.contentSnippet}". Please summarize this post and explicitly tell me what newly discussed ideas, concepts, or projects he is talking about. Keep your response concise (1 to 3 sentences) and focused on the core technical ideas. If it's a casual reply, state that briefly without over-analyzing.`;
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          summary = response.text || summary;
        } catch(error) {
          console.error("Gemini API Error for post:", id, error);
          summary = "Error generating summary with Gemini.";
        }
      }
      
      return {
        id,
        title: post.title,
        link: post.link,
        date_time: post.isoDate || post.pubDate,
        original_text: post.contentSnippet,
        summary
      };
    }));

    return results;
  } catch (error) {
    console.error("Error fetching or processing Nitter feed:", error);
    throw error;
  }
}
