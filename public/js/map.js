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
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    // Start at the edge and spiral inward
    let x = 0;
    let y = Math.floor(this.gridHeight / 2);

    this.path = [{x, y}];
    this.grid[y][x] = this.TILE_TYPES.PATH;

    // Direction vectors: right, down, left, up
    const directions = [
      {dx: 1, dy: 0},
      {dx: 0, dy: 1},
      {dx: -1, dy: 0},
      {dx: 0, dy: -1}
    ];

    let dirIndex = 0;
    let stepsInCurrentDirection = 0;
    let maxStepsInCurrentDirection = this.gridWidth - 1;
    let turnCount = 0;

    // Generate spiral path
    while (stepsInCurrentDirection < maxStepsInCurrentDirection) {
      // Move in current direction
      const dir = directions[dirIndex];
      x += dir.dx;
      y += dir.dy;

      // Check if we're within bounds
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        break;
      }

      // Mark as path
      this.path.push({x, y});
      this.grid[y][x] = this.TILE_TYPES.PATH;

      stepsInCurrentDirection++;

      // Check if we need to turn
      if (stepsInCurrentDirection >= maxStepsInCurrentDirection) {
        dirIndex = (dirIndex + 1) % 4;
        turnCount++;
        stepsInCurrentDirection = 0;

        // After every 2 turns, reduce the max steps
        if (turnCount % 2 === 0) {
          maxStepsInCurrentDirection--;
        }
      }
    }
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
    // Fill the grid with walls
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (x % 2 === 0 || y % 2 === 0) {
          this.grid[y][x] = this.TILE_TYPES.WALL;
        }
      }
    }

    // Create a path from left to right
    let x = 0;
    let y = 1;

    this.path = [{x, y}];
    this.grid[y][x] = this.TILE_TYPES.PATH;

    // Generate path until we reach the right edge
    while (x < this.gridWidth - 1) {
      // Possible directions: right, up, down
      const directions = [{dx: 1, dy: 0, weight: 5}]; // Prefer right

      // Add up/down if within bounds
      if (y > 1) {
        directions.push({dx: 0, dy: -1, weight: 1});
      }
      if (y < this.gridHeight - 2) {
        directions.push({dx: 0, dy: 1, weight: 1});
      }

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

      // Occasionally create a branch
      if (Math.random() < 0.2) {
        this.createMazeBranch(x, y);
      }
    }
  }

  // Create a branch in the maze
  createMazeBranch(startX, startY) {
    let x = startX;
    let y = startY;
    let length = Math.floor(Math.random() * 5) + 3;

    // Choose a random direction: up or down
    const dy = Math.random() < 0.5 ? -1 : 1;

    for (let i = 0; i < length; i++) {
      y += dy;

      // Check if we're within bounds
      if (y < 0 || y >= this.gridHeight) {
        break;
      }

      // Mark as path
      this.grid[y][x] = this.TILE_TYPES.PATH;
    }
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
