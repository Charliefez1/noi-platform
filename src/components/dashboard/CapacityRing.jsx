import React from 'react';
import { motion } from 'framer-motion';

export default function CapacityRing({ value, max = 100, size = 'lg', showLabel = true }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeConfig = {
    sm: { radius: 12, stroke: 3, container: 'w-8 h-8', text: 'text-xs' },
    md: { radius: 60, stroke: 8, container: 'w-40 h-40', text: 'text-base' },
    lg: { radius: 80, stroke: 12, container: 'w-64 h-64', text: 'text-lg' },
  };
  
  const config = sizeConfig[size] || sizeConfig.lg;
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Dynamic color based on load
  const getColor = () => {
    if (percentage <= 40) return { ring: 'text-green-500', bg: 'text-green-500/20', label: 'Low Load', status: 'optimal' };
    if (percentage <= 70) return { ring: 'text-yellow-400', bg: 'text-yellow-400/20', label: 'Moderate Load', status: 'moderate' };
    if (percentage <= 85) return { ring: 'text-orange-500', bg: 'text-orange-500/20', label: 'High Load', status: 'high' };
    return { ring: 'text-red-500', bg: 'text-red-500/20', label: 'Overload', status: 'critical' };
  };

  const colorConfig = getColor();
  const svgSize = config.radius * 2 + config.stroke * 2;
  const center = svgSize / 2;

  return (
    <div className={`relative flex items-center justify-center ${config.container}`}>
      <svg className="transform -rotate-90" width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="transparent"
          className={colorConfig.bg}
        />
        {/* Progress circle */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={center}
          cy={center}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={colorConfig.ring}
        />
      </svg>
      {showLabel && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-bold ${colorConfig.ring}`}>
            {Math.round(percentage)}%
          </span>
          <span className={`${config.text} font-medium ${colorConfig.ring}`}>
            {colorConfig.label}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Cognitive Load
          </span>
        </div>
      )}
    </div>
  );
}