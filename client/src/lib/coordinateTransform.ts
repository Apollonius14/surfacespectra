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
  };

  /**
   * Transform logical coordinates (frequency, time) to display coordinates (x, y, z)
   * Creates shell/wedge shape: narrow at bottom, fanning out at top
   */
  public logicalToDisplay(logical: LogicalCoordinates): DisplayCoordinates {
    // Map time to radius (distance from mouth)
    const radius = logical.time * this.params.maxRadius;
    
    // Map frequency to angle (±30 degrees from centerline)
    const angle = (logical.frequency - 0.5) * this.params.arcSpan;
    
    // Convert polar to Cartesian coordinates
    const x = radius * Math.sin(angle);
    const z = radius * Math.cos(angle);
    
    return {
      x,
      y: 0, // Height will be added by wave calculations
      z
    };
  }

  /**
   * Transform display coordinates back to logical coordinates
   * Used for sampling wave heights at display positions
   */
  public displayToLogical(display: DisplayCoordinates): LogicalCoordinates {
    // Convert Cartesian back to polar
    const radius = Math.sqrt(display.x * display.x + display.z * display.z);
    const angle = Math.atan2(display.x, display.z);
    
    // Map radius back to time
    const time = radius / this.params.maxRadius;
    
    // Map angle back to frequency
    const frequency = (angle / this.params.arcSpan) + 0.5;
    
    return {
      frequency: Math.max(0, Math.min(1, frequency)), // Clamp to [0,1]
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