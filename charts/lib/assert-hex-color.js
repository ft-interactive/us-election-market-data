'use strict';

module.exports = assertHexColor;

function assertHexColor(value, message) {
	if (!isHexColor(value)) {
		throw new Error(message);
	}
}

function isHexColor(value) {
	if (typeof value !== 'string') {
		return false;
	}
	if (/^#?([a-f0-9]{3}|[a-f0-9]{6})$/i.test(value)) {
		return true;
	}
	return false;
}
