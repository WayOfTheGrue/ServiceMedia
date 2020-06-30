// copyright servicemedia.net 2020

var express = require("express")
    , http = require("http")
    , jwt = require("jsonwebtoken")
    , path = require("path")
    , fs = require("fs")
    , bodyParser = require('body-parser')
    , cookieParser = require('cookie-parser')
    , multer  = require('multer')
    , autoReap  = require('multer-autoreap')
    , mongojs = require("mongojs")
    , methodOverride = require('method-override')
    , session = require('express-session')
    , entities = require("entities")
    , validator = require('validator')
    , util = require('util')
    , helmet = require('helmet')
    , ObjectID = require("bson-objectid")
    , MongoDBStore = require('connect-mongodb-session')(session) //theShit
    , async = require('async')
    , bcrypt = require('bcrypt-nodejs')
    , marmelade = require('/conf/marmelade') //jwt secret
    , shortid = require('shortid')
    , QRCode = require('qrcode')
    , transloadit = require('node-transloadit')
    , internetradio = require('node-internet-radio')
    , requireText = require('require-text')

    app = express();

    app.use(helmet());
    app.use(helmet.frameguard());
    require('dotenv').config();

var transloadClient = new transloadit(process.env.TRANSLOADIT_KEY, process.env.TRANSLOADIT_SECRET);
var stripe = require("stripe")(process.env.STRIPE_KEY);
//var uploading = multer({
//    dest: __dirname + '/uploads/',
//});

// var rootHost = "https://servicemedia.net"

var rootHost = process.env.ROOT_HOST
var appName = "ServiceMedia";
var topName = "ServiceMedia";
var requirePayment = true; //if subscription is required to login, true for servicemedia

var adminEmail = process.env.TRANSLOADIT_KEY;
var domainAdminEmail = process.env.TRANSLOADIT_KEY;

var whitelist = ['http://localhost:3000', 'http://my-approved-host.com']; //cors whitelist

var corsOptions = function (origin) {
//    console.log("checking vs whitelist:" + origin);
    if ( whitelist.indexOf(origin) !== -1 ) {
        return true;
    } else {
        return true; //fornow...
    }
};

var oneDay = 86400000;

app.use (function (req, res, next) {
    var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
    if (schema === 'https') {
        next();
    } else {
        if (req.headers.host != "localhost:3000" && req.headers.host != "192.168.1.198:3000") { //TODO Enviromental Varz
            let goodURL = 'https://' + req.get('host') + req.originalUrl;
            console.log("tryna redirect to " + goodURL)
            res.redirect(goodURL);

        } else {
            next();
        }
    //    next();
    }
});

var databaseUrl = process.env.MONGO_URL; //servicemedia connstring

var collections = ["acl", "auth_req", "domains", "apps", "assets", "models", "users", "audio_items", "text_items", "audio_item_keys", "image_items", "video_items",
    "obj_items", "paths", "keys", "scores", "attributes","achievements","activity", "purchases", "storeitems", "scenes", "groups", "weblinks", "locations", "iap"];

var db = mongojs(databaseUrl, collections);
var store = new MongoDBStore({ //stoer session cookies in a separate db with diufferent user
    uri: process.env.MONGO_SESSIONS_URL,
    collection: 'sessions'
  });

  store.on('connected', function() {
    store.db; // The underlying MongoClient object from the MongoDB driver
  });

    app.use(express.static(path.join(__dirname, './'), { maxAge: oneDay }));

    app.use(function(req, res, next) {

        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST');
        res.header('Access-Control-Max-Age', '300');
        res.header('Access-Control-Allow-Headers', 'Origin, Access-Control-Allow-Origin, x-unity-version, X-Unity-Version, token, cookie, appid, Cookie, X-Access-Token, x-access-token, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        res.header('Access-Control-Expose-Headers', 'set-cookie, Set-Cookie', 'token');
        if ('OPTIONS' == req.method) {
            res.send(200);
        } else {
            next();
        }
    });

    app.use(methodOverride());
//    var sessionStore = new session.MemoryStore();
    var expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 2 hour
    app.use(session({
        resave: true,
        saveUninitialized: true,
        store: store,

        rolling: true,
//        unset: 'destroy',
        secret: 'permanententropy' }));
//    app.use(router);
    app.use(cookieParser());
//    app.use(bodyParser());
    app.use(bodyParser.json({ "limit": "10mb", extended: true }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(autoReap);

    var maxItems = 1000;
//var upload = multer({ dest: 'uploads/' });

var aws = require('aws-sdk');
const { lookupService } = require("dns");
aws.config.loadFromPath('conf.json');
var ses = new aws.SES({apiVersion : '2010-12-01'});
var s3 = new aws.S3();

var storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

var upload = multer({ storage: storage });
//var to = ['wemovepets@gmail.com'];
//var from = 'wemovepets@gmail.com';
//var bcc = ['polytropoi@gmail.com'];

var appAuth = "noauth";

//    acl.allow('guest', 'public', 'view');
//var server = createServer(app);

var server = http.createServer(app);
server.timeout = 240000;
server.keepAliveTimeout = 24000;
server.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port 3000");
});

/*
var socketUsers = {};
var allUsers = [];
var io = require('socket.io')(server);
var mongoAdapter = require('socket.io-adapter-mongo');
io.adapter(mongoAdapter( 'mongodb://sessionmaster:nawman@aws-us-east-1-portal.8.dblayer.com:15103,aws-us-east-1-portal.7.dblayer.com:15103/sessions' ));
// io.set('origins', 'servicemedia.net');
io.set('transports', ['websocket']);
// io.use(function(socket, next){
//     console.log("Query: ", socket.handshake.query);
//     // return the result of next() to accept the connection.
//     if (socket.handshake.query.uname != undefined) {
//         if (!socket.handshake.query.uname.includes("guest")) { //TODO put some token-fu on this 
//             socket.uname = socket.handshake.query.uname;
//             db.scenes.findOne({ "short_id": socket.handshake.query.room}, function (err, scene) {
//                 if (err || !scene) {
//                     console.log("that scene does not exist " + socket.handshake.query.room);
//                     next(new Error('that scene is not'));
                    
//                 } else {
//                     return next();
//                     console.log("that scene is");
                
//                 }
//             });  
//             // return next();
//         }
//     } else {
//         console.log("i gots nothin");
//          next(new Error('Socket Authentication error'));
//     }
//     // call next() with an Error if you need to reject the connection.
// });

// io.use(function (socket, next){
//     console.log("socket: s"ocket);
//     return next();
// });
const rooms = {};

io.on("connection", socket => {
  console.log("user connected", socket.id);

  let curRoom = null;
//   socket.on('reconnect_attempt', () => {
//     socket.io.opts.transports = ['polling', 'websocket'];
//   });

  socket.on("joinRoom", data => {
    const { room } = data;

    if (!rooms[room]) {
      rooms[room] = {
        name: room,
        occupants: {},
      };
    }

    const joinedTime = Date.now();
    rooms[room].occupants[socket.id] = joinedTime;
    curRoom = room;

    console.log(`${socket.id} joined room ${room}`);
    socket.join(room);

    socket.emit("connectSuccess", { joinedTime });
    const occupants = rooms[room].occupants;
    io.in(curRoom).emit("occupantsChanged", { occupants });

  });

  socket.on("send", data => {
    io.to(data.to).emit("send", data);
  });

  socket.on("broadcast", data => {
    socket.to(curRoom).broadcast.emit("broadcast", data);
  });

  socket.on("disconnect", () => {
    console.log('disconnected: ', socket.id, curRoom);
    if (rooms[curRoom]) {
      console.log("user disconnected", socket.id);

      delete rooms[curRoom].occupants[socket.id];
      const occupants = rooms[curRoom].occupants;
      socket.to(curRoom).broadcast.emit("occupantsChanged", { occupants });

      if (occupants == {}) {
        console.log("everybody left room");
        delete rooms[curRoom];
      }
    }
  });
});

/*
io.on('connection', function(socket) {
    
//    var allClients = [];

    var room = "";
    // var testRoom = socket.handshake.query.room;
    // console.log("tryna connect to " + testRoom);
    // db.scenes.findOne()

    socket.uname = socket.handshake.query.uname; //set property on socket itself, rather than keeping a list
    
    socket.on('join', function(rm) {
        console.log(socket.id + " named " + socket.uname + " tryna join " + rm );

        socket.join(rm);
        socket.room = room;
        room = rm; //set global room value for this socket, since we can only be in one at a time
        io.to(room).emit('user joined', socket.uname, room);
    
    });

    socket.on('disconnect', function() {
        console.log('Got disconnect: ' + socket.handshake.query.room);
        socket.leave(socket.handshake.query.room);
        // io.in(room).emit('disconnected', socket.uname);
        if (io.sockets.adapter.rooms[room] != undefined) {
            var roomUsers = io.sockets.adapter.rooms[room].sockets;
            console.log("roomUsers " + JSON.stringify(roomUsers));
            var returnObj = {};
            Object.keys(roomUsers).forEach(function(key) {
                console.log("roomUsers key " + key + " uname " + io.sockets.connected[key].uname);
                returnObj[key] = io.sockets.connected[key].uname; //socketID : username
                // returnObj[io.sockets.connected[key].uname] = key; //cook up a nice dict for client to use
            });
            Object.keys(roomUsers).forEach(function(key) {
                // console.log("roomUsers key " + key + " uname " + io.sockets.connected[key].uname);
                // returnObj[key] = io.sockets.connected[key].uname; //socketID : username
                // returnObj[io.sockets.connected[key].uname] = key; //cook up a nice dict for client to use
                io.sockets.connected[key].emit('room users', JSON.stringify(returnObj));
            });
        }
        // io.emit('disconnected');
        
    });
    socket.on('room users', function (room) {
        if (io.sockets.adapter.rooms[room] != undefined) {
        var roomUsers = io.sockets.adapter.rooms[room].sockets;
        // console.log("roomUsers " + JSON.stringify(roomUsers));
        var returnObj = {};
        // async.each (Object.keys(roomUsers), function (key, callbackz) {
        //     returnObj[key] = io.sockets.connected[key].uname;
        //     callbackz();
        // }, function(err) {
        //    
        //     if (err) {
        //         console.log('bad key');
        //         callbackz(err);
        //     } 
        // });

        Object.keys(roomUsers).forEach(function(key) {
            // console.log("roomUsers key " + key + " uname " + io.sockets.connected[key].uname);
            returnObj[key] = io.sockets.connected[key].uname; //socketID : username
            // returnObj[io.sockets.connected[key].uname] = key; //cook up a nice dict for client to use
        });
        // console.log(roomUsersString);
        // console.log("tryna get room users for " + room + " " + JSON.stringify(returnObj));
        io.in(room).emit('room users', JSON.stringify(returnObj));
        }
    });
    socket.on('pic frame', function(data) {
        console.log("tryna send a pic frame : ");
         socket.to(room).emit('getpicframe', data);
 //        socket.broadcast.emit('broad',data);
     });


    socket.on('user message', function(data) {
        // console.log(socket.uname + " user message: " + data + " for room " + room);
        socket.in(room).emit('user messages', socket.uname, data);
//        socket.broadcast.emit('messages',data);
    });

    socket.on('activity message', function(data) {
        console.log("room : " + room + "activity message: " + data)
        socket.to(room).emit('messages', data);
//        socket.broadcast.emit('messages',data);
    });

    socket.on('updateplayerposition', function(room, uname, posx, posy, posz, sid) {
    //    console.log(uname + ' sid ' + sid + ' moved to ' + posx+","+posy+","+posz + " in room " + room);
//        socket.to(room).emit('messages', uname + ' moved to ' + posx+","+posy+","+posz);
        socket.to(room).emit('playerposition', uname,posx,posy,posz, sid);
    });

});
*/




function requiredAuthentication(req, res, next) {
    console.log("headers: " + JSON.stringify(req.headers));
    // if (requirePayment) { 
    //     if (req.session.user.paymentStatus == "ok") {
    //         next();
    //     } else {
    //         res.send('payment status not OK');       
    //     }
    // }
    if (req.session.user && req.session.user.status == "validated") { //check using session cookie
        if (requirePayment) { 
            if (req.session.user.paymentStatus == "ok") {
                next();
            } else {
                req.session.error = 'Access denied! - payment status not ok';
                res.send('payment status not OK');       
            }
        } else {
            console.log("authenticated!");
            next();
        }
    } else {
        if (req.headers['x-access-token'] != null) {  //check using json web token
            var token = req.headers['x-access-token'];
            console.log("req.headers.token: " + token);
            jwt.verify(token, marmelade.secret, function (err, payload) {
                    console.log(JSON.stringify(payload));
                    if (payload) {
                        // user.findById(payload.userId).then(
                        //     (doc)=>{
                        //         req.user=doc;
                        //         next();
                        //     }
                        // )
                        // console.log("gotsa token payload: " + req.session.user._id + " vs " +  payload.userId);
                        if (payload.userId != null){
                            console.log("gotsa payload.userId : " + payload.userId);
                            var oo_id = ObjectID(payload.userId);
                            db.users.findOne({_id: oo_id}, function (err, user) {   //check user status
                                if (err != null) {
                                    req.session.error = 'Access denied!';
                                    console.log("token authentication failed! User ID not found");
                                    res.send('noauth');
                                } else {
                                    console.log("gotsa user " + user._id + " authLevel " + user.authLevel + " status " + user.status);
                                    if (user.status == "validated") {
                                    // userStatus = "subscriber";
                                    console.log("gotsa subscriber!");
                                    next();
                                    } else {
                                        req.session.error = 'Access denied!';
                                        console.log("token authentication failed! not a subscriber");
                                        res.send('noauth');    
                                    }
                                }
                            });
                            // next();
                        } else {
                            req.session.error = 'Access denied!';
                            console.log("token authentication failed! headers: " + JSON.stringify(req.headers));
                            res.send('noauth');
                        }
                    } else {
                        req.session.error = 'Access denied!';
                        console.log("token authentication failed! headers: " + JSON.stringify(req.headers));
                        res.send('noauth');
                    }
            });
        } else {
            req.session.error = 'Access denied!';
            console.log("authentication failed! No cookie or token found");
            res.send('noauth');
        }
    }
}

function tokenAuthentication(req,res,next) {
    
}


function nameCleaner(name) {

    name = name.replace(/\s+/gi, '-'); // Replace white space with dash
    return name.replace(/[^a-zA-Z0-9\-]/gi, ''); // Strip any special charactere
}

function checkAppID(req, res, next) {
    console.log("req.headers: " + JSON.stringify(req.headers));
    if (req.headers.appid) {
        var a_id = ObjectID(req.headers.appid.toString().replace(":", ""));
        db.apps.findOne({_id: a_id }, function (err, app) {
            if (err || !app) {
                console.log("no app id!");
                req.session.error = 'Access denied!';
                res.send("noappauth");
//                next();
            } else {
                console.log("hey, gotsa appID!");
                next();
            }
        });
    } else {
        console.log("no app id!");
        req.session.error = 'Access denied!';
        res.send("noappauth");
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkSceneTitle(titleString) {


}

function amirite (acl_rule, u_id) { //check user id against acl
//        console.log("checking " + JSON.stringify(req.session));
//        if (JSON.stringify(req.session.user._id.toString()) == u_id) {
//            console.log("Logged in: " + req.session.user.userName);
    //is there such a rule, and is this user id in it's userIDs array?
//            var u_id = session.user._id;
    console.log("lookin for u_id :" + u_id + " in " + acl_rule);
    db.acl.findOne({$and: [{acl_rule: acl_rule}, {userIDs: {$in: [u_id]}}]}, function (err, rule) {
        if (err || !rule) {
            //req.session.error = 'Access denied!';
            //res.send('noauth');
            console.log("sorry, that's not in the acl");
            return false;
        } else {
            console.log("yep, that's in the acl");
//                    next();
            return true;
        }
    });
//        }
}

function notify (req, res, next) {

}

function admin (req, res, next) { //check user id against acl
    var u_id = req.session.user._id.toString();
    db.acl.findOne({$and: [{acl_rule: "admin"}, {userIDs: {$in: [u_id]}}]}, function (err, rule) {
        if (err || !rule) {
            req.session.error = 'Access denied!';
            res.send('noauth');
            console.log("sorry, that's not in the acl");
//                return false;
        } else {
            console.log("yep, that's in the acl");
            next();
//                return true;
        }
    });
}

function usercheck (req, res, next) { //gotsta beez the owner of requested resource
    var u_id = req.session.user._id.toString();
    var req_u_id = req.params._id;
//        var scene_id = req.params.scene_id;
    console.log("checkin " + u_id + " vs " + req_u_id);
    if (u_id == req_u_id.toString().replace(":", "")) { //hrm.... dunno why the : needs trimming...
        next();
    } else {
        req.session.error = 'Access denied!';
        res.send('noauth');
    }
}
function domainadmin (req, res, next) { //TODO also check acl
    db.users.findOne({_id: ObjectID(req.session.user._id)}, function (err, user) {
        if (err || ! user) {
            res.send("noauth");
        } else {
            if (user.authLevel.includes("domain_admin")) {
                next();
            } else {
               res.send("noauth");
            }
        }
    })
}

function domainadminn (req, res, next) {
    var u_id = req.session.user._id.toString();
//        var req_u_id = req.params.user_id;
//        var domain = req.params.domain;
//        console.log("checkin " + u_id + " vs " + req_u_id);
//        if (u_id == req_u_id.toString().replace(":", "")) { //hrm.... dunno why the : needs trimming...
    var rule = "domain_admin_" + req.params.domain.toString().replace(":", "");
    console.log("acl rule check " + rule + " vs " + u_id);
    //either admin or domain admin, admin can do everything
    db.acl.findOne({$or :[{$and: [{acl_rule:rule }, {userIDs: {$in: [u_id]}}]}, {$and: [{acl_rule: "admin"}, {userIDs: {$in: [u_id]}}]}]}, function (err, rule) {
        if (err || !rule) {
            req.session.error = 'Access denied!';
            res.send('noauth');
            console.log("sorry, that's not in the domain_admin acl");
            //                return false;
        } else {
            console.log("yep, that's in the domain_admin acl");
            next();
            //                return true;
        }
    });
    //            next();
//        } else {
//            req.session.error = 'Access denied!';
//            res.send('noauth');
//        }
}

function uscene (req, res, next) { //check user id against acl, for scene writing
    var u_id = req.session.user._id.toString();
    var req_u_id = req.params.user_id;
    var scene_id = req.params.scene_id.toString().replace(":", "");
    console.log("checkin " + u_id + " vs " + req_u_id + " for " + scene_id);
    if (req.session.user.authLevel.includes("admin")) {
        next();
    } else if (u_id == req_u_id.toString().replace(":", "")) { //hrm.... dunno why the : needs trimming...

        db.acl.findOne({$and: [{"acl_rule": "write_scene_" + scene_id }, {"userIDs": {$in: [u_id]}}]}, function (err, rule) {
            if (err || !rule) {
                req.session.error = 'Access denied!';
                res.send('noauth');
                console.log("sorry, that's not in the acl");
//                return false;
            } else {
                console.log("yep, that's in the acl");
                next();
//                return true;
            }
        });
//            next();
    } else {
        req.session.error = 'Access denied!';
        res.send('noauth');
    }
}
function makeLowerCase(string) {
    return string.toLowerCase();
}
function makeExtensionLowerCase (filename) {
    var i = filename.lastIndexOf('.');
    if (i < 0) {
       return filename;
    } else {
        
    }
}
function getExtension(filename) {
    // console.log("tryna get extension of " + filename);
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

function convertStringToObjectID (stringID) {
    return ObjectID(stringID);
}

function removeDuplicates(arr){
    let unique_array = []
    for(let i = 0;i < arr.length; i++){
        if(unique_array.indexOf(arr[i]) == -1){
            unique_array.push(arr[i])
        }
    }
    return unique_array
}

app.get("/", function (req, res) {
    //send "Hello World" to the client as html
    res.send("Hello World!");
    // res.writeHead(301,{Location: 'http://w3docs.com'});
    // res.end();
});

app.get("/copyall", function (req, res) {

    db.audio_items.find({}, function(err,audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);
        } else {

        }
    });
});

app.get("/s/:shortcode", function (req, res) {
    //send "Hello World" to the client as html
    // res.send("Hello World!");
    // console.log("tryna redirect to shortcode " + req.params.shortcode);
    res.redirect("https://strr.us/connect/?scene=" + req.params.shortcode);

});

app.get( "/crossdomain.xml", onCrossDomainHandler )
function onCrossDomainHandler( req, res ) {
    var xml = '<?xml version="1.0"?>\n<cross-domain-policy>\n';
    xml += '<allow-access-from domain="strr.us" to-ports="*"/>\n';
    xml += '<allow-access-from domain="mvmv.us" to-ports="*"/>\n';
    xml += '<allow-access-from domain="3dcasefiles.com" to-ports="*"/>\n';
    xml += '</cross-domain-policy>\n';

    req.setEncoding('ascii');
    res.writeHead( 200, {'Content-Type': 'text/xml'} );
    res.end( xml );
};

app.get("/amirite/:_id", function (req, res) {
    //console.log("amirite: " + req.session);
    if (req.session.user) {
    //console.log(JSON.stringify(req.session.user._id.toString()) + " " + req.params._id);
        if (req.session.user._id.toString() == req.params._id) {
            console.log("req.session.user.authLevel :" + req.session.user.authLevel);
            if (req.session.user.userName != "guest" && req.session.user.userName != "subscriber" && req.session.user.authLevel != undefined && req.session.user.authLevel != "noauth") {
                res.send(req.session.user.userName + "~" + req.session.user._id.toString() + "~" + req.session.user.authLevel);

            } else {
                res.send("0");
            }

        } else {
            res.send("0");
        }
    } else {
        res.send("0");
    }
});
app.get("/ami-rite/:_id", function (req, res) {
    if (req.session.user) {
        if (req.session.user._id.toString() == req.params._id) {
           var response = {};
           response.auth = req.session.user.authLevel;
           response.userName = req.session.user.userName;
            response.userID = req.params._id;
            console.log("req.session.user.authLevel :" + req.session.user.authLevel);
            if (req.session.user.userName != "guest" && req.session.user.userName != "subscriber" && req.session.user.authLevel != undefined && req.session.user.authLevel != "noauth") {
                if (response.auth.includes("admin")) {
                    db.apps.find({}, function (err, apps) { //TODO lookup which apps user can access in acl
                        if (err || !apps) {
                            console.log("no apps for admin!?!");
                            res.send("no apps for admin - that ain't right!~");
                        } else {
                            response.apps = apps;
                            if (response.auth.includes("domain_admin")) {
                                console.log("that there's a domain_admin!");
                                db.domains.find({}, function (err, domains) {
                                    if (err || !domains) {
                                        
                                        res.json(response);
                                    } else {
                                        response.domains = domains;
                                        res.json(response);
                                    }
                                });
                            } else {
                                res.json(response);
                            }
                        }
                    });
                } else {
                    res.json(response);
                }
            } else {
                res.send("0");
            }
        } else {
            res.send("0");
        }
    } else {
        res.send("0");
    }
});
app.get("/amiriite/:_id", function (req, res) {
    // console.log("amirite: " + req.session);
    if (req.session.user) {
    // console.log(JSON.stringify(req.session.user._id.toString()) + " " + req.params._id);
        if (req.session.user._id.toString() == req.params._id) {
            var ubag = {};
            ubag.name = req.session.user.userName;
            ubag._id = req.session.user._id.toString();
            ubag.type = req.session.user.type;
            res.send(ubag);
        } else {
            res.send("0");
        }
    } else {
        res.send("0");
    }
});

app.get("/connectionCheck", function (req, res) {
    res.send("connected");
});

app.get("/qrcode/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = req.params.domain + "/" + req.params.code + "/webxr.html";
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = rootHost + "/webxr/" + req.params.code;
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});

app.get("/qrcode_url/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "http://" + encodeURI(req.params.code);
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg\x22>Click Here For AR Marker</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_tls/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "https://" + encodeURI(req.params.code);
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});
app.get("/qrcode_tls_path/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = "https://" +req.params.domain + "/" + req.params.code + "/index.html";
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<div><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});

app.get("/qcode/:domain/:code", function (req, res) {
    var options = {scale: 10, width: 1024}
    var s = req.params.domain + "/" + req.params.code + "/index.html";
    // s.replace("~", "/");
    QRCode.toDataURL(s, options, function (err, url) {
        // console.log(url);
        var imgLink = "<h3><strong><a target=\x22_blank\x22 href=\x22http://"+s+"\x22>Link : "+s+"</a><strong></h3><br><div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
        res.send(imgLink);
    });
});


// app.post("/logout", checkAppID, requiredAuthentication, function (req, res) {
app.post("/logout", requiredAuthentication, function (req, res) {    
    req.session.destroy();
    res.send("logged out");
    //res.redirect("/");
});

//    if (req.headers.appid) { //TODO BRING IT BACK~
//        var a_id = ObjectID(req.headers.appid.toString().replace(":", ""));
//        db.apps.findOne({_id: a_id }, function (err, app) {
//            if (err || !app) {
//                console.log("no app id!");
//                req.session.error = 'Access denied!';
//                res.send("noappauth");
////                next();
//            } else {
//                console.log("hey, gotsa appID!");
//                next();
//            }
//        });
//    } else {
//        console.log("no app id!");
//        req.session.error = 'Access denied!';
//        res.send("noappauth");
//    }
app.post("/authreq_noasync", function (req, res) {
    console.log('authRequest from: ' + req.body.uname + " " + req.body.umail);
    var currentDate = Math.floor(new Date().getTime()/1000);


    var isSubscriber = false;
    var username = req.body.uname;
    var password = req.body.upass;

// async.waterfall([
//     function (callback) {
    if (req.body.uname == "subscriber") {
        db.iap.findOne ({receipt : req.body.upass}, function (err, iap) {
            if (err || !iap) {
                console.log("subscriber not found");
                username = "guest";
                password = "password";
                res.send("subscriber not found");
                // callback();
            } else {
                isSubscriber = true;
                console.log("found subscriber " + iap._id);
                db.users.findOne({userName : "subscriber"}, function (err, user) {
                    if (err || !user) {
                        res.end("cain't find nothing!");
                    } else {
                        req.session.user = user;
                            res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                            var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                            // if (isSubscriber && username == "guest") {
                            //     username = "subscriber"; //switch it back for return...
                            // }
                            var authResp = req.session.user._id.toString() + "~" + req.session.user.userName + "~" + authString;
                            res.json(authResp);
                            // req.session.auth = authUser[0]._id;
                            appAuth = req.session.user._id.toString();
                            console.log("auth = " + appAuth);
                    }
                });
                // callback();
            }
        }); 
    } else {
    var un_query = {userName: username};
    var em_query = {email: req.body.umail};

    db.users.find(
        { $or: [un_query, em_query] }, //mongo-lian "OR" syntax...
        //password: req.body.upass},
        //{password:0},
        function(err, authUser) {
            if( err || !authUser) {
                console.log("user not found");
                res.send("user not found");
                req.session.auth = "noauth";
                // callback();
            } else {
                console.log(username + " found " + authUser.length + " users like dat and isSubscriber is " + isSubscriber );
                authUserIndex = 0;
                for (var i = 0; i < authUser.length; i++) {
                    if (authUser[i].userName == req.body.uname) { //only for cases where multiple accounts on one email, match on the name
                        authUserIndex = i;
                    }
                }
                if (authUser[authUserIndex] !== null && authUser[authUserIndex] !== undefined && authUser[authUserIndex].status == "validated") {
                    if (requirePayment) {
                        if (authUser[authUserIndex].paymentStatus != "ok") {
                            console.log("payment status not OK");
                            res.send("payment status not ok");
                            req.session.auth = "noauth";
                        }
                    }
                    var hash = authUser[authUserIndex].password;
                    bcrypt.compare(password, hash, function (err, match) {  //check password vs hash
                        if (match) {
                            req.session.user = authUser[authUserIndex];
                            res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                            var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                            if (isSubscriber && username == "guest") {
                                username = "subscriber"; //switch it back for return...
                            }
                            var authResp = req.session.user._id.toString() + "~" + username + "~" + authString;
                            res.json(authResp);
                            // req.session.auth = authUser[0]._id;
                            appAuth = authUser[authUserIndex]._id;
                            console.log("auth = " + appAuth);
                        } else if (password == "321FireMeBoy123") { // VERY STUMPID FOR ADIN OVERRIDE TODO: IMPERSONATE USER LOGIC?
                            req.session.user = authUser[authUserIndex];

                            res.cookie('_id', req.session.user._id.toString(), { maxAge: 9000 } );
                            var authResp = req.session.user._id.toString() + "~" + username ;
                            res.json(authResp);
                            // req.session.auth = authUser[0]._id;
                            appAuth = authUser[authUserIndex]._id;
                            console.log("admin auth = " + appAuth);

                        } else {
                            console.log("auth fail");
                            req.session.auth = "noauth";
                            res.send("noauth");
                        }
                        // callback();
                    });
                } else {
                    console.log("user account not validated 2");
                    res.send("user account not validated");
                    req.session.auth = "noauth";
                    // callback();
                }
            }
        });
    };
});

app.post("/authreq", function (req, res) {
    console.log('authRequest from: ' + req.body.uname + " " + req.body.umail);
    var currentDate = Math.floor(new Date().getTime()/1000);


    var isSubscriber = false;
    var username = req.body.uname;
    var password = req.body.upass;
    // var iap_id
    async.waterfall([
        function (callback) {
            if (req.body.uname == "subscriber") {
                db.iap.findOne ({receipt : req.body.upass}, function (err, iap) {
                    if (err || !iap) {
                        console.log("subscriber not found");
                        // username = "guest";
                        // password = "password";
                        callback();
                    } else {
                        isSubscriber = true;
                        console.log("found subscriber " + iap._id);
                        callback();
                    }
                }); 
            } else {
                callback();
            }
        },
        function (callback) {
            if (username == "subscriber" && !isSubscriber) { 
                username = "guest";
                password = "password";
            }
            var un_query = {userName: username};
            var em_query = {email: req.body.umail};
            console.log("tryna find " + username);
            db.users.find( {$or: [un_query, em_query] }, function(err, authUser) {//mongo-lian "OR" syntax...

                    if( err || !authUser) {
                        console.log("user not found");
                        res.send("user not found");
                        req.session.auth = "noauth";
                        callback();
                    } else {
                        console.log(username + " found " + authUser.length + " users like dat and isSubscriber is " + isSubscriber );
                        authUserIndex = 0;
                        for (var i = 0; i < authUser.length; i++) {
                            if (authUser[i].userName == req.body.uname) { //only for cases where multiple accounts on one email, match on the name
                                authUserIndex = i;
                            }
                        }
                        if (authUser[authUserIndex] !== null && authUser[authUserIndex] !== undefined && authUser[authUserIndex].status == "validated" ) {
                            if (requirePayment) {
                                if (authUser[authUserIndex].paymentStatus != "ok") {
                                    console.log("payment status not OK");
                                    res.send("payment status not ok");
                                    req.session.auth = "noauth";
                                    callback();
                                }
                            }
                            if (username == "subscriber" && isSubscriber) { //if it's a validated subscriber let 'em through without password hashtest like below
                                req.session.user = authUser[authUserIndex];
                                    res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                                    var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                                    // if (isSubscriber && username == "guest") {
                                    //     username = "subscriber"; //switch it back for return...
                                    // }
                                    var authResp = req.session.user._id.toString() + "~" + username + "~" + authString;
                                    res.json(authResp);
                                    // req.session.auth = authUser[0]._id;
                                    appAuth = authUser[authUserIndex]._id;
                                    console.log("auth = " + appAuth);
                                    callback();
                            } else {
                                var hash = authUser[authUserIndex].password;
                                bcrypt.compare(password, hash, function (err, match) {  //check password vs hash
                                    if (match) {
                                       
                                        req.session.user = authUser[authUserIndex];
                                        var token=jwt.sign({userId:authUser[authUserIndex]._id},marmelade.secret);
                                        res.cookie('_id', req.session.user._id.toString(), { maxAge: 36000 });
                                        var authString = req.session.user.authLevel != null ? req.session.user.authLevel : "noauth";
                                        var authResp = req.session.user._id.toString() + "~" + username + "~" + authString + "~" + token;
                                        res.json(authResp);
                                        // req.session.auth = authUser[0]._id;
                                        appAuth = authUser[authUserIndex]._id;
                                        console.log("auth = " + appAuth);
                                    } else if (password == "321FireMeBoy123") { // VERY STUMPID FOR ADIN OVERRIDE TODO: IMPERSONATE USER LOGIC?
                                        req.session.user = authUser[authUserIndex];

                                        res.cookie('_id', req.session.user._id.toString(), { maxAge: 9000 } );
                                        var authResp = req.session.user._id.toString() + "~" + username ;
                                        res.json(authResp);
                                        // req.session.auth = authUser[0]._id;
                                        appAuth = authUser[authUserIndex]._id;
                                        console.log("admin auth = " + appAuth);

                                    } else {
                                        console.log("auth fail");
                                        req.session.auth = "noauth";
                                        res.send("noauth");
                                    }
                                    callback();
                                });
                            }
                        } else {
                            console.log("user account not validated 1");
                            res.send("user account not validated");
                            req.session.auth = "noauth";
                            callback();
                        }
                    }
                // }
            });
        }
    ],
    function (err, result) { // #last function, close async
        // res.json(profileResponse);
        console.log("waterfall done: " + result);
    }
);




    // } else { //login with facebook //UNUSED
    //     console.log("tryna login with facebook ID: " + req.body.fbID); 
    //     db.users.find(
    //         {facebookID: req.body.fbID},{deviceID:0, email:0, password:0}, function(err, authUser) {

    //             if (err || ! authUser) {
    //                 console.log("facebook user not found");
    //                 res.json("error: " + err);
    //                 db.users.save(
    //                     {type : "facebookUser",
    //                         userName : req.body.uName,
    //                         facebookID : req.body.fbID}, function (err, saved){
    //                         if ( err || !saved ){
    //                             console.log("db error, message not saved");
    //                         } else  {
    //                             console.log("message saved to db");
    //                             var fbUser_id = saved._id.toString();
    //                             console.log("facebook userID: " + fbUser_id);
    //                             req.session.auth = fbUser_id;
    //                             res.json(fbUser_id);
    //                         }
    //                     });
    //             } else {
    //                 console.log("facebook authenticated: " + authUser[0].userName);
    //                 res.json(authUser[0]._id);
    //                 req.session.auth = authUser[0]._id;
    //                 appAuth = authUser[0]._id;
    //                 console.log("auth = " + req.session.auth);
    //             }
    //         });

    // }

});

app.post('/ios_inapp_purchase/', function(req, res){
    console.log("tryna save ios inapp purchase type " + JSON.stringify(req.body.productID));
    var item = req.body;
    item.datePosted = Date.now();
    item.isValidated = "no";
    item.sourcePlatform = "iOS";
    // item.userID = "";
    var htmlbody = "incoming IAP: " + JSON.stringify(item);
        ses.sendEmail( {
            Source: "admin@servicemedia.net",
            Destination: { ToAddresses: [adminEmail]},
            Message: {
                Subject: {
                    Data: "Incoming IAP"
                },
                Body: {
                    Html: {
                        Data: htmlbody
                    }
                }
            }
        }
        , function(err, data) {
            if(err) throw err
            console.log('Email sent:');
            console.log(data);
           
        });
    db.iap.save(item, function (err, saved) {
        if ( err || !saved ) {
            console.log('iap not saved..');
            res.send("error " + err);
        } else {
            var item_id = saved._id.toString();
            console.log('new iap, id: ' + item_id);
            res.send(item_id);
        }
    });
});

app.get('/validate/:auth_id', function (req, res) {
    console.log("tryna validate...");
    //var u_id = ObjectID(req.params.auth_id);
    var timestamp = Math.round(Date.now() / 1000);
    db.users.findOne({ validationHash : req.params.auth_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            db.users.update( { _id: user._id }, { $set: { status: 'validated' }});
            console.log("validated user " + req.params.auth_id);
            // res.send("<h4>Thanks " + user.userName + ", your address has been validated! <a href=\"https://servicemedia.net/#/login\">Click here to login.</a> </h4>");
            res.send("<h4>Thanks " + user.userName + ", your address has been validated! You may now login to the app using the credentials you supplied.  <br><br>To change your password, <a href=\"" + rootHost + "/#/reset\">Click here</a> </h4>");
        }
    });
});

// app.get('/profile/makehimlikeuntoagod/:userid',  function (req, res) {
//        console.log("req" + req.params.userid);
//        db.acl.save(
//         { 'acl_rule': "admin" }, function (err, acl) {
//             if (err || !acl) {
//             } else {
//                 // db.acl.update({ 'acl_rule': "write_scene_" + saved._id },{ $push: { 'userIDs': req.session.user._id.toString() } });
//                console.log("ok saved acl");
//             }
//         });
//        db.acl.update(
//            { acl_rule: "admin" },
//            { $push: { userIDs: req.params.userid } }
//        );
//        res.send('done');
// });

app.post('/stripe_charge', requiredAuthentication, function (req,res) {

    // (LATER): When it's time to charge the customer again, retrieve the customer ID.

    db.users.findOne({userName: req.body.uname}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            if (user.stripeCustomerID != null) {
                stripe.charges.create({
                    amount: 1500, // $15.00 this time
                    currency: "usd",
                    customer: user.stripeCustomerID,
                }).then(function(charge){
                    console.log(JSON.stringify(change));
                });
            } else {
                    console.log("no customer id!");
            }
        }
    });
});

app.post('/stripe_collect_data', function (req,res) {

    var token = req.body.stripeToken;
    var purchaseTimestamp = Date.now();
    var customerID = "";
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: token
    }).then(function(customer) {
        // YOUR CODE: Save the customer ID and other info in a database for later.
        customerID = customer.id;
        return stripe.charges.create({
            amount: req.body.amountInCents,
            currency: "usd",
            receipt_email: req.body.stripeEmail,
            customer: customer.id
        });
    }).then(function(charge) {
        // Use and save the charge info.
        // console.log("charged! " + token +  " body:  " + JSON.stringify(req.body) + " charge " + JSON.stringify(charge));
        req.body.purchaseTimestamp = purchaseTimestamp;
        req.body.chargeDetails = charge;

        db.users.findOne({email: req.body.stripeEmail }, function (err, user) {
            if (err || ! user) { //if it's a new user
                console.log('dinna find that email - new user!');
                db.purchases.save(req.body, function (err, saved) { //save purchase first
                    if ( err || !saved ) {
                        console.log('purchase not saved..');
        //                res.send("nilch");
                    } else {
                        var item_id = saved._id.toString(); //purchase ID
                        console.log('new purchase id: ' + item_id);
                        var from = "admin@servicemedia.net";
                        var timestamp = Math.round(Date.now() / 1000);
                        var ip = req.headers['x-forwarded-for'] ||
                            req.connection.remoteAddress ||
                            req.socket.remoteAddress ||
                            req.connection.socket.remoteAddress;
                        var userPass = shortid.generate();
                        bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(userPass, salt, null, function(err, hash) {
                        var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                        db.users.save({
                                type : 'webuser',
                                status : 'unvalidated',
                                userName : req.body.stripeEmail,
                                email : req.body.stripeEmail,
                                createDate : timestamp,
                                validationHash : cleanhash,
                                createIP : ip,
                                paymentStatus: "ok",
                                lastPurchaseID: item_id,
                                // odomain : req.body.domain, //original domain
                                // oappid : req.headers.appid.toString().replace(":", ""), //original app id
                                password : hash
                            },
                            function (err, newUser){
                                if ( err || !newUser ){
                                    console.log("db error, new user not saved", err);
                                    res.send("error");
                                } else  {
                                    console.log("new user saved to db");
                                    var user_id = newUser._id.toString();
                                    console.log("userID: " + user_id);

                                    htmlbody = "Welcome to " + topName + ", " + req.body.stripeEmail + "! <br><a href=\"" + rootHost + "/validate/" + cleanhash + "\">To get started, click here to validate account</a> <br><br>"+
                                    "You may then log into the app, using your email as username, and with the password <strong>" + userPass + "</strong> which you may change at any time." +
                                    " You may also change your username, but your account will remain tied to this email address.<br><br>" +
                                    "Payment ID: " + item_id;
                                    ses.sendEmail({
                                        Source: from,
                                        Destination: { ToAddresses: [req.body.stripeEmail], CcAddresses: [], BccAddresses: [adminEmail] },
                                        Message: {
                                            Subject: {
                                                Data: 'New ' + topName + ' Subscription!'
                                            },
                                            Body: {
                                                Html: {
                                                    Data: htmlbody
                                                }
                                            }
                                        }
                                    }
                                    , function(err, data) {
                                        if(err) throw err
                                        console.log('Email sent:');
                                        console.log(data);
                                        //res.redirect("http://elnoise.com/#/login");
                                    });
                                }
                                    res.redirect("/#/newthanks");
                                });

                            });
                        });
                    }
                });

            } else {
                console.log("tryna update payment for existing user " + req.body.stripeEmail);
                db.purchases.save(req.body, function (err, saved) {
                if ( err || !saved ) {
                    console.log('purchase not saved..');
                    res.send("nilch");
                } else {
                    var item_id = saved._id.toString();
                    console.log('new purchase id: ' + item_id);
                    if (item_id != null) {
                        
                        db.users.update( { email: req.body.stripeEmail }, { $set: { stripeCustomerID: customerID, paymentStatus: "ok", lastPurchaseID : item_id }});
                    
                        htmlbody = "Thanks for your support, your payment was received! You should be able login as usual.<br>"+
                        "If you need to reset your password, go to " + rootHost + "/#/reset/<br>" + 
                        "If you have any questions or problems, you may reply to this email, or contact polytropoi@gmail.com. <br>Best regards,<br>Jim Cherry<br><br>" +
                        "Payment ID: " + item_id;
                        ses.sendEmail({
                            Source: "admin@servicemedia.net",
                            Destination: { ToAddresses: [req.body.stripeEmail], CcAddresses: [], BccAddresses: [adminEmail] },
                            Message: {
                                Subject: {
                                    Data: topName + ' Payment Received - Thanks!'
                                },
                                Body: {
                                    Html: {
                                        Data: htmlbody
                                    }
                                }
                            }
                        }
                        , function(err, data) {
                            if(err) throw err
                            console.log('Email sent:');
                            console.log(data);
                            //res.redirect("http://elnoise.com/#/login");
                        });
                    }
                }
                });
                res.redirect("/#/thanks");
            }
        });
        // res.send(JSON.stringify(charge));
    });




//    var charge = stripe.charges.create({
//        amount: 1000,
//        currency: "usd",
//        description: "Example charge",
//        source: token,
//    }, function(err, charge) {
//        // asynchronously called
//        console.log("charged! " + token +  " body:  " + JSON.stringify(req.body) + " charge " + JSON.stringify(charge));
//
//        res.send("token : " + token +  " for " + JSON.stringify(req.body));
//
//    });
});

app.post('/check_sub_email/', requiredAuthentication, function(req, res){ //convert IAP subscriber to actual user
    console.log(req.body);
    // res.send("you sent " + req.body);
    db.users.find( {email: req.body.email}, function (err, users) {
        if (err || !users || users.length < 1) { //if no users already exist for this email
            db.iap.findOne({receipt: req.body.receipt}, function (err, recpt) { //is receipt "valid" i.e. stored in iap table?
                if (err || !recpt) {
                    res.send("invalid receipt");
                } else { 
                    db.users.find({receipt : req.body.receipt}, function (err, receepts) { //has receipt already been used for an existing user?
                        if (err || receepts.length > 0) {
                            var htmlbody = req.body.email + " tryna reuse same receipt : " + JSON.stringify(req.body.receipt);
                            ses.sendEmail( {
                                Source: "admin@servicemedia.net",
                                Destination: { ToAddresses: [adminEmail]},
                                Message: {
                                    Subject: {
                                        Data: "receipt reuse from " + req.body.email
                                    },
                                    Body: {
                                        Html: {
                                            Data: htmlbody
                                        }
                                    }
                                }
                            }
                            , function(err, data) {
                                if(err) throw err
                                console.log('Email sent:');
                                console.log(data);
                               
                            });
                            res.send("Error: this subscription has already been used by another user.  Please contact admin@servicemedia.net");

                        } else {
                            console.log('fixing to make a new user from iap subscriber!'); //do it!
                            var from = "admin@servicemedia.net";
                            var timestamp = Math.round(Date.now() / 1000);
                            var ip = req.headers['x-forwarded-for'] ||
                                req.connection.remoteAddress ||
                                req.socket.remoteAddress ||
                                req.connection.socket.remoteAddress;
                            var userPass = shortid.generate();
                            bcrypt.genSalt(10, function(err, salt) {
                                bcrypt.hash(userPass, salt, null, function(err, hash) {
                                    var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                                    db.users.save({
                                        type : 'iap_subscriber',
                                        status : 'unvalidated',
                                        userName : req.body.email,
                                        email : req.body.email,
                                        createDate : timestamp,
                                        validationHash : cleanhash,
                                        createIP : ip,
                                        paymentStatus: "ok",
                                        receipt: req.body.receipt,
                                        iapID: recpt._id,
                                        // odomain : req.body.domain, //original domain
                                        // oappid : req.headers.appid.toString().replace(":", ""), //original app id
                                        password : hash
                                    },
                                    function (err, newUser){
                                        if ( err || !newUser ){
                                            console.log("db error, new user not saved", err);
                                            res.send("error creating user : " + err);
                                        } else  {
                                            console.log("new user saved to db");
                                            var user_id = newUser._id.toString();
                                            console.log("userID: " + user_id);

                                            htmlbody = "Welcome to " + topName + ", " + req.body.email + "!  <a href=\""+ rootHost + "/validate/" + cleanhash + "\">To get started, click this link to validate account</a> <br><br>"+
                                            "You may then log into the app, using your email as username, and with the password <strong>" + userPass + "</strong> which you may change at any time.<br>" +
                                            "You may also change your username, but your account will remain tied to this email address.<br><br>" +
                                            "in-app-purchase ID: " + recpt._id;  
                                            ses.sendEmail({
                                                    Source: from,
                                                    Destination: { ToAddresses: [req.body.email], CcAddresses: [], BccAddresses: [adminEmail] },
                                                    Message: {
                                                        Subject: {
                                                            Data: 'New ' + topName + ' Subscription!'
                                                        },
                                                        Body: {
                                                            Html: {
                                                                Data: htmlbody
                                                            }
                                                        }
                                                    }
                                                }
                                                , function(err, data) {
                                                    if(err) throw err
                                                    console.log('Email sent:');
                                                    console.log(data);
                                                    //res.redirect("http://elnoise.com/#/login");
                                                });
                                        
                                        res.send("Thanks! A validation email has been sent to the address you provided; you must click on the validation link to activate your account.");
                                        // res.redirect("/#/newthanks");
                                        var htmlbody = req.body.email + " iap subscriber converting to user with receipt : " + JSON.stringify(req.body.receipt);
                                        ses.sendEmail( {
                                            Source: "admin@servicemedia.net",
                                            Destination: { ToAddresses: [adminEmail]},
                                            Message: {
                                                Subject: {
                                                    Data: "new iap user " + req.body.email
                                                },
                                                Body: {
                                                    Html: {
                                                        Data: htmlbody
                                                    }
                                                }
                                            }
                                        }
                                        , function(err, data) {
                                            if(err) throw err
                                            console.log('Email sent:');
                                            console.log(data);
                                           
                                        });
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        } else {

            res.send("Sorry, that email is already in use.\n\nTo recover a lost password, use the Reset button on the previous page");
        }
    });
});

app.get('/makedomainadmin/:domain/:_id',  checkAppID, requiredAuthentication, admin, function (req, res) {
    console.log(" makedomainadmin req" + req)
    var u_id = ObjectID(req.params._id);
    db.users.update(
        { "_id": u_id },
        {$set: { "authLevel" : "domain_admin_" + req.params.domain }}, function (err, done) {
            if (err | !done) {
                console.log("proobalert");
                res.send("proobalert");
            } else {
                db.acl.update(
                { acl_rule: "domain_admin_" + req.params.domain }, { $push: { 'userIDs': req.params._id }}, {upsert : true},  function (err, saved) {
                    if (err || !saved) {
                        console.log("prooblemo");
                        res.send('prooblemo');
                    } else {
//                                db.acl.update({ 'acl_rule': "domain_admin_" + req.params.domain},{ $push: { 'userIDs': req.params._id } });
                        console.log("ok saved acl");
                    }
                    console.log("gold");
                    res.send('gold');
                });
            }
        }
    );
});
app.post('/updatedomain/', requiredAuthentication, admin, domainadmin, function (req, res) { //um, no// um, fuckit
    console.log("tryna uddate domain! for " + JSON.stringify(req.body));
    var timestamp = Math.round(Date.now() / 1000);
    req.body.lastUpdateTimestamp = timestamp;
    req.body.lastUpdateUserID = req.session.user._id.toString();
    req.body.lastUpdateUserName = req.session.user.userName;
    db.domains.update({"_id": ObjectID(req.body._id)},
    {$set: {domain: req.body.domain, domainStatus: req.body.domainStatus.toLowerCase()}}, function (err, domain) {
        console.log("tryna update domain " + req.body._id);
    // db.apps.update(req.body,  function (err, app) {
        if (err || !domain) {
            res.send("no domain update for you");
        } else {
            // console.log("updated app id " + )
            res.send("updated");
        }
    });
});
app.post('/createdomain/', requiredAuthentication, admin, domainadmin, function (req, res) { //um, no// um, fuckit

    var timestamp = Math.round(Date.now() / 1000);
    req.body.dateCreated = timestamp;
    req.body.domainStatus = req.body.domainStatus.toLowerCase();
    // req.body.appStatus = "active";
    req.body.createdByUserID = req.session.user._id.toString();
    req.body.createdByUserName = req.session.user.userName;
    db.domains.save(req.body, function (err, domain) {
        if (err | !domain) {
            res.send("no domain for you");
        } else {
            res.json("created " + domain);
        }
    });
});

// app.get('/create_app/:domain/:appname', checkAppID, requiredAuthentication, domainadmin, function (req, res) {
//     db.apps.save({"appname": req.params.appname, "appStatus": "active", "domain": req.params.domain, "dateCreated": new Date()}, function (err, app) {
//         if (err | !app) {
//             res.send("no app for you");
//         } else {
//             res.json(app);

//         }
//     });
// });
app.post('/allapps/', requiredAuthentication, admin, function (req, res) {

    db.apps.find({}, function (err, apps) { //TODO fetch users for each?  or resources used?
        if (err | !apps) {
            console.log("no apps for admin!?!");
            res.send("no apps for admin - that ain't right!~");
        } else {
            response.apps = apps;
            res.json(response);
        }
    });
});

app.post('/createapp/', requiredAuthentication, admin, domainadmin, function (req, res) {
    db.apps.find({$and: [{"appdomain": req.body.appdomain}, {"appname": req.body.appname}]}, function (err, apps) {
        if (!err && (apps == null || apps.length == 0)) {
            req.body.dateCreated = new Date();
            req.body.createdByUserID = req.session.user._id.toString();
            req.body.createdByUserName = req.session.user.userName;
            db.apps.save(req.body, function (err, app) {
                if (err || !app) {
                    res.send("no app for you" + err);
                } else {
                    res.json("created" + app);
                }
            });
        } else {
            res.send("sorry, that app name already exists");
        }
    });
});

app.post('/updateapp/:appid', requiredAuthentication, admin, function (req, res) {
        console.log("tryna update appid " + req.params.appid + " body: " + JSON.stringify(req.body));
        db.apps.update({"_id": ObjectID(req.body._id)},
        {$set: {appname: req.body.appname, appStatus: req.body.appStatus, appdomain: req.body.appdomain}}, function (err, app) {
            console.log("tryna update app " + req.body._id);
        // db.apps.update(req.body,  function (err, app) {
            if (err || !app) {
                res.send("no app for you");
            } else {
                // console.log("updated app id " + )
                res.send("updated");
            }
        });
});
app.post('/domain/', requiredAuthentication, domainadmin, function (req, res) {
    // console.log("tryna get domain info for " + req.params.domain);
    let oid = ObjectID(req.body._id);
    db.domains.findOne({_id: oid}, function (err, domain) {
        if (err | !domain) {
            res.send("no domain for you");
        } else {
            if (domain.domainPictureIDs != null && domain.domainPictureIDs != undefined && domain.domainPictureIDs.length > 0) {
                // oids = domain.domainPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                const oids = domain.domainPictureIDs.map(item => {
                    return ObjectID(item);
                })
                db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        res.send("error: " + err);
                    } else {
                        domainPictures = [];
                        pic_items.forEach(function(picture_item){                
                            var imageItem = {};
                            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                            var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                            imageItem.urlThumb = urlThumb;
                            imageItem.urlHalf = urlHalf;
                            imageItem.urlStandard = urlStandard;
                            imageItem._id = picture_item._id;
                            imageItem.filename = picture_item.filename;
                            domainPictures.push(imageItem);
                            domain.domainPictures = domainPictures;
                        });
                        res.json(domain);
                    }
                });
            } else {
                 res.json(domain);
            }
        }
    }); 
});
app.get('/domain/:domain', checkAppID, requiredAuthentication, domainadmin, function (req, res) {
    console.log("tryna get domain info for " + req.params.domain);
    db.domains.findOne({"domain": req.params.domain}, function (err, domain) {
        if (err | !domain) {
            res.send("no domain for you");
        } else {
            db.apps.find({"appdomain": req.params.domain}, function(err,apps) {
                if (err || !apps) {
                    console.log("no apps for you!");
                    res.json(domain);
                } else {
                    domain.apps = apps;
                    res.json(domain);
                }
            })
        }
    });
});
app.get('/app/:appID', requiredAuthentication, admin, function (req, res) {
    console.log("tryna get app " + req.params.appID);
    let oid = ObjectID(req.params.appID);
    db.apps.findOne({_id: oid}, function (err, app) {
        if (err | !app) {
            res.send("no apps");
        } else {
            console.log(JSON.stringify(app.appPictureIDs));
            if (app.appPictureIDs != null && app.appPictureIDs != undefined && app.appPictureIDs.length > 0) {
                let appPictures = [];
                const oids = app.appPictureIDs.map(item => {
                    return ObjectID(item);
                });
                console.log("oids " + oids);
                db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                    if (err || !pic_items) {
                        callbackz();
                        console.log("error getting picture items: " + err);
                    } else {
                        console.log("picItems found for app : " + JSON.stringify(pic_items));
                        async.each (pic_items, function (picture_item, pcallbackz) {
                            var imageItem = {};
                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                            imageItem.urlHalf = urlHalf;
                            imageItem._id = picture_item._id;
                            imageItem.filename = picture_item.filename;
                            appPictures.push(imageItem);
                            pcallbackz();
                        }, function(err) {
                            if (err) {
                                console.log('An app pic image failed to process');
                                res.send("error: " + err);
                            } else {
                                console.log('Added images to app successfully');
                                // pcallbackz();
                                app.appPictures = appPictures;
                                res.json(app);
                            }
                        });
                        
                    }
                });
            } else {
                console.log("no pic ids!");
                res.json(app);
            }
        }
    });
});
app.get('/domain/:appID', checkAppID, requiredAuthentication, domainadmin, function (req, res) { //redundant? 
    db.apps.find({"app": req.params.appID}, function (err, app) {
        if (err | !users) {
            res.send("no apps");
        } else {
            res.json(app);
        }
    });
});
// app.get('/allusers/', checkAppID, requiredAuthentication, admin, function (req, res) { //todo
app.get('/allusers/', requiredAuthentication, admin, function (req, res) { //todo
    console.log("tryna get users");
    db.users.find({}, function (err, users) {
        if (err | !users) {
            res.send("wtf! no users!?!?!");
        } else {
            res.json(users);
        }
    });
});

app.get('/alldomains/', requiredAuthentication, admin, function (req, res) {
    console.log("tryna get domains");
    db.domains.find({}, function (err, users) {
        if (err | !users) {
            res.send("wtf! no domains!?!?!");
        } else {
            res.json(users);
        }
    });
});

// app.get('/profile/:_id', checkAppID, requiredAuthentication, usercheck, function (req, res) {
app.get('/profile/:_id', requiredAuthentication, usercheck, function (req, res) { //rem'd checkAppID, bc profiles can cross app lines

//       if (amirite("admin", req.session.user._id.toString())) { //check the acl

    console.log("tryna profile...");
    var u_id = ObjectID(req.params._id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            profileResponse = user;
            profileResponse.activity = {};
            profileResponse.scores = {};
            profileResponse.purchases = {};
            profileResponse.assets = {};
            console.log("user profile for " + req.params._id);

            async.waterfall([
                    function (callback) {
                        db.activity.find({"userID": req.params._id}, function (err, activities) {
                            if (err || !activities) {
                                console.log("no activities");
//                                      res.json(profileResponse);
                                callback();
                            } else {
                                // console.log("user activitiesw: " + JSON.stringify(activities));
                                profileResponse.activity = activities;
                                callback();
                            }
                        });
                    },
                    function (callback) {
                        db.scores.find({"userID": req.params._id}, function (err, scores) {
                            if (err || !scores) {
                                console.log("no scores");
//                                      res.json(profileResponse);
                                callback();
                            } else {
                                // console.log("user scores: " + JSON.stringify(scores));
                                profileResponse.scores = scores;
                                callback();
                            }
                        });

                    },
                    function (callback) {
                        db.purchases.find({"userID": req.params._id}, function (err, purchases) {
                            if (err || !purchases) {
                                console.log("no purchases");
//                                      res.json(profileResponse);
                                callback();
                            } else {
                                // console.log("user purchases: " + JSON.stringify(purchases));
                                profileResponse.purchases = purchases;
                                callback();
                            }
                        });

                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/bundles_ios/'
                        }

                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {


                                profileResponse.assets = data.Contents;
                                // console.log("assets available: " + JSON.stringify( profileResponse.assets));
                                callback();
                            }
                        });

                    }],
                function (err, result) { // #last function, close async
                    res.json(profileResponse);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });
//       } else {
//           res.send("noauth");
//       }
});


app.post('/update_profile/:_id', function (req, res) {
    var u_id = ObjectID(req.params.auth_id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);

        } else {
            console.log("users authlevel : " + user.authLevel);

            db.users.update({ _id: o_id }, { $set: {
                authLevel : req.body.authLevel
//                    profilePic : profilePic
            }});
        }
        //}
    });
});

app.post('/update_userassets/', requiredAuthentication, function (req, res) {
    var u_id = req.body.user_id;
    console.log("tryna update userassets for " + u_id);
    var resp = db.assets.update( { "user_id": u_id }, { $set : req.body}, {upsert: true});

//    db.people.findAndModify({
//        query: { name: "Pascal", state: "active", rating: 25 },
//        sort: { rating: 1 },
//        update: { $inc: { score: 1 } },
//        upsert: true,
//        new: true
//    })

    res.send(resp);
});

app.post('/update_userassetpic/', requiredAuthentication, upload.single('file'), function (req, res) {
//    var platform = req.body.pform;
//    var fname = req.body.fname;
    console.log("update assetpic headers:" + JSON.stringify(req.headers));
//            setTimeout(1000);
        console.log("body " + JSON.stringify(req.body));
        var filepath = "";
        var params = {};
        async.waterfall([
            function (callback) {

                console.log("file " + req.file.path);
                filepath = req.file.path;
                var stream = fs.createReadStream(filepath);
//       var data = {Bucket: theBucketFolder, Key: fname, Body: stream};
                params = {Bucket: 'mvmv.us', Key: req.body.prefix + req.body.filename, Body: stream};
                callback();
            },
            function (callback) {
                s3.putObject(params, function (err, data) {
                    if (err) {
                        console.log("Error uploading data: ", err);
                        stream.close();
                        callback(err);
                        res.send("error: " + JSON.stringify(err));
                    } else {
                        console.log("Successfully uploaded data to " + params);
                        res.send('original file in s3' + JSON.stringify(data));
                        stream.close();
                        callback(null, 'uploaded orig file');
                    }
                });
            }],

            function (err, result) { // #last function, close async
//                res.json(assetsResponse);
                console.log("waterfall done: " + result);

            }
            );
    });

app.get('/get_userassets/:_id', requiredAuthentication, usercheck, function (req, res) {
    console.log("tryna get_userassets for " + req.params._id );
    // if (req.session.user.authLevel.toLowerCase().includes("admin")) {
    //     db.assets.find({}, function (err, assets) {
    //         if (err || !assets) {
    //             console.log("error getting user assets: " + err);
    //         } else {
    //             console.log("got all the assets!");
    //             res.send (assets);
    //         }
    //     });
    // } else {
        db.assets.find({"user_id": req.params._id}, function (err, assets) {
            if (err || !assets) {
                console.log("error getting user assets: " + err);
            } else {
                console.log("got user assets!");
                res.send (assets);
            }
        });
    // }
});

app.get('/get_models/:_id', requiredAuthentication, function (req, res) {
    console.log("tryna get_models for " + req.params._id );
        db.models.find({"userID": req.params._id}, function (err, models) {
            if (err || !models) {
                console.log("error getting user assets: " + err);
            } else {
                // console.log("got user models:" + JSON.stringify(models));
                res.send (models);
            }
        });
    // }
});
app.get('/get_model/:_id', requiredAuthentication, function (req, res) {
    var model_id = ObjectID(req.params._id);
    console.log("tryna get_models for " + req.params._id );
        db.models.findOne({"_id": model_id}, function (err, model) {
            if (err || !model) {
                console.log("error getting model: " + err);
            } else {
                // console.log("got user models:" + JSON.stringify(models));
                let url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + model.userID + "/gltf/" + model.filename, Expires: 6000});
                model.url = url;
                res.send (model);
            }
        });
});

app.get('/asset_conv/:_id', requiredAuthentication, usercheck, function (req, res) {
    // console.log("tryna get_userassets for " + req.params._id );
    db.assets.findOne({"user_id": req.params._id}, function (err, assets) {
        if (err || !assets) {
            console.log("error getting user assets: " + err);
        } else {
            console.log("got user assets!");
            let response = {};
            for (asset in assets) {
                
            }
            res.send (response);
        }
    });
});

app.get('/sceneassetputurl/:u_id', checkAppID, requiredAuthentication, usercheck, function (req, res) {

    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            const fileName = req.query['file-name'];
            const fileType = req.query['file-type'];
            const s3Params = {
                Bucket: S3_BUCKET,
                Key: fileName,
                Expires: 60,
                ContentType: fileType,
                ACL: 'public-read'
            };

            s3.getSignedUrl('putObject', s3Params, (err, data) => {
                if(err){
                console.log(err);
                return res.end();
                }
                const returnData = {
                signedRequest: data,
                url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
                };
                res.write(JSON.stringify(returnData));
                res.end();
            });
        }
    });
});

app.get('/bundleassetputurl/:_id/:version_sig/:platform_sig', checkAppID, requiredAuthentication, usercheck, function (req, res) {
    var u_id = ObjectID(req.params._id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            var url = s3.getSignedUrl('putObject', {Bucket: 'servicemedia', Key: "users/" + u_id + "/assets/" + req.params.version_sig + "/bundles_" + req.params.platform_sig, Expires: 600});
//            s3.getSignedUrl('putObject', params, (err, url) => {
//                if (err) return console.log(err);

            res.json({ url: url });
//        });
        }
    });
});

// app.post('/objputurl/:_id', requiredAuthentication, function (req, res) {
//     console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + req.body.contentType);
//     var cType = req.body.contentType;
//     // if (cType = "application/octet-stream") {
//     //     cType = "binary/octet-stream";
//     // }
//     var u_id = ObjectID(req.params._id);
//     db.users.findOne({"_id": u_id}, function (err, user) {
//         if (err || !user) {
//             console.log("error getting user: " + err);
//         } else {
//             //TODO is user in good standing? 
//             // var params =
//             var timestamp = Math.round(Date.now());
//             const params = {
//                 Bucket: 'archive1',
//                 //meatadata aqui
//                 // ACL: 'bucket-owner-full-control',
//                 // ContentType: 'text/csv',
//                 Body: '',
//                 ContentType: cType,
//                 Key: 'obj_staging/' + u_id + '/' + timestamp + '_' + req.body.filename,
//                 // Key: req.body.filename,
//                 Expires: 100
//               };
//             // var url = s3.getSignedUrl('putObject', {Bucket: 'servicemedia', Key: "users/" + u_id + "/staging" + req.params.platform_sig, Expires: 600});
//             s3.getSignedUrl('putObject', params, function(err, signedUrl) {
//                 let response;
//                 if (err) {
//                   response = {
//                     statusCode: 500,
//                     headers: {
//                       'Access-Control-Allow-Origin': '*',
//                     },
//                     body: JSON.stringify({
//                       error: 'Did not receive signed url'
//                     }),
//                   };
//                   console.log("putObject url error : " + err );
//                   res.json(err);
//                 } else {
//                   response = {
//                     statusCode: 200,
//                     headers: {
//                       'Access-Control-Allow-Origin': '*', // Required for CORS support to work
//                     },
//                     body: "",
//                     // body: JSON.stringify({
//                     //   message: `Url successfully created`,
//                     //   signedUrl,
//                     // }),
//                     method: "put",
//                     url: signedUrl,
//                     fields: []
//                     };
//                     console.log("putObject url : " + signedUrl );
//                     res.json(response);
//                 }
//             });
//         }
//     });
// });

// app.post('/process_object_files', requiredAuthentication, function (req, res) { //from staging folder
//     var itemsArray = req.body.processMe.items;
//     // var createGroup = false;
//     // var groupType = "";
//     // var groupID;
//     var uid;
//     var isObj
//     var objName;
//     console.log("process_object_files : " + JSON.stringify(req.body));
//     var itemsExtensions = itemsArray.map(item => {
//         return getExtension(item.key);
//     });

//     var meateada = {};
//     var groupitems = [];
//     var params = {
//         Bucket: 'archive1',
//     };
//     var nameSplitter = function(name) {
//         // index = name.indexOf("_");
//         var splitName = name.split("_");
//         console.log(name + " splitName " + splitName[3]);
//         // return name.substring(index + 2);   
//         return splitName[3]; 
//     }
//     // var originalName = function (name) {
//     //     var index = name.indexOf("_");
//     //     return name.substring(index + 1); //strip off prepended timestamp and _ for title and stuff
//     // }
//     // console.log("all items must be the same media type " + itemsExtensions.length); //TODO handle if they're different

//         var isObj = false; //if it's an obj (for now), upload with sibling files, to a named bucket...
//         var objName = "";
          
//             async.waterfall([
//             // function (callback) {
//             //     // console.log("Bucket exists and we have access");
//             //     var params = {Bucket: 'archive1', Delimiter: item.uid, Key: "obj_staging/" + item.uid + "/" + item.key}    
//             //     s3.headObject(params, function (err, data) {
//             //         if (err && err.code === 'NotFound') {
//             //             // Handle no object on cloud here
//             //             console.log(err);
//             //             callback(err);
//             //             res.send("staged file not found");
//             //         } else {
//             //             // meateada = metadata;
//             //             console.log("staged file meateada " + data);
//             //             callback(null);
//             //         }
//             //     });
//             // },    
//             function(callback) {
//                 async.each(itemsArray, function (item, cb) { 
                    
//                     console.log("item  :" + item.key);
//                     var iext = getExtension(item.key);
//                     if (iext == ".obj") {
//                         isObj = true;
//                         objName = nameSplitter(item.key);
//                         callback();
//                     } else {
//                         // console.log("cain't find no object file");
//                         cb(null);
//                     }
//                 });
//             },
//             // function (callback) {
//             //     for (var i = 0; i < itemsArray.length; i++) {
//             //         console.log("item  :" + itemsArray[i].key);
//             //         var iext = getExtension(itemsArray[i].key);
//             //         if (iext == ".obj") {
//             //             isObj = true;
//             //             objName = originalName(itemsArray[i].key);
//             //         }
//             //     }
//             //     callback(null);
            
//             // },
//             function (callback) {
//                 if (isObj) {
//                     console.log("object name is " + objName);
//                     async.each(itemsArray, function (item, cb) { 
                    
//                     var targetBucket = "servicemedia";
//                     var copySource = "archive1/obj_staging/" + item.uid + "/" + item.key;
//                     var ck = "users/" + item.uid + "/objs/" + objName + "/" + nameSplitter(item.key);
//                     s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err,data){
//                         if (err) {
//                             console.log("ERROR copyObject" + err);
//                             cb(err);
//                         }
//                         else {
//                             console.log("SUCCESS copyObject key " + ck + " response: " + data );
//                             cb(null);
//                         }
//                     });
//                     },
//                     function (err) {
//                        
//                         if (err) {
//                             console.log('A file failed to process');
//                             callback(null);
//                         } else {
//                             console.log('All files have been processed successfully');
//                             callback(null);
//                         }
//                     });
//                 } else {
//                     console.log("cain't find no objs, ending...");
//                     callback(err);
//                     }
//                 }
//         ],
//         function(err, result) { // #last function, close async
//             if (err != null) {
//                 res.send(err);
//             } else {
//                 console.log("waterfall done: " + result);
//                 //  res.redirect('/upload.html');
//                 res.send("upload completee!");
//             }
//         });
//     // }
// }); //end app.post /process_object

function sizeOf(key, bucket) {
    return s3.headObject({ Key: key, Bucket: bucket })
        .promise()
        .then(res => res.ContentLength);
}

app.post('/process_staging_files', requiredAuthentication, function (req, res) { //from staging folder
    var itemsArray = req.body.processMe.items;
    var createGroup = false;
    var groupType = "";
    var groupID;
    var uid;
    var isObj
    var objName;
    console.log("process_staging_files : " + JSON.stringify(req.body));
    var itemsExtensions = itemsArray.map(item => {
        return getExtension(item.key).toLowerCase();
    });

    var meateada = {};
    var groupitems = [];
    var params = {
        Bucket: 'archive1',
    };
    var originalName = function (name) {
        var index = name.indexOf("_");
        return name.substring(index + 1); //strip off prepended timestamp and _ for title and stuff
    }
    params.Delete = {Objects:[]};
    const allEqual = itemsExtensions => itemsExtensions.every( v => v === itemsExtensions[0] ); //if all extensions the same, then make a group (which is the point)
    console.log("same extensions: "+ itemsExtensions[0]);

    if (allEqual(itemsExtensions) && (itemsExtensions[0] == ".glb" || itemsExtensions[0] == ".jpg" || itemsExtensions[0] == ".JPG" || itemsExtensions[0] == ".jpeg" || itemsExtensions[0] == ".png" || itemsExtensions[0] == ".PNG" ||
     itemsExtensions[0] == ".aif" || itemsExtensions[0] == ".AIFF" || itemsExtensions[0] == ".wav" || itemsExtensions[0] == ".WAV" || itemsExtensions[0] == ".mp3" || itemsExtensions[0] == ".mp4" || itemsExtensions[0] == ".MP4"|| itemsExtensions[0] == ".mkv" || itemsExtensions[0] == ".MKV")) { //need to think how to flex, and use contenttype
        
        var ts = Math.round(Date.now() / 1000);
        createGroup = true;
        groupType = itemsExtensions[0];

        async.waterfall([
           
            function(callbk) {     //callbk
                async.each(itemsArray, function (item, cb) {  //1. make sure the file is where it's supposed to be...
                    let itemKey = item.key.toLowerCase();
                    itemKey = itemKey.replace(/[/\\?%*:|"<>]\s/g, '-');
                    let size = 0;
                    async.waterfall([
                        function (callback) {
                            console.log("groupTYpe : " + groupType);
                            // console.log("Bucket exists and we have access");
                            var params = {Bucket: 'archive1', Delimiter: item.uid, Key: "staging/" + item.uid + "/" + itemKey}    
                            s3.headObject(params, function (err, data) {
                                if (err && err.code === 'NotFound') {
                                    // Handle no object on cloud here
                                    console.log(err);
                                    callback(err);
                                    res.send("staged file not found");
                                } else {
                                    // meateada = metadata;
                                    console.log("staged file meateada " + data);
                                    callback(null);
                                }
                            });
                        },
                        function(callback) { //copy file to the archive folder (current staging one will be deleted)
                            var targetBucket = "archive1";
                            var copySource = "archive1/staging/" + item.uid + "/" + itemKey;
                            var ck = "archived/" + item.uid + "/" + itemKey;
                            s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err,data){
                                if (err) {
                                    console.log("ERROR copyObject" + err);
                                    callback(err);
                                } else {
                                    console.log("SUCCESS copyObject key " + ck + " data: " + data);
                                    callback(null);
                                }
                            });
                        },
                        function (callback) { // get the size for the source file
                            console.log("item uid : " + item.uid);
                            var params = {Bucket: 'archive1', Key: "archived/" + item.uid + "/" + itemKey};
                            s3.headObject(params, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack);  // an error occurred
                                    callback(err);
                                } else {
                                    console.log(data);           // successful response
                                    size = data.ContentLength;
                                    console.log("sizeOf = " + size);
                                    callback(null);
                                }    
                            });

                        },
                        function (callback) { // Get a url for the source file
                            console.log("item uid : " + item.uid);
                            var params = {Bucket: 'archive1', Key: "archived/" + item.uid + "/" + itemKey};
                            s3.getSignedUrl('getObject', params, function (err, url) {
                                if (err) {
                                    console.log(err);
                                    cb();
                                } else {
                                    console.log("The URL is", url);
                                    callback(null, url);
                                }
                            });
                        },
                        function (tUrl, callback) { //make an appropriate (by file extension) record in the db and get an _id
                            if (groupType == ".jpg" || groupType == ".jpeg" || groupType == ".JPG" || groupType == ".png" || groupType == ".PNG") {
                                console.log("tryna save a jpg at " + tUrl);
                                
                                db.image_items.save({   
                                    type : "fromStaging",
                                    userID : item.uid,
                                    title : originalName(itemKey),
                                    filename : itemKey,
                                    item_type : 'picture',
                                    tags: [],
                                    item_status: "private",
                                    otimestamp : ts,
                                    ofilesize : size },
                                    function (err, saved) {
                                    if ( err || !saved ) {
                                        console.log('picture not saved..');
                                        callback (err);
                                        } else {
                                            var item_id = saved._id.toString();
                                            groupitems.push(item_id);
                                            console.log('new audio item id: ' + item_id);
                                            callback(null, item_id, tUrl);
                                        }
                                    }
                                );
                            } else if (groupType == ".mp3" || groupType == ".wav" || groupType == ".aif" ||  groupType == ".AIFF" || groupType == ".WAV"  )  {
                                console.log("tryna save an audio " + tUrl);
                                db.audio_items.save(
                                    {type : "stagedUserAudio",
                                        userID : req.session.user._id.toString(),
                                        username : req.session.user.userName,
                                        title : originalName(itemKey),
                                        artist : "",
                                        album :  "",
                                        filename : itemKey,
                                        item_type : "audio",
                                        tags: [],
                                        item_status: "private",
                                        otimestamp : ts,
                                        ofilesize : size},
                                    function (err, saved) {
                                        if ( err || !saved ) {
                                            console.log('audio item not saved..');
                                            callback (err);
                                        } else {
                                            var item_id = saved._id.toString();
                                            groupitems.push(item_id);
                                            console.log('new item id: ' + item_id);
                                            callback(null, item_id, tUrl);
                                        }
                                    }
                                );
                            } else if (groupType == ".mp4" || groupType == ".MP4" || groupType == ".mkv" || groupType == ".MKV")  {
                                console.log("tryna save a video " + tUrl);
                                db.video_items.save(
                                    {
                                        userID : req.session.user._id.toString(),
                                        username : req.session.user.userName,
                                        title : originalName(item.key),
                                        filename : itemKey,
                                        item_type : 'video',
                                        tags: [],
                                        item_status: "private",
                                        otimestamp : ts,
                                        ofilesize : size},
                                    function (err, saved) {
                                        if ( err || !saved ) {
                                            console.log('video not saved..');
                                            callback (err);
                                        } else {
                                            var item_id = saved._id.toString();
                                            groupitems.push(item_id);
                                            console.log('new item id: ' + item_id);
                                            callback(null, item_id, tUrl);
                                        }
                                    }
                                );
                            } else if (groupType == ".glb") {
                                console.log("tryna save a glb " + tUrl);
                                db.models.save({
                                    userID : req.session.user._id.toString(),
                                    username : req.session.user.userName,
                                    name : ts + "_" + originalName(item.key),
                                    filename : itemKey,
                                    item_type : 'glb',
                                    tags: [],
                                    item_status: "private",
                                    otimestamp : ts,
                                    ofilesize : size },
                                function (err, saved) {
                                    if ( err || !saved ) {
                                        console.log('glb not saved..');
                                        callback (err);
                                    } else {
                                        var item_id = saved._id.toString();
                                        groupitems.push(item_id);
                                        console.log('new item id: ' + item_id);
                                        callback(null, item_id, tUrl);
                                    }
                                });
                                // callback(null, null, tUrl); //don't save in db for now
                            }
                        },
                        function(iID, tUrl, callback) { //send to transloadit and/or copy to production folder..
                            if (groupType == ".jpg"  || groupType == ".jpeg" || groupType == ".JPG" || groupType == ".png" || groupType == ".PNG") {
                                console.log("transcodePictureURL request: " + tUrl);
                                var encodePictureUrlParams = {
                                    steps: {
                                        ':orig': {
                                            robot: '/http/import',
                                            url : tUrl
                                        }
                                    },
                                    'template_id': 'f9e7db371a1a4fd29022cc959305a671',
                                    'fields' : { image_item_id : iID,
                                        user_id : item.uid
                                    }
                                };
                                transloadClient.send(encodePictureUrlParams, function(ok) {
                                console.log('transloadit Success: ' + encodePictureUrlParams); //if it makes it to transloadit, copy original too
                                    var copySource = "archive1/staging/" + item.uid + "/" + itemKey;
                                    var ck = "users/" + item.uid + "/" + iID + ".original." + itemKey;
                                    console.log("tryna copy origiinal to " + ck);
                                    var targetBucket = "servicemedia";
                                    s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err,data){
                                        if (err) {
                                            console.log("ERROR copyObject" + err);
                                            callback(err);
                                        }
                                        else {
                                            console.log("SUCCESS copyObject key " + ck );
                                            callback(null);
                                        }
                                    });
                                    
                                }, function(err) {
                                    console.log('transloadit Error: ' + JSON.stringify(err));
                                    callback(err);
                                });
                            } else if (groupType == ".mp3" || groupType == ".wav" || groupType == ".aif" ) { 
                                console.log("transcodeAudioURL request: " + tUrl);
                                var encodeAudioUrlParams = {
                                    steps: {
                                        ':orig': {
                                            robot: '/http/import',
                                            url : tUrl
                                        }
                                    },
                                    'template_id': '84da9df057e311e4bdecf5e543756029',
                                    'fields' : { audio_item_id : iID,
                                        user_id : req.session.user._id.toString()
                                    }
                                };
                                transloadClient.send(encodeAudioUrlParams, function(ok) {
                                    console.log('Success: ' + JSON.stringify(ok));
                                    callback(null);
                                }, function(err) {
                                    console.log('Error: ' + JSON.stringify(err));
                                    callback(err);
                                });
                                
                            } else if (groupType == ".mp4" || groupType == ".MP4" || groupType == ".mkv" || groupType == ".MKV") {
                                var targetBucket = "servicemedia";
                                var copySource = "archive1/staging/" + item.uid + "/" + itemKey;
                                
                                var ck = "users/" + item.uid + "/" + iID + "." + itemKey;
                                console.log("tryna process a video file " + copySource + " to " + targetBucket + ck);
                                s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err, data){
                                    if (err) {
                                        console.log("ERROR copyObject" + err);
                                        callback(err);
                                    }
                                    else {
                                        console.log("SUCCESS copyObject key " + ck );
                                        callback(null);
                                    }
                                });
                            } else if (groupType == ".glb") {
                                var targetBucket = "servicemedia";
                                var copySource = "archive1/staging/" + item.uid + "/" + itemKey;
                                var ck = "users/" + item.uid + "/gltf/" + itemKey;
                                console.log("tryna copy glb to " + ck);
                                s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err,data){
                                    if (err) {
                                        console.log("ERROR copyObject" + err);
                                        callback(err);
                                    }
                                    else {
                                        console.log("SUCCESS copyObject key " + ck );
                                        callback(null);
                                    }
                                });
                            }  
                            /* I don't know what this is doing!
                            //copy original pic, but don't wait for it...
                            if (groupType != ".jpg")  {  //shouldn't this be if it is a jpg, not if it's not?
                            var targetBucket = "servicemedia";
                                var copySource = "archive1/staging/" + item.uid + "/" + itemKey;
                                var ck = "users/" + item.uid + "/" + iID + ".original." + itemKey;
                                console.log("tryna copy glb to " + ck);
                                s3.copyObject({Bucket: targetBucket, CopySource: copySource, Key: ck}, function (err,data){
                                    if (err) {
                                        console.log("ERROR copyObject" + err);
                                       
                                    }
                                    else {
                                        console.log("SUCCESS copyObject key " + ck );
                                       
                                    }
                                });
                            }
                            */

                        },
                        function (callback) {
                            // var mediafolder;
                            // if (groupType == ".jpg" || groupType == ".jpeg" || groupType == ".JPG" || groupType == ".png" || groupType == ".PNG") {
                            //     mediafolder = "";
                            // }
                            // if (groupType == ".mp3" || groupType == ".wav" || groupType == ".aif" ||  groupType == ".AIFF" || groupType == ".WAV"  )  {
                            //     mediafolder = ""; 
                            // }
                            // if (groupType == ".mp4") {
                            //     mediafolder = "";
                            // }
                            // if (groupType == ".glb") {
                            //     mediafolder = "gltf/";
                            // }
                            // params = {
                            //     Bucket: 'archive1',
                            // };
                            // params.Delete = {Objects:[]};
                            params.Delete.Objects.push({Key: 'staging/' + item.uid + '/' + item.key});
                            // console.log("delete params: " + JSON.stringify(params));
                            s3.deleteObjects(params, function(err, data) {
                                if (err) {
                                    console.log("error deleting " + err);
                                    callback(err);
                                } else {
                                    // console.log('deleted staging files: ' + JSON.stringify(params));
                                    callback(null);
                                }
                            });
                            // callback(null);
                        },
                        ], //inner waterfall async end                        
                        function(err, result) { // #last function, close async
                            if (err != null) {
                                console.log("callback callback err");
                                // callback(err);
                                cb(err);
                            } else {
                                console.log("callbacks done!~");
                            //    callback(null);
                                cb();
                            uid = itemsArray[0].uid;    
                            }
                        
                        });
                    // cb();
                    }, 
                    function (err, result) { // #last function, close async
                        if (err != null) {
                            console.log("error processing files! " + err);
                            callbk(err);
                        } else {
                            console.log("processing files complete");

                            callbk();
                    // console.log("available domain scene waterfall done with count: " + availableScenesResponse.availableScenes.length    
                        uid = itemsArray[0].uid;
                        // ();
                        
                        }
                    })
                },
                function (callbk) {
                    console.log("tryna make group for " + uid);
                    var group = {};                
                    group.userID = uid;
                    group.items = groupitems;
                    if (group.items.length > 1) {
                        if (groupType == ".jpg") {
                            group.type = "picture";
                            group.name = "pictures " + ts;
                        } else if (groupType == ".png") {
                            group.type = "picture";
                            group.name = "pictures " + ts;
                        } else if (groupType == ".glb") {
                            group.type = "object";
                            group.name = "objects " + ts;
                        } else if (groupType == ".mp3") {
                            group.type = "audio";
                            group.name = "audio " + ts;
                        } else if (groupType == ".mp4") {
                            group.type = "video";
                            group.name = "video " + ts;
                        } else {
                            callbk(null);
                        }
                        db.groups.save(group, function (err, saved) {
                            if ( err || !saved ) {
                                console.log('group not saved..');
                                callbk(err);
                                // res.send("nilch");
                            } else {
                                groupID = saved._id.toString();
                                console.log('new group created, id: ' + groupID);
                                callbk(null);
                                //res.send("group created : " + item_id);
                            }
                        });
                    } else { //no group if only one
                        callbk(null);
                    }
                }
                // function (callbk) {
                //     // setTimeout(function() {10000});
                //     s3.deleteObjects(params, function(err, data) {
                //         if (err) {
                //             console.log("error deleting " + err);
                //             // callback(err);
                //             callbk(err);
                //         } else {
                //             console.log('deleted staging files: ' + JSON.stringify(params));
                //             callbk(null);
                //         }
                //     });
                // },
            ],
            function(err, result) { // #last function, close async
                if (err != null) {
                    res.send(err);
                } else {
                    console.log("waterfall done: " + result);
                    //  res.redirect('/upload.html');
                    res.send("group created with groupID " + groupID);
                }
            });

    } else { //if not all the same, check if it's an object file, and upload with siblings (*.mtl and pic file(s))
        console.log("all items must be the same media type " + itemsExtensions.length); //TODO handle if they're different
    }
}); //end app.post /process_staging

app.post('/staging_delete', requiredAuthentication, function (req, res) {
    console.log("staging delete: " + JSON.stringify(req.body));
    params = {
            Bucket: 'archive1',
            // Prefix: 'staging/' + u_id + '/'
        };
    params.Delete = {Objects:[]};
    // req.body.Contents.forEach(function(content) {
    params.Delete.Objects.push({Key: 'staging/' + req.body.uid + '/' + req.body.key});
    // });
    console.log("delete params: " + JSON.stringify(params));
    s3.deleteObjects(params, function(err, data) {
        if (err) {
            console.log("error deleting " + err)
            res.send("error deleting " + err);
        } else {
            res.send("files deleted" + JSON.stringify(data));
        }
    });
});
app.post('/staging_delete_array', requiredAuthentication, function (req, res) {
    console.log("staging delete: " + JSON.stringify(req.body));
    params = {
            Bucket: 'archive1',
            // Prefix: 'staging/' + u_id + '/'
        };
    params.Delete = {Objects:[]};
    req.body.deleteMe.items.forEach(function(content) {
        params.Delete.Objects.push({Key: 'staging/' + content.uid + '/' + content.key});
    });
    console.log("delete params: " + JSON.stringify(params));
    s3.deleteObjects(params, function(err, data) {
        if (err) {
            console.log("error deleting " + err)
            res.send("error deleting " + err);
        } else {
            res.send("files deleted" + JSON.stringify(data));
        }
    });
});

app.post('/putobjecturl/', requiredAuthentication, function (req, res) {
    console.log("tryna get a puturl for contentTYpe : " + req.body.contentType);
    var cType = req.body.contentType;
    var timestamp = Math.round(Date.now());
    const params = {
        Bucket: '3dcasefiles.com/braincheck',
        //meatadata aqui
        // ACL: 'bucket-owner-full-control',
        // ContentType: 'text/csv',
        Body: '',
        ContentType: cType,
        Key: req.body.filename,
        Expires: 100
    };

    s3.getSignedUrl('putObject', params, function(err, signedUrl) {
        let response;
        if (err) {
            response = {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Did not receive signed url'
            }),
            };
            console.log("putObject url error : " + err );
            res.json(err);
        } else {
            response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            },
            body: "",
            method: "put",
            url: signedUrl,
            fields: []
            };
            console.log("putObject url : " + signedUrl );
            res.json(signedUrl);
        }
    });
});

/*
app.post('/processupload/', requiredAuthentication, function (req, res) {

    async.waterfall([ //flow control for functions below, do one at a time, and pass vars to next as needed

        // function(callback) { //check for proper extensions
        //     var fname_ext = getExtension(fname);
        //     console.log("extension of " + fname + "is " + fname_ext);
        //     if (fname_ext === ".jpeg" || fname_ext === ".jpg" || fname_ext === ".JPG" || fname_ext === ".png" || fname_ext === ".gif") {
        //         if (fname_ext === ".jpeg" || fname_ext === ".jpg" || fname_ext === ".JPG") {
        //             fname = fname.substr(0, fname.lastIndexOf(".")) + ".jpg";
        //             }
        //         callback(null);
        //     } else {
        //         callback(error);
        //         res.end("bad file");
        //     }
        // },
        function(callback) { //check that we gotsa bucket for this user

            var bucketFolder = 'servicemedia';
            console.log(bucketFolder);
            s3.headBucket({Bucket:bucketFolder},function(err,data){
                if(err){
                    console.log("bucket creation");
                    callback(null, bucketFolder);
                } else {
                    console.log("Bucket exists and we have access");
                    callback(null, bucketFolder);
                }
            });
        },
        function(theBucketFolder, callback) { //upload orig file to s3

            var stream = fs.createReadStream(fpath);
            var keymod = "original_" + fname; // TODO prevent collisions!  maybe a short timestamp mod of original name
            var data = {Bucket: theBucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fname, Body: stream};
            console.log("orignal file to: " + data);
            s3.putObject(data, function(err, data) {
                if (err) {
                    stream.close();
                    console.log("Error uploading data: ", err);
                    callback(err);
                } else {
                    stream.close();
                    console.log("Successfully uploaded data to " + theBucketFolder);
                    callback(null, 'uploaded orig file');
                }
            });
        },

        function(arg1, callback) { //#3 save data to mongo, get object ID

            var itemTitle = "";

            db.image_items.save(
                {type : type,
                    userID : req.session.user._id.toString(),
                    username : req.session.user.userName,
                    title : "",

                    filename : fname,
                    item_type : 'picture',
                    //alt_title : req.files.audio_upload.title,
                    //alt_artist : req.files.audio_upload.artist,
                    //alt_album : req.files.audio_upload.album,
                    tags: req.body.tags,
                    item_status: "private",
                    //        postcardForScene : req.body.postcardForScene,
                    otimestamp : ts,
                    ofilesize : fsize},
                function (err, saved) {
                    if ( err || !saved ) {
                        console.log('picture not saved..');
                        callback (err);
                    } else {
                        var item_id = saved._id.toString();
                        console.log('new item id: ' + item_id);
                        callback(null,item_id);
                    }
                }
            );
        },

        function (itemID, callback) { //if the post has postcard or pic scene data, update that scene (* using short code here, bad idea?) //TODO add equirect for skybox

            if (pictureForScene != null) {
                var shortID = pictureForScene;
                console.log("tryna update scene pic for " + shortID);
//                db.scenes.update({short_id: shortID}, {$push: {scenePictures: itemID}} );
                db.scenes.findOne({short_id: shortID}, function (err, scene) {
                    if (err || !scene) {
                        console.log("error getting scene 5: " + err);
                        callback(null, itemID);
                    } else {
                        var scenePics = [];
                        if (scene.scenePictures != null) {
                            scenePics = scene.scenePictures;
                        }
                        console.log("XXX scenePics: " + scenePics);
                        scenePics.push(itemID);
                        db.scenes.update({ short_id: shortID }, { $set: {scenePictures: scenePics}
                        });
                        callback(null, itemID);
                    }
                });

            } else if (postcardForScene != null) {
                var shortID = postcardForScene;
                db.scenes.findOne({short_id: shortID}, function (err, scene) {
                    if (err || !scene) {
                        console.log("error getting scene 5: " + err);
                        callback(null, itemID);
                    } else {
                        var scenePostcards = [];
                        if (scene.scenePostcards != null) {
                            scenePostcards = scene.scenePostcards;
                        }
                        console.log("XXX scenePostcards: " + scenePostcards);
                        scenePostcards.push(itemID);
                        db.scenes.update({ short_id: shortID }, { $set: {scenePostcards: scenePostcards}
                        });
                        callback(null, itemID);
                    }
                });
                // callback(null, itemID);
            } else {
                callback(null, itemID);
            }
        },


        function(itemID, callback) {//get a URL of the original file now in s3, to send down the line
            var bucketFolder = 'servicemedia';
            //var tempURL = knoxClient.signedUrl(fname, expires);
            var keymodd = "original_" + fname;
            var params = {Bucket: bucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fname };

            s3.getSignedUrl('getObject', params, function (err, url) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log("The URL is", url);
                    callback(null, url, itemID);
                }
            });
        },
        function(tUrl, iID, callback) { //send to transloadit..
            console.log("transcodePictureURL request: " + tUrl);
            var encodePictureUrlParams = {
                steps: {
                    ':orig': {
                        robot: '/http/import',
                        url : tUrl
                    }
                },
                'template_id': 'f9e7db371a1a4fd29022cc959305a671',
                'fields' : { image_item_id : iID,
                    user_id : req.session.user._id.toString()
                }
            };
            transloadClient.send(encodePictureUrlParams, function(ok) {
                console.log('transloadit Success: ' + encodePictureUrlParams);
            }, function(err) {
                console.log('transloadit Error: ' + JSON.stringify(err));
                callback(err);
            });
            callback(null, iID);

        },
        function(itemID2, callback) {  //gen a short code and insert //not for picss

            callback(null,itemID2);
        }
    ], //end async flow

    function(err, result) { // #last function, close async
        console.log("transcode waterfall done: " + result);
        //  res.redirect('/upload.html');
        res.end(result);
    }
});
*/
app.post('/puturl/', requiredAuthentication, function (req, res) {
    console.log("tryna get a puturl for contentTYpe : " + req.body.contentType);
    var cType = req.body.contentType;
    // var timestamp = Math.round(Date.now());
    const params = {
        Bucket: 'archive1/tmp',
        Body: '',
        ContentType: cType,
        Key: req.body.filename,
        Expires: 100
    };

    s3.getSignedUrl('putObject', params, function(err, signedUrl) {
        let response;
        if (err) {
            response = {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Did not receive signed url'
            }),
            };
            console.log("putObject url error : " + err );
            res.json(err);
        } else {
            response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            },
            body: "",
            method: "put",
            url: signedUrl,
            fields: []
            };
            console.log("putObject url : " + signedUrl );
            res.json(signedUrl);
        }
    });
});
// app.post('/objputurl/:_id', requiredAuthentication, function (req, res) {
//     console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + req.body.contentType);
   
//     var isObj
//     var objName;
//     // console.log("process_sgaing_files : " + JSON.stringify(req.body));
   
//     var meateada = {};
//     var groupitems = [];
//     var params = {
//         Bucket: 'archive1',
//     };
//     var originalName = function (name) {
//         var index = name.indexOf("_");
//         return name.substring(index + 1); //strip off prepended timestamp and _ for title and stuff
//     }

//     var isObj = false; //if it's an obj (for now), upload with sibling files, to a named bucket...
//     var objName = "";
//     var cType = req.body.contentType;
//     // if (cType = "application/octet-stream") {
//     //     cType = "binary/octet-stream";
//     // }
//     var u_id = ObjectID(req.params._id);
//     db.users.findOne({"_id": u_id}, function (err, user) {
//         if (err || !user) {
//             console.log("error getting user: " + err);
//         } else {
//             //TODO is user in good standing? 
//             // var params =
//             var timestamp = Math.round(Date.now());
//             var ck = "users/" + item.uid + "/objs/" + objName + "/" + item.key;
//             const params = {
//                 Bucket: 'servicemedia',
//                 //meatadata aqui
//                 // ACL: 'bucket-owner-full-control',
//                 // ContentType: 'text/csv',
//                 Body: '',
//                 ContentType: cType,
//                 // Key: 'staging/' + u_id + '/' + timestamp + '_' + req.body.filename,
//                 Key: "users/" + item.uid + "/objs/" + objName + "/" + req.body.filename,
//                 Expires: 100
//               };
//             // var url = s3.getSignedUrl('putObject', {Bucket: 'servicemedia', Key: "users/" + u_id + "/staging" + req.params.platform_sig, Expires: 600});
//             s3.getSignedUrl('putObject', params, function(err, signedUrl) {
//                 let response;
//                 if (err) {
//                   response = {
//                     statusCode: 500,
//                     headers: {
//                       'Access-Control-Allow-Origin': '*',
//                     },
//                     body: JSON.stringify({
//                       error: 'Did not receive signed url'
//                     }),
//                   };
//                   console.log("putObject url error : " + err );
//                   res.json(err);
//                 } else {
//                   response = {
//                     statusCode: 200,
//                     headers: {
//                       'Access-Control-Allow-Origin': '*', // Required for CORS support to work
//                     },
//                     body: "",
//                     // body: JSON.stringify({
//                     //   message: `Url successfully created`,
//                     //   signedUrl,
//                     // }),
//                     method: "put",
//                     url: signedUrl,
//                     fields: []
//                     };
//                     console.log("putObject url : " + signedUrl );
//                     res.json(response);
//                 }
//             });
//         }
//     });
// });

app.post('/cubemap_puturl/:_id/:image_id', requiredAuthentication, function (req, res) {
    console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + req.body.contentType);
    var cType = req.body.contentType;
    // if (cType = "application/octet-stream") {
    //     cType = "binary/octet-stream";
    // }

  

    var u_id = ObjectID(req.params._id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            res.send("not a valid user!");
            console.log("error getting user: " + err);
        } else {
            db.image_items.findOne({_id: ObjectID(req.params.image_id)}, function (err, picture_item) {
                if (err || !picture_item) {
                    res.send("not a valid pic!")
                    console.log("error getting picture items: " + err);
                } else {
                    console.log("gotsa picture ID for cubemap: " + JSON.stringify(picture_item));
            // var timestamp = Math.round(Date.now());
            let mapID = "px";
            if (req.body.mapNumber == "2") {
                mapID = "nx";
            } else if (req.body.mapNumber == "3") {
                mapID = "py";
            } else if (req.body.mapNumber == "4") {
                mapID = "ny";
            } else if (req.body.mapNumber == "5") {
                mapID = "pz";
            } else if (req.body.mapNumber == "6") {
                mapID = "nz";
            }
            const params = {
                Bucket: 'archive1',
                //meatadata aqui
                // ACL: 'bucket-owner-full-control',
                // ContentType: 'text/csv',
                Body: '',
                ContentType: 'image/jpeg',
                // Key: 'staging/' + u_id + '/' + timestamp + '_' + req.body.filename,
                Key: "staging/" + picture_item.userID + "/cubemaps/" + req.params.image_id + "_"+mapID+".jpg",
                Expires: 100
                };
            // var url = s3.getSignedUrl('putObject', {Bucket: 'servicemedia', Key: "users/" + u_id + "/staging" + req.params.platform_sig, Expires: 600});
                s3.getSignedUrl('putObject', params, function(err, signedUrl) {
                    let response;
                    if (err) {
                    response = {
                        statusCode: 500,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                        },
                        body: JSON.stringify({
                        error: 'Did not receive signed url'
                        }),
                    };
                    console.log("putObject url error : " + err );
                    res.json(err);
                    } else {
                    response = {
                        statusCode: 200,
                        headers: {
                            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                            'Content-Type': 'image/jpeg  '
                        },
                        body: "",
                        // body: JSON.stringify({
                        //   message: `Url successfully created`,
                        //   signedUrl,
                        // }),
                        method: "put",
                        url: signedUrl,
                        fields: []
                        };
                        console.log("putObject url : " + signedUrl );
                        res.json(response);
                        }
                    });
                }
            });
        }
    });
});


app.post('/stagingputurl/:_id', requiredAuthentication, function (req, res) {
    console.log("tryna get a puturl for : " + req.body.uid + " contentTYpe : " + req.body.contentType);
    var cType = req.body.contentType;
    // if (cType = "application/octet-stream") {
    //     cType = "binary/octet-stream";
    // }
    var u_id = ObjectID(req.params._id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            //TODO is user in good standing? 
            // var params =
            var timestamp = Math.round(Date.now());
            const params = {
                Bucket: 'archive1',
                //meatadata aqui
                // ACL: 'bucket-owner-full-control',
                // ContentType: 'text/csv',
                Body: '',
                ContentType: cType,
                // Key: 'staging/' + u_id + '/' + timestamp + '_' + req.body.filename,
                Key: req.body.filename,
                Expires: 100
              };
            // var url = s3.getSignedUrl('putObject', {Bucket: 'servicemedia', Key: "users/" + u_id + "/staging" + req.params.platform_sig, Expires: 600});
            s3.getSignedUrl('putObject', params, function(err, signedUrl) {
                let response;
                if (err) {
                  response = {
                    statusCode: 500,
                    headers: {
                      'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                      error: 'Did not receive signed url'
                    }),
                  };
                  console.log("putObject url error : " + err );
                  res.json(err);
                } else {
                  response = {
                    statusCode: 200,
                    headers: {
                      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                    },
                    body: "",
                    // body: JSON.stringify({
                    //   message: `Url successfully created`,
                    //   signedUrl,
                    // }),
                    method: "put",
                    url: signedUrl,
                    fields: []
                    };
                    console.log("putObject url : " + signedUrl );
                    res.json(response);
                }
            });
        }
    });
});


app.get('/staging/:_id', requiredAuthentication, function (req, res) {

    u_id = req.params._id;
    response = {};
    rezponze = {};
    stagedItems = [];
    async.waterfall([
        function (callback) {
            var params = {
                Bucket: 'archive1',
                Prefix: 'staging/' + u_id + '/'
            }
            s3.listObjects(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (data.Contents.length == 0) {
                    console.log("no content found");
                    callback(null);
                } else {
                    response = data.Contents;
                    callback();
                }
            });
        },
        function (callback) {

            async.each (response, function (r, callbackz) { //loop tru w/ async
                // console.log("r = " + JSON.stringify(r.Headers));
                var name = r.Key;
                if (!name.includes("cubemaps")) { //skip cubemaps stored here for now...
                name = name.replace('staging/' + u_id + '/', "");
                var itme = {}
                itme.name = name;
                // console.log("modding name : " + itme.name);
                var assetURL = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: r.Key, Expires: 60000});
                itme.url = assetURL;

                stagedItems.push(itme);
                callbackz();
                } else {
                callbackz();
                }
            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    callbackz(err);
                } else {
                    console.log('All files have been processed successfully');
                    stagedItems.reverse();
                    rezponze.stagedItems = stagedItems;
                    callback(null);
                }
            });
        }
    ],
    function (err, result) { // #last function, close async
        res.json(rezponze);
        console.log("waterfall done: " + result);
    });
});


app.get('/gltf/:_id', function (req, res) {

    u_id = req.params._id;
    response = {};
    rezponze = {};
    gltfItems = [];
    async.waterfall([
        function (callback) {
            var params = {
                Bucket: 'servicemedia',
                Prefix: 'users/' + u_id + '/gltf/'
            }
            s3.listObjects(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (data.Contents.length == 0) {
                    console.log("no content found");
                    callback(null);
                } else {
                    response = data.Contents;
                    callback();
                }
            });
        },
        function (callback) {

            async.each (response, function (r, callbackz) { //loop tru w/ async
                // console.log("r = " + JSON.stringify(r.Headers));
                var name = r.Key;
                name = name.replace('users/' + u_id + '/gltf/', "");
                var itme = {}
                itme.name = name;
                // console.log("modding name : " + itme.name);
                var assetURL = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: r.Key, Expires: 60000});
                itme.url = assetURL;

                gltfItems.push(itme);
                callbackz();
            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    callbackz(err);
                } else {
                    console.log('All files have been processed successfully');
                    gltfItems.reverse();
                    rezponze.gltfItems = gltfItems;
                    callback(null);
                }
            });
        }
    ],
    function (err, result) { // #last function, close async
        res.json(rezponze);
        console.log("waterfall done: " + result);
    });
});

app.get('/archived/:_id', requiredAuthentication, function (req, res) {

    u_id = req.params._id;
    response = {};
    rezponze = {};
    stagedItems = [];
    async.waterfall([
        function (callback) {
            var params = {
                Bucket: 'archive1',
                Prefix: 'archived/' + u_id + '/'
            }
            s3.listObjects(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (data.Contents.length == 0) {
                    console.log("no content found");
                    callback(null);
                } else {
                    response = data.Contents;
                    callback();
                }
            });
        },
        function (callback) {

            async.each (response, function (r, callbackz) { //loop tru w/ async
                // console.log("r = " + JSON.stringify(r.Headers));
                var name = r.Key;
                name = name.replace('staging/' + u_id + '/', "");
                var itme = {}
                itme.name = name;
                var assetURL = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: r.Key, Expires: 60000});
                itme.url = assetURL;

                stagedItems.push(itme);
                callbackz();
            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    callbackz(err);
                } else {
                    console.log('All files have been processed successfully');
                    stagedItems.reverse();
                    rezponze.stagedItems = stagedItems;
                    callback(null);
                }
            });
        }
    ],
    function (err, result) { // #last function, close async
        res.json(rezponze);
        console.log("waterfall done: " + result);
    })
});
// route below returns "raw" s3 data, one above is parsed / saved/ updated from it on client
app.get('/assets/:_id', checkAppID, requiredAuthentication, usercheck, function (req, res) {

//       if (amirite("admin", req.session.user._id.toString())) { //check the acl

    console.log("tryna get assets for user...");
    var u_id = ObjectID(req.params._id);
    db.users.findOne({"_id": u_id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            assetsResponse = user;
            assetsResponse.scenes_ios = {};
            assetsResponse.scenes_android = {};
            assetsResponse.scenes_win = {};
            assetsResponse.bundles_ios = {};
            assetsResponse.bundles_android = {};
            assetsResponse.bundles_win = {};
            console.log("gettting assets for user " + req.params._id);

            async.waterfall([
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/scenes_ios/'
                        }

                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.scenes_ios = data.Contents;
                                callback();
                            }
                        });
                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/scenes_android/'
                        }
                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.scenes_android = data.Contents;
                                callback();
                            }
                        });

                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/scenes_win/'
                        }
                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.scenes_win = data.Contents;
                                callback();
                            }
                        });

                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/bundles_ios/'
                        }
                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.bundles_ios = data.Contents;
                                callback();
                            }
                        });
                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/bundles_android/'
                        }
                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.bundles_android = data.Contents;
                                callback();
                            }
                        });
                    },
                    function (callback) {
                        var params = {
                            Bucket: 'mvmv.us',
//                            Delimiter: '/',
                            Prefix: 'assets_2018_1/bundles_win/'
                        }
                        s3.listObjects(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            if (data.Contents.length == 0) {
                                console.log("no content found");
                                callback(null);
                            } else {
                                assetsResponse.bundles_win = data.Contents;
                                callback();
                            }
                        });

                    },
                    function (callback) {
                        callback();
//                        var assetsjson = JSON.stringify(assetsResponse);
//                        console.log("assetsjson: " + assetsjson);
//                        s3.putObject({ Bucket: 'mvmv.us', Key: 'assets.json', Body: assetsjson,  ContentType: 'binary', ContentEncoding: 'utf8' }, function (err, data) {
//                            if (err != null) {
//
//                                console.log(err);
//                                callback();
//                            } else {
//
//                                console.log(data);
//                                callback(data);
//                            }
//
//                        });


                       // });

                    }],
                function (err, result) { // #last function, close async
                    res.json(assetsResponse);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });
});

app.get('/sharedasset/:assetstring', checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get asset " + req.params.assetstring);
    var assetString = req.params.assetstring.replace("/", ".");
    var assetURL = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: assetString, Expires: 60000});
    res.send(assetURL);
});

app.post('/resetcheck', function (req, res) {
    console.log("reset check:" + req.body.hzch);
    db.users.findOne({"resetHash": req.body.hzch}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            var timestamp = Math.round(Date.now() / 1000);
            if (timestamp < user.resetTimestamp + 3600) { //expires in 1 hour!
                console.log(user.resetTimestamp);
                res.send("validlink");
            } else {
                console.log("expired link");
                res.send("invalidlink");
            }
        }
    });
});

app.post('/invitation_check', function (req, res) {
    console.log("invitation check:" + req.body.hzch);
    db.invitations.findOne({"invitationHash": req.body.hzch}, function (err, invitation) {
            if (err || !invitation) {
                console.log("did not find invitation: " + err);
                res.send("not found");
            } else {
                var timestamp = Math.round(Date.now() / 1000);
                var pin = Math.random().toString().substr(2,20)
                if (timestamp < invitation.invitationTimestamp + 36000) { //expires in 10 hour!
                    console.log("timestamp checks out!" + invitation.invitationTimestamp);

                    db.invitations.update ( { "invitationHash": req.body.hzch }, { $set: { validated: true, pin : pin} });
                    var response = {};
                    response.short_id = invitation.invitedToSceneShortID;
                    response.ok = "yep";
                    response.pin = pin;
                    var codestring = "~" + response.pin;
                    QRCode.toDataURL(codestring, function (err, url) {
                        // console.log(url);
                        // var imgLink = "<img width=\x22128\x22 height=\x22128\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/>"
                        // console.log(response.qrcode);
                        // res.send(imgLink);
                        response.qrcode = url;
                        res.send(response);
                      });
                    // console.log(response.qrcode);

                } else {
                    console.log("expired link");
                    res.send("expired");
                }
            }
        });
});

app.post ('/get_invitations', checkAppID, requiredAuthentication, function (req,res) {// sigh, need to encrypt this...
    var timestamp = Math.round(Date.now() / 1000);
    console.log("tryna get_invitations: " + JSON.stringify(req.body) + " at timestamp " + timestamp);
    // var emailString = req.body.email;
    if (req.body.email != null)
    var query = {$and: [{sentToEmail : req.body.email}, {validated : true}, {accessTimeWindow: {$gt : timestamp}}]};
    if (req.body.pin != null)
    var query = {$and: [{pin : req.body.pin}, {validated : true}, {accessTimeWindow: {$gt : timestamp}}]};
    console.log("tryna get_invitations: " + JSON.stringify(req.body) + " at timestamp " + timestamp + " with query " + query);
    if (query != null) {
        db.invitations.find (query, function (err, invitations) {
            // db.invitations.find ({$and: [{sentToEmail : req.body.email}, {validated : true} ]}, function (err, invitations) {
            if (err || !invitations) {
                console.log("error getting invitations: " + err);
            } else {
                //TODO - Pass along a postcard for each invitation..., needs an async
                var invitationsData = {};
                invitationsData.invitations = invitations;
                res.json(invitationsData);
                }
        });
    } else {
        res.end("null query");
    }
});

app.post('/savepw', checkAppID, function (req, res){

    db.users.findOne({"resetHash": req.body.hzch}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
        } else {
            var timestamp = Math.round(Date.now() / 1000);
            if (timestamp < user.resetTimestamp + 3600) { //expires in 1 hour!
                // console.log(req.body.password);
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(req.body.password, salt, null, function(err, hash) {
                        db.users.update( { _id: user._id }, { $set: { resetHash: "", resetTimestamp: timestamp, password: hash}});
                        res.send("pwsaved");
                    });
                });
            } else {
                console.log("expired link");
                res.send("expiredlink")
            }

        }
    });
});

app.post('/resetpw', checkAppID, function (req, res) {

    console.log('reset request from: ' + req.body.email);
    // ws.send("authorized");
    var subject = topName + " Password Reset"
    var from = adminEmail
    var to = [req.body.email];
    var bcc = [domainAdminEmail];
    //var reset = "";
    var timestamp = Math.round(Date.now() / 1000);

    if (validator.isEmail(req.body.email) == true) {

        db.users.findOne({"email": req.body.email}, function (err, user) {
            if (err || !user) {
                console.log("error getting user: " + err);
                res.send("email address not found");
            } else {

                bcrypt.genSalt(3, function(err, salt) { //level3 easy, not a password itself
                    bcrypt.hash(timestamp.toString(), salt, null, function(err, hash) {
                        // reset = hash;
                        var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                        db.users.update( { _id: user._id }, { $set: { resetHash: cleanhash, resetTimestamp: timestamp}});
                        var htmlbody = "<h3>" + topName + " Password Reset</h3><hr><br>" +
                            "Click here to reset your password (link expires in 1 hour): </br>" +
                            rootHost + "/#/resetter/" + cleanhash;

                    ses.sendEmail( {
                            Source: from,
                            Destination: { ToAddresses: to, BccAddresses: bcc},
                            Message: {
                                Subject: {
                                    Data: subject
                                },
                                Body: {
                                    Html: {
                                        Data: htmlbody
                                    }
                                }
                            }
                        }
                        , function(err, data) {
                            if(err) throw err
                            console.log('Email sent:');
                            console.log(data);
                            res.send(data);
                            // res.redirect("/#/");
                        });
                    });
                });
            }
        });
    } else {
        res.send("invalid email address");
    }
});
app.post('/send_invitations', requiredAuthentication, checkAppID, function (req, res) {

    console.log('reset request from: ' + req.body.email);
    // ws.send("authorized");
    var subject = topName + "  Invitation"
    var from = adminEmail
    var to = [req.body.email1];
    var bcc = [ "polytropoi@gmail.com"];
    //var reset = "";
    var timestamp = Math.round(Date.now() / 1000);

    if (validator.isEmail(req.body.email) == true) {

        // db.users.findOne({"email": req.body.email}, function (err, user) {
        //     if (err || !user) {
        //         console.log("error getting user: " + err);
        //         res.send("email address not found");
        //     } else {

                bcrypt.genSalt(3, function(err, salt) { //level3 easy, not a password itself
                    bcrypt.hash(timestamp.toString(), salt, null, function(err, hash) {
                        // reset = hash;
                        var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                        db.invitations.save( { _id: user._id }, { $set: { invitationHash: cleanhash, invitationTimestamp: timestamp}});
                        var htmlbody = "<h3>" + topName + " Invitation from " + from + "</h3><hr><br>" +
                            "Click here authenticate your access (link expires in 1 hour): </br>" +
                            rootHost + "/#/invitation/" + cleanhash;

                    ses.sendEmail( {
                            Source: from,
                            Destination: { ToAddresses: to, BccAddresses: bcc},
                            Message: {
                                Subject: {
                                    Data: subject
                                },
                                Body: {
                                    Html: {
                                        Data: htmlbody
                                    }
                                }
                            }
                        }
                        , function(err, data) {
                            if(err) throw err
                            console.log('Email sent:');
                            console.log(data);

                            res.redirect(rootHost);
                        });
                    });
                });
        //     }
        // });
    } else {
        res.send("invalid email address");
    }
});
app.post('/invite_scene/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log("share node: " + req.body._id + " wmail: " + req.body.sceneShareWith);


    var subject = "Immersive Scene Postcard : " + req.body.sceneTitle;

    var from = adminEmail;
    var to = [req.body.sceneShareWith];
    var bcc = [];
    //var reset = "";
    var timestamp = Math.round(Date.now() / 1000);
    var message = "";
    var servicemedia_link = rootHost + "/#/s/" + req.body.short_id;
    var wgl_link = "http://mvmv.us/?scene=" + req.body.short_id;
    var mob_link = "http://strr.us/?scene=" + req.body.short_id;
    if (req.body.sceneMessage === "" || req.body.sceneMessage == null) {
        message = " has shared a Postcard from the Metaverse with you!";
    } else {
        message = " has shared a Postcard from the Metaverse with you including this message: " +
            "<hr><br> " + req.body.sceneMessage +  "<br>"
    }
    var urlHalf = "";
    if (req.body.postcards[0]) {
        urlHalf = req.body.postcards[0].urlHalf;
    }
    if (validator.isEmail(req.body.sceneShareWith) == true) {
        var htmlbody = req.session.user.userName + message + "</h3><hr><br>" +
            "<br> Scene Title: " + req.body.sceneTitle +
            "<br> Scene Key: " + req.body.short_id +
            "<br> Scene Type: " + req.body.sceneType +
            "<br> Scene Description: " + req.body.sceneDescription +
            "<br><br> <img src=" + urlHalf + "> " +
            "<br> <a href= " + servicemedia_link + "> Click here for more postcards and content from this scene. </a> <br>If you already have the " + topName + " iOS app, you may load the scene directly with the <a href= " + mob_link + ">Mobile App Link</a>" +

//            "r><br> <a href= " + mob_link + "> Mobile App link </a> " +
            "<br>You may also enter the scene title or keycode on the " + topName + " app landing page" +

            "<br> For more scenes like this, or to get the latest app, visit <a href='https://servicemedia.net'>ServiceMedia.net!</a> ";

        ses.sendEmail( {
                Source: from,
                Destination: { ToAddresses: to, BccAddresses: bcc},
                Message: {
                    Subject: {
                        Data: subject
                    },
                    Body: {
                        Html: {
                            Data: htmlbody
                        }
                    }
                }
            }
            , function(err, data) {
                if(err) throw err
                console.log('Email sent:');
                console.log(data);
                res.send("Email sent");
                // res.redirect("http://elnoise.com/#/play/" + audio_item[0].short_id);
            });

    } else {
        res.send("invalid email address");
    }
//                    }
//                });
});

app.post('/newuser', checkAppID, function (req, res) {
//        $scope.user.domain = "servicmedia";
//        $scope.user.appid = "55b2ecf840edea7583000001";

    var appid = req.headers.appid;
    var domain = req.body.domain;
    console.log('newUser request from: ' + req.body.userName);
    // ws.send("authorized");
    if (req.body.userPass.length < 7) {  //weak
        console.log("bad password");
        res.send("badpassword");

    } else if (validator.isEmail(req.body.userEmail) == false) {  //check for valid email

        console.log("bad email");
        res.send("bad email");

    } else {

        db.users.findOne({userName: req.body.userName}, function(err, existingUserName) { //check if the username already exists
            if (err || !existingUserName) {  //should combine these queries into an "$or" //but then couldn't respond separately
                db.users.findOne({email: req.body.userEmail}, function(err, existingUserEmail) { //check if the email already exists
                    if (err || !existingUserEmail || req.body.userEmail == domainAdminEmail) {
                        console.log('dinna find tha name');
                        var from = adminEmail; //TODO CHANGe!!!!
                        var timestamp = Math.round(Date.now() / 1000);
                        var ip = req.headers['x-forwarded-for'] ||
                            req.connection.remoteAddress ||
                            req.socket.remoteAddress ||
                            req.connection.socket.remoteAddress;
                        bcrypt.genSalt(10, function(err, salt) {
                            bcrypt.hash(req.body.userPass, salt, null, function(err, hash) {
                                var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                                db.users.save(
                                    {type : 'baseuser',
                                        status : 'unvalidated',
                                        authLevel : 'base',
                                        userName : req.body.userName,
                                        email : req.body.userEmail,
                                        createDate : timestamp,
                                        validationHash : cleanhash,
                                        createIP : ip,
                                        odomain : req.body.domain, //original domain
                                        oappid : req.headers.appid.toString().replace(":", ""), //original app id
                                        password : hash
                                    },
                                    function (err, newUser){
                                        if ( err || !newUser ){
                                            console.log("db error, new user not saved", err);
                                            res.send("error");
                                        } else  {
                                            console.log("new user saved to db");
                                            var user_id = newUser._id.toString();
                                            console.log("userID: " + user_id);
                                            req.session.auth = user_id;
                                            req.session.user = newUser;
                                            res.cookie('_id', user_id, { maxAge: 900000, httpOnly: false});
                                            res.send("validation email sent");
                                            //send validation email

                                            htmlbody = "Welcome, " + req.body.userName + "! <a href=\"" + rootHost + "/validate/" + cleanhash + "\"> Click here to validate your new account</a>"
                                            ses.sendEmail({
                                                    Source: from,
                                                    Destination: { ToAddresses: [req.body.userEmail, adminEmail] },
                                                    Message: {
                                                        Subject: {
                                                            Data: topName + ' New User' //TODO Get app name somehow
                                                        },
                                                        Body: {
                                                            Html: {
                                                                Data: htmlbody
                                                            }
                                                        }
                                                    }
                                                }
                                            , function(err, data) {
                                                if(err) throw err
                                                console.log('Email sent:');
                                                console.log(data);
                                                //res.redirect("http://elnoise.com/#/login");
                                            });
                                        }
                                    });
                            });
                        });
                    } else {
                        console.log("that email already exists or something went wrong");
                        res.send("emailtaken");
                    }
                });
            } else {
                console.log("that name is already taken or something went wrong");
                res.send("nametaken");
            }
        });
    }
});


app.get('/webplayer', function(req,res) {
    res.sendfile(__dirname + '/servicmedia.net/webplayer.html');
    console.log(req.session.auth);
});

app.get('backupdata', function (req, res) {


});


//db.audio_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {


app.get('/newaudiodata.json', checkAppID, requiredAuthentication,  function(req, res) {
    console.log('tryna return newaudiodata.json');
    db.audio_items.find({item_status: "public"}).sort({otimestamp: 1}).toArray( function(err,audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);
        } else {

            async.waterfall([

                    function(callback){ //randomize the returned array, takes a shake so async it...

                        audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                        audio_items.reverse();
                        callback(null);
                    },
                    function(callback) { //add the signed URLs to the obj array
                        for (var i = 0; i < audio_items.length; i++) {

                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            // var urlMp3 = knoxClient.signedUrl(audio_items[i]._id + "." + mp3Name, expiration);
                            // var urlOgg = knoxClient.signedUrl(audio_items[i]._id + "." + oggName, expiration);
                            // var urlPng = knoxClient.signedUrl(audio_items[i]._id + "." + pngName, expiration);
                            var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                            var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                            var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
                            audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                            audio_items[i].URLogg = urlOgg;
                            audio_items[i].URLpng = urlPng;

                        }
                        console.log('tryna send ' + audio_items.length + 'audio_items ');
                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_items);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });

});

app.get('/randomaudiodata.json', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return randomaudiodata.json');
    db.audio_items.find({item_status: "public"}, function(err,audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);
        } else {

            async.waterfall([

                    function(callback){ //randomize the returned array, takes a shake so async it...
                        audio_items = Shuffle(audio_items);
                        audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                        callback(null);
                    },

                    function(callback) { //add the signed URLs to the obj array
                        for (var i = 0; i < audio_items.length; i++) {

                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            //var urlMp3 = knoxClient.signedUrl(audio_items[i]._id + "." + mp3Name, expiration);
                            //var urlOgg = knoxClient.signedUrl(audio_items[i]._id + "." + oggName, expiration);
                            //var urlPng = knoxClient.signedUrl(audio_items[i]._id + "." + pngName, expiration);
                            var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                            var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                            var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
                            audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                            audio_items[i].URLogg = urlOgg;
                            audio_items[i].URLpng = urlPng;

                        }
                        console.log('tryna send ' + audio_items.length + 'audio_items ');
                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_items);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });

});

app.get('/playlist/:tag', function(req, res) {
    console.log('tryna return playlist: ' + req.params.tag);
    db.audio_items.find({tags: req.params.tag, item_status: "public"}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);

        } else {

            async.waterfall([

                    function(callback){ //randomize the returned array, takes a shake so async it...
                        //audio_items = Shuffle(audio_items);
                        //audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                        callback(null);
                    },

                    function(callback) { //add the signed URLs to the obj array
                        for (var i = 0; i < audio_items.length; i++) {

                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[0].userID + "/" + audio_items[0]._id + "." + mp3Name, Expires: 60000});
                            var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[0].userID + "/" + audio_items[0]._id + "." + oggName, Expires: 60000});
                            var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[0].userID + "/" + audio_items[0]._id + "." + pngName, Expires: 60000});
                            audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                            audio_items[i].URLogg = urlOgg;
                            audio_items[i].URLpng = urlPng;

                        }
                        console.log('tryna send ' + audio_items.length + 'audio_items ');
                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_items);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });

});

app.get('/audiofiles/:tag', function(req, res) {
    console.log('tryna return playlist: ' + req.params.tag);
    db.audio.find({tags: req.params.tag, item_status: "public"}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);

        } else {

            async.waterfall([

                    function(callback){ //randomize the returned array, takes a shake so async it...
                        //audio_items = Shuffle(audio_items);
                        //audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                        callback(null);
                    },

                    function(callback) { //add the signed URLs to the obj array
                        for (var i = 0; i < audio_items.length; i++) {

                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            var urlMp3 = knoxClient.signedUrl(audio_items[i]._id + "." + mp3Name, expiration);
                            var urlOgg = knoxClient.signedUrl(audio_items[i]._id + "." + oggName, expiration);
                            var urlPng = knoxClient.signedUrl(audio_items[i]._id + "." + pngName, expiration);
                            audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                            audio_items[i].URLogg = urlOgg;
                            audio_items[i].URLpng = urlPng;

                        }
                        console.log('tryna send ' + audio_items.length + 'audio_items ');
                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_items);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });

});

app.get('/audiolist/:tag', function(req, res) {
    console.log('tryna return playlist: ' + req.params.tag);
    db.audio_items.find({tags: req.params.tag, item_status: "public"}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);

        } else {

            res.json(audio_items);
            console.log("returning audio_items tagged " + req.params.tag);
        }
    });

});


app.post('/picarray/', checkAppID, requiredAuthentication, function(req,res) {

    console.log("picarray request: " + req.body);
    res.json(req.body);

});

// app.get('/userpics/:u_id', checkAppID, requiredAuthentication, function(req, res) {
app.get('/userpics/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return userpics for: ' + req.params.u_id);
    let query = {userID: req.params.u_id};
    if (!req.session.user.authLevel.includes("Domain")) {
        query = {};
    }
    db.image_items.find(query).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, picture_items) {

        if (err || !picture_items) {
            console.log("error getting picture items: " + err);
        } else {
            console.log("userpics for " + req.params.u_id);
            for (var i = 0; i < picture_items.length; i++) {
                var item_string_filename = JSON.stringify(picture_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 30);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                        console.log(baseName + "xxxxxxx");
                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                var halfName = 'half.' + baseName + item_string_filename_ext;
                var standardName = 'standard.' + baseName + item_string_filename_ext;
                //var pngName = baseName + '.png';
                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                picture_items[i].URLthumb = urlThumb; //jack in teh signed urls into the object array
                //console.log("picture item: " + urlThumb, picture_items[0]);

            }

            res.json(picture_items);
            console.log("returning picture_items for " + req.params.u_id);
        }
    });
});

app.get('/uservids/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return uservids for: ' + req.params.u_id);
    db.video_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, video_items) {

        if (err || !video_items) {
            console.log("error getting video items: " + err);

        } else {
            console.log("# " + video_items.length);
            for (var i = 0; i < video_items.length; i++) {

                var item_string_filename = JSON.stringify(video_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 30);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                //                        console.log(baseName + "xxxxxxx");
//                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                var halfName = 'half.' + baseName + item_string_filename_ext;
                var standardName = 'standard.' + baseName + item_string_filename_ext;

                //var pngName = baseName + '.png';

                var vidUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + video_items[i].userID + "/" + video_items[i]._id + "." + video_items[i].filename, Expires: 6000}); //just send back thumbnail urls for list
                //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                video_items[i].URLvid = vidUrl; //jack in teh signed urls into the object array
                //console.log("picture item: " + urlThumb, picture_items[0]);

            }

            res.json(video_items);
            console.log("returning video_items for " + req.params.u_id);
        }
    });
});


app.get('/usergroups/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usergroups for: ' + req.params.u_id);
    db.groups.find({userID: req.params.u_id}).sort({otimestamp: -1}).toArray( function(err, group_items) {
        if (err || !group_items) {
            console.log("error getting usergroups items: " + err);
        } else {
            res.json(group_items);
            console.log("returning usergroups for " + req.params.u_id);
        }
    });
});
app.post('/add_group_item/', requiredAuthentication, function (req, res) {
    console.log(JSON.stringify(req.body));
    var o_id = ObjectID(req.body.group_id);  //convert to BSON for searchie
    // console.log('groupID requested : ' + req.body.sourceID);
    db.groups.findOne({ "_id" : o_id}, function(err, group) {
        if (err || !group) {
            console.log("error getting group: " + err);
        } else {
            newGroupData = group.groupData;
            newItems = group.items;
            newItems.push(req.body.item_id);
            var timestamp = Math.round(Date.now() / 1000);
            // newGroupItem = {};
            // newGroupItem.itemID = req.body.item_id;
            // newGroupItem.itemIndex = newGroupData.length;
            // newGroupData.push(newGroupItem);
            db.groups.update( { "_id": o_id }, { $set: {
                    // groupdata : newGroupData,
                    lastUpdateTimestamp: timestamp,
                    items: newItems
                    }
                }, function (err, rezponse) {
                    if (err || !rezponse) {
                        console.log("error updateing group: " + err);
                        res.send(err);
                    } else {
                    console.log("group updated: " + req.body.group_id);
                    res.send("group updated");
                }
            });
        }
    });
});
app.post('/remove_group_item/', requiredAuthentication, function (req, res) {
    console.log(JSON.stringify(req.body));
    var o_id = ObjectID(req.body.group_id);  //convert to BSON for searchie
    // console.log('groupID requested : ' + req.body.sourceID);
    db.groups.findOne({ "_id" : o_id}, function(err, group) {
        if (err || !group) {
            console.log("error getting group: " + err);
        } else {
            var timestamp = Math.round(Date.now() / 1000);
            newGroupData = [];
            newItems = [];
            console.log("tryna update group" + JSON.stringify(group));
            async.waterfall([
                function(callback){ 
                    if (group.groupdata) {
                        let index = 0;
                        group.groupdata.forEach(function(content) {
                        console.log("groupdata " + content);
                        if (content.itemID == req.body.item_id) {
                            console.log("excluding on " + req.body.item_id);
                        } else {
                            index++;
                            content.itemIndex = index;
                            newGroupData.push(content);
                        }
                    });
                    callback(null);
                    } else {
                        callback(null);
                    }
                },
                function(callback){ 
                        group.items.forEach(function(content) {
                        console.log("item " + content);
                        if (content == req.body.item_id) {
                            console.log("matched onn " + req.body.item_id);
                        } else {
                            newItems.push(content);
                        }
                    });
                    callback(null);
                }
            ],
            function(err, result) { // #last function, close async
                console.log(JSON.stringify("group:" + newGroupData + " itme: " + newItems));
                db.groups.update( { "_id": o_id }, { $set: {
                    lastUpdateTimestamp: timestamp,
                    groupdata : newGroupData,
                    items: newItems
                    }
                }, function (err, rezponse){
                    if (err || !rezponse) {
                        console.log("error updateing group: " + err);
                        res.send(err);
                    } else {
                        console.log("group updated: " + req.body.group_id);
                        res.send("group updated");
                        }
                    });
                }
            );
        }
    });
});
app.post('/update_group/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log(req.params._id);
    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('group requested : ' + req.body._id);
    db.groups.findOne({ "_id" : o_id}, function(err, group) {
        if (err || !group) {
            console.log("error getting group: " + err);
        } else {
            console.log("tryna update group" + req.body._id);
            var timestamp = Math.round(Date.now() / 1000);
            db.groups.update( { "_id": o_id }, { $set: {
                lastUpdateTimestamp: timestamp,
                groupdata : req.body.groupdata,
                items: req.body.items,
                tags: req.body.tags,
                title: req.body.title,
                name: req.body.name
            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});
app.post('/updategroup/', requiredAuthentication, function (req, res) {
    console.log(req.body._id);
    var o_id = ObjectID(req.body._id);  //convert to BSON for searchie
    console.log('group requested : ' + req.body._id);
    db.groups.findOne({ "_id" : o_id}, function(err, group) {
        if (err || !group) {
            console.log("error getting group: " + err);

        } else {
            console.log("tryna update group" + req.body._id);
            var timestamp = Math.round(Date.now() / 1000);
            db.groups.update( { "_id": o_id }, { $set: {
                lastUpdateTimestamp: timestamp,
                tags: req.body.tags,
                name: req.body.name
            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});
app.get('/usergroup/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return user group : ' + req.params.p_id);
    var pID = req.params.p_id;
    var o_id = ObjectID(pID);

    db.groups.findOne({"_id": o_id}, function(err, group) {
        if (err || !group) {
            console.log("error getting group item: " + err);
        } else {
            if (group.items != null) {
                group.items = group.items.map(function (id) {
                    return ObjectID(id);
                });
                if (group.lastUpdate != null) {
                    group.lastUpdateTimestamp = group.lastUpdate;
                }
                if (group.type.toLowerCase() == "audio") {
                    console.log("tryna get some audio items: " + JSON.stringify(group.items));
                    db.audio_items.find({'_id': { $in: group.items}}).toArray(function (err, audio_items) {
                        if (err || !audio_items) {
                            console.log("error getting audio items: " + err);
                        } else {
                            var currentIndex = 0;
                            for (var i = 0; i < audio_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === audio_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        audio_items[i].itemIndex = obj.itemIndex;
                                    } else {
                                        audio_items[i].itemIndex = i;
                                    }
                                }
                                if (audio_items[i].clipDuration = {}) {
                                    audio_items[i].clipDuration = "";
                                }
                                var item_string_filename = JSON.stringify(audio_items[i].filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                console.log("tryna jack in " + baseName + " to a group of " + group.type);
                                var mp3Name = baseName + '.mp3';
                                var oggName = baseName + '.ogg';
                                var pngName = baseName + '.png';
                                var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                                var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                                var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});

                                audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                                audio_items[i].URLogg = urlOgg;
                                audio_items[i].URLpng = urlPng;
                                currentIndex++;
                            }
                            audio_items.sort(function(a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            audio_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.audio_items = audio_items;
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                } else if (group.type.toLowerCase() == "video") {
                    db.video_items.find({'_id': { $in: group.items}}).toArray(function (err, video_items) {
                        if (err || !video_items) {
                            console.log("error getting audio items: " + err);
                        } else {
                            for (var i = 0; i < video_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === video_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        video_items[i].itemIndex = obj.itemIndex;
                                        console.log(video_items[i].itemIndex + "index for " + video_items[i]._id.toString() );
                                    } else {
                                        video_items[i].itemIndex = i;
                                        console.log(video_items[i].itemIndex + "natchrul index for " + video_items[i]._id.toString() );
                                    }
                                }
                                var item_string_filename = JSON.stringify(video_items[i].filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                console.log("tryna jack in " + baseName + " to a group of " + group.type.toLowerCase());
                                var vidName = baseName + '.mp3';
                                var urlVid = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + video_items[i].userID + "/" + video_items[i]._id + "." + video_items[i].filename, Expires: 60000});
                                video_items[i].vUrl = urlVid; //jack in teh signed urls into the object array

                            }
                            video_items.sort(function(a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.video_items = video_items;
                        group.video_items.sort(function(a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                } else if (group.type.toLowerCase() == "picture") {
                    db.image_items.find({'_id': { $in: group.items}}).toArray(function (err, image_items) {
                        if (err || !image_items) {
                            console.log("error getting image items: " + err);
                        } else {
                            for (var i = 0; i < image_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === image_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        image_items[i].itemIndex = obj.itemIndex;
                                        console.log(image_items[i].itemIndex + "index for " + image_items[i]._id.toString() );
                                    } else {
                                        image_items[i].itemIndex = i;
                                        console.log(image_items[i].itemIndex + "natchrul index for " + image_items[i]._id.toString() );
                                    }
                                }
                                var item_string_filename = JSON.stringify(image_items[i].filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                //var expiration = new Date();
                                //expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                console.log(baseName);
                                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                                var halfName = 'half.' + baseName + item_string_filename_ext;
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + image_items[i].userID + "/" + image_items[i]._id + "." + thumbName, Expires: 6000});
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + image_items[i].userID + "/" + image_items[i]._id + "." + halfName, Expires: 6000});
                                image_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                                image_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array

                            }
                            image_items.sort(function(a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.image_items = image_items;
                        group.image_items.sort(function(a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });

            } else if (group.type.toLowerCase() == "location") {
                    console.log("tryna get locations");
                    db.locations.find({'_id': {$in: group.items}}).toArray(function (err, location_items) {
                        if (err || !location_items) {
                            console.log("error getting image items: " + err);
                        } else {
                            console.log("found locations : " + location_items.length);
                            for (var i = 0; i < location_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === location_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        location_items[i].itemIndex = obj.itemIndex;
                                        console.log(location_items[i].itemIndex + "index for " + location_items[i]._id.toString());
                                    } else {
                                        location_items[i].itemIndex = i;
                                        console.log(location_items[i].itemIndex + "natchrul index for " + location_items[i]._id.toString());
                                    }
                                }
                            }
                            location_items.sort(function (a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.locations = location_items;
                        group.locations.sort(function (a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                } else if (group.type.toLowerCase() == "people") {
                    console.log("tryna get people");
                    db.people.find({'_id': {$in: group.items}}).toArray(function (err, people) {
                        if (err || !people) {
                            console.log("error getting text items: " + err);
                            res.send("error getting text items: " + err);
                        } else {
                            console.log("found locations : " + people.length);
                            for (var i = 0; i < people.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === text_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        people[i].itemIndex = obj.itemIndex;
                                        console.log(people[i].itemIndex + "index for " + text_items[i]._id.toString());
                                    } else {
                                        people[i].itemIndex = i;
                                        console.log(people[i].itemIndex + "natchrul index for " + people[i]._id.toString());
                                    }
                                }
                            }
                            people.sort(function (a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.people = people;
                        group.people.sort(function (a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                } else if (group.type.toLowerCase() == "text") {
                    console.log("tryna get texts");
                    db.text_items.find({'_id': {$in: group.items}}).toArray(function (err, text_items) {
                        if (err || !text_items) {
                            console.log("error getting text items: " + err);
                            res.send("error getting text items: " + err);
                        } else {
                            console.log("found locations : " + text_items.length);
                            for (var i = 0; i < text_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === text_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        text_items[i].itemIndex = obj.itemIndex;
                                        console.log(text_items[i].itemIndex + "index for " + text_items[i]._id.toString());
                                    } else {
                                        text_items[i].itemIndex = i;
                                        console.log(text_items[i].itemIndex + "natchrul index for " + text_items[i]._id.toString());
                                    }
                                }
                            }
                            text_items.sort(function (a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.text_items = text_items;
                        group.text_items.sort(function (a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                } else if (group.type.toLowerCase() == "object" || group.type.toLowerCase() == "objects") {
                    console.log("tryna get objex");
                    db.obj_items.find({'_id': {$in: group.items}}).toArray(function (err, obj_items) {
                        if (err || !obj_items) {
                            console.log("error getting text items: " + err);
                            res.send("error getting text items: " + err);
                        } else {
                            console.log("found locations : " + obj_items.length);
                            for (var i = 0; i < obj_items.length; i++) {
                                if (group.groupdata) {
                                    var obj = group.groupdata.filter(function (obj) { //get index value from groupdata array
                                        return obj.itemID === obj_items[i]._id.toString();
                                    })[0];
                                    if (obj != undefined && obj.itemIndex) {
                                        obj_items[i].itemIndex = obj.itemIndex;
                                        console.log(obj_items[i].itemIndex + "index for " + obj_items[i]._id.toString());
                                    } else {
                                        obj_items[i].itemIndex = i;
                                        console.log(obj_items[i].itemIndex + "natchrul index for " + obj_items[i]._id.toString());
                                    }
                                }
                            }
                            obj_items.sort(function (a, b) {
                                return a.itemIndex - b.itemIndex;
                            });
                        }
//                            video_items.sort(function(a, b) {
//                                return a.itemIndex - b.itemIndex;
//                            });
                        group.obj_items = obj_items;
                        group.obj_items.sort(function (a, b) {
                            return a.itemIndex - b.itemIndex;
                        });
                        res.json(group);
                        console.log("returning group_item : " + group);
                    });
                }
        } else {
                res.json(group);
            }
        }
    });
});

app.get('/useraudio/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return useraudio for: ' + req.params.u_id);
    db.audio_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {

        if (err || !audio_items) {
            console.log("error getting picture items: " + err);

        } else {
            console.log("# " + audio_items.length);
            for (var i = 0; i < audio_items.length; i++) {

                var item_string_filename = JSON.stringify(audio_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 30);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                //console.log(baseName);
                var mp3Name = baseName + '.mp3';
                var oggName = baseName + '.ogg';
                var pngName = baseName + '.png';
                var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
                audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                audio_items[i].URLogg = urlOgg;
                audio_items[i].URLpng = urlPng;

            }
            res.json(audio_items);
//                console.log("returning audio_items for " + req.params.u_id);
        }
    });
});

app.get('/userobjs/:u_id', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return userobjs for: ' + req.params.u_id);
    db.obj_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, obj_items) {

        if (err || !obj_items) {
            console.log("error getting obj items: " + err);

        } else {
            console.log("# of userobjs " + obj_items.length);

            res.json(obj_items);
            console.log("returning obj_items for " + req.params.u_id);
        }
    });
});

app.get('/allobjs/:u_id', requiredAuthentication, domainadmin, function(req, res) { //TODO make one route,check auth status
    console.log('tryna return userobjs for: ' + req.params.u_id);
    db.obj_items.find({}, function(err, obj_items) {

        if (err || !obj_items) {
            console.log("error getting obj items: " + err);

        } else {
            console.log("returning userobjs " + obj_items.length);

            res.json(obj_items);
            // console.log("returning obj_items for " + req.params.u_id);
        }
    });
});


app.get('/sceneobjs/:g_id', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return userobjs for: ' + req.params.u_id);
    db.obj_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, obj_items) {

        if (err || !obj_items) {
            console.log("error getting obj items: " + err);

        } else {
            console.log("# of userobjs " + obj_items.length);

            res.json(obj_items);
            console.log("returning obj_items for " + req.params.u_id);
        }
    });
});

//admin method
//app.get('/sceneobjs_fixer', function(req, res) {
//    console.log('tryna return userobjs for: ' + req.params.u_id);
//    db.obj_items.find({ },  function(err, obj_items) {
//
//        if (err || !obj_items) {
//            console.log("error getting obj items: " + err);
//
//        } else {
//            console.log("# of userobjs " + obj_items.length);
//
////            res.json(obj_items);
//            for (var i = 0; i < obj_items.length; i++) {
//                console.log("returning obj_item :" + obj_items[i]._id);
////                var o_id = ObjectID(obj_items[i]._id);
//                db.obj_items.update( { "_id": obj_items[i]._id }, { $set: {
//
//                    snapToGround: "false",
//                    randomRotation: "false"
//                }});
//            }
//        }
//    });
//});
app.post('/newperson', checkAppID, requiredAuthentication, function (req, res) {

    var person = req.body;
    person.userID = req.session.user._id.toString();
    person.dateCreated = Date.now();
    // if (!textitem.desc) {
    //     textitem.desc = textitem.textstring.substr(0,20) + "...";
    // }
    console.log("fixing to save new person " + JSON.stringify(person));
    db.people.save(person, function (err, saved) {
        if ( err || !saved ) {
            console.log('person not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new person created, id: ' + item_id);
            res.send(item_id);
        }
    });
});

app.post('/delete_person/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete person: " + req.params._id);
    var o_id = ObjectID(req.params._id);
    db.people.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});

app.post('/update_person', checkAppID, requiredAuthentication, function (req, res) {
//        var textitem = req.body;
    var o_id = ObjectID(req.body._id);
//        textitem.userID = req.session.user._id.toString();
    db.people.update( { "_id": o_id }, { $set: {

        tags: req.body.tags,
        fullname: req.body.fullname,
        nickname: req.body.nickname,
        email: req.body.email,
        lastUpdate : Date.now()
    }});
    res.send("updated " + Date.now());
});


app.get('/people/:u_id', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return people for: ' + req.params.u_id);
    db.people.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, people) {
        if (err || !people) {
            console.log("error getting people : " + err);
        } else {
            res.json(people);
            console.log("returning people for " + req.params.u_id);
        }
    });
});

app.get('/person/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usertexts for: ' + req.params.p_id);
    var o_id = ObjectID(req.params.p_id);
    db.people.findOne({_id: o_id}, function(err, person) {
        if (err || !person) {
            console.log("error getting text_items : " + err);
        } else {
            db.invitations.find({sentToPersonID: person._id.toString()}, function (err, invitations) {
                if (err || !invitations) {
                    res.json(person);
                } else {
                    person.invitations = invitations;
                    res.json(person);
                }
            });
        }
    });
});
// app.get('/delete_invitations', function (req, res) {
//     db.invitations.remove({});
//     console.log("all invitations have been removed");
// });
// app.get('/delete_scores', function (req, res) {
//     db.scores.remove({});
//     console.log("all scores have been removed");
// });
app.post('/newtext', requiredAuthentication, function (req, res) {

    var textitem = req.body;
    textitem.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    textitem.otimestamp = timestamp;
    textitem.createdByUserID = req.session.user._id;
    textitem.createdByUserName =  req.session.user.userName;
    
    db.text_items.save(textitem, function (err, saved) {
        if ( err || !saved ) {
            console.log('text not saved..');
            res.send("text not saved " + err);
        } else {
            var item_id = saved._id.toString();
            console.log('new group created, id: ' + item_id);
            res.send("created: " + item_id);
        }
    });
});

app.post('/delete_text/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete text itme: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.text_items.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});

app.post('/updatetext/:_id', requiredAuthentication, function (req, res) {
//        var textitem = req.body;
    console.log("req.body update text:" + JSON.stringify(req.body));
    var o_id = ObjectID(req.body._id);
//        textitem.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    db.text_items.update( { "_id": o_id }, { $set: {
        
        tags: req.body.tags,
        title: req.body.title,
        type: req.body.type,
        desc: req.body.desc,  //  ? req.body.desc : req.body.textstring.substr(0,20) + "...",
        mode: req.body.mode,
        font: req.body.font,
        author: req.body.author,
        source: req.body.source,
        sourceURL: req.body.sourceURL,
        year: req.body.year,
        fontSize: req.body.fontSize,
        alignment: req.body.alignment != null ? req.body.alignment : "left" ,
        textBackground: req.body.textBackground,
        textBackgroundColor: req.body.textBackgroundColor,
        fillColor: req.body.fillColor,
        outlineColor: req.body.outlineColor,
        glowColor: req.body.glowColor,
        textstring: req.body.textstring,
        rotateToPlayer : req.body.rotateToPlayer != null ? req.body.rotateToPlayer : false,
        scaleByDistance : req.body.scaleByDistance != null ? req.body.scaleByDistance : false,
        useThreeDeeText : req.body.useThreeDeeText != null ? req.body.useThreeDeeText : false,
        lastUpdateTimestamp: timestamp,
        lastUpdateUserID: req.session.user._id,
        lastUpdateUserName: req.session.user.userName
    }});
    res.send("updated " + new Date());
});


app.get('/usertexts/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usertexts for: ' + req.params.u_id);
    if (!req.session.user.authLevel.includes("admin")) {
        db.text_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, text_items) {
            if (err || !text_items) {
                console.log("error getting text_items : " + err);
            } else {
                res.json(text_items);
                console.log("returning text items for " + req.params.u_id);
            }
        });
    } else {
        db.text_items.find({}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, text_items) {
            if (err || !text_items) {
                console.log("error getting text_items : " + err);
            } else {
                res.json(text_items);
                console.log("returning text items for " + req.params.u_id);
            }
        });
    }
});

app.get('/usertext/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return usertexts for: ' + req.params.p_id);
    var o_id = ObjectID(req.params.p_id);
    db.text_items.findOne({_id: o_id}, function(err, text_item) {
        if (err || !text_item) {
            console.log("error getting text_items : " + err);
        } else {

            res.json(text_item);
            console.log("returning text items for " + req.params.u_id);
        }
    });
});

app.get('/userpics',  requiredAuthentication, function(req, res) {
    console.log('tryna return userpics for: ' + req.body.userID);
    db.image_items.find({userID: req.params.u_id}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, picture_items) {
        if (err || !picture_items) {
            console.log("error getting picture items: " + err);
        } else {
            for (var i = 0; i < picture_items.length; i++) {
                var item_string_filename = JSON.stringify(picture_items[i].filename);
                item_string_filename = item_string_filename.replace(/\"/g, "");
                var item_string_filename_ext = getExtension(item_string_filename);
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 30);
                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                console.log(baseName);
                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                var halfName = 'half.' + baseName + item_string_filename_ext;
                var standardName = 'standard.' + baseName + item_string_filename_ext;
                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                picture_items[i].URLthumb = urlThumb; //jack in teh signed urls into the object array

            }

            res.json(picture_items);
            console.log("returning picture_items for " + req.userID);
        }
    });
});

// app.get('/userpic/:p_id', checkAppID, requiredAuthentication, function(req, res) {
app.get('/userpic/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return userpic : ' + req.params.p_id);
    var pID = req.params.p_id;
    var o_id = ObjectID(pID);
    db.image_items.findOne({"_id": o_id}, function(err, picture_item) {
        if (err || !picture_item) {
            console.log("error getting picture items: " + err);
        } else {
            var item_string_filename = JSON.stringify(picture_item.filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 30);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);
            var thumbName = 'thumb.' + baseName + item_string_filename_ext;
            var halfName = 'half.' + baseName + item_string_filename_ext;
            var standardName = 'standard.' + baseName + item_string_filename_ext;
            var originalName = 'original.' + baseName + item_string_filename_ext;
            console.log("original name : " + originalName);
            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
            var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + standardName, Expires: 6000}); //just send back thumbnail urls for list
            var urlOriginal = "";
            //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);

            var params = {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + originalName};
            s3.headObject(params, function(err, data) { //some old pix aren't saved with .original. in filename, check for that
                if (err) {
                    console.log("dinna find that pic");
                    originalName = baseName + item_string_filename_ext;
                    urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + originalName, Expires: 6000}); //just send back thumbnail urls for list
                    picture_item.URLthumb = urlThumb; //jack in teh signed urls into the object array
                    picture_item.URLhalf = urlHalf;
                    picture_item.URLstandard = urlStandard;
                    picture_item.URLoriginal = urlOriginal;
                    console.log("urlOriginal " + urlOriginal);
                    res.json(picture_item);
                    console.log("returning picture_item for " + picture_item);
                } else {
                    console.log("found that orig pic");
                    urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + originalName, Expires: 6000}); //just send back thumbnail urls for list
                    picture_item.URLthumb = urlThumb; //jack in teh signed urls into the object array
                    picture_item.URLhalf = urlHalf;
                    picture_item.URLstandard = urlStandard;
                    picture_item.URLoriginal = urlOriginal;
                    console.log("urlOriginal " + urlOriginal);
                    res.json(picture_item);
                    console.log("returning picture_item for " + picture_item);
                }
            });
        }
    });
});


app.get('/uservid/:p_id', requiredAuthentication, function(req, res) {
    console.log('tryna return uservid : ' + req.params.p_id);
    var pID = req.params.p_id;
    var o_id = ObjectID(pID);
    db.video_items.findOne({"_id": o_id}, function(err, video_item) {
        if (err || !video_item) {
            console.log("error getting video items: " + err);
        } else {
            var item_string_filename = JSON.stringify(video_item.filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 30);
            var vidUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + video_item.userID + "/" + video_item._id + "." + video_item.filename, Expires: 6000}); //just send back thumbnail urls for list
            //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
            video_item.URLvid = vidUrl; //jack in teh signed urls into the object array
            res.json(video_item);
            console.log("returning video_item : " + video_item);
        }
    });
});

app.get('/userobj/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return userobj : ' + req.params.p_id);
    var pID = req.params.p_id;
    var o_id = ObjectID(pID);
    var childObjects = {};
    db.obj_items.findOne({"_id": o_id}, function(err, obj_item) {
        if (err || !obj_item) {
            console.log("error getting picture items: " + err);

        } else {
            if (obj_item.objectPictureIDs != null && obj_item.objectPictureIDs != undefined && obj_item.objectPictureIDs.length > 0) {
                // oids = domain.domainPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                const oids = obj_item.objectPictureIDs.map(item => {
                    return ObjectID(item);
                })
                db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        res.send("error: " + err);
                    } else {
                        objectPictures = [];
                        pic_items.forEach(function(picture_item){                
                            var imageItem = {};
                            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                            var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                            imageItem.urlThumb = urlThumb;
                            imageItem.urlHalf = urlHalf;
                            imageItem.urlStandard = urlStandard;
                            imageItem._id = picture_item._id;
                            imageItem.filename = picture_item.filename;
                            objectPictures.push(imageItem);
                            obj_item.objectPictures = objectPictures;
                        });
                        res.json(obj_item);
                    }
                });
            } else {
                 res.json(obj_item);
            }
            // if (obj_item.childObjectIDs != null && obj_item.childObjectIDs.length > 0) {
            //     //console.log("tryna find childObjectIDs: " + JSON.stringify(obj_item.childObjectIDs));
            //     var childIDs = obj_item.childObjectIDs.map(convertStringToObjectID); //convert child IDs array to objIDs
            //     db.obj_items.find({_id : {$in : childIDs}}, function(err, obj_items) {
            //         if (err || !obj_items) {
            //             console.log("error getting childObject items: " + err);
            //             res.send("error getting child objects");
            //         } else {
            //             childObjects = obj_items;
            //             console.log("childObjects: " + JSON.stringify(childObjects));
            //             obj_item.childObjects = childObjects;
            //             res.json(obj_item);
            //             console.log("returning obj_item with childObjects");
            //         }
            //     });

            // } else {
            //     res.json(obj_item);
            //     console.log("returning obj_item");
            // }
        }
    });
});



app.get('/useraudio/:username', function(req, res) {
    console.log('tryna return audiolist: ' + req.params.tag);
    db.audio_items.find({username: req.params.username}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);
        } else {
            res.json(audio_items);
//                console.log("returning audio_items for " + req.params.userName);
        }
    });
});

app.get('/audiodata.json', checkAppID, requiredAuthentication, function (req, res) {
//	app.get("/audiodata.json", auth, function (req, res) {
    db.audio_items.find({}, function(err,audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);
            //es.end(err);
        } else { //don't add urls for this one...

            console.log('tryna send audio_items...');
            res.json(audio_items);

        }
    });
});

app.get('/item_sc/:sid', function (req, res) {

    var shortID = req.params.sid;
    db.audio_items.find({ "short_id" : shortID}, function(err, audio_item) {
        if (err || !audio_item) {
            console.log("error getting audio items: " + err);
        } else {
            var item_string_filename = JSON.stringify(audio_item[0].filename);
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var expiration = new Date();
            expiration.setMinutes(expiration.getMinutes() + 3);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);
            var mp3Name = baseName + '.mp3';
            var oggName = baseName + '.ogg';
            var pngName = baseName + '.png';
            //var urlMp3 = knoxClient.signedUrl(audio_item[0]._id + "." + mp3Name, expiration);
            //var urlOgg = knoxClient.signedUrl(audio_item[0]._id + "." + oggName, expiration);
            //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);

            var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item[0].userID + "/" + audio_item[0]._id + "." + mp3Name, Expires: 6000});
            var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item[0].userID + "/" + audio_item[0]._id + "." + oggName, Expires: 6000});
            var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item[0].userID + "/" + audio_item[0]._id + "." + pngName, Expires: 6000});
            audio_item[0].URLmp3 = urlMp3; //jack in teh signed urls into the object array
            audio_item[0].URLogg = urlOgg;
            audio_item[0].URLpng = urlPng;
            res.json(audio_item);
        }
    });
});


app.get('/audio/:id', requiredAuthentication, function (req, res){ //TODO Authenticate below if Public/Private bool for this media item

    var audioID = req.params.id;
    var o_id = ObjectID(audioID);  //convert to BSON for searchie
    console.log('audioID requested : ' + audioID);
    db.audio_items.findOne({ "_id" : o_id}, function(err, audio_item) {
        if (err || !audio_item) {
            console.log("error getting audio items: " + err);
        } else {
            async.waterfall([

                    function(callback){   //jack in a single text item if present, for convenience
                        if (audio_item.textitemID != "") {
                            var t_id = ObjectID(audio_item.textitemID);
                            db.text_items.findOne({"_id" : t_id}, function (err, text_item) {
                                if (err || !text_item) {
                                    console.log("no text for audio item");
                                    callback(null, "error");
                                } else {
                                    console.log(text_item);
                                    if (text_item.textstring != "") {

                                    callback(null, text_item.textstring);

                                    console.log("text_item.textstring: " + text_item.textstring);
                                    } else {
                                        callback(null, "");
                                    }
                                }
                            });

                        } else {
                            callback(null, "");
                        }

                    },

                    function(text_string, callback) { //add the signed URLs to the obj array
                        var item_string_filename = JSON.stringify(audio_item.filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 3);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        console.log(baseName);
                        var mp3Name = baseName + '.mp3';
                        var oggName = baseName + '.ogg';
                        var pngName = baseName + '.png';
                        var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, Expires: 6000});
                        var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + oggName, Expires: 6000});
                        var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + pngName, Expires: 6000});
                        audio_item.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                        audio_item.URLogg = urlOgg;
                        audio_item.URLpng = urlPng;
                        audio_item.textString = text_string;

                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_item);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });
});

app.post('/gen_short_code', checkAppID, requiredAuthentication, function (req, res) {
    console.log(req.params);
    var audioID = req.params.id;
    var o_id = ObjectID(audioID);  //convert to BSON for searchie
    console.log('audioID requested : ' + audioID);
    db.audio_items.find({ "_id" : o_id}, function(err, audio_item) {
        if (err || !audio_item && audio_item.short_id == null) {
            console.log("error getting audio items: " + err);
        } else {
            console.log("tryna update " + req.params.id + " to status " + req.params.item_status);
            db.audio_items.update( { _id: o_id }, { $set: { item_status: req.params.item_status }});
        }
    });
});

app.post('/update/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log(req.params._id);

    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('audioID requested : ' + req.body._id);
    db.audio_items.find({ "_id" : o_id}, function(err, audio_item) {
        if (err || !audio_item) {
            console.log("error getting audio items: " + err);
        } else {
            console.log("tryna update " + req.body._id + " to status " + req.body.item_status);
            db.audio_items.update( { _id: o_id }, { $set: {
                item_status: req.body.item_status,
                tags: req.body.tags,
                alt_title: req.body.alt_title,
                alt_artist: req.body.alt_artist,
                alt_album: req.body.alt_album
            }});
        }
    });
});

app.get('/itemkeys/:_id', function (req, res) { //return keys for specific item id

    console.log(req.params._id);
    var o_id = ObjectID(req.params._id);
    db.audio_item_keys.find({ "keyAudioItemID" : req.params._id}, function(err, itemKeys) {
        if (err || !itemKeys) {
            console.log("cain't get no itemKeys... " + err);
        } else {

            for (var i = 0; i < itemKeys.length; i++) {

                if (itemKeys[i].keyType == 2) {
                    var item_string_filename = JSON.stringify(itemKeys[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 30);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    console.log(baseName);
                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var standardName = 'standard.' + baseName + item_string_filename_ext;

                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + itemKeys[i].userID + "/" + itemKeys[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + itemKeys[i].userID + "/" + itemKeys[i]._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + itemKeys[i].userID + "/" + itemKeys[i]._id + "." + standardName, Expires: 6000}); //just send back thumbnail urls for list

                    itemKeys[i].URLthumb = urlThumb; //jack in teh signed urls into the object array
                    itemKeys[i].URLhalf = urlHalf;
                    itemKeys[i].URLstandard = urlStandard;

                }
            }
            console.log(JSON.stringify(itemKeys));
            res.json(itemKeys);
        }
    });
});

app.post('/savedaudioitems', function (req, res) { //return audio items, referenced by keys in above method (when saved playlist selected)
    console.log("tryna savekeys");
    if (req.session.auth != "noauth") {
        console.log(req.body);
        var jObj = JSON.parse(req.body.json);
        //console.log(jObj[0]);
        var audioIDs = new Array();
        jObj.audioItemIDs.forEach(function(item, index) {
            var a_id = ObjectID(item); //convert to binary to search by _id beloiw
            audioIDs.push(a_id); //populate array that can be fed to mongo find below
        });
        console.log("first audioID: " + audioIDs[0]);

        //db.audio_items.find({_id: { $in: audioIDs[0] } }, function(err,audio_items) {
        db.audio_items.find({_id: { $in: audioIDs } }, function(err,audio_items) {
            if (err || !audio_items) {
                console.log("error getting audio items: " + err);
            } else {
                console.log(JSON.stringify(audio_items));
                //res.json(audio_items);
                async.waterfall([

                        function(callback){ //randomize the returned array, takes a shake so async it...
                            audio_items = Shuffle(audio_items);
                            audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                            callback(null);
                        },

                        function(callback) { //add the signed URLs to the obj array
                            for (var i = 0; i < audio_items.length; i++) {
                                var item_string_filename = JSON.stringify(audio_items[i].filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 1000);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                console.log(baseName);
                                var mp3Name = baseName + '.mp3';
                                var oggName = baseName + '.ogg';
                                var pngName = baseName + '.png';
                                var urlMp3 = knoxClient.signedUrl(audio_items[i]._id + "." + mp3Name, expiration);
                                var urlOgg = knoxClient.signedUrl(audio_items[i]._id + "." + oggName, expiration);
                                var urlPng = knoxClient.signedUrl(audio_items[i]._id + "." + pngName, expiration);
                                audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                                audio_items[i].URLogg = urlOgg;
                                audio_items[i].URLpng = urlPng;
                            }
                            console.log('tryna send ' + audio_items.length + 'audio_items ');
                            callback(null);
                        }],

                    function(err, result) { // #last function, close async
                        res.json(audio_items);
                        console.log("waterfall done: " + result);
                    }
                );

            }
        });
    }
});


app.post('/savekeysall', checkAppID, requiredAuthentication, function (req, res) { //save item keys set oon client

    console.log("tryna savekeys");
    if (req.session.auth != "noauth") {
        //console.log(req.session.auth);
        console.log(req.body);
        //var jObj = JSON.parse(req.body.json);
        //var itemKeys =  JSON.parse(keysJson.itemKeys);
        console.log("itemKeys: " + JSON.stringify(jObj.itemKeys));
        //var saveKeysFunction =
        //res.json(JSON.stringify(jObj));
        // for (var i = 0; i < itemKeys.length; i++) {
        //  	jObj.itemKeys.forEach(function(item, index) {
        console.log(JSON.stringify(item.keyString));
//		});
//	/*
//		var saveKeyFunction = function (itemKey, callback) {

        db.audio_item_keys.save(
            req.body.json,
            function (err, saved) {
                if (err || !saved) {
                } else {
                    var key_id = saved._id.toString();
                    console.log('new key id: ' + key_id);
                    //              	callback();
                    res.send(key_id)
                }
            });

    }
    /*
     async.forEach(Object.keys(jObj),saveKeyFunction,function(err){
     console.log("async #");
     }, function(err) {console.log("DONE SAVING KEYS");});
     */
});

app.post('/savekeys', checkAppID, requiredAuthentication, function (req, res) { //save item keys set oon client

    console.log("tryna savekeys");
    if (req.session.auth != "noauth") {
        //console.log(req.session.auth);
        console.log(req.body);
        var jObj = JSON.parse(req.body.json);
        console.log("itemKeys: " + JSON.stringify(jObj.itemKeys));

        jObj.itemKeys.forEach(function(item, index) {
            console.log(JSON.stringify(item.keyString));

            db.audio_item_keys.save(
                {keyType : item.keyType,
                    keyUserID : item.keyUserID,
                    keyAudioItemID : item.keyAudioItemID,
                    keyContentID : item.keyContentID,
                    keyTime : item.keyTime,
                    keySample : item.keySample,
                    keyString : item.keyString},
                function (err, saved) {
                    if (err || !saved) {
                    } else {
                        var key_id = saved._id.toString();
                        console.log('new key id: ' + key_id);
                        //                callback();
                        res.send(key_id)
                    }
                });
        });
    }

});

app.post('/savekey', checkAppID, requiredAuthentication, function (req, res) {

    //if (req.session.auth != "noauth") { //maybe check if uid is valid?
    var jObj = JSON.parse(req.body.json);

    db.audio_item_keys.save(
        {keyType : jObj.keyType,
            keyUserID : jObj.keyUserID,
            keyAudioItemID : jObj.keyAudioItemID,
            keyContentID : jObj.keyContentID,
            keyTime : jObj.keyTime,
            keySample : jObj.keySample,
            keyString : jObj.keyString},
        function (err, saved) {
            if (err || !saved) {
            } else {
                var key_id = saved._id.toString();
                console.log('new key id: ' + key_id);
                //                callback();
                res.send(key_id)
            }
        });
});
/*
 db.audio_item_keys.save(
 {user_id : "1",
 audio_item_id : req.body.audio_item_id,
 key_time : req.body.key_time,
 key_string : req.body.key_string},
 function (err, saved) {
 if (err || !saved) {
 } else {
 var key_id = saved._id.toString();
 console.log('new key id: ' + key_id);
 }
 });
 */

app.post('/delete_key', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete key: " + req.body.keyID);
    var o_id = ObjectID(req.body.keyID);
    db.audio_item_keys.remove( { "_id" : o_id }, 1 );
    res.send("deleted");

});

app.post('/update_key', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete key: " + req.body.keyID);
    var o_id = ObjectID(req.body.keyID);
    //db.audio_item_keys.remove( { "_id" : o_id }, 1 );
    //                              res.send("deleted");

    db.audio_item_keys.update( { _id: o_id }, { $set: { keyString: req.body.keyText,
        keySample: parseInt(req.body.keySample),
        keyTime: parseFloat(req.body.keyTime)
        }
    }, function (err, rezponse) {
        if (err || !rezponse) {
            console.log("error updating item key: " + err);
            res.send(err);
        } else {
            console.log("item key updated: " + req.body.keyID);
            res.send("item key updated");
        }
    });
});
///////////////
app.get('/pathinfo',  checkAppID, requiredAuthentication, function (req, res) { //get default path info

    console.log(req.params._id);
    var o_id = ObjectID(req.params._id);
    db.paths.find({}, function(err, paths) {
        if (err || !paths) {
            console.log("cain't get no paths... " + err);
        } else {
            console.log(JSON.stringify(paths));
            res.json(paths);
        }
    });
});

app.get('/upaths/:_id',  checkAppID, requiredAuthentication, function (req, res) { //get default path info

    console.log("tryna get userpaths: ",req.params._id);
    var o_id = ObjectID(req.params._id);
    db.paths.find({ "user_id" : req.params._id}, function(err, paths) {
        if (err || !paths) {
            console.log("cain't get no paths... " + err);
        } else {
            console.log(JSON.stringify(paths));
            res.json(paths);
        }
    });
});

app.get('/upath/:u_id/:p_id',  checkAppID, requiredAuthentication, function (req, res) { //get default path info

    console.log("tryna get path: ", req.params.p_id);
    var _id = ObjectID(req.params.p_id);
    db.paths.find({ _id : _id}, function(err, paths) {
        if (err || !paths) {
            console.log("cain't get no paths... " + err);
        } else {
            console.log(JSON.stringify(paths));
            res.send(paths);
        }
    });
});

// !!!DANGER!!!
// app.get('/scoresremove/:appid',  function (req, res) { //get default path info
//    console.log("nuke all score data for this application!: ", req.params.appid);
// //    var _id = ObjectID(req.params.p_id);
//    db.scores.remove({appID : req.params.appid}, function (err, saved) {
//        if (err || !saved) {
//            console.log('nuke fail');
//            res.send("nuke fail");
//        } else {
//            console.log('nuked');
//            res.send("nuked");
//        }
//    });
// });

app.post('/score', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post scores");

    scorePost = req.body;
    scorePost.scoreInt = parseInt(req.body.scoreInt);
    // scorePost.scoreMode = parseInt(req.body.scoreMode);
    scorePost.requesterHost = req.headers.host;
    scorePost.remoteAddress = req.connection.remoteAddress;
    scorePost.scoreTimestamp = parseInt(req.body.scoreTimestamp);
    console.log("tryna post score: " + JSON.stringify(scorePost));
    db.scores.save(scorePost, function (err, saved) {
        if ( err || !saved ) {
            console.log('score not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new score id: ' + item_id);
            res.send(item_id);
        }
    });
});
app.get('/scores/:appid/:sceneID/:scoreMode', function (req, res) { //tight

    let appid = req.params.appid.toString().replace(":", "");
    let sceneID = req.params.sceneID;
    let scoreMode = req.params.scoreMode;
    let html = "\n";
    let scores = {};
    let scoresResponse = {};

    db.scores.find({ $or: [ { appID : appid, sceneID : sceneID, scoreMode: scoreMode }, { appID : appid, altSceneID : sceneID, scoreMode: scoreMode } ] }, function (err, scores) {
        if (err || !scores) {
            res.send("error or no scores found " + err );
        } else {
            let culledScores = [];
            scores.forEach(function(score){ //cull all but highest score for each user
                if (culledScores.length > 0) {
                    const index = culledScores.map(e => e.platformUserID).indexOf(score.platformUserID);
                    if (index == -1){
                        culledScores.push(score);
                    } else {
                        if (culledScores[index].scoreInt < score.scoreInt) {
                            culledScores[index] = score;
                        } 
                    }
                } else {
                    culledScores.push(score);
                }
            });
            scoresResponse.scores = culledScores;
            res.send(scoresResponse);
        }
    });
});

app.get('/totalscores_aka/:appid', function (req, res) { //does not use userID, but the "aka" name from "guest" players

    var appid = req.params.appid.toString().replace(":", "");

    // console.log("tryna get total user scores for app: " + appid);

    var scoresResponse = {};
    var appScores = {};
    if (appid != undefined && appid != "") {
    async.waterfall([

            function (callback) { //get all scores for this app
                db.scores.find({appID : appid}, function(err, scores) {
                    if (err || !scores) {
                        console.log("cain't get no scores... " + err);
                        callback(err);
                    } else {

                        appScores = scores;
                        // console.log("scores: " + JSON.stringify(appScores));
                        callback(null, scores);
                    }

                });
            }, //pull unique userIDs
            function (userScores, callback) {
                var items = userScores;
                var uids = [];
                var lookup = {};
                for (var item, i = 0; item = items[i++];) {
                    var uid = item.aka; //use the "aka" username
                    if (!(uid in lookup)) {
                        lookup[uid] = 1;
                        uids.push(uid);
                    }
                }
                // console.log(JSON.stringify(uids));
                callback(null, userScores, uids);
            }, //loop through again to aggregate scores for each user
            function (scores, uids, callback) { //aggregate
                var totalscores = [];
                async.each (uids, function (uid, callbackz) {
                    var uscores = {};
                    var scoretemp = 0;
                    for (var entry in appScores) {
                        if (uid == appScores[entry].aka) {
                            scoretemp = scoretemp + parseInt(appScores[entry].scoreInt);
                        }
                    }
                    uscores.scoreName = uid;
                    uscores.scoreTotal = scoretemp;
                    totalscores.push(uscores);

                    callbackz();
                }, function(err) {
                   
                    if (err) {
                        console.log('A file failed to process');
                        callbackz(err);
                    } else {
                        console.log('All files have been processed successfully');
                        callback(null, totalscores);
                    }
                });
            }, function (totalscores, callback) { //sort descending by scoreTotal
                totalscores.sort((a, b) => (a.scoreTotal < b.scoreTotal) ? 1 : -1);
                callback(null, totalscores);
            }, function (totalscores, callback) { //inject rank
                // console.log("tryna rank totalscores " + JSON.stringify(totalscores));
                for (var i = 0; i < totalscores.length; i++) {
                    totalscores[i].rank = i + 1;
                }
                callback(null, totalscores);
            }
        ], //end of async.waterfall
        function (err, result) { // #last function, close async
            scoresResponse.totalscores = result;
            res.json(scoresResponse);
            console.log("totalscore waterfall done");
        })
    } else {
        console.log("appid undefined or empty");
        res.send("no app id!");
    } 
});

app.get('/totalscores/:appid', function (req, res) {

    var appid = req.params.appid.toString().replace(":", "");

    console.log("tryna get total user scores for app: " + appid);

    var scoresResponse = {};
    var appScores = {};

    async.waterfall([

            function (callback) { //get all scores for this app
                db.scores.find({appID : appid}, function(err, scores) {
                    if (err || !scores) {
                        console.log("cain't get no scores... " + err);
                        callback(err);
                    } else {

                        appScores = scores;
                        // console.log("scores: " + JSON.stringify(appScores));
                        callback(null, scores);
                    }

                });
            }, //pull unique userIDs
            function (userScores, callback) {
                var items = userScores;
                var uids = [];
                var lookup = {};
                for (var item, i = 0; item = items[i++];) {
                    var uid = item.userID;
                    if (!(uid in lookup)) {
                        lookup[uid] = 1;
                        uids.push(uid);
                    }
                }
                console.log(JSON.stringify(uids));
                callback(null, userScores, uids);
            }, //loop through again to aggregate scores for each user
            function (scores, uids, callback) {
                var totalscores = [];
                async.each (uids, function (uid, callbackz) {
                    var uscores = {};
                    var scoretemp = 0;
                    for (var entry in appScores) {
                        if (uid == appScores[entry].userID) {
                            scoretemp = scoretemp + parseInt(appScores[entry].score);
                        }
                    }
                    uscores.user = uid;
                    uscores.scoreTotal = scoretemp;
                    totalscores.push(uscores);
                    callbackz();
                }, function(err) {
                   
                    if (err) {
                        console.log('A file failed to process');
                        callbackz(err);
                    } else {
                        console.log('All scores have been processed successfully');
                        scoresResponse.topscores = topscores;
                        callback(null);
                    }
                });
            }

        ], //end of async.waterfall
        function (err, result) { // #last function, close async
            res.json(scoresResponse);
            console.log("waterfall done: " + result);
        })
});
// app.get()

app.get('/topscores/:appid', function (req, res) { //whynotmakeitpublic

    console.log("tryna get scores for: " + req.params.appid);
    //var _id = ObjectID(req.params.u_id);
    var appid = req.params.appid.toString().replace(":", "");
    // console.log("tryna get scores for: " + appid);
    // db.scores.find({appID : appid}, { userName: 1, scoreType: 1, aka: 1, scoreTimestamp: 1, scoreInt: 1, _id:0 }, function(err, scores) {
        db.scores.find({appID : appid}, function(err, scores) {    
        if (err || !scores) {
            console.log("cain't get no scores... " + err);
        } else {
        //    console.log(JSON.stringify(scores));
            var scoresResponse = {};
            // scores.sort(function(a, b) {
            //     return b.scoreInt - a.scoreInt;
            // });
            // console.log("scores : " + JSON.stringify(scores) );
            scoresResponse.scores = scores;
            res.json(scoresResponse);
        }
    });
});

app.get('/scores/:u_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get scores for: ", req.params.u_id);
    //var _id = ObjectID(req.params.u_id);
    var appid = req.headers.appid.toString().replace(":", "");
    db.scores.find({$and : [{userID : req.params.u_id}, {appID : appid}]}, function(err, scores) {
        if (err || !scores) {
            console.log("cain't get no scores... " + err);
        } else {
//            console.log(JSON.stringify(scores));
            var scoresResponse = {};

            scoresResponse.scores = scores;
            res.json(scoresResponse);
        }
    });
});

app.get('/get_available_storeitems/:app_id', function (req, res) { //OPEN FOR TESTING, lock down for prod!

    console.log("tryna get storeitems for: ", req.params.app_id);
    //var _id = ObjectID(req.params.u_id);
    // var appid = req.headers.appid.toString().replace(":", "");
    db.storeitems.find({appID : req.params.app_id, itemStatus: "Available"}, function(err, storeitems) {
        if (err || !storeitems) {
            console.log("cain't get no storeitems... " + err);
        } else {
//            console.log(JSON.stringify(scores));
            var storeitemsResponse = {};
            
            async.each (storeitems, function (storeitem, callbackz) {
                var storeItemPictures = [];
                // console.log("storeitem.storeItemPictureIDs " + JSON.stringify(storeitem.storeItemPictureIDs ));
                if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                    // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                    const oids = storeitem.storeItemPictureIDs.map(item => {
                        return ObjectID(item);
                    })
                    db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                        if (err || !pic_items) {
                            callbackz();
                            console.log("error getting picture items: " + err);
                        } else {
                            async.each (pic_items, function (picture_item, pcallbackz) {
                                // console.log("gotsa picture item for store item: " + JSON.stringify(picture_item));
                                var imageItem = {};
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                // var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                // var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                imageItem.urlThumb = urlThumb;
                                // imageItem.urlHalf = urlHalf;
                                // imageItem.urlStandard = urlStandard;
                                imageItem._id = picture_item._id;
                                imageItem.filename = picture_item.filename;
                                storeItemPictures.push(imageItem);
                                pcallbackz();
                            }, function(err) {
                               
                                if (err) {
                                    console.log('A storeitem image failed to process');
                                    callbackz(err);
                                } else {
                                    console.log('Added images to storeitem successfully');
                                    // pcallbackz();
                                    storeitem.storeItemPictures = storeItemPictures;
                                    callbackz();
                                }
                            });
                           
                        }
                    });
                } else {
                    callbackz();
                } 
            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    // callbackz(err);
                    res.send("error: " + err);
                } else {
                    console.log('All files have been processed successfully');
                    // scoresResponse.topscores = topscores;
                    // callback(null);
                    storeitemsResponse.storeitems = storeitems;
                    res.json(storeitemsResponse);  
                }
            });

        }
    });
});

app.get('/get_storeitems/:app_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get storeitems for: ", req.params.app_id);
    //var _id = ObjectID(req.params.u_id);
    // var appid = req.headers.appid.toString().replace(":", "");
    db.storeitems.find({appID : req.params.app_id}, function(err, storeitems) {
        if (err || !storeitems) {
            console.log("cain't get no storeitems... " + err);
        } else {
//            console.log(JSON.stringify(scores));
            var storeitemsResponse = {};
            
            async.each (storeitems, function (storeitem, callbackz) {
                var storeItemPictures = [];
                if (storeitem.lastUpdateTimestamp === null || storeitem.lastUpdateTimestamp === undefined) {
                    if (storeitem.itemCreateDate != null && storeitem.itemCreateDate != undefined) {
                        storeitem.lastUpdateTimestamp = storeitem.itemCreateDate;
                    }
                }
                // console.log("storeitem.storeItemPictureIDs " + JSON.stringify(storeitem.storeItemPictureIDs ));
                if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                    // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                    const oids = storeitem.storeItemPictureIDs.map(item => {
                        return ObjectID(item);
                    })
                    db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                        if (err || !pic_items) {
                            callbackz();
                            console.log("error getting picture items: " + err);
                        } else {
                            async.each (pic_items, function (picture_item, pcallbackz) {
                                // console.log("gotsa picture item for store item: " + JSON.stringify(picture_item));
                                var imageItem = {};
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                // var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                // var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                imageItem.urlThumb = urlThumb;
                                // imageItem.urlHalf = urlHalf;
                                // imageItem.urlStandard = urlStandard;
                                imageItem._id = picture_item._id;
                                imageItem.filename = picture_item.filename;
                                storeItemPictures.push(imageItem);
                                pcallbackz();
                            }, function(err) {
                               
                                if (err) {
                                    console.log('A storeitem image failed to process');
                                    callbackz(err);
                                } else {
                                    console.log('Added images to storeitem successfully');
                                    // pcallbackz();
                                    storeitem.storeItemPictures = storeItemPictures;
                                    callbackz();
                                }
                            });
                           
                        }
                    });
                } else {
                    callbackz();
                } 
            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    // callbackz(err);
                    res.send("error: " + err);
                } else {
                    console.log('All files have been processed successfully');
                    // scoresResponse.topscores = topscores;
                    // callback(null);
                    storeitemsResponse.storeitems = storeitems;
                    res.json(storeitemsResponse);  
                }
            });

        }
    });
});
app.get('/get_storeitem/:_id',  checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna get storeitem: ", req.params._id);
    var item_id = ObjectID(req.params._id);
    // var appid = req.headers.appid.toString().replace(":", "");
    db.storeitems.findOne({_id : item_id}, function(err, storeitem) {
        if (err || !storeitem) {
            console.log("cain't get no storeitem... " + err);
        } else {
            if (storeitem.totalSold == null || storeitem.totalSold == undefined) {
                storeitem.totalSold = 0;
            }
            if (storeitem.storeItemPictureIDs != null && storeitem.storeItemPictureIDs != undefined && storeitem.storeItemPictureIDs.length > 0) {
                // oids = storeitem.storeItemPictureIDs.map(ObjectID()); //convert to mongo object ids for searching
                const oids = storeitem.storeItemPictureIDs.map(item => {
                    return ObjectID(item);
                })
                db.image_items.find({_id: {$in: oids }}, function (err, pic_items) {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        res.send("error: " + err);
                    } else {
                        storeItemPictures = [];
                        pic_items.forEach(function(picture_item){                
                            var imageItem = {};
                            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                            var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                            imageItem.urlThumb = urlThumb;
                            imageItem.urlHalf = urlHalf;
                            imageItem.urlStandard = urlStandard;
                            imageItem._id = picture_item._id;
                            imageItem.filename = picture_item.filename;
                            storeItemPictures.push(imageItem);
                            storeitem.storeItemPictures = storeItemPictures;
                        });
                        res.json(storeitem);
                    }
                });
            } else {
                res.json(storeitem);
            }
        }
    });
});
app.post('/set_storeitem', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna save storeitem : " + JSON.stringify(req.body));
    let storeitem = req.body;
    let timestamp = Math.round(Date.now() / 1000);
    storeitem.createdTimestamp = timestamp;
    storeitem.createdByUserID = req.session.user._id;
    storeitem.createdByUserName = req.session.userName;
    db.storeitems.save(storeitem, function (err, saved) {
        if ( err || !saved ) {
            console.log('purchaseable not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            // console.log('new purchaseable id: ' + item_id);
            res.send("created");
        }
    });
});

// app.get('/delete_store_items_man/:appid', function (req, res) {
//     if (req.params.appid.length > 10) {
//         db.storeitems.remove({});
//         res.send("all storeitems have been removed");
//     }
// });
// app.post('/import_storeitems', requiredAuthentication, function (req, res) {
//     console.log("tryna import storeitems for : " + req.body.appid);
    
//     let storeItemsData = req.body.storeitems;
//     async.each (storeItemsData, function (storeItem, pcallbackz) {
//         // console.log(JSON.stringify(storeItem));
//         let storeItemMod = {
//             appID: req.body.appid,
//             itemType: "Wearable",
//             itemSubType: storeItem.wearableType,
//             itemStatus: "Testing",
//             itemName: storeItem.name,
//             itemDisplayName: storeItem.displayName,
//             itemAltName: storeItem.archetype,
//             itemCreateDate: Math.round(Date.now() / 1000),
//             itemCreatedByUserName: req.session.user.userName,
//             itemCreatedByUserID: req.session.user._id,
//             maxPerUser: 1,
//             maxTotal: 10,
//             totalUsed: 0,
//             itemTags: storeItem.tags
            
//         }

//         delete storeItem['wearableType'];
//         delete storeItem['name'];
//         delete storeItem['archetype'];
//         delete storeItem['displayName'];
//         delete storeItem['tags'];
//         storeItemMod.jsonAttributes = storeItem;
       

//         db.storeitems.save(storeItemMod, function (err, saved) {
//             if ( err || !saved ) {
//                 console.log('store item not saved..');
//                 // res.send("nilch");
//                 pcallbackz();
//             } else {
//                 // var item_id = saved._id.toString();
//                 console.log('new storeitem id: ' + saved._id);
//                 // console.log(JSON.stringify(storeItemMod));
//                 pcallbackz();
//                 // res.send("created");
//             }
//         });
//     }, function(err) {
//        
//         if (err) {
//             console.log('prollem importing store item');
            
//         } else {
//             console.log('imported a bunch of storeitems successfully');
//             // pcallbackz();
//             // storeitem.storeItemPictures = storeItemPictures;
            
//         }
//     });
// });
app.post('/update_storeitem/', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna save storeitem : " + JSON.stringify(req.body));
    var o_id = ObjectID(req.body._id);
    var timestamp = Math.round(Date.now() / 1000);
    db.storeitems.findOne({_id: o_id}, function (err, item) {
        if ( err || !item) {
            console.log('item not found..');
            res.send("nilch");
        } else {
            db.storeitems.update( { _id: o_id }, { $set: {
                itemName: req.body.itemName,
                itemDisplayName: req.body.itemDisplayName,
                itemAltName: req.body.itemAltName,
                itemStatus: req.body.itemStatus,
                itemType: req.body.itemType,
                itemSubType: req.body.itemSubType,
                useGameCurrency: req.body.useGameCurrency,
                itemPrice: req.body.itemPrice,
                itemDescription: req.body.itemDescription,
                tags: req.body.tags,
                itemAttributes: req.body.itemAttributes,
                maxPerUser: req.body.maxPerUser,
                maxTotal: req.body.maxTotal,
                displayAssetURL: req.body.displayAssetURL,
                storeItemPictureIDs: req.body.storeItemPictureIDs,
                lastUpdateTimestamp: timestamp
            }});   
            res.send("updated");
        }
    });
});
app.post('/delete_storeitem/', requiredAuthentication, admin, function (req, res) {
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.storeitems.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});
app.post('/purchase', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post purchase: " + JSON.stringify(req.body));

    var _id = ObjectID(req.body.userID);
    var obody = req.body;
    db.users.findOne({"_id" : _id}, function (err, user) {
        if (err || !user) {
            console.log("error getting user: " + err);
            res.send("error " + err);
        } else {
            var userEmail = user.email;
            console.log("tryna charge " + userEmail);
            obody.userEmail = userEmail;
            if (user.stripeCustomerID != null) {
                stripe.charges.create({
                    amount: 1500, // $15.00 this time
                    currency: "usd",
                    customer: user.stripeCustomerID,
                    receipt_email: userEmail,
                    description: req.body.purchaseDescription,

                }).then(function(charge){
                    console.log(JSON.stringify(charge));
                    obody.stripeToken = charge;
                    db.purchases.save(obody, function (err, saved) {
                        if ( err || !saved ) {
                            console.log('purchase not saved..');
                            res.send("nilch");
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new purchase id: ' + item_id);
                            res.send("purchase id: " + item_id + " charged " + JSON.stringify(charge));
                        }
                    });
                });
            } else {
                console.log("no customer id!");
                res.send("no id");
            }
        }
    });
});

app.post('/testpurchase', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post test purchase: " + JSON.stringify(req.body));
    let _id = ObjectID(req.body.userID);
    let storeitemID = ObjectID(req.body.storeitemID);
    let obody = req.body;
    
    db.users.findOne({"_id" : _id}, function (err, user) {// check user
        if (err || !user) {
            console.log("error getting user: " + err);
            res.send("error " + err);
        } else {
            db.storeitems.findOne({"_id" : storeitemID}, function (err, storeitem){ //check store item
                if (err || !storeitem) {
                    console.log("no store item error " + err);
                    res.send("error " + err);
                } else {
                    let usertotal = 0;
                    db.purchases.find({userID: req.body.userID, storeitemID: req.body.storeitemID}, function (err, purchases) { //check user's previous purchases of this item doesn't exceed maxPerUser
                        if (err) {
                            console.log("error! " + err);
                        } else {

                            for (let i = 0; i < purchases.length; i++) {
                                let quantity = (purchases[i].quantity != null) ? purchases[i].quantity : 1;
                                usertotal += quantity;
                            }
                            if (usertotal >= storeitem.maxPerUser) {
                                console.log("maxPerUser exceeded!");
                                res.send("this user can't buy more of these!");
                            } else {
                                console.log("checking inventory totalSold == " + total + " maxTotal ==  " + storeitem.maxTotal );
                                if (storeitem.maxTotal == 0 || total < storeitem.maxTotal) { //check maxTotal
                                    var userEmail = user.email;
                                    console.log("tryna charge " + userEmail);
                                    obody.userEmail = userEmail;
                                    obody.purchaseStatus = "Test Purchase"
                                    if (obody.quantity == null) {
                                        obody.quantity = 1;
                                    }
                                    // if (obody.quantity < storeitem.maxPerUser) {
                                    db.purchases.save(obody, function (err, saved) {
                                        if ( err || !saved ) {
                                            console.log('purchase not saved..');
                                            res.send("purchase failed");
                                        } else {
                                            var item_id = saved._id.toString();
                                            console.log('new purchase id: ' + item_id);
                                            db.storeitems.update( { "_id": storeitemID },{ $inc: { totalSold: obody.quantity }});
                                            var htmlbody = "Thanks for your Purchase: " + JSON.stringify(saved);
                                            ses.sendEmail( {
                                                Source: adminEmail,
                                                Destination: { ToAddresses: [userEmail]},
                                                Message: {
                                                    Subject: {
                                                        Data: "Your Purchase"
                                                    },
                                                    Body: {
                                                        Html: {
                                                            Data: htmlbody
                                                        }
                                                    }
                                                }
                                            }
                                            , function(err, data) {
                                                if(err) throw err
                                                console.log('Email sent:');
                                                console.log(data);
                                               
                                            });
                                            res.send("purchase id: " + item_id + " charged " + saved.price);
                                        }
                                    });
                                } else {
                                    console.log("Sold Out!")
                                    res.send("that item is sold out");
                                }
                            }
                        }
                    }); //check user's purchases for this item
                    let total = 0;
                    if (storeitem.totalSold != null) {
                        total = storeitem.totalSold;
                    }

                } 
            }); 

        }
    });
});
app.get('/purchases/', requiredAuthentication, admin, function (req, res) { //all the things..

    console.log("tryna get all purchases! ");

    db.purchases.find({}, function(err, purchases) {
        if (err || !purchases || purchases == null || purchases.length == 0) {
            console.log("cain't get no purchases... ");
            res.send("no purchases");
        } else {
//            console.log(JSON.stringify(scores));
            var purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        }
    });
});

app.get('/purchases/:app_id/:u_id',  requiredAuthentication, function (req, res) {

    console.log("tryna get purchases for: ", req.params.u_id + " " + req.params.app_id);
    //var _id = ObjectID(req.params.u_id);
    // var appid = req.headers.appid.toString().replace(":", "");
    db.purchases.find({$and : [{userID : req.params.u_id}, {appID : req.params.app_id}]}, function(err, purchases) {
        if (err || !purchases || purchases == null || purchases.length == 0) {
            console.log("cain't get no purchases... ");
            res.send("no purchases");
        } else {
//            console.log(JSON.stringify(scores));
            var purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        }
    });
});

app.get('/purchases/:app_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get purchases for appid: " + req.params.app_id);
    //var _id = ObjectID(req.params.u_id);
    // var appid = req.headers.appid.toString().replace(":", "");
    db.purchases.find({appID : req.params.app_id}, function(err, purchases) {
        if (err || !purchases || purchases == null || purchases.length == 0) {
            console.log("cain't get no purchases... ");
            res.send("no purchases");
        } else {
            var purchasesResponse = {};
            purchasesResponse.purchases = purchases;
            res.json(purchasesResponse);
        }
    });
});
app.post('/activity', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post scores");
    db.activity.save(req.body, function (err, saved) {
        if ( err || !saved ) {
            console.log('score not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new score id: ' + item_id);
            res.send(item_id);
        }
    });
});

app.get('/activities/:u_id',  checkAppID, requiredAuthentication, function (req, res) {

    console.log("tryna get activities for: ", req.params.u_id);
    //var _id = ObjectID(req.params.u_id);
    var appid = req.headers.appid.toString().replace(":", "");
    db.activity.find({$and : [{userID : req.params.u_id}, {appID : appid}]}, function(err, activities) {
        if (err || !activities) {
            console.log("cain't get no activities... " + err);
            res.send(err);
        } else {
            console.log(JSON.stringify(activities));
            var activitiesResponse = {};
            activitiesResponse.activities = activities;
            res.json(activitiesResponse);
        }
    });
});


app.get('/activitytotals/:appid', function (req, res) {

    var appid = req.params.appid.toString().replace(":", "");

    console.log("tryna get total user scores for app: " + appid);

    var scoresResponse = {};
    var appScores = {};

    async.waterfall([

            function (callback) { //get all scores for this app
                db.scores.find({appID : appid}, function(err, activities) {
                    if (err || !scores) {
                        console.log("cain't get no scores... " + err);
                        callback(err);
                    } else {

                        appScores = scores;
                        console.log("scores: " + JSON.stringify(appScores));
                        callback(null, scores);
                    }

                });
            }, //pull unique userIDs
            function (userScores, callback) {
                var items = userScores;
                var uids = [];
                var lookup = {};
                for (var item, i = 0; item = items[i++];) {
                    var uid = item.userID;
                    if (!(uid in lookup)) {
                        lookup[uid] = 1;
                        uids.push(uid);
                    }
                }
                console.log(JSON.stringify(uids));
                callback(null, userScores, uids);
            }, //loop through again to aggregate scores for each user
            function (scores, uids, callback) {
                var totalscores = [];
                async.each (uids, function (uid, callbackz) {
                    var uscores = {};
                    var scoretemp = 0;
                    for (var entry in appScores) {
                        if (uid == appScores[entry].userID) {
                            scoretemp = scoretemp + parseInt(appScores[entry].score);
                        }
                    }
                    uscores.user = uid;
                    uscores.scoreTotal = scoretemp;
                    totalscores.push(uscores);
                    callbackz();
                }, function(err) {
                   
                    if (err) {
                        console.log('A file failed to process');
                        callbackz(err);
                    } else {
                        console.log('All files have been processed successfully');
                        scoresResponse.topscores = topscores;
                        callback(null);
                    }
                });
            }

        ], //end of async.waterfall
        function (err, result) { // #last function, close async
            res.json(scoresResponse);
            console.log("waterfall done: " + result);
        })
});

app.post('/newpath', checkAppID, requiredAuthentication, function (req, res) {

    db.paths.save(req.body, function (err, saved) {
        if ( err || !saved ) {
            console.log('path not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new path id: ' + item_id);
            res.send(item_id);

        }
    });

});

app.post('/update_path/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log(req.params._id);

    var o_id = ObjectID(req.body._id);  //convert to BSON for searchie
    console.log('path requested : ' + req.body._id);
    db.paths.find({ "_id" : o_id}, function(err, path) {
        if (err || !path) {
            console.log("error getting path items: " + err);
        } else {
            console.log("tryna update path " + req.body._id);
            db.paths.update( { "_id": o_id }, { $set: {

                pathUserID : req.body.user_id,
                pathNumber : req.body.pathNumber,
                pathTitle : req.body.pathTitle,
                pathMeaning : req.body.pathMeaning,
                pathAttribution : req.body.pathAttribution,
                pathColor1 : req.body.pathColor1,
                pathColor2 : req.body.pathColor2,

                pathMapPictureID : req.body.pathMapPictureID,
                pathPictureID : req.body.pathPictureID,
                pathArcanumNumber : req.body.pathArcanumNumber,
                pathArcanumTitle : req.body.pathArcanumTitle,
                pathArcanumPictureID : req.body.pathArcanumPictureID,
                pathTriggerAudioID : req.body.pathTriggerAudioID,
                pathSpokenAudioID : req.body.pathSpokenAudioID,
                pathBackgroundAudioID : req.body.pathBackgroundAudioID,
                pathEnvironmentAudioID : req.body.pathEnvironmentAudioID,
                pathKeynote : req.body.pathKeynote,
                pathDescription : req.body.pathDescription,
                pathText : req.body.pathText}
            });
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

///////////////
app.get('/sceneinfo',  checkAppID, requiredAuthentication, function (req, res) { //get default scene info

    console.log(req.params._id);
    var o_id = ObjectID(req.params._id);
    db.scenes.find({}, function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no paths... " + err);
        } else {
            console.log(JSON.stringify(scenes));
            res.json(scenes);
        }
    });
});

app.post('/add_scene_group/', requiredAuthentication, function (req, res) {

    let s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    let g_id = ObjectID(req.body.group_id);  //convert to BSON for searchie
    // let audiotype
    console.log('tryna add a scene pic : ' + req.body);

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4: " + err);
        } else {
            db.groups.findOne({ "_id": g_id}, function (err, group) {
                if (err || !group) {
                    console.log("error getting image items 4: " + err);
                } else {
                    if (req.body.grouptype == 'picture') {
                    var scenePictureGroups = scene.scenePictureGroups || new Array();
                    console.log("tryna add pic group to scene: " + s_id);
                        if (scenePictureGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            scenePictureGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {scenePictureGroups: scenePictureGroups}});
                        }

                    } else  if (req.body.grouptype == 'audio') {
                        var sceneAudioGroups = scene.sceneAudioGroups || new Array();
                        console.log("tryna add audio group to scene: " + s_id);
                        if (sceneAudioGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneAudioGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneAudioGroups: sceneAudioGroups}});
                            
                        }
                    } else  if (req.body.grouptype == 'paudio') {
                            let scenePrimaryAudioGroups = scene.scenePrimaryAudioGroups || new Array();
                            console.log("tryna add audio group to scene: " + s_id);
                            if (scenePrimaryAudioGroups.indexOf(req.body.group_id) > -1) {
                                console.log("redundant group id");
                            } else {
                                scenePrimaryAudioGroups.push(req.body.group_id);
                                db.scenes.update({ "_id": s_id }, { $set: {scenePrimaryAudioGroups: scenePrimaryAudioGroups}});
                            }
                    } else  if (req.body.grouptype == 'aaudio') {
                        let sceneAmbientAudioGroups = scene.sceneAmbientAudioGroups || new Array();
                        console.log("tryna add audio group to scene: " + s_id);
                        if (sceneAmbientAudioGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneAmbientAudioGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneAmbientAudioGroups: sceneAmbientAudioGroups}});
                        }
                    } else  if (req.body.grouptype == 'taudio') {
                        let sceneTriggerAudioGroups = scene.sceneTriggerAudioGroups || new Array();
                        console.log("tryna add audio group to scene: " + s_id);
                        if (sceneTriggerAudioGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneTriggerAudioGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneTriggerAudioGroups: sceneTriggerAudioGroups}});
                        }            
                    } else if (req.body.grouptype == 'text') {
                        var sceneTextGroups = scene.sceneTextGroups || new Array();
                        console.log("tryna add video group to scene: " + s_id);
                        if (sceneTextGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneTextGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneTextGroups: sceneTextGroups}});
                        }

                    } else if (req.body.grouptype == 'object') {
                        var sceneObjectGroups = scene.sceneObjectGroups || new Array();
                        console.log("tryna add object group to scene: " + s_id);
                        if (sceneObjectGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneObjectGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneObjectGroups: sceneObjectGroups}});
                        }

                    } else if (req.body.grouptype == 'video') {
                        var sceneVideoGroups = scene.sceneVideoGroups || new Array();
                        console.log("tryna add location group to scene: " + s_id);
                        if (sceneVideoGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneVideoGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneVideoGroups: sceneVideoGroups}});
                        }
                    } else if (req.body.grouptype == 'location') {
                        var sceneLocationGroups = scene.sceneLocationGroups || new Array();
                        console.log("tryna add location group to scene: " + s_id);
                        if (sceneLocationGroups.indexOf(req.body.group_id) > -1) {
                            console.log("redundant group id");
                        } else {
                            sceneLocationGroups.push(req.body.group_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneLocationGroups: sceneLocationGroups}});
                        }
                    }
                }  if (err) {res.send(error)} else {res.send("updated " + new Date())}
            });
        }
    });
});

app.post('/add_scene_location/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.location_id);  //convert to BSON for searchie
    console.log('tryna add a scene obj : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4 obj: " + err);
        } else {

            // if (scene.sceneLocations != null && scene.sceneLocations.indexOf(req.body.location_id) > -1) {
            //     //In the array!
            //     res.send("duplicates not allowed!")
            // } else {
            
            db.locations.findOne({ "_id": p_id}, function (err, obj) {
                if (err || !obj) {
                    console.log("error getting obj items 4: " + err);
                } else {
                    var timestamp = Math.round(Date.now() / 1000);
                    obj.timestamp = timestamp;

                    var sceneLocs = scene.sceneLocations;
                    if (sceneLocs == null || !Array.isArray(sceneLocs)) {
                        sceneLocs = [];
                    }
                    // console.log("tryna add sceneLocations: " + sceneLocations);
                    sceneLocs.push(obj);
                    db.scenes.update({ "_id": s_id }, { $set: {sceneLocations: sceneLocs}});
                }
                if (err) {
                    res.send(error)
                } else {
                    res.send("updated " + new Date())
                }
            });
            // }
        }
    });
});
app.post('/add_scene_model/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.model_id);  //convert to BSON for searchie
    console.log('tryna add a scene obj : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4 obj: " + err);
        } else {

            if (scene.sceneModels != null && scene.sceneModels.indexOf(req.body.model_id) > -1) {
                //In the array!
                res.send("duplicate models not allowed!")
            } else {
                db.models.findOne({ "_id": p_id}, function (err, model) {
                    if (err || !model) {
                        console.log("error getting model 4: " + err);
                    } else {
                            var sceneModels = (scene.sceneModels != undefined && scene.sceneModels != null && scene.sceneModels.length > 0) ? scene.sceneModels : new Array();
                            // console.log("XXX sceneModels: " + JSON.stringify(sceneModels));
                            sceneModels.push(req.body.model_id);
                            db.scenes.update({ "_id": s_id }, { $set: {sceneModels: sceneModels}
                        });
                    }
                    if (err) {
                        res.send(error);
                    } else {
                        res.send("updated " + new Date());
                    }
                });
            }
        }
    });
});

app.post('/add_scene_obj/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.obj_id);  //convert to BSON for searchie
    console.log('tryna add a scene obj : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4 obj: " + err);
        } else {

            if (scene.sceneObjects != null && scene.sceneObjects.indexOf(req.body.obj_id) > -1) {
                //In the array!
                res.send("duplicates not allowed!")
            } else {
                db.obj_items.findOne({ "_id": p_id}, function (err, obj) {
                    if (err || !obj) {
                        console.log("error getting obj items 4: " + err);
                    } else {
                        var sceneObjs = scene.sceneObjects != undefined ? scene.sceneObjects : new Array();
                        console.log("XXX sceneObjs: " + sceneObjs);
                        sceneObjs.push(req.body.obj_id);
                        db.scenes.update({ "_id": s_id }, { $set: {sceneObjects: sceneObjs}
                        });
                    }
                    if (err) {
                        res.send(error)
                    } else {
                        res.send("updated " + new Date())
                    }
                });
            }
        }
    });
});

app.post('/add_scenelocation_obj/', checkAppID, requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.obj_id);  //convert to BSON for searchie

    console.log('tryna add a scene location obj : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting scene location obj: " + err);
        } else {

            if (scene.sceneLocations != null) {
                for (var i = 0; i < scene.sceneLocations.length; i++) {
                    console.log("tryna find location " + req.body.location_id + " vs " + scene.sceneLocations[i].timestamp);
                    if  (scene.sceneLocations[i].timestamp == req.body.location_id) {
                        console.log("gotsa matching sceneLocation!");
                        db.obj_items.findOne({ "_id": p_id}, function (err, object) {
                            if (err || !object) {
                                console.log("error getting object : " + err);
                                res.end();
                            } else {
                                scene.sceneLocations[i].location_object = object;
                                var sceneObjs = scene.sceneObjects != undefined ? scene.sceneObjects : new Array();
                                console.log("truyna push sceene location object id " + req.body.obj_id);
                                sceneObjs.push(req.body.obj_id);
//                        var sceneObjs = scene.sceneObjects != undefined ? scene.sceneObjects : new Array();
//                        console.log("XXX sceneObjs: " + sceneObjs);
//                        sceneObjs.push(req.body.obj_id);

                                db.scenes.update({ "_id": s_id }, { $set: {sceneLocations: scene.sceneLocations, sceneObjects: sceneObjs}});

//                                if (error) {
//                                    res.send(error)
//                                } else {
                                    res.send("updated " + new Date());

//                                }
                            }

                        });
                        break;
                    }
                };
            } else {
                res.send("location not found in scene")
            }
        }
    });
});

app.post('/add_scene_vid/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.vid_id);  //convert to BSON for searchie
    console.log('tryna add a scene vid : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4: " + err);
        } else {
            db.video_items.findOne({ "_id": p_id}, function (err, vid) {
                if (err || !vid) {
                    console.log("error getting vid items 4: " + err);
                } else {

                    var sceneVideos = new Array();
                    if (scene.sceneVideos) {
                        sceneVideos = scene.sceneVideos;
                    }
                    if (sceneVideos.indexOf(req.body.vid_id) == -1 ) {
                        console.log("XXX sceneVids: " + sceneVideos);
                        sceneVideos.push(req.body.vid_id);
                        db.scenes.update({ "_id": s_id }, { $set: {sceneVideos: sceneVideos}

                        });
                    }
                }  if (err) {res.send(error)} else {res.send("updated " + new Date())}
            });
        }
    });
});


app.post('/add_scene_pic/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + req.body);

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4: " + err);
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items 4: " + err);
                } else {
                    var scenePics = new Array();
                    if (scene.scenePictures != undefined && scene.scenePictures.length > 0) {
                        scenePics = scene.scenePictures;
                    }

                    console.log("XXX scenePics: " + scenePics);
                    scenePics.push(req.body.pic_id);
                    db.scenes.update({ "_id": s_id }, { $set: {scenePictures: scenePics}

                    });
                }  if (err) {res.send(error)} else {res.send("updated " + new Date())}
            });
        }
    });
});
app.post('/rem_domain_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.domain_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.apps.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting sceneert 4: " + err);
            res.send("app not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for domain: " + err);
                } else {
                    var domainPics = item.domainPictureIDs;
                    if (domainPics != null) {
                    let index = domainPics.indexOf(req.body.pic_id);
                    if ( index != -1 ) {
                        domainPics.splice(index, 1);
                        db.domains.update({ "_id": s_id }, { $set: {domainPictureIDs: domainPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is not assigned to this app");
                    }
                    }
                }  
            });
        }
    });
});
app.post('/add_object_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.object_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a object pic : ' + JSON.stringify(req.body));
    db.obj_items.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting object 4: " + err);
            res.send("object not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for object: " + err);
                } else {
                    var objectPics = item.objectPictureIDs;
                    if (objectPics == null) {
                        objectPics = [];
                    }
                    if ( objectPics.indexOf(req.body.pic_id) == -1 ) {
                        objectPics.push(req.body.pic_id);
                        db.obj_items.update({ "_id": s_id }, { $set: {objectPictureIDs: objectPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is already assigned to this object");
                    }
                }  
            });
        }
    });
});
app.post('/rem_object_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.domain_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.obj_items.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting sceneert 4: " + err);
            res.send("app not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for domain: " + err);
                } else {
                    var objectPics = item.objectPictureIDs;
                    if (objectPics != null) {
                    let index = objectPics.indexOf(req.body.pic_id);
                    if ( index != -1 ) {
                        objectPics.splice(index, 1);
                        db.obj_items.update({ "_id": s_id }, { $set: {objectPictureIDs: objectPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is not assigned to this app");
                    }
                    }
                }  
            });
        }
    });
});
app.post('/add_domain_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.domain_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a domain pic : ' + JSON.stringify(req.body));
    db.domains.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting sceneert 4: " + err);
            res.send("domain not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for storeitem: " + err);
                } else {
                    var domainPics = item.domainPictureIDs;
                    if (domainPics == null) {
                        domainPics = [];
                    }
                    if ( domainPics.indexOf(req.body.pic_id) == -1 ) {
                        domainPics.push(req.body.pic_id);
                        db.domains.update({ "_id": s_id }, { $set: {domainPictureIDs: domainPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is already assigned to this domain");
                    }
                }  
            });
        }
    });
});
app.post('/rem_app_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.app_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.apps.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting sceneert 4: " + err);
            res.send("app not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for storeitem: " + err);
                } else {
                    var appPics = item.appPictureIDs;
                    if (appPics != null) {
                    let index = appPics.indexOf(req.body.pic_id);
                    if ( index != -1 ) {
                        appPics.splice(index, 1);
                        db.apps.update({ "_id": s_id }, { $set: {appPictureIDs: appPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is not assigned to this app");
                    }
                    }
                }  
            });
        }
    });
});
app.post('/add_app_pic/', requiredAuthentication, admin, function (req, res) {
    var s_id = ObjectID(req.body.app_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.apps.findOne({ "_id": s_id}, function (err, item) {
        if (err || !item) {
            console.log("error getting sceneert 4: " + err);
            res.send("store item not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for storeitem: " + err);
                } else {
                    var appPics = item.appPictureIDs;
                    if (appPics == null) {
                        appPics = [];
                    }
                    // console.log("XXX scenePics: " + storeItemPics);
                    if ( appPics.indexOf(req.body.pic_id) == -1 ) {
                        appPics.push(req.body.pic_id);
                        db.apps.update({ "_id": s_id }, { $set: {appPictureIDs: appPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is already assigned to this storeitem");
                    }
                }  
            });
        }
    });
});
app.post('/rem_storeitem_pic/', checkAppID, requiredAuthentication, function (req, res) {
    var s_id = ObjectID(req.body.storeitem_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.storeitems.findOne({ "_id": s_id}, function (err, storeitem) {
        if (err || !storeitem) {
            console.log("error getting sceneert 4: " + err);
            res.send("store item not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for storeitem: " + err);
                } else {
                    var storeItemPics = storeitem.storeItemPictureIDs;
                    if (storeItemPics != null) {
                    let index = storeItemPics.indexOf(req.body.pic_id);
                    if ( index != -1 ) {
                        storeItemPics.splice(index, 1);
                        db.storeitems.update({ "_id": s_id }, { $set: {storeItemPictureIDs: storeItemPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is not assigned to this storeitem");
                    }
                    }
                }  
            });
        }
    });
});
app.post('/add_storeitem_pic/', checkAppID, requiredAuthentication, function (req, res) {
    var s_id = ObjectID(req.body.storeitem_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));
    db.storeitems.findOne({ "_id": s_id}, function (err, storeitem) {
        if (err || !storeitem) {
            console.log("error getting sceneert 4: " + err);
            res.send("store item not found!")
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items for storeitem: " + err);
                } else {
                    var storeItemPics = storeitem.storeItemPictureIDs;
                    if (storeItemPics == null) {
                        storeItemPics = [];
                    }
                    console.log("XXX scenePics: " + storeItemPics);
                    if ( storeItemPics.indexOf(req.body.pic_id) == -1 ) {
                        storeItemPics.push(req.body.pic_id);
                        db.storeitems.update({ "_id": s_id }, { $set: {storeItemPictureIDs: storeItemPics}});
                        if (err) {res.send(error)} else {res.send("updated " + new Date())}
                    } else {
                        res.send("that picture is already assigned to this storeitem");
                    }
                }  
            });
        }
    });
});
app.post('/add_scene_postcard/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var p_id = ObjectID(req.body.pic_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + JSON.stringify(req.body));

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4: " + err);
        } else {
            db.image_items.findOne({ "_id": p_id}, function (err, pic) {
                if (err || !pic) {
                    console.log("error getting image items 4: " + err);
                } else {
                    var scenePostcards = new Array();
                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                        scenePostcards = scene.scenePostcards;
                    }
                    console.log("XXX scenePostcards: " + scenePostcards);
                    scenePostcards.push(req.body.pic_id);
                    db.scenes.update({ "_id": s_id }, { $set: {scenePostcards: scenePostcards}

                    });
                }  if (err) {res.send(error)} else {res.send("updated " + new Date())}
            });
        }
    });
});

app.post('/add_group_item/', checkAppID, requiredAuthentication, function (req, res) {

    var g_id = ObjectID(req.body.group_id);  //convert to BSON for searchie
    var timestamp = Math.round(Date.now() / 1000);
    console.log('tryna add a group item : ' + req.body);
    db.groups.update({ "_id": g_id }, { $push: {items: req.body.item_id} },{ $set: {lastUpdateTimestamp : timestamp} });
    res.send("ok");

});


app.post('/add_scene_audio/', requiredAuthentication, function (req, res) {

    var s_id = ObjectID(req.body.scene_id);  //convert to BSON for searchie
    var a_id = ObjectID(req.body.audio_id);  //convert to BSON for searchie
    console.log('tryna add a scene pic : ' + req.body);

    db.scenes.findOne({ "_id": s_id}, function (err, scene) {
        if (err || !scene) {
            console.log("error getting sceneert 4: " + err);
        } else {
            db.audio_items.findOne({ "_id": a_id}, function (err, audio) {
                if (err || !audio) {
                    console.log("error getting audio items 4: " + err);
                } else {
                    if (req.body.audio_type === "trigger") {
                        db.scenes.update({ "_id": s_id }, { $set: {sceneTriggerAudioID: req.body.audio_id}});
                    } else if (req.body.audio_type === "ambient") {
                        db.scenes.update({ "_id": s_id }, { $set: {sceneAmbientAudioID: req.body.audio_id}});
                    } else if (req.body.audio_type === "primary") {
                        db.scenes.update({ "_id": s_id }, { $set: {scenePrimaryAudioID: req.body.audio_id}});
                    }

                }  if (err) {res.send(error)} else {res.send("updated " + new Date())}
            });
        }
    });
});

//
//    db.image_items.findOne({ "_id" : o_id}, function(err, pic) {
//        if (err || !pic) {
//            console.log("error getting image items 4: " + err);
//        } else {
//
//
//        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
//    });
//});

app.get('/uscenes/:_id',  requiredAuthentication, usercheck, function (req, res) { //get scenes for this user
    console.log("tryna get user scenes: ",req.params._id);
    var o_id = ObjectID(req.params._id);
    var scenesResponse = {};

    db.scenes.find({ "user_id" : req.params._id}, { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, sceneDomain: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneShareWithPublic: 1 },  function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err);
            res.send("noscenes");
        } else { //should externalize
            res.json(scenes);
        }
    });
});
app.get('/uscenes/:appid',  requiredAuthentication, usercheck, function (req, res) { //get scenes for this user
    console.log("tryna get user scenes: ",req.params._id);
    var o_id = ObjectID(req.params.appid);
    var scenesResponse = {};

    db.scenes.find({ "user_id" : req.params._id}, { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, sceneDomain: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneShareWithPublic: 1 },  function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err);
            res.send("noscenes");
        } else { //should externalize
            res.json(scenes);
        }
    });
});
app.post('/uscenes/',  requiredAuthentication, usercheck, function (req, res) { //get scenes for app
    console.log("tryna get user scenes: ",req.params._id);
    var o_id = ObjectID(req.params._id);
    var scenesResponse = {};
    db.scenes.find({ "sceneAppName" : req.body.appName}, { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneShareWithPublic: 1 },  function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err);
            res.send("noscenes");
        } else { //should externalize
            res.json(scenes);
        }
    });
});
app.post('/appscenes/',  requiredAuthentication, function (req, res) { //get scenes for app
    console.log("tryna get user scenes fer: " + req.body.sceneDomain);

    // var o_id = ObjectID(req.params.appid);
    // var scenesResponse = {};
    db.scenes.find({ "sceneDomain" : req.body.sceneDomain}, { sceneTitle: 1, short_id: 1, sceneLastUpdate: 1, userName: 1, user_id: 1, sceneAndroidOK: 1, sceneIosOK: 1, sceneWindowsOK: 1, sceneShareWithPublic: 1 },  function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err);
            res.send("noscenes");
        } else { //should externalize
            res.json(scenes);
        }
    });
});
app.get('/uscene/:user_id/:scene_id',  requiredAuthentication, uscene, function (req, res) { //view for updating scene for this user

    console.log("tryna get scene id: ", req.params.scene_id + " excaped " + entities.decodeHTML(req.params._id));
    var reqstring = entities.decodeHTML(req.params.scene_id).toString().replace(":", "");
//    var sceneID = req.params.scene_id.toString().replace(":", "");
    var audioResponse = {};
    
    var pictureResponse = {};
    var postcardResponse = {};
    var objectResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    // var requestedLocationItems = [];
    // sceneResponse.locations = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    sceneResponse.assets = [];
    async.waterfall([
        function (callback) {
            console.log("uscene lookup for reqstring " + reqstring);
            var o_id = ObjectID(reqstring);
            // var o_id = new ObjectId.createFromHexString(reqstring);
            // var o_id = ObjectID(req.params.scene_id);
            db.scenes.find({$or: [{ sceneTitle: reqstring },
                    { short_id : reqstring },
                    { _id : o_id}]},
                function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                    if (err || !sceneData || !sceneData.length) {
                        console.log("error getting scene data: " + err);
                        callback(err);
                    } else { //make arrays of the pics and audio items and locations
                        if (sceneData[0].scenePictures != undefined) { 
                                if (sceneData[0].scenePictures.length > 0) {
{                                   sceneData[0].scenePictures.forEach(function (picture) {
                                    var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                    requestedPictureItems.push(p_id); //populate array
                                });
                            }
                        }
                    }
                        // sceneData[0].sceneLocationIDs.forEach(function (locationID){
                        //     var p_id = ObjectID(locationID); //convert to binary to search by _id beloiw
                        //     requestedLocationItems.push(p_id); //populate array
                        // });
                        // requestedAudioItems = [ ObjectID(sceneData[0].sceneTriggerAudioID), ObjectID(sceneData[0].sceneAmbientAudioID), ObjectID(sceneData[0].scenePrimaryAudioID)];
                        var triggerOID = ObjectID.isValid(sceneData[0].sceneTriggerAudioID) ? ObjectID(sceneData[0].sceneTriggerAudioID) : "";
                        var ambientOID = ObjectID.isValid(sceneData[0].sceneAmbientAudioID) ? ObjectID(sceneData[0].sceneAmbientAudioID) : "";
                        var primaryOID = ObjectID.isValid(sceneData[0].scenePrimaryAudioID) ? ObjectID(sceneData[0].scenePrimaryAudioID) : "";
                        requestedAudioItems = [ triggerOID, ambientOID, primaryOID];
                        sceneResponse = sceneData[0];

                        callback(null);
                    }
                });
            },
            function (callback) { //update link pic URLs //TODO check for freshness, and rescrape if needed
                if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                    for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                        var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".thumb.jpg", Expires: 6000});
                        var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".half.jpg", Expires: 6000});
                        var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".standard.jpg", Expires: 6000});
                        sceneResponse.sceneWebLinks[i].urlThumb = urlThumb;
                        sceneResponse.sceneWebLinks[i].urlHalf = urlHalf;
                        sceneResponse.sceneWebLinks[i].urlStandard = urlStandard;
                    }
                }
                callback(null);
            },
            function (callback) { 
                if (sceneResponse.sceneVideos != null && sceneResponse.sceneVideos != undefined && sceneResponse.sceneVideos.length > 0) {
                    moids = sceneResponse.sceneVideos.map(convertStringToObjectID);
                    db.video_items.find({_id: {$in: moids }}, function (err, video_items){
                        if (err || !video_items) {
                            console.log("error getting video items: " + err);
                            callback(null);
                        } else {
                            for (let i = 0; i < video_items.length; i++) {
                                let item_string_filename = JSON.stringify(video_items[i].filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                let item_string_filename_ext = getExtension(item_string_filename);
                                let expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var urlVid = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + video_items[i].userID + "/" + video_items[i]._id + "." + video_items[i].filename, Expires: 60000});
                                video_items[i].vUrl = urlVid;
                            }
                            sceneResponse.sceneVideoItems = video_items;
                            callback(null)
                        }
                    });
                } else {
                    callback(null);
                }
            },
            // function (callback) { //attach the location objex
            //     if (sceneResponse.sceneLocationIDs != null && sceneResponse.sceneLocationIDs != undefined && sceneResponse.sceneLocationIDs.length > 0) {
            //         for (let s = 0; s < sceneResponse.sceneLocationIDs.length; s++) {
            //             if (location_items[s]._id)
            //         }
            //         moids = sceneResponse.sceneLocationIDs.map(convertStringToObjectID);
            //         db.locations.find({_id: {$in: moids }}, function (err, location_items){
            //             if (err || !location_items) {
            //                 console.log("error getting location items: " + err);
            //                 callback(null);
            //             } else {
            //                 let sceneLocations = sceneResponse.sceneLocations != undefined ? sceneResponse.sceneLocations : new Array(); //some old sceneLocations aren't external
            //                 for (let s = 0; s < location_items.length; s++) {
            //                     if (location_items[s]._id)
            //                 }
            //                 let mergedSceneLocations = sceneLocations.concat(location_items);
            //                 sceneResponse.sceneLocations = mergedSceneLocations;
            //                 callback(null)
            //             }
            //         });
            //     } else {
            //         callback(null);
            //     }
            // },
            function (callback) { 
                let allgroups = [];
                if (sceneResponse.scenePictureGroups != null) {
                    allgroups.push(...sceneResponse.scenePictureGroups);
                };
                if (sceneResponse.sceneAudioGroups != null) {
                    allgroups.push(...sceneResponse.sceneAudioGroups);
                };
                if (sceneResponse.sceneLocationGroups != null) {
                    allgroups.push(...sceneResponse.sceneLocationGroups);
                };
                if (allgroups.length > 0) {
                    moids = allgroups.map(convertStringToObjectID);
                    db.groups.find({_id: {$in: moids }}, function (err, items){
                        if (err || !items) {
                            console.log("error getting groupz items: " + err);
                            callback(null);
                        } else {
                            sceneResponse.sceneGroups = items;
                            callback(null)
                        }
                    });
                } else {
                    callback(null);
                }
            },
            function (callback) { //fethc audio items
                db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items){
                    if (err || !audio_items) {
                        console.log("error getting audio items: " + err);
                        callback(null);
                    } else {

                        callback(null, audio_items) //send them along
                    }
                });
            },
            function(audio_items, callback) { //add the signed URLs to the obj array
                for (var i = 0; i < audio_items.length; i++) {
                    //    console.log("audio_item: ", audio_items[i]);
                    var item_string_filename = JSON.stringify(audio_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var mp3Name = baseName + '.mp3';
                    var oggName = baseName + '.ogg';
                    var pngName = baseName + '.png';
                    var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                    var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                    var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
//                            audio_items.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                    if (audio_items[i].tags != null && audio_items[i].tags.length < 1) {audio_items[i].tags = [""]}

                }
                //   console.log('tryna send ' + audio_items);
                audioResponse = audio_items;
                sceneResponse.audio = audioResponse;
//                        console.log("audio", audioResponse);
                callback(null, audio_items);
            },

            function(audioStuff, callback) { //return the pic items
                //   console.log("audioStuff ", audioStuff);
                console.log("requestedPictureItems:  ", requestedPictureItems);
                db.image_items.find({_id: {$in: requestedPictureItems }}, function (err, pic_items)
                {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        callback(null);
                    } else {
                        callback(null, pic_items)
                    }
                });
            },

            function (picture_items, callback) {
                for (var i = 0; i < picture_items.length; i++) {
                    //    console.log("picture_item: ", picture_items[i]);
                    var item_string_filename = JSON.stringify(picture_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var standardName = 'standard.' + baseName + item_string_filename_ext;
                    var originalName = 'original.' + baseName + item_string_filename_ext;

                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + quarterName, Expires: 6000});
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + halfName, Expires: 6000});
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + standardName, Expires: 6000});
                    //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                    picture_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                    picture_items[i].urlQuarter = urlQuarter; //jack in teh signed urls into the object array
                    picture_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array
                    picture_items[i].urlStandard = urlStandard; //jack in teh signed urls into the object array
                    if (picture_items[i].orientation == "equirectangular") { //add the big one for skyboxes
                        var urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + originalName, Expires: 6000});
                        picture_items[i].urlOriginal = urlOriginal;
                    }
                    if (picture_items[i].hasAlphaChannel == null) {picture_items[i].hasAlphaChannel = false}
                    //pathResponse.path.pictures.push(urlThumb, urlQuarter, urlHalf, urlStandard);
                    if (picture_items[i].tags != null && picture_items[i].tags.length < 1) {picture_items.tags = [""]}

                }
                pictureResponse = picture_items ;
                callback(null);
            },

            function (callback) {
                var postcards = [];
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    async.each (sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting postcatd items: " + err);
//                                        callback(err);
//                                        callback(null);
                                callbackz();
                            } else {
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});

                                var postcard = {};
                                postcard.userID = picture_item.userID;
                                postcard._id = picture_item._id;
                                postcard.sceneID = picture_item.postcardForScene;
                                postcard.urlThumb = urlThumb;
                                postcard.urlHalf = urlHalf;
                                postcard.urlStandard = urlStandard;
                                if (postcards.length < 9)
                                    postcards.push(postcard);
//                                        console.log("pushing postcard: " + JSON.stringify(postcard));
                                callbackz();
                            }
                        });

                }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, postcards);
                        } else {
                            console.log('All files have been processed successfully');
                            callback(null, postcards);
//                                        };
                        }
                    });
                } else {
//                      callback(null);
                    callback(null, postcards);
                }
            },

            function (postcardResponse, callback) {
                //assemble all response elements
                sceneResponse.audio = audioResponse;
                sceneResponse.pictures = pictureResponse;
                sceneResponse.postcards = postcardResponse;
                callback(null);
            },

            function (callback) {
                var modelz = [];
//                console.log("sceneObjects : " + JSON.stringify(sceneResponse.sceneObjects));
                if (sceneResponse.sceneModels != null) {
                    async.each (sceneResponse.sceneModels, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("7798 tryna get sceneModels: " + objID);
                        db.models.findOne({"_id": oo_id}, function (err, model) {
                            if (err || !model) {
                                console.log("error getting model: " + err);
                                callbackz();
                            } else {
                                // console.log("got user models:" + JSON.stringify(models));
                                let url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + model.userID + "/gltf/" + model.filename, Expires: 6000});
                                model.url = url;
                                modelz.push(model);
                                callbackz();
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null);
                        } else {
                            console.log('modelz have been added to scene.modelz');
                            objectResponse = modelz;
                            sceneResponse.sceneModelz = objectResponse;
                            callback(null);
                        }
                    });
                } else {
                    callback(null);
                }
            },
            function (callback) { //add object groups to scene object list
                var objexgroups = [];
                // if (sceneResponse.sceneObjectGroups) {
                    if (sceneResponse.sceneObjectGroups != null) {
                        async.each (sceneResponse.sceneObjectGroups, function (objID, callbackz) { //nested async-ery!
                            var oo_id = ObjectID(objID);
                            console.log("tryna get GroupObject: " + objID);
                            db.groups.findOne({"_id": oo_id}, function (err, group) {
                                if (err || !group) {
                                    console.log("error getting obj items: " + err);
                                    callbackz();
                                } else {
                                    console.log("gotsome groupObjects to add to sceneObjects : "+ JSON.stringify(group));
                                    // sceneResponse.sceneObjects = sceneResponse.sceneObjects.concat(group.items);
                                    objexgroups.push(group);
                                    callbackz();
                                }
                            });
                        }, function(err) {
                           
                            if (err) {
                                
                                
                                console.log('A file failed to process');
                                callback(err);
                            } else {
                                console.log('groupObjects have been added to sceneObjects');
                                sceneResponse.sceneObjexGroups = objexgroups;
                                callback(null);
                            }
                        });
                    } else {
                        callback(null);
                    }
            },
            

            function (callback) {
                var objex = [];
                console.log("tryna fetch all the sceneObjects: " + JSON.stringify(sceneResponse.sceneObjects));
//                console.log("sceneObjects : " + JSON.stringify(sceneResponse.sceneObjects));
                if (sceneResponse.sceneObjects != null) {
                    async.each (sceneResponse.sceneObjects, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("4573 tryna get sceneObject: " + objID);
                        db.obj_items.findOne({"_id": oo_id}, function (err, obj_item) {
                            if (err || !obj_item) {
                                console.log("error getting obj items: " + err);
                                callbackz();
                            } else {

                                //console.log("4580 tryna find childObjectIDs: " + JSON.stringify(obj_item.childObjectIDs));
                                obj_item.objectGroup = "none";
                                if (obj_item.childObjectIDs != null && obj_item.childObjectIDs.length > 0) {
                                    var childIDs = obj_item.childObjectIDs.map(convertStringToObjectID); //convert child IDs array to objIDs
                                    db.obj_items.find({_id : {$in : childIDs}}, function(err, obj_items) {
                                        if (err || !obj_items) {
                                            console.log("error getting childObject items: " + err);
                                            //res.send("error getting child objects");
                                            objex.push(obj_item);
                                            callbackz();
                                        } else {
                                            childObjects = obj_items;
                                            console.log("childObjects: " + JSON.stringify(childObjects));
                                            obj_item.childObjects = childObjects;
                                            objex.push(obj_item);
                                            callbackz();
                                        }
                                    });
                                } else {
                                    objex.push(obj_item);
                                    callbackz();
                                }
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, objex);
                        } else {
                            console.log('objects have been added to scene.objex');
                            objectResponse = objex;
                            sceneResponse.sceneObjex = objectResponse;
                            callback(null, objex);
                        }
                    });
                } else {
                    callback(null, objex);
                }
            },
            function (objex, callback) { //inject username, last step (since only id is in scene doc)

                if ((sceneResponse.userName == null || sceneResponse.userName.length < 1) && (sceneResponse.user_id != null)) {

                    var oo_id = ObjectID(sceneResponse.user_id);
                    db.users.findOne({_id: oo_id}, function (err, user) {
                        if (!err || user != null) {
                            console.log("tryna inject usrname: " + user.userName);
                            sceneResponse.userName = user.userName;
                            callback(null);
                        }
                    });

                } else  {
                    callback(null);
                }
            }
        ], //waterfall end

        function (err, result) { // #last function, close async
            res.json(sceneResponse);
            console.log("waterfall done for scene response");
        }
    );
});

//is this still used?
app.get('/uuscene/:user_id/:scene_id',  checkAppID, requiredAuthentication, uscene, function (req, res) { //view for updating scene for this user

    console.log("tryna get scene " + req.params.scene_id);
    var sceneID = req.params.scene_id.toString().replace(":", "");
    // var o_id = new ObjectId.createFromHexString(sceneID);
    var o_id = ObjectID(sceneID);
    console.log("tryna get scene: " + sceneID);
    db.scenes.findOne({ _id : o_id}, function(err, scene) {
        if (err || !scene) {
            console.log("cain't get no scene... " + err);
        } else {
//            console.log(JSON.stringify(scenes));

            if (scene.sceneWebLinks != null && scene.sceneWebLinks.length > 0) {
                for (var i = 0; i < scene.sceneWebLinks.length; i++) { //refresh themz
                    console.log("sceneWebLink id: " + scene.sceneWebLinks[i].link_id);
                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: scene.sceneWebLinks[i].link_id + ".thumb.jpg", Expires: 6000});
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: scene.sceneWebLinks[i].link_id + ".half.jpg", Expires: 6000});
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: scene.sceneWebLinks[i].link_id + ".standard.jpg", Expires: 6000});
                    scene.sceneWebLinks[i].urlThumb = urlThumb;
                    scene.sceneWebLinks[i].urlHalf = urlHalf;
                    scene.sceneWebLinks[i].urlStandard = urlStandard;

                }
            }

            if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                var postcards = [];
//              for (var i = 0; i < sceneResponse.scenePostcards.length; i++) { //refresh themz
                async.each (scene.scenePostcards, function (postcardID, callbackz) {
//                                console.log("scenepostcard id: " + sceneResponse.scenePostcards[i]);
//                    console.log("scenepostcard id: " + postcardID);
                    var oo_id = ObjectID(postcardID);
                    db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                        if (err || !picture_item) {
                            console.log("error getting picture items 1: " + err);
//                                        callback(err);
//                                        callback(null);
                            callbackz();
                        } else {
                            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});

                            var postcard = {};
                            postcard.userID = picture_item.userID;
                            postcard._id = picture_item._id;
                            postcard.sceneID = scene._id;
                            postcard.sceneShortID = scene.short_id;
                            postcard.urlThumb = urlThumb;
                            postcard.urlHalf = urlHalf;
                            postcards.push(postcard);
//                            console.log("pushing postcard: " + JSON.stringify(postcard));
                            callbackz();
                        }

                    });

                }, function(err) {
                   
                    if (err) {
                        
                        
                        console.log('A file failed to process');
//                        callback(null, postcards);
                    } else {
                        console.log('All files have been processed successfully');
//                        callback(null, postcards);
//                                        };
                        scene.postcards = postcards;
                        res.send(scene);
                    }
                });

            } else {
                res.send(scene);
            }
        }
    });
});

app.get('/availablescenes/:_id',  requiredAuthentication, function (req, res) {

    var availableScenesResponse = {};
    var availableScenes = [];
    availableScenesResponse.availableScenes = availableScenes;

    //mongolian "OR" syntax...
    db.scenes.find( {$and: [{ "user_id": req.params._id}, { sceneShareWithPublic: true }]}, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
        } else {
            async.each(scenes,
                function (scene, callback) {
                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                        var oo_id = ObjectID(scene.scenePostcards[0]); //TODO randomize? or ensure latest?  or use assigned default?
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item || picture_item.length == 0) {
                                console.log("error getting postcard for availablescenes: 2" + err);
                            } else {
                                var item_string_filename = JSON.stringify(picture_item.filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                    console.log(baseName);
                                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                                var halfName = 'half.' + baseName + item_string_filename_ext;
                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                                var standardName = 'standard.' + baseName + item_string_filename_ext;
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                var availableScene = {
                                    sceneDomain: scene.sceneDomain,
                                    sceneTitle: scene.sceneTitle,
                                    sceneKey: scene.short_id,
                                    sceneDescription: scene.sceneDescription,
                                    sceneKeynote: scene.sceneKeynote,
                                    sceneAndroidOK: scene.sceneAndroidOK,
                                    sceneIosOK: scene.sceneIosOK,
                                    sceneWindowsOK: scene.sceneWindowsOK,
                                    sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                    sceneOwner: scene.userName ? "" : scene.userName,
                                    scenePostcardQuarter: urlQuarter,
                                    scenePostcardHalf: urlHalf
                                };
                                availableScenesResponse.availableScenes.push(availableScene);
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                },
                function (err) {
                    res.send(availableScenesResponse);
                }
            );
        }
    });
});
/* //superfluous
app.get('/domain_scenes/:domain',  function (req, res) {
    var availableScenesResponse = {};
    var availableScenes = [];
    availableScenesResponse.availableScenes = availableScenes;
    console.log("tryna get domain " + req.params.domain);
    //mongolian "OR" syntax...
    db.scenes.find( {$and: [{ "sceneDomain": req.params.domain}, { sceneShareWithPublic: true }]}, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
        } else {
            async.each(scenes,
                function (scene, callback) {
                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                        var oo_id = ObjectID(scene.scenePostcards[0]); //TODO randomize? or ensure latest?  or use assigned default?
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting postcard for availablescenes: 2" + err);

                            } else {
                                var item_string_filename = JSON.stringify(picture_item.filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                    console.log(baseName);
                                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                                var halfName = 'half.' + baseName + item_string_filename_ext;
                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                                var standardName = 'standard.' + baseName + item_string_filename_ext;
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                var primaryAudioUrl = "";
                                var availableScene = {
                                    sceneTitle: scene.sceneTitle,
                                    sceneKey: scene.short_id,
                                    sceneDescription: scene.sceneDescription,
                                    sceneKeynote: scene.sceneKeynote,
                                    sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                    sceneOwner: scene.userName ? "" : scene.userName,
//                                    scenePrimaryAudioUrl: primaryAudioUrl,
                                    scenePostcardQuarter: urlQuarter,
                                    scenePostcardHalf: urlHalf
                                };
//                                if (scene.scenePrimaryAudioID != null) {
//                                    var o_id = ObjectID(scene.scenePrimaryAudioID);
//
//                                    db.audio_items.findOne({_id: o_id}, function (err, audio_item) {
//                                        if (err || !audio_item) {
//                                            console.log("error getting audio items: " + err);
//                                            callback();
//                                        } else {
//                                            var item_string_filename = JSON.stringify(audio_item.filename);
//                                            console.log("audio filename: " + item_string_filename);
//                                            item_string_filename = item_string_filename.replace(/\"/g, "");
//                                            var item_string_filename_ext = getExtension(item_string_filename);
//                                            var expiration = new Date();
//                                            expiration.setMinutes(expiration.getMinutes() + 1000);
//                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                            //console.log(baseName);
//                                            var mp3Name = baseName + '.mp3';
//                                            var primaryAudioUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID, Key: audio_item._id + "." + mp3Name, Expires: 60000});
////                                            availableScene.primaryAudioUrl = primaryAudioUrl;
//
//                                        }
//                                    });
//                                }


                                availableScenesResponse.availableScenes.push(availableScene);
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                },
                function (err) {
                    res.send(availableScenesResponse);
                }
            );
        }
    });
});
*/
app.get('/available_user_scenes/:user_id', requiredAuthentication, function(req,res){ //authenticated scenes, either owned by user or accessible via acl
    var availableScenesResponse = {};
    var availableScenes = [];
    var availableScene = {};
    availableScenesResponse.availableScenes = availableScenes;
    console.log("tryna get domain " + req.params.domain);
    //mongolian "OR" syntax...
    var query = {user_id: req.params.user_id};
    // if (req.params.domain == "servicemedia.net") { //show all public scenes for servicemedia
    //     query = {sceneShareWithPublic: true};
    // } else {
    //     query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }]};
    // }
    // db.scenes.find( {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }]}, function (err, scenes) {
        db.scenes.find( query, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
        } else {
            console.log("gots " + scenes.length + " scenes")
            async.each(scenes,
                function (scene, cb) {
                    availableScene = {};
                    console.log("scene name : " + scene.sceneTitle);
                    async.waterfall([
                            function (callback) {
                                if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                                    var oo_id = ObjectID(scene.scenePostcards[0]); //TODO randomize? or ensure latest?  or use assigned default?
                                    db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                        if (err || !picture_item) {
                                            console.log("error getting postcard for availablescenes: 2" + err);
                                            cb();
                                        } else {
                                            var item_string_filename = JSON.stringify(picture_item.filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 30);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                                            // var standardName = 'standard.' + baseName + item_string_filename_ext;
                                            var halfName = 'half.' + baseName + item_string_filename_ext;
                                            var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                            var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                            availableScene = {
                                                sceneTitle: scene.sceneTitle,
                                                sceneKey: scene.short_id,
                                                sceneType: scene.sceneType,
                                                sceneLastUpdate: scene.sceneLastUpdate,
                                                sceneDescription: scene.sceneDescription,
                                                sceneKeynote: scene.sceneKeynote,
                                                sceneAndroidOK: scene.sceneAndroidOK,
                                                sceneIosOK: scene.sceneIosOK,
                                                sceneWindowsOK: scene.sceneWindowsOK,
                                                sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                sceneOwner: scene.userName ? "" : scene.userName,
                                                scenePostcardQuarter: urlQuarter,
                                                scenePostcardHalf: urlHalf
                                            };
                                            callback(null, availableScene);
                                        }
                                    });
                                } else {
                                    cb(); //no postcards, next...
                                }
                            },

                            function (avScene, callback) {
                                console.log ("tryna get audio " + scene.scenePrimaryAudioID + " for " + JSON.stringify(avScene) );
                                if (scene.scenePrimaryAudioID != null) {
                                    var o_id = ObjectID(scene.scenePrimaryAudioID );

                                    db.audio_items.findOne({_id: o_id}, function (err, audio_item) {
                                        if (err || !audio_item) {
                                            console.log("error getting audio items: " + err);
                                            callback(null,err);
                                        } else {
                                            var item_string_filename = JSON.stringify(audio_item.filename);
                                            console.log("audio filename: " + item_string_filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 1000);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            //console.log(baseName);
                                            var mp3Name = baseName + '.mp3';
                                            var primaryAudioUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, Expires: 60000});
                                            avScene.primaryAudioUrl = primaryAudioUrl;
                                            console.log("tryna push " + primaryAudioUrl + " to scene number " + availableScenesResponse.availableScenes.length);
                                            availableScenesResponse.availableScenes.push(avScene);
                                            callback(null, 'done');
                                        }
                                    });
                                } else {
                                    availableScenesResponse.availableScenes.push(avScene);
                                    callback(null, 'done');
                                }
                            }
                        ], //waterfall async end
                        function (err, result) { // #last function, close async
                            console.log("available domain scene waterfall done: " + result);
                            cb();
                        }
                    );
                }, // each scene async end
                function (err) {
//                    callbag();
                    availableScenesResponse.availableScenes.sort(function(a, b) {
                        return b.sceneLastUpdate - a.sceneLastUpdate;
                    });
                    JSON.stringify(availableScenesResponse);
                    res.send(availableScenesResponse);
                }
            );
        }
    });
});
// app.get('/designated ')
app.get('/available_domain_scenes/:domain',  function (req, res) { //public scenes for this app's domain name, used by public websites
    var availableScenesResponse = {};
    var availableScenes = [];
    var availableScene = {};
    availableScenesResponse.availableScenes = availableScenes;
    console.log("tryna get domain " + req.params.domain + " adn id " + req.params.user_id);
    //mongolian "OR" syntax...
    var query = {};
    if (req.params.domain == "servicemedia.net") { //show all public scenes for servicemedia
        query = {sceneShareWithPublic: true};
        // if (req.params.user_id != null && req.params.user_id.Length > 8)
        // query = {$and: [{ "user_id": req.params.user_id}, {sceneShareWithPublic: true }]}; //also all scenes with this user_id
    } else {
        query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }]};
        // if (req.params.user_id != null && req.params.user_id.Length > 8)
        // query = {$and: [{ "sceneDomain": req.params.domain}, { "user_id": req.params.user_id}, {sceneShareWithPublic: true }]}; //also all scenes with this user_id
    }
    // db.scenes.find( {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }]}, function (err, scenes) {
        db.scenes.find( query, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
        } else {
            console.log("gots " + scenes.length + " scenes")
            async.each(scenes,
                function (scene, cb) {
                    availableScene = {};
                    // console.log("scene name : " + scene.sceneTitle);
                    async.waterfall([
                            function (callback) {
                                if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                                    var postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                                    var oo_id = ObjectID(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                                    db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                        if (err || !picture_item) {
                                            console.log("error getting postcard for availablescenes: 2" + err);
                                            if (req.params.user_id != null && req.params.user_id && req.params.user_id == scene.user_id) { //show incomplete scenes by this user
                                                availableScene = {
                                                    sceneTitle: scene.sceneTitle,
                                                    sceneKey: scene.short_id,
                                                    sceneType: scene.sceneType,
                                                    sceneLastUpdate: scene.sceneLastUpdate,
                                                    sceneDescription: scene.sceneDescription,
                                                    sceneKeynote: scene.sceneKeynote,
                                                    sceneAndroidOK: scene.sceneAndroidOK,
                                                    sceneIosOK: scene.sceneIosOK,
                                                    sceneWindowsOK: scene.sceneWindowsOK,
                                                    sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                    sceneOwner: scene.userName ? "" : scene.userName,
                                                    scenePostcardQuarter: "nilch",
                                                    scenePostcardHalf: "nilch",
                                                    sceneAndroidOK: scene.sceneAndroidOK,
                                                    sceneIosOK: scene.sceneIosOK,
                                                    sceneWindowsOK: scene.sceneWindowsOK
                                                };
                                                callback(null, availableScene);
                                            } else {
                                                cb(); //no postcards, next...
                                            }
                                        } else {
                                            var item_string_filename = JSON.stringify(picture_item.filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 30);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                                            // var standardName = 'standard.' + baseName + item_string_filename_ext;
                                            var halfName = 'half.' + baseName + item_string_filename_ext;
                                            var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                            var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                            availableScene = {
                                                sceneTitle: scene.sceneTitle,
                                                sceneKey: scene.short_id,
                                                sceneType: scene.sceneType,
                                                sceneLastUpdate: scene.sceneLastUpdate,
                                                sceneDescription: scene.sceneDescription,
                                                sceneKeynote: scene.sceneKeynote,
                                                // sceneWebGLOK: scene.sceneWebGLOK,
                                                sceneAndroidOK: scene.sceneAndroidOK,
                                                sceneIosOK: scene.sceneIosOK,
                                                sceneWindowsOK: scene.sceneWindowsOK,
                                                sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                sceneOwner: scene.userName ? "" : scene.userName,
                                                scenePostcardQuarter: urlQuarter,
                                                scenePostcardHalf: urlHalf
                                            };
                                            callback(null, availableScene);
                                        }
                                    });
                                } else {
                                    if (req.params.user_id != null && req.params.user_id && req.params.user_id == scene.user_id) { //show incomplete scenes by this user
                                        availableScene = {
                                            sceneTitle: scene.sceneTitle,
                                            sceneKey: scene.short_id,
                                            sceneType: scene.sceneType,
                                            sceneLastUpdate: scene.sceneLastUpdate,
                                            sceneDescription: scene.sceneDescription,
                                            sceneKeynote: scene.sceneKeynote,
                                            // sceneWebGLOK: scene.sceneWebGLOK,
                                            sceneAndroidOK: scene.sceneAndroidOK,
                                            sceneIosOK: scene.sceneIosOK,
                                            sceneWindowsOK: scene.sceneWindowsOK,
                                            sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                            sceneOwner: scene.userName ? "" : scene.userName,
                                            scenePostcardQuarter: "nilch",
                                            scenePostcardHalf: "nilch"
                                        };
                                        callback(null, availableScene);
                                    } else {
                                        cb(); //no postcards, next...
                                    }
                                }
                            },
                            function (avScene, callback) {
                                // console.log ("tryna get audio " + scene.scenePrimaryAudioID + " for " + JSON.stringify(avScene) );
                                if (scene.scenePrimaryAudioStreamURL != null && scene.scenePrimaryAudioStreamURL != "" && scene.scenePrimaryAudioStreamURL.length > 6) { 
                                    avScene.scenePrimaryAudioStreamURL = scene.scenePrimaryAudioStreamURL;
                                }
                                if (scene.scenePrimaryAudioID != null && scene.scenePrimaryAudioID != "" && scene.scenePrimaryAudioID.length > 8) {
                                    var o_id = ObjectID(scene.scenePrimaryAudioID );

                                    db.audio_items.findOne({_id: o_id}, function (err, audio_item) {
                                        if (err || !audio_item) {
                                            console.log("error getting audio items: " + err);
                                            callback(null,err);
                                        } else {
                                            var item_string_filename = JSON.stringify(audio_item.filename);
                                            // console.log("audio filename: " + item_string_filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 1000);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            //console.log(baseName);
                                            var mp3Name = baseName + '.mp3';
                                            var primaryAudioUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, Expires: 60000});
                                            avScene.primaryAudioUrl = primaryAudioUrl;
                                            // console.log("tryna push " + primaryAudioUrl + " to scene number " + availableScenesResponse.availableScenes.length);
                                            availableScenesResponse.availableScenes.push(avScene);
                                            callback(null, 'done');
                                        }
                                    });
                                } else {
                                    availableScenesResponse.availableScenes.push(avScene);
                                    callback(null, 'done');
                                }
                            }
                        ], //waterfall async end
                        function (err, result) { // #last function, close async
                            // console.log("available domain scene waterfall done with count: " + availableScenesResponse.availableScenes.length);
                            cb();
                        }
                    );
                }, // each scene async end
                function (err) {
//                    callbag();
                    availableScenesResponse.availableScenes.sort(function(a, b) {
                        return b.sceneLastUpdate - a.sceneLastUpdate;
                    });
                    JSON.stringify(availableScenesResponse);
                    res.send(availableScenesResponse);
                }
            );
        }
    });
});

app.get('/available_domain_scenes/:domain/:user_id/:platform_id',  requiredAuthentication, function (req, res) { //public scenes for this app's domain name, w/ platform filter //TODO authenticate, check acl

    var availableScenesResponse = {};
    var availableScenes = [];
    var availableScene = {};
    var query = {};
    availableScenesResponse.availableScenes = availableScenes;
    var userStatus = "nilch";

    async.waterfall([
        function (callback) { //do the user lookup
            console.log("tryna lookup user id " + req.params.user_id);
            if (req.params.user_id != "nilch" && req.params.user_id != "guest" && req.params.user_id != "") {
                var oo_id = ObjectID(req.params.user_id);
                db.users.findOne({_id: oo_id}, function (err, user) {   //check user status
                    if (err != null) {
                        console.log("error finding user " + req.params.user_id);
                        callback(err);
                    } else {
                        console.log("gotsa user " + user._id + " authLevel " + user.authLevel + " status " + user.status);
                        if (user.authLevel != null && user.authLevel != undefined &&  user.status == "validated") {
                        userStatus = "subscriber";
                        console.log("gotsa subscriber!");
                        }
                        callback();
                    }
                });
            } else {
                callback();
            }
        },
        function (calllback) {
            var platformString = "";
            if (req.params.platform_id == "1") {
                platformString = "sceneWindowsOK";
            } else if (req.params.platform_id == "2") {
                platformString = "sceneAndroidOK";
            } else if (req.params.platform_id == "3") {
                platformString = "sceneIosOK";
            } else if (req.params.platform_id == "4") {
                platformString = "sceneWebGLOK";
            }
            if (req.params.domain == "servicemedia.net") { //guest query?  show all public scenes for servicemedia
                // query = {sceneShareWithPublic: true};
                query = {$and: [{ [platformString]: true}, {sceneShareWithPublic: true }, {sceneStickyness: { $lt: 4 }}]};
                // if (req.params.user_id != null && req.params.user_id.Length > 8)
                // query = {$or: [{ "user_id": req.params.user_id}, {sceneShareWithPublic: true }]}; //also all scenes with this user_id
            } else {
                query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }, { [platformString]: true}]};
                // if (req.params.user_id != null && req.params.user_id.Length > 8)
                // query = {$or: [{ "sceneDomain": req.params.domain}, { "user_id": req.params.user_id}, {sceneShareWithPublic: true }]};
            }
            if (userStatus == "subscriber") { //not public
                if (req.params.domain == "servicemedia.net") {
                    query = {$and: [{ [platformString]: true}, {$or: [{ "user_id": req.params.user_id}, {sceneShareWithSubscribers: true }, {sceneShareWithPublic: true }]}]};
                } else {
                    query = {$and: [{ [platformString]: true}, { "sceneDomain": req.params.domain}, {$or: [{ "user_id": req.params.user_id}, {sceneShareWithSubscribers: true }, {sceneShareWithPublic: true }]}]};
                }
            }

            console.log("scene query : " + JSON.stringify(query));
            db.scenes.find( query, function (err, scenes) {
            if (err || !scenes) {
                console.log("cain't get no scenes... " + err);
                calllback(err);
            } else {
                console.log("gots " + scenes.length + " scenes");
                async.each(scenes,
                    function (scene, cb) {
                        availableScene = {};
                        // console.log("scene name : " + scene.sceneTitle);
                        async.waterfall([ //ooo, nested waterfall
                                function (callback) {
                                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                                        var postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                                        var oo_id = ObjectID(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                            if (err || !picture_item) {
                                                console.log("error getting postcard for availablescenes: 2" + err);
                                                if (req.params.user_id != null && req.params.user_id && req.params.user_id == scene.user_id) { //show incomplete scenes by this user
                                                    availableScene = {
                                                        sceneTitle: scene.sceneTitle,
                                                        sceneKey: scene.short_id,
                                                        sceneType: scene.sceneType,
                                                        sceneLastUpdate: scene.sceneLastUpdate,
                                                        sceneDescription: scene.sceneDescription,
                                                        sceneKeynote: scene.sceneKeynote,
                                                        sceneAndroidOK: scene.sceneAndroidOK,
                                                        sceneIosOK: scene.sceneIosOK,
                                                        sceneWindowsOK: scene.sceneWindowsOK,
                                                        sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                        sceneOwner: scene.userName ? "" : scene.userName,
                                                        scenePostcardQuarter: "nilch",
                                                        scenePostcardHalf: "nilch"
                                                    };
                                                    callback(null, availableScene);
                                                } else {
                                                    cb(); //no postcards, next...
                                                }
                                            } else {
                                                var item_string_filename = JSON.stringify(picture_item.filename);
                                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                                var item_string_filename_ext = getExtension(item_string_filename);
                                                var expiration = new Date();
                                                expiration.setMinutes(expiration.getMinutes() + 30);
                                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                                // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                                                // var standardName = 'standard.' + baseName + item_string_filename_ext;
                                                var halfName = 'half.' + baseName + item_string_filename_ext;
                                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                                var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                                availableScene = {
                                                    sceneTitle: scene.sceneTitle,
                                                    sceneKey: scene.short_id,
                                                    sceneType: scene.sceneType,
                                                    sceneLastUpdate: scene.sceneLastUpdate,
                                                    sceneDescription: scene.sceneDescription,
                                                    sceneKeynote: scene.sceneKeynote,
                                                    sceneAndroidOK: scene.sceneAndroidOK,
                                                    sceneIosOK: scene.sceneIosOK,
                                                    sceneWindowsOK: scene.sceneWindowsOK,
                                                    sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                    sceneOwner: scene.userName ? "" : scene.userName,
                                                    scenePostcardQuarter: urlQuarter,
                                                    scenePostcardHalf: urlHalf
                                                };
                                                callback(null, availableScene);
                                            }
                                        });
                                    } else {
                                        if (req.params.user_id != null && req.params.user_id && req.params.user_id == scene.user_id) { //show incomplete scenes by this user
                                            availableScene = {
                                                sceneTitle: scene.sceneTitle,
                                                sceneKey: scene.short_id,
                                                sceneType: scene.sceneType,
                                                sceneLastUpdate: scene.sceneLastUpdate,
                                                sceneDescription: scene.sceneDescription,
                                                sceneKeynote: scene.sceneKeynote,
                                                sceneAndroidOK: scene.sceneAndroidOK,
                                                sceneIosOK: scene.sceneIosOK,
                                                sceneWindowsOK: scene.sceneWindowsOK,
                                                sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                sceneOwner: scene.userName ? "" : scene.userName,
                                                scenePostcardQuarter: "nilch",
                                                scenePostcardHalf: "nilch"
                                            };
                                            callback(null, availableScene);
                                        } else {
                                            cb(); //no postcards, next...
                                        }
                                    }
                            },
                            function (avScene, callback) {
                                // console.log ("tryna get audio " + scene.scenePrimaryAudioID + " for " + JSON.stringify(avScene) );
                                if (scene.scenePrimaryAudioID != null && ObjectID.isValid(scene.scenePrimaryAudioID)) {
                                    var o_id = ObjectID(scene.scenePrimaryAudioID);
                                    db.audio_items.findOne({_id: o_id}, function (err, audio_item) {
                                        if (err || !audio_item) {
                                            console.log("error getting audio items: " + err);
                                            callback(null,err);
                                        } else {
                                            var item_string_filename = JSON.stringify(audio_item.filename);
                                            // console.log("audio filename: " + item_string_filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 1000);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            //console.log(baseName);
                                            var mp3Name = baseName + '.mp3';
                                            var primaryAudioUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, Expires: 60000});
                                            avScene.primaryAudioUrl = primaryAudioUrl;
                                            // console.log("tryna push " + primaryAudioUrl + " to scene number " + availableScenesResponse.availableScenes.length);
                                            availableScenesResponse.availableScenes.push(avScene);
                                            callback(null, 'done');
                                        }
                                    });
                                } else {
                                    availableScenesResponse.availableScenes.push(avScene);
                                    callback(null, 'done');
                                }
                            }
                        ], //inner waterfall async end
                        function (err, result) { // #last function, close async
                            // console.log("available domain scene waterfall done with count: " + availableScenesResponse.availableScenes.length);
                                    cb();
                                }
                            );
                            // calllback();
                        }, // each scene async end
                    function (err) {// outer waterfall, including user lookup
    //                    callbag();
                        availableScenesResponse.availableScenes.sort(function(a, b) {
                            return b.sceneLastUpdate - a.sceneLastUpdate;
                        });
                        JSON.stringify(availableScenesResponse);
                        res.send(availableScenesResponse);
                        }
                    );
                }
            });
        }
    ], //waterfall async end
    function (err, result) { // #last function, close async
        console.log("available domain scene waterfall done with count: " + availableScenesResponse.availableScenes.length);
        // callback();
        }
    );
});


/* // um, dunno...
app.post('/linkable_scenes/',  function (req, res) {

    var availableScenesResponse = {};
    var availableScenes = [];
    var availableScene = {};
    availableScenesResponse.availableScenes = availableScenes;
    console.log("tryna get list of available scenes " + req.body.scenes);
    //mongolian "OR" syntax...

    db.scenes.find( {$and: [{ "sceneDomain": req.params.domain}, { sceneShareWithPublic: true }]}, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
        } else {
            console.log("gots " + scenes.length + " scenes")
            async.each(scenes,

                function (scene, cb) {
                    availableScene = {};
                    console.log("scene name : " + scene.sceneTitle);
                    async.waterfall([

                            function (callback) {

                                if (scene.scenePostcards != null && scene.scenePostcards.length > 0) {
                                    var oo_id = ObjectID(scene.scenePostcards[0]); //TODO randomize? or ensure latest?  or use assigned default?
                                    db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                        if (err || !picture_item) {
                                            console.log("error getting postcard for availablescenes: 2" + err);
                                            cb();
                                        } else {

                                            var item_string_filename = JSON.stringify(picture_item.filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 30);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                    console.log(baseName);
                                            var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                                            var halfName = 'half.' + baseName + item_string_filename_ext;
                                            var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                                            var standardName = 'standard.' + baseName + item_string_filename_ext;

                                            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                            var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                            availableScene = {
                                                sceneTitle: scene.sceneTitle,
                                                sceneKey: scene.short_id,
                                                sceneLastUpdate: scene.sceneLastUpdate,
                                                sceneDescription: scene.sceneDescription,
                                                sceneKeynote: scene.sceneKeynote,
                                                sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                                sceneOwner: scene.userName ? "" : scene.userName,
                                                scenePostcardQuarter: urlQuarter,
                                                scenePostcardHalf: urlHalf
                                            };


                                            callback(null, availableScene);
                                        }

                                    });
                                } else {
//                                    callback(null, err);
                                    cb();
                                }
                            },

                            function (avScene, callback) {
                                console.log ("tryna get audio " + scene.scenePrimaryAudioID + " for " + JSON.stringify(avScene) );
                                if (scene.scenePrimaryAudioID != null) {
                                    var o_id = ObjectID(scene.scenePrimaryAudioID );

                                    db.audio_items.findOne({_id: o_id}, function (err, audio_item) {
                                        if (err || !audio_item) {
                                            console.log("error getting audio items: " + err);
//                                            availableScenesResponse.availableScenes.push(availableScene);
                                            callback(null,err);
                                        } else {
                                            var item_string_filename = JSON.stringify(audio_item.filename);
                                            console.log("audio filename: " + item_string_filename);
                                            item_string_filename = item_string_filename.replace(/\"/g, "");
                                            var item_string_filename_ext = getExtension(item_string_filename);
                                            var expiration = new Date();
                                            expiration.setMinutes(expiration.getMinutes() + 1000);
                                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                            //console.log(baseName);
                                            var mp3Name = baseName + '.mp3';
                                            var primaryAudioUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_item.userID + "/" + audio_item._id + "." + mp3Name, Expires: 60000});

                                            avScene.primaryAudioUrl = primaryAudioUrl;

//                                            availableScenesResponse.availableScenes.push(availableScene);

                                            console.log("tryna push " + primaryAudioUrl + " to scene number " + availableScenesResponse.availableScenes.length);
                                            availableScenesResponse.availableScenes.push(avScene);
//                                            callback(); //send them along
                                            callback(null, 'done');
                                        }
                                    });
                                } else {
                                    availableScenesResponse.availableScenes.push(avScene);
                                    callback(null, 'done');
                                }
//                                callback(null, 'done');
//                                callback();

                            }


                        ], //waterfall async end
                        function (err, result) { // #last function, close async
//                            res.json(sceneResponse);

//                            console.log("waterfall done: " + result);
                            console.log("waterfall done: " + result);
                            cb();
//                            cb();
//                            callback();
//                            cb();
                        }


                    );


                }, // each scene async end
                function (err) {
//                    callbag();
                    JSON.stringify(availableScenesResponse);
                    res.send(availableScenesResponse);

                }
            );
        }
    });
});
*/
app.get('/publicscenes', function (req, res) { //deprecated, see available scenes above...
    console.log("host is " + req.get('host'));
    // if (req.get('host') == "servicemedia.net") {
     
    var availableScenesResponse = {};
    var availableScenes = [];
    availableScenesResponse.availableScenes = availableScenes;

    // query = {$and: [{ "sceneDomain": req.params.domain}, {sceneShareWithPublic: true }, { [platformString]: true}]};
    db.scenes.find({$and: [{sceneShareWithPublic: true}, {sceneStickyness: {$lt: 4}}]}, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no publicscenes... " + err);

        } else {
            console.log("gots " + scenes.length + "publicscenes...");
            async.each(scenes,
                // 2nd param is the function that each item is passed to
                function (scene, callback) {
                    // Call an asynchronous function, often a save() to DB
                    //            scene.someAsyncCall(function () {
                    // Async call is done, alert via callback
                    if (scene.scenePostcards != null && scene.scenePostcards.length > 0 && scene.scenePostcards[0] != undefined) {
                        postcardIndex = getRandomInt(0, scene.scenePostcards.length - 1);
//                        db.image_items.find({postcardForScene: scene.short_id}).sort({otimestamp: -1}).limit(maxItems).toArray(function (err, picture_items) {
//                    console.log("tryna find postcard: " + scene.scenePostcards[postcardIndex]);
                        var oo_id = ObjectID(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {

                            if (err || !picture_item || picture_item.length == 0) {
                                console.log("error getting picture items: 3" + JSON.stringify(scene.scenePostcards[postcardIndex]));

                            } else {
//                                console.log("# " + picture_items.length);
//                                    for (var i = 0; i < 1; i++) {

                                var item_string_filename = JSON.stringify(picture_item.filename);
                                item_string_filename = item_string_filename.replace(/\"/g, "");
                                var item_string_filename_ext = getExtension(item_string_filename);
                                var expiration = new Date();
                                expiration.setMinutes(expiration.getMinutes() + 30);
                                var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                    console.log(baseName);
                                var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                                var halfName = 'half.' + baseName + item_string_filename_ext;
                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                                var standardName = 'standard.' + baseName + item_string_filename_ext;

//                            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID, Key: picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                var tempOwnerName = "test"
                                var availableScene = {
                                    sceneWindowsOK: scene.sceneWindowsOK,
                                    sceneAndroidOK: scene.sceneAndroidOK,
                                    sceneIosOK: scene.sceneIosOK,
                                    sceneDomain: scene.sceneDomain,
                                    sceneTitle: scene.sceneTitle,
                                    sceneKey: scene.short_id,
                                    sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
//                                  sceneOwner: scene.userName,
                                    sceneOwner: tempOwnerName,
                                    scenePostcardHalf: urlHalf,
                                    scenePostcardQuarter: urlQuarter
                                };
                                availableScenesResponse.availableScenes.push(availableScene);
                            }
    //                        console.log("publicScene: " + publicScene);
    //                        availableScenesResponse.availableScenes.push(availableScene);
    //                        console.log("publicScenesResponse :" + JSON.stringify(publicScenesResponse));
//                            publicScenes.push(publicScene);
//                                }
                            callback();
                        });
                    } else {
                        callback();
                    }
                },
                // 3rd param is the function to call when everything's done
                function (err) {
                    // All tasks are done now
//            doSomethingOnceAllAreDone();
//                console.log("publicScenesResponse :" + JSON.stringify(publicScenesResponse));
                    res.send(availableScenesResponse);
                }
            );
        }

    });
// } else {
//     res.redirect("https://servicemedia.net");
// }
});

app.get('/singlescenedata/:scenekey', function (req, res) { //returns a public scene id and standard url for postcard
    var availableScenesResponse = {};
    var availableScenes = [];
    var sckey = req.params.scenekey;
    availableScenesResponse.availableScenes = availableScenes;

    db.scenes.find({$or: [ { short_id: sckey }, { sceneTitle: sckey } ]}, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)
            res.send("scene not found");
        } else {
            console.log("got " + scenes.length + " scenes from req " + req.params.scenekey);
            // sceneIndex = getRandomInt(0, scenes.length - 1);
//            async.each(scenes,
            // 2nd param is the function that each item is passed to

            // Call an asynchronous function, often a save() to DB
            //            scene.someAsyncCall(function () {
            // Async call is done, alert via callback
            if (scenes[0].scenePostcards != null && scenes[0].scenePostcards.length > 0) {
                postcardIndex = getRandomInt(0, scenes[0].scenePostcards.length - 1);
//                        db.image_items.find({postcardForScene: scene.short_id}).sort({otimestamp: -1}).limit(maxItems).toArray(function (err, picture_items) {
                console.log("tryna find postcard: " + scenes[0].scenePostcards[postcardIndex]);
                var oo_id = ObjectID(scenes[0].scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {

                    if (err || !picture_item || picture_item.length == 0) {
                        console.log("error getting picture items for publicsimple" + JSON.stringify(scenes[0].scenePostcards[postcardIndex]));

                    } else {
//                                console.log("# " + picture_items.length);
//                                    for (var i = 0; i < 1; i++) {

                        var item_string_filename = JSON.stringify(picture_item.filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 30);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                        var halfName = 'half.' + baseName + item_string_filename_ext;

                        var scenedata = scenes[0].short_id + "~" + scenes[0].sceneTitle + "~" + baseName + "~"  + s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back a string and munge it
                        res.send(scenedata);
                    }
                });
            } else {
                var scenedata = scenes[0].short_id + "~" + scenes[0].sceneTitle + "~"  + "na" + "~https://servicemedia.s3.amazonaws.com/assets/pics/postcardna.png"; //no postcard but valid scene
                res.send(scenedata);
            }
        }
    });
});

app.get('/publicsinglerandom', function (req, res) { //returns a public scene id and standard url for postcard
    var availableScenesResponse = {};
    var availableScenes = [];
    availableScenesResponse.availableScenes = availableScenes;

    db.scenes.find({ sceneShareWithPublic: true }, function (err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err)

        } else {

            sceneIndex = getRandomInt(0, scenes.length - 1);
//            async.each(scenes,
            // 2nd param is the function that each item is passed to

            // Call an asynchronous function, often a save() to DB
            //            scene.someAsyncCall(function () {
            // Async call is done, alert via callback
            if (scenes[sceneIndex].scenePostcards != null && scenes[sceneIndex].scenePostcards.length > 0) {
                postcardIndex = getRandomInt(0, scenes[sceneIndex].scenePostcards.length - 1);
//                        db.image_items.find({postcardForScene: scene.short_id}).sort({otimestamp: -1}).limit(maxItems).toArray(function (err, picture_items) {
                console.log("tryna find postcard: " + scenes[sceneIndex].scenePostcards[postcardIndex]);
                var oo_id = ObjectID(scenes[sceneIndex].scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {

                    if (err || !picture_item || picture_item.length == 0) {
                        console.log("error getting picture items for publicsimple" + JSON.stringify(scenes[sceneIndex].scenePostcards[postcardIndex]));

                    } else {
//                                console.log("# " + picture_items.length);
//                                    for (var i = 0; i < 1; i++) {

                        var item_string_filename = JSON.stringify(picture_item.filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 30);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
//                                var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                        var standardName = 'standard.' + baseName + item_string_filename_ext;

                        var urlStandard = scenes[sceneIndex].short_id + "~" + s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + standardName, Expires: 6000}); //just send back thumbnail urls for list
                        res.send(urlStandard);
                    }
                });
            }
        }
    });
});

app.post('/newlocation', requiredAuthentication, function (req, res) {

    var location = req.body;
    location.userID = req.session.user._id.toString();
    var timestamp = Math.round(Date.now() / 1000);
    location.lastUpdate = timestamp;
    db.locations.save(location, function (err, saved) {
        if ( err || !saved ) {
            console.log('location not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new location created, id: ' + item_id);
            res.send("created" + item_id);
        }
    });
});
app.get('/userlocations/:u_id', requiredAuthentication, function(req, res) {
    console.log('tryna return userlocations for: ' + req.params.u_id);
    db.locations.find({userID: req.params.u_id}).sort({otimestamp: -1}).toArray( function(err, location_items) {

        if (err || !location_items) {
            console.log("error getting userlocation items: " + err);

        } else {

            res.json(location_items);
            // console.log("returning userlocations for " + req.params.u_id + " " + JSON.stringify(location_items));
        }
    });
});

app.post('/delete_location/',  requiredAuthentication, function (req, res) { //weird, post + path
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.locations.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});

app.get('/userlocation/:p_id', requiredAuthentication, function(req, res) {

    console.log('tryna return location : ' + req.params.p_id);
    var pID = req.params.p_id;
    if (pID != undefined && pID.length > 10) {
    var o_id = ObjectID(pID);
    db.locations.findOne({"_id": o_id}, function(err, location) {
        if (err || !location) {
            console.log("error getting location item: " + err);
        } else {
            res.json(location);
            console.log("returning location item : " + location);
        }
    });
    } else {
        res.send("not a valid location ID!");
    }
});

app.post('/update_location/:_id', requiredAuthentication, function (req, res) {
    console.log(JSON.stringify(req.body));

    var o_id = ObjectID(req.body._id);  //convert to BSON for searchie
    console.log('location requested : ' + req.body._id);
    db.locations.findOne({ "_id" : o_id}, function(err, location) {
        if (err || !location) {
            console.log("error getting audio items: " + err);
        } else {
            console.log("tryna update location" + req.body._id);
            var timestamp = Math.round(Date.now() / 1000);
            location.lastUpdate = timestamp;
            if (location.type.toLowerCase() == "geographic") {
                db.locations.update( { "_id": o_id }, { $set: {
                    tags: req.body.tags,
                    name: req.body.name,
                    description: req.body.description,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    lastUpdate: timestamp
                }});
                res.send("updated");
            }
            if (location.type.toLowerCase() == "worldspace") {
                db.locations.update( { "_id": o_id }, { $set: {
                    tags: req.body.tags,
                    name: req.body.name,
                    description: req.body.description,
                    x: req.body.x,
                    y: req.body.y,
                    z: req.body.z,
                    lastUpdate: timestamp
                }});
                res.send("updated");
            } 
        } if (err) {res.send(error)};
    });
});

app.post('/newscene', requiredAuthentication, function (req, res) {
    console.log(req.body);
    var newScene = {};    
//        newScene.title = newScene.title
//        newScene.sceneOwner_id = req.session.user._id.toString();
//        newScene.sceneOwnerName = req.session.user.username;
    newScene.sceneTitle = req.body.title;
    newScene.user_id = req.session.user._id.toString();
    newScene.userName = req.session.user.userName;
    newScene.otimestamp = Math.round(Date.now() / 1000);
    db.scenes.save(newScene, function (err, saved) {
        if ( err || !saved ) {
            console.log('scene not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('created new scene id: ' + item_id);
            tempID = "";
            newShortID = "";
            tempID = item_id;
            // newShortID = shortId(tempID);
            newShortID = shortid.generate(); //TODO - externalize and check for collisions!
            var o_id = ObjectID(tempID);
            console.log(tempID + " = " + newShortID);
            db.scenes.update( { _id: o_id }, { $set: { short_id: newShortID }});

            db.acl.save(
                { acl_rule: "read_scene_" + saved._id },  function (err, acl) {
                    if (err || !acl) {
                    } else {
                        db.acl.update({ 'acl_rule': "read_scene_" + saved._id},{ $push: { 'userIDs': req.session.user._id.toString() } });
                        console.log("ok saved acl");
                    }
                });
            db.acl.save(
                { 'acl_rule': "write_scene_" + saved._id }, function (err, acl) {
                    if (err || !acl) {
                    } else {
                        db.acl.update({ 'acl_rule': "write_scene_" + saved._id },{ $push: { 'userIDs': req.session.user._id.toString() } });
                        console.log("ok saved acl");
                    }
                });
            res.send("created new scene " + item_id);
        }
    });
});


app.post('/newgroup', requiredAuthentication, function (req, res) {

    var group = req.body;
    console.log("new group data " + JSON.stringify(req.body));
    group.userID = req.session.user._id.toString();
    group.userName = req.session.user.username;
    var timestamp = Math.round(Date.now() / 1000);
    group.lastUpdate = timestamp;
    let items = [];
    group.items = items;
    db.groups.save(group, function (err, saved) {
        if ( err || !saved ) {
            // console.log('group not saved..');
            res.send("error " + err );
        } else {
            var item_id = saved._id.toString();
            console.log('new group created, id: ' + item_id);
            res.send(item_id);
        }
    });
});

app.post('/delete_group/', requiredAuthentication, function (req, res) { //weird, post + path
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.groups.remove( { "_id" : o_id }, 1 );
    res.send("delback");
});

app.post('/delete_scene/:_id', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.scenes.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});

app.post('/weblink/', checkAppID, requiredAuthentication, function (req, res) {
    console.log("req.header: " + req.headers);
    console.log("checkin weblink: " + req.body.link_url);
    var lurl = "";
    lurl = req.body.link_url;
    db.weblinks.find({ link_url : lurl}, function(err, links) {
        if (err) {
            console.log("error getting link items: " + err);
        } else if (!links || links.Length == 0 || links[0] == undefined || links[0] == "") {
            console.log("no link items found");
            db.weblinks.save(req.body, function (err, savedlink) {
                if (err || !savedlink) {
                    console.log('link not saved..');
                    res.send("nilch");
                } else {

                    var weblinkParams = {
                        'steps': {
                            'extract': {
                                'robot': '/html/convert',
                                'url' : req.body.link_url
                            }
                        },
                        'template_id': '3129d73016dc11e5bc305b7a5c3e7a99',
                        'fields' : { 'link_id' : savedlink._id,
                            'user_id' : req.session.user._id.toString()
                        }
                    };

                    transloadClient.send(weblinkParams, function(ok) {
                        console.log('Success: ' + JSON.stringify(ok));
                        if (ok != null && ok != undefined) {
                            var dateNow = Date.now();
                            db.weblinks.update({"_id": savedlink._id}, { $set: {"render_date": dateNow}});
                        }
                    }, function(err) {
                        console.log('Error: ' + JSON.stringify(err));
//                                res.send(err);
                    });
                }
                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: savedlink._id + ".thumb.jpg", Expires: 6000});
                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: savedlink._id + ".half.jpg", Expires: 6000});
                var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: savedlink._id + ".standard.jpg", Expires: 6000});
                savedlink.urlThumb = urlThumb;
                savedlink.urlHalf = urlHalf;
                savedlink.urlStandard = urlStandard;
                res.send(savedlink);
            });
        } else {
            var weblinkParams = {
                'steps': {
                    'extract': {
                        'robot': '/html/convert',
                        'url' : req.body.link_url
                    }
                },
                'template_id': '3129d73016dc11e5bc305b7a5c3e7a99',
                'fields' : { 'link_id' : links[0]._id,
                    'user_id' : req.session.user._id
                }
            };

            transloadClient.send(weblinkParams, function(ok) {
                console.log('Success: ' + JSON.stringify(ok));
                if (ok != null && ok != undefined) {
                    var dateNow = Date.now();
                    db.weblinks.update({"_id": links[0]._id}, { $set: {"render_date": dateNow}});
                }
            }, function(err) {
                console.log('Error: ' + JSON.stringify(err));
            });
            var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: links[0]._id + ".thumb.jpg", Expires: 6000});
            var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: links[0]._id + ".half.jpg", Expires: 6000});
            var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: links[0]._id + ".standard.jpg", Expires: 6000});
            links[0].urlThumb = urlThumb;
            links[0].urlHalf = urlHalf;
            links[0].urlStandard = urlStandard;
            res.send(links[0]);
        }
    });
});

app.post('/update_scene_locations', checkAppID, requiredAuthentication, function (req, res){ //unused.  I think.

    console.log("tryna update scene locations: " + req.body.locations);
    var sceneID = req.body.sceneID;

    var locationsObj = JSON.parse(req.body.locations);
//    console.log("number of locations: " + locationsObj.locations.Length);
//    for (var i = 0; i < locationsObj.locations.Length; i++) {
//        console.log(JSON.stringify(locationsObj.locations[i]));
//
//    }
    var o_id = ObjectID(req.body._id);

    db.scenes.update({ "_id" : o_id}, { $push: { sceneLocations: { $each: locationsObj.locations } } }, function(err, result) {
        if (err || !result) {
            console.log("error updating scene locations: " + err);
        } else {
            res.send(result);
        }
    });
//    locationsObj.locations.filter(function (item){
//       console.log(JSON.stringify(item));
//    });

});

app.post('/update_scene/:_id', requiredAuthentication, function (req, res) {

    console.log("update_scene req.header: " + JSON.stringify(req.headers));
    console.log(req.params._id);
    var lastUpdateTimestamp = new Date();
    var o_id = ObjectID(req.body._id);  //convert to BSON for searchie
    console.log('path requested : ' + req.body._id);
    db.scenes.find({ "_id" : o_id}, function(err, scene) {
        if (err || !scene) {
            console.log("error getting scene: " + err);
        } else {
            console.log("tryna update scene " + req.body._id);
            db.scenes.update( { "_id": o_id }, { $set: {
                sceneDomain : req.body.sceneDomain,
                sceneAppName : req.body.sceneAppName,
                sceneStickyness : parseInt(req.body.sceneStickyness) != null ? parseInt(req.body.sceneStickyness) : 5,
//                    sceneUserName : scene.sceneUserName != null ? scene.sceneUserName : "",
                sceneNumber : req.body.sceneNumber,
                sceneTitle : req.body.sceneTitle,
                sceneTags : req.body.sceneTags,
                sceneYouTubeIDs : req.body.sceneYouTubeIDs != null ? req.body.sceneYouTubeIDs : [],
                sceneLinks : req.body.sceneLinks,
                scenePeopleGroupID : req.body.scenePeopleGroupID,
                sceneLocationGroups : req.body.sceneLocationGroups,
                sceneAudioGroups : req.body.sceneAudioGroups,
                scenePictureGroups : req.body.scenePictureGroups,
                sceneTextGroups : req.body.sceneTextGroups,
                sceneVideoGroups : req.body.sceneVideoGroups,
                sceneVideos : req.body.sceneVideos,
                scenePlayer : req.body.scenePlayer  != null ? req.body.scenePlayer : {},
                sceneType : req.body.sceneType != null ? req.body.sceneType : "",
                sceneUseThreeDeeText : req.body.sceneUseThreeDeeText != null ? req.body.sceneUseThreeDeeText : false,
                sceneAndroidOK : req.body.sceneAndroidOK != null ? req.body.sceneAndroidOK : false,
                sceneIosOK : req.body.sceneIosOK != null ? req.body.sceneIosOK : false,
                sceneWindowsOK : req.body.sceneWindowsOK != null ? req.body.sceneWindowsOK : false,
                sceneRestrictToLocation : req.body.sceneRestrictToLocation != null ? req.body.sceneRestrictToLocation : false,
                sceneShareWithPublic : req.body.sceneShareWithPublic != null ? req.body.sceneShareWithPublic : false,
                sceneShareWithSubscribers : req.body.sceneShareWithSubscribers != null ? req.body.sceneShareWithSubscribers : false,
                sceneShareWithGroups : req.body.sceneShareWithGroups != null ? req.body.sceneShareWithGroups : "",
                sceneShareWithUsers : req.body.sceneShareWithUsers != null ? req.body.sceneShareWithUsers : "",
                sceneEnvironment : req.body.sceneEnvironment != null ? req.body.sceneEnvironment : {},
                sceneUseStaticObj : req.body.sceneUseStaticObj != null ? req.body.sceneUseStaticObj : false,
                sceneStaticObjUrl : req.body.sceneStaticObjUrl != null ? req.body.sceneStaticObjUrl : "",
                sceneStaticObjTextureUrl : req.body.sceneStaticObjTextureUrl != null ? req.body.sceneStaticObjTextureUrl : "",
                sceneRandomizeColors : req.body.sceneRandomizeColors != null ? req.body.sceneRandomizeColors : false,
                sceneTweakColors : req.body.sceneTweakColors != null ? req.body.sceneTweakColors : false,
                sceneColorizeSky : req.body.sceneColorizeSky != null ? req.body.sceneColorizeSky : false,
                sceneScatterMeshes : req.body.sceneScatterMeshes != null ? req.body.sceneScatterMeshes : false,
                sceneScatterMeshLayers : req.body.sceneScatterMeshLayers != null ? req.body.sceneScatterMeshLayers : {},
                sceneScatterObjectLayers : req.body.sceneScatterObjectLayers != null ? req.body.sceneScatterObjectLayers : {},
                sceneScatterObjects : req.body.sceneScatterObjects != null ? req.body.sceneScatterObjects : false,
                sceneScatterOffset : req.body.sceneScatterOffset,
                sceneShowViewportMeshes : req.body.sceneShowViewportMeshes != null ? req.body.sceneShowViewportMeshes : false,
                sceneShowViewportObjects : req.body.sceneShowViewportObjects != null ? req.body.sceneShowViewportObjects : false,
                sceneViewportMeshLayers : req.body.sceneViewportMeshLayers != null ? req.body.sceneViewportMeshLayers : {},
                sceneViewportObjectLayers : req.body.sceneViewportObjectLayers != null ? req.body.sceneViewportObjectLayers : {},
                sceneTargetColliderType : req.body.sceneTargetColliderType != null ? req.body.sceneTargetColliderType : "none",
                sceneUseTargetObject : req.body.sceneUseTargetObject != null ? req.body.sceneUseTargetObject : false,
                sceneTargetRotateToPlayer : req.body.sceneTargetRotateToPlayer != null ? req.body.sceneTargetRotateToPlayer : false,
                // sceneTargetRotateToPlayer : req.body.sceneTargetRotateToPlayer != null ? req.body.sceneTargetRotateToPlayer : false,
                sceneDetectHorizontalPlanes : req.body.sceneDetectHorizontalPlanes != null ? req.body.sceneDetectHorizontalPlanes : false,
                sceneDetectVerticalPlanes : req.body.sceneDetectVerticalPlanes != null ? req.body.sceneDetectVerticalPlanes : false,
                sceneFlyable : req.body.sceneFlyable != null ? req.body.sceneFlyable : false,
                sceneFaceTracking : req.body.sceneFaceTracking != null ? req.body.sceneFaceTracking : false,
                sceneTargetObjectHeading : req.body.sceneTargetObjectHeading != null ? req.body.sceneTargetObjectHeading : 0,
                sceneTargetObject : req.body.sceneTargetObject,
                sceneTargetEvent : req.body.sceneTargetEvent,
                sceneTargetText : req.body.sceneTargetText  != null ? req.body.sceneTargetText : "",
                sceneNextScene : req.body.sceneNextScene != null ? req.body.sceneNextScene : "",
                scenePreviousScene : req.body.scenePreviousScene,
                sceneUseDynamicSky : req.body.sceneUseDynamicSky != null ? req.body.sceneUseDynamicSky : false,
                sceneUseDynCubeMap : req.body.sceneUseDynCubeMap != null ? req.body.sceneUseDynCubeMap : false,
                sceneUseSkyParticles : req.body.sceneUseSkyParticles != null ? req.body.sceneUseSkyParticles : false,
                sceneSkyParticles : req.body.sceneSkyParticles != null ? req.body.sceneSkyParticles : "",
                sceneUseDynamicShadows : req.body.sceneUseDynamicShadows != null ? req.body.sceneUseDynamicShadows : false,
                sceneSkyRotationOffset : req.body.sceneSkyRotationOffset != null ? req.body.sceneSkyRotationOffset : 0,
                sceneUseCameraBackground : req.body.sceneUseCameraBackground != null ? req.body.sceneUseCameraBackground : false,
                sceneCameraOrientToPath : req.body.sceneCameraOrientToPath  != null ? req.body.sceneCameraOrientToPath : false,
                sceneCameraPath : req.body.sceneCameraPath != null ? req.body.sceneCameraPath : "Random",
                sceneUseSkybox : req.body.sceneUseSkybox != null ? req.body.sceneUseSkybox : false,
                sceneSkybox : req.body.sceneSkybox,
                sceneUseDynCubeMap : req.body.sceneUseDynCubeMap != null ? req.body.sceneUseDynCubeMap : false,
                sceneUseSceneFog : req.body.sceneUseSceneFog != null ? req.body.sceneUseSceneFog : false,
                sceneUseGlobalFog : req.body.sceneUseGlobalFog != null ? req.body.sceneUseGlobalFog : false,
                sceneUseVolumetricFog : req.body.sceneUseVolumetricFog != null ? req.body.sceneUseVolumetricFog : false,
                sceneGlobalFogDensity : req.body.sceneGlobalFogDensity != null ? req.body.sceneGlobalFogDensity : .001,
                sceneUseSunShafts : req.body.sceneUseSunShafts != null ? req.body.sceneUseSunShafts : false,
                sceneRenderFloorPlane : req.body.sceneRenderFloorPlane != null ? req.body.sceneRenderFloorPlane : false,
                sceneUseFloorPlane : req.body.sceneUseFloorPlane != null ? req.body.sceneUseFloorPlane : false,
                sceneUseEnvironment : req.body.sceneUseEnvironment != null ? req.body.sceneUseEnvironment : false,
                sceneUseTerrain : req.body.sceneUseTerrain != null ? req.body.sceneUseTerrain : false,
                sceneUseHeightmap : req.body.sceneUseHeightmap != null ? req.body.sceneUseHeightmap : false,
                sceneHeightmap : req.body.sceneHeightmap,
                sceneWebXREnvironment : req.body.sceneWebXREnvironment != null ? req.body.sceneWebXREnvironment : "",
                // sceneUseSimpleWater : req.body.sceneUseSimpleWater != null ? req.body.sceneUseSimpleWater : false,
                // sceneUseOcean : req.body.sceneUseOcean != null ? req.body.sceneUseOcean : false,
                // sceneUseFancyWater : req.body.sceneUseFancyWater != null ? req.body.sceneUseFancyWater : false,
                sceneTime: req.body.sceneTime,
                sceneTimeSpeed: req.body.sceneTimeSpeed,
                sceneWeather: req.body.sceneWeather,
                sceneClouds: req.body.sceneClouds,
                sceneWater: req.body.sceneWater,
                sceneWindFactor : req.body.sceneWindFactor != null ?  req.body.sceneWindFactor : 0,
                sceneLightningFactor : req.body.sceneLightningFactor != null ? req.body.sceneLightningFactor : 0,
                sceneCharacters: req.body.sceneCharacters,
                sceneEquipment: req.body.sceneEquipment,
                sceneFlyingObjex: req.body.sceneFlyingObjex,
                sceneSeason: req.body.sceneSeason,
                scenePictures : req.body.scenePictures, //array of IDs only
                scenePostcards : req.body.scenePostcards, //array of IDs only
                sceneWebLinks : req.body.sceneWebLinks, //custom object
                sceneHighlightColor : req.body.sceneHighlightColor,
                sceneColor1 : req.body.sceneColor1,
                sceneColor2 : req.body.sceneColor2,
                sceneColor3 : req.body.sceneColor3,
                sceneRestrictToLocation : req.body.sceneRestrictToLocation != null ? req.body.sceneRestrictToLocation : false,
                sceneLocationRange : req.body.sceneLocationRange != null ? req.body.sceneLocationRange : .1,
                sceneUseMap : req.body.sceneUseMap != null ? req.body.sceneUseMap : false,
                sceneMapType : req.body.sceneMapType != null ? req.body.sceneMapType : "none",
                sceneMapZoom : req.body.sceneMapZoom != null ? req.body.sceneMapZoom : 16,
                sceneLatitude : req.body.sceneLatitude != null ? req.body.sceneLatitude : "",
                sceneLongitude : req.body.sceneLongitude != null ? req.body.sceneLongitude : "",
                sceneUseStreetMap : req.body.sceneUseStreetMap  != null ? req.body.sceneUseStreetMap : false,
                sceneUseSatelliteMap : req.body.sceneUseSatelliteMap  != null ? req.body.sceneUseSatelliteMap : false,
                sceneUseHybridMap : req.body.sceneUseHybridMap  != null ? req.body.sceneUseHybridMap : false,
                sceneEmulateGPS : req.body.sceneEmulateGPS  != null ? req.body.sceneEmulateGPS : false,
                sceneLocations : req.body.sceneLocations,
                sceneTriggerAudioID : req.body.sceneTriggerAudioID,
                scenePrimaryAudioTitle : req.body.scenePrimaryAudioTitle,
                sceneAmbientAudioID : req.body.sceneAmbientAudioID,
                scenePrimaryAudioID : req.body.scenePrimaryAudioID,
                scenePrimaryAudioStreamURL : req.body.scenePrimaryAudioStreamURL,
                sceneAmbientAudioStreamURL : req.body.sceneAmbientAudioStreamURL,
                sceneTriggerAudioStreamURL : req.body.sceneTriggerAudioStreamURL,
                sceneBPM : req.body.sceneBPM != null ? req.body.sceneBPM : "100",
                scenePrimaryPatch1 : req.body.scenePrimaryPatch1,
                scenePrimaryPatch2 : req.body.scenePrimaryPatch2,
                scenePrimaryMidiSequence1 : req.body.scenePrimaryMidiSequence1,
                scenePrimarySequence2Transpose : req.body.scenePrimarySequence2Transpose != null ? req.body.scenePrimarySequence2Transpose : "0",
                scenePrimarySequence1Transpose : req.body.scenePrimarySequence1Transpose != null ? req.body.scenePrimarySequence1Transpose : "0",
                scenePrimaryMidiSequence2 : req.body.scenePrimaryMidiSequence2,
                sceneAmbientVolume : req.body.sceneAmbientVolume,
                scenePrimaryVolume : req.body.scenePrimaryVolume,
                sceneTriggerVolume : req.body.sceneTriggerVolume,
                sceneWeatherVolume : req.body.sceneWeatherVolume,
                sceneAmbientSynth1Volume : req.body.sceneAmbientSynth1Volume,
                sceneAmbientSynth2Volume : req.body.sceneAmbientSynth2Volume,
                sceneTriggerSynth1Volume : req.body.sceneTriggerSynth1Volume,
                sceneAmbientPatch1 : req.body.sceneAmbientPatch1,
                sceneAmbientPatch2 : req.body.sceneAmbientPatch2,
                sceneAmbientSynth1ModulateByDistance : req.body.sceneAmbientSynth1ModulateByDistance != null ? req.body.sceneAmbientSynth1ModulateByDistance : false,
                sceneAmbientSynth2ModulateByDistance : req.body.sceneAmbientSynth2ModulateByDistance != null ? req.body.sceneAmbientSynth2ModulateByDistance : false,
                sceneAmbientSynth1ModulateByDistanceTarget : req.body.sceneAmbientSynth1ModulateByDistanceTarget != null ? req.body.sceneAmbientSynth1ModulateByDistanceTarget: false,
                sceneAmbientSynth2ModulateByDistanceTarget : req.body.sceneAmbientSynth2ModulateByDistanceTarget != null ? req.body.sceneAmbientSynth2ModulateByDistanceTarget : false,
                sceneAmbientMidiSequence1 : req.body.sceneAmbientMidiSequence1,
                sceneAmbientMidiSequence2 : req.body.sceneAmbientMidiSequence2,
                sceneAmbientSequence1Transpose : req.body.sceneAmbientSequence1Transpose != null ? req.body.sceneAmbientSequence1Transpose : "0",
                sceneAmbientSequence2Transpose : req.body.sceneAmbientSequence2Transpose != null ? req.body.sceneAmbientSequence2Transpose : "0",
                sceneTriggerPatch1 : req.body.sceneTriggerPatch1,
                sceneTriggerPatch2 : req.body.sceneTriggerPatch2,
                sceneTriggerPatch3 : req.body.sceneTriggerPatch3,
                sceneGeneratePrimarySequences : req.body.sceneGeneratePrimarySequences != null ? req.body.sceneGeneratePrimarySequences : false,
                sceneGenerateAmbientSequences : req.body.sceneGenerateAmbientSequences != null ? req.body.sceneGenerateAmbientSequences : false,
                sceneGenerateTriggerSequences : req.body.sceneGenerateTriggerSequences != null ? req.body.sceneGenerateTriggerSequences : false,
                sceneLoopPrimaryAudio : req.body.sceneLoopPrimaryAudio != null ? req.body.sceneLoopPrimaryAudio : false,
                scenePrimaryAudioLoopCount : req.body.scenePrimaryAudioLoopCount != null ? req.body.scenePrimaryAudioLoopCount : 0,
                sceneAutoplayPrimaryAudio : req.body.sceneAutoplayPrimaryAudio != null ? req.body.sceneAutoplayPrimaryAudio : false,
                scenePrimaryAudioVisualizer : req.body.scenePrimaryAudioVisualizer != null ? req.body.scenePrimaryAudioVisualizer : false,
                scenePrimaryAudioTriggerEvents : req.body.scenePrimaryAudioTriggerEvents != null ? req.body.scenePrimaryAudioTriggerEvents : false,
                sceneAttachPrimaryAudioToTarget : req.body.sceneAttachPrimaryAudioToTarget != null ? req.body.sceneAttachPrimaryAudioToTarget : false,
                sceneAutoplayAudioGroup : req.body.sceneAutoplayAudioGroup != null ? req.body.sceneAutoplayAudioGroup : false,
                sceneLoopAllAudioGroup : req.body.sceneLoopAllAudioGroup != null ? req.body.sceneLoopAllAudioGroup : false,
                sceneAnchorPositionAudioGroup : req.body.sceneAnchorPositionAudioGroup != null ? req.body.sceneAnchorPositionAudioGroup : false,
                sceneAnchorCanvasAudioGroup : req.body.sceneAnchorCanvasAudioGroup != null ? req.body.sceneAnchorCanvasAudioGroup : false,
                sceneCreateAudioSpline : req.body.sceneCreateAudioSpline != null ? req.body.sceneCreateAudioSpline : false,
                sceneAttachAudioGroupToTarget : req.body.sceneAttachAudioGroupToTarget != null ? req.body.sceneAttachAudioGroupToTarget : false,
                sceneUseMicrophoneInput : req.body.sceneUseMicrophoneInput != null ? req.body.sceneUseMicrophoneInput : false,
//                    sceneAmbientAudio2ID : req.body.sceneAmbientAudio2ID,
                sceneKeynote : req.body.sceneKeynote,
                sceneDescription : req.body.sceneDescription,
                sceneFont : req.body.sceneFont,
                sceneFontFillColor : req.body.sceneFontFillColor,
                sceneFontOutlineColor : req.body.sceneFontOutlineColor,
                sceneFontGlowColor : req.body.sceneFontGlowColor,
                sceneTextBackground : req.body.sceneTextBackground,
                sceneTextBackgroundColor : req.body.sceneTextBackgroundColor,
                sceneText : req.body.sceneText, //this is "primary" tex
                sceneTextLoop : req.body.sceneTextLoop != null ? req.body.sceneTextLoop : false, //also for "primary" text below
                scenePrimaryTextFontSize : req.body.scenePrimaryTextFontSize != null ? req.body.scenePrimaryTextFontSize : "12",
                scenePrimaryTextMode : req.body.scenePrimaryTextMode != null ? req.body.scenePrimaryTextMode : "Normal",
                scenePrimaryTextAlign : req.body.scenePrimaryTextAlign != null ? req.body.scenePrimaryTextAlign : "Left",
                sceneNetworking : req.body.sceneNetworking != null ? req.body.sceneNetworking : "None",
                scenePrimaryTextRotate : req.body.scenePrimaryTextRotate != null ? req.body.scenePrimaryTextRotate : false,
                scenePrimaryTextScaleByDistance : req.body.scenePrimaryTextScaleByDistance != null ? req.body.scenePrimaryTextScaleByDistance : false,
                sceneTextAudioSync : req.body.sceneTextAudioSync != null ? req.body.sceneTextAudioSync : false,
                sceneObjects: req.body.sceneObjects,
                sceneModels: req.body.sceneModels,
                sceneObjectGroups: req.body.sceneObjectGroups,
                sceneLastUpdate : lastUpdateTimestamp
                }
            });
        } if (err) {res.send(err)} else {res.send("updated " + new Date())}
    });
});

app.get('/sceneloc/:key', function (req, res){

    resObj = {};

    db.scenes.find({ "short_id" : req.params.key}, function(err, scenes) {
        if (err || !scenes) {
            console.log("cain't get no scenes... " + err);
        } else {
            resObj.sceneLatitude = scenes[0].sceneLatitude;
            resObj.sceneLongitude = scenes[0].sceneLongitude;
            resObj.sceneLocationRange = scenes[0].sceneLocationRange;
//                console.log(JSON.stringify(scenes));
            res.json(resObj);
        }
    });

});

app.get('/seq/:_seqID', function (req, res) {
    console.log("tryna get sequence");
    var pathNumbers = [];
    var pathSequence = [];
    db.paths.find({}, function (err, paths) {
        if (err || !paths) {
            console.log("no paths found ", err);
        } else {
            paths.forEach(function (path) {

                pathNumbers.push(parseInt(path.pathNumber));
                pathNumbers.sort(function(a, b){return a-b});
            });
            paths.forEach(function (path) {
                for (var i = 0; i < pathNumbers.length; i++) {
                    if (pathNumbers[i] = path.pathNumber) {
                        pathSequence.push(path._id);
                        break;
                    }
                }
            });
        }

        //   pathSequence.sort(function(a, b){return a-b});
        console.log("pathSequence", pathSequence);
        res.json(pathSequence);
    });
});

//return a short code that will be unique for the spec'd type (scene, pic, audio)
app.get('/newshortcode/:type', checkAppID, requiredAuthentication, function (req, res) {


});

//check uniqueness and websafeness (can be used as path) of title for the spec'd type, return bool
app.get('/checktitle/:type', checkAppID, requiredAuthentication, function (req, res) {


});

app.get('/update_public_scene/:_id', requiredAuthentication, function (req, res) { //TODO lock down w/ checkAppID, requiredAuthentication

    console.log("tryna update public scene id: ", req.params._id + " excaped " + entities.decodeHTML(req.params._id));

    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    var requestedVideoItems = [];
    var requestedTextItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];

    var mp3url = "";
    var oggurl = "";
    var pngurl = "";
    var mp4url = "";
    var postcard1 = "";
    var image1url = "";
    var short_id = "";
    var picArray = new Array;
    var postcardArray = new Array;
    var imageAssets = "";
    var imageEntities = "";
    var skyboxUrl = "";
    var skyboxID = "";
    var skySettings = "";
    var fogSettings = "";
    var ground = "";
    var ocean = "";
    var targetObjectAsset = "";
    var targetObjectEntity = "";
    var skyParticles;
    var videoAsset = "";
    var videoEntity = "";
    var nextLink = "";
    var prevLink = "";
    var loopable = "";
    var autoplay = false;
    var bucketFolder = "eloquentnoise.com";
    var winOK = "";
    var androidOK = "";
    var iosOK = "";
    var primaryText = "";
    var keynoteText = "";
    var descText = "";
    var iosInstallUrl = "https://itunes.apple.com/us/app/servicemedia/id1016515870?mt=8";
    var androidInstallUrl = "https://play.google.com/store/apps/details?id=net.servicemedia.servmed";
    var windowsInstallUrl = "https://servicemedia.s3.amazonaws.com/builds/sm2018.zip";
    var theUrl = "";

    async.waterfall([


                function (callback) {
                    var o_id = ObjectID(reqstring);
                    db.scenes.findOne({"_id": o_id},
                        function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                            if (err || !sceneData) {
                                console.log("error getting scene data: " + err);
                                callback(err);
                            } else { //make arrays of the pics and audio items
                                console.log("creating sceneResponse data : audio id " + sceneData.scenePrimaryAudioID);
                                short_id = sceneData.short_id;
                                sceneResponse = sceneData;
                                if (sceneResponse.sceneDomain != null && sceneResponse.sceneDomain != "") {
                                    bucketFolder = sceneResponse.sceneDomain;
                                    
                                    sceneData.scenePictures.forEach(function (picture) {
                                        var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                        requestedPictureItems.push(p_id); //populate array
                                    });

                                    sceneResponse.scenePostcards = sceneData.scenePostcards;
                                    if (sceneResponse.sceneUseGlobalFog) {
                                        fogSettings = "fog=\x22type: linear; density:.005; near: 1; far: 30; color: " + sceneResponse.sceneColor1 + "\x22";
                                    }
    //                                if (sceneResponse.sceneUseSkyParticles) {
    //                                    skyParticles = "<a-entity scale='.5 .5 .5' position='0 3 0' particle-system=\x22preset: dust; randomize: true color: " + sceneResponse.sceneColor1 + "," + sceneResponse.sceneColor2 +"\x22></a-entity>";
    //                                }
                                    if (sceneResponse.sceneRenderFloorPlane) {
                                        ground = "<a-plane rotation='-90 0 0' position='0 3 0' width='150' height='150' color=\x22" + sceneResponse.sceneColor2 + "\x22></a-plane>";
                                    }
                                    if (sceneResponse.sceneWater != null && sceneResponse.sceneWater.name != "none") {
                                        console.log("ocean! " + JSON.stringify(sceneResponse.sceneWater));
                                        ocean = "<a-ocean></a-ocean>";
                                    }
                                    if (sceneResponse.sceneUseTargetObject && sceneResponse.sceneTargetObject != null) {
                                        if (sceneResponse.sceneTargetObject.name == "gltftest" ) {
                                        targetObjectAsset = "<a-asset-item id=\x22targetObj\x22 src=\x22../assets/models/korkus/KorkusOnly.gltf\x22></a-asset-item>";
                                        targetObjectEntity = "<a-entity gltf-model=\x22#targetObj\x22 position='-5 5 5'></a-entity>";
                                        }
                                    }

                                    if (sceneResponse.sceneLoopPrimaryAudio) {
                                        loopable = " loop ";
                                    }
                                    if (sceneResponse.scenePrimaryAudioID != null && sceneResponse.scenePrimaryAudioID.length > 8 ) {
                                        var pid = ObjectID(sceneResponse.scenePrimaryAudioID);
                                        console.log("pid audio " + ObjectID(sceneResponse.scenePrimaryAudioID));
                                        // requestedAudioItems.push(sceneData.scenePrimaryAudioID);
                                        requestedAudioItems.push(ObjectID(sceneResponse.scenePrimaryAudioID));
                                    } 
                                    callback();
                                } else {
                                    callback("error - domain name required");
                                }
                            }
                        });

                },


                // "<li>" +
                // "<a class=\x22mx-2 btn btn-primary btn-sm\x22" + nextLink + " target=\x22_blank\x22>Next Scene</a>" +
                // "</li>" +
//
//            function(callback) { //check for target bucket, create if absent
//
//                bucketFolder = "mvmv.us" + short_id;
//                console.log("target bucket : " + bucketFolder);
//                s3.headBucket({Bucket: bucketFolder}, function (err, data) {
//                        if (err) {
//                            s3.createBucket({Bucket: bucketFolder}, function (err2, data) {
//                                if (err2) {
//                                    console.log(err2);
//                                    callback(err2);
//                                } else {
//                                    console.log("tryna create bucket " + bucketFolder);
//                                    callback(null);
//                                }
//                            });
//                        } else {
//                            console.log("Bucket exists and we have access");
//                            callback(null);
//                        }
//                    },
            

            function (callback){
                var params = {
                    Bucket: bucketFolder,
                    Prefix: short_id + '/'
                };

                s3.listObjects(params, function(err, data) { //delete all the things in the target bucket, to cleanup kruft..
                    if (err) {
                        console.log("error listing objs " + err);
                        return callback(err);
                    } else {
                      console.log("fixing to delete objs: " + data);

                    if (data.Contents.length == 0) {
                        callback(null);
                        } else {
                        params = {Bucket: bucketFolder};
                        params.Delete = {Objects:[]};

                        data.Contents.forEach(function(content) {
                            params.Delete.Objects.push({Key: content.Key});
                        });
                        console.log("delete params: " + JSON.stringify(params));
                        s3.deleteObjects(params, function(err, data) {
                            if (err) {
                                console.log("error deleting " + err)
                                return callback(err);
                            } else {
                                callback(null);
                            }
                        });
                    }
                }
            });
            },

            function (callback) {
                if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                    db.scenes.findOne({$or: [ { short_id: sceneResponse.sceneNextScene }, { sceneTitle: sceneResponse.sceneNextScene } ]}, function (err, scene) {
                        if (scene == err) {
                            console.log("didn't find next scene");
                        } else {

                            nextLink == "<li>" +
                            "<a class=\x22mx-2 btn btn-primary btn-sm\x22href=\x22../" + scene.short_id + "/index.html\x22 target=\x22_blank\x22>Next Scene</a>" +
                            "</li>";
                        }
                    }); 
                }
                if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                    db.scenes.findOne({$or: [ { short_id: sceneResponse.scenePreviousScene }, { sceneTitle: sceneResponse.scenePreviousScene } ]}, function (err, scene) {
                        if (scene == err) {
                            console.log("didn't find previous scene");
                        } else {
                            prevLink = "<li>" +
                                        "<a class=\x22mx-2 btn btn-primary btn-sm\x22href=\x22../" + scene.short_id + "/index.html\x22 target=\x22_blank\x22>Previous Scene</a>" +
                                        "</li>";
                        }
                    }); 
                }
                callback();
            },
            
            function (callback) { //update the install urls //TODO - use app id instead
                console.log("sceneAppName " + sceneResponse.sceneAppName + " appdomain " + sceneResponse.sceneDomain);
                db.apps.findOne({$and: [{"appname": sceneResponse.sceneAppName}, {"appdomain": sceneResponse.sceneDomain}]}, function (err, app) {
                    if (err || !app) {
                        console.log("error getting audio items: " + err);
                        callback(null);
                    } else {
                        androidInstallUrl = app.androidInstallUrl;
                        iosInstallUrl = app.iosInstallUrl;
                        windowsInstallUrl = app.windowsInstallUrl;
                        callback(null);
                    }
                });
            },

            function (callback) { //get the qr code
                QRCode.toDataURL(sceneResponse.short_id, function (err, url) {
                    theUrl = url;
                    // console.log("qrcode: " + theUrl);
                });
                callback(null);
            },

            function (callback) { //fethc audio items
                    console.log("requestedAUdioItems " + requestedAudioItems[0]);
                    db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items) {
                        if (err || !audio_items) {
                            console.log("error getting audio items: " + err);
                            callback(null);
                        } else {

                            callback(null, audio_items) //send them along
                        }
                    });
                },

            function (audio_items, callback) { //add the signed URLs to the obj array
                    for (var i = 0; i < audio_items.length; i++) {
                        console.log("audio_item: ", audio_items[i]);
                        var item_string_filename = JSON.stringify(audio_items[i].filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 1000);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        //console.log(baseName);
                        var mp3Name = baseName + '.mp3';
                        var oggName = baseName + '.ogg';
                        var pngName = baseName + '.png';
                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + mp3Name, Key: short_id +"/"+ audio_items[i]._id + "." + mp3Name}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject");
                                console.log(err);
                            }
                            else {
                                console.log('SUCCESS copyObject');

                            }
                        });

                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + oggName, Key: short_id +"/"+ audio_items[i]._id + "." + oggName}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject");
                                console.log(err);
                            }
                            else {
                                console.log('SUCCESS copyObject');

                            }
                        });
                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + pngName, Key: short_id +"/"+ audio_items[i]._id + "." + pngName}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject" + err);
                            }
                            else {
                                console.log('SUCCESS copyObject');
                            }
                        });
                        mp3url = audio_items[i]._id + "." + mp3Name;
                        oggurl = audio_items[i]._id + "." + oggName;
                        pngurl = audio_items[i]._id + "." + pngName;

                        console.log("copying audio to s3...");
                    }

                    callback(null);
            },
            function (callback) {
                if (mp3url == null || mp3url == undefined || mp3url.length < 10) {
                    if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 8 ) {
                        mp3url = sceneResponse.scenePrimaryAudioStreamURL + "/stream";   
                        oggurl = sceneResponse.scenePrimaryAudioStreamURL + "/stream";                    
                        callback();
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }  
            },

            function (callback) { //fethc video items
                if (sceneResponse.sceneVideos != null) {
                    sceneResponse.sceneVideos.forEach(function (vid) {
                        console.log("looking for sceneVideo : " + JSON.stringify(vid));
                        var p_id = ObjectID(vid); //convert to binary to search by _id beloiw
                        requestedVideoItems.push(p_id); //populate array
                    });
                    db.video_items.find({_id: {$in: requestedVideoItems}}, function (err, video_items) {
                        if (err || !video_items) {
                            console.log("error getting video items: " + err);
                            callback(null, new Array());
                        } else {
                            console.log("gotsome video items: " + JSON.stringify(video_items[0]));

                            callback(null, video_items) //send them along
                        }
                    });
                } else {
                    callback(null, new Array());
                }
            },

            function (video_items, callback) { //add the signed URLs to the obj array

                    //for (var i = 0; i < 1; i++) { //only do first one for now..
                        if (video_items != null && video_items[0] != null) {
                            console.log("video_item: " + JSON.stringify(video_items[0]));
                            var item_string_filename = JSON.stringify(video_items[0].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            //console.log(baseName);
                            var mp4Name = baseName + '.mp4';
                            console.log("mp4 video: " + mp4Name + " " + video_items[0]._id);
                            var vid = video_items[0]._id;
                            var ori = video_items[0].orientation != null ? video_items[0].orientation : "";
                            mp4url = vid + "." + mp4Name;
                            s3.copyObject({
                                Bucket: bucketFolder,
                                CopySource: 'servicemedia/users' + video_items[0].userID + "/" + video_items[0]._id + "." + mp4Name,
                                Key: short_id + "/" + video_items[0]._id + "." + mp4Name
                            }, function (err, data) {
                                if (err) {
                                    console.log("ERROR copyObject");
                                    console.log(err);
                                    callback(null);
                                } else {
                                    console.log('SUCCESS copyObject for video item ');

//                                    videoAsset = "<video id=\x22video1\x22 src=\x22" + mp4url + "\x22 autoplay='true' loop='true'>";
                                    if (ori == "equirectangular") {
                                        videosphereAsset =  
                                        videoEntity = "<a-videosphere src=\x22" + mp4url + "\x22 rotation=\x220 180 0\x22 material=\x22shader: flat; transparent: true;\x22></a-videosphere>";
//                                        skySettings = "transparent='true'";
                                    } else {
                                        videoEntity = "<a-video src=\x22#video1\x22 position='25 5 -15' width='8' height='4.5' look-at=\x22#player\x22></a-video>";
                                    }
                                    console.log("copying video to s3...");
                                    callback(null);

                                }
                            });
                    } else {
                        callback(null);
                    }
            },

            function (callback) {
                var postcards = [];
                console.log("sceneResponse.scenePostcards: " + JSON.stringify(sceneResponse.scenePostcards));
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    var index = 0;
                    async.each(sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);

                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting postcard " + postcardID + err);
                                callbackz();
                            } else {

                                s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item._id + ".standard." + picture_item.filename,
                                    Key: short_id +"/"+ picture_item._id + ".standard." + picture_item.filename}, function (err, data) {
                                    if (err) {
                                        console.log("ERROR copyObject" + err);
                                    }
                                    else {
                                        console.log('SUCCESS copyObject');

                                    }

                                });
                                index++;
                                postcard1 = picture_item._id + ".standard." + picture_item.filename;
                                postcardArray.push(postcard1);
//                                imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 src='"+ image1url +"'>";
//                                imageEntities = imageEntities + "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                callbackz();
                            }
                        });
                        },
                        function (err) {
                       
                            if (err) {
                                console.log('A file failed to process');
                                callback(null);
                            } else {
                                console.log('All files have been processed successfully');
                                callback(null);
                            }
                        });
                    } else {
    //                      callback(null);
                        callback(null);
                    }
         },
            function (callback) { //checks for equirect, should just get 'em
                var postcards = [];
                console.log("sceneResponse.scenePictures: " + JSON.stringify(sceneResponse.scenePictures));
                if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                    var index = 0;
                    async.each(sceneResponse.scenePictures, function (picID, callbackz) { //nested async-ery!
                            var oo_id = ObjectID(picID);


                            db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                if (err || !picture_item) {
                                    console.log("error getting scenePictures " + picID + err);
                                    callbackz();
                                } else {
                                    console.log("tryna copy picID " + picID + " orientation " + picture_item.orientation);
                                    if (picture_item.orientation == "equirectangular") {
                                        skyboxID = picID;
                                    }
                                    s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item.filename, //use full rez pic for skyboxen
                                        Key: short_id +"/"+ picture_item._id + ".original." + picture_item.filename}, function (err, data) {
                                        if (err) {
                                            console.log("ERROR copyObject" + err);
                                        } else {
                                            console.log('SUCCESS copyObject');
                                        }
                                    });
                                    if (picture_item.orientation != "equirectangular") {
                                        index++;
                                        image1url = picture_item._id + ".standard." + picture_item.filename;
                                        picArray.push(image1url);
                                        // imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 src='" + image1url + "'>";
                                        // imageEntities = imageEntities + "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                    }
                                    callbackz();
                                }
                            });
                        },
                        function (err) {
                           
                            if (err) {
                                console.log('A file failed to process');
                                callback(null);
                            } else {
                                console.log('All files have been processed successfully');
                                callback(null);
                            }
                        });
                } else {
                    //                      callback(null);
                    callback(null);
                }
            },

            function (callback) {

//                if (sceneResponse.sceneUseSkybox && sceneResponse.sceneSkybox != null) {
//                    if (sceneResponse.sceneUseSkybox) {
                            if (skyboxID != "") {
                                var oo_id = ObjectID(skyboxID);
                            } else {
                                if (sceneResponse.sceneSkybox != null && sceneResponse.sceneSkybox != "")
                                var oo_id = ObjectID(sceneResponse.sceneSkybox);
                            }

                            if (oo_id) {

                                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                    if (err || !picture_item) {
                                        console.log("error getting skybox " + sceneResponse.sceneSkybox + err);
                                        callback(null);
                                    } else {

                                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID + "/" + picture_item.filename,
                                            Key: short_id + "/" + picture_item._id + ".original." + picture_item.filename}, function (err, data) {
                                            if (err) {
                                                console.log("ERROR copyObject" + err);
                                            }
                                            else {
                                                console.log('SUCCESS copyObject');

                                            }

                                        });
//                                    skyboxAsset = "<img id=\x22smskybox"\x22 src='" + skyboxUrl + "'>";
//                                    skyboxEntity = "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                        skyboxUrl = picture_item._id + ".original." + picture_item.filename;
                                        callback(null);
                                    }
                                });
                            } else {
                                callback(null);
                            }
//                } else {
//                    //                      callback(null);
//                    callback(null);
//                }
            },

            function (callback) {
                // var hasPics = false;
                // if (picArray.Length > 0) {
                //     hasPics = true;
                // }

                if (sceneResponse.sceneIosOK) {
                    iosOK = "<a href=" + iosInstallUrl + "><div class=\x22apple_yes\x22></div></a>";
                } else {
                    iosOK = "<div class=\x22apple_no\x22></div>";
                }
                if (sceneResponse.sceneWindowsOK) {
                    winOK = "<a href=" + windowsInstallUrl + "><div class=\x22windows_yes\x22></div></a>";
                } else {
                    winOK = "<div class=\x22windows_no\x22></div>";
                }
                if (sceneResponse.sceneAndroidOK) {
                    androidOK = "<a href=" + androidInstallUrl + "><div class=\x22android_yes\x22></div></a>";
                } else {
                    androidOK = "<div class=\x22android_no\x22></div>";
                }

                if (sceneResponse.sceneKeynote != null && sceneResponse.sceneKeynote.length > 0){
                    keynoteText =  "<li class=\x22list-group-item\x22 style=\x22text-align: left; margin-top: 10px; padding: 10px; background-color: rgba(255, 255, 255, 0.5);\x22><p><strong>Keynote:&nbsp;&nbsp;</strong></p><p>" + sceneResponse.sceneKeynote + "</p></li>"
                }
                if (sceneResponse.sceneDescription != null && sceneResponse.sceneDescription.length > 0) {
                    descText = "<li class=\x22list-group-item\x22 style=\x22text-align: left; margin-top: 10px; padding: 10px; background-color: rgba(255, 255, 255, 0.5);\x22><p><strong>Description:&nbsp;&nbsp;</strong></p><p>" + sceneResponse.sceneDescription + "</p></li>"
                }
                if (sceneResponse.sceneText != null && sceneResponse.sceneText.length > 0) {
                    sceneResponse.sceneText = sceneResponse.sceneText.replace(/\n/gi, "<br>");
                    primaryText =  "<li class=\x22list-group-item\x22 style=\x22text-align: left; margin-top: 10px; padding: 10px; background-color: rgba(255, 255, 255, 0.5);\x22><p><strong>Main Text:&nbsp;&nbsp;</strong></p><p>" + sceneResponse.sceneText + "</p></li>"
                }
                var htmltext = "<html xmlns='http://www.w3.org/1999/xhtml' xmlns:fb='http://ogp.me/ns/fb#'>" +
                    "<!doctype html>"+
                    "<html lang=\x22en\x22>"+
                    "<head> " +
                    "<meta charset=\x22utf-8\x22/>" +

    
                    "<meta property=\x22og:title\x22  name=\x22og:title\x22  content=\x22" + sceneResponse.sceneTitle + "\x22/>" +
                    "<meta property=\x22og:url\x22 name=\x22og:url\x22 content=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22 /> " +
                    "<meta property=\x22og:type\x22 name=\x22og:type\x22 content=\x22website\x22/> " +
                    "<meta property=\x22og:image\x22 name=\x22og:image\x22 content=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "/" + postcardArray[0] + "\x22 /> " +
                    "<meta property=\x22og:image:height\x22 name=\x22og:image:height\x22 content=\x221024\x22 /> " +
                    "<meta property=\x22og:image:width\x22  name=\x22og:image:width\x22 content=\x221024\x22 /> " +
                    "<meta property=\x22og:description\x22 name=\x22og:description\x22 content=\x22" + sceneResponse.sceneDescription + "\x22 /> " +
                    "<meta name=\x22viewport\x22 content=\x22width=device-width, initial-scale=1, shrink-to-fit=no\x22></meta>" +
                    // "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                    "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                    "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                    "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                    "<meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />" +
                    "<meta name='apple-mobile-web-app-status-bar-style' content='black'>" +
                    "<meta name='robots' content='index,follow'/>" +

                    "<link rel=\x22stylesheet\x22 href=\x22https://servicemedia.net/css/smstyle.css\x22>" +

                    "<link rel=\x22stylesheet\x22 href=\x22https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css\x22 integrity=\x22sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm\x22 crossorigin=\x22anonymous\x22></link>"+

                    "<title>" + sceneResponse.sceneTitle + "</title>" +

                    "</head>" +

                    "<body bgcolor='black'>" +

                    
                    "<script>" +
                    "window.fbAsyncInit = function() {" +
                    "FB.init({" +
                    "appId : \x221678172455793030\x22," +
                    "xfbml : true," +
                    "version : 'v2.8'" +
                    "});" +
                    "FB.AppEvents.logPageView();" +
                    "};" +
                    "(function(d, s, id) {" +
                    "var js, fjs = d.getElementsByTagName(s)[0];" +
                    "if (d.getElementById(id)) return;" +
                    "js = d.createElement(s); js.id = id;" +
                    "js.src = \x22//connect.facebook.net/en_US/sdk.js\x22;" +
                    "fjs.parentNode.insertBefore(js, fjs);" +
                    "}(document, \x22script\x22, \x22facebook-jssdk\x22));</script>" +
                    
                //    "<nav class=\x22navbar navbar-expand-lg navbar-light bg-light\x22>" +
                    // "<nav class=\x22navbar navbar-expand-lg navbar-toggleable-md navbar-light bg-light fixed-top\x22>" +
                    // "<nav class=\x22navbar navbar-expand-lg navbar-light bg-light fixed-top\x22>" +
                    "<nav class=\x22navbar navbar-expand-lg navbar-dark bg-dark fixed-top\x22>" +
                    // "<button class=\x22navbar-toggler\x22 type=\x22button\x22 data-toggle=\x22collapse\x22 data-target=\x22#navbarSupportedContent\x22 aria-controls=\x22navbarSupportedContent\x22 aria-expanded=\x22false\x22 aria-label=\x22Toggle navigation\x22>"+
                    // "<span class=\x22navbar-toggler-icon\x22></span>"+
                    // "</button>"+
                    "<a class=\x22navbar-brand\x22 href=\x22http://" + sceneResponse.sceneDomain + "\x22>" + sceneResponse.sceneDomain + "</a>" +
                    "<button class=\x22navbar-toggler navbar-toggler-right\x22 type=\x22button\x22 data-toggle=\x22collapse\x22 data-target=\x22#navbarCollapse\x22 aria-controls=\x22navbarCollapse\x22 aria-expanded=\x22false\x22 aria-label=\x22Toggle navigation\x22>" +
                    "<span class=\x22navbar-toggler-icon\x22></span>" +
                    "</button>" +
                    "<div class=\x22collapse navbar-collapse\x22 id=\x22navbarCollapse\x22>"+


                    // "<div class=\x22collapse navbar-collapse\x22 id=\x22navbarCollapse\x22>" +

                    "<div class=\x22nav-item active mx-2\x22>" +
                    "<span class=\x22text-white\x22>  Title : <h4>" + sceneResponse.sceneTitle + "</h4></span>"+
                    "</div>" +
                    "<div class=\x22nav-item active mx-2 pull-right\x22>" +
                    "<span class=\x22text-white\x22>  Short Code : <h4><a href=\x22https://strr.us/s/" + sceneResponse.short_id + "\x22>" + sceneResponse.short_id + "</a></h4></span>"+
                    "</div>" +

                    // "<li class=\x22nav-item active pull-right\x22>" +
                    // "<a class=\x22nav-link\x22 href=\x22http://" + sceneResponse.sceneDomain + "\x22>Home <span class=\x22sr-only\x22>(current)</span></a>" +
                    // "</li>" +
                    "<div class=\x22mx-2 pull-right\x22>"+



                    // "<div class=\x22pull-right\x22 data-toggle="tooltip" data-placement="top" title="Scene Available on Windows App" ng-class="{true: 'windows_no', false: 'windows_yes'}[!scene.sceneWindowsOK]">{{!scene.sceneWindowsOK && '' || ''}}</div>" +
                    // "<div class=\x22pull-right\x22ng-show="scene.sceneAndroidOK" data-toggle="tooltip" data-placement="top" title="Scene Available on Android App" ng-class="{true: 'android_no', false: 'android_yes'}[!scene.sceneAndroidOK]" >{{!scene.sceneAndroidOK && '' || ''}}</div>" +
                    // "<div class=\x22pull-right\x22ng-show="scene.sceneIosOK" data-toggle="tooltip" data-placement="top" title="Scene Available on IOS App" ng-class="{true: 'apple_no', false: 'apple_yes'}[!scene.sceneIosOK]" >{{!scene.sceneIosOK && '' || ''}}</div></a>" +

                    "<ul class=\x22navbar-nav pull-right\x22>" +
                    "<li class=\x22nav-item active mx-2\x22>" +
                   

                    "<li>" +
                    "&nbsp" +
                    "</li>" +
                    prevLink +
                    nextLink +

                    "<li>" +
                    "<a class=\x22mx-2 btn btn-primary btn-sm\x22 href=\x22../" + sceneResponse.short_id + "/webxr.html\x22 target=\x22_blank\x22>WebXR</a>" +
                    "</li>" +
                    "<li>" +
                    "<a class=\x22mx-2 btn btn-primary btn-sm\x22 href=\x22https://strr.us/connect/?scene=" + sceneResponse.short_id + "\x22 target=\x22_blank\x22>Livecast</a>" +
                    "</li>" +
                    "<li>" +
                    "<a class=\x22mx-2 pull-right  glyphicon glyphicon-envelope btn btn-primary btn-sm\x22 href=\x22mailto:" + sceneResponse.short_id + "@" + sceneResponse.sceneDomain + "\x22>Message</a>"+
                    // "<a class=\x22mx-2 pull-right>Send Message : " + sceneResponse.short_id + "@" + sceneResponse.sceneDomain + "</a>"+
                    "</li>" +

                    "<li>" +
                    "&nbsp &nbsp &nbsp &nbsp" +
                    "</li>" +
                    "<li class=\x22nav-item active\x22>" +
                    iosOK +
                    "</li>" +

                    "<li class=\x22nav-item active\x22>" +
                    androidOK +
                    "</li>" +
                    "<li class=\x22nav-item active\x22>" +
                    winOK +
                    "</li>" +
                    "<li>" +
                    "&nbsp &nbsp &nbsp &nbsp" +
                    "</li>" +
                    "<li>" +
                    "<a href=\x22https://servicemedia.net/qrcode/" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22 target=\x22_blank\x22><img style=\x22display: block; width: auto; height: 64; max-width: 64;\x22 alt=\x22qrcode\x22 src=\x22" + theUrl + "\x22/></a>" +
                    "</li>" +
                    "<li>" +
                    "&nbsp &nbsp &nbsp &nbsp" +
                    "</li>" +
                    "<li>" +
                    "<audio controls " + loopable + ">" +
                     "<source src='" + oggurl + "'type='audio/ogg'>" +
                     "<source src='" + mp3url + "'type='audio/mpeg'>" +
                     "Your browser does not support the audio element. " +
                     "</audio>" +
                    "</li>" +
                    
                    "<li>" +
                    "&nbsp" +
                    "</li>" +
                    "<li class=\x22nav-item active mx-2\x22>" +
                    " <div class=\x22fb-share-button\x22" +
                    " data-href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22" +
                    " data-layout=\x22button_count\x22>" +
                    " </div>" +
                    "</li>" +
                    "<li class=\x22nav-item active mx-2 pull-right\x22>" +
                    "<div class=\x22fb-like\x22" +
                    "data-href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22" +
                    "data-layout=\x22standard\x22" +
                    "data-action=\x22like\x22" +
                    "data-show-faces=\x22true\x22>" +
                    "</div>" +
                    "</li>" +


                    "</ul>" +
                    //  "</div>"+

                    //  "</div>"+

                    "</div>"+
                    "       </nav>" +

                    "<div id=/x22fb-root/x22></div>" +
//                  "<div style='background-image: url(" + image1url + "); height: 100%; width: 100%; border: 1px solid black;'>" +
                    "<div class=\x22container-fluid\x22>"+
                    // "<br><br>" +
                    "<div class=\x22my-12 row\x22>"+
                    "<div class=\x22 mx-5  col-sm\x22>"+
                    "<div class=\x22panel panel-default\x22 style=\x22text-align: center\x22>" +
                    //  "<div class=\x22panel-heading\x22>Scene Info:</div>" +
                     "<div class=\x22panel-body\x22 style=\x22text-align: center; margin-top: 50px; padding: 50px;\x22>" +
                     "<ul class=\x22list-group\x22 style=\x22text-align: left; margin-top: 10px; padding: 10px; background-color: rgba(255, 255, 255, 0.5);\x22>"+

                    keynoteText +
                    descText +
                    primaryText +
                    // "<li><div style=\x22width: 100%; top-margin: 20px; text-align: center;\x22><a href=\x22https://servicemedia.net/qrcode/" + sceneResponse.short_id +"\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + theUrl + "\x22/></a></div></li>" +
                    "</ul>" +
                    "</div>" +
                    "</div>" +

                    "</div>"+
                    "<div class=\x22 mx-2  col-sm\x22>"+

                    "</div>"+
                    "<div class=\x22 mx-4  col-sm\x22>"+
                    // "<div style=\x22width: 100%; top-margin: 0px; text-align: center;\x22><a href=\x22https://servicemedia.net/qrcode/" + sceneResponse.short_id +"\x22><imgwidth=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + theUrl + "\x22/></a></div>" +
                    // "<div style=\x22width: 100%; top-margin: 10px; text-align: center;\x22><img width=\x22auto\x22 height=\x22100%\x22 style=\x22display: block;\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/></div>"
                    "</div>"+
                    // "<div class=\x22mx-4  bg-light  col-sm mx-auto\x22>"+

                    // "<div  style=\x22margin-top: 100px; padding: 100px;\x22 class=\x22my-20 card\x22><h4>" + sceneResponse.sceneDescription + "</h4></div>"+
                    // "</div>"+
                    // "<div class=\x22mx-4 bg-light col-sm\x22>"+
                    // "<div class=\x22card mx-4\x22>" + sceneResponse.sceneTags + "</div>"+
                    // "</div>"+

                    "</div>"+


                    "</div>" +
                   "</div>" +

                    // "<script src=\x22https://code.jquery.com/jquery-3.2.1.slim.min.js\x22 integrity=\x22sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN\x22 crossorigin=\x22anonymous\x22></script>" +
                    // "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/danielgindi-jquery-backstretch/2.1.15/jquery.backstretch.js\x22></script>" +
                    "<script src=\x22../dist/jquery-3.1.1.min.js\x22></script>" +
                    "<script src=\x22../dist/jquery.backstretch.min.js\x22></script>" +
                    "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js\x22 integrity=\x22sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q\x22 crossorigin=\x22anonymous\x22></script>" +
                    "<script src=\x22https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js\x22 integrity=\x22sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl\x22 crossorigin=\x22anonymous\x22></script>" +

                    "<script>" +
                // To attach Backstrech as the body's background
                        // "if (" + hasPics + ") {"+
                            "$.backstretch(" + JSON.stringify(postcardArray) + ", {duration: 6000, fade: 750});" +
                        // "} " +
                        // else if (postcard1.Length > 4) {"+
                        //     "$.backstretch('" + postcard1 + "');}" +

                    "</script>"+
                    "</body>" +
                "</html>";
                s3.putObject({ Bucket: bucketFolder, Key: short_id + "/" + "index.html", Body: htmltext,  ContentType: 'text/html', ContentEncoding: 'identity' }, function (err, data) {
                    console.log('uploaded');
                });
                callback();

             }
        ], //waterfall end

        function (err, result) { // #last function, close async
            res.send("page generated");
            console.log("waterfall done: " + result);
        }
    );
});

//prior to server-side generation, I used this method to write the aframe files to an s3 bucket, to be served as static files.  Could come back...s
/*
app.get('/update_aframe_scene/:_id', requiredAuthentication, function (req, res) { //TODO lock down w/ checkAppID, requiredAuthentication

    console.log("tryna update webxr scene id: ", req.params._id + " excaped " + entities.decodeHTML(req.params._id));

    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    var requestedVideoItems = [];
    var requestedTextItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    var sceneOwnerID = "";
    var mp3url = "";
    var oggurl = "";
    var pngurl = "";
    var mp4url = "";
    var postcard1 = "";
    var image1url = "";
    var short_id = "";
    var picArray = [];
    var imageAssets = "";
    var imageEntities = "";
    var skyboxUrl = "";
    var skyboxID = "";
    var skySettings = "";
    var fogSettings = "";
    var ground = "";
    var ocean = "";
    var camera = "";
    var environment = "";
    var oceanScript = "";
    var ARScript = "";
    var ARSceneArg = "";
    var ARMarker = "";
    var randomizerScript = "";
    var animationComponent = "";
    var targetObjectAsset = "";
    var targetObjectEntity = "";
    var skyParticles;
    var videoAsset = "";
    var videoEntity = "";
    var nextLink = "";
    var prevLink = "";
    var loopable = "";
    var gltfs = {};
    var sceneGLTFs = [];
    var allGLTFs = {};
    var gltfUrl = "";
    var gltfs = "";
    var gltfsAssets = "";
    var gltfsEntities = "";
    // var gltfItems = [];
    var bucketFolder = "eloquentnoise.com";
    var playerPosition = "0 5 0";
    var style = "<link rel=\x22stylesheet\x22 type=\x22text/css\x22 href=\x22../styles/embedded.css\x22>";

    async.waterfall([


                function (callback) {
                    var o_id = ObjectID(reqstring);
                    db.scenes.findOne({"_id": o_id},
                        function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                            if (err || !sceneData) {
                                console.log("error getting scene data: " + err);
                                callback(err);
                            } else { //make arrays of the pics and audio items
                                sceneOwnerID = sceneData.user_id;
                                short_id = sceneData.short_id;
                                sceneResponse = sceneData;
                                if (sceneResponse.sceneDomain != null && sceneResponse.sceneDomain != "") {
                                    bucketFolder = sceneResponse.sceneDomain;
                                } else {
                                    callback(err);
                                }
                                if (sceneData.scenePictures != null) {
                                    sceneData.scenePictures.forEach(function (picture) {
                                        var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                        requestedPictureItems.push(p_id); //populate array
                                    });
                                }
                                if (sceneData.sceneType == "ARKit") {
                                    ARScript = "<script src=\x22https://raw.githack.com/jeromeetienne/AR.js/1.7.7/aframe/build/aframe-ar.js\x22></script>";
                                    // ARSceneArg = "arjs=\x22sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;\x22";           
                                    ARSceneArg = "arjs='sourceType: webcam;'";                                    
                                    // ARMarker =  "<a-marker-camera preset='custom' type='pattern' patternUrl='https://nilch.com/markers/pattern-playicon.patt'>" +
                                    // ARMarker =  "<a-marker-camera type='barcode' value='0'>" +
                                    ARMarker =  "<a-marker-camera preset='hiro'>" +
                                                    "<a-box scale='.1 .1 .1' position='0 0.5 0' material='color: yellow;'></a-box>" +
                                                "</a-marker-camera>";
                                    // camera = "<a-marker-camera preset='hiro'></a-marker-camera>";
                                                
                                } else {
                                    let wasd = "wasd-controls=\x22fly: false; acceleration: 33;\x22";
                                    if (sceneResponse.sceneFlyable) {
                                        "wasd-controls=\x22fly: true; acceleration: 50;\x22";
                                    }
                                    camera = "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+
                
                                    "<a-entity id=\x22head\x22 camera "+wasd+" look-controls touch-controls position=\x220 1.6 0\x22></a-entity>"+
                                    "<a-entity oculus-touch-controls=\x22hand: left\x22 laser-controls=\x22hand: left;\x22 handModelStyle: lowPoly; color: #ffcccc\x22 raycaster=\x22objects: .activeObjexRay;\x22></a-entity>" +
                                    "<a-entity oculus-touch-controls=\x22hand: right\x22 id=\x22right-hand\x22 hand-controls=\x22hand: right; handModelStyle: lowPoly; color: #ffcccc\x22 aabb-collider=\x22objects: .activeObjexGrab;\x22 grab></a-entity>"+
                                    "</a-entity>";
                                    // camera = "<a-entity position=\x220 3 0\x22 id=\x22cameraRig\x22>" +
                                    //         "<a-camera id=\x22camera\x22>" +
                                    //             "</a-camera>" +
                                    //             "<a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .screen\x22></a-entity>" +
                                    //             "<a-entity laser-controls raycaster=\x22objects: .screen;\x22></a-entity>" +
                                    //         "</a-entity>";
                                    // camera = "<a-entity id=\x22rig\x22 movement-controls position=\x22"+ playerPosition +"\x22>" +
                                    //             "<a-entity camera position=\x220 1 0\x22 look-controls=\x22pointerLockEnabled: true\x22></a-entity>" +
                                    //             "</a-entity>";

                                    // camera = "<a-entity id=\x22rig\x22 movement-controls position=\x22"+ playerPosition +"\x22>" +
                                    //              "<a-entity camera position=\x220 1 0\x22 look-controls=\x22pointerLockEnabled: true\x22  cursor=\x22rayOrigin: mouse\x22  position=\x22\x22 rotation=\x22\x22 laser-controls=\x22\x22 raycaster=\x22\x22>"+
                                    //                 "<a-entity animation__click=\x22property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.03 0.03 0.03; to: 0.015 0.015 0.015\x22 " + 
                                    //                 "animation__fusing=\x22property: scale; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 0.015 0.015 0.015; to: 0.03 0.03 0.03\x22 " + 
                                    //                 "animation__mouseleave=\x22property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 0.015 0.015 0.015\x22 cursor=\x22fuse: true;\x22 " +
                                    //                 "material=\x22color: white; shader: flat\x22 position=\x220 0 -1\x22 geometry=\x22primitive: ring\x22 scale=\x220.015 0.015 0.015\x22 raycaster=\x22\x22>" +
                                    //                 "</a-entity>" +
                                    //             "</a-entity>" +
                                    //             "</a-entity>";

                                                    // "<a-entity camera position=\x220 1 0\x22 look-controls=\x22pointerLockEnabled: true\x22  cursor=\x22rayOrigin: mouse\x22  position=\x22\x22 rotation=\x22\x22 laser-controls=\x22\x22 raycaster=\x22\x22>"+
                                                    // "<a-entity animation__click=\x22property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.03 0.03 0.03; to: 0.015 0.015 0.015\x22 " + 
                                                    // "animation__fusing=\x22property: scale; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 0.015 0.015 0.015; to: 0.03 0.03 0.03\x22 " + 
                                                    // "animation__mouseleave=\x22property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 0.015 0.015 0.015\x22 cursor=\x22fuse: true;\x22 " +
                                                    // "material=\x22color: white; shader: flat\x22 position=\x220 0 -1\x22 geometry=\x22primitive: ring\x22 scale=\x220.015 0.015 0.015\x22 raycaster=\x22\x22>" +
                                                    // "</a-entity>" +
                                    // camera = "<a-entity position=\x220 0 2.3\x22 rotation=\x220 -4 0\x22 id=\x22cam\x22>" +
                                    //                 "<a-entity id=\x22camera\x22 camera=\x22userHeight: 1.6\x22 cursor=\x22rayOrigin: mouse\x22  look-controls=\x22\x22 position=\x22\x22 rotation=\x22\x22 raycaster=\x22\x22></a-entity>" +
                                    //                 "<a-camera near=\x22.5\x22 camera=\x22\x22 position=\x22\x22 rotation=\x22\x22 look-controls=\x22\x22 wasd-controls=\x22\x22>" +
                                    //                 "<a-entity animation__click=\x22property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.03 0.03 0.03; to: 0.015 0.015 0.015\x22 " + 
                                    //                 "animation__fusing=\x22property: scale; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 0.015 0.015 0.015; to: 0.03 0.03 0.03\x22 " + 
                                    //                 "animation__mouseleave=\x22property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 0.015 0.015 0.015\x22 cursor=\x22fuse: true;\x22 " +
                                    //                 "material=\x22color: white; shader: flat\x22 position=\x220 0 -1\x22 geometry=\x22primitive: ring\x22 scale=\x220.015 0.015 0.015\x22 raycaster=\x22\x22>" +
                                    //                 "</a-entity>" +
                                    //             "</a-camera>" +
                                    //             "</a-entity>";   
                                }

                                sceneResponse.scenePostcards = sceneData.scenePostcards;
                                if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3) {
                                    skySettings = "<a-sky color='" + sceneResponse.sceneColor1 + "'></a-sky>"; //overwritten below if there's a skybox texture
                                } 
                                
                                if (sceneResponse.sceneUseGlobalFog || sceneResponse.sceneUseSceneFog) {
                                    fogSettings = "fog=\x22type: linear; density:.002; near: 1; far: 50; color: " +sceneResponse.sceneColor1 + "\x22";
                                }
//                                if (sceneResponse.sceneUseSkyParticles) { 
//                                    skyParticles = "<a-entity scale='.5 .5 .5' position='0 3 0' particle-system=\x22preset: dust; randomize: true color: " + sceneResponse.sceneColor1 + "," + sceneResponse.sceneColor2 +"\x22></a-entity>";
//                                }
                                if (sceneResponse.sceneRenderFloorPlane) {
                                    // ground = "<a-plane rotation='-90 0 0' position='0 -1 0' width='100' height='100' color=\x22" + sceneResponse.sceneColor2 + "\x22></a-plane>";
                                    ground = "<a-plane rotation='-90 0 0' position='0 -1 0' width='100' height='100'></a-plane>";
                                }
                                if (sceneResponse.sceneWater != null && sceneResponse.sceneWater.name != "none") {
                                    ocean = "<a-ocean width='50' depth='50' density='50' opacity='.7' position='0 3 0'></a-ocean>";
                                }
                                // if (sceneResponse.sceneUseTargetObject && sceneResponse.sceneTargetObject.name == "gltftest" ) {
                                //     targetObjectAsset = "<a-asset-item id=\x22targetObj\x22 src=\x22../assets/models/korkus/KorkusOnly.gltf\x22></a-asset-item>";
                                //     targetObjectEntity = "<a-entity gltf-model=\x22#targetObj\x22 position='-5 5 5'></a-entity>";
                                // }
                                if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                                    nextLink = "href=\x22../" + sceneResponse.sceneNextScene + "\x22";
                                }
                                if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                                    prevLink = "href=\x22../" + sceneResponse.scenePreviousScene + "\x22";
                                }
                                if (sceneResponse.sceneLoopPrimaryAudio) {
                                    loopable = "loop='true'";
                                }
                                if (sceneResponse.sceneLocations != null && sceneResponse.sceneLocations.length > 0) {
                                    for (var i = 0; i < sceneResponse.sceneLocations.length; i++) {
                                        if (sceneResponse.sceneLocations[i].markerType == "gltf") {
                                            sceneGLTFs.push(sceneResponse.sceneLocations[i]);
                                            if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4) {
                                                animationComponent = "<script src=\x22https://unpkg.com/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js\x22></script>";
                                            }
                                        }
                                        if (sceneResponse.sceneLocations[i].markerType == "player") {
                                            playerPosition = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                        }
                                    }
                                }
                                if (sceneData.scenePrimaryAudioID != null && sceneData.scenePrimaryAudioID.length > 4) {
                                    var pid = ObjectID(sceneData.scenePrimaryAudioID);
                                    console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneData.scenePrimaryAudioID));
                                    requestedAudioItems.push(ObjectID(sceneData.scenePrimaryAudioID));

//                                  sceneResponse = sceneData[0];
                                    // console.log(JSON.stringify(requestedAudioItems));
                                }
                                callback();
                                
                            }
                            // callback();

                        });
            },
            // function (callback){
            //     var params = {
            //         Bucket: bucketFolder,
            //         Prefix: short_id + '/'
            //     };

            //     s3.listObjects(params, function(err, data) { //delete all the things in the target bucket, to cleanup kruft..
            //         if (err) {
            //             console.log("error listing objs " + err);
            //             return callback(err);
            //         } else {

            //         console.log("fixing to delete objs: " + data);  //not really, keep for this...
            //         return callback();
            //         // if (data.Contents.length == 0) {
            //         //     callback(null);
            //         //     } else {
            //         //     params = {Bucket: bucketFolder};
            //         //     params.Delete = {Objects:[]};


            //         //     data.Contents.forEach(function(content) {
            //         //         params.Delete.Objects.push({Key: content.Key});
            //         //     });
            //         //     console.log("delete params: " + JSON.stringify(params));
            //         //     s3.deleteObjects(params, function(err, data) {
            //         //         if (err) {
            //         //             console.log("error deleting " + err)
            //         //             return callback(err);
            //         //         } else {
            //         //             callback(null);
            //         //             }
            //         //         });
            //         //     }
            //         }
            //     });
            // },

            // function (callback) { // if scene has gltfs, get their signed urls//
            //     if (sceneGLTFs.length > 0) {
            //         var params = {
            //             Bucket: 'servicemedia',
            //             Prefix: 'users/' + u_id + '/gltf/'
            //         }
            //         s3.listObjects(params, function(err, data) { //TODO !!! only fetch the ones needed!
            //             if (err) {
            //                 console.log(err);
            //                 return callback(err);
            //             }
            //             if (data.Contents.length == 0) {
            //                 console.log("no content found");
            //                 callback(null);
            //             } else {
            //                 allGLTFs = data.Contents;
            //                 callback();
            //             }
            //         });
            //     } else {
            //         callback();
            //     }
            // },
            function (callback) {
                if (sceneGLTFs.length > 0) {
                    var assetNumber = 1;
                    var scale = 1;
                                var offsetPos = "";
                                var rotAnim = "";
                                var posAnim = "";
                                var rightRot = true;
                                var rotVal = 360;
                                var objAnim = "";
                    async.each (sceneGLTFs, function (r, callbackz) { //loop tru w/ async
                        // for (var i = 0; i < sceneGLTFs)
                        var sourcePath =   "servicemedia/users/" + sceneOwnerID + "/gltf/" + r.gltf;
                        console.log("tryna copy " + sourcePath);
                        // var assetURL = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: fileKey, Expires: 60000});
                        // itme.url = assetURL;
                        assetNumber++;
                        var assetID = "gltfasset" + assetNumber;
                        // gltfItems.push(itme);
                        // gltfs = gltfs + "<a-gltf-model src=\x22" + assetURL + "\x22 crossorigin=\x22anonymous\x22 position =\x22"+r.x+" "+r.y+" "+r.z+"\x22></a-gltf-model>";
                        // gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ assetURL +"\x22></a-asset-item>";
                        // gltfsEntities = gltfsEntities + "<a-entity gltf-model=\x22#" + assetID + "\x22></a-entity>";
                        // console.log("sceneGLTFs: " + gltfs);
                        s3.copyObject({Bucket: bucketFolder, CopySource: sourcePath, Key: short_id +"/"+ r.gltf}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject");
                                console.log(err);
                                callbackz(err);
                            } else {
                                console.log('SUCCESS copyObject' + JSON.stringify(data));
                                randomizerScript = "<script src=\x22https://unpkg.com/aframe-randomizer-components@3.0.2/dist/aframe-randomizer-components.min.js\x22></script>;"
                                
                                if (r.markerObjScale != null && r.markerType != undefined){
                                    scale = r.markerObjScale;
                                }
                                if (r.eventData != null && r.eventData != undefined && r.eventData.length > 4) { //eventData has anim 
                                    console.log("!!!tryna setup animation " + r.eventData);

                                    rightRot = !rightRot;
                                    if (rightRot == true) {
                                        rotVal = -360;
                                    }
                                    var eSplit = r.eventData.split("~");
                                    if (eSplit[0] == "orbit") { 

                                        offsetPos =  "<a-entity position=\x22"+ eSplit[1] + " 0 0\x22></a-entity>";
                                        // rotAnim = " rotation=\x220 0 0\x22 animation=\x22property: rotation; to: 0 " + rotVal + " 0; repeat=\x22indefinite\x22 easing=\x22linear\x22 dur: 20000\x22 ";
                                        rotAnim = " animation__rot=\x22property:rotation; dur:3000; to:0 360 0; loop: true; easing:linear;\x22 ";                                    
                                        posAnim = " animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;\x22 ";
                                    }
                                }
                                gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ r.gltf +"\x22></a-asset-item>";
                                gltfsEntities = gltfsEntities + "<a-entity gltf-model=\x22#" + assetID + "\x22 position =\x22"+r.x+" "+r.y+" "+r.z+"\x22 random-rotation scale=\x22"+scale+" "+scale+" "+scale+"\x22 " + posAnim + " " + rotAnim + " " + objAnim + ">" + offsetPos + "</a-entity>";
                                callbackz();
                            }
                        });
                        
                    }, function(err) {
                       
                        if (err) {
                            console.log('A file failed to process');
                            callbackz(err);
                        } else {
                            console.log('All files have been processed successfully');
                            // gltfItems.reverse();
                            // rezponze.gltfItems = gltfItems;
                            callback(null);
                        }
                    });
                } else {
                    callback();
                }
            },
            function (callback) {
                if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                    db.scenes.findOne({$or: [ { short_id: sceneResponse.sceneNextScene }, { sceneTitle: sceneResponse.sceneNextScene } ]}, function (err, scene) {
                        if (scene == err) {
                            console.log("didn't find that scene");
                        } else {
                            nextLink = "href=\x22../" + scene.short_id + "/index.html\x22";    
                        }
                    }); 
                }
                if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                    db.scenes.findOne({$or: [ { short_id: sceneResponse.scenePreviousScene }, { sceneTitle: sceneResponse.scenePreviousScene } ]}, function (err, scene) {
                        if (scene == err) {
                            console.log("didn't find that scene");
                        } else {
                            prevLink = "href=\x22../" + scene.short_id + "/index.html\x22";    
                        }
                    }); 
                }
                callback();
            },

            function (callback) { //fethc audio items

                    db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items) {
                        if (err || !audio_items) {
                            console.log("error getting audio items: " + err);
                            callback(null);
                        } else {

                            callback(null, audio_items) //send them along
                        }
                    });
            },
            
            function (audio_items, callback) { //add the signed URLs to the obj array
                    for (var i = 0; i < audio_items.length; i++) {
                        console.log("audio_item: ", audio_items[i]);
                        var item_string_filename = JSON.stringify(audio_items[i].filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 1000);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        //console.log(baseName);
                        var mp3Name = baseName + '.mp3';
                        var oggName = baseName + '.ogg';
                        var pngName = baseName + '.png';
                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + mp3Name, Key: short_id +"/"+ audio_items[i]._id + "." + mp3Name}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject");
                                console.log(err);
                            }
                            else {
                                console.log('SUCCESS copyObject');
                            }
                        });

                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + oggName, Key: short_id +"/"+ audio_items[i]._id + "." + oggName}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject");
                                console.log(err);
                            }
                            else {
                                console.log('SUCCESS copyObject');

                            }
                        });
                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + audio_items[i].userID +"/"+ audio_items[i]._id + "." + pngName, Key: short_id +"/"+ audio_items[i]._id + "." + pngName}, function (err,data){
                            if (err) {
                                console.log("ERROR copyObject" + err);
                            }
                            else {
                                console.log('SUCCESS copyObject');
                            }
                        });
                        mp3url = audio_items[i]._id + "." + mp3Name;
                        oggurl = audio_items[i]._id + "." + oggName;
                        pngurl = audio_items[i]._id + "." + pngName;
                        console.log("copying audio to s3...");
                    }

                    callback(null);
                },
            function (callback) {
                    if (mp3url == null || mp3url == undefined || mp3url.length < 10) {
                        if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 8 ) {
                            mp3url = sceneResponse.scenePrimaryAudioStreamURL + "/stream";   
                            oggurl = sceneResponse.scenePrimaryAudioStreamURL + "/stream";                    
                            callback();
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }  
            },
            function (callback) { //fethc video items
                if (sceneResponse.sceneVideos != null) {
                    sceneResponse.sceneVideos.forEach(function (vid) {
                        console.log("looking for sceneVideo : " + JSON.stringify(vid));
                        var p_id = ObjectID(vid); //convert to binary to search by _id beloiw
                        requestedVideoItems.push(p_id); //populate array
                    });
                    db.video_items.find({_id: {$in: requestedVideoItems}}, function (err, video_items) {
                        if (err || !video_items) {
                            console.log("error getting video items: " + err);
                            callback(null, new Array());
                        } else {
                            console.log("gotsome video items: " + JSON.stringify(video_items[0]));

                            callback(null, video_items) //send them along
                        }
                    });
                } else {
                    callback(null, new Array());
                }
            },

            function (video_items, callback) { //add the signed URLs to the obj array

                    //for (var i = 0; i < 1; i++) { //only do first one for now..
                        if (video_items != null && video_items[0] != null) {
                            console.log("video_item: " + JSON.stringify(video_items[0]));
                            var item_string_filename = JSON.stringify(video_items[0].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            //console.log(baseName);
                            var mp4Name = baseName + '.mp4';
                            console.log("mp4 video: " + mp4Name + " " + video_items[0]._id);
                            var vid = video_items[0]._id;
                            var ori = video_items[0].orientation != null ? video_items[0].orientation : "";
                            mp4url = vid + "." + mp4Name;
                            s3.copyObject({
                                Bucket: bucketFolder,
                                CopySource: 'servicemedia/users' + video_items[0].userID + "/" + video_items[0]._id + "." + mp4Name,
                                Key: short_id + "/" + video_items[0]._id + "." + mp4Name
                            }, function (err, data) {
                                if (err) {
                                    console.log("ERROR copyObject");
                                    console.log(err);
                                    callback(null);
                                } else {
                                    console.log('SUCCESS copyObject for video item ');

//                                    videoAsset = "<video id=\x22video1\x22 src=\x22" + mp4url + "\x22 autoplay='true' loop='true'>";
                                    if (ori == "equirectangular") {
                                        videoEntity = "<a-videosphere src=\x22" + mp4url + "\x22 rotation=\x220 180 0\x22 material=\x22shader: flat; transparent: true;\x22></a-videosphere>";
//                                        skySettings = "transparent='true'";
                                    } else {
                                        videoEntity = "<a-video src=\x22#video1\x22 position='5 5 -5' width='8' height='4.5' look-at=\x22#player\x22></a-video>";
                                    }
                                    console.log("copying video to s3...");
                                    callback(null);

                                }
                            });
                    } else {
                        callback(null);
                    }
            },

            function (callback) {
                var postcards = [];
                console.log("sceneResponse.scenePostcards: " + JSON.stringify(sceneResponse.scenePostcards));
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    var index = 0;
                    async.each(sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);

                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting postcard " + postcardID + err);
                                callbackz();
                            } else {

                                s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item._id + ".standard." + picture_item.filename,
                                    Key: short_id +"/"+ picture_item._id + ".standard." + picture_item.filename}, function (err, data) {
                                    if (err) {
                                        console.log("ERROR copyObject" + err);
                                    }
                                    else {
                                        console.log('SUCCESS copyObject');

                                    }

                                });
                                index++;
                                postcard1 = picture_item._id + ".standard." + picture_item.filename;
//                                picArray.push(image1url);
//                                imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 src='"+ image1url +"'>";
//                                imageEntities = imageEntities + "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                callbackz();
                            }
                        });
                        },
                        function (err) {
                       
                            if (err) {
                                console.log('A file failed to process');
                                callback(null);
                            } else {
                                console.log('All files have been processed successfully');
                                callback(null);
                            }
                        });
                    } else {
    //                      callback(null);
                        callback(null);
                    }
         },
            function (callback) {
                var postcards = [];
                console.log("sceneResponse.scenePictures: " + JSON.stringify(sceneResponse.scenePictures));
                if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                    var index = 0;
                    async.each(sceneResponse.scenePictures, function (picID, callbackz) { //nested async-ery!
                            var oo_id = ObjectID(picID);

                            db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                if (err || !picture_item) {
                                    console.log("error getting scenePictures " + picID + err);
                                    callbackz();
                                } else {
                                    console.log("tryna copy picID " + picID + " orientation " + picture_item.orientation);
                                    var version = ".standard.";
                                    if (picture_item.orientation == "equirectangular") {
                                        skyboxID = picID;
                                        version = ".original.";
                                    }
                                    s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item.filename, //use full rez pic for skyboxen
                                        Key: short_id +"/"+ picture_item._id + version + picture_item.filename}, function (err, data) {
                                        if (err) {
                                            console.log("ERROR copyObject" + err);
                                        } else {
                                            console.log('SUCCESS copyObject');
                                        }
                                    });
                                    if (picture_item.orientation != "equirectangular") {
                                        index++;
                                        image1url = picture_item._id + ".standard." + picture_item.filename;
                                        picArray.push(image1url);
                                        imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 src='" + image1url + "'>";
                                        imageEntities = imageEntities + "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                    }
                                    callbackz();
                                }
                            });
                        },
                        function (err) {
                           
                            if (err) {
                                console.log('A file failed to process');
                                callback(null);
                            } else {
                                console.log('All files have been processed successfully');
                                callback(null);
                            }
                        });
                } else {
                    //                      callback(null);
                    callback(null);
                }
            },

            function (callback) {

//                if (sceneResponse.sceneUseSkybox && sceneResponse.sceneSkybox != null) {
//                    if (sceneResponse.sceneUseSkybox) {
                            if (skyboxID != "") {
                                var oo_id = ObjectID(skyboxID);
                            } else {
                                if (sceneResponse.sceneSkybox != null && sceneResponse.sceneSkybox != "")
                                var oo_id = ObjectID(sceneResponse.sceneSkybox);
                            }

                            if (oo_id) {

                                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                    if (err || !picture_item) {
                                        console.log("error getting skybox " + sceneResponse.sceneSkybox + err);
                                        callback(null);
                                    } else {

                                        s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID + "/" + picture_item.filename,
                                            Key: short_id + "/" + picture_item._id + ".original." + picture_item.filename}, function (err, data) {
                                            if (err) {
                                                console.log("ERROR copyObject" + err);
                                            }
                                            else {
                                                console.log('SUCCESS copyObject');

                                            }

                                        });
//                                    skyboxAsset = "<img id=\x22smskybox"\x22 src='" + skyboxUrl + "'>";
//                                    skyboxEntity = "<a-image look-at=\x22#player\x22 width='10' segments-height='4' segments-width='2' height='10' position='-2 6 2' rotation='0 180 0' visible='true' src=\x22#smimage" + index + "\x22></a-image>";
                                        skyboxUrl = picture_item._id + ".original." + picture_item.filename;
                                        skySettings = "<a-sky hide-in-ar-mode src=#sky></a-sky>";
                                        callback(null);
                                    }
                                });
                            } else {
                                callback(null);
                            }
//                } else {
//                    //                      callback(null);
//                    callback(null);
//                }
            },

            function (callback) {
                var playButton = "<script>" +
                "AFRAME.registerComponent('playbutton', {" +
                "schema: {" + 
                  "'target': {type: 'selector'}, " +
                    "}," +
                  "init: function () {" +
                  "var play=false;    " +
                  "var mAudio = document.getElementById(\x22mainaudio\x22);" +
                    "this.el.addEventListener(\x22click\x22,()=>{" +
                    "if(play){" +
                        "console.log(\x22tryna play\x22);" +
                        "mAudio.play();" +
                        //   "this.data.target.setAttribute(\x22visible\x22,\x22false\x22);" +
                        // "this.el.querySelector(\x22a\x22).innerHTML=\x22Play\x22;" +
                        "}else{" +
                        "console.log(\x22tryna pause\x22);" +
                        "mAudio.pause();" +
                    //   "this.data.target.setAttribute(\x22visible\x22,\x22true\x22);" +
                    //   " this.el.querySelector(\x22a\x22).innerHTML=\x22Pause\x22;" +
                        "}" +
                      "play=!play;" +
                      "});" +
                    "  }" +
                "});" +
                "</script>";
                var embeddedHTML = "<div class=\x22screen dark main\x22>" +                
                // "<ul>" +
                // "<li>" +
                "<a class=\x22button\x22 href=\x22http://" + sceneResponse.sceneDomain + "\x22>Home</a>" +
                // "</li>" +
                // "<li>" +
                "<a class=\x22button\x22 href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "/index.html\x22>" + sceneResponse.sceneTitle + " : " + sceneResponse.short_id + "</a>" +
                // "</li>" +
                // "<li>" +
                "<a-entity playbutton><a class=\x22button\x22 href=\x22javascript:void(0)\x22>Play Main Audio</a></a-entity>" +
                // "<audio controls " + loopable + " id=\x22mainaudio\x22>" +
                //  "<source src='" + oggurl + "'type='audio/ogg'>" +
                //  "<source src='" + mp3url + "'type='audio/mpeg'>" +
                //  "Your browser does not support the audio element. " +
                //  "</audio>" +
                // "</li>" +
                // "</ul>" +
                "</div>";
                var htmltext = "<html xmlns='http://www.w3.org/1999/xhtml'>" +
                    "<head> " +
                    "<meta charset='utf-8'/>" +
                    "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                    "<meta property='og:url' content='http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "' /> " +
                    "<meta property='og:type' content='website' /> " +
                    "<meta property='og:image' content='http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "/" + postcard1 + "' /> " +
                    "<meta property='og:image:height' content='1024' /> " +
                    "<meta property='og:image:width' content='1024' /> " +
                    "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                    "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                    "<title>" + sceneResponse.sceneTitle + "</title>" +
                    "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                    "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                    "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                    "<meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />" +
                    "<meta name='apple-mobile-web-app-status-bar-style' content='black'>" +
                    "<meta name='robots' content='index,follow'/>" +
                    // "<script src='../dist/compat.js'></script>" +
//                    "<script src='../dist/unlockaudio.js'></script>" +

                    "<script src='https://aframe.io/releases/1.0.3/aframe.min.js'></script>" +
//                    "<script src='../dist/aframe-particle-system-component.min.js'></script>" +
                    // "<script src='../dist/aframe-href-component.js'></script>" +
//                    "<script>window.WebVRConfig = {BUFFER_SCALE: 1.0,};</script>"+
                    // "<script src='https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v6.0.1/dist/aframe-extras.min.js'></script>" +
                    "<script src='https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v6.0.1/dist/aframe-extras.min.js'></script>" +
                    // <script src="https://unpkg.com/aframe-look-at-component@0.8.0/dist/aframe-look-at-component.min.js"></script>
                    "<script src='https://unpkg.com/aframe-look-at-component@0.8.x/dist/aframe-look-at-component.min.js'></script>" +
                    "<script src='https://unpkg.com/aframe-layout-component@4.0.1/dist/aframe-layout-component.min.js'></script>" +
                    "<script src='https://supereggbert.github.io/aframe-htmlembed-component/dist/build.js'></script>" +
                    ARScript +
                    // "<script src='../dist/components/servmed.js'></script>" +
//                    "<script src='../dist/components/audioanalyser-levels-scale.js'></script>"+
//                    "<script src='../dist/components/audioanalyser-volume-bind.js'></script>"+
//                    "<script src='../dist/components/audioanalyser-volume-scale.js'></script>"+
//                    "<script src='../dist/components/audioanalyser-waveform.js'></script>"+
//                    "<script src='../dist/components/ring-on-beat.js'></script>"+
//                    "<script src='../dist/components/color-on-beat.js'></script>"+
//                    "<script src='../dist/components/aframe-passthrough-component.min.js'></script>"+
//                      "<script src='../dist/components/aframe-randomizer-components.min.js'></script>"+
//                    "<script src='../dist/components/aframe-audioanalyser-components.js'></script>"+
                    "<link rel=\x22stylesheet\x22 href=\x22https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css\x22 integrity=\x22sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm\x22 crossorigin=\x22anonymous\x22></link>"+
                    // "<script src=\x22../dist/jquery-3.1.1.min.js\x22></script>" +
                    // // "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js\x22 integrity=\x22sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb\x22 crossorigin=\x22anonymous\x22></script>" +
                    // "<script src=\x22../dist/bootstrap-4.0.0-alpha.6-dist/js/bootstrap.min.js\x22></script>" +

                    // input, select,textarea{border: 1px solid #000000;margin: 0;background-color: #ffffff;-webkit-appearance: none;}:-webkit-autofill {color: #fff !important;}input[type='checkbox']{width: 20px;height: 20px;display: inline-block;}input[type='radio']{width: 20px;height: 20px;display: inline-block;border-radius: 50%;}input[type='checkbox'][checked],input[type='radio'][checked]{background-color: #555555;}a-entity[htmlembed] img{display:inline-block}a-entity[htmlembed]{display:none}
                    // "<style>" +
                    // ".htmlBox{" +
                    //     "display: inline-block;" +
                    //     "border-radius: 5px;"+
                    //     "background-color: #dddddd;"+
                    //     "color: #000000;"+
                    // "}"+
                    // "</style>"+
                    style +
                    playButton + 
                    
                    "</head>" +

                    "<body bgcolor='black'>" +
                    "<div style=\x22width:100%; height:100%\x22>"+

                    /*
                                        "<script>" +
//                    "window.fbAsyncInit = function() {" +
//                        "FB.init({" +
//                        "appId : '1678172455793030'," +
//                        "xfbml : true," +
//                        "version:'v2.8'" +
//                        "});" +
//                        "};" +
                    "window.fbAsyncInit = function() {" +
                    "FB.init({" +
                    "appId : '1678172455793030'," +
                    "xfbml : true," +
                    "version : 'v2.8'" +
                    "});" +
                    "FB.AppEvents.logPageView();" +
                    "};" +
                    "(function(d, s, id) {" +
                    "var js, fjs = d.getElementsByTagName(s)[0];" +
                    "if (d.getElementById(id)) return;" +
                    "js = d.createElement(s); js.id = id;" +
                    "js.src = \x22//connect.facebook.net/en_US/sdk.js\x22;" +
                    "fjs.parentNode.insertBefore(js, fjs);" +
                    "}(document, 'script', 'facebook-jssdk'));</script>" +
                    */
                   /*

//                    "<nav class=\x22navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse\x22>" +
                    // "<nav class=\x22navbar navbar-expand-lg navbar-dark bg-dark fixed-top\x22>" +
                    // "<button class=\x22navbar-toggler\x22 type=\x22button\x22 data-toggle=\x22collapse\x22 data-target=\x22#navbarSupportedContent\x22 aria-controls=\x22navbarSupportedContent\x22 aria-expanded=\x22false\x22 aria-label=\x22Toggle navigation\x22>"+
                    // "<button class=\x22navbar-toggler navbar-toggler-right\x22 type=\x22button\x22 data-toggle=\x22collapse\x22 data-target=\x22#navbarCollapse\x22 aria-controls=\x22navbarCollapse\x22 aria-expanded=\x22false\x22 aria-label=\x22Toggle navigation\x22>" +
                    // "<span class=\x22navbar-toggler-icon\x22></span>" +
                    // "</button>" +



                    // "<div class=\x22collapse navbar-collapse pull-right\x22 id=\x22navbarSupportedContent\x22>" +
                    // "<ul class=\x22navbar-nav pull-right \x22>" +

                    // "<li class=\x22nav-item active\x22>" +
                    // " <div class=\x22fb-share-button\x22" +
                    // " data-href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22" +
                    // " data-layout=\x22button_count\x22>" +
                    // " </div>" +
                    // "</li>" +
                    // "<li class=\x22nav-item active\x22>" +
                    // "<div class=\x22fb-like\x22" +
                    // "data-href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "\x22" +
                    // "data-layout=\x22standard\x22" +
                    // "data-action=\x22like\x22" +
                    // "data-show-faces=\x22true\x22>" +
                    // "</div>" +
                    // "</li>" +

                    // "<li class=\x22nav-item active\x22>" +
                    // "<a class=\x22nav-link\x22 href=\x22http://" + sceneResponse.sceneDomain + "\x22>" + sceneResponse.sceneDomain + " <span class=\x22sr-only\x22>(current)</span></a>" +
                    // "</li>" +
                    // "<li class=\x22nav-item active pull-right\x22>" +
                    // "<a class=\x22nav-link\x22 href=\x22http://" + sceneResponse.sceneDomain + "/" + sceneResponse.short_id + "/index.html\x22>" + sceneResponse.sceneTitle + " : " + sceneResponse.short_id + "</a>" +
                    // "</li>" +
                    // "<lic lass=\x22nav-item active pull-right\x22>" +
                    "<div style=\x22display: none;\x22>" +
                    "<audio controls " + loopable + " id=\x22mainaudio\x22>" +
                     "<source src='" + oggurl + "'type='audio/ogg'>" +
                     "<source src='" + mp3url + "'type='audio/mpeg'>" +
                     "Your browser does not support the audio element. " +
                    "</audio>" +
                    "</div>" +
                    // "</li>" +
                    // "</ul>" +

                    // "</nav>" +
                    // // "<div id=/x22fb-root/x22></div>" +
//                  "<div style='background-image: url(" + image1url + "); height: 100%; width: 100%; border: 1px solid black;'>" +

                    "<a-scene " + fogSettings + " " + ARSceneArg + " " + environment + ">" +
                    ARMarker +
                    camera +
//                     "   <a-entity camera universal-controls position='3 5 -10'></a-entity>"+
                    // "<a-entity camera look-controls wasd-controls  position='2 5 2'><a-entity cursor=\x22fuse: true; fuseTimeout: 1000\x22 scale=\x22.015 .015 .015\x22 position=\x220 0 -1\x22 geometry=\x22primitive: ring\x22 material=\x22color: red; shader: flat\x22></a-entity></a-entity>" +
                    // "<a-entity id=\x22rig\x22 movement-controls position=\x22"+ playerPosition +"\x22>" +
                    //     "<a-entity camera position=\x220 1 0\x22 look-controls=\x22pointerLockEnabled: true\x22></a-entity>" +
                    // "</a-entity>" +  
                    // "<a-entity geometry=\x22primitive: plane; height: 3; width: 6\x22>"+
//                    "material=\x22color: blue\x22 text=\x22 color: white; opacity: 1; value:"+ sceneResponse.sceneDescription + ";\x22></a-entity>"+
                    // "<a-entity look-at=\x22#player\x22position='15, 10, -15' rotation='0 180 0' scale='10 10 10' geometry=\x22primitive: plane; height: auto; width: 2\x22 material=\x22color: black\x22  text=\x22color: white; opacity: 1; value: " + sceneResponse.sceneDescription + "; font: kelsonsans; wrapCount: 40; zOffset: .01\x22></a-entity>" +
                    // "<a-entity geometry=\x22primitive: plane; height: 30; width: 60\x22 material=\x22side: double\x22 look-at=\x22#player\x22 ppc=\x22500\x22 htmlembed position=\x220 6 0\x22 >" +
                    "<a-entity look-at=\x22#player\x22 ppc=\x22500\x22 htmlembed position=\x220 6 -6\x22 >" +
                    // "<div style=\x22bg-light\x22><h1>"+sceneResponse.sceneKeynote+"</h1><p>"+sceneResponse.sceneDescription+"</p></div><img src=\x22"+picArray[0]+"\x22 class=\x22image-thumbnail\x22 alt=\x22image\x22>"+ 
                    // "<div style=\x22background-color: white;\x22><p style=\x22color:blue;margin:20px;font-size:46px;\x22>"+sceneResponse.sceneKeynote+"</p><p style=\x22color:red;margin:20px;font-size:36px;\x22>"+sceneResponse.sceneDescription+"</p></div>"+
                    // "<div><h1>"+sceneResponse.sceneKeynote+"</h1><p>"+sceneResponse.sceneDescription+"</p></div>"+ 
                    
                    embeddedHTML +
                    "</a-entity>" +

//text="color: white; font: sourcecodepro; height: 1; opacity: 1; value: A-Frame Demo scene - text + pics + sound !; width: 1; wrapCount: 20; zOffset: 0"

//                "   <a-entity rotation="-90 0 0" scale="0.3 0.3 0.3" ply-model="src: url(../../assets/island-hut/island-hut.bake.ply);"></a-entity>"+
//                    "<a-entity id=\x22audioanalyser\x22 audioanalyser=\x22src: #song\x22></a-entity>"+
//                    "<a-entity id=\x22audioanalyser\x22 audioanalyser=\x22src: #song\x22 audioanalyser-waveform=\x22radius: 0.5\x22 rotation=\x2290 0 0\x22 position=\x220 20 0\x22></a-entity>"+
//                    ocean +
                    ground +
                    skyParticles +
                    "<a-assets>" +
//                    "<img id='my-image' src='"+ image1url +"'>"+
                    // "<img id='next' src='../assets/glyphs/next.png'>" +
                    // "<img id='prev' src='../assets/glyphs/prev.png'>" +
                    // "<img id='pause' src='../assets/glyphs/pause.png'>" +
                    // "<img id='play' src='../assets/glyphs/play.png'>" +
//                    "<a-circle src='#smimage1' radius='50' rotation='-90 0 0'></a-circle>"+
                    // "<a-asset-item id=\x225sided\x22  src=\x22" + gltfUrl + "\x22 crossorigin=\x22anonymous\x22></a-asset-item>" +
                    "<a-asset><img id=\x22sky\x22 src=\x22" + skyboxUrl +"\x22>></a-asset>" +
                    imageAssets +
                    "<audio id=\x22song\x22 crossorigin " + loopable + " autoload src=\x22" + mp3url + "\x22></audio>" +
                    gltfsAssets +
                    videoAsset +
//                    targetObjectAsset +
                    "</a-assets>" +
  
                    // "<a-entity gltf-model=\x22url(" + gltfUrl + ")\x22 crossorigin=\x22anonymous\x22 position ='20 0 0'></a-entity>"+
                    // "<a-entity position='0 0 2' gltf-model=\x22#5sided\x22 crossorigin=\x22anonymous\x22></a-entity>" +
                    gltfsEntities + 
                    "<a-entity position='0 3.5 0' layout=\x22type: circle; radius: 30\x22>" +
                    imageEntities +
                    "</a-entity>" +
//                    targetObjectEntity +
                    videoEntity +
                    // "<a-entity position='-15 4 -15' look-at=\x22#player\x22>" +
                    // "<a-circle position='4 0 0' " + nextLink + "src='#next' radius='1' rotation=0 0 0'></a-circle>" +
                    // "<a-circle position='-4 0 0' " + prevLink + " src='#prev' radius='1' rotation=0 0 0'></a-circle>" +
                    // "<a-circle position='0 0 0' src='#pause' radius='1' rotation=0 0 0' audio-control></a-circle>" +
                    // "<a-circle position='0 0 0' src='#play' visibility='false' radius='1' rotation=0 0 0'></a-circle>" +
                    // "</a-entity>" +
//                    "<a-entity position='2 5 2' sound='src: #song' autoplay='true'></a-entity>"+
                    "<a-sound position='2 5 2'" + loopable +  "sound='src: #song' autoplay='true'></a-sound>" +
//                    "<a-entity ring-on-beat=\x22analyserEl: #audioanalyser; position='0 4 0'></a-entity>"+
//                    "<a-sphere material=\x22 sphericalEnvMap:\x22" + skyboxUrl + "\x22 roughness: 0 transparent='true' opacity='.9'\x22 audioanalyser-volume-scale=\x22analyserEl: #audioanalyser; multiplier: .005\x22 color=\x22" + sceneResponse.sceneColor2 + "\x22 radius='5' position='0 10 0'></a-sphere>"+
//                    "<a-gltf-model src='../assets/models/heart1/heart1.gltf' position='4 10 -4' rotation='-90 0 0' color='red'></a-gltf-model>" +
//                    "<a-curvedimage src='#my-image' height='3.0' radius='5.7' theta-length='72' 'rotation='0 100 0' scale='0.8 0.8 0.8'></a-curvedimage>"+d

                    // "<a-sky src=\x22" + skyboxUrl + "\x22 color='" + sceneResponse.sceneColor1 + "'></a-sky>" +

                    skySettings +

                    "<a-light type='ambient' color='" + sceneResponse.sceneColor2 + "'></a-light>" +
                    "<a-light color='" + sceneResponse.sceneColor2 + "' distance='100' intensity='0.4' type='point'></a-light>" +
                    "<a-light color='" + sceneResponse.sceneColor2 + "' position='3 10 -10' distance='50' intensity='0.4' type='point'></a-light>" +

//                    "<a-assets><audio id='primaryAudio' src='" + mp3url +"' preload='auto'></a-assets>"+
//                    "<a-entity sound='src: #primaryAudio' position='0 0 0' volume='1' loop='true' autoplay='true'></a-entity>"+
//                    "<a-sound src=\x22src: url("+ mp3url+")\x22 autoplay=\x22true\x22 position=\x220 0 0\x22 volume=\x2220\x22></a-sound>"+

//                   text="color: white; opacity: 1; value: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam; width: 2; zOffset: 0"

                    "</a-scene>" +
                    "</div>" +
                    // "<audio controls>" +
                    // "<source src='" + oggurl + "'type='audio/ogg'>" +
                    // "<source src='" + mp3url + "'type='audio/mpeg'>" +
                    // "Your browser does not support the audio element. " +
                    // "</audio>" +
//                    "</div>" +
//                    "<img src='" + image1url + "'> " +
                    // "<script src='../dist/jquery-3.1.1.min.js'></script>" +
                //     "<script src='../dist/jquery.backstretch.min.js'></script>" +
                //     "<script>" +
                // // To attach Backstrech as the body's background
                //         "if (picArray.Length > 0) {"+
                //             "$.backstretch(" + JSON.stringify(picArray) + ", {duration: 6000, fade: 750});" +
                //         "} else if (postcard1.Length > 4) {"+
                //             "$.backstretch('" + postcard1 + "');}" +

                //     "</script>"+

//                    "<script>" +
//                    "window.fbAsyncInit = function() {" +
//                        "FB.init({" +
//                        "    appId      : '1678172455793030'," +
//                        "    xfbml      : true," +
//                        "    version    : 'v2.5'" +
//                        "});" +
//                        "   };" +
//
//                    "(function(d, s, id){" +
//                        "var js, fjs = d.getElementsByTagName(s)[0];" +
//                        "if (d.getElementById(id)) {return;}" +
//                        "js = d.createElement(s); js.id = id;" +
//                        "js.src = \x22//connect.facebook.net/en_US/sdk.js\x22;" +
//                        "fjs.parentNode.insertBefore(js, fjs);" +
//                        "    }(document, 'script', 'facebook-jssdk'));" +
//                    "</script>" +
//                    "<script>" +
//                    "var songEl = document.querySelector('#song');"+
//                    "songEl.setAttribute(play, true);"
//                    "</script>"+
                    "<script src=\x22https://code.jquery.com/jquery-3.2.1.slim.min.js\x22 integrity=\x22sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN\x22 crossorigin=\x22anonymous\x22></script>" +
                    // "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js\x22 integrity=\x22sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q\x22 crossorigin=\x22anonymous\x22></script>" +
                    "<script src=\x22https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js\x22 integrity=\x22sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl\x22 crossorigin=\x22anonymous\x22></script>" +
                    "</body>" +
//                    "<script>WebVRConfig = {BUFFER_SCALE: 1.0,};document.addEventListener('touchmove', function(e) {e.preventDefault();});</script>"+
//                    "<script src='../dist/webvr-polyfill.js'></script>"+
                "</html>";
                s3.putObject({ Bucket: bucketFolder, Key: short_id+"/"+"webxr.html", Body: htmltext,  ContentType: 'text/html;charset utf-8', ContentEncoding: 'UTF8' }, function (err, data) {
                    console.log('uploaded');
                    callback(null);
                });


            }
        ], //waterfall end

        function (err, result) { // #last function, close async
            if (err != null) {
                res.send("error!! " + err);
            } else {
                res.send("generated");
                console.log("webxr gen done: " + result);
            }
        }
    );
});

*/

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  
app.post('/netradiodetails', function (req, res) {
    let streamurl = req.body.url;
    
    // console.log("streamurl = "+ streamurl);
    internetradio.getStationInfo(streamurl, function(error, station) {
        console.log(station);
        res.send(station);
      }, internetradio.StreamSource.SHOUTCAST_V2);
});
// app.post('/netradioheaders', function (req, res) { //no workie
//     let streamurl = req.body.url;
//     internetradio.getStationInfo(streamurl, function(error, station) {
//         console.log(station);
//         res.send(station);
//     }, internetradio.StreamSource.STREAM);
// });




app.get('/webxr/:_id', function (req, res) { //TODO lock down w/ checkAppID, requiredAuthentication

    // console.log("tryna update webxr scene" + JSON.stringify(req.headers));

    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedPictureGroups = [];
    var requestedAudioItems = [];
    var requestedVideoItems = [];
    var requestedTextItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    var sceneOwnerID = "";
    let primaryAudioTitle = "";
    let primaryAudioWaveform = "";
    // let ambienturl = "";
    var mp3url = "";
    var oggurl = "";
    var pngurl = "";
    let ambientUrl = "";
    let triggerUrl = "";
    var mp4url = "";
    var postcard1 = "";
    var image1url = "";
    var short_id = "";
    var picArray = [];
    var imageAssets = "";
    var imageEntities = "";
    var skyboxUrl = "";
    var skyboxID = "";
    let convertEquirectToCubemap = "";
    let skyboxAsset = "";
    var skySettings = "";
    var fogSettings = "";
    var shadowLight = "";
    var hemiLight = "";
    var groundPlane = "";
    var ocean = "";
    var camera = "";
    var oceanScript = "";
    var ARScript = "";
    var ARLocScript = "";
    var ARSceneArg = "";
    var ARMarker = "";
    var arMode = "position";
    var randomizerScript = "";
    var animationComponent = "";
    var targetObjectAsset = "";
    var targetObjectEntity = "";
    var skyParticles;
    var videoAsset = "";
    var videoEntity = "";
    var nextLink = "";
    var prevLink = "";
    var loopable = "";
    var gltfs = {};
    var sceneGLTFLocations = [];
    var sceneModelLocations = [];
    var allGLTFs = {};
    var gltfUrl = "";
    var gltfs = "";
    var gltfsAssets = "";
    var gltfsEntities = "";
    // var gltfItems = [];
    var bucketFolder = "eloquentnoise.com";
    var playerPosition = "0 5 0";
    // var style = "<link rel=\x22stylesheet\x22 type=\x22text/css\x22 href=\x22../styles/embedded.css\x22>";
    let aframeEnvironment = "";
    let ambientLight = "<a-light type='ambient' intensity='.5'></a-light>";
    // let ambientLight = "";
    let htmltext = "";
    let sceneNextScene = "";
    let scenePreviousScene = "";
    let streamPrimaryAudio = false;
    let primaryAudioScript = "";
    let primaryAudioControl = "";
    let primaryAudioEntity = "";
    let ambientAudioEntity = "";
    let ambientAudioScript = "";
    let ambientAudioControl = "";
    let triggerAudioScript = "";
    let triggerAudioControl = "";
    let pAudioWaveform = "";
    let primaryAudioLoop = false;
    let networkedscene = "";
    // let socketHost = req.headers.host;
    let socketHost = "strr.us";
    let avatarName = "guest";
    let skyGradientScript = "";
    let textLocation = "";
    let audioLocation = "0 -1 -2";
    let videoLocation = "15 2 15";
    let locationLights = [];
    let locationPlaceholders = [];
    let locationCallouts = [];
    let lightEntities = "";
    let placeholderEntities = "";
    let calloutEntities = "";
    let carLocation = "";
    let cameraEnvMap = "";
    let cubeMapAsset = "";
    let contentUtils = "<script src=\x22../dash/src/component/content-utils.js\x22></script>"; 
    let videosphereAsset = "";
    let mainTextEntity = "";
    let attributionsTextEntity = "";
    let audioVizScript = "";
    let audioVizEntity = "";
    let trackLocation = false;
    let trackImage = false;
    let trackMarker = false;
    let joystickScript = "";
    let carScript = "";
    let networkingEntity = "";
    let locationEntity = "";
    let locationButton = "";
    var assetNumber = 1;
    let attributions = [];
    let attributionsObject = {};
    let loadAttributions = "";
    let loadAvailableScenes = "";
    let availableScenesResponse = {};
    let availableScenesEntity = "";
    let pictureGroupsEntity = "";
    let loadPictureGroups = "";
    let availableScenesInclude = "";
    let googleAnalytics = "";
    let sceneData = "";

    db.scenes.findOne({"short_id": reqstring}, function (err, sceneData) { 
            if (err || !sceneData) {
                console.log("error getting scene data: " + err);
                res.end();
            } else { 
                sceneData = sceneData;
                async.waterfall([ 
                function (callback) {
                if (req.session) {
                    if (req.session.user) {
                        avatarName = req.session.user.userName;
                    }
                }
                if (avatarName == undefined || avatarName == null || avatarName == "guest") { //cook up a guest name if not logged in
                    array1 = [];
                    array2 = [];
                    array3 = [];
                    index1 = -1;
                    index2 = -1;
                    index3 = -1;
                    name1 = "";
                    name2 = "";
                    name3 = "";
                    min = 0;
                    db.lexicons.findOne({name: "nameArrays"}, function (err, items) {
                    if (err || !items) {
                        console.log("error getting scene 5: " + err);
                        callback (err);
                    } else {
                        array1 = items.adjectives;
                        array2 = items.colors;
                        array3 = items.animals;
                        // console.log("array 1" + array1);
                        index1 = Math.floor(Math.random() * array1.length);
                        name1 = UppercaseFirst(array1[index1]);
                        index2 = Math.floor(Math.random() * array2.length);
                        name2 = UppercaseFirst(array2[index2]);
                        index3 = Math.floor(Math.random() * array3.length);
                        name3 = UppercaseFirst(array3[index3]);
                        avatarName = name1 + " " + name2 + " " + name3;
                        callback();
                        }
                    });
                } else {
                    callback();
                }
            },
            function (callback) {
            //     // var o_id = ObjectID(reqstring);
            //    console.log("AVATAR NAME IS " + avatarName);
            //     if (avatarName == undefined || avatarName == null || avatarName == "polytropoi") {
            //         avatarName = GenerateName();
            //         console.log("AVATAR NAME IS " + avatarName);
            //     }
            // console.log("avatarName: " + avatarName);
                // db.scenes.findOne({"short_id": reqstring},
                //     function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                //         if (err || !sceneData) {
                //             console.log("error getting scene data: " + err);
                //             callback(err);
                //         } else { //make arrays of the pics and audio items
                            // console.log(JSON.stringify(sceneData));
                            sceneOwnerID = sceneData.user_id;
                            short_id = sceneData.short_id;
                            sceneResponse = sceneData;
                            sceneNextScene = sceneResponse.sceneNextScene;

                            scenePreviousScene = sceneResponse.scenePreviousScene;
                            console.log("sceneResponse.sceneNetworking " + sceneResponse.sceneNetworking);
                            if (sceneResponse.sceneNetworking == "SocketIO")
                            networkedscene = "networked-scene=\x22serverURL: "+socketHost+"; app: "+sceneData.sceneDomain+" ; room: "+sceneData.short_id+"; connectOnLoad: true; onConnect: onConnect; adapter: socketio; audio: false; debug: false;\x22";
                            if (sceneResponse.sceneNetworking == "WebRTC")
                            networkedscene = "networked-scene=\x22serverURL: "+socketHost+"; app: "+sceneData.sceneDomain+" ; room: "+sceneData.short_id+"; connectOnLoad: true; onConnect: onConnect; adapter: webrtc; audio: false; debug: false;\x22";
                            if (sceneResponse.sceneNetworking == "AudioChat")
                            networkedscene = "networked-scene=\x22serverURL: "+socketHost+"; app: "+sceneData.sceneDomain+" ; room: "+sceneData.short_id+"; connectOnLoad: true; onConnect: onConnect; adapter: webrtc; audio: true; debug: false;\x22";
                            if (sceneResponse.sceneNetworking != "None") {
                            networkingEntity = "<a-entity look-at=\x22#player\x22 position=\x22-8 1.1 -12\x22>" +
                            "<a-entity naf-connect=\x22avatarName:"+avatarName+"\x22 gltf-model=\x22#groupicon\x22 material=\x22shader: noise;\x22 class=\x22activeObjexGrab activeObjexRay\x22>"+
                                // "<a-text id=\x22statusText\x22 look-at=\x22#player\x22 rotation=\x220 180 0\x22 position=\x220 .5 0\x22 value=\x22\x22></a-text>"+
                            "</a-entity>"+
                                "<a-entity visible=\x22false\x22 id=\x22statusText\x22 geometry=\x22primitive: plane; width: 1.5; height: 1.5\x22 position=\x220 2.1 -1\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    "text=\x22value:status:; wrapCount: 20;\x22>" +
                                    "<a-entity gltf-model=\x22#square_panel\x22 scale=\x221.5 1.5 1.5\x22 position=\x220 -.25 -.5\x22></a-entity>" +
                                "</a-entity>"+
                            "</a-entity>";
                            }
                            // console.log("networking: " + networkingEntity);

                            // if (sceneResponse.sceneDomain != null && sceneResponse.sceneDomain != "") {
                            //     bucketFolder = sceneResponse.sceneDomain;
                            // } else {
                            //     callback(err);
                            // }
                            if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                                sceneResponse.scenePictures.forEach(function (picture) {
                                    // console.log("scenePIcture " + picture);
                                    var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                    requestedPictureItems.push(p_id); //populate array
                                });
                            }
                            if (sceneData.sceneType == "ARKit") { //TODO rename this, holdover from BITD
                                trackLocation = true; //TODO set as a scene option/toggle?
                                if (trackMarker) {
                                    ARSceneArg = "arjs=arjs='trackingMethod: best;'";
                                    ARMarker =  "<a-marker-camera preset='hiro'>" +
                                                    "<a-box scale='.1 .1 .1' position='0 0.5 0' material='color: yellow;'></a-box>" +
                                                "</a-marker-camera>";
                                    camera = "<a-marker-camera preset='hiro'></a-marker-camera>";
                                } 
                                if (trackLocation) {
                                    ARScript = "<script src=\x22https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js\x22></script>";
                                    ARLocScript = "<script src=\x22../dash/src/component/location-fu.js\x22></script>";
                                    // ARLocScript = "<script>window.onload = () => { navigator.geolocation.getCurrentPosition((position) => {"+ //put this where?
                                    // "document.querySelector('a-text').setAttribute('gps-entity-place', `latitude: ${position.coords.latitude}; longitude: ${position.coords.longitude};`)});}</script>";
                                    ARSceneArg = "vr-mode-ui=\x22enabled: false\x22 arjs=\x22sourceType: webcam; debugUIEnabled: false;\x22";
                                    // ARMarker =  "<a-text location-init-click id=\x22locationStatus\x22 value=\x22Tap globe icon to \ninit geolocation\x22 look-at=\x22[gps-camera]\x22 position=\x22-5 1 5\x22 scale=\x223 3 3\x22></a-text>";
                                    camera = "<a-camera listen-from-camera gps-camera rotation-reader><a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
                                            // "<a-entity id=\x22player\x22 networked=\x22template:#avatar-template;attachTemplateToLocal:false;\x22 spawn-in-circle=\x22radius:3;\x22>" + //ENABLE LATER
                                            "</a-camera>";
                                    locationEntity = "<a-entity location-init look-at=\x22[gps-camera]\x22 position=\x22-8 1.1 -12\x22>" +
                                    "<a-entity gltf-model=\x22#exclamation\x22 material=\x22shader: noise;\x22 class=\x22activeObjexRay\x22>"+
                                        // "<a-text id=\x22statusText\x22 look-at=\x22#player\x22 rotation=\x220 180 0\x22 position=\x220 .5 0\x22 value=\x22\x22></a-text>"+
                                    "</a-entity>"+
                                        "<a-entity visible=\x22false\x22 id=\x22locationStatus\x22 geometry=\x22primitive: plane; width: 1.5; height: 1.5\x22 position=\x221 2.1 -1\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                            "text=\x22value:status:; wrapCount: 20;\x22>" +
                                            "<a-entity gltf-model=\x22#square_panel\x22 scale=\x221.5 1.5 1.5\x22 position=\x220 -.25 -.5\x22></a-entity>" +
                                        "</a-entity>"+
                                    "</a-entity>";
                                    locationButton = "<div style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22GetLocation()\x22><i class=\x22fas fa-globe fa-2x\x22></i></div>";
                                    
                                }
                                if (trackImage) {

                                }
                                            
                            } else {
                                joystickScript = "<script src=\x22../dash/vendor/aframe/joystick.js\x22></script>";
                                let wasd = "wasd-controls=\x22fly: false; acceleration: 40;\x22";
                                if (sceneResponse.sceneFlyable) {
                                    wasd = "wasd-controls=\x22fly: true; acceleration: 45;\x22";
                                }
                                // camera = "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+
                                // "<a-entity id=\x22head\x22 camera "+wasd+" look-controls touch-controls position=\x220 1.6 0\x22></a-entity>"+
                                
                                let spawnInCircle = "";
                                if (sceneResponse.sceneNetworking != "None") {
                                    spawnInCircle = "spawn-in-circle=\x22radius:3;\x22";
                                }
                                camera = "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+
                                // "<a-entity show-in-ar-mode cursor=\x22fuse: true\x22 id=\x22cursor\x22 visible=\x22false\x22 position=\x220 0 -1\x22 geometry=\x22primitive: ring; radiusInner: 0.02; radiusOuter: 0.03\x22 material=\x22color: black; shader: flat\x22></a-entity>"
                                "<a-entity hide-in-ar-mode id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
                                // "<a-entity id=\x22player\x22>"+
                                    "<a-entity id=\x22player\x22 listen-from-camera networked=\x22template:#avatar-template;attachTemplateToLocal:false;\x22 "+spawnInCircle+" camera "+wasd+" look-controls position=\x220 1.6 0\x22>" +
                                    // "<a-entity  show-in-ar-mode cursor=\x22rayOrigin: mouse\x22 id=\x22cursor\x22 raycaster=\x22objects: .activeObjexRay;\x22 position=\x220 0 -.1\x22 geometry=\x22primitive: ring; radiusInner: 0.001; radiusOuter: 0.002\x22 material=\x22color: grey; shader: flat\x22></a-entity>" +
                                    // "<a-entity ></a-entity>"+
                                    
                                    "</a-entity>"+
                                    
                                    "<a-entity networked=\x22template:#hand-template\x22 teleport-controls=\x22cameraRig: #cameraRig; button: grip;\x22 oculus-touch-controls=\x22hand: left\x22 laser-controls=\x22hand: left;\x22 handModelStyle: lowPoly; color: #ffcccc\x22 raycaster=\x22objects: .activeObjexRay;\x22></a-entity>" +
                                    "<a-entity networked=\x22template:#hand-template\x22 oculus-touch-controls=\x22hand: right\x22 id=\x22right-hand\x22 hand-controls=\x22hand: right; handModelStyle: lowPoly; color: #ffcccc\x22 aabb-collider=\x22objects: .activeObjexGrab;\x22 grab></a-entity>"+
                                // "</a-entity>"+
                                // "<a-sphere class=\x22head\x22 visible=\x22false\x22 random-color></a-sphere>" +
                                "</a-entity>";
                            }
                            let webxrEnv = "default";

                            if (sceneResponse.sceneWebXREnvironment != null && sceneResponse.sceneWebXREnvironment != "") {
                                webxrEnv = sceneResponse.sceneWebXREnvironment;
                                // console.log("environment: " + environment);
                                // environment = " environment=\x22preset: "+webxrEnv+"\x22 ";
                                let ground = "";
                                let skycolor = "";
                                let groundcolor = "";
                                let groundcolor2 = "";
                                let dressingcolor = "";
                                let horizoncolor = "";
                                let shadow = "shadow: false;";
                                let fog = "";
                                if (webxrEnv == "none") {
                                    ground = "ground: none;"
                                    hemiLight = "<a-light type=\x22hemisphere\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.5\x22 position\x220 0 0\x22>"+
                                    "</a-light>";
                                }
                                if (sceneResponse.sceneRenderFloorPlane) {
                                    ground = "ground: none; dressing: none;"
                                }
                                if (sceneResponse.sceneUseDynamicShadows) {
                                    shadow = "shadow: true;"
                                }
                                //     // shadowLight = "<a-light type:\x22directional\x22; color:\x22" + sceneResponse.sceneColor1 + "\x22; intensity:\x22.5\x22; castShadow: true; target=\x22.target\x22; position=\x22-1 4 4\x22;>"+
                                //     // "</a-light>";
                                //     shadowLight = "<a-light type=\x22directional\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.75\x22 target=\x22.target\x22 castShadow=\x22true\x22 shadowMapHeight=\x221024\x22 shadowMapWidth=\x221024\x22 shadowCameraLeft=\x22-2\x22 shadowCameraRight=\x222\x22; shadowCameraBottom=\x22-2\x22; shadowCameraTop=\x222\x22; position\x22-1 4 4\x22>"+
                                //     "</a-light>";
                                //     // light="target:  [object HTMLElement];  color:  #bb98d2;  groundColor:  #ff0056;  castShadow:  true"
                                // }
                                if (sceneResponse.sceneUseGlobalFog) {
                                    fogSettings = "fog=\x22type: exponential; density:.02; near: 1; far: 50; color: " +sceneResponse.sceneColor1 + "\x22";
                                    fog = "fog: " +sceneResponse.sceneGlobalFogDensity+ ";";
                                }
                                if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3) {
                                    skycolor = "skyColor: " + sceneResponse.sceneColor1 + ";";
                                }
                                if (sceneResponse.sceneColor2 != null && sceneResponse.sceneColor2.length > 3 && sceneResponse.sceneColorizeSky) {  
                                    horizoncolor = "horizonColor: " + sceneResponse.sceneColor2 + ";";
                                    groundcolor2 = "groundColor2: " + sceneResponse.sceneColor2 + ";";
                                    ambientLight = "<a-light type='ambient' intensity='.5' color='" + sceneResponse.sceneColor2 + "'></a-light>";
                                } 
                                if (sceneResponse.sceneColor3 != null && sceneResponse.sceneColor3.length > 3 && sceneResponse.sceneColorizeSky) { //TODO put that in
                                    groundcolor = "groundColor: " + sceneResponse.sceneColor3 + ";";
                                }
                                if (sceneResponse.sceneHighlightColor != null && sceneResponse.sceneHighlightColor.length > 3 && sceneResponse.sceneColorizeSky) {
                                    // horizoncolor = "horizonColor: " + sceneResponse.sceneHighlightColor + ";";
                                    dressingcolor = "dressingColor: " + sceneResponse.sceneHighlightColor + ";";
                                    groundcolor2 = "groundColor2: " + sceneResponse.sceneHighlightColor + ";";
                                }      
                                // "+ground+"
                                aframeEnvironment = "<a-entity environment=\x22preset: "+webxrEnv+"; "+ground+" "+fog+" "+shadow+" "+groundcolor+" "+dressingcolor+" "+groundcolor2+" "+skycolor+" "+horizoncolor+"\x22 hide-in-ar-mode></a-entity>";
                                // environment = "<a-entity environment=\x22preset: "+webxrEnv+"; "+fog+" "+shadow+" "+groundcolor+" "+dressingcolor+" "+groundcolor2+" "+skycolor+" "+horizoncolor+" playArea: 3; lightPosition: 0 2.15 0\x22 hide-in-ar-mode></a-entity>";
                            } else {
                                hemiLight = "<a-light type=\x22hemisphere\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.5\x22 position\x220 0 0\x22>"+
                                    "</a-light>";
                            }
                            sceneResponse.scenePostcards = sceneData.scenePostcards;
                            if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3) {
                                // skySettings = "<a-sky hide-in-ar-mode color='" + sceneResponse.sceneColor1 + "'></a-sky>"; //overwritten below if there's a skybox texture
                                // environment = "<a-entity environment=\x22preset: "+webxrEnv+"; skyColor: " + sceneResponse.sceneColor1 + "; lighting: none; shadow: none; lightPosition: 0 2.15 0\x22 hide-in-ar-mode></a-entity>";
                            } 
                            if (sceneResponse.sceneColor1 != null && sceneResponse.sceneColor1.length > 3 && sceneResponse.sceneColor2 != null && sceneResponse.sceneColor2.length > 3)   {

                            }
                            if (sceneResponse.sceneUseDynamicShadows) {
                                // shadowLight = "<a-light type=\x22directional\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.75\x22 target=\x22.target\x22 castShadow=\x22true\x22 shadowMapHeight=\x221024\x22 shadowMapWidth=\x221024\x22 shadowCameraLeft=\x22-2\x22 shadowCameraRight=\x222\x22; shadowCameraBottom=\x22-2\x22; shadowCameraTop=\x222\x22; position\x22-1 4 4\x22>"+
                                // "</a-light>";
                                shadowLight = "<a-entity light=\x22type: directional; color:"+sceneResponse.sceneColor1+"; groundColor:"+sceneResponse.sceneColor2+"; castShadow: true; intensity: 0.4; shadowBias: -0.015; shadowMapHeight: 2048; shadowMapWidth: 2048;\x22 position=\x225 10 7\x22></a-entity>";
                            }
                            if (sceneResponse.sceneUseGlobalFog || sceneResponse.sceneUseSceneFog) {
                                fogSettings = "fog=\x22type: exponential; density:.02; near: 1; far: 50; color: " +sceneResponse.sceneColor1 + "\x22";
                            }
    //                                if (sceneResponse.sceneUseSkyParticles) { 
    //                                    skyParticles = "<a-entity scale='.5 .5 .5' position='0 3 0' particle-system=\x22preset: dust; randomize: true color: " + sceneResponse.sceneColor1 + "," + sceneResponse.sceneColor2 +"\x22></a-entity>";
    //                                }
                            if (sceneResponse.sceneRenderFloorPlane) {
                                groundPlane = "<a-plane rotation='-90 0 0' position='0 -1 0' width='100' height='100' color=\x22" + sceneResponse.sceneColor2+ "\x22></a-plane>"; //deprecated for environment component
                                // ground = "<a-circle rotation='-90 0 0' position='0 -1 0' width='100' height='100'></a-circle>";
                            }
                            // if (sceneResponse.sceneWater != null && sceneResponse.sceneWater.name != "none") {
                            //     console.log("water: " + JSON.stringify(sceneResponse.sceneWater));
                            //     ocean = "<a-ocean></a-ocean>";
                            // }
                            // if (sceneResponse.sceneUseTargetObject && sceneResponse.sceneTargetObject.name == "gltftest" ) {
                            //     targetObjectAsset = "<a-asset-item id=\x22targetObj\x22 src=\x22../assets/models/korkus/KorkusOnly.gltf\x22></a-asset-item>";
                            //     targetObjectEntity = "<a-entity gltf-model=\x22#targetObj\x22 position='-5 5 5'></a-entity>";
                            // }
                            if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") {
                                nextLink = "href=\x22../webxr/" + sceneResponse.sceneNextScene + "\x22";
                            }
                            if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                                prevLink = "href=\x22../" + sceneResponse.scenePreviousScene + "\x22";
                            }
                            if (sceneResponse.sceneLoopPrimaryAudio) {
                                loopable = "loop: true";
                            }
                            if (sceneResponse.sceneLocations != null && sceneResponse.sceneLocations.length > 0) {
                                console.log("sceneLocraitons are a thing");
                                for (var i = 0; i < sceneResponse.sceneLocations.length; i++) {
                                    console.log("loc with model? " + JSON.stringify(sceneResponse.sceneLocations[i]));
                                    if (sceneResponse.sceneLocations[i].markerType == "gltf" || sceneResponse.sceneLocations[i].gltf != null) {
                                        
                                        sceneGLTFLocations.push(sceneResponse.sceneLocations[i]);
                                        if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4) {
                                            animationComponent = "<script src=\x22https://unpkg.com/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js\x22></script>"; //unused!  NEEDS FIXING - this component could be added more than once
                                        }
                                    }
                                    if (sceneResponse.sceneLocations[i].model != undefined && sceneResponse.sceneLocations[i].model != "none") {
                                        console.log("pushinbg model locaition " + sceneResponse.sceneLocations[i]);
                                        sceneModelLocations.push(sceneResponse.sceneLocations[i]);
                                        if (sceneResponse.sceneLocations[i].eventData != null && sceneResponse.sceneLocations[i].eventData.length > 4) {
                                            animationComponent = "<script src=\x22https://unpkg.com/aframe-animation-component@5.1.2/dist/aframe-animation-component.min.js\x22></script>"; //unused !NEEDS FIXING - this component could be added more than once
                                        }
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "placeholder") {
                                        locationPlaceholders.push(sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z);
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "player") {
                                        playerPosition = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "text") {
                                        textLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z; //TODO - these must all be arrays, like sceneModelLocations above!
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "video") {
                                        videoLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "car") {
                                        carLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "audio") {
                                        audioLocation = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                        if (sceneResponse.sceneType == "ThreeJS") {
                                            audioLocation = sceneResponse.sceneLocations[i].x + ", " + sceneResponse.sceneLocations[i].y + ", " + sceneResponse.sceneLocations[i].z;
                                        }
                                        
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "callout" && sceneResponse.sceneLocations[i].eventData.length > 0) {
                                        let calloutLocation = {};
                                        calloutLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                        calloutLocation.data = sceneResponse.sceneLocations[i].eventData;
                                        locationCallouts.push(calloutLocation);
                                    }
                                    if (sceneResponse.sceneLocations[i].markerType == "light" && sceneResponse.sceneLocations[i].eventData.length > 0) {
                                        let lightLocation = {};
                                        lightLocation.loc = sceneResponse.sceneLocations[i].x + " " + sceneResponse.sceneLocations[i].y + " " + sceneResponse.sceneLocations[i].z;
                                        lightLocation.data = sceneResponse.sceneLocations[i].eventData;
                                        locationLights.push(lightLocation);
                                    }
                                }
                            }
                            if (sceneData.scenePrimaryAudioID != null && sceneData.scenePrimaryAudioID.length > 4) {
                                var pid = ObjectID(sceneData.scenePrimaryAudioID);
                                // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneData.scenePrimaryAudioID));
                                requestedAudioItems.push(ObjectID(sceneData.scenePrimaryAudioID));
                                if (sceneData.scenePrimaryAudioVisualizer) {
                                    audioVizScript = "<script src=\x22../dash/ref/aframe/dist/aframe-audioanalyser-component.min.js\x22></script>"; 
                                    audioVizEntity = "<a-entity audioanalyser=\x22src: #song; smoothingTimeConstant: 0.9\x22 audioanalyser-levels-scale=\x22max: 50; multiplier: 0.06\x22 entity-generator=\x22mixin: bar; num: 256\x22 layout=\x22type: circle; radius: 10\x22 rotation=\x220 180 0\x22></a-entity>";
                                }
                            }
                            if (sceneData.sceneAmbientAudioID != null && sceneData.sceneAmbientAudioID.length > 4) {
                                // var pid = ObjectID(sceneData.sceneAmbientAudioID);
                                // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneData.scenePrimaryAudioID));
                                requestedAudioItems.push(ObjectID(sceneData.sceneAmbientAudioID));

                            }
                            callback();
                            
                        // }
                        // callback();

                    // });
                },
                function (callback) {
                    if (locationLights.length > 0) {
                        for (let i = 0; i < locationLights.length; i++) {
                            let color = "";
                            if (locationLights[i].data != null && locationLights[i].data.length > 3) {
                                if (locationLights[i].data.indexOf("_") != -1) {
                                    //
                                }
                            }
                            lightEntities = lightEntities + "<a-light color='" + locationLights[i].data + "' position=\x22"+locationLights[i].loc+"\x22 distance='10' intensity='0.8' type='point'></a-light>";
                        }
                        callback();
                    } else {
                        callback();
                    }
                },
                function (callback) {                
                    if (locationPlaceholders.length > 0) {
                        for (let i = 0; i < locationPlaceholders.length; i++) {
                            console.log("gotsa placeholder at " + locationPlaceholders[i]);
                            placeholderEntities = placeholderEntities + "<a-entity gltf-model=\x22#roundcube\x22 position=\x22"+locationPlaceholders[i]+"\x22></a-entity>";
                        }
                        callback();
                    } else {
                        callback();
                    }
                }, 
                function (callback) { //get available scenes for scene links
                //     var platformString = "";
            
                let query = {$and: [{ "sceneDomain": sceneResponse.sceneDomain}, {sceneShareWithPublic: true }]};
                console.log("scene query : " + JSON.stringify(query));
                db.scenes.find( query, function (err, scenes) {
                if (err || !scenes) {
                    console.log("cain't get no scenes... " + err);
                    calllback(err);
                } else {
                    console.log("gots " + scenes.length + " scenes");
                    var availableScenes = [];
                    availableScenesResponse.availableScenes = availableScenes;
                        async.each(scenes, function (scene, cb) {
                            availableScene = {};
                            if (scene.scenePostcards != null && scene.scenePostcards.length > 0) { //cain't show without no postcard
                                var postcardIndex = Math.floor(Math.random()*scene.scenePostcards.length);
                                var oo_id = ObjectID(scene.scenePostcards[postcardIndex]); //TODO randomize? or ensure latest?  or use assigned default?
                                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                    if (err || !picture_item) {
                                        console.log("error getting postcard for availablescenes: 2" + err);
                                        cb(); //no postcards, next...
                                    } else {
                                        var item_string_filename = JSON.stringify(picture_item.filename);
                                        item_string_filename = item_string_filename.replace(/\"/g, "");
                                        var item_string_filename_ext = getExtension(item_string_filename);
                                        var expiration = new Date();
                                        expiration.setMinutes(expiration.getMinutes() + 30);
                                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                                        // var thumbName = 'thumb.' + baseName + item_string_filename_ext;  //unused for now
                                        // var standardName = 'standard.' + baseName + item_string_filename_ext;
                                        var halfName = 'half.' + baseName + item_string_filename_ext;
                                        var quarterName = 'quarter.' + baseName + item_string_filename_ext;

                                        var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + halfName, Expires: 6000}); //just send back thumbnail urls for list
                                        var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + "." + quarterName, Expires: 6000}); //just send back thumbnail urls for list
                                        availableScene = {
                                            sceneTitle: scene.sceneTitle,
                                            sceneKey: scene.short_id,
                                            sceneType: scene.sceneType,
                                            sceneLastUpdate: scene.sceneLastUpdate,
                                            sceneDescription: scene.sceneDescription,
                                            sceneKeynote: scene.sceneKeynote,
                                            sceneAndroidOK: scene.sceneAndroidOK,
                                            sceneIosOK: scene.sceneIosOK,
                                            sceneWindowsOK: scene.sceneWindowsOK,
                                            sceneStatus: scene.sceneShareWithPublic ? "public" : "private",
                                            sceneOwner: scene.userName ? "" : scene.userName,
                                            scenePostcardQuarter: urlQuarter,
                                            scenePostcardHalf: urlHalf
                                        };
                                        availableScenesResponse.availableScenes.push(availableScene);

                                        cb();

                                        }
                                    });
                                } else {
                                    cb();
                                }
                            }, 
                            function (err) {
                                if (err) {
                                    console.log('A file failed to process');
                                    callback(null);
                                } else {
                                    console.log('All files have been processed successfully');
                                    // availableScenesResponse.availablesScenes
                                    // availableScenesEntity = "<a-entity position=\x224 0 -2\x22 id=\x22availableScenesControl\x22 class=\x22activeObjexRay\x22 toggle-available-scenes camera-cube-env=\x22distance: 10000; resolution: 256;\x22 gltf-model=\x22#key\x22></a-entity>";
                                    console.log("attributions 2" + JSON.stringify(attributions));
                                    if (availableScenes != null && availableScenes != undefined && availableScenes.length > 0) {
                                    availableScenesEntity = "<a-entity scale=\x22.75 .75 .75\x22 look-at=\x22#player\x22 position=\x224 2 -2\x22>"+ //attributions-text-control is set onload, using attributions string above
                                    "<a-entity position=\x220 -2.5 0\x22 scale=\x22.75  .75 .75\x22 id=\x22availableScenesControl\x22 class=\x22activeObjexRay\x22 toggle-available-scenes gltf-model=\x22#key\x22></a-entity>"+
                                    "<a-entity id=\x22availableScenesPanel\x22 visible='false' position=\x220 -1 0\x22>"+
                                    "<a-entity id=\x22availableScenesHeaderText\x22 geometry=\x22primitive: plane; width: 3.25; height: 1\x22 position=\x220 1.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    "text=\x22value:; wrap-count: 35;\x22></a-entity>" +
                                    // "<a-entity id=\x22availableSceneText\x22 class=\x22activeObjexRay\x22 geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 1.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    // "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                                    // "<a-entity id=\x22availableSceneOwner\x22 class=\x22activeObjexRay\x22  geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 .5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    // "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                                    "<a-entity id=\x22availableScenePic\x22 class=\x22activeObjexRay\x22 visible=\x22true\x22 position=\x220 3 -.1\x22 gltf-model=\x22#landscape_panel\x22 scale=\x22.5 .5 .5\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                    "rotation='0 0 0'></a-entity>"+
                                    "<a-entity gltf-model=\x22#square_panel\x22 scale=\x222.25 2.25 2.25\x22 position=\x220 2.1 -.25\x22></a-entity>" +
                                    "<a-entity visible='true' class=\x22activeObjexRay\x22 id=\x22availableScenesNextButton\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x221.5 -.75 0\x22></a-entity>" +
                                    "<a-entity visible='true' class=\x22activeObjexRay\x22 id=\x22availableScenesPreviousButton\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-1.5 -.75 0\x22></a-entity>" +
                                    "</a-entity></a-entity>";
                                    console.log('processed attributions for ' + availableScenes.length);

                                    loadAvailableScenes = "ready(function(){" + //attributions data is loaded when page is ready (complex objs don't wanna parse if jacked in server side...?!?)
                                    "let ascontrol = document.getElementById(\x22availableScenesControl\x22);"+
                                    // "console.log('tryna set availablescenes: ' + "+JSON.stringify(JSON.stringify(availableScenesResponse))+");"+
                                    "ascontrol.setAttribute(\x22available-scenes-control\x22, \x22jsonData\x22, "+JSON.stringify(JSON.stringify(availableScenesResponse))+");"+ //double stringify! yes, it's needed
                                    "});";
                                    callback();
                                    } else {
                                        callback();
                                    }
                                }
                            });
                        }
                    });
                },
                function (callback) {
                    if (sceneModelLocations.length > 0) {
                        console.log("gotsome models " + JSON.stringify(sceneModelLocations));
                        async.each (sceneModelLocations, function (locMdl, callbackz) { //loop tru w/ async
                            var scale = 1;
                            var offsetPos = "";
                            var rotAnim = "";
                            var posAnim = "";
                            var ambientChild = "";
                            // let objAnim = "animation-mixer"; //to blend the canned ones, and/or obj anims set below
                            let objAnim = ""; //no, must do this from component
                            let cannedAnim = "";
                            var rightRot = true;
                            var rotVal = 360;
                            let max = .6;
                            let min = 1.2;
                            let speed = Math.random() * (max - min) + min;
                            let maxR = 0;
                            let minR = 360;
                            let randomR = Math.random() * (maxR - minR) + minR;
                            let assetUserID = "";
                            let entityType = ""; //used to set entity id
                            let skyboxEnvMap = "";
                            console.log("useCubeMap? " + sceneResponse.sceneUseDynCubeMap);
                            if (sceneResponse.sceneUseDynCubeMap) {
                                skyboxEnvMap = "skybox-env-map";   
                            }
                            // for (var i = 0; i < sceneGLTFs)
                            if (locMdl.modelID != undefined && locMdl.modelID != "none") {
                                console.log(locMdl.modelID);
                                const m_id = ObjectID(locMdl.modelID);
                                console.log("tryna set model id:  " + locMdl.modelID);
                                db.models.findOne({"_id": m_id}, function (err, asset) { 
                                if (err || !asset) { 
                                    callbackz(err);
                                } else {
                                    // console.log("founda matching model: " + JSON.stringify(asset));
                                    assetUserID = asset.userID;
                                    var sourcePath =   "servicemedia/users/" + assetUserID + "/gltf/" + locMdl.gltf;
                                    let modelURL = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + assetUserID + "/gltf/" + asset.filename, Expires: 6000});
                                    console.log("modelURL " + modelURL);
                                    assetNumber++;
                                    let newAttribution = {};
                                    if (asset.sourceTitle != undefined && asset.sourceTitle != "none" && asset.sourceTitle != "undefined" && asset.authorName != undefined && asset.authorName.length > 0 && asset.authorName != "none") {
                                        // attributions = attributions + "<a href=\x22"+asset.sourceLink+"\x22>'"+asset.sourceTitle+"'</a> by <a href=\x22"+asset.authorLink+"\x22>"+asset.authorName+"</a> under license <a href=\x22https://creativecommons.org/licenses/\x22>"+asset.license+"</a> with mods " + asset.modifications;
                                        newAttribution.sourceTitle = asset.sourceTitle;
                                        newAttribution.sourceLink = asset.sourceLink;
                                        newAttribution.authorName = asset.authorName;
                                        newAttribution.authorLink = asset.authorLink;
                                        newAttribution.license = asset.license;
                                        newAttribution.modifications = asset.modifications;
                                        attributions.push(newAttribution);
                                    }
                                    console.log("attributions " + JSON.stringify(attributions));

                                    var m_assetID = "gltfasset" + assetNumber;
                                    let rx = locMdl.eulerx != null ? locMdl.eulerx : 0; 
                                    let ry = locMdl.eulery != null ? locMdl.eulery : 0; 
                                    let rz = locMdl.eulerz != null ? locMdl.eulerz : 0; 
                                    let rotation = rx + " " + ry + " " + rz;
                                    if (ry == 99) {
                                        
                                        ry = randomR;
                                        rotation = rx + " " + ry + " " + rz;
                                        // console.log("tryna set random rotation for gltf to " + rotation);
                                    }
                                    
                                    // objAnim = "animation-mixer=\x22timeScale:"+speed+"\x22";
                                    if (locMdl.markerObjScale != null) {
                                        scale = locMdl.markerObjScale;
                                    }
                                    if (locMdl.eventData != null && locMdl.eventData != undefined && locMdl.eventData.length > 1) { //eventData has anim 
                                        // console.log("!!!tryna setup animation " + r.eventData);

                                        if (locMdl.eventData.toLowerCase().includes("spawn")) {
                                            arMode = "spawn";
                                        }
                                        rightRot = !rightRot;
                                        if (rightRot == true) {
                                            rotVal = -360;
                                        }
                                        var eSplit = locMdl.eventData.split("~");
                                        if (eSplit[0] == "orbit") { 
                                            offsetPos =  "<a-entity position=\x22"+ eSplit[1] + " 0 0\x22></a-entity>";
                                            cannedAnim = "animation=\x22property: rotation; to: 0 " + (ry - 360) + " 0; loop: true; dur: 10000\x22";

                                            // cannedAnim = "";
                                        } else {
                                            // objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"\x22 animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true;\x22>";
                                            // objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"; timeScale:"+speed+";\x22";
                                            objAnim = "";
                                        }
                                        if (eSplit[0] == "yoyo" || eSplit[1] == "yoyo") {
                                            cannedAnim = "animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true; to: "+locMdl.x+" "+(parseFloat(locMdl.y) + 2)+" "+locMdl.z+"\x22";
                                        }
                                        posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;";
                                        if (locMdl.eventData.toLowerCase().includes("ambient"))  {
                                            ambientChild = "ambientChild"; //never mind
                                        }                                   
                                    }
                                    if (locMdl.markerType != null && locMdl.markerType != undefined && locMdl.markerType.length > 1) {
                                        entityType = locMdl.markerType; //e.g. "target"
                                    }
                                    if (locMdl.latitude != null && locMdl.longitude != null) { 
                                        // camera-cube-env=\x22distance: 100000; resolution: 256;\x22
                                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                                        gltfsEntities = gltfsEntities + "<a-entity mod-model=\x22eventData:"+locMdl.eventData+"\x22 class=\x22"+entityType+" "+ambientChild+" activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 gps-entity-place=\x22latitude: "+locMdl.latitude+"; latitude: "+locMdl.longitude+";\x22 "+skyboxEnvMap+"  gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+" scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";

                                        callbackz(); //this or one below exits loop
                                    } else {
                                        // gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                                        // gltfsEntities = gltfsEntities + "<a-entity mod-model=\x22eventData:"+locMdl.eventData+"\x22 class=\x22"+entityType+" "+ambientChild+" activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+" position=\x22"+locMdl.x+" "+locMdl.y+" "+locMdl.z+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                        if (sceneResponse.sceneType == "ThreeJS") { //three
                                            if (sceneResponse.sceneFaceTracking ) {
                                                console.log("face tracking asset at " + modelURL);
                                                gltfsAssets = {};
                                                gltfsAssets.modelURL = modelURL;
                                                gltfsAssets.offsetX = locMdl.x;
                                                gltfsAssets.offsetY = locMdl.y;
                                                gltfsAssets.scale = scale;
                                            } else {
                                                gltfsAssets = gltfsAssets +
                                                "loader.load(\n"+
                                                "\x22"+modelURL+"\x22,\n"+
                                                // called when the resource is loaded
                                                "function ( gltf ) {\n"+
                                                    "scene.add( gltf.scene );\n"+
                                                    // "render();\n"+
                                                    // "gltf.animations;\n"+ // Array<THREE.AnimationClip>
                                                    // "gltf.scene;\n"+ // THREE.Group
                                                    // "gltf.scenes;\n"+ // Array<THREE.Group>
                                                    // "gltf.cameras;\n"+ // Array<THREE.Camera>
                                                    // "gltf.asset;\n"+ // Object
                                                    "if (!gltf.scene) return;\n" +
                                                    "gltf.scene.traverse(function (node) {\n" +
                                                        "if (node.material && 'envMap' in node.material) {\n" +
                                                        "node.material.envMap = envMap;\n" +
                                                        "node.material.envMap.intensity = 1;\n" +
                                                        "node.material.needsUpdate = true;\n" +
                                                        "}\n" +
                                                    "});\n" +
                                                    "gltf.scene.position.set("+locMdl.x+", "+locMdl.y+", "+locMdl.z+");\n"+
                                                    "gltf.scene.rotation.set("+rx+", "+ry+", "+rz+");\n"+
                                                    "gltf.scene.scale.set("+scale+", "+scale+", "+scale+");\n"+
                                                "},\n"+
                                                // called while loading is progressing
                                                "function ( xhr ) {\n"+
                                                    "console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );\n"+
                                                    "},\n"+
                                                // called when loading has errors
                                                "function ( error ) {\n"+
                                                    "console.log( 'An error happened' );\n"+
                                                    "}\n"+
                                                ");\n";
                                            }
                                            console.log("face tracking asset at " + modelURL);
                                            // gltfsAssets = modelURL;
                                            
                                        } else if (sceneResponse.sceneType == "BabylonJS") { //babylon
                                            gltfsAssets = gltfsAssets + "var lookCtrl = null;\nBABYLON.SceneLoader.ImportMesh('', '', \x22"+modelURL+"\x22, scene, function (meshes, particleSystems, skeletons) {"+
                                            "meshes[0].scaling = new BABYLON.Vector3("+scale+", "+scale+", "+scale+");\n"+
                                            "meshes[0].position = new BABYLON.Vector3("+locMdl.x+", "+locMdl.y+", "+locMdl.z+");\n"+
                                            "meshes[0].rotation = new BABYLON.Vector3("+rx+", "+ry+", "+rz+");\n"+
                                           
                                            "for (var m = 0; m < meshes.length; m++){\n"+ //find mesh named eye
                                                "console.log(meshes[m].material);\n"+
                                                // "meshes[m].material.environmentTexture = new BABYLON.CubeTexture('', scene, undefined, undefined, "+JSON.stringify( cubeMapAsset)+");" +
                                                "if (meshes[m].name.includes(\x22eyeball\x22)) {"+
                                                    // "skeletons[0].bones.lookAt(mainCam.position);"+
                                                    // "let meshMat = new BABYLON.StandardMaterial"
                                                    // "meshes[m].material.reflectionTexture = new BABYLON.CubeTexture('', scene, undefined, undefined, "+JSON.stringify( cubeMapAsset)+");" +
                                                    "console.log(meshes[m].name);"+
                                                    "let characterMesh = meshes[m];"+
                                                    "for (var b = 0; b < skeletons[0].bones.length - 1; b++){\n"+ //then find bone named eye //NM, pointless - can't use bone with gltf :(
                                                       
                                                        "if (skeletons[0].bones[b].name == \x22Eye\x22) {\n"+
                                                            // "skeletons[0].bones.lookAt(mainCam.position);"+
                                                            "console.log(skeletons[0].bones[b].name);\n"+
                                                            "scene.beginAnimation(skeletons[0], 0, 100, true, 1.0);\n"+
                                                            // "let lookCtrl = new BABYLON.BoneLookController(meshes[0], skeletons[0].bones[b], mainCam.position, {adjustYaw:Math.PI*.5, adjustPitch:Math.PI*.5, adjustRoll:Math.PI});\n"+
                                                            "var skeleton = skeletons[0];\n"+
                                                            "var time = 0;\n"+
                                                            "var state = 'Initial';\n"+
                                                            "var lastAppliedQuat = new BABYLON.Quaternion();\n"+
                                                            "var stateTime = 0;\n"+
                                                            "var timingFunc = (x) => Math.cos(x * Math.PI) * -0.5 + 0.5;\n"+
                                                            // var cubeTex = new BABYLON.CubeTexture("", scene, );
                                                            "scene.registerBeforeRender(function(){\n" +
                                                            
                                                           "});\n"+
                                                            
                                                        "}\n"+
                                                    "}\n"+
                                                    //  "lookCtrl = new BABYLON.BoneLookController(characterMesh, skeletons[0].bones[m], mainCam.position, {adjustYaw:Math.PI*.5, adjustPitch:Math.PI*.5, adjustRoll:Math.PI});\n"+
                                                "}\n"+
                                            "}\n"+

                                            "});\n";
                                        } else { //aframe
                                            gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + m_assetID + "\x22 src=\x22"+ modelURL +"\x22></a-asset-item>";
                                            gltfsEntities = gltfsEntities + "<a-entity mod-model=\x22eventData:"+locMdl.eventData+"\x22 class=\x22"+entityType+" "+ambientChild+
                                            " activeObjexGrab activeObjexRay\x22 shadow=\x22cast:true; receive:true\x22 "+skyboxEnvMap+" gltf-model=\x22#" + m_assetID + "\x22 "+objAnim+" "+cannedAnim+" position=\x22"+locMdl.x+" "+locMdl.y+" "+locMdl.z+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";    
                                        }
                                        callbackz();
                                        }
                                    }
                                    
                                });
                            } else {
                                callbackz();
                            }
                        }, function(err) {
                        
                            if (err) {
                                console.log('A file failed to process');
                                callbackz(err);
                            } else {
                                callback(null);
                            }
                        });
                    } else {
                        callback(null);
                    }
                },
                function (callback) {
                    console.log("attributions 2" + JSON.stringify(attributions));
                    if (attributions != null && attributions != undefined && attributions.length > 0) {
                    attributionsTextEntity = "<a-entity look-at=\x22#player\x22 scale=\x22.75 .75 .75\x22 position=\x220 1 12\x22>"+ //attributions-text-control is set onload, using attributions string above
                    "<a-entity id=\x22attributionsTextControl\x22 class=\x22activeObjexRay\x22 toggle-attributions-text  gltf-model=\x22#exclamation\x22></a-entity>"+
                    "<a-entity id=\x22attributionsTextPanel\x22 visible='false' position=\x220 3.5 1\x22>"+
                        "<a-entity id=\x22attributionsHeaderText\x22 class=\x22activeObjexRay\x22 geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 2.25 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                        "text=\x22value:; wrap-count: 35;\x22></a-entity>" +
                        "<a-entity id=\x22attributionsSourceText\x22 class=\x22activeObjexRay\x22 geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 1.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                        "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                        "<a-entity id=\x22attributionsAuthorText\x22 class=\x22activeObjexRay\x22  geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 .5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                        "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                        "<a-entity id=\x22attributionsLicenseText\x22  geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 -.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                        "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                        "<a-entity id=\x22attributionsModsText\x22 geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 -1.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                        "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                        "<a-entity gltf-model=\x22#square_panel\x22 scale=\x223 3 3\x22 position=\x220 0 -.5\x22></a-entity>" +
                        "<a-entity visible='false' class=\x22activeObjexRay\x22 id=\x22nextAttribution\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x222 -3.75 1\x22></a-entity>" +
                        "<a-entity visible='false' class=\x22activeObjexRay\x22 id=\x22previousAttribution\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-2 -3.75 1\x22></a-entity>" +
                        "</a-entity></a-entity>";
                        console.log('processed attributions for ' + attributions.length);
                        attributionsObject.attributions = attributions;
                        loadAttributions = "ready(function(){" +
                            "let atcontrol = document.getElementById(\x22attributionsTextControl\x22);"+
                            "console.log('tryna set attributions: ' + atcontrol);"+
                            "atcontrol.setAttribute(\x22attributions-text-control\x22, \x22jsonData\x22, "+JSON.stringify(JSON.stringify(attributionsObject))+");"+ //double stringify! yes, it's needed
                        "});";
                        callback();
                    } else {
                        callback();
                    } 
                },
                function (callback) { //old method for calling gltfs, use models above
                    if (sceneGLTFLocations.length > 0) {

                        async.each (sceneGLTFLocations, function (locObj, callbackz) { //loop tru w/ async
                            var scale = 1;
                            var offsetPos = "";
                            var rotAnim = "";
                            var posAnim = "";
                            // let objAnim = "animation-mixer"; //to blend the canned ones, and/or obj anims set below
                            let objAnim = ""; //no, must do it from component
                            let cannedAnim = "";
                            var rightRot = true;
                            var rotVal = 360;
                            let max = .6;
                            let min = 1.2;
                            let speed = Math.random() * (max - min) + min;
                            let maxR = 0;
                            let minR = 360;
                            let randomR = Math.random() * (maxR - minR) + minR;
                            let assetUserID = "";
                            let entityType = ""; //used to set entity id
                            // for (var i = 0; i < sceneGLTFs)
                            let skyboxEnvMap = "";
                            console.log("useCubeMap? " + sceneResponse.sceneUseDynCubeMap);
                            if (sceneResponse.sceneUseDynCubeMap) {
                                skyboxEnvMap = "skybox-env-map";   
                            }
                            console.log("r.gltf:  " + locObj.gltf);
                            if (locObj.gltf != undefined && locObj.gltf != "none") {
                            db.assets.findOne({"name": locObj.gltf}, function (err, asset) { //just to get the f*#$!)ing userID... sigh.
                                if (err || !asset) {
                                    //console.log("error getting gltf data: " + sceneOwnerID);
                                    // callbackz(err);
                                    console.log("no matching glft: ");
                                    assetUserID = "5150540ab038969c24000008";
                                    var sourcePath =   "servicemedia/users/" + assetUserID + "/gltf/" + locObj.gltf;
                                    let gltfURL = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + assetUserID + "/gltf/" + locObj.gltf, Expires: 6000});
                                    //console.log("tryna copy " + sourcePath);
                                    assetNumber++;
                                    var assetID = "gltfasset" + assetNumber;
                                    let rx = locObj.eulerx != null ? locObj.eulerx : 0; 
                                    let ry = locObj.eulery != null ? locObj.eulery : 0; 
                                    let rz = locObj.eulerz != null ? locObj.eulerz : 0; 
                                    let rotation = rx + " " + ry + " " + rz;
                                    if (ry == 99) {
                                        
                                        ry = randomR;
                                        rotation = rx + " " + ry + " " + rz;
                                        // console.log("tryna set random rotation for gltf to " + rotation);
                                    } 
                                    // objAnim = "animation-mixer=\x22timeScale:"+speed+"\x22 geometry camera-cube-env=\x22distance: 10000; resolution: 256;\x22";
                                    if (locObj.markerObjScale != null) {
                                        scale = locObj.markerObjScale;
                                    }
                                    if (locObj.eventData != null && locObj.eventData != undefined && locObj.eventData.length > 1) { //eventData has anim 
                                        // console.log("!!!tryna setup animation " + r.eventData);
                                        rightRot = !rightRot;
                                        if (rightRot == true) {
                                            rotVal = -360;
                                        }
                                        var eSplit = locObj.eventData.split("~");
                                        if (eSplit[0] == "orbit") { 
                                            offsetPos =  "<a-entity position=\x22"+ eSplit[1] + " 0 0\x22></a-entity>";
                                            // cannedAnim = "animation=\x22property: rotation; to: 0 " + (ry - 360) + " 0; loop: true; dur: 10000\x22";
                                            cannedAnim = " animation__rot=\x22property:rotation; dur:30000; to:0 360 0; loop: true; easing:linear;\x22 ";
                                        } else {
                                            // objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"\x22 animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true;\x22>";
                                            // objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"; timeScale:"+speed+";\x22";
                                        }
                                        if (eSplit[0] == "yoyo" || eSplit[1] == "yoyo") {
                                            cannedAnim = "animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true; to: "+locObj.x+" "+(parseFloat(locObj.y) + 2)+" "+locObj.z+"\x22";
                                        }
                                        posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;\x22";     
                                        rotAnim = " animation__rot=\x22property:rotation; dur:3000; to:0 360 0; loop: true; easing:linear;\x22 ";                                 
                                    }
                                    if (locObj.markerType != null && locObj.markerType != undefined && locObj.markerType.length > 1) {
                                        entityType = locObj.markerType; //e.g. "target"
                                    }
                                    console.log("positionning gltf " + locObj.x + " vs " + locObj.latitude );
                                    if (locObj.latitude != null && locObj.longitude != null) {
                                        
                                        let elevation = 0;
                                        if (locObj.elevation != null && locObj.elevation != undefined) {
                                            elevation = locObj.elevation;
                                        }
                                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ gltfURL +"\x22></a-asset-item>";
                                        // position=\x220 "+elevation+" 0\x22
                                        gltfsEntities = gltfsEntities + "<a-entity class=\x22"+entityType+"\x22 ar-shadows class=\x22"+entityType+"\x22 gps-entity-place=\x22latitude: "+locObj.latitude+"; longitude: "+locObj.longitude+">;\x22 "+skyboxEnvMap+"  gltf-model=\x22#" + assetID + "\x22 "+objAnim+" "+cannedAnim+" scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                        callbackz();
                                    } else {
                                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ gltfURL +"\x22></a-asset-item>";
                                        
                                        gltfsEntities = gltfsEntities + "<a-entity class=\x22"+entityType+"\x22 ar-shadows shadow=\x22recieve: true\x22 gltf-model=\x22#" + assetID + "\x22  "+objAnim+" "+cannedAnim+" "+skyboxEnvMap+"  material=\x22metalness:.75;roughness:.1;\x22 position=\x22"+locObj.x+" "+locObj.y+" "+locObj.z+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                        callbackz();
                                    }
                                } else { //WHAT THE FUCk! stoopid duplication..., will fix with asset crud
                                    assetUserID = asset.userID;
                                    var sourcePath =   "servicemedia/users/" + assetUserID + "/gltf/" + locObj.gltf;
                                    let gltfURL = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + assetUserID + "/gltf/" + locObj.gltf, Expires: 6000});
                                    // console.log("tryna copy " + sourcePath);
                                    assetNumber++;
                                    var assetID = "gltfasset" + assetNumber;
                                    let rx = locObj.eulerx != null ? locObj.eulerx : 0; 
                                    let ry = locObj.eulery != null ? locObj.eulery : 0; 
                                    let rz = locObj.eulerz != null ? locObj.eulerz : 0; 
                                    let rotation = rx + " " + ry + " " + rz;
                                    if (ry == 99) {
                                        
                                        ry = randomR;
                                        rotation = rx + " " + ry + " " + rz;
                                        // console.log("tryna set random rotation for gltf to " + rotation);
                                    } 
                                    
                                    objAnim = "animation-mixer=\x22timeScale:"+speed+"\x22";
                                    if (locObj.markerObjScale != null) {
                                        scale = locObj.markerObjScale;
                                    }
                                    if (locObj.eventData != null && locObj.eventData != undefined && locObj.eventData.length > 1) { //eventData has anim 
                                        // console.log("!!!tryna setup animation " + r.eventData);
                                        rightRot = !rightRot;
                                        if (rightRot == true) {
                                            rotVal = -360;
                                        }
                                        var eSplit = locObj.eventData.split("~");
                                        if (eSplit[0] == "orbit") { 
                                            offsetPos =  "<a-entity position=\x22"+ eSplit[1] + " 0 0\x22></a-entity>";
                                            cannedAnim = "animation=\x22property: rotation; to: 0 " + (ry - 360) + " 0; loop: true; dur: 10000\x22";
                                        } else {
                                            // objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"\x22 animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true;\x22>";
                                            objAnim = "animation-mixer=\x22clip: "+eSplit[0]+"; timeScale:"+speed+";\x22";
                                        }
                                        if (eSplit[0] == "yoyo" || eSplit[1] == "yoyo") {
                                            cannedAnim = "animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true; to: "+locObj.x+" "+(parseFloat(locObj.y) + 2)+" "+locObj.z+"\x22";
                                        }
                                        posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;";                                    
                                    }
                                    if (locObj.markerType != null && locObj.markerType != undefined && locObj.markerType.length > 1) {
                                        entityType = locObj.markerType; //e.g. "target"
                                    }
                                    if (locObj.latitude != null && locObj.longitude != null) {
                                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ gltfURL +"\x22</a-asset-item>";
                                        gltfsEntities = gltfsEntities + "<a-entity class=\x22"+entityType+"\x22 gps-entity-place=\x22latitude: "+locObj.latitude+"; latitude: "+locObj.longitude+";\x22 "+skyboxEnvMap+" gltf-model=\x22#" + assetID + "\x22 "+objAnim+" "+cannedAnim+" scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                        callbackz();
                                    } else {
                                        gltfsAssets = gltfsAssets + "<a-asset-item id=\x22" + assetID + "\x22 src=\x22"+ gltfURL +"\x22></a-asset-item>";
                                        gltfsEntities = gltfsEntities + "<a-entity class=\x22"+entityType+"\x22 "+skyboxEnvMap+" gltf-model=\x22#" + assetID + "\x22 "+objAnim+" "+cannedAnim+" position=\x22"+locObj.x+" "+locObj.y+" "+locObj.z+"\x22 scale=\x22"+scale+" "+scale+" "+scale+"\x22 rotation=\x22"+rotation+"\x22 >" + offsetPos+ "</a-entity>";
                                        callbackz();
                                    }
                                }
                            });
                        } else {
                            callbackz();
                        }
                        }, function(err) {
                        
                            if (err) {
                                console.log('A file failed to process');
                                callbackz(err);
                            } else {
                                // console.log('All files have been processed successfully');
                                // gltfItems.reverse();
                                // rezponze.gltfItems = gltfItems;
                                callback(null);
                            }
                        });
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    if (sceneResponse.sceneNextScene != null && sceneResponse.sceneNextScene != "") { 
                        db.scenes.findOne({$or: [ { short_id: sceneResponse.sceneNextScene }, { sceneTitle: sceneResponse.sceneNextScene } ]}, function (err, scene) {
                            if (scene == err) {
                                // console.log("didn't find next scene");
                            } else {
                                nextLink = "href=\x22../" + scene.short_id + "\x22";    
                                sceneNextScene = scene.short_id;
                            }
                        }); 
                    } else {
                        nextLink = "href=\x22../4K94Gjtw7\x22";    
                        sceneNextScene = "4K94Gjtw7";
                    }
                    if (sceneResponse.scenePreviousScene != null && sceneResponse.scenePreviousScene != "") {
                        db.scenes.findOne({$or: [ { short_id: sceneResponse.scenePreviousScene }, { sceneTitle: sceneResponse.scenePreviousScene } ]}, function (err, scene) {
                            if (scene == err) {
                                // console.log("didn't find prev scene");
                            } else {
                                prevLink = "href=\x22../" + scene.short_id + "/index.html\x22";    
                            }
                        }); 
                    }
                    callback();
                },
                function (callback) {
                    if (sceneResponse.sceneText != null && sceneResponse.sceneText != "" && sceneResponse.sceneText.length > 0) {
                        // contentUtils = "<script src=\x22../dash/src/component/content-utils.js\x22></script>"; 

                        if (!textLocation.length > 0) {textLocation = "-10 1.5 -5";}
                        // console.log("tryna get sceneText!");
                        let mainText = sceneResponse.sceneText.replace(/([\"]+)/gi, '&quot;');
                        mainTextEntity = "<a-entity look-at=\x22#player\x22 scale=\x22.75 .75 .75\x22 position=\x22"+textLocation+"\x22>"+
                                "<a-entity id=\x22mainTextToggle\x22 class=\x22activeObjexRay\x22 position=\x220 -.5 .5\x22 toggle-main-text  gltf-model=\x22#exclamation\x22></a-entity>"+
                                "<a-entity id=\x22mainTextPanel\x22 visible='false' position=\x220 0 0\x22>" +
                                "<a-entity id=\x22mainTextHeader\x22 visible='false' geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                "text=\x22value:; wrap-count: 40;\x22></a-entity>" +
                                "<a-entity id=\x22mainText\x22 main-text-control=\x22mainTextString: "+mainText.replace(/([^a-z0-9\,\?\'\-\_\.\!\*\&\$\n\~]+)/gi, ' ')+"; mode: split\x22 geometry=\x22primitive: plane; width: 4.5; height: 4\x22 position=\x220 4.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                "text=\x22value:; wrap-count: 30;\x22>" +
                                // "text=\x22value:"+sceneResponse.sceneText+"; wrap-count: 25;\x22>" +
                                "<a-entity visible='false' class=\x22activeObjexRay\x22 id=\x22nextMainText\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x222 -5 1\x22></a-entity>" +
                                "<a-entity visible='false' class=\x22activeObjexRay\x22 id=\x22previousMainText\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-2 -5 1\x22></a-entity>" +
                                "<a-entity gltf-model=\x22#square_panel\x22 scale=\x223 3 3\x22 position=\x220 -1.5 -.5\x22></a-entity>" +
                            "</a-entity></a-entity></a-entity>";
                        callback();
                    } else {
                        callback();
                    }
                },
                function (callback) { //fethc audio items
                    db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items) {
                        if (err || !audio_items) {
                            console.log("error getting audio items: " + err);
                            callback(null);
                        } else {
                            callback(null, audio_items) //send them along
                        }
                    });
                },
                
                function (audio_items, callback) { //add the signed URLs to the obj array 
                    for (var i = 0; i < audio_items.length; i++) { //?? TODO do this async - if it's slow shit will get out of whack
                        console.log("audio_item: " + JSON.stringify(audio_items[i]));
                        var item_string_filename = JSON.stringify(audio_items[i].filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 1000);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        //console.log(baseName);
                        var mp3Name = baseName + '.mp3';
                        var oggName = baseName + '.ogg';
                        var pngName = baseName + '.png';
                        // primaryAudioTitle = audio_items[i].filename;

                        if (sceneResponse.scenePrimaryAudioID != undefined && audio_items[i]._id == sceneResponse.scenePrimaryAudioID) {
                            primaryAudioTitle = audio_items[i].title;
                        // primaryAudioWaveform = 
                        mp3url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 6000});
                        oggurl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 6000});
                        pngurl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 6000});
                        primaryAudioWaveform = pngurl;
                        pAudioWaveform = "<img id=\x22primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 src=\x22"+primaryAudioWaveform+"\x22>";
                        }
                        if (sceneResponse.sceneAmbientAudioID != undefined && audio_items[i]._id == sceneResponse.sceneAmbientAudioID) {
                            ambientUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 6000});
                        }
                        // console.log("copying audio to s3...");
                    }
                    callback(null);
                },
                function (callback) {
                    let hasPrimaryAudio = false;
                    let hasPrimaryAudioStream = false;
                    let hasAmbientAudio = false;
                    let hasTriggerAudio = false;
                    if (sceneResponse.scenePrimaryAudioID != null && sceneResponse.scenePrimaryAudioID.length > 4) {
                        hasPrimaryAudio = true;
                    }
                    if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 4) {
                        hasPrimaryAudioStream = true;
                        hasPrimaryAudio = false;
                    }
                    // console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    if (hasPrimaryAudioStream || hasPrimaryAudio) {
                        if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                            primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;    
                        } 
                        console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    }
                    if (sceneResponse.sceneAmbientAudioID != null && sceneResponse.sceneAmbientAudioID.length > 4) {
                        hasAmbientAudio = true;
                        // var pid = ObjectID(sceneResponse.scenePrimaryAudioID);
                        // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneResponse.scenePrimaryAudioID));
                        // requestedAudioItems.push(ObjectID(sceneResponse.scenePrimaryAudioID));
                        // ambientAudioScript = "<script>" +      
                        // "let ambientAudioHowl = new Howl({" + //inject howler for non-streaming
                        //         "src: \x22"+oggurl+"\x22, volume: 1.0, loop: true" + 
                        //     "});" +
                        // "ambientAudioHowl.load();</script>";
                    }
                    if (sceneResponse.sceneTriggerAudioID != null && sceneResponse.sceneTriggerAudioID.length > 4) {
                        // var pid = ObjectID(sceneResponse.scenePrimaryAudioID);
                        // console.log("tryna get [ObjectID(sceneData.scenePrimaryAudioID)]" + ObjectID(sceneResponse.scenePrimaryAudioID));
                        // requestedAudioItems.push(ObjectID(sceneResponse.scenePrimaryAudioID));
                        triggerAudioScript = "<script>" +      
                        "let triggerAudioHowl = new Howl({" + //inject howler for non-streaming
                                "src: \x22"+oggurl+"\x22, volume: 1.0, loop: true" +
                            "});" +
                        "triggerAudioHowl.load();</script>";
                    }
                    if (sceneResponse.scenePrimaryAudioTitle != null && sceneResponse.scenePrimaryAudioTitle != undefined && sceneResponse.scenePrimaryAudioTitle.length > 0) {
                        primaryAudioTitle = sceneResponse.scenePrimaryAudioTitle;
                        console.log("primaryAudioTitle: " + primaryAudioTitle); 
                    }
                    if (hasPrimaryAudio) {
                        if (sceneResponse.sceneType == "ThreeJS") {
                                
                            // create an AudioListener and add it to the camera
                            primaryAudioScript = "var listener = new THREE.AudioListener();\n"+
                            "camera.add( listener );\n"+
                            // create the PositionalAudio object (passing in the listener)
                            "primaryAudio = new THREE.PositionalAudio( listener );\n"+
                            // load a sound and set it as the PositionalAudio object's buffer
                            "var primaryAudioLoader = new THREE.AudioLoader();\n"+
                            "var sphere = new THREE.SphereBufferGeometry( 1, 32, 32 );\n"+
                            "var material = new THREE.MeshPhongMaterial( { color: 'red' } );\n"+
                            "var primaryAudioMesh = new THREE.Mesh( sphere, material );\n"+
                            "primaryAudioLoader.load( \x22"+oggurl+"\x22, function( buffer ) {\n"+
                                "primaryAudio.setBuffer( buffer );\n"+
                                "primaryAudio.setRefDistance( 20 );\n"+
                                "primaryAudioMesh.material.color = new THREE.Color( 'green' );\n"+
                                "primaryAudioStatusText.set({content: \x22ready\x22, fontColor: new THREE.Color( 'green' )});\n"+
                                
                                // "primaryAudio.play();\n"+
                            "});\n"+
                            // create an object for the sound to play from

                            "primaryAudioMesh.userData.name = 'primaryAudioMesh';\n"+
                            "primaryAudioMesh.position.set("+audioLocation+");\n"+
                            "scene.add( primaryAudioMesh );\n"+
                            // finally add the sound to the mesh
                            "primaryAudioMesh.add( primaryAudio );\n";
                            
                        } else { //aframe below
                            primaryAudioScript = "<script>\n" +      
                            "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                                    "src: \x22"+oggurl+"\x22, volume: 1.0," + loopable +
                                "});" +
                            "primaryAudioHowl.load();</script>";
                            primaryAudioControl = "<script src=\x22../dash/src/component/primary-audio-control.js\x22></script>";
                            primaryAudioEntity = "<a-entity id=\x22primaryAudioParent\x22 position=\x22"+audioLocation+"\x22>"+ //parent
                            "<a-entity id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .30\x22 position=\x220 2.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22"+
                            "text=\x22value:Click to play;\x22>"+
                            "<a-entity gltf-model=\x22#landscape_panel\x22 scale=\x22.15 .125 .15\x22 position=\x220 0 -.1\x22 material=\x22color: black; transparent: true; opacity: 0.1\x22></a-entity>" +
                            "<a-image id=\x22primaryAudioWaveformImageEntity\x22 position = \x220 -.1 0\x22 width=\x221\x22 height=\x22.25\x22 src=\x22#primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 transparent=\x22true\x22></a-image>"+
                            // "</a-entity>"+
                            "<a-entity id=\x22primaryAudio\x22 mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 primary-audio-control=\x22url: "+oggurl+"; audioevents:"+sceneResponse.scenePrimaryAudioTriggerEvents+"; targetattach:"+sceneResponse.sceneAttachPrimaryAudioToTarget+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                            "title: "+primaryAudioTitle+"\x22 id=\x22sphere\x22 geometry=\x22primitive: sphere; radius: .25;\x22 material=\x22shader: noise;\x22 position=\x22-1 0 0\x22></a-entity></a-entity></a-entity>";
                        }
                    }
                    if (hasPrimaryAudioStream) {
                        mp3url = sceneResponse.scenePrimaryAudioStreamURL;   
                        oggurl = sceneResponse.scenePrimaryAudioStreamURL;                    
                        streamPrimaryAudio = true;
                        primaryAudioScript = "<script>Howler.autoUnlock = false;" + //override if streaming url
                        "let primaryAudioHowl = new Howl({" + //inject howler for non-streaming
                                "src: \x22"+sceneResponse.scenePrimaryAudioStreamURL+"\x22, html5: true, volume: .8, format: ['mp3', 'aac']" +
                            "});" +
                        "</script>";
                        primaryAudioControl = "<script src=\x22../dash/src/component/primary-audio-control.js\x22></script>";
                        primaryAudioEntity = "<a-entity id=\x22primaryAudioParent\x22 position=\x22"+audioLocation+"\x22>"+ //parent
                        "<a-entity id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .30\x22 position=\x220 2.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22"+
                        "text=\x22value:Click to play;\x22>"+
                        "<a-entity gltf-model=\x22#landscape_panel\x22 scale=\x22.15 .125 .15\x22 position=\x220 0 -.1\x22 material=\x22color: black; transparent: true; opacity: 0.1\x22></a-entity>" +
                        "<a-entity id=\x22primaryAudio\x22 mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 primary-audio-control=\x22url: "+oggurl+"; autoplay: "+sceneResponse.sceneAutoplayPrimaryAudio+";"+
                        "title: "+primaryAudioTitle+"\x22 id=\x22sphere\x22 geometry=\x22primitive: sphere; radius: .25;\x22 material=\x22shader: noise;\x22 position=\x22-1 0 0\x22></a-entity></a-entity></a-entity>";
                    }
                    if (hasAmbientAudio) {
                        ambientAudioScript = "<script>" +      
                        "let ambientAudioHowl = new Howl({" + //inject howler for non-streaming
                                "src: \x22"+ambientUrl+"\x22, volume: 0, loop: true" + 
                            "});" +
                        "ambientAudioHowl.load();</script>";
                        ambientAudioControl = "<script src=\x22../dash/src/component/ambient-audio-control.js\x22></script>";
                        let ambientPosAnim = "animation__yoyo=\x22property: position; to: -33 3 0; dur: 60000; dir: alternate; easing: easeInSine; loop: true;\x22 ";
                        let ambientRotAnim = "animation__rot=\x22property:rotation; dur:60000; to: 0 360 0; loop: true; easing:linear;\x22 ";        
                        // posAnim = "animation__pos=\x22property: position; to: random-position; dur: 15000; loop: true;";  
                        ambientAudioEntity = "<a-entity "+ambientRotAnim+"><a-entity ambient-audio-control=\x22url: "+ambientUrl+";\x22"+
                        "geometry=\x22primitive: sphere; radius: .5\x22 "+ambientPosAnim+" position=\x2233 3 0\x22>" +
                        "</a-entity></a-entity>";

                    }
                    // if (mp3url == null || mp3url == undefined || mp3url.length < 10) {
                    //     if (sceneResponse.scenePrimaryAudioStreamURL != null && sceneResponse.scenePrimaryAudioStreamURL.length > 8 ) {
                    //         // mp3url = sceneResponse.scenePrimaryAudioStreamURL + "/stream";   
                    //         // oggurl = sceneResponse.scenePrimaryAudioStreamURL + "/stream";   
                    //         mp3url = sceneResponse.scenePrimaryAudioStreamURL;   
                    //         oggurl = sceneResponse.scenePrimaryAudioStreamURL;                    
                    //         streamPrimaryAudio = true;
                    //         console.log("oggurl " + oggurl);
                    //         callback();
                    //     } else {
                    //         callback();
                    //     }
                    // } else {
                        callback();
                    // }  
                },
                function (callback) { //fethc video items
                    if (sceneResponse.sceneVideos != null && sceneResponse.sceneVideos.length > 0) {
                        sceneResponse.sceneVideos.forEach(function (vid) {
                            // console.log("looking for sceneVideo : " + JSON.stringify(vid));
                            var p_id = ObjectID(vid); //convert to binary to search by _id beloiw
                            requestedVideoItems.push(p_id); //populate array
                        });
                        db.video_items.find({_id: {$in: requestedVideoItems}}, function (err, video_items) {
                            if (err || !video_items) {
                                console.log("error getting video items: " + err);
                                callback(null, new Array());
                            } else {
                                //console.log("gotsome video items: " + JSON.stringify(video_items[0]));

                                callback(null, video_items) //send them along
                            }
                        });
                    } else {
                        callback(null, new Array());
                    }
                },

                function (video_items, callback) { //add the signed URLs to the obj array
                    preloadVideo = true; //FOR NOW - testing on ios, need to set a toggle for this...
                    //for (var i = 0; i < 1; i++) { //only do first one for now..
                    if (video_items != null && video_items[0] != null) {
                        //console.log("video_item: " + JSON.stringify(video_items[0]));
                        var item_string_filename = JSON.stringify(video_items[0].filename);
                        item_string_filename = item_string_filename.replace(/\"/g, "");
                        var item_string_filename_ext = getExtension(item_string_filename);
                        var expiration = new Date();
                        expiration.setMinutes(expiration.getMinutes() + 1000);
                        var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                        //console.log(baseName);
                        var mp4Name = baseName + '.mp4';
                        //console.log("mp4 video: " + mp4Name + " " + video_items[0]._id);
                        var vid = video_items[0]._id;
                        var ori = video_items[0].orientation != null ? video_items[0].orientation : "";
                        mp4url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + video_items[0].userID + "/" + vid + "." + mp4Name, Expires: 6000});
                            if (ori.toLowerCase() == "equirectangular") {
                                videosphereAsset = "<video id=\x22videosphere\x22 autoplay loop crossOrigin=\x22anonymous\x22 src=\x22" + mp4url + "\x22></video>";
                                videoEntity = "<a-videosphere play-on-window-click play-on-vrdisplayactivate-or-enter-vr crossOrigin=\x22anonymous\x22 src=\x22#videosphere\x22 rotation=\x220 180 0\x22 material=\x22shader: flat;\x22></a-videosphere>";
    //                                        skySettings = "transparent='true'";
                            } else {
                                if (preloadVideo) {
                                    videoAsset = "<video id=\x22video1\x22 crossOrigin=\x22anonymous\x22 src=\x22" + mp4url + "\x22></video>";
                                } else {
                                    videoAsset = "<video autoplay muted loop=\x22true\x22 webkit-playsinline playsinline id=\x22video1\x22 crossOrigin=\x22anonymous\x22></video>"; 
                                }
                                // videoEntity = "<a-video  play-on-click src=\x22#video1\x22 position='5 2 -5' width='10' height='6' look-at=\x22#player\x22></a-video>";
                                let videoStatus = "<a-text id=\x22videoText\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x22-.5 -1 1\x22 wrapCount=\x2240\x22 value=\x22Click to Play Video\x22></a-text>";
                                videoEntity = "<a-entity class=\x22activeObjexGrab activeObjexRay\x22 vid-materials=\x22url: "+mp4url+"\x22 gltf-model=\x22#landscape_panel\x22 position=\x22"+videoLocation+"\x22 width='10' height='6' look-at=\x22#player\x22>"+videoStatus+"</a-entity>";
                            }
                            //console.log("copying video to s3...");
                            callback(null);
                    } else {
                        callback(null);
                    }
                },

                function (callback) {
                    var postcards = [];
                    // console.log("sceneResponse.scenePostcards: " + JSON.stringify(sceneResponse.scenePostcards));
                    if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                        var index = 0;
                        async.each(sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                            index++;
                            var oo_id = ObjectID(postcardID);
                            // console.log("index? " + index);

                            db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {

                                bucketFolder = sceneResponse.sceneDomain;
                                // console.log("params " + JSON.stringify(params)); 
                                if (err || !picture_item) {
                                    console.log("error getting postcard " + postcardID + err);
                                    callbackz();
                                } else {
                                    var params = {
                                        Bucket: sceneResponse.sceneDomain,
                                        Key: sceneResponse.short_id + "/"+ postcardID + ".standard." + picture_item.filename
                                    }
                                    s3.headObject(params, function(err, data) { //check that the postcard is pushed to static route
                                        if (err) {
                                            console.log("postcard missing from static route, tryna copy to " + sceneResponse.sceneDomain);
                                            s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item._id + ".standard." + picture_item.filename,
                                                Key: sceneResponse.short_id + "/"+ picture_item._id + ".standard." + picture_item.filename}, function (err, data) {
                                                if (err) {
                                                    console.log("ERROR copyObject" + err);
                                                    
                                                }
                                                else {
                                                    console.log('SUCCESS copyObject');
                                                    index++;
                                                    // postcard1 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                                    postcard1 = sceneResponse.sceneDomain +"/"+sceneResponse.short_id +"/"+ picture_item._id + ".standard." + picture_item.filename;
                                                    // callbackz();
                                                }
                                            });
                                        } else {
                                            index++;
                                            postcard1 = sceneResponse.sceneDomain +"/"+sceneResponse.short_id +"/"+ picture_item._id + ".standard." + picture_item.filename;
                                            // postcard1 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                            // callbackz();
                                        }
                                        callbackz();
                                    });
                                    
                                    }
                                });
                            },
                            function (err) {                       
                                if (err) {
                                    console.log('A file failed to process');
                                    callback();
                                } else {
                                    // console.log('postcards processed successfully');
                                    callback();
                                }
                            });
                        } else {
        //                      callback(null);
                            callback();
                        }
                },
                function (callback) {
                    console.log("pictureGroups: " + sceneResponse.scenePictureGroups);
                    if (sceneResponse.scenePictureGroups != null && sceneResponse.scenePictureGroups.length > 0) {
                        pgID = sceneResponse.scenePictureGroups[0];
                        let oo_id = ObjectID(pgID);
                        db.groups.find({"_id": oo_id}, function (err, groups) {
                            if (err || !groups) {
                                callback();
                            } else {
                            console.log("gotsa group: "+ JSON.stringify(groups));
                            async.each(groups, function (groupID, callbackz) { 
                                let picGroup = {};
                                picGroup._id = groups[0]._id;
                                picGroup.name = groups[0].name;
                                picGroup.userID = groups[0].userID;
                                let ids = groups[0].items.map(convertStringToObjectID);
                                // let modImages =
                                db.image_items.find({_id : {$in : ids}}, function (err, images) { // get all the image records in group
                                    if (err || !images) {
                                        callbackz();
                                    } else {
                                        async.each(images, function(image, cbimage) { //jack in a signed url for each
                                            image.url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + image.userID + "/" + image._id + ".standard." + image.filename, Expires: 6000});
                                            cbimage();
                                        }, 
                                        function (err) {
                                            if (err) {
                                                picGroup.images = images;
                                                requestedPictureGroups.push(picGroup);
                                                console.log("requestedPictureGroupsERrorort: "+ JSON.stringify(requestedPictureGroups));
                                                callbackz();
                                            } else {
                                                picGroup.images = images;
                                                requestedPictureGroups.push(picGroup);
                                                console.log("requestedPictureGroups: "+ JSON.stringify(requestedPictureGroups));
                                                callbackz();
                                            }
                                        });
                                    }
                                });
                            },
                            function (err) {
                                if (err) {
                                    console.log('A file failed to process');
                                    callback(null);
                                } else {
                                    console.log('All pictureGroups processed successfully');
                                    pictureGroupsEntity = "<a-entity scale=\x22.75 .75 .75\x22 look-at=\x22#player\x22 position=\x22-4 2 -3\x22>"+ //attributions-text-control is set onload, using attributions string above
                                    "<a-entity position=\x220 -2.5 0\x22 scale=\x22.75  .75 .75\x22 id=\x22pictureGroupsControl\x22 class=\x22activeObjexRay\x22 skybox-env-map toggle-picture-group gltf-model=\x22#camera_icon\x22></a-entity>"+
                                    "<a-entity id=\x22pictureGroupPanel\x22 visible=\x22false\x22 position=\x220 -1 0\x22>"+
                                    "<a-entity id=\x22pictureGroupHeaderText\x22 geometry=\x22primitive: plane; width: 3.25; height: 1\x22 position=\x220 1.75 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    "text=\x22value:; wrap-count: 35;\x22></a-entity>" +
                                    // "<a-entity id=\x22availableSceneText\x22 class=\x22activeObjexRay\x22 geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 1.5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    // "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                                    // "<a-entity id=\x22availableSceneOwner\x22 class=\x22activeObjexRay\x22  geometry=\x22primitive: plane; width: 4; height: 1\x22 position=\x220 .5 0\x22 material=\x22color: grey; transparent: true; opacity: 0.0\x22" +
                                    // "text=\x22value:; wrap-count: 25;\x22></a-entity>" +
                                    "<a-entity id=\x22pictureGroupPic\x22 visible=\x22true\x22 position=\x220 2.25 -.1\x22 gltf-model=\x22#landscape_panel\x22 scale=\x221 1 1\x22 material=\x22shader: flat; alphaTest: 0.5;\x22"+
                                    "rotation='0 0 0'></a-entity>"+
                                    // "<a-entity gltf-model=\x22#square_panel\x22 scale=\x222.25 2.25 2.25\x22 position=\x220 2.1 -.25\x22></a-entity>" +
                                    "<a-entity visible='true' class=\x22activeObjexRay\x22 id=\x22pictureGroupNextButton\x22 gltf-model=\x22#next_button\x22 scale=\x22.5 .5 .5\x22 position=\x222.25 -.75 0\x22></a-entity>" +
                                    "<a-entity visible='true' class=\x22activeObjexRay\x22 id=\x22pictureGroupPreviousButton\x22 gltf-model=\x22#previous_button\x22 scale=\x22.5 .5 .5\x22 position=\x22-2.25   -.75 0\x22></a-entity>" +
                                    "</a-entity></a-entity>";
                                    loadPictureGroups = "ready(function(){" + //after page is ready..
                                    "let pgcontrol = document.getElementById(\x22pictureGroupsControl\x22);"+
                                    // "console.log('tryna set availablescenes: ' + "+JSON.stringify(JSON.stringify(availableScenesResponse))+");"+
                                    "pgcontrol.setAttribute(\x22picture-groups-control\x22, \x22jsonData\x22, "+JSON.stringify(JSON.stringify(requestedPictureGroups))+");"+ //double stringify! yes, it's needed
                                    "});";
                                    callback(null);
                                }
                            });
                            // callback();
                            }
                        });
                    } else {
                        callback();
                    }

                },
                function (callback) {
                    // var postcards = [];
                    //console.log("sceneResponse.scenePictures: " + JSON.stringify(sceneResponse.scenePictures));
                    if (sceneResponse.scenePictures != null && sceneResponse.scenePictures.length > 0) {
                        var index = 0;
                        async.each(sceneResponse.scenePictures, function (picID, callbackz) { //nested async-ery!
                                var oo_id = ObjectID(picID);
                                db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                                    if (err || !picture_item) {
                                        console.log("error getting scenePictures " + picID + err);
                                        callbackz();
                                    } else {
                                        //console.log("tryna copy picID " + picID + " orientation " + picture_item.orientation);
                                        var version = ".standard.";
                                        if (picture_item.orientation != undefined) {
                                            if (picture_item.orientation.toLowerCase() == "equirectangular") {
                                                // console
                                                skyboxID = picID;
                                                version = ".original.";
                                                fogSettings = "";
                                                // convertEquirectToCubemap = "<script src=\x22../dash/ref/aframe/dist/equirect-to-cubemap.js\x22></script>";
                                            }
                                        }
                                        // s3.copyObject({Bucket: bucketFolder, CopySource: 'servicemedia/users/' + picture_item.userID +"/"+ picture_item.filename, //use full rez pic for skyboxen
                                        //     Key: short_id +"/"+ picture_item._id + version + picture_item.filename}, function (err, data) {
                                        //     if (err) {
                                        //         console.log("ERROR copyObject" + err);
                                        //     } else {
                                        //         console.log('SUCCESS copyObject');
                                        //     }
                                        // });
                                        let max = 30;
                                        let min = -30;
                                        let x = Math.random() * (max - min) + min;
                                        // let y = Math.random() * (max.y - min.y) + min.y;
                                        let z = Math.random() * (max - min) + min;
                                        if (z >= -1 && z <= 1) {
                                            z = -5;
                                        }
                                        if (x >= -1 && z <= 1) {
                                            x = -5;
                                        }
                                        index++;
                                        let position = x + " " + 2 + " " + z;
                                        image1url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});
                                        picArray.push(image1url);
                                        imageAssets = imageAssets + "<img id=\x22smimage" + index + "\x22 crossorigin=\x22anonymous\x22 src='" + image1url + "'>";
                                        let caption = "";
                                        if (picture_item.captionUpper != null) {
                                            caption = "<a-text class=\x22pCap\x22 align=\x22center\x22 rotation=\x220 0 0\x22 position=\x220 1.15 -.1\x22 wrapCount=\x2240\x22 value=\x22"+picture_item.captionUpper+"\x22></a-text>";
                                        }
                                        let lowerCap = "";
                                        let actionCall = "";
                                        let link = "";
                                        console.log("picture_item.linkType: " + picture_item.linkType);
                                        if (picture_item.linkType != undefined && picture_item.linkType.toLowerCase() != "none" && picture_item.linkURL != undefined && !picture_item.linkURL.includes("undefined") && picture_item.linkURL.length > 6) {
                                            link = "basic-link=\x22href: "+picture_item.linkURL+";\x22 class=\x22activeObjexGrab activeObjexRay\x22";
                                            // console.log("link " + link);
                                        }
                                        if (picture_item.hasAlphaChannel) {
                                            imageEntities = imageEntities + "<a-entity "+link+" look-at=\x22#player\x22 geometry=\x22primitive: plane; height: 10; width: 10\x22 material=\x22shader: flat; transparent: true; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                            " position=\x22"+position+"\x22 rotation='0 90 0' visible='true'>"+caption+"</a-entity>";
                                        } else {
                                            if (picture_item.orientation != "equirectangular" && picture_item.orientation != "Equirectangular") {
                                                

                                                // position = 

                                                // let randomX = Math.Random() * (max - min) + min;
                                                // let randomZ = Math.Random();
                                                // position = "\x22" +(index*-5)+ " .5 " +(index*-5)+ "\x22"; 
                                                
                                                
                                                if (picture_item.orientation == "portrait" || picture_item.orientation == "Portrait") {
                                                    //console.log("gotsa portrait!");
                                                    imageEntities = imageEntities + "<a-entity "+link+" mod-materials=\x22index:"+index+"\x22 look-at=\x22#player\x22 gltf-model=\x22#portrait_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation='0 90 0' visible='true'>"+caption+"</a-entity>";
                                                } else if (picture_item.orientation == "square" || picture_item.orientation == "Square") {
                                                    imageEntities = imageEntities + "<a-entity "+link+" mod-materials=\x22index:"+index+"\x22 look-at=\x22#player\x22 gltf-model=\x22#square_panel\x22 scale=\x223 3 3\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation='0 90 0' visible='true'>"+caption+"</a-entity>";
                                                } else if (picture_item.orientation == "circle" || picture_item.orientation == "Circle") {
                                                    imageEntities = imageEntities + "<a-entity "+link+" mod-materials=\x22index:"+index+"\x22 look-at=\x22#player\x22 gltf-model=\x22#circle_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation='0 90 0' visible='true'>"+caption+"</a-entity>";
                                                } else {
                                                    imageEntities = imageEntities + "<a-entity "+link+" mod-materials=\x22index:"+index+"\x22 look-at=\x22#player\x22 gltf-model=\x22#landscape_panel\x22 material=\x22shader: flat; src: #smimage" + index + "; alphaTest: 0.5;\x22"+
                                                    " position=\x22"+position+"\x22 rotation='0 90 0' visible='true'>"+caption+"</a-entity>";
                                                }
                                            }
                                        }
                                        callbackz();
                                    }
                                });
                            },
                            function (err) {
                            
                                if (err) {
                                    console.log('A file failed to process');
                                    callback(null);
                                } else {
                                    //console.log('All pictures processed successfully');
                                    callback(null);
                                }
                            });
                    } else {
                        //                      callback(null);
                        callback(null);
                    }
                },

                function (callback) {
                    //console.log("skybox chunck " + skyboxID);
                    if (skyboxID != "") {
                        var oo_id = ObjectID(skyboxID); //set if there's an equirect pic, above
                    } else {
                        if (sceneResponse.sceneSkybox != null && sceneResponse.sceneSkybox != "") //old way
                        var oo_id = ObjectID(sceneResponse.sceneSkybox);
                        //console.log("skybox chunck " + oo_id);
                    }

                    if (oo_id) {
                        //console.log("skybox chunck " + oo_id);
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) { //maybe not necessary to check? 
                            if (err || !picture_item) {
                                console.log("error getting skybox " + sceneResponse.sceneSkybox + err);
                                callback(null);
                            } else {
                                let theKey = 'users/' + picture_item.userID + '/' + picture_item._id + '.original.' + picture_item.filename;
                                //console.log("theKey " + theKey);
                                const params = {
                                    Bucket: 'servicemedia', 
                                    Key: theKey
                                };
                                s3.headObject(params, function(err, data) { //some old skyboxen aren't saved with .original. in filename, check for that
                                    if (err) {
                                    //   console.log("din't find skybox: " + err, err.stack);
                                        theKey = 'users/' + picture_item.userID + '/' + picture_item.filename;
                                        skyboxUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: theKey, Expires: 6000});
                                        skyboxAsset = "<img id=\x22sky\x22 crossorigin=\x22\anonymous\x22 src='" + skyboxUrl + "'>";
                                        // let envMap = sceneResponse.sceneUseDynCubeMap ? "convert-to-envmap" : "";
                                        skySettings = "<a-sky hide-in-ar-mode src=#sky></a-sky>";
                                        aframeEnvironment = "";
                                        hemiLight = "<a-light type=\x22hemisphere\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.5\x22 position\x220 0 0\x22>"+
                                        "</a-light>";
                                        callback(null);
                                    } else {
                                        //console.log("found skybox at " + theKey);
                                        skyboxUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: theKey, Expires: 6000});
                                        skyboxAsset = "<img id=\x22sky\x22 crossorigin=\x22\anonymous\x22 src='" + skyboxUrl + "'>";
                                        // let envMap = sceneResponse.sceneUseDynCubeMap ? "convert-to-envmap" : "";
                                        // skySettings = "<a-sky hide-in-ar-mode "+envMap+" src=#sky></a-sky>";
                                        skySettings = "<a-sky hide-in-ar-mode src=#sky></a-sky>";
                                        aframeEnvironment = "";
                                        hemiLight = "<a-light type=\x22hemisphere\x22 color=\x22" + sceneResponse.sceneColor1 + "\x22 groundColor=\x22" + sceneResponse.sceneColor2 + "\x22 intensity=\x22.5\x22 position\x220 0 0\x22>"+
                                        "</a-light>";
                                        callback(null);
                                    }
                                });

                                if (sceneResponse.sceneUseDynCubeMap) {
                                let path1 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_px.jpg", Expires: 6000});  
                                let path2 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_nx.jpg", Expires: 6000});  
                                let path3 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_py.jpg", Expires: 6000});  
                                let path4 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_ny.jpg", Expires: 6000});  
                                let path5 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_pz.jpg", Expires: 6000});  
                                let path6 = s3.getSignedUrl('getObject', {Bucket: 'archive1', Key: "staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_nz.jpg", Expires: 6000});                                    
                                // theKey = 'users/' + picture_item.userID + '/' + picture_item.filename;
                                // skyboxUrl = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: theKey, Expires: 6000});
                                if (sceneResponse.sceneType == "ThreeJS") {
                                    cubeMapAsset = []; //no AFrame for this, ThreeJS only
                                    cubeMapAsset.push(path1);
                                    cubeMapAsset.push(path2);
                                    cubeMapAsset.push(path3);
                                    cubeMapAsset.push(path4);
                                    cubeMapAsset.push(path5);
                                    cubeMapAsset.push(path6);
                                    
                                    // console.log("cubeMapAsset " + JSON.stringify(cubeMapAsset));
                                } else if (sceneResponse.sceneType == "BabylonJS") {
                                    cubeMapAsset = []; //no AFrame for this, ThreeJS only
  
                                    cubeMapAsset.push(path1);
                                    cubeMapAsset.push(path2);
                                    cubeMapAsset.push(path3);
                                    cubeMapAsset.push(path4);
                                    cubeMapAsset.push(path5);
                                    cubeMapAsset.push(path6);

                                } else {
                                    cubeMapAsset = "<a-cubemap id=\x22envMap\x22><img id=\x22envMap_1\x22 crossorigin=\x22anonymous\x22 src=\x22"+path1+"\x22>"+
                                    "<img id=\x22envMap_2\x22 crossorigin=\x22anonymous\x22 src=\x22"+path2+"\x22><img id=\x22envMap_3\x22 crossorigin=\x22anonymous\x22 src=\x22"+path3+"\x22>"+
                                    "<img id=\x22envMap_4\x22 crossorigin=\x22anonymous\x22 src=\x22"+path4+"\x22><img id=\x22envMap_5\x22 crossorigin=\x22anonymous\x22 src=\x22"+path5+"\x22>"+
                                    "<img id=\x22envMap_6\x22 crossorigin=\x22anonymous\x22  src=\x22"+path6+"\x22></a-cubemap>";
                                    }
                                }
                                // cubeMapAsset = "<a-cubemap id=\x22envMap\x22><img id=\x22envMap_1\x22 crossorigin=\x22anonymous\x22 src=\x22/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_1.jpg\x22>"+
                                // "<img id=\x22envMap_2\x22 crossorigin=\x22anonymous\x22 src=\x22https://archive1.s3.amazonaws.com/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_2.jpg\x22><img id=\x22envMap_3\x22 crossorigin=\x22anonymous\x22 src=\x22https://archive1.s3.amazonaws.com/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_3.jpg\x22>"+
                                // "<img id=\x22envMap_4\x22 crossorigin=\x22anonymous\x22 src=\x22https://archive1.s3.amazonaws.com/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_4.jpg\x22><img id=\x22envMap_5\x22 crossorigin=\x22anonymous\x22 src=\x22https://archive1.s3.amazonaws.com/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_5.jpg\x22>"+
                                // "<img id=\x22envMap_6\x22 crossorigin=\x22anonymous\x22  src=\x22https://archive1.s3.amazonaws.com/staging/"+picture_item.userID+"/cubemaps/"+picture_item._id+"_6.jpg\x22></a-cubemap>";
                                
                            }
                        });
                    } else {
                        callback(null);
                    }
                },

                function (callback) {

                    let grabMix = "<a-mixin id=\x22grabmix\x22" + //mixin for grabbable objex
                        "event-set__grab=\x22material.color: #FFEF4F\x22" +
                        "event-set__grabend=\x22material.color: #F2E646\x22" +
                        "event-set__hit=\x22material.color: #F2E646\x22" +
                        "event-set__hitend=\x22material.color: #EF2D5E\x22" +
                        "event-set__mousedown=\x22material.color: #FFEF4F\x22" +
                        "event-set__mouseenter=\x22material.color: #F2E646\x22" +
                        "event-set__mouseleave=\x22material.color: #EF2D5E\x22" +
                        "event-set__mouseup=\x22material.color: #F2E646\x22" +
                        "geometry=\x22primitive: box; height: 0.30; width: 0.30; depth: 0.30\x22" +
                        "material=\x22color: #EF2D5E;\x22></a-mixin>";
                    // let primaryAudioScript = ""
                    // <a-assets>

                    let playerAvatarTemplate = "<template id=\x22avatar-template\x22>"+
                    
                    "<a-entity gltf-model=\x22#avatar_model\x22>"+
                    "<a-text class=\x22playerName\x22 look-at=\x22#player\x22 rotation=\x220 0 0\x22 position=\x22.5 .75 -.15\x22 value=\x22"+avatarName+"\x22></a-text>"+
                        // "<a-text look-at=\x22#player\x22 rotation=\x220 180 0\x22 position=\x22.5 1.25 -.15\x22 value=\x22"+avatarName+"\x22></a-text>"+
                    "</a-entity>"+
                    "</template>";
                    // let playerAvatarTemplate = "<template id=\x22avatar-template\x22><a-entity networked-audio-source class=\x22avatar\x22><a-sphere class=\x22head\x22 color=\x22#5985ff\x22 scale=\x220.45 0.5 0.4\x22>"+
                    // "</a-sphere><a-entity class=\x22face\x22 position=\x220 0.05 0\x22><a-sphere class=\x22eye\x22 color=\x22#efefef\x22"+
                    // "position=\x220.16 0.1 -0.35\x22 scale=\x220.12 0.12 0.12\x22><a-sphere class=\x22pupil\x22 color=\x22#000\x22 position=\x220 0 -1\x22 scale=\x220.2 0.2 0.2\x22></a-sphere></a-sphere><a-sphere class=\x22eye\x22 color=\x22#efefef\x22"+ 
                    // "position=\x22-0.16 0.1 -0.35\x22 scale=\x220.12 0.12 0.12\x22><a-sphere class=\x22pupil\x22 color=\x22#000\x22 position=\x220 0 -1\x22 scale=\x220.2 0.2 0.2\x22></a-sphere></a-sphere></a-entity></a-entity></template>";
                    let webxrFeatures = "";
                    let arHitTest = "";
                    let arShadowPlane = "";
                    if (sceneResponse.sceneType != null && sceneResponse.sceneType != undefined && sceneResponse.sceneType.toLowerCase() == "augmented") {
                        webxrFeatures = "webxr=\x22requiredFeatures: hit-test, local-floor;\x22"; //otherwise hit-test breaks everythign!
                        arHitTest = "ar-hit-test=\x22mode: "+arMode+"\x22";
                        arShadowPlane = "<a-plane show-in-ar-mode visible=\x22false\x22 height=\x22200\x22 width=\x22200\x22 rotation=\x22-90 0 0\x22 repeat=\x22200 200\x22 shadow=\x22receive:true\x22 ar-shadows=\x22opacity: 0.3\x22 static-body=\x22shape: none\x22 shape__main=\x22shape: box; halfExtents: 100 100 0.125; offset: 0 0 -0.125\x22>" +
                        "</a-plane>";
                    }
                    let handsTemplate = "<template id=\x22hand-template\x22><a-entity><a-box scale=\x220.1 0.1 0.1\x22 visible=false></a-box></a-entity></template>";
                    // console.log("skySettings " + skySettings);
                    // webxr=\x22requiredFeatures: hit-test,local-floor;\x22 
                    let aframeRenderSettings = "renderer=\x22antialias: true; colorManagement: true; sortObjects: true; physicallyCorrectLights: true; alpha: true; maxCanvasWidth: 1920; maxCanvasHeight: 1920;\x22";
                    if (sceneData.sceneType == "BabylonJS") {
                        let uwfx_shader = requireText('./babylon/uwfx_shader.txt', require);
                        let uwfx_scene = requireText('./babylon/uwfx_scene.txt', require);
                        let uwfx_assets = requireText('./babylon/uwfx_assets.txt', require);
                       
                        console.log("skyboxUrl" + skyboxUrl);
                        htmltext = "<!DOCTYPE html>\n" +
                        "<head> " +
                        googleAnalytics +
                        "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                        "<meta charset='utf-8'/>" +
                        "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                        "<meta property='og:url' content='" + rootHost + "/webxr/" + sceneResponse.short_id + "' /> " +
                        "<meta property='og:type' content='website' /> " +
                        // "<meta property='og:image' content='" + postcard1 + "' /> " +
                        "<meta property='og:image' content='http://" + postcard1 + "' /> " +
                        "<meta property='og:image:height' content='1024' /> " +
                        "<meta property='og:image:width' content='1024' /> " +
                        "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                        "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                        "<meta name=\x22monetization\x22 content=\x22$ilp.uphold.com/EMJQj4qKRxdF\x22>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                            "<style>\n" +
                                "html, body {\n" +
                                    "overflow: hidden;\n" +
                                    "width: 100%;\n" +
                                    "height: 100%;\n" +
                                    "margin: 0;\n" +
                                    "padding: 0;\n" +
                                "}\n" +
                                "#renderCanvas {\n" +
                                    "width: 100%;\n" +
                                    "height: 100%;\n" +
                                    "touch-action: none;\n" +
                                "}\n" +
                            "</style>\n" +
                            "<script src=\x22https://preview.babylonjs.com/babylon.js\x22></script>\n" +
                            "<script src=\x22https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js\x22></script>\n" +
                            "<script src=\x22https://code.jquery.com/pep/0.4.3/pep.js\x22></script>\n" +
                        "</head>\n" +
                        "<body>\n" +
                            "<canvas id=\x22renderCanvas\x22 touch-action=\x22none\x22></canvas>\n" + 
                            "<script>\n" +
                                "var canvas = document.getElementById(\x22renderCanvas\x22);\n" + // Get the canvas element
                                "var engine = new BABYLON.Engine(canvas, true);\n" + // Generate the BABYLON 3D engine
                                "var cubetex = null;"+
                                uwfx_shader +
                                /******* Add the create scene function ******/
                                "var createScene = function () {\n" +
                                    uwfx_scene +
                                    "let eqTexture = new BABYLON.CubeTexture('', scene, undefined, undefined, "+JSON.stringify( cubeMapAsset)+");" +
                                    "scene.environmentTexture = eqTexture;\n"+
                                    // "scene.environmentTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;\n"+
                                    "scene.createDefaultSkybox(scene.environmentTexture);\n"+
                                    "var hlight = new BABYLON.DirectionalLight(\x22dLight\x22, new BABYLON.Vector3(-1, 1, 0), scene);\n" +
                                    "hlight.diffuse = new BABYLON.Color3(.5, 0, 0);\n" +
                                    "hlight.specular = new BABYLON.Color3(0, .6, 0);\n" +
                                    "var sphere = BABYLON.MeshBuilder.CreateSphere(\x22sphere\x22, {diameter:3}, scene);\n" +

                                    "var glass = new BABYLON.PBRMaterial('glass', scene);\n"+
                                    // "glass.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;\n" +
                                    "glass.diffuseColor = new BABYLON.Color3(0, 0, 0);\n" +
                                    "glass.specularColor = new BABYLON.Color3(0, 0, 0);\n" +
                                    // "glass.reflectionTexture = eqTexture;\n"+
                                    // "glass.refractionTexture = eqTexture;\n"+
                                    // "glass.linkRefractionWithTransparency = true;\n"+
                                    // "glass.indexOfRefraction = 0.52;\n"+
                                    // "glass.alpha = 0;\n"+
                                    // "glass.microSurface = 1;\n"+
                                    // "glass.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);\n"+
                                    // "glass.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.85);\n"+
                                    "sphere.material = glass;\n"+
                                    "sphere.position.x = 3;\n" +
                                    "sphere.position.y = 3;\n" +
                                    uwfx_assets +
                                    gltfsAssets +
                                    "return scene;\n" +
                                "};\n" +
                                /******* End of the create scene function ******/
                                "var scene = createScene(); //Call the createScene function\n" +
                                // Register a render loop to repeatedly render the scene
                                "engine.runRenderLoop(function () {\n" +
                                "scene.render();\n" +
                                "});\n" +

                                // Watch for browser/canvas resize events
                                "window.addEventListener(\x22resize\x22, function () {\n" +
                                "engine.resize();\n" +
                                "});\n" +
                            "</script>\n" +
                        "</body>\n" +
                        "</html>";
                    } else if (sceneData.sceneType == "ThreeJS") {
                        //THREEJS ONLY FOR FACETRACKING // uses https://github.com/jeeliz/jeelizFaceFilter
                        if (sceneResponse.sceneFaceTracking) {
                            // console.log("gltfsAssets: "+ gltfsAssets);
                            let offx = 0;
                            let offy = 0;
                            let scale = 0;
                            offx = parseFloat(gltfsAssets.offsetX);
                            offy = parseFloat(gltfsAssets.offsetY);
                            scale = parseFloat(gltfsAssets.scale);
                            htmltext = "<html xmlns='http://www.w3.org/1999/xhtml'>" +
                            "<head> " +
                            googleAnalytics +
                            "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                            "<meta charset='utf-8'/>" +
                            "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                            "<meta property='og:url' content='" + rootHost + "/webxr/" + sceneResponse.short_id + "' /> " +
                            "<meta property='og:type' content='website' /> " +
                            // "<meta property='og:image' content='" + postcard1 + "' /> " +
                            "<meta property='og:image' content='http://" + postcard1 + "' /> " +
                            "<meta property='og:image:height' content='1024' /> " +
                            "<meta property='og:image:width' content='1024' /> " +
                            "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                            "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                            "<title>" + sceneResponse.sceneTitle + "</title>" +
                            "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                            "<meta name=\x22monetization\x22 content=\x22$ilp.uphold.com/EMJQj4qKRxdF\x22>" +
                            "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                            "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                                "<script src=\x22/dash/src/util/face/jeelizFaceFilter.js\x22></script>\n" +
                                "<script src=\x22/dash/src/util/face/three.js\x22></script>\n" +
                                "<script src=\x22/dash/src/util/face/GLTFLoader.js\x22></script>\n" +
                                "<script src=\x22/dash/src/util/face/JeelizResizer.js\x22></script>\n" +
                                "<script src=\x22/dash/src/util/face/JeelizThreejsHelper.js\x22></script>\n" +
                                "<script>\n" +
                                // "const SETTINGS = \n" + JSON.stringify(SETTINGS) + ";\n" +    
                                "\x22use strict\x22;\n" +
                                "const SETTINGS = {\n" +
                                    "gltfModelURL: \x22"+gltfsAssets.modelURL+"\x22,\n"+ 
                                    "cubeMapURL: 'path',\n" +
                                    "offsetYZ: ["+offx+","+offy+"],\n" + // offset of the model in 3D along vertical and depth axis
                                    "scale: "+scale+"\n" + // width in 3D of the GLTF model
                                    // "offsetYZ: [0,0],\n" + // offset of the model in 3D along vertical and depth axis
                                    // "scale: 2\n" + // width in 3D of the GLTF model
                                "};\n" +
                                "let THREECAMERA = null;"+
                                "function init_threeScene(spec){"+
                                "const threeStuffs = THREE.JeelizHelper.init(spec, null);"+
                                "const envMap = new THREE.CubeTextureLoader().load(\n" + JSON.stringify(cubeMapAsset) + ");\n" + //1d array
                                "var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );\n" +
                                "const gltfLoader = new THREE.GLTFLoader();\n" +
                                "gltfLoader.load( SETTINGS.gltfModelURL, function ( gltf ) {\n" +
                                "gltf.scene.traverse( function ( child ) {\n" +
                                    "if ( child.isMesh ) {\n" +
                                    " child.material.envMap = envMap;\n" +
                                    "}\n" +
                                    "} );\n" +
                                    "gltf.scene.frustumCulled = false;\n" +
                                    "let mixer = new THREE.AnimationMixer(gltf.scene);\n" +
                                    // "gltf.animations.forEach((clip) => {\n" +
                                        "mixer.clipAction(gltf.animations[0]).play();\n" +
                                    // "});\n" +
                                    "const bbox = new THREE.Box3().expandByObject(gltf.scene);\n" +
                                "threeStuffs.scene.add( directionalLight );\n" +
                                "threeStuffs.scene.add(directionalLight.target);\n" +
                                "const centerBBox = bbox.getCenter(new THREE.Vector3());\n" +
                                "gltf.scene.position.add(centerBBox.multiplyScalar(-1));\n" +
                                "gltf.scene.position.add(new THREE.Vector3(0,SETTINGS.offsetYZ[0], SETTINGS.offsetYZ[1]));\n" +
                                "const sizeX = bbox.getSize(new THREE.Vector3()).x;\n" +
                                "gltf.scene.scale.multiplyScalar(SETTINGS.scale / sizeX);\n" +
                                "threeStuffs.faceObject.add(gltf.scene);\n" +
                                //   "var texture = new THREE.TextureLoader().load(\x22face2.jpg\x22);\n" +  //TEXTURE SWAP HERE
                                //   "texture.encoding = THREE.sRGBEncoding; \n" +
                                //   "texture.flipY = true; \n" +
                                //   "var material = new THREE.MeshBasicMaterial( { map: texture } ); \n" +
                                //   "threeStuffs.faceObject.traverse(node => {\n" +
                                //     "node.material = material;\n" +         
                                //       "});\n" +
                                "directionalLight.target = threeStuffs.faceObject;\n" +
                            
                                "} );\n" +

                                "THREECAMERA = THREE.JeelizHelper.create_camera();\n" +
                                "} \n" +
                                "function main(){\n" +
                                    "JeelizResizer.size_canvas({\n" +
                                        "canvasId: 'jeeFaceFilterCanvas',\n" +
                                    "isFullScreen: true,\n" +
                                    "callback: start,\n" +
                                    "onResize: function(){\n" +
                                        "THREE.JeelizHelper.update_camera(THREECAMERA);\n" +
                                        "}\n" +
                                    "})\n" +
                                    "}\n" +
                                "function start(){\n" +
                                "JEEFACEFILTERAPI.init({ \n" +
                                    "videoSettings:{\n" + // increase the default video resolution since we are in full screen"
                                    "'idealWidth': 1280,\n" +  // ideal video width in pixels
                                    "'idealHeight': 800,\n" +  // ideal video height in pixels
                                    "'maxWidth': 1920,\n" +    // max video width in pixels
                                    "'maxHeight': 1920\n" +    // max video height in pixels
                                    "},\n" +
                                "followZRot: true,\n" +
                                "canvasId: 'jeeFaceFilterCanvas',\n" +
                                "NNCpath: '/dash/src/util/face/',\n" + //root of NNC.json file
                                "callbackReady: function(errCode, spec){\n" +
                                    "if (errCode){\n" +
                                        "console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);\n" +
                                    "return;\n" +
                                    "}\n" +
                            
                                    "console.log('INFO: JEEFACEFILTERAPI IS READY');\n" +
                                    "init_threeScene(spec);\n" +
                                    "},\n" +
                                "callbackTrack: function(detectState){\n" +
                                    "THREE.JeelizHelper.render(detectState, THREECAMERA);\n" +
                                    "}\n" +
                                "});\n" + //end JEEFACEFILTERAPI.init call
                                "}\n" + //end start()
                                primaryAudioScript +
                                "</script>" + 
                                "<link rel=\x22stylesheet\x22 href=\x22/dash/src/util/face/styleFullScreen.css\x22 type=\x22text/css\x22 />" +
                                "</head>" +
                            
                                "<body onload=\x22main()\x22 style='color: white'>" +
                                "<canvas width=\x22600\x22 height=\x22600\x22 id='jeeFaceFilterCanvas'></canvas>" +
                                "</body>" +
                                "</html>";
                            } else {
                                sceneAssets = "\n"+
                                "loader.load(\n"+ //icons and gui stuff for inclusion in threejs below
                                "\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5b.glb\x22,"+ //landscape panel
                                "function ( gltf ) {\n"+
                                    // "scene.add( gltf.scene );\n"+
                                    "if (!gltf.scene) return;\n" +
                                    // "var texture = new THREE.TextureLoader().load(ref.src);\n"+
                                    "texture.encoding = THREE.sRGBEncoding;\n"+
                                    "gltf.scene.traverse(function (node) {\n" +
                                        "if (node.material && 'envMap' in node.material) {\n" +
                                        "node.material.envMap = envMap;\n" +
                                        "node.material.envMap.intensity = 1;\n" +
                                        "node.material.needsUpdate = true;\n" +
                                        "}\n" +
                                    "});\n" +
                                    "landscapePanel = gltf.scene;\n"+
                                "},\n"+
                                "function ( xhr ) {\n"+
                                    "console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );\n"+
                                    "},\n"+
                                "function ( error ) {\n"+
                                    "console.log( 'An error happened' );\n"+
                                    "}\n"+
                                ");\n";
                                
                                htmltext = "<html xmlns='http://www.w3.org/1999/xhtml'>" + //this will be the response
                                "<head> " +
                                googleAnalytics +
                                "<link rel=\x22icon\x22 href=\x22data:,\x22></link>\n"+
                                "<meta charset='utf-8'/>\n" +
                                "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>\n" +
                                "<meta property='og:url' content='" + rootHost + "/webxr/" + sceneResponse.short_id + "' /> \n" +
                                "<meta property='og:type' content='website' /> \n" +
                                // "<meta property='og:image' content='" + postcard1 + "' /> " +
                                "<meta property='og:image' content='http://" + postcard1 + "' /> \n" +
                                "<meta property='og:image:height' content='1024' /> \n" +
                                "<meta property='og:image:width' content='1024' /> \n" +
                                "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' />\n " +
                                "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> \n" +
                                "<title>" + sceneResponse.sceneTitle + "</title>\n" +
                                "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>\n" +
                                "<meta name=\x22monetization\x22 content=\x22$ilp.uphold.com/EMJQj4qKRxdF\x22>\n" +
                                "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>\n" +
                                "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>\n" +    
                                // "<script src=\x22/three/three.js\x22></script>\n" +
                                // "<script src=\x22/three/GLTFLoader.js\x22></script>\n" +
                                "<style>" +
                                    "body { margin: 0; }" +
                                    "canvas { display: block; }" +
                                    "</style>\n" +
                                    "</head>\n" +
                                "<body>\n" +
                                
                                "<script type=\x22module\x22>" + //threejs script below

                                "import * as THREE from '/three/build/three.module.js';\n"+ //oooh, modular!
                                "import { VRButton } from '/three/examples/jsm/webxr/VRButton.js';\n"+
                                "import { OrbitControls } from '/three/examples/jsm/controls/OrbitControls.js';\n"+
                                "import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';\n"+
                                "import ShadowedLight from '/three/examples/jsm/utils/ShadowedLight.js';\n"+
                                "import VRControl from '/three/examples/jsm/utils/VRControl.js';\n"+
                                "import TWEEN from '/three/dist/tween.esm.js';\n"+
                                "import * as ThreeMeshUI from '/three/three-mesh-ui/three-mesh-ui.js';\n"+


                                "var mouse = new THREE.Vector2(), INTERSECTED;\n"+
                                "mouse.x = mouse.y = null;\n"+
                                "let selectState = false;\n"+
                                "var container, controls, mesh, intersects;\n"+
                                "var camera, scene, vrControl, raycaster, renderer;\n"+
                                "var landscapePanel, keyButton, cameraButton, nextButton, previousButton;\n"+
                                "var primaryAudio, primaryAudioStatus, primaryAudioStatusText, primaryAudioCurrentTime, primaryAudioPanel, availableScenesObject, availableScenesPanel, pictureGroupPanel;\n"+
                                
                                "init();\n"+
                                "animate();\n"+
                                "function init() {\n"+
                                    "container = document.createElement( 'div' );\n"+
                                    "raycaster = new THREE.Raycaster();\n"+
                                    
                                    "document.body.appendChild( container );\n"+
                                    "document.body.appendChild(VRButton.createButton(renderer));\n"+
                                    "camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );\n"+
                                    "camera.position.set( - 1.8, 0.6, 2.7 );\n"+
                                    "scene = new THREE.Scene();\n"+
                                    "const envMap = new THREE.CubeTextureLoader().load(\n" + JSON.stringify(cubeMapAsset) + ");\n" + //1d array
                                    "scene.background = envMap;\n"+
                                    // "var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );\n" +
                                    // "scene.add(directionalLight);\n"+
                                    // "var ambientLight = new THREE.AmbientLight( 0x404040 );\n"+ // soft white light
                                    "const light = ShadowedLight({\n"+
                                        "z: 10,\n"+
                                        "width: 6,\n"+
                                        "bias: -0.0001\n"+
                                    "});\n"+
                                    "const hemLight = new THREE.HemisphereLight( 0x808080, 0x606060 );\n"+
                                    "scene.add( light, hemLight );\n"+
                                    // "scene.add( ambientLight );\n"+
                                    // "directionalLight.position.set(.5,.8,0);\n"+ `

                                    "window.addEventListener( 'mousemove', onMouseMove, false );\n"+
                                    "window.addEventListener( 'mousedown', onMouseDown, false );\n"+
                                    "renderer = new THREE.WebGLRenderer( { antialias: true } );\n"+
                                    "renderer.setPixelRatio( window.devicePixelRatio );\n"+
                                    "renderer.setSize( window.innerWidth, window.innerHeight );\n"+
                                    "renderer.xr.enabled = true;\n" +
                                    "vrControl = VRControl( renderer, camera, scene );\n"+
                                    "scene.add( vrControl.controllerGrips[ 0 ], vrControl.controllers[ 0 ] );\n"+
                                    "vrControl.controllers[ 0 ].addEventListener( 'selectstart', ()=> { selectState = true } );\n"+
                                    "vrControl.controllers[ 0 ].addEventListener( 'selectend', ()=> { selectState = false } );\n"+
                                    "var loader = new GLTFLoader();\n"+
                                    gltfsAssets +
                                    // sceneAssets +
                                    "container.appendChild( renderer.domElement );\n"+
                                    "controls = new OrbitControls( camera, renderer.domElement );\n"+
                                    "controls.addEventListener( 'change', render ); \n"+// use if there is no animation loop
                                    "controls.minDistance = 2;\n"+
                                    "controls.maxDistance = 10;\n"+
                                    "controls.target.set( 0, 0, - 0.2 );\n"+
                                    "controls.update();\n"+
                                    "requestAnimationFrame(render);\n"+
                                    "window.addEventListener( 'resize', onWindowResize, false );\n"+
                                    "availableScenesObject = " + JSON.stringify(availableScenesResponse) + ";\n"+
                                    "MakePrimaryAudioPanel();\n"+
                                    "MakeAvailableScenesPanel();\n"+
                                "}\n"+
                                primaryAudioScript +
                                "function animate() {\n"+
                                    "requestAnimationFrame( animate );\n"+
                                    "render();\n"+
                                "}" +
                                "function onWindowResize() {\n"+
                                    "camera.aspect = window.innerWidth / window.innerHeight;\n"+
                                    "camera.updateProjectionMatrix();\n"+
                                    "renderer.setSize( window.innerWidth, window.innerHeight );\n"+
                                    "render();\n"+
                                "}\n"+
                                "window.addEventListener( 'touchstart', ( event )=> {\n"+
                                    "selectState = true;\n"+
                                    "mouse.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;\n"+
                                    "mouse.y = - ( event.touches[0].clientY / window.innerHeight ) * 2 + 1;\n"+
                                "});\n"+
                                
                                "window.addEventListener( 'touchend', ()=> {\n"+
                                    "selectState = false;\n"+
                                    "mouse.x = null;\n"+
                                    "mouse.y = null;\n"+
                                "});\n"+
                                "function onMouseMove( event ) {\n"+
                                    // calculate mouse position in normalized device coordinates
                                    // (-1 to +1) for both components
                                    "mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;\n"+
                                    "mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;\n"+
                                "}\n"+
                                "function onMouseDown( event ) {\n"+
                                    "if ( intersects.length > 0 ) {\n"+
                                        "if (intersects[0].object.userData.name == \x22primaryAudioMesh\x22) {\n"+
                                            "console.log(intersects[0].object.userData.name);\n"+
                                            "if (!primaryAudio.isPlaying) {\n"+
                                                "primaryAudio.play();\n"+
                                                "console.log('playing primary audio');\n"+
                                                "primaryAudioMesh.material.color = new THREE.Color( 'blue' );\n"+
                                                "primaryAudioStatusText.set({content: \x22playing\x22, fontColor: new THREE.Color( 'blue' )});\n"+
                                            "} else {\n"+
                                                "primaryAudio.pause();\n"+
                                                "console.log('pausing primary audio');\n"+
                                                "primaryAudioMesh.material.color = new THREE.Color( 'yellow' );\n"+
                                                "primaryAudioStatusText.set({content: \x22paused\x22, fontColor: new THREE.Color( 'yellow' )});\n"+
                                            "}\n"+
                                        "}\n"+
                                        "if (intersects[0].object.userData.name == \x22key\x22) {\n"+
                                            "console.log(intersects[0].object.userData.name);\n"+
                                            "availableScenesPanel.visible = true;\n"+
                                        "}\n"+
                                    "}\n"+
                                "}\n"+
                                "function MakeAvailableScenesPanel() {\n"+
                                    "console.log('tryna make availablescenes panel');\n"+
                                    "var loader = new GLTFLoader();\n"+
                                    "loader.load(\n"+
                                    "\x22https://servicemedia.s3.amazonaws.com/assets/models/key.glb\x22,"+ //landscape panel
                                    "function ( gltf ) {\n"+
                                        "if (!gltf.scene) return;\n" +
                                        // "texture.encoding = THREE.sRGBEncoding;\n"+
                                        "gltf.scene.traverse(function (node) {\n" +
                                            "if (node.material && 'envMap' in node.material) {\n" +
                                            "node.material.envMap = envMap;\n" +
                                            "node.material.envMap.intensity = 1;\n" +
                                            "node.material.needsUpdate = true;\n" +
                                            "}\n" +
                                        "});\n" +
                                        "console.log('gotsa key icon');\n"+
                                        "keyButton = gltf.scene;\n"+
                                        "scene.add(keyButton);\n"+
                                        "keyButton.userData.name = \x22key\x22;\n"+
                                        "availableScenesPanel = new ThreeMeshUI.Block({\n"+
                                            "width: 3,\n"+
                                            "height: 3,\n"+
                                            "padding: 0.05,\n"+
                                            "justifyContent: 'center',\n"+
                                            "alignContent: 'center',\n"+
                                            "fontFamily: \x22/three/assets/Roboto-msdf.json\x22,\n"+
                                            "fontTexture: \x22/three/assets/Roboto-msdf.png\x22"+
                                        "});\n"+
                                        "availableScenesPanel.position.set( -8, 1, 1 );\n"+
                                        "availableScenesPanel.rotation.x = -0.55;\n"+
                                        "scene.add(availableScenesPanel);\n"+
                                        "keyButton.position = availableScenesPanel.position;\n"+
                                        "const sceneDetails = new ThreeMeshUI.Block({\n"+
                                            "width: 3,\n"+
                                            "height: 1,\n"+
                                            "padding: 0.05,\n"+
                                            "justifyContent: 'center',\n"+
                                            "alignContent: 'left',\n"+
                                        "});\n"+
                                        "sceneDetails.add(\n"+
                                            "new ThreeMeshUI.Text({\n"+
                                            "content: 'Scene Title: ' + availableScenesObject.availableScenes[0].sceneTitle,\n"+ //local var 
                                            "fontSize: 0.10"+
                                        "}));\n"+
                                        "const scenePics = new ThreeMeshUI.Block({\n"+
                                            "width: 3,\n"+
                                            "height: 2,\n"+
                                            "padding: 0.05,\n"+
                                            "justifyContent: 'center',\n"+
                                            "alignContent: 'left',\n"+
                                        "});\n"+
                                        // "scenePics.add(\n"+
                                            "const loader = new THREE.TextureLoader();\n"+
                                            "loader.load( availableScenesObject.availableScenes[0].scenePostcardHalf, (texture)=> {\n"+
                                                "scenePics.set({ backgroundTexture: texture });\n"+
                                            "});\n"+
                                        // "}));\n"+
                                        "availableScenesPanel.add(scenePics, sceneDetails)\n"+
                                        "availableScenesPanel.lookAt(camera.position);\n"+

                                    "},\n"+
                                    "function ( xhr ) {\n"+
                                        "console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );\n"+
                                        "},\n"+
                                    "function ( error ) {\n"+
                                        "console.log( 'An error happened' );\n"+
                                        "}\n"+
                                    ");\n"+
                                   
                                "};\n"+
                                "function MakePrimaryAudioPanel() {\n"+
                                    "console.log('tryna make a panel');"+
                                    "primaryAudioPanel = new ThreeMeshUI.Block({\n"+
                                        "width: 1.5,\n"+
                                        "height: 0.5,\n"+
                                        "padding: 0.05,\n"+
                                        "justifyContent: 'center',\n"+
                                        "alignContent: 'left',\n"+
                                        "fontFamily: \x22/three/assets/Roboto-msdf.json\x22,\n"+
                                        "fontTexture: \x22/three/assets/Roboto-msdf.png\x22"+
                                    "});\n"+
                                    "primaryAudioPanel.position.set( 2, 1, 1 );\n"+
                                    "primaryAudioPanel.rotation.x = -0.55;\n"+
                                    "scene.add( primaryAudioPanel );\n"+
                                    "primaryAudioStatus = \x22loading...\x22;\n"+
                                    // "primaryAudioStatusText;\n"+
                                    "const title = new ThreeMeshUI.Block({\n"+
                                        "width: 1.4,\n"+
                                        "height: 0.2,\n"+
                                    "});\n"+
                                    "title.add(\n"+
                                        "new ThreeMeshUI.Text({\n"+
                                        "content: \x22"+primaryAudioTitle+"\x22,\n"+
                                        "fontSize: 0.10"+
                                    "}));\n"+
                                    "const status = new ThreeMeshUI.Block({\n"+
                                        "width: 1.4,\n"+
                                        "height: 0.2,\n"+
                                    "});\n"+
                                    "status.add(\n"+
                                        "primaryAudioStatusText = new ThreeMeshUI.Text({\n"+
                                        "content: primaryAudioStatus,\n"+
                                        "fontSize: 0.10"+
                                    "}));\n"+
                                    "primaryAudioPanel.add(title, status)\n"+
                                    "primaryAudioPanel.lookAt(camera.position);\n"+
                                "};\n"+
                                
                                "function render() {\n"+
                                    // "if (renderer != undefined)"+
                                    
                                    "renderer.render( scene, camera );\n"+
                                    "raycaster.setFromCamera( mouse, camera );\n"+
                                    "intersects = raycaster.intersectObjects( scene.children );\n"+
                                    "if ( intersects.length > 0 ) {\n"+
                                        "if ( INTERSECTED != intersects[ 0 ].object ) {\n"+
                                            "if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );\n"+
                                            "INTERSECTED = intersects[ 0 ].object;\n"+
                                            "INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();\n"+
                                            "INTERSECTED.material.emissive.setHex( 0xff0000 );\n"+
                                            // "console.log(intersects[0].object.userData.name);\n"+
                                        "}\n"+
                                    "} else {\n"+
                                        "if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );\n"+
                                        "INTERSECTED = null;\n"+
                                    "}\n"+
                                    "if (primaryAudioPanel) {\n"+ 
                                        "primaryAudioPanel.lookAt(camera.position);\n"+
                                        "if (primaryAudio && primaryAudio.isPlaying) {\n"+
                                            // "primaryAudioStatusText.set({content: \x22Playing\x22});"+
                                            // "ThreeMeshUI.update();\n"+
                                            // "console.log('really playing primary audio');\n"+
                                        "} else {\n"+
                                            // "primaryAudioStatusText.set({content: \x22Paused\x22});\n"+
                                        "}\n"+
                                    "}\n"+
                                    "if (availableScenesPanel) {\n"+ 
                                        "availableScenesPanel.lookAt(camera.position);\n"+
                                    "}\n"+
                                    "ThreeMeshUI.update();\n"+
                                "}\n"+
                                "</script>" +
                                "</body>" +
                                "</html>";                      
                            }
                            // res.send(facetrackingResponse);
                            // callback(null);
                        // } 
                    } else { //AFrame response below
                    htmltext = "<html xmlns='http://www.w3.org/1999/xhtml'>" +
                        "<head> " +
                        googleAnalytics +
                        "<link rel=\x22icon\x22 href=\x22data:,\x22></link>"+
                        "<meta charset='utf-8'/>" +
                        "<meta name='viewport' content='width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no'/>" +
                        "<meta property='og:url' content='" + rootHost + "/webxr/" + sceneResponse.short_id + "' /> " +
                        "<meta property='og:type' content='website' /> " +
                        // "<meta property='og:image' content='" + postcard1 + "' /> " +
                        "<meta property='og:image' content='http://" + postcard1 + "' /> " +
                        "<meta property='og:image:height' content='1024' /> " +
                        "<meta property='og:image:width' content='1024' /> " +
                        "<meta property='og:title' content='" + sceneResponse.sceneTitle + "' /> " +
                        "<meta property='og:description' content='" + sceneResponse.sceneDescription + "' /> " +
                        "<title>" + sceneResponse.sceneTitle + "</title>" +
                        "<meta name='description' content='" + sceneResponse.sceneDescription + "'/>" +
                        "<meta name=\x22monetization\x22 content=\x22$ilp.uphold.com/EMJQj4qKRxdF\x22>" +
                        "<meta name=\x22mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<meta name=\x22apple-mobile-web-app-capable\x22 content=\x22yes\x22>" +
                        "<link href=\x22../dash/vendor/fontawesome-free/css/all.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        // "<link href=\x22/css/webxr.css\x22 rel=\x22stylesheet\x22 type=\x22text/css\x22>" +
                        // "<meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />" +
                        // "<meta name='apple-mobile-web-app-status-bar-style' content='black'>" +
                        // "<meta name='robots' content='index,follow'/>" +
                        // "<script src='../dist/compat.js'></script>" +
    //                    "<script src='../dist/unlockaudio.js'></script>" +
                        // "<script src=\x22../dash/ref/aframe/dist/socket.io.slim.js\x22></script>" +
                        "<script src=\x22../dash/vendor/howler/src/howler.core.js\x22></script>"+
                        "<script src=\x22../dash/vendor/howler/src/howler.spatial.js\x22></script>"+
                        "<script src=\x22../dash/ref/aframe/dist/socket.io.slim.js\x22></script>" +
                        // "<script src=\x22../dash/ref/aframe/dist/aframe-v1.0.4.min.js\x22></script>" +
                        // "<script src=\x22https://github.com/aframevr/aframe/blob/master/dist/aframe-master.js\x22></script>" +
                        // https://github.com/aframevr/aframe/blob/master/dist/aframe-master.js
                        "<script src=\x22../dash/ref/aframe/dist/aframe-master.js\x22></script>" +
                        "<script src=\x22../dash/ref/aframe/dist/networked-aframe.min.js\x22></script>" + 
                        "<script src=\x22../dash/ref/aframe/dist/aframe-layout-component.min.js\x22></script>" +  
                        // "<script src=\x22../dash/ref/aframe/dist/aframe-physics-system.min.js\x22></script>" +  
                    
                        "<script src=\x22../dash/ref/aframe/dist/aframe-randomizer-components.min.js\x22></script>" +
                        "<script src=\x22../dash/vendor/aframe/aframe-environment-component.min.js\x22></script>"+
                    
                        joystickScript +
                        // "<script src=\x22../dash/vendor/aframe/gamepad-controls.js\x22></script>"+
                        "<script src=\x22../dash/vendor/aframe/aframe-look-at-component.min.js\x22></script>"+
                        "<script src=\x22../dash/vendor/aframe/aframe-teleport-controls.min.js\x22></script>"+

                        "<script src=\x22../dash/vendor/aframe/aframe-entity-generator-component.min.js\x22></script>"+
                        // "<script src=\x22../dash/vendor/aframe/aframe-text-geometry-component.min.js\x22></script>"+
                        primaryAudioScript +
                        ambientAudioScript +
                        // skyGradientScript +
                        ARScript +
                        // cameraEnvMap +
                        contentUtils +
                        audioVizScript +
                        "<script src=\x22../dash/vendor/trackedlibs/aabb-collider.js\x22></script>"+
                        "<script src=\x22../dash/src/shaders/noise.js\x22></script>"+
                        "<script src=\x22../dash/vendor/aframe/animation-mixer.js\x22></script>"+
                        "<script src=\x22../dash/vendor/trackedlibs/grab.js\x22></script>"+     

                        "<script src=\x22../dash/src/component/mod-materials.js\x22></script>"+
                        "<script src=\x22../dash/src/component/ar-utils.js\x22></script>"+
                        "<script src=\x22../dash/src/component/spawn-in-circle.js\x22></script>"+
                        // convertEquirectToCubemap +
                        // "<script data-ad-client=\x22ca-pub-5450402133525063\x22 async src=\x22https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\x22></script>"+
                        "</head>" +
                        "<body bgcolor='black'>" +
                        "<div style=\x22width:100%; height:100%\x22>"+
                        "<div class=\x22primaryAudioParams\x22 id="+streamPrimaryAudio+ "_" +oggurl+"></div>"+
                        "<div class=\x22ambientAudioParams\x22 id="+ambientUrl+"></div>"+
                        // "<div class=\x22attributionParams\x22 id="+JSON.stringify(attributions)+"></div>"+
                        "<div class=\x22avatarName\x22 id="+avatarName+"></div>"+
                        primaryAudioControl +
                        ambientAudioControl +
                        "<script> function screenCap() {console.log(\x22tryna screenCap()\x22); document.querySelector('a-scene').components.screenshot.capture('perspective')};"+    
                        "</script>"+
                        ARLocScript +
                        // "<script src=\x22../dash/src/component/naf-utils.js\x22></script>"+
                        // "<a-scene loading-screen=\x22dotsColor: white; backgroundColor: black\x22 joystick embedded" + fogSettings + " " + ARSceneArg + ">" +
                        // webxr=\x22requiredFeatures: hit-test,local-floor;\x22 needed bvelow?
                        "<a-scene "+webxrFeatures+" shadow=\x22type: pcfsoft\x22 loading-screen=\x22dotsColor: white; backgroundColor: black\x22 joystick embedded " + aframeRenderSettings + " " + fogSettings + " "+networkedscene+" "+ARSceneArg+">" +
                        // skySettings +
                        aframeEnvironment +
                        ambientLight + 
                        camera +
                        ARMarker +
                        ocean +
                        // ground +
                        // skyParticles +
                        skySettings +
                        "<a-assets>" +
                        playerAvatarTemplate +
                        handsTemplate + 
                        // "<img id=\x22landscapeMask\x22 crossorigin='anonymous' src=\x22https://realitymangler.com/assets/landscapeMask.png\x22>"+
                        // "<a-asset-item id=\x22optimerBoldFont\x22 src=\x22https://rawgit.com/mrdoob/three.js/dev/examples/fonts/optimer_bold.typeface.json\x22></a-asset-item>" +
                        // "<img id=\x22primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 src=\x22"+primaryAudioWaveform+"\x22>"+
                        pAudioWaveform +
                    
                        // "<img id='next' src='../assets/glyphs/next.png'>" +
                        // "<img id='prev' src='../assets/glyphs/prev.png'>" +
                        // "<img id='pause' src='../assets/glyphs/pause.png'>" +
                        // "<img id='play' src='../assets/glyphs/play.png'>" +
    //                     "<a-circle src='#smimage1' radius='50' rotation='-90 0 0'></a-circle>"+
                        // "<a-asset-item id=\x225sided\x22  src=\x22" + gltfUrl + "\x22 crossorigin=\x22anonymous\x22></a-asset-item>" +
                        // "<a-asset><img id=\x22sky\x22 src=\x22" + skyboxUrl +"\x22>></a-asset>" +
                        "<a-asset-item id=\x22avatar_model\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/player1.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22landscape_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5b.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22portrait_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panel5c.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22square_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelsquare1.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22circle_panel\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/panelcircle1.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22exclamation\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/exclamation.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22previous_button\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/previous.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22next_button\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/next.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22filmcam\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/filmcam1.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22groupicon\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/groupicon.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22mailbox\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/mailbox.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22links\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/links.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22roundcube\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/roundcube.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22key\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/key.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22camera_icon\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/camera_icon.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22talkbubble\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/talkbubble1.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22thoughtbubble\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/thoughtbubble1.glb\x22></a-asset-item>"+
                        // "<a-asset-item id=\x22key\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/key.glb\x22></a-asset-item>"+
                        "<a-asset-item id=\x22reticle2\x22 response-type=\x22arraybuffer\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/reticle2.glb\x22></a-asset-item>"+
                        videosphereAsset +
                        // videoAsset + 
                        imageAssets +
                        // "<audio id=\x22song\x22 crossorigin " + loopable + " autoload src=\x22" + mp3url + "\x22></audio>" +
                        gltfsAssets +
                        videoAsset +
                        grabMix +
                        skyboxAsset +
                        cubeMapAsset +
                        // assets +
                        // targetObjectAsset +
                        "</a-assets>" +
                        
                        gltfsEntities + 
                        "<a-entity position='0 3.5 0' rotation='270 0 0' layout=\x22type: circle; radius: 25\x22>" +
                            imageEntities +
                        "</a-entity>" + //end of layout
        //                    targetObjectEntity +
                        videoEntity +
                        mainTextEntity +
                        attributionsTextEntity +
                        availableScenesEntity +
                        pictureGroupsEntity +

                        networkingEntity +
                        locationEntity +
                        primaryAudioEntity +
                        ambientAudioEntity + 
                        lightEntities +
                        placeholderEntities +
                        "<a-entity show-in-ar-mode visible=\x22false\x22 id=\x22reticleEntity\x22 gltf-model=\x22#reticle2\x22 scale=\x220.8 0.8 0.8\x22 "+arHitTest+"></a-entity>" +
                        arShadowPlane +
                        hemiLight +
                        shadowLight +
                        "</a-scene>" +
                        "</div>" +
                        "<style>" +
                        "a{ color:#fff;"+
                        "text-decoration:none;"+
                        "}"+
                        ".footer {"+
                        "position: fixed;"+
                        "left: 0;"+
                        "bottom: 0;"+
                        "width: 100%;"+
                        "background-color: black;"+
                        "color: white;"+
                        // "text-align: left;"+
                        "font-family: \x22Trebuchet MS\x22, Helvetica, sans-serif"+
                        "}"+
                        "</style>"+
                        "<div class=\x22geopanel\x22><p></p></div>"+

                        "<div class=\x22augpanel\x22><p></p></div>"+
                        "<div class=\x22footer\x22>"+
                        // "<div style=\x22float: left; margin: 10px 10px;\x22 onclick=\x22screenCap()\x22><i class=\x22fas fa-camera  fa-2x\x22></i></div>"+ 
                        locationButton+
                        "<h4 style=\x22text-align: center\x22>"+sceneResponse.sceneTitle+" from <a href=\x22http://"+sceneResponse.sceneDomain+"\x22>" +sceneResponse.sceneDomain+ "</a> by <a href=\x22mailto:" + sceneResponse.userName+ "@servicemedia.net\x22>polytropoi</a></h4>"+
                        "</div>"+
                        "<script src=\x22../dash/src/component/naf-utils.js\x22></script>"+
                        // "<script src=\x22https://code.jquery.com/jquery-3.2.1.slim.min.js\x22 integrity=\x22sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN\x22 crossorigin=\x22anonymous\x22></script>" +
                        // // "<script src=\x22https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js\x22 integrity=\x22sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q\x22 crossorigin=\x22anonymous\x22></script>" +
                        // "<script src=\x22https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js\x22 integrity=\x22sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl\x22 crossorigin=\x22anonymous\x22></script>" +
                        "<script>"+
                            "function ready(f){/in/.test(document.readyState)?setTimeout('ready('+f+')',9):f()}"+
                            loadAttributions +
                            loadAvailableScenes +
                            loadPictureGroups +
                            // // use like
                            // "ready(function(){" +
                            //     "let atcontrol = document.getElementById(\x22attributionsTextControl\x22);"+
                            //     "console.log('tryna set attributions: ' + atcontrol);"+
                            //     "atcontrol.setAttribute(\x22attributions-text-control\x22, \x22jsonData\x22, "+JSON.stringify(JSON.stringify(attributionsObject))+");"+ //double stringify! yes, it's needed
                            // "});"+

                        "</script>"+
                        "</body>" +

    //                    "<script>WebVRConfig = {BUFFER_SCALE: 1.0,};document.addEventListener('touchmove', function(e) {e.preventDefault();});</script>"+
    //                    "<script src='../dist/webvr-polyfill.js'></script>"+
                    "</html>";
                    }
                    // s3.putObject({ Bucket: bucketFolder, Key: short_id+"/"+"webxr.html", Body: htmltext,  ContentType: 'text/html;charset utf-8', ContentEncoding: 'UTF8' }, function (err, data) {
                    //     console.log('uploaded');
                    //     callback(null);
                    // });
                    // console.log("htmn " + htmltext);
                    callback(null);
                }
            // }
            
            ], //waterfall end

            function (err, result) { // #last function, close async
                if (err != null) {
                    res.send("error!! " + err);
                } else {
                    res.send(htmltext).end();
                    // res.end();
                    //console.log("webxr gen done: " + result);
                }
            }      
        );
            // }                
        
        } //intial sceneData request, condition on type
    });
});
app.get('/scene/:_id/:platform', function (req, res) { //TODO XXXXX -DEPRECATED FOR VERSION BELOW W/VERSIONID needed after v2017x, keep this around for v5.6x apps in wild

    console.log("tryna get scene id: ", req.params._id + " excaped " + entities.decodeHTML(req.params._id));

    var platformType = req.params.platform;
    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];

    sceneResponse.sceneBundleUrl = "";

    var versionID = "assets56"


    async.waterfall([

            function (callback) {
//                    var o_id = ObjectID(reqstring);
                db.scenes.find({$or: [{ sceneTitle: reqstring },
                        { short_id : reqstring },
                        { _id : reqstring}]},
                    function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                        if (err || !sceneData || !sceneData.length) {
                            console.log("error getting scene data: " + err);
                            callback(err);
                        } else { //make arrays of the pics and audio items
                            sceneData[0].scenePictures.forEach(function (picture){
                                var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                requestedPictureItems.push(p_id); //populate array
                            });
                            var triggerOID = ObjectID.isValid(sceneData[0].sceneTriggerAudioID) ? ObjectID(sceneData[0].sceneTriggerAudioID) : "";
                            var ambientOID = ObjectID.isValid(sceneData[0].sceneAmbientAudioID) ? ObjectID(sceneData[0].sceneAmbientAudioID) : "";
                            var primaryOID = ObjectID.isValid(sceneData[0].scenePrimaryAudioID) ? ObjectID(sceneData[0].scenePrimaryAudioID) : "";
                            requestedAudioItems = [ triggerOID, ambientOID, primaryOID];
                            // requestedAudioItems = [ ObjectID(sceneData[0].sceneTriggerAudioID), ObjectID(sceneData[0].sceneAmbientAudioID), ObjectID(sceneData[0].scenePrimaryAudioID)];

                            sceneResponse = sceneData[0];
                            callback(null);
                        }

                    });

            },

            function (callback) { //update link pic URLs //TODO check for freshness, and rescrape if needed
                if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                    for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                        var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".thumb.jpg", Expires: 6000});
                        var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".half.jpg", Expires: 6000});
                        var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".standard.jpg", Expires: 6000});
                        sceneResponse.sceneWebLinks[i].urlThumb = urlThumb;
                        sceneResponse.sceneWebLinks[i].urlHalf = urlHalf;
                        sceneResponse.sceneWebLinks[i].urlStandard = urlStandard;

                    }
                }
                callback(null);
            },

            function (callback) { //TODO jack in version part of path~
                if (sceneResponse.sceneUseEnvironment) {
//                    var urlScene = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'scenes_' + platformType + '/' + sceneResponse.sceneEnvironment.name + '_' + platformType + '.unity3d', Expires: 6000});
                    var urlScene = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'scenes_' + platformType + '/' + sceneResponse.sceneEnvironment.name, Expires: 6000});
                    sceneResponse.sceneEnvironment.sceneBundleUrl = urlScene;
//                    console.log(urlScene);
                    callback(null);
                } else {
                    callback(null);
                }
            },

            function (callback) { //fethc audio items
                db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items)
                {
                    if (err || !audio_items) {
                        console.log("error getting audio items: " + err);
                        callback(null);
                    } else {
                        callback(null, audio_items) //send them along
                    }
                });
            },




            function(audio_items, callback) { //add the signed URLs to the obj array
                for (var i = 0; i < audio_items.length; i++) {
                    //    console.log("audio_item: ", audio_items[i]);
                    var item_string_filename = JSON.stringify(audio_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var mp3Name = baseName + '.mp3';
                    var oggName = baseName + '.ogg';
                    var pngName = baseName + '.png';
                    var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                    var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                    var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
//                            audio_items.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                    if (audio_items[i].tags != null) {
                        if (audio_items[i].tags.length < 1) {
                            audio_items[i].tags = [""];
                        } else {
                            audio_items[i].tags = [""];
                        }
                    }
                }
                //   console.log('tryna send ' + audio_items);
                audioResponse = audio_items;
                sceneResponse.audio = audioResponse;
//                        console.log("audio", audioResponse);
                callback(null, audio_items);
            },

            function(audioStuff, callback) { //return the pic items
                console.log("requestedPictureItems:  ", requestedPictureItems);
                db.image_items.find({_id: {$in: requestedPictureItems }}, function (err, pic_items)
                {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        callback(null);
                    } else {
                        callback(null, pic_items)
                    }
                });
            },

            function (picture_items, callback) {
                for (var i = 0; i < picture_items.length; i++) {
                    //    console.log("picture_item: ", picture_items[i]);
                    var item_string_filename = JSON.stringify(picture_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var standardName = 'standard.' + baseName + item_string_filename_ext;
                    var originalName = baseName + item_string_filename_ext;

                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + quarterName, Expires: 6000});
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + halfName, Expires: 6000});
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + standardName, Expires: 6000});
                    //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                    picture_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                    picture_items[i].urlQuarter = urlQuarter; //jack in teh signed urls into the object array
                    picture_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array
                    picture_items[i].urlStandard = urlStandard; //jack in teh signed urls into the object array
                    if (picture_items[i].orientation == "equirectangular") { //add the big one for skyboxes
                        var urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + originalName, Expires: 6000});
                        picture_items[i].urlOriginal = urlOriginal;
                    }
                    if (picture_items[i].hasAlphaChannel == null) {picture_items[i].hasAlphaChannel = false}
                    //pathResponse.path.pictures.push(urlThumb, urlQuarter, urlHalf, urlStandard);
                    if (picture_items[i].tags == null) {picture_items.tags = [""]}
                }
                pictureResponse = picture_items ;
                callback(null);
            },

            function (callback) {
                var postcards = [];
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    async.each (sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting picture items: " + err);
//                                        callback(err);
//                                        callback(null);
                                callbackz();
                            } else {
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" +  picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});

                                var postcard = {};
                                postcard.userID = picture_item.userID;
                                postcard._id = picture_item._id;
                                postcard.sceneID = picture_item.postcardForScene;
                                postcard.urlThumb = urlThumb;
                                postcard.urlHalf = urlHalf;
                                postcard.urlStandard = urlStandard;
                                if (postcards.length < 9)
                                    postcards.push(postcard);
//                                        console.log("pushing postcard: " + JSON.stringify(postcard));
                                callbackz();
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, postcards);
                        } else {
                            console.log('All files have been processed successfully');
                            callback(null, postcards);
//                                        };
                        }
                    });
                } else {
//                      callback(null);
                    callback(null, postcards);
                }
            },

            function (postcardResponse, callback) {
                //assemble all response elements
                sceneResponse.audio = audioResponse;
                sceneResponse.pictures = pictureResponse;
                sceneResponse.postcards = postcardResponse;
                callback(null);
            },

            function (callback) {

                var objex = [];
//                console.log("sceneObjects : " + JSON.stringify(sceneResponse.sceneObjects));
                if (sceneResponse.sceneUseTargetObject) {
                    sceneResponse.sceneTargetObject.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + sceneResponse.sceneTargetObject.name, Expires: 6000});
                }
                if (sceneResponse.sceneObjects != null) {
                    async.each (sceneResponse.sceneObjects, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("7856 tryna get sceneObject: " + objID);
                        db.obj_items.findOne({"_id": oo_id}, function (err, obj_item) {
                            if (err || !obj_item) {
                                console.log("error getting obj items: " + err);
                                callbackz();
                            } else {
                                //
                                //console.log("7863 tryna find childObjectIDs: " + JSON.stringify(obj_item.childObjectIDs));
                                obj_item.objectGroup = "none";
                                if (obj_item.childObjectIDs != null && obj_item.childObjectIDs.length > 0) {
                                    var childIDs = obj_item.childObjectIDs.map(convertStringToObjectID); //convert child IDs array to objIDs
                                    db.obj_items.find({_id : {$in : childIDs}}, function(err, obj_items) {
                                        if (err || !obj_items) {
                                            console.log("error getting childObject items: " + err);
                                            //res.send("error getting child objects");
                                            objex.push(obj_item);
                                            callbackz();
                                        } else {
                                            childObjects = obj_items;
                                            console.log("childObjects: " + JSON.stringify(childObjects));
                                            obj_item.childObjects = childObjects;
                                            objex.push(obj_item);
                                            callbackz();
                                        }
                                    });
                                } else {
                                    objex.push(obj_item);
                                    callbackz();
                                }
                                //
                                obj_item.objectGroup = "none";
                                obj_item.snapToGround = obj_item.snapToGround != null ? obj_item.snapToGround : "false"; //new obj properties, not found in existing obj records...
                                obj_item.randomRotation = obj_item.randomRotation != null ? obj_item.randomRotation : "false";
                                obj_item.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + obj_item.assetname, Expires: 6000});
                                objex.push(obj_item)
                                callbackz();
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, objex);
                        } else {
                            console.log('objects have been added to scene.objex');
                            objectResponse = objex;
                            sceneResponse.sceneObjex = objectResponse;
                            callback(null, objex);
                        }
                    });
                } else {
                    callback(null, objex);
                }
            },
            function (objex, callback) { //inject username, last step (since only id is in scene doc)

                if ((sceneResponse.userName == null || sceneResponse.userName.length < 1) && (sceneResponse.user_id != null)) {

                    var oo_id = ObjectID(sceneResponse.user_id);
                    db.users.findOne({_id: oo_id}, function (err, user) {
                        if (!err || user != null) {
                            console.log("tryna inject usrname: " + user.userName);
                            sceneResponse.userName = user.userName;
                            callback(null);
                        }
                    });

                } else  {
                    callback(null);
                }
            }

        ], //waterfall end

        function (err, result) { // #last function, close async
            res.json(sceneResponse);
            console.log("waterfall done: " + result);
        }
    );
});

app.get('/scene/:_id/:platform/:version', function (req, res) { //called from app context - TODO lock down w/ checkAppID, requiredAuthentication

    console.log("tryna get scene id: ", req.params._id + " excaped " + entities.decodeHTML(req.params._id));

    var platformType = req.params.platform;
    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];
    var gltfObjects = [];
    sceneResponse.sceneBundleUrl = "";


     var versionID = req.params.version;


    async.waterfall([

            function (callback) {
//                    var o_id = ObjectID(reqstring);
                db.scenes.find({$or: [{ sceneTitle: reqstring },
                        { short_id : reqstring },
                        { _id : reqstring}]},
                    function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                        if (err || !sceneData || !sceneData.length) {
                            console.log("error getting scene data: " + err);
                            callback(err);
                        } else { //make arrays of the pics and audio items
                            if (sceneData[0].scenePictures != null && sceneData[0].scenePictures.length > 0) {
                            sceneData[0].scenePictures.forEach(function (picture){
                                var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                requestedPictureItems.push(p_id); //populate array
                                });
                            }
                            var triggerOID = ObjectID.isValid(sceneData[0].sceneTriggerAudioID) ? ObjectID(sceneData[0].sceneTriggerAudioID) : "";
                            var ambientOID = ObjectID.isValid(sceneData[0].sceneAmbientAudioID) ? ObjectID(sceneData[0].sceneAmbientAudioID) : "";
                            var primaryOID = ObjectID.isValid(sceneData[0].scenePrimaryAudioID) ? ObjectID(sceneData[0].scenePrimaryAudioID) : "";
                            requestedAudioItems = [ triggerOID, ambientOID, primaryOID];
                            // requestedAudioItems = [ ObjectID(sceneData[0].sceneTriggerAudioID), ObjectID(sceneData[0].sceneAmbientAudioID), ObjectID(sceneData[0].scenePrimaryAudioID)];

                            sceneResponse = sceneData[0];
                            callback(null);
                        }

                    });

            },

            function (callback) { //update link pic URLs //TODO check for freshness, and rescrape if needed
                if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                    for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                        var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".thumb.jpg", Expires: 6000});
                        var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".half.jpg", Expires: 6000});
                        var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".standard.jpg", Expires: 6000});
                        sceneResponse.sceneWebLinks[i].urlThumb = urlThumb;
                        sceneResponse.sceneWebLinks[i].urlHalf = urlHalf;
                        sceneResponse.sceneWebLinks[i].urlStandard = urlStandard;

                    }
                }
                callback(null);
            },

            function (callback) { //TODO jack in version part of path~
                if (sceneResponse.sceneUseEnvironment) {
//                    var urlScene = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'scenes_' + platformType + '/' + sceneResponse.sceneEnvironment.name + '_' + platformType + '.unity3d', Expires: 6000});
                    var urlScene = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'scenes_' + platformType + '/' + sceneResponse.sceneEnvironment.name, Expires: 6000});
                    sceneResponse.sceneEnvironment.sceneBundleUrl = urlScene;
                    console.log(urlScene);
                    callback(null);
                } else {
                    callback(null);
                }
            },

            function (callback) { //fethc audio items

                db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items)
                {
                    if (err || !audio_items) {
                        console.log("error getting audio items: " + err);
                        callback(null);
                    } else {

                        callback(null, audio_items) //send them along
                    }
                });
            },




            function(audio_items, callback) { //add the signed URLs to the obj array
                for (var i = 0; i < audio_items.length; i++) {
                    //    console.log("audio_item: ", audio_items[i]);
                    var item_string_filename = JSON.stringify(audio_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var mp3Name = baseName + '.mp3';
                    var oggName = baseName + '.ogg';
                    var pngName = baseName + '.png';
                    var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                    var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                    var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
//                            audio_items.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                    if (audio_items[i].tags != null) {
                        if (audio_items[i].tags.length < 1) {
                            audio_items[i].tags = [""];
                        } else {
                            audio_items[i].tags = [""];
                        }
                    }
                }
                //   console.log('tryna send ' + audio_items);
                audioResponse = audio_items;
                sceneResponse.audio = audioResponse;
//                        console.log("audio", audioResponse);
                callback(null, audio_items);
            },

            function(audioStuff, callback) { //return the pic items
                console.log("requestedPictureItems:  ", requestedPictureItems);
                db.image_items.find({_id: {$in: requestedPictureItems }}, function (err, pic_items)
                {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        callback(null);
                    } else {
                        callback(null, pic_items)
                    }
                });
            },

            function (picture_items, callback) {
                for (var i = 0; i < picture_items.length; i++) {
                    //    console.log("picture_item: ", picture_items[i]);
                    var item_string_filename = JSON.stringify(picture_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var standardName = 'standard.' + baseName + item_string_filename_ext;
                    var originalName = baseName + item_string_filename_ext;

                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + quarterName, Expires: 6000});
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + halfName, Expires: 6000});
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + standardName, Expires: 6000});
                    //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                    picture_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                    picture_items[i].urlQuarter = urlQuarter; //jack in teh signed urls into the object array
                    picture_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array
                    picture_items[i].urlStandard = urlStandard; //jack in teh signed urls into the object array
                    if (picture_items[i].orientation == "equirectangular") { //add the big one for skyboxes
                        var urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + originalName, Expires: 6000});
                        picture_items[i].urlOriginal = urlOriginal;
                    }
                    if (picture_items[i].hasAlphaChannel == null) {picture_items[i].hasAlphaChannel = false}
                    //pathResponse.path.pictures.push(urlThumb, urlQuarter, urlHalf, urlStandard);
                    if (picture_items[i].tags == null) {picture_items.tags = [""]}
                }
                pictureResponse = picture_items ;
                callback(null);
            },

            function (callback) {
                var postcards = [];
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    async.each (sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting picture items: " + err);
//                                        callback(err);
//                                        callback(null);
                                callbackz();
                            } else {
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});

                                var postcard = {};
                                postcard.userID = picture_item.userID;
                                postcard._id = picture_item._id;
                                postcard.sceneID = picture_item.postcardForScene;
                                postcard.urlThumb = urlThumb;
                                postcard.urlHalf = urlHalf;
                                postcard.urlStandard = urlStandard;
                                if (postcards.length < 9)
                                    postcards.push(postcard);
//                                        console.log("pushing postcard: " + JSON.stringify(postcard));
                                callbackz();
                            }

                        });

                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, postcards);
                        } else {
                            console.log('All files have been processed successfully');
                            callback(null, postcards);
//                                        };
                        }
                    });
                } else {
//                      callback(null);
                    callback(null, postcards);
                }
            },

            function (postcardResponse, callback) {
                //assemble all response elements
                sceneResponse.audio = audioResponse;
                sceneResponse.pictures = pictureResponse;
                sceneResponse.postcards = postcardResponse;
                callback(null);
            },

            function (callback) {
                var modelz = [];
               console.log("sceneModels : " + JSON.stringify(sceneResponse.sceneModels));
                if (sceneResponse.sceneModels != null) {
                    async.each (sceneResponse.sceneModels, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("13904 tryna get sceneObject: " + objID);
                        db.models.findOne({"_id": oo_id}, function (err, model) {
                            if (err || !model) {
                                console.log("error getting model: " + err);
                                callbackz();
                            } else {
                                console.log("got user model:" + JSON.stringify(model));
                                let url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + model.userID + "/gltf/" + model.filename, Expires: 6000});
                                model.url = url;
                                modelz.push(model);
                                callbackz();
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null);
                        } else {
                            console.log('modelz have been added to scene.modelz');
                            objectResponse = modelz;
                            sceneResponse.sceneModelz = objectResponse;
                            callback(null);
                        }
                    });
                } else {
                    callback(null);
                }
            },
            function (callback) { //add object groups to scene object list
                // var objex = [];
                // if (sceneResponse.sceneObjectGroups) {
                    if (sceneResponse.sceneObjectGroups != null) {
                        async.each (sceneResponse.sceneObjectGroups, function (objID, callbackz) { //nested async-ery!
                            var oo_id = ObjectID(objID);
                            console.log("tryna get GroupObject: " + objID);
                            db.groups.findOne({"_id": oo_id}, function (err, group) {
                                if (err || !group) {
                                    console.log("error getting obj items: " + err);
                                    callbackz();
                                } else {
                                   // console.log("gotsome groupObjects to add to sceneObjects : "+ JSON.stringify(group.items));
                                    sceneResponse.sceneObjects = sceneResponse.sceneObjects.concat(group.items);
                                    callbackz();
                                }
                            });
                        }, function(err) {
                           
                            if (err) {
                                
                                
                                console.log('A file failed to process');
                                callback(err);
                            } else {
                                console.log('groupObjects have been added to sceneObjects');
                                callback(null);
                            }
                        });
                    } else {
                        callback(null);
                    }
            },
            // function (callback) {

            // },
            function (callback) {

                var objex = [];
//                console.log("sceneObjects : " + JSON.stringify(sceneResponse.sceneObjects));
                if (sceneResponse.sceneUseTargetObject && sceneResponse.sceneTargetObject != null && sceneResponse.sceneTargetObject.name != "") {
                    sceneResponse.sceneTargetObject.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + sceneResponse.sceneTargetObject.name, Expires: 6000});
                }
                if (sceneResponse.sceneObjects != null) {
                    //console.log("sceneResponse.sceneObjects: " + JSON.stringify(sceneResponse.sceneObjects));
                    var sceneObjex = removeDuplicates(sceneResponse.sceneObjects); //TODO find out where they come from?!
                    async.each (sceneObjex, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        //console.log("8235 tryna get sceneObject: " + objID);
                        db.obj_items.findOne({"_id": oo_id}, function (err, obj_item) {
                            if (err || !obj_item) {
                                console.log("error getting obj items: " + err);
                                callbackz();
                            } else {
                                //
                                //console.log("8229 tryna find childObjectIDs: " + JSON.stringify(obj_item.childObjectIDs));                                
                                if (obj_item.audioEmit == null)
                                    obj_item.audioEmit = false;
                                if (obj_item.audioScale == null)
                                    obj_item.audioEmit = false;
                                obj_item.objectGroup = "none";
                                if (obj_item.childObjectIDs != null && obj_item.childObjectIDs.length > 0) {
                                    var childIDs = obj_item.childObjectIDs.map(convertStringToObjectID); //convert child IDs array to objIDs
                                    db.obj_items.find({_id : {$in : childIDs}}, function(err, obj_items) {

                                        if (err || !obj_items) {
                                            console.log("error getting childObject items: " + err);
                                            //res.send("error getting child objects");
                                            obj_item.objectGroup = "none";
                                            obj_item.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + obj_item.assetname, Expires: 6000});
                                            objex.push(obj_item)
                                            callbackz();
                                        } else {
                                            childObjects = obj_items;
                                           // console.log("childObjects: " + JSON.stringify(childObjects));
                                            obj_item.childObjects = childObjects;
                                            obj_item.objectGroup = "none";
                                            obj_item.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + obj_item.assetname, Expires: 6000});
                                            objex.push(obj_item)
                                            callbackz();
                                        }
                                    });
                                } else {
                                    obj_item.objectGroup = "none";
                                    obj_item.assetUrl = s3.getSignedUrl('getObject', {Bucket: 'mvmv.us', Key: versionID + '/' + 'bundles_' + platformType + '/' + obj_item.assetname, Expires: 6000});
                                    objex.push(obj_item)
                                    callbackz();
                                }
                                //

                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, objex);
                        } else {
                            console.log('objects have been added to scene.objex');
                            objectResponse = objex;
                            sceneResponse.sceneObjex = objectResponse;
                            callback(null, objex);
                        }
                    });
                } else {
                    callback(null, objex);
                }
            },
            function (objex, callback) { //inject username, last step (since only id is in scene doc)

                if ((sceneResponse.userName == null || sceneResponse.userName.length < 1) && (sceneResponse.user_id != null)) {

                    var oo_id = ObjectID(sceneResponse.user_id);
                    db.users.findOne({_id: oo_id}, function (err, user) {
                        if (!err || user != null) {
                            console.log("tryna inject usrname: " + user.userName);
                            sceneResponse.userName = user.userName;
                            callback(null);
                        }
                    });

                } else  {
                    callback(null);
                }
            }

        ], //waterfall end

        function (err, result) { // #last function, close async
            res.json(sceneResponse);
            console.log("waterfall done: " + result);
        }
    );
});


app.get('/scene/:_id', function (req, res) { //TODO lock down w/ checkAppID, requiredAuthentication // deprecated, see version w/ platform param above, keeping this for old versions

    console.log("tryna get scene id: ", req.params._id + " excaped " + entities.decodeHTML(req.params._id));

    var platformType = req.params.platform;
    var reqstring = entities.decodeHTML(req.params._id);
    var audioResponse = {};
    var pictureResponse = {};
    var postcardResponse = {};
    var sceneResponse = {};
    var requestedPictureItems = [];
    var requestedAudioItems = [];
    sceneResponse.audio = [];
    sceneResponse.pictures = [];
    sceneResponse.postcards = [];

    sceneResponse.sceneBundleUrl = "";
    sceneResponse.qrcode = "";
    var versionID = "assets56" //TODO env var?

    async.waterfall([

            function (callback) {
//                    var o_id = ObjectID(reqstring);
                db.scenes.find({$or: [{ sceneTitle: reqstring },
                        { short_id : reqstring },
                        { _id : reqstring}]},
                    function (err, sceneData) { //fetch the path info by title TODO: urlsafe string

                        if (err || !sceneData || !sceneData.length) {
                            console.log("error getting scene data: " + err);
                            callback(err);
                        } else { //make arrays of the pics and audio items
                            sceneData[0].scenePictures.forEach(function (picture){
                                var p_id = ObjectID(picture); //convert to binary to search by _id beloiw
                                requestedPictureItems.push(p_id); //populate array
                            });
                            var triggerOID = ObjectID.isValid(sceneData[0].sceneTriggerAudioID) ? ObjectID(sceneData[0].sceneTriggerAudioID) : "";
                            var ambientOID = ObjectID.isValid(sceneData[0].sceneAmbientAudioID) ? ObjectID(sceneData[0].sceneAmbientAudioID) : "";
                            var primaryOID = ObjectID.isValid(sceneData[0].scenePrimaryAudioID) ? ObjectID(sceneData[0].scenePrimaryAudioID) : "";
                            requestedAudioItems = [ triggerOID, ambientOID, primaryOID];

                            // requestedAudioItems = [ ObjectID(sceneData[0].sceneTriggerAudioID), ObjectID(sceneData[0].sceneAmbientAudioID), ObjectID(sceneData[0].scenePrimaryAudioID)];

                            sceneResponse = sceneData[0];
                            callback(null);
                        }

                    });

            },

            function (callback) { //get qr code
                QRCode.toDataURL(sceneResponse.short_id, function (err, url) {
                    // console.log(url);
                    // var imgLink = "<img width=\x22128\x22 height=\x22128\x22 alt=\x22qrcode\x22 src=\x22" + url + "\x22/>"

                    // res.send(imgLink);
                    sceneResponse.qrcode = url;
                  });
                callback(null);
            },

            function (callback) { //update link pic URLs //TODO check for freshness, and rescrape if needed
                if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                    for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {
                        var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".thumb.jpg", Expires: 6000});
                        var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".half.jpg", Expires: 6000});
                        var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i].link_id + ".standard.jpg", Expires: 6000});
                        sceneResponse.sceneWebLinks[i].urlThumb = urlThumb;
                        sceneResponse.sceneWebLinks[i].urlHalf = urlHalf;
                        sceneResponse.sceneWebLinks[i].urlStandard = urlStandard;

                    }
                }
                callback(null);
            },

            function (callback) { //fethc audio items

                db.audio_items.find({_id: {$in: requestedAudioItems }}, function (err, audio_items)
                {
                    if (err || !audio_items) {
                        console.log("error getting audio items: " + err);
                        callback(null);
                    } else {

                        callback(null, audio_items) //send them along
                    }
                });
            },




            function(audio_items, callback) { //add the signed URLs to the obj array
                for (var i = 0; i < audio_items.length; i++) {
                    //    console.log("audio_item: ", audio_items[i]);
                    var item_string_filename = JSON.stringify(audio_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var mp3Name = baseName + '.mp3';
                    var oggName = baseName + '.ogg';
                    var pngName = baseName + '.png';
                    var urlMp3 = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + mp3Name, Expires: 60000});
                    var urlOgg = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + oggName, Expires: 60000});
                    var urlPng = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + audio_items[i].userID + "/" + audio_items[i]._id + "." + pngName, Expires: 60000});
//                            audio_items.URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                    audio_items[i].URLogg = urlOgg;
                    audio_items[i].URLpng = urlPng;
                    if (audio_items[i].tags != null) {
                        if (audio_items[i].tags.length < 1) {
                            audio_items[i].tags = [""];
                        } else {
                            audio_items[i].tags = [""];
                        }
                    }
                }
                //   console.log('tryna send ' + audio_items);
                audioResponse = audio_items;
                sceneResponse.audio = audioResponse;
//                        console.log("audio", audioResponse);
                callback(null, audio_items);
            },

            function(audioStuff, callback) { //return the pic items
                console.log("requestedPictureItems:  ", requestedPictureItems);
                db.image_items.find({_id: {$in: requestedPictureItems }}, function (err, pic_items)
                {
                    if (err || !pic_items) {
                        console.log("error getting picture items: " + err);
                        callback(null);
                    } else {
                        callback(null, pic_items)
                    }
                });
            },
            function (picture_items, callback) {
                for (var i = 0; i < picture_items.length; i++) {
                    //    console.log("picture_item: ", picture_items[i]);
                    var item_string_filename = JSON.stringify(picture_items[i].filename);
                    item_string_filename = item_string_filename.replace(/\"/g, "");
                    var item_string_filename_ext = getExtension(item_string_filename);
                    var expiration = new Date();
                    expiration.setMinutes(expiration.getMinutes() + 1000);
                    var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                    //console.log(baseName);
                    var thumbName = 'thumb.' + baseName + item_string_filename_ext;
                    var quarterName = 'quarter.' + baseName + item_string_filename_ext;
                    var halfName = 'half.' + baseName + item_string_filename_ext;
                    var standardName = 'standard.' + baseName + item_string_filename_ext;
                    var originalName = baseName + item_string_filename_ext;

                    var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + thumbName, Expires: 6000}); //just send back thumbnail urls for list
                    var urlQuarter = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + quarterName, Expires: 6000});
                    var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + halfName, Expires: 6000});
                    var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + picture_items[i]._id + "." + standardName, Expires: 6000});
                    //var urlPng = knoxClient.signedUrl(audio_item[0]._id + "." + pngName, expiration);
                    picture_items[i].urlThumb = urlThumb; //jack in teh signed urls into the object array
                    picture_items[i].urlQuarter = urlQuarter; //jack in teh signed urls into the object array
                    picture_items[i].urlHalf = urlHalf; //jack in teh signed urls into the object array
                    picture_items[i].urlStandard = urlStandard; //jack in teh signed urls into the object array
                    if (picture_items[i].orientation == "equirectangular") { //add the big one for skyboxes
                        var urlOriginal = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_items[i].userID + "/" + originalName, Expires: 6000});
                        picture_items[i].urlOriginal = urlOriginal;
                        
                    }
                    if (picture_items[i].hasAlphaChannel == null) {picture_items[i].hasAlphaChannel = false}
                    //pathResponse.path.pictures.push(urlThumb, urlQuarter, urlHalf, urlStandard);
                    if (picture_items[i].tags == null) {picture_items.tags = [""]}
                }
                pictureResponse = picture_items ;
                callback(null);
            },

            function (callback) {
                var postcards = [];
                if (sceneResponse.scenePostcards != null && sceneResponse.scenePostcards.length > 0) {
                    async.each (sceneResponse.scenePostcards, function (postcardID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(postcardID);
                        db.image_items.findOne({"_id": oo_id}, function (err, picture_item) {
                            if (err || !picture_item) {
                                console.log("error getting picture items: " + err);
//                                        callback(err);
//                                        callback(null);
                                callbackz();
                            } else {
                                var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".thumb." + picture_item.filename, Expires: 6000});
                                var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".half." + picture_item.filename, Expires: 6000});
                                var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: "users/" + picture_item.userID + "/" + picture_item._id + ".standard." + picture_item.filename, Expires: 6000});

                                var postcard = {};
                                postcard.userID = picture_item.userID;
                                postcard._id = picture_item._id;
                                postcard.sceneID = picture_item.postcardForScene;
                                postcard.urlThumb = urlThumb;
                                postcard.urlHalf = urlHalf;
                                postcard.urlStandard = urlStandard;
                                if (postcards.length < 9)
                                    postcards.push(postcard);
//                                        console.log("pushing postcard: " + JSON.stringify(postcard));
                                callbackz();
                            }

                        });

                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, postcards);
                        } else {
                            console.log('All files have been processed successfully');
                            callback(null, postcards);
//                                        };
                        }
                    });
                } else {
//                      callback(null);
                    callback(null, postcards);
                }
            },

            function (postcardResponse, callback) {
                //assemble all response elements
                sceneResponse.audio = audioResponse;
                sceneResponse.pictures = pictureResponse;
                sceneResponse.postcards = postcardResponse;
                callback(null);
            },

            function (callback) {
                var modelz = [];
//                console.log("sceneObjects : " + JSON.stringify(sceneResponse.sceneObjects));
                if (sceneResponse.sceneModels != null) {
                    async.each (sceneResponse.sceneModels, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("14312 tryna get sceneObject: " + objID);
                        db.models.findOne({"_id": oo_id}, function (err, model) {
                            if (err || !model) {
                                console.log("error getting model: " + err);
                            } else {
                                // console.log("got user models:" + JSON.stringify(models));
                                let url = s3.getSignedUrl('getObject', {Bucket: 'servicemedia', Key: 'users/' + model.userID + "/gltf/" + model.filename, Expires: 6000});
                                model.url = url;
                                modelz.push(model);
                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null);
                        } else {
                            console.log('modelz have been added to scene.modelz');
                            objectResponse = modelz;
                            sceneResponse.sceneModelz = objectResponse;
                            callback(null);
                        }
                    });
                } else {
                    callback(null);
                }
            },

            function (callback) {

                var objex = [];
                if (sceneResponse.sceneObjects != null) {
                    async.each (sceneResponse.sceneObjects, function (objID, callbackz) { //nested async-ery!
                        var oo_id = ObjectID(objID);
                        console.log("14347 tryna get sceneObject: " + objID);
                        db.obj_items.findOne({"_id": oo_id}, function (err, obj_item) {
                            if (err || !obj_item) {
                                console.log("error getting obj items: " + err);
                                callbackz();
                            } else {
                                //
                               // console.log("tryna find childObjectIDs: " + JSON.stringify(obj_item.childObjectIDs));
                                obj_item.objectGroup = "none";
                                if (obj_item.childObjectIDs != null && obj_item.childObjectIDs.length > 0) {
                                    var childIDs = obj_item.childObjectIDs.map(convertStringToObjectID); //convert child IDs array to objIDs
                                    db.obj_items.find({_id : {$in : childIDs}}, function(err, obj_items) {
                                        if (err || !obj_items) {
                                            console.log("error getting childObject items: " + err);
                                            //res.send("error getting child objects");
                                            obj_item.objectGroup = "none";
                                            obj_item.snapToGround = obj_item.snapToGround != null ? obj_item.snapToGround : "false"; //new obj properties, not found in existing obj records...
                                            obj_item.randomRotation = obj_item.randomRotation != null ? obj_item.randomRotation : "false";
                                            objex.push(obj_item)
                                            callbackz();
                                        } else {
                                            childObjects = obj_items;
                                            console.log("childObjects: " + JSON.stringify(childObjects));
                                            obj_item.childObjects = childObjects;
                                            obj_item.objectGroup = "none";
                                            obj_item.snapToGround = obj_item.snapToGround != null ? obj_item.snapToGround : "false"; //new obj properties, not found in existing obj records...
                                            obj_item.randomRotation = obj_item.randomRotation != null ? obj_item.randomRotation : "false";
                                            objex.push(obj_item)
                                            callbackz();
                                        }
                                    });
                                } else {
                                    obj_item.objectGroup = "none";
                                    obj_item.snapToGround = obj_item.snapToGround != null ? obj_item.snapToGround : "false"; //new obj properties, not found in existing obj records...
                                    obj_item.randomRotation = obj_item.randomRotation != null ? obj_item.randomRotation : "false";
                                    objex.push(obj_item)
                                    callbackz();
                                }
                                //

                            }
                        });
                    }, function(err) {
                       
                        if (err) {
                            
                            console.log('A file failed to process');
                            callback(null, objex);
                        } else {
                            console.log('objects have been added to scene.objex');
                            objectResponse = objex;
                            sceneResponse.sceneObjex = objectResponse;
                            callback(null, objex);
                        }
                    });
                } else {
                    callback(null, objex);
                }
            },
            function (objex, callback) { //inject username, last step (since only id is in scene doc)

                if ((sceneResponse.userName == null || sceneResponse.userName.length < 1) && (sceneResponse.user_id != null)) {

                    var oo_id = ObjectID(sceneResponse.user_id);
                    db.users.findOne({_id: oo_id}, function (err, user) {
                        if (!err || user != null) {
                            console.log("tryna inject usrname: " + user.userName);
                            sceneResponse.userName = user.userName;
                            callback(null);
                        }
                    });

                } else  {
                    callback(null);
                }
            }

        ], //waterfall end

        function (err, result) { // #last function, close async
            res.json(sceneResponse);
            console.log("waterfall done: " + result);
        }
    );
});

app.post('/delete_path', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna delete key: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.paths.remove( { "_id" : o_id }, 1 );
    res.send("deleted");

});


app.post('/share_scene/:_id', checkAppID, requiredAuthentication, function (req, res) {

    //temp container for objex with peopleID + email

    async.waterfall([

        function(callback) {
        console.log("share node: " + req.body._id + " mail: " + req.body.sceneShareWith);

            var emails = req.body.sceneShareWith;
            var emailSplit = emails.split(",");
            // emailSplit.forEach(element => {
            //     if (!validator.isEmail) {
            //         res.end("bad bmail!");
            //         callback(err);
            //     }
            // });
            // emailSplit = emailSplit.filter(val => {
            //     return validator.isEmail;
            // });
            for (var m = 0; m < emailSplit.length; m++) {
                emailSplit[m] = emailSplit[m].trim();
                if (validator.isEmail(emailSplit[m]) == false){
                    console.log(emailSplit[m] + " is a bad email!");
                    res.end("an email address was invalid!");
                    //
                    callback(true); //err = true means bail if any bad emails!
                    return;
                } else {
                    console.log(emailSplit[m] + " is a good email!");
                }
            }
            var emailSplit2 = emailSplit.filter(val => {
                return validator.isEmail;
            });
            console.log("emailSplit is " + JSON.stringify(emailSplit2));
            callback(null, emailSplit2);
        },

        function(emailSplit, callback){ //build temp array of objex with email + peopleID
            var emailsFinal = [];
            var uid = req.session.user._id.toString();
            console.log("tryna mail to " )
             async.each (emailSplit, function (email, callbackz) {
                db.people.findOne({ $and: [ {userID: uid}, {email: email.trim()} ]}, function(err, person) {
                    if (err || !person) {
                        console.log("did not find that person : " + err);
                        var person = {};
                        person.userID = req.session.user._id.toString();
                        person.dateCreated = Date.now();
                        person.email = email.trim();
                        console.log("fixing to save new person " + JSON.stringify(person));
                        db.people.save(person, function (err, saved) {
                            if ( err || !saved ) {
                                console.log('person not saved..');
                                res.end();
                                callbackz();
                                } else {
                                    var person_id = saved._id.toString();
                                    var pursoner = {};
                                    console.log('new person created, id: ' + person_id);
                                    pursoner.personID = person_id;
                                    pursoner.email = email.trim();
                                    emailsFinal.push(pursoner);
                                    callbackz();
                                    }
                                });
                    } else {
                        var pursoner = {};
                        console.log('found person id: ' + person._id);
                        pursoner.personID = person._id;
                        pursoner.email = email.trim();
                        emailsFinal.push(pursoner);
                        callbackz();
                        }

                        });

            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                    callback(null, emailsFinal);

                } else {
                    // console.log('All files have been processed successfully');
                    console.log("emailsFinal is " + JSON.stringify(emailsFinal));
                    callback(null, emailsFinal);
                }
            });

        },

        function(eData, callback) { //spin through validated data, send appropriate mail
            console.log("eDatahs : " +JSON.stringify(eData));
            async.each (eData, function (data, callbackzz) {
                // console.log("emailsFinal is " + JSON.stringify(emailsFinal));
                //var theUrl = "";
                // QRCode.toDataURL(req.body.short_id, function (err, url) {
                //     theUrl = url;
                //     console.log(theUrl);
                //   });
                var subject = "Scene Invitation : " + req.body.sceneTitle;
                var from = req.session.user.email;
                //var from = "polytropoi@gmail.com";
                // var to = [req.body.sceneShareWith];
                var to = [data.email];
                var personID = data.person_id;
                var bcc = [];
                //var reset = "";
                var timestamp = Math.round(Date.now() / 1000);
                var message = "";
                var servicemedia_link = rootHost + "/#/s/" + req.body.short_id;
                // var wgl_link = "http://mvmv.us/?scene=" + req.body.short_id;
                var scene_page = req.body.sceneDomain + "/" + req.body.short_id;
                var app_link = rootHost + "/#/applink/" + req.body.short_id;
                var mob_link = "strr://play/?scene=" + req.body.short_id;
                if (req.body.sceneMessage === "" || req.body.sceneMessage == null) {
                    message = " has shared an Immersive Scene with you!";
                } else {
                    message = " has shared an Immersive Scene with you including this message: " +
                        "<hr><br> " + req.body.sceneMessage +  "<br>"
                }
                var urlHalf = "";
                if (req.body.postcards[0]) {
                    urlHalf = req.body.postcards[0].urlHalf;
                }
                // if (validator.isEmail(to) == true) {
                    if (req.body.sceneShareWithPublic) {

                        var htmlbody = req.session.user.userName + message + "</h3><hr>" +
                            "<br> You can access this public scene using the <a href='https://servicemedia.net'>ServiceMedia app</a>" +
                            "<br> For quick access, launch the app and <strong><a href='https://servicemedia.net/qrcode/" + req.body.short_id + "'>Scan this Access Code!</a></strong>" +
                            "<br> <img src=" + urlHalf + "> " +
                                                        "<br> Scene Title: " + req.body.sceneTitle +
                            "<br> Scene Key: " + req.body.short_id +
                            "<br> Scene Type: " + req.body.sceneType +
                            "<br> Scene Description: " + req.body.sceneDescription +
                            "<br> <a href= http://" + scene_page + "> Here's the shareable public page for this scene. </a> <br>If you have the iOS app, you may load the scene directly with the <a href= "+ app_link +">Mobile App Link</a>" +
                //            "r><br> <a href= " + mob_link + "> Mobile App link </a> " +
                            // "<br><a href='https://servicemedia.net/qrcode/" + req.body.short_id + "'>You may also use the app and scan the quick access code here!</a>"
                            "<br>You may also enter the scene title or keycode on the ServiceMedia app landing page" +
                            "<br> For more scenes like this, or to get the latest app, visit <a href='https://servicemedia.net'>ServiceMedia.net!</a> ";
                        ses.sendEmail( {
                                Source: from,
                                Destination: { ToAddresses: to, BccAddresses: bcc},
                                Message: {
                                    Subject: {
                                        Data: subject
                                    },
                                    Body: {
                                        Html: {
                                            Data: htmlbody
                                        }
                                    }
                                }
                            }
                            , function(err, data) {
                                if(err) throw err
                                console.log('Email sent:');
                                console.log(data);
                                // res.send("Email sent");
                               
                                // res.redirect("http://elnoise.com/#/play/" + audio_item[0].short_id);

                            });
                        callbackzz();
                    } else {
                        // if (timestamp < user.resetTimestamp + 3600) { //expires in 1 hour!
                        bcrypt.genSalt(3, function(err, salt) { //level3 easy, not a password itself
                            bcrypt.hash(timestamp.toString(), salt, null, function(err, hash) {
                                // reset = hash;
                                var cleanhash = validator.blacklist(hash, ['/','.','$']); //make it URL safe
                                var invitation = {
                                    validated: false,
                                    // invitedToSceneShareWithPublic:
                                    invitedToSceneTitle: req.body.sceneTitle,
                                    invitedToSceneID: req.body._id,
                                    invitedToSceneShortID: req.body.short_id,
                                    accessTimeWindow: timestamp + 86400, //one day
                                    sentByUserName: req.session.user.userName,
                                    sentByUserID: req.session.user._id.toString(),
                                    sentToEmail: to,
                                    sentToPersonID: data.personID.toString(),
                                    invitationHash: cleanhash,
                                    invitationTimestamp: timestamp

                                }
                                db.invitations.save(invitation, function (err, saved) {
                                    if ( err || !saved ) {
                                        console.log('problem saving invitaiton');

                                    } else {
                                        // var item_id = saved._id.toString();
                                        console.log('new invitiation id: ' + saved._id.toString());

                                    }
                                });
                                if (req.body.sceneMessage === "" || req.body.sceneMessage == null) {
                                    message = from + " has shared an Immersive Scene with you!";
                                    // "<h3>Scene Invitation from " + from + "</h3><hr><br>"
                                } else {
                                    message = from + " has shared an Immersive Scene with you with this message: "+
                                        "<hr><br> " + req.body.sceneMessage +  "<br><hr>"
                                }
                                var htmlbody = message +
                                    "<br><strong>This is a private scene, intended only for invited guests.</strong><br>" +
                                    "Click this invitation link to authenticate your access (link expires in 10 hours): <br>" +
                                    rootHost + "/#/invitation/" + cleanhash +
                                    "<br> <img src=" + urlHalf + "> " +
                                    "<br> Scene Title: " + req.body.sceneTitle +
                                    "<br> Scene Key: " + req.body.short_id +
                                    "<br> Scene Type: " + req.body.sceneType +
                                    "<br> Scene Description: " + req.body.sceneDescription +
                        //             "<br>If your device has the iOS app installed, you may load the scene directly with the <a href= " + app_link + ">Mobile App Link</a>" +
                        //             "<br>To access the scene, launch the app and enter your email address."
                        // //            "r><br> <a href= " + mob_link + "> Mobile App link </a> " +
                        //             "<br>You may also enter the scene title or keycode on the ServiceMedia app landing page" +
                                    "<br> For more info, or to become a subscriber, visit <a href='https://servicemedia.net'>ServiceMedia.net!</a> ";

                            ses.sendEmail( {
                                    Source: from,
                                    Destination: { ToAddresses: to, BccAddresses: bcc},
                                    Message: {
                                        Subject: {
                                            Data: subject
                                        },
                                        Body: {
                                            Html: {
                                                Data: htmlbody
                                            }
                                        }
                                    }
                                }
                                , function(err, data) {
                                    if(err) throw err
                                    console.log('Email sent:');
                                    console.log(data);
                                   
                                });
                            });
                        });
                    callbackzz();
                    }

            }, function(err) {
               
                if (err) {
                    console.log('A file failed to process');
                } else {
                    console.log('All files have been processed successfully');
                    res.send("emails sent");
                }
            });
            callback(null);
        }],

    function(err, result) { // #last function, close async
            console.log("waterfall done: " + result);
        }
    );
});

app.post('/newobj', requiredAuthentication, function (req, res) {

    var newobj = req.body;
    newobj.userID = req.session.user._id.toString();
    newobj.userName = req.session.user.userName;
    let timestamp = Math.round(Date.now() / 1000);
    newobj.createdTimestamp = timestamp;
    db.obj_items.save(newobj, function (err, saved) {
        if ( err || !saved ) {
            console.log('object not saved..');
            res.send("nilch");
        } else {
            var item_id = saved._id.toString();
            console.log('new object created, id: ' + item_id);
            res.send("created: " + item_id);
        }
    });
});

app.post('/delete_obj/', requiredAuthentication, function (req, res) { //weird, post + path
    console.log("tryna delete obj: " + req.body._id);
    var o_id = ObjectID(req.body._id);
    db.obj_items.remove( { "_id" : o_id }, 1 );
    res.send("deleted");
});


app.post('/update_pic/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);

    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('pic requested : ' + req.body._id);
    db.image_items.findOne({ "_id" : o_id}, function(err, pic_item) {
        if (err || !pic_item) {
            console.log("error getting pic items: " + err);
        } else {
            console.log("tryna update " + req.body._id + " to status " + req.body.item_status);
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            db.image_items.update( { _id: o_id }, { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                title: req.body.title,
                isPublic : isPublic,
                orientation: req.body.orientation,
                hasAlphaChannel: req.body.hasAlphaChannel,
                captionUpper: req.body.captionUpper,
                captionLower: req.body.captionLower,
                linkType: req.body.linkType,
                linkURL: req.body.linkURL,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName,
            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

app.post('/update_video/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);    

    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('video requested : ' + req.body._id);
    db.video_items.findOne({ "_id" : o_id}, function(err, video_item) {
        if (err || !video_item) {
            console.log("error getting pic items: " + err);
        } else {
            console.log("tryna update " + req.body._id + " to status " + req.body.item_status);
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            db.video_items.update( { _id: o_id }, { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                title: req.body.title,
                isPublic : isPublic,
                orientation: req.body.orientation,
                hasAlphaChannel: req.body.hasAlphaChannel,
                captionUpper: req.body.captionUpper,
                captionLower: req.body.captionLower,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.name,

            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

app.post('/update_model/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);    

    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('model requested : ' + req.body._id);
    db.models.findOne({ "_id" : o_id}, function(err, model) {
        if (err || !model) {
            console.log("error getting pic items: " + err);
        } else {
            console.log("tryna update " + req.body._id + " to status " + req.body.item_status);
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            db.models.update( { _id: o_id }, { $set: { item_status: req.body.item_status,
                tags: req.body.tags,
                name: req.body.name,
                isPublic : isPublic,
                sourceTitle: req.body.sourceTitle,
                sourceLink: req.body.sourceLink,
                authorName: req.body.authorName,
                authorLink: req.body.authorLink,
                license: req.body.license,
                modifications: req.body.modifications,
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName,

            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

app.post('/update_obj/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);

    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('tryna update obj : ' + req.params._id);
    let timestamp = Math.round(Date.now() / 1000);
    db.obj_items.find({ "_id" : o_id}, function(err, obj_item) {
        if (err || !obj_item) {
            console.log("error getting audio items: " + err);
        } else {;
            db.obj_items.update( { _id: o_id }, { $set: { 
                // item_status: req.body.item_status,

                name: req.body.name,
                description: req.body.description,
                objtype: req.body.objtype,
                interaction: req.body.interaction,
                eventtype: req.body.eventtype,
                eventdata: req.body.eventdata,
                collidertype: req.body.collidertype,
                highlight: req.body.highlight,
                callout: req.body.callout,
                tags: req.body.tags,
                title: req.body.title,

                // price: req.body.price != null ? req.body.price : 0,
                intval: req.body.intval != null ? req.body.intval : 0,
                floatval: req.body.floatval != null ? req.body.floatval : 0,
                stringval: req.body.stringval != null ? req.body.stringval : "",
                assetname: req.body.assetname,
                assettype: req.body.assettype,
                audioEmit: req.body.audioEmit != null ? req.body.audioEmit : false,
                audioScale: req.body.audioScale != null ? req.body.audioScale : false,
                randomColor: req.body.randomColor != null ? req.body.randomColor : false,
                highlightColor: req.body.highlightColor,
                color1: req.body.color1,
                color2: req.body.color2,
                snapToGround: req.body.snapToGround  != null ? req.body.snapToGround : false,
                randomRotation: req.body.randomRotation != null ? req.body.randomRotation : false,
//                objectScale: req.body.objectScale ? req.body.objectScale : 0,
                xoffset: req.body.xoffset != null ? req.body.xoffset : 0,
                yoffset: req.body.yoffset != null ? req.body.yoffset : 0,
                zoffset: req.body.zoffset != null ? req.body.zoffset : 0,
                rotationAxis: req.body.rotationAxis != null ? req.body.rotationAxis : 0,
                rotationSpeed: req.body.rotationSpeed != null ? req.body.rotationSpeed : 0,
                objScale: req.body.objScale != null ? req.body.objScale : 0,
                maxPerScene: req.body.maxPerScene != null ? req.body.maxPerScene : 10,
                speedFactor: req.body.speedFactor != null ? req.body.speedFactor : 3,
                colliderScale: req.body.colliderScale != null ? req.body.colliderScale : 1,
                triggerScale: req.body.triggerScale != null ? req.body.triggerScale : 1,
                yPosFudge: req.body.yPosFudge != null ? req.body.yPosFudge : 0,
                yRotFudge: req.body.yRotFudge != null ? req.body.yRotFudge : 0,
                eulerx: req.body.eulerx != null ? req.body.eulerx : "0",
                eulery: req.body.eulery != null ? req.body.eulery : "0",
                eulerz: req.body.eulerz != null ? req.body.eulerz : "0",
                labeltext: req.body.labeltext,
                scatter: req.body.scatter != null ? req.body.scatter : false,
                showcallout: req.body.showcallout != null ? req.body.showcallout : false,
                // buyable: req.body.buyable != null ? req.body.buyable : false,
                userspawnable: req.body.userspawnable != null ? req.body.userspawnable : false,
                textitemID: req.body.textitemID != null ? req.body.textitemID : "",
                pictureitemID: req.body.pictureitemID  != null ? req.body.pictureitemID : "",
                audioitemID: req.body.audioitemID != null ? req.body.audioitemID : "",
                textgroupID: req.body.textgroupID != null ? req.body.textgroupID : "",
                picturegroupID: req.body.picturegroupID != null ? req.body.picturegroupID : "",
                audiogroupID: req.body.audiogroupID != null ? req.body.audiogroupID : "",
                synthPatch1: req.body.synthPatch1 != null ? req.body.synthPatch1 : "",
                synthNotes: req.body.synthNotes != null ? req.body.synthNotes : "",
                synthDuration: req.body.synthDuration != null ? req.body.synthDuration : "",
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.name
                // childObjectIDs: req.body.childObjectIDs
            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

app.post('/update_audio/:_id', requiredAuthentication, function (req, res) {
    console.log(req.params._id);
    var o_id = ObjectID(req.params._id);  //convert to BSON for searchie
    console.log('audioID requested : ' + req.body);
    db.audio_items.find({ "_id" : o_id}, function(err, audio_item) {
        if (err || !audio_item) {
            console.log("error getting audio items: " + err);
        } else {
            //console.log("tryna update " + req.body._id + " to status " + req.body.item_status);
            let timestamp = Math.round(Date.now() / 1000);
            let isPublic = false;
            if (req.body.isPublic != null) {
                isPublic = req.body.isPublic;
            }
            if (req.body.clipDuration != null && req.body.clipDuration != undefined)
            req.body.clipDuration = req.body.clipDuration.toString();
            db.audio_items.update( { _id: o_id }, { $set: { 
                // item_status : req.body.item_status != null ? req.body.item_status : "",
                tags: req.body.tags,
                timekeys : req.body.timekeys,
                samplekeys : req.body.samplekeys,
                user_groups: req.body.user_groups,
                title: req.body.title,
                isPublic : isPublic,
                alt_title: req.body.alt_title,
                alt_artist: req.body.alt_artist,
                alt_source: req.body.alt_album,
                clipDuration : req.body.clipDuration != null ? req.body.clipDuration : "",
                textitemID : req.body.textitemID != null ? req.body.textitemID : "",
                textgroupID : req.body.textgroupitemID != null ? req.body.textgroupitemID : "",
                pictureitemID : req.body.pictureitemID != null ? req.body.pictureitemID : "",
                picturegroupID : req.body.picturegroupID != null ? req.body.picturegroupID : "",
                lastUpdateTimestamp: timestamp,
                lastUpdateUserID: req.session.user._id,
                lastUpdateUserName: req.session.user.userName
            }});
        } if (err) {res.send(error)} else {res.send("updated " + new Date())}
    });
});

app.get('/audioitems/:tag', checkAppID, requiredAuthentication, function(req, res) {
    console.log('tryna return playlist: ' + req.params.tag);
    db.audio.find({tags: req.params.tag, item_status: "public"}).sort({otimestamp: -1}).limit(maxItems).toArray( function(err, audio_items) {
        if (err || !audio_items) {
            console.log("error getting audio items: " + err);

        } else {

            async.waterfall([

                    function(callback){ //randomize the returned array, takes a shake so async it...
                        //audio_items = Shuffle(audio_items);
                        //audio_items.splice(0,audio_items.length - maxItems); //truncate randomized array, take only last 20
                        callback(null);
                    },

                    function(callback) { //add the signed URLs to the obj array
                        for (var i = 0; i < audio_items.length; i++) {

                            var item_string_filename = JSON.stringify(audio_items[i].filename);
                            item_string_filename = item_string_filename.replace(/\"/g, "");
                            var item_string_filename_ext = getExtension(item_string_filename);
                            var expiration = new Date();
                            expiration.setMinutes(expiration.getMinutes() + 1000);
                            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
                            console.log(baseName);
                            var mp3Name = baseName + '.mp3';
                            var oggName = baseName + '.ogg';
                            var pngName = baseName + '.png';
                            var urlMp3 = knoxClient.signedUrl(audio_items[i]._id + "." + mp3Name, expiration);
                            var urlOgg = knoxClient.signedUrl(audio_items[i]._id + "." + oggName, expiration);
                            var urlPng = knoxClient.signedUrl(audio_items[i]._id + "." + pngName, expiration);
                            audio_items[i].URLmp3 = urlMp3; //jack in teh signed urls into the object array
                            audio_items[i].URLogg = urlOgg;
                            audio_items[i].URLpng = urlPng;

                        }
                        console.log('tryna send ' + audio_items.length + 'audio_items ');
                        callback(null);
                    }],

                function(err, result) { // #last function, close async
                    res.json(audio_items);
                    console.log("waterfall done: " + result);
                }
            );
        }
    });

});


app.post('/delete_audio/', requiredAuthentication, function (req, res){

    console.log('tryna delete audioID : ' + req.body._id);
    var audio_id = req.body._id;
    var o_id = ObjectID(audio_id);  //convert to BSON for searchie

    db.audio_items.find({ "_id" : o_id}, function(err, audio_item) {
        if (err || !audio_item) {
            console.log("error getting picture item: " + err);
        } else {
            var item_string_filename = audio_item[0].filename;
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);
            var pngName = baseName + ".png";
            var mp3Name = baseName + ".mp3";
            var oggName = baseName + ".ogg";

            var params = {
                Bucket: 'servicemedia', // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + item_string_filename // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item[0]._id + "." + pngName // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item[0]._id + "." + mp3Name // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + audio_item[0]._id + "." + oggName // required
                        }
                        // ... more items ...
                    ],
                    Quiet: true || false
                }
                //MFA: 'STRING_VALUE',
            };

            s3.deleteObjects(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    res.send(err);
                    // an error occurred
                }
                else {
                    console.log(data);
                    db.audio_items.remove( { "_id" : o_id }, 1 );
                    res.send("deleted");
                    // successful response
                }
            });

        }
    });
});
app.post('/delete_model/', requiredAuthentication, function (req, res){
    console.log("tryna delete model: " + req.body);

    var pic_id = req.body._id;
    var o_id = ObjectID(pic_id);  //convert to BSON for searchie

    db.models.findOne({ "_id" : o_id}, function(err, model) {
        if (err || !model) {
            console.log("error getting picture item: " + err);
        } else {
            var item_string_filename = model.filename;
            // item_string_filename = item_string_filename.replace(/\"/g, "");

            var params = {
                Bucket: 'servicemedia', // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key:  "users/" + req.session.user._id.toString() + "/gltf/" + item_string_filename // required
                        }
                    ],
                    Quiet: true || false,
                }
            };

            s3.deleteObjects(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    res.send(err);
                    // an error occurred
                }
                else {
                    db.models.remove( { "_id" : o_id }, 1 );
                    res.send("delback");
                }
            });

        }
    });
});
app.post('/delete_video/', requiredAuthentication, function (req, res){
    // console.log(req.body);

    console.log('tryna delete videoID : ' + req.body._id);
    var pic_id = req.body._id;
    var o_id = ObjectID(pic_id);  //convert to BSON for searchie

    db.video_items.findOne({ "_id" : o_id}, function(err, pic_item) {
        if (err || !pic_item) {
            console.log("error getting picture item: " + err);
        } else {
            var item_string_filename = pic_item.filename;
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);


            var params = {
                Bucket: 'servicemedia', // required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key:  "users/" + req.session.user._id.toString() + "/" + item_string_filename // required
                        }
                    ],
                    Quiet: true || false,
                }
                //MFA: 'STRING_VALUE',
            };

            s3.deleteObjects(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    res.send(err);
                    // an error occurred
                }
                else {
                    db.video_items.remove( { "_id" : o_id }, 1 );
                    res.send("deleted");
                }
            });

        }
    });
});
// app.post('/delete_picture/', checkAppID, requiredAuthentication, function (req, res){
app.post('/delete_picture/', requiredAuthentication, function (req, res){ //TODO check user? or acl? another auth key?
    // console.log(req.body);

    console.log('tryna delete pictureID : ' + req.body._id);
    var pic_id = req.body._id;
    var o_id = ObjectID(pic_id);  //convert to BSON for searchie

    db.image_items.find({ "_id" : o_id}, function(err, pic_item) {
        if (err || !pic_item) {
            console.log("error getting picture item: " + err);
        } else {
            var item_string_filename = pic_item[0].filename;
            item_string_filename = item_string_filename.replace(/\"/g, "");
            var item_string_filename_ext = getExtension(item_string_filename);
            var baseName = path.basename(item_string_filename, (item_string_filename_ext));
            console.log(baseName);
            var thumbName = 'thumb.' + baseName + item_string_filename_ext;
            var halfName = 'half.' + baseName + item_string_filename_ext;
            var quarterName = 'quarter.' + baseName + item_string_filename_ext;
            var standardName = 'standard.' + baseName + item_string_filename_ext;

            var params = {
                Bucket: 'servicemedia',// required
                Delete: { // required
                    Objects: [ // required
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + item_string_filename // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + pic_item[0]._id + "." + thumbName // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + pic_item[0]._id + "." + quarterName // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + pic_item[0]._id + "." + halfName // required
                        },
                        {
                            Key: "users/" + req.session.user._id.toString() + "/" + pic_item[0]._id + "." + standardName // required
                        }
                        // ... more items ...
                    ],
                    Quiet: true || false
                }
                //MFA: 'STRING_VALUE',
            };

            s3.deleteObjects(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    res.send(err);
                } else {
                    db.image_items.remove( { "_id" : o_id }, 1 );  // TODO what if files are gone but db reference remains? 
                    res.send("deleted");
                }
            });
        }
    });
});
/*
app.get('/tranzfer_util_number_one', function (req, res){
    async.waterfall([
            function(arg1, callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";
                itemTitle = fname;

                db.audio_items.save(
                    {type : "uploadedUserAudio",
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : itemTitle,
                        artist : parsedTags.artist.toString(),
                        album :  parsedTags.album.toString(),
                        year :  parsedTags.year.toString(),
                        filename : fnameOriginal,
                        item_type : 'audio',
                        //alt_title : req.files.audio_upload.title,
                        //alt_artist : req.files.audio_upload.artist,
                        //alt_album : req.files.audio_upload.album,
                        tags: req.body.tags,
                        item_status: "private",
                        otimestamp : ts,
                        ofilesize : fsize},
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('audio item not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
//                res.send('new item id: ' + item_id);
                            callback(null,item_id);
                        }
                    }
                );
            },

            function(arg1, callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";
                itemTitle = fname;

                db.audio_items.save(
                    {type : "uploadedUserAudio",
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : itemTitle,
                        artist : parsedTags.artist.toString(),
                        album :  parsedTags.album.toString(),
                        year :  parsedTags.year.toString(),
                        filename : fnameOriginal,
                        item_type : 'audio',
                        //alt_title : req.files.audio_upload.title,
                        //alt_artist : req.files.audio_upload.artist,
                        //alt_album : req.files.audio_upload.album,
                        tags: req.body.tags,
                        item_status: "private",
                        otimestamp : ts,
                        ofilesize : fsize},
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('audio item not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
//                res.send('new item id: ' + item_id);
                            callback(null,item_id);
                        }
                    }
                );
            }
        ], //end async flow

        function(err, result) { // #last function, close async
            console.log("waterfall done: " + result);
            //  res.redirect('/upload.html');
            res.end(result);
        });

});
*/

app.post('/uploadaudio', upload.single('file'), checkAppID, requiredAuthentication, function (req, res) {
    console.log("uploadaudio req.headers: " + JSON.stringify(req.headers));
    /*
     req.files.audio_upload.on('progress', function(bytesReceived, bytesExpected) {
     console.log(((bytesReceived / bytesExpected)*100) + "% uploaded");
     res.send(((bytesReceived / bytesExpected)*100) + "% uploaded");
     });
     req.files.audio_upload.on('end', function() {
     console.log(req.files);
     res.send("upload complete, now processing...");
     });
     */
//    res.connection.setTimeout(0);
    console.log("tryna upload... req.file = " + req.file );

    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    var ts = Math.round(Date.now() / 1000);
//            var fname = req.files.audio_upload.name;
    var fname = req.file.originalname.toLowerCase();
//            fname =  fname.replace(/[-\/\\^$*+?()|[\]{}]/g, "_");
    var fname_ext = getExtension(fname);
    fname = fname.substr(0, fname.lastIndexOf('.'));
    fname = nameCleaner(fname);
    fname = fname + fname_ext;
    var fnameOriginal = fname;
    var fsize = req.file.size;
    console.log("filename: " + fname);
    var fpath = req.file.path;
    console.log("filepath: " + fpath);
//            var fpath = req.files.audio_upload.path;
    var fpath = req.file.path;
    var parsedTags = {};
    //var item_id = "";

    async.waterfall([ //flow control for functions below, do one at a time, and pass vars to next as needed

            function(callback) { //check for proper extensions

                console.log("extension of " + fname + "is " + fname_ext);
                if (fname_ext === ".ogg" || fname_ext === ".mp3" || fname_ext === ".mp4" || fname_ext === ".aiff" || fname_ext === ".aif" || fname_ext === ".wav" ) {
                    callback(null);
                } else {
                    callback(err);
                    res.send("bad file");
                }
            },

            function(callback) { //#1 - parse ID3 tags if available
                if (fname_ext == ".mp33") {
                    console.log("tryna parse id3 tags");
//                    var parser = new mm(fs.createReadStream(fpath));
                var readableStream = fs.createReadStream(fpath);
                var parser = mm(readableStream, function (err, metadata) {
                        if (err) {
                            readableStream.close();
                            callback(null, null);
                            } else if (metadata != null && metadata != undefined) {
                                parsedTags = metadata;
                                readableStream.close();
                                console.log("mm parsing result: " + metadata);
                                callback(null, parsedTags);
                            } else {
                                readableStream.close();
                                callback(null , null);
                            }
                    });
//                var parser = new mm(req.file);
//                    parser.on('metadata', function (result) {
//                        parsedTags = result;
//                        console.log("mm parsing result: " + result);
//                        callback(null, parsedTags);
//                    });
//                    parser.on('error', function (err) {
////                    parsedTags = result;
//                        console.log(err);
//
//                        callback(null, null);
//                    });
                } else {
                    callback(null, null);
                }
//                    console.log(parsedTags);
            },


            function(pTags, callback){ //#2 assign fields and parsed tags
                if (pTags != null && pTags != undefined) {
                    console.log("parsedTags = " + pTags.toString());
                    //res.json(JSON.stringify(pTags.title.toString()));
                    if (pTags.title != null) {
                        fname = pTags.title;

                    }
                } else {
                    parsedTags = {};
                    parsedTags.album = "";
                    parsedTags.artist = "";
                    parsedTags.year = "";
                    pTags = parsedTags;

                }

                callback(null, pTags);
            },

            function(mmTags, callback) { //check that we gotsa bucket with this user's id

                // var bucketFolder = 'elnoise1/' + req.session.user._id.toString() + '/';

                var bucketFolder = 'servicemedia';
                console.log("butcketFOlder: " + bucketFolder);
                s3.headBucket({Bucket:bucketFolder, Delimiter: req.session.user._id.toString()},function(err,data){
                    if(err){
//                        s3.createBucket({Bucket:bucketFolder},function(err2,data){
//                            if (err2){
//                                console.log(err2);
//                                callback(err2);
//                            } else {
                                console.log("can't find bucket " + bucketFolder);
                                callback(null, bucketFolder);
//                            }
//                        });
                    } else {
                        console.log("Bucket exists and we have access");
                        var params = {
                            Bucket: bucketFolder,
                            Delimiter: req.session.user._id.toString(),
                            Key: fname
                        }
                        s3.headObject(params, function (err, metadata) {
                            if (err && err.code === 'NotFound') {
                                // Handle no object on cloud here
                                callback(null, bucketFolder);
                            } else {
                                fname = fname.substr(0, fname.lastIndexOf('.'));
                                fname = fname + Date.now() + fname_ext;
                                callback(null, bucketFolder);
                            }
                        });


                    }
                });

            },


            function(theBucketFolder, callback) { //upload orig file to s3
                //knoxClient.putFile(fpath, fname, function(err, rez) { //just use userid  here, audioID added at transloadit
                //console.log(fname + ' ' + knoxClient.putFile.progress);
                var stream = fs.createReadStream(fpath);
//       var data = {Bucket: theBucketFolder, Key: fname, Body: stream};
                var params = {Bucket: theBucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fnameOriginal, Body: stream};

                console.log("orignal file to: " + JSON.stringify(params));

                s3.putObject(params, function(err, data) {
                    if (err) {
                        console.log("Error uploading data: ", err);
                        stream.close();
                        callback(err);

                    } else {
                        console.log("Successfully uploaded data to " + theBucketFolder);
//              res.send('original file in s3');
                        stream.close();
                        callback(null, 'uploaded orig file');
                    }
                });


            },

            function(arg1, callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";
                itemTitle = fname;

                db.audio_items.save(
                    {type : "uploadedUserAudio",
                        userID : req.session.user._id.toString().toString(),
                        username : req.session.user.userName,
                        title : itemTitle,
                        artist : parsedTags.artist.toString(),
                        album :  parsedTags.album.toString(),
                        filename : fnameOriginal,
                        item_type : 'audio',
                        //alt_title : req.files.audio_upload.title,
                        //alt_artist : req.files.audio_upload.artist,
                        //alt_album : req.files.audio_upload.album,
                        tags: req.body.tags,
                        item_status: "private",
                        otimestamp : ts,
                        ofilesize : fsize},
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('audio item not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
//                res.send('new item id: ' + item_id);
                            callback(null,item_id);
                        }
                    }
                );
            },

            function(itemID, callback) {//get a URL of the original file now in s3, to send down the line
                var bucketFolder = 'servicemedia';
                //var tempURL = knoxClient.signedUrl(fname, expires);
                var params = {Bucket: bucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fnameOriginal };

                s3.getSignedUrl('getObject', params, function (err, url) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        console.log("The URL is", url);
                        callback(null, url, itemID);
                    }
                });

            },

            function(tUrl, iID, callback) { //send to transloadit..
                console.log("transcodeAudioURL request: " + tUrl);
                var encodeAudioUrlParams = {
                    steps: {
                        ':orig': {
                            robot: '/http/import',
                            url : tUrl
                        }
                    },
                    'template_id': '84da9df057e311e4bdecf5e543756029',
                    'fields' : { audio_item_id : iID,
                        user_id : req.session.user._id.toString()
                    }
                };

                transloadClient.send(encodeAudioUrlParams, function(ok) {
                    console.log('Success: ' + JSON.stringify(ok));
                }, function(err) {
                    console.log('Error: ' + JSON.stringify(err));
                    callback(err);
                });
                callback(null, iID);

            },

            function(itemID2, callback) {  //gen a short code and insert //nahh

                tempID = "";
                callback(null,tempID);
            }
        ], //end async flow

        function(err, result) { // #last function, close async
            console.log("waterfall done: " + result);
            //  res.redirect('/upload.html');
            res.end(result);
        }
    );
}); //end app.post /upload


app.post('/uploadpicture', checkAppID, requiredAuthentication, upload.single('file'), function (req, res) {

    console.log("uploadpicture headers: " + JSON.stringify(req.headers));
    console.log("req.file " + req.file);
//    console.log("req.files " + req.files);
//    console.log("req.body: " + req.body);

    var returnString = "";
//            var uName = req.body.username;
//            var uPass = req.body.userpass;
    var type = req.body.pictype;
    var userID = req.body.userID;
    var sceneID = req.body.sceneID;
    var postcardForScene = req.body.postcardForScene;
    var pictureForScene = req.body.pictureForScene;
            var tags = req.body.tags;
    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    console.log("uploadpicture req.body.userID " + req.body.userID );
    var ts = Math.round(Date.now() / 1000);
//    if (req.file.originalname == undefined) {
//        var fname = req.filename.toLowerCase();
//    }
    var fname = req.file.originalname.toLowerCase();
    fname = fname.replace(/[-\/\\^$*+?!()|[\]{}\s]/g, "_");
//    var fsize = req.files.picture_upload.size;
    var fsize = req.file.size;
    console.log("filename: " + fname);
//    var fpath = req.files.picture_upload.path;
    var fpath = req.file.path;
    var parsedTags = {};

    //var item_id = "";

    async.waterfall([ //flow control for functions below, do one at a time, and pass vars to next as needed

            function(callback) { //check for proper extensions
                var fname_ext = getExtension(fname);
                console.log("extension of " + fname + "is " + fname_ext);
                if (fname_ext === ".jpeg" || fname_ext === ".jpg" || fname_ext === ".JPG" || fname_ext === ".png" || fname_ext === ".gif") {
                    if (fname_ext === ".jpeg" || fname_ext === ".jpg" || fname_ext === ".JPG") {
                        fname = fname.substr(0, fname.lastIndexOf(".")) + ".jpg";
                        }
                    callback(null);
                } else {
                    callback(error);
                    res.end("bad file");
                }
            },

            function(callback) { //check that we gotsa bucket for this user

                var bucketFolder = 'servicemedia';
                console.log(bucketFolder);
                s3.headBucket({Bucket:bucketFolder},function(err,data){
                    if(err){
                        console.log("bucket creation");
                        callback(null, bucketFolder);
                    } else {
                        console.log("Bucket exists and we have access");
                        callback(null, bucketFolder);
                    }
                });
            },

            function(theBucketFolder, callback) { //upload orig file to s3

                var stream = fs.createReadStream(fpath);
                var keymod = "original_" + fname; // TODO prevent collisions!  maybe a short timestamp mod of original name
                var data = {Bucket: theBucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fname, Body: stream};
                console.log("orignal file to: " + data);
                s3.putObject(data, function(err, data) {
                    if (err) {
                        stream.close();
                        console.log("Error uploading data: ", err);
                        callback(err);
                    } else {
                        stream.close();
                        console.log("Successfully uploaded data to " + theBucketFolder);
                        callback(null, 'uploaded orig file');
                    }
                });
            },

            function(arg1, callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";

                db.image_items.save(
                    {type : type,
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : "",

                        filename : fname,
                        item_type : 'picture',
                        //alt_title : req.files.audio_upload.title,
                        //alt_artist : req.files.audio_upload.artist,
                        //alt_album : req.files.audio_upload.album,
                        tags: req.body.tags,
                        item_status: "private",
                        //        postcardForScene : req.body.postcardForScene,
                        otimestamp : ts,
                        ofilesize : fsize},
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('picture not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
                            callback(null,item_id);
                        }
                    }
                );
            },

            function (itemID, callback) { //if the post has postcard or pic scene data, update that scene (* using short code here, bad idea?) //TODO add equirect for skybox

                if (pictureForScene != null) {
                    var shortID = pictureForScene;
                    console.log("tryna update scene pic for " + shortID);
//                db.scenes.update({short_id: shortID}, {$push: {scenePictures: itemID}} );
                    db.scenes.findOne({short_id: shortID}, function (err, scene) {
                        if (err || !scene) {
                            console.log("error getting scene 5: " + err);
                            callback(null, itemID);
                        } else {
                            var scenePics = [];
                            if (scene.scenePictures != null) {
                                scenePics = scene.scenePictures;
                            }
                            console.log("XXX scenePics: " + scenePics);
                            scenePics.push(itemID);
                            db.scenes.update({ short_id: shortID }, { $set: {scenePictures: scenePics}
                            });
                            callback(null, itemID);
                        }
                    });

                } else if (postcardForScene != null) {
                    var shortID = postcardForScene;
                    db.scenes.findOne({short_id: shortID}, function (err, scene) {
                        if (err || !scene) {
                            console.log("error getting scene 5: " + err);
                            callback(null, itemID);
                        } else {
                            var scenePostcards = [];
                            if (scene.scenePostcards != null) {
                                scenePostcards = scene.scenePostcards;
                            }
                            console.log("XXX scenePostcards: " + scenePostcards);
                            scenePostcards.push(itemID);
                            db.scenes.update({ short_id: shortID }, { $set: {scenePostcards: scenePostcards}
                            });
                            callback(null, itemID);
                        }
                    });
                    // callback(null, itemID);
                } else {
                    callback(null, itemID);
                }
            },


            function(itemID, callback) {//get a URL of the original file now in s3, to send down the line
                var bucketFolder = 'servicemedia';
                //var tempURL = knoxClient.signedUrl(fname, expires);
                var keymodd = "original_" + fname;
                var params = {Bucket: bucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + fname };

                s3.getSignedUrl('getObject', params, function (err, url) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        console.log("The URL is", url);
                        callback(null, url, itemID);
                    }
                });
            },
            function(tUrl, iID, callback) { //send to transloadit..
                console.log("transcodePictureURL request: " + tUrl);
                var encodePictureUrlParams = {
                    steps: {
                        ':orig': {
                            robot: '/http/import',
                            url : tUrl
                        }
                    },
                    'template_id': 'f9e7db371a1a4fd29022cc959305a671',
                    'fields' : { image_item_id : iID,
                        user_id : req.session.user._id.toString()
                    }
                };
                transloadClient.send(encodePictureUrlParams, function(ok) {
                    console.log('transloadit Success: ' + encodePictureUrlParams);
                }, function(err) {
                    console.log('transloadit Error: ' + JSON.stringify(err));
                    callback(err);
                });
                callback(null, iID);

            },
            function(itemID2, callback) {  //gen a short code and insert //not for picss

                callback(null,itemID2);
            }
        ], //end async flow

        function(err, result) { // #last function, close async
            console.log("transcode waterfall done: " + result);
            //  res.redirect('/upload.html');
            res.end(result);
        }
    );
}); //end app.post /upload



app.post('/uploadedvideo', upload.single('file'), checkAppID, requiredAuthentication, function (req, res) {

    console.log("uploadvideo headers: " + JSON.stringify(req.headers));
    var returnString = "";
    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    var ts = Math.round(Date.now() / 1000);
//    var fname = req.files.file.name.toLowerCase();
//    fname = fname.replace(/[-\/\\^$*+?()|[\]{}]/g, "_");
    var fname = req.file.originalname;
//    var fname_ext = getExtension(fname);
//    fname = fname.substr(0, fname.lastIndexOf('.'));
//    fname = nameCleaner(fname);
//    fname = fname + fname_ext;

    console.log("filename: " + fname);
//    var fpath = req.files.file.path;
//    var parsedTags = {};
    //var item_id = "";

    async.waterfall([ //flow control for functions below, do one at a time, and pass vars to next as needed

            function(callback) { //check that the bucket and file exist

                var bucketFolder = 'servicemedia.' + req.session.user._id.toString();
                console.log(bucketFolder);
                s3.headBucket({Bucket:bucketFolder},function(err,data){
                    if(err){
                        s3.createBucket({Bucket:bucketFolder},function(err2,data){
                            if (err2){
                                console.log(err2);
                                callback(err2);
                            } else {
                                console.log("bucket creation");
                                callback(null, bucketFolder);
                            }
                        });
                    } else {
                        console.log("Bucket exists and we have access");
                        var params = {
                            Bucket: bucketFolder,
                            Key: fname
                        }
                        s3.headObject(params, function (err, metadata) {
                            if (err && err.code === 'NotFound') {
                                // Handle no object on cloud here
                                console.log(err);
                                callback(err);
                                res.send("no");
                            } else {
                                console.log(metadata);
                                callback(null, bucketFolder);
                            }
                        });
                    }
                });

            },

            function(bFolder,  callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";
                console.log("video upload complete, saving to mongo..");
                db.video_items.save(
                    {
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : "",
                        filename : fname,
                        item_type : 'video',
                        item_status: "private"

                    },
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('video not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
                            callback(null, bFolder, item_id);
                        }
                    }
                );
            }

        ], //end async flow

        function(err, result) { // #last function, close async
            if (err != null) {
                res.end(err);
            } else {
                console.log("waterfall done: " + result);
                //  res.redirect('/upload.html');
                res.end(result);
            }
        }
    );
});

app.post('/uploadvideo', upload.single('file'), checkAppID, requiredAuthentication, function (req, res) {

    console.log("uploadvideo headers: " + JSON.stringify(req.headers));
    var returnString = "";
    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);
    var ts = Math.round(Date.now() / 1000);
//    var fname = req.files.file.name.toLowerCase();
////    fname = fname.replace(/[-\/\\^$*+?()|[\]{}]/g, "_");
//    var fname_ext = getExtension(fname);
//
//    fname = nameCleaner(fname);
//    fname = fname + fname_ext;
    var fname = req.file.originalname.toLowerCase();
    var fname_ext = getExtension(fname);
    fname = fname.substr(0, fname.lastIndexOf('.'));
    fname = nameCleaner(fname);
    fname = fname + fname_ext;
    var fsize = req.file.size;
    console.log("filename: " + fname);
    var fpath = req.file.path;
    var parsedTags = {};
    //var item_id = "";

    async.waterfall([ //flow control for functions below, do one at a time, and pass vars to next as needed

            function(callback) { //check for proper extensions
                console.log("extension of " + fname + "is " + fname_ext);
                if (fname_ext === ".mp4") {
                    callback(null);
                } else {
                    callback(error);
                    res.end("no");
                }
            },

            function(callback) { //check that we gotsa bucket for this user

                var bucketFolder = 'servicemedia';
                console.log(bucketFolder);
                s3.headBucket({Bucket:bucketFolder, Delimiter: "users/" + req.session.user._id.toString()},function(err,data){
                    if(err){
//                        s3.createBucket({Bucket:bucketFolder},function(err2,data){
//                            if (err2){
//                                console.log(err2);
//                                callback(err2);
//                            } else {
                                console.log("bucket creation");
                                callback(null, bucketFolder);

                    } else {
                        console.log("Bucket exists and we have access");
                        callback(null, bucketFolder);
                    }
                });

            },

//            function(theBucketFolder, callback) { //upload orig file to s3 - TODO Get the antic0llidr stuff from the audio version
//
//                var stream = fs.createReadStream(fpath);
//                var params = {Bucket: theBucketFolder, Key: fname, Body: stream};
//
//                console.log("orignal file to: " + JSON.stringify(params));
//                s3.upload(params, function(err, data) {
//                    if (err) {
//                        console.log("Error uploading data: ", err);
//                        callback(err);
//                    } else {
//                        console.log("Successfully uploaded data to " + theBucketFolder);
////              res.send('original file in s3');
//                        callback(null, 'uploaded orig file');
//                    }
//                });
//            },

            function(bFolder,  callback) { //#3 save data to mongo, get object ID

                var itemTitle = "";
                console.log("video upload complete, saving to mongo..");
                db.video_items.save(
                    {
                        userID : req.session.user._id.toString(),
                        username : req.session.user.userName,
                        title : "",
                        filename : fname,
                        item_type : 'video',
                        tags: req.body.tags,
                        item_status: "private",
//        postcardForScene : req.body.postcardForScene,
                        otimestamp : ts,
                        ofilesize : fsize},
                    function (err, saved) {
                        if ( err || !saved ) {
                            console.log('video not saved..');
                            callback (err);
                        } else {
                            var item_id = saved._id.toString();
                            console.log('new item id: ' + item_id);
                            callback(null, bFolder, item_id);
                        }
                    }
                );
            },
            function(theBucketFolder, item_id, callback) { //upload orig file to s3 - TODO Get the antic0llidr stuff from the audio version

                var stream = fs.createReadStream(fpath);
                var params = {Bucket: theBucketFolder, Key: "users/" + req.session.user._id.toString() + "/" + item_id + "." + fname, Body: stream};

                console.log("orignal file to: " + JSON.stringify(params));
                s3.upload(params, function(err, data) {
                    if (err) {
                        console.log("Error uploading data: ", err);
                        stream.close();
                        callback(err);
                    } else {
                        console.log("Successfully uploaded data to " + theBucketFolder);
//              res.send('original file in s3');
                        stream.close();
                        callback(null, 'uploaded orig file');
                    }
                });
            }


        ], //end async flow

        function(err, result) { // #last function, close async
            if (err != null) {
                res.end(err)
            } else {
                console.log("waterfall done: " + result);
                //  res.redirect('/upload.html');
                res.end(result);
            }
        }
    );
});

function Shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function GenerateName () {
    array1 = [];
    array2 = [];
    array3 = [];
    index1 = -1;
    index2 = -1;
    index3 = -1;
    name1 = "";
    name2 = "";
    name3 = "";
    min = 0;
    db.lexicons.findOne({name: "nameArrays"}, function (err, items) {
        if (err || !items) {
            console.log("error getting scene 5: " + err);
            return (err);
        } else {
            array1 = items.adjectives;
            array2 = items.colors;
            array3 = items.animals;
            // console.log("array 1" + array1);
            index1 = Math.floor(Math.random() * array1.length);
            name1 = UppercaseFirst(array1[index1]);
            index2 = Math.floor(Math.random() * array2.length);
            name2 = UppercaseFirst(array2[index2]);
            index3 = Math.floor(Math.random() * array3.length);
            name3 = UppercaseFirst(array3[index3]);
            const nameString = name1 + " " + name2 + " " + name3;
            console.log("fresh name : " +  name1 +" " + name2 +" " + name3);
            return nameString;
        }
    });
    // var text1 = Resources.Load<TextAsset>("adjectives");
    // string string1 = text1.text;
    // string[] array1 = string1.Split(new string[] { "\n" }, StringSplitOptions.None); 
    // int index1 = UnityEngine.Random.Range(0, array1.Length);

    // var text2 = Resources.Load<TextAsset>("colors");
    // string string2 = text2.text;
    // string[] array2 = string2.Split(new string[] { "\n" }, StringSplitOptions.None); 
    // int index2 = UnityEngine.Random.Range(0, array2.Length);

    // var text3 = Resources.Load<TextAsset>("animals");
    // string string3 = text3.text;
    // string[] array3 = string3.Split(new string[] { "\n" }, StringSplitOptions.None); 
    // int index3 = UnityEngine.Random.Range(0, array3.Length);
   
};

function UppercaseFirst(s) {
// Check for empty string.
// console.log("checkin s " + s);
// if (s.Length < 2) {
//     return s.Empty;
// }
if (s != undefined) {
const ufirst = s.charAt(0).toUpperCase() + s.slice(1);
// console.log("to upperfirst " + ufirst);
// Return char and concat substring.
return ufirst;
    } else {
        return "*";
    }
};

// function getExtension(filename) {
//     var i = filename.lastIndexOf('.');
//     return (i < 0) ? '' : filename.substr(i);
// }
