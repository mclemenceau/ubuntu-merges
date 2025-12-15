/**
 * E2E Tests for Ubuntu Merges Tracker
 * Tests full user workflows in a real browser
 * Supports both desktop (sidebar navigation) and mobile (header icon navigation)
 */
import { test, expect, Page } from '@playwright/test';

/**
 * Helper to detect if we're running on a mobile device/viewport
 */
function isMobile(page: Page): boolean {
  const projectName = test.info().project.name;
  return projectName.includes('mobile');
}

/**
 * Helper to navigate to a tab - handles desktop sidebar vs mobile header
 */
async function navigateToTab(page: Page, tab: 'dashboard' | 'list') {
  if (isMobile(page)) {
    // Mobile: use icon buttons in header (no text labels)
    // First button = Dashboard (LayoutDashboard icon), Second button = List icon
    const headerButtons = page.locator('.md\\:hidden .flex.space-x-1 button');
    if (tab === 'dashboard') {
      await headerButtons.first().click();
    } else {
      await headerButtons.last().click();
    }
  } else {
    // Desktop: use sidebar buttons with text labels
    const buttonName = tab === 'dashboard' ? /Overview/i : /Package List/i;
    await page.getByRole('button', { name: buttonName }).click();
  }
}

/**
 * Helper to wait for app to load data
 */
async function waitForDataLoad(page: Page) {
  await expect(page.getByText(/Tracking/i)).toBeVisible({ timeout: 30000 });
}

test.describe('Ubuntu Merges Tracker', () => {
  
  test.describe('Initial Load', () => {
    test('displays loading state initially', async ({ page }) => {
      // Intercept ALL proxy requests to delay response
      await page.route('**/corsproxy.io/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      await page.route('**/allorigins.win/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await page.goto('/');
      
      // App shows "Fetching merge data from Ubuntu..." during loading
      await expect(page.getByText(/Fetching merge data/i)).toBeVisible({ timeout: 5000 });
    });

    test('loads and displays dashboard after data fetch', async ({ page }) => {
      await page.goto('/');
      
      await waitForDataLoad(page);
      
      // Dashboard should show stats
      await expect(page.getByText(/Total Packages/i)).toBeVisible();
      await expect(page.getByText(/Average Age/i)).toBeVisible();
    });

    test('displays branding', async ({ page }) => {
      await page.goto('/');
      
      await waitForDataLoad(page);
      
      if (isMobile(page)) {
        // Mobile: header shows "Merges Tracker"
        await expect(page.locator('.md\\:hidden').getByText('Merges Tracker')).toBeVisible();
      } else {
        // Desktop: sidebar shows "Ubuntu" branding
        await expect(page.locator('aside').getByText('Ubuntu', { exact: true })).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForDataLoad(page);
    });

    test('starts on Overview (Dashboard) by default', async ({ page }) => {
      // Dashboard content should be visible
      await expect(page.getByText(/Total Packages/i)).toBeVisible();
    });

    test('can navigate to Package List', async ({ page }) => {
      await navigateToTab(page, 'list');
      
      // Should show package list with search
      await expect(page.getByPlaceholder(/Search packages/i)).toBeVisible();
    });

    test('can navigate back to Overview', async ({ page }) => {
      // Go to Package List first
      await navigateToTab(page, 'list');
      await expect(page.getByPlaceholder(/Search packages/i)).toBeVisible();
      
      // Navigate back to Overview
      await navigateToTab(page, 'dashboard');
      
      // Dashboard should be visible again
      await expect(page.getByText(/Total Packages/i)).toBeVisible();
    });
  });

  test.describe('Package List Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForDataLoad(page);
      await navigateToTab(page, 'list');
      await expect(page.getByPlaceholder(/Search packages/i)).toBeVisible();
    });

    test('can search for packages', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search packages/i);
      
      // Type a search term
      await searchInput.fill('lib');
      
      // Results should filter - search input should have our value
      await expect(searchInput).toHaveValue('lib');
    });

    test('can filter by component', async ({ page }) => {
      // Find and interact with component filter
      const componentSelect = page.locator('select').first();
      await componentSelect.selectOption('Main');
      
      // Should filter (UI should respond)
      await expect(componentSelect).toHaveValue('Main');
    });

    test('can click on a package to see details', async ({ page }) => {
      // Wait for packages to render
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Get the first package name to verify it appears in detail panel
      const firstRow = page.locator('table tbody tr').first();
      const packageName = await firstRow.locator('td').first().textContent();
      
      // Click first package row
      await firstRow.click();
      
      // Package detail slide-over should appear with the package name as title
      await expect(page.locator('[role="dialog"] h2')).toBeVisible({ timeout: 5000 });
      if (packageName) {
        await expect(page.locator('[role="dialog"]')).toContainText(packageName.trim());
      }
    });

    test('can close package detail panel', async ({ page }) => {
      // Open a package
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      
      // Wait for slide-over to appear
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      
      // Close it by clicking the X button
      await page.locator('[role="dialog"] button').first().click();
      
      // Detail panel should disappear
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Package Detail Actions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForDataLoad(page);
      await navigateToTab(page, 'list');
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      // Wait for slide-over
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    });

    test('can open Ubuntu Changelog modal', async ({ page }) => {
      // Click on the Ubuntu version box to trigger changelog
      const ubuntuVersionBox = page.locator('[role="dialog"]').getByText(/Ubuntu/i).first();
      await ubuntuVersionBox.click();
      
      // Modal should appear - shows "Ubuntu Changes for {package}" heading
      await expect(page.getByRole('heading', { name: /Ubuntu Changes for/i })).toBeVisible({ timeout: 10000 });
    });

    test('can open Version Comparison modal', async ({ page }) => {
      // Click Compare Versions button
      const compareButton = page.locator('[role="dialog"]').getByRole('button', { name: /Compare/i });
      await compareButton.click();
      
      // Modal should show version comparison title
      await expect(page.getByText(/Version Comparison/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/');
      
      // On mobile, we see the mobile header or main content
      await expect(page.getByRole('main').getByText(/Tracking|Fetching|Merges Tracker/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto('/');
      
      await expect(page.getByText(/Tracking/i)).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Error Handling', () => {
    test('shows error state when API fails', async ({ page }) => {
      // Block all proxy requests to simulate network failure
      await page.route('**/*corsproxy*/**', route => route.abort());
      await page.route('**/*allorigins*/**', route => route.abort());
      await page.route('**/*codetabs*/**', route => route.abort());
      
      await page.goto('/');
      
      // App shows "Connection Error" heading when all fetches fail
      await expect(page.getByText(/Connection Error/i)).toBeVisible({ timeout: 60000 });
    });

    test('can retry after error', async ({ page }) => {
      // Block ALL proxy requests to force error state
      await page.route('**/*corsproxy*/**', route => route.abort());
      await page.route('**/*allorigins*/**', route => route.abort());
      await page.route('**/*codetabs*/**', route => route.abort());
      
      await page.goto('/');
      
      // Wait for error state - button says "Retry Connection"
      await expect(page.getByRole('button', { name: /Retry Connection/i })).toBeVisible({ timeout: 60000 });
      
      // Unblock routes before clicking retry
      await page.unrouteAll();
      
      // Click retry
      await page.getByRole('button', { name: /Retry Connection/i }).click();
      
      // Should eventually load (subsequent requests succeed)
      await expect(page.getByText(/Tracking/i)).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Sidebar Collapse', () => {
    // Desktop only - mobile doesn't have collapsible sidebar
    test('can toggle sidebar collapse', async ({ page }) => {
      // Skip on mobile - no sidebar to collapse
      test.skip(isMobile(page), 'Sidebar collapse is desktop-only feature');
      
      await page.goto('/');
      await waitForDataLoad(page);
      
      // Find sidebar toggle button (Menu icon in the sidebar header)
      const sidebar = page.locator('aside');
      const menuButton = sidebar.getByRole('button').first();
      
      // Initial state - sidebar should be expanded (has branding text)
      await expect(sidebar.getByText('Ubuntu', { exact: true })).toBeVisible();
      
      // Click to collapse
      await menuButton.click();
      
      // Text should be hidden in collapsed state
      await page.waitForTimeout(350); // Wait for animation
      await expect(sidebar.getByText('Ubuntu', { exact: true })).not.toBeVisible();
      
      // Click again to expand
      await menuButton.click();
      await page.waitForTimeout(350);
      await expect(sidebar.getByText('Ubuntu', { exact: true })).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('can navigate through pages', async ({ page }) => {
      await page.goto('/');
      await waitForDataLoad(page);
      await navigateToTab(page, 'list');
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Look for pagination controls (Next button or page numbers)
      const nextButton = page.getByRole('button', { name: /Next|›|»/i }).first();
      
      if (await nextButton.isVisible()) {
        // If pagination exists, we can click next
        await nextButton.click();
        // Page should still show package list
        await expect(page.getByPlaceholder(/Search packages/i)).toBeVisible();
      }
    });
  });
});

test.describe('Accessibility', () => {
  test('main content is keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Wait for data to load first
    await waitForDataLoad(page);
    
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
