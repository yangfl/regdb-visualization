'use strict'

/** @typedef {[string, Country][]} RegDB */

const parseDB = (function () {
  const FLAG = {
    'NO-OFDM':    1<<0,
    'NO-CCK':     1<<1,
    'NO-INDOOR':  1<<2,
    'NO-OUTDOOR': 1<<3,
    'DFS':        1<<4,
    'PTP-ONLY':   1<<5,
    'PTMP-ONLY':  1<<6,
    'NO-IR':      1<<7,
    // hole at bit 8
    // hole at bit 9. FIXME: Where is NO-HT40 defined?
    'NO-HT40':    1<<10,
    'AUTO-BW':    1<<11,
  }

  class DFSRegion {
    static Unknown = new DFSRegion('', 0)
    static FCC = new DFSRegion('DFS-FCC', 1)
    static ETSI = new DFSRegion('DFS-ETSI', 2)
    static JP = new DFSRegion('DFS-JP', 3)

    /**
     * @param {string} name
     * @param {number} value
     */
    constructor (name, value) {
      /** @type {string} */
      this.name = name
      /** @type {number} */
      this.value = value
    }

    /**
     * @param {string} str
     * @returns {DFSRegion}
     */
    static parse (str) {
       switch (str) {
          case '': return DFSRegion.Unknown
          case 'DFS-FCC': return DFSRegion.FCC
          case 'DFS-ETSI': return DFSRegion.ETSI
          case 'DFS-JP': return DFSRegion.JP
          default: throw new Error(`Unknown DFS region: ${str}`)
       }
    }

    toString () {
      return this.name
    }

    valueOf () {
      return this.value
    }
  }

  class FreqBand extends Interval {
    /**
     * @param {number} start
     * @param {number} end
     * @param {number} bw
     * @param {string?} comments
     */
    constructor (start, end, bw, comments) {
      super(start, end)
      /** @type {number} */
      this.bw = bw
      /** @type {string?} */
      this.comments = comments
    }

    /**
     * @param {string} str
     * @param {string?} comments
     * @returns {FreqBand}
     */
    static parse (str, comments) {
      const [_, start, end, bw] = str.match(/^([^-]*)-([^@]*)@(.*)$/)
      return new FreqBand(parseFloat(start), parseFloat(end), parseFloat(bw),
                          comments)
    }

    /**
     * @param {Channel} channel
     * @returns {boolean}
     */
    hasChannel (channel) {
      return this.start <= channel.start && channel.end <= this.end &&
             channel.bw <= this.bw
    }
  }

  class PowerRestriction {
    /**
     * @param {number} max_ant_gain
     * @param {number} max_eirp
     * @param {string?} comments
     */
    constructor (max_ant_gain, max_eirp, comments) {
      /** @type {number} */
      this.max_ant_gain = max_ant_gain
      /** @type {number} */
      this.max_eirp = max_eirp
      /** @type {string?} */
      this.comments = comments
    }

    /**
     * @param {string} str
     * @returns {PowerRestriction}
     */
    static parse (str) {
      let dbm = parseInt(str)
      if (str.endsWith('mW')) {
        dbm = 10 * Math.log10(dbm)
      }
      return new PowerRestriction(0, dbm)
    }

    /**
     * @param {boolean?} usemW
     * @returns {string}
     */
    toString (usemW) {
      return usemW ? `${(10 ** (this.max_eirp / 10)).toFixed()} mW` :
        `${this.max_eirp.toFixed()} dBm`
    }

    /**
     * @param {boolean?} usemW
     * @returns {number}
     */
    valueOf (usemW) {
      return (usemW ? 10 ** (this.max_eirp / 10) : this.max_eirp).toFixed()
    }
  }

  class Permission {
    /**
     * @param {FreqBand} freqband
     * @param {PowerRestriction} power
     * @param {string[]?} flags
     * @param {string?} wmmrule
     */
    constructor (freqband, power, flags, wmmrule) {
      /** @type {FreqBand} */
      this.freqband = freqband
      /** @type {PowerRestriction} */
      this.power = power
      /** @type {string[]?} */
      this.flags = flags
      if (this.flags) {
        this.flags.sort()
      }
      /** @type {string?} */
      this.wmmrule = wmmrule
    }

    /**
     * @param {string} str
     * @param {string?} comments
     * @returns {Permission}
     */
    static parse (str, comments) {
      const flags = str.split(',').map(s => s.trim())
      const freqband = flags.shift().slice(1, -1)
      const power = flags.shift().slice(1, -1)
      let wmmrule = null
      for (let i = 0; i < flags.length; i++) {
        if (flags[i].startsWith('wmmrule=')) {
          wmmrule = flags[i].slice(8)
          flags.splice(i, 1)
          break
        }
      }
      return new Permission(
        FreqBand.parse(freqband, comments),
        PowerRestriction.parse(power), flags, wmmrule)
    }

    toString () {
      return `${this.freqband} ${this.power} ${this.wmmrule}`
    }

    /**
     * @param {Channel} channel
     * @returns {boolean}
     */
    hasChannel (channel) {
      return this.freqband.hasChannel(channel)
    }
  }

  class Country {
    /**
     * @param {DFSRegion} dfs_region
     * @param {Permission[]} permissions
     * @param {string?} comments
     */
    constructor (dfs_region, permissions, comments) {
      /** @type {DFSRegion} */
      this.dfs_region = dfs_region
      /** @type {Permission[]} */
      this.permissions = permissions
      /** @type {string?} */
      this.comments = comments
    }

    /**
     * @param {Channel} channel
     * @returns {Permission?}
     */
    hasChannel (channel) {
      return this.permissions.find(p => p.hasChannel(channel))
    }
  }

  /**
   * @param {string} str
   * @returns {RegDB}
   */
  return function (str) {
    const lines = str.split('\n')
    /** @type {RegDB} */
    const countries = []
    /** @type {string[]} */
    let comments = []
    /** @type {string?} */
    let country = null
    /** @type {string?} */
    let dfs_region = null
    /** @type {Permission[]} */
    let permissions = []
    /** @type {string?} */
    let country_comments = null
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) {
      } else if (line.startsWith('#')) {
        comments.push(line.slice(1 + line.startsWith('# ')))
      } else if (!lines[i].startsWith('\t')) {
        if (country) {
          // store old block
          countries.push([
            country, new Country(dfs_region, permissions, country_comments)])
        }
        // process new block
        const header = line.split(':')
        country = header[0].startsWith('country') ? header[0].slice(8) : null
        dfs_region = header[1]?.trim()
        permissions = []
        country_comments = comments.join('\n') || null
        comments = []
      } else if (line.startsWith('(')) {
        permissions.push(Permission.parse(line, comments.join('\n') || null))
        comments = []
      }
    }
    return countries
  }
})()
