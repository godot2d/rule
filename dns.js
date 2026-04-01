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

// ===== DNS 配置 =====
const dnsConfig = {
  enable: true,
  ipv6: true,
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter": [
    "geosite:private",
    "geosite:category-ntp"
  ],
  "use-hosts": false,
  "use-system-hosts": false,
  "nameserver": [
    "https://1.1.1.1/dns-query",
    "https://8.8.8.8/dns-query"
  ],
  "proxy-server-nameserver": [
    "https://223.5.5.5/dns-query",
    "https://223.6.6.6/dns-query"
  ],
  "direct-nameserver": [
    "https://223.5.5.5/dns-query",
    "https://223.6.6.6/dns-query"
  ],
  "respect-rules": true
};

// ===== 在 rules 最顶部插入翻译规则 =====
const translateRules = [
  "DOMAIN-SUFFIX,translate.googleapis.com,🚀 节点选择",
  "DOMAIN-SUFFIX,translate-pa.googleapis.com,🚀 节点选择",
  "DOMAIN-SUFFIX,translate.google.com,🚀 节点选择"
];
if (yaml.rules && Array.isArray(yaml.rules)) {
  yaml.rules = [...translateRules, ...yaml.rules];
} else {
  yaml.rules = translateRules;
}

// 如果原 YAML 已经有 dns 节点，则覆盖，否则插入到开头
const newYaml = { dns: dnsConfig, ...yaml };

// 输出最终 YAML 字符串
$content = ProxyUtils.yaml.dump(newYaml);