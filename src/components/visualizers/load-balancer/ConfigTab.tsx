export default function ConfigTab() {
  return (
    <div>
      <div className="section-label">🍪 Enable ALB Stickiness (Terraform)</div>
      <div className="code-block">
        <span className="cm"># Terraform — ALB Target Group with stickiness</span><br />
        <span className="kw">resource</span> <span className="str">"aws_lb_target_group"</span> <span className="str">"app"</span> {'{'}
        <br />
        &nbsp;&nbsp;name = <span className="str">"my-app-tg"</span><br />
        &nbsp;&nbsp;port = <span className="str">80</span><br />
        &nbsp;&nbsp;protocol = <span className="str">"HTTP"</span><br />
        &nbsp;&nbsp;vpc_id = var.vpc_id<br />
        <br />
        &nbsp;&nbsp;stickiness {'{'}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;type = <span className="str">"lb_cookie"</span> <span className="cm"># or "app_cookie"</span><br />
        &nbsp;&nbsp;&nbsp;&nbsp;cookie_duration = <span className="str">86400</span> <span className="cm"># 1 day in seconds</span><br />
        &nbsp;&nbsp;&nbsp;&nbsp;enabled = <span className="str">true</span><br />
        &nbsp;&nbsp;{'}'}<br />
        {'}'}
      </div>

      <div className="section-label" style={{ marginTop: '16px' }}>⚡ Enable NLB Stickiness (Terraform)</div>
      <div className="code-block">
        <span className="cm"># Terraform — NLB Target Group with stickiness</span><br />
        <span className="kw">resource</span> <span className="str">"aws_lb_target_group"</span> <span className="str">"nlb_app"</span> {'{'}
        <br />
        &nbsp;&nbsp;name = <span className="str">"my-nlb-tg"</span><br />
        &nbsp;&nbsp;port = <span className="str">443</span><br />
        &nbsp;&nbsp;protocol = <span className="str">"TCP"</span><br />
        &nbsp;&nbsp;vpc_id = var.vpc_id<br />
        <br />
        &nbsp;&nbsp;stickiness {'{'}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;type = <span className="str">"source_ip"</span> <span className="cm"># only option for NLB</span><br />
        &nbsp;&nbsp;&nbsp;&nbsp;enabled = <span className="str">true</span><br />
        &nbsp;&nbsp;{'}'}<br />
        {'}'}
      </div>
    </div>
  );
}
