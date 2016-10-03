import "babel-polyfill";
import path from 'path';
import mz from 'mz/fs';
import hashObj from 'hash-obj';
import parseurl from 'parseurl';
import request from 'request';

class ImaginaryProxy {
  constructor(req, res, next, opt){
    this.req = req;
    this.res = res;
    this.next = next;
    this.serverUrl = opt.serverUrl.replace(/\/?$/, '/');
    this.cacheRoot = opt.cacheRoot.replace(/\/?$/, '/');
    this.sourceRoot = opt.sourceRoot.replace(/\/?$/, '/');
  }

  async handleQueryRequest(){
    try {
      const sourcePath = path.join(this.sourceRoot, parseurl(this.req).pathname);
      const sourceStat = await mz.stat(sourcePath);
      const filetype = path.extname(sourcePath);

      const obj = Object.assign({
        mtime: sourceStat.mtime,
        originalPath: sourcePath
      }, this.req.query);

      const hash = hashObj(obj, {algorithm: 'md5'});
      const cachePath = path.join(this.cacheRoot, hash+filetype);

      this._setHeaders(cachePath, hash)

      if (await mz.exists(cachePath)){
        mz.createReadStream(cachePath).pipe(this.res);
      }else{
        await this.createCacheFile(sourcePath, cachePath)
      }
    }catch(err){
      console.log(err);
      return this.next();
    }
  }

  async createCacheFile(sourcePath, cachePath){
    let file = mz.createReadStream(sourcePath)
      .pipe(request.post(this.serverUrl + this.req.query.transform + parseurl(this.req).search))

    mz.mkdir(this.cacheRoot, (err) => {
      if(err && err.code !== 'EEXIST')
        console.err(err)

      file.pipe(this.res)
      file.pipe(mz.createWriteStream(cachePath))

    });
  }

  _setHeaders(cachePath, hash){
    this.res.type(cachePath);
    this.res.set({
      'Cache-Control': 'public, max-age=31536000',
      'ETag': hash
    })

    if(this.req.headers['if-none-match'] === hash){
      this.res.status(304)
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

    new ImaginaryProxy(req, res, next, opt).handleQueryRequest();

  };
}
