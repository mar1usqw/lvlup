document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Load shared header
  // -------------------------
  const headerMount = document.getElementById("site-header");
  if (headerMount) {
    fetch("/header.html", { cache: "no-store" })
      .then((res) => res.text())
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
    const step = Number(gallery.dataset.step) || 12;

    const section = gallery.closest("section") || gallery.parentElement;
    const button = section?.querySelector(".show-more");

    if (!folder) {
      console.warn("Missing data-folder on gallery:", gallery);
      return;
    }

    // Disable button until we know we have more
    if (button) {
      button.disabled = true;
      button.style.opacity = "0.7";
      button.textContent = "Loading...";
    }

    const res = await fetch(
      `/.netlify/functions/list-images?folder=${encodeURIComponent(folder)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error("Function call failed:", folder, await res.text());
      if (button) {
        button.disabled = true;
        button.style.display = "none";
      }
      return;
    }

    const data = await res.json();

    // support both shapes: {images:[...]} or {urls:[...]}
    const urls = Array.isArray(data.images)
      ? data.images
      : (Array.isArray(data.urls) ? data.urls : []);

    gallery.innerHTML = "";
    let shown = 0;

    function renderMore() {
      const slice = urls.slice(shown, shown + step);

      slice.forEach((url) => {
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

      shown += slice.length;

      if (button) {
        const hasMore = shown < urls.length;
        button.style.display = hasMore ? "block" : "none";
      }
    }

    // First render
    renderMore();

    // Button state
    if (button) {
      button.disabled = false;
      button.style.opacity = "1";
      button.textContent = "Show More";

      // Avoid multiple listeners if loadGallery is ever called again
      button.onclick = () => renderMore();
    }
  }

  document.querySelectorAll(".gallery").forEach((g) => {
    loadGallery(g).catch(console.error);
  });
});
