"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  saveUser,
  getUserByEmail,
  canCreateAccount,
  generateId,
  cleanupExpiredRequests,
  initializeStorage,
} from "@/lib/storage"
import type { User } from "@/lib/types"
import { Car, UserIcon } from "lucide-react"
import { TravelBookingForm } from "@/components/travel-booking-form"
import { TravelRequestsList } from "@/components/travel-requests-list"
import { GroupRequestsManager } from "@/components/group-requests-manager"
import { SmartMatching } from "@/components/smart-matching"
import { GroupManagement } from "@/components/group-management"
import { GroupChat } from "@/components/group-chat"
import { UserProfile } from "@/components/user-profile"

export default function VITTravelBuddy() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeStorage()

    // Check for existing user session
    const user = getCurrentUser()
    setCurrentUserState(user)
    setIsLoading(false)

    // Cleanup expired requests on app load
    cleanupExpiredRequests()
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setCurrentUserState(user)
  }

  const handleLogout = () => {
    clearCurrentUser()
    setCurrentUserState(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading VIT Travel Buddy...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />
  }

  return <MainApp user={currentUser} onLogout={handleLogout} onUserUpdate={setCurrentUserState} />
}

function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: "",
    vitRegistrationNumber: "",
    phone: "",
    gender: "male" as "male" | "female",
  })
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLogin) {
      // Login logic
      const existingUser = getUserByEmail(formData.email)
      if (existingUser) {
        onLogin(existingUser)
      } else {
        setError("User not found. Please register first.")
      }
    } else {
      // Registration logic
      if (
        !formData.email ||
        !formData.name ||
        !formData.username ||
        !formData.vitRegistrationNumber ||
        !formData.phone
      ) {
        setError("Please fill in all fields.")
        return
      }

      if (!formData.username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
        setError("Username must be 3-20 characters long and contain only letters, numbers, and underscores.")
        return
      }

      if (!formData.vitRegistrationNumber.match(/^\d{2}[A-Z]{3}\d{4}$/)) {
        setError("Please enter a valid VIT registration number (e.g., 21BCE1234).")
        return
      }

      const accountCheck = canCreateAccount(formData.email, formData.vitRegistrationNumber, formData.username)
      if (!accountCheck.canCreate) {
        setError(accountCheck.error!)
        return
      }

      const newUser: User = {
        id: generateId(),
        email: formData.email,
        regNo: formData.vitRegistrationNumber, // Using regNo field name to match types
        name: formData.name,
        username: formData.username,
        phone: formData.phone,
        gender: formData.gender,
        createdAt: new Date().toISOString(),
      }

      saveUser(newUser)
      onLogin(newUser)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">VIT Travel Buddy</h1>
          </div>
          <CardDescription>Connect with fellow VIT students for shared travel</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <TabsContent value="login" className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@vitstudent.ac.in"
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    placeholder="unique_username"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@vitstudent.ac.in"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vitReg">VIT Registration Number</Label>
                  <Input
                    id="vitReg"
                    value={formData.vitRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, vitRegistrationNumber: e.target.value.toUpperCase() })}
                    placeholder="21BCE1234"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </TabsContent>

              {error && <div className="text-destructive text-sm">{error}</div>}

              <Button type="submit" className="w-full">
                {isLogin ? "Login" : "Register"}
              </Button>
            </form>
          </Tabs>

          {/* Moved footer attribution to MainApp component */}
        </CardContent>
      </Card>
    </div>
  )
}

function MainApp({
  user,
  onLogout,
  onUserUpdate,
}: { user: User; onLogout: () => void; onUserUpdate: (user: User) => void }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeChatGroup, setActiveChatGroup] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleRequestCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleGroupFormed = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleChatOpen = (groupId: string) => {
    setActiveChatGroup(groupId)
    setIsChatOpen(true)
  }

  const handleChatClose = () => {
    setIsChatOpen(false)
    setActiveChatGroup(null)
    // Refresh to update unread counts
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleProfileOpen = () => {
    setIsProfileOpen(true)
  }

  const handleProfileClose = () => {
    setIsProfileOpen(false)
    // Refresh to update any changes
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">VIT Travel Buddy</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleProfileOpen} className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.regNo}</p>
              </div>
            </Button>
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-2 xl:col-span-2">
            <TravelBookingForm user={user} onRequestCreated={handleRequestCreated} />
          </div>
          <div className="space-y-6">
            <GroupRequestsManager user={user} onGroupFormed={handleGroupFormed} />
            <SmartMatching user={user} refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-2 xl:col-span-2">
            <GroupManagement user={user} refreshTrigger={refreshTrigger} onChatOpen={handleChatOpen} />
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <TravelRequestsList user={user} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Created by Supriya R Patil
          <br />
          Int Msc Computational Statistics and Data Analysis
        </div>
      </footer>

      <GroupChat user={user} groupId={activeChatGroup} isOpen={isChatOpen} onClose={handleChatClose} />

      <UserProfile user={user} isOpen={isProfileOpen} onClose={handleProfileClose} onUserUpdate={onUserUpdate} />
    </div>
  )
}
