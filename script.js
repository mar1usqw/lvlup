document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Load shared header (robust)
  // -------------------------
  const headerMount = document.getElementById("site-header");
  if (headerMount) {
    const headerUrl = new URL("header.html", document.baseURI).toString();

    fetch(headerUrl, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Header fetch failed: ${res.status} (${headerUrl})`);
        return res.text();
      })
      .then((html) => (headerMount.innerHTML = html))
      .catch((err) => console.warn("Header load failed:", err));
  }

  // --------------------------
  // LIGHTBOX
  // --------------------------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.querySelector(".close");
  const nextBtn = document.querySelector(".next");
  const prevBtn = document.querySelector(".prev");

  let currentImages = [];
  let currentIndex = 0;

  function openLightbox() {
    if (!lightbox || !lightboxImg || !currentImages.length) return;
    lightbox.style.display = "flex";
    lightbox.setAttribute("aria-hidden", "false");
    lightboxImg.src = currentImages[currentIndex].src;
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = "none";
    lightbox.setAttribute("aria-hidden", "true");
  }

  function nextImage() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    openLightbox();
  }

  function prevImage() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    openLightbox();
  }

  closeBtn?.addEventListener("click", closeLightbox);
  nextBtn?.addEventListener("click", nextImage);
  prevBtn?.addEventListener("click", prevImage);

  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.style.display !== "flex") return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });

  // --------------------------
  // LOAD GALLERIES (Cloudinary folders)
  // --------------------------
  async function loadGallery(gallery) {
    const folder = gallery.dataset.folder;
    const step = Number(gallery.dataset.step) || 6;

    const section = gallery.closest("section") || gallery.parentElement;
    const button = section?.querySelector(".show-more");

    if (!folder) {
      console.warn("Missing data-folder on gallery:", gallery);
      return;
    }

    if (button) {
      button.disabled = true;
      button.style.opacity = "0.7";
      button.textContent = "Loading...";
      button.style.display = "block"; // make sure it’s visible while loading
    }

    const res = await fetch(
      `/.netlify/functions/list-images?folder=${encodeURIComponent(folder)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Function call failed:", folder, errText);

      if (button) {
        button.disabled = false;
        button.style.opacity = "1";
        button.textContent = "Retry";
        button.onclick = () => loadGallery(gallery);
      }
      return;
    }

    const data = await res.json();

    // support both shapes: {images:[...]} or {urls:[...]}
    const urls = Array.isArray(data.images)
      ? data.images
      : (Array.isArray(data.urls) ? data.urls : []);

    // If no images, clear gallery and hide button
    if (!urls.length) {
      gallery.innerHTML = "";
      if (button) button.style.display = "none";
      return;
    }

    let shown = 0;

    function renderRange(count) {
      gallery.innerHTML = "";
      urls.slice(0, count).forEach((url) => {
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = url;
        img.alt = "Project image";

        img.addEventListener("click", () => {
          currentImages = Array.from(gallery.querySelectorAll("img"));
          currentIndex = currentImages.indexOf(img);
          openLightbox();
        });

        gallery.appendChild(img);
      });
    }

    function updateButton() {
      if (!button) return;

      if (urls.length <= step) {
        button.style.display = "none";
        return;
      }

      button.style.display = "block";
      button.disabled = false;
      button.style.opacity = "1";
      button.textContent = shown >= urls.length ? "Show Less" : "Show More";
    }

    function showMore() {
      shown = Math.min(shown + step, urls.length);
      renderRange(shown);
      updateButton();
    }

    function showLess() {
      shown = Math.min(step, urls.length);
      renderRange(shown);
      updateButton();
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Initial render
    shown = Math.min(step, urls.length);
    renderRange(shown);
    updateButton();

    if (button) {
      button.onclick = () => {
        if (shown >= urls.length) showLess();
        else showMore();
      };
    }
  }

  // ✅ IMPORTANT: actually call loadGallery for each gallery
  document.querySelectorAll(".gallery").forEach((g) => {
    loadGallery(g).catch(console.error);
  });
});
