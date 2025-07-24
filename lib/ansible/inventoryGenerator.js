/**
 * Ansible Inventory Generator
 * Creates dynamic inventory files for VPS servers
 */

class AnsibleInventoryGenerator {
  constructor() {
    this.defaultSSHConfig = {
      ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
      ansible_ssh_pipelining: true,
      ansible_python_interpreter: '/usr/bin/python3'
    };
  }

  /**
   * Generate inventory for single VPS
   */
  generateSingleVPS(serverConfig) {
    const inventory = {
      all: {
        hosts: {
          [serverConfig.hostname]: {
            ansible_host: serverConfig.ip_address,
            ansible_user: serverConfig.ssh_user || 'root',
            ansible_ssh_private_key_file: serverConfig.ssh_key_path || '~/.ssh/id_rsa',
            ...this.defaultSSHConfig,
            // Server specific variables
            server_type: serverConfig.server_type || 'vps',
            operating_system: serverConfig.operating_system || 'linux',
            applications: serverConfig.applications || [],
            server_specs: {
              cpu: serverConfig.cpu || '2',
              ram: serverConfig.ram || '4GB',
              storage: serverConfig.storage || '50GB'
            }
          }
        },
        vars: {
          ansible_connection: 'ssh',
          ansible_ssh_timeout: 30,
          gather_facts: true
        }
      }
    };

    return this.convertToYAML(inventory);
  }

  /**
   * Generate inventory for multiple VPS servers
   */
  generateMultipleVPS(servers) {
    const inventory = {
      all: {
        children: {
          vps_servers: {
            hosts: {},
            vars: {
              ...this.defaultSSHConfig,
              ansible_connection: 'ssh'
            }
          }
        }
      }
    };

    // Group servers by OS
    const linuxServers = {};
    const windowsServers = {};

    servers.forEach(server => {
      const hostConfig = {
        ansible_host: server.ip_address,
        ansible_user: server.ssh_user || 'root',
        ansible_ssh_private_key_file: server.ssh_key_path || '~/.ssh/id_rsa',
        server_type: server.server_type || 'vps',
        applications: server.applications || [],
        server_specs: {
          cpu: server.cpu || '2',
          ram: server.ram || '4GB',
          storage: server.storage || '50GB'
        }
      };

      if (server.operating_system === 'windows') {
        windowsServers[server.hostname] = {
          ...hostConfig,
          ansible_connection: 'winrm',
          ansible_winrm_transport: 'basic',
          ansible_winrm_server_cert_validation: 'ignore'
        };
      } else {
        linuxServers[server.hostname] = hostConfig;
      }
    });

    // Add OS-specific groups
    if (Object.keys(linuxServers).length > 0) {
      inventory.all.children.linux_servers = {
        hosts: linuxServers,
        vars: {
          ansible_python_interpreter: '/usr/bin/python3',
          operating_system: 'linux'
        }
      };
    }

    if (Object.keys(windowsServers).length > 0) {
      inventory.all.children.windows_servers = {
        hosts: windowsServers,
        vars: {
          ansible_python_interpreter: 'python',
          operating_system: 'windows'
        }
      };
    }

    // Add all hosts to main group
    inventory.all.children.vps_servers.hosts = { ...linuxServers, ...windowsServers };

    return this.convertToYAML(inventory);
  }

  /**
   * Generate inventory with application groups
   */
  generateApplicationGroups(servers) {
    const inventory = {
      all: {
        children: {
          vps_servers: {
            hosts: {},
            vars: this.defaultSSHConfig
          }
        }
      }
    };

    const applicationGroups = {};
    const allHosts = {};

    servers.forEach(server => {
      const hostConfig = {
        ansible_host: server.ip_address,
        ansible_user: server.ssh_user || 'root',
        ansible_ssh_private_key_file: server.ssh_key_path || '~/.ssh/id_rsa',
        operating_system: server.operating_system || 'linux',
        applications: server.applications || []
      };

      allHosts[server.hostname] = hostConfig;

      // Group by applications
      if (server.applications) {
        server.applications.forEach(app => {
          if (!applicationGroups[app]) {
            applicationGroups[app] = {
              hosts: {},
              vars: {
                application_name: app
              }
            };
          }
          applicationGroups[app].hosts[server.hostname] = hostConfig;
        });
      }
    });

    // Add application groups
    Object.entries(applicationGroups).forEach(([appName, group]) => {
      inventory.all.children[`${appName}_servers`] = group;
    });

    inventory.all.children.vps_servers.hosts = allHosts;

    return this.convertToYAML(inventory);
  }

  /**
   * Generate dynamic inventory script
   */
  generateDynamicInventory(servers) {
    const script = `#!/usr/bin/env python3
"""
Dynamic Ansible Inventory for VPS Servers
Generated automatically by Systrix VPS Management
"""

import json
import sys

def get_inventory():
    inventory = ${JSON.stringify(this.generateInventoryObject(servers), null, 2)}
    return inventory

def get_host_vars(hostname):
    inventory = get_inventory()
    
    # Search for host in all groups
    for group_name, group_data in inventory.items():
        if group_name == '_meta':
            continue
            
        if 'hosts' in group_data and hostname in group_data['hosts']:
            return group_data['hosts'][hostname]
    
    return {}

if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == '--list':
        print(json.dumps(get_inventory(), indent=2))
    elif len(sys.argv) == 3 and sys.argv[1] == '--host':
        print(json.dumps(get_host_vars(sys.argv[2]), indent=2))
    else:
        print("Usage: {} --list | --host <hostname>".format(sys.argv[0]))
        sys.exit(1)
`;

    return script;
  }

  /**
   * Generate inventory object for dynamic script
   */
  generateInventoryObject(servers) {
    const inventory = {
      _meta: {
        hostvars: {}
      },
      all: {
        children: ['vps_servers']
      },
      vps_servers: {
        hosts: [],
        vars: this.defaultSSHConfig
      }
    };

    const applicationGroups = new Set();

    servers.forEach(server => {
      const hostname = server.hostname;
      
      // Add to main group
      inventory.vps_servers.hosts.push(hostname);
      
      // Add host variables
      inventory._meta.hostvars[hostname] = {
        ansible_host: server.ip_address,
        ansible_user: server.ssh_user || 'root',
        ansible_ssh_private_key_file: server.ssh_key_path || '~/.ssh/id_rsa',
        operating_system: server.operating_system || 'linux',
        applications: server.applications || [],
        server_specs: {
          cpu: server.cpu || '2',
          ram: server.ram || '4GB',
          storage: server.storage || '50GB'
        }
      };

      // Create application groups
      if (server.applications) {
        server.applications.forEach(app => {
          const groupName = `${app}_servers`;
          applicationGroups.add(groupName);
          
          if (!inventory[groupName]) {
            inventory[groupName] = {
              hosts: [],
              vars: {
                application_name: app
              }
            };
          }
          
          inventory[groupName].hosts.push(hostname);
        });
      }
    });

    // Add application groups to all children
    inventory.all.children.push(...Array.from(applicationGroups));

    return inventory;
  }

  /**
   * Convert inventory object to YAML
   */
  convertToYAML(obj) {
    return this.objectToYAML(obj, 0);
  }

  /**
   * Convert object to YAML format
   */
  objectToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- `;
        if (typeof item === 'object' && item !== null) {
          yaml += '\n' + this.objectToYAML(item, indent + 1);
        } else {
          yaml += `${item}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        yaml += `${spaces}${key}:`;
        if (Array.isArray(value)) {
          yaml += '\n' + this.objectToYAML(value, indent + 1);
        } else if (typeof value === 'object' && value !== null) {
          yaml += '\n' + this.objectToYAML(value, indent + 1);
        } else {
          yaml += ` ${value}\n`;
        }
      });
    }

    return yaml;
  }

  /**
   * Generate Ansible configuration file
   */
  generateAnsibleConfig(options = {}) {
    const config = `[defaults]
inventory = ${options.inventory_path || './inventory.yml'}
host_key_checking = False
timeout = 30
gathering = smart
fact_caching = memory
fact_caching_timeout = 86400
stdout_callback = yaml
bin_ansible_callbacks = True
callback_whitelist = profile_tasks, timer

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[inventory]
enable_plugins = yaml, ini, auto, host_list, script

[colors]
highlight = white
verbose = blue
warn = bright purple
error = red
debug = dark gray
deprecate = purple
skip = cyan
unreachable = red
ok = green
changed = yellow
diff_add = green
diff_remove = red
diff_lines = cyan
`;

    return config;
  }
}

module.exports = AnsibleInventoryGenerator;
