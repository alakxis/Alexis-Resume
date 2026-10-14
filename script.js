

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const IMAGE_DIR = "images/";

    const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

    const MAX_IMAGES = 30;

    const reducedMotion = window.matchMedia(

      "(prefers-reduced-motion: reduce)"

    ).matches;

    /* Find an image by filename without requiring a manual HTML entry. */

    async function findImage(baseName) {

      for (const extension of EXTENSIONS) {

        const path = `${IMAGE_DIR}${baseName}${extension}`;

        const found = await new Promise((resolve) => {

          const img = new Image();

          img.onload = () => resolve(path);

          img.onerror = () => resolve(null);

          img.src = path;

        });

        if (found) return found;

      }

      return null;

    }

    /* Load a sequence such as experience1.jpg, experience2.png, etc. */

    async function discoverImages(prefix, limit = MAX_IMAGES) {

      const results = await Promise.all(

        Array.from({ length: limit }, (_, i) => findImage(`${prefix}${i + 1}`))

      );

      return results.filter(Boolean);

    }

    /* HERO PORTRAIT */

    const portrait = document.getElementById("portrait");

    const portraitPlaceholder = document.getElementById("portraitPlaceholder");

    if (portrait && portraitPlaceholder) {

      portrait.addEventListener("error", () => {

        portrait.style.display = "none";

        portraitPlaceholder.style.display = "flex";

      }, { once: true });

      portrait.addEventListener("load", () => {

        portrait.style.display = "block";

        portraitPlaceholder.style.display = "none";

      });

      if (portrait.complete && portrait.naturalWidth === 0) {

        portrait.style.display = "none";

        portraitPlaceholder.style.display = "flex";

      } else if (portrait.complete && portrait.naturalWidth > 0) {

        portraitPlaceholder.style.display = "none";

      }

    }

    /* TRACKER SCREENSHOT OR FALLBACK PREVIEW */

    const trackerImage = document.getElementById("trackerImage");

    const trackerPlaceholder = document.getElementById("trackerPlaceholder");

    function showTrackerFallback() {

      if (trackerImage) trackerImage.style.display = "none";

      if (trackerPlaceholder) trackerPlaceholder.style.display = "block";

    }

    if (trackerImage && trackerPlaceholder) {

      trackerImage.addEventListener("load", () => {

        trackerImage.style.display = "block";

        trackerPlaceholder.style.display = "none";

      });

      trackerImage.addEventListener("error", showTrackerFallback);

      if (trackerImage.complete && trackerImage.naturalWidth === 0) {

        showTrackerFallback();

      }

    }

    /* MOBILE NAVIGATION */

    const menuToggle = document.getElementById("menuToggle");

    const navMenu = document.getElementById("navMenu");

    function closeMenu() {

      navMenu?.classList.remove("open");

      menuToggle?.setAttribute("aria-expanded", "false");

    }

    menuToggle?.addEventListener("click", () => {

      const open = navMenu.classList.toggle("open");

      menuToggle.setAttribute("aria-expanded", String(open));

    });

    navMenu?.querySelectorAll("a").forEach((link) => {

      link.addEventListener("click", closeMenu);

    });

    document.addEventListener("keydown", (event) => {

      if (event.key === "Escape") closeMenu();

    });

    /* SCROLL PROGRESS */

    const progressLine = document.getElementById("progressLine");

    function updateProgress() {

      if (!progressLine) return;

      const maxScroll =

        document.documentElement.scrollHeight - window.innerHeight;

      const progress = maxScroll > 0

        ? (window.scrollY / maxScroll) * 100

        : 0;

      progressLine.style.width = `${Math.min(100, progress)}%`;

    }

    window.addEventListener("scroll", updateProgress, { passive: true });

    updateProgress();

    /* ACTIVE NAVIGATION */

    if ("IntersectionObserver" in window) {

      const sections = document.querySelectorAll("main section[id]");

      const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          navMenu?.querySelectorAll('a[href^="#"]').forEach((link) => {

            const active =

              link.getAttribute("href") === `#${entry.target.id}`;

            link.classList.toggle("active", active);

            if (active) link.setAttribute("aria-current", "location");

            else link.removeAttribute("aria-current");

          });

        });

      }, { rootMargin: "-25% 0px -60% 0px" });

      sections.forEach((section) => observer.observe(section));

    }

    /* SHARED IMAGE LIGHTBOX */

    const lightbox = document.getElementById("lightbox");

    const lightboxImage = document.getElementById("lightboxImage");

    const lightboxCaption = document.getElementById("lightboxCaption");

    const lightboxClose = document.getElementById("lightboxClose");

    const lightboxPrev = document.getElementById("lightboxPrev");

    const lightboxNext = document.getElementById("lightboxNext");

    let lightboxItems = [];

    let lightboxIndex = 0;

    let previousFocus = null;

    function showLightboxImage(index) {

      if (!lightboxItems.length) return;

      lightboxIndex =

        (index + lightboxItems.length) % lightboxItems.length;

      const item = lightboxItems[lightboxIndex];

      lightboxImage.src = item.src;

      lightboxImage.alt = item.alt;

      lightboxCaption.textContent =

        `${item.alt} · ${lightboxIndex + 1} of ${lightboxItems.length}`;

    }

    function openLightbox(items, index) {

      if (!lightbox || !items.length) return;

      lightboxItems = items;

      previousFocus = document.activeElement;

      showLightboxImage(index);

      lightbox.classList.add("open");

      lightbox.setAttribute("aria-hidden", "false");

      document.body.classList.add("no-scroll");

      lightboxClose?.focus();

    }

    function closeLightbox() {

      if (!lightbox) return;

      lightbox.classList.remove("open");

      lightbox.setAttribute("aria-hidden", "true");

      document.body.classList.remove("no-scroll");

      lightboxImage?.removeAttribute("src");

      if (previousFocus && typeof previousFocus.focus === "function") {

        previousFocus.focus();

      }

    }

    lightboxClose?.addEventListener("click", closeLightbox);

    lightboxPrev?.addEventListener("click", () =>

      showLightboxImage(lightboxIndex - 1)

    );

    lightboxNext?.addEventListener("click", () =>

      showLightboxImage(lightboxIndex + 1)

    );

    lightbox?.addEventListener("click", (event) => {

      if (event.target === lightbox) closeLightbox();

    });

    document.addEventListener("keydown", (event) => {

      if (!lightbox?.classList.contains("open")) return;

      if (event.key === "Escape") closeLightbox();

      if (event.key === "ArrowLeft") showLightboxImage(lightboxIndex - 1);

      if (event.key === "ArrowRight") showLightboxImage(lightboxIndex + 1);

    });

    /* BUILD A GALLERY FROM THE PHOTOS THAT ACTUALLY EXIST */

    function buildGallery({

      container,

      prefix,

      limit = MAX_IMAGES,

      dotsElement = null,

      counterElement = null,

      prevButton = null,

      nextButton = null,

      interval = 4000,

      fit = "cover",

      label = "Portfolio photo",

      showArrows = true

    }) {

      const root = document.getElementById(container);

      if (!root) return null;

      const track = root.querySelector(".gallery-track");

      const dotsRoot = dotsElement

        ? document.getElementById(dotsElement)

        : null;

      if (!track) return null;

      let images = [];

      let current = 0;

      let timer = null;

      let touchStart = 0;

      const previous = prevButton

        ? document.getElementById(prevButton)

        : root.querySelector(".gallery-prev");

      const next = nextButton

        ? document.getElementById(nextButton)

        : root.querySelector(".gallery-next");

      const counter = counterElement

        ? document.getElementById(counterElement)

        : root.querySelector(".gallery-count");

      function stop() {

        if (timer) window.clearInterval(timer);

        timer = null;

      }

      function start() {

        stop();

        if (reducedMotion || document.hidden || images.length < 2) return;

        timer = window.setInterval(() => {

          if (!root.matches(":hover") &&

              !root.contains(document.activeElement)) {

            show(current + 1);

          }

        }, interval);

      }

      function show(index) {

        if (!images.length) return;

        current = (index + images.length) % images.length;

        images.forEach((image, i) => {

          image.slide.classList.toggle("active", i === current);

          image.slide.setAttribute("aria-hidden", String(i !== current));

          image.slide.tabIndex = i === current ? 0 : -1;

        });

        if (images[current].dot) {

          images.forEach((image, i) => {

            if (!image.dot) return;

            image.dot.classList.toggle("active", i === current);

            image.dot.setAttribute("aria-current", String(i === current));

          });

        }

        if (counter) {

          counter.textContent =

            `${String(current + 1).padStart(2, "0")} / ` +

            `${String(images.length).padStart(2, "0")}`;

        }

      }

      function move(delta) {

        show(current + delta);

        start();

      }

      function render() {

        track.replaceChildren();

        if (dotsRoot) dotsRoot.replaceChildren();

        images = [];

        if (!imagesFound.length) {

          const empty = document.createElement("div");

          empty.className = "gallery-empty";

          empty.textContent =

            `Add photos named ${prefix}1.jpg, ${prefix}2.jpg, and so on.`;

          track.appendChild(empty);

          if (counter) counter.textContent = "0 / 0";

          if (previous) previous.hidden = true;

          if (next) next.hidden = true;

          return;

        }

        imagesFound.forEach((src, index) => {

          const slide = document.createElement("button");

          slide.type = "button";

          slide.className = "gallery-slide";

          slide.setAttribute("aria-label", `View ${label.toLowerCase()} ${index + 1}`);

          const img = document.createElement("img");

          img.src = src;

          img.alt = `${label} ${index + 1}`;

          img.loading = index === 0 ? "eager" : "lazy";

          img.decoding = "async";

          img.style.objectFit = fit;

          slide.appendChild(img);

          track.appendChild(slide);

          const item = { src, alt: img.alt, slide, dot: null };

          images.push(item);

          slide.addEventListener("click", () => {

            openLightbox(

              images.map((image) => ({

                src: image.src,

                alt: image.alt

              })),

              current

            );

          });

          if (dotsRoot) {

            const dot = document.createElement("button");

            dot.type = "button";

            dot.className = "gallery-dot";

            dot.setAttribute("aria-label", `Show ${label.toLowerCase()} ${index + 1}`);

            dot.addEventListener("click", () => {

              show(index);

              start();

            });

            dotsRoot.appendChild(dot);

            item.dot = dot;

          }

        });

        if (previous) previous.hidden = images.length < 2;

        if (next) next.hidden = images.length < 2;

        show(0);

        start();

      }

      let imagesFound = [];

      root.addEventListener("mouseenter", stop);

      root.addEventListener("mouseleave", start);

      root.addEventListener("focusin", stop);

      root.addEventListener("focusout", () => {

        window.setTimeout(() => {

          if (!root.contains(document.activeElement)) start();

        }, 0);

      });

      root.addEventListener("touchstart", (event) => {

        touchStart = event.changedTouches[0].screenX;

      }, { passive: true });

      root.addEventListener("touchend", (event) => {

        const distance = event.changedTouches[0].screenX - touchStart;

        if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);

      }, { passive: true });

      previous?.addEventListener("click", () => move(-1));

      next?.addEventListener("click", () => move(1));

      document.addEventListener("visibilitychange", () => {

        if (document.hidden) stop();

        else start();

      });

      const ready = discoverImages(prefix, limit).then((found) => {

        imagesFound = found;

        render();

        return { show, start, stop, imagesFound };

      });

      return { ready, show, start, stop };

    }

    /* EXPERIENCE GALLERY — experience1.jpg through experience30.* */

    const experienceGallery = buildGallery({

      container: "experienceGallery",

      prefix: "experience",

      limit: 30,

      dotsElement: "experienceDots",

      interval: 4000,

      label: "Experience photo"

    });

    /* CANVA GALLERY — canva1.jpg through canva30.* */

    const canvaGallery = buildGallery({

      container: "canvaGallery",

      prefix: "canva",

      limit: 30,

      dotsElement: "canvaDots",

      counterElement: "canvaCount",

      prevButton: "canvaPrev",

      nextButton: "canvaNext",

      interval: 4500,

      fit: "contain",

      label: "Canva design",

      showArrows: false

    });

    /* CALENDAR GALLERY — calendar1.jpg through calendar30.* */

    async function buildCalendarGallery() {

      const gallery = document.getElementById("calendarGallery");

      if (!gallery) return;

      const photos = await discoverImages("calendar", 30);

      gallery.replaceChildren();

      if (!photos.length) {

        const empty = document.createElement("p");

        empty.className = "gallery-empty";

        empty.textContent =

          "Add calendar1.jpg, calendar2.jpg, and more to the images folder.";

        gallery.appendChild(empty);

        return;

      }

      photos.forEach((src, index) => {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "calendar-image";

        const img = document.createElement("img");

        img.src = src;

        img.alt = `Calendar design sample ${index + 1}`;

        img.loading = "lazy";

        img.decoding = "async";

        const caption = document.createElement("span");

        caption.className = "calendar-label";

        caption.append(

          document.createTextNode(`Calendar Sample ${String(index + 1).padStart(2, "0")}`)

        );

        const arrow = document.createElement("span");

        arrow.textContent = "↗";

        caption.appendChild(arrow);

        button.append(img, caption);

        button.addEventListener("click", () => {

          openLightbox(

            photos.map((photo, i) => ({

              src: photo,

              alt: `Calendar design sample ${i + 1}`

            })),

            index

          );

        });

        gallery.appendChild(button);

      });

    }

    await Promise.all([

      experienceGallery?.ready,

      canvaGallery?.ready,

      buildCalendarGallery()

    ]);

    /* COPY EMAIL ADDRESS */

    const copyEmail = document.getElementById("copyEmail");

    const copyMessage = document.getElementById("copyMessage");

    const emailAddress = "mialexis.com@gmail.com";

    copyEmail?.addEventListener("click", async () => {

      try {

        await navigator.clipboard.writeText(emailAddress);

        copyMessage.textContent = "Email copied to clipboard.";

      } catch {

        copyMessage.textContent = `You can reach me at ${emailAddress}`;

      }

      window.setTimeout(() => {

        if (copyMessage) copyMessage.textContent = "";

      }, 3500);

    });

  });