import { spawn } from 'child_process';

interface GwsOptions {
  params?: Record<string, any>;
  json?: Record<string, any>;
  flags?: string[];
  upload?: string;
}

export async function gws(args: string[], options: GwsOptions = {}): Promise<any> {
  const fullArgs = [...args];

  if (options.params && Object.keys(options.params).length > 0) {
    fullArgs.push('--params', JSON.stringify(options.params));
  }
  if (options.json && Object.keys(options.json).length > 0) {
    fullArgs.push('--json', JSON.stringify(options.json));
  }
  if (options.upload) {
    fullArgs.push('--upload', options.upload);
  }
  if (options.flags) {
    fullArgs.push(...options.flags);
  }
  fullArgs.push('--format', 'json');

  return new Promise((resolve, reject) => {
    const child = spawn('gws', fullArgs, { env: process.env });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr || `gws exited with code ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.code && parsed.reason) {
          reject(new Error(parsed.message || `gws error: ${parsed.reason}`));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error(`Failed to parse gws output: ${stdout.slice(0, 200)}`));
      }
    });
    child.on('error', reject);
  });
}

export async function gwsRaw(args: string[], options: GwsOptions = {}): Promise<{ stdout: string; stderr: string }> {
  const fullArgs = [...args];

  if (options.params && Object.keys(options.params).length > 0) {
    fullArgs.push('--params', JSON.stringify(options.params));
  }
  if (options.json && Object.keys(options.json).length > 0) {
    fullArgs.push('--json', JSON.stringify(options.json));
  }
  if (options.upload) {
    fullArgs.push('--upload', options.upload);
  }
  if (options.flags) {
    fullArgs.push(...options.flags);
  }

  return new Promise((resolve, reject) => {
    const child = spawn('gws', fullArgs, { env: process.env });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr || `gws exited with code ${code}`));
        return;
      }
      resolve({ stdout, stderr });
    });
    child.on('error', reject);
  });
}
