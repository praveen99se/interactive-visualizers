import { useRef, useState } from 'react';

type ClientId = 'alice' | 'bob' | 'carol';
type Mode = 'alb-sticky' | 'alb-normal' | 'nlb';

const clients: { id: ClientId; label: string; ip: string }[] = [
  { id: 'alice', label: '👩 Alice', ip: '203.0.113.10' },
  { id: 'bob', label: '👨 Bob', ip: '198.51.100.42' },
  { id: 'carol', label: '👩‍💻 Carol', ip: '192.0.2.77' },
];

const servers = ['A', 'B', 'C'] as const;

const getNlbServerForClient = (client: ClientId) => {
  const map: Record<ClientId, string> = {
    alice: 'A',
    bob: 'B',
    carol: 'C',
  };
  return map[client];
};

const generateCookie = () => 'AWSALB=' + Math.random().toString(36).substring(2, 8).toUpperCase();

export default function SimulationTab() {
  const [mode, setMode] = useState<Mode>('alb-sticky');
  const [stickyMap, setStickyMap] = useState<Partial<Record<ClientId, string>>>({});
  const [cookieMap, setCookieMap] = useState<Partial<Record<ClientId, string>>>({});
  const [reqCount, setReqCount] = useState<Record<ClientId, number>>({ alice: 0, bob: 0, carol: 0 });
  const [rrIndex, setRrIndex] = useState(0);
  const [activeClient, setActiveClient] = useState<ClientId | null>(null);
  const [litServer, setLitServer] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['Click a client to send a request...']);
  const timeoutRef = useRef<number | null>(null);

  const resetSim = () => {
    setStickyMap({});
    setCookieMap({});
    setReqCount({ alice: 0, bob: 0, carol: 0 });
    setRrIndex(0);
    setActiveClient(null);
    setLitServer(null);
    setLogs(['Click a client to send a request...']);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const lightServer = (server: string) => {
    setLitServer(server);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setLitServer(null);
      timeoutRef.current = null;
    }, 900);
  };

  const sendRequest = (client: ClientId) => {
    setActiveClient(client);
    setReqCount((prev) => ({ ...prev, [client]: prev[client] + 1 }));

    let target = 'A';
    let message = '';

    if (mode === 'alb-sticky') {
      if (stickyMap[client]) {
        target = stickyMap[client];
        message = `🍪 ${client} has cookie ${cookieMap[client]} → pinned to Server ${target}`;
      } else {
        target = servers[rrIndex % servers.length];
        const cookie = generateCookie();
        setStickyMap((prev) => ({ ...prev, [client]: target }));
        setCookieMap((prev) => ({ ...prev, [client]: cookie }));
        setRrIndex((prev) => prev + 1);
        message = `🆕 ${client} first request → Server ${target} (Round Robin). Cookie set: ${cookie}`;
      }
    } else if (mode === 'alb-normal') {
      target = servers[rrIndex % servers.length];
      setRrIndex((prev) => prev + 1);
      message = `⚖️ ${client} request #${reqCount[client] + 1} → Server ${target} (Round Robin, no stickiness)`;
    } else {
      target = getNlbServerForClient(client);
      message = `🔢 ${client} (IP ${clients.find((c) => c.id === client)?.ip}) → Flow Hash → Server ${target} (deterministic, no cookies)`;
    }

    lightServer(target);
    setLogs((prev) => [`${new Date().toLocaleTimeString()} — ${message}`, ...prev]);
  };

  const getClientStatus = (client: ClientId) => {
    if (mode === 'alb-sticky' && cookieMap[client]) {
      return cookieMap[client] + ` → Server ${stickyMap[client]}`;
    }

    if (mode === 'nlb') {
      return 'No cookie — hash-based';
    }

    return 'Ready to send request';
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Mode:</span>
        <button
          onClick={() => setMode('alb-sticky')}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '0.5px solid var(--color-border-tertiary)',
            cursor: 'pointer',
            background: mode === 'alb-sticky' ? '#dbeafe' : '',
            color: mode === 'alb-sticky' ? '#1d4ed8' : '',
          }}
        >
          🍪 ALB Sticky
        </button>
        <button
          onClick={() => setMode('alb-normal')}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '0.5px solid var(--color-border-tertiary)',
            cursor: 'pointer',
            background: mode === 'alb-normal' ? '#dbeafe' : '',
            color: mode === 'alb-normal' ? '#1d4ed8' : '',
          }}
        >
          ⚖️ ALB Round Robin
        </button>
        <button
          onClick={() => setMode('nlb')}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '0.5px solid var(--color-border-tertiary)',
            cursor: 'pointer',
            background: mode === 'nlb' ? '#dbeafe' : '',
            color: mode === 'nlb' ? '#1d4ed8' : '',
          }}
        >
          ⚡ NLB Flow Hash
        </button>
        <button
          onClick={resetSim}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '0.5px solid var(--color-border-tertiary)',
            cursor: 'pointer',
            background: '#f8fafc',
            color: 'var(--color-text-secondary)',
          }}
        >
          🔄 Reset
        </button>
      </div>

      <div className="grid2">
        <div>
          <div className="section-label">👤 Clients</div>
          <p className="text-sm text-gray-600">Click a client card to send a request to the load balancer</p>
          <div style={{ marginTop: '10px' }}>
            {clients.map((client) => (
              <div
                key={client.id}
                className={`sim-client ${activeClient === client.id ? 'selected' : ''}`}
                style={{ background: 'var(--color-background-secondary)', cursor: 'pointer' }}
                onClick={() => sendRequest(client.id)}
              >
                <div style={{ fontWeight: '500', fontSize: '13px' }}>
                  {client.label} <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>IP: {client.ip}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '3px' }}>
                  {getClientStatus(client.id)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">🖥 Servers</div>
          {servers.map((server) => (
            <div
              key={server}
              className={`server-box ${litServer === server ? 'lit' : ''}`}
              style={{ marginBottom: '6px' }}
            >
              🖥 Server {server}
            </div>
          ))}
          <div style={{ marginTop: '8px', background: 'var(--color-background-secondary)', borderRadius: '6px', padding: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', minHeight: '60px', lineHeight: '1.7', border: '0.5px solid var(--color-border-tertiary)' }}>
            {logs.map((entry, index) => (
              <div key={`${entry}-${index}`} style={{ marginBottom: index === logs.length - 1 ? '0' : '6px' }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
