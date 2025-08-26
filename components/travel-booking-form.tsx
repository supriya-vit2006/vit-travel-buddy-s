"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, Car } from "lucide-react"
import { saveTravelRequest, generateId, getUserActiveGroupForDate } from "@/lib/storage"
import type { TravelRequest, User } from "@/lib/types"

interface TravelBookingFormProps {
  user: User
  onRequestCreated: () => void
}

export function TravelBookingForm({ user, onRequestCreated }: TravelBookingFormProps) {
  const [formData, setFormData] = useState({
    route: "" as TravelRequest["route"] | "",
    date: "",
    time: "",
    vehicleType: "" as TravelRequest["vehicleType"] | "",
    groupSize: "" as string,
    genderPreference: "" as TravelRequest["genderPreference"] | "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (formData.date) {
      const activeGroupForDate = getUserActiveGroupForDate(user.id, formData.date)
      if (activeGroupForDate) {
        setError("You already have a travel group for this date. You can only be in one group per date.")
        setIsSubmitting(false)
        return
      }
    }

    // Validation
    if (
      !formData.route ||
      !formData.date ||
      !formData.time ||
      !formData.vehicleType ||
      !formData.groupSize ||
      !formData.genderPreference
    ) {
      setError("Please fill in all fields")
      setIsSubmitting(false)
      return
    }

    // Check if date/time is in the future
    const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
    const now = new Date()
    if (selectedDateTime <= now) {
      setError("Please select a future date and time")
      setIsSubmitting(false)
      return
    }

    // Check waiting time constraints based on route
    const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const isAirportRoute = formData.route.includes("chennai")
    const minHours = isAirportRoute ? 4 : 2

    if (hoursDiff < minHours) {
      setError(
        `For ${isAirportRoute ? "airport" : "Katpadi"} routes, please book at least ${minHours} hours in advance`,
      )
      setIsSubmitting(false)
      return
    }

    try {
      const newRequest: TravelRequest = {
        id: generateId(),
        userId: user.id,
        route: formData.route,
        date: formData.date,
        time: formData.time,
        vehicleType: formData.vehicleType,
        groupSize: Number.parseInt(formData.groupSize) as 2 | 3 | 4,
        genderPreference: formData.genderPreference,
        status: "active",
        createdAt: new Date().toISOString(),
      }

      saveTravelRequest(newRequest)
      onRequestCreated()

      // Reset form
      setFormData({
        route: "",
        date: "",
        time: "",
        vehicleType: "",
        groupSize: "",
        genderPreference: "",
      })
    } catch (err) {
      setError("Failed to create travel request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 2) // Minimum 2 hours from now
    return now.toISOString().slice(0, 16)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Create Travel Request
        </CardTitle>
        <CardDescription>Find travel companions for your journey</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Travel Route</Label>
            <RadioGroup
              value={formData.route}
              onValueChange={(value) => setFormData({ ...formData, route: value as TravelRequest["route"] })}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="vit-to-katpadi" id="vit-to-katpadi" />
                <Label htmlFor="vit-to-katpadi" className="flex-1 cursor-pointer">
                  <div className="font-medium">VIT to Katpadi</div>
                  <div className="text-sm text-muted-foreground">Railway Station</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="katpadi-to-vit" id="katpadi-to-vit" />
                <Label htmlFor="katpadi-to-vit" className="flex-1 cursor-pointer">
                  <div className="font-medium">Katpadi to VIT</div>
                  <div className="text-sm text-muted-foreground">Railway Station</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="vit-to-chennai" id="vit-to-chennai" />
                <Label htmlFor="vit-to-chennai" className="flex-1 cursor-pointer">
                  <div className="font-medium">VIT to Chennai</div>
                  <div className="text-sm text-muted-foreground">Airport</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="chennai-to-vit" id="chennai-to-vit" />
                <Label htmlFor="chennai-to-vit" className="flex-1 cursor-pointer">
                  <div className="font-medium">Chennai to VIT</div>
                  <div className="text-sm text-muted-foreground">Airport</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Travel Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Travel Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle Type
            </Label>
            <RadioGroup
              value={formData.vehicleType}
              onValueChange={(value) =>
                setFormData({ ...formData, vehicleType: value as TravelRequest["vehicleType"] })
              }
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="flex-1 cursor-pointer">
                  <div className="font-medium">Auto Rickshaw</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50">
                <RadioGroupItem value="cab" id="cab" />
                <Label htmlFor="cab" className="flex-1 cursor-pointer">
                  <div className="font-medium">Cab/Taxi</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Group Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupSize" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group Size
              </Label>
              <Select
                value={formData.groupSize}
                onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 People</SelectItem>
                  <SelectItem value="3">3 People</SelectItem>
                  <SelectItem value="4">4 People</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genderPreference">Gender Preference</Label>
              <Select
                value={formData.genderPreference}
                onValueChange={(value) =>
                  setFormData({ ...formData, genderPreference: value as TravelRequest["genderPreference"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys Only</SelectItem>
                  <SelectItem value="girls">Girls Only</SelectItem>
                  <SelectItem value="mixed">Mixed Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Request..." : "Create Travel Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
