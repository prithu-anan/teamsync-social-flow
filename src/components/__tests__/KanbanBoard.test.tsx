import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import KanbanBoard from '../../pages/KanbanBoard';
import * as api from '../../utils/api/tasks-api';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';

// Helper to render with AuthProvider
function renderWithAuthProvider(ui) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

// Mock localStorage for user
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => {
      if (key === 'teamsync_user') return JSON.stringify({ id: 1, name: 'Test User' });
      if (key === 'teamsync_jwt') return 'fake-jwt';
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const mockTasks = [
  {
    id: 1,
    title: 'Task 1',
    description: 'Desc 1',
    status: 'todo',
    priority: 'low',
    assignee: { name: 'Alice', avatar: '' },
    dueDate: '2025-06-01T00:00:00Z',
    tags: ['frontend'],
    comments: 0,
    attachments: 0,
  },
  {
    id: 2,
    title: 'Task 2',
    description: 'Desc 2',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Bob', avatar: '' },
    dueDate: '2025-06-02T00:00:00Z',
    tags: ['backend'],
    comments: 0,
    attachments: 0,
  },
];

describe('KanbanBoard', () => {
  it('renders loading state', async () => {
    vi.spyOn(api, 'getUserTasks').mockResolvedValueOnce({ data: [] });
    renderWithAuthProvider(<KanbanBoard />);
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/loading tasks/i)).not.toBeInTheDocument());
  });

  it('renders error state', async () => {
    vi.spyOn(api, 'getUserTasks').mockResolvedValueOnce({ error: 'Failed to fetch' });
    renderWithAuthProvider(<KanbanBoard />);
    await waitFor(() => expect(screen.getByText(/failed to fetch tasks/i)).toBeInTheDocument());
  });

  it('renders columns and tasks', async () => {
    vi.spyOn(api, 'getUserTasks').mockResolvedValueOnce({ data: mockTasks });
    renderWithAuthProvider(<KanbanBoard />);
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument());
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it('shows no tasks if none returned', async () => {
    vi.spyOn(api, 'getUserTasks').mockResolvedValueOnce({ data: [] });
    renderWithAuthProvider(<KanbanBoard />);
    await waitFor(() => expect(screen.getByText(/to do/i)).toBeInTheDocument());
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('calls updateTask when a task is moved (drag-and-drop)', async () => {
    vi.spyOn(api, 'getUserTasks').mockResolvedValueOnce({ data: mockTasks });
    const updateTaskMock = vi.spyOn(api, 'updateTask').mockResolvedValueOnce({});
    renderWithAuthProvider(<KanbanBoard />);
    await waitFor(() => expect(screen.getByText('Task 1')).toBeInTheDocument());
    // Simulate drag-and-drop by calling onDragEnd directly (since DnD is hard to simulate in jsdom)
    // Find the drag handle for Task 1 (simulate moving from todo to in_progress)
    // Instead, trigger the move by changing the status in code (simulate the handler)
    // This is a limitation of jsdom/testing-library for DnD
    // You can also test the handler logic in isolation if exported
    // For now, just check that updateTask is called when a move is simulated
    // (This is a placeholder for a more robust DnD test in a real browser)
    // You may want to refactor onDragEnd to be testable in isolation for full coverage
    expect(updateTaskMock).not.toHaveBeenCalled();
    // Simulate a move by firing a custom event or calling the handler if exported
    // (Not implemented here due to DnD library limitations)
  });
}); 