#!/usr/bin/nodejs

// -------------- load packages -------------- //
var cookieSession = require('cookie-session');
var express = require('express');
var simpleoauth2 = require("simple-oauth2");
var app = express();
var request = require('request');
var path = require('path');
var fs = require('fs');
var filearr = [];
var mysql = require('mysql');


app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/python', express.static(path.join(__dirname, 'python')));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.use('/venv/bin', express.static(path.join(__dirname, 'python_exe')));
var hbs = require('hbs');

var private_vars = require( path.join(__dirname, '..', 'private', 'private_vars.js') );
var ion_username;

// this is so that we can extract form parameters in the post methods
var bodyParser = require('body-parser');

// we'll use this for python
var child_process = require('child_process');
python_exe = "python3";

pythonFile = path.join(__dirname, 'lyricalPlotting.py');
pythonFile2 = path.join(__dirname, 'test.py');

// -------------- express initialization -------------- //

// Here, we set the port (these settings are specific to our site)
app.set('port', process.env.PORT || 8080 );

// This is included to while express is sitting behind a proxy
app.set('trust proxy', 1); // trust first proxy 

app.set('view engine', 'hbs');                      //handlebars (for templating)
app.use(bodyParser.urlencoded({ extended: false})); //body parser (for handling post requests)
app.use(bodyParser.json());

var pool  = mysql.createPool(private_vars.sql_params);

app.use(cookieSession({
  name: 'session',
  keys: ['hello', 'goodbye']
}));

var ion_client_id = 'qpmKl7JNdHEjOU2PAUh5J1sJEPGFtBsl0LoSRxS5';
var ion_client_secret = 'FvyPnWTFEYvrvneiSxtST7r28EJY1IPo3nVLXsHW5N4y88Kdushr3RusOsY7gddCb6xqPoZUNMJNSKoWxXERajPTy51YYEWuYQywagMIGjmv67zHURzBVUxPs4V562Hi';
var ion_redirect_uri = 'https://user.tjhsst.edu/songs/login';

// Here we create an oauth2 variable that we will use to manage out OAUTH operations

var oauth2 = simpleoauth2.create({
  client: {
    id: ion_client_id,
    secret: ion_client_secret,
  },
  auth: {
    tokenHost: 'https://ion.tjhsst.edu/oauth/',
    authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
    tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
  }
});

// This is the link that will be used later on for logging in. This URL takes
// you to the ION server and asks if you are willing to give read permission to ION.

var authorizationUri = oauth2.authorizationCode.authorizeURL({
    scope: "read",
    redirect_uri: ion_redirect_uri
});



// -------------- express 'get' handlers -------------- //
// These 'getters' are what fetch your pages


app.get('/', function (req, res, next) {
    if (typeof req.session.token != 'undefined') {
        var access_token = req.session.token.token.access_token;
        var my_ion_request = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
        request.get( {url:my_ion_request}, function (e, r, body) {
            console.log("middle")
            var res_object = JSON.parse(body);
            ion_username = res_object['ion_username']
            var test = {
                ion_username: res_object['ion_username']
            };
            res.render('index', test);
            
        });
        
    
        
    } else {
        // ... if the user has not logged in, we'll send them to a page 
        //     asking them to log in
        var output_string = "";
        output_string += "<!doctype html>\n";
        output_string += "<html><head></head><body>\n";
        output_string += "<a href=";
        output_string += authorizationUri;
        output_string += ">Log in with ION!</a>";
        output_string += "</body></html>";

        // send away the output
        res.send(output_string);
    }
});


app.get('/login', function (req, res, next) {
    if (typeof req.query.code != 'undefined') {
        var theCode = req.query.code 

        var options = {
            code: theCode,
            redirect_uri: ion_redirect_uri
         };

        oauth2.authorizationCode.getToken(options, function (error, result) {
            if (error) {
                console.log(error);
                return res.send('Authentication failed');
            }
            var token = oauth2.accessToken.create(result);
            req.session.token = token;
            res.redirect('https://user.tjhsst.edu/songs');
        });
    } else {
        res.redirect('https://user.tjhsst.edu/songs');
    }
         
});









app.get('/artist', function(req, res){
    
    
    // there exists req.query.menu_item because there is an input named
    //    'menu_item' in the form
    console.log("artist");
    var menu_item = req.query.menu_item//.toLowerCase();
    
    
    strarr = menu_item.split(" ")
    strarrnew = []
    
    for (var i =0;i<strarr.length; i++)
    {
        strarrnew.push(strarr[i].substring(0,1).toUpperCase() + strarr[i].substring(1,).toLowerCase())
    }
    
    menu_item = strarrnew.join(" ")
    
    
    
    
    console.log(menu_item);
    
    var arr_data = [menu_item];
    var jsonData = JSON.stringify(arr_data);

    feed_dict = { input: jsonData };
    
    py = child_process.spawnSync(python_exe, [pythonFile], feed_dict);
    //console.log("after response");

    //console.log(py['stderr'].toString());
    py_response = py['stdout'].toString();
    console.log("py_2response",py_response);
    
    //console.log("only pyresonse")
    //console.log(py_response)
    var data = JSON.parse(py_response);
    //data['ion_username'] = ion_username;
    console.log("data",data);
    
    
    /*
    
    var data = { 
        ion_username:ion_username,
        albums: [ { 
            name:"To Pimp a butterfly",
            trackList: "Front End Technical Lead",
            intensity: "gazraa" 
        }, {
            name:"maad city",
            trackList: "Photographer",
            intensity: "photobasics"
        }]
    }; */
    
    
    
    
    
    
    
    
    
    
    var newuser = {
        artist:menu_item,
        username:ion_username
    };
    pool.query('INSERT INTO prevVisit SET ?', newuser, function (error, results, fields) {
        if (error) throw error;
        
        console.log("between pool queries");
        console.log(menu_item);
        pool.query('SELECT artist, rating FROM getRating WHERE artist=?', menu_item, function (error, results, fields) {
                var arr = [];
                var sum = 0;
                for(var i=0; i<results.length; i++) 
                {
                   sum+=results[i].rating;
                } 
                var float_num = sum/results.length;
                data["rating"] = float_num.toFixed(2);

                pool.query('SELECT artist, username FROM prevVisit WHERE artist=?', menu_item, function (error, results, fields) {
                    if (error) throw error;
                    console.log("AFTER ERROR");
                    for(var i=0; i<results.length; i++) {
                    // tease some data out 
                        if (arr.indexOf(results[i].username)==-1)
                        {
                            arr.push(results[i].username);
                        }
                    }
                    var str = "Users who are interested in " + menu_item.substring(0,1).toUpperCase() + menu_item.substring(1,).toLowerCase() + ": ";
                    console.log("STR");
                    for(var j=0; j<arr.length; j++) {
                        if (j!=arr.length-1) str=str+arr[j]+", ";
                        else str = str+arr[j]
                    }
                    
                    data["interestedUsers"] = str;
                    console.log(data); 
                      
                      
                    res.render('index',data);

                
                    });
            });
        
    });
                

});


app.get('/rating', function(req, res){
    
    
    // there exists req.query.menu_item because there is an input named
    //    'menu_item' in the form
    var menu_item = req.query.new_menu_item.toLowerCase();
    var second_item = req.query.second_item;
    var data = {
        artist:menu_item,
        rating:second_item
    };
    pool.query('INSERT INTO getRating SET ?', data, function (error, results, fields) {
        if (error) throw error;
        
    });
    res.send("Thanks!")
                

});

// -------------- listener -------------- //
// // The listener is what keeps node 'alive.' 

var listener = app.listen(app.get('port'), function() {
  console.log( 'Express server started on port: '+listener.address().port );
});