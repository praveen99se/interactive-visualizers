export default function ComparisonTab() {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0', marginBottom: '6px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', border: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ minWidth: '130px', background: 'var(--color-background-secondary)', padding: '8px 10px', fontSize: '12px', fontWeight: '500', borderRight: '0.5px solid var(--color-border-tertiary)' }}></div>
        <div style={{ flex: 1, background: '#eff6ff', padding: '8px 10px', fontSize: '12px', fontWeight: '500', color: '#1d4ed8', borderRight: '0.5px solid var(--color-border-tertiary)' }}>🍪 ALB Stickiness</div>
        <div style={{ flex: 1, background: '#f0fdf4', padding: '8px 10px', fontSize: '12px', fontWeight: '500', color: '#15803d' }}>⚡ NLB Stickiness</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Mechanism</div>
        <div className="vs-alb">Cookie (AWSALB or custom)</div>
        <div className="vs-nlb">Flow Hash (5-tuple)</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Sticky scope</div>
        <div className="vs-alb">Per user/browser session</div>
        <div className="vs-nlb">Per TCP connection</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Duration control</div>
        <div className="vs-alb">✅ 1s – 7 days (configurable)</div>
        <div className="vs-nlb">⚠️ Per connection (or 1min–7days with source_ip TG stickiness)</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Works across connections</div>
        <div className="vs-alb">✅ Yes — cookie persists</div>
        <div className="vs-nlb">❌ No — new conn = new hash</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Client needs cookies</div>
        <div className="vs-alb">✅ Yes (browser auto-handles)</div>
        <div className="vs-nlb">❌ No — transparent to client</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Unhealthy target</div>
        <div className="vs-alb">Cookie ignored → new target</div>
        <div className="vs-nlb">Re-hashed → new target</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Use case</div>
        <div className="vs-alb">Shopping carts, login sessions, stateful web apps</div>
        <div className="vs-nlb">Gaming, DB connections, long-lived TCP streams</div>
      </div>

      <div className="vs-row">
        <div className="vs-label">Axios / HTTP apps</div>
        <div className="vs-alb">✅ Works perfectly</div>
        <div className="vs-nlb">⚠️ Limited — new XHR = new connection</div>
      </div>
    </div>
  );
}
