import { Component } from 'react';

/**
 * The whole app had no crash safety net — a single uncaught error anywhere
 * in the tree (a bad data shape, a bug in a new feature) unmounted
 * everything, leaving a blank/black screen with no way to recover short of
 * a manual refresh and no way to tell us what actually broke. This catches
 * that class of crash, shows a recoverable screen instead, and surfaces
 * the real error so it can be reported precisely instead of just "blank".
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Still there for whoever opens devtools, in addition to the on-screen message.
    console.error('Voyager crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 28, background: '#e9e4da', fontFamily: "'Public Sans', system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 10px', color: '#1c1b19' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#8a8377', margin: '0 0 18px' }}>
            Voyager hit an error it couldn't recover from. Your trip data is safe in the database — this is a
            display problem, not data loss. Reloading usually fixes it; if it keeps happening, send this to Rodolfo:
          </p>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12, textAlign: 'left', padding: '12px 14px',
              borderRadius: 12, background: '#fff', border: '1px solid rgba(28,27,25,.09)', color: '#a85628',
              marginBottom: 20, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </div>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
            {this.props.onBack && (
              <button
                type="button"
                onClick={() => { this.setState({ error: null }); this.props.onBack(); }}
                style={{
                  padding: '13px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 600, letterSpacing: '.02em', background: '#fff', color: '#1c1b19',
                  border: '1px solid rgba(28,27,25,.16)',
                }}
              >
                {this.props.backLabel || 'Go back'}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '13px 22px', borderRadius: 12, border: 0, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 600, letterSpacing: '.02em', background: '#c96f3f', color: '#faf8f4',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
