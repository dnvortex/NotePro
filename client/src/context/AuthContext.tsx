import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmailAndPassword, 
  signOutUser, 
  checkRedirectResult 
} from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for redirect result when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're returning from a redirect
        console.log("Checking redirect result from AuthContext...");
        const user = await checkRedirectResult();
        if (user) {
          console.log("Redirect sign-in successful, user:", user.uid);
        } else {
          console.log("No redirect result in AuthContext");
        }
      } catch (error) {
        console.error("Error checking redirect result in AuthContext:", error);
        toast({
          title: "Authentication Error",
          description: "There was a problem with the authentication process. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    checkAuth();
  }, []);

  // Handle auth state for demo purposes
  useEffect(() => {
    // For demo, we'll check localStorage for a simulated user session
    const storedUser = localStorage.getItem('demo_user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user as User);
        console.log("Restored demo user session:", user);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('demo_user');
      }
    }
    
    // Complete loading
    setIsLoading(false);
    
    // Add a simulated listener effect to match Firebase behavior
    const simulatedListener = () => {
      console.log("Simulated auth state listener running");
      return () => console.log("Simulated auth listener cleanup");
    };
    
    return simulatedListener();
  }, []);

  const login = async () => {
    try {
      setIsLoading(true);
      // Get mock user from Google auth function
      const result = await signInWithGoogle();
      const user = result.user as User;
      
      // Store user in state
      setCurrentUser(user);
      
      // Store in localStorage for demo persistence
      localStorage.setItem('demo_user', JSON.stringify(user));
      
      toast({
        title: "Signed in with Google",
        description: `Welcome ${user.displayName || 'User'}!`,
        variant: "default",
      });
      
      return user;
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Sign in failed",
        description: "There was a problem signing in with Google",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      // Get mock user from email auth function
      const user = await signInWithEmail(email, password);
      
      // Store user in state and localStorage
      setCurrentUser(user);
      localStorage.setItem('demo_user', JSON.stringify(user));
      
      toast({
        title: "Signed in",
        description: `Welcome ${user.displayName || 'User'}!`,
        variant: "default",
      });
      
      return user;
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      console.error("Email login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      setIsLoading(true);
      // Get mock user from registration function
      const user = await registerWithEmailAndPassword(email, password, displayName);
      
      // Store user in state and localStorage
      setCurrentUser(user);
      localStorage.setItem('demo_user', JSON.stringify(user));
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
        variant: "default",
      });
      
      return user;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "There was a problem creating your account",
        variant: "destructive",
      });
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOutUser();
      
      // Clear user from state and localStorage
      setCurrentUser(null);
      localStorage.removeItem('demo_user');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    loginWithEmail,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}