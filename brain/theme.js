// Runs before first paint: apply the saved theme (if any) to <html data-theme>.
(function () {
  try {
    var t = localStorage.getItem("brain.theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    /* storage blocked: follow the system theme */
  }
})();
