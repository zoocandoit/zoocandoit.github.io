'use strict';

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

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
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
      alert("Copied to clipboard.");

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

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let j = 0; j < pages.length; j++) {
      if (this.innerHTML.toLowerCase() === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }

  });
}
