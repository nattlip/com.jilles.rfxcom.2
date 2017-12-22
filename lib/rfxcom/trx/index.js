

// Bitmap definitions for 'supported protocols' message
exports.protocols = {
  BLYSS: {bit: 0x01, msg: 3},
  RUBICSON: {bit: 0x02, msg: 3},
  FINEOFFSET: {bit: 0x04, msg: 3},
  LIGHTING4: {bit: 0x08, msg: 3},
  RSL: {bit: 0x10, msg: 3},
  BYRONSX: {bit: 0x20, msg: 3},
  RFU6: {bit: 0x40, msg: 3},
  MERTIK: {bit: 0x01, msg: 4},
  LIGHTWAVERF: {bit: 0x02, msg: 4},
  HIDEKI: {bit: 0x04, msg: 4},
  LACROSSE: {bit: 0x08, msg: 4},
  FS20: {bit: 0x10, msg: 4},
  PROGUARD: {bit: 0x20, msg: 4},
  ROLLERTROL: {bit: 0x40, msg: 4},
  BLINDST14: {bit: 0x80, msg: 4},
  X10: {bit: 0x01, msg: 5},
  ARC: {bit: 0x02, msg: 5},
  AC: {bit: 0x04, msg: 5},
  HOMEEASY: {bit: 0x08, msg: 5},
  MEIANTECH: {bit: 0x10, msg: 5},
  OREGON: {bit: 0x20, msg: 5},
  ATI: {bit: 0x40, msg: 5},
  VISONIC: {bit: 0x80, msg: 5}
};

// Establish reflection mapping (BiMap) for an Array, or throw an error if the array is not reflectable

// Various definitions
exports.security = {
  NORMAL: 0,
  NORMAL_DELAYED: 1,
  ALARM: 2,
  ALARM_DELAYED: 3,
  MOTION: 4,
  NO_MOTION: 5,
  X10_DOOR_WINDOW_SENSOR: 0,
  X10_MOTION_SENSOR: 1,
  X10_SECURITY_REMOTE: 2
};

exports.humidity = {
  NORMAL: 0,
  COMFORT: 1,
  DRY: 2,
  WET: 3
};

exports.forecast = {
  NO_FORECAST: 0,
  SUNNY: 1,
  PARTLY_CLOUDY: 2,
  CLOUDY: 3,
  RAIN: 4
};

exports.rfxsensor = {
  TEMP: 0,
  AD: 1,
  VOLTAGE: 2,
  MESSAGE: 3
};

// Codes used in "response" events
exports.responseCode = {
    OK: 0x00,
    TX_DELAYED: 0x01,
    TX_LOCK_FAILED: 0x02,
    ILLEGAL_AC_ADDRESS: 0x03,
    UNKNOWN_COMMAND: 0x04,
    UNKNOWN_REMOTE_ID: 0x05,
    TIMEOUT: 0x06
};
