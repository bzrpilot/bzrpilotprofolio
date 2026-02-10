const SYSTEM_PROMPTS = {
    cinephile: "You are Cinephile.ai, a cinema-focused AI. You answer questions about movies, series, anime, storytelling, characters, themes, watch recommendations, and film analysis. You must not respond to unrelated domains.",
    traveller: "You are Traveller.ai, a travel and experience-focused AI. You assist with places, routes, festivals, cultures, itineraries, travel stories, and exploration advice. Reject non-travel topics.",
    cybersec: "You are Cybersec.ai, a defensive cybersecurity intelligence assistant. You explain security concepts, tools, learning paths, vulnerabilities, and best practices. You MUST refuse illegal hacking requests, exploits, or malicious activities and redirect the user to ethical cybersecurity topics and defensive research.",
    explorer: "You are Explorer.ai, a curiosity-driven AI. You encourage learning, philosophy, ideas, experiments, science, and discovery across domains. You respond thoughtfully, inquisitively, and help users connect different fields of knowledge."
};

// Transient in-memory storage for rate limiting and sessions
// Note: This is reset on serverless cold starts.
const rateLimit = new Map();
const sessions = new Map();

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();

    // 🛡️ Simple Rate Limiting (5 requests per 10 seconds per IP)
    const ipData = rateLimit.get(clientIp) || { count: 0, lastReset: now };
    if (now - ipData.lastReset > 10000) {
        ipData.count = 0;
        ipData.lastReset = now;
    }
    if (ipData.count >= 5) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }
    ipData.count++;
    rateLimit.set(clientIp, ipData);

    try {
        const { domain, message, sessionId } = req.body;

        // 🛡️ Payload Validation
        if (!domain || !message || !sessionId) {
            return res.status(400).json({ error: 'Missing required fields: domain, message, or sessionId' });
        }

        if (!SYSTEM_PROMPTS[domain]) {
            return res.status(400).json({ error: 'Invalid domain specified' });
        }

        // 🧠 AI Memory management
        let history = sessions.get(sessionId) || [{ role: 'system', content: SYSTEM_PROMPTS[domain] }];

        // Add user message
        history.push({ role: 'user', content: message.substring(0, 1000) }); // Limit message length

        // Keep history manageable (last 10 messages)
        if (history.length > 11) {
            history = [history[0], ...history.slice(-10)];
        }

        // ⚙️ Groq API Request
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: history,
                temperature: 0.7,
                max_tokens: 800,
                top_p: 1,
                stream: false
            })
        });

        if (!response.ok) {
            console.error('Groq API Error:', await response.text());
            throw new Error('Upstream API failure');
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        // Update history
        history.push({ role: 'assistant', content: aiMessage });
        sessions.set(sessionId, history);

        // Mask internal details, return only the message
        return res.status(200).json({ response: aiMessage });

    } catch (error) {
        console.error('Backend Error:', error);
        // 🛡️ Error Masking
        return res.status(500).json({ error: 'AI core encountered an internal sync error. Please retry.' });
    }
}
