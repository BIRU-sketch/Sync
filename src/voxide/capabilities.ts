import type { ProjectState, ShellRunResult } from '../../electron/ipc/types'
import type { UIState, UIStateContext } from '../types/ui'
import type { VoxideParamRule } from '@voxide/react'

export interface CapabilityDefinition {
	description: string
	params?: Record<string, VoxideParamRule>
	dangerous?: boolean
	handler: (params: Record<string, unknown>) => Promise<unknown>
}

export interface CapabilityDependencies {
	getUiState: () => UIStateContext
	project: Window['api']['project']
	shell: Window['api']['shell']
}

function asString(value: unknown, name: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${name} is required`)
	}
	return value.trim()
}

function asStringArray(value: unknown): string[] {
	if (value === undefined) return []
	if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
		throw new Error('args must be an array of strings')
	}
	return value
}

export function createCapabilities(deps: CapabilityDependencies): Record<string, CapabilityDefinition> {
	return {
		get_assistant_state: {
			description: 'Get the companion state, microphone level, and recent conversation transcript.',
			handler: async () => {
				const { currentState, micLevel, transcript } = deps.getUiState()
				return { currentState, micLevel, transcript }
			},
		},
		set_assistant_state: {
			description: 'Change the companion visual state to idle, listening, thinking, talking, or executing.',
			params: {
				state: { type: 'string', required: true, description: 'One of idle, listening, thinking, talking, or executing.' },
			},
			handler: async ({ state }) => {
				const nextState = asString(state, 'state') as UIState
				const allowedStates: UIState[] = ['idle', 'listening', 'thinking', 'talking', 'executing']
				if (!allowedStates.includes(nextState)) throw new Error('Invalid assistant state')
				deps.getUiState().setState(nextState)
				return { status: 'ok', state: nextState }
			},
		},
		add_transcript_entry: {
			description: 'Add a user or assistant message to the visible conversation transcript.',
			params: { text: { type: 'string', required: true } },
			handler: async ({ text }) => {
				const entry = asString(text, 'text')
				deps.getUiState().addTranscript(entry)
				return { status: 'ok', text: entry }
			},
		},
		clear_transcript: {
			description: 'Clear the visible conversation transcript.',
			handler: async () => {
				deps.getUiState().clearTranscript()
				return { status: 'ok' }
			},
		},
		get_project_state: {
			description: 'Inspect the active project root, current Git branch, dirty state, and origin remote.',
			handler: async (): Promise<ProjectState> => deps.project.getState(),
		},
		get_project_root: {
			description: 'Get the filesystem path of the active coding project.',
			handler: async () => ({ root: await deps.project.getRoot() }),
		},
		set_project_root: {
			description: 'Change the active coding project folder to an existing filesystem path.',
			params: { root: { type: 'string', required: true, description: 'Absolute project folder path.' } },
			handler: async ({ root }) => {
				const rootPath = asString(root, 'root')
				await deps.project.setRoot(rootPath)
				return { status: 'ok', root: rootPath }
			},
		},
		run_shell_command: {
			description: 'Run a developer command in the active project folder. Destructive commands require confirmation.',
			params: {
				command: { type: 'string', required: true, description: 'Executable name, such as git, npm, cargo, or docker.' },
				args: { type: 'array', description: 'Command arguments as an array of strings.' },
				confirmed: { type: 'boolean', description: 'Set true only after the user confirms a destructive command.' },
			},
			dangerous: true,
			handler: async ({ command, args, confirmed }): Promise<ShellRunResult> => {
				return deps.shell.run({
					command: asString(command, 'command'),
					args: asStringArray(args),
					confirmed: confirmed === true,
				})
			},
		},
	}
}
