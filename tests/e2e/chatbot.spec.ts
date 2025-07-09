import { test, expect } from '@playwright/test';
// If you have a login utility, import it:
// import { login } from './utils/auth';

const USER_EMAIL = 'sadat@gmail.com';
const USER_PASSWORD = '123'; // Replace with a valid password

// Helper selectors
const chatbotButton = '[aria-label="Toggle chat"]';
const chatbotInput = 'input[placeholder="Type your message..."]';
const sendButton = 'button:has(svg[data-icon="send"])';
const userMessageSelector = '.bg-blue-600.text-white';
const aiMessageSelector = '.bg-gray-100.text-gray-900, .chatbot-prose';
const contextDropdown = 'select';

test('User can send a message to the chatbot and receive a response containing their name', async ({ page }) => {
  // 1. Log in (replace with your login flow if needed)
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', USER_EMAIL);
  await page.fill('input[type="password"]', USER_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for the chatbot button to appear (indicates login success)
  await expect(page.locator(chatbotButton)).toBeVisible();

  // 2. Open the chatbot
  await page.click(chatbotButton);
  await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();

  // 3. Optionally select a context if dropdown is present
  if (await page.locator(contextDropdown).isVisible()) {
    // Robustly select any option whose label includes 'no context' (case-insensitive)
    const options = await page.locator(contextDropdown + ' option').allTextContents();
    const noContextOption = options.find(opt => opt.toLowerCase().includes('no context'));
    if (noContextOption) {
      await page.selectOption(contextDropdown, { label: noContextOption });
    }
  }

  // 4. Type and send a specific message
  const testMessage = 'who am i';
  await page.fill(chatbotInput, testMessage);
  // Click the send button specifically within the chatbot input area
  await page.click('div.p-4.border-t.bg-white button:has(svg)'); // Click send button in input area

  // 5. Wait for an AI message containing 'sadat' (case-insensitive) - multiple occurrences are allowed
  await expect(page.locator('.chatbot-prose')).toContainText(/sadat/i, { timeout: 15000 });
}); 