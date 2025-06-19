import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

export function VoiceDictation({ onTranscript, isListening, setIsListening }: VoiceDictationProps) {
  const { voiceSettings } = useSettings();
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isWaitingForActivation, setIsWaitingForActivation] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const activationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Define types for the Web Speech API which isn't fully typed in TypeScript
  const setupRecognition = useCallback(() => {
    try {
      // Get the speech recognition constructor from the window object
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Clean up existing instance if there is one
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            if (isRecognitionActiveRef.current) {
              recognitionRef.current.abort();
              isRecognitionActiveRef.current = false;
            }
          } catch (e) {
            console.log("Error cleaning up previous recognition instance:", e);
          }
        }
        
        // Create a new instance
        recognitionRef.current = new SpeechRecognition();
        // Use continuous recognition for streaming results
        recognitionRef.current.continuous = true;
        // Enable interim results for voice activation, but disable for actual dictation
        recognitionRef.current.interimResults = isWaitingForActivation; 
        recognitionRef.current.lang = voiceSettings.language;
        // Add a shorter max speech time to segment phrases better
        recognitionRef.current.maxAlternatives = 1;
        
        setIsVoiceSupported(true);
        return true;
      } else {
        setIsVoiceSupported(false);
        toast({
          title: "Voice Recognition Not Supported",
          description: "Your browser doesn't support voice recognition. Try using Chrome or Edge.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setIsVoiceSupported(false);
      return false;
    }
  }, [voiceSettings.language, isWaitingForActivation]);

  // Handle safely stopping recognition
  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.onend = null; // Remove end handler to prevent auto-restart
        recognitionRef.current.abort();
        isRecognitionActiveRef.current = false;
        console.log("Recognition stopped successfully");
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
  }, []);

  // Handle safely starting recognition
  const startRecognition = useCallback((transcript?: (event: any) => void) => {
    if (!recognitionRef.current) {
      const success = setupRecognition();
      if (!success) return false;
    }
    
    // If already running, stop it first
    if (isRecognitionActiveRef.current) {
      stopRecognition();
    }
    
    // Set up handlers
    try {
      const handleResult = (event: any) => {
        if (transcript) {
          transcript(event);
        }
      };

      const handleEnd = () => {
        console.log("Recognition ended naturally");
        isRecognitionActiveRef.current = false;
        
        // Only auto-restart if we're supposed to be listening
        if ((isListening || isWaitingForActivation) && recognitionRef.current) {
          console.log("Auto-restarting recognition");
          setTimeout(() => startRecognition(transcript), 300);
        }
      };

      const handleError = (event: any) => {
        console.error('Speech recognition error', event.error);
        isRecognitionActiveRef.current = false;
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice typing.",
            variant: "destructive"
          });
          setIsListening(false);
          setIsWaitingForActivation(false);
        }
      };

      recognitionRef.current.onresult = handleResult;
      recognitionRef.current.onend = handleEnd;
      recognitionRef.current.onerror = handleError;
      
      // Small delay before starting to ensure everything is set up
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          isRecognitionActiveRef.current = true;
          console.log("Recognition started successfully");
          return true;
        } catch (error) {
          console.error("Error starting recognition:", error);
          isRecognitionActiveRef.current = false;
          return false;
        }
      }, 50);
      
      return true;
    } catch (error) {
      console.error("Error setting up recognition handlers:", error);
      return false;
    }
  }, [isListening, isWaitingForActivation, setupRecognition, stopRecognition, setIsListening]);

  // Initial setup
  useEffect(() => {
    if (voiceSettings.enableVoiceCommands) {
      setupRecognition();
    }

    return () => {
      stopRecognition();
      if (activationTimerRef.current) {
        clearTimeout(activationTimerRef.current);
      }
    };
  }, [setupRecognition, stopRecognition, voiceSettings.enableVoiceCommands]);

  // Create a ref for tracking the last transcript outside of the effect
  const lastTranscriptRef = useRef<string>("");
  
  // Handle mode changes
  useEffect(() => {
    if (!voiceSettings.enableVoiceCommands) {
      stopRecognition();
      setIsListening(false);
      setIsWaitingForActivation(false);
      return;
    }

    if (!isVoiceSupported) return;
    
    const handleTranscript = (event: any) => {
      // Only process final results to avoid constant updates
      const isFinalResult = event.results[event.resultIndex]?.isFinal;
      const currentTranscript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
        
      // Activation mode logic
      if (isWaitingForActivation) {
        // Check for activation phrase
        if (currentTranscript.toLowerCase().includes(voiceSettings.activationPhrase.toLowerCase())) {
          setIsWaitingForActivation(false);
          setIsListening(true);
          toast({
            title: "Voice Dictation Activated",
            description: "Now recording your note. Speak clearly...",
            variant: "default"
          });
          
          // Reset tracking and restart fresh to clear buffer
          lastTranscriptRef.current = "";
          stopRecognition();
          setTimeout(() => startRecognition(handleTranscript), 500);
        }
        return;
      }
      
      // Active dictation mode logic
      if (isListening) {
        // Only update if we have new, final content to avoid duplicate updates
        if (isFinalResult && currentTranscript !== lastTranscriptRef.current) {
          lastTranscriptRef.current = currentTranscript;
          onTranscript(currentTranscript);
        }
      }
    };

    if (isListening || isWaitingForActivation) {
      startRecognition(handleTranscript);
    } else {
      stopRecognition();
    }

    return () => {
      // Don't stop recognition here, just cleanup if component unmounts
    };
  }, [
    isListening, 
    isWaitingForActivation, 
    onTranscript, 
    voiceSettings, 
    isVoiceSupported, 
    startRecognition, 
    stopRecognition, 
    setIsListening
  ]);

  const toggleListening = () => {
    if (!voiceSettings.enableVoiceCommands) {
      toast({
        title: "Voice Commands Disabled",
        description: "Enable voice commands in settings to use this feature.",
        variant: "destructive"
      });
      return;
    }

    if (!isVoiceSupported) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition. Try using Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      setIsWaitingForActivation(false); // Ensure we're not in activation mode
      setIsListening(true);
      toast({
        title: "Voice Typing Enabled",
        description: "Speak clearly into your microphone.",
        variant: "default"
      });
    }
  };

  const toggleActivationMode = () => {
    if (!voiceSettings.enableVoiceCommands) {
      toast({
        title: "Voice Commands Disabled",
        description: "Enable voice commands in settings to use this feature.",
        variant: "destructive"
      });
      return;
    }

    if (!isVoiceSupported) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition. Try using Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (isWaitingForActivation) {
      setIsWaitingForActivation(false);
    } else {
      setIsListening(false); // Ensure we're not in listening mode
      setIsWaitingForActivation(true);
      toast({
        title: "Listening for Activation",
        description: `Say "${voiceSettings.activationPhrase}" to start dictation`,
        variant: "default"
      });
    }
  };

  if (!voiceSettings.enableVoiceCommands) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isListening ? "default" : "outline"}
        onClick={toggleListening}
        className={isListening ? "bg-purple-600 hover:bg-purple-700" : ""}
        title={isListening ? "Stop dictation" : "Start dictation"}
      >
        {isListening ? <MicOff size={16} className="mr-1" /> : <Mic size={16} className="mr-1" />}
        {isListening ? "Stop Dictation" : "Voice Typing"}
      </Button>

      <Button
        size="sm"
        variant={isWaitingForActivation ? "default" : "outline"}
        onClick={toggleActivationMode}
        className={isWaitingForActivation ? "bg-purple-600 hover:bg-purple-700" : ""}
        title={isWaitingForActivation ? "Stop voice activation" : "Enable voice activation"}
      >
        <Volume2 size={16} className="mr-1" />
        {isWaitingForActivation ? "Listening..." : "Voice Activation"}
      </Button>
    </div>
  );
}