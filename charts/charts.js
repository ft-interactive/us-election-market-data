
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
		gapStroke: 'rgba(255,255,255,0.4)'
	}/*,
	fullpage: {
		lineStroke: '#af516c',
		text: '#333333',
		mutedText: '#999999',
		textSize: 13,
		axisStroke: '#a7a59b',
		openCircleStroke: '#333333',
		openCircleFill: '#fff1e0',
		closeCircleStroke: '#af516c',
		closeCircleFill: '#fff1e0',
		downText: '#cc0000',
		upText: '#458B00',
		gapStroke: 'rgba(0,0,0,0.3)'
	}*/
};

const size_variants = {
	default: {
		width: 260,
		height: 90,
		spacing: 5
	},
	small: {
		width: 390,
		height: 90,
		spacing: 5
	},
	medium: {
		width: 640,
		height: 90,
		spacing: 8
	},
	large: {
		width: 420,
		height: 90,
		spacing: 8
	},
	xlarge: {
		width: 554,
		height: 90,
		spacing: 11
	}
};

const symbol_variants = {
	night1: [
		"INX:IOM",
		// "IRDXY0:IUS"
	],
	night2: [
		"INX:IOM",
		"AW01:FSI"
		// "IRDXY0:IUS",
	],
	night3: [
		"INX:IOM",
		"US10YT",
		"AW01:FSI"
		// "IRDXY0:IUS",
	],
	mxn1: [
		"USDMXN",
	],
	mxn2: [
		"USDMXN",
		"AW01:FSI"
	],
	mxn3: [
		"USDMXN",
		"US10YT",
		"AW01:FSI"
	],
	jpy1: [
		"USDJPY",
	],
	jpy2: [
		"USDJPY",
		"AW01:FSI"
	],
	jpy3: [
		"USDJPY",
		"US10YT",
		"AW01:FSI"
	]
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
