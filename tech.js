"use strict";
(() => {
  document.documentElement.classList.remove("no-js");
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const whatsappNumber = "971586692798";
  const messages = {
    general: "Hi Shafan, I saw your portfolio and I'd like to discuss a website project. Can we talk about the requirements and next steps?",
    new: "Hi Shafan, I'd like a new website for my business. Can we discuss the requirements, design direction and next steps?",
    redesign: "Hi Shafan, I have an existing website that I'd like to redesign. Can we discuss improving its design, mobile experience and usability?",
    catalogue: "Hi Shafan, I'd like to build a product catalogue website with clear categories and product information. Can we discuss the requirements?",
    other: "Hi Shafan, I saw your portfolio and have a project idea I'd like to discuss. Could we talk about it?"
  };
  const whatsappURL = message => `https://wa.me/${whatsappNumber}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ""}`;
  const messageInput = $("#enquiry-message");
  const enquiryLink = $("#whatsapp-send");
  const updateEnquiry = () => { enquiryLink.href = whatsappURL(messageInput.value); };
  $$("[data-whatsapp='general']").forEach(link => { link.href = whatsappURL(messages.general); });
  $$("[data-enquiry]").forEach(button => button.addEventListener("click", () => {
    const value = messages[button.dataset.enquiry];
    if (!value) return;
    messageInput.value = value;
    $$("[data-enquiry]").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    $("#enquiry-status").textContent = `Opening message updated for ${button.textContent.toLowerCase()}. You can edit it below.`;
    updateEnquiry();
  }));
  messageInput.addEventListener("input", updateEnquiry);
  updateEnquiry();
  const menu = $(".menu-toggle");
  const nav = $("#main-nav");
  function closeMenu(returnFocus = false) {
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
    if (returnFocus) menu.focus();
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  $$("a", nav).forEach(link => link.addEventListener("click", () => closeMenu()));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true); });
  document.addEventListener("click", e => { if (!e.target.closest(".header")) closeMenu(); });
  window.matchMedia("(min-width:681px)").addEventListener("change", () => closeMenu());

  const projects = $$(".project");
  const filterButtons = $$("[data-filter]");
  function filterProjects(filter, updateURL = true) {
    let count = 0;
    projects.forEach(project => { project.hidden = filter !== "all" && project.dataset.category !== filter; if (!project.hidden) count++; });
    filterButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
    $("#filter-status").textContent = `Showing ${count} ${filter === "all" ? "" : filter + " "}project${count === 1 ? "" : "s"}.`;
    if (updateURL && location.protocol !== "file:") {
      const url = new URL(location.href);
      if (filter === "all") url.searchParams.delete("work"); else url.searchParams.set("work", filter);
      history.replaceState(null, "", url);
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  filterButtons.forEach(button => button.addEventListener("click", () => filterProjects(button.dataset.filter)));
  const initialFilter = new URLSearchParams(location.search).get("work");
  if (filterButtons.some(button => button.dataset.filter === initialFilter)) filterProjects(initialFilter, false);

  const cases = {
    energy: { name: "VOLT RUSH", category: "BEVERAGE / BRAND EXPERIENCE", description: "An energy drink concept with a confident, high-impact visual identity.", direction: "Electric colour, oversized type and cinematic product imagery create a distinct campaign language. A strong focal point keeps the product at the centre of the page.", experience: "A focused homepage introduces the drink and its flavour collection. Responsive image variants keep the visual emphasis consistent across screen sizes.", image: "energy" },
    clothing: { name: "FIELDNOTE", category: "FASHION / EDITORIAL DESIGN", description: "An understated fashion concept built around photography, texture and a calm editorial rhythm.", direction: "Warm neutrals and generous spacing give the collection room to breathe. Typography supports the imagery without competing for attention.", experience: "The homepage moves from a seasonal introduction to a collection overview, with an image-led layout that adapts to smaller screens.", image: "clothing" },
    hospitality: { name: "ASTER HOUSE", category: "HOSPITALITY / DESTINATION DESIGN", description: "A boutique hospitality concept that puts the atmosphere of a place first.", direction: "Architectural imagery, warm tones and restrained typography create a sense of arrival. The visual pace is deliberately slower than the product-focused concepts.", experience: "The page introduces the destination and its spaces through clear sections and responsive imagery. It is a visual concept, with no booking service connected.", image: "hospitality" },
    shoes: { name: "STRIDE", category: "FOOTWEAR / PRODUCT CAMPAIGN", description: "A sportswear direction with bold typography and a strong sense of movement.", direction: "Product photography and assertive type set an energetic tone. High contrast helps the collection and primary actions stand out.", experience: "An immersive introduction leads into the footwear collection. The page explores a campaign experience without a checkout or product-ordering backend.", image: "shoes" },
    services: { name: "GOODWORK", category: "TECHNOLOGY / DIGITAL EXPERIENCE", description: "A technology-services concept designed to make complex offerings easy to understand.", direction: "A structured layout, clear headlines and a focused visual palette support the service story. The emphasis is on communicating value with less friction.", experience: "The homepage connects an introduction to solution positioning and a process narrative. Contact elements are illustrative; no form submission is connected.", image: "services" },
    infrastructure: { name: "AXIOM NETWORKS", category: "INFRASTRUCTURE / PRODUCT STORYTELLING", description: "An infrastructure concept built around clear product discovery and cinematic demonstrations.", direction: "A light, precise interface combines restrained typography with original video-led product storytelling. The motion communicates technical detail without crowding the content.", experience: "The hero plays each full video before moving smoothly to the next, with manual navigation and responsive imagery. The page illustrates a product experience without a connected quotation or fulfilment system.", image: "infrastructure" },
    skincare: { name: "MIELA", category: "SKINCARE / EDITORIAL COMMERCE", description: "A warm, considered skincare concept with a calm editorial direction.", direction: "Ivory, oat and soft peach tones frame product imagery with generous breathing room. Typographic contrast leads the eye through a slower, more tactile visual experience.", experience: "The homepage introduces a fictional skincare ritual and product range through an editorial layout and focused interactions. It is a design concept, not a live shop or clinical product recommendation.", image: "skincare" },
    fragrance: { name: "VELLUNE", category: "FRAGRANCE / PRODUCT EXPERIENCE", description: "A refined fragrance concept centred around a real-time product study.", direction: "Charcoal, ivory and amber create a restrained luxury palette, paired with editorial ingredient imagery and finely detailed product geometry.", experience: "Move over the modeled bottle, swipe on touch or use the keyboard to inspect every side. The model uses continuous real-time 3D rendering, not a sequence of product photographs. No live purchasing system is connected.", image: "fragrance" },
    audio: { name: "SONVIA", category: "HOME AUDIO / MOTION DESIGN", description: "A premium home-audio concept presented as a cinematic visual story.", direction: "Dark tonal layers and responsive visual motion evoke sound without cluttering the product narrative. Studio imagery anchors the experience.", experience: "Scroll through the story and explore selectable visual listening modes. The concept does not reproduce sound specifications or sell any real products.", image: "audio" }
  };
  const dialog = $("#case-dialog");
  let dialogTrigger;
  $$("[data-case]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.case, info = cases[key];
    dialogTrigger = button;
    $("#case-title").textContent = info.name;
    $("#case-category").textContent = info.category;
    $("#case-description").textContent = info.description;
    $("#case-direction").textContent = info.direction;
    $("#case-experience").textContent = info.experience;
    $("#case-image").src = `art/${info.image}-preview.webp`;
    $("#case-image").alt = `${info.name} fictional homepage concept`;
    $("#case-visit").href = `catalogues/${key}/index.html`;
    $("#case-enquiry").href = whatsappURL(`Hi Shafan, I saw the ${info.name} concept on your portfolio. I'd like to discuss a website with a similar design direction for my business.`);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.style.overflow = "hidden";
    $(".dialog-close").focus();
  }));
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener("close", () => { document.body.style.overflow = ""; dialogTrigger?.focus(); });

  if ("IntersectionObserver" in window) {
    const navigationObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        $$("a", nav).forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
      }
    }, { rootMargin: "-15% 0px -55% 0px" });
    $$("#work,#expertise,#about,#contact").forEach(section => navigationObserver.observe(section));
  }

  // Page reveals run once. Interactive hero motion is isolated in the React scene.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealContext;
  if (!reduceMotion.matches && window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    revealContext = window.gsap.context(() => {
      $$(".section-heading,.expertise-card,.process-list li,.about-copy,.contact-copy,.enquiry-card").forEach(element => {
        window.gsap.from(element, { y: 18, opacity: .7, duration: .65, ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 95%", once: true }, clearProps: "transform,opacity" });
      });
    });
  }
  function settleReveals(disabled) {
    if (disabled && revealContext) { revealContext.revert(); revealContext = null; }
  }
  window.addEventListener("portfolio-motion", event => settleReveals(event.detail.disabled));
  reduceMotion.addEventListener("change", () => {
    settleReveals(reduceMotion.matches);
  });
})();
