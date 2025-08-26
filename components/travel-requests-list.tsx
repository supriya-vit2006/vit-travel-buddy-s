"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Clock, Users, Car, Calendar } from "lucide-react"
import { getTravelRequests, getUserById, saveGroupRequest, generateId } from "@/lib/storage"
import type { TravelRequest, User } from "@/lib/types"

interface TravelRequestsListProps {
  user: User
  refreshTrigger: number
}

export function TravelRequestsList({ user, refreshTrigger }: TravelRequestsListProps) {
  const [requests, setRequests] = useState<TravelRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [refreshTrigger])

  const loadRequests = () => {
    setLoading(true)
    const allRequests = getTravelRequests()
    // Filter out user's own requests and show only active ones
    const filteredRequests = allRequests.filter((request) => request.userId !== user.id && request.status === "active")
    setRequests(filteredRequests)
    setLoading(false)
  }

  const handleJoinRequest = (requestId: string) => {
    const groupRequest = {
      id: generateId(),
      fromUserId: user.id,
      toGroupId: requestId,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }
    saveGroupRequest(groupRequest)
    // In a real app, this would trigger a notification to the request owner
    alert("Join request sent! The group owner will be notified.")
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Travel Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Travel Requests</CardTitle>
          <CardDescription>Join existing travel groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No travel requests available</p>
            <p className="text-sm text-muted-foreground">Be the first to create a travel request!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Travel Requests</CardTitle>
        <CardDescription>Join existing travel groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => {
            const requestOwner = getUserById(request.userId)
            const { date, time } = formatDateTime(request.date, request.time)

            return (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header with user info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {requestOwner?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{requestOwner?.name || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground">{requestOwner?.vitRegistrationNumber}</p>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatRoute(request.route)}</span>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{time}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {request.vehicleType === "auto" ? "Auto" : "Cab"}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {request.groupSize} people
                      </Badge>
                      <Badge variant="outline">
                        {request.genderPreference === "boys"
                          ? "Boys Only"
                          : request.genderPreference === "girls"
                            ? "Girls Only"
                            : "Mixed Group"}
                      </Badge>
                    </div>
                  </div>

                  {/* Join Button */}
                  <Button size="sm" onClick={() => handleJoinRequest(request.id)} className="shrink-0">
                    Join Group
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
