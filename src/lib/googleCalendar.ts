export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'

interface Activite {
  id: string
  titre?: string | null
  date: Date
  duree?: number | null
  notes?: string | null
}

interface GoogleEventPayload {
  summary: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

export function buildEventPayload(activite: Activite): GoogleEventPayload {
  const startDate = new Date(activite.date)
  const durationMs = (activite.duree ?? 60) * 60 * 1000
  const endDate = new Date(startDate.getTime() + durationMs)

  return {
    summary: activite.titre ?? 'Rendez-vous',
    description: activite.notes ?? undefined,
    start: { dateTime: startDate.toISOString(), timeZone: 'Europe/Paris' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Europe/Paris' },
  }
}

export async function getAccessToken(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    })

    if (!user?.googleRefreshToken) return null

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) {
      console.error('[GoogleCalendar] Failed to refresh token:', await res.text())
      return null
    }

    const data = await res.json()
    return data.access_token ?? null
  } catch (err) {
    console.error('[GoogleCalendar] getAccessToken error:', err)
    return null
  }
}

export async function createGoogleEvent(
  userId: string,
  activite: Activite
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken(userId)
    if (!accessToken) return null

    const payload = buildEventPayload(activite)

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      console.error('[GoogleCalendar] createGoogleEvent failed:', await res.text())
      return null
    }

    const data = await res.json()
    return data.id ?? null
  } catch (err) {
    console.error('[GoogleCalendar] createGoogleEvent error:', err)
    return null
  }
}

export async function updateGoogleEvent(
  userId: string,
  googleEventId: string,
  activite: Activite
): Promise<void> {
  try {
    const accessToken = await getAccessToken(userId)
    if (!accessToken) return

    const payload = buildEventPayload(activite)

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      console.error('[GoogleCalendar] updateGoogleEvent failed:', await res.text())
    }
  } catch (err) {
    console.error('[GoogleCalendar] updateGoogleEvent error:', err)
  }
}

export async function deleteGoogleEvent(
  userId: string,
  googleEventId: string
): Promise<void> {
  try {
    const accessToken = await getAccessToken(userId)
    if (!accessToken) return

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!res.ok && res.status !== 410) {
      console.error('[GoogleCalendar] deleteGoogleEvent failed:', await res.text())
    }
  } catch (err) {
    console.error('[GoogleCalendar] deleteGoogleEvent error:', err)
  }
}
