"use strict";

// Links and complete articles remain usable if JavaScript is unavailable.
const navigationLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const pages = Array.from(document.querySelectorAll("[data-page]"));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function positionTabIndicator() {
  const selected = document.querySelector('.navbar-link.active');
  if (!selected) return;
  const list = selected.closest('.navbar-list');
  list.style.setProperty('--tab-left', selected.offsetLeft + 'px');
  list.style.setProperty('--tab-width', selected.offsetWidth + 'px');
  list.classList.add('has-tab-indicator');
}

function showPage(scrollToPanel = false) {
  const requested = location.hash.slice(1);
  const activePage = pages.find(page => page.id === requested) || pages[0];
  const previousPage = pages.find(page => page.classList.contains('active'));
  pages.forEach(page => {
    page.hidden = page !== activePage;
    page.classList.toggle("active", page === activePage);
  });
  navigationLinks.forEach(link => {
    const selected = link.dataset.target === activePage.id;
    link.classList.toggle("active", selected);
    link.setAttribute("aria-selected", String(selected));
    link.tabIndex = selected ? 0 : -1;
  });
  document.querySelector('.skip-link').href = '#' + activePage.id;
  positionTabIndicator();
  if (scrollToPanel && requested === activePage.id) activePage.scrollIntoView({ block: 'start' });
  if (previousPage !== activePage && !reducedMotion.matches) {
    activePage.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
  }
}

if (pages.length && navigationLinks.length) {
  navigationLinks.forEach(link => {
    const page = pages.find(page => page.id === link.dataset.target);
    link.id = "tab-" + page.id;
    link.setAttribute("role", "tab");
    link.setAttribute("aria-controls", page.id);
    page.setAttribute("role", "tabpanel");
    page.setAttribute("aria-labelledby", link.id);
    page.tabIndex = 0;
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (location.hash !== link.hash) {
        history.replaceState({ ...history.state, scrollY: window.scrollY }, "");
        history.pushState(null, "", link.hash);
      }
      showPage(true);
    });
  });
  document.querySelectorAll(".navbar-list").forEach(list => {
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-label", "Profile sections");
    list.querySelectorAll("li").forEach(item => item.setAttribute("role", "presentation"));
    list.addEventListener("keydown", event => {
      const tabs = Array.from(list.querySelectorAll("[data-nav-link]"));
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let next;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === " ") next = current;
      else return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    });
  });
  // Native hash navigation also fires popstate before restoring scroll position.
  window.addEventListener("popstate", event => {
    showPage();
    if (Number.isFinite(event.state?.scrollY)) {
      requestAnimationFrame(() => window.scrollTo(0, event.state.scrollY));
    }
  });
  showPage(Boolean(location.hash));
  new ResizeObserver(positionTabIndicator).observe(document.querySelector('.navbar-list'));
  document.fonts.ready.then(positionTabIndicator);
}

document.querySelectorAll('.video-thumbnail img').forEach(image => {
  image.addEventListener('error', () => { image.hidden = true; });
  if (image.complete && !image.naturalWidth) image.hidden = true;
});

const toast = document.createElement("div");
toast.className = "ui-toast";
toast.setAttribute("role", "status");
document.body.appendChild(toast);
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

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
  el.hidden = false;
};

calcTotalExperience();

// copy email buttons
const copyEmailButtons = document.querySelectorAll("[data-copy]");

const fallbackCopyText = function (value) {
  const focused = document.activeElement;
  const fallback = document.createElement("textarea");
  fallback.value = value;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.top = "0";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.focus();
  fallback.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    fallback.remove();
    focused?.focus({ preventScroll: true });
  }
};

copyEmailButtons.forEach(function (button) {
  button.hidden = false;
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
