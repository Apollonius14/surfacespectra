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
      <header className="bg-secondary px-6 py-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Phonetic Visualizer</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            100 Hz - 6 kHz
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleKeyPress('vowel')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Test Vowel
            </Button>
            <Button 
              onClick={handleReset}
              className="bg-accent hover:bg-accent/90 text-primary"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
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
        <div className="absolute left-4 top-4 bg-secondary/80 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2 text-foreground">Frequency Scale</h3>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-freq-low rounded-full"></div>
              <span className="text-xs text-muted-foreground">100 Hz</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-freq-mid rounded-full"></div>
              <span className="text-xs text-muted-foreground">1 kHz</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-freq-high rounded-full"></div>
              <span className="text-xs text-muted-foreground">6 kHz</span>
            </div>
          </div>
        </div>

        {/* Wave Parameters Display */}
        <div className="absolute right-4 top-4 bg-secondary/80 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2 text-foreground">Wave Parameters</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Arc Span: <span className="text-accent">60°</span></div>
            <div>Decay Rate: <span className="text-accent">0.8</span></div>
            <div>Active Waves: <span className="text-accent">{activeWaveCount}</span></div>
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
