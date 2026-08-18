import { io } from 'socket.io-client';
import { API_URL } from './api.js';

export function createCollabSocket() {
  return io(`${API_URL}/collab`, {
    transports: ['websocket'],
    autoConnect: true,
  });
}
