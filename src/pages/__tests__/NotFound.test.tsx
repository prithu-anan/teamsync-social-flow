import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

const renderNotFound = (initialPath = '/nonexistent') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NotFound />
    </MemoryRouter>
  );
};

describe('NotFound', () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
  });

  describe('Rendering', () => {
    it('renders 404 error page with correct content', () => {
      renderNotFound();
      
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
      expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
    });

    it('renders TeamSync logo', () => {
      renderNotFound();
      
      // Check for the logo component by looking for the SVG or icon
      const logo = document.querySelector('svg') || document.querySelector('[class*="h-16 w-16"]');
      expect(logo).toBeInTheDocument();
    });

    it('renders return to dashboard button', () => {
      renderNotFound();
      
      const returnButton = screen.getByRole('link', { name: /return to dashboard/i });
      expect(returnButton).toBeInTheDocument();
      expect(returnButton).toHaveAttribute('href', '/');
    });

    it('applies correct styling classes', () => {
      renderNotFound();
      
      // Check for gradient background on the main container
      const mainContainer = screen.getByText('404').closest('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gradient-to-br', 'from-teamsync-800', 'to-teamsync-700');
      
      // Check for centered layout
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center');
    });
  });

  describe('Error Logging', () => {
    it('logs error to console when component mounts', () => {
      renderNotFound('/test-route');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/test-route'
      );
    });

    it('logs different paths correctly', () => {
      renderNotFound('/another-missing-page');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/another-missing-page'
      );
    });

    it('logs root path when accessing root', () => {
      renderNotFound('/');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/'
      );
    });
  });

  describe('Navigation', () => {
    it('has correct link to dashboard', () => {
      renderNotFound();
      
      const dashboardLink = screen.getByRole('link', { name: /return to dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/');
    });

    it('button is properly styled as large size', () => {
      renderNotFound();
      
      const button = screen.getByRole('link', { name: /return to dashboard/i });
      expect(button).toHaveClass('h-11', 'px-8');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderNotFound();
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('404');
    });

    it('has descriptive text for screen readers', () => {
      renderNotFound();
      
      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
      expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
    });

    it('has accessible button with proper role', () => {
      renderNotFound();
      
      const button = screen.getByRole('link', { name: /return to dashboard/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('has responsive design with max width', () => {
      renderNotFound();
      
      const contentContainer = screen.getByText('404').closest('.w-full.max-w-md');
      expect(contentContainer).toBeInTheDocument();
    });

    it('has proper spacing and typography', () => {
      renderNotFound();
      
      // Check for proper text sizing
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-4xl', 'font-bold');
      
      const subtitle = screen.getByText('Oops! Page not found');
      expect(subtitle).toHaveClass('text-xl');
    });

    it('uses correct color scheme', () => {
      renderNotFound();
      
      // Check for white text on dark background
      const heading = screen.getByText('404');
      expect(heading).toHaveClass('text-white');
      
      const subtitle = screen.getByText('Oops! Page not found');
      expect(subtitle).toHaveClass('text-teamsync-100');
    });
  });

  describe('Component Structure', () => {
    it('renders all required elements in correct order', () => {
      renderNotFound();
      
      const elements = [
        'TeamSyncLogo',
        '404',
        'Oops! Page not found',
        "The page you're looking for doesn't exist or has been moved.",
        'Return to Dashboard'
      ];
      
      elements.forEach(element => {
        if (element === 'TeamSyncLogo') {
          const logo = document.querySelector('svg') || document.querySelector('[class*="h-16 w-16"]');
          expect(logo).toBeInTheDocument();
        } else {
          expect(screen.getByText(element)).toBeInTheDocument();
        }
      });
    });

    it('has proper container structure', () => {
      renderNotFound();
      
      // Should have main container with gradient background
      const mainContainer = screen.getByText('404').closest('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      
      // Should have content wrapper
      const contentWrapper = screen.getByText('404').closest('.w-full.max-w-md');
      expect(contentWrapper).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles different route paths gracefully', () => {
      const testPaths = [
        '/nonexistent',
        '/admin/settings',
        '/projects/123/details',
        '/api/v1/users',
        '/deeply/nested/route/that/does/not/exist'
      ];
      
      testPaths.forEach(path => {
        const { unmount } = renderNotFound(path);
        
        expect(mockConsoleError).toHaveBeenCalledWith(
          '404 Error: User attempted to access non-existent route:',
          path
        );
        
        unmount();
        mockConsoleError.mockClear();
      });
    });
  });
}); 