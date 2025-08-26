"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Edit, MapPin, Users, MessageCircle, Calendar, Car, Phone, Mail } from "lucide-react"
import { saveUser, getTravelRequestsByUser, getTravelGroupsByUser } from "@/lib/storage"
import type { User as UserType } from "@/lib/types"

interface UserProfileProps {
  user: UserType
  isOpen: boolean
  onClose: () => void
  onUserUpdate: (user: UserType) => void
}

export function UserProfile({ user, isOpen, onClose, onUserUpdate }: UserProfileProps) {
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone,
    email: user.email,
  })
  const [userStats, setUserStats] = useState({
    totalRequests: 0,
    activeGroups: 0,
    completedTrips: 0,
    totalMessages: 0,
    joinDate: "",
  })

  useEffect(() => {
    if (isOpen) {
      calculateUserStats()
      setFormData({
        name: user.name,
        phone: user.phone,
        email: user.email,
      })
    }
  }, [isOpen, user])

  const calculateUserStats = () => {
    const userRequests = getTravelRequestsByUser(user.id)
    const userGroups = getTravelGroupsByUser(user.id)
    const activeGroups = userGroups.filter((g) => g.status !== "completed")
    const completedGroups = userGroups.filter((g) => g.status === "completed")

    const totalMessages = userGroups.reduce((total, group) => {
      const userMessages = (group.chatMessages || []).filter((msg) => msg.userId === user.id)
      return total + userMessages.length
    }, 0)

    setUserStats({
      totalRequests: userRequests.length,
      activeGroups: activeGroups.length,
      completedTrips: completedGroups.length,
      totalMessages,
      joinDate: new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    })
  }

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
    }

    saveUser(updatedUser)
    onUserUpdate(updatedUser)
    setEditMode(false)
  }

  const handleCancelEdit = () => {
    setFormData({
      name: user.name,
      phone: user.phone,
      email: user.email,
    })
    setEditMode(false)
  }

  const getRecentActivity = () => {
    const userRequests = getTravelRequestsByUser(user.id)
    const userGroups = getTravelGroupsByUser(user.id)

    const activities = [
      ...userRequests.map((req) => ({
        type: "request",
        date: req.createdAt,
        description: `Created travel request for ${req.route.replace(/-/g, " → ")}`,
        status: req.status,
      })),
      ...userGroups.map((group) => ({
        type: "group",
        date: group.createdAt,
        description: `Joined travel group for ${group.route.replace(/-/g, " → ")}`,
        status: group.status,
      })),
    ]

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }

  const getTravelPreferences = () => {
    const userRequests = getTravelRequestsByUser(user.id)

    if (userRequests.length === 0) return null

    const routeCount = userRequests.reduce(
      (acc, req) => {
        acc[req.route] = (acc[req.route] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const vehicleCount = userRequests.reduce(
      (acc, req) => {
        acc[req.vehicleType] = (acc[req.vehicleType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const mostUsedRoute = Object.entries(routeCount).sort(([, a], [, b]) => b - a)[0]
    const preferredVehicle = Object.entries(vehicleCount).sort(([, a], [, b]) => b - a)[0]

    return {
      mostUsedRoute: mostUsedRoute ? mostUsedRoute[0] : null,
      preferredVehicle: preferredVehicle ? preferredVehicle[0] : null,
      totalTrips: userRequests.length,
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

  const recentActivity = getRecentActivity()
  const travelPreferences = getTravelPreferences()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
          <DialogDescription>Manage your profile and view your travel activity</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <Badge variant="outline">{user.vitRegistrationNumber}</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {userStats.joinDate}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Edit Profile
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Travel Requests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.activeGroups}</div>
                <div className="text-sm text-muted-foreground">Active Groups</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Car className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.completedTrips}</div>
                <div className="text-sm text-muted-foreground">Completed Trips</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{userStats.totalMessages}</div>
                <div className="text-sm text-muted-foreground">Messages Sent</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="preferences">Travel Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest travel requests and group activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground">Start by creating a travel request!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            {activity.type === "request" ? (
                              <MapPin className="h-4 w-4 text-primary" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge variant={activity.status === "active" ? "default" : "secondary"}>
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Travel Preferences</CardTitle>
                  <CardDescription>Your travel patterns and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  {!travelPreferences ? (
                    <div className="text-center py-8">
                      <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No travel data yet</p>
                      <p className="text-sm text-muted-foreground">
                        Create some travel requests to see your preferences!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Most Used Route</h4>
                        <p className="text-lg">{formatRoute(travelPreferences.mostUsedRoute!)}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Preferred Vehicle</h4>
                        <p className="text-lg">
                          {travelPreferences.preferredVehicle === "auto" ? "Auto Rickshaw" : "Cab/Taxi"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Gender Preference</h4>
                        <p className="text-lg">{user.gender === "male" ? "Male" : "Female"}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Total Requests</h4>
                        <p className="text-lg">{travelPreferences.totalTrips}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editMode} onOpenChange={setEditMode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
