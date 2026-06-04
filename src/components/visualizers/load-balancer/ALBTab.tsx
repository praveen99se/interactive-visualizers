export default function ALBTab() {
  return (
    <div>
      <div className="info-banner">
        ALB stickiness = <strong>Cookie-based</strong>. ALB sets a cookie on the client's browser.
        Every subsequent request carries that cookie → ALB reads it → routes to the <strong>same target</strong>.
      </div>

      <div className="grid2">
        <div>
          <div className="section-label">🍪 Two Cookie Types</div>
          
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="badge badge-blue">LB-Generated Cookie</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              Cookie name: <strong>AWSALB</strong><br />
              Created & managed by ALB itself.<br />
              Value = encrypted target identifier.<br />
              Duration: 1 second → 7 days (you set it).<br />
              <span style={{ color: '#b45309' }}>⚠️ Cannot be customized.</span>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="badge badge-purple">App-Based Cookie</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              Cookie name: <strong>Custom</strong> (you define it, e.g. <code style={{ fontSize: '11px', background: 'var(--color-background-tertiary)', padding: '1px 3px', borderRadius: '3px' }}>MYSESSION</code>)<br />
              Your app sets the cookie value.<br />
              ALB reads it to determine target.<br />
              <span style={{ color: '#15803d' }}>✅ Full control over cookie content.</span>
            </div>
          </div>
        </div>

        <div>
          <div className="section-label">📋 How it works — Step by Step</div>
          <div className="row">
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-text-info)', color: '#fff', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
            <span><strong>First request</strong> — no cookie yet. ALB picks a target via Round Robin → sends to <strong>Server A</strong>.</span>
          </div>
          <div className="row">
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-text-info)', color: '#fff', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
            <span>ALB injects <strong>AWSALB=xyz123</strong> cookie into the response. Browser stores it.</span>
          </div>
          <div className="row">
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-text-info)', color: '#fff', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
            <span><strong>Next request</strong> — browser sends <code style={{ fontSize: '11px', background: 'var(--color-background-tertiary)', padding: '1px 3px', borderRadius: '3px' }}>Cookie: AWSALB=xyz123</code> automatically.</span>
          </div>
          <div className="row">
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-text-info)', color: '#fff', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>4</span>
            <span>ALB decrypts cookie → identifies <strong>Server A</strong> → routes there again. ✅ Sticky!</span>
          </div>
          <div className="row">
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#b91c1c', color: '#fff', fontSize: '10px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>!</span>
            <span>If Server A goes <strong>unhealthy</strong>, ALB ignores the cookie and picks a new healthy target, issuing a new cookie.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
