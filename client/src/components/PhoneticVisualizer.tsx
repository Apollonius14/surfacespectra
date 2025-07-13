import { useEffect, useRef, useState } from "react";
import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolarWaveEngine, PhoneticType } from "@/lib/polarWaveEngine";
import { PolarThreeSetup } from "@/lib/polarThreeSetup";
import PhoneticKeyboard from "./PhoneticKeyboard";

export default function PhoneticVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveEngineRef = useRef<PolarWaveEngine | null>(null);
  const threeSetupRef = useRef<PolarThreeSetup | null>(null);
  const [activeWaveCount, setActiveWaveCount] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas ref not available');
      return;
    }

    console.log('Initializing polar field and wave engine...');
    
    // Initialize polar wave engine and Three.js setup
    const waveEngine = new PolarWaveEngine();
    const threeSetup = new PolarThreeSetup(canvasRef.current);
    
    waveEngineRef.current = waveEngine;
    threeSetupRef.current = threeSetup;
    
    console.log('Polar field setup complete');

    // Animation loop to update spectrograms
    const animate = () => {
      if (waveEngine && threeSetup) {
        const spectrograms = waveEngine.updateTime(0.1);
        
        // Add new spectrograms to the field
        spectrograms.forEach(spectrogram => {
          threeSetup.addSpectrogram(spectrogram.timeIndex, spectrogram.frequencyBins);
        });
        
        setActiveWaveCount(waveEngine.getActiveWaveCount());
      }
      requestAnimationFrame(animate);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      threeSetup.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      threeSetup.dispose();
    };
  }, []);

  const handleKeyPress = (phoneticType: PhoneticType) => {
    console.log('Key pressed:', phoneticType);
    if (waveEngineRef.current) {
      waveEngineRef.current.generateWave(phoneticType);
      console.log('Wave generated, active waves:', waveEngineRef.current.getActiveWaveCount());
    }
  };

  const handleReset = () => {
    if (waveEngineRef.current) {
      waveEngineRef.current.reset();
      setActiveWaveCount(0);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-secondary px-3 py-2 flex justify-between items-center border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
          </div>
          <h1 className="text-sm font-medium text-foreground">Phonetic Visualizer</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
            100 Hz - 8 kHz
          </div>
          <div className="flex space-x-1">
            <Button 
              onClick={() => handleKeyPress('vowel')}
              className="bg-red-600 hover:bg-red-700 text-white h-7 px-2 text-xs"
            >
              Test
            </Button>
            <Button 
              onClick={handleReset}
              className="bg-accent hover:bg-accent/90 text-primary h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Visualization Canvas */}
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-gradient-to-br from-background via-secondary to-background"
        />
        
        {/* Frequency Scale Overlay */}
        <div className="absolute left-2 top-2 bg-secondary/80 backdrop-blur-sm rounded p-2">
          <h3 className="text-xs font-medium mb-1 text-foreground">Frequency</h3>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-freq-low rounded-full"></div>
              <span className="text-xs text-muted-foreground">100 Hz</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-freq-mid rounded-full"></div>
              <span className="text-xs text-muted-foreground">1 kHz</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-freq-high rounded-full"></div>
              <span className="text-xs text-muted-foreground">8 kHz</span>
            </div>
          </div>
        </div>

        {/* Wave Parameters Display */}
        <div className="absolute right-2 top-2 bg-secondary/80 backdrop-blur-sm rounded p-2">
          <h3 className="text-xs font-medium mb-1 text-foreground">Waves</h3>
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <div>Field: <span className="text-accent">40°</span></div>
            <div>Data: <span className="text-accent">1000×100</span></div>
            <div>Active: <span className="text-accent">{activeWaveCount}</span></div>
          </div>
        </div>
      </div>

      {/* Phonetic Keyboard */}
      <PhoneticKeyboard 
        onKeyPress={handleKeyPress} 
        activeWaveCount={activeWaveCount}
      />
    </div>
  );
}
