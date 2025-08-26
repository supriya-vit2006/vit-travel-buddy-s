"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Check, X, Clock, Users } from "lucide-react"
import {
  getGroupRequests,
  getUserById,
  saveGroupRequest,
  getTravelRequests,
  saveTravelGroup,
  generateId,
} from "@/lib/storage"
import type { GroupRequest, User, TravelGroup } from "@/lib/types"

interface GroupRequestsManagerProps {
  user: User
  onGroupFormed: () => void
}

export function GroupRequestsManager({ user, onGroupFormed }: GroupRequestsManagerProps) {
  const [incomingRequests, setIncomingRequests] = useState<GroupRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<GroupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [user.id])

  const loadRequests = () => {
    setLoading(true)
    const allRequests = getGroupRequests()

    // Incoming requests: direct requests to the user
    const incoming = allRequests.filter((req) => req.toUserId === user.id && req.status === "pending")

    // Outgoing requests: user's requests to other users
    const outgoing = allRequests.filter((req) => req.fromUserId === user.id && req.status === "pending")

    setIncomingRequests(incoming)
    setOutgoingRequests(outgoing)
    setLoading(false)
  }

  const handleAcceptRequest = (requestId: string) => {
    const request = incomingRequests.find((r) => r.id === requestId)
    if (!request) return

    // Update request status
    const updatedRequest = { ...request, status: "accepted" as const }
    saveGroupRequest(updatedRequest)

    const userTravelRequests = getTravelRequests().filter((r) => r.userId === user.id && r.status === "active")
    const requesterTravelRequests = getTravelRequests().filter(
      (r) => r.userId === request.fromUserId && r.status === "active",
    )

    // Find compatible travel requests between the two users
    const compatibleRequest = userTravelRequests.find((userReq) =>
      requesterTravelRequests.some(
        (reqReq) =>
          userReq.route === reqReq.route &&
          userReq.date === reqReq.date &&
          Math.abs(
            new Date(`2000-01-01T${userReq.time}`).getTime() - new Date(`2000-01-01T${reqReq.time}`).getTime(),
          ) <=
            15 * 60 * 1000,
      ),
    )

    if (compatibleRequest) {
      const newGroup: TravelGroup = {
        id: generateId(),
        requestId: compatibleRequest.id,
        members: [user.id, request.fromUserId],
        route: compatibleRequest.route,
        date: compatibleRequest.date,
        time: compatibleRequest.time,
        vehicleType: compatibleRequest.vehicleType,
        status: "forming",
        chatMessages: [],
        createdAt: new Date().toISOString(),
      }
      saveTravelGroup(newGroup)
      onGroupFormed()
    }

    loadRequests()
  }

  const handleRejectRequest = (requestId: string) => {
    const request = incomingRequests.find((r) => r.id === requestId)
    if (!request) return

    const updatedRequest = { ...request, status: "rejected" as const }
    saveGroupRequest(updatedRequest)
    loadRequests()
  }

  const handleCancelRequest = (requestId: string) => {
    const request = outgoingRequests.find((r) => r.id === requestId)
    if (!request) return

    const updatedRequest = { ...request, status: "rejected" as const }
    saveGroupRequest(updatedRequest)
    loadRequests()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Travel Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Travel Requests
          {incomingRequests.length + outgoingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {incomingRequests.length + outgoingRequests.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Manage travel companion requests</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              Incoming
              {incomingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              Outgoing
              {outgoingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {outgoingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4 mt-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No incoming requests</p>
              </div>
            ) : (
              incomingRequests.map((request) => {
                const requester = getUserById(request.fromUserId)

                return (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {requester?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{requester?.name || "Unknown User"}</p>
                          <p className="text-sm text-primary font-medium">@{requester?.username}</p>
                          <p className="text-sm text-muted-foreground">{requester?.regNo}</p>
                          <p className="text-sm text-muted-foreground mt-1">Wants to travel together</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4 mt-4">
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No outgoing requests</p>
              </div>
            ) : (
              outgoingRequests.map((request) => {
                const targetUser = getUserById(request.toUserId!)

                return (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {targetUser?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">Request to @{targetUser?.username || "Unknown User"}</p>
                          <p className="text-sm text-muted-foreground">{targetUser?.regNo}</p>
                          <Badge variant="outline" className="mt-2">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleCancelRequest(request.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
