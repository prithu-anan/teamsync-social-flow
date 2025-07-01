import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the API helpers
const mockLoginApi = vi.fn();
const mockGetMe = vi.fn();
const mockSignupApi = vi.fn();

vi.mock('../../util/api-helpers', () => ({
  login: mockLoginApi,
  getMe: mockGetMe,
  signup: mockSignupApi,
}));

// Mock the toast system
const mockToast = vi.fn();
vi.mock('../../components/ui/use-toast', () => ({
  toast: mockToast,
}));

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
    // Clear localStorage before each test
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

    mockLoginApi.mockResolvedValue({
      data: { token: mockToken }
    });
    mockGetMe.mockResolvedValue({
      data: mockUser
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    await waitFor(() => {
      expect(mockGetMe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Check that data is stored in localStorage
    expect(localStorage.getItem('teamsync_jwt')).toBe(mockToken);
    expect(localStorage.getItem('teamsync_user')).toBe(JSON.stringify(mockUser));

    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Login successful',
      description: `Welcome back, ${mockUser.name}!`,
    });
  });

  it('handles failed login', async () => {
    const errorMessage = 'Invalid credentials';
    mockLoginApi.mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Should not call getMe on failed login
    expect(mockGetMe).not.toHaveBeenCalled();

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Login failed',
      description: errorMessage,
      variant: 'destructive',
    });
  });

  it('handles login when getMe fails', async () => {
    const mockToken = 'mock-jwt-token';
    const errorMessage = 'Unable to fetch profile info';

    mockLoginApi.mockResolvedValue({
      data: { token: mockToken }
    });
    mockGetMe.mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetMe).toHaveBeenCalled();
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Login failed',
      description: 'Unable to fetch profile info',
      variant: 'destructive',
    });
  });

  it('handles successful signup', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'test-avatar.jpg'
    };

    mockSignupApi.mockResolvedValue({
      data: { id: '1' }
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(mockSignupApi).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Check that user data is stored in localStorage
    expect(localStorage.getItem('teamsync_user')).toBe(JSON.stringify(mockUser));

    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Account created',
      description: `Welcome to TeamSync, Test User!`,
    });
  });

  it('handles failed signup', async () => {
    const errorMessage = 'Email already exists';
    mockSignupApi.mockResolvedValue({
      error: errorMessage
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(mockSignupApi).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      });
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
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
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  });

  it('handles network errors during login', async () => {
    mockLoginApi.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-btn');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalled();
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Login failed',
      description: 'An unexpected error occurred.',
      variant: 'destructive',
    });
  });

  it('handles network errors during signup', async () => {
    mockSignupApi.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(mockSignupApi).toHaveBeenCalled();
    });

    // Should remain unauthenticated
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');

    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Signup failed',
      description: 'An unexpected error occurred.',
      variant: 'destructive',
    });
  });

  it('generates avatar URL for new users during signup', async () => {
    mockSignupApi.mockResolvedValue({
      data: { id: '1' }
    });

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const signupButton = screen.getByTestId('signup-btn');
    fireEvent.click(signupButton);

    await waitFor(() => {
      const userData = JSON.parse(screen.getByTestId('user').textContent || '{}');
      expect(userData.avatar).toContain('ui-avatars.com/api/?name=Test+User');
    });
  });
}); 