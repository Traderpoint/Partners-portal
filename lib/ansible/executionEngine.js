/**
 * Ansible Execution Engine
 * Handles running Ansible playbooks and managing deployments
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AnsibleExecutionEngine {
  constructor(options = {}) {
    this.workingDir = options.workingDir || '/tmp/ansible-deployments';
    this.vaultPassword = options.vaultPassword;
    this.logLevel = options.logLevel || 'info';
    this.callbacks = options.callbacks || {};
  }

  /**
   * Initialize working directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.workingDir, { recursive: true });
      await fs.mkdir(path.join(this.workingDir, 'playbooks'), { recursive: true });
      await fs.mkdir(path.join(this.workingDir, 'inventories'), { recursive: true });
      await fs.mkdir(path.join(this.workingDir, 'group_vars'), { recursive: true });
      await fs.mkdir(path.join(this.workingDir, 'host_vars'), { recursive: true });
      await fs.mkdir(path.join(this.workingDir, 'logs'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize Ansible workspace: ${error.message}`);
    }
  }

  /**
   * Execute Ansible playbook
   */
  async executePlaybook(playbookContent, inventoryContent, options = {}) {
    const deploymentId = options.deploymentId || `deploy-${Date.now()}`;
    const deploymentDir = path.join(this.workingDir, deploymentId);
    
    try {
      // Create deployment directory
      await fs.mkdir(deploymentDir, { recursive: true });
      
      // Write playbook and inventory files
      const playbookPath = path.join(deploymentDir, 'playbook.yml');
      const inventoryPath = path.join(deploymentDir, 'inventory.yml');
      const logPath = path.join(deploymentDir, 'ansible.log');
      
      await fs.writeFile(playbookPath, playbookContent);
      await fs.writeFile(inventoryPath, inventoryContent);
      
      // Generate ansible.cfg
      const configPath = path.join(deploymentDir, 'ansible.cfg');
      await fs.writeFile(configPath, this.generateAnsibleConfig(deploymentDir));
      
      // Prepare execution options
      const execOptions = {
        cwd: deploymentDir,
        env: {
          ...process.env,
          ANSIBLE_CONFIG: configPath,
          ANSIBLE_LOG_PATH: logPath,
          ANSIBLE_STDOUT_CALLBACK: 'yaml'
        }
      };
      
      // Build ansible-playbook command
      const command = this.buildPlaybookCommand(playbookPath, inventoryPath, options);
      
      this.log('info', `Executing: ${command.join(' ')}`);
      
      // Execute playbook
      const result = await this.runCommand(command, execOptions, deploymentId);
      
      // Read log file
      let logContent = '';
      try {
        logContent = await fs.readFile(logPath, 'utf8');
      } catch (error) {
        this.log('warn', 'Could not read Ansible log file');
      }
      
      return {
        deploymentId,
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        logContent,
        duration: result.duration,
        playbook: playbookPath,
        inventory: inventoryPath
      };
      
    } catch (error) {
      this.log('error', `Playbook execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run Ansible ad-hoc command
   */
  async runAdHocCommand(module, args, inventoryContent, options = {}) {
    const deploymentId = options.deploymentId || `adhoc-${Date.now()}`;
    const deploymentDir = path.join(this.workingDir, deploymentId);
    
    try {
      await fs.mkdir(deploymentDir, { recursive: true });
      
      const inventoryPath = path.join(deploymentDir, 'inventory.yml');
      await fs.writeFile(inventoryPath, inventoryContent);
      
      const command = [
        'ansible',
        options.pattern || 'all',
        '-i', inventoryPath,
        '-m', module,
        '-a', args
      ];
      
      if (options.become) {
        command.push('--become');
      }
      
      if (options.verbose) {
        command.push('-v'.repeat(Math.min(options.verbose, 4)));
      }
      
      const execOptions = {
        cwd: deploymentDir,
        env: process.env
      };
      
      const result = await this.runCommand(command, execOptions, deploymentId);
      
      return {
        deploymentId,
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration: result.duration
      };
      
    } catch (error) {
      this.log('error', `Ad-hoc command failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check Ansible playbook syntax
   */
  async checkPlaybookSyntax(playbookContent, inventoryContent) {
    const tempDir = path.join(this.workingDir, `syntax-check-${Date.now()}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      const playbookPath = path.join(tempDir, 'playbook.yml');
      const inventoryPath = path.join(tempDir, 'inventory.yml');
      
      await fs.writeFile(playbookPath, playbookContent);
      await fs.writeFile(inventoryPath, inventoryContent);
      
      const command = [
        'ansible-playbook',
        '--syntax-check',
        '-i', inventoryPath,
        playbookPath
      ];
      
      const result = await this.runCommand(command, { cwd: tempDir });
      
      // Cleanup
      await fs.rmdir(tempDir, { recursive: true });
      
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0 ? result.stderr : null
      };
      
    } catch (error) {
      this.log('error', `Syntax check failed: ${error.message}`);
      return {
        valid: false,
        errors: error.message
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId) {
    const deploymentDir = path.join(this.workingDir, deploymentId);
    const logPath = path.join(deploymentDir, 'ansible.log');
    
    try {
      const stats = await fs.stat(deploymentDir);
      let logContent = '';
      
      try {
        logContent = await fs.readFile(logPath, 'utf8');
      } catch (error) {
        // Log file might not exist yet
      }
      
      return {
        deploymentId,
        exists: true,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        logContent
      };
      
    } catch (error) {
      return {
        deploymentId,
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Build ansible-playbook command
   */
  buildPlaybookCommand(playbookPath, inventoryPath, options = {}) {
    const command = ['ansible-playbook'];
    
    // Basic options
    command.push('-i', inventoryPath);
    command.push(playbookPath);
    
    // Verbosity
    if (options.verbose) {
      command.push('-v'.repeat(Math.min(options.verbose, 4)));
    }
    
    // Check mode
    if (options.checkMode) {
      command.push('--check');
    }
    
    // Diff mode
    if (options.diff) {
      command.push('--diff');
    }
    
    // Limit to specific hosts
    if (options.limit) {
      command.push('--limit', options.limit);
    }
    
    // Tags
    if (options.tags) {
      command.push('--tags', Array.isArray(options.tags) ? options.tags.join(',') : options.tags);
    }
    
    // Skip tags
    if (options.skipTags) {
      command.push('--skip-tags', Array.isArray(options.skipTags) ? options.skipTags.join(',') : options.skipTags);
    }
    
    // Extra variables
    if (options.extraVars) {
      Object.entries(options.extraVars).forEach(([key, value]) => {
        command.push('-e', `${key}=${value}`);
      });
    }
    
    // Vault password
    if (this.vaultPassword) {
      command.push('--vault-password-file', this.vaultPassword);
    }
    
    // Become
    if (options.become !== false) {
      command.push('--become');
    }
    
    return command;
  }

  /**
   * Run shell command
   */
  async runCommand(command, options = {}, deploymentId = null) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      
      this.log('debug', `Running command: ${command.join(' ')}`);
      
      const child = spawn(command[0], command.slice(1), {
        ...options,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        
        if (this.callbacks.onStdout) {
          this.callbacks.onStdout(chunk, deploymentId);
        }
        
        this.log('debug', `STDOUT: ${chunk.trim()}`);
      });
      
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        
        if (this.callbacks.onStderr) {
          this.callbacks.onStderr(chunk, deploymentId);
        }
        
        this.log('debug', `STDERR: ${chunk.trim()}`);
      });
      
      child.on('close', (exitCode) => {
        const duration = Date.now() - startTime;
        
        this.log('info', `Command completed with exit code ${exitCode} in ${duration}ms`);
        
        if (this.callbacks.onComplete) {
          this.callbacks.onComplete(exitCode, deploymentId);
        }
        
        resolve({
          exitCode,
          stdout,
          stderr,
          duration
        });
      });
      
      child.on('error', (error) => {
        this.log('error', `Command error: ${error.message}`);
        
        if (this.callbacks.onError) {
          this.callbacks.onError(error, deploymentId);
        }
        
        reject(error);
      });
    });
  }

  /**
   * Generate ansible.cfg for deployment
   */
  generateAnsibleConfig(deploymentDir) {
    return `[defaults]
inventory = inventory.yml
host_key_checking = False
timeout = 30
gathering = smart
fact_caching = memory
stdout_callback = yaml
callback_whitelist = profile_tasks, timer
log_path = ${path.join(deploymentDir, 'ansible.log')}
retry_files_enabled = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o StrictHostKeyChecking=no
pipelining = True
control_path = /tmp/ansible-ssh-%h-%p-%r

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False
`;
  }

  /**
   * Cleanup old deployments
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const entries = await fs.readdir(this.workingDir, { withFileTypes: true });
      const now = Date.now();
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.workingDir, entry.name);
          const stats = await fs.stat(dirPath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.rmdir(dirPath, { recursive: true });
            this.log('info', `Cleaned up old deployment: ${entry.name}`);
          }
        }
      }
    } catch (error) {
      this.log('error', `Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Log message
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    
    if (this.callbacks.onLog) {
      this.callbacks.onLog(level, message, timestamp);
    }
  }
}

module.exports = AnsibleExecutionEngine;
