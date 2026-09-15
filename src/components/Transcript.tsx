import React from 'react'
import { useUIState } from '../context/UIStateContext'

export function Transcript() {
  const { transcript } = useUIState()

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <h3>Conversation</h3>
      </div>
      <div className="transcript-content">
        {transcript.length === 0 ? (
          <p className="empty-transcript">No conversation yet</p>
        ) : (
          transcript.map((text, index) => (
            <div key={index} className="transcript-item">
              <span className="transcript-text">{text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}