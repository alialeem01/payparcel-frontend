import { Search } from 'lucide-react'
import TrackForm from '../components/TrackForm'

export default function DashboardTrackPage() {
  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Search size={28} /> Tracker</h1>
        <p>Track any parcel by entering its tracking number.</p>
      </div>

      <TrackForm />
    </div>
  )
}
