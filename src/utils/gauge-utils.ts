// @ts-ignore
import steelseries from '../libs/steelseries.js';

export default class GaugeUtils {
    /**
     * Creates an array of gauge sections appropriate for Celsius or Fahrenheit scales
     * @param useCelsius True id you're using Celsius, False otherwise
     */
    static createTempSections = (useCelsius: boolean) => {
        if (useCelsius) {
            return [
                steelseries.Section(-100, -35, 'rgba(195, 92, 211, 0.4)'),
                steelseries.Section(-35, -30, 'rgba(139, 74, 197, 0.4)'),
                steelseries.Section(-30, -25, 'rgba(98, 65, 188, 0.4)'),
                steelseries.Section(-25, -20, 'rgba(62, 66, 185, 0.4)'),
                steelseries.Section(-20, -15, 'rgba(42, 84, 194, 0.4)'),
                steelseries.Section(-15, -10, 'rgba(25, 112, 210, 0.4)'),
                steelseries.Section(-10, -5, 'rgba(9, 150, 224, 0.4)'),
                steelseries.Section(-5, 0, 'rgba(2, 170, 209, 0.4)'),
                steelseries.Section(0, 5, 'rgba(0, 162, 145, 0.4)'),
                steelseries.Section(5, 10, 'rgba(0, 158, 122, 0.4)'),
                steelseries.Section(10, 15, 'rgba(54, 177, 56, 0.4)'),
                steelseries.Section(15, 20, 'rgba(111, 202, 56, 0.4)'),
                steelseries.Section(20, 25, 'rgba(248, 233, 45, 0.4)'),
                steelseries.Section(25, 30, 'rgba(253, 142, 42, 0.4)'),
                steelseries.Section(30, 40, 'rgba(236, 45, 45, 0.4)'),
                steelseries.Section(40, 100, 'rgba(245, 109, 205, 0.4)')
            ];
        } else {
            return [
                steelseries.Section(-200, -30, 'rgba(195, 92, 211, 0.4)'),
                steelseries.Section(-30, -25, 'rgba(139, 74, 197, 0.4)'),
                steelseries.Section(-25, -15, 'rgba(98, 65, 188, 0.4)'),
                steelseries.Section(-15, -5, 'rgba(62, 66, 185, 0.4)'),
                steelseries.Section(-5, 5, 'rgba(42, 84, 194, 0.4)'),
                steelseries.Section(5, 15, 'rgba(25, 112, 210, 0.4)'),
                steelseries.Section(15, 25, 'rgba(9, 150, 224, 0.4)'),
                steelseries.Section(25, 32, 'rgba(2, 170, 209, 0.4)'),
                steelseries.Section(32, 40, 'rgba(0, 162, 145, 0.4)'),
                steelseries.Section(40, 50, 'rgba(0, 158, 122, 0.4)'),
                steelseries.Section(50, 60, 'rgba(54, 177, 56, 0.4)'),
                steelseries.Section(60, 70, 'rgba(111, 202, 56, 0.4)'),
                steelseries.Section(70, 80, 'rgba(248, 233, 45, 0.4)'),
                steelseries.Section(80, 90, 'rgba(253, 142, 42, 0.4)'),
                steelseries.Section(90, 110, 'rgba(236, 45, 45, 0.4)'),
                steelseries.Section(110, 200, 'rgba(245, 109, 205, 0.4)')
            ];
        }
    }

    /**
     * Create a shadow effect for the gauge using CSS
     * @param size The size of the gauge
     * @param color The color of the shadow (specified in the controller's config)
     */
    static gaugeShadow = (size: number, color: string) => {
        var offset = Math.floor(size * 0.015);
        return {
            boxShadow   : offset + 'px ' + offset + 'px ' + offset + 'px ' + color,
            borderRadius: Math.floor(size / 2) + 'px'
        };
    }

    /**
     * Returns an array of section highlights for total rainfall in mm or inches
     * @param metric 
     */
    static createRainfallSections = (metric: boolean) => {
        var factor = metric ? 1 : 1 / 25;
        return [
            steelseries.Section(0, 5 * factor, 'rgba(0, 250, 0, 1)'),
            steelseries.Section(5 * factor, 10 * factor, 'rgba(0, 250, 117, 1)'),
            steelseries.Section(10 * factor, 25 * factor, 'rgba(218, 246, 0, 1)'),
            steelseries.Section(25 * factor, 40 * factor, 'rgba(250, 186, 0, 1)'),
            steelseries.Section(40 * factor, 50 * factor, 'rgba(250, 95, 0, 1)'),
            steelseries.Section(50 * factor, 65 * factor, 'rgba(250, 0, 0, 1)'),
            steelseries.Section(65 * factor, 75 * factor, 'rgba(250, 6, 80, 1)'),
            steelseries.Section(75 * factor, 100 * factor, 'rgba(205, 18, 158, 1)'),
            steelseries.Section(100 * factor, 125 * factor, 'rgba(0, 0, 250, 1)'),
            steelseries.Section(125 * factor, 500 * factor, 'rgba(0, 219, 212, 1)')
        ];
    }

		/**
		 * Returns an array of SS colours for continuous gradient colouring of the total rainfall LED gauge
		 * @param metric 
		 */
    static createRainfallGradient = (metric: boolean) => {
        var grad = new steelseries.gradientWrapper(
            0,
            (metric ? 100 : 4),
            [0, 0.1, 0.62, 1],
            [
                new steelseries.rgbaColor(15, 148, 0, 1),
                new steelseries.rgbaColor(213, 213, 0, 1),
                new steelseries.rgbaColor(213, 0, 25, 1),
                new steelseries.rgbaColor(250, 0, 0, 1)
            ]
        );
        return grad;
		}
		
		/**
		 * Returns an array of section highlights for the Rain Rate gauge.
		 * Assumes 'standard' descriptive limits from UK met office:
     *  < 0.25 mm/hr - Very light rain
     *  0.25mm/hr to 1.0mm/hr - Light rain
     *  1.0 mm/hr to 4.0 mm/hr - Moderate rain
     *  4.0 mm/hr to 16.0 mm/hr - Heavy rain
     *  16.0 mm/hr to 50 mm/hr - Very heavy rain
     *  > 50.0 mm/hour - Extreme rain

     * Roughly translated to the corresponding Inch rates
     *  < 0.001
     *  0.001 to 0.05
     *  0.05 to 0.20
     *  0.20 to 0.60
     *  0.60 to 2.0
     *  > 2.0
		 * @param metric 
		 */      
		static createRainRateSections = (metric: boolean) => {
			var factor = metric ? 1 : 1 / 25;
			return [
					steelseries.Section(0, 0.25 * factor, 'rgba(0, 140, 0, 0.5)'),
					steelseries.Section(0.25 * factor, 1 * factor, 'rgba(80, 192, 80, 0.5)'),
					steelseries.Section(1 * factor, 4 * factor, 'rgba(150, 203, 150, 0.5)'),
					steelseries.Section(4 * factor, 16 * factor, 'rgba(212, 203, 109, 0.5)'),
					steelseries.Section(16 * factor, 50 * factor, 'rgba(225, 155, 105, 0.5)'),
					steelseries.Section(50 * factor, 1000 * factor, 'rgba(245, 86, 59, 0.5)')
			];
	}
}