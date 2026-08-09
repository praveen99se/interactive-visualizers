import { useState, useEffect } from 'react';
import { 
  Play, 
  Cpu, 
  Network, 
  MapPin, 
  ToggleLeft,
  ToggleRight,
  Folder,
  Terminal,
  Zap,
  Coins
} from 'lucide-react';

interface UniqueProviderFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueProviderFeatures({ provider }: UniqueProviderFeaturesProps) {
  // --- AWS STATES ---
  const [lambdaRunning, setLambdaRunning] = useState(false);
  const [lambdaStep, setLambdaStep] = useState(0);
  const [lambdaOutput, setLambdaOutput] = useState<any>(null);
  const [clientLocation, setClientLocation] = useState<'NY' | 'LDN' | 'TKY'>('NY');
  const [mrapRunning, setMrapRunning] = useState(false);
  const [mrapActiveRegion, setMrapActiveRegion] = useState('');

  // --- AZURE STATES ---
  const [isHns, setIsHns] = useState(false);
  const [renameRunning, setRenameRunning] = useState(false);
  const [renameProgress, setRenameProgress] = useState<number>(0);
  const [renameLogs, setRenameLogs] = useState<string[]>([]);
  const [renameStats, setRenameStats] = useState({ ops: 0, time: 0, cost: 'N/A' });

  // --- GCP STATES ---
  const [turboEnabled, setTurboEnabled] = useState(true);
  const [gcpReplicating, setGcpReplicating] = useState(false);
  const [gcpProgress, setGcpProgress] = useState(0);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);
  const [fileAccessFreq, setFileAccessFreq] = useState<'daily' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Raw AWS S3 Object
  const rawAwsObject = {
    "customer_id": "C-9841",
    "full_name": "Sarah Connor",
    "email": "sconnor@cyberdyne.net",
    "credit_card": "4111-2222-3333-4444",
    "region": "us-west-2",
    "tier": "enterprise"
  };

  // Run AWS S3 Object Lambda simulation
  const startLambdaSim = () => {
    if (lambdaRunning) return;
    setLambdaRunning(true);
    setLambdaStep(1);
    setLambdaOutput(null);

    // Step 1: Client Request
    setTimeout(() => {
      setLambdaStep(2);
      // Step 2: Route through access point to Lambda
      setTimeout(() => {
        setLambdaStep(3);
        // Step 3: Lambda executes script
        setTimeout(() => {
          setLambdaStep(4);
          // Step 4: Output returned
          setLambdaOutput({
            "customer_id": "C-9841",
            "full_name": "S**** C*****",
            "email": "s******@cyberdyne.net",
            "credit_card": "****-****-****-4444",
            "region": "us-west-2",
            "tier": "enterprise",
            "lambda_processed_at": new Date().toISOString()
          });
          setLambdaRunning(false);
        }, 1500);
      }, 1200);
    }, 1000);
  };

  // Run AWS MRAP simulation
  const runMrapSim = () => {
    setMrapRunning(true);
    let targetRegion = 'us-east-1 (N. Virginia)';
    if (clientLocation === 'LDN') targetRegion = 'eu-west-1 (Ireland)';
    if (clientLocation === 'TKY') targetRegion = 'ap-northeast-1 (Tokyo)';

    setTimeout(() => {
      setMrapActiveRegion(targetRegion);
      setMrapRunning(false);
    }, 1500);
  };

  useEffect(() => {
    setMrapActiveRegion('');
  }, [clientLocation]);

  // Run Azure HNS rename simulation
  const startRenameSim = () => {
    if (renameRunning) return;
    setRenameRunning(true);
    setRenameProgress(0);
    setRenameLogs([]);
    setRenameStats({ ops: 0, time: 0, cost: 'Calculating...' });

    const totalFiles = 10;
    let currentFile = 0;
    const tempLogs: string[] = [];

    if (!isHns) {
      // Flat Namespace: copy & delete sequentially
      const interval = setInterval(() => {
        if (currentFile < totalFiles) {
          currentFile++;
          setRenameProgress(Math.floor((currentFile / totalFiles) * 100));
          tempLogs.unshift(`[Flat Mode] COPY object ${currentFile}/10: flat-container/production-datasets/file_${currentFile}.bin ➔ flat-container/archived-datasets/file_${currentFile}.bin`);
          tempLogs.unshift(`[Flat Mode] DELETE object ${currentFile}/10: flat-container/production-datasets/file_${currentFile}.bin`);
          setRenameLogs([...tempLogs]);
        } else {
          clearInterval(interval);
          setRenameRunning(false);
          setRenameStats({
            ops: 20, // 10 COPY + 10 DELETE
            time: 2500, // ms
            cost: 'High (20 transaction charges)'
          });
        }
      }, 250);
    } else {
      // HNS: atomic directory metadata update
      setTimeout(() => {
        setRenameProgress(100);
        tempLogs.unshift(`[HNS Mode] ATOMIC RENAME directory logs: rename hns-container/production-datasets/ ➔ hns-container/archived-datasets/`);
        tempLogs.unshift(`[HNS Mode] SUCCESS: 1 directory node updated in metadata index.`);
        setRenameLogs([...tempLogs]);
        setRenameRunning(false);
        setRenameStats({
          ops: 1, // 1 atomic rename operation
          time: 40, // ms
          cost: 'Low (1 transaction charge)'
        });
      }, 800);
    }
  };

  // Run GCP Turbo Replication SLA speed test
  const startGcpReplication = () => {
    if (gcpReplicating) return;
    setGcpReplicating(true);
    setGcpProgress(0);
    setGcpLogs([]);

    const tempLogs = ['[Ingest] Ingested 5 GB raw object into gs://my-bucket (us-east1)'];
    setGcpLogs([...tempLogs]);

    let duration = turboEnabled ? 1500 : 3500;
    let step = 0;
    const totalSteps = 10;

    const interval = setInterval(() => {
      if (step < totalSteps) {
        step++;
        setGcpProgress(Math.floor((step / totalSteps) * 100));
        if (step === 3) {
          tempLogs.unshift(`[WAN] Transferring blocks via Google's Global Private Fiber backbone network...`);
        }
        if (step === 7) {
          tempLogs.unshift(`[Replica] Writing sync logs to us-west1 replication cluster...`);
        }
        setGcpLogs([...tempLogs]);
      } else {
        clearInterval(interval);
        setGcpReplicating(false);
        tempLogs.unshift(`[SLA Check] Verification completed! Replication finished in ${turboEnabled ? '4.8 minutes (100% SLA compliant <15m)' : '18.2 minutes'}`);
        setGcpLogs([...tempLogs]);
      }
    }, duration / totalSteps);
  };

  // GCP Autoclass cost calculator
  const getGcpCost = () => {
    if (fileAccessFreq === 'daily') return { storage: 20, operations: 1, total: 21, note: 'Standard storage is best' };
    if (fileAccessFreq === 'monthly') return { storage: 10, operations: 5, total: 15, note: 'Nearline tier automatic cost' };
    if (fileAccessFreq === 'quarterly') return { storage: 7, operations: 6, total: 13, note: 'Coldline tier automatic cost' };
    return { storage: 1.2, operations: 8, total: 9.2, note: 'Archive tier automatic cost. 100% online ms access!' };
  };

  const getAwsLifecycleCost = () => {
    if (fileAccessFreq === 'daily') return { storage: 23, operations: 0, total: 23, note: 'Standard S3 storage' };
    if (fileAccessFreq === 'monthly') return { storage: 12.5, operations: 8, total: 20.5, note: 'S3 Standard-IA (has min size and transition charge)' };
    if (fileAccessFreq === 'quarterly') return { storage: 4, operations: 15, total: 19, note: 'Glacier Instant Retrieval (high retrieval fee)' };
    return { storage: 0.99, operations: 35, total: 35.99, note: 'Glacier Deep Archive (requires offline rehydration)' };
  };

  const gcpCost = getGcpCost();
  const awsCost = getAwsLifecycleCost();

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Intro section */}
      <div className="s3-card">
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Provider-Specific Advanced Offerings &amp; Sandbox</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>While basic storage concepts translate across clouds, each provider has engineered unique capability layers that do not map 1:1. Run the simulations below to understand these proprietary cloud architectures.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS S3: OBJECT LAMBDA & MRAP                                              */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* S3 Object Lambda */}
          <div className="lg:col-span-7 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>S3 Object Lambda Interactive Simulator</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                S3 Object Lambda lets you add custom code to standard S3 GET requests, modifying data on-the-fly. This eliminates the need to maintain duplicate sanitized datasets for different consumers.
              </p>

              {/* Simulation visual */}
              <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Request Authorizer Pipeline</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${lambdaRunning ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-800 dark:text-slate-200'}`}>
                    {lambdaRunning ? 'PROCESSING IN FLIGHT' : 'IDLE'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center items-center">
                  <div className={`p-2 rounded border transition-colors ${lambdaStep === 1 ? 'bg-amber-500/20 border-amber-500 text-slate-900 dark:text-slate-100' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-800 dark:text-slate-200'}`}>
                    💻 Client GET
                  </div>
                  <div style={{ color: "var(--color-text-secondary)" }}>➔</div>
                  <div className={`p-2 rounded border transition-colors ${lambdaStep === 2 || lambdaStep === 3 ? 'bg-amber-500/20 border-amber-500 text-slate-900 dark:text-slate-100 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-800 dark:text-slate-200'}`}>
                    ⚙️ Lambda App
                  </div>
                  <div style={{ color: "var(--color-text-secondary)" }}>➔</div>
                  <div className={`p-2 rounded border transition-colors ${lambdaStep === 4 ? 'bg-emerald-500/20 border-emerald-500 text-slate-900 dark:text-slate-100' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-800 dark:text-slate-200'}`}>
                    🪣 Raw S3
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Raw File in S3 Bucket:</span>
                    <pre style={{ borderColor: "var(--color-border-tertiary)" }}>
                      {JSON.stringify(rawAwsObject, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Client Received Response:</span>
                    <pre style={{ borderColor: "var(--color-border-tertiary)" }}>
                      {lambdaOutput ? JSON.stringify(lambdaOutput, null, 2) : 'Click "Sanitize Request" below...'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={startLambdaSim}
              disabled={lambdaRunning}
              className="s3-btn text-[11px] w-full flex items-center justify-center gap-2 py-2"
              style={{ background: 'linear-gradient(135deg, #FF9900 0%, #E07B00 100%)', color: '#fff', border: 'none' }}
            >
              <Play className="w-3.5 h-3.5" /> {lambdaRunning ? 'Executing Lambda Function...' : 'Retrieve Sanitized Object (Run Object Lambda)'}
            </button>
          </div>

          {/* MRAP */}
          <div className="lg:col-span-5 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Multi-Region Access Points (MRAP)</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                AWS Multi-Region Access Points assign a single global DNS endpoint to route traffic dynamically across multiple regional buckets over AWS Global Accelerator, choosing paths of lowest network latency.
              </p>

              {/* MRAP simulation interface */}
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Select Client Location:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setClientLocation('NY')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: clientLocation === 'NY' ? '1.5px solid #d97706' : '1px solid var(--color-border-tertiary)',
                        background: clientLocation === 'NY' ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-background-primary)',
                        color: clientLocation === 'NY' ? '#d97706' : 'var(--color-text-primary)'
                      }}
                    >
                      🗽 New York
                    </button>
                    <button 
                      onClick={() => setClientLocation('LDN')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: clientLocation === 'LDN' ? '1.5px solid #d97706' : '1px solid var(--color-border-tertiary)',
                        background: clientLocation === 'LDN' ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-background-primary)',
                        color: clientLocation === 'LDN' ? '#d97706' : 'var(--color-text-primary)'
                      }}
                    >
                      🏰 London
                    </button>
                    <button 
                      onClick={() => setClientLocation('TKY')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: clientLocation === 'TKY' ? '1.5px solid #d97706' : '1px solid var(--color-border-tertiary)',
                        background: clientLocation === 'TKY' ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-background-primary)',
                        color: clientLocation === 'TKY' ? '#d97706' : 'var(--color-text-primary)'
                      }}
                    >
                      🗼 Tokyo
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '14px', fontFamily: 'monospace', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    <span>MRAP ENDPOINT:</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>my-global.mrap.s3.amazonaws.com</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--color-border-tertiary)', paddingTop: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Client Latency Routing:</span>
                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>{mrapRunning ? 'Calculating Accelerator route...' : 'Active Connection Established'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-background-primary)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Routed Bucket Region:</span>
                      <span style={{ color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: '14px', height: '14px' }} />
                        {mrapActiveRegion || 'Click "Route request"...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={runMrapSim}
              disabled={mrapRunning}
              className="s3-btn text-[11px] w-full flex items-center justify-center gap-2 py-2 mt-4"
              style={{ background: 'linear-gradient(135deg, #FF9900 0%, #E07B00 100%)', color: '#fff', border: 'none' }}
            >
              <Network className="w-3.5 h-3.5" /> {mrapRunning ? 'Evaluating nearest regional POP...' : 'Route request through Global Accelerator'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE BLOBS: ADLS GEN2 HNS & NFS MOUNT                                    */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Azure ADLS Gen2 Hierarchical Namespace (HNS) */}
          <div className="lg:col-span-7 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4' }}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-500" />
                  <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>ADLS Gen2 Hierarchical Namespace (HNS) Rename Simulator</h3>
                </div>
                {/* HNS Switch */}
                <div style={{ color: "var(--color-text-secondary)" }}>
                  <span>HNS {isHns ? 'ON' : 'OFF'}</span>
                  <button onClick={() => setIsHns(prev => !prev)} className="focus:outline-none">
                    {isHns ? <ToggleRight className="w-8 h-8 text-blue-500" /> : <ToggleLeft style={{ color: "var(--color-text-secondary)" }} />}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Standard object storage uses a flat namespace where directories are only simulated prefixes. Renaming a simulated folder requires copying and deleting every single file. Azure ADLS Gen2 HNS creates a true hierarchical structure, letting you rename directories atomically in a single metadata update.
              </p>

              {/* HNS Renaming Sandbox */}
              <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                <div style={{ color: "var(--color-text-secondary)" }}>
                  <span>Namespace Transaction Console</span>
                  <span className="font-bold text-blue-400">{isHns ? 'ADLS Gen2 HNS Engine Active' : 'Flat Blob Engine Active'}</span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ color: "var(--color-text-secondary)" }}>
                    <span>Directory Restructuring:</span>
                    <span>{renameProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${renameProgress}%` }} />
                  </div>
                </div>

                {/* Execution Stats */}
                <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>REST CALLS:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-[12px]">{renameStats.ops}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>LATENCY:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-[12px]">{renameStats.time} ms</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>TRANSACTION COST:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold text-[12px]">{renameStats.cost}</span>
                  </div>
                </div>

                {/* Logs terminal */}
                <div style={{ color: "var(--color-text-secondary)" }}>
                  {renameLogs.length > 0 ? (
                    renameLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  ) : (
                    <div style={{ color: "var(--color-text-secondary)" }}>Choose Flat/HNS, then click "Rename Directory"...</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={startRenameSim}
              disabled={renameRunning}
              className="s3-btn text-[11px] w-full flex items-center justify-center gap-2 py-2 mt-4"
              style={{ background: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)', color: '#fff', border: 'none' }}
            >
              <Play className="w-3.5 h-3.5" /> {renameRunning ? 'Executing folder updates...' : `Rename Folder logs/ ➔ archive-logs/ (${isHns ? 'Atomic' : 'Copy-Delete Sequential'})`}
            </button>
          </div>

          {/* Azure Blob NFS v3.0 Mount point */}
          <div className="lg:col-span-5 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>NFS v3.0 Protocol Mounting Access</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Blob Storage uniquely allows mounting container volumes directly onto Linux VM file systems using the Network File System (NFS) v3.0 protocol, bypassing standard object API middleware.
              </p>

              {/* Code blocks and mounting commands */}
              <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                <div style={{ color: "var(--color-text-secondary)" }}>LINUX MOUNT CLI INSTRUCTION</div>
                <div className="space-y-1.5 text-slate-800 dark:text-slate-200">
                  <div><span style={{ color: "var(--color-text-secondary)" }}># 1. Install NFS client dependency</span></div>
                  <div style={{ borderColor: "var(--color-border-tertiary)" }}>sudo apt-get install nfs-common</div>
                  <div><span style={{ color: "var(--color-text-secondary)" }}># 2. Create local mount folder target</span></div>
                  <div style={{ borderColor: "var(--color-border-tertiary)" }}>mkdir -p /mnt/myblobstorage</div>
                  <div><span style={{ color: "var(--color-text-secondary)" }}># 3. Mount Azure Blob Container directly</span></div>
                  <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                    mount -t nfs -o sec=sys,vers=3,nolock myaccount.blob.core.windows.net:/myaccount/mycontainer /mnt/myblobstorage
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-900/60 rounded-xl p-3.5 mt-4 text-[11px] text-blue-400 leading-relaxed font-sans font-semibold">
              ⚠️ Mounting via NFS requires ADLS Gen2 Hierarchical Namespace (HNS) enabled on the storage account and VM network whitelist firewall access policies.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CLOUD STORAGE: TURBO REPLICATION & AUTOCLASS                       */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* GCS Turbo Replication */}
          <div className="lg:col-span-7 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58' }}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Dual-Region Turbo Replication SLA Sandbox</h3>
                </div>
                {/* Turbo switch */}
                <div style={{ color: "var(--color-text-secondary)" }}>
                  <span>Turbo SLA {turboEnabled ? 'ON' : 'OFF'}</span>
                  <button onClick={() => setTurboEnabled(prev => !prev)} className="focus:outline-none">
                    {turboEnabled ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft style={{ color: "var(--color-text-secondary)" }} />}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Standard multi-region replications run asynchronously. However, GCS Dual-Region configurations support **Turbo Replication**, providing a financially backed SLA that guarantees 99.9% of all written objects are replicated to the secondary region within 15 minutes.
              </p>

              {/* Turbo Replication Simulation */}
              <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                <div style={{ color: "var(--color-text-secondary)" }}>
                  <span>Replication Pipeline: gs://my-bucket</span>
                  <span className="font-bold text-emerald-400">{turboEnabled ? 'Turbo Replication Active (15m SLA)' : 'Standard Replication Active'}</span>
                </div>

                <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>SOURCE:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">us-east1 (Virginia)</span>
                  </div>
                  <div style={{ color: "var(--color-text-secondary)" }}>======➔</div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>TARGET:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">us-west1 (Oregon)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ color: "var(--color-text-secondary)" }}>
                    <span>Replication Sync status:</span>
                    <span>{gcpProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${gcpProgress}%` }} />
                  </div>
                </div>

                {/* Logs */}
                <div style={{ color: "var(--color-text-secondary)" }}>
                  {gcpLogs.length > 0 ? (
                    gcpLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  ) : (
                    <div style={{ color: "var(--color-text-secondary)" }}>Click "Ingest Big Data Object" to run speed test...</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={startGcpReplication}
              disabled={gcpReplicating}
              className="s3-btn text-[11px] w-full flex items-center justify-center gap-2 py-2 mt-4"
              style={{ background: 'linear-gradient(135deg, #0F9D58 0%, #0B7A44 100%)', color: '#fff', border: 'none' }}
            >
              <Play className="w-3.5 h-3.5" /> {gcpReplicating ? 'Replicating data packets...' : 'Ingest Big Data Object (5 GB Test)'}
            </button>
          </div>

          {/* GCS Autoclass Pricing Calculator Sandbox */}
          <div className="lg:col-span-5 s3-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCS Autoclass Cost Optimization Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Standard lifecycles charge retrieval and class transition fees when objects are read/moved. GCS Autoclass dynamically transitions classes with **zero** retrieval/transition charges, relying only on a flat monitoring fee.
              </p>

              {/* Selector */}
              <div className="space-y-3 mb-4">
                <label style={{ color: "var(--color-text-secondary)" }}>Simulated File Access Pattern:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['daily', 'monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFileAccessFreq(freq)}
                      className={`px-1.5 py-1.5 rounded-lg border text-[10.5px] font-bold uppercase ${fileAccessFreq === freq ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-slate-200 dark:border-slate-800'}`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Sandbox Output */}
              <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                <div style={{ color: "var(--color-text-secondary)" }}>Monthly Billing Estimate (per 1 TB data)</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                    <span className="text-[#0f9d58] font-bold block text-[10px]">💚 GCS Autoclass:</span>
                    <div className="flex justify-between mt-1 text-[11.5px]">
                      <span>Storage:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">${gcpCost.storage}</span>
                    </div>
                    <div className="flex justify-between text-[11.5px]">
                      <span>Retrieval/Tier Fee:</span>
                      <span className="text-emerald-400 font-bold">$0.00</span>
                    </div>
                    <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                      <span>Total:</span>
                      <span>${gcpCost.total}</span>
                    </div>
                  </div>

                  <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                    <span className="text-[#f97316] font-bold block text-[10px]">🧡 S3 standard lifecycle:</span>
                    <div className="flex justify-between mt-1 text-[11.5px]">
                      <span>Storage:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">${awsCost.storage}</span>
                    </div>
                    <div className="flex justify-between text-[11.5px]">
                      <span>Retrieval/Tier Fee:</span>
                      <span className="text-amber-500 font-bold">${awsCost.operations}</span>
                    </div>
                    <div style={{ borderColor: "var(--color-border-tertiary)" }}>
                      <span>Total:</span>
                      <span>${awsCost.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ color: "var(--color-text-secondary)" }}>
              <span className="text-slate-900 dark:text-slate-100 font-bold block mb-0.5">Architect Lesson:</span>
              GCS Autoclass is highly cost-effective for databases or file distributions where access frequencies are unpredictable, saving up to 60% compared to manually managing lifecycle transitions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
