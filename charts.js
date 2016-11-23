
'use strict';

let data = [];

const chart_default = {
	name: null,
	width: null,
	height: null,
	background: null,
	lineStroke: null,
	text: null,
	mutedText: null,
	textSize: null,
	axisStroke: null,
	spacing: null,
	layout: 'horizontal',
	show: [],
	openCircleStroke: null,
	openCircleFill: null,
	closeCircleStroke: null,
	closeCircleFill: null,
	downText: null,
	upText: null,
	metricEmbed: false,
	gapStroke: null,
};

const color_variants = {
	homepage: {
		lineStroke: '#ff2b21',
		text: '#c2c2c2',
		mutedText: '#999999',
		textSize: 13,
		axisStroke: '#676767',
		openCircleStroke: '#ffffff',
		openCircleFill: '#333333',
		closeCircleStroke: '#ff2b21',
		closeCircleFill: '#333333',
		downText: '#ff767c',
		upText: '#9cd321',
		gapStroke: 'rgba(0,0,0,0.5)'
	},
	fullpage: {
		lineStroke: '#af516c',
		text: '#333333',
		mutedText: '#999999',
		textSize: 14,
		axisStroke: '#a7a59b',
		openCircleStroke: '#333333',
		openCircleFill: '#fff1e0',
		closeCircleStroke: '#af516c',
		closeCircleFill: '#fff1e0',
		downText: '#cc0000',
		upText: '#458B00',
		gapStroke: 'rgba(0,0,0,0.3)'
	}
};

const size_variants = {
	default: {
		width: 280,
		height: 80,
		spacing: 5
	},
	small: {
		width: 400,
		height: 80,
		spacing: 5
	},
	medium: {
		width: 645,
		height: 80,
		spacing: 8
	},
	large: {
		width: 435,
		height: 80,
		spacing: 10
	},
	xlarge: {
		width: 576,
		height: 80,
		spacing: 12
	}
};

const symbol_variants = {
	day: [
		"GBPUSD",
		"GBPEUR",
		"FTSE:FSI"
	],
	night: [
		"GBPUSD",
		"GBPEUR",
		"EURUSD"
	],
	day2: [
		"GBPUSD",
		"FTSE:FSI"
	],
	night2: [
		"GBPUSD",
		"GBPEUR"
	],
};

// create variants output

// symbols
Object.keys(symbol_variants).forEach(symbol => {
	let chart = Object.assign({}, chart_default); // make copy of the default
	chart.show = symbol_variants[symbol]; // set 'show' data
	// sizes
	Object.keys(size_variants).forEach(size => {
		chart = Object.assign({}, chart, size_variants[size]); // make copy with size data
		// colors
		Object.keys(color_variants).forEach(scheme => {
			chart = Object.assign({}, chart, color_variants[scheme]); // make copy with color data
			// save out
			chart.name = `${symbol}-${scheme}-${size}`;
			data.push(chart);
		});
	});
});

module.exports = data;
