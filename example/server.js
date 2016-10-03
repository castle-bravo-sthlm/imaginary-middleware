import express from 'express';
import ic from './lib/index.js';

const app = express();

// app.use('/', function(req,res,next){
//   console.log(req.url);
//   next();
// })

app.use(ic({
  serverUrl: 'http://localhost:9000',
  sourceRoot: './example',
  cacheRoot: './example/images/cache'
  })
);

app.use('/', express.static('example'));

app.listen(3000);
