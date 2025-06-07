import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Trash2, Undo2, Redo2, Type, Square, Circle, Minus, ArrowUpRight, PenTool, Highlighter, Eraser } from 'lucide-react';
import jsPDF from 'jspdf';

const TOOL_PEN = 'pen';
const TOOL_ERASER = 'eraser';
const TOOL_HIGHLIGHTER = 'highlighter';
const TOOL_RECT = 'rect';
const TOOL_ELLIPSE = 'ellipse';
const TOOL_LINE = 'line';
const TOOL_ARROW = 'arrow';
const TOOL_TEXT = 'text';

const COLORS = ['#222', '#e11d48', '#2563eb', '#059669', '#f59e42', '#fbbf24', '#fff'];
const HIGHLIGHTER_COLORS = [
  'rgba(253, 255, 0, 0.20)', // yellow
  'rgba(0,255,128,0.18)',    // green
  'rgba(0,180,255,0.18)',    // blue
  'rgba(255,0,128,0.20)',    // pink
];
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState(TOOL_PEN);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [start, setStart] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState(null);
  const [drawingShape, setDrawingShape] = useState(null);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0]);

  // Save canvas state to history
  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    setHistory(prev => [...prev, url]);
    setRedoStack([]);
  };

  // Restore canvas from dataURL
  const restoreFrom = (url) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  };

  // Undo/redo handlers
  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = [...history];
    const last = prev.pop();
    setRedoStack(r => [canvasRef.current.toDataURL(), ...r]);
    setHistory(prev => prev.slice(0, -1));
    if (prev.length > 0) restoreFrom(prev[prev.length - 1]);
    else {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [first, ...rest] = redoStack;
    restoreFrom(first);
    setHistory(prev => [...prev, first]);
    setRedoStack(rest);
  };

  // Clear canvas
  const handleClear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveHistory();
  };

  // Export as PNG
  const handleExportPNG = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whiteboard.png';
    link.click();
  };

  // Export as PDF
  const handleExportPDF = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [CANVAS_WIDTH, CANVAS_HEIGHT] });
    pdf.addImage(url, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.save('whiteboard.pdf');
  };

  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let last = null;
    let shapeStart = null;
    let shapeType = null;
    let shapeColor = null;
    let shapeLineWidth = null;
    let shapeHighlight = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x: x * (CANVAS_WIDTH / rect.width), y: y * (CANVAS_HEIGHT / rect.height) };
    };

    const onDown = (e) => {
      if (tool === TOOL_TEXT) {
        const pos = getPos(e);
        setTextPos(pos);
        setTextInput('');
        return;
      }
      drawing = true;
      last = getPos(e);
      shapeStart = last;
      shapeType = tool;
      shapeColor = color;
      shapeLineWidth = lineWidth;
      shapeHighlight = tool === TOOL_HIGHLIGHTER;
      if ([TOOL_RECT, TOOL_ELLIPSE, TOOL_LINE, TOOL_ARROW].includes(tool)) {
        setDrawingShape({ type: tool, start: last, end: last, color, lineWidth });
      }
      if ([TOOL_PEN, TOOL_HIGHLIGHTER, TOOL_ERASER].includes(tool)) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
      }
    };

    const onMove = (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      if ([TOOL_PEN, TOOL_HIGHLIGHTER].includes(tool)) {
        ctx.strokeStyle = tool === TOOL_HIGHLIGHTER ? highlighterColor : color;
        ctx.lineWidth = tool === TOOL_HIGHLIGHTER ? 20 : lineWidth;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        last = pos;
      } else if (tool === TOOL_ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = lineWidth * 2.5;
        ctx.lineCap = 'round';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        last = pos;
        ctx.globalCompositeOperation = 'source-over';
      } else if ([TOOL_RECT, TOOL_ELLIPSE, TOOL_LINE, TOOL_ARROW].includes(tool)) {
        setDrawingShape({ type: tool, start: shapeStart, end: pos, color: shapeColor, lineWidth: shapeLineWidth });
      }
    };

    const onUp = (e) => {
      if (!drawing) return;
      drawing = false;
      const pos = getPos(e);
      if ([TOOL_PEN, TOOL_HIGHLIGHTER].includes(tool)) {
        ctx.closePath();
        saveHistory();
      } else if (tool === TOOL_ERASER) {
        ctx.closePath();
        saveHistory();
      } else if ([TOOL_RECT, TOOL_ELLIPSE, TOOL_LINE, TOOL_ARROW].includes(tool)) {
        // Draw the shape
        drawShape(ctx, tool, shapeStart, pos, shapeColor, shapeLineWidth);
        setDrawingShape(null);
        saveHistory();
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown);
    canvas.addEventListener('touchmove', onMove);
    canvas.addEventListener('touchend', onUp);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
    // eslint-disable-next-line
  }, [tool, color, lineWidth, highlighterColor]);

  // Draw shape preview
  useEffect(() => {
    if (!drawingShape) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    restoreFrom(history[history.length - 1]);
    drawShape(ctx, drawingShape.type, drawingShape.start, drawingShape.end, drawingShape.color, drawingShape.lineWidth, true);
    // eslint-disable-next-line
  }, [drawingShape]);

  // Draw shape helper
  function drawShape(ctx, type, start, end, color, lineWidth, preview = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = preview ? 0.5 : 1;
    ctx.beginPath();
    if (type === TOOL_RECT) {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (type === TOOL_ELLIPSE) {
      ctx.ellipse((start.x + end.x) / 2, (start.y + end.y) / 2, Math.abs(end.x - start.x) / 2, Math.abs(end.y - start.y) / 2, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (type === TOOL_LINE) {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (type === TOOL_ARROW) {
      // Draw line
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      // Draw arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headlen = 18;
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Text tool logic
  useEffect(() => {
    if (!textPos || !textInput) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.font = `${24 + lineWidth * 2}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y + 24);
    ctx.restore();
    setTextPos(null);
    setTextInput('');
    saveHistory();
    // eslint-disable-next-line
  }, [textInput]);

  // Initial blank history
  useEffect(() => {
    if (history.length === 0) {
      saveHistory();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white/80 border-b sticky top-0 z-0">
        <Button variant={tool===TOOL_PEN?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_PEN)}><PenTool /></Button>
        <Button variant={tool===TOOL_HIGHLIGHTER?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_HIGHLIGHTER)}><Highlighter /></Button>
        <Button variant={tool===TOOL_ERASER?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_ERASER)}><Eraser /></Button>
        <Button variant={tool===TOOL_RECT?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_RECT)}><Square /></Button>
        <Button variant={tool===TOOL_ELLIPSE?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_ELLIPSE)}><Circle /></Button>
        <Button variant={tool===TOOL_LINE?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_LINE)}><Minus /></Button>
        <Button variant={tool===TOOL_ARROW?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_ARROW)}><ArrowUpRight /></Button>
        <Button variant={tool===TOOL_TEXT?'default':'ghost'} size="icon" onClick={()=>setTool(TOOL_TEXT)}><Type /></Button>
        <div className="flex items-center gap-1 ml-4">
          {tool === TOOL_HIGHLIGHTER ? (
            HIGHLIGHTER_COLORS.map((c, i) => (
              <button key={c} className="w-6 h-6 rounded-full border-2 border-white shadow" style={{background:c, outline: highlighterColor===c?'2px solid #333':'none'}} onClick={()=>setHighlighterColor(c)} />
            ))
          ) : (
            COLORS.map(c => (
              <button key={c} className="w-6 h-6 rounded-full border-2 border-white shadow" style={{background:c, outline: color===c?'2px solid #333':'none'}} onClick={()=>setColor(c)} />
            ))
          )}
        </div>
        <input type="range" min={1} max={12} value={lineWidth} onChange={e=>setLineWidth(Number(e.target.value))} className="mx-2 w-24" />
        <Button variant="ghost" size="icon" onClick={handleUndo}><Undo2 /></Button>
        <Button variant="ghost" size="icon" onClick={handleRedo}><Redo2 /></Button>
        <Button variant="ghost" size="icon" onClick={handleClear}><Trash2 /></Button>
        <Button variant="ghost" size="icon" onClick={handleExportPNG}><Download /></Button>
        <Button variant="ghost" size="icon" onClick={handleExportPDF}><Download className="rotate-90" /></Button>
      </div>
      {/* Canvas area */}
      <div className="flex-1 relative bg-white">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full touch-none cursor-crosshair bg-transparent" />
        {/* Text input overlay */}
        {tool===TOOL_TEXT && textPos && (
          <Input style={{position:'absolute', left:textPos.x, top:textPos.y, zIndex:20, width:200}} value={textInput} onChange={e=>setTextInput(e.target.value)} onBlur={()=>setTextInput(textInput)} autoFocus />
        )}
      </div>
    </div>
  );
};

export default Whiteboard; 