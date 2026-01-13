
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Role: You are the Elite Technical Recruiter & Data Parser. 
Your goal is to transform messy resumes into standardized profiles and RANK them against a Job Description.

Objective: 
1. Extract key information.
2. Calculate a "Match Score" (0-100) based strictly on the provided Job Description.
3. Ignore fluff. Focus on objective achievements and metrics.

Output Schema: Your response must be in JSON format to allow for programmatic ranking.

Schema Requirements:
- name: Candidate Name
- currentRole: Industry standard title
- score: Integer 0-100
- profileMarkdown: A full structured Markdown profile including exactly this snapshot header:
  # Candidate Profile
  - **Name**: [Name]
  - **Total years of experience**: [Total Years]
  - **Current role**: [Standardized Role]
  - **Key skills**: [Skill 1, Skill 2, ...]
  - **Education**: [Degrees/Institutions]
  - **Industry/domain**: [e.g. Fintech, Healthcare]
  - **5-line professional summary**: [Brief summary]
  - **JD match highlights**: [Summary of why they fit the specific JD provided]

  Followed by:
  ## Top 3 Strengths
  ## Hard Skills Matrix
  ## Standardized Experience (Metrics-focused)
  ## Education & Certs
  ## JD Alignment (Gaps vs Matches)

Operational Guidelines:
- No Hallucinations.
- Standardize Job Titles.
- Prioritize metrics (%, $, numerical growth).`;

export const processCandidate = async (resumeText: string, jd: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
[Job Description]:
${jd}

[Resume]:
${resumeText}

Analyze this candidate against the JD. Return the JSON response with the profileMarkdown containing the specific formatted snapshot.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          currentRole: { type: Type.STRING },
          score: { type: Type.INTEGER },
          profileMarkdown: { type: Type.STRING }
        },
        required: ["name", "currentRole", "score", "profileMarkdown"]
      }
    },
  });

  return JSON.parse(response.text || '{}');
};
