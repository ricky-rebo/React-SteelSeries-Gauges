import React from 'react'

import { GaugesController, GaugeSize, Gauge, Langs } from 'react-steelseries-gauges'
import 'react-steelseries-gauges/dist/index.css'

class App extends React.Component {
  controller: GaugesController;

  constructor(props: any) {
    super(props);

    this.controller = new GaugesController(Langs.IT, {
      realTimeUrl: "/customclientraw.txt",
      realtimeInterval: 7,
      pageUpdateLimit: 1
    });
  }
	
	componentDidMount() {
    this.controller.start();
	}

  componentWillUnmount() {
    this.controller.stop();
  }
  
  render() {
    let dim = GaugeSize.Lrg;
    let controller = this.controller;

    return(
      <div>
        <div style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', marginTop:'20px' }}>
          <div>
            <Gauge.Led controller={this.controller} size={30} />
            <Gauge.StatusScroller controller={this.controller} width={750} height={30} /> &nbsp;
            <Gauge.Timer controller={this.controller} width={90} height={30} />
          </div>
          <div>
            <Gauge.Temp controller={controller} size={dim} />
            <Gauge.Dew controller={controller} size={dim} />
            <Gauge.Hum controller={controller} size={dim} />
          </div>
          <div>
            <Gauge.Baro controller={controller} size={dim} />
            <Gauge.Rain controller={controller} size={dim} />
            <Gauge.RainRate controller={controller} size={dim} />
          </div>
          <div>
            <Gauge.UV controller={controller} size={dim} />
            <Gauge.Solar controller={controller} size={dim} />
            <Gauge.CloudBase controller={controller} size={dim} />
          </div>
          <div>
            <Gauge.WindSpeed controller={controller} size={dim}/>
            <Gauge.WindDir controller={controller} size={dim}/>
            <Gauge.WindRose controller={controller} size={dim}/>
          </div>
        </div>
      </div>
    )
  }
}

export default App
