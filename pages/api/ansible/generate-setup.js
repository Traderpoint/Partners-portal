/**
 * API Endpoint for Ansible Setup Generation
 * Generates Ansible playbooks and inventories for VPS setup
 */

const AnsiblePlaybookGenerator = require('../../../lib/ansible/playbookGenerator');
const AnsibleInventoryGenerator = require('../../../lib/ansible/inventoryGenerator');
const AnsibleExecutionEngine = require('../../../lib/ansible/executionEngine');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, serverConfig } = req.body;

    if (!orderId || !serverConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize generators
    const playbookGenerator = new AnsiblePlaybookGenerator();
    const inventoryGenerator = new AnsibleInventoryGenerator();

    // Prepare server configuration
    const serverSetup = {
      hostname: serverConfig.hostname || `vps-${orderId}`,
      ip_address: '{{ server_ip }}', // Will be replaced with actual IP
      ssh_user: 'root',
      ssh_key_path: '~/.ssh/vps_deployment_key',
      operating_system: serverConfig.operatingSystem || 'linux',
      applications: serverConfig.applications || [],
      cpu: serverConfig.serverSpecs?.cpu || '2 CPU',
      ram: serverConfig.serverSpecs?.ram || '4 GB RAM',
      storage: serverConfig.serverSpecs?.storage || '50 GB NVMe SSD',
      customer: {
        name: `${serverConfig.customerData?.firstName} ${serverConfig.customerData?.lastName}`,
        email: serverConfig.customerData?.email,
        company: serverConfig.customerData?.company
      }
    };

    // Generate Ansible playbook
    const playbook = playbookGenerator.generatePlaybook(
      serverConfig.applications,
      serverConfig.operatingSystem,
      serverSetup
    );

    // Generate inventory
    const inventory = inventoryGenerator.generateSingleVPS(serverSetup);

    // Generate additional files
    const ansibleConfig = inventoryGenerator.generateAnsibleConfig({
      inventory_path: './inventory.yml'
    });

    // Create deployment package
    const deploymentPackage = {
      orderId,
      timestamp: new Date().toISOString(),
      serverConfig: serverSetup,
      files: {
        'playbook.yml': playbook,
        'inventory.yml': inventory,
        'ansible.cfg': ansibleConfig,
        'group_vars/all.yml': generateGroupVars(serverConfig),
        'README.md': generateReadme(serverSetup),
        'deploy.sh': generateDeployScript(serverSetup.hostname)
      },
      commands: {
        syntax_check: `ansible-playbook --syntax-check -i inventory.yml playbook.yml`,
        dry_run: `ansible-playbook --check --diff -i inventory.yml playbook.yml`,
        deploy: `ansible-playbook -i inventory.yml playbook.yml`,
        deploy_verbose: `ansible-playbook -vvv -i inventory.yml playbook.yml`
      }
    };

    // Add host_vars file dynamically
    deploymentPackage.files[`host_vars/${serverSetup.hostname}.yml`] = generateHostVars(serverSetup);

    // Store deployment package (in production, save to database or file system)
    console.log(`Generated Ansible setup for order ${orderId}:`, {
      hostname: serverSetup.hostname,
      os: serverConfig.operatingSystem,
      applications: serverConfig.applications,
      customer: serverSetup.customer.email
    });

    // Return success response
    res.status(200).json({
      success: true,
      orderId,
      deploymentId: `deploy-${orderId}`,
      message: 'Ansible setup generated successfully',
      serverConfig: serverSetup,
      files: Object.keys(deploymentPackage.files),
      commands: deploymentPackage.commands,
      nextSteps: [
        'Server will be provisioned automatically',
        'Ansible playbook will be executed during setup',
        'Applications will be installed and configured',
        'You will receive setup completion notification'
      ]
    });

  } catch (error) {
    console.error('Ansible setup generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Ansible setup',
      details: error.message
    });
  }
}

/**
 * Generate group variables
 */
function generateGroupVars(serverConfig) {
  return `---
# Global variables for all servers
timezone: "Europe/Prague"
locale: "cs_CZ.UTF-8"

# Security settings
ssh_port: 22
disable_root_login: false
enable_firewall: true

# Application settings
${serverConfig.applications?.includes('nginx') ? `
nginx:
  worker_processes: auto
  worker_connections: 1024
  keepalive_timeout: 65
` : ''}

${serverConfig.applications?.includes('mysql') ? `
mysql:
  root_password: "{{ vault_mysql_root_password }}"
  max_connections: 100
  innodb_buffer_pool_size: "128M"
` : ''}

${serverConfig.applications?.includes('php') ? `
php:
  version: "8.1"
  memory_limit: "256M"
  upload_max_filesize: "64M"
  post_max_size: "64M"
` : ''}

# Customer information
customer:
  name: "${serverConfig.customerData?.firstName} ${serverConfig.customerData?.lastName}"
  email: "${serverConfig.customerData?.email}"
  company: "${serverConfig.customerData?.company || 'N/A'}"
`;
}

/**
 * Generate host-specific variables
 */
function generateHostVars(serverSetup) {
  return `---
# Host-specific variables for ${serverSetup.hostname}

# Server specifications
server_specs:
  cpu: "${serverSetup.cpu}"
  ram: "${serverSetup.ram}"
  storage: "${serverSetup.storage}"

# Network configuration
network:
  hostname: "${serverSetup.hostname}"
  domain: "{{ server_domain | default('example.com') }}"

# Applications to install
applications: ${JSON.stringify(serverSetup.applications, null, 2)}

# OS-specific settings
${serverSetup.operating_system === 'windows' ? `
windows:
  features:
    - IIS-WebServerRole
    - IIS-WebServer
    - IIS-CommonHttpFeatures
` : `
linux:
  packages:
    - curl
    - wget
    - unzip
    - htop
    - vim
`}
`;
}

/**
 * Generate README documentation
 */
function generateReadme(serverSetup) {
  return `# VPS Setup for ${serverSetup.hostname}

This directory contains Ansible configuration for setting up your VPS server.

## Server Specifications
- **Hostname:** ${serverSetup.hostname}
- **OS:** ${serverSetup.operating_system}
- **CPU:** ${serverSetup.cpu}
- **RAM:** ${serverSetup.ram}
- **Storage:** ${serverSetup.storage}

## Applications to Install
${serverSetup.applications.map(app => `- ${app}`).join('\n')}

## Files Description
- \`playbook.yml\` - Main Ansible playbook
- \`inventory.yml\` - Server inventory
- \`ansible.cfg\` - Ansible configuration
- \`group_vars/all.yml\` - Global variables
- \`host_vars/${serverSetup.hostname}.yml\` - Host-specific variables

## Usage

### 1. Prerequisites
\`\`\`bash
# Install Ansible
pip install ansible

# Verify installation
ansible --version
\`\`\`

### 2. Test Connection
\`\`\`bash
ansible all -i inventory.yml -m ping
\`\`\`

### 3. Check Syntax
\`\`\`bash
ansible-playbook --syntax-check -i inventory.yml playbook.yml
\`\`\`

### 4. Dry Run
\`\`\`bash
ansible-playbook --check --diff -i inventory.yml playbook.yml
\`\`\`

### 5. Deploy
\`\`\`bash
ansible-playbook -i inventory.yml playbook.yml
\`\`\`

### 6. Deploy with Verbose Output
\`\`\`bash
ansible-playbook -vvv -i inventory.yml playbook.yml
\`\`\`

## Security Notes
- Ensure SSH key authentication is configured
- Update vault passwords before deployment
- Review firewall rules in the playbook
- Change default passwords after deployment

## Support
For technical support, contact: podpora@systrix.cz
`;
}

/**
 * Generate deployment script
 */
function generateDeployScript(hostname) {
  return `#!/bin/bash
# Automated deployment script for ${hostname}

set -e

echo "🚀 Starting VPS deployment for ${hostname}"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v ansible &> /dev/null; then
    echo -e "\${RED}❌ Ansible is not installed\${NC}"
    echo "Please install Ansible: pip install ansible"
    exit 1
fi

if ! command -v ansible-playbook &> /dev/null; then
    echo -e "\${RED}❌ ansible-playbook is not installed\${NC}"
    exit 1
fi

echo -e "\${GREEN}✅ Prerequisites check passed\${NC}"

# Test connection
echo "🔗 Testing connection to server..."
if ansible all -i inventory.yml -m ping; then
    echo -e "\${GREEN}✅ Connection successful\${NC}"
else
    echo -e "\${RED}❌ Connection failed\${NC}"
    echo "Please check your SSH configuration and server accessibility"
    exit 1
fi

# Syntax check
echo "📝 Checking playbook syntax..."
if ansible-playbook --syntax-check -i inventory.yml playbook.yml; then
    echo -e "\${GREEN}✅ Syntax check passed\${NC}"
else
    echo -e "\${RED}❌ Syntax check failed\${NC}"
    exit 1
fi

# Ask for confirmation
echo -e "\${YELLOW}⚠️  Ready to deploy. This will modify the target server.\${NC}"
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy
echo "🚀 Starting deployment..."
if ansible-playbook -i inventory.yml playbook.yml; then
    echo -e "\${GREEN}🎉 Deployment completed successfully!\${NC}"
    echo "Your VPS is now ready to use."
else
    echo -e "\${RED}❌ Deployment failed\${NC}"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo "📊 Deployment Summary:"
echo "- Server: ${hostname}"
echo "- Status: Ready"
echo "- Applications: Installed and configured"
echo "- Next steps: Check your services and configure as needed"
`;
}
