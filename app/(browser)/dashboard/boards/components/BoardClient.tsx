'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Add01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  createBoard,
  updateBoard,
  deleteBoard,
  updateBoardVisibility,
} from '../actions';
import Link from 'next/link';

type BoardVisibility = 'private' | 'public_readonly' | 'public_readwrite';

interface Board {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  visibility: BoardVisibility;
}

interface BoardClientProps {
  initialBoards: Board[];
}

function BoardCard({
  board,
  onEdit,
  onDelete,
}: {
  board: Board;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}) {
  const [visibilityMap, setVisibilityMap] = useState<
    Record<string, BoardVisibility>
  >(() => ({ [board.id]: board.visibility }));

  const [isPending, startTransition] = useTransition();

  const visibility = visibilityMap[board.id];
  const isPublic = visibility !== 'private';
  const isWritable = visibility === 'public_readwrite';

  function handlePublicToggle(checked: boolean) {
    const newVisibility: BoardVisibility = checked
      ? 'public_readonly'
      : 'private';

    const previousVisibility = visibility;
    setVisibilityMap((prev) => ({ ...prev, [board.id]: newVisibility }));

    startTransition(async () => {
      try {
        await updateBoardVisibility(board.id, newVisibility);
      } catch {
        setVisibilityMap((prev) => ({
          ...prev,
          [board.id]: previousVisibility,
        }));
        toast.error('Failed to update visibility');
      }
    });
  }

  function handleWriteToggle(checked: boolean) {
    if (!isPublic) return;

    const newVisibility: BoardVisibility = checked
      ? 'public_readwrite'
      : 'public_readonly';

    const previousVisibility = visibility;
    setVisibilityMap((prev) => ({ ...prev, [board.id]: newVisibility }));

    startTransition(async () => {
      try {
        await updateBoardVisibility(board.id, newVisibility);
      } catch {
        setVisibilityMap((prev) => ({
          ...prev,
          [board.id]: previousVisibility,
        }));
        toast.error('Failed to update visibility');
      }
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <Card className="relative cursor-pointer transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">{board.title}</CardTitle>
          {visibility === 'public_readonly' && (
            <Badge variant="secondary">Public</Badge>
          )}
          {visibility === 'public_readwrite' && (
            <Badge variant="default">Public · Editable</Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2"
              onClick={(e) => e.stopPropagation()}
            >
              <HugeiconsIcon icon={MoreVerticalIcon} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(board);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(board);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Created {formatDate(board.created_at)}
        </p>
      </CardContent>
      <Separator />
      <div
        className={`p-4 space-y-3 ${isPending ? 'opacity-50' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Public</p>
            <p className="text-xs text-muted-foreground">
              Anyone can view this board
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Allow editing</p>
            <p className="text-xs text-muted-foreground">
              Public users can add and edit tasks
            </p>
          </div>
          <Switch
            checked={isWritable}
            onCheckedChange={handleWriteToggle}
            disabled={!isPublic || isPending}
          />
        </div>
      </div>
    </Card>
  );
}

export function BoardClient({ initialBoards }: BoardClientProps) {
  const [isPending, startTransition] = useTransition();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  function handleCreateBoard() {
    if (!newBoardTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    startTransition(async () => {
      try {
        await createBoard(newBoardTitle);
        setNewBoardTitle('');
        setIsCreateDialogOpen(false);
        toast.success('Board created successfully');
      } catch {
        toast.error('Failed to create board');
      }
    });
  }

  function handleUpdateBoard() {
    if (!editBoardTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!selectedBoard) {
      toast.error('Invalid board');
      return;
    }

    startTransition(async () => {
      try {
        await updateBoard(selectedBoard.id, editBoardTitle);
        setEditBoardTitle('');
        setSelectedBoard(null);
        setIsEditDialogOpen(false);
        toast.success('Board updated successfully');
      } catch {
        toast.error('Failed to update board');
      }
    });
  }

  function handleDeleteBoard() {
    if (!selectedBoard) {
      toast.error('Invalid board');
      return;
    }

    startTransition(async () => {
      try {
        await deleteBoard(selectedBoard.id);
        setSelectedBoard(null);
        setIsDeleteDialogOpen(false);
        toast.success('Board deleted successfully');
      } catch {
        toast.error('Failed to delete board');
      }
    });
  }

  function openEditDialog(board: Board) {
    setSelectedBoard(board);
    setEditBoardTitle(board.title);
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(board: Board) {
    setSelectedBoard(board);
    setIsDeleteDialogOpen(true);
  }

  return (
    <div
      className={`flex flex-1 flex-col gap-4 p-4 pt-0 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Boards</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <HugeiconsIcon icon={Add01Icon} />
              Create Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>
                Enter a title for your new board.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Field>
                <FieldLabel htmlFor="board-title">Title</FieldLabel>
                <Input
                  id="board-title"
                  placeholder="Enter board title"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBoard();
                    }
                  }}
                  autoFocus
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBoard}
                disabled={isPending || !newBoardTitle.trim()}
              >
                {isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {initialBoards.length === 0 ? (
        <div className="flex min-h-50 flex-col items-center justify-center rounded-xl bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">No boards yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first board to get started
          </p>
        </div>
      ) : (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4">
          {initialBoards.map((board) => (
            <Link key={board.id} href={`/dashboard/boards/${board.id}`}>
              <BoardCard
                board={board}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            </Link>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Update the title for your board.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel htmlFor="edit-board-title">Title</FieldLabel>
              <Input
                id="edit-board-title"
                placeholder="Enter board title"
                value={editBoardTitle}
                onChange={(e) => setEditBoardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateBoard();
                  }
                }}
                autoFocus
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBoard}
              disabled={isPending || !editBoardTitle.trim()}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this board? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
