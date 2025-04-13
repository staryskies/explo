/**
 * Map templates for the tower defense game
 */
// Log that mapTemplates.js is loaded
console.log('Map templates loaded');

// Define map templates
const mapTemplates = [
  {
    id: "classic",
    name: "Classic",
    description: "A simple path from left to right",
    difficulty: "Easy",
    pathType: "single",
    terrainFeatures: "basic",
    backgroundColor: "#4CAF50", // Green grass
    pathColor: "#795548",       // Brown path
    decorationColors: ["#8BC34A", "#689F38", "#33691E"] // Various green shades for decoration
  },
  {
    id: "desert",
    name: "Desert",
    description: "A winding path through the desert",
    difficulty: "Medium",
    pathType: "winding",
    terrainFeatures: "advanced",
    backgroundColor: "#FDD835", // Sand color
    pathColor: "#F57F17",       // Dark sand path
    decorationColors: ["#FFB300", "#FF8F00", "#FF6F00"] // Various sand/orange shades
  },
  {
    id: "snow",
    name: "Snow",
    description: "A challenging path through snow and ice",
    difficulty: "Hard",
    pathType: "spiral",
    terrainFeatures: "advanced",
    backgroundColor: "#E3F2FD", // Light blue snow
    pathColor: "#BBDEFB",       // Lighter blue path
    decorationColors: ["#90CAF9", "#64B5F6", "#42A5F5"] // Various blue shades
  },
  {
    id: "volcano",
    name: "Volcano",
    description: "A dangerous path around an active volcano",
    difficulty: "Very Hard",
    pathType: "crossroads",
    terrainFeatures: "advanced",
    backgroundColor: "#424242", // Dark gray volcanic rock
    pathColor: "#BF360C",       // Lava path
    decorationColors: ["#FF5722", "#E64A19", "#D84315"] // Various lava/red shades
  },
  {
    id: "maze",
    name: "Maze",
    description: "Navigate through a complex maze",
    difficulty: "Extreme",
    pathType: "maze",
    terrainFeatures: "advanced",
    backgroundColor: "#1B5E20", // Dark green hedge
    pathColor: "#9E9E9E",       // Gray stone path
    decorationColors: ["#2E7D32", "#388E3C", "#43A047"] // Various green shades
  }
];
