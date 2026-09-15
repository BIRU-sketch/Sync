import React from 'react'
import { useUIState } from '../context/UIStateContext'
import { MicIcon } from './Icons'

export function StatusBar() {
  const { currentState, micLevel } = useUIState()

  const getStatusText = () => {
    switch (currentState) {
      case 'idle':
        return 'Ready'
      case 'listening':
        return 'Listening'
      case 'thinking':
        return 'Thinking'
      case 'talking':
        return 'Speaking'
      case 'executing':
        return 'Executing'
      default:
        return 'Ready'
    }
  }

  const getStatusColor = () => {
    switch (currentState) {
      case 'idle':
        return '#6366f1'
      case 'listening':
        return '#6366f1'
      case 'thinking':
        return '#8b5cf6'
      case 'talking':
        return '#10b981'
      case 'executing':
        return '#f59e0b'
      default:
        return '#6366f1'
    }
  }

  return (
    <div className="status-bar">
      <div className="status-indicator">
        <div 
          className="status-dot" 
          style={{ backgroundColor: getStatusColor(), color: getStatusColor() }}
        />
        <span className="status-text">{getStatusText()}</span>
      </div>
      <div className="mic-level">
        <div className="mic-icon">
          <MicIcon />
        </div>
        <div className="mic-bar-container">
          <div 
            className="mic-bar" 
            style={{ width: `${micLevel * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}