/**
 * Map class for the tower defense game
 */
class GameMap {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.tileSize = 64;
    this.gridWidth = Math.floor(canvas.width / this.tileSize);
    this.gridHeight = Math.floor(canvas.height / this.tileSize);
    this.grid = [];
    this.path = [];
    this.pathCoordinates = [];
    this.buildableTiles = [];
    
    // Map tile types
    this.TILE_TYPES = {
      GRASS: 0,
      PATH: 1,
      WATER: 2,
      OCCUPIED: 3
    };
    
    // Colors for different tile types
    this.tileColors = {
      [this.TILE_TYPES.GRASS]: '#4CAF50',
      [this.TILE_TYPES.PATH]: '#795548',
      [this.TILE_TYPES.WATER]: '#2196F3',
      [this.TILE_TYPES.OCCUPIED]: '#9E9E9E'
    };
    
    // Initialize the grid
    this.initializeGrid();
    
    // Generate the path
    this.generatePath();
    
    // Find buildable tiles
    this.findBuildableTiles();
  }
  
  // Initialize the grid with grass
  initializeGrid() {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      const row = [];
      for (let x = 0; x < this.gridWidth; x++) {
        row.push(this.TILE_TYPES.GRASS);
      }
      this.grid.push(row);
    }
  }
  
  // Generate a path from left to right with some randomness
  generatePath() {
    // Start at the left edge
    let x = 0;
    let y = Math.floor(this.gridHeight / 2);
    
    this.path = [{x, y}];
    this.grid[y][x] = this.TILE_TYPES.PATH;
    
    // Generate path until we reach the right edge
    while (x < this.gridWidth - 1) {
      // Possible directions: right, up, down
      const directions = [{dx: 1, dy: 0}]; // Always include right
      
      // Add up/down if within bounds and not creating a loop
      if (y > 1 && this.grid[y-1][x] !== this.TILE_TYPES.PATH) {
        directions.push({dx: 0, dy: -1});
      }
      if (y < this.gridHeight - 2 && this.grid[y+1][x] !== this.TILE_TYPES.PATH) {
        directions.push({dx: 0, dy: 1});
      }
      
      // Choose a random direction
      const dir = directions[Math.floor(Math.random() * directions.length)];
      
      // Move in that direction
      x += dir.dx;
      y += dir.dy;
      
      // Mark as path
      this.path.push({x, y});
      this.grid[y][x] = this.TILE_TYPES.PATH;
    }
    
    // Convert grid coordinates to pixel coordinates for the path
    this.pathCoordinates = this.path.map(point => ({
      x: point.x * this.tileSize + this.tileSize / 2,
      y: point.y * this.tileSize + this.tileSize / 2
    }));
  }
  
  // Find all tiles where towers can be built (adjacent to path but not on path)
  findBuildableTiles() {
    this.buildableTiles = [];
    
    // Check all grass tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x] === this.TILE_TYPES.GRASS) {
          // Check if adjacent to path
          const adjacentToPath = this.isAdjacentToPath(x, y);
          
          if (adjacentToPath) {
            this.buildableTiles.push({x, y});
          }
        }
      }
    }
  }
  
  // Check if a tile is adjacent to the path
  isAdjacentToPath(x, y) {
    const directions = [
      {dx: 1, dy: 0},
      {dx: -1, dy: 0},
      {dx: 0, dy: 1},
      {dx: 0, dy: -1}
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      // Check if within bounds
      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        if (this.grid[ny][nx] === this.TILE_TYPES.PATH) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Check if a tower can be placed at the given grid coordinates
  canPlaceTower(gridX, gridY) {
    // Check if within bounds
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }
    
    // Check if the tile is grass and buildable
    return this.grid[gridY][gridX] === this.TILE_TYPES.GRASS && 
           this.buildableTiles.some(tile => tile.x === gridX && tile.y === gridY);
  }
  
  // Mark a tile as occupied by a tower
  placeTower(gridX, gridY) {
    if (this.canPlaceTower(gridX, gridY)) {
      this.grid[gridY][gridX] = this.TILE_TYPES.OCCUPIED;
      return true;
    }
    return false;
  }
  
  // Convert pixel coordinates to grid coordinates
  pixelToGrid(x, y) {
    return {
      x: Math.floor(x / this.tileSize),
      y: Math.floor(y / this.tileSize)
    };
  }
  
  // Convert grid coordinates to pixel coordinates (center of tile)
  gridToPixel(gridX, gridY) {
    return {
      x: gridX * this.tileSize + this.tileSize / 2,
      y: gridY * this.tileSize + this.tileSize / 2
    };
  }
  
  // Draw the map
  draw() {
    // Draw all tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tileType = this.grid[y][x];
        this.ctx.fillStyle = this.tileColors[tileType];
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }
    
    // Highlight buildable tiles with a subtle glow
    this.ctx.save();
    this.ctx.globalAlpha = 0.2;
    this.buildableTiles.forEach(tile => {
      if (this.grid[tile.y][tile.x] === this.TILE_TYPES.GRASS) {
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(
          tile.x * this.tileSize + this.tileSize / 2,
          tile.y * this.tileSize + this.tileSize / 2,
          this.tileSize / 4,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
    this.ctx.restore();
  }
  
  // Resize the map when the canvas size changes
  resize() {
    this.gridWidth = Math.floor(this.canvas.width / this.tileSize);
    this.gridHeight = Math.floor(this.canvas.height / this.tileSize);
    
    // Reinitialize the grid and path
    this.initializeGrid();
    this.generatePath();
    this.findBuildableTiles();
  }
}
