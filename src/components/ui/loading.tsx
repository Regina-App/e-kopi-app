'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Memuat...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative rounded-2xl p-2 bg-white/5 ring-1 ring-white/10 shadow-2xl"
      >
        <Image
          src="/images/logo.png"
          alt="E-KOPI Logo"
          width={80}
          height={80}
          priority
          className="rounded-xl object-contain"
        />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-white text-base font-medium mt-6 tracking-wide"
      >
        {message}
      </motion.p>
    </div>
  )
}

export interface SkeletonCardProps {
  className?: string
  lines?: number
}

export function SkeletonCard({ className = '', lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${className}`}
    >
      <div className="w-1/3 h-5 mb-4 bg-slate-200 rounded animate-pulse" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => {
          const widths = ['w-full', 'w-5/6', 'w-2/3', 'w-3/4']
          const widthClass = widths[index % widths.length]
          return (
            <div
              key={index}
              className={`h-4 bg-slate-100 rounded animate-pulse ${widthClass}`}
            />
          )
        })}
      </div>
    </div>
  )
}

export interface SkeletonTableProps {
  columns?: number
  rows?: number
  className?: string
}

export function SkeletonTable({
  columns = 5,
  rows = 5,
  className = '',
}: SkeletonTableProps) {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="p-3">
                    <div
                      className="h-4 bg-slate-100 rounded animate-pulse"
                      style={{
                        width: `${Math.max(40, ((c * 17 + r * 23) % 55) + 40)}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export interface ButtonSpinnerProps {
  size?: number | string
  className?: string
}

export function ButtonSpinner({ size = 16, className = '' }: ButtonSpinnerProps) {
  return (
    <Loader2
      className={`animate-spin inline-block text-current shrink-0 ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
    />
  )
}

export interface ProgressBarProps {
  percentage: number
  className?: string
}

export function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage))
  return (
    <div className={`h-2 bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

export interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className = '' }: LoadingDotsProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 0.2, 0.4].map((delay, index) => (
        <motion.span
          key={index}
          className="w-2.5 h-2.5 rounded-full bg-blue-500"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        />
      ))}
    </div>
  )
}
