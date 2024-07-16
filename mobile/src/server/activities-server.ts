import { api } from "./api"

type Activity = {
  id: string
  occurs_at: string
  title: string
}

type ActivityCreate = Omit<Activity, "id"> & {
  tripId: string
}

type ActivityResponse = {
  activities: {
    date: string
    activities: Activity[]
  }[]
}

async function create({ tripId, occurs_at, title }: ActivityCreate) {
  try {
    console.log('create', { tripId, occurs_at, title })
    const { data } = await api.post<{ activityId: string }>(
      `/trips/${tripId}/activities`,
      { occurs_at, title }
    )

    return data
  } catch (error) {
    throw error
  }
}

async function getActivitiesByTripId(tripId: string) {
  try {
    const { data } = await api.get<Activity[]>(
      `/trips/${tripId}/activities`
    )

    return data
  } catch (error) {
    throw error
  }
}

export const activitiesServer = { create, getActivitiesByTripId }