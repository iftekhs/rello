'use client';

import { useBoardStore } from '../store/useBoardStore';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

interface TaskListProps {
  listId: string;
  boardId: string;
}

export function TaskList({ listId, boardId }: TaskListProps) {
  const tasks = useBoardStore(
    (s) => s.lists.find((l) => l.id === listId)?.tasks ?? [],
  );

  return (
    <div className="flex flex-col gap-2 mt-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} taskId={task.id} listId={listId} />
      ))}
      <AddTaskForm listId={listId} boardId={boardId} />
    </div>
  );
}
