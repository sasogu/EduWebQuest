            (function () {
              const contentSections = Array.from(document.querySelectorAll('[data-section]'));
              if (!contentSections.length) {
                return;
              }

              const navLinks = Array.from(document.querySelectorAll('.sidebar [data-section-target]'));
              const nextLinks = Array.from(document.querySelectorAll('[data-next-target]'));
              const hasTabs = navLinks.length > 0;

              if (!hasTabs) {
                return;
              }

              const initialSearch = new URLSearchParams(window.location.search);
              const preferParam = initialSearch.has('section');
              const sectionAnchors = new Map();

              contentSections.forEach((section) => {
                const anchor = section.querySelector('[data-section-anchor]');
                sectionAnchors.set(section.dataset.section, anchor ? anchor.id : '');
              });

              function normalizeHash(hash) {
                if (!hash) return '';
                return decodeURIComponent(hash.replace('#', '').trim());
              }

              function scrollToSection(section, behavior) {
                if (!section) return;
                const anchorId = sectionAnchors.get(section.dataset.section);
                const anchorElement = anchorId ? document.getElementById(anchorId) : null;
                const target = anchorElement || section;
                target.scrollIntoView({ behavior, block: 'start' });
              }

              function activate(targetId, { scroll = false } = {}) {
                let current = contentSections.find((section) => section.dataset.section === targetId);
                if (!current) {
                  current = contentSections[0];
                }
                if (!current) {
                  return '';
                }
                contentSections.forEach((section) => {
                  section.classList.toggle('is-active', section === current);
                });
                navLinks.forEach((link) => {
                  const isActive = link.dataset.sectionTarget === current.dataset.section;
                  link.classList.toggle('is-active', isActive);
                  if (isActive) {
                    link.setAttribute('aria-current', 'page');
                  } else {
                    link.removeAttribute('aria-current');
                  }
                });
                if (scroll) {
                  const behavior = scroll === 'auto' ? 'auto' : 'smooth';
                  scrollToSection(current, behavior);
                }
                return current.dataset.section;
              }

              function getSectionFromLocation() {
                const params = new URLSearchParams(window.location.search);
                const paramId = params.get('section');
                const hashId = normalizeHash(window.location.hash);
                if (preferParam) {
                  return paramId || hashId;
                }
                return hashId || paramId;
              }

              function updateUrl(activeId) {
                const url = new URL(window.location.href);
                if (preferParam) {
                  if (activeId) {
                    url.searchParams.set('section', activeId);
                  } else {
                    url.searchParams.delete('section');
                  }
                  url.hash = '';
                } else {
                  url.hash = activeId ? `#${encodeURIComponent(activeId)}` : '';
                  url.searchParams.delete('section');
                }
                window.history.replaceState(null, '', url.toString());
              }

              function goTo(targetId, options = {}) {
                const activeId = activate(targetId, options);
                if (activeId) {
                  updateUrl(activeId);
                }
              }

              function handleLocationChange(scroll = true) {
                const id = getSectionFromLocation();
                if (id) {
                  activate(id, { scroll });
                }
              }

              navLinks.forEach((link) => {
                link.addEventListener('click', (event) => {
                  event.preventDefault();
                  const targetId = link.dataset.sectionTarget;
                  goTo(targetId, { scroll: true });
                });
              });

              nextLinks.forEach((link) => {
                link.addEventListener('click', (event) => {
                  event.preventDefault();
                  const targetId = link.dataset.nextTarget;
                  goTo(targetId, { scroll: true });
                });
              });

              if (preferParam) {
                window.addEventListener('popstate', () => handleLocationChange(true));
              } else {
                window.addEventListener('hashchange', () => handleLocationChange(true));
              }

              const hadSectionParam = initialSearch.has('section');
              const initialHashValue = normalizeHash(window.location.hash);
              const initialId = getSectionFromLocation() || contentSections[0].dataset.section;
              const shouldScrollInitial = preferParam || hadSectionParam || initialHashValue;
              activate(initialId, { scroll: shouldScrollInitial ? 'auto' : false });
              if (shouldScrollInitial) {
                updateUrl(initialId);
              }
            })();
          
