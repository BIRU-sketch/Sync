import { registerShellHandlers } from './shell';
import { registerFsHandlers } from './fs';

export function registerIpcHandlers(): void {
  registerShellHandlers();
  registerFsHandlers();
}
