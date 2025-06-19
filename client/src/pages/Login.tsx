import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FcGoogle } from "react-icons/fc";
import { PenLine, Mail, Lock } from "lucide-react";

// Create schema for login form
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login, loginWithEmail, isLoading, currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Use form with zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = async (data: LoginFormValues) => {
    try {
      setError(null);
      await loginWithEmail(data.email, data.password);
      // The auth state will update and redirect
    } catch (err: any) {
      console.error("Email login error:", err);
      
      // Handle specific Firebase errors with user-friendly messages
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password") {
        setError("Invalid email or password. Please try again.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await login();
      // No navigate here - the redirect will happen after
      // the auth state updates in the AuthProvider
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#121212] to-[#1E1E1E] px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-xl shadow-xl border border-gray-800">
        <div className="text-center">
          <div className="flex justify-center">
            <PenLine className="h-12 w-12 text-purple-500" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">NotesMaster</h1>
          <p className="mt-2 text-gray-400">
            Sign in to sync your notes across devices
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-900/50 border border-red-800 text-red-200 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your email" 
                        type="email" 
                        className="pl-10" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your password" 
                        type="password" 
                        className="pl-10" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full py-6"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-400">Or</span>
          </div>
        </div>

        <Button
          className="w-full py-6 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <FcGoogle className="h-5 w-5" />
          <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
        </Button>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            Don't have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 text-purple-400 hover:text-purple-300"
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          </p>
          <p className="mt-2">
            Your notes are saved locally until you sign in.
            <br />
            Sign in to enable cloud sync.
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <Button 
          variant="link" 
          className="text-gray-400 hover:text-gray-200"
          onClick={() => navigate("/")}
        >
          Back to Notes
        </Button>
      </div>
    </div>
  );
}