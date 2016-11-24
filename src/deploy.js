(function(){
  require("babel-polyfill")
  var path = require('path'),
      prompt = require('prompt'),
      build = require('./build.js').execute,
      fs = require('fs'),
      Q = require('q'),
      co = require('co'),
      _ = require('lodash'),
      oss = require('ali-oss'),
      readdirp = require('readdirp'),
      loginFile = path.join(process.cwd(), '.chcplogin');

  module.exports = {
    execute: execute
  };

  function execute(context) {
    var executeDfd = Q.defer();

    build(context).then(function(){
      deploy(context).then(function(){
        executeDfd.resolve();
      });
    });

    return executeDfd.promise;
  }

  function deploy(context) {
    var executeDfd = Q.defer(),
        config,
        credentials,
        ignore = context.ignoredFiles;

    try {
      config = fs.readFileSync(context.defaultConfig, 'utf8');
      config = JSON.parse(config);
    } catch(e) {
      console.log('Cannot parse cordova-hcp.json. Did you run cordova-hcp init?');
      process.exit(0);
    }
    if(!config) {
      console.log('You need to run "cordova-hcp init" before you can run "cordova-hcp login".');
      console.log('Both commands needs to be invoked in the root of the project directory.');
      process.exit(0);
    }
    try {
      credentials = fs.readFileSync(loginFile, 'utf8');
      credentials = JSON.parse(credentials);
    } catch(e) {
      console.log('Cannot parse .chcplogin: ', e);
    }
    if(!credentials) {
      console.log('You need to run "cordova-hcp login" before you can run "cordova-hcp deploy".');
      process.exit(0);
    }

    ignore = ignore.filter( ignoredFile => !ignoredFile.match(/^chcp/) )
    ignore = ignore.map( ignoredFile => `!${ignoredFile}` )

    // console.log('Credentials: ', credentials);
    // console.log('Config: ', config);
    // console.log('Ignore: ', ignore);
    // 
    var uploader = oss({
      accessKeyId: credentials.key,
      accessKeySecret: credentials.secret,
      region: 'oss-' + config.ossregion,
      bucket: config.ossbucket,
    })

    var files = readdirp({
      root: context.sourceDirectory,
      fileFilter: ignore
    }).on('data', function(file) {
      co(function* () {
        var filename = config.ossprefix + file.path.replace(/\\/g,'/')
        var res = yield uploader.put(filename, file.fullPath)
        if (res.res.status == 200) {
          console.log("Updated " + file.fullPath + ' -> ' + res.url)
        } else {
          console.error("unable to sync:", res.res)
          executeDfd.reject();
        }
      }).catch(function (err) {
        console.log(err);
      })
    }).on('error', function(err) {
      console.error("unable to sync:", err.stack);
      executeDfd.reject();
    }).on('fail', function(err) {
      console.error("unable to sync:", err);
      executeDfd.reject();
    }).on('end', function() {

      console.log("Deploy done")
      executeDfd.resolve();
    })
    return executeDfd.promise;
  }
})();
