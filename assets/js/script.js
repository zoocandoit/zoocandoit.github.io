'use strict';

// Shared UI layer: both profiles use the same interaction details while
// keeping their own visual theme through CSS custom properties.
document.documentElement.classList.add("js");

const uiProgress = document.createElement("div");
uiProgress.className = "scroll-progress";
uiProgress.setAttribute("aria-hidden", "true");
document.body.prepend(uiProgress);

const updateScrollProgress = function () {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  document.documentElement.style.setProperty("--scroll-progress", Math.min(1, Math.max(0, progress)));
};

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

const finePointer = window.matchMedia("(pointer: fine)");
if (finePointer.matches) {
  window.addEventListener("pointermove", function (event) {
    document.documentElement.style.setProperty("--pointer-x", event.clientX + "px");
    document.documentElement.style.setProperty("--pointer-y", event.clientY + "px");
  }, { passive: true });
}

const toast = document.createElement("div");
toast.className = "ui-toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.appendChild(toast);

let toastTimer;
const showToast = function (message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 1800);
};

// Calculate total experience from data-start / data-end attributes
const calcTotalExperience = function () {
  const el = document.getElementById("total-experience");
  if (!el) return;

  const items = document.querySelectorAll(".timeline-item[data-start]");
  let totalMonths = 0;

  items.forEach(function (item) {
    const startStr = item.dataset.start;
    const endStr = item.dataset.end;

    const parseYM = function (str) {
      const parts = str.split(".");
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
    };

    const start = parseYM(startStr);
    const end = endStr.toLowerCase() === "current"
      ? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
      : parseYM(endStr);

    totalMonths += (end.year - start.year) * 12 + (end.month - start.month);
  });

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let text = "Total: ";
  if (years > 0) text += years + "Y ";
  if (months > 0) text += months + "M";
  if (years === 0 && months === 0) text += "0M";

  el.textContent = text.trim();
};

calcTotalExperience();

// page transition from/to the profile hub
if (sessionStorage.getItem("profileTransition") === "in") {
  sessionStorage.removeItem("profileTransition");
  document.body.classList.add("page-transition-in");
  window.setTimeout(function () {
    document.body.classList.remove("page-transition-in");
  }, 650);
}

const profileHomeLinks = document.querySelectorAll(".floating-home-link");

profileHomeLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    const rect = link.getBoundingClientRect();
    document.documentElement.style.setProperty("--transition-x", Math.round(rect.left + rect.width / 2) + "px");
    document.documentElement.style.setProperty("--transition-y", Math.round(rect.top + rect.height / 2) + "px");
    sessionStorage.setItem("profileTransition", "home");

    link.classList.add("is-transitioning");
    document.body.classList.add("page-transition-out");

    window.setTimeout(function () {
      window.location.href = link.href;
    }, 430);
  });
});

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
if (sidebarBtn) {
  sidebarBtn.setAttribute("aria-expanded", "false");
  sidebarBtn.setAttribute("aria-controls", "profile-contacts");
  const sidebarMore = sidebar.querySelector(".sidebar-info_more");
  if (sidebarMore) sidebarMore.id = "profile-contacts";

  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
    sidebarBtn.setAttribute("aria-expanded", sidebar.classList.contains("active") ? "true" : "false");
  });
}

// copy email buttons
const copyEmailButtons = document.querySelectorAll("[data-copy]");

const fallbackCopyText = function (value) {
  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.top = "0";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.focus();
  fallback.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(fallback);
  return copied;
};

copyEmailButtons.forEach(function (button) {
  button.addEventListener("click", async function (event) {
    event.preventDefault();
    event.stopPropagation();

    const value = button.dataset.copy;
    if (!value) return;

    let copied = false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      } else {
        copied = fallbackCopyText(value);
      }
    } catch (error) {
      copied = fallbackCopyText(value);
    }

    if (copied) {
      button.classList.add("is-copied");
      button.setAttribute("aria-label", "Email copied");
      button.title = "Copied";
      showToast("Email copied to clipboard");

      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.setAttribute("aria-label", "Copy email");
        button.title = "";
      }, 1400);
    } else {
      window.prompt("Copy this email address.", value);
    }
  });
});

// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach(function (link, index) {
  const page = pages[index];
  if (!page) return;

  const tabId = "profile-tab-" + page.dataset.page;
  const panelId = "profile-panel-" + page.dataset.page;
  link.id = tabId;
  link.setAttribute("role", "tab");
  link.setAttribute("aria-controls", panelId);
  link.setAttribute("aria-selected", link.classList.contains("active") ? "true" : "false");
  if (link.classList.contains("active")) link.setAttribute("aria-current", "page");
  page.id = panelId;
  page.setAttribute("role", "tabpanel");
  page.setAttribute("aria-labelledby", tabId);
});

document.querySelectorAll(".navbar-list").forEach(function (list) {
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Profile sections");
});

const preparePageMotion = function (page) {
  if (!page) return;

  const items = page.querySelectorAll(
    ".about-text > p, .certificates-item, .awards-item, .timeline-item, .project-item"
  );
  items.forEach(function (item, index) {
    item.classList.add("motion-item");
    item.style.setProperty("--motion-order", Math.min(index, 10));
  });
};

pages.forEach(preparePageMotion);

document.querySelectorAll(".timeline-item.clickable[role='link']").forEach((item) => {
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    item.click();
  });
});

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.textContent.trim().toLowerCase();

    for (let j = 0; j < pages.length; j++) {
      if (targetPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        pages[j].removeAttribute("hidden");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        pages[j].setAttribute("hidden", "");
      }
    }

    for (let j = 0; j < navigationLinks.length; j++) {
      navigationLinks[j].classList.toggle("active", navigationLinks[j] === this);
      navigationLinks[j].setAttribute("aria-selected", navigationLinks[j] === this ? "true" : "false");
      navigationLinks[j].tabIndex = navigationLinks[j] === this ? 0 : -1;
      if (navigationLinks[j] === this) {
        navigationLinks[j].setAttribute("aria-current", "page");
      } else {
        navigationLinks[j].removeAttribute("aria-current");
      }
    }

    window.history.replaceState(null, "", "#" + targetPage);
    updateScrollProgress();
  });
}

pages.forEach(function (page) {
  if (!page.classList.contains("active")) page.setAttribute("hidden", "");
});

navigationLinks.forEach(function (link) {
  link.tabIndex = link.classList.contains("active") ? 0 : -1;
});

const requestedPage = window.location.hash.slice(1).toLowerCase();
if (requestedPage) {
  const requestedLink = Array.from(navigationLinks).find(function (link) {
    return link.textContent.trim().toLowerCase() === requestedPage;
  });
  if (requestedLink) requestedLink.click();
}

document.querySelectorAll(".navbar-list").forEach(function (list) {
  list.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const tabs = Array.from(list.querySelectorAll("[data-nav-link]"));
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    tabs[(current + direction + tabs.length) % tabs.length].click();
    tabs[(current + direction + tabs.length) % tabs.length].focus();
  });
});

// Keep the performance archive compact: opening one item closes the others.
document.querySelectorAll(".video-link-card").forEach(function (card) {
  card.addEventListener("toggle", function () {
    if (!card.open) return;

    document.querySelectorAll(".video-link-card[open]").forEach(function (openCard) {
      if (openCard !== card) openCard.removeAttribute("open");
    });
  });
});

// Career details stay in context and only one expanded entry is kept open.
document.querySelectorAll(".career-accordion > details").forEach(function (career) {
  career.addEventListener("toggle", function () {
    if (career.open) {
      document.querySelectorAll(".career-accordion > details[open]").forEach(function (openCareer) {
        if (openCareer !== career) openCareer.removeAttribute("open");
      });
    }

    window.requestAnimationFrame(updateScrollProgress);
  });
});
