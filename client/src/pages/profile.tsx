import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    department: user?.department || "",
    notifications: {
      email: true,
      push: true,
      reportUpdates: true,
      communityActivity: false,
    }
  });

  const handleSave = () => {
    // TODO: Implement profile update API call
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "official": return "bg-blue-100 text-blue-800";
      case "citizen": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-profile-title">
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <Card className="lg:col-span-1" data-testid="card-profile-overview">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                  <AvatarFallback className="text-2xl bg-blue-500 text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user?.firstName} {user?.lastName}</CardTitle>
              <Badge className={getRoleColor(user?.role || "citizen")} data-testid="badge-user-role">
                {user?.role?.toUpperCase() || "CITIZEN"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Member since</p>
                <p className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                </p>
              </div>
              
              {user?.role === "official" && user?.department && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium capitalize">{user.department.replace('_', ' ')}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsEditing(!isEditing)}
                data-testid="button-edit-profile"
              >
                <i className="fas fa-edit mr-2"></i>
                {isEditing ? "Cancel Edit" : "Edit Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card data-testid="card-basic-info">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-user mr-2 text-blue-500"></i>
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="bg-gray-50"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {user?.role === "official" && (
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({...formData, department: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public_works">Public Works</SelectItem>
                        <SelectItem value="sanitation">Sanitation</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card data-testid="card-notifications">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-bell mr-2 text-blue-500"></i>
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        notifications: {...formData.notifications, email: checked}
                      })
                    }
                    disabled={!isEditing}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        notifications: {...formData.notifications, push: checked}
                      })
                    }
                    disabled={!isEditing}
                    data-testid="switch-push-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Report Updates</Label>
                    <p className="text-xs text-gray-500">Get notified when your reports are updated</p>
                  </div>
                  <Switch
                    checked={formData.notifications.reportUpdates}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        notifications: {...formData.notifications, reportUpdates: checked}
                      })
                    }
                    disabled={!isEditing}
                    data-testid="switch-report-updates"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Community Activity</Label>
                    <p className="text-xs text-gray-500">Get notified about new community posts</p>
                  </div>
                  <Switch
                    checked={formData.notifications.communityActivity}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        notifications: {...formData.notifications, communityActivity: checked}
                      })
                    }
                    disabled={!isEditing}
                    data-testid="switch-community-activity"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save-profile">
                  <i className="fas fa-save mr-2"></i>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}