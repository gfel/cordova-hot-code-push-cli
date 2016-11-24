'use strict';

(function () {
  var path = require('path'),
      prompt = require('prompt'),
      fs = require('fs-extra'),
      async = require('async'),
      crypto = require('crypto'),
      Q = require('q'),
      _ = require('lodash'),
      createHash = require('crypto').createHash,
      recursive = require('recursive-readdir'),
      hidefile = require('hidefile'),
      chcpContext;

  module.exports = {
    execute: execute
  };

  function execute(context) {
    chcpContext = context;

    var executeDfd = Q.defer(),
        config = prepareConfig(context),
        ignore = context.ignoredFiles;

    recursive(chcpContext.sourceDirectory, ignore, function (err, files) {
      var hashQueue = prepareFilesHashQueue(files);

      async.parallelLimit(hashQueue, 10, function (err, result) {
        result.sort(function (a, b) {
          return a.file.localeCompare(b.file);
        });
        var json = JSON.stringify(result, null, 2);
        var manifestFile = chcpContext.manifestFilePath;

        fs.writeFile(manifestFile, json, function (err) {
          if (err) {
            return console.log(err);
          }

          if (context.argv && context.argv.localdev) {
            config.update = 'now';
          }
          var json = JSON.stringify(config, null, 2);
          fs.writeFile(chcpContext.projectsConfigFilePath, json, function (err) {
            if (err) {
              return console.log(err);
            }
            console.log('Build ' + config.release + ' created in ' + chcpContext.sourceDirectory);
            executeDfd.resolve(config);
          });
        });
      });
    });

    return executeDfd.promise;
  }

  function prepareFilesHashQueue(files) {
    var queue = [];
    for (var i in files) {
      var file = files[i];
      if (!hidefile.isHiddenSync(file)) {
        queue.push(hashFile.bind(null, file));
      }
    }

    return queue;
  }

  function prepareConfig(context) {
    var config = {};

    try {
      config = fs.readFileSync(context.defaultConfig, 'utf8');
      config = JSON.parse(config);
      config.release = process.env.VERSION || calculateTimestamp();
    } catch (e) {
      config = {
        autogenerated: true,
        release: calculateTimestamp()
      };
    }

    if (context.argv && context.argv.content_url) {
      config.content_url = context.argv.content_url;
    }

    console.log('Config', config);
    return config;
  }

  function hashFile(filename, callback) {
    var hash = crypto.createHash('md5'),
        stream = fs.createReadStream(filename);

    //stream.pipe(writeStream);
    //console.log('Hashing: ', filename);
    stream.on('data', function (data) {
      hash.update(data, 'utf8');
    });

    stream.on('end', function () {
      var result = hash.digest('hex'),
          file = path.relative(chcpContext.sourceDirectory, filename).replace(new RegExp("\\\\", "g"), "/");

      callback(null, {
        file: file,
        hash: result
      });
    });
  }

  function calculateTimestamp() {
    var currentdate = new Date();
    return currentdate.getFullYear() + '.' + (currentdate.getMonth() + 1 < 10 ? '0' + (currentdate.getMonth() + 1) : currentdate.getMonth() + 1) + '.' + (currentdate.getDate() < 10 ? '0' + currentdate.getDate() : currentdate.getDate()) + '-' + (currentdate.getHours() < 10 ? '0' + currentdate.getHours() : currentdate.getHours()) + '.' + (currentdate.getMinutes() < 10 ? '0' + currentdate.getMinutes() : currentdate.getMinutes()) + '.' + (currentdate.getSeconds() < 10 ? '0' + currentdate.getSeconds() : currentdate.getSeconds());
  }
})();
//# sourceMappingURL=build.js.map