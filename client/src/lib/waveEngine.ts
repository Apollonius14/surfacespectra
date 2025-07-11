export interface Wave {
  id: string;
  birthTime: number;
  frequency: number;
  amplitude: number;
  decay: number;
  type: PhoneticType;
  centerAngle: number;
  spread: number;
}

export type PhoneticType = 'vowel' | 'trill' | 'fricative' | 'plosive';

export interface WaveParams {
  freq: number;
  amplitude: number;
  decay: number;
  spread: number;
  centerFreq: number;
}

export class WaveEngine {
  private waves: Wave[] = [];
  private time: number = 0;
  private waveId: number = 0;

  private readonly params = {
    arcSpan: Math.PI / 3, // 60 degrees
    maxRadius: 10,
    waveSpeed: 0.08,
    minFreq: 100,
    maxFreq: 6000,
  };

  private readonly phoneticParams: Record<PhoneticType, WaveParams> = {
    vowel: { freq: 500, amplitude: 1.0, decay: 0.7, spread: 0.3, centerFreq: 600 },
    trill: { freq: 1500, amplitude: 0.8, decay: 0.6, spread: 0.5, centerFreq: 1200 },
    fricative: { freq: 4000, amplitude: 0.6, decay: 0.9, spread: 0.2, centerFreq: 4000 },
    plosive: { freq: 2000, amplitude: 1.2, decay: 0.4, spread: 0.4, centerFreq: 2500 }
  };

  public generateWave(phoneticType: PhoneticType): void {
    const params = this.phoneticParams[phoneticType];
    const centerAngle = this.frequencyToAngle(params.centerFreq);
    
    this.waves.push({
      id: `wave_${this.waveId++}`,
      birthTime: this.time,
      frequency: params.freq,
      amplitude: params.amplitude,
      decay: params.decay,
      type: phoneticType,
      centerAngle,
      spread: params.spread
    });
  }

  public updateTime(deltaTime: number): void {
    this.time += deltaTime;
    
    // Remove old waves
    this.waves = this.waves.filter(wave => 
      this.time - wave.birthTime < 25 && 
      this.getWaveRadius(wave) < this.params.maxRadius
    );
  }

  public calculateHeightAtPosition(x: number, z: number): number {
    const radius = Math.sqrt(x * x + z * z);
    const angle = Math.atan2(z, x);
    
    // Check if position is within the arc
    if (Math.abs(angle) > this.params.arcSpan / 2) {
      return 0;
    }

    let totalHeight = 0;
    
    this.waves.forEach(wave => {
      const waveRadius = this.getWaveRadius(wave);
      const angleDiff = Math.abs(angle - wave.centerAngle);
      
      // Check if this position is affected by this wave
      if (angleDiff <= wave.spread) {
        const distanceFromWave = Math.abs(radius - waveRadius);
        
        if (distanceFromWave < 2) {
          const age = this.time - wave.birthTime;
          const amplitude = wave.amplitude * Math.exp(-age * wave.decay);
          const angularFactor = Math.cos(angleDiff / wave.spread * Math.PI / 2);
          const radialFactor = Math.exp(-distanceFromWave * 0.8);
          const frequencyFactor = Math.sin(wave.frequency / 100 * distanceFromWave * Math.PI);
          
          totalHeight += amplitude * angularFactor * radialFactor * frequencyFactor;
        }
      }
    });
    
    return totalHeight;
  }

  private getWaveRadius(wave: Wave): number {
    const age = this.time - wave.birthTime;
    return age * this.params.waveSpeed;
  }

  private frequencyToAngle(frequency: number): number {
    // Convert frequency to angle using logarithmic scale
    const logFreq = Math.log(frequency);
    const logMin = Math.log(this.params.minFreq);
    const logMax = Math.log(this.params.maxFreq);
    const normalized = (logFreq - logMin) / (logMax - logMin);
    
    // Map to arc span, centered at 0
    return (normalized - 0.5) * this.params.arcSpan;
  }

  public getActiveWaveCount(): number {
    return this.waves.length;
  }

  public getWaves(): Wave[] {
    return [...this.waves];
  }

  public reset(): void {
    this.waves = [];
    this.time = 0;
    this.waveId = 0;
  }
}
