"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Users, MapPin, Clock, Car, UserPlus } from "lucide-react"
import { findMatchingRequests } from "@/lib/matching"
import { getTravelRequestsByUser, saveGroupRequest, generateId, getUserById, getUserActiveGroup } from "@/lib/storage"
import type { User, TravelRequest } from "@/lib/types"

interface SmartMatchingProps {
  user: User
  refreshTrigger: number
}

export function SmartMatching({ user, refreshTrigger }: SmartMatchingProps) {
  const [userRequests, setUserRequests] = useState<TravelRequest[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<string>("")

  useEffect(() => {
    loadUserRequestsAndMatches()
  }, [user.id, refreshTrigger])

  const loadUserRequestsAndMatches = () => {
    setLoading(true)

    const activeGroup = getUserActiveGroup(user.id)
    if (activeGroup) {
      setUserRequests([])
      setMatches([])
      setLoading(false)
      return
    }

    const requests = getTravelRequestsByUser(user.id).filter((r) => r.status === "active")
    setUserRequests(requests)

    if (requests.length > 0) {
      const firstRequest = requests[0]
      setSelectedRequest(firstRequest.id)
      const matchingResults = findMatchingRequests(firstRequest)
      const availableMatches = matchingResults.filter((match) => !getUserActiveGroup(match.request.userId))
      setMatches(availableMatches.slice(0, 5)) // Show top 5 matches
    } else {
      setMatches([])
    }
    setLoading(false)
  }

  const handleRequestChange = (requestId: string) => {
    setSelectedRequest(requestId)
    const request = userRequests.find((r) => r.id === requestId)
    if (request) {
      const matchingResults = findMatchingRequests(request)
      const availableMatches = matchingResults.filter((match) => !getUserActiveGroup(match.request.userId))
      setMatches(availableMatches.slice(0, 5))
    }
  }

  const handleSendDirectRequest = (targetUserId: string) => {
    const groupRequest = {
      id: generateId(),
      fromUserId: user.id,
      toUserId: targetUserId,
      requestType: "direct_request" as const,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }
    saveGroupRequest(groupRequest)
    alert("Travel request sent to user!")
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Finding matches...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeGroup = getUserActiveGroup(user.id)
  if (activeGroup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Matching
          </CardTitle>
          <CardDescription>AI-powered travel companion matching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">You're already in a travel group</p>
            <p className="text-sm text-muted-foreground mt-1">Exit your current group to find new matches</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (userRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Matching
          </CardTitle>
          <CardDescription>AI-powered travel companion matching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Create a travel request to see smart matches</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Matching
        </CardTitle>
        <CardDescription>AI-powered travel companion matching</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request Selector */}
        {userRequests.length > 1 && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select your travel request:</label>
            <select
              value={selectedRequest}
              onChange={(e) => handleRequestChange(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background text-sm"
            >
              {userRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {formatRoute(request.route)} - {request.date} at {request.time}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Matches */}
        {matches.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No compatible matches found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your preferences or check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Available Travel Companions:</h4>
            {matches.map((match) => {
              const matchUser = getUserById(match.request.userId)
              const compatibilityScore = Math.round((match.score / 100) * 100)

              return (
                <div key={match.request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {matchUser?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{matchUser?.name}</p>
                        <p className="text-sm text-primary font-medium">@{matchUser?.username}</p>
                        <p className="text-xs text-muted-foreground">{matchUser?.vitRegistrationNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Match</span>
                        <Badge
                          variant={
                            compatibilityScore >= 80 ? "default" : compatibilityScore >= 60 ? "secondary" : "outline"
                          }
                        >
                          {compatibilityScore}%
                        </Badge>
                      </div>
                      <Progress value={compatibilityScore} className="w-20 h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formatRoute(match.request.route)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {match.request.date} at {match.request.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{match.request.vehicleType === "auto" ? "Auto" : "Cab"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{match.request.groupSize} people</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {match.reasons.map((reason: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>

                  <Button size="sm" onClick={() => handleSendDirectRequest(match.request.userId)} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Travel Request to @{matchUser?.username}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
