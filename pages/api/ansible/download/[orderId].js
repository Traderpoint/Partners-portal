export default function handler(req, res) {
  const { orderId } = req.query;
  const { file } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  // In production, you would fetch this from database
  // For now, we'll simulate the data
  const mockAnsibleData = {
    orderId,
    timestamp: new Date().toISOString(),
    files: {
      'playbook.yml': `---
- name: Setup VPS Server
  hosts: all
  become: yes
  vars:
    server_hostname: "vps-${orderId.split('-')[1]}"
    
  tasks:
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: dist
      when: ansible_os_family == "Debian"
      
    - name: Install basic packages
      apt:
        name:
          - curl
          - wget
          - git
          - htop
          - vim
        state: present
      when: ansible_os_family == "Debian"
      
    - name: Set hostname
      hostname:
        name: "{{ server_hostname }}"
        
    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ item }}"
      loop:
        - '22'
        - '80'
        - '443'`,

      'inventory.yml': `[webservers]
vps-${orderId.split('-')[1]} ansible_host=YOUR_SERVER_IP ansible_user=root

[webservers:vars]
ansible_ssh_private_key_file=~/.ssh/id_rsa
ansible_ssh_common_args='-o StrictHostKeyChecking=no'`,

      'ansible.cfg': `[defaults]
inventory = ./inventory.yml
host_key_checking = False
retry_files_enabled = False
stdout_callback = yaml
gathering = smart
fact_caching = memory

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o UserKnownHostsFile=/dev/null -o IdentitiesOnly=yes`,

      'group_vars/all.yml': `---
# Global variables for all servers
timezone: "Europe/Prague"
locale: "cs_CZ.UTF-8"

# Security settings
fail2ban_enabled: true
automatic_updates: true

# Backup settings
backup_enabled: true
backup_retention_days: 30`,

      'README.md': `# Ansible VPS Setup - Order ${orderId}

## Generated Configuration

**Order ID:** ${orderId}
**Generated:** ${new Date().toLocaleString('cs-CZ')}
**Hostname:** vps-${orderId.split('-')[1]}

## Quick Start

1. **Update inventory.yml** with your server IP:
   \`\`\`yaml
   [webservers]
   vps-${orderId.split('-')[1]} ansible_host=YOUR_ACTUAL_SERVER_IP ansible_user=root
   \`\`\`

2. **Test connection:**
   \`\`\`bash
   ansible all -m ping
   \`\`\`

3. **Run syntax check:**
   \`\`\`bash
   ansible-playbook --syntax-check playbook.yml
   \`\`\`

4. **Deploy (dry run):**
   \`\`\`bash
   ansible-playbook --check --diff playbook.yml
   \`\`\`

5. **Deploy for real:**
   \`\`\`bash
   ansible-playbook playbook.yml
   \`\`\`

## Support

For technical support, contact: podpora@systrix.cz
Phone: +420 123 456 789`,

      'deploy.sh': `#!/bin/bash
# Deployment script for Order ${orderId}

echo "🚀 Starting deployment for ${orderId}"
echo "📅 $(date)"

# Check if Ansible is installed
if ! command -v ansible &> /dev/null; then
    echo "❌ Ansible is not installed. Please install it first."
    exit 1
fi

# Check if inventory file exists
if [ ! -f "inventory.yml" ]; then
    echo "❌ inventory.yml not found!"
    exit 1
fi

echo "🔍 Testing connection..."
ansible all -m ping

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
    echo "🔧 Running syntax check..."
    ansible-playbook --syntax-check playbook.yml
    
    if [ $? -eq 0 ]; then
        echo "✅ Syntax check passed!"
        echo "🚀 Starting deployment..."
        ansible-playbook playbook.yml
    else
        echo "❌ Syntax check failed!"
        exit 1
    fi
else
    echo "❌ Connection failed! Please check your inventory.yml"
    exit 1
fi

echo "🎉 Deployment completed for ${orderId}"`
    }
  };

  // If specific file is requested
  if (file) {
    const fileContent = mockAnsibleData.files[file];
    if (!fileContent) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers for file download
    const extension = file.split('.').pop();
    const contentType = extension === 'yml' || extension === 'yaml' ? 'text/yaml' : 
                       extension === 'sh' ? 'text/x-shellscript' :
                       extension === 'md' ? 'text/markdown' : 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    return res.status(200).send(fileContent);
  }

  // Return all files info
  const filesList = Object.keys(mockAnsibleData.files).map(filename => ({
    name: filename,
    size: mockAnsibleData.files[filename].length,
    downloadUrl: `/api/ansible/download/${orderId}?file=${encodeURIComponent(filename)}`
  }));

  res.status(200).json({
    orderId,
    timestamp: mockAnsibleData.timestamp,
    files: filesList,
    totalFiles: filesList.length
  });
}
