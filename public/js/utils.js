/**
 * Utility functions for the tower defense game
 */
// Log that utils.js is loaded
console.log('Utility functions loaded');

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check if a point is inside a circle
function isPointInCircle(x, y, circleX, circleY, radius) {
  return distance(x, y, circleX, circleY) <= radius;
}

// Get angle between two points in radians
function getAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Convert radians to degrees
function radToDeg(rad) {
  return rad * 180 / Math.PI;
}

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Format number with commas for thousands
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Generate a random color
function randomColor() {
  return `hsl(${randomInt(0, 360)}, ${randomInt(50, 100)}%, ${randomInt(40, 60)}%)`;
}

// Ease in-out function for smooth animations
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Lerp (Linear interpolation) between two values
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// Clamp a value between min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Check if two rectangles overlap
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x2 > x1 + w1 ||
           x2 + w2 < x1 ||
           y2 > y1 + h1 ||
           y2 + h2 < y1);
}

// Check if a point is inside a rectangle
function isPointInRect(x, y, rectX, rectY, rectW, rectH) {
  return x >= rectX && x <= rectX + rectW &&
         y >= rectY && y <= rectY + rectH;
}

// Get the base unit size for scaling based on screen dimensions
function getBaseUnit() {
  // Use the smaller dimension (width or height) to ensure everything fits on screen
  const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
  // Base unit is 1% of the smaller dimension
  return smallerDimension / 100;
}

// Convert a pixel value to a relative unit based on screen size
function toRelativeUnit(pixelValue) {
  const baseUnit = getBaseUnit();
  return pixelValue / baseUnit;
}

// Convert a relative unit to pixels based on current screen size
function toPixels(relativeValue) {
  const baseUnit = getBaseUnit();
  return relativeValue * baseUnit;
}
