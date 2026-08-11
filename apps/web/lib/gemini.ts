import { GoogleGenAI, Type } from "@google/genai";

export function getGeminiClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export interface GeneratedTilDoc {
  title: string;
  fileName: string;
  body: string;
}

const DOC_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "문서 제목 (한국어, 한 줄)" },
    fileName: {
      type: Type.STRING,
      description: "영문 kebab-case 슬러그. 확장자(.md) 없이, 공백/특수문자 없이.",
    },
    body: {
      type: Type.STRING,
      description: "마크다운 형식의 학습 노트 본문. 개념 설명, 예시, 참고 포인트를 포함.",
    },
  },
  required: ["title", "fileName", "body"],
};

const SYSTEM_INSTRUCTION =
  "너는 개발자의 TIL(Today I Learned) 메모를 정리해주는 도우미다. " +
  "사용자가 짧게 적은 메모를 바탕으로, 그 개념을 다시 봤을 때 이해할 수 있도록 " +
  "배경 설명, 핵심 개념, 간단한 예시, 참고하면 좋을 포인트를 포함한 마크다운 학습 노트로 확장해라. " +
  "원래 메모에 없는 사실을 지어내지 말고, 일반적으로 알려진 개념 설명 위주로 작성해라.";

/** 짧은 TIL 메모를 AI로 확장해 제목/파일명/마크다운 본문을 생성. */
export async function generateTilDoc(note: string): Promise<GeneratedTilDoc> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: note,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: DOC_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI 응답을 받지 못했습니다.");
  }

  return JSON.parse(text) as GeneratedTilDoc;
}
