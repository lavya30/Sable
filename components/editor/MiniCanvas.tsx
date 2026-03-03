'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface Props {
  width?: number;
  height?: number;
  initialData?: string;
  onChange?: (dataUrl: string) => void;
  readOnly?: boolean;
}

export function MiniCanvas({
  width = 180,
  height = 80,
  initialData,
  onChange,
  readOnly = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialData && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = initialData;
    }
  }, [initialData, width, height]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw all saved strokes
    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }

    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke, width, height]);

  useEffect(() => {
    if (!initialData) {
      redraw();
    }
  }, [redraw, initialData]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;

    // Draw with variable width for a hand-drawn feel
    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];

      // Vary width slightly based on speed (distance between points)
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speedFactor = Math.min(1, dist / 15);
      const w = stroke.width * (1.2 - speedFactor * 0.6);

      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);

      // Use quadratic curve for smoothness
      if (i < stroke.points.length - 1) {
        const p2 = stroke.points[i + 1];
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, mx, my);
      } else {
        ctx.lineTo(p1.x, p1.y);
      }
      ctx.stroke();
    }
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (readOnly) return;
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setCurrentStroke({
      points: [pos],
      color: '#2D3436',
      width: 1.8,
    });
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !currentStroke || readOnly) return;
    e.preventDefault();
    const pos = getPos(e);
    setCurrentStroke((prev) => {
      if (!prev) return prev;
      return { ...prev, points: [...prev.points, pos] };
    });
  }

  function handleEnd() {
    if (!isDrawing || !currentStroke || readOnly) return;
    setIsDrawing(false);
    if (currentStroke.points.length > 1) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);

      // Redraw and export
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (canvas && onChange) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            for (const s of newStrokes) drawStroke(ctx, s);
            onChange(canvas.toDataURL('image/png'));
          }
        }
      });
    }
    setCurrentStroke(null);
  }

  function handleUndo() {
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    setCurrentStroke(null);

    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas && onChange) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          for (const s of newStrokes) drawStroke(ctx, s);
          onChange(newStrokes.length > 0 ? canvas.toDataURL('image/png') : '');
        }
      }
    });
  }

  function handleClear() {
    setStrokes([]);
    setCurrentStroke(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, width, height);
      onChange?.('');
    }
  }

  return (
    <div className="mini-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`mini-canvas-el ${readOnly ? '' : 'mini-canvas-draw'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{ width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
      />
      {!readOnly && strokes.length > 0 && (
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            onClick={handleUndo}
            className="text-[10px] font-marker text-gray-400 hover:text-ink transition-colors"
            title="Undo last stroke"
          >
            undo
          </button>
          <span className="text-gray-300 text-[10px]">·</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-marker text-gray-400 hover:text-red-400 transition-colors"
            title="Clear drawing"
          >
            clear
          </button>
        </div>
      )}
    </div>
  );
}
