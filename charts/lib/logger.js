
'use strict';

// light weight logger

const log = (app, type, message) => {
	console.log(`${stamp()} - ${type.toUpperCase()}:: ${message}`);
};

const stamp = () => {
	return new Date().toUTCString();
};

const types = [
	'info',
	'error'
];

const init = (app) => {
	let self = {};

	types.forEach(type => {
		self[type] = function (msg) {
			log (app, type, msg);
		};
	});

	return self;
};

module.exports = init;
