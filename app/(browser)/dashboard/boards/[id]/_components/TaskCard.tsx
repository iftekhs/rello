'use client';

import { useState, useTransition } from 'react';
import { useBoardStore } from '@/store/useBoardStore';
import { usePendingOpsStore } from '@/store/usePendingOpsStore';
import { deleteTask as deleteTaskAction } from '../actions';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskEditDialog } from './TaskEditDialog';

interface TaskCardProps {
  taskId: string;
  listId: string;
}

export function TaskCard({ taskId, listId }: TaskCardProps) {
  const task = useBoardStore((s) =>
    s.lists.find((l) => l.id === listId)?.tasks.find((t) => t.id === taskId),
  );
  const deleteTask = useBoardStore((s) => s.deleteTask);
  const { registerOp, clearOp, confirmEcho, bumpVersion } = usePendingOpsStore();

  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!task) return null;

  const handleDelete = () => {
    const taskToDelete = { ...task };
    deleteTask(taskId, listId);

    bumpVersion(`task:${taskId}`);
    registerOp(`task:delete:${taskId}`);

    startTransition(async () => {
      try {
        await deleteTaskAction(taskId);
        clearOp(`task:delete:${taskId}`);
      } catch (error) {
        confirmEcho(`task:delete:${taskId}`);
        const list = useBoardStore
          .getState()
          .lists.find((l) => l.id === listId);
        if (list) {
          const existingTask = list.tasks.find((t) => t.id === taskId);
          if (!existingTask) {
            useBoardStore.getState().addTask(taskToDelete);
          }
        }
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete task',
        );
      }
    });
  };

  return (
    <>
      <Card
        className="group relative cursor-pointer p-2 hover:bg-muted/50"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className=" text-sm font-medium">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isPending}
          >
            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      <TaskEditDialog
        task={task}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
