import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { multiplayerState } from '~/lib/multiplayer';

interface GameEventData {
  points?: number;
  healthGain?: number;
  damage?: number;
  level?: number;
  [key: string]: unknown;
}

const getColorCode = (color: string): string => {
  const colorMap: Record<string, string> = {
    red: '#ff0000',
    blue: '#0000ff',
    green: '#00ff00',
    yellow: '#ffff00',
    purple: '#ff00ff',
    orange: '#ffa500'
  };
  return colorMap[color] ?? '#ffffff';
};

export const MultiplayerUI = observer(() => {
  if (!multiplayerState.currentRoom) return null;

  const isCooperative = multiplayerState.gameMode === 'cooperative';
  const leaderboard = multiplayerState.getLeaderboard();
  
  // Timer state
  const [gameTime, setGameTime] = useState(0);
  
  // Start timer when component mounts
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setGameTime(Date.now() - startTime);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-black/50 p-4 rounded-lg text-white min-w-[200px]">
      <div className="text-sm font-semibold mb-2">
        {isCooperative ? 'Cooperative Mode' : 'Competitive Mode'}
      </div>
      
      <div className="text-xs text-gray-300 mb-3">
        Room: {multiplayerState.currentRoom.name}
      </div>
      
      <div className="text-xs text-gray-300 mb-3">
        Time: {(gameTime / 1000).toFixed(1)}s
      </div>

      {isCooperative ? (
        <div className="mb-3">
          <div className="text-xs text-gray-300 mb-1">Shared Health</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${String(multiplayerState.localPlayer?.health ?? 0)}%` }}
            />
          </div>
          <div className="text-xs text-center mt-1">
            {String(multiplayerState.localPlayer?.health ?? 0)}%
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <div className="text-xs text-gray-300 mb-1">Your Health</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${String(multiplayerState.localPlayer?.health ?? 0)}%` }}
            />
          </div>
          <div className="text-xs text-center mt-1">
            {String(multiplayerState.localPlayer?.health ?? 0)}%
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="text-xs text-gray-300 mb-1">
          {isCooperative ? 'Team Score' : 'Your Score'}
        </div>
        <div className="text-lg font-bold">
          {isCooperative ? multiplayerState.getTotalScore() : multiplayerState.localPlayer?.score ?? 0}
        </div>
      </div>

      <div className="border-t border-gray-600 pt-2">
        <div className="text-xs text-gray-300 mb-2">Players ({multiplayerState.getPlayerCount()})</div>
        <div className="space-y-1">
          {leaderboard.map((player) => (
            <div 
              key={player.id} 
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: getColorCode(player.color)
                  }}
                />
                <span className={player.id === multiplayerState.localPlayer?.id ? 'font-bold' : ''}>
                  {player.name}
                  {player.id === multiplayerState.localPlayer?.id && ' (You)'}
                </span>
              </div>
              <div className="text-gray-300">
                {player.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {multiplayerState.gameEvents.length > 0 && (
        <div className="border-t border-gray-600 pt-2 mt-2">
          <div className="text-xs text-gray-300 mb-1">Recent Events</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {multiplayerState.gameEvents.slice(-3).map((event) => (
              <div key={`${event.type}-${String(event.timestamp || Date.now())}`} className="text-xs text-gray-400">
                {event.type === 'coin_pickup' && `💰 ${String((event.data as GameEventData).points ?? 0)} points +${String((event.data as GameEventData).healthGain ?? 0)} health`}
                {event.type === 'player_attack' && `⚔️ Attack`}
                {event.type === 'player_hurt' && `💔 -${String((event.data as GameEventData).damage ?? 0)} health`}
                {event.type === 'enemy_kill' && `👹 Enemy defeated`}
                {event.type === 'level_complete' && `🏆 Level ${String((event.data as GameEventData).level ?? 0)} complete!`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
