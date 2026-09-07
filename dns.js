// 假设 $content 是原始 YAML 字符串
const yaml = ProxyUtils.yaml.safeLoad($content ?? $files[0]);

// ===== 在这里处理 proxies（合并 operator 逻辑）=====
if (yaml.proxies && Array.isArray(yaml.proxies)) {
  yaml.proxies = yaml.proxies.map(proxy => {

    // Name 包含 ISP
    if (/ISP/i.test(proxy.name)) {
      proxy["dialer-proxy"] = "跳板选择";
    }

    return proxy;
  });
}

// ============================================================
// 覆盖配置：直接把 YAML 粘进下面这段模板字符串即可
// - 顶层写 dns: / sniffer: / 或任意其它顶层键，都会覆盖订阅里的同名键
// - 缩进按 YAML 规则（两个空格），不要用 Tab
// - 想临时加东西不用改 JS，改这块字符串就行
// ============================================================
const OVERRIDE_YAML = `
dns:
  enable: true
  ipv6: false                       # 本地 v6 半残会导致解析飘忽，先关；确认无关再开
  enhanced-mode: fake-ip            # 关键：连接时不再硬依赖真实解析，杜绝 ERR_NAME_NOT_RESOLVED
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - '+.lan'
    - '+.local'
    - '+.market.xiaomi.com'
    - '*.msftconnecttest.com'
    - '*.msftncsi.com'
    - 'localhost.ptlogin2.qq.com'
    - 'time.*.com'
    - 'time.*.gov'
  use-hosts: false
  use-system-hosts: false
  default-nameserver:               # 仅用于引导解析下面 DoH 服务器域名
    - 223.5.5.5
    - 119.29.29.29
  nameserver:
    - 'https://1.1.1.1/dns-query'
    - 'https://8.8.8.8/dns-query'
  proxy-server-nameserver:
    - 'https://223.5.5.5/dns-query'
    - 'https://223.6.6.6/dns-query'
  direct-nameserver:
    - 'https://223.5.5.5/dns-query'
    - 'https://223.6.6.6/dns-query'
  respect-rules: true
  nameserver-policy:
    '+.esotericsoftware.com': 'https://192.0.2.1/dns-query'   # 黑洞 Spine 授权校验，保留
    '+.deepseek.com':
      - 'https://1.1.1.1/dns-query'
      - 'https://8.8.8.8/dns-query'

sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  sniff:
    TLS:
      ports: [443, 8443]
    HTTP:
      ports: [80, 8080-8880]
      override-destination: true
    QUIC:
      ports: [443, 8443]
`;

const override = ProxyUtils.yaml.safeLoad(OVERRIDE_YAML) || {};

// ============================================================
// 额外规则：会插到订阅 rules 最前面（优先级最高）
// 默认空。想让某域名整簇走同一条路，在这里加，例如：
//   "DOMAIN-SUFFIX,deepseek.com,🚀 节点选择",
// 注意：第三段的策略组名必须是订阅里已存在的 proxy-groups 名字，否则 mihomo 加载报错
// ============================================================
const EXTRA_RULES = [
  // "DOMAIN-SUFFIX,deepseek.com,🚀 节点选择",
];

// 先展开原 YAML，再用 override 覆盖同名顶层字段，保证覆盖生效
const newYaml = { ...yaml, ...override };

if (EXTRA_RULES.length) {
  newYaml.rules = [...EXTRA_RULES, ...(Array.isArray(yaml.rules) ? yaml.rules : [])];
}

// 输出最终 YAML 字符串
$content = ProxyUtils.yaml.dump(newYaml);
