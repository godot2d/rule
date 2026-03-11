function operator(proxies, targetPlatform, context) {

  return proxies.map(proxy => {

    // Name包含 ISP
    if (/ISP/i.test(proxy.name)) {
      proxy["dialer-proxy"] = "🇺🇲 美国节点"
    }

    return proxy
  })
}