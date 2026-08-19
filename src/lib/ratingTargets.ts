import type { MyRating, RateTarget } from '../components/RatingPanel'
import type { CrewRow } from '../components/CrewAttendance'
import type { VendorCompany } from '../components/VendorStatus'

type BookingForRating = {
  vendor_company?: VendorCompany
  client_crew?: CrewRow[]
}

export function buildRateTargets(
  booking: BookingForRating,
  labels: { caterer: string; worker: string; nearbyWorker: string },
): RateTarget[] {
  const targets: RateTarget[] = []

  if (booking.vendor_company?.id) {
    targets.push({
      rateeId: booking.vendor_company.id,
      name: booking.vendor_company.name || labels.caterer,
      label: labels.caterer,
    })
  }

  for (const crew of booking.client_crew || []) {
    const workerId = crew.worker?.id
    if (!workerId) continue
    targets.push({
      rateeId: workerId,
      assignmentId: crew.id,
      name: crew.worker?.name || labels.nearbyWorker,
      label: labels.worker,
    })
  }

  return targets
}

export type { MyRating }
