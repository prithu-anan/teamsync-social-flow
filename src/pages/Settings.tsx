import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getMe, changePassword } from '@/utils/api/auth-api';
import { updateUser } from '@/utils/api/users-api';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  birthdate?: string;
  designation?: string;
  joinDate?: string;
  predictedBurnoutRisk?: string;
}

interface PasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await getMe();
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        setUserData(response.data);
        if (response.data.profilePicture) {
          setPreviewUrl(response.data.profilePicture);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUserUpdate = async () => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: userData.name,
        ...(userData.birthdate && { birthdate: userData.birthdate })
      };

      let response;
      if (selectedFile) {
        // Use updateUser with file upload
        response = await updateUser(updateData, selectedFile);
      } else {
        // Use updateUser for text-only updates
        response = await updateUser(updateData);
      }

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Refresh user data
        await fetchUserData();
        setSelectedFile(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }



    setIsPasswordLoading(true);
    try {
      const response = await changePassword({
        currentPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Change User Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change User Details</CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={previewUrl} alt={userData.name} />
                  <AvatarFallback>{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full max-w-xs hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                      onClick={() => document.getElementById('profile-picture')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture (JPG, PNG, GIF)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                type="date"
                value={userData.birthdate || ''}
                onChange={(e) => setUserData({ ...userData, birthdate: e.target.value })}
              />
            </div>

            {/* Read-only fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userData.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={userData.designation || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input value={userData.joinDate || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Burnout Risk</Label>
                <Input value={userData.predictedBurnoutRisk || 'Not calculated'} disabled />
              </div>
            </div>

            <Button 
              onClick={handleUserUpdate} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input
                id="old-password"
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                placeholder="Enter your current password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter your new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm your new password"
              />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              disabled={isPasswordLoading}
              className="w-full sm:w-auto"
            >
              {isPasswordLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 