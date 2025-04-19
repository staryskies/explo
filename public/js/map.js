/**
 * Map class for the tower defense game
 */
// Log that map.js is loaded
console.log('GameMap class loaded');

class GameMap {
  constructor(canvas, ctx, mapTemplate = null) {
    // Ensure canvas and context are valid
    if (!canvas || !ctx) {
      console.error('Invalid canvas or context in GameMap constructor');
      return;
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.mapTemplate = mapTemplate || {
      id: "classic",
      name: "Classic",
      description: "A simple path from left to right",
      difficulty: "Easy",
      pathType: "single",
      terrainFeatures: "basic",
      backgroundColor: "#4CAF50", // Green grass
      pathColor: "#795548",       // Brown path
      decorationColors: ["#8BC34A", "#689F38", "#33691E"] // Various green shades for decoration
    };

    console.log('Creating map with canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('Map template:', this.mapTemplate.name);

    this.tileSize = 64;
    this.gridWidth = Math.max(1, Math.floor(canvas.width / this.tileSize));
    this.gridHeight = Math.max(1, Math.floor(canvas.height / this.tileSize));
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

    // Get game difficulty if available
    this.difficulty = window.game?.difficulty || 'easy';

    // Set colors based on map template and difficulty
    this.tileColors = this.getDifficultyColors();

    // Add blackout effect for Hard and Nightmare difficulties (not Void)
    this.useBlackoutEffect = this.difficulty === 'hard' || this.difficulty === 'nightmare';
    this.blackoutTimer = 0;
    this.blackoutActive = false;
    this.blackoutAlpha = 0;

    // Add permanent darkness for Nightmare with light orbs (not Void)
    this.usePermanentDarkness = this.difficulty === 'nightmare';

    // Initialize light orbs for Nightmare and Void
    if (this.usePermanentDarkness) {
      this.lightOrbs = [];
      this.initializeLightOrbs();
    }

    // Add void effect for Void difficulty - tiles disappear into the void
    this.useVoidEffect = this.difficulty === 'void';
    if (this.useVoidEffect) {
      // Track which tiles are visible (start with all visible)
      this.visibleTiles = [];
      for (let y = 0; y < this.gridHeight; y++) {
        const row = [];
        for (let x = 0; x < this.gridWidth; x++) {
          row.push(true); // All tiles start visible
        }
        this.visibleTiles.push(row);
      }

      // Track important tiles that should remain visible
      this.importantTiles = [];

      // Track the void effect progress
      this.voidProgress = 0;
      this.lastVoidUpdateTime = 0;
      this.voidUpdateInterval = 5000; // Update every 5 seconds

      // Number of tiles to keep visible at the end
      this.tilesRemainingAtEnd = 12;

      // Track void spikes
      this.voidSpikes = [];
      this.lastSpikeTime = 0;
      this.spikeInterval = 2000; // New spike every 2 seconds

      // Initialize the void effect
      this.initializeVoidEffect();
    }

    // Store decoration colors for use in draw method
    this.decorationColors = this.mapTemplate.decorationColors || ["#8BC34A", "#689F38", "#33691E"];

    console.log('Map grid dimensions:', this.gridWidth, 'x', this.gridHeight);

    // Initialize the grid
    this.initializeGrid();

    // Generate the path based on the map template
    this.generatePath();

    // Find buildable tiles
    this.findBuildableTiles();

    console.log('Map initialization complete');
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

  // Get map colors based on difficulty
  getDifficultyColors() {
    // Base colors from map template
    const baseBackgroundColor = this.mapTemplate.backgroundColor || '#4CAF50';
    const basePathColor = this.mapTemplate.pathColor || '#795548';

    // Difficulty-specific colors
    switch(this.difficulty) {
      case 'easy':
        return {
          [this.TILE_TYPES.GRASS]: baseBackgroundColor,
          [this.TILE_TYPES.PATH]: basePathColor,
          [this.TILE_TYPES.WATER]: '#2196F3',
          [this.TILE_TYPES.OCCUPIED]: '#9E9E9E',
          [this.TILE_TYPES.WALL]: '#424242'
        };
      case 'medium':
        return {
          [this.TILE_TYPES.GRASS]: '#3E8E41', // Darker green
          [this.TILE_TYPES.PATH]: '#5D4037', // Darker brown
          [this.TILE_TYPES.WATER]: '#1976D2', // Darker blue
          [this.TILE_TYPES.OCCUPIED]: '#757575',
          [this.TILE_TYPES.WALL]: '#212121'
        };
      case 'hard':
        return {
          [this.TILE_TYPES.GRASS]: '#2E7D32', // Even darker green
          [this.TILE_TYPES.PATH]: '#4E342E', // Even darker brown
          [this.TILE_TYPES.WATER]: '#0D47A1', // Deep blue
          [this.TILE_TYPES.OCCUPIED]: '#616161',
          [this.TILE_TYPES.WALL]: '#212121'
        };
      case 'nightmare':
        return {
          [this.TILE_TYPES.GRASS]: '#1B5E20', // Very dark green
          [this.TILE_TYPES.PATH]: '#3E2723', // Very dark brown
          [this.TILE_TYPES.WATER]: '#01579B', // Very dark blue
          [this.TILE_TYPES.OCCUPIED]: '#424242',
          [this.TILE_TYPES.WALL]: '#000000'
        };
      case 'void':
        return {
          [this.TILE_TYPES.GRASS]: '#263238', // Almost black blue-gray
          [this.TILE_TYPES.PATH]: '#1A237E', // Deep indigo
          [this.TILE_TYPES.WATER]: '#311B92', // Deep purple
          [this.TILE_TYPES.OCCUPIED]: '#212121',
          [this.TILE_TYPES.WALL]: '#000000'
        };
      default:
        return {
          [this.TILE_TYPES.GRASS]: baseBackgroundColor,
          [this.TILE_TYPES.PATH]: basePathColor,
          [this.TILE_TYPES.WATER]: '#2196F3',
          [this.TILE_TYPES.OCCUPIED]: '#9E9E9E',
          [this.TILE_TYPES.WALL]: '#424242'
        };
    }
  }

  // Draw the map
  draw(currentTime = performance.now()) {
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

    // Safety check for grid dimensions
    if (this.gridHeight <= 0 || this.gridWidth <= 0) {
      console.error('Invalid grid dimensions:', this.gridWidth, 'x', this.gridHeight);
      // Draw a fallback green background
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    // Update void effect if active
    if (this.useVoidEffect) {
      this.updateVoidEffect(currentTime);
    }

    // Draw all tiles
    try {
      // First, draw the base background color across the entire canvas
      this.ctx.fillStyle = this.tileColors[this.TILE_TYPES.GRASS];
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Add decorative elements based on map type
      this.drawMapDecorations();

      // Draw the actual grid tiles
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          // Safety check for grid access
          if (!this.grid[y] || typeof this.grid[y][x] === 'undefined') {
            console.error(`Invalid grid access at [${y}][${x}]`);
            continue;
          }

          // Skip tiles that have disappeared into the void
          if (this.useVoidEffect && this.visibleTiles[y] && this.visibleTiles[y][x] === false) {
            continue;
          }

          const tileType = this.grid[y][x];

          // Only draw non-grass tiles (since we already filled the background)
          if (tileType !== this.TILE_TYPES.GRASS) {
            this.ctx.fillStyle = this.tileColors[tileType] || '#4CAF50';
            this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          }

          // Draw subtle grid lines
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
          this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

          // For void effect, draw a special effect on visible tiles
          if (this.useVoidEffect && this.visibleTiles[y] && this.visibleTiles[y][x] === true) {
            // Draw a subtle void glow around the tile
            const glowColor = 'rgba(75, 0, 130, 0.2)'; // Indigo glow
            this.ctx.fillStyle = glowColor;
            this.ctx.fillRect(
              x * this.tileSize - 2,
              y * this.tileSize - 2,
              this.tileSize + 4,
              this.tileSize + 4
            );
          }
        }
      }

      // Draw path highlights or special effects based on map type
      this.drawPathEffects();

      // Apply blackout effect for harder difficulties
      if (this.useBlackoutEffect) {
        this.updateBlackoutEffect(currentTime);
      }

      // Draw void spikes for Void difficulty
      if (this.useVoidEffect) {
        this.drawVoidSpikes(currentTime);
      }

    } catch (error) {
      console.error('Error drawing map:', error);
      // Draw a fallback green background
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Initialize the void effect for Void difficulty
  initializeVoidEffect() {
    // Clear any existing important tiles
    this.importantTiles = [];

    // Always keep the path visible
    for (const point of this.path) {
      this.importantTiles.push({x: point.x, y: point.y});
    }

    // Keep some tiles around the path visible
    const directions = [
      {dx: 1, dy: 0},
      {dx: -1, dy: 0},
      {dx: 0, dy: 1},
      {dx: 0, dy: -1}
    ];

    // Add tiles adjacent to the path (but not all of them)
    for (let i = 0; i < this.path.length; i += 3) { // Only check every 3rd path tile
      const point = this.path[i];

      // Add some adjacent tiles
      for (const dir of directions) {
        const nx = point.x + dir.dx;
        const ny = point.y + dir.dy;

        // Check if within bounds and not already in important tiles
        if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
          // Only add some tiles (random selection)
          if (Math.random() < 0.3) { // 30% chance to add
            this.importantTiles.push({x: nx, y: ny});
          }
        }
      }
    }

    // If we have too many important tiles, remove some randomly
    while (this.importantTiles.length > this.tilesRemainingAtEnd) {
      // Remove a random non-path tile
      const nonPathTiles = this.importantTiles.filter(tile =>
        !this.path.some(pathTile => pathTile.x === tile.x && pathTile.y === tile.y)
      );

      if (nonPathTiles.length > 0) {
        const tileToRemove = nonPathTiles[Math.floor(Math.random() * nonPathTiles.length)];
        this.importantTiles = this.importantTiles.filter(tile =>
          !(tile.x === tileToRemove.x && tile.y === tileToRemove.y)
        );
      } else {
        // If we only have path tiles left, we're done
        break;
      }
    }
  }

  // Initialize light orbs for Nightmare and Void difficulties
  initializeLightOrbs() {
    // Clear any existing orbs
    this.lightOrbs = [];

    // Number of orbs based on map size - significantly increased
    const numOrbs = Math.max(8, Math.floor((this.gridWidth * this.gridHeight) / 50));

    // Create orbs
    for (let i = 0; i < numOrbs; i++) {
      this.lightOrbs.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 15 + 20, // Light radius between 20-35 pixels (smaller)
        color: this.difficulty === 'nightmare' ? '#29B6F6' : '#7E57C2', // Blue for nightmare, purple for void
        speedX: (Math.random() - 0.5) * 0.7, // Random speed between -0.35 and 0.35 (faster)
        speedY: (Math.random() - 0.5) * 0.7,
        pulseSpeed: Math.random() * 0.005 + 0.002, // How fast the orb pulses
        pulsePhase: Math.random() * Math.PI * 2, // Random starting phase
        intensity: Math.random() * 0.2 + 0.5 // Light intensity between 0.5 and 0.7 (dimmer)
      });
    }

    // Add a few stationary orbs at strategic locations (path intersections, etc.)
    const numStaticOrbs = Math.min(5, Math.floor(this.path.length / 10));
    for (let i = 0; i < numStaticOrbs; i++) {
      // Place orbs at different points along the path
      const pathIndex = Math.floor(this.path.length * (i + 1) / (numStaticOrbs + 1));
      if (pathIndex < this.path.length && this.pathCoordinates[pathIndex]) {
        const pathPoint = this.pathCoordinates[pathIndex];
        this.lightOrbs.push({
          x: pathPoint.x,
          y: pathPoint.y,
          radius: 25, // Slightly larger static orbs
          color: this.difficulty === 'nightmare' ? '#4FC3F7' : '#9575CD',
          speedX: 0,
          speedY: 0,
          pulseSpeed: 0.003,
          pulsePhase: Math.random() * Math.PI * 2,
          intensity: 0.7
        });
      }
    }
  }

  // Update light orbs positions and properties
  updateLightOrbs(currentTime) {
    // Update each orb
    for (let i = 0; i < this.lightOrbs.length; i++) {
      const orb = this.lightOrbs[i];

      // Skip stationary orbs
      if (orb.speedX === 0 && orb.speedY === 0) {
        // Just update pulse for stationary orbs
        const pulse = Math.sin(currentTime * orb.pulseSpeed + orb.pulsePhase);
        orb.currentRadius = orb.radius * (1 + pulse * 0.2); // Pulse by 20%
        continue;
      }

      // Move the orb
      orb.x += orb.speedX;
      orb.y += orb.speedY;

      // Bounce off edges
      if (orb.x < 0 || orb.x > this.canvas.width) {
        orb.speedX *= -1;
      }
      if (orb.y < 0 || orb.y > this.canvas.height) {
        orb.speedY *= -1;
      }

      // Keep within bounds
      orb.x = Math.max(0, Math.min(this.canvas.width, orb.x));
      orb.y = Math.max(0, Math.min(this.canvas.height, orb.y));

      // Pulse the radius
      const pulse = Math.sin(currentTime * orb.pulseSpeed + orb.pulsePhase);
      orb.currentRadius = orb.radius * (1 + pulse * 0.2); // Pulse by 20%
    }
  }

  // Draw the light orbs and darkness overlay
  drawDarknessWithLightOrbs(currentTime) {
    // Skip if not using permanent darkness
    if (!this.usePermanentDarkness) return;

    // Update orb positions and properties
    this.updateLightOrbs(currentTime);

    // Create a composite operation to show only the lit areas
    this.ctx.globalCompositeOperation = 'source-over';

    // Draw a dark overlay across the entire canvas
    const darknessAlpha = this.difficulty === 'nightmare' ? 0.92 : 0.98; // 92% darkness for nightmare (reduced from 96%), 98% for void
    this.ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Switch to 'destination-out' to cut holes in the darkness
    this.ctx.globalCompositeOperation = 'destination-out';

    // Draw each light orb as a radial gradient
    for (const orb of this.lightOrbs) {
      const radius = orb.currentRadius || orb.radius;
      const gradient = this.ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, radius
      );

      gradient.addColorStop(0, `rgba(255, 255, 255, ${orb.intensity})`);
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over';

    // Draw orb glows (visual effect only)
    for (const orb of this.lightOrbs) {
      const radius = orb.currentRadius || orb.radius;

      // Draw the orb glow
      const glowGradient = this.ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, radius * 0.3
      );

      glowGradient.addColorStop(0, orb.color);
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Draw void spikes coming from the borders
  drawVoidSpikes(currentTime) {
    // Update spikes
    this.updateVoidSpikes(currentTime);

    // Draw each spike
    for (const spike of this.voidSpikes) {
      // Calculate the spike path
      const startX = spike.startX;
      const startY = spike.startY;
      const endX = spike.endX;
      const endY = spike.endY;

      // Calculate current position based on progress
      const currentX = startX + (endX - startX) * spike.progress;
      const currentY = startY + (endY - startY) * spike.progress;

      // Draw the spike
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(currentX, currentY);

      // Determine color based on progress
      let color;
      if (spike.progress < 0.5) {
        // Start with dark purple
        color = '#4A148C'; // Dark purple
      } else {
        // Transition to black
        const transitionProgress = (spike.progress - 0.5) * 2; // 0 to 1
        const r = Math.floor(74 * (1 - transitionProgress)); // 74 to 0
        const g = Math.floor(20 * (1 - transitionProgress)); // 20 to 0
        const b = Math.floor(140 * (1 - transitionProgress)); // 140 to 0
        color = `rgb(${r}, ${g}, ${b})`;
      }

      // Set line style
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = spike.width;
      this.ctx.lineCap = 'round';

      // Draw the spike
      this.ctx.stroke();

      // If spike has reached its target, draw a void circle
      if (spike.progress >= 1) {
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, spike.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  // Update void spikes
  updateVoidSpikes(currentTime) {
    // Check if it's time to create a new spike
    if (!this.lastSpikeTime) {
      this.lastSpikeTime = currentTime;
    }

    const timeSinceLastSpike = currentTime - this.lastSpikeTime;

    // Create new spikes at intervals
    if (timeSinceLastSpike > this.spikeInterval) {
      this.createNewVoidSpike();
      this.lastSpikeTime = currentTime;
    }

    // Update existing spikes
    for (let i = 0; i < this.voidSpikes.length; i++) {
      const spike = this.voidSpikes[i];

      // Update progress
      spike.progress += 0.01; // Speed of spike movement

      // Remove completed spikes
      if (spike.progress > 1.2) { // Give a little extra time to show the void circle
        this.voidSpikes.splice(i, 1);
        i--;
      }
    }
  }

  // Create a new void spike
  createNewVoidSpike() {
    // Determine a random edge to start from
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    let startX, startY, endX, endY;

    // Calculate start position (on the edge)
    switch (edge) {
      case 0: // Top
        startX = Math.random() * this.canvas.width;
        startY = 0;
        break;
      case 1: // Right
        startX = this.canvas.width;
        startY = Math.random() * this.canvas.height;
        break;
      case 2: // Bottom
        startX = Math.random() * this.canvas.width;
        startY = this.canvas.height;
        break;
      case 3: // Left
        startX = 0;
        startY = Math.random() * this.canvas.height;
        break;
    }

    // Calculate end position (somewhere in the map)
    // Bias towards the center for more interesting patterns
    const centerBias = 0.7; // 0 to 1, higher means more towards center
    endX = this.canvas.width / 2 + (Math.random() - 0.5) * this.canvas.width * (1 - centerBias);
    endY = this.canvas.height / 2 + (Math.random() - 0.5) * this.canvas.height * (1 - centerBias);

    // Create the spike
    this.voidSpikes.push({
      startX,
      startY,
      endX,
      endY,
      width: Math.random() * 5 + 3, // Width between 3 and 8
      progress: 0
    });
  }

  // Update the void effect - make tiles gradually disappear
  updateVoidEffect(currentTime) {
    // Skip if not using void effect
    if (!this.useVoidEffect) return;

    // Check if it's time to update
    if (!this.lastVoidUpdateTime) {
      this.lastVoidUpdateTime = currentTime;
      return;
    }

    // Calculate time since last update
    const timeDelta = currentTime - this.lastVoidUpdateTime;

    // Only update at certain intervals
    if (timeDelta < this.voidUpdateInterval) return;

    // Update the last update time
    this.lastVoidUpdateTime = currentTime;

    // Increase the void progress
    this.voidProgress += 0.05; // 5% more tiles disappear each update

    // Cap at 1.0 (100% complete)
    if (this.voidProgress > 1.0) {
      this.voidProgress = 1.0;
    }

    // Calculate how many tiles should be visible
    const totalTiles = this.gridWidth * this.gridHeight;
    const tilesToKeepVisible = Math.max(
      this.tilesRemainingAtEnd,
      Math.floor(totalTiles * (1 - this.voidProgress))
    );

    // Reset visibility
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        // Check if this is an important tile that should always remain visible
        const isImportantTile = this.importantTiles.some(tile => tile.x === x && tile.y === y);

        if (isImportantTile) {
          // Important tiles always stay visible
          this.visibleTiles[y][x] = true;
        } else {
          // Non-important tiles have a chance to disappear based on void progress
          const disappearChance = this.voidProgress * 1.2; // Slightly higher chance to create a more dramatic effect
          this.visibleTiles[y][x] = Math.random() > disappearChance;
        }
      }
    }

    // If we have too many visible tiles, hide some random ones (except important ones)
    let visibleCount = 0;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.visibleTiles[y][x]) {
          visibleCount++;
        }
      }
    }

    // Create a list of non-important visible tiles
    const nonImportantVisibleTiles = [];
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.visibleTiles[y][x]) {
          const isImportantTile = this.importantTiles.some(tile => tile.x === x && tile.y === y);
          if (!isImportantTile) {
            nonImportantVisibleTiles.push({x, y});
          }
        }
      }
    }

    // Hide random non-important tiles until we reach the target
    while (visibleCount > tilesToKeepVisible && nonImportantVisibleTiles.length > 0) {
      // Pick a random tile to hide
      const randomIndex = Math.floor(Math.random() * nonImportantVisibleTiles.length);
      const tileToHide = nonImportantVisibleTiles[randomIndex];

      // Hide it
      this.visibleTiles[tileToHide.y][tileToHide.x] = false;

      // Remove from the list
      nonImportantVisibleTiles.splice(randomIndex, 1);

      // Update count
      visibleCount--;
    }
  }

  // Update and draw the blackout effect
  updateBlackoutEffect(currentTime) {
    // If using permanent darkness, use that instead of blackout
    if (this.usePermanentDarkness) {
      this.drawDarknessWithLightOrbs(currentTime);
      return;
    }

    // Update blackout timer
    if (!this.lastBlackoutTime) {
      this.lastBlackoutTime = currentTime;
    }

    // Calculate time since last update
    const timeDelta = currentTime - this.lastBlackoutTime;
    this.blackoutTimer += timeDelta;
    this.lastBlackoutTime = currentTime;

    // Determine blackout frequency and duration based on difficulty
    let blackoutFrequency, blackoutDuration, maxAlpha;

    switch(this.difficulty) {
      case 'hard':
        blackoutFrequency = 30000; // Every 30 seconds
        blackoutDuration = 1000;   // 1 second duration
        maxAlpha = 0.7;            // 70% darkness
        break;
      case 'nightmare':
        blackoutFrequency = 20000; // Every 20 seconds
        blackoutDuration = 2000;   // 2 seconds duration
        maxAlpha = 0.85;           // 85% darkness
        break;
      case 'void':
        blackoutFrequency = 15000; // Every 15 seconds
        blackoutDuration = 3000;   // 3 seconds duration
        maxAlpha = 0.95;           // 95% darkness
        break;
      default:
        blackoutFrequency = 45000; // Every 45 seconds
        blackoutDuration = 500;    // 0.5 second duration
        maxAlpha = 0.5;            // 50% darkness
    }

    // Check if it's time for a blackout
    if (!this.blackoutActive && this.blackoutTimer > blackoutFrequency) {
      this.blackoutActive = true;
      this.blackoutTimer = 0;
      this.blackoutStartTime = currentTime;
    }

    // Handle active blackout
    if (this.blackoutActive) {
      const blackoutProgress = Math.min((currentTime - this.blackoutStartTime) / blackoutDuration, 1);

      // Fade in and out
      if (blackoutProgress < 0.5) {
        // Fade in (0 to max)
        this.blackoutAlpha = maxAlpha * (blackoutProgress * 2);
      } else {
        // Fade out (max to 0)
        this.blackoutAlpha = maxAlpha * (1 - (blackoutProgress - 0.5) * 2);
      }

      // End blackout when complete
      if (blackoutProgress >= 1) {
        this.blackoutActive = false;
        this.blackoutAlpha = 0;
      }
    }

    // Draw blackout overlay if active
    if (this.blackoutAlpha > 0) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.blackoutAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Draw decorative elements based on map type
  drawMapDecorations() {
    // Disabled decorations to remove particles
    // Uncomment the code below to re-enable decorations if desired
    /*
    const mapType = this.mapTemplate.id;
    const decorColors = this.decorationColors;

    // Add random decorative elements based on map type
    const numDecorations = Math.floor(this.gridWidth * this.gridHeight * 0.05); // 5% of tiles get decorations

    for (let i = 0; i < numDecorations; i++) {
      const x = Math.floor(Math.random() * this.canvas.width);
      const y = Math.floor(Math.random() * this.canvas.height);
      const size = Math.random() * 10 + 5;
      const colorIndex = Math.floor(Math.random() * decorColors.length);

      // Don't place decorations on the path
      const gridX = Math.floor(x / this.tileSize);
      const gridY = Math.floor(y / this.tileSize);

      if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
        if (this.grid[gridY][gridX] !== this.TILE_TYPES.PATH) {
          this.ctx.fillStyle = decorColors[colorIndex];

          switch (mapType) {
            case 'desert':
              // Draw cacti or rocks
              if (Math.random() > 0.7) {
                // Draw cactus
                this.ctx.fillRect(x, y, size/2, size*2);
                this.ctx.fillRect(x - size/3, y + size/2, size, size/2);
              } else {
                // Draw rock
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
              }
              break;

            case 'snow':
              // Draw snowflakes
              this.ctx.beginPath();
              this.ctx.arc(x, y, size/2, 0, Math.PI * 2);
              this.ctx.fill();
              break;

            case 'volcano':
              // Draw lava bubbles or rocks
              if (Math.random() > 0.5) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
              }
              break;

            case 'maze':
              // Draw hedge decorations
              this.ctx.fillRect(x, y, size, size);
              break;

            case 'classic':
            default:
              // Draw grass tufts or flowers
              if (Math.random() > 0.7) {
                // Flower
                this.ctx.beginPath();
                this.ctx.arc(x, y, size/2, 0, Math.PI * 2);
                this.ctx.fill();
              } else {
                // Grass tuft
                this.ctx.fillRect(x, y, size/4, size);
                this.ctx.fillRect(x + size/3, y, size/4, size*0.8);
                this.ctx.fillRect(x - size/3, y, size/4, size*0.9);
              }
              break;
          }
        }
      }
    }
    */
  }

  // Draw special effects on the path based on map type
  drawPathEffects() {
    // Disabled path effects to remove particles
    // Uncomment the code below to re-enable path effects if desired
    /*
    const mapType = this.mapTemplate.id;

    // Add effects to the path based on map type
    for (let i = 0; i < this.pathCoordinates.length; i++) {
      const point = this.pathCoordinates[i];

      switch (mapType) {
        case 'desert':
          // Add sand ripple effects
          if (i % 5 === 0) {
            this.ctx.strokeStyle = 'rgba(255, 248, 225, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.tileSize/4, 0, Math.PI * 2);
            this.ctx.stroke();
          }
          break;

        case 'snow':
          // Add snow sparkle effects
          if (i % 4 === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.tileSize/8, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;

        case 'volcano':
          // Add lava glow effects
          if (i % 3 === 0) {
            this.ctx.fillStyle = 'rgba(255, 87, 34, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.tileSize/3, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;

        case 'maze':
          // Add stone texture effects
          if (i % 6 === 0) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.rect(point.x - this.tileSize/4, point.y - this.tileSize/4, this.tileSize/2, this.tileSize/2);
            this.ctx.stroke();
          }
          break;

        case 'classic':
        default:
          // Add footprint effects
          if (i % 8 === 0) {
            this.ctx.fillStyle = 'rgba(121, 85, 72, 0.6)';
            this.ctx.beginPath();
            this.ctx.ellipse(point.x, point.y, this.tileSize/6, this.tileSize/4, 0, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
      }
    }
    */
  }

  // Resize the map when the canvas size changes
  resize(gameStarted = false) {
    // Calculate new grid dimensions
    const newGridWidth = Math.floor(this.canvas.width / this.tileSize);
    const newGridHeight = Math.floor(this.canvas.height / this.tileSize);

    // Store the old grid for reference
    const oldGrid = this.grid;
    const oldGridWidth = oldGrid ? oldGrid.length > 0 ? oldGrid[0].length : 0 : 0;
    const oldGridHeight = oldGrid ? oldGrid.length : 0;

    // Store occupied tiles before resize
    const occupiedTiles = [];
    if (oldGrid) {
      for (let y = 0; y < oldGridHeight; y++) {
        for (let x = 0; x < oldGridWidth; x++) {
          if (y < oldGrid.length && x < oldGrid[y].length && oldGrid[y][x] === this.TILE_TYPES.OCCUPIED) {
            occupiedTiles.push({x, y});
          }
        }
      }
    }

    if (!gameStarted) {
      // Only regenerate the map if the game hasn't started yet
      console.log(`Regenerating map with dimensions: ${newGridWidth}x${newGridHeight}`);
      this.gridWidth = newGridWidth;
      this.gridHeight = newGridHeight;
      this.initializeGrid();
      this.generatePath();

      // Restore occupied tiles if they're still within bounds and not on the path
      occupiedTiles.forEach(tile => {
        if (tile.x < this.gridWidth && tile.y < this.gridHeight &&
            this.grid[tile.y][tile.x] === this.TILE_TYPES.GRASS) {
          this.grid[tile.y][tile.x] = this.TILE_TYPES.OCCUPIED;
        }
      });

      this.findBuildableTiles();

      // Reinitialize light orbs if using permanent darkness
      if (this.usePermanentDarkness) {
        this.initializeLightOrbs();
      }
    } else {
      // If game has started, just update the tile size to scale the map
      console.log(`Game already started - scaling map without regenerating`);
      // Only update grid dimensions if they're larger than before
      if (newGridWidth > this.gridWidth) this.gridWidth = newGridWidth;
      if (newGridHeight > this.gridHeight) this.gridHeight = newGridHeight;

      // Update path coordinates with new tile size
      this.pathCoordinates = this.path.map(point => ({
        x: point.x * this.tileSize + this.tileSize / 2,
        y: point.y * this.tileSize + this.tileSize / 2
      }));

      // Adjust light orbs for new canvas size if using permanent darkness
      if (this.usePermanentDarkness) {
        // Keep orbs within bounds
        for (const orb of this.lightOrbs) {
          orb.x = Math.min(orb.x, this.canvas.width);
          orb.y = Math.min(orb.y, this.canvas.height);
        }
      }
    }
  }
}
