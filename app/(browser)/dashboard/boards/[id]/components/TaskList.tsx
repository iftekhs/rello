'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoardStore } from '../store/useBoardStore';
import { SortableTaskCard } from './SortableTaskCard';
import { AddTaskForm } from './AddTaskForm';
import { useDrag } from './DragContext';
import { Card } from '@/components/ui/card';

interface TaskListProps {
  listId: string;
  boardId: string;
}

export function TaskList({ listId, boardId }: TaskListProps) {
  const list = useBoardStore((s) => s.lists.find((l) => l.id === listId));
  const tasks = useMemo(() => list?.tasks ?? [], [list]);

  const { activeItem, hoveredListId, dropIndex } = useDrag();

  const isDraggingTask = activeItem?.type === 'task';
  const isHoveredList = hoveredListId === listId;
  const showPlaceholder =
    isDraggingTask && isHoveredList && activeItem?.listId !== listId;

  const sortedTasks = tasks.slice().sort((a, b) => a.position - b.position);

  const { setNodeRef, isOver } = useDroppable({
    id: listId,
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 my-2 ${isOver ? 'bg-primary/5 rounded' : ''}`}
      >
        <SortableContext
          items={sortedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task, index) => {
            const isBeingDragged =
              activeItem?.type === 'task' && activeItem.id === task.id;
            const shouldShowPlaceholderBefore =
              showPlaceholder && dropIndex === index;

            return (
              <div key={task.id}>
                {shouldShowPlaceholderBefore && (
                  <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/20 h-16 mb-2" />
                )}
                <SortableTaskCard
                  taskId={task.id}
                  listId={listId}
                  isBeingDragged={isBeingDragged}
                />
              </div>
            );
          })}
          {showPlaceholder &&
            (dropIndex === null || dropIndex >= sortedTasks.length) && (
              <Card className="bg-muted/50 border-dashed border-2 border-muted-foreground/20 h-16" />
            )}
        </SortableContext>
      </div>
      <AddTaskForm listId={listId} boardId={boardId} />
    </>
  );
}
