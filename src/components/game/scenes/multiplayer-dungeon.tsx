import { generateDungeon } from '~/lib/helpers/game';
import * as Actions from '~/lib/game/actions';
import { multiplayerState, multiplayerClient } from '~/lib/multiplayer';
import type { Player as NetworkPlayer } from '~/lib/multiplayer/types';

import type Dungeon from '@mikewesthad/dungeon';
import type { Room } from '@mikewesthad/dungeon';
import Phaser from 'phaser';

import { type Coin, type Enemy } from '../entities';
import { MultiplayerPlayer } from '../entities/multiplayer-player';
import type { TilemapVisibility } from '../tilemap-visibility';

type SoundTypes = 'soundtrack';

export class MultiplayerDungeonScene extends Phaser.Scene {
  public dungeon!: Dungeon;
  public startRoom!: Room;
  public localPlayer?: MultiplayerPlayer;
  public multiplayerPlayers = new Map<string, MultiplayerPlayer>();
  public tilemap!: Phaser.Tilemaps.Tilemap;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer;
  public stuffLayer!: Phaser.Tilemaps.TilemapLayer;
  public tilemapVisibility!: TilemapVisibility;
  public coins: Coin[] = [];
  public enemies: Enemy[] = [];
  public sounds!: Record<SoundTypes, Phaser.Sound.BaseSound>;
  public sharedHealth = 100;
  public gameMode: 'cooperative' | 'competitive' = 'cooperative';
  private lastDamageTime = 0;
  private damageCooldown = 1000; // 1 second cooldown

  constructor() {
    super({ key: 'MultiplayerDungeonScene' });
  }

  init() {
    const level = multiplayerState.currentRoom?.level ?? 1;
    this.dungeon = generateDungeon(level);
    this.gameMode = multiplayerState.gameMode ?? 'cooperative';
    
    if (this.gameMode === 'cooperative') {
      this.sharedHealth = 100;
    }
  }

  preload() {
    Actions.preload(this);
  }

  create() {
    console.log('MultiplayerDungeonScene create() called');
    console.log('Dungeon:', this.dungeon);
    console.log('Game mode:', this.gameMode);
    console.log('Local player:', multiplayerState.localPlayer);
    
    this.sounds = {
      soundtrack: this.sound.add('soundtrack', { loop: true }),
    };

    this.sounds.soundtrack.play({ volume: 0.4 });
    console.log('Creating animations...');
    Actions.createAnimations(this as unknown as Parameters<typeof Actions.createAnimations>[0]);
    console.log('Animations created');
    console.log('Creating map...');
    const args = Actions.createMap(this as unknown as Parameters<typeof Actions.createMap>[0]);
    console.log('Map created, args:', args);

    // Create local player
    if (multiplayerState.localPlayer) {
      this.localPlayer = new MultiplayerPlayer(
        this,
        multiplayerState.localPlayer,
        true
      );
      this.localPlayer.sprite.setPosition(args.startX, args.startY);
    }

    // Create other players
    multiplayerState.getOtherPlayers().forEach((networkPlayer) => {
      const player = new MultiplayerPlayer(this, networkPlayer, false);
      this.multiplayerPlayers.set(networkPlayer.id, player);
    });

    // Setup physics for all players
    const allPlayers = [this.localPlayer, ...Array.from(this.multiplayerPlayers.values())].filter((player): player is MultiplayerPlayer => Boolean(player));
    allPlayers.forEach((player) => {
      this.physics.add.collider(player.sprite, args.groundLayer);
      this.physics.add.collider(player.sprite, args.stuffLayer);
    });

    // Setup player-to-player collisions
    allPlayers.forEach((player1) => {
      allPlayers.forEach((player2) => {
        if (player1 !== player2) {
          this.physics.add.collider(player1.sprite, player2.sprite);
        }
      });
    });

    // Place coins
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- MultiplayerDungeonScene incompatible with DungeonGameScene type
    const coins = Actions.placeCoins.call(this as any, args.map, args.stuffLayer);
    this.coins.push(...coins);

    // Setup coin collection for all players
    allPlayers.forEach((player) => {
      coins.forEach((coin) => {
        this.physics.add.overlap(player.sprite, coin.sprite, () => {
          this.onCoinPickup(player, coin);
        });
      });
    });

    // Place enemies
    const enemies = Actions.placeEnemies.call(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Type incompatibility between MultiplayerDungeonScene and DungeonGameScene
      this as any,
      args.otherRooms,
      args.map,
      args.stuffLayer
    );
    this.enemies.push(...enemies);

    // Setup enemy interactions for all players
    allPlayers.forEach((player) => {
      for (const enemy of this.enemies) {
        if (!enemy.sprite) continue;
        this.physics.add.collider(
          player.sprite,
          enemy.sprite,
          () => this.onPlayerEnemyCollision(player, enemy),
          undefined,
          this
        );
      }
    });

    // Setup camera to follow local player
    const camera = this.cameras.main;
    camera.setBounds(0, 0, args.mapWidth, args.mapHeight);
    if (this.localPlayer) {
      camera.startFollow(this.localPlayer.sprite);
    }

    // Setup stairs interaction
    this.setupStairsInteraction(args.stuffLayer);

    // Setup multiplayer event listeners
    this.setupMultiplayerEvents();

    // ESC key to return to lobby
    this.input.keyboard?.on('keydown-ESC', () => {
      this.returnToLobby();
    });
  }

  private setupStairsInteraction(stuffLayer: Phaser.Tilemaps.TilemapLayer) {
    const stairsTileIndex = 26; // Assuming stairs tile index is 26
    
    stuffLayer.setTileIndexCallback(
      stairsTileIndex,
      () => {
        this.completeLevel();
      },
      {}
    );
  }

  private setupMultiplayerEvents() {
    // Listen for new players joining
    const originalAddPlayer = multiplayerState.addPlayer.bind(multiplayerState);
    multiplayerState.addPlayer = (player: NetworkPlayer) => {
      originalAddPlayer(player);
      if (player.id !== multiplayerState.localPlayer?.id) {
        const multiplayerPlayer = new MultiplayerPlayer(this, player, false);
        this.multiplayerPlayers.set(player.id, multiplayerPlayer);
        
        // Setup physics for new player
        this.physics.add.collider(multiplayerPlayer.sprite, this.groundLayer);
        this.physics.add.collider(multiplayerPlayer.sprite, this.stuffLayer);
        
        // Setup coin collection for new player
        this.coins.forEach((coin) => {
          this.physics.add.overlap(multiplayerPlayer.sprite, coin.sprite, () => {
            this.onCoinPickup(multiplayerPlayer, coin);
          });
        });
        
        // Setup enemy interactions for new player
        this.enemies.forEach((enemy) => {
          if (enemy.sprite) {
            this.physics.add.collider(
              multiplayerPlayer.sprite,
              enemy.sprite,
              () => this.onPlayerEnemyCollision(multiplayerPlayer, enemy),
              undefined,
              this
            );
          }
        });
      }
    };

    // Listen for players leaving
    const originalRemovePlayer = multiplayerState.removePlayer.bind(multiplayerState);
    multiplayerState.removePlayer = (playerId: string) => {
      originalRemovePlayer(playerId);
      const player = this.multiplayerPlayers.get(playerId);
      if (player) {
        player.destroy();
        this.multiplayerPlayers.delete(playerId);
      }
    };
  }

  private onCoinPickup(player: MultiplayerPlayer, coin: Coin) {
    coin.pickup();
    
    // Give health to the player who collected the coin
    const healthGain = 10; // Each coin gives 10 health
    player.heal(healthGain);
    
    if (this.gameMode === 'cooperative') {
      // In cooperative mode, all players share the score
      multiplayerState.getLeaderboard().forEach((networkPlayer) => {
        const multiplayerPlayer = this.multiplayerPlayers.get(networkPlayer.id) ?? 
          (networkPlayer.id === multiplayerState.localPlayer?.id ? this.localPlayer : null);
        if (multiplayerPlayer) {
          multiplayerPlayer.addScore(coin.type.points);
        }
      });
      
      // In cooperative mode, also heal all other players
      multiplayerState.getLeaderboard().forEach((networkPlayer) => {
        if (networkPlayer.id !== player.networkPlayer.id) {
          const multiplayerPlayer = this.multiplayerPlayers.get(networkPlayer.id) ?? 
            (networkPlayer.id === multiplayerState.localPlayer?.id ? this.localPlayer : null);
          if (multiplayerPlayer) {
            multiplayerPlayer.heal(healthGain);
          }
        }
      });
    } else {
      // In competitive mode, only the player who picked up gets points and health
      player.addScore(coin.type.points);
    }

    // Send coin pickup event
    multiplayerClient.sendGameEvent({
      type: 'coin_pickup',
      playerId: player.networkPlayer.id,
      data: { 
        coinType: coin.type.key, 
        points: coin.type.points,
        healthGain,
        gameMode: this.gameMode 
      },
    });
  }

  private onPlayerEnemyCollision(player: MultiplayerPlayer, enemy: Enemy) {
    // Don't call enemy.attack() as it will cause double damage
    // The collision itself is the damage trigger
    
    // Check cooldown to prevent rapid damage
    if (this.time.now - this.lastDamageTime < this.damageCooldown) {
      return;
    }
    
    this.lastDamageTime = this.time.now;
    // Different damage based on enemy type
    const damage = enemy.enemyType.key === 'archer' ? 15 : 10; // Archer: 15 damage, Skeleton: 10 damage
    
    if (this.gameMode === 'cooperative') {
      // In cooperative mode, damage is shared among all players
      this.sharedHealth = Math.max(0, this.sharedHealth - damage);
      
      // Update all players' health to match shared health
      multiplayerState.players.forEach((networkPlayer) => {
        networkPlayer.health = this.sharedHealth;
        const multiplayerPlayer = this.multiplayerPlayers.get(networkPlayer.id) ?? 
          (networkPlayer.id === multiplayerState.localPlayer?.id ? this.localPlayer : null);
        if (multiplayerPlayer) {
          multiplayerPlayer.networkPlayer.health = this.sharedHealth;
        }
      });
      
      // Check for game over
      if (this.sharedHealth <= 0) {
        this.gameOver();
      }
    } else {
      // In competitive mode, only the colliding player takes damage
      player.takeDamage(damage);
    }

    // Send collision event
    multiplayerClient.sendGameEvent({
      type: 'player_hurt',
      playerId: player.networkPlayer.id,
      data: { 
        damage, 
        enemyType: enemy.enemyType.key,
        gameMode: this.gameMode 
      },
    });
  }

  private completeLevel() {
    console.log('completeLevel() called - this should only happen when stepping on stairs');
    const level = multiplayerState.currentRoom?.level ?? 1;
    const newLevel = level + 1;
    
    // Update room level
    if (multiplayerState.currentRoom) {
      multiplayerState.currentRoom.level = newLevel;
    }

    // Send level complete event
    multiplayerClient.sendGameEvent({
      type: 'level_complete',
      playerId: multiplayerState.localPlayer?.id ?? '',
      data: { 
        level: newLevel,
        gameMode: this.gameMode,
        leaderboard: multiplayerState.getLeaderboard()
      },
    });

    // Restart scene with new level
    console.log('Restarting scene with new level:', newLevel);
    this.scene.restart();
  }

  private gameOver() {
    console.log('gameOver() called - this should only happen when health reaches 0');
    // Send game over event
    multiplayerClient.sendGameEvent({
      type: 'game_over',
      playerId: multiplayerState.localPlayer?.id ?? '',
      data: { 
        gameMode: this.gameMode,
        finalLeaderboard: multiplayerState.getLeaderboard(),
        totalScore: multiplayerState.getTotalScore()
      },
    });

    // Return to lobby
    console.log('Returning to lobby due to game over');
    this.returnToLobby();
  }

  private returnToLobby() {
    console.log('returnToLobby() called - this should only happen when ESC is pressed or game over');
    this.coins = [];
    this.enemies = [];
    this.multiplayerPlayers.clear();
    this.scene.start('MultiplayerLobbyScene');
  }

  update() {
    // Update local player
    if (this.localPlayer) {
      this.localPlayer.update(this as unknown as Parameters<typeof this.localPlayer.update>[0]);
    }

    // Update other players
    this.multiplayerPlayers.forEach((player) => {
      player.update(this as unknown as Parameters<typeof player.update>[0]);
    });

    // Update visibility and entities
    if (this.localPlayer?.sprite) {
      const playerTileX = this.groundLayer.worldToTileX(this.localPlayer.sprite.x);
      const playerTileY = this.groundLayer.worldToTileY(this.localPlayer.sprite.y);
      const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);
      
      if (playerRoom) {
        this.tilemapVisibility.setActiveRoom(playerRoom);
        this.coins.forEach((coin) => {
          coin.update(playerRoom);
        });
        // Filter out destroyed enemies and update remaining ones
        this.enemies = this.enemies.filter((enemy) => {
          if (enemy.sprite) {
            enemy.update(this as unknown as Parameters<typeof enemy.update>[0], playerRoom);
            return true; // Keep this enemy
          }
          return false; // Remove this enemy (it's been destroyed)
        });
      }
    }
  }
}
