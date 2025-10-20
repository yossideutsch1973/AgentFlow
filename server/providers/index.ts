import { createGoogleProvider } from './google';
import { LLMProvider } from './types';

const providers = new Map<string, LLMProvider>();

export const registerDefaultProviders = () => {
  if (!providers.has('google')) {
    const provider = createGoogleProvider({
      apiKey: process.env.GENAI_API_KEY,
      defaultModel: process.env.GOOGLE_DEFAULT_MODEL,
    });
    providers.set('google', provider);
  }
};

export const setProvider = (provider: LLMProvider) => {
  providers.set(provider.name.toLowerCase(), provider);
};

export const getProvider = (name: string): LLMProvider => {
  const key = name.toLowerCase();
  const provider = providers.get(key);
  if (!provider) {
    throw new Error(`LLM provider '${name}' is not registered.`);
  }
  return provider;
};

export const listProviders = (): string[] => Array.from(providers.keys());

registerDefaultProviders();
