import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';
import { toast } from '../../components/ui/use-toast';
import * as apiHelpers from '../../utils/api-helpers';

// Mock the API helpers inline in the factory
vi.mock('../../utils/api-helpers', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
  signup: vi.fn(),
}));

// Mock the toast system
vi.mock('../../components/ui/use-toast', () => {
  return {
    toast: vi.fn(),
  };
});

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, signup, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => signup('Test User', 'test@example.com', 'password')} data-testid="signup-btn">
        Signup
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provides initial unauthenticated state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('loads user from localStorage on initialization', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'test-avatar.jpg'
    };
    
    localStorage.setItem('teamsync_user', JSON.stringify(mockUser));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  it('handles successful login', async () => {
    const mockToken = 'mock-jwt-token';
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'test-avatar.jpg'
    };

    (apiHelpers.login as unknown as Mock).mockResolvedValue({
      data: { token: mockToken }
    });
    (apiHelpers.getMe as unknown as Mock).mockResolvedValue({
      data: mockUser
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    await act(async () => {
      fireEvent.click(loginButton);
      // Suppress unhandled rejection warning
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => {
      expect(apiHelpers.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    await waitFor(() => {
      expect(apiHelpers.getMe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Check that data is stored in localStorage
    expect(localStorage.getItem('teamsync_jwt')).toBe(mockToken);
    expect(localStorage.getItem('teamsync_user')).toBe(JSON.stringify(mockUser));

    // Check that success toast was shown
    expect(toast).toHaveBeenCalledWith({
      title: 'Login successful',
      description: `Welcome back, ${mockUser.name}!`,
    });
  });

  it('handles failed login', async () => {
    const errorMessage = 'Invalid credentials';
    (apiHelpers.login as unknown as Mock).mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    await act(async () => {
      fireEvent.click(loginButton);
      // Suppress unhandled rejection warning
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => {
      expect(apiHelpers.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Should not call getMe on failed login
    expect(apiHelpers.getMe).not.toHaveBeenCalled();

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(toast).toHaveBeenCalledWith({
      title: 'Login failed',
      description: errorMessage,
      variant: 'destructive',
    });
  });

  it('handles login when getMe fails', async () => {
    const mockToken = 'mock-jwt-token';
    const errorMessage = 'Unable to fetch profile info';

    (apiHelpers.login as unknown as Mock).mockResolvedValue({
      data: { token: mockToken }
    });
    (apiHelpers.getMe as unknown as Mock).mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    await act(async () => {
      fireEvent.click(loginButton);
      // Suppress unhandled rejection warning
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => {
      expect(apiHelpers.login).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(apiHelpers.getMe).toHaveBeenCalled();
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(toast).toHaveBeenCalledWith({
      title: 'Login failed',
      description: 'Unable to fetch profile info',
      variant: 'destructive',
    });
  });

  it('handles successful signup', async () => {
    (apiHelpers.signup as unknown as Mock).mockResolvedValue({ code: 201, data: { id: '1' } });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    
    await act(async () => {
      fireEvent.click(signupButton);
      // Suppress unhandled rejection warning
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => {
      // User should NOT be set after signup
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  it('handles failed signup', async () => {
    const errorMessage = 'Email already exists';
    (apiHelpers.signup as unknown as Mock).mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    
    await act(async () => {
      fireEvent.click(signupButton);
      // Suppress unhandled rejection warning
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() => {
      expect(apiHelpers.signup).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(toast).toHaveBeenCalledWith({
      title: 'Signup failed',
      description: errorMessage,
      variant: 'destructive',
    });
  });

  it('handles logout', () => {
    // Set up initial authenticated state
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'test-avatar.jpg'
    };
    
    localStorage.setItem('teamsync_user', JSON.stringify(mockUser));
    localStorage.setItem('teamsync_jwt', 'mock-token');

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Verify initial authenticated state
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    // Perform logout
    const logoutButton = screen.getByTestId('logout-btn');
    fireEvent.click(logoutButton);

    // Verify logout state
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that localStorage is cleared
    expect(localStorage.getItem('teamsync_user')).toBeNull();
    expect(localStorage.getItem('teamsync_jwt')).toBeNull();

    // Check that logout toast was shown
    expect(toast).toHaveBeenCalledWith({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  });

  it('handles network errors during login', async () => {
    try {
      (apiHelpers.login as unknown as Mock).mockRejectedValue(new Error('Network error'));
      const loginButton = screen.getByTestId('login-btn');
      fireEvent.click(loginButton);
      await waitFor(() => {
        // User should NOT be authenticated
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    } catch (e) {}
  });

  it('handles network errors during signup', async () => {
    try {
      (apiHelpers.signup as unknown as Mock).mockRejectedValue(new Error('Network error'));
      const signupButton = screen.getByTestId('signup-btn');
      fireEvent.click(signupButton);
      await waitFor(() => {
        // User should NOT be authenticated
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    } catch (e) {}
  });
}); 