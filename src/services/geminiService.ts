import { GoogleGenAI, Type } from "@google/genai";
import { LoveLanguages, DateIdea } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateDailyDateIdea = async (
  userLoveLanguages: LoveLanguages,
  partnerLoveLanguages: LoveLanguages,
  hobbies: string[]
): Promise<DateIdea> => {
  const prompt = `Generate ONE highly unique, random, and creative long-distance date idea for a couple. 
  
  SEED FOR VARIETY: ${hobbies.join(', ')} (Shuffle this context to spark new ideas).
  
  CONTEXT: This is for a "Scratch-off" surprise feature. The idea should be exciting to uncover and different from everything else.
  
  VARIETY INSTRUCTIONS: 
  - ABSOLUTELY NO REPEATS. 
  - Pick a random niche category that hasn't been used (e.g., Virtual Planetarium Session, Remote Karaoke Battle, Interactive Mystery Box, Shared Soundtrack composing, DIY Synchronized Spa Night).
  - Focus on 'synchronicity' — doing the same specific thing at the exact same time.
  - Avoid generic "watch a movie" or "eat dinner".

  CRITICAL CONSTRAINT: The date MUST be 100% doable while living apart in different cities or countries. 
  DO NOT suggest activities that require physical presence (e.g., "go to a local park together", "dinner at a restaurant").
  DO suggest:
  - Synchronized activities (watching a movie at the same time, cooking the same recipe while on video call).
  - Online shared experiences (multiplayer games, virtual tours, collaborative playlists).
  - "Mail-ahead" surprises (ordering delivery for each other, sending a care package to be opened on call).
  - Creative digital interactions (shared digital whiteboards, online escape rooms).

  Return the response in JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert in long-distance relationship coaching. Your specialty is designing creative, meaningful dates that bridge the physical gap between partners using technology and synchronized activities. You never suggest in-person activities.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          loveLanguage: { type: Type.STRING, enum: ["wordsOfAffirmation", "actsOfService", "receivingGifts", "qualityTime"] },
          longDistanceFriendly: { type: Type.BOOLEAN }
        },
        required: ["title", "description", "category", "loveLanguage", "longDistanceFriendly"]
      }
    }
  });

  const idea = JSON.parse(response.text);
  return {
    ...idea,
    id: Math.random().toString(36).substring(2, 9)
  };
};

export const generateDateIdeasByCategory = async (
  category: string,
  loveLanguage: string
): Promise<DateIdea[]> => {
  const prompt = `Generate 5 creative long-distance date ideas for the category "${category}" and love language "${loveLanguage}".
  
  CRITICAL CONSTRAINT: The dates MUST be 100% doable while living apart. 
  NO in-person activities allowed. Focus on virtual, synchronized, or mail-based interactions.
  
  Return the response in JSON format as an array of objects.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert in long-distance relationship coaching. You design creative, meaningful dates that bridge the physical gap between partners. You never suggest in-person activities.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            loveLanguage: { type: Type.STRING },
            longDistanceFriendly: { type: Type.BOOLEAN }
          },
          required: ["title", "description", "category", "loveLanguage", "longDistanceFriendly"]
        }
      }
    }
  });

  const ideas = JSON.parse(response.text);
  return ideas.map((idea: any) => ({
    ...idea,
    id: Math.random().toString(36).substring(2, 9)
  }));
};
