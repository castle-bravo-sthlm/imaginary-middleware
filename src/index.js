import path from 'path';
import fs from 'fs';
import hashObj from 'hash-obj';
import queryString from 'query-string';
import send from 'send';
import parseurl from 'parseurl';
import request from 'request';

export default function({serverUrl, sourceRoot, cacheRoot}) {

  return function(req, res, next) {

    const filetype = path.extname(req.path);
    const sourceFilePath = sourceRoot + parseurl(req).pathname;

    if(['.jpg', '.png'].indexOf(filetype) == -1){
      return next();
    }

    if(Object.keys(req.query).length === 0){
      return send(req, sourceFilePath, {
        maxAge: '1 year'
      }).pipe(res)
    }

    fs.stat(sourceFilePath, (err, stats) => {
      if(err){
        return next()
      }

      const obj = Object.assign({
        mtime: stats.mtime,
        originalPath: sourceFilePath
      }, req.query);

      const cacheFilePath = cacheRoot + hashObj(obj, {algorithm: 'md5'}) + filetype;
      send(req, cacheFilePath, {
        maxAge: '1 year'
      })
      .on('error', (err) => {
        if (err.code === 'ENOENT') {
          let file = fs.createReadStream(sourceFilePath)
          .pipe(request.post(serverUrl + `/${req.query.transform}` + parseurl(req).search))

          file.pipe(res)

          fs.mkdir(cacheRoot, (err) => {
            if(err && err.code !== 'EEXIST')
              console.log(err)

            file.pipe(fs.createWriteStream(cacheFilePath))
          });

        }else{
          res.statusCode = err.status || 500
          res.end(err.message)
        }
      })
      .pipe(res)
    })
  };
}
