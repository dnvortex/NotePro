import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import EditNote from "@/pages/EditNote";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { NoteProvider } from "./context/NoteContext";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/notes/tag/:tag" component={Home} />
      <Route path="/notes/favorites" component={Home} />
      <Route path="/notes/trash" component={Home} />
      <Route path="/notes/recent" component={Home} />
      <Route path="/notes/:id" component={EditNote} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <NoteProvider>
            <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1E1E1E]">
              <Router />
              <Toaster />
            </div>
          </NoteProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
