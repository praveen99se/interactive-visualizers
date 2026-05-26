import { useState, useEffect } from 'react';

type TabType = 'sqs' | 'sns' | 'sns-vs-sqs' | 'fanout' | 'kinesis' | 'triple-comparison' | 'amazon-mq' | 'simulator';
type ScenarioType = 'asg_decoupling' | 'db_buffering' | 'visibility_timeout' | 'kinesis_throttling';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function IntegrationAndMessagingVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('sqs');

  // Simulator States
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('asg_decoupling');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [queueDepth, setQueueDepth] = useState<number>(0);
  const [consumerCount, setConsumerCount] = useState<number>(1);
  const [dbWritesCurrent, setDbWritesCurrent] = useState<number>(0);
  const [dbStatus, setDbStatus] = useState<'healthy' | 'overloaded' | 'buffered'>('healthy');
  const [doubleProcessingActive, setDoubleProcessingActive] = useState<boolean>(false);
  const [kinesisShards, setKinesisShards] = useState<number>(1);
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const [bandwidthLimit, setBandwidthLimit] = useState<number>(1200); // 1.2 MB/s
  const [activeBrokerStatus, setActiveBrokerStatus] = useState<'active' | 'failed'>('active');

  const [simLogs, setSimLogs] = useState<SimLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Integration & Messaging Simulator ready. Select a scenario and launch traffic.',
    }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSimLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev,
    ]);
  };

  // Visibility Timeout State
  const [visibilityTimeoutSec, setVisibilityTimeoutSec] = useState<number>(5);

  // Clean simulator intervals on tab swap
  useEffect(() => {
    setSimStep(0);
    setIsSimulating(false);
    setQueueDepth(0);
    setConsumerCount(1);
    setDbWritesCurrent(0);
    setDbStatus('healthy');
    setDoubleProcessingActive(false);
    setIsThrottled(false);
  }, [activeScenario, activeTab]);

  // Simulator core runner
  const handleStartSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);

    if (activeScenario === 'asg_decoupling') {
      setQueueDepth(0);
      setConsumerCount(1);
      addLog('Ingesting heavy peak-hour workloads (150 active checkout requests/sec)...', 'info');
      
      // Step 2: Queue depth shoots up
      setTimeout(() => {
        setSimStep(2);
        setQueueDepth(120);
        addLog('SQS queue absorbs burst. Queue depth: 120 messages. Web front-end decoupled successfully.', 'success');

        // Step 3: CloudWatch triggers Alarm -> ASG Scales Out
        setTimeout(() => {
          setSimStep(3);
          setConsumerCount(4);
          addLog('CloudWatch Alarm triggered: QueueDepth > 100. Auto Scaling Group provisions 3 additional EC2 consumers (Total: 4).', 'warning');

          // Step 4: Fleet drains queue
          setTimeout(() => {
            setSimStep(4);
            setQueueDepth(0);
            setIsSimulating(false);
            addLog('SUCCESS: High-concurrency consumer fleet drained queue down to 0. Auto Scaling scale-down cooldown engaged.', 'success');
          }, 1500);
        }, 1500);
      }, 1200);
    } 
    else if (activeScenario === 'db_buffering') {
      setQueueDepth(0);
      setDbWritesCurrent(0);
      setDbStatus('healthy');
      addLog('Triggering high-velocity batch file imports (500 database operations/sec)...', 'info');

      // Step 2: DB begins to overload
      setTimeout(() => {
        setSimStep(2);
        setDbStatus('overloaded');
        setDbWritesCurrent(250);
        addLog('CRITICAL WARNING: Database write I/O limits saturated. 100% direct writes would fail here with connection pool exhausts!', 'error');

        // Step 3: SQS steps in as buffer
        setTimeout(() => {
          setSimStep(3);
          setDbStatus('buffered');
          setQueueDepth(380);
          setDbWritesCurrent(80); // Controlled rate
          addLog('SQS database write buffer active. Storing burst messages in queue. Consumers writing to DB at safe throttling target of 80 ops/sec.', 'success');

          // Step 4: Buffer drains
          setTimeout(() => {
            setSimStep(4);
            setQueueDepth(0);
            setDbWritesCurrent(0);
            setDbStatus('healthy');
            setIsSimulating(false);
            addLog('SUCCESS: SQS buffer drained. Database health returned to Normal. Zero data packets lost.', 'success');
          }, 1800);
        }, 1500);
      }, 1200);
    }
    else if (activeScenario === 'visibility_timeout') {
      setDoubleProcessingActive(false);
      addLog(`Producer pushes unique Order Message ID: 88aa-99bb to standard SQS queue...`, 'info');

      // Step 2: Consumer A pulls message
      setTimeout(() => {
        setSimStep(2);
        addLog(`Consumer instance A polls message and starts slow task processing... (Visibility Timeout clock running: ${visibilityTimeoutSec}s)`, 'warning');

        // Step 3: Timeout expires, message returns to queue
        setTimeout(() => {
          setSimStep(3);
          setDoubleProcessingActive(true);
          addLog(`TIMEOUT EXPIRED! Consumer A took longer than ${visibilityTimeoutSec} seconds. SQS unlocks message back to queue visibility.`, 'error');

          // Step 4: Consumer B pulls same message
          setTimeout(() => {
            setSimStep(4);
            addLog(`DUPLICATE READ: Consumer instance B polls SQS and receives identical Order Message ID: 88aa-99bb. Both instances are now processing!`, 'error');
            setIsSimulating(false);
          }, 1500);
        }, visibilityTimeoutSec * 1000);
      }, 1200);
    }
    else if (activeScenario === 'kinesis_throttling') {
      setIsThrottled(false);
      addLog(`Initializing clickstream ingestion at user-defined rate: ${(bandwidthLimit / 1000).toFixed(1)} MB/sec...`, 'info');

      // Step 2: Stream capacity checks
      setTimeout(() => {
        setSimStep(2);
        const limitPerShard = 1000; // 1 MB/s limit per shard
        const actualLimit = kinesisShards * limitPerShard;

        if (bandwidthLimit > actualLimit) {
          setIsThrottled(true);
          addLog(`THROTTLING EXCEPTION: Throughput rate (${bandwidthLimit} KB/s) exceeds shard capacity (${actualLimit} KB/s)!`, 'error');
          addLog(`Kinesis throws error: 'ProvisionedThroughputExceededException' (Status Code 429). Clickstream data packets are failing.`, 'error');
          setIsSimulating(false);
        } else {
          addLog(`Ingestion successful. Ingest rate: ${bandwidthLimit} KB/s fits cleanly within shard capacity of ${actualLimit} KB/s.`, 'success');
          
          setTimeout(() => {
            setSimStep(3);
            setIsSimulating(false);
            addLog(`SUCCESS: Kinesis Data Stream successfully buffered and written to target Amazon S3 bucket via Firehose.`, 'success');
          }, 1500);
        }
      }, 1200);
    }
  };

  // Kinesis shard split action
  const handleSplitShard = () => {
    if (activeScenario !== 'kinesis_throttling' || isSimulating) return;
    setKinesisShards((prev) => prev + 1);
    setIsThrottled(false);
    addLog(`Shard Splitting Triggered: Partition key hashes divided. Allocation increased to: ${kinesisShards + 1} Shards (Max capacity: ${(kinesisShards + 1) * 1.0} MB/s).`, 'success');
  };

  // MQ active/standby broker failover
  const handleBrokerFailover = () => {
    if (activeBrokerStatus === 'active') {
      setActiveBrokerStatus('failed');
      addLog('CRITICAL: Primary Active MQ Broker instance in AZ-a crashed (Hardware Failure)!', 'error');
      addLog('Automatic Broker Failover triggered: Active network URL shifts to secondary DNS standby endpoint in AZ-b...', 'warning');
      setTimeout(() => {
        addLog('Active MQ replication promoting Standby node in AZ-b to Primary. Clients successfully reconnected inside 45s. Zero transaction loss.', 'success');
      }, 1000);
    } else {
      setActiveBrokerStatus('active');
      addLog('Primary Broker in AZ-a restored. Re-establishing active/standby active sync mirroring.', 'success');
    }
  };

  return (
    <div>
      <style>{`
        /* Scoped Integration & Messaging styling */
        .im-container { font-family: var(--font-sans, system-ui, sans-serif); color: var(--color-text-primary, #0f172a); }
        .im-h { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .im-sub { font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin-bottom: 14px; }
        .im-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .im-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 11px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .im-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .im-tb.im-on { background: #0ea5e9; color: #fff; border-color: #0ea5e9; font-weight: 500; }
        .im-card { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-lg, 12px); padding: 14px 16px; background: var(--color-background-primary, #ffffff); margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .im-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #475569); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
        .im-sec:first-child { margin-top: 0; }
        .im-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .im-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .im-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); background: var(--color-background-secondary, #f8fafc); margin-bottom: 6px; font-size: 12px; line-height: 1.45; }
        .im-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #fff; font-weight: 600; background: #0ea5e9; }
        .im-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        
        /* High contrast keywords colors */
        .im-hl-orange { background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .im-hl-purple { background-color: #f3e8ff; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .im-hl-blue { background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .im-hl-teal { background-color: #ccfbf1; color: #0f766e; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .im-hl-emerald { background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: 600; }

        /* Muted descriptions */
        .im-desc-mute { color: var(--color-text-secondary); font-size: 11px; font-style: italic; opacity: 0.9; font-weight: normal; background: none; padding: 0; }

        /* Simulator elements */
        .im-ctrl { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; }
        .im-ctrl label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #475569); margin-bottom: 6px; }
        .im-ctrl select, .im-ctrl input[type="range"] { width: 100%; padding: 6px; font-size: 12px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); border-radius: 4px; background: var(--color-background-primary, #ffffff); outline: none; }
        .im-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .im-btn { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-primary, #ffffff); color: var(--color-text-primary, #0f172a); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; }
        .im-btn:hover { background: var(--color-background-secondary, #f8fafc); }
        .im-btn.im-primary { background: #0ea5e9; border-color: #0ea5e9; color: #fff; }
        .im-btn.im-primary:hover { background: #0284c7; }
        .im-btn.im-danger { background: #ef4444; border-color: #ef4444; color: #fff; }
        .im-btn.im-danger:hover { background: #dc2626; }
        .im-btn.im-warning { background: #f59e0b; border-color: #f59e0b; color: #fff; }
        .im-btn.im-warning:hover { background: #d97706; }
        
        .im-log { background: #0f172a; border-radius: var(--border-radius-md, 8px); padding: 12px; font-size: 11px; color: #cbd5e1; line-height: 1.6; min-height: 120px; max-height: 200px; overflow-y: auto; margin-top: 12px; font-family: var(--font-mono, monospace); }
        .im-log-entry { margin-bottom: 6px; border-bottom: 0.5px dashed #334155; padding-bottom: 4px; }
        .im-log-entry:last-child { border: none; }

        .im-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .im-table th { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; text-align: left; font-weight: 600; }
        .im-table td { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; }
        .im-table tr:nth-child(even) { background: var(--color-background-secondary, #f8fafc); }
      `}</style>

      <div className="im-container">
        {/* Title Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="im-h">✉️ AWS Integration &amp; Messaging Visualizer</div>
          <div className="im-sub">
            Master decoupled, event-driven architectures inside AWS. Contrast the push/pull behaviors of SQS and SNS, trace the high-performance clickstream pipelines of Amazon Kinesis Shards, and explore managed open-source ActiveMQ/RabbitMQ enterprise brokers inside Amazon MQ.
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="im-tabs">
          <button className={`im-tb ${activeTab === 'sqs' ? 'im-on' : ''}`} onClick={() => setActiveTab('sqs')}>📤 SQS Queues</button>
          <button className={`im-tb ${activeTab === 'sns' ? 'im-on' : ''}`} onClick={() => setActiveTab('sns')}>📢 SNS Topics</button>
          <button className={`im-tb ${activeTab === 'sns-vs-sqs' ? 'im-on' : ''}`} onClick={() => setActiveTab('sns-vs-sqs')}>⚔️ SNS vs SQS</button>
          <button className={`im-tb ${activeTab === 'fanout' ? 'im-on' : ''}`} onClick={() => setActiveTab('fanout')}>🔀 SNS + SQS Fanout</button>
          <button className={`im-tb ${activeTab === 'kinesis' ? 'im-on' : ''}`} onClick={() => setActiveTab('kinesis')}>🌊 Kinesis Streams</button>
          <button className={`im-tb ${activeTab === 'triple-comparison' ? 'im-on' : ''}`} onClick={() => setActiveTab('triple-comparison')}>📊 SQS vs SNS vs Kinesis</button>
          <button className={`im-tb ${activeTab === 'amazon-mq' ? 'im-on' : ''}`} onClick={() => setActiveTab('amazon-mq')}>🐹 Amazon MQ</button>
          <button className={`im-tb ${activeTab === 'simulator' ? 'im-on' : ''}`} onClick={() => setActiveTab('simulator')}>🎮 Live Message Simulator</button>
        </div>

        {/* Tab 1: SQS Queues */}
        {activeTab === 'sqs' && (
          <div>
            <div className="im-sec">Simple Queue Service (SQS) Deep-Dive</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                SQS is a fully managed, message queue service enabling developers to decouple and scale distributed application tiers. Rather than executing blocking, synchronous HTTP calls, producers offload workloads asynchronously into durable SQS buffers, from which server fleets poll and process jobs at their own pace.
              </div>

              {/* SQS Theory Grid */}
              <div className="im-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Queue Mechanics &amp; Ingestion</div>
                  
                  <div className="im-row">
                    <div className="im-dot">1</div>
                    <div>
                      AWS manages <span className="im-hl-orange">Asynchronous Communication</span> <span className="im-desc-mute">(non-blocking transaction loops where producers push tasks into queues and immediately return to serve clients)</span> to maximize system concurrency. Which means front-end servers do not block waiting for slow database commits.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">2</div>
                    <div>
                      AWS handles <span className="im-hl-orange">Visibility Timeout</span> <span className="im-desc-mute">(a transient countdown clock—default 30s—which locks a polled message from being visible to other concurrent consumers)</span> to prevent dual execution. Which means if a consumer instance crashes mid-task, the message automatically reappears in the queue for alternative fleet pick up.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">3</div>
                    <div>
                      AWS supports <span className="im-hl-orange">Long Polling</span> <span className="im-desc-mute">(forcing the queue listener to wait up to 20s if the queue is empty before returning an empty network response)</span> to optimize billing. Which means client instances reduce idle network requests, saving up to 90% in API polling charges.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>FIFO Queues &amp; Buffering</div>

                  <div className="im-row">
                    <div className="im-dot">4</div>
                    <div>
                      AWS offers <span className="im-hl-orange">SQS FIFO Queues</span> <span className="im-desc-mute">(First-In-First-Out message delivery guaranteeing exact ordering and zero duplicate writes)</span> for transactional workflows. Which means transactions like bank deposits or retail inventory adjustments are processed once and in the exact sequence they were submitted.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">5</div>
                    <div>
                      AWS leverages <span className="im-hl-orange">Message Deduplication ID</span> <span className="im-desc-mute">(a unique token hash identifying identical payloads written inside a 5-minute deduplication window)</span> to discard duplicates. Which means retried network requests from clients do not generate duplicate database entries.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">6</div>
                    <div>
                      AWS uses <span className="im-hl-orange">Message Group ID</span> <span className="im-desc-mute">(a tagging variable that groups messages together, enforcing strict sequential ordering ONLY within that specific tag)</span> to enable parallel processing. Which means users A and B have their orders processed strictly in sequence, but user A and user B can be processed concurrently by distinct consumers!
                    </div>
                  </div>
                </div>
              </div>

              {/* SQS Buffer & Decoupling Architecture SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  SQS Decoupled Multi-Tier System with Database Write Buffering
                </div>

                <svg width="100%" viewBox="0 0 760 180" style={{ background: '#fffbeb', borderRadius: '6px', border: '0.5px solid #fde68a' }}>
                  <defs>
                    <marker id="arrow-sqs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c2410c" /></marker>
                  </defs>

                  {/* Web Tier (Producers) */}
                  <rect x="15" y="30" width="140" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="85" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">💻 Web Fleet (Producers)</text>
                  <rect x="25" y="60" width="120" height="20" rx="3" fill="#fff7ed" stroke="#ffedd5" />
                  <text x="85" y="72" textAnchor="middle" fontSize="7" fill="#c2410c">Order Placed: #1001</text>
                  <rect x="25" y="85" width="120" height="20" rx="3" fill="#fff7ed" stroke="#ffedd5" />
                  <text x="85" y="97" textAnchor="middle" fontSize="7" fill="#c2410c">Order Placed: #1002</text>
                  <text x="85" y="125" textAnchor="middle" fontSize="7" fill="#64748b" fontStyle="italic">Synchronous HTTP Free</text>

                  {/* SQS Queue Buffer */}
                  <rect x="250" y="30" width="220" height="110" rx="6" fill="#ffffff" stroke="#fde68a" strokeWidth="1.5" />
                  <text x="360" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#c2410c">📥 SQS Standard Queue Buffer</text>
                  
                  {/* Messages inside Queue */}
                  <g transform="translate(265, 60)">
                    <rect x="0" y="0" width="50" height="25" rx="3" fill="#ffedd5" stroke="#fdbb2d" />
                    <text x="25" y="15" textAnchor="middle" fontSize="7" fontWeight="700" fill="#c2410c">#1002</text>
                    <text x="25" y="22" textAnchor="middle" fontSize="5" fill="#ea580c">Visibility: OK</text>
                  </g>
                  <g transform="translate(325, 60)">
                    <rect x="0" y="0" width="60" height="25" rx="3" fill="#ffedd5" stroke="#ea580c" />
                    <text x="30" y="12" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ea580c">#1001</text>
                    <text x="30" y="21" textAnchor="middle" fontSize="5" fill="#dc2626" fontWeight="700">🔒 Visibility Lock</text>
                  </g>
                  <g transform="translate(395, 60)">
                    <rect x="0" y="0" width="60" height="25" rx="3" fill="#f1f5f9" stroke="#cbd5e1" />
                    <text x="30" y="15" textAnchor="middle" fontSize="7" fill="#475569">DLQ Retry</text>
                  </g>
                  
                  <text x="360" y="105" textAnchor="middle" fontSize="7" fill="#ea580c" fontWeight="600">Storage Period: Max 14 Days</text>
                  <text x="360" y="120" textAnchor="middle" fontSize="7" fill="#64748b">Polling Model: Long Polling Active</text>

                  {/* Worker Tier (Consumers) */}
                  <rect x="565" y="30" width="180" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="655" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">⚙️ Worker Fleet (Consumers)</text>
                  <rect x="575" y="60" width="160" height="30" rx="4" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="655" y="74" textAnchor="middle" fontSize="8" fontWeight="700" fill="#047857">EC2 instance: Worker-A</text>
                  <text x="655" y="84" textAnchor="middle" fontSize="6" fill="#065f46">Active Processing: #1001 (Locked)</text>
                  <text x="655" y="115" textAnchor="middle" fontSize="7" fill="#166534" fontWeight="600">Buffered DB Writes (Safe Target)</text>

                  {/* Path arrows */}
                  <path d="M 155 85 L 240 85" fill="none" stroke="#c2410c" strokeWidth="1.5" markerEnd="url(#arrow-sqs)" />
                  <text x="197" y="75" textAnchor="middle" fontSize="7" fill="#c2410c" fontWeight="700">1. SendMessage</text>

                  <path d="M 480 85 L 555 85" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arrow-sqs)" />
                  <text x="517" y="75" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="700">2. ReceiveMessage</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: SNS Topics */}
        {activeTab === 'sns' && (
          <div>
            <div className="im-sec">Simple Notification Service (SNS) Pub/Sub Event Hub</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                SNS is a fully managed event routing pub/sub engine built to handle high-throughput, push-based message distribution. Instead of listeners polling a queue for objects, publishers post events onto an SNS Topic, and the broker instantly pushes duplicated event payloads out to multiple configured subscribers (SQS, Lambda, SMS, Mobile Push, HTTPS endpoints).
              </div>

              <div className="im-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>Pub/Sub Event Ingestion</div>

                  <div className="im-row">
                    <div className="im-dot">1</div>
                    <div>
                      AWS manages <span className="im-hl-purple">Pub/Sub Broadcast</span> <span className="im-desc-mute">(push-model event distribution pushing payload copies to up to 12.5 million subscribers per topic concurrently)</span> for high decoupling. Which means a single transactional event triggers multiple downstream workflows immediately.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">2</div>
                    <div>
                      AWS implements <span className="im-hl-purple">Transient Ingest</span> <span className="im-desc-mute">(SNS has zero storage persistence—if subscriber endpoints are offline, delivery fails unless SQS queues or retry backoffs are integrated)</span> to speed up routing. Which means topics deliver messages within milliseconds without disk storage overhead.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>SNS Message Filtering</div>

                  <div className="im-row">
                    <div className="im-dot">3</div>
                    <div>
                      AWS provides <span className="im-hl-purple">SNS Message Filtering</span> <span className="im-desc-mute">(evaluation rules matching message metadata attributes to subscription profiles, letting SNS filter and route payloads server-side)</span> to reduce computing. Which means subscriber applications receive only the specific transaction types they care about, avoiding manual code parsing.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">4</div>
                    <div>
                      AWS supports <span className="im-hl-purple">SNS FIFO Topics</span> <span className="im-desc-mute">(strict sequential event ordering matched with strict SQS FIFO queue subscription channels)</span> to secure transactional flows. Which means fanout pipelines preserve strict FIFO ordering across diverse business endpoints.
                    </div>
                  </div>
                </div>
              </div>

              {/* SNS Filtering SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  SNS Topic Attribute Filtering and Multi-Protocol Ingestion Flow
                </div>

                <svg width="100%" viewBox="0 0 760 200" style={{ background: '#faf5ff', borderRadius: '6px', border: '0.5px solid #e9d5ff' }}>
                  <defs>
                    <marker id="arrow-sns" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                    <marker id="arrow-sns-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Publisher */}
                  <rect x="15" y="55" width="130" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="80" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">💡 Billing Service</text>
                  <rect x="25" y="85" width="110" height="30" rx="3" fill="#f5f3ff" stroke="#ddd6fe" />
                  <text x="80" y="97" textAnchor="middle" fontSize="6" fontWeight="700" fill="#6b21a8">Payload: Invoice #9022</text>
                  <text x="80" y="107" textAnchor="middle" fontSize="6" fill="#7c3aed">Header: region="us-east"</text>

                  {/* SNS Topic Event Hub */}
                  <rect x="240" y="45" width="180" height="110" rx="6" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
                  <text x="330" y="62" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6b21a8">📢 SNS Topic (Event Hub)</text>
                  <circle cx="330" cy="105" r="22" fill="#faf5ff" stroke="#a78bfa" strokeWidth="2" />
                  <text x="330" y="108" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7c3aed">BROADCAST</text>
                  <text x="330" y="142" textAnchor="middle" fontSize="6" fill="#64748b">Instant Push Delivery semantics</text>

                  {/* Subscribers with Filtering */}
                  {/* Subscriber 1: SQS US */}
                  <g transform="translate(520, 15)">
                    <rect x="0" y="0" width="220" height="50" rx="4" fill="#ffffff" stroke="#86efac" />
                    <text x="10" y="16" textAnchor="start" fontSize="8" fontWeight="700" fill="#166534">📥 SQS Queue: US Shipping</text>
                    <text x="10" y="30" textAnchor="start" fontSize="6" fill="#047857">Filter Rule: region == "us-east"</text>
                    <rect x="150" y="15" width="60" height="20" rx="3" fill="#d1fae5" stroke="#86efac" />
                    <text x="180" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#065f46">MATCH MATCH</text>
                  </g>

                  {/* Subscriber 2: SQS EU */}
                  <g transform="translate(520, 75)">
                    <rect x="0" y="0" width="220" height="50" rx="4" fill="#ffffff" stroke="#fca5a5" />
                    <text x="10" y="16" textAnchor="start" fontSize="8" fontWeight="700" fill="#991b1b">📥 SQS Queue: EU Shipping</text>
                    <text x="10" y="30" textAnchor="start" fontSize="6" fill="#b91c1c">Filter Rule: region == "eu-west"</text>
                    <rect x="150" y="15" width="60" height="20" rx="3" fill="#fee2e2" stroke="#fca5a5" />
                    <text x="180" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#991b1b">🚫 DROP BLOCK</text>
                  </g>

                  {/* Subscriber 3: Email alerts */}
                  <g transform="translate(520, 135)">
                    <rect x="0" y="0" width="220" height="50" rx="4" fill="#ffffff" stroke="#bae6fd" />
                    <text x="10" y="16" textAnchor="start" fontSize="8" fontWeight="700" fill="#0369a1">📧 Client Email Subscriber</text>
                    <text x="10" y="30" textAnchor="start" fontSize="6" fill="#0284c7">Filter Rule: (None - Receive All)</text>
                    <rect x="150" y="15" width="60" height="20" rx="3" fill="#e0f2fe" stroke="#bae6fd" />
                    <text x="180" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="#0369a1">AUTO SEND</text>
                  </g>

                  {/* Paths */}
                  <path d="M 150 100 L 230 100" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <text x="190" y="90" textAnchor="middle" fontSize="7" fill="#7c3aed" fontWeight="700">Publish</text>

                  <path d="M 430 85 L 510 40" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 430 100 L 510 100" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow-sns-red)" strokeDasharray="3,2" />
                  <path d="M 430 115 L 510 160" fill="none" stroke="#0ea5e9" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: SNS vs SQS */}
        {activeTab === 'sns-vs-sqs' && (
          <div>
            <div className="im-sec">Paradigms Differentiated: Simple Notification (SNS) vs Simple Queue (SQS)</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Choosing between SNS and SQS is a matter of understanding event processing patterns. SQS represents a <b>Pull-based Queue</b> designed to buffer transactional tasks for a single processing consumer, ensuring job durability. SNS represents a <b>Push-based Broadcast Hub</b> designed to copy and blast notifications immediately to multiple downstream systems concurrently.
              </div>

              {/* Side by side comparison table */}
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table className="im-table">
                  <thead>
                    <tr>
                      <th>Architectural Spec</th>
                      <th>📢 Amazon SNS (Simple Notification Service)</th>
                      <th>📥 Amazon SQS (Simple Queue Service)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Core Paradigm</strong></td>
                      <td><span className="im-hl-purple">Push Model</span> (Publisher pushes event; SNS actively broadcasts to endpoints)</td>
                      <td><span className="im-hl-orange">Pull Model</span> (Producers queue events; consumers actively poll to pull jobs)</td>
                    </tr>
                    <tr>
                      <td><strong>Receivers per Message</strong></td>
                      <td><span className="im-hl-purple">One-to-Many Fanout</span> (All subscribed listeners receive identical copy)</td>
                      <td><span className="im-hl-orange">One-to-One Delivery</span> (Only one consumer processes a message at a time)</td>
                    </tr>
                    <tr>
                      <td><strong>Data Persistence</strong></td>
                      <td><span className="im-hl-purple">Zero Storage (Transient)</span> (Message is lost if no subscribers are active)</td>
                      <td><span className="im-hl-orange">High Durability (14 Days)</span> (Durable block storage retries failed attempts)</td>
                    </tr>
                    <tr>
                      <td><strong>Scaling trigger</strong></td>
                      <td>Push throttling limits (High-scale HTTP webhook scaling)</td>
                      <td>Queue Depth triggers (Scales consumer instances up or down)</td>
                    </tr>
                    <tr>
                      <td><strong>Ideal Use Case</strong></td>
                      <td>Microservice notification alerts, Webhooks, fanout architecture</td>
                      <td>Transactional background workloads, order buffering, application decoupling</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comparative SVG Flow Chart */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  How Messages Travel in Push vs Pull Configurations
                </div>

                <svg width="100%" viewBox="0 0 760 160" style={{ background: '#f8fafc', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  {/* SNS side */}
                  <text x="180" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7c3aed">📢 Push Model (SNS)</text>
                  <rect x="20" y="45" width="60" height="25" rx="3" fill="#f5f3ff" stroke="#ddd6fe" />
                  <text x="50" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill="#7c3aed">Publisher</text>

                  <rect x="130" y="40" width="70" height="35" rx="3" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
                  <text x="165" y="60" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7c3aed">SNS Topic</text>

                  <rect x="250" y="30" width="70" height="20" rx="3" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="285" y="42" textAnchor="middle" fontSize="7" fill="#1e40af">Subscriber 1</text>
                  <rect x="250" y="60" width="70" height="20" rx="3" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="285" y="72" textAnchor="middle" fontSize="7" fill="#1e40af">Subscriber 2</text>

                  {/* SNS arrows */}
                  <path d="M 85 57 L 122 57" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 205 52 L 242 42" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 205 62 L 242 70" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <text x="220" y="30" textAnchor="middle" fontSize="6" fill="#7c3aed" fontWeight="700">Push ⚡</text>

                  {/* Divider line */}
                  <line x1="375" y1="15" x2="375" y2="145" stroke="#cbd5e1" strokeDasharray="3,3" />

                  {/* SQS side */}
                  <text x="560" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ea580c">📥 Pull Model (SQS)</text>
                  <rect x="400" y="45" width="60" height="25" rx="3" fill="#fff7ed" stroke="#ffedd5" />
                  <text x="430" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill="#ea580c">Producer</text>

                  <rect x="500" y="40" width="80" height="35" rx="3" fill="#ffffff" stroke="#fdba74" strokeWidth="1.5" />
                  <text x="540" y="60" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ea580c">SQS Queue</text>

                  <rect x="630" y="45" width="100" height="40" rx="3" fill="#ecfdf5" stroke="#86efac" />
                  <text x="680" y="62" textAnchor="middle" fontSize="7" fontWeight="700" fill="#047857">EC2 Consumer Fleet</text>
                  <text x="680" y="74" textAnchor="middle" fontSize="6" fill="#065f46">Active Polling (Pull)</text>

                  {/* SQS arrows */}
                  <path d="M 465 57 L 492 57" fill="none" stroke="#ea580c" strokeWidth="1.5" markerEnd="url(#arrow-sqs)" />
                  <path d="M 625 65 L 590 65" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arrow-sqs)" />
                  <text x="608" y="55" textAnchor="middle" fontSize="6" fill="#047857" fontWeight="700">Poll (Pull) 🔄</text>

                  <text x="380" y="130" textAnchor="middle" fontSize="7" fill="#64748b" fontStyle="italic">Use SNS when you broadcast; Use SQS when you must buffer or process tasks individually.</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: SNS + SQS Fanout */}
        {activeTab === 'fanout' && (
          <div>
            <div className="im-sec">SNS + SQS Integration (Fanout Architecture) &amp; Firehose S3 Storage</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Combining SQS and SNS creates the classic <b>Fanout Pattern</b>: one event publisher pushes to an SNS topic, which fans out copies into multiple segregated SQS queues. This ensures each microservice handles its own isolated workload queue without data loss. We can pair **SNS FIFO with SQS FIFO** for transaction sequences, or route SNS straight to Amazon S3 via **Kinesis Data Firehose**.
              </div>

              <div className="im-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>FIFO Fanout &amp; Stream Ingestion</div>

                  <div className="im-row">
                    <div className="im-dot">1</div>
                    <div>
                      AWS coordinates <span className="im-hl-purple">SNS FIFO to SQS FIFO Fanout</span> <span className="im-desc-mute">(ordered pub/sub integration fanning out messages strictly into downstream SQS FIFO queues while preserving Sequence Numbers)</span> to guarantee transactional flow. Which means both your accounting ledger and shipping queues process steps in identical sequential sync.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">2</div>
                    <div>
                      AWS manages <span className="im-hl-purple">S3 Streaming via Kinesis Firehose</span> <span className="im-desc-mute">(direct routing pathways pushing SNS events into Kinesis Data Firehose to aggregate, convert, and store event archives in S3 buckets)</span> to enable database analytics.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Challenges &amp; Buffering Limits</div>

                  <div className="im-row">
                    <div className="im-dot">A</div>
                    <div>
                      AWS resolves <span className="im-hl-orange">Buffer Latency Constraints</span> <span className="im-desc-mute">(Kinesis Firehose collects packets until it hits the buffer window limits—minimum 60s or 1 MB buffer threshold)</span> by managing ingestion cycles automatically. Which means logs are aggregated in bulk before shipping, optimizing target S3 storage file structures.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">B</div>
                    <div>
                      AWS supports <span className="im-hl-orange">Data Format Transformation</span> <span className="im-desc-mute">(serverless Lambda filters integrated inside Firehose parsing JSON payloads into columnar Parquet/ORC tables dynamically)</span> to speed up analytics. Which means backend Athena queries run up to 90% faster.
                    </div>
                  </div>
                </div>
              </div>

              {/* Fanout & Firehose SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  Complete SQS Fanout and Kinesis Data Firehose S3 Analytical Archive Pipeline
                </div>

                <svg width="100%" viewBox="0 0 760 220" style={{ background: '#fff1f2', borderRadius: '6px', border: '0.5px solid #fecdd3' }}>
                  {/* Event Publisher */}
                  <rect x="15" y="65" width="115" height="70" rx="4" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="72" y="85" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">🏢 Checkout System</text>
                  <text x="72" y="100" textAnchor="middle" fontSize="7" fill="#6b21a8" fontWeight="600">Event: "Order_Placed"</text>
                  <text x="72" y="115" textAnchor="middle" fontSize="6" fill="#94a3b8">Payload: $120.00</text>

                  {/* SNS Topic Event Hub */}
                  <rect x="175" y="65" width="115" height="70" rx="6" fill="#ffffff" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="232" y="85" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c3aed">📢 SNS Topic</text>
                  <text x="232" y="100" textAnchor="middle" fontSize="6" fill="#6b21a8">order-events-topic</text>
                  <text x="232" y="115" textAnchor="middle" fontSize="6" fill="#94a3b8">Push Fanout Mode</text>

                  {/* SQS Fanout Queues */}
                  {/* Queue 1 */}
                  <rect x="360" y="20" width="150" height="40" rx="4" fill="#ffffff" stroke="#fdba74" />
                  <text x="435" y="36" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ea580c">📥 SQS Queue: Billing</text>
                  <text x="435" y="48" textAnchor="middle" fontSize="6" fill="#475569">Billing service polls asynchronously</text>

                  {/* Queue 2 */}
                  <rect x="360" y="80" width="150" height="40" rx="4" fill="#ffffff" stroke="#fdba74" />
                  <text x="435" y="96" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ea580c">📥 SQS Queue: Inventory</text>
                  <text x="435" y="108" textAnchor="middle" fontSize="6" fill="#475569">Warehouse inventory updates</text>

                  {/* Kinesis Firehose analytical pipeline */}
                  <rect x="360" y="140" width="150" height="60" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
                  <text x="435" y="156" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e40af">🌊 Kinesis Data Firehose</text>
                  <text x="435" y="170" textAnchor="middle" fontSize="6" fill="#2563eb">Aggregation Buffer: 60s / 1MB</text>
                  <rect x="368" y="180" width="134" height="14" rx="2" fill="#dbeafe" stroke="#93c5fd" />
                  <text x="435" y="190" textAnchor="middle" fontSize="6" fontWeight="700" fill="#1e40af">⚙️ Lambda format convert</text>

                  {/* Analytical Target S3 Bucket */}
                  <rect x="580" y="140" width="150" height="60" rx="6" fill="#ecfdf5" stroke="#6ee7b7" />
                  <text x="655" y="158" textAnchor="middle" fontSize="9" fontWeight="700" fill="#047857">🪣 Target Amazon S3</text>
                  <text x="655" y="174" textAnchor="middle" fontSize="6" fill="#065f46">JSON mapped to Parquet format</text>
                  <text x="655" y="188" textAnchor="middle" fontSize="7" fontWeight="700" fill="#047857">order_analytics/year=2026/</text>

                  {/* Routing Paths */}
                  <path d="M 130 100 L 170 100" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 290 90 L 352 40" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 290 100 L 352 100" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />
                  <path d="M 290 110 L 352 160" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-sns)" />

                  <path d="M 510 170 L 572 170" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#arrow-sns)" strokeDasharray="3,2" />
                  <text x="541" y="162" textAnchor="middle" fontSize="6" fill="#1e40af" fontWeight="700">Buffer Flush</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Kinesis Streams */}
        {activeTab === 'kinesis' && (
          <div>
            <div className="im-sec">Amazon Kinesis Real-Time Data Streams &amp; Firehose Delivery</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Kinesis handles real-time large-scale clickstream ingestion, processing hundreds of megabytes per second from thousands of telemetry devices. SQS queues act as transient task pools, whereas Kinesis provides high-performance persistent sequential shard streams that allow multiple consumers to replay identical data records repeatedly.
              </div>

              <div className="im-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0284c7' }}>Shard Streams &amp; Capacity Modes</div>

                  <div className="im-row">
                    <div className="im-dot">1</div>
                    <div>
                      AWS implements <span className="im-hl-blue">Kinesis Shards</span> <span className="im-desc-mute">(individual telemetry conduits providing strict ingestion thresholds: 1 MB/s write input or 1,000 records/sec limits per shard)</span> to guarantee predictable performance scaling. Which means clickstreams are partitioned systematically.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">2</div>
                    <div>
                      AWS manages <span className="im-hl-blue">Provisioned vs On-Demand</span> capacity modes. <span className="im-hl-blue">Provisioned Mode</span> <span className="im-desc-mute">(manually reserving shard volumes for fixed ingestion pipelines)</span> saves up to 50% in standard billing, while <span className="im-hl-blue">On-Demand Mode</span> <span className="im-desc-mute">(automated shard splitting adjusting scales to match variable peak limits)</span> eliminates manual oversight.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">3</div>
                    <div>
                      AWS provides <span className="im-hl-blue">KCL (Kinesis Client Library)</span> <span className="im-desc-mute">(a client-side engine tracking consumer instance balances and checkpointing processed shards in a DynamoDB state table)</span> to automate scaling. Which means consumer fleets scale dynamically without duplicate processing.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0284c7' }}>Streams vs Firehose</div>

                  <div className="im-row">
                    <div className="im-dot">A</div>
                    <div>
                      AWS operates <span className="im-hl-blue">Kinesis Data Streams</span> <span className="im-desc-mute">(highly customizable real-time clickstream ingestion engines with data persistence up to 365 days, built for custom application analysis)</span> for developers. Which means data scientists build custom models over the raw feed.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">B</div>
                    <div>
                      AWS operates <span className="im-hl-blue">Kinesis Data Firehose</span> <span className="im-desc-mute">(fully managed serverless target delivery flushing ingested streams straight to S3, Redshift, or OpenSearch without persistence)</span> to simplify storage. Which means you can easily create database backups with zero administrative code.
                    </div>
                  </div>
                </div>
              </div>

              {/* Shard Stream SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  Kinesis Data Streams Shard Architecture with Partition Key Routing
                </div>

                <svg width="100%" viewBox="0 0 760 180" style={{ background: '#f0f9ff', borderRadius: '6px', border: '0.5px solid #bae6fd' }}>
                  <defs>
                    <marker id="arrow-kinesis" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                  </defs>

                  {/* Clickstream Producers */}
                  <rect x="15" y="30" width="130" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="80" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">📱 Client Mobile Fleet</text>
                  <rect x="25" y="60" width="110" height="20" rx="3" fill="#e0f2fe" stroke="#bae6fd" />
                  <text x="80" y="72" textAnchor="middle" fontSize="6" fontWeight="700" fill="#0369a1">Click Event | PK=user_10</text>
                  <rect x="25" y="85" width="110" height="20" rx="3" fill="#e0f2fe" stroke="#bae6fd" />
                  <text x="80" y="97" textAnchor="middle" fontSize="6" fontWeight="700" fill="#0369a1">Click Event | PK=user_99</text>
                  <text x="80" y="125" textAnchor="middle" fontSize="7" fill="#64748b" fontStyle="italic">Thousands of active write threads</text>

                  {/* Kinesis Shard Stream */}
                  <rect x="230" y="30" width="260" height="110" rx="6" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.5" />
                  <text x="360" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0369a1">🌊 Amazon Kinesis Data Stream</text>
                  
                  {/* Shard 1 */}
                  <rect x="245" y="60" width="230" height="30" rx="3" fill="#f0f9ff" stroke="#93c5fd" />
                  <text x="255" y="78" textAnchor="start" fontSize="8" fontWeight="700" fill="#1e40af">Shard 1 (MD5 Hash 000-7FF)</text>
                  {/* Packets */}
                  <rect x="390" y="65" width="35" height="20" rx="2" fill="#dbeafe" stroke="#93c5fd" />
                  <text x="407" y="77" textAnchor="middle" fontSize="7" fill="#1e40af">PK=user_10</text>
                  <rect x="430" y="65" width="35" height="20" rx="2" fill="#dbeafe" stroke="#93c5fd" />
                  <text x="447" y="77" textAnchor="middle" fontSize="7" fill="#1e40af">PK=user_10</text>

                  {/* Shard 2 */}
                  <rect x="245" y="98" width="230" height="30" rx="3" fill="#f0f9ff" stroke="#93c5fd" />
                  <text x="255" y="116" textAnchor="start" fontSize="8" fontWeight="700" fill="#1e40af">Shard 2 (MD5 Hash 800-FFF)</text>
                  <rect x="410" y="103" width="35" height="20" rx="2" fill="#dbeafe" stroke="#93c5fd" />
                  <text x="427" y="115" textAnchor="middle" fontSize="7" fill="#1e40af">PK=user_99</text>

                  {/* Consumers (KCL) */}
                  <rect x="580" y="30" width="165" height="110" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="662" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">⚙️ Analytics Engine (KCL)</text>
                  <rect x="590" y="60" width="145" height="30" rx="4" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="662" y="74" textAnchor="middle" fontSize="7" fontWeight="700" fill="#047857">KCL Client A (Reads Shard 1)</text>
                  <rect x="590" y="96" width="145" height="30" rx="4" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="662" y="110" textAnchor="middle" fontSize="7" fontWeight="700" fill="#047857">KCL Client B (Reads Shard 2)</text>

                  {/* Paths */}
                  <path d="M 150 75 L 220 75" fill="none" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#arrow-kinesis)" />
                  <text x="185" y="67" textAnchor="middle" fontSize="6" fill="#0284c7" fontWeight="700">Partition Key Hash</text>

                  <path d="M 500 75 L 570 75" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arrow-kinesis)" />
                  <text x="535" y="67" textAnchor="middle" fontSize="6" fill="#047857" fontWeight="700">Dynamic Pull</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: SQS vs SNS vs Kinesis */}
        {activeTab === 'triple-comparison' && (
          <div>
            <div className="im-sec">Unified AWS Integration &amp; Messaging Comparison Matrix</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Choosing the correct messaging pattern is vital for system performance. Refer to this master comparison matrix to decide when to use **Simple Queue Service (SQS)**, **Simple Notification Service (SNS)**, or **Kinesis Streams** based on concurrency, persistence, and scaling.
              </div>

              {/* Master grid matching other high contrast components */}
              <div className="im-grid3">
                
                {/* SQS Card */}
                <div style={{ background: '#fffdf5', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📥</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#c2410c' }}>Amazon SQS</span>
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#7c2d12' }}>
                    <strong>Type:</strong> Pull-based message queue buffer.<br />
                    <strong>Ordering:</strong> FIFO supports strict ordering; Standard is best-effort.<br />
                    <strong>Persistence:</strong> Retains messages up to 14 days.<br />
                    <strong>Concurrency:</strong> Unlimited for Standard; FIFO has limits (300/sec or 3000/sec with batching).<br />
                    <strong>Real-world target:</strong> Order generation processing, asynchronous job decoupling, batch processing servers.
                  </div>
                </div>

                {/* SNS Card */}
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📢</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#6b21a8' }}>Amazon SNS</span>
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#581c87' }}>
                    <strong>Type:</strong> Push-based event broadcasting hub.<br />
                    <strong>Ordering:</strong> FIFO topic preserves strict ordering.<br />
                    <strong>Persistence:</strong> Transient (zero retention; immediate delivery).<br />
                    <strong>Concurrency:</strong> Massive push fanout (Millions of target subscribers).<br />
                    <strong>Real-world target:</strong> Billing event alerts triggering downstream email, billing, analytics, and mobile push simultaneously.
                  </div>
                </div>

                {/* Kinesis Card */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🌊</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0369a1' }}>Amazon Kinesis</span>
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#1e3a8a' }}>
                    <strong>Type:</strong> Persistent streaming shard channel.<br />
                    <strong>Ordering:</strong> Strict ordering per shard partition key.<br />
                    <strong>Persistence:</strong> Durable logs retained up to 365 days.<br />
                    <strong>Concurrency:</strong> Multiple parallel consumer fleets read the identical log sequence concurrently.<br />
                    <strong>Real-world target:</strong> High-volume clickstream logs, IoT telemetry, real-time analytics dashboards.
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Tab 7: Amazon MQ */}
        {activeTab === 'amazon-mq' && (
          <div>
            <div className="im-sec">Amazon MQ Managed Open-Source Message Brokers</div>
            <div className="im-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Amazon MQ is a managed message broker service that hosts open-source engine platforms—<b>ActiveMQ</b> and <b>RabbitMQ</b>. When migrating legacy applications that rely on standard enterprise messaging protocols (AMQP, MQTT, JMS, STOMP) to AWS, developers utilize Amazon MQ to avoid rewriting application code to native SQS/SNS systems.
              </div>

              <div className="im-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0f766e' }}>Managed Protocols &amp; Engines</div>

                  <div className="im-row">
                    <div className="im-dot">1</div>
                    <div>
                      AWS hosts <span className="im-hl-teal">ActiveMQ &amp; RabbitMQ</span> <span className="im-desc-mute">(managed open-source broker architectures maintaining native messaging engine behavior in the cloud)</span> for smooth migrations. Which means legacy code connects cleanly without modifying network libraries.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">2</div>
                    <div>
                      AWS supports <span className="im-hl-teal">Enterprise Protocols</span> <span className="im-desc-mute">(native AMQP, MQTT, JMS, STOMP, and OpenWire protocols)</span> to preserve legacy integrations. Which means enterprise systems, Java applications, and IoT units talk natively in their original language.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0f766e' }}>High-Availability Architectures</div>

                  <div className="im-row">
                    <div className="im-dot">3</div>
                    <div>
                      AWS provisions <span className="im-hl-teal">Active/Standby Replication</span> <span className="im-desc-mute">(managed failover broker deployments mirroring state databases synchronously across Availability Zones)</span> to survive hardware failures. Which means if the primary broker goes offline, active DNS shifts automatically to the standby node.
                    </div>
                  </div>

                  <div className="im-row">
                    <div className="im-dot">4</div>
                    <div>
                      AWS integrates <span className="im-hl-teal">EFS Shared Backend Store</span> <span className="im-desc-mute">(shared file storage mounting concurrently to both active and standby brokers to maintain absolute message state persistence)</span> to prevent loss.
                    </div>
                  </div>
                </div>
              </div>

              {/* Amazon MQ Active/Standby Failover SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  Amazon MQ Active/Standby Cross-AZ Synchronous Replication &amp; Failover Routing
                </div>

                <svg width="100%" viewBox="0 0 760 180" style={{ background: '#e6fffa', borderRadius: '6px', border: '0.5px solid #99f6e4' }}>
                  <defs>
                    <marker id="arrow-mq" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0f766e" /></marker>
                    <marker id="arrow-mq-sync" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0d9488" /></marker>
                  </defs>

                  {/* VPC Border */}
                  <rect x="15" y="10" width="730" height="160" rx="8" fill="none" stroke="#94a3b8" strokeDasharray="3,3" />
                  <text x="380" y="22" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">VPC (Virtual Private Cloud)</text>

                  {/* Subnet A */}
                  <rect x="30" y="35" width="220" height="120" rx="6" fill="#ffffff" stroke={activeBrokerStatus === 'active' ? '#0d9488' : '#ef4444'} strokeWidth={activeBrokerStatus === 'active' ? 1.5 : 1} />
                  <text x="140" y="48" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0f766e">Subnet AZ-a</text>
                  <rect x="45" y="60" width="190" height="80" rx="4" fill={activeBrokerStatus === 'active' ? '#f0fdfa' : '#fef2f2'} stroke={activeBrokerStatus === 'active' ? '#0ea5e9' : '#fca5a5'} />
                  <text x="140" y="75" textAnchor="middle" fontSize="9" fontWeight="700" fill={activeBrokerStatus === 'active' ? '#0369a1' : '#991b1b'}>🖥️ Primary Active Broker</text>
                  <text x="140" y="90" textAnchor="middle" fontSize="7" fill={activeBrokerStatus === 'active' ? '#0ea5e9' : '#ef4444'}>Engine: ActiveMQ (JMS / AMQP)</text>
                  <text x="140" y="105" textAnchor="middle" fontSize="7" fill="#64748b">Active TCP Endpoints: 5672</text>
                  <text x="140" y="125" textAnchor="middle" fontSize="8" fontWeight="700" fill={activeBrokerStatus === 'active' ? '#047857' : '#ef4444'}>
                    {activeBrokerStatus === 'active' ? 'STATUS: Active Primary 🟢' : 'STATUS: OFFLINE / FAILED ❌'}
                  </text>

                  {/* Subnet B */}
                  <rect x="510" y="35" width="220" height="120" rx="6" fill="#ffffff" stroke={activeBrokerStatus === 'active' ? '#cbd5e1' : '#0d9488'} strokeWidth={activeBrokerStatus === 'active' ? 1 : 1.5} />
                  <text x="620" y="48" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">Subnet AZ-b</text>
                  <rect x="525" y="60" width="190" height="80" rx="4" fill={activeBrokerStatus === 'active' ? '#f8fafc' : '#f0fdfa'} stroke={activeBrokerStatus === 'active' ? '#cbd5e1' : '#0ea5e9'} />
                  <text x="620" y="75" textAnchor="middle" fontSize="9" fontWeight="700" fill={activeBrokerStatus === 'active' ? '#475569' : '#0369a1'}>
                    {activeBrokerStatus === 'active' ? '🛡️ Passive Standby Broker' : '⚡ Promoted Primary Broker'}
                  </text>
                  <text x="620" y="90" textAnchor="middle" fontSize="7" fill="#64748b">Engine: ActiveMQ (Standby)</text>
                  <text x="620" y="105" textAnchor="middle" fontSize="7" fill="#64748b">Network interfaces: Standby mode</text>
                  <text x="620" y="125" textAnchor="middle" fontSize="8" fontWeight="700" fill={activeBrokerStatus === 'active' ? '#475569' : '#047857'}>
                    {activeBrokerStatus === 'active' ? 'STATUS: Sync Standby 🔒' : 'STATUS: Promoted Active 🟢'}
                  </text>

                  {/* Client Application */}
                  <rect x="300" y="60" width="160" height="60" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="380" y="76" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">💻 Legacy Java Backend</text>
                  <text x="380" y="90" textAnchor="middle" fontSize="7" fill="#64748b">Failover URI: failover:(ssl://active, ssl://standby)</text>
                  <text x="380" y="105" textAnchor="middle" fontSize="7" fontWeight="600" fill="#0f766e">JMS Messaging Connection</text>

                  {/* Connectors */}
                  {/* Client connection routing shifts to Subnet B if A fails */}
                  {activeBrokerStatus === 'active' ? (
                    <path d="M 300 90 L 245 90" fill="none" stroke="#0ea5e9" strokeWidth="1.5" markerEnd="url(#arrow-mq)" />
                  ) : (
                    <path d="M 460 90 L 515 90" fill="none" stroke="#0ea5e9" strokeWidth="1.5" markerEnd="url(#arrow-mq)" />
                  )}
                  
                  {/* Active -> Standby Replication (disabled if Primary fails) */}
                  <path 
                    d="M 140 148 L 140 162 L 620 162 L 620 148" 
                    fill="none" 
                    stroke={activeBrokerStatus === 'active' ? '#0d9488' : '#ef4444'} 
                    strokeWidth="1.5" 
                    strokeDasharray={activeBrokerStatus === 'active' ? '' : '3,2'}
                    markerEnd="url(#arrow-mq-sync)" 
                  />
                  <text x="380" y="157" textAnchor="middle" fontSize="7" fill={activeBrokerStatus === 'active' ? '#0d9488' : '#ef4444'} fontWeight="600">
                    {activeBrokerStatus === 'active' ? 'Cross-AZ Synchronous State Sync 🔄' : 'Sync Disconnected ❌'}
                  </text>
                </svg>
              </div>

              {/* Interactive Failover Button for Tab 7 */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  className={`im-btn ${activeBrokerStatus === 'active' ? 'im-danger' : 'im-primary'}`} 
                  onClick={handleBrokerFailover}
                >
                  {activeBrokerStatus === 'active' ? '⚠️ Trigger Primary Broker Failure' : '🔄 Recover Primary Broker'}
                </button>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  *Clicking this triggers an automated DNS endpoint failover mirroring real-world ActiveMQ failover transports.
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Tab 8: Live Simulator */}
        {activeTab === 'simulator' && (
          <div>
            <div className="im-sec">Live Interactive Messaging Scenario &amp; Infrastructure Simulator</div>

            {/* Simulated interactive status control banner */}
            <div className="im-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: '#e0f2fe', borderColor: '#bae6fd' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#0369a1' }}>💡 Interactive Control Panel:</span>
                <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '6px' }}>
                  {activeScenario === 'asg_decoupling' && `Active Consumers: ${consumerCount} EC2 fleet instances | Queue Depth: ${queueDepth} messages`}
                  {activeScenario === 'db_buffering' && `Database writes: ${dbWritesCurrent} ops/sec | DB Health Status: ${dbStatus.toUpperCase()}`}
                  {activeScenario === 'visibility_timeout' && `Visibility Timeout Config: ${visibilityTimeoutSec} seconds | Dual Processing state: ${doubleProcessingActive ? 'DUPLICATE READS DETECTED ⚠️' : 'Normal Operations'}`}
                  {activeScenario === 'kinesis_throttling' && `Kinesis streams: ${kinesisShards} Shards active | Ingestion Rate: ${bandwidthLimit} KB/s | Status: ${isThrottled ? 'ProvisionedThroughputExceededException (429) ❌' : 'Operational 🟢'}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeScenario === 'kinesis_throttling' && isThrottled && (
                  <button className="im-btn im-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleSplitShard}>
                    🪓 Split Shards / Add Capacity
                  </button>
                )}
                {activeScenario === 'visibility_timeout' && !isSimulating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <label style={{ color: '#0369a1', fontWeight: 600 }}>Set Timeout (s): </label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10" 
                      value={visibilityTimeoutSec} 
                      onChange={(e) => setVisibilityTimeoutSec(parseInt(e.target.value))} 
                      style={{ width: '45px', padding: '2px', border: '1px solid #bae6fd', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="im-grid2">
              
              {/* Controls Column */}
              <div>
                <div className="im-sec">Select Messaging Workload Scenario</div>
                <div className="im-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Scenario selection */}
                  <div className="im-ctrl">
                    <label>1. Select Workload Integration Scenario</label>
                    <select 
                      value={activeScenario} 
                      onChange={(e) => { 
                        setActiveScenario(e.target.value as ScenarioType); 
                        setSimStep(0); 
                        setIsSimulating(false);
                        addLog(`Swapped scenario to: ${e.target.value.toUpperCase()}. Ready to trace.`, 'info');
                      }}
                    >
                      <option value="asg_decoupling">SQS Decoupling with Auto-scaling Fleet (CloudWatch scaling)</option>
                      <option value="db_buffering">SQS as a Database Write Buffer (Smoothing burst traffic)</option>
                      <option value="visibility_timeout">SQS Visibility Timeout Double-Processing Loop (Timeout issues)</option>
                      <option value="kinesis_throttling">Kinesis Clickstream Ingestion Throttling (Shard splits)</option>
                    </select>
                  </div>

                  {/* Bandwidth slider if Kinesis is active */}
                  {activeScenario === 'kinesis_throttling' && (
                    <div className="im-ctrl">
                      <label>Adjust Clickstream Ingestion rate: <strong>{(bandwidthLimit / 1000).toFixed(1)} MB/sec</strong></label>
                      <input 
                        type="range" 
                        min="500" 
                        max="3000" 
                        step="250" 
                        value={bandwidthLimit} 
                        onChange={(e) => setBandwidthLimit(parseInt(e.target.value))} 
                      />
                      <div className="im-mono" style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                        *1-Shard Capacity: 1.0 MB/sec limit. Current active shards: {kinesisShards}
                      </div>
                    </div>
                  )}

                  {/* Scenario technical descriptions */}
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '10px', fontSize: '11px', lineHeight: '1.45' }}>
                    {activeScenario === 'asg_decoupling' && (
                      <div>
                        <strong>Scenario Mechanics:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Decouples web tier peak bursts from backend workers.</li>
                          <li>CloudWatch alarms monitor Queue Depth.</li>
                          <li>Auto Scaling scaling loops add consumer instances to drain queue safely.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'db_buffering' && (
                      <div>
                        <strong>Scenario Mechanics:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>SQS serves as a database buffer to prevent connection failures.</li>
                          <li>Write rates to SQS scale dynamically with spike loads.</li>
                          <li>Consumer instances pull items at controlled rates (Safe Database target).</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'visibility_timeout' && (
                      <div>
                        <strong>Scenario Mechanics:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Demonstrates visibility timeout expiration challenges.</li>
                          <li>If Consumer A takes longer than the timeout lock, message unlocks.</li>
                          <li>Consumer B polls the identical message, resulting in duplicate processing.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'kinesis_throttling' && (
                      <div>
                        <strong>Scenario Mechanics:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Visualizes Kinesis Shard capacity limits (1 MB/s write per shard).</li>
                          <li>Exceeding limits triggers `ProvisionedThroughputExceededException`.</li>
                          <li>Trigger "Split Shards" to add capacities and clear errors.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="im-btnbar">
                    <button 
                      className="im-btn im-primary" 
                      style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                      onClick={handleStartSimulation}
                      disabled={isSimulating}
                    >
                      {isSimulating ? '⌛ Streaming packets...' : '🚀 Launch Workload Simulation'}
                    </button>
                  </div>

                </div>
              </div>

              {/* Simulation Visualiser Column */}
              <div>
                <div className="im-sec">Active Infrastructure Pipeline SVG</div>
                <div className="im-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Dynamic SVG tracing paths */}
                  <svg width="100%" height="200" viewBox="0 0 480 200" style={{ background: '#f8fafc', borderRadius: '8px', border: '0.5px solid #cbd5e1' }}>
                    
                    {/* Producer */}
                    <circle cx="50" cy="100" r="18" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    <text x="50" y="100" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="700">PROD</text>
                    <text x="50" y="130" textAnchor="middle" fontSize="8" fill="#475569">Producers</text>

                    {/* SQS Buffer / Kinesis Stream */}
                    <rect x="150" y="60" width="100" height="80" rx="6" fill={simStep >= 2 ? '#fffbeb' : '#ffffff'} stroke={simStep >= 2 ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="200" y="76" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2410c">
                      {activeScenario === 'kinesis_throttling' ? 'Kinesis Shards' : 'SQS Queue'}
                    </text>
                    <text x="200" y="92" textAnchor="middle" fontSize="7" fill="#ea580c">
                      {activeScenario === 'kinesis_throttling' ? `Active: ${kinesisShards} Shards` : `Depth: ${queueDepth}`}
                    </text>
                    <text x="200" y="108" textAnchor="middle" fontSize="7" fontWeight="700" fill={isThrottled ? '#ef4444' : '#10b981'}>
                      {isThrottled ? '429 THROTTLED ❌' : simStep >= 2 ? 'Active Buffer' : 'Idle'}
                    </text>

                    {/* Consumer Node(s) */}
                    <rect x="310" y="60" width="120" height="80" rx="6" fill={simStep >= 3 ? '#ecfdf5' : '#ffffff'} stroke={simStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="370" y="76" textAnchor="middle" fontSize="8" fontWeight="700" fill="#047857">
                      {activeScenario === 'db_buffering' ? 'Database Target' : 'Consumer Fleet'}
                    </text>
                    <text x="370" y="92" textAnchor="middle" fontSize="7" fill="#065f46">
                      {activeScenario === 'asg_decoupling' ? `Active EC2s: ${consumerCount}` : activeScenario === 'db_buffering' ? `DB Status: ${dbStatus}` : 'Worker active'}
                    </text>
                    <text x="370" y="108" textAnchor="middle" fontSize="7" fontWeight="700" fill="#047857">
                      {activeScenario === 'db_buffering' && dbWritesCurrent > 0 ? `${dbWritesCurrent} ops/sec` : simStep >= 3 ? 'Consuming Tasks' : 'Idle'}
                    </text>

                    {/* Visibility double processing visual warning */}
                    {doubleProcessingActive && (
                      <g transform="translate(160, 150)">
                        <rect x="0" y="0" width="160" height="35" rx="3" fill="#fee2e2" stroke="#fca5a5" />
                        <text x="80" y="15" textAnchor="middle" fontSize="7" fontWeight="700" fill="#991b1b">⚠️ DUAL CONSUMPTION ACTIVE</text>
                        <text x="80" y="27" textAnchor="middle" fontSize="6" fill="#b91c1c">Timeout expired; same job ran twice</text>
                      </g>
                    )}

                    {/* Connector lines */}
                    <path d="M 68 100 L 150 100" fill="none" stroke={simStep >= 1 ? '#3b82f6' : '#cbd5e1'} strokeWidth="1.5" />
                    <path d="M 250 100 L 310 100" fill="none" stroke={simStep >= 2 ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5" />

                    {/* Pulsing message packet */}
                    {isSimulating && (
                      <circle r="4" fill={isThrottled ? '#ef4444' : '#f59e0b'}>
                        <animateMotion 
                          dur="1.5s" 
                          repeatCount="indefinite" 
                          path={
                            simStep === 1 ? 'M 50 100 L 150 100' :
                            simStep === 2 ? 'M 150 100 L 250 100' :
                            simStep === 3 ? 'M 250 100 L 310 100' :
                            simStep === 4 ? 'M 310 100 L 370 100' : 'M 50 100 L 150 100'
                          } 
                        />
                      </circle>
                    )}
                  </svg>

                  {/* Dynamic KPI indicators */}
                  <div style={{ width: '100%', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>Real-Time Integration Metrics:</span>
                    </div>
                    <div className="im-grid3" style={{ gap: '6px' }}>
                      {/* KPI 1 */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Ingest Delay</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                          {activeScenario === 'asg_decoupling' ? '2.5 ms' : activeScenario === 'db_buffering' && dbStatus === 'buffered' ? '180 ms' : '0.8 ms'}
                        </div>
                      </div>
                      {/* KPI 2 */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Concurrency</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9' }}>
                          {activeScenario === 'asg_decoupling' ? `${consumerCount} workers` : activeScenario === 'kinesis_throttling' ? `${kinesisShards} Shards` : 'Single stream'}
                        </div>
                      </div>
                      {/* KPI 3 */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Delivery SLA</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isThrottled ? '#ef4444' : '#10b981' }}>
                          {isThrottled ? '429 Throttled' : doubleProcessingActive ? 'Duplicates ⚠️' : '100% Correct'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Scrolling console logs */}
            <div className="im-sec">Infrastructure Pipeline Scrolling Trace Logs</div>
            <div className="im-log">
              {simLogs.map((log, idx) => (
                <div key={idx} className="im-log-entry">
                  <span style={{ color: '#94a3b8', marginRight: '6px' }}>[{log.timestamp}]</span>
                  <span style={{ 
                    color: log.type === 'success' ? '#4ade80' : 
                           log.type === 'warning' ? '#fbbf24' : 
                           log.type === 'error' ? '#f87171' : '#60a5fa',
                    fontWeight: log.type !== 'info' ? 700 : 'normal'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
