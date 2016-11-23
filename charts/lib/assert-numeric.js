'use strict';

module.exports = assertNumeric;

function assertNumeric(value, message) {
	if (!isNumeric(value)) {
		throw new Error(message);
	}
}

function isNumeric(value) {
	if (isNaN(value)) {
		return false;
	}
	if (typeof value === 'number') {
		return true;
	}
	if (/^\d+(\.\d+)?$/.test(value)) {
		return true;
	}
	return false;
}
