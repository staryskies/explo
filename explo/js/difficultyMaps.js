/**
 * Difficulty-specific map templates
 * Each difficulty level has its own unique map design
 */
// Log that difficultyMaps.js is loaded
console.log('Difficulty Maps loaded');

// Map templates for each difficulty
const difficultyMaps = {
  // Easy difficulty map - Green meadows theme
  easy: {
    name: "Green Meadows",
    description: "A peaceful meadow with gentle paths",
    backgroundColor: "#8BC34A", // Light green
    pathColor: "#795548", // Brown
    tileColor: "#A5D6A7", // Lighter green
    borderColor: "#558B2F", // Dark green
    gridLines: false,
    specialEffects: {
      particles: {
        count: 20,
        color: "#FFFFFF", // White
        size: 2,
        speed: 0.5
      },
      ambientLight: {
        color: "#FFEB3B", // Yellow
        intensity: 0.2
      }
    },
    darkness: 0, // No darkness
    fogOfWar: false,
    pathWidth: 1.0, // Standard path width
    decorations: [
      {
        type: "flower",
        count: 15,
        color: "#FF5722" // Orange flowers
      },
      {
        type: "tree",
        count: 8,
        color: "#33691E" // Dark green trees
      }
    ]
  },

  // Medium difficulty map - Desert theme
  medium: {
    name: "Desert Dunes",
    description: "A harsh desert with winding paths through the dunes",
    backgroundColor: "#FFC107", // Amber
    pathColor: "#FFD54F", // Light amber
    tileColor: "#FFE082", // Very light amber
    borderColor: "#FF8F00", // Dark amber
    gridLines: false,
    specialEffects: {
      particles: {
        count: 30,
        color: "#FAFAFA", // Off-white
        size: 1,
        speed: 1.0
      },
      ambientLight: {
        color: "#FF9800", // Orange
        intensity: 0.3
      }
    },
    darkness: 0.1, // Slight darkness
    fogOfWar: false,
    pathWidth: 0.9, // Slightly narrower path
    decorations: [
      {
        type: "cactus",
        count: 10,
        color: "#4CAF50" // Green cacti
      },
      {
        type: "rock",
        count: 12,
        color: "#795548" // Brown rocks
      }
    ]
  },

  // Hard difficulty map - Volcanic theme
  hard: {
    name: "Volcanic Wasteland",
    description: "A dangerous volcanic landscape with rivers of lava",
    backgroundColor: "#424242", // Dark grey
    pathColor: "#FF5722", // Deep orange (lava)
    tileColor: "#616161", // Grey
    borderColor: "#212121", // Very dark grey
    gridLines: false,
    specialEffects: {
      particles: {
        count: 40,
        color: "#FF9800", // Orange
        size: 3,
        speed: 1.5
      },
      ambientLight: {
        color: "#FF5722", // Deep orange
        intensity: 0.4
      }
    },
    darkness: 0.3, // Moderate darkness
    fogOfWar: false,
    pathWidth: 0.8, // Narrower path
    decorations: [
      {
        type: "lava",
        count: 8,
        color: "#FF3D00" // Bright orange lava
      },
      {
        type: "volcano",
        count: 3,
        color: "#BF360C" // Dark orange volcanoes
      }
    ]
  },

  // Nightmare difficulty map - Dark forest theme (lighter than before)
  nightmare: {
    name: "Haunted Forest",
    description: "A mysterious forest shrouded in mist and shadows",
    backgroundColor: "#37474F", // Dark blue-grey (lighter than before)
    pathColor: "#546E7A", // Blue-grey
    tileColor: "#455A64", // Medium blue-grey
    borderColor: "#263238", // Very dark blue-grey
    gridLines: false,
    specialEffects: {
      particles: {
        count: 50,
        color: "#B0BEC5", // Light blue-grey
        size: 2,
        speed: 0.7
      },
      ambientLight: {
        color: "#4FC3F7", // Light blue
        intensity: 0.3 // Increased from previous version
      }
    },
    darkness: 0.4, // Reduced darkness
    fogOfWar: true,
    pathWidth: 0.7, // Even narrower path
    decorations: [
      {
        type: "deadTree",
        count: 15,
        color: "#37474F" // Dark blue-grey trees
      },
      {
        type: "fog",
        count: 10,
        color: "#CFD8DC" // Very light blue-grey fog
      }
    ],
    lightOrbs: {
      count: 12,
      color: "#4FC3F7", // Light blue
      size: 5,
      intensity: 0.8
    }
  },

  // Void difficulty map - Void theme
  void: {
    name: "The Void",
    description: "A dimension of pure darkness where reality fades away",
    backgroundColor: "#000000", // Black
    pathColor: "#311B92", // Deep purple
    tileColor: "#1A237E", // Dark indigo
    borderColor: "#000000", // Black
    gridLines: false,
    specialEffects: {
      particles: {
        count: 60,
        color: "#7C4DFF", // Deep purple
        size: 2,
        speed: 0.5
      },
      ambientLight: {
        color: "#7C4DFF", // Deep purple
        intensity: 0.2
      }
    },
    darkness: 0.7, // High darkness
    fogOfWar: true,
    pathWidth: 0.6, // Very narrow path
    decorations: [
      {
        type: "voidSpike",
        count: 20,
        color: "#311B92" // Deep purple spikes
      },
      {
        type: "voidPortal",
        count: 5,
        color: "#7C4DFF" // Deep purple portals
      }
    ],
    voidEffects: {
      disappearingTiles: true,
      disappearRate: 0.05, // 5% of tiles disappear per wave
      minRemainingTiles: 12, // Minimum number of tiles that will remain
      voidSpikes: {
        count: 15,
        color: "#311B92", // Deep purple
        growthRate: 0.1
      }
    }
  },

  // Hell and Heaven's Trial - Dual path theme
  heavenHell: {
    name: "Hell and Heaven's Trial",
    description: "A realm split between divine light and infernal darkness",
    backgroundColor: "#303030", // Dark grey
    pathColor: ["#FF5722", "#2196F3"], // Orange for hell, blue for heaven
    tileColor: "#424242", // Grey
    borderColor: "#212121", // Very dark grey
    gridLines: false,
    specialEffects: {
      particles: {
        count: 70,
        color: ["#FF9800", "#64B5F6"], // Orange and light blue
        size: 2,
        speed: 1.0
      },
      ambientLight: {
        color: "#9E9E9E", // Grey
        intensity: 0.3
      }
    },
    darkness: 0.2, // Low darkness
    fogOfWar: false,
    pathWidth: 0.8, // Standard path width
    decorations: [
      {
        type: "hellFire",
        count: 10,
        color: "#FF5722" // Orange fire
      },
      {
        type: "heavenLight",
        count: 10,
        color: "#64B5F6" // Light blue light
      }
    ],
    dualPath: true, // Enable dual path mode
    heavenPath: {
      region: "top", // Top half of the map
      color: "#2196F3", // Blue
      effects: {
        glow: {
          color: "#64B5F6", // Light blue
          intensity: 0.5
        },
        particles: {
          count: 30,
          color: "#BBDEFB", // Very light blue
          size: 2,
          speed: 0.7
        }
      }
    },
    hellPath: {
      region: "bottom", // Bottom half of the map
      color: "#FF5722", // Orange
      effects: {
        glow: {
          color: "#FF8A65", // Light orange
          intensity: 0.5
        },
        particles: {
          count: 30,
          color: "#FFCCBC", // Very light orange
          size: 2,
          speed: 0.7
        }
      }
    }
  }
};

// Function to get map template for a specific difficulty
function getMapForDifficulty(difficulty) {
  return difficultyMaps[difficulty] || difficultyMaps.easy;
}

// Apply map template to the current map
function applyMapTemplate(map, difficulty) {
  const template = getMapForDifficulty(difficulty);

  // Apply basic properties
  map.backgroundColor = template.backgroundColor;
  map.pathColor = template.pathColor;
  map.tileColor = template.tileColor;
  map.borderColor = template.borderColor;
  map.gridLines = template.gridLines;

  // Apply special effects if the map supports them
  if (map.specialEffects && template.specialEffects) {
    map.specialEffects = { ...template.specialEffects };
  }

  // Apply darkness level
  if (map.setDarkness && typeof template.darkness === 'number') {
    map.setDarkness(template.darkness);
  }

  // Apply fog of war
  if (map.setFogOfWar && typeof template.fogOfWar === 'boolean') {
    map.setFogOfWar(template.fogOfWar);
  }

  // Apply path width
  if (map.setPathWidth && typeof template.pathWidth === 'number') {
    map.setPathWidth(template.pathWidth);
  }

  // Apply decorations if the map supports them
  if (map.addDecorations && template.decorations) {
    map.addDecorations(template.decorations);
  }

  // Apply light orbs for Nightmare difficulty
  if (difficulty === 'nightmare' && map.addLightOrbs && template.lightOrbs) {
    map.addLightOrbs(template.lightOrbs);
  }

  // Apply void effects for Void difficulty
  if (difficulty === 'void' && map.enableVoidEffects && template.voidEffects) {
    map.enableVoidEffects(template.voidEffects);
  }

  // Apply dual path for Hell and Heaven's Trial
  if ((difficulty === 'trial' || difficulty === 'heavenHell') && map.enableDualPath && template.dualPath) {
    map.enableDualPath(template.heavenPath, template.hellPath);
  }

  return map;
}

// Make functions available globally
window.difficultyMaps = difficultyMaps;
window.getMapForDifficulty = getMapForDifficulty;
window.applyMapTemplate = applyMapTemplate;
