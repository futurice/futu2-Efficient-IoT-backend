const Rx = require('rx');
const { beacons } = require('../../config/config');

exports.listen = function listen(socket) {
	const deviceStream =
		Rx.Observable
			.fromEventPattern(h => socket.on('beacon', h))
			.takeLast(3)
			.toArray();

	deviceStream.subscribe(
		function (devices) {
			socket.emit('location', calculatePosition(devices))
	 	},
	 	function (err) {
			 console.log('Error: ' + err);
	 	},
	 	function () {
			 console.log('Completed');
	 	}
	);
}

function calculatePosition (devices) {
	const devicesWithLocation = devices.map(mapDeviceLocation);
	return calculate(devicesWithLocation);
}
function mapDeviceLocation(obj) {
	const [found] = beacons.filter(b => b.id === obj.id);
	return Object.assign(obj, {
		x: found.x,
		y: found.y
	});
}

/*
 http://everything2.com/title/Triangulate
 http://stackoverflow.com/questions/20332856/triangulate-example-for-ibeacons#answer-20976803
*/
function calculate (objects) {
	let [obj, obj2, obj3] = objects;
	const W = Math.pow(obj.distance, 2) - Math.pow(obj2.distance, 2) - Math.pow(obj.x, 2) - Math.pow(obj.y, 2) + Math.pow(obj2.x, 2) + Math.pow(obj2.y, 2);
	const Z = Math.pow(obj2.distance, 2) - Math.pow(obj3.distance, 2) - Math.pow(obj2.x, 2) - Math.pow(obj2.y, 2) + Math.pow(obj3.x, 2) + Math.pow(obj3.y, 2);
	const x = (W * (obj3.y - obj2.y) - Z * (obj2.y - obj.y)) / (2 * ((obj2.x - obj.x) * (obj3.y - obj2.y) - (obj3.x - obj2.x) * (obj2.y - obj.y)));
	const y = (W - 2 * x * (obj2.x - obj.x)) / (2 * (obj2.y - obj.y));

	return {
		x: defaultOnInvalid(x),
		y: defaultOnInvalid(y)
	};
}

function defaultOnInvalid (result) {
	const isNotValid = (x) => isNaN(x) || x + x === x; // infinity + infinity = infinity
	return isNotValid(result) ? 0 : result;
}
