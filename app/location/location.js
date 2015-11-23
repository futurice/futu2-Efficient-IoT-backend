const Rx = require('rx');
const { beacons } = require('../../config/index.js');

exports.fromDeviceStream = stream => {
  const beaconStreams = splitInToBeaconStreams(stream, beacons);
  return Rx.Observable.combineLatest(beaconStreams, (...results) => calculatePosition(results));
};

function splitInToBeaconStreams(stream, beacons) {
  return beacons.map(beacon => {
      return stream
        .filter(s => !(s.floor) || s.floor === beacon.floor)
        .filter(s => s.id === beacon.id)
        .map(device => mapDeviceWithBeacon(device, beacon));
    });
}

function mapDeviceWithBeacon(device, beacon) {
 return {
    id: device.id,
    name: device.name,
    distance: device.distance,
    x: beacon.x,
    y: beacon.y
  };
}

/*
 http://everything2.com/title/Triangulate
 http://stackoverflow.com/questions/20332856/triangulate-example-for-ibeacons#answer-20976803
 */

function calculatePosition(devices) {

  let [obj, obj2, obj3, ...rest] = devices;
  const W = getIntersectionPoint(obj, obj2);
  const Z = getIntersectionPoint(obj2, obj3);
  const Y = (W * (obj3.y - obj2.y) - Z * (obj2.y - obj.y));
  const x = Y / (2 * ((obj2.x - obj.x) * (obj3.y - obj2.y) - (obj3.x - obj2.x) * (obj2.y - obj.y)));
  const y = (W - 2 * x * (obj2.x - obj.x)) / (2 * (obj2.y - obj.y));

  return {
    name: obj.name,
    x: isValidPosition(x) && x || 0,
    y: isValidPosition(y) && y || 0
  };
}
const getIntersectionPoint = (obj1, obj2) => {
  const areaDifference = Math.pow(obj1.distance, 2) - Math.pow(obj2.distance, 2);
  return areaDifference - Math.pow(obj1.x, 2) - Math.pow(obj1.y, 2) + Math.pow(obj2.x, 2) + Math.pow(obj2.y, 2);
};

const isValidPosition = (x) => !(isNaN(x) || x + x === x); // infinity + infinity = infinity

