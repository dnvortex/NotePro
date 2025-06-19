import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
];

export function Settings({ open, onOpenChange }: SettingsProps) {
  const { voiceSettings, updateVoiceSettings, cloudSyncEnabled, setCloudSyncEnabled, darkMode, setDarkMode } = useSettings();
  const { currentUser, login, logout } = useAuth();
  
  // Create a temporary state to hold form values
  const [formState, setFormState] = useState({
    ...voiceSettings,
  });

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Save changes
  const handleSave = () => {
    updateVoiceSettings(formState);
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
      variant: "default",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your note-taking experience and manage your account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Account</h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Google Sign-In</p>
                <p className="text-sm text-muted-foreground">
                  {currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in to enable cloud sync'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={currentUser ? logout : login}
              >
                {currentUser ? 'Sign Out' : 'Sign In'}
              </Button>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="cloudSync"
                checked={cloudSyncEnabled}
                onCheckedChange={(checked) => setCloudSyncEnabled(checked)}
                disabled={!currentUser}
              />
              <Label htmlFor="cloudSync">Enable Cloud Sync</Label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Voice Commands</h3>
            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableVoiceCommands"
                  checked={formState.enableVoiceCommands}
                  onCheckedChange={(checked) => handleToggleChange('enableVoiceCommands', checked)}
                />
                <Label htmlFor="enableVoiceCommands">Enable Voice Commands</Label>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 pt-2">
                <Label htmlFor="activationPhrase">Activation Phrase</Label>
                <Input
                  id="activationPhrase"
                  name="activationPhrase"
                  className="col-span-2"
                  value={formState.activationPhrase}
                  onChange={handleInputChange}
                  disabled={!formState.enableVoiceCommands}
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4 pt-2">
                <Label htmlFor="language">Recognition Language</Label>
                <Select
                  disabled={!formState.enableVoiceCommands}
                  value={formState.language}
                  onValueChange={(value) => handleSelectChange('language', value)}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="autoSave"
                  checked={formState.autoSave}
                  onCheckedChange={(checked) => handleToggleChange('autoSave', checked)}
                  disabled={!formState.enableVoiceCommands}
                />
                <Label htmlFor="autoSave">Auto-save after dictation</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={(checked) => setDarkMode(checked)}
              />
              <Label htmlFor="darkMode">Dark Mode</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}