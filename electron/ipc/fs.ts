import { ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import { getProjectRoot, setProjectRoot } from './project-root';
import type { ProjectState } from './types';

function git(args: string[], cwd: string): Promise<{ code: number | null; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn('git', args, { cwd, shell: false });
    let stdout = '';
    child.stdout.on('data', (c) => (stdout += c.toString()));
    child.on('error', () => resolve({ code: 1, stdout: '' }));
    child.on('close', (code) => resolve({ code, stdout: stdout.trim() }));
  });
}

async function readProjectState(root: string): Promise<ProjectState> {
  const [branch, status, remote] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD'], root),
    git(['status', '--porcelain'], root),
    git(['remote', 'get-url', 'origin'], root),
  ]);

  return {
    root,
    branch: branch.code === 0 ? branch.stdout : null,
    isDirty: status.code === 0 ? status.stdout.length > 0 : false,
    remote: remote.code === 0 ? remote.stdout : null,
  };
}

export function registerFsHandlers(): void {
  ipcMain.handle('project:getState', async () => readProjectState(getProjectRoot()));
  ipcMain.handle('project:getRoot', async () => getProjectRoot());
  ipcMain.handle('project:setRoot', async (_event, newRoot: string) => {
    setProjectRoot(newRoot);
  });
}
