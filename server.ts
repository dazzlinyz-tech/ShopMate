import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API endpoint for Gemini-powered feedback (with Section 7 guardrails)
app.post('/api/feedback', async (req, res) => {
  const {
    targetSentence,
    koreanMeaning,
    spokenText,
    attemptNumber,
    isSuccess,
    hasSmallWordMissing,
    missingSmallWord,
    missingKeyWord,
    firstLetterHint,
    firstChunk,
    nextChunk,
    isSilent,
  } = req.body;

  // Check if Gemini API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ useFallback: true });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are Lucy, a friendly, patient, and cheerful store assistant in a shopping speaking practice app for Korean middle school students (Grades 1-2, CEFR A1-A2).
Your rules:
1. Praise the student's effort first.
2. Give only ONE correction at a time in simple English followed by natural Korean in parentheses.
3. Keep it brief (1-2 sentences), warm, and encouraging. Never be harsh or academic.
4. Follow the pedagogical stage strictly:
- If isSilent: "That's okay! Tap the mic and try again. (괜찮아요! 마이크를 누르고 다시 시도해 보세요.)"
- If isSuccess: "Great job! I understood you clearly. (잘했어요! 무슨 말인지 잘 이해했어요.)"
- If hasSmallWordMissing: "Nice job! Add '${missingSmallWord || 'please'}' to complete your sentence. (잘했어요! 문장을 완성하려면 '${missingSmallWord || 'please'}'를 넣어 보세요.)"
- If attempt 1 failure (recast): "Nice try! You can say, '${targetSentence}'. (잘 시도했어요! 이렇게 말해 볼까요?)"
- If attempt 2 failure (elicitation): "You're getting there! '${missingKeyWord}' starts with '${firstLetterHint}'. (거의 다 왔어요! 빠진 핵심 단어는 '${firstLetterHint}'로 시작해요.)"
- If attempt 3 failure (chunking): "Good effort! Let's say it in small parts: '${firstChunk}' / '${nextChunk}'. (잘했어요! 짧은 부분으로 나누어 말해 보세요.)"

Respond with ONLY valid JSON with keys:
{
  "english": "English feedback text",
  "korean": "한국어 피드백 텍스트"
}`;

    const prompt = `Context:
- Target Sentence: "${targetSentence}" (${koreanMeaning})
- Student said: "${spokenText || '(Nothing)'}"
- Attempt: ${attemptNumber}
- Is Success: ${isSuccess}
- Small word missing: ${hasSmallWordMissing ? missingSmallWord : 'none'}
- Missing key word: ${missingKeyWord || 'none'}
- First letter: ${firstLetterHint || 'none'}
- Chunk 1: "${firstChunk}"
- Chunk 2: "${nextChunk}"
- Silent: ${isSilent}

Generate Lucy's bilingual feedback matching the rule above.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(200).json({ useFallback: true });
    }

    const parsed = JSON.parse(text);
    return res.status(200).json({
      success: true,
      english: parsed.english,
      korean: parsed.korean,
    });
  } catch (err) {
    console.warn('Gemini feedback fallback triggered:', (err as Error).message);
    return res.status(200).json({ useFallback: true });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShopMate server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
