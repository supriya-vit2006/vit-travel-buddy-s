import type { TravelRequest, User } from "./types"
import { getTravelRequests, getUsers, getTravelGroups, getUserActiveGroup } from "./storage"

export interface MatchingFilters {
  route?: string
  date?: string
  vehicleType?: string
  genderPreference?: string
  maxTimeDifference?: number // in minutes
}

export interface MatchScore {
  request: TravelRequest
  user: User
  score: number
  reasons: string[]
}

export function findMatchingRequests(userRequest: TravelRequest, filters?: MatchingFilters): MatchScore[] {
  const allRequests = getTravelRequests()
  const users = getUsers()
  const groups = getTravelGroups()
  const userMap = new Map(users.map((u) => [u.id, u]))

  // Filter out the user's own requests and inactive requests
  const candidateRequests = allRequests.filter((request) => {
    // Skip user's own requests and inactive requests
    if (request.userId === userRequest.userId || request.status !== "active") {
      return false
    }

    // Skip if the request owner is already in a group
    const requestOwnerGroup = getUserActiveGroup(request.userId)
    if (requestOwnerGroup) {
      return false
    }

    // Check if there's an existing group for this request that's full or confirmed
    const relatedGroup = groups.find((group) => group.members.includes(request.userId) && group.status !== "completed")

    if (relatedGroup) {
      // Hide if group is at max capacity
      if (relatedGroup.members.length >= request.groupSize) {
        return false
      }

      // Hide if all members have confirmed (even if less than max capacity)
      const allConfirmed = relatedGroup.members.every((memberId) => {
        const member = userMap.get(memberId)
        return member && relatedGroup.confirmedMembers?.includes(memberId)
      })

      if (allConfirmed && relatedGroup.members.length >= 2) {
        return false
      }
    }

    return true
  })

  const matches: MatchScore[] = []

  for (const request of candidateRequests) {
    const requestUser = userMap.get(request.userId)
    if (!requestUser) continue

    const score = calculateMatchScore(userRequest, request, requestUser)
    if (score.score > 0) {
      matches.push(score)
    }
  }

  // Sort by score (highest first)
  return matches.sort((a, b) => b.score - a.score)
}

function calculateMatchScore(
  userRequest: TravelRequest,
  candidateRequest: TravelRequest,
  candidateUser: User,
): MatchScore {
  let score = 0
  const reasons: string[] = []

  // Route match (essential)
  if (userRequest.route === candidateRequest.route) {
    score += 50
    reasons.push("Same route")
  } else {
    return { request: candidateRequest, user: candidateUser, score: 0, reasons: [] }
  }

  // Date match (essential)
  if (userRequest.date === candidateRequest.date) {
    score += 30
    reasons.push("Same date")
  } else {
    return { request: candidateRequest, user: candidateUser, score: 0, reasons: [] }
  }

  const userTime = new Date(`2000-01-01T${userRequest.time}`)
  const candidateTime = new Date(`2000-01-01T${candidateRequest.time}`)
  const timeDiffMinutes = Math.abs(userTime.getTime() - candidateTime.getTime()) / (1000 * 60)

  if (timeDiffMinutes <= 15) {
    score += 30 - Math.floor(timeDiffMinutes) // Higher score for closer times, max 15 minutes
    reasons.push(`Time difference: ${Math.floor(timeDiffMinutes)} minutes`)
  } else {
    return { request: candidateRequest, user: candidateUser, score: 0, reasons: [] }
  }

  // Vehicle type match
  if (userRequest.vehicleType === candidateRequest.vehicleType) {
    score += 15
    reasons.push("Same vehicle type")
  }

  // Group size compatibility
  if (userRequest.groupSize === candidateRequest.groupSize) {
    score += 10
    reasons.push("Same group size preference")
  }

  // Gender preference compatibility
  const genderCompatible = checkGenderCompatibility(
    userRequest.genderPreference,
    candidateRequest.genderPreference,
    userRequest.userId,
    candidateRequest.userId,
  )

  if (genderCompatible.compatible) {
    score += 10
    reasons.push(genderCompatible.reason)
  } else {
    return { request: candidateRequest, user: candidateUser, score: 0, reasons: [] }
  }

  return { request: candidateRequest, user: candidateUser, score, reasons }
}

function checkGenderCompatibility(
  userPreference: string,
  candidatePreference: string,
  userId: string,
  candidateUserId: string,
): { compatible: boolean; reason: string } {
  // If either prefers mixed, it's compatible
  if (userPreference === "mixed" || candidatePreference === "mixed") {
    return { compatible: true, reason: "Mixed group preference" }
  }

  // If both have the same gender preference, check actual genders
  if (userPreference === candidatePreference) {
    return { compatible: true, reason: `Both prefer ${userPreference} groups` }
  }

  return { compatible: false, reason: "Gender preference mismatch" }
}

export function getCompatibleGroupSize(request1: TravelRequest, request2: TravelRequest): number {
  return Math.min(request1.groupSize, request2.groupSize)
}

export function canMergeRequests(request1: TravelRequest, request2: TravelRequest): boolean {
  const match = calculateMatchScore(request1, request2, { id: "temp" } as User)
  return match.score > 70 // High threshold for automatic merging
}
