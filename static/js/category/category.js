
initImagesRation(CATEGORY);

document.querySelectorAll("[data-home-focus='search']").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.querySelector(".header-search__input");
    if (!input) return;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});
