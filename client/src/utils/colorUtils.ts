// Predefined color palette for tables
export const TABLE_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F472B6', // Rose
  '#A855F7', // Violet
  '#22C55E', // Emerald
  '#FB7185', // Red Rose
  '#60A5FA', // Light Blue
];

// Generate a random color from the predefined palette
export const getRandomTableColor = (): string => {
  const randomIndex = Math.floor(Math.random() * TABLE_COLORS.length);
  return TABLE_COLORS[randomIndex];
};

// Convert hex color to RGB for transparency effects
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Get a lighter version of the color for backgrounds
export const getLighterColor = (color: string, opacity: number = 0.1): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return `${color}20`; // Fallback with low opacity
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Get a darker version of the color for borders
export const getDarkerColor = (color: string): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const darkenFactor = 0.8;
  const r = Math.floor(rgb.r * darkenFactor);
  const g = Math.floor(rgb.g * darkenFactor);
  const b = Math.floor(rgb.b * darkenFactor);
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Check if a color is light or dark (for text color contrast)
export const isLightColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
};