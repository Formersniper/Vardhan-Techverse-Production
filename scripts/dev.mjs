import { spawn } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const nextArgs = ['dev'];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--host') {
    nextArgs.push('-H');
    if (args[i + 1] && !args[i + 1].startsWith('-')) {
      nextArgs.push(args[++i]);
    } else {
      nextArgs.push('0.0.0.0');
    }
  } else if (arg.startsWith('--host=')) {
    nextArgs.push('-H', arg.split('=')[1]);
  } else if (arg === '--port') {
    nextArgs.push('-p', args[++i] || '3000');
  } else if (arg.startsWith('--port=')) {
    nextArgs.push('-p', arg.split('=')[1]);
  } else {
    nextArgs.push(arg);
  }
}

if (!nextArgs.includes('-p')) nextArgs.push('-p', '3000');
if (!nextArgs.includes('-H')) nextArgs.push('-H', '0.0.0.0');

const appNodeModules = path.resolve(process.cwd(), 'node_modules');
const existingNodePath = process.env.NODE_PATH || '';
const nodePath = existingNodePath ? `${appNodeModules}:${existingNodePath}` : appNodeModules;

const child = spawn('node_modules/.bin/next', nextArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_PATH: nodePath,
    NEXT_TELEMETRY_DISABLED: '1'
  }
});

let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (child && !child.killed) {
    try {
      child.kill(signal || 'SIGTERM');
    } catch (e) {
      // Ignore errors if process already dead
    }
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGHUP', () => shutdown('SIGHUP'));
process.on('exit', () => shutdown('SIGTERM'));

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 130 : 0));
});

