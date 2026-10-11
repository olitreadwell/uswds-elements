import { beforeEach, describe, expect, it } from "vitest";

import "./index.js";

function getInsideBanner(): ShadowRoot {
  const banner = document.body.querySelector("usa-banner");
  if (!banner) {
    throw new Error("USA Banner element not found");
  }
  if (!banner.shadowRoot) {
    throw new Error("USA Banner shadowRoot not found");
  }
  return banner.shadowRoot;
}

function getBannerButton(): HTMLButtonElement {
  const button = getInsideBanner().querySelector(".usa-accordion__button");
  if (!button) {
    throw new Error("Banner button not found");
  }
  return button as HTMLButtonElement;
}

function getLockIcon(): HTMLElement {
  const lock = getInsideBanner().querySelector(".icon-lock");
  if (!lock) {
    throw new Error("Banner lock icon not found");
  }
  return lock as HTMLElement;
}

describe("USA Banner component", async () => {
  beforeEach(async () => {
    document.body.innerHTML = "<usa-banner></usa-banner>";
  });

  it("renders correctly", () => {
    expect(getInsideBanner().textContent).toContain(
      "An official website of the United States government",
    );
  });

  it("uses gov TLD by default", () => {
    expect(getInsideBanner().querySelector(".content")?.textContent).toContain(
      ".gov",
    );
  });

  it("initializes closed", () => {
    expect(getBannerButton().ariaExpanded).toBe("false");
  });

  it("expands on button click", async () => {
    const bannerButton = getBannerButton();

    await bannerButton.click();

    expect(bannerButton.ariaExpanded).toBe("true");
  });

  it("labels the lock icon as a locked padlock", () => {
    expect(getLockIcon().getAttribute("aria-label")).toBe("Locked padlock");
  });
});

describe("Spanish variant", async () => {
  beforeEach(async () => {
    document.body.innerHTML = `<usa-banner lang="es"></usa-banner>`;
  });

  it("renders correctly", () => {
    expect(getInsideBanner().textContent).toContain(
      "Un sitio oficial del Gobierno de Estados Unidos",
    );
  });

  it("localizes the lock icon aria-label", () => {
    expect(getLockIcon().getAttribute("aria-label")).toBe("Candado cerrado");
  });
});

describe("MIL variant", async () => {
  beforeEach(async () => {
    document.body.innerHTML = `<usa-banner tld="mil"></usa-banner>`;
  });

  it("renders correctly", () => {
    expect(getInsideBanner().querySelector(".content")?.textContent).toContain(
      ".mil",
    );
  });
});
