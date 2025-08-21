import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

// Initialize Gemini AI client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface IssueDetectionResult {
  issueType: "pothole" | "graffiti" | "streetlight" | "trash_overflow" | "sidewalk_damage" | "traffic_sign" | "water_leak" | "other";
  confidence: number; // 0-100
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  estimatedSize?: string;
  estimatedCost?: number;
  estimatedDuration?: number; // days
  recommendations?: string[];
  location?: {
    type: string;
    context: string;
  };
}

export class AIService {
  async analyzeIssueImage(base64Image: string, location?: string): Promise<IssueDetectionResult> {
    try {
      const prompt = `You are an expert civic infrastructure analyst. Analyze this image to detect and classify civic issues like potholes, graffiti, broken streetlights, trash overflow, sidewalk damage, traffic signs, water leaks, etc.

Please provide a detailed analysis in JSON format with the following structure:
{
  "issueType": "one of: pothole, graffiti, streetlight, trash_overflow, sidewalk_damage, traffic_sign, water_leak, other",
  "confidence": "number between 0-100 indicating detection confidence",
  "priority": "one of: low, medium, high, urgent",
  "description": "detailed description of the issue including size, severity, and safety impact",
  "estimatedSize": "description of size/area affected",
  "estimatedCost": "estimated repair cost in USD (number)",
  "estimatedDuration": "estimated repair time in days (number)",
  "recommendations": ["array of specific repair recommendations"],
  "location": {
    "type": "description of location type (residential street, highway, sidewalk, etc.)",
    "context": "description of surrounding area and accessibility"
  }
}

Consider safety impact, repair urgency, and potential for causing additional damage when determining priority.
${location ? `Location context: ${location}` : ''}`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      };

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [prompt, imagePart],
      });

      const text = result.text || "";

      // Parse the JSON response
      const analysisResult = JSON.parse(text);
      
      // Validate and sanitize the response
      return {
        issueType: this.validateIssueType(analysisResult.issueType),
        confidence: Math.max(0, Math.min(100, Number(analysisResult.confidence) || 0)),
        priority: this.validatePriority(analysisResult.priority),
        description: analysisResult.description || "Issue detected in image",
        estimatedSize: analysisResult.estimatedSize,
        estimatedCost: Number(analysisResult.estimatedCost) || undefined,
        estimatedDuration: Number(analysisResult.estimatedDuration) || undefined,
        recommendations: Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : [],
        location: analysisResult.location || undefined,
      };

    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error("Failed to analyze image: " + (error as Error).message);
    }
  }

  async generateIssueTitle(issueType: string, description: string, location?: string): Promise<string> {
    try {
      const prompt = `Generate a concise, descriptive title for a civic issue report. Keep it under 80 characters and include the issue type and key details.

Issue type: ${issueType}
Description: ${description}${location ? `\nLocation: ${location}` : ''}

Generate a clear, professional title for this civic issue report.`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });
      
      return result.text?.trim() || `${issueType} issue reported`;
    } catch (error) {
      console.error("Title generation error:", error);
      return `${issueType} issue reported`;
    }
  }

  async classifyDepartment(issueType: string, description: string): Promise<string> {
    const departmentMapping: Record<string, string> = {
      "pothole": "public_works",
      "sidewalk_damage": "public_works",
      "water_leak": "public_works",
      "graffiti": "sanitation",
      "trash_overflow": "sanitation",
      "streetlight": "electrical",
      "traffic_sign": "transportation",
      "other": "general"
    };

    return departmentMapping[issueType] || "general";
  }

  private validateIssueType(type: string): IssueDetectionResult["issueType"] {
    const validTypes = ["pothole", "graffiti", "streetlight", "trash_overflow", "sidewalk_damage", "traffic_sign", "water_leak", "other"];
    return validTypes.includes(type) ? type as IssueDetectionResult["issueType"] : "other";
  }

  private validatePriority(priority: string): IssueDetectionResult["priority"] {
    const validPriorities = ["low", "medium", "high", "urgent"];
    return validPriorities.includes(priority) ? priority as IssueDetectionResult["priority"] : "medium";
  }

  async moderateContent(content: string): Promise<{
    isAppropriate: boolean;
    confidence: number;
    categories: string[];
    suggestion?: string;
  }> {
    try {
      const prompt = `You are a content moderation system for a civic platform. Analyze text for inappropriate content including harassment, spam, profanity, hate speech, or off-topic content.

Analyze this content for appropriateness in a civic discussion platform:

"${content}"

Provide response in this JSON format:
{
  "isAppropriate": boolean,
  "confidence": number (0-100),
  "categories": ["array of any issues found: harassment, spam, profanity, hate_speech, off_topic"],
  "suggestion": "optional suggestion for improvement if inappropriate"
}`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const analysisResult = JSON.parse(result.text || "{}");
      
      return {
        isAppropriate: analysisResult.isAppropriate !== false, // Default to true if not specified
        confidence: Math.max(0, Math.min(100, Number(analysisResult.confidence) || 95)),
        categories: Array.isArray(analysisResult.categories) ? analysisResult.categories : [],
        suggestion: analysisResult.suggestion,
      };

    } catch (error) {
      console.error("Content moderation error:", error);
      // Default to allowing content if moderation fails
      return {
        isAppropriate: true,
        confidence: 0,
        categories: [],
      };
    }
  }
}

export const aiService = new AIService();