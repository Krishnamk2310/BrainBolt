/**
 * Socket.io Client
 * 
 * Handles real-time connections for leaderboard and user updates.
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      // Join user room if we have a userId
      if (this.userId) {
        this.socket?.emit('join', this.userId);
      }
      // Join leaderboard room
      this.socket?.emit('join:leaderboard');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (this.socket?.connected) {
      this.socket.emit('join', userId);
    }
  }

  onUserUpdate(callback: (data: any) => void) {
    this.socket?.on('user:update', callback);
  }

  onLeaderboardUpdate(callback: (data: any) => void) {
    this.socket?.on('leaderboard:update', callback);
  }

  onDifficultyUpdate(callback: (data: any) => void) {
    this.socket?.on('difficulty:update', callback);
  }

  offUserUpdate() {
    this.socket?.off('user:update');
  }

  offLeaderboardUpdate() {
    this.socket?.off('leaderboard:update');
  }

  offDifficultyUpdate() {
    this.socket?.off('difficulty:update');
  }
}

export const socketClient = new SocketClient();
export default socketClient;
