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
  ipv6: false,
  "enhanced-mode": "redir-host",
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
  "respect-rules": true,
  "nameserver-policy": {
    "+.esotericsoftware.com": "https://192.0.2.1/dns-query"
  }
};

// ===== Sniffer 配置 =====
const snifferConfig = {
  enable: true,
  "force-dns-mapping": true,
  "parse-pure-ip": true,
  sniff: {
    TLS: { ports: [443, 8443] },
    HTTP: { ports: [80, "8080-8880"], "override-destination": true },
    QUIC: { ports: [443, 8443] }
  }
};

// 先展开原 YAML，再用 dns/sniffer 覆盖同名字段，保证覆盖生效
const newYaml = { ...yaml, dns: dnsConfig, sniffer: snifferConfig };

// 输出最终 YAML 字符串
$content = ProxyUtils.yaml.dump(newYaml);