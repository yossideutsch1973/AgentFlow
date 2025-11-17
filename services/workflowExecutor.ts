
import { FlowNode, NodeId, OpType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const DEFAULT_PROVIDER = import.meta.env.VITE_DEFAULT_LLM_PROVIDER ?? 'google';

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

export interface OperationAdapters {
    llm: (payload: {
        provider: string;
        model: string;
        prompt: string | null;
        system?: string | null;
        image?: string | null;
        temperature?: number;
        expectJson: boolean;
    }) => Promise<any>;
    search: (payload: { provider: string; query: string }) => Promise<any>;
    http: (payload: { urls: string[]; method: string }) => Promise<any>;
}

const ensureArrayOfStrings = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map(String);
    }
    if (value === undefined || value === null) {
        return [];
    }
    return [String(value)];
};

const buildApiUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!API_BASE_URL) return normalizedPath;
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${base}${normalizedPath}`;
};

const resolveProvider = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    return DEFAULT_PROVIDER;
};

const createDefaultAdapters = (): OperationAdapters => {
    const post = async <TResponse>(path: string, body: unknown): Promise<TResponse> => {
        const response = await fetch(buildApiUrl(path), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            let detail = await response.text();
            try {
                const parsed = JSON.parse(detail);
                if (parsed?.error) {
                    detail = parsed.error;
                }
            } catch {
                // ignore JSON parse failure
            }
            throw new WorkflowExecutionError(detail || `Request failed with status ${response.status}`);
        }
        try {
            return await response.json();
        } catch {
            throw new WorkflowExecutionError('Response payload was not valid JSON');
        }
    };

    return {
        llm: async ({ provider, model, prompt, system, image, temperature, expectJson }) => {
            const result = await post<{ result: any }>('/llm', {
                provider,
                model,
                prompt,
                system,
                image,
                temperature,
                expectJson,
            });
            return result.result;
        },
        search: async ({ provider, query }) => {
            const result = await post<{ result: any }>('/search', { provider, query });
            return result.result;
        },
        http: async ({ urls, method }) => {
            const result = await post<{ result: any }>('/http', { urls, method });
            return result.result;
        },
    };
};

const defaultAdapters = createDefaultAdapters();

export const createOperationAdapters = createDefaultAdapters;

export const executeWorkflow = async (
    nodes: FlowNode[],
    inputValues: Record<NodeId, any>,
    adapters: OperationAdapters = defaultAdapters
): Promise<Record<string, any>> => {
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
    
    await _execute(unresolvedNodeIds, nodeMap, context, adapters);

    if (unresolvedNodeIds.size > 0) {
        throw new WorkflowExecutionError(`Execution failed. Could not resolve all nodes. Unresolved nodes: ${[...unresolvedNodeIds].join(', ')}. This may be due to a cycle or missing dependency.`);
    }

    // Return all intermediate and final values from the context
    return Object.fromEntries(context);
};

async function _execute(
    unresolvedNodeIds: Set<NodeId>,
    nodeMap: Map<NodeId, FlowNode>,
    context: Map<NodeId, any>,
    adapters: OperationAdapters
) {
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
                    
                    case OpType.ITERATION_VAR:
                        const loopId = node.params?.loopId;
                        if (!loopId) {
                            throw new WorkflowExecutionError(`ITERATION_VAR node '${node.id}' requires a 'loopId' parameter.`);
                        }
                        result = context.get(`${loopId}.iteration`);
                        break;

                    case OpType.LOOP:
                        const loopCount = Number(nodeInputs.count);
                        if (isNaN(loopCount) || loopCount < 0) {
                            throw new WorkflowExecutionError(`Input 'count' for LOOP node '${node.id}' must be a non-negative number.`);
                        }

                        const bodyNodeId = node.inputs?.body;
                        if (!bodyNodeId) {
                            throw new WorkflowExecutionError(`LOOP node '${node.id}' requires a 'body' input.`);
                        }

                        const bodyNode = nodeMap.get(bodyNodeId);
                        if (!bodyNode) {
                            throw new WorkflowExecutionError(`Could not find body node '${bodyNodeId}' for LOOP node '${node.id}'.`);
                        }

                        const loopResults = [];
                        for (let i = 0; i < loopCount; i++) {
                            const loopContext = new Map<NodeId, any>(context);
                            loopContext.set(`${node.id}.iteration`, i);

                            const bodyResult = await executeSubgraph(bodyNode, nodeMap, loopContext, adapters);
                            loopResults.push(bodyResult);
                        }
                        result = loopResults;
                        break;

                    case OpType.HTTP: {
                        const urls = ensureArrayOfStrings(nodeInputs.url);
                        if (!urls.length) {
                            throw new WorkflowExecutionError(`HTTP node '${node.id}' requires at least one URL input.`);
                        }
                        const method = node.params?.method || 'GET';
                        try {
                            result = await adapters.http({ urls, method });
                        } catch (e: any) {
                            throw new WorkflowExecutionError(e.message || `HTTP node '${node.id}' failed.`);
                        }
                        break;
                    }

                    case OpType.SEARCH: {
                        let query = nodeInputs.query;
                        if (Array.isArray(query)) {
                            query = query.join('\n'); // Join with newline for better context
                        }

                        if (typeof query !== 'string' || query.trim() === '') {
                            throw new WorkflowExecutionError(`Input 'query' for SEARCH node '${node.id}' must be a non-empty string or an array of strings.`);
                        }
                        const provider = resolveProvider(node.params?.provider);
                        try {
                            result = await adapters.search({ provider, query });
                        } catch (e: any) {
                            throw new WorkflowExecutionError(`Search node '${node.id}' failed: ${e.message || 'Unknown error.'}`);
                        }
                        break;
                    }
                    case OpType.LLM: {
                        const prompt = nodeInputs.prompt;
                        const system = nodeInputs.system;
                        const image = nodeInputs.image;
                        const isJsonOutput = node.params?.out === 'json';

                        const provider = resolveProvider(node.params?.provider);
                        const fallbackModel = provider === 'google'
                            ? (image ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash')
                            : (node.params?.model || 'default');
                        const model = node.params?.model || fallbackModel;

                        const promptText = Array.isArray(prompt) ? prompt.join('\n\n') : (prompt ?? '');
                        const systemText = Array.isArray(system) ? system.join('\n\n') : (system ?? null);
                        let imageData: string | null = null;
                        if (typeof image === 'string' && image.startsWith('data:image')) {
                            imageData = image;
                        } else if (image != null) {
                            throw new WorkflowExecutionError(`LLM node '${node.id}' received an unsupported image payload. Provide a base64 data URL.`);
                        }

                        try {
                            result = await adapters.llm({
                                provider,
                                model,
                                prompt: promptText,
                                system: systemText,
                                image: imageData,
                                temperature: node.params?.temperature,
                                expectJson: isJsonOutput,
                            });
                        } catch (e: any) {
                            throw new WorkflowExecutionError(`LLM node '${node.id}' failed: ${e.message || 'Unknown error.'}`);
                        }
                        break;
                    }
                }
                context.set(node.id, result);
                unresolvedNodeIds.delete(node.id);
                progressMadeInLastPass = true;
            }
        }
    }
}

async function executeSubgraph(
    startNode: FlowNode,
    nodeMap: Map<NodeId, FlowNode>,
    initialContext: Map<NodeId, any>,
    adapters: OperationAdapters
): Promise<any> {
    const context = new Map<NodeId, any>(initialContext);
    const nodesToExecute: FlowNode[] = [];
    const queue: FlowNode[] = [startNode];
    const visited = new Set<NodeId>();

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        if (visited.has(currentNode.id)) continue;
        visited.add(currentNode.id);
        nodesToExecute.push(currentNode);

        const dependencyIds = Object.values(currentNode.inputs || {}).filter(Boolean) as NodeId[];
        for (const depId of dependencyIds) {
            const depNode = nodeMap.get(depId);
            if (depNode) {
                queue.push(depNode);
            }
        }
    }

    const unresolvedNodeIds = new Set<NodeId>(nodesToExecute.map(n => n.id));

    await _execute(unresolvedNodeIds, nodeMap, context, adapters);

    if (unresolvedNodeIds.size > 0) {
        throw new WorkflowExecutionError(`Subgraph execution failed. Unresolved nodes: ${[...unresolvedNodeIds].join(', ')}.`);
    }

    return context.get(startNode.id);
}
