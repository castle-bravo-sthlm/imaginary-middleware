import "babel-polyfill";
import path from 'path';
import url from 'url';
import mz from 'mz/fs';
import hashObj from 'hash-obj';
import request from 'request';
import bole from 'bole';
import mime from 'mime-types';

const log = bole('imaginary-middleware');

class ImaginaryProxy {
  constructor({serverUrl, cacheRoot, sourceRoot}){
    this.serverUrl = serverUrl.replace(/\/?$/, '/');
    this.cacheRoot = cacheRoot.replace(/\/?$/, '/');
    this.sourceRoot = sourceRoot.replace(/\/?$/, '/');
  }

  async handleQueryRequest(req, res, next){
    const { pathname, query, search } = url.parse(req.url, true);

    const self = this;
    async function _sendCacheFile(sourcePath, cachePath){
      let file = mz.createReadStream(sourcePath)
        .pipe(request.post(self.serverUrl + query.transform + search))

      mz.mkdir(self.cacheRoot, (err) => {
        if(err && err.code !== 'EEXIST')
          log.error(err)

        file.pipe(res)
        file.pipe(mz.createWriteStream(cachePath))

      });
    }

    function _setHeaders(cachePath, hash){
      res.setHeader('Content-Type', mime.contentType(path.extname(cachePath)) || 'application/octet-stream')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      res.setHeader('ETag', hash)

      if(req.headers['if-none-match'] === hash){
        res.statusCode = 304;
      }
    }

    try {
      const sourcePath = path.join(this.sourceRoot, pathname);
      const sourceStat = await mz.stat(sourcePath);
      const filetype = path.extname(sourcePath);

      const obj = Object.assign({
        mtime: sourceStat.mtime,
        originalPath: sourcePath
      }, query);

      const hash = hashObj(obj, {algorithm: 'md5'});
      const cachePath = path.join(this.cacheRoot, hash+filetype);

      _setHeaders(cachePath, hash)

      if (await mz.exists(cachePath)){
        mz.createReadStream(cachePath).pipe(res);
      }else{
        await _sendCacheFile(sourcePath, cachePath)
      }
    }catch(err){
      log.error(err);
      return next();
    }
  }
}

export default function(opt) {

  const proxy = new ImaginaryProxy(opt);

  return function(req, res, next) {
    const { pathname, query } = url.parse(req.url, true);
    const filetype = path.extname(pathname);
    //log.debug('received', { url: req.url, pathname, query, filetype})
    if(['.jpg', '.png'].indexOf(filetype) == -1){
      return next();
    }

    if(!query.transform){
      return next()
    }
    log.debug('handling', query);
    proxy.handleQueryRequest(req, res, next);

  };
}
