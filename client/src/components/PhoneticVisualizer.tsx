import { useEffect, useRef, useState } from "react";
import { Activity, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveEngine, PhoneticType } from "@/lib/waveEngine";
import { ThreeJSSetup } from "@/lib/threeSetup";
import PhoneticKeyboard from "./PhoneticKeyboard";

export default function PhoneticVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveEngineRef = useRef<WaveEngine | null>(null);
  const threeSetupRef = useRef<ThreeJSSetup | null>(null);
  const [activeWaveCount, setActiveWaveCount] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas ref not available');
      return;
    }

    console.log('Initializing Three.js and wave engine...');
    
    // Initialize wave engine and Three.js setup
    const waveEngine = new WaveEngine();
    const threeSetup = new ThreeJSSetup(canvasRef.current, waveEngine);
    
    waveEngineRef.current = waveEngine;
    threeSetupRef.current = threeSetup;
    
    console.log('Three.js setup complete');

    // Update wave count periodically
    const updateInterval = setInterval(() => {
      setActiveWaveCount(waveEngine.getActiveWaveCount());
    }, 100);

    // Handle window resize
    const handleResize = () => {
      threeSetup.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(updateInterval);
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
            100 Hz - 6 kHz
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
              <span className="text-xs text-muted-foreground">6 kHz</span>
            </div>
          </div>
        </div>

        {/* Wave Parameters Display */}
        <div className="absolute right-2 top-2 bg-secondary/80 backdrop-blur-sm rounded p-2">
          <h3 className="text-xs font-medium mb-1 text-foreground">Waves</h3>
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <div>Arc: <span className="text-accent">60°</span></div>
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
