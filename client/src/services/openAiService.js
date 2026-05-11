// src/services/openAiService.js
import axios from "axios";

// Using Llama 3.1 8b on Groq - it's incredibly fast and free
const MODEL = process.env.REACT_APP_GROQ_MODEL || "llama-3.1-8b-instant";

export const analyzeSymptoms = async (description, selectedSymptoms) => {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key missing. Check .env file.");
  }

  // Combine selected + free-text
  const userInput = `${selectedSymptoms.join(", ")}${
    selectedSymptoms.length && description ? ". " : ""
  }${description}`.trim();

  if (!userInput) throw new Error("Please enter or select symptoms.");

  // -----------------------------------------------------------------
  // PROMPT – **NO HARDCODED ADVICE**
  // -----------------------------------------------------------------
  const prompt = `
You are a Kenyan medical AI assistant.  
**Only give advice that directly relates to the reported symptoms.**  
Never add generic tips.

Symptoms: ${userInput}

Return **only valid JSON** (no markdown, no extra text):

{
  "assessment": "1-2 sentence plain-English summary",
  "possibleConditions": [
    {
      "name": "Condition name",
      "urgency": "High|Medium|Low",
      "probability": "High|Medium|Low",
      "detail": "Short, clear explanation"
    }
  ],
  "homeCare": [
    "Rest in a cool place",
    "Drink plenty of water or ORS"
  ],
  "lightMedication": [
    "Paracetamol 500mg every 6hrs (max 4/day)"
  ],
  "emergencySigns": [
    "Fever >40°C → seizures",
    "Difficulty breathing",
    "Severe neck swelling"
  ],
  "urgentAdvice": "Go to hospital NOW if any emergency sign appears. Call 0800 721 316.",
  "kenyaTips": [
    "Get malaria RDT at nearest clinic",
    "Dial *155# to choose NHIF facility"
  ],
  "sources": [
    { "title": "Kenya Ministry of Health", "uri": "https://www.health.go.ke" }
  ]
}

**Rules**:
- **Never** output a tip unless the symptom justifies it.
- For fever → allow ORS, paracetamol, malaria RDT.
- For pain → allow paracetamol/ibuprofen.
- For cough → allow steam, cough syrup.
- For breathing issues → allow emergency signs.
- Predict future risks in emergencySigns.
- Keep arrays **empty** if nothing applies.
`.trim();

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a strict, context-only medical AI for Kenya. Output ONLY clean JSON. Filter every array to relevant items only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1000,
        // Groq supports JSON mode specifically
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

    const raw = res.data.choices[0].message.content.trim();

    // Groq is very good at JSON, but we'll keep your safety check
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON.");

    const json = JSON.parse(jsonMatch[0]);

    // ---- CLEAN & VALIDATE ----
    const clean = {
      assessment: json.assessment || "Symptoms noted. Monitor closely.",
      possibleConditions: Array.isArray(json.possibleConditions)
        ? json.possibleConditions.filter((c) => c.name && c.detail)
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
        ? json.sources.filter((s) => s.title && s.uri)
        : [],
    };

    if (clean.possibleConditions.length === 0) {
      clean.possibleConditions = [
        {
          name: "General Symptoms",
          urgency: "Low",
          probability: "Medium",
          detail: "Common and often resolve on their own.",
        },
      ];
    }

    return clean;
  } catch (err) {
    // Adjusted error handling for Groq's response structure
    if (err.response?.status === 401) throw new Error("Invalid Groq API key.");
    if (err.response?.status === 429)
      throw new Error("Too many requests to Groq. Please wait a moment.");
    if (err.code === "ECONNABORTED")
      throw new Error("Request timed out. Check internet.");
    throw new Error(err.message || "AI service error.");
  }
};
