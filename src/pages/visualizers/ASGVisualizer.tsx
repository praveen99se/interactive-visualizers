import { useState } from 'react';
import ASGTab from '../../components/visualizers/alb-nlb/ASGTab';

const sections = [
  { id: 'overview', label: '1) Concept' },
  { id: 'architecture', label: '2) Architecture' },
  { id: 'policies', label: '3) Scaling Policies' },
  { id: 'health', label: '4) Health & Lifecycle' },
  { id: 'sim', label: '5) Live Simulation' },
  { id: 'integrations', label: '6) ALB/NLB Integration' },
];

export default function ASGVisualizer() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <style>{`
        .wrap{padding:12px 16px}
        .nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .pill{border:0.5px solid var(--color-border-tertiary);border-radius:999px;padding:6px 10px;font-size:12px;color:var(--color-text-secondary);background:var(--color-background-primary);cursor:pointer}
        .pill.active{background:var(--color-text-info);border-color:var(--color-text-info);color:#fff}
        .sec{border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:12px 14px;background:var(--color-background-primary);margin-bottom:12px}
        .h{font-weight:500;font-size:14px;margin-bottom:6px}
        .sub{font-size:12px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:10px}
        .grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
        .card{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px}
        .lbl{font-size:11px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
        .row{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);background:var(--color-background-primary);margin-bottom:6px;font-size:13px;color:var(--color-text-secondary);line-height:1.5}
        .dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;color:#fff;font-weight:500;background:var(--color-text-info)}
        .badge{font-size:11px;font-weight:500;border-radius:999px;padding:2px 8px;display:inline-block}
        .binfo{background:#dbeafe;color:#1d4ed8}
        .bok{background:#dcfce7;color:#15803d}
        .bwarn{background:#fef3c7;color:#b45309}
        .bbad{background:#fee2e2;color:#b91c1c}
        .small{font-size:11px;color:var(--color-text-tertiary);line-height:1.6}
        .btn-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
        .button-secondary{font-size:12px;padding:6px 10px;border-radius:8px;border:0.5px solid var(--color-border-tertiary);background:var(--color-background-primary);cursor:pointer}
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 ASG Auto Scaling Group Visualizer</h1>
        <p className="text-gray-600">
          Explore how an Auto Scaling Group manages EC2 instances, health checks, and scaling behavior with a live interactive model.
        </p>
      </div>

      <div className="nav mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className={`pill ${activeSection === section.id ? 'active' : ''}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeSection === 'overview' && (
          <div className="sec" id="overview">
            <div className="h">Auto Scaling Group (ASG) — the “auto-expand / auto-shrink” pool of servers</div>
            <div className="sub">
              ASG maintains a desired number of EC2 instances between <span className="mono">min</span> and <span className="mono">max</span>. It replaces unhealthy instances and scales out/in based on CloudWatch metrics.
              A Load Balancer (ALB/NLB) sits in front so traffic is spread across whichever instances are currently in the group.
            </div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">What ASG manages</div>
                <div className="row"><div className="dot">A</div><div><b>Capacity</b>: min / desired / max</div></div>
                <div className="row"><div className="dot">B</div><div><b>Launch</b>: uses a Launch Template (AMI, instance type, security groups, user-data)</div></div>
                <div className="row"><div className="dot">C</div><div><b>Replace</b>: if instance fails health checks → terminate + launch a new one</div></div>
              </div>
              <div className="card">
                <div className="lbl">Why the Load Balancer matters</div>
                <div className="row"><div className="dot">1</div><div><b>Stable entrypoint</b>: one DNS name while instances come/go</div></div>
                <div className="row"><div className="dot">2</div><div><b>Health-based routing</b>: only send to healthy targets</div></div>
                <div className="row"><div className="dot">3</div><div><b>Scale signals</b>: ALB can emit metrics like “RequestCountPerTarget”</div></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'architecture' && (
          <div className="sec" id="architecture">
            <div className="h">Architecture (ASG + Load Balancer)</div>
            <div className="sub">Traffic flows through the Load Balancer; ASG adds/removes instances behind it. Health checks decide what receives traffic.</div>

            <svg width="100%" viewBox="0 0 680 360" role="img" aria-label="ASG with ALB integration diagram">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-tertiary)" />
                </marker>
              </defs>

              <g>
                <rect x="16" y="20" width="648" height="320" rx="18" fill="var(--color-background-secondary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
                <text x="32" y="44" fontSize="13" fontWeight="500" fill="var(--color-text-primary)">VPC</text>
                <text x="62" y="64" fontSize="11" fill="var(--color-text-tertiary)">Public subnets (LB) + Private subnets (EC2 in ASG)</text>
              </g>

              <g>
                <rect x="34" y="96" width="150" height="56" rx="10" fill="#dbeafe" stroke="#1d4ed8" strokeWidth="0.7" />
                <text x="109" y="118" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="500" fill="#1d4ed8">Users</text>
                <text x="109" y="138" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#1d4ed8">Browser / Axios</text>
              </g>

              <g>
                <rect x="238" y="92" width="200" height="64" rx="12" fill="#eff6ff" stroke="#2563eb" strokeWidth="0.7" />
                <text x="338" y="114" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="500" fill="#1d4ed8">ALB / NLB</text>
                <text x="338" y="136" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#1d4ed8">Listener → Target Group</text>
              </g>

              <path d="M 184 124 L 238 124" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.2" markerEnd="url(#arrow)" />

              <g>
                <rect x="470" y="80" width="176" height="252" rx="16" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
                <text x="558" y="102" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="var(--color-text-primary)">Auto Scaling Group</text>
                <text x="558" y="120" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="var(--color-text-tertiary)">min / desired / max</text>

                <rect x="490" y="136" width="136" height="44" rx="10" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.7" />
                <text x="558" y="158" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#15803d">EC2 Instance #1</text>

                <rect x="490" y="190" width="136" height="44" rx="10" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.7" />
                <text x="558" y="212" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#15803d">EC2 Instance #2</text>

                <rect x="490" y="244" width="136" height="44" rx="10" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.7" />
                <text x="558" y="266" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#15803d">EC2 Instance #3</text>

                <text x="558" y="308" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="var(--color-text-tertiary)">Scale out/in adds/removes boxes</text>
              </g>

              <path d="M 438 124 L 470 124" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.2" markerEnd="url(#arrow)" />

              <g>
                <rect x="238" y="190" width="200" height="56" rx="12" fill="#fef3c7" stroke="#b45309" strokeWidth="0.7" />
                <text x="338" y="212" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#92400e">CloudWatch Metrics</text>
                <text x="338" y="232" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#92400e">CPU, RPS/target, latency</text>
              </g>

              <path d="M 338 190 L 338 160" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.0" markerEnd="url(#arrow)" />
              <path d="M 438 218 L 470 218" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.0" markerEnd="url(#arrow)" />

              <g>
                <rect x="34" y="206" width="150" height="64" rx="12" fill="#ede9fe" stroke="#6d28d9" strokeWidth="0.7" />
                <text x="109" y="228" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#6d28d9">DNS (Route 53)</text>
                <text x="109" y="248" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#6d28d9">points to LB</text>
              </g>

              <path d="M 184 238 L 238 152" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.0" markerEnd="url(#arrow)" />
            </svg>

            <div className="small" style={{ marginTop: 8 }}>
              <span className="badge binfo">Key idea</span>
              ASG changes the <b>number of instances</b>; the Load Balancer changes the <b>routing</b> so users never notice instances coming/going.
            </div>
          </div>
        )}

        {activeSection === 'policies' && (
          <div className="sec" id="policies">
            <div className="h">Scaling policies (how ASG decides to add/remove instances)</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">Target Tracking (most common)</div>
                <div className="sub" style={{ margin: 0 }}>
                  “Keep average CPU around 50%” or “keep ALB RequestCountPerTarget around X”. ASG continuously adjusts desired capacity to hit the target.
                </div>
                <div className="small" style={{ marginTop: 8 }}>
                  <span className="badge bok">Good for</span> web traffic that changes gradually.
                </div>
              </div>
              <div className="card">
                <div className="lbl">Step Scaling</div>
                <div className="sub" style={{ margin: 0 }}>
                  If CPU &gt; 70% for 5 min → add 2 instances. If CPU &lt; 30% → remove 1. More manual, but very predictable.
                </div>
                <div className="small" style={{ marginTop: 8 }}>
                  <span className="badge bwarn">Good for</span> spiky traffic where you want explicit steps.
                </div>
              </div>
              <div className="card">
                <div className="lbl">Scheduled Scaling</div>
                <div className="sub" style={{ margin: 0 }}>
                  “Every weekday 9am–6pm set desired=10”. Uses known business patterns.
                </div>
              </div>
              <div className="card">
                <div className="lbl">Predictive Scaling</div>
                <div className="sub" style={{ margin: 0 }}>
                  Uses historical patterns to scale ahead of time. Often paired with Target Tracking.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'health' && (
          <div className="sec" id="health">
            <div className="h">Health checks + lifecycle (what happens when instances start/stop)</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">Two health signals</div>
                <div className="row"><div className="dot">1</div><div><b>EC2 status checks</b> (instance / system)</div></div>
                <div className="row"><div className="dot">2</div><div><b>ELB health checks</b> (ALB/NLB target group health)</div></div>
                <div className="small" style={{ marginTop: 6 }}>
                  <span className="badge binfo">Best practice</span> Set ASG health check type to include <b>ELB</b> so an instance that fails the target group is replaced.
                </div>
              </div>
              <div className="card">
                <div className="lbl">Lifecycle (simplified)</div>
                <div className="row"><div className="dot">A</div><div><b>Launching</b> → user-data runs → app boots</div></div>
                <div className="row"><div className="dot">B</div><div><b>Registering</b> → added to target group</div></div>
                <div className="row"><div className="dot">C</div><div><b>Healthy</b> → LB sends traffic</div></div>
                <div className="row"><div className="dot">D</div><div><b>Draining</b> → during scale-in, LB stops new requests, finishes in-flight (deregistration delay)</div></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'sim' && (
          <div className="sec" id="sim">
            <ASGTab />
          </div>
        )}

        {activeSection === 'integrations' && (
          <div className="sec" id="integrations">
            <div className="h">ALB/NLB integration details (what’s actually “wired” together)</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">What you attach</div>
                <div className="row"><div className="dot">1</div><div><b>ASG ↔ Target Group</b>: ASG registers/deregisters instances into the target group automatically.</div></div>
                <div className="row"><div className="dot">2</div><div><b>LB Listener ↔ Target Group</b>: listener rules forward traffic to that target group.</div></div>
                <div className="row"><div className="dot">3</div><div><b>Health checks</b>: target group health drives routing; ASG can also use it to replace instances.</div></div>
              </div>
              <div className="card">
                <div className="lbl">How scaling uses LB metrics</div>
                <div className="sub" style={{ margin: 0 }}>
                  With an ALB you can scale on: <span className="mono">RequestCountPerTarget</span>, response time, 4xx/5xx, etc. With an NLB you typically scale on CPU, network, or custom CloudWatch metrics from your app.
                </div>
                <div className="small" style={{ marginTop: 8 }}>
                  <span className="badge bwarn">Gotcha</span> If you use sticky sessions (ALB cookies), scale-in must drain properly or you’ll break user sessions.
                </div>
              </div>
            </div>

            <div className="btn-row">
              <button type="button" className="button-secondary">Terraform example ↗</button>
              <button type="button" className="button-secondary">Termination policies ↗</button>
              <button type="button" className="button-secondary">Scale on RPS/target ↗</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
