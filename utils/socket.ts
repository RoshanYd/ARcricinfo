import { io } from 'socket.io-client';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const socket = io(BACKEND_URL, {
    autoConnect: true,
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSockets Live Server');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSockets Live Server');
});
