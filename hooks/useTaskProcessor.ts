
import { useEffect, useRef, useState } from 'react';
import { TaskBatch, TaskItem } from '../types';
import { apiClient } from '../services/apiClient';

export const useTaskProcessor = (
    batches: TaskBatch[],
    setBatches: (batches: TaskBatch[]) => void,
    activeProject: any
) => {
    const processingRef = useRef(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    useEffect(() => {
        const processNextTask = async () => {
            if (processingRef.current) return;

            // Find the first pending task across all batches
            let targetBatchIndex = -1;
            let targetTaskIndex = -1;
            let targetTask: TaskItem | null = null;

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const taskIdx = batch.tasks.findIndex(t => t.genStatus === 'Pending');
                if (taskIdx !== -1) {
                    targetBatchIndex = i;
                    targetTaskIndex = taskIdx;
                    targetTask = batch.tasks[taskIdx];
                    break; // Process one at a time
                }
            }

            if (!targetTask || targetBatchIndex === -1) return;

            // Start processing
            processingRef.current = true;
            setCurrentTaskId(targetTask.id);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 120000); // 2 minutes timeout

            try {
                console.log(`[TaskProcessor] Starting task: ${targetTask.title} (${targetTask.id})`);

                // 1. Generate Content
                // Note: passing profile from activeProject if available
                const profile = activeProject?.companyProfile || {};

                // Extract keyword from task (assuming title might contain it, or we need to store it)
                // For now, we use title as the main topic/keyword if explicit keyword isn't saved
                const keyword = targetTask.title;

                const res = await apiClient.generateContent(
                    targetTask.title,
                    targetTask.branch,
                    keyword,
                    profile,
                    controller.signal
                );

                clearTimeout(timeoutId);

                // 2. Update Batch State
                const newBatches = [...batches];
                const batchToUpdate = { ...newBatches[targetBatchIndex] };
                const tasksToUpdate = [...batchToUpdate.tasks];

                if (res.success && res.data) {
                    tasksToUpdate[targetTaskIndex] = {
                        ...targetTask,
                        genStatus: 'Success',
                        content: (res.data as any).content,
                    };

                    // Persist Success
                    apiClient.updateTaskStatus(targetTask.id, {
                        genStatus: 'Success',
                        content: (res.data as any).content
                    }).catch(console.error);

                } else {
                    console.error(`[TaskProcessor] Task failed: ${res.error}`);
                    tasksToUpdate[targetTaskIndex] = {
                        ...targetTask,
                        genStatus: 'Failed',
                    };

                    // Persist Failure
                    apiClient.updateTaskStatus(targetTask.id, {
                        genStatus: 'Failed'
                    }).catch(console.error);
                }

                batchToUpdate.tasks = tasksToUpdate;
                newBatches[targetBatchIndex] = batchToUpdate;

                setBatches(newBatches);

            } catch (error) {
                console.error(`[TaskProcessor] Unexpected error:`, error);

                // Mark as failed to avoid infinite loop
                const newBatches = [...batches];
                const batchToUpdate = { ...newBatches[targetBatchIndex] };
                const tasksToUpdate = [...batchToUpdate.tasks];

                // Check if it was a timeout
                const isTimeout = error instanceof Error && error.name === 'AbortError';

                tasksToUpdate[targetTaskIndex] = {
                    ...targetTask,
                    genStatus: 'Failed',
                    // Optionally add error message to task if model supported it
                };

                if (isTimeout) {
                    console.error(`[TaskProcessor] Task timed out: ${targetTask.title}`);
                }

                batchToUpdate.tasks = tasksToUpdate;
                newBatches[targetBatchIndex] = batchToUpdate;
                setBatches(newBatches);
            } finally {
                clearTimeout(timeoutId);
                processingRef.current = false;
                setCurrentTaskId(null);
            }
        };

        const timer = setTimeout(() => {
            processNextTask();
        }, 1000); // Small delay to allow UI updates and prevent rapid-fire loops if state updates are slow

        return () => clearTimeout(timer);
    }, [batches, setBatches, activeProject]);

    return {
        isProcessing: processingRef.current,
        currentTaskId
    };
};
