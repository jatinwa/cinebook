import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socket, connectSocket, disconnectSocket } from '../socket/socket';
import { applySocketUpdate } from '../store/slices/seatSlice';

export const useSocket = (showId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Don't connect if no showId
    if (!showId) return;

    connectSocket();
    socket.emit('join_show', showId);

    const handleSeatUpdate = (payload) => {
      if (payload.showId === showId) {
        dispatch(applySocketUpdate(payload));
      }
    };

    socket.on('seat_update', handleSeatUpdate);

    // ── Cleanup runs when:
    //    - Component unmounts (user leaves seat map)
    //    - showId changes
    //    - User logs out
    return () => {
      socket.emit('leave_show', showId);
      socket.off('seat_update', handleSeatUpdate); // remove specific listener only
      disconnectSocket();
    };
  }, [showId, dispatch]);
};