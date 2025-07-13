export interface PolarCoordinates {
  radius: number; // 0 to 1, where 0 is center and 1 is outer edge
  angle: number;  // -20° to +20° in radians
}

export interface CartesianCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface SpectrogramData {
  timeIndex: number;      // 0 to 999 (1000 time intervals)
  frequencyBins: number[]; // 100 frequency values (100Hz to 8kHz)
}

export class PolarField {
  private readonly params = {
    totalAngleSpan: Math.PI * 40 / 180,  // 40 degrees in radians
    halfAngleSpan: Math.PI * 20 / 180,   // 20 degrees in radians
    maxRadius: 15,                        // Distance from center to outer edge
    timeIntervals: 1000,                  // Number of time steps
    frequencyBins: 100,                   // Number of frequency bins
    minFrequency: 100,                    // 100Hz
    maxFrequency: 8000,                   // 8kHz
  };

  /**
   * Convert polar coordinates to 3D cartesian coordinates
   * Center is at (0, 0, 0), field extends upward in +Z direction
   */
  public polarToCartesian(polar: PolarCoordinates): CartesianCoordinates {
    const radius = polar.radius * this.params.maxRadius;
    
    return {
      x: radius * Math.sin(polar.angle),
      y: 0, // Base height, waves will add to this
      z: radius * Math.cos(polar.angle)
    };
  }

  /**
   * Convert cartesian coordinates back to polar
   */
  public cartesianToPolar(cartesian: CartesianCoordinates): PolarCoordinates {
    const radius = Math.sqrt(cartesian.x * cartesian.x + cartesian.z * cartesian.z) / this.params.maxRadius;
    const angle = Math.atan2(cartesian.x, cartesian.z);
    
    return {
      radius: Math.max(0, Math.min(1, radius)),
      angle: Math.max(-this.params.halfAngleSpan, Math.min(this.params.halfAngleSpan, angle))
    };
  }

  /**
   * Map frequency bin index to angle within one half of the field
   */
  public frequencyToAngle(frequencyIndex: number): number {
    // Map 0-99 to 0° to 20° (or 0 to +halfAngleSpan)
    const normalizedFreq = frequencyIndex / (this.params.frequencyBins - 1);
    return normalizedFreq * this.params.halfAngleSpan;
  }

  /**
   * Map time interval to radius
   */
  public timeToRadius(timeIndex: number): number {
    return timeIndex / (this.params.timeIntervals - 1);
  }

  /**
   * Generate grid points for the polar field visualization
   * Creates concentric arcs and radial lines
   */
  public generateGridPoints(): CartesianCoordinates[] {
    const points: CartesianCoordinates[] = [];
    
    // Generate concentric arcs (constant radius, varying angle)
    const arcSteps = 20; // Number of concentric arcs
    const angleSteps = 50; // Points per arc
    
    for (let r = 0; r <= arcSteps; r++) {
      const radius = r / arcSteps;
      
      for (let a = 0; a <= angleSteps; a++) {
        const angle = (a / angleSteps) * this.params.totalAngleSpan - this.params.halfAngleSpan;
        const polar: PolarCoordinates = { radius, angle };
        points.push(this.polarToCartesian(polar));
      }
    }
    
    // Generate radial lines (constant angle, varying radius)
    const radialSteps = 10; // Number of radial lines
    const radiusSteps = 50; // Points per radial line
    
    for (let a = 0; a <= radialSteps; a++) {
      const angle = (a / radialSteps) * this.params.totalAngleSpan - this.params.halfAngleSpan;
      
      for (let r = 0; r <= radiusSteps; r++) {
        const radius = r / radiusSteps;
        const polar: PolarCoordinates = { radius, angle };
        points.push(this.polarToCartesian(polar));
      }
    }
    
    return points;
  }

  /**
   * Create bilateral mirrored spectrogram data
   * Takes single spectrogram and creates left/right mirrored representation
   */
  public createBilateralSpectrogram(spectrogram: SpectrogramData): CartesianCoordinates[] {
    const points: CartesianCoordinates[] = [];
    const radius = this.timeToRadius(spectrogram.timeIndex);
    
    // Create points for both halves
    for (let freqIndex = 0; freqIndex < spectrogram.frequencyBins.length; freqIndex++) {
      const amplitude = spectrogram.frequencyBins[freqIndex];
      const baseAngle = this.frequencyToAngle(freqIndex);
      
      // Right half (positive angles)
      const rightPolar: PolarCoordinates = { radius, angle: baseAngle };
      const rightCartesian = this.polarToCartesian(rightPolar);
      rightCartesian.y = amplitude; // Set height based on amplitude
      points.push(rightCartesian);
      
      // Left half (negative angles) - mirrored
      const leftPolar: PolarCoordinates = { radius, angle: -baseAngle };
      const leftCartesian = this.polarToCartesian(leftPolar);
      leftCartesian.y = amplitude; // Same amplitude, mirrored position
      points.push(leftCartesian);
    }
    
    return points;
  }

  /**
   * Get field dimensions for camera positioning
   */
  public getFieldDimensions() {
    return {
      maxRadius: this.params.maxRadius,
      totalAngleSpan: this.params.totalAngleSpan,
      halfAngleSpan: this.params.halfAngleSpan,
      maxWidth: this.params.maxRadius * Math.sin(this.params.halfAngleSpan) * 2,
      maxDepth: this.params.maxRadius
    };
  }
}