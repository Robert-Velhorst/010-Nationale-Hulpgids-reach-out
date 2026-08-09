import { expect, test } from "playwright/test";

test("local app loads and exposes the operational workflow", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      "reachout.safe-use-onboarding:v1",
      JSON.stringify({ acknowledgedAt: new Date().toISOString() })
    );
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Nationale Hulpgids/i);
  await expect(
    page.getByText("Dashboard", { exact: true }).first()
  ).toBeVisible();
  await page.getByText("Campaigns", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/campaigns$/);
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.goto("/operations");
  } else {
    await page.getByText("Operations", { exact: true }).first().click();
  }
  await expect(page).toHaveURL(/\/operations$/);
  await expect(page.getByText(/outreach/i).first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
