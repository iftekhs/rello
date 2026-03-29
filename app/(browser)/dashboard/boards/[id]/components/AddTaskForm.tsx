'use client';

import { useState, useTransition } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { createTask } from '../actions';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddTaskFormProps {
  listId: string;
  boardId: string;
}

export function AddTaskForm({ listId, boardId }: AddTaskFormProps) {
  const tasks = useBoardStore(
    (s) => s.lists.find((l) => l.id === listId)?.tasks ?? [],
  );
  const addTask = useBoardStore((s) => s.addTask);
  const deleteTask = useBoardStore((s) => s.deleteTask);

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) return;

    const position = tasks.length;
    const tempId = crypto.randomUUID();
    const optimisticTask = {
      id: tempId,
      title: title.trim(),
      description: description.trim() || null,
      list_id: listId,
      board_id: boardId,
      position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addTask(optimisticTask);
    setTitle('');
    setDescription('');
    setIsExpanded(false);

    startTransition(async () => {
      try {
        const newTask = await createTask(
          listId,
          boardId,
          title.trim(),
          description.trim() || null,
          position,
        );
        deleteTask(tempId, listId);
        addTask(newTask);
      } catch (error) {
        deleteTask(tempId, listId);
        toast.error(
          error instanceof Error ? error.message : 'Failed to create task',
        );
      }
    });
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(true)}
        className="flex h-auto w-full shrink-0 justify-start gap-2 p-2"
      >
        <HugeiconsIcon icon={Add01Icon} />
        <span>Add a task</span>
      </Button>
    );
  }

  return (
    <div className="p-2 flex flex-col gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title..."
        autoFocus
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description (optional)"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title.trim()}
          size="sm"
        >
          {isPending ? 'Adding...' : 'Add task'}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>
    </div>
  );
}
