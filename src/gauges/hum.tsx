import React, { Component } from 'react';
// @ts-ignore
import { Radial, Section } from "steelseries";
import styles from '../style/common.css';
import Cookies, { Cookie } from 'universal-cookie/es6';
import { Lang, RtData } from '../controller/types';
import { InOutType, CommonProps, RGBAColor } from './types';
import { gaugeShadow } from './utils';
import { getCommonParams, MIN_MAX_AREA_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_HUM_INDOOR } from './defaults';

const COOKIE_NAME = 'hum-display';


class HumGauge extends Component<CommonProps, State> {
	static NAME = "HUM_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;
	cookies: Cookie;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			showIndoor: SHOW_HUM_INDOOR,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,

			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		}

		let humType: InOutType = "out";
		if(props.controller.config.useCookies && this.config.showIndoor) {
			this.cookies = new Cookies();
			let sel = this.cookies.get(COOKIE_NAME);
			if(sel) {
				humType = sel;
			}
			else {
				//TODO set expire date
				this.cookies.set(COOKIE_NAME, humType, { path: '/' });
			}
		}
		
		this.state = {
			title: getTitle(humType, props.controller.lang),
			selected: humType,

			value: 0.0001,
			areas: [],
			
			//popUpTxt: ''
		}

		/*this.params = {
			...this.props.controller.commonParams,
			size: this.props.size,
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
		};*/

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(HumGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),

				size: this.props.size,
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
			});

			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: RtData) {
		this._setState(mapLocalData(data));
	}

	setInOutHum(sel: InOutType) {
		if(this.state.data) {
			this._setState(this.state.data, sel);

			if(this.props.controller.config.useCookies && this.cookies)
				this.cookies.set(COOKIE_NAME, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: InOutType) {
		let newState: any = {};

		if(sel) {
			newState.selected = sel;
			newState.title = getTitle(sel, this.props.controller.lang);
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		if(newState.selected == "out") {
			newState.value = data.hum;
			newState.areas = [Section(data.humTL, data.humTH, this.config.minMaxAreaColor)];
		}
		else {
			newState.value = data.inhum;
			newState.areas=[Section(data.inhumTL, data.inhumTH, this.config.minMaxAreaColor)];
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(prevState.selected !== this.state.selected) {
			this.gauge.setTitleString(this.state.title);
		}

		this.gauge.setArea(this.state.areas);
		this.gauge.setValueAnimated(this.state.value);
	}

	render() {
		return (
			<div className={styles.gauge}>
				<canvas 
					ref={this.canvasRef}
					width={this.props.size}
					height={this.props.size}
					style={this.style}
				></canvas>
				<div>
					<button onClick={() => this.setInOutHum("out")}>Out</button>
					<button onClick={() => this.setInOutHum("in")}>In</button>
				</div>
			</div>
		);
	}
}


interface State {
	data?: LocalDataDef,

	value: number,
	title: string,
	areas: Section[],

	selected: InOutType,

	//popUpTxt: string
}

interface Config {
	showIndoor: boolean,
	minMaxAreaColor: RGBAColor,

	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

type LocalDataDef = Pick<RtData, "hum"|"humTL"|"humTH"|"inhum"|"inhumTL"|"inhumTH">


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

const getTitle = (sel: InOutType, lang: Lang) => (sel==="out" ? lang.hum_title_out : lang.hum_title_in);


export default HumGauge;