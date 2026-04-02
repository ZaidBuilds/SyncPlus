/**
 * Calls the selected AI provider directly from the browser using the user's API key.
 * Supports: OpenAI, Google Gemini, Groq (open-source models)
 */

const SYSTEM_PROMPT = `You are an expert goal-setting coach and learning path designer.
The user will give you a goal. You must break it down into:
1. A structured learning path (phases/milestones)
2. Projects to build (linked to the learning path)
3. Concrete tasks for each project

Return ONLY valid JSON matching this exact schema:
{
  "goal_title": "string",
  "goal_description": "string (2-3 sentences about this goal)",
  "learning_path": [
    { "phase": 1, "title": "string", "duration": "string (e.g. 2 weeks)", "description": "string" }
  ],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "phase": 1,
      "tasks": [
        { "title": "string", "priority": "high|medium|low", "estimated_time": 60 }
      ]
    }
  ],
  "daily_habits": [
    { "name": "string", "description": "string" }
  ]
}`;

export async function callAiProvider({ goal, provider, apiKey, model }) {
  const userMessage = `My goal: ${goal}\n\nBreak this down into a detailed learning path, projects, and tasks.`;

  if (provider === 'openai') {
    return await callOpenAI({ apiKey, model: model || 'gpt-4o-mini', userMessage });
  } else if (provider === 'gemini') {
    return await callGemini({ apiKey, model: model || 'gemini-1.5-flash', userMessage });
  } else if (provider === 'groq') {
    return await callGroq({ apiKey, model: model || 'llama3-8b-8192', userMessage });
  }
  throw new Error('Unknown provider');
}

async function callOpenAI({ apiKey, model, userMessage }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini({ apiKey, model, userMessage }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + userMessage }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
}

async function callGroq({ apiKey, model, userMessage }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}