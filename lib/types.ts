export interface User {
  id: string
  email: string
  vitRegistrationNumber: string
  name: string
  username: string
  phone: string
  gender: "male" | "female"
  createdAt: string
}

export interface TravelRequest {
  id: string
  userId: string
  route: "vit-to-katpadi" | "vit-to-chennai" | "katpadi-to-vit" | "chennai-to-vit"
  date: string
  time: string
  vehicleType: "auto" | "cab"
  groupSize: 2 | 3 | 4
  genderPreference: "boys" | "girls" | "mixed"
  status: "active" | "matched" | "expired"
  createdAt: string
}

export interface TravelGroup {
  id: string
  requestId: string
  members: string[] // user IDs
  route: string
  date: string
  time: string
  vehicleType: string
  status: "forming" | "confirmed" | "completed"
  chatMessages: ChatMessage[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: string
}

export interface GroupRequest {
  id: string
  fromUserId: string
  toUserId: string
  requestType: "join_group" | "direct_request"
  groupId?: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}
