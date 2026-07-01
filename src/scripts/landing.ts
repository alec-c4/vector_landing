const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach((el) => revealObs.observe(el));

const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', isOpen);
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

const contactForm = document.getElementById('contact-form') as HTMLFormElement | null;
const contactStatus = document.getElementById('contact-form-status');
const contactSubmit = document.getElementById('contact-submit') as HTMLButtonElement | null;

if (contactForm && contactStatus && contactSubmit) {
  const defaultSubmitLabel = contactSubmit.innerHTML;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    contactSubmit.disabled = true;
    contactSubmit.textContent = 'Отправка…';
    contactStatus.className = 'hidden rounded-xl px-4 py-3 text-sm';
    contactStatus.textContent = '';

    try {
      const payload = Object.fromEntries(new FormData(contactForm).entries());

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { ok?: boolean; error?: string };

      contactStatus.classList.remove('hidden');
      if (response.ok && data.ok) {
        contactStatus.style.background = 'hsl(140 60% 94%)';
        contactStatus.style.color = 'hsl(140 45% 28%)';
        contactStatus.textContent = 'Сообщение отправлено. Мы свяжемся с вами в ближайшее время.';
        contactForm.reset();
      } else {
        contactStatus.style.background = 'hsl(0 70% 96%)';
        contactStatus.style.color = 'hsl(0 55% 35%)';
        contactStatus.textContent = data.error ?? 'Не удалось отправить сообщение.';
      }
    } catch {
      contactStatus.classList.remove('hidden');
      contactStatus.style.background = 'hsl(0 70% 96%)';
      contactStatus.style.color = 'hsl(0 55% 35%)';
      contactStatus.textContent = 'Не удалось отправить сообщение. Попробуйте позже.';
    } finally {
      contactSubmit.disabled = false;
      contactSubmit.innerHTML = defaultSubmitLabel;
    }
  });
}

const moduleTabs = document.querySelectorAll<HTMLButtonElement>('.module-tab');
const modulePanels = document.querySelectorAll<HTMLElement>('.module-panel');
moduleTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    moduleTabs.forEach((t, j) => {
      const active = i === j;
      t.setAttribute('aria-selected', String(active));
      t.style.background = active ? 'hsl(248 75% 52%)' : 'hsl(240 10% 94%)';
      t.style.color = active ? 'white' : 'hsl(240 8% 42%)';
    });
    modulePanels.forEach((p, j) => p.classList.toggle('hidden', i !== j));
  });
});

let speakerCurrent = 0;
let speakerAnimating = false;

function getSpeakersCarousel(): HTMLElement | null {
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  return document.querySelector<HTMLElement>(
    `[data-speakers-carousel="${isDesktop ? 'desktop' : 'mobile'}"]`,
  );
}

function getSpeakerSlides(): HTMLElement[] {
  const carousel = getSpeakersCarousel();
  if (!carousel) return [];
  return [...carousel.querySelectorAll<HTMLElement>('.speakers-slide')];
}

function updateSpeakerDots(idx: number) {
  const carousel = getSpeakersCarousel();
  carousel?.querySelectorAll<HTMLElement>('.speakers-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === idx);
  });
}

function setSlideVisible(slide: HTMLElement, visible: boolean) {
  if (visible) {
    slide.removeAttribute('hidden');
  } else {
    slide.setAttribute('hidden', '');
  }
}

function resetSpeakersCarousel() {
  speakerCurrent = 0;
  speakerAnimating = false;
  document.querySelectorAll('[data-speakers-carousel]').forEach((carousel) => {
    carousel.querySelectorAll<HTMLElement>('.speakers-slide').forEach((slide, i) => {
      setSlideVisible(slide, i === 0);
      slide.style.opacity = '';
      slide.style.transition = '';
    });
  });
  updateSpeakerDots(0);
}

const showSpeakerSlide = (idx: number) => {
  const slides = getSpeakerSlides();
  if (!slides.length || idx === speakerCurrent || speakerAnimating) return;
  speakerAnimating = true;
  const curr = slides[speakerCurrent];
  const next = slides[idx];
  curr.style.transition = 'opacity 0.25s ease';
  curr.style.opacity = '0';
  setTimeout(() => {
    setSlideVisible(curr, false);
    curr.style.opacity = '';
    curr.style.transition = '';
    setSlideVisible(next, true);
    next.style.opacity = '0';
    next.style.transition = 'opacity 0.25s ease';
    void next.offsetWidth;
    next.style.opacity = '1';
    setTimeout(() => {
      next.style.opacity = '';
      next.style.transition = '';
      speakerAnimating = false;
    }, 250);
  }, 250);
  speakerCurrent = idx;
  updateSpeakerDots(idx);
};

document.querySelectorAll('[data-speakers-prev]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slides = getSpeakerSlides();
    showSpeakerSlide((speakerCurrent - 1 + slides.length) % slides.length);
  });
});

document.querySelectorAll('[data-speakers-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const slides = getSpeakerSlides();
    showSpeakerSlide((speakerCurrent + 1) % slides.length);
  });
});

window.matchMedia('(min-width: 1024px)').addEventListener('change', resetSpeakersCarousel);

document.querySelectorAll<HTMLButtonElement>('.faq-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const answerId = btn.getAttribute('aria-controls')!;
    const answer = document.getElementById(answerId);
    const icon = btn.querySelector<SVGElement>('.faq-icon');

    document.querySelectorAll<HTMLButtonElement>('.faq-btn').forEach((b) => {
      b.setAttribute('aria-expanded', 'false');
      const aId = b.getAttribute('aria-controls')!;
      document.getElementById(aId)?.classList.add('hidden');
      const ic = b.querySelector<SVGElement>('.faq-icon');
      if (ic) ic.style.transform = '';
    });

    if (!expanded && answer) {
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.remove('hidden');
      if (icon) icon.style.transform = 'rotate(180deg)';
    }
  });
});
