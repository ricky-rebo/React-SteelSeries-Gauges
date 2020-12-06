import React, { Component } from 'react';
// @ts-ignore
import { Radial, Section } from "steelseries";
import styles from '../style/common.css';
import Cookies, { Cookie } from 'universal-cookie/es6';
import { InOutTemp, Props } from './data-types';
import { gaugeShadow } from './gauge-utils.js';
import { RtData } from '../controller/data-types.js';

const COOKIE_NAME = 'hum-display';

//TODO docs
class HumGauge extends Component<Props, State> {
	static NAME = "HUM_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: React.CSSProperties;
	cookies: Cookie;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();

		let tempType = InOutTemp.OUT;
		if(props.controller.config.useCookies && props.controller.gaugeConfig.showIndoorTempHum) {
			this.cookies = new Cookies();
			let sel = this.cookies.get(COOKIE_NAME);
			if(sel) tempType = sel;
			else {
				//TODO set expire date
				this.cookies.set(COOKIE_NAME, tempType, { path: '/' });
			}
		}
		
		this.state = {
			title: this.props.controller.lang.hum_title_out,
			selected: tempType,

			value: 0.0001,
			areas: [],
			
			//popUpTxt: '',
			//graph: '',
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: [
				Section(0, 20, 'rgba(255,255,0,0.3)'),
				Section(20, 80, 'rgba(0,255,0,0.3)'),
				Section(80, 100, 'rgba(255,0,0,0.3)')
			],
			area: [],
			maxValue: 100,
			thresholdVisible: false,
			titleString: this.state.title,
			unitString: 'RH%',
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(HumGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: RtData) {
		this._setState(mapLocalData(data));
	}

	setInOutHum(sel: InOutTemp) {
		if(this.state.data) {
			this._setState(this.state.data, sel);

			if(this.props.controller.config.useCookies && this.cookies)
				this.cookies.set(COOKIE_NAME, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: InOutTemp) {
		let newState: any = {};

		if(sel) {
			newState.selected = sel
			if(sel === InOutTemp.OUT) {
				newState.title = this.props.controller.lang.hum_title_out;
			}
			else {
				newState.title = this.props.controller.lang.hum_title_in;
			}
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		let { minMaxArea } = this.props.controller.gaugeConfig;
		if(newState.selected == InOutTemp.OUT) {
			newState.value = data.hum;
		
			newState.areas = [Section(data.humTL, data.humTH, minMaxArea)];
		}
		else {
			newState.value = data.inhum;
			if (data.inhumTL && data.inhumTH) {
				// Indoor - and Max/Min values supplied
				newState.areas=[Section(data.inhumTL, data.inhumTH, minMaxArea)];
			}
			else {
				// Indoor - no Max/Min values supplied
				newState.areas=[];
			}
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(prevState.selected !== this.state.selected) {
			this.gauge.setTitleString(this.state.title);
		}

		this.gauge.setArea(this.state.areas);
		this.gauge.setValueAnimated(this.state.value);
	}

	render() {
		return (
			<div className={styles.gauge}>
				<div id="tip_4">
					<canvas 
						ref={this.canvasRef}
						width={this.params.size}
						height={this.params.size}
						style={this.style}
					></canvas>
				</div>
				<button onClick={() => this.setInOutHum(InOutTemp.OUT)}>Out</button>
				<button onClick={() => this.setInOutHum(InOutTemp.IN)}>In</button>
			</div>
		);
	}
}

interface State {
	data?: LocalDataDef,

	value: number,
	title: string,
	areas: any[],

	selected: InOutTemp,

	//popUpTxt: string,
	//graph: string
}

interface LocalDataDef {
	hum: number, 
	humTL: number,
	humTH: number,
	inhum: number,
	inhumTL?: number,
	inhumTH?: number
}

function mapLocalData(data: RtData) {
	let locData: LocalDataDef = {
		hum			: data.hum,
		humTL		: data.humTL,
		humTH		: data.humTH,
		inhum		: data.inhum,
		inhumTL	: data.inhumTL,
		inhumTH	: data.inhumTH
	}
	return locData;
}

export default HumGauge;