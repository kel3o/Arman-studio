"use client"

import { MessageSquarePlus, Trash2, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type ChatRecord } from "@/lib/chat-store"
import { cn } from "@/lib/utils"

type ChatSidebarProps = {
  chats: ChatRecord[]
  activeId: string
  disabled?: boolean
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ChatSidebar({
  chats,
  activeId,
  disabled,
  onNewChat,
  onSelect,
  onDelete,
}: ChatSidebarProps) {
  return (
    <aside className="flex max-h-64 flex-col rounded-2xl border bg-card/90 shadow-sm lg:max-h-[calc(100vh-6rem)] lg:min-h-[32rem]">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div>
          <div className="text-sm font-medium">تاریخچه</div>
          <div className="text-xs text-muted-foreground">
            چت‌ها و فایل‌های ساخته‌شده
          </div>
        </div>
        <Button
          size="sm"
          onClick={onNewChat}
          disabled={disabled}
        >
          <MessageSquarePlus data-icon="inline-start" />
          چت جدید
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            هنوز چتی ساخته نشده.
          </p>
        ) : (
          chats.map((chat) => {
            const active = chat.id === activeId
            return (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-start gap-1 rounded-xl border p-2 transition-colors",
                  active
                    ? "border-primary bg-accent"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(chat.id)}
                  className="min-w-0 flex-1 text-start"
                >
                  <div className="truncate text-sm font-medium">
                    {chat.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {new Date(chat.updatedAt).toLocaleDateString("fa-IR")}
                    </span>
                    {chat.hasAudio ? (
                      <span className="inline-flex items-center gap-1">
                        <Volume2 className="size-3" />
                        فایل آماده
                      </span>
                    ) : (
                      <span>بدون صدا</span>
                    )}
                  </div>
                </button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={disabled}
                  aria-label="حذف چت"
                  onClick={() => onDelete(chat.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
