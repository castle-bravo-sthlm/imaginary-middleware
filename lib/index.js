'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var serverUrl = _ref.serverUrl;
  var sourceRoot = _ref.sourceRoot;
  var cacheRoot = _ref.cacheRoot;


  return function (req, res, next) {

    var filetype = _path2.default.extname(req.path);
    var sourceFilePath = sourceRoot + (0, _parseurl2.default)(req).pathname;

    if (['.jpg', '.png'].indexOf(filetype) == -1) {
      return next();
    }

    if (Object.keys(req.query).length === 0) {
      return (0, _send2.default)(req, sourceFilePath, {
        maxAge: '1 year'
      }).pipe(res);
    }

    _fs2.default.stat(sourceFilePath, function (err, stats) {
      if (err) {
        return next();
      }

      var obj = Object.assign({
        mtime: stats.mtime,
        originalPath: sourceFilePath
      }, req.query);

      var cacheFilePath = cacheRoot + (0, _hashObj2.default)(obj, { algorithm: 'md5' }) + filetype;
      (0, _send2.default)(req, cacheFilePath, {
        maxAge: '1 year'
      }).on('error', function (err) {
        if (err.code === 'ENOENT') {
          (function () {
            var file = _fs2.default.createReadStream(sourceFilePath).pipe(_request2.default.post(serverUrl + ('/' + req.query.transform) + (0, _parseurl2.default)(req).search));

            file.pipe(res);

            _fs2.default.mkdir(cacheRoot, function (err) {
              if (err && err.code !== 'EEXIST') console.log(err);

              file.pipe(_fs2.default.createWriteStream(cacheFilePath));
            });
          })();
        } else {
          res.statusCode = err.status || 500;
          res.end(err.message);
        }
      }).pipe(res);
    });
  };
};

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _hashObj = require('hash-obj');

var _hashObj2 = _interopRequireDefault(_hashObj);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _send = require('send');

var _send2 = _interopRequireDefault(_send);

var _parseurl = require('parseurl');

var _parseurl2 = _interopRequireDefault(_parseurl);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }