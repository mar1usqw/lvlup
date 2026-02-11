document.addEventListener("DOMContentLoaded", () => {
  // -------------------------
  // Load shared header
  // -------------------------
  const headerMount = document.getElementById("site-header");
  if (headerMount) {
    fetch("header.html")
      .then((res) => res.text())
      .then((html) => (headerMount.innerHTML = html))
      .catch(() => console.warn("Header not found"));
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
    if (!lightbox || !lightboxImg || currentImages.length === 0) return;
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
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    openLightbox();
  }

  function prevImage() {
    if (currentImages.length === 0) return;
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
  // GALLERIES: Cloudinary list + Show more
  // --------------------------
  async function loadGallery(gallery) {
    const folder = gallery.dataset.folder;          // e.g. "projects/bathroom"
    const step = Number(gallery.dataset.step) || 12;

    // Find "Show more" button in the same section/container
    const container = gallery.closest("section") || gallery.parentElement;
    const button = container?.querySelector(".load-more");

    if (!folder) {
      console.warn("Gallery missing data-folder", gallery);
      return;
    }

    // Fetch list from Netlify Function
    const res = await fetch(
      `/.netlify/functions/list-images?folder=${encodeURIComponent(folder)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.error("Failed to load images for", folder, await res.text());
      if (button) button.style.display = "none";
      return;
    }

    const data = await res.json();
    const urls = Array.isArray(data.urls) ? data.urls : [];

    gallery.innerHTML = ""; // clear old content
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
        button.style.display = shown >= urls.length ? "none" : "inline-block";
      }
    }

    // initial render
    renderMore();

    // show more
    if (button) {
      button.style.display = urls.length > step ? "inline-block" : "none";
      button.addEventListener("click", renderMore);
    }
  }

  document.querySelectorAll(".gallery").forEach((gallery) => {
    loadGallery(gallery).catch(console.error);
  });
});
