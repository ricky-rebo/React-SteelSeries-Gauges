class DataUtils {
  /**
   * 
   * @param data 
   * @param lang 
   */
  //FIXME destructure data object instead of use single attributes
  static parseLastRain = ({LastRainTipISO, dateFormat}: {LastRainTipISO: string, dateFormat: string}, lang: any) => {
    try {
      let [date, time] = LastRainTipISO.split(' '); 
      let dt = date.replace(/\//g, '-').split('-');  // WD uses dd/mm/yyyy, we use a '-'
      let tm = time.split(':');

      let then: Date;
      switch(dateFormat) {
        case 'y/m/d':   // ISO/Cumulus format
          then = new Date(+dt[0], +dt[1] - 1, +dt[2], +tm[0], +tm[1], 0, 0); break;

        case 'd/m/y':
          then = new Date(+dt[2], +dt[1] - 1, +dt[0], +tm[0], +tm[1], 0, 0); break;
        
        default:  // US format (mm/dd/yyyyy)
          then = new Date(+dt[2], +dt[0] - 1, +dt[1], +tm[0], +tm[1], 0, 0);
      }

      let today: Date = new Date();
      today.setHours(0, 0, 0, 0);
      if (then.getTime() >= today.getTime()) {
        return lang.LastRainedT_info + ' ' + tm;
      }
      else if (then.getTime() + 86400000 >= today.getTime()) {
        return lang.LastRainedY_info + ' ' + tm;
      }
      else {
        return then.getDate().toString() + ' ' + lang.months[then.getMonth()] + ' ' + lang.at + ' ' + time;
      }
    }
    catch(e) { return LastRainTipISO }
    
  }

  /**
   * //TODO
   * @param param0 
   * @param stationTimeout 
   * @param lang 
   */
  static isStationOffline = ({ timeUTC, SensorContactLost }: { timeUTC: string, SensorContactLost: string }, stationTimeout: number, lang: any) => {
    let now = Date.now();
    let tmp = timeUTC.split(',');
    //console.log("tmp: " + tmp);
    let sampleDate = Date.UTC(+tmp[0], +tmp[1] - 1, +tmp[2], +tmp[3], +tmp[4], +tmp[5]);

    let elapsedMins = Math.floor((now - sampleDate) / (1000 * 60));
    //console.log("now: " + now)
    //console.log("sample date: " + +sampleDate)
    //console.log("elapsed mins: " + elapsedMins)
    if(elapsedMins > stationTimeout) {
      let timeAgo: string;
      if(elapsedMins < 120) // up to 2 hours ago
        timeAgo = `${elapsedMins} ${lang.StatusMinsAgo}`;
      else if(elapsedMins < (2 * 24 * 60)) // up to 48 hours ago
        timeAgo = `${Math.floor(elapsedMins / 60)} ${lang.StatusHoursAgo}`;
      else // days ago
        timeAgo = `${Math.floor(elapsedMins / (60 * 24))} ${lang.StatusDaysAgo}`;
      return `${lang.led_title_offline} ${lang.StatusLastUpdate} ${timeAgo}`;
    }
    else if(+SensorContactLost === 1)
      return lang.led_title_lost;
    
    return null;
  }

  /**
   * //TODO 
   * @param param0 
   */
  static calcCloudbase = ({temp, tempunit, dew, cloudbaseunit}: {temp: string, tempunit: string, dew: string, cloudbaseunit: string}) => {
    var sprd = +temp - +dew;
    var cb = sprd * (tempunit[1] === 'C' ? 400 : 227.3); // cloud base in feet
    if (cloudbaseunit === 'm') {
        cb = +DataUtils.ft2m(cb);
    }
    return cb;
  }

  /**
   * convTempData() converts all the temperature values using the supplied conversion function
   * //TODO
   * @param data 
   */
  static convTempData = (data: any) => {
    const convFunc = data.tempunit[1] === 'C' ? DataUtils.c2f : DataUtils.f2c;
    data.apptemp = convFunc(data.apptemp);
    data.apptempTH = convFunc(data.apptempTH);
    data.apptempTL = convFunc(data.apptempTL);
    data.dew = convFunc(data.dew);
    data.dewpointTH = convFunc(data.dewpointTH);
    data.dewpointTL = convFunc(data.dewpointTL);
    data.heatindex = convFunc(data.heatindex);
    data.heatindexTH = convFunc(data.heatindexTH);
    data.humidex = convFunc(data.humidex);
    data.intemp = convFunc(data.intemp);
    if (data.intempTL && data.intempTH) {
        data.intempTL = convFunc(data.intempTL);
        data.intempTH = convFunc(data.intempTH);
    }
    data.temp = convFunc(data.temp);
    data.tempTH = convFunc(data.tempTH);
    data.tempTL = convFunc(data.tempTL);
    data.wchill = convFunc(data.wchill);
    data.wchillTL = convFunc(data.wchillTL);
    if (data.tempunit[1] === 'C') {
        data.temptrend = (+DataUtils.extractDecimal(data.temptrend) * 9 / 5).toFixed(1);
        data.tempunit = '°F';
    } else {
        data.temptrend = (+DataUtils.extractDecimal(data.temptrend) * 5 / 9).toFixed(1);
        data.tempunit = '°C';
    }

    //TODO REMOVE
    data.DEBUG = "TEMP DATA CONVERTED"
  }

  /**
   * convRainData() converts all the rain data units using the supplied conversion function
   * //TODO
   * @param data 
   */
  static convRainData = (data: any) => {
    const convFunc = data.rainunit === 'mm' ? DataUtils.in2mm : DataUtils.mm2in;
    data.rfall = convFunc(data.rfall);
    data.rrate = convFunc(data.rrate);
    data.rrateTM = convFunc(data.rrateTM);
    data.hourlyrainTH = convFunc(data.hourlyrainTH);
    data.rainunit = data.rainunit === 'mm' ? 'in' : 'mm';

    //TODO REMOVE
    data.DEBUG += "\nRAIN DATA CONVERTED";
  }

  /**
   * convWindData() converts all the wind values using the supplied conversion function
   * //TODO
   * @param data
   * @param to 
   */
  static convWindData = function (data: any, to: string) {
    const from = data.windunit;
    let fromFunc1, toFunc1,
        fromFunc2, toFunc2;
    const dummy = (val: any) => val;

    // convert to m/s & km
    switch (from) {
      case 'mph':
          fromFunc1 = DataUtils.mph2ms;
          fromFunc2 = DataUtils.miles2km;
          break;
      case 'kts':
          fromFunc1 = DataUtils.kts2ms;
          fromFunc2 = DataUtils.nmiles2km;
          break;
      case 'km/h':
          fromFunc1 = DataUtils.kmh2ms;
          fromFunc2 = dummy;
          break;
      case 'm/s':
      // falls through
      default:
          fromFunc1 = dummy;
          fromFunc2 = dummy;
    }
    // conversion function from km to required units
    switch (to) {
      case 'mph':
          toFunc1 = DataUtils.ms2mph;
          toFunc2 = DataUtils.km2miles;
          break;
      case 'kts':
          toFunc1 = DataUtils.ms2kts;
          toFunc2 = DataUtils.km2nmiles;
          break;
      case 'km/h':
          toFunc1 = DataUtils.ms2kmh;
          toFunc2 = dummy;
          break;
      case 'm/s':
      // falls through
      default:
          toFunc1 = dummy;
          toFunc2 = dummy;
    }
    // do the conversions
    data.wgust = toFunc1(fromFunc1(data.wgust));
    data.wgustTM = toFunc1(fromFunc1(data.wgustTM));
    data.windTM = toFunc1(fromFunc1(data.windTM));
    data.windrun = toFunc2(fromFunc2(data.windrun));
    data.wlatest = toFunc1(fromFunc1(data.wlatest));
    data.wspeed = toFunc1(fromFunc1(data.wspeed));
    data.windunit = to;
  }

  /**
   * convBaroData() converts all the pressure values using the supplied conversion function
   * @param data 
   * @param to 
   */
  static convBaroData = function (data: any, to: string) {
    let fromFunc, toFunc;
    const dummy = (val: any) => val;

    // convert to hPa
    switch (data.pressunit) {
      case 'hPa':
      case 'mb':
        fromFunc = dummy;
        break;
      case 'inHg':
        fromFunc = DataUtils.inhg2hpa;
        break;
      case 'kPa':
        fromFunc = DataUtils.kpa2hpa;
        break;
      default:
        throw "Invalid starting unit!";
    }
    // convert to required units
    switch (to) {
      case 'hPa':
      // falls through
      case 'mb':
        toFunc = dummy;
        break;
      case 'inHg':
        toFunc = DataUtils.hpa2inhg;
        break;
      case 'kPa':
        toFunc = DataUtils.hpa2kpa;
        break;
      default:
        throw "Invalid conversion unit!";
    }

    data.press = toFunc(fromFunc(data.press));
    data.pressH = toFunc(fromFunc(data.pressH));
    data.pressL = toFunc(fromFunc(data.pressL));
    data.pressTH = toFunc(fromFunc(data.pressTH));
    data.pressTL = toFunc(fromFunc(data.pressTL));
    data.presstrendval = toFunc(fromFunc(data.presstrendval), 3);
    data.pressunit = to;
  }

  /**
   * convCloudBaseData() converts all the cloud base data units using the supplied conversion function
   * @param data 
   */
  static convCloudBaseData = (data: any) => {
    const convFunc = data.cloudbaseuni === 'm' ? DataUtils.ft2m : DataUtils.m2ft;
    data.cloudbasevalue = convFunc(data.cloudbasevalue);
    data.cloudbaseunit = data.cloudbaseuni === 'm' ? 'ft' : 'm';
  }


  // ======================================
  // ===        UNITS CONVERSION        ===
  // ======================================

  // Celsius to Fahrenheit
  static c2f = (val: any) => (DataUtils.extractDecimal(val) * 9 / 5 + 32).toFixed(1)
  
  // Fahrenheit to Celsius
  static f2c = (val: any) => ((DataUtils.extractDecimal(val) - 32) * 5 / 9).toFixed(1)

  // mph to ms
  static mph2ms = (val: any) => (DataUtils.extractDecimal(val) * 0.447).toFixed(1)
  
  // knots to ms
  static kts2ms = (val: any) => (DataUtils.extractDecimal(val) * 0.515).toFixed(1)

  // kph to ms
  static kmh2ms = (val: any) => (DataUtils.extractDecimal(val) * 0.2778).toFixed(1)

  // ms to kts
  static ms2kts = (val: any) => (DataUtils.extractDecimal(val) * 1.9426).toFixed(1)

  // ms to mph
  static ms2mph = (val: any) => (DataUtils.extractDecimal(val) * 2.237).toFixed(1)

  // ms to kph
  static ms2kmh = (val: any) => (DataUtils.extractDecimal(val) * 3.6).toFixed(1)

  // mm to inches
  static mm2in = (val: any) => (DataUtils.extractDecimal(val) / 25.4).toFixed(2)

  // inches to mm
  static in2mm = (val: any) => (DataUtils.extractDecimal(val) * 25.4).toFixed(1)

  // miles to km
  static miles2km = (val: any) => (DataUtils.extractDecimal(val) * 1.609344).toFixed(1)

  // nautical miles to km
  static nmiles2km = (val: any) => (DataUtils.extractDecimal(val) * 1.85200).toFixed(1)

  // km to miles
  static km2miles = (val: any) => (DataUtils.extractDecimal(val) / 1.609344).toFixed(1)

  // km to nautical miles
  static km2nmiles = (val: any) => (DataUtils.extractDecimal(val) / 1.85200).toFixed(1)

  // hPa to inHg (@0°C)
  static hpa2inhg = (val: any, decimals?: number) => (DataUtils.extractDecimal(val) * 0.029528744).toFixed(decimals || 3)

  // inHg to hPa (@0°C)
  static inhg2hpa = (val: any) => (DataUtils.extractDecimal(val) / 0.029528744).toFixed(1)
  
  // kPa to hPa
  static kpa2hpa = (val: any) => (DataUtils.extractDecimal(val) * 10).toFixed(1)

  // hPa to kPa
  static hpa2kpa = (val: any, decimals?: number) => (DataUtils.extractDecimal(val) / 10).toFixed(decimals || 2)

  // m to ft
  static m2ft = (val: any) => (val * 3.2808399).toFixed(0)

  //feet to meters
  static ft2m = (val: number) => (val / 3.2808399).toFixed(0)



  // =======================================
  // ===         OTHER FUNCTIONS         ===
  // =======================================
  /**
   * extractDecimal() returns a decimal number from a string, the decimal point can be either a dot or a comma
   * it ignores any text such as pre/appended units
   * @param str 
   * @param errVal 
   */
  static extractDecimal = (str: string|number, errVal?: number) => {
    let newStr = str.toString();
    let val;
    if(val = (/[-+]?[0-9]+\.?[0-9]*/).exec(newStr.replace(',', '.')))
      return +val[0];
    
    return errVal || -9999; // error condition
  }

  /**
   * extractInteger() returns an integer from a string
   * it ignores any text such as pre/appended units
   * @param str 
   * @param errVal 
   */
  static extractInteger = (str: string, errVal?: number) => {
    let val;
    if(val = (/[-+]?[0-9]+/).exec(str))
      return +val[0];
    
    return errVal || -9999;
  }

  /**
   * 
   * @param spdUnits 
   */
  static getWindrunUnits = function (spdUnits: string) {
    switch (spdUnits) {
      case 'mph': return 'miles';
      case 'kts': return 'n.miles';
      case 'km/h':
      case 'm/s':
      default: return 'km';
    }
  }
}

export default DataUtils;