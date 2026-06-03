import { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Server,
  Database,
  Cpu,
  Globe,
  Shield,
  Sliders,
  Clock,
  Layers,
  Settings,
  Play,
  Square,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle,
  TrendingUp,
  HardDrive,
  Info,
  Lock,
  UserCheck,
  Network
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 
  | 'intro' 
  | 'lambda-core' 
  | 'concurrency-limits' 
  | 'edge-compute' 
  | 'dynamodb' 
  | 'api-gateway' 
  | 'cognito' 
  | 'serverless-architectures' 
  | 'db-integration' 
  | 'simulation';

interface LambdaContainer {
  id: string;
  status: 'PROVISIONING' | 'WARM' | 'ACTIVE' | 'IDLE' | 'THROTTLED';
  createdTime: number;
  lastUsedTime: number;
  requestCount: number;
  isProvisioned: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  type: 'http' | 'sqs' | 'db' | 'cold-start' | 'throttled';
  state: 'to_api' | 'to_lambda' | 'to_db' | 'to_sqs' | 'done';
  containerId?: string;
}

export default function ServerlessVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

  // ==========================================
  // TAB 1 STATE: AWS Serverless Catalog
  // ==========================================
  const [selectedService, setSelectedService] = useState<string>('lambda');

  const serverlessServices = [
    {
      id: 'lambda',
      name: 'AWS Lambda',
      category: 'Compute',
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      desc: 'Run code in response to events without provisioning or managing servers. Scales automatically from zero to thousands of requests.',
      whyIntegrates: 'Serves as the central glue / compute block. Triggered asynchronously (S3, EventBridge, SQS), synchronously (API Gateway, ALB), or via polling (DynamoDB Streams, Kinesis).',
      limits: 'Timeout: 15 mins. Temp space (/tmp): 512MB to 10GB. Memory: 128MB to 10GB (CPU scales proportionally). Max payload: 6MB (sync), 256KB (async).',
      pricing: 'Pay only for what you use: based on the number of requests (per 1M) and execution duration (GB-seconds, billed in 1ms increments).'
    },
    {
      id: 'fargate',
      name: 'AWS Fargate',
      category: 'Compute',
      icon: <Server className="w-5 h-5 text-orange-500" />,
      desc: 'Serverless compute engine for containers. Works with ECS (Elastic Container Service) and EKS (Elastic Kubernetes Service).',
      whyIntegrates: 'Allows running long-lived containerized workloads or heavy data processing tasks that exceed Lambda\'s 15-minute execution limit.',
      limits: 'No hard timeout. Up to 4 vCPUs and 30 GB memory per task (Fargate standard limits can be increased). Custom ephemeral storage up to 200 GB.',
      pricing: 'Billed per vCPU and GB of memory configured per second, starting from the time image download begins until the task terminates.'
    },
    {
      id: 'apigateway',
      name: 'Amazon API Gateway',
      category: 'Integration & API',
      icon: <Globe className="w-5 h-5 text-pink-500" />,
      desc: 'Fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure HTTP, REST, and WebSocket APIs at scale.',
      whyIntegrates: 'Acts as the front door for Lambda compute, translating public HTTP requests into JSON event payloads and routing them securely.',
      limits: 'Payload size: 10MB. Integration timeout: 29s. Default request rate: 10,000 requests per second (RPS) per account per region.',
      pricing: 'Billed per million API calls received, plus data transfer out (in GB).'
    },
    {
      id: 'dynamodb',
      name: 'Amazon DynamoDB',
      category: 'Database',
      icon: <Database className="w-5 h-5 text-blue-500" />,
      desc: 'Fully managed, serverless NoSQL database designed to run high-performance applications at any scale with single-digit millisecond latency.',
      whyIntegrates: 'Offers rapid state persistence with zero-connection overhead (via HTTP-based HTTPS endpoints) perfect for fast scaling Lambda functions.',
      limits: 'Item size limit: 400KB. Infinite storage. Partition throughput bounds managed dynamically.',
      pricing: 'On-Demand capacity mode (billed per read/write requests) or Provisioned capacity mode (with auto-scaling).'
    },
    {
      id: 'eventbridge',
      name: 'Amazon EventBridge',
      category: 'Integration & API',
      icon: <RefreshCw className="w-5 h-5 text-indigo-500" />,
      desc: 'Serverless event bus that lets you receive, filter, transform, route, and deliver events to trigger targets like Lambda, Step Functions, or HTTP endpoints.',
      whyIntegrates: 'Decouples microservices using event-driven architectures. Integrates natively with SaaS applications and standard AWS resources.',
      limits: 'Event payload limit: 256KB. Standard event buses route thousands of events per second dynamically.',
      pricing: 'Billed per million events published to your custom/SaaS event buses. AWS service-to-service events are free.'
    },
    {
      id: 'sqs',
      name: 'Amazon SQS',
      category: 'Messaging',
      icon: <Sliders className="w-5 h-5 text-yellow-500" />,
      desc: 'Fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications.',
      whyIntegrates: 'Acts as an asynchronous buffer. Lambda polls the queue automatically, scaling up concurrent invocations depending on message depth.',
      limits: 'Message size: 256KB. Infinite throughput for Standard queues; FIFO queues support up to 3,000 messages/sec with batching.',
      pricing: 'Billed per million SQS requests (sends, receives, deletes).'
    },
    {
      id: 'sns',
      name: 'Amazon SNS',
      category: 'Messaging',
      icon: <Activity className="w-5 h-5 text-red-500" />,
      desc: 'Fully managed Pub/Sub messaging service for both mass-delivery messages to people and serverless high-throughput machine-to-machine integration.',
      whyIntegrates: 'Enables rapid event fan-out. A single event published to an SNS topic can trigger multiple concurrent Lambdas and SQS queues.',
      limits: 'Message size: 256KB. High throughput publisher pipelines supporting millions of topics dynamically.',
      pricing: 'Billed per million notifications published, with varying charges based on delivery type (Lambda, SQS, SMS, Email).'
    },
    {
      id: 'stepfunctions',
      name: 'AWS Step Functions',
      category: 'Compute & Orchestration',
      icon: <Layers className="w-5 h-5 text-teal-500" />,
      desc: 'Visual workflow orchestrator to sequence multiple Lambda functions, AWS services, and external APIs into robust serverless state machines.',
      whyIntegrates: 'Solves the "Lambda chaining" anti-pattern. Manages retries, error handling, visual checkpoints, and complex parallel forks.',
      limits: 'Execution history size limit: 25,000 events. Max execution time: 1 year.',
      pricing: 'Standard workflows: billed per state transition. Express workflows: billed per request and execution duration.'
    },
    {
      id: 'appsync',
      name: 'AWS AppSync',
      category: 'Integration & API',
      icon: <Network className="w-5 h-5 text-cyan-500" />,
      desc: 'Serverless GraphQL and Pub/Sub API service that simplifies building applications by letting you connect securely to data sources like DynamoDB or Lambda.',
      whyIntegrates: 'Resolves complex GraphQL schema queries in parallel using Lambda resolvers, while managing real-time WebSocket subscriptions natively.',
      limits: 'GraphQL query complexity limits and custom depth limits configurable per API.',
      pricing: 'Billed per million query/mutation operations, and per billion real-time update minutes.'
    },
    {
      id: 's3',
      name: 'Amazon S3',
      category: 'Storage',
      icon: <HardDrive className="w-5 h-5 text-emerald-500" />,
      desc: 'Object storage built to store and retrieve any amount of data from anywhere. The foundation of serverless static sites and file storage pipelines.',
      whyIntegrates: 'Generates ObjectCreated/ObjectRemoved events that directly invoke Lambda, enabling automated processing pipelines.',
      limits: 'Individual object size limit: 5TB. Unlimited total storage capacity.',
      pricing: 'Billed per GB of data stored per month, plus API request charges (PUT, GET, LIST) and data transfer fees.'
    }
  ];

  // ==========================================
  // TAB 2 STATE: S3 Thumbnail Pipeline
  // ==========================================
  const [pipelineState, setPipelineState] = useState<'idle' | 'uploading' | 's3-event' | 'lambda-init' | 'lambda-processing' | 's3-upload-thumb' | 'db-metadata' | 'completed'>('idle');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [coldStartActive, setColdStartActive] = useState<boolean>(true);

  const addPipelineLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setPipelineLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const runThumbnailPipeline = async () => {
    if (pipelineState !== 'idle') return;

    setPipelineLogs([]);
    setPipelineState('uploading');
    addPipelineLog('🚀 Triggered: User uploads picture "vacation_raw.jpg" to raw S3 Bucket (uploads-bucket).');

    // Step 1: Uploading to S3
    await new Promise((r) => setTimeout(r, 1200));
    setPipelineState('s3-event');
    addPipelineLog('📂 S3 Event: File successfully saved. S3 triggers an asynchronous ObjectCreated event mapping.');

    // Step 2: S3 Event triggers Lambda
    await new Promise((r) => setTimeout(r, 1200));
    setPipelineState('lambda-init');
    addPipelineLog(
      coldStartActive
        ? '⚡ Lambda Compute: Cold Start! Spawning microVM execution environment, downloading code zip, and initializing runtime (~1.2s delay).'
        : '⚡ Lambda Compute: Warm Container Reuse! Execution container is already warm. Bypassing microVM initialization phase (0ms delay).'
    );

    // Delay based on Cold Start
    await new Promise((r) => setTimeout(r, coldStartActive ? 1800 : 400));
    setPipelineState('lambda-processing');
    addPipelineLog('⚙️ Lambda Execution: Invoking handler function. Downloading "vacation_raw.jpg" from S3 into /tmp and resizing via Sharp JS library.');

    // Step 3: Resizing completed, save optimized version back to S3
    await new Promise((r) => setTimeout(r, 1200));
    setPipelineState('s3-upload-thumb');
    addPipelineLog('📤 Output S3: Lambda writes resized file "vacation_thumbnail.jpg" to target S3 bucket (optimized-bucket).');

    // Step 4: Save metadata to DynamoDB
    await new Promise((r) => setTimeout(r, 1200));
    setPipelineState('db-metadata');
    addPipelineLog('💾 State Persist: Lambda calls DynamoDB PutItem to register dimensions (150x150), size (4KB), and optimization timestamp.');

    // Step 5: Completed
    await new Promise((r) => setTimeout(r, 1200));
    setPipelineState('completed');
    addPipelineLog('✅ Success: Serverless Thumbnail processing successfully completed. Lambda execution container is kept alive as warm for subsequent requests.');
  };

  const resetPipeline = () => {
    setPipelineState('idle');
    setPipelineLogs([]);
  };

  // ==========================================
  // TAB 3 STATE: Concurrency & SnapStart
  // ==========================================
  const [concurrencyTraffic, setConcurrencyTraffic] = useState<number>(350); // RPS
  const [reservedLimit, setReservedLimit] = useState<number>(500);
  const [provisionedWarmed, setProvisionedWarmed] = useState<boolean>(false);
  const [snapStartEnabled, setSnapStartEnabled] = useState<boolean>(false);

  // Computations
  const totalInvocations = concurrencyTraffic;
  const activeConcurrencyNeeded = Math.round(concurrencyTraffic * 1.2); // assumed avg duration of 1.2 seconds
  const isThrottled = activeConcurrencyNeeded > reservedLimit;
  const throttlingCount = isThrottled ? Math.max(0, activeConcurrencyNeeded - reservedLimit) : 0;
  const successfulCount = isThrottled ? reservedLimit : activeConcurrencyNeeded;

  // Let's compute average latency based on configurations
  // Standard cold start probability = 15% under load
  let avgLatencyMs = 200; // Base handler execution
  if (!provisionedWarmed) {
    if (snapStartEnabled) {
      avgLatencyMs += 150; // SnapStart reduces restore down to 150ms
    } else {
      avgLatencyMs += 1200 * 0.15; // 15% probability of 1.2s cold start latency overhead
    }
  }

  // ==========================================
  // TAB 4 STATE: Edge Compute Comparison
  // ==========================================
  const [selectedEdgeHook, setSelectedEdgeHook] = useState<'viewer-request' | 'origin-request' | 'origin-response' | 'viewer-response'>('viewer-request');
  const [edgeTechView, setEdgeTechView] = useState<'cf-functions' | 'lambda-edge'>('cf-functions');

  const edgeHookDetails = {
    'viewer-request': {
      title: 'Viewer Request Hook',
      trigger: 'Executes immediately when CloudFront receives a request from a client, before checking the cache.',
      cff: '⚡ Best fit! Extremely low latency (~1ms overhead). Great for URL rewrites, HTTP redirects (e.g., HTTP to HTTPS), header modifications, or simple authorization checks.',
      le: '⚠️ Supported, but carries larger latency overhead. Use ONLY if you need to query an external REST API, pull heavy configuration from DynamoDB, or parse cookie authorization using rich NPM packages.'
    },
    'origin-request': {
      title: 'Origin Request Hook',
      trigger: 'Executes ONLY on cache misses, right before CloudFront forwards the request to your backend Origin (S3/ALB).',
      cff: '❌ Not Supported. CloudFront Functions cannot execute at the origin request hook because they are fully isolated to client edge caching operations.',
      le: '⚡ Best fit! Executes infrequently (only on cache miss). Perfect for content customization, A/B testing variations, directory path rewrites (S3 folder mappings), or dynamic image optimization on-the-fly.'
    },
    'origin-response': {
      title: 'Origin Response Hook',
      trigger: 'Executes ONLY on cache misses, immediately after CloudFront receives a response from the backend Origin, before storing it in cache.',
      cff: '❌ Not Supported. Only Lambda@Edge can run on the Origin Response path.',
      le: '⚡ Best fit! Allows modifying headers returned from the origin (e.g., inserting security headers like CSP, X-Frame-Options), adjusting Cache-Control parameters dynamically, or rewriting response body contents.'
    },
    'viewer-response': {
      title: 'Viewer Response Hook',
      trigger: 'Executes right before CloudFront returns the response back to the client, whether it was served from cache or fetched from origin.',
      cff: '⚡ Best fit! High performance, low-cost header addition (adding CORS headers, security flags) or inserting basic analytics scripts in flight.',
      le: '⚠️ Supported, but not recommended for lightweight edits due to the added cold start and execution latency that affects every single cached file returned.'
    }
  };

  // ==========================================
  // TAB 5 STATE: Amazon DynamoDB Deep Dive [NEW]
  // ==========================================
  const [ddbCapacityMode, setDdbCapacityMode] = useState<'provisioned' | 'on-demand'>('provisioned');
  const [ddbRCU, setDdbRCU] = useState<number>(300);
  const [ddbWCU, setDdbWCU] = useState<number>(150);
  const [daxSimState, setDaxSimState] = useState<'idle' | 'hit' | 'miss'>('idle');
  const [daxLogs, setDaxLogs] = useState<string[]>([]);
  const [ddbStreamSource, setDdbStreamSource] = useState<'ddb-streams' | 'kinesis-streams'>('ddb-streams');
  const [ddbActiveRegion, setDdbActiveRegion] = useState<'us-east-1' | 'eu-west-1'>('us-east-1');
  const [globalTableSyncState, setGlobalTableSyncState] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [globalTableLogs, setGlobalTableLogs] = useState<string[]>([]);

  const addDaxLog = (msg: string) => {
    setDaxLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const addGlobalTableLog = (msg: string) => {
    setGlobalTableLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const triggerDaxSim = async (type: 'hit' | 'miss') => {
    if (daxSimState !== 'idle') return;
    setDaxSimState(type);
    setDaxLogs([]);

    if (type === 'hit') {
      addDaxLog('🔍 Fetching User Profile (UserID: usr_4981) from Application...');
      await new Promise(r => setTimeout(r, 600));
      addDaxLog('⚡ Query intercepted by DAX cache cluster.');
      await new Promise(r => setTimeout(r, 600));
      addDaxLog('🟢 DAX Cache Hit! Returning item instantly from memory (Latency: 0.18 ms).');
      await new Promise(r => setTimeout(r, 400));
      setDaxSimState('idle');
    } else {
      addDaxLog('🔍 Fetching User Profile (UserID: usr_4981) from Application...');
      await new Promise(r => setTimeout(r, 600));
      addDaxLog('⚡ Query checks DAX cache cluster.');
      await new Promise(r => setTimeout(r, 600));
      addDaxLog('🔴 DAX Cache Miss! Fetching profile from primary DynamoDB table SSD.');
      await new Promise(r => setTimeout(r, 600));
      addDaxLog('🗄️ DynamoDB returns item (Latency: 4.8 ms). Application updates DAX memory cache.');
      await new Promise(r => setTimeout(r, 400));
      setDaxSimState('idle');
    }
  };

  const runGlobalTableWrite = async () => {
    if (globalTableSyncState !== 'idle') return;
    setGlobalTableSyncState('syncing');
    setGlobalTableLogs([]);

    addGlobalTableLog(`✍️ Client initiates write operation in region: ${ddbActiveRegion.toUpperCase()}.`);
    await new Promise(r => setTimeout(r, 1000));
    
    const targetRegion = ddbActiveRegion === 'us-east-1' ? 'eu-west-1' : 'us-east-1';
    addGlobalTableLog(`💾 Local write completed in ${ddbActiveRegion.toUpperCase()}. DynamoDB Stream captures data mutation.`);
    await new Promise(r => setTimeout(r, 1200));

    addGlobalTableLog(`🌐 Active-Active Replication: Multi-region connector synchronizing payload securely to ${targetRegion.toUpperCase()}.`);
    await new Promise(r => setTimeout(r, 1200));

    addGlobalTableLog(`✅ Synced: Region ${targetRegion.toUpperCase()} successfully written. Data is identical globally (Conflict resolution: Last Writer Wins).`);
    setGlobalTableSyncState('completed');
    
    setTimeout(() => {
      setGlobalTableSyncState('idle');
    }, 2000);
  };

  // ==========================================
  // TAB 6 STATE: Amazon API Gateway & Step Functions [NEW]
  // ==========================================
  const [apigwEndpointType, setApigwEndpointType] = useState<'edge' | 'regional' | 'private'>('edge');
  const [apigwAuthType, setApigwAuthType] = useState<'cognito' | 'lambda-auth' | 'iam'>('cognito');
  const [apigwIntegrationType, setApigwIntegrationType] = useState<'lambda-proxy' | 'direct-kinesis'>('lambda-proxy');
  const [stepFunctionState, setStepFunctionState] = useState<'idle' | 'validate' | 'charge' | 'ship' | 'completed' | 'failed'>('idle');
  const [stepFunctionLogs, setStepFunctionLogs] = useState<string[]>([]);

  const addSfLog = (msg: string) => {
    setStepFunctionLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const runStepFunction = async (shouldFail = false) => {
    if (stepFunctionState !== 'idle') return;
    setStepFunctionLogs([]);
    setStepFunctionState('validate');
    addSfLog('🚀 Step Functions State Machine Triggered: Execution ID: order-processing-6a9b.');

    await new Promise(r => setTimeout(r, 1000));
    addSfLog('📥 Step 1: ValidateOrder - Checking stock levels for Item ID: 9481. Status: Validated.');
    setStepFunctionState('charge');

    await new Promise(r => setTimeout(r, 1200));
    if (shouldFail) {
      addSfLog('❌ Step 2 Error: ChargeAccount - Customer Visa card was declined (Insufficient funds).');
      addSfLog('↩️ State Machine compensating actions triggered: Rollback order status to CANCELLED.');
      setStepFunctionState('failed');
      await new Promise(r => setTimeout(r, 1000));
      addSfLog('🛑 Execution Completed: Failed (Graceful transaction compensation).');
    } else {
      addSfLog('💳 Step 2 Success: ChargeAccount - Processed payment of $49.00 via Stripe API.');
      setStepFunctionState('ship');
      
      await new Promise(r => setTimeout(r, 1200));
      addSfLog('📦 Step 3: ShipItem - Generating postage label and dispatching event to Amazon SNS notification.');
      setStepFunctionState('completed');
      
      await new Promise(r => setTimeout(r, 1000));
      addSfLog('✅ Execution Completed: Succeeded.');
    }
  };

  // ==========================================
  // TAB 7 STATE: Amazon Cognito Security [NEW]
  // ==========================================
  const [cognitoFlowStep, setCognitoFlowStep] = useState<number>(0);
  const [cognitoLogs, setCognitoLogs] = useState<string[]>([]);
  const [cognitoTriggerHover, setCognitoTriggerHover] = useState<string | null>(null);

  const addCognitoLog = (msg: string) => {
    setCognitoLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const advanceCognitoFlow = async () => {
    if (cognitoFlowStep === 0) {
      setCognitoFlowStep(1);
      addCognitoLog('🔑 User inputs credentials. Authenticating with Cognito User Pool (CUP) via Hosted UI.');
      await new Promise(r => setTimeout(r, 800));
      addCognitoLog('✅ CUP Success: User credentials verified. User Pool returns cryptographic JWT tokens (ID Token, Access Token, Refresh Token).');
    } else if (cognitoFlowStep === 1) {
      setCognitoFlowStep(2);
      addCognitoLog('🌐 Exchanging CUP ID Token with Cognito Identity Pool (CIP) for Federated Credentials.');
      await new Promise(r => setTimeout(r, 800));
      addCognitoLog('🔄 Identity Pool parses JWT, validates signatures, maps user attributes to the configured IAM Role, and calls AWS STS (Security Token Service).');
    } else if (cognitoFlowStep === 2) {
      setCognitoFlowStep(3);
      addCognitoLog('🔑 AWS STS returns temporary AWS credentials (Access Key, Secret Key, Session Token) valid for 1 hour.');
      await new Promise(r => setTimeout(r, 600));
      addCognitoLog('🪣 Client makes direct, signed SDK call (SigV4) to fetch user\'s private object from secure Amazon S3 Bucket.');
    }
  };

  const resetCognitoFlow = () => {
    setCognitoFlowStep(0);
    setCognitoLogs([]);
  };

  // ==========================================
  // TAB 10 STATE: Serverless Architectures (Blog Web, IoT, and SAGA) [NEW]
  // ==========================================
  const [activeArchTab, setActiveArchTab] = useState<'blog-web' | 'iot-pipeline' | 'order-saga'>('blog-web');
  const [archFlowState, setArchFlowState] = useState<'idle' | 'static-fetch' | 'dynamic-crud' | 'media-upload' | 'iot-stream' | 'saga-run' | 'saga-fail'>('idle');
  const [archLogs, setArchLogs] = useState<string[]>([]);

  const addArchLog = (msg: string) => {
    setArchLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const runStaticFetchSim = async () => {
    if (archFlowState !== 'idle') return;
    setArchFlowState('static-fetch');
    setArchLogs([]);
    addArchLog('🚀 Static Request: Client requests dynamic blog post page structure (index.html & scripts.js).');
    await new Promise(r => setTimeout(r, 1000));
    addArchLog('🌐 Edge CDN routing: Request hits Amazon CloudFront Global CDN Edge Location.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('🔒 OAC Authorization check: CloudFront signs the request securely using Origin Access Control (OAC).');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('🪣 S3 Read: Amazon S3 static bucket verifies CloudFront Signature against Bucket Policy. Authorization Successful.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('🟢 Delivery: S3 returns files. CloudFront caches assets globally and delivers them to the user (Latency: ~12ms).');
    setArchFlowState('idle');
  };

  const runDynamicCrudSim = async () => {
    if (archFlowState !== 'idle') return;
    setArchFlowState('dynamic-crud');
    setArchLogs([]);
    addArchLog('🚀 Dynamic CRUD Action: Client submits a new blog post comment (REST HTTP POST).');
    await new Promise(r => setTimeout(r, 1000));
    addArchLog('📡 API Gateway: Resolves HTTP request, validates CORS headers, and synchronously invokes Lambda compute.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('⚡ Lambda Handler: Bootstraps. Invokes write operations. First queries DAX in-memory cache to verify locks.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('💾 Database Write: Lambda saves comment record to global DynamoDB Table SSD (Latency: ~5ms).');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('⚡ Event Stream Processing: DynamoDB Streams captures record mutation. Triggers asynchronous background notification Lambda.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('📨 Mail Dispatch: Background Lambda parses stream record and calls Amazon SES to email the blog owner.');
    setArchFlowState('idle');
  };

  const runMediaUploadSim = async () => {
    if (archFlowState !== 'idle') return;
    setArchFlowState('media-upload');
    setArchLogs([]);
    addArchLog('🚀 Media Upload: Client uploads "photo_highres.jpg" (S3 Transfer Acceleration endpoint).');
    await new Promise(r => setTimeout(r, 1000));
    addArchLog('🌐 Network Acceleration: Upload travels over optimized edge POP fibers directly into S3 Raw Bucket.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('📂 S3 Event Trigger: raw-bucket uploads complete. Emits asynchronous ObjectCreated event mapping.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('⚙️ Resizer Lambda: Invoked. Downloads raw-bucket JPEG into /tmp, resizes to thumbnail, and saves to optimized-bucket.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('✉️ Event Fan-out: Resizer Lambda publishes status metadata payload concurrently to SQS Queue and SNS Topic.');
    setArchFlowState('idle');
  };

  const runIotPipelineSim = async () => {
    if (archFlowState !== 'idle') return;
    setArchFlowState('iot-stream');
    setArchLogs([]);
    addArchLog('🚀 IoT Telemetry: Smart thermostat registers telemetry payload: {temp: 72.4F, power: 120W}.');
    await new Promise(r => setTimeout(r, 1000));
    addArchLog('📡 AWS IoT Core: Receives MQTT message on topic: device/telemetry. Matches Rules Engine mapping.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('🔥 Kinesis Buffer: Rules Engine pipes payload into high-throughput Kinesis Data Stream (Sharded).');
    await new Promise(r => setTimeout(r, 1250));
    addArchLog('⚡ Real-time Lambda consumer: Polls shards concurrently, runs anomaly filters, and writes telemetry logs to DynamoDB.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('💾 Firehose Analytics: Kinesis Firehose reads stream, buffers payload, compresses it to Parquet, and saves to S3 Data Lake.');
    setArchFlowState('idle');
  };

  const runSagaOrderSim = async (failSaga = false) => {
    if (archFlowState !== 'idle') return;
    setArchFlowState(failSaga ? 'saga-fail' : 'saga-run');
    setArchLogs([]);
    addArchLog('🚀 Saga Orchestration: Client requests checkout (HTTP Order API).');
    await new Promise(r => setTimeout(r, 1000));
    addArchLog('🔄 Step Functions state machine: Starts order execution sequence order-saga-1044.');
    await new Promise(r => setTimeout(r, 1200));
    addArchLog('📥 Step 1: ValidateOrder: Reserves stock (SKU: laptop-x1) in DynamoDB. Success.');
    await new Promise(r => setTimeout(r, 1200));
    if (failSaga) {
      addArchLog('❌ Step 2: ChargePayment: Card authorization failed. Triggering failed compensation pipeline.');
      await new Promise(r => setTimeout(r, 1200));
      addArchLog('↩️ Compensation: Rollback stock holds for SKU: laptop-x1 in DynamoDB. Status reset to Available.');
      await new Promise(r => setTimeout(r, 1000));
      addArchLog('🛑 Saga Finalized: Order cancelled gracefully with zero data inconsistency.');
    } else {
      addArchLog('💳 Step 2: ChargePayment: Processed stripe charge. Success.');
      await new Promise(r => setTimeout(r, 1200));
      addArchLog('📦 Step 3: DispatchDelivery: Queues order for warehouse dispatch via SQS. State Machine Complete.');
    }
    setArchFlowState('idle');
  };

  // ==========================================
  // TAB 8 STATE: Secure Database Networking (prev Tab 5)
  // ==========================================
  const [dbScenario, setDbScenario] = useState<'vpc-basic' | 'rds-proxy' | 'aurora-trigger'>('vpc-basic');

  // ==========================================
  // TAB 9 STATE: Interactive Simulation (prev Tab 6)
  // ==========================================
  const [simTrafficLevel, setSimTrafficLevel] = useState<'low' | 'normal' | 'surge'>('normal');
  const [simRdsProxyEnabled, setSimRdsProxyEnabled] = useState<boolean>(true);
  const [simProvConcurrency, setSimProvConcurrency] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<string[]>([
    '🟢 Serverless Environment simulated successfully.',
    '🟢 API Gateway endpoint listening at https://api.serverless-app.internal/prod',
    '🟢 RDS Database pool initialized (Max capacity: 120 client connections).',
  ]);
  const [simIsRunning, setSimIsRunning] = useState<boolean>(true);
  const [simStats, setSimStats] = useState({
    invocations: 0,
    coldStarts: 0,
    throttles: 0,
    dbConnections: 0,
  });
  const [simHistoryData, setSimHistoryData] = useState<{ time: string; Invocations: number; ColdStarts: number; Throttles: number; DbConnections: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);
  const containersRef = useRef<LambdaContainer[]>([]);
  const statsHistoryRef = useRef<typeof simHistoryData>([]);
  const logCounterRef = useRef(0);

  const addSimLog = (msg: string) => {
    setSimLogs((prev) => {
      const time = new Date().toLocaleTimeString();
      return [`[${time}] ${msg}`, ...prev.slice(0, 14)];
    });
  };

  // Synchronize state for simulation controls
  const simTrafficLevelRef = useRef(simTrafficLevel);
  const simRdsProxyEnabledRef = useRef(simRdsProxyEnabled);
  const simProvConcurrencyRef = useRef(simProvConcurrency);
  const simIsRunningRef = useRef(simIsRunning);

  useEffect(() => {
    simTrafficLevelRef.current = simTrafficLevel;
  }, [simTrafficLevel]);

  useEffect(() => {
    simRdsProxyEnabledRef.current = simRdsProxyEnabled;
  }, [simRdsProxyEnabled]);

  useEffect(() => {
    simProvConcurrencyRef.current = simProvConcurrency;
  }, [simProvConcurrency]);

  useEffect(() => {
    simIsRunningRef.current = simIsRunning;
  }, [simIsRunning]);

  // Handle task/container spawning and canvas tick
  useEffect(() => {
    // Populate provisioned containers initially or when changed
    const provCount = simProvConcurrencyRef.current;
    const initialContainers: LambdaContainer[] = [];
    for (let i = 0; i < provCount; i++) {
      initialContainers.push({
        id: `c-prov-${i}-${Math.random().toString(36).substr(2, 4)}`,
        status: 'WARM',
        createdTime: Date.now(),
        lastUsedTime: Date.now(),
        requestCount: 0,
        isProvisioned: true,
      });
    }
    containersRef.current = initialContainers;
    particlesRef.current = [];

    if (provCount > 0) {
      addSimLog(`⚙️ Provisioned Concurrency: Initialized ${provCount} warm Lambda execution containers.`);
    }
  }, [simProvConcurrency]);

  // Simulation logic loops
  useEffect(() => {
    if (!simIsRunning) return;

    let totalInvsAccumulator = 0;
    let coldStartsAccumulator = 0;
    let throttlesAccumulator = 0;

    const statsInterval = setInterval(() => {
      if (!simIsRunningRef.current) return;

      const currentDbConnections = simRdsProxyEnabledRef.current 
        ? Math.min(45, Math.round(containersRef.current.filter(c => c.status === 'ACTIVE').length * 2.5 + Math.random() * 5))
        : Math.round(containersRef.current.filter(c => c.status === 'ACTIVE').length * 9.5 + Math.random() * 10);

      // Append chart history
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newStat = {
        time: timeStr,
        Invocations: totalInvsAccumulator,
        ColdStarts: coldStartsAccumulator,
        Throttles: throttlesAccumulator,
        DbConnections: currentDbConnections,
      };

      setSimStats({
        invocations: totalInvsAccumulator,
        coldStarts: coldStartsAccumulator,
        throttles: throttlesAccumulator,
        dbConnections: currentDbConnections
      });

      statsHistoryRef.current = [...statsHistoryRef.current.slice(-14), newStat];
      setSimHistoryData([...statsHistoryRef.current]);
    }, 2000);

    // Particle generator loop
    const generatorInterval = setInterval(() => {
      if (!simIsRunningRef.current) return;

      let batchSize = 1;
      const traffic = simTrafficLevelRef.current;
      if (traffic === 'low') batchSize = Math.random() > 0.6 ? 1 : 0;
      if (traffic === 'normal') batchSize = Math.random() > 0.4 ? 2 : 1;
      if (traffic === 'surge') batchSize = 5 + Math.floor(Math.random() * 4);

      for (let k = 0; k < batchSize; k++) {
        // Spawn HTTP request particle
        const id = particleIdRef.current++;
        particlesRef.current.push({
          id,
          x: 20,
          y: 70 + Math.random() * 280,
          targetX: 180,
          targetY: 210,
          speed: 2.5 + Math.random() * 2.5,
          color: '#c084fc', // light purple
          type: 'http',
          state: 'to_api'
        });

        totalInvsAccumulator++;
      }

      // Periodically clean up idle containers
      const now = Date.now();
      containersRef.current = containersRef.current.filter(c => {
        if (c.isProvisioned) return true; // Never clean up provisioned containers
        const isIdleTooLong = c.status === 'IDLE' && now - c.lastUsedTime > 12000;
        if (isIdleTooLong) {
          logCounterRef.current++;
          if (logCounterRef.current % 5 === 0) {
            addSimLog('♻️ Execution Environment: Pruned 1 idle warm container due to inactivity.');
          }
        }
        return !isIdleTooLong;
      });

    }, 300);

    return () => {
      clearInterval(statsInterval);
      clearInterval(generatorInterval);
    };
  }, [simIsRunning]);

  // Main drawing engine for the Tab 9 simulation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      if (!ctx || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const logicalWidth = 900;
      const logicalHeight = 420;

      // Update physical canvas dimension dynamically for high-resolution displays
      if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw Network Infrastructure Boxes & Subnets
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Grid background effect
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < logicalWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalHeight);
        ctx.stroke();
      }
      for (let y = 0; y < logicalHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalWidth, y);
        ctx.stroke();
      }

      // ==========================================
      // DRAW COMPONENT 1: API Gateway Glass Card
      // ==========================================
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.fillStyle = 'rgba(253, 244, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(10, 60, 150, 300, 16);
      ctx.stroke();
      ctx.fill();

      // Top Header Gradient
      const apigwGrad = ctx.createLinearGradient(10, 60, 160, 60);
      apigwGrad.addColorStop(0, '#7e22ce');
      apigwGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = apigwGrad;
      ctx.beginPath();
      ctx.roundRect(10, 60, 150, 32, [16, 16, 0, 0]);
      ctx.fill();

      // Text Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('⚡ API GATEWAY', 22, 80);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('PROD ENDPOINT', 25, 115);
      ctx.fillStyle = '#7e22ce';
      ctx.font = '9px monospace';
      ctx.fillText('https://api.app/prod', 20, 132);

      // Draw API Gateway Circular Routing Dial
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(85, 220, 38, 0, Math.PI * 2);
      ctx.stroke();

      // Outer active ring
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(85, 220, 38, Date.now() / 200, Date.now() / 200 + Math.PI * 0.7);
      ctx.stroke();

      // Inner hub
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(85, 220, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('ROUTER', 68, 223);

      // Port hole interface
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(160, 210, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(160, 210, 3, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // DRAW COMPONENT 2: AWS Lambda Service Pool Subnet
      // ==========================================
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fillStyle = 'rgba(250, 245, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(220, 40, 430, 340, 16);
      ctx.stroke();
      ctx.fill();

      // Dotted Subnet internal border
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(228, 48, 414, 324, 12);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#7e22ce';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚙️ AWS LAMBDA COMPUTE ENVIRONMENT', 242, 72);

      // ==========================================
      // DRAW COMPONENT 3: Secure Database Zone Subnet
      // ==========================================
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
      ctx.fillStyle = 'rgba(239, 246, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(680, 40, 200, 340, 16);
      ctx.stroke();
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🔒 SECURE DATABASE SUBNET', 696, 68);

      // ==========================================
      // DRAW COMPONENT 4: RDS Proxy Box
      // ==========================================
      const isProxy = simRdsProxyEnabledRef.current;
      ctx.strokeStyle = isProxy ? '#0d9488' : '#cbd5e1';
      ctx.fillStyle = isProxy ? 'rgba(240, 253, 250, 0.95)' : 'rgba(241, 245, 249, 0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(700, 85, 160, 70, 10);
      ctx.stroke();
      ctx.fill();

      // Proxy header banner
      ctx.fillStyle = isProxy ? '#0d9488' : '#64748b';
      ctx.beginPath();
      ctx.roundRect(700, 85, 160, 24, [10, 10, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(isProxy ? '🔌 RDS PROXY (ACTIVE)' : '🔌 RDS PROXY (DISABLED)', 712, 101);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.fillText(isProxy ? 'Pooler Connection Queue' : 'Bypassed - Direct DB Hits', 712, 128);

      if (isProxy) {
        ctx.fillStyle = '#0d9488';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('Multiplexing: Active (100%)', 712, 144);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('Direct Sockets Exhaustive', 712, 144);
      }

      // ==========================================
      // DRAW COMPONENT 5: High-Fidelity 3D Aurora Postgres Cylinder
      // ==========================================
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(700, 185, 160, 170, 12);
      ctx.stroke();
      ctx.fill();

      // Render 3D Cylinder Shape for PostgreSQL Database
      const cx = 780;
      const cyTop = 230;
      const cyBottom = 310;
      const rx = 45;
      const ry = 12;

      // Bottom backing shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Draw bottom cylinder base
      const dbBaseGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      dbBaseGrad.addColorStop(0, '#1d4ed8');
      dbBaseGrad.addColorStop(0.5, '#3b82f6');
      dbBaseGrad.addColorStop(1, '#1e3a8a');

      ctx.fillStyle = dbBaseGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cyBottom, rx, ry, 0, 0, Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw cylinder body wall
      ctx.fillStyle = dbBaseGrad;
      ctx.beginPath();
      ctx.rect(cx - rx, cyTop, rx * 2, cyBottom - cyTop);
      ctx.fill();

      // Database platter horizontal disk segments (3D racks look)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cyTop + (cyBottom - cyTop) * 0.33, rx, ry, 0, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cyTop + (cyBottom - cyTop) * 0.66, rx, ry, 0, 0, Math.PI);
      ctx.stroke();

      // Draw glowing blue cylinder lid on top
      const dbTopGrad = ctx.createRadialGradient(cx, cyTop, 2, cx, cyTop, rx);
      dbTopGrad.addColorStop(0, '#bfdbfe');
      dbTopGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = dbTopGrad;
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cyTop, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Database Cylinder Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛢️ POSTGRESQL', cx, cyTop + 35);
      ctx.fillStyle = '#bfdbfe';
      ctx.font = '8px monospace';
      ctx.fillText('db.m6g.large', cx, cyTop + 50);
      ctx.textAlign = 'left'; // Reset alignment

      // Connection Indicators & Overload status
      const activeWebCount = containersRef.current.filter(c => c.status === 'ACTIVE').length;
      const isExhausted = !isProxy && activeWebCount > 6;

      ctx.fillStyle = isExhausted ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(718, 308, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(isExhausted ? 'STATUS: OVERLOADED' : 'STATUS: HEALTHY', 728, 311);

      ctx.fillStyle = '#475569';
      ctx.font = '8.5px sans-serif';
      ctx.fillText(isProxy ? 'Pooled Conns: 12/120' : `Active Conns: ${activeWebCount * 12}/120`, 712, 332);

      // Warning connection storm banner
      if (isExhausted) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.roundRect(710, 192, 140, 22, 4);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(710, 192, 140, 22, 4);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.fillText('💥 SOCKET OVERFLOW!', 722, 206);
      }

      // Draw Static labels for paths
      ctx.fillStyle = '#475569';
      ctx.font = '9px monospace';
      ctx.fillText('HTTP Req', 160, 195);
      ctx.fillText('DB Pool', 645, 195);

      // Render Lambda Container Slots inside Subnet
      const maxRows = 2;
      const maxCols = 4;
      const colWidth = 90;
      const rowHeight = 90;
      const startX = 245;
      const startY = 110;

      // Draw grid outline slots as 3D isometric trays
      for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < maxCols; c++) {
          const x = startX + c * colWidth;
          const y = startY + r * rowHeight;
          
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          
          // Slanted top lid outline
          ctx.beginPath();
          ctx.moveTo(x + 6, y);
          ctx.lineTo(x + 75, y);
          ctx.lineTo(x + 69, y + 8);
          ctx.lineTo(x, y + 8);
          ctx.closePath();
          ctx.stroke();
          
          // Front chassis outline
          ctx.beginPath();
          ctx.roundRect(x, y + 8, 69, 52, 4);
          ctx.stroke();
          
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('SLOT FREE', x + 10, y + 36);
        }
      }

      // Match running containers to visual slots
      const visibleContainers = containersRef.current.slice(0, 8);
      visibleContainers.forEach((container, idx) => {
        const row = Math.floor(idx / maxCols);
        const col = idx % maxCols;
        const x = startX + col * colWidth;
        const y = startY + row * rowHeight;

        // Determine theme colors based on container state
        let primaryColor = '#64748b'; // Idle
        let bgGradientStart = '#f8fafc';
        let bgGradientEnd = '#cbd5e1';
        let ledColor = '#94a3b8';

        if (container.status === 'PROVISIONING') {
          primaryColor = '#d97706'; // Provisioning yellow
          bgGradientStart = '#fef3c7';
          bgGradientEnd = '#fcd34d';
          ledColor = '#d97706';
        } else if (container.status === 'ACTIVE') {
          primaryColor = '#7e22ce'; // Purple dynamic active
          bgGradientStart = '#f3e8ff';
          bgGradientEnd = '#d8b4fe';
          ledColor = '#a855f7';
        } else if (container.status === 'WARM') {
          primaryColor = '#15803d'; // Green warm
          bgGradientStart = '#dcfce7';
          bgGradientEnd = '#86efac';
          ledColor = '#10b981';
        }

        // 1. Draw slanted 3D top cover plate
        const topGrad = ctx.createLinearGradient(x, y, x + 75, y + 8);
        topGrad.addColorStop(0, bgGradientStart);
        topGrad.addColorStop(1, bgGradientEnd);
        ctx.fillStyle = topGrad;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 75, y);
        ctx.lineTo(x + 69, y + 8);
        ctx.lineTo(x, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Draw front vertical chassis face
        const frontGrad = ctx.createLinearGradient(0, y + 8, 0, y + 60);
        frontGrad.addColorStop(0, bgGradientEnd);
        frontGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = frontGrad;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y + 8, 69, 52, [0, 0, 6, 6]);
        ctx.fill();
        ctx.stroke();

        // Draw microVM physical card slots (chassis grille)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(x + 6, y + 14, 57, 10);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 6, y + 14, 57, 10);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`VM-${container.id.split('-')[1] || 'init'}`, x + 10, y + 22);

        // Status Badge inside panel
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 28, 57, 12, 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(container.status, x + 34, y + 36);
        ctx.textAlign = 'left'; // Reset

        // Dynamic Glowing LED Light
        ctx.fillStyle = ledColor;
        if (container.status === 'ACTIVE' && Date.now() % 1000 < 500) {
          ctx.fillStyle = '#ffffff';
        }
        ctx.beginPath();
        ctx.arc(x + 12, y + 49, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.font = '7px sans-serif';
        ctx.fillText(`REQ: ${container.requestCount}`, x + 20, y + 51);

        // Provisioned Concurrency Blue Jewel indicator
        if (container.isProvisioned) {
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(x + 60, y + 49, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Move and Render Traffic Particles
      const activeParticles: Particle[] = [];

      particlesRef.current.forEach((p) => {
        let reachedTarget = false;

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          reachedTarget = true;
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }

        // Draw high-fidelity glowing radial gradient particle
        const rSize = p.type === 'http' ? 6 : 4;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rSize);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Solid core
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'http' ? 2.5 : 1.8, 0, Math.PI * 2);
        ctx.fill();

        if (reachedTarget) {
          if (p.state === 'to_api') {
            const availableContainer = containersRef.current.find(c => c.status === 'WARM' || c.status === 'IDLE');

            if (availableContainer) {
              availableContainer.status = 'ACTIVE';
              availableContainer.lastUsedTime = Date.now();
              availableContainer.requestCount++;

              p.targetX = startX + (containersRef.current.indexOf(availableContainer) % 4) * colWidth + 37;
              p.targetY = startY + Math.floor(containersRef.current.indexOf(availableContainer) / 4) * rowHeight + 32;
              p.state = 'to_lambda';
              p.color = '#10b981'; // Green warm invoke
              p.containerId = availableContainer.id;
              activeParticles.push(p);
            } else if (containersRef.current.length < 8) {
              const containerId = `c-dyn-${containersRef.current.length}-${Math.random().toString(36).substr(2, 4)}`;
              const newContainer: LambdaContainer = {
                id: containerId,
                status: 'PROVISIONING',
                createdTime: Date.now(),
                lastUsedTime: Date.now(),
                requestCount: 1,
                isProvisioned: false
              };
              containersRef.current.push(newContainer);
              setSimStats(prev => ({ ...prev, coldStarts: prev.coldStarts + 1 }));
              addSimLog(`⚠️ Cold Start! API Gateway triggers brand new Lambda microVM execution container: ${containerId.split('-')[1]}.`);

              p.targetX = startX + ((containersRef.current.length - 1) % 4) * colWidth + 37;
              p.targetY = startY + Math.floor((containersRef.current.length - 1) / 4) * rowHeight + 32;
              p.state = 'to_lambda';
              p.color = '#f59e0b'; // Amber cold start particle
              p.containerId = containerId;

              // Transition to ACTIVE after provisioning delay
              setTimeout(() => {
                const search = containersRef.current.find(c => c.id === containerId);
                if (search && search.status === 'PROVISIONING') {
                  search.status = 'ACTIVE';
                  addSimLog(`⚙️ MicroVM Ready: Container ${containerId.split('-')[1]} initialized runtime, execution starting.`);
                }
              }, 1200);

              activeParticles.push(p);
            } else {
              setSimStats(prev => ({ ...prev, throttles: prev.throttles + 1 }));
              addSimLog('❌ Throttled! Active containers exhausted (Max concurrency: 8 visual simulation cap). HTTP 429 returned.');

              p.targetX = p.x - 120;
              p.targetY = p.y + (Math.random() * 80 - 40);
              p.speed = 4;
              p.color = '#ef4444'; // Red throttled
              p.state = 'done';
              activeParticles.push(p);
            }
          } else if (p.state === 'to_lambda') {
            setTimeout(() => {
              const match = containersRef.current.find(c => c.id === p.containerId);
              if (match && match.status === 'ACTIVE') {
                match.status = 'WARM';
                match.lastUsedTime = Date.now();
              }
            }, 800);

            p.targetX = 700;
            p.targetY = isProxy ? 120 : 270;
            p.color = '#3b82f6'; // Blue DB request
            p.state = 'to_db';
            activeParticles.push(p);
          } else if (p.state === 'to_db') {
            if (!isProxy && activeWebCount > 6) {
              p.color = '#ef4444';
              p.targetX = p.x - 50;
              p.targetY = p.y + Math.random() * 100 - 50;
              p.state = 'done';
            } else {
              p.targetX = 20;
              p.targetY = 210;
              p.color = '#10b981'; // Success Green
              p.state = 'done';
            }
            activeParticles.push(p);
          }
        } else {
          activeParticles.push(p);
        }
      });

      particlesRef.current = activeParticles;

      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [simIsRunning]);

  return (
    <div className="sv-container">
      {/* Styles for premium animations & visual tokens */}
      <style>{`
        .sv-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 24px;
          border-radius: 16px;
        }
        .sv-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .sv-grid {
            grid-template-columns: 1fr;
          }
        }
        .sv-card {
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sv-card:hover {
          border-color: #a855f7;
          box-shadow: 0 12px 24px -4px rgba(168, 85, 247, 0.08), 0 4px 12px -2px rgba(168, 85, 247, 0.03);
          transform: translateY(-1px);
        }
        .sv-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .sv-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .sv-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }
        .sv-tb {
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
        .sv-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .sv-tb.sv-on {
          background: #7e22ce;
          color: #ffffff;
          border-color: #7e22ce;
          box-shadow: 0 4px 12px rgba(126, 34, 206, 0.12);
        }
        .sv-input, .sv-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          background: #ffffff;
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 505;
          outline: none;
          transition: all 0.15s ease;
        }
        .sv-input:focus, .sv-select:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.12);
        }
        .sv-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          display: block;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-purple { background: #f3e8ff; color: #7e22ce; }
        .badge-orange { background: #ffedd5; color: #c2410c; }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-green { background: #dcfce7; color: #15803d; }
        
        /* Custom dynamic visualizer backdrops */
        .sv-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(168, 85, 247, 0.08) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        
        .active-svg-glow {
          animation: activeGlow 2s infinite alternate;
        }
        @keyframes activeGlow {
          0% { filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.15)); }
          100% { filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.45)); }
        }
        
        .flow-line-active, .active-flow-line {
          stroke: #a855f7;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        .flow-line-active-green, .active-flow-line-green {
          stroke: #10b981;
          stroke-dasharray: 6,4;
          animation: flowDash 0.8s linear infinite;
        }
        .flow-line-active-blue, .active-flow-line-blue {
          stroke: #2563eb;
          stroke-dasharray: 6,4;
          animation: flowDash 1.2s linear infinite;
        }
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Centralized Dark Mode Overrides for ServerlessVisualizer.tsx */
        .dark .sv-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .sv-card,
        .dark [class*="sv-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .sv-card b,
        .dark .sv-card strong,
        .dark .sv-card h3,
        .dark .sv-card h4 {
          color: #ffffff !important;
        }
        .dark .sv-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .sv-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .sv-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .sv-sec,
        .dark .sv-kk {
          color: #94a3b8 !important;
        }
        .dark .sv-log,
        .dark .sv-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .sv-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .sv-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .sv-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.sv-ck li {
          color: #cbd5e1 !important;
        }
        .dark .sv-inst,
        .dark .sv-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .sv-inst .meta,
        .dark .sv-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .sv-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .sv-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .sv-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .sv-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .sv-down {
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

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500 rounded-lg text-white">
              <Zap className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">AWS Serverless, DynamoDB &amp; Security Visualizer</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Master full-stack serverless architectures. Experiment with Lambda environments, DynamoDB capacity &amp; streams, API Gateway, Cognito IAM token federation, and autoscaling.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="badge badge-purple">AWS Certified Developer</span>
          <span className="badge badge-blue">Advanced Architecture</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="sv-tabs">
        <button className={`sv-tb ${activeTab === 'intro' ? 'sv-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <Layers className="w-4 h-4" /> Serverless Ecosystem
        </button>
        <button className={`sv-tb ${activeTab === 'lambda-core' ? 'sv-on' : ''}`} onClick={() => setActiveTab('lambda-core')}>
          <Cpu className="w-4 h-4" /> Thumbnail Pipeline
        </button>
        <button className={`sv-tb ${activeTab === 'concurrency-limits' ? 'sv-on' : ''}`} onClick={() => setActiveTab('concurrency-limits')}>
          <Sliders className="w-4 h-4" /> Concurrency &amp; SnapStart
        </button>
        <button className={`sv-tb ${activeTab === 'edge-compute' ? 'sv-on' : ''}`} onClick={() => setActiveTab('edge-compute')}>
          <Globe className="w-4 h-4" /> Edge Compute
        </button>
        <button className={`sv-tb ${activeTab === 'dynamodb' ? 'sv-on' : ''}`} onClick={() => setActiveTab('dynamodb')}>
          <Database className="w-4 h-4" /> DynamoDB Deep Dive
        </button>
        <button className={`sv-tb ${activeTab === 'api-gateway' ? 'sv-on' : ''}`} onClick={() => setActiveTab('api-gateway')}>
          <Network className="w-4 h-4" /> API Gateway &amp; Orchestration
        </button>
        <button className={`sv-tb ${activeTab === 'cognito' ? 'sv-on' : ''}`} onClick={() => setActiveTab('cognito')}>
          <Lock className="w-4 h-4" /> Cognito Security
        </button>
        <button className={`sv-tb ${activeTab === 'serverless-architectures' ? 'sv-on' : ''}`} onClick={() => setActiveTab('serverless-architectures')}>
          <Layers className="w-4 h-4" /> Serverless Architectures
        </button>
        <button className={`sv-tb ${activeTab === 'db-integration' ? 'sv-on' : ''}`} onClick={() => setActiveTab('db-integration')}>
          <Shield className="w-4 h-4" /> VPC &amp; DB Integrations
        </button>
        <button className={`sv-tb ${activeTab === 'simulation' ? 'sv-on' : ''}`} onClick={() => setActiveTab('simulation')}>
          <Play className="w-4 h-4" /> Auto-Scaling Playground
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTRO & AWS SERVERLESS CATALOG                                     */}
      {/* ========================================================================= */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
              <h3 className="font-bold text-purple-950 flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600 animate-pulse" /> 100% No Server Management
              </h3>
              <p className="text-xs text-purple-900 leading-relaxed">
                You never provision, patch, monitor, or secure underlying operating systems, OS packages, virtual machines, or EC2 instances. Code execution is fully managed by AWS.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
              <h3 className="font-bold text-orange-950 flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" /> Continuous Auto-Scaling
              </h3>
              <p className="text-xs text-orange-900 leading-relaxed">
                Serverless services scale automatically and immediately from absolute zero requests to thousands of concurrent transactions, mapping resources directly to instant request patterns.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Pay-For-Value Billing
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Never pay for idle resources. If zero requests hit your AWS Lambda, API Gateway, or DynamoDB tables, your operational cost is $0. Billed purely on transactions and raw execution times.
              </p>
            </div>
          </div>

          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Layers className="w-5 h-5" /> The Evolution of Compute: Virtualization Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Attribute</th>
                    <th className="p-3">Physical Servers</th>
                    <th className="p-3">Virtual Machines (EC2)</th>
                    <th className="p-3">Containers (ECS/EKS)</th>
                    <th className="p-3">Serverless (Lambda)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-slate-600">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Isolation Layer</td>
                    <td className="p-3">Physical hardware cabinets</td>
                    <td className="p-3">Hypervisor virtualization</td>
                    <td className="p-3">Kernel namespaces / OS virtualization</td>
                    <td className="p-3">MicroVM isolation (Firecracker)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Provisioning Overhead</td>
                    <td className="p-3">Weeks (buying physical hardware)</td>
                    <td className="p-3">Minutes (launching EC2 instances)</td>
                    <td className="p-3">Seconds (starting docker containers)</td>
                    <td className="p-3">Milliseconds (triggering cold/warm starts)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Scale Mechanism</td>
                    <td className="p-3">Manual procurement</td>
                    <td className="p-3">Auto-scaling groups (metric polling)</td>
                    <td className="p-3">Fast task/pod replication</td>
                    <td className="p-3">Immediate per-request spawning</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Maintenance Burden</td>
                    <td className="p-3">Cabling, cooling, disk swaps, hardware updates</td>
                    <td className="p-3">OS patching, security updates, kernel upgrades</td>
                    <td className="p-3">Docker daemon config, container registry updates</td>
                    <td className="p-3">Zero OS overhead. Focus strictly on code functions</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Idle Costs</td>
                    <td className="p-3">100% full cost even at 0% usage</td>
                    <td className="p-3">100% full cost per uptime hour</td>
                    <td className="p-3">High idle cost (paying for cluster capacity)</td>
                    <td className="p-3">Absolutely $0.00 during idle times</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-500" /> Interactive Catalog: AWS Serverless Suite
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Select any core serverless service below to see its exact description, architectural role, operational limits, integration context, and billing models.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              {serverlessServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-center ${
                    selectedService === service.id
                      ? 'border-purple-500 bg-purple-50 text-purple-950 font-bold shadow-md shadow-purple-500/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2 p-2 bg-slate-100 rounded-lg">{service.icon}</div>
                  <span className="text-xs truncate w-full">{service.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-1">{service.category}</span>
                </button>
              ))}
            </div>

            {(() => {
              const details = serverlessServices.find((s) => s.id === selectedService);
              if (!details) return null;
              return (
                <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-50 rounded-xl">{details.icon}</div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">{details.category}</span>
                      <h4 className="text-lg font-bold text-slate-900">{details.name}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-purple-700 mb-1">What it is</h5>
                        <p className="text-slate-600">{details.desc}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-purple-700 mb-1">Core Operational Limits</h5>
                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">{details.limits}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-purple-700 mb-1">Why &amp; How it Integrates</h5>
                        <p className="text-slate-600">{details.whyIntegrates}</p>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-purple-700 mb-1">Pricing Model</h5>
                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">{details.pricing}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LAMBDA CORE & THUMBNAIL PIPELINE                                  */}
      {/* ========================================================================= */}
      {activeTab === 'lambda-core' && (
        <div className="space-y-6">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Cpu className="w-5 h-5" /> Concept: How AWS Lambda Works Under the Hood
            </h2>
            <p className="sv-card-desc mb-3">
              AWS Lambda is an event-driven compute engine. When a trigger executes, Lambda fetches your compiled code zip or container image and runs it inside a fully isolated **Firecracker MicroVM** container.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mt-4">
              <div className="border border-slate-150 p-3.5 rounded-xl bg-slate-50">
                <span className="font-bold text-purple-700 block mb-1">1. Event Trigger</span>
                An upstream event (e.g. S3 upload, API Request, SQS message) sends a payload describing what happened.
              </div>
              <div className="border border-slate-150 p-3.5 rounded-xl bg-slate-50">
                <span className="font-bold text-purple-700 block mb-1">2. Environment Provision</span>
                If no idle pre-warmed container is available, Lambda spins up a MicroVM, downloads the code, and initializes runtime (Cold Start).
              </div>
              <div className="border border-slate-150 p-3.5 rounded-xl bg-slate-50">
                <span className="font-bold text-purple-700 block mb-1">3. Handler Execution</span>
                The handler function receives the `event` JSON payload and execution `context` objects, performing stateless logic.
              </div>
              <div className="border border-slate-150 p-3.5 rounded-xl bg-slate-50">
                <span className="font-bold text-purple-700 block mb-1">4. Container Freezing</span>
                After completion, the MicroVM is frozen for up to several minutes, ready to instantly process subsequent events with zero delay.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-between min-h-[460px]">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Serverless Thumbnail Creation Architecture</h3>
                  <p className="text-[11px] text-slate-500">Watch microservice actions flow across S3, Lambda, and DynamoDB in real-time</p>
                </div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coldStartActive}
                      onChange={(e) => setColdStartActive(e.target.checked)}
                      className="rounded border-slate-300 text-purple-500 bg-white accent-purple-500"
                    />
                    Simulate Cold Start
                  </label>
                  <button
                    disabled={pipelineState !== 'idle'}
                    onClick={runThumbnailPipeline}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-500 disabled:bg-slate-200 disabled:text-slate-450 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" /> Run Pipeline
                  </button>
                  <button
                    onClick={resetPipeline}
                    className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full h-[280px] relative rounded-xl border border-slate-200 p-2 overflow-hidden shadow-inner bg-slate-50">
                <svg className="w-full h-full sv-svg-bg" viewBox="0 0 700 280">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#7e22ce" />
                    </marker>
                    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
                    </marker>
                    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
                    </marker>
                  </defs>

                  {/* ==================== AWS REGION BOUNDARY ==================== */}
                  <rect x="110" y="24" width="575" height="245" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="5,3" />
                  <text x="120" y="36" fill="#2563eb" fontSize="7.5" fontWeight="bold">AWS Region Cloud Boundary (us-east-1)</text>

                  {/* Flow Connection Lines */}
                  <path d="M 90 140 H 130" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                  {pipelineState === 'uploading' && (
                    <line x1="90" y1="140" x2="130" y2="140" stroke="#7e22ce" strokeWidth="3" className="active-flow-line" />
                  )}

                  <path d="M 210 140 H 300" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                  {pipelineState === 's3-event' && (
                    <line x1="210" y1="140" x2="300" y2="140" stroke="#7e22ce" strokeWidth="3" className="active-flow-line" />
                  )}

                  <path d="M 480 110 Q 500 50, 520 50" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                  {(pipelineState === 's3-upload-thumb' || pipelineState === 'lambda-processing') && (
                    <path d="M 480 110 Q 500 50, 520 50" fill="none" stroke="#059669" strokeWidth="3" className="active-flow-line-green" />
                  )}

                  <path d="M 480 170 Q 500 230, 520 230" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                  {pipelineState === 'db-metadata' && (
                    <path d="M 480 170 Q 500 230, 520 230" fill="none" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                  )}

                  {/* Node 1: Client Upload Trigger */}
                  <g transform="translate(10, 105)">
                    <rect width="80" height="70" rx="8" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                    <text x="40" y="32" fill="#475569" fontSize="10" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                    <text x="40" y="48" fill="#1e293b" fontSize="9" textAnchor="middle">Upload API</text>
                  </g>

                  {/* Node 2: Raw uploads S3 Bucket */}
                  <g transform="translate(130, 95)">
                    <rect width="80" height="90" rx="10" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <text x="40" y="24" fill="#ea580c" fontSize="10" fontWeight="bold" textAnchor="middle">🪣 S3 BUCKET</text>
                    <text x="40" y="42" fill="#7c2d12" fontSize="8" textAnchor="middle">uploads-bucket</text>
                    <rect x="10" y="55" width="60" height="25" rx="4" fill="#ffedd5" stroke="#ea580c" strokeWidth="1" />
                    <text x="40" y="70" fill="#c2410c" fontSize="8" textAnchor="middle" fontWeight="semibold">vacation_raw.jpg</text>
                  </g>

                  {/* ==================== FIRECRACKER MICROVM CONTAINMENT ==================== */}
                  <g transform="translate(230, 55)">
                    <rect width="250" height="170" rx="8" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="125" y="16" fill="#7e22ce" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">⚡ FIRECRACKER MICROVM SANDBOX</text>
                    
                    {/* Node 3: AWS Lambda function */}
                    <g transform="translate(75, 30)">
                      <rect width="100" height="110" rx="6" fill="#ffffff" stroke="#9333ea" strokeWidth="2" />
                      <text x="50" y="22" fill="#7e22ce" fontSize="10" fontWeight="bold" textAnchor="middle">⚡ LAMBDA</text>
                      <text x="50" y="38" fill="#581c87" fontSize="8" textAnchor="middle">createThumbnail</text>
                      <circle cx="50" cy="68" r="14" fill="#f3e8ff" stroke={
                        pipelineState === 'lambda-init' ? '#d97706' :
                        pipelineState === 'lambda-processing' ? '#059669' : '#cbd5e1'
                      } strokeWidth="2" />
                      <text x="50" y="71" fill="#581c87" fontSize="8" textAnchor="middle" fontWeight="bold">
                        {pipelineState === 'lambda-init' ? 'INIT' :
                         pipelineState === 'lambda-processing' ? 'RUN' : 'IDLE'}
                      </text>
                      <text x="50" y="98" fill={coldStartActive ? '#ea580c' : '#059669'} fontSize="7" fontWeight="black" textAnchor="middle">
                        {coldStartActive ? '⚡ COLD START' : '🟢 WARM REUSE'}
                      </text>
                    </g>
                  </g>

                  {/* Node 4: Optimized/Target S3 Bucket */}
                  <g transform="translate(520, 10)">
                    <rect width="140" height="80" rx="10" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                    <text x="70" y="24" fill="#15803d" fontSize="10" fontWeight="bold" textAnchor="middle">🪣 S3 OPTIMIZED</text>
                    <text x="70" y="42" fill="#166534" fontSize="8" textAnchor="middle">optimized-bucket</text>
                    {pipelineState === 's3-upload-thumb' || pipelineState === 'db-metadata' || pipelineState === 'completed' ? (
                      <g transform="translate(15, 52)">
                        <rect width="110" height="20" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" />
                        <text x="55" y="13" fill="#15803d" fontSize="8" textAnchor="middle" fontWeight="bold">vacation_thumbnail.jpg</text>
                      </g>
                    ) : (
                      <text x="70" y="62" fill="#64748b" fontSize="8" textAnchor="middle">Waiting for save...</text>
                    )}
                  </g>

                  {/* Node 5: DynamoDB Metadata Store */}
                  <g transform="translate(520, 190)">
                    <rect width="140" height="80" rx="10" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                    <text x="70" y="24" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                    <text x="70" y="42" fill="#1e40af" fontSize="8" textAnchor="middle">ImagesMetadata</text>
                    {pipelineState === 'db-metadata' || pipelineState === 'completed' ? (
                      <g transform="translate(15, 50)">
                        <rect width="110" height="22" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                        <text x="55" y="14" fill="#1e40af" fontSize="8" textAnchor="middle" fontWeight="semibold">Item Added (id: 104a)</text>
                      </g>
                    ) : (
                      <text x="70" y="62" fill="#64748b" fontSize="8" textAnchor="middle">Waiting for write...</text>
                    )}
                  </g>
                </svg>

                {pipelineState === 'lambda-init' && (
                  <div className="absolute top-[138px] left-[334px] w-6 h-6 bg-amber-500/20 border border-amber-500 rounded-full pulse-circle" />
                )}
                {pipelineState === 'lambda-processing' && (
                  <div className="absolute top-[138px] left-[334px] w-6 h-6 bg-emerald-500/20 border border-emerald-500 rounded-full pulse-circle" />
                )}
              </div>
            </div>

            {/* Live Pipeline Logs console */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-[460px] shadow-inner">
              <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-purple-600" />
                <span>Thumbnail Pipeline Event Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10.5px] leading-relaxed text-slate-700 pr-1">
                {pipelineLogs.length === 0 ? (
                  <span className="text-slate-500 block text-center mt-32 italic">Click "Run Pipeline" to trigger S3 bucket events and trace the Lambda workflow execution lifecycle.</span>
                ) : (
                  pipelineLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('🚀')) color = 'text-purple-700 font-semibold bg-purple-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('⚡')) color = 'text-amber-700 font-semibold bg-amber-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('⚙️')) color = 'text-cyan-700 font-semibold bg-cyan-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('✅')) color = 'text-emerald-700 font-semibold bg-emerald-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('💾')) color = 'text-blue-700 font-semibold bg-blue-50/50 px-1.5 py-0.5 rounded';
                    return (
                      <div key={idx} className={`${color} border-b border-slate-100 pb-1.5`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONCURRENCY, LIMITS, & SNAPSTART                                   */}
      {/* ========================================================================= */}
      {activeTab === 'concurrency-limits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Hand interactive controls */}
            <div className="lg:col-span-6 sv-card flex flex-col justify-between">
              <div>
                <h3 className="sv-card-title text-purple-700">
                  <Sliders className="w-5 h-5" /> Lambda Concurrency &amp; Throttling Limits Simulator
                </h3>
                <p className="sv-card-desc mb-5">
                  AWS Lambda concurrency measures the number of active, concurrent requests processed at any single instant. If execution limits are breached, Lambda rejects new requests, returning an HTTP `429 Too Many Requests` (Throttled) status.
                </p>

                {/* Control sliders */}
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="sv-label">Simulated Client Traffic load:</span>
                      <span className="text-xs font-bold text-slate-900">{concurrencyTraffic} requests/sec</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1200"
                      step="50"
                      value={concurrencyTraffic}
                      onChange={(e) => setConcurrencyTraffic(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="sv-label">Lambda Reserved Concurrency Limit:</span>
                      <span className="text-xs font-bold text-purple-700">{reservedLimit} concurrent containers</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={reservedLimit}
                      onChange={(e) => setReservedLimit(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <span className="sv-label mb-2">Advanced Latency Optimization Controls:</span>
                    <div className="flex flex-col gap-2.5 mt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={provisionedWarmed}
                          onChange={(e) => setProvisionedWarmed(e.target.checked)}
                          className="rounded border-slate-300 text-purple-500 bg-white accent-purple-600 w-4 h-4"
                        />
                        Pre-warm Containers (Provisioned Concurrency)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={snapStartEnabled}
                          onChange={(e) => setSnapStartEnabled(e.target.checked)}
                          className="rounded border-slate-300 text-purple-500 bg-white accent-purple-600 w-4 h-4"
                        />
                        Enable Lambda SnapStart (Bypasses Cold Starts)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Telemetry panel */}
                <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                    <span className="text-[10px] text-purple-600 font-bold block">TOTAL REQS</span>
                    <span className="text-xl font-bold text-purple-950">{totalInvocations} RPS</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <span className="text-[10px] text-emerald-600 font-bold block">SUCCESSFUL</span>
                    <span className="text-xl font-bold text-emerald-950">{successfulCount} RPS</span>
                  </div>
                  <div className={`rounded-xl p-3 border ${
                    throttlingCount > 0 ? 'bg-red-50 border-red-150 text-red-700 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <span className="text-[10px] font-bold block">THROTTLED</span>
                    <span className="text-xl font-bold">{throttlingCount} RPS</span>
                  </div>
                </div>
              </div>

              {isThrottled && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 text-xs text-red-800 leading-relaxed">
                  <span className="font-bold block uppercase tracking-wider text-[10px] text-red-600 mb-1">⚠️ SYSTEM IS THROTTLED (HTTP 429)</span>
                  Incoming client traffic demands **{activeConcurrencyNeeded} concurrent execution containers**, exceeding your function\'s **Reserved Concurrency cap of {reservedLimit}**. Lambda is shedding traffic. Solutions: request a regional limit increase or configure upstream buffers (e.g. SQS).
                </div>
              )}
            </div>

            {/* Right hand operational timelines explanation */}
            <div className="lg:col-span-6 sv-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-sm text-purple-700 flex items-center gap-1.5">
                    <Clock className="w-5 h-5" /> Latency Lifecycle
                  </h3>
                  <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                    <span className="text-[10px] font-semibold text-purple-600">Calculated Average Latency:</span>
                    <span className="text-[11px] font-bold font-mono text-purple-950">{avgLatencyMs}ms</span>
                  </div>
                </div>
                <p className="sv-card-desc mb-5">
                  Cold starts affect execution latency by forcing environment setup times (MicroVM initialization, container boot, language runtime load) into active request paths. Compare execution lifecycles below:
                </p>

                {/* Timelines diagram */}
                <div className="space-y-4 text-xs">
                  {/* Timeline 1: Standard Cold Start */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>1. Standard Cold Start (e.g., Java Springboot)</span>
                      <span className="text-red-600 font-bold">~2,200 ms latency</span>
                    </div>
                    <div className="w-full h-8 bg-slate-100 rounded-md overflow-hidden flex border border-slate-200">
                      <div className="bg-amber-400 text-slate-900 flex items-center justify-center font-semibold text-[9px] w-[55%] truncate">
                        MicroVM Init (~1200ms)
                      </div>
                      <div className="bg-amber-300 text-slate-900 flex items-center justify-center font-semibold text-[9px] w-[35%] border-l border-slate-300/40 truncate">
                        App Load &amp; Init (~800ms)
                      </div>
                      <div className="bg-emerald-500 text-white flex items-center justify-center font-semibold text-[9px] w-[10%] border-l border-slate-400/40 truncate">
                        Code (~200ms)
                      </div>
                    </div>
                  </div>

                  {/* Timeline 2: Provisioned Concurrency */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>2. Provisioned Concurrency (Pre-warmed Container)</span>
                      <span className="text-emerald-600 font-bold">~200 ms latency (0ms Init)</span>
                    </div>
                    <div className="w-full h-8 bg-slate-100 rounded-md overflow-hidden flex border border-slate-200">
                      <div className="bg-slate-200 text-slate-400 flex items-center justify-center text-[9px] w-[90%] italic">
                        Init bypassed (Warmed beforehand)
                      </div>
                      <div className="bg-emerald-500 text-white flex items-center justify-center font-semibold text-[9px] w-[10%] border-l border-slate-400/40">
                        Code (~200ms)
                      </div>
                    </div>
                  </div>

                  {/* Timeline 3: SnapStart enabled */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>3. Lambda SnapStart (MicroVM Restore Snapshot)</span>
                      <span className="text-purple-600 font-bold">~350 ms latency</span>
                    </div>
                    <div className="w-full h-8 bg-slate-100 rounded-md overflow-hidden flex border border-slate-200">
                      <div className="bg-purple-600 text-white flex items-center justify-center font-semibold text-[9px] w-[8%] italic">
                        Deploy-time Init
                      </div>
                      <div className="bg-purple-300 text-slate-900 flex items-center justify-center font-semibold text-[9px] w-[12%] border-l border-purple-400/40 truncate">
                        Restore (~150ms)
                      </div>
                      <div className="bg-emerald-500 text-white flex items-center justify-center font-semibold text-[9px] w-[80%] border-l border-slate-400/40">
                        Code (~200ms)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-6 text-xs text-purple-900 leading-relaxed">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-purple-700 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> What is Lambda SnapStart?
                </span>
                Instead of executing full class-loading and JVM initialization at startup (often adding several seconds of cold start latency to Java applications), **SnapStart takes a compressed state snapshot of the active running MicroVM** at deployment time. On subsequent cold starts, Lambda simply restores this snapshot from SSD caches, bypassing JVM initialization completely and decreasing startup latency by up to **90%**.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EDGE COMPUTE: CLOUDFRONT FUNCTIONS VS LAMBDA@EDGE                 */}
      {/* ========================================================================= */}
      {activeTab === 'edge-compute' && (
        <div className="space-y-6">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Globe className="w-5 h-5" /> Edge Customization: Extending Logic to CloudFront locations
            </h2>
            <p className="sv-card-desc">
              Extending backend logic closer to global audiences dramatically reduces latency. AWS provides two serverless tools at global edge locations: **CloudFront Functions** and **Lambda@Edge**. Selecting the right tool depends heavily on use cases and computation requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Edge Lifecycle Request-Response triggers</h3>
                    <p className="text-[11px] text-slate-550">Select lifecycle hooks below to map where CloudFront Functions vs Lambda@Edge run</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEdgeTechView('cf-functions')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        edgeTechView === 'cf-functions' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      CloudFront Functions
                    </button>
                    <button
                      onClick={() => setEdgeTechView('lambda-edge')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        edgeTechView === 'lambda-edge' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Lambda@Edge
                    </button>
                  </div>
                </div>

                {/* HTTP Flow Graph */}
                <div className="w-full h-[220px] border border-slate-200 rounded-xl p-2 relative overflow-hidden shadow-inner bg-slate-50">
                  <svg className="w-full h-full sv-svg-bg" viewBox="0 0 700 220">
                    <defs>
                      <marker id="edge-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* ==================== CLOUDFRONT CDN EDGE NETWORK BOUNDARY ==================== */}
                    <rect x="90" y="24" width="375" height="185" rx="8" fill="none" stroke="#db2777" strokeWidth="1.2" strokeDasharray="4,3" />
                    <text x="96" y="36" fill="#db2777" fontSize="7.5" fontWeight="extrabold">CloudFront CDN Edge Network Boundary</text>

                    {/* ==================== AWS REGION ORIGIN BOUNDARY ==================== */}
                    <rect x="490" y="24" width="195" height="185" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="5,3" />
                    <text x="496" y="36" fill="#2563eb" fontSize="7.5" fontWeight="extrabold">AWS Region Origin (us-east-1)</text>

                    {/* Dynamic Conduits */}
                    <path d="M 72 105 H 245" fill="none" stroke={selectedEdgeHook === 'viewer-request' ? '#7e22ce' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#edge-arrow)" className={selectedEdgeHook === 'viewer-request' ? 'flow-line-active' : ''} />
                    <path d="M 345 105 H 525" fill="none" stroke={edgeTechView === 'lambda-edge' && selectedEdgeHook === 'origin-request' ? '#db2777' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#edge-arrow)" className={edgeTechView === 'lambda-edge' && selectedEdgeHook === 'origin-request' ? 'flow-line-active-blue' : ''} />
                    <path d="M 525 145 H 345" fill="none" stroke={edgeTechView === 'lambda-edge' && selectedEdgeHook === 'origin-response' ? '#db2777' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#edge-arrow)" className={edgeTechView === 'lambda-edge' && selectedEdgeHook === 'origin-response' ? 'flow-line-active-blue' : ''} />
                    <path d="M 245 145 H 72" fill="none" stroke={selectedEdgeHook === 'viewer-response' ? '#7e22ce' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#edge-arrow)" className={selectedEdgeHook === 'viewer-response' ? 'flow-line-active' : ''} />

                    {/* Node 1: User Device Zone */}
                    <g transform="translate(10, 50)">
                      <rect width="64" height="135" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                      <text x="32" y="16" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">CLIENT ZONE</text>
                      <g transform="translate(7, 28)">
                        <circle cx="25" cy="30" r="18" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                        <text x="25" y="33" fill="#475569" fontSize="9" textAnchor="middle" fontWeight="bold">💻 USER</text>
                        <text x="25" y="66" fill="#64748b" fontSize="7" textAnchor="middle">Web Browser</text>
                        <text x="25" y="78" fill="#94a3b8" fontSize="6" textAnchor="middle">Client App</text>
                      </g>
                    </g>

                    {/* Node 2: CF Edge POP Container */}
                    <g transform="translate(245, 50)">
                      <rect width="100" height="140" rx="8" fill="#fdf2f8" stroke="#db2777" strokeWidth="2" />
                      <text x="50" y="18" fill="#db2777" fontSize="9" textAnchor="middle" fontWeight="extrabold">🛜 CF EDGE POP</text>
                      <text x="50" y="30" fill="#701a75" fontSize="7" textAnchor="middle">Edge Caching Layer</text>
                      
                      {/* V8 engine vs Lambda sandbox depending on selected tech view */}
                      <g transform="translate(8, 42)">
                        <rect width="84" height="52" rx="6" fill="#ffffff" stroke="#ec4899" strokeWidth="1.2" />
                        <text x="42" y="15" fill="#be185d" fontSize="7.5" textAnchor="middle" fontWeight="bold">
                          {edgeTechView === 'cf-functions' ? '⚡ V8 ENGINE' : '📦 MICROVM'}
                        </text>
                        <text x="42" y="28" fill="#86198f" fontSize="7" textAnchor="middle">
                          {edgeTechView === 'cf-functions' ? 'JS Runtime' : 'Lambda@Edge'}
                        </text>
                        <text x="42" y="42" fill="#9d174d" fontSize="6.5" textAnchor="middle" fontWeight="semibold">
                          {edgeTechView === 'cf-functions' ? 'Viewer Event' : 'Regional POP'}
                        </text>
                      </g>
                      
                      {/* Local Edge Cache badge */}
                      <g transform="translate(8, 104)">
                        <rect width="84" height="26" rx="4" fill="#fce7f3" stroke="#f472b6" strokeWidth="1" />
                        <text x="42" y="16" fill="#831843" fontSize="8.5" textAnchor="middle" fontWeight="bold">💾 LOCAL CACHE</text>
                      </g>
                    </g>

                    {/* Node 3: Origin Server Container */}
                    <g transform="translate(525, 50)">
                      <rect width="135" height="135" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                      <text x="67.5" y="20" fill="#1d4ed8" fontSize="10" textAnchor="middle" fontWeight="extrabold">🎛️ ORIGIN SERVER</text>
                      <text x="67.5" y="32" fill="#1e40af" fontSize="8" textAnchor="middle">S3 / Application Load Balancer</text>
                      
                      <rect x="12" y="48" width="111" height="66" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                      <text x="67.5" y="64" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="bold">PRIMARY DATASTORE</text>
                      <text x="67.5" y="78" fill="#2563eb" fontSize="7.5" textAnchor="middle">App Backend</text>
                      <text x="67.5" y="94" fill="#1d4ed8" fontSize="8" textAnchor="middle" fontWeight="semibold">Region (us-east-1)</text>
                    </g>

                    {edgeTechView === 'cf-functions' && (
                      <>
                        {/* Hook 1: Viewer Request */}
                        <circle cx="160" cy="105" r="7" fill={selectedEdgeHook === 'viewer-request' ? '#7e22ce' : '#ffffff'} stroke="#c084fc" strokeWidth="2" />
                        <line x1="160" y1="105" x2="160" y2="70" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(115, 48)" onClick={() => setSelectedEdgeHook('viewer-request')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'viewer-request' ? '#7e22ce' : '#ffffff'} stroke="#c084fc" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'viewer-request' ? '#ffffff' : '#6b21a8'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Viewer Req</text>
                        </g>

                        {/* Hook 2: Viewer Response */}
                        <circle cx="160" cy="145" r="7" fill={selectedEdgeHook === 'viewer-response' ? '#7e22ce' : '#ffffff'} stroke="#c084fc" strokeWidth="2" />
                        <line x1="160" y1="145" x2="160" y2="180" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(115, 180)" onClick={() => setSelectedEdgeHook('viewer-response')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'viewer-response' ? '#7e22ce' : '#ffffff'} stroke="#c084fc" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'viewer-response' ? '#ffffff' : '#6b21a8'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Viewer Res</text>
                        </g>

                        {/* Disabled Hooks */}
                        <circle cx="420" cy="105" r="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="420" y="68" fill="#94a3b8" fontSize="7.5" textAnchor="middle" fontWeight="bold">Origin Req</text>
                        <text x="420" y="77" fill="#ef4444" fontSize="6.5" textAnchor="middle" fontWeight="bold">(Blocked)</text>
                        <line x1="405" y1="65" x2="435" y2="79" stroke="#ef4444" strokeWidth="1.2" />

                        <circle cx="420" cy="145" r="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="420" y="180" fill="#94a3b8" fontSize="7.5" textAnchor="middle" fontWeight="bold">Origin Res</text>
                        <text x="420" y="189" fill="#ef4444" fontSize="6.5" textAnchor="middle" fontWeight="bold">(Blocked)</text>
                        <line x1="405" y1="177" x2="435" y2="191" stroke="#ef4444" strokeWidth="1.2" />
                      </>
                    )}

                    {edgeTechView === 'lambda-edge' && (
                      <>
                        {/* Hook 1: Viewer Request */}
                        <circle cx="160" cy="105" r="7" fill={selectedEdgeHook === 'viewer-request' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="2" />
                        <line x1="160" y1="105" x2="160" y2="70" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(115, 48)" onClick={() => setSelectedEdgeHook('viewer-request')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'viewer-request' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'viewer-request' ? '#ffffff' : '#9d174d'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Viewer Req</text>
                        </g>

                        {/* Hook 2: Origin Request */}
                        <circle cx="425" cy="105" r="7" fill={selectedEdgeHook === 'origin-request' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="2" />
                        <line x1="425" y1="105" x2="425" y2="70" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(380, 48)" onClick={() => setSelectedEdgeHook('origin-request')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'origin-request' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'origin-request' ? '#ffffff' : '#9d174d'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Origin Req</text>
                        </g>

                        {/* Hook 3: Origin Response */}
                        <circle cx="425" cy="145" r="7" fill={selectedEdgeHook === 'origin-response' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="2" />
                        <line x1="425" y1="145" x2="425" y2="180" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(380, 180)" onClick={() => setSelectedEdgeHook('origin-response')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'origin-response' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'origin-response' ? '#ffffff' : '#9d174d'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Origin Res</text>
                        </g>

                        {/* Hook 4: Viewer Response */}
                        <circle cx="160" cy="145" r="7" fill={selectedEdgeHook === 'viewer-response' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="2" />
                        <line x1="160" y1="145" x2="160" y2="180" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3 3" />
                        <g transform="translate(115, 180)" onClick={() => setSelectedEdgeHook('viewer-response')} className="cursor-pointer select-none">
                          <rect width="90" height="22" rx="11" fill={selectedEdgeHook === 'viewer-response' ? '#db2777' : '#ffffff'} stroke="#ec4899" strokeWidth="1.5" className="transition-all duration-200 shadow-sm" />
                          <text x="45" y="14" fill={selectedEdgeHook === 'viewer-response' ? '#ffffff' : '#9d174d'} fontSize="8.5" textAnchor="middle" fontWeight="bold">Viewer Res</text>
                        </g>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* Dynamic Hook Explanation Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-600" /> Active Hook: {edgeHookDetails[selectedEdgeHook].title}
                  </span>
                  <span className="badge badge-purple">Lifecycle Trigger</span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-3">{edgeHookDetails[selectedEdgeHook].trigger}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg">
                    <span className="font-bold text-indigo-700 block mb-1 text-[10px]">CLOUDFRONT FUNCTIONS</span>
                    <p className="text-[10.5px] text-slate-650 leading-relaxed">{edgeHookDetails[selectedEdgeHook].cff}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                    <span className="font-bold text-rose-700 block mb-1 text-[10px]">LAMBDA@EDGE</span>
                    <p className="text-[10.5px] text-slate-650 leading-relaxed">{edgeHookDetails[selectedEdgeHook].le}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Table Summary */}
            <div className="lg:col-span-4 sv-card">
              <h3 className="sv-card-title text-purple-700">
                <Layers className="w-5 h-5" /> Capability Specs Comparison
              </h3>
              <div className="space-y-4 text-xs leading-relaxed mt-2">
                <div className="border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Runtime Languages</span>
                  <p className="text-slate-500 font-mono text-[10px]">
                    CF Functions: JavaScript (ES6 syntax isolated subset)<br />
                    Lambda@Edge: Node.js, Python (Full libraries supported)
                  </p>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Max Memory Capacity</span>
                  <p className="text-slate-500 font-mono text-[10px]">
                    CF Functions: 2 MB<br />
                    Lambda@Edge: Up to 128 MB (Viewer), 3 GB (Origin)
                  </p>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Max Execution Time Limit</span>
                  <p className="text-slate-500 font-mono text-[10px]">
                    CF Functions: Under 1 millisecond<br />
                    Lambda@Edge: 5 seconds (Viewer), 30 seconds (Origin)
                  </p>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 block text-[11px]">Scale Capacity</span>
                  <p className="text-slate-500 font-mono text-[10px]">
                    CF Functions: Millions of RPS, zero cold starts<br />
                    Lambda@Edge: Tens of thousands RPS, minor cold starts
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">Network Access &amp; Filesystem</span>
                  <p className="text-slate-500 font-mono text-[10px]">
                    CF Functions: No network access, no /tmp space<br />
                    Lambda@Edge: Full HTTP client access, read/write /tmp files
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AMAZON DYNAMODB DEEP DIVE [NEW]                                    */}
      {/* ========================================================================= */}
      {activeTab === 'dynamodb' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Card: Key Concepts & Capacity Slider */}
            <div className="lg:col-span-6 sv-card flex flex-col justify-between">
              <div>
                <h3 className="sv-card-title text-blue-600">
                  <Database className="w-5 h-5" /> DynamoDB Core Architecture &amp; Capacity
                </h3>
                <p className="sv-card-desc mb-4">
                  DynamoDB stores data on SSD partitions. Hash/Partition Keys determine physical partition placement via hashing, while Sort Keys group items physically to enable fast range queries.
                </p>

                {/* Capacity Selector */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDdbCapacityMode('provisioned')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ddbCapacityMode === 'provisioned' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Provisioned Capacity (RCUs/WCUs)
                    </button>
                    <button
                      onClick={() => setDdbCapacityMode('on-demand')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ddbCapacityMode === 'on-demand' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      On-Demand Mode (Pay-per-Request)
                    </button>
                  </div>

                  {ddbCapacityMode === 'provisioned' ? (
                    <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="font-semibold text-slate-700">Read Capacity Units (RCUs):</span>
                          <span className="font-bold text-blue-600">{ddbRCU} Units (~{ddbRCU} KB/sec)</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="1000"
                          step="50"
                          value={ddbRCU}
                          onChange={(e) => setDdbRCU(Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="font-semibold text-slate-700">Write Capacity Units (WCUs):</span>
                          <span className="font-bold text-blue-600">{ddbWCU} Units (~{ddbWCU} KB/sec)</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="500"
                          step="25"
                          value={ddbWCU}
                          onChange={(e) => setDdbWCU(Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-250 leading-relaxed font-mono">
                        * Provisioned capacity charges apply per hour regardless of active utilization. Best for stable, predictable workloads.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 text-xs text-emerald-800 leading-relaxed">
                      <span className="font-bold block uppercase tracking-wider text-[10px] text-emerald-600 mb-1">🟢 ON-DEMAND AUTO-SCALING CAPACITY ACTIVE</span>
                      DynamoDB scales instantly to handle thousands of requests per second with zero RCU/WCU limits. Charges are billed strictly per million read/write requests. Best for unpredictable, spikey serverless application workloads.
                    </div>
                  )}
                </div>

                {/* Primary vs GSI/LSI Index visuals */}
                <div className="mt-5 space-y-2.5">
                  <span className="sv-label">Index Structure Explanation:</span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-200 p-3 rounded-lg bg-white">
                      <span className="font-bold text-slate-900 block mb-1">🔑 Primary Key Structure</span>
                      Includes partition key (e.g. `UserID`) and optional sort key (`OrderTimestamp`) for sorting unique records.
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg bg-white">
                      <span className="font-bold text-slate-900 block mb-1">⚡ GSIs &amp; LSIs</span>
                      **Global Secondary Indexes (GSI)** copy primary data attributes into secondary tables using new custom keys, supporting queries on any attribute.
                    </div>
                  </div>
                </div>
              </div>

              {/* S3 export integrations */}
              <div className="border-t border-slate-100 pt-4 mt-4 bg-slate-50 p-4 rounded-xl text-xs">
                <span className="font-bold block text-slate-800 text-[11px] mb-1 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600" /> S3 Imports, Exports, and PITR Backups
                </span>
                <p className="text-slate-650 leading-relaxed text-[11.5px]">
                  **Point-in-Time Recovery (PITR)** provides continuous backups protecting your databases against accidental writes or deletions, with zero overhead. DynamoDB also integrates directly with S3, exporting tables to S3 JSON/Parquet formats for EMR analytics or importing massive S3 datasets directly without consuming RCU/WCU capacity.
                </p>
              </div>
            </div>

            {/* Right Card: DAX Caching & Global Tables replication */}
            <div className="lg:col-span-6 space-y-6">
              {/* DAX inline vs ElastiCache Cache-aside */}
              <div className="sv-card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-5 h-5 text-blue-500" /> DynamoDB Accelerator (DAX) Cache
                  </h3>
                  <div className="flex gap-2">
                    <button
                      disabled={daxSimState !== 'idle'}
                      onClick={() => triggerDaxSim('hit')}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-500"
                    >
                      Simulate Hit
                    </button>
                    <button
                      disabled={daxSimState !== 'idle'}
                      onClick={() => triggerDaxSim('miss')}
                      className="px-2.5 py-1 bg-slate-700 text-white rounded text-[10px] font-semibold hover:bg-slate-600"
                    >
                      Simulate Miss
                    </button>
                  </div>
                </div>

                <p className="sv-card-desc mb-3">
                  **DAX** is a fully managed, in-memory **inline write-through cache** sitting directly in front of DynamoDB. In contrast, **ElastiCache (Redis/Memcached)** is a **cache-aside** design requiring your application to manually query and write back state attributes.
                </p>

                {/* Animated Console */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 h-[160px] flex flex-col font-mono text-[10.5px] text-slate-700 shadow-inner">
                  <div className="border-b border-slate-200 pb-1.5 mb-2 text-slate-500 flex justify-between">
                    <span>DAX In-Memory Pipeline Tracker</span>
                    <span className={`badge ${daxSimState === 'hit' ? 'badge-green' : daxSimState === 'miss' ? 'badge-orange' : 'badge-purple'}`}>
                      {daxSimState.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {daxLogs.length === 0 ? (
                      <span className="text-slate-500 italic block text-center mt-8">Trigger DAX Hit or Miss simulation to observe query latencies.</span>
                    ) : (
                      daxLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('Hit') ? 'text-emerald-700 font-semibold bg-emerald-50/50 px-1.5 rounded' : log.includes('Miss') ? 'text-amber-700 font-bold bg-amber-50/50 px-1.5 rounded' : 'text-slate-650'}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Active-Active Global Tables Replication */}
              <div className="sv-card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-5 h-5 text-blue-500" /> Active-Active Global Tables Replication
                  </h3>
                  <button
                    disabled={globalTableSyncState !== 'idle'}
                    onClick={runGlobalTableWrite}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-500 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${globalTableSyncState === 'syncing' ? 'animate-spin' : ''}`} /> Write Global Table
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Regions display */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-center text-slate-700">
                    <div className={`border p-3 rounded-xl transition-all ${
                      ddbActiveRegion === 'us-east-1' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                    } cursor-pointer`} onClick={() => setDdbActiveRegion('us-east-1')}>
                      🇺🇸 US-EAST-1 (N. Virginia)<br />
                      <span className="text-[10px] font-normal text-slate-400">Active Node 1</span>
                    </div>
                    <div className={`border p-3 rounded-xl transition-all ${
                      ddbActiveRegion === 'eu-west-1' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                    } cursor-pointer`} onClick={() => setDdbActiveRegion('eu-west-1')}>
                      🇪🇺 EU-WEST-1 (Ireland)<br />
                      <span className="text-[10px] font-normal text-slate-400">Active Node 2</span>
                    </div>
                  </div>

                  {/* Real-time Global Logs */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[120px] font-mono text-[10px] text-slate-700 overflow-y-auto space-y-1 pr-1 shadow-inner">
                    {globalTableLogs.length === 0 ? (
                      <span className="text-slate-500 italic block text-center mt-6">Click "Write Global Table" to view the active-active multi-region synchronization logs.</span>
                    ) : (
                      globalTableLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('Success') || log.includes('Synced') ? 'text-emerald-700 font-semibold bg-emerald-50/50 px-1 rounded' : 'text-slate-600'}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DynamoDB Streams vs Kinesis Data Streams Processing */}
          <div className="sv-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="sv-card-title text-blue-600 mb-0">
                <Sliders className="w-5 h-5" /> Stream Processing: DynamoDB Streams vs. Amazon Kinesis
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setDdbStreamSource('ddb-streams')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    ddbStreamSource === 'ddb-streams' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  DynamoDB Streams
                </button>
                <button
                  onClick={() => setDdbStreamSource('kinesis-streams')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    ddbStreamSource === 'kinesis-streams' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Kinesis Data Streams
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 border border-slate-200 rounded-xl p-5 flex items-center justify-center min-h-[220px] shadow-inner bg-slate-50 sv-svg-bg">
                {ddbStreamSource === 'ddb-streams' ? (
                  <svg className="w-full max-w-[580px] h-[160px]" viewBox="0 0 580 160">
                    <g transform="translate(10, 30)">
                      <rect width="110" height="90" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                      <text x="55" y="35" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                      <text x="55" y="55" fill="#1e40af" fontSize="9" textAnchor="middle">Table Mutations</text>
                      <text x="55" y="72" fill="#475569" fontSize="8" textAnchor="middle">INSERT/MODIFY</text>
                    </g>
                    
                    <path d="M 120 75 H 220" fill="none" stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrow-blue)" className="active-flow-line-blue" />
                    
                    <g transform="translate(220, 30)">
                      <rect width="140" height="90" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
                      <text x="70" y="32" fill="#1e40af" fontSize="10" fontWeight="bold" textAnchor="middle">⚡ DDB STREAM</text>
                      <text x="70" y="52" fill="#1d4ed8" fontSize="9" textAnchor="middle">1 Year Retention</text>
                      <text x="70" y="70" fill="#475569" fontSize="8" textAnchor="middle">Ordered log per key</text>
                    </g>

                    <path d="M 360 75 H 460" fill="none" stroke="#059669" strokeWidth="2.5" markerEnd="url(#arrow-green)" className="active-flow-line-green" />

                    <g transform="translate(460, 40)">
                      <rect width="110" height="70" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="2" />
                      <text x="55" y="32" fill="#7e22ce" fontSize="10" fontWeight="bold" textAnchor="middle">⚡ LAMBDA</text>
                      <text x="55" y="48" fill="#581c87" fontSize="9" textAnchor="middle">Triggers handler</text>
                    </g>
                  </svg>
                ) : (
                  <svg className="w-full max-w-[580px] h-[160px]" viewBox="0 0 580 160">
                    <g transform="translate(10, 30)">
                      <rect width="110" height="90" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                      <text x="55" y="35" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                      <text x="55" y="55" fill="#1e40af" fontSize="9" textAnchor="middle">Table mutations</text>
                    </g>
                    
                    <path d="M 120 75 H 200" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                    
                    <g transform="translate(200, 20)">
                      <rect width="180" height="110" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
                      <text x="90" y="28" fill="#b45309" fontSize="11" fontWeight="bold" textAnchor="middle">🔥 KINESIS DATA STREAM</text>
                      <text x="90" y="48" fill="#78350f" fontSize="9" textAnchor="middle">1 Year Retention</text>
                      <text x="90" y="65" fill="#d97706" fontSize="8" textAnchor="middle">Split into shards (buffer)</text>
                      <text x="90" y="82" fill="#475569" fontSize="8" textAnchor="middle">Multiple concurrent readers</text>
                    </g>

                    <path d="M 380 75 H 460" fill="none" stroke="#d97706" strokeWidth="2.5" markerEnd="url(#arrow)" />

                    <g transform="translate(460, 30)">
                      <rect width="110" height="90" rx="8" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                      <text x="55" y="28" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">DOWNSTREAMS</text>
                      <text x="55" y="48" fill="#1e293b" fontSize="8" textAnchor="middle">Lambda, Firehose</text>
                      <text x="55" y="65" fill="#1e293b" fontSize="8" textAnchor="middle">EMR analytics</text>
                    </g>
                  </svg>
                )}
              </div>

              <div className="lg:col-span-4 text-xs leading-relaxed space-y-3">
                {ddbStreamSource === 'ddb-streams' ? (
                  <>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">What is DynamoDB Streams?</span>
                    <p className="text-slate-600">
                      DynamoDB Streams capture a time-ordered sequence of item-level mutations (inserts, updates, deletes) in your table, storing these records for exactly **24 hours**.
                    </p>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Key Strengths</span>
                    <p className="text-slate-600">
                      Guarantees deduplicated item sequencing and ordered delivery per partition key. Best for immediate transactional reactions, search indexing updates (syncing with Elasticsearch/OpenSearch), or triggering confirmation emails.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">What is Amazon Kinesis Streams Integration?</span>
                    <p className="text-slate-600">
                      Integrates your table directly with a Kinesis Data Stream. Table mutations are exported instantly, allowing data retention periods of up to **1 year (365 days)**.
                    </p>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Key Strengths</span>
                    <p className="text-slate-600">
                      Supports multiple consumer pipelines simultaneously (Fan-out). Best for massive real-time big data analytics, auditing databases across months, or piping mutations into Firehose/S3 data lakes.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AMAZON API GATEWAY & STEP FUNCTIONS [NEW]                         */}
      {/* ========================================================================= */}
      {activeTab === 'api-gateway' && (
        <div className="space-y-6">
          
          {/* Edge, Regional vs Private APIs */}
          <div className="sv-card">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="sv-card-title text-purple-700 mb-0">
                <Globe className="w-5 h-5" /> 1. API Gateway Endpoint Types
              </h3>
              <div className="flex gap-2">
                {(['edge', 'regional', 'private'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setApigwEndpointType(type)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      apigwEndpointType === type ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'edge' ? 'Edge-Optimized' : type === 'regional' ? 'Regional' : 'Private (VPC)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 border border-slate-200 rounded-xl p-4 flex items-center justify-center min-h-[220px] shadow-inner bg-slate-50 sv-svg-bg">
                {apigwEndpointType === 'edge' && (
                  <svg className="w-full max-w-[580px] h-[160px]" viewBox="0 0 580 160">
                    <text x="20" y="24" fill="#475569" fontSize="9" fontWeight="bold">EDGE-OPTIMIZED ENDPOINT PIPELINE</text>
                    <g transform="translate(10, 50)">
                      <circle cx="30" cy="40" r="22" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                      <text x="30" y="44" fill="#475569" fontSize="9" textAnchor="middle" fontWeight="bold">USER</text>
                    </g>
                    <path d="M 65 90 H 150" fill="none" stroke="#7e22ce" strokeWidth="2" markerEnd="url(#arrow)" />
                    <g transform="translate(150, 40)">
                      <rect width="110" height="80" rx="8" fill="#fdf2f8" stroke="#db2777" strokeWidth="2" />
                      <text x="55" y="32" fill="#db2777" fontSize="10" fontWeight="bold" textAnchor="middle">CLOUDFRONT</text>
                      <text x="55" y="48" fill="#701a75" fontSize="8" textAnchor="middle">Global POP Edge</text>
                      <text x="55" y="62" fill="#831843" fontSize="8" textAnchor="middle">TLS Handshake close</text>
                    </g>
                    <path d="M 260 90 H 360" fill="none" stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#arrow-blue)" className="active-flow-line-blue" />
                    <g transform="translate(360, 40)">
                      <rect width="130" height="80" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="2" />
                      <text x="65" y="32" fill="#7e22ce" fontSize="10" fontWeight="bold" textAnchor="middle">API GATEWAY</text>
                      <text x="65" y="48" fill="#581c87" fontSize="8" textAnchor="middle">AWS Region Node</text>
                      <text x="65" y="62" fill="#64748b" fontSize="8" textAnchor="middle">Routes requests</text>
                    </g>
                  </svg>
                )}

                {apigwEndpointType === 'regional' && (
                  <svg className="w-full max-w-[580px] h-[160px]" viewBox="0 0 580 160">
                    <text x="20" y="24" fill="#475569" fontSize="9" fontWeight="bold">REGIONAL ENDPOINT PIPELINE</text>
                    <g transform="translate(10, 50)">
                      <circle cx="30" cy="40" r="22" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                      <text x="30" y="44" fill="#475569" fontSize="9" textAnchor="middle" fontWeight="bold">USER</text>
                    </g>
                    <path d="M 65 90 H 220" fill="none" stroke="#7e22ce" strokeWidth="2.5" markerEnd="url(#arrow)" className="active-flow-line" />
                    <g transform="translate(220, 40)">
                      <rect width="160" height="80" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="2.5" />
                      <text x="80" y="32" fill="#7e22ce" fontSize="11" fontWeight="bold" textAnchor="middle">REGIONAL API GATEWAY</text>
                      <text x="80" y="50" fill="#581c87" fontSize="8" textAnchor="middle">Same region as client app</text>
                      <text x="80" y="65" fill="#64748b" fontSize="8" textAnchor="middle">Bypasses CloudFront POPs</text>
                    </g>
                  </svg>
                )}

                {apigwEndpointType === 'private' && (
                  <svg className="w-full max-w-[580px] h-[160px]" viewBox="0 0 580 160">
                    <text x="20" y="24" fill="#475569" fontSize="9" fontWeight="bold">PRIVATE VPC ENDPOINT PIPELINE</text>
                    <g transform="translate(10, 40)">
                      <rect width="110" height="80" rx="8" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                      <text x="55" y="32" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">VPC CLIENT</text>
                      <text x="55" y="50" fill="#1e293b" fontSize="8" textAnchor="middle">EC2 inside Private</text>
                      <text x="55" y="62" fill="#1e293b" fontSize="8" textAnchor="middle">VPC Subnet</text>
                    </g>
                    <path d="M 120 80 H 220" fill="none" stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#arrow-blue)" className="active-flow-line-blue" />
                    <g transform="translate(220, 40)">
                      <rect width="130" height="80" rx="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
                      <text x="65" y="32" fill="#1e40af" fontSize="9" fontWeight="bold" textAnchor="middle">🔌 VPC INTERFACE ENI</text>
                      <text x="65" y="50" fill="#1d4ed8" fontSize="8" textAnchor="middle">Powered by PrivateLink</text>
                      <text x="65" y="62" fill="#64748b" fontSize="8" textAnchor="middle">Bypasses Internet</text>
                    </g>
                    <path d="M 350 80 H 430" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
                    <g transform="translate(430, 40)">
                      <rect width="120" height="80" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="1.5" />
                      <text x="60" y="32" fill="#7e22ce" fontSize="9" fontWeight="bold" textAnchor="middle">PRIVATE APIGW</text>
                      <text x="60" y="50" fill="#581c87" fontSize="8" textAnchor="middle">Only resolvable within</text>
                      <text x="60" y="62" fill="#581c87" fontSize="8" textAnchor="middle">corporate subnets</text>
                    </g>
                  </svg>
                )}
              </div>

              <div className="lg:col-span-4 text-xs leading-relaxed space-y-3">
                {apigwEndpointType === 'edge' && (
                  <>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Edge-Optimized APIs</span>
                    <p className="text-slate-650">
                      Routes client requests globally through the closest **Amazon CloudFront Edge Location**. 
                    </p>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Use Case</span>
                    <p className="text-slate-650">
                      Best for mobile or web clients scattered globally. Decreases SSL handshake times by terminating TLS closer to the user location.
                    </p>
                  </>
                )}

                {apigwEndpointType === 'regional' && (
                  <>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Regional APIs</span>
                    <p className="text-slate-655">
                      Bypasses CloudFront POP edge caches entirely, serving HTTP requests directly from the specific AWS region node hosting the API.
                    </p>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Use Case</span>
                    <p className="text-slate-655">
                      Best when combined with custom global CDN pipelines or for high-throughput server-to-server calls occurring inside the same geographic area.
                    </p>
                  </>
                )}

                {apigwEndpointType === 'private' && (
                  <>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Private APIs</span>
                    <p className="text-slate-650">
                      Exposes API Gateway endpoints exclusively inside your secure virtual network via **VPC Interface Endpoints (PrivateLink ENIs)**.
                    </p>
                    <span className="font-bold text-slate-800 uppercase block tracking-wider text-[10px]">Use Case</span>
                    <p className="text-slate-650">
                      Best for highly confidential corporate applications, securing microservice communications, and meeting compliance guidelines by bypassing public internet routing.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Direct AWS service integrations vs Lambda proxies */}
            <div className="lg:col-span-6 sv-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-5 h-5 text-purple-600" /> Direct AWS Service Integrations
                  </h3>
                  <select
                    value={apigwIntegrationType}
                    onChange={(e) => setApigwIntegrationType(e.target.value as 'lambda-proxy' | 'direct-kinesis')}
                    className="text-[10px] border border-slate-350 p-1 rounded font-bold"
                  >
                    <option value="lambda-proxy">APIGW → Lambda Proxy (Standard)</option>
                    <option value="direct-kinesis">APIGW → Kinesis (Direct Service)</option>
                  </select>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed mb-4">
                  Most serverless apps route requests through Lambda compute. However, for high-throughput buffering pipelines (e.g. streaming telemetry), API Gateway can **integrate directly with AWS Services**, executing VTL Mapping templates to format requests without running Lambda.
                </p>

                {/* Diagrams */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[160px] flex items-center justify-center">
                  {apigwIntegrationType === 'lambda-proxy' ? (
                    <svg className="w-full max-w-[420px] h-[100px]" viewBox="0 0 420 100">
                      <g transform="translate(10, 25)">
                        <rect width="80" height="50" rx="4" fill="#fdf2f8" stroke="#db2777" strokeWidth="1.5" />
                        <text x="40" y="28" fill="#db2777" fontSize="8" fontWeight="bold" textAnchor="middle">API GATEWAY</text>
                      </g>
                      <path d="M 90 50 H 170" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow)" />
                      <g transform="translate(170, 25)">
                        <rect width="80" height="50" rx="4" fill="#faf5ff" stroke="#9333ea" strokeWidth="1.5" />
                        <text x="40" y="28" fill="#7e22ce" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ LAMBDA</text>
                      </g>
                      <path d="M 250 50 H 330" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow)" />
                      <g transform="translate(330, 25)">
                        <rect width="80" height="50" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
                        <text x="40" y="28" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="middle">🔥 KINESIS</text>
                      </g>
                    </svg>
                  ) : (
                    <svg className="w-full max-w-[420px] h-[100px]" viewBox="0 0 420 100">
                      <g transform="translate(10, 25)">
                        <rect width="90" height="50" rx="4" fill="#fdf2f8" stroke="#db2777" strokeWidth="2" />
                        <text x="45" y="24" fill="#db2777" fontSize="8" fontWeight="bold" textAnchor="middle">API GATEWAY</text>
                        <text x="45" y="38" fill="#701a75" fontSize="7" textAnchor="middle">VTL Template mapping</text>
                      </g>
                      
                      {/* Flow Path */}
                      <path d="M 100 50 H 290" fill="none" stroke="#0d9488" strokeWidth="3" markerEnd="url(#arrow)" className="active-flow-line" />
                      <text x="195" y="38" fill="#0d9488" fontSize="8" textAnchor="middle" fontWeight="bold">Direct Action (Bypass Lambda)</text>

                      <g transform="translate(290, 25)">
                        <rect width="90" height="50" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
                        <text x="45" y="28" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">🔥 KINESIS STREAM</text>
                      </g>
                    </svg>
                  )}
                </div>
              </div>

              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100 text-xs mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-purple-955 block">🔐 Endpoint Security &amp; Authorizers</span>
                  <select
                    value={apigwAuthType}
                    onChange={(e) => setApigwAuthType(e.target.value as 'cognito' | 'lambda-auth' | 'iam')}
                    className="text-[10px] border border-purple-250 p-1 rounded font-bold bg-white text-purple-955 outline-none"
                  >
                    <option value="cognito">Cognito Pools (JWT)</option>
                    <option value="lambda-auth">Lambda Custom Token Auth</option>
                    <option value="iam">IAM Signature v4 Keys</option>
                  </select>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed font-mono mt-1">
                  {apigwAuthType === 'cognito' ? '🛡️ Cognito Pool: API Gateway verifies incoming client JWT tokens against the User Pool public keys instantly with zero execution cold starts.' :
                   apigwAuthType === 'lambda-auth' ? '⚙️ Lambda Authorizer: Custom token verification runs your code to return an IAM policy document and cache validation mappings.' :
                   '🔑 IAM SigV4: Restricts endpoint access strictly to clients with AWS credentials, validating HTTP signatures against secret keys.'}
                </p>
              </div>
            </div>

            {/* AWS Step Functions orchestration State Machine */}
            <div className="lg:col-span-6 sv-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-5 h-5 text-teal-600" /> AWS Step Functions State Machine
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      disabled={stepFunctionState !== 'idle'}
                      onClick={() => runStepFunction(false)}
                      className="px-2.5 py-1 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-500"
                    >
                      Process Success Order
                    </button>
                    <button
                      disabled={stepFunctionState !== 'idle'}
                      onClick={() => runStepFunction(true)}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-500"
                    >
                      Process Failed Order
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed mb-4">
                  Step Functions sequences multiple AWS services into robust state machines. Under failure states, it handles retries, catch blocks, and compensation workflows to keep data synchronized.
                </p>

                {/* Vertical Order Processing visual */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 font-sans text-xs shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      stepFunctionState === 'validate' ? 'bg-amber-400 text-slate-900 animate-pulse' :
                      stepFunctionState === 'charge' || stepFunctionState === 'ship' || stepFunctionState === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>1</div>
                    <span className="font-semibold text-slate-700">Step 1: ValidateOrder</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      stepFunctionState === 'charge' ? 'bg-amber-400 text-slate-900 animate-pulse' :
                      stepFunctionState === 'failed' ? 'bg-rose-600 text-white' :
                      stepFunctionState === 'ship' || stepFunctionState === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>2</div>
                    <span className="font-semibold text-slate-700">Step 2: ChargeAccount (Visa Credit Card payment)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                      stepFunctionState === 'ship' ? 'bg-amber-400 text-slate-900 animate-pulse' :
                      stepFunctionState === 'completed' ? 'bg-emerald-600 text-white' :
                      stepFunctionState === 'failed' ? 'bg-rose-300 text-rose-900' : 'bg-slate-200 text-slate-500'
                    }`}>3</div>
                    <span className="font-semibold text-slate-700">
                      {stepFunctionState === 'failed' ? 'Step 3: Compensation (Declined payment rollback)' : 'Step 3: ShipItem (sns notifications)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Console log output */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[90px] font-mono text-[9.5px] text-slate-700 overflow-y-auto space-y-1.5 mt-4 shadow-inner">
                {stepFunctionLogs.length === 0 ? (
                  <span className="text-slate-550 italic block text-center pt-5">Click a scenario button to trigger the order process state machine.</span>
                ) : (
                  stepFunctionLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('Completed') || log.includes('Success') ? 'text-emerald-700 font-semibold bg-emerald-50/50 px-1 rounded' : log.includes('Error') || log.includes('compensating') ? 'text-rose-700 font-semibold bg-rose-50/50 px-1 rounded' : 'text-slate-600'}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: AMAZON COGNITO AUTHENTICATION & SECURITY [NEW]                     */}
      {/* ========================================================================= */}
      {activeTab === 'cognito' && (
        <div className="space-y-6">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Lock className="w-5 h-5 text-red-500 animate-pulse" /> Security Architecture: Amazon Cognito Identity &amp; Directory Pools
            </h2>
            <p className="sv-card-desc">
              Amazon Cognito secures client applications using a two-stage approach: **User Pools** act as user directories (identity management), and **Identity Pools** handle authorization by exchanging those directories for temporary AWS credentials mapping standard IAM roles.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cognito Federated JWT Auth flow */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Cognito Federated Identity credentials exchange pipeline</h3>
                  <p className="text-[11px] text-slate-500">Step-by-step credentials trade-in lifecycle from login to STS credential maps</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={cognitoFlowStep === 3}
                    onClick={advanceCognitoFlow}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-500 disabled:bg-slate-200 disabled:text-slate-450"
                  >
                    {cognitoFlowStep === 0 ? 'Step 1: User Directory Authenticate' : cognitoFlowStep === 1 ? 'Step 2: Federated Token Exchange' : cognitoFlowStep === 2 ? 'Step 3: STS Credential Fetch' : 'Completed'}
                  </button>
                  <button
                    onClick={resetCognitoFlow}
                    className="p-1 bg-slate-100 text-slate-600 border border-slate-200 rounded hover:bg-slate-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full h-[220px] rounded-xl relative overflow-hidden shadow-inner border border-slate-200 bg-slate-50">
                <svg className="w-full h-full sv-svg-bg" viewBox="0 0 700 220">
                  <defs>
                    <marker id="cog-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker id="cog-arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#7e22ce" />
                    </marker>
                  </defs>

                  {/* ==================== AMAZON COGNITO GOVERNANCE BOUNDARY ==================== */}
                  <rect x="110" y="24" width="280" height="185" rx="8" fill="none" stroke="#9333ea" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="118" y="36" fill="#9333ea" fontSize="7.5" fontWeight="extrabold">Amazon Cognito Governance Boundary</text>

                  {/* ==================== SECURE PRIVATE DATASTORE BOUNDARY ==================== */}
                  <rect x="410" y="24" width="280" height="185" rx="8" fill="none" stroke="#16a34a" strokeWidth="1.2" strokeDasharray="5,3" />
                  <text x="418" y="36" fill="#16a34a" fontSize="7.5" fontWeight="extrabold">Secure Private Datastore Boundary</text>

                  {/* Dynamic Flow Paths */}
                  {/* Path 1: Client -> CUP (Viewer Auth) */}
                  <path d="M 90 90 H 130" fill="none" stroke={cognitoFlowStep >= 1 ? '#9333ea' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#cog-arrow)" className={cognitoFlowStep >= 1 ? 'active-flow-line' : ''} />
                  
                  {/* Path 2: CUP -> Client (JWT return) */}
                  <path d="M 130 110 H 90" fill="none" stroke={cognitoFlowStep >= 1 ? '#059669' : '#cbd5e1'} strokeWidth="1.5" markerEnd="url(#cog-arrow)" />

                  {/* Path 3: Client -> CIP (Federated exchange) */}
                  <path d="M 90 130 H 280" fill="none" stroke={cognitoFlowStep >= 2 ? '#2563eb' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#cog-arrow)" className={cognitoFlowStep >= 2 ? 'active-flow-line-blue' : ''} />

                  {/* Path 4: CIP -> STS (Credentials fetch request) */}
                  <path d="M 370 100 H 430" fill="none" stroke={cognitoFlowStep >= 2 ? '#d97706' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#cog-arrow)" />

                  {/* Path 5: CIP -> Client (Temp STS credentials returned) */}
                  <path d="M 280 150 H 90" fill="none" stroke={cognitoFlowStep >= 2 ? '#059669' : '#cbd5e1'} strokeWidth="1.5" markerEnd="url(#cog-arrow)" />

                  {/* Path 6: Client -> S3 (Curved SigV4 signed access) */}
                  <path d="M 50 185 Q 330 225, 620 155" fill="none" stroke={cognitoFlowStep >= 3 ? '#059669' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#cog-arrow)" className={cognitoFlowStep >= 3 ? 'active-flow-line-green' : ''} />

                  {/* Node 1: Mobile Client */}
                  <g transform="translate(10, 50)">
                    <rect width="80" height="135" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                    <text x="40" y="16" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">CLIENT CONTEXT</text>
                    <g transform="translate(10, 28)">
                      <circle cx="30" cy="30" r="18" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                      <text x="30" y="33" fill="#475569" fontSize="9" textAnchor="middle" fontWeight="bold">💻 USER</text>
                      <text x="30" y="66" fill="#64748b" fontSize="7" textAnchor="middle">Mobile Web</text>
                      <text x="30" y="78" fill="#94a3b8" fontSize="6.5" textAnchor="middle">Client App</text>
                    </g>
                  </g>

                  {/* Node 2: Cognito User Pool */}
                  <g transform="translate(130, 65)">
                    <rect width="90" height="90" rx="10" fill={cognitoFlowStep === 1 ? 'rgba(168, 85, 247, 0.08)' : '#faf5ff'} stroke="#9333ea" strokeWidth="2.5" />
                    <text x="45" y="22" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">USER POOL</text>
                    <text x="45" y="36" fill="#581c87" fontSize="7" textAnchor="middle">User Directory</text>
                    
                    <rect x="8" y="48" width="74" height="32" rx="3" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
                    <text x="45" y="62" fill="#7e22ce" fontSize="8" textAnchor="middle" fontWeight="bold">JWT ISSUED</text>
                    <text x="45" y="74" fill="#a855f7" fontSize="6" textAnchor="middle">ID &amp; Access Token</text>
                  </g>

                  {/* Node 3: Cognito Identity Pool */}
                  <g transform="translate(280, 65)">
                    <rect width="90" height="90" rx="10" fill={cognitoFlowStep === 2 ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff'} stroke="#2563eb" strokeWidth="2.5" />
                    <text x="45" y="22" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">IDENTITY POOL</text>
                    <text x="45" y="36" fill="#1e40af" fontSize="7" textAnchor="middle">Federated Auth</text>
                    
                    <rect x="8" y="48" width="74" height="32" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                    <text x="45" y="62" fill="#1e40af" fontSize="8" textAnchor="middle" fontWeight="bold">IAM MAPS</text>
                    <text x="45" y="74" fill="#3b82f6" fontSize="6" textAnchor="middle">Role-Assumed Keys</text>
                  </g>

                  {/* Node 4: AWS STS Gateway */}
                  <g transform="translate(430, 65)">
                    <rect width="90" height="90" rx="10" fill="#fffdfa" stroke="#d97706" strokeWidth="2" />
                    <text x="45" y="22" fill="#b45309" fontSize="9.5" fontWeight="bold" textAnchor="middle">🔑 AWS STS</text>
                    <text x="45" y="36" fill="#78350f" fontSize="7" textAnchor="middle">Security Token Svc</text>
                    
                    <rect x="8" y="48" width="74" height="32" rx="3" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
                    <text x="45" y="62" fill="#b45309" fontSize="8.5" textAnchor="middle" fontWeight="bold">TEMP KEYS</text>
                    <text x="45" y="74" fill="#fbbf24" fontSize="6" textAnchor="middle">Session Credentials</text>
                  </g>

                  {/* Node 5: Private S3 Bucket */}
                  <g transform="translate(570, 65)">
                    <rect width="100" height="90" rx="10" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
                    <text x="50" y="22" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 SECURE S3</text>
                    <text x="50" y="36" fill="#166534" fontSize="7" textAnchor="middle">Private Uploads</text>
                    
                    {cognitoFlowStep === 3 ? (
                      <g transform="translate(8, 48)">
                        <rect width="84" height="32" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" />
                        <text x="42" y="62" fill="#15803d" fontSize="8" textAnchor="middle" fontWeight="bold">🔓 ACCESS</text>
                        <text x="42" y="74" fill="#166534" fontSize="6" textAnchor="middle">Signed SigV4 ok</text>
                      </g>
                    ) : (
                      <g transform="translate(8, 48)">
                        <rect width="84" height="32" rx="3" fill="#fde8eb" stroke="#f43f5e" strokeWidth="1" />
                        <text x="42" y="62" fill="#dc2626" fontSize="8" textAnchor="middle" fontWeight="bold">🔒 BLOCKED</text>
                        <text x="42" y="74" fill="#f43f5e" fontSize="6" textAnchor="middle">Unauthenticated</text>
                      </g>
                    )}
                  </g>
                </svg>
              </div>

              {/* Console log traces */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-700 overflow-y-auto space-y-1 shadow-inner">
                {cognitoLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center pt-5">Click "Step 1: User Directory Authenticate" to trace the security handshake.</span>
                ) : (
                  cognitoLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('Success') || log.includes('Granted') ? 'text-emerald-700 font-semibold bg-emerald-50/50 px-1 rounded' : log.includes('STS') ? 'text-blue-700 font-semibold bg-blue-50/50 px-1 rounded' : 'text-slate-600'}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Structured Cognito vs IAM comparisons & hooks */}
            <div className="lg:col-span-4 space-y-6">
              {/* Cognito vs IAM */}
              <div className="sv-card">
                <h3 className="sv-card-title text-purple-700">
                  <UserCheck className="w-5 h-5" /> Cognito vs. IAM
                </h3>
                <div className="space-y-4 text-xs leading-relaxed mt-2">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 block text-[11px]">Cognito Pools (External Directories)</span>
                    <p className="text-slate-500 font-mono text-[10px]">
                      Authenticates public-facing web or mobile application users. Integrates directories with Google, Apple, or SAML SSO identity attributes.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">AWS IAM Roles (Internal Security)</span>
                    <p className="text-slate-500 font-mono text-[10px]">
                      Secures infrastructure services, pipeline codes (Lambda functions), or corporate employees accessing AWS Management Consoles directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Lambda Hooks triggers */}
              <div className="sv-card">
                <h3 className="sv-card-title text-purple-700">
                  <Sliders className="w-5 h-5 text-purple-500 animate-pulse" /> Custom Trigger Lambda Hooks
                </h3>
                <p className="text-[11.5px] text-slate-600 leading-relaxed mb-3">
                  Cognito supports triggering serverless Lambda functions during user sign-up/in events to validate variables or sync directories:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg" onMouseEnter={() => setCognitoTriggerHover('pre')} onMouseLeave={() => setCognitoTriggerHover(null)}>
                    <span className="font-bold text-slate-900 block">Pre-Sign Up Hook</span>
                    {cognitoTriggerHover === 'pre' ? 'Fires before registering. Custom spam checks or block domains.' : 'Hover for trigger context...'}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg" onMouseEnter={() => setCognitoTriggerHover('post')} onMouseLeave={() => setCognitoTriggerHover(null)}>
                    <span className="font-bold text-slate-900 block">Post-Confirm Hook</span>
                    {cognitoTriggerHover === 'post' ? 'Fires on code verify. Auto-creates target DynamoDB records.' : 'Hover for trigger context...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: SERVERLESS ARCHITECTURES (Blog Web, IoT, and SAGA) [NEW]          */}
      {/* ========================================================================= */}
      {activeTab === 'serverless-architectures' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Layers className="w-5 h-5" /> 🏗️ Real-World Production Serverless Architectures
            </h2>
            <p className="sv-card-desc">
              Serverless patterns leverage decoupled managed services to build extremely secure, automatically scaling, high-performance backends. Switch between three production-grade architecture blueprints below:
            </p>

            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => {
                  setActiveArchTab('blog-web');
                  setArchLogs([]);
                  setArchFlowState('idle');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeArchTab === 'blog-web' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pattern A: Full-Stack Blog Web Architecture (Hand-Drawn Replication)
              </button>
              <button
                onClick={() => {
                  setActiveArchTab('iot-pipeline');
                  setArchLogs([]);
                  setArchFlowState('idle');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeArchTab === 'iot-pipeline' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pattern B: IoT Event-Driven Ingestion &amp; Analytics
              </button>
              <button
                onClick={() => {
                  setActiveArchTab('order-saga');
                  setArchLogs([]);
                  setArchFlowState('idle');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeArchTab === 'order-saga' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Pattern C: Microservices Checkout SAGA Orchestration
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SVG Visualizer Canvas */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              
              {/* Header inside Diagram */}
              <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {activeArchTab === 'blog-web' ? 'Full-Stack Serverless Blog Web Application' :
                     activeArchTab === 'iot-pipeline' ? 'IoT Streaming Ingestion & Real-time Analytics' :
                     'E-Commerce Checkout SAGA State Machine Orchestration'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeArchTab === 'blog-web' ? 'Detailed SVG mapping of client edge distributions, CRUD compute, DAX caching, and media upload paths.' :
                     activeArchTab === 'iot-pipeline' ? 'Real-time telemetry buffering using Kinesis streams and automated Firehose data lakes.' :
                     'Multi-microservice transactions with automated failed checkout stock holds compensations.'}
                  </p>
                </div>
                
                {/* Trigger controls based on Active Arch Tab */}
                <div className="flex gap-2">
                  {activeArchTab === 'blog-web' && (
                    <>
                      <button
                        disabled={archFlowState !== 'idle'}
                        onClick={runStaticFetchSim}
                        className="px-2.5 py-1 bg-purple-600 text-white rounded text-[10px] font-bold hover:bg-purple-500 disabled:bg-slate-200 disabled:text-slate-450"
                      >
                        Static CDN Fetch
                      </button>
                      <button
                        disabled={archFlowState !== 'idle'}
                        onClick={runDynamicCrudSim}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-455"
                      >
                        Dynamic CRUD POST
                      </button>
                      <button
                        disabled={archFlowState !== 'idle'}
                        onClick={runMediaUploadSim}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-455"
                      >
                        Media Transfer Upload
                      </button>
                    </>
                  )}

                  {activeArchTab === 'iot-pipeline' && (
                    <button
                      disabled={archFlowState !== 'idle'}
                      onClick={runIotPipelineSim}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-[10px] font-bold hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-455"
                    >
                      Trigger Device Telemetry Stream
                    </button>
                  )}

                  {activeArchTab === 'order-saga' && (
                    <>
                      <button
                        disabled={archFlowState !== 'idle'}
                        onClick={() => runSagaOrderSim(false)}
                        className="px-2.5 py-1 bg-teal-600 text-white rounded text-[10px] font-bold hover:bg-teal-500 disabled:bg-slate-200"
                      >
                        Trigger Success Order
                      </button>
                      <button
                        disabled={archFlowState !== 'idle'}
                        onClick={() => runSagaOrderSim(true)}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-500 disabled:bg-slate-200"
                      >
                        Trigger Declined payment Rollback
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full h-[320px] relative rounded-xl border border-slate-200 overflow-x-auto overflow-y-hidden flex items-center justify-center p-2 shadow-inner bg-slate-50 sv-svg-bg">
                
                {/* 1. Blog Web SVG Replica */}
                {activeArchTab === 'blog-web' && (
                  <svg className="w-full min-w-[760px] h-[300px] sv-svg-bg" viewBox="0 0 760 300">
                    <defs>
                      <marker id="arch-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* AWS Region Boundary */}
                    <rect x="120" y="15" width="625" height="270" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="5,3" />
                    <text x="130" y="28" fill="#2563eb" fontSize="7.5" fontWeight="bold">AWS Cloud Boundary (us-east-1)</text>

                    {/* PATHS */}
                    {/* Path 1: Static CDN Delivery */}
                    <path d="M 70 140 L 140 50 H 260" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 380 50 H 470" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    {archFlowState === 'static-fetch' && (
                      <>
                        <path d="M 70 140 L 140 50 H 260" fill="none" stroke="#7e22ce" strokeWidth="3" className="active-flow-line" />
                        <line x1="380" y1="50" x2="470" y2="50" stroke="#7e22ce" strokeWidth="3" className="active-flow-line" />
                      </>
                    )}

                    {/* Path 2: Dynamic CRUD */}
                    <path d="M 70 150 L 140 140 H 260" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 380 140 H 415" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 475 140 H 515" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 575 140 H 625" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    {/* Streams to background Lambda to SES */}
                    <path d="M 680 170 V 220 H 570" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 510 220 H 380" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    {archFlowState === 'dynamic-crud' && (
                      <>
                        <path d="M 70 150 L 140 140 H 260" fill="none" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                        <line x1="380" y1="140" x2="415" y2="140" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                        <line x1="475" y1="140" x2="515" y2="140" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                        <line x1="575" y1="140" x2="625" y2="140" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                        <path d="M 680 170 V 220 H 570" fill="none" stroke="#2563eb" strokeWidth="2.5" className="active-flow-line-blue" />
                        <line x1="510" y1="220" x2="380" y2="220" stroke="#2563eb" strokeWidth="2.5" className="active-flow-line-blue" />
                      </>
                    )}

                    {/* Path 3: Media Upload */}
                    <path d="M 70 160 L 140 230 H 260" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 380 230 H 415" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    {/* Resizer Lambda splits optimized saved and fan-out */}
                    <path d="M 475 215 Q 500 175, 625 175" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 475 245 Q 500 265, 625 265" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    {archFlowState === 'media-upload' && (
                      <>
                        <path d="M 70 160 L 140 230 H 260" fill="none" stroke="#059669" strokeWidth="3" className="active-flow-line-green" />
                        <line x1="380" y1="230" x2="415" y2="230" stroke="#059669" strokeWidth="3" className="active-flow-line-green" />
                        <path d="M 475 215 Q 500 175, 625 175" fill="none" stroke="#059669" strokeWidth="3.5" className="active-flow-line-green" />
                        <path d="M 475 245 Q 500 265, 625 265" fill="none" stroke="#059669" strokeWidth="3.5" className="active-flow-line-green" />
                      </>
                    )}

                    {/* CLIENT CONTEXT */}
                    <g transform="translate(8, 100)">
                      <rect width="64" height="95" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                      <text x="32" y="14" fill="#64748b" fontSize="6.5" fontWeight="bold" textAnchor="middle">CLIENT ZONE</text>
                      <g transform="translate(7, 24)">
                        <circle cx="25" cy="20" r="14" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2" />
                        <text x="25" y="23" fill="#475569" fontSize="8" textAnchor="middle" fontWeight="bold">💻 USER</text>
                        <text x="25" y="46" fill="#64748b" fontSize="6.5" textAnchor="middle">Web App</text>
                        <text x="25" y="55" fill="#94a3b8" fontSize="5.5" textAnchor="middle">Client JS</text>
                      </g>
                    </g>

                    {/* Static content distribution */}
                    <g transform="translate(140, 20)">
                      <rect width="120" height="55" rx="6" fill="#fdf2f8" stroke="#db2777" strokeWidth="1.5" />
                      <text x="60" y="20" fill="#db2777" fontSize="8" fontWeight="bold" textAnchor="middle">☁️ CLOUDFRONT CDN</text>
                      <text x="60" y="34" fill="#701a75" fontSize="7" textAnchor="middle">Static Web Distribution</text>
                      <text x="60" y="44" fill="#831843" fontSize="6.5" textAnchor="middle" fontWeight="semibold">Terminates SSL Handshake</text>
                    </g>
                    <g transform="translate(470, 20)">
                      <rect width="120" height="55" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.5" />
                      <text x="60" y="18" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">🪣 STATIC S3</text>
                      <text x="60" y="32" fill="#7c2d12" fontSize="7" textAnchor="middle">static-assets-bucket</text>
                      <text x="60" y="44" fill="#0d9488" fontSize="7.5" textAnchor="middle" fontWeight="bold">🔑 OAC Secured Gate</text>
                    </g>

                    {/* CRUD dynamic API pathway */}
                    <g transform="translate(140, 110)">
                      <rect width="120" height="55" rx="6" fill="#fdf2f8" stroke="#db2777" strokeWidth="1.5" />
                      <text x="60" y="22" fill="#db2777" fontSize="8" fontWeight="bold" textAnchor="middle">📡 API GATEWAY</text>
                      <text x="60" y="38" fill="#701a75" fontSize="7.5" textAnchor="middle">RESTful CRUD API</text>
                    </g>
                    
                    {/* CRUD Lambda inside Firecracker microVM sandbox */}
                    <g transform="translate(415, 95)">
                      <rect width="60" height="70" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,2" />
                      <text x="30" y="11" fill="#7e22ce" fontSize="6.5" fontWeight="bold" textAnchor="middle">⚡ MICROVM</text>
                      <g transform="translate(10, 15)">
                        <circle cx="20" cy="20" r="16" fill="#faf5ff" stroke="#9333ea" strokeWidth="1.5" />
                        <text x="20" y="23" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">λ</text>
                        <text x="20" y="46" fill="#581c87" fontSize="7" textAnchor="middle" fontWeight="bold">CRUD</text>
                      </g>
                    </g>

                    <g transform="translate(515, 120)">
                      <rect width="60" height="35" rx="4" fill="#f0fdf4" stroke="#0d9488" strokeWidth="1.5" />
                      <text x="30" y="16" fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle">🔌 DAX</text>
                      <text x="30" y="26" fill="#115e59" fontSize="6.5" textAnchor="middle">Cache Pool</text>
                    </g>
                    <g transform="translate(625, 110)">
                      <rect width="115" height="55" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
                      <text x="57.5" y="20" fill="#1d4ed8" fontSize="8" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                      <text x="57.5" y="34" fill="#1e40af" fontSize="7.5" textAnchor="middle">Global SSD Tables</text>
                      <text x="57.5" y="44" fill="#7e22ce" fontSize="7" textAnchor="middle" fontWeight="bold">Streams Enabled</text>
                    </g>

                    {/* Notification Lambda inside Firecracker microVM sandbox */}
                    <g transform="translate(510, 185)">
                      <rect width="60" height="70" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,2" />
                      <text x="30" y="11" fill="#7e22ce" fontSize="6.5" fontWeight="bold" textAnchor="middle">⚡ MICROVM</text>
                      <g transform="translate(10, 15)">
                        <circle cx="20" cy="20" r="16" fill="#faf5ff" stroke="#9333ea" strokeWidth="1.5" />
                        <text x="20" y="23" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">λ</text>
                        <text x="20" y="46" fill="#581c87" fontSize="7" textAnchor="middle" fontWeight="bold">Notify</text>
                      </g>
                    </g>
                    <g transform="translate(260, 205)">
                      <rect width="95" height="42" rx="4" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="47.5" y="18" fill="#dc2626" fontSize="8" fontWeight="bold" textAnchor="middle">📨 SES EMAIL</text>
                      <text x="47.5" y="32" fill="#991b1b" fontSize="7" textAnchor="middle">Send Notification</text>
                    </g>

                    {/* Media Upload pathway */}
                    <g transform="translate(140, 200)">
                      <rect width="120" height="55" rx="6" fill="#fdf2f8" stroke="#db2777" strokeWidth="1.5" />
                      <text x="60" y="20" fill="#db2777" fontSize="8" fontWeight="bold" textAnchor="middle">☁️ CLOUDFRONT CDN</text>
                      <text x="60" y="34" fill="#0d9488" fontSize="7" textAnchor="middle" fontWeight="bold">🚀 Transfer Accel</text>
                      <text x="60" y="44" fill="#831843" fontSize="6.5" textAnchor="middle">Edge Optimization</text>
                    </g>
                    
                    {/* Resizer Lambda inside Firecracker microVM sandbox */}
                    <g transform="translate(415, 185)">
                      <rect width="60" height="70" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,2" />
                      <text x="30" y="11" fill="#7e22ce" fontSize="6.5" fontWeight="bold" textAnchor="middle">⚡ MICROVM</text>
                      <g transform="translate(10, 15)">
                        <circle cx="20" cy="20" r="16" fill="#faf5ff" stroke="#9333ea" strokeWidth="1.5" />
                        <text x="20" y="23" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">λ</text>
                        <text x="20" y="46" fill="#581c87" fontSize="7.5" textAnchor="middle" fontWeight="bold">Resizer</text>
                      </g>
                    </g>

                    <g transform="translate(625, 175)">
                      <rect width="115" height="40" rx="5" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.2" />
                      <text x="57.5" y="16" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">🪣 TARGET S3 BUCKET</text>
                      <text x="57.5" y="28" fill="#7c2d12" fontSize="7" textAnchor="middle">optimized-bucket</text>
                    </g>
                    <g transform="translate(625, 245)">
                      <rect width="115" height="40" rx="5" fill="#fffbeb" stroke="#d97706" strokeWidth="1.2" />
                      <text x="57.5" y="16" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">✉️ SQS / SNS</text>
                      <text x="57.5" y="28" fill="#78350f" fontSize="7" textAnchor="middle">Decoupled Fanout</text>
                    </g>
                  </svg>
                )}

                {/* 2. IoT Data Streaming SVG */}
                {activeArchTab === 'iot-pipeline' && (
                  <svg className="w-full min-w-[760px] h-[300px] sv-svg-bg" viewBox="0 0 760 300">
                    <defs>
                      <marker id="arch-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* AWS Region Boundary */}
                    <rect x="120" y="15" width="625" height="270" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="5,3" />
                    <text x="130" y="28" fill="#2563eb" fontSize="7.5" fontWeight="bold">AWS Region (us-east-1)</text>

                    {/* PATHS */}
                    <path d="M 70 145 H 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 240 145 H 315" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 405 130 Q 435 80, 520 80" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 405 160 Q 435 210, 520 210" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    <path d="M 620 210 H 655" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arch-arrow)" />
                    
                    {archFlowState === 'iot-stream' && (
                      <>
                        <line x1="70" y1="145" x2="140" y2="145" stroke="#d97706" strokeWidth="3" className="active-flow-line" />
                        <line x1="240" y1="145" x2="315" y2="145" stroke="#d97706" strokeWidth="3" className="active-flow-line" />
                        <path d="M 405 130 Q 435 80, 520 80" fill="none" stroke="#7e22ce" strokeWidth="3" className="active-flow-line" />
                        <path d="M 405 160 Q 435 210, 520 210" fill="none" stroke="#2563eb" strokeWidth="3.5" className="active-flow-line-blue" />
                        <line x1="620" y1="210" x2="655" y2="210" stroke="#2563eb" strokeWidth="3" className="active-flow-line-blue" />
                      </>
                    )}

                    {/* Node 1: IoT Devices Context */}
                    <g transform="translate(8, 100)">
                      <rect width="64" height="95" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                      <text x="32" y="14" fill="#64748b" fontSize="6.5" fontWeight="bold" textAnchor="middle">FIELD ZONE</text>
                      <g transform="translate(7, 22)">
                        <rect width="50" height="60" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                        <text x="25" y="24" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">📟 IoT DEV</text>
                        <text x="25" y="38" fill="#1e293b" fontSize="6.5" textAnchor="middle">MQTT Agent</text>
                        <text x="25" y="48" fill="#d97706" fontSize="6" textAnchor="middle" fontWeight="semibold">Port: 8883 SSL</text>
                      </g>
                    </g>

                    {/* Node 2: IoT Core */}
                    <g transform="translate(140, 100)">
                      <rect width="100" height="90" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="2.5" />
                      <text x="50" y="22" fill="#b45309" fontSize="10" fontWeight="extrabold" textAnchor="middle">AWS IoT CORE</text>
                      <text x="50" y="36" fill="#78350f" fontSize="7.5" textAnchor="middle">Device Gateway</text>
                      
                      <rect x="8" y="48" width="84" height="32" rx="3" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
                      <text x="50" y="60" fill="#b45309" fontSize="8" textAnchor="middle" fontWeight="bold">RULES ENGINE</text>
                      <text x="50" y="72" fill="#d97706" fontSize="6" textAnchor="middle">SQL Filters Active</text>
                    </g>

                    {/* ==================== KINESIS INGESTION BUFFER BOUNDARY ==================== */}
                    <rect x="255" y="45" width="235" height="215" rx="8" fill="none" stroke="#9333ea" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="265" y="58" fill="#9333ea" fontSize="7.5" fontWeight="bold">Real-time Sharded Stream Ingestion</text>

                    {/* Node 3: Kinesis stream */}
                    <g transform="translate(315, 95)">
                      <rect width="90" height="100" rx="8" fill="#faf5ff" stroke="#9333ea" strokeWidth="2.5" />
                      <text x="45" y="24" fill="#7e22ce" fontSize="11" fontWeight="extrabold" textAnchor="middle">🔥 KINESIS</text>
                      <text x="45" y="38" fill="#581c87" fontSize="8" textAnchor="middle">Data Stream</text>
                      
                      {/* Virtual Shards visualization */}
                      <g transform="translate(8, 48)">
                        <rect width="74" height="42" rx="3" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
                        <text x="37" y="12" fill="#7e22ce" fontSize="7" textAnchor="middle" fontWeight="bold">SHARDS BUFFER</text>
                        <line x1="8" y1="20" x2="66" y2="20" stroke="#d8b4fe" strokeWidth="1" />
                        <text x="37" y="30" fill="#9333ea" fontSize="7" textAnchor="middle">Shard-0001 (Active)</text>
                        <text x="37" y="38" fill="#9333ea" fontSize="7" textAnchor="middle">Shard-0002 (Active)</text>
                      </g>
                    </g>
                    
                    {/* Node 4: DynamoDB State Telemetry */}
                    <g transform="translate(520, 50)">
                      <rect width="100" height="60" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                      <text x="50" y="20" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                      <text x="50" y="34" fill="#1e40af" fontSize="7.5" textAnchor="middle">State Telemetry</text>
                      <rect x="8" y="42" width="84" height="13" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" />
                      <text x="50" y="51" fill="#1d4ed8" fontSize="7.5" textAnchor="middle" fontWeight="bold">Latency: 1-5ms</text>
                    </g>

                    {/* Node 5: Firehose */}
                    <g transform="translate(520, 180)">
                      <rect width="100" height="60" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                      <text x="50" y="20" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">🔥 FIREHOSE</text>
                      <text x="50" y="34" fill="#1e40af" fontSize="7.5" textAnchor="middle">Stream Delivery</text>
                      <rect x="8" y="42" width="84" height="13" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.5" />
                      <text x="50" y="51" fill="#0f766e" fontSize="7" textAnchor="middle" fontWeight="bold">Format Conversion</text>
                    </g>

                    {/* Node 6: S3 Datalake */}
                    <g transform="translate(655, 180)">
                      <rect width="90" height="60" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
                      <text x="45" y="22" fill="#15803d" fontSize="9.5" fontWeight="bold" textAnchor="middle">🪣 S3 LAKE</text>
                      <text x="45" y="36" fill="#166534" fontSize="7.5" textAnchor="middle">raw-datalake</text>
                      <rect x="6" y="44" width="78" height="11" rx="2" fill="#dcfce7" stroke="#22c55e" strokeWidth="0.5" />
                      <text x="45" y="52" fill="#15803d" fontSize="6.5" textAnchor="middle" fontWeight="bold">Athena SQL Ready</text>
                    </g>
                  </svg>
                )}

                {/* 3. Checkout SAGA step functions SVG */}
                {activeArchTab === 'order-saga' && (
                  <svg className="w-full min-w-[760px] h-[300px] sv-svg-bg" viewBox="0 0 760 300">
                    <defs>
                      <marker id="saga-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                      </marker>
                    </defs>

                    {/* AWS Step Functions Workflow Boundary */}
                    <rect x="130" y="20" width="615" height="260" rx="8" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="5,3" />
                    <text x="140" y="34" fill="#d97706" fontSize="8" fontWeight="bold">AWS Step Functions SAGA State Machine (Checkout-Workflow)</text>

                    {/* Flow lines */}
                    <path d="M 70 145 H 160" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#saga-arrow)" />
                    <path d="M 290 145 H 375" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#saga-arrow)" />
                    <path d="M 505 145 H 590" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#saga-arrow)" />
                    
                    {/* Compensation rollback path */}
                    <path d="M 440 170 V 225 H 280" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#saga-arrow)" />

                    {archFlowState === 'saga-run' && (
                      <>
                        <line x1="70" y1="145" x2="160" y2="145" stroke="#059669" strokeWidth="3" className="active-flow-line" />
                        <line x1="290" y1="145" x2="375" y2="145" stroke="#059669" strokeWidth="3" className="active-flow-line" />
                        <line x1="505" y1="145" x2="590" y2="145" stroke="#059669" strokeWidth="3" className="active-flow-line" />
                      </>
                    )}

                    {archFlowState === 'saga-fail' && (
                      <>
                        <line x1="70" y1="145" x2="160" y2="145" stroke="#059669" strokeWidth="3" className="active-flow-line" />
                        <line x1="290" y1="145" x2="375" y2="145" stroke="#dc2626" strokeWidth="3" className="active-flow-line" />
                        <path d="M 440 170 V 225 H 280" fill="none" stroke="#dc2626" strokeWidth="3" className="active-flow-line" strokeDasharray="3,3" />
                      </>
                    )}

                    {/* Client Node */}
                    <g transform="translate(8, 100)">
                      <rect width="64" height="95" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                      <text x="32" y="14" fill="#64748b" fontSize="6.5" fontWeight="bold" textAnchor="middle">CLIENT ZONE</text>
                      <g transform="translate(7, 22)">
                        <circle cx="25" cy="20" r="14" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2" />
                        <text x="25" y="23" fill="#475569" fontSize="8" textAnchor="middle" fontWeight="bold">💻 USER</text>
                        <text x="25" y="46" fill="#64748b" fontSize="6.5" textAnchor="middle">Checkout API</text>
                      </g>
                    </g>
                    
                    {/* Step 1: Validate Stock */}
                    <g transform="translate(160, 105)">
                      <rect width="130" height="80" rx="8" fill="#faf5ff" stroke={
                        archFlowState === 'saga-run' || archFlowState === 'saga-fail' ? '#059669' : '#cbd5e1'
                      } strokeWidth="2.5" />
                      <text x="65" y="20" fill="#1e293b" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">1. VALIDATE STOCK</text>
                      <text x="65" y="34" fill="#475569" fontSize="7" textAnchor="middle">Reserve Item SKU</text>
                      
                      <rect x="8" y="46" width="114" height="24" rx="3" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
                      <text x="65" y="60" fill="#7e22ce" fontSize="8" textAnchor="middle" fontWeight="bold">
                        {archFlowState === 'saga-run' || archFlowState === 'saga-fail' ? 'SKU Hold Reserved' : 'Status: Idle'}
                      </text>
                    </g>

                    {/* Step 2: Charge Payment */}
                    <g transform="translate(375, 105)">
                      <rect width="130" height="80" rx="8" fill="#eff6ff" stroke={
                        archFlowState === 'saga-run' ? '#059669' :
                        archFlowState === 'saga-fail' ? '#dc2626' : '#cbd5e1'
                      } strokeWidth="2.5" />
                      <text x="65" y="20" fill="#1e293b" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">2. CHARGE Stripe</text>
                      <text x="65" y="34" fill="#475569" fontSize="7" textAnchor="middle">Process Visa Card</text>
                      
                      <rect x="8" y="46" width="114" height="24" rx="3" fill={
                        archFlowState === 'saga-run' ? '#dcfce7' :
                        archFlowState === 'saga-fail' ? '#fee2e2' : '#f8fafc'
                      } stroke={
                        archFlowState === 'saga-run' ? '#22c55e' :
                        archFlowState === 'saga-fail' ? '#f43f5e' : '#cbd5e1'
                      } strokeWidth="1" />
                      <text x="65" y="60" fill={
                        archFlowState === 'saga-run' ? '#15803d' :
                        archFlowState === 'saga-fail' ? '#dc2626' : '#64748b'
                      } fontSize="8" textAnchor="middle" fontWeight="bold">
                        {archFlowState === 'saga-run' ? 'Payment Charged' :
                         archFlowState === 'saga-fail' ? 'Visa Declined (402)' : 'Status: Idle'}
                      </text>
                    </g>

                    {/* Step 3: Post Delivery */}
                    <g transform="translate(590, 105)">
                      <rect width="130" height="80" rx="8" fill="#f0fdf4" stroke={
                        archFlowState === 'saga-run' ? '#059669' : '#cbd5e1'
                      } strokeWidth="2.5" />
                      <text x="65" y="20" fill="#1e293b" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">3. POST SHIPMENT</text>
                      <text x="65" y="34" fill="#475569" fontSize="7" textAnchor="middle">Queue SQS dispatch</text>
                      
                      <rect x="8" y="46" width="114" height="24" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" />
                      <text x="65" y="60" fill="#15803d" fontSize="8" textAnchor="middle" fontWeight="bold">
                        {archFlowState === 'saga-run' ? 'Dispatched' : 'Status: Idle'}
                      </text>
                    </g>

                    {/* Compensation Rollback Node */}
                    <g transform="translate(160, 215)">
                      <rect width="130" height="45" rx="5" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
                      <text x="65" y="18" fill="#dc2626" fontSize="8.5" fontWeight="bold" textAnchor="middle">↩️ COMPENSATE STOCK</text>
                      <text x="65" y="32" fill="#991b1b" fontSize="7" textAnchor="middle">Release SKU Hold (Stripe Error)</text>
                    </g>
                  </svg>
                )}

              </div>
            </div>

            {/* Right Column: Architectural logs & Core concepts */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-[460px] shadow-inner">
              <div>
                <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span>Architecture Trace Logger</span>
                </div>
                <div className="h-[210px] overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed text-slate-650 pr-1">
                  {archLogs.length === 0 ? (
                    <span className="text-slate-500 italic block text-center mt-20">Click any trigger buttons on the top right to start a transaction workflow simulation.</span>
                  ) : (
                    archLogs.map((log, idx) => {
                      let color = 'text-slate-600';
                      if (log.includes('🚀')) color = 'text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded';
                      if (log.includes('🌐') || log.includes('📡')) color = 'text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded';
                      if (log.includes('🔒') || log.includes('🛡️')) color = 'text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded';
                      if (log.includes('🟢') || log.includes('Success') || log.includes('✅')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded';
                      if (log.includes('❌') || log.includes('Compensation') || log.includes('Rollback') || log.includes('cancelled')) color = 'text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded';
                      return (
                        <div key={idx} className={`${color} border-b border-slate-100 pb-1.5`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Explanations summary block */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-750 leading-relaxed font-sans mt-4">
                <span className="font-bold text-slate-900 block mb-1">💡 Architecture Learning Takeaway:</span>
                {activeArchTab === 'blog-web' ? (
                  'Securing S3 access with CloudFront Origin Access Control (OAC) and Bucket Policies is an absolute security standard. It ensures that no users can bypass your global caching or Web Application Firewall (WAF) layer to directly download bucket resources.'
                ) : activeArchTab === 'iot-pipeline' ? (
                  'Using Kinesis Data Streams allows ingestion buffering at huge volumes. A streaming database pipeline scales independently of target database engines, protecting backend storage writes.'
                ) : (
                  'In distributed serverless systems, transactions spanning multiple databases/APIs cannot use standard ACID database locks. The SAGA pattern resolves this by executing corresponding compensatory rollbacks immediately on transaction faults.'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: VPC DATABASE NETWORKING & RDS PROXY (prev Tab 5)                   */}
      {/* ========================================================================= */}
      {activeTab === 'db-integration' && (
        <div className="space-y-6">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Shield className="w-5 h-5" /> Networking &amp; Integrations: VPCs, RDS Proxies, and Aurora direct calls
            </h2>
            <p className="sv-card-desc">
              Connecting stateless, rapidly scaling Lambda functions to traditional relational databases introduces core network security and database socket connection limits. Explore standard architectures below:
            </p>
            
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setDbScenario('vpc-basic')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dbScenario === 'vpc-basic' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Lambda inside a VPC
              </button>
              <button
                onClick={() => setDbScenario('rds-proxy')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dbScenario === 'rds-proxy' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Connection Pooling with RDS Proxy
              </button>
              <button
                onClick={() => setDbScenario('aurora-trigger')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dbScenario === 'aurora-trigger' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. Aurora Invoking Lambda &amp; Notifications
              </button>
            </div>
          </div>

          {/* Scenario Display Cards */}
          {dbScenario === 'vpc-basic' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-5 min-h-[350px] flex items-center justify-center shadow-sm bg-slate-50 sv-svg-bg shadow-inner">
                <svg className="w-full max-w-[620px] h-[300px] sv-svg-bg" viewBox="0 0 600 300">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* AWS VPC Cloud Boundary */}
                  <rect x="15" y="15" width="570" height="270" rx="12" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="30" y="32" fill="#2563eb" fontSize="9.5" fontWeight="extrabold">AWS VIRTUAL PRIVATE CLOUD (VPC) - 10.0.0.0/16</text>

                  {/* Public Subnet (DMZ) */}
                  <rect x="30" y="50" width="220" height="220" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="45" y="70" fill="#047857" fontSize="9" fontWeight="extrabold">🟢 Public Subnet (DMZ) - 10.0.1.0/24</text>

                  {/* NAT Gateway Node */}
                  <g transform="translate(50, 95)">
                    <rect width="180" height="60" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
                    <text x="90" y="24" fill="#047857" fontSize="10" fontWeight="bold" textAnchor="middle">🌐 NAT GATEWAY</text>
                    <text x="90" y="38" fill="#475569" fontSize="8" textAnchor="middle">Translates private IP requests</text>
                    <text x="90" y="50" fill="#059669" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Elastic IP: 54.210.8.22</text>
                  </g>

                  {/* Internet Gateway (Outbound exit) */}
                  <g transform="translate(50, 185)">
                    <rect width="180" height="55" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                    <text x="90" y="22" fill="#334155" fontSize="9.5" fontWeight="bold" textAnchor="middle">🚪 INTERNET GATEWAY</text>
                    <text x="90" y="36" fill="#475569" fontSize="8" textAnchor="middle">External Web Access (egress)</text>
                  </g>

                  {/* Private VPC Subnet */}
                  <rect x="275" y="50" width="295" height="220" rx="8" fill="rgba(59, 130, 246, 0.02)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="290" y="70" fill="#1d4ed8" fontSize="9" fontWeight="extrabold">🔒 Private VPC Subnet - 10.0.2.0/24</text>

                  {/* Lambda ENI Node */}
                  <g transform="translate(290, 95)">
                    <rect width="115" height="75" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="57.5" y="20" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ LAMBDA ENI</text>
                    <text x="57.5" y="34" fill="#581c87" fontSize="8" textAnchor="middle">Elastic Network Interface</text>
                    <rect x="10" y="44" width="95" height="22" rx="3" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
                    <text x="57.5" y="57" fill="#7e22ce" fontSize="7.5" textAnchor="middle" fontWeight="bold">IP: 10.0.2.144</text>
                  </g>

                  {/* Isolated Database Subnet Group */}
                  <g transform="translate(425, 95)">
                    <rect width="130" height="155" rx="8" fill="#fafafa" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,3" />
                    <text x="65" y="16" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">DB SUBNET GROUP</text>
                    
                    {/* RDS Postgres Node */}
                    <g transform="translate(10, 28)">
                      <rect width="110" height="110" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                      <text x="55" y="24" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🛢️ RDS POSTGRES</text>
                      <text x="55" y="40" fill="#1e40af" fontSize="8" textAnchor="middle">Primary DB Node</text>
                      
                      <rect x="8" y="56" width="94" height="42" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                      <text x="55" y="70" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="bold">IP: 10.0.2.87</text>
                      <text x="55" y="82" fill="#2563eb" fontSize="7" textAnchor="middle">Port: 5432 (SSL)</text>
                      <text x="55" y="92" fill="#1d4ed8" fontSize="6.5" textAnchor="middle" fontWeight="semibold">Security Group ok</text>
                    </g>
                  </g>

                  {/* Outbound connection routes */}
                  <path d="M 405 130 H 435" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4,2" markerEnd="url(#arrow)" />
                  <path d="M 347 170 Q 180 250, 140 160" fill="none" stroke="#ea580c" strokeWidth="2" markerEnd="url(#arrow)" />
                  <path d="M 140 155 V 185" fill="none" stroke="#ea580c" strokeWidth="2" markerEnd="url(#arrow)" />
                  
                  <text x="420" y="118" fill="#1e40af" fontSize="8" textAnchor="middle" fontWeight="bold">SQL IP Route</text>
                  <text x="210" y="245" fill="#c2410c" fontSize="8.5" textAnchor="middle" fontWeight="bold">NAT Gateway routing for external APIs</text>
                </svg>
              </div>
              <div className="lg:col-span-4 sv-card">
                <h3 className="sv-card-title text-purple-700">Concepts: Lambda in a VPC</h3>
                <p className="text-xs text-slate-605 leading-relaxed space-y-3">
                  <span>
                    By default, Lambda runs inside an isolated AWS-managed network. To access resources inside your private subnets (like database servers, cache instances, or internal microservices), you must configure Lambda to run in your private subnets.
                  </span>
                  <br /><br />
                  <span>
                    When enabled, Lambda mounts a secure **Elastic Network Interface (ENI)** inside your subnet, assigning it a private IP. 
                  </span>
                  <br /><br />
                  <span className="font-bold block text-slate-800">⚠️ Internet egress constraint:</span>
                  <span>
                    A Lambda function inside a private subnet loses default internet access. To fetch external webhooks or talk to public SaaS platforms, you must route subnet egress traffic through a **NAT Gateway** configured inside a public subnet.
                  </span>
                </p>
              </div>
            </div>
          )}

          {dbScenario === 'rds-proxy' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-5 min-h-[350px] flex items-center justify-center shadow-sm bg-slate-50 sv-svg-bg shadow-inner">
                <svg className="w-full max-w-[620px] h-[300px] sv-svg-bg" viewBox="0 0 600 300">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* Scaling Lambda Execution Boundary */}
                  <rect x="15" y="35" width="130" height="245" rx="8" fill="rgba(250, 245, 255, 0.6)" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="80" y="24" fill="#475569" fontSize="8.5" fontWeight="bold" textAnchor="middle">SCALING LAMBDAS</text>

                  {/* Lambda instances */}
                  <g transform="translate(25, 45)">
                    <rect width="110" height="42" rx="4" fill="#fff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ Lambda-1</text>
                    <text x="55" y="34" fill="#9333ea" fontSize="7.5" textAnchor="middle">Socket request</text>
                  </g>
                  <g transform="translate(25, 102)">
                    <rect width="110" height="42" rx="4" fill="#fff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ Lambda-2</text>
                    <text x="55" y="34" fill="#9333ea" fontSize="7.5" textAnchor="middle">Socket request</text>
                  </g>
                  <g transform="translate(25, 159)">
                    <rect width="110" height="42" rx="4" fill="#fff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ Lambda-3</text>
                    <text x="55" y="34" fill="#9333ea" fontSize="7.5" textAnchor="middle">Socket request</text>
                  </g>
                  <g transform="translate(25, 216)">
                    <rect width="110" height="42" rx="4" fill="#fff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ Lambda-N...</text>
                    <text x="55" y="34" fill="#a855f7" fontSize="7" textAnchor="middle">1000+ Concurrencies</text>
                  </g>

                  {/* Flow lines pointing to RDS Proxy */}
                  <path d="M 135 66 Q 200 90, 230 110" fill="none" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrow)" />
                  <path d="M 135 123 H 230" fill="none" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrow)" />
                  <path d="M 135 180 Q 200 150, 230 135" fill="none" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrow)" />

                  {/* RDS Proxy Gateway Connection Pool Container */}
                  <g transform="translate(230, 75)">
                    <rect width="150" height="135" rx="8" fill="#f0fdf4" stroke="#0d9488" strokeWidth="2.5" />
                    <text x="75" y="22" fill="#0f766e" fontSize="11" fontWeight="extrabold" textAnchor="middle">🔌 RDS PROXY</text>
                    <text x="75" y="34" fill="#475569" fontSize="8" textAnchor="middle">Connection Multiplexer</text>
                    
                    {/* Visual Connection Pool Slots */}
                    <g transform="translate(15, 45)">
                      <rect width="120" height="75" rx="4" fill="#fff" stroke="#2dd4bf" strokeWidth="1" />
                      <text x="60" y="14" fill="#0f766e" fontSize="8" textAnchor="middle" fontWeight="bold">ACTIVE CONNECTION POOL</text>
                      
                      {/* Connection dots representing shared pools */}
                      <circle cx="20" cy="32" r="6" fill="#10b981" />
                      <circle cx="40" cy="32" r="6" fill="#10b981" />
                      <circle cx="60" cy="32" r="6" fill="#10b981" />
                      <circle cx="80" cy="32" r="6" fill="#10b981" />
                      <circle cx="100" cy="32" r="6" fill="#cbd5e1" />
                      
                      <circle cx="20" cy="50" r="6" fill="#10b981" />
                      <circle cx="40" cy="50" r="6" fill="#cbd5e1" />
                      <circle cx="60" cy="50" r="6" fill="#cbd5e1" />
                      <circle cx="80" cy="50" r="6" fill="#cbd5e1" />
                      <circle cx="100" cy="50" r="6" fill="#cbd5e1" />

                      <text x="60" y="68" fill="#0f766e" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Shared Pool: 10 Sockets</text>
                    </g>
                  </g>

                  {/* Private Database Subnet Group */}
                  <g transform="translate(425, 75)">
                    <rect width="140" height="135" rx="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                    <text x="70" y="24" fill="#1d4ed8" fontSize="11" fontWeight="extrabold" textAnchor="middle">🛢️ RDS DATABASE</text>
                    <text x="70" y="38" fill="#475569" fontSize="8" textAnchor="middle">Private DB Cluster</text>
                    
                    <rect x="12" y="52" width="116" height="66" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                    <text x="70" y="66" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="bold">SOCKET PROTECTION</text>
                    <text x="70" y="80" fill="#2563eb" fontSize="7.5" textAnchor="middle">Max Connections: 100</text>
                    <text x="70" y="94" fill="#1d4ed8" fontSize="8" textAnchor="middle" fontWeight="semibold">Protected by Proxy Gate</text>
                  </g>

                  {/* Active pooled link */}
                  <path d="M 380 142 H 425" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="4 2" markerEnd="url(#arrow)" />
                  <text x="402" y="128" fill="#0f766e" fontSize="8.5" textAnchor="middle" fontWeight="bold">Multiplexed</text>
                </svg>
              </div>
              <div className="lg:col-span-4 sv-card">
                <h3 className="sv-card-title text-purple-700">Concepts: RDS Proxy</h3>
                <p className="text-xs text-slate-605 leading-relaxed space-y-3">
                  <span>
                    Traditional relational databases (PostgreSQL, MySQL) assign a dedicated operating system process thread (socket connection) to every single connected client. Under massive spikes, 1,000 scaling serverless Lambda instances will try to spin up 1,000 separate DB socket connections, instantly exhausting database resources and locking up tables.
                  </span>
                  <br /><br />
                  <span>
                    **RDS Proxy** acts as a secure buffer pooler. It handles high client scaling connections from Lambda, multiplexing them, sharing database resources, and keeping socket allocations within acceptable database bounds to ensure zero crash limits.
                  </span>
                </p>
              </div>
            </div>
          )}

          {dbScenario === 'aurora-trigger' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-5 min-h-[350px] flex items-center justify-center shadow-sm bg-slate-50 sv-svg-bg shadow-inner">
                <svg className="w-full max-w-[620px] h-[300px] sv-svg-bg" viewBox="0 0 600 300">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* Aurora DB Cluster Boundary */}
                  <rect x="15" y="45" width="220" height="215" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="25" y="60" fill="#1d4ed8" fontSize="8.5" fontWeight="bold">AWS Aurora DB Cluster Boundary</text>

                  <g transform="translate(25, 75)">
                    <rect width="200" height="170" rx="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                    <text x="100" y="26" fill="#1d4ed8" fontSize="12" fontWeight="extrabold" textAnchor="middle">🛢️ AURORA DB CLUSTER</text>
                    <text x="100" y="42" fill="#475569" fontSize="8" textAnchor="middle">Stored SQL Native Procedure</text>

                    <rect x="15" y="55" width="170" height="52" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="25" y="70" fill="#1e293b" fontSize="7" fontFamily="monospace" fontWeight="semibold">CALL mysql.lambda_async</text>
                    <text x="25" y="82" fill="#1e293b" fontSize="7" fontFamily="monospace">(\'arn:aws:lambda:...\',</text>
                    <text x="25" y="94" fill="#1e293b" fontSize="7" fontFamily="monospace">  \'"payload": 1022\');</text>

                    <rect x="15" y="115" width="170" height="42" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
                    <text x="100" y="128" fill="#1e40af" fontSize="8" textAnchor="middle" fontWeight="bold">NATIVE INTEGRATION</text>
                    <text x="100" y="142" fill="#2563eb" fontSize="7.5" textAnchor="middle">Direct invoke via IAM Role permission</text>
                  </g>

                  {/* Flow line */}
                  <path d="M 225 155 H 365" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                  <text x="295" y="138" fill="#059669" fontSize="8" textAnchor="middle" fontWeight="bold">Direct SQL Invocation</text>
                  <text x="295" y="148" fill="#047857" fontSize="7.5" textAnchor="middle" fontWeight="semibold">(IAM Authorized)</text>

                  {/* Target Lambda Sandbox */}
                  <rect x="355" y="45" width="220" height="215" rx="8" fill="none" stroke="#9333ea" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="365" y="60" fill="#7e22ce" fontSize="8.5" fontWeight="bold">Target Firecracker MicroVM</text>

                  <g transform="translate(365, 75)">
                    <rect width="200" height="170" rx="10" fill="#fbf7ff" stroke="#a855f7" strokeWidth="2.5" />
                    <text x="100" y="26" fill="#7e22ce" fontSize="11" fontWeight="extrabold" textAnchor="middle">⚡ TARGET LAMBDA</text>
                    <text x="100" y="42" fill="#475569" fontSize="8" textAnchor="middle">Async event handler</text>

                    <rect x="15" y="58" width="170" height="50" rx="4" fill="#fdf4ff" stroke="#e9d5ff" />
                    <text x="100" y="76" fill="#a21caf" fontSize="9" textAnchor="middle" fontWeight="bold">EVENT HANDLER</text>
                    <text x="100" y="92" fill="#c084fc" fontSize="8.5" textAnchor="middle">Processes incoming SQL payload</text>

                    <rect x="15" y="115" width="170" height="42" rx="4" fill="#faf5ff" stroke="#d8b4fe" />
                    <text x="100" y="128" fill="#7e22ce" fontSize="8" textAnchor="middle" fontWeight="bold">DOWNSTREAM TRIGGER</text>
                    <text x="100" y="142" fill="#581c87" fontSize="7.5" textAnchor="middle">Dispatches external webhooks</text>
                  </g>
                </svg>
              </div>
              <div className="lg:col-span-4 sv-card">
                <h3 className="sv-card-title text-purple-700">Concepts: Direct Aurora Invocations</h3>
                <p className="text-xs text-slate-605 leading-relaxed space-y-3">
                  <span>
                    AWS Aurora allows your relational databases to trigger downstream workflows directly from SQL stored procedures. 
                  </span>
                  <br /><br />
                  <span>
                    By using standard calls like `mysql.lambda_async` or `postgres.aws_lambda.invoke` with AWS IAM policies attached, developers can invoke target microservice pipelines immediately when critical data events occur (e.g. data audit, instant notification dispatch, real-time analytics aggregation).
                  </span>
                  <br /><br />
                  <span className="font-bold block text-slate-800">Alternative: RDS Event Notifications</span>
                  <span>
                    For database operational health alerts (e.g. storage full, manual master failover, database backup complete), RDS supports event subscription models that send details directly to Amazon SNS or EventBridge, allowing automated operational remediation.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SERVERLESS SCALING & PERFORMANCE SIMULATOR PLAYGROUND              */}
      {/* ========================================================================= */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="sv-card">
            <h2 className="sv-card-title text-purple-700">
              <Play className="w-5 h-5" /> 🎮 Serverless MicroVM Autoscaling &amp; Connection Storm Simulator
            </h2>
            <p className="sv-card-desc">
              Interact with a high-fidelity serverless pipeline. Watch API Gateway handle incoming traffic by scaling Lambda microVM execution containers (provisioning warm, active, or idle states) and observe connection loads hitting the relational RDS database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Canvas & Terminal & Chart */}
            <div className="lg:col-span-9 space-y-6">
              {/* Canvas Boundary */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md flex flex-col items-center">
                <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3 text-slate-700 text-xs">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-purple-700">
                    <Activity className="w-4 h-4 text-purple-500" /> Serverless Live Pipeline Telemetry
                  </span>
                  <div className="flex gap-2">
                    <span className="badge badge-purple">Concurrency Cap: 8 Slots</span>
                    <span className={`badge ${simRdsProxyEnabled ? 'badge-green' : 'badge-orange'}`}>
                      {simRdsProxyEnabled ? 'RDS Proxy ON' : 'RDS Proxy OFF'}
                    </span>
                  </div>
                </div>
                
                {/* Horizontal scrolling protection */}
                <div className="w-full overflow-x-auto flex justify-center items-center py-1">
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={420}
                    className="rounded-lg border border-slate-200 bg-white"
                    style={{ minWidth: '900px', width: '900px', height: '420px' }}
                  />
                </div>
              </div>

              {/* Real-time Graph Visualizer */}
              <div className="sv-card">
                <h3 className="sv-card-title text-purple-700">
                  <TrendingUp className="w-5 h-5" /> Real-time Performance &amp; Connection Chart
                </h3>
                <div className="h-48 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simHistoryData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="Invocations" stroke="#a855f7" strokeWidth={2.5} name="Total Invocations" dot={false} />
                      <Line type="monotone" dataKey="ColdStarts" stroke="#f59e0b" strokeWidth={2} name="Cold Starts" dot={false} />
                      <Line type="monotone" dataKey="Throttles" stroke="#ef4444" strokeWidth={2} name="Throttled Requests" dot={false} />
                      <Line type="monotone" dataKey="DbConnections" stroke="#3b82f6" strokeWidth={2} name="Active DB Conns" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Terminal Logs console */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col shadow-inner">
                <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span>Real-time Serverless Playground Output</span>
                </div>
                <div className="h-[180px] overflow-y-auto space-y-1.5 font-mono text-[10.5px] leading-relaxed text-slate-650 pr-1">
                  {simLogs.map((log, idx) => {
                    let color = 'text-slate-600';
                    if (log.includes('🟢')) color = 'text-purple-700 font-semibold bg-purple-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('⚠️')) color = 'text-amber-700 font-semibold bg-amber-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('❌')) color = 'text-rose-700 font-semibold bg-rose-50/50 px-1.5 py-0.5 rounded';
                    if (log.includes('♻️')) color = 'text-slate-500 italic px-1.5 py-0.5';
                    return (
                      <div key={idx} className={color}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Operators Control Panel */}
            <div className="lg:col-span-3 space-y-6">
              <div className="sv-card">
                <h3 className="sv-card-title text-purple-700">
                  <Settings className="w-5 h-5" /> Operators Panel
                </h3>
                
                <div className="space-y-6 mt-4">
                  {/* Traffic Modifier */}
                  <div>
                    <span className="sv-label">1. Modulate Client Traffic:</span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['low', 'normal', 'surge'] as const).map((level) => (
                        <button
                           key={level}
                          onClick={() => {
                            setSimTrafficLevel(level);
                            addSimLog(`📢 Client Traffic modulated to: ${level.toUpperCase()} intensity.`);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            simTrafficLevel === level
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Provisioned Concurrency pre-warmer */}
                  <div>
                    <span className="sv-label">2. Provisioned Concurrency:</span>
                    <p className="text-[10px] text-slate-500 mb-2">Pre-warm MicroVMs to eliminate runtime Cold Starts completely.</p>
                    <div className="flex justify-between gap-2">
                      {[0, 2, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setSimProvConcurrency(count);
                            addSimLog(`⚙️ Config: Set Provisioned Concurrency target to ${count} containers.`);
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border transition-colors ${
                            simProvConcurrency === count
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {count === 0 ? 'None (0)' : `${count} Warmed`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RDS Proxy Toggle */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="sv-label">3. RDS Proxy Pooler:</span>
                      <button
                        onClick={() => {
                          setSimRdsProxyEnabled(!simRdsProxyEnabled);
                          addSimLog(
                            !simRdsProxyEnabled
                              ? '🔌 RDS Proxy ENABLED: SQL connection pooling is protecting database socket boundaries.'
                              : '🔌 RDS Proxy DISABLED: Database socket connections now exposed directly to serverless scale spikes.'
                          );
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          simRdsProxyEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        {simRdsProxyEnabled ? 'ACTIVE (ON)' : 'BYPASS (OFF)'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      When OFF, rapid Lambda scaling triggers a **Connection Storm**, saturating RDS PostgreSQL limits. When ON, RDS Proxy pools socket connections safely.
                    </p>
                  </div>

                  {/* Simulation State control buttons */}
                  <div className="border-t border-slate-100 pt-4 flex gap-2">
                    <button
                      onClick={() => setSimIsRunning(!simIsRunning)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                        simIsRunning ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-purple-600 text-white hover:bg-purple-500'
                      }`}
                    >
                      {simIsRunning ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" /> Pause Simulation
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Simulation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Metrics summary card */}
              <div className="sv-card bg-slate-50 border-slate-200 text-slate-700 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Live Active Metrics</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invocations:</span>
                    <span className="text-purple-700 font-bold">{simStats.invocations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cold Starts:</span>
                    <span className="text-amber-700 font-bold">{simStats.coldStarts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Throttles:</span>
                    <span className={simStats.throttles > 0 ? 'text-red-600 font-bold animate-pulse' : 'text-slate-500'}>
                      {simStats.throttles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RDS Sockets:</span>
                    <span className={!simRdsProxyEnabled && simStats.dbConnections > 80 ? 'text-red-600 font-bold animate-pulse' : 'text-emerald-600 font-bold'}>
                      {simStats.dbConnections} / 120
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
