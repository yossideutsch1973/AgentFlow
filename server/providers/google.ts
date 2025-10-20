import { GoogleGenAI } from '@google/genai';
import { LLMInvokeOptions, LLMProvider, SearchInvokeOptions } from './types';

interface GoogleProviderConfig {
  apiKey?: string;
  defaultModel?: string;
}

export const createGoogleProvider = (config: GoogleProviderConfig): LLMProvider => {
  const { apiKey, defaultModel = 'gemini-2.5-flash' } = config;

  let cachedClient: GoogleGenAI | null = null;
  const getClient = () => {
    if (!apiKey) {
      throw new Error('GENAI_API_KEY is not configured on the server.');
    }
    if (!cachedClient) {
      cachedClient = new GoogleGenAI({ apiKey });
    }
    return cachedClient;
  };

  const parseImage = (image?: string | null) => {
    if (!image) return null;
    const [metadata, data] = image.split(',');
    const mimeType = metadata?.match(/data:(.*?);/)?.[1];
    if (!mimeType || !data) {
      throw new Error('Image payload must be a base64 data URL.');
    }
    return { mimeType, data };
  };

  const invokeLLM = async ({ model, prompt, system, image, temperature, expectJson }: LLMInvokeOptions) => {
    const client = getClient();
    const resolvedModel = model || defaultModel;
    const imageData = parseImage(image);

    const payload: any = {
      model: resolvedModel,
      config: {
        temperature,
        responseMimeType: expectJson ? 'application/json' : undefined,
        systemInstruction: system ?? undefined,
      },
    };

    if (imageData) {
      payload.contents = {
        parts: [
          { text: prompt ?? '' },
          { inlineData: imageData },
        ],
      };
    } else {
      payload.contents = prompt ?? '';
    }

    const response = await client.models.generateContent(payload);
    let result = response.text;
    if (expectJson) {
      try {
        result = JSON.parse(result);
      } catch {
        throw new Error('Model returned invalid JSON.');
      }
    }
    return result;
  };

  const invokeSearch = async ({ query }: SearchInvokeOptions) => {
    const client = getClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  };

  return {
    name: 'google',
    supportsSearch: true,
    invokeLLM,
    invokeSearch,
  };
};
