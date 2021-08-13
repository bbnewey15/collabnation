const express = require('express');
const path = require('path');
const next = require('next');
const logger = require('../logs');

const expressValidator = require('express-validator');
const https = require("https");
const fs = require('fs');
const favicon = require('serve-favicon');
const cors = require('cors');
const { parse } = require('url')
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const auth = require('./google');

logger.info(__dirname + '/key.pem');
const options = {
  key: fs.readFileSync('/etc/ssl/private/private.key', 'utf8'),
  cert: fs.readFileSync('/etc/ssl/certificate.crt', 'utf8')
};


dotenv.config();
const app = express();
const server = https.createServer(options, app);

//Handle Database
const database = require('./lib/db');

const PORT = process.env.PORT || 8000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const settings = require('./lib/settings.js');
const notifications = require('./lib/notifications.js');
const webPush = require('./lib/webPush');

const {emailRouter} = require('./lib/email');


global.SERVER_APP_ROOT = __dirname;
global.ROOT_URL = process.env.NODE_ENV == 'production' ? "https://collab-nation.com" : `https://collab-nation.com:${process.env.PORT}`;
nextApp
  .prepare()
  .then(() => {

    app.use(favicon(__dirname + '/../public/static/favicon.ico'));
    app.use(expressValidator());
    app.use(bodyParser.json({limit: '50mb'}));

    // The next two gets allow normal handle of regular static/next assets
    //   that do not need google auth. This needs to be before passport.session
    app.get('/_next*', (req, res) => {
      handle(req, res);
    });

    app.get('/static/*', (req, res) => {
      handle(req, res);
    });
    ////////////////

    app.use(cors({ origin: '*' }));
    //Custom Routes//
    app.use('/email', emailRouter);
    app.use('/settings', settings);
    app.use('/notifications', notifications.router);
    app.use('/webPush', webPush.router);
    ///

    //Session   ////
    //Has to be above custom routes, otherwise req.session is not available to them
    var options = {
      host: process.env.host,
      port: 3306,
      user: process.env.user,
      password: process.env.password,
      database: process.env.database,
      expiration: (14 * 24 * 60 * 60)
    };
    
    var sessionStore = new MySQLStore(options);
    //Could use existing connection like this 
    //var sessionStore = new MySQLStore({}/* session store options */, connection);
    
    app.use(session({
        name: 'collabnation.sid',
        secret: 'HD2w.)q*VqRT4/#NK2M/,E^B)}FED5fWU!dKe[wk',
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          maxAge: 14 * 24 * 60 * 60 * 1000,
        }, 
        key: 'session_cookie_name',
        store: sessionStore,
    }));
    /////////////////
    // Authenticate User
    auth({ ROOT_URL, app ,database})
    
    // Custom Routes with session
      //Place vehicles here, because we need to access session.passport.user 
    //app.use('/scheduling/vehicles', vehicles);
    //app.use('/scheduling/calendar', calendar);
    //

    app.get('*', (req, res) => {
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl;

      if (pathname === '/sw.js' || pathname.startsWith('/workbox-')) {
        console.log("SW or Worker");
        const filePath = path.join(__dirname, '/../public', pathname)
        logger.info(filePath);
        nextApp.serveStatic(req, res, filePath)
      } else {
        handle(req, res, parsedUrl)
      }
      //return handle(req, res);
    });

    server.listen(PORT, err => {
      if (err) throw err;
      logger.info(`> Ready on localhost:${PORT}`);
    });

    })
  .catch(ex => {
    logger.error(ex.stack);
    process.exit(1);
  });

  if(dev) {
    process.once('uncaughtException', function(err) {
      logger.error('FATAL: Uncaught exception.');
      logger.error(err.stack||err);
      setTimeout(function(){
        process.exit(1);
      }, 100);
    });
  }