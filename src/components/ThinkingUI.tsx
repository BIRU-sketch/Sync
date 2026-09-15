import React, { useEffect, useRef } from 'react'
import { BrainIcon } from './Icons'

export function ThinkingUI() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawThinking = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const time = Date.now() / 1000

      // Draw neural network pattern
      const nodeCount = 6
      const nodes = []
      
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + time * 0.3
        const radius = 45 + Math.sin(time * 2 + i) * 10
        nodes.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          phase: i
        })
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.sqrt(
            Math.pow(nodes[i].x - nodes[j].x, 2) + 
            Math.pow(nodes[i].y - nodes[j].y, 2)
          )
          
          if (distance < 80) {
            const opacity = (1 - distance / 80) * 0.3
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((node, index) => {
        const pulsePhase = (time * 2 + index * 0.5) % 1
        const nodeRadius = 6 + pulsePhase * 4
        const opacity = 0.4 + pulsePhase * 0.4
        
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`
        ctx.fill()
        
        // Draw glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeRadius * 2)
        gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity * 0.5})`)
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
        
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeRadius * 2, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      // Draw central processing core
      const coreRadius = 25 + Math.sin(time * 3) * 3
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)')
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)')
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw rotating ring
      const ringRadius = 55
      ctx.beginPath()
      ctx.arc(centerX, centerY, ringRadius, time, time + Math.PI * 1.5)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(centerX, centerY, ringRadius, time + Math.PI, time + Math.PI * 2.5)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

      animationRef.current = requestAnimationFrame(drawThinking)
    }

    drawThinking()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="state-container thinking-container">
      <div className="visualizer-container">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={280}
          className="state-canvas"
        />
        <div className="central-icon" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <BrainIcon />
        </div>
      </div>
      <div className="state-text">
        <h2>Thinking</h2>
        <p>Processing your request</p>
      </div>
    </div>
  )
}