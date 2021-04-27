import React, { Component } from 'react';
import GaugesController from '../controller/controller';
import { Led, LedColor } from "steelseries";
import { RtData, StatusDef } from '../controller/types';

const DEF_SIZE = 25;

class LedGauge extends Component<Props, State> {
	static NAME = "LED";

	canvasRef: React.RefObject<HTMLCanvasElement>;

	gauge: Led;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();

		this.state = {
			title: '',
			color: LedColor.GREEN_LED,
			isOn: false,
			blink: false
		}

		this.dataUpdate = this.dataUpdate.bind(this);
		this.statusUpdate = this.statusUpdate.bind(this);
		props.controller.subscribe(LedGauge.NAME, this.dataUpdate, this.statusUpdate);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Led(this.canvasRef.current, {
				ledColor: this.state.color,
				size    : this.props.size||DEF_SIZE
			});
		}
	}

	async dataUpdate({ ledTitle }: RtData) {
		if(ledTitle)
			this.setState({ title: ledTitle });
	}

	async statusUpdate({ ledTitle, ledColor, ledState }: StatusDef) {
		let newState: any = {};

		if(ledTitle !== "")
			newState.title = ledTitle;
		
		newState.color = ledColor;

		newState.blink = (ledState==="blink");
		
		//if(!newState.blink)
			newState.isOn = (ledState==="on");
		
		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.gauge && this.canvasRef.current) {
			if(prevState.title !== this.state.title)
				this.canvasRef.current.title = this.state.title;

			if(prevState.color !== this.state.color)
				this.gauge.setLedColor(this.state.color);

			//if(prevState.blink !== this.state.blink)
				this.gauge.blink(this.state.blink);
			//else if(prevState.isOn !== this.state.isOn)
				this.gauge.setLedOnOff(this.state.isOn)
		}
	}

	render() {
		return (
			<canvas
				ref={this.canvasRef}
				width={this.props.size||DEF_SIZE}
				height={this.props.size||DEF_SIZE}
			></canvas>
		);
	}
}

interface Props {
	controller: GaugesController,
	size?: number
}

interface State {
	title: string,
	color: LedColor,
	isOn: boolean,
	blink: boolean
}

export default LedGauge;