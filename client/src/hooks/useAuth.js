import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logoutUser } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error, initialized } = useSelector((s) => s.auth);

  return {
    user,
    loading,
    error,
    initialized,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
    login: (creds) => dispatch(loginUser(creds)),
    register: (data) => dispatch(registerUser(data)),
    logout: () => dispatch(logoutUser()),
  };
};