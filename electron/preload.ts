import { contextBridge, ipcRenderer } from 'electron';
import type { ShellRunRequest, ShellRunResult, ProjectState } from './ipc/types';

contextBridge.exposeInMainWorld('api', {
  shell: {
    run: (request: ShellRunRequest): Promise<ShellRunResult> => ipcRenderer.invoke('shell:run', request),
  },
  project: {
    getState: (): Promise<ProjectState> => ipcRenderer.invoke('project:getState'),
    getRoot: (): Promise<string> => ipcRenderer.invoke('project:getRoot'),
    setRoot: (rootPath: string): Promise<void> => ipcRenderer.invoke('project:setRoot', rootPath),
  },
});
