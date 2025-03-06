'use strict'

/**
 * @typedef {Object} CountryCode
 * @property {string} countryNameEn
 * @property {string} countryNameLocal
 * @property {string} countryCode
 * @property {string} currencyCode
 * @property {string} currencyNameEn
 * @property {string} tinType
 * @property {string} tinName
 * @property {string} officialLanguageCode
 * @property {string} officialLanguageNameEn
 * @property {string} officialLanguageNameLocal
 * @property {string} countryCallingCode
 * @property {string} region
 * @property {string} flag
 */

const CountryCodes = {
  /** @type {CountryCode[]} */
  data: module.exports,
  /** @type {Map<string, CountryCode>} */
  dict: new Map({
    [Symbol.iterator]: function* () {
      for (let i = 0; i < module.exports.length; i++) {
        const datum = module.exports[i]
        yield [datum['countryCode'], datum]
        yield [datum['countryNameEn'], datum]
        // yield [datum['countryNameLocal'], datum]
      }
    }
  }),

  /**
   * Find a country by a property and return the first match
   * @param {string} value - The value to use in the filter
   * @param {string?} property - The property to use in the search. Must
   *  be any of the country properties (countryCode, currencyCode, etc)
   * @returns {CountryCode?}
   */
  get (value, property) {
    return property ?
      this.data.find(datum => datum[property] === value) : this.dict.get(value)
  },
}
