import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  Copy,
  Cpu,
  Network
} from 'lucide-react';

type TabType = 'concept' | 'arch' | 'policies' | 'health' | 'sim' | 'notebook';

interface Inst {
  id: number;
  status: 'warm' | 'ok' | 'drain' | 'terminated';
  warmTicks: number;
  healthy: boolean;
  draining: boolean;
  drainTicks: number;
  failed: boolean;
}

interface SimState {
  instances: Inst[];
  drainingEnabled: boolean;
  cooldown: number;
}

interface Config {
  rps: number;
  targetCpu: number;
  minCap: number;
  desCap: number;
  maxCap: number;
  capPer: number;
}

const makeInstance = (id: number): Inst => ({
  id,
  status: 'warm',
  warmTicks: 2,
  healthy: false,
  draining: false,
  drainTicks: 0,
  failed: false,
});

// Production Terraform Launch Template Snippet
const terraformLaunchTemplateCode = `resource "aws_launch_template" "asg_template" {
  name_prefix   = "asg-premium-template-"
  image_id      = "ami-0c7217cdde317cfec" # Amazon Linux 2023
  instance_type = "t3.medium"

  monitoring {
    enabled = true # Detailed 1-minute CloudWatch metrics
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [\${aws_security_group.app_sg.id}]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo "Initializing node database cache connection..."
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Welcome to EC2 instance \\$(hostname -f)</h1>" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "asg-academy-node"
      Environment = "production"
    }
  }
}`;

// Python Lambda Lifecycle Hook Handler
const lifecycleHookLambdaCode = `import json
import boto3

autoscaling = boto3.client('autoscaling')

def lambda_handler(event, context):
    # Retrieve details from EventBridge ASG event payload
    detail = event['detail']
    lifecycle_hook_name = detail['LifecycleHookName']
    autoscaling_group_name = detail['AutoScalingGroupName']
    lifecycle_action_token = detail['LifecycleActionToken']
    instance_id = detail['EC2InstanceId']
    
    print(f"ASG Lifecycle Event: Booting config for {instance_id}")
    
    # Perform operational boot tasks: precache, register endpoints, run tests
    boot_success = run_boot_orchestration(instance_id)
    
    # Send signal to either CONTINUE or ABANDON
    action_result = 'CONTINUE' if boot_success else 'ABANDON'
    
    autoscaling.complete_lifecycle_action(
        LifecycleHookName=lifecycle_hook_name,
        AutoScalingGroupName=autoscaling_group_name,
        LifecycleActionToken=lifecycle_action_token,
        LifecycleActionResult=action_result,
        InstanceId=instance_id
    )
    return {
        'statusCode': 200,
        'body': json.dumps(f"Lifecycle hook completed with action: {action_result}")
    }

def run_boot_orchestration(instance_id):
    # Put custom warmup / verification scripts here
    return True`;

export default function ASGVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('notebook');

  // Simulation parameters
  const [rps, setRps] = useState(300);
  const [targetCpu, setTargetCpu] = useState(50);
  const [minCap, setMinCap] = useState(2);
  const [desCap, setDesCap] = useState(3);
  const [maxCap, setMaxCap] = useState(12);
  const [capPer, setCapPer] = useState(200);

  const [instances, setInstances] = useState<Inst[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [drainingEnabled, setDrainingEnabled] = useState(true);

  // Premium Interactive ASG VPC Architecture states
  const [archScenario, setArchScenario] = useState<'normal' | 'outage' | 'surge'>('normal');

  // Premium Interactive ASG Health & Lifecycles states
  const [lifecycleStage, setLifecycleStage] = useState<'pending_launch' | 'pending_wait' | 'inservice' | 'terminating_wait' | 'terminated'>('pending_launch');
  const [lifecycleLogs, setLifecycleLogs] = useState<string[]>([
    '💡 Sandbox initialized. Click "Trigger Next Transition ⏭" to provision a new EC2 instance.'
  ]);
  const [sandboxFailed, setSandboxFailed] = useState<boolean>(false);
  const [launchHookApproved, setLaunchHookApproved] = useState<boolean>(false);
  const [terminateHookApproved, setTerminateHookApproved] = useState<boolean>(false);

  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('launch_templates');
  const [expandedCategory, setExpandedCategory] = useState<string>('asg_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive Boundary Clamp Calculator states
  const [nbMinCap, setNbMinCap] = useState<number>(2);
  const [nbMaxCap, setNbMaxCap] = useState<number>(8);
  const [nbTargetScaleRequest, setNbTargetScaleRequest] = useState<number>(5);

  // Interactive Target Tracking Math states
  const [nbCurrentCpu, setNbCurrentCpu] = useState<number>(72);
  const [nbTargetCpu, setNbTargetCpu] = useState<number>(50);

  const logLifecycle = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLifecycleLogs((prev) => [`${time} — ${msg}`, ...prev].slice(0, 50));
  };

  const simStateRef = useRef<SimState>({ instances: [], drainingEnabled: true, cooldown: 0 });
  const configRef = useRef<Config>({ rps, targetCpu, minCap, desCap, maxCap, capPer });
  const timerRef = useRef<number | null>(null);

  // Synchronize config ref
  useEffect(() => {
    configRef.current = { rps, targetCpu, minCap, desCap, maxCap, capPer };
  }, [rps, targetCpu, minCap, desCap, maxCap, capPer]);

  // Synchronize draining ref
  useEffect(() => {
    simStateRef.current.drainingEnabled = drainingEnabled;
  }, [drainingEnabled]);

  // Set initial simulation targets on load
  useEffect(() => {
    resetSim();
    return pause;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync min/max capacity boundaries
  useEffect(() => {
    if (minCap > maxCap) {
      setMaxCap(minCap);
    }
    if (desCap < minCap) {
      setDesCap(minCap);
    } else if (desCap > maxCap) {
      setDesCap(maxCap);
    }
  }, [minCap, maxCap, desCap]);

  const now = () => new Date().toLocaleTimeString();

  const logLine = (html: string) => {
    setLogs((prev) => [`${now()} — ${html}`, ...prev].slice(0, 150));
  };

  const ensureCapacity = (currentInstances: Inst[], desired: number, drainOn: boolean) => {
    const live = currentInstances.filter((x) => x.status !== 'terminated');
    const out = [...currentInstances];

    if (live.length < desired) {
      const add = desired - live.length;
      for (let k = 0; k < add; k++) {
        const id = out.length ? Math.max(...out.map((x) => x.id)) + 1 : 1;
        out.push(makeInstance(id));
        logLine(`<span class="asg-badge asg-binfo">Scale out</span> Launching instance <b>i-${id}</b> (warming up lifecycle).`);
      }
    } else if (live.length > desired) {
      let remove = live.length - desired;
      const sorted = live.slice().sort((a, b) => a.id - b.id);
      for (const inst of sorted) {
        if (remove <= 0) break;
        if (inst.failed || inst.status === 'terminated') continue;
        const idx = out.findIndex((o) => o.id === inst.id);
        if (idx < 0) continue;

        if (drainOn) {
          if (!out[idx].draining) {
            out[idx] = { ...out[idx], draining: true, drainTicks: 2, status: 'drain' };
            logLine(`<span class="asg-badge asg-bwarn">Scale in</span> <b>i-${inst.id}</b> set to <b>draining</b> (LB finishes active requests).`);
            remove -= 1;
          }
        } else {
          out[idx] = { ...out[idx], status: 'terminated', healthy: false };
          logLine(`<span class="asg-badge asg-bbad">Scale in</span> <b>i-${inst.id}</b> terminated immediately (no drain delay).`);
          remove -= 1;
        }
      }
    }
    return out;
  };

  const applyWarmupAndDrain = (currentInstances: Inst[]) => {
    return currentInstances.map((inst) => {
      if (inst.status === 'warm') {
        const warmTicks = inst.warmTicks - 1;
        if (warmTicks <= 0) {
          logLine(`<span class="asg-badge asg-bok">Healthy</span> <b>i-${inst.id}</b> passed target health checks → in-service receiving traffic.`);
          return { ...inst, status: 'ok', warmTicks: 0, healthy: true } as Inst;
        }
        return { ...inst, warmTicks } as Inst;
      }
      if (inst.status === 'drain') {
        const drainTicks = inst.drainTicks - 1;
        if (drainTicks <= 0) {
          logLine(`<span class="asg-badge asg-bwarn">Terminated</span> <b>i-${inst.id}</b> fully drained → removed from target group → terminated.`);
          return { ...inst, status: 'terminated', healthy: false } as Inst;
        }
        return { ...inst, drainTicks } as Inst;
      }
      return inst;
    });
  };

  const distributeTraffic = (currentInstances: Inst[], cfg: { rps: number; capPer: number }) => {
    const healthy = currentInstances.filter((x) => x.status === 'ok' && x.healthy && !x.failed);
    const n = healthy.length;
    const rpt = n ? cfg.rps / n : 0;
    const cpuPer = n ? Math.min(100, (rpt / cfg.capPer) * 100) : cfg.rps > 0 ? 100 : 0;
    return { n, rpt, avgCpu: cpuPer };
  };

  const scalingDecision = (cfg: Config, metrics: { n: number; avgCpu: number }) => {
    const simState = simStateRef.current;
    if (simState.cooldown > 0) {
      simState.cooldown -= 1;
      return cfg.desCap;
    }

    let desired = cfg.desCap;
    if (metrics.n === 0 && cfg.rps > 0) {
      desired = Math.max(cfg.minCap, Math.min(cfg.maxCap, 1));
      logLine(`<span class="asg-badge asg-bbad">No targets</span> 0 healthy servers while traffic active → forcing desired=${desired}.`);
      simState.cooldown = 2;
      return desired;
    }

    if (metrics.avgCpu > cfg.targetCpu + 8 && desired < cfg.maxCap) {
      desired += 1;
      logLine(`<span class="asg-badge asg-binfo">Alarm High</span> Avg CPU ${Math.round(metrics.avgCpu)}% &gt; target ${cfg.targetCpu}% → scaling out desired=${desired}.`);
      simState.cooldown = 2;
    } else if (metrics.avgCpu < cfg.targetCpu - 12 && desired > cfg.minCap) {
      desired -= 1;
      logLine(`<span class="asg-badge asg-bwarn">Alarm Low</span> Avg CPU ${Math.round(metrics.avgCpu)}% &lt; target ${cfg.targetCpu}% → scaling in desired=${desired}.`);
      simState.cooldown = 2;
    }
    return desired;
  };

  const tick = () => {
    const cfg = configRef.current;
    let nextInstances = ensureCapacity(simStateRef.current.instances, cfg.desCap, simStateRef.current.drainingEnabled);
    nextInstances = applyWarmupAndDrain(nextInstances);

    const failed = nextInstances.find((x) => x.failed && x.status !== 'terminated');
    if (failed) {
      nextInstances = nextInstances.map((inst) => (inst.id === failed.id ? { ...inst, status: 'terminated', healthy: false } : inst));
      logLine(`<span class="asg-badge asg-bbad">Replace Node</span> <b>i-${failed.id}</b> failed health check → ASG evicts node &amp; provisions new target.`);
      nextInstances = ensureCapacity(nextInstances, cfg.desCap, simStateRef.current.drainingEnabled);
    }

    const metrics = distributeTraffic(nextInstances, cfg);
    const newDesired = scalingDecision(cfg, metrics);
    if (newDesired !== cfg.desCap) {
      setDesCap(newDesired);
    }
    nextInstances = ensureCapacity(nextInstances, newDesired, simStateRef.current.drainingEnabled);

    simStateRef.current.instances = nextInstances;
    setInstances(nextInstances);
  };

  const start = () => {
    if (timerRef.current) return;
    setIsRunning(true);
    logLine(`<span class="asg-badge asg-binfo">Simulation RUNNING</span> Automatic traffic loop started.`);
    timerRef.current = window.setInterval(tick, 900);
  };

  const pause = () => {
    if (!timerRef.current) return;
    window.clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    logLine(`<span class="asg-badge asg-bwarn">Simulation PAUSED</span> Simulation paused.`);
  };

  const stepOnce = () => {
    tick();
  };

  const resetSim = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    const initialInstances = Array.from({ length: desCap }, (_, index) => makeInstance(index + 1));
    simStateRef.current = { instances: initialInstances, drainingEnabled: drainingEnabled, cooldown: 0 };
    setInstances(initialInstances);
    setLogs(['Tip: Increase Incoming Traffic (RPS) until avg CPU exceeds target to trigger automatic Scale Out!']);
  };

  const injectFailure = () => {
    const existing = simStateRef.current.instances.filter((x) => x.status === 'ok' && !x.failed);
    if (existing.length === 0) {
      logLine(`<span class="asg-badge asg-bbad">Failure</span> No healthy targets available to fail.`);
      return;
    }
    const victim = existing[Math.floor(Math.random() * existing.length)];
    const nextInstances = simStateRef.current.instances.map((inst) =>
      inst.id === victim.id ? { ...inst, failed: true, healthy: false } : inst
    );
    simStateRef.current.instances = nextInstances;
    setInstances(nextInstances);
    logLine(`<span class="asg-badge asg-bbad">Failure Injected</span> <b>i-${victim.id}</b> failed ELB target checks!`);
  };

  const toggleDrain = () => {
    setDrainingEnabled(!drainingEnabled);
    logLine(`<span class="asg-badge asg-binfo">Draining Toggle</span> Scale-in connection draining is now <b>${!drainingEnabled ? 'ON' : 'OFF'}</b>.`);
  };

  const metrics = distributeTraffic(instances, { rps, capPer });

  return (
    <div>
      <style>{`
        .asg-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .asg-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; font-weight: 500; }
        .asg-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .asg-tb.asg-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        .asg-card { border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02); }
        .asg-sec { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 8px; }
        .asg-sec:first-child { margin-top: 0; }
        .asg-kv { display: flex; gap: 8px; font-size: 12px; margin: 6px 0; align-items: baseline; }
        .asg-kk { min-width: 160px; color: #475569; flex-shrink: 0; }
        .asg-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .asg-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .asg-met { background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #cbd5e1; }
        ul.asg-ck li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; color: #334155; }
        ul.asg-ck li::before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
        .asg-log { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background: #f8fafc; font-size: 11px; font-family: var(--font-mono, monospace); white-space: pre-wrap; line-height: 1.5; color: #1e293b; }
        .asg-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .asg-binfo { background: #dbeafe; color: #1d4ed8; }
        .asg-bok { background: #dcfce7; color: #15803d; }
        .asg-bwarn { background: #fef3c7; color: #b45309; }
        .asg-bbad { background: #fee2e2; color: #b91c1c; }
        .asg-btn { font-size: 12px; padding: 5px 12px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff; color: #334155; cursor: pointer; transition: all 0.15s; outline: none; }
        .asg-btn:hover { background: #f8fafc; }
        .asg-btn.asg-on { background: #16a34a; color: #fff; border-color: #16a34a; }
        .asg-instances { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
        .asg-inst { border-radius: 10px; border: 1.5px solid #cbd5e1; padding: 8px 8px; text-align: center; background: #f8fafc; transition: all 0.15s; }
        .asg-inst .name { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .asg-inst .meta { font-size: 10px; color: #64748b; line-height: 1.4; }
        .asg-inst.asg-ok { border-color: #10b981; background: #ecfdf5; color: #047857; }
        .asg-inst.asg-warm { border-color: #d97706; background: #fffbeb; color: #b45309; }
        .asg-inst.asg-drain { border-color: #1d4ed8; background: #eff6ff; color: #1d4ed8; }
        .asg-inst.asg-down { border-color: #dc2626; background: #fff5f5; color: #b91c1c; opacity: 0.85; }
        
        /* Blueprint dot-grid backdrop style */
        .asg-svg-bg {
          background-color: #ffffff;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 14px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          display: block;
        }

        @keyframes activeNodePulse {
          0% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
          50% { filter: drop-shadow(0 0 8px var(--pulse-color)); }
          100% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
        }
        .active-glow-node {
          animation: activeNodePulse 2s infinite;
        }
        @keyframes flowAnim {
          to { stroke-dashoffset: -20; }
        }
        .flow-active-line {
          stroke-dasharray: 6, 4;
          animation: flowAnim 1s linear infinite;
        }
        .arch-scenario-btn {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .arch-scenario-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .arch-scenario-btn.active {
          background: rgba(22, 163, 74, 0.1);
          color: #16a34a;
          border-color: #16a34a;
        }
        .mnemonic-gcard {
          border-radius: 12px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
          border: 1.5px solid #f59e0b;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.05);
          color: #78350f;
        }
        .mnemonic-gcard-title {
          font-weight: bold;
          font-size: 13px;
          color: #b45309;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        @keyframes pulse-led {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        .led-blink {
          animation: pulse-led 1s infinite ease-in-out;
        }

        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-dir-header {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-background-primary);
          border: none;
          border-bottom: 1px solid var(--color-border-tertiary);
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          border: none;
          border-left: 3px solid transparent;
          background: var(--color-background-primary);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-info);
          border-left-color: var(--color-border-tertiary);
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #0284c7;
          border-left-color: #0ea5e9;
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-hero-badge {
          background: #e0f2fe;
          border: 1.5px solid #bae6fd;
          color: #0369a1;
          font-size: 9.5px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3.5px 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .acad-takeaway-box {
          background: linear-gradient(135deg, var(--color-background-primary) 0%, var(--color-background-secondary) 100%);
          border-left: 4px solid #0ea5e9;
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border-tertiary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 18px;
          position: relative;
        }
        .acad-terminal {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 AWS Auto Scaling Groups (ASG) — Zonal Scaling · Launch Templates · Self Healing
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Ensure high availability by maintaining fleet sizes, recovering failed instances, and dynamically adapting to workload changes.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="asg-tabs">
          <button className={`asg-tb ${activeSection === 'notebook' ? 'asg-on' : ''}`} onClick={() => setActiveSection('notebook')}>📓 Visual Architect Notes</button>
          <button className={`asg-tb ${activeSection === 'concept' ? 'asg-on' : ''}`} onClick={() => setActiveSection('concept')}>⚖️ Concept &amp; Capacity</button>
          <button className={`asg-tb ${activeSection === 'arch' ? 'asg-on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ VPC Architecture</button>
          <button className={`asg-tb ${activeSection === 'policies' ? 'asg-on' : ''}`} onClick={() => setActiveSection('policies')}>📈 Scaling Policies</button>
          <button className={`asg-tb ${activeSection === 'health' ? 'asg-on' : ''}`} onClick={() => setActiveSection('health')}>❤️ Health &amp; Lifecycles</button>
          <button className={`asg-tb ${activeSection === 'sim' ? 'asg-on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 Live Scaling Simulator</button>
        </div>
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>

        {/* CONCEPT & CAPACITY PANEL */}
        {activeSection === 'concept' && (
          <div>
            <div className="asg-sec">Auto Scaling Group Fleet Capacities</div>
            <div className="asg-g2" style={{ marginBottom: '12px' }}>
              <div className="asg-card" style={{ borderLeft: '3px solid #16a34a' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#16a34a' }}>📏 Key Capacity Boundaries</div>
                <div className="asg-kv"><span className="asg-kk">Minimum Capacity</span><b>Lowest server count (ASG will never shrink below this)</b></div>
                <div className="asg-kv"><span className="asg-kk">Desired Capacity</span><b>Current target size (ASG scales up/down to match this)</b></div>
                <div className="asg-kv"><span className="asg-kk">Maximum Capacity</span><b>Hard upper limit ceiling (Prevents run-away bill costs)</b></div>
                <div className="asg-kv"><span className="asg-kk">Launch Template</span><b>Fleet blueprints (AMI, Instance type, keys, user data scripts)</b></div>
              </div>

              <div className="asg-card" style={{ borderLeft: '3px solid #0369a1' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#0369a1' }}>Launch Templates vs Launch Configurations</div>
                <div className="asg-kv"><span className="asg-kk">Launch Configuration</span><b>Legacy blueprint system (Immutable; must recreate to change)</b></div>
                <div className="asg-kv"><span className="asg-kk">Launch Template</span><b style={{ color: '#16a34a' }}>Modern standard. Supports versions, parameter inheritance</b></div>
                <div className="asg-kv"><span className="asg-kk">Container Integration</span><b>Templates support dynamic ECS node mappings</b></div>
                <div className="asg-kv"><span className="asg-kk">Spot &amp; On-Demand</span><b>Templates support mixing purchase options in one ASG</b></div>
              </div>
            </div>

            <div className="asg-sec">ASG Auto-Recovery Playbook</div>
            <div className="asg-g2">
              <div>
                <div className="asg-card" style={{ borderLeft: '3px solid #c2410c' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>Self-Healing Detection Loop</div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>1. Diagnostic</span><b>Instance status checks fail or target group health fails</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>2. Eviction</span><b>ASG marks node unhealthy, stopping listener routing flows</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>3. Replacement</span><b>Terminates failed EC2, and launches brand new clone</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>4. Cooldown</span><b>Wait ticks allow the new server to boot and register safely</b></div>
                </div>
              </div>

              <div>
                <div className="asg-card" style={{ borderLeft: '3px solid #7c3aed', minHeight: '130px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#7c3aed', marginBottom: '8px' }}>Key Benefits of ASG Fleet Management</div>
                  <ul className="asg-ck">
                    <li><b>High Availability:</b> Fleet automatically shifts nodes across AZ zones on data-center down.</li>
                    <li><b>Self-Healing Auto Recovery:</b> Unhealthy boxes are automatically replaced without operator work.</li>
                    <li><b>Optimized Costs:</b> Fleet shrinks automatically on weekends, paying only for compute needed.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MULTI-AZ ARCHITECTURE PANEL */}
        {activeSection === 'arch' && (
          <div>
            <div className="asg-sec">Interactive Multi-AZ Zonal Rebalancing & Scaling Simulator</div>
            
            {/* Scenario Navigation bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button 
                className={`arch-scenario-btn ${archScenario === 'normal' ? 'active' : ''}`}
                onClick={() => setArchScenario('normal')}
              >
                🟢 Scenario 1: Normal Balanced Load
              </button>
              <button 
                className={`arch-scenario-btn ${archScenario === 'outage' ? 'active' : ''}`}
                onClick={() => setArchScenario('outage')}
              >
                🔴 Scenario 2: Zonal Outage & Rebalancing
              </button>
              <button 
                className={`arch-scenario-btn ${archScenario === 'surge' ? 'active' : ''}`}
                onClick={() => setArchScenario('surge')}
              >
                ⚡ Scenario 3: Scale-Out Peak Surge
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left: Dynamic Widescreen SVG Map */}
              <div className="asg-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    🔍 {archScenario === 'normal' ? 'Normal Fleet Mode' : archScenario === 'outage' ? 'AZ Disaster Recovery Mode' : 'High Performance Scale-Out Mode'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                    ● LIVE SIMULATOR
                  </span>
                </div>

                <svg width="100%" viewBox="0 0 680 340" className="asg-svg-bg" style={{ display: 'block', margin: '0 auto' }}>
                  <defs>
                    <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill={archScenario === 'surge' ? '#f97316' : '#10b981'}/>
                    </marker>
                    <linearGradient id="g-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="g-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <linearGradient id="g-red" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.6"/>
                    </filter>
                    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f97316" floodOpacity="0.6"/>
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#dc2626" floodOpacity="0.6"/>
                    </filter>
                  </defs>
                  
                  {/* Outer VPC Boundary */}
                  <rect x="5" y="5" width="670" height="330" rx="16" fill="rgba(255, 255, 255, 0.5)" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="25" y="24" fontSize="10" fill="#475569" fontWeight="bold" fontFamily="monospace">VPC (10.0.0.0/16)</text>

                  {/* Users Node */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#3b82f6' } as React.CSSProperties}>
                    <rect x="20" y="110" width="85" height="50" rx="8" fill="#f0f9ff" stroke="#3b82f6" strokeWidth={1.5}/>
                    <text x="62.5" y="132" textAnchor="middle" fontSize="11" fill="#0c4a6e" fontWeight="bold">🌐 Public Users</text>
                    <text x="62.5" y="146" textAnchor="middle" fontSize="8.5" fill="#0284c7" fontFamily="monospace">
                      {archScenario === 'surge' ? '1800 RPS (Peak)' : '400 RPS (Normal)'}
                    </text>
                  </g>

                  {/* ALB Node */}
                  <g opacity={1} className={archScenario !== 'outage' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                    <rect x="145" y="95" width="110" height="70" rx="10" fill="#ecfdf5" stroke="#10b981" strokeWidth={1.5} />
                    <text x="200" y="120" textAnchor="middle" fontSize="12" fill="#047857" fontWeight="bold">ALB Load Balancer</text>
                    <text x="200" y="136" textAnchor="middle" fontSize="8" fill="#475569">L7 Rules Router</text>
                    <text x="200" y="152" textAnchor="middle" fontSize="7.5" fill="#10b981" fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'outage' ? 'Zonal Failover ON' : 'Subnet Load Balanced'}
                    </text>
                  </g>

                  {/* CloudWatch CPU Alarm Node */}
                  <g opacity={1} className={archScenario === 'surge' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ef4444' } as React.CSSProperties}>
                    <rect x="145" y="210" width="110" height="60" rx="10" fill="#fff5f5" stroke={archScenario === 'surge' ? '#ef4444' : '#64748b'} strokeWidth={1.5}/>
                    <text x="200" y="232" textAnchor="middle" fontSize="11" fill={archScenario === 'surge' ? '#991b1b' : '#334155'} fontWeight="bold">CloudWatch Alarm</text>
                    <text x="200" y="247" textAnchor="middle" fontSize="8.5" fill={archScenario === 'surge' ? '#ef4444' : '#475569'} fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'surge' ? '⚠️ CPU ALARM (>75%)' : '🟢 CPU OK (<50%)'}
                    </text>
                  </g>

                  {/* ASG Boundary */}
                  <rect 
                    x="295" y="30" width="365" height="290" rx="12" 
                    fill="rgba(255, 255, 255, 0.4)" stroke="#10b981" strokeWidth="1.5" 
                    strokeDasharray="6,4" 
                    style={archScenario === 'surge' ? { filter: 'url(#glow-green)' } : {}}
                  />
                  <text x="477.5" y="46" textAnchor="middle" fontSize="11" fill="#047857" fontWeight="bold">Auto Scaling Group (ASG Private Subnets)</text>

                  {/* Subnets Racks */}

                  {/* us-east-1a subnet */}
                  <g opacity={1}>
                    <rect x="310" y="55" width="335" height="75" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="320" y="70" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="monospace">Subnet A: us-east-1a</text>
                    
                    {/* Instance i-101 */}
                    <g>
                      <rect x="350" y="76" width="90" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                      <text x="395" y="93" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🖥️ i-101</text>
                      <text x="395" y="107" textAnchor="middle" fontSize="8.5" fill="#137333" fontFamily="monospace">In-Service (OK)</text>
                    </g>
                    
                    {/* Instance i-104 (Outage Replacement) or i-105 (Surge Instance) */}
                    {(archScenario === 'outage' || archScenario === 'surge') && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="76" width="105" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="93" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">
                          {archScenario === 'outage' ? '🖥️ i-104 (New)' : '🖥️ i-105'}
                        </text>
                        <text x="512.5" y="107" textAnchor="middle" fontSize="8.5" fill="#d97706" fontWeight="bold" fontFamily="monospace">
                          {archScenario === 'outage' ? '🛡️ Zonal Rebalance' : '📈 Scale Out'}
                        </text>
                      </g>
                    )}
                  </g>

                  {/* us-east-1b subnet */}
                  <g opacity={1}>
                    <rect x="310" y="135" width="335" height="75" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="320" y="150" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="monospace">Subnet B: us-east-1b</text>
                    
                    {/* Instance i-102 */}
                    <g>
                      <rect x="350" y="156" width="90" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                      <text x="395" y="173" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🖥️ i-102</text>
                      <text x="395" y="187" textAnchor="middle" fontSize="8.5" fill="#137333" fontFamily="monospace">In-Service (OK)</text>
                    </g>

                    {/* Instance i-106 (Surge Only) */}
                    {archScenario === 'surge' && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="156" width="105" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="173" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🖥️ i-106</text>
                        <text x="512.5" y="187" textAnchor="middle" fontSize="8.5" fill="#d97706" fontWeight="bold" fontFamily="monospace">📈 Scale Out</text>
                      </g>
                    )}
                  </g>

                  {/* us-east-1c subnet */}
                  <g opacity={archScenario === 'outage' ? 0.7 : 1}>
                    <rect 
                      x="310" y="215" width="335" height="75" rx="6" 
                      fill={archScenario === 'outage' ? 'rgba(239, 68, 68, 0.03)' : '#f8fafc'} 
                      stroke={archScenario === 'outage' ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth={1} 
                      strokeDasharray={archScenario === 'outage' ? '4,4' : 'none'}
                    />
                    <text x="320" y="230" fontSize="8" fill={archScenario === 'outage' ? '#ef4444' : '#475569'} fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'outage' ? 'Subnet C: us-east-1c [🔥 OUTAGE]' : 'Subnet C: us-east-1c'}
                    </text>
                    
                    {/* Instance i-103 */}
                    {archScenario !== 'outage' ? (
                      <g>
                        <rect x="350" y="236" width="90" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                        <text x="395" y="253" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🖥️ i-103</text>
                        <text x="395" y="267" textAnchor="middle" fontSize="8.5" fill="#137333" fontFamily="monospace">In-Service (OK)</text>
                      </g>
                    ) : (
                      <g>
                        {/* Outage representation */}
                        <rect x="350" y="236" width="90" height="42" rx="4" fill="#fff5f5" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="395" y="253" textAnchor="middle" fontSize="10" fill="#b91c1c" fontWeight="bold" style={{ textDecoration: 'line-through' }}>🖥️ i-103</text>
                        <text x="395" y="267" textAnchor="middle" fontSize="8" fill="#b91c1c" fontWeight="bold" fontFamily="monospace">⚠️ UNREACHABLE</text>
                        <path d="M345 231 L445 283 M445 231 L345 283" stroke="#ef4444" strokeWidth="1.5" opacity="0.4"/>
                      </g>
                    )}

                    {/* Instance i-107 (Surge Only) */}
                    {archScenario === 'surge' && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="236" width="105" height="42" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="253" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🖥️ i-107</text>
                        <text x="512.5" y="282" textAnchor="middle" fontSize="8.5" fill="#d97706" fontWeight="bold" fontFamily="monospace">📈 Scale Out</text>
                      </g>
                    )}
                  </g>

                  {/* Flow Vector Tracer lines */}

                  {/* Users to ALB */}
                  <line 
                    x1="105" y1="135" x2="145" y2="135" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 3.5 : 2} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet A */}
                  <path 
                    d="M 255 130 Q 285 92 310 92" 
                    fill="none" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 2.5 : 1.5} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet B */}
                  <line 
                    x1="255" y1="130" x2="310" y2="172" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 2.5 : 1.5} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet C */}
                  <path 
                    d="M 255 130 Q 285 252 310 252" 
                    fill="none" 
                    stroke={archScenario === 'outage' ? '#ef4444' : archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={1.5} 
                    strokeDasharray={archScenario === 'outage' ? '3,3' : 'none'}
                    className={archScenario !== 'outage' ? 'flow-active-line' : ''} 
                  />

                  {/* CloudWatch telemetry lines (dashed CPU loads) */}
                  
                  {/* From Subnets back to CloudWatch */}
                  <path 
                    d="M 525 120 L 525 310 L 200 310 L 200 270" 
                    fill="none" 
                    stroke="#cbd5e1" 
                    strokeWidth="1" 
                    strokeDasharray="4,3" 
                    markerEnd="url(#arrow)"
                  />
                  <path 
                    d="M 200 210 L 200 165" 
                    fill="none" 
                    stroke={archScenario === 'surge' ? '#ef4444' : '#cbd5e1'} 
                    strokeWidth="1" 
                    strokeDasharray="4,3" 
                    markerEnd="url(#arrow)"
                  />
                </svg>
              </div>

              {/* Right: Dynamic Telemetry Cards & Explanations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Status Telemetry Card */}
                <div className="asg-card" style={{ borderLeft: '3px solid #10b981', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    📊 Simulation Telemetry
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                    {archScenario === 'normal' && '🟢 Balanced Fleet Operation'}
                    {archScenario === 'outage' && '⚠️ Zonal Outage & Self-Healing'}
                    {archScenario === 'surge' && '⚡ High-Load Horizontal Scaling'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Active Subnets:</span>
                      <span style={{ fontWeight: 'bold', color: archScenario === 'outage' ? '#ef4444' : '#16a34a' }}>
                        {archScenario === 'outage' ? '2 / 3 Zones' : '3 / 3 Zones'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Total Instances:</span>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {archScenario === 'surge' ? '6 EC2 instances' : '3 EC2 instances'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Average CPU Load:</span>
                      <span style={{ fontWeight: 'bold', color: archScenario === 'surge' ? '#ef4444' : '#16a34a' }}>
                        {archScenario === 'normal' && '38% (Healthy)'}
                        {archScenario === 'outage' && '57% (Healthy)'}
                        {archScenario === 'surge' && '88% (ALARM TRIGGERS)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>ALB Target Group:</span>
                      <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                        {archScenario === 'outage' ? 'us-east-1c evicted' : 'Active (All zones)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scenario Description Card */}
                <div className="asg-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                    ⚙️ Architectural Explanation
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {archScenario === 'normal' && (
                      <span>
                        Under normal workloads, client traffic hits the **ALB**, which acts as the Layer 7 traffic controller. It delegates HTTP requests evenly across the three subnets. The ASG maintains exactly 1 instance per zone, providing **high availability** and zone independence.
                      </span>
                    )}
                    {archScenario === 'outage' && (
                      <span>
                        **Disaster recovery in action!** Subnet `us-east-1c` suffers an outage. The ALB immediately fails target group health checks for `i-103`, evicting it from the listener paths.
                        <br /><br />
                        Simultaneously, the ASG detects that the fleet size has dropped below the desired capacity of 3. It provisions a replacement instance `i-104` in the healthy zone `us-east-1a`, maintaining high availability despite zone loss!
                      </span>
                    )}
                    {archScenario === 'surge' && (
                      <span>
                        **Horizontal Scale-Out!** Heavy traffic (1800 RPS) causes average CPU to spike to **88%**. The CloudWatch metric exceeds the 75% target threshold, causing the **CloudWatch CPU Alarm** to trigger.
                        <br /><br />
                        The ASG responds to the alarm by increasing the **Desired Capacity** from 3 to 6. It launches 3 new servers (`i-105`, `i-106`, `i-107`) dynamically, spreading them evenly across all zones.
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* SCALING POLICIES PANEL */}
        {activeSection === 'policies' && (
          <div>
            <div className="asg-sec">Fleet Auto-Scaling Policies</div>
            <div className="asg-g2" style={{ marginBottom: '10px' }}>
              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#16a34a' }}>1. Target Tracking (Recommended)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Keep average CPU load or RequestCountPerTarget strictly around a set target value (e.g., "Keep avg CPU at 50%"). ASG automatically scales size.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: standard predictable web traffic.</div>
              </div>

              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#0369a1' }}>2. Step Scaling (Threshold Blocks)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Scale out or in based on explicit threshold steps (e.g., "If CPU &gt; 70% add 2 nodes, if CPU &gt; 85% add 4 nodes").
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: sharp, spiky, sudden traffic surges.</div>
              </div>
            </div>

            <div className="asg-g2" style={{ marginBottom: '12px' }}>
              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#7c3aed' }}>3. Scheduled Scaling</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Add capacity based on known schedules (e.g., "Every weekday morning at 8:30 AM scale out to 10 instances").
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: highly predictable business office hours.</div>
              </div>

              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#c2410c' }}>4. Predictive Scaling</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Uses machine learning algorithms to scan historical traffic patterns and proactively scale out *before* spikes hit.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: applications with regular cyclical usage.</div>
              </div>
            </div>

            <div className="asg-sec">Provisioning Scaling Policies (Terraform HCL)</div>
            <div className="asg-card">
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#16a34a', marginBottom: '6px' }}>Target Tracking Scaling Policy: Target Average CPU = 50%</div>
              <pre className="asg-log" style={{ fontSize: '11px' }}>{`resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                   = "cpu-50-percent-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.production_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0  # Keep average fleet CPU utilization at 50%
  }
}`}</pre>
            </div>
          </div>
        )}

        {/* HEALTH & LIFECYCLE PANEL */}
        {activeSection === 'health' && (
          <div>
            <div className="asg-sec">Interactive EC2 Instance Lifecycle Hook Sandbox</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left Column: Widescreen SVG Diagram & Monospace Event Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Widescreen Interactive Lifecycle SVG */}
                <div className="asg-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      📍 State-Responsive Lifecycle Transitions Map
                    </span>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 'bold' }}>
                      ● ACTIVE NODE
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 680 160" className="asg-svg-bg" style={{ display: 'block', margin: '0 auto' }}>
                    <defs>
                      <marker id="m-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1"/>
                      </marker>
                      <marker id="m-arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#10b981"/>
                      </marker>
                    </defs>

                    {/* Step 1: Pending:Launch */}
                    <g opacity={lifecycleStage === 'pending_launch' ? 1 : 0.65} className={lifecycleStage === 'pending_launch' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#f97316' } as React.CSSProperties}>
                      <rect x="15" y="45" width="105" height="52" rx="8" fill="#fff7ed" stroke={lifecycleStage === 'pending_launch' ? '#f97316' : '#cbd5e1'} strokeWidth={lifecycleStage === 'pending_launch' ? 2 : 1}/>
                      <text x="67.5" y="69" textAnchor="middle" fontSize="10.5" fill="#c2410c" fontWeight="bold">Pending:Launch</text>
                      <text x="67.5" y="83" textAnchor="middle" fontSize="8" fill="#7c2d12">EC2 Provisioning...</text>
                    </g>

                    {/* Connecting 1 -> 2 */}
                    <line 
                      x1="120" y1="71" x2="147" y2="71" 
                      stroke={lifecycleStage === 'pending_wait' ? '#10b981' : '#cbd5e1'} 
                      strokeWidth={lifecycleStage === 'pending_wait' ? 2 : 1} 
                      className={lifecycleStage === 'pending_wait' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'pending_wait' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 2: Pending:Wait (Hook) */}
                    <g opacity={lifecycleStage === 'pending_wait' ? 1 : 0.65} className={lifecycleStage === 'pending_wait' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                      <rect x="150" y="45" width="115" height="52" rx="8" fill="#faf5ff" stroke={lifecycleStage === 'pending_wait' ? '#7c3aed' : '#cbd5e1'} strokeWidth={lifecycleStage === 'pending_wait' ? 2 : 1}/>
                      <text x="207.5" y="69" textAnchor="middle" fontSize="10.5" fill="#581c87" fontWeight="bold">Pending:Wait</text>
                      <text x="207.5" y="83" textAnchor="middle" fontSize="8.5" fill={launchHookApproved ? '#166534' : '#7e22ce'} fontWeight="bold">
                        {launchHookApproved ? '✓ Hook Approved' : '⏳ Launch Hook Active'}
                      </text>
                    </g>

                    {/* Connecting 2 -> 3 */}
                    <line 
                      x1="265" y1="71" x2="292" y2="71" 
                      stroke={lifecycleStage === 'inservice' ? '#10b981' : '#cbd5e1'} 
                      strokeWidth={lifecycleStage === 'inservice' ? 2 : 1} 
                      className={lifecycleStage === 'inservice' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'inservice' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 3: InService */}
                    <g 
                      opacity={lifecycleStage === 'inservice' ? 1 : 0.65} 
                      className={lifecycleStage === 'inservice' ? 'active-glow-node' : ''} 
                      style={{ '--pulse-color': sandboxFailed ? '#ef4444' : '#10b981' } as React.CSSProperties}
                    >
                      <rect 
                        x="295" y="45" width="110" height="52" rx="8" 
                        fill={sandboxFailed ? '#fff5f5' : '#ecfdf5'} 
                        stroke={lifecycleStage === 'inservice' ? (sandboxFailed ? '#ef4444' : '#10b981') : '#cbd5e1'} 
                        strokeWidth={lifecycleStage === 'inservice' ? 2 : 1}
                      />
                      <text x="350" y="69" textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="bold">🖥️ InService</text>
                      <text x="350" y="83" textAnchor="middle" fontSize="8.5" fill={sandboxFailed ? '#c53030' : '#15803d'} fontWeight="bold">
                        {sandboxFailed ? '💥 App Crashed!' : '🟢 Serving Traffic'}
                      </text>
                    </g>

                    {/* Connecting 3 -> 4 */}
                    <line 
                      x1="405" y1="71" x2="432" y2="71" 
                      stroke={lifecycleStage === 'terminating_wait' ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth={lifecycleStage === 'terminating_wait' ? 2 : 1} 
                      className={lifecycleStage === 'terminating_wait' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'terminating_wait' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 4: Terminating:Wait (Hook) */}
                    <g opacity={lifecycleStage === 'terminating_wait' ? 1 : 0.65} className={lifecycleStage === 'terminating_wait' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#0284c7' } as React.CSSProperties}>
                      <rect x="435" y="45" width="125" height="52" rx="8" fill="#f0f9ff" stroke={lifecycleStage === 'terminating_wait' ? '#0284c7' : '#cbd5e1'} strokeWidth={lifecycleStage === 'terminating_wait' ? 2 : 1}/>
                      <text x="497.5" y="69" textAnchor="middle" fontSize="10.5" fill="#0c4a6e" fontWeight="bold">Terminating:Wait</text>
                      <text x="497.5" y="83" textAnchor="middle" fontSize="8.5" fill={terminateHookApproved ? '#166534' : '#0284c7'} fontWeight="bold">
                        {terminateHookApproved ? '✓ Drained (Ready)' : '⏳ Draining active'}
                      </text>
                    </g>

                    {/* Connecting 4 -> 5 */}
                    <line 
                      x1="560" y1="71" x2="587" y2="71" 
                      stroke={lifecycleStage === 'terminated' ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth={lifecycleStage === 'terminated' ? 2 : 1} 
                      className={lifecycleStage === 'terminated' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'terminated' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 5: Terminated */}
                    <g opacity={lifecycleStage === 'terminated' ? 1 : 0.65} className={lifecycleStage === 'terminated' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ef4444' } as React.CSSProperties}>
                      <rect x="590" y="45" width="80" height="52" rx="8" fill="#fff5f5" stroke={lifecycleStage === 'terminated' ? '#ef4444' : '#cbd5e1'} strokeWidth={lifecycleStage === 'terminated' ? 2 : 1}/>
                      <text x="630" y="70" textAnchor="middle" fontSize="11" fill="#991b1b" fontWeight="bold">Terminated</text>
                      <text x="630" y="83" textAnchor="middle" fontSize="8" fill="#ef4444">Offlined</text>
                    </g>

                    {/* Back loop arrow from 3 to 4 */}
                    {sandboxFailed && (
                      <path 
                        d="M 350 97 Q 425 135 497.5 97" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,2" 
                        markerEnd="url(#m-arrow-active)"
                        className="flow-active-line"
                      />
                    )}
                  </svg>
                </div>

                {/* Sandbox terminal log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    📟 Lifecycle Sandbox Event Terminal
                  </div>
                  <div className="asg-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                    {lifecycleLogs.map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: idx === lifecycleLogs.length - 1 ? 0 : 5 }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Actions Control panel & explanations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Actions HUD */}
                <div className="asg-card" style={{ borderLeft: '3px solid #7c3aed', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    ⚡ Sandbox Controller
                  </div>
                  
                  {/* Current State Details Badge */}
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#475569', display: 'block' }}>Current Stage:</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      color: 
                        lifecycleStage === 'pending_launch' ? '#f97316' : 
                        lifecycleStage === 'pending_wait' ? '#7c3aed' : 
                        lifecycleStage === 'inservice' ? (sandboxFailed ? '#ef4444' : '#16a34a') : 
                        lifecycleStage === 'terminating_wait' ? '#0284c7' : '#ef4444'
                    }}>
                      {lifecycleStage === 'pending_launch' && '🟠 Pending:Launch'}
                      {lifecycleStage === 'pending_wait' && '🟣 Pending:Wait (Hook)'}
                      {lifecycleStage === 'inservice' && (sandboxFailed ? '🔴 Unhealthy Service' : '🟢 InService (ALB Routing)')}
                      {lifecycleStage === 'terminating_wait' && '🔵 Terminating:Wait (Hook)'}
                      {lifecycleStage === 'terminated' && '⚫ Terminated'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      className="asg-btn asg-on" 
                      onClick={() => {
                        if (lifecycleStage === 'pending_launch') {
                          setLifecycleStage('pending_wait');
                          setLaunchHookApproved(false);
                          logLifecycle('🚀 Hardware provisioned! i-09941a entered [Pending:Wait] state. Lifecycle Hook triggered.');
                        } else if (lifecycleStage === 'pending_wait') {
                          if (!launchHookApproved) {
                            logLifecycle('❌ TRANSITION BLOCKED: Instance is suspended at launch boundary. Trigger lifecycle approval to proceed.');
                            return;
                          }
                          setLifecycleStage('inservice');
                          setSandboxFailed(false);
                          logLifecycle('🟢 Launch lifecycle hook complete! Target registered with ALB. Instance is now [InService] and receiving production requests.');
                        } else if (lifecycleStage === 'inservice') {
                          setLifecycleStage('terminating_wait');
                          setTerminateHookApproved(false);
                          logLifecycle('⚠️ Connection draining triggered! Instance i-09941a entered scale-in phase [Terminating:Wait].');
                        } else if (lifecycleStage === 'terminating_wait') {
                          if (!terminateHookApproved) {
                            logLifecycle('❌ TRANSITION BLOCKED: Teardown hook active. Trigger connection drain approval to proceed.');
                            return;
                          }
                          setLifecycleStage('terminated');
                          logLifecycle('💀 Terminate hook complete! i-09941a offlined, EBS volumes detached, ENI released. Instance is [Terminated].');
                        } else if (lifecycleStage === 'terminated') {
                          setLifecycleStage('pending_launch');
                          setLaunchHookApproved(false);
                          setTerminateHookApproved(false);
                          setSandboxFailed(false);
                          logLifecycle('🔄 Sandbox reset. Launching new target provision workflow.');
                        }
                      }}
                      style={{ fontSize: '11.5px', padding: '7px' }}
                    >
                      {lifecycleStage === 'terminated' ? '🔄 Reset Sandbox' : '⏭ Trigger Next Transition'}
                    </button>

                    {/* Launch Lifecycle hook Approval */}
                    {lifecycleStage === 'pending_wait' && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setLaunchHookApproved(true);
                          logLifecycle('✅ [Lambda callback] Launch Lifecycle Hook APPROVED! Signal sent: CONTINUE. Fleet manager registering target with ALB.');
                        }}
                        style={{ borderColor: '#16a34a', color: '#16a34a', fontSize: '11.5px', padding: '7px' }}
                        disabled={launchHookApproved}
                      >
                        {launchHookApproved ? '✓ Launch Hook Approved' : '🟢 Approve Launch Hook'}
                      </button>
                    )}

                    {/* Terminate Lifecycle hook Approval */}
                    {lifecycleStage === 'terminating_wait' && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setTerminateHookApproved(true);
                          logLifecycle('✅ [Lambda callback] Connection Draining COMPLETE! Log backups sent. Signal sent: CONTINUE.');
                        }}
                        style={{ borderColor: '#0284c7', color: '#0284c7', fontSize: '11.5px', padding: '7px' }}
                        disabled={terminateHookApproved}
                      >
                        {terminateHookApproved ? '✓ Draining Hook Approved' : '🔵 Complete Connection Drain'}
                      </button>
                    )}

                    {/* Failure Injection */}
                    {lifecycleStage === 'inservice' && !sandboxFailed && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setSandboxFailed(true);
                          logLifecycle('💥 CRITICAL APP CRASH: i-09941a suffered a core process failure. ALB health check returned HTTP 502 Bad Gateway.');
                          setTimeout(() => {
                            setLifecycleStage('terminating_wait');
                            setTerminateHookApproved(false);
                            logLifecycle('🚨 ASG Self-Healing Active: Evicting crashed node. Transitioning state to [Terminating:Wait] for connection draining.');
                          }, 2000);
                        }}
                        style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '11.5px', padding: '7px' }}
                      >
                        💥 Inject App Crash (Self-Heal)
                      </button>
                    )}
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="asg-card" style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4', color: '#334155' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>🛡️ Stage Description</div>
                  {lifecycleStage === 'pending_launch' && 'Instance provisioning starts. AWS reads the Launch Template DNA and starts allocating hardware resources.'}
                  {lifecycleStage === 'pending_wait' && 'The boot process is paused. Custom EventBridge configurations/Lambda functions run heavy boots, caching data before letting client traffic hit the server.'}
                  {lifecycleStage === 'inservice' && 'Target registered and healthy behind the ALB. Production HTTP requests flow happily. Click the app crash button to watch the ASG self-heal!'}
                  {lifecycleStage === 'terminating_wait' && 'Instance scale-in has begun. Connection draining allows existing requests to complete peacefully, while backup scripts upload local logs.'}
                  {lifecycleStage === 'terminated' && 'Instance destroyed. All allocated ENIs and EBS volumes are released and de-allocated, completely stopping billing charges.'}
                </div>

              </div>

            </div>

            {/* Mnemonic Memory Cards */}
            <div className="asg-sec" style={{ marginTop: '16px', marginBottom: '8px' }}>🧠 Premium Systems Mnemonics</div>
            <div className="asg-g3">
              
              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">📝 Launch Template = "The DNA Blueprint"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  An immutable, version-controlled layout containing everything an EC2 instance needs to exist (AMI ID, instance type, security group rules, and userData startup scripts). Just like cell DNA, it cannot be modified post-launch; you must iterate a new template version to evolve!
                </div>
              </div>

              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">🛡️ Lifecycle Hook = "The Border Customs checkpoint"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Suspends the instance at entering (`Pending:Wait`) or leaving (`Terminating:Wait`) state boundaries. Traffic registration is blocked until external integrations complete boot configuration, data prep, or logs backup, then send a `CONTINUE` signal.
                </div>
              </div>

              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">🧯 Connection Draining = "The Last Call at the Table"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  When scaling in, new client reservations are immediately blocked at the door, but currently seated active connections are granted a grace period (drain timeout) to finish chewing and digest their requests safely before the server is shut down!
                </div>
              </div>

            </div>
          </div>
        )}

        {/* LIVE SIMULATION PLAYGROUND */}
        {activeSection === 'sim' && (
          <div>
            <div className="asg-sec">Live Simulation (ASG + Load Balancer Auto Scaling)</div>
            <div className="asg-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                This simulator demonstrates target tracking scaling in real-time. Drag traffic (RPS) up to overload servers and trigger scale-outs, or fail nodes to watch ASG self-heal!
              </div>

              {/* Range inputs */}
              <div className="asg-g2" style={{ marginBottom: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Incoming Traffic: <b>{rps} RPS</b></label>
                  <input
                    type="range"
                    min="0"
                    max="1800"
                    value={rps}
                    onChange={(e) => setRps(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Target CPU Limit: <b>{targetCpu}%</b></label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={targetCpu}
                    onChange={(e) => setTargetCpu(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>
              </div>

              <div className="asg-g2" style={{ marginBottom: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>ASG Boundaries (Min / Desired / Max Capacity):</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>Min:</span>
                    <input
                      type="number"
                      value={minCap}
                      min="0"
                      max="30"
                      onChange={(e) => setMinCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '1.5px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', color: 'var(--color-text-primary)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>Desired:</span>
                    <input
                      type="number"
                      value={desCap}
                      min="0"
                      max="30"
                      onChange={(e) => setDesCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '1.5px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', color: 'var(--color-text-primary)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>Max:</span>
                    <input
                      type="number"
                      value={maxCap}
                      min="0"
                      max="50"
                      onChange={(e) => setMaxCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '1.5px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Instance Max Capacity: <b>{capPer} RPS</b></label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    value={capPer}
                    onChange={(e) => setCapPer(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>
              </div>

              {/* KPIs */}
              <div className="asg-g3" style={{ marginBottom: '14px' }}>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Healthy instances</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#16a34a' }}>{metrics.n}</div>
                </div>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Avg CPU Utilization</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: metrics.avgCpu > targetCpu + 8 ? '#c2410c' : '#15803d' }}>{Math.round(metrics.avgCpu)}%</div>
                </div>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>RPS per target</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#0369a1' }}>{metrics.n ? Math.round(metrics.rpt) : '∞'}</div>
                </div>
              </div>

              {/* Play buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '12px' }}>
                <button className="asg-btn asg-on" onClick={isRunning ? pause : start}>{isRunning ? 'Pause ⏸' : 'Start ▶'}</button>
                <button className="asg-btn" onClick={stepOnce}>Step ⏭</button>
                <button className="asg-btn" onClick={resetSim}>Reset 🔄</button>
                <button className="asg-btn" onClick={injectFailure}>Fail one node 💥</button>
                <button className="asg-btn" onClick={toggleDrain}>Draining: {drainingEnabled ? 'ON 🧯' : 'OFF 🚫'}</button>
              </div>

              {/* Instances display */}
              <div style={{ margin: '12px 0 6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Active Compute Fleet instances behind Load Balancer:</div>
              <div className="asg-instances" style={{ marginBottom: '14px' }}>
                {instances.filter((i) => i.status !== 'terminated').slice(0, 12).map((inst) => {
                  const klass = inst.failed ? 'asg-inst asg-down' : inst.status === 'ok' ? 'asg-inst asg-ok' : inst.status === 'warm' ? 'asg-inst asg-warm' : inst.status === 'drain' ? 'asg-inst asg-drain' : 'asg-inst';
                  const meta = inst.status === 'warm'
                    ? `booting (${inst.warmTicks}t)`
                    : inst.status === 'drain'
                      ? `draining (${inst.drainTicks}t)`
                      : inst.failed
                        ? 'failed'
                        : inst.healthy
                          ? 'healthy'
                          : 'not-ready';
                  return (
                    <div key={inst.id} className={klass}>
                      <div className="name">i-{inst.id}</div>
                      <div className="meta">{inst.status}<br />{meta}</div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 12 - instances.filter((i) => i.status !== 'terminated').length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="asg-inst" style={{ opacity: 0.35 }}>
                    <div className="name">—</div>
                    <div className="meta">empty</div>
                  </div>
                ))}
              </div>

              {/* Logs */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>ASG Activity Event log:</div>
              <div className="asg-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                {logs.map((entry, idx) => (
                  <div key={idx} style={{ marginBottom: idx === logs.length - 1 ? 0 : 5 }} dangerouslySetInnerHTML={{ __html: entry }} />
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: VISUAL ARCHITECT NOTES (DEVELOPER ACADEMY)                         */}
        {/* ========================================================================= */}
        {activeSection === 'notebook' && (
          <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--color-text-primary)' }}>
            
            {/* SaaS Academy Header Banner */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="bg-white/20 border border-white/20 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-mono">
                    ASG Architect Academy
                  </span>
                  <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 stroke-[2] text-white" /> AWS Auto Scaling Group Academy
                  </h2>
                  <p className="text-xs text-white/90 mt-1 max-w-2xl leading-relaxed">
                    A premium, high-fidelity visual workbook covering fleet capacity thresholds, Launch Templates configurations, scaling policy mathematics, lifecycle transition hook stages, and multi-AZ zonal rebalancing mechanics.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-black/10 border border-white/20 px-4 py-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-100 tracking-wider uppercase font-mono">ASG Academy Engine Online</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar Category Explorer */}
              <div className="lg:col-span-3 space-y-4 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 font-mono">ASG Directory Tree:</span>
                
                <div className="acad-dir-container">
                  <div className="acad-dir-header">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Module Explorer</span>
                  </div>

                  {/* CATEGORY 1: ASG FUNDAMENTALS */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'asg_fundamentals' ? '' : 'asg_fundamentals')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                        1. ASG Fundamentals
                      </span>
                      {expandedCategory === 'asg_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'asg_fundamentals' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('launch_templates')}
                          className={`acad-dir-item-btn ${selectedNote === 'launch_templates' ? 'acad-active' : ''}`}
                        >
                          Launch Templates
                        </button>
                        <button 
                          onClick={() => setSelectedNote('capacity_boundaries')}
                          className={`acad-dir-item-btn ${selectedNote === 'capacity_boundaries' ? 'acad-active' : ''}`}
                        >
                          Capacity Boundaries
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 2: SCALING POLICIES */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'scaling_policies' ? '' : 'scaling_policies')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        2. Scaling Policies
                      </span>
                      {expandedCategory === 'scaling_policies' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'scaling_policies' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('target_tracking')}
                          className={`acad-dir-item-btn ${selectedNote === 'target_tracking' ? 'acad-active' : ''}`}
                        >
                          Target Tracking Math
                        </button>
                        <button 
                          onClick={() => setSelectedNote('step_vs_simple')}
                          className={`acad-dir-item-btn ${selectedNote === 'step_vs_simple' ? 'acad-active' : ''}`}
                        >
                          Step vs Simple Scaling
                        </button>
                        <button 
                          onClick={() => setSelectedNote('scheduled_scaling')}
                          className={`acad-dir-item-btn ${selectedNote === 'scheduled_scaling' ? 'acad-active' : ''}`}
                        >
                          Scheduled Chron Scaling
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 3: HEALTH & LIFECYCLE */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'health_lifecycle' ? '' : 'health_lifecycle')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-red-500" />
                        3. Health &amp; Lifecycles
                      </span>
                      {expandedCategory === 'health_lifecycle' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'health_lifecycle' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('ec2_vs_elb_checks')}
                          className={`acad-dir-item-btn ${selectedNote === 'ec2_vs_elb_checks' ? 'acad-active' : ''}`}
                        >
                          EC2 vs ELB Health Checks
                        </button>
                        <button 
                          onClick={() => setSelectedNote('lifecycle_hooks')}
                          className={`acad-dir-item-btn ${selectedNote === 'lifecycle_hooks' ? 'acad-active' : ''}`}
                        >
                          Lifecycle Hook Hooks
                        </button>
                        <button 
                          onClick={() => setSelectedNote('cooldowns_warmups')}
                          className={`acad-dir-item-btn ${selectedNote === 'cooldowns_warmups' ? 'acad-active' : ''}`}
                        >
                          Cooldowns &amp; Warmups
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 4: ZONAL ARCHITECTURE */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'zonal_arch' ? '' : 'zonal_arch')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-teal-500" />
                        4. Zonal Architecture
                      </span>
                      {expandedCategory === 'zonal_arch' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'zonal_arch' && (
                      <div className="bg-slate-50/50 py-1 font-semibold font-semibold">
                        <button 
                          onClick={() => setSelectedNote('zonal_rebalancing')}
                          className={`acad-dir-item-btn ${selectedNote === 'zonal_rebalancing' ? 'acad-active' : ''}`}
                        >
                          Zonal Rebalancing
                        </button>
                        <button 
                          onClick={() => setSelectedNote('lb_colocation')}
                          className={`acad-dir-item-btn ${selectedNote === 'lb_colocation' ? 'acad-active' : ''}`}
                        >
                          ALB/NLB Registration
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-500 font-semibold space-y-1">
                  <span className="text-slate-800 font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]">
                    <Info className="w-3.5 h-3.5 text-emerald-600" /> Academy Advice
                  </span>
                  "Choose any auto scaling topic in the directory tree above to reveal architectural designs, interactive mathematical playbooks, and production configuration codes."
                </div>
              </div>

              {/* Right Active Note Workspace */}
              <div className="lg:col-span-9 space-y-6 text-left">

                {/* NOTE 1: LAUNCH TEMPLATES */}
                {selectedNote === 'launch_templates' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Fleet blueprint</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Launch Templates vs Launch Configurations</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('concept')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      Before an Auto Scaling Group can provision a single EC2 instance, it needs a blueprint that specifies the configuration. Historically, AWS used <strong>Launch Configurations</strong>, but has replaced them with the modern, feature-rich <strong>Launch Templates</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <span className="font-extrabold text-slate-800 block">Why Launch Templates Win:</span>
                        
                        <div className="space-y-2 font-mono text-[11px] text-slate-600">
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>Versioning Support</span>
                            <span className="text-emerald-600 font-semibold font-bold">Yes (Configurations: Immutable)</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>Purchase Options</span>
                            <span className="text-slate-800 font-semibold">Mix Spot &amp; On-Demand in 1 ASG</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>Parameter Inheritance</span>
                            <span className="text-slate-800 font-semibold">Extend baseline template settings</span>
                          </div>
                          <div className="flex justify-between pb-1.5">
                            <span>Dynamic Updates</span>
                            <span className="text-slate-850 font-semibold">Roll updates using template version tags</span>
                          </div>
                        </div>

                        <div className="acad-takeaway-box">
                          <strong>💡 Professional Takeaway:</strong> Never hard-code your launch configurations. Modern CI/CD templates use versions of a launch template (e.g. <code>$Latest</code> or <code>$Default</code>). When updating your application code or patching AMI operating systems, simply deploy a new template version, and trigger an ASG Instance Refresh to roll it out safely!
                        </div>
                      </div>

                      {/* Visual HCL Code block */}
                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Terraform Launch Template Snippet</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(terraformLaunchTemplateCode);
                              setCopiedNoteId('lt-terraform');
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="p-1 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-655"
                          >
                            {copiedNoteId === 'lt-terraform' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-64">
                          {terraformLaunchTemplateCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 2: CAPACITY BOUNDARIES */}
                {selectedNote === 'capacity_boundaries' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Fleet Limits</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">ASG Capacity Boundaries Clamp</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('concept')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      An Auto Scaling Group maintains a target size by scaling to its **Desired Capacity**. However, the ASG engine enforces strict boundary constraints. Desired capacity is mathematically clamped between the **Minimum** and **Maximum** sizes.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive Boundary Clamp Widget */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block mb-3">Boundary Clamping Simulator</span>
                          
                          <div className="grid grid-cols-2 gap-2.5 text-xs mb-3">
                            <div>
                              <label className="block text-slate-500 mb-1">Min Capacity</label>
                              <input 
                                type="number" 
                                value={nbMinCap} 
                                onChange={(e) => setNbMinCap(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">Max Capacity</label>
                              <input 
                                type="number" 
                                value={nbMaxCap} 
                                onChange={(e) => setNbMaxCap(Math.max(nbMinCap, parseInt(e.target.value) || 0))}
                                className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-slate-500 mb-1">Target Scaling Request</label>
                              <input 
                                type="range" 
                                min="0" 
                                max="15" 
                                value={nbTargetScaleRequest} 
                                onChange={(e) => setNbTargetScaleRequest(parseInt(e.target.value))}
                                className="w-full accent-emerald-600 cursor-ew-resize"
                              />
                              <div className="flex justify-between text-[9.5px] text-slate-450 mt-1 font-mono">
                                <span>Requested: {nbTargetScaleRequest} nodes</span>
                              </div>
                            </div>
                          </div>

                          {/* Clamping Mathematics output */}
                          {(() => {
                            const clampResult = Math.max(nbMinCap, Math.min(nbMaxCap, nbTargetScaleRequest));
                            let clampReason = "Allowed (Within bounds)";
                            let clampBadgeStyle = "bg-emerald-50 border-emerald-250 text-emerald-700";
                            if (nbTargetScaleRequest < nbMinCap) {
                              clampReason = "Clamped to Min (Cannot scale lower)";
                              clampBadgeStyle = "bg-amber-50 border-amber-250 text-amber-700";
                            } else if (nbTargetScaleRequest > nbMaxCap) {
                              clampReason = "Clamped to Max (Ceiling budget cap)";
                              clampBadgeStyle = "bg-red-50 border-red-255 text-red-700";
                            }
                            return (
                              <div className={`border p-3 rounded-lg font-mono text-[10.5px] space-y-1.5 ${clampBadgeStyle}`}>
                                <p className="font-bold flex justify-between">
                                  <span>Math: max({nbMinCap}, min({nbMaxCap}, {nbTargetScaleRequest}))</span>
                                  <span>&rarr; Desired: {clampResult}</span>
                                </p>
                                <p className="text-[10px] opacity-90 font-sans italic">Status: {clampReason}</p>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="text-[10px] text-slate-450 italic font-semibold">
                          * Adjust inputs to watch the Desired capacity clamp automatically.
                        </div>
                      </div>

                      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                        <h4 className="font-bold text-slate-800 text-xs">Boundary Mechanics &amp; Playbook:</h4>
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li>
                            <strong className="text-slate-800">Minimum:</strong> Acts as your high-availability base baseline. The ASG will launch replacement nodes if hardware fails, but scaling alarms will never shrink the group below this boundary.
                          </li>
                          <li>
                            <strong className="text-slate-800">Maximum:</strong> Serves as a financial protection budget check. If your site suffers an active DDoS attack or process lock infinite loop, the max limit blocks the fleet from over-billing you.
                          </li>
                          <li>
                            <strong className="text-slate-800">Desired:</strong> The scaling policy engine's output. Any scaling alarm modifies this property directly, which triggers a scaling action to reconcile the differences.
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>
                )}

                {/* NOTE 3: TARGET TRACKING MATH */}
                {selectedNote === 'target_tracking' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Dynamic scaling math</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Target Tracking Scaling Mathematics</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('policies')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Policies
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      Target Tracking is the most common scaling policy type. It acts like a home thermostat: you define a target metric value (e.g. 50% average CPU), and the ASG engine increases or decreases Desired capacity dynamically to keep the metric near that target.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650 animate-fadeIn">
                        <span className="font-extrabold text-slate-800 block">The Scaling Arithmetic:</span>
                        <p className="leading-relaxed">
                          The Auto Scaling engine calculates the target group size using the following ratio formula:
                        </p>
                        <div className="bg-slate-105 border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] text-slate-800 text-center font-bold">
                          New Capacity = Current Capacity &times; (Current Metric / Target Metric)
                        </div>
                        <p className="leading-relaxed">
                          Because the results are rounded up to the nearest whole integer, even a minor deviation above the target metric will trigger a scale-out action.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>⚠️ Warning:</strong> Under Target Tracking, scale-in is more conservative than scale-out. Scale-in actions evaluate longer time periods (typically 15 minutes of cool stable metrics) before removing instances to prevent thrashing.
                        </div>
                      </div>

                      {/* Interactive Calculator */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 font-mono text-xs">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Target Tracking calculator</span>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-slate-650">
                            <span>Current Fleet Capacity</span>
                            <span className="text-slate-850 font-bold font-mono">4 Nodes</span>
                          </div>
                          
                          <div>
                            <label className="block text-slate-550 mb-1">Current average CPU utilization: {nbCurrentCpu}%</label>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              value={nbCurrentCpu} 
                              onChange={(e) => setNbCurrentCpu(parseInt(e.target.value))}
                              className="w-full accent-indigo-600 cursor-ew-resize"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-550 mb-1">Target CPU Threshold: {nbTargetCpu}%</label>
                            <input 
                              type="range" 
                              min="30" 
                              max="80" 
                              value={nbTargetCpu} 
                              onChange={(e) => setNbTargetCpu(parseInt(e.target.value))}
                              className="w-full accent-indigo-600 cursor-ew-resize"
                            />
                          </div>
                        </div>

                        {(() => {
                          const currentFleetSize = 4;
                          const rawResult = currentFleetSize * (nbCurrentCpu / nbTargetCpu);
                          const resultRounded = Math.ceil(rawResult);
                          const delta = resultRounded - currentFleetSize;
                          const actionText = delta > 0 
                            ? `📈 SCALE OUT: Add ${delta} node(s)` 
                            : delta < 0 
                              ? `📉 SCALE IN: Remove ${Math.abs(delta)} node(s)` 
                              : "🟢 NO ACTION: Fleet size stable";
                          const textStyle = delta > 0 
                            ? "text-orange-600 font-bold" 
                            : delta < 0 
                              ? "text-blue-600 font-bold" 
                              : "text-emerald-600 font-semibold";
                          
                          return (
                            <div className="bg-white border border-slate-200 p-3 rounded-lg text-[10.5px] space-y-1.5 text-slate-600">
                              <p>Raw Ratio: 4 &times; ({nbCurrentCpu} / {nbTargetCpu}) = <span className="font-bold text-slate-800">{rawResult.toFixed(2)}</span></p>
                              <p>Rounded Up Fleet Size: <span className="font-bold text-slate-800">{resultRounded} Nodes</span></p>
                              <p className={`mt-1 border-t border-slate-100 pt-1.5 ${textStyle}`}>{actionText}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 4: STEP VS SIMPLE SCALING */}
                {selectedNote === 'step_vs_simple' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Policy Comparison</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Step Scaling vs Simple Scaling</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('policies')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Policies
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 4 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      While Target Tracking handles standard capacity scaling automatically, custom alerting architectures often require **Step Scaling** or **Simple Scaling** policies triggered by CloudWatch alarms.
                    </p>

                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Capability</th>
                          <th>Simple Scaling (Legacy)</th>
                          <th>Step Scaling (Recommended)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-bold text-slate-800">Scaling Adjustment</td>
                          <td>Applies a single fixed node change (e.g. +1 node) when alarm triggers.</td>
                          <td>Applies adjustments based on the **size of the alarm breach** (e.g. +1 node at 60%, +3 nodes at 85%).</td>
                        </tr>
                        <tr>
                          <td className="font-bold text-slate-800">Cooldown Periods</td>
                          <td>Locks the entire ASG during cooldown. Alarms triggered during cooldown are ignored.</td>
                          <td>Allows step scaling evaluations while warm-ups are in progress, dynamically adding more nodes.</td>
                        </tr>
                        <tr>
                          <td className="font-bold text-slate-800">DDoS Response</td>
                          <td>Slow response. Adds nodes one-by-one, lagging behind major traffic surges.</td>
                          <td>Fast response. Instantly jumps to the highest tier adjustment to absorb high surges.</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="acad-takeaway-box">
                      <strong>💡 Recommended Design:</strong> Prefer **Target Tracking** for standard application workloads (CPU, Request count per target). Use **Step Scaling** when scaling based on custom complex metrics, such as Amazon SQS queue backlogs (e.g. scale out by +1 instance for every 10,000 backlog messages).
                    </div>
                  </div>
                )}

                {/* NOTE 5: SCHEDULED SCALING */}
                {selectedNote === 'scheduled_scaling' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Predictable loads</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Scheduled Chron-Driven Scaling</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('policies')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Policies
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 5 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      Dynamic scaling takes time: instances must launch, boot, and pass health checks. If your traffic patterns are highly predictable (e.g. a retail business peaking at 9 AM, or a school testing application), you can pre-emptively scale the fleet using **Scheduled Actions** based on Unix cron expressions.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <span className="font-extrabold text-slate-800 block">Production Cron Scaling Configuration:</span>
                        
                        <div className="space-y-3 font-mono text-[10.5px]">
                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-emerald-700 font-bold">Morning Scale-Out (08:30 AM):</span>
                            <p className="text-slate-805 mt-1">Recurrence: <code className="bg-slate-200 px-1 py-0.5 rounded text-amber-700">30 8 * * 1-5</code> (Mon-Fri)</p>
                            <p className="text-slate-600">Desired: 8 Nodes, Min: 8, Max: 15</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                            <span className="text-indigo-700 font-bold">Evening Scale-In (06:00 PM):</span>
                            <p className="text-slate-805 mt-1">Recurrence: <code className="bg-slate-200 px-1 py-0.5 rounded text-amber-700">0 18 * * 1-5</code> (Mon-Fri)</p>
                            <p className="text-slate-600">Desired: 2 Nodes, Min: 2, Max: 15</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                        <h4 className="font-bold text-slate-800 text-xs">The Advantages of Scheduled Scaling:</h4>
                        <p className="leading-relaxed">
                          By scaling out 30 minutes <em>before</em> the daily workload peak starts, you guarantee that all servers are warm and ready, preventing latency spikes for your initial morning users.
                        </p>
                        
                        <div className="acad-takeaway-box">
                          <strong>💡 Hybrid Strategy:</strong> You can combine scheduled actions with dynamic scaling. Let a scheduled action scale out to 8 instances at 8:30 AM, and let Target Tracking scale the fleet even higher if CPU spikes during mid-day flash sales!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 6: EC2 VS ELB HEALTH CHECKS */}
                {selectedNote === 'ec2_vs_elb_checks' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Fleet diagnostics</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">EC2 vs ELB Active Target Group Health Checks</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('health')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Health &amp; Lifecycles
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 6 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      By default, an Auto Scaling Group only monitors basic EC2 status checks. This means that if your underlying hardware is fine but your application process crashes, the ASG will report the instance as healthy, keeping it in rotation. To prevent this, you should enable **ELB Health Checks**.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                        <h4 className="font-bold text-slate-800 text-xs">The Health Diagnostics Breakdown:</h4>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>
                            <strong className="text-slate-805">EC2 Status Checks:</strong> Monitors hypervisor virtualization, memory allocation, and OS hardware level errors. Ignore application-level code crashes.
                          </li>
                          <li>
                            <strong className="text-slate-805">ELB Health Checks:</strong> The ALB actively pings a target path (e.g. <code>HTTP /healthz</code>). If the application server returns a non-200 status code (e.g., 502 Bad Gateway), the ALB alerts the ASG to replace the node.
                          </li>
                        </ul>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between font-mono text-[11px] text-slate-600">
                        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-2">Self-Healing Diagnostics Flow</span>
                        
                        <div className="space-y-2.5">
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-slate-700">App crash (502 return)</span>
                            <span className="text-red-600 font-bold font-semibold">&bull; ALB marks Fail</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-slate-700">Evict target group</span>
                            <span className="text-orange-600 font-bold font-semibold">&bull; Route bypass</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-slate-700">Reconcile Desired size</span>
                            <span className="text-indigo-600 font-bold font-semibold">&bull; Provision i-new</span>
                          </div>
                        </div>

                        <div className="text-[9.5px] text-slate-450 mt-3 leading-normal">
                          * Always set the health check grace period to allow your application to boot fully before health checks begin.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 7: LIFECYCLE HOOKS */}
                {selectedNote === 'lifecycle_hooks' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Instance Transition Hooks</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Lifecycle Hooks &amp; State Interrupts</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('health')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Health &amp; Lifecycles
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 7 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      By default, instances transition straight from creation to in-service. With **Lifecycle Hooks**, the ASG pauses instances at the state boundaries (<code>Pending:Wait</code> or <code>Terminating:Wait</code>) for up to 1 hour, letting you run orchestration scripts before instances accept traffic or get terminated.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <span className="font-extrabold text-slate-800 block">Common Hook Use Cases:</span>
                        
                        <ol className="list-decimal pl-4 space-y-2">
                          <li>
                            <strong className="text-slate-800">Pending Launch:</strong> Wait for Lambda / EventBridge to precache dynamic assets, download system keys, or run database migrations before the node joins the ALB target group.
                          </li>
                          <li>
                            <strong className="text-slate-800">Terminating Terminate:</strong> Pause node destruction to upload logs to S3, finalize transaction state buffers, or back up local states.
                          </li>
                        </ol>

                        <div className="acad-takeaway-box">
                          <strong>💡 Timeout Actions:</strong> If your hook orchestration script fails to return a <code>CONTINUE</code> signal within the timeout window, the ASG will enforce the default fallback action: either <code>CONTINUE</code> (putting the node in rotation anyway) or <code>ABANDON</code> (destroying and replacing the node).
                        </div>
                      </div>

                      {/* Lambda Hook code block */}
                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Python Lambda Hook Completer</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(lifecycleHookLambdaCode);
                              setCopiedNoteId('lh-lambda');
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="p-1 rounded bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'lh-lambda' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-64">
                          {lifecycleHookLambdaCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 8: COOLDOWNS & WARMUPS */}
                {selectedNote === 'cooldowns_warmups' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Fleet stabilization</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Cooldown Periods vs Instance Warmup</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('sim')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Fleet Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 8 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      To prevent an Auto Scaling Group from scaling too quickly (e.g., launching new instances before the previously launched ones have finished booting), AWS uses **Cooldown Periods** and **Instance Warmup** parameters to stabilize the fleet size.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                        <span className="font-extrabold text-slate-800 block">Fleet Stabilization Mechanics:</span>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li>
                            <strong className="text-slate-805">Scaling Cooldown (Default: 300s):</strong> The period after a scaling activity completes during which the ASG ignores other alarms. This ensures the fleet has time to process traffic and lower metric levels before another scale action runs.
                          </li>
                          <li>
                            <strong className="text-slate-805">Instance Warmup:</strong> Used in Target Tracking. Specifies how long it takes an instance to boot and begin sending metric data. Warmup metrics are excluded from target group averages to prevent metric distortion.
                          </li>
                        </ul>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-4">Cooldown Loop Safeguard</span>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                          <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-lg">
                            <p className="font-bold text-orange-655">📈 Scale Out</p>
                            <span>Launch Instance</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg">
                            <p className="font-bold text-indigo-650">⏳ Cooldown</p>
                            <span>Lock: 300s</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                            <p className="font-bold text-emerald-600">🛡️ Safe Evaluation</p>
                            <span>Release locks</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-4 leading-normal max-w-xs mx-auto">
                          Cooldown guards block rapid scaling actions, protecting you from over-provisioning servers due to lag in boot processes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 9: ZONAL REBALANCING */}
                {selectedNote === 'zonal_rebalancing' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">zonal distribution</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Zonal Rebalancing Mechanics</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('arch')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Cpu className="w-3.5 h-3.5" /> Go to VPC Architecture
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 9 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      To ensure high availability, an Auto Scaling Group always tries to keep instances distributed evenly across all enabled Availability Zones (AZs). When an AZ goes down or the fleet scales in, the ASG engine uses rebalancing mechanics to restore symmetry.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                        <span className="font-extrabold text-slate-800 block">ASG Rebalancing Steps:</span>
                        
                        <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                          <li>
                            ASG monitors instance counts per AZ.
                          </li>
                          <li>
                            If an instance is terminated in AZ-A, the ASG immediately launches a replacement.
                          </li>
                          <li>
                            If the ASG is rebalancing a lopsided group (e.g. 3 nodes in AZ-A, 1 node in AZ-B), it launches a new instance in AZ-B first, and then terminates an instance in AZ-A to keep desired capacity stable.
                          </li>
                        </ol>

                        <div className="acad-takeaway-box">
                          <strong>💡 Availability Priority:</strong> During rebalancing, the ASG launches the new instance <em>before</em> terminating the old one. This ensures that the group remains at or above desired capacity, avoiding performance degradation during rebalancing.
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-4">Symmetric Fleet Rebalance</span>
                        
                        <div className="space-y-2 text-left max-w-xs mx-auto">
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-emerald-600 font-bold">Subnet us-east-1a</span>
                            <span className="text-slate-700">2 Nodes</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-emerald-600 font-bold">Subnet us-east-1b</span>
                            <span className="text-slate-700">2 Nodes</span>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-slate-500 mt-4 leading-normal">
                          If an Availability Zone suffers a hardware outage, the ASG will provision all desired nodes in the surviving zone automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 10: LB CO-LOCATION */}
                {selectedNote === 'lb_colocation' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Ingress Integration</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">ALB/NLB Target Group Integration</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('sim')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Fleet Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 10 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">
                      An Auto Scaling Group does not route user traffic itself; it only manages compute instances. Outward-facing traffic is received by a Load Balancer (ALB or NLB), which distributes requests across the instances registered in its **Target Group**.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650 leading-relaxed">
                        <span className="font-extrabold text-slate-800 block">Registration &amp; Scale-In Cycle:</span>
                        
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li>
                            <strong className="text-slate-805">Ingress:</strong> When the ASG launches a new instance, it automatically registers its private IP and port with the associated ALB target group.
                          </li>
                          <li>
                            <strong className="text-slate-805">Egress (Draining):</strong> When scaling in, the ALB sets the instance status to <code>draining</code>. The load balancer immediately stops sending new connections to the instance, while allowing active connections to complete before termination.
                          </li>
                        </ul>

                        <div className="acad-takeaway-box">
                          <strong>💡 Professional Practice:</strong> Set your target group's Deregistration Delay (connection draining timeout) to match your application's longest request duration (e.g. 30s for web APIs, 300s for large document generation).
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center text-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-3">Load Balancer Registration Flow</span>
                        
                        <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-mono">
                          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                            <p className="font-bold text-blue-600">⚖️ ALB/NLB</p>
                            <span>Ingress ingress</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-lg">
                            <p className="font-bold text-orange-655">📈 ASG Group</p>
                            <span>Auto Scale</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-lg">
                            <p className="font-bold text-emerald-600">🖥️ target node</p>
                            <span>Reg / Drain</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-4 leading-normal max-w-xs mx-auto">
                          Decoupling scale management from traffic routing allows your application to scale smoothly without interrupting user sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
