// Configuration file for AI service integration
// Update these values with your actual AI service credentials

const AI_CONFIG = {
    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
        model: 'gpt-3.5-turbo',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        maxTokens: 1000,
        temperature: 0.3
    },

    // Anthropic Claude Configuration
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY',
        model: 'claude-3-haiku-20240307',
        endpoint: 'https://api.anthropic.com/v1/messages',
        maxTokens: 1000
    },

    // Google Gemini Configuration (Free Plan)
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
        model: 'gemini-1.5-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    },

    // Custom AI Service Configuration
    custom: {
        endpoint: process.env.CUSTOM_AI_ENDPOINT || 'YOUR_CUSTOM_AI_ENDPOINT',
        apiKey: process.env.CUSTOM_API_KEY || 'YOUR_CUSTOM_API_KEY',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.CUSTOM_AUTH_HEADER || 'Bearer YOUR_CUSTOM_API_KEY'
        }
    },

    // Current service to use (options: 'openai', 'anthropic', 'gemini', 'custom', 'mock')
    currentService: 'gemini'
};

// AI Service Prompts
const AI_PROMPTS = {
    meetingSummary: `
You are an AI assistant specialized in creating professional meeting summaries. 
Given a transcript of a meeting, generate a structured summary including:

1. Meeting Overview (duration, participants)
2. Key Discussion Points (main topics discussed)
3. Action Items (specific tasks assigned or agreed upon)
4. Next Steps (follow-up actions and future meetings)

Format the output as a JSON object with the following structure:
{
    "meetingDuration": "estimated duration",
    "participants": ["list of participants"],
    "keyPoints": ["point 1", "point 2", ...],
    "actionItems": ["action 1", "action 2", ...],
    "nextSteps": ["step 1", "step 2", ...]
}

Be concise but comprehensive. Focus on actionable insights and decisions made.
`,

    extractKeyPoints: `
Extract the main discussion points from this meeting transcript. 
Focus on decisions made, important topics, and significant information shared.
Return as a list of key points.
`,

    extractActionItems: `
Identify specific action items, tasks, or commitments from this meeting transcript.
Look for phrases like "will do", "need to", "should", "responsible for", etc.
Return as a list of action items.
`,

    extractNextSteps: `
Determine the next steps and follow-up actions from this meeting transcript.
Include scheduled follow-ups, deadlines, and future meeting plans.
Return as a list of next steps.
`
};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AI_CONFIG, AI_PROMPTS };
} else {
    window.AI_CONFIG = AI_CONFIG;
    window.AI_PROMPTS = AI_PROMPTS;
}
