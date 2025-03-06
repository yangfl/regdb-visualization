'use strict'

/*
class MyScale extends Chart.Scale {
  static id = 'myScale'
  static defaults = defaultConfigObject
}
Chart.register(MyScale)
*/

/** @typedef {[string, Country][]} RegDB */

/**
 * @param {Iterable<T>} it
 * @param {number?} start
 * @returns {Generator<[number, T], void, void>}
 * @template T
 */
function* enumerate (it, start = 0) {
  let i = start
  for (const x of it) {
    yield [i++, x]
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Channels[]} channels
 * @param {RegDB} regdb
 * @param {string?} selectedCode
 * @returns {Chart?}
 */
function setupChart (ctx, channels, regdb, selectedCode) {
  if (channels.length === 0 || regdb.length === 0) {
    return null
  }

  /**
   * Sort channels and regdb
   * In chart.js bar chart, we can only draw one bar for each label in one time,
   * thus we need to transpose the regdb so that an array represents a series of
   * one regulation for each country.
   */

  // transpose channels
  const wifiFreqSeps = Array.from(new Set((function* () {
    yield 0
    for (let i = 0; i < channels.length; i++) {
      yield channels[i].lower
      yield channels[i].upper
    }
  })())).sort((a, b) => a - b)
  /** @type {Channel[][]} */
  const aaChannels = []
  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i]
    for (let j = 0;; j++) {
      if (aaChannels.length === j) {
        aaChannels.push([])
      } else if (aaChannels[j].length > 0 &&
                 aaChannels[j].at(-1).upper > channel.lower) {
        continue
      }
      aaChannels[j].push(channel)
      break
    }
  }

  // transpose regdb
  /** @type {Permission[][][]} */
  const aaaPermissions = []
  for (const [h, [countryCode, country]] of enumerate(regdb)) {
    /* Pick stacks of regulations, so that in each stack, the regulations are
     * non-overlapping.
     */
    const permissions = country.permissions
    /** @type {Permission[][]} */
    const dataset = []
    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i]
      if (!channels.some(channel => permission.hasChannel(channel))) {
        // that regulation is not applicable to any channel; skip
        continue
      }
      for (let j = 0;; j++) {
        if (dataset.length === j) {
          // new stack
          dataset.push([])
        } else if (
            permission.freqband.overlaps(dataset[j].at(-1)?.freqband) === 1) {
          // overlap with this stack of regulations; move to next stack
          continue
        }
        // no overlap; add to this stack
        dataset[j].push(permission)
        break
      }
    }
    // collect stacks
    for (let i = 0; i < dataset.length; i++) {
      if (aaaPermissions.length === i) {
        aaaPermissions.push([])
      }
      // collect strips
      for (let j = 0; j < dataset[i].length; j++) {
        if (aaaPermissions[i].length === j) {
          aaaPermissions[i].push([])
        }
        aaaPermissions[i][j][h] = dataset[i][j]
      }
    }
  }
  if (regdb.length != 1) {
    // BUG of chart.js: array with one element is flattened
    for (let i = 0; i < aaaPermissions.length; i++) {
      for (let j = 0; j < aaaPermissions[i].length; j++) {
        if (aaaPermissions[i][j].length === 1) {
          aaaPermissions[i][j].push(null)
        }
      }
    }
  }

  function normalize (x, xmin, xmax, ymin = 0, ymax = 1) {
    return ymin + (x - xmin) / (xmax - xmin) * (ymax - ymin)
  }

  function freq2hsl (freq) {
    function freq2hue (freq) {
      if (freq < 5000) {
        return 0
      } else if (freq < 50000) {
        return 120
      } else {
        return 240
      }
    }
    function freq2sat (freq) {
      if (freq < 5000) {
        return normalize(freq, 2400, 2495, 0.3)
      } else if (freq < 50000) {
        return normalize(freq, 5030, 7125, 0.3)
      } else {
        return normalize(freq, 57240, 70200, 0.3)
      }
    }
    function freq2light (freq) {
      return 0.5
    }
    return `hsl(${freq2hue(freq)}, ${freq2sat(freq) * 100}%, ${freq2light(freq) * 100}%)`
  }

  function dbm2hsl (dbm) {
    function dbm2hue (dbm) {
      return 120
    }
    function dbm2sat (dbm) {
      return 1
    }
    function dbm2light (dbm) {
      return normalize(dbm, 10, 30, 0, 0.5)
    }
    return `hsl(${dbm2hue(dbm)}, ${dbm2sat(dbm) * 100}%, ${dbm2light(dbm) * 100}%)`
  }

  const datasets = []
  const borderColor = regdb.map(
    ([code]) => code === selectedCode ? 'red' : 'transparent')
  const borderWidth = regdb.map(([code]) => code === selectedCode ? 1 : 0)
  for (let i = 0; i < aaaPermissions.length; i++) {
    for (let j = 0; j < aaaPermissions[i].length; j++) {
      datasets.push({
        backgroundColor: aaaPermissions[i][j].map(
          permission => permission && dbm2hsl(permission.power.valueOf())),
        borderColor, borderWidth,
        data: aaaPermissions[i][j].map(permission => permission && [
          permission.freqband.start, permission.freqband.end,
          permission]),
        label: `Strip ${j} of ${i}`,
        stack: `Stack ${i}`,
      })
    }
  }

  const labels = regdb.map(value => value[0])
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      aspectRatio: 32 / (labels.length + 1.875),

      animation: { duration: 250 },
      animations: {
        numbers: labels.length <= 32 ? {} : false
      },

      barThickness: 'flex',
      maxBarThickness: 64,
      indexAxis: 'y',

      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label (context) {
              const permission = context.raw[2]
              const freqband = permission.freqband
              return context.label + ': ' + freqband.start + ' - ' +
                     freqband.end
            },
            footer (context) {
              const permission = context[0].raw[2]
              const power = permission.power
              let str = power.toString() + ' (' + power.toString(true) + ')\n' +
                        permission.freqband.bw + ' MHz'
              if (permission.flags.length) {
                str += '\n' + permission.flags.join(', ')
              }
              return str
            },
          },
        },
      },

      scales: {
        x: {
          min: 2400,
          position: 'top',
          stacked: false,
          type: 'logarithmic',
        },
        y: {
          stacked: true,
          ticks: {
            font: { family: 'monospace' },
            fixedStepSize: 1000,
          },
          afterFit (scaleInstance) {
            scaleInstance.height = 100  // sets the width to 100px
          },
        },
      },
    }
  })
}

/** @type {RegDB} */
let regdb = null
/** @type {Chart} */
let chart = null

/** @type {CanvasRenderingContext2D} */
const ctx = document.getElementById('regdb-chart').getContext('2d')
/** @type {HTMLSelectElement} */
const select_country = document.getElementById('regdb-country')
/** @type {HTMLSelectElement} */
const select_display = document.getElementById('regdb-display')
/** @type {HTMLInputElement[]} */
const a_input_subband = Array.from(document.getElementsByName('freq'))

function drawGraph () {
  chart?.destroy()
  const subbandSelects = a_input_subband
    .filter(input => input.checked && input.dataset.band)
    .map(input => input.value)
  // filter channels
  const channels = wifiChannels.filter(
    channel => subbandSelects.includes(channel.band.value))
  const selectedCode = select_country.value
  // filter regdb
  let selectedRegdb = regdb
  do {
    const displayType = select_display.value
    if (displayType === 'all') {
      break
    }
    const selectedCountry = regdb.find(([code]) => code === selectedCode)?.at(1)
    if (!selectedCountry) {
      break
    }
    // get channel selection vector
    function selectChannels (country) {
      return channels.map(channel => {
        const permission = country.hasChannel(channel)
        return permission ? !permission.flags.includes('NO-IR') : false
      })
    }
    // get channel selection vector of selected country
    const selectedCountryChannels = selectChannels(selectedCountry)
    // test against candidate countries
    selectedRegdb = regdb.filter(([_, country]) =>
      selectChannels(country).every((v, i) => {
        switch (displayType) {
          case 'same':
            return v === selectedCountryChannels[i]
          case 'superset':
            return v >= selectedCountryChannels[i]
          case 'subset':
            return v <= selectedCountryChannels[i]
        }
      }))
  } while (false)
  chart = setupChart(ctx, channels, selectedRegdb, selectedCode)
}

function renderDB (content) {
  select_country.disabled = false
  // clear
  select_country.innerHTML = ''
  // fill
  regdb = parseDB(content)
  select_country.innerHTML = regdb.map(([c]) =>
    `<option value="${c}">${c} (${CountryCodes.dict.has(c) ?
      CountryCodes.get(c).countryNameEn : 'world'
    })</option>`).join('')
  const savedCountry = localStorage.getItem('regdb-country')
  if (savedCountry) {
    select_country.value = savedCountry
  }
  drawGraph()
}

document.getElementById('regdb-load').addEventListener('click', function () {
  fetch('db.txt').then(response => response.text()).then(renderDB)
})
document.getElementById('regdb-file').addEventListener('change', function () {
  const reader = new FileReader
  reader.onload = function (evt) {
    renderDB(evt.target.result)
  }
  reader.readAsText(this.files[0])
})

{
  const ul_more = document.getElementById('regdb-freq-more')
  document.getElementById('regdb-freq-more-switch').addEventListener(
    'click', function () {
      ul_more.style.display = ul_more.style.display === 'none' ? '' : 'none'
    })
}

document.getElementById('regdb-freq-24').indeterminate = true
document.getElementById('regdb-freq-5').indeterminate = true

a_input_subband.forEach(input => input.addEventListener(
  'change', function (event) {
    /** @type {HTMLInputElement} */
    const target = event.target
    if (target.dataset.band) {
      // subband clicked
      const subbandSelects = a_input_subband.filter(
        input => input.dataset.band === target.dataset.band
      ).map(input => input.checked)
      const input_band = document.getElementById(
        'regdb-freq-' + target.dataset.band)
      input_band.checked = subbandSelects[0]
      input_band.indeterminate = subbandSelects.some(
        (value, i, arr) => value != arr[0])
    } else {
      // band clicked
      a_input_subband.filter(
        input => input.dataset.band === target.value
      ).forEach(input => {
        input.checked = target.checked
      })
    }
    drawGraph()
  }))

select_country.addEventListener('change', function (event) {
  localStorage.setItem('regdb-country', event.target.value)
  drawGraph()
})
select_display.addEventListener('change', function (event) {
  localStorage.setItem('regdb-display', event.target.value)
  drawGraph()
})
{
  const savedDisplayType = localStorage.getItem('regdb-display')
  if (savedDisplayType) {
    select_display.value = savedDisplayType
  }
}
