require('dotenv').config({ silent: true });

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const http = require('http');
const moment = require('moment-timezone');
moment.tz.setDefault('UTC');
const serialize = require('serialize-javascript');

app.use('/public', express.static(path.join(__dirname, 'public')));
//app.use('/dist', express.static(path.join(__dirname, 'dist')));

let renderer;

if(process.env.NODE_ENV === 'production'){
  let bundle = fs.readFileSync('./dist/node.bundle.js', 'utf8');
  renderer = require('vue-server-renderer').createBundleRenderer(bundle);
  app.use('/dist', express.static(path.join(__dirname, 'dist')));
}

let events = [
  {description: 'Random event 1', date: moment('2017-02-6', 'YYYY-MM-DD')},
  {description: 'Random event 2', date: moment('2017-02-15', 'YYYY-MM-DD')},
  {description: 'Random event 3', date: moment('2017-03-15', 'YYYY-MM-DD')}
];

app.get('/', (req, res) => {
  let template = fs.readFileSync(path.resolve('./index.html'), 'utf-8');
  let contentMarker = '<!--App-->';
  if(renderer){
    renderer.renderToString({}, (err, html) => {
      if(err){
        console.log(err);
      }else{
        res.send(template.replace(contentMarker, `<script>var __INITIAL_STATE__ = ${ serialize(events) }</script>\n${html}`));
      }
    });
  }else{
    res.send('<p>Awaiting compilation..</p><script src="/reload/reload.js"></script>')
  }
});



app.use(require('body-parser').json());

app.post('/add_event', (req, res) => {
  events.push(req.body);
  res.sendStatus(200);
});

const server = http.createServer(app);

if (process.env.NODE_ENV === 'development') {
  const reload = require('reload');
  const reloadServer = reload(app);
  require('./webpack-dev-middleware').init(app);
  require('./webpack-server-compiler').init(function(bundle){
    let needsReload = (renderer === undefined);
    renderer = require('vue-server-renderer').createBundleRenderer(bundle);
    if(needsReload){
      reloadServer.reload();
    }
  });
}

server.listen(process.env.PORT, function () {
  console.log(`Example app listening on port ${process.env.PORT}!`);
  if (process.env.NODE_ENV === 'development') {
    require("opn")(`http://localhost:${process.env.PORT}`);
  }
});
