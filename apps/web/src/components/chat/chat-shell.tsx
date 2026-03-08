import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BubbleChatIcon,
  Search01Icon,
  ShieldMinusIcon,
  UserAdd01Icon,
  UserMinus01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";
import { Facehash } from "facehash";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  decryptChatMessage,
  encryptChatMessage,
  ensureLocalEncryptionKeys,
} from "@/lib/chat-crypto";
import { authClient } from "@/lib/auth-client";
import { useChatBootstrap } from "@/hooks/use-chat-bootstrap";
import { cn } from "@/lib/utils";
import type { BlockedRow, FriendRow, UserSearchRow } from "@/types/chat";
import { trpc } from "@/utils/trpc";

type FriendsDashboard = {
  accepted: FriendRow[];
  blocked: BlockedRow[];
  incoming: FriendRow[];
  outgoing: FriendRow[];
};

type TabKey = "online" | "all" | "pending" | "blocked" | "add";
type OptimisticMessage = {
  id: string;
  isPending: boolean;
  plaintext: string;
  sender: {
    displayName: string;
    id: string;
    image: string | null;
    username: string;
  };
  createdAt: string;
};

function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "Recently active";
  }

  const date = new Date(value);
  const elapsedMs = Date.now() - date.getTime();

  if (Number.isNaN(elapsedMs) || elapsedMs < 60_000) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
}

function PersonAvatar({
  label,
  presence,
  size = 40,
}: {
  label: string;
  presence?: "offline" | "online";
  size?: number;
}) {
  return (
    <div className="relative shrink-0 flex items-center justify-center">
      <Facehash name={label} size={size} className="rounded-[40%]" />
      {presence ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-background",
            presence === "online" ? "bg-emerald-500" : "bg-muted-foreground",
          )}
        />
      ) : null}
    </div>
  );
}

function ListLoadingCard({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      <Spinner size="sm" className="mr-3" />
      {label}
    </div>
  );
}

function FriendActions({
  disabled,
  friend,
  onBlock,
  onOpenChat,
  onRemove,
}: {
  disabled?: boolean;
  friend: FriendRow;
  onBlock: (userId: string) => void;
  onOpenChat: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        className="size-9 rounded-full bg-accent/50 hover:bg-accent"
        disabled={disabled}
        onClick={() => onOpenChat(friend.userId)}
      >
        <Icon icon={BubbleChatIcon} className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
            render={
              <Button
                className="size-9 rounded-full hover:bg-accent"
                disabled={disabled}
              />
          }
        >
          <Icon icon={UserMultiple02Icon} className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 rounded-xl border border-border/80 bg-background/95 backdrop-blur"
        >
          <DropdownMenuItem onClick={() => onRemove(friend.userId)}>
            <Icon icon={UserMinus01Icon} className="size-4" />
            Remove Friend
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onBlock(friend.userId)}>
            <Icon icon={ShieldMinusIcon} className="size-4" />
            Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FriendListCard({
  busyUserId,
  emptyMessage,
  friends,
  isLoading,
  onAccept,
  onBlock,
  onDecline,
  onOpenChat,
  onRemove,
  variant,
}: {
  busyUserId?: string | null;
  emptyMessage: string;
  friends: FriendRow[];
  isLoading?: boolean;
  onAccept?: (friendshipId: string) => void;
  onBlock: (userId: string) => void;
  onDecline?: (friendshipId: string) => void;
  onOpenChat: (userId: string) => void;
  onRemove?: (userId: string) => void;
  variant: "accepted" | "incoming" | "outgoing";
}) {
  if (isLoading) {
    return <ListLoadingCard label="Loading people" />;
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
        <Icon icon={UserMultiple02Icon} className="mb-4 size-10 text-muted-foreground/50" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {variant === "accepted"
          ? `Friends — ${friends.length}`
          : variant === "incoming"
            ? `Incoming Requests — ${friends.length}`
            : `Outgoing Requests — ${friends.length}`}
      </div>
      {friends.map((friend) => {
        const isBusy = busyUserId === friend.userId;

        return (
          <div
            key={friend.userId}
            className="group flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-accent/40"
          >
            <PersonAvatar label={friend.username} presence={friend.presence} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[15px] font-semibold text-foreground">
                  {friend.displayName || friend.username}
                </span>
                <span className="hidden text-sm text-muted-foreground md:inline">
                  {friend.username}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {friend.presence === "online" ? "Online" : "Offline"}
                {friend.customStatus ? ` • ${friend.customStatus}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
              {isBusy ? <Spinner size="sm" /> : null}
              {variant === "accepted" ? (
                <FriendActions
                  disabled={isBusy}
                  friend={friend}
                  onBlock={onBlock}
                  onOpenChat={onOpenChat}
                  onRemove={onRemove ?? (() => undefined)}
                />
              ) : null}
              {variant === "incoming" ? (
                <>
                  <Button
                    className="size-9 rounded-full bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30"
                    disabled={isBusy}
                    onClick={() => onAccept?.(friend.friendshipId)}
                  >
                    <Icon icon={UserAdd01Icon} className="size-4" />
                  </Button>
                  <Button
                    className="size-9 rounded-full hover:bg-destructive/20 hover:text-destructive"
                    disabled={isBusy}
                    onClick={() => onDecline?.(friend.friendshipId)}
                  >
                    <Icon icon={UserMinus01Icon} className="size-4" />
                  </Button>
                </>
              ) : null}
              {variant === "outgoing" ? (
                <Button
                  className="size-9 rounded-full hover:bg-destructive/20 hover:text-destructive"
                  disabled={isBusy}
                  onClick={() => onDecline?.(friend.friendshipId)}
                >
                  <Icon icon={UserMinus01Icon} className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlockedListCard({
  busyUserId,
  isLoading,
  users,
  onUnblock,
}: {
  busyUserId?: string | null;
  isLoading?: boolean;
  onUnblock: (userId: string) => void;
  users: BlockedRow[];
}) {
  if (isLoading) {
    return <ListLoadingCard label="Loading blocked users" />;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
        <Icon icon={ShieldMinusIcon} className="mb-4 size-10 text-muted-foreground/50" />
        No blocked users.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Blocked — {users.length}
      </div>
      {users.map((user) => {
        const isBusy = busyUserId === user.userId;

        return (
          <div
            key={user.blockId}
            className="group flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-accent/40"
          >
            <PersonAvatar label={user.username} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[15px] font-semibold text-foreground">
                  {user.displayName || user.username}
                </span>
                <span className="hidden text-sm text-muted-foreground md:inline">
                  {user.username}
                </span>
              </div>
            </div>
            {isBusy ? <Spinner size="sm" /> : null}
            <Button
              size="sm"
              className="rounded-full"
              disabled={isBusy}
              onClick={() => onUnblock(user.userId)}
            >
              Unblock
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function AddFriendResults({
  busyUserId,
  isLoading,
  onAdd,
  onOpenChat,
  results,
}: {
  busyUserId?: string | null;
  isLoading?: boolean;
  onAdd: (userId: string) => void;
  onOpenChat: (userId: string) => void;
  results: UserSearchRow[];
}) {
  if (isLoading) {
    return <ListLoadingCard label="Searching for people" />;
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-1">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Results
      </div>
      {results.map((result) => {
        const isBusy = busyUserId === result.userId;

        return (
          <div
            key={result.userId}
            className="group flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-accent/40"
          >
            <PersonAvatar label={result.username} presence={result.presence} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-foreground">
                {result.displayName || result.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">@{result.username}</div>
            </div>
            {isBusy ? <Spinner size="sm" /> : null}
            {result.friendship === "friends" ? (
              <Button
                size="sm"
                className="rounded-full"
                disabled={isBusy}
                onClick={() => onOpenChat(result.userId)}
              >
                Message
              </Button>
            ) : result.friendship === "incoming" ? (
              <span className="text-xs text-muted-foreground">Requested you</span>
            ) : result.friendship === "outgoing" ? (
              <span className="text-xs text-muted-foreground">Pending</span>
            ) : (
              <Button
                size="sm"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isBusy}
                onClick={() => onAdd(result.userId)}
              >
                <Icon icon={UserAdd01Icon} className="mr-2 size-4" />
                Add Friend
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function useAutoRead(args: {
  latestMessageId?: string;
  markRead: (messageId: string) => Promise<unknown>;
}) {
  const lastReadMessageRef = useRef<string | null>(null);
  const markReadRef = useRef(args.markRead);

  useEffect(() => {
    markReadRef.current = args.markRead;
  }, [args.markRead]);

  useEffect(() => {
    if (!args.latestMessageId || lastReadMessageRef.current === args.latestMessageId) {
      return;
    }

    lastReadMessageRef.current = args.latestMessageId;
    void markReadRef.current(args.latestMessageId);
  }, [args.latestMessageId]);
}

function ConversationPane({
  conversationId,
  profile,
  realtimeClient,
}: {
  conversationId: string;
  profile: ReturnType<typeof useChatBootstrap>["profile"];
  realtimeClient: NonNullable<ReturnType<typeof useChatBootstrap>["realtimeClient"]>;
}) {
  const { data: session } = authClient.useSession();
  const [draft, setDraft] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  const conversationQuery = useQuery(trpc.conversations.byId.queryOptions({ conversationId }));
  const messagesQuery = useQuery(trpc.messages.list.queryOptions({ conversationId, limit: 50 }));
  const markReadMutation = useMutation(trpc.messages.markRead.mutationOptions());

  const otherParticipant = conversationQuery.data?.participants.find(
    (participant) => participant.userId !== session?.user.id,
  );

  useAutoRead({
    latestMessageId: messagesQuery.data?.at(-1)?.id,
    markRead: (messageId) =>
      markReadMutation.mutateAsync({
        conversationId,
        messageId,
      }),
  });

  const decryptedMessages = useQuery({
    enabled: Boolean(messagesQuery.data && session?.user.id),
    queryKey: ["decrypted-messages", session?.user.id, conversationId, messagesQuery.data],
    queryFn: async () => {
      if (!session?.user.id || !messagesQuery.data) {
        return [];
      }

      const keys = await ensureLocalEncryptionKeys(session.user.id);

      return Promise.all(
        messagesQuery.data.map(async (message) => {
          if (message.ciphertext && message.encryptedKey && message.iv) {
            return {
              ...message,
              plaintext: await decryptChatMessage({
                ciphertext: message.ciphertext,
                encryptedKey: message.encryptedKey,
                iv: message.iv,
                privateKey: keys.privateKey,
              }),
            };
          }

          return {
            ...message,
            plaintext: "Unable to decrypt message",
          };
        }),
      );
    },
  });

  const renderedMessages = useMemo(() => {
    const persisted = decryptedMessages.data ?? [];
    return [...persisted, ...optimisticMessages];
  }, [decryptedMessages.data, optimisticMessages]);

  const sendMessage = async () => {
    if (!conversationQuery.data || !realtimeClient || !session?.user.id || !profile) {
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    const recipientKeys = conversationQuery.data.participants
      .filter((participant) => participant.publicKey)
      .map((participant) => ({
        userId: participant.userId,
        publicKey: participant.publicKey as string,
      }));

    if (recipientKeys.length !== conversationQuery.data.participants.length) {
      toast.error("One or more participants do not have encryption keys yet.");
      return;
    }

    const optimisticId = `optimistic-${crypto.randomUUID()}`;

    setOptimisticMessages((previous) => [
      ...previous,
      {
        id: optimisticId,
        isPending: true,
        plaintext: text,
        createdAt: new Date().toISOString(),
        sender: {
          id: session.user.id,
          username: profile.username,
          displayName: profile.displayName || session.user.name || profile.username,
          image: session.user.image ?? null,
        },
      },
    ]);
    setDraft("");

    try {
      const encryptedMessage = await encryptChatMessage({
        text,
        recipients: recipientKeys,
      });

      realtimeClient.send({
        type: "message:send",
        payload: {
          conversationId,
          ciphertext: encryptedMessage.ciphertext,
          encryptionAlgorithm: encryptedMessage.encryptionAlgorithm,
          envelopes: encryptedMessage.envelopes,
          iv: encryptedMessage.iv,
        },
      });

      window.setTimeout(() => {
        setOptimisticMessages((previous) =>
          previous.filter((message) => message.id !== optimisticId),
        );
      }, 2500);
    } catch (error) {
      setOptimisticMessages((previous) =>
        previous.filter((message) => message.id !== optimisticId),
      );
      setDraft(text);
      toast.error(error instanceof Error ? error.message : "Failed to send message.");
    }
  };

  if (conversationQuery.isLoading || messagesQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!conversationQuery.data || !otherParticipant) {
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <PersonAvatar
            label={otherParticipant.username}
            presence={otherParticipant.presence === "online" ? "online" : "offline"}
            size={32}
          />
          <div className="text-[15px] font-semibold text-foreground">
            {otherParticipant.displayName || otherParticipant.username}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
        {renderedMessages.length ? (
          renderedMessages.map((message) => {
            const isOwnMessage = message.sender.id === session?.user.id;
            const isPending = "isPending" in message && Boolean(message.isPending);

            return (
              <div key={message.id} className={cn("group flex gap-3 py-2", isOwnMessage ? "" : "")}>
                <div className="mt-0.5">
                  <PersonAvatar label={message.sender.username} size={40} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-medium text-foreground">
                      {message.sender.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(message.createdAt)}
                    </span>
                    {isPending && <Spinner size="sm" className="size-3" />}
                  </div>
                  <div className="mt-1 text-[15px] leading-relaxed text-foreground/90">
                    {message.plaintext}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col justify-end h-full">
            <PersonAvatar label={otherParticipant.username} size={80} />
            <h1 className="mt-4 text-3xl font-bold">
              {otherParticipant.displayName || otherParticipant.username}
            </h1>
            <p className="mt-2 text-muted-foreground">
              This is the beginning of your direct message history with{" "}
              <strong>{otherParticipant.displayName || otherParticipant.username}</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 md:px-6">
        <div className="flex items-center rounded-xl bg-accent px-4 py-3">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={`Message @${otherParticipant.username}`}
            className="h-auto border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

export function ChatShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const [activeTab, setActiveTab] = useState<TabKey>("online");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const { profile, realtimeClient } = useChatBootstrap();

  const conversationId = useMemo(() => {
    const search = routerState.location.search as { conversationId?: string };
    return search.conversationId ?? null;
  }, [routerState.location.search]);

  const dashboardQuery = useQuery(
    trpc.friends.dashboard.queryOptions({
      query: filterQuery,
    }),
  );

  const searchUsersQuery = useQuery({
    ...trpc.users.search.queryOptions({
      query: userSearchQuery.length >= 2 ? userSearchQuery : "hi",
    }),
    enabled: activeTab === "add" && userSearchQuery.length >= 2,
  });

  const acceptMutation = useMutation(trpc.friends.acceptRequest.mutationOptions());
  const declineMutation = useMutation(trpc.friends.declineRequest.mutationOptions());
  const removeMutation = useMutation(trpc.friends.remove.mutationOptions());
  const blockMutation = useMutation(trpc.friends.block.mutationOptions());
  const unblockMutation = useMutation(trpc.friends.unblock.mutationOptions());
  const addFriendMutation = useMutation(trpc.friends.sendRequest.mutationOptions());
  const openDmMutation = useMutation(trpc.conversations.openDm.mutationOptions());

  const dashboard = (dashboardQuery.data as FriendsDashboard | undefined) ?? {
    accepted: [],
    blocked: [],
    incoming: [],
    outgoing: [],
  };

  const performAction = async (userId: string, action: () => Promise<void>) => {
    setBusyUserId(userId);
    try {
      await action();
    } finally {
      setBusyUserId((current) => (current === userId ? null : current));
    }
  };

  const refreshHomeData = async () => {
    await Promise.all([
      queryClient.invalidateQueries(trpc.friends.dashboard.queryFilter()),
      queryClient.invalidateQueries(trpc.conversations.list.queryFilter()),
      queryClient.invalidateQueries(trpc.users.search.queryFilter()),
    ]);
  };

  const openChat = async (userId: string) => {
    await performAction(userId, async () => {
      const conversation = await openDmMutation.mutateAsync({ userId });
      await queryClient.invalidateQueries(trpc.conversations.list.queryFilter());
      navigate({ to: "/", search: { conversationId: conversation.id } as never });
    });
  };

  // View: Conversation
  if (conversationId && realtimeClient && profile) {
    return (
      <div className="h-full rounded-tl-xl overflow-hidden bg-background border border-border shadow-sm">
        <ConversationPane
          key={conversationId}
          conversationId={conversationId}
          profile={profile}
          realtimeClient={realtimeClient}
        />
      </div>
    );
  }

  // View: Friends Dashboard
  const pendingRequests = [...dashboard.incoming, ...dashboard.outgoing];
  const onlineFriends = dashboard.accepted.filter((f) => f.presence === "online");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-tl-xl bg-background border border-border shadow-sm">
      <header className="flex h-14 shrink-0 items-center gap-6 border-b border-border px-6">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Icon icon={UserMultiple02Icon} className="size-5 text-muted-foreground" />
          Friends
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-4">
          {(["online", "all", "pending", "blocked"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-2 py-1 text-[15px] font-medium transition-colors hover:bg-accent hover:text-foreground",
                activeTab === tab ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "pending" && pendingRequests.length > 0 && (
                <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
          <Button
            size="sm"
            onClick={() => setActiveTab("add")}
            className={cn(
              "ml-2 h-7 rounded bg-emerald-600 px-3 text-[13px] hover:bg-emerald-700 text-white",
              activeTab === "add" && "bg-emerald-700",
            )}
          >
            Add Friend
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col px-6 py-6 lg:max-w-4xl">
          {activeTab === "add" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground uppercase tracking-wider">
                  Add Friend
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can add friends with their OpenCord usernames.
                </p>
              </div>
              <div className="relative mt-4">
                <Input
                  value={userSearchQuery}
                  onChange={(event) => setUserSearchQuery(event.target.value)}
                  placeholder="You can add friends with their OpenCord username"
                  className="h-14 rounded-xl border-0 bg-accent px-4 text-[15px] focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <AddFriendResults
                  busyUserId={busyUserId}
                  isLoading={searchUsersQuery.isFetching}
                  results={(searchUsersQuery.data ?? []) as UserSearchRow[]}
                  onAdd={(userId) => {
                    void performAction(userId, async () => {
                      await addFriendMutation.mutateAsync({ targetUserId: userId });
                      await refreshHomeData();
                      toast.success("Friend request sent.");
                    });
                  }}
                  onOpenChat={(userId) => {
                    void openChat(userId);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="relative mb-6">
                <Icon icon={Search01Icon} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-full rounded-md border-0 bg-accent pl-9 text-sm focus-visible:ring-0"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {activeTab === "online" && (
                  <FriendListCard
                    busyUserId={busyUserId}
                    friends={onlineFriends}
                    isLoading={dashboardQuery.isLoading}
                    variant="accepted"
                    emptyMessage="No one is around to play with Wumpus."
                    onBlock={(userId) =>
                      void performAction(userId, async () => {
                        await blockMutation.mutateAsync({ targetUserId: userId });
                        await refreshHomeData();
                      })
                    }
                    onOpenChat={openChat}
                    onRemove={(userId) =>
                      void performAction(userId, async () => {
                        await removeMutation.mutateAsync({ targetUserId: userId });
                        await refreshHomeData();
                      })
                    }
                  />
                )}
                {activeTab === "all" && (
                  <FriendListCard
                    busyUserId={busyUserId}
                    friends={dashboard.accepted}
                    isLoading={dashboardQuery.isLoading}
                    variant="accepted"
                    emptyMessage="You have no friends on OpenCord yet."
                    onBlock={(userId) =>
                      void performAction(userId, async () => {
                        await blockMutation.mutateAsync({ targetUserId: userId });
                        await refreshHomeData();
                      })
                    }
                    onOpenChat={openChat}
                    onRemove={(userId) =>
                      void performAction(userId, async () => {
                        await removeMutation.mutateAsync({ targetUserId: userId });
                        await refreshHomeData();
                      })
                    }
                  />
                )}
                {activeTab === "pending" && (
                  <div className="space-y-8">
                    {dashboard.incoming.length > 0 && (
                      <FriendListCard
                        busyUserId={busyUserId}
                        friends={dashboard.incoming}
                        variant="incoming"
                        emptyMessage=""
                        onAccept={(friendshipId) => {
                          const friend = dashboard.incoming.find(
                            (entry) => entry.friendshipId === friendshipId,
                          );
                          if (friend)
                            void performAction(friend.userId, async () => {
                              await acceptMutation.mutateAsync({ friendshipId });
                              await refreshHomeData();
                            });
                        }}
                        onDecline={(friendshipId) => {
                          const friend = dashboard.incoming.find(
                            (entry) => entry.friendshipId === friendshipId,
                          );
                          if (friend)
                            void performAction(friend.userId, async () => {
                              await declineMutation.mutateAsync({ friendshipId });
                              await refreshHomeData();
                            });
                        }}
                        onBlock={(userId) =>
                          void performAction(userId, async () => {
                            await blockMutation.mutateAsync({ targetUserId: userId });
                            await refreshHomeData();
                          })
                        }
                        onOpenChat={() => {}}
                      />
                    )}
                    {dashboard.outgoing.length > 0 && (
                      <FriendListCard
                        busyUserId={busyUserId}
                        friends={dashboard.outgoing}
                        variant="outgoing"
                        emptyMessage=""
                        onDecline={(friendshipId) => {
                          const friend = dashboard.outgoing.find(
                            (entry) => entry.friendshipId === friendshipId,
                          );
                          if (friend)
                            void performAction(friend.userId, async () => {
                              await declineMutation.mutateAsync({ friendshipId });
                              await refreshHomeData();
                            });
                        }}
                        onBlock={(userId) =>
                          void performAction(userId, async () => {
                            await blockMutation.mutateAsync({ targetUserId: userId });
                            await refreshHomeData();
                          })
                        }
                        onOpenChat={() => {}}
                      />
                    )}
                    {dashboard.incoming.length === 0 &&
                      dashboard.outgoing.length === 0 &&
                      !dashboardQuery.isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
                          <Icon icon={UserMultiple02Icon} className="mb-4 size-10 text-muted-foreground/50" />
                          There are no pending friend requests.
                        </div>
                      )}
                  </div>
                )}
                {activeTab === "blocked" && (
                  <BlockedListCard
                    busyUserId={busyUserId}
                    isLoading={dashboardQuery.isLoading}
                    users={dashboard.blocked}
                    onUnblock={(userId) =>
                      void performAction(userId, async () => {
                        await unblockMutation.mutateAsync({ targetUserId: userId });
                        await refreshHomeData();
                      })
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
        <aside className="hidden w-[350px] border-l border-border px-4 py-6 xl:block">
          <h3 className="text-xl font-bold text-foreground">Active Now</h3>
          <div className="mt-6 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-semibold text-foreground">It's quiet for now...</div>
            <p className="mt-1 text-xs text-muted-foreground">
              When a friend starts an activity—like playing a game or hanging out on voice—we'll
              show it here!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
