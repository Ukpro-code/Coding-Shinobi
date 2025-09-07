import { motion } from 'framer-motion'

interface Node {
  id: string
  title: string
  x: number
  y: number
  size: number
  color: string
  interactionCount: number
  lastInteraction: Date
  connections: string[]
}

interface IdeaBubbleProps {
  node: Node
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isDragging: boolean
  onClick: () => void
  onDragStart: (event: React.MouseEvent) => void
}

export function IdeaBubble({ 
  node, 
  isSelected, 
  isHighlighted, 
  isDimmed, 
  isDragging, 
  onClick, 
  onDragStart 
}: IdeaBubbleProps) {
  return (
    <motion.div
      className={`absolute select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? 'z-50' : 'z-10'} concept-bubble ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.size,
        height: node.size
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.05 : 1, 
        opacity: isDimmed ? 0.4 : 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={!isDragging ? { 
        scale: 1.02,
        transition: { duration: 0.15, ease: "easeOut" }
      } : {}}
      whileTap={!isDragging ? { scale: 0.98 } : {}}
      onClick={onClick}
      onMouseDown={onDragStart}
      transition={{ 
        duration: 0.2,
        ease: "easeOut",
        scale: { duration: 0.3, ease: "easeInOut" },
        x: { duration: 0.3, ease: "easeInOut" },
        y: { duration: 0.3, ease: "easeInOut" }
      }}
    >
      {/* Drag shadow effect */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 rounded-full bg-black/20 dark:bg-black/40 light:bg-slate-400/20"
          style={{
            transform: 'translate(4px, 4px) scale(1.05)',
            zIndex: -1
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Static glow effect for selected/highlighted nodes */}
      {(isSelected || isHighlighted) && !isDimmed && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isSelected 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(156, 163, 175, 0.4) 0%, transparent 70%)',
            transform: 'scale(1.5)'
          }}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1.5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}

      {/* Main bubble */}
      <div
        className={`w-full h-full rounded-full flex items-center justify-center text-xs font-medium backdrop-blur-sm border-2 transition-all duration-500 ${
          isSelected 
            ? 'border-blue-400 dark:border-blue-400 light:border-blue-500 shadow-xl shadow-blue-400/30 dark:shadow-blue-400/30 light:shadow-blue-500/30 text-white dark:text-white light:text-slate-800 bg-blue-400/5 dark:bg-blue-400/5 light:bg-white/95'
            : isDimmed
            ? 'border-white/20 dark:border-white/20 light:border-slate-300 shadow-sm text-white/70 dark:text-white/70 light:text-slate-600 bg-transparent dark:bg-transparent light:bg-white/70'
            : 'border-white/40 dark:border-white/40 light:border-slate-400 shadow-lg text-white dark:text-white light:text-slate-800 bg-transparent dark:bg-transparent light:bg-white/90'
        } ${isDragging ? 'shadow-2xl shadow-blue-400/20' : ''}`}
      >
        <div className="text-center px-2 leading-tight">
          <div className="truncate">{node.title}</div>
          
          {/* Interaction indicator */}
          <div className="flex justify-center mt-1">
            {Array.from({ length: Math.min(5, Math.floor(node.interactionCount / 5)) }, (_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-white/80 dark:bg-white/80 light:bg-slate-600 rounded-full mx-0.5"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pulse effect for recent interactions */}
      {Date.now() - node.lastInteraction.getTime() < 5000 && (
        <motion.div
          className="absolute inset-0 rounded-full border border-blue-400/40 dark:border-blue-400/40 light:border-blue-500/40"
          animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: 3, ease: "easeOut" }}
        />
      )}
    </motion.div>
  )
}