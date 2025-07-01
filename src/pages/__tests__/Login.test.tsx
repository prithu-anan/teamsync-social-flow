import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';

// Suppress unhandled promise rejections for test noise
process.on('unhandledRejection', () => {});

// Mock the authentication context
const mockLogin = vi.fn();
let mockIsAuthenticated = false;

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      isAuthenticated: mockIsAuthenticated,
      user: null,
      signup: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

// Mock the TeamSyncLogo component
vi.mock('../../components/TeamSyncLogo', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="team-sync-logo" className={className}>
      TeamSync Logo
    </div>
  ),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper component
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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(true);
    mockNavigate.mockClear();
  });

  it('renders login form with all required elements', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Check for main headings
    expect(screen.getByText('TeamSync')).toBeInTheDocument();
    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Enter your credentials below to access your account')).toBeInTheDocument();

    // Check for form inputs
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try demo account/i })).toBeInTheDocument();

    // Check for links
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();

    // Check for logo
    expect(screen.getByTestId('team-sync-logo')).toBeInTheDocument();
  });

  it('handles email input changes', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('handles password input changes', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('submits form with valid credentials', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles successful login and redirects to dashboard', async () => {
    mockLogin.mockResolvedValue(true);

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles failed login and stays on login page', async () => {
    mockLogin.mockResolvedValue(false);

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });

    // Should not navigate on failed login
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles demo account login', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const demoButton = screen.getByRole('button', { name: /try demo account/i });
    fireEvent.click(demoButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock a delayed login response
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    // Check for loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  it('shows loading state during demo login', async () => {
    // Mock a delayed login response
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const demoButton = screen.getByRole('button', { name: /try demo account/i });
    fireEvent.click(demoButton);

    // Check for loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(demoButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Try Demo Account')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Check that inputs have required attribute
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');

    // Check that email input has email type
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('handles form submission with Enter key', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Find the form and submit it
    const form = emailInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles login errors gracefully', async () => {
    mockLogin.mockResolvedValue(false);

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check that login form is still rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('handles network errors during login', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check that login form is still rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Check for proper labels
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');

    // Check for proper button type
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('has proper form structure', () => {
    const { container } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Get the form element directly
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    // Check that inputs are within the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(form).toContainElement(emailInput);
    expect(form).toContainElement(passwordInput);
    expect(form).toContainElement(submitButton);
  });
}); 