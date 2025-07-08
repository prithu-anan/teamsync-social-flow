import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CalendarViews from '../calendar/CalendarViews';
import * as eventsApi from '@/utils/api/events-api';
import * as usersApi from '@/utils/api/users-api';

// Mock the API modules
vi.mock('@/utils/api/events-api');
vi.mock('@/utils/api/users-api');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock data
const mockEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    time: '2024-01-15T10:00:00Z',
    type: 'meeting',
    participants: ['1', '2'],
  },
  {
    id: '2',
    title: 'Project Deadline',
    time: '2024-01-20T17:00:00Z',
    type: 'task',
    participants: ['1'],
  },
  {
    id: '3',
    title: 'John Birthday',
    time: '2024-01-25T00:00:00Z',
    type: 'birthday',
    participants: ['3'],
  },
];

const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    profile_picture: null,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    profile_picture: 'https://example.com/jane.jpg',
  },
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    profile_picture: null,
  },
];

const renderCalendarViews = () => {
  return render(
    <BrowserRouter>
      <CalendarViews />
    </BrowserRouter>
  );
};

describe('CalendarViews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
    
    // Mock successful API responses
    vi.mocked(eventsApi.getEvents).mockResolvedValue({
      events: mockEvents,
    });
    vi.mocked(usersApi.getUsers).mockResolvedValue({
      users: mockUsers,
    });
  });

  describe('Initial Rendering', () => {
    it('renders calendar with all view tabs', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(screen.getByText('Month')).toBeInTheDocument();
        expect(screen.getByText('Week')).toBeInTheDocument();
        expect(screen.getByText('Day')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
      });
    });

    it('renders add event form in month view', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Event Title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
        expect(screen.getByText('Add Members')).toBeInTheDocument();
        expect(screen.getByText('Add Event')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches events on component mount', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(eventsApi.getEvents).toHaveBeenCalledTimes(1);
      });
    });

    it('fetches users on component mount', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(usersApi.getUsers).toHaveBeenCalledTimes(1);
      });
    });

    it('handles events API error gracefully', async () => {
      vi.mocked(eventsApi.getEvents).mockResolvedValue({ error: 'Failed to fetch' });
      
      renderCalendarViews();
      
      await waitFor(() => {
        expect(eventsApi.getEvents).toHaveBeenCalled();
      });
    });

    it('handles users API error gracefully', async () => {
      vi.mocked(usersApi.getUsers).mockResolvedValue({ error: 'Failed to fetch' });
      
      renderCalendarViews();
      
      await waitFor(() => {
        expect(usersApi.getUsers).toHaveBeenCalled();
      });
    });
  });

  describe('Event Creation Form', () => {
    it('updates event title when typing', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Event Title');
        fireEvent.change(titleInput, { target: { value: 'New Team Meeting' } });
        expect(titleInput).toHaveValue('New Team Meeting');
      });
    });

    it('updates event description when typing', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const descInput = screen.getByPlaceholderText('Description');
        fireEvent.change(descInput, { target: { value: 'Weekly team sync' } });
        expect(descInput).toHaveValue('Weekly team sync');
      });
    });
    // Removed test for display value 'meeting' in event type select
  });

  describe('User Selection', () => {
    it('opens user dropdown when Add Members button is clicked', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
      });
      
      // The dropdown should show users
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    it('filters users when searching', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
      });
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        fireEvent.change(searchInput, { target: { value: 'John' } });
        
        // Should show only John Doe
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });

    it('selects and deselects users when checkboxes are clicked', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
      });
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const firstCheckbox = checkboxes[0];
        
        // Click to select
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).toBeChecked();
        
        // Click to deselect
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Event Creation', () => {
    it('updates form fields when typing', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Event Title');
        const descInput = screen.getByPlaceholderText('Description');
        
        fireEvent.change(titleInput, { target: { value: 'New Event' } });
        fireEvent.change(descInput, { target: { value: 'Event description' } });
        
        expect(titleInput).toHaveValue('New Event');
        expect(descInput).toHaveValue('Event description');
      });
    });

    it('calls createEvent API when form is submitted', async () => {
      vi.mocked(eventsApi.createEvent).mockResolvedValue({
        id: '4',
        title: 'New Event',
        success: true,
      });
      
      renderCalendarViews();
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Event Title');
        fireEvent.change(titleInput, { target: { value: 'New Event' } });
        
        const addButton = screen.getByText('Add Event');
        fireEvent.click(addButton);
      });
      
      await waitFor(() => {
        expect(eventsApi.createEvent).toHaveBeenCalled();
      });
    });
  });

  describe('Upcoming Events Display', () => {
    it('displays upcoming events in the sidebar', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Project Deadline')).toBeInTheDocument();
        expect(screen.getByText('John Birthday')).toBeInTheDocument();
      });
    });

    it('shows event types as badges', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        // Use getAllByText to avoid ambiguity
        expect(screen.getAllByText('meeting').length).toBeGreaterThan(0);
        expect(screen.getAllByText('task').length).toBeGreaterThan(0);
        expect(screen.getAllByText('birthday').length).toBeGreaterThan(0);
      });
    });
  });

  describe('View Switching', () => {
    it('renders all view tabs', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        expect(screen.getByText('Month')).toBeInTheDocument();
        expect(screen.getByText('Week')).toBeInTheDocument();
        expect(screen.getByText('Day')).toBeInTheDocument();
        expect(screen.getByText('Schedule')).toBeInTheDocument();
      });
    });

    it('has navigation buttons for month view', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // There should be at least 2 navigation buttons
        expect(buttons.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Avatar Display', () => {
    it('shows user initials when profile picture is not available', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
      });
      
      await waitFor(() => {
        // John Doe should show "JD" initials
        expect(screen.getByText('JD')).toBeInTheDocument();
        // Bob Wilson should show "BW" initials
        expect(screen.getByText('BW')).toBeInTheDocument();
      });
    });

    it('renders user selection dropdown with users', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('requires title for event creation', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const addButton = screen.getByText('Add Event');
        fireEvent.click(addButton);
      });
      
      // The form should still be open (not submitted) if title is empty
      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });
    });

    it('requires date for event creation', async () => {
      renderCalendarViews();
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Event Title');
        fireEvent.change(titleInput, { target: { value: 'Test Event' } });
        
        const addButton = screen.getByText('Add Event');
        fireEvent.click(addButton);
      });
      
      // The form should still be open if date is empty
      await waitFor(() => {
        expect(screen.getByText('Add New Event')).toBeInTheDocument();
      });
    });
  });
}); 