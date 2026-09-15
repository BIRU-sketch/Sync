import React, { useEffect, useRef } from 'react'
import { RobotIcon } from './Icons'

export function IdleUI() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawIdle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const time = Date.now() / 1000

      // Draw subtle rotating rings
      for (let i = 0; i < 3; i++) {
        const radius = 70 + i * 25
        const rotation = time * 0.2 + i * 0.5
        const opacity = 0.05 + Math.sin(time + i) * 0.03
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, rotation, rotation + Math.PI * 1.8)
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw floating particles
      const particleCount = 12
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.3
        const radius = 50 + Math.sin(time * 2 + i * 0.5) * 20
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 2 + Math.sin(time * 3 + i) * 1
        const opacity = 0.2 + Math.sin(time * 2 + i * 0.3) * 0.15
        
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`
        ctx.fill()
      }

      // Draw central glow
      const glowRadius = 45 + Math.sin(time * 2) * 5
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius)
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)')
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)')
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw subtle pulse rings
      const pulsePhase = (time * 0.5) % 1
      const pulseRadius = 60 + pulsePhase * 40
      const pulseOpacity = (1 - pulsePhase) * 0.1
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(99, 102, 241, ${pulseOpacity})`
      ctx.lineWidth = 1
      ctx.stroke()

      animationRef.current = requestAnimationFrame(drawIdle)
    }

    drawIdle()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="state-container idle-container">
      <div className="visualizer-container">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={280}
          className="state-canvas"
        />
        <div className="central-icon">
          <RobotIcon />
        </div>
      </div>
      <div className="state-text">
        <h2>Ready</h2>
        <p>Voice activation standby</p>
      </div>
    </div>
  )
}