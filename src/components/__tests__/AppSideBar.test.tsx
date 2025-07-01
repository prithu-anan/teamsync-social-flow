/// <reference types="vitest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSidebar from '../AppSidebar';
import * as router from 'react-router-dom';
import * as sidebarUI from '@/components/ui/sidebar';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('react-router-dom', () => ({
  NavLink: ({ to, className, children }: any) => {
    // Handle className as a function (NavLink behavior)
    const resolvedClassName = typeof className === 'function' 
      ? className({ isActive: to === '/social' }) // Mock active state for /social
      : className;
    
    return <a href={to} className={resolvedClassName || ''}>{children}</a>;
  },
  useLocation: vi.fn(),
}));
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, className }: any) => <div data-testid="sidebar" className={className}>{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: ({ className }: any) => <button data-testid="toggle" className={className} />,
  useSidebar: vi.fn(),
}));

const useLocationMock = router.useLocation as unknown as ReturnType<typeof vi.fn>;
const useSidebarMock = sidebarUI.useSidebar as unknown as ReturnType<typeof vi.fn>;

describe('<AppSidebar />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders full menu when expanded', () => {
    useLocationMock.mockReturnValue({ pathname: '/projects' });
    useSidebarMock.mockReturnValue({ state: 'expanded' });

    render(<AppSidebar />);

    // Labels should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Projects')).toBeInTheDocument();

    // Sidebar container has full width class
    expect(screen.getByTestId('sidebar').className).toContain('w-64');
  });

  it('collapses to icons only when sidebar.state="collapsed"', () => {
    useLocationMock.mockReturnValue({ pathname: '/kanban' });
    useSidebarMock.mockReturnValue({ state: 'collapsed' });

    render(<AppSidebar />);

    // Text labels should not be rendered
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('My Projects')).toBeNull();

    // Toggle button should still be present
    expect(screen.getByTestId('toggle')).toBeInTheDocument();

    // Sidebar container has collapsed width class
    expect(screen.getByTestId('sidebar').className).toContain('w-20');
  });

  it('highlights the active link based on current path', () => {
    useLocationMock.mockReturnValue({ pathname: '/social' });
    useSidebarMock.mockReturnValue({ state: 'expanded' });

    render(<AppSidebar />);

    const activeLink = screen.getByRole('link', { name: /Social Feed/i });
    expect(activeLink.className).toMatch(/bg-sidebar-accent/);
  });
});
