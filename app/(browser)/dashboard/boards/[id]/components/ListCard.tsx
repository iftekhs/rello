'use client';

import { useState, useTransition } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { updateListTitle, deleteList } from '../actions';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Edit01Icon,
  Delete02Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ListCardProps {
  listId: string;
}

export function ListCard({ listId }: ListCardProps) {
  const list = useBoardStore((s) => s.lists.find((l) => l.id === listId));
  const updateList = useBoardStore((s) => s.updateList);
  const deleteListFromStore = useBoardStore((s) => s.deleteList);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list?.title ?? '');
  const [isPending, startTransition] = useTransition();

  if (!list) return null;

  const handleStartEdit = () => {
    setEditTitle(list.title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editTitle.trim() || editTitle === list.title) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      try {
        await updateListTitle(listId, editTitle.trim());
        updateList({ ...list, title: editTitle.trim() });
        toast.success('List updated');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to update list',
        );
      }
      setIsEditing(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteList(listId);
        deleteListFromStore(listId);
        toast.success('List deleted');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete list',
        );
      }
    });
  };

  return (
    <Card className="w-72 max-h-full shrink-0 overflow-hidden px-1 py-2 gap-0">
      <div className="flex items-center justify-between px-2">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1"
          />
        ) : (
          <h3
            onClick={handleStartEdit}
            className="flex-1 cursor-pointer truncate font-semibold"
          >
            {list.title}
          </h3>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleStartEdit}
            disabled={isPending}
          >
            <HugeiconsIcon icon={Edit01Icon} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      </div>
      <div>
        <Button
          variant="ghost"
          className="flex h-auto w-full shrink-0 justify-start gap-2 p-2"
        >
          <HugeiconsIcon icon={Add01Icon} />
          <span>Add a task</span>
        </Button>
      </div>
    </Card>
  );
}
