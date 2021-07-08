const commonGraph = {
  locale: {
    dateTime: '%A %e %B %Y à %X',
    date: '%d/%m/%Y',
    time: '%H:%M:%S',
    periods: ['AM', 'PM'],
    days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    shortDays: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    shortMonths: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  },
  size: {
    landscape: {
      mobile: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      tablet: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      desktop: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      wide: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      very_wide: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      }
    },
    square: {
      mobile: {
        svg: {
          width: 500,
          height: 500,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 20,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      tablet: {
        svg: {
          width: 500,
          height: 500,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 20,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      desktop: {
        svg: {
          width: 500,
          height: 500,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 20,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      wide: {
        svg: {
          width: 500,
          height: 500,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 20,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      very_wide: {
        svg: {
          width: 500,
          height: 500,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 20,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
    },
    portrait: {
      mobile: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      tablet: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      desktop: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      wide: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      },
      very_wide: {
        svg: {
          width: 500,
          height: 200,
        },
        margin: {
          horizontal: 80,
          vertical: 20,
        },
        legend: {
          height: 40,
          font: 14,
        },
        tooltip: {
          font: 10,
        },
      }
    },
  },
  ticksY: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
  },
  tooltip: (graphId, d3) => {
    return d3
      .select(graphId)
      .select('.grph-content')
      .append('div')
      .attr('class', 'grph-tooltip')
  },
}

// Mise en français des dates.
d3.timeFormatDefaultLocale(commonGraph.locale)

// Détection de la largeur de la page.
{
  getScreenDevice()

  window.addEventListener('resize', getScreenDevice)

  function getScreenDevice () {
    window.screenDevice = window.innerWidth >= 2560
    ? 'very_wide'
    : window.innerWidth >= 1600
      ? 'wide'
      : window.innerWidth >= 1024
          ? 'desktop'
          : window.innerWidth >= 768
            ? 'tablet'
            : 'mobile'
  }
}

// Gestion des ancres/menu sticky d'onglets.
{
  const linkGroup = document.querySelectorAll('.tab-group a')
  const linkGroupWrapper = document.querySelector('.tab-group-wrapper')

  linkGroup.forEach((el, idx, arr) => {
    // gestion de l'événement du click des liens du menu sticky.
    el.addEventListener('click', e => {
      // Annule le comportement naturel des ancres.
      e.preventDefault()

      // Ajout et suppression de m'attribut "active".
      Array.from(arr).filter(el => el[el !== arr[idx] ? 'removeAttribute' : 'setAttribute']('active', ''))

      // Mémorisation de la position de la section cible.
      const targetSectionPos = window.scrollY + document.querySelector(e.target.getAttribute('href')).getBoundingClientRect().top

      // Scroll de la page vers la position cible (moins la hauteur du menu sticky).
      window.scrollTo({
        top: Math.round(targetSectionPos - linkGroupWrapper.clientHeight),
        left: 0
      })
    })
  })

  // gestion du scroll pour le menu sticky.
  window.addEventListener('scroll', () => {
    Array.from(linkGroup).filter((el, idx, arr) => el[el !== arr[window.pageYOffset < getArrRef()[1] - 1 ? 0 : window.pageYOffset < getArrRef()[2] - 1 ? 1 : 2] ? 'removeAttribute' : 'setAttribute']('active', ''))
  })

  // tableau des positions pour le menu sticky.
  function getArrRef () {
    return Array.from(linkGroup).map(link => Math.round(window.scrollY + document.querySelector(link.getAttribute('href')).getBoundingClientRect().top - linkGroupWrapper.clientHeight))
  }
}
