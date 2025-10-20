export interface LLMInvokeOptions {
  model: string;
  prompt: string | null;
  system?: string | null;
  image?: string | null;
  temperature?: number;
  expectJson?: boolean;
}

export interface SearchInvokeOptions {
  query: string;
}

export interface LLMProvider {
  name: string;
  supportsSearch: boolean;
  invokeLLM(options: LLMInvokeOptions): Promise<any>;
  invokeSearch?(options: SearchInvokeOptions): Promise<any>;
}
