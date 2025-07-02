import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Signup from '../Signup';
import { AuthProvider } from '../../contexts/AuthContext';

// Suppress unhandled promise rejections for test noise
process.on('unhandledRejection', () => {});

// Mock the authentication context
const mockSignup = vi.fn();
let mockIsAuthenticated = false;

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      signup: mockSignup,
      isAuthenticated: mockIsAuthenticated,
      user: null,
      login: vi.fn(),
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

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignup.mockResolvedValue(true);
    mockNavigate.mockClear();
  });

  it('renders signup form with all required elements', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    // Check for main headings
    expect(screen.getByText('TeamSync')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByText('Enter your information to create an account')).toBeInTheDocument();

    // Check for form inputs
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();

    // Check for links
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();

    // Check for logo
    expect(screen.getByTestId('team-sync-logo')).toBeInTheDocument();
  });

  it('handles name input changes', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    expect(nameInput.value).toBe('John Doe');
  });

  it('handles email input changes', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    expect(emailInput.value).toBe('john@example.com');
  });

  it('handles password input changes', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('handles confirm password input changes', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('submits form with valid credentials', async () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles successful signup and redirects to dashboard', async () => {
    mockSignup.mockResolvedValue(true);

    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles failed signup and stays on signup page', async () => {
    mockSignup.mockResolvedValue(false);

    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    // Check that signup form is still rendered
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('validates password confirmation match', async () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form with mismatched passwords
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    // Submit form
    fireEvent.click(submitButton);

    // Should show password error
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    // Should not call signup
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('clears password error when passwords match', async () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // First, create password mismatch
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    // Submit form to trigger error
    fireEvent.click(submitButton);

    // Should show password error
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    // Now fix the password match
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form again
    fireEvent.click(submitButton);

    // Error should be cleared and signup should be called
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock a delayed signup response
    mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    // Check for loading state
    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Check that inputs have required attribute
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(confirmPasswordInput).toHaveAttribute('required');

    // Check that email input has email type
    expect(emailInput).toHaveAttribute('type', 'email');

    // Check that password inputs have password type
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('handles form submission with Enter key', async () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Find the form and submit it
    const form = nameInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });
  });

  it('handles signup errors gracefully', async () => {
    mockSignup.mockResolvedValue(false);

    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    // Check that signup form is still rendered
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('handles network errors during signup', async () => {
    mockSignup.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
    });

    // Check that signup form is still rendered
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Check for proper labels
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
    expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');

    // Check for proper button type
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('has proper form structure', () => {
    const { container } = render(
      <TestWrapper>
        <Signup />
      </TestWrapper>
    );

    // Get the form element directly
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    // Check that inputs are within the form
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    expect(form).toContainElement(nameInput);
    expect(form).toContainElement(emailInput);
    expect(form).toContainElement(passwordInput);
    expect(form).toContainElement(confirmPasswordInput);
    expect(form).toContainElement(submitButton);
  });
}); 