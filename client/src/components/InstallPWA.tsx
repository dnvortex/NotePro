import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// Interface for BeforeInstallPromptEvent which is not in the standard TypeScript definitions
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    const checkIfInstalled = () => {
      // @ts-ignore: matchMedia is not fully typed in TypeScript
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check for iOS standalone mode
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const iOSStandalone = iOS && 'standalone' in window.navigator && (window.navigator as any).standalone === true;
      
      setIsInstalled(
        isStandalone || 
        iOSStandalone || 
        document.referrer.includes('android-app://')
      );
    };

    checkIfInstalled();
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('appinstalled', () => setIsInstalled(true));
    };
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null);
  };

  // Don't show install button if already installed or if install prompt is not available
  if (isInstalled || !installPrompt) {
    return null;
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="flex items-center gap-1"
      onClick={handleInstallClick}
    >
      <Download className="h-4 w-4" />
      <span>Install App</span>
    </Button>
  );
}