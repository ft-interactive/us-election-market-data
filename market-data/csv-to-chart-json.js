'use strict';

const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');
const logger = require('./lib/logger')('us-election-market-data-to-chart-json');

const config = {
	data_directory: (process.argv[2] || path.join(__dirname, 'input')), // .csv files to input
	output_directory: (process.argv[3] || path.join(__dirname, 'build')), // location to output .json
	chart_timeframe_days: 1, // eg. show the last 24 hours - including custom rounding logic
	chart_template: require('./data/chart-template.json'), // template chart data to use
	data_gap_threshold: 60 // in minutes, the amount of time between two datapoints that should result in a 'break' to be rendered in the chart - ie FTSE closing etc
};

const getSymbolFromFilename = (fileName) => {
	const symbol = fileName.replace('.csv', '').toUpperCase();
	// match symbol against charts data template
	const match = config.chart_template.charts.find(chart => {
		return chart.symbol === symbol;
	});
	return match ? symbol : null;
};

const parseSeriesData = (data) => {
	let parsed;
	try {
		parsed = csvParse(data, {columns: true});
	} catch (e) {
		logger.error(`There was a problem parsing the file: ${e}`);
	}

	parsed.forEach(obj => {
		obj.value = parseFloat(obj.value, 10); // needed for use in chart generator
	});

	return parsed;
};

const getTimeRange = () => {
	const now = new Date();
	// now.setUTCHours(11,0,0,0); // mock time points for testing
	let offsetDate = new Date(now);
	let offsetDay = now.getUTCDate() - config.chart_timeframe_days;
	let offsetHour = now.getUTCHours() <= 12 ? 8 : 12;

	offsetDate.setUTCDate(offsetDay);
	offsetDate.setUTCHours(offsetHour,0,0,0);

	logger.info(`Setting chart timescale from ${offsetDate.toISOString()} to ${now.toISOString()}`);
	return offsetDate.toISOString();
};

const formatSeries = (series, startDate) => {
	const _MS_PER_MIN = 1000 * 60; // ie 1 min
	const acceptableGapInMins = 60; // ie 1 hour

	if (!config.chart_timeframe_days) {
		logger.info('Using whole time series');
		return series;
	}

	Object.keys(series).forEach(symbol => {
		const oLength = series[symbol].length;

		logger.info(`Formatting ${symbol} series data - database contains ${oLength} points`);

		// filter out older date points
		series[symbol] = series[symbol].filter(point => {
			return point.date >= startDate;
		});

		logger.info(`${symbol} series data relevant to timeframe is ${series[symbol].length} points`);

		// ensure asc order
		series[symbol].sort((a, b) => {
			a = new Date(a.date);
			b = new Date(b.date);
			return a>b ? 1 : a<b ? -1 : 0;
		});

		// decorate FTSE or other data gaps
		series[symbol].map((point, i, array) => {
			const nextPoint = array[i+1] || null;
			let rObj = point;

			if (!nextPoint) {
				return rObj;
			}

			const a = new Date(point.date);
			const b = new Date(nextPoint.date);

			const diff = Math.floor((b - a) / _MS_PER_MIN);

			if (diff > acceptableGapInMins) {
				logger.info(`Decorating gap in ${symbol} data between ${point.date} and ${nextPoint.date}`);
				rObj.end = true;
			}

			return rObj;
		});

	});

	return series;
};

const readDataFromDir = (dir, cb) => {
	let fileList;
	let fileData = {};
	let err;

	// get files list
	try {
		fileList = fs.readdirSync(dir);
	} catch (e) {
		cb(`Error reading directory: ${e}`);
	}

	// get data from each file, if single failure dont fail all
	fileList.forEach(file => {
		let symbol = getSymbolFromFilename(file);
		let data;

		if (symbol) {

			try {
				data = fs.readFileSync(dir+file);
			} catch (e) {
				logger.error(`Error reading file ${dir+file}: ${e}`);
			}

			if (data) {
				logger.info(`Parsing data in ${dir+file} as ${symbol}`);
				try {
					fileData[symbol] = parseSeriesData(data);
				} catch (e) {
					logger.error(`Error parsing file ${dir+file}: ${e}`);
				}
			}

		}

	});

	if (Object.keys(fileData).length === 0) {
		err = `No market data found in ${dir}`;
	}

	cb(err, fileData);
};

const mapDataToChartJson = (data) => {
	let template = Object.assign({}, config.chart_template);
	let symbols = Object.keys(data);

	logger.info(`Mapping symbol data for ${symbols} into the template`);

	template.charts = template.charts.map(obj => {
		let rObj = Object.assign({}, obj);
		rObj.series = data[obj.symbol];
		rObj.xLabel = createDateLabel(data[obj.symbol][0].date);
		return rObj;
	});

	return template;
};

const createDateLabel = (isoString) => {
	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const localStart = new Date(isoString);
	const utcDayLabel = `${monthNames[localStart.getUTCMonth()]} ${localStart.getUTCDate()}`;
	const utcHour = localStart.getUTCHours();

	// const bstHour = (utcHour + 1 >= 24) ? 0 : utcHour + 1;
	const bstHour = (utcHour >= 24) ? 0 : utcHour;
	const bstPeriod = (bstHour <= 11) ? 'am' : 'pm';
	// convert hour to simple ie 13 becomes 1
	let bstSimpleHour = (bstHour >=13) ? bstHour -12 : bstHour;
	if (bstSimpleHour === 0) { bstSimpleHour = 12; }; // special case for 'midnight';

	// optional X hrs ago label
	// const localNow = Date.now();
	// const diff = Math.floor((localNow - localStart) / (60*60*1000));

	// return label - we dont need to worry about UTC date not matching an offset BST time
	// as the start is always going to be 08:00am or 12:00pm noon UTC the previous day
	return `${bstSimpleHour + bstPeriod} GMT ${utcDayLabel}`;
};

const generateChartJson = (data, cb) => {
	let output;
	let seriesData;
	let range;
	const fileName = path.join(config.output_directory, 'us-election-market-chart-data.json');

	try {
		range = getTimeRange();
	} catch (e) {
		logger.error(`Could not set a valid timerange: ${e}`);
	}

	seriesData = formatSeries(data, range);

	output = mapDataToChartJson(seriesData);

	logger.info(`Writing to ${fileName}`);
	try {
		fs.writeFileSync(fileName, JSON.stringify(output));
	} catch (e) {
		logger.error(`Failed to write out file ${e}`);
	}

	cb();
};

const init = () => {
	logger.info('Script starting');
	readDataFromDir(config.data_directory, (err, data) => {
		if (err) {
			logger.error(`Script Exiting - ${err}`);
			process.exit(0);
		}
		generateChartJson(data, () => {
			logger.info('Script exiting');
			process.exit(0);
		});

	});
};
// run
init();
