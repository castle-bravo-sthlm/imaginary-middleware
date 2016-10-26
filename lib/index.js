'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (opt) {

  var proxy = new ImaginaryProxy(opt);

  return function (req, res, next) {
    var _url$parse2 = _url2.default.parse(req.url, true);

    var pathname = _url$parse2.pathname;
    var query = _url$parse2.query;

    var filetype = _path2.default.extname(pathname);
    //log.debug('received', { url: req.url, pathname, query, filetype})
    if (['.jpg', '.png'].indexOf(filetype) == -1) {
      return next();
    }

    if (!query.transform) {
      return next();
    }
    log.debug('handling', query);
    proxy.handleQueryRequest(req, res, next);
  };
};

require('babel-polyfill');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

var _hashObj = require('hash-obj');

var _hashObj2 = _interopRequireDefault(_hashObj);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _bole = require('bole');

var _bole2 = _interopRequireDefault(_bole);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var log = (0, _bole2.default)('imaginary-middleware');

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
      var _url$parse, pathname, query, search, self, _sendCacheFile, _setHeaders, sourcePath, sourceStat, filetype, obj, hash, cachePath;

      return regeneratorRuntime.async(function handleQueryRequest$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _setHeaders = function _setHeaders(cachePath, hash) {
                res.setHeader('Content-Type', _mimeTypes2.default.contentType(_path2.default.extname(cachePath)) || 'application/octet-stream');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                res.setHeader('ETag', hash);

                if (req.headers['if-none-match'] === hash) {
                  res.statusCode = 304;
                }
              };

              _sendCacheFile = function _sendCacheFile(sourcePath, cachePath) {
                var file;
                return regeneratorRuntime.async(function _sendCacheFile$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        file = _fs2.default.createReadStream(sourcePath).pipe(_request2.default.post(self.serverUrl + query.transform + search));


                        _fs2.default.mkdir(self.cacheRoot, function (err) {
                          if (err && err.code !== 'EEXIST') log.error(err);

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

              _url$parse = _url2.default.parse(req.url, true);
              pathname = _url$parse.pathname;
              query = _url$parse.query;
              search = _url$parse.search;
              self = this;
              _context2.prev = 7;
              sourcePath = _path2.default.join(this.sourceRoot, pathname);
              _context2.next = 11;
              return regeneratorRuntime.awrap(_fs2.default.stat(sourcePath));

            case 11:
              sourceStat = _context2.sent;
              filetype = _path2.default.extname(sourcePath);
              obj = Object.assign({
                mtime: sourceStat.mtime,
                originalPath: sourcePath
              }, query);
              hash = (0, _hashObj2.default)(obj, { algorithm: 'md5' });
              cachePath = _path2.default.join(this.cacheRoot, hash + filetype);


              _setHeaders(cachePath, hash);

              _context2.next = 19;
              return regeneratorRuntime.awrap(_fs2.default.exists(cachePath));

            case 19:
              if (!_context2.sent) {
                _context2.next = 23;
                break;
              }

              _fs2.default.createReadStream(cachePath).pipe(res);
              _context2.next = 25;
              break;

            case 23:
              _context2.next = 25;
              return regeneratorRuntime.awrap(_sendCacheFile(sourcePath, cachePath));

            case 25:
              _context2.next = 31;
              break;

            case 27:
              _context2.prev = 27;
              _context2.t0 = _context2['catch'](7);

              log.error(_context2.t0);
              return _context2.abrupt('return', next());

            case 31:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this, [[7, 27]]);
    }
  }]);

  return ImaginaryProxy;
}();