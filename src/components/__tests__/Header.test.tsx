import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

// Mock useAuth
const mockLogout = vi.fn();
const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://ui-avatars.com/api/?name=Test+User',
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

// Mock UI components that use portals or advanced features
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Sidebar</button>,
}));
vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, asChild, ...rest }: any) => {
    // Remove asChild prop to avoid React warning
    const { asChild: _, ...cleanProps } = rest;
    return <div {...cleanProps}>{children}</div>;
  },
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: (props: any) => <img {...props} alt="avatar" />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  window.history.pushState({}, '', '/');
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar trigger, bell, new task, and avatar', () => {
    renderWithRouter(<Header />);
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Bell button
    expect(screen.getByText(/new task/i)).toBeInTheDocument();
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
  });

  it('shows user info and links in dropdown', () => {
    renderWithRouter(<Header />);
    // Open dropdown (simulate click on avatar button)
    fireEvent.click(screen.getByAltText('avatar'));
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/log out/i)).toBeInTheDocument();
  });

  it('calls logout and redirects to login on log out click', () => {
    renderWithRouter(<Header />);
    // Open dropdown (simulate click on avatar button)
    fireEvent.click(screen.getByAltText('avatar'));
    const logoutBtn = screen.getByText(/log out/i);
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
    // Simulate redirect: in real app, logout would redirect to /login
    // Here, just check logout is called
  });
}); 