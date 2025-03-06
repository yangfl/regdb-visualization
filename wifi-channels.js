'use strict'

class Interval {
  /**
   * @param {number|Interval} start
   * @param {number?} end
   */
  constructor (start, end) {
    if (start instanceof Interval) {
      /** @type {number} */
      this.start = start.start
      /** @type {number} */
      this.end = start.end
    } else {
      this.start = start
      this.end = end
    }
  }

  get length () {
    return this.end - this.start
  }

  /**
   * @param {number} other
   * @returns {boolean}
   */
  contains (value) {
    return this.start <= value && value <= this.end
  }

  /**
   * @param {Interval?} other
   * @returns {boolean}
   */
  supersetOf (other) {
    return !other || (this.start <= value.start && value.end <= this.end)
  }

  /**
   * @param {Interval?} other
   * @returns {Interval}
   */
  union (other) {
    return other ?
      new Interval(Math.min(this.start, other.start),
                   Math.max(this.end, other.end)) : new Interval(this)
  }

  /**
   * @param {Interval?} other
   * @returns {Interval?}
   */
  intersection (other) {
    if (!other || other.end < this.start || this.end < other.start) {
      return null
    }
    return new Interval(Math.max(this.start, other.start),
                        Math.min(this.end, other.end))
  }

  /**
   * @param {Interval?} other
   * @returns {number}
   */
  overlaps (other) {
    if (!other || other.end < this.start || this.end < other.start) {
      return 0
    }
    return other.end === this.start || this.end === other.start ? 2 : 1
  }
}

const wifiChannels = (function () {
  class Band {
    static BAND_2G4 = new Band('2.4G', '24w')
    static BAND_2G4JP = new Band('2.4G JP', '24jp')
    static BAND_5G0 = new Band('5.0G', '50')
    static BAND_5G2 = new Band('5.2G', '52')
    static BAND_5G5 = new Band('5.5G', '55')
    static BAND_5G7 = new Band('5.7G', '57')
    static BAND_5G8 = new Band('5.8G', '58')
    static BAND_5G9 = new Band('5.9G', '59')
    static BAND_6G_LOWER = new Band('6G lower', '6l')
    static BAND_6G_UPPER = new Band('6G upper', '6u')
    static BAND_60G_WELLKNOWN = new Band('60G well-known', '60w')
    static BAND_60G_OTHER = new Band('60G other', '60o')

    /**
     * @param {string} name
     * @param {string} value
     */
    constructor (name, value) {
      /** @type {string} */
      this.name = name
      /** @type {string} */
      this.value = value
    }

    toString () {
      return this.name
    }
  }

  class Channel extends Interval {
    /**
     * @param {number} channel
     * @param {number} start
     * @param {number} end
     * @param {Band} band
     */
    constructor (channel, start, end, band) {
      super(start, end)
      /** @type {number} */
      this.channel = channel
      /** @type {Band} */
      this.band = band
    }

    get center () {
      return (this.start + this.end) / 2
    }

    get bw () {
      return this.length
    }

    toString () {
      return `<Channel ${this.channel}: ${this.center} (${this.start}-${this.end})>`
    }

    valueOf () {
      return this.center
    }

    /**
     * @param {number} other
     * @returns {number}
     */
    compare (other) {
      return this.start - other.lower
    }
  }

  return [
    [1, 2402, 2422, Band.BAND_2G4],
    [2, 2407, 2427, Band.BAND_2G4],
    [3, 2412, 2432, Band.BAND_2G4],
    [4, 2417, 2437, Band.BAND_2G4],
    [5, 2422, 2442, Band.BAND_2G4],
    [6, 2427, 2447, Band.BAND_2G4],
    [7, 2432, 2452, Band.BAND_2G4],
    [8, 2437, 2457, Band.BAND_2G4],
    [9, 2442, 2462, Band.BAND_2G4],
    [10, 2447, 2467, Band.BAND_2G4],
    [11, 2452, 2472, Band.BAND_2G4],
    [12, 2457, 2477, Band.BAND_2G4],
    [13, 2462, 2482, Band.BAND_2G4],
    [14, 2474, 2494, Band.BAND_2G4JP],
    [7, 5030, 5040, Band.BAND_5G0],
    [8, 5030, 5050, Band.BAND_5G0],
    [9, 5040, 5050, Band.BAND_5G0],
    [11, 5050, 5060, Band.BAND_5G0],
    [12, 5050, 5070, Band.BAND_5G0],
    [16, 5070, 5090, Band.BAND_5G0],
    [32, 5150, 5170, Band.BAND_5G2],
    [34, 5150, 5190, Band.BAND_5G2],
    [36, 5170, 5190, Band.BAND_5G2],
    [38, 5170, 5210, Band.BAND_5G2],
    [40, 5190, 5210, Band.BAND_5G2],
    [42, 5170, 5250, Band.BAND_5G2],
    [44, 5210, 5230, Band.BAND_5G2],
    [46, 5210, 5250, Band.BAND_5G2],
    [48, 5230, 5250, Band.BAND_5G2],
    [50, 5170, 5330, Band.BAND_5G2],
    [52, 5250, 5270, Band.BAND_5G2],
    [54, 5250, 5290, Band.BAND_5G2],
    [56, 5270, 5290, Band.BAND_5G2],
    [58, 5250, 5330, Band.BAND_5G2],
    [60, 5290, 5310, Band.BAND_5G2],
    [62, 5290, 5330, Band.BAND_5G2],
    [64, 5310, 5330, Band.BAND_5G2],
    [68, 5330, 5350, Band.BAND_5G2],
    [96, 5470, 5490, Band.BAND_5G5],
    [100, 5490, 5510, Band.BAND_5G5],
    [102, 5490, 5530, Band.BAND_5G5],
    [104, 5510, 5530, Band.BAND_5G5],
    [106, 5490, 5570, Band.BAND_5G5],
    [108, 5530, 5550, Band.BAND_5G5],
    [110, 5530, 5570, Band.BAND_5G5],
    [112, 5550, 5570, Band.BAND_5G5],
    [114, 5490, 5650, Band.BAND_5G5],
    [116, 5570, 5590, Band.BAND_5G5],
    [118, 5570, 5610, Band.BAND_5G5],
    [120, 5590, 5610, Band.BAND_5G5],
    [122, 5570, 5650, Band.BAND_5G5],
    [124, 5610, 5630, Band.BAND_5G5],
    [126, 5610, 5650, Band.BAND_5G5],
    [128, 5630, 5650, Band.BAND_5G5],
    [132, 5650, 5670, Band.BAND_5G7],
    [134, 5650, 5690, Band.BAND_5G7],
    [136, 5670, 5690, Band.BAND_5G7],
    [138, 5650, 5730, Band.BAND_5G7],
    [140, 5690, 5710, Band.BAND_5G7],
    [142, 5690, 5730, Band.BAND_5G7],
    [144, 5710, 5730, Band.BAND_5G7],
    [149, 5735, 5755, Band.BAND_5G8],
    [151, 5735, 5775, Band.BAND_5G8],
    [153, 5755, 5775, Band.BAND_5G8],
    [155, 5735, 5815, Band.BAND_5G8],
    [157, 5775, 5795, Band.BAND_5G8],
    [159, 5775, 5815, Band.BAND_5G8],
    [161, 5795, 5815, Band.BAND_5G8],
    [165, 5815, 5835, Band.BAND_5G8],
    [169, 5835, 5855, Band.BAND_5G8],
    [173, 5855, 5875, Band.BAND_5G8],
    [182, 5905, 5915, Band.BAND_5G9],
    [183, 5905, 5925, Band.BAND_5G9],
    [184, 5915, 5925, Band.BAND_5G9],
    [187, 5930, 5940, Band.BAND_5G9],
    [188, 5930, 5950, Band.BAND_5G9],
    [189, 5940, 5950, Band.BAND_5G9],
    [192, 5950, 5970, Band.BAND_5G9],
    [196, 5970, 5990, Band.BAND_5G9],
    [1, 5945, 5965, Band.BAND_6G_LOWER],
    [5, 5965, 5985, Band.BAND_6G_LOWER],
    [9, 5985, 6005, Band.BAND_6G_LOWER],
    [13, 6005, 6025, Band.BAND_6G_LOWER],
    [17, 6025, 6045, Band.BAND_6G_LOWER],
    [21, 6045, 6065, Band.BAND_6G_LOWER],
    [25, 6065, 6085, Band.BAND_6G_LOWER],
    [29, 6085, 6105, Band.BAND_6G_LOWER],
    [33, 6105, 6125, Band.BAND_6G_LOWER],
    [37, 6125, 6145, Band.BAND_6G_LOWER],
    [41, 6145, 6165, Band.BAND_6G_LOWER],
    [45, 6165, 6185, Band.BAND_6G_LOWER],
    [49, 6185, 6205, Band.BAND_6G_LOWER],
    [53, 6205, 6225, Band.BAND_6G_LOWER],
    [57, 6225, 6245, Band.BAND_6G_LOWER],
    [61, 6245, 6265, Band.BAND_6G_LOWER],
    [65, 6265, 6285, Band.BAND_6G_LOWER],
    [69, 6285, 6305, Band.BAND_6G_LOWER],
    [73, 6305, 6325, Band.BAND_6G_LOWER],
    [77, 6325, 6345, Band.BAND_6G_LOWER],
    [81, 6345, 6365, Band.BAND_6G_LOWER],
    [85, 6365, 6385, Band.BAND_6G_LOWER],
    [89, 6385, 6405, Band.BAND_6G_LOWER],
    [93, 6405, 6425, Band.BAND_6G_LOWER],
    [97, 6425, 6445, Band.BAND_6G_UPPER],
    [101, 6445, 6465, Band.BAND_6G_UPPER],
    [105, 6465, 6485, Band.BAND_6G_UPPER],
    [109, 6485, 6505, Band.BAND_6G_UPPER],
    [113, 6505, 6525, Band.BAND_6G_UPPER],
    [117, 6525, 6545, Band.BAND_6G_UPPER],
    [121, 6545, 6565, Band.BAND_6G_UPPER],
    [125, 6565, 6585, Band.BAND_6G_UPPER],
    [129, 6585, 6605, Band.BAND_6G_UPPER],
    [133, 6605, 6625, Band.BAND_6G_UPPER],
    [137, 6625, 6645, Band.BAND_6G_UPPER],
    [141, 6645, 6665, Band.BAND_6G_UPPER],
    [145, 6665, 6685, Band.BAND_6G_UPPER],
    [149, 6685, 6705, Band.BAND_6G_UPPER],
    [153, 6705, 6725, Band.BAND_6G_UPPER],
    [157, 6725, 6745, Band.BAND_6G_UPPER],
    [161, 6745, 6765, Band.BAND_6G_UPPER],
    [165, 6765, 6785, Band.BAND_6G_UPPER],
    [169, 6785, 6805, Band.BAND_6G_UPPER],
    [173, 6805, 6825, Band.BAND_6G_UPPER],
    [177, 6825, 6845, Band.BAND_6G_UPPER],
    [181, 6845, 6865, Band.BAND_6G_UPPER],
    [185, 6865, 6885, Band.BAND_6G_UPPER],
    [189, 6885, 6905, Band.BAND_6G_UPPER],
    [193, 6905, 6925, Band.BAND_6G_UPPER],
    [197, 6925, 6945, Band.BAND_6G_UPPER],
    [201, 6945, 6965, Band.BAND_6G_UPPER],
    [205, 6965, 6985, Band.BAND_6G_UPPER],
    [209, 6985, 7005, Band.BAND_6G_UPPER],
    [213, 7005, 7025, Band.BAND_6G_UPPER],
    [217, 7025, 7045, Band.BAND_6G_UPPER],
    [221, 7045, 7065, Band.BAND_6G_UPPER],
    [225, 7065, 7085, Band.BAND_6G_UPPER],
    [229, 7085, 7105, Band.BAND_6G_UPPER],
    [233, 7105, 7125, Band.BAND_6G_UPPER],
    [1, 57240, 59400, Band.BAND_60G_WELLKNOWN],
    [2, 59400, 61560, Band.BAND_60G_WELLKNOWN],
    [3, 61560, 63720, Band.BAND_60G_WELLKNOWN],
    [4, 63720, 65880, Band.BAND_60G_WELLKNOWN],
    [5, 65880, 68040, Band.BAND_60G_OTHER],
    [6, 68040, 70200, Band.BAND_60G_OTHER],
    [9, 57240, 61560, Band.BAND_60G_OTHER],
    [10, 59400, 63720, Band.BAND_60G_OTHER],
    [11, 61560, 65880, Band.BAND_60G_OTHER],
    [12, 63720, 68040, Band.BAND_60G_OTHER],
    [13, 65880, 70200, Band.BAND_60G_OTHER],
    [17, 57240, 63720, Band.BAND_60G_OTHER],
    [18, 59400, 65880, Band.BAND_60G_OTHER],
    [19, 61560, 68040, Band.BAND_60G_OTHER],
    [20, 63720, 70020, Band.BAND_60G_OTHER],
    [25, 57240, 65880, Band.BAND_60G_OTHER],
    [26, 59400, 68040, Band.BAND_60G_OTHER],
    [27, 61560, 70200, Band.BAND_60G_OTHER]
  ].sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0])
  .map(x => new Channel(...x))
})()
