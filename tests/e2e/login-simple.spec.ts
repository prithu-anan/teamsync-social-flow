import { test, expect } from '@playwright/test';

test.describe('Login E2E Tests - Simplified', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Simplified successful login flow', async ({ page }) => {
    // Mock successful login API response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'mock-jwt-token'
          }
        })
      });
    });

    // Mock successful getMe API response
    await page.route('**/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            avatar: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff'
          }
        })
      });
    });

    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form by pressing Enter in password field
    await page.getByLabel(/password/i).press('Enter');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('Simplified failed login flow', async ({ page }) => {
    // Mock failed API response
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      });
    });

    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form by pressing Enter in password field
    await page.getByLabel(/password/i).press('Enter');

    // Should stay on login page (don't check for specific error messages)
    await expect(page).toHaveURL('/login');
  });

  test('Simplified network error handling', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed');
    });

    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form by pressing Enter in password field
    await page.getByLabel(/password/i).press('Enter');

    // Should stay on login page (don't check for specific error messages)
    await expect(page).toHaveURL('/login');
  });
}); 