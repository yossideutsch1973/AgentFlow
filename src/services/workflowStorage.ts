
import { StoredWorkflow } from '../types';

const getStorageKey = (userId: string): string => `agentflow_workflows::${userId}`;

export const getWorkflows = (userId: string): Record<string, StoredWorkflow> => {
  if (!userId) return {};
  try {
    const data = localStorage.getItem(getStorageKey(userId));
    // Check for null or undefined, as getItem can return null.
    if (data) {
      const parsedData = JSON.parse(data);
      // Ensure we return a valid object, not null or other primitives from a corrupted storage value.
      if (typeof parsedData === 'object' && parsedData !== null) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Failed to parse workflows from localStorage", error);
    // If there's an error (e.g., corrupted data), it's safer to remove it to prevent future errors.
    localStorage.removeItem(getStorageKey(userId));
  }
  // Always return an object if data is missing, null, or corrupt.
  return {};
};

export const saveWorkflows = (userId: string, workflows: Record<string, StoredWorkflow>): void => {
  if (!userId) return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(workflows));
  } catch (error) {
    console.error("Failed to save workflows to localStorage", error);
  }
};
