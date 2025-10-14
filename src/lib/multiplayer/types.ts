export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  score: number;
  isAttacking: boolean;
  isHurting: boolean;
  isDying: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | 'idle';
  color: string;
}

export interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  gameMode: 'cooperative' | 'competitive';
  isActive: boolean;
  level: number;
  hostId: string;
}

export interface MultiplayerState {
  isConnected: boolean;
  currentRoom: GameRoom | null;
  localPlayer: Player | null;
  players: Map<string, Player>;
  gameMode: 'cooperative' | 'competitive' | null;
  isHost: boolean;
}

export interface GameEvent {
  type: 'player_join' | 'player_leave' | 'player_move' | 'player_attack' | 'player_hurt' | 'player_die' | 'coin_pickup' | 'enemy_kill' | 'level_complete' | 'game_over';
  playerId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface NetworkMessage {
  type: 'join_room' | 'leave_room' | 'create_room' | 'player_update' | 'game_event' | 'room_list' | 'error';
  roomId?: string;
  playerId?: string;
  data?: Record<string, unknown>;
}
