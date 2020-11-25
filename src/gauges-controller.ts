// @ts-ignore
import LANG from './language';
// @ts-ignore
import steelseries from './libs/steelseries';
import DataUtils from './utils/data-utils';
import { Config } from './interfaces/config';

const DEF_CONFIG = {
  weatherProgram     : 1,                      // Set 0=Cumulus, 1=Weather Display, 2=VWS, 3=WeatherCat, 4=Meteobridge, 5=WView, 6=WeeWX, 7=WLCOM
  imgPathURL         : './images/',            // *** Change this to the relative path for your 'Trend' graph images
  oldGauges          : 'gauges.htm',           // *** Change this to the relative path for your 'old' gauges page.
  realtimeInterval   : 15,                     // *** Download data interval, set to your realtime data update interval in seconds
  longPoll           : false,                  // if enabled, use long polling and PHP generated data !!only enable if you understand how this is implemented!!
  gaugeScaling       : 1,
  gaugeMobileScaling : 0.85,                   // scaling factor to apply when displaying the gauges mobile devices, set to 1 to disable (default 0.85)
  graphUpdateTime    : 15,                     // period of pop-up data graph refresh, in minutes (default 15)
  stationTimeout     : 3,                      // period of no data change before we declare the station off-line, in minutes (default 3)
  pageUpdateLimit    : 20,                     // period after which the page stops automatically updating, in minutes (default 20),
                                               // - set to 0 (zero) to disable this feature
  pageUpdatePswd     : 'its-me',               // password to over ride the page updates time-out, do not set to blank even if you do not use a password - http://<URL>&pageUpdate=its-me
  digitalFont        : false,                  // Font control for the gauges & timer
  digitalForecast    : false,                  // Font control for the status display, set this to false for languages that use accented characters in the forecasts
  showPopupData      : true,                   // Pop-up data displayed
  showPopupGraphs    : true,                   // If pop-up data is displayed, show the graphs?
  mobileShowGraphs   : false,                  // If false, on a mobile/narrow display, always disable the graphs
  showWindVariation  : true,                   // Show variation in wind direction over the last 10 minutes on the direction gauge
  showWindMetar      : false,                  // Show the METAR substring for wind speed/direction over the last 10 minutes on the direction gauge popup
  showIndoorTempHum  : true,                   // Show the indoor temperature/humidity options
  showCloudGauge     : true,                   // Display the Cloud Base gauge
  showUvGauge        : true,                   // Display the UV Index gauge
  showSolarGauge     : true,                   // Display the Solar gauge
  showSunshineLed    : true,                   // Show 'sun shining now' LED on solar gauge
  showRoseGauge      : true,                   // Show the optional Wind Rose gauge
  showRoseGaugeOdo   : true,                   // Show the optional Wind Rose gauge wind run Odometer
  showRoseOnDirGauge : true,                   // Show the rose data as sectors on the direction gauge
  showGaugeShadow    : true,                   // Show a drop shadow outside the gauges
  roundCloudbaseVal  : true,                   // Round the value shown on the cloud base gauge to make it easier to read
                                               // The realtime files should be absolute paths, "/xxx.txt" refers to the public root of your web server
  realTimeUrlLongPoll: 'realtimegauges-longpoll.php',     // *** ALL Users: If using long polling, change to your location of the PHP long poll realtime file ***
                                                          // *** the supplied file is for Cumulus only

  realTimeUrl        : 'customclientraw.txt',    // *** WD Users: Change to your location of the ccr file ***
  useCookies         : true,                   // Persistently store user preferences in a cookie?
  tipImages          : [],
  dashboardMode      : false,                  // Used by Cumulus MX dashboard - SET TO FALSE OTHERWISE
  dewDisplayType     : 'app'                   // Initial 'scale' to display on the 'dew point' gauge.
                                               // 'dew' - Dewpoint
                                               // 'app' - Apparent temperature
                                               // 'wnd' - Wind Chill
                                               // 'hea' - Heat Index
                                               // 'hum' - Humidex
}

const DEF_UNITS = {
  temp   : '°C',
  rain   : 'mm',
  press  : 'hPa',
  wind   : 'km/h',
  windrun: 'km',
  cloud  : 'm'
}

export default class GaugesController {
  config: Config;
  gaugeGlobals: any;
  commonParams: any;

  lang: any;

  data: any;

  gauges: string[];
  gaugesUpdate: any[];

  //tickTockInterval: NodeJS.Timeout;
  //getDataInterval: NodeJS.Timeout;
  
  displayUnits: { temp: string; rain: string; press: string; wind: string; windrun: string; cloud: string; };
  userUnitsSet: boolean;
  firstRun: any;

  led: any;
  statusScroller: any;
  statusTimer: any;

  constructor(/*config: configDef*/) {
    //this.config = config;
    //this.getRealTime();
    this.config = DEF_CONFIG;
    this.lang = LANG.IT;
    this.data = {};

    this.gauges = [];
    this.gaugesUpdate = [];

    // Gauge global look'n'feel settings
    this.gaugeGlobals = {
      minMaxArea            : 'rgba(212,132,134,0.3)', // area sector for today's max/min. (red, green, blue, transparency)
      windAvgArea           : 'rgba(132,212,134,0.3)',
      windVariationSector   : 'rgba(120,200,120,0.7)', // only used when rose data is shown on direction gauge
      frameDesign           : steelseries.FrameDesign.TILTED_GRAY,
      background            : steelseries.BackgroundColor.BEIGE,
      foreground            : steelseries.ForegroundType.TYPE1,
      pointer               : steelseries.PointerType.TYPE8,
      pointerColour         : steelseries.ColorDef.RED,
      dirAvgPointer         : steelseries.PointerType.TYPE8,
      dirAvgPointerColour   : steelseries.ColorDef.BLUE,
      gaugeType             : steelseries.GaugeType.TYPE4,
      lcdColour             : steelseries.LcdColor.STANDARD,
      knob                  : steelseries.KnobType.STANDARD_KNOB,
      knobStyle             : steelseries.KnobStyle.SILVER,
      labelFormat           : steelseries.LabelNumberFormat.STANDARD,
      tickLabelOrientation  : steelseries.TickLabelOrientation.HORIZONTAL, // was .NORMAL up to v1.6.4
      rainUseSectionColours : false,                                       // Only one of these colour options should be true
      rainUseGradientColours: false,                                       // Set both to false to use the pointer colour
      tempTrendVisible      : true,
      pressureTrendVisible  : true,
      uvLcdDecimals         : 1,
      // sunshine threshold values
      sunshineThreshold     : 50,    // the value in W/m² above which we can consider the Sun to be shining, *if* the current value exceeds...
      sunshineThresholdPct  : 75,    // the percentage of theoretical solar irradiance above which we consider the Sun to be shining
      // default gauge ranges - before auto-scaling/ranging
      tempScaleDefMinC      : -20,
      tempScaleDefMaxC      : 40,
      tempScaleDefMinF      : 0,
      tempScaleDefMaxF      : 100,
      baroScaleDefMinhPa    : 990,
      baroScaleDefMaxhPa    : 1030,
      baroScaleDefMinkPa    : 99,
      baroScaleDefMaxkPa    : 103,
      baroScaleDefMininHg   : 29.2,
      baroScaleDefMaxinHg   : 30.4,
      windScaleDefMaxMph    : 20,
      windScaleDefMaxKts    : 20,
      windScaleDefMaxMs     : 10,
      windScaleDefMaxKmh    : 30,
      rainScaleDefMaxmm     : 10,
      rainScaleDefMaxIn     : 0.5,
      rainRateScaleDefMaxmm : 10,
      rainRateScaleDefMaxIn : 0.5,
      uvScaleDefMax         : 10,             // Northern Europe may be lower - max. value recorded in the UK is 8, so use a scale of 10 for UK
      solarGaugeScaleMax    : 1000,           // Max value to be shown on the solar gauge - theoretical max without atmosphere ~ 1374 W/m²
                                              // - but Davis stations can read up to 1800, use 1000 for Northern Europe?
      cloudScaleDefMaxft    : 3000,
      cloudScaleDefMaxm     : 1000,
      shadowColour          : 'rgba(0,0,0,0.3)'  // Colour to use for gauge shadows - default 30% transparent black
    }

    // Common parameters for all the SteelSeries gauges
    this.commonParams = {
        fullScaleDeflectionTime: 4,             // Bigger numbers (seconds) slow the gauge pointer movements more
        gaugeType              : this.gaugeGlobals.gaugeType,
        minValue               : 0,
        niceScale              : true,
        ledVisible             : false,
        frameDesign            : this.gaugeGlobals.frameDesign,
        backgroundColor        : this.gaugeGlobals.background,
        foregroundType         : this.gaugeGlobals.foreground,
        pointerType            : this.gaugeGlobals.pointer,
        pointerColor           : this.gaugeGlobals.pointerColour,
        knobType               : this.gaugeGlobals.knob,
        knobStyle              : this.gaugeGlobals.knobStyle,
        lcdColor               : this.gaugeGlobals.lcdColour,
        lcdDecimals            : 1,
        digitalFont            : this.config.digitalFont,
        tickLabelOrientation   : this.gaugeGlobals.tickLabelOrientation,
        labelNumberFormat      : this.gaugeGlobals.labelFormat
    }

    //just for tests
    this.init();

  }

  init = () => {
    //TODO
    this.displayUnits = {...DEF_UNITS};
    
    this.userUnitsSet = false;
    this.firstRun = false;
  }

  getDisplayUnits = () => (this.displayUnits);

  getRealTime = () => {
    fetch("/customclientraw.txt")
    .then(res => res.json())
    .then(this.processData, this.processErr);
  }

  processData = (data: any) => {
    //TODO add check on realTimeVer!
    if(true) {  
      if (typeof data.dateFormat === 'undefined')
        data.dateFormat = 'y/m/d';
      else
        // frig for WD bug which leaves a trailing % character from the tag
        data.dateFormat = data.dateFormat.replace('%', '');

      // mainpulate the last rain time into something more friendly
      data.LastRained = DataUtils.parseLastRain(data, this.lang);

      if (data.tempunit.length > 1)
        // clean up temperature units - remove html encoded degree symbols
        data.tempunit = data.tempunit.replace(/&\S*;/, '°');  // old Cumulus versions uses &deg;, WeatherCat uses &#176;
      else
        // using new realtimegaugesT.txt with Cumulus > 1.9.2
        data.tempunit = '°' + data.tempunit;


      // *** CHECK IF STATION IS OFFLINE ***
      let stationOffMsg = DataUtils.isStationOffline(data, this.config.stationTimeout, this.lang);
      if(stationOffMsg !== null) {
        data.ledColor = steelseries.LedColor.RED_LED;
        //this.led.setLedColor(steelseries.LedColor.RED_LED);
        data.ledTitle = this.lang.led_title_offline;
        //this.led.setTitle(this.lang.led_title_offline);
        data.ledBlink = true;
        //this.led.blink(true);
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

      // Temperature data conversion for display required?
      if (data.tempunit[1] !== this.displayUnits.temp && this.userUnitsSet) {
        DataUtils.convTempData(data); // temp needs converting
      }
      else if (this.firstRun) {
          this.displayUnits.temp = data.tempunit;
          
          //TODO handle radiobox changes
          //setRadioCheck('rad_unitsTemp', displayUnits.temp);
      }

      // Rain data conversion for display required?
      if (data.rainunit !== this.displayUnits.rain && this.userUnitsSet) {
        DataUtils.convRainData(data); // rain needs converting
      }
      else if (this.firstRun) {
          this.displayUnits.rain = data.rainunit;
          
          //TODO handle radiobox changes
          //setRadioCheck('rad_unitsRain', displayUnits.rain);
      }


      // Wind data conversion for display required?
      if (data.windunit !== this.displayUnits.wind && this.userUnitsSet) {
        DataUtils.convWindData(data, this.displayUnits.wind); // wind needs converting
      }
      else if (this.firstRun) {
        this.displayUnits.wind = data.windunit;
        this.displayUnits.windrun = DataUtils.getWindrunUnits(data.windunit);
        
        //TODO handle radiobox changes
        //setRadioCheck('rad_unitsWind', displayUnits.wind);
      }

      // Pressure data conversion for display required?
      if (data.pressunit !== this.displayUnits.press && this.userUnitsSet) {
        DataUtils.convBaroData(data, this.displayUnits.press);
      } else if (this.firstRun) {
        this.displayUnits.press = data.pressunit;
          
        //TODO handle radiobox changes
        //setRadioCheck('rad_unitsPress', displayUnits.press);
      }

      if (data.cloudbaseunit !== this.displayUnits.cloud && this.userUnitsSet) {
        // Cloud height needs converting
        DataUtils.convCloudBaseData(data);
      } else if (this.firstRun) {
        this.displayUnits.cloud = data.cloudbaseunit;
          
        //TODO handle radiobox changes
        //setRadioCheck('rad_unitsCloud', displayUnits.cloud);
      }


      // TODO eventually, run doFirst if firstrun = true (?)

      data.statusTimerAction = 'START';
      //data.statusTimerAction = 'RESET';
      //data.statusTimerVal = 5;



    // ===========================================
    // ===         END DATA PROCESSING         ===
    // ===========================================
    }
    else {
      //TODO add wrong realTimeVer error handling
    }

    console.log(data);
    this.data = data;
    this.updateGauges();
  }

  processErr = (err: any) => {
    //TODO add fetch error handling
    console.log("[ERR] " + err);
  }


  updateGauges = () => {
    this.gaugesUpdate.forEach(upd => upd(this.data));
  }

  subscribe = (gaugeName: string, gaugeUpdate: any) => {
    this.gauges = this.gauges.concat(gaugeName);
    this.gaugesUpdate = this.gaugesUpdate.concat(gaugeUpdate);
  }
}





const stripHtml = (html: string) => {
  // Create a new div element
  var temporalDivElement = document.createElement("div");
  // Set the HTML content with the providen
  temporalDivElement.innerHTML = html;
  // Retrieve the text property of the element (cross-browser support)
  return temporalDivElement.textContent || temporalDivElement.innerText || "";
}