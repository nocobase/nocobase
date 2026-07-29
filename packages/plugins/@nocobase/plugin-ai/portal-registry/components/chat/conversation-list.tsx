import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/app-shell/loading-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAIChatBase } from "../../providers";
import {
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export function ConversationList({
  onClose,
  showCloseButton = true,
}: {
  onClose?: () => void;
  showCloseButton?: boolean;
} = {}) {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    renameConversation,
    removeConversation,
    startNewConversation,
    setConversationListOpen,
    conversationsLoading,
    conversationSearch,
    searchConversations,
    historyError,
  } = useAIChatBase();
  const [searchValue, setSearchValue] = useState(conversationSearch);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  }>();
  const [renameTitle, setRenameTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  }>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    setRenameTitle(renameTarget?.title ?? "");
    setRenameError(undefined);
  }, [renameTarget]);

  useEffect(() => {
    setSearchValue(conversationSearch);
  }, [conversationSearch]);

  const submitRename = async (event: FormEvent) => {
    event.preventDefault();
    if (!renameTarget || !renameTitle.trim()) return;
    setRenaming(true);
    setRenameError(undefined);
    try {
      await renameConversation(renameTarget.id, renameTitle);
      setRenameTarget(undefined);
    } catch (error) {
      setRenameError(
        error instanceof Error ? error.message : "Unable to rename conversation"
      );
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await removeConversation(deleteTarget.id);
      setDeleteTarget(undefined);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete conversation"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden overscroll-contain bg-card">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {showCloseButton ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close conversation list"
              onClick={() =>
                onClose ? onClose() : setConversationListOpen(false)
              }
            >
              <PanelLeftClose />
            </Button>
          ) : null}
          <span className="truncate text-sm font-semibold">Conversations</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New conversation"
          onClick={startNewConversation}
        >
          <Plus />
        </Button>
      </div>
      <form
        className="shrink-0 border-b p-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          void searchConversations(searchValue).catch(() => undefined);
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            className="h-8 pl-8 pr-8 text-sm"
            placeholder="Search conversations"
            aria-label="Search conversations"
            onChange={(event) => setSearchValue(event.target.value)}
          />
          {conversationsLoading && conversationSearch ? (
            <LoaderCircle className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : searchValue ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              aria-label="Clear conversation search"
              onClick={() => {
                setSearchValue("");
                void searchConversations("").catch(() => undefined);
              }}
            >
              <X />
            </Button>
          ) : null}
        </div>
      </form>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {conversationsLoading ? (
          <LoadingState className="py-8" />
        ) : conversations.length ? (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group/conversation flex items-start rounded-lg pr-1 transition-colors",
                    active ? "bg-accent" : "hover:bg-muted/70"
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left"
                    onClick={() => selectConversation(conversation.id)}
                  >
                    {conversation.unread && !active ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-destructive"
                        aria-label="Unread conversation"
                      />
                    ) : null}
                    <span className="block min-w-0 flex-1 truncate text-sm font-medium">
                      {conversation.title}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="mt-1.5 opacity-0 group-hover/conversation:opacity-100 data-popup-open:opacity-100"
                          aria-label="Conversation actions"
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() =>
                          setRenameTarget({
                            id: conversation.id,
                            title: conversation.title,
                          })
                        }
                      >
                        <Pencil />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeleteError(undefined);
                          setDeleteTarget({
                            id: conversation.id,
                            title: conversation.title,
                          });
                        }}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {conversationSearch
              ? "No matching conversations."
              : "No conversations yet."}
          </div>
        )}
        {historyError ? (
          <div className="mx-2 mt-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {historyError.message}
          </div>
        ) : null}
      </div>
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open && !renaming) setRenameTarget(undefined);
        }}
      >
        <DialogContent>
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>
                Choose a title that makes this conversation easy to find.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-2">
              <Label htmlFor="conversation-title">Title</Label>
              <Input
                id="conversation-title"
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                autoFocus
                maxLength={120}
              />
              {renameError ? (
                <p className="text-xs text-destructive">{renameError}</p>
              ) : null}
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                disabled={renaming}
                onClick={() => setRenameTarget(undefined)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={renaming || !renameTitle.trim()}>
                {renaming ? <LoaderCircle className="animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” and its messages will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="mt-3 text-sm text-destructive">{deleteError}</p>
          ) : null}
          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? <LoaderCircle className="animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
