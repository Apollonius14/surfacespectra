export interface LogicalCoordinates {
  frequency: number; // 0 to 1, where 0 is low freq (100Hz) and 1 is high freq (6kHz)
  time: number;      // 0 to 1, where 0 is at mouth and 1 is at max distance
}

export interface DisplayCoordinates {
  x: number; // horizontal position in 3D space
  y: number; // height (for waves)
  z: number; // distance from mouth
}

export class CoordinateTransform {
  private readonly params = {
    arcSpan: Math.PI / 3, // 60 degrees total
    maxRadius: 10,
    mouthWidth: 0.3, // Small but finite width at mouth to avoid singularity
  };

  /**
   * Transform logical coordinates (frequency, time) to display coordinates (x, y, z)
   * Creates shell/wedge shape with bilateral symmetry and finite mouth width
   */
  public logicalToDisplay(logical: LogicalCoordinates): DisplayCoordinates {
    // Map time to radius (distance from mouth) with minimum mouth width
    const radius = logical.time * this.params.maxRadius;
    
    // For bilateral symmetry: map frequency to FULL spectrum on each half
    // Left half: frequency 0-1 maps to -30° to 0°
    // Right half: frequency 0-1 maps to 0° to +30°
    const isLeftHalf = logical.frequency < 0.5;
    const normalizedFreq = isLeftHalf ? 
      (0.5 - logical.frequency) * 2 : // 0.5->0 becomes 0->1, 0->0.5 becomes 1->0
      (logical.frequency - 0.5) * 2;  // 0.5->1 becomes 0->1
    
    // Map to angle with each half covering full spectrum
    const angle = isLeftHalf ? 
      -normalizedFreq * (this.params.arcSpan / 2) : // Left: 0 to -30°
      normalizedFreq * (this.params.arcSpan / 2);    // Right: 0 to +30°
    
    // Calculate width that avoids singularity at mouth
    const currentWidth = this.params.mouthWidth + (radius * Math.tan(this.params.arcSpan / 2));
    const x = currentWidth * (angle / (this.params.arcSpan / 2));
    
    return {
      x,
      y: 0, // Height will be added by wave calculations
      z: radius
    };
  }

  /**
   * Transform display coordinates back to logical coordinates
   * Handles bilateral symmetry mapping
   */
  public displayToLogical(display: DisplayCoordinates): LogicalCoordinates {
    const radius = display.z;
    const time = radius / this.params.maxRadius;
    
    // Determine which half and calculate normalized frequency within that half
    const isLeftHalf = display.x < 0;
    const currentWidth = this.params.mouthWidth + (radius * Math.tan(this.params.arcSpan / 2));
    
    if (currentWidth === 0) {
      // At mouth, default to center
      return { frequency: 0.5, time: Math.max(0, Math.min(1, time)) };
    }
    
    const normalizedPosition = Math.abs(display.x) / currentWidth;
    const normalizedFreq = Math.max(0, Math.min(1, normalizedPosition));
    
    // Map back to 0-1 range with bilateral symmetry
    const frequency = isLeftHalf ? 
      0.5 - (normalizedFreq * 0.5) : // Left half: 0.5 to 0
      0.5 + (normalizedFreq * 0.5);  // Right half: 0.5 to 1
    
    return {
      frequency: Math.max(0, Math.min(1, frequency)),
      time: Math.max(0, Math.min(1, time))
    };
  }

  /**
   * Generate a grid of display coordinates for testing
   * Creates a shell-shaped pattern of points
   */
  public generateTestGrid(frequencySteps: number = 21, timeSteps: number = 21): DisplayCoordinates[] {
    const points: DisplayCoordinates[] = [];
    
    for (let f = 0; f < frequencySteps; f++) {
      for (let t = 0; t < timeSteps; t++) {
        const frequency = f / (frequencySteps - 1);
        const time = t / (timeSteps - 1);
        
        // Skip points too close to the mouth (avoid singularity)
        if (time < 0.05) continue;
        
        const logical: LogicalCoordinates = { frequency, time };
        const display = this.logicalToDisplay(logical);
        
        points.push(display);
      }
    }
    
    return points;
  }

  /**
   * Check if a logical coordinate is within the valid shell bounds
   */
  public isWithinBounds(logical: LogicalCoordinates): boolean {
    return logical.frequency >= 0 && logical.frequency <= 1 &&
           logical.time >= 0 && logical.time <= 1;
  }

  /**
   * Get the maximum width of the shell at a given time position
   */
  public getMaxWidthAtTime(time: number): number {
    const radius = time * this.params.maxRadius;
    return radius * Math.tan(this.params.arcSpan / 2);
  }
}