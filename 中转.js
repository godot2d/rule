

function operator(proxies, targetPlatform, context) {

  return proxies.map(proxy => {

    // 检查 server 是否是纯 IP
    if (/^\d+\.\d+\.\d+\.\d+$/.test(proxy.server)) {
      proxy.override = proxy.override || {}
      proxy.override["dialer-proxy"] = "🚀 节点选择"
    }

    return proxy
  })
}