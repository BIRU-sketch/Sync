import { app } from 'electron';

let projectRoot: string = app.getPath('home');

export function getProjectRoot(): string {
  return projectRoot;
}

export function setProjectRoot(newRoot: string): void {
  projectRoot = newRoot;
}
