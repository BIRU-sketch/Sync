import type { ProjectState } from '../../electron/ipc/types'
import { setVoxideProjectState } from './client'

export async function refreshVoxideProjectState(): Promise<ProjectState> {
	const state = await window.api.project.getState()
	setVoxideProjectState(state)
	return state
}
