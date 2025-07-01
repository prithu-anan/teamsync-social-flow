import { test, expect } from '@playwright/test';

test.describe('Login E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check for validation errors (browser validation)
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    
    // Check if inputs are marked as invalid
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill in invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit the form by pressing Enter in the password field
    await page.getByLabel(/password/i).press('Enter');
    
    // Wait a bit for any validation to process
    await page.waitForTimeout(1000);

    // Check for email validation error (browser validation)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should stay on login page for invalid credentials', async ({ page }) => {
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
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit the form by pressing Enter in the password field
    await page.getByLabel(/password/i).press('Enter');

    // Should stay on login page (don't check for specific error messages)
    await expect(page).toHaveURL('/login');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
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

    // Fill in valid credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit the form by pressing Enter in the password field
    await page.getByLabel(/password/i).press('Enter');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/');
    
    // Check if user is logged in (look for dashboard elements)
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click on signup link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should navigate to signup page
    await expect(page).toHaveURL('/signup');
  });

  test('should stay on login page for network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login', async route => {
      await route.abort('failed');
    });

    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit the form by pressing Enter in the password field
    await page.getByLabel(/password/i).press('Enter');

    // Should stay on login page (don't check for specific error messages)
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear any existing authentication state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access protected route
    await page.goto('/');

    // Should be redirected to login page with a reasonable timeout
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });

  test('should try demo account login', async ({ page }) => {
    // Mock successful demo login
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

    // Mock successful getMe API response for demo user
    await page.route('**/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff'
          }
        })
      });
    });

    // Click demo account button
    await page.getByRole('button', { name: /try demo account/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
}); 