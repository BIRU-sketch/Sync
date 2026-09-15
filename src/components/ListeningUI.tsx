import React, { useEffect, useRef } from 'react'
import { useUIState } from '../context/UIStateContext'
import { MicIcon } from './Icons'

export function ListeningUI() {
  const { micLevel } = useUIState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const time = Date.now() / 1000
      const baseRadius = 60
      const activity = micLevel * 0.8

      // Draw subtle background rings
      for (let i = 0; i < 3; i++) {
        const ringRadius = baseRadius + 30 + i * 25
        const opacity = 0.03 + Math.sin(time + i) * 0.02
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw dynamic audio rings
      const ringCount = 4
      for (let i = 0; i < ringCount; i++) {
        const phase = (time * 1.5 + i * 0.5) % 1
        const radius = baseRadius + phase * 80 * activity
        const opacity = (1 - phase) * 0.4 * activity
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw waveform visualization
      const waveformPoints = 64
      for (let i = 0; i < waveformPoints; i++) {
        const angle = (i / waveformPoints) * Math.PI * 2
        const baseWaveRadius = baseRadius + 15
        const waveAmplitude = 20 * activity * Math.sin(time * 3 + i * 0.2)
        const radius = baseWaveRadius + waveAmplitude
        
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${0.3 + activity * 0.4})`
        ctx.fill()
      }

      // Draw central glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius)
      gradient.addColorStop(0, `rgba(99, 102, 241, ${0.1 + activity * 0.2})`)
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      animationRef.current = requestAnimationFrame(drawVisualization)
    }

    drawVisualization()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [micLevel])

  return (
    <div className="state-container listening-container">
      <div className="visualizer-container">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={280}
          className="state-canvas"
        />
        <div className="central-icon" style={{ borderColor: `rgba(99, 102, 241, ${0.3 + micLevel * 0.4})` }}>
          <MicIcon />
        </div>
      </div>
      <div className="state-text">
        <h2>Listening</h2>
        <p>Speak clearly</p>
      </div>
    </div>
  )
}