import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socket, connectSocket, disconnectSocket } from '../socket/socket';
import { applySocketUpdate } from '../store/slices/seatSlice';

export const useSocket = (showId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!showId) return;

    connectSocket();

    // Join the show's room to receive seat updates
    socket.emit('join_show', showId);

    // Listen for real-time seat status changes
    socket.on('seat_update', (payload) => {
      if (payload.showId === showId) {
        dispatch(applySocketUpdate(payload));
      }
    });

    return () => {
      socket.emit('leave_show', showId);
      socket.off('seat_update');
      disconnectSocket();
    };
  }, [showId, dispatch]);
};