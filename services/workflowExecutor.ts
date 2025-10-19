
import { GoogleGenAI } from "@google/genai";
import { FlowNode, NodeId, OpType } from '../types';

// Simple template renderer for '{{ item }}'
const renderTemplate = (template: string, context: { item: any }): string => {
    // Basic replacement for this specific use case. A more robust solution would use a proper templating library.
    return template.replace(/\{\{\s*item\s*\}\}/g, String(context.item));
};

export class WorkflowExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WorkflowExecutionError';
    }
}

export const executeWorkflow = async (
    nodes: FlowNode[],
    inputValues: Record<NodeId, any>
): Promise<Record<string, any>> => {
    const API_KEY = process.env.API_KEY;

    let ai: GoogleGenAI | null = null;
    if (nodes.some(n => n.op === OpType.LLM || n.op === OpType.SEARCH)) {
        if (!API_KEY) {
            throw new WorkflowExecutionError("API_KEY is not configured. This app requires an API key to run LLM or Search nodes. Please follow the setup instructions.");
        }
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }

    const context = new Map<NodeId, any>();
    for (const [id, value] of Object.entries(inputValues)) {
        const node = nodes.find(n => n.id === id);
        if (node?.params?.type === 'number') {
            context.set(id, Number(value));
        } else {
            context.set(id, value);
        }
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const unresolvedNodeIds = new Set<NodeId>(nodes.filter(n => n.op !== OpType.INPUT).map(n => n.id));
    
    let progressMadeInLastPass = true;
    while (unresolvedNodeIds.size > 0 && progressMadeInLastPass) {
        progressMadeInLastPass = false;

        for (const nodeId of Array.from(unresolvedNodeIds)) {
            const node = nodeMap.get(nodeId)!;
            const dependencyIds = Object.values(node.inputs || {}).filter(Boolean) as NodeId[];
            const allDependenciesResolved = dependencyIds.every(depId => context.has(depId));

            if (allDependenciesResolved) {
                let result: any;
                const nodeInputs = Object.fromEntries(
                    Object.entries(node.inputs || {}).map(([key, val]) => [key, context.get(val!)])
                );

                switch (node.op) {
                    case OpType.CONST:
                        try {
                            result = JSON.parse(node.params?.value || 'null');
                        } catch {
                            result = node.params?.value;
                        }
                        break;
                    
                    case OpType.IMAGE:
                         result = node.params?.value;
                         break;

                    case OpType.MAP:
                        const inputArray = nodeInputs.each;
                        if (!Array.isArray(inputArray)) {
                            throw new WorkflowExecutionError(`Input for map node '${node.id}' must be an array, but received type ${typeof inputArray}.`);
                        }
                        result = inputArray.map(item => renderTemplate(node.params?.fn || '', { item }));
                        break;
                    
                    case OpType.HTTP:
                        let urls = nodeInputs.url;
                        if (typeof urls === 'string') urls = [urls];
                        
                        if (!Array.isArray(urls)) {
                            throw new WorkflowExecutionError(`Input 'url' for HTTP node '${node.id}' must be a string or an array of strings.`);
                        }
                        // WARNING: Browser's fetch is subject to CORS policy. This will only work with CORS-enabled endpoints.
                        const requests = urls.map(async (url: string) => {
                            try {
                                const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
                                if (!response.ok) {
                                    throw new WorkflowExecutionError(`HTTP request to ${url} failed with status ${response.status}.`);
                                }
                                return response.text();
                            } catch (e: any) {
                                throw new WorkflowExecutionError(`Network error fetching ${url}: ${e.message}. A CORS proxy is used for this demo, which may be unreliable.`);
                            }
                        });
                        const results = await Promise.all(requests);
                        result = results.length === 1 ? results[0] : results;
                        break;
                    
                    case OpType.SEARCH:
                        if (!ai) throw new WorkflowExecutionError("GoogleGenAI client not initialized for SEARCH node.");
                        
                        let query = nodeInputs.query;
                        if (Array.isArray(query)) {
                            query = query.join('\n'); // Join with newline for better context
                        }

                        if (typeof query !== 'string' || query.trim() === '') {
                            throw new WorkflowExecutionError(`Input 'query' for SEARCH node '${node.id}' must be a non-empty string or an array of strings.`);
                        }
                        
                        try {
                            const searchResponse = await ai.models.generateContent({
                                model: "gemini-2.5-flash",
                                contents: query,
                                config: {
                                    tools: [{googleSearch: {}}],
                                },
                            });

                            result = searchResponse.text;
                        } catch (e: any) {
                             throw new WorkflowExecutionError(`Google Search node '${node.id}' failed: ${e.message}`);
                        }
                        break;

                    case OpType.LLM:
                        if (!ai) throw new WorkflowExecutionError("GoogleGenAI client not initialized.");
                        
                        const prompt = nodeInputs.prompt;
                        const system = nodeInputs.system;
                        const image = nodeInputs.image;
                        const isJsonOutput = node.params?.out === 'json';

                        const model = image ? 'gemini-2.5-flash-image' : (node.params?.model || 'gemini-2.5-flash');

                        let contents: any;

                        if (image && typeof image === 'string' && image.startsWith('data:image')) {
                            const [meta, data] = image.split(',');
                            const mimeType = meta.match(/:(.*?);/)?.[1];
                            if (!mimeType || !data) {
                                throw new WorkflowExecutionError(`Invalid image data format for LLM node '${node.id}'. Expected a data URL.`);
                            }
                            const imagePart = { inlineData: { mimeType, data } };
                            let textPrompt = Array.isArray(prompt) ? prompt.join('\n\n') : prompt;
                            const textPart = { text: textPrompt || '' };
                            contents = { parts: [textPart, imagePart] };
                        } else {
                            contents = Array.isArray(prompt) ? prompt.join('\n\n') : prompt;
                        }
                        
                        const response = await ai.models.generateContent({
                            model,
                            contents,
                            config: {
                                systemInstruction: system,
                                temperature: node.params?.temperature,
                                responseMimeType: isJsonOutput ? 'application/json' : undefined,
                            }
                        });

                        result = response.text;
                        if (isJsonOutput) {
                            try {
                                result = JSON.parse(result);
                            } catch (e) {
                                throw new WorkflowExecutionError(`LLM node '${node.id}' was configured for JSON output, but failed to parse the response: ${result}`);
                            }
                        }
                        break;
                }
                context.set(node.id, result);
                unresolvedNodeIds.delete(node.id);
                progressMadeInLastPass = true;
            }
        }
    }
    
    if (unresolvedNodeIds.size > 0) {
        throw new WorkflowExecutionError(`Execution failed. Could not resolve all nodes. Unresolved nodes: ${[...unresolvedNodeIds].join(', ')}. This may be due to a cycle or missing dependency.`);
    }

    // Return all intermediate and final values from the context
    return Object.fromEntries(context);
};
