import { test, expect } from '@playwright/test';

test.describe('Signup E2E', () => {
  test('User can sign up successfully and is redirected to login', async ({ page }) => {
    await page.goto('/signup');
    const uniqueId = Date.now();
    await page.fill('input#name', `Test User ${uniqueId}`);
    await page.fill('input#email', `testuser${uniqueId}@example.com`);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('Signup fails and stays on signup page for invalid input', async ({ page }) => {
    await page.goto('/signup');
    // Invalid: passwords do not match
    await page.fill('input#name', 'Fail User');
    await page.fill('input#email', `failuser${Date.now()}@example.com`);
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'differentpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Signup fails and stays on signup page for missing fields', async ({ page }) => {
    await page.goto('/signup');
    // Leave all fields empty and submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Signup fails and stays on signup page for invalid email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input#name', 'Invalid Email');
    await page.fill('input#email', 'not-an-email');
    await page.fill('input#password', 'testpassword123');
    await page.fill('input#confirmPassword', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/signup/);
  });
}); 