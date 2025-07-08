// Mock scrollIntoView for JSDOM
declare global {
  interface HTMLElement {
    scrollIntoView: (options?: ScrollIntoViewOptions) => void;
  }
}
window.HTMLElement.prototype.scrollIntoView = function () {};

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FloatingChatbot from '../FloatingChatbot';

// Mock the API functions
vi.mock('../../utils/ai-api-helpers', () => ({
  send_message: vi.fn(),
  get_chat_history: vi.fn(),
  clear_chat_history: vi.fn(),
  get_context: vi.fn(),
}));

vi.mock('../../utils/api-helpers', () => ({
  getMe: vi.fn(),
}));

const renderWithRouter = async (component: React.ReactElement) => {
  let result;
  await act(async () => {
    result = render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  });
  return result;
};

describe('FloatingChatbot', () => {
  beforeEach(async () => {
    const aiApiHelpers = await import('../../utils/ai-api-helpers');
    const apiHelpers = await import('../../utils/api-helpers');

    // Mock successful user fetch
    vi.mocked(apiHelpers.getMe).mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });

    // Mock empty chat history
    vi.mocked(aiApiHelpers.get_chat_history).mockResolvedValue([]);

    // Mock successful message send
    vi.mocked(aiApiHelpers.send_message).mockResolvedValue({
      answer: 'Hello! How can I help you?',
      response_type: 'chat',
      user_id: 1,
      message_count: 1,
      error: null
    });

    // Mock successful clear history
    vi.mocked(aiApiHelpers.clear_chat_history).mockResolvedValue({
      message: 'Chat history cleared for user 1'
    });

    // Mock successful context fetch
    vi.mocked(aiApiHelpers.get_context).mockResolvedValue([
      'suhas_profile_chunks',
      'about_us',
      'code_pilot'
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders floating chat button', async () => {
    await renderWithRouter(<FloatingChatbot />);
    // The floating button should be present when chat is closed
    const chatButton = screen.getByRole('button');
    expect(chatButton).toBeInTheDocument();
    // The button should have aria-label="Toggle chat"
    expect(chatButton).toHaveAttribute('aria-label', 'Toggle chat');
  });

  it('opens chat window when button is clicked', async () => {
    await renderWithRouter(<FloatingChatbot />);
    const chatButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(chatButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });
  });

  it('shows welcome message when no chat history', async () => {
    await renderWithRouter(<FloatingChatbot />);
    const chatButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(chatButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Hello! I'm your AI assistant. How can I help you today?")).toBeInTheDocument();
    });
  });

  it('allows user to type and send messages', async () => {
    await renderWithRouter(<FloatingChatbot />);
    const chatButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(chatButton);
    });
    
    // Wait for input to appear after opening chat
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    expect(input).toHaveValue('Hi');
  });

  it('displays user name in header', async () => {
    await renderWithRouter(<FloatingChatbot />);
    const chatButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(chatButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('has clear history button', async () => {
    await renderWithRouter(<FloatingChatbot />);
    const chatButton = screen.getByRole('button');
    
    await act(async () => {
      fireEvent.click(chatButton);
    });
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeInTheDocument();
    });
  });
}); 