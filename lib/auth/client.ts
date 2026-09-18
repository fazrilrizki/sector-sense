export { useAuth, AuthProvider } from '@/components/providers/auth-provider'
export {
  signInWithEmail,
  signUpWithEmail,
  signInAsGuest,
  signOut,
  upgradeGuestAccount,
} from './actions'
export {
  getCurrentUser,
  getCurrentProfile,
  getAuthStatus,
} from './session'
export type {
  AuthRole,
  AuthStatus,
  AuthState,
  AuthActionResult,
  UserProfile,
  GuestSessionData,
} from './types'
