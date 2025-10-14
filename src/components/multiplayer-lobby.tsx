import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { multiplayerState, multiplayerClient } from '~/lib/multiplayer';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

export const MultiplayerLobby = observer(() => {
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState('blue');
  const [roomName, setRoomName] = useState('');
  const [gameMode, setGameMode] = useState<'cooperative' | 'competitive'>('cooperative');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<string | null>(null);

  const colors = [
    { value: 'red', label: 'Red', color: '#ff0000' },
    { value: 'blue', label: 'Blue', color: '#0000ff' },
    { value: 'green', label: 'Green', color: '#00ff00' },
    { value: 'yellow', label: 'Yellow', color: '#ffff00' },
    { value: 'purple', label: 'Purple', color: '#ff00ff' },
    { value: 'orange', label: 'Orange', color: '#ffa500' },
  ];

  useEffect(() => {
    // Connect to multiplayer server when component mounts
    void multiplayerClient.connect();
    
    // Request room list
    multiplayerClient.requestRoomList();

    return () => {
      multiplayerClient.disconnect();
    };
  }, []);

  const handleCreatePlayer = () => {
    if (!playerName.trim()) return;
    
    multiplayerState.createLocalPlayer(playerName.trim(), playerColor);
  };

  const handleCreateRoom = () => {
    if (!roomName.trim() || !multiplayerState.localPlayer) return;
    
    setIsCreatingRoom(true);
    multiplayerClient.createRoom(roomName.trim(), gameMode, maxPlayers);
    
    // Reset form
    setRoomName('');
    setIsCreatingRoom(false);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!multiplayerState.localPlayer) return;
    
    setIsJoiningRoom(roomId);
    multiplayerClient.joinRoom(roomId);
    setIsJoiningRoom(null);
  };

  const handleLeaveRoom = () => {
    multiplayerClient.leaveRoom();
  };

  const handleStartGame = () => {
    if (multiplayerState.isHost) {
      multiplayerClient.startGame();
    }
  };

  if (!multiplayerState.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connecting to Multiplayer Server...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
        </div>
      </div>
    );
  }

  if (!multiplayerState.localPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Join Multiplayer</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                className="mt-1"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="playerColor">Player Color</Label>
              <Select value={playerColor} onValueChange={setPlayerColor}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color.color }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full"
              disabled={!playerName.trim()}
              onClick={handleCreatePlayer}
            >
              Create Player
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (multiplayerState.currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Room: {multiplayerState.currentRoom.name}</h2>
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Players ({multiplayerState.getPlayerCount()}/{multiplayerState.currentRoom.maxPlayers})</h3>
              <div className="space-y-2">
                {Array.from(multiplayerState.players.values()).map((player) => (
                  <div 
                    key={player.id} 
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                  >
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: colors.find(c => c.value === player.color)?.color ?? '#000' }}
                    />
                    <span className="font-medium">{player.name}</span>
                    {player.id === multiplayerState.localPlayer?.id && (
                      <span className="text-sm text-gray-400">(You)</span>
                    )}
                    {player.id === multiplayerState.currentRoom?.hostId && (
                      <span className="text-sm text-yellow-400">(Host)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Room Settings</h3>
              <div className="space-y-3">
                <div>
                  <Label>Game Mode</Label>
                  <div className="text-sm text-gray-300 capitalize">
                    {multiplayerState.currentRoom.gameMode}
                  </div>
                </div>
                <div>
                  <Label>Level</Label>
                  <div className="text-sm text-gray-300">
                    {multiplayerState.currentRoom.level}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="text-sm text-gray-300">
                    {multiplayerState.currentRoom.isActive ? 'Active' : 'Waiting'}
                  </div>
                </div>
              </div>

              {multiplayerState.isHost ? (
                <Button 
                  className="w-full mt-4"
                  disabled={multiplayerState.getPlayerCount() < 2}
                  onClick={handleStartGame}
                >
                  Start Game
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Multiplayer Lobby</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create Room</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  className="mt-1"
                  placeholder="Enter room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="gameMode">Game Mode</Label>
                <Select value={gameMode} onValueChange={(value: 'cooperative' | 'competitive') => setGameMode(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooperative">Cooperative</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Select value={maxPlayers.toString()} onValueChange={(value) => setMaxPlayers(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="3">3 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full"
                disabled={!roomName.trim() || isCreatingRoom}
                onClick={handleCreateRoom}
              >
                {isCreatingRoom ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </div>

          {/* Join Room */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Rooms</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {multiplayerState.availableRooms.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No rooms available
                </div>
              ) : (
                multiplayerState.availableRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{room.name}</div>
                      <div className="text-sm text-gray-400">
                        {room.players.length}/{room.maxPlayers} players • {room.gameMode}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={room.players.length >= room.maxPlayers || isJoiningRoom === room.id}
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      {isJoiningRoom === room.id ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button 
              className="w-full"
              variant="outline"
              onClick={() => multiplayerClient.requestRoomList()}
            >
              Refresh Rooms
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
