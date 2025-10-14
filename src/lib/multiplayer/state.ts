import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import type { GameRoom, Player, GameEvent } from './types';

export class MultiplayerGameState {
  public isConnected = false;
  public currentRoom: GameRoom | null = null;
  public localPlayer: Player | null = null;
  public players = new Map<string, Player>();
  public gameMode: 'cooperative' | 'competitive' | null = null;
  public isHost = false;
  public availableRooms: GameRoom[] = [];
  public gameEvents: GameEvent[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  public setConnected(connected: boolean) {
    this.isConnected = connected;
  }

  public setCurrentRoom(room: GameRoom | null) {
    this.currentRoom = room;
    if (room) {
      this.gameMode = room.gameMode;
      this.isHost = room.hostId === this.localPlayer?.id;
    } else {
      this.gameMode = null;
      this.isHost = false;
    }
  }

  public setLocalPlayer(player: Player) {
    this.localPlayer = player;
    this.players.set(player.id, player);
  }

  public addPlayer(player: Player) {
    this.players.set(player.id, player);
  }

  public removePlayer(playerId: string) {
    this.players.delete(playerId);
  }

  public updatePlayer(playerId: string, updates: Partial<Player>) {
    const player = this.players.get(playerId);
    if (player) {
      Object.assign(player, updates);
      this.players.set(playerId, player);
    }
  }

  public setAvailableRooms(rooms: GameRoom[]) {
    this.availableRooms = rooms;
  }

  public addGameEvent(event: GameEvent) {
    this.gameEvents.push(event);
    // Keep only last 100 events to prevent memory issues
    if (this.gameEvents.length > 100) {
      this.gameEvents = this.gameEvents.slice(-100);
    }
  }

  public createLocalPlayer(name: string, color: string): Player {
    const player: Player = {
      id: uuidv4(),
      name,
      x: 0,
      y: 0,
      health: 100,
      score: 0,
      isAttacking: false,
      isHurting: false,
      isDying: false,
      direction: 'idle',
      color,
    };
    this.setLocalPlayer(player);
    return player;
  }

  public createRoom(name: string, gameMode: 'cooperative' | 'competitive', maxPlayers = 4): GameRoom {
    if (!this.localPlayer) {
      throw new Error('Local player not initialized');
    }

    const room: GameRoom = {
      id: uuidv4(),
      name,
      players: [this.localPlayer],
      maxPlayers,
      gameMode,
      isActive: false,
      level: 1,
      hostId: this.localPlayer.id,
    };

    return room;
  }

  public reset() {
    this.isConnected = false;
    this.currentRoom = null;
    this.localPlayer = null;
    this.players.clear();
    this.gameMode = null;
    this.isHost = false;
    this.availableRooms = [];
    this.gameEvents = [];
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getOtherPlayers(): Player[] {
    if (!this.localPlayer) return [];
    return Array.from(this.players.values()).filter(p => p.id !== this.localPlayer?.id);
  }

  public getTotalScore(): number {
    if (this.gameMode === 'cooperative') {
      return Array.from(this.players.values()).reduce((total, player) => total + player.score, 0);
    }
    return this.localPlayer?.score ?? 0;
  }

  public getLeaderboard(): Player[] {
    return Array.from(this.players.values()).sort((a, b) => b.score - a.score);
  }
}

export const multiplayerState = new MultiplayerGameState();
