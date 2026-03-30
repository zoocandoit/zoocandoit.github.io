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
