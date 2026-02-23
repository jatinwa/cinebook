import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser } from '../store/slices/authSlice';
import { disconnectSocket } from '../socket/socket';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error, initialized } = useSelector((s) => s.auth);

  const logout = async () => {
    disconnectSocket(); // ← kill socket before clearing auth
    await dispatch(logoutUser());
  };

  return {
    user,
    loading,
    error,
    initialized,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
    login: (creds) => dispatch(loginUser(creds)),
    register: (data) => dispatch(registerUser(data)),
    logout,
  };
};