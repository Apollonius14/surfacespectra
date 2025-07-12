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
  // New linguistic parameters
  duration: number;        // How long the wave persists (0-1)
  frequencyBandwidth: number; // Width of frequency distribution
  attackTime: number;      // Time to reach peak amplitude
  sustainLevel: number;    // Sustained amplitude level (0-1)
  modulationRate: number;  // For trill oscillation (Hz)
  envelopeType: 'sustained' | 'burst' | 'modulated' | 'broadband';
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
    vowel: {
      freq: 100,              // Tight around 100Hz
      amplitude: 0.8,
      decay: 0.05,            // Gradual trailing off
      spread: 0.2,            // Narrow frequency band
      centerFreq: 0.1,        // Low frequency position
      duration: 0.9,          // Nearly entire duration
      frequencyBandwidth: 0.1, // Very narrow band
      attackTime: 0.1,        // Small initial burst
      sustainLevel: 0.9,      // High sustained level
      modulationRate: 0,      // No modulation
      envelopeType: 'sustained'
    },
    trill: {
      freq: 150,
      amplitude: 0.7,
      decay: 0.08,
      spread: 0.4,
      centerFreq: 0.3,
      duration: 0.9,          // Entire duration
      frequencyBandwidth: 0.3,
      attackTime: 0.05,
      sustainLevel: 0.8,
      modulationRate: 8,      // 8Hz modulation for trill effect
      envelopeType: 'modulated'
    },
    fricative: {
      freq: 3000,
      amplitude: 0.3,         // Lowest average power
      decay: 0.04,            // Slow decay for persistence
      spread: 0.9,            // Broadest frequency range
      centerFreq: 0.6,
      duration: 0.95,         // Persists entire time
      frequencyBandwidth: 0.8, // Widest bandwidth
      attackTime: 0.2,
      sustainLevel: 0.6,
      modulationRate: 0,
      envelopeType: 'broadband'
    },
    plosive: {
      freq: 1000,
      amplitude: 1.5,         // High peak power
      decay: 0.4,             // Rapid decay
      spread: 0.7,            // Broadband
      centerFreq: 0.5,
      duration: 0.2,          // Brief duration
      frequencyBandwidth: 0.6, // Wide frequency spread
      attackTime: 0.02,       // Very rapid attack
      sustainLevel: 0.1,      // Low sustain (mostly silent)
      modulationRate: 0,
      envelopeType: 'burst'
    }
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
      spread: params.spread * params.frequencyBandwidth // Adjust spread by bandwidth
    });
  }

  public updateTime(deltaTime: number): void {
    this.time += deltaTime;
    
    // Remove old waves based on their linguistic duration
    this.waves = this.waves.filter(wave => {
      const params = this.phoneticParams[wave.type];
      const age = this.time - wave.birthTime;
      const maxAge = params.duration * 25; // Scale duration to animation time
      return age < maxAge && this.getWaveRadius(wave) < this.params.maxRadius;
    });
  }

  public calculateHeightAtPosition(frequency: number, time: number): number {
    // Use logical coordinates (frequency 0-1, time 0-1) for wave calculations
    // With bilateral symmetry, each half represents full spectrum
    
    // Check if position is within valid bounds
    if (frequency < 0 || frequency > 1 || time < 0 || time > 1) {
      return 0;
    }

    let totalHeight = 0;
    
    this.waves.forEach(wave => {
      const waveRadius = this.getWaveRadius(wave);
      const distanceFromWave = Math.abs(time * this.params.maxRadius - waveRadius);
      
      // Only process if wave is close enough
      if (distanceFromWave < 2) {
        // Calculate bilateral symmetry effect
        // Both halves respond to the same wave, creating mirror effect
        const leftHalfFreq = frequency < 0.5 ? (0.5 - frequency) * 2 : 0;
        const rightHalfFreq = frequency >= 0.5 ? (frequency - 0.5) * 2 : 0;
        const activeFreq = Math.max(leftHalfFreq, rightHalfFreq);
        
        // Map frequency to angle for wave center calculation
        const angle = activeFreq * (this.params.arcSpan / 2);
        const angleDiff = Math.abs(angle - Math.abs(wave.centerAngle));
        
        // Check if this position is affected by this wave
        if (angleDiff <= wave.spread) {
          const age = this.time - wave.birthTime;
          const params = this.phoneticParams[wave.type];
          
          // Calculate envelope based on phonetic type
          let envelopeAmplitude = this.calculateEnvelope(wave.type, age, params);
          
          const angularFactor = Math.cos(angleDiff / wave.spread * Math.PI / 2);
          const radialFactor = Math.exp(-distanceFromWave * 0.8);
          const frequencyFactor = Math.sin(wave.frequency / 100 * distanceFromWave * Math.PI);
          
          totalHeight += envelopeAmplitude * angularFactor * radialFactor * frequencyFactor;
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

  private calculateEnvelope(type: PhoneticType, age: number, params: WaveParams): number {
    const normalizedAge = age / (params.duration * 25); // Normalize to 0-1 over wave duration
    
    switch (params.envelopeType) {
      case 'sustained': // Vowel: small burst, sustained, gradual decay
        if (normalizedAge < params.attackTime) {
          return params.amplitude * (normalizedAge / params.attackTime);
        } else if (normalizedAge < 0.8) {
          return params.amplitude * params.sustainLevel;
        } else {
          // Gradual trailing off
          const decayFactor = (1 - normalizedAge) / 0.2;
          return params.amplitude * params.sustainLevel * decayFactor;
        }
        
      case 'modulated': // Trill: steady modulation
        const baseAmplitude = params.amplitude * Math.exp(-normalizedAge * params.decay);
        const modulation = 1 + 0.5 * Math.sin(2 * Math.PI * params.modulationRate * age);
        return baseAmplitude * modulation;
        
      case 'burst': // Plosive: rapid peak then decay
        if (normalizedAge < params.attackTime) {
          return params.amplitude * (normalizedAge / params.attackTime);
        } else {
          // Rapid decay to near silence
          const decayFactor = Math.exp(-normalizedAge * params.decay * 10);
          return params.amplitude * params.sustainLevel * decayFactor;
        }
        
      case 'broadband': // Fricative: sustained but lower power
        const sustainedAmplitude = params.amplitude * params.sustainLevel;
        const slowDecay = Math.exp(-normalizedAge * params.decay * 0.5);
        return sustainedAmplitude * slowDecay;
        
      default:
        return params.amplitude * Math.exp(-normalizedAge * params.decay);
    }
  }

  public reset(): void {
    this.waves = [];
    this.time = 0;
    this.waveId = 0;
  }
}
