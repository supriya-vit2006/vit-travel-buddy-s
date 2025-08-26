"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, MapPin, Clock, Car, Calendar, Settings, UserMinus, Merge, MessageCircle } from "lucide-react"
import {
  getTravelGroupsByUser,
  getUserById,
  saveTravelGroup,
  getTravelGroups,
  removeUserFromGroup,
  deleteTravelGroup, // Added delete group function
} from "@/lib/storage"
import type { TravelGroup, User } from "@/lib/types"

interface GroupManagementProps {
  user: User
  refreshTrigger: number
  onChatOpen: (groupId: string) => void
}

export function GroupManagement({ user, refreshTrigger, onChatOpen }: GroupManagementProps) {
  const [userGroups, setUserGroups] = useState<TravelGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserGroups()
  }, [user.id, refreshTrigger])

  const loadUserGroups = () => {
    setLoading(true)
    const groups = getTravelGroupsByUser(user.id).filter((g) => g.status !== "completed")
    setUserGroups(groups)
    setLoading(false)
  }

  const handleLeaveGroup = (groupId: string) => {
    removeUserFromGroup(user.id, groupId)
    loadUserGroups()
  }

  const handleDeleteGroup = (groupId: string) => {
    deleteTravelGroup(groupId)
    loadUserGroups()
  }

  const handleConfirmGroup = (groupId: string) => {
    const group = userGroups.find((g) => g.id === groupId)
    if (!group) return

    const updatedGroup = { ...group, status: "confirmed" as const }
    saveTravelGroup(updatedGroup)
    loadUserGroups()
  }

  const handleMergeGroups = (sourceGroupId: string, targetGroupId: string) => {
    const sourceGroup = userGroups.find((g) => g.id === sourceGroupId)
    const targetGroup = getTravelGroups().find((g) => g.id === targetGroupId)

    if (!sourceGroup || !targetGroup) return

    // Merge members
    const mergedMembers = [...new Set([...sourceGroup.members, ...targetGroup.members])]

    // Update target group with merged members
    const updatedTargetGroup = {
      ...targetGroup,
      members: mergedMembers,
      chatMessages: [...(targetGroup.chatMessages || []), ...(sourceGroup.chatMessages || [])],
    }
    saveTravelGroup(updatedTargetGroup)

    // Mark source group as completed
    const completedSourceGroup = { ...sourceGroup, status: "completed" as const }
    saveTravelGroup(completedSourceGroup)

    loadUserGroups()
  }

  const formatRoute = (route: string) => {
    const routeMap = {
      "vit-to-katpadi": "VIT → Katpadi Station",
      "katpadi-to-vit": "Katpadi Station → VIT",
      "vit-to-chennai": "VIT → Chennai Airport",
      "chennai-to-vit": "Chennai Airport → VIT",
    }
    return routeMap[route as keyof typeof routeMap] || route
  }

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`)
    return {
      date: dateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  const getCompatibleGroups = (currentGroup: TravelGroup) => {
    const allGroups = getTravelGroups()
    return allGroups.filter(
      (group) =>
        group.id !== currentGroup.id &&
        group.route === currentGroup.route &&
        group.date === currentGroup.date &&
        group.vehicleType === currentGroup.vehicleType &&
        group.status === "forming" &&
        !group.members.includes(user.id) &&
        group.members.length + currentGroup.members.length <= 4,
    )
  }

  const getUnreadCount = (group: TravelGroup) => {
    // Simple unread logic - in a real app, this would track last read timestamp
    const messages = group.chatMessages || []
    const recentMessages = messages.filter((msg) => {
      const msgTime = new Date(msg.timestamp).getTime()
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      return msgTime > oneHourAgo && msg.userId !== user.id
    })
    return recentMessages.length
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Travel Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (userGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Travel Groups
          </CardTitle>
          <CardDescription>Manage your active travel groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No active travel groups</p>
            <p className="text-sm text-muted-foreground mt-1">Join or create a travel request to form groups</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          My Travel Groups
          <Badge variant="secondary" className="ml-2">
            {userGroups.length}
          </Badge>
        </CardTitle>
        <CardDescription>Manage your active travel groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userGroups.map((group) => {
            const { date, time } = formatDateTime(group.date, group.time)
            const members = group.members.map((memberId) => getUserById(memberId)).filter(Boolean)
            const compatibleGroups = getCompatibleGroups(group)
            const unreadCount = getUnreadCount(group)

            return (
              <div key={group.id} className="border rounded-lg p-4 space-y-4">
                {/* Group Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatRoute(group.route)}</span>
                      <Badge variant={group.status === "confirmed" ? "default" : "secondary"}>
                        {group.status === "forming" ? "Forming" : "Confirmed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {group.vehicleType === "auto" ? "Auto" : "Cab"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onChatOpen(group.id)}
                      className="flex items-center gap-1 relative"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Chat
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Group Settings</DialogTitle>
                          <DialogDescription>Manage your travel group settings and members</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {group.status === "forming" && (
                            <Button onClick={() => handleConfirmGroup(group.id)} className="w-full">
                              Confirm Group
                            </Button>
                          )}

                          {compatibleGroups.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Merge with Compatible Groups:</h4>
                              {compatibleGroups.slice(0, 3).map((compatibleGroup) => (
                                <Button
                                  key={compatibleGroup.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMergeGroups(group.id, compatibleGroup.id)}
                                  className="w-full flex items-center gap-2"
                                >
                                  <Merge className="h-3 w-3" />
                                  Merge with {compatibleGroup.members.length} member group
                                </Button>
                              ))}
                            </div>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full">
                                <UserMinus className="h-3 w-3 mr-1" />
                                Exit Group
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Exit Travel Group?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to exit this travel group? You can create new travel requests
                                  after leaving.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleLeaveGroup(group.id)}>
                                  Exit Group
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {group.createdBy === user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  Delete Group
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Travel Group?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this travel group? This action cannot be undone and
                                    will remove all members from the group.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>
                                    Delete Group
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Group Members */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members ({members.length}/4)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.map((member) => (
                      <div key={member?.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {member?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member?.name}</p>
                          <p className="text-xs text-primary">@{member?.username}</p>
                          <p className="text-xs text-muted-foreground">{member?.vitRegistrationNumber}</p>
                        </div>
                        {member?.id === user.id && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                  <span>{(group.chatMessages || []).length} messages</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
