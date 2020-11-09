// @ts-ignore
import LANG from './language';

const TMP_CONFIG = {
  stationTimeout: 15,
  weatherProgram : 0
}

export default class GaugesController {
  config: any;
  lang: any;

  data: object;

  tickTockInterval: NodeJS.Timeout;
  getDataInterval: NodeJS.Timeout;

  constructor(/*config: configDef*/) {
    //this.config = config;
    //this.getRealTime();
    this.config = TMP_CONFIG;
    this.lang = LANG.EN;

  }

  init = () => {
    //Todo
  }

  getRealTime = () => {
    fetch("/customclientraw.txt")
    .then(res => res.json())
    .then(this.processData, this.processErr);
  }

  processData = (data: any) => {
    //TODO add check on realTimeVer!
    if(true) {  
      if (typeof data.dateFormat === 'undefined') {
        data.dateFormat = 'y/m/d';
      }
      else {
          // frig for WD bug which leaves a trailing % character from the tag
          data.dateFormat = data.dateFormat.replace('%', '');
      }

      // mainpulate the last rain time into something more friendly
      data.LastRained = DataUtils.parseLastRain(data.LastRainTipISO, data.dateFormat, this.lang);

      if (data.tempunit.length > 1) {
        // clean up temperature units - remove html encoded degree symbols
        data.tempunit = data.tempunit.replace(/&\S*;/, '°');  // old Cumulus versions uses &deg;, WeatherCat uses &#176;
      } else {
          // using new realtimegaugesT.txt with Cumulus > 1.9.2
          data.tempunit = '°' + data.tempunit;
      }

      let stationOffMsg: string;
      if(stationOffMsg = DataUtils.isStationOffline(data, this.config.stationTimeout, this.lang)) {
        /*TODO
        **  set led to red
        **  set led title - use stationOffMsg.trim(' ')[0]
        */
       data.forecast = stationOffMsg;
      }

      // de-encode the forecast string if required (Cumulus support for extended characters)
      data.forecast = stripHtml(data.forecast).trim();

      // WView sends ' in', ' mb', or ' hPa'
      data.pressunit = data.pressunit.trim();  
      if (data.pressunit === 'in')  // Cumulus and WView send 'in'
        data.pressunit = 'inHg';

      // WView sends ' kmh' etc
      // WeatherCat sends "MPH"
      data.windunit = data.windunit.trim().toLowerCase();
      // WeatherCat/weewx send "Knots", we use "kts"
      if (data.windunit === 'knots') 
        data.windunit = 'kts'; 
      
      // WD wind unit omits '/', weewx sends 'kph' 
      if (data.windunit === 'kmh' || data.windunit === 'kph')
        data.windunit = 'km/h'; 

      // WView sends ' mm' etc
      data.rainunit = data.rainunit.trim(); 

      // change WeatherCat units from Metres/Feet to m/ft
      try {
        if (data.cloudbaseunit.toLowerCase() === 'metres') 
          data.cloudbaseunit = 'm';
        else if (data.cloudbaseunit.toLowerCase() === 'feet')
          data.cloudbaseunit = 'ft';
        
      }
      catch (e) { data.cloudbaseunit = ''; }
      //TODO add check if cloud gauge is present
      if (true && (
        (this.config.weatherProgram === 4 || this.config.weatherProgram === 5) ||
        data.cloudbasevalue === '')) {
        // WeatherCat and VWS (and WView?) do not provide a cloud base value, so we have to calculate it...
        // assume if the station uses an imperial wind speed they want cloud base in feet, otherwise metres
        data.cloudbaseunit = (data.windunit === 'mph' || data.windunit === 'kts') ? 'ft' : 'm';
        data.cloudbasevalue = DataUtils.calcCloudbase(data);
    }

    //RIPRENDERE DA RIGA 2927



      // ===========================================
      // ===        END DATA PROCESSING          ===
      // ===========================================
    }
    else {
      //TODO add wrong realTimeVer error handling
    }

    console.log(data);
  }

  processErr = (err: any) => {
    //TODO add fetch error handling
    console.log("[ERR] " + err);
  }
}

class DataUtils {
  //TODO documentare
  static parseLastRain = (lastRainISO: any, dateFormat: string, lang: any) => {
    try {
      let [date, time] = lastRainISO.split(' '); 
      let dt = date.replace(/\//g, '-').split('-');  // WD uses dd/mm/yyyy, we use a '-'
      let tm = time.split(':');

      let then: Date;
      switch(dateFormat) {
        case 'y/m/d':   // ISO/Cumulus format
          then = new Date(dt[0], dt[1] - 1, dt[2], tm[0], tm[1], 0, 0); break;

        case 'd/m/y':
          then = new Date(dt[2], dt[1] - 1, dt[0], tm[0], tm[1], 0, 0); break;
        
        default:  // US format (mm/dd/yyyyy)
          then = new Date(dt[2], dt[0] - 1, dt[1], tm[0], tm[1], 0, 0);
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
    catch(e) { return lastRainISO }
    
  }

  //TODO documentare
  static isStationOffline = ({ timeUTC, SensorContactLost }: { timeUTC: string, SensorContactLost: string }, stationTimeout: number, lang: any) => {
    let now = Date.now();
    let tmp = +timeUTC.split(',');
    let sampleDate = Date.UTC(tmp[0], tmp[1] - 1, tmp[2], tmp[3], tmp[4], tmp[5]);

    let elapsedMins: number
    if((elapsedMins = Math.floor((now - sampleDate) / (1000 * 60))) > stationTimeout) {
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

  //TODO documentare
  static calcCloudbase = ({temp, tempunit, dew, cloudbaseunit}: {temp: string, tempunit: string, dew: string, cloudbaseunit: string}) => {
    var sprd = +temp - +dew;
    var cb = sprd * (tempunit[1] === 'C' ? 400 : 227.3); // cloud base in feet
    if (cloudbaseunit === 'm') {
        cb = +DataUtils.ft2m(cb);
    }
    return cb;
  }

  // =====================================
  // ===        DATA CONVERSION        ===
  // =====================================
  static ft2m = (val: number) => (val / 3.2808399).toFixed(0)
}

/*
const minsToMillis = (mins: number) => {
  return mins * 60 * 1000;
}
const millisToMins = (millis: number) => {
  return Math.floor(millis / (1000 * 60));
}
*/
const stripHtml = (html: string) => {
  // Create a new div element
  var temporalDivElement = document.createElement("div");
  // Set the HTML content with the providen
  temporalDivElement.innerHTML = html;
  // Retrieve the text property of the element (cross-browser support)
  return temporalDivElement.textContent || temporalDivElement.innerText || "";
}