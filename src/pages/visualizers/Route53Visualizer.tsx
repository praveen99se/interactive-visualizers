import { useEffect, useRef, useState } from 'react';

type TabType = 'dns' | 'r53' | 'records' | 'routing' | 'health' | 'arch';
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
    const domain = dnsInput.trim() || 'www.example.com';
    const steps = [
      `🔍 Resolving Fully Qualified Domain Name (FQDN): ${domain}`,
      `📦 Step 1: Querying local DNS caches (Browser cache, Operating System cache)...`,
      `❌ Cache MISS. Forwarding DNS request to recursive DNS resolver (ISP / 8.8.8.8)...`,
      `🌍 Step 2: Recursive resolver queries Root Nameserver (a.root-servers.net)...`,
      `➡️ Root Nameserver responds: "I do not know the IP for ${domain}, but here are the TLD Nameservers for the .${domain.split('.').pop()} TLD."`,
      `🏷️ Step 3: Recursive resolver queries TLD Nameserver (com.gtld-servers.net)...`,
      `➡️ TLD Nameserver responds: "I do not know the IP address, but here are the authoritative Nameservers for ${domain.split('.').slice(-2).join('.')}."`,
      `   └─ NS: ns-123.awsdns.com (Route 53 authoritative nameserver cluster)`,
      `📍 Step 4: Recursive resolver queries Authoritative Route 53 Nameserver...`,
      `➡️ Route 53 processes rules & returns the authoritative DNS record:`,
      `   └─ Record Type: A | TTL: 300s | Value: 1.2.3.4 (IPv4 endpoint)`,
      `💾 Step 5: Recursive resolver caches response for 300s (TTL) and forwards it to the Browser.`,
      `✅ Success! Resolution complete. Browser connecting to 1.2.3.4 over TCP port 443.`
    ];

    for (let i = 0; i < steps.length; i++) {
      setDnsSteps((prev) => [...prev, steps[i]]);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    setIsResolving(false);
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

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
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
              <svg width="100%" viewBox="0 0 680 260" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <marker id="d1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                  <marker id="d2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                  <marker id="d3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#0369a1"/></marker>
                  <marker id="d4" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#c2410c"/></marker>
                </defs>
                <rect x="10" y="100" width="110" height="60" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                <text x="65" y="124" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">💻 Browser</text>
                <text x="65" y="142" textAnchor="middle" fontSize="11" fill="#7c3aed">www.example.com</text>

                <rect x="160" y="100" width="120" height="60" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                <text x="220" y="120" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="500">🔄 Recursive</text>
                <text x="220" y="136" textAnchor="middle" fontSize="11" fill="#c2410c">Resolver</text>
                <text x="220" y="152" textAnchor="middle" fontSize="10" fill="#c2410c">(ISP / 8.8.8.8)</text>

                <rect x="330" y="10" width="120" height="56" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="390" y="30" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🌍 Root NS</text>
                <text x="390" y="48" text-anchor="middle" fontSize="11" fill="#dc2626">13 root servers</text>
                <text x="390" y="62" text-anchor="middle" fontSize="10" fill="#dc2626">a.root-servers.net</text>

                <rect x="330" y="100" width="120" height="60" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                <text x="390" y="120" text-anchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">🏷️ TLD NS</text>
                <text x="390" y="136" text-anchor="middle" fontSize="11" fill="#1d4ed8">.com / .org / .io</text>
                <text x="390" y="152" text-anchor="middle" fontSize="10" fill="#1d4ed8">Verisign servers</text>

                <rect x="330" y="190" width="120" height="60" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="390" y="210" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">📍 Auth NS</text>
                <text x="390" y="226" text-anchor="middle" fontSize="11" fill="#15803d">Route 53 / NS</text>
                <text x="390" y="242" text-anchor="middle" fontSize="10" fill="#15803d">ns-123.awsdns.com</text>

                <rect x="550" y="100" width="120" height="60" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                <text x="610" y="124" text-anchor="middle" fontSize="12" fill="#854d0e" fontWeight="500">🖥️ Server</text>
                <text x="610" y="142" text-anchor="middle" fontSize="11" fill="#854d0e">1.2.3.4 (IP)</text>

                <line x1="120" y1="130" x2="158" y2="130" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#d1)"/>
                <text x="139" y="124" textAnchor="middle" fontSize="10" fill="#7c3aed">①</text>

                <path d="M280 115 L305 115 L305 38 L328 38" fill="none" stroke="#c2410c" strokeWidth="1" markerEnd="url(#d4)"/>
                <text x="295" y="72" textAnchor="middle" fontSize="10" fill="#c2410c">②</text>

                <path d="M390 66 L390 98" fill="none" stroke="#dc2626" strokeWidth="1" markerEnd="url(#d4)"/>
                <text x="400" y="86" textAnchor="start" fontSize="10" fill="#dc2626">③ .com NS?</text>

                <path d="M390 160 L390 188" fill="none" stroke="#1d4ed8" strokeWidth="1" markerEnd="url(#d3)"/>
                <text x="400" y="178" textAnchor="start" fontSize="10" fill="#1d4ed8">④ Auth NS?</text>

                <path d="M450 220 L520 220 L520 145 L548 145" fill="none" stroke="#15803d" strokeWidth="1" markerEnd="url(#d2)"/>
                <text x="490" y="214" textAnchor="middle" fontSize="10" fill="#15803d">⑤ IP!</text>

                <line x1="548" y1="130" x2="452" y2="130" stroke="#854d0e" strokeWidth="1.5" markerEnd="url(#d4)"/>
                <text x="500" y="124" textAnchor="middle" fontSize="10" fill="#854d0e">⑥ return</text>

                <line x1="280" y1="145" x2="158" y2="145" stroke="#854d0e" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#d4)"/>
                <text x="219" y="160" textAnchor="middle" fontSize="10" fill="#854d0e">⑦ cache + return</text>

                <rect x="10" y="10" width="130" height="72" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                <text x="75" y="28" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">📦 DNS Cache</text>
                <text x="75" y="44" textAnchor="middle" fontSize="10" fill="#166534">Browser cache</text>
                <text x="75" y="58" textAnchor="middle" fontSize="10" fill="#166534">OS cache</text>
                <text x="75" y="72" textAnchor="middle" fontSize="10" fill="#166534">Resolver cache</text>
              </svg>
            </div>

            <div className="r53-g2">
              <div>
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
                <div className="r53-sec">DNS Hierarchy Visualized</div>
                <div className="r53-card" style={{ display: 'flex', justifyContent: 'center', padding: '10px 14px' }}>
                  <svg width="100%" viewBox="0 0 320 250" style={{ display: 'block' }}>
                    <rect x="120" y="5" width="80" height="34" rx="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                    <text x="160" y="26" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">. (Root)</text>

                    <rect x="20" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="60" y="91" textAnchor="middle" fontSize="11" fill="#1d4ed8">.com TLD</text>
                    <rect x="120" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="160" y="91" text-anchor="middle" fontSize="11" fill="#1d4ed8">.org TLD</text>
                    <rect x="220" y="70" width="80" height="34" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="260" y="91" text-anchor="middle" fontSize="11" fill="#1d4ed8">.io TLD</text>

                    <rect x="20" y="136" width="90" height="34" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="65" y="157" text-anchor="middle" fontSize="11" fill="#15803d">example.com</text>
                    <rect x="130" y="136" width="90" height="34" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="175" y="157" text-anchor="middle" fontSize="11" fill="#15803d">google.com</text>

                    <rect x="20" y="202" width="90" height="34" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="65" y="216" text-anchor="middle" fontSize="10" fill="#854d0e">www.</text>
                    <text x="65" y="230" text-anchor="middle" fontSize="9" fill="#854d0e">example.com</text>
                    <rect x="130" y="202" width="90" height="34" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="175" y="216" text-anchor="middle" fontSize="10" fill="#854d0e">api.</text>
                    <text x="175" y="230" text-anchor="middle" fontSize="9" fill="#854d0e">example.com</text>

                    <line x1="160" y1="39" x2="60" y2="70" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="160" y1="39" x2="160" y2="70" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="160" y1="39" x2="260" y2="70" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="60" y1="104" x2="65" y2="136" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="60" y1="104" x2="175" y2="136" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="65" y1="170" x2="65" y2="202" stroke="#6b7280" strokeWidth="0.5"/>
                    <line x1="65" y1="170" x2="175" y2="202" stroke="#6b7280" strokeWidth="0.5"/>
                  </svg>
                </div>

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
                  <div className="r53-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                    {dnsSteps.length === 0 ? '; Waiting for resolution...\n; Enter domain name and click Resolve above.' : dnsSteps.join('\n')}
                  </div>
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
                      <marker id="r1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                      <marker id="r2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                    </defs>
                    <rect x="10" y="10" width="320" height="52" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="30" text-anchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🌐 User requests domain.com</text>
                    <text x="170" y="48" text-anchor="middle" fontSize="11" fill="#7c3aed">Browser / App / Client device</text>

                    <rect x="10" y="86" width="320" height="52" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                    <text x="170" y="106" text-anchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🔄 DNS Resolver (8.8.8.8 / ISP)</text>
                    <text x="170" y="124" text-anchor="middle" fontSize="11" fill="#c2410c">Performs recursive checks → queries Route 53</text>

                    <rect x="10" y="162" width="320" height="72" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="182" text-anchor="middle" fontSize="13" fill="#7c3aed" fontWeight="500">🚀 Route 53 DNS</text>
                    <rect x="22" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="67" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Hosted Zone</text>
                    <rect x="125" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Routing Rules</text>
                    <rect x="228" y="194" width="90" height="28" rx="6" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="273" y="212" text-anchor="middle" fontSize="10" fill="#6d28d9">Health Status</text>

                    <rect x="10" y="258" width="148" height="52" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="84" y="278" text-anchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">⚖️ ALB / NLB</text>
                    <text x="84" y="296" text-anchor="middle" fontSize="11" fill="#1d4ed8">Elastic Load Balancer</text>
                    <rect x="182" y="258" width="148" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="256" y="278" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">☁️ CloudFront</text>
                    <text x="256" y="296" text-anchor="middle" fontSize="11" fill="#166534">Global CDN Distribution</text>

                    <rect x="10" y="334" width="90" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="55" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">EC2</text>
                    <text x="55" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">VM Instances</text>
                    <rect x="115" y="334" width="90" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="160" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">ECS/EKS</text>
                    <text x="160" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">Containers</text>
                    <rect x="220" y="334" width="110" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="275" y="354" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">S3 / Lambda</text>
                    <text x="275" y="372" text-anchor="middle" fontSize="10" fill="#854d0e">Serverless Hosting</text>

                    <line x1="170" y1="62" x2="170" y2="86" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)"/>
                    <line x1="170" y1="138" x2="170" y2="162" stroke="#c2410c" strokeWidth="1" markerEnd="url(#r1)"/>
                    <line x1="110" y1="234" x2="84" y2="258" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)"/>
                    <line x1="230" y1="234" x2="256" y2="258" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#r1)"/>
                    <line x1="84" y1="310" x2="55" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)"/>
                    <line x1="84" y1="310" x2="160" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)"/>
                    <line x1="256" y1="310" x2="275" y2="334" stroke="#15803d" strokeWidth="1" markerEnd="url(#r2)"/>
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
                    <circle cx="160" cy="30" r="18" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="160" y="34" textAnchor="middle" fontSize="14">💻</text>
                    <text x="160" y="60" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="bold">Global User</text>

                    <rect x="100" y="90" width="120" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="114" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Simple)</text>

                    <rect x="40" y="170" width="100" height="36" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="90" y="192" textAnchor="middle" fontSize="10" fill="#854d0e">IP: 1.2.3.4 (Static)</text>
                    <rect x="180" y="170" width="100" height="36" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="230" y="192" text-anchor="middle" fontSize="10" fill="#854d0e">IP: 1.2.3.5 (Static)</text>

                    <line x1="160" y1="65" x2="160" y2="88" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2"/>
                    <line x1="140" y1="130" x2="90" y2="168" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="180" y1="130" x2="230" y2="168" stroke="#7c3aed" strokeWidth="1"/>
                  </svg>
                )}

                {activePolicy === 'weighted' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="30" r="18" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="160" y="34" text-anchor="middle" fontSize="14">💻</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Weighted)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                    <text x="80" y="178" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">Region A (70%)</text>
                    <text x="80" y="194" textAnchor="middle" fontSize="9" fill="#dc2626">us-east-1 ALB</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">Region B (30%)</text>
                    <text x="240" y="194" text-anchor="middle" fontSize="9" fill="#1d4ed8">eu-west-1 ALB</text>

                    <line x1="160" y1="50" x2="160" y2="78" stroke="#6b7280" strokeWidth="1"/>
                    <line x1="120" y1="120" x2="80" y2="158" stroke="#7c3aed" strokeWidth="1.5"/>
                    <text x="90" y="136" fontSize="9" fill="#7c3aed" fontWeight="bold">70% traffic</text>
                    <line x1="200" y1="120" x2="240" y2="158" stroke="#7c3aed" strokeWidth="1"/>
                    <text x="220" y="136" fontSize="9" fill="#7c3aed">30% traffic</text>
                  </svg>
                )}

                {activePolicy === 'latency' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="60" cy="30" r="16" fill="#fef2f2" stroke="#fca5a5"/>
                    <text x="60" y="34" textAnchor="middle" fontSize="12">🇺🇸</text>
                    <circle cx="260" cy="30" r="16" fill="#dcfce7" stroke="#86efac"/>
                    <text x="260" y="34" textAnchor="middle" fontSize="12">🇮🇳</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Latency)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#c2410c" fontWeight="bold">us-east-1 (12ms)</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#c2410c">Closest to USA</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">ap-south-1 (18ms)</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#15803d">Closest to India</text>

                    <line x1="70" y1="46" x2="115" y2="80" stroke="#dc2626" strokeWidth="1"/>
                    <line x1="250" y1="46" x2="205" y2="80" stroke="#15803d" strokeWidth="1"/>
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#7c3aed" strokeWidth="1"/>
                  </svg>
                )}

                {activePolicy === 'failover' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="25" r="16" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="160" y="29" textAnchor="middle" fontSize="12">💻</text>

                    <rect x="90" y="70" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="94" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Failover)</text>

                    <rect x="20" y="150" width="120" height="50" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="80" y="168" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">Primary Writer</text>
                    <text x="80" y="182" text-anchor="middle" fontSize="9" fill="#166534">✅ HEALTHY</text>
                    <text x="80" y="194" text-anchor="middle" fontSize="8" fill="#166534">us-east-1</text>

                    <rect x="180" y="150" width="120" height="50" rx="6" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5"/>
                    <text x="240" y="168" text-anchor="middle" fontSize="10" fill="#991b1b" fontWeight="bold">Secondary Standby</text>
                    <text x="240" y="182" text-anchor="middle" fontSize="9" fill="#991b1b">💤 PASSIVE STANDBY</text>
                    <text x="240" y="194" text-anchor="middle" fontSize="8" fill="#991b1b">eu-west-1</text>

                    <line x1="160" y1="42" x2="160" y2="68" stroke="#6b7280" strokeWidth="1"/>
                    <line x1="120" y1="110" x2="80" y2="150" stroke="#15803d" strokeWidth="2"/>
                    <line x1="200" y1="110" x2="240" y2="150" stroke="#991b1b" strokeWidth="1" strokeDasharray="4,2"/>
                  </svg>
                )}

                {activePolicy === 'geo' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="70" cy="30" r="16" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="70" y="34" textAnchor="middle" fontSize="12">🇪🇺</text>
                    <text x="70" y="54" textAnchor="middle" fontSize="9" fill="#6d28d9">Europe User</text>

                    <circle cx="250" cy="30" r="16" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="250" y="34" textAnchor="middle" fontSize="12">🇯🇵</text>
                    <text x="250" y="54" textAnchor="middle" fontSize="9" fill="#6d28d9">Japan User</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Geo)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">eu-west-1 ALB</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Bound: Europe Continent</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">ap-northeast-1 ALB</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Bound: Japan Country</text>

                    <line x1="85" y1="46" x2="120" y2="80" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="235" y1="46" x2="200" y2="80" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#1d4ed8" strokeWidth="1.5"/>
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#1d4ed8" strokeWidth="1.5"/>
                  </svg>
                )}

                {activePolicy === 'geoprox' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <rect x="10" y="10" width="300" height="200" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                    
                    {/* Region Circles */}
                    <circle cx="90" cy="110" r="50" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1" strokeDasharray="3,2"/>
                    <circle cx="230" cy="110" r="70" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
                    
                    <circle cx="90" cy="110" r="4" fill="#dc2626"/>
                    <text x="90" y="125" text-anchor="middle" fontSize="9" fill="#dc2626" fontWeight="bold">US East (No Bias)</text>
                    
                    <circle cx="230" cy="110" r="4" fill="#1d4ed8"/>
                    <text x="230" y="125" text-anchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="bold">EU West (+30 Bias)</text>
                    
                    <text x="160" y="40" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="bold">Geographic Proximity Map Bias</text>
                    <text x="160" y="55" textAnchor="middle" fontSize="8" fill="#64748b">Expanded bias shifts proximity borders</text>
                  </svg>
                )}

                {activePolicy === 'multivalue' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <circle cx="160" cy="25" r="16" fill="#ede9fe" stroke="#c4b5fd"/>
                    <text x="160" y="29" text-anchor="middle" fontSize="12">💻</text>

                    <rect x="90" y="66" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="90" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (Multi-Value)</text>

                    {/* Returning healthy IPs */}
                    <rect x="20" y="130" width="85" height="30" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="625" y="148" textAnchor="middle" fontSize="9" fill="#15803d" transform="translate(-562, 0)">10.0.1.10 ✅</text>

                    <rect x="117.5" y="130" width="85" height="30" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="160" y="148" textAnchor="middle" fontSize="9" fill="#15803d">10.0.1.20 ✅</text>

                    <rect x="215" y="130" width="85" height="30" rx="4" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5"/>
                    <text x="257.5" y="148" text-anchor="middle" fontSize="9" fill="#b91c1c">10.0.1.30 ❌</text>

                    <text x="160" y="195" text-anchor="middle" fontSize="10" fill="#475569">Returns all healthy values (up to 8) to client</text>
                    
                    <line x1="160" y1="41" x2="160" y2="66" stroke="#6b7280" strokeWidth="1"/>
                    <line x1="110" y1="106" x2="62" y2="130" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="160" y1="106" x2="160" y2="130" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="210" y1="106" x2="257" y2="130" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2"/>
                  </svg>
                )}

                {activePolicy === 'ipbased' && (
                  <svg width="100%" viewBox="0 0 320 220" style={{ display: 'block' }}>
                    <rect x="20" y="16" width="100" height="36" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="70" y="32" text-anchor="middle" fontSize="9" fill="#475569" fontWeight="bold">CIDR Collection A</text>
                    <text x="70" y="44" text-anchor="middle" fontSize="8" fill="#64748b">192.168.1.0/24</text>

                    <rect x="200" y="16" width="100" height="36" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="250" y="32" text-anchor="middle" fontSize="9" fill="#475569" fontWeight="bold">Any Other Subnet</text>
                    <text x="250" y="44" text-anchor="middle" fontSize="8" fill="#64748b">0.0.0.0/0 (Default)</text>

                    <rect x="90" y="80" width="140" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="160" y="104" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🚀 Route 53 (IP-Based)</text>

                    <rect x="20" y="160" width="120" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="80" y="178" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">Corporate Proxy</text>
                    <text x="80" y="192" text-anchor="middle" fontSize="9" fill="#15803d">Target A (Internal)</text>

                    <rect x="180" y="160" width="120" height="44" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="240" y="178" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">Public ALB</text>
                    <text x="240" y="192" text-anchor="middle" fontSize="9" fill="#1d4ed8">Target B (Public)</text>

                    <line x1="70" y1="52" x2="120" y2="80" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="250" y1="52" x2="200" y2="80" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="120" y1="120" x2="80" y2="160" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="200" y1="120" x2="240" y2="160" stroke="#7c3aed" strokeWidth="1"/>
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
                        Domain: <b>{simpleDomain}</b><br/>
                        Record Type: <b>A</b> | TTL: <b>300s</b><br/>
                        IPs Returned: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{simpleResolvedIPs.join(', ')}</span><br/>
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
                        Target Resolved: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{geoResolvedTarget}</span><br/>
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
                        Query Resolved to:<br/>
                        <span style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '13px' }}>{geoproxResolvedTarget}</span><br/>
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
                          <span>Server #{idx+1} ({10+idx})</span>
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
                        IPs Returned in response: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{multivalueResolvedIPs.join(', ')}</span><br/>
                        Total healthy: <b>{multivalueResolvedIPs.length}</b> / 4<br/>
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
                        Outcome: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{ipbasedResolvedTarget}</span><br/>
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
            <div className="r53-g2" style={{ marginBottom: '10px' }}>
              <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Health Check Probe Flow Architecture</div>
                <svg width="100%" viewBox="0 0 340 400" style={{ display: 'block' }}>
                  <defs>
                    <marker id="hc1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                    <marker id="hc2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#dc2626"/></marker>
                  </defs>
                  <rect x="80" y="10" width="180" height="52" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                  <text x="170" y="30" text-anchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🚀 Route 53</text>
                  <text x="170" y="48" text-anchor="middle" fontSize="11" fill="#7c3aed">Health Check Engine</text>

                  <rect x="10" y="90" width="148" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="84" y="110" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">✅ Primary</text>
                  <text x="84" y="128" text-anchor="middle" fontSize="11" fill="#166534">us-east-1 ALB</text>
                  
                  <rect x="182" y="90" width="148" height="52" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                  <text x="256" y="110" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">❌ Secondary</text>
                  <text x="256" y="128" text-anchor="middle" fontSize="11" fill="#dc2626">eu-west-1 ALB</text>

                  <rect x="10" y="168" width="320" height="72" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                  <text x="170" y="188" text-anchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🌍 Route 53 Health Checkers</text>
                  <text x="170" y="206" text-anchor="middle" fontSize="11" fill="#c2410c">15+ global locations probe endpoints</text>
                  <text x="170" y="224" text-anchor="middle" fontSize="11" fill="#c2410c">HTTP · HTTPS · TCP tests every 10s or 30s</text>

                  <rect x="10" y="264" width="148" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="84" y="284" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Healthy</text>
                  <text x="84" y="302" text-anchor="middle" fontSize="11" fill="#166534">Checkers pass threshold</text>
                  
                  <rect x="182" y="264" width="148" height="52" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                  <text x="256" y="284" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">Unhealthy</text>
                  <text x="256" y="302" text-anchor="middle" fontSize="11" fill="#dc2626">Checkers fail threshold</text>

                  <rect x="10" y="340" width="320" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="170" y="360" text-anchor="middle" fontSize="12" fill="#854d0e" fontWeight="500">📢 CloudWatch Alarm + SNS Alert</text>
                  <text x="170" y="378" text-anchor="middle" fontSize="11" fill="#854d0e">Trigger Email/Slack alerts on health change</text>

                  <line x1="130" y1="62" x2="84" y2="90" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#hc1)"/>
                  <line x1="210" y1="62" x2="256" y2="90" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#hc2)"/>
                  <line x1="84" y1="142" x2="84" y2="168" stroke="#15803d" strokeWidth="1" markerEnd="url(#hc1)"/>
                  <line x1="256" y1="142" x2="256" y2="168" stroke="#dc2626" strokeWidth="1" markerEnd="url(#hc2)"/>
                  <line x1="84" y1="240" x2="84" y2="264" stroke="#15803d" strokeWidth="1" markerEnd="url(#hc1)"/>
                  <line x1="256" y1="240" x2="256" y2="264" stroke="#dc2626" strokeWidth="1" markerEnd="url(#hc2)"/>
                  <line x1="170" y1="316" x2="170" y2="340" stroke="#854d0e" strokeWidth="1" markerEnd="url(#hc1)"/>
                </svg>
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

            {/* FAILOVER SIMULATOR BLOCK */}
            <div className="r53-sec">Failover Routing Simulator (Disaster Recovery Playground)</div>
            <div className="r53-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                Toggle the health states of the primary and secondary endpoints to see how Route 53 failover records automatically adjust DNS responses in real time.
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '0.5px solid var(--color-border-secondary)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>Primary (us-east-1):</span>
                  <button
                    onClick={() => setPrimHealthy(!primHealthy)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      background: primHealthy ? '#dcfce7' : '#fee2e2',
                      border: primHealthy ? '0.5px solid #86efac' : '0.5px solid #fca5a5',
                      color: primHealthy ? '#166534' : '#991b1b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {primHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>Secondary (eu-west-1):</span>
                  <button
                    onClick={() => setSecHealthy(!secHealthy)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      background: secHealthy ? '#dcfce7' : '#fee2e2',
                      border: secHealthy ? '0.5px solid #86efac' : '0.5px solid #fca5a5',
                      color: secHealthy ? '#166534' : '#991b1b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {secHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--color-background-secondary)', padding: '12px 14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Route 53 Current Routing Outcome:</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: failoverOutcome.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {failoverOutcome.text}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {failoverOutcome.desc}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ARCHITECTURE PANEL */}
        {activeSection === 'arch' && (
          <div>
            <div className="r53-sec">Full Global AWS Routing Architecture with Route 53</div>
            <div className="r53-card">
              <svg width="100%" viewBox="0 0 680 380" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <marker id="ar1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                  <marker id="ar2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                  <marker id="ar3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#0369a1"/></marker>
                </defs>
                <rect x="10" y="10" width="660" height="360" rx="16" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
                <text x="340" y="30" textAnchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="500">AWS Global Infrastructure Routing Map</text>

                <rect x="270" y="44" width="140" height="44" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                <text x="340" y="64" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🚀 Route 53</text>
                <text x="340" y="80" text-anchor="middle" fontSize="10" fill="#7c3aed">DNS + Probes</text>

                <rect x="25" y="44" width="120" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="85" y="64" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🌐 Users</text>
                <text x="85" y="80" text-anchor="middle" fontSize="10" fill="#dc2626">Global clients</text>

                <rect x="535" y="44" width="120" height="44" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                <text x="595" y="64" text-anchor="middle" fontSize="11" fill="#0f766e" fontWeight="500">🛡️ AWS WAF</text>
                <text x="595" y="80" text-anchor="middle" fontSize="10" fill="#0f766e">Web Application Firewall</text>

                <rect x="200" y="120" width="140" height="44" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                <text x="270" y="140" text-anchor="middle" fontSize="11" fill="#c2410c" fontWeight="500">☁️ CloudFront</text>
                <text x="270" y="156" text-anchor="middle" fontSize="10" fill="#c2410c">CDN (Static Caching)</text>

                <rect x="360" y="120" width="140" height="44" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                <text x="430" y="140" text-anchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">⚖️ ALB</text>
                <text x="430" y="156" text-anchor="middle" fontSize="10" fill="#1d4ed8">Application Load Balancer</text>

                <rect x="25" y="200" width="120" height="44" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                <text x="85" y="220" text-anchor="middle" fontSize="11" fill="#854d0e" fontWeight="500">🪣 S3 Bucket</text>
                <text x="85" y="236" text-anchor="middle" fontSize="10" fill="#854d0e">Static Site Host</text>

                <rect x="200" y="200" width="120" height="44" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="260" y="220" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">🖥️ EC2 / ECS</text>
                <text x="260" y="236" text-anchor="middle" fontSize="10" fill="#166534">Compute Servers</text>

                <rect x="360" y="200" width="120" height="44" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="420" y="220" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">λ Lambda</text>
                <text x="420" y="236" text-anchor="middle" fontSize="10" fill="#166534">Serverless Functions</text>

                <rect x="535" y="200" width="120" height="44" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                <text x="595" y="220" text-anchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">🌍 Global Accel.</text>
                <text x="595" y="236" text-anchor="middle" fontSize="10" fill="#7c3aed">Anycast IP Routing</text>

                <rect x="150" y="290" width="120" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="210" y="310" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🗄️ RDS DB</text>
                <text x="210" y="326" text-anchor="middle" fontSize="10" fill="#dc2626">Private subnet endpoint</text>

                <rect x="310" y="290" width="120" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="370" y="310" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">⚡ ElastiCache</text>
                <text x="370" y="326" text-anchor="middle" fontSize="10" fill="#dc2626">Private cache cluster</text>

                <rect x="470" y="290" width="120" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="530" y="310" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🔒 Internal API</text>
                <text x="530" y="326" text-anchor="middle" fontSize="10" fill="#dc2626">api.internal</text>

                <line x1="145" y1="66" x2="268" y2="66" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ar1)"/>
                <line x1="340" y1="88" x2="270" y2="120" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ar1)"/>
                <line x1="340" y1="88" x2="430" y2="120" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ar1)"/>
                <line x1="340" y1="88" x2="85" y2="200" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ar1)"/>
                <line x1="410" y1="88" x2="595" y2="120" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#ar1)"/>
                <line x1="270" y1="164" x2="260" y2="200" stroke="#15803d" strokeWidth="1" markerEnd="url(#ar2)"/>
                <line x1="430" y1="164" x2="420" y2="200" stroke="#15803d" strokeWidth="1" markerEnd="url(#ar2)"/>
                <line x1="260" y1="244" x2="210" y2="290" stroke="#0369a1" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#ar3)"/>
                <line x1="420" y1="244" x2="370" y2="290" stroke="#0369a1" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#ar3)"/>
                <line x1="420" y1="244" x2="530" y2="290" stroke="#0369a1" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#ar3)"/>

                <text x="340" y="352" text-anchor="middle" fontSize="10" fill="var(--color-text-secondary)">Solid Lines = Public DNS Targets | Dashed Lines = Private Hosted Zones (VPC Bound)</text>
              </svg>
            </div>

            <div className="r53-g2">
              <div>
                <div className="r53-sec">Private Hosted Zone — VPC Internal DNS</div>
                <div className="r53-card" style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="100%" viewBox="0 0 320 280" style={{ display: 'block' }}>
                    <rect x="10" y="10" width="300" height="260" rx="14" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="160" y="30" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="500">VPC Bubble — Private Hosted Zone</text>
                    <text x="160" y="46" text-anchor="middle" fontSize="10" fill="#166534">internal.example.com</text>

                    <rect x="25" y="60" width="120" height="40" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="85" y="84" text-anchor="middle" fontSize="11" fill="#1d4ed8">App Server</text>

                    <rect x="175" y="60" width="120" height="40" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="235" y="78" text-anchor="middle" fontSize="11" fill="#7c3aed">Route 53</text>
                    <text x="235" y="94" text-anchor="middle" fontSize="10" fill="#7c3aed">Private Resolver</text>

                    <rect x="25" y="140" width="120" height="40" rx="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                    <text x="85" y="158" text-anchor="middle" fontSize="11" fill="#dc2626">db.internal</text>
                    <text x="85" y="174" text-anchor="middle" fontSize="10" fill="#dc2626">→ RDS endpoint</text>

                    <rect x="175" y="140" width="120" height="40" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                    <text x="235" y="158" text-anchor="middle" fontSize="11" fill="#854d0e">cache.internal</text>
                    <text x="235" y="174" text-anchor="middle" fontSize="10" fill="#854d0e">→ ElastiCache</text>

                    <rect x="100" y="218" width="120" height="40" rx="8" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                    <text x="160" y="236" text-anchor="middle" fontSize="11" fill="#0f766e">api.internal</text>
                    <text x="160" y="252" text-anchor="middle" fontSize="10" fill="#0f766e">→ Internal ALB</text>

                    <line x1="145" y1="80" x2="173" y2="80" stroke="#7c3aed" strokeWidth="1"/>
                    <line x1="85" y1="100" x2="85" y2="140" stroke="#dc2626" strokeWidth="1" strokeDasharray="3,2"/>
                    <line x1="235" y1="100" x2="235" y2="140" stroke="#854d0e" strokeWidth="1" strokeDasharray="3,2"/>
                    <line x1="85" y1="180" x2="160" y2="218" stroke="#0f766e" strokeWidth="1" strokeDasharray="3,2"/>
                  </svg>
                </div>
              </div>

              <div>
                <div className="r53-sec">Private Hosted Zone Benefits</div>
                <div className="r53-card" style={{ borderLeft: '3px solid #0369a1', minHeight: '235px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0369a1' }}>Why run Split-Horizon / Private DNS?</div>
                  <ul className="r53-ck">
                    <li><b>Internal naming convention consistency:</b> Use short, clean, friendly domain targets (e.g., <code>db.internal</code>) instead of long standard AWS endpoints.</li>
                    <li><b>Zero Public Exposure:</b> Internal architecture records never bleed onto the public web, preventing host leakage or IP address exposures.</li>
                    <li><b>Sub-millisecond Discovery:</b> Microservices inside auto-scaling groups discover peered dependencies seamlessly via standard DNS.</li>
                    <li><b>Cross-VPC Sharing:</b> Private zones can be shared with peered or transit gateway VPCs (including cross-region and cross-account networks).</li>
                    <li><b>Split-Horizon DNS override:</b> Resolve <code>my-app.com</code> to internal IPs for inside workers, and to public IPs for external clients.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
