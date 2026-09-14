import type { ShellRunRequest, ShellRunResult, ProjectState } from '../../electron/ipc/types';

declare global {
  interface Window {
    api: {
      shell: {
        run: (request: ShellRunRequest) => Promise<ShellRunResult>;
      };
      project: {
        getState: () => Promise<ProjectState>;
        getRoot: () => Promise<string>;
        setRoot: (rootPath: string) => Promise<void>;
      };
    };
  }
}

export {};
