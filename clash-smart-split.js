/**
 * Clash Verge / Clash Party 智能分流覆写脚本
**/
const proxyName = "代理模式";

const UserConfig = {
  // 黑名单关键词（包含即删除）
  blockKeywords: [
    "专线X5倍率",
    "到期",
    "剩余流量",
    "重置",
    "官网",
    "如果是",
    "邮箱",
    "套餐",
  ],
};
function filterProxiesByKeyword(params) {
  if (!params.proxies || params.proxies.length === 0) return;
  const before = params.proxies.length;
  params.proxies = params.proxies.filter(p =>
    !UserConfig.blockKeywords.some(k => p.name.includes(k))
  );
  const after = params.proxies.length;
  // 防御：如果被清空，至少保留 DIRECT
  if (after === 0) {
    params.proxies = [];
  }
}

function main(params) {
  if (!params.proxies) return params;
  //1. 先清洗垃圾节点（最关键）
  filterProxiesByKeyword(params);
  //2. 再生成规则 / 分组 / DNS
  overwriteRules(params);
  overwriteProxyGroups(params);
  overwriteDns(params);
  return params;
}

const countryRegions = [
	{ code: "HK", name: "香港", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/hk.svg", regex: /(香港|HK|Hong Kong|🇭🇰)(?!.*(中国|CN|China|PRC|🇨🇳))/i },
	{ code: "TW", name: "台湾", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/tw.svg", regex: /(台湾|TW|Taiwan|🇹🇼)(?!.*(中国|CN|China|PRC|🇨🇳))(?!.*Networks)/i },  
	{ code: "SG", name: "新加坡", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/sg.svg", regex: /(新加坡|狮城|SG|Singapore|🇸🇬)/i },
	{ code: "JP", name: "日本", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/jp.svg", regex: /(日本|JP|Japan|东京|🇯🇵)/i },
	{ code: "US", name: "美国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/us.svg", regex: /^(?!.*(Plus|plus|custom)).*(美国|洛杉矶|US|USA|United States|America|🇺🇸)/i },
	{ code: "DE", name: "德国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/de.svg", regex: /^(?!.*shadowsocks).*(德国|DE|Germany|🇩🇪)/i },
	{ code: "KR", name: "韩国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/kr.svg", regex: /(韩国|首尔|KR|Korea|South Korea|🇰🇷)/i },
	{ code: "UK", name: "英国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/gb.svg", regex: /(英国|UK|United Kingdom|Britain|Great Britain|🇬🇧)/i },
	{ code: "CA", name: "加拿大", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ca.svg", regex: /^(?!.*(Anycast|Datacamp)).*(加拿大|CA|Canada|🇨🇦)/i },
	{ code: "AU", name: "澳大利亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/au.svg", regex: /(澳大利亚|AU|Australia|🇦🇺)/i },
	{ code: "FR", name: "法国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/fr.svg", regex: /^(?!.*(free|Frontier|Frankfurt)).*(法国|FR|France|🇫🇷)/i },
	{ code: "NL", name: "荷兰", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/nl.svg", regex: /^(?!.*(only|online|MNL)).*(荷兰|NL|Netherlands|🇳🇱)/i },
	{ code: "RU", name: "俄罗斯", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ru.svg", regex: /(俄罗斯|RU|Russia|🇷🇺)/i },
	{ code: "IN", name: "印度", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/in.svg", regex: /^(?!.*(Singapore|Argentina|Intel|Inc|ing|link|business|hinet|internet|印度尼西亚|main)).*(印度|IN|India|🇮🇳)/i }, 
	{ code: "BR", name: "巴西", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/br.svg", regex: /(巴西|BR|Brazil|🇧🇷)/i },
	{ code: "IT", name: "意大利", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/it.svg", regex: /^(?!.*(mitce|reality|digital|leiting|limited|it7|territories)).*(意大利|IT|Italy|🇮🇹)/i },
	{ code: "CH", name: "瑞士", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ch.svg", regex: /^(?!.*(incheon|chunghwa|tech|psychz|channel|seychelles|chuncheon)).*(瑞士|CH|Switzerland|🇨🇭)/i },
	{ code: "SE", name: "瑞典", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/se.svg", regex: /^(?!.*(sel2|sea1|server|selfhost|neonpulse|base|seoul|seychelles)).*(瑞典|SE|Sweden|🇸🇪)/i },
	{ code: "NO", name: "挪威", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/no.svg", regex: /^(?!.*(none|node|annoy|cf_no1|technolog)).*(挪威|NO|Norway|🇳🇴)/i },
	{ code: "CN", name: "中国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/cn.svg", regex: /^(?!.*(台湾|香港|TW|CN_d)).*(中国|CN|China|PRC|🇨🇳)/i },
	{ code: "MY", name: "马来西亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/my.svg", regex: /^(?!.*(myshadow)).*(马来西亚|MY|Malaysia|🇲🇾)/i },
	{ code: "VN", name: "越南", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/vn.svg", regex: /(越南|VN|Vietnam|🇻🇳)/i },
	{ code: "PH", name: "菲律宾", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ph.svg", regex: /^(?!.*(phoenix|phx)).*(菲律宾|PH|Philippines|🇵🇭)/i },
	{ code: "TH", name: "泰国", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/th.svg", regex: /^(?!.*(GTHost|pathx)).*(泰国|TH|Thailand|🇹🇭)/i },
	{ code: "ID", name: "印度尼西亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/id.svg", regex: /(印度尼西亚|ID|Indonesia|🇮🇩)/i },
	{ code: "AR", name: "阿根廷", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ar.svg", regex: /^(?!.*(warp|arm|flare|star|shar|par|akihabara|bavaria)).*(阿根廷|AR|Argentina|🇦🇷)/i },
	{ code: "NG", name: "尼日利亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ng.svg", regex: /^(?!.*(ong|ing|angeles|ang|ung)).*(尼日利亚|NG|Nigeria|🇳🇬)(?!.*(Hongkong|Singapore))/i },
	{ code: "TR", name: "土耳其", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/tr.svg", regex: /^(?!.*(trojan|str|central)).*(土耳其|TR|Turkey|🇹🇷)/i },
	{ code: "ES", name: "西班牙", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/es.svg", regex: /^(?!.*(vless|angeles|vmess|seychelles|business|ies|reston)).*(西班牙|ES|Spain|🇪🇸)/i },
	{ code: "AT", name: "奥地利", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/at.svg", regex: /^(?!.*(Gate)).*(奥地利|AT|Austria|🇦🇹)/i },
	{ code: "MX", name: "墨西哥", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/mx.svg", regex: /(墨西哥|MX|Mexico|🇲🇽)/i },
	{ code: "EE", name: "爱沙尼亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ee.svg", regex: /^(?!.*(free)).*(爱沙尼亚|EE|Estonia|🇪🇪)/i },
	{ code: "PL", name: "波兰", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/pl.svg", regex: /(波兰|PL|Poland|🇵🇱)/i },
	{ code: "IR", name: "伊朗", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/ir.svg", regex: /(伊朗|IR|Iran|🇮🇷)/i },
	{ code: "ZA", name: "南非", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/za.svg", regex: /(南非|ZA|South Africa|🇿🇦)/i },
	{ code: "CO", name: "哥伦比亚", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/co.svg", regex: /(哥伦比亚|CO|Colombia|🇨🇴)/i },
	{ code: "SA", name: "沙特阿拉伯", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/sa.svg", regex: /^(?!.*(usa|sakura)).*(沙特阿拉伯|沙特|SA|Saudi Arabia|🇸🇦)/i },
	{ code: "CL", name: "智利", icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/cl.svg", regex: /^(?!.*(cloud)).*(智利|CL|Chile|🇨🇱)/i },
];

function getTestUrlForGroup(groupName) {
	switch (groupName) {
	case "Steam":
		return "https://store.steampowered.com/";
	case "Telegram":
		return "https://web.telegram.org/";
	case "ChatGPT":
		return "https://chat.openai.com/";
	case "Claude":
		return "https://claude.ai/";
	case "Spotify":
		return "https://www.spotify.com/";
	case "Google":
		return "http://google.com/";
	case "Microsoft":
		return "http://msn.com/";
	case "Linux Do":
		return "https://linux.do/";
	case "zrblog":
		return "https://www.zrblog.net/";
	default:
		return "http://www.gstatic.com/generate_204";
	}
}

function getIconForGroup(groupName) {
	switch (groupName) {
	case "Linux Do":
		return "https://linux.do/uploads/default/original/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994.png";
	case "zrblog":
		return "https://www.zrblog.net/favicon.ico";
	case "Binance":
  	return "https://bin.bnbstatic.com/static/images/common/favicon.ico";
	case "Steam":
		return "https://fastly.jsdelivr.net/gh/Orz-3/mini@master/Color/Steam.png";
	case "Telegram":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/telegram.png";
	case "ChatGPT":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/openai.png";
	case "Claude":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/anthropic.png";
	case "Spotify":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/spotify.png";
	case "Google":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/google.png";
	case "Microsoft":
		return "https://fastly.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/microsoft.png";
	case "漏网之鱼":
		return "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/fish.svg";
	case "广告拦截":
		return "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/block.svg";
	default:
		return "";
	}
}

const prependRule = [
	"DOMAIN-SUFFIX,taobao.com,DIRECT",
	"DOMAIN-SUFFIX,alibaba.com,DIRECT",
	"DOMAIN-SUFFIX,aliyuncs.com,DIRECT",
	"DOMAIN-SUFFIX,dingtalk.com,DIRECT",
	"DOMAIN-SUFFIX,alicdn.com,DIRECT",
	"DOMAIN-SUFFIX,wechat.com,DIRECT",
	"DOMAIN-SUFFIX,wx.qlogo.cn,DIRECT",
	"DOMAIN-SUFFIX,qpic.cn,DIRECT",
	"DOMAIN-SUFFIX,hdslb.com,DIRECT",
];

const customRules = [
	...prependRule,
	"DOMAIN-SUFFIX,linux.do,Linux Do",
	"DOMAIN-SUFFIX,zrblog.net,zrblog",
	"IP-CIDR,183.230.113.152/32,REJECT",
	"IP-CIDR,1.12.12.12/32,代理模式"
];

// 覆写规则
function overwriteRules(params) {
	const rules = [
		...customRules,
		"RULE-SET,BiliBili,DIRECT",
		"RULE-SET,steam,Steam",
		"RULE-SET,binance,Binance",
		"RULE-SET,telegramcidr,Telegram,no-resolve",
		"RULE-SET,openai,ChatGPT",
		"RULE-SET,claude,Claude",
		"RULE-SET,spotify,Spotify",
		"RULE-SET,google,Google",
		"RULE-SET,Microsoft,Microsoft",
		"GEOIP,CN,DIRECT,no-resolve",
		"GEOIP,LAN,DIRECT,no-resolve",
		"GEOSITE,geolocation-cn,DIRECT",
		"RULE-SET,direct,DIRECT",
		"RULE-SET,cncidr,DIRECT",
		"RULE-SET,private,DIRECT",
		"RULE-SET,lancidr,DIRECT",
		"RULE-SET,applications,DIRECT",
		// "RULE-SET,apple," + proxyName,
		// "RULE-SET,icloud," + proxyName,
		// "RULE-SET,greatfire," + proxyName,
		"RULE-SET,reject,广告拦截",
		"RULE-SET,AD,广告拦截",
		"RULE-SET,EasyList,广告拦截",
		"RULE-SET,EasyListChina,广告拦截",
		"RULE-SET,EasyPrivacy,广告拦截",
		"RULE-SET,ProgramAD,广告拦截",
		// "RULE-SET,gfw," + proxyName,
		// "RULE-SET,proxy," + proxyName,
		// "RULE-SET,tld-not-cn," + proxyName,
		"MATCH,漏网之鱼",
	];
 // 规则集通用配置
	const ruleProviderCommon = {
		type: "http",
		format: "yaml",
		interval: 86400
	};
// 规则集配置
	const ruleProviders = {
		steam: {
		...ruleProviderCommon,
			behavior: "classical",
			url: "https://raw.githubusercontent.com/yangtb2024/Steam-Clash/refs/heads/main/Steam.txt",
			path: "./ruleset/steam.yaml",
		},
		Microsoft: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://raw.githubusercontent.com/yangtb2024/Steam-Clash/refs/heads/main/microsoft.txt",
			path: "./ruleset/Microsoft.yaml",
		},
		reject: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
			path: "./ruleset/reject.yaml",
		},
		icloud: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
			path: "./ruleset/icloud.yaml",
		},
		apple: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
			path: "./ruleset/apple.yaml",
		},
		google: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
			path: "./ruleset/google.yaml",
		},
		proxy: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
			path: "./ruleset/proxy.yaml",
		},
		openai: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/OpenAI/OpenAI.yaml",
			path: "./ruleset/custom/openai.yaml",
		},
		claude: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.yaml",
			path: "./ruleset/custom/Claude.yaml",
		},
		binance: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/classical/binance.yaml",
			path: "./ruleset/custom/binance.yaml",
		},
		BiliBili: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/BiliBili/BiliBili.yaml",
			path: "./ruleset/custom/BiliBili.yaml",
		},
		spotify: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.yaml",
			path: "./ruleset/custom/Spotify.yaml",
		},
		telegramcidr: {
			...ruleProviderCommon,
			behavior: "ipcidr",
			url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
			path: "./ruleset/custom/telegramcidr.yaml",
		},
		direct: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
			path: "./ruleset/direct.yaml",
		},
		private: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
			path: "./ruleset/private.yaml",
		},
		gfw: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
			path: "./ruleset/gfw.yaml",
		},
		greatfire: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/greatfire.txt",
			path: "./ruleset/greatfire.yaml",
		},
		"tld-not-cn": {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
			path: "./ruleset/tld-not-cn.yaml",
		},
		cncidr: {
			...ruleProviderCommon,
			behavior: "ipcidr",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
			path: "./ruleset/cncidr.yaml",
		},
		lancidr: {
			...ruleProviderCommon,
			behavior: "ipcidr",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
			path: "./ruleset/lancidr.yaml",
		},
		applications: {
			...ruleProviderCommon,
			behavior: "classical",
			url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
			path: "./ruleset/applications.yaml",
		},
		AD: {
		  ...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://raw.githubusercontent.com/earoftoast/clash-rules/main/AD.yaml",
		  path: "./rules/AD.yaml",
		},
		EasyList: {
			...ruleProviderCommon,
			behavior: "domain",
			url: "https://raw.githubusercontent.com/earoftoast/clash-rules/main/EasyList.yaml",
			path: "./rules/EasyList.yaml",
		},
		EasyListChina: {
		  ...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://raw.githubusercontent.com/earoftoast/clash-rules/main/EasyListChina.yaml",
		  path: "./rules/EasyListChina.yaml",
		},
		EasyPrivacy: {
			...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://raw.githubusercontent.com/earoftoast/clash-rules/main/EasyPrivacy.yaml",
		  path: "./rules/EasyPrivacy.yaml",
		},
		ProgramAD: {
		  ...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://raw.githubusercontent.com/earoftoast/clash-rules/main/ProgramAD.yaml",
		  path: "./rules/ProgramAD.yaml",
		},
		gfw: {
		  ...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
		  path: "./ruleset/gfw.yaml",
		},
		greatfire: {
		  ...ruleProviderCommon,
		  behavior: "domain",
		  url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/greatfire.txt",
		  path: "./ruleset/greatfire.yaml",
		},
	};
	
	params["rule-providers"] = ruleProviders;
	params["rules"] = rules;
}

// 覆写代理组
function overwriteProxyGroups(params) {
	// 所有代理
  const allProxies = params["proxies"].map((e) => e.name);

  const availableCountryCodes = new Set();
  const otherProxies = [];
  for (const proxy of params["proxies"]) {
    let bestMatch = null;
    let longestMatchLength = 0;

    for (const region of countryRegions) {
      const match = proxy.name.match(region.regex);
      if (match) {
        if (match[0].length > longestMatchLength) {
          longestMatchLength = match[0].length;
          bestMatch = region.code;
        }
      }
    }

    if (bestMatch) {
      availableCountryCodes.add(bestMatch);
    } else {
      otherProxies.push(proxy.name);
    }
  }

  availableCountryCodes.add("CN");

  const autoProxyGroupRegexs = countryRegions
    .filter(region => availableCountryCodes.has(region.code))
    .map(region => ({
      name: `${region.code} - 自动选择`,
      regex: region.regex,
      code: region.code
    }));

  const autoProxyGroups = autoProxyGroupRegexs
    .map((item) => ({
      name: item.name,
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: getProxiesByRegex(params, item.regex),
      hidden: true,
    }))
    .filter((item) => item.proxies.length > 0);

  const manualProxyGroupsConfig = countryRegions
    .filter(region => availableCountryCodes.has(region.code))
    .map(region => ({
      name: `${region.code} - 手动选择`,
      type: "select",
      proxies: getManualProxiesByRegex(params, region.regex),
      icon: region.icon,
      hidden: false,
    }))
    .filter(item => item.proxies.length > 0);

  let otherManualProxyGroup = null;
  let otherAutoProxyGroup = null;

  if (otherProxies.length > 0) {
    otherManualProxyGroup = {
      name: "其它 - 手动选择",
      type: "select",
      proxies: otherProxies,
      icon: "https://www.clashverge.dev/assets/icons/guard.svg",
      hidden: false,
    };

    otherAutoProxyGroup = {
      name: "其它 - 自动选择",
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: otherProxies,
      hidden: true,
    };
  }

  const aiLimitedCountries = ["TW", "SG", "JP", "KR"];
  const binanceLimitedCountries = ["SG", "JP", "KR"];

  const groups = [
    {
      name: proxyName,
      type: "select",
      url: "http://www.gstatic.com/generate_204",
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg",
      proxies: ["自动选择", "手动选择", "负载均衡 (散列)", "负载均衡 (轮询)", "DIRECT"],
    },

    {
      name: "手动选择",
      type: "select",
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/link.svg",
      proxies: allProxies.length > 0 ? allProxies : ["DIRECT"],
    },

    {
      name: "自动选择",
      type: "select",
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/speed.svg",
      proxies: [
        "ALL - 自动选择",
        ...autoProxyGroups.map(g => g.name),
        otherAutoProxyGroup ? otherAutoProxyGroup.name : null
      ].filter(Boolean),
    },

    {
      name: "负载均衡 (散列)",
      type: "load-balance",
      url: "http://www.gstatic.com/generate_204",
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/balance.svg",
      interval: 300,
      "max-failed-times": 3,
      strategy: "consistent-hashing",
      lazy: true,
      proxies: allProxies.length > 0 ? allProxies : ["DIRECT"],
      hidden: true,
    },

    {
      name: "负载均衡 (轮询)",
      type: "load-balance",
      url: "http://www.gstatic.com/generate_204",
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/merry_go.svg",
      interval: 300,
      "max-failed-times": 3,
      strategy: "round-robin",
      lazy: true,
      proxies: allProxies.length > 0 ? allProxies : ["DIRECT"],
      hidden: true,
    },

    {
      name: "ALL - 自动选择",
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: allProxies.length > 0 ? allProxies : ["DIRECT"],
      hidden: true,
    },

    // 网站分组
    ...["Steam", "Telegram", "ChatGPT", "Claude", "Spotify", "Google", "Microsoft", "Linux Do", "zrblog", "Binance"].map(groupName => {
      const isAIGroup = ["ChatGPT", "Claude"].includes(groupName);
      const isBinanceGroup = groupName === "Binance";
			const allowedRegions = isAIGroup
			  ? countryRegions.filter(r => aiLimitedCountries.includes(r.code))
			  : isBinanceGroup
			  ? countryRegions.filter(r => binanceLimitedCountries.includes(r.code))
			  : countryRegions.filter(r => availableCountryCodes.has(r.code));
      return {
        name: groupName,
        type: "select",
        url: getTestUrlForGroup(groupName),
        icon: getIconForGroup(groupName),
        proxies: isAIGroup
          ? [
              "DIRECT",
              ...allowedRegions.flatMap(region => [
                `${region.code} - 自动选择 - ${groupName}`,
                `${region.code} - 手动选择`,
              ]),
            ]
          : [
              proxyName,
              "DIRECT",
              `ALL - 自动选择 - ${groupName}`,
              ...allowedRegions.flatMap(region => [
                `${region.code} - 自动选择 - ${groupName}`,
                `${region.code} - 手动选择`,
              ]),
            ]
      };
    }),

    {
      name: "漏网之鱼",
      type: "select",
      proxies: [proxyName, "DIRECT"],
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/fish.svg",
      hidden: true,
    },
    {
      name: "广告拦截",
      type: "select",
      proxies: ["REJECT", "DIRECT", proxyName],
      icon: "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/block.svg",
      hidden: true,
    },
  ];

  const websiteSpecificAutoGroups =
    ["Steam", "Telegram", "ChatGPT", "Claude", "Spotify", "Google", "Microsoft", "Linux Do", "zrblog", "Binance"]
      .flatMap(groupName => {
        const isAIGroup = ["ChatGPT", "Claude"].includes(groupName);
        const isBinanceGroup = groupName === "Binance";
				const allowedRegexs = isAIGroup
				  ? autoProxyGroupRegexs.filter(r => aiLimitedCountries.includes(r.code))
				  : isBinanceGroup
				  ? autoProxyGroupRegexs.filter(r => binanceLimitedCountries.includes(r.code))
				  : autoProxyGroupRegexs;
        const aiCombinedRegex = new RegExp(
          countryRegions
            .filter(r => aiLimitedCountries.includes(r.code))
            .map(r => r.regex.source)
            .join("|"),
          "i"
        );

        return [
          {
            name: `ALL - 自动选择 - ${groupName}`,
            type: "url-test",
            url: getTestUrlForGroup(groupName),
            interval: 300,
            tolerance: 50,
						proxies: isAIGroup
						  ? getProxiesByRegex(params, aiCombinedRegex)
						  : isBinanceGroup
						  ? getProxiesByRegex(
						      params,
						      new RegExp(
						        countryRegions
						          .filter(r => binanceLimitedCountries.includes(r.code))
						          .map(r => r.regex.source)
						          .join("|"),
						        "i"
						      )
						    )
						  : allProxies,
            hidden: true,
          },

          ...allowedRegexs.map(item => ({
            name: `${item.name} - ${groupName}`,
            type: "url-test",
            url: getTestUrlForGroup(groupName),
            interval: 300,
            tolerance: 50,
            proxies: getProxiesByRegex(params, item.regex),
            hidden: true,
          })),

          ...(otherAutoProxyGroup && !isAIGroup ? [{
            name: `${otherAutoProxyGroup.name} - ${groupName}`,
            type: "url-test",
            url: getTestUrlForGroup(groupName),
            interval: 300,
            tolerance: 50,
            proxies: otherProxies,
            hidden: true,
          }] : [])
        ];
      });

  if (otherAutoProxyGroup) autoProxyGroups.push(otherAutoProxyGroup);
  groups.push(...autoProxyGroups);
  groups.push(...manualProxyGroupsConfig);
  if (otherManualProxyGroup) groups.push(otherManualProxyGroup);
  groups.push(...websiteSpecificAutoGroups);
  params["proxy-groups"] = groups;
}

function overwriteDns(params, proxyName) {
  const cnDnsList = [
    "https://223.5.5.5/dns-query",
    "https://1.12.12.12/dns-query",
  ];
  const trustDnsList = [
    "quic://dns.cooluc.com",
    "https://1.0.0.1/dns-query",
    "https://1.1.1.1/dns-query",
    "https://cloudflare-dns.com/dns-query",
  ];

  const dnsOptions = {
    enable: true,
    "prefer-h3": false,
    "default-nameserver": cnDnsList,
    nameserver: trustDnsList,
    "nameserver-policy": {
    	"domain:zrblog.net": ["223.5.5.5","1.12.12.12"],
    	"domain:www.zrblog.net": ["223.5.5.5","1.12.12.12"],
      "geosite:cn": cnDnsList,
      "geoip:cn": cnDnsList,
      "geosite:geolocation-!cn": trustDnsList,
      "domain:google.com,facebook.com,youtube.com,twitter.com,github.com,cloudflare.com,jsdelivr.net,hf.space": trustDnsList,
    },
    fallback: [],
    "fallback-filter": {
      "response-code": "REFUSED,SERVFAIL,NXDOMAIN",
    },
    "enhanced-mode": "redir-host",
    "fake-ip-range": "198.18.0.0/16",
    "system-dns": [],
    "use-hosts": true,
    "listen": "0.0.0.0:5353",

    "query-strategy": "USE_PROXY",
    cache: {
      enable: true,
      size: 4096,
      expire: 3600,
    },
  };

  const githubPrefix = "https://fastgh.lainbo.com/";
  const rawGeoxURLs = {
    geoip:
      "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
    geosite:
      "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    mmdb:
      "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
  };
  const accelURLs = Object.fromEntries(
    Object.entries(rawGeoxURLs).map(([key, githubUrl]) => [
      key,
      `${githubPrefix}${githubUrl}`,
    ])
  );

  const otherOptions = {
    "unified-delay": false,
    "tcp-concurrent": true,
    profile: { "store-selected": true, "store-fake-ip": true },
    sniffer: {
      enable: true,
      sniff: {
        TLS: { ports: [443, 8443] },
        HTTP: { ports: [80, "8080-8880"], "override-destination": true },
      },
    },
    "geodata-mode": true,
    "geox-url": accelURLs,
  	"fake-ip-filter": [
  	  "*.lan",
  	  "*.local",
  	  "*.msftconnecttest.com",
  	  "localhost.ptlogin2.qq.com",
  	  "+.stun.*",
  	  "zrblog.net",
  	  "geoip:cn"
  	],
  };

  params.dns = { ...params.dns, ...dnsOptions };
  Object.keys(otherOptions).forEach((key) => {
    params[key] = otherOptions[key];
  });

  params.rules = params.rules || [];
  params.rules.unshift("DOMAIN-KEYWORD,dns,代理模式");
}	

function getProxiesByRegex(params, regex) {
	const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name);
	return matchedProxies.length > 0 ? matchedProxies : ["手动选择"];
}

function getManualProxiesByRegex(params, regex) {
	const matchedProxies = params.proxies.filter((e) => regex.test(e.name)).map((e) => e.name);
	return regex.test("CN") 
	? ["DIRECT", ...matchedProxies]
	: matchedProxies.length > 0 
	? matchedProxies 
	: ["DIRECT", "手动选择", proxyName];
}