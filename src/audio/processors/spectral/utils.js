/**
 * Smoothly interpolates between two values
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} factor - Smoothing factor (0-1)
 * @returns {number} Interpolated value
 */
export const smoothParameter = (current, target, factor) => {
  return current + (target - current) * factor;
};

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};