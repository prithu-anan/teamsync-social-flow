import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SocialFeed from '../SocialFeed';
import * as feedApi from '@/utils/api/feed-api';
import * as usersApi from '@/utils/api/users-api';
import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';

// Helper to render with AuthProvider
function renderWithAuthProvider(ui) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  avatar: '',
};

const mockPosts = [
  {
    id: '1',
    content: 'Hello world',
    author: { name: 'Alice', avatar: '' },
    timestamp: new Date().toISOString(),
    likes: 2,
    comments: [],
    type: 'post',
    reactions: [],
  },
  {
    id: '2',
    content: 'Event post',
    author: { name: 'Bob', avatar: '' },
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: [],
    type: 'event',
    eventDate: new Date().toISOString(),
    eventTitle: 'Team Meeting',
    reactions: [],
  },
  {
    id: '3',
    content: 'Appreciation post',
    author: { name: 'Carol', avatar: '' },
    timestamp: new Date().toISOString(),
    likes: 1,
    comments: [],
    type: 'appreciation',
    reactions: [],
  },
];

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => {
      if (key === 'teamsync_user') return JSON.stringify(mockUser);
      if (key === 'teamsync_jwt') return 'fake-jwt';
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
  vi.clearAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('SocialFeed', () => {
  it('renders the social feed and tabs', async () => {
    vi.spyOn(feedApi, 'getFeedPosts').mockResolvedValue({ data: mockPosts });
    vi.spyOn(feedApi, 'getFeedPostComments').mockResolvedValue({ data: [] });
    vi.spyOn(feedApi, 'getFeedPostReactions').mockResolvedValue({ data: [] });
    vi.spyOn(usersApi, 'getUserById').mockResolvedValue({ data: mockUser });
    renderWithAuthProvider(<SocialFeed />);
    expect(await screen.findByText('Team Social')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Birthdays' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Appreciation' })).toBeInTheDocument();
    await screen.findByText('Hello world');
  });

  it('shows posts in the correct tab', async () => {
    vi.spyOn(feedApi, 'getFeedPosts').mockResolvedValue({ data: mockPosts });
    vi.spyOn(feedApi, 'getFeedPostComments').mockResolvedValue({ data: [] });
    vi.spyOn(feedApi, 'getFeedPostReactions').mockResolvedValue({ data: [] });
    vi.spyOn(usersApi, 'getUserById').mockResolvedValue({ data: mockUser });
    renderWithAuthProvider(<SocialFeed />);
    await screen.findByText('Hello world');
    // Switch to Events tab
    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    await screen.findByText('Event post');
    // Switch to Appreciation tab (click the tab, not the badge)
    const appreciationTabs = screen.getAllByRole('tab', { name: 'Appreciation' });
    fireEvent.click(appreciationTabs[0]);
    await screen.findByText('Appreciation post');
  });

  it('can toggle comments visibility', async () => {
    vi.spyOn(feedApi, 'getFeedPosts').mockResolvedValue({ data: mockPosts });
    vi.spyOn(feedApi, 'getFeedPostComments').mockResolvedValue({ data: [] });
    vi.spyOn(feedApi, 'getFeedPostReactions').mockResolvedValue({ data: [] });
    vi.spyOn(usersApi, 'getUserById').mockResolvedValue({ data: mockUser });
    renderWithAuthProvider(<SocialFeed />);
    await screen.findByText('Hello world');
    const commentBtns = screen.getAllByText('Comment');
    fireEvent.click(commentBtns[0]);
    // Should show comment input (at least one textarea)
    expect(screen.getAllByPlaceholderText('Write a comment...').length).toBeGreaterThan(0);
    // Hide comments
    fireEvent.click(screen.getByText('Hide Comments'));
    // Check that the first comment button is visible again
    expect(commentBtns[0]).toBeInTheDocument();
  });

  it('can create a new post', async () => {
    vi.spyOn(feedApi, 'getFeedPosts').mockResolvedValue({ data: mockPosts });
    vi.spyOn(feedApi, 'getFeedPostComments').mockResolvedValue({ data: [] });
    vi.spyOn(feedApi, 'getFeedPostReactions').mockResolvedValue({ data: [] });
    vi.spyOn(usersApi, 'getUserById').mockResolvedValue({ data: mockUser });
    const createFeedPostMock = vi.spyOn(feedApi, 'createFeedPost').mockResolvedValue({});
    renderWithAuthProvider(<SocialFeed />);
    await screen.findByText('Hello world');
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    fireEvent.change(textarea, { target: { value: 'New post content' } });
    const postBtn = screen.getByText('Post');
    fireEvent.click(postBtn);
    await waitFor(() => expect(createFeedPostMock).toHaveBeenCalledWith({ content: 'New post content', type: 'text' }));
  });

  it('can add a reaction to a post', async () => {
    vi.spyOn(feedApi, 'getFeedPosts').mockResolvedValue({ data: mockPosts });
    vi.spyOn(feedApi, 'getFeedPostComments').mockResolvedValue({ data: [] });
    vi.spyOn(feedApi, 'getFeedPostReactions').mockResolvedValue({ data: [] });
    vi.spyOn(usersApi, 'getUserById').mockResolvedValue({ data: mockUser });
    const addReactionMock = vi.spyOn(feedApi, 'addReactionToFeedPost').mockResolvedValue({});
    renderWithAuthProvider(<SocialFeed />);
    await screen.findByText('Hello world');
    const likeBtns = screen.getAllByText('Like');
    fireEvent.click(likeBtns[0]);
    await waitFor(() => expect(addReactionMock).toHaveBeenCalled());
  });
}); 