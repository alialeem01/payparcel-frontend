import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app tree:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="full-center" style={{ flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24 }}>
          <AlertTriangle size={40} />
          <h2>Something went wrong</h2>
          <p>Please refresh the page. If the problem continues, contact support.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      )
    }
    return this.props.children
  }
}
