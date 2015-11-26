/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    Player = require('player'),
    SETTINGS_PATH = path
      .resolve(global.APP_ROOT, 'shows/settings.json'),
    SCRIPT_PATH_DIR = path
      .resolve(global.APP_ROOT, 'shows/scripts/'),
    SOUND_PATH_DIR = path
      .resolve(global.APP_ROOT, 'client/assets/sounds/');

var serial = null;
var mav = null;
var connectionCnt = 0;
var lastMsg = null;
var connectionGood = false;
var connectionInterval = null;
var replMode = true ;

// global routines
var sendCmd = function(params) {
  if (!serial || !mav) {
    return;
  }

  mav.createMessage('SEND_PAYLOAD_CMD', {
    'target_system':        0, /* any */
    'target_component':     0, /* any */
    'cmd':                  params
  }, function(msg) {
    // console.log(msg.buffer);
    serial.write(msg.buffer);
    // serial.write(params.join(''));
  });
}

var execScript = function(fname, blocking) {
  var script = null;
  try {
    script = require(fname);

    if (script.length > 0) {
      console.log('\n====================== ACTION ======================');
      console.log(fname + " ~ ");

      var runScript = function(index) {
        if (index >= script.length) {
          console.log('======================== END ========================\n');
          if (blocking) {
            process.exit(0);
          }
          return;
        }

        if (script[index].dialog) {
          console.log("\t[Dialogue] " + script[index].dialog);
        }

        if (script[index].sound) {
          if (SoundList.hasOwnProperty(script[index].sound)) {
            console.log("\t[Audio] " + script[index].sound);
            SoundList[script[index].sound].play();
          } else {
            console.log("\tERR Loading sound");
          }
        }

        if (script[index].cmd.length > 64) {
          console.log("\tERR: Command string too long.");
        } else {
          console.log("\t>>", script[index].cmd);
          sendCmd(_.toArray(script[index].cmd));
        }

        setTimeout(function() {
          index++;
          runScript(index);
        }, script[index].time || 10);
      }

      runScript(0);

    } else {
      throw new Error("Not a valid script file!");
    }
  } catch(e) {
    console.log(e);
  }
}

var SoundList = null;

// preload all of the audio for playing
var InitAudio = function() {
  SoundList = {};
  fs.readdirSync(SOUND_PATH_DIR)
    .forEach(function (filename) {
    if(! /^\..*/.test(filename)) {
      SoundList[filename] = new Player(SOUND_PATH_DIR + '/' + filename);
    }
  });
}

var SerialInit = function() {
  var SerialPort =  require('serialport').SerialPort,
      mavlink =     require('mavlink');

  serial = new SerialPort(global.SERIAL_DEV, {
    baudrate: 57600
  });

  mav = new mavlink(1, 1);

  mav.on('ready', function() {
    console.log("MAV Ready");

    mav.on('HEARTBEAT', function(data, fields) {
      connectionCnt++;
      lastMsg = new Date();
    });

    // mav.on('COMMAND_ACK', function(data, fields) {
    //   console.log('ACK: ', fields);
    // });

  });

  serial.on('open', function(error) {
    if (error) {
      console.log("Failed to open serial. Reason:", error);
    } else {
      console.log("Serial opened sucessfully.");
      connectionGood = true;

      if (!replMode) {
        execScript(scriptLoc, true);
      }

      serial.on('error', function() {
        console.log('Serial Errror');
        serial.close();
      });

      serial.on('data', function(data) {
        //console.log(''+data);
        mav.parse(data);
      });
    }
  });

  //Check connection interval
  connectionInterval = setInterval(function() {
    if (connectionCnt > 1) {
      connectionGood = true;
    } else {
      connectionGood = false;
      console.log('Error: Lost Link');
      // clearInterval(connectionInterval);
      // serial.close();
      // serial.removeAllListeners();
      // mav.removeAllListeners();
      // SerialInit();
    }
    connectionCnt = 0;
  }, 5000);
}

// NOTE uncomment this
// SerialInit();
InitAudio();

// Get list of things
exports.index = function(req, res, next) {
  fs.readFile(SETTINGS_PATH, 'utf8', function(error, file) {
    if (error) {
      next(error);
    } else {
      var buffer;

      try {
        buffer = JSON.parse(file);
      } catch (e) {
        next(e);
      }

      // Read files
      var scripts = [];
      fs.readdirSync(SCRIPT_PATH_DIR)
        .forEach(function (filename) {
        if(! /^\..*/.test(filename)) {
          scripts.push(filename);
        }
      });

      var sounds = [];
      fs.readdirSync(SOUND_PATH_DIR)
        .forEach(function (filename) {
        if(! /^\..*/.test(filename)) {
          sounds.push(filename);
        }
      });

      // console.log(scripts);
      // console.log(sounds);

      res.json({
        things: buffer,
        scripts: scripts,
        sounds: sounds,
        soundPath: SOUND_PATH_DIR
      });
    }
  });
};

// Update
exports.update = function(req, res, next) {
  var buff = JSON.stringify(req.body);
  // console.log(buff);
  fs.writeFile(SETTINGS_PATH, buff, function(error) {
    if (error) {
      next(error);
    } else {
      res.json({error: null});
    }
  });
}

exports.create = function(req, res, next) {
  var thing = req.body;

  // cmds take priority
  if (thing.cmd) {
    console.log("Out>>", _.toArray(thing.cmd));
    sendCmd(_.toArray(thing.cmd));
  } else if (thing.script) {
    execScript(SCRIPT_PATH_DIR + "/" + thing.script, false);
  }

  res.json({error: null});
}
