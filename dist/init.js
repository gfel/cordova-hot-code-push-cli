'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.execute = execute;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prompt = require('prompt');

var _prompt2 = _interopRequireDefault(_prompt);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('./utils');

_es6Promise2['default'].polyfill();

var configFile = _path2['default'].join(process.cwd(), 'cordova-hcp.json');

var name = {
  description: 'Enter project name (required)',
  pattern: /^[a-zA-Z\-\s0-9]+$/,
  message: 'Name must be only letters, numbers, space or dashes',
  required: true
};

var ossbucket = {
  description: 'Aliyun OSS Bucket name (required for cordova-hcp-oss deploy)',
  pattern: /^[a-zA-Z\-0-9\.]+$/,
  message: 'Name must be only letters, numbers, or dashes'
};

var ossprefix = {
  description: 'Path in OSS bucket (optional for cordova-hcp-oss deploy)',
  pattern: /^[a-zA-Z\-\s0-9\.\/]+\/$/,
  message: 'Path must be only letters, numbers, spaces, forward slashes or dashes and must end with a forward slash'
};

var ossregion = {
  description: 'OSS current data region (required for cordova-hcp-oss deploy)',
  pattern: /^(cn-hangzhou|cn-shanghai|cn-qingdao|cn-beijing|cn-shenzhen|cn-hongkong|us-west-1|ap-southeast-1)$/,
  'default': 'cn-shanghai',
  message: 'Must be one of: cn-hangzhou, cn-shanghai, cn-qingdao, cn-beijing, cn-shenzhen, cn-hongkong, us-west-1, ap-southeast-1'
};

var ossendpoint = {
  description: 'OSS region domian or CDN domian. Do not add "/" at the end',
  pattern: /^[a-zA-Z\-\s0-9\:\.\/]+\/$/,
  message: 'Path must be only letters, numbers, spaces, forward slashes or dashes and must end with a forward slash'
};

var iosIdentifier = {
  description: 'IOS app identifier',
  pattern: /^[a-zA-Z\-0-9\.]+$/
};

var androidIdentifier = {
  description: 'Android app identifier',
  pattern: /^[a-zA-Z\-0-9\.]+$/
};

var update = {
  description: 'Update method (required)',
  pattern: /(start|resume|now)/,
  required: true,
  message: 'Needs to be one of start, resume or now',
  'default': 'resume'
};

var schema = {
  properties: {
    name: name,
    ossbucket: ossbucket,
    ossprefix: ossprefix,
    ossregion: ossregion,
    ossendpoint: ossendpoint,
    ios_identifier: iosIdentifier,
    android_identifier: androidIdentifier,
    update: update
  }
};

var urlSchema = {
  properties: {
    content_url: {
      description: 'Enter full URL to directory where cordova-hcp-oss build result will be uploaded',
      message: 'Must supply URL',
      required: true
    }
  }
};

function execute(context) {
  _prompt2['default'].override = context.argv;
  _prompt2['default'].message = 'Please provide';
  _prompt2['default'].delimiter = ': ';
  _prompt2['default'].start();

  var result = undefined;

  (0, _utils.getInput)(_prompt2['default'], schema).then(validateBucket).then(function (res) {
    return result = res;
  }).then(getUrl).then(function (url) {
    return _lodash2['default'].assign(result, url);
  }).then(function (content) {
    return (0, _utils.writeFile)(configFile, content);
  }).then(done);
}

function validateBucket(result) {
  if (!result.ossbucket) {
    return _lodash2['default'].omit(result, ['ossregion', 'ossbucket', 'ossprefix', 'ossendpoint']);
  }

  return result;
}

function getUrl(_ref) {
  var region = _ref.ossregion;
  var bucket = _ref.ossbucket;
  var path = _ref.ossprefix;
  var endpoint = _ref.ossendpoint;

  if (!bucket) {
    return (0, _utils.getInput)(_prompt2['default'], urlSchema);
  }

  return { content_url: getContentUrl(region, bucket, path, endpoint) };
}

function getContentUrl(region, bucket, path, endpoint) {
  var url = '';
  if (endpoint) {
    url = endpoint;
  } else {
    url = 'oss-' + region + '.aliyuncs.com';
    url = 'http://' + bucket + '.' + url;
  }

  if (path) {
    url += '/' + path;
  }

  return url;
}

function done(err) {
  if (err) {
    return console.log(err);
  }
  console.log('Project initialized and cordova-hcp.json file created.');
  console.log('If you wish to exclude files from being published, specify them in .chcpignore');
  console.log('Before you can push updates you need to run "cordova-hcp-oss login" in project directory');
}
//# sourceMappingURL=init.js.map