import { SpectrogramData } from './polarField';

export type PhoneticType = 'vowel' | 'trill' | 'fricative' | 'plosive';

export interface PolarWave {
  id: string;
  birthTime: number;
  type: PhoneticType;
  spectrograms: SpectrogramData[];
  currentTimeIndex: number;
  maxTimeIndex: number;
  isActive: boolean;
}

export class PolarWaveEngine {
  private waves: PolarWave[] = [];
  private time: number = 0;
  private waveId: number = 0;
  private readonly frequencyBins = 100;
  private readonly timeIntervals = 1000;

  // Phonetic characteristics for generating spectrograms
  private readonly phoneticProfiles = {
    vowel: {
      duration: 800,          // Long sustained sound
      peakFrequencies: [300, 1200, 2500], // Formant frequencies
      bandwidth: 200,         // Narrow frequency bands
      amplitude: 0.8,
      attackTime: 50,
      sustainLevel: 0.9,
      decayTime: 200
    },
    trill: {
      duration: 600,
      peakFrequencies: [1000, 2000],
      bandwidth: 300,
      amplitude: 0.6,
      attackTime: 20,
      sustainLevel: 0.7,
      decayTime: 100,
      modulationRate: 25     // Hz for trill oscillation
    },
    fricative: {
      duration: 400,
      peakFrequencies: [3000, 5000, 7000], // High frequency noise
      bandwidth: 1000,       // Broadband
      amplitude: 0.4,
      attackTime: 30,
      sustainLevel: 0.8,
      decayTime: 150
    },
    plosive: {
      duration: 200,         // Short burst
      peakFrequencies: [500, 1500, 4000], // Wide spectrum
      bandwidth: 800,
      amplitude: 1.0,
      attackTime: 5,         // Very fast attack
      sustainLevel: 0.3,
      decayTime: 50
    }
  };

  public generateWave(phoneticType: PhoneticType): void {
    const profile = this.phoneticProfiles[phoneticType];
    const wave: PolarWave = {
      id: `wave-${this.waveId++}`,
      birthTime: this.time,
      type: phoneticType,
      spectrograms: [],
      currentTimeIndex: 0,
      maxTimeIndex: Math.floor(profile.duration),
      isActive: true
    };

    // Generate spectrogram sequence for this phonetic type
    for (let t = 0; t < wave.maxTimeIndex; t++) {
      const spectrogram = this.generateSpectrogramFrame(phoneticType, t, profile);
      wave.spectrograms.push(spectrogram);
    }

    this.waves.push(wave);
    console.log(`Generated ${phoneticType} wave with ${wave.spectrograms.length} frames`);
  }

  private generateSpectrogramFrame(
    phoneticType: PhoneticType, 
    timeIndex: number, 
    profile: any
  ): SpectrogramData {
    const frequencyBins = new Array(this.frequencyBins).fill(0);
    const normalizedTime = timeIndex / profile.duration;
    
    // Calculate envelope (attack, sustain, decay)
    let envelope = 1.0;
    if (timeIndex < profile.attackTime) {
      envelope = timeIndex / profile.attackTime;
    } else if (timeIndex > profile.duration - profile.decayTime) {
      const decayProgress = (timeIndex - (profile.duration - profile.decayTime)) / profile.decayTime;
      envelope = 1.0 - decayProgress;
    } else {
      envelope = profile.sustainLevel;
    }

    // Apply trill modulation if applicable
    if (phoneticType === 'trill' && profile.modulationRate) {
      const modulation = Math.sin(normalizedTime * profile.modulationRate * Math.PI * 2);
      envelope *= (0.7 + 0.3 * modulation);
    }

    // Generate frequency content
    profile.peakFrequencies.forEach((centerFreq: number) => {
      const binIndex = this.frequencyToBinIndex(centerFreq);
      const bandwidthBins = Math.floor(profile.bandwidth / 80); // 80Hz per bin approximately
      
      // Create frequency peak with gaussian-like distribution
      for (let i = Math.max(0, binIndex - bandwidthBins); 
           i < Math.min(this.frequencyBins, binIndex + bandwidthBins); 
           i++) {
        const distance = Math.abs(i - binIndex);
        const gaussian = Math.exp(-(distance * distance) / (2 * (bandwidthBins / 3) * (bandwidthBins / 3)));
        frequencyBins[i] += profile.amplitude * envelope * gaussian;
      }
    });

    // Add noise for fricatives
    if (phoneticType === 'fricative') {
      for (let i = 0; i < this.frequencyBins; i++) {
        frequencyBins[i] += Math.random() * 0.1 * envelope;
      }
    }

    // Normalize and ensure positive values
    const maxValue = Math.max(...frequencyBins);
    if (maxValue > 0) {
      for (let i = 0; i < frequencyBins.length; i++) {
        frequencyBins[i] = Math.max(0, frequencyBins[i] / maxValue);
      }
    }

    return {
      timeIndex,
      frequencyBins
    };
  }

  private frequencyToBinIndex(frequency: number): number {
    // Map 100Hz to 8kHz across 100 bins
    const minFreq = 100;
    const maxFreq = 8000;
    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
    return Math.floor(normalizedFreq * (this.frequencyBins - 1));
  }

  public updateTime(deltaTime: number): SpectrogramData[] {
    this.time += deltaTime;
    const activeSpectrograms: SpectrogramData[] = [];

    // Update all active waves
    this.waves.forEach(wave => {
      if (wave.isActive) {
        const age = this.time - wave.birthTime;
        const newTimeIndex = Math.floor(age * 10); // 10 frames per second
        
        if (newTimeIndex < wave.maxTimeIndex) {
          wave.currentTimeIndex = newTimeIndex;
          
          // Get current spectrogram frame
          if (wave.spectrograms[wave.currentTimeIndex]) {
            activeSpectrograms.push(wave.spectrograms[wave.currentTimeIndex]);
          }
        } else {
          wave.isActive = false;
        }
      }
    });

    // Clean up inactive waves
    this.waves = this.waves.filter(wave => wave.isActive);

    return activeSpectrograms;
  }

  public getActiveWaveCount(): number {
    return this.waves.filter(wave => wave.isActive).length;
  }

  public reset(): void {
    this.waves = [];
    this.time = 0;
    this.waveId = 0;
  }
}