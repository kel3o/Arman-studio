"use client"

import { useState } from "react"
import { Check, Pencil, MessageSquarePlus, Trash2, Volume2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type ChatRecord } from "@/lib/chat-store"
import { cn } from "@/lib/utils"

type ChatSidebarProps = {
  chats: ChatRecord[]
  activeId: string
  disabled?: boolean
  onNewChat: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

export function ChatSidebar({
  chats,
  activeId,
  disabled,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")

  function startRename(chat: ChatRecord) {
    setEditingId(chat.id)
    setDraftTitle(chat.title)
  }

  function commitRename() {
    if (!editingId) return
    onRename(editingId, draftTitle)
    setEditingId(null)
    setDraftTitle("")
  }

  function cancelRename() {
    setEditingId(null)
    setDraftTitle("")
  }

  return (
    <aside className="flex h-64 min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/90 shadow-sm lg:h-full">
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
            const editing = chat.id === editingId
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
                {editing ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1"
                    onSubmit={(event) => {
                      event.preventDefault()
                      commitRename()
                    }}
                  >
                    <Input
                      autoFocus
                      value={draftTitle}
                      disabled={disabled}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault()
                          cancelRename()
                        }
                      }}
                      className="h-8 text-sm"
                      aria-label="نام چت"
                    />
                    <Button
                      type="submit"
                      size="icon-xs"
                      variant="ghost"
                      disabled={disabled}
                      aria-label="ثبت نام"
                    >
                      <Check />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      disabled={disabled}
                      aria-label="انصراف"
                      onClick={cancelRename}
                    >
                      <X />
                    </Button>
                  </form>
                ) : (
                  <>
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
                      size="icon-sm"
                      variant="ghost"
                      disabled={disabled}
                      aria-label="ویرایش نام چت"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        startRename(chat)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={disabled}
                      aria-label="حذف چت"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onDelete(chat.id)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
