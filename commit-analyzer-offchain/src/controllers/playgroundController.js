const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.estimate = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Invalid messages array' });
    }

    // MVP estimation logic based on character count
    const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0);
    const estimatedTokens = Math.ceil(totalChars / 4); // rough estimate: 1 token = 4 chars
    
    // MVP pricing: 1 ECOIN per 50 tokens, minimum 2 ECOIN
    const ecoinCost = Math.max(2, Math.ceil(estimatedTokens / 50));

    return res.json({
      success: true,
      estimatedTokens,
      ecoinCost
    });
  } catch (error) {
    console.error('Estimate error:', error);
    return res.status(500).json({ success: false, error: 'Failed to estimate token usage' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { messages, walletAddress, model } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Invalid messages array' });
    }

    // Initialize Gemini model
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert messages to Gemini format
    // Assuming messages is [{role: "user", content: "..."}, {role: "assistant", content: "..."}]
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const chat = geminiModel.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage([{ text: lastMessage }]);
    const responseText = result.response.text();

    return res.json({
      success: true,
      reply: responseText
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate AI response' });
  }
};
