/**
 * Utility functions for the tower defense game
 */

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

// Generate a random color
function randomColor() {
  return `hsl(${randomInt(0, 360)}, ${randomInt(50, 100)}%, ${randomInt(40, 60)}%)`;
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
