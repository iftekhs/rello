'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldLabel } from '@/components/ui/field';
import { Add01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface Board {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
}

export default function BoardsPage() {
  const supabase = createClient();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchUserAndBoards() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to view boards');
        return;
      }

      setUserId(user.id);

      const { data: boardsData, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch boards');
        console.error('Error fetching boards:', error);
      } else {
        setBoards(boardsData || []);
      }

      setLoading(false);
    }

    fetchUserAndBoards();
  }, [supabase]);

  async function handleCreateBoard() {
    if (!newBoardTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!userId) {
      toast.error('You must be logged in');
      return;
    }

    setIsCreating(true);

    const { data, error } = await supabase
      .from('boards')
      .insert({
        title: newBoardTitle.trim(),
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create board');
      console.error('Error creating board:', error);
      setIsCreating(false);
      return;
    }

    setBoards([data, ...boards]);
    setNewBoardTitle('');
    setIsCreateDialogOpen(false);
    toast.success('Board created successfully');
    setIsCreating(false);
  }

  async function handleUpdateBoard() {
    if (!editBoardTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!selectedBoard || !userId) {
      toast.error('Invalid board');
      return;
    }

    setIsUpdating(true);

    const { data, error } = await supabase
      .from('boards')
      .update({ title: editBoardTitle.trim() })
      .eq('id', selectedBoard.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update board');
      console.error('Error updating board:', error);
      setIsUpdating(false);
      return;
    }

    setBoards(boards.map((b) => (b.id === data.id ? data : b)));
    setEditBoardTitle('');
    setSelectedBoard(null);
    setIsEditDialogOpen(false);
    toast.success('Board updated successfully');
    setIsUpdating(false);
  }

  async function handleDeleteBoard() {
    if (!selectedBoard || !userId) {
      toast.error('Invalid board');
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', selectedBoard.id)
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to delete board');
      console.error('Error deleting board:', error);
      setIsDeleting(false);
      return;
    }

    setBoards(boards.filter((b) => b.id !== selectedBoard.id));
    setSelectedBoard(null);
    setIsDeleteDialogOpen(false);
    toast.success('Board deleted successfully');
    setIsDeleting(false);
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
                disabled={isCreating || !newBoardTitle.trim()}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">No boards yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first board to get started
          </p>
        </div>
      ) : (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="relative cursor-pointer transition-colors hover:bg-muted/50"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {board.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-2"
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(board)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(board)}
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
            </Card>
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
              disabled={isUpdating || !editBoardTitle.trim()}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
