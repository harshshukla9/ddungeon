import { io, type Socket } from 'socket.io-client';
import { multiplayerState } from './state';
import type { GameEvent, Player, GameRoom } from './types';

export class MultiplayerClient {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private serverUrl = 'ws://localhost:3001';


  public async connect(): Promise<boolean> {
    if (this.isConnecting || this.socket?.connected) {
      return this.socket?.connected ?? false;
    }

    this.isConnecting = true;

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: 5000,
        autoConnect: false, // Don't auto-connect
      });

      this.setupEventListeners();
      
      // Manually connect
      this.socket.connect();
      
      return await new Promise((resolve) => {
        this.socket?.on('connect', () => {
          console.log('Connected to multiplayer server');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          multiplayerState.setConnected(true);
          resolve(true);
        });

        this.socket?.on('connect_error', (error: Error) => {
          console.error('Connection error:', error);
          this.isConnecting = false;
          multiplayerState.setConnected(false);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Failed to connect to multiplayer server:', error);
      this.isConnecting = false;
      multiplayerState.setConnected(false);
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    multiplayerState.setConnected(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('Disconnected from multiplayer server');
      multiplayerState.setConnected(false);
      this.attemptReconnect();
    });

    this.socket.on('room_joined', (data: { room: GameRoom; players: Player[] }) => {
      console.log('Joined room:', data.room.name);
      multiplayerState.setCurrentRoom(data.room);
      data.players.forEach(player => {
        multiplayerState.addPlayer(player);
      });
    });

    this.socket.on('player_joined', (player: Player) => {
      console.log('Player joined:', player.name);
      multiplayerState.addPlayer(player);
    });

    this.socket.on('player_left', (playerId: string) => {
      console.log('Player left:', playerId);
      multiplayerState.removePlayer(playerId);
    });

    this.socket.on('player_update', (data: { playerId: string; updates: Partial<Player> }) => {
      multiplayerState.updatePlayer(data.playerId, data.updates);
    });

    this.socket.on('game_event', (event: GameEvent) => {
      multiplayerState.addGameEvent(event);
    });

    this.socket.on('room_list', (rooms: GameRoom[]) => {
      multiplayerState.setAvailableRooms(rooms);
    });

    this.socket.on('error', (error: string) => {
      console.error('Multiplayer error:', error);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${String(this.reconnectAttempts)}/${String(this.maxReconnectAttempts)})`);
      void this.connect();
    }, delay);
  }

  public createRoom(roomName: string, gameMode: 'cooperative' | 'competitive', maxPlayers = 4): void {
    if (!this.socket?.connected) {
      console.error('Not connected to server');
      return;
    }

    const room = multiplayerState.createRoom(roomName, gameMode, maxPlayers);
    
    this.socket.emit('create_room', {
      room,
      player: multiplayerState.localPlayer,
    });
  }

  public joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('join_room', {
      roomId,
      player: multiplayerState.localPlayer,
    });
  }

  public leaveRoom(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave_room', {
      roomId: multiplayerState.currentRoom?.id,
      playerId: multiplayerState.localPlayer?.id,
    });

    multiplayerState.setCurrentRoom(null);
    multiplayerState.players.clear();
  }

  public updatePlayerPosition(x: number, y: number, direction: Player['direction']): void {
    if (!this.socket?.connected || !multiplayerState.localPlayer) return;

    const updates: Partial<Player> = { x, y, direction };
    multiplayerState.updatePlayer(multiplayerState.localPlayer.id, updates);

    this.socket.emit('player_update', {
      playerId: multiplayerState.localPlayer.id,
      updates,
    });
  }

  public updatePlayerState(updates: Partial<Player>): void {
    if (!this.socket?.connected || !multiplayerState.localPlayer) return;

    multiplayerState.updatePlayer(multiplayerState.localPlayer.id, updates);

    this.socket.emit('player_update', {
      playerId: multiplayerState.localPlayer.id,
      updates,
    });
  }

  public sendGameEvent(event: Omit<GameEvent, 'timestamp'>): void {
    if (!this.socket?.connected) return;

    const gameEvent: GameEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.socket.emit('game_event', gameEvent);
  }

  public requestRoomList(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('get_room_list');
  }

  public startGame(): void {
    if (!this.socket?.connected || !multiplayerState.isHost) return;

    this.socket.emit('start_game', {
      roomId: multiplayerState.currentRoom?.id,
    });
  }

  public onGameStarted(callback: () => void): void {
    if (!this.socket) return;
    
    this.socket.on('game_started', callback);
  }
}

export const multiplayerClient = new MultiplayerClient();
