import { VoxideClient } from '@voxide/react'
import { createCapabilities } from './capabilities'
import type { ProjectState } from '../../electron/ipc/types'
import type { UIStateContext } from '../types/ui'

let uiState: UIStateContext | null = null
let projectState: ProjectState | null = null

export function setVoxideUiState(nextState: UIStateContext): void {
	uiState = nextState
}

export function setVoxideProjectState(nextState: ProjectState): void {
	projectState = nextState
}

const ai = new VoxideClient({
	publicKey: import.meta.env.VITE_VOXIDE_PUBLIC_KEY ?? '',
	language: 'en-US',
	ui: {
		theme: 'auto',
		accentColor: '#6366f1',
		position: 'bottom-right',
		title: 'Code Companion',
		launcherIcon: 'mic',
		launcherMode: 'voice-orb',
	},
})

ai.register(createCapabilities({
	getUiState: () => {
		if (!uiState) throw new Error('Assistant UI is not ready')
		return uiState
	},
	project: window.api.project,
	shell: window.api.shell,
}))

ai.bindState(() => ({
	currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
	assistant: uiState ? {
		state: uiState.currentState,
		micLevel: uiState.micLevel,
		transcript: uiState.transcript.slice(-10),
	} : null,
	project: projectState,
}))

export { ai }
