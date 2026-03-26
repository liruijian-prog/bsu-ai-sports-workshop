const menuToggle = document.querySelector('.menu-toggle')
const siteNav = document.querySelector('.site-nav')
const navLinks = Array.from(document.querySelectorAll('.site-nav a'))
const sections = Array.from(document.querySelectorAll('main section[id]'))
const revealItems = Array.from(document.querySelectorAll('[data-reveal]'))

const closeMenu = () => {
  if (!siteNav || !menuToggle) {
    return
  }

  siteNav.classList.remove('is-open')
  menuToggle.setAttribute('aria-expanded', 'false')
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open')
    menuToggle.setAttribute('aria-expanded', String(isOpen))
  })

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu)
  })

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Node)) {
      return
    }

    if (!siteNav.contains(target) && !menuToggle.contains(target)) {
      closeMenu()
    }
  })
}

const markActiveLink = (id) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`
    link.classList.toggle('is-active', isActive)
  })
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markActiveLink(entry.target.id)
        }
      })
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0.18,
    },
  )

  sections.forEach((section) => {
    sectionObserver.observe(section)
  })

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.14,
      rootMargin: '0px 0px -10% 0px',
    },
  )

  revealItems.forEach((item) => {
    revealObserver.observe(item)
  })
} else {
  revealItems.forEach((item) => {
    item.classList.add('is-visible')
  })
}
