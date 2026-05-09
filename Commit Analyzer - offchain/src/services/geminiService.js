const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAnalysisPrompt } = require('../prompts/analysisPrompt');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is missing in .env file');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Analyze contribution using Gemini
 */
const analyzeContribution = async (data) => {
  try {
    // Using gemini-1.5-flash for speed and cost efficiency, 
    // but gemini-1.5-pro can be used for deeper analysis.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = getAnalysisPrompt(data);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean response text in case AI included markdown code blocks
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`AI Analysis Failed: ${error.message}`);
  }
};

module.exports = { analyzeContribution };
