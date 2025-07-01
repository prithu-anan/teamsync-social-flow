import { Page, expect } from '@playwright/test';

export class AuthUtils {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async mockSuccessfulLogin() {
    await this.page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        })
      });
    });
  }

  async mockFailedLogin(errorMessage: string = 'Invalid credentials') {
    await this.page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: errorMessage
        })
      });
    });
  }

  async mockNetworkError() {
    await this.page.route('**/auth/login', async route => {
      await route.abort('failed');
    });
  }

  async expectToBeLoggedIn() {
    await expect(this.page).toHaveURL('/');
    await expect(this.page.getByText(/dashboard/i)).toBeVisible();
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL('/login');
    await expect(this.page.getByRole('heading', { name: /login/i })).toBeVisible();
  }

  async logout() {
    // Navigate to settings or user menu and click logout
    await this.page.getByRole('button', { name: /logout/i }).click();
    await this.expectToBeOnLoginPage();
  }
} 