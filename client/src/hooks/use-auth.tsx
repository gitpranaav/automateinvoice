import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

type AuthContextType = {
  user: GoogleUser | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Fetch the current user
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<GoogleUser | null, Error>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to log out');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/user'], null);
      // Redirect to login page after logout
      window.location.href = '/auth';
    },
    onError: (error) => {
      toast({
        title: 'Logout Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  // Show error notifications for authentication issues
  useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error instanceof Error ? error.message : 'Failed to authenticate',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error as Error | null,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}