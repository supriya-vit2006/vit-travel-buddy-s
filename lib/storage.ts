import type { User, TravelRequest, TravelGroup, GroupRequest } from "./types"

const STORAGE_KEYS = {
  USERS: "vit_travel_users",
  TRAVEL_REQUESTS: "vit_travel_requests",
  TRAVEL_GROUPS: "vit_travel_groups",
  GROUP_REQUESTS: "vit_group_requests",
  CURRENT_USER: "vit_current_user",
} as const

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined"

// User management
export const saveUser = (user: User): void => {
  if (!isBrowser()) return

  const users = getUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)
  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === user.id) {
    setCurrentUser(user)
  }
}

export const getUsers = (): User[] => {
  if (!isBrowser()) return []

  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : []
}

export const getUserById = (id: string): User | null => {
  if (!isBrowser()) return null

  const users = getUsers()
  return users.find((u) => u.id === id) || null
}

export const getUserByEmail = (email: string): User | null => {
  if (!isBrowser()) return null

  const users = getUsers()
  return users.find((u) => u.email === email) || null
}

export const getUserByRegNo = (regNo: string): User | null => {
  if (!isBrowser()) return null

  const users = getUsers()
  return users.find((u) => u.regNo === regNo) || null
}

export const getUserByUsername = (username: string): User | null => {
  if (!isBrowser()) return null

  const users = getUsers()
  return users.find((u) => u.username === username) || null
}

export const isUsernameAvailable = (username: string): boolean => {
  if (!isBrowser()) return true

  return !getUserByUsername(username)
}

export const canCreateAccount = (
  email: string,
  regNo: string,
  username: string,
): { canCreate: boolean; error?: string } => {
  if (!isBrowser()) return { canCreate: true }

  if (getUserByEmail(email)) {
    return { canCreate: false, error: "An account with this email already exists" }
  }
  if (getUserByRegNo(regNo)) {
    return { canCreate: false, error: "An account with this registration number already exists" }
  }
  if (getUserByUsername(username)) {
    return { canCreate: false, error: "This username is already taken" }
  }
  return { canCreate: true }
}

// Current user session
export const setCurrentUser = (user: User): void => {
  if (!isBrowser()) return

  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
}

export const getCurrentUser = (): User | null => {
  if (!isBrowser()) return null

  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return data ? JSON.parse(data) : null
}

export const clearCurrentUser = (): void => {
  if (!isBrowser()) return

  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// Travel requests
export const saveTravelRequest = (request: TravelRequest): void => {
  if (!isBrowser()) return

  const requests = getTravelRequests()
  const existingIndex = requests.findIndex((r) => r.id === request.id)
  if (existingIndex >= 0) {
    requests[existingIndex] = request
  } else {
    requests.push(request)
  }
  localStorage.setItem(STORAGE_KEYS.TRAVEL_REQUESTS, JSON.stringify(requests))
}

export const getTravelRequests = (): TravelRequest[] => {
  if (!isBrowser()) return []

  const data = localStorage.getItem(STORAGE_KEYS.TRAVEL_REQUESTS)
  return data ? JSON.parse(data) : []
}

export const getTravelRequestsByUser = (userId: string): TravelRequest[] => {
  if (!isBrowser()) return []

  const requests = getTravelRequests()
  return requests.filter((r) => r.userId === userId)
}

// Travel groups
export const saveTravelGroup = (group: TravelGroup): void => {
  if (!isBrowser()) return

  const groups = getTravelGroups()
  const existingIndex = groups.findIndex((g) => g.id === group.id)
  if (existingIndex >= 0) {
    groups[existingIndex] = group
  } else {
    groups.push(group)
  }
  localStorage.setItem(STORAGE_KEYS.TRAVEL_GROUPS, JSON.stringify(groups))
}

export const getTravelGroups = (): TravelGroup[] => {
  if (!isBrowser()) return []

  const data = localStorage.getItem(STORAGE_KEYS.TRAVEL_GROUPS)
  return data ? JSON.parse(data) : []
}

export const getTravelGroupsByUser = (userId: string): TravelGroup[] => {
  if (!isBrowser()) return []

  const groups = getTravelGroups()
  return groups.filter((g) => g.members.includes(userId))
}

export const getUserActiveGroup = (userId: string): TravelGroup | null => {
  if (!isBrowser()) return null

  const groups = getTravelGroups()
  return groups.find((g) => g.members.includes(userId) && g.status !== "completed") || null
}

export const getUserActiveGroupForDate = (userId: string, date: string): TravelGroup | null => {
  if (!isBrowser()) return null

  const groups = getTravelGroups()
  return groups.find((g) => g.members.includes(userId) && g.status !== "completed" && g.date === date) || null
}

export const removeUserFromGroup = (userId: string, groupId: string): void => {
  if (!isBrowser()) return

  const groups = getTravelGroups()
  const groupIndex = groups.findIndex((g) => g.id === groupId)

  if (groupIndex >= 0) {
    const group = groups[groupIndex]
    group.members = group.members.filter((memberId) => memberId !== userId)

    if (group.members.length < 2) {
      groups.splice(groupIndex, 1)
    } else {
      groups[groupIndex] = group
    }

    localStorage.setItem(STORAGE_KEYS.TRAVEL_GROUPS, JSON.stringify(groups))
  }
}

export const deleteTravelGroup = (groupId: string): void => {
  if (!isBrowser()) return

  const groups = getTravelGroups()
  const filteredGroups = groups.filter((g) => g.id !== groupId)
  localStorage.setItem(STORAGE_KEYS.TRAVEL_GROUPS, JSON.stringify(filteredGroups))

  // Also remove any related group requests
  const requests = getGroupRequests()
  const filteredRequests = requests.filter((r) => r.groupId !== groupId)
  localStorage.setItem(STORAGE_KEYS.GROUP_REQUESTS, JSON.stringify(filteredRequests))
}

// Group requests
export const saveGroupRequest = (request: GroupRequest): void => {
  if (!isBrowser()) return

  const requests = getGroupRequests()
  const existingIndex = requests.findIndex((r) => r.id === request.id)
  if (existingIndex >= 0) {
    requests[existingIndex] = request
  } else {
    requests.push(request)
  }
  localStorage.setItem(STORAGE_KEYS.GROUP_REQUESTS, JSON.stringify(requests))
}

export const getGroupRequests = (): GroupRequest[] => {
  if (!isBrowser()) return []

  const data = localStorage.getItem(STORAGE_KEYS.GROUP_REQUESTS)
  return data ? JSON.parse(data) : []
}

export const getGroupRequestsForUser = (userId: string): GroupRequest[] => {
  if (!isBrowser()) return []

  const requests = getGroupRequests()
  return requests.filter((r) => r.toUserId === userId && r.status === "pending")
}

export const getGroupRequestsByUser = (userId: string): GroupRequest[] => {
  if (!isBrowser()) return []

  const requests = getGroupRequests()
  return requests.filter((r) => r.fromUserId === userId)
}

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const cleanupExpiredRequests = (): void => {
  if (!isBrowser()) return

  const requests = getTravelRequests()
  const now = new Date()
  const validRequests = requests.filter((request) => {
    const requestDate = new Date(request.date + " " + request.time)
    const hoursDiff = (requestDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDiff > -2 // Keep requests that are less than 2 hours past
  })
  localStorage.setItem(STORAGE_KEYS.TRAVEL_REQUESTS, JSON.stringify(validRequests))
}

export const cleanupOldGroups = (): void => {
  if (!isBrowser()) return

  const groups = getTravelGroups()
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const validGroups = groups.filter((group) => {
    const groupDate = new Date(group.date)
    return groupDate >= twoDaysAgo
  })

  localStorage.setItem(STORAGE_KEYS.TRAVEL_GROUPS, JSON.stringify(validGroups))
}

export const initializeStorage = (): void => {
  if (!isBrowser()) return

  cleanupExpiredRequests()
  cleanupOldGroups()
}

export const clearAllData = (): void => {
  if (!isBrowser()) return

  localStorage.removeItem(STORAGE_KEYS.TRAVEL_GROUPS)
  localStorage.removeItem(STORAGE_KEYS.GROUP_REQUESTS)
  localStorage.removeItem(STORAGE_KEYS.TRAVEL_REQUESTS)
}
