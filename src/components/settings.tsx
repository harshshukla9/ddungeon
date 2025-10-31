import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { cn } from '~/lib/utils';
import { useSettings } from '~/hooks';

export interface GameSettings {
  // Audio settings
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  
  // Graphics settings
  pixelArtMode: boolean;
  showFPS: boolean;
  fullscreen: boolean;
  
  // Gameplay settings
  difficulty: 'easy' | 'normal' | 'hard';
  autoSave: boolean;
  showHealthBars: boolean;
  showMinimap: boolean;
  
  // Controls
  movementSpeed: number;
  attackCooldown: number;
}

// Component definitions moved outside render function
const SettingSection = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="mb-8">
    <h3 className="font-golondrina text-3xl mb-6 text-center text-neutral-100">{title}</h3>
    <div className="space-y-6">{children}</div>
  </div>
);

const SliderSetting = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1,
  onChange,
  suffix = ''
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}) => (
  <div className="bg-neutral-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <label className="text-neutral-200 text-lg font-medium">{label}</label>
      <span className="text-neutral-300 text-lg font-mono bg-neutral-700 px-3 py-1 rounded">
        {value}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
);

const ToggleSetting = ({ 
  label, 
  value, 
  onChange,
  description
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) => (
  <div className="bg-neutral-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-neutral-200 text-lg font-medium block mb-1">{label}</label>
        {description ? <p className="text-neutral-400 text-sm">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-7 w-12 items-center rounded-full transition-colors ml-4 flex-shrink-0",
          value ? "bg-green-600" : "bg-neutral-600"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg",
            value ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  </div>
);

const SelectSetting = ({ 
  label, 
  value, 
  options, 
  onChange 
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => (
  <div className="bg-neutral-800/50 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <label className="text-neutral-200 text-lg font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-700 text-neutral-200 px-4 py-2 rounded border border-neutral-600 min-w-[200px] focus:border-green-500 focus:outline-none"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export const SettingsComponent = () => {
  const navigate = useNavigate();
  const { settings, isLoaded, updateSetting, resetSettings } = useSettings();

  const handleBack = () => {
    void navigate({ to: '/' });
  };

  if (!isLoaded) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="text-neutral-200 text-xl relative z-10">Loading settings...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="w-full max-w-6xl bg-[#0b171dd0] rounded-xl p-8 max-h-[90vh] overflow-y-auto relative z-10 backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-golondrina text-7xl text-neutral-100 mb-6">Game Settings</h1>
          <Button 
            onClick={handleBack}
            variant="outline"
            className="bg-transparent border-neutral-600 text-neutral-200 hover:bg-neutral-700 px-8 py-3 text-lg"
          >
            ← Back to Menu
          </Button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-12">
          {/* Audio Settings */}
          <SettingSection title="🎵 Audio Settings">
            <SliderSetting
              label="Master Volume"
              value={settings.masterVolume}
              min={0}
              max={100}
              onChange={(value) => updateSetting('masterVolume', value)}
              suffix="%"
            />
            <SliderSetting
              label="Music Volume"
              value={settings.musicVolume}
              min={0}
              max={100}
              onChange={(value) => updateSetting('musicVolume', value)}
              suffix="%"
            />
            <SliderSetting
              label="Sound Effects Volume"
              value={settings.sfxVolume}
              min={0}
              max={100}
              onChange={(value) => updateSetting('sfxVolume', value)}
              suffix="%"
            />
          </SettingSection>

          {/* Graphics Settings */}
          <SettingSection title="🎨 Graphics Settings">
            <ToggleSetting
              label="Pixel Art Mode"
              value={settings.pixelArtMode}
              onChange={(value) => updateSetting('pixelArtMode', value)}
              description="Maintains crisp pixel art rendering"
            />
            <ToggleSetting
              label="Show FPS Counter"
              value={settings.showFPS}
              onChange={(value) => updateSetting('showFPS', value)}
              description="Display frames per second in top corner"
            />
            <ToggleSetting
              label="Fullscreen Mode"
              value={settings.fullscreen}
              onChange={(value) => updateSetting('fullscreen', value)}
              description="Play in fullscreen (requires page refresh)"
            />
          </SettingSection>

          {/* Gameplay Settings */}
          <SettingSection title="⚔️ Gameplay Settings">
            <SelectSetting
              label="Difficulty Level"
              value={settings.difficulty}
              options={[
                { value: 'easy', label: 'Easy - More lives, slower enemies' },
                { value: 'normal', label: 'Normal - Standard gameplay' },
                { value: 'hard', label: 'Hard - Fewer lives, faster enemies' }
              ]}
              onChange={(value) => updateSetting('difficulty', value as 'easy' | 'normal' | 'hard')}
            />
            <ToggleSetting
              label="Auto Save Progress"
              value={settings.autoSave}
              onChange={(value) => updateSetting('autoSave', value)}
              description="Automatically save your progress between sessions"
            />
            <ToggleSetting
              label="Show Health Bars"
              value={settings.showHealthBars}
              onChange={(value) => updateSetting('showHealthBars', value)}
              description="Display health bars above enemies and player"
            />
            <ToggleSetting
              label="Show Minimap"
              value={settings.showMinimap}
              onChange={(value) => updateSetting('showMinimap', value)}
              description="Display a small map in the corner"
            />
          </SettingSection>

          {/* Controls Settings */}
          <SettingSection title="🎮 Controls">
            <SliderSetting
              label="Movement Speed"
              value={settings.movementSpeed}
              min={0.5}
              max={2.0}
              step={0.1}
              onChange={(value) => updateSetting('movementSpeed', value)}
              suffix="x"
            />
            <SliderSetting
              label="Attack Cooldown"
              value={settings.attackCooldown}
              min={200}
              max={1000}
              step={50}
              onChange={(value) => updateSetting('attackCooldown', value)}
              suffix="ms"
            />
          </SettingSection>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center mt-12 pt-8 border-t border-neutral-600">
          <div className="text-center space-y-4">
            <Button 
              onClick={resetSettings}
              variant="outline"
              className="bg-transparent border-red-600 text-red-400 hover:bg-red-900/20 px-8 py-3 text-lg"
            >
              Reset to Default
            </Button>
            
            <div className="text-sm text-neutral-400">
              Settings are automatically saved
            </div>
          </div>
        </div>

        {/* Settings Preview */}
        <div className="mt-8 p-6 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <h4 className="font-golondrina text-2xl mb-4 text-center text-neutral-200">Current Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-neutral-700/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase tracking-wide">Difficulty</div>
              <div className="text-lg text-neutral-200 font-medium capitalize">{settings.difficulty}</div>
            </div>
            <div className="bg-neutral-700/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase tracking-wide">Master Volume</div>
              <div className="text-lg text-neutral-200 font-medium">{settings.masterVolume}%</div>
            </div>
            <div className="bg-neutral-700/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase tracking-wide">Pixel Art</div>
              <div className="text-lg text-neutral-200 font-medium">{settings.pixelArtMode ? 'On' : 'Off'}</div>
            </div>
            <div className="bg-neutral-700/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400 uppercase tracking-wide">Movement Speed</div>
              <div className="text-lg text-neutral-200 font-medium">{settings.movementSpeed}x</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
