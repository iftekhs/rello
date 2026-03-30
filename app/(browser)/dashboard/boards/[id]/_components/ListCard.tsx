'use client';

import { useState, useTransition } from 'react';
import { useBoardStore } from '@/store/useBoardStore';
import { usePendingOpsStore } from '@/store/usePendingOpsStore';
import { updateListTitle, deleteList } from '../actions';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Edit01Icon, Delete02Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskList } from './TaskList';

interface ListCardProps {
  listId: string;
  isActive?: boolean;
  readOnly?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function ListCard({ listId, isActive, readOnly, dragHandleProps }: ListCardProps) {
  const list = useBoardStore((s) => s.lists.find((l) => l.id === listId));
  const boardId = useBoardStore((s) => s.board?.id);
  const updateList = useBoardStore((s) => s.updateList);
  const deleteListFromStore = useBoardStore((s) => s.deleteList);
  const { registerOp, clearOp, confirmEcho, bumpVersion, setLocalUpdatedAt, registerEchoSequence } = usePendingOpsStore();

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

    const previousTitle = list.title;
    const newTitle = editTitle.trim();

    updateList({ ...list, title: newTitle });
    setIsEditing(false);

    const seq = bumpVersion(`list:${listId}`)
    setLocalUpdatedAt(`list:${listId}`, Date.now())
    registerOp(`list:update:${listId}`);

    startTransition(async () => {
      try {
        await updateListTitle(listId, newTitle);
        registerEchoSequence(`list:${listId}`, seq)
        clearOp(`list:update:${listId}`);
      } catch (error) {
        confirmEcho(`list:update:${listId}`);
        updateList({ ...list, title: previousTitle });
        toast.error(
          error instanceof Error ? error.message : 'Failed to update list',
        );
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleDelete = () => {
    const previousList = { ...list };
    deleteListFromStore(listId);

    const seq = bumpVersion(`list:${listId}`)
    setLocalUpdatedAt(`list:${listId}`, Date.now())
    registerOp(`list:delete:${listId}`);

    startTransition(async () => {
      try {
        await deleteList(listId);
        registerEchoSequence(`list:${listId}`, seq)
        clearOp(`list:delete:${listId}`);
      } catch (error) {
        confirmEcho(`list:delete:${listId}`);
        updateList(previousList);
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete list',
        );
      }
    });
  };

  return (
    <Card
      className={`w-72 max-h-full shrink-0 overflow-hidden px-1 py-2 gap-0 ${isActive ? 'ring-2 ring-warm-red' : ''}`}
    >
      <div className="flex items-center justify-between px-4">
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
            onClick={readOnly ? undefined : handleStartEdit}
            className={`flex-1 truncate font-semibold ${!readOnly ? 'cursor-pointer' : ''}`}
          >
            {list.title}
          </h3>
        )}
        <div className="flex items-center gap-1">
          {dragHandleProps && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-grab active:cursor-grabbing"
              disabled={isPending}
              {...dragHandleProps}
            >
              <HugeiconsIcon icon={Menu01Icon} />
            </Button>
          )}
          {!readOnly && (
            <>
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
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {boardId && <TaskList listId={listId} boardId={boardId} readOnly={readOnly} />}
      </div>
    </Card>
  );
}
