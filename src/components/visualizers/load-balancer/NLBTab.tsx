export default function NLBTab() {
  return (
    <div>
      <div className="info-banner">
        NLB stickiness = <strong>Flow Hash</strong>. No cookies. NLB hashes the connection's network properties
        → same hash always → same target. It's <strong>automatic and built-in</strong>.
      </div>

      <div className="grid2">
        <div>
          <div className="section-label">🔢 Flow Hash Formula</div>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500', marginBottom: '8px' }}>
              Hash( src_ip + src_port + dst_ip + dst_port + protocol )
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              <span style={{ color: '#1d4ed8' }}>src_ip</span> = Client's IP address<br />
              <span style={{ color: '#1d4ed8' }}>src_port</span> = Client's ephemeral port<br />
              <span style={{ color: '#0f766e' }}>dst_ip</span> = NLB's IP<br />
              <span style={{ color: '#0f766e' }}>dst_port</span> = Listener port (e.g. 443)<br />
              <span style={{ color: '#6d28d9' }}>protocol</span> = TCP / UDP<br /><br />
              <strong>Same 5-tuple = same hash = same target</strong>
            </div>
          </div>
        </div>

        <div>
          <div className="section-label">📋 NLB Stickiness Types</div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="badge badge-teal">Source IP (default)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              Uses full 5-tuple flow hash.<br />
              Sticky for the <strong>lifetime of the TCP connection</strong>.<br />
              New connection → re-hashed → may go to different target.<br />
              <span style={{ color: '#15803d' }}>✅ Best for stateful TCP apps.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
