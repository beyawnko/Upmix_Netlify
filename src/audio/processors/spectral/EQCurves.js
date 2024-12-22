/**
 * EQ curve functions for different frequency bands
 */
export const eqCurves = {
  sub: (magnitude) => clamp(-magnitude * 12, -12, 6),    // Sub boost/cut
  low: (magnitude) => clamp(-magnitude * 6, -6, 3),      // Low shelf
  mid: (magnitude) => -magnitude * 3,                     // Mid scoop
  upperMid: (magnitude) => clamp(magnitude * 4, -3, 6),  // Presence
  high: (magnitude) => clamp(magnitude * 6, -6, 9)       // Air
};

import { clamp } from './utils';