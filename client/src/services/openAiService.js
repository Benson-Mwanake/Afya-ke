import axios from "axios";

const MODEL = process.env.REACT_APP_OPENAI_MODEL || "gpt-4o-mini";

export const analyzeSymptoms = async (description, selectedSymptoms) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key missing. Check .env file.");
  }

  const safeSymptoms = Array.isArray(selectedSymptoms) ? selectedSymptoms : [];

  const userInput = `${safeSymptoms.join(", ")}${
    safeSymptoms.length && description ? ". " : ""
  }${description || ""}`.trim();

  if (!userInput) throw new Error("Please enter or select symptoms.");

  const prompt = `
You are a Kenyan medical AI assistant.

Symptoms: ${userInput}

Return ONLY valid JSON:
{
  "assessment": "",
  "possibleConditions": [],
  "homeCare": [],
  "lightMedication": [],
  "emergencySigns": [],
  "urgentAdvice": "",
  "kenyaTips": [],
  "sources": []
}
`.trim();

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Return ONLY valid JSON. No markdown. No explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,

        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const data = res.data?.choices?.[0]?.message?.content;

    if (!data) throw new Error("No response from AI.");

    let json;
    try {
      json = JSON.parse(data);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }

    const clean = {
      assessment: json.assessment || "Symptoms noted. Monitor closely.",
      possibleConditions: Array.isArray(json.possibleConditions)
        ? json.possibleConditions.filter((c) => c?.name && c?.detail)
        : [],
      homeCare: Array.isArray(json.homeCare)
        ? json.homeCare.filter(Boolean)
        : [],
      lightMedication: Array.isArray(json.lightMedication)
        ? json.lightMedication.filter(Boolean)
        : [],
      emergencySigns: Array.isArray(json.emergencySigns)
        ? json.emergencySigns.filter(Boolean)
        : [],
      urgentAdvice:
        json.urgentAdvice ||
        "Consult a doctor if symptoms worsen. Call 0800 721 316.",
      kenyaTips: Array.isArray(json.kenyaTips)
        ? json.kenyaTips.filter(Boolean)
        : [],
      sources: Array.isArray(json.sources)
        ? json.sources.filter((s) => s?.title && s?.uri)
        : [],
    };

    if (clean.possibleConditions.length === 0) {
      clean.possibleConditions = [
        {
          name: "General Symptoms",
          urgency: "Low",
          probability: "Medium",
          detail: "Common and often self-limiting.",
        },
      ];
    }

    return clean;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Invalid OpenAI API key.");
    }

    if (err.code === "ECONNABORTED") {
      throw new Error("Request timed out.");
    }

    throw new Error(err.message || "AI service error.");
  }
};
