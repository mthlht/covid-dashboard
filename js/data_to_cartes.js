d3.csv('data/data_to_cartes.csv').then(data => {

    // Traitement des données

    // Sélection des variables nécessaires pour le graphique
    const tidyData = data.map(d => {
      return {
        date: new Date(d.date), // ATTENTION À TRANSPOSER EN FORMAT DATE
        new_cases: +d.conf_j1, // ATTENTION STRING A TRANSPOSER EN FLOAT
        new_cases_evol: d.conf_j1_evol,
        hosp_tot: +d.hosp, // ATTENTION STRING A TRANSPOSER EN FLOAT
        hosp_tot_evol: d.hosp_evol,
        dc_tot: +d.dc_tot, // ATTENTION STRING A TRANSPOSER EN FLOAT
        dc_tot_evol: d.dc_tot_evol,
        vacc_nb: +d.n_cum_complet, // ATTENTION STRING A TRANSPOSER EN FLOAT
        vacc_nb_evol: d.n_cum_complet_evol,
        vacc_percent: +d.couv_complet, // ATTENTION STRING A TRANSPOSER EN FLOAT
        vacc_percent_evol: d.couv_complet_evol
      }
    });

    if (tidyData.length > 0) {
      const fancyData = tidyData[0]

      // Définition de la date du dashboard.
      {
        const fancyDate = {
          day: tidyData[0].date.getDate(),
          month: commonGraph.locale.months[+tidyData[0].date.getMonth()],
          year: tidyData[0].date.getFullYear(),
        }

        d3.select('#state-date-info')
          .html(`${ fancyDate.day } ${ fancyDate.month } ${ fancyDate.year }`)
      }

      // Définition des données des cards.
      {
        const cardGroup = document.querySelectorAll('.dshbrd-card')

        Array.from(cardGroup).map(card => {
          const cardData = card.querySelector('.crd-data')

          cardData.innerHTML = (fancyData[`${ card.id }`] + '').replace(/(?=(\d{3})+(?!\d))/g, ' ')

          if (card.id === 'new_cases' || card.id === 'hosp_tot') {
            cardData.dataset.trend = fancyData[`${ card.id }_evol`]

            card.querySelector('.ntc-trend').innerHTML = fancyData[`${ card.id }_evol`]
          } else if (card.id === 'vacc_nb') {
            card.querySelector('.ntc-trend').innerHTML = fancyData[`vacc_percent`]
          }
        })
      }
    }
});
