// ---------- Theme (light / dark) ----------
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");

function getSavedTheme() {
  try { return localStorage.getItem("theme"); } catch { return null; }
}
function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "☀" : "☾";
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  try { localStorage.setItem("theme", theme); } catch {}
}
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(getSavedTheme() || (prefersDark ? "dark" : "light"));
themeBtn.addEventListener("click", () => {
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ---------- Mobile menu ----------
const menuBtn = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
nav.querySelectorAll("a").forEach(link =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ---------- Header border on scroll ----------
const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// ---------- Highlight current section in nav ----------
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      nav.querySelectorAll("a").forEach(a =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id)
      );
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach(s => sectionObserver.observe(s));

// ---------- Reveal on scroll ----------
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ---------- Project filters ----------
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tag = btn.dataset.filter;
    projects.forEach(p => {
      p.classList.toggle("hidden", tag !== "all" && p.dataset.category !== tag);
    });
  });
});

// ---------- Contact form ----------
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

function showError(input, message) {
  input.parentElement.querySelector(".error").textContent = message;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  let valid = true;

  [name, email, message].forEach(i => showError(i, ""));

  if (!name.value.trim()) { showError(name, "Enter your name."); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    showError(email, "Enter a valid email address."); valid = false;
  }
  if (message.value.trim().length < 10) {
    showError(message, "Write at least 10 characters."); valid = false;
  }
  if (!valid) { status.textContent = ""; return; }

  // Opens the visitor's email app with the message filled in.
  // To send without an email app, connect this form to Formspree or Netlify Forms.
  const subject = encodeURIComponent("Portfolio message from " + name.value.trim());
  const body = encodeURIComponent(message.value.trim() + "\n\n" + name.value.trim() + " (" + email.value.trim() + ")");
  window.location.href = "mailto:you@example.com?subject=" + subject + "&body=" + body;

  status.textContent = "Opening your email app…";
  form.reset();
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
