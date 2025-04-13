/**
 * Map class for the tower defense game
 */
// Log that map.js is loaded
console.log('GameMap class loaded');

class GameMap {
  constructor(canvas, ctx, mapTemplate = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.mapTemplate = mapTemplate || {
      id: "classic",
      name: "Classic",
      description: "A simple path from left to right",
      difficulty: "Easy",
      pathType: "single",
      terrainFeatures: "basic"
    };

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
      OCCUPIED: 3,
      WALL: 4
    };

    // Colors for different tile types
    this.tileColors = {
      [this.TILE_TYPES.GRASS]: '#4CAF50',
      [this.TILE_TYPES.PATH]: '#795548',
      [this.TILE_TYPES.WATER]: '#2196F3',
      [this.TILE_TYPES.OCCUPIED]: '#9E9E9E',
      [this.TILE_TYPES.WALL]: '#424242'
    };

    // Initialize the grid
    this.initializeGrid();

    // Generate the path based on the map template
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

  // Generate a path based on the map template
  generatePath() {
    // Clear any existing path
    this.path = [];

    // Generate path based on map template type
    switch (this.mapTemplate.id) {
      case 'spiral':
        this.generateSpiralPath();
        break;
      case 'crossroads':
        this.generateCrossroadsPath();
        break;
      case 'islands':
        this.generateIslandsPath();
        break;
      case 'maze':
        this.generateMazePath();
        break;
      case 'classic':
      default:
        this.generateClassicPath();
        break;
    }

    // Convert grid coordinates to pixel coordinates for the path
    this.pathCoordinates = this.path.map(point => ({
      x: point.x * this.tileSize + this.tileSize / 2,
      y: point.y * this.tileSize + this.tileSize / 2
    }));
  }

  // Generate a classic path from left to right with some randomness
  generateClassicPath() {
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
  }

  // Generate a spiral path
  generateSpiralPath() {
    // Clear the grid first
    this.initializeGrid();

    // We'll start from the left edge and create a spiral

    // Start at the left edge
    let x = 0;
    let y = Math.floor(this.gridHeight / 2);

    this.path = [];

    // Direction vectors: right, down, left, up
    const directions = [
      {dx: 1, dy: 0},  // right
      {dx: 0, dy: 1},  // down
      {dx: -1, dy: 0}, // left
      {dx: 0, dy: -1}  // up
    ];

    // Initialize spiral parameters
    let dirIndex = 0;
    let stepsToTake = 1;  // Start with 1 step
    let stepsTaken = 0;
    let segmentsCompleted = 0;

    // Generate the spiral path
    const maxSteps = this.gridWidth * this.gridHeight; // Safety limit
    let stepCount = 0;

    while (stepCount < maxSteps) {
      // Add current position to path
      this.path.push({x, y});
      this.grid[y][x] = this.TILE_TYPES.PATH;

      // Check if we've reached the right edge
      if (x >= this.gridWidth - 1 && dirIndex === 0) {
        break; // Exit when we reach the right edge
      }

      // Move in current direction
      const dir = directions[dirIndex];
      x += dir.dx;
      y += dir.dy;

      // Check if we're within bounds
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        break;
      }

      stepsTaken++;
      stepCount++;

      // Check if we need to change direction
      if (stepsTaken === stepsToTake) {
        dirIndex = (dirIndex + 1) % 4; // Change direction
        stepsTaken = 0; // Reset steps taken
        segmentsCompleted++;

        // Increase steps to take after completing two segments
        if (segmentsCompleted % 2 === 0) {
          stepsToTake++;
        }
      }
    }

    console.log(`Generated spiral path with ${this.path.length} points`);
  }

  // Generate a crossroads path
  generateCrossroadsPath() {
    // Create a horizontal path
    for (let x = 0; x < this.gridWidth; x++) {
      const y = Math.floor(this.gridHeight / 2);
      this.path.push({x, y});
      this.grid[y][x] = this.TILE_TYPES.PATH;
    }

    // Create a vertical path
    for (let y = 0; y < this.gridHeight; y++) {
      const x = Math.floor(this.gridWidth / 2);
      if (this.grid[y][x] !== this.TILE_TYPES.PATH) {
        this.path.push({x, y});
        this.grid[y][x] = this.TILE_TYPES.PATH;
      }
    }

    // Add some water features
    if (this.mapTemplate.terrainFeatures === 'advanced') {
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * this.gridWidth);
        const y = Math.floor(Math.random() * this.gridHeight);

        if (this.grid[y][x] !== this.TILE_TYPES.PATH) {
          this.grid[y][x] = this.TILE_TYPES.WATER;
        }
      }
    }
  }

  // Generate an islands path
  generateIslandsPath() {
    // Create islands with water
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        // Create water in a grid pattern
        if ((x % 4 === 0 || y % 4 === 0) &&
            !(x % 8 === 0 && y % 8 === 0)) { // Leave some bridges
          this.grid[y][x] = this.TILE_TYPES.WATER;
        }
      }
    }

    // Create a winding path through the islands
    let x = 0;
    let y = Math.floor(this.gridHeight / 2);

    this.path = [{x, y}];
    this.grid[y][x] = this.TILE_TYPES.PATH;

    // Generate path until we reach the right edge
    while (x < this.gridWidth - 1) {
      // Possible directions: right, up, down
      const directions = [
        {dx: 1, dy: 0, weight: 3}, // Prefer right
        {dx: 0, dy: -1, weight: 1},
        {dx: 0, dy: 1, weight: 1}
      ];

      // Create a weighted random selection
      let totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedDir = directions[0];

      for (const dir of directions) {
        if (random < dir.weight) {
          selectedDir = dir;
          break;
        }
        random -= dir.weight;
      }

      // Move in that direction
      x += selectedDir.dx;
      y += selectedDir.dy;

      // Check if we're within bounds
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        break;
      }

      // Mark as path
      this.path.push({x, y});
      this.grid[y][x] = this.TILE_TYPES.PATH;
    }
  }

  // Generate a maze path
  generateMazePath() {
    // Clear the grid first
    this.initializeGrid();

    // Create walls throughout the grid
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        // Create a grid of walls with spaces in between
        if (x % 2 === 0 || y % 2 === 0) {
          this.grid[y][x] = this.TILE_TYPES.WALL;
        }
      }
    }

    // Create a path from left to right
    let x = 0;
    let y = 1;

    // Make sure the starting point is valid
    if (y >= this.gridHeight) y = this.gridHeight - 1;
    if (y % 2 === 0) y--; // Ensure y is odd to avoid walls
    if (y < 0) y = 1;

    this.path = [];

    // Create entrance
    this.path.push({x, y});
    this.grid[y][x] = this.TILE_TYPES.PATH;

    // Create a more complex maze path
    const visited = new Set(); // Track visited cells
    visited.add(`${x},${y}`);

    // Use a stack for depth-first maze generation
    const stack = [{x, y}];

    while (stack.length > 0 && x < this.gridWidth - 2) {
      const current = stack[stack.length - 1];
      x = current.x;
      y = current.y;

      // Possible directions: right, up, down
      const directions = [];

      // Strongly prefer moving right to ensure we reach the exit
      if (x < this.gridWidth - 2 && !visited.has(`${x+2},${y}`)) {
        directions.push({dx: 2, dy: 0, weight: 10}); // Heavy weight for right
      }

      // Add up/down with lower weights
      if (y > 2 && !visited.has(`${x},${y-2}`)) {
        directions.push({dx: 0, dy: -2, weight: 1});
      }
      if (y < this.gridHeight - 3 && !visited.has(`${x},${y+2}`)) {
        directions.push({dx: 0, dy: 2, weight: 1});
      }

      // If no unvisited neighbors, backtrack
      if (directions.length === 0) {
        stack.pop();
        continue;
      }

      // Choose a random direction with weighting
      let totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedDir = directions[0];

      for (const dir of directions) {
        if (random < dir.weight) {
          selectedDir = dir;
          break;
        }
        random -= dir.weight;
      }

      // Calculate new position
      const newX = x + selectedDir.dx;
      const newY = y + selectedDir.dy;

      // Mark the wall between cells as a path
      const wallX = x + selectedDir.dx / 2;
      const wallY = y + selectedDir.dy / 2;

      // Add to path and mark as visited
      this.path.push({x: wallX, y: wallY});
      this.grid[wallY][wallX] = this.TILE_TYPES.PATH;

      // Add the new cell to path and mark as visited
      this.path.push({x: newX, y: newY});
      this.grid[newY][newX] = this.TILE_TYPES.PATH;
      visited.add(`${newX},${newY}`);

      // Push the new cell to the stack
      stack.push({x: newX, y: newY});
    }

    // Ensure there's a path to the right edge
    let rightEdgeY = y;
    for (let i = x; i < this.gridWidth; i++) {
      this.path.push({x: i, y: rightEdgeY});
      this.grid[rightEdgeY][i] = this.TILE_TYPES.PATH;
    }

    console.log(`Generated maze path with ${this.path.length} points`);
  }

  // Find all tiles where towers can be built
  findBuildableTiles() {
    this.buildableTiles = [];

    // Make all grass tiles buildable
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x] === this.TILE_TYPES.GRASS) {
          this.buildableTiles.push({x, y});
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

    // Check if the tile is grass (not path, water, or already occupied)
    return this.grid[gridY][gridX] === this.TILE_TYPES.GRASS;
  }

  // Mark a tile as occupied by a tower
  placeTower(gridX, gridY) {
    if (this.canPlaceTower(gridX, gridY)) {
      this.grid[gridY][gridX] = this.TILE_TYPES.OCCUPIED;
      return true;
    }
    return false;
  }

  // Remove a tower and mark the tile as grass again
  removeTower(gridX, gridY) {
    if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
      if (this.grid[gridY][gridX] === this.TILE_TYPES.OCCUPIED) {
        this.grid[gridY][gridX] = this.TILE_TYPES.GRASS;
        console.log(`Tile at (${gridX}, ${gridY}) marked as grass again`);
        return true;
      }
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


    // Check if canvas and context are valid
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context is null in map.draw()');
      return;
    }

    // Check if grid is initialized
    if (!this.grid || this.grid.length === 0) {
      console.error('Grid is not initialized in map.draw()');
      this.initializeGrid();
      this.generatePath();
      this.findBuildableTiles();
    }

    // Draw all tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const tileType = this.grid[y][x];
        const tileX = x * this.tileSize;
        const tileY = y * this.tileSize;

        // Fill the tile with base color
        this.ctx.fillStyle = this.tileColors[tileType];
        this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);

        // Add texture details based on tile type
        switch(tileType) {
          case this.TILE_TYPES.GRASS:
            // Add grass texture
            this.ctx.fillStyle = 'rgba(0, 180, 0, 0.2)';
            for (let i = 0; i < 5; i++) {
              const grassX = tileX + Math.random() * this.tileSize;
              const grassY = tileY + Math.random() * this.tileSize;
              const size = 2 + Math.random() * 3;
              this.ctx.beginPath();
              this.ctx.arc(grassX, grassY, size, 0, Math.PI * 2);
              this.ctx.fill();
            }
            break;

          case this.TILE_TYPES.PATH:
            // Add path texture
            this.ctx.strokeStyle = 'rgba(150, 100, 50, 0.3)';
            this.ctx.lineWidth = 1;

            // Draw horizontal lines
            for (let i = 0; i < 3; i++) {
              const pathY = tileY + (i + 1) * (this.tileSize / 4);
              this.ctx.beginPath();
              this.ctx.moveTo(tileX, pathY);
              this.ctx.lineTo(tileX + this.tileSize, pathY);
              this.ctx.stroke();
            }
            break;

          case this.TILE_TYPES.WATER:
            // Add water texture
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            for (let i = 0; i < 3; i++) {
              const waveY = tileY + (i + 1) * (this.tileSize / 4);
              this.ctx.beginPath();
              this.ctx.moveTo(tileX, waveY);

              // Create wavy pattern
              for (let x = 0; x <= this.tileSize; x += 5) {
                const height = Math.sin(x / 10 + i) * 2;
                this.ctx.lineTo(tileX + x, waveY + height);
              }

              this.ctx.stroke();
            }
            break;

          case this.TILE_TYPES.WALL:
            // Add wall texture
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;

            // Draw brick pattern
            for (let i = 0; i < 4; i++) {
              const brickY = tileY + i * (this.tileSize / 4);
              this.ctx.beginPath();
              this.ctx.moveTo(tileX, brickY);
              this.ctx.lineTo(tileX + this.tileSize, brickY);
              this.ctx.stroke();

              const offset = (i % 2) * (this.tileSize / 2);
              for (let j = 0; j < 2; j++) {
                const brickX = tileX + offset + j * (this.tileSize / 2);
                this.ctx.beginPath();
                this.ctx.moveTo(brickX, brickY);
                this.ctx.lineTo(brickX, brickY + (this.tileSize / 4));
                this.ctx.stroke();
              }
            }
            break;
        }

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
      }
    }

    // Buildable tiles are no longer highlighted with yellow dots
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

// Map templates for different levels
const mapTemplates = [
  {
    id: "classic",
    name: "Classic",
    description: "A simple path from left to right",
    difficulty: "Easy",
    pathType: "single",
    terrainFeatures: "basic",
    infiniteMode: false
  },
  {
    id: "zigzag",
    name: "Zigzag",
    description: "A winding path with multiple turns",
    difficulty: "Medium",
    pathType: "zigzag",
    terrainFeatures: "basic",
    infiniteMode: false
  },
  {
    id: "spiral",
    name: "Spiral",
    description: "A spiral path that winds toward the center",
    difficulty: "Hard",
    pathType: "spiral",
    terrainFeatures: "advanced",
    infiniteMode: false
  },
  {
    id: "infinite",
    name: "Infinite Mode",
    description: "Endless waves with increasing difficulty",
    difficulty: "Extreme",
    pathType: "single",
    terrainFeatures: "basic",
    infiniteMode: true
  }
];
