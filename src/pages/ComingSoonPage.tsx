import type { LucideIcon } from 'lucide-react'
import { Clock } from 'lucide-react'

export default function ComingSoonPage({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Icon size={28} /> {title}</h1>
      </div>
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <Clock size={48} />
        </div>
        <h2>Coming Soon</h2>
        <p>We're working hard to bring you this feature. Check back soon!</p>
      </div>
    </div>
  )
}
