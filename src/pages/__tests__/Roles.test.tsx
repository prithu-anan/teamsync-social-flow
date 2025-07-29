import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Roles from '../Roles';
import { useAuth } from '@/contexts/AuthContext';
import * as usersApi from '@/utils/api/users-api';

// Mock the API functions
vi.mock('@/utils/api/users-api');
vi.mock('@/contexts/AuthContext');
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
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

const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    designation: 'developer',
    profilePicture: 'https://example.com/john.jpg',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    designation: 'manager',
    profilePicture: 'https://example.com/jane.jpg',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    designation: 'designer',
    profilePicture: 'https://example.com/bob.jpg',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth
    (useAuth as any).mockReturnValue({
      user: {
        id: '1',
        name: 'Manager User',
        email: 'manager@example.com',
        designation: 'manager',
      },
    });

    // Mock getUsers API
    (usersApi.getUsers as any).mockResolvedValue({
      data: mockUsers,
    });

    // Mock updateDesignation API
    (usersApi.updateDesignation as any).mockResolvedValue({
      data: { success: true },
    });
  });

  it('renders the roles page with user list', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('User Roles')).toBeInTheDocument();
      expect(screen.getByText('Manage user designations and permissions')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  it('displays search functionality', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search users by name, email, or designation...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('filters users based on search term', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users by name, email, or designation...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });
  });

  it('allows editing designation for non-manager users', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and click the edit button for John Doe (developer)
    const editButtons = screen.getAllByText('Edit');
    const johnEditButton = editButtons[0]; // First edit button should be for John
    fireEvent.click(johnEditButton);

    await waitFor(() => {
      // Should show the select dropdown
      expect(screen.getByDisplayValue('developer')).toBeInTheDocument();
    });
  });

  it('prevents editing designation for manager users', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Jane Smith is a manager, so there should be no edit button for her
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(2); // Only for John and Bob, not Jane
  });

  it('navigates to user profile when clicking on user name', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const johnNameButton = screen.getByText('John Doe');
    fireEvent.click(johnNameButton);

    expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
  });

  it('handles API errors gracefully', async () => {
    (usersApi.getUsers as any).mockResolvedValue({
      error: 'Failed to fetch users',
    });

    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });
  });

  it('updates designation successfully', async () => {
    renderWithRouter(<Roles />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      const select = screen.getByDisplayValue('developer');
      fireEvent.change(select, { target: { value: 'designer' } });
    });

    await waitFor(() => {
      expect(usersApi.updateDesignation).toHaveBeenCalledWith('1', 'designer');
    });
  });
}); 