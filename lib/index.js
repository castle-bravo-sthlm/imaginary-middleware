'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (opt) {

  return function (req, res, next) {
    var filetype = _path2.default.extname(req.path);

    if (['.jpg', '.png'].indexOf(filetype) == -1) {
      return next();
    }

    if (Object.keys(req.query).length === 0) {
      return next();
    }

    new ImaginaryProxy(opt).handleQueryRequest(req, res, next);
  };
};

require('babel-polyfill');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

var _hashObj = require('hash-obj');

var _hashObj2 = _interopRequireDefault(_hashObj);

var _parseurl = require('parseurl');

var _parseurl2 = _interopRequireDefault(_parseurl);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImaginaryProxy = function () {
  function ImaginaryProxy(_ref) {
    var serverUrl = _ref.serverUrl;
    var cacheRoot = _ref.cacheRoot;
    var sourceRoot = _ref.sourceRoot;

    _classCallCheck(this, ImaginaryProxy);

    this.serverUrl = serverUrl.replace(/\/?$/, '/');
    this.cacheRoot = cacheRoot.replace(/\/?$/, '/');
    this.sourceRoot = sourceRoot.replace(/\/?$/, '/');
  }

  _createClass(ImaginaryProxy, [{
    key: 'handleQueryRequest',
    value: function handleQueryRequest(req, res, next) {
      var self, _sendCacheFile, _setHeaders, sourcePath, sourceStat, filetype, obj, hash, cachePath;

      return regeneratorRuntime.async(function handleQueryRequest$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _setHeaders = function _setHeaders(cachePath, hash) {
                res.type(cachePath);
                res.set({
                  'Cache-Control': 'public, max-age=31536000',
                  'ETag': hash
                });

                if (req.headers['if-none-match'] === hash) {
                  res.status(304);
                }
              };

              _sendCacheFile = function _sendCacheFile(sourcePath, cachePath) {
                var file;
                return regeneratorRuntime.async(function _sendCacheFile$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        file = _fs2.default.createReadStream(sourcePath).pipe(_request2.default.post(self.serverUrl + req.query.transform + (0, _parseurl2.default)(req).search));


                        _fs2.default.mkdir(self.cacheRoot, function (err) {
                          if (err && err.code !== 'EEXIST') console.err(err);

                          file.pipe(res);
                          file.pipe(_fs2.default.createWriteStream(cachePath));
                        });

                      case 2:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, null, this);
              };

              self = this;
              _context2.prev = 3;
              sourcePath = _path2.default.join(this.sourceRoot, (0, _parseurl2.default)(req).pathname);
              _context2.next = 7;
              return regeneratorRuntime.awrap(_fs2.default.stat(sourcePath));

            case 7:
              sourceStat = _context2.sent;
              filetype = _path2.default.extname(sourcePath);
              obj = Object.assign({
                mtime: sourceStat.mtime,
                originalPath: sourcePath
              }, req.query);
              hash = (0, _hashObj2.default)(obj, { algorithm: 'md5' });
              cachePath = _path2.default.join(this.cacheRoot, hash + filetype);


              _setHeaders(cachePath, hash);

              _context2.next = 15;
              return regeneratorRuntime.awrap(_fs2.default.exists(cachePath));

            case 15:
              if (!_context2.sent) {
                _context2.next = 19;
                break;
              }

              _fs2.default.createReadStream(cachePath).pipe(res);
              _context2.next = 21;
              break;

            case 19:
              _context2.next = 21;
              return regeneratorRuntime.awrap(_sendCacheFile(sourcePath, cachePath));

            case 21:
              _context2.next = 27;
              break;

            case 23:
              _context2.prev = 23;
              _context2.t0 = _context2['catch'](3);

              console.log(_context2.t0);
              return _context2.abrupt('return', next());

            case 27:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this, [[3, 23]]);
    }
  }]);

  return ImaginaryProxy;
}();