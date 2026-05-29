import { useEffect, useRef, useState, useCallback } from 'react';
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

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  type: 'web' | 'sqs' | 'cron';
  state: 'to_lb' | 'to_web_task' | 'to_sqs' | 'to_worker_task' | 'done';
  taskId?: string;
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const simIsRunningRef = useRef(simIsRunning);

  useEffect(() => {
    simIsRunningRef.current = simIsRunning;
  }, [simIsRunning]);

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
          const workerIndexInGroup = simTasks.filter(t => t.type === 'worker').findIndex(t => t.id === worker.id);
          logEvent(`📦 Task ${worker.name} popped 1 job from SQS Queue. Processing...`);
          // Spawn particle towards worker
          if (canvasRef.current) {
            particlesRef.current.push({
              id: particleIdRef.current++,
              x: 260, // Widescreen SQS X
              y: 310, // Widescreen SQS Y
              targetX: 760 - 60, // Worker Tasks Private Subnet Left boundary (tx - 60 = 700)
              targetY: 205 + (workerIndexInGroup !== -1 ? workerIndexInGroup * 45 : i * 45),
              speed: 4,
              color: '#d97706',
              type: 'sqs',
              state: 'to_worker_task',
              taskId: worker.id
            });
          }
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

  // Canvas Particle Loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. High-Tech Cyber Blueprint Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#111e36';
    ctx.lineWidth = 0.5;
    const gridSpacing = 20;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Widescreen Spacious Coordinates (Optimized for 880x400 resolution)
    const clientX = 80;
    const clientY = 90;
    const albX = 260;
    const albY = 90;
    const sqsX = 260;
    const sqsY = 310;
    const ebX = 80;
    const ebY = 210;

    const webTasksX = 540;
    const webTasksYStart = 85;

    const workerTasksX = 760;
    const workerTasksYStart = 205;

    // Connect conduit paths with glowing lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clientX + 35, clientY);
    ctx.lineTo(albX - 35, albY);
    ctx.stroke();

    // 2. Render static infrastructure nodes with modern styling
    // HTTP Client Node
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(clientX - 35, clientY - 30, 70, 60, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Double border inside HTTP Client Node
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(clientX - 31, clientY - 26, 62, 52, 6);
    ctx.stroke();

    // Node contents
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 9.5px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.fillText('🌍 CLIENTS', clientX, clientY - 12);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px var(--font-mono)';
    let rateStr = 'Rate: 15/s';
    if (simTrafficLevel === 'low') rateStr = 'Rate: 3/s';
    if (simTrafficLevel === 'surge') rateStr = 'Rate: 240/s';
    ctx.fillText(rateStr, clientX, clientY + 5);
    ctx.fillStyle = simTrafficLevel === 'surge' ? '#ef4444' : '#10b981';
    ctx.font = 'bold 7px var(--font-sans)';
    ctx.fillText(simTrafficLevel === 'surge' ? '⚠️ SURGE LOAD' : '🟢 HEALTHY', clientX, clientY + 16);

    // ALB Load Balancer Node
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(2, 132, 199, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(albX - 35, albY - 25, 70, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Inner panel inside ALB Node
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(albX - 31, albY - 21, 62, 42, 6);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px var(--font-sans)';
    ctx.fillText('⚖️ ALB', albX, albY - 6);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px var(--font-mono)';
    ctx.fillText('Port: 443', albX, albY + 6);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 7.5px var(--font-mono)';
    ctx.fillText('HTTP \u2192 HTTP', albX, albY + 16);

    // SQS Message Queue Node
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(sqsX - 45, sqsY - 25, 90, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px var(--font-sans)';
    ctx.fillText('✉️ SQS QUEUE', sqsX, sqsY - 10);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px var(--font-mono)';
    ctx.fillText(`Depth: ${sqsQueueDepth} jobs`, sqsX, sqsY + 1);

    // Draw SQS queue message slots inside the card to visually represent depth
    const maxSlots = 5;
    const slotWidth = 10;
    const slotHeight = 10;
    const totalSlotWidth = maxSlots * slotWidth + (maxSlots - 1) * 3;
    const startSlotX = sqsX - totalSlotWidth / 2;
    const slotY = sqsY + 8;

    for (let slotIdx = 0; slotIdx < maxSlots; slotIdx++) {
      ctx.strokeStyle = '#451a03';
      ctx.fillStyle = '#1e1b4b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(startSlotX + (slotIdx * 13), slotY, slotWidth, slotHeight, 2);
      ctx.fill();
      ctx.stroke();

      if (slotIdx < sqsQueueDepth) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.roundRect(startSlotX + (slotIdx * 13) + 1, slotY + 1, slotWidth - 2, slotHeight - 2, 1);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // EventBridge Cron Node
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ebX, ebY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Pulsing outer clock timer ring
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ringRadius = 20 + Math.abs(Math.sin(Date.now() / 300)) * 6;
    ctx.arc(ebX, ebY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 8px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.fillText('⏰ CRON', ebX, ebY - 3);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 6.5px var(--font-mono)';
    ctx.fillText('EB RULE', ebX, ebY + 7);

    // 3. ECS Container subnet boundary box (VPC subnet - wider X: 430 to 860)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.roundRect(430, 15, 430, height - 30, 12);
    ctx.stroke();

    // Draw two inner subnets: Public Web Subnet and Private App Subnet
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Public Web Subnet Box (width 170)
    ctx.beginPath();
    ctx.roundRect(450, 42, 170, height - 72, 8);
    ctx.stroke();

    // Private App Subnet Box (width 170)
    ctx.beginPath();
    ctx.roundRect(670, 42, 170, height - 72, 8);
    ctx.stroke();

    ctx.setLineDash([]);

    // Subnet Labels
    ctx.fillStyle = 'rgba(16, 185, 129, 0.55)';
    ctx.font = 'bold 7.5px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText('PUBLIC WEB SUBNET', 535, 52);
    ctx.fillText('PRIVATE APP SUBNET', 755, 52);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 8px var(--font-mono)';
    ctx.textAlign = 'right';
    ctx.fillText('VPC SUBNET - ECS CLUSTER', width - 20, 28);

    // Draw active dynamic container cards in canvas as server blades
    const webTasks = simTasks.filter(t => t.type === 'web');
    webTasks.forEach((t, i) => {
      const tx = webTasksX;
      const ty = webTasksYStart + (i * 52);

      // Card Base background
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = t.status === 'PROVISIONING' ? '#fbbf24' : '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx - 60, ty - 16, 120, 32, 8);
      ctx.fill();
      ctx.stroke();

      // Glowing heartbeats LED
      ctx.fillStyle = t.status === 'PROVISIONING' ? '#fbbf24' : '#10b981';
      ctx.beginPath();
      const pulseRadius = 3 + Math.abs(Math.sin(Date.now() / 200)) * 1.5;
      ctx.arc(tx - 48, ty, t.status === 'PROVISIONING' ? 3 : pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Text name
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 8.5px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText(t.name, tx - 38, ty - 3);

      // CPU mini resource bar
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(tx - 38, ty + 5, 65, 4, 2);
      ctx.fill();

      // Fill resource bar
      if (t.status === 'RUNNING') {
        const fillWidth = (t.cpu / 100) * 65;
        ctx.fillStyle = t.cpu > 80 ? '#ef4444' : t.cpu > 50 ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(tx - 38, ty + 5, fillWidth, 4, 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '7px var(--font-mono)';
        ctx.fillText(`${t.cpu}%`, tx + 32, ty + 9);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'italic 7px var(--font-sans)';
        ctx.fillText('STARTING...', tx - 38, ty + 9);
      }

      // Connect ALB line
      ctx.strokeStyle = t.status === 'PROVISIONING' ? '#334155' : '#0284c735';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(albX + 35, albY);
      ctx.lineTo(tx - 60, ty);
      ctx.stroke();
    });

    const workerTasks = simTasks.filter(t => t.type === 'worker');
    workerTasks.forEach((t, i) => {
      const tx = workerTasksX;
      const ty = workerTasksYStart + (i * 45);

      // Card Base
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = t.status === 'PROVISIONING' ? '#fbbf24' : '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx - 60, ty - 15, 120, 30, 8);
      ctx.fill();
      ctx.stroke();

      // Led
      ctx.fillStyle = t.status === 'PROVISIONING' ? '#fbbf24' : '#3b82f6';
      ctx.beginPath();
      const pulseRadius = 3 + Math.abs(Math.sin(Date.now() / 250)) * 1.2;
      ctx.arc(tx - 48, ty - 2, t.status === 'PROVISIONING' ? 3 : pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 8px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText(t.name, tx - 38, ty - 3);

      // Status text
      if (t.status === 'RUNNING') {
        ctx.fillStyle = '#60a5fa';
        ctx.font = '7px var(--font-sans)';
        ctx.fillText(`⚙️ RUNNING | Load: ${t.cpu}%`, tx - 38, ty + 7);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'italic 7px var(--font-sans)';
        ctx.fillText('PROVISIONING...', tx - 38, ty + 7);
      }

      // Connect SQS line
      ctx.strokeStyle = t.status === 'PROVISIONING' ? '#334155' : '#b4530955';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sqsX + 45, sqsY);
      ctx.lineTo(tx - 60, ty);
      ctx.stroke();
    });

    const cronTasks = simTasks.filter(t => t.type === 'cron');
    cronTasks.forEach((t) => {
      const tx = 680;
      const ty = 90;

      // Base
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx - 60, ty - 15, 120, 30, 8);
      ctx.fill();
      ctx.stroke();

      // Led
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(tx - 48, ty - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 8px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText(t.name, tx - 38, ty - 3);
      ctx.fillStyle = '#c084fc';
      ctx.font = '7px var(--font-sans)';
      ctx.fillText(t.status === 'PROVISIONING' ? '⏳ MOUNTING...' : '🏃 BATCH RUNNING', tx - 38, ty + 7);

      // Connect EventBridge line
      ctx.strokeStyle = '#a855f745';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ebX + 20, ebY); // EventBridge rule node right boundary
      ctx.lineTo(tx - 60, ty); // Cron task left boundary
      ctx.stroke();
    });

    // 4. Telemetry overlay box directly in canvas (translucent glassy overlay)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(20, height - 85, 125, 65, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 8px var(--font-sans)';
    ctx.textAlign = 'left';
    ctx.fillText('📊 ECS CLUSTER METRICS', 28, height - 71);

    ctx.font = '7.5px var(--font-mono)';
    ctx.fillStyle = '#38bdf8';
    let latency = 'Latency: 12ms';
    if (simTrafficLevel === 'low') latency = 'Latency: 4ms';
    if (simTrafficLevel === 'surge') latency = 'Latency: 94ms ⚠️';
    ctx.fillText(latency, 28, height - 58);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Socket Conns: ${webTasks.filter(t => t.status === 'RUNNING').length + workerTasks.filter(t => t.status === 'RUNNING').length}`, 28, height - 47);
    ctx.fillStyle = '#10b981';
    ctx.fillText('API Healthcheck: 200 OK', 28, height - 36);

    // 5. Spawn dynamic HTTP request particles
    let spawnRate = 0.18;
    if (simTrafficLevel === 'low') spawnRate = 0.04;
    if (simTrafficLevel === 'surge') spawnRate = 0.65;

    if (simIsRunningRef.current && Math.random() < spawnRate && webTasks.filter(t => t.status === 'RUNNING').length > 0) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x: clientX + 35,
        y: clientY,
        targetX: albX - 35,
        targetY: albY,
        speed: 3.5 + Math.random() * 2.5,
        color: '#60a5fa',
        type: 'web',
        state: 'to_lb'
      });
    }

    // Spawn dynamic Cron rule request particles if Cron task is active
    const activeCron = simTasks.filter(t => t.type === 'cron' && t.status !== 'STOPPED');
    if (simIsRunningRef.current && activeCron.length > 0 && Math.random() < 0.15) {
      particlesRef.current.push({
        id: particleIdRef.current++,
        x: ebX + 20, // Widescreen EB Cron Node right edge
        y: ebY, // Widescreen EB Cron Node Y
        targetX: 760 - 60, // Cron Task App Subnet Left boundary (tx - 60 = 700)
        targetY: 90, // Cron Task Card Y (ty = 90)
        speed: 3,
        color: '#c084fc',
        type: 'cron',
        state: 'to_worker_task'
      });
    }

    // Process and draw particles
    const particles = particlesRef.current;
    particlesRef.current = particles.filter((p) => {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        if (p.state === 'to_lb') {
          // Route from ALB to a running web task
          const runningWeb = webTasks.filter(t => t.status === 'RUNNING');
          if (runningWeb.length > 0) {
            const index = Math.floor(Math.random() * runningWeb.length);
            const targetTask = runningWeb[index];
            const webIndexInGroup = simTasks.filter(t => t.type === 'web').findIndex(t => t.id === targetTask.id);

            p.targetX = webTasksX - 60;
            p.targetY = webTasksYStart + (webIndexInGroup * 52);
            p.state = 'to_web_task';
            p.taskId = targetTask.id;
          } else {
            return false;
          }
        } else if (p.state === 'to_web_task') {
          return false; // Reached container web task
        } else if (p.state === 'to_worker_task') {
          return false; // Reached container worker task
        } else {
          return false;
        }
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Draw particle as a glowing neon dot
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      return true;
    });

    if (simIsRunningRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(drawCanvas);
    }
  }, [simTasks, sqsQueueDepth, simTrafficLevel]);

  useEffect(() => {
    if (activeTab === 'simulation') {
      if (simIsRunning) {
        drawCanvas();
      } else {
        setTimeout(drawCanvas, 100);
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [activeTab, simIsRunning, drawCanvas]);



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
        .ecs-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        .ecs-card:hover {
          border-color: #eab308;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
        }
        .ecs-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ecs-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .ecs-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .ecs-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid transparent;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          outline: none;
        }
        .ecs-tb:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .ecs-tb.ecs-on {
          background: #fef9c3;
          color: #a16207;
          border-color: #fef08a;
          box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.05);
        }
        .ecs-input, .ecs-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          outline: none;
          transition: all 0.15s ease;
        }
        .ecs-input:focus, .ecs-select:focus {
          border-color: #eab308;
          box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.15);
        }
        .ecs-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid transparent;
          user-select: none;
          outline: none;
        }
        .ecs-btn-primary {
          background: #eab308;
          color: #ffffff;
        }
        .ecs-btn-primary:hover {
          background: #ca8a04;
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
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .anl-btn:hover {
          background: #f1f5f9;
        }
        .anl-btn.anl-on-nlb {
          background: #fef9c3;
          color: #a16207;
          border-color: #fef08a;
          box-shadow: 0 4px 6px -1px rgba(234, 179, 8, 0.08);
        }
        .anl-btn.anl-on {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .pulsing-border {
          animation: pulseGlow 2s infinite alternate;
        }
        @keyframes pulseGlow {
          0% { border-color: #cbd5e1; box-shadow: 0 0 2px rgba(0,0,0,0.05); }
          100% { border-color: #eab308; box-shadow: 0 0 12px rgba(234, 179, 8, 0.25); }
        }
        .flow-line-active {
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }
        .grid-layers {
          display: grid;
          grid-template-rows: repeat(5, minmax(0, 1fr));
          gap: 6px;
        }
        .layer-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #ffffff;
        }
        .layer-box.active {
          background: #fef9c3;
          border-color: #eab308;
          font-weight: 600;
        }
        .console-line {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          line-height: 1.4;
          padding: 2px 0;
          color: #cbd5e1;
        }
        .console-log-highlight {
          color: #38bdf8;
        }
        .console-log-warn {
          color: #fbbf24;
        }
        .console-log-error {
          color: #f87171;
        }
        .console-log-success {
          color: #4ade80;
        }
        @keyframes activeSvgGlow {
          0% { filter: drop-shadow(0 0 1px rgba(234, 179, 8, 0.2)); }
          50% { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.5)); }
          100% { filter: drop-shadow(0 0 1px rgba(234, 179, 8, 0.2)); }
        }
        .active-svg-glow {
          animation: activeSvgGlow 2s infinite ease-in-out;
        }
        /* Dockerfile code editor terminal block */
        .ecs-code-terminal {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 16px;
          color: #94a3b8;
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          line-height: 1.6;
          box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.1);
        }
        .ecs-code-line {
          display: block;
          padding: 2px 8px;
          border-radius: 4px;
          border-left: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .ecs-code-line-highlight {
          background: rgba(234, 179, 8, 0.1);
          border-left-color: #eab308;
          color: #fef08a;
        }
        .ecs-code-comment {
          color: #64748b;
          font-style: italic;
        }
        .ecs-code-keyword {
          color: #f43f5e;
          font-weight: bold;
        }
        .ecs-code-value {
          color: #38bdf8;
        }
        /* Heartbeats */
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        .cyber-heartbeat {
          animation: heartbeat 1.5s infinite ease-in-out;
        }
        /* Premium Table Design */
        .ecs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 12px;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .ecs-table th {
          background: #f8fafc;
          padding: 10px 12px;
          font-weight: 700;
          color: #334155;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .ecs-table td {
          padding: 10px 12px;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
        }
        .ecs-table tr:last-child td {
          border-bottom: none;
        }
        .ecs-table tr:hover td {
          background: #f8fafc;
        }
        /* Circular loading indicators for SVG */
        @keyframes rotateRadial {
          to { stroke-dashoffset: 0; }
        }
        .radial-progress-ring {
          stroke-dasharray: 251.2;
          stroke-dashoffset: 251.2;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          animation: rotateRadial 8s linear infinite;
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
                <div className="border border-gray-200 rounded-xl p-4 bg-slate-50 shadow-inner flex flex-col items-center">
                  <div className="w-full max-w-[280px] flex flex-col gap-2">
                    {/* App layer */}
                    <div className="flex gap-1.5">
                      <div className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-center py-2.5 rounded-lg text-[10px] font-bold shadow-sm hover:scale-105 transition-transform animate-pulse">App A</div>
                      <div className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-center py-2.5 rounded-lg text-[10px] font-bold shadow-sm hover:scale-105 transition-transform animate-pulse">App B</div>
                      <div className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center py-2.5 rounded-lg text-[10px] font-bold shadow-sm hover:scale-105 transition-transform animate-pulse">App C</div>
                    </div>

                    {/* Bins / Libs layer */}
                    <div className="flex gap-1.5">
                      <div className="flex-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-center py-1.5 rounded-md text-[9px] font-medium font-mono">libs / bins</div>
                      <div className="flex-1 bg-sky-50 border border-sky-200 text-sky-800 text-center py-1.5 rounded-md text-[9px] font-medium font-mono">libs / bins</div>
                      <div className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-center py-1.5 rounded-md text-[9px] font-medium font-mono">libs / bins</div>
                    </div>

                    {/* Virtualization layer */}
                    {dockerVmView === 'container' ? (
                      <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white text-center py-3 rounded-lg text-xs font-bold pulsing-border border border-sky-400">
                        🐳 Container Engine (Docker / containerd)
                        <div className="text-[8px] font-normal text-sky-200 mt-0.5">Shares Kernel · Manages Isolated Namespace Bounds</div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <div className="flex-1 bg-amber-100 border border-amber-300 text-amber-900 text-center py-2 rounded-md text-[9px] font-semibold leading-tight shadow-sm animate-pulse">Guest OS<br />(Kernel+Bins)</div>
                        <div className="flex-1 bg-amber-100 border border-amber-300 text-amber-900 text-center py-2 rounded-md text-[9px] font-semibold leading-tight shadow-sm animate-pulse">Guest OS<br />(Kernel+Bins)</div>
                        <div className="flex-1 bg-amber-100 border border-amber-300 text-amber-900 text-center py-2 rounded-md text-[9px] font-semibold leading-tight shadow-sm animate-pulse">Guest OS<br />(Kernel+Bins)</div>
                      </div>
                    )}

                    {dockerVmView === 'vm' && (
                      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-center py-3 rounded-lg text-xs font-bold border border-orange-400">
                        ⚙️ Hypervisor (Nitro, ESXi, KVM)
                        <div className="text-[8px] font-normal text-orange-200 mt-0.5">Full Hardware Emulation &amp; CPU/RAM Multiplexing</div>
                      </div>
                    )}

                    {/* Host OS kernel */}
                    <div className="bg-slate-800 text-slate-200 text-center py-2.5 rounded-lg text-xs font-medium border border-slate-700">
                      🐧 Host OS kernel {dockerVmView === 'container' && <span className="text-emerald-400 font-bold font-mono text-[10px] ml-1">(Shared directly!)</span>}
                    </div>

                    {/* Physical Hardware */}
                    <div className="bg-slate-900 text-slate-400 text-center py-2 rounded-lg text-[10px] font-mono border border-slate-950 uppercase tracking-wider">
                      💻 Physical Infrastructure (Bare Metal / AWS EC2)
                    </div>
                  </div>
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
                  <svg width="100%" height="240" viewBox="0 0 400 240" className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Common ECS Control Plane */}
                    <rect x="100" y="10" width="200" height="36" rx="6" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1" className="active-svg-glow" />
                    <text x="200" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">🧠 ECS Control Plane (Scheduler)</text>

                    {ecsLaunchType === 'fargate' ? (
                      // Fargate Model
                      <g>
                        {/* Subnet Boundaries */}
                        <rect x="20" y="80" width="360" height="135" rx="8" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="30" y="96" fontSize="8" fontWeight="bold" fill="#166534">VPC subnet-1a (10.0.1.0/24)</text>

                        {/* Task Fargate 1 */}
                        <rect x="50" y="115" width="130" height="85" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" className="active-svg-glow" />
                        <text x="115" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#065f46">ECS Task (Fargate)</text>
                        <rect x="60" y="140" width="110" height="20" rx="3" fill="#10b981" stroke="#047857" />
                        <text x="115" y="152" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">App Container</text>
                        <rect x="60" y="166" width="110" height="15" rx="2" fill="#eff6ff" stroke="#3b82f6" />
                        <text x="115" y="176" textAnchor="middle" fontSize="8" fill="#1d4ed8">AWS ENI (10.0.1.43)</text>

                        {/* Task Fargate 2 */}
                        <rect x="220" y="115" width="130" height="85" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" className="active-svg-glow" />
                        <text x="285" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#065f46">ECS Task (Fargate)</text>
                        <rect x="230" y="140" width="110" height="20" rx="3" fill="#10b981" stroke="#047857" />
                        <text x="285" y="152" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">App Container</text>
                        <rect x="230" y="166" width="110" height="15" rx="2" fill="#eff6ff" stroke="#3b82f6" />
                        <text x="285" y="176" textAnchor="middle" fontSize="8" fill="#1d4ed8">AWS ENI (10.0.1.92)</text>

                        {/* Connector scheduler lines */}
                        <path d="M150 46 L115 115" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                        <path d="M250 46 L285 115" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" className="flow-line-active" fill="none" />
                      </g>
                    ) : (
                      // EC2 Model
                      <g>
                        {/* Subnet Boundaries */}
                        <rect x="15" y="65" width="370" height="160" rx="8" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="25" y="78" fontSize="8" fontWeight="bold" fill="#92400e">VPC Subnet (10.0.1.0/24) | Auto Scaling Group (ASG)</text>

                        {/* EC2 Instance 1 */}
                        <rect x="30" y="90" width="160" height="120" rx="6" fill="#fff" stroke="#d97706" strokeWidth="1.5" className="active-svg-glow" />
                        <text x="110" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309">EC2 Instance (t3.medium)</text>
                        <rect x="40" y="112" width="140" height="24" rx="3" fill="#78716c" stroke="#44403c" />
                        <text x="110" y="125" textAnchor="middle" fontSize="8" fill="#fff">ECS Agent daemon</text>

                        {/* Container Task 1 */}
                        <rect x="40" y="142" width="65" height="42" rx="3" fill="#ecfdf5" stroke="#10b981" />
                        <text x="72" y="152" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="bold">Task A</text>
                        <text x="72" y="164" textAnchor="middle" fontSize="7" fill="#065f46">Port 80</text>
                        <text x="72" y="176" textAnchor="middle" fontSize="7" fill="#b45309" fontWeight="bold">Host: 32768</text>

                        {/* Container Task 2 */}
                        <rect x="115" y="142" width="65" height="42" rx="3" fill="#ecfdf5" stroke="#10b981" />
                        <text x="147" y="152" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="bold">Task B</text>
                        <text x="147" y="164" textAnchor="middle" fontSize="7" fill="#065f46">Port 80</text>
                        <text x="147" y="176" textAnchor="middle" fontSize="7" fill="#b45309" fontWeight="bold">Host: 32769</text>

                        {/* EC2 Instance 2 */}
                        <rect x="210" y="90" width="160" height="120" rx="6" fill="#fff" stroke="#d97706" strokeWidth="1.5" className="active-svg-glow" />
                        <text x="290" y="103" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309">EC2 Instance (t3.medium)</text>
                        <rect x="220" y="112" width="140" height="24" rx="3" fill="#78716c" stroke="#44403c" />
                        <text x="290" y="125" textAnchor="middle" fontSize="8" fill="#fff">ECS Agent daemon</text>

                        {/* Container Task 3 */}
                        <rect x="220" y="142" width="140" height="42" rx="3" fill="#ecfdf5" stroke="#10b981" />
                        <text x="290" y="152" textAnchor="middle" fontSize="8" fill="#065f46" fontWeight="bold">Task C</text>
                        <text x="290" y="164" textAnchor="middle" fontSize="7" fill="#065f46">Port 80</text>
                        <text x="290" y="176" textAnchor="middle" fontSize="7" fill="#b45309" fontWeight="bold">Host: 32770</text>

                        {/* Connector scheduler lines */}
                        <path d="M150 46 L110 90" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
                        <path d="M250 46 L290 90" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,3" fill="none" />
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
                        <svg width="100%" height="160" viewBox="0 0 360 160">
                          {/* ALB */}
                          <rect x="10" y="55" width="60" height="50" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" className="active-svg-glow" />
                          <text x="40" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1d4ed8">⚖️ ALB</text>
                          <text x="40" y="92" textAnchor="middle" fontSize="8" fill="#1d4ed8">Port 443</text>

                          {/* Dynamic target mappings */}
                          <line x1="70" y1="80" x2="160" y2="40" stroke="#93c5fd" strokeWidth="1.5" className="flow-line-active" />
                          <line x1="70" y1="80" x2="160" y2="120" stroke="#93c5fd" strokeWidth="1.5" className="flow-line-active" />

                          <text x="115" y="50" fontSize="7" fill="#b45309" fontWeight="bold">Forward &rarr; 32768</text>
                          <text x="115" y="110" fontSize="7" fill="#b45309" fontWeight="bold">Forward &rarr; 32769</text>

                          {/* EC2 Instance */}
                          <rect x="160" y="10" width="180" height="140" rx="8" fill="#fff" stroke="#d97706" strokeWidth="1.5" />
                          <text x="250" y="24" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#b45309">Single EC2 Host (10.0.1.20)</text>

                          {/* Task 1 */}
                          <rect x="175" y="35" width="150" height="40" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" className="active-svg-glow" />
                          <text x="250" y="48" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#065f46">Container Task 1</text>
                          <text x="250" y="60" textAnchor="middle" fontSize="7" fill="#065f46">Host Port 32768 &rarr; Container 80</text>

                          {/* Task 2 */}
                          <rect x="175" y="95" width="150" height="40" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" className="active-svg-glow" />
                          <text x="250" y="108" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#065f46">Container Task 2</text>
                          <text x="250" y="120" textAnchor="middle" fontSize="7" fill="#065f46">Host Port 32769 &rarr; Container 80</text>
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
                        <ol className="list-decimal pl-4 text-[11px] text-slate-600 flex flex-col gap-2">
                          <li>Service Auto-Scaler triggers scaling action: task counts scale from <b>5 to 10</b>.</li>
                          <li>Physical EC2 host resources are completely full. ECS schedules the 5 new tasks as <b>⏳ PENDING</b>.</li>
                          <li>ECS <b>Capacity Provider</b> intercepts the pending state and coordinates with the Auto Scaling Group target tracking metric.</li>
                          <li>ASG provisions a new EC2 Instance, hooks it to the cluster, and pending tasks boot instantly.</li>
                        </ol>
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

                      <div className="bg-white p-4 border border-gray-200 rounded-xl flex items-center justify-between text-xs text-gray-700 gap-4 shadow-sm">
                        <div className="flex-1 bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 text-center">
                          <span className="font-bold block text-yellow-800">📥 Web APIs</span>
                          <span className="text-[9px] text-yellow-600">Pushes jobs to SQS</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 animate-pulse" />
                        <div className="flex-1 bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 text-center active-svg-glow">
                          <span className="font-bold block text-yellow-800">✉️ SQS Queue</span>
                          <span className="text-[9px] text-yellow-600">Metric: QueueDepth</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 animate-pulse" />
                        <div className="flex-1 bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 text-center">
                          <span className="font-bold block text-yellow-800">🐳 ECS Workers</span>
                          <span className="text-[9px] text-yellow-600">Scales on backlog</span>
                        </div>
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

              {/* Right Column: EKS SVGs Diagram with dynamic highlights */}
              <div className="ecs-card flex flex-col justify-between">
                <div>
                  <span className="badge badge-blue mb-2">EKS Blueprint Architecture</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800 mb-3">Authoritative Cluster Diagram</h4>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-slate-50 shadow-inner flex flex-col items-center">
                  <svg width="100%" height="280" viewBox="0 0 380 280" className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* EKS Control plane (AWS Managed, Multi-AZ) */}
                    <rect x="15" y="10" width="350" height="85" rx="8" fill="#ede9fe" stroke="#a855f7" strokeWidth="1.5" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                    <text x="190" y="24" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#6b21a8">☸️ AWS Managed EKS Control Plane (Multi-AZ)</text>

                    {/* Control Plane internals */}
                    <rect x="25" y="34" width="70" height="20" rx="3" fill="#fff" stroke="#c084fc" />
                    <text x="60" y="46" textAnchor="middle" fontSize="7.5" fill="#581c87">kube-api</text>

                    <rect x="105" y="34" width="70" height="20" rx="3" fill="#fff" stroke="#c084fc" />
                    <text x="140" y="46" textAnchor="middle" fontSize="7.5" fill="#581c87">scheduler</text>

                    <rect x="185" y="34" width="80" height="20" rx="3" fill="#fff" stroke="#c084fc" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                    <text x="225" y="46" textAnchor="middle" fontSize="7.5" fill="#581c87">ebs-csi-controller</text>

                    <rect x="275" y="34" width="80" height="20" rx="3" fill="#fff" stroke="#c084fc" />
                    <text x="315" y="46" textAnchor="middle" fontSize="7.5" fill="#581c87">etcd state store</text>

                    <text x="190" y="72" textAnchor="middle" fontSize="7.5" fill="#701a75" fontStyle="italic">AWS manages Control Plane replication and scaling automatically</text>

                    {/* Nodes (Customer Managed) */}
                    <rect x="15" y="110" width="350" height="160" rx="8" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
                    <text x="190" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#374151">🔧 Worker Node Groups (Customer Managed VPC Subnets)</text>

                    {/* Managed Node Group (EC2) */}
                    <rect x="25" y="132" width="160" height="128" rx="6" fill="#fff" stroke="#6b7280" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                    <text x="105" y="143" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1f2937">Managed Node Group (EC2)</text>

                    {/* CSI Driver DaemonSet */}
                    <rect x="35" y="152" width="140" height="16" rx="2" fill="#faf5ff" stroke="#a855f7" className={eksStorageHover === 'csi' ? 'active-svg-glow' : ''} />
                    <text x="105" y="163" textAnchor="middle" fontSize="7" fill="#6b21a8" fontWeight="bold">ebs-csi-node DaemonSet</text>

                    {/* Pods */}
                    <rect x="35" y="174" width="65" height="35" rx="4" fill="#ecfdf5" stroke="#10b981" className={(eksStorageHover === 'mount' || eksStorageHover === 'pvc') ? 'active-svg-glow' : ''} />
                    <text x="67" y="185" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="bold">Pod A (App)</text>
                    <text x="67" y="195" textAnchor="middle" fontSize="6.5" fill="#047857" fontStyle="italic">Mount: /data</text>

                    <rect x="110" y="174" width="65" height="35" rx="4" fill="#ecfdf5" stroke="#10b981" className={eksStorageHover === 'mount' ? 'active-svg-glow' : ''} />
                    <text x="142" y="185" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="bold">Pod B (App)</text>
                    <text x="142" y="195" textAnchor="middle" fontSize="6.5" fill="#047857" fontStyle="italic">Mount: /data</text>

                    <rect x="35" y="214" width="140" height="18" rx="2" fill="#e0f2fe" stroke="#0ea5e9" />
                    <text x="105" y="226" textAnchor="middle" fontSize="7.5" fill="#0369a1" fontWeight="bold">AWS VPC CNI (Direct IP per Pod)</text>

                    {/* Fargate Profile */}
                    <rect x="195" y="132" width="160" height="128" rx="6" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3,2" />
                    <text x="275" y="143" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0369a1">AWS Fargate Profiles</text>

                    <rect x="205" y="160" width="140" height="42" rx="4" fill="#eff6ff" stroke="#3b82f6" className={eksStorageHover === 'mount' ? 'active-svg-glow' : ''} />
                    <text x="275" y="176" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="bold">Pod C (Isolated micro-VM)</text>
                    <text x="275" y="190" textAnchor="middle" fontSize="7.5" fill="#0369a1" fontStyle="italic">Serverless Pod compute</text>

                    <text x="275" y="235" textAnchor="middle" fontSize="7.5" fill="#0369a1" fontStyle="italic">No Host node to manage</text>

                    {/* Floating Storage Classes active nodes */}
                    {eksStorageHover && (
                      <g>
                        <rect x="120" y="218" width="140" height="34" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" className="active-svg-glow" />
                        <text x="190" y="230" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#6b21a8">Inspected Volume Resource State:</text>
                        <text x="190" y="242" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#701a75">
                          {eksStorageHover === 'pvc' && 'PVC: [AppClaim] &rarr; size: 20Gi (gp3)'}
                          {eksStorageHover === 'sc' && 'SC: [gp3] &rarr; ebs.csi.aws.com'}
                          {eksStorageHover === 'pv' && 'PV: [vol-09aa] &rarr; Bound (20Gi)'}
                          {eksStorageHover === 'csi' && 'CSI: Attach EBS vol-09aa to EC2'}
                          {eksStorageHover === 'mount' && 'Mount: volume mapped inside /data'}
                        </text>
                      </g>
                    )}
                  </svg>
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
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b11_1px,transparent_1px),linear-gradient(to_bottom,#1e293b11_1px,transparent_1px)] bg-[size:14px_14px]"></div>

                  {/* App Runner domain tag */}
                  <div className="absolute top-2.5 left-2.5 font-mono text-[9px] text-sky-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    HTTPS://{appRunnerTrigger === 'git' ? 'app-tomcat-git' : 'app-tomcat-ecr'}.awsapprunner.com
                  </div>

                  <svg width="100%" height="180" viewBox="0 0 400 180" className="z-10">
                    {/* Source Node */}
                    <g transform="translate(40, 90)">
                      <circle r="22" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      {appRunnerTrigger === 'git' ? (
                        <text y="5" fontFamily="sans-serif" fontSize="14" textAnchor="middle" fill="#fff">🐈</text>
                      ) : (
                        <text y="5" fontFamily="sans-serif" fontSize="14" textAnchor="middle" fill="#fff">🐳</text>
                      )}
                      <text y="36" fontFamily="var(--font-sans)" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#94a3b8">
                        {appRunnerTrigger === 'git' ? 'GitHub Sync' : 'ECR Repo'}
                      </text>
                    </g>

                    {/* App Runner Controller Node */}
                    <g transform="translate(200, 90)">
                      {appRunnerDeployState !== 'idle' && appRunnerDeployState !== 'completed' && (
                        <circle r="34" fill="none" stroke="#eab308" strokeWidth="1.5" className="cyber-heartbeat" />
                      )}
                      <rect x="-30" y="-30" width="60" height="60" rx="10" fill="#fef9c3" stroke="#eab308" strokeWidth="2"
                        className={appRunnerDeployState !== 'idle' && appRunnerDeployState !== 'completed' ? 'active-svg-glow' : ''}
                      />
                      <text y="4" fontFamily="sans-serif" fontSize="18" textAnchor="middle">🚀</text>
                      <text y="42" fontFamily="var(--font-sans)" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#eab308">
                        App Runner Service
                      </text>
                    </g>

                    {/* Private RDS DB Node */}
                    <g transform="translate(340, 90)">
                      <rect x="-26" y="-26" width="52" height="52" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5"
                        className={appRunnerVpcDbLinked ? 'active-svg-glow' : ''}
                      />
                      <text y="5" fontFamily="sans-serif" fontSize="16" textAnchor="middle">💾</text>
                      <text y="38" fontFamily="var(--font-sans)" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#3b82f6">
                        RDS DB Subnet
                      </text>
                    </g>

                    {/* Paths */}
                    <path d="M62,90 L170,90" fill="none" stroke={appRunnerDeployState !== 'idle' ? '#eab308' : '#334155'} strokeWidth="2"
                      className={appRunnerDeployState === 'fetching' || appRunnerDeployState === 'building' ? 'flow-line-active' : ''}
                    />

                    {appRunnerVpcDbLinked && (
                      <path d="M230,90 L314,90" fill="none" stroke="#3b82f6" strokeWidth="2"
                        className={appRunnerDeployState === 'deploying' || appRunnerDeployState === 'completed' ? 'flow-line-active' : ''}
                      />
                    )}

                    {appRunnerDeployState !== 'idle' && (
                      <g transform="translate(200, 160)">
                        <rect x="-100" y="-12" width="200" height="24" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                        <text y="4" fontFamily="var(--font-mono)" fontSize="8.5" textAnchor="middle" fill="#fef08a">
                          {appRunnerDeployState === 'fetching' && 'Step 1: Pulling Git commit...'}
                          {appRunnerDeployState === 'building' && 'Step 2: Compiling Dockerfile...'}
                          {appRunnerDeployState === 'deploying' && 'Step 3: Direct VPC Connector routing...'}
                          {appRunnerDeployState === 'completed' && 'Step 4: Microservice Deployment LIVE'}
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
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Cluster Network Pipeline Canvas</span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">880x400 Majestic Telemetry</span>
                  </div>
                  <div className="flex justify-center items-center bg-[#0a0f1d] rounded-xl p-3 border border-slate-800 shadow-inner overflow-x-auto w-full">
                    <canvas
                      ref={canvasRef}
                      width={860}
                      height={400}
                      className="rounded-lg shadow-2xl border border-slate-900"
                      style={{ minWidth: '800px', width: '900px', height: '400px' }}
                    />
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
