
import React, { useState, useEffect, useRef } from 'react';
import { StoredWorkflow, FlowNode, OpType, UserProfile } from './types';
import * as workflowStorage from './services/workflowStorage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorkflowEditor from './components/WorkflowEditor';

const initialNodes: FlowNode[] = [
    { id: 'image_to_describe', op: OpType.IMAGE, params: { value: null }, position: { x: 50, y: 150 } },
    { id: 'prompt', op: OpType.CONST, params: { value: '"Describe this image in detail for a blog post."' }, position: { x: 50, y: 350 } },
    { id: 'vision_llm', op: OpType.LLM, inputs: { prompt: 'prompt', image: 'image_to_describe' }, params: { model: 'gemini-2.5-flash-image', temperature: 0.5 }, position: { x: 400, y: 225 } },
    { id: 'description_output', op: OpType.OUTPUT, inputs: { from_node: 'vision_llm' }, position: { x: 750, y: 225 } },
];


const createNewWorkflow = (name = 'Untitled Flow'): StoredWorkflow => {
    return {
        id: `flow_${Date.now()}`,
        name,
        nodes: [],
    };
};

declare global {
  interface ModelQuota {
    metricName: string;
    maxQuota: number;
    remainingQuota: number;
  }
  
  interface AIStudio {
    auth?: {
      signIn: () => Promise<UserProfile>;
    };
    getHostUrl: () => Promise<string>;
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
    getModelQuota: (model: string) => Promise<ModelQuota>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// Mock the AI Studio API for development environments where it's not injected.
// This ensures the app can run without crashing by providing default implementations.
if (typeof window !== 'undefined') {
  // FIX: Add explicit type to allow accessing optional properties on a potentially empty object.
  const existingAIStudio: Partial<AIStudio> = window.aistudio || {};

  const mockAIStudio: AIStudio = {
      getHostUrl: async () => 'http://mock.studio.url',
      hasSelectedApiKey: async () => true,
      openSelectKey: async () => {},
      getModelQuota: async (model: string): Promise<ModelQuota> => ({
          metricName: 'mock-metric',
          maxQuota: 100,
          remainingQuota: 50,
      }),
      auth: {
        signIn: async (): Promise<UserProfile> => {
          console.log('Using mock sign-in.');
          const mockUser: UserProfile = {
            name: 'Dev User',
            email: 'dev.user@example.com',
            picture: `https://ui-avatars.com/api/?name=Dev+User&background=random&color=fff`,
            given_name: 'Dev',
          };
          await new Promise(resolve => setTimeout(resolve, 300));
          return mockUser;
        },
      },
  };

  // Merge mocks with existing implementations. Existing properties will override the mocks.
  window.aistudio = {
      ...mockAIStudio,
      ...existingAIStudio,
      // Deep merge the 'auth' object separately to avoid overwriting it entirely.
      auth: {
          ...mockAIStudio.auth,
          ...(existingAIStudio.auth || {}),
      },
  };
}


const App: React.FC = () => {
    const [workflows, setWorkflows] = useState<Record<string, StoredWorkflow>>({});
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [editorWorkflow, setEditorWorkflow] = useState<StoredWorkflow | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);

    const handleSignOut = () => {
        setUser(null);
        localStorage.removeItem('userProfile');
        setWorkflows({});
        setActiveWorkflowId(null);
        setEditorWorkflow(null);
        setIsDirty(false);
    };

    const handleSignIn = async () => {
        try {
            if (window.aistudio && window.aistudio.auth) {
                const userProfile = await window.aistudio.auth.signIn();
                setUser(userProfile);
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
            } else {
                console.error('AI Studio auth API not found.');
                alert('Authentication service is not available in this environment.');
            }
        } catch (error) {
            console.error("Sign in failed", error);
            alert('An error occurred during sign-in. Please try again.');
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('userProfile');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!user?.email) return; // Don't load workflows until user is logged in
        let loadedWorkflows = workflowStorage.getWorkflows(user.email);
        if (Object.keys(loadedWorkflows).length === 0) {
            const defaultWorkflow = createNewWorkflow('My First Flow');
            defaultWorkflow.nodes = initialNodes;
            loadedWorkflows = { [defaultWorkflow.id]: defaultWorkflow };
            workflowStorage.saveWorkflows(user.email, loadedWorkflows);
        }
        setWorkflows(loadedWorkflows);
        setActiveWorkflowId(Object.keys(loadedWorkflows)[0] || null);
    }, [user]);

    useEffect(() => {
        if (activeWorkflowId && workflows[activeWorkflowId]) {
            setEditorWorkflow(workflows[activeWorkflowId]);
            setIsDirty(false);
        } else {
            setEditorWorkflow(null);
        }
    }, [activeWorkflowId, workflows]);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    const handleCreateWorkflow = () => {
        if (!user?.email) return;
        const newWorkflow = createNewWorkflow();
        const updatedWorkflows = { ...workflows, [newWorkflow.id]: newWorkflow };
        setWorkflows(updatedWorkflows);
        workflowStorage.saveWorkflows(user.email, updatedWorkflows);
        setActiveWorkflowId(newWorkflow.id);
    };

    const handleSelectWorkflow = (id: string) => {
        if (isDirty) {
            if (!window.confirm('You have unsaved changes that will be lost. Are you sure you want to switch?')) {
                return;
            }
        }
        setActiveWorkflowId(id);
    };

    const handleUpdateWorkflow = (updatedWorkflow: StoredWorkflow) => {
        setEditorWorkflow(updatedWorkflow);
        setIsDirty(true);
    };

    const handleSaveWorkflow = () => {
        if (!editorWorkflow || !user?.email) return;
        const updatedWorkflows = { ...workflows, [editorWorkflow.id]: editorWorkflow };
        setWorkflows(updatedWorkflows);
        workflowStorage.saveWorkflows(user.email, updatedWorkflows);
        setIsDirty(false);
    };

    const handleDeleteWorkflow = (idToDelete: string) => {
        if (!idToDelete || !workflows[idToDelete] || !user?.email) return;

        if (!window.confirm(`Are you sure you want to delete the flow "${workflows[idToDelete].name}"? This cannot be undone.`)) {
            return;
        }
        
        const updatedWorkflows = { ...workflows };
        delete updatedWorkflows[idToDelete];
        
        setWorkflows(updatedWorkflows);
        workflowStorage.saveWorkflows(user.email, updatedWorkflows);
        
        if (activeWorkflowId === idToDelete) {
            const remainingIds = Object.keys(updatedWorkflows);
            if (remainingIds.length > 0) {
                setActiveWorkflowId(remainingIds[0]);
            } else {
                const newWorkflow = createNewWorkflow('My First Flow');
                const newWorkflows = { [newWorkflow.id]: newWorkflow };
                setWorkflows(newWorkflows);
                workflowStorage.saveWorkflows(user.email, newWorkflows);
                setActiveWorkflowId(newWorkflow.id);
            }
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center justify-center p-4">
                 <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">AgentFlow</h1>
                </div>
                <p className="text-gray-400 mb-8 text-center">Sign in to build and manage your AI workflows.</p>
                <button 
                    onClick={handleSignIn}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                >
                    <svg className="w-6 h-6" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>Sign in with Google</span>
                </button>
            </div>
        )
    }
    
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
        <Header user={user} onSignOut={handleSignOut} />
        <div className="flex-grow flex min-h-0">
            <Sidebar 
                workflows={workflows}
                activeWorkflowId={activeWorkflowId}
                onSelectWorkflow={handleSelectWorkflow}
                onCreateWorkflow={handleCreateWorkflow}
                isCollapsed={isSidebarCollapsed}
                onToggle={handleToggleSidebar}
            />
            <main className="flex-grow flex flex-col p-4 lg:p-6 xl:p-8">
                {editorWorkflow ? (
                    <WorkflowEditor 
                        key={editorWorkflow.id}
                        workflow={editorWorkflow}
                        onUpdate={handleUpdateWorkflow}
                        onSave={handleSaveWorkflow}
                        onDelete={handleDeleteWorkflow}
                        isDirty={isDirty}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-400">Loading Workflows...</h2>
                            <p className="text-gray-500 mt-2">Select a workflow from the sidebar or create a new one.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
      </div>
    );
};

export default App;
