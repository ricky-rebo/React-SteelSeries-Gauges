export interface Config {
    weatherProgram: number,
    imgPathURL: string,
    oldGauges: string,
    realtimeInterval: number,
    gaugeScaling: number,
    gaugeMobileScaling: number,
    graphUpdateTime: number,
    stationTimeout: number,
    pageUpdateLimit: number,
    pageUpdatePswd: string,
    digitalFont: boolean,
    digitalForecast: boolean,
    showPopupData: boolean,
    showPopupGraphs: boolean,
    mobileShowGraphs: boolean,
    showWindVariation: boolean,
    showWindMetar: boolean,
    showIndoorTempHum: boolean,
    showCloudGauge: boolean,
    showUvGauge: boolean,
    showSolarGauge: boolean,
    showSunshineLed: boolean,
    showRoseGauge: boolean,
    showRoseGaugeOdo: boolean,
    showRoseOnDirGauge: boolean,
    showGaugeShadow: boolean,                   
    roundCloudbaseVal: boolean,                   

    realTimeUrl: string,     
    useCookies: boolean,                   
    tipImages: string[],
    dashboardMode: boolean,
    dewDisplayType: string                   
}


export interface CustomConfig {
    weatherProgram: number,                      // Set 0=Cumulus, 1=Weather Display, 2=VWS, 3=WeatherCat, 4=Meteobridge, 5=WView, 6=WeeWX, 7=WLCOM
    imgPathURL?: string,            // *** Change this to the relative path for your 'Trend' graph images
    oldGauges?: string,           // *** Change this to the relative path for your 'old' gauges page.
    realtimeInterval: number,                     // *** Download data interval, set to your realtime data update interval in seconds
    gaugeScaling?: number,
    gaugeMobileScaling?: number,                   // scaling factor to apply when displaying the gauges mobile devices, set to 1 to disable (default 0.85)
    graphUpdateTime?: number,                     // period of pop-up data graph refresh, in minutes (default 15)
    stationTimeout?: number,                      // period of no data change before we declare the station off-line, in minutes (default 3)
    pageUpdateLimit?: number,                     // period after which the page stops automatically updating, in minutes (default 20),
                                                    // - set to 0 (zero) to disable this feature
    pageUpdatePswd?: string,               // password to over ride the page updates time-out, do not set to blank even if you do not use a password - http://<URL>&pageUpdate=its-me
    digitalFont?: boolean,                  // Font control for the gauges & timer
    digitalForecast?: boolean,                  // Font control for the status display, set this to false for languages that use accented characters in the forecasts
    showPopupData?: boolean,                   // Pop-up data displayed
    showPopupGraphs?: boolean,                   // If pop-up data is displayed, show the graphs?
    mobileShowGraphs?: boolean,                  // If false, on a mobile/narrow display, always disable the graphs
    showWindVariation?: boolean,                   // Show variation in wind direction over the last 10 minutes on the direction gauge
    showWindMetar?: boolean,                  // Show the METAR substring for wind speed/direction over the last 10 minutes on the direction gauge popup
    showIndoorTempHum?: boolean,                   // Show the indoor temperature/humidity options
    showCloudGauge?: boolean,                   // Display the Cloud Base gauge
    showUvGauge?: boolean,                   // Display the UV Index gauge
    showSolarGauge?: boolean,                   // Display the Solar gauge
    showSunshineLed?: boolean,                   // Show 'sun shining now' LED on solar gauge
    showRoseGauge?: boolean,                   // Show the optional Wind Rose gauge
    showRoseGaugeOdo?: boolean,                   // Show the optional Wind Rose gauge wind run Odometer
    showRoseOnDirGauge?: boolean,                   // Show the rose data as sectors on the direction gauge
    showGaugeShadow?: boolean,                   // Show a drop shadow outside the gauges
    roundCloudbaseVal?: boolean,                   // Round the value shown on the cloud base gauge to make it easier to read

    realTimeUrl: string,     
    useCookies?: boolean,                   // Persistently store user preferences in a cookie?
    tipImages?: string[],
    dashboardMode?: boolean,                  // Used by Cumulus MX dashboard - SET TO FALSE OTHERWISE
    dewDisplayType?: string                   // Initial 'scale' to display on the 'dew point' gauge.
                                                    // 'dew' - Dewpoint
                                                    // 'app' - Apparent temperature
                                                    // 'wnd' - Wind Chill
                                                    // 'hea' - Heat Index
                                                    // 'hum' - Humidex
}