import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Info,
  Copy,
  Network,
  Zap,
  Sliders,
  Globe
} from 'lucide-react';
import Route53ComparativeView from '../../components/visualizers/Route53ComparativeView';
import UniqueRoute53Features from '../../components/visualizers/UniqueRoute53Features';

type TabType = 'dns' | 'r53' | 'records' | 'routing' | 'health' | 'hybrid' | 'arch' | 'notebook' | 'unique';
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

// Production Terraform Route 53 Record Snippet
const terraformRoute53RecordCode = `resource "aws_route53_zone" "primary" {
  name = "example.com"
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "www.example.com"
  type    = "A"

  # Alias points directly to ALB (No query costs, apex supported!)
  alias {
    name                   = aws_lb.external_alb.dns_name
    zone_id                = aws_lb.external_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "canary_weighted" {
  count   = 2
  zone_id = aws_route53_zone.primary.zone_id
  name    = "app.example.com"
  type    = "A"
  ttl     = 60

  # Weighted Routing Policy Setup
  weighted_routing_policy {
    weight = count.index == 0 ? 90 : 10 # 90% production, 10% canary
  }

  set_identifier = "app-node-\${count.index}"
  records        = [count.index == 0 ? "192.0.2.10" : "192.0.2.20"]
}`;

// Production Route 53 Resolver Configuration Snippet
const r53ResolverConfigCode = `# Inbound Endpoint allowing corporate network to resolve VPC records
resource "aws_route53_resolver_endpoint" "inbound" {
  name      = "r53-inbound-resolver"
  direction = "INBOUND"

  security_group_ids = [aws_security_group.resolver_sg.id]

  ip_address {
    subnet_id = aws_subnet.private_az1.id
  }

  ip_address {
    subnet_id = aws_subnet.private_az2.id
  }
}

# Outbound Rule forwarding corp.local queries to corporate DNS servers
resource "aws_route53_resolver_rule" "forward_corp" {
  domain_name          = "corp.local"
  name                 = "forward-to-corp-dns"
  rule_type            = "FORWARD"
  resolver_endpoint_id = aws_route53_resolver_endpoint.outbound.id

  target_ip {
    ip = "192.168.1.10"
  }

  target_ip {
    ip = "192.168.2.10"
  }
}`;

interface Route53VisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function Route53Visualizer({ provider = 'aws', setProvider }: Route53VisualizerProps) {
  const [activeSection, setActiveSection] = useState<TabType>('notebook');

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon Route 53/gi, 'Azure DNS & Traffic Manager')
        .replace(/Route 53/gi, 'Azure DNS')
        .replace(/Hosted Zone/gi, 'DNS Zone')
        .replace(/Hosted Zones/gi, 'DNS Zones')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon Route 53/gi, 'Google Cloud DNS')
        .replace(/Route 53/gi, 'Cloud DNS')
        .replace(/Hosted Zone/gi, 'Managed Zone')
        .replace(/Hosted Zones/gi, 'Managed Zones')
        .replace(/CloudWatch/g, 'Cloud Monitoring');
    }
    return text;
  };

  const Translate = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    if (provider === 'aws') {
      return <>{children}</>;
    }

    const translateNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        return t(node);
      }
      if (typeof node === 'number') {
        return node;
      }
      if (React.isValidElement(node)) {
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'acad-terminal' || node.props.className === 'r53-terminal'))) {
          return node;
        }
        if (node.props && node.props.children) {
          if (typeof node.props.children === 'function') {
            return node;
          }
          const translatedChildren = React.Children.map(node.props.children, translateNode);
          return React.cloneElement(node, { ...node.props, children: translatedChildren });
        }
        return node;
      }
      if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{translateNode(child)}</React.Fragment>);
      }
      return node;
    };

    return <>{translateNode(children)}</>;
  };

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', section: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveSection(section === 'concept' ? 'r53' : section);
  };
  const [selectedNote, setSelectedNote] = useState<string>('dns_queries');
  const [expandedCategory, setExpandedCategory] = useState<string>('dns_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive Anycast Latency states
  const [nbUserLocation, setNbUserLocation] = useState<'usa' | 'europe' | 'asia'>('usa');
  const [nbUsEastLatency, setNbUsEastLatency] = useState<number>(20);
  const [nbEuWestLatency, setNbEuWestLatency] = useState<number>(85);
  const [nbApSouthLatency, setNbApSouthLatency] = useState<number>(210);

  // Interactive Weighted Canary states
  const [nbCanaryWeight, setNbCanaryWeight] = useState<number>(20);
  const [nbCanaryLog, setNbCanaryLog] = useState<string[]>([]);

  const runCanaryRolloutSim = () => {
    const logs: string[] = [];
    let canaryHits = 0;
    let prodHits = 0;
    for (let i = 1; i <= 10; i++) {
      const rand = Math.random() * 100;
      const isCanary = rand < nbCanaryWeight;
      if (isCanary) {
        canaryHits++;
        logs.push(`Query #${i}: app.example.com &rarr; Canary Target IP 192.0.2.20 (Canary Weight Match)`);
      } else {
        prodHits++;
        logs.push(`Query #${i}: app.example.com &rarr; Production Target IP 192.0.2.10 (Production Weight Match)`);
      }
    }
    logs.unshift(`📊 Canary Results: ${canaryHits} hits (${canaryHits * 10}%), Production: ${prodHits} hits (${prodHits * 10}%)`);
    setNbCanaryLog(logs);
  };

  const handleCopyCode = (codeText: string, noteId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

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

  // Redraw Weighted Routing Canvas is handled natively via animated SVG in Tab 4

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
  let cacheBoxStroke = 'var(--r53-inner-card-border)';
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
  } else if (hasCacheItems) {
    cacheBoxClass = 'cache-active-pulse';
    cacheBoxStroke = 'var(--color-green)';
    cacheBoxStrokeWidth = 1.5;
  }

  return (
    <div className="r53-container">
      <style>{`
        .r53-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --color-bg-glass: rgba(255, 255, 255, 0.75);
          --color-border-glass: rgba(226, 232, 240, 0.8);
          --shadow-premium: 0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.08);

          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          --color-border-secondary: #e2e8f0;
          --r53-svg-line-stroke: #cbd5e1;
          --r53-inner-card-bg: #f8fafc;
          --r53-inner-card-border: #e2e8f0;

          --color-red: #dc2626;
          --color-amber: #d97706;
          --color-green: #16a34a;
          --color-blue: #2563eb;
          --color-purple: #7c3aed;

          /* Subnet backgrounds and strokes (Light Mode) */
          --r53-subnet-client-bg: rgba(241, 245, 249, 0.3);
          --r53-subnet-client-stroke: #94a3b8;
          --r53-subnet-client-text: #475569;

          --r53-subnet-resolver-bg: rgba(255, 247, 237, 0.3);
          --r53-subnet-resolver-stroke: #fed7aa;
          --r53-subnet-resolver-text: #c2410c;

          --r53-subnet-auth-bg: rgba(243, 232, 255, 0.3);
          --r53-subnet-auth-stroke: #e9d5ff;
          --r53-subnet-auth-text: #6d28d9;

          --r53-subnet-app-bg: rgba(240, 249, 255, 0.3);
          --r53-subnet-app-stroke: #bae6fd;
          --r53-subnet-app-text: #0284c7;

          /* Node gradients (Light Mode) */
          --primary-grad-start: #eff6ff;
          --primary-grad-stop: #dbeafe;
          --primary-grad-stroke: #3b82f6;
          --primary-grad-text: #1e40af;

          --replica-grad-start: #f0fdf4;
          --replica-grad-stop: #dcfce7;
          --replica-grad-stroke: #10b981;
          --replica-grad-text: #065f46;

          --orange-grad-start: #fff7ed;
          --orange-grad-stop: #ffedd5;
          --orange-grad-stroke: #f97316;
          --orange-grad-text: #7c2d12;

          --purple-grad-start: #faf5ff;
          --purple-grad-stop: #f3e8ff;
          --purple-grad-stroke: #c4b5fd;
          --purple-grad-text: #5b21b6;

          --red-grad-start: #fff5f5;
          --red-grad-stop: #fee2e2;
          --red-grad-stroke: #ef4444;
          --red-grad-text: #991b1b;

          --teal-grad-start: #f0fdfa;
          --teal-grad-stop: #ccfbf1;
          --teal-grad-stroke: #0d9488;
          --teal-grad-text: #0f766e;

          --arch-public-bg: rgba(22, 163, 74, 0.1);
          --arch-public-border: #16a34a;
          --arch-public-text: #16a34a;

          --arch-private-bg: rgba(37, 99, 235, 0.1);
          --arch-private-border: #2563eb;
          --arch-private-text: #2563eb;

          --arch-hybrid-bg: rgba(124, 58, 237, 0.1);
          --arch-hybrid-border: #7c3aed;
          --arch-hybrid-text: #7c3aed;

          --arch-inactive-btn-bg: rgba(15, 23, 42, 0.08);

          --r53-edge-zone-bg: rgba(250, 245, 255, 0.3);
          --r53-edge-zone-stroke: #d8b4fe;
          --r53-edge-zone-text: #701a75;

          --r53-vpc-bubble-bg: rgba(240, 249, 255, 0.45);
          --r53-vpc-bubble-stroke-inactive: #94a3b8;

          --r53-amber-border: rgba(217, 119, 6, 0.25);
          --r53-amber-bg: rgba(217, 119, 6, 0.06);
        }

        .dark .r53-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --color-bg-glass: rgba(15, 23, 42, 0.75);
          --color-border-glass: rgba(51, 65, 85, 0.6);
          --shadow-premium: 0 10px 15px -3px rgba(0, 0, 0, 0.3);

          --color-text-primary: #f8fafc;
          --color-text-secondary: #94a3b8;
          --color-text-tertiary: #64748b;
          --color-border-secondary: rgba(51, 65, 85, 0.6);
          --r53-svg-line-stroke: rgba(100, 116, 139, 0.5);
          --r53-inner-card-bg: rgba(15, 23, 42, 0.6);
          --r53-inner-card-border: rgba(51, 65, 85, 0.6);

          --color-red: #f87171;
          --color-amber: #fbbf24;
          --color-green: #4ade80;
          --color-blue: #60a5fa;
          --color-purple: #a78bfa;

          /* Subnet backgrounds and strokes (Dark Mode) */
          --r53-subnet-client-bg: rgba(30, 41, 59, 0.3);
          --r53-subnet-client-stroke: rgba(148, 163, 184, 0.5);
          --r53-subnet-client-text: #94a3b8;

          --r53-subnet-resolver-bg: rgba(67, 20, 7, 0.2);
          --r53-subnet-resolver-stroke: rgba(234, 88, 12, 0.5);
          --r53-subnet-resolver-text: #f97316;

          --r53-subnet-auth-bg: rgba(46, 16, 101, 0.2);
          --r53-subnet-auth-stroke: rgba(139, 92, 246, 0.5);
          --r53-subnet-auth-text: #a78bfa;

          --r53-subnet-app-bg: rgba(8, 51, 68, 0.2);
          --r53-subnet-app-stroke: rgba(2, 132, 199, 0.5);
          --r53-subnet-app-text: #38bdf8;

          /* Node gradients (Dark Mode) */
          --primary-grad-start: #172554;
          --primary-grad-stop: #1e3a8a;
          --primary-grad-stroke: #3b82f6;
          --primary-grad-text: #eff6ff;

          --replica-grad-start: #022c22;
          --replica-grad-stop: #064e3b;
          --replica-grad-stroke: #10b981;
          --replica-grad-text: #dcfce7;

          --orange-grad-start: #431407;
          --orange-grad-stop: #7c2d12;
          --orange-grad-stroke: #f97316;
          --orange-grad-text: #ffedd5;

          --purple-grad-start: #2e1065;
          --purple-grad-stop: #3b0764;
          --purple-grad-stroke: #8b5cf6;
          --purple-grad-text: #f5f3ff;

          --red-grad-start: #450a0a;
          --red-grad-stop: #7f1d1d;
          --red-grad-stroke: #ef4444;
          --red-grad-text: #fee2e2;

          --teal-grad-start: #042f2e;
          --teal-grad-stop: #115e59;
          --teal-grad-stroke: #0d9488;
          --teal-grad-text: #ccfbf1;

          --arch-public-bg: rgba(74, 222, 128, 0.15);
          --arch-public-border: #4ade80;
          --arch-public-text: #4ade80;

          --arch-private-bg: rgba(96, 165, 250, 0.15);
          --arch-private-border: #60a5fa;
          --arch-private-text: #60a5fa;

          --arch-hybrid-bg: rgba(167, 139, 250, 0.15);
          --arch-hybrid-border: #a78bfa;
          --arch-hybrid-text: #a78bfa;

          --arch-inactive-btn-bg: rgba(255, 255, 255, 0.08);

          --r53-edge-zone-bg: rgba(147, 51, 234, 0.05);
          --r53-edge-zone-stroke: rgba(168, 85, 247, 0.4);
          --r53-edge-zone-text: #c084fc;

          --r53-vpc-bubble-bg: rgba(30, 41, 59, 0.2);
          --r53-vpc-bubble-stroke-inactive: rgba(148, 163, 184, 0.3);

          --r53-amber-border: rgba(251, 191, 36, 0.25);
          --r53-amber-bg: rgba(251, 191, 36, 0.06);
        }

        .r53-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #3b82f6 0%, #4f46e5 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .r53-sub {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 90%;
        }

        .r53-svg-bg {
          background-color: #fafbfd;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 16px 16px;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: inset 0 2px 8px rgba(148, 163, 184, 0.04);
        }
        .r53-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1.5px solid var(--color-border-secondary); padding-bottom: 12px; }
        .r53-tb {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid var(--r53-inner-card-border);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: var(--r53-inner-card-bg);
          color: var(--color-text-secondary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .r53-tb:hover {
          background: rgba(241, 245, 249, 0.95);
          color: var(--color-text-primary);
          transform: translateY(-1px);
        }
        .r53-tb.r53-on {
          background: linear-gradient(135deg, var(--color-green) 0%, var(--replica-grad-stroke) 100%);
          color: #ffffff;
          border-color: var(--replica-grad-stroke);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .r53-tb.r53-on-notebook { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-color: #0284c7; }
        .r53-tb.r53-on-dns { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-color: #2563eb; }
        .r53-tb.r53-on-r53 { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-color: #4f46e5; }
        .r53-tb.r53-on-records { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #059669; }
        .r53-tb.r53-on-routing { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-color: #d97706; }
        .r53-tb.r53-on-health { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-color: #db2777; }
        .r53-tb.r53-on-hybrid { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-color: #7c3aed; }
        .r53-tb.r53-on-arch { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-color: #0891b2; }
        .r53-tb.r53-on-unique { background: linear-gradient(135deg, #10b981 0%, #047857 100%); border-color: #047857; }
        .r53-card {
          background: var(--color-bg-glass);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--color-border-glass);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: var(--shadow-premium);
          margin-bottom: 16px;
          transition: all 0.2s ease-in-out;
        }
        .r53-card:hover {
          box-shadow: 0 12px 36px -8px rgba(148, 163, 184, 0.18), 0 2px 4px rgba(148, 163, 184, 0.06);
          border-color: rgba(203, 213, 225, 0.9);
        }
        .r53-card select, .r53-card input {
          border: 1.5px solid var(--r53-inner-card-border) !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          box-shadow: none !important;
        }
        .r53-card select:focus, .r53-card input:focus {
          border-color: var(--color-green) !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15) !important;
        }
        .r53-sec { font-size: 11px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .06em; margin: 20px 0 10px; }
        .r53-sec:first-child { margin-top: 0; }
        .r53-kv { display: flex; gap: 8px; font-size: 12.5px; margin: 8px 0; align-items: baseline; border-bottom: 0.5px solid var(--color-border-secondary); padding-bottom: 4px; }
        .r53-kk { min-width: 150px; color: var(--color-text-tertiary); flex-shrink: 0; font-weight: 500; }
        .r53-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .r53-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .r53-met {
          background: var(--r53-inner-card-bg);
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 12px;
          padding: 14px;
          text-align: center;
          transition: all 0.2s ease;
        }
        .r53-met:hover {
          background: rgba(241, 245, 249, 0.9);
        }
        ul.r53-ck li { font-size: 12.5px; margin-bottom: 8px; list-style: none; padding-left: 20px; position: relative; color: var(--color-text-secondary); }
        ul.r53-ck li::before { content: "✓"; position: absolute; left: 0; color: var(--color-green); font-weight: 800; }
        .r53-log {
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 12px;
          padding: 12px 14px;
          background: #0f172a;
          font-size: 11px;
          font-family: var(--font-mono, monospace);
          white-space: pre-wrap;
          line-height: 1.5;
          color: #38bdf8;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
        }
        .r53-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .r53-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--r53-inner-card-border);
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }
        .r53-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .r53-btn.r53-on {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border-color: #4f46e5;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
        }
        @keyframes cachePulse {
          0% { stroke: var(--color-green); stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.4)); }
          50% { stroke: #34d399; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(52, 211, 153, 0.8)); }
          100% { stroke: var(--color-green); stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.4)); }
        }
        @keyframes cacheQueryHit {
          0% { stroke: var(--color-green); stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6)); }
          50% { stroke: #059669; stroke-width: 4.5px; filter: drop-shadow(0 0 20px rgba(5, 150, 105, 1)); }
          100% { stroke: var(--color-green); stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6)); }
        }
        @keyframes cacheQueryMiss {
          0% { stroke: var(--color-amber); stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.6)); }
          50% { stroke: var(--color-red); stroke-width: 4.5px; filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)); }
          100% { stroke: var(--color-amber); stroke-width: 2.5px; filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.6)); }
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
          0%, 100% { fill: var(--color-red); opacity: 1; filter: drop-shadow(0 0 4px var(--color-red)); }
          50% { fill: #7f1d1d; opacity: 0.2; filter: none; }
        }
        @keyframes breathingGreen {
          0%, 100% { stroke: var(--color-green); stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.3)); }
          50% { stroke: #34d399; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(52, 211, 153, 0.7)); }
        }
        @keyframes breathingRed {
          0%, 100% { stroke: var(--color-red); stroke-width: 1.5px; filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.3)); }
          50% { stroke: #f87171; stroke-width: 2.5px; filter: drop-shadow(0 0 10px rgba(248, 113, 113, 0.7)); }
        }
        .ping-line-ok {
          stroke: var(--color-green);
          stroke-dasharray: 6, 4;
          animation: heartbeatPulse 1.5s linear infinite;
        }
        .ping-line-fail {
          stroke: var(--color-red);
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
        .r53-flow-blue {
          stroke: var(--color-blue);
          stroke-dasharray: 6,4;
          animation: r53FlowDash 1s linear infinite;
        }
        .r53-flow-green {
          stroke: var(--color-green);
          stroke-dasharray: 6,4;
          animation: r53FlowDash 0.8s linear infinite;
        }
        .r53-flow-orange {
          stroke: var(--color-amber);
          stroke-dasharray: 6,4;
          animation: r53FlowDash 1s linear infinite;
        }
        .r53-flow-purple {
          stroke: var(--color-purple);
          stroke-dasharray: 6,4;
          animation: r53FlowDash 1.2s linear infinite;
        }
        .r53-flow-red {
          stroke: var(--color-red);
          stroke-dasharray: 5,3;
          animation: r53FlowDash 0.5s linear infinite;
        }
        @keyframes r53FlowDash {
          to { stroke-dashoffset: -20; }
        }
        .r53-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .r53-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.15));
        }
        .r53-pulse-active {
          animation: r53PulseGlow 1.5s infinite alternate;
        }
        @keyframes r53PulseGlow {
          from {
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
          }
          to {
            filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
          }
        }
        @keyframes clientPulse {
          from { filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(59, 130, 246, 0.85)); }
        }
        @keyframes resolverPulse {
          from { filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.85)); }
        }
        @keyframes rootPulse {
          from { filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(239, 68, 68, 0.85)); }
        }
        @keyframes tldPulse {
          from { filter: drop-shadow(0 0 2px rgba(37, 99, 235, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(37, 99, 235, 0.85)); }
        }
        @keyframes authPulse {
          from { filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(124, 58, 237, 0.85)); }
        }
        @keyframes appPulse {
          from { filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.4)); }
          to { filter: drop-shadow(0 0 14px rgba(16, 185, 129, 0.85)); }
        }
        .pulse-client { animation: clientPulse 1.2s infinite alternate ease-in-out; }
        .pulse-resolver { animation: resolverPulse 1.2s infinite alternate ease-in-out; }
        .pulse-root { animation: rootPulse 1.2s infinite alternate ease-in-out; }
        .pulse-tld { animation: tldPulse 1.2s infinite alternate ease-in-out; }
        .pulse-auth { animation: authPulse 1.2s infinite alternate ease-in-out; }
        .pulse-app { animation: appPulse 1.2s infinite alternate ease-in-out; }

        /* Modern Architect Learning Center styles */
        .da-edu-card {
          background: var(--r53-inner-card-bg);
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-edu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
          border-color: #c7d2fe;
        }
        
        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--r53-inner-card-bg);
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .acad-dir-header {
          background: var(--r53-inner-card-bg);
          border-bottom: 1px solid var(--r53-inner-card-border);
          color: var(--color-text-primary);
          padding: 14px 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--r53-inner-card-bg);
          border: none;
          border-bottom: 1px solid var(--r53-inner-card-border);
          font-size: 10px;
          font-weight: 850;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: rgba(241, 245, 249, 0.95);
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
          background: var(--r53-inner-card-bg);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: rgba(241, 245, 249, 0.95);
          color: var(--color-purple);
          border-left-color: var(--color-border-secondary);
        }
        .acad-dir-item-btn.acad-active {
          background: var(--primary-grad-start);
          color: var(--primary-grad-text);
          border-left-color: var(--primary-grad-stroke);
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--r53-inner-card-bg);
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06);
        }
        .acad-hero-badge {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          color: #065f46;
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
          background: linear-gradient(135deg, var(--r53-inner-card-bg) 0%, rgba(241, 245, 249, 0.5) 100%);
          border-left: 4px solid var(--color-purple);
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--r53-inner-card-border);
        }
        .acad-table th {
          background: var(--r53-inner-card-bg);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--r53-inner-card-border);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--r53-inner-card-border);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--r53-inner-card-bg);
          border: 1.5px solid var(--r53-inner-card-border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          position: relative;
        }
        .acad-terminal {
          background: #090d16;
          border: 1px solid var(--r53-inner-card-border);
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }

        /* Academy Grid Layouts */
        .acad-grid-12 {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 24px;
        }
        .acad-col-3 {
          grid-column: span 3 / span 3;
        }
        .acad-col-9 {
          grid-column: span 9 / span 9;
        }
        @media (max-width: 1024px) {
          .acad-grid-12 {
            display: flex;
            flex-direction: column;
          }
          .acad-col-3, .acad-col-9 {
            width: 100%;
          }
        }

        /* Centralized Dark Mode Overrides for Route53Visualizer.tsx */
        .dark .r53-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .r53-card,
        .dark [class*="r53-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .r53-card b,
        .dark .r53-card strong,
        .dark .r53-card h3,
        .dark .r53-card h4 {
          color: #ffffff !important;
        }
        .dark .r53-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .r53-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .r53-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .r53-tb.r53-on {
          background: linear-gradient(135deg, var(--color-green) 0%, var(--replica-grad-stroke) 100%) !important;
          color: #ffffff !important;
          border-color: var(--replica-grad-stroke) !important;
        }
        .dark .r53-sec,
        .dark .r53-kk {
          color: #94a3b8 !important;
        }
        .dark .r53-log,
        .dark .r53-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .r53-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .r53-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .r53-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.r53-ck li {
          color: #cbd5e1 !important;
        }
        .dark .r53-inst,
        .dark .r53-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .r53-inst .meta,
        .dark .r53-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .r53-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .r53-ok {
          border-color: var(--color-green) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .r53-warm {
          border-color: var(--color-amber) !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .r53-drain {
          border-color: var(--color-blue) !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .r53-down {
          border-color: var(--color-red) !important;
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
    
        .dark .acad-dir-container {
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-header {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-folder-btn {
          background: rgba(15, 23, 42, 0.7) !important;
          color: #94a3b8 !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-folder-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .acad-dir-item-btn {
          background: rgba(15, 23, 42, 0.5) !important;
          color: #94a3b8 !important;
        }
        .dark .acad-dir-item-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #38bdf8 !important;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(2, 132, 199, 0.2) !important;
          color: #38bdf8 !important;
          border-left-color: #0ea5e9 !important;
        }
        .dark .acad-table {
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-table th {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-table td {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .acad-sim-diagram {
          background: rgba(15, 23, 42, 0.7) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-detail-card {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .acad-takeaway-box {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-edu-card {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
      `}</style>
 
      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div className="r53-h">
            {isComparative ? (
              <span>⚖️ Multi-Cloud DNS Comparison — AWS Route 53 vs Azure DNS/TM vs GCP Cloud DNS</span>
            ) : isAzure ? (
              <span>🌐 Azure DNS &amp; Azure Traffic Manager</span>
            ) : isGcp ? (
              <span>🌐 Google Cloud DNS &amp; Anycast Nameservers</span>
            ) : (
              <span>🌐 AWS Route 53 — DNS · Hosted Zones · Routing Policies · Health Checks</span>
            )}
          </div>
          <div className="r53-sub">
            {isComparative ? (
              <span>Side-by-side architectural comparison of global DNS and intelligent traffic routing services across AWS, Azure, and GCP.</span>
            ) : isAzure ? (
              <span>Public and Private DNS zones in Azure VNet boundaries. Performance, Geographic, and Priority Traffic Manager routing.</span>
            ) : isGcp ? (
              <span>Managed public and private DNS zones in Google Cloud. Global Anycast DNS, automatic DNSSEC signing, and Weighted/Geolocation routing.</span>
            ) : (
              <span>The internet's phone book — translates domain names to IP addresses · globally distributed infrastructure · 100% Availability SLA</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {!isComparative && (
          <div className="r53-tabs">
            <button className={`r53-tb ${activeSection === 'notebook' ? 'r53-on r53-on-notebook' : ''}`} onClick={() => setActiveSection('notebook')}>📓 Visual Architect Notes</button>
            <button className={`r53-tb ${activeSection === 'dns' ? 'r53-on r53-on-dns' : ''}`} onClick={() => setActiveSection('dns')}>🔍 How DNS Works</button>
            <button className={`r53-tb ${activeSection === 'r53' ? 'r53-on r53-on-r53' : ''}`} onClick={() => setActiveSection('r53')}>🚀 Route 53 Overview</button>
            <button className={`r53-tb ${activeSection === 'records' ? 'r53-on r53-on-records' : ''}`} onClick={() => setActiveSection('records')}>📋 Records &amp; Zones</button>
            <button className={`r53-tb ${activeSection === 'routing' ? 'r53-on r53-on-routing' : ''}`} onClick={() => setActiveSection('routing')}>🗺️ Routing Policies</button>
            <button className={`r53-tb ${activeSection === 'health' ? 'r53-on r53-on-health' : ''}`} onClick={() => setActiveSection('health')}>❤️ Health Checks</button>
            <button className={`r53-tb ${activeSection === 'hybrid' ? 'r53-on r53-on-hybrid' : ''}`} onClick={() => setActiveSection('hybrid')}>🔌 Hybrid DNS</button>
            <button className={`r53-tb ${activeSection === 'arch' ? 'r53-on r53-on-arch' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ Architecture</button>
            <button className={`r53-tb ${activeSection === 'unique' ? 'r53-on r53-on-unique' : ''}`} onClick={() => setActiveSection('unique')}>✨ Unique Features</button>
          </div>
        )}
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>
        {isComparative && (
          <Route53ComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

        {!isComparative && activeSection === 'unique' && (
          <UniqueRoute53Features provider={provider} />
        )}

        {!isComparative && activeSection !== 'unique' && (
          <Translate>
            <>

        {/* VISUAL ARCHITECT ACADEMY NOTEBOOK PANEL */}
        {activeSection === 'notebook' && (() => {
          const recordCodeSnippet = `resource "aws_route53_record" "apex_alb" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "example.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}`;

          const latencyCodeSnippet = `resource "aws_route53_record" "latency_us" {
  zone_id        = aws_route53_zone.primary.zone_id
  name           = "api.example.com"
  type           = "A"
  set_identifier = "us-east-endpoint"
  
  latency_routing_policy {
    region = "us-east-1"
  }

  alias {
    name                   = aws_lb.us_alb.dns_name
    zone_id                = aws_lb.us_alb.zone_id
    evaluate_target_health = true
  }
}`;

          const failoverCodeSnippet = `resource "aws_route53_record" "primary" {
  zone_id        = aws_route53_zone.primary.zone_id
  name           = "app.example.com"
  type           = "A"
  set_identifier = "primary-active"

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary_alb.dns_name
    zone_id                = aws_lb.primary_alb.zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary_check.id
}`;

          const getBestRegion = () => {
            const latencies = [
              { name: 'us-east-1 (N. Virginia)', latency: nbUsEastLatency },
              { name: 'eu-west-1 (Ireland)', latency: nbEuWestLatency },
              { name: 'ap-south-1 (Mumbai)', latency: nbApSouthLatency },
            ];
            latencies.sort((a, b) => a.latency - b.latency);
            return latencies[0];
          };

          const recommendedRegion = getBestRegion();

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', animation: 'fadeIn 0.3s ease-in-out' }}>
              
              <div className="r53-card" style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen style={{ width: '20px', height: '20px', color: '#6366f1' }} /> Route 53 Global Routing Notes
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.45' }}>
                  Explore Domain Name System (DNS) fundamentals, Route 53 routing policies (geolocation, latency, failover), virtual aliases, and hybrid DNS resolution.
                </p>
              </div>

              {/* Grid Layout */}
              <div className="acad-grid-12">
                
                {/* Left Sidebar Menu */}
                <div className="acad-col-3">
                  <div className="acad-dir-container">
                    <div className="acad-dir-header">
                      <BookOpen style={{ width: '16px', height: '16px', color: '#818cf8' }} />
                      <span>Module Index</span>
                    </div>

                    {/* Category 1: DNS Fundamentals */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'dns_fundamentals' ? '' : 'dns_fundamentals')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
                          1. DNS Fundamentals
                        </span>
                        {expandedCategory === 'dns_fundamentals' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'dns_fundamentals' && (
                        <div style={{ background: 'var(--r53-inner-card-bg)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'dns_queries' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('dns_queries')}
                          >
                            DNS Resolution Path
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'record_taxonomy' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('record_taxonomy')}
                          >
                            Record Taxonomy &amp; ALIAS
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category 2: Routing Policies */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'routing_policies' ? '' : 'routing_policies')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
                          2. Routing Policies
                        </span>
                        {expandedCategory === 'routing_policies' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'routing_policies' && (
                        <div style={{ background: 'var(--r53-inner-card-bg)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'latency_geo' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('latency_geo')}
                          >
                            Latency &amp; Geo-Routing
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'failover_health' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('failover_health')}
                          >
                            Failover &amp; Health Probes
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category 3: Advanced Topologies */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'advanced_topologies' ? '' : 'advanced_topologies')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Network style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
                          3. Advanced Topologies
                        </span>
                        {expandedCategory === 'advanced_topologies' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'advanced_topologies' && (
                        <div style={{ background: 'var(--r53-inner-card-bg)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'hybrid_resolver' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('hybrid_resolver')}
                          >
                            Route 53 Resolver
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'gtm_architecture' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('gtm_architecture')}
                          >
                            Global GTM Architectures
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '16px', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11.5px' }}>
                      <Info style={{ width: '14px', height: '14px', color: '#6366f1' }} /> Academy Tips
                    </span>
                    Jump to target simulations directly using the buttons in the note view. All notes are optimized for AWS Solutions Architect exam prep.
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="acad-col-9">

                  {/* NOTE 1: DNS Resolution Path */}
                  {selectedNote === 'dns_queries' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>DNS Resolution Path &amp; Cache Hierarchy</h3>
                        <span className="acad-hero-badge">Core Protocol</span>
                      </div>
                      
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        DNS translates human-readable domains (like <code>www.example.com</code>) into IP addresses. Resolution is hierarchical, querying from root nameservers down to authoritative servers.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>💡 Key Takeaway:</strong> To prevent nameservers from buckling under massive global lookup volumes, caching is enforced at every layer (browser, OS, local gateway, and ISP recursors). Standardizing client and server TTLs (Time To Live) is critical for system update propagation speed vs query efficiency.
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>The 5-Step DNS Resolution Sequence</h4>
                      <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Local Client:</strong> Checks its internal browser cache and OS hosts file. If a match is found (cache hit), it resolves in micro-seconds.</li>
                        <li><strong>Recursive Resolver:</strong> If local miss, queries the client-configured resolver (e.g. ISP or Google 8.8.8.8) which acts as a proxy lookup agent.</li>
                        <li><strong>Root Server (<code>.</code>):</strong> The resolver queries Root Nameservers, which respond with delegation hints pointing to the Top-Level Domain (TLD) server.</li>
                        <li><strong>TLD Nameserver:</strong> The resolver queries the TLD server (e.g. <code>.com</code> registry), which responds with the Authoritative Nameserver addresses.</li>
                        <li><strong>Authoritative Server (Route 53):</strong> The resolver queries the Authoritative nameserver. It returns the final A record IP address, which the resolver caches and delivers to the client.</li>
                      </ol>

                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px', margin: '20px 0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>
                          💻 Diagnostic CLI Lookup: Trace DNS Resolution
                        </span>
                        <div className="acad-terminal">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Terminal Shell</span>
                            <button
                              onClick={() => handleCopyCode(`dig +trace www.example.com`, 'dig_trace')}
                              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                            >
                              <Copy style={{ width: '12px', height: '12px' }} />
                              {copiedNoteId === 'dig_trace' ? 'Copied!' : 'Copy command'}
                            </button>
                          </div>
                          <code style={{ fontSize: '11px', color: '#a7f3d0' }}>
                            $ dig +trace www.example.com<br />
                            <span style={{ color: '#64748b' }}>; &lt;&lt;&gt;&gt; DiG 9.10.6 &lt;&lt;&gt;&gt; +trace www.example.com</span><br />
                            .                       518400  IN  NS  a.root-servers.net.<br />
                            com.                    172800  IN  NS  a.gtld-servers.net.<br />
                            example.com.            172800  IN  NS  ns-123.awsdns-15.com.<br />
                            www.example.com.        300     IN  A   192.0.2.100<br />
                            <span style={{ color: '#38bdf8' }}>;; Received 112 bytes from ns-123.awsdns-15.com in 12ms</span>
                          </code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('dns')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive DNS Simulation Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2: Record Taxonomy & ALIAS */}
                  {selectedNote === 'record_taxonomy' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>DNS Record Taxonomy &amp; Route 53 ALIAS</h3>
                        <span className="acad-hero-badge">AWS Specs</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        DNS records dictate host routing behaviors. While traditional DNS uses standard records like A, AAAA, and CNAME, Route 53 introduces a native, virtual extension: the **ALIAS record**.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>⭐ Why ALIAS over CNAME?</strong> Traditional DNS specs prohibit CNAME records at the naked domain apex (e.g., <code>example.com</code>). CNAMEs also require a client to resolve two DNS queries sequentially. Route 53 ALIAS solves both limitations: it works at the zone apex and resolves internally to AWS resource IPs in a single query cycle.
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>CNAME vs ALIAS Feature Matrix</h4>
                      <div style={{ overflowX: 'auto', margin: '12px 0 20px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Capability / Metric</th>
                              <th>Standard CNAME Record</th>
                              <th>Route 53 ALIAS Record</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Zone Apex Support (example.com)</strong></td>
                              <td>❌ Forbidden (collides with SOA/NS records)</td>
                              <td>✅ Fully Supported natively by AWS</td>
                            </tr>
                            <tr>
                              <td><strong>Target Endpoints</strong></td>
                              <td>Any external hostname (FQDN)</td>
                              <td>Selected AWS endpoints (ALB, S3, CloudFront)</td>
                            </tr>
                            <tr>
                              <td><strong>Lookup Queries</strong></td>
                              <td>Two queries (resolves target name separately)</td>
                              <td>One query (returns IP direct from AWS engine)</td>
                            </tr>
                            <tr>
                              <td><strong>Query Cost Billing</strong></td>
                              <td>Billed standard DNS rate per lookup</td>
                              <td>🆓 Free resolution for registered AWS resources</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Terraform Infrastructure Code</h4>
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>main.tf (AWS Provider)</span>
                          <button
                            onClick={() => handleCopyCode(recordCodeSnippet, 'tf_record')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'tf_record' ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{recordCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('records')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive Records Explorer Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3: Latency & Geo-Routing */}
                  {selectedNote === 'latency_geo' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Latency, Geolocation &amp; Geoproximity</h3>
                        <span className="acad-hero-badge">Global Traffic</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        AWS Route 53 supports advanced routing policies designed to direct global traffic to optimal locations based on latency, geographical mapping, or physical proximity weights.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>🧠 Exam Tip:</strong> <em>Latency Routing</em> focuses on network speeds measured over time, whereas <em>Geolocation Routing</em> respects physical borders (ideal for location compliance like GDPR, or local language content).
                      </div>

                      {/* Interactive Widget 1: Latency Region Matcher */}
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '16px', padding: '20px', margin: '20px 0' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
                          ⚡ Interactive Latency routing calculator
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                              Select Simulated User Location:
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {(['usa', 'europe', 'asia'] as const).map((loc) => (
                                <button
                                  key={loc}
                                  onClick={() => {
                                    setNbUserLocation(loc);
                                    if (loc === 'usa') {
                                      setNbUsEastLatency(15);
                                      setNbEuWestLatency(85);
                                      setNbApSouthLatency(220);
                                    } else if (loc === 'europe') {
                                      setNbUsEastLatency(90);
                                      setNbEuWestLatency(12);
                                      setNbApSouthLatency(140);
                                    } else {
                                      setNbUsEastLatency(230);
                                      setNbEuWestLatency(130);
                                      setNbApSouthLatency(25);
                                    }
                                  }}
                                  className={`r53-btn ${nbUserLocation === loc ? 'r53-on' : ''}`}
                                  style={{ textTransform: 'uppercase', padding: '6px 12px', fontSize: '11px' }}
                                >
                                  {loc}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            <div>
                              <label style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>us-east-1 Latency:</span>
                                <strong>{nbUsEastLatency} ms</strong>
                              </label>
                              <input
                                type="range"
                                min="5"
                                max="300"
                                value={nbUsEastLatency}
                                onChange={(e) => setNbUsEastLatency(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>eu-west-1 Latency:</span>
                                <strong>{nbEuWestLatency} ms</strong>
                              </label>
                              <input
                                type="range"
                                min="5"
                                max="300"
                                value={nbEuWestLatency}
                                onChange={(e) => setNbEuWestLatency(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>ap-south-1 Latency:</span>
                                <strong>{nbApSouthLatency} ms</strong>
                              </label>
                              <input
                                type="range"
                                min="5"
                                max="300"
                                value={nbApSouthLatency}
                                onChange={(e) => setNbApSouthLatency(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1.5px solid var(--color-green)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--color-green)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'block' }}>
                                Route 53 Routing Decision
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 'black', color: 'var(--color-text-primary)' }}>
                                🎯 Request Routed to: <strong>{recommendedRegion.name}</strong>
                              </span>
                            </div>
                            <span style={{
                              background: 'var(--color-green)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              Lowest Latency: {recommendedRegion.latency} ms
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Widget 2: Canary Rollout Simulator */}
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '16px', padding: '20px', margin: '20px 0' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
                          ⚖️ Canary Routing Simulator (Weighted Policy)
                        </h4>
                        <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                          Simulate blue/green canary deployments. Adjust the canary weight target to route a percentage of queries to a preview target.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span>Canary Endpoint Weight (Target IP: 192.0.2.20):</span>
                                <span style={{ color: '#4f46e5' }}>{nbCanaryWeight}%</span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={nbCanaryWeight}
                                onChange={(e) => setNbCanaryWeight(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <button
                              onClick={runCanaryRolloutSim}
                              className="r53-btn r53-on"
                              style={{ padding: '8px 18px', alignSelf: 'flex-end', fontSize: '11.5px' }}
                            >
                              ⚡ Simulate 10 Queries
                            </button>
                          </div>

                          <div className="acad-terminal" style={{ minHeight: '120px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Canary Loadbalancer Routing Log Console</span>
                            {nbCanaryLog.length === 0 ? (
                              <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                                Click the button above to generate mock query hits based on weight allocation.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
                                {nbCanaryLog.map((log, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      color: index === 0 ? '#34d399' : log.includes('Canary') ? '#818cf8' : '#cbd5e1',
                                      fontWeight: index === 0 ? 'bold' : 'normal',
                                      borderBottom: index === 0 ? '1px solid #1e293b' : 'none',
                                      paddingBottom: index === 0 ? '6px' : '0',
                                      marginBottom: index === 0 ? '6px' : '0'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: log }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Weighted Policy Configuration Code</h4>
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>canary.tf</span>
                          <button
                            onClick={() => handleCopyCode(latencyCodeSnippet, 'tf_latency')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'tf_latency' ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{latencyCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('routing')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive Routing Policy Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4: Failover & Health Checks */}
                  {selectedNote === 'failover_health' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Failover &amp; Active Health Checks</h3>
                        <span className="acad-hero-badge">Resiliency</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        Configuring active-passive disaster recovery (DR) architectures relies on Route 53's dynamic health probes. Heartbeat checks monitor regional targets and switch the active records automatically when failures exceed thresholds.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>⚠️ The Failover Delay Math:</strong> Failover is NOT instantaneous. The time window before DNS resolves to Standby equals: <br />
                        <span style={{ display: 'inline-block', marginTop: '4px', color: '#4f46e5', fontWeight: 'bold' }}>
                          Failover Window = (Request Interval * Failure Threshold) + Record TTL
                        </span> <br />
                        Using standard 30s checks and 3 failures threshold with a 300s TTL means clients can suffer up to 390 seconds (6.5 minutes) of outage! Always use fast 10s intervals and low 60s TTLs for critical endpoint records.
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Health Probe Parameter Tunings</h4>
                      <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Request Interval:</strong> Selects check rate. <em>Standard (30s)</em> is cost-effective. <em>Fast (10s)</em> resolves failure detection 3x faster but incurs higher billing costs.</li>
                        <li><strong>Failure Threshold:</strong> The consecutive check failures required to trigger a state change. A setting of 3 prevents erratic failovers due to temporary network packets drop.</li>
                        <li><strong>String Matching:</strong> Optionally queries a specific endpoint (e.g. <code>/healthz</code>) and parses the body response for an exact keyword match (like <code>"status": "OK"</code>).</li>
                      </ul>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Terraform active-passive configuration</h4>
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>failover.tf</span>
                          <button
                            onClick={() => handleCopyCode(failoverCodeSnippet, 'tf_failover')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'tf_failover' ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{failoverCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('health')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive Health Checks Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5: Route 53 Resolver */}
                  {selectedNote === 'hybrid_resolver' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Route 53 Resolver — Hybrid DNS</h3>
                        <span className="acad-hero-badge">Enterprise Hybrid</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        AWS VPC DNS (the +2 resolver IP at <code>169.254.169.253</code>) is natively sandboxed inside its VPC. External corporate servers cannot query it, nor can it forward queries to on-premise Active Directories. **Route 53 Resolver** endpoints resolve this gap.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>🔌 Inbound vs Outbound:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                          <li><strong>Inbound Endpoints:</strong> Expose private elastic network interfaces (ENIs) inside the VPC. On-premise DNS servers forward corp queries for <code>*.aws.internal</code> here.</li>
                          <li><strong>Outbound Endpoints:</strong> Allow VPC DNS to exit the AWS network boundary to query on-premise DNS servers for suffixes like <code>*.corp.local</code>.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Resolver Security &amp; Placement Best Practices</h4>
                      <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>High Availability:</strong> Always configure Resolver Endpoint interfaces in at least TWO separate Availability Zones (AZs) with dedicated subnets.</li>
                        <li><strong>Security Groups:</strong> Clamp down security rules. Inbound endpoints should restrict traffic to port 53 (UDP/TCP) from corporate server IP CIDR blocks only.</li>
                        <li><strong>VPC Peering/Transit Gateway:</strong> Endpoints can be shared. A single central resolver endpoint set in a Hub Shared Services VPC can serve multiple Spoke VPCs to optimize costs.</li>
                      </ul>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Resolver Terraform Configuration</h4>
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>resolver_endpoints.tf</span>
                          <button
                            onClick={() => handleCopyCode(r53ResolverConfigCode, 'tf_resolver')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'tf_resolver' ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{r53ResolverConfigCode}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('hybrid')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive Hybrid DNS Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 6: Global GTM Architectures */}
                  {selectedNote === 'gtm_architecture' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Global Traffic Management (GTM) Architectures</h3>
                        <span className="acad-hero-badge">Pro Architect</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        High-availability enterprise systems leverage split-view DNS hosted zones, active-active regional load balancers, and global databases to ensure continuous system availability and low-latency responses.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>🧠 Splitting DNS Hosted Zones:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'square' }}>
                          <li><strong>Public Hosted Zone:</strong> Directs external customers via Geo-routing or Latency-routing rules to public endpoints (ALBs, CloudFront distributions).</li>
                          <li><strong>Private Hosted Zone:</strong> Resolves database replicas, internal microservices (e.g. <code>db.internal</code>) safely inside VPC borders away from the public web scope.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>GTM Design Checklists</h4>
                      <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Target Health Evaluation:</strong> Always enable <code>evaluate_target_health = true</code> on ALIAS records. Route 53 will bypass DNS cache timeouts and stop routing queries to unhealthy ALBs instantly.</li>
                        <li><strong>Split-Brain Protection:</strong> Use Route 53 health checking rather than local cluster scripting for multi-region active-passive failover decisions to prevent dual-master database promotion issues.</li>
                        <li><strong>TTL Optimization:</strong> Keep zone apex alias records set to dynamic TTLs so intermediate client resolver caches refresh and switch target regions as fast as possible.</li>
                      </ol>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Complete Multi-Region DNS Deployment Code</h4>
                      <div style={{ background: 'var(--r53-inner-card-bg)', border: '1px solid var(--r53-inner-card-border)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>global_dns.tf</span>
                          <button
                            onClick={() => handleCopyCode(terraformRoute53RecordCode, 'tf_global')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'tf_global' ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{terraformRoute53RecordCode}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="r53-btn r53-on"
                          onClick={() => setActiveSection('arch')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Interactive Architecture Visualizer Tab
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })()}

        {/* DNS WORKS PANEL */}
        {activeSection === 'dns' && (
          <div>
            <div className="r53-sec">How DNS Resolution Works — Step-by-Step Flow</div>
            <div className="r53-card">
              <svg width="100%" viewBox="0 0 680 300" className="r53-svg-bg">
                <defs>
                  <linearGradient id="client-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-grad-start)" />
                    <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                  </linearGradient>
                  <linearGradient id="resolver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--orange-grad-start)" />
                    <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                  </linearGradient>
                  <linearGradient id="root-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--red-grad-start)" />
                    <stop offset="100%" stopColor="var(--red-grad-stop)" />
                  </linearGradient>
                  <linearGradient id="tld-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-grad-start)" />
                    <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                  </linearGradient>
                  <linearGradient id="r53-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--purple-grad-start)" />
                    <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                  </linearGradient>
                  <linearGradient id="server-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--r53-subnet-app-bg)" />
                    <stop offset="100%" stopColor="var(--r53-subnet-app-stroke)" />
                  </linearGradient>
                  <filter id="shadow-r53" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.06" />
                  </filter>
                  <marker id="r53-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-amber)" />
                  </marker>
                  <marker id="r53-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-blue)" />
                  </marker>
                  <marker id="r53-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-purple)" />
                  </marker>
                  <marker id="r53-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-red)" />
                  </marker>
                  <marker id="r53-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-green)" />
                  </marker>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* ==================== 1. USER LOCAL CLIENT SUBNET ==================== */}
                <rect x="6" y="32" width="138" height="262" rx="10" fill="var(--r53-subnet-client-bg)" stroke="var(--r53-subnet-client-stroke)" strokeWidth="1.5" strokeDasharray="4,3" />
                <g transform="translate(6, 6)">
                  <rect width="138" height="20" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-subnet-client-stroke)" strokeWidth="1.2" />
                  <text x="69" y="13" textAnchor="middle" fill="var(--r53-subnet-client-text)" fontSize="7.5" fontWeight="bold" letterSpacing="0.05em">💻 LOCAL CLIENT ZONE</text>
                </g>

                {/* ==================== 2. PUBLIC RESOLVER SUBNET NETWORK ==================== */}
                <rect x="150" y="32" width="140" height="262" rx="10" fill="var(--r53-subnet-resolver-bg)" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1.5" strokeDasharray="4,3" />
                <g transform="translate(150, 6)">
                  <rect width="140" height="20" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1.2" />
                  <text x="70" y="13" textAnchor="middle" fill="var(--r53-subnet-resolver-text)" fontSize="7.5" fontWeight="bold" letterSpacing="0.05em">🔄 PUBLIC RESOLVER ZONE</text>
                </g>

                {/* ==================== 3. AUTHORITATIVE DNS PLANE LAYER ==================== */}
                <rect x="310" y="32" width="190" height="262" rx="10" fill="var(--r53-subnet-auth-bg)" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="1.5" strokeDasharray="4,3" />
                <g transform="translate(310, 6)">
                  <rect width="190" height="20" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="1.2" />
                  <text x="95" y="13" textAnchor="middle" fill="var(--r53-subnet-auth-text)" fontSize="7.5" fontWeight="bold" letterSpacing="0.05em">🌐 AUTHORITATIVE DNS PLANE</text>
                </g>

                {/* ==================== 4. APPLICATION ENDPOINT SUBNET ==================== */}
                <rect x="526" y="32" width="148" height="262" rx="10" fill="var(--r53-subnet-app-bg)" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1.5" strokeDasharray="4,3" />
                <g transform="translate(526, 6)">
                  <rect width="148" height="20" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1.2" />
                  <text x="74" y="13" textAnchor="middle" fill="var(--r53-subnet-app-text)" fontSize="7.5" fontWeight="bold" letterSpacing="0.05em">🖥️ TARGET ENDPOINT ZONE</text>
                </g>

                {/* BACKGROUND PIPELINES & ACTIVE GLOWING CONDUITS */}
                {/* Browser to Cache */}
                <path d="M 60 156 L 75 72" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2,2" />
                {dnsStepIndex === 1 && !isCacheHit && (
                  <path d="M 60 156 L 75 72" fill="none" className="r53-flow-orange" strokeWidth="1.8" />
                )}
                {dnsStepIndex === 1 && isCacheHit && (
                  <path d="M 60 156 L 75 72" fill="none" className="r53-flow-green" strokeWidth="2" />
                )}

                {/* Browser to Resolver */}
                <path d="M 120 156 L 160 156" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2,2" />
                {dnsStepIndex === 1 && !isCacheHit && (
                  <path d="M 120 156 L 160 156" fill="none" className="r53-flow-red" strokeWidth="1.8" markerEnd="url(#r53-arrow-red)" />
                )}
                {dnsStepIndex === 5 && (
                  <path d="M 160 156 L 120 156" fill="none" className="r53-flow-green" strokeWidth="1.8" markerEnd="url(#r53-arrow-green)" />
                )}

                {/* Resolver to Root */}
                <path d="M 280 156 Q 305 156 305 64 L 330 64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2,2" />
                {dnsStepIndex === 2 && (
                  <path d="M 280 156 Q 305 156 305 64 L 330 64" fill="none" className="r53-flow-purple" strokeWidth="1.8" markerEnd="url(#r53-arrow-purple)" />
                )}

                {/* Resolver to TLD */}
                <path d="M 280 156 L 330 156" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2,2" />
                {dnsStepIndex === 3 && (
                  <path d="M 280 156 L 330 156" fill="none" className="r53-flow-blue" strokeWidth="1.8" markerEnd="url(#r53-arrow-blue)" />
                )}

                {/* Resolver to Authoritative */}
                <path d="M 280 156 Q 305 156 305 246 L 330 246" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2,2" />
                {dnsStepIndex === 4 && (
                  <path d="M 280 156 Q 305 156 305 246 L 330 246" fill="none" className="r53-flow-purple" strokeWidth="1.8" markerEnd="url(#r53-arrow-purple)" />
                )}

                {/* Client direct to Web Server */}
                <path d="M 65 186 Q 65 286 305 286 Q 610 286 610 186" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                {dnsStepIndex === 6 && (
                  <path
                    d="M 65 186 Q 65 286 305 286 Q 610 286 610 186"
                    fill="none"
                    className={isCacheHit ? "r53-flow-green" : "r53-flow-blue"}
                    strokeWidth="2.5"
                    markerEnd={isCacheHit ? "url(#r53-arrow-green)" : "url(#r53-arrow-blue)"}
                  />
                )}

                {/* 1. LAPTOP BROWSER CLIENT */}
                <g filter="url(#shadow-r53)" transform="translate(15, 122)" className={`r53-node-btn ${(dnsStepIndex === 0 || dnsStepIndex === 1 || dnsStepIndex === 5 || dnsStepIndex === 6) ? "pulse-client" : ""}`}>
                  <polygon points="10,48 90,48 98,54 2,54" fill="var(--color-text-tertiary)" stroke="var(--color-text-secondary)" strokeWidth="0.8" />
                  <rect x="36" y="42" width="24" height="6" fill="var(--color-text-secondary)" rx="1" />
                  <rect width="100" height="42" rx="6" fill="url(#client-grad)" stroke={(dnsStepIndex === 0 || dnsStepIndex === 1 || dnsStepIndex === 5 || dnsStepIndex === 6) ? "var(--primary-grad-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="4" y="4" width="92" height="34" rx="3" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                  
                  {/* Browser Bar */}
                  <rect x="8" y="7" width="84" height="6" rx="2" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stop)" strokeWidth="0.5" />
                  <circle cx="12" cy="10" r="1.2" fill="var(--color-red)" />
                  <circle cx="16" cy="10" r="1.2" fill="var(--color-amber)" />
                  <circle cx="20" cy="10" r="1.2" fill="var(--color-green)" />
                  <rect x="26" y="8.5" width="60" height="3" rx="1" fill="var(--r53-inner-card-bg)" stroke="var(--primary-grad-stop)" strokeWidth="0.3" />
                  <text x="28" y="11" fontSize="4.2" fill="var(--primary-grad-stroke)" fontFamily="monospace" fontWeight="bold">www.example.com</text>
                  
                  {/* Browser page skeleton */}
                  <line x1="10" y1="18" x2="80" y2="18" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                  <line x1="10" y1="24" x2="90" y2="24" stroke="var(--r53-svg-line-stroke)" strokeWidth="0.8" />
                  <line x1="10" y1="29" x2="70" y2="29" stroke="var(--r53-svg-line-stroke)" strokeWidth="0.8" />

                  <text x="50" y="58" textAnchor="middle" fontSize="9" fill="var(--color-text-primary)" fontWeight="800">💻 Client Browser</text>
                </g>

                {/* 2. RECURSIVE RESOLVER (Server Rack) */}
                <g filter="url(#shadow-r53)" transform="translate(160, 122)" className={`r53-node-btn ${(dnsStepIndex >= 1 && dnsStepIndex <= 5 && !isCacheHit) ? "pulse-resolver" : ""}`}>
                  <rect width="120" height="60" rx="6" fill="url(#resolver-grad)" stroke={(dnsStepIndex >= 1 && dnsStepIndex <= 5 && !isCacheHit) ? "var(--orange-grad-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="3" y="3" width="114" height="54" rx="4" fill="var(--r53-inner-card-bg)" opacity="0.8" />
                  {/* Slots */}
                  <line x1="10" y1="12" x2="80" y2="12" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="24" x2="80" y2="24" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="36" x2="80" y2="36" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="48" x2="60" y2="48" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Blinking LEDs */}
                  <circle cx="95" cy="12" r="2.5" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="12" r="2.5" fill="var(--color-amber)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="95" cy="24" r="2.5" fill="var(--color-green)"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.2s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="24" r="2.5" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.1;1" dur="1.0s" repeatCount="indefinite" /></circle>
                  <circle cx="95" cy="36" r="2.5" fill="var(--color-red)"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.4s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="36" r="2.5" fill="var(--color-green)"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="0.5s" repeatCount="indefinite" /></circle>
                  
                  <text x="60" y="-8" textAnchor="middle" fontSize="9.5" fill="var(--r53-subnet-resolver-text)" fontWeight="800">🔄 Recursive Resolver</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="600">(ISP DNS / 8.8.8.8)</text>
                </g>

                {/* 3. ROOT NAMESERVER (Red Chassis Server) */}
                <g filter="url(#shadow-r53)" transform="translate(345, 38)" className={`r53-node-btn ${dnsStepIndex === 2 ? "pulse-root" : ""}`}>
                  <rect width="120" height="52" rx="6" fill="url(#root-grad)" stroke={dnsStepIndex === 2 ? "var(--red-grad-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="3" y="3" width="114" height="46" rx="4" fill="var(--r53-inner-card-bg)" opacity="0.8" />
                  {/* Slots / Vents */}
                  <line x1="10" y1="12" x2="80" y2="12" stroke="var(--red-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="24" x2="80" y2="24" stroke="var(--red-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="36" x2="60" y2="36" stroke="var(--red-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Blinking LEDs */}
                  <circle cx="95" cy="12" r="2" fill="var(--color-red)"><animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="12" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.7s" repeatCount="indefinite" /></circle>
                  <circle cx="95" cy="24" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.1;1" dur="1.1s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="24" r="2" fill="var(--color-amber)"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.9s" repeatCount="indefinite" /></circle>

                  <text x="60" y="-4" textAnchor="middle" fontSize="9.5" fill="var(--red-grad-text)" fontWeight="800">🌍 Root Nameserver</text>
                </g>

                {/* 4. TLD NAMESERVER (Blue Chassis Server) */}
                <g filter="url(#shadow-r53)" transform="translate(345, 126)" className={`r53-node-btn ${dnsStepIndex === 3 ? "pulse-tld" : ""}`}>
                  <rect width="120" height="52" rx="6" fill="url(#tld-grad)" stroke={dnsStepIndex === 3 ? "var(--primary-grad-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="3" y="3" width="114" height="46" rx="4" fill="var(--r53-inner-card-bg)" opacity="0.8" />
                  {/* Slots / Vents */}
                  <line x1="10" y1="12" x2="80" y2="12" stroke="var(--primary-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="24" x2="80" y2="24" stroke="var(--primary-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="36" x2="60" y2="36" stroke="var(--primary-grad-stroke)" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Blinking LEDs */}
                  <circle cx="95" cy="12" r="2" fill="var(--color-blue)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="12" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                  <circle cx="95" cy="24" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.3s" repeatCount="indefinite" /></circle>
                  <circle cx="107" cy="24" r="2" fill="var(--color-red)"><animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.0s" repeatCount="indefinite" /></circle>

                  <text x="60" y="-4" textAnchor="middle" fontSize="9.5" fill="var(--primary-grad-text)" fontWeight="800">🏷️ TLD (.com / .net)</text>
                </g>

                {/* 5. AUTHORITATIVE NAMESERVER (AWS Route 53 Golden Orbit Node) */}
                <g filter="url(#shadow-r53)" transform="translate(345, 214)" className={`r53-node-btn ${dnsStepIndex === 4 ? "pulse-auth" : ""}`}>
                  <rect width="120" height="56" rx="6" fill="url(#r53-grad)" stroke={dnsStepIndex === 4 ? "var(--purple-grad-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="3" y="3" width="114" height="50" rx="4" fill="var(--r53-inner-card-bg)" opacity="0.8" />
                  
                  {/* Golden Rotating Orbit Circle */}
                  <circle cx="28" cy="28" r="14" fill="var(--color-amber)" opacity="0.1" />
                  <circle cx="28" cy="28" r="11" fill="none" stroke="var(--color-amber)" strokeWidth="1.2" strokeDasharray="3,2">
                    <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="4s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Slots */}
                  <line x1="50" y1="18" x2="110" y2="18" stroke="var(--purple-grad-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="50" y1="28" x2="110" y2="28" stroke="var(--purple-grad-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="50" y1="38" x2="100" y2="38" stroke="var(--purple-grad-stroke)" strokeWidth="2" strokeLinecap="round" />

                  {/* Blinking Dots */}
                  <circle cx="106" cy="18" r="1.5" fill="var(--color-purple)"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.4s" repeatCount="indefinite" /></circle>
                  <circle cx="106" cy="28" r="1.5" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.1;1" dur="0.6s" repeatCount="indefinite" /></circle>
                  <circle cx="106" cy="38" r="1.5" fill="var(--color-amber)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite" /></circle>

                  <text x="60" y="-4" textAnchor="middle" fontSize="9.5" fill="var(--purple-grad-text)" fontWeight="800">📍 Authoritative (Route 53)</text>
                </g>

                {/* 6. WEB SERVER TARGET */}
                <g filter="url(#shadow-r53)" transform="translate(540, 122)" className={`r53-node-btn ${dnsStepIndex === 6 ? "pulse-app" : ""}`}>
                  <rect width="120" height="60" rx="6" fill="url(#server-grad)" stroke={dnsStepIndex === 6 ? "var(--r53-subnet-app-stroke)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                  <rect x="3" y="3" width="114" height="54" rx="4" fill="var(--r53-inner-card-bg)" opacity="0.8" />
                  {/* Disk drive shapes */}
                  <rect x="10" y="10" width="40" height="10" rx="2" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                  <circle cx="16" cy="15" r="1.8" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.2;1" dur="0.3s" repeatCount="indefinite" /></circle>
                  <line x1="26" y1="15" x2="44" y2="15" stroke="var(--color-text-secondary)" strokeWidth="1" />

                  <rect x="10" y="24" width="40" height="10" rx="2" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                  <circle cx="16" cy="29" r="1.8" fill="var(--color-green)"><animate attributeName="opacity" values="0.1;1;0.1" dur="0.6s" repeatCount="indefinite" /></circle>
                  <line x1="26" y1="29" x2="44" y2="29" stroke="var(--color-text-secondary)" strokeWidth="1" />

                  <rect x="10" y="38" width="40" height="10" rx="2" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                  <circle cx="16" cy="43" r="1.8" fill="var(--color-red)"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.9s" repeatCount="indefinite" /></circle>
                  <line x1="26" y1="43" x2="44" y2="43" stroke="var(--color-text-secondary)" strokeWidth="1" />

                  {/* Server Grille slots */}
                  <line x1="60" y1="14" x2="105" y2="14" stroke="var(--r53-subnet-app-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="60" y1="26" x2="105" y2="26" stroke="var(--r53-subnet-app-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="60" y1="38" x2="95" y2="38" stroke="var(--r53-subnet-app-stroke)" strokeWidth="2" strokeLinecap="round" />

                  <text x="60" y="-8" textAnchor="middle" fontSize="9.5" fill="var(--r53-subnet-app-text)" fontWeight="800">🖥️ Web Host Server</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="600">IP: 1.2.3.4 (Host)</text>
                </g>

                {/* 7. PRIVATE CACHE CABINET */}
                <g opacity="0.95" transform="translate(10, 38)">
                  <rect
                    width="130"
                    height="66"
                    rx="8"
                    fill="var(--r53-inner-card-bg)"
                    stroke={cacheBoxStroke}
                    strokeWidth={cacheBoxStrokeWidth}
                    className={cacheBoxClass}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text x="65" y="16" textAnchor="middle" fontSize="9" fill={hasCacheItems ? "var(--color-green)" : "var(--color-text-secondary)"} fontWeight="bold">📦 Local DNS Caches</text>
                  {/* Small folders */}
                  <rect
                    x="10"
                    y="24"
                    width="32"
                    height="14"
                    rx="3"
                    fill="var(--r53-inner-card-bg)"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "var(--color-green)" : "var(--color-red)") : (hasCacheItems ? "var(--color-green)" : "var(--r53-svg-line-stroke)")}
                    strokeWidth="1"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.9 : 0.5)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="26" y="33" textAnchor="middle" fontSize="6" fill="var(--color-text-secondary)" fontWeight="bold">Browser</text>

                  <rect
                    x="48"
                    y="24"
                    width="32"
                    height="14"
                    rx="3"
                    fill="var(--r53-inner-card-bg)"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "var(--color-green)" : "var(--color-red)") : (hasCacheItems ? "var(--color-green)" : "var(--r53-svg-line-stroke)")}
                    strokeWidth="1"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.9 : 0.5)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="64" y="33" textAnchor="middle" fontSize="6" fill="var(--color-text-secondary)" fontWeight="bold">OS Cache</text>

                  <rect
                    x="86"
                    y="24"
                    width="34"
                    height="14"
                    rx="3"
                    fill="var(--r53-inner-card-bg)"
                    stroke={dnsStepIndex === 1 ? (isCacheHit ? "var(--color-green)" : "var(--color-red)") : (hasCacheItems ? "var(--color-green)" : "var(--r53-svg-line-stroke)")}
                    strokeWidth="1"
                    strokeOpacity={dnsStepIndex === 1 ? 1 : (hasCacheItems ? 0.9 : 0.5)}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="103" y="33" textAnchor="middle" fontSize="6" fill="var(--color-text-secondary)" fontWeight="bold">Gateway</text>

                  <text
                    x="65"
                    y="54"
                    textAnchor="middle"
                    fontSize="7.5"
                    fill={dnsStepIndex === 1 ? (isCacheHit ? "var(--color-green)" : "var(--color-red)") : (hasCacheItems ? "var(--color-green)" : "var(--color-text-tertiary)")}
                    fontStyle="italic"
                    fontWeight="bold"
                    style={{ transition: 'all 0.3s' }}
                  >
                    {dnsStepIndex === 1
                      ? (isCacheHit ? "⚡ CACHE HIT!" : "❌ CACHE MISS!")
                      : (hasCacheItems ? "🟢 Active Cache Records" : "Local lookup bypasses WAN")}
                  </text>
                </g>

                {/* ANIMATED PACKETS */}
                {dnsStepIndex === 1 && (
                  <>
                    {isCacheHit ? (
                      <>
                        <circle cx="60" cy="156" r="4.5" fill="var(--color-green)" filter="url(#glow)">
                          <animate attributeName="cx" values="60;75" dur="0.8s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="156;72" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="75" cy="72" r="4.5" fill="var(--color-green)" filter="url(#glow)">
                          <animate attributeName="cx" values="75;60" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="72;156" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
                        </circle>
                      </>
                    ) : (
                      <>
                        <circle cx="60" cy="156" r="4.5" fill="var(--color-amber)" filter="url(#glow)">
                          <animate attributeName="cx" values="60;75" dur="0.8s" repeatCount="indefinite" />
                          <animate attributeName="cy" values="156;72" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="145" cy="156" r="5.5" fill="var(--color-red)" filter="url(#glow)">
                          <animate attributeName="cx" values="75;215" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}
                  </>
                )}
                {dnsStepIndex === 2 && (
                  <circle cx="305" cy="85" r="5.5" fill="var(--color-red)" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="156;64;156" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 3 && (
                  <circle cx="275" cy="156" r="5.5" fill="var(--color-blue)" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 4 && (
                  <circle cx="305" cy="175" r="5.5" fill="var(--color-purple)" filter="url(#glow)">
                    <animate attributeName="cx" values="220;330;220" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="156;246;156" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {dnsStepIndex === 5 && (
                  <circle cx="145" cy="156" r="5.5" fill={isCacheHit ? "var(--color-green)" : "var(--color-amber)"} filter="url(#glow)">
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
                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-purple)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '8px', color: 'var(--color-purple)' }}>Key Terms Explained</div>
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
                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '10px' }}>
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
                        borderColor: 'var(--color-red)',
                        color: 'var(--color-red)',
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
                                <span className="r53-badge" style={{ background: 'var(--r53-inner-card-bg)', color: 'var(--r53-subnet-app-text)', padding: '1px 5px', fontSize: '9px', border: '0.5px solid var(--r53-subnet-app-stroke)' }}>
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
                            <div style={{ width: '100%', height: '4px', background: 'var(--r53-inner-card-border)', borderRadius: '999px', overflow: 'hidden' }}>
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
                    background: 'var(--r53-subnet-resolver-bg)',
                    border: '0.5px solid var(--r53-subnet-resolver-stroke)',
                    fontSize: '11.5px',
                    lineHeight: '1.45',
                    color: 'var(--r53-subnet-resolver-text)'
                  }}>
                    <strong style={{ color: 'var(--color-green)', display: 'block', marginBottom: '2px' }}>💡 How Caching Works:</strong>
                    When you query a domain for the first time (Cache Miss), the resolver performs the full recursive lookup and stores it in your local cache for the duration of the Time-To-Live (TTL = 300s). Subsequent queries within this window (Cache Hit) are served instantly from the local cache without any external network request, bypassing Root, TLD, and Route 53 completely!
                  </div>
                </div>

                <div className="r53-sec">DNS Hierarchy Visualized</div>
                <div className="r53-card" style={{ display: 'flex', justifyContent: 'center', padding: '10px 14px' }}>
                  <svg width="100%" viewBox="0 0 320 250" style={{ display: 'block' }}>
                    <defs>
                      <filter id="tree-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="r53-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="root-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="tld-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="apex-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="sub-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* TIER ZONE BOUNDARIES */}
                    {/* Root Zone */}
                    <rect x="4" y="4" width="312" height="42" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="15" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">ROOT ZONE (. - Dot)</text>

                    {/* TLD Zone */}
                    <rect x="4" y="52" width="312" height="58" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-client-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="63" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">TOP-LEVEL DOMAIN TIER (TLDs)</text>

                    {/* Apex Zone */}
                    <rect x="4" y="116" width="312" height="60" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="127" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">SECOND-LEVEL DOMAINS (Apex Zones)</text>

                    {/* Subdomains Zone */}
                    <rect x="4" y="182" width="312" height="64" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="193" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">SUBDOMAINS (Leaf Records)</text>

                    {/* HIERARCHY PATHWAYS (CONDUITS) */}
                    {/* Background Static Paths */}
                    <line x1="160" y1="38" x2="160" y2="64" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
                    <line x1="160" y1="38" x2="260" y2="64" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
                    <line x1="60" y1="90" x2="165" y2="134" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />
                    <line x1="65" y1="162" x2="165" y2="204" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2,2" />

                    {/* Active Purple Resolution Path */}
                    <line x1="160" y1="38" x2="60" y2="64" stroke="#8b5cf6" strokeWidth="2.5" className="r53-flow-purple" filter="url(#tree-glow)" />
                    <line x1="60" y1="90" x2="65" y2="134" stroke="#8b5cf6" strokeWidth="2.5" className="r53-flow-purple" filter="url(#tree-glow)" />
                    <line x1="65" y1="162" x2="65" y2="204" stroke="#8b5cf6" strokeWidth="2.5" className="r53-flow-purple" filter="url(#tree-glow)" />

                    {/* NODE CARDS */}
                    {/* Root Card */}
                    <g transform="translate(120, 12)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="80" height="26" rx="6" fill="url(#root-card-grad)" stroke="var(--color-red)" strokeWidth="1" />
                      <text x="40" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-red)" fontWeight="bold">. (Root)</text>
                    </g>

                    {/* TLD Cards */}
                    <g transform="translate(20, 64)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="80" height="26" rx="6" fill="url(#tld-card-grad)" stroke="var(--color-blue)" strokeWidth="1" />
                      <text x="40" y="16" textAnchor="middle" fontSize="10" fill="var(--color-blue)" fontWeight="bold">.com TLD</text>
                    </g>
                    <g transform="translate(120, 64)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="80" height="26" rx="6" fill="url(#tld-card-grad)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                      <text x="40" y="16" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">.org TLD</text>
                    </g>
                    <g transform="translate(220, 64)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="80" height="26" rx="6" fill="url(#tld-card-grad)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                      <text x="40" y="16" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">.io TLD</text>
                    </g>

                    {/* Apex Cards */}
                    <g transform="translate(20, 134)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="90" height="28" rx="6" fill="url(#apex-card-grad)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="45" y="17" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">example.com</text>
                    </g>
                    <g transform="translate(130, 134)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="90" height="28" rx="6" fill="url(#apex-card-grad)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                      <text x="45" y="17" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)" fontWeight="bold">google.com</text>
                    </g>

                    {/* Subdomain Cards */}
                    <g transform="translate(20, 202)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="90" height="34" rx="6" fill="url(#sub-card-grad)" stroke="var(--color-amber)" strokeWidth="1.25" />
                      <text x="45" y="15" textAnchor="middle" fontSize="9" fill="var(--color-amber)" fontWeight="bold">www.</text>
                      <text x="45" y="27" textAnchor="middle" fontSize="8" fill="var(--color-amber)">example.com</text>
                    </g>
                    <g transform="translate(130, 202)" filter="url(#r53-shadow)">
                      <rect x="0" y="0" width="90" height="34" rx="6" fill="url(#sub-card-grad)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                      <text x="45" y="15" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="bold">api.</text>
                      <text x="45" y="27" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">example.com</text>
                    </g>
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
                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-purple)', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--color-purple)' }}>🚀 Three Core Services in One</div>
                  <div className="r53-kv"><span className="r53-kk">1. Domain Registrar</span><b>Buy, renew, and manage domain registrations</b></div>
                  <div className="r53-kv"><span className="r53-kk">2. DNS Hosting</span><b>Authoritative DNS servers answering global queries</b></div>
                  <div className="r53-kv"><span className="r53-kk">3. Health Checker</span><b>Probe target health and route around network failures</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--color-green)' }}>Why is it named "Route 53"?</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Standard DNS service operates on <b>Port 53</b> (for both UDP and TCP queries). Route 53 routes internet traffic to hosts via Port 53. It is also an references play on the historical US Highway <b>Route 66</b>.
                  </div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-blue)', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--color-blue)' }}>Key DNS Metrics &amp; Parameters</div>
                  <div className="r53-kv"><span className="r53-kk">SLA Guarantee</span><b style={{ color: 'var(--color-green)' }}>100% Availability SLA (Unique in AWS)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Edge Locations</span><b>400+ DNS routing edge POPs globally</b></div>
                  <div className="r53-kv"><span className="r53-kk">DNSSEC Support</span><b>✅ Enabled (DNS Cryptographic Security)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Cost Parameters</span><b>$0.50 per hosted zone/mo + $0.40 per M queries</b></div>
                  <div className="r53-kv"><span className="r53-kk">IPv4 &amp; IPv6</span><b>Full dual-stack resolution (A &amp; AAAA records)</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-amber)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--color-amber)' }}>Route 53 vs Standard Registrars</div>
                  <div className="r53-kv"><span className="r53-kk">vs GoDaddy / Domain.com</span><b>AWS provides smart failover &amp; active health probes</b></div>
                  <div className="r53-kv"><span className="r53-kk">vs Cloudflare DNS</span><b>Route 53 integrates natively with AWS endpoints (ALB, Alias)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Route 53 exclusive</span><b>ALIAS apex records, Calculated checks, Private Hosted Zones</b></div>
                </div>
              </div>

              <div>
                <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Route 53 Operational Architecture</div>
                  <svg width="100%" viewBox="0 0 340 420" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-op" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="resolver-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="alb-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="cf-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="host-grad-op" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-bg)" />
                      </linearGradient>
                      <filter id="glow-op" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* BOUNDARIES / SUBNET TIERS */}
                    {/* User Ingress Zone */}
                    <rect x="4" y="4" width="332" height="66" rx="8" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">CLIENT USER INGRESS ZONE</text>

                    {/* Recursive ISP Subnet */}
                    <rect x="4" y="78" width="332" height="66" rx="8" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="88" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">RECURSIVE ISP RESOLUTION SUBNET</text>

                    {/* Route 53 Global Anycast Edge */}
                    <rect x="4" y="152" width="332" height="92" rx="8" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                    <text x="12" y="162" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 GLOBAL ANYCAST EDGE ZONE</text>

                    {/* AWS Target Infrastructure Private VPC */}
                    <rect x="4" y="252" width="332" height="162" rx="8" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                    <text x="12" y="262" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">AWS INFRASTRUCTURE PLANE (PRIVATE VPC)</text>

                    {/* FLOWING CONDUITS */}
                    <line x1="170" y1="70" x2="170" y2="78" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-op)" />
                    <line x1="170" y1="144" x2="170" y2="152" stroke="var(--color-amber)" strokeWidth="2" className="r53-flow-orange" filter="url(#glow-op)" />

                    <line x1="110" y1="244" x2="84" y2="268" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-op)" />
                    <line x1="230" y1="244" x2="256" y2="268" stroke="var(--color-green)" strokeWidth="2" className="r53-flow-green" filter="url(#glow-op)" />

                    <line x1="84" y1="320" x2="55" y2="338" stroke="var(--color-blue)" strokeWidth="1.5" className="r53-flow-blue" />
                    <line x1="84" y1="320" x2="160" y2="338" stroke="var(--color-blue)" strokeWidth="1.5" className="r53-flow-blue" />
                    <line x1="256" y1="320" x2="275" y2="338" stroke="var(--color-green)" strokeWidth="1.5" className="r53-flow-green" />

                    {/* INTERACTIVE CARDS */}
                    {/* User requests */}
                    <g transform="translate(10, 18)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="320" height="46" rx="8" fill="url(#user-grad-op)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="160" y="20" textAnchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="700">🌐 User requests domain.com</text>
                      <text x="160" y="35" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)">Browser / App / Client device</text>
                    </g>

                    {/* DNS Resolver */}
                    <g transform="translate(10, 92)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="320" height="46" rx="8" fill="url(#resolver-grad-op)" stroke="var(--color-amber)" strokeWidth="1" />
                      <text x="160" y="20" textAnchor="middle" fontSize="12" fill="var(--color-amber)" fontWeight="700">🔄 DNS Resolver (8.8.8.8 / ISP)</text>
                      <text x="160" y="34" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)">Performs recursive checks → queries Route 53</text>
                    </g>

                    {/* Route 53 DNS */}
                    <g transform="translate(10, 166)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="320" height="70" rx="8" fill="url(#r53-grad-op)" stroke="var(--color-purple)" strokeWidth="1.5" />
                      <text x="160" y="20" textAnchor="middle" fontSize="13" fill="var(--color-purple)" fontWeight="700">🚀 Route 53 DNS Edge Plane</text>
                      
                      <g transform="translate(12, 32)">
                        <rect x="0" y="0" width="90" height="26" rx="5" fill="var(--r53-inner-card-bg)" fillOpacity="0.8" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                        <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-purple)" fontWeight="bold">Hosted Zone</text>
                      </g>
                      <g transform="translate(115, 32)">
                        <rect x="0" y="0" width="90" height="26" rx="5" fill="var(--r53-inner-card-bg)" fillOpacity="0.8" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                        <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-purple)" fontWeight="bold">Routing Rules</text>
                      </g>
                      <g transform="translate(218, 32)">
                        <rect x="0" y="0" width="90" height="26" rx="5" fill="var(--r53-inner-card-bg)" fillOpacity="0.8" stroke="var(--r53-inner-card-border)" strokeWidth="0.5" />
                        <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-purple)" fontWeight="bold">Health Status</text>
                      </g>
                    </g>

                    {/* ALB / CF targets */}
                    <g transform="translate(10, 268)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="148" height="46" rx="8" fill="url(#alb-grad-op)" stroke="var(--color-blue)" strokeWidth="1.25" />
                      <text x="74" y="20" textAnchor="middle" fontSize="11" fill="var(--color-blue)" fontWeight="700">⚖️ ALB / NLB</text>
                      <text x="74" y="34" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)">Elastic Load Balancer</text>
                    </g>
                    
                    <g transform="translate(182, 268)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="148" height="46" rx="8" fill="url(#cf-grad-op)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="74" y="20" textAnchor="middle" fontSize="11.5" fill="var(--color-green)" fontWeight="700">☁️ CloudFront</text>
                      <text x="74" y="34" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)">Global CDN Distribution</text>
                    </g>

                    {/* Backends */}
                    <g transform="translate(10, 338)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="90" height="46" rx="8" fill="url(#host-grad-op)" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" />
                      <text x="45" y="20" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="700">EC2</text>
                      <text x="45" y="34" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">VM Instances</text>
                    </g>
                    
                    <g transform="translate(115, 338)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="90" height="46" rx="8" fill="url(#host-grad-op)" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" />
                      <text x="45" y="20" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="700">ECS/EKS</text>
                      <text x="45" y="34" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">Containers</text>
                    </g>
                    
                    <g transform="translate(220, 338)" filter="url(#r53-shadow-op)">
                      <rect x="0" y="0" width="110" height="46" rx="8" fill="url(#host-grad-op)" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" />
                      <text x="55" y="20" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="700">S3 / Lambda</text>
                      <text x="55" y="34" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">Serverless Hosting</text>
                    </g>
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
              <div className="r53-card" style={{ border: '1.5px solid var(--color-purple)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--color-purple)' }}>🌐 Public Hosted Zone</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  Registers a zone accessible over the public internet. Translates requests from external users to public AWS resource endpoints or external IPs.
                </div>
                <div className="r53-kv"><span className="r53-kk">Scope</span><b>Public Internet</b></div>
                <div className="r53-kv"><span className="r53-kk">Use Case</span><b>www.my-app.com → Public ALB</b></div>
                <div className="r53-kv"><span className="r53-kk">Name Servers</span><b>4 Authoritative Route 53 Nameservers</b></div>
                <div className="r53-kv"><span className="r53-kk">Cost Parameters</span><b>$0.50 per month / zone</b></div>
              </div>

              <div className="r53-card" style={{ border: '1.5px solid var(--color-blue)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--color-blue)' }}>🔒 Private Hosted Zone</div>
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
                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-red)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: 'var(--color-red)' }}>CNAME (Standard DNS Specification)</div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Points To</span><b>Another DNS Hostname</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Zone Apex Apex?</span><b style={{ color: 'var(--color-red)' }}>❌ Prohibited at root level (example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Resolution</span><b>Requires two separate DNS query lookups</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Query Charges</span><b>Billed standard query rates</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: 'var(--color-green)' }}>ALIAS (Route 53 Specific Extension)</div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Points To</span><b>Selected AWS Target (ALB, CloudFront, S3 Website)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Zone Apex Apex?</span><b style={{ color: 'var(--color-green)' }}>✅ Allowed at root level (example.com)</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Resolution</span><b>Resolved internally by Route 53 in 1 lookup cycle</b></div>
                  <div className="r53-kv"><span className="r53-kk" style={{ minWidth: '110px' }}>Query Charges</span><b style={{ color: 'var(--color-green)' }}>🆓 Fully free for standard AWS Resource targets</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-amber)' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-amber)', marginBottom: '4px' }}>⚠️ DNS Limitation: ALIAS Target Bounds</div>
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
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-simple" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-grad-simple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-simple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="target-grad-simple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Global User Zone */}
                    <rect x="4" y="4" width="312" height="64" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">GLOBAL USER INGRESS ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="74" width="312" height="66" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="84" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Infrastructure Target Plane */}
                    <rect x="4" y="146" width="312" height="70" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="156" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">AWS INFRASTRUCTURE PLANE</text>

                    {/* Flow pipelines */}
                    <line x1="160" y1="58" x2="160" y2="82" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-simple)" />
                    <line x1="140" y1="126" x2="90" y2="158" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-simple)" />
                    <line x1="180" y1="126" x2="230" y2="158" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-simple)" />

                    {/* Cards */}
                    <g transform="translate(110, 18)" filter="url(#r53-shadow-simple)">
                      <rect x="0" y="0" width="100" height="34" rx="6" fill="url(#user-grad-simple)" stroke="var(--color-purple)" strokeWidth="1" />
                      <text x="50" y="15" textAnchor="middle" fontSize="12">💻</text>
                      <text x="50" y="27" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Global User</text>
                    </g>

                    <g transform="translate(90, 86)" filter="url(#r53-shadow-simple)">
                      <rect x="0" y="0" width="140" height="40" rx="6" fill="url(#r53-grad-simple)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="18" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53</text>
                      <text x="70" y="32" textAnchor="middle" fontSize="8.5" fill="var(--color-purple)" fontWeight="bold">Simple Routing</text>
                    </g>

                    <g transform="translate(30, 162)" filter="url(#r53-shadow-simple)">
                      <rect x="0" y="0" width="110" height="38" rx="6" fill="url(#target-grad-simple)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="55" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="700">Web Instance A</text>
                      <text x="55" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="bold">IP: 1.2.3.4 (Static)</text>
                    </g>
                    
                    <g transform="translate(180, 162)" filter="url(#r53-shadow-simple)">
                      <rect x="0" y="0" width="110" height="38" rx="6" fill="url(#target-grad-simple)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="55" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="700">Web Instance B</text>
                      <text x="55" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="bold">IP: 1.2.3.5 (Static)</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'weighted' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-weighted" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-grad-weighted" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-weighted" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="target-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="target-grad-b" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Global User Zone */}
                    <rect x="4" y="4" width="312" height="60" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">GLOBAL USER INGRESS ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="68" width="312" height="64" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="78" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Target Infrastructure Plane with Regional Subnets */}
                    <rect x="4" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="147" fontSize="7" fill="var(--color-amber)" fontWeight="bold">US-EAST-1 REGIONAL SUBNET</text>

                    <rect x="166" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="174" y="147" fontSize="7" fill="var(--color-blue)" fontWeight="bold">EU-WEST-1 REGIONAL SUBNET</text>

                    {/* Flow pipelines */}
                    <line x1="160" y1="52" x2="160" y2="76" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-weighted)" />
                    <line x1="120" y1="120" x2="70" y2="152" stroke="var(--color-amber)" strokeWidth="3" className="r53-flow-orange" filter="url(#glow-weighted)" />
                    <line x1="200" y1="120" x2="240" y2="152" stroke="var(--color-blue)" strokeWidth="1.5" className="r53-flow-blue" />

                    {/* Cards */}
                    <g transform="translate(120, 12)" filter="url(#r53-shadow-weighted)">
                      <circle cx="40" cy="18" r="14" fill="url(#user-grad-weighted)" stroke="var(--r53-inner-card-border)" />
                      <text x="40" y="22" textAnchor="middle" fontSize="12">💻</text>
                    </g>

                    <g transform="translate(90, 80)" filter="url(#r53-shadow-weighted)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-weighted)" stroke="var(--color-purple)" strokeWidth="1.25" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (Weighted)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-purple)" fontWeight="bold">Split Ratio Load Balancing</text>
                    </g>

                    <g transform="translate(14, 156)" filter="url(#r53-shadow-weighted)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#target-grad-a)" stroke="var(--color-amber)" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-amber)" fontWeight="bold">Region A (70% Weight)</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">us-east-1 Primary ALB</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">⚡ High-Flow Target</text>
                    </g>
 
                    <g transform="translate(176, 156)" filter="url(#r53-shadow-weighted)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#target-grad-b)" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-blue)" fontWeight="bold">Region B (30% Weight)</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">eu-west-1 Standby ALB</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">💧 Low-Flow Target</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'latency' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-latency" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-us-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="user-apac-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-latency" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="latency-us" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="latency-apac" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* US User Zone */}
                    <rect x="4" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7" fill="var(--color-red)" fontWeight="bold">US CLIENT ZONE</text>

                    {/* APAC User Zone */}
                    <rect x="166" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="174" y="14" fontSize="7" fill="var(--color-green)" fontWeight="bold">APAC CLIENT ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="70" width="312" height="62" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="80" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Target infrastructure regional subnets */}
                    <rect x="4" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="147" fontSize="7" fill="var(--color-amber)" fontWeight="bold">US-EAST-1 REGIONAL SUBNET</text>

                    <rect x="166" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="174" y="147" fontSize="7" fill="var(--color-green)" fontWeight="bold">AP-SOUTH-1 REGIONAL SUBNET</text>

                    {/* Flow pipelines */}
                    <line x1="70" y1="50" x2="120" y2="80" stroke="var(--color-red)" strokeWidth="2" className="r53-flow-red" filter="url(#glow-latency)" />
                    <line x1="250" y1="50" x2="205" y2="80" stroke="var(--color-green)" strokeWidth="2" className="r53-flow-green" filter="url(#glow-latency)" />
                    <line x1="120" y1="116" x2="70" y2="150" stroke="var(--color-amber)" strokeWidth="2" className="r53-flow-orange" filter="url(#glow-latency)" />
                    <line x1="200" y1="116" x2="240" y2="150" stroke="var(--color-green)" strokeWidth="2" className="r53-flow-green" filter="url(#glow-latency)" />

                    {/* Cards */}
                    <g transform="translate(50, 16)" filter="url(#r53-shadow-latency)">
                      <circle cx="15" cy="15" r="13" fill="url(#user-us-grad)" stroke="var(--color-red)" />
                      <text x="15" y="19" textAnchor="middle" fontSize="11">🇺🇸</text>
                    </g>
                    <g transform="translate(230, 16)" filter="url(#r53-shadow-latency)">
                      <circle cx="15" cy="15" r="13" fill="url(#user-apac-grad)" stroke="var(--color-green)" />
                      <text x="15" y="19" textAnchor="middle" fontSize="11">🇮🇳</text>
                    </g>

                    <g transform="translate(90, 80)" filter="url(#r53-shadow-latency)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-latency)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (Latency)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Lowest Ping Routing</text>
                    </g>

                    <g transform="translate(14, 156)" filter="url(#r53-shadow-latency)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#latency-us)" stroke="var(--color-amber)" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-amber)" fontWeight="bold">us-east-1 (12ms)</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">Closest to US client</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">⚡ Fast for US (12ms)</text>
                    </g>

                    <g transform="translate(176, 156)" filter="url(#r53-shadow-latency)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#latency-apac)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">ap-south-1 (18ms)</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">Closest to India client</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">⚡ Fast for APAC (18ms)</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'failover' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-failover" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-grad-failover" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-failover" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="failover-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="failover-standby" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Global User Zone */}
                    <rect x="4" y="4" width="312" height="56" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">GLOBAL USER INGRESS ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="66" width="312" height="60" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="76" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Infrastructure Regional Subnets */}
                    <rect x="4" y="132" width="150" height="84" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="143" fontSize="7" fill="var(--color-green)" fontWeight="bold">US-EAST-1 PRIMARY SUBNET</text>

                    <rect x="166" y="132" width="150" height="84" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.45" stroke="var(--r53-subnet-client-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="174" y="143" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">EU-WEST-1 STANDBY SUBNET</text>

                    {/* Flow pipelines */}
                    <line x1="160" y1="46" x2="160" y2="72" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-failover)" />
                    <line x1="120" y1="108" x2="70" y2="148" stroke="var(--color-green)" strokeWidth="2.5" className="r53-flow-green" filter="url(#glow-failover)" />
                    <line x1="200" y1="108" x2="240" y2="148" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="4,4" className="r53-flow-red" />

                    {/* Cards */}
                    <g transform="translate(136, 12)" filter="url(#r53-shadow-failover)">
                      <circle cx="24" cy="15" r="13" fill="url(#user-grad-failover)" stroke="var(--r53-inner-card-border)" />
                      <text x="24" y="19" textAnchor="middle" fontSize="11">💻</text>
                    </g>

                    <g transform="translate(90, 74)" filter="url(#r53-shadow-failover)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-failover)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (Failover)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Active-Passive Routing</text>
                    </g>

                    <g transform="translate(14, 150)" filter="url(#r53-shadow-failover)">
                      <rect x="0" y="0" width="130" height="58" rx="6" fill="url(#failover-primary)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="65" y="14" textAnchor="middle" fontSize="9" fill="var(--color-green)" fontWeight="bold">Primary (us-east-1)</text>
                      <text x="65" y="27" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">🟢 HEALTHY</text>
                      <text x="65" y="40" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">Active traffic node</text>
                      <text x="65" y="50" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">⚡ Routed 100%</text>
                    </g>

                    <g transform="translate(176, 150)" filter="url(#r53-shadow-failover)">
                      <rect x="0" y="0" width="130" height="58" rx="6" fill="url(#failover-standby)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="65" y="14" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="bold">Standby (eu-west-1)</text>
                      <text x="65" y="27" textAnchor="middle" fontSize="9.5" fill="var(--color-red)" fontWeight="bold">💤 PASSIVE STANDBY</text>
                      <text x="65" y="40" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">Bypassed until alarm</text>
                      <text x="65" y="50" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">❌ 0% Traffic</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'geo' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-geo" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-eu-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="user-jp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-geo" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="geo-eu" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="geo-jp" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Europe User Zone */}
                    <rect x="4" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7" fill="var(--color-purple)" fontWeight="bold">EUROPE CLIENT ZONE</text>

                    {/* Japan User Zone */}
                    <rect x="166" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="174" y="14" fontSize="7" fill="var(--color-red)" fontWeight="bold">JAPAN CLIENT ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="70" width="312" height="62" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="80" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Target infrastructure regional subnets */}
                    <rect x="4" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="147" fontSize="7" fill="var(--color-blue)" fontWeight="bold">EU-WEST-1 REGIONAL SUBNET</text>

                    <rect x="166" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="174" y="147" fontSize="7" fill="var(--color-red)" fontWeight="bold">AP-NORTHEAST-1 SUBNET</text>

                    {/* Flow pipelines */}
                    <line x1="80" y1="46" x2="120" y2="80" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-geo)" />
                    <line x1="240" y1="46" x2="200" y2="80" stroke="var(--color-red)" strokeWidth="2" className="r53-flow-red" filter="url(#glow-geo)" />
                    <line x1="120" y1="116" x2="70" y2="150" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-geo)" />
                    <line x1="200" y1="116" x2="240" y2="150" stroke="var(--color-red)" strokeWidth="2" className="r53-flow-red" filter="url(#glow-geo)" />

                    {/* Cards */}
                    <g transform="translate(30, 16)" filter="url(#r53-shadow-geo)">
                      <circle cx="15" cy="15" r="13" fill="url(#user-eu-grad)" stroke="var(--color-purple)" />
                      <text x="15" y="19" textAnchor="middle" fontSize="11">🇪🇺</text>
                    </g>
                    <g transform="translate(250, 16)" filter="url(#r53-shadow-geo)">
                      <circle cx="15" cy="15" r="13" fill="url(#user-jp-grad)" stroke="var(--color-red)" />
                      <text x="15" y="19" textAnchor="middle" fontSize="11">🇯🇵</text>
                    </g>

                    <g transform="translate(90, 80)" filter="url(#r53-shadow-geo)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-geo)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (Geo)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Location-Bound Routing</text>
                    </g>

                    <g transform="translate(14, 156)" filter="url(#r53-shadow-geo)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#geo-eu)" stroke="var(--color-blue)" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-blue)" fontWeight="bold">eu-west-1 ALB</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">Bound: Europe clients</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">⚡ Routed to Ireland</text>
                    </g>

                    <g transform="translate(176, 156)" filter="url(#r53-shadow-geo)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#geo-jp)" stroke="var(--color-red)" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-red)" fontWeight="bold">ap-northeast-1 ALB</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">Bound: Japan clients</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">⚡ Routed to Tokyo</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'geoprox' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-geoprox" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <radialGradient id="radial-red" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--red-grad-stop)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--red-grad-stroke)" stopOpacity="0.1" />
                      </radialGradient>
                      <radialGradient id="radial-blue" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--primary-grad-stop)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-grad-stroke)" stopOpacity="0.1" />
                      </radialGradient>
                    </defs>

                    {/* Zone Boundary */}
                    <rect x="4" y="4" width="312" height="212" rx="8" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">GLOBAL GEOPROXIMITY DISTRIBUTION PLANE</text>

                    {/* Proximity range bias overlays */}
                    <circle cx="90" cy="120" r="50" fill="url(#radial-red)" stroke="var(--color-red)" strokeWidth="1" strokeDasharray="3,2" />
                    <circle cx="215" cy="120" r="75" fill="url(#radial-blue)" stroke="var(--color-blue)" strokeWidth="1.25" />

                    {/* Active nodes */}
                    <g transform="translate(90, 120)" filter="url(#r53-shadow-geoprox)">
                      <circle cx="0" cy="0" r="4.5" fill="var(--color-red)" />
                    </g>
                    <text x="90" y="138" textAnchor="middle" fontSize="9.5" fill="var(--color-red)" fontWeight="bold">US East (No Bias)</text>
                    <text x="90" y="148" textAnchor="middle" fontSize="8" fill="var(--color-red)">Standard Proximity Zone</text>

                    <g transform="translate(215, 120)" filter="url(#r53-shadow-geoprox)">
                      <circle cx="0" cy="0" r="4.5" fill="var(--color-blue)" />
                    </g>
                    <text x="215" y="138" textAnchor="middle" fontSize="9.5" fill="var(--color-blue)" fontWeight="bold">EU West (+30 Bias)</text>
                    <text x="215" y="148" textAnchor="middle" fontSize="8" fill="var(--color-blue)">Expanded Bias Coverage</text>

                    {/* Text labels */}
                    <text x="160" y="38" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="bold">Geographic Proximity Map Bias</text>
                    <text x="160" y="52" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)" fontWeight="600">Proximity bias shifts the routing border westwards</text>
                    
                    {/* Shift border representation */}
                    <path d="M 148 70 L 138 175" stroke="var(--r53-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="2,2" />
                    <text x="135" y="66" fontSize="7" fill="var(--color-text-secondary)" textAnchor="middle">Shifted Border</text>
                  </svg>
                )}

                {activePolicy === 'multivalue' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-multi" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-grad-multi" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-multi" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="multi-healthy" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="multi-failed" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Global User Zone */}
                    <rect x="4" y="4" width="312" height="54" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">GLOBAL USER INGRESS ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="64" width="312" height="58" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="74" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS VPC Target subnet */}
                    <rect x="4" y="128" width="312" height="88" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.35" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="139" fontSize="7" fill="var(--color-blue)" fontWeight="bold">PRIVATE TARGET SUBNET (VPC)</text>

                    {/* Flow pipelines */}
                    <line x1="160" y1="44" x2="160" y2="70" stroke="var(--color-purple)" strokeWidth="2" className="r53-flow-purple" filter="url(#glow-multi)" />
                    <line x1="110" y1="104" x2="62" y2="142" stroke="var(--color-green)" strokeWidth="2" className="r53-flow-green" filter="url(#glow-multi)" />
                    <line x1="160" y1="104" x2="160" y2="142" stroke="var(--color-green)" strokeWidth="2" className="r53-flow-green" filter="url(#glow-multi)" />
                    <line x1="210" y1="104" x2="257" y2="142" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="4,4" className="r53-flow-red" />

                    {/* Cards */}
                    <g transform="translate(136, 12)" filter="url(#r53-shadow-multi)">
                      <circle cx="24" cy="15" r="13" fill="url(#user-grad-multi)" stroke="var(--r53-inner-card-border)" />
                      <text x="24" y="19" textAnchor="middle" fontSize="11">💻</text>
                    </g>

                    <g transform="translate(90, 70)" filter="url(#r53-shadow-multi)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-multi)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (Multi-Value)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Multiple Health-Checked IPs</text>
                    </g>

                    <g transform="translate(16, 146)" filter="url(#r53-shadow-multi)">
                      <rect x="0" y="0" width="90" height="42" rx="6" fill="url(#multi-healthy)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">Host A</text>
                      <text x="45" y="28" textAnchor="middle" fontSize="9" fill="var(--color-green)" fontWeight="bold">10.0.1.10 ✅</text>
                      <text x="45" y="37" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">HEALTHY</text>
                    </g>

                    <g transform="translate(115, 146)" filter="url(#r53-shadow-multi)">
                      <rect x="0" y="0" width="90" height="42" rx="6" fill="url(#multi-healthy)" stroke="var(--color-green)" strokeWidth="1.25" />
                      <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">Host B</text>
                      <text x="45" y="28" textAnchor="middle" fontSize="9" fill="var(--color-green)" fontWeight="bold">10.0.1.20 ✅</text>
                      <text x="45" y="37" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">HEALTHY</text>
                    </g>

                    <g transform="translate(214, 146)" filter="url(#r53-shadow-multi)">
                      <rect x="0" y="0" width="90" height="42" rx="6" fill="url(#multi-failed)" stroke="var(--color-red)" strokeWidth="1" />
                      <text x="45" y="16" textAnchor="middle" fontSize="9.5" fill="var(--color-red)" fontWeight="bold">Host C</text>
                      <text x="45" y="28" textAnchor="middle" fontSize="9" fill="var(--color-red)" fontWeight="bold">10.0.1.30 ❌</text>
                      <text x="45" y="37" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">FAILED</text>
                    </g>
                  </svg>
                )}

                {activePolicy === 'ipbased' && (
                  <svg width="100%" viewBox="0 0 320 220" className="r53-svg-bg" style={{ display: 'block' }}>
                    <defs>
                      <filter id="r53-shadow-ipbased" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="user-corp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="user-pub-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-ipbased" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="ip-corp" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="ip-pub" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                    </defs>

                    {/* Zone Boundaries */}
                    {/* Corp User Zone */}
                    <rect x="4" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="14" fontSize="7" fill="var(--color-blue)" fontWeight="bold">CORPORATE CLIENT ZONE (CIDR A)</text>

                    {/* Public User Zone */}
                    <rect x="166" y="4" width="150" height="60" rx="6" fill="var(--r53-subnet-client-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-client-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="174" y="14" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">PUBLIC DEFAULT CLIENT ZONE</text>

                    {/* Route 53 DNS Plane */}
                    <rect x="4" y="70" width="312" height="62" rx="6" fill="var(--r53-subnet-auth-bg)" fillOpacity="0.4" stroke="var(--r53-subnet-auth-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                    <text x="12" y="80" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">ROUTE 53 DNS RESOLUTION PLANE</text>

                    {/* AWS Target infrastructure regional subnets */}
                    <rect x="4" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-app-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="147" fontSize="7" fill="var(--color-blue)" fontWeight="bold">INTERNAL VPC INFRASTRUCTURE</text>

                    <rect x="166" y="136" width="150" height="80" rx="6" fill="var(--r53-subnet-resolver-bg)" fillOpacity="0.3" stroke="var(--r53-subnet-resolver-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="174" y="147" fontSize="7" fill="var(--color-amber)" fontWeight="bold">PUBLIC INTERNET INFRASTRUCTURE</text>

                    {/* Flow pipelines */}
                    <line x1="80" y1="46" x2="120" y2="80" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-ipbased)" />
                    <line x1="240" y1="46" x2="200" y2="80" stroke="var(--color-amber)" strokeWidth="2" className="r53-flow-orange" filter="url(#glow-ipbased)" />
                    <line x1="120" y1="116" x2="70" y2="150" stroke="var(--color-blue)" strokeWidth="2" className="r53-flow-blue" filter="url(#glow-ipbased)" />
                    <line x1="200" y1="116" x2="240" y2="150" stroke="var(--color-amber)" strokeWidth="2" className="r53-flow-orange" filter="url(#glow-ipbased)" />

                    {/* Cards */}
                    <g transform="translate(14, 16)" filter="url(#r53-shadow-ipbased)">
                      <rect x="0" y="0" width="130" height="34" rx="5" fill="url(#user-corp-grad)" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" />
                      <text x="65" y="14" textAnchor="middle" fontSize="9" fill="var(--color-text-primary)" fontWeight="bold">192.168.1.55 (CIDR A)</text>
                      <text x="65" y="26" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Corp Network Proxy</text>
                    </g>
                    <g transform="translate(176, 16)" filter="url(#r53-shadow-ipbased)">
                      <rect x="0" y="0" width="130" height="34" rx="5" fill="url(#user-pub-grad)" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" />
                      <text x="65" y="14" textAnchor="middle" fontSize="9" fill="var(--color-text-primary)" fontWeight="bold">8.8.8.8 (Default)</text>
                      <text x="65" y="26" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Standard Web client</text>
                    </g>

                    <g transform="translate(90, 80)" filter="url(#r53-shadow-ipbased)">
                      <rect x="0" y="0" width="140" height="38" rx="6" fill="url(#r53-grad-ipbased)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="70" y="16" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="700">🚀 Route 53 (IP-Based)</text>
                      <text x="70" y="28" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Subnet-Specific Resolution</text>
                    </g>

                    <g transform="translate(14, 156)" filter="url(#r53-shadow-ipbased)">
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="600">Direct Internal Proxy ALB</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="#1d4ed8" fontWeight="bold">🔒 Internal Route</text>
                    </g>

                    <g transform="translate(176, 156)" filter="url(#r53-shadow-ipbased)">
                      <rect x="0" y="0" width="130" height="46" rx="6" fill="url(#ip-pub)" stroke="#f97316" strokeWidth="1.25" />
                      <text x="65" y="16" textAnchor="middle" fontSize="9.5" fill="#ea580c" fontWeight="bold">Public Target B</text>
                      <text x="65" y="28" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="600">Standard Web ALB</text>
                      <text x="65" y="38" textAnchor="middle" fontSize="7.5" fill="#ea580c" fontWeight="bold">🌐 Public Route</text>
                    </g>
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
                        IPs Returned: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{simpleResolvedIPs.join(', ')}</span><br />
                        <div style={{ marginTop: '8px', borderTop: '0.5px dashed var(--color-border-secondary)', paddingTop: '6px', color: 'var(--color-text-secondary)' }}>
                          💡 <b>Browser Behavior:</b> Recursive resolver returns both IPs. Your browser selected <span style={{ color: 'var(--color-purple)', fontWeight: 'bold' }}>{simpleSelectedIP}</span> at random for connection.
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
                    <b style={{ color: 'var(--color-red)' }}>{weightA}%</b>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weightA}
                    onChange={(e) => setWeightA(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--color-purple)', cursor: 'ew-resize', marginBottom: '12px' }}
                  />

                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Region B (eu-west-1): <b style={{ color: 'var(--color-blue)' }}>{weightB}%</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                    Region C (ap-south-1): <b style={{ color: 'var(--color-green)' }}>{weightC}%</b>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, borderTop: '0.5px solid var(--color-border-secondary)', paddingTop: '10px' }}>
                    Out of 1000 requests distributed:
                  </div>
                  <div className="r53-g3" style={{ marginTop: '8px' }}>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>us-east-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-red)' }}>{weightA * 10}</div>
                    </div>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>eu-west-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-blue)' }}>{weightB * 10}</div>
                    </div>
                    <div className="r53-met">
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ap-south-1</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-green)' }}>{weightC * 10}</div>
                    </div>
                  </div>
                </div>

                <div className="r53-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '160px' }}>
                  <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                    Active Weighted Data Flow Conduit Map
                  </div>
                  <svg width="100%" height="130" viewBox="0 0 280 120" className="r53-svg-bg">
                    <defs>
                      <filter id="glow-weighted" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Pipelines */}
                    {/* Pipeline A (us-east-1 Red) */}
                    <path d="M 50 60 Q 130 25 210 25" fill="none" stroke="var(--red-grad-stop)" strokeWidth={Math.max(2, weightA / 8)} />
                    <path d="M 50 60 Q 130 25 210 25" fill="none" stroke="var(--red-grad-stroke)" strokeWidth="1" strokeDasharray="4,4" />

                    {/* Pipeline B (eu-west-1 Blue) */}
                    <path d="M 50 60 H 210" fill="none" stroke="var(--primary-grad-stop)" strokeWidth={Math.max(2, weightB / 8)} />
                    <path d="M 50 60 H 210" fill="none" stroke="var(--primary-grad-stroke)" strokeWidth="1" strokeDasharray="4,4" />

                    {/* Pipeline C (ap-south-1 Green) */}
                    <path d="M 50 60 Q 130 95 210 95" fill="none" stroke="var(--replica-grad-stop)" strokeWidth={Math.max(2, weightC / 8)} />
                    <path d="M 50 60 Q 130 95 210 95" fill="none" stroke="var(--replica-grad-stroke)" strokeWidth="1" strokeDasharray="4,4" />

                    {/* Streaming Query Packets along paths (conditionally active if weight > 0) */}
                    {weightA > 0 && (
                      <circle r="3.5" fill="var(--color-red)" filter="url(#glow-weighted)">
                        <animateMotion dur={`${2 - (weightA / 100) * 1.5}s`} repeatCount="indefinite" path="M 50 60 Q 130 25 210 25" />
                      </circle>
                    )}
                    {weightB > 0 && (
                      <circle r="3.5" fill="var(--color-blue)" filter="url(#glow-weighted)">
                        <animateMotion dur={`${2 - (weightB / 100) * 1.5}s`} repeatCount="indefinite" path="M 50 60 H 210" />
                      </circle>
                    )}
                    {weightC > 0 && (
                      <circle r="3.5" fill="var(--color-green)" filter="url(#glow-weighted)">
                        <animateMotion dur={`${2 - (weightC / 100) * 1.5}s`} repeatCount="indefinite" path="M 50 60 Q 130 95 210 95" />
                      </circle>
                    )}

                    {/* Client Node */}
                    <g transform="translate(15, 45)">
                      <rect width="30" height="30" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                      <text x="15" y="19" textAnchor="middle" fontSize="13">💻</text>
                    </g>

                    {/* Server 3D Cylinders */}
                    {/* Server us-east-1 (Red) */}
                    <g transform="translate(210, 10)">
                      <rect width="55" height="30" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--red-grad-stroke)" strokeWidth="1" />
                      <text x="27.5" y="14" textAnchor="middle" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold">us-east-1</text>
                      <text x="27.5" y="24" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="bold">{weightA}%</text>
                    </g>

                    {/* Server eu-west-1 (Blue) */}
                    <g transform="translate(210, 45)">
                      <rect width="55" height="30" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--primary-grad-stroke)" strokeWidth="1" />
                      <text x="27.5" y="14" textAnchor="middle" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold">eu-west-1</text>
                      <text x="27.5" y="24" textAnchor="middle" fontSize="8" fill="var(--color-blue)" fontWeight="bold">{weightB}%</text>
                    </g>

                    {/* Server ap-south-1 (Green) */}
                    <g transform="translate(210, 80)">
                      <rect width="55" height="30" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--replica-grad-stroke)" strokeWidth="1" />
                      <text x="27.5" y="14" textAnchor="middle" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold">ap-south-1</text>
                      <text x="27.5" y="24" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">{weightC}%</text>
                    </g>                   <g transform="translate(210, 80)">
                      <rect width="55" height="30" rx="4" fill="rgba(255, 255, 255, 0.9)" stroke="#10b981" strokeWidth="1" />
                      <text x="27.5" y="14" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="bold">ap-south-1</text>
                      <text x="27.5" y="24" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="bold">{weightC}%</text>
                    </g>
                  </svg>
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
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '5px 8px', borderRadius: '4px', background: res.win ? 'var(--replica-grad-stop)' : 'var(--r53-inner-card-bg)', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '4px' }}>
                            <span style={{ fontWeight: res.win ? 600 : 400, color: res.win ? 'var(--color-green)' : 'var(--color-text-primary)' }}>{res.region}</span>
                            <span style={{ fontWeight: 'bold', color: res.win ? 'var(--color-green)' : 'var(--color-red)' }}>{res.latency} ms {res.win ? '⭐ (Win)' : ''}</span>
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
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: routingPrimHealthy ? 'var(--replica-grad-stop)' : 'var(--red-grad-stop)', border: '0.5px solid', borderColor: routingPrimHealthy ? 'var(--replica-grad-stroke)' : 'var(--red-grad-stroke)', color: routingPrimHealthy ? 'var(--replica-grad-text)' : 'var(--red-grad-text)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {routingPrimHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>Secondary Server (eu-west-1):</span>
                        <button
                          onClick={() => setRoutingSecHealthy(!routingSecHealthy)}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: routingSecHealthy ? 'var(--replica-grad-stop)' : 'var(--red-grad-stop)', border: '0.5px solid', borderColor: routingSecHealthy ? 'var(--replica-grad-stroke)' : 'var(--red-grad-stroke)', color: routingSecHealthy ? 'var(--replica-grad-text)' : 'var(--red-grad-text)', cursor: 'pointer', fontWeight: 600 }}
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
                        Target Resolved: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{geoResolvedTarget}</span><br />
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
                        style={{ width: '100%', accentColor: 'var(--color-purple)' }}
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
                        style={{ width: '100%', accentColor: 'var(--color-purple)' }}
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
                        <span style={{ color: 'var(--color-purple)', fontWeight: 'bold', fontSize: '13px' }}>{geoproxResolvedTarget}</span><br />
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
                          style={{ padding: '6px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', background: multivalueHealthyStates[idx] ? 'var(--replica-grad-start)' : 'var(--red-grad-stop)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: multivalueHealthyStates[idx] ? 'var(--replica-grad-text)' : 'var(--red-grad-text)' }}
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
                        IPs Returned in response: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{multivalueResolvedIPs.join(', ')}</span><br />
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
                        Outcome: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{ipbasedResolvedTarget}</span><br />
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
                <svg width="100%" viewBox="0 0 680 320" className="r53-svg-bg" style={{ display: 'block', margin: '0 auto' }}>
                  <defs>
                    <filter id="r53-shadow-hc" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                    </filter>
                    <linearGradient id="user-grad-hc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                      <stop offset="100%" stopColor="var(--color-border-glass)" />
                    </linearGradient>
                    <linearGradient id="r53-grad-hc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--purple-grad-start)" />
                      <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                    </linearGradient>
                    <linearGradient id="server-grad-hc-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--replica-grad-start)" />
                      <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                    </linearGradient>
                    <linearGradient id="server-grad-hc-err" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--red-grad-start)" />
                      <stop offset="100%" stopColor="var(--red-grad-stop)" />
                    </linearGradient>
                    {/* Glow Filters for Light Background */}
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* PREMIUM BOUNDARY ZONE PARTITIONS */}
                  {/* Client Subnet boundary */}
                  <rect x="2" y="110" width="126" height="100" rx="8" fill="var(--r53-inner-card-bg)" fillOpacity="0.45" stroke="var(--r53-inner-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="10" y="122" fontSize="7.5" fill="var(--color-text-tertiary)" fontWeight="bold">LOCAL CLIENT ZONE</text>

                  {/* Route 53 Core boundary */}
                  <rect x="140" y="95" width="105" height="125" rx="8" fill="var(--purple-grad-start)" fillOpacity="0.45" stroke="var(--purple-grad-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                  <text x="148" y="107" fontSize="7" fill="var(--color-purple)" fontWeight="bold">R53 CORE ENGINE</text>

                  {/* Probers plane boundary */}
                  <rect x="300" y="15" width="175" height="290" rx="8" fill="var(--orange-grad-start)" fillOpacity="0.3" stroke="var(--orange-grad-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                  <text x="308" y="27" fontSize="7" fill="var(--color-amber)" fontWeight="bold">GLOBAL PROBING NETWORK</text>

                  {/* us-east-1 subnet boundary */}
                  <rect x="490" y="15" width="186" height="120" rx="8" fill="var(--replica-grad-start)" fillOpacity="0.4" stroke="var(--replica-grad-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                  <text x="498" y="128" fontSize="7" fill="var(--color-green)" fontWeight="bold">US-EAST-1 (PRIMARY VPC SUBNET)</text>

                  {/* eu-west-1 subnet boundary */}
                  <rect x="490" y="175" width="186" height="120" rx="8" fill="var(--primary-grad-start)" fillOpacity="0.3" stroke="var(--primary-grad-stroke)" strokeWidth="1.25" strokeDasharray="3,3" />
                  <text x="498" y="288" fontSize="7" fill="var(--color-blue)" fontWeight="bold">EU-WEST-1 (SECONDARY VPC SUBNET)</text>

                  {/* 1. BACKGROUND PATHS & STREAMING DATA */}
                  {/* Client to Route 53 */}
                  <line
                    x1="80" y1="160" x2="150" y2="160"
                    stroke={(primHealthy || secHealthy) ? "var(--color-green)" : "var(--r53-svg-line-stroke)"}
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
                    stroke={primHealthy ? "var(--color-green)" : "var(--r53-svg-line-stroke)"}
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
                    stroke={(!primHealthy && secHealthy) ? "var(--color-blue)" : "var(--r53-svg-line-stroke)"}
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
                      <path d="M 230 160 C 280 160, 360 75, 500 75" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity="0.4" />
                      <path d="M 230 160 C 280 160, 360 235, 500 235" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,3" strokeOpacity="0.4" />
                      <circle cx="365" cy="155" r="8" fill="var(--color-red)" opacity="0.8">
                        <animate attributeName="r" values="6;11;6" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <text x="365" y="158" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">⚠️</text>
                    </>
                  )}

                  {/* 2. USER CLIENT (💻 Browser) */}
                  <g filter={(primHealthy || secHealthy) ? "url(#glow-green)" : undefined}>
                    <polygon points="10,185 80,185 90,193 0,193" fill="var(--r53-inner-card-border)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" />
                    <rect x="35" y="179" width="20" height="7" fill="var(--color-text-secondary)" />
                    <rect x="5" y="145" width="80" height="34" rx="3" fill="var(--r53-inner-card-bg)" stroke={(primHealthy || secHealthy) ? "var(--color-green)" : "var(--r53-svg-line-stroke)"} strokeWidth="1.5" />
                    <rect x="8" y="148" width="74" height="27" rx="1.5" fill="var(--color-bg-glass)" />
                    <text x="45" y="160" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold" fontFamily="monospace">www.app.com</text>
                    <text x="45" y="170" textAnchor="middle" fontSize="5.2" fill={primHealthy ? "var(--color-green)" : secHealthy ? "var(--color-blue)" : "var(--color-red)"} fontFamily="monospace">
                      {primHealthy ? "resolved: us-east-1" : secHealthy ? "resolved: eu-west-1" : "Connection Failed!"}
                    </text>
                    <text x="45" y="136" textAnchor="middle" fontSize="9" fill="var(--color-text-primary)" fontWeight="600">💻 Browser</text>
                  </g>

                  {/* 3. ROUTE 53 FAILOVER GATEWAY */}
                  <g>
                    <rect x="150" y="120" width="80" height="80" rx="10" fill="var(--purple-grad-start)" stroke="var(--color-purple)" strokeWidth="1.5" style={{ backdropFilter: 'blur(4px)' }} />
                    <rect x="153" y="123" width="74" height="74" rx="8" fill="var(--color-bg-glass)" stroke="var(--purple-grad-stroke)" strokeWidth="1" />

                    {/* Rotating Gate dial */}
                    <circle cx="190" cy="160" r="18" fill="none" stroke="var(--color-purple)" strokeWidth="1.5" strokeDasharray="5,3">
                      <animateTransform attributeName="transform" type="rotate" from="0 190 160" to="360 190 160" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="190" cy="160" r="10" fill="var(--color-purple)" opacity="0.15" />
                    {/* Inner routing arrows */}
                    <path d="M 185 160 L 195 160 M 190 155 L 190 165" stroke="var(--color-purple)" strokeWidth="2" strokeLinecap="round" />

                    <text x="190" y="112" textAnchor="middle" fontSize="9" fill="var(--color-purple)" fontWeight="bold">🚀 Route 53</text>
                    <text x="190" y="213" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="500">Failover Engine</text>
                  </g>

                  {/* 4. HEALTH CHECKERS (Middle Satellite probers) */}
                  {/* Satellites background glow */}
                  <circle cx="330" cy="50" r="12" fill="var(--color-amber)" opacity="0.08" />
                  <circle cx="330" cy="150" r="12" fill="var(--color-amber)" opacity="0.08" />
                  <circle cx="330" cy="250" r="12" fill="var(--color-amber)" opacity="0.08" />

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
                    <rect x="310" y="38" width="40" height="24" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--color-amber)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.15))' }} />
                    <circle cx="330" cy="50" r="4" fill="var(--color-amber)" />
                    <text x="330" y="32" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">🇺🇸 Prober</text>
                  </g>
                  {/* Checker 2: EU-West */}
                  <g>
                    <rect x="310" y="138" width="40" height="24" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--color-amber)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.15))' }} />
                    <circle cx="330" cy="150" r="4" fill="var(--color-amber)" />
                    <text x="330" y="132" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">🇪🇺 Prober</text>
                  </g>
                  {/* Checker 3: AP-South */}
                  <g>
                    <rect x="310" y="238" width="40" height="24" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--color-amber)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.15))' }} />
                    <circle cx="330" cy="250" r="4" fill="var(--color-amber)" />
                    <text x="330" y="232" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">🇸🇬 Prober</text>
                  </g>

                  {/* Global Checkers Hub Title */}
                  <rect x="285" y="105" width="10" height="110" rx="3" fill="var(--r53-inner-card-border)" opacity="0.5" />
                  <text x="285" y="210" transform="rotate(-90, 285, 210)" fontSize="7" fill="var(--color-amber)" fontWeight="bold" letterSpacing="0.1em">ROUTE 53 GLOBAL PROBERS</text>

                  {/* 5. PRIMARY ENDPOINT us-east-1 */}
                  <g filter="url(#r53-shadow-hc)">
                    <rect
                      x="505"
                      y="32"
                      width="155"
                      height="90"
                      rx="10"
                      fill={primHealthy ? "url(#server-grad-hc-ok)" : "url(#server-grad-hc-err)"}
                      stroke={primHealthy ? "var(--color-green)" : "var(--color-red)"}
                      strokeWidth={primHealthy ? 1.5 : 2.5}
                      className={primHealthy ? "server-healthy-glow" : "server-unhealthy-glow"}
                      style={{ transition: 'all 0.4s' }}
                    />

                    {/* Server Rack ears & chassis */}
                    <line x1="509" y1="38" x2="509" y2="116" stroke="var(--r53-svg-line-stroke)" strokeWidth="3" />
                    <line x1="656" y1="38" x2="656" y2="116" stroke="var(--r53-svg-line-stroke)" strokeWidth="3" />

                    {/* Server Chassis details */}
                    <rect x="515" y="42" width="135" height="24" rx="3" fill="var(--r53-inner-card-bg)" fillOpacity="0.8" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                    <text x="521" y="57" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="monospace">us-east-1-alb</text>

                    {/* Indicator Panel */}
                    <rect x="515" y="72" width="135" height="42" rx="3" fill="var(--r53-inner-card-bg)" fillOpacity="0.9" stroke="var(--r53-inner-card-border)" strokeWidth="1" />

                    {/* Blinking status LEDs */}
                    <circle cx="527" cy="82" r="3.5" fill={primHealthy ? "var(--color-green)" : "var(--color-red)"} className={primHealthy ? undefined : "alarm-indicator"} />
                    <circle cx="539" cy="82" r="3" fill={primHealthy ? "var(--color-green)" : "var(--red-grad-stroke)"} opacity={primHealthy ? 0.7 : 0.3} />
                    <circle cx="551" cy="82" r="3" fill={primHealthy ? "var(--color-amber)" : "var(--red-grad-stroke)"} opacity={primHealthy ? 0.8 : 0.3} />

                    {/* Ventilation slot lines */}
                    <line x1="567" y1="79" x2="607" y2="79" stroke="var(--r53-inner-card-border)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="567" y1="85" x2="597" y2="85" stroke="var(--r53-inner-card-border)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Dynamic health stats text */}
                    <text x="523" y="102" fontSize="8" fill={primHealthy ? "var(--color-green)" : "var(--color-red)"} fontWeight="bold">
                      {primHealthy ? "🟢 ACTIVE · HEALTHY" : "🚨 OFFLINE (503 ERR)"}
                    </text>

                    <text x="580" y="24" textAnchor="middle" fontSize="9.5" fill={primHealthy ? "var(--color-green)" : "var(--color-red)"} fontWeight="bold">
                      Primary Target (ALB)
                    </text>
                  </g>

                  {/* 6. SECONDARY ENDPOINT eu-west-1 */}
                  <g filter="url(#r53-shadow-hc)">
                    <rect
                      x="505"
                      y="192"
                      width="155"
                      height="90"
                      rx="10"
                      fill={secHealthy ? (primHealthy ? "url(#user-grad-hc)" : "url(#server-grad-hc-ok)") : "url(#server-grad-hc-err)"}
                      stroke={secHealthy ? (primHealthy ? "var(--color-blue)" : "var(--color-green)") : "var(--color-red)"}
                      strokeWidth={secHealthy ? 1.5 : 2.5}
                      className={secHealthy ? "server-healthy-glow" : "server-unhealthy-glow"}
                      style={{ transition: 'all 0.4s' }}
                    />

                    {/* Server Rack ears & chassis */}
                    <line x1="509" y1="198" x2="509" y2="276" stroke="var(--r53-svg-line-stroke)" strokeWidth="3" />
                    <line x1="656" y1="198" x2="656" y2="276" stroke="var(--r53-svg-line-stroke)" strokeWidth="3" />

                    {/* Server Chassis details */}
                    <rect x="515" y="202" width="135" height="24" rx="3" fill="var(--r53-inner-card-bg)" fillOpacity="0.8" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                    <text x="521" y="217" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="monospace">eu-west-1-alb</text>

                    {/* Indicator Panel */}
                    <rect x="515" y="232" width="135" height="42" rx="3" fill="var(--r53-inner-card-bg)" fillOpacity="0.9" stroke="var(--r53-inner-card-border)" strokeWidth="1" />

                    {/* Blinking status LEDs */}
                    <circle cx="527" cy="242" r="3.5" fill={secHealthy ? (primHealthy ? "var(--color-blue)" : "var(--color-green)") : "var(--color-red)"} className={secHealthy ? undefined : "alarm-indicator"} />
                    <circle cx="539" cy="242" r="3" fill={secHealthy ? "var(--color-green)" : "var(--red-grad-stroke)"} opacity={secHealthy ? 0.7 : 0.3} />
                    <circle cx="551" cy="242" r="3" fill={secHealthy ? "var(--color-amber)" : "var(--red-grad-stroke)"} opacity={secHealthy ? 0.8 : 0.3} />

                    {/* Ventilation slot lines */}
                    <line x1="567" y1="239" x2="607" y2="239" stroke="var(--r53-inner-card-border)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="567" y1="245" x2="597" y2="245" stroke="var(--r53-inner-card-border)" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Dynamic health stats text */}
                    <text x="523" y="262" fontSize="8" fill={secHealthy ? (primHealthy ? "var(--color-blue)" : "var(--color-green)") : "var(--color-red)"} fontWeight="bold">
                      {secHealthy ? (primHealthy ? "🔵 PASSIVE · STANDBY" : "🟢 PROMOTED · ACTIVE") : "🚨 OFFLINE (CON OUT)"}
                    </text>

                    <text x="580" y="184" textAnchor="middle" fontSize="9.5" fill={secHealthy ? (primHealthy ? "var(--color-blue)" : "var(--color-green)") : "var(--color-red)"} fontWeight="bold">
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
                            background: primHealthy ? 'var(--replica-grad-start)' : 'var(--red-grad-stop)',
                            border: primHealthy ? '1px solid var(--replica-grad-stroke)' : '1px solid var(--red-grad-stroke)',
                            color: primHealthy ? 'var(--replica-grad-text)' : 'var(--red-grad-text)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: primHealthy ? '0 0 8px rgba(16, 185, 129, 0.1)' : '0 0 8px rgba(239, 68, 68, 0.1)',
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
                            background: secHealthy ? 'var(--replica-grad-start)' : 'var(--red-grad-stop)',
                            border: secHealthy ? '1px solid var(--replica-grad-stroke)' : '1px solid var(--red-grad-stroke)',
                            color: secHealthy ? 'var(--replica-grad-text)' : 'var(--red-grad-text)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: secHealthy ? '0 0 8px rgba(16, 185, 129, 0.1)' : '0 0 8px rgba(239, 68, 68, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {secHealthy ? '✅ Healthy' : '❌ Unhealthy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--r53-inner-card-bg)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--r53-inner-card-border)' }}>
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
                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-green)' }}>Type 1: Endpoint Health Checks</div>
                  <div className="r53-kv"><span className="r53-kk">Monitors</span><b>IP address or Domain Name (FQDN)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Protocols</span><b>HTTP · HTTPS · TCP</b></div>
                  <div className="r53-kv"><span className="r53-kk">Probe Interval</span><b>10 seconds (fast) or 30 seconds (standard)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Failure Threshold</span><b>3 consecutive failures = evicted from DNS</b></div>
                  <div className="r53-kv"><span className="r53-kk">Security Rule</span><b>Firewalls must whitelist global probe IP blocks</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-blue)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-blue)' }}>Type 2: Calculated Health Checks</div>
                  <div className="r53-kv"><span className="r53-kk">Monitors</span><b>Combines up to 256 child health checks</b></div>
                  <div className="r53-kv"><span className="r53-kk">Logical Operators</span><b>AND / OR / Minimum healthy thresholds (X of Y)</b></div>
                  <div className="r53-kv"><span className="r53-kk">Use Case</span><b>Mark site offline only if BOTH web servers are dead</b></div>
                </div>

                <div className="r53-card" style={{ borderLeft: '3px solid var(--color-purple)', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-purple)' }}>Type 3: CloudWatch Alarm Health Checks</div>
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
                    <svg width="100%" viewBox="0 0 680 290" className="r53-svg-bg" style={{ display: 'block', margin: '0 auto' }}>
                      <defs>
                        <filter id="r53-shadow-hybrid" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                        </filter>
                        <linearGradient id="onprem-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                          <stop offset="100%" stopColor="var(--color-border-glass)" />
                        </linearGradient>
                        <linearGradient id="vpn-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--orange-grad-start)" />
                          <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                        </linearGradient>
                        <linearGradient id="vpc-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary-grad-start)" />
                          <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                        </linearGradient>
                        <filter id="glow-hybrid" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* PREMIUM SUBNET BOUNDARIES & TIERS */}
                      {/* Left Box: On-Premises Data Center */}
                      <rect x="10" y="10" width="220" height="270" rx="12" fill="url(#onprem-bg-grad)" stroke="var(--r53-inner-card-border)" strokeWidth="1.5" />
                      <text x="120" y="24" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)" fontWeight="bold" letterSpacing="0.05em">🏢 ON-PREMISES DATA CENTER</text>

                      {/* On-Prem Client Subnet boundary */}
                      <rect x="16" y="174" width="208" height="96" rx="6" fill="var(--color-bg-glass)" fillOpacity="0.4" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" strokeDasharray="3,3" />
                      <text x="22" y="184" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">On-Prem Client Subnet</text>

                      {/* On-Prem DNS Server Subnet boundary */}
                      <rect x="16" y="44" width="208" height="122" rx="6" fill="var(--color-bg-glass)" fillOpacity="0.4" stroke="var(--r53-inner-card-border)" strokeWidth="0.75" strokeDasharray="3,3" />
                      <text x="22" y="54" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">On-Prem Directory Subnet</text>

                      {/* Middle Box: Security Tunnel Boundary */}
                      <rect x="242" y="105" width="196" height="80" rx="8" fill="url(#vpn-bg-grad)" stroke="var(--color-amber)" strokeWidth="1.25" strokeDasharray="4,3" />
                      <text x="340" y="98" textAnchor="middle" fontSize="8.5" fill="var(--color-amber)" fontWeight="bold">🔐 IPSec Cryptographic VPN Tunnel</text>
                      <text x="340" y="176" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">Secure Hybrid Transit Gateways</text>

                      {/* Right Box: Amazon VPC */}
                      <rect x="450" y="10" width="220" height="270" rx="12" fill="url(#vpc-bg-grad)" stroke="var(--r53-subnet-app-stroke)" strokeWidth="1.5" />
                      <text x="560" y="24" textAnchor="middle" fontSize="9.5" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AMAZON PRIVATE VPC (10.0.0.0/16)</text>

                      {/* AWS Private DNS Subnet boundary */}
                      <rect x="456" y="44" width="208" height="84" rx="6" fill="var(--color-bg-glass)" fillOpacity="0.4" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                      <text x="462" y="54" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">Private DNS Resolution Plane</text>

                      {/* AWS Workload private subnet boundary */}
                      <rect x="456" y="132" width="208" height="138" rx="6" fill="var(--color-bg-glass)" fillOpacity="0.4" stroke="var(--r53-subnet-app-stroke)" strokeWidth="0.75" strokeDasharray="3,3" />
                      <text x="462" y="142" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">AWS Workload Private Subnets</text>

                      {/* ON-PREMISES INFRASTRUCTURE */}
                      {/* On-Prem Client Laptop */}
                      <g filter={(hybridMode === 'inbound' && hybridStep === 0) || (hybridMode === 'outbound' && hybridStep === 6) ? "url(#glow-hybrid)" : undefined} transform="translate(10, 0)">
                        <rect x="20" y="196" width="50" height="28" rx="4" fill="var(--r53-inner-card-bg)" stroke="var(--r53-svg-line-stroke)" strokeWidth="1.5" />
                        <rect x="25" y="200" width="40" height="16" fill="var(--color-bg-glass)" />
                        <line x1="15" y1="224" x2="75" y2="224" stroke="var(--r53-svg-line-stroke)" strokeWidth="2.5" />
                        <text x="45" y="238" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">Laptop Client</text>
                      </g>

                      {/* On-Prem DNS Active Directory Server */}
                      <g filter={(hybridStep === 1 && hybridMode === 'inbound') || (hybridStep === 4 && hybridMode === 'outbound') ? "url(#glow-hybrid)" : undefined} transform="translate(10, 0)">
                        <rect x="110" y="80" width="90" height="74" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--r53-inner-card-border)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(148, 163, 184, 0.08))' }} />
                        <rect x="114" y="84" width="82" height="66" rx="4" fill="var(--color-bg-glass)" stroke="var(--r53-inner-card-border)" strokeWidth="1" />
                        {/* Blinking dots */}
                        <circle cx="125" cy="95" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                        <circle cx="133" cy="95" r="2" fill="var(--color-amber)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.5s" repeatCount="indefinite" /></circle>
                        <line x1="141" y1="95" x2="189" y2="95" stroke="var(--r53-inner-card-border)" strokeWidth="1.5" strokeLinecap="round" />

                        <circle cx="125" cy="107" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.2s" repeatCount="indefinite" /></circle>
                        <circle cx="133" cy="107" r="2" fill="var(--color-red)"><animate attributeName="opacity" values="1;0.1;1" dur="0.7s" repeatCount="indefinite" /></circle>
                        <line x1="141" y1="107" x2="189" y2="107" stroke="var(--r53-inner-card-border)" strokeWidth="1.5" strokeLinecap="round" />

                        <circle cx="125" cy="119" r="2" fill="var(--color-green)"><animate attributeName="opacity" values="0.3;1;0.3" dur="0.9s" repeatCount="indefinite" /></circle>
                        <line x1="141" y1="119" x2="189" y2="119" stroke="var(--r53-inner-card-border)" strokeWidth="1.5" strokeLinecap="round" />

                        <text x="155" y="138" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">On-Prem DNS</text>
                        <text x="155" y="146" textAnchor="middle" fontSize="7.2" fill="var(--color-text-secondary)">192.168.1.10</text>
                      </g>

                      {/* AWS INFRASTRUCTURE */}
                      {/* Route 53 Resolver Node */}
                      <g filter={(hybridStep === 4 && hybridMode === 'inbound') || (hybridStep === 1 && hybridMode === 'outbound') ? "url(#glow-hybrid)" : undefined}>
                        <circle cx="560" cy="80" r="22" fill="var(--purple-grad-start)" stroke="var(--color-purple)" strokeWidth="1.5" />
                        <circle cx="560" cy="80" r="15" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeDasharray="3,2">
                          <animateTransform attributeName="transform" type="rotate" from="0 560 80" to="360 560 80" dur="5s" repeatCount="indefinite" />
                        </circle>
                        <path d="M 554 80 A 6 6 0 0 1 566 80" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 566 80 A 6 6 0 0 1 554 80" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round" />
                        <text x="560" y="114" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Route 53 Resolver</text>
                        <text x="560" y="122" textAnchor="middle" fontSize="7" fill="var(--color-purple)">(10.0.0.2)</text>
                      </g>

                      {/* Inbound resolver endpoint ENI */}
                      <g filter={hybridStep === 3 && hybridMode === 'inbound' ? "url(#glow-hybrid)" : undefined} transform="translate(0, 4)">
                        <rect x="466" y="140" width="76" height="34" rx="5" fill="var(--r53-inner-card-bg)" stroke={hybridStep === 3 && hybridMode === 'inbound' ? "var(--color-green)" : "var(--r53-inner-card-border)"} strokeWidth="1.5" filter="url(#r53-shadow-hybrid)" />
                        <text x="504" y="152" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">📥 Inbound ENI</text>
                        <text x="504" y="164" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">10.0.1.53</text>
                      </g>

                      {/* Outbound resolver endpoint ENI */}
                      <g filter={hybridStep === 2 && hybridMode === 'outbound' ? "url(#glow-hybrid)" : undefined} transform="translate(0, 4)">
                        <rect x="578" y="140" width="76" height="34" rx="5" fill="var(--r53-inner-card-bg)" stroke={hybridStep === 2 && hybridMode === 'outbound' ? "var(--color-blue)" : "var(--r53-inner-card-border)"} strokeWidth="1.5" filter="url(#r53-shadow-hybrid)" />
                        <text x="616" y="152" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">📤 Outbound ENI</text>
                        <text x="616" y="164" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">10.0.1.250</text>
                      </g>

                      {/* Target resource / RDS Private DB */}
                      <g filter={(hybridMode === 'inbound' && hybridStep === 6) ? "url(#glow-hybrid)" : undefined} transform="translate(0, 6)">
                        <rect x="466" y="196" width="76" height="42" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" filter="url(#r53-shadow-hybrid)" />
                        <ellipse cx="504" cy="206" rx="14" ry="4" fill="var(--primary-grad-stop)" stroke="var(--primary-grad-stroke)" />
                        <text x="504" y="226" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">db.internal</text>
                        <text x="504" y="234" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)">RDS (10.0.2.99)</text>
                      </g>

                      {/* Target EC2 Instance (outbound initiator) */}
                      <g filter={(hybridMode === 'outbound' && hybridStep === 0) ? "url(#glow-hybrid)" : undefined} transform="translate(0, 6)">
                        <rect x="578" y="196" width="76" height="42" rx="6" fill="var(--r53-inner-card-bg)" stroke="var(--replica-grad-stroke)" strokeWidth="1.5" filter="url(#r53-shadow-hybrid)" />
                        <text x="616" y="210" textAnchor="middle" fontSize="8" fill="var(--color-text-primary)" fontWeight="bold">💻 EC2 Node</text>
                        <text x="616" y="226" textAnchor="middle" fontSize="7" fill="var(--replica-grad-stroke)">VPC Client</text>
                        <text x="616" y="234" textAnchor="middle" fontSize="6.5" fill="var(--replica-grad-text)">10.0.3.14</text>
                      </g>

                      {/* CONNECTING LINES AND LABELS */}
                      {/* On-Prem Client to On-Prem Server */}
                      <path d="M 50 196 L 50 117 L 120 117" fill="none" stroke="var(--r53-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="3,2" />
                      {/* On-Prem Server to VPN Tunnel */}
                      <path d="M 210 117 L 242 117" fill="none" stroke="var(--color-amber)" strokeWidth="2" strokeDasharray="3,2" />
                      {/* VPN Tunnel to Subnet ENIs */}
                      <path d="M 438 148 L 466 148" fill="none" stroke="var(--color-amber)" strokeWidth="2" strokeDasharray="3,2" />
                      {/* Subnet ENI to Resolver */}
                      <path d="M 504 144 L 504 80 L 538 80" fill="none" stroke="var(--r53-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 616 144 L 616 80 L 582 80" fill="none" stroke="var(--r53-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="3,2" />

                      {/* FLOW ANIMATED PACKETS */}
                      {/* Inbound query flow animation */}
                      {hybridIsRunning && hybridMode === 'inbound' && (
                        <>
                          {hybridStep === 0 && (
                            <circle cx="50" cy="196" r="4.5" fill="var(--color-amber)" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="196;117" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 1 && (
                            <circle cx="85" cy="117" r="4.5" fill="var(--color-purple)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="50;120" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 2 && (
                            <circle cx="226" cy="117" r="4.5" fill="var(--color-amber)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="210;450" dur="1s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 3 && (
                            <circle cx="452" cy="148" r="4.5" fill="var(--color-green)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="438;504" dur="0.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 4 && (
                            <circle cx="504" cy="112" r="4.5" fill="var(--color-purple)" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="144;80" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 5 && (
                            <circle cx="330" cy="117" r="4.5" fill="var(--color-amber)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="450;210" dur="1s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 6 && (
                            <circle cx="330" cy="212" r="5" fill="var(--color-green)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="50;504" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </>
                      )}

                      {/* Outbound query flow animation */}
                      {hybridIsRunning && hybridMode === 'outbound' && (
                        <>
                          {hybridStep === 0 && (
                            <circle cx="616" cy="196" r="4.5" fill="var(--color-blue)" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="196;144" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 1 && (
                            <circle cx="599" cy="80" r="4.5" fill="var(--color-purple)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="616;582" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 2 && (
                            <circle cx="582" cy="112" r="4.5" fill="var(--color-blue)" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="80;144" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 3 && (
                            <circle cx="330" cy="117" r="4.5" fill="var(--color-amber)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="582;210" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 4 && (
                            <circle cx="165" cy="117" r="4.5" fill="var(--color-red)" filter="url(#glow-hybrid)">
                              <animate attributeName="cy" values="80;117" dur="0.8s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 5 && (
                            <circle cx="330" cy="117" r="4.5" fill="var(--color-green)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="210;578" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {hybridStep === 6 && (
                            <circle cx="380" cy="170" r="5" fill="var(--color-green)" filter="url(#glow-hybrid)">
                              <animate attributeName="cx" values="578;50" dur="1.5s" repeatCount="indefinite" />
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
            archScenario === 'public_web' ? 'var(--color-green)' :
            archScenario === 'private_vpc' ? 'var(--color-blue)' : 'var(--color-purple)';

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
                    background: archScenario === 'public_web' ? 'var(--arch-public-bg)' : 'var(--arch-inactive-btn-bg)',
                    border: archScenario === 'public_web' ? '1px solid var(--arch-public-border)' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'public_web' ? 'var(--arch-public-text)' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'public_web' ? '0 0 10px var(--arch-public-bg)' : 'none'
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
                    background: archScenario === 'private_vpc' ? 'var(--arch-private-bg)' : 'var(--arch-inactive-btn-bg)',
                    border: archScenario === 'private_vpc' ? '1px solid var(--arch-private-border)' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'private_vpc' ? 'var(--arch-private-text)' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'private_vpc' ? '0 0 10px var(--arch-private-bg)' : 'none'
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
                    background: archScenario === 'hybrid_corp' ? 'var(--arch-hybrid-bg)' : 'var(--arch-inactive-btn-bg)',
                    border: archScenario === 'hybrid_corp' ? '1px solid var(--arch-hybrid-border)' : '1px solid var(--color-border-secondary)',
                    color: archScenario === 'hybrid_corp' ? 'var(--arch-hybrid-text)' : 'var(--color-text-secondary)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: archScenario === 'hybrid_corp' ? '0 0 10px var(--arch-hybrid-bg)' : 'none'
                  }}
                >
                  🔌 Scenario 3: Hybrid Corporate Network Resolver
                </button>
              </div>

              {/* Main Grid */}
              <div className="r53-g2" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* COLUMN 1: SVG DIAGRAM (60% width) */}
                <div className="r53-card" style={{ flex: '7 1 380px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
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

                  <svg width="100%" viewBox="0 0 660 360" className="r53-svg-bg" style={{ display: 'block', margin: '0 auto' }}>
                    <defs>
                      <filter id="r53-shadow-arch" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.08" />
                      </filter>

                      {/* Node Gradients */}
                      <linearGradient id="client-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--r53-inner-card-bg)" />
                        <stop offset="100%" stopColor="var(--r53-inner-card-border)" />
                      </linearGradient>
                      <linearGradient id="r53-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="waf-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--teal-grad-start)" />
                        <stop offset="100%" stopColor="var(--teal-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="cf-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="alb-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary-grad-start)" />
                        <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="compute-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--replica-grad-start)" />
                        <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="db-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--orange-grad-start)" />
                        <stop offset="100%" stopColor="var(--orange-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="cache-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--red-grad-start)" />
                        <stop offset="100%" stopColor="var(--red-grad-stop)" />
                      </linearGradient>
                      <linearGradient id="vpn-grad-arch" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple-grad-start)" />
                        <stop offset="100%" stopColor="var(--purple-grad-stop)" />
                      </linearGradient>

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
                        <path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" />
                      </marker>
                      <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" />
                      </marker>
                      <marker id="arrow-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)" />
                      </marker>
                      <marker id="arrow-dim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="var(--r53-svg-line-stroke)" />
                      </marker>
                    </defs>

                    {/* PREMIUM PARTITION PERIMETERS */}
                    {/* Public Internet boundary */}
                    <rect x="5" y="10" width="150" height="235" rx="8" fill="var(--r53-inner-card-bg)" fillOpacity="0.4" stroke="var(--r53-svg-line-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="22" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold">PUBLIC USER NETWORK</text>

                    {/* Corporate office boundary */}
                    <rect x="5" y="255" width="150" height="98" rx="8" fill="var(--r53-inner-card-bg)" fillOpacity="0.45" stroke="var(--r53-inner-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="12" y="267" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">ON-PREM CORP HQ</text>

                    {/* AWS Global Edge Network boundary */}
                    <rect x="165" y="10" width="485" height="105" rx="8" fill="var(--r53-edge-zone-bg)" fillOpacity="0.3" stroke="var(--r53-edge-zone-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="172" y="22" fontSize="7" fill="var(--r53-edge-zone-text)" fontWeight="bold">AWS EDGE NETWORK ZONE (DNS, CDN, WAF)</text>

                    {/* VPC Bubble boundary */}
                    <rect 
                      x="165" y="125" 
                      width="485" height="228" 
                      rx="16" 
                      fill="var(--r53-vpc-bubble-bg)" 
                      stroke={archScenario === 'private_vpc' ? 'var(--color-blue)' : archScenario === 'hybrid_corp' ? 'var(--color-purple)' : 'var(--r53-vpc-bubble-stroke-inactive)'} 
                      strokeWidth="1.5" 
                      strokeDasharray="6,4" 
                      opacity={archScenario === 'public_web' ? 0.35 : 1}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                    <text 
                      x="180" y="142" 
                      fontSize="9px" 
                      fontWeight="bold" 
                      fill={archScenario === 'private_vpc' ? 'var(--color-blue)' : archScenario === 'hybrid_corp' ? 'var(--color-purple)' : 'var(--color-text-secondary)'} 
                      opacity={archScenario === 'public_web' ? 0.5 : 1}
                      style={{ transition: 'all 0.5s ease', fontFamily: 'monospace' }}
                    >
                      ☁️ Amazon VPC Core (us-east-1)
                    </text>

                    {/* PATHS / CONNECTIONS */}
                    
                    {/* Line 1: Public Client to Route 53 (DNS Query) */}
                    <path 
                      d="M 140 77 L 185 77" 
                      fill="none" 
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={(archScenario === 'public_web' || archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={(archScenario === 'private_vpc' || archScenario === 'hybrid_corp') ? activeColor : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'private_vpc' ? 'var(--color-blue)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'hybrid_corp' ? 'var(--color-purple)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'hybrid_corp' ? 'var(--color-purple)' : 'var(--r53-svg-line-stroke)'} 
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
                      stroke={archScenario === 'public_web' ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} 
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
                      <rect x="20" y="55" width="120" height="44" rx="8" fill="url(#client-grad-arch)" stroke={isNodeActive('client_public') ? 'var(--color-green)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="32" y="82" fontSize="16">💻</text>
                      <text x="56" y="79" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Global User</text>
                      <text x="56" y="90" fontSize="7.5" fill="var(--color-text-secondary)" fontFamily="system-ui">Public Internet</text>
                    </g>

                    {/* NODE 2: Route 53 Global Cluster */}
                    <g 
                      opacity={isNodeActive('r53_global') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('r53_global') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="185" y="55" width="120" height="44" rx="8" fill="url(#r53-grad-arch)" stroke={isNodeActive('r53_global') ? 'var(--color-purple)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="197" y="82" fontSize="16">🚀</text>
                      <text x="221" y="79" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Route 53 DNS</text>
                      <text x="221" y="90" fontSize="7.5" fill="var(--purple-grad-text)" fontFamily="system-ui">Authoritative Edge</text>
                    </g>

                    {/* NODE 3: AWS WAF */}
                    <g 
                      opacity={isNodeActive('waf') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('waf') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="350" y="55" width="120" height="44" rx="8" fill="url(#waf-grad-arch)" stroke={isNodeActive('waf') ? 'var(--teal-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="362" y="82" fontSize="16">🛡️</text>
                      <text x="386" y="79" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">AWS WAF Gate</text>
                      <text x="386" y="90" fontSize="7.5" fill="var(--teal-grad-text)" fontFamily="system-ui">Exploit Shield</text>
                    </g>

                    {/* NODE 4: CloudFront CDN */}
                    <g 
                      opacity={isNodeActive('cloudfront') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('cloudfront') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="515" y="55" width="120" height="44" rx="8" fill="url(#cf-grad-arch)" stroke={isNodeActive('cloudfront') ? 'var(--orange-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="527" y="82" fontSize="16">☁️</text>
                      <text x="551" y="79" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">CloudFront</text>
                      <text x="551" y="90" fontSize="7.5" fill="var(--orange-grad-text)" fontFamily="system-ui">Edge Cache CDN</text>
                    </g>

                    {/* NODE 5: Amazon S3 (Static SPA) */}
                    <g 
                      opacity={isNodeActive('s3') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('s3') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="20" y="180" width="120" height="44" rx="8" fill="url(#cf-grad-arch)" stroke={isNodeActive('s3') ? 'var(--orange-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="32" y="207" fontSize="16">🪣</text>
                      <text x="56" y="204" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Amazon S3</text>
                      <text x="56" y="215" fontSize="7.5" fill="var(--orange-grad-text)" fontFamily="system-ui">Static Site SPA</text>
                    </g>

                    {/* NODE 6: Application Load Balancer */}
                    <g 
                      opacity={isNodeActive('alb') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('alb') ? 'url(#glow-green-line)' : undefined}
                    >
                      <rect x="515" y="145" width="120" height="44" rx="8" fill="url(#alb-grad-arch)" stroke={isNodeActive('alb') ? 'var(--primary-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="527" y="172" fontSize="16">⚖️</text>
                      <text x="551" y="169" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Public ALB</text>
                      <text x="551" y="180" fontSize="7.5" fill="var(--primary-grad-text)" fontFamily="system-ui">Traffic Balancer</text>
                    </g>

                    {/* NODE 7: Compute ECS Containers */}
                    <g 
                      opacity={isNodeActive('compute') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('compute') ? `url(#glow-${archScenario === 'public_web' ? 'green' : archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="185" y="190" width="120" height="44" rx="8" fill="url(#compute-grad-arch)" stroke={isNodeActive('compute') ? activeColor : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="197" y="217" fontSize="16">🖥️</text>
                      <text x="221" y="214" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Compute (ECS)</text>
                      <text x="221" y="225" fontSize="7.5" fill="var(--replica-grad-text)" fontFamily="system-ui">App microservice</text>
                    </g>

                    {/* NODE 8: RDS database */}
                    <g 
                      opacity={isNodeActive('rds') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('rds') ? `url(#glow-${archScenario === 'public_web' ? 'green' : archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="350" y="190" width="120" height="44" rx="8" fill="url(#db-grad-arch)" stroke={isNodeActive('rds') ? activeColor : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="362" y="217" fontSize="16">🗄️</text>
                      <text x="386" y="214" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">RDS Postgres</text>
                      <text x="386" y="225" fontSize="7.5" fill="var(--orange-grad-text)" fontFamily="system-ui">Isolated Database</text>
                    </g>

                    {/* NODE 9: ElastiCache Redis */}
                    <g 
                      opacity={isNodeActive('elasticache') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('elasticache') ? 'url(#glow-blue-line)' : undefined}
                    >
                      <rect x="515" y="190" width="120" height="44" rx="8" fill="url(#cache-grad-arch)" stroke={isNodeActive('elasticache') ? 'var(--red-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="527" y="217" fontSize="16">⚡</text>
                      <text x="551" y="214" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">ElastiCache</text>
                      <text x="551" y="225" fontSize="7.5" fill="var(--red-grad-text)" fontFamily="system-ui">In-Memory Redis</text>
                    </g>

                    {/* NODE 10: VPN Gateway */}
                    <g 
                      opacity={isNodeActive('vpn') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('vpn') ? 'url(#glow-purple-line)' : undefined}
                    >
                      <rect x="185" y="290" width="120" height="44" rx="8" fill="url(#vpn-grad-arch)" stroke={isNodeActive('vpn') ? 'var(--purple-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="197" y="317" fontSize="16">🔌</text>
                      <text x="221" y="314" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">VPN Gateway</text>
                      <text x="221" y="325" fontSize="7.5" fill="var(--purple-grad-text)" fontFamily="system-ui">Direct Connection</text>
                    </g>

                    {/* NODE 11: Route 53 Private Hosted Zone (PHZ) */}
                    <g 
                      opacity={isNodeActive('r53_private') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('r53_private') ? `url(#glow-${archScenario === 'private_vpc' ? 'blue' : 'purple'}-line)` : undefined}
                    >
                      <rect x="350" y="290" width="120" height="44" rx="8" fill="url(#r53-grad-arch)" stroke={isNodeActive('r53_private') ? activeColor : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="362" y="317" fontSize="16">🚀</text>
                      <text x="386" y="314" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">R53 Private Zone</text>
                      <text x="386" y="325" fontSize="7.5" fill="var(--purple-grad-text)" fontFamily="system-ui">VPC Resolver</text>
                    </g>

                    {/* NODE 12: Corporate On-Prem HQ */}
                    <g 
                      opacity={isNodeActive('client_onprem') ? 1 : 0.7} 
                      style={{ transition: 'all 0.4s' }}
                      filter={isNodeActive('client_onprem') ? 'url(#glow-purple-line)' : undefined}
                    >
                      <rect x="20" y="300" width="120" height="44" rx="8" fill="url(#client-grad-arch)" stroke={isNodeActive('client_onprem') ? 'var(--purple-grad-stroke)' : 'var(--r53-svg-line-stroke)'} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                      <text x="32" y="327" fontSize="16">🏢</text>
                      <text x="56" y="324" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold" fontFamily="system-ui">Corporate HQ</text>
                      <text x="56" y="335" fontSize="7.5" fill="var(--purple-grad-text)" fontFamily="system-ui">On-Prem Network</text>
                    </g>
                  </svg>
                  
                  <div style={{ marginTop: '12px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-green)', borderRadius: '50%' }} /> Public Path
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-blue)', borderRadius: '50%' }} /> Private Hosted Zone Path
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-purple)', borderRadius: '50%' }} /> Hybrid On-Prem VPN Path
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
                  <div className="r53-card" style={{ borderLeft: '3px solid var(--color-amber)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🧠 Brain-Friendly Memory Hooks
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ background: 'var(--r53-amber-bg)', padding: '6px 8px', borderRadius: '6px', border: '0.5px solid var(--r53-amber-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>The Mnemonic Analogy:</div>
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
                        <span style={{ color: 'var(--color-amber)', fontWeight: 'bold' }}>💡 AWS Exam Secret:</span> <em>Private Hosted Zones (PHZs)</em> require that the VPC settings <code>enableDnsHostnames</code> and <code>enableDnsSupport</code> are BOTH set to <code>true</code>!
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
        })()}
            </>
          </Translate>
        )}

      </div>
    </div>
  );
}
