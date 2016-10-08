import "babel-polyfill";
import path from 'path';
import mz from 'mz/fs';
import hashObj from 'hash-obj';
import parseurl from 'parseurl';
import request from 'request';

class ImaginaryProxy {
  constructor({serverUrl, cacheRoot, sourceRoot}){
    this.serverUrl = serverUrl.replace(/\/?$/, '/');
    this.cacheRoot = cacheRoot.replace(/\/?$/, '/');
    this.sourceRoot = sourceRoot.replace(/\/?$/, '/');
  }

  async handleQueryRequest(req, res, next){

    const self = this;
    async function _sendCacheFile(sourcePath, cachePath){
      let file = mz.createReadStream(sourcePath)
        .pipe(request.post(self.serverUrl + req.query.transform + parseurl(req).search))

      mz.mkdir(self.cacheRoot, (err) => {
        if(err && err.code !== 'EEXIST')
          console.err(err)

        file.pipe(res)
        file.pipe(mz.createWriteStream(cachePath))

      });
    }

    function _setHeaders(cachePath, hash){
      res.type(cachePath);
      res.set({
        'Cache-Control': 'public, max-age=31536000',
        'ETag': hash
      })

      if(req.headers['if-none-match'] === hash){
        res.status(304)
      }
    }

    try {
      const sourcePath = path.join(this.sourceRoot, parseurl(req).pathname);
      const sourceStat = await mz.stat(sourcePath);
      const filetype = path.extname(sourcePath);

      const obj = Object.assign({
        mtime: sourceStat.mtime,
        originalPath: sourcePath
      }, req.query);

      const hash = hashObj(obj, {algorithm: 'md5'});
      const cachePath = path.join(this.cacheRoot, hash+filetype);

      _setHeaders(cachePath, hash)

      if (await mz.exists(cachePath)){
        mz.createReadStream(cachePath).pipe(res);
      }else{
        await _sendCacheFile(sourcePath, cachePath)
      }
    }catch(err){
      console.log(err);
      return next();
    }
  }
}

export default function(opt) {

  return function(req, res, next) {
    const filetype = path.extname(req.path);

    if(['.jpg', '.png'].indexOf(filetype) == -1){
      return next();
    }

    if(Object.keys(req.query).length === 0){
      return next()
    }

    new ImaginaryProxy(opt).handleQueryRequest(req, res, next);

  };
}
