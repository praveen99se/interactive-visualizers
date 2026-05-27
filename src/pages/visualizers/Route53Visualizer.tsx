import { useEffect, useRef, useState } from 'react';

type TabType = 'dns' | 'r53' | 'records' | 'routing' | 'health' | 'hybrid' | 'arch';
type RecordType = 'A' | 'AAAA' | 'CNAME' | 'ALIAS' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'SRV' | 'PTR';
type PolicyType = 'simple' | 'weighted' | 'latency' | 'failover' | 'geo' | 'geoprox' | 'multivalue' | 'ipbased';

const recordDetails: Record<RecordType, { title: string; desc: string; specs: { k: string; v: string }[]; example: string }> = {
  A: {
    title: 'A Record (Address Record)',
    desc: 'Maps a hostname directly to an IPv4 address. This is the most fundamental DNS record type.',
    specs: [
      { k: 'Points to', v: 'IPv4 Address (e.g., 1.2.3.4)' },
      { k: 'TTL (Standard)', v: '300 seconds (5 minutes)' },
      { k: 'Use case', v: 'Pointing custom domains directly to EC2 servers or Elastic IPs' },
    ],
    example: `$ORIGIN example.com.\n@       300   IN   A   192.0.2.1\nwww     300   IN   A   192.0.2.2`
  },
  AAAA: {
    title: 'AAAA Record (IPv6 Address Record)',
    desc: 'Maps a hostname to a 128-bit IPv6 address. Formatted in hexadecimal groups separated by colons.',
    specs: [
      { k: 'Points to', v: 'IPv6 Address (e.g., 2001:db8::ff00:42:8329)' },
      { k: 'TTL (Standard)', v: '300 seconds' },
      { k: 'Use case', v: 'Native IPv6 traffic routing for modern mobile and web clients' },
    ],
    example: `$ORIGIN example.com.\n@       300   IN   AAAA   2001:db8::1\napi     300   IN   AAAA   2001:db8::2`
  },
  CNAME: {
    title: 'CNAME Record (Canonical Name)',
    desc: 'Maps a hostname to another hostname (creates an alias). Standard DNS requires an extra lookup cycle.',
    specs: [
      { k: 'Points to', v: 'Another FQDN (e.g., app.herokuapp.com)' },
      { k: 'Zone apex?', v: '❌ Cannot be placed at root apex (example.com)' },
      { k: 'Extra query', v: 'Yes, DNS resolver must resolve the target hostname' },
    ],
    example: `$ORIGIN example.com.\nblog    3600  IN   CNAME   wordpress.com.\nwww     3600  IN   CNAME   app.github.io.`
  },
  ALIAS: {
    title: 'ALIAS Record (Route 53 Virtual Extension) ⭐',
    desc: 'A specialized Route 53 record that acts like a CNAME but resolves internally under the hood into an A or AAAA query. It works at the zone apex and query resolution is free.',
    specs: [
      { k: 'Points to', v: 'AWS Resource (ALB, S3, CloudFront, API Gateway)' },
      { k: 'Zone apex?', v: '✅ Allowed! (e.g., example.com pointing to CloudFront)' },
      { k: 'Extra query', v: 'No, resolved directly by Route 53 edge nodes' },
      { k: 'Query Cost', v: '🆓 Free for AWS Resources' },
    ],
    example: `; Route 53 Virtual Record (returns A records at query time)\nexample.com.      ALIAS  d111111abcdef8.cloudfront.net.\napi.example.com.  ALIAS  dualstack.my-alb-123.us-east-1.elb.amazonaws.com.`
  },
  MX: {
    title: 'MX Record (Mail Exchanger)',
    desc: 'Specifies the mail servers responsible for receiving email on behalf of a domain name, with priority values.',
    specs: [
      { k: 'Points to', v: 'Mail Server Hostname + Priority (e.g., 10 mail.example.com)' },
      { k: 'Priority', v: 'Lower number = higher preference' },
      { k: 'Use case', v: 'Routing business emails to Google Workspace or Amazon WorkMail' },
    ],
    example: `$ORIGIN example.com.\n@       86400 IN   MX   10   aspmx.l.google.com.\n@       86400 IN   MX   20   alt1.aspmx.l.google.com.`
  },
  TXT: {
    title: 'TXT Record (Text)',
    desc: 'Carries arbitrary text metadata. Widely used for security verification, spam prevention, and email validation.',
    specs: [
      { k: 'Points to', v: 'Double-quoted text string (max 255 chars per string)' },
      { k: 'SPF/DKIM', v: 'v=spf1 include:_spf.google.com ~all' },
      { k: 'Use case', v: 'Domain ownership proof, Google Search Console, mail authentication' },
    ],
    example: `$ORIGIN example.com.\n@       3600  IN   TXT   "google-site-verification=abc123xyz"\n@       3600  IN   TXT   "v=spf1 include:amazonses.com ~all"`
  },
  NS: {
    title: 'NS Record (Nameserver)',
    desc: 'Delegates a DNS zone to use a specific set of authoritative nameservers. Parent zones delegate to child zones via NS.',
    specs: [
      { k: 'Points to', v: 'Authoritative Nameserver Hostname' },
      { k: 'Assigned by R53', v: '4 distinct nameservers across different TLDs' },
      { k: 'Delegation', v: 'Critical for routing subdomains to another hosted zone' },
    ],
    example: `$ORIGIN example.com.\n@       172800 IN   NS   ns-2048.awsdns-64.co.uk.\n@       172800 IN   NS   ns-123.awsdns-15.com.`
  },
  SOA: {
    title: 'SOA Record (Start of Authority)',
    desc: 'Contains administrative data about the DNS zone, including primary nameserver, admin email, serial number, and refresh intervals.',
    specs: [
      { k: 'Format', v: 'MNAME RNAME SERIAL REFRESH RETRY EXPIRE MINIMUM' },
      { k: 'Serial number', v: 'Increments on every change to trigger replica updates' },
      { k: 'Mandatory', v: 'Exactly 1 SOA record required at the zone apex' },
    ],
    example: `example.com.   3600  IN  SOA  ns-123.awsdns-15.com. awsdns-hostmaster.amazon.com. (\n               1          ; serial\n               7200       ; refresh (2 hours)\n               900        ; retry (15 min)\n               1209600    ; expire (14 days)\n               86400 )    ; minimum (24 hours)`
  },
  SRV: {
    title: 'SRV Record (Service)',
    desc: 'Defines the host and port locations for specific services like SIP, XMPP, or directory lookups.',
    specs: [
      { k: 'Format', v: '_service._proto.name. TTL class SRV priority weight port target.' },
      { k: 'Parameters', v: 'Priority (0-65535), Weight, Port (0-65535), Target Host' },
      { k: 'Use case', v: 'Active Directory discovery, SIP VoIP setups, server configurations' },
    ],
    example: `; _service._proto.name.  class SRV priority weight port target\n_sip._tcp.example.com.    SRV  10       60     5060 sipserver.example.com.`
  },
  PTR: {
    title: 'PTR Record (Pointer Record)',
    desc: 'Maps an IP address back to a domain name (Reverse DNS). Used primarily for spam filters and diagnostics.',
    specs: [
      { k: 'Points to', v: 'Target Hostname (e.g., mail.example.com)' },
      { k: 'Namespace', v: 'Lives in the Special in-addr.arpa (IPv4) or ip6.arpa domain' },
      { k: 'Use case', v: 'Verifying that a sending mail server IP corresponds to its hostname' },
    ],
    example: `; Map IP 192.0.2.5 back to hostname\n5.2.0.192.in-addr.arpa.    PTR   mail.example.com.`
  }
};

const policyDetails: Record<PolicyType, {
  title: string;
  desc: string;
  useCases: string[];
  config: string;
}> = {
  simple: {
    title: 'Simple Routing Policy',
    desc: 'The standard DNS policy. Maps a domain name to a single resource (or multiple static IPs) with no special intelligence. If multiple values are set, Route 53 returns all values to the client in random order.',
    useCases: [
      'Single web server with static Elastic IP',
      'Basic hosted zone setup for a personal blog',
      'Simple redirection configurations',
    ],
    config: `{
  "Name": "example.com",
  "Type": "A",
  "TTL": 300,
  "ResourceRecords": [
    { "Value": "192.0.2.1" },
    { "Value": "192.0.2.2" }
  ]
}`
  },
  weighted: {
    title: 'Weighted Routing Policy',
    desc: 'Distributes traffic across multiple resources in specified proportions (e.g., 70/30). Great for canary releases, blue/green deployments, and gradual traffic migration.',
    useCases: [
      'Canary deployment: Route 5% of traffic to a new version (green) and 95% to current version (blue)',
      'Migrating web servers gradually across hosts',
      'Load balancing traffic across multiple data centers',
    ],
    config: `{
  "Name": "app.example.com",
  "Type": "A",
  "SetIdentifier": "CanaryBlue",
  "Weight": 95,
  "TTL": 60,
  "ResourceRecords": [{ "Value": "192.0.2.1" }]
},
{
  "Name": "app.example.com",
  "Type": "A",
  "SetIdentifier": "CanaryGreen",
  "Weight": 5,
  "TTL": 60,
  "ResourceRecords": [{ "Value": "192.0.2.2" }]
}`
  },
  latency: {
    title: 'Latency-Based Routing Policy',
    desc: 'Routes users to the AWS Region that provides the lowest network latency. Route 53 continuously measures latency across global internet providers and AWS regions to build latency databases.',
    useCases: [
      'Providing ultra-low response times for global user bases',
      'Active-Active multi-region web applications',
      'Decentralized media delivery platforms',
    ],
    config: `{
  "Name": "api.example.com",
  "Type": "A",
  "SetIdentifier": "US-East-Endpoint",
  "Region": "us-east-1",
  "TTL": 60,
  "ResourceRecords": [{ "Value": "198.51.100.1" }]
},
{
  "Name": "api.example.com",
  "Type": "A",
  "SetIdentifier": "EU-West-Endpoint",
  "Region": "eu-west-1",
  "TTL": 60,
  "ResourceRecords": [{ "Value": "203.0.113.1" }]
}`
  },
  failover: {
    title: 'Failover Routing Policy',
    desc: 'Configures Active-Passive failover. Sends all traffic to a Primary resource as long as it is healthy. If the primary health check fails, Route 53 automatically shifts all DNS resolution to the Secondary passive resource.',
    useCases: [
      'Active-Passive Disaster Recovery (DR) plans',
      'Dynamic routing to an S3 backup static maintenance page on server crash',
      'Hot standby database replica failovers',
    ],
    config: `{
  "Name": "www.example.com",
  "Type": "A",
  "SetIdentifier": "PrimaryEndpoint",
  "Failover": "PRIMARY",
  "HealthCheckId": "hc-a1b2c3d4-e5f6-7a8b",
  "TTL": 60,
  "ResourceRecords": [{ "Value": "192.0.2.10" }]
},
{
  "Name": "www.example.com",
  "Type": "A",
  "SetIdentifier": "SecondaryBackup",
  "Failover": "SECONDARY",
  "TTL": 60,
  "ResourceRecords": [{ "Value": "198.51.100.20" }]
}`
  },
  geo: {
    title: 'Geolocation Routing Policy',
    desc: 'Routes traffic based on the physical location of the user (detected from their IP subnet or ISP DNS). Allows serving localized content, complying with local regulations, or optimizing language settings.',
    useCases: [
      'Serving localized translations (e.g., EU users get German/French web layout)',
      'Restricting regional content delivery due to licensing laws (Geo-fencing)',
      'Complying with sovereign data privacy regulations (GDPR, CCPA)',
    ],
    config: `{
  "Name": "shop.example.com",
  "Type": "A",
  "SetIdentifier": "EuropeanStore",
  "GeoLocation": { "ContinentCode": "EU" },
  "TTL": 300,
  "ResourceRecords": [{ "Value": "192.0.2.50" }]
},
{
  "Name": "shop.example.com",
  "Type": "A",
  "SetIdentifier": "DefaultStore",
  "GeoLocation": { "CountryCode": "*" },
  "TTL": 300,
  "ResourceRecords": [{ "Value": "192.0.2.99" }]
}`
  },
  geoprox: {
    title: 'Geoproximity Routing Policy',
    desc: 'Routes traffic to resources based on the geographic distance between the user and the resources. You can optionally shrink or expand the size of a region by specifying a bias parameter (-99 to 99) to shift traffic boundaries.',
    useCases: [
      'Directing users strictly to physical server proximity boundaries',
      'Intelligent cross-region server load leveling using bias shifts',
      'Balancing capacity across global data-centers dynamically',
    ],
    config: `resource "aws_route53_record" "geoprox" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.example.com"
  type    = "A"

  geoproximity_routing_policy {
    aws_region = "us-east-1"
    bias       = 20  # expands region us-east-1 reach
  }
}`
  },
  multivalue: {
    title: 'Multi-Value Answer Routing Policy',
    desc: 'Similar to Simple routing, but allows Route 53 to associate health checks with each record. Route 53 will return up to 8 healthy records randomly, letting the client failover instantly without waiting for DNS cache TTL expiry.',
    useCases: [
      'Adding client-side high availability checks',
      'Distributing load across up to 8 distinct IP endpoints',
      'Resilient service discovery without external load balancers',
    ],
    config: `{
  "Name": "service.internal",
  "Type": "A",
  "SetIdentifier": "ServerNode01",
  "MultiValueAnswer": true,
  "HealthCheckId": "hc-node01",
  "TTL": 30,
  "ResourceRecords": [{ "Value": "10.0.1.10" }]
},
{
  "Name": "service.internal",
  "Type": "A",
  "SetIdentifier": "ServerNode02",
  "MultiValueAnswer": true,
  "HealthCheckId": "hc-node02",
  "TTL": 30,
  "ResourceRecords": [{ "Value": "10.0.2.20" }]
}`
  },
  ipbased: {
    title: 'IP-Based Routing Policy',
    desc: 'Routes users based on their specific client IP subnet range. You define IP CIDR blocks (IP ranges) and associate them with dedicated endpoints. Extremely powerful for targeted enterprise routing.',
    useCases: [
      'Routing corporate intranet users strictly to dedicated internal proxy nodes',
      'Differentiating internal corporate network queries from public requests',
      'Restricting network paths for beta testers or automated monitoring agents',
    ],
    config: `{
  "Name": "dev.example.com",
  "Type": "A",
  "SetIdentifier": "InternalSubnet",
  "CidrRoutingConfig": {
    "CidrCollectionId": "cidr-col-12345",
    "LocationName": "hq-office"
  },
  "TTL": 60,
  "ResourceRecords": [{ "Value": "10.100.5.5" }]
}`
  }
};

export default function Route53Visualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('dns');

  // DNS resolution simulator
  const [dnsInput, setDnsInput] = useState('www.example.com');
  const [dnsSteps, setDnsSteps] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [dnsStepIndex, setDnsStepIndex] = useState<number>(-1);
  const [isCacheHit, setIsCacheHit] = useState(false);

  // Hybrid DNS Simulator states
  const [hybridMode, setHybridMode] = useState<'inbound' | 'outbound'>('inbound');
  const [hybridStep, setHybridStep] = useState<number>(-1);
  const [hybridIsRunning, setHybridIsRunning] = useState<boolean>(false);
  const [hybridLogs, setHybridLogs] = useState<string[]>([]);
  const [hybridSimulatedDomain, setHybridSimulatedDomain] = useState<string>('db.internal');

  // Refs for auto-scrolling log consoles
  const dnsLogRef = useRef<HTMLDivElement | null>(null);
  const hybridLogRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll side effects
  useEffect(() => {
    if (dnsLogRef.current) {
      dnsLogRef.current.scrollTop = dnsLogRef.current.scrollHeight;
    }
  }, [dnsSteps]);

  useEffect(() => {
    if (hybridLogRef.current) {
      hybridLogRef.current.scrollTop = hybridLogRef.current.scrollHeight;
    }
  }, [hybridLogs]);

  // DNS Local Cache state mapping domain -> { ip, ttl, maxTtl }
  const [dnsCache, setDnsCache] = useState<Record<string, { ip: string; ttl: number; maxTtl: number }>>({});

  // Real-time DNS Cache TTL countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDnsCache((prev) => {
        const next = { ...prev };
        let updated = false;
        for (const domain in next) {
          if (next[domain].ttl > 1) {
            next[domain] = { ...next[domain], ttl: next[domain].ttl - 1 };
            updated = true;
          } else {
            delete next[domain];
            updated = true;
          }
        }
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Records Explorer
  const [activeRecord, setActiveRecord] = useState<RecordType>('A');

  // Routing Policies
  const [activePolicy, setActivePolicy] = useState<PolicyType>('simple');

  // Weighted Routing Simulator
  const [weightA, setWeightA] = useState(70);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate matching weights dynamically
  const weightB = Math.floor((100 - weightA) * 2 / 3);
  const weightC = 100 - weightA - weightB;

  // Health check failover simulator states
  const [primHealthy, setPrimHealthy] = useState(true);
  const [secHealthy, setSecHealthy] = useState(true);

  // Architecture interactive states
  const [archScenario, setArchScenario] = useState<'public_web' | 'private_vpc' | 'hybrid_corp'>('public_web');

  // All Routing Policy Simulator States & Handlers
  const [simpleDomain, setSimpleDomain] = useState('www.example.com');
  const [simpleResolvedIPs, setSimpleResolvedIPs] = useState<string[]>([]);
  const [simpleSelectedIP, setSimpleSelectedIP] = useState('');
  const [isSimpleSimulating, setIsSimpleSimulating] = useState(false);

  const [latencyClientRegion, setLatencyClientRegion] = useState<'usa' | 'europe' | 'india' | 'australia'>('usa');
  const [latencyResults, setLatencyResults] = useState<{ region: string; latency: number; win: boolean }[]>([]);
  const [isLatencySimulating, setIsLatencySimulating] = useState(false);

  const [routingPrimHealthy, setRoutingPrimHealthy] = useState(true);
  const [routingSecHealthy, setRoutingSecHealthy] = useState(true);
  const [failoverOutcomeText, setFailoverOutcomeText] = useState('');
  const [failoverOutcomeColor, setFailoverOutcomeColor] = useState('');
  const [isFailoverSimulating, setIsFailoverSimulating] = useState(false);

  const [geoClientContinent, setGeoClientContinent] = useState<'na' | 'eu' | 'as' | 'sa'>('na');
  const [geoResolvedTarget, setGeoResolvedTarget] = useState('');
  const [geoExplanation, setGeoExplanation] = useState('');
  const [isGeoSimulating, setIsGeoSimulating] = useState(false);

  const [geoproxBiasA, setGeoproxBiasA] = useState(0);
  const [geoproxBiasB, setGeoproxBiasB] = useState(0);
  const [geoproxClientLoc, setGeoproxClientLoc] = useState<'us' | 'mid' | 'eu'>('mid');
  const [geoproxResolvedTarget, setGeoproxResolvedTarget] = useState('');
  const [isGeoproxSimulating, setIsGeoproxSimulating] = useState(false);

  const [multivalueHealthyStates, setMultivalueHealthyStates] = useState<boolean[]>([true, true, true, false]);
  const [multivalueResolvedIPs, setMultivalueResolvedIPs] = useState<string[]>([]);
  const [isMultivalueSimulating, setIsMultivalueSimulating] = useState(false);

  const [ipbasedClientIP, setIpbasedClientIP] = useState('192.168.1.45');
  const [ipbasedResolvedTarget, setIpbasedResolvedTarget] = useState('');
  const [isIpbasedSimulating, setIsIpbasedSimulating] = useState(false);

  const runSimpleSim = async () => {
    if (isSimpleSimulating) return;
    setIsSimpleSimulating(true);
    setSimpleResolvedIPs([]);
    setSimpleSelectedIP('');
    await new Promise((r) => setTimeout(r, 600));
    const ips = ['192.0.2.1', '192.0.2.2'];
    setSimpleResolvedIPs(ips);
    const pick = ips[Math.floor(Math.random() * ips.length)];
    setSimpleSelectedIP(pick);
    setIsSimpleSimulating(false);
  };

  const runLatencySim = async () => {
    if (isLatencySimulating) return;
    setIsLatencySimulating(true);
    setLatencyResults([]);
    await new Promise((r) => setTimeout(r, 600));
    let data: { region: string; latency: number; win: boolean }[] = [];
    if (latencyClientRegion === 'usa') {
      data = [
        { region: 'us-east-1 (N. Virginia)', latency: 14, win: true },
        { region: 'eu-west-1 (Ireland)', latency: 85, win: false },
        { region: 'ap-south-1 (Mumbai)', latency: 210, win: false }
      ];
    } else if (latencyClientRegion === 'europe') {
      data = [
        { region: 'us-east-1 (N. Virginia)', latency: 78, win: false },
        { region: 'eu-west-1 (Ireland)', latency: 11, win: true },
        { region: 'ap-south-1 (Mumbai)', latency: 115, win: false }
      ];
    } else if (latencyClientRegion === 'india') {
      data = [
        { region: 'us-east-1 (N. Virginia)', latency: 220, win: false },
        { region: 'eu-west-1 (Ireland)', latency: 105, win: false },
        { region: 'ap-south-1 (Mumbai)', latency: 16, win: true }
      ];
    } else {
      data = [
        { region: 'us-east-1 (N. Virginia)', latency: 175, win: false },
        { region: 'eu-west-1 (Ireland)', latency: 240, win: false },
        { region: 'ap-south-1 (Mumbai)', latency: 112, win: true }
      ];
    }
    setLatencyResults(data);
    setIsLatencySimulating(false);
  };

  const runFailoverSim = async () => {
    if (isFailoverSimulating) return;
    setIsFailoverSimulating(true);
    setFailoverOutcomeText('');
    await new Promise((r) => setTimeout(r, 600));
    if (routingPrimHealthy) {
      setFailoverOutcomeText('Resolved to: us-east-1 ALB (Primary IP: 192.0.2.10)');
      setFailoverOutcomeColor('#15803d');
    } else if (routingSecHealthy) {
      setFailoverOutcomeText('Resolved to: eu-west-1 ALB (Secondary IP: 192.0.2.20) [Primary failed]');
      setFailoverOutcomeColor('#1d4ed8');
    } else {
      setFailoverOutcomeText('Outage! SERVFAIL returned (Both primary and secondary unhealthy)');
      setFailoverOutcomeColor('#dc2626');
    }
    setIsFailoverSimulating(false);
  };

  const runGeoSim = async () => {
    if (isGeoSimulating) return;
    setIsGeoSimulating(true);
    setGeoResolvedTarget('');
    setGeoExplanation('');
    await new Promise((r) => setTimeout(r, 600));
    if (geoClientContinent === 'na') {
      setGeoResolvedTarget('us-east-1 ALB (IP: 192.0.2.100)');
      setGeoExplanation('Matches rule: Continent [North America] mapped directly to us-east-1.');
    } else if (geoClientContinent === 'eu') {
      setGeoResolvedTarget('eu-west-1 ALB (IP: 198.51.100.5)');
      setGeoExplanation('Matches rule: Continent [Europe] mapped directly to eu-west-1.');
    } else if (geoClientContinent === 'as') {
      setGeoResolvedTarget('ap-northeast-1 ALB (IP: 203.0.113.88)');
      setGeoExplanation('Matches rule: Country [Japan] mapped to ap-northeast-1. All other Asian traffic falls to default.');
    } else {
      setGeoResolvedTarget('us-east-1 ALB (IP: 192.0.2.100) [Default target]');
      setGeoExplanation('No specific match found for South America. Request shifts to default catch-all A record.');
    }
    setIsGeoSimulating(false);
  };

  const runGeoproxSim = async () => {
    if (isGeoproxSimulating) return;
    setIsGeoproxSimulating(true);
    setGeoproxResolvedTarget('');
    await new Promise((r) => setTimeout(r, 600));
    let score = 0;
    if (geoproxClientLoc === 'us') {
      score = 100 + geoproxBiasA - geoproxBiasB;
    } else if (geoproxClientLoc === 'eu') {
      score = -100 + geoproxBiasA - geoproxBiasB;
    } else {
      score = geoproxBiasA - geoproxBiasB;
    }
    const target = score >= 0 ? 'us-east-1 ALB (US East)' : 'eu-west-1 ALB (EU West)';
    setGeoproxResolvedTarget(target);
    setIsGeoproxSimulating(false);
  };

  const runMultivalueSim = async () => {
    if (isMultivalueSimulating) return;
    setIsMultivalueSimulating(true);
    setMultivalueResolvedIPs([]);
    await new Promise((r) => setTimeout(r, 600));
    const ips = ['10.0.1.10', '10.0.1.20', '10.0.1.30', '10.0.1.40'];
    const healthyIPs = ips.filter((_, idx) => multivalueHealthyStates[idx]);
    const shuffled = [...healthyIPs].sort(() => Math.random() - 0.5);
    setMultivalueResolvedIPs(shuffled);
    setIsMultivalueSimulating(false);
  };

  const runIpbasedSim = async () => {
    if (isIpbasedSimulating) return;
    setIsIpbasedSimulating(true);
    setIpbasedResolvedTarget('');
    await new Promise((r) => setTimeout(r, 600));
    const ip = ipbasedClientIP.trim();
    if (ip.startsWith('192.168.1.')) {
      setIpbasedResolvedTarget('Corporate Private Proxy (Target A: 10.0.99.1)');
    } else if (ip.startsWith('10.0.')) {
      setIpbasedResolvedTarget('Internal App ALB (Target B: 10.0.2.10)');
    } else {
      setIpbasedResolvedTarget('Public Global CDN (Default Target: 1.2.3.4)');
    }
    setIsIpbasedSimulating(false);
  };

  // DNS simulation runner
  const simulateDNS = async () => {
    if (isResolving) return;
    setIsResolving(true);
    setDnsSteps([]);
    setDnsStepIndex(-1);

    const domain = dnsInput.trim().toLowerCase() || 'www.example.com';
    const cachedEntry = dnsCache[domain];

    if (cachedEntry && cachedEntry.ttl > 0) {
      setIsCacheHit(true);

      setDnsStepIndex(0);
      setDnsSteps([`🔍 Initiating DNS resolution for: ${domain}`]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsStepIndex(1);
      setDnsSteps((prev) => [
        ...prev,
        `📦 Step 1: Querying local DNS caches (Browser cache, Operating System cache)...`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsSteps((prev) => [
        ...prev,
        `⚡ Cache HIT! Valid record found locally:`,
        `   └─ Mapping: ${domain} ➔ ${cachedEntry.ip}`,
        `   └─ TTL Remaining: ${cachedEntry.ttl} seconds`,
        `🚀 Bypassing external WAN queries (Root, TLD, Route 53 Authoritative Nameservers bypassed completely!)`
      ]);
      await new Promise((r) => setTimeout(r, 1000));

      setDnsStepIndex(6);
      setDnsSteps((prev) => [
        ...prev,
        `✅ Success! Resolved directly from local cache. Browser connecting to ${cachedEntry.ip} over HTTPS (TCP port 443).`
      ]);
      await new Promise((r) => setTimeout(r, 800));
    } else {
      setIsCacheHit(false);

      setDnsStepIndex(0);
      setDnsSteps([`🔍 Resolving Fully Qualified Domain Name (FQDN): ${domain}`]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsStepIndex(1);
      setDnsSteps((prev) => [
        ...prev,
        `📦 Step 1: Querying local DNS caches (Browser cache, Operating System cache)...`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsSteps((prev) => [
        ...prev,
        `❌ Cache MISS. Domain record is empty or has expired in local cache.`,
        `   Forwarding recursive DNS query to public resolver (ISP / 8.8.8.8)...`
      ]);
      await new Promise((r) => setTimeout(r, 1000));

      setDnsStepIndex(2);
      setDnsSteps((prev) => [
        ...prev,
        `🌍 Step 2: Recursive resolver queries Root Nameserver (a.root-servers.net)...`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsSteps((prev) => [
        ...prev,
        `➡️ Root Nameserver responds: "I do not know the IP for ${domain}, but here are the TLD Nameservers for the .${domain.split('.').pop() || 'com'} TLD."`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      setDnsStepIndex(3);
      setDnsSteps((prev) => [
        ...prev,
        `🏷️ Step 3: Recursive resolver queries TLD Nameserver (com.gtld-servers.net)...`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      const domainParts = domain.split('.');
      const apexDomain = domainParts.slice(-2).join('.');
      setDnsSteps((prev) => [
        ...prev,
        `➡️ TLD Nameserver responds: "I do not know the IP address, but here are the authoritative Nameservers for ${apexDomain}."`,
        `   └─ NS: ns-123.awsdns.com (Route 53 authoritative nameserver cluster)`
      ]);
      await new Promise((r) => setTimeout(r, 1000));

      setDnsStepIndex(4);
      setDnsSteps((prev) => [
        ...prev,
        `📍 Step 4: Recursive resolver queries Authoritative Route 53 Nameserver...`
      ]);
      await new Promise((r) => setTimeout(r, 800));

      // Resolve to a stable/consistent IP based on the domain name
      let resolvedIP = '1.2.3.4';
      if (domain !== 'www.example.com') {
        const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        resolvedIP = `192.0.2.${(hash % 250) + 1}`;
      }

      setDnsSteps((prev) => [
        ...prev,
        `➡️ Route 53 processes records & returns authoritative answer:`,
        `   └─ Record Type: A | TTL: 300s | Value: ${resolvedIP}`
      ]);
      await new Promise((r) => setTimeout(r, 1000));

      setDnsStepIndex(5);
      // Store in local cache!
      setDnsCache((prev) => ({
        ...prev,
        [domain]: { ip: resolvedIP, ttl: 300, maxTtl: 300 }
      }));

      setDnsSteps((prev) => [
        ...prev,
        `💾 Step 5: Recursive resolver caches response for 300s (TTL) and forwards it to the Browser.`,
        `   📥 Record cached in local Browser/OS storage!`
      ]);
      await new Promise((r) => setTimeout(r, 1000));

      setDnsStepIndex(6);
      setDnsSteps((prev) => [
        ...prev,
        `✅ Success! Resolution complete. Browser connecting to ${resolvedIP} over TCP port 443.`
      ]);
      await new Promise((r) => setTimeout(r, 800));
    }

    setIsResolving(false);
  };

  // Hybrid DNS simulation runner
  const runHybridSim = async () => {
    if (hybridIsRunning) return;
    setHybridIsRunning(true);
    setHybridLogs([]);
    setHybridStep(0);

    const isRuleInbound = hybridMode === 'inbound';
    const domain = hybridSimulatedDomain;

    const inboundLogs = [
      `🔍 [CLIENT] DNS Query initiated for domain: '${domain}' (Record Type A)`,
      `📦 [ON-PREM DNS] DNS Server (192.168.1.10) received query. Searching local Active Directory database...`,
      `❌ [ON-PREM DNS] Cache MISS. Domain is not in local authoritative zones (*.onprem.local).`,
      `🎯 [ON-PREM DNS] Evaluating conditional forwarders: Matches rule [*.internal] -> Forward to AWS Inbound Endpoint [10.0.1.53]`,
      `🔐 [IPSEC VPN] Encrypting DNS query packet. Forwarding across AWS Site-to-Site VPN Tunnel...`,
      `☁️ [VIRTUAL GATEWAY] AWS Virtual Private Gateway decrypted packet. Route to subnet 10.0.1.0/24.`,
      `🔌 [AWS RESOLVER] Inbound Endpoint ENI (10.0.1.53) received query. Forwarding to Route 53 Resolver (10.0.0.2)...`,
      `🔍 [ROUTE 53] Query matching associated Private Hosted Zone 'internal' in vpc-0a1b2c3d...`,
      `✅ [ROUTE 53] Match found! 'db.internal' -> Record: A -> IP 10.0.2.99 (RDS Database Instance)`,
      `📤 [AWS RESOLVER] Returning response [db.internal. A 10.0.2.99] back via Inbound Endpoint ENI...`,
      `🔐 [IPSEC VPN] Encrypting and tunneling response packet back to On-Premises Gateway...`,
      `📦 [ON-PREM DNS] Received resolved payload. Returning IP 10.0.2.99 to client and caching (TTL: 300s).`,
      `✅ [CLIENT] DNS Resolution SUCCESS! Direct connection established to private RDS database at 10.0.2.99 over secure IPSec tunnel!`
    ];

    const outboundLogs = [
      `🔍 [EC2 INSTANCE] DNS Query initiated inside VPC for: '${domain}' (Record Type A)`,
      `🔌 [ROUTE 53] Query received at local Route 53 Resolver IP (10.0.0.2 - AmazonProvidedDNS)...`,
      `❌ [ROUTE 53] Cache MISS. Evaluating Outbound resolver rules...`,
      `🎯 [ROUTE 53] Found Rule Match: [*.onprem.local] -> Forward to On-Premises AD DNS Server [192.168.10.10]`,
      `🔌 [AWS RESOLVER] Routing query packet to Outbound Endpoint ENI (IP 10.0.1.250)...`,
      `🔐 [IPSEC VPN] Outbound Endpoint routes packet across Site-to-Site VPN tunnel to On-Premises Gateway...`,
      `🏢 [ON-PREM GATEWAY] Packet decrypted. Forwarded to Active Directory Domain Controller (192.168.10.10)...`,
      `🏢 [ON-PREM DNS] Query received. Local Zone Match found: '${domain}' -> Record: A -> 192.168.10.100`,
      `🔐 [IPSEC VPN] Tunneling response packet [A -> 192.168.10.100] back to AWS VPC...`,
      `🔌 [AWS RESOLVER] Outbound Endpoint ENI (10.0.1.250) received response payload.`,
      `🔌 [ROUTE 53] Resolver cached record and returned payload back to client EC2 Instance.`,
      `✅ [EC2 INSTANCE] DNS Resolution SUCCESS! Establishing direct secure private connection to corporate server at 192.168.10.100!`
    ];

    const logs = isRuleInbound ? inboundLogs : outboundLogs;
    const stepMapping = isRuleInbound ? [0, 1, 1, 1, 2, 2, 3, 4, 4, 5, 5, 5, 6] : [0, 1, 1, 1, 2, 3, 3, 4, 5, 5, 5, 6];

    for (let i = 0; i < logs.length; i++) {
      setHybridLogs((prev) => [...prev, logs[i]]);
      setHybridStep(stepMapping[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setHybridIsRunning(false);
  };

  // Redraw Weighted Routing Canvas
  useEffect(() => {
    if (activeSection !== 'routing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;

    // Calculate boundary ratios
    const rA = weightA / 100;
    const rB = weightB / 100;
    const rC = weightC / 100;

    const xA = 0;
    const wA = width * rA;

    const xB = wA;
    const wB = width * rB;

    const xC = wA + wB;
    const wC = width * rC;

    // Draw bars
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(xA, 20, wA, 50);

    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(xB, 20, wB, 50);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(xC, 20, wC, 50);

    // Draw text values if space permits
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px var(--font-sans, sans-serif)';
    ctx.textAlign = 'center';

    if (weightA > 8) {
      ctx.fillText(`${weightA}%`, xA + wA / 2, 48);
    }
    if (weightB > 8) {
      ctx.fillText(`${weightB}%`, xB + wB / 2, 48);
    }
    if (weightC > 8) {
      ctx.fillText(`${weightC}%`, xC + wC / 2, 48);
    }

    // Draw borders & labels underneath
    ctx.fillStyle = '#475569';
    ctx.font = '10px var(--font-sans, sans-serif)';
    ctx.textAlign = 'start';
    ctx.fillText('0%', 0, 90);
    ctx.textAlign = 'end';
    ctx.fillText('100%', width, 90);
  }, [activeSection, weightA, weightB, weightC]);

  // Determine health simulator outcome
  const getFailoverOutcome = () => {
    if (primHealthy) {
      return {
        text: '✅ Primary (us-east-1 ALB)',
        desc: 'Primary endpoint is healthy. Route 53 directs 100% of queries to the primary record.',
        color: '#15803d'
      };
    } else if (secHealthy) {
      return {
        text: '⚠️ Secondary Failover (eu-west-1 ALB)',
        desc: 'Primary endpoint is unhealthy! Route 53 automatically detected the failure and shifted routing to the backup secondary passive target.',
        color: '#1d4ed8'
      };
    } else {
      return {
        text: '❌ DNS Resolution Failure (Service Offline)',
        desc: 'Both Primary and Secondary endpoints are unhealthy! Route 53 returns query failure, leading to a connection timeout for users.',
        color: '#dc2626'
      };
    }
  };

  const failoverOutcome = getFailoverOutcome();

  const hasCacheItems = Object.keys(dnsCache).length > 0;

  // Cache Cabinet styling classes
  let cacheBoxClass = '';
  let cacheBoxStroke = '#334155';
  let cacheBoxStrokeWidth = 1;

  if (dnsStepIndex === 1) {
    if (isResolving) {
      if (isCacheHit) {
        cacheBoxClass = 'cache-query-hit';
        cacheBoxStroke = '#22c55e';
        cacheBoxStrokeWidth = 2.5;
      } else {
        cacheBoxClass = 'cache-query-miss';
        cacheBoxStroke = '#f97316';
        cacheBoxStrokeWidth = 2.5;
      }
    }
  } else if (hasCacheItems && !isResolving) {
    cacheBoxClass = 'cache-active-pulse';
    cacheBoxStroke = '#22c55e';
    cacheBoxStrokeWidth = 1.5;
  }

  return (
    <div>
      <style>{`
        .r53-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
        .r53-tb { padding: 6px 14px; border-radius: 999px; border: 0.5px solid var(--color-border-secondary); font-size: 12px; cursor: pointer; background: var(--color-background-secondary); color: var(--color-text-secondary); transition: all .15s; outline: none; }
        .r53-tb:hover { background: var(--color-background-tertiary); }
        .r53-tb.r53-on { background: #7c3aed; color: #fff; border-color: #7c3aed; }
        .r53-card { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 14px 16px; background: var(--color-background-primary); margin-bottom: 12px; }
        .r53-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 8px; }
        .r53-sec:first-child { margin-top: 0; }
        .r53-kv { display: flex; gap: 8px; font-size: 12px; margin: 6px 0; align-items: baseline; }
        .r53-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; }
        .r53-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .r53-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .r53-met { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px; text-align: center; }
        ul.r53-ck li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; }
        ul.r53-ck li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
        .r53-log { border: 0.5px solid var(--color-border-tertiary); border-radius: 8px; padding: 10px 12px; background: var(--color-background-secondary); font-size: 11px; font-family: var(--font-mono, monospace); white-space: pre-wrap; line-height: 1.4; color: var(--color-text-primary); }
        .r53-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .r53-btn { font-size: 12px; padding: 5px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; transition: all 0.15s; outline: none; }
        .r53-btn:hover { background: var(--color-background-secondary); }
        .r53-btn.r53-on { background: #7c3aed; color: #fff; border-color: #7c3aed; }
        .r53-card select {
          border: 2px solid #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.2) !important;
          outline: none;
        }
        @keyframes cachePulse {
          0% { stroke: #22c55e; stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.5)); }
          50% { stroke: #4ade80; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.9)); }
          100% { stroke: #22c55e; stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.5)); }
        }
        @keyframes cacheQueryHit {
          0% { stroke: #22c55e; stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.7)); }
          50% { stroke: #10b981; stroke-width: 4.5px; filter: drop-shadow(0 0 20px rgba(16, 185, 129, 1)); }
          100% { stroke: #22c55e; stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.7)); }
        }
        @keyframes cacheQueryMiss {
          0% { stroke: #f97316; stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.7)); }
          50% { stroke: #ef4444; stroke-width: 4.5px; filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)); }
          100% { stroke: #f97316; stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.7)); }
        }
        .cache-active-pulse {
          animation: cachePulse 2s infinite ease-in-out;
        }
        .cache-query-hit {
          animation: cacheQueryHit 0.8s infinite ease-in-out;
        }
        .cache-query-miss {
          animation: cacheQueryMiss 0.8s infinite ease-in-out;
        }
        @keyframes heartbeatPulse {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes alarmLed {
          0%, 100% { fill: #ef4444; opacity: 1; filter: drop-shadow(0 0 3px #ef4444); }
          50% { fill: #7f1d1d; opacity: 0.3; filter: none; }
        }
        @keyframes breathingGreen {
          0%, 100% { stroke: #22c55e; stroke-width: 1.5px; filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.4)); }
          50% { stroke: #4ade80; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.8)); }
        }
        @keyframes breathingRed {
          0%, 100% { stroke: #dc2626; stroke-width: 1.5px; filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.4)); }
          50% { stroke: #f87171; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(248, 113, 113, 0.8)); }
        }
        .ping-line-ok {
          stroke: #10b981;
          stroke-dasharray: 6, 4;
          animation: heartbeatPulse 1.5s linear infinite;
        }
        .ping-line-fail {
          stroke: #ef4444;
          stroke-dasharray: 4, 3;
          animation: heartbeatPulse 0.8s linear infinite;
        }
        .server-healthy-glow {
          animation: breathingGreen 2.5s infinite ease-in-out;
        }
        .server-unhealthy-glow {
          animation: breathingRed 1.2s infinite ease-in-out;
        }
        .alarm-indicator {
          animation: alarmLed 0.5s infinite steps(1);
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌐 AWS Route 53 — DNS · Hosted Zones · Routing Policies · Health Checks
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            The internet's phone book — translates domain names to IP addresses · globally distributed infrastructure · 100% Availability SLA
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="r53-tabs">
          <button className={`r53-tb ${activeSection === 'dns' ? 'r53-on' : ''}`} onClick={() => setActiveSection('dns')}>🔍 How DNS Works</button>
          <button className={`r53-tb ${activeSection === 'r53' ? 'r53-on' : ''}`} onClick={() => setActiveSection('r53')}>🚀 Route 53 Overview</button>
          <button className={`r53-tb ${activeSection === 'records' ? 'r53-on' : ''}`} onClick={() => setActiveSection('records')}>📋 Records &amp; Zones</button>
          <button className={`r53-tb ${activeSection === 'routing' ? 'r53-on' : ''}`} onClick={() => setActiveSection('routing')}>🗺️ Routing Policies</button>
          <button className={`r53-tb ${activeSection === 'health' ? 'r53-on' : ''}`} onClick={() => setActiveSection('health')}>❤️ Health Checks</button>
          <button className={`r53-tb ${activeSection === 'hybrid' ? 'r53-on' : ''}`} onClick={() => setActiveSection('hybrid')}>🔌 Hybrid DNS</button>
          <button className={`r53-tb ${activeSection === 'arch' ? 'r53-on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ Architecture</button>
        </div>
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>

        {/* DNS WORKS PANEL */}
        {activeSection === 'dns' && (
          <div>
            <div className="r53-sec">How DNS Resolution Works — Step-by-Step Flow</div>
            <div className="r53-card">
              <svg width="60%" viewBox="0 0 680 270" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  {/* Neon Glow Filters */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComponentTransfer in="blur" result="glow1">
                      <feFuncA type="linear" slope="0.8" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="glow1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Flow Markers */}
                  <marker id="d1" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c084fc" /></marker>
                  <marker id="d2" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#4ade80" /></marker>
                  <marker id="d3" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#60a5fa" /></marker>
                  <marker id="d4" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f97316" /></marker>
                </defs>

                {/* BACKGROUND CONNECTIVITY PIPES */}
                {/* Browser to Resolver */}
                <line x1="120" y1="130" x2="160" y2="130" stroke="#475569" strokeWidth="2" strokeDasharray="3,2" />
                {/* Resolver to Root */}
                <path d="M 280 130 Q 305 130 305 38 L 330 38" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
                {/* Resolver to TLD */}
                <line x1="280" y1="130" x2="330" y2="130" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
                {/* Resolver to Auth */}
                <path d="M 280 130 Q 305 130 305 220 L 330 220" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
                {/* Client direct to Web Server */}
                <path
                  d="M 65 160 Q 65 260 305 260 Q 610 260 610 160"
                  fill="none"
                  stroke={dnsStepIndex === 6 ? (isCacheHit ? "#10b981" : "#0ea5e9") : "#0ea5e9"}
                  strokeWidth={dnsStepIndex === 6 ? (isCacheHit ? 3.0 : 2) : 2}
                  strokeOpacity={dnsStepIndex === 6 ? 1 : 0.15}
                  strokeDasharray={dnsStepIndex === 6 ? "5,3" : "none"}
                  style={{ transition: 'all 0.3s' }}
                >
                  {dnsStepIndex === 6 && (
                    <animate attributeName="stroke-dashoffset" values="50;0" dur={isCacheHit ? "1.2s" : "2s"} repeatCount="indefinite" />
                  )}
                </path>

                {/* 1. LAPTOP BROWSER CLIENT */}
                <g filter={(dnsStepIndex === 0 || dnsStepIndex === 1 || dnsStepIndex === 5 || dnsStepIndex === 6) ? "url(#glow)" : undefined}>
                  <polygon points="20,150 100,150 115,160 5,160" fill="#475569" stroke="#334155" strokeWidth="1" />
                  <rect x="45" y="142" width="30" height="9" fill="#64748b" />
                  <rect x="10" y="102" width="100" height="42" rx="4" fill="#0f172a" stroke={(dnsStepIndex === 0 || dnsStepIndex === 1 || dnsStepIndex === 5 || dnsStepIndex === 6) ? "#a855f7" : "#475569"} strokeWidth="1.5" />
                  <rect x="14" y="105" width="92" height="34" rx="2" fill="#1e1b4b" />
                  <rect x="18" y="109" width="84" height="4" rx="1" fill="#4338ca" />
                  <circle cx="22" cy="117" r="1.5" fill="#f43f5e" />
                  <circle cx="27" cy="117" r="1.5" fill="#eab308" />
                  <circle cx="32" cy="117" r="1.5" fill="#22c55e" />
                  <rect x="38" y="115" width="60" height="4" rx="1.5" fill="#1e293b" />
                  <text x="42" y="119" fontSize="4.5" fill="#e2e8f0" fontFamily="monospace" fontWeight="bold">example.com</text>
                  <line x1="20" y1="126" x2="90" y2="126" stroke="#312e81" strokeWidth="1" />
                  <line x1="20" y1="131" x2="70" y2="131" stroke="#312e81" strokeWidth="1" />
                  <text x="60" y="156" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="600">💻 Browser</text>
                </g>

                {/* 2. RECURSIVE RESOLVER (Server Rack) */}
                <g filter={(dnsStepIndex >= 1 && dnsStepIndex <= 5 && !isCacheHit) ? "url(#glow)" : undefined}>
                  <rect x="160" y="100" width="120" height="60" rx="8" fill="#1e293b" stroke={(dnsStepIndex >= 1 && dnsStepIndex <= 5 && !isCacheHit) ? "#f97316" : "#475569"} strokeWidth="1.5" />
                  <rect x="162" y="102" width="116" height="56" rx="6" fill="#0f172a" />
                  {/* Blinking LEDs */}
                  <circle cx="256" cy="112" r="3" fill="#22c55e"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                  <circle cx="268" cy="112" r="3" fill="#eab308"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="256" cy="124" r="3" fill="#22c55e"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.2s" repeatCount="indefinite" /></circle>
                  <circle cx="268" cy="124" r="3" fill="#22c55e"><animate attributeName="opacity" values="1;0.1;1" dur="1.0s" repeatCount="indefinite" /></circle>
                  <circle cx="256" cy="136" r="3" fill="#ef4444"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.4s" repeatCount="indefinite" /></circle>
                  <circle cx="268" cy="136" r="3" fill="#22c55e"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="0.5s" repeatCount="indefinite" /></circle>
                  {/* Slots */}
                  <line x1="170" y1="112" x2="240" y2="112" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="170" y1="124" x2="240" y2="124" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="170" y1="136" x2="240" y2="136" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="170" y1="148" x2="220" y2="148" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <text x="220" y="94" textAnchor="middle" fontSize="9" fill="#fdba74" fontWeight="600">🔄 Recursive Resolver</text>
                  <text x="220" y="172" textAnchor="middle" fontSize="8" fill="#94a3b8">(ISP / 8.8.8.8)</text>
                </g>

                {/* 3. ROOT NAMESERVER (Red Chassis Server) */}
                <g filter={dnsStepIndex === 2 ? "url(#glow)" : undefined}>
                  <rect x="330" y="10" width="120" height="56" rx="8" fill="#1e293b" stroke={dnsStepIndex === 2 ? "#ef4444" : "#475569"} strokeWidth="1.5" />
                  <rect x="332" y="12" width="116" height="52" rx="6" fill="#1e1b1b" />
                  {/* Blinking LEDs */}
                  <circle cx="426" cy="22" r="2.5" fill="#ef4444"><animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" /></circle>
                  <circle cx="438" cy="22" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.7s" repeatCount="indefinite" /></circle>
                  <circle cx="426" cy="34" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="1;0.1;1" dur="1.1s" repeatCount="indefinite" /></circle>
                  <circle cx="438" cy="34" r="2.5" fill="#eab308"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.9s" repeatCount="indefinite" /></circle>
                  {/* Vents */}
                  <line x1="340" y1="22" x2="410" y2="22" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
                  <line x1="340" y1="34" x2="410" y2="34" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
                  <line x1="340" y1="46" x2="390" y2="46" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
                  <text x="390" y="6" textAnchor="middle" fontSize="9" fill="#fca5a5" fontWeight="600">🌍 Root NS (a.root-servers.net)</text>
                </g>

                {/* 4. TLD NAMESERVER (Blue Chassis Server) */}
                <g filter={dnsStepIndex === 3 ? "url(#glow)" : undefined}>
                  <rect x="330" y="100" width="120" height="60" rx="8" fill="#1e293b" stroke={dnsStepIndex === 3 ? "#3b82f6" : "#475569"} strokeWidth="1.5" />
                  <rect x="332" y="102" width="116" height="56" rx="6" fill="#172554" />
                  {/* Blinking LEDs */}
                  <circle cx="426" cy="112" r="2.5" fill="#3b82f6"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="438" cy="112" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                  <circle cx="426" cy="124" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.3s" repeatCount="indefinite" /></circle>
                  <circle cx="438" cy="124" r="2.5" fill="#ef4444"><animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.0s" repeatCount="indefinite" /></circle>
                  {/* Vents */}
                  <line x1="340" y1="112" x2="410" y2="112" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="340" y1="124" x2="410" y2="124" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="340" y1="136" x2="390" y2="136" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
                  <text x="390" y="94" textAnchor="middle" fontSize="9" fill="#93c5fd" fontWeight="600">🏷️ TLD NS (.com / .net)</text>
                </g>

                {/* 5. AUTHORITATIVE NAMESERVER (AWS Route 53 Golden Orbit Node) */}
                <g filter={dnsStepIndex === 4 ? "url(#glow)" : undefined}>
                  <rect x="330" y="190" width="120" height="60" rx="8" fill="#3b0764" stroke={dnsStepIndex === 4 ? "#d8b4fe" : "#475569"} strokeWidth="1.5" />
                  <rect x="332" y="192" width="116" height="56" rx="6" fill="#120024" />
                  {/* Golden Rotating Orbit Circle */}
                  <circle cx="360" cy="220" r="16" fill="#eab308" opacity="0.1" />
                  <circle cx="360" cy="220" r="13" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2">
                    <animateTransform attributeName="transform" type="rotate" from="0 360 220" to="360 360 220" dur="4s" repeatCount="indefinite" />
                  </circle>
                  {/* Routing arrows */}
                  <path d="M 354 220 A 6 6 0 0 1 366 220" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 366 220 A 6 6 0 0 1 354 220" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
                  <polygon points="364,218 367,221 370,218" fill="#f59e0b" />
                  <polygon points="350,222 353,219 356,222" fill="#f59e0b" />
                  {/* Signal Lines */}
                  <line x1="385" y1="208" x2="435" y2="208" stroke="#4a044e" strokeWidth="2" strokeLinecap="round" />
                  <line x1="385" y1="220" x2="435" y2="220" stroke="#4a044e" strokeWidth="2" strokeLinecap="round" />
                  <line x1="385" y1="232" x2="425" y2="232" stroke="#4a044e" strokeWidth="2" strokeLinecap="round" />
                  {/* Blinking Dots */}
                  <circle cx="395" cy="208" r="1.5" fill="#a855f7"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.4s" repeatCount="indefinite" /></circle>
                  <circle cx="410" cy="220" r="1.5" fill="#22c55e"><animate attributeName="opacity" values="1;0.1;1" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="420" cy="232" r="1.5" fill="#eab308"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite" /></circle>
                  <text x="390" y="184" textAnchor="middle" fontSize="9" fill="#c084fc" fontWeight="600">📍 Route 53 (Authoritative)</text>
                </g>

                {/* 6. WEB SERVER TARGET */}
                <g filter={dnsStepIndex === 6 ? "url(#glow-orange)" : undefined}>
                  <rect x="550" y="100" width="120" height="60" rx="8" fill="#0f172a" stroke={dnsStepIndex === 6 ? "#0ea5e9" : "#475569"} strokeWidth="1.5" />
                  <rect x="552" y="102" width="116" height="56" rx="6" fill="#020617" />
                  {/* Disk drive shapes */}
                  <rect x="560" y="112" width="40" height="10" rx="2" fill="#1e293b" />
                  <circle cx="566" cy="117" r="2" fill="#22c55e"><animate attributeName="opacity" values="1;0.2;1" dur="0.3s" repeatCount="indefinite" /></circle>
                  <line x1="576" y1="117" x2="594" y2="117" stroke="#475569" strokeWidth="1.5" />

                  <rect x="560" y="126" width="40" height="10" rx="2" fill="#1e293b" />
                  <circle cx="566" cy="131" r="2" fill="#22c55e"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.6s" repeatCount="indefinite" /></circle>
                  <line x1="576" y1="131" x2="594" y2="131" stroke="#475569" strokeWidth="1.5" />

                  <rect x="560" y="140" width="40" height="10" rx="2" fill="#1e293b" />
                  <circle cx="566" cy="145" r="2" fill="#ef4444"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.9s" repeatCount="indefinite" /></circle>
                  <line x1="576" y1="145" x2="594" y2="145" stroke="#475569" strokeWidth="1.5" />

                  {/* Server Grille slots */}
                  <line x1="614" y1="114" x2="654" y2="114" stroke="#334155" strokeWidth="2" />
                  <line x1="614" y1="126" x2="654" y2="126" stroke="#334155" strokeWidth="2" />
                  <line x1="614" y1="138" x2="654" y2="138" stroke="#334155" strokeWidth="2" />
                  <line x1="614" y1="148" x2="644" y2="148" stroke="#334155" strokeWidth="2" />

                  <text x="610" y="94" textAnchor="middle" fontSize="9" fill="#38bdf8" fontWeight="600">🖥️ Web Server</text>
                  <text x="610" y="172" textAnchor="middle" fontSize="8" fill="#94a3b8">IP: 1.2.3.4 (Host)</text>
                </g>

                {/* 7. PRIVATE CACHE CABINET */}
                <g opacity="0.95">
                  <rect
                    x="10"
                    y="10"
                    width="130"
                    height="72"
                    rx="8"
                    fill="#0f172a"
                    stroke={cacheBoxStroke}
                    strokeWidth={cacheBoxStrokeWidth}
                    className={cacheBoxClass}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text x="75" y="24" textAnchor="middle" fontSize="10" fill={hasCacheItems ? "#4ade80" : "#94a3b8"} fontWeight="bold">📦 DNS Caches</text>
                  {/* Small folders */}
                  <rect
                    x="20"
                    y="32"
                    width="22"
                    height="14"
                    rx="2"
                    fill="#1e293b"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "#10b981" : "#ef4444") : (hasCacheItems ? "#22c55e" : "#475569")}
                    strokeWidth="0.8"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.8 : 0.4)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="31" y="42" textAnchor="middle" fontSize="6.5" fill="#e2e8f0">Browser</text>

                  <rect
                    x="54"
                    y="32"
                    width="22"
                    height="14"
                    rx="2"
                    fill="#1e293b"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "#10b981" : "#ef4444") : (hasCacheItems ? "#22c55e" : "#475569")}
                    strokeWidth="0.8"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.8 : 0.4)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="65" y="42" textAnchor="middle" fontSize="6.5" fill="#e2e8f0">OS</text>

                  <rect
                    x="88"
                    y="32"
                    width="22"
                    height="14"
                    rx="2"
                    fill="#1e293b"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "#10b981" : "#ef4444") : (hasCacheItems ? "#22c55e" : "#475569")}
                    strokeWidth="0.8"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.8 : 0.4)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="99" y="42" textAnchor="middle" fontSize="6.5" fill="#e2e8f0">Resolver</text>

                  <text
                    x="75"
                    y="64"
                    textAnchor="middle"
                    fontSize="7.5"
                    fill={dnsStepIndex === 1 ? (isCacheHit ? "#10b981" : "#ef4444") : (hasCacheItems ? "#34d399" : "#64748b")}
                    fontStyle="italic"
                    fontWeight={dnsStepIndex === 1 || hasCacheItems ? "bold" : "normal"}
                    style={{ transition: 'all 0.3s' }}
                  >
                    {dnsStepIndex === 1
                      ? (isCacheHit ? "⚡ CACHE HIT!" : "❌ CACHE MISS!")
                      : (hasCacheItems ? "🟢 Active Cache Records" : "Caches prevent external lookups")}
                  </text>
                </g>

                {/* ANIMATED PACKETS */}
                {dnsStepIndex === 1 && (
                  <>
                    {isCacheHit ? (
                      <>
                        {/* Packet from Browser to Cache */}
                        <circle cx="60" cy="130" r="4" fill="#10b981" filter="url(#glow)">
                          <animate attributeName="cx" values="60;75" dur="0.8s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="130;46" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        {/* Packet returning from Cache to Browser */}
                        <circle cx="75" cy="46" r="4" fill="#34d399" filter="url(#glow)">
                          <animate attributeName="cx" values="75;60" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="46;130" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
                        </circle>
                      </>
                    ) : (
                      <>
                        {/* Orange/Red Cache query showing Miss */}
                        <circle cx="60" cy="130" r="4" fill="#f97316" filter="url(#glow)">
                          <animate attributeName="cx" values="60;75" dur="0.8s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="130;46" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        {/* Original resolver packet trail starts on Cache Miss */}
                        <circle cx="145" cy="130" r="5" fill="#ef4444" filter="url(#glow)">
                          <animate attributeName="cx" values="75;215" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}
                  </>
                )}
                {dnsStepIndex === 2 && (
                  <circle cx="305" cy="85" r="5" fill="#ef4444" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="130;38;130" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 3 && (
                  <circle cx="275" cy="130" r="5" fill="#3b82f6" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 4 && (
                  <circle cx="305" cy="175" r="5" fill="#c084fc" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="130;220;130" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 5 && (
                  <circle cx="145" cy="130" r="5" fill={isCacheHit ? "#10b981" : "#f97316"} filter="url(#glow)">
                    <animate attributeName="cx" values="220;75" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>

            <div className="r53-g2">
              <div>
                <div className="r53-sec">DNS Resolution Simulator</div>
                <div className="r53-card">
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Type a domain name and simulate standard DNS lookup steps:</div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <input
                      id="dnsInput"
                      type="text"
                      value={dnsInput}
                      onChange={(e) => setDnsInput(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: '12px',
                        padding: '6px 10px',
                        border: '0.5px solid var(--color-border-secondary)',
                        borderRadius: '6px',
                        background: 'var(--color-background-secondary)',
                        color: 'var(--color-text-primary)',
                        outline: 'none'
                      }}
                    />
                    <button className="r53-btn r53-on" onClick={simulateDNS} disabled={isResolving}>
                      {isResolving ? 'Resolving...' : 'Resolve ▶'}
                    </button>
                  </div>
                  <div ref={dnsLogRef} className="r53-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                    {dnsSteps.length === 0 ? '; Waiting for resolution...\n; Enter domain name and click Resolve above.' : dnsSteps.join('\n')}
                  </div>
                </div>
                <div className="r53-sec">DNS Terminology</div>
                <div className="r53-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '8px', color: '#7c3aed' }}>Key Terms Explained</div>
                  <div className="r53-kv"><span className="r53-kk">Domain Name</span><b>Human-readable address (example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk">IP Address</span><b>Machine address (1.2.3.4 or IPv6)</b></div>
                  <div className="r53-kv"><span className="r53-kk">DNS Resolver</span><b>Recursive server that does the lookup lookup work</b></div>
                  <div className="r53-kv"><span className="r53-kk">Root Nameserver</span><b>Top of DNS hierarchy (13 root clusters globally)</b></div>
                  <div className="r53-kv"><span className="r53-kk">TLD Nameserver</span><b>Handles .com, .org, .io, .in etc. (Top Level Domains)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Authoritative NS</span><b>Final answer holder — stores actual DNS records</b></div>
                  <div className="r53-kv"><span className="r53-kk">TTL</span><b>Time-to-live — how long a record can be cached</b></div>
                  <div className="r53-kv"><span className="r53-kk">Zone</span><b>A managed portion of DNS namespace (e.g., example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk">FQDN</span><b>Fully Qualified Domain Name (e.g., www.example.com.)</b></div>
                </div>
              </div>

              <div>
                <div className="r53-sec">📦 Active DNS Cache Status</div>
                <div className="r53-card" style={{ borderLeft: '3px solid #10b981', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Real-Time TTL Countdown &amp; Cache Monitor
                    </span>
                    <button
                      className="r53-btn"
                      onClick={() => setDnsCache({})}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        background: 'transparent',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      title="Flush all DNS cache records"
                    >
                      🗑️ Clear Cache
                    </button>
                  </div>

                  {Object.keys(dnsCache).length === 0 ? (
                    <div style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      fontStyle: 'italic',
                      background: 'var(--color-background-secondary)',
                      borderRadius: '6px',
                      border: '0.5px dashed var(--color-border-secondary)'
                    }}>
                      🔌 Cache is empty. Run a DNS resolution to see records populate here.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(dnsCache).map(([domain, data]) => {
                        const pct = Math.max(0, Math.min(100, (data.ttl / data.maxTtl) * 100));
                        const progressColor = data.ttl > 60 ? '#10b981' : data.ttl > 15 ? '#eab308' : '#ef4444';

                        return (
                          <div
                            key={domain}
                            style={{
                              background: 'var(--color-background-secondary)',
                              border: '0.5px solid var(--color-border-secondary)',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                                {domain}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="r53-badge" style={{ background: '#1e293b', color: '#38bdf8', padding: '1px 5px', fontSize: '9px', border: '0.5px solid #0284c7' }}>
                                  A Record
                                </span>
                                <span style={{ fontWeight: 'bold', color: progressColor, fontFamily: 'monospace' }}>
                                  ⏳ {data.ttl}s
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                              <span>IP: <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{data.ip}</strong></span>
                              <span style={{ fontStyle: 'italic', fontSize: '9px' }}>TTL Max: {data.maxTtl}s</span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: progressColor,
                                  boxShadow: `0 0 4px ${progressColor}`,
                                  transition: 'width 1s linear, background-color 0.5s'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Educational block */}
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#022c22',
                    border: '0.5px solid #064e3b',
                    fontSize: '11.5px',
                    lineHeight: '1.45',
                    color: '#a7f3d0'
                  }}>
                    <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>💡 How Caching Works:</strong>
                    When you query a domain for the first time (Cache Miss), the resolver performs the full recursive lookup and stores it in your local cache for the duration of the Time-To-Live (TTL = 300s). Subsequent queries within this window (Cache Hit) are served instantly from the local cache without any external network request, bypassing Root, TLD, and Route 53 completely!
                  </div>
                </div>

                <div className="r53-sec">DNS Hierarchy Visualized</div>
                <div className="r53-card" style={{ display: 'flex', justifyContent: 'center', padding: '10px 14px' }}>
                  <svg width="100%" viewBox="0 0 320 250" style={{ display: 'block' }}>
                    <rect x="120" y="5" width="80" height="34" rx="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5" />
                    <text x="160" y="26" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">. (Root)</text>

                    <rect x="20" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="60" y="91" textAnchor="middle" fontSize="11" fill="#1d4ed8">.com TLD</text>
                    <rect x="120" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="160" y="91" text-anchor="middle" fontSize="11" fill="#1d4ed8">.org TLD</text>
                    <rect x="220" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="260" y="91" text-anchor="middle" fontSize="11" fill="#1d4ed8">.io TLD</text>

                    <rect x="20" y="136" width="90" height="34" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="65" y="157" text-anchor="middle" fontSize="11" fill="#15803d">example.com</text>
                    <rect x="130" y="136" width="90" height="34" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="175" y="157" text-anchor="middle" fontSize="11" fill="#15803d">google.com</text>

                    <rect x="20" y="202" width="90" height="34" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="65" y="216" text-anchor="middle" fontSize="10" fill="#854d0e">www.</text>
                    <text x="65" y="230" text-anchor="middle" fontSize="9" fill="#854d0e">example.com</text>
                    <rect x="130" y="202" width="90" height="34" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="175" y="216" text-anchor="middle" fontSize="10" fill="#854d0e">api.</text>
                    <text x="175" y="230" text-anchor="middle" fontSize="9" fill="#854d0e">example.com</text>

                    <line x1="160" y1="39" x2="60" y2="70" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="160" y1="39" x2="160" y2="70" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="160" y1="39" x2="260" y2="70" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="60" y1="104" x2="65" y2="136" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="60" y1="104" x2="175" y2="136" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="65" y1="170" x2="65" y2="202" stroke="#6b7280" strokeWidth="0.5" />
                    <line x1="65" y1="170" x2="175" y2="202" stroke="#6b7280" strokeWidth="0.5" />
                  </svg>
                </div>


              </div>
            </div>
          </div>
        )}

        {/* OVERVIEW PANEL */}
        {activeSection === 'r53' && (
          <div>
            <div className="r53-sec">Route 53 Overview</div>
            <div className="r53-g2">
              <div>
                <div className="r53-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#7c3aed' }}>🚀 Three Core Services in One</div>
                  <div className="r53-kv"><span className="r53-kk">1. Domain Registrar</span><b>Buy, renew, and manage domain registrations</b></div>
                  <div className="r53-kv"><span className="r53-kk">2. DNS Hosting</span><b>Authoritative DNS servers answering global queries</b></div>
                  <div className="r53-kv"><span className="r53-kk">3. Health Checker</span><b>Probe target health and route around network failures</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#15803d' }}>Why is it named "Route 53"?</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Standard DNS service operates on <b>Port 53</b> (for both UDP and TCP queries). Route 53 routes internet traffic to hosts via Port 53. It is also an references play on the historical US Highway <b>Route 66</b>.
                  </div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #0369a1', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#0369a1' }}>Key DNS Metrics &amp; Parameters</div>
                  <div className="r53-kv"><span className="r53-kk">SLA Guarantee</span><b style={{ color: '#15803d' }}>100% Availability SLA (Unique in AWS)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Edge Locations</span><b>400+ DNS routing edge POPs globally</b></div>
                  <div className="r53-kv"><span className="r53-kk">DNSSEC Support</span><b>✅ Enabled (DNS Cryptographic Security)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Cost Parameters</span><b>$0.50 per hosted zone/mo + $0.40 per M queries</b></div>
                  <div className="r53-kv"><span className="r53-kk">IPv4 &amp; IPv6</span><b>Full dual-stack resolution (A &amp; AAAA records)</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #c2410c' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#c2410c' }}>Route 53 vs Standard Registrars</div>
                  <div className="r53-kv"><span className="r53-kk">vs GoDaddy / Domain.com</span><b>AWS provides smart failover &amp; active health probes</b></div>
                  <div className="r53-kv"><span className="r53-kk">vs Cloudflare DNS</span><b>Route 53 integrates natively with AWS endpoints (ALB, Alias)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Route 53 exclusive</span><b>ALIAS apex records, Calculated checks, Private Hosted Zones</b></div>
                </div>
              </div>

              <div>
                <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Route 53 Operational Architecture</div>
                  <svg width="100%" viewBox="0 0 340 420" style={{ display: 'block' }}>
                    <defs>
                      <marker id="r1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed" /></marker>
                      <marker id="r2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d" /></marker>
                    </defs>
                    <rect x="10" y="10" width="320" height="52" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="170" y="30" text-anchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🌐 User requests domain.com</text>
                    <text x="170" y="48" text-anchor="middle" fontSize="11" fill="#7c3aed">Browser / App / Client device</text>

                    <rect x="10" y="86" width="320" height="52" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5" />
                    <text x="170" y="106" text-anchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🔄 DNS Resolver (8.8.8.8 / ISP)</text>
                    <text x="170" y="124" text-anchor="middle" fontSize="11" fill="#c2410c">Performs recursive checks → queries Route 53</text>

                    <rect x="10" y="162" width="320" height="72" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="170" y="182" text-anchor="middle" fontSize="13" fill="#7c3aed" fontWeight="500">🚀 Route 53 DNS</text>
                    <rect x="22" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="67" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Hosted Zone</text>
                    <rect x="125" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="170" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Routing Rules</text>
                    <rect x="228" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="273" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Health Status</text>

                    <rect x="10" y="258" width="148" height="52" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="84" y="278" text-anchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">⚖️ ALB / NLB</text>
                    <text x="84" y="296" text-anchor="middle" fontSize="11" fill="#1d4ed8">Elastic Load Balancer</text>
                    <rect x="182" y="258" width="148" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="256" y="278" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">☁️ CloudFront</text>
                    <text x="256" y="296" text-anchor="middle" fontSize="11" fill="#166534">Global CDN Distribution</text>

                    <rect x="10" y="334" width="90" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="55" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">EC2</text>
                    <text x="55" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">VM Instances</text>
                    <rect x="115" y="334" width="90" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="160" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">ECS/EKS</text>
                    <text x="160" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">Containers</text>
                    <rect x="220" y="334" width="110" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="275" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">S3 / Lambda</text>
                    <text x="275" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">Serverless Hosting</text>

                    <line x1="170" y1="62" x2="170" y2="86" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)" />
                    <line x1="170" y1="138" x2="170" y2="162" stroke="#c2410c" strokeWidth="1" markerEnd="url(#r1)" />
                    <line x1="110" y1="234" x2="84" y2="258" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)" />
                    <line x1="230" y1="234" x2="256" y2="258" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)" />
                    <line x1="84" y1="310" x2="55" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)" />
                    <line x1="84" y1="310" x2="160" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)" />
                    <line x1="256" y1="310" x2="275" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECORDS & ZONES PANEL */}
        {activeSection === 'records' && (
          <div>
            <div className="r53-sec">Hosted Zone Types</div>
            <div className="r53-g2" style={{ marginBottom: '10px' }}>
              <div className="r53-card" style={{ border: '2px solid #7c3aed' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#7c3aed' }}>🌐 Public Hosted Zone</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  Registers a zone accessible over the public internet. Translates requests from external users to public AWS resource endpoints or external IPs.
                </div>
                <div className="r53-kv"><span className="r53-kk">Scope</span><b>Public Internet</b></div>
                <div className="r53-kv"><span className="r53-kk">Use Case</span><b>www.my-app.com → Public ALB</b></div>
                <div className="r53-kv"><span className="r53-kk">Name Servers</span><b>4 Authoritative Route 53 Nameservers</b></div>
                <div className="r53-kv"><span className="r53-kk">Cost Parameters</span><b>$0.50 per month / zone</b></div>
              </div>

              <div className="r53-card" style={{ border: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#0369a1' }}>🔒 Private Hosted Zone</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  Registers a zone accessible only within one or more designated Amazon VPCs. Restricts domain resolution from the public web entirely.
                </div>
                <div className="r53-kv"><span className="r53-kk">Scope</span><b>Assigned Amazon VPCs Only</b></div>
                <div className="r53-kv"><span className="r53-kk">Use Case</span><b>db.internal → Private RDS Instance Endpoint</b></div>
                <div className="r53-kv"><span className="r53-kk">VPC Association</span><b>Peered or local VPC subnets (Cross-Account OK)</b></div>
                <div className="r53-kv"><span className="r53-kk">Cost Parameters</span><b>$0.50 per month / zone</b></div>
              </div>
            </div>

            <div className="r53-sec">Route 53 DNS Record Types — Interactive Explorer</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {(Object.keys(recordDetails) as RecordType[]).map((rec) => (
                <button
                  key={rec}
                  onClick={() => setActiveRecord(rec)}
                  className={`r53-btn ${activeRecord === rec ? 'r53-on' : ''}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  {rec} Record {rec === 'ALIAS' && '⭐'}
                </button>
              ))}
            </div>

            <div className="r53-g2">
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                  {recordDetails[activeRecord].title}
                </div>
                <div className="r53-card" style={{ minHeight: '130px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                    {recordDetails[activeRecord].desc}
                  </div>
                  {recordDetails[activeRecord].specs.map((s, idx) => (
                    <div key={idx} className="r53-kv">
                      <span className="r53-kk" style={{ minWidth: '100px' }}>{s.k}</span>
                      <b>{s.v}</b>
                    </div>
                  ))}
                </div>
                <div className="r53-sec">Standard BIND Zone Format Example</div>
                <pre className="r53-log" style={{ fontSize: '11px' }}>{recordDetails[activeRecord].example}</pre>
              </div>

              <div>
                <div className="r53-sec">CNAME vs ALIAS — Critical Architectural Difference</div>
                <div className="r53-card" style={{ borderLeft: '3px solid #dc2626', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#dc2626' }}>CNAME (Standard DNS Specification)</div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Points To</span><b>Another DNS Hostname</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Zone Apex Apex?</span><b style={{ color: '#dc2626' }}>❌ Prohibited at root level (example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Resolution</span><b>Requires two separate DNS query lookups</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Query Charges</span><b>Billed standard query rates</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#15803d' }}>ALIAS (Route 53 Specific Extension)</div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Points To</span><b>Selected AWS Target (ALB, CloudFront, S3 Website)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Zone Apex Apex?</span><b style={{ color: '#15803d' }}>✅ Allowed at root level (example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Resolution</span><b>Resolved internally by Route 53 in 1 lookup cycle</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Query Charges</span><b style={{ color: '#15803d' }}>🆓 Fully free for standard AWS Resource targets</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #854d0e' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#854d0e', marginBottom: '4px' }}>⚠️ DNS Limitation: ALIAS Target Bounds</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    ALIAS records can point ONLY to managed AWS services with standard static hostnames (e.g., Application Load Balancers, CloudFront distributions, S3 buckets, API Gateways). <b>They cannot point directly to a standard EC2 instance public DNS name.</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROUTING POLICIES PANEL */}
        {activeSection === 'routing' && (
          <div>
            <div className="r53-sec">Route 53 Routing Policies — Visual Flow Explorer</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(Object.keys(policyDetails) as PolicyType[]).map((pol) => (
                <button
                  key={pol}
                  onClick={() => setActivePolicy(pol)}
                  className={`r53-btn ${activePolicy === pol ? 'r53-on' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {pol === 'geo' ? 'Geolocation' : pol === 'geoprox' ? 'Geoproximity' : pol === 'multivalue' ? 'Multi-Value' : pol === 'ipbased' ? 'IP-Based' : pol}
                </button>
              ))}
            </div>

            <div className="r53-g2">
              <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Policy Diagram: {activePolicy.toUpperCase()}
                </div>

                {activePolicy === 'simple' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="30" r="18" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="160" y="34" textAnchor="middle" fontSize="14">💻</text>
                    <text x="160" y="60" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="bold">Global User</text>

                    <rect x="100" y="90" width="120" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="114" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Simple)</text>

                    <rect x="40" y="170" width="100" height="36" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="90" y="192" textAnchor="middle" fontSize="10" fill="#854d0e">IP: 1.2.3.4 (Static)</text>
                    <rect x="180" y="170" width="100" height="36" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                    <text x="230" y="192" text-anchor="middle" fontSize="10" fill="#854d0e">IP: 1.2.3.5 (Static)</text>

                    <line x1="160" y1="65" x2="160" y2="88" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2" />
                    <line x1="140" y1="130" x2="90" y2="168" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="180" y1="130" x2="230" y2="168" stroke="#7c3aed" strokeWidth="1" />
                  </svg>
                )}

                {activePolicy === 'weighted' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="30" r="18" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="160" y="34" text-anchor="middle" fontSize="14">💻</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Weighted)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5" />
                    <text x="80" y="178" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">Region A (70%)</text>
                    <text x="80" y="194" textAnchor="middle" fontSize="9" fill="#dc2626">us-east-1 ALB</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">Region B (30%)</text>
                    <text x="240" y="194" text-anchor="middle" fontSize="9" fill="#1d4ed8">eu-west-1 ALB</text>

                    <line x1="160" y1="50" x2="160" y2="78" stroke="#6b7280" strokeWidth="1" />
                    <line x1="120" y1="120" x2="80" y2="158" stroke="#7c3aed" strokeWidth="1.5" />
                    <text x="90" y="136" fontSize="9" fill="#7c3aed" fontWeight="bold">70% traffic</text>
                    <line x1="200" y1="120" x2="240" y2="158" stroke="#7c3aed" strokeWidth="1" />
                    <text x="220" y="136" fontSize="9" fill="#7c3aed">30% traffic</text>
                  </svg>
                )}

                {activePolicy === 'latency' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="60" cy="30" r="16" fill="#fef2f2" stroke="#fca5a5" />
                    <text x="60" y="34" textAnchor="middle" fontSize="12">🇺🇸</text>
                    <circle cx="260" cy="30" r="16" fill="#dcfce7" stroke="#86efac" />
                    <text x="260" y="34" textAnchor="middle" fontSize="12">🇮🇳</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Latency)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5" />
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#c2410c" fontWeight="bold">us-east-1 (12ms)</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#c2410c">Closest to USA</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">ap-south-1 (18ms)</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#15803d">Closest to India</text>

                    <line x1="70" y1="46" x2="115" y2="80" stroke="#dc2626" strokeWidth="1" />
                    <line x1="250" y1="46" x2="205" y2="80" stroke="#15803d" strokeWidth="1" />
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#7c3aed" strokeWidth="1" />
                  </svg>
                )}

                {activePolicy === 'failover' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="25" r="16" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="160" y="29" textAnchor="middle" fontSize="12">💻</text>

                    <rect x="90" y="70" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="94" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Failover)</text>

                    <rect x="20" y="150" width="120" height="50" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="80" y="168" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">Primary Writer</text>
                    <text x="80" y="182" text-anchor="middle" fontSize="9" fill="#166534">✅ HEALTHY</text>
                    <text x="80" y="194" text-anchor="middle" fontSize="8" fill="#166534">us-east-1</text>

                    <rect x="180" y="150" width="120" height="50" rx="6" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5" />
                    <text x="240" y="168" text-anchor="middle" fontSize="10" fill="#991b1b" fontWeight="bold">Secondary Standby</text>
                    <text x="240" y="182" text-anchor="middle" fontSize="9" fill="#991b1b">💤 PASSIVE STANDBY</text>
                    <text x="240" y="194" text-anchor="middle" fontSize="8" fill="#991b1b">eu-west-1</text>

                    <line x1="160" y1="42" x2="160" y2="68" stroke="#6b7280" strokeWidth="1" />
                    <line x1="120" y1="110" x2="80" y2="150" stroke="#15803d" strokeWidth="2" />
                    <line x1="200" y1="110" x2="240" y2="150" stroke="#991b1b" strokeWidth="1" strokeDasharray="4,2" />
                  </svg>
                )}

                {activePolicy === 'geo' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="70" cy="30" r="16" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="70" y="34" textAnchor="middle" fontSize="12">🇪🇺</text>
                    <text x="70" y="54" textAnchor="middle" fontSize="9" fill="#6d28d9">Europe User</text>

                    <circle cx="250" cy="30" r="16" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="250" y="34" textAnchor="middle" fontSize="12">🇯🇵</text>
                    <text x="250" y="54" textAnchor="middle" fontSize="9" fill="#6d28d9">Japan User</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Geo)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">eu-west-1 ALB</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Bound: Europe Continent</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">ap-northeast-1 ALB</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Bound: Japan Country</text>

                    <line x1="85" y1="46" x2="120" y2="80" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="235" y1="46" x2="200" y2="80" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#1d4ed8" strokeWidth="1.5" />
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#1d4ed8" strokeWidth="1.5" />
                  </svg>
                )}

                {activePolicy === 'geoprox' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <rect x="10" y="10" width="300" height="200" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />

                    {/* Region Circles */}
                    <circle cx="90" cy="110" r="50" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" strokeDasharray="3,2" />
                    <circle cx="230" cy="110" r="70" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />

                    <circle cx="90" cy="110" r="4" fill="#dc2626" />
                    <text x="90" y="125" text-anchor="middle" fontSize="9" fill="#dc2626" fontWeight="bold">US East (No Bias)</text>

                    <circle cx="230" cy="110" r="4" fill="#1d4ed8" />
                    <text x="230" y="125" text-anchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="bold">EU West (+30 Bias)</text>

                    <text x="160" y="40" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="bold">Geographic Proximity Map Bias</text>
                    <text x="160" y="55" textAnchor="middle" fontSize="8" fill="#64748b">Expanded bias shifts proximity borders</text>
                  </svg>
                )}

                {activePolicy === 'multivalue' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="25" r="16" fill="#ede9fe" stroke="#c4b5fd" />
                    <text x="160" y="29" text-anchor="middle" fontSize="12">💻</text>

                    <rect x="90" y="66" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="90" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Multi-Value)</text>

                    {/* Returning healthy IPs */}
                    <rect x="20" y="130" width="85" height="30" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="625" y="148" textAnchor="middle" fontSize="9" fill="#15803d" transform="translate(-562, 0)">10.0.1.10 ✅</text>

                    <rect x="117.5" y="130" width="85" height="30" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="160" y="148" textAnchor="middle" fontSize="9" fill="#15803d">10.0.1.20 ✅</text>

                    <rect x="215" y="130" width="85" height="30" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5" />
                    <text x="257.5" y="148" text-anchor="middle" fontSize="9" fill="#b91c1c">10.0.1.30 ❌</text>

                    <text x="160" y="195" text-anchor="middle" fontSize="10" fill="#475569">Returns all healthy values (up to 8) to client</text>

                    <line x1="160" y1="41" x2="160" y2="66" stroke="#6b7280" strokeWidth="1" />
                    <line x1="110" y1="106" x2="62" y2="130" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="160" y1="106" x2="160" y2="130" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="210" y1="106" x2="257" y2="130" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
                  </svg>
                )}

                {activePolicy === 'ipbased' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <rect x="20" y="16" width="100" height="36" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                    <text x="70" y="32" text-anchor="middle" fontSize="9" fill="#475569" fontWeight="bold">CIDR Collection A</text>
                    <text x="70" y="44" text-anchor="middle" fontSize="8" fill="#64748b">192.168.1.0/24</text>

                    <rect x="200" y="16" width="100" height="36" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
                    <text x="250" y="32" text-anchor="middle" fontSize="9" fill="#475569" fontWeight="bold">Any Other Subnet</text>
                    <text x="250" y="44" text-anchor="middle" fontSize="8" fill="#64748b">0.0.0.0/0 (Default)</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (IP-Based)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">Corporate Proxy</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#15803d">Target A (Internal)</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">Public ALB</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Target B (Public)</text>

                    <line x1="70" y1="52" x2="120" y2="80" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="250" y1="52" x2="200" y2="80" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#7c3aed" strokeWidth="1" />
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#7c3aed" strokeWidth="1" />
                  </svg>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                  {policyDetails[activePolicy].title}
                </div>
                <div className="r53-card" style={{ fontSize: '12px', minHeight: '120px', lineHeight: '1.4' }}>
                  {policyDetails[activePolicy].desc}
                </div>
                <div className="r53-sec">Standard Use Cases</div>
                <ul className="r53-ck" style={{ marginBottom: '12px' }}>
                  {policyDetails[activePolicy].useCases.map((uc, idx) => (
                    <li key={idx}>{uc}</li>
                  ))}
                </ul>
                <div className="r53-sec">Route 53 JSON/Terraform Definition</div>
                <pre className="r53-log" style={{ fontSize: '11px' }}>{policyDetails[activePolicy].config}</pre>
              </div>
            </div>

            {/* DYNAMIC POLICY SIMULATORS BLOCK */}
            <div className="r53-sec" style={{ marginTop: '20px' }}>🎯 Interactive {activePolicy.charAt(0).toUpperCase() + activePolicy.slice(1)} Routing Simulator</div>

            {activePolicy === 'simple' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  The Simple policy resolves requests to a static list of resource IPs in random order. Simulate queries below to see how standard clients receive all IPs.
                </div>
                <div className="r53-g2">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Domain Lookup Target</label>
                    <input
                      type="text"
                      value={simpleDomain}
                      onChange={(e) => setSimpleDomain(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', marginBottom: '12px' }}
                    />
                    <button onClick={runSimpleSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isSimpleSimulating ? '⏳ Querying Route 53...' : '🔍 Resolve DNS (Simple)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Route 53 DNS Response Payload</div>
                    {simpleResolvedIPs.length > 0 ? (
                      <div className="r53-mono" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        Domain: <b>{simpleDomain}</b><br />
                        Record Type: <b>A</b> | TTL: <b>300s</b><br />
                        IPs Returned: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{simpleResolvedIPs.join(', ')}</span><br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)' }}>
                          💡 <b>Browser Behavior:</b> Recursive resolver returns both IPs. Your browser selected <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{simpleSelectedIP}</span> at random for connection.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                        Click "Resolve DNS" to capture the DNS response packet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'weighted' && (
              <div className="r53-g2">
                <div className="r53-card">
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Adjust weights (total = 100)</div>

                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Region A (us-east-1):</span>
                    <b style={{ color: '#dc2626' }}>{weightA}%</b>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weightA}
                    onChange={(e) => setWeightA(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed', cursor: 'ew-resize', marginBottom: '12px' }}
                  />

                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Region B (eu-west-1): <b style={{ color: '#1d4ed8' }}>{weightB}%</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                    Region C (ap-south-1): <b style={{ color: '#15803d' }}>{weightC}%</b>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, borderTop: '0.5px solid var(--color-border-secondary)', paddingTop: '10px' }}>
                    Out of 1000 requests distributed:
                  </div>
                  <div className="r53-g3" style={{ marginTop: '8px' }}>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>us-east-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#dc2626' }}>{weightA * 10}</div>
                    </div>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>eu-west-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#1d4ed8' }}>{weightB * 10}</div>
                    </div>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ap-south-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#15803d' }}>{weightC * 10}</div>
                    </div>
                  </div>
                </div>

                <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Traffic Distribution Proportional Bar</div>
                    <canvas ref={canvasRef} width="280" height="110" style={{ width: '100%', borderRadius: '8px', background: 'var(--color-background-secondary)' }}></canvas>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc2626', borderRadius: '2px' }}></span>us-east-1 (Red)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#1d4ed8', borderRadius: '2px' }}></span>eu-west-1 (Blue)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#15803d', borderRadius: '2px' }}></span>ap-south-1 (Green)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'latency' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Latency routing matches global clients with the AWS datacenter region that provides the lowest round-trip delay. Select a client region to run queries.
                </div>
                <div className="r53-g2">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Select Client Query Location</label>
                    <select
                      value={latencyClientRegion}
                      onChange={(e) => setLatencyClientRegion(e.target.value as any)}
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', marginBottom: '12px' }}
                    >
                      <option value="usa">🇺🇸 United States (New York)</option>
                      <option value="europe">🇪🇺 Europe (Frankfurt)</option>
                      <option value="india">🇮🇳 India (Mumbai)</option>
                      <option value="australia">🇦🇺 Australia (Sydney)</option>
                    </select>
                    <button onClick={runLatencySim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isLatencySimulating ? '⏳ Measuring latencies...' : '⚡ Resolve DNS (Latency)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Estimated Region Latencies Comparison</div>
                    {latencyResults.length > 0 ? (
                      <div>
                        {latencyResults.map((res, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '5px 8px', borderRadius: '4px', background: res.win ? '#dcfce7' : '#ffffff', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '4px' }}>
                            <span style={{ fontWeight: res.win ? 600 : 400, color: res.win ? '#15803d' : 'var(--color-text-primary)' }}>{res.region}</span>
                            <span style={{ fontWeight: 'bold', color: res.win ? '#15803d' : '#ef4444' }}>{res.latency} ms {res.win ? '⭐ (Win)' : ''}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          🎉 Route 53 automatically routed user to the closest datacenter with **{latencyResults.find(r => r.win)?.region.split(' ')[0]}** server cluster.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '25px' }}>
                        Click "Resolve DNS" to measure network latency targets
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'failover' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Enforces Active-Passive disaster recovery. If health probes mark the primary server unhealthy, Route 53 instantly updates the CNAME target to passive backup.
                </div>
                <div className="r53-g2">
                  <div>
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>Primary Server (us-east-1):</span>
                        <button
                          onClick={() => setRoutingPrimHealthy(!routingPrimHealthy)}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: routingPrimHealthy ? '#dcfce7' : '#fee2e2', border: '0.5px solid', borderColor: routingPrimHealthy ? '#86efac' : '#fca5a5', color: routingPrimHealthy ? '#166534' : '#991b1b', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {routingPrimHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>Secondary Server (eu-west-1):</span>
                        <button
                          onClick={() => setRoutingSecHealthy(!routingSecHealthy)}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: routingSecHealthy ? '#dcfce7' : '#fee2e2', border: '0.5px solid', borderColor: routingSecHealthy ? '#86efac' : '#fca5a5', color: routingSecHealthy ? '#166534' : '#991b1b', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {routingSecHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>
                    </div>
                    <button onClick={runFailoverSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isFailoverSimulating ? '⏳ Probing endpoints...' : '🛡️ Resolve DNS (Failover)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Failover DNS Outcome</div>
                    {failoverOutcomeText ? (
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: failoverOutcomeColor }}>{failoverOutcomeText}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                          {routingPrimHealthy
                            ? 'Primary instance is fully healthy. Queries route here to maintain standard active operations.'
                            : routingSecHealthy
                              ? 'Primary failed health check threshold. Route 53 automatically diverted traffic to the passive secondary backup.'
                              : 'Outage! Both primary and secondary targets failed health checks. Route 53 returns server error.'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                        Click "Resolve DNS" to trigger the failover resolver
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'geo' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Routes client queries based on their physical geographical continent or country boundary parameters. Excellent for content localization.
                </div>
                <div className="r53-g2">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Select Client Location Continent</label>
                    <select
                      value={geoClientContinent}
                      onChange={(e) => setGeoClientContinent(e.target.value as any)}
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', marginBottom: '12px' }}
                    >
                      <option value="na">🇺🇸 North America (USA)</option>
                      <option value="eu">🇪🇺 Europe continent</option>
                      <option value="as">🇯🇵 Japan country</option>
                      <option value="sa">🇧🇷 South America (Brazil)</option>
                    </select>
                    <button onClick={runGeoSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isGeoSimulating ? '⏳ Mapping client IP country...' : '🌍 Resolve DNS (Geolocation)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Geolocation Routing Outcome</div>
                    {geoResolvedTarget ? (
                      <div className="r53-mono" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        Target Resolved: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{geoResolvedTarget}</span><br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>
                          ℹ️ <b>Rule trace:</b> {geoExplanation}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                        Click "Resolve DNS" to trigger geographical boundary checks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'geoprox' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Biases geographical coordinates of database clusters. Elevating a datacenter's bias score expands its active server boundary to attract adjacent regions' traffic.
                </div>
                <div className="r53-g2">
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>US East (us-east-1) Bias:</span>
                        <b>{geoproxBiasA >= 0 ? `+${geoproxBiasA}` : geoproxBiasA}</b>
                      </div>
                      <input
                        type="range" min="-99" max="99" value={geoproxBiasA}
                        onChange={(e) => setGeoproxBiasA(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#7c3aed' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>EU West (eu-west-1) Bias:</span>
                        <b>{geoproxBiasB >= 0 ? `+${geoproxBiasB}` : geoproxBiasB}</b>
                      </div>
                      <input
                        type="range" min="-99" max="99" value={geoproxBiasB}
                        onChange={(e) => setGeoproxBiasB(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#7c3aed' }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Simulate Client in Mid-Atlantic</label>
                      <select
                        value={geoproxClientLoc}
                        onChange={(e) => setGeoproxClientLoc(e.target.value as any)}
                        style={{ padding: '6px 10px', fontSize: '11px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="us">US Coastline (near USA)</option>
                        <option value="mid">Mid-Atlantic Ocean (exactly equidistant)</option>
                        <option value="eu">European Coastline (near Europe)</option>
                      </select>
                    </div>

                    <button onClick={runGeoproxSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isGeoproxSimulating ? '⏳ Calculating geoproximity bias polygons...' : '🗺️ Resolve DNS (Geoproximity)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Geoproximity Bias Winner</div>
                    {geoproxResolvedTarget ? (
                      <div className="r53-mono" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        Query Resolved to:<br />
                        <span style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '13px' }}>{geoproxResolvedTarget}</span><br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>
                          ℹ️ <b>Explain:</b> Bias alters the default coordinate midpoint. Increasing US East bias to high values pulls the Mid-Atlantic and even European clients into the N. Virginia routing circle.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                        Click "Resolve DNS" to calculate geoproximity boundaries
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'multivalue' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  Combines health checks with simple multi-record responses. Route 53 verifies the health of up to 8 servers and returns only the healthy IPs in a randomized list to the browser.
                </div>
                <div className="r53-g2">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Simulate Web Server Health checks</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const next = [...multivalueHealthyStates];
                            next[idx] = !next[idx];
                            setMultivalueHealthyStates(next);
                          }}
                          style={{ padding: '6px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: multivalueHealthyStates[idx] ? '#f0fdf4' : '#fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: multivalueHealthyStates[idx] ? '#166534' : '#991b1b' }}
                        >
                          <span>{multivalueHealthyStates[idx] ? '✅' : '❌'}</span>
                          <span>Server #{idx + 1} ({10 + idx})</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={runMultivalueSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isMultivalueSimulating ? '⏳ Filtering unhealthy IPs...' : '📋 Resolve DNS (Multi-Value)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Route 53 Multi-Value Response Payload</div>
                    {multivalueResolvedIPs.length > 0 ? (
                      <div className="r53-mono" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        IPs Returned in response: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{multivalueResolvedIPs.join(', ')}</span><br />
                        Total healthy: <b>{multivalueResolvedIPs.length}</b> / 4<br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>
                          💡 <b>Note:</b> Unhealthy servers are automatically excluded from the record payload to prevent clients connecting to failed endpoints. The returned IPs are shuffled on each query.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                        Click "Resolve DNS" to compile the healthy IPs list
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePolicy === 'ipbased' && (
              <div className="r53-card">
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                  IP-Based routing shifts traffic based on the client resolver IP subnet. Create CIDR collections to send internal corporate subnets to custom private proxies.
                </div>
                <div className="r53-g2">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Select Client Resolver IP Subnet</label>
                    <select
                      value={ipbasedClientIP}
                      onChange={(e) => setIpbasedClientIP(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', marginBottom: '12px' }}
                    >
                      <option value="192.168.1.45">🏢 192.168.1.45 (Corporate Intranet Subnet A)</option>
                      <option value="10.0.4.92">🔒 10.0.4.92 (VPC Private Subnet B)</option>
                      <option value="8.8.8.8">🌍 8.8.8.8 (Public Internet DNS - Default)</option>
                    </select>
                    <button onClick={runIpbasedSim} className="r53-btn r53-on" style={{ width: '100%', padding: '8px' }}>
                      {isIpbasedSimulating ? '⏳ Matching CIDR collections...' : '🔍 Resolve DNS (IP-Based)'}
                    </button>
                  </div>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '12px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>IP-Based DNS Resolution Target</div>
                    {ipbasedResolvedTarget ? (
                      <div className="r53-mono" style={{ fontSize: '11px', lineHeight: '1.5' }}>
                        Outcome: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{ipbasedResolvedTarget}</span><br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>
                          ℹ️ <b>Explain:</b> Inbound queries matching the `192.168.1.0/24` CIDR collection route to Target A. Other subnets default to the public load balancer.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                        Click "Resolve DNS" to execute CIDR collection checks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* HEALTH CHECKS PANEL */}
        {activeSection === 'health' && (
          <div>
            <div className="r53-sec">Route 53 Global Health Checking System</div>
            <div className="r53-g2" style={{ marginBottom: '10px',display:'flex' }}>
              <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Health Check Probe Flow Architecture</div>
                <svg width="100%" viewBox="0 0 680 320" style={{ display: 'block', margin: '0 auto', background: '#090d16', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <defs>
                    {/* Glow Filters */}
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 1. BACKGROUND PATHS & STREAMING DATA */}
                  {/* Client to Route 53 */}
                  <line
                    x1="80" y1="160" x2="150" y2="160"
                    stroke={(primHealthy || secHealthy) ? "#34d399" : "#64748b"}
                    strokeWidth="2.5"
                    strokeDasharray={(primHealthy || secHealthy) ? "5,3" : "none"}
                    strokeOpacity={(primHealthy || secHealthy) ? 1 : 0.4}
                  >
                    {(primHealthy || secHealthy) && (
                      <animate attributeName="stroke-dashoffset" values="40;0" dur="1s" repeatCount="indefinite" />
                    )}
                  </line>

                  {/* Route 53 to Primary Target */}
                  <path
                    d="M 230 160 C 280 160, 360 75, 500 75"
                    fill="none"
                    stroke={primHealthy ? "#10b981" : "#475569"}
                    strokeWidth={primHealthy ? "3" : "1.5"}
                    strokeDasharray={primHealthy ? "6,4" : "4,4"}
                    strokeOpacity={primHealthy ? 1 : 0.25}
                  >
                    {primHealthy && (
                      <animate attributeName="stroke-dashoffset" values="50;0" dur="1.2s" repeatCount="indefinite" />
                    )}
                  </path>

                  {/* Route 53 to Secondary Target */}
                  <path
                    d="M 230 160 C 280 160, 360 235, 500 235"
                    fill="none"
                    stroke={(!primHealthy && secHealthy) ? "#3b82f6" : "#475569"}
                    strokeWidth={(!primHealthy && secHealthy) ? "3" : "1.5"}
                    strokeDasharray={(!primHealthy && secHealthy) ? "6,4" : "4,4"}
                    strokeOpacity={(!primHealthy && secHealthy) ? 1 : 0.25}
                  >
                    {(!primHealthy && secHealthy) && (
                      <animate attributeName="stroke-dashoffset" values="50;0" dur="1.2s" repeatCount="indefinite" />
                    )}
                  </path>

                  {/* Outage Warning Lines (if both dead) */}
                  {(!primHealthy && !secHealthy) && (
                    <>
                      <path d="M 230 160 C 280 160, 360 75, 500 75" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity="0.4" />
                      <path d="M 230 160 C 280 160, 360 235, 500 235" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity="0.4" />
                      <circle cx="365" cy="155" r="8" fill="#ef4444" opacity="0.8">
                        <animate attributeName="r" values="6;11;6" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <text x="365" y="158" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">⚠️</text>
                    </>
                  )}

                  {/* 2. USER CLIENT (💻 Browser) */}
                  <g filter={(primHealthy || secHealthy) ? "url(#glow-green)" : undefined}>
                    <polygon points="10,185 80,185 90,193 0,193" fill="#475569" stroke="#334155" strokeWidth="1" />
                    <rect x="35" y="179" width="20" height="7" fill="#64748b" />
                    <rect x="5" y="145" width="80" height="34" rx="3" fill="#0f172a" stroke={(primHealthy || secHealthy) ? "#34d399" : "#64748b"} strokeWidth="1.5" />
                    <rect x="8" y="148" width="74" height="27" rx="1.5" fill="#1e1b4b" />
                    <text x="45" y="160" textAnchor="middle" fontSize="6.5" fill="#34d399" fontWeight="bold" fontFamily="monospace">www.app.com</text>
                    <text x="45" y="170" textAnchor="middle" fontSize="5.2" fill="#818cf8" fontFamily="monospace">
                      {primHealthy ? "resolved: us-east-1" : secHealthy ? "resolved: eu-west-1" : "Connection Failed!"}
                    </text>
                    <text x="45" y="136" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="600">💻 Browser</text>
                  </g>

                  {/* 3. ROUTE 53 FAILOVER GATEWAY */}
                  <g>
                    <rect x="150" y="120" width="80" height="80" rx="10" fill="#2e0854" stroke="#c084fc" strokeWidth="1.5" filter="url(#glow-purple)" />
                    <rect x="153" y="123" width="74" height="74" rx="8" fill="#120024" />

                    {/* Rotating Gate dial */}
                    <circle cx="190" cy="160" r="18" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6,4">
                      <animateTransform attributeName="transform" type="rotate" from="0 190 160" to="360 190 160" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="190" cy="160" r="10" fill="#a855f7" opacity="0.3" />
                    {/* Inner routing arrows */}
                    <path d="M 185 160 L 195 160 M 190 155 L 190 165" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />

                    <text x="190" y="112" textAnchor="middle" fontSize="9" fill="#c084fc" fontWeight="bold">🚀 Route 53</text>
                    <text x="190" y="213" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="500">Failover Engine</text>
                  </g>

                  {/* 4. HEALTH CHECKERS (Middle Satellite probers) */}
                  {/* Satellites background glow */}
                  <circle cx="330" cy="50" r="12" fill="#f57c00" opacity="0.08" />
                  <circle cx="330" cy="150" r="12" fill="#f57c00" opacity="0.08" />
                  <circle cx="330" cy="250" r="12" fill="#f57c00" opacity="0.08" />

                  {/* Active heartbeat pings from probers to Primary Endpoint */}
                  <line x1="345" y1="50" x2="500" y2="75" className={primHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={primHealthy ? 1.5 : 2} />
                  <line x1="345" y1="150" x2="500" y2="75" className={primHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={primHealthy ? 1.5 : 2} />
                  <line x1="345" y1="250" x2="500" y2="75" className={primHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={primHealthy ? 1.5 : 2} />

                  {/* Active heartbeat pings from probers to Secondary Endpoint */}
                  <line x1="345" y1="50" x2="500" y2="235" className={secHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={secHealthy ? 1.5 : 2} />
                  <line x1="345" y1="150" x2="500" y2="235" className={secHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={secHealthy ? 1.5 : 2} />
                  <line x1="345" y1="250" x2="500" y2="235" className={secHealthy ? "ping-line-ok" : "ping-line-fail"} strokeWidth={secHealthy ? 1.5 : 2} />

                  {/* Satellites rendering */}
                  {/* Checker 1: US-East */}
                  <g>
                    <rect x="310" y="38" width="40" height="24" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                    <circle cx="330" cy="50" r="4" fill="#f59e0b" />
                    <text x="330" y="32" textAnchor="middle" fontSize="7.5" fill="#fef08a" fontWeight="bold">🇺🇸 Prober</text>
                  </g>
                  {/* Checker 2: EU-West */}
                  <g>
                    <rect x="310" y="138" width="40" height="24" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                    <circle cx="330" cy="150" r="4" fill="#f59e0b" />
                    <text x="330" y="132" textAnchor="middle" fontSize="7.5" fill="#fef08a" fontWeight="bold">🇪🇺 Prober</text>
                  </g>
                  {/* Checker 3: AP-South */}
                  <g>
                    <rect x="310" y="238" width="40" height="24" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                    <circle cx="330" cy="250" r="4" fill="#f59e0b" />
                    <text x="330" y="232" textAnchor="middle" fontSize="7.5" fill="#fef08a" fontWeight="bold">🇸🇬 Prober</text>
                  </g>

                  {/* Global Checkers Hub Title */}
                  <rect x="285" y="105" width="10" height="110" rx="3" fill="#1e293b" opacity="0.3" />
                  <text x="285" y="210" transform="rotate(-90, 285, 210)" fontSize="7" fill="#f59e0b" fontWeight="bold" letterSpacing="0.1em">ROUTE 53 GLOBAL PROBERS</text>

                  {/* 5. PRIMARY ENDPOINT us-east-1 */}
                  <g>
                    <rect
                      x="500"
                      y="30"
                      width="155"
                      height="90"
                      rx="8"
                      fill="#0f172a"
                      stroke={primHealthy ? "#10b981" : "#ef4444"}
                      strokeWidth={primHealthy ? 1.5 : 2.5}
                      className={primHealthy ? "server-healthy-glow" : "server-unhealthy-glow"}
                      style={{ transition: 'all 0.4s' }}
                    />

                    {/* Server Rack ears & chassis */}
                    <line x1="504" y1="36" x2="504" y2="114" stroke="#475569" strokeWidth="3" />
                    <line x1="651" y1="36" x2="651" y2="114" stroke="#475569" strokeWidth="3" />

                    {/* Server Chassis details */}
                    <rect x="510" y="40" width="135" height="24" rx="3" fill="#1e293b" />
                    <text x="516" y="55" fontSize="8" fill="#e2e8f0" fontWeight="bold" fontFamily="monospace">us-east-1-alb</text>

                    {/* Indicator Panel */}
                    <rect x="510" y="70" width="135" height="42" rx="3" fill="#020617" />

                    {/* Blinking status LEDs */}
                    <circle cx="522" cy="80" r="3.5" fill={primHealthy ? "#22c55e" : "#ef4444"} className={primHealthy ? undefined : "alarm-indicator"} />
                    <circle cx="534" cy="80" r="3" fill={primHealthy ? "#22c55e" : "#7f1d1d"} opacity={primHealthy ? 0.7 : 0.3} />
                    <circle cx="546" cy="80" r="3" fill={primHealthy ? "#eab308" : "#7f1d1d"} opacity={primHealthy ? 0.8 : 0.3} />

                    {/* Ventilation slot lines */}
                    <line x1="562" y1="77" x2="602" y2="77" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="562" y1="83" x2="592" y2="83" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Dynamic health stats text */}
                    <text x="518" y="100" fontSize="8" fill={primHealthy ? "#34d399" : "#f87171"} fontWeight="bold">
                      {primHealthy ? "🟢 ACTIVE · 100% HEALTHY" : "🚨 OFFLINE (503 ERR)"}
                    </text>

                    <text x="575" y="24" textAnchor="middle" fontSize="9.5" fill={primHealthy ? "#34d399" : "#f87171"} fontWeight="bold">
                      Primary Target (ALB)
                    </text>
                  </g>

                  {/* 6. SECONDARY ENDPOINT eu-west-1 */}
                  <g>
                    <rect
                      x="500"
                      y="190"
                      width="155"
                      height="90"
                      rx="8"
                      fill="#0f172a"
                      stroke={secHealthy ? (primHealthy ? "#3b82f6" : "#10b981") : "#ef4444"}
                      strokeWidth={secHealthy ? 1.5 : 2.5}
                      className={secHealthy ? "server-healthy-glow" : "server-unhealthy-glow"}
                      style={{ transition: 'all 0.4s' }}
                    />

                    {/* Server Rack ears & chassis */}
                    <line x1="504" y1="196" x2="504" y2="274" stroke="#475569" strokeWidth="3" />
                    <line x1="651" y1="196" x2="651" y2="274" stroke="#475569" strokeWidth="3" />

                    {/* Server Chassis details */}
                    <rect x="510" y="200" width="135" height="24" rx="3" fill="#1e293b" />
                    <text x="516" y="215" fontSize="8" fill="#e2e8f0" fontWeight="bold" fontFamily="monospace">eu-west-1-alb</text>

                    {/* Indicator Panel */}
                    <rect x="510" y="230" width="135" height="42" rx="3" fill="#020617" />

                    {/* Blinking status LEDs */}
                    <circle cx="522" cy="240" r="3.5" fill={secHealthy ? (primHealthy ? "#3b82f6" : "#22c55e") : "#ef4444"} className={secHealthy ? undefined : "alarm-indicator"} />
                    <circle cx="534" cy="240" r="3" fill={secHealthy ? "#22c55e" : "#7f1d1d"} opacity={secHealthy ? 0.7 : 0.3} />
                    <circle cx="546" cy="240" r="3" fill={secHealthy ? "#eab308" : "#7f1d1d"} opacity={secHealthy ? 0.8 : 0.3} />

                    {/* Ventilation slot lines */}
                    <line x1="562" y1="237" x2="602" y2="237" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="562" y1="243" x2="592" y2="243" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Dynamic health stats text */}
                    <text x="518" y="260" fontSize="8" fill={secHealthy ? (primHealthy ? "#93c5fd" : "#34d399") : "#f87171"} fontWeight="bold">
                      {secHealthy ? (primHealthy ? "🔵 PASSIVE · STANDBY" : "🟢 PROMOTED · ACTIVE") : "🚨 OFFLINE (CON OUT)"}
                    </text>

                    <text x="575" y="184" textAnchor="middle" fontSize="9.5" fill={secHealthy ? (primHealthy ? "#93c5fd" : "#34d399") : "#f87171"} fontWeight="bold">
                      Secondary Target (ALB)
                    </text>
                  </g>
                </svg>

                {/* Disaster Recovery Playground / Failover Routing Simulator */}
                <div style={{ width: '100%', height: '1.5px', background: 'var(--color-border-secondary)', margin: '16px 0 14px 0' }} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Failover Routing Simulator (Disaster Recovery Playground)
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Primary (us-east-1):</span>
                        <button
                          onClick={() => setPrimHealthy(!primHealthy)}
                          style={{
                            fontSize: '10px',
                            padding: '3px 10px',
                            background: primHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: primHealthy ? '1px solid #10b981' : '1px solid #ef4444',
                            color: primHealthy ? '#34d399' : '#f87171',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: primHealthy ? '0 0 8px rgba(16, 185, 129, 0.2)' : '0 0 8px rgba(239, 68, 68, 0.2)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {primHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Secondary (eu-west-1):</span>
                        <button
                          onClick={() => setSecHealthy(!secHealthy)}
                          style={{
                            fontSize: '10px',
                            padding: '3px 10px',
                            background: secHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: secHealthy ? '1px solid #10b981' : '1px solid #ef4444',
                            color: secHealthy ? '#34d399' : '#f87171',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: secHealthy ? '0 0 8px rgba(16, 185, 129, 0.2)' : '0 0 8px rgba(239, 68, 68, 0.2)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {secHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(9, 13, 22, 0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                      Route 53 Current Routing Outcome:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: failoverOutcome.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {failoverOutcome.text}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
                      {failoverOutcome.desc}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="r53-sec font-bold">Supported Health Check Types</div>
                <div className="r53-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>Type 1: Endpoint Health Checks</div>
                  <div className="r53-kv"><span className="r53-kk">Monitors</span><b>IP address or Domain Name (FQDN)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Protocols</span><b>HTTP · HTTPS · TCP</b></div>
                  <div className="r53-kv"><span className="r53-kk">Probe Interval</span><b>10 seconds (fast) or 30 seconds (standard)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Failure Threshold</span><b>3 consecutive failures = evicted from DNS</b></div>
                  <div className="r53-kv"><span className="r53-kk">Security Rule</span><b>Firewalls must whitelist global probe IP blocks</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #0369a1', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>Type 2: Calculated Health Checks</div>
                  <div className="r53-kv"><span className="r53-kk">Monitors</span><b>Combines up to 256 child health checks</b></div>
                  <div className="r53-kv"><span className="r53-kk">Logical Operators</span><b>AND / OR / Minimum healthy thresholds (X of Y)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Use Case</span><b>Mark site offline only if BOTH web servers are dead</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>Type 3: CloudWatch Alarm Health Checks</div>
                  <div className="r53-kv"><span className="r53-kk">Monitors</span><b>Amazon CloudWatch Metric Alarm status</b></div>
                  <div className="r53-kv"><span className="r53-kk">How it works</span><b>Alarm state (ALARM) triggers DNS health check fail</b></div>
                  <div className="r53-kv"><span className="r53-kk">Best For</span><b>Private endpoints (RDS, internal databases inside VPC)</b></div>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* HYBRID DNS PANEL */}
        {activeSection === 'hybrid' && (
          <div>
            <div className="r53-sec">Route 53 Hybrid DNS (Inbound &amp; Outbound Resolver Endpoints)</div>
            <div className="r53-card" >
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                Amazon Route 53 Resolver establishes a secure hybrid DNS bridge between your AWS VPCs and On-Premises corporate networks. By configuring <strong>Inbound Resolver Endpoints</strong> (allowing on-premises queries to reach AWS) and <strong>Outbound Resolver Endpoints</strong> (allowing AWS VPCs to forward queries to on-premises nameservers), split-horizon DNS works privately and securely.
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                {/* LEFT COLUMN: Controls + Trigger Button + Terminal Logs (3 Parts) */}
                <div style={{ flex: '3 1 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* CONTROLS & TRIGGER */}
                  <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Simulation Direction Mode</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          className={`r53-btn ${hybridMode === 'inbound' ? 'r53-on' : ''}`}
                          onClick={() => {
                            setHybridMode('inbound');
                            setHybridSimulatedDomain('db.internal');
                            setHybridStep(-1);
                            setHybridLogs([]);
                          }}
                          style={{ width: '100%', padding: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          📥 Inbound (On-Prem ➔ AWS)
                        </button>
                        <button
                          className={`r53-btn ${hybridMode === 'outbound' ? 'r53-on' : ''}`}
                          onClick={() => {
                            setHybridMode('outbound');
                            setHybridSimulatedDomain('dc01.onprem.local');
                            setHybridStep(-1);
                            setHybridLogs([]);
                          }}
                          style={{ width: '100%', padding: '8px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          📤 Outbound (AWS ➔ On-Prem)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Domain to Resolve</label>
                      <select
                        value={hybridSimulatedDomain}
                        onChange={(e) => {
                          setHybridSimulatedDomain(e.target.value);
                          setHybridStep(-1);
                          setHybridLogs([]);
                        }}
                        style={{ padding: '8px 10px', fontSize: '12px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                      >
                        {hybridMode === 'inbound' ? (
                          <>
                            <option value="db.internal">db.internal (Target: Private RDS)</option>
                            <option value="web.internal">web.internal (Target: Private ALB)</option>
                          </>
                        ) : (
                          <>
                            <option value="dc01.onprem.local">dc01.onprem.local (Target: AD Controller)</option>
                            <option value="nas.onprem.local">nas.onprem.local (Target: Corp NAS)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* SIMULATION CONTROLLER TRIGGER */}
                    <button
                      onClick={runHybridSim}
                      disabled={hybridIsRunning}
                      className="r53-btn r53-on"
                      style={{ width: '100%', padding: '10px', fontSize: '12.5px', fontWeight: 'bold', marginTop: '6px' }}
                    >
                      {hybridIsRunning ? '⚡ Running Hybrid Query...' : '▶ Start Hybrid Simulation'}
                    </button>
                  </div>

                  {/* LIVE CONSOLE TERMINAL LOGS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                      <span>📡 Tracelog (Split-Horizon Console)</span>
                    </div>
                    <div ref={hybridLogRef} className="r53-log" style={{ minHeight: '140px', maxHeight: '180px', overflowY: 'auto' }}>
                      {hybridLogs.length === 0 ? '; Waiting for simulation run...\n; Select direction and click Start above.' : hybridLogs.join('\n')}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Visual SVG Diagram (7 Parts) */}
                <div style={{ flex: '7 1 400px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <svg width="100%" viewBox="0 0 680 290" style={{ display: 'block', margin: '0 auto' }}>
                      <defs>
                        <filter id="glow-hybrid" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Boundaries */}
                      {/* Left Box: On-Premises */}
                      <rect x="10" y="10" width="220" height="270" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <text x="120" y="26" textAnchor="middle" fontSize="10.5" fill="#94a3b8" fontWeight="bold" letterSpacing="0.05em">🏢 ON-PREMISES DATA CENTER</text>

                      {/* Middle Box: Security Tunnel Boundary */}
                      <rect x="250" y="120" width="180" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
                      <text x="340" y="112" textAnchor="middle" fontSize="9.5" fill="#f59e0b" fontWeight="bold">🔐 Site-to-Site VPN / Direct Connect</text>
                      <text x="340" y="162" textAnchor="middle" fontSize="8" fill="#94a3b8">IPSec Tunnel Path</text>

                      {/* Right Box: Amazon VPC */}
                      <rect x="450" y="10" width="220" height="270" rx="12" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
                      <text x="560" y="26" textAnchor="middle" fontSize="10.5" fill="#f59e0b" fontWeight="bold" letterSpacing="0.05em">☁️ AMAZON VPC (10.0.0.0/16)</text>

                      {/* ON-PREMISES INFRASTRUCTURE */}
                      {/* On-Prem Client Laptop */}
                      <g filter={(hybridMode === 'inbound' && hybridStep === 0) || (hybridMode === 'outbound' && hybridStep === 6) ? "url(#glow-hybrid)" : undefined}>
                        <rect x="20" y="180" width="40" height="25" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <rect x="24" y="183" width="32" height="15" fill="#0f172a" />
                        <line x1="15" y1="205" x2="65" y2="205" stroke="#475569" strokeWidth="2" />
                        <text x="40" y="220" textAnchor="middle" fontSize="8" fill="#e2e8f0" fontWeight="bold">Laptop Client</text>
                      </g>

                      {/* On-Prem DNS Active Directory Server */}
                      <g filter={(hybridStep === 1 && hybridMode === 'inbound') || (hybridStep === 4 && hybridMode === 'outbound') ? "url(#glow-hybrid)" : undefined}>
                        <rect x="110" y="80" width="100" height="110" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                        <rect x="114" y="84" width="92" height="102" rx="4" fill="#020617" />
                        {/* Blinking dots */}
                        <circle cx="125" cy="98" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                        <circle cx="135" cy="98" r="2.5" fill="#eab308"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.5s" repeatCount="indefinite" /></circle>
                        <line x1="145" y1="98" x2="195" y2="98" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

                        <circle cx="125" cy="118" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.2s" repeatCount="indefinite" /></circle>
                        <circle cx="135" cy="118" r="2.5" fill="#ef4444"><animate attributeName="opacity" values="1;0.1;1" dur="0.7s" repeatCount="indefinite" /></circle>
                        <line x1="145" y1="118" x2="195" y2="118" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

                        <circle cx="125" cy="138" r="2.5" fill="#22c55e"><animate attributeName="opacity" values="0.3;1;0.3" dur="0.9s" repeatCount="indefinite" /></circle>
                        <line x1="145" y1="138" x2="195" y2="138" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

                        <text x="160" y="166" textAnchor="middle" fontSize="8.5" fill="#a855f7" fontWeight="bold">On-Prem DNS</text>
                        <text x="160" y="178" textAnchor="middle" fontSize="7.5" fill="#94a3b8">192.168.1.10</text>
                      </g>

                      {/* AWS INFRASTRUCTURE */}
                      {/* Route 53 Resolver Node */}
                      <g filter={(hybridStep === 4 && hybridMode === 'inbound') || (hybridStep === 1 && hybridMode === 'outbound') ? "url(#glow-hybrid)" : undefined}>
                        <circle cx="560" cy="80" r="24" fill="#581c87" stroke="#7e22ce" strokeWidth="1.5" />
                        <circle cx="560" cy="80" r="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2">
                          <animateTransform attributeName="transform" type="rotate" from="0 560 80" to="360 560 80" dur="5s" repeatCount="indefinite" />
                        </circle>
                        <path d="M 554 80 A 6 6 0 0 1 566 80" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 566 80 A 6 6 0 0 1 554 80" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                        <text x="560" y="116" textAnchor="middle" fontSize="8" fill="#d8b4fe" fontWeight="bold">Route 53 Resolver</text>
                        <text x="560" y="125" textAnchor="middle" fontSize="7" fill="#a855f7">(10.0.0.2)</text>
                      </g>

                      {/* Inbound resolver endpoint ENI */}
                      <g filter={hybridStep === 3 && hybridMode === 'inbound' ? "url(#glow-hybrid)" : undefined}>
                        <rect x="470" y="140" width="70" height="34" rx="4" fill="#0f172a" stroke={hybridStep === 3 && hybridMode === 'inbound' ? "#22c55e" : "#334155"} strokeWidth="1.5" />
                        <text x="505" y="152" textAnchor="middle" fontSize="7.5" fill="#4ade80" fontWeight="bold">📥 Inbound ENI</text>
                        <text x="505" y="164" textAnchor="middle" fontSize="7" fill="#94a3b8">10.0.1.53</text>
                      </g>

                      {/* Outbound resolver endpoint ENI */}
                      <g filter={hybridStep === 2 && hybridMode === 'outbound' ? "url(#glow-hybrid)" : undefined}>
                        <rect x="580" y="140" width="70" height="34" rx="4" fill="#0f172a" stroke={hybridStep === 2 && hybridMode === 'outbound' ? "#3b82f6" : "#334155"} strokeWidth="1.5" />
                        <text x="615" y="152" textAnchor="middle" fontSize="7.5" fill="#60a5fa" fontWeight="bold">📤 Outbound ENI</text>
                        <text x="615" y="164" textAnchor="middle" fontSize="7" fill="#94a3b8">10.0.1.250</text>
                      </g>

                      {/* Target resource / RDS Private DB */}
                      <g filter={(hybridMode === 'inbound' && hybridStep === 6) ? "url(#glow-hybrid)" : undefined}>
                        <rect x="470" y="200" width="70" height="42" rx="4" fill="#1e1b4b" stroke="#4338ca" strokeWidth="1.5" />
                        <ellipse cx="505" cy="210" rx="15" ry="4" fill="#312e81" stroke="#4338ca" />
                        <text x="505" y="234" textAnchor="middle" fontSize="7.5" fill="#e2e8f0" fontWeight="bold">db.internal</text>
                        <text x="505" y="242" textAnchor="middle" fontSize="6.5" fill="#a5b4fc">RDS (10.0.2.99)</text>
                      </g>

                      {/* Target EC2 Instance (outbound initiator) */}
                      <g filter={(hybridMode === 'outbound' && hybridStep === 0) ? "url(#glow-hybrid)" : undefined}>
                        <rect x="580" y="200" width="70" height="42" rx="4" fill="#1b2e35" stroke="#0e7490" strokeWidth="1.5" />
                        <text x="615" y="215" textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold">💻 EC2 Node</text>
                        <text x="615" y="234" textAnchor="middle" fontSize="7" fill="#22d3ee">VPC Client</text>
                        <text x="615" y="242" textAnchor="middle" fontSize="6.5" fill="#67e8f9">10.0.3.14</text>
                      </g>

                      {/* CONNECTING LINES AND LABELS */}
                      {/* On-Prem Client to On-Prem Server */}
                      <path d="M 40 180 L 40 120 L 110 120" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
                      {/* On-Prem Server to VPN Tunnel */}
                      <path d="M 210 135 L 250 135" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
                      {/* VPN Tunnel to Subnet ENIs */}
                      <path d="M 430 145 L 470 145" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
                      {/* Subnet ENI to Resolver */}
                      <path d="M 505 140 L 505 80 L 536 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 615 140 L 615 80 L 584 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" />

                      {/* FLOW ANIMATED PACKETS */}
                      {/* Inbound query flow animation */}
                      {hybridIsRunning && hybridMode === 'inbound' && (
                        <>
                          {hybridStep === 0 && (
                            <circle cx="40" cy="180" r="4.5" fill="#eab308" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="180;120" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 1 && (
                            <circle cx="75" cy="120" r="4.5" fill="#c084fc" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="40;110" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 2 && (
                            <circle cx="230" cy="135" r="4.5" fill="#f97316" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="210;450" dur="1s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 3 && (
                            <circle cx="490" cy="145" r="4.5" fill="#22c55e" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="470;505" dur="0.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 4 && (
                            <circle cx="505" cy="110" r="4.5" fill="#a855f7" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="140;80" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 5 && (
                            <circle cx="330" cy="135" r="4.5" fill="#f59e0b" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="450;210" dur="1s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 6 && (
                            <circle cx="330" cy="220" r="5" fill="#10b981" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="40;505" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </>
                      )}

                      {/* Outbound query flow animation */}
                      {hybridIsRunning && hybridMode === 'outbound' && (
                        <>
                          {hybridStep === 0 && (
                            <circle cx="615" cy="200" r="4.5" fill="#06b6d4" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="200;140" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 1 && (
                            <circle cx="590" cy="80" r="4.5" fill="#a855f7" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="615;560" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 2 && (
                            <circle cx="585" cy="110" r="4.5" fill="#3b82f6" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="80;140" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 3 && (
                            <circle cx="330" cy="135" r="4.5" fill="#f97316" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="580;210" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 4 && (
                            <circle cx="160" cy="110" r="4.5" fill="#ef4444" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="80;190" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 5 && (
                            <circle cx="330" cy="135" r="4.5" fill="#10b981" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="210;580" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 6 && (
                            <circle cx="380" cy="170" r="5" fill="#10b981" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="580;40" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </>
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARCHITECTURE PANEL */}
        {activeSection === 'arch' && (() => {
          const isNodeActive = (node: string) => {
            if (archScenario === 'public_web') {
              return ['client_public', 'r53_global', 'waf', 'cloudfront', 'alb', 'compute', 'rds', 's3'].includes(node);
            }
            if (archScenario === 'private_vpc') {
              return ['compute', 'r53_private', 'rds', 'elasticache'].includes(node);
            }
            if (archScenario === 'hybrid_corp') {
              return ['client_onprem', 'vpn', 'r53_private', 'compute', 'rds'].includes(node);
            }
            return false;
          };

          const activeColor = 
            archScenario === 'public_web' ? '#10b981' :
            archScenario === 'private_vpc' ? '#3b82f6' : '#a855f7';

          return (
            <div>
              <div className="r53-sec">Interactive AWS Global Infrastructure &amp; Routing Explorer</div>

              {/* Scenario Toggles */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setArchScenario('public_web')}
                  style={{
                    flex: '1 1 auto',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: archScenario === 'public_web' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.15)',
                    border: archScenario === 'public_web' ? '1px solid #10b981' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'public_web' ? '#34d399' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'public_web' ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  🌐 Scenario 1: Public Web App (Edge CDN &amp; ALB)
                </button>
                <button
                  onClick={() => setArchScenario('private_vpc')}
                  style={{
                    flex: '1 1 auto',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: archScenario === 'private_vpc' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.15)',
                    border: archScenario === 'private_vpc' ? '1px solid #3b82f6' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'private_vpc' ? '#60a5fa' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'private_vpc' ? '0 0 10px rgba(59, 130, 246, 0.15)' : 'none'
                  }}
                >
                  🔒 Scenario 2: Private VPC Service Discovery (PHZ)
                </button>
                <button
                  onClick={() => setArchScenario('hybrid_corp')}
                  style={{
                    flex: '1 1 auto',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: archScenario === 'hybrid_corp' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(15, 23, 42, 0.15)',
                    border: archScenario === 'hybrid_corp' ? '1px solid #a855f7' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'hybrid_corp' ? '#c084fc' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'hybrid_corp' ? '0 0 10px rgba(168, 85, 247, 0.15)' : 'none'
                  }}
                >
                  🔌 Scenario 3: Hybrid Corporate Network Resolver
                </button>
              </div>

              {/* Main Grid */}
              <div className="r53-g2" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* COLUMN 1: SVG DIAGRAM (60% width) */}
                <div className="r53-card" style={{ flex: '7 1 380px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#090d16', padding: '16px' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      AWS Global Cloud Infrastructure Topology
                    </div>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 'bold',
                      color: activeColor,
                      background: `${activeColor}15`,
                      border: `1px solid ${activeColor}`,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {archScenario === 'public_web' ? 'Public Inbound Flow' : archScenario === 'private_vpc' ? 'Private Hosted Zone' : 'Hybrid Resolution'}
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 660 360" style={{ display: 'block', margin: '0 auto', background: '#070a13', borderRadius: '12px', border: '1px solid var(--color-border-secondary)' }}>
                    <defs>
                      {/* Glowing line filters */}
                      <filter id="glow-green-line" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-blue-line" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-purple-line" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      {/* Marker arrows */}
                      <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
                      </marker>
                      <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
                      </marker>
                      <marker id="arrow-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#a855f7" />
                      </marker>
                      <marker id="arrow-dim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#334155" />
                      </marker>
                    </defs>

                    {/* VPC Bubble boundary */}
                    <rect 
                      x="160" y="125" 
                      width="485" height="225" 
                      rx="16" 
                      fill="#0b0e1a" 
                      stroke={archScenario === 'private_vpc' ? '#3b82f6' : archScenario === 'hybrid_corp' ? '#a855f7' : '#1e293b'} 
                      strokeWidth="1.5" 
                      strokeDasharray="6,4" 
                      opacity={archScenario === 'public_web' ? 0.35 : 1}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    <text 
                      x="175" y="142" 
                      fontSize="9px" 
                      fontWeight="bold" 
                      fill={archScenario === 'private_vpc' ? '#60a5fa' : archScenario === 'hybrid_corp' ? '#c084fc' : '#475569'} 
                      opacity={archScenario === 'public_web' ? 0.5 : 1}
                      style={{ transition: 'all 0.5s ease', fontFamily: 'monospace' }}
                    >
                      ☁️ Amazon VPC (us-east-1)
                    </text>

                    {/* PATHS / CONNECTIONS */}
                    
                    {/* Line 1: Public Client to Route 53 (DNS Query) */}
                    <path 
                      d="M 140 77 L 185 77" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 2: Public Client to WAF */}
                    <path 
                      d="M 80 99 C 80 135, 290 135, 350 77" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.4s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 3: WAF to CloudFront */}
                    <path 
                      d="M 470 77 L 515 77" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 4: CloudFront to ALB */}
                    <path 
                      d="M 575 99 L 575 145" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 5: ALB to EC2/ECS Compute */}
                    <path 
                      d="M 515 167 C 450 167, 340 180, 305 200" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.4s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 6: Compute to RDS PostgreSQL Database */}
                    <path 
                      d="M 305 212 L 350 212" 
                      fill="none" 
                      stroke={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : '#334155'} 
                      strokeWidth={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '2.5' : '1.5'} 
                      strokeDasharray={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '5,3' : 'none'}
                      markerEnd={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? `url(#arrow-${archScenario === 'public_web' ? 'green' : archScenario === 'private_vpc' ? 'blue' : 'purple'})` : 'url(#arrow-dim)'}
                      opacity={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.3s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 7: Compute to Route 53 Private Hosted Zone (Private Resolver DNS query) */}
                    <path 
                      d="M 270 234 C 290 270, 310 295, 350 295" 
                      fill="none" 
                      stroke={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : '#334155'} 
                      strokeWidth={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '2.5' : '1.5'} 
                      strokeDasharray={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '5,3' : 'none'}
                      markerEnd={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? `url(#arrow-${archScenario === 'private_vpc' ? 'blue' : 'purple'})` : 'url(#arrow-dim)'}
                      opacity={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.3s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 8: Route 53 Private Hosted Zone back to Compute (DNS response) */}
                    <path 
                      d="M 350 312 C 310 312, 290 290, 245 234" 
                      fill="none" 
                      stroke={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : '#334155'} 
                      strokeWidth={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '2' : '1.5'} 
                      strokeDasharray={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? '4,4' : 'none'}
                      markerEnd={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? `url(#arrow-${archScenario === 'private_vpc' ? 'blue' : 'purple'})` : 'url(#arrow-dim)'}
                      opacity={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? 0.8 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') && (
                        <animate attributeName="stroke-dashoffset" values="0;32" dur="1.3s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 9: Compute to ElastiCache Redis */}
                    <path 
                      d="M 305 212 C 360 250, 460 250, 510 212" 
                      fill="none" 
                      stroke={archScenario === 'private_vpc' ? '#3b82f6' : '#334155'} 
                      strokeWidth={archScenario === 'private_vpc' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'private_vpc' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'private_vpc' ? 'url(#arrow-blue)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'private_vpc' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'private_vpc' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.3s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 10: On-Prem Client to VPN Gateway */}
                    <path 
                      d="M 140 322 L 185 322" 
                      fill="none" 
                      stroke={archScenario === 'hybrid_corp' ? '#a855f7' : '#334155'} 
                      strokeWidth={archScenario === 'hybrid_corp' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'hybrid_corp' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'hybrid_corp' ? 'url(#arrow-purple)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'hybrid_corp' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'hybrid_corp' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 11: VPN Gateway to Inbound Endpoint / Private Hosted Zone */}
                    <path 
                      d="M 305 312 L 350 312" 
                      fill="none" 
                      stroke={archScenario === 'hybrid_corp' ? '#a855f7' : '#334155'} 
                      strokeWidth={archScenario === 'hybrid_corp' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'hybrid_corp' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'hybrid_corp' ? 'url(#arrow-purple)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'hybrid_corp' ? 1 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'hybrid_corp' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.2s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* Line 12: Public Client to S3 Bucket (Static Website Host SPA) */}
                    <path 
                      d="M 80 99 L 80 180" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? '#10b981' : '#334155'} 
                      strokeWidth={archScenario === 'public_web' ? '2.5' : '1.5'} 
                      strokeDasharray={archScenario === 'public_web' ? '5,3' : 'none'}
                      markerEnd={archScenario === 'public_web' ? 'url(#arrow-green)' : 'url(#arrow-dim)'}
                      opacity={archScenario === 'public_web' ? 0.7 : 0.15}
                      style={{ transition: 'all 0.4s' }}
                    >
                      {archScenario === 'public_web' && (
                        <animate attributeName="stroke-dashoffset" values="32;0" dur="1.3s" repeatCount="indefinite" />
                      )}
                    </path>

                    {/* NODES RENDERING */}
                    
                    {/* NODE 1: Public Client */}
                    <g 
                      opacity={isNodeActive('client_public') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('client_public') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="20" y="55" width="120" height="44" rx="8" fill="#0b0f19" stroke={isNodeActive('client_public') ? '#10b981' : '#334155'} strokeWidth="1.5" />
                      <text x="32" y="82" fontSize="16">💻</text>
                      <text x="56" y="79" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Global User</text>
                      <text x="56" y="90" fontSize="7.5" fill="#94a3b8" fontFamily="system-ui">Public Internet</text>
                    </g>

                    {/* NODE 2: Route 53 Global Cluster */}
                    <g 
                      opacity={isNodeActive('r53_global') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('r53_global') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="185" y="55" width="120" height="44" rx="8" fill="#18052b" stroke={isNodeActive('r53_global') ? '#a855f7' : '#334155'} strokeWidth="1.5" />
                      <text x="197" y="82" fontSize="16">🚀</text>
                      <text x="221" y="79" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Route 53 DNS</text>
                      <text x="221" y="90" fontSize="7.5" fill="#c084fc" fontFamily="system-ui">Authoritative Edge</text>
                    </g>

                    {/* NODE 3: AWS WAF */}
                    <g 
                      opacity={isNodeActive('waf') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('waf') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="350" y="55" width="120" height="44" rx="8" fill="#021c1a" stroke={isNodeActive('waf') ? '#0d9488' : '#334155'} strokeWidth="1.5" />
                      <text x="362" y="82" fontSize="16">🛡️</text>
                      <text x="386" y="79" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">AWS WAF Gate</text>
                      <text x="386" y="90" fontSize="7.5" fill="#2dd4bf" fontFamily="system-ui">Exploit Shield</text>
                    </g>

                    {/* NODE 4: CloudFront CDN */}
                    <g 
                      opacity={isNodeActive('cloudfront') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('cloudfront') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="515" y="55" width="120" height="44" rx="8" fill="#191613" stroke={isNodeActive('cloudfront') ? '#f59e0b' : '#334155'} strokeWidth="1.5" />
                      <text x="527" y="82" fontSize="16">☁️</text>
                      <text x="551" y="79" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">CloudFront</text>
                      <text x="551" y="90" fontSize="7.5" fill="#fbbf24" fontFamily="system-ui">Edge Cache CDN</text>
                    </g>

                    {/* NODE 5: Amazon S3 (Static SPA) */}
                    <g 
                      opacity={isNodeActive('s3') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('s3') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="20" y="180" width="120" height="44" rx="8" fill="#291305" stroke={isNodeActive('s3') ? '#ea580c' : '#334155'} strokeWidth="1.5" />
                      <text x="32" y="207" fontSize="16">🪣</text>
                      <text x="56" y="204" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Amazon S3</text>
                      <text x="56" y="215" fontSize="7.5" fill="#f97316" fontFamily="system-ui">Static Site SPA</text>
                    </g>

                    {/* NODE 6: Application Load Balancer */}
                    <g 
                      opacity={isNodeActive('alb') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('alb') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="515" y="145" width="120" height="44" rx="8" fill="#08153b" stroke={isNodeActive('alb') ? '#2563eb' : '#334155'} strokeWidth="1.5" />
                      <text x="527" y="172" fontSize="16">⚖️</text>
                      <text x="551" y="169" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Public ALB</text>
                      <text x="551" y="180" fontSize="7.5" fill="#60a5fa" fontFamily="system-ui">Traffic Balancer</text>
                    </g>

                    {/* NODE 7: Compute ECS Containers */}
                    <g 
                      opacity={isNodeActive('compute') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('compute') ? `url(#glow-${archScenario === 'public_web' ? 'green' : archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="185" y="190" width="120" height="44" rx="8" fill="#081f18" stroke={isNodeActive('compute') ? activeColor : '#334155'} strokeWidth="1.5" />
                      <text x="197" y="217" fontSize="16">🖥️</text>
                      <text x="221" y="214" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Compute (ECS)</text>
                      <text x="221" y="225" fontSize="7.5" fill="#34d399" fontFamily="system-ui">App microservice</text>
                    </g>

                    {/* NODE 8: RDS database */}
                    <g 
                      opacity={isNodeActive('rds') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('rds') ? `url(#glow-${archScenario === 'public_web' ? 'green' : archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="350" y="190" width="120" height="44" rx="8" fill="#1b1201" stroke={isNodeActive('rds') ? activeColor : '#334155'} strokeWidth="1.5" />
                      <text x="362" y="217" fontSize="16">🗄️</text>
                      <text x="386" y="214" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">RDS Postgres</text>
                      <text x="386" y="225" fontSize="7.5" fill="#fbbf24" fontFamily="system-ui">Isolated Database</text>
                    </g>

                    {/* NODE 9: ElastiCache Redis */}
                    <g 
                      opacity={isNodeActive('elasticache') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('elasticache') ? 'url(#glow-blue-line)' : undefined}
                    >
                      <rect x="515" y="190" width="120" height="44" rx="8" fill="#2d0505" stroke={isNodeActive('elasticache') ? '#ef4444' : '#334155'} strokeWidth="1.5" />
                      <text x="527" y="217" fontSize="16">⚡</text>
                      <text x="551" y="214" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">ElastiCache</text>
                      <text x="551" y="225" fontSize="7.5" fill="#f87171" fontFamily="system-ui">In-Memory Redis</text>
                    </g>

                    {/* NODE 10: VPN Gateway */}
                    <g 
                      opacity={isNodeActive('vpn') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('vpn') ? 'url(#glow-purple-line)' : undefined}
                    >
                      <rect x="185" y="290" width="120" height="44" rx="8" fill="#1e1b4b" stroke={isNodeActive('vpn') ? '#a855f7' : '#334155'} strokeWidth="1.5" />
                      <text x="197" y="317" fontSize="16">🔌</text>
                      <text x="221" y="314" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">VPN Gateway</text>
                      <text x="221" y="325" fontSize="7.5" fill="#c084fc" fontFamily="system-ui">Direct Connection</text>
                    </g>

                    {/* NODE 11: Route 53 Private Hosted Zone (PHZ) */}
                    <g 
                      opacity={isNodeActive('r53_private') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('r53_private') ? `url(#glow-${archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="350" y="290" width="120" height="44" rx="8" fill="#110321" stroke={isNodeActive('r53_private') ? activeColor : '#334155'} strokeWidth="1.5" />
                      <text x="362" y="317" fontSize="16">🚀</text>
                      <text x="386" y="314" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">R53 Private Zone</text>
                      <text x="386" y="325" fontSize="7.5" fill="#a855f7" fontFamily="system-ui">VPC Resolver</text>
                    </g>

                    {/* NODE 12: Corporate On-Prem HQ */}
                    <g 
                      opacity={isNodeActive('client_onprem') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('client_onprem') ? 'url(#glow-purple-line)' : undefined}
                    >
                      <rect x="20" y="300" width="120" height="44" rx="8" fill="#1c1c24" stroke={isNodeActive('client_onprem') ? '#a855f7' : '#334155'} strokeWidth="1.5" />
                      <text x="32" y="327" fontSize="16">🏢</text>
                      <text x="56" y="324" fontSize="9.5" fill="#f8fafc" fontWeight="bold" fontFamily="system-ui">Corporate HQ</text>
                      <text x="56" y="335" fontSize="7.5" fill="#a855f7" fontFamily="system-ui">On-Prem Network</text>
                    </g>

                  </svg>
                  
                  <div style={{ marginTop: '12px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} /> Public Path
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }} /> Private Hosted Zone Path
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#a855f7', borderRadius: '50%' }} /> Hybrid On-Prem VPN Path
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: EXPLANATION CONSOLE & MEMORY HOOKS (40% width) */}
                <div style={{ flex: '3 1 280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Card 1: Scenario Flow Steps */}
                  <div className="r53-card" style={{ borderLeft: `3px solid ${activeColor}`, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '190px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: activeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Routing Trace: Step-by-Step Flow
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '185px', overflowY: 'auto' }}>
                      {archScenario === 'public_web' && (
                        <>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>1. DNS Request:</strong> User queries <code>app.com</code>. Route 53 acts as the Authoritative DNS, returning CloudFront IPs with geo-routing optimization.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>2. WAF Inspection:</strong> Request hits the nearest AWS edge point. AWS WAF blocks malicious payloads (SQLi, XSS) instantly.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>3. Edge Cache check:</strong> CloudFront inspects edge memory. If matched, returns static index.html in 2ms. If not, requests ALB.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>4. Regional load balancing:</strong> Inbound request hits the Public ALB, decrypting SSL and routing into private subnet containers.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>5. Data Fetch:</strong> ECS Containers parse logic and request rows from RDS PostgreSQL database in isolated private subnet.
                          </div>
                        </>
                      )}

                      {archScenario === 'private_vpc' && (
                        <>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>1. Microservice Query:</strong> ECS app container needs to connect to the database. It queries the local VPC DNS for <code>db.internal</code>.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>2. Route 53 VPC Resolver:</strong> Standard AWS VPC DNS server (IP `169.254.169.253`) intercepts query and matches it to a Private Hosted Zone.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>3. Safe Host Resolution:</strong> Resolves host <code>db.internal</code> directly to private RDS IP <code>10.0.3.45</code>.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>4. Zero Internet Leaks:</strong> Resolution occurs completely inside the VPC router. No information ever touches the public Internet.
                          </div>
                        </>
                      )}

                      {archScenario === 'hybrid_corp' && (
                        <>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>1. On-Premises Request:</strong> A developer at Corporate HQ queries <code>api.internal</code> to test an API endpoint.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>2. Direct Connect / VPN tunnel:</strong> Query travels securely through the IPsec VPN Tunnel into the AWS VPC network gateway.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>3. Inbound Resolver Endpoint:</strong> Hits the Route 53 Inbound Endpoint IP. The endpoint forwards it to the VPC DNS resolver.
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                            <strong>4. Internal Access Granted:</strong> Resolves to the private API endpoint, returning the target page without exposing the API publicly.
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Memory Hooks (Mnemonic helpers) */}
                  <div className="r53-card" style={{ borderLeft: '3px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🧠 Brain-Friendly Memory Hooks
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '6px 8px', borderRadius: '6px', border: '0.5px solid rgba(245, 158, 11, 0.25)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>The Mnemonic Analogy:</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                          {archScenario === 'public_web' && (
                            <span>🌐 <strong>Route 53 = The Contacts App</strong>. It maps the friendly name (www.app.com) to the complex phone number (IP: 54.12.8.9) so users don't have to remember numbers.</span>
                          )}
                          {archScenario === 'private_vpc' && (
                            <span>🔒 <strong>Private Zones = The Office Intercom</strong>. You dial extension 305 to talk to DB, but people outside the office building cannot dial extension 305 directly.</span>
                          )}
                          {archScenario === 'hybrid_corp' && (
                            <span>🔌 <strong>Endpoints = The Multi-lingual Translator</strong>. Bridges Corporate HQ On-premises dialect with AWS VPC private language so they can converse securely.</span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>💡 AWS Exam Secret:</span> <em>Private Hosted Zones (PHZs)</em> require that the VPC settings <code>enableDnsHostnames</code> and <code>enableDnsSupport</code> are BOTH set to <code>true</code>!
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
