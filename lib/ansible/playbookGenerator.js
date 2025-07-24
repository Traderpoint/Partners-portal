/**
 * Ansible Playbook Generator for VPS Application Installation
 * Generates YAML playbooks based on selected applications and OS
 */

class AnsiblePlaybookGenerator {
  constructor() {
    this.applicationTasks = {
      // Web Servers
      nginx: {
        name: 'Install and configure Nginx',
        tasks: {
          linux: [
            {
              name: 'Install Nginx',
              'ansible.builtin.package': {
                name: 'nginx',
                state: 'present'
              }
            },
            {
              name: 'Start and enable Nginx',
              'ansible.builtin.systemd_service': {
                name: 'nginx',
                state: 'started',
                enabled: true
              }
            },
            {
              name: 'Configure firewall for HTTP/HTTPS',
              'ansible.builtin.iptables': {
                chain: 'INPUT',
                protocol: 'tcp',
                destination_port: ['80', '443'],
                jump: 'ACCEPT'
              }
            }
          ],
          windows: [
            {
              name: 'Download Nginx for Windows',
              'ansible.builtin.get_url': {
                url: 'http://nginx.org/download/nginx-1.24.0.zip',
                dest: 'C:\\temp\\nginx.zip'
              }
            },
            {
              name: 'Extract Nginx',
              'ansible.builtin.unarchive': {
                src: 'C:\\temp\\nginx.zip',
                dest: 'C:\\nginx',
                remote_src: true
              }
            }
          ]
        }
      },

      // CMS Systems
      wordpress: {
        name: 'Install WordPress with dependencies',
        dependencies: ['nginx', 'php', 'mysql'],
        tasks: {
          linux: [
            {
              name: 'Install PHP and extensions',
              'ansible.builtin.package': {
                name: ['php-fpm', 'php-mysql', 'php-curl', 'php-gd', 'php-xml'],
                state: 'present'
              }
            },
            {
              name: 'Download WordPress',
              'ansible.builtin.get_url': {
                url: 'https://wordpress.org/latest.tar.gz',
                dest: '/tmp/wordpress.tar.gz'
              }
            },
            {
              name: 'Extract WordPress',
              'ansible.builtin.unarchive': {
                src: '/tmp/wordpress.tar.gz',
                dest: '/var/www/html',
                remote_src: true,
                owner: 'www-data',
                group: 'www-data'
              }
            },
            {
              name: 'Create WordPress database',
              'ansible.builtin.mysql_db': {
                name: 'wordpress',
                state: 'present'
              }
            },
            {
              name: 'Create WordPress user',
              'ansible.builtin.mysql_user': {
                name: 'wpuser',
                password: '{{ wordpress_db_password }}',
                priv: 'wordpress.*:ALL',
                state: 'present'
              }
            }
          ]
        }
      },

      // Databases
      mysql: {
        name: 'Install and configure MySQL',
        tasks: {
          linux: [
            {
              name: 'Install MySQL server',
              'ansible.builtin.package': {
                name: 'mysql-server',
                state: 'present'
              }
            },
            {
              name: 'Start and enable MySQL',
              'ansible.builtin.systemd_service': {
                name: 'mysql',
                state: 'started',
                enabled: true
              }
            },
            {
              name: 'Secure MySQL installation',
              'ansible.builtin.mysql_user': {
                name: 'root',
                password: '{{ mysql_root_password }}',
                login_unix_socket: '/var/run/mysqld/mysqld.sock'
              }
            },
            {
              name: 'Remove anonymous users',
              'ansible.builtin.mysql_user': {
                name: '',
                host_all: true,
                state: 'absent'
              }
            }
          ]
        }
      },

      postgresql: {
        name: 'Install and configure PostgreSQL',
        tasks: {
          linux: [
            {
              name: 'Install PostgreSQL',
              'ansible.builtin.package': {
                name: ['postgresql', 'postgresql-contrib', 'python3-psycopg2'],
                state: 'present'
              }
            },
            {
              name: 'Start and enable PostgreSQL',
              'ansible.builtin.systemd_service': {
                name: 'postgresql',
                state: 'started',
                enabled: true
              }
            },
            {
              name: 'Create application database',
              'ansible.builtin.postgresql_db': {
                name: 'appdb',
                state: 'present'
              },
              become_user: 'postgres'
            }
          ]
        }
      },

      // Development Tools
      docker: {
        name: 'Install Docker and Docker Compose',
        tasks: {
          linux: [
            {
              name: 'Install required packages',
              'ansible.builtin.package': {
                name: ['apt-transport-https', 'ca-certificates', 'curl', 'gnupg', 'lsb-release'],
                state: 'present'
              }
            },
            {
              name: 'Add Docker GPG key',
              'ansible.builtin.apt_key': {
                url: 'https://download.docker.com/linux/ubuntu/gpg',
                state: 'present'
              }
            },
            {
              name: 'Add Docker repository',
              'ansible.builtin.apt_repository': {
                repo: 'deb https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable',
                state: 'present'
              }
            },
            {
              name: 'Install Docker',
              'ansible.builtin.package': {
                name: ['docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-compose-plugin'],
                state: 'present'
              }
            },
            {
              name: 'Start and enable Docker',
              'ansible.builtin.systemd_service': {
                name: 'docker',
                state: 'started',
                enabled: true
              }
            },
            {
              name: 'Add user to docker group',
              'ansible.builtin.user': {
                name: '{{ ansible_user }}',
                groups: 'docker',
                append: true
              }
            }
          ]
        }
      },

      nodejs: {
        name: 'Install Node.js and NPM',
        tasks: {
          linux: [
            {
              name: 'Install Node.js repository',
              'ansible.builtin.shell': 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -'
            },
            {
              name: 'Install Node.js',
              'ansible.builtin.package': {
                name: 'nodejs',
                state: 'present'
              }
            },
            {
              name: 'Install global npm packages',
              'ansible.builtin.npm': {
                name: ['pm2', 'nodemon'],
                global: true
              }
            }
          ]
        }
      },

      // Runtime Environments
      php: {
        name: 'Install PHP and common extensions',
        tasks: {
          linux: [
            {
              name: 'Install PHP and extensions',
              'ansible.builtin.package': {
                name: [
                  'php', 'php-fpm', 'php-mysql', 'php-pgsql', 'php-sqlite3',
                  'php-curl', 'php-gd', 'php-xml', 'php-mbstring', 'php-zip',
                  'php-json', 'php-bcmath', 'php-intl'
                ],
                state: 'present'
              }
            },
            {
              name: 'Configure PHP-FPM',
              'ansible.builtin.lineinfile': {
                path: '/etc/php/8.1/fpm/php.ini',
                regexp: '^;?{{ item.key }}',
                line: '{{ item.key }} = {{ item.value }}'
              },
              loop: [
                { key: 'upload_max_filesize', value: '64M' },
                { key: 'post_max_size', value: '64M' },
                { key: 'memory_limit', value: '256M' },
                { key: 'max_execution_time', value: '300' }
              ]
            },
            {
              name: 'Start and enable PHP-FPM',
              'ansible.builtin.systemd_service': {
                name: 'php8.1-fpm',
                state: 'started',
                enabled: true
              }
            }
          ]
        }
      },

      // Security Tools
      certbot: {
        name: 'Install Certbot for SSL certificates',
        dependencies: ['nginx'],
        tasks: {
          linux: [
            {
              name: 'Install Certbot',
              'ansible.builtin.package': {
                name: ['certbot', 'python3-certbot-nginx'],
                state: 'present'
              }
            },
            {
              name: 'Create SSL certificate renewal cron job',
              'ansible.builtin.cron': {
                name: 'Renew SSL certificates',
                minute: '0',
                hour: '12',
                job: '/usr/bin/certbot renew --quiet'
              }
            }
          ]
        }
      },

      fail2ban: {
        name: 'Install and configure Fail2Ban',
        tasks: {
          linux: [
            {
              name: 'Install Fail2Ban',
              'ansible.builtin.package': {
                name: 'fail2ban',
                state: 'present'
              }
            },
            {
              name: 'Configure Fail2Ban jail',
              'ansible.builtin.template': {
                src: 'jail.local.j2',
                dest: '/etc/fail2ban/jail.local'
              }
            },
            {
              name: 'Start and enable Fail2Ban',
              'ansible.builtin.systemd_service': {
                name: 'fail2ban',
                state: 'started',
                enabled: true
              }
            }
          ]
        }
      },

      // Monitoring Tools
      htop: {
        name: 'Install system monitoring tools',
        tasks: {
          linux: [
            {
              name: 'Install monitoring tools',
              'ansible.builtin.package': {
                name: ['htop', 'iotop', 'nethogs', 'ncdu'],
                state: 'present'
              }
            }
          ]
        }
      },

      // Version Control
      git: {
        name: 'Install Git version control',
        tasks: {
          linux: [
            {
              name: 'Install Git',
              'ansible.builtin.package': {
                name: 'git',
                state: 'present'
              }
            },
            {
              name: 'Configure Git global settings',
              'ansible.builtin.git_config': {
                name: '{{ item.name }}',
                value: '{{ item.value }}',
                scope: 'global'
              },
              loop: [
                { name: 'init.defaultBranch', value: 'main' },
                { name: 'pull.rebase', value: 'false' }
              ]
            }
          ]
        }
      }
    };
  }

  /**
   * Generate complete Ansible playbook
   */
  generatePlaybook(selectedApps, operatingSystem, serverConfig) {
    const playbook = {
      name: `VPS Setup - ${serverConfig.hostname || 'server'}`,
      hosts: 'all',
      become: true,
      vars: this.generateVariables(selectedApps, operatingSystem, serverConfig),
      tasks: this.generateTasks(selectedApps, operatingSystem)
    };

    return this.convertToYAML([playbook]);
  }

  /**
   * Generate variables section
   */
  generateVariables(selectedApps, operatingSystem, serverConfig) {
    const vars = {
      ansible_user: 'root',
      server_hostname: serverConfig.hostname || 'vps-server',
      timezone: 'Europe/Prague'
    };

    // Add application-specific variables
    if (selectedApps.includes('mysql')) {
      vars.mysql_root_password = '{{ vault_mysql_root_password }}';
    }

    if (selectedApps.includes('wordpress')) {
      vars.wordpress_db_password = '{{ vault_wordpress_db_password }}';
      vars.wordpress_domain = serverConfig.domain || 'example.com';
    }

    return vars;
  }

  /**
   * Generate tasks based on selected applications
   */
  generateTasks(selectedApps, operatingSystem) {
    const tasks = [];

    // System preparation tasks
    tasks.push(...this.getSystemPreparationTasks(operatingSystem));

    // Resolve dependencies and sort applications
    const sortedApps = this.resolveDependencies(selectedApps);

    // Generate tasks for each application
    sortedApps.forEach(appId => {
      const app = this.applicationTasks[appId];
      if (app && app.tasks[operatingSystem]) {
        tasks.push({
          name: `--- ${app.name} ---`,
          'ansible.builtin.debug': {
            msg: `Installing ${app.name}`
          }
        });
        tasks.push(...app.tasks[operatingSystem]);
      }
    });

    // System finalization tasks
    tasks.push(...this.getSystemFinalizationTasks(operatingSystem));

    return tasks;
  }

  /**
   * Get system preparation tasks
   */
  getSystemPreparationTasks(operatingSystem) {
    if (operatingSystem === 'linux') {
      return [
        {
          name: 'Update package cache',
          'ansible.builtin.apt': {
            update_cache: true,
            cache_valid_time: 3600
          }
        },
        {
          name: 'Upgrade all packages',
          'ansible.builtin.apt': {
            upgrade: 'dist'
          }
        },
        {
          name: 'Install essential packages',
          'ansible.builtin.package': {
            name: ['curl', 'wget', 'unzip', 'software-properties-common', 'apt-transport-https'],
            state: 'present'
          }
        },
        {
          name: 'Set timezone',
          'ansible.builtin.timezone': {
            name: '{{ timezone }}'
          }
        },
        {
          name: 'Set hostname',
          'ansible.builtin.hostname': {
            name: '{{ server_hostname }}'
          }
        }
      ];
    }
    return [];
  }

  /**
   * Get system finalization tasks
   */
  getSystemFinalizationTasks(operatingSystem) {
    if (operatingSystem === 'linux') {
      return [
        {
          name: 'Clean package cache',
          'ansible.builtin.apt': {
            autoclean: true,
            autoremove: true
          }
        },
        {
          name: 'Reboot if required',
          'ansible.builtin.reboot': {
            reboot_timeout: 300
          },
          when: 'ansible_reboot_required is defined and ansible_reboot_required'
        }
      ];
    }
    return [];
  }

  /**
   * Resolve application dependencies
   */
  resolveDependencies(selectedApps) {
    const resolved = new Set();
    const visiting = new Set();

    const visit = (appId) => {
      if (visiting.has(appId)) {
        throw new Error(`Circular dependency detected: ${appId}`);
      }
      if (resolved.has(appId)) {
        return;
      }

      visiting.add(appId);
      
      const app = this.applicationTasks[appId];
      if (app && app.dependencies) {
        app.dependencies.forEach(dep => {
          if (selectedApps.includes(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(appId);
      resolved.add(appId);
    };

    selectedApps.forEach(appId => visit(appId));
    return Array.from(resolved);
  }

  /**
   * Convert playbook object to YAML string
   */
  convertToYAML(playbook) {
    // Simple YAML conversion (in production, use a proper YAML library)
    return `---
${this.objectToYAML(playbook, 0)}`;
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
        if (typeof item === 'object') {
          yaml += '\n' + this.objectToYAML(item, indent + 1);
        } else {
          yaml += `${item}\n`;
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        yaml += `${spaces}${key}:`;
        if (typeof value === 'object') {
          yaml += '\n' + this.objectToYAML(value, indent + 1);
        } else {
          yaml += ` ${value}\n`;
        }
      });
    }

    return yaml;
  }
}

module.exports = AnsiblePlaybookGenerator;
