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

    new ImaginaryTransformer(req, res, next, opt).handleQueryRequest();
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

var ImaginaryTransformer = function () {
  function ImaginaryTransformer(req, res, next, opt) {
    _classCallCheck(this, ImaginaryTransformer);

    this.req = req;
    this.res = res;
    this.next = next;
    this.serverUrl = opt.serverUrl.replace(/\/?$/, '/');
    this.cacheRoot = opt.cacheRoot.replace(/\/?$/, '/');
    this.sourceRoot = opt.sourceRoot.replace(/\/?$/, '/');
  }

  _createClass(ImaginaryTransformer, [{
    key: 'handleQueryRequest',
    value: function handleQueryRequest() {
      var sourcePath, sourceStat, filetype, obj, hash, cachePath;
      return regeneratorRuntime.async(function handleQueryRequest$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              sourcePath = _path2.default.join(this.sourceRoot, (0, _parseurl2.default)(this.req).pathname);
              _context.next = 4;
              return regeneratorRuntime.awrap(_fs2.default.stat(sourcePath));

            case 4:
              sourceStat = _context.sent;
              filetype = _path2.default.extname(sourcePath);
              obj = Object.assign({
                mtime: sourceStat.mtime,
                originalPath: sourcePath
              }, this.req.query);
              hash = (0, _hashObj2.default)(obj, { algorithm: 'md5' });
              cachePath = _path2.default.join(this.cacheRoot, hash + filetype);


              this._setHeaders(cachePath, hash);

              _context.next = 12;
              return regeneratorRuntime.awrap(_fs2.default.exists(cachePath));

            case 12:
              if (!_context.sent) {
                _context.next = 16;
                break;
              }

              _fs2.default.createReadStream(cachePath).pipe(this.res);
              _context.next = 18;
              break;

            case 16:
              _context.next = 18;
              return regeneratorRuntime.awrap(this.createCacheFile(sourcePath, cachePath));

            case 18:
              _context.next = 24;
              break;

            case 20:
              _context.prev = 20;
              _context.t0 = _context['catch'](0);

              console.log(_context.t0);
              return _context.abrupt('return', this.next());

            case 24:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this, [[0, 20]]);
    }
  }, {
    key: 'createCacheFile',
    value: function createCacheFile(sourcePath, cachePath) {
      var _this = this;

      var file;
      return regeneratorRuntime.async(function createCacheFile$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              file = _fs2.default.createReadStream(sourcePath).pipe(_request2.default.post(this.serverUrl + this.req.query.transform + (0, _parseurl2.default)(this.req).search));


              _fs2.default.mkdir(this.cacheRoot, function (err) {
                if (err && err.code !== 'EEXIST') console.err(err);

                file.pipe(_this.res);
                file.pipe(_fs2.default.createWriteStream(cachePath));
              });

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: '_setHeaders',
    value: function _setHeaders(cachePath, hash) {
      this.res.type(cachePath);
      this.res.set({
        'Cache-Control': 'public, max-age=31536000',
        'ETag': hash
      });

      if (this.req.headers['if-none-match'] === hash) {
        this.res.status(304);
      }
    }
  }]);

  return ImaginaryTransformer;
}();