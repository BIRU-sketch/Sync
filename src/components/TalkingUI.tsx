import React, { useEffect, useRef } from 'react'
import { useUIState } from '../context/UIStateContext'
import { SpeakerIcon } from './Icons'

export function TalkingUI() {
  const { micLevel } = useUIState()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawTalking = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const time = Date.now() / 1000
      const activity = micLevel * 0.8

      // Draw sound wave rings
      const ringCount = 5
      for (let i = 0; i < ringCount; i++) {
        const phase = (time * 2 + i * 0.3) % 1
        const radius = 50 + phase * 100 * activity
        const opacity = (1 - phase) * 0.5 * activity
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`
        ctx.lineWidth = 2 - phase
        ctx.stroke()
      }

      // Draw frequency bars around center
      const barCount = 32
      const barRadius = 65
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2
        const barHeight = 5 + Math.sin(time * 8 + i * 0.3) * 15 * activity + Math.random() * 8 * activity
        
        const innerX = centerX + Math.cos(angle) * barRadius
        const innerY = centerY + Math.sin(angle) * barRadius
        const outerX = centerX + Math.cos(angle) * (barRadius + barHeight)
        const outerY = centerY + Math.sin(angle) * (barRadius + barHeight)
        
        ctx.beginPath()
        ctx.moveTo(innerX, innerY)
        ctx.lineTo(outerX, outerY)
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 + activity * 0.5})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw waveform line
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      
      for (let x = 0; x < canvas.width; x++) {
        const normalizedX = x / canvas.width
        const wave = Math.sin(normalizedX * Math.PI * 4 + time * 8) * 20 * activity
        const noise = (Math.random() - 0.5) * 10 * activity
        const y = centerY + wave + noise
        
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 + activity * 0.3})`
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw central glow
      const glowRadius = 35 + Math.sin(time * 4) * 5 * activity
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius)
      gradient.addColorStop(0, `rgba(16, 185, 129, ${0.15 + activity * 0.2})`)
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      animationRef.current = requestAnimationFrame(drawTalking)
    }

    drawTalking()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [micLevel])

  return (
    <div className="state-container talking-container">
      <div className="visualizer-container">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={280}
          className="state-canvas"
        />
        <div className="central-icon" style={{ borderColor: `rgba(16, 185, 129, ${0.3 + micLevel * 0.4})` }}>
          <SpeakerIcon />
        </div>
      </div>
      <div className="state-text">
        <h2>Speaking</h2>
        <p>Your companion is responding</p>
      </div>
    </div>
  )
}