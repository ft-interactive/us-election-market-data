'use strict';

const buildChartsData = require('./lib/build-charts-data');
const fs = require('fs');
const handleError = require('./lib/handle-error');
const nunjucks = require('nunjucks');
const path = require('path');
const exec = require('child_process').execSync;
const logger = require('./lib/logger')('brexit-market-chart-svg-generator');

// Handle errors
process.on('uncaughtException', handleError);

logger.info('Script starting');

// Load the chart config and data
const chartsConfig = require('./charts.js');
let dataPath = process.argv[2] || './data/test.json';
if (dataPath[0] !== '/') {
	dataPath = path.join(__dirname, dataPath);
}
const data = require(dataPath);

// Create the build directory
const buildDirectory = process.argv[3] || path.join(__dirname, 'build');
logger.info(`Creating directory "${buildDirectory}"`);
exec(`mkdir -p "${buildDirectory}"`);

// Configure nunjucks
const nunjucksEnv = nunjucks.configure(path.resolve(__dirname, 'views'));
nunjucksEnv.addFilter('split', (string, separator) => {
	return string.split(separator || '');
});

logger.info('Generating charts from the following data: ' + JSON.stringify(chartsConfig));

// Generate the charts
chartsConfig.forEach(chartConfig => {

	logger.info(`Generating chart "${chartConfig.name}"`);
	const chartData = buildChartsData(chartConfig, data);

	const chartSvg = nunjucks.render('charts.svg', chartData);

	const chartFilePath = path.join(buildDirectory, `${chartConfig.name}.svg`);
	logger.info(`Saving chart "${chartFilePath}"`);
	fs.writeFileSync(chartFilePath, chartSvg);
});

logger.info('Script exiting');
