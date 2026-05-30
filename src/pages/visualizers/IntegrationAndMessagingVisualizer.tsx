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
          padding: 24px;
          min-height: 100vh;
        }

        .im-header {
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 14px;
          margin-bottom: 20px;
        }

        .im-title {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          color: #0f172a;
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .im-subtitle {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 4px;
        }

        .im-tab-nav {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }

        .im-tab-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.85);
          color: #475569;
          transition: all 0.15s ease-in-out;
          outline: none;
          font-weight: 600;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .im-tab-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .im-tab-btn.im-active {
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);
        }

        .im-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .im-grid {
            grid-template-columns: 1fr;
          }
        }

        .im-card {
          border: 1.5px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(16px);
          margin-bottom: 18px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
        }

        .im-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .im-card-desc {
          font-size: 13px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .im-form-group {
          margin-bottom: 14px;
        }

        .im-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
        }

        .im-input, .im-select {
          width: 100%;
          padding: 8px 12px;
          font-size: 12.5px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          outline: none;
          color: #1e293b;
          font-weight: 500;
          transition: all 0.15s ease-in-out;
        }

        .im-input:focus, .im-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .im-slider {
          width: 100%;
          accent-color: #2563eb;
          cursor: pointer;
          margin: 6px 0;
        }

        .im-btn {
          font-size: 12.5px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          background: #ffffff;
          color: #1e293b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          outline: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          user-select: none;
        }

        .im-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .im-btn-primary {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
        }

        .im-btn-primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
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
          background: #dc2626;
          border-color: #dc2626;
          color: #ffffff;
        }

        .im-btn-danger:hover {
          background: #b91c1c;
          border-color: #b91c1c;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
        }

        .im-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .im-badge-sqs { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .im-badge-sns { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .im-badge-kinesis { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
        .im-badge-mq { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
        .im-badge-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
        .im-badge-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

        /* Scoped blueprint dot grid backdrops */
        .im-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(203, 213, 225, 0.45) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }

        .im-terminal {
          background: #090d16;
          border-radius: 12px;
          padding: 14px;
          font-size: 11px;
          color: #cbd5e1;
          line-height: 1.6;
          height: 180px;
          overflow-y: auto;
          margin-top: 12px;
          font-family: var(--font-mono), monospace;
          border: 1.5px solid #1e293b;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
        }

        .im-terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 6px;
          margin-bottom: 8px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .im-log-line {
          margin-bottom: 4px;
          border-bottom: 1px dashed rgba(51, 65, 85, 0.3);
          padding-bottom: 4px;
        }

        .im-log-time {
          color: #475569;
          margin-right: 6px;
        }

        .im-log-success { color: #4ade80; font-weight: bold; }
        .im-log-warning { color: #f59e0b; font-weight: bold; }
        .im-log-error { color: #f87171; font-weight: bold; }
        .im-log-info { color: #38bdf8; }

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
          gap: 10px;
          min-height: 100px;
          background: rgba(248, 250, 252, 0.5);
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 12px;
          overflow-x: auto;
          align-items: center;
        }

        .im-msg-card {
          width: 90px;
          height: 80px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          font-size: 11px;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s ease-in-out;
        }

        .im-msg-card.im-msg-polled {
          border-color: #f59e0b;
          background: #fffbeb;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);
        }

        .im-msg-card.im-msg-dlq {
          border-color: #ef4444;
          background: #fef2f2;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
        }

        .im-msg-lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(254, 243, 199, 0.95);
          border-radius: 6px;
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
          margin-bottom: 14px;
        }

        .im-feature-box {
          background: rgba(248, 250, 252, 0.85);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 10px;
          padding: 10px;
          font-size: 12px;
          transition: all 0.2s ease-in-out;
        }
        .im-feature-box:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
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
          padding: 3px 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-weight: 600;
          font-size: 10.5px;
          color: #1e40af;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.05);
        }

        /* MQ specific failover steps */
        .im-mq-step-card {
          border-left: 3px solid #cbd5e1;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.9);
          margin-bottom: 8px;
          font-size: 12px;
          transition: all 0.3s ease;
          border-radius: 0 8px 8px 0;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-left: 3.5px solid #cbd5e1;
        }

        .im-mq-step-card.im-mq-step-active {
          border-left-color: #3b82f6;
          background: #f0f9ff;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(59,130,246,0.05);
        }

        .im-mq-step-card.im-mq-step-success {
          border-left-color: #10b981;
          background: #f0fdf4;
        }

        /* Matrix HSL Badges & Solver row hover */
        .im-matrix-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }
        .im-badge-sqs-hsl { background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .im-badge-sns-hsl { background-color: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .im-badge-kinesis-hsl { background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
        .im-badge-mq-hsl { background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
        
        .im-matrix-row-highlight {
          background-color: rgba(59, 130, 246, 0.04) !important;
          transition: background-color 0.2s ease-in-out;
        }

        .im-matrix-cell {
          padding: 10px 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          color: #1e293b;
        }
        
        .im-matrix-header {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
          text-align: left;
        }

        .im-advisor-box {
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease-in-out;
        }
        .im-advisor-box:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
          transform: translateY(-1px);
        }
        .im-advisor-box.im-active {
          border-color: #10b981;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
        }

        /* Glassmorphic Selector Cards for Matrix Solver */
        .im-selector-card {
          padding: 14px 18px;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          background: rgba(255, 255, 255, 0.65);
          color: #475569;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          outline: none;
          backdrop-filter: blur(8px);
          width: 100%;
        }

        .im-selector-card:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.08);
          transform: translateY(-2px);
          color: #0f172a;
        }

        .im-selector-card.im-selected-payment {
          background: rgba(255, 247, 237, 0.9);
          border-color: #f97316;
          color: #c2410c;
          box-shadow: 0 4px 16px rgba(249, 115, 22, 0.15);
        }

        .im-selector-card.im-selected-newsletter {
          background: rgba(250, 245, 255, 0.9);
          border-color: #a855f7;
          color: #6b21a8;
          box-shadow: 0 4px 16px rgba(168, 85, 247, 0.15);
        }

        .im-selector-card.im-selected-iot {
          background: rgba(240, 249, 255, 0.9);
          border-color: #0ea5e9;
          color: #0369a1;
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.15);
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
              
              <svg width="100%" height="180" viewBox="0 0 380 180" className="im-svg-bg" style={{ border: '1.5px solid rgba(226, 232, 240, 0.85)', borderRadius: '14px', marginBottom: '16px' }}>
                <defs>
                  <linearGradient id="producerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="100%" stopColor="#ffedd5" />
                  </linearGradient>
                  <linearGradient id="sqsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                  </linearGradient>
                  <linearGradient id="consumerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0fdf4" />
                    <stop offset="100%" stopColor="#dcfce7" />
                  </linearGradient>
                  <linearGradient id="dlqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef2f2" />
                    <stop offset="100%" stopColor="#fee2e2" />
                  </linearGradient>
                  <marker id="arrow-sqs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#ea580c" />
                  </marker>
                  <marker id="arrow-poll" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#16a34a" />
                  </marker>
                </defs>

                {/* Producer server card */}
                <g transform="translate(15, 30)">
                  <rect x="0" y="0" width="75" height="90" rx="8" fill="url(#producerGrad)" stroke="#f97316" strokeWidth="1.5" />
                  <rect x="5" y="5" width="65" height="15" rx="3" fill="#ffedd5" stroke="#fdba74" strokeWidth="1" />
                  <circle cx="12" cy="12" r="3" fill="#ea580c" />
                  <text x="37" y="15" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#c2410c">PRODUCER</text>
                  
                  {/* Virtual server lights */}
                  <rect x="10" y="32" width="55" height="8" rx="2" fill="#fff" stroke="#fed7aa" />
                  <circle cx="16" cy="36" r="2" fill="#22c55e" />
                  <circle cx="24" cy="36" r="2" fill="#3b82f6" />
                  <text x="43" y="38" fontSize="7" fontWeight="bold" fill="#ea580c">Vite App</text>
                  
                  <rect x="10" y="48" width="55" height="8" rx="2" fill="#fff" stroke="#fed7aa" />
                  <circle cx="16" cy="52" r="2" fill="#16a34a" />
                  <text x="43" y="54" fontSize="6.5" fill="#ca8a04">Active Task</text>

                  <text x="37" y="80" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ca8a04">Enqueue API</text>
                </g>

                {/* SQS Cluster Server Cabinet */}
                <g transform="translate(130, 15)">
                  <rect x="0" y="0" width="120" height="115" rx="10" fill="url(#sqsGrad)" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="60" y="18" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#1e293b">SQS QUEUE</text>
                  <text x="60" y="28" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ca8a04">
                    {sqsQueueType === 'fifo' ? 'FIFO (Exactly-Once)' : 'Standard (At-Least-Once)'}
                  </text>
                  
                  {/* Active Message Blocks mapping dynamically to active SQS state! */}
                  <g transform="translate(10, 35)">
                    {sqsQueueType === 'fifo' ? (
                      // FIFO Lane partitions
                      <g>
                        <rect x="0" y="0" width="100" height="65" rx="4" fill="rgba(241, 245, 249, 0.5)" stroke="#e2e8f0" strokeWidth="1.5" />
                        <line x1="50" y1="0" x2="50" y2="65" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6" fill="#94a3b8">Group A</text>
                        <text x="75" y="10" textAnchor="middle" fontSize="6" fill="#94a3b8">Group B</text>

                        {/* Standard/FIFO dynamic blocks inside lanes */}
                        {sqsMessages.filter(m => m.status === 'active' && m.groupId === 'group-A').slice(0,2).map((m, idx) => (
                          <rect key={m.id} x="10" y={15 + idx * 22} width="30" height="18" rx="3" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
                        ))}
                        {sqsMessages.filter(m => m.status === 'active' && m.groupId === 'group-B').slice(0,2).map((m, idx) => (
                          <rect key={m.id} x="60" y={15 + idx * 22} width="30" height="18" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
                        ))}
                        
                        {/* Lock Indicators inside SVG if message is polled! */}
                        {sqsMessages.some(m => m.status === 'polled' && m.groupId === 'group-A') && (
                          <rect x="10" y="42" width="30" height="18" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,1" />
                        )}
                        {sqsMessages.some(m => m.status === 'polled' && m.groupId === 'group-B') && (
                          <rect x="60" y="42" width="30" height="18" rx="3" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,1" />
                        )}
                      </g>
                    ) : (
                      // Standard Out of Order Box
                      <g>
                        <rect x="0" y="0" width="100" height="65" rx="4" fill="rgba(248, 250, 252, 0.6)" stroke="#cbd5e1" strokeWidth="1" />
                        <circle cx="25" cy="20" r="10" fill="#ffedd5" stroke="#f97316" />
                        <text x="25" y="23" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ea580c">M</text>
                        
                        <circle cx="75" cy="25" r="10" fill="#e0f2fe" stroke="#0ea5e9" />
                        <text x="75" y="28" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0369a1">M</text>

                        <circle cx="45" cy="45" r="10" fill="#f3e8ff" stroke="#a855f7" />
                        <text x="45" y="48" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6b21a8">M</text>
                      </g>
                    )}
                  </g>
                </g>

                {/* Dead Letter Queue (DLQ) Vault */}
                <g transform="translate(145, 140)">
                  <rect x="0" y="0" width="90" height="30" rx="4" fill="url(#dlqGrad)" stroke="#fca5a5" strokeWidth="1.5" />
                  <text x="45" y="18" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#b91c1c">🛑 DLQ VAULT</text>
                  {sqsMessages.some(m => m.status === 'dlq') && (
                    <circle cx="12" cy="15" r="4" fill="#ef4444" className="im-pulse" />
                  )}
                </g>

                {/* Consumer Station card */}
                <g transform="translate(290, 30)">
                  <rect x="0" y="0" width="75" height="90" rx="8" fill="url(#consumerGrad)" stroke="#10b981" strokeWidth="1.5" />
                  <rect x="5" y="5" width="65" height="15" rx="3" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                  <circle cx="12" cy="12" r="3" fill="#15803d" />
                  <text x="37" y="15" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#14532d">CONSUMER</text>

                  {/* Microservice lights */}
                  <rect x="10" y="32" width="55" height="22" rx="3" fill="#fff" stroke="#a7f3d0" />
                  <text x="37" y="42" textAnchor="middle" fontSize="7.5" fill="#334155" fontWeight="bold">EC2 fleet</text>
                  <text x="37" y="51" textAnchor="middle" fontSize="6.5" fill="#15803d" fontWeight="bold">Poll Active</text>

                  <rect x="10" y="60" width="55" height="8" rx="2" fill="#fff" stroke="#a7f3d0" />
                  <text x="37" y="66" textAnchor="middle" fontSize="6.5" fill="#059669">Long Poll: {sqsLongPolling}s</text>
                </g>

                {/* Connection conduits pipelines */}
                <g>
                  {/* Producer to Queue conduit */}
                  <path d="M 90 75 L 130 75" fill="none" stroke="#ea580c" strokeWidth="2.5" markerEnd="url(#arrow-sqs)" className="flow-active-line" />
                  
                  {/* Queue to Consumer conduit */}
                  <path d="M 250 75 L 290 75" fill="none" stroke="#16a34a" strokeWidth="2.5" markerEnd="url(#arrow-poll)" className="flow-active-line" />

                  {/* DLQ failure drop redirection conduit */}
                  {sqsMessages.some(m => m.status === 'dlq') && (
                    <path d="M 190 130 L 190 140" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow-sqs)" strokeDasharray="3,2" />
                  )}
                </g>
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
              
              <svg width="100%" height="240" viewBox="0 0 400 240" className="im-svg-bg" style={{ border: '1.5px solid rgba(226, 232, 240, 0.85)', borderRadius: '14px', marginBottom: '16px' }}>
                <defs>
                  <linearGradient id="snsTopicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#faf5ff" />
                    <stop offset="100%" stopColor="#f3e8ff" />
                  </linearGradient>
                  <linearGradient id="lambdaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="100%" stopColor="#bae6fd" />
                  </linearGradient>
                  <marker id="arrow-sns" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" />
                  </marker>
                </defs>

                {/* Publisher Billing Client */}
                <g transform="translate(15, 95)">
                  <rect x="0" y="0" width="70" height="50" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="5" y="5" width="60" height="12" rx="2" fill="#faf5ff" stroke="#e9d5ff" />
                  <text x="35" y="14" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#6b21a8">BILLING APP</text>
                  <circle cx="10" cy="32" r="2" fill="#a855f7" className="im-pulse" />
                  <text x="17" y="34.5" fontSize="6.5" fill="#475569" fontWeight="bold">Event Source</text>
                  <text x="35" y="44" textAnchor="middle" fontSize="6" fill="#94a3b8">region="{snsRegion}"</text>
                </g>

                {/* Publisher to SNS conduit */}
                <path d="M 85 120 L 140 120" fill="none" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#arrow-sns)" 
                  className={snsAnimationState === 'publishing' ? 'flow-active-line' : ''} />

                {/* SNS Topic Dispatcher Ring */}
                <g transform="translate(140, 90)">
                  <circle cx="30" cy="30" r="26" fill="url(#snsTopicGrad)" stroke="#7c3aed" strokeWidth="2" />
                  <circle cx="30" cy="30" r="14" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
                  <text x="30" y="27" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6b21a8">SNS</text>
                  <text x="30" y="38" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#7c3aed">Topic</text>
                  
                  {/* Duplication indicator particles */}
                  {snsAnimationState === 'routing' && (
                    <g>
                      <circle cx="15" cy="30" r="2" fill="#a855f7" className="im-pulse" />
                      <circle cx="45" cy="30" r="2" fill="#a855f7" className="im-pulse" />
                      <circle cx="30" cy="15" r="2" fill="#a855f7" className="im-pulse" />
                    </g>
                  )}
                </g>

                {/* Sub 1: US Queue */}
                <g>
                  <path d="M 200 105 L 285 55" fill="none" stroke={snsAnimationState === 'routing' && snsMatches.usQueue ? '#10b981' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#arrow-sns)"
                    className={snsAnimationState === 'routing' && snsMatches.usQueue ? 'flow-active-line' : ''} />
                  
                  <g transform="translate(290, 20)">
                    <rect x="0" y="0" width="95" height="42" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="47" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">US Shipping SQS</text>
                    <text x="47" y="24" textAnchor="middle" fontSize="6.5" fill="#64748b">Filter: region=="us-east"</text>
                    <text x="47" y="34" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ca8a04">Count: {snsSubCounts.usQueue}</text>
                  </g>

                  {/* Filter Evaluation Badge */}
                  {snsAnimationState === 'routing' && (
                    <g transform="translate(210, 52)">
                      <rect x="0" y="0" width="36" height="12" rx="3" fill={snsMatches.usQueue ? '#ecfdf5' : '#fef2f2'} stroke={snsMatches.usQueue ? '#10b981' : '#ef4444'} strokeWidth="1" />
                      <text x="18" y="8.5" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={snsMatches.usQueue ? '#065f46' : '#b91c1c'}>
                        {snsMatches.usQueue ? 'MATCH' : 'DROP'}
                      </text>
                    </g>
                  )}
                </g>

                {/* Sub 2: EU Queue */}
                <g>
                  <path d="M 200 120 L 285 120" fill="none" stroke={snsAnimationState === 'routing' && snsMatches.euQueue ? '#10b981' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#arrow-sns)"
                    className={snsAnimationState === 'routing' && snsMatches.euQueue ? 'flow-active-line' : ''} />
                  
                  <g transform="translate(290, 98)">
                    <rect x="0" y="0" width="95" height="42" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="47" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">EU Shipping SQS</text>
                    <text x="47" y="24" textAnchor="middle" fontSize="6.5" fill="#64748b">Filter: region=="eu-west"</text>
                    <text x="47" y="34" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ca8a04">Count: {snsSubCounts.euQueue}</text>
                  </g>

                  {/* Filter Evaluation Badge */}
                  {snsAnimationState === 'routing' && (
                    <g transform="translate(210, 114)">
                      <rect x="0" y="0" width="36" height="12" rx="3" fill={snsMatches.euQueue ? '#ecfdf5' : '#fef2f2'} stroke={snsMatches.euQueue ? '#10b981' : '#ef4444'} strokeWidth="1" />
                      <text x="18" y="8.5" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={snsMatches.euQueue ? '#065f46' : '#b91c1c'}>
                        {snsMatches.euQueue ? 'MATCH' : 'DROP'}
                      </text>
                    </g>
                  )}
                </g>

                {/* Sub 3: Analytical Lambda */}
                <g>
                  <path d="M 200 135 L 285 185" fill="none" stroke={snsAnimationState === 'routing' ? '#10b981' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#arrow-sns)"
                    className={snsAnimationState === 'routing' ? 'flow-active-line' : ''} />
                  
                  <g transform="translate(290, 175)">
                    <rect x="0" y="0" width="95" height="42" rx="6" fill="url(#lambdaGrad)" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="47" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e3a8a">Analytics Lambda</text>
                    <text x="47" y="24" textAnchor="middle" fontSize="6.5" fill="#1d4ed8">Filter: None (All Events)</text>
                    <text x="47" y="34" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#2563eb">Runs: {snsSubCounts.lambda}</text>
                  </g>

                  {/* Filter Evaluation Badge */}
                  {snsAnimationState === 'routing' && (
                    <g transform="translate(210, 156)">
                      <rect x="0" y="0" width="36" height="12" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                      <text x="18" y="8.5" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#065f46">PASS</text>
                    </g>
                  )}
                </g>
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
              <div className="im-card-title">🔌 Active Fanout &amp; Firehose Topology Map</div>
              
              <svg width="100%" height="200" viewBox="0 0 380 200" className="im-svg-bg" style={{ border: '1.5px solid rgba(226, 232, 240, 0.85)', borderRadius: '14px', marginBottom: '16px' }}>
                <defs>
                  <linearGradient id="firehoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="s3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="100%" stopColor="#ffedd5" />
                  </linearGradient>
                  <marker id="arrow-fanout" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#c2410c" />
                  </marker>
                </defs>

                {/* SNS Topic Dispatcher Node */}
                <g transform="translate(15, 75)">
                  <circle cx="20" cy="20" r="18" fill="#faf5ff" stroke="#7c3aed" strokeWidth="2" />
                  <text x="20" y="23" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#6b21a8">SNS</text>
                  {fanoutIsStreaming && (
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#a855f7" strokeWidth="1.5" className="im-pulse" />
                  )}
                </g>

                {/* SQS Billing Queue */}
                <g transform="translate(130, 20)">
                  <rect x="0" y="0" width="100" height="36" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="50" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">Billing FIFO SQS</text>
                  {/* Dynamic counts inside SVG */}
                  <text x="50" y="28" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ea580c">
                    Orders: {fanoutQueuesData.billing.length}
                  </text>
                </g>

                {/* SQS Inventory Queue */}
                <g transform="translate(130, 75)">
                  <rect x="0" y="0" width="100" height="36" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="50" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e293b">Inventory FIFO SQS</text>
                  <text x="50" y="28" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ea580c">
                    Orders: {fanoutQueuesData.inventory.length}
                  </text>
                </g>

                {/* Kinesis Data Firehose Buffer Cylinder */}
                <g transform="translate(130, 130)">
                  <rect x="0" y="0" width="100" height="50" rx="6" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="50" y="14" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e3a8a">Kinesis Firehose</text>
                  
                  {/* Firehose fluid level representation based on buffer count! */}
                  <rect x="5" y="22" width="90" height="12" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                  <rect 
                    x="5" y="22" 
                    width={Math.min(90, (firehoseBuffer.length / firehoseSizeLimit) * 90)} 
                    height="12" rx="2" 
                    fill="url(#firehoseGrad)" 
                    style={{ transition: 'width 0.3s ease-in-out' }} 
                  />
                  <text x="50" y="31.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill={firehoseBuffer.length > 0 ? '#ffffff' : '#64748b'}>
                    Buffer: {firehoseBuffer.length}/{firehoseSizeLimit}
                  </text>
                  
                  <text x="50" y="44" textAnchor="middle" fontSize="6.5" fill="#1d4ed8">Flush timer: {firehoseTimer}s</text>
                </g>

                {/* Target Amazon S3 database cylinder */}
                <g transform="translate(290, 70)">
                  <rect x="0" y="0" width="70" height="60" rx="8" fill="url(#s3Grad)" stroke="#ea580c" strokeWidth="1.5" />
                  <ellipse cx="35" cy="0" rx="35" ry="8" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.5" />
                  <text x="35" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#c2410c">S3 LAKE</text>
                  <text x="35" y="36" textAnchor="middle" fontSize="6.5" fill="#ea580c">Parquet files</text>
                  <text x="35" y="48" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#7c3aed">Files: {s3Files.length}</text>
                  
                  {/* Pulsing glow on flush success */}
                  {firehoseFlushStatus === 'success' && (
                    <circle cx="35" cy="0" r="10" fill="none" stroke="#22c55e" strokeWidth="2" className="im-pulse" />
                  )}
                </g>

                {/* Routing pipelines network */}
                <g>
                  {/* SNS to Billing */}
                  <path d="M 50 85 L 130 38" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-fanout)"
                    className={fanoutIsStreaming ? 'flow-active-line' : ''} />

                  {/* SNS to Inventory */}
                  <path d="M 53 95 L 130 95" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-fanout)"
                    className={fanoutIsStreaming ? 'flow-active-line' : ''} />

                  {/* SNS to Firehose */}
                  <path d="M 50 105 L 130 150" fill="none" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arrow-fanout)"
                    className={fanoutIsStreaming ? 'flow-active-line' : ''} />

                  {/* Firehose to S3 Flush laser */}
                  <path d="M 230 155 L 290 110" fill="none" 
                    stroke={firehoseFlushStatus === 'flushing' ? '#22c55e' : '#3b82f6'} 
                    strokeWidth={firehoseFlushStatus === 'flushing' ? '3' : '1.5'} 
                    markerEnd="url(#arrow-fanout)"
                    className={firehoseFlushStatus === 'flushing' ? 'flow-active-line' : ''} 
                    strokeDasharray={firehoseFlushStatus === 'flushing' ? '4,2' : 'none'} 
                  />
                </g>
              </svg>
            </div>

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

              {/* Hashing & Shard Router SVG Diagram */}
              <svg width="100%" height="120" viewBox="0 0 380 120" className="im-svg-bg" style={{ border: '1.5px solid rgba(226, 232, 240, 0.85)', borderRadius: '14px', marginBottom: '16px' }}>
                <defs>
                  <linearGradient id="kinesisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="100%" stopColor="#bae6fd" />
                  </linearGradient>
                  <marker id="arrow-kinesis" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#0284c7" />
                  </marker>
                </defs>

                {/* Clickstream Browser client */}
                <g transform="translate(15, 35)">
                  <rect x="0" y="0" width="70" height="50" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="5" y="5" width="60" height="10" rx="2" fill="#f0f9ff" stroke="#bae6fd" />
                  <text x="35" y="12" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0369a1">CLICKSTREAM</text>
                  <circle cx="15" cy="30" r="3" fill="#0ea5e9" className="im-pulse" />
                  <text x="23" y="32.5" fontSize="7" fill="#475569" fontWeight="bold">App Clients</text>
                  <text x="35" y="44" textAnchor="middle" fontSize="6.5" fill="#94a3b8">{kinesisIngressRate} KB/s rate</text>
                </g>

                {/* MD5 Partition key router */}
                <g transform="translate(145, 35)">
                  <circle cx="25" cy="25" r="22" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                  <text x="25" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0369a1">MD5</text>
                  <text x="25" y="33" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0284c7">Router</text>
                  {kinesisThrottled && (
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#ef4444" strokeWidth="1.5" className="im-pulse" />
                  )}
                </g>

                {/* Dynamic shard channels in SVG */}
                <g>
                  {/* Channel to Shard 1 */}
                  <path d="M 192 50 L 275 30" fill="none" stroke={kinesisThrottled ? '#fca5a5' : '#0ea5e9'} strokeWidth={kinesisThrottled ? '1.5' : '2'} markerEnd="url(#arrow-kinesis)" className="flow-active-line" />
                  <rect x="280" y="12" width="80" height="22" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="320" y="25" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e293b">Shard Lane 1</text>

                  {/* Channel to Shard 2 */}
                  {kinesisShards >= 2 && (
                    <g>
                      <path d="M 192 60 L 275 60" fill="none" stroke={kinesisThrottled ? '#fca5a5' : '#0ea5e9'} strokeWidth={kinesisThrottled ? '1.5' : '2'} markerEnd="url(#arrow-kinesis)" className="flow-active-line" />
                      <rect x="280" y="49" width="80" height="22" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="320" y="62" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e293b">Shard Lane 2</text>
                    </g>
                  )}

                  {/* Channel to Shard 3 */}
                  {kinesisShards >= 3 && (
                    <g>
                      <path d="M 192 70 L 275 90" fill="none" stroke={kinesisThrottled ? '#fca5a5' : '#0ea5e9'} strokeWidth={kinesisThrottled ? '1.5' : '2'} markerEnd="url(#arrow-kinesis)" className="flow-active-line" />
                      <rect x="280" y="86" width="80" height="22" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="320" y="99" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e293b">Shard Lane 3</text>
                    </g>
                  )}
                </g>

                {/* Packet flow conduits */}
                <path d="M 85 60 L 145 60" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-kinesis)" className="flow-active-line" />
              </svg>

              {/* Shard visual lanes */}
              <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '14px', marginBottom: '16px' }}>
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
              
              <svg width="100%" height="240" viewBox="0 0 440 240" className="im-svg-bg" style={{ border: '1.5px solid rgba(226, 232, 240, 0.85)', borderRadius: '14px', marginBottom: '16px' }}>
                <defs>
                  {/* Glowing and lighting filters */}
                  <filter id="mqActiveGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Node Gradients */}
                  <linearGradient id="activeNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="activeNodeCap" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>

                  <linearGradient id="standbyNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                  <linearGradient id="standbyNodeCap" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>

                  <linearGradient id="failedNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="failedNodeCap" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fca5a5" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  <linearGradient id="efsChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>
                  
                  {/* Arrow markers */}
                  <marker id="mqArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#0d9488" />
                  </marker>
                  <marker id="mqArrowGrey" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1" />
                  </marker>
                  <marker id="mqArrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                  </marker>
                </defs>

                {/* VPC Boundary dashed line */}
                <rect x="8" y="8" width="424" height="224" rx="10" fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="424" y="19" textAnchor="end" fontSize="7" fontWeight="bold" fill="#64748b" letterSpacing="0.05em">VPC BOUNDARY (10.0.0.0/16)</text>

                {/* Subnet AZ-a Boundary */}
                <rect x="20" y="65" width="180" height="110" rx="10" 
                      fill="rgba(255, 255, 255, 0.5)" 
                      stroke={mqStatus === 'healthy' ? '#0d9488' : mqStatus === 'restored' ? '#38bdf8' : '#ef4444'} 
                      strokeWidth={mqStatus === 'healthy' || mqStatus === 'restored' ? '1.5' : '2'} 
                      style={{ transition: 'all 0.3s ease' }} />
                <text x="110" y="77" textAnchor="middle" fontSize="8" fontWeight="bold" fill={mqStatus === 'healthy' || mqStatus === 'restored' ? '#0f766e' : '#b91c1c'}>
                  US-EAST-1A (Subnet AZ-a)
                </text>

                {/* Subnet AZ-b Boundary */}
                <rect x="240" y="65" width="180" height="110" rx="10" 
                      fill="rgba(255, 255, 255, 0.5)" 
                      stroke={mqStatus === 'promoted' ? '#0d9488' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#eab308' : 'rgba(203, 213, 225, 0.85)'} 
                      strokeWidth={mqStatus === 'healthy' || mqStatus === 'restored' ? '1' : '1.8'} 
                      style={{ transition: 'all 0.3s ease' }} />
                <text x="330" y="77" textAnchor="middle" fontSize="8" fontWeight="bold" fill={mqStatus === 'promoted' ? '#0f766e' : mqStatus === 'healthy' ? '#475569' : '#854d0e'}>
                  US-EAST-1B (Subnet AZ-b)
                </text>

                {/* --- Primary Broker Cylinder AZ-a --- */}
                <g transform="translate(0, 0)">
                  {/* Cylinder Body */}
                  <path d="M 78 100 L 78 135 A 32 10 0 0 0 142 135 L 142 100 Z" 
                        fill={mqStatus === 'healthy' || mqStatus === 'restored' ? 'url(#activeNodeGrad)' : 'url(#failedNodeGrad)'} 
                        stroke={mqStatus === 'healthy' || mqStatus === 'restored' ? '#047857' : '#b91c1c'} 
                        strokeWidth="1.2" />
                  
                  {/* Cylinder Cap */}
                  <ellipse cx="110" cy="100" rx="32" ry="10" 
                           fill={mqStatus === 'healthy' || mqStatus === 'restored' ? 'url(#activeNodeCap)' : 'url(#failedNodeCap)'} 
                           stroke={mqStatus === 'healthy' || mqStatus === 'restored' ? '#047857' : '#b91c1c'} 
                           strokeWidth="1.2" />

                  {/* 3D Rack Lines for realism */}
                  <path d="M 78 112 A 32 10 0 0 0 142 112" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />
                  <path d="M 78 124 A 32 10 0 0 0 142 124" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />

                  {/* Glowing indicators */}
                  <circle cx="100" cy="112" r="2" fill={mqStatus === 'healthy' || mqStatus === 'restored' ? '#34d399' : '#fca5a5'} className={mqStatus === 'healthy' || mqStatus === 'restored' ? 'im-pulse' : ''} />
                  <circle cx="110" cy="112" r="2" fill={mqStatus === 'healthy' || mqStatus === 'restored' ? '#34d399' : '#fca5a5'} />
                  <circle cx="120" cy="112" r="2" fill={mqStatus === 'healthy' || mqStatus === 'restored' ? '#34d399' : '#fca5a5'} />
                  
                  {/* Labels on cylinder */}
                  <text x="110" y="125" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff" letterSpacing="0.03em">
                    {mqStatus === 'healthy' || mqStatus === 'restored' ? 'PRIMARY' : 'DOWN'}
                  </text>
                  
                  <text x="110" y="152" textAnchor="middle" fontSize="8" fontWeight="bold" fill={mqStatus === 'healthy' || mqStatus === 'restored' ? '#16a34a' : '#ef4444'}>
                    {mqStatus === 'healthy' || mqStatus === 'restored' ? 'ACTIVE 🟢' : 'OFFLINE ❌'}
                  </text>
                </g>

                {/* --- Standby Broker Cylinder AZ-b --- */}
                <g transform="translate(0, 0)">
                  {/* Cylinder Body */}
                  <path d="M 298 100 L 298 135 A 32 10 0 0 0 362 135 L 362 100 Z" 
                        fill={mqStatus === 'promoted' ? 'url(#activeNodeGrad)' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? 'url(#failedNodeGrad)' : 'url(#standbyNodeGrad)'} 
                        stroke={mqStatus === 'promoted' ? '#047857' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#d97706' : '#475569'} 
                        strokeWidth="1.2" 
                        style={{ fill: mqStatus === 'promoted' ? 'url(#activeNodeGrad)' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? 'rgba(251, 191, 36, 0.85)' : 'url(#standbyNodeGrad)' }} />
                  
                  {/* Cylinder Cap */}
                  <ellipse cx="330" cy="100" rx="32" ry="10" 
                           fill={mqStatus === 'promoted' ? 'url(#activeNodeCap)' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#fde047' : 'url(#standbyNodeCap)'} 
                           stroke={mqStatus === 'promoted' ? '#047857' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#d97706' : '#475569'} 
                           strokeWidth="1.2" />

                  {/* 3D Rack Lines */}
                  <path d="M 298 112 A 32 10 0 0 0 362 112" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />
                  <path d="M 298 124 A 32 10 0 0 0 362 124" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.2" />

                  {/* Glowing indicators */}
                  <circle cx="320" cy="112" r="2" fill={mqStatus === 'promoted' ? '#34d399' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#f59e0b' : '#94a3b8'} className={mqStatus === 'promoted' ? 'im-pulse' : ''} />
                  <circle cx="330" cy="112" r="2" fill={mqStatus === 'promoted' ? '#34d399' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#f59e0b' : '#94a3b8'} />
                  <circle cx="340" cy="112" r="2" fill={mqStatus === 'promoted' ? '#34d399' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#f59e0b' : '#94a3b8'} />

                  {/* Labels on cylinder */}
                  <text x="330" y="125" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#ffffff" letterSpacing="0.03em">
                    {mqStatus === 'promoted' ? 'PRIMARY' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? 'FAILING OVER' : 'STANDBY'}
                  </text>
                  
                  <text x="330" y="152" textAnchor="middle" fontSize="8" fontWeight="bold" fill={mqStatus === 'promoted' ? '#16a34a' : mqStatus === 'dns-swap' || mqStatus === 'fencing' ? '#d97706' : '#64748b'}>
                    {mqStatus === 'promoted' ? 'ACTIVE 👑 🟢' : mqStatus === 'dns-swap' ? 'DNS SWAP 🔄' : mqStatus === 'fencing' ? 'FENCING 🔒' : 'STANDBY 🔒'}
                  </text>
                </g>

                {/* Golden Crown above promoted node */}
                {mqStatus === 'promoted' && (
                  <g transform="translate(330, 78) scale(0.9)">
                    <text x="0" y="0" textAnchor="middle" fontSize="16" className="im-pulse" style={{ filter: 'drop-shadow(0 2px 5px rgba(234,179,8,0.4))' }}>👑</text>
                  </g>
                )}

                {/* --- Shared Amazon EFS Storage Chassis (bottom center) --- */}
                <g>
                  {/* 3D EFS Block background */}
                  <rect x="155" y="190" width="130" height="38" rx="6" fill="url(#efsChassisGrad)" stroke="#64748b" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 8px rgba(148,163,184,0.12))' }} />
                  
                  {/* Draw 4 server bays inside EFS */}
                  <rect x="162" y="195" width="22" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" />
                  <rect x="190" y="195" width="22" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" />
                  <rect x="228" y="195" width="22" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" />
                  <rect x="256" y="195" width="22" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" />
                  
                  {/* Status LEDs for EFS */}
                  <circle cx="166" cy="198" r="1" fill="#10b981" />
                  <circle cx="194" cy="198" r="1" fill="#10b981" />
                  <circle cx="232" cy="198" r="1" fill="#10b981" />
                  <circle cx="260" cy="198" r="1" fill="#10b981" />
                  
                  <text x="220" y="210" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">💾 Amazon EFS Store</text>
                  <text x="220" y="222" textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="600">
                    {mqStatus === 'fencing' ? '⚠️ LOCK ACQUIRED BY US-EAST-1B' : 'Synchronous ActiveMQ Mirror Lock'}
                  </text>
                </g>

                {/* --- JMS Client Gateway (top left) --- */}
                <g>
                  <rect x="20" y="18" width="90" height="32" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
                  <text x="65" y="32" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ffffff">💻 JMS Client</text>
                  <text x="65" y="44" textAnchor="middle" fontSize="6.5" fill="#94a3b8">failover:// transport</text>
                </g>

                {/* --- DNS CNAME Router (top center-right) --- */}
                <g>
                  <rect x="175" y="18" width="130" height="32" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))' }} />
                  <circle cx="188" cy="34" r="5" fill="#0ea5e9" className="im-pulse" />
                  <text x="188" y="36.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">R</text>
                  <text x="248" y="30" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#334155">DNS CNAME Router</text>
                  <text x="248" y="42" textAnchor="middle" fontSize="6.5" fill="#0284c7" fontWeight="bold" fontFamily="monospace">broker.mq.amazonaws.com</text>
                </g>

                {/* --- CONDUITS & NETWORKING ROUTING --- */}
                {/* JMS Client to DNS Router */}
                <path d="M 110 34 L 175 34" fill="none" stroke="#64748b" strokeWidth="1.8" strokeDasharray="3,3" />

                {/* DNS to Subnet AZ-a Conduit */}
                <path d="M 235 50 C 235 58, 110 58, 110 65" fill="none" 
                      stroke={mqStatus === 'healthy' || mqStatus === 'restored' ? '#10b981' : mqStatus === 'failed' ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth={mqStatus === 'healthy' || mqStatus === 'restored' ? '2.5' : '1.5'} 
                      strokeDasharray={mqStatus === 'healthy' || mqStatus === 'restored' ? '5,4' : 'none'} 
                      style={{ transition: 'all 0.3s ease' }}>
                  {(mqStatus === 'healthy' || mqStatus === 'restored') && (
                    <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
                  )}
                </path>

                {/* Red Outage X marker on AZ-a route if failed */}
                {mqStatus === 'failed' && (
                  <g transform="translate(160, 52)">
                    <circle cx="0" cy="0" r="5" fill="#ef4444" />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">×</text>
                  </g>
                )}

                {/* DNS to Subnet AZ-b Conduit */}
                <path d="M 235 50 C 235 58, 330 58, 330 65" fill="none" 
                      stroke={mqStatus === 'promoted' ? '#10b981' : mqStatus === 'dns-swap' ? '#eab308' : '#cbd5e1'} 
                      strokeWidth={mqStatus === 'promoted' ? '2.5' : '1.5'} 
                      strokeDasharray={mqStatus === 'promoted' ? '5,4' : mqStatus === 'dns-swap' ? '3,3' : 'none'} 
                      style={{ transition: 'all 0.3s ease' }}>
                  {mqStatus === 'promoted' && (
                    <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
                  )}
                </path>

                {/* --- Replication & Shared backend links --- */}
                {/* AZ-a broker to EFS */}
                <path d="M 110 135 L 175 190" fill="none" 
                      stroke={mqStatus === 'healthy' || mqStatus === 'restored' ? '#0d9488' : '#cbd5e1'} 
                      strokeWidth="2" 
                      strokeDasharray={mqStatus === 'healthy' || mqStatus === 'restored' ? '4,4' : 'none'} />
                
                {/* AZ-b broker to EFS */}
                <path d="M 330 135 L 265 190" fill="none" 
                      stroke={mqStatus === 'promoted' ? '#0d9488' : mqStatus === 'fencing' ? '#eab308' : '#cbd5e1'} 
                      strokeWidth="2" 
                      strokeDasharray={mqStatus === 'promoted' || mqStatus === 'fencing' ? '4,4' : 'none'} />

                {/* Fencing visual lock pulse at EFS connection */}
                {mqStatus === 'fencing' && (
                  <g transform="translate(295, 160)">
                    <circle cx="0" cy="0" r="8" fill="#eab308" className="im-pulse" />
                    <text x="0" y="3" textAnchor="middle" fontSize="8">🔒</text>
                  </g>
                )}
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
              <button 
                className={`im-selector-card ${comparisonUseCase === 'payment' ? 'im-selected-payment' : ''}`} 
                onClick={() => setComparisonUseCase(comparisonUseCase === 'payment' ? 'none' : 'payment')}
              >
                <span style={{ fontSize: '18px' }}>💳</span>
                <div>
                  <div style={{ fontWeight: 750, fontSize: '12.5px', color: comparisonUseCase === 'payment' ? '#c2410c' : '#1e293b' }}>Decoupled Payments</div>
                  <div style={{ fontSize: '10.5px', color: comparisonUseCase === 'payment' ? '#ea580c' : '#64748b', fontWeight: 500, marginTop: '2px' }}>Order processing & billing queues</div>
                </div>
              </button>
              
              <button 
                className={`im-selector-card ${comparisonUseCase === 'newsletter' ? 'im-selected-newsletter' : ''}`} 
                onClick={() => setComparisonUseCase(comparisonUseCase === 'newsletter' ? 'none' : 'newsletter')}
              >
                <span style={{ fontSize: '18px' }}>📢</span>
                <div>
                  <div style={{ fontWeight: 750, fontSize: '12.5px', color: comparisonUseCase === 'newsletter' ? '#6b21a8' : '#1e293b' }}>Broadcast Signups</div>
                  <div style={{ fontSize: '10.5px', color: comparisonUseCase === 'newsletter' ? '#7e22ce' : '#64748b', fontWeight: 500, marginTop: '2px' }}>Multi-consumer fanout notifications</div>
                </div>
              </button>
              
              <button 
                className={`im-selector-card ${comparisonUseCase === 'iot' ? 'im-selected-iot' : ''}`} 
                onClick={() => setComparisonUseCase(comparisonUseCase === 'iot' ? 'none' : 'iot')}
              >
                <span style={{ fontSize: '18px' }}>🌊</span>
                <div>
                  <div style={{ fontWeight: 750, fontSize: '12.5px', color: comparisonUseCase === 'iot' ? '#0369a1' : '#1e293b' }}>High-Velocity IoT</div>
                  <div style={{ fontSize: '10.5px', color: comparisonUseCase === 'iot' ? '#0284c7' : '#64748b', fontWeight: 500, marginTop: '2px' }}>Clickstreams & real-time sensor ingest</div>
                </div>
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
                <tr className={comparisonUseCase === 'payment' || comparisonUseCase === 'iot' ? 'im-matrix-row-highlight' : ''} style={{ transition: 'all 0.2s ease' }}>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Retrieval Protocol</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffbeb' : '#ffffff' }}>
                    <strong>Pull Model</strong>: Consumers actively poll to fetch and lock messages.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#ffffff' }}>
                    <strong>Push Model</strong>: SNS pushes message duplicates instantly to subscribers.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#ffffff' }}>
                    <strong>Offset Pull Model</strong>: Multiple consumer fleets pull and track custom offsets.
                  </td>
                </tr>
                <tr className={comparisonUseCase === 'newsletter' ? 'im-matrix-row-highlight' : ''} style={{ transition: 'all 0.2s ease' }}>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Fanout Capability</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffbeb' : '#ffffff' }}>
                    <strong>1-to-1 Delivery</strong>: Only one consumer locks and processes a message.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#ffffff' }}>
                    <strong>1-to-Many Fanout</strong>: Broadcasts identical payloads up to 12.5M subscribers.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#ffffff' }}>
                    <strong>Replay Fanout</strong>: Multiple consumer groups read identical stream concurrently.
                  </td>
                </tr>
                <tr className={comparisonUseCase === 'iot' || comparisonUseCase === 'payment' ? 'im-matrix-row-highlight' : ''} style={{ transition: 'all 0.2s ease' }}>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Data Persistence</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffbeb' : '#ffffff' }}>
                    <strong>High (14 Days)</strong>: Durable storage buffer holds uncompleted tasks.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#ffffff' }}>
                    <strong>Transient (0 Days)</strong>: Messages deleted instantly on push deliveries.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#ffffff' }}>
                    <strong>Log Streams (365 Days)</strong>: Persistent sequential stream logs are preserved.
                  </td>
                </tr>
                <tr className={comparisonUseCase === 'payment' || comparisonUseCase === 'iot' ? 'im-matrix-row-highlight' : ''} style={{ transition: 'all 0.2s ease' }}>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Ordering Guarantee</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffbeb' : '#ffffff' }}>
                    Strict sequence in <strong>FIFO mode</strong> using Message Group IDs.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#ffffff' }}>
                    FIFO Topic guarantees order sequence to SQS FIFO subscriptions.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#ffffff' }}>
                    Strict shard partition key order sequencing.
                  </td>
                </tr>
                <tr className={comparisonUseCase === 'iot' ? 'im-matrix-row-highlight' : ''} style={{ transition: 'all 0.2s ease' }}>
                  <td className="im-matrix-cell" style={{ fontWeight: 'bold' }}>Scaling Trigger</td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'payment' ? '#fffbeb' : '#ffffff' }}>
                    <strong>Queue Depth</strong>: CloudWatch scales ASG EC2 fleets on message count.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'newsletter' ? '#faf5ff' : '#ffffff' }}>
                    Serverless auto-scale based on volume push threads.
                  </td>
                  <td className="im-matrix-cell" style={{ background: comparisonUseCase === 'iot' ? '#f0f9ff' : '#ffffff' }}>
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
