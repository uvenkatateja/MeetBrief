'use client'
import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { JSX } from 'react/jsx-runtime'

interface TextEffectProps {
    children: React.ReactNode
    className?: string
    preset?: 'fade-in-blur'
    speedSegment?: number
    delay?: number
    as?: keyof JSX.IntrinsicElements
    per?: 'line' | 'word' | 'char'
}

export const TextEffect: React.FC<TextEffectProps> = ({
    children,
    className,
    preset = 'fade-in-blur',
    speedSegment = 0.3,
    delay = 0,
    as: Component = 'div',
    per = 'word'
}) => {
    // Use preset to determine variant type (future extensibility)
    const getVariants = (presetType: string): Variants => {
        switch (presetType) {
            case 'fade-in-blur':
            default:
                return {
                    hidden: {
                        opacity: 0,
                        filter: 'blur(12px)',
                        y: 20
                    },
                    visible: {
                        opacity: 1,
                        filter: 'blur(0px)',
                        y: 0,
                        transition: {
                            duration: speedSegment,
                            delay: delay,
                            ease: 'easeOut'
                        }
                    }
                }
        }
    }

    const variants = getVariants(preset)
    // Note: 'per' parameter is available for future word/char-level animations
    
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
            className={cn(className)}
            data-animation-per={per}
        >
            {Component === 'div' ? (
                children
            ) : (
                React.createElement(Component, {}, children)
            )}
        </motion.div>
    )
}