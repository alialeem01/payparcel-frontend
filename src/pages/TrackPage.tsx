import { Link, useSearchParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import TrackForm from '../components/TrackForm'

export default function TrackPage() {
  const [searchParams] = useSearchParams()

  return (
    <div className="track-page">
      <div className="track-container">
        <h1><PackageSearch size={32} /> Track Your Order</h1>
        <p>Enter your tracking ID below to see the latest delivery status.</p>

        <TrackForm initialTrackingId={searchParams.get('t') ?? ''} />

        <p className="track-back"><Link to="/">← Back to home</Link></p>
      </div>
    </div>
  )
}
