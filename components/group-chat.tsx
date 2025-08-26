"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageCircle, Send, X, Users } from "lucide-react"
import { getTravelGroups, saveTravelGroup, getUserById, generateId } from "@/lib/storage"
import type { TravelGroup, User, ChatMessage } from "@/lib/types"

interface GroupChatProps {
  user: User
  groupId: string | null
  isOpen: boolean
  onClose: () => void
}

export function GroupChat({ user, groupId, isOpen, onClose }: GroupChatProps) {
  const [group, setGroup] = useState<TravelGroup | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatPollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupAndMessages()
      startChatPolling()
    } else {
      stopChatPolling()
    }

    return () => {
      stopChatPolling()
    }
  }, [isOpen, groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadGroupAndMessages = () => {
    if (!groupId) return

    const allGroups = getTravelGroups()
    const currentGroup = allGroups.find((g) => g.id === groupId)

    if (currentGroup) {
      setGroup(currentGroup)
      setMessages(currentGroup.chatMessages || [])
    }
  }

  const startChatPolling = () => {
    // Poll for new messages every 2 seconds to simulate real-time updates
    chatPollingRef.current = setInterval(() => {
      loadGroupAndMessages()
    }, 2000)
  }

  const stopChatPolling = () => {
    if (chatPollingRef.current) {
      clearInterval(chatPollingRef.current)
      chatPollingRef.current = null
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !group || loading) return

    setLoading(true)

    const message: ChatMessage = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...(group.chatMessages || []), message]
    const updatedGroup = {
      ...group,
      chatMessages: updatedMessages,
    }

    saveTravelGroup(updatedGroup)
    setMessages(updatedMessages)
    setNewMessage("")
    setLoading(false)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const formatRoute = (route: string) => {
    const routeMap = {
      "vit-to-katpadi": "VIT → Katpadi",
      "katpadi-to-vit": "Katpadi → VIT",
      "vit-to-chennai": "VIT → Chennai",
      "chennai-to-vit": "Chennai → VIT",
    }
    return routeMap[route as keyof typeof routeMap] || route
  }

  if (!group) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Group Chat</DialogTitle>
            <DialogDescription>Loading group information...</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const groupMembers = group.members.map((memberId) => getUserById(memberId)).filter(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Group Chat
              </DialogTitle>
              <DialogDescription>
                {formatRoute(group.route)} • {group.date} at {group.time}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Group Members */}
        <div className="flex-shrink-0 border-b pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Members ({groupMembers.length})</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {groupMembers.map((member) => (
              <div key={member?.id} className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {member?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{member?.name.split(" ")[0]}</span>
                {member?.id === user.id && <span className="text-xs text-primary">(You)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.userId === user.id
                const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
                const messageUser = getUserById(message.userId)

                return (
                  <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {message.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[70%] ${isOwnMessage ? "text-right" : "text-left"}`}>
                      {showAvatar && (
                        <div
                          className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <span className="text-sm font-medium">{message.userName}</span>
                          <span className="text-xs text-muted-foreground">{formatMessageTime(message.timestamp)}</span>
                        </div>
                      )}
                      <div
                        className={`inline-block px-3 py-2 rounded-lg max-w-full break-words ${
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t pt-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !newMessage.trim()} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
