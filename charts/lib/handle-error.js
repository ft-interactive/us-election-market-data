'use strict';

module.exports = handleError;

function handleError(error) {
	console.error('Chart generation failed:', error.stack);
	process.exit(1);
}
