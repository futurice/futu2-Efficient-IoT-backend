const Rx = require('rx');
const { beacons } = require('../../config/config');

const isValidNumber = (x) => !(isNaN(x) || x + x === x);

exports.fromDeviceStream = stream => {
  const beaconStreams = splitInToBeaconStreams(stream, beacons);
  return Rx.Observable.combineLatest(beaconStreams, (...results) => calculatePosition(results));
};

function splitInToBeaconStreams(stream, beacons) {
  return beacons.map(beacon => {
      return stream
        .filter(s => s.id === beacon.id)
        .map(device => mapDeviceLocation(device, beacon));
    });
}

function mapDeviceLocation(device, beacon) {
  return {
    id: device.id,
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
  const W = Math.pow(obj.distance, 2) - Math.pow(obj2.distance, 2) - Math.pow(obj.x, 2) - Math.pow(obj.y, 2) + Math.pow(obj2.x, 2) + Math.pow(obj2.y, 2);
  const Z = Math.pow(obj2.distance, 2) - Math.pow(obj3.distance, 2) - Math.pow(obj2.x, 2) - Math.pow(obj2.y, 2) + Math.pow(obj3.x, 2) + Math.pow(obj3.y, 2);
  const x = (W * (obj3.y - obj2.y) - Z * (obj2.y - obj.y)) / (2 * ((obj2.x - obj.x) * (obj3.y - obj2.y) - (obj3.x - obj2.x) * (obj2.y - obj.y)));
  const y = (W - 2 * x * (obj2.x - obj.x)) / (2 * (obj2.y - obj.y));

  return {
    x: isValidNumber(x) && x || 0,
    y: isValidNumber(y) && y || 0
  };
}

