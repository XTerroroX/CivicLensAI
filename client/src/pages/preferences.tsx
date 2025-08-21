import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function PreferencesPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    reportPrivacy: "public",
    autoLocation: true,
    mapType: "road",
    notifications: {
      sound: true,
      desktop: true,
      frequency: "immediate"
    },
    accessibility: {
      highContrast: false,
      fontSize: 16,
      reducedMotion: false
    },
    privacy: {
      showProfile: true,
      shareLocation: true,
      analytics: true
    }
  });

  const handleSave = () => {
    // TODO: Implement preferences save API call
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    toast({
      title: "Preferences saved",
      description: "Your preferences have been successfully updated.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-preferences-title">
            Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Customize your CivicLens experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card data-testid="card-appearance">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-palette mr-2 text-purple-500"></i>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) => setPreferences({...preferences, theme: value})}
                  >
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences({...preferences, language: value})}
                  >
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Font Size: {preferences.accessibility.fontSize}px</Label>
                <Slider
                  value={[preferences.accessibility.fontSize]}
                  onValueChange={(value) => 
                    setPreferences({
                      ...preferences, 
                      accessibility: {...preferences.accessibility, fontSize: value[0]}
                    })
                  }
                  min={12}
                  max={24}
                  step={2}
                  className="mt-2"
                  data-testid="slider-font-size"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card data-testid="card-privacy">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-shield-alt mr-2 text-green-500"></i>
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-xs text-gray-500">Allow others to see your profile</p>
                </div>
                <Switch
                  checked={preferences.privacy.showProfile}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      privacy: {...preferences.privacy, showProfile: checked}
                    })
                  }
                  data-testid="switch-profile-visibility"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Share Location</Label>
                  <p className="text-xs text-gray-500">Allow automatic location detection for reports</p>
                </div>
                <Switch
                  checked={preferences.privacy.shareLocation}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      privacy: {...preferences.privacy, shareLocation: checked}
                    })
                  }
                  data-testid="switch-share-location"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics Data</Label>
                  <p className="text-xs text-gray-500">Help improve CivicLens by sharing usage data</p>
                </div>
                <Switch
                  checked={preferences.privacy.analytics}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      privacy: {...preferences.privacy, analytics: checked}
                    })
                  }
                  data-testid="switch-analytics"
                />
              </div>

              <div>
                <Label htmlFor="reportPrivacy">Default Report Privacy</Label>
                <Select
                  value={preferences.reportPrivacy}
                  onValueChange={(value) => setPreferences({...preferences, reportPrivacy: value})}
                >
                  <SelectTrigger data-testid="select-report-privacy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (Visible to all)</SelectItem>
                    <SelectItem value="officials">Officials Only</SelectItem>
                    <SelectItem value="private">Private (Only you)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card data-testid="card-notification-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-bell mr-2 text-blue-500"></i>
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Notifications</Label>
                  <p className="text-xs text-gray-500">Play sound for notifications</p>
                </div>
                <Switch
                  checked={preferences.notifications.sound}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      notifications: {...preferences.notifications, sound: checked}
                    })
                  }
                  data-testid="switch-sound-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Desktop Notifications</Label>
                  <p className="text-xs text-gray-500">Show desktop notifications</p>
                </div>
                <Switch
                  checked={preferences.notifications.desktop}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      notifications: {...preferences.notifications, desktop: checked}
                    })
                  }
                  data-testid="switch-desktop-notifications"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Notification Frequency</Label>
                <Select
                  value={preferences.notifications.frequency}
                  onValueChange={(value) => 
                    setPreferences({
                      ...preferences, 
                      notifications: {...preferences.notifications, frequency: value}
                    })
                  }
                >
                  <SelectTrigger data-testid="select-notification-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Settings */}
          <Card data-testid="card-accessibility">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-universal-access mr-2 text-orange-500"></i>
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>High Contrast Mode</Label>
                  <p className="text-xs text-gray-500">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={preferences.accessibility.highContrast}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      accessibility: {...preferences.accessibility, highContrast: checked}
                    })
                  }
                  data-testid="switch-high-contrast"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Reduced Motion</Label>
                  <p className="text-xs text-gray-500">Minimize animations and transitions</p>
                </div>
                <Switch
                  checked={preferences.accessibility.reducedMotion}
                  onCheckedChange={(checked) => 
                    setPreferences({
                      ...preferences, 
                      accessibility: {...preferences.accessibility, reducedMotion: checked}
                    })
                  }
                  data-testid="switch-reduced-motion"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg" data-testid="button-save-preferences">
              <i className="fas fa-save mr-2"></i>
              Save All Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}