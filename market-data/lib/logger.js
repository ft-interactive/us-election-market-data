
'use strict';

// light weight logger

const log = (app, type, message) => {
	if (type === 'maskSource') {
		message = message.replace(/(\?|\&)([source=]+)\=([^&]+)/, '&source=**********');
		type = 'INFO';
	}
	console.log(`[${stamp()} / ${app}] ${type.toUpperCase()}:: ${message}`);
};

const stamp = () => {
	return new Date().toUTCString();
};

const types = [
	'info',
	'error',
	'maskSource'
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
