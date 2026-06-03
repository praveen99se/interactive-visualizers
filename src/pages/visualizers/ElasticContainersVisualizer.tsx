import { useEffect, useState } from 'react';
import {
  Cpu,
  Layers,
  Settings,
  Play,
  Square,
  ArrowRight,
  Terminal,
  AlertTriangle,
  Clock,
  Database,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 'intro' | 'ecs-core' | 'ecs-advanced' | 'eks-k8s' | 'runner-migration' | 'simulation';

interface SimTask {
  id: string;
  name: string;
  type: 'web' | 'worker' | 'cron';
  status: 'PROVISIONING' | 'RUNNING' | 'STOPPED';
  cpu: number;
  memory: number;
  uptime: number; // in seconds
}

export default function ElasticContainersVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

  // Tab 1: Docker vs VM States
  const [dockerVmView, setDockerVmView] = useState<'container' | 'vm'>('container');
  const [dfBaseImage, setDfBaseImage] = useState('node:18-alpine');
  const [dfWorkdir, setDfWorkdir] = useState('/usr/src/app');
  const [dfInstall, setDfInstall] = useState('npm install --only=production');
  const [dfEnvPort, setDfEnvPort] = useState('3000');
  const [dfCmd, setDfCmd] = useState('["node", "server.js"]');
  const [focusedDfField, setFocusedDfField] = useState<string | null>(null);

  // Tab 2: ECS Core States
  const [ecsLaunchType, setEcsLaunchType] = useState<'fargate' | 'ec2'>('fargate');
  const [ecrPipelineStep, setEcrPipelineStep] = useState<number>(0);
  const [activeRoleExplain, setActiveRoleExplain] = useState<'execution' | 'task'>('execution');

  // Tab 3: ECS Advanced States
  const [activeAdvPattern, setActiveAdvPattern] = useState<'port-map' | 'capacity' | 'sqs-queue' | 'eventbridge-cron' | 'state-intercept'>('port-map');

  // Tab 4: EKS States
  const [eksStorageHover, setEksStorageHover] = useState<string | null>(null);

  // Tab 5: App Runner & Migration States
  const [appRunnerTrigger, setAppRunnerTrigger] = useState<'git' | 'ecr'>('git');
  const [appRunnerDeployState, setAppRunnerDeployState] = useState<'idle' | 'fetching' | 'building' | 'deploying' | 'completed'>('idle');
  const [appRunnerProgress, setAppRunnerProgress] = useState(0);
  const [appRunnerVpcDbLinked, setAppRunnerVpcDbLinked] = useState<boolean>(true);
  const [a2cStep, setA2cStep] = useState<number>(0);
  const [a2cTerminalOutput, setA2cTerminalOutput] = useState<string[]>([
    '$ app2container inventory',
    'Scanning local server environment...',
    'SUCCESS: Discovered 1 candidate application:',
    '  - App ID: java-tomcat-98a2',
    '    Type: Java Tomcat WebApp',
    '    Ports: [8080]',
    '    Path: /var/lib/tomcat9/webapps/legacy-app',
    '    Platform: Linux RHEL v8.4'
  ]);
  const [a2cIsRunning, setA2cIsRunning] = useState<boolean>(false);

  const updateA2cConsole = (step: number) => {
    if (step === 0) {
      setA2cTerminalOutput([
        '$ app2container inventory',
        'Scanning local server environment...',
        'SUCCESS: Discovered 1 candidate application:',
        '  - App ID: java-tomcat-98a2',
        '    Type: Java Tomcat WebApp',
        '    Ports: [8080]',
        '    Path: /var/lib/tomcat9/webapps/legacy-app',
        '    Platform: Linux RHEL v8.4'
      ]);
    } else if (step === 1) {
      setA2cTerminalOutput([
        '$ app2container analyze --application-id java-tomcat-98a2',
        'Analyzing runtime parameters and library binaries...',
        'Creating dynamic profile mapping profile.json...',
        'SUCCESS: Profile generated successfully.',
        'Analyzing dependencies:',
        '  - Tomcat version: v9.0.38',
        '  - Java version: OpenJDK 11.0.12',
        '  - Shared mounts: /mnt/nfs/shared-assets',
        '  - OS ports bound: 8080'
      ]);
    } else if (step === 2) {
      setA2cTerminalOutput([
        '$ app2container containerize --application-id java-tomcat-98a2',
        'Extracting binaries, configs, and assets...',
        'Compiling localized production-ready Dockerfile...',
        'Running Docker daemon build process...',
        '  - [Layer 1/3] FROM openjdk:11-jre-slim',
        '  - [Layer 2/3] COPY assets/ /var/lib/tomcat9/...',
        '  - [Layer 3/3] EXPOSE 8080',
        'SUCCESS: Compiled container image: java-tomcat-98a2:latest',
        'Saved Docker tarball inside local working workspace.'
      ]);
    } else if (step === 3) {
      setA2cTerminalOutput([
        '$ app2container generate-app-deployment --application-id java-tomcat-98a2',
        'Provisioning target cloud deployment artifacts...',
        'Generating CloudFormation infrastructure stack...',
        'Generating ECS Task Definitions & Service YAMLs...',
        'Generating Kubernetes (EKS) Helm Charts & PVC yaml...',
        'SUCCESS: Full build artifacts generated successfully:',
        '  - ecs-deployment.cfn.yaml',
        '  - eks-helm-charts-bundle.tar.gz',
        '  - push-images-to-ecr.sh',
        'Ready for deployment using AWS CLI or Git Pipeline.'
      ]);
    }
  };

  // Tab 6: Simulation States
  const [simTrafficLevel, setSimTrafficLevel] = useState<'low' | 'normal' | 'surge'>('normal');
  const [simTasks, setSimTasks] = useState<SimTask[]>([
    { id: 'task-web-1', name: 'WebTask-5a71', type: 'web', status: 'RUNNING', cpu: 12, memory: 180, uptime: 120 },
    { id: 'task-web-2', name: 'WebTask-9d32', type: 'web', status: 'RUNNING', cpu: 15, memory: 190, uptime: 90 },
    { id: 'task-worker-1', name: 'SqsWorker-8c11', type: 'worker', status: 'RUNNING', cpu: 5, memory: 120, uptime: 240 }
  ]);
  const [sqsQueueDepth, setSqsQueueDepth] = useState<number>(3);
  const [simLogs, setSimLogs] = useState<string[]>([
    'ℹ️ Container environment simulated successfully.',
    '🟢 ECS Service Web-Service: Registered 2 tasks in target group.',
    '🟢 ECS Service Worker-Service: Listening on queue aws-jobs-queue.',
  ]);
  const [simIsRunning, setSimIsRunning] = useState<boolean>(true);
  const [autoScaleEnabled, setAutoScaleEnabled] = useState<boolean>(true);
  const [simStatsHistory, setSimStatsHistory] = useState<{ time: string; cpu: number; tasks: number; queue: number }[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ title: string; desc: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Log Event helper
  const logEvent = (msg: string) => {
    setSimLogs((prev) => {
      const time = new Date().toLocaleTimeString();
      return [`[${time}] ${msg}`, ...prev.slice(0, 19)];
    });
  };

  // Add Alerts helper
  const triggerAlert = (title: string, desc: string, type: 'info' | 'error' | 'success' = 'info') => {
    setActiveAlert({ title, desc, type });
    setTimeout(() => {
      setActiveAlert(null);
    }, 6000);
  };

  // Task state management loops
  useEffect(() => {
    if (!simIsRunning) return;

    const interval = setInterval(() => {
      // 1. Increment task uptimes & mathematical load distribution
      setSimTasks((prevTasks: SimTask[]): SimTask[] => {
        const runningWebCount = prevTasks.filter(t => t.type === 'web' && t.status === 'RUNNING').length || 1;

        // Define base traffic loads
        let targetTraffic = 50; // normal
        if (simTrafficLevel === 'low') targetTraffic = 15;
        if (simTrafficLevel === 'surge') targetTraffic = 240;

        return prevTasks.map((t: SimTask): SimTask => {
          if (t.status === 'PROVISIONING') {
            const finishedProvisioning = Math.random() > 0.6;
            if (finishedProvisioning) {
              logEvent(`ℹ️ Task ${t.name} state changed to: RUNNING.`);
              return { ...t, status: 'RUNNING' as const, uptime: 0 };
            }
            return { ...t, uptime: t.uptime + 1 };
          }
          if (t.status === 'RUNNING') {
            const uptime = t.uptime + 1;
            let nextCpu = t.cpu;
            if (t.type === 'web') {
              // Mathematical ALB load distribution: CPU is totalTraffic / runningWebCount + noise
              const baseCpu = targetTraffic / runningWebCount;
              const noise = Math.floor(Math.random() * 11) - 5; // -5 to 5
              nextCpu = Math.max(5, Math.min(98, Math.round(baseCpu + noise)));
            } else if (t.type === 'worker') {
              // Worker CPU is related to SQS queue depth
              const baseCpu = sqsQueueDepth > 0 ? Math.min(85, 20 + sqsQueueDepth * 8) : 10;
              const noise = Math.floor(Math.random() * 9) - 4;
              nextCpu = Math.max(5, Math.min(95, Math.round(baseCpu + noise)));
            } else {
              // Cron task load
              nextCpu = Math.max(40, Math.min(80, t.cpu + Math.floor(Math.random() * 11) - 5));
            }
            return { ...t, uptime, cpu: nextCpu };
          }
          return t;
        }).filter((t: SimTask): boolean => t.status !== 'STOPPED');
      });

      // 2. Queue consumption
      const runningWorkers = simTasks.filter(t => t.type === 'worker' && t.status === 'RUNNING');
      if (runningWorkers.length > 0 && sqsQueueDepth > 0) {
        const itemsToProcess = Math.min(runningWorkers.length, sqsQueueDepth);
        setSqsQueueDepth(prev => Math.max(0, prev - itemsToProcess));
        for (let i = 0; i < itemsToProcess; i++) {
          const worker = runningWorkers[i];
          logEvent(`📦 Task ${worker.name} popped 1 job from SQS Queue. Processing...`);
        }
      }

      // 3. Auto scaling logic
      if (autoScaleEnabled) {
        // Scale workers based on SQS queue depth
        const totalWorkers = simTasks.filter(t => t.type === 'worker');
        if (sqsQueueDepth > 6 && totalWorkers.length < 5 && !simTasks.some(t => t.status === 'PROVISIONING' && t.type === 'worker')) {
          // Scale UP workers
          const newId = `task-worker-${Math.floor(Math.random() * 10000)}`;
          const newName = `SqsWorker-${Math.floor(Math.random() * 4096).toString(16)}`;
          logEvent(`📈 [CloudWatch Alarm] SQS Queue Depth > 5! Triggering ECS Service Scaling policy.`);
          logEvent(`🐳 ECS Agent scheduling new task in cluster: ${newName}. State: PROVISIONING.`);
          setSimTasks(prev => [...prev, { id: newId, name: newName, type: 'worker', status: 'PROVISIONING', cpu: 0, memory: 128, uptime: 0 }]);
        } else if (sqsQueueDepth === 0 && totalWorkers.length > 1 && !simTasks.some(t => t.status === 'PROVISIONING')) {
          // Scale DOWN workers (scale down slowest one)
          const target = totalWorkers[totalWorkers.length - 1];
          logEvent(`📉 [Auto Scaling] Queue is empty. De-registering worker task ${target.name}.`);
          logEvent(`🛑 Intercepting ECS Task State Change via EventBridge: ${target.name} (RUNNING -> STOPPED).`);
          setSimTasks(prev => prev.map(t => t.id === target.id ? { ...t, status: 'STOPPED' as const } : t));
        }

        // Scale web tasks based on load
        // Keep active web tasks scaling inside 2-5 tasks
        const webTasks = simTasks.filter(t => t.type === 'web');
        const avgCpu = webTasks.reduce((acc, t) => acc + t.cpu, 0) / (webTasks.length || 1);
        if (avgCpu > 70 && webTasks.length < 5 && !simTasks.some(t => t.status === 'PROVISIONING' && t.type === 'web')) {
          const newId = `task-web-${Math.floor(Math.random() * 10000)}`;
          const newName = `WebTask-${Math.floor(Math.random() * 4096).toString(16)}`;
          logEvent(`📈 [CloudWatch Alarm] High Service CPU utilization (${avgCpu.toFixed(0)}%)! Scaling out Web-Service.`);
          setSimTasks(prev => [...prev, { id: newId, name: newName, type: 'web', status: 'PROVISIONING', cpu: 0, memory: 256, uptime: 0 }]);
        } else if (avgCpu < 30 && webTasks.length > 2 && !simTasks.some(t => t.status === 'PROVISIONING')) {
          // Scale down Web tasks
          const target = webTasks[webTasks.length - 1];
          logEvent(`📉 [Auto Scaling] Service CPU is low (${avgCpu.toFixed(0)}%). De-registering WebTask ${target.name}.`);
          logEvent(`🛑 Intercepting ECS Task State Change via EventBridge: ${target.name} (RUNNING -> STOPPED).`);
          setSimTasks(prev => prev.map(t => t.id === target.id ? { ...t, status: 'STOPPED' as const } : t));
        }
      }

      // 4. Update charting history
      setSimStatsHistory((prev) => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const avgCpu = simTasks.reduce((acc, t) => acc + t.cpu, 0) / (simTasks.length || 1);
        const nextHist = [...prev, {
          time: nextTime,
          cpu: Math.round(avgCpu || 10),
          tasks: simTasks.filter(t => t.status === 'RUNNING').length,
          queue: sqsQueueDepth
        }];
        return nextHist.slice(-12); // keep last 12 points
      });

    }, 2500);

    return () => clearInterval(interval);
  }, [simIsRunning, simTasks, sqsQueueDepth, autoScaleEnabled, simTrafficLevel]);

  // Simulator Actions
  const handleAddSqsJob = () => {
    setSqsQueueDepth(prev => prev + 3);
    logEvent(`📥 Injected 3 messages into SQS Queue aws-jobs-queue.`);
  };

  const handleManualScaleUp = (type: 'web' | 'worker') => {
    const newId = `task-${type}-${Math.floor(Math.random() * 10000)}`;
    const prefix = type === 'web' ? 'WebTask' : 'SqsWorker';
    const newName = `${prefix}-${Math.floor(Math.random() * 4096).toString(16)}`;
    logEvent(`➕ Manual Action: ECS run-task invoked. Starting ${newName}...`);
    setSimTasks(prev => [...prev, { id: newId, name: newName, type, status: 'PROVISIONING', cpu: 0, memory: type === 'web' ? 256 : 128, uptime: 0 }]);
  };

  const handleKillTask = (id: string, name: string) => {
    logEvent(`💥 Force Terminated ECS Task: ${name}.`);
    logEvent(`⚠️ ECS State Change Intercepted: Task ${name} crashed/stopped. Routing alert via EventBridge...`);
    triggerAlert(
      `🚨 ECS Task Stopped: ${name}`,
      `An EventBridge rule matched the state change. Event pattern: { "source": ["aws.ecs"], "detail-type": ["ECS Task State Change"], "detail": { "lastStatus": ["STOPPED"] } }. Notification successfully routed to SNS Topic [admin-slack-alerts].`,
      'error'
    );
    setSimTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'STOPPED' as const } : t));
  };

  const handleEventBridgeCron = () => {
    logEvent(`⏰ EventBridge Rule [NightlyBatchScheduler] triggered by cron(0 2 * * ? *).`);
    const newId = `task-cron-${Math.floor(Math.random() * 10000)}`;
    const newName = `BatchTask-${Math.floor(Math.random() * 4096).toString(16)}`;
    logEvent(`🐳 EventBridge target matched: Invoking ad-hoc ECS Task: ${newName}`);
    setSimTasks(prev => [...prev, { id: newId, name: newName, type: 'cron', status: 'PROVISIONING', cpu: 0, memory: 512, uptime: 0 }]);

    // Self terminate cron task after 8 seconds
    setTimeout(() => {
      logEvent(`✅ Ad-hoc task ${newName} successfully completed daily batch processing and exited (stopped).`);
      logEvent(`🔄 ECS container execution finished. Clean exit code: 0.`);
      setSimTasks(prev => prev.map(t => t.id === newId ? { ...t, status: 'STOPPED' as const } : t));
    }, 8000);
  };

  const handleChaosCrash = () => {
    const active = simTasks.filter(t => t.status === 'RUNNING');
    if (active.length === 0) {
      logEvent('⚠️ Chaos Engine: No running tasks to crash.');
      return;
    }
    const target = active[Math.floor(Math.random() * active.length)];
    handleKillTask(target.id, target.name);
  };



  return (
    <div className="ecs-container">
      {/* Styles for premium animations */}
      <style>{`
        .ecs-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 24px;
          border-radius: 16px;
        }
        .ecs-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .ecs-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Glassmorphic card & solver elements */
        .ecs-card {
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ecs-card:hover {
          border-color: #eab308;
          box-shadow: 0 12px 24px -4px rgba(234, 179, 8, 0.08), 0 4px 12px -2px rgba(234, 179, 8, 0.03);
          transform: translateY(-1px);
        }
        
        .ecs-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .ecs-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .ecs-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }
        .ecs-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .ecs-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .ecs-tb.ecs-on {
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);
        }
        
        /* Form inputs & controls */
        .ecs-input, .ecs-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          transition: all 0.15s ease;
        }
        .ecs-input:focus, .ecs-select:focus {
          border-color: #eab308;
          box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.12);
        }
        
        .ecs-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1.5px solid transparent;
          user-select: none;
          outline: none;
        }
        .ecs-btn-primary {
          background: #eab308;
          color: #ffffff;
          border-color: #eab308;
        }
        .ecs-btn-primary:hover {
          background: #ca8a04;
          border-color: #ca8a04;
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.15);
        }
        .ecs-btn-secondary {
          background: #ffffff;
          color: #334155;
          border-color: #cbd5e1;
        }
        .ecs-btn-secondary:hover {
          background: #f1f5f9;
        }
        
        .anl-btn {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          background: #ffffff;
          color: #475569;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .anl-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .anl-btn.anl-on-nlb {
          background: #fef9c3;
          color: #a16207;
          border-color: #fde047;
          box-shadow: 0 3px 10px rgba(234, 179, 8, 0.1);
        }
        .anl-btn.anl-on {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        
        /* Custom dynamic visualizer backdrops */
        .ecs-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(203, 213, 225, 0.45) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        
        .im-pulse {
          animation: nodePulse 2s infinite alternate;
        }
        @keyframes nodePulse {
          0% { box-shadow: 0 0 2px rgba(16, 185, 129, 0.3); r: 2.5; opacity: 0.85; }
          100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); r: 4; opacity: 1; }
        }
        
        .active-svg-glow {
          animation: activeGlow 2.5s infinite alternate;
        }
        @keyframes activeGlow {
          0% { filter: drop-shadow(0 0 2px rgba(234, 179, 8, 0.1)); }
          100% { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.35)); }
        }
        
        .flow-line-active {
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }
        
        /* Realistic Code Editor Terminals */
        .ecs-code-terminal {
          background: #090d16;
          border: 1.5px solid #1e293b;
          border-radius: 12px;
          padding: 16px;
          color: #94a3b8;
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          line-height: 1.6;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
        }
        .ecs-code-line {
          display: block;
          padding: 2px 8px;
          border-radius: 4px;
          border-left: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .ecs-code-line-highlight {
          background: rgba(234, 179, 8, 0.08);
          border-left-color: #eab308;
          color: #f1f5f9;
        }
        .ecs-code-comment {
          color: #475569;
          font-style: italic;
        }
        .ecs-code-keyword {
          color: #f43f5e;
          font-weight: bold;
        }
        .ecs-code-value {
          color: #38bdf8;
        }
        
        /* Comprehensive Table Styles */
        .ecs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          margin-top: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
        }
        .ecs-table th {
          background: #f8fafc;
          text-align: left;
          padding: 8px 12px;
          font-weight: 700;
          color: #475569;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.85);
        }
        .ecs-table td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          color: #334155;
        }
        .ecs-table tr:hover td {
          background: #f8fafc;
        }
        
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .badge-teal { background: #f0fdfa; color: #0f766e; border: 1.5px solid #99f6e4; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; }
        .badge-amber { background: #fffbeb; color: #b45309; border: 1.5px solid #fde047; }
        .badge-purple { background: #faf5ff; color: #6b21a8; border: 1.5px solid #e9d5ff; }
        .badge-coral { background: #fff5f5; color: #c53030; border: 1.5px solid #feb2b2; }

        /* Centralized Dark Mode Overrides for ElasticContainersVisualizer.tsx */
        .dark .ecs-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .ecs-card,
        .dark [class*="ecs-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .ecs-card b,
        .dark .ecs-card strong,
        .dark .ecs-card h3,
        .dark .ecs-card h4 {
          color: #ffffff !important;
        }
        .dark .ecs-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .ecs-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .ecs-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .ecs-sec,
        .dark .ecs-kk {
          color: #94a3b8 !important;
        }
        .dark .ecs-log,
        .dark .ecs-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .ecs-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .ecs-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .ecs-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.ecs-ck li {
          color: #cbd5e1 !important;
        }
        .dark .ecs-inst,
        .dark .ecs-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .ecs-inst .meta,
        .dark .ecs-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .ecs-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .ecs-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .ecs-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .ecs-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .ecs-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        
        /* General form overrides */
        .dark select,
        .dark input,
        .dark textarea {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: rgba(51, 65, 85, 0.8) !important;
        }
        .dark select option {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
          `}</style>

      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">📦</span>
            <h1 className="text-2xl font-bold text-gray-900">AWS Elastic Containers &amp; Kubernetes</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Deep dive into Docker, Amazon ECS (EC2 vs Fargate architectures), Amazon EKS Control Plane, CSI storage volumes, and modern app virtualization pipelines.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="badge badge-teal">AWS Certified Solutions Architect</span>
          <span className="badge badge-blue">Advanced Infrastructure</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="ecs-tabs">
        <button className={`ecs-tb ${activeTab === 'intro' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <Layers className="w-4 h-4" /> Docker vs VMs
        </button>
        <button className={`ecs-tb ${activeTab === 'ecs-core' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('ecs-core')}>
          <Cpu className="w-4 h-4" /> Amazon ECS &amp; ECR
        </button>
        <button className={`ecs-tb ${activeTab === 'ecs-advanced' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('ecs-advanced')}>
          <Settings className="w-4 h-4" /> ECS Advanced Patterns
        </button>
        <button className={`ecs-tb ${activeTab === 'eks-k8s' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('eks-k8s')}>
          <Database className="w-4 h-4" /> Amazon EKS (Kubernetes)
        </button>
        <button className={`ecs-tb ${activeTab === 'runner-migration' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('runner-migration')}>
          <RefreshCw className="w-4 h-4" /> App Runner &amp; Migrate
        </button>
        <button className={`ecs-tb ${activeTab === 'simulation' ? 'ecs-on' : ''}`} onClick={() => setActiveTab('simulation')}>
          <Play className="w-4 h-4" /> Auto-Scaling Playground
        </button>
      </div>

      {/* Alert Banner */}
      {activeAlert && (
        <div className={`mb-4 border-l-4 p-4 rounded-r-md flex items-start gap-3 transition-all duration-300 ${activeAlert.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
            activeAlert.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
              'bg-blue-50 border-blue-500 text-blue-700'
          }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 ${activeAlert.type === 'error' ? 'text-red-500' : activeAlert.type === 'success' ? 'text-green-500' : 'text-blue-500'}`} />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">{activeAlert.title}</h4>
            <p className="text-xs mt-1 leading-relaxed">{activeAlert.desc}</p>
          </div>
        </div>
      )}

      {/* Main panels */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[500px]">

        {/* TAB 1: DOCKER VS VM BASICS */}
        {activeTab === 'intro' && (
          <div className="space-y-8 animate-fade-in">
            {/* Row 1: Dual Column Comparison & Stack Card */}
            <div className="ecs-grid">
              {/* Left Column: Toggles & Scorecard */}
              <div className="ecs-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  ⚖️ Containerization Model vs. Virtual Machines
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Virtual Machines virtualize the underlying <b>hardware</b> layers (requiring a hypervisor emulation and a full duplicate Guest OS inside each machine). In contrast, Containers virtualize the <b>Operating System kernel</b> directly, sharing the host OS kernel and sandbox-isolating software layers using built-in Linux features.
                </p>

                <div className="flex gap-2.5 mb-4">
                  <button
                    className={`anl-btn ${dockerVmView === 'container' ? 'anl-on-nlb' : ''}`}
                    onClick={() => setDockerVmView('container')}
                  >
                    🐳 Docker Containers
                  </button>
                  <button
                    className={`anl-btn ${dockerVmView === 'vm' ? 'anl-on' : ''}`}
                    onClick={() => setDockerVmView('vm')}
                  >
                    🖥️ Virtual Machines
                  </button>
                </div>

                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mt-4 mb-2">Architectural Comparison Metrics</span>
                <table className="ecs-table">
                  <thead>
                    <tr>
                      <th>Capability</th>
                      <th>🐳 Docker Containers</th>
                      <th>🖥️ Virtual Machines</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">OS Kernel Allocation</td>
                      <td className="text-green-600 font-medium">Shared Host Kernel (Direct Syscalls)</td>
                      <td className="text-blue-600 font-medium">Isolated Guest OS (Double-layered Kernel)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Storage Footprint</td>
                      <td className="text-green-600 font-medium">Very Light (~40MB - 200MB)</td>
                      <td className="text-amber-600 font-medium">Heavy / Bulk (~10GB - 30GB per VM)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Startup Boot Times</td>
                      <td className="text-green-600 font-medium">Instantaneous (&lt; 1 second)</td>
                      <td className="text-amber-600 font-medium">Slow boot delays (Minutes)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Operations Density</td>
                      <td className="text-green-600 font-medium">High (Hundreds of tasks per host)</td>
                      <td className="text-amber-600 font-medium">Low (Dozens of VMs per host max)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Security Boundaries</td>
                      <td className="text-amber-600 font-medium">OS Namespace &amp; cgroup Isolation</td>
                      <td className="text-green-600 font-medium">Hardware-level Hypervisor Partitioning</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column: Dynamic Architectural Stack Card */}
              <div className="ecs-card flex flex-col justify-between">
                <div>
                  <h4 className="ecs-card-title">
                    {dockerVmView === 'container' ? '🐳 Containerization Stack (Shared Host OS)' : '🖥️ Virtual Machine Stack (Hardware Hypervisor)'}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    {dockerVmView === 'container'
                      ? 'Note how Docker bypasses hypervisor emulation completely! Multiple containers share the base Host OS kernel directly, while keeping files, namespaces, and memory allocations strictly partitioned.'
                      : 'Every virtual machine bundles a massive duplicate operating system stack. The hypervisor layer emulates complete virtual motherboard, CPU, and network card components, creating massive execution overhead.'}
                  </p>
                </div>

                {/* Animated stacked box visualization */}
                <div className="border border-gray-200 rounded-xl p-4 bg-slate-50 shadow-inner flex flex-col items-center w-full">
                  <svg width="100%" height="280" viewBox="0 0 320 280" className="ecs-svg-bg rounded-lg border border-slate-200 bg-white">
                    {/* Definitions for 3D Gradients */}
                    <defs>
                      <linearGradient id="infraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="kernelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <linearGradient id="dockerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="hyperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#c2410c" />
                      </linearGradient>
                      
                      <linearGradient id="appAGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <linearGradient id="appBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="appCGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>

                      <linearGradient id="libGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#94a3b8" />
                      </linearGradient>
                      <linearGradient id="guestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="100%" stopColor="#ca8a04" />
                      </linearGradient>
                    </defs>

                    {dockerVmView === 'container' ? (
                      <g>
                        {/* 1. Infrastructure Layer */}
                        <polygon points="30,240 250,240 280,225 60,225" fill="url(#infraGrad)" stroke="#0f172a" strokeWidth="0.5" />
                        <polygon points="30,240 250,240 250,252 30,252" fill="#0f172a" />
                        <polygon points="250,240 280,225 280,237 250,252" fill="#020617" />
                        <text x="145" y="247" textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="bold" fontFamily="monospace">💻 BARE METAL / AWS EC2 INFRASTRUCTURE</text>

                        {/* 2. Shared Host OS Kernel */}
                        <polygon points="40,210 240,210 268,198 68,198" fill="url(#kernelGrad)" stroke="#1e293b" strokeWidth="0.5" />
                        <polygon points="40,210 240,210 240,222 40,222" fill="#1e293b" />
                        <polygon points="240,210 268,198 268,210 240,222" fill="#0f172a" />
                        <text x="145" y="217" textAnchor="middle" fontSize="7" fill="#e2e8f0" fontWeight="bold">🐧 SHARED HOST OS KERNEL (LINUX)</text>

                        {/* 3. Container Engine Layer */}
                        <polygon points="50,180 230,180 256,168 76,168" fill="url(#dockerGrad)" stroke="#0369a1" strokeWidth="0.5" className="active-svg-glow" />
                        <polygon points="50,180 230,180 230,192 50,192" fill="#0284c7" />
                        <polygon points="230,180 256,168 256,180 230,192" fill="#0369a1" />
                        <text x="145" y="187" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">🐳 CONTAINER ENGINE (CONTAINERD / DOCKER)</text>

                        {/* Three container stacks side-by-side! */}
                        {/* Container A */}
                        <g>
                          {/* Libs/Bins Layer */}
                          <polygon points="60,145 105,145 120,137 75,137" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="60,145 105,145 105,155 60,155" fill="#94a3b8" />
                          <polygon points="105,145 120,137 120,147 105,155" fill="#64748b" />
                          <text x="86" y="152" textAnchor="middle" fontSize="6" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App A Layer */}
                          <polygon points="60,110 105,110 120,102 75,102" fill="url(#appAGrad)" stroke="#0891b2" strokeWidth="0.5" />
                          <polygon points="60,110 105,110 105,125 60,125" fill="#0891b2" />
                          <polygon points="105,110 120,102 120,117 105,125" fill="#0369a1" />
                          <text x="86" y="121" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" className="animate-pulse">App A</text>
                        </g>

                        {/* Container B */}
                        <g>
                          {/* Libs/Bins Layer */}
                          <polygon points="115,145 160,145 175,137 130,137" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="115,145 160,145 160,155 115,155" fill="#94a3b8" />
                          <polygon points="160,145 175,137 175,147 160,155" fill="#64748b" />
                          <text x="141" y="152" textAnchor="middle" fontSize="6" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App B Layer */}
                          <polygon points="115,110 160,110 175,102 130,102" fill="url(#appBGrad)" stroke="#059669" strokeWidth="0.5" />
                          <polygon points="115,110 160,110 160,125 115,125" fill="#059669" />
                          <polygon points="160,110 175,102 175,117 160,125" fill="#047857" />
                          <text x="141" y="121" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" className="animate-pulse">App B</text>
                        </g>

                        {/* Container C */}
                        <g>
                          {/* Libs/Bins Layer */}
                          <polygon points="170,145 215,145 230,137 185,137" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="170,145 215,145 215,155 170,155" fill="#94a3b8" />
                          <polygon points="215,145 230,137 230,147 215,155" fill="#64748b" />
                          <text x="196" y="152" textAnchor="middle" fontSize="6" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App C Layer */}
                          <polygon points="170,110 215,110 230,102 185,102" fill="url(#appCGrad)" stroke="#4f46e5" strokeWidth="0.5" />
                          <polygon points="170,110 215,110 215,125 170,125" fill="#4f46e5" />
                          <polygon points="215,110 230,102 230,117 215,125" fill="#3730a3" />
                          <text x="196" y="121" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" className="animate-pulse">App C</text>
                        </g>

                        {/* Connection indicators showing shared kernel direct syscall paths */}
                        <path d="M 86,155 L 86,198" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" />
                        <path d="M 141,155 L 141,198" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" />
                        <path d="M 196,155 L 196,198" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" />
                        <text x="240" y="75" fontSize="7.5" fill="#15803d" fontWeight="bold">⚡ Direct Syscalls</text>
                        <text x="240" y="86" fontSize="6.5" fill="#166534">Zero OS duplication</text>
                      </g>
                    ) : (
                      <g>
                        {/* 1. Infrastructure Layer */}
                        <polygon points="30,240 250,240 280,225 60,225" fill="url(#infraGrad)" stroke="#0f172a" strokeWidth="0.5" />
                        <polygon points="30,240 250,240 250,252 30,252" fill="#0f172a" />
                        <polygon points="250,240 280,225 280,237 250,252" fill="#020617" />
                        <text x="145" y="247" textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="bold" fontFamily="monospace">💻 BARE METAL / AWS EC2 INFRASTRUCTURE</text>

                        {/* 2. Hypervisor Layer */}
                        <polygon points="40,210 240,210 268,198 68,198" fill="url(#hyperGrad)" stroke="#c2410c" strokeWidth="0.5" className="active-svg-glow" />
                        <polygon points="40,210 240,210 240,222 40,222" fill="#ea580c" />
                        <polygon points="240,210 268,198 268,210 240,222" fill="#c2410c" />
                        <text x="145" y="217" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">⚙️ HYPERVISOR (AWS NITRO / EMULATOR)</text>

                        {/* Three heavy VM columns side-by-side! */}
                        {/* VM A */}
                        <g>
                          {/* Guest OS Layer */}
                          <polygon points="55,178 100,178 112,170 67,170" fill="url(#guestGrad)" stroke="#ca8a04" strokeWidth="0.5" />
                          <polygon points="55,178 100,178 100,188 55,188" fill="#ca8a04" />
                          <polygon points="100,178 112,170 112,180 100,188" fill="#a16207" />
                          <text x="81" y="184" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold">Guest OS A</text>

                          {/* Libs/Bins Layer */}
                          <polygon points="55,150 100,150 112,142 67,142" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="55,150 100,150 100,160 55,160" fill="#94a3b8" />
                          <polygon points="100,150 112,142 112,152 100,160" fill="#64748b" />
                          <text x="81" y="156" textAnchor="middle" fontSize="6.5" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App A Layer */}
                          <polygon points="55,122 100,122 112,114 67,114" fill="url(#appAGrad)" stroke="#0891b2" strokeWidth="0.5" />
                          <polygon points="55,122 100,122 100,132 55,132" fill="#0891b2" />
                          <polygon points="100,122 112,114 112,124 100,132" fill="#0369a1" />
                          <text x="81" y="128" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold" className="animate-pulse">App A</text>
                        </g>

                        {/* VM B */}
                        <g>
                          {/* Guest OS Layer */}
                          <polygon points="110,178 155,178 167,170 122,170" fill="url(#guestGrad)" stroke="#ca8a04" strokeWidth="0.5" />
                          <polygon points="110,178 155,178 155,188 110,188" fill="#ca8a04" />
                          <polygon points="155,178 167,170 167,180 155,188" fill="#a16207" />
                          <text x="136" y="184" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold">Guest OS B</text>

                          {/* Libs/Bins Layer */}
                          <polygon points="110,150 155,150 167,142 122,142" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="110,150 155,150 155,160 110,160" fill="#94a3b8" />
                          <polygon points="155,150 167,142 167,152 155,160" fill="#64748b" />
                          <text x="136" y="156" textAnchor="middle" fontSize="6.5" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App B Layer */}
                          <polygon points="110,122 155,122 167,114 122,114" fill="url(#appBGrad)" stroke="#059669" strokeWidth="0.5" />
                          <polygon points="110,122 155,122 155,132 110,132" fill="#059669" />
                          <polygon points="155,122 167,114 167,124 155,132" fill="#047857" />
                          <text x="136" y="128" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold" className="animate-pulse">App B</text>
                        </g>

                        {/* VM C */}
                        <g>
                          {/* Guest OS Layer */}
                          <polygon points="165,178 210,178 222,170 177,170" fill="url(#guestGrad)" stroke="#ca8a04" strokeWidth="0.5" />
                          <polygon points="165,178 210,178 210,188 165,188" fill="#ca8a04" />
                          <polygon points="210,178 222,170 222,180 210,188" fill="#a16207" />
                          <text x="191" y="184" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold">Guest OS C</text>

                          {/* Libs/Bins Layer */}
                          <polygon points="165,150 210,150 222,142 177,142" fill="url(#libGrad)" stroke="#64748b" strokeWidth="0.5" />
                          <polygon points="165,150 210,150 210,160 165,160" fill="#94a3b8" />
                          <polygon points="210,150 222,142 222,152 210,160" fill="#64748b" />
                          <text x="191" y="156" textAnchor="middle" fontSize="6.5" fill="#1e293b" fontWeight="bold" fontFamily="monospace">libs / bins</text>

                          {/* App C Layer */}
                          <polygon points="165,122 210,122 222,114 177,114" fill="url(#appCGrad)" stroke="#4f46e5" strokeWidth="0.5" />
                          <polygon points="165,122 210,122 210,132 165,132" fill="#4f46e5" />
                          <polygon points="210,122 222,114 222,124 210,132" fill="#3730a3" />
                          <text x="191" y="128" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold" className="animate-pulse">App C</text>
                        </g>

                        {/* Connection indicators showing hypervisor translation traps */}
                        <path d="M 81,188 L 81,210" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                        <path d="M 136,188 L 136,210" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                        <path d="M 191,188 L 191,210" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                        <text x="235" y="75" fontSize="7.5" fill="#b91c1c" fontWeight="bold">⚠️ Emulated Hardware</text>
                        <text x="235" y="86" fontSize="6.5" fill="#991b1b">Severe memory footprint</text>
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 2: Interactive Dockerfile Builder & Code Editor */}
            <div className="ecs-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                🐳 Interactive Dockerfile &amp; Layer Architecture
              </h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                A Docker image consists of <b>read-only, cached filesystem layers</b>. Each command in a Dockerfile creates a new layer. When running a container, Docker mounts a thin <b>writeable container layer</b> on top.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Base Parent Image</label>
                    <select
                      className="ecs-select"
                      value={dfBaseImage}
                      onChange={(e) => setDfBaseImage(e.target.value)}
                      onFocus={() => setFocusedDfField('base')}
                      onBlur={() => setFocusedDfField(null)}
                    >
                      <option value="node:18-alpine">node:18-alpine (Ultra-light, ~40MB)</option>
                      <option value="node:18-slim">node:18-slim (No build utilities, ~150MB)</option>
                      <option value="node:18">node:18 (Full Ubuntu core, ~900MB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Container WORKDIR</label>
                    <input
                      type="text"
                      className="ecs-input font-mono"
                      value={dfWorkdir}
                      onChange={(e) => setDfWorkdir(e.target.value)}
                      onFocus={() => setFocusedDfField('workdir')}
                      onBlur={() => setFocusedDfField(null)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Install Command</label>
                    <input
                      type="text"
                      className="ecs-input font-mono"
                      value={dfInstall}
                      onChange={(e) => setDfInstall(e.target.value)}
                      onFocus={() => setFocusedDfField('install')}
                      onBlur={() => setFocusedDfField(null)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Environment Port</label>
                    <input
                      type="text"
                      className="ecs-input font-mono"
                      value={dfEnvPort}
                      onChange={(e) => setDfEnvPort(e.target.value)}
                      onFocus={() => setFocusedDfField('port')}
                      onBlur={() => setFocusedDfField(null)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Startup command (CMD)</label>
                    <input
                      type="text"
                      className="ecs-input font-mono"
                      value={dfCmd}
                      onChange={(e) => setDfCmd(e.target.value)}
                      onFocus={() => setFocusedDfField('cmd')}
                      onBlur={() => setFocusedDfField(null)}
                    />
                  </div>
                </div>

                {/* Right side Dockerfile preview terminal */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      💻 Interactive Dockerfile Terminal
                    </span>
                    <div className="ecs-code-terminal">
                      <div className={`ecs-code-line ${focusedDfField === 'base' ? 'ecs-code-line-highlight' : ''}`}>
                        <span className="ecs-code-comment"># Step 1: Base parent image layer</span><br />
                        <span className="ecs-code-keyword">FROM</span> <span className="ecs-code-value">{dfBaseImage}</span>
                      </div>
                      <div className={`ecs-code-line ${focusedDfField === 'workdir' ? 'ecs-code-line-highlight' : ''}`}>
                        <span className="ecs-code-comment"># Step 2: Establish working directory inside container</span><br />
                        <span className="ecs-code-keyword">WORKDIR</span> <span className="ecs-code-value">{dfWorkdir}</span>
                      </div>
                      <div className="ecs-code-line">
                        <span className="ecs-code-comment"># Step 3: Copy package dependency manifest</span><br />
                        <span className="ecs-code-keyword">COPY</span> <span className="ecs-code-value">package*.json ./</span>
                      </div>
                      <div className={`ecs-code-line ${focusedDfField === 'install' ? 'ecs-code-line-highlight' : ''}`}>
                        <span className="ecs-code-comment"># Step 4: Run dependency install (creates cached layer)</span><br />
                        <span className="ecs-code-keyword">RUN</span> <span className="ecs-code-value">{dfInstall}</span>
                      </div>
                      <div className="ecs-code-line">
                        <span className="ecs-code-comment"># Step 5: Copy application source code files</span><br />
                        <span className="ecs-code-keyword">COPY</span> <span className="ecs-code-value">. .</span>
                      </div>
                      <div className={`ecs-code-line ${focusedDfField === 'port' ? 'ecs-code-line-highlight' : ''}`}>
                        <span className="ecs-code-comment"># Step 6: Define environment variables &amp; EXPOSE</span><br />
                        <span className="ecs-code-keyword">ENV</span> <span className="ecs-code-value">PORT={dfEnvPort}</span><br />
                        <span className="ecs-code-keyword">EXPOSE</span> <span className="ecs-code-value">{"${PORT}"}</span>
                      </div>
                      <div className={`ecs-code-line ${focusedDfField === 'cmd' ? 'ecs-code-line-highlight' : ''}`}>
                        <span className="ecs-code-comment"># Step 7: Execution command on container start</span><br />
                        <span className="ecs-code-keyword">CMD</span> <span className="ecs-code-value">{dfCmd}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-normal flex items-start gap-2.5">
                    <span className="text-base shrink-0">💡</span>
                    <div>
                      <b>Best Practice: Layer Caching &amp; Speed</b>: Note we `COPY package*.json ./` and run `RUN npm install` <b>before</b> copying the full source files `COPY . .`. This ensures code changes do not invalidate the cached node_modules layer, accelerating subsequent builds from minutes to under 2 seconds!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glossary */}
            <div className="ecs-card">
              <h4 className="ecs-card-title">
                📚 Virtualization &amp; Container Core Glossary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🐧 Host OS Kernel</strong>
                  The core program managing physical hardware resources (CPU, RAM, Disks). Shared directly by all container tasks on the system to achieve near-zero system overhead.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">⚙️ Hypervisor</strong>
                  Virtual machine manager (e.g. AWS Nitro, ESXi, KVM) that emulates complete underlying physical hardware, imposing severe CPU/RAM overhead to run independent OS stacks.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🖥️ Guest OS</strong>
                  The complete, heavy duplicate operating system stack loaded inside virtual machines, responsible for heavy startup delays and redundant RAM footprint costs.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">📦 Container Engine</strong>
                  Virtualization runtime daemon (e.g. `containerd`, Docker) interfacing directly with OS kernel boundaries to spin up sandboxed application zones.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🔒 Linux Namespaces</strong>
                  Core kernel boundary mechanism shielding processes, network adapters, and file mount systems between container environments to guarantee isolation.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🚦 Linux Control Groups (cgroups)</strong>
                  Kernel mechanisms responsible for setting hardware caps, throttling CPU clock speeds and memory thresholds per container.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ECS & ECR CORE */}
        {activeTab === 'ecs-core' && (
          <div className="space-y-8 animate-fade-in">
            {/* ECR Pipeline Workflow */}
            <div className="ecs-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                🚀 Amazon ECR Image Deployment Flow &amp; Wizard
              </h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Amazon Elastic Container Registry (ECR) is a highly scalable, secure private Docker registry. ECS tasks fetch images from ECR repository endpoints. Click any step below to trace the CLI push pipeline.
              </p>

              {/* Push steps horizontal wizard */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 text-center mb-6">
                {[
                  { title: '1. Build', desc: 'docker build' },
                  { title: '2. Login', desc: 'ecr login' },
                  { title: '3. Tag', desc: 'docker tag' },
                  { title: '4. Push', desc: 'docker push' },
                  { title: '5. Repository', desc: 'Registry Store' },
                  { title: '6. ECS Pull', desc: 'Task scheduler' }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${ecrPipelineStep === idx
                        ? 'border-yellow-500 bg-yellow-50 shadow-md scale-105 font-bold'
                        : 'border-gray-200 bg-white hover:border-yellow-300'
                      }`}
                    onClick={() => setEcrPipelineStep(idx)}
                  >
                    <div className="font-bold text-[10.5px] text-yellow-800">{step.title}</div>
                    <div className="text-[9px] text-gray-500 mt-1">{step.desc}</div>
                  </div>
                ))}
              </div>

              {/* Active step details in dark console */}
              <div className="ecs-code-terminal flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-yellow-400 font-bold mb-1 text-[11px] uppercase tracking-wider">
                    Step {ecrPipelineStep + 1} Detailed Operation
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {ecrPipelineStep === 0 && 'Compile source files, configs, and dependencies local to your developer workspace. Docker caches these read-only filesystem layers for ultra-fast subsequent builds.'}
                    {ecrPipelineStep === 1 && 'AWS CLI requests an encrypted authentication token, validating IAM execution credentials, and pipes it straight into the local docker daemon to authenticate the secure registry session.'}
                    {ecrPipelineStep === 2 && 'Alias the local Docker image tag to your unique AWS account ECR Endpoint URI and append target repo name and version labels.'}
                    {ecrPipelineStep === 3 && 'Stream local image layer differences straight to Amazon ECR edge servers. Identical base layers are skipped automatically to optimize internet bandwidth.'}
                    {ecrPipelineStep === 4 && 'The image now resides secure and static in ECR, encrypted at rest via KMS keys and automatically scanned for known operating system vulnerabilities.'}
                    {ecrPipelineStep === 5 && 'The ECS scheduler reads the task definition blueprint, locates the secure ECR repository URI, pulls down image layers, and registers active container tasks.'}
                  </p>
                </div>
                <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[9px] mb-2">// AWS CLI Terminal commands for Step {ecrPipelineStep + 1}</div>
                  <pre className="text-sky-300 text-[10px] overflow-auto whitespace-pre-wrap select-all cursor-pointer font-mono">
                    {ecrPipelineStep === 0 && 'docker build -t my-web-app:latest .'}
                    {ecrPipelineStep === 1 && 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com'}
                    {ecrPipelineStep === 2 && 'docker tag my-web-app:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-web-app:v1.0.0'}
                    {ecrPipelineStep === 3 && 'docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-web-app:v1.0.0'}
                    {ecrPipelineStep === 4 && 'aws ecr describe-images --repository-name my-web-app'}
                    {ecrPipelineStep === 5 && 'aws ecs update-service --cluster production --service web-service --force-new-deployment'}
                  </pre>
                </div>
              </div>
            </div>

            {/* ECS Launch Types & Roles Grid */}
            <div className="ecs-grid">
              {/* Launch type comparison and togglable architecture */}
              <div className="ecs-card flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    🐳 ECS Launch Types: AWS Fargate vs EC2 Host Pools
                  </h3>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Amazon ECS supports two distinct launch models to allocate CPU/RAM compute resources. Toggle options below to trace network boundaries.
                  </p>

                  <div className="flex gap-2 mb-4">
                    <button
                      className={`anl-btn ${ecsLaunchType === 'fargate' ? 'anl-on-nlb' : ''}`}
                      onClick={() => setEcsLaunchType('fargate')}
                    >
                      ⚡ Fargate (Serverless Containers)
                    </button>
                    <button
                      className={`anl-btn ${ecsLaunchType === 'ec2' ? 'anl-on' : ''}`}
                      onClick={() => setEcsLaunchType('ec2')}
                    >
                      💻 EC2 Instances (Managed Pool)
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 bg-slate-50 rounded-xl p-4 flex flex-col items-center shadow-inner mt-2">
                  <span className="text-[11px] font-bold text-slate-700 mb-3 text-center">
                    {ecsLaunchType === 'fargate' ? '🛡️ AWS Fargate: Serverless micro-VM Tasks' : '🔧 ECS EC2: Customer managed EC2 cluster with ECS Agent'}
                  </span>

                  {/* SVG diagram representing Fargate vs EC2 */}
                  <svg width="100%" height="240" viewBox="0 0 400 240" className="ecs-svg-bg rounded-lg border border-gray-200 shadow-sm">
                    {/* Definitions for gradients */}
                    <defs>
                      <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#0369a1" />
                      </linearGradient>
                      <linearGradient id="fargateTaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <linearGradient id="eniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="ec2ChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                      <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#78716c" />
                        <stop offset="100%" stopColor="#44403c" />
                      </linearGradient>
                    </defs>

                    {/* Common ECS Control Plane Scheduler Plate - Flat 3D elevated card */}
                    <g transform="translate(100, 10)">
                      <polygon points="10,30 190,30 200,10 20,10" fill="url(#planeGrad)" stroke="#0ea5e9" strokeWidth="0.5" className="active-svg-glow" />
                      <polygon points="10,30 190,30 190,36 10,36" fill="#0369a1" />
                      <polygon points="190,30 200,10 200,16 190,36" fill="#0c4a6e" />
                      <text x="105" y="23" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffffff" fontFamily="monospace">🧠 ECS CONTROL PLANE (SCHEDULER)</text>
                    </g>

                    {ecsLaunchType === 'fargate' ? (
                      // Fargate Model
                      <g>
                        {/* Subnet Boundaries - Glass 3D box */}
                        <polygon points="20,120 380,120 395,95 35,95" fill="rgba(240, 253, 244, 0.4)" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="35" y="90" fontSize="7" fontWeight="bold" fill="#166534">VPC subnet-1a (10.0.1.0/24) | serverless-subnet</text>

                        {/* Task Fargate 1 */}
                        <g transform="translate(50, 110)">
                          {/* 3D Task body */}
                          <polygon points="5,50 115,50 125,38 15,38" fill="url(#fargateTaskGrad)" stroke="#10b981" strokeWidth="0.5" className="active-svg-glow" />
                          <polygon points="5,50 115,50 115,62 5,62" fill="#047857" />
                          <polygon points="115,50 125,38 125,50 115,62" fill="#064e3b" />
                          <text x="65" y="47" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">ECS Task (Fargate)</text>

                          {/* App Container Layer on top */}
                          <polygon points="15,25 105,25 113,15 23,15" fill="#34d399" stroke="#059669" strokeWidth="0.5" />
                          <polygon points="15,25 105,25 105,34 15,34" fill="#059669" />
                          <polygon points="105,25 113,15 113,24 105,34" fill="#047857" />
                          <text x="64" y="27" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">App Container</text>

                          {/* AWS ENI Plate */}
                          <rect x="25" y="68" width="80" height="15" rx="3" fill="url(#eniGrad)" stroke="#1d4ed8" strokeWidth="0.5" />
                          <text x="65" y="78" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">ENI: 10.0.1.43</text>
                        </g>

                        {/* Task Fargate 2 */}
                        <g transform="translate(220, 110)">
                          {/* 3D Task body */}
                          <polygon points="5,50 115,50 125,38 15,38" fill="url(#fargateTaskGrad)" stroke="#10b981" strokeWidth="0.5" className="active-svg-glow" />
                          <polygon points="5,50 115,50 115,62 5,62" fill="#047857" />
                          <polygon points="115,50 125,38 125,50 115,62" fill="#064e3b" />
                          <text x="65" y="47" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">ECS Task (Fargate)</text>

                          {/* App Container Layer on top */}
                          <polygon points="15,25 105,25 113,15 23,15" fill="#34d399" stroke="#059669" strokeWidth="0.5" />
                          <polygon points="15,25 105,25 105,34 15,34" fill="#059669" />
                          <polygon points="105,25 113,15 113,24 105,34" fill="#047857" />
                          <text x="64" y="27" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">App Container</text>

                          {/* AWS ENI Plate */}
                          <rect x="25" y="68" width="80" height="15" rx="3" fill="url(#eniGrad)" stroke="#1d4ed8" strokeWidth="0.5" />
                          <text x="65" y="78" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">ENI: 10.0.1.92</text>
                        </g>

                        {/* Connector scheduler lines */}
                        <path d="M 120,46 L 115,115" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                        <path d="M 280,46 L 285,115" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                      </g>
                    ) : (
                      // EC2 Model
                      <g>
                        {/* Subnet Boundaries - Glass 3D box */}
                        <polygon points="15,100 375,100 392,75 32,75" fill="rgba(254, 243, 199, 0.4)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="32" y="70" fontSize="7" fontWeight="bold" fill="#92400e">VPC Subnet (10.0.1.0/24) | Auto Scaling Group compute-fleet</text>

                        {/* EC2 Instance 1 (detailed chassis) */}
                        <g transform="translate(25, 95)">
                          {/* physical chassis */}
                          <polygon points="5,60 145,60 155,48 15,48" fill="url(#ec2ChassisGrad)" stroke="#b45309" strokeWidth="0.5" className="active-svg-glow" />
                          <polygon points="5,60 145,60 145,118 5,118" fill="#b45309" />
                          <polygon points="145,60 155,48 155,106 145,118" fill="#78350f" />
                          <text x="75" y="56" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">EC2 Instance (t3.medium)</text>

                          {/* ECS Agent daemon inside */}
                          <rect x="15" y="66" width="120" height="16" rx="2" fill="url(#agentGrad)" stroke="#44403c" strokeWidth="0.5" />
                          <text x="75" y="76" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">ECS Agent daemon</text>

                          {/* Task Slots inside rack */}
                          <g transform="translate(15, 87)">
                            <rect x="0" y="0" width="55" height="24" rx="2" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.5" />
                            <text x="27.5" y="10" textAnchor="middle" fontSize="6.5" fill="#065f46" fontWeight="bold">Task A: Port 80</text>
                            <text x="27.5" y="19" textAnchor="middle" fontSize="6" fill="#b45309" fontWeight="bold">Host: 32768</text>
                          </g>

                          <g transform="translate(80, 87)">
                            <rect x="0" y="0" width="55" height="24" rx="2" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.5" />
                            <text x="27.5" y="10" textAnchor="middle" fontSize="6.5" fill="#065f46" fontWeight="bold">Task B: Port 80</text>
                            <text x="27.5" y="19" textAnchor="middle" fontSize="6" fill="#b45309" fontWeight="bold">Host: 32769</text>
                          </g>
                        </g>

                        {/* EC2 Instance 2 (detailed chassis) */}
                        <g transform="translate(210, 95)">
                          {/* physical chassis */}
                          <polygon points="5,60 145,60 155,48 15,48" fill="url(#ec2ChassisGrad)" stroke="#b45309" strokeWidth="0.5" className="active-svg-glow" />
                          <polygon points="5,60 145,60 145,118 5,118" fill="#b45309" />
                          <polygon points="145,60 155,48 155,106 145,118" fill="#78350f" />
                          <text x="75" y="56" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">EC2 Instance (t3.medium)</text>

                          {/* ECS Agent daemon inside */}
                          <rect x="15" y="66" width="120" height="16" rx="2" fill="url(#agentGrad)" stroke="#44403c" strokeWidth="0.5" />
                          <text x="75" y="76" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">ECS Agent daemon</text>

                          {/* Tasks inside rack */}
                          <g transform="translate(15, 87)">
                            <rect x="0" y="0" width="120" height="24" rx="2" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.5" />
                            <text x="60" y="10" textAnchor="middle" fontSize="6.5" fill="#065f46" fontWeight="bold">Task C: Port 80</text>
                            <text x="60" y="19" textAnchor="middle" fontSize="6.5" fill="#b45309" fontWeight="bold">Host Ephemeral Bind: 32770</text>
                          </g>
                        </g>

                        {/* Connector scheduler lines */}
                        <path d="M 120,46 L 105,95" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                        <path d="M 280,46 L 290,95" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* IAM Roles with interactive policy explorer */}
              <div className="ecs-card flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    🔒 ECS IAM Roles: Task Role vs. Task Execution Role
                  </h3>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Security in Amazon ECS mandates splitting permissions between what the <b>ECS Host Agent</b> needs to pull images/push logs, and what your <b>Container Application code</b> needs to fetch AWS resources.
                  </p>

                  <div className="flex gap-2 mb-4 border-b border-gray-200">
                    <button
                      className={`pb-2 px-3 text-xs font-semibold ${activeRoleExplain === 'execution' ? 'border-b-2 border-yellow-500 text-yellow-600 font-bold' : 'text-gray-500'}`}
                      onClick={() => setActiveRoleExplain('execution')}
                    >
                      🛠️ Task Execution Role (Host)
                    </button>
                    <button
                      className={`pb-2 px-3 text-xs font-semibold ${activeRoleExplain === 'task' ? 'border-b-2 border-yellow-500 text-yellow-600 font-bold' : 'text-gray-500'}`}
                      onClick={() => setActiveRoleExplain('task')}
                    >
                      🐳 Task Role (App Code)
                    </button>
                  </div>
                </div>

                {/* Explorer panels */}
                <div className="grid grid-cols-1 gap-4 mt-2">
                  {activeRoleExplain === 'execution' ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <span className="badge badge-amber mb-2">Used by ECS Agent (Host Platform)</span>
                        <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase">Task Execution Role Overview</h4>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          This role is assumed by the ECS Container Agent to execute operations on your behalf before booting your container. It needs permissions to pull images and configure system environments.
                        </p>
                      </div>

                      <div className="ecs-code-terminal">
                        <div className="text-slate-500 text-[9px] mb-2">// AWS IAM JSON Policy definition</div>
                        <pre className="text-emerald-400 text-[10px] overflow-auto whitespace-pre font-mono">
                          {`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <span className="badge badge-blue mb-2">Assumed by App Code inside Docker</span>
                        <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase">Task Role (Application Role) Overview</h4>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          Your compiled code inside the container assumes this identity automatically. This enables your program logic (S3 uploads, DB reads) to authenticate with AWS SDK seamlessly without hardcoded access keys.
                        </p>
                      </div>

                      <div className="ecs-code-terminal">
                        <div className="text-slate-500 text-[9px] mb-2">// AWS IAM JSON Policy definition</div>
                        <pre className="text-emerald-400 text-[10px] overflow-auto whitespace-pre font-mono">
                          {`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "sqs:ReceiveMessage",
        "sqs:SendMessage"
      ],
      "Resource": "*"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 📚 Educational Theory Glossary */}
            <div className="ecs-card">
              <h4 className="ecs-card-title">
                📚 AWS Container Registry &amp; Orchestrator Theory
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🚀 Amazon ECR Repository</strong>
                  Fully-managed private OCI-compliant registry providing secure, encrypted artifact hosting for static container images.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🧠 ECS Cluster</strong>
                  Logical resource bounding boundary enclosing tasks launched on either AWS Fargate serverless compute pools or EC2 VM clusters.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">📋 Task Definition</strong>
                  Blueprint JSON schema specifying container parameters, environment configs, port bindings, logging, volume mounts, and assumed security identities.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🛠️ Task Execution Role</strong>
                  IAM credential assumed by the host ECS Agent daemon to pull ECR layers, write CloudWatch streams, and decrypt Secrets Manager tokens.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🐳 Task Role (Application Role)</strong>
                  IAM security credentials assumed directly by your containerized code to authorize access to S3, SQS queues, or DynamoDB tables at runtime.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">⚡ AWS Fargate Launch Type</strong>
                  Serverless container compute engine bypassing EC2 host node management, allowing customers to pay strictly for active task CPU and memory allocation.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ECS ADVANCED PATTERNS */}
        {activeTab === 'ecs-advanced' && (
          <div className="space-y-8 animate-fade-in">
            <div className="ecs-card">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                🏗️ Advanced Amazon ECS Production Architectures
              </h3>
              <p className="text-xs text-gray-600">
                Dive deep into production-grade patterns demonstrating how Amazon ECS integrates with elastic load balancers, auto-scaling Capacity Providers, queues, and event buses.
              </p>
            </div>

            <div className="ecs-grid">
              {/* Left Column: Pattern Selector Cards */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Architecture Blueprint</span>
                {[
                  { id: 'port-map', title: '🍔 ALB Dynamic Host Port Mapping', desc: 'Allows multiple task instances per EC2 node with zero port conflicts.' },
                  { id: 'capacity', title: '📈 ECS Capacity Providers & ASG', desc: 'Coordinates task scale demands with host EC2 Auto Scaling Groups.' },
                  { id: 'sqs-queue', title: '✉️ SQS-Queue Worker Architecture', desc: 'Auto-scale worker task containers based on message backlog queue depth.' },
                  { id: 'eventbridge-cron', title: '⏰ EventBridge Scheduled Tasks', desc: 'Provision and invoke serverless batch containers using cron triggers.' },
                  { id: 'state-intercept', title: '🚨 Intercepting Task State Changes', desc: 'Capture task exit anomalies via EventBridge and route alerts to Slack.' }
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ecs-card ${activeAdvPattern === item.id
                        ? 'border-yellow-500 bg-yellow-50/50 shadow-md font-semibold scale-[1.02]'
                        : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    onClick={() => setActiveAdvPattern(item.id as any)}
                  >
                    <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-sm">
                        {item.id === 'port-map' && '🍔'}
                        {item.id === 'capacity' && '📈'}
                        {item.id === 'sqs-queue' && '✉️'}
                        {item.id === 'eventbridge-cron' && '⏰'}
                        {item.id === 'state-intercept' && '🚨'}
                      </span>
                      {item.title}
                    </div>
                    <div className="text-[11px] text-gray-500 font-normal mt-1 leading-normal">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Right Column: Dynamic Architectural Visualizations */}
              <div className="ecs-card flex flex-col justify-between min-h-[420px]">
                <div>
                  {activeAdvPattern === 'port-map' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-teal">Networking</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">ephemeral-ports-routing</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">ALB Dynamic Host Port Mapping</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Exposing multiple copies of a container on a single host machine triggers port collisions (e.g., both trying to bind host port 80). In ECS, configure host port as <b>0</b> in the Task definition. The ECS Agent automatically binds a random high ephemeral port (32768&ndash;65535) from the OS, and registers it with the Application Load Balancer target group dynamically.
                      </p>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center">
                        <svg width="100%" height="180" viewBox="0 0 360 180" className="ecs-svg-bg rounded-lg border border-slate-200">
                          {/* Defs for gradients */}
                          <defs>
                            <linearGradient id="albGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ff9900" />
                              <stop offset="100%" stopColor="#cc7a00" />
                            </linearGradient>
                            <linearGradient id="taskGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#047857" />
                            </linearGradient>
                          </defs>

                          {/* ALB 3D load balancer */}
                          <g transform="translate(10, 60)">
                            <polygon points="5,40 65,40 75,20 15,20" fill="url(#albGrad)" stroke="#ff9900" strokeWidth="0.5" className="active-svg-glow" />
                            <polygon points="5,40 65,40 65,52 5,52" fill="#cc7a00" />
                            <polygon points="65,40 75,20 75,32 65,52" fill="#995c00" />
                            <text x="40" y="38" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">⚖️ ALB (443)</text>
                          </g>

                          {/* Dynamic target mapping pipelines */}
                          <path d="M 85,85 L 160,50" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                          <path d="M 85,85 L 160,130" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />

                          <text x="110" y="55" fontSize="6.5" fill="#0284c7" fontWeight="bold" transform="rotate(-23, 110, 55)">Host: 32768</text>
                          <text x="110" y="125" fontSize="6.5" fill="#0284c7" fontWeight="bold" transform="rotate(23, 110, 125)">Host: 32769</text>

                          {/* EC2 Instance 3D block */}
                          <g transform="translate(160, 15)">
                            <polygon points="10,135 180,135 190,115 20,115" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                            <polygon points="10,135 180,135 180,145 10,145" fill="#e2e8f0" />
                            <polygon points="180,135 190,115 190,125 180,145" fill="#cbd5e1" />
                            <text x="100" y="142" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#475569">Single EC2 Host (10.0.1.20)</text>

                            {/* Task 1 3D box */}
                            <g transform="translate(20, 20)">
                              <polygon points="5,30 140,30 148,20 13,20" fill="url(#taskGrad3)" stroke="#10b981" strokeWidth="0.5" className="active-svg-glow" />
                              <polygon points="5,30 140,30 140,40 5,40" fill="#047857" />
                              <polygon points="140,30 148,20 148,30 140,40" fill="#064e3b" />
                              <text x="75" y="32" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff">ECS Task 1 (Container)</text>
                              <text x="75" y="14" textAnchor="middle" fontSize="6" fill="#065f46" fontWeight="bold">Host Ephemeral Port 32768 &rarr; Container 80</text>
                            </g>

                            {/* Task 2 3D box */}
                            <g transform="translate(20, 75)">
                              <polygon points="5,30 140,30 148,20 13,20" fill="url(#taskGrad3)" stroke="#10b981" strokeWidth="0.5" className="active-svg-glow" />
                              <polygon points="5,30 140,30 140,40 5,40" fill="#047857" />
                              <polygon points="140,30 148,20 148,30 140,40" fill="#064e3b" />
                              <text x="75" y="32" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff">ECS Task 2 (Container)</text>
                              <text x="75" y="14" textAnchor="middle" fontSize="6" fill="#065f46" fontWeight="bold">Host Ephemeral Port 32769 &rarr; Container 80</text>
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>
                  )}

                  {activeAdvPattern === 'capacity' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-blue">Compute Scaling</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">capacity-providers-asg</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">ECS Capacity Providers &amp; ASG Coordinate</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        If launching tasks on EC2 pools, who scales the physical servers when container pools grow? <b>ECS Capacity Providers</b> solve this problem. They track when ECS tasks are forced into `PENDING` states due to host server CPU/memory exhaustion, and automatically trigger EC2 Auto Scaling scaling alarms to scale out host instances.
                      </p>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="font-bold text-xs text-slate-800 block">🧠 Step-by-Step Scaling Coordination:</span>
                        <ol className="list-decimal pl-4 text-[11px] text-slate-600 flex flex-col gap-2 mb-4">
                          <li>Service Auto-Scaler triggers scaling action: task counts scale from <b>5 to 10</b>.</li>
                          <li>Physical EC2 host resources are completely full. ECS schedules the 5 new tasks as <b>⏳ PENDING</b>.</li>
                          <li>ECS <b>Capacity Provider</b> intercepts the pending state and coordinates with the Auto Scaling Group target tracking metric.</li>
                          <li>ASG provisions a new EC2 Instance, hooks it to the cluster, and pending tasks boot instantly.</li>
                        </ol>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center">
                          <svg width="100%" height="180" viewBox="0 0 360 180" className="ecs-svg-bg rounded-lg border border-slate-200">
                            {/* 1. Scheduler asking for scale */}
                            <g transform="translate(10, 15)">
                              <rect x="5" y="5" width="90" height="40" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
                              <text x="50" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1d4ed8">ECS Scheduler</text>
                              <text x="50" y="27" textAnchor="middle" fontSize="6" fill="#1d4ed8">Scale UP: +5 Tasks</text>
                              <text x="50" y="37" textAnchor="middle" fontSize="6.5" fill="#f59e0b" fontWeight="bold" className="animate-pulse">⏳ 5 PENDING</text>
                            </g>

                            {/* 2. Capacity Provider Octagon Hub */}
                            <g transform="translate(125, 20)">
                              <polygon points="15,0 45,0 60,15 60,45 45,60 15,60 0,45 0,15" fill="#fef9c3" stroke="#eab308" strokeWidth="1.5" className="active-svg-glow" />
                              <text x="30" y="25" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#854d0e">Capacity</text>
                              <text x="30" y="35" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#854d0e">Provider</text>
                              <text x="30" y="45" textAnchor="middle" fontSize="6.5" fill="#a16207" fontStyle="italic">ALARM</text>
                            </g>

                            {/* Flow paths */}
                            <path d="M 105,35 L 125,50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />
                            <path d="M 185,50 L 220,50" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />

                            {/* 3. ASG Dotted Chassis with EC2 server towers */}
                            <g transform="translate(220, 10)">
                              <rect x="0" y="0" width="130" height="160" rx="6" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4,4" />
                              <text x="65" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#c2410c">EC2 Auto Scaling Group</text>

                              {/* EC2 Instance 1 (Existing) */}
                              <g transform="translate(10, 20)">
                                <rect x="0" y="0" width="50" height="120" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                                <text x="25" y="15" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e293b">EC2 Host</text>
                                <rect x="5" y="25" width="40" height="15" rx="2" fill="#4ade80" />
                                <text x="25" y="35" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">Task 1</text>
                                <rect x="5" y="45" width="40" height="15" rx="2" fill="#4ade80" />
                                <text x="25" y="55" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">Task 2</text>
                                <text x="25" y="110" textAnchor="middle" fontSize="6" fill="#b91c1c" fontWeight="bold">⚠️ FULL (100%)</text>
                              </g>

                              {/* EC2 Instance 2 (Scaling Out!) */}
                              <g transform="translate(70, 20)" className="active-svg-glow">
                                <rect x="0" y="0" width="50" height="120" rx="4" fill="#ffedd5" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3,2" />
                                <text x="25" y="15" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ea580c" className="animate-pulse">NEW HOST</text>
                                <rect x="5" y="25" width="40" height="15" rx="2" fill="#10b981" stroke="#059669" className="animate-pulse" />
                                <text x="25" y="35" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">Task 3</text>
                                <rect x="5" y="45" width="40" height="15" rx="2" fill="#10b981" stroke="#059669" className="animate-pulse" />
                                <text x="25" y="55" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">Task 4</text>
                                <text x="25" y="110" textAnchor="middle" fontSize="6" fill="#15803d" fontWeight="bold" className="animate-pulse">🔄 SPINNING UP</text>
                              </g>
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeAdvPattern === 'sqs-queue' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-amber">Async Queues</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">backlog-queue-scaling</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">SQS-Queue Worker Architecture</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Decouple your public web APIs from compute-heavy background tasks (video transcoding, report compression). Frontend nodes push job metadata into SQS. ECS worker container services automatically scale task counts up/down based on CloudWatch metrics tracking SQS queue backlog depths.
                      </p>

                      <div className="bg-white p-4 border border-gray-200 rounded-xl flex items-center justify-center shadow-inner">
                        <svg width="100%" height="180" viewBox="0 0 360 180" className="ecs-svg-bg rounded-lg border border-slate-200">
                          {/* 1. Frontend Web App */}
                          <g transform="translate(10, 50)">
                            <rect x="0" y="0" width="80" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" className="active-svg-glow" />
                            <text x="40" y="25" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d4ed8">📥 Web API Portal</text>
                            <text x="40" y="40" textAnchor="middle" fontSize="6.5" fill="#3b82f6">Public client requests</text>
                            <text x="40" y="50" textAnchor="middle" fontSize="6" fill="#2563eb" fontWeight="bold">Ingesting jobs...</text>
                          </g>

                          {/* Flow line App -> SQS */}
                          <path d="M 90,80 L 140,80" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,3" className="flow-line-active" fill="none" />

                          {/* 2. SQS Queue cylinder */}
                          <g transform="translate(140, 45)">
                            {/* Cylinder face */}
                            <ellipse cx="40" cy="15" rx="30" ry="10" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                            <path d="M 10,15 L 10,85 A 30,10 0 0,0 70,85 L 70,15" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                            <ellipse cx="40" cy="85" rx="30" ry="10" fill="#fffbeb" stroke="#d97706" strokeWidth="1" className="active-svg-glow" />
                            <text x="40" y="45" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#b45309">✉️ SQS Queue</text>
                            {/* Backlog items */}
                            <rect x="20" y="60" width="40" height="10" rx="1" fill="#fef3c7" stroke="#fbbf24" />
                            <rect x="25" y="65" width="30" height="10" rx="1" fill="#fbbf24" stroke="#d97706" />
                            <text x="40" y="73" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#78350f">Job backlog</text>
                          </g>

                          {/* Flow line SQS -> Worker */}
                          <path d="M 210,80 L 260,80" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,3" className="flow-line-active" fill="none" />

                          {/* 3. ECS Worker Fleet */}
                          <g transform="translate(260, 20)">
                            <rect x="0" y="0" width="90" height="135" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" className="active-svg-glow" />
                            <text x="45" y="15" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#065f46">🐳 Worker fleet</text>

                            {/* Worker 1 */}
                            <g transform="translate(10, 25)">
                              <rect x="0" y="0" width="70" height="28" rx="3" fill="#10b981" stroke="#047857" />
                              <text x="35" y="12" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">SqsWorker-A</text>
                              <text x="35" y="22" textAnchor="middle" fontSize="6.5" fill="#a7f3d0">⚙️ Processing...</text>
                            </g>

                            {/* Worker 2 */}
                            <g transform="translate(10, 60)">
                              <rect x="0" y="0" width="70" height="28" rx="3" fill="#10b981" stroke="#047857" />
                              <text x="35" y="12" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">SqsWorker-B</text>
                              <text x="35" y="22" textAnchor="middle" fontSize="6.5" fill="#a7f3d0">⚙️ Processing...</text>
                            </g>

                            {/* Worker 3 */}
                            <g transform="translate(10, 95)">
                              <rect x="0" y="0" width="70" height="28" rx="3" fill="#10b981" stroke="#047857" />
                              <text x="35" y="12" textAnchor="middle" fontSize="7" fill="#ffffff" fontWeight="bold">SqsWorker-C</text>
                              <text x="35" y="22" textAnchor="middle" fontSize="6.5" fill="#a7f3d0">⚙️ Processing...</text>
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>
                  )}

                  {activeAdvPattern === 'eventbridge-cron' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-purple">Schedules</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">cron-scheduled-tasks</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">EventBridge Scheduled Tasks (CRON)</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Avoid running a server 24/7 just to execute a task once a day. EventBridge Scheduled rules evaluate custom CRON strings, trigger ECS Fargate serverless tasks automatically on the time mark (e.g. 2:00 AM daily), execute container data processing scripts, copy output to S3, and shut down, keeping operations costs at pennies.
                      </p>

                      <div className="ecs-code-terminal">
                        <div className="text-slate-500 text-[9px] mb-2">// EventBridge scheduled target definition</div>
                        <pre className="text-sky-300 text-[10px] overflow-auto whitespace-pre font-mono">
                          {`{
  "EventPattern": "cron(0 2 * * ? *)",
  "Target": {
    "Arn": "arn:aws:ecs:us-east-1:1234:cluster/production",
    "TaskDefinition": "nightly-database-backup:4",
    "LaunchType": "FARGATE",
    "Count": 1
  }
}`}
                        </pre>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center">
                        <svg width="100%" height="180" viewBox="0 0 360 180" className="ecs-svg-bg rounded-lg border border-slate-200">
                          {/* 1. Cron Clock */}
                          <g transform="translate(10, 45)">
                            <circle cx="35" cy="35" r="28" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" className="active-svg-glow" />
                            {/* ticking arms */}
                            <line x1="35" y1="35" x2="35" y2="15" stroke="#701a75" strokeWidth="2" />
                            <line x1="35" y1="35" x2="50" y2="40" stroke="#701a75" strokeWidth="1.5" />
                            <text x="35" y="75" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#701a75">⏰ 2:00 AM CRON</text>
                          </g>

                          {/* Event path */}
                          <path d="M 80,80 L 125,80" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />

                          {/* 2. EventBridge logic rule card */}
                          <g transform="translate(125, 45)">
                            <rect x="0" y="0" width="90" height="65" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" />
                            <text x="45" y="15" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#581c87">EventBridge Rule</text>
                            <text x="45" y="27" textAnchor="middle" fontSize="6.5" fill="#701a75" fontFamily="monospace">"NightlyBatch"</text>
                            <rect x="10" y="38" width="70" height="18" rx="2" fill="#701a75" />
                            <text x="45" y="49" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">MATCH &rarr; RUN TASK</text>
                          </g>

                          {/* Dispatch path */}
                          <path d="M 215,80 L 255,80" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />

                          {/* 3. ECS Fargate launcher and S3 target */}
                          <g transform="translate(255, 15)">
                            <rect x="0" y="0" width="90" height="145" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                            <text x="45" y="14" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#065f46">Ad-hoc Fargate</text>

                            {/* Fargate container task */}
                            <g transform="translate(10, 24)">
                              <rect x="0" y="0" width="70" height="36" rx="3" fill="#10b981" stroke="#047857" className="active-svg-glow" />
                              <text x="35" y="14" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">BatchTask-92</text>
                              <text x="35" y="27" textAnchor="middle" fontSize="6.5" fill="#a7f3d0" className="animate-pulse">🔄 PROCESSING</text>
                            </g>

                            {/* Flow path container -> S3 */}
                            <path d="M 45,60 L 45,95" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />

                            {/* S3 cylinder */}
                            <g transform="translate(15, 95)">
                              <ellipse cx="20" cy="8" rx="15" ry="5" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" />
                              <path d="M 5,8 L 5,30 A 15,5 0 0,0 35,30 L 35,8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" />
                              <ellipse cx="20" cy="30" rx="15" ry="5" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" className="active-svg-glow" />
                              <text x="20" y="21" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#1d4ed8">S3 Bucket</text>
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>
                  )}

                  {activeAdvPattern === 'state-intercept' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-coral">Observability</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">crashed-task-interceptor</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">ECS Task State Change Interceptor</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        When an essential container in an ECS task crashes, ECS issues a state change event. Amazon EventBridge intercepts this event instantly. You can create filter patterns matching exit code failures (exit code != 0) to immediately dispatch alert payloads to Slack, PagerDuty, or SNS topics.
                      </p>

                      <div className="ecs-code-terminal">
                        <div className="text-slate-500 text-[9px] mb-2">// EventBridge filter rule matching crashed tasks</div>
                        <pre className="text-emerald-400 text-[10px] overflow-auto whitespace-pre font-mono">
                          {`{
  "source": ["aws.ecs"],
  "detail-type": ["ECS Task State Change"],
  "detail": {
    "lastStatus": ["STOPPED"],
    "stoppedReason": [{"prefix": "Essential container in task exited"}]
  }
}`}
                        </pre>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center">
                        <svg width="100%" height="180" viewBox="0 0 360 180" className="ecs-svg-bg rounded-lg border border-slate-200">
                          {/* 1. Broken Task */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="85" height="70" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" className="active-svg-glow" />
                            <text x="42.5" y="20" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#991b1b">💥 CRASHED TASK</text>
                            <text x="42.5" y="35" textAnchor="middle" fontSize="6.5" fill="#b91c1c">WebTask-5a71</text>
                            <rect x="8" y="44" width="69" height="16" rx="2" fill="#ef4444" />
                            <text x="42.5" y="55" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">EXIT CODE: 137 (OOM)</text>
                          </g>

                          {/* Event pipeline */}
                          <path d="M 95,80 L 140,80" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3,3" className="flow-line-active" fill="none" />

                          {/* 2. EventBridge rules auditor */}
                          <g transform="translate(140, 40)">
                            <rect x="0" y="0" width="90" height="75" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" />
                            <text x="45" y="16" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#581c87">EventBridge Router</text>
                            <text x="45" y="28" textAnchor="middle" fontSize="6" fill="#701a75">Rule: ExitCode != 0</text>
                            <rect x="10" y="40" width="70" height="24" rx="2" fill="#701a75" />
                            <text x="45" y="50" textAnchor="middle" fontSize="6" fill="#ffffff" fontWeight="bold">INTERCEPT &amp;</text>
                            <text x="45" y="59" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold">ROUTE PAYLOADS</text>
                          </g>

                          {/* Route paths */}
                          <path d="M 230,65 L 270,35" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2" className="flow-line-active" fill="none" />
                          <path d="M 230,90 L 270,120" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2" className="flow-line-active" fill="none" />

                          {/* Targets */}
                          {/* Target 1: Slack webhook */}
                          <g transform="translate(270, 15)">
                            <rect x="0" y="0" width="80" height="35" rx="3" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1" />
                            <text x="40" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0369a1">💬 Slack Webhook</text>
                            <text x="40" y="25" textAnchor="middle" fontSize="6.5" fill="#0284c7" className="animate-pulse">🚨 channels/ops-alerts</text>
                          </g>

                          {/* Target 2: SNS topic */}
                          <g transform="translate(270, 110)">
                            <rect x="0" y="0" width="80" height="35" rx="3" fill="#f8fafc" stroke="#f97316" strokeWidth="1" />
                            <text x="40" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#c2410c">🔔 SNS Admin Alerts</text>
                            <text x="40" y="25" textAnchor="middle" fontSize="6.5" fill="#ea580c" className="animate-pulse">Sends SMS/Emails</text>
                          </g>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-3 bg-slate-800 text-slate-300 rounded-xl text-xs flex items-center justify-between shadow-sm">
                  <span>💡 Trace these production architectures in real-time inside the playground!</span>
                  <button
                    className="text-yellow-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    onClick={() => setActiveTab('simulation')}
                  >
                    Go to Simulation <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 📚 Educational Theory Glossary */}
            <div className="ecs-card">
              <h4 className="ecs-card-title">
                📚 Advanced ECS Architectural Patterns Glossary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🍔 Dynamic Port Mapping</strong>
                  Dynamic allocation binding target container ports to random high host ephemeral ports (32768&ndash;65535), automatically catalogued in ALB targets.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">📈 ECS Capacity Providers</strong>
                  Smart scaling layer linking pending task schedules directly with targeted EC2 VM Auto Scaling Group triggers to prevent container launch stalls.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">✉️ SQS Worker Scaling</strong>
                  Decoupled scaling methodology adjusting worker container pools based on the CloudWatch metric `ApproximateNumberOfMessagesVisible`.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">⏰ Scheduled Tasks</strong>
                  Serverless event rules invoking Fargate container runs on time patterns (crons), performing logic, and auto-terminating.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🚨 Task State Changes</strong>
                  Automatic observability events generated by ECS on task lifecycle transitions (e.g. stopped reasons) and intercepted by EventBridge filters.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: AMAZON EKS & KUBERNETES */}
        {activeTab === 'eks-k8s' && (
          <div className="space-y-8 animate-fade-in">
            <div className="ecs-grid">
              {/* Left Column: EKS Control Plane Theory & CSI Stepper */}
              <div className="space-y-4">
                <div className="ecs-card">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    ☸️ Amazon EKS Control Plane &amp; Worker Nodes
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Amazon Elastic Kubernetes Service (EKS) delivers a highly available, certified Kubernetes control plane across multiple Availability Zones, managing integrations with AWS VPC networking, IAM authentication, and storage drivers automatically.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-2">
                    <span className="font-bold text-slate-800 block">🖥️ Compute Node Options:</span>
                    <ul className="list-disc pl-4 flex flex-col gap-1.5">
                      <li><b>Managed Node Groups (EC2)</b>: AWS provisions, configures, and updates host VM instances for you, while you manage OS patches and scaling.</li>
                      <li><b>Fargate Profiles</b>: Bypasses EC2 instances entirely. Run Kubernetes Pods inside serverless micro-VMs, paying strictly for allocated pod CPU/RAM.</li>
                    </ul>
                  </div>
                </div>

                <div className="ecs-card">
                  <span className="badge badge-purple mb-2">Persistent Data</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800 mb-2">Kubernetes Storage &amp; CSI volume Stepper</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Kubernetes pods are ephemeral by nature. EKS uses CSI (Container Storage Interface) drivers to mount persistent disks. <b>Hover over steps below</b> to highlight how EKS maps logical requests to physical SSD volumes.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {[
                      { id: 'pvc', title: '1. PersistentVolumeClaim (PVC)', desc: 'Written by developers. Declares storage size, access modes (e.g. ReadWriteOnce), and bindings.' },
                      { id: 'sc', title: '2. StorageClass (SC)', desc: 'Defines the dynamic provisioner (ebs.csi.aws.com) and filesystem type (gp3) to invoke AWS disks.' },
                      { id: 'pv', title: '3. PersistentVolume (PV)', desc: 'EKS automatically creates this resource in K8s mapping to the physical AWS EBS volume.' },
                      { id: 'csi', title: '4. CSI Driver DaemonSet', desc: 'The AWS Storage driver daemon running on nodes intercepts calls to attach physical EBS volumes to EC2.' },
                      { id: 'mount', title: '5. Pod Volume Mount', desc: 'Kubernetes mounts the attached disk path directly into the Pod container filesystem.' }
                    ].map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all duration-200 cursor-help ${eksStorageHover === item.id
                            ? 'border-purple-500 bg-purple-50/50 shadow-md scale-[1.01] font-semibold'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                          }`}
                        onMouseEnter={() => setEksStorageHover(item.id)}
                        onMouseLeave={() => setEksStorageHover(null)}
                      >
                        <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                          <span>{item.title}</span>
                          {eksStorageHover === item.id && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider animate-pulse">Tracing Component</span>}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 leading-normal">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: EKS CSI Storage & Node Topology */}
              <div className="ecs-card flex flex-col justify-between">
                <div>
                  <h4 className="ecs-card-title">
                    📦 Kubernetes Node &amp; Storage Topology
                  </h4>
                  <p className="ecs-card-desc mb-4">
                    Hover over the volume steps on the left to trace PV/PVC CSI storage binding pipelines, node isolation boundaries, and pod persistent mounts in real-time.
                  </p>
                  <div className="border border-gray-200 bg-slate-50 rounded-xl p-4 flex flex-col items-center shadow-inner mt-2">
                    <svg width="100%" height="280" viewBox="0 0 380 280" className="ecs-svg-bg rounded-lg border border-gray-200 shadow-sm">
                      {/* Definitions for gradients */}
                    <defs>
                      <linearGradient id="eksControlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#6b21a8" />
                      </linearGradient>
                      <linearGradient id="k8sPodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <linearGradient id="ebsDiskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#be185d" />
                      </linearGradient>
                      <linearGradient id="scGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                    </defs>

                    {/* EKS Control plane (AWS Managed, Multi-AZ) - Elevated 3D plate */}
                    <g transform="translate(15, 10)">
                      <polygon points="10,65 330,65 345,15 25,15" fill="url(#eksControlGrad)" stroke="#a855f7" strokeWidth="0.5" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                      <polygon points="10,65 330,65 330,73 10,73" fill="#6b21a8" />
                      <polygon points="330,65 345,15 345,23 330,73" fill="#4c1d95" />
                      <text x="175" y="32" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff" fontFamily="monospace">☸️ AWS MANAGED HIGH-AVAILABILITY CONTROL PLANE</text>
                      
                      {/* Control Plane internals - 3D chips */}
                      <g transform="translate(25, 40)">
                        <rect x="0" y="0" width="60" height="15" rx="2" fill="#ffffff" stroke="#c084fc" strokeWidth="0.5" />
                        <text x="30" y="10" textAnchor="middle" fontSize="7" fill="#581c87" fontWeight="bold">kube-api</text>
                      </g>
                      <g transform="translate(95, 40)">
                        <rect x="0" y="0" width="60" height="15" rx="2" fill="#ffffff" stroke="#c084fc" strokeWidth="0.5" />
                        <text x="30" y="10" textAnchor="middle" fontSize="7" fill="#581c87" fontWeight="bold">scheduler</text>
                      </g>
                      <g transform="translate(165, 40)" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''}>
                        <rect x="0" y="0" width="80" height="15" rx="2" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" />
                        <text x="40" y="10" textAnchor="middle" fontSize="7" fill="#701a75" fontWeight="bold">ebs-csi-controller</text>
                      </g>
                      <g transform="translate(255, 40)">
                        <rect x="0" y="0" width="65" height="15" rx="2" fill="#ffffff" stroke="#c084fc" strokeWidth="0.5" />
                        <text x="32.5" y="10" textAnchor="middle" fontSize="7" fill="#581c87" fontWeight="bold">etcd cluster</text>
                      </g>
                    </g>

                    {/* Nodes Subnet Bounds - 3D Translucent plane */}
                    <polygon points="10,245 350,245 370,110 30,110" fill="rgba(243, 244, 246, 0.45)" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="35" y="105" fontSize="7.5" fontWeight="bold" fill="#374151">VPC subnets | Customer Managed Nodes</text>

                    {/* Managed Node Group (EC2 Server Tower) */}
                    <g transform="translate(25, 115)" className={eksStorageHover === 'csi' || eksStorageHover === 'mount' ? 'active-svg-glow' : ''}>
                      {/* 3D EC2 Node Chassis */}
                      <polygon points="5,80 145,80 155,68 15,68" fill="#f8fafc" stroke="#6b7280" strokeWidth="0.5" />
                      <polygon points="5,80 145,80 145,115 5,115" fill="#e2e8f0" />
                      <polygon points="145,80 155,68 155,103 145,115" fill="#cbd5e1" />
                      <text x="75" y="76" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1f2937">EC2 Node Group (Host)</text>

                      {/* CSI daemonset inside host */}
                      <rect x="15" y="85" width="120" height="13" rx="2" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.5" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                      <text x="75" y="94" textAnchor="middle" fontSize="6.5" fill="#6b21a8" fontWeight="bold">ebs-csi-node Daemonset</text>

                      {/* Pod A */}
                      <g transform="translate(15, 15)" className={(eksStorageHover === 'mount' || eksStorageHover === 'pvc') ? 'active-svg-glow' : ''}>
                        <polygon points="2,25 58,25 64,15 8,15" fill="url(#k8sPodGrad)" stroke="#10b981" strokeWidth="0.5" />
                        <polygon points="2,25 58,25 58,35 2,35" fill="#047857" />
                        <polygon points="58,25 64,15 64,25 58,35" fill="#064e3b" />
                        <text x="30" y="27" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">Pod A (App)</text>
                        <text x="30" y="11" textAnchor="middle" fontSize="6" fill="#a7f3d0">Mount: /data</text>
                      </g>

                      {/* Pod B */}
                      <g transform="translate(80, 15)" className={eksStorageHover === 'mount' ? 'active-svg-glow' : ''}>
                        <polygon points="2,25 58,25 64,15 8,15" fill="url(#k8sPodGrad)" stroke="#10b981" strokeWidth="0.5" />
                        <polygon points="2,25 58,25 58,35 2,35" fill="#047857" />
                        <polygon points="58,25 64,15 64,25 58,35" fill="#064e3b" />
                        <text x="30" y="27" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">Pod B (App)</text>
                        <text x="30" y="11" textAnchor="middle" fontSize="6" fill="#a7f3d0">Mount: /data</text>
                      </g>
                    </g>

                    {/* Fargate Profile Profiles - 3D Blue container bounds */}
                    <g transform="translate(195, 115)">
                      <polygon points="5,80 145,80 155,68 15,68" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="3,2" />
                      <polygon points="5,80 145,80 145,115 5,115" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="0.5" />
                      <polygon points="145,80 155,68 155,103 145,115" fill="#bae6fd" />
                      <text x="75" y="76" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0369a1">Fargate Profiles</text>

                      {/* Pod C serverless microVM */}
                      <g transform="translate(15, 20)" className={eksStorageHover === 'mount' ? 'active-svg-glow' : ''}>
                        <polygon points="2,25 110,25 118,15 10,15" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" />
                        <polygon points="2,25 110,25 110,35 2,35" fill="#1d4ed8" />
                        <polygon points="110,25 118,15 118,25 110,35" fill="#1e3a8a" />
                        <text x="56" y="27" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">Pod C (Serverless micro-VM)</text>
                      </g>
                    </g>

                    {/* 4. Physical EBS Volume Cylinder on AZ-a boundary */}
                    <g transform="translate(20, 220)" className={eksStorageHover === 'pv' || eksStorageHover === 'csi' || eksStorageHover === 'mount' ? 'active-svg-glow' : ''}>
                      <ellipse cx="20" cy="8" rx="15" ry="5" fill="url(#ebsDiskGrad)" stroke="#be185d" strokeWidth="0.5" />
                      <path d="M 5,8 L 5,30 A 15,5 0 0,0 35,30 L 35,8" fill="url(#ebsDiskGrad)" stroke="#be185d" strokeWidth="0.5" />
                      <ellipse cx="20" cy="30" rx="15" ry="5" fill="#fbcfe8" stroke="#be185d" strokeWidth="0.5" className="active-svg-glow" />
                      <text x="20" y="22" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#ffffff">EBS vol-09aa</text>
                    </g>

                    {/* Flow conduits mapping PVC mounts in real-time */}
                    {eksStorageHover && (
                      <g>
                        {/* Highlights path from EBS Disk to EC2 Node Pod */}
                        <path d="M 40,230 L 60,200" fill="none" stroke="#be185d" strokeWidth="2" strokeDasharray="3,3" className="flow-line-active" />
                        <path d="M 60,200 L 70,165" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3,3" className="flow-line-active" />

                        {/* Floating Tooltip Card */}
                        <g transform="translate(110, 225)">
                          <rect x="0" y="0" width="165" height="36" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" className="active-svg-glow" />
                          <text x="82.5" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#6b21a8" fontFamily="monospace">AWS STORAGE CONTROLLER LOGS:</text>
                          <text x="82.5" y="24" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#701a75">
                            {eksStorageHover === 'pvc' && 'Claim: [AppClaim] &rarr; size: 20Gi (gp3)'}
                            {eksStorageHover === 'sc' && 'StorageClass: ebs.csi.aws.com gp3'}
                            {eksStorageHover === 'pv' && 'PersistentVolume: vol-09aa BOUND'}
                            {eksStorageHover === 'csi' && 'CSI: Attach physical EBS to EC2 Host'}
                            {eksStorageHover === 'mount' && 'Mount: /dev/xvda mapped into Pod /data'}
                          </text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Glossary */}
            <div className="ecs-card">
              <h4 className="ecs-card-title">
                📚 Amazon EKS Control Plane &amp; CSI Storage Glossary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">☸️ EKS Control Plane</strong>
                  Highly available master nodes managed in multi-AZ by AWS. Runs the API Server, Controller Manager, Scheduler, and etcd cluster state store.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">💻 EKS Node Groups</strong>
                  Worker machines running container daemons (kubelet) and networking. Can be Managed EC2, Self-Managed EC2, or serverless Fargate profiles.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🔗 AWS VPC CNI Plugin</strong>
                  High-performance networking adapter that assigns native AWS private IP addresses from your subnets directly to Kubernetes Pods.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">📀 CSI Storage Volume</strong>
                  Container Storage Interface abstraction. Installs driver adapters (`ebs.csi.aws.com`) enabling pods to mount secure AWS EBS SSD volumes.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">📝 PersistentVolumeClaim (PVC)</strong>
                  Developer manifest outlining specific requests for storage sizes, speed profiles, and sharing constraints (e.g. ReadWriteOnce).
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">⚙️ StorageClass (SC)</strong>
                  Kubernetes schema profile directing what disk drivers and speed tiers to spin up dynamically when a pod claims space.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: APP RUNNER & APP2CONTAINER */}
        {activeTab === 'runner-migration' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                ⚡ Accelerated App Virtualization &amp; Legacy Migration
              </h3>
              <p className="text-xs text-gray-600 mb-6">
                When full container orchestrators like ECS or EKS present unnecessary operations overhead, AWS offers streamlined tools for developer-centric web hosting and automated legacy server migrations.
              </p>
            </div>

            <div className="ecs-grid">
              {/* Left Column: AWS App Runner */}
              <div className="ecs-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="ecs-card-title">
                    🚀 AWS App Runner Serverless Pipeline
                  </h4>
                  <span className="badge font-mono text-[10px] bg-sky-100 text-sky-800 rounded px-2 py-0.5 font-bold">
                    FULLY MANAGED
                  </span>
                </div>

                <p className="ecs-card-desc mb-4">
                  AWS App Runner is a developer-centric service designed to build, deploy, and run load-balanced API web services automatically. You skip writing task definitions, provisioning ALBs, or adjusting scaling parameters completely.
                </p>

                {/* Pipeline trigger configuration */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Configure Deployment Pipeline</span>
                  <div className="flex gap-2 mb-3">
                    <button
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${appRunnerTrigger === 'git'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      onClick={() => {
                        setAppRunnerTrigger('git');
                        setAppRunnerDeployState('idle');
                        setAppRunnerProgress(0);
                      }}
                    >
                      🐈 GitHub Repo Sync
                    </button>
                    <button
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${appRunnerTrigger === 'ecr'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      onClick={() => {
                        setAppRunnerTrigger('ecr');
                        setAppRunnerDeployState('idle');
                        setAppRunnerProgress(0);
                      }}
                    >
                      🐳 ECR Image Push
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-500" />
                      <span>VPC RDS Database Connector</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={appRunnerVpcDbLinked}
                        onChange={(e) => setAppRunnerVpcDbLinked(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <button
                    className="w-full ecs-btn ecs-btn-primary py-2 text-xs font-bold"
                    disabled={appRunnerDeployState !== 'idle' && appRunnerDeployState !== 'completed'}
                    onClick={() => {
                      // Trigger Deploy Stepper
                      setAppRunnerDeployState('fetching');
                      setAppRunnerProgress(10);
                      let stage = 0;
                      const stages: ('fetching' | 'building' | 'deploying' | 'completed')[] = ['fetching', 'building', 'deploying', 'completed'];
                      const interval = setInterval(() => {
                        stage++;
                        if (stage < stages.length) {
                          setAppRunnerDeployState(stages[stage]);
                          setAppRunnerProgress(10 + stage * 30);
                        } else {
                          clearInterval(interval);
                          setAppRunnerDeployState('completed');
                          setAppRunnerProgress(100);
                        }
                      }, 2000);
                    }}
                  >
                    {appRunnerDeployState === 'idle' && '🚀 Trigger App Runner Deployment'}
                    {appRunnerDeployState === 'fetching' && '📥 Fetching Source (GitHub)...'}
                    {appRunnerDeployState === 'building' && '🐳 Compiling Container Image...'}
                    {appRunnerDeployState === 'deploying' && '⚙️ Provisioning Subnets &amp; ALB...'}
                    {appRunnerDeployState === 'completed' && '✅ Deployment Live! (Redeploy)'}
                  </button>
                </div>

                {/* SVG Pipeline Visualization */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-[240px]">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415511_1px,transparent_1px),linear-gradient(to_bottom,#33415511_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                  <svg width="100%" height="180" viewBox="0 0 400 180" className="z-10">
                    <defs>
                      <linearGradient id="runnerChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#eab308" />
                      </linearGradient>
                      <linearGradient id="dbChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#93c5fd" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="sourceChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                    </defs>

                    {/* Source Node - Flat 3D box */}
                    <g transform="translate(15, 60)">
                      <polygon points="5,40 65,40 75,28 15,28" fill="url(#sourceChassisGrad)" stroke="#475569" strokeWidth="0.5" />
                      <polygon points="5,40 65,40 65,52 5,52" fill="#1e293b" />
                      <polygon points="65,40 75,28 75,40 65,52" fill="#0f172a" />
                      <text x="40" y="49" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
                        {appRunnerTrigger === 'git' ? '🐈 GIT CODE' : '🐳 ECR IMAGE'}
                      </text>
                      <text x="40" y="24" textAnchor="middle" fontSize="11">
                        {appRunnerTrigger === 'git' ? '🐈' : '🐳'}
                      </text>
                    </g>

                    {/* App Runner Controller Node - Large elevated 3D server pool */}
                    <g transform="translate(160, 50)">
                      {appRunnerDeployState !== 'idle' && appRunnerDeployState !== 'completed' && (
                        <ellipse cx="40" cy="35" rx="42" ry="18" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" className="cyber-heartbeat" />
                      )}
                      <polygon points="5,48 75,48 85,32 15,32" fill="url(#runnerChassisGrad)" stroke="#eab308" strokeWidth="0.5" className={appRunnerDeployState !== 'idle' ? 'active-svg-glow' : ''} />
                      <polygon points="5,48 75,48 75,64 5,64" fill="#ca8a04" />
                      <polygon points="75,48 85,32 85,48 75,64" fill="#854d0e" />
                      <text x="45" y="60" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff" fontFamily="monospace">🚀 APPRUNNER</text>
                      <text x="45" y="26" textAnchor="middle" fontSize="14">🚀</text>
                    </g>

                    {/* Private RDS DB Node - 3D cylinder */}
                    <g transform="translate(305, 55)" className={appRunnerVpcDbLinked ? 'active-svg-glow' : ''}>
                      <ellipse cx="25" cy="10" rx="20" ry="6" fill="url(#dbChassisGrad)" stroke="#3b82f6" strokeWidth="0.5" />
                      <path d="M 5,10 L 5,42 A 20,6 0 0,0 45,42 L 45,10" fill="url(#dbChassisGrad)" stroke="#3b82f6" strokeWidth="0.5" />
                      <ellipse cx="25" cy="42" rx="20" ry="6" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="0.5" className="active-svg-glow" />
                      <text x="25" y="30" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e3a8a">💾 RDS DB</text>
                    </g>

                    {/* Connection paths */}
                    {/* Path 1: Source -> App Runner */}
                    <path d="M 80,95 L 170,95" fill="none" stroke={appRunnerDeployState !== 'idle' ? '#eab308' : '#475569'} strokeWidth="2"
                      className={appRunnerDeployState === 'fetching' || appRunnerDeployState === 'building' ? 'flow-line-active' : ''}
                    />

                    {/* Path 2: App Runner -> RDS Private VPC link */}
                    {appRunnerVpcDbLinked && (
                      <path d="M 235,95 L 305,95" fill="none" stroke="#3b82f6" strokeWidth="2"
                        className={appRunnerDeployState === 'deploying' || appRunnerDeployState === 'completed' ? 'flow-line-active' : ''}
                      />
                    )}

                    {/* Stepper info footer overlay inside SVG */}
                    {appRunnerDeployState !== 'idle' && (
                      <g transform="translate(200, 158)">
                        <rect x="-105" y="-12" width="210" height="20" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <text y="1" fontFamily="var(--font-mono)" fontSize="8" textAnchor="middle" fill="#fef08a">
                          {appRunnerDeployState === 'fetching' && 'Step 1: Pulling Git commit...'}
                          {appRunnerDeployState === 'building' && 'Step 2: Compiling Dockerfile...'}
                          {appRunnerDeployState === 'deploying' && 'Step 3: Private VPC ENI Gateway routing...'}
                          {appRunnerDeployState === 'completed' && 'Step 4: AWS App Runner Service LIVE!'}
                        </text>
                      </g>
                    )}
                  </svg>

                  {/* Deploy status bar */}
                  {appRunnerDeployState !== 'idle' && (
                    <div className="absolute bottom-2 left-4 right-4 bg-slate-800 p-2 rounded-lg border border-slate-700 flex items-center gap-3">
                      <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-500"
                          style={{ width: `${appRunnerProgress}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[9px] text-amber-400 font-bold shrink-0">{appRunnerProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AWS App2Container CLI Migration */}
              <div className="ecs-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="ecs-card-title">
                    🐧 AWS App2Container Legacy Migration Simulator
                  </h4>
                  <span className="badge font-mono text-[10px] bg-purple-100 text-purple-800 rounded px-2 py-0.5 font-bold">
                    MIGRATION CLI
                  </span>
                </div>

                <p className="ecs-card-desc mb-4">
                  Stuck with massive legacy workloads? App2Container is an interactive command-line migration utility. It inventories, analyzes, and automatically containerizes existing legacy ASP.NET (IIS) or Java applications running on VM systems.
                </p>

                {/* Stepper Wizard Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Enterprise Migration CLI Pipeline</span>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className={`p-2 rounded-lg text-center border transition-all ${a2cStep >= 0 ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold' : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      <span className="block font-bold text-[10px]">Step 1</span>
                      <span className="text-[8px] uppercase font-bold">Inventory</span>
                    </div>
                    <div className={`p-2 rounded-lg text-center border transition-all ${a2cStep >= 1 ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold' : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      <span className="block font-bold text-[10px]">Step 2</span>
                      <span className="text-[8px] uppercase font-bold">Analyze</span>
                    </div>
                    <div className={`p-2 rounded-lg text-center border transition-all ${a2cStep >= 2 ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold' : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      <span className="block font-bold text-[10px]">Step 3</span>
                      <span className="text-[8px] uppercase font-bold">Pack</span>
                    </div>
                    <div className={`p-2 rounded-lg text-center border transition-all ${a2cStep >= 3 ? 'bg-purple-50 border-purple-200 text-purple-800 font-bold' : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                      <span className="block font-bold text-[10px]">Step 4</span>
                      <span className="text-[8px] uppercase font-bold">Deploy</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 ecs-btn ecs-btn-secondary py-1.5 text-xs font-semibold"
                      disabled={a2cStep === 0 || a2cIsRunning}
                      onClick={() => {
                        const prev = a2cStep - 1;
                        setA2cStep(prev);
                        updateA2cConsole(prev);
                      }}
                    >
                      ⏮️ Previous CLI Step
                    </button>

                    <button
                      className="flex-1 ecs-btn ecs-btn-primary bg-purple-600 hover:bg-purple-700 py-1.5 text-xs font-semibold"
                      disabled={a2cStep === 3 || a2cIsRunning}
                      onClick={() => {
                        const next = a2cStep + 1;
                        setA2cIsRunning(true);
                        setA2cTerminalOutput(prev => [...prev, `\n⚡ Running migration process phase ${next + 1}...`]);
                        setTimeout(() => {
                          setA2cStep(next);
                          updateA2cConsole(next);
                          setA2cIsRunning(false);
                        }, 1200);
                      }}
                    >
                      {a2cIsRunning ? '⏳ Compiling Migration...' : '🏃 Run Next CLI Step 🚀'}
                    </button>
                  </div>
                </div>

                {/* Realistic Migration Terminal Output */}
                <div className="ecs-code-terminal p-4 h-[240px] flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 text-slate-500 text-[10px]">
                    <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> APP2CONTAINER DEVELOPER CONSOLE</span>
                    <span className="font-mono text-[9px] text-purple-400 font-bold">A2C CLI V2.0</span>
                  </div>
                  <div className="flex-1 overflow-auto flex flex-col gap-1 pr-1 text-slate-300 font-mono text-[10px]">
                    {a2cTerminalOutput.map((line, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">
                        {line.startsWith('$') ? (
                          <span className="text-yellow-400 font-bold">{line}</span>
                        ) : line.includes('SUCCESS') || line.includes('Discovered') ? (
                          <span className="text-green-400 font-bold">{line}</span>
                        ) : line.includes('ERROR') ? (
                          <span className="text-red-400">{line}</span>
                        ) : line.startsWith('  -') ? (
                          <span className="text-sky-400">{line}</span>
                        ) : (
                          <span>{line}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 📚 Educational Theory Glossary */}
            <div className="ecs-card">
              <h4 className="ecs-card-title">
                📚 AWS Serverless Containers &amp; CLI Migration Glossary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🚀 AWS App Runner</strong>
                  Fully managed, secure orchestrator that compiles and routes HTTPS traffic directly to web containers from GitHub/ECR without ALB or VPC setups.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🔌 VPC Connector</strong>
                  Elastic Network Interfaces dynamically generated inside subnets, enabling App Runner instances to securely request private RDS/ElastiCache data.
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-normal">
                  <strong className="text-amber-600 block mb-1">🛠️ AWS App2Container (A2C)</strong>
                  Advanced CLI migrator analyzing VM application structures and exporting compile-ready Dockerfiles alongside CloudFormation deployment manifests.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DYNAMIC PLAYGROUND SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="flex flex-col gap-6">
            {/* Top controls dashboard */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  🎮 Container Orchestration &amp; Auto-Scaling Playground
                </h3>
                <p className="text-xs text-gray-500">
                  Trigger mock traffic bursts, SQS queue backups, or manual chaos tasks. Watch ECS auto scale tasks in real time!
                </p>
              </div>

              {/* Simulation engine controls */}
              <div className="flex gap-2.5 flex-wrap items-center">
                {/* Traffic surge buttons */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${simTrafficLevel === 'low'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-transparent text-slate-500 border border-transparent hover:bg-slate-100'
                      }`}
                    onClick={() => {
                      setSimTrafficLevel('low');
                      logEvent('🟢 Traffic workload level set to: LOW.');
                    }}
                  >
                    LOW 🟢
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${simTrafficLevel === 'normal'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-transparent text-slate-500 border border-transparent hover:bg-slate-100'
                      }`}
                    onClick={() => {
                      setSimTrafficLevel('normal');
                      logEvent('🟡 Traffic workload level set to: NORMAL.');
                    }}
                  >
                    NORMAL 🟡
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${simTrafficLevel === 'surge'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-transparent text-slate-500 border border-transparent hover:bg-slate-100'
                      }`}
                    onClick={() => {
                      setSimTrafficLevel('surge');
                      logEvent('💥 WARNING: Injected DDoS traffic surge workload in clients!');
                    }}
                  >
                    SURGE 💥
                  </button>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-xs">
                  <span className="text-[9px] font-bold text-slate-500">AUTO SCALING</span>
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                    checked={autoScaleEnabled}
                    onChange={(e) => {
                      setAutoScaleEnabled(e.target.checked);
                      logEvent(`ℹ️ ECS Auto-Scaling engine ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`);
                    }}
                  />
                </div>

                <button
                  className={`anl-btn flex items-center gap-1 py-1.5 ${simIsRunning ? 'anl-on' : ''}`}
                  onClick={() => {
                    setSimIsRunning(prev => !prev);
                    logEvent(simIsRunning ? '⏹ Simulation engine paused.' : '▶ Simulation engine resumed.');
                  }}
                >
                  {simIsRunning ? (
                    <>
                      <Square className="w-3.5 h-3.5" /> Pause simulation
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start Engine
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left/Center Column: Canvas and Event Logs (Col Span 8) */}
              <div className="lg:col-span-9 flex flex-col gap-6">

                {/* Center Canvas Animation Display */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Cluster Network Pipeline SVG Dashboard</span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">100% State-Reactive Vector Map</span>
                  </div>
                  <div className="flex justify-center items-center bg-[#0a0f1d] rounded-xl p-3 border border-slate-800 shadow-inner overflow-x-auto w-full">
                    <svg
                      width={860}
                      height={400}
                      viewBox="0 0 860 400"
                      className="rounded-lg shadow-2xl border border-slate-900 bg-[#0a0f1d] ecs-svg-bg"
                      style={{ minWidth: '800px', width: '900px', height: '400px' }}
                    >
                      {/* Definitions for 3D Gradients and Patterns */}
                      <defs>
                        <linearGradient id="simAlbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="webTaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <linearGradient id="workerTaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="cronTaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="sqsChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#be185d" />
                        </linearGradient>
                      </defs>

                      {/* 1. Client App Station Console */}
                      <g transform="translate(15, 120)">
                        {/* 3D Chassis */}
                        <polygon points="5,80 115,80 125,65 15,65" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                        <polygon points="5,80 115,80 115,150 5,150" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
                        <polygon points="115,80 125,65 125,135 115,150" fill="#020617" />
                        <text x="60" y="93" textAnchor="middle" fontSize="7.5" fill="#38bdf8" fontWeight="bold" fontFamily="monospace">👤 USER CLIENTS</text>
                        <rect x="15" y="102" width="90" height="35" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                        <text x="60" y="114" textAnchor="middle" fontSize="8" fill="#e2e8f0" fontWeight="bold">LOAD: {simTrafficLevel.toUpperCase()}</text>
                        <text x="60" y="128" textAnchor="middle" fontSize="7.5" fill="#f87171" fontWeight="bold" fontFamily="monospace">
                          {simTrafficLevel === 'low' && 'Rate: ~15 RPS'}
                          {simTrafficLevel === 'normal' && 'Rate: ~50 RPS'}
                          {simTrafficLevel === 'surge' && 'Rate: ~240 RPS'}
                        </text>
                      </g>

                      {/* 2. ALB Octagon Load Balancer Hub */}
                      <g transform="translate(160, 160)" className={simIsRunning ? 'active-svg-glow' : ''}>
                        <polygon points="12,0 38,0 50,12 50,38 38,50 12,50 0,38 0,12" fill="url(#simAlbGrad)" stroke="#ff9900" strokeWidth="1" />
                        <text x="25" y="23" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffffff">⚖️ ALB</text>
                        <text x="25" y="35" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">HTTP</text>
                        {simIsRunning && (
                          <circle cx="25" cy="25" r="32" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,4" className="cyber-heartbeat" />
                        )}
                      </g>

                      {/* 3. EventBridge Scheduled clock rule */}
                      <g transform="translate(155, 30)">
                        <circle cx="30" cy="30" r="24" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" className={simIsRunning ? 'active-svg-glow' : ''} />
                        <line x1="30" y1="30" x2="30" y2="12" stroke="#701a75" strokeWidth="2" />
                        <line x1="30" y1="30" x2="42" y2="35" stroke="#701a75" strokeWidth="1.5" />
                        <text x="30" y="65" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#c084fc">EventBridge Cron</text>
                      </g>

                      {/* 4. SQS Queue Horizontal Chassis */}
                      <g transform="translate(130, 290)" className={sqsQueueDepth > 0 ? 'active-svg-glow' : ''}>
                        {/* Queue base */}
                        <rect x="0" y="10" width="110" height="50" rx="4" fill="#1e293b" stroke="#f43f5e" strokeWidth="1" />
                        <text x="55" y="24" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fda4af">✉️ SQS QUEUE</text>
                        <text x="55" y="36" textAnchor="middle" fontSize="7.5" fill="#fda4af" fontFamily="monospace">depth: {sqsQueueDepth} jobs</text>

                        {/* Message envelopes slots inside the queue chassis */}
                        <g transform="translate(10, 42)">
                          {Array.from({ length: Math.min(5, sqsQueueDepth) }).map((_, idx) => (
                            <rect
                              key={idx}
                              x={idx * 18}
                              y={0}
                              width="14"
                              height="10"
                              rx="1"
                              fill="#ffe4e6"
                              stroke="#f43f5e"
                              strokeWidth="0.5"
                              className="animate-pulse"
                            />
                          ))}
                          {sqsQueueDepth > 5 && (
                            <text x="90" y="8" fontSize="7" fontWeight="bold" fill="#fda4af">+</text>
                          )}
                        </g>
                      </g>

                      {/* Animated Conduits connecting elements */}
                      {/* Client -> ALB */}
                      <path d="M 130,190 L 160,190" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,3" className={simIsRunning ? 'flow-line-active' : ''} />

                      {/* Cron -> WebTask Subnet */}
                      <path d="M 205,54 L 300,54" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3,3" className={simIsRunning ? 'flow-line-active' : ''} />

                      {/* ALB -> Web subnet target dispatch */}
                      <path d="M 210,185 L 290,120" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="6,4" className={simIsRunning ? 'flow-line-active' : ''} />

                      {/* ALB -> SQS enqueueing */}
                      <path d="M 185,210 L 185,290" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="6,4" className={simIsRunning && sqsQueueDepth > 0 ? 'flow-line-active' : ''} />

                      {/* SQS -> Worker Subnet polling */}
                      <path d="M 240,320 L 290,320" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6,4" className={simIsRunning && sqsQueueDepth > 0 ? 'flow-line-active' : ''} />


                      {/* VPC boundary with glass subnets */}
                      <g transform="translate(290, 20)">
                        <rect x="0" y="0" width="550" height="360" rx="12" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,6" />
                        <text x="540" y="15" textAnchor="end" fontSize="7.5" fontWeight="bold" fill="#94a3b8" fontFamily="monospace">AWS VPC BOUNDARY (10.0.0.0/16)</text>

                        {/* Web Subnet */}
                        <g transform="translate(10, 20)">
                          <rect x="0" y="0" width="530" height="150" rx="8" fill="rgba(240, 253, 244, 0.05)" stroke="#10b981" strokeWidth="1" strokeDasharray="4,4" />
                          <text x="10" y="12" fontSize="7" fontWeight="bold" fill="#4ade80">Web Subnet (Public Target Group)</text>
                        </g>

                        {/* Worker Subnet */}
                        <g transform="translate(10, 200)">
                          <rect x="0" y="0" width="530" height="150" rx="8" fill="rgba(254, 243, 199, 0.05)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,4" />
                          <text x="10" y="12" fontSize="7" fontWeight="bold" fill="#fbbf24">Worker Subnet (Private SQS Workers)</text>
                        </g>
                      </g>

                      {/* State-reactive mapped Task blocks */}
                      {simTasks.filter(t => t.status !== 'STOPPED').map((task, idx) => {
                        // Dynamically calculate coordinate placements inside VPC
                        let xOffset = 310;
                        let yOffset = 55;
                        let taskColor = "url(#webTaskGrad)";
                        let strokeColor = "#0ea5e9";

                        if (task.type === 'web') {
                          xOffset = 310 + (idx % 4) * 125;
                          yOffset = 65;
                          taskColor = "url(#webTaskGrad)";
                          strokeColor = "#0ea5e9";
                        } else if (task.type === 'worker') {
                          xOffset = 310 + (idx % 4) * 125;
                          yOffset = 245;
                          taskColor = "url(#workerTaskGrad)";
                          strokeColor = "#10b981";
                        } else if (task.type === 'cron') {
                          xOffset = 310 + (idx % 4) * 125;
                          yOffset = 155;
                          taskColor = "url(#cronTaskGrad)";
                          strokeColor = "#a855f7";
                        }

                        return (
                          <g key={task.id} transform={`translate(${xOffset}, ${yOffset})`}>
                            {/* 3D server chassis block */}
                            <polygon points="5,35 105,35 113,23 13,23" fill={taskColor} stroke={strokeColor} strokeWidth="0.5" className={task.status === 'PROVISIONING' ? 'active-svg-glow' : ''} />
                            <polygon points="5,35 105,35 105,75 5,75" fill={task.status === 'PROVISIONING' ? '#78350f' : '#1e293b'} stroke={strokeColor} strokeWidth="0.5" />
                            <polygon points="105,35 113,23 113,63 105,75" fill="#0f172a" />

                            {/* Task name */}
                            <text x="55" y="32" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold" fontFamily="monospace">{task.name}</text>

                            {task.status === 'PROVISIONING' ? (
                              <g>
                                {/* Spinning loading indicator */}
                                <circle cx="55" cy="52" r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="18,6" className="flow-line-active" />
                                <text x="55" y="68" textAnchor="middle" fontSize="6.5" fill="#f59e0b" fontWeight="bold" className="animate-pulse">PROVISIONING</text>
                              </g>
                            ) : (
                              <g>
                                {/* Active heartbeat line */}
                                <path d="M 12,50 L 22,50 L 25,40 L 28,60 L 31,50 L 41,50" fill="none" stroke="#22c55e" strokeWidth="1" />
                                <text x="45" y="49" fontSize="6" fill="#a7f3d0" fontWeight="bold">UP: {task.uptime}s</text>

                                {/* Live CPU resource utilization progress bar fill */}
                                <text x="12" y="61" fontSize="6" fill="#94a3b8" fontWeight="bold">CPU UTIL: {task.cpu}%</text>
                                <rect x="12" y="64" width="85" height="5" rx="2" fill="#334155" />
                                <rect x="12" y="64" width={Math.max(3, 85 * (task.cpu / 100))} height="5" rx="2" fill={task.cpu > 80 ? '#ef4444' : '#10b981'} />
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {simTasks.filter(t => t.status !== 'STOPPED').length === 0 && (
                        <g transform="translate(420, 160)">
                          <rect x="0" y="0" width="220" height="50" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="1" />
                          <text x="110" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f87171">⚠️ ECS CLUSTER COMPUTE FLEET EMPTY</text>
                          <text x="110" y="38" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Scale Web/Worker above to spin up containers.</text>
                        </g>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Event Logs console */}
                <div className="border border-slate-800 bg-slate-900 rounded-2xl p-5 text-slate-300 font-mono text-[10px] shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-500">
                    <span className="flex items-center gap-2 font-bold tracking-wide"><Terminal className="w-4 h-4 text-amber-500" /> EVENTBRIDGE / ECS CONTAINER TELEMETRY LOGS</span>
                    <button
                      className="text-[9px] hover:text-slate-300 border border-slate-800 px-2 py-1 rounded-lg hover:bg-slate-800 transition-all font-semibold"
                      onClick={() => setSimLogs([])}
                    >
                      Clear Log Buffer
                    </button>
                  </div>
                  <div className="h-[180px] overflow-auto flex flex-col gap-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {simLogs.length > 0 ? (
                      simLogs.map((log, idx) => (
                        <div key={idx} className="console-line">
                          {log.includes('State changed to: RUNNING') || log.includes('boot instantly') ? (
                            <span className="console-log-success">{log}</span>
                          ) : log.includes('exited') || log.includes('STOPPED') || log.includes('Terminated') ? (
                            <span className="console-log-error">{log}</span>
                          ) : log.includes('Alarm') || log.includes('Scaling') ? (
                            <span className="console-log-warn">{log}</span>
                          ) : log.includes('ECR') || log.includes('popped') ? (
                            <span className="console-log-highlight">{log}</span>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 italic">No logs generated. Trigger active loads or cron tasks above to see pipelines compile.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Controls, Metrics, and Task List (Col Span 4) */}
              <div className="lg:col-span-3 flex flex-col gap-6">

                {/* Orchestrator controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3.5">Cluster Operators Console</span>

                  <div className="flex flex-col gap-2.5">
                    <button
                      className="w-full text-left py-2 px-2.5 border border-amber-200 bg-amber-50/50 text-amber-800 text-[10.5px] rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-between font-semibold"
                      onClick={handleAddSqsJob}
                    >
                      <span>📥 Add SQS Backlog Jobs (+3)</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                    </button>

                    <button
                      className="w-full text-left py-2 px-2.5 border border-purple-200 bg-purple-50/50 text-purple-800 text-[10.5px] rounded-xl hover:bg-purple-100 transition-colors flex items-center justify-between font-semibold"
                      onClick={handleEventBridgeCron}
                    >
                      <span>⏰ Trigger EventBridge Cron</span>
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                    </button>

                    <button
                      className="w-full text-left py-2 px-2.5 border border-rose-200 bg-rose-50/50 text-rose-800 text-[10.5px] rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-between font-semibold"
                      onClick={handleChaosCrash}
                    >
                      <span>🧨 Inject Chaos: Crash Task</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                      <button
                        className="py-1.5 px-1 bg-slate-900 border border-slate-800 text-slate-300 text-[9.5px] font-bold rounded-xl hover:bg-slate-800 transition-all text-center"
                        onClick={() => handleManualScaleUp('web')}
                      >
                        ➕ Scale Web
                      </button>
                      <button
                        className="py-1.5 px-1 bg-slate-900 border border-slate-800 text-slate-300 text-[9.5px] font-bold rounded-xl hover:bg-slate-800 transition-all text-center"
                        onClick={() => handleManualScaleUp('worker')}
                      >
                        ➕ Scale Worker
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live charts */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Realtime Cluster Telemetry</span>
                  <div className="h-[130px] w-full text-xs">
                    {simStatsHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simStatsHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="time" hide />
                          <YAxis fontSize={8} />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={1.5} name="Active Tasks" dot={false} />
                          <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={1.5} name="Average CPU" dot={false} />
                          <Line type="monotone" dataKey="queue" stroke="#d97706" strokeWidth={1.5} name="Queue Depth" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        Gathering cluster telemetry...
                      </div>
                    )}
                  </div>
                </div>

                {/* ECS Cluster Task List Table */}
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">ECS Active Container Tasks ({simTasks.filter(t => t.status !== 'STOPPED').length})</span>

                  <div className="flex flex-col gap-2 max-h-[190px] overflow-auto pr-1">
                    {simTasks.filter(t => t.status !== 'STOPPED').length > 0 ? (
                      simTasks.filter(t => t.status !== 'STOPPED').map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-slate-50 text-[11px] hover:border-red-300 transition-colors"
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${task.status === 'PROVISIONING' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                                }`}></span>
                              {task.name}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              Type: <span className="font-semibold text-slate-700 uppercase">{task.type}</span> | CPU: {task.cpu}% | Uptime: {task.uptime}s
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`badge font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${task.status === 'PROVISIONING' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                              }`}>
                              {task.status}
                            </span>
                            <button
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-200"
                              title="Force Kill Container"
                              onClick={() => handleKillTask(task.id, task.name)}
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs italic text-slate-400">
                        ECS Cluster empty. Use controls above to spin up tasks.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Simple internal icon proxy to prevent missing icon dependencies in imports
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
