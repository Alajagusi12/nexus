 const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
  
type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

// Call Gemini with a prompt and return the text response.
export async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Gemini API error:", res.status, errorText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data: GeminiResponse = await res.json();

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text.trim();
}

// Summarize a conversation between users.
export async function summarizeConversation(
  messages: Array<{ userName: string; content: string; createdAt: string }>
): Promise<string> {
  if (messages.length === 0) {
    return "No messages to summarize.";
  }

  // Limit to last 100 messages to avoid token limits
  const limited = messages.slice(-100);

  const transcript = limited
    .map(
      (m) =>
        `[${new Date(m.createdAt).toLocaleString()}] ${m.userName}: ${m.content}`
    )
    .join("\n");

  const prompt = `You are an assistant that summarizes team conversations.

Here is a conversation transcript:

${transcript}

Please provide a concise summary with these sections:

**Key Points**
- 2-4 bullet points covering the main topics discussed

**Decisions Made**
- Any decisions the team made (if none, say "None")

**Open Questions**
- Any unresolved questions or topics needing follow-up (if none, say "None")

Keep it short and professional. Do not include filler.`;

  return askGemini(prompt);
}

// Extract action items (potential tasks) from a conversation.
export async function extractActionItems(
  messages: Array<{ userName: string; content: string; createdAt: string }>
): Promise<Array<{ title: string; description: string }>> {
  if (messages.length === 0) {
    return [];
  }

  const limited = messages.slice(-100);

  const transcript = limited
    .map((m) => `${m.userName}: ${m.content}`)
    .join("\n");

  const prompt = `You are an assistant that extracts action items from team conversations.

Here is a conversation:

${transcript}

Extract only concrete action items that someone needs to do. Ignore casual chat, greetings, and completed actions.

Return ONLY a valid JSON array of objects. Each object has "title" and "description" fields.

Format:
[
  {"title": "Short task title (max 80 chars)", "description": "One sentence explaining the task"}
]

If there are no action items, return an empty array: []

Do NOT include any text outside the JSON array. Do NOT wrap it in markdown code fences. Return raw JSON only.`;

  const raw = await askGemini(prompt);

  // Try to parse JSON
  try {
    // Strip any accidental markdown code fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.title === "string" &&
          item.title.trim().length > 0
      )
      .map((item) => ({
        title: String(item.title).slice(0, 200),
        description: String(item.description || "").slice(0, 500),
      }))
      .slice(0, 10); // Max 10 items
  } catch (err) {
    console.error("Failed to parse action items JSON:", err, "\nRaw:", raw);
    return [];
  }
}