export interface ShellRunRequest {
  command: string;
  args?: string[];
  confirmed?: boolean;
}


export type ShellRunStatus = 'ok' | 'error' | 'confirmation_required' | 'rejected';

export interface ShellRunResult {
  status: ShellRunStatus;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  reason?: string;
}

export interface ProjectState {
  root: string;
  branch: string | null;
  isDirty: boolean;
  remote: string | null;
}
