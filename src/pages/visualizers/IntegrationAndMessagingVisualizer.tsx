import { useState, useEffect, useRef } from 'react';

type TabType = 'sqs' | 'sns' | 'fanout' | 'kinesis' | 'amazonmq' | 'comparison';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface SQSMessage {
  id: string;
  body: string;
  deduplicationId?: string;
  groupId?: string;
  status: 'active' | 'polled' | 'completed' | 'dlq';
  pollCount: number;
  visibilityTimer?: number; // active countdown in seconds
}

interface S3File {
  filename: string;
  format: 'JSON' | 'Parquet';
  size: string;
  itemsCount: number;
}

export default function IntegrationAndMessagingVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('sqs');

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================

  // --- SQS Queues State ---
  const [sqsVisibilityTimeout, setSqsVisibilityTimeout] = useState<number>(6);
  const [sqsLongPolling, setSqsLongPolling] = useState<number>(0);
  const [sqsQueueType, setSqsQueueType] = useState<'standard' | 'fifo'>('standard');
  const [sqsGroupId, setSqsGroupId] = useState<string>('group-A');
  const [sqsDeduplicationId, setSqsDeduplicationId] = useState<string>('dedup-100');
  const [sqsMessages, setSqsMessages] = useState<SQSMessage[]>([
    { id: 'msg-101', body: 'Order Data #1001', status: 'active', pollCount: 0 },
    { id: 'msg-102', body: 'Order Data #1002', status: 'active', pollCount: 0 },
  ]);
  const [sqsLogs, setSqsLogs] = useState<SimLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'SQS Simulator loaded. Queue contains 2 active tasks.' }
  ]);
  const [isSqsLongPollingActive, setIsSqsLongPollingActive] = useState<boolean>(false);
  const [sqsLongPollCountdown, setSqsLongPollCountdown] = useState<number>(0);
  const [sqsFlashingWarning, setSqsFlashingWarning] = useState<string | null>(null);

  // --- SNS Pub/Sub State ---
  const [snsEventBody, setSnsEventBody] = useState<string>('Invoice Created #9421');
  const [snsRegion, setSnsRegion] = useState<'us-east' | 'eu-west' | 'ap-south'>('us-east');
  const [snsLogs, setSnsLogs] = useState<SimLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'SNS Pub/Sub router online. Topic: "billing-events".' }
  ]);
  const [snsAnimationState, setSnsAnimationState] = useState<'idle' | 'publishing' | 'routing'>('idle');
  const [snsMatches, setSnsMatches] = useState<{ usQueue: boolean; euQueue: boolean; lambda: boolean }>({
    usQueue: false,
    euQueue: false,
    lambda: false,
  });
  const [snsSubCounts, setSnsSubCounts] = useState<{ usQueue: number; euQueue: number; lambda: number }>({
    usQueue: 12,
    euQueue: 8,
    lambda: 45,
  });

  // --- FIFO Fanout & Firehose State ---
  const [fanoutMode, setFanoutMode] = useState<'standard' | 'fifo'>('fifo');
  const [fanoutIsStreaming, setFanoutIsStreaming] = useState<boolean>(false);
  const [fanoutLogs, setFanoutLogs] = useState<SimLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Fanout pipeline initialized. Ready to simulate order transaction events.' }
  ]);
  const [fanoutStep, setFanoutStep] = useState<number>(0);
  const [fanoutQueuesData, setFanoutQueuesData] = useState<{ billing: string[]; inventory: string[] }>({
    billing: [],
    inventory: []
  });
  
  // Firehose state
  const [firehoseBuffer, setFirehoseBuffer] = useState<string[]>([]);
  const [firehoseSizeLimit, setFirehoseSizeLimit] = useState<number>(3);
  const [firehoseTimeLimit, setFirehoseTimeLimit] = useState<number>(8);
  const [firehoseTimer, setFirehoseTimer] = useState<number>(8);
  const [firehoseFlushStatus, setFirehoseFlushStatus] = useState<'idle' | 'flushing' | 'success'>('idle');
  const [s3Files, setS3Files] = useState<S3File[]>([
    { filename: 'orders_analytics/year=2026/orders_base.parquet', format: 'Parquet', size: '14.2 KB', itemsCount: 15 }
  ]);

  // --- Kinesis Streams State ---
  const [kinesisShards, setKinesisShards] = useState<number>(1);
  const [kinesisCapacityMode, setKinesisCapacityMode] = useState<'provisioned' | 'ondemand'>('provisioned');
  const [kinesisIngressRate, setKinesisIngressRate] = useState<number>(800); // KB/s
  const [kinesisLogs, setKinesisLogs] = useState<SimLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Kinesis Stream online. Shard count: 1. Provisioned write capacity: 1000 KB/s.' }
  ]);
  const [kinesisThrottled, setKinesisThrottled] = useState<boolean>(false);
  const [kinesisCustomPK, setKinesisCustomPK] = useState<string>('sensor_35');
  const [kinesisHashResult, setKinesisHashResult] = useState<{ hash: string; shardNum: number } | null>(null);
  const [kinesisRecentPackets, setKinesisRecentPackets] = useState<Array<{ id: string; pk: string; shard: number; status: 'ok' | 'throttled' }>>([]);

  // --- Amazon MQ State ---
  const [mqStatus, setMqStatus] = useState<'healthy' | 'failed' | 'fencing' | 'dns-swap' | 'promoted' | 'restored'>('healthy');
  const [mqStep, setMqStep] = useState<number>(0);
  const [mqIsTransitioning, setMqIsTransitioning] = useState<boolean>(false);
  const [mqLogs, setMqLogs] = useState<SimLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'ActiveMQ broker active on subnet AZ-a endpoint (failover primary).' }
  ]);

  // --- Comparison Selector ---
  const [comparisonUseCase, setComparisonUseCase] = useState<'iot' | 'payment' | 'newsletter' | 'none'>('none');

  // ==========================================
  // REFERENCE POINTERS
  // ==========================================
  const sqsLongPollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // STABLE LOGGING UTILITIES
  // ==========================================
  const addSqsLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSqsLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev.slice(0, 39)]);
  };

  const addSnsLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSnsLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev.slice(0, 39)]);
  };

  const addFanoutLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setFanoutLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev.slice(0, 39)]);
  };

  const addKinesisLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setKinesisLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev.slice(0, 39)]);
  };

  const addMqLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setMqLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev.slice(0, 39)]);
  };

  // ==========================================
  // EFFECT HOOKS
  // ==========================================

  // 1. SQS Visibility Timeout Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSqsMessages(prev => {
        let changed = false;
        const updated = prev.map(msg => {
          if (msg.status === 'polled' && typeof msg.visibilityTimer === 'number') {
            if (msg.visibilityTimer <= 1) {
              changed = true;
              const newPollCount = msg.pollCount + 1;
              if (newPollCount >= 3) {
                addSqsLog(`Visibility lock expired for ${msg.id}. Exceeded max retries (3). Promoted to DLQ!`, 'error');
                return { ...msg, status: 'dlq' as const, pollCount: newPollCount, visibilityTimer: undefined };
              } else {
                addSqsLog(`Visibility lock expired for ${msg.id}. Re-enqueuing into SQS active state.`, 'warning');
                return { ...msg, status: 'active' as const, pollCount: newPollCount, visibilityTimer: undefined };
              }
            } else {
              return { ...msg, visibilityTimer: msg.visibilityTimer - 1 };
            }
          }
          return msg;
        });
        return changed || updated.some((m, idx) => m.visibilityTimer !== prev[idx].visibilityTimer) ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Kinesis Stream Real-Time Packet Simulator
  useEffect(() => {
    const streamTimer = setInterval(() => {
      const activeLimit = kinesisShards * 1000; // KB/sec
      const isThrottledCurrent = kinesisIngressRate > activeLimit;
      const shouldThrottle = isThrottledCurrent && kinesisCapacityMode === 'provisioned';
      
      setKinesisThrottled(shouldThrottle);

      // Generate clickstream packets
      const keyIndex = Math.floor(Math.random() * 5);
      const pkNames = ['user_10', 'device_44', 'sensor_abc', 'client_v2', 'user_99'];
      const pk = pkNames[keyIndex];
      const packetHash = Math.abs(pk.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
      const targetShard = (packetHash % kinesisShards) + 1;

      setKinesisRecentPackets(prev => {
        const next = [
          {
            id: `pk-${Math.floor(Math.random() * 900) + 100}`,
            pk,
            shard: targetShard,
            status: shouldThrottle ? ('throttled' as const) : ('ok' as const)
          },
          ...prev.slice(0, 14)
        ];
        return next;
      });

      if (isThrottledCurrent) {
        if (kinesisCapacityMode === 'provisioned') {
          addKinesisLog(`429 Throttling warning: Ingress rate ${kinesisIngressRate} KB/s exceeds provisioned limit of ${activeLimit} KB/s. Packets dropped!`, 'error');
        } else if (kinesisCapacityMode === 'ondemand') {
          addKinesisLog(`On-Demand Mode: Ingress threshold exceeded. Initiating auto-shard splitting resharding...`, 'warning');
          setKinesisShards(prev => Math.min(prev + 1, 3));
          addKinesisLog(`On-Demand Auto Scale complete: Expanded shards to satisfy ingestion spike.`, 'success');
        }
      }
    }, 1800);

    return () => clearInterval(streamTimer);
  }, [kinesisShards, kinesisCapacityMode, kinesisIngressRate]);

  // 3. Firehose Timer countdown
  useEffect(() => {
    if (activeTab !== 'fanout') return;
    const interval = setInterval(() => {
      setFirehoseTimer(prev => {
        if (prev <= 1) {
          triggerFirehoseFlush();
          return firehoseTimeLimit;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, firehoseBuffer, firehoseTimeLimit]);

  // ==========================================
  // COMPONENT ACTIONS
  // ==========================================

  // --- SQS Operations ---
  const handleSqsEnqueue = () => {
    const newId = `msg-${Math.floor(Math.random() * 900) + 100}`;
    const payload = `Order Data #${Math.floor(Math.random() * 9000) + 1000}`;

    if (sqsQueueType === 'fifo') {
      if (!sqsDeduplicationId.trim()) {
        setSqsFlashingWarning('FIFO queue requires a unique Message Deduplication ID!');
        return;
      }
      
      // Check deduplication window (mock)
      const duplicateExists = sqsMessages.some(m => m.deduplicationId === sqsDeduplicationId && m.status !== 'completed');
      if (duplicateExists) {
        addSqsLog(`Deduplication Block: Message discarded. Token '${sqsDeduplicationId}' exists within the deduplication window!`, 'error');
        setSqsFlashingWarning(`Deduplication discard: ID '${sqsDeduplicationId}' is already active!`);
        setTimeout(() => setSqsFlashingWarning(null), 3000);
        return;
      }

      const newMsg: SQSMessage = {
        id: newId,
        body: payload,
        deduplicationId: sqsDeduplicationId,
        groupId: sqsGroupId,
        status: 'active',
        pollCount: 0
      };

      setSqsMessages(prev => [...prev, newMsg]);
      addSqsLog(`FIFO Enqueue: Message ${newId} (Group: ${sqsGroupId}, Dedup ID: ${sqsDeduplicationId}) written to queue.`, 'success');

      // Auto-increment deduplication ID for clean UX
      const num = parseInt(sqsDeduplicationId.replace(/\D/g, '')) || 0;
      setSqsDeduplicationId(`dedup-${num + 1}`);
    } else {
      const newMsg: SQSMessage = {
        id: newId,
        body: payload,
        status: 'active',
        pollCount: 0
      };
      setSqsMessages(prev => [...prev, newMsg]);
      addSqsLog(`Standard Enqueue: Message ${newId} pushed asynchronously to buffer.`, 'success');
    }

    // Long polling instant resolve check
    if (isSqsLongPollingActive) {
      addSqsLog(`Long Polling matched! Message ${newId} pushed during active poll connection. Pulling instantly.`, 'success');
      setIsSqsLongPollingActive(false);
      setSqsLongPollCountdown(0);
      if (sqsLongPollTimerRef.current) clearTimeout(sqsLongPollTimerRef.current);
      
      // Instantly poll this newly created message
      setSqsMessages(prev => prev.map(m => m.id === newId ? { ...m, status: 'polled', visibilityTimer: sqsVisibilityTimeout } : m));
    }
  };

  const handleSqsPoll = () => {
    // 1. Check if empty
    const activeMessages = sqsMessages.filter(m => m.status === 'active');
    
    if (activeMessages.length === 0) {
      if (sqsLongPolling > 0 && !isSqsLongPollingActive) {
        addSqsLog(`Long Polling active: Queue is empty. Connection held open for up to ${sqsLongPolling}s.`, 'warning');
        setIsSqsLongPollingActive(true);
        setSqsLongPollCountdown(sqsLongPolling);
        
        // Countdown visual ticker
        const countInterval = setInterval(() => {
          setSqsLongPollCountdown(c => {
            if (c <= 1) {
              clearInterval(countInterval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);

        sqsLongPollTimerRef.current = setTimeout(() => {
          setIsSqsLongPollingActive(false);
          clearInterval(countInterval);
          addSqsLog(`Long poll timeout: No messages pushed within interval. SQS returned empty metadata block (0 messages, 200 OK).`, 'info');
        }, sqsLongPolling * 1000);
      } else {
        addSqsLog(`Short Polling returned empty (0 messages). API returned instantly.`, 'warning');
      }
      return;
    }

    // 2. Select target based on FIFO / standard
    setSqsMessages(prev => {
      let targetMsg: SQSMessage | undefined;
      
      if (sqsQueueType === 'standard') {
        targetMsg = prev.find(m => m.status === 'active');
      } else {
        // FIFO Group Lock Rule
        const lockedGroups = new Set(prev.filter(m => m.status === 'polled').map(m => m.groupId));
        targetMsg = prev.find(m => m.status === 'active' && (!m.groupId || !lockedGroups.has(m.groupId)));
      }

      if (!targetMsg) {
        if (sqsQueueType === 'fifo') {
          addSqsLog(`FIFO Block: Polled failed. Concurrent reads on active Message Groups are blocked to preserve ordering!`, 'error');
          setSqsFlashingWarning('Message Groups are locked because existing items are processing!');
          setTimeout(() => setSqsFlashingWarning(null), 3000);
        } else {
          addSqsLog(`Poll action returned no available active records.`, 'warning');
        }
        return prev;
      }

      const selectedId = targetMsg.id;
      addSqsLog(`Poll Success: Message ${selectedId} locked. Processing engaged with ${sqsVisibilityTimeout}s Visibility Timeout.`, 'success');
      
      return prev.map(m => m.id === selectedId ? { ...m, status: 'polled', visibilityTimer: sqsVisibilityTimeout } : m);
    });
  };

  const handleSqsComplete = (id: string) => {
    setSqsMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'completed' as const, visibilityTimer: undefined } : m));
    addSqsLog(`Complete Success: Message ${id} completed. Deleted permanently from SQS cluster storage.`, 'success');
  };

  const handleSqsReset = () => {
    setSqsMessages([
      { id: 'msg-201', body: 'Order Data #2001', status: 'active', pollCount: 0 },
      { id: 'msg-202', body: 'Order Data #2002', status: 'active', pollCount: 0 }
    ]);
    setSqsLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'SQS queue simulator reset.' }]);
    setIsSqsLongPollingActive(false);
    setSqsLongPollCountdown(0);
    if (sqsLongPollTimerRef.current) clearTimeout(sqsLongPollTimerRef.current);
  };


  // --- SNS Pub/Sub Operations ---
  const handleSnsPublish = () => {
    if (snsAnimationState !== 'idle') return;
    
    setSnsAnimationState('publishing');
    addSnsLog(`Publish: Ingested event payload to SNS Topic [billing-events]. region="${snsRegion}"`, 'info');

    // Step 1: Animate to SNS Topic
    setTimeout(() => {
      setSnsAnimationState('routing');
      
      // Calculate match rules
      const matches = {
        usQueue: snsRegion === 'us-east',
        euQueue: snsRegion === 'eu-west',
        lambda: true // No filter policy, receives all
      };
      
      setSnsMatches(matches);

      // SQS EU filter trace
      addSnsLog(`Evaluating Subscription US Shipping (Filter: region=="us-east"): ${matches.usQueue ? 'MATCH' : 'MISMATCH (Dropped)'}`, matches.usQueue ? 'success' : 'error');
      addSnsLog(`Evaluating Subscription EU Shipping (Filter: region=="eu-west"): ${matches.euQueue ? 'MATCH' : 'MISMATCH (Dropped)'}`, matches.euQueue ? 'success' : 'error');
      addSnsLog(`Evaluating Subscription Analytical Lambda (No Filter Policy): MATCH (Always Broadcast)`, 'success');

      // Step 2: Push to target subscriber states
      setTimeout(() => {
        setSnsSubCounts(prev => ({
          usQueue: prev.usQueue + (matches.usQueue ? 1 : 0),
          euQueue: prev.euQueue + (matches.euQueue ? 1 : 0),
          lambda: prev.lambda + 1
        }));
        
        addSnsLog(`SNS Broadcast successfully delivered payload copies to healthy matching targets.`, 'success');
        setSnsAnimationState('idle');
      }, 1500);

    }, 1000);
  };


  // --- Fanout & Firehose Operations ---
  const handleStartFanoutStream = () => {
    if (fanoutIsStreaming) return;
    setFanoutIsStreaming(true);
    setFanoutStep(0);
    setFanoutQueuesData({ billing: [], inventory: [] });
    addFanoutLog(`Triggering event stream of 5 transactions... Queue ordering model: ${fanoutMode.toUpperCase()}`, 'info');

    const streamSteps = [
      { id: 'TX-A1', desc: 'Deposit Order A1 (Acct A)' },
      { id: 'TX-B1', desc: 'Withdrawal Order B1 (Acct B)' },
      { id: 'TX-A2', desc: 'Deposit Order A2 (Acct A)' },
      { id: 'TX-B2', desc: 'Withdrawal Order B2 (Acct B)' },
      { id: 'TX-A3', desc: 'Deposit Order A3 (Acct A)' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= streamSteps.length) {
        clearInterval(interval);
        setFanoutIsStreaming(false);
        addFanoutLog(`Fanout complete: All messages broadcast through SNS topic and enqueued.`, 'success');
        return;
      }

      const tx = streamSteps[stepIndex];
      setFanoutStep(stepIndex + 1);
      
      // Update subscriber queues
      setFanoutQueuesData(prev => {
        const nextBilling = [...prev.billing, tx.id];
        const nextInventory = [...prev.inventory, tx.id];
        return {
          billing: fanoutMode === 'fifo' ? nextBilling : nextBilling.sort(() => Math.random() - 0.5),
          inventory: fanoutMode === 'fifo' ? nextInventory : nextInventory.sort(() => Math.random() - 0.5)
        };
      });

      // Add to Firehose buffer concurrently
      setFirehoseBuffer(prev => {
        const next = [...prev, `${tx.id}: JSON Payload`];
        if (next.length >= firehoseSizeLimit) {
          setTimeout(() => triggerFirehoseFlush(), 100);
        }
        return next;
      });

      addFanoutLog(`SNS Published: ${tx.desc} -> Fanned out to SQS Billing & Inventory.`, 'info');
      stepIndex++;
    }, 1000);
  };

  const triggerFirehoseFlush = () => {
    if (firehoseBuffer.length === 0 || firehoseFlushStatus !== 'idle') return;
    
    setFirehoseFlushStatus('flushing');
    addFanoutLog(`Firehose Buffer Limit Reached (${firehoseBuffer.length} items). Invoking flush pipeline...`, 'warning');
    
    // Convert format via serverless Lambda logic simulation
    setTimeout(() => {
      const fileId = Math.floor(Math.random() * 900) + 100;
      const sizeKB = (firehoseBuffer.length * 1.1 + 2.3).toFixed(1);
      
      const newFile: S3File = {
        filename: `orders_analytics/year=2026/month=05/batch_orders_${fileId}.parquet`,
        format: 'Parquet',
        size: `${sizeKB} KB`,
        itemsCount: firehoseBuffer.length
      };

      setS3Files(prev => [newFile, ...prev]);
      setFirehoseBuffer([]);
      setFirehoseFlushStatus('success');
      addFanoutLog(`Lambda Transformation: Structured JSON formatted into columnar Parquet format.`, 'success');
      addFanoutLog(`S3 Upload Complete: Uploaded batch_orders_${fileId}.parquet to S3 archive partition.`, 'success');
      
      setTimeout(() => {
        setFirehoseFlushStatus('idle');
        setFirehoseTimer(firehoseTimeLimit);
      }, 1500);

    }, 1500);
  };


  // --- Kinesis Streams Operations ---
  const handleSplitShard = () => {
    if (kinesisShards >= 3) {
      addKinesisLog('Simulation limit: Maximum of 3 shards reached.', 'warning');
      return;
    }
    setKinesisRecentPackets([]); // Reset packets during resharding partition shift!
    setKinesisShards(prev => prev + 1);
    addKinesisLog(`Resharding: Split operation triggered. Hash ranges split. Active shards: ${kinesisShards + 1} (${(kinesisShards + 1) * 1.0} MB/s total bandwidth)`, 'success');
  };

  const handleMergeShards = () => {
    if (kinesisShards <= 1) {
      addKinesisLog('Simulation limit: Minimum of 1 active shard required.', 'warning');
      return;
    }
    setKinesisRecentPackets([]); // Reset packets during resharding partition shift!
    setKinesisShards(prev => prev - 1);
    addKinesisLog(`Resharding: Shards merged. Active Shards: ${kinesisShards - 1} (${(kinesisShards - 1) * 1.0} MB/s capacity)`, 'warning');
  };

  const handleHashPK = () => {
    if (!kinesisCustomPK.trim()) return;
    const packetHash = Math.abs(kinesisCustomPK.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
    const targetShard = (packetHash % kinesisShards) + 1;
    const hexHash = (packetHash % 65536).toString(16).toUpperCase().padStart(4, '0');
    
    setKinesisHashResult({
      hash: `MD5(PK) = 0x${hexHash}...`,
      shardNum: targetShard
    });

    addKinesisLog(`Partition Key [${kinesisCustomPK}] hashes to 0x${hexHash}. Directed strictly to Shard ${targetShard}.`, 'success');
  };


  // --- Amazon MQ Operations ---
  const handleMqFailover = () => {
    if (mqIsTransitioning) return;
    mqRunTransition();
  };

  const mqRunTransition = () => {
    setMqIsTransitioning(true);
    
    if (mqStatus === 'healthy') {
      setMqStatus('failed');
      setMqStep(1);
      addMqLog('CRITICAL: Primary Broker AZ-a endpoint is unreachable (AZ hardware outage)! Connection pool down.', 'error');
      
      setTimeout(() => {
        setMqStep(2);
        setMqStatus('fencing');
        addMqLog('Fencing shared storage: Mounting EFS locks exclusively to AZ-b standby node to prevent split-brain writes.', 'warning');
        
        setTimeout(() => {
          setMqStep(3);
          setMqStatus('dns-swap');
          addMqLog('DNS shift engaged: Active MQ record set to passive Standby AZ-b IP address.', 'warning');
          
          setTimeout(() => {
            setMqStep(4);
            setMqStatus('promoted');
            addMqLog('Promotion Complete: Passive broker promoted to Active. Resending pending queue transaction offsets.', 'success');
            
            setTimeout(() => {
              setMqStep(5);
              setMqIsTransitioning(false);
              addMqLog('Reconnection Success: Legacy JMS application client failover transport restored tunnel. Processing resumed with 0 message loss.', 'success');
            }, 1200);
            
          }, 1200);
          
        }, 1200);
        
      }, 1200);

    } else {
      // Restore AZ-a broker
      setMqStep(0);
      setMqStatus('restored');
      addMqLog('Restoring AZ-a Broker node. Mounting state synchronization backlogs...', 'info');
      
      setTimeout(() => {
        setMqStatus('healthy');
        setMqIsTransitioning(false);
        addMqLog('AZ-a broker recovered and syncing as active standby mirror. Full High-Availability restored.', 'success');
      }, 1500);
    }
  };


  return (
    <div className="im-container">
      {/* ==========================================
          Premium Scoped CSS Definitions
          ========================================== */}
      <style>{`
        .im-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 28px;
          min-height: 100vh;
        }

        .im-header {
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 18px;
          margin-bottom: 24px;
        }

        .im-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .im-subtitle {
          font-size: 13.5px;
          color: #475569;
          margin-top: 8px;
          line-height: 1.6;
        }

        .im-tab-nav {
          display: flex;
          gap: 5px;
          border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0);
          padding-bottom: 10px;
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .im-tab-btn {
          padding: 6px 14px;
          border-radius: var(--border-radius-lg, 12px);
          border: 0.5px solid var(--color-border-secondary, #cbd5e1);
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary, #475569);
          background: var(--color-background-secondary, #f8fafc);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .im-tab-btn:hover {
          background: var(--color-background-tertiary, #f1f5f9);
        }

        .im-tab-btn.im-active {
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
          font-weight: 500;
        }

        .im-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .im-grid {
            grid-template-columns: 1fr;
          }
        }

        .im-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
        }

        .im-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .im-card-desc {
          font-size: 13px;
          color: #475569;
          line-height: 1.65;
          margin-bottom: 20px;
        }

        .im-form-group {
          margin-bottom: 18px;
        }

        .im-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #475569;
          margin-bottom: 8px;
        }

        .im-input, .im-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          font-size: 13.5px;
          outline: none;
          transition: all 0.15s ease;
        }

        .im-input:focus, .im-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .im-slider {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
        }

        .im-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .im-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .im-btn {
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
        }

        .im-btn-primary {
          background: #2563eb;
          color: #ffffff;
        }

        .im-btn-primary:hover {
          background: #1d4ed8;
        }

        .im-btn-secondary {
          background: #ffffff;
          color: #334155;
          border-color: #cbd5e1;
        }

        .im-btn-secondary:hover {
          background: #f1f5f9;
        }

        .im-btn-danger {
          background: #ef4444;
          color: #ffffff;
        }

        .im-btn-danger:hover {
          background: #dc2626;
        }

        .im-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .im-badge-sqs { background: #fffbeb; color: #c2410c; border: 1px solid #fde68a; }
        .im-badge-sns { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .im-badge-kinesis { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
        .im-badge-mq { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
        .im-badge-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
        .im-badge-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

        .im-terminal {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
          font-size: 11px;
          color: #334155;
          line-height: 1.6;
          height: 240px;
          overflow-y: auto;
          margin-top: 16px;
          border: 1px solid #cbd5e1;
        }

        .im-terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 8px;
          margin-bottom: 12px;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        .im-log-line {
          margin-bottom: 6px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 4px;
        }

        .im-log-time {
          color: #94a3b8;
          margin-right: 8px;
        }

        .im-log-success { color: #16a34a; font-weight: bold; }
        .im-log-warning { color: #ca8a04; font-weight: bold; }
        .im-log-error { color: #dc2626; font-weight: bold; }
        .im-log-info { color: #2563eb; }

        .flow-active-line {
          stroke-dasharray: 8, 4;
          animation: flowAnimation 20s linear infinite;
        }

        @keyframes flowAnimation {
          to {
            stroke-dashoffset: -1000;
          }
        }

        .im-pulse {
          animation: pulseAnimation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulseAnimation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .im-queue-container {
          display: flex;
          gap: 12px;
          min-height: 110px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 16px;
          overflow-x: auto;
          align-items: center;
        }

        .im-msg-card {
          width: 100px;
          height: 90px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          font-size: 11.5px;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .im-msg-card.im-msg-polled {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .im-msg-card.im-msg-dlq {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .im-msg-lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(254, 243, 199, 0.9);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #d97706;
          font-weight: 700;
          font-size: 11px;
        }

        .im-grid-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .im-feature-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
        }

        .im-feature-title {
          font-weight: 700;
          color: #334155;
          margin-bottom: 4px;
        }

        .im-feature-value {
          color: #64748b;
          font-size: 11px;
        }

        /* Fanout specific styles */
        .im-fanout-stream-item {
          display: inline-block;
          padding: 4px 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          color: #1e40af;
        }

        /* MQ specific failover steps */
        .im-mq-step-card {
          border-left: 3px solid #cbd5e1;
          padding: 8px 12px;
          background: #ffffff;
          margin-bottom: 8px;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .im-mq-step-card.im-mq-step-active {
          border-left-color: #0ea5e9;
          background: #f0f9ff;
          font-weight: bold;
        }

        .im-mq-step-card.im-mq-step-success {
          border-left-color: #22c55e;
          background: #f0fdf4;
        }

        /* Matrix styling */
        .im-matrix-header {
          background: #f1f5f9;
          font-weight: bold;
          text-align: center;
        }
        
        .im-matrix-cell {
          padding: 12px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
        }
      `}</style>

      {/* Title Header */}
      <div className="im-header">
        <div className="im-title">
          <span>✉️</span> AWS Integration &amp; Messaging Architecture Playground
        </div>
        <div className="im-subtitle">
          Explore production-grade decoupled designs. TweakVisibility Timeout thresholds in SQS, simulate attribute pub/sub event filtering inside SNS, monitor FIFO preserving sequence fanouts, test Kinesis clickstream shard splits under heavy 429 congestion, and trigger Active/Standby cross-AZ MQ failover steppers.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="im-tab-nav">
        <button className={`im-tab-btn ${activeTab === 'sqs' ? 'im-active' : ''}`} onClick={() => setActiveTab('sqs')}>
          📤 SQS Queues &amp; Locks
        </button>
        <button className={`im-tab-btn ${activeTab === 'sns' ? 'im-active' : ''}`} onClick={() => setActiveTab('sns')}>
          📢 SNS Pub/Sub Filtering
        </button>
        <button className={`im-tab-btn ${activeTab === 'fanout' ? 'im-active' : ''}`} onClick={() => setActiveTab('fanout')}>
          🔀 FIFO Fanout &amp; Firehose
        </button>
        <button className={`im-tab-btn ${activeTab === 'kinesis' ? 'im-active' : ''}`} onClick={() => setActiveTab('kinesis')}>
          🌊 Kinesis clickstreams
        </button>
        <button className={`im-tab-btn ${activeTab === 'amazonmq' ? 'im-active' : ''}`} onClick={() => setActiveTab('amazonmq')}>
          🐹 Amazon MQ AZ Failover
        </button>
        <button className={`im-tab-btn ${activeTab === 'comparison' ? 'im-active' : ''}`} onClick={() => setActiveTab('comparison')}>
          📊 Interactive Comparison Matrix
        </button>
      </div>

      {/* ==========================================
          TAB 1: SQS QUEUES & LOCKS
          ========================================== */}
      {activeTab === 'sqs' && (
        <div className="im-grid">
          {/* Controls */}
          <div>
            <div className="im-card">
              <div className="im-card-title">
                <span className="im-badge im-badge-sqs">SQS Sandbox Configurator</span>
              </div>
              <div className="im-card-desc">
                Simple Queue Service (SQS) decouples application tiers. Producers enqueue transactions, and consumers pull tasks. Configure the parameters below to see how visibility timeouts, long polling, and FIFO deduplication behave in real-time.
              </div>

              {sqsFlashingWarning && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' }} className="im-pulse">
                  ⚠️ {sqsFlashingWarning}
                </div>
              )}

              <div className="im-grid-features">
                <div className="im-form-group">
                  <label className="im-label">Queue Mode</label>
                  <select className="im-select" value={sqsQueueType} onChange={(e) => { setSqsQueueType(e.target.value as 'standard' | 'fifo'); handleSqsReset(); }}>
                    <option value="standard">Standard Queue (At-Least-Once)</option>
                    <option value="fifo">FIFO Queue (Exactly-Once, Ordered)</option>
                  </select>
                </div>

                <div className="im-form-group">
                  <label className="im-label">Visibility Timeout: <strong>{sqsVisibilityTimeout}s</strong></label>
                  <input type="range" className="im-slider" min="2" max="30" value={sqsVisibilityTimeout} onChange={(e) => setSqsVisibilityTimeout(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="im-grid-features">
                <div className="im-form-group">
                  <label className="im-label">Long Polling wait: <strong>{sqsLongPolling}s</strong></label>
                  <input type="range" className="im-slider" min="0" max="20" value={sqsLongPolling} onChange={(e) => setSqsLongPolling(parseInt(e.target.value))} />
                </div>

                {sqsQueueType === 'fifo' && (
                  <div className="im-form-group">
                    <label className="im-label">Message Group ID</label>
                    <select className="im-select" value={sqsGroupId} onChange={(e) => setSqsGroupId(e.target.value)}>
                      <option value="group-A">Group A (Sequential Segment)</option>
                      <option value="group-B">Group B (Sequential Segment)</option>
                    </select>
                  </div>
                )}
              </div>

              {sqsQueueType === 'fifo' && (
                <div className="im-form-group" style={{ maxWidth: '300px' }}>
                  <label className="im-label">Message Deduplication ID (5-min window)</label>
                  <input type="text" className="im-input" value={sqsDeduplicationId} onChange={(e) => setSqsDeduplicationId(e.target.value)} placeholder="e.g. dedup-100" />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="im-btn im-btn-primary" onClick={handleSqsEnqueue}>
                  📥 Enqueue Message
                </button>
                <button className="im-btn im-btn-secondary" onClick={handleSqsPoll} disabled={isSqsLongPollingActive}>
                  {isSqsLongPollingActive ? `Polling... (${sqsLongPollCountdown}s)` : '⚙️ Poll (Pull) Message'}
                </button>
                <button className="im-btn im-btn-secondary" onClick={handleSqsReset}>
                  🔄 Reset Sandbox
                </button>
              </div>
            </div>

            {/* Queue Telemetry Display */}
            <div className="im-card">
              <div className="im-card-title">📦 Active SQS Buffer Queue</div>
              <div className="im-card-desc">
                Messages below are stored in the queue. Click the checkbox (Complete) on polled message cards to process them.
              </div>

              <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748b' }}>
                Queue Mode: <strong style={{ color: '#ea580c' }}>{sqsQueueType.toUpperCase()}</strong> | Active: <strong>{sqsMessages.filter(m => m.status === 'active').length}</strong> | Polled (Locked): <strong>{sqsMessages.filter(m => m.status === 'polled').length}</strong>
              </div>

              <div className="im-queue-container" style={{ marginBottom: '20px' }}>
                {sqsMessages.filter(m => m.status !== 'dlq' && m.status !== 'completed').length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '12px', width: '100%', textAlign: 'center' }}>
                    Queue empty. Click 'Enqueue Message' to populate.
                  </div>
                ) : (
                  sqsMessages.filter(m => m.status !== 'dlq' && m.status !== 'completed').map((msg) => (
                    <div key={msg.id} className={`im-msg-card ${msg.status === 'polled' ? 'im-msg-polled' : ''}`}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#475569' }}>{msg.id}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.body}</div>
                        {msg.groupId && (
                          <div style={{ fontSize: '8px', background: '#e0f2fe', color: '#0369a1', padding: '1px 4px', borderRadius: '3px', marginTop: '4px', display: 'inline-block' }}>
                            Grp: {msg.groupId}
                          </div>
                        )}
                      </div>

                      {msg.status === 'polled' ? (
                        <div className="im-msg-lock-overlay">
                          <span style={{ fontSize: '14px' }}>🔒 {msg.visibilityTimer}s</span>
                          <button 
                            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                            onClick={() => handleSqsComplete(msg.id)}
                          >
                            ✓ Complete
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'right' }}>Active Buffer</div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dead Letter Queue */}
              <div className="im-card-title">⚠️ Dead-Letter Queue (DLQ)</div>
              <div className="im-card-desc">
                Messages failing processing over 3 visibility timeouts are automatically moved to DLQ to isolate poisonous transaction items.
              </div>
              <div className="im-queue-container" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                {sqsMessages.filter(m => m.status === 'dlq').length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '12px', width: '100%', textAlign: 'center' }}>
                    DLQ clear. No poisonous messages detected.
                  </div>
                ) : (
                  sqsMessages.filter(m => m.status === 'dlq').map((msg) => (
                    <div key={msg.id} className="im-msg-card im-msg-dlq">
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>{msg.id} (DLQ)</div>
                        <div style={{ fontSize: '10px', marginTop: '4px' }}>{msg.body}</div>
                        <div style={{ fontSize: '9px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>Retries: {msg.pollCount}</div>
                      </div>
                      <div style={{ fontSize: '8px', color: '#ef4444', textAlign: 'right' }}>Isolated 🛑</div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

          {/* Interactive Logs */}
          <div>
            <div className="im-card" style={{ height: '100%' }}>
              <div className="im-card-title">💻 SQS Standard vs FIFO Visual Telemetry</div>
              
              <svg width="100%" height="160" viewBox="0 0 380 160" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', marginBottom: '16px' }}>
                <rect x="10" y="40" width="80" height="80" rx="8" fill="#fff7ed" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="50" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#c2410c">Producer</text>
                <text x="50" y="85" textAnchor="middle" fontSize="8" fill="#ca8a04">Vite App</text>
                <text x="50" y="105" textAnchor="middle" fontSize="7" fill="#9a3412">Async Send</text>

                <path d="M 90 80 L 150 80" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5,3" className="flow-active-line" />

                <rect x="150" y="25" width="100" height="110" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                <text x="200" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">SQS Cluster</text>
                <text x="200" y="60" textAnchor="middle" fontSize="7" fill="#64748b">{sqsQueueType === 'fifo' ? 'FIFO Ordered' : 'At-least-once'}</text>
                
                {/* Visual queue stack */}
                <rect x="165" y="75" width="20" height="40" rx="2" fill="#fffbeb" stroke="#fde68a" />
                <rect x="190" y="75" width="20" height="40" rx="2" fill="#fffbeb" stroke="#fde68a" />
                <rect x="215" y="75" width="20" height="40" rx="2" fill="#fef2f2" stroke="#fca5a5" />

                <path d="M 250 80 L 300 80" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,3" className="flow-active-line" />

                <rect x="300" y="40" width="70" height="80" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
                <text x="335" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803d">Consumer</text>
                <text x="335" y="95" textAnchor="middle" fontSize="8" fill="#166534">EC2 / Lambda</text>
              </svg>

              <div className="im-terminal">
                <div className="im-terminal-header">
                  <span>CONSOLE MONITOR: SQS POOL TRACE</span>
                  <span style={{ color: '#22c55e' }}>ONLINE</span>
                </div>
                {sqsLogs.map((log, idx) => (
                  <div key={idx} className="im-log-line">
                    <span className="im-log-time">[{log.timestamp}]</span>
                    <span className={`im-log-${log.type}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SNS PUB/SUB FILTERING
          ========================================== */}
      {activeTab === 'sns' && (
        <div className="im-grid">
          {/* Controls */}
          <div>
            <div className="im-card">
              <div className="im-card-title">
                <span className="im-badge im-badge-sns">SNS Pub/Sub Console</span>
              </div>
              <div className="im-card-desc">
                Simple Notification Service (SNS) operates on a push-model pub/sub system. Publishers push message payloads with metadata attributes to a central Topic. SNS instantly evaluates server-side filter policies for each subscription and duplicates/pushes matching messages down to SQS or Lambda queues.
              </div>

              <div className="im-form-group">
                <label className="im-label">Event Body (Transaction Details)</label>
                <input type="text" className="im-input" value={snsEventBody} onChange={(e) => setSnsEventBody(e.target.value)} />
              </div>

              <div className="im-form-group">
                <label className="im-label">Attribute Header: <code>region</code></label>
                <select className="im-select" value={snsRegion} onChange={(e) => setSnsRegion(e.target.value as 'us-east' | 'eu-west' | 'ap-south')}>
                  <option value="us-east">us-east (US region checkout)</option>
                  <option value="eu-west">eu-west (EU region checkout)</option>
                  <option value="ap-south">ap-south (APAC region checkout)</option>
                </select>
              </div>

              <button className="im-btn im-btn-primary" onClick={handleSnsPublish} disabled={snsAnimationState !== 'idle'}>
                {snsAnimationState === 'publishing' ? 'Ingesting Event...' : snsAnimationState === 'routing' ? 'Evaluating Subscription Filters...' : '📢 Publish Event to SNS'}
              </button>
            </div>

            {/* Subscriber Metrics */}
            <div className="im-card">
              <div className="im-card-title">📢 Subscriber Endpoints Telemetry</div>
              <div className="im-card-desc">
                Check subscription message counts below. SQS queues filter out unmatched messages server-side.
              </div>

              <div className="im-grid-features">
                <div className="im-feature-box">
                  <div className="im-feature-title" style={{ color: '#6b21a8' }}>📥 US Shipping SQS</div>
                  <div className="im-feature-value">Filter Rule: <code>region == "us-east"</code></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', color: '#1e293b' }}>
                    {snsSubCounts.usQueue} events
                  </div>
                </div>

                <div className="im-feature-box">
                  <div className="im-feature-title" style={{ color: '#6b21a8' }}>📥 EU Shipping SQS</div>
                  <div className="im-feature-value">Filter Rule: <code>region == "eu-west"</code></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', color: '#1e293b' }}>
                    {snsSubCounts.euQueue} events
                  </div>
                </div>

                <div className="im-feature-box">
                  <div className="im-feature-title" style={{ color: '#0369a1' }}>⚙️ Analytical Lambda</div>
                  <div className="im-feature-value">Filter Rule: <code>None (Receives All)</code></div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', color: '#1e293b' }}>
                    {snsSubCounts.lambda} invocations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphical routing SVG & logs */}
          <div>
            <div className="im-card">
              <div className="im-card-title">🔀 Real-Time SNS Fanout Topography</div>
              
              <svg width="100%" height="240" viewBox="0 0 400 240" style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', marginBottom: '16px' }}>
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" />
                  </marker>
                </defs>

                {/* Publisher */}
                <rect x="10" y="90" width="80" height="50" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="50" y="115" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569">Billing App</text>
                <text x="50" y="130" textAnchor="middle" fontSize="7" fill="#7c3aed">Publisher</text>

                {/* Animation: path from publisher to SNS */}
                <path d="M 90 115 L 160 115" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrow)" 
                  className={snsAnimationState === 'publishing' ? 'flow-active-line' : ''} />

                {/* SNS Topic */}
                <circle cx="190" cy="115" r="28" fill="#ffffff" stroke="#7c3aed" strokeWidth="2.5" />
                <text x="190" y="112" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b21a8">SNS Topic</text>
                <text x="190" y="125" textAnchor="middle" fontSize="7" fill="#7c3aed">billing-events</text>

                {/* Sub 1: US Queue */}
                <path d="M 218 100 L 290 50" fill="none" stroke={snsAnimationState === 'routing' && snsMatches.usQueue ? '#22c55e' : '#a78bfa'} strokeWidth="1.5" markerEnd="url(#arrow)"
                  className={snsAnimationState === 'routing' && snsMatches.usQueue ? 'flow-active-line' : ''} />
                <rect x="290" y="25" width="100" height="40" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="340" y="42" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">US Shipping Queue</text>
                {snsAnimationState === 'routing' && (
                  <rect x="235" y="55" width="40" height="12" rx="3" fill={snsMatches.usQueue ? '#ecfdf5' : '#fef2f2'} stroke={snsMatches.usQueue ? '#22c55e' : '#ef4444'} />
                )}
                {snsAnimationState === 'routing' && (
                  <text x="255" y="63" textAnchor="middle" fontSize="7" fontWeight="bold" fill={snsMatches.usQueue ? '#15803d' : '#b91c1c'}>
                    {snsMatches.usQueue ? 'MATCH' : 'DROP'}
                  </text>
                )}

                {/* Sub 2: EU Queue */}
                <path d="M 218 115 L 290 115" fill="none" stroke={snsAnimationState === 'routing' && snsMatches.euQueue ? '#22c55e' : '#a78bfa'} strokeWidth="1.5" markerEnd="url(#arrow)"
                  className={snsAnimationState === 'routing' && snsMatches.euQueue ? 'flow-active-line' : ''} />
                <rect x="290" y="95" width="100" height="40" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="340" y="112" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">EU Shipping Queue</text>
                {snsAnimationState === 'routing' && (
                  <rect x="235" y="118" width="40" height="12" rx="3" fill={snsMatches.euQueue ? '#ecfdf5' : '#fef2f2'} stroke={snsMatches.euQueue ? '#22c55e' : '#ef4444'} />
                )}
                {snsAnimationState === 'routing' && (
                  <text x="255" y="126" textAnchor="middle" fontSize="7" fontWeight="bold" fill={snsMatches.euQueue ? '#15803d' : '#b91c1c'}>
                    {snsMatches.euQueue ? 'MATCH' : 'DROP'}
                  </text>
                )}

                {/* Sub 3: Lambda */}
                <path d="M 218 130 L 290 180" fill="none" stroke={snsAnimationState === 'routing' ? '#22c55e' : '#a78bfa'} strokeWidth="1.5" markerEnd="url(#arrow)"
                  className={snsAnimationState === 'routing' ? 'flow-active-line' : ''} />
                <rect x="290" y="165" width="100" height="40" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="340" y="182" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">Analytics Lambda</text>
                {snsAnimationState === 'routing' && (
                  <rect x="235" y="160" width="40" height="12" rx="3" fill="#ecfdf5" stroke="#22c55e" />
                )}
                {snsAnimationState === 'routing' && (
                  <text x="255" y="168" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#15803d">PASS</text>
                )}
              </svg>

              <div className="im-terminal">
                <div className="im-terminal-header">
                  <span>SNS ROUTER TRACE LOG</span>
                  <span style={{ color: '#7c3aed' }}>BROADCAST INGEST</span>
                </div>
                {snsLogs.map((log, idx) => (
                  <div key={idx} className="im-log-line">
                    <span className="im-log-time">[{log.timestamp}]</span>
                    <span className={`im-log-${log.type}`}>{log.message}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: FIFO FANOUT & FIREHOSE
          ========================================== */}
      {activeTab === 'fanout' && (
        <div className="im-grid">
          {/* Controls */}
          <div>
            <div className="im-card">
              <div className="im-card-title">
                <span className="im-badge im-badge-sqs">FIFO Fanout Simulator</span>
              </div>
              <div className="im-card-desc">
                In strict architectures, you fan out from **SNS FIFO Topics** to **SQS FIFO Queues** to guarantee ordered transaction processing. Concurrently, you stream all raw events to **Kinesis Data Firehose** for batch S3 archival.
              </div>

              <div className="im-grid-features">
                <div className="im-form-group">
                  <label className="im-label">Fanout Messaging ordering</label>
                  <select className="im-select" value={fanoutMode} onChange={(e) => setFanoutMode(e.target.value as 'standard' | 'fifo')}>
                    <option value="fifo">FIFO Topic + FIFO Queue (Strict Sequences preserved)</option>
                    <option value="standard">Standard Fanout (Out-of-order, best-effort)</option>
                  </select>
                </div>

                <div className="im-form-group">
                  <label className="im-label">Firehose Buffer size: <strong>{firehoseSizeLimit} items</strong></label>
                  <input type="range" className="im-slider" min="1" max="5" value={firehoseSizeLimit} onChange={(e) => setFirehoseSizeLimit(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="im-grid-features">
                <div className="im-form-group">
                  <label className="im-label">Firehose Buffer time: <strong>{firehoseTimeLimit}s</strong></label>
                  <input type="range" className="im-slider" min="5" max="15" value={firehoseTimeLimit} onChange={(e) => { setFirehoseTimeLimit(parseInt(e.target.value)); setFirehoseTimer(parseInt(e.target.value)); }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="im-btn im-btn-primary" onClick={handleStartFanoutStream} disabled={fanoutIsStreaming}>
                  {fanoutIsStreaming ? `Streaming Transaction Step ${fanoutStep} / 5...` : '🔀 Ingest Transaction Event Stream (5 Events)'}
                </button>
              </div>
            </div>

            {/* Downstream Queues Display */}
            <div className="im-card">
              <div className="im-card-title">📥 SQS Downstream Consumer Queues</div>
              <div className="im-card-desc">
                Observe the ordering inside Billing and Inventory queues.
              </div>

              <div className="im-grid-features">
                <div className="im-feature-box">
                  <div className="im-feature-title" style={{ color: '#c2410c' }}>💳 Billing SQS FIFO</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '34px', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', background: '#f8fafc' }}>
                    {fanoutQueuesData.billing.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Empty</span>
                    ) : (
                      fanoutQueuesData.billing.map((item, idx) => (
                        <span key={idx} className="im-fanout-stream-item">{item}</span>
                      ))
                    )}
                  </div>
                </div>

                <div className="im-feature-box">
                  <div className="im-feature-title" style={{ color: '#c2410c' }}>📦 Inventory SQS FIFO</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '34px', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', background: '#f8fafc' }}>
                    {fanoutQueuesData.inventory.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Empty</span>
                    ) : (
                      fanoutQueuesData.inventory.map((item, idx) => (
                        <span key={idx} className="im-fanout-stream-item">{item}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Firehose Buffer Tank */}
            <div className="im-card">
              <div className="im-card-title">🌊 Kinesis Data Firehose Buffer Ingest</div>
              <div className="im-card-desc">
                Firehose buffers incoming streams before flushing batches to S3. Timer or size threshold triggers are highlighted.
              </div>

              <div className="im-grid-features" style={{ alignItems: 'center' }}>
                <div>
                  <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', position: 'relative', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <div style={{
                      width: `${(firehoseBuffer.length / firehoseSizeLimit) * 100}%`,
                      height: '100%',
                      background: '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#1e293b', fontWeight: 'bold' }}>
                      Buffer: {firehoseBuffer.length} / {firehoseSizeLimit} records
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Next time flush countdown: <strong>{firehoseTimer}s</strong>
                  </div>
                </div>

                <div className="im-feature-box" style={{ background: firehoseFlushStatus !== 'idle' ? '#eff6ff' : '#f8fafc' }}>
                  <div className="im-feature-title">Buffer Status</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: firehoseFlushStatus === 'flushing' ? '#3b82f6' : firehoseFlushStatus === 'success' ? '#22c55e' : '#475569' }}>
                    {firehoseFlushStatus === 'flushing' ? '🔄 Transforming and flushing...' : firehoseFlushStatus === 'success' ? '🟢 S3 Batch Saved' : 'Waiting for buffer...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* S3 Storage files and trace */}
          <div>
            <div className="im-card">
              <div className="im-card-title">🪣 Target Amazon S3 Analytics Store</div>
              <div className="im-card-desc">
                Aggregated, Parquet columnar data lake buckets. JSON payloads are structured via Lambda on Firehose buffer write.
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f0fdf4', padding: '14px', maxHeight: '150px', overflowY: 'auto', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#166534', marginBottom: '8px' }}>s3://my-data-lake-archive/</div>
                {s3Files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', borderBottom: '1px solid #d1fae5', padding: '6px 0' }}>
                    <span style={{ color: '#0f766e', fontFamily: 'monospace' }}>📄 {file.filename}</span>
                    <span style={{ fontSize: '10.5px', color: '#475569' }}>{file.size} ({file.itemsCount} rows)</span>
                  </div>
                ))}
              </div>

              <div className="im-terminal">
                <div className="im-terminal-header">
                  <span>FANOUT &amp; STREAMING ANALYTICS MONITOR</span>
                  <span style={{ color: '#2563eb' }}>DATA FLOW ACTIVE</span>
                </div>
                {fanoutLogs.map((log, idx) => (
                  <div key={idx} className="im-log-line">
                    <span className="im-log-time">[{log.timestamp}]</span>
                    <span className={`im-log-${log.type}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: KINESIS DATA STREAMS
          ========================================== */}
      {activeTab === 'kinesis' && (
        <div className="im-grid">
          {/* Controls */}
          <div>
            <div className="im-card">
              <div className="im-card-title">
                <span className="im-badge im-badge-kinesis">Kinesis Stream Dashboard</span>
              </div>
              <div className="im-card-desc">
                Amazon Kinesis is engineered for massive real-time clickstream log ingestion. Standard queues delete messages on reader pulls, whereas Kinesis provides high-retention offset streams allowing multiple analytical engines to replay transactions repeatedly.
              </div>

              {kinesisThrottled && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' }} className="im-pulse">
                  ⚠️ ProvisionedThroughputExceededException: 429 Write Ingestion Blocked!
                </div>
              )}

              <div className="im-grid-features">
                <div className="im-form-group">
                  <label className="im-label">Capacity Configuration Mode</label>
                  <select className="im-select" value={kinesisCapacityMode} onChange={(e) => setKinesisCapacityMode(e.target.value as 'provisioned' | 'ondemand')}>
                    <option value="provisioned">Provisioned Mode (Manual limit control)</option>
                    <option value="ondemand">On-Demand Mode (Auto-scales shards)</option>
                  </select>
                </div>

                <div className="im-form-group">
                  <label className="im-label">Clickstream Ingress rate: <strong>{kinesisIngressRate} KB/s</strong></label>
                  <input type="range" className="im-slider" min="200" max="3000" step="100" value={kinesisIngressRate} onChange={(e) => setKinesisIngressRate(parseInt(e.target.value))} />
                </div>
              </div>

              <div className="im-grid-features" style={{ alignItems: 'center' }}>
                <div className="im-feature-box">
                  <div className="im-feature-title">Shard Telemetry Capacity</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
                    Active Shards: {kinesisShards} | Max Write Ingress: {kinesisShards * 1000} KB/s
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="im-btn im-btn-secondary" onClick={handleSplitShard} disabled={kinesisShards >= 3}>
                    🪓 Split Shard
                  </button>
                  <button className="im-btn im-btn-secondary" onClick={handleMergeShards} disabled={kinesisShards <= 1}>
                    🤝 Merge Shards
                  </button>
                </div>
              </div>
            </div>

            {/* MD5 Hash Partition key router */}
            <div className="im-card">
              <div className="im-card-title">🔑 Partition Key MD5 Hash Router</div>
              <div className="im-card-desc">
                Type a partition key below to trace its MD5 hash segment, and see which physical Shard Lane it routes to. Strict ordering is guaranteed within that partition key.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="im-input" value={kinesisCustomPK} onChange={(e) => setKinesisCustomPK(e.target.value)} placeholder="e.g. sensor_88" />
                <button className="im-btn im-btn-primary" onClick={handleHashPK}>
                  ⚙️ Calculate Hash
                </button>
              </div>

              {kinesisHashResult && (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#f0f9ff', border: '1px dashed #bae6fd', borderRadius: '8px', fontSize: '12px' }}>
                  String Key: <strong style={{ color: '#0369a1' }}>{kinesisCustomPK}</strong> | Hash Segment: <code>{kinesisHashResult.hash}</code> | Allocated Destination: <strong style={{ color: '#0284c7' }}>Shard Lane {kinesisHashResult.shardNum}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Shard Heatmap lanes */}
          <div>
            <div className="im-card">
              <div className="im-card-title">🌊 Real-Time Ingress Shard Lanes Heatmap</div>
              <div className="im-card-desc">
                Telemetry streams are dynamically directed into partitioned Shards based on key hashes. Red dots indicate dropped records from exceeding capacity limits.
              </div>

              {/* Shard visual lanes */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '14px', marginBottom: '16px' }}>
                {[...Array(kinesisShards)].map((_, i) => {
                  const maxSlots = 8;
                  const shardPackets = kinesisRecentPackets.filter(p => p.shard === i + 1).slice(0, maxSlots);
                  const slots: any[] = [...shardPackets];
                  while (slots.length < maxSlots) {
                    slots.push({ id: `empty-${i}-${slots.length}`, pk: '', shard: i + 1, status: 'empty' });
                  }

                  return (
                    <div key={i} style={{ marginBottom: '12px', borderBottom: i < kinesisShards - 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
                        <span>🌊 Shard Lane {i + 1} (Hash segment {Math.floor((i * 65536) / kinesisShards).toString(16).toUpperCase()}-{(Math.floor(((i + 1) * 65536) / kinesisShards) - 1).toString(16).toUpperCase()})</span>
                        <span style={{ color: '#0f766e' }}>Max limit: 1.0 MB/s</span>
                      </div>

                      {/* Packet visual heatmap cells grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', marginTop: '6px' }}>
                        {slots.map((p) => {
                          if (p.status === 'empty') {
                            return (
                              <div key={p.id} style={{
                                height: '36px',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: '#94a3b8'
                              }}>
                                <span>-</span>
                                <span style={{ fontSize: '6px', opacity: 0.5 }}>IDLE</span>
                              </div>
                            );
                          }

                          const isThrottled = p.status === 'throttled';
                          return (
                            <div key={p.id} style={{
                              height: '36px',
                              border: `1.5px solid ${isThrottled ? '#ef4444' : '#0ea5e9'}`,
                              borderRadius: '6px',
                              background: isThrottled ? '#fee2e2' : '#e0f2fe',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              color: isThrottled ? '#b91c1c' : '#0369a1',
                              transition: 'all 0.2s ease',
                              cursor: 'default',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              padding: '0 2px'
                            }} className="im-pulse" title={`PK: ${p.pk} | Status: ${p.status.toUpperCase()}`}>
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                                {p.pk}
                              </span>
                              <span style={{ fontSize: '7px', opacity: 0.8, color: isThrottled ? '#b91c1c' : '#0284c7' }}>
                                {isThrottled ? '⚠️ DROP' : '⚡ OK'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="im-terminal">
                <div className="im-terminal-header">
                  <span>KINESIS TELEMETRY TRACE LOG</span>
                  <span style={{ color: '#0369a1' }}>PROVISIONED METRICS</span>
                </div>
                {kinesisLogs.map((log, idx) => (
                  <div key={idx} className="im-log-line">
                    <span className="im-log-time">[{log.timestamp}]</span>
                    <span className={`im-log-${log.type}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: AMAZON MQ FAILOVER BROKER
          ========================================== */}
      {activeTab === 'amazonmq' && (
        <div className="im-grid">
          {/* Controls */}
          <div>
            <div className="im-card">
              <div className="im-card-title">
                <span className="im-badge im-badge-mq">Amazon MQ Broker Configurator</span>
              </div>
              <div className="im-card-desc">
                Amazon MQ hosts managed open-source engines like ActiveMQ and RabbitMQ. Legacy enterprise systems that rely on JMS, AMQP, STOMP, or MQTT protocols can be migrated to Amazon MQ with zero code rewrites. Set up Active/Standby brokers across AZs with synchronous state synchronization.
              </div>

              <div className="im-form-group">
                <label className="im-label">Operational Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: mqStatus === 'healthy' ? '#22c55e' : mqStatus === 'restored' ? '#38bdf8' : '#ef4444',
                    display: 'inline-block'
                  }} className="im-pulse" />
                  <strong style={{ textTransform: 'uppercase', fontSize: '13px' }}>
                    {mqStatus === 'healthy' ? 'Active AZ-a Primary Operational' : mqStatus === 'failed' ? 'PRIMARY OUTAGE - AZ FAILURE' : mqStatus === 'fencing' ? 'Locking shared backend store (Fencing)...' : mqStatus === 'dns-swap' ? 'Swapping DNS Endpoint...' : mqStatus === 'promoted' ? 'Promoted AZ-b Active Primary' : 'Restoring Primary...'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className={`im-btn ${mqStatus === 'healthy' ? 'im-btn-danger' : 'im-btn-primary'}`} onClick={handleMqFailover} disabled={mqIsTransitioning}>
                  {mqIsTransitioning ? 'Engaging Failover Stepper...' : mqStatus === 'healthy' ? '⚠️ Trigger AZ-a Power Loss' : '🔄 Recover AZ-a Broker'}
                </button>
              </div>
            </div>

            {/* Stepper progress */}
            <div className="im-card">
              <div className="im-card-title">📝 ActiveMQ Failover Stepper Playbook</div>
              <div className="im-card-desc">
                Observe the automated steps as failover URIs detect the outage and re-route endpoints.
              </div>

              <div className={`im-mq-step-card ${mqStep === 0 && mqStatus === 'healthy' ? 'im-mq-step-success' : ''}`}>
                1. Healthy Operation: Primary Broker active in Subnet AZ-a. Synchronous state sync active.
              </div>
              <div className={`im-mq-step-card ${mqStep === 1 ? 'im-mq-step-active' : mqStep > 1 ? 'im-mq-step-success' : ''}`}>
                2. Heartbeat Loss: AZ-a node loses power. failover CNAME detects heartbeat packet timeout.
              </div>
              <div className={`im-mq-step-card ${mqStep === 2 ? 'im-mq-step-active' : mqStep > 2 ? 'im-mq-step-success' : ''}`}>
                3. Network Fencing: Standby broker claims lock on shared Amazon EFS to prevent split-brain edits.
              </div>
              <div className={`im-mq-step-card ${mqStep === 3 ? 'im-mq-step-active' : mqStep > 3 ? 'im-mq-step-success' : ''}`}>
                4. DNS Swap: CNAME record shifts to secondary AZ-b standby endpoint IP.
              </div>
              <div className={`im-mq-step-card ${mqStep === 4 ? 'im-mq-step-active' : mqStep > 4 ? 'im-mq-step-success' : ''}`}>
                5. Reconnection Complete: Standby promoted to Active. JMS client resumes transactions with 0 lost packets.
              </div>
            </div>
          </div>

          {/* VPC replica SVG & console logs */}
          <div>
            <div className="im-card">
              <div className="im-card-title">🐹 Amazon MQ Cross-AZ Availability topology</div>
              
              <svg width="100%" height="240" viewBox="0 0 400 240" style={{ background: '#e6fffa', border: '1px solid #99f6e4', borderRadius: '12px', marginBottom: '16px' }}>
                {/* VPC boundary */}
                <rect x="10" y="10" width="380" height="220" rx="8" fill="none" stroke="#64748b" strokeDasharray="3,3" />
                <text x="375" y="24" textAnchor="end" fontSize="7" fontWeight="bold" fill="#64748b">VPC Boundary</text>

                {/* Subnet A */}
                <rect x="25" y="40" width="130" height="110" rx="6" fill="#ffffff" stroke={mqStatus === 'healthy' ? '#0d9488' : '#ef4444'} strokeWidth="1.5" />
                <text x="90" y="52" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f766e">Subnet AZ-a</text>
                
                <rect x="35" y="65" width="110" height="70" rx="4" fill={mqStatus === 'healthy' ? '#f0fdfa' : '#fef2f2'} stroke={mqStatus === 'healthy' ? '#0ea5e9' : '#fca5a5'} />
                <text x="90" y="85" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">Primary Broker</text>
                <text x="90" y="98" textAnchor="middle" fontSize="6" fill="#64748b">ActiveMQ Node</text>
                <text x="90" y="122" textAnchor="middle" fontSize="7" fontWeight="bold" fill={mqStatus === 'healthy' ? '#16a34a' : '#dc2626'}>
                  {mqStatus === 'healthy' ? 'ACTIVE 🟢' : 'OFFLINE ❌'}
                </text>

                {/* Subnet B */}
                <rect x="245" y="40" width="130" height="110" rx="6" fill="#ffffff" stroke={mqStatus === 'healthy' ? '#cbd5e1' : '#0d9488'} strokeWidth="1.5" />
                <text x="310" y="52" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#475569">Subnet AZ-b</text>
                
                <rect x="255" y="65" width="110" height="70" rx="4" fill={mqStatus === 'healthy' ? '#f8fafc' : '#f0fdfa'} stroke={mqStatus === 'healthy' ? '#cbd5e1' : '#0ea5e9'} />
                <text x="310" y="85" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">Standby Broker</text>
                <text x="310" y="98" textAnchor="middle" fontSize="6" fill="#64748b">ActiveMQ Node</text>
                <text x="310" y="122" textAnchor="middle" fontSize="7" fontWeight="bold" fill={mqStatus === 'healthy' ? '#64748b' : '#16a34a'}>
                  {mqStatus === 'healthy' ? 'STANDBY 🔒' : 'PROMOTED 🟢'}
                </text>

                {/* Shared EFS Backend */}
                <rect x="135" y="175" width="130" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="200" y="192" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#475569">💾 Amazon EFS Store</text>
                <text x="200" y="205" textAnchor="middle" fontSize="6" fill="#64748b">Synchronous Message Sync</text>

                {/* Connection paths */}
                <path d="M 90 135 L 90 175" fill="none" stroke={mqStatus === 'healthy' ? '#0ea5e9' : '#cbd5e1'} strokeWidth="1.5" />
                <path d="M 310 135 L 310 175" fill="none" stroke={mqStatus === 'healthy' ? '#cbd5e1' : '#22c55e'} strokeWidth="1.5" />
              </svg>

              <div className="im-terminal">
                <div className="im-terminal-header">
                  <span>AMAZON MQ SYSTEM TRACE LOG</span>
                  <span style={{ color: '#0f766e' }}>ACTIVEMQ SERVICE</span>
                </div>
                {mqLogs.map((log, idx) => (
                  <div key={idx} className="im-log-line">
                    <span className="im-log-time">[{log.timestamp}]</span>
                    <span className={`im-log-${log.type}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: COMPARISON SELECTOR MATRIX
          ========================================== */}
      {activeTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Interactive prompt */}
          <div className="im-card">
            <div className="im-card-title">📊 Dynamic AWS Messaging Architecture Recommendation Solver</div>
            <div className="im-card-desc">
              Select your system requirements below. The matrix will automatically highlight the recommended AWS service and explain the design trade-offs.
            </div>

            <div className="im-grid-features">
              <button className={`im-btn ${comparisonUseCase === 'payment' ? 'im-btn-primary' : 'im-btn-secondary'}`} onClick={() => setComparisonUseCase('payment')}>
                💳 Decoupled payment processing order queues
              </button>
              <button className={`im-btn ${comparisonUseCase === 'newsletter' ? 'im-btn-primary' : 'im-btn-secondary'}`} onClick={() => setComparisonUseCase('newsletter')}>
                📢 Broadcast signup triggers to multiple downstream microservices
              </button>
              <button className={`im-btn ${comparisonUseCase === 'iot' ? 'im-btn-primary' : 'im-btn-secondary'}`} onClick={() => setComparisonUseCase('iot')}>
                🌊 High-velocity clickstreams or real-time IoT sensor telemetry streams
              </button>
            </div>

            {comparisonUseCase !== 'none' && (
              <div style={{ marginTop: '16px', padding: '14px', background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '10px', fontSize: '13px' }}>
                {comparisonUseCase === 'payment' && (
                  <div>
                    <strong>Recommended Service: <span style={{ color: '#c2410c' }}>Amazon SQS (FIFO Queue)</span></strong>
                    <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '12px' }}>
                      Payment gateways require **Exactly-Once delivery** and strict transactional sequencing to prevent double-charging or out-of-order accounting errors. SQS FIFO guarantees order sequencing, enables individual worker pooling with Visibility Timeout locks, and buffers traffic perfectly.
                    </p>
                  </div>
                )}
                {comparisonUseCase === 'newsletter' && (
                  <div>
                    <strong>Recommended Service: <span style={{ color: '#6b21a8' }}>Amazon SNS Topic</span></strong>
                    <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '12px' }}>
                      Signup triggers are **one-to-many fanout notifications**. When a customer registers, SNS duplicates the event payload instantly and pushes copies concurrently to SQS queues for Billing, SQS queues for Shipping, and Lambda analytical tools with zero disk latency storage.
                    </p>
                  </div>
                )}
                {comparisonUseCase === 'iot' && (
                  <div>
                    <strong>Recommended Service: <span style={{ color: '#0369a1' }}>Amazon Kinesis Data Streams</span></strong>
                    <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '12px' }}>
                      High-volume IoT streams are continuously written at megabytes/sec. SQS deletion-on-pull semantics makes historical logs un-replayable. Kinesis streams partition clickstreams via MD5 keys and retain historical streams up to 365 days, letting multiple analytical engines replay offsets repeatedly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Master Comparison Table */}
          <div className="im-card" style={{ overflowX: 'auto' }}>
            <div className="im-card-title">📊 Architectural Comparison Matrix Grid</div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr>
                  <th className="im-matrix-cell im-matrix-header" style={{ width: '18%' }}>Feature Metric</th>
                  <th className={`im-matrix-cell im-matrix-header ${comparisonUseCase === 'payment' ? 'im-pulse' : ''}`} style={{ width: '27%', background: comparisonUseCase === 'payment' ? '#fffbeb' : '#f1f5f9', color: '#c2410c' }}>
                    📥 Amazon SQS (Queuing)
                  </th>
                  <th className={`im-matrix-cell im-matrix-header ${comparisonUseCase === 'newsletter' ? 'im-pulse' : ''}`} style={{ width: '27%', background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#f1f5f9', color: '#6b21a8' }}>
                    📢 Amazon SNS (Pub/Sub)
                  </th>
                  <th className={`im-matrix-cell im-matrix-header ${comparisonUseCase === 'iot' ? 'im-pulse' : ''}`} style={{ width: '27%', background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#f1f5f9', color: '#0369a1' }}>
                    🌊 Amazon Kinesis (Streaming)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Retrieval Protocol</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffdf5' : '#ffffff' }}>
                    <strong>Pull Model</strong>: Consumers actively poll to fetch and lock messages.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#fffdfa' : '#ffffff' }}>
                    <strong>Push Model</strong>: SNS pushes message duplicates instantly to subscribers.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f5faff' : '#ffffff' }}>
                    <strong>Offset Pull Model</strong>: Multiple consumer fleets pull and track custom offsets.
                  </td>
                </tr>
                <tr>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Fanout Capability</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffdf5' : '#ffffff' }}>
                    <strong>1-to-1 Delivery</strong>: Only one consumer locks and processes a message.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#fffdfa' : '#ffffff' }}>
                    <strong>1-to-Many Fanout</strong>: Broadcasts identical payloads up to 12.5M subscribers.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f5faff' : '#ffffff' }}>
                    <strong>Replay Fanout</strong>: Multiple consumer groups read identical stream concurrently.
                  </td>
                </tr>
                <tr>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Data Persistence</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffdf5' : '#ffffff' }}>
                    <strong>High (14 Days)</strong>: Durable storage buffer holds uncompleted tasks.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#fffdfa' : '#ffffff' }}>
                    <strong>Transient (0 Days)</strong>: Messages deleted instantly on push deliveries.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f5faff' : '#ffffff' }}>
                    <strong>Log Streams (365 Days)</strong>: Persistent sequential stream logs are preserved.
                  </td>
                </tr>
                <tr>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Ordering Guarantee</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffdf5' : '#ffffff' }}>
                    Strict sequence in <strong>FIFO mode</strong> using Message Group IDs.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#fffdfa' : '#ffffff' }}>
                    FIFO Topic guarantees order sequence to SQS FIFO subscriptions.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f5faff' : '#ffffff' }}>
                    Strict shard partition key order sequencing.
                  </td>
                </tr>
                <tr>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Scaling Trigger</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffdf5' : '#ffffff' }}>
                    <strong>Queue Depth</strong>: CloudWatch scales ASG EC2 fleets on message count.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#fffdfa' : '#ffffff' }}>
                    Serverless auto-scale based on volume push threads.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f5faff' : '#ffffff' }}>
                    <strong>Resharding Splits</strong>: Splitting hot partition key hash zones.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
