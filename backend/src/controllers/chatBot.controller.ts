import locationData from "../data/campus_data.json" with {type: "json"}
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Request, Response } from "express"
import ENV from "../config/ENV.js";


const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

export const chatAI = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.json({
        success: false,
        message: "No query provided"
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `You are a campus navigation assistant helping users find locations on campus.

Campus locations:
${JSON.stringify(locationData, null, 2)}

User question: ${query}

IMPORTANT INSTRUCTIONS:
- Do NOT mention latitude/longitude coordinates in your message
- Use descriptive location directions like "near the cafeteria", "next to the library", "behind the admin building"
- Be conversational and helpful
- Give clear directions using building names and landmarks

Return JSON:
{
  "message": "your helpful response WITHOUT coordinates",
  "locations": [
    {
      "building_id": "id",
      "building_name": "name",
      "coordinates": {"lat": number, "lng": number},
      "service_name": "service name or null",
      "service_location": "location or null"
    }
  ],
  "action": "show_route" | "show_location" | "show_multiple_locations"
}

Rules:
- "take me to", "navigate to" → action: "show_route"
- "where is", "show me" → action: "show_location"
- Multiple locations → action: "show_multiple_locations"

Example good messages:
✅ "The ID Card Office is in the Student Services Building on the Ground Floor, Room 101."
✅ "The library is located near the main entrance, next to the cafeteria."
✅ "You can find the gym behind the Student Services Building."

Example bad messages:
❌ "The library is at coordinates 27.7175, 85.3245"
❌ "Location: lat 27.7172, lng 85.3240"

Respond ONLY with JSON.`;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());

    return res.json({
      success: true,
      data: response,

    })

  } catch (error) {
    console.error("error in AI: ", error);
    return res.json({
      success: false,
      message: error.message || "Internal server error"
    })
  }
}