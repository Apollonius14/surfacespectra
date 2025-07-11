import { PhoneticType } from "@/lib/waveEngine";

interface PhoneticKeyboardProps {
  onKeyPress: (phoneticType: PhoneticType) => void;
  activeWaveCount: number;
}

const phoneticKeys = [
  {
    type: 'vowel' as PhoneticType,
    symbol: 'A',
    label: 'Vowel',
    frequency: '200-1000 Hz',
    className: 'vowel'
  },
  {
    type: 'trill' as PhoneticType,
    symbol: 'R',
    label: 'Trill',
    frequency: '100-3000 Hz',
    className: 'trill'
  },
  {
    type: 'fricative' as PhoneticType,
    symbol: 'S',
    label: 'Fricative',
    frequency: '2000-6000 Hz',
    className: 'fricative'
  },
  {
    type: 'plosive' as PhoneticType,
    symbol: 'P',
    label: 'Plosive',
    frequency: '500-4000 Hz',
    className: 'plosive'
  }
];

export default function PhoneticKeyboard({ onKeyPress, activeWaveCount }: PhoneticKeyboardProps) {
  const handleKeyPress = (phoneticType: PhoneticType) => {
    onKeyPress(phoneticType);
  };

  const handleTouchStart = (e: React.TouchEvent, phoneticType: PhoneticType) => {
    e.preventDefault();
    handleKeyPress(phoneticType);
  };

  return (
    <div className="h-[20vh] bg-secondary border-t border-border">
      <div className="h-full flex flex-col">
        {/* Keyboard Header */}
        <div className="px-6 py-3 bg-secondary border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-medium text-foreground">Phonetic Keys</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Touch or click to generate wave pulses
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Active waves: <span className="text-accent font-medium">{activeWaveCount}</span>
            </div>
          </div>
        </div>
        
        {/* Piano Keys Container */}
        <div className="flex-1 flex items-stretch">
          {phoneticKeys.map((key) => (
            <div key={key.type} className="flex-1 relative group">
              <button
                className={`phonetic-key ${key.className}`}
                onTouchStart={(e) => handleTouchStart(e, key.type)}
                onClick={() => handleKeyPress(key.type)}
              >
                <div className="text-2xl font-bold mb-1">{key.symbol}</div>
                <div className="text-xs opacity-80">{key.label}</div>
                <div className="text-xs opacity-60 mt-1">{key.frequency}</div>
              </button>
              <div className="wave-indicator" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
