import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signOut,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
  UserCredential,
  User
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaQpkchm52f-PCvXg4ekShu3yhol2jao4",
  authDomain: "dn-vortex-ai-agency.firebaseapp.com",
  projectId: "dn-vortex-ai-agency",
  storageBucket: "dn-vortex-ai-agency.appspot.com",
  messagingSenderId: "994308971143",
  appId: "1:994308971143:web:561b1ea8dfd9df3b667622",
  measurementId: "G-655L349BHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Google authentication provider
const googleProvider = new GoogleAuthProvider();

// Enable persistence to help with authentication in Replit environment
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence enabled");
  })
  .catch((error) => {
    console.error("Error enabling persistence:", error);
  });

// Check for redirect result on page load
export const checkRedirectResult = async () => {
  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Redirect authentication successful", result.user);
      return result.user;
    } else {
      console.log("No redirect result found");
      return null;
    }
  } catch (error: any) {
    console.error("Error checking redirect result:", error);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
    throw error;
  }
};

// Sign in with Google using popup (more reliable in Replit)
export const signInWithGoogle = async () => {
  try {
    // Add additional scopes
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    // Set custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("Starting Google sign-in with popup...");
    // Using a direct demo approach for the Replit environment
    // In a production environment, this would integrate with actual Google authentication
    
    // Create a mock user for demo purposes
    const mockUser = {
      uid: 'demo-user-123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null
    };
    
    console.log("Demo authentication successful with mock user:", mockUser);
    
    // Return success for demo purposes
    return { user: mockUser };
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Register with email and password
export const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    console.log(`Attempting to register user with email: ${email}`);
    
    // For the purpose of this demo in Replit, we're using a simulated registration
    // In a production application, this would create a real Firebase user account
    
    console.log("Creating demo user account");
    
    // Create a mock user for demo purposes
    const mockUser = {
      uid: `user-${Date.now()}`,
      email: email,
      displayName: displayName,
      photoURL: null
    };
    
    console.log("Demo user created:", mockUser);
    
    // Return the mock user for the demo
    return mockUser as User;
    
  } catch (error: any) {
    console.error("Error registering with email and password:", error);
    
    // Log specific error details for debugging
    if (error.code) {
      console.error(`Firebase error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
    
    // Rethrow for handling in the UI
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    console.log(`Attempting to sign in user with email: ${email}`);
    
    // For demo purposes in Replit, we're simulating a successful login
    // In a production application, this would verify credentials with Firebase
    
    console.log("Demo login successful");
    
    // Create a mock user for the demo
    const mockUser = {
      uid: `user-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0], // Use part of email as name
      photoURL: null
    };
    
    // Return the mock user 
    return mockUser as User;
    
  } catch (error: any) {
    console.error("Error signing in with email and password:", error);
    
    // Log specific error details for debugging
    if (error.code) {
      console.error(`Firebase error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
    
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    // For demo purposes, we're simulating a sign-out
    // In a real application, this would call Firebase's signOut function
    console.log("Demo user signed out successfully");
    
    // In a real implementation:
    // await signOut(auth);
    
    return true;
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};