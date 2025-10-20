const parseProviders = (): string[] => {
  const raw = import.meta.env.VITE_LLM_PROVIDERS;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return ['google'];
  }
  const values = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return values.length > 0 ? values : ['google'];
};

export const LLM_PROVIDERS = parseProviders();
