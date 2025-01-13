import React, { useState, useRef, useEffect } from 'react';

const GRID_SIZE = 100;
const CELL_SIZE = 50;

const App = () => {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState({});
  const [isPolarityMode, setIsPolarityMode] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragRegion, setDragRegion] = useState(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the grid
    for (let x = -viewOffset.x % CELL_SIZE; x < canvas.width; x += CELL_SIZE) {
      for (let y = -viewOffset.y % CELL_SIZE; y < canvas.height; y += CELL_SIZE) {
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw cells
    Object.entries(grid).forEach(([key, value]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const screenX = gridX * CELL_SIZE - viewOffset.x;
      const screenY = gridY * CELL_SIZE - viewOffset.y;

      // Draw battery cell
      if (value.type === 'battery') {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw polarity markers
      if (value.polarity === 'positive') {
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE * 0.24, 0, Math.PI * 2);
        ctx.fill();
      } else if (value.polarity === 'negative') {
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (dragRegion) {
      const { startX, startY, endX, endY, button } = dragRegion;
      const x = Math.min(startX, endX) * CELL_SIZE - viewOffset.x;
      const y = Math.min(startY, endY) * CELL_SIZE - viewOffset.y;
      const width = (Math.abs(endX - startX) + 1) * CELL_SIZE;
      const height = (Math.abs(endY - startY) + 1) * CELL_SIZE;
    
      // Determine operation and stroke style
      let operationLabel = '';
      let backgroundColor = '';
      if (isPolarityMode) {
        if (button === 0) { // polarity mode, positive
          ctx.strokeStyle = 'red';
          backgroundColor = 'red';
          operationLabel = 'Make Positive';
        } else if (button === 2) { // polarity mode, negative
          ctx.strokeStyle = 'black';
          backgroundColor = 'black';
          operationLabel = 'Make Negative';
        }
      } else {
        if (button === 0) { // placement mode, add cells
          ctx.strokeStyle = 'green';
          backgroundColor = 'green';
          operationLabel = 'Add Cells';
        } else if (button === 2) { // placement mode, remove cells
          ctx.strokeStyle = 'red';
          backgroundColor = 'red';
          operationLabel = 'Remove Cells';
        }
      }
    
      // Draw drag region
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    
      // draw operation text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        operationLabel,
        x + width / 2, // Center X
        y + height / 2 // Center Y
      );
    
      const sizeLabel = `${Math.abs(endX - startX) + 1} x ${Math.abs(endY - startY) + 1}`; // "width x height"
      
      const labelX = x + width - 10;
      const labelY = y + height - 10
    
      // size text background
      ctx.fillStyle = backgroundColor;
      ctx.strokeStyle = backgroundColor;
      ctx.lineWidth = 4; 
      const textWidth = ctx.measureText(sizeLabel).width;
      const textHeight = 18;
    
     
      ctx.fillRect(labelX - textWidth - 10, labelY - textHeight - 5, textWidth + 10, textHeight + 5);
    
      // selection size text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      ctx.fillText(
        sizeLabel,
        labelX - textWidth / 2, 
        labelY - textHeight / 2 
      );
    }
    
    
    
    
    
    
  };

  const getMousePosition = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const getGridCoordinates = (x, y) => {
    return [
      Math.floor((x + viewOffset.x) / CELL_SIZE),
      Math.floor((y + viewOffset.y) / CELL_SIZE),
    ];
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
    } else {
      const { x, y } = getMousePosition(e);
      const [gridX, gridY] = getGridCoordinates(x, y);
      setDragStart({ x: gridX, y: gridY, button: e.button });
      setDragRegion({ startX: gridX, startY: gridY, endX: gridX, endY: gridY, button: e.button });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setViewOffset((offset) => ({
        x: offset.x - e.movementX,
        y: offset.y - e.movementY,
      }));
    } else if (dragStart) {
      const { x, y } = getMousePosition(e);
      const [gridX, gridY] = getGridCoordinates(x, y);
      setDragRegion((region) => ({
        ...region,
        endX: gridX,
        endY: gridY,
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragRegion) {
      const { startX, startY, endX, endY, button } = dragRegion;
      const newGrid = { ...grid };

      for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
        for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
          const key = `${x},${y}`;
          if (button === 0) {
            // Left click to add
            if (isPolarityMode) {
              if (newGrid[key]?.type === 'battery') {
                newGrid[key] = { ...newGrid[key], polarity: 'positive' };
              }
            } else {
              newGrid[key] = { type: 'battery' };
            }
          } else if (button === 2) {
            // Right click to remove
            if (isPolarityMode) {
              if (newGrid[key]?.type === 'battery') {
                newGrid[key].polarity = 'negative';
              }
            } else {
              delete newGrid[key];
            }
          }
        }
      }

      setGrid(newGrid);
    }
    setDragStart(null);
    setDragRegion(null);
    setIsPanning(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    drawCanvas();
  });

  return (
    <div className="min-h-screen bg-base-200">
      <div className="fixed top-0 left-0 right-0 z-10 bg-base-100 shadow-md p-4">
        <div className="collapse collapse-open">
          <input type="checkbox" className="hidden" />
          <div className="collapse-title text-xl font-medium">
            Grid Battery Placement
          </div>
          <div className="collapse-content">
            <button
              className="btn btn-primary mr-4"
              onClick={() => setIsPolarityMode(!isPolarityMode)}
            >
              {isPolarityMode ? 'Exit Polarity Mode' : 'Enter Polarity Mode'}
            </button>
            <button onClick={() => {console.log(grid)}} className="btn btn-primary btn-sm">Log Grid</button>
            <p>
              Use <strong>left-click</strong> to place batteries or set polarity (in polarity mode).
              Use <strong>right-click</strong> to remove batteries or set negative polarity.
              Use <strong>middle-click</strong> or <strong>Shift+drag</strong> to pan.
            </p>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="border border-gray-300 " 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};

export default App;
