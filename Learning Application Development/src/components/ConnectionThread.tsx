import { motion } from 'framer-motion'

interface ConnectionThreadProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  strength: number
  isDimmed?: boolean
}

export function ConnectionThread({ from, to, strength, isDimmed = false }: ConnectionThreadProps) {
  // Calculate the line properties
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Create a curved path for more organic connections
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  
  // Add some curvature based on the distance
  const curveOffset = distance * 0.2 * (Math.random() - 0.5)
  const controlX = midX + curveOffset * (dy / distance)
  const controlY = midY - curveOffset * (dx / distance)

  const pathData = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`

  // Color and opacity based on strength and dimmed state
  const baseOpacity = Math.max(0.2, strength * 0.7)
  const opacity = isDimmed ? baseOpacity * 0.3 : baseOpacity
  const strokeWidth = Math.max(0.5, strength * 2.5)
  const color = strength > 0.7 ? '#ffffff' : strength > 0.4 ? '#d1d5db' : '#9ca3af'

  return (
    <g>
      {/* Glow effect for stronger connections */}
      {strength > 0.6 && (
        <motion.path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth + 2}
          fill="none"
          opacity={opacity * 0.3}
          filter="blur(2px)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      )}
      
      {/* Main connection line */}
      <motion.path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={opacity}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Animated particles along strong connections */}
      {strength > 0.8 && (
        <motion.circle
          r="2"
          fill={color}
          opacity={0.6}
        >
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path={pathData}
          />
        </motion.circle>
      )}
    </g>
  )
}