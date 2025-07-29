import React from 'react';
import { X, Mail, Calendar, Clock, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types/messages';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onSendMessage?: (userId: string) => void;
}

const UserProfileModal = ({ user, onClose, onSendMessage }: UserProfileModalProps) => {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-semibold">User Profile</div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Profile Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Avatar and Basic Info */}
          <div className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-border/50">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl bg-muted/50">
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            {user.email && (
              <p className="text-muted-foreground mt-1">{user.email}</p>
            )}
          </div>

          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground">{user.id}</p>
                </div>
              </div>
              {user.joinDate && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Join Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(user.joinDate)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-3">
            {onSendMessage && (
              <Button 
                className="flex-1" 
                onClick={() => {
                  onSendMessage(user.id);
                  onClose();
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal; 