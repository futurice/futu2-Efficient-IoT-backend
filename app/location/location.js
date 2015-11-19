const { beacons } = require('../../config/config');

const findIndexById = (arr, id) => arr.findIndex(x => x && x.id === id);
const isValidNumber = (x) => !(isNaN(x) || x + x === x);
const curryCalculate = calculate([]);

exports.fromDeviceStream = function listen(stream) {
  return stream
    .map(mapDeviceLocation)
    .map(curryCalculate)
};

function mapDeviceLocation(device) {
  const index = findIndexById(beacons, device.id);
  const beacon = beacons[index];

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
function calculate(initialObjects) {
  const DEFAULT = {
    x: 0,
    y: 0
  };

  var arr = initialObjects;

  return function (device) {
    arr =
      arr
        .filter(obj => obj.id !== device.id)
        .concat([device])
        .slice(-3);

    if (arr.length < 3) {
      return DEFAULT;
    }

    const { x, y } = calculatePosition(arr, DEFAULT);

    return {
      x: isValidNumber(x) && x || 0,
      y: isValidNumber(y) && y || 0
    };
  }
}

function calculatePosition(objects){
  let [obj, obj2, obj3] = objects;
  const W = Math.pow(obj.distance, 2) - Math.pow(obj2.distance, 2) - Math.pow(obj.x, 2) - Math.pow(obj.y, 2) + Math.pow(obj2.x, 2) + Math.pow(obj2.y, 2);
  const Z = Math.pow(obj2.distance, 2) - Math.pow(obj3.distance, 2) - Math.pow(obj2.x, 2) - Math.pow(obj2.y, 2) + Math.pow(obj3.x, 2) + Math.pow(obj3.y, 2);
  const x = (W * (obj3.y - obj2.y) - Z * (obj2.y - obj.y)) / (2 * ((obj2.x - obj.x) * (obj3.y - obj2.y) - (obj3.x - obj2.x) * (obj2.y - obj.y)));
  const y = (W - 2 * x * (obj2.x - obj.x)) / (2 * (obj2.y - obj.y));

  return {
    x: x,
    y: y
  };
}
