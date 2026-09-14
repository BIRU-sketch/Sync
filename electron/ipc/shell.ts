import { ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import { getProjectRoot } from './project-root';
import type { ShellRunRequest, ShellRunResult } from './types';

// the app is supposed to be permissive to anything that is not destructive, but we want to gate destructive commands behind a confirmation step
const DANGEROUS_PATTERNS: Array<{ command: string; test: (args: string[]) => boolean; reason: string }> = [
  { command: 'git', test: (a) => a.includes ('push') && a.includes('--force'), reason: 'force push' },
  { command: 'git', test: (a) => a.includes('reset') && a.includes('--hard'), reason: 'hard reset (discards local changes)' },
  { command: 'git', test: (a) => a.includes('clean') && (a.includes('-f') || a.includes('-fd')), reason: 'removes untracked files' },
  { command: 'docker', test: (a) => a.includes('system') && a.includes('prune'), reason: 'removes docker data' },
  { command: 'docker', test: (a) => a.includes('rm') || a.includes('rmi'), reason: 'removes docker containers/images' },
  { command: 'npm', test: (a) => a.includes('publish'), reason: 'publishes the package publicly' },
];

const RUN_TIMEOUT_MS = 20_000;
const MAX_OUTPUT_CHARS = 200_000;

function findDangerReason(command: string, args: string[]): string | null {
  const match = DANGEROUS_PATTERNS.find((p) => p.command === command && p.test(args));
  return match ? match.reason : null;
}

function runProcess(command: string, args: string[], cwd: string): Promise<ShellRunResult> {
  return new Promise((resolve) => {

    const child = spawn(command, args, { cwd, shell: false });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        resolve({ status: 'error', reason: `timed out after ${RUN_TIMEOUT_MS}ms`, stdout, stderr });
      }
    }, RUN_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_CHARS) stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_CHARS) stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ status: 'error', reason: err.message, stdout, stderr });
      }
    });

    child.on('close', (exitCode) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ status: exitCode === 0 ? 'ok' : 'error', exitCode, stdout, stderr });
      }
    });
  });
}

export function registerShellHandlers(): void {
  ipcMain.handle('shell:run', async (_event, request: ShellRunRequest): Promise<ShellRunResult> => {
    const { command, args = [], confirmed = false } = request;

    if (!command || command.trim() === '') {
      return { status: 'rejected', reason: 'Command is required' };
    }

    const dangerReason = findDangerReason(command, args);
    if (dangerReason && !confirmed) {
      return { status: 'confirmation_required', reason: dangerReason };
    }

    return runProcess(command, args, getProjectRoot());
  });
}
