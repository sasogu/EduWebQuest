            (function () {
              const contentSections = Array.from(document.querySelectorAll('[data-section]'));
              if (!contentSections.length) {
                return;
              }

              const sidebar = document.querySelector('[data-sidebar]');
              const sidebarToggle = sidebar ? sidebar.querySelector('[data-sidebar-toggle]') : null;
              const sidebarPanel = sidebar ? sidebar.querySelector('[data-sidebar-panel]') : null;
              const sidebarToggleLabel = sidebarToggle
                ? sidebarToggle.querySelector('[data-sidebar-toggle-label]')
                : null;
              const mobileBreakpoint =
                typeof window !== 'undefined' && typeof window.matchMedia === 'function'
                  ? window.matchMedia('(max-width: 720px)')
                  : null;
              const defaultToggleLabel = sidebarToggleLabel ? sidebarToggleLabel.textContent.trim() : '';

              const navLinks = Array.from(document.querySelectorAll('.sidebar [data-section-target]'));
              const nextLinks = Array.from(document.querySelectorAll('[data-next-target]'));
              const hasTabs = navLinks.length > 0;

              if (!hasTabs) {
                return;
              }

              const isMobile = () => (mobileBreakpoint ? mobileBreakpoint.matches : false);

              function setSidebarState(open) {
                if (!sidebar || !sidebarToggle || !sidebarPanel) {
                  return;
                }
                sidebar.classList.toggle('sidebar--expanded', open);
                sidebarToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (isMobile()) {
                  if (open) {
                    sidebarPanel.removeAttribute('hidden');
                  } else {
                    sidebarPanel.setAttribute('hidden', '');
                  }
                } else {
                  sidebarPanel.removeAttribute('hidden');
                }
              }

              function collapseSidebarIfMobile() {
                if (isMobile()) {
                  setSidebarState(false);
                }
              }

              function updateSidebarToggleLabel(activeLink) {
                if (!sidebarToggleLabel) {
                  return;
                }
                const text = activeLink && activeLink.textContent ? activeLink.textContent.trim() : '';
                if (text) {
                  sidebarToggleLabel.textContent = text;
                } else if (defaultToggleLabel) {
                  sidebarToggleLabel.textContent = defaultToggleLabel;
                }
              }

              if (sidebar && sidebarToggle && sidebarPanel) {
                sidebarToggle.addEventListener('click', () => {
                  const isExpanded = sidebar.classList.contains('sidebar--expanded');
                  setSidebarState(!isExpanded);
                });

                if (mobileBreakpoint) {
                  const handleBreakpointChange = (event) => {
                    if (event.matches) {
                      setSidebarState(false);
                    } else {
                      setSidebarState(true);
                    }
                  };
                  if (typeof mobileBreakpoint.addEventListener === 'function') {
                    mobileBreakpoint.addEventListener('change', handleBreakpointChange);
                  } else if (typeof mobileBreakpoint.addListener === 'function') {
                    mobileBreakpoint.addListener(handleBreakpointChange);
                  }
                  handleBreakpointChange(mobileBreakpoint);
                } else {
                  setSidebarState(true);
                }
              } else {
                updateSidebarToggleLabel(null);
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
                let activeLink = null;
                navLinks.forEach((link) => {
                  const isActive = link.dataset.sectionTarget === current.dataset.section;
                  link.classList.toggle('is-active', isActive);
                  if (isActive) {
                    link.setAttribute('aria-current', 'page');
                    activeLink = link;
                  } else {
                    link.removeAttribute('aria-current');
                  }
                });
                updateSidebarToggleLabel(activeLink);
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
                  collapseSidebarIfMobile();
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
          
