import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface ScratchCardProps {
  children: React.ReactNode;
  onComplete: () => void;
  isCompleted: boolean;
  brushSize?: number;
  threshold?: number; // 0 to 1, how much needs to be scratched
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  children,
  onComplete,
  isCompleted,
  brushSize = 40,
  threshold = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(isCompleted);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const countRef = useRef(0);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use a small delay to ensure container has dimensions
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    if (width === 0 || height === 0) {
      requestAnimationFrame(initCanvas);
      return;
    }

    canvas.width = width;
    canvas.height = height;
    
    // Add some metallic texture
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#be123c'); // rose-700
    gradient.addColorStop(0.5, '#e11d48'); // rose-600
    gradient.addColorStop(1, '#9f1239'); // rose-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add metallic noise/shimmer - densified for solid feel
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      ctx.beginPath();
      const size = Math.random() * 1.5;
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (isCompleted) {
      setIsScratched(true);
      return;
    }
    initCanvas();
  }, [isCompleted]);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000'; // Ensure 100% opacity for removal
    ctx.strokeStyle = '#000'; // Ensure 100% opacity for removal
    ctx.lineWidth = brushSize * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPosRef.current) {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    lastPosRef.current = { x, y };

    // Throttle completion check for performance
    countRef.current++;
    if (countRef.current % 10 === 0) {
      checkCompletion(ctx, canvas.width, canvas.height);
    }
  };

  const checkCompletion = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const percentage = transparentPixels / (width * height);
    if (percentage >= threshold && !isScratched) {
      setIsScratched(true);
      onComplete();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect) {
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      scratch(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect) {
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      scratch(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) checkCompletion(ctx, canvas.width, canvas.height);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect && e.touches[0]) {
      const x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
      scratch(x, y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (canvas && rect && e.touches[0]) {
      const x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
      scratch(x, y);
    }
    if (e.cancelable) e.preventDefault();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-[2rem] overflow-hidden select-none touch-none"
    >
      {/* Target Content (Visible underneath) */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Canvas Overlay */}
      <AnimatePresence>
        {!isScratched && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 cursor-crosshair pointer-events-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
