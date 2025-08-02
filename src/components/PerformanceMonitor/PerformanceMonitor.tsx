"use client";

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export default function PerformanceMonitor({ componentName, children }: PerformanceMonitorProps) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 開発環境でのみログ出力
      if (process.env.NODE_ENV === 'development') {        
        // 異常に長いレンダリング時間を警告
        if (renderTime > 100) {
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);

  return <>{children}</>;
}