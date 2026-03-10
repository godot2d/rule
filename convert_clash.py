import re
import os

def parse_ini(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    proxy_groups = []
    rule_providers = {}
    rules = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith(';'):
            continue

        if line.startswith('ruleset='):
            # Format: ruleset=Group,URL
            content = line[len('ruleset='):]
            parts = content.split(',', 1)
            if len(parts) == 2:
                group_name = parts[0].strip()
                url = parts[1].strip()
                
                # Check for special case []FINAL
                if url == '[]FINAL':
                    rules.append(f"MATCH,{group_name.replace('[]', '')}")
                    continue

                # Derive provider name from URL filename
                filename = url.split('/')[-1]
                # Remove extension for name if possible, or just use filename
                provider_name = filename.replace('.list', '').replace('.txt', '')
                # Clean up name (remove special chars if needed, but usually fine)
                
                # Check for duplicates or collisions
                if provider_name in rule_providers:
                     # If same URL, skip or reuse. If different, append index.
                     if rule_providers[provider_name]['url'] != url:
                         provider_name = f"{provider_name}_{len(rule_providers)}"
                
                # Use provider_name in path to ensure uniqueness
                # Extract extension from original filename or default to .list
                ext = '.list'
                if '.' in filename:
                    ext = '.' + filename.split('.')[-1]
                
                rule_providers[provider_name] = {
                    'url': url,
                    'path': f"./ruleset/{provider_name}{ext}",
                    'behavior': 'classical',
                    'interval': 86400,
                    'format': 'text',
                    'type': 'http'
                }
                
                rules.append(f"RULE-SET,{provider_name},{group_name}")

        elif line.startswith('custom_proxy_group='):
            # Format: custom_proxy_group=Name`Type`Content`URL`Interval`...
            content = line[len('custom_proxy_group='):]
            parts = content.split('`')
            
            if len(parts) < 3:
                continue
                
            name = parts[0]
            g_type = parts[1]
            
            group = {
                'name': name,
                'type': g_type,
            }
            
            if g_type == 'select':
                # For select, parts[2:] are usually the proxies or includes
                # But sometimes it might be just a regex filter like .*
                # However, in the user's case, it's a list separated by backticks
                
                # Check if parts[2] looks like a regex or include-all
                # If it contains `[]`, it's likely a list of proxies
                # If it is exactly `.*` or similar regex, it is a filter
                
                # We collect all parts from 2 onwards
                potential_proxies = parts[2:]
                
                proxies = []
                include_all = False
                filter_expr = None
                
                for p in potential_proxies:
                    if p == '.*':
                        include_all = True
                    elif '[]' in p:
                        # It's a proxy group reference or proxy, e.g. []ProxyName
                        p_clean = p.replace('[]', '').strip()
                        if p_clean:
                            proxies.append(p_clean)
                    elif '(' in p and ')' in p:
                         # Likely a regex filter
                         include_all = True
                         filter_expr = p
                    else:
                        # Could be a direct proxy name or other keyword
                        # If it's just a string, assume it's a proxy
                        if p.strip():
                            proxies.append(p.strip())
                
                if proxies:
                    group['proxies'] = proxies
                
                if include_all:
                    group['include-all'] = True
                
                if filter_expr:
                    group['filter'] = filter_expr
                    
            elif g_type == 'url-test':
                # parts: Name, Type, Filter, URL, Interval...
                # Usually: Name`url-test`Filter`URL`Interval`Tolerance
                
                proxies_or_filter = parts[2]
                
                if len(parts) >= 4:
                    group['url'] = parts[3]
                    
                    if len(parts) >= 5:
                        # part 4 might be "300,,50"
                        interval_part = parts[4]
                        if ',' in interval_part:
                            i_parts = interval_part.split(',')
                            group['interval'] = int(i_parts[0]) if i_parts[0] else 300
                            if len(i_parts) > 2 and i_parts[2]:
                                group['tolerance'] = int(i_parts[2])
                        else:
                            group['interval'] = int(interval_part)
                
                # Filter handling
                if proxies_or_filter == '.*':
                    group['include-all'] = True
                else:
                    group['include-all'] = True
                    group['filter'] = proxies_or_filter

            proxy_groups.append(group)

    return proxy_groups, rule_providers, rules

def generate_yaml(proxy_groups, rule_providers, rules, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        # Write proxy-groups
        f.write('proxy-groups:\n')
        for group in proxy_groups:
            f.write(f"  - name: {group['name']}\n")
            f.write(f"    type: {group['type']}\n")
            
            if 'include-all' in group:
                f.write(f"    include-all: {str(group['include-all']).lower()}\n")
            
            if 'filter' in group:
                f.write(f"    filter: {group['filter']}\n")
                
            if 'url' in group:
                f.write(f"    url: {group['url']}\n")
                
            if 'interval' in group:
                f.write(f"    interval: {group['interval']}\n")
                
            if 'tolerance' in group:
                f.write(f"    tolerance: {group['tolerance']}\n")
                
            if 'proxies' in group:
                f.write('    proxies:\n')
                for p in group['proxies']:
                    f.write(f"      - {p}\n")
        
        f.write('\n')
        
        # Write rule-providers
        f.write('rule-providers:\n')
        for name, provider in rule_providers.items():
            f.write(f"  {name}:\n")
            f.write(f"    url: {provider['url']}\n")
            f.write(f"    path: {provider['path']}\n")
            f.write(f"    behavior: {provider['behavior']}\n")
            f.write(f"    interval: {provider['interval']}\n")
            f.write(f"    format: {provider['format']}\n")
            f.write(f"    type: {provider['type']}\n")
            
        f.write('\n')
        
        # Write rules
        f.write('rules:\n')
        for rule in rules:
            f.write(f"  - {rule}\n")

if __name__ == '__main__':
    ini_path = r'f:\git\rule\myClash.ini'
    yaml_path = r'f:\git\rule\myclash.yml'
    
    pg, rp, r = parse_ini(ini_path)
    generate_yaml(pg, rp, r, yaml_path)
    print("Conversion complete.")
