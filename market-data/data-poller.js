'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const csvParse = require('csv-parse/lib/sync');
const logger = require('./lib/logger')('us-election-market-data-generator');

const config = {
	endpoint: {
		host: 'markets.ft.com', // host & path make up the api endpoint url
		path: '/research/webservices/securities/v1/time-series?',
		params: {
			minuteInterval: 10, // the interval of data points
			dayCount: 3, // how many days worth of data - today backwards
			symbols: [ // symbols to collect market data on
				'US10YT', // US 10 yr bonds
				'IRDXY0:IUS', // DXY 1
				'AW01:FSI', // FTSE all world
				'INX:IOM', // S&P 500
				'USDMXN', // usd vs mexican peso
				'USDJPY', // usd vs japanese yen
			],
			source: '2b80e84c1a' // api key - should be an env var
		}
	},
	output_dir: (process.argv[2] || path.join(__dirname, 'build')) // output directory
};

const paramsToString = (obj) => {
	let str = Object.keys(obj).map(key => {
		return key + '=' + obj[key];
	}).join('&');
	return str;
};

const checkSymbol = (val) => {
	let isValid = false;
	config.endpoint.params.symbols.forEach(symbol => {
		if (val === symbol) {
			isValid = true;
		}
	});
	return isValid;
};

const validateSeries = (data) => {
	let isValid = false;

	if (data.symbolInput &&
		data.basic &&
		data.timeSeries &&
		data.timeSeries.timeSeriesData &&
		data.timeSeries.timeSeriesData.length > 0 &&
		checkSymbol(data.symbolInput) &&
		(data.symbolInput.toUpperCase() === data.basic.symbol.toUpperCase())
	) {
		logger.info(`Valid data for '${data.symbolInput}' symbol -> ${data.basic.symbol}, ${data.timeSeries.timeSeriesData.length} items`);
		isValid = true;
	}

	if (!isValid) {
		logger.error(`Invalid data for '${data.symbolInput}' symbol`);
	}

	return isValid;
};

// http request
const getMarketsData = (cb) => {
	const opts = {
		host: config.endpoint.host,
		path: config.endpoint.path + paramsToString(config.endpoint.params)
	};

	logger.maskSource(`Market Data api - request: GET ${opts.host}${opts.path}`);

	const req = http.get(opts, (response) => {
		let body = '';
		response.on('data', (d) => {
			body += d;
		});
		response.on('end', () => {
			cb(handleResponse(response, body));
		});
	});

	req.on('error', (e) => {
		logger.error(`Market Data api - ${e}`);
	});

	req.on('timeout', () => {
		logger.error('Market Data api - request timeout');
		req.abort();
	});

	req.setTimeout(4500);
	req.end();
};

// handle response
const handleResponse = (res, body) => {
	let parsed;
	let dataArray;

	// bad request
	if (res.statusCode !== 200) {
		logger.error(`Market Data api - response: ${res.statusCode} Bad request`);
		process.exit(0);
	}

	// JSON error response
	if (res.error && res.error.code) {
		logger.error(`Market Data api - response: ${res.error.code} Invalid response: ${res.error.message}`);
		process.exit(0);
	}

	// body check
	try {
		parsed = JSON.parse(body);
	} catch (e) {
		logger.error(`Market Data api - response: ${res.statusCode} Invalid response body, ${e}`);
		process.exit(0);
	}

	// Check series data structure
	dataArray = (parsed.data && parsed.data.items && parsed.data.items.length) ? parsed.data.items : null;
	// Check is array and length matches the initial symbols request
	if (!dataArray || !Array.isArray(dataArray) || (dataArray.length !== config.endpoint.params.symbols.length)) {
		logger.error(`Market Data api - response: ${res.statusCode} Unexpected data structure`);
		process.exit(0);
	}

	logger.info(`Market Data api - response: ${res.statusCode} generated at ${parsed.timeGenerated}`);

	return dataArray;
};

// publish the data
const publishData = (data, cb) => {
	let count = 0;

	data.forEach(d => {
		if (validateSeries(d)) {

			const filename = path.join(config.output_dir, d.basic.symbol + '.csv');
			const newSeriesCSV = generateTimeSeriesCSV(d.timeSeries.timeSeriesData);
			let currentSeriesCSV;

			try {
				currentSeriesCSV = fs.readFileSync(filename);
			} catch (e) {
				logger.info(`No existing file found for ${d.basic.symbol} at ${filename}`);
			}

			if (!currentSeriesCSV && newSeriesCSV) {
				logger.info(`Writing out - Creating ${filename}`);
				writeOutFile(filename, parseTimeSeriesCSV(newSeriesCSV));
				count++;
			}

			if (currentSeriesCSV && newSeriesCSV) {
				logger.info(`Existing file found for ${d.basic.symbol} at ${filename}`);
				appendCSV(currentSeriesCSV, newSeriesCSV, (err, result) => {
					count++;
					if (err) {
						return logger.error(`Failed to merge data: ${err}`);
					}

					logger.info(`Writing out - Replacing ${filename}`);
					writeOutFile(filename, result);
				});
			}

			logger.info(`${d.basic.symbol} done`);

			if (count === data.length) {
				cb();
			}

		}
	});
};

const generateTimeSeriesCSV = (data) => {
	let str = 'date,value\n';
	data.forEach(item => {
		if (item.close && item.lastClose) {
			str += `${item.lastClose},${item.close}\n`;
		}
	});
	return str;
};

const parseTimeSeriesCSV = (data) => {
	let obj;
	try {
		obj = csvParse(data, {columns: true});
	} catch(e) {
		logger.error(`Error when parsing csv: ${e}`);
	}
	return obj;
};

const formatForPublish = (data) => {
	let str = 'date,value\n';

	data.sort((a, b) => {
		a = new Date(a.date);
		b = new Date(b.date);
		return a>b ? 1 : a<b ? -1 : 0;
	});

	data.forEach(item => {
		if (item.date && item.value) {
			str += `${item.date},${item.value}\n`;
		}
	});
	return str;
};

const mergeCSV = (oData, nData) => {
	const current = parseTimeSeriesCSV(oData);
	const next = parseTimeSeriesCSV(nData);
	let newValues = [];

	if (!current && !next) {
		return;
	}

	next.forEach(row => { // for each new item

		let exists = false;

		for (let i=current.length-1; i>=0; i--) {
			if (current[i].date === row.date) {
				if (current[i].value !== row.value) {
					current[i].value = row.value;
				}
				exists = true;
				break;
			}
		}

		if (!exists) {
			newValues.push(row);
		}

	});

	logger.info(`Adding ${newValues.length} items to existing data`);

	return current.concat(newValues);
};

const appendCSV = (currentSeriesCSV, newSeriesCSV, cb) => {
	let data;
	let err;

	if (currentSeriesCSV && newSeriesCSV) {
		try {
			data = mergeCSV(currentSeriesCSV, newSeriesCSV);
		} catch (e) {
			logger.info('Failed to merge existing and new csv data');
			err = e;
		}
	}

	cb(err, data);
};

const writeOutFile = (path, data) => {
	const content = formatForPublish(data);

	try {
		fs.writeFileSync(path, content);
	} catch (e) {
		return logger.error(`Failed to write file: ${e}`);
	}

	logger.info(`Successfully wrote file: ${path}`);
};

const init = () => {
	logger.info('Script starting');
	getMarketsData(data => {
		publishData(data, () => {
			logger.info('Script exiting');
			process.exit(0);
		});
	});
};
// run
init();
