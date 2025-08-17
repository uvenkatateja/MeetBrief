'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InfiniteSliderProps {
  children: React.ReactNode
  gap?: number
  speed?: number
  speedOnHover?: number
  reverse?: boolean
  className?: string
}

export const InfiniteSlider: React.FC<InfiniteSliderProps> = ({
  children,
  gap = 16,
  speed = 50,
  speedOnHover = 25,
  reverse = false,
  className
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const childrenArray = React.Children.toArray(children)
  const duplicatedChildren = [...childrenArray, ...childrenArray]

  const currentSpeed = isHovered ? speedOnHover : speed
  const direction = reverse ? -1 : 1

  return (
    <div
      className={cn('overflow-hidden', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="flex"
        style={{ gap: `${gap}px` }}
        animate={{
          x: direction * -100 * childrenArray.length + '%'
        }}
        transition={{
          duration: currentSpeed,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop'
        }}
      >
        {duplicatedChildren.map((child, index) => (
          <div key={index} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}