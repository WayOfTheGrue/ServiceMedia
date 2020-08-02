// copyright servicemedia.net 2020 all rights reserved

    // 1. amirite checks authentication and pops some UI
    // 2. bigSwitch does "routing" and calls "controller" functions
    // 3. controller functions fetch json and generate html
    // 4. dom elements are selected and updated with new stuff as needed

    var cookie = Cookies.get();
    var type = getParameterByName("type", window.location.href); //these params used for routing in bigSwitch
    var appid = getParameterByName("appid", window.location.href);
    var uid = getParameterByName("uid", window.location.href);
    var itemid = getParameterByName("iid", window.location.href);
    var mode = getParameterByName("mode", window.location.href);
    var parent = getParameterByName("parent", window.location.href);
    var aframe_enviro = getParameterByName("env", window.location.href);
    var userid = "";
    var username = "";
    var auth = "";
    var apps = {};
    amirite();
    function amirite () {
        if (cookie != null && cookie._id != null) {
        // console.log("gotsa cookie: " + cookie._id );
        $.get( "/ami-rite/" + cookie._id, function( data ) {
            // console.log("amirite : " + JSON.stringify(data.domains));
            if (data == 0) {
                window.location.href = './login.html';
            } else {
            var userNameLabel = document.getElementById('userNameLabel');
            username = data.userName;
            userid = data.userID;
            auth = data.authLevel;
            apps = data.apps;
            domains = data.domains;
            userNameLabel.innerText = username;
            let html = "";
            if (apps != null && apps != undefined && apps.length > 0) {
                $("#appNav").show();
                html = "<hr class=\x22sidebar-divider\x22><div class=\x22sidebar-heading\x22>Apps</div>";
                for (let i = 0; i < apps.length; i++) {
                    if (apps[i].appStatus != "Inactive") {
                    html = html + "<li class=\x22nav-item\x22>" +
                    "<a class=\x22nav-link collapsed\x22 href=\x22index.html?type=appdash&appid="+ apps[i]._id +"\x22>" +
                    // "<a class=\x22nav-link collapsed\x22 href=\x22#\x22 data-toggle=\x22collapse\x22 data-target=\x22#collapse"+ i.toString() +"\x22 aria-expanded=\x22true\x22 aria-controls=\x22collapse"+ i.toString() +"\x22>" +    
                    "<i class=\x22fas fa-fw fa-mobile\x22></i>" +
                    // "<a class=\x22collapse-item\x22 href=\x22index.html?type=appdash&appid="+ apps[i]._id +"\x22>" + apps[i].appname + "</a>" +
                    "<span>" + apps[i].appname + "</span>" +
                    // "</a>" +
                    "<div id=\x22collapse"+ i.toString() +"\x22 class=\x22collapse\x22 aria-labelledby=\x22headingTwo\x22 data-parent=\x22#accordionSidebar\x22>" +
                    "<div class=\x22bg-white py-2 collapse-inner rounded\x22>" +
                    "<h6 class=\x22collapse-header\x22>Admin:</h6>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=appdash&appid="+ apps[i]._id +"\x22>Dashboard</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=users&appid="+ apps[i]._id +"\x22>Users</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=apchs&appid="+ apps[i]._id +"\x22>Purchases</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=scores&appid="+ apps[i]._id +"\x22>Scores</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=achmts&appid="+ apps[i]._id +"\x22>Achievements</a>" +

                    "</div>" +
                    "<div class=\x22bg-white py-2 collapse-inner rounded\x22>" +
                    "<h6 class=\x22collapse-header\x22>Content:</h6>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=ascenes&appid="+ apps[i]._id +"\x22>Scenes</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=storeitems&appid="+ apps[i]._id +"\x22>Store Items</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=acts&appid="+ apps[i]._id +"\x22>Activities</a>" +
                        "<a class=\x22collapse-item\x22 href=\x22index.html?type=attr&appid="+ apps[i]._id +"\x22>Attributes</a>" +
                    "</div>" +
                    "</div>" +
                    "</li>" ;
                    }
                }
                // console.log(html);
                $("#appNav").html(html);
            }
            // userid = data.split("~")[1];
            var profileLink = document.getElementById('profileLink');
            profileLink.href = 'index.html?type=profile';
            bigSwitch();
            }
        });
        } else {
            window.location.href = './login.html';
        }
    }
    function bigSwitch() { //light up proper elements and get the stuff
        if (type == null) {
            $("#topPage").show();
            $("#pageTitle").html("");
            showDashBoid();
        } else {
            $("#topPage").hide();
        }
        console.log("tryna switch to type " + type);
        switch (type) { //type is first level param for each route
        case "webxr": //uses :appid param
            $("#topPage").show();
            $("#pageTitle").html("");
            getWebXRScene();
        break;    
        case "appdash": //uses :appid param
            $("#cards").show();
            getAppDash();
        break;       
        case "app": //uses :appid param
            $("#cards").show();
        break;
        case "apps": //if authlevel > 0
            ("#tables").show();
            $("#table1").show();
            $("#table1Title").html("All Apps");
            $("#pageTitle").html("All Apps");
            getApps();
        break;
        case "domains": //if authlevel > 0
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("All Domains");
            $("#pageTitle").html("All Domains");
            getDomains();
        break;
        case "users": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Registered Users");
            $("#pageTitle").html("All Registered Users");
            getAllUsers();
        break;
        case "guests": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Guest Users");
            $("#pageTitle").html("All Guest Users");
            getAllGuests();
        break;
        case "appusers": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Registered Users");
            $("#pageTitle").html("All Registered Users");
            getAppUsers();
        break;
        case "apchs": //purchases for app
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Purchases - "+ appName(appid));
            $("#pageTitle").html("Purchases");
            getAppPurchases();
        break;
        case "scores": //uses :appid param
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("High Scores - Total");
            $("#table2").show();
            $("#table2Title").html("High Scores - Top");
            $("#pageTitle").html("Scores");
            getTotalScores();
        break;
        case "profile": //uses cookied uid
            $("#cards").show();
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Purchases");
            $("#table2").show();
            $("#table2Title").html("Activities");
            $("#table3").show();
            $("#table3Title").html("Scores");
            $("#pageTitle").html("User Profile - " + username);
            getProfile();
        break;
        case "bulkup": //same as old
            $("#drag-drop-area").show();
            $("#pageTitle").html("Upload Files");
            // getStaging();
        break;
        case "staging": //same as old
            $("#staging-area").show();
            $("#pageTitle").html("Staging Area");
            getStaging();
        break;
        case "text": 
            $("#pageTitle").html("Text");
            showText(itemid);
        break;
        case "texts": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Texts");
            $("#pageTitle").html("All Texts");
            getTexts();
        break;
        case "picture": 
            $("#pageTitle").html("Picture");
            showPicture(itemid);
        break;
        case "pictures": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Pictures");
            $("#pageTitle").html("All Pictures");
            getPictures();
        break;
        case "saudio":
            showAudio(itemid);
        break;
        case "video": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Videos");
            $("#pageTitle").html("All Videos");
            getVideos();
        break;
        case "svideo": //gets everything atm
            $("#pageTitle").html("Video");
            showVideo(itemid);
        break;
        case "audio": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Audio");
            $("#pageTitle").html("All Audio");
            getAudio();
        break;
        case "uassets": 
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Unity Assets");
            $("#pageTitle").html("Unity Assets");
            getUnityAssets();
        break;
        case "models": 
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Models");
            $("#pageTitle").html("Models");
            getModels();
        break; 
        case "model": 
            $("#pageTitle").html("Model Details");
            showModel(itemid);
        break; 
        case "location":
            showLocation(itemid);
        break;
        case "locations": //gets everything atm
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Locations");
            $("#pageTitle").html("All Locations");
            getLocations();
        break;
        case "storeitems": //uses :appid pasram
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Store Items");
            $("#pageTitle").html("Store Items");
            getStoreItems();
        break;
        case "objex": 
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Objects");
            $("#pageTitle").html("All Objects");
            getObjects();
        break;
        case "objects": 
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Objects");
            $("#pageTitle").html("All Objects");
            getObjects();
        break;

        case "object": //single object

            getObject(itemid);
        break;
        case "scene": //single scene

            getScene(itemid);
        break;
        case "scenes": //uses cookied uid, all apps
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Scenes");
            $("#pageTitle").html("Scenes by " + username);
            getScenes();
        break;
        case "ascenes": //uses cookied uid, all apps
            $("#tables").show();
            $("#table1").show();
            $("#table1Title").html("Scenes");
            $("#pageTitle").html("Scenes for " + appName(appid));
            getAppScenes(appid);
        break;
        case "groups": //uses cookied uid, all apps
            $("#cards").show();
            $("#table1Title").html("Groups");
            $("#pageTitle").html("Groups by " + username);
            getGroups();
        break;
        case "group": //make a separate route for this, bc plural childrens 
            $("#cards").show();
            $("#table1Title").html("Group");
            $("#pageTitle").html("Group by " + username);
            showGroup();
        break;
        case "activities":
            $("#table1Title").html("Activities");
            // $("#pageTitle").html("Activities by " + username);
            getActivities(appid);
        break;
        case "importstoreitems": //tmp utility
            $("#pageTitle").html("tryna import store items...");
            importStoreItems();
        break;
        }
    }
    function appName(appid) {
        if (apps != null && apps != undefined && apps.length > 0) {
            for (let i = 0; i < apps.length; i++) {
                if (appid == apps[i]._id) {
                    return apps[i].appname;
                }
            }
        } else {
            return "appname not found!";
        }
    }
    function appDomain(appid) {
        if (apps != null && apps != undefined && apps.length > 0) {
            for (let i = 0; i < apps.length; i++) {
                if (appid == apps[i]._id) {
                    return apps[i].appdomain;
                }
            }
        } else {
            return "appdomain not found!";
        }
    }
    function nameSplitter(name) { //utility function for staging files 
            var split = name.split("_");
            var slice = name.slice(split[0].length + 1);
            return slice;   
    }
    function dateSplitter(name) { //utility function for staging files 
            var split = name.split("_");
            // var slice = name.slice(0);
            var trim = split[0].substring(0, split[0].length - 3);
            return trim;   
    }    
    function keyValues (response) { //utility function
        var kvString = "";
        for (var value in response) {
        kvString += "<p>" + value + " : " + response[value] + "</p>";
        }
        return kvString;
    }
    function round2(value) {
        return Number(Math.round(value+'e'+2)+'e-'+2);
    }   
    function returnHtmlEmbed() {
        let foo = "foo";
        let embeddedHTML = "<div class=\x22screen dark main\x22>" +                
        
        "<a class=\x22button\x22 href=\x22http://" + foo + "\x22>Home</a>" +

        "<a class=\x22button\x22 href=\x22http://" + foo + "/" + foo + "/index.html\x22>" + foo + " : " + foo + "</a>" +

        "<a-entity playbutton><a class=\x22button\x22 href=\x22javascript:void(0)\x22>Play</a></a-entity>" +

        "</div>";
        console.log(embeddedHTML);
        return embeddedHTML;
    }
    function loadImage(src, xo) {
        return new Promise(function(resolve, reject) {
            var i = new Image();
            if (xo) i.crossOrigin = xo;
            i.onload = function() { resolve(i); }
            i.onerror = reject;
            i.src = src;
        });
    }
    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }

    function showDashBoid() { //#topPage

        let selector = "<select class=\x22form-control\x22 id=\x22enviroSelect\x22>" +
        "<option value=\x22\x22 disabled selected>Select Environment : </option>" +
        "<option>default</option>" +
        "<option>contact</option>" +
        "<option>egypt</option>" +
        "<option>checkerboard</option>" +
        "<option>forest</option>" +
        "<option>goaland</option>" +
        "<option>yavapai</option>" +
        "<option>goldmine</option>" +
        "<option>arches</option>" +
        "<option>threetowers</option>" +
        "<option>poison</option>" +
        "<option>tron</option>" +
        "<option>japan</option>" +
        "<option>dream</option>" +
        "<option>volcano</option>" +
        "<option>starry</option>" +
        "<option>osiris</option>" +
        "</select>";
        $("#envSelector").html(selector);
        setAframeScene();
        $(function() {
            $(document).on('change', '#enviroSelect', function() {
                console.log(this.id + " value " + this.value);
                let environment = this.value;
                window.location.href = 'index.html?env=' + environment;
            });
        });
    }
    function clearThreeJSCache() {
        // console.log("tryna clear threeejs cache...");
        // THREE.Cache.clear();
        // THREE.Cache.clear();
        // THREE.Cache.clear();
        // console.log(THREE.Cache);
        // THREE.Scene;
        // while(THREE.Cache.children.length > 0){ 
        //     THREE.Scene.remove(THREE.Scene.children[0]); 
        // }
        // console.log(keyValues(THREE.Cache.files));
        // for (file in files) {
        //     console.log(file);
        //     keyValues(THREE.Cache);
        //     THREE.Cache.remove(file);
        //     // THREE.Cache.files[i].remove
        // }
        // console.log(THREE.Cache);
    }

    function setAframeScene() {
        // THREE.Cache.clear();
        clearThreeJSCache();

        let environment = "dream";
        if (aframe_enviro != undefined || aframe_enviro != null) {
            environment = aframe_enviro;
        } else {
        let envs = ["default","contact","egypt","checkerboard","forest","goaland","yavapai","goldmine","arches","threetowers","poison","tron","japan","dream","volcano","starry","osiris"];
            environment = envs[Math.floor(Math.random()*envs.length)]; //random if not set via qs param
        }
        let links = "<a-assets><img id=\x22thumbMountains\x22 crossOrigin=\x22anonymous\x22 src=\x22https://realitymangler.com/YnHTO2MHP/5c33e4ada0a53d08d90f3e43.standard.ss_ynhto2mhp_1546904729.jpg\x22>"+
        "</a-assets>"+
        "<a-link href=\x22https://servicemedia.net/webxr/pVBHeiaCI\x22 position=\x223.5 1.5 -1.0\x22 image=\x22#thumbMountains\x22></a-link>";
        // console.log("tryna set aframe scene with links " + links);
        let height = window.innerHeight - 100;
        let aframe = "<div class=\x22row\x22>" +
        "<div style=\x22width:100%; height:"+height+"px;\x22>" +
            "<a-scene loading-screen=\x22dotsColor: white; backgroundColor: black\x22 embedded environment=\x22preset: "+environment+"\x22>" +
            "<a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
            "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+
            "<a-entity id=\x22head\x22 camera wasd-controls look-controls touch-controls position=\x220 1.6 0\x22></a-entity>"+
            "<a-entity oculus-touch-controls=\x22hand: right\x22 laser-controls=\x22hand: left;\x22 handModelStyle: lowPoly; color: #ffcccc\x22 raycaster=\x22objects: .activeObjexRay;\x22></a-entity>" +
            "<a-entity oculus-touch-controls=\x22hand: left\x22 id=\x22right-hand\x22 hand-controls=\x22hand: right; handModelStyle: lowPoly; color: #ffcccc\x22 aabb-collider=\x22objects: .activeObjexGrab;\x22 grab></a-entity>"+
                "</a-entity>"+
                "<a-assets>" +
                    "<a-asset-item id=\x22cityModel\x22 crossorigin=\x22anonymous\x22response-type=\x22arraybuffer\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/test_gltf.glb\x22></a-asset-item>" +
                    "<a-asset-item id=\x22rover\x22 crossorigin=\x22anonymous\x22 response-type=\x22arraybuffer\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/rover_static.glb\x22></a-asset-item>" +
                    "<a-asset-item id=\x22mech1\x22 crossorigin=\x22anonymous\x22 src=\x22https://servicemedia.s3.amazonaws.com/assets/models/astronaut.glb\x22></a-asset-item>" +
                "</a-assets>" +
                "<a-entity position=\x22-10 -0.5 -60\x22 gltf-model=\x22#cityModel\x22></a-entity>" +
                "<a-entity position=\x22-6 0 -8\x22 gltf-model=\x22#rover\x22 animation-mixer=\x22clip: idle\x22></a-entity>" +
                "<a-entity id=\x22character\x22 scale=\x221.1 1.1 1.1\x22 position=\x222 -0 -4\x22 gltf-model=\x22#mech1\x22" +
                " animation-mixer=\x22clip: idle\x22 animation__yoyo=\x22property: position; dir: alternate; dur: 10000; easing: easeInSine; loop: true; to: 2 1 -4\x22></a-entity>" +
                "<a-sphere scene-info class=\x22\x22 id=\x22sphere\x22 position=\x220 1.25 -5\x22 radius=\x221.25\x22 material=\x22shader: noise\x22" +
                "</a-sphere>" +
                "<a-link class=\x22activeObjexRay\x22 title=\x22portal\x22 look-at=\x22#head\x22 href=\x22../webxr/pVBHeiaCI\x22 position=\x22-5 0 0\x22 image=\x22#thumbMountains\x22></a-link>" +
                "<a-light type=\x22point\x22 color=\x22blue\x22 position=\x22-0 1.25 0\x22></a-light>" +
                "<a-text id=\x22mainText\x22 value=\x22Welcome "+username+"!\x22 align=\x22center\x22 color=\x22#FFF\x22 visible=\x22false\x22 position=\x22-0 2 -0\x22"+
                "geometry=\x22primitive: plane; width: 4\x22 material=\x22color: #333\x22>" +
                "</a-text>"+
                "<a-sky color=\x22#ECECEC\x22></a-sky>" +
            "</a-scene>" +
            "</div>" +
        "</div>";
        $("#topPage").html(aframe);
        // $(function() {
        //     THREE.Cache.clear;
        //     console.log(THREE.Cache);
        // });

        var sceneEl = document.querySelector('a-scene');

        // var character = document.querySelector('#character');
        let mainText = document.querySelector("#mainText");
        let character = document.querySelector("#character");
        // if (!isLoaded) {
        AFRAME.registerComponent('do-something-once-loaded', {
        init: function () {
                // This will be called after the entity has properly attached and loaded.
                console.log('aframe ready!');
                isLoaded = true;
            }
        });
        
        var entityEl = document.createElement('a-entity');
        entityEl.setAttribute('do-something-once-loaded', '');
        // character.setAttribute('do-something-once-loaded', '');
        sceneEl.appendChild(entityEl);

        AFRAME.registerComponent('scene-info', {
            schema: {
              color: {default: 'red'}
            },
            init: function () {
              var data = this.data;
              var el = this.el;  
            //   var defaultColor = el.getAttribute('material').color;
            el.setAttribute('color', "blue");
                mainText.setAttribute('visible', true);
                mainText.setAttribute("look-at", "[camera]");

              el.addEventListener('mouseenter', function () {
                el.setAttribute('color', "blue");
                mainText.setAttribute('visible', true);
                mainText.setAttribute("look-at", "[camera]");
              });
        
              el.addEventListener('mouseleave', function () {
                el.setAttribute('color', "blue");
                // mainText.setAttribute('visible', false);
              });
            }
        });
    }

    function getWebXRScene() {
        
        axios.get('/scene/' + itemid + '/webxr/latest')
        .then(function (response) {
             console.log(response);
            showWebXRScene(response);
        }) //end of main fetch
        .catch(function (error) {
            console.log(error);
        });

    }
    function showWebXRScene(response) {
        let environment = "egypt";
        console.log("tryna set aframe scene with env " + environment);
        let height = window.innerHeight - 100;
        // console.log("primary audio: " + response.data.scenePrimaryAudioID + " in "+ JSON.stringify(response.data.audio));
        let primaryAudio = {};
        let ambientAudio = {};
        let triggerAudio = {};
        let assets = "";
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
        for (var a in response.data.audio) {
            if (response.data.audio[a]._id === response.data.scenePrimaryAudioID) {
                primaryAudio = response.data.audio[a];
                // console.log("primaryAudio " + JSON.stringify(primaryAudio));
                assets = "<img id=\x22primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 src=\x22"+primaryAudio.URLpng+"\x22></img>";
            }
        }
        for (var a in response.data.audio) {
            if (response.data.audio[a]._id === response.data.sceneAmbientAudioID) {
                ambientAudio = response.data.audio[a];
            }
        }
        for (var a in response.data.audio) {
            if (response.data.audio[a]._id === response.data.sceneTriggerAudioID) {
                triggerAudio = response.data.audio[a];
            }
        }
        if (response.data.sceneWebXREnvironment != null && response.data.sceneWebXREnvironment != "") {
            environment = response.data.sceneWebXREnvironment;
            console.log("environment: " + environment);
        }
        assets = assets + "<img id=\x22thumbMountains\x22 crossorigin=\x22anonymous\x22 src=\x22https://realitymangler.com/assets/547389e8cac0642460000004.half.DoorsMedieval0134_L.jpg\x22>";
        let aframe = "<div class=\x22row\x22>" +
        "<div style=\x22width:100%; height:"+height+"px;\x22>" +
            "<a-scene loading-screen=\x22dotsColor: white; backgroundColor: black\x22 embedded environment=\x22preset: "+environment+"\x22>" +
                "<a-entity id=\x22mouseCursor\x22 cursor=\x22rayOrigin: mouse\x22 raycaster=\x22objects: .activeObjexRay\x22></a-entity>"+
                "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+
                
                    "<a-entity id=\x22head\x22 camera wasd-controls look-controls touch-controls position=\x220 1.6 0\x22></a-entity>"+
                    "<a-entity oculus-touch-controls=\x22hand: left\x22 laser-controls=\x22hand: left;\x22 handModelStyle: lowPoly; color: #ffcccc\x22 raycaster=\x22objects: .activeObjexRay;\x22></a-entity>" +
                    "<a-entity oculus-touch-controls=\x22hand: right\x22 id=\x22right-hand\x22 hand-controls=\x22hand: right; handModelStyle: lowPoly; color: #ffcccc\x22 aabb-collider=\x22objects: .activeObjexGrab;\x22 grab></a-entity>"+
                "</a-entity>"+
                "<a-assets>" +
                    grabMix +
                    assets +
                "</a-assets>" +
                
                "<a-entity visible=\x22false\x22 id=\x22primaryAudioText\x22 geometry=\x22primitive: plane; width: 1; height: .35\x22 position=\x22-0 2.1 -1\x22 material=\x22color: grey; transparent: true; opacity: 0.5\x22"+
                    "text=\x22value:\nUser: "+username+"\nScene: "+response.data.sceneTitle+"\n\nClick to play...\n\x22>"+
                    "<a-image position = \x220 -.1 -.01\x22 width=\x221\x22 height=\x22.25\x22 src=\x22#primaryAudioWaveform\x22 crossorigin=\x22anonymous\x22 transparent=\x22true\x22></a-image>"+
                "</a-entity>"+
                "<a-entity mixin=\x22grabmix\x22 class=\x22activeObjexGrab activeObjexRay\x22 primary-audio-control id=\x22sphere\x22 geometry=\x22primitive: sphere; radius: .25\x22 material=\x22shader: noise\x22 position=\x220 1.6 -1\x22" +
                "</a-entity>" +
                "<a-link class=\x22activeObjexRay\x22 title=\x22portal\x22 look-at=\x22#head\x22 href=\x22index.html\x22 position=\x22-15 0 0\x22 image=\x22#thumbMountains\x22></a-link>" +
                "<a-sky color=\x22#ECECEC\x22></a-sky>" +

            "</a-scene>" +
            "</div>" +
        "</div>";
        // $("#card").html(aframe);
        $("#topPage").html(aframe);
        $(function() {
            
        });
        var sky = document.querySelector('a-sky');
        sky.setAttribute('color', getRandomColor());
        sky.setAttribute('animation__color', {
        property: 'color',
        dir: 'alternate',
        dur: 20000,
        easing: 'easeInOutSine',
        loop: true,
        to: getRandomColor()
        });
        
        if (primaryAudio.URLogg != null) {
            let primaryAudioHowl = new Howl({ //use howler audio mangler
                src: [primaryAudio.URLogg], //use ogg for looping
                loop: true,
                volume: 1.0,
                
            });

            let sceneEl = document.querySelector('a-scene');
            let primaryAudioText = document.querySelector("#primaryAudioText");
            let character = document.querySelector("#character");
            let pAudio = document.querySelector("#primaryAudio"); 
            let cam = document.querySelector("#head"); 
            let entityEl = document.createElement('a-entity'); //isLoaded placeholder 
            let isPlaying = false;
            let startTime = 0;
            let pAudioCurrentTime = 0;
            let pausedTime = 0;
            let currentTime = 0;
            let duration = 0;
            // var primaryAudioMaterial = "";
            let userSceneString = "\nUser: "+username+"\nScene: "+response.data.sceneTitle;
            entityEl.setAttribute('isloaded', '');
            sceneEl.appendChild(entityEl);
            AFRAME.registerComponent('isloaded', {
                init: function () {
                        console.log("loaded!");
                    } 
                });
            AFRAME.registerComponent('primary-audio-control', {
                schema: {
                color: {default: 'red'}
                },
                init: function () {
                    var data = this.data;
                    var el = this.el;  
                    var defaultColor = el.getAttribute('material').color;
                    primaryAudioHowl.pannerAttr({
                        panningModel: 'HRTF',
                        coneInnerAngle: 360,
                        coneOuterAngle: 360,
                        coneOuterGain:1,
                        maxDistance: 10,
                        refDistance: 1,
                        rolloffFactor: 1,
                        distanceModel: 'exponential'
                    });
                    el.addEventListener('mouseenter', function () {
                        primaryAudioText.setAttribute('visible', true);
                        primaryAudioText.setAttribute("look-at", "[camera]");
                    });
                    el.setAttribute('light', {
                        type: 'point',
                        distance: 30,
                        intensity: 2.0,
                        color: 'yellow'
                    }, true);
                    el.addEventListener('mousedown', function () {
                    if (!primaryAudioHowl.playing() && primaryAudioHowl.state() == "loaded") {
                        duration = primaryAudioHowl.duration().toFixed(2);
                        primaryAudioHowl.play();
                        console.log('...tryna play...');
                        primaryAudioHowl.pos(0, 1.25, -5);
                        isPlaying = true;
                    } else {
                        if (isPlaying) {
                        el.setAttribute('light', {
                            type: 'point',
                            distance: 30,
                            intensity: 2.0,
                            color: 'red'
                        }, true);
                            primaryAudioHowl.pause();
                            isPlaying = false;
                            console.log('...tryna pause...');
                        }
                    }
                });        
                el.addEventListener('mouseleave', function () {
                        el.setAttribute('color', defaultColor);
                    });
                },
                tick: function(time, deltaTime) {
                    var seek = primaryAudioHowl.seek() || 0;
                    seek = Number(seek).toFixed(2);
                    let percentComplete = Math.floor((seek / duration) * 100);
                    if (!isNaN(seek) && seek != 0) {
                        if (primaryAudioHowl.playing()) {
                            if (startTime == 0) {
                                startTime = time;
                                // delayedGreeting();
                            }
                            // pRot = cam.object3D.rotation;
                            pPos = cam.object3D.position;
                            // console.log(JSON.stringify() + " " + JSON.stringify(pPos));
                            
                            Howler.pos(pPos.x, pPos.y, pPos.z);
                            primaryAudioText.setAttribute('text', {
                            align: "left",
                            value: "User: "+username+"\nScene: "+response.data.sceneTitle+"\n" + primaryAudio.title + "\n " + seek + " secs of " + duration + " = " + percentComplete + "%\n\n\n"
                            });
                            this.el.setAttribute('material', 'color', 'green');
                            this.el.setAttribute('light', {
                                type: 'point',
                                distance: 30,
                                intensity: 2.0,
                                color: 'green'
                            }, true);
                        } else {
                            primaryAudioText.setAttribute('text', {
                                // width: 4, 
                                align: "left",
                                value: "User: "+username+"\nScene: "+response.data.sceneTitle+"\n" + primaryAudio.title + "\n " + seek + " secs of " + duration + " = " + percentComplete + "% - Paused \n\n\n"
                            });
                            this.el.setAttribute('material', 'color', 'red');
                            this.el.setAttribute('light', {
                                type: 'point',
                                distance: 30,
                                intensity: 2.0,
                                color: 'red'
                            }, true);
                        }
                    } else {
                        primaryAudioText.setAttribute('text', {
                            // width: 4, 
                            align: "left",
                            value: "User: "+username+"\nScene: "+response.data.sceneTitle+"\n" + primaryAudio.title + "\n " + primaryAudioHowl.state()  + "\n\n\n"
                        });
                        if (primaryAudioHowl.state() == "loading") {
                            // primaryAudioMaterial.color = 'lightblue';
                            this.el.setAttribute('material', 'color', 'yellow');
                            this.el.setAttribute('light', {
                                type: 'point',
                                distance: 30,
                                intensity: 2.0,
                                color: 'yellow'
                            }, true);

                        } else {
                            this.el.setAttribute('material', 'color', 'blue');
                            // primaryAudioMaterial.setAttribute('color', 'blue');
                            this.el.setAttribute('light', {
                                type: 'point',
                                distance: 30,
                                intensity: 2.0,
                                color: 'blue'
                            }, true);
                        }                        
                        }
                    }
                }); //end register
            } else {
                
            }//end if url != null

        function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        async function delayedGreeting() {
        console.log("Hello");
        await sleep(2000);
        console.log("World!");
        }
        
        AFRAME.registerComponent('ambient-audio-control', {
            schema: {
              color: {default: 'red'}
            },
            init: function () {
              var data = this.data;
              var el = this.el;  
              var defaultColor = el.getAttribute('material').color;
            

              el.addEventListener('mouseenter', function () {
                el.setAttribute('color', data.color);
                mainText.setAttribute('visible', true);
                mainText.setAttribute("look-at", "[camera]");
                
              });
              el.addEventListener('mousedown', function () {
                  if (!isPlaying) {
                    //   if (startTime != 0;)
                    el.setAttribute('color', defaultColor);
                    isPlaying = true;
                    // mainText.setAttribute('visible', false);
                    // mainText.setAttribute('value', 'playing...');
                    mainText.setAttribute('text', {
                        // width: 4, 
                        align: "left",
                        value: "playing!"
                      });
                    pAudio.components.sound.playSound();
                    console.log('...tryna play...');
                    // mainText.value = "Playing " + primaryAudio.name;
                    // setInterval(function () {
                    //     var soundComponent = pAudio.components.sound;
                    //     var audioSource = soundComponent.pool.children[0].source;
                    //     if (!audioSource) {
                    //     console.log('...loading...');
                    //     return;
                    //     }
                    //     var audioContext = audioSource.context;
                    //     var currenttime = audioContext.currentTime - soundComponent.pool.children[0].startTime;
                    //     console.log('currentTime: %f', audioContext.currentTime);
                    // }, 100);
                } else {
                    isPlaying = false;
                    pAudio.components.sound.pauseSound();
                    console.log('...tryna pause...');
                }
              });        
              el.addEventListener('mouseleave', function () {
                el.setAttribute('color', defaultColor);
              });
            },
            tick: function(time, deltaTime) {
                if (isPlaying) {
                    if (startTime == 0) {
                        startTime = time;
                    }
                    pAudioCurrentTime = time - (startTime + pausedTime);
                    let num = (pAudioCurrentTime / 1000).toFixed(2);
                      mainText.setAttribute('text', {
                        // width: 4, 
                        align: "left",
                        value: "\nUser: "+username+"\nScene: "+response.data.sceneTitle+"\n\nPlaying " + primaryAudio.title + "\n " + (num + pAudio.components.sound.pool.children[0].offset) + ""
                      });
                } else {
                    pausedTime = pausedTime + deltaTime;
                    mainText.setAttribute('text', {
                        align: "left",
                        // width: 4, 
                        value: "\nUser: "+username+"\nScene: "+response.data.sceneTitle+"\n\nPaused " + primaryAudio.title + "\n "
                      });
                }
            }
        });
    }
    
    function getRandomColor() {
        console.log("tryna getRandomColor");
        var varters = '0123456789abcdef'
        var randomColor = ''
        for (var i = 0; i < 6; i++) {
          randomColor += varters[Math.floor(Math.random() * 16)]
        }
        console.log("tryna getRandomColor " + randomColor);
        return '#' + randomColor
      }

    function importStoreItems() { //custom fu for cw
    axios.get('data')
        .then(function (response) {
        // console.log(JSON.stringify(response));
        let arr = response.data;
        // for (let i = 0; i < arr.length; i++) {
        //     console.log(arr[i].name);
        //   }
        // })
        let data = { 
            appid: "",
            storeitems: arr
        };
        axios.post('/import_storeitems', data)
        .then(function (response) {
            console.log(response);
            if (response.data.includes("updated")) {
                window.location.reload();
            } else {
                $("#topAlert").html(response.data);
                $("#topAlert").show();
            }
        })
        .catch(function (error) {
            console.log(error);
        });
        })
        .catch(function (error) {
            console.log(error);
            // resultElement.innerHTML = showError(error);
            // datahtml = showError(error);
        });
    }
    function getStaging() {
        console.log("tryna reload staging");
        $.get( "/staging/" + cookie._id, function( data ) {
            // console.log("tryna get staging data : " + JSON.stringify(data));
            $( "#staging-area" ).html( showStaging(data) );
            let newButton = "<a href=\x22index.html?type=bulkup\x22 class=\x22btn btn-info  float-right\x22 >Upload Files</button>";
            $("#newButton").html(newButton);
            $("#newButton").show();
        });
        selected = [];
    }  
    function showStaging (response) {
        var arr = response.stagedItems;
        // var html = "<script src=\x22vendor/aframe/aframe-orbit-controls.min.js\x22></script><div class=\x22row\x22>";
        var html = "<div class=\x22row\x22>";
        var re = /(?:\.([^.]+))?$/;
        let glbIndex = 0;
        for(var i = 0; i < arr.length; i++) {
        // console.log(JSON.stringify(arr[i]));
        var ext = re.exec(arr[i].name)[1].toLowerCase(); //get the extension (TODO use contentType metadata from request header)
        // console.log("extention is " + ext);

        if (arr[i].url != undefined && ext != undefined) {
        // console.log("url " + arr[i].url );
            if (ext == "jpg" || ext == "jpeg" || ext == "png" || ext == "gif") {
                html = html +
                "<div class=\x22card\x22 style=\x22width:320px;\x22>" +
                    "<div class=\x22card-header\x22>"+
                    "<span class=\x22float-left\x22><i class=\x22fas fa-image fa-3x\x22 style=\x22color:#412dcf;\x22></i></span>"+
                    "<div style=\x22margin: 5px\x22 class=\x22float-right custom-control custom-checkbox\x22>" +
                    "<input name=\x22select\x22 type=\x22checkbox\x22 class=\x22custom-control-input\x22 id="+arr[i].name+">" +
                    "<label class=\x22custom-control-label\x22 for=\x22"+arr[i].name+"\x22>Select</label>" +
                    "</div>" +
                    "</div>" +
                    "<div class=\x22card-body\x22>" +
                        "<a href=\x22"+ arr[i].url + "\x22 target=\x22_blank\x22>" +
                        "<img src="+  arr[i].url + " class=\x22img-thumbnail\x22></a>" +
                        nameSplitter(arr[i].name) + 
                        "<br>" + convertTimestamp(dateSplitter(arr[i].name)) +
                    "</div>" +
                "</div>";
            } else if (ext == "mp3" || ext == "aif" || ext == "wav" || ext == "ogg") {
            html = html + 
                "<div class=\x22card\x22 style=\x22width:320px;\x22>" +
                    "<div class=\x22card-header\x22>"+
                        "<span class=\x22float-left\x22><i class=\x22fas fa-file-audio fa-3x\x22 style=\x22color:#cf43b8;\x22></i></span>"+
                    "<div style=\x22margin: 5px\x22 class=\x22float-right custom-control custom-checkbox\x22>" +
                    "<input name=\x22select\x22 type=\x22checkbox\x22 class=\x22custom-control-input\x22 id="+arr[i].name+">" +
                    "<label class=\x22custom-control-label\x22 for=\x22"+arr[i].name+"\x22>Select</label>" +
                    "</div>" +
                    "</div>" +
                    "<div class=\x22card-body\x22>" +
                        "<audio controls>" +
                        "<source src=" + arr[i].url + " type='audio/ogg'>" +
                        "<source src=" + arr[i].url + " type='audio/mpeg'>" +
                        "<source src=" + arr[i].url + " type='audio/wav'>" +
                        "Your browser does not support the audio tag." +
                        "</audio>" +
                        nameSplitter(arr[i].name) + 
                        "<br>" + convertTimestamp(dateSplitter(arr[i].name)) +
                    "</div>" +
                "</div>";
            } else if (ext == "mp4" || ext == "mkv" || ext == "MP4" || ext == "MKV" || ext == "webm" || ext == "WEBM") {
            html = html + 
            "<div class=\x22card\x22 style=\x22width:320px;\x22>" +
                "<div class=\x22card-header\x22>"+
                "<span class=\x22float-left\x22><i class=\x22fas fa-file-video fa-3x\x22 style=\x22color:#ff5e41;\x22></i></span>"+
                "<div style=\x22margin: 5px\x22 class=\x22float-right custom-control custom-checkbox\x22>" +
                    "<input name=\x22select\x22 type=\x22checkbox\x22 class=\x22custom-control-input\x22 id="+arr[i].name+">" +
                    "<label class=\x22custom-control-label\x22 for=\x22"+arr[i].name+"\x22>Select</label>" +
                "</div>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                    "<video width='320' height='240' controls>" +
                    "<source src=" + arr[i].url + " type='video/mp4'>" +
                    "<source src=" + arr[i].url + " type='video/mkv'>" +
                    "Your browser does not support the video tag." +
                    "</video>" +
                    nameSplitter(arr[i].name) + 
                    "<br>" + convertTimestamp(dateSplitter(arr[i].name)) +
                "</div>" +
            "</div>";
            }  else if (ext == "glb") {
                glbIndex++;
                glbObj = arr[i];
                html = html + 
                "<div class=\x22card\x22 style=\x22width:320px;\x22>" +
                    "<div class=\x22card-header\x22>"+
                    "<span class=\x22float-left\x22><i class=\x22fas fa-cubes fa-3x\x22 style=\x22color:green;\x22></i></span>"+
                    "<div style=\x22margin: 5px\x22 class=\x22float-right custom-control custom-checkbox\x22>" +
                        "<input name=\x22select\x22 type=\x22checkbox\x22 class=\x22custom-control-input\x22 id="+arr[i].name+">" +
                        "<label class=\x22custom-control-label\x22 for=\x22"+arr[i].name+"\x22>Select</label>" +
                    "</div>" +
                    "</div>" +
                    "<div class=\x22card-body\x22 style=\x22width:300px; height:200;\x22>" + //embedded
                        "<button class=\x22btn btn-md btn-success\x22 onclick=previewGLTF("+JSON.stringify(glbObj)+")>Preview GLTF</button><br><br>"+
                        "<strong>" + nameSplitter(arr[i].name) +"</strong>" + 
                        "<br>" + convertTimestamp(dateSplitter(arr[i].name)) +
                    "</div>" +
                "</div>";
            }   else  {
            html = html + //it's a whatever file?!?!?
            "<div class=\x22card\x22 style=\x22width:320px;\x22>" +
                "<div class=\x22card-header\x22>"+
                "<span class=\x22float-left\x22><i class=\x22fas fa-file-archive fa-3x\x22 style=\x22color:black;\x22></i></span>"+
                "<div style=\x22margin: 5px\x22 class=\x22float-right custom-control custom-checkbox\x22>" +
                    "<input name=\x22select\x22 type=\x22checkbox\x22 class=\x22custom-control-input\x22 id="+arr[i].name+">" +
                    "<label class=\x22custom-control-label\x22 for=\x22"+arr[i].name+"\x22>Select</label>" +
                "</div>" +
                "</div>" +
                "<div class=\x22card-body\x22 style=\x22width:300px; height:200;\x22>" + //embedded
                    "<a href=\x22"+ arr[i].url + "\x22 target=\x22_blank\x22>" +
                    "<img style=\x22width:64px; height:64px\x22 src=https://servicemedia.s3.amazonaws.com/assets/pics/download.png></a>" +
                    "<strong>" + nameSplitter(arr[i].name) +"</strong>" + 
                    "<br>" + convertTimestamp(dateSplitter(arr[i].name)) +
                "</div>" +
            "</div>";
                // "<div class=\x22card \x22 style=\x22width:320px;\x22>" +
                // "<div class=\x22card-header\x22>" +
                
                // "<div class=\x22form-check pull-right m-10\x22>" +
                // "<label class=\x22h3 form-check-label\x22 for="+arr[i].name+">Select&nbsp&nbsp</label>" +
                // "<input name=\x22select\x22 type=\x22checkbox\x22 name=\x22select\x22 class=\x22form-check-input\x22 id="+arr[i].name+">" +
                // "</div>" +
                // "</div>" +
                // "<div class=\x22m-10\x22>" +
                // "<span class=\x22h4\x22>"+ nameSplitter(arr[i].name) +"</span>" +
                // "</div>" +
                // "<div class=\x22card-body\x22 style=\x22width: 640px\x22>" +
                //     "<a href=\x22"+ arr[i].url + "\x22 target=\x22_blank\x22>" +
                //     "<img style=\x22width:64px; height:64px\x22 src=https://servicemedia.s3.amazonaws.com/assets/pics/download.png></a>" +
                // "</div>" +
                // "<div class=\x22card footer m-10 p-10\x22>"+
                // "<a href=\x22"+ arr[i].url + "\x22 target=\x22_blank\x22 class=\x22 btn btn-success pull-right\x22>Download</a>" +    
                // "<div class=\x22archive btn btn-primary pull-left\x22 id="+arr[i].name+">Archive</div>" +
                // "<div class=\x22delete btn btn-danger pull-left\x22 id="+arr[i].name+">Delete</div></div>" +
                // "</div>" +
                // "</div>";
                }
            }
        }
        // console.log(html);
        return  html + "</div>";
    }

    function previewGLTF(objectString) {
        console.log(objectString);
        let jsonObj = objectString;
        // let jsonObj = JSON.parse(objectString);
        console.log(jsonObj.name + " " + jsonObj.url);
        let camera = "<a-entity id='cameraRig' position='0 6 6'>"+  
        "<a-entity camera touch-controls wasd-controls='fly: true;' look-controls position='0 0 0'></a-entity>"+
        "</a-entity>";
        let aframeScene = "<div style='width: 100%; height: 1000px;'>"+jsonObj.name+"<a-scene embedded environment='preset: default;'>" +
            // "<a-entity camera look-controls orbit-controls='target: 0 1 -5; minDistance: 0.5; maxDistance: 100; initialPosition: 0 0 0'></a-entity>"+
            camera +
            "<a-assets>" +
                "<a-asset-item id='glb' src='"+ jsonObj.url +"' response-type='arraybuffer'></a-asset-item>" +
                "<a-cubemap><img id='envMap_1' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_1.jpg'>" +
                    "<img id='envMap_2' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_2.jpg'>" +
                    "<img id='envMap_3' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_3.jpg'>" +
                    "<img id='envMap_4' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_4.jpg'>" +
                    "<img id='envMap_5' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_5.jpg'>" +
                    "<img id='envMap_6' crossorigin='anonymous' src='https://archive1.s3.amazonaws.com/staging/5150540ab038969c24000008/cubemaps/5ec29e986757cf21f5633c89_6.jpg'>" +
                "</a-cubemap>" +
            "</a-assets>" + 
            "<a-entity position='0 4 0' gltf-model='#glb' skybox-env-map shadow='receive: true'></a-entity>" +
            "<a-light type='hemisphere'></a-light>"+
            "<a-light type='directional' 'castShadow=true' position='1 11 1'></a-light>"+
            // "<a-light type='ambient'></a-light>"+
            "</a-scene></div>";
            // "<a-entity geometry=\x22primitive: plane; height: auto; width: auto\x22 material=\x22color: blue\x22 "+
            //     "text=\x22width: 4; value: "+jsonObj.name+"\x22></a-entity>";
            // "</a-scene></div>";
            console.log(aframeScene);
        // $("#aframeModal").modal();
        // $("#aframeScene").html(aframeScene);
        $("#topPage").show();
        $("#topPage").html(aframeScene);
    }
    function previewModel(objectString) { //need to parse this one because why?
        console.log(objectString);
        // let jsonObj = objectString;
        // let jsonObj = JSON.parse(objectString);
        // console.log(jsonObj.name + " " + jsonObj.url);
        // let camera = "<a-entity id=\x22cameraRig\x22 position=\x220 0 0\x22>"+  
        // "<a-entity touch-controls wasd-controls=\x22fly: true;\x22 look-controls position=\x220 10 -15\x22></a-entity>"+
        // "</a-entity>";
        // let aframeScene = "<div style=\x22width: 100%; height: 1000px;\x22>"+jsonObj.name+"<a-scene embedded>" +
        //     // "<a-entity camera look-controls orbit-controls=\x22target: 0 1 -5; minDistance: 0.5; maxDistance: 100; initialPosition: 0 0 0\x22></a-entity>"+
        //     camera +
        //     "<a-assets>" +
        //         "<a-asset-item id=\x22glb\x22 src=\x22"+ jsonObj.url +"\x22 response-type=\x22arraybuffer\x22></a-asset-item>" +
        //     "</a-assets>" + 
        //     "<a-entity position=\x220 0 0\x22 gltf-model=\x22#glb\x22></a-entity></a-scene>" +
        //     // "<a-entity geometry=\x22primitive: plane; height: auto; width: auto\x22 material=\x22color: blue\x22 "+
        //     //     "text=\x22width: 4; value: "+jsonObj.name+"\x22></a-entity>";
        //     // "</a-scene></div>";
            
        // // $("#aframeModal").modal();
        // // $("#aframeScene").html(aframeScene);
        // $("#topPage").show();
        // $("#topPage").html(aframeScene);
    }
    function deleteItem(type, itemid) { //delete an actual thing, w/ confirm
            let data = [];
            let url = "";
            switch (type) {
            case "model":
                url = '/delete_model';
                data = { 
                    _id : itemid
                };
            break;
            case "object":
                url = '/delete_object';
                data = { 
                    _id : itemid
                };
            break;        
            case "picture":
                url = '/delete_picture';
                data = { 
                    _id : itemid
                };
            break;
            case "video":
                url = '/delete_video';
                data = { 
                    _id : itemid
                };
            break;
            case "audio":
                url = '/delete_audio';
                data = { 
                    _id : itemid
                };
            break;
            case "storeitem":
                url = '/delete_storeitem';
                data = { 
                    _id : itemid
                };
            break;
            case "location":
                url = '/delete_location';
                data = { 
                    _id : itemid
                };
            break;
            case "object":
                url = '/delete_obj';
                data = { 
                    _id : itemid
                };
            break;
            case "group":
                url = '/delete_group';
                data = { 
                    _id : itemid
                };
            break;
            }
            if (url != "") {
            $.confirm({
                title: 'Confirm ' + type + ' Delete!',
                content: 'Are you sure you want to delete ' + type + " " + itemid + '?',
                buttons: {
                    confirm: function () {
                        let data = { 
                            _id : itemid
                        };
                        axios.post(url, data)
                        .then(function (response) {
                            console.log(response);
                            if (response.data.includes("deleted")) {
                                window.location.reload();
                            } else if (response.data.includes("delback")) {
                                window.history.back();
                            } else {
                                $("#topAlert").html(response.data);
                                $("#topAlert").show();
                            }
                        })
                        .catch(function (error) {
                            $("#topAlert").html(error);
                            $("#topAlert").show();
                        });
                        },
                        cancel: function () {
                            $("#topAlert").html("Deletion cancelled");
                            $("#topAlert").show();
                        },
                    }
                });
            } else {
                console.log("cain't delete that!");
            }
    }
    function selectItem(sourcetype, itemtype, sourceID, itemID) { //select and add a reference to an external object, e.g. a picture to store item
        console.log("tryna select " + itemtype + " for " + sourcetype);
        let headers = { headers: {
                appid: appid,
            }
        };
        if (sourcetype == "scene") {
            if (itemtype == "location") {
                let data = { 
                    scene_id : sourceID,
                    location_id: itemID
                };
                axios.post('/add_scene_location', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "model") {
                let data = { 
                    scene_id : sourceID,
                    model_id: itemID
                };
                axios.post('/add_scene_model', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "object") {
                let data = { 
                    scene_id : sourceID,
                    obj_id: itemID
                };
                axios.post('/add_scene_obj', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "objgroup") {
                let data = { 
                    scene_id : sourceID,
                    group_id: itemID,
                    grouptype: 'object'
                };
                axios.post('/add_scene_group', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "picture") {
                let data = { 
                    scene_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/add_scene_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "postcard") {
                let data = { 
                    scene_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/add_scene_postcard', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "picgroup") {
                let data = { 
                    scene_id : sourceID,
                    group_id: itemID,
                    grouptype: 'picture'
                };
                axios.post('/add_scene_group', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "video") {
                let data = { 
                    scene_id : sourceID,
                    vid_id: itemID
                };
                axios.post('/add_scene_vid', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "paudio") {
                let data = { 
                    scene_id : sourceID,
                    audio_id: itemID,
                    audio_type: "primary"

                };
                axios.post('/add_scene_audio', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "aaudio") {
                let data = { 
                    scene_id : sourceID,
                    audio_id: itemID,
                    audio_type: "ambient"
                };
                console.log("tryna scene aaudio");
                axios.post('/add_scene_audio', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "taudio") {
                let data = { 
                    scene_id : sourceID,
                    audio_id: itemID,
                    audio_type: "trigger"
                };
                axios.post('/add_scene_audio', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "scene") {
            if (itemtype == "vidgroup") {
                let data = { 
                    scene_id : sourceID,
                    group_id: itemID,
                    grouptype: 'video'
                };
                axios.post('/add_scene_group', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "storeitem") {
            if (itemtype == "picture") {
                let data = { 
                    storeitem_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/add_storeitem_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "app") {
            if (itemtype == "picture") {
                let data = { 
                    app_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/add_app_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "asset") {
            if (itemtype == "picture") {
                let data = { 
                    domain_id : sourceID,
                    pic_id: itemID
                };
                console.log("this route is TODO");
                axios.post('/add_asset_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "object") {
            if (itemtype == "picture") {
                let data = { 
                    object_id : sourceID,
                    pic_id: itemID
                };
                console.log("this route is TODO");
                axios.post('/add_object_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "domain") {
            if (itemtype == "picture") {
                let data = { 
                    domain_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/add_domain_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.history.back();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "group") {
            if (itemtype == "picture") {
                let data = { 
                    group_id : sourceID,
                    item_id: itemID
                };
                axios.post('/add_group_item', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                            window.location.href = "index.html?type=group&iid=" + sourceID;
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "group") {
            if (itemtype == "object") {
                let data = { 
                    group_id : sourceID,
                    item_id: itemID
                };
                axios.post('/add_group_item', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                            window.location.href = "index.html?type=group&iid=" + sourceID;
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
    }   
    function removeItem(sourcetype, itemtype, sourceID, itemID) { //remove a reference to an external object, e.g. a picture to store item
        console.log("tryna remove " + itemtype + " from " + sourcetype);
        let headers = { headers: {
            appid: appid,
            }
        };
        // if (sourcetype == "scene") {
        //     if (itemtype == "picgroup") {
        //         let data = { 
        //             scene_id : sourceID,
        //             grouptype : "picture",
        //             group_id: itemID
        //         };
        //         axios.post('/rem_storeitem_pic', data, headers)
        //         .then(function (response) {
        //             console.log(response);
        //             if (response.data.includes("updated")) {
        //                 window.location.reload();
        //             } else {
        //                 $("#topAlert").html(response.data);
        //                 $("#topAlert").show();
        //             }
        //         })
        //         .catch(function (error) {
        //             console.log(error);
        //         });
        //     }
        // }
        if (sourcetype == "scene") {
            if (itemtype == "picgroup") {
                let data = { 
                    scene_id : sourceID,
                    grouptype : "picture",
                    group_id: itemID
                };
                axios.post('/rem_storeitem_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.location.reload();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "storeitem") {
            if (itemtype == "picture") {
                let data = { 
                    storeitem_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/rem_storeitem_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.location.reload();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "app") {
            if (itemtype == "picture") {
                let data = { 
                    app_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/rem_app_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("deleted")) {
                        window.location.reload();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "domain") {
            if (itemtype == "picture") {
                let data = { 
                    domain_id : sourceID,
                    pic_id: itemID
                };
                axios.post('/rem_domain_pic', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("deleted")) {
                        window.location.reload();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
        if (sourcetype == "group") {
            if (itemtype == "item") {
                let data = { 
                    group_id : sourceID,
                    item_id: itemID
                };
                axios.post('/remove_group_item', data, headers)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("updated")) {
                        window.location.reload();
                    } else {
                        $("#topAlert").html(response.data);
                        $("#topAlert").show();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        }
    }
    function getCurrentLocation() {
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        function success(pos) {
            var crd = pos.coords;
            console.log('Your current position is:');
            console.log('Latitude : ' + crd.latitude);
            console.log('Longitude: ' + crd.longitude);
            console.log('More or less ' + crd.accuracy + ' meters.');
        };
        function error(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
            return err.code;
        };
        navigator.geolocation.getCurrentPosition(success, error, options);
        console.log("tryna getLocation");
    };
    function newLocation() {
        var card = "<div class=\x22col-lg-12\x22>" +
        "<div class=\x22card shadow mb-4\x22>" +
            "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
            "<h6 class=\x22m-0 font-weight-bold text-primary\x22>New Location</h6>" +
            "</div>" +
            "<div class=\x22card-body\x22>" +
                "<form id=\x22newLocationForm\x22>" +
                "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Create</button></div>" + 
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-4\x22>" +
                        "<label for=\x22locName\x22>Location Name</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22locName\x22 placeholder=\x22Enter Location Name\x22 value=\x22"+convertTimestamp(timestamp() / 1000)+"\x22required>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemStatus\x22>Location Type</label>" +
                        "<select class=\x22form-control\x22 id=\x22itemTypeSelect\x22 required>" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Geographic</option>" +
                        "<option>Worldspace</option>" +
                        "<option>Localspace</option>" +
                        "<option>Normalized</option>" +
                        "</select>" +
                    "</div>" +
                    "<div id=\x22mapElement\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-5 geoElements\x22>" +
                        //populated when getCurrentLocation clicked below
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div id=\x22latHolder\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-3 geoElements\x22>" +
                        "<label for=\x22latitudeInput\x22>Latitude</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22latitudeInput\x22 placeholder=\x22Latitude\x22 >" +
                    "</div>" +
                    "<div id=\x22longHolder\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-3 geoElements\x22>" +
                        "<label for=\x22longitudeInput\x22>Longitude</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22longitudeInput\x22 placeholder=\x22Longitude\x22 >" +
                    "</div>" +
                    "<div style=\x22display:none;\x22 class=\x22col col-md-1 geoElements\x22>" +
                        //spacer
                    "</div>" +
                    "<div style=\x22display:none;\x22 class=\x22col col-md-2 geoElements\x22>" +
                        "<br>" +
                     "<button id=\x22currentLocationButton\x22 onclick=\x22\x22 class=\x22btn btn-success\x22><i class=\x22fas fa-map-marker-alt\x22></i>  Use Current Location</button>" +
                    "</div>" +
                    "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                        "<label for=\x22wsInputX\x22>World X Position</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputX\x22 placeholder=\x220\x22 >" +
                    "</div>" +
                    "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                        "<label for=\x22wsInputY\x22>World Y Position</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputY\x22 placeholder=\x220\x22 >" +
                    "</div>" +
                    "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                        "<label for=\x22wsInputZ\x22>World Z Position</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputZ\x22 placeholder=\x220\x22 >" +
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22form-group  col-md-6\x22>" +
                        "<label for=\x22locDesc\x22>Location Description</label>" +
                        "<textarea class=\x22form-control\x22 rows=\x223\x22 id=\x22locDesc\x22 placeholder=\x22Enter Location Description\x22 ></textarea>" +
                    "</div>" +
                "</div>" +
                "<div class=\x22col form-group col-md-6\x22>" +
                "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                "<div class=\x22input-group\x22>" +
                    "<div class=\x22input-group-prepend\x22>" +
                    "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                    "</div>" +
                    "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                    "<div id=\x22tagDisplay\x22>" +
                    // sceneTagsHtml +
                    "</div>" +
                "</div>" +
            "</div>" +
            "</div>" +
        "</div>";
        $("#cards").show();
            $("#cardrow").html(card);
            $(function() { 
                $(document).on('click','#addTagButton',function(e){
                    e.preventDefault();  
                    let newTag = document.getElementById("addTagInput").value;
                    console.log("tryna add tag " + newTag);
                    let html = "";
                    tags.push(newTag);
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                }); 
                $(document).on('click','.remTagButton',function(e){
                    e.preventDefault();  
                    console.log("tryna remove tag " + this.id);
                    let html = "";
                    for( var i = 0; i < sceneTags.length; i++){ 
                        if ( tags[i] === this.id) {
                            tags.splice(i, 1); 
                        }
                        }
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                });   
                let $itemTypeSelect = $( '#itemTypeSelect' );
                $itemTypeSelect.on( 'change', function() { //when type dropdown is changed, update subtypes
                    if (document.getElementById("itemTypeSelect").value == "Geographic") {
                        $(".wsElements").hide();
                        $(".geoElements").show();
                    }
                    if (document.getElementById("itemTypeSelect").value == "Worldspace") {
                        $(".geoElements").hide();
                        $(".wsElements").show();
                    }
                    console.log("new locationType " +  document.getElementById("itemTypeSelect").value);
                });
                $('#currentLocationButton').on('click', function(e){
                    e.preventDefault();
                    var options = {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    };
                    navigator.geolocation.getCurrentPosition(success, error, options);
                    function success(pos) {
                        var crd = pos.coords;
                        $("#latitudeInput").val(crd.latitude);
                        $("#longitudeInput").val(crd.longitude);
                        console.log('Your current position is:');
                        console.log('Latitude : ' + crd.latitude);
                        console.log('Longitude: ' + crd.longitude);
                        console.log('More or less ' + crd.accuracy + ' meters.');
                        let mapLink = "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + crd.latitude + "," + crd.longitude + "\x22>" +
                        "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + crd.latitude +
                        "," + crd.longitude + "&zoom=15&size=600x400&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:%7C" + crd.latitude + "," + crd.longitude + "\x22>" + 
                        "</a>";
                        $("#mapElement").html(mapLink);
                    };
                    function error(err) {
                        console.warn('ERROR(' + err.code + '): ' + err.message);
                    };
                });
                $('#newLocationForm').on('submit', function(e) { 
                    e.preventDefault();  
                    let type = document.getElementById("itemTypeSelect").value;
                    let isValid = false;
                    let locDesc = document.getElementById("locDesc").value;
                    let locName = document.getElementById("locName").value;
                    let latitude = document.getElementById("latitudeInput").value;
                    let longitude = document.getElementById("longitudeInput").value;
                    let wsInputX = document.getElementById("wsInputX").value;
                    let wsInputY = document.getElementById("wsInputY").value;
                    let wsInputZ = document.getElementById("wsInputZ").value;
                    if (type == "Geographic") {
                        console.log("tryna set a new latitude " + latitude);
                        if (latitude.length > 4 && longitude.length > 4) {
                            isValid = true;
                        } else {
                            $("#topAlert").html("Latitude and Longitude are required!");
                            $("#topAlert").show();
                        }
                    }
                    if (type == "Worldspace") {
                        console.log("wsInputX " + wsInputX);
                        if (wsInputX.length > 0 && wsInputY.length > 0 && wsInputZ.length > 0) {
                            isValid = true;
                        } else {
                            $("#topAlert").html("World X, Y and Z position values are required!");
                            $("#topAlert").show();
                        }
                    } 
                    console.log("isValid " + isValid);
                    if (isValid) {
                        let locTags = [];
                        let data = {};
                        if (type == "Geographic") {
                            data = {
                                name : locName,
                                type : type,
                                latitude : latitude,
                                longitude : longitude,
                                tags : locTags,
                                description : locDesc
                            };
                        }
                        if (type == "Worldspace") {
                            data = {
                                name : locName,
                                type : type,
                                x: wsInputX,
                                y: wsInputY,
                                z: wsInputZ,
                                tags : locTags,
                                description : locDesc
                            };
                        }
                        axios.post('/newlocation', data)
                        .then(function (response) {
                            console.log(response);
                            if (response.data.includes("created")) {
                                window.location.reload();
                            } else {
                                $("#topAlert").html(response.data);
                                $("#topAlert").show();
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                    }
                });
            });
    }
    function showLocation (item_id) {
        if (item_id != undefined) {
        let tags = [];
        let tagsHtml = "";
        let type = "";
        let config = { headers: {
        appid: appid,
        }
        }
        axios.get('/userlocation/' + item_id, config)
        .then(function (response) {
            let date = response.data.timestamp;
            if (response.data.lastUpdate != null) {
                date = convertTimestamp(response.data.lastUpdate);
            }
            $("#cards").show();
            let mapLink = "";
            type = response.data.type.toLowerCase();
            console.log("location data: " + JSON.stringify(response.data));
            if (type == "geographic") {
                mapLink = "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + response.data.latitude + "," + response.data.longitude + "\x22>" +
                "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + response.data.latitude +
                "," + response.data.longitude + "&zoom=15&size=600x400&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:%7C" + response.data.latitude + "," + response.data.longitude + "\x22>" + 
                "</a>";
            }
            var card = "<div class=\x22col-lg-12\x22>" +
                "<div class=\x22card shadow mb-4\x22>" +
                    "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                    "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Location Details - id: "+response.data._id+"</h6>" +
                    "</div>" +
                    "<div class=\x22card-body\x22>" +
                        // "<div class=\x22media\x22>" +
                        // "<img class=\x22rounded img-fluid mr-3\x22 src=\x22" + response.data.URLhalf+ "\x22>" +
                        // "<div class=\x22media-body\x22>" +
                        // "<h5 class=\x22mt-0\x22>Location Details</h5>" +
                        "<form id=\x22updateLocationForm\x22>" +
                        "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + //new vs existing
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-3\x22>" +
                                "<label for=\x22locName\x22>Location Name</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22locName\x22 value=\x22" + response.data.name + "\x22 required>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-3\x22>" +
                                "<label for=\x22siName\x22>Type</label>" +
                                "<p>" + response.data.type + "</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22lastUpdate\x22>Last Update</label>" +
                            "<p>" + date + "</p>" +
                        "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div id=\x22latHolder\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-3 geoElements\x22>" +
                                "<label for=\x22latitudeInput\x22>Latitude</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22latitudeInput\x22 value=\x22" + response.data.latitude + "\x22 >" +
                            "</div>" +
                            "<div id=\x22longHolder\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-3 geoElements\x22>" +
                                "<label for=\x22longitudeInput\x22>Longitude</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22longitudeInput\x22 value=\x22" + response.data.longitude + "\x22 >" +
                            "</div>" +
                            "<div id=\x22mapElement\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-5 geoElements\x22>" +
                            //populated when getCurrentLocation clicked below
                            "</div>" +
                            "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                                "<label for=\x22wsInputX\x22>World X Position</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputX\x22 value=\x22" + response.data.x + "\x22 >" +
                            "</div>" +
                            "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                                "<label for=\x22wsInputY\x22>World Y Position</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputY\x22 value=\x22" + response.data.y + "\x22 >" +
                            "</div>" +
                            "<div style=\x22display:none;\x22 class=\x22col form-group col-md-3 wsElements\x22>" +
                                "<label for=\x22wsInputZ\x22>World Z Position</label>" +
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22wsInputZ\x22 value=\x22" + response.data.z + "\x22 >" +
                            "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22form-group  col-md-6\x22>" +
                                "<label for=\x22locDesc\x22>Location Description</label>" +
                                "<textarea class=\x22form-control\x22 rows=\x223\x22 id=\x22locDesc\x22 value=\x22" + response.data.description + "\x22 ></textarea>" +
                            "</div>" +
                        
                            "<div class=\x22col form-group col-md-6\x22>" +
                                "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                                "<div class=\x22input-group\x22>" +
                                "<div class=\x22input-group-prepend\x22>" +
                                "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                                "</div>" +
                                "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                                "<div id=\x22tagDisplay\x22>" +
                                tagsHtml +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                        "</form>" +
                        "</div>" +
                        // keyValues(response.data) +
                        "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('location','" + item_id + "')\x22>Delete Location</button>"+
                        "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
                "</div>";
                $("#cardrow").html(card);
                $("#mapElement").html(mapLink);
                if (type == "geographic") {
                    $(".geoElements").show();
                }
                if (type == "worldspace") {
                    $(".wsElements").show();
                }
                if (response.data.tags != null && response.data.tags.length > 0) {
                    tags = response.data.tags;
                    for (let i = 0; i < tags.length; i++) {
                        tagsHtml = tagsHtml + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").html(tagsHtml);
                };
            $(function() { 
                $(document).on('click','#addTagButton',function(e){
                    e.preventDefault();  
                    let newTag = document.getElementById("addTagInput").value;
                    console.log("tryna add tag " + newTag);
                    if (newTag.length > 2) {
                    let html = "";
                    tags.push(newTag);
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                    }
                }); 
                $(document).on('click','.remTagButton',function(e){
                    e.preventDefault();  
                    console.log("tryna remove tag " + this.id);
                    let html = "";
                    for( var i = 0; i < tags.length; i++){ 
                        if ( tags[i] === this.id) {
                            tags.splice(i, 1); 
                        }
                        }
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                });
                $('#updateLocationForm').on('submit', function(e) { 
                    e.preventDefault();  
                    let data = {};
                    let name = document.getElementById("locName").value;
                    let latitude = document.getElementById("latitudeInput").value;
                    let longitude = document.getElementById("longitudeInput").value;
                    let x = document.getElementById("wsInputX").value;
                    let y = document.getElementById("wsInputY").value;
                    let z = document.getElementById("wsInputZ").value;
                    let description = document.getElementById("locDesc").value;
                    if (type == "geographic") {
                        data = {
                        _id : response.data._id,
                        name : name,
                        tags : tags,
                        latitude : latitude,
                        longitude : longitude,
                        description : description
                        }
                    }
                    if (type == "worldspace") {
                        data = {
                        _id : response.data._id,    
                        name : name,
                        tags : tags,
                        x : x,
                        y : y,
                        z : z,
                        description : description
                        };
                    }
                    $.confirm({
                        title: 'Confirm Location Update',
                        content: 'Are you sure you want to update this location?',
                        buttons: {
                        confirm: function () {
                        axios.post('/update_location/' + item_id, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("updated")) {
                                    $("#topSuccess").html("Location Updated!");
                                    $("#topSuccess").show();
                                } else {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                            });
                        },
                        cancel: function () {
                            $("#topAlert").html("Update cancelled");
                            $("#topAlert").show();
                        },
                        }
                    });
                });  
            });
        })
        .catch(function (error) {
        console.log(error);
        });
        } else {
            console.log("undefined!");
        }
    }  
    function getLocations() {
            let config = { headers: {
                appid: appid,
                }
            }
            axios.get('/userlocations/' + userid, config)
            .then(function (response) {
                // console.log(JSON.stringify(response));
                // var jsonResponse = response.data;
                var selectHeader = "";
                var arr = response.data;
                if (mode == "select") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Location for " + parent + " " + itemid);
                }
                var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                    "<thead>"+
                    "<tr>"+
                    selectHeader +
                    "<th></th>"+
                    "<th>Name</th>"+
                    "<th>Type</th>"+
                    "<th>Location</th>"+
                    "<th>Tags</th>"+
                    "<th>Last Update</th>"+
                    // "<th>Status</th>"+
                "</tr>"+
                "</thead>"+
                "<tbody>";
                var tableBody = "";
                var selectButton = "";
                for(var i = 0; i < arr.length; i++) {
                    let locationMap = "";
                    let location = "";
                    let date = arr[i].timestamp;
                    if (arr[i].lastUpdate != null) {
                        date = convertTimestamp(arr[i].lastUpdate);
                    }
                    if (arr[i].type.toLowerCase() == "geographic") {
                        locationMap = "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + arr[i].latitude + "," + arr[i].longitude + "\x22>" +
                        "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + arr[i].latitude + "," + arr[i].longitude + "&zoom=15&size=600x300&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:" + (i + 1) + "%7C" + location.latitude + "," + location.longitude + "\x22>" + 
                        "</a>";
                        location = "lat: " + arr[i].latitude + "<br>lon: " + arr[i].longitude;
                    } else {
                        location = "x: " + arr[i].x + "<br>y: " + arr[i].y + "<br>z: " + arr[i].z; 
                        let scaleString = "";
                        let scaleFactor = 100;
                        let scaleInt = 0;
                        const xMag = Math.abs(arr[i].x);
                        const zMag = Math.abs(arr[i].z);

                        const scaleMax = Math.max(xMag, zMag); //largest mag of x and z
                        if (scaleMax > 100) {
                            scaleString = String(scaleMax).charAt(0);
                            scaleInt = (Number(scaleString));
                        }

                        let xpos =  parseInt(arr[i].x) + 100;
                        let zpos =  100 - parseInt(arr[i].z);
                        let scaleText = "100";

                        if (scaleInt > 0) {
                        scaleText = ((scaleInt + 1) * 100).toString(); 
                        scaleFactor = scaleInt + 1; //use as scale factor
                        xpos =  (parseInt(arr[i].x) / scaleFactor) + 100;
                        zpos =  100 - (parseInt(arr[i].z) / scaleFactor);
                        }

                        console.log("pos " + xpos + " " + zpos);
                        console.log(xMag + " " + zMag + " " + scaleInt + " " + scaleString + " " + scaleFactor);
                        if (xpos != NaN && zpos != NaN) {
                        
                        locationMap = "<div style=\x22width:200px; margin:0 auto;\x22><svg height=\x22200\x22 width=\x22200\x22>" +
                            "<text style=\x22fill:blue;\x22 x=\x220\x22 y=\x22200\x22 class=\x22small\x22>scale "+scaleText+"</text>"+
                            "<line x1=\x220\x22 y1=\x220\x22 x2=\x220\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2210\x22 y1=\x220\x22 x2=\x2210\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2220\x22 y1=\x220\x22 x2=\x2220\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2230\x22 y1=\x220\x22 x2=\x2230\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2240\x22 y1=\x220\x22 x2=\x2240\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2250\x22 y1=\x220\x22 x2=\x2250\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2260\x22 y1=\x220\x22 x2=\x2260\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2270\x22 y1=\x220\x22 x2=\x2270\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2280\x22 y1=\x220\x22 x2=\x2280\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2290\x22 y1=\x220\x22 x2=\x2290\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22100\x22 y1=\x220\x22 x2=\x22100\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:1.5\x22 />" + 
                            "<line x1=\x22110\x22 y1=\x220\x22 x2=\x22110\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22120\x22 y1=\x220\x22 x2=\x22120\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22130\x22 y1=\x220\x22 x2=\x22130\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22140\x22 y1=\x220\x22 x2=\x22140\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22150\x22 y1=\x220\x22 x2=\x22150\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22160\x22 y1=\x220\x22 x2=\x22160\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22170\x22 y1=\x220\x22 x2=\x22170\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22180\x22 y1=\x220\x22 x2=\x22180\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22190\x22 y1=\x220\x22 x2=\x22190\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22200\x22 y1=\x220\x22 x2=\x22200\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x220\x22 x2=\x22200\x22 y2=\x220\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2210\x22 x2=\x22200\x22 y2=\x2210\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2220\x22 x2=\x22200\x22 y2=\x2220\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2230\x22 x2=\x22200\x22 y2=\x2230\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2240\x22 x2=\x22200\x22 y2=\x2240\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2250\x22 x2=\x22200\x22 y2=\x2250\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2260\x22 x2=\x22200\x22 y2=\x2260\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2270\x22 x2=\x22200\x22 y2=\x2270\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2280\x22 x2=\x22200\x22 y2=\x2280\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2290\x22 x2=\x22200\x22 y2=\x2290\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22100\x22 x2=\x22200\x22 y2=\x22100\x22 style=\x22stroke:rgb(0,0,0);stroke-width:1.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22110\x22 x2=\x22200\x22 y2=\x22110\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22120\x22 x2=\x22200\x22 y2=\x22120\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22130\x22 x2=\x22200\x22 y2=\x22130\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22140\x22 x2=\x22200\x22 y2=\x22140\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22150\x22 x2=\x22200\x22 y2=\x22150\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22160\x22 x2=\x22200\x22 y2=\x22160\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22170\x22 x2=\x22200\x22 y2=\x22170\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22180\x22 x2=\x22200\x22 y2=\x22180\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22190\x22 x2=\x22200\x22 y2=\x22190\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22200\x22 x2=\x22200\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<circle cx=\x22"+xpos+"\x22 cy=\x22"+zpos+"\x22 r=\x225\x22 stroke=\x22black\x22 stroke-width=\x221\x22 fill=\x22red\x22 />" +
                            "</svg></div>";
                        }
                    }
                    if (mode == "select") {
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','location','" + itemid + "','" + arr[i]._id + "')\x22>Select Location</button></td>"
                    }  

                    // var locationMap = "<a href=\x22#page-top\x22 onclick=\x22showPicture('" + arr[i]._id + "')\x22><img style=\x22width: 128px;\x22 class=\x22rounded\x22 src=\x22" + arr[i].URLpng + "\x22></a>"
                    var detailsLink = "<a href=\x22#page-top\x22 onclick=\x22showLocation('" + arr[i]._id + "')\x22>" + arr[i].name + "</a>";
                    tableBody = tableBody +
                    "<tr>" +
                        selectButton +
                    "<td>" + locationMap + "</td>" +
                    "<td>" + detailsLink + "</td>" +
                    "<td>" + arr[i].type + "</td>" +
                    "<td>" + location + "</td>" +
                    "<td>" + arr[i].tags + "</td>" +
                    "<td>" + date + "</td>" +
                    // "<td>" + arr[i].item_status + "</td>" +
                    "</tr>";
                    }
                    var tableFoot =  "</tbody>" +
                    "<tfoot>" +
                    "<tr>" +
                    selectHeader +
                    "<th></th>"+
                    "<th>Name</th>"+
                    "<th>Type</th>"+
                    "<th>Location</th>"+
                    "<th>Tags</th>"+
                    "<th>Last Update</th>"+
                    // "<th>Status</th>"+
                    "</tr>" +
                "</tfoot>" +
                "</table>";
                var resultElement = document.getElementById('table1Data');
                resultElement.innerHTML = tableHead + tableBody + tableFoot;
                let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22newLocation()\x22>Create New Location</button>";
                $("#newButton").html(newButton);
                $("#newButton").show();
                const dateIndex = (mode == "select") ? 6 : 5;
                $('#dataTable1').DataTable(
                    {"order": [[ dateIndex, "desc" ]]}
                );
            })
            .catch(function (error) {
            console.log(error);
            });
    }
    function returnTimeKeys(timekeys) { //helper function for showAudio view below
        if (timekeys != null && timekeys.length > 0) {
            var tableHead = "Audio Events: <table id=\x22timekeyTable\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>Start Time (secs)</th>"+
            "<th>Duration</th>"+
            "<th>Type</th>"+
            "<th>Data</th>"+
            "<th></th>"+
            "<th></th>"+
            "</tr>"+
            "</thead>"+
            "<tbody>";
            var tableBody = "";
            var selectButton = "";
            for (var i = 0; i < timekeys.length; i++) {
                tableBody = tableBody +
                "<tr>" +
                // "<td>" + timekeys[i].keystarttime + "</td>" +
                // "<td>" + timekeys[i].keyduration + "</td>" +
                "<td><input type=\x22text\x22 class=\x22tk_start form-control\x22 id=\x22tk_start_" + i + "\x22 value=\x22" + timekeys[i].keystarttime + "\x22></td>" +
                "<td><input type=\x22text\x22 class=\x22tk_duration form-control\x22 id=\x22tk_duration_" + i + "\x22 value=\x22" + timekeys[i].keyduration + "\x22></td>" +
                "<td>" + 
                "<select id=\x22tk_type_"+ i +"\x22 class=\x22tk_type form-control\x22 id=\x22audioEventType\x22 >" +
                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                    "<option>Play Anim</option>" +
                    "<option>Pause</option>" +
                    "<option>Delay</option>" +
                    "<option>text</option>" +
                    "<option>picture</option>" +
                    "<option>Spawn Particles</option>" +
                    "<option>Spawn Object</option>" +
                    "<option>Activity Start</option>" +
                    "<option>Activitity Complete</option>" +
                    "</select>" +
                "</td>" +
                "<td><input type=\x22text\x22 class=\x22tk_data form-control\x22 id=\x22tk_data_" + i + "\x22 value=\x22" + timekeys[i].keydata + "\x22></td>" +
                "<td><i class=\x22fas fa-search-plus\x22></i></td>" +
                // "<td><button class=\x22btn btn-xs btn-info\x22>Update</button><button class=\x22btn btn-xs btn-danger\x22>Remove</button></td>" +
                "<td><button class=\x22remTimeKey btn btn-sm btn-danger\x22 id=\x22tk_rm_"+ i +"\x22>Remove</button></td>" +
                "</tr>";
            }
            var tableFoot =  "</tbody>" +
            "</table>";
            timeKeysHtml = tableHead + tableBody + tableFoot;
            return timeKeysHtml;
        } else {
            return "No Audio Events";
        }
    }
    function showAudio (item_id) {
            let config = { headers: {
                appid: appid,
                }
            }
            axios.get('/audio/' + item_id, config)
            .then(function (response) {
            $("#cards").show();
            $("#pageTitle").html("Audio Details: " + response.data.title);
            // console.log(JSON.stringify(response));
            let user = response.data.userID;
            let date = response.data.otimestamp;
            if (response.data.lastUpdateUserName != null) {
                user = response.data.lastUpdateUserName;
            }
            if (response.data.lastUpdateTimestamp != null) {
                date = response.data.lastUpdateTimestamp;
            }
            let tagsHtml = "";
            let tags = [];
            let timeKeysHtml = "";
            let timekeys = [];
            let currentTime = 0;
            let duration = 0;
            var card = "<div class=\x22col-lg-12\x22>" +
                "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Audio Details - Title: "+ response.data.title + " | _id: " +response.data._id+ "</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                    "<form id=\x22updateAudioForm\x22>" +
                        "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-3\x22>" + 
                                "<label for=\x22audioTitle\x22>Title</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audioTitle\x22 value=\x22" + response.data.title + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22audioAltTitle\x22>Alt Title</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audioAltTitle\x22 value=\x22" + response.data.alt_title + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22audioArtist\x22>Artist</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audioArtist\x22 value=\x22" + response.data.alt_artist + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22audioAlbum\x22>Album</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audioAlbum\x22 value=\x22" + response.data.alt_album + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22filesize\x22>Year</label>" + 
                                "<p>" + response.data.year + "</p>" +
                            "</div>" +

                        "</div>" + 
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22lastUpdate\x22>Last Update</label>" + 
                                "<p>" + convertTimestamp(date) + "</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22user\x22>By User</label>" + 
                                "<p>" + user + "</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22filename\x22>Filename</label>" + 
                                "<p>" + response.data.filename + "</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22filesize\x22>Original File Size</label>" + 
                                "<p>" + (response.data.ofilesize / 100000).toFixed(2) + " mb</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22duration\x22>Duration</label>" + 
                                "<p id=\x22duration\x22></p>" +
                            "</div>" +
                        "</div>" +   
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22sourceTitle\x22>Source Title</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sourceTitle\x22 value=\x22" + response.data.sourceTitle + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22sourceLink\x22>Source Link</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sourceLink\x22 value=\x22" + response.data.sourceLink + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22authorName\x22>Author </label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22authorName\x22 value=\x22" + response.data.authorName + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22authorLink\x22>Author Link</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22authorLink\x22 value=\x22" + response.data.authorLink + "\x22 >" +
                            "</div>" +
                            // "<div class=\x22col form-group col-md-2\x22>" + 
                            //     "<label for=\x22license\x22>License</label>" + 
                            //     "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22modelName\x22 value=\x22" + response.data.license + "\x22 >" +
                            // "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<label for=\x22license\x22>License</label>" +
                                "<select class=\x22form-control\x22 id=\x22license\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>Unknown</option>" +
                                "<option>By Owner</option>" +
                                "<option>CC Attribution</option>" +
                                "<option>CC Attribution-ShareAlike</option>" +
                                "<option>CC Attribution-NoDerivs</option>" +
                                "<option>Attribution-NonCommercial</option>" +
                                "<option>Attribution-NonCommercial-ShareAlike</option>" +
                                "<option>Attribution-NonCommercial-NoDerivs</option>" +
                                "<option>GPL</option>" +
                                "<option>MIT</option>" +
                                "<option>Public Domain</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22modifications\x22>Modifications</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22modifications\x22 value=\x22" + response.data.modifications + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-12\x22>" + 
                                "<button class=\x22float-right btn btn-md btn-success previewModel\x22>Preview Model</button>" +
                            "</div>" +     
                        "</div>" +    
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-4\x22>" +
                                "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                                "<div class=\x22input-group\x22>" +
                                "<div class=\x22input-group-prepend\x22>" +
                                "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                                "</div>" +
                                    "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                                "</div>" +
                                "<div id=\x22tagDisplay\x22>" +
                                    tagsHtml +
                                "</div>" +    
                            "</div>" +
                             
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22Public\x22>Share with Public</label><br>" + //public
                                "<input type=\x22checkbox\x22  id=\x22isPublic\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" + 
                            
                            "<div class=\x22col form-group col-md-12\x22>" + //wavesurfer
                                "<div id=\x22waveform\x22></div>" +
                                "<div id=\x22currentTime\x22>Current Time</div>" +
                                "<button id=\x22newAudioEvent\x22 type=\x22button\x22 class=\x22btn btn-sm btn-success float-right\x22>New Event</button>" +
                                "<button data-action=\x22play\x22 id=\x22playAudio\x22 class=\x22btn btn-info btn-sm float-left\x22>Play/Pause</button>" +
                            "</div>" +
                            "<div id=\x22audioEvents\x22 class=\x22col form-group col-md-12\x22></div>" + //audioEvents
                        "</div>" + 
                        "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('audio','" + item_id + "')\x22>Delete Audio</button>" +
                    "</form>" +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                "</div>" +
                "</div>" +
                "</div>";
                $("#cardrow").html(card);
                $("#isPublic").bootstrapToggle();
                if (response.data.isPublic == true) {
                    $('#isPublic').bootstrapToggle('on');
                }
                
                getDuration(response.data.URLmp3, function(length) {
                    console.log('metadata duration ' + length);
                    duration = length.toFixed(2);
                    let ms = ~~(duration / 60) + ":" + (duration % 60 < 10 ? "0" : "") + (duration % 60).toFixed(2);
                    document.getElementById("duration").textContent = duration + " secs | " + ms + " m:ss.ss";
                }); 
                if (response.data.tags != null && response.data.tags.length > 0) {
                    tags = response.data.tags;
                    if (tags == "[]") { //bad data fix
                        tags = [];
                    }
                    for (let i = 0; i < tags.length; i++) {
                        tagsHtml = tagsHtml + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").html(tagsHtml);
                };
                $(function() { //shorthand document.ready function
                    if (response.data.timekeys != undefined && response.data.timekeys != null) {
                        timekeys = response.data.timekeys;
                    } 
                    // console.log(returnTimeKeys(timekeys));
                    $("#audioEvents").html(returnTimeKeys(timekeys));
                    var wavesurfer = WaveSurfer.create({
                        container: '#waveform',
                        waveColor: 'violet',
                        progressColor: 'purple',
                        // plugins: [
                        //     window.WaveSurfer.timeline.create({
                        //         container: "#wave-timeline"
                        //     })
                        //   ]
                    });
                    wavesurfer.load(response.data.URLmp3);
                    wavesurfer.on('audioprocess', function () {
                        currentTime = wavesurfer.getCurrentTime();
                        // console.log(cTime);
                        $("#currentTime").html("Current Time: " + currentTime.toFixed(2));
                    });
                    if (timekeys != undefined) {
                        for (let i = 0; i < timekeys.length; i++) { //init the dropdowns in timekey table
                            $("#tk_type_" + i).val(timekeys[i].keytype).change();
                        }
                    }
                    $(document).on('change', '.tk_start', function() {
                        console.log(this.id + " value " + this.value);
                        for (let i = 0; i < timekeys.length; i++) {
                            if (this.id == "tk_start_" + i) {
                                if (!isNaN(this.value)) {
                                    timekeys[i].keystarttime = Number(this.value);
                                } else {
                                    console.log("must be a number!");
                                }
                            }
                        }
                    });
                    $(document).on('change', '.tk_duration', function() {
                        console.log(this.id + " value " + this.value);
                        for (let i = 0; i < timekeys.length; i++) {
                            if (this.id == "tk_duration_" + i) {
                                if (!isNaN(this.value)) {
                                    timekeys[i].keyduration = Number(this.value);
                                } else {
                                    console.log("must be a number!");
                                }
                            }
                        }
                    });
                    $(document).on('change', '.tk_type', function() {
                        
                        for (let i = 0; i < timekeys.length; i++) {
                            if (this.id == "tk_type_" + i) {
                                console.log(this.id + " value " + this.value);
                                timekeys[i].keytype = this.value;
                            }
                        }
                    });
                    $(document).on('change', '.tk_data', function() {
                        console.log(this.id + " value " + this.value);
                        for (let i = 0; i < timekeys.length; i++) {
                            if (this.id == "tk_data_" + i) {
                                timekeys[i].keydata = this.value;
                            }
                        }
                    });
                    $(document).on('click','#playAudio',function(e){
                        e.preventDefault();
                        if (wavesurfer.isPlaying()) {
                            wavesurfer.pause();
                        } else {
                            wavesurfer.play();
                        }
                    });
                    $(document).on('click','#addTagButton',function(e){
                        e.preventDefault();  
                        let newTag = document.getElementById("addTagInput").value;
                        console.log("tryna add tag " + newTag);
                        if (newTag.length > 2) {
                        let html = "";
                        tags.push(newTag);
                        for (let i = 0; i < tags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                        }
                    }); 
                    $(document).on('click','.remTagButton',function(e){
                        e.preventDefault();  
                        console.log("tryna remove tag " + this.id);
                        let html = "";
                        for( var i = 0; i < tags.length; i++){ 
                            if ( tags[i] === this.id) {
                                tags.splice(i, 1); 
                            }
                        }
                        for (let i = 0; i < tags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                    });
                    $(document).on('click','#newAudioEvent',function(e){
                        e.preventDefault();  
                        let newTimeKey = {
                            keytype: "",
                            keystarttime: currentTime.toFixed(2),
                            keyduration: 5,
                            keydata: ""
                            }
                        timekeys.push(newTimeKey);
                        $("#audioEvents").empty();
                        $("#audioEvents").html(returnTimeKeys(timekeys));
                        for (let i = 0; i < timekeys.length; i++) {
                            $("#tk_type_" + i).val(timekeys[i].keytype).change();
                        }

                    }); 
                    $(document).on('click','.remTimeKey',function(e) {
                        e.preventDefault();  
                        console.log("tryna remove timekey " + this.id);
                        let html = "";
                        for( var i = 0; i < timekeys.length; i++){ 
                            if ( "tk_rm_" + i === this.id) {
                                timekeys.splice(i, 1); 
                            }
                        }
                        $("#audioEvents").empty();
                        $("#audioEvents").html(returnTimeKeys(timekeys));
                        for (let i = 0; i < timekeys.length; i++) {
                            $("#tk_type_" + i).val(timekeys[i].keytype).change();
                        }
                    });
                    
                    $('#updateAudioForm').on('submit', function(e) { //use submit action for form validation to work
                        e.preventDefault();  
                        let title = document.getElementById("audioTitle").value;
                        let alttitle = document.getElementById("audioAltTitle").value;
                        let artist = document.getElementById("audioArtist").value;
                        let album = document.getElementById("audioAlbum").value;
                        let status = $("#isPublic").prop("checked");
                        console.log("isPublic " + status);
                        let item_status = (status == true) ? "private" : "public";
                        console.log("tryna submit");
                        let data = {
                            _id: response.data._id,
                            title: title,
                            tags: tags,
                            isPublic : status,
                            timekeys : timekeys,
                            // samplekeys : req.body.samplekeys,
                            // user_groups: req.body.user_groups,
                            alt_title: alttitle,
                            alt_artist: artist,
                            alt_source: album,
                            clipDuration : duration
                            // textitemID : req.body.textitemID != null ? req.body.textitemID : "",
                            // textgroupID : req.body.textgroupitemID != null ? req.body.textgroupitemID : "",
                            // pictureitemID : req.body.pictureitemID != null ? req.body.pictureitemID : "",
                            // picturegroupID : req.body.picturegroupID != null ? req.body.picturegroupID : ""

                        }
                        axios.post('/update_audio/' + item_id, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("updated")) {
                                    $("#topSuccess").html(response.data);
                                    $("#topSuccess").show();
                                    
                                } else {
                                    $("#topAlert").html(response);
                                    $("#topAlert").show();
                                }
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                        });
                    });
            })
            .catch(function (error) {
            console.log(error);
            });
    }  
    function getDuration(src, cb) { //util
        var audio = new Audio();
        $(audio).on("loadedmetadata", function(){
            cb(audio.duration);
        });
        audio.src = src;
    }
    function getAudio() {
            let config = { headers: {
                appid: appid,
                }
            }
            axios.get('/useraudio/' + userid, config)
            .then(function (response) {
                // console.log(JSON.stringify(response));
                // var jsonResponse = response.data;
                var selectHeader = "";
                var arr = response.data;
                
                if (mode == "select") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Audio for " + parent + " " + itemid);
                }
                if (mode == "paudio") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Primary Audio for " + parent + " " + itemid);
                }
                if (mode == "aaudio") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Ambient Audio for " + parent + " " + itemid);
                }
                if (mode == "taudio") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Trigger Audio for " + parent + " " + itemid);
                }
                var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                    "<thead>"+
                    "<tr>"+
                    selectHeader +
                    "<th></th>" +
                    "<th>Name</th>" +
                    "<th>Date</th>" +
                    "<th>HiddenDate</th>" +
                    "<th>Tags</th>" +
                    "<th>Status</th>"+
                    "</tr>"+
                    "</thead>"+
                    "<tbody>";
                var tableBody = "";
                var selectButton = "";
                let hideIndex = 3;
                for(var i = 0; i < arr.length; i++) {
                    if (mode == "select") {
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','audio','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></td>";
                        hideIndex = 4;
                    }  
                    if (mode == "paudio") { //select primary audio
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','paudio','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></td>";
                        hideIndex = 4;
                    }  
                    if (mode == "aaudio") {//select ambient audio
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','aaudio','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></td>";
                        hideIndex = 4;
                    }  
                    if (mode == "taudio") {//select trigger audio
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','taudio','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></td>";
                        hideIndex = 4;
                    }  
                    let timestamp = arr[i].otimestamp;
                    if (arr[i].lastUpdateTimestamp != null) {
                        timestamp = arr[i].lastUpdateTimestamp;
                        // console.log("updated timeStamp " + timestamp);
                    }
                    // var detailsPicLink = "<a href=\x22#page-top\x22 onclick=\x22showAudio('" + arr[i]._id + "')\x22><img  class=\x22img-fluid rounded\x22 src=\x22" + arr[i].URLpng + "\x22></a>"
                    // var detailsLink = "<button class=\x22btn btn-sm\x22 onclick=\x22showAudio('" + arr[i]._id + "')\x22><i class=\x22far fa-edit\x22></i></button><a href=\x22#page-top\x22 onclick=\x22showAudio('" + arr[i]._id + "')\x22>" + arr[i].title + "</a>";
                    var detailsPicLink = "<a href=\x22index.html?type=saudio&iid=" + arr[i]._id + "\x22><img  class=\x22img-fluid rounded\x22 src=\x22" + arr[i].URLpng + "\x22></a>"
                    var detailsLink = "<a class=\x22btn btn-sm\x22 href=\x22index.html?type=saudio&iid=" + arr[i]._id + "\x22><i class=\x22far fa-edit\x22></i></button><a href=\x22index.html?type=saudio&iid=" + arr[i]._id + "\x22>" + arr[i].title + "</a>";
                    tableBody = tableBody +
                    "<tr>" +
                        selectButton +
                    "<td>" + detailsPicLink + "</td>" +
                    "<td>" + detailsLink + "</td>" +
                    "<td>" + convertTimestamp(timestamp) + "</td>" +
                    "<td>" + timestamp + "</td>" +
                    "<td>" + arr[i].tags + "</td>" +
                    "<td>" + arr[i].isPublic + "</td>" +
                    // "<td>" + audioPlayer + "</td>" +
                    "</tr>";
                    }
                    var tableFoot =  "</tbody>" +
                    "<tfoot>" +
                    "<tr>" +
                    selectHeader +
                    "<th></th>"+
                    "<th>Name</th>"+
                    "<th>Date</th>"+
                    "<th>HiddenDate</th>"+
                    "<th>Tags</th>"+
                    "<th>Status</th>"+
                    // "<th></th>"+
                    "</tr>" +
                "</tfoot>" +
                "</table>";
                var resultElement = document.getElementById('table1Data');
                resultElement.innerHTML = tableHead + tableBody + tableFoot;
                $('#dataTable1').DataTable(
                    {"order": [[ hideIndex, "desc" ]],
                    'columnDefs': [
                        { 'orderData':[hideIndex], 'targets': [1] },
                        {
                            'targets': [hideIndex],
                            'visible': false,
                            'searchable': false
                        },
                    ]}
                );
            })
            .catch(function (error) {
            console.log(error);
            });
            let newButton = "<a href=\x22index.html?type=bulkup\x22 class=\x22btn btn-info  float-right\x22 >Upload New Audio</button>";
            $("#newButton").html(newButton);
            $("#newButton").show();
    }
    function showText(item_id) {
        let config = { headers: {
            appid: appid,
            }
        }
        tagsHtml = "";
        tags = [];
        axios.get('/usertext/' + item_id, config)
        .then(function (response) {
        let user = response.data.userID;
        let date = response.data.otimestamp;
        if (response.data.lastUpdateUserName != null) {
            user = response.data.lastUpdateUserName;
        }
        if (response.data.lastUpdateTimestamp != null) {
            date = response.data.lastUpdateTimestamp;
        }
        $("#cards").show();
        // let textTitle = response.data.title;
        // let textstring = response.data.textstring != undefined ? response.data.textstring : ""; 
        // console.log("textstring : " + textstring);
        var card = "<div class=\x22col-lg-12\x22>" +
        "<div class=\x22card shadow mb-4\x22>" +
            "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
            "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Text Details - Title: "+ response.data.title + " | _id: " +response.data._id+ "</h6>" +
            "</div>" +
            "<div class=\x22card-body\x22>" +
                // "<div class=\x22media\x22>" +
               
                // // "<img class=\x22rounded img-fluid mr-3\x22 src=\x22" + response.data.URLvid+ "\x22>" +
                // "<div class=\x22media-body\x22>" +

            "<form id=\x22updateTextForm\x22>" +
                "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-3\x22>" + 
                        "<label for=\x22textTitle\x22>Title</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22textTitle\x22 value=\x22" + response.data.title + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22textDesc\x22>Description</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22textDesc\x22 value=\x22" + response.data.desc + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<label for=\x22textType\x22>Type</label>" +
                        "<select class=\x22form-control\x22 id=\x22textType\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Code</option>" +
                        "<option>Quote</option>" +
                        "<option>Excerpt</option>" +
                        "<option>Message</option>" +
                        "<option>Dialog</option>" +
                        "<option>Instruction</option>" +
                        "<option>Story</option>" +
                        "<option>Myth</option>" +
                        "<option>Poem</option>" +
                        "<option>Lyric</option>" +
                        "</select>" +
                    "</div>" +

                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22author\x22>Author</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22author\x22 value=\x22" + response.data.author + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22year\x22>year</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22year\x22 value=\x22" + response.data.year + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22source\x22>Source</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22source\x22 value=\x22" + response.data.source + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22sourceURL\x22>Source URL</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sourceURL\x22 value=\x22" + response.data.sourceURL + "\x22 >" +
                    "</div>" +
                "</div>" +     
                "<div class=\x22form-row\x22>" +


                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                        "<div class=\x22input-group\x22>" +
                        "<div class=\x22input-group-prepend\x22>" +
                        "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                    "</div>" +
                        "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                    "</div>" +
                    "<div class=\x22form-row\x22 id=\x22tagDisplay\x22>" +
                        tagsHtml +
                    "</div>" +    
                    "</div>" + 
                    "<div class=\x22col form-group col-md-1\x22>" +
                      //spacer
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22\x22>Last Update</label>" + 
                        "<p>" + convertTimestamp(date) + "</p>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22\x22>By User</label>" + 
                        "<p>" + user + "</p>" +
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-9\x22>" +
                        "<label for=\x22textstring\x22>Scene Text</label>" + //sceneText
                        "<textarea rows=\x228\x22 cols=\x22400\x22 class=\x22form-control\x22 id=\x22textstring\x22 placeholder=\x22Enter main text here - delimit sequence breaks with '~'\x22 value=\x22" + response.data.textstring + "\x22></textarea>" +
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22fontSelect\x22>Font</label>" + //FontSelect
                        "<select class=\x22form-control\x22 id=\x22fontSelect\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +

                            "<option>Oswald Bold SDF</option>" +
                            "<option>Augusta SDF</option>" +
                            "<option>eartmbe12 SDF</option>" +
                            "<option>museosans_500-webfont SDF</option>" +
                            "<option>Phosphate SDF</option>" +
                            "<option>Trattatello SDF</option>" +
                            "<option>Trebuchet MS Bold SDF</option>" +
                            "<option>LucidaGrande SDF</option>" +
                            "<option>kimberley bl SDF</option>" +
                            "<option>Trebuchet MS Bold SDF</option>" +
                            "<option>Herculanum SDF</option>" +
                        "</select>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<label for=\x22fontSize\x22>Font Size</label>" + //fontSize
                        "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22priceHelp\x22 id=\x22fontSize\x22 placeholder=\x22Enter Font Size\x22 value=\x22" + response.data.fontSize + "\x22 >" +
                        "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>8 - 200</small>" +
                    "</div>" +
                    "<div class=\x22col form-group\x22> " +
                        "<label for=\x22textAlignBtns\x22> Alignment </label>" + //alignement
                        "<br><div id=\x22textAlignBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                            "<label class=\x22btn btn-secondary active\x22>" +
                                "<input type=\x22radio\x22 name=\x22textAlign\x22 value=\x22Left\x22 id=\x22Left\x22 autocomplete=\x22off\x22 checked> Left " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textAlign\x22 value=\x22Right\x22 id=\x22Right\x22 autocomplete=\x22off\x22> Right " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textAlign\x22 value=\x22Centered\x22 id=\x22Centered\x22 autocomplete=\x22off\x22> Centered " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textAlign\x22 value=\x22Justified\x22 id=\x22Justified\x22 autocomplete=\x22off\x22> Justified " +
                            "</label>" +
                        "</div>" +
                    "</div>" +
                    "<div class=\x22col form-group\x22> " +
                        "<label for=\x22textModeBtns\x22> Mode </label>" + //mode
                        "<br><div id=\x22textModeBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                            "<label class=\x22btn btn-secondary active\x22>" +
                                "<input type=\x22radio\x22 name=\x22textMode\x22 value=\x22Normal\x22 id=\x22Normal\x22 autocomplete=\x22off\x22 checked> Normal " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textMode\x22 value=\x22Split\x22 id=\x22Split\x22 autocomplete=\x22off\x22> Split " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textMode\x22 value=\x22Paged\x22 id=\x22Paged\x22 autocomplete=\x22off\x22> Paged " +
                            "</label>" +
                            "<label class=\x22btn btn-secondary\x22>" +
                                "<input type=\x22radio\x22 name=\x22textMode\x22 value=\x22Scroll\x22 id=\x22Scroll\x22 autocomplete=\x22off\x22> Scroll " +
                            "</label>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-2\x22> " +
                        "<label for=\x22fontFillColor\x22>Fill Color</label>" + //sceneText
                        "<input id=\x22fontFillColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22> " +
                        "<label for=\x22fontOutlineColor\x22>Outline Color</label>" + //sceneText
                        "<input id=\x22fontOutlineColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22> " +
                        "<label for=\x22fontGlowColor\x22>Glow Color</label>" + //sceneText
                        "<input id=\x22fontGlowColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22> " +
                        "<label for=\x22textBackgroundColor\x22>Background Color</label>" + //sceneText
                        "<input id=\x22textBackgroundColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22textBackground\x22>Text Background</label>" + //FontSelect
                        "<select class=\x22form-control\x22 id=\x22textBackground\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>scifi</option>" +
                            "<option>parchment</option>" +
                            "<option>ARKit</option>" +
                            "<option>Geographic</option>" +
                        "</select>" +
                    "</div>" +
                "</div>" +
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<div class=\x22\x22><label for=\x22textScaleByDistance\x22>Distance Scaling</label><br>" + 
                        "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22textScaleByDistance\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<div class=\x22\x22><label for=\x22textRotate\x22>Billboard</label><br>" +     
                        "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22textRotate\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    "</div>" +
                    // "<div class=\x22col form-group col-md-2\x22>" +
                    //     "<div class=\x22\x22><label for=\x22textLoop\x22>Loop Text</label><br>" + 
                    //     "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22textLoop\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    // "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<div class=\x22\x22><label for=\x22useThreeDeeText\x22>3D Text</label><br>" + 
                        "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22useThreeDeeText\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +  
                    "</div>" +
                    // "<div class=\x22col form-group col-md-2\x22>" +
                    //     "<div class=\x22\x22><label for=\x22textAudioSync\x22>Sync to Audio</label><br>" +
                    //     "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22textAudioSync\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    // "</div>" +    
                "</div>" +    
     
                "</div>" +
                // "<div class=\x22form-row\x22>" +
                // html +
            "</form>" +
            "</div>" +
            "</div>" +
                // "<h5 class=\x22mt-0\x22></h5><br><br>" +
                keyValues(response.data) +
                
                // "</div>" +
                "</div>" +
            "</div>" +
        "</div>" +
        "</div>";
        $("#cardrow").html(card);
        let textAlignment = response.data.alignment;
        let textMode = response.data.mode;
        console.log(JSON.stringify(response.data));
        if (response.data.alignment) {
            let selection = document.getElementById(textAlignment); //radio
            $(selection).closest('.btn').button('toggle');
        }
        if (response.data.mode) {
            let selection = document.getElementById(textMode); //radio
            $(selection).closest('.btn').button('toggle');
        }
        document.getElementById("textstring").value = response.data.textstring;
        document.getElementById("fontFillColor").value = response.data.fillColor;
        document.getElementById("fontGlowColor").value = response.data.glowColor;
        document.getElementById("fontOutlineColor").value = response.data.outlineColor;
        document.getElementById("textBackgroundColor").value = response.data.textBackgroundColor;
        document.getElementById("textBackground").value = response.data.textBackground;
        $('#textType').find('option').each(function(i,e){
            // console.log($(e).val());
            if($(e).val() === response.data.type){
                $('#textType').prop('selectedIndex',i);
            }
        });        
        $('#fontSelect').find('option').each(function(i,e){
            // console.log($(e).val());
            if($(e).val() === response.data.font){
                $('#fontSelect').prop('selectedIndex',i);
            }
        });
        $('#textBackground').find('option').each(function(i,e){
            // console.log($(e).val());
            if($(e).val() === response.data.textBackground){
                $('#textBackground').prop('selectedIndex',i);
            }
        });

        $("#textScaleByDistance").bootstrapToggle();
        if (response.data.scaleByDistance == true) {
            $('#textScaleByDistance').bootstrapToggle('on');
        } 
        $("#textRotate").bootstrapToggle();
        if (response.data.rotateToPlayer == true) {
            $('#textRotate').bootstrapToggle('on');
        } 
        $("#useThreeDeeText").bootstrapToggle();
        if (response.data.useThreeDeeText == true) {
            $('#useThreeDeeText').bootstrapToggle('on');
        } 
        $("#isPublic").bootstrapToggle();
        if (response.data.isPublic == true) {
            $('#isPublic').bootstrapToggle('on');
        } 
        if (response.data.tags != null && response.data.tags.length > 0) {
            tags = response.data.tags;
            for (let i = 0; i < tags.length; i++) {
                tagsHtml = tagsHtml + 
                "<div class=\x22btn btn-light\x22>" +   
                    "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                    "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                "</div>";
            }
            $("#tagDisplay").html(tagsHtml);
        };
        $(function() { //shorthand document.ready function
            // let textAlign 
            $('#textAlignBtns .btn').on('click', function(event) {
                event.preventDefault();  
                var val = $(this).find('input').val();
                textAlignment = val;
                console.log(textAlignment);
            });
            $('#textModeBtns .btn').on('click', function(event) {
                event.preventDefault();  
                var val = $(this).find('input').val();
                textMode = val;
                console.log(textMode);
            });
            $(document).on('click','#addTagButton',function(e){
                e.preventDefault();  
                let newTag = document.getElementById("addTagInput").value;
                console.log("tryna add tag " + newTag);
                if (newTag.length > 2) {
                let html = "";
                tags.push(newTag);
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
                }
            }); 
            $(document).on('click','.remTagButton',function(e){
                e.preventDefault();  
                console.log("tryna remove tag " + this.id);
                let html = "";
                for( var i = 0; i < tags.length; i++){ 
                    if ( tags[i] === this.id) {
                        tags.splice(i, 1); 
                        }
                    }
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
            });
            $('#updateTextForm').on('submit', function(e) { //use submit action for form validation to work
                e.preventDefault();  
                let title = document.getElementById("textTitle").value;
                let textstring = document.getElementById("textstring").value;
                // let scaleByDistance = document.getElementById("scaleByDistance");
                let desc = document.getElementById("textDesc").value;
                // let status = $("#isPublic").prop("checked");
                let type = document.getElementById("textType").value;
                let scaleByDistance = document.getElementById("textScaleByDistance").checked;
                let rotateToPlayer = document.getElementById("textRotate").checked;
                let useThreeDeeText = document.getElementById("useThreeDeeText").checked;
                let font = document.getElementById("fontSelect").value;
                let fontSize = document.getElementById("fontSize").value;
                // let alignment = document.getElementById("alignment").value;
                let textBackground = document.getElementById("textBackground").value;
                let backgroundColor = document.getElementById("textBackgroundColor").value;
                let glowColor = document.getElementById("fontGlowColor").value;
                let fillColor = document.getElementById("fontFillColor").value;
                let outlineColor = document.getElementById("fontOutlineColor").value;
                let author = document.getElementById("author").value;
                let source = document.getElementById("source").value;
                let sourceURL = document.getElementById("sourceURL").value;
                let year = document.getElementById("year").value;

                console.log("tryna submit");
                let data = {
                    _id: response.data._id,
                    title: title,
                    tags: tags,
                    type: type,
                    textstring: textstring,
                    desc: desc,
                    scaleByDistance: scaleByDistance,
                    rotateToPlayer : rotateToPlayer,
                    useThreeDeeText : useThreeDeeText,
                    font: font,
                    fontSize: fontSize,
                    alignment: textAlignment,
                    mode: textMode,
                    textBackground: textBackground,
                    textBackgroundColor: backgroundColor,
                    fillColor: fillColor,
                    outlineColor: outlineColor,
                    glowColor: glowColor,
                    author: author,
                    source: source,
                    sourceURL: sourceURL,
                    year: year
                }
                axios.post('/updatetext/' + item_id, data)
                    .then(function (response) {
                        console.log(response);
                        if (response.data.includes("updated")) {
                            $("#topSuccess").html(response.data);
                            $("#topSuccess").show();
                            
                        } else {
                            $("#topAlert").html(response);
                            $("#topAlert").show();
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                });
            });
        })
        .catch(function (error) {
        console.log(error);
        });
    } 
    function newText() {
        $("#cards").show();
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Create New Text</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<form id=\x22newTextForm\x22>" +
                "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>Create</button>" + 
                    "<div class=\x22form-row\x22>" +
                    
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22title\x22>Text Name</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22title\x22 required>" +
                        "</div>" +
                        
                    "</div>" +
                "</div>" +
                "</form>" +
            "</div>";
        $("#cardrow").html(card);
        $(function() { //shorthand document.ready function
            $('#newTextForm').on('submit', function(e) { 
                e.preventDefault();  
                // let objname = document.getElementById("objname").value;
                let title = document.getElementById("title").value;
                // let objdesc = document.getElementById("objdesc").value;
                let data = {
                    title: title
                }
                $.confirm({
                    title: 'Confirm Text Create',
                    content: 'Are you sure you want to create an new text?',
                    buttons: {
                    confirm: function () {
                        axios.post(/newtext/, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("created")) {
                                    window.location.reload();
                                    // $("#topSuccess").html("New Text Created!");
                                    // $("#topSuccess").show();
                                    window.location.href = "index.html?type=texts";
                                } else {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                            });
                        },
                        cancel: function () {
                            $("#topAlert").html("Update cancelled");
                            $("#topAlert").show();
                        },
                    }
                });
                console.log("tryna submit");
 
            });
        });
    }
    function getTexts() {
        let config = { headers: {
            appid: appid,
            }
        }
        axios.get('/usertexts/' + userid, config)
        .then(function (response) {
            // console.log(JSON.stringify(response));
            // var jsonResponse = response.data;
            var selectHeader = "";
            var arr = response.data;
         
            if (mode == "select") {
                selectFor = parent;
                selectHeader = "<th>Select</th>";
                $("#pageTitle").html("Select Text for " + parent + " " + itemid);
            }
            var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                selectHeader +
                    // "<th></th>"+
                "<th>Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Tags</th>"+
                "<th>Status</th>"+
            "</tr>"+
            "</thead>"+
            "<tbody>";
            var tableBody = "";
            var selectButton = "";
            for(var i = 0; i < arr.length; i++) {
               
                if (mode == "select") {
                    selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','picture','" + itemid + "','" + arr[i]._id + "')\x22>Select Picture</button></td>"
                }  
                let timestamp = 0;
                if (arr[i].lastUpdateTimestamp != null) {
                    timestamp = arr[i].lastUpdateTimestamp;
                    console.log("updated timeStamp " + timestamp);
                } else if (arr[i].otimestamp != null) {
                    timestamp = arr[i].otimestamp;
                }
                let isPublic = false;
                if (arr[i].isPublic != null) {
                    isPublic = arr[i].isPublic;
                }
                // var detailsPicLink = "<a href=\x22#page-top\x22 onclick=\x22showPicture('" + arr[i]._id + "')\x22><img class=\x22rounded\x22 src=\x22" + arr[i].URLthumb + "\x22></a>"
                var detailsLink = "<a href=\x22index.html?type=text&iid=" + arr[i]._id + "\x22>" + arr[i].title + "</a>";

                tableBody = tableBody +
                "<tr>" +
                    selectButton +
                // "<td>" + detailsLink + "</td>" +
                "<td>" + detailsLink + "</td>" +
                "<td>" + convertTimestamp(timestamp) + "</td>" +
                "<td>" + timestamp + "</td>" +
                "<td>" + arr[i].tags + "</td>" +
                "<td>" + isPublic + "</td>" +
                "</tr>";
                }
                var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                selectHeader +
                // "<th></th>"+
                "<th>Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Tags</th>"+
                "<th>Status</th>"+
                "</tr>" +
            "</tfoot>" +
            "</table>";
            var resultElement = document.getElementById('table1Data');
            resultElement.innerHTML = tableHead + tableBody + tableFoot;

            $('#dataTable1').DataTable(
                {"order": [[ 2, "desc" ]],
                'columnDefs': [
                    { 'orderData':[1], 'targets': [1] },
                    {
                        'targets': [2],
                        'visible': false,
                        'searchable': false
                    },
                ]}
            );
        })
        .catch(function (error) {
        console.log(error);
        });
        let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22newText()\x22>Create New Text</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
}
    function updatePicture(item) {

    }
    function showPicture(item_id) {
        let config = { headers: {
        appid: appid,
        }
        }
        tagsHtml = "";
        tags = [];
        axios.get('/userpic/' + item_id, config)
        .then(function (response) {
        let user = response.data.userID;
        let date = response.data.otimestamp;
        if (response.data.lastUpdateUserName != null) {
            user = response.data.lastUpdateUserName;
        }
        if (response.data.lastUpdateTimestamp != null) {
            date = response.data.lastUpdateTimestamp;
        }
        $("#cards").show();

        var card = "<div class=\x22col-lg-12\x22>" +
        "<div class=\x22card shadow mb-4\x22>" +
            "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
            "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Picture Details - Title: "+ response.data.title + " | _id: " +response.data._id+ "</h6>" +
            "</div>" +
            "<div class=\x22card-body\x22>" +
                // "<div class=\x22media\x22>" +
               
                // // "<img class=\x22rounded img-fluid mr-3\x22 src=\x22" + response.data.URLvid+ "\x22>" +
                // "<div class=\x22media-body\x22>" +

            "<form id=\x22updatePictureForm\x22>" +
                "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-4\x22>" + 
                        "<label for=\x22vidTitle\x22>Title</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22picTitle\x22 value=\x22" + response.data.title + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22sceneTitle\x22>Last Update</label>" + 
                        "<p>" + convertTimestamp(date) + "</p>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" + 
                        "<label for=\x22sceneTitle\x22>By User</label>" + 
                        "<p>" + user + "</p>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" + 
                        "<label for=\x22sceneTitle\x22>Filename</label>" + 
                        "<p>" + response.data.filename + "</p>" +
                    "</div>" +
                "</div>" +     
                "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemStatus\x22>Orientation</label>" +
                        "<select class=\x22form-control\x22 id=\x22orientation\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Landscape</option>" +
                        "<option>Portrait</option>" +
                        "<option>Square</option>" +
                        "<option>Circle</option>" +
                        "<option>Equirectangular</option>" +
                        "<option>Heightmap</option>" +
                        "<option>Cubemap</option>" +
                        "</select>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22siName\x22>Upper Caption</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22captionUpper\x22 placeholder=\x22Enter Upper Caption\x22 value=\x22" + response.data.captionUpper + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                    "<label for=\x22siName\x22>Lower Caption</label>" +
                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22captionLower\x22 placeholder=\x22Enter Lower Caption\x22 value=\x22" + response.data.captionLower + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-4\x22>" +
                        "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                        "<div class=\x22input-group\x22>" +
                        "<div class=\x22input-group-prepend\x22>" +
                        "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                    "</div>" +
                        "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                    "</div>" +
                    "<div class=\x22form-row\x22 id=\x22tagDisplay\x22>" +
                        tagsHtml +
                    "</div>" +    
                    "</div>" + 
         

                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<label for=\x22linkType\x22>Link Type</label>" +
                        "<select class=\x22form-control\x22 id=\x22linkType\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>None</option>" +

                        "<option>Web</option>" +
                        "<option>Scene</option>" +
                        "<option>Comment</option>" +
                        "<option>Share</option>" +
                        "</select>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22siName\x22>Link URL</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22linkURL\x22 placeholder=\x22Link URL\x22 value=\x22" + response.data.linkURL + "\x22 >" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        //spacer
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<div class=\x22\x22><label for=\x22hasAlpha\x22>Has Alpha</label><br>" + //alpha
                            "<input type=\x22checkbox\x22  id=\x22hasAlpha\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                        "</div>" + 
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<div class=\x22\x22><label for=\x22Public\x22>Share with Public</label><br>" + //public
                        "<input type=\x22checkbox\x22  id=\x22isPublic\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    "</div>" + 

                    "<div class=\x22col form-group col-md-12\x22>" + 
                        
                    "<a target=\x22_blank\x22 href=\x22" +response.data.URLstandard+ "\x22><img class=\x22rounded img-fluid mr-3\x22 src=\x22" + response.data.URLhalf+ "\x22></a>" +
                    "</div>" +       
                "</div>" +
                // "<div class=\x22form-row\x22>" +
                // html +
            "</form>" +
            "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('picture','" + item_id + "')\x22>Delete Picture</button>" +
            "<button type=\x22button\x22 class=\x22btn btn-sm btn-info float-right\x22 style=\x22display:none;\x22 id=\x22createCubemapButton\x22>Generate CubeMap</button>" +
            "</div>" +
            "</div>" +
                "<h5 class=\x22mt-0\x22>Picture Details</h5><br><br>" +
                keyValues(response.data) +
                
                "</div>" +
                "</div>" +
            "</div>" +
        "</div>" +
        "</div>";
        $("#cardrow").html(card);
        $('#orientation').find('option').each(function(i,e){
            // let orientation = $(e).val();
            if($(e).val() === response.data.orientation){
                $('#orientation').prop('selectedIndex',i);
            }
        });
        $('#linkType').find('option').each(function(i,e){
            console.log($(e).val());
            if($(e).val() === response.data.linkType){
                $('#linkType').prop('selectedIndex',i);
            }
        });
        $("#hasAlpha").bootstrapToggle();
        if (response.data.hasAlphaChannel == true) {
            $('#hasAlpha').bootstrapToggle('on');
        } 
        $("#isPublic").bootstrapToggle();
        if (response.data.isPublic == true) {
            $('#isPublic').bootstrapToggle('on');
        } 
        if (response.data.tags != null && response.data.tags.length > 0) {
            tags = response.data.tags;
            for (let i = 0; i < tags.length; i++) {
                tagsHtml = tagsHtml + 
                "<div class=\x22btn btn-light\x22>" +   
                    "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                    "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                "</div>";
            }
            $("#tagDisplay").html(tagsHtml);
        };
        if (response.data.orientation != undefined && response.data.orientation.toLowerCase() === 'equirectangular') {
            // console.log(orientation.toLowerCase());
            $('#createCubemapButton').show();
        } 
        $(function() { 
            $(document).on('click', '#createCubemapButton', function (e) {
                e.preventDefault(); 
                // let sourceImage = document.getElementById('sky').getAttribute("src");
                // this.el.addEventListener('loaded', () => {
                  console.log("tryna convert envmap " + response.data.URLoriginal);
                  loadImage(response.data.URLoriginal, 'Anonymous')
                  .then(function(i) {
                    var cs = equirectToCubemapFaces(i, 1024);
                    let mapNumber = 0;
                    cs.forEach(function(c) {
                        mapNumber++;
                        // let image = new Image();
                        // c.width = 512;
                        // c.height = 512;
                        let image = dataURItoBlob(c.toDataURL("image/jpeg")); //convert canvas to base64, then to blob.. sigh...

                        // const buffer = Buffer.from(c.toDataURL("image/png").replace(/^data:image\/\w+;base64,/, ""),'base64');
                        // image.src = buffer;
                        // image = c.toBlob(function(blob){}, 'image/jpg', 0.95); 
                        // cubemap = cubemap + "<img id=\x22refl\x22 src=\x22"+c+"\x22>";
                        // document.body.appendChild(image);
                        // image = blob;
                        // console.log(image.src);
                        let data = {};
                        data.mapNumber = mapNumber;
                        axios.post('/cubemap_puturl/' + userid + "/" + response.data._id, data)
                        .then(function (response) { //response has signed URL to put to s3
                            console.log(response);
                            const xhr = new XMLHttpRequest();
                            xhr.open('PUT', response.data.url);
                            xhr.setRequestHeader("Content-Type", "image/jpeg");
                            // xhr.setRequestHeader("Content-Encoding", "base64");
                            xhr.setRequestHeader("Access-Control-Allow-Origin","*");
                            xhr.onreadystatechange = () => {
                            if(xhr.readyState === 4){
                                if(xhr.status === 200){
                                console.log('File Ready to n upload. xhr.status: ' + xhr.status + 'xhrstatustext:' +xhr.statusText);
                                } else {
                                console.log('Could not upload file.');
                                }
                            }
                        };
                        xhr.send(image);
                        })
                        .then(function (){
                            console.log("finished!");
                        })
                        .catch(function (err) {
                          console.log(err);
                        });
                    });  
                  })
                  .then(function (){
                      console.log("done");
                      
                  });
            });
            $(document).on('click','#addTagButton',function(e){
                e.preventDefault();  
                let newTag = document.getElementById("addTagInput").value;
                console.log("tryna add tag " + newTag);
                if (newTag.length > 2) {
                let html = "";
                tags.push(newTag);
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
                }
            }); 
            $(document).on('click','.remTagButton',function(e){
                e.preventDefault();  
                console.log("tryna remove tag " + this.id);
                let html = "";
                for( var i = 0; i < tags.length; i++){ 
                    if ( tags[i] === this.id) {
                        tags.splice(i, 1); 
                    }
                    }
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
            });
            $('#updatePictureForm').on('submit', function(e) { //use submit action for form validation to work
                e.preventDefault();  
                let title = document.getElementById("picTitle").value;
                let orientation = document.getElementById("orientation").value;
                // let hasAlpha = document.getElementById("hasAlpha").value;
                let hasAlpha = $("#hasAlpha").prop("checked");
                let captionUpper = document.getElementById("captionUpper").value;
                let captionLower = document.getElementById("captionLower").value;
                let linkType = document.getElementById("linkType").value;
                let linkURL = document.getElementById("linkURL").value;
                let status = $("#isPublic").prop("checked");
                console.log("isPublic " + status);
                let item_status = (status == true) ? "private" : "public";
                let hasAlphaChannel = (hasAlpha == true) ? true : false;
                console.log("tryna submit");
                let data = {
                    _id: response.data._id,
                    title: title,
                    tags: tags,
                    orientation: orientation,
                    // item_status: item_status,
                    hasAlphaChannel: hasAlphaChannel,
                    isPublic : status,
                    captionUpper: captionUpper,
                    captionLower: captionLower,
                    linkType: linkType,
                    linkURL: linkURL
                }
                axios.post('/update_pic/' + item_id, data)
                    .then(function (response) {
                        console.log(response);
                        if (response.data.includes("updated")) {
                            $("#topSuccess").html(response.data);
                            $("#topSuccess").show();
                            
                        } else {
                            $("#topAlert").html(response);
                            $("#topAlert").show();
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                });
            });
        })
        .catch(function (error) {
        console.log(error);
        });
    } 
    function newPicture() {
        $("#cards").show();
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Upload New Picture</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<form id=\x22uploadPictureForm\x22>" +
                    "<div class=\x22form-row\x22>" +
 
                        "<div class=\x22input-group mb-3\x22>" +
                        "<div class=\x22input-group-prepend\x22>" +
                            "<button class=\x22input-group-text\x22 type=\x22\submit\x22 id=\x22\x22 >Upload</button>" +
                        "</div>" +
                        "<div class=\x22custom-file\x22>" +
                            "<input type=\x22file\x22 class=\x22custom-file-input\x22 id=\x22fileInput\x22>" +
                            "<label class=\x22custom-file-label\x22 for=\x22fileInput\x22>Choose file</label>" +
                        "</div>" +
                        "</div>" +
                    "</div>" +
                        // "</div>" +
                    "<div class=\x22form-row\x22>" +
                    "<img src=\x22\x22 width=\x22200\x22 style=\x22display:none;\x22 id=\x22imgTmp\x22 >" +
                        // "<id=\x22imgTmp\x22 img src=\x22\x22 width=\x22200\x22 style=\x22display:none;\x22 />" +
                    "</div>" +
                "</div>" +
                "</form>" +
            "</div>";
        $("#cardrow").html(card);
        $(function() { //shorthand document.ready function
            $('#fileInput').change( function(event) {
                event.preventDefault();
                console.log("tmpPath " + event.target.files[0].name);
                $("#imgTmp").fadeIn("fast").attr('src', URL.createObjectURL(event.target.files[0]));
                let rawname = event.target.files[0].name;
                let filename = rawname.replace(/.*(\/|\\)/, '');
                $(".custom-file-label").html(filename);
            });    
            $('#uploadPictureForm').on('submit', function(e) { 
                e.preventDefault();  
                console.log("tryna submit");
                var file = $('#fileInput').get()[0].files[0];
                var fname = $('input[type=file]').val().replace(/.*(\/|\\)/, '');
                fname = encodeURI(file.name);
                console.log("fname " + fname); 
                $.ajax({
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },		
                url: '/puturl',
                    type: 'POST',
                    data: {filename: fname, size: file.size, contentType:file.type},
                    success: (function(res){
                        console.log(res);
                        $('#uploadedlink').html( "uploading file...");
                        var x = $.ajax({
                            headers: {
                                "Access-Control-Allow-Origin": "*"
                            },
                            beforeSend: function(xhrObj){
                                xhrObj.setRequestHeader("Content-Type", file.type);
                                xhrObj.setRequestHeader("Access-Control-Allow-Origin","*");
                            },
                            origin: window.location.hostname,
                            url: res,
                            type: 'PUT',
                            data: file,
                            processData: false,
                            contentType: file.type,
                            crossDomain: true,
            
                            success: (function(res) {
                                console.log('Done');
                                // var vidurl = "http://3dcasefiles.com/braincheck/" + fname;
                                // $('#uploadedlink').html( "<a href=" + vidurl + ">" + fname + "</a>");
                            })
                        })
                        console.log(x);
                    })
                });	
            });
        });
    }
    
    function getPictures() {
            let config = { headers: {
                appid: appid,
                }
            }
            axios.get('/userpics/' + userid, config)
            .then(function (response) {
                // console.log(JSON.stringify(response));
                // var jsonResponse = response.data;
                var selectHeader = "";
                var arr = response.data;
             
                if (mode == "select") {
                    selectFor = parent;
                    selectHeader = "<th>Select</th>";
                    $("#pageTitle").html("Select Picture for " + parent + " " + itemid);
                }
                var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                    "<thead>"+
                    "<tr>"+
                    selectHeader +
                        "<th></th>"+
                    "<th>Name</th>"+
                    "<th>Date</th>"+
                    "<th>HiddenDate</th>"+
                    "<th>Type</th>"+
                    "<th>Tags</th>"+
                    "<th>Status</th>"+
                "</tr>"+
                "</thead>"+
                "<tbody>";
                var tableBody = "";
                var selectButton = "";
                let hideIndex  = 3;
                
                for(var i = 0; i < arr.length; i++) {
                    let title = "";
                    if (arr[i].title != null && arr[i].title != undefined && arr[i].title.length > 0) {
                        title = arr[i].title;
                    } else {
                        title = arr[i].filename;
                    }
                    if (mode == "select") {
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','picture','" + itemid + "','" + arr[i]._id + "')\x22>Select Picture</button></td>";
                        hideIndex  = 4;
                    }  
                    if (mode == "postselect") {
                        selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','postcard','" + itemid + "','" + arr[i]._id + "')\x22>Select Postcard</button></td>";
                        hideIndex  = 4;
                    }  
                    let timestamp = arr[i].otimestamp;
                    if (arr[i].lastUpdateTimestamp != null) {
                        timestamp = arr[i].lastUpdateTimestamp;
                        // console.log("updated timeStamp " + timestamp);
                    }
                    let isPublic = false;
                    if (arr[i].isPublic != null) {
                        isPublic = arr[i].isPublic;
                    }
                    var detailsPicLink = "<a href=\x22#page-top\x22 onclick=\x22showPicture('" + arr[i]._id + "')\x22><img class=\x22rounded\x22 src=\x22" + arr[i].URLthumb + "\x22></a>"
                    var detailsLink = "<a href=\x22#page-top\x22 onclick=\x22showPicture('" + arr[i]._id + "')\x22>" + title + "</a>";
                    tableBody = tableBody +
                    "<tr>" +
                        selectButton +
                    "<td>" + detailsPicLink + "</td>" +
                    "<td>" + detailsLink + "</td>" +
                    "<td>" + convertTimestamp(timestamp) + "</td>" +
                    "<td>" + timestamp + "</td>" +
                    "<td>" + arr[i].orientation + "</td>" +
                    "<td>" + arr[i].tags + "</td>" +
                    "<td>" + isPublic + "</td>" +
                    "</tr>";
                    }
                    var tableFoot =  "</tbody>" +
                    "<tfoot>" +
                    "<tr>" +
                    selectHeader +
                    "<th></th>"+
                    "<th>Name</th>"+
                    "<th>Date</th>"+
                    "<th>HiddenDate</th>"+
                    "<th>Type</th>"+
                    "<th>Tags</th>"+
                    "<th>Status</th>"+
                    "</tr>" +
                "</tfoot>" +
                "</table>";
                var resultElement = document.getElementById('table1Data');
                resultElement.innerHTML = tableHead + tableBody + tableFoot;
                $('#dataTable1').DataTable(
                    {"order": [[ hideIndex, "desc" ]],
                    'columnDefs': [
                        { 'orderData':[hideIndex], 'targets': [1] },
                        {
                            'targets': [hideIndex],
                            'visible': false,
                            'searchable': false
                        },
                    ]}
                );
            })
            .catch(function (error) {
            console.log(error);
            });
            let newButton = "<a href=\x22index.html?type=bulkup\x22 class=\x22btn btn-info  float-right\x22 >Upload New Picture</button>";
            $("#newButton").html(newButton);
            $("#newButton").show();
    }
    function showModel(item_id) {
        let config = { headers: {
            appid: appid,
            }
        }
        axios.get('/get_model/' + item_id, config)
            .then(function (response) {
            $("#cards").show();
            tagsHtml = "";
            tags = [];
            preview = {};
            preview.name = response.data.filename;
            preview.url = response.data.url;
            // console.log(response);
            var card = "<div class=\x22col-lg-12\x22>" +
                "<div class=\x22card shadow mb-4\x22>" +
                    "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                    "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Model Details</h6>" +
                    "</div>" +
                    "<div class=\x22card-body\x22>" +
                    "<form id=\x22updateModelForm\x22>" +
                        "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                        "<div class=\x22form-row\x22>" +
                 
                            "<div class=\x22col form-group col-md-4\x22>" + 
                                "<label for=\x22modelName\x22>Title</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22modelName\x22 value=\x22" + response.data.name + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-4\x22>" + 
                                "<label for=\x22sceneTitle\x22>By User</label>" + 
                                "<p>" + response.data.username + "</p>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-4\x22>" + 
                                "<label for=\x22sceneTitle\x22>Filename</label>" + 
                                "<p>" + response.data.filename + "</p>" +
                            "</div>" +
                        "</div>" +  
                         
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-6\x22>" +
                                    "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                                    "<div class=\x22input-group\x22>" +
                                    "<div class=\x22input-group-prepend\x22>" +
                                    "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                                "</div>" +
                                    "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                                "</div>" +
                                "<div class=\x22form-row\x22 id=\x22tagDisplay\x22>" +
                                    // tagsHtml +
                                "</div>" +    
                            "</div>" + 
                            "<div class=\x22col form-group col-md-1\x22>" +
                              //spacer
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22Public\x22>Share with Public</label><br>" + //public
                                "<input type=\x22checkbox\x22  id=\x22isPublic\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" + 

  
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22sourceTitle\x22>Source Title</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sourceTitle\x22 value=\x22" + response.data.sourceTitle + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22sourceLink\x22>Source Link</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sourceLink\x22 value=\x22" + response.data.sourceLink + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22authorName\x22>Author </label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22authorName\x22 value=\x22" + response.data.authorName + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22authorLink\x22>Author Link</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22authorLink\x22 value=\x22" + response.data.authorLink + "\x22 >" +
                            "</div>" +
                            // "<div class=\x22col form-group col-md-2\x22>" + 
                            //     "<label for=\x22license\x22>License</label>" + 
                            //     "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22modelName\x22 value=\x22" + response.data.license + "\x22 >" +
                            // "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<label for=\x22license\x22>License</label>" +
                                "<select class=\x22form-control\x22 id=\x22license\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>Unknown</option>" +
                                "<option>By Owner</option>" +
                                "<option>CC Attribution</option>" +
                                "<option>CC Attribution-ShareAlike</option>" +
                                "<option>CC Attribution-NoDerivs</option>" +
                                "<option>Attribution-NonCommercial</option>" +
                                "<option>Attribution-NonCommercial-ShareAlike</option>" +
                                "<option>Attribution-NonCommercial-NoDerivs</option>" +
                                "<option>GPL</option>" +
                                "<option>MIT</option>" +
                                "<option>Public Domain</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22modifications\x22>Modifications</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22modifications\x22 value=\x22" + response.data.modifications + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-12\x22>" + 
                                "<button class=\x22float-right btn btn-md btn-success previewModel\x22>Preview Model</button>" +
                            "</div>" +     
                        "</div>" +  
                        // "<div class=\x22form-row\x22>" +
                        // html +
                    "</form>" +
                    "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('model','" + item_id + "')\x22>Delete Model</button>" +
                    "</div>" +
                    "</div>" +
                        "<h5 class=\x22mt-0\x22>Model Data:</h5><br><br>" +
                        keyValues(response.data) +
                        
                        "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
                "</div>";
                $("#cardrow").html(card);
                $('#license').find('option').each(function(i,e){
                    console.log($(e).val());
                    if($(e).val() === response.data.license){
                        $('#license').prop('selectedIndex',i);
                    }
                });
                // $("#hasAlpha").bootstrapToggle();
                // if (response.data.hasAlphaChannel == true) {
                //     $('#hasAlpha').bootstrapToggle('on');
                // } 
                $("#isPublic").bootstrapToggle();
                if (response.data.isPublic == true) {
                    $('#isPublic').bootstrapToggle('on');
                } 
                if (response.data.tags != null && response.data.tags.length > 0) {
                    tags = response.data.tags;
                    for (let i = 0; i < tags.length; i++) {
                        tagsHtml = tagsHtml + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").html(tagsHtml);
                };
                $(function() { //shorthand document.ready function
                    $(document).on('click','#addTagButton',function(e){
                        e.preventDefault();  
                        let newTag = document.getElementById("addTagInput").value;
                        console.log("tryna add tag " + newTag);
                        if (newTag.length > 2) {
                        let html = "";
                        tags.push(newTag);
                        for (let i = 0; i < tags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                        }
                    }); 
                    $(document).on('click','.remTagButton',function(e){
                        e.preventDefault();  
                        console.log("tryna remove tag " + this.id);
                        let html = "";
                        for( var i = 0; i < tags.length; i++){ 
                            if ( tags[i] === this.id) {
                                tags.splice(i, 1); 
                            }
                            }
                        for (let i = 0; i < tags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                    });
                    $(document).on('click','.previewModel', function(e) {
                        e.preventDefault();  
                        console.log("gotsa click on preview buttooon" + JSON.stringify(preview));
                        previewGLTF(preview);
                    }); 
                    $('#updateModelForm').on('submit', function(e) { //use submit action for form validation to work
                        e.preventDefault();  
                        let name = document.getElementById("modelName").value;
                        let sourceTitle = document.getElementById("sourceTitle").value;
                        let sourceLink = document.getElementById("sourceLink").value;
                        let authorName = document.getElementById("authorName").value;
                        let authorLink = document.getElementById("authorLink").value;
                        let license = document.getElementById("license").value;
                        let modifications = document.getElementById("modifications").value;
                        let status = $("#isPublic").prop("checked");
                        console.log("isPublic " + status);
                        // let item_status = (status == true) ? "private" : "public";
                        // let hasAlphaChannel = (hasAlpha == true) ? true : false;
                        console.log("tryna submit");
                        let data = {
                            _id: response.data._id,
                            name: name,
                            tags: tags,
                            sourceTitle: sourceTitle,
                            sourceLink: sourceLink,
                            authorName: authorName,
                            authorLink: authorLink,
                            license: license,
                            modifications: modifications,
                            isPublic : status
                        }
                        axios.post('/update_model/' + item_id, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("updated")) {
                                    $("#topSuccess").html(response.data);
                                    $("#topSuccess").show();
                                    
                                } else {
                                    $("#topAlert").html(response);
                                    $("#topAlert").show();
                                }
                            })
                            .catch(function (error) {
                                console.log(error);
                            });
                        });
                    });
            })
            .catch(function (error) {
            console.log(error);
            });
    }
    function getModels() {
        let config = { headers: {
            appid: appid,
            }
        }
        axios.get('/get_models/' + userid, config)
        .then(function (response) {
            // console.log(JSON.stringify(response));
            // var jsonResponse = response.data;
            var selectHeader = "";
            var arr = response.data;
            let hideIndex = 2;
            if (mode == "select") {
                selectFor = parent;
                selectHeader = "<th>Select</th>";
                $("#pageTitle").html("Select Model for " + parent + " " + itemid);
                hideIndex = 3;
            }
            var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                selectHeader +
                    // "<th></th>"+
                "<th>Model Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Type</th>"+
                "<th>Filesize</th>"+
                "<th>Tags</th>"+
                "<th>Owner</th>"+
            "</tr>"+
            "</thead>"+
            "<tbody>";
            var tableBody = "";
            var selectButton = "";
            for(var i = 0; i < arr.length; i++) {
                // console.log(arr[i]);
                let filesize = arr[i].ofilesize;
                // filesize = filesize.toFixed(2);
                let name = "";
                if (arr[i].name != null && arr[i].name != undefined && arr[i].name.length > 0) {
                    name = arr[i].name;
                } else {
                    name = arr[i].filename;
                }
                if (mode == "select") {
                    selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','model','" + itemid + "','" + arr[i]._id + "')\x22>Select Model</button></td>";
                }  
                let timestamp = arr[i].otimestamp;
                if (arr[i].lastUpdateTimestamp != null) {
                    timestamp = arr[i].lastUpdateTimestamp;
                    console.log("updated timeStamp " + timestamp);
                }
                let isPublic = false;
                if (arr[i].isPublic != null) {
                    isPublic = arr[i].isPublic;
                }
                // var detailsPicLink = "<a href=\x22#page-top\x22 onclick=\x22showPicture('" + arr[i]._id + "')\x22><img class=\x22rounded\x22 src=\x22" + arr[i].URLthumb + "\x22></a>";
                // var previewButton ="<button class=\x22btn btn-md btn-success\x22 onclick=previewGLTF("+JSON.stringify(arr[i])+")>Preview GLTF</button>";
                var detailsLink = "<a href=\x22index.html?type=model&iid=" + arr[i]._id + "\x22>" + name + "</a>";
                tableBody = tableBody +
                "<tr>" +
                    selectButton +
                // "<td>" + previewButton + "</td>" +
                "<td>" + detailsLink + "</td>" +
                "<td>" + convertTimestamp(timestamp) + "</td>" +
                "<td>" + timestamp + "</td>" +
                "<td>" + arr[i].item_type + "</td>" +
                "<td>" + round2(filesize/1000000) + " mb</td>" +
                "<td>" + arr[i].tags + "</td>" +
                "<td>" + arr[i].username + "</td>" +
                "</tr>";
                }
                var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                selectHeader +
                // "<th></th>"+
                "<th>Model Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Model Type</th>"+
                "<th>Filesize</th>"+
                "<th>Tags</th>"+
                "<th>Owner</th>"+
                "</tr>" +
            "</tfoot>" +
            "</table>";
            var resultElement = document.getElementById('table1Data');
            resultElement.innerHTML = tableHead + tableBody + tableFoot;
            $('#dataTable1').DataTable(
                {"order": [[ hideIndex, "desc" ]],
                'columnDefs': [
                    { 'orderData':[hideIndex], 'targets': [2] },
                    {
                        'targets': [hideIndex],
                        'visible': false,
                        'searchable': false
                    },
                ]}
            );
        })
        .catch(function (error) {
        console.log(error);
        });
        let newButton = "<a href=\x22index.html?type=bulkup\x22 class=\x22btn btn-info  float-right\x22 >Upload New Model</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
}

    function showVideo(item_id) {
        let config = { headers: {
        appid: appid,
        }
        }
        axios.get('/uservid/' + item_id, config)
        .then(function (response) {
        $("#cards").show();
        tagsHtml = "";
        tags = [];
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Video Details</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                    // "<div class=\x22media\x22>" +
                   
                    // // "<img class=\x22rounded img-fluid mr-3\x22 src=\x22" + response.data.URLvid+ "\x22>" +
                    // "<div class=\x22media-body\x22>" +

                "<form id=\x22updateVideoForm\x22>" +
                    "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                    "<div class=\x22form-row\x22>" +
             
                        "<div class=\x22col form-group col-md-4\x22>" + 
                            "<label for=\x22vidTitle\x22>Title</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22vidTitle\x22 value=\x22" + response.data.title + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-4\x22>" + 
                            "<label for=\x22sceneTitle\x22>By User</label>" + 
                            "<p>" + response.data.username + "</p>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-4\x22>" + 
                            "<label for=\x22sceneTitle\x22>Filename</label>" + 
                            "<p>" + response.data.filename + "</p>" +
                        "</div>" +
                    "</div>" +     
                    "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22storeItemStatus\x22>Orientation</label>" +
                            "<select class=\x22form-control\x22 id=\x22orientation\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>Landscape</option>" +
                            "<option>Portrait</option>" +
                            "<option>Square</option>" +
                            "<option>Equirectangular</option>" +
                            "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22siName\x22>Upper Caption</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22captionUpper\x22 placeholder=\x22Enter Upper Caption\x22 value=\x22" + response.data.captionUpper + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22siName\x22>Lower Caption</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22captionLower\x22 placeholder=\x22Enter Lower Caption\x22 value=\x22" + response.data.captionLower + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-4\x22>" +
                            "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                            "<div class=\x22input-group\x22>" +
                            "<div class=\x22input-group-prepend\x22>" +
                            "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                        "</div>" +
                            "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                        "</div>" +
                        "<div class=\x22form-row\x22 id=\x22tagDisplay\x22>" +
                            // tagsHtml +
                        "</div>" +    
                        "</div>" + 
                        "<div class=\x22col form-group col-md-1\x22>" +
                          //spacer
                        "</div>" +
                        "<div class=\x22col form-group col-md-2\x22>" +
                            "<div class=\x22\x22><label for=\x22hasAlpha\x22>Has Alpha</label><br>" + //alpha
                            "<input type=\x22checkbox\x22  id=\x22hasAlpha\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                        "</div>" + 
                        "<div class=\x22col form-group col-md-2\x22>" +
                            "<div class=\x22\x22><label for=\x22Public\x22>Share with Public</label><br>" + //public
                            "<input type=\x22checkbox\x22  id=\x22isPublic\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                        "</div>" + 
                        "<div class=\x22col form-group col-md-8\x22>" + 
                            "<div class=\x22embed-responsive embed-responsive-16by9\x22><video class=\x22embed-responsive-item\x22 controls>" +
                                "<source src=" + response.data.URLvid + " type='video/mp4'>" +
                                "<source src=" + response.data.URLvid + " type='video/mkv'>" +
                                "Your browser does not support the video tag." +
                            "</video></div>" +
                        "</div>" +       
                    "</div>" +
                    // "<div class=\x22form-row\x22>" +
                    // html +
                "</form>" +
                "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('video','" + item_id + "')\x22>Delete Video</button>" +
                "</div>" +
                "</div>" +
                    "<h5 class=\x22mt-0\x22>Picture Details</h5><br><br>" +
                    keyValues(response.data) +
                    
                    "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            "</div>";
            $("#cardrow").html(card);
            $('#orientation').find('option').each(function(i,e){
                console.log($(e).val());
                if($(e).val() === response.data.orientation){
                    $('#orientation').prop('selectedIndex',i);
                }
            });
            $("#hasAlpha").bootstrapToggle();
            if (response.data.hasAlphaChannel == true) {
                $('#hasAlpha').bootstrapToggle('on');
            } 
            $("#isPublic").bootstrapToggle();
            if (response.data.isPublic == true) {
                $('#isPublic').bootstrapToggle('on');
            } 
            if (response.data.tags != null && response.data.tags.length > 0) {
                tags = response.data.tags;
                for (let i = 0; i < tags.length; i++) {
                    tagsHtml = tagsHtml + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").html(tagsHtml);
            };
            $(function() { //shorthand document.ready function
                $(document).on('click','#addTagButton',function(e){
                    e.preventDefault();  
                    let newTag = document.getElementById("addTagInput").value;
                    console.log("tryna add tag " + newTag);
                    if (newTag.length > 2) {
                    let html = "";
                    tags.push(newTag);
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                    }
                }); 
                $(document).on('click','.remTagButton',function(e){
                    e.preventDefault();  
                    console.log("tryna remove tag " + this.id);
                    let html = "";
                    for( var i = 0; i < tags.length; i++){ 
                        if ( tags[i] === this.id) {
                            tags.splice(i, 1); 
                        }
                        }
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                });
                $('#updateVideoForm').on('submit', function(e) { //use submit action for form validation to work
                    e.preventDefault();  
                    let title = document.getElementById("vidTitle").value;
                    let orientation = document.getElementById("orientation").value;
                    // let hasAlpha = document.getElementById("hasAlpha").value;
                    let hasAlpha = $("#hasAlpha").prop("checked");
                    let captionUpper = document.getElementById("captionUpper").value;
                    let captionLower = document.getElementById("captionLower").value;
                    let status = $("#isPublic").prop("checked");
                    console.log("isPublic " + status);
                    let item_status = (status == true) ? "private" : "public";
                    let hasAlphaChannel = (hasAlpha == true) ? true : false;
                    console.log("tryna submit");
                    let data = {
                        _id: response.data._id,
                        title: title,
                        tags: tags,
                        orientation: orientation,
                        // item_status: item_status,
                        hasAlphaChannel: hasAlphaChannel,
                        isPublic : status,
                        captionUpper: captionUpper,
                        captionLower: captionLower
                    }
                    axios.post('/update_video/' + item_id, data)
                        .then(function (response) {
                            console.log(response);
                            if (response.data.includes("updated")) {
                                $("#topSuccess").html(response.data);
                                $("#topSuccess").show();
                                
                            } else {
                                $("#topAlert").html(response);
                                $("#topAlert").show();
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                    });
                });
        })
        .catch(function (error) {
        console.log(error);
        });
    }

    function getVideos() {
        let config = { headers: {
            appid: appid,
            }
        }
        axios.get('/uservids/' + userid, config)
        .then(function (response) {
            console.log(JSON.stringify(response));
            // var jsonResponse = response.data;
            var selectHeader = "";
            var arr = response.data;
            if (mode == "select") {
                selectFor = parent;
                selectHeader = "<th>Select</th>";
                $("#pageTitle").html("Select Video for " + parent + " " + itemid);
            }
            var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                selectHeader +
                "<th></th>"+
                "<th>Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Tags</th>"+
                "<th>Shareable</th>"+
            "</tr>"+
            "</thead>"+
            "<tbody>";
            var tableBody = "";
            var selectButton = "";
            for(var i = 0; i < arr.length; i++) {
                let vname = ""; 
                if (arr[i].title != undefined && arr[i].title != null && arr[i].title.length > 0) {
                    vname = arr[i].title;
                } else {
                    vname = arr[i].filename;
                }
                if (mode == "select") {
                    selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','video','" + itemid + "','" + arr[i]._id + "')\x22>Select Video</button></td>"
                }  
                let timestamp = arr[i].otimestamp;
                if (arr[i].lastUpdateTimestamp != null) {
                    timestamp = arr[i].lastUpdateTimestamp;
                    console.log("updated timeStamp " + timestamp);
                }
                let isPublic = false;
                if (arr[i].isPublic != null) {
                    isPublic = arr[i].isPublic;
                }
                let detailsPicLink = "<video width='320' height='240' controls>" +
                "<source src=" + arr[i].URLvid + " type='video/mp4'>" +
                "<source src=" + arr[i].URLvid + " type='video/mkv'>" +
                "Your browser does not support the video tag." +
                "</video>";
                // var detailsPicLink = "<a href=\x22#page-top\x22 onclick=\x22showVideo('" + arr[i]._id + "')\x22><img class=\x22rounded\x22 src=\x22" + arr[i].URLthumb + "\x22></a>"
                var detailsLink = "<a href=\x22#page-top\x22 onclick=\x22showVideo('" + arr[i]._id + "')\x22>" + vname + "</a>";
                tableBody = tableBody +
                "<tr>" +
                    selectButton +
                "<td>" + detailsPicLink + "</td>" +
                "<td>" + detailsLink + "</td>" +
                "<td>" + convertTimestamp(timestamp) + "</td>" +
                "<td>" + timestamp + "</td>" +
                "<td>" + arr[i].tags + "</td>" +
                "<td>" + isPublic + "</td>" +
                "</tr>";
                }
                var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                selectHeader +
                "<th></th>"+
                "<th>Name</th>"+
                "<th>Date</th>"+
                "<th>HiddenDate</th>"+
                "<th>Tags</th>"+
                "<th>Shareable</th>"+
                "</tr>" +
            "</tfoot>" +
            "</table>";
            var resultElement = document.getElementById('table1Data');
            resultElement.innerHTML = tableHead + tableBody + tableFoot;
            $('#dataTable1').DataTable(
                {"order": [[ 3, "desc" ]],
                'columnDefs': [
                    { 'orderData':[3], 'targets': [1] },
                    {
                        'targets': [3],
                        'visible': false,
                        'searchable': false
                    },
                ]}
            );
        })
        .catch(function (error) {
        console.log(error);
        });
        let newButton = "<a href=\x22index.html?type=bulkup\x22 class=\x22btn btn-info  float-right\x22 >Upload New Video</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
    }
    function getStoreItem(item_id) {
        let config = { headers: {
            appid: appid,
            }
        }
        let data = {};
        if (item_id != 'new') {
            axios.get('/get_storeitem/' + item_id, config)
            .then(function (response) {
                // console.log(response);
                showStoreItem(response);
            }) //end of main fetch
            .catch(function (error) {
            console.log(error);
            });
        } else {
            let response = {};
            let data = {};
            showStoreItem(response.data); //send empty to make a new one
        }
    }
    function getOptions(type) { //populate dropdowns and lists //nah, just doit in .then in same function (scope?)
        let optionsArray = [];
        let options = "";
        switch (type) {
            case "storeItemTypes":
            $.get('ref/storeitemtypes.txt', function(data) {
                optionsArray = data.split("\n");
                for (let i = 0; i < optionsArray.length; i++) {
                    $("#storeItemTypeSelect").append("<options>" + optionsArray[i] + "</options>");
                }
                console.log(options);           
                // $("#storeItemTypeSelect").html(options);
            });
            break;
            case "storeItemAttributes":
            $.get('ref/storeitemattributes.txt', function(data) {
                optionsArray = data.split("\n");
                for (let i = 0; i < optionsArray.length; i++) {
                    $("#storeItemAttributesSelect").append("<options>" + optionsArray[i] + "</options>");
                }
                console.log(options);           
                $("#storeItemAttributesSelect").html(options);
            }); 
            break;
        }
    }
    function ReturnCSV (arr) { //TODO flex for other tables (store items only atm)
    let csv = "";
    for (let i = 0; i < arr.length; i++) {
        csv = csv + 
        arr[i]._id + "," +
        arr[i].itemName + "," +
        arr[i].itemDisplayName + "," +
        arr[i].itemAltName + "," +
        arr[i].itemType + "," +
        arr[i].itemSubType + "," +
        arr[i].itemPrice + "," +
        arr[i].useGameCurrency + "," +
        arr[i].jsonAttributes.color + "," +
        arr[i].jsonAttributes.newMeshName + "," +
        arr[i].jsonAttributes.materialName + "," +
        arr[i].jsonAttributes.newTextureName + "," +
        arr[i].jsonAttributes.meshInProject + "," +
        arr[i].jsonAttributes.inGame + "," +
        arr[i].jsonAttributes.uiClass + "," +
        arr[i].jsonAttributes.overrides + "," +
        arr[i].jsonAttributes.inStore + "," +
        arr[i].jsonAttributes.rarity + "\n";
    }
    let header ="dbID,Name,DisplayName,Archetype,Type,Subtype,Price,UseGameCurrency,Color,newMeshName,materialName,newTextureName,meshInProject,inGame,uiClass,overrides,inStore,rarity\n";
    return header + csv
    }
    function showStoreItem(response) {
        // console.log("tryna show store item with response : " + response);
            let isEmpty = $.isEmptyObject(response); //reuse the form to create new vs update existing record
            console.log("isEmpty " + isEmpty);
            $("#cards").show();
            let itemPics = "<div class=\x22row\x22>";
            if (!isEmpty && response.data.storeItemPictures != null && response.data.storeItemPictures != undefined && response.data.storeItemPictures.length > 0 ) {
            for (let i = 0; i < response.data.storeItemPictures.length; i++) {
                itemPics = itemPics +
                "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                    "<img class=\x22card-img-top\x22 src=\x22" + response.data.storeItemPictures[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                    "<div class=\x22card-img-overlay\x22>" +
                    "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-right\x22 onclick=\x22removeItem('storeitem','picture','" + response.data._id + "','" + response.data.storeItemPictures[i]._id + "')\x22>Remove</button>" +
                    "</div>" +
                "</div>";
            }
            itemPics = itemPics +  "</div>";
            }
            let itemName = !isEmpty ? response.data.itemName : "";  //ternarys are OK if not nested.  really. 
            let itemDisplayName = !isEmpty ? response.data.itemDisplayName : "";
            let itemAltName = !isEmpty ? response.data.itemAltName : "";
            let itemPrice = !isEmpty ? response.data.itemPrice : "";
            let itemDescription = !isEmpty ? response.data.itemDescription : "";
            let displayAssetURL = !isEmpty ? response.data.displayAssetURL : "";
            let maxPerUser = !isEmpty ? response.data.maxPerUser : "";
            let maxTotal = !isEmpty ? response.data.maxTotal : "";
            let totalSold = !isEmpty ? response.data.totalSold : 0;
            let extraButtons = "";
            let submitButtonName = !isEmpty ? "Update" : "Create";
            let submitButtonRoute = !isEmpty ? "/update_storeitem" : "/set_storeitem";
            let _id = isEmpty ? "none" : response.data._id;
            let keyVals = isEmpty ? "none" : keyValues(response.data.jsonAttributes);
            let subTypeOptions = [];
            // if response.data.itemType 

            // console.log("csv: " + response);
            if (!isEmpty) {
                
                extraButtons = "<a href=\x22#\x22 id=\x22deleteButton\x22 class=\x22btn btn-danger btn-sm float-left\x22 onclick=\x22deleteItem('storeitem','" + response.data._id + "')\x22>Delete Store Item</a>" +
                "<a class=\x22btn btn-primary btn-sm float-right\x22 href=\x22index.html?appid=" + appid + "&type=pictures&mode=select&parent=storeitem&iid=" + response.data._id + "\x22>Add Store Pic</a>";
            } else {

            }
            var card = "<div class=\x22col-md-12\x22>" +
                "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                    "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Store Item Details - "+ itemName +" | _id:  "+ _id +"</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<form id=\x22updateStoreItemForm\x22>" +
                    "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>"+submitButtonName+"</button></div>" + //new vs existing
                    "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22siName\x22>Store Item Name</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22siName\x22 placeholder=\x22Enter Store Item Name\x22 value=\x22" + itemName + "\x22 required>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22siName\x22>Display Name</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22siDisplayName\x22 placeholder=\x22Enter Display Name\x22 value=\x22" + itemDisplayName + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22siName\x22>Alt Name</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22siAltName\x22 placeholder=\x22Enter Alt Name\x22 value=\x22" + itemAltName + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group  col-md-2\x22>" +
                        "<label for=\x22siMaxTotal\x22>Total Sold</label>" +
                        "<p class=\x22\x22>" + totalSold + "</p>" +
                    "</div>" +
                    "</div>" +
                    "<div class=\x22form-row\x22>" +  

                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemStatus\x22>Select Item Status</label>" +
                        "<select class=\x22form-control\x22 id=\x22storeItemStatus\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Available</option>" +
                        "<option>Unavailable</option>" +
                        "<option>Testing</option>" +
                        "<option>Restricted</option>" +
                        "</select>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<label for=\x22siPrice\x22>Store Item Price</label>" +
                        "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22priceHelp\x22 id=\x22siPrice\x22 placeholder=\x22Enter Store Item Price\x22 value=\x22" + itemPrice + "\x22 required>" +
                        "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>use whole number of pennies, e.g. $10.00 = 1000</small>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<div class=\x22\x22><label for=\x22useGameCurrency\x22>Use Game Currency?</label><br>" + //use game currency toggle
                        "<input type=\x22checkbox\x22  id=\x22useGameCurrency\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-2\x22>" +
                        "<label for=\x22siMaxPerUser\x22>Max Per User</label>" +
                        "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22priceHelp\x22 id=\x22siMaxPerUser\x22 placeholder=\x22Enter Max Per User\x22 value=\x22" + maxPerUser + "\x22 required>" +
                    "</div>" +
                    "<div class=\x22col form-group  col-md-2\x22>" +
                        "<label for=\x22siMaxTotal\x22>Max Total</label>" +
                        "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22priceHelp\x22 id=\x22siMaxTotal\x22 placeholder=\x22Enter Max Total\x22 value=\x22" + maxTotal + "\x22 required>" +
                    "</div>" +

                    "</div>" +
                    "<div class=\x22form-row\x22>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemTypeSelect\x22>Item Type</label>" +
                        "<select class=\x22form-control\x22 id=\x22storeItemTypeSelect\x22 required>" +
                        "</select>" + //populated via types below
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemSubTypeSelect\x22>Item SubType</label>" +
                        "<select class=\x22form-control\x22 id=\x22storeItemSubTypeSelect\x22 required>" +
                        "</select>" + //populated below
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemAttributesSelect1\x22>Select Item Attributes</label>" +
                        "<select class=\x22form-control\x22 id=\x22storeItemAttributesSelect1\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Fire</option>" +
                        "<option>Water</option>" +
                        "<option>Earth</option>" +
                        "<option>Air</option>" +
                        "<option>Magic</option>" +
                        "<option>Stinky</option>" +
                        "<option>Hot</option>" +
                        "<option>Cold</option>" +
                        "<option>Dry</option>" +
                        "<option>Wet</option>" +
                        "<option>Fast</option>" +
                        "<option>Slow</option>" +
                        "<option>Sneaky</option>" +
                        "<option>Annoying</option>" +
                        "<option>Double</option>" +
                        "</select>" +
                    "</div>" +
                    "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22storeItemAttributesSelect2\x22>Select Item Attributes</label>" +
                        "<select class=\x22form-control\x22 id=\x22storeItemAttributesSelect2\x22 >" +
                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                        "<option>Fire</option>" +
                        "<option>Water</option>" +
                        "<option>Earth</option>" +
                        "<option>Air</option>" +
                        "<option>Magic</option>" +
                        "<option>Stinky</option>" +
                        "<option>Hot</option>" +
                        "<option>Cold</option>" +
                        "<option>Dry</option>" +
                        "<option>Wet</option>" +
                        "<option>Fast</option>" +
                        "<option>Slow</option>" +
                        "<option>Sneaky</option>" +
                        "<option>Annoying</option>" +
                        "<option>Double</option>" +
                        "</select>" +
                    "</div>" +
                    "</div>" +
                    "<div class=\x22form-row\x22>" +
                    "<div class=\x22form-group  col-md-6\x22>" +
                        "<label for=\x22siDesc\x22>Store Item Description</label>" +
                        "<input type=\x22textarea\x22 class=\x22form-control\x22 id=\x22siDesc\x22 placeholder=\x22Enter Store Item Description\x22 value=\x22" + itemDescription + "\x22  >" +
                    "</div>" +
                    "<div class=\x22form-group col-md-6\x22>" +
                        "<label for=\x22displayAssetURL\x22>Display Asset URL</label>" +
                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22displayAssetURL\x22 placeholder=\x22Enter URL for Display Asset (e.g. .glb link)\x22 value=\x22" + displayAssetURL + "\x22  >" +
                    "</div>" +
                    "</div>" +
                    extraButtons + 
                    "</form><br><br>" +
                    itemPics + 
                    "<pre>" + keyVals + "</pre>"
                "</div>" +                            
            "</div>" +
            "</div>";
            $("#cardrow").html(itemPics);
            $("#cardrow").html(card);
            $("#useGameCurrency").bootstrapToggle();
            if (!isEmpty) {
            if (response.data.useGameCurrency) {
                $('#useGameCurrency').bootstrapToggle('on');
            }
            }  
            let types = [];
            let typesArray = [];
            let emptyType = "";
            let currentSubTypeArray = [];
            $(function() { //get types/subtypes and populate dropdownz
            axios.get('/dashboard/test1/ref/types.json')
            .then(function (typesResponse) {
                types = typesResponse.data.types;
                for (let i = 0; i < types.length; i++) {
                let tstring = Object.keys(types[i])[0];
                let tarray = types[i][Object.keys(types[i])[0]]; //the value of the key / value pair is an array of strings
                typesArray.push(tstring); 
                // console.log("tstring " + tstring + " itemtype " + response.data.itemType);
                if (!isEmpty) {
                    if (tstring === response.data.itemType) {
                    console.log("tstring " + tstring + " itemtype " + response.data.itemType);
                    currentSubTypeArray = tarray;
                    console.log(tarray);
                    }
                    } 
                }
                if (isEmpty) {
                    currentSubTypeArray = types[0][Object.keys(types[0])[0]] //use 0th entry if empty
                }
            })
            .then(function () {
                for (let i = 0; i < typesArray.length; i++) {//populate dropdown options
                    var x = document.getElementById("storeItemTypeSelect");
                    var option = document.createElement("option");
                    option.text = typesArray[i];
                    x.add(option);
                }
                // console.log("subtypes " + JSON.stringify(currentSubTypeArray));
                for (let i = 0; i < currentSubTypeArray.length; i++) {//populate dropdown options
                    var x = document.getElementById("storeItemSubTypeSelect");
                    var option = document.createElement("option");
                    option.text = currentSubTypeArray[i];
                    x.add(option);
                }
            }).then(function () {
                // $("#storeItemSubTypeSelect").val(response.data.itemSubType);
                if (!isEmpty) { 
                $('#storeItemSubTypeSelect').find('option').each(function(i,e){
                    // console.log($(e).val() + " vs " + response.data.itemSubType);
                    if($(e).val() === response.data.itemSubType){
                        $('#storeItemSubTypeSelect').prop('selectedIndex',i); //select subtype to match record (!)
                    }
                }); 
                }
            })
            .catch(function (error) {
                console.log(error);
            });
            });
            $(function() { 
            let $itemTypeSelect = $( '#storeItemTypeSelect' );
            let $itemSubTypeSelect = $( '#storeItemSubTypeSelect' );
            $itemTypeSelect.on( 'change', function() { //when type dropdown is changed, update subtypes
                for (let i = 0; i < types.length; i++) {
                // console.log(Object.keys(response.data.types[i])[0]); //get the keys of each pair, which are type names, subtypes are values in array
                let tstring = Object.keys(types[i])[0];
                let tarray = types[i][Object.keys(types[i])[0]];
                typesArray.push(tstring); 
                console.log("tstring " + tstring + " itemtype " +  document.getElementById("storeItemTypeSelect").value);
                if (tstring === document.getElementById("storeItemTypeSelect").value) {
                    currentSubTypeArray = tarray;
                }
                } 
                var subTypeSelect = document.getElementById("storeItemSubTypeSelect");
                subTypeSelect.length = 0;
                for (let i = 0; i < currentSubTypeArray.length; i++) {//populate dropdown options
                console.log(currentSubTypeArray[i]);  
                    var option = document.createElement("option");
                    option.text = currentSubTypeArray[i];
                    subTypeSelect.add(option);
                }
                if (!isEmpty) {
                    $("#storeItemSubTypeSelect").val(response.data.itemSubType); 
                }
                });
            });
            if (!isEmpty) { //light up selections from response
            $('#storeItemTypeSelect').find('option').each(function(i,e){
                console.log($(e).val());
                if($(e).val() === response.data.itemType){
                    $('#storeItemTypeSelect').prop('selectedIndex',i);
                }
            });
            $('#storeItemSubTypeSelect').find('option').each(function(i,e){
                console.log($(e).val());
                if($(e).val() === response.data.itemSubType){
                    $('#storeItemSubTypeSelect').prop('selectedIndex',i);
                }
            }); 
            $("#storeItemStatus").val(response.data.itemStatus);
            if (response.data.itemAttributes != null && response.data.itemAttributes != undefined && response.data.itemAttributes.length > 0) {
                let siAttributesString =  response.data.itemAttributes.toString();
                var siAttributes = siAttributesString.split(",");
                let a1 = siAttributes[0];
                let a2 = siAttributes[1];
                $("#storeItemAttributesSelect1").val(a1);
                $("#storeItemAttributesSelect2").val(a2);
                // $("#storeItemSubTypeSelect").val(response.data.itemSubType); 
            }
            }
            $(function() { //shorthand document.ready function
                $('#updateStoreItemForm').on('submit', function(e) { //use submit action for form validation to work
                    e.preventDefault();  
                    let storeItemPictureIDs = !isEmpty ? response.data.storeItemPictureIDs : [];
                    let itemName = document.getElementById("siName").value;
                    let itemDisplayName = document.getElementById("siDisplayName").value;
                    let itemAltName = document.getElementById("siAltName").value;
                    let itemType = document.getElementById("storeItemTypeSelect").value;
                    let itemSubType = document.getElementById("storeItemSubTypeSelect").value;
                    let itemPrice = document.getElementById("siPrice").value;
                    let itemAttributes1 = document.getElementById("storeItemAttributesSelect1").value;
                    let itemAttributes2 = document.getElementById("storeItemAttributesSelect2").value;
                    let itemStatus = document.getElementById("storeItemStatus").value;
                    let itemDescription = document.getElementById("siDesc").value;
                    let maxPerUser = document.getElementById("siMaxPerUser").value;
                    let maxTotal = document.getElementById("siMaxTotal").value;
                    let useGameCurrency = $("#useGameCurrency").prop("checked");
                    let displayAssetURL = document.getElementById("displayAssetURL").value;
                    let itemAttributesArray = [];
                    itemAttributesArray.push(itemAttributes1, itemAttributes2);
                    console.log(itemName);
                    let data = {
                        appID : appid,
                        itemName : itemName,
                        itemDisplayName : itemDisplayName,
                        itemAltName : itemAltName,
                        itemStatus : itemStatus,
                        itemType: itemType,
                        itemSubType: itemSubType,
                        itemPrice : itemPrice,
                        useGameCurrency : useGameCurrency,
                        itemAttributes : itemAttributesArray,
                        itemAssetIDs : [],
                        itemDescription: itemDescription,
                        maxPerUser : maxPerUser,
                        maxTotal: maxTotal,
                        storeItemPictureIDs: storeItemPictureIDs
                    };
                    if (!isEmpty) {
                        data._id = response.data._id
                    }
                    let headers = { headers: {
                        appid: appid,
                        }
                    };
                    axios.post(submitButtonRoute, data, headers)
                    .then(function (response) {
                        console.log(response);
                        if (response.data.includes("updated")) {
                            // window.location.reload();
                            $("#topSuccess").html("Store Item Updated!");
                            $("#topSuccess").show();
                        } else if (response.data.includes("created")) {
                            window.location.reload();
                        } else {
                            $("#topAlert").html(response.data);
                            $("#topAlert").show();
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                });
            });            
    }
    function getStoreItems() {
    appid = getParameterByName("appid", window.location.href);
    $("#pageTitle").html("Store Items for " + appName(appid));
    let config = { headers: {
            appid: appid,
        }
    }
    var selectFor = "none";
    console.log("getting storeitems for " + appid);
    axios.get('/get_storeitems/' + appid, config)
    .then(function (response) {
        // console.log(JSON.stringify(response));
        var jsonResponse = response.data;
        // console.log(ReturnCSV(response.data.storeitems));
        var arr = jsonResponse.storeitems;
        var selectHeader = "<th>Select</th>";
        var selectButton = "<th>Select</th>";

        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th></th>"+
            "<th>Name</th>"+
            "<th>AltName</th>"+
            "<th>Type</th>"+
            "<th>SubType</th>"+
            "<th>Price</th>"+
            "<th>Status</th>"+
            "<th>Last Update</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        let storePic = "";
        let storeItemPics = [];
        let storeItem = {};
        for(var i = 0; i < arr.length; i++) {
            let ts = 0;
            if (arr[i].createdTimestamp != undefined && arr[i].createdTimestamp != null) {
                ts = arr[i].createdTimestamp;
            }
            if (arr[i].lastUpdateTimestamp != undefined && arr[i].lastUpdateTimestamp != null) {
                ts = arr[i].lastUpdateTimestamp;
            }
             storePic = "";
            storeItem = arr[i];
            if (storeItem.storeItemPictures != null && storeItem.storeItemPictures != undefined && storeItem.storeItemPictures.length > 0) {
                storePic = storeItem.storeItemPictures[0].urlThumb;
            }
            var editButton = "<button type=\x22button\x22 class=\x22btn btn-link\x22 onclick=\x22getStoreItem('" + arr[i]._id + "')\x22>" + arr[i].itemName + "</button>";
            tableBody = tableBody +
            "<tr>" +
            "<td><img class=\x22rounded image-thumbnail\x22 src=\x22 " + storePic + "\x22></td>" +    
            "<td>" + editButton + "<div>_id:" + storeItem._id +"</div></td>" +
            "<td>" + arr[i].itemAltName + "</td>" +
            "<td>" + arr[i].itemType + "</td>" +
            "<td>" + arr[i].itemSubType + "</td>" +
            "<td>" + "$ " + (arr[i].itemPrice * .01).toFixed(2)+ "</td>" +
            "<td>" + arr[i].itemStatus + "</td>" +
            "<td>" + convertTimestamp(ts) + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th></th>"+
            "<th>Name</th>"+
            "<th>AltName</th>"+
            "<th>Type</th>"+
            "<th>SubType</th>"+
            "<th>Price</th>"+
            "<th>Status</th>"+
            "<th>Last Update</th>"+
            "</tr>" +
        "</tfoot>" +
        "</table>";
        $("#table1Data").html(tableHead + tableBody + tableFoot);
        let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22getStoreItem('new')\x22>Create New Store Item</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
        var data = "text/json;charset=utf-8," + encodeURIComponent(ReturnCSV(response.data.storeitems));
        $('<a class=\x22btn btn-xs btn-primary\x22 href="data:' + data + '" download="storeItems.csv">download CSV</a>').appendTo('#downloadContainer');
        $('#dataTable1').DataTable(
            {"order": [[ 7, "desc" ]]}
        );
    })
    .catch(function (error) {
        console.log(error);
    });
    }
    function getAppPurchases() {
        let config = { headers: {
                appid: appid,
            }
        }
        let pTotal = 0;
        axios.get('/purchases/' + appid, config)
        .then(function (response) {
            var jsonResponse = response.data;
            var arr = jsonResponse.purchases;
            
            var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                    "<th>Name</th>"+
                    "<th>Price</th>"+
                    "<th>Purchased By User</th>"+
                    "<th>Purchase Date</th>"+
                    "<th>Purchase Status</th>"+
                "</tr>"+
                "</thead>"+
                "<tbody>";
            var tableBody = "";
            for(var i = 0; i < arr.length; i++) {
                tableBody = tableBody +
                "<tr>" +
                "<td>" + arr[i].itemName + "</td>" +
                "<td>" + "$ " + (arr[i].itemPrice * .01).toFixed(2)+ "</td>" +
                "<td>" + arr[i].userName + "</td>" +
                "<td>" + convertTimestamp(arr[i].purchaseTimestamp) + "</td>" +
                "<td>" + arr[i].purchaseStatus + "</td>" +
                "</tr>";
                pTotal = (pTotal + parseInt(arr[i].itemPrice));
                // console.log("new pTotal : " + pTotal + " from itemPrice + " + arr[i].itemPrice);
            }
            var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                "<th>Name</th>"+
                "<th>Price</th>"+
                "<th>Purchased By User</th>"+
                "<th>Purchase Date</th>"+
                "<th>Purchase Status</th>"+
                "</tr>" +
            "</tfoot>" +
            "</table>";
            var resultElement = document.getElementById('table1Data');
            resultElement.innerHTML = tableHead + tableBody + tableFoot;
            $('#dataTable1').DataTable(
                {"order": [[ 1, "desc" ]]}
            );

        }).then(function() {
        let totalCard = "<div class=\x22col-xl-3 col-md-6 mb-4\x22>" +
            "<div class=\x22card border-left-success shadow h-100 py-2\x22>" +
                "<div class=\x22card-body\x22>" +
                "<div class=\x22row no-gutters align-items-center\x22>" +
                    "<div class=\x22col mr-2\x22>" +
                    "<div class=\x22text-xs font-weight-bold text-success text-uppercase mb-1\x22>Total Earnings to Date: </div>" +
                    "<div class=\x22h5 mb-0 font-weight-bold text-gray-800\x22>$"+ (pTotal * .01).toFixed(2) +"</div>" +
                    "</div>" +
                    "<div class=\x22col-auto\x22>" +
                    "<i class=\x22fas fa-dollar-sign fa-2x text-gray-300\x22></i>" +
                    "</div>" +
                "</div>" +
                "</div>" +
            "</div>" +
            "</div>";
            $("#cards").show();
            $("#cardrow").html(totalCard);
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    function getDomain(domainid) {
        // let config = { headers: {
        //     appid: appid,
        //     }
        // }
        let data = {};
        if (domainid != 'new') {
            data = { 
            _id : domainid
            };
            axios.post('/domain/', data)
                .then(function (response) {
                console.log(response);
                showDomain(response.data);
            })
            .catch(function (error) {
                $("#topAlert").html(error);
                $("#topAlert").show();
            });
        } else {
            let response = {};
            // let data = {};
            showDomain(response); //send empty to make a new one
        }
    }
    function showDomain(response) {

        let isEmpty = $.isEmptyObject(response);
        console.log("domain : " + JSON.stringify(response));
        $("#cards").show();
        let domains = [];
        let submitButtonRoute = "";
        let itemPics = "<div class=\x22row\x22>";
        if (!isEmpty && response.domainPictures != undefined && response.domainPictures != null && response.domainPictures.length > 0 ) {
        for (let i = 0; i < response.domainPictures.length; i++) {
            itemPics = itemPics +
            "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                "<img class=\x22card-img-top\x22 src=\x22" + response.domainPictures[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                "<div class=\x22card-img-overlay\x22>" +
                "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-right\x22 onclick=\x22removeItem('app','picture','" + response._id + "','" + response.domainPictures[i]._id + "')\x22>Remove</button>" +
                "</div>" +
            "</div>";
            }
        itemPics = itemPics +  "</div>";
        }
        let domain = !isEmpty ? response.domain : "";  //ternaries are OK if not nested.  really. 
        let domainStatus = !isEmpty ? response.domainStatus : "";
        let extraButtons = "";
        let submitButtonName = !isEmpty ? "Update" : "Create";
        submitButtonRoute = !isEmpty ? "/updatedomain/" : "/createdomain/";
        if (!isEmpty) {
            extraButtons = "<a href=\x22#\x22 id=\x22deleteButton\x22 class=\x22btn btn-danger btn-sm float-left\x22 onclick=\x22deleteItem('holditasecondtherechief','" + response._id + "')\x22>Delete App</a>" +
                "<a class=\x22btn btn-primary btn-sm float-right\x22 href=\x22index.html?appid=" + response._id + "&type=pictures&mode=select&parent=domain&iid=" + response._id + "\x22>Add Domain Pic</a>";
        } else {
            //maybe do other things if it's a new record...
        }
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
            "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Domain Details - "+ domain + " | _id: " + response._id + "</h6>" +
            "</div>" +
            "<div class=\x22card-body\x22>" +
                "<form id=\x22updateDomainForm\x22>" +
                    // "submit button route " + submitButtonRoute + 
                    "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>"+submitButtonName+"</button>" + //Create vs Update
                    "<div class=\x22row\x22>" +
                        "<div class=\x22col form-group\x22>" +
                            "<label for=\x22domainName\x22>Domain Name</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22domainName\x22 placeholder=\x22Enter Domain Name\x22 value=\x22" + domain + "\x22 required>" +
                        "</div>" +
                        "<div class=\x22col form-group\x22>" +
                            "<label for=\x22domainStatusSelect\x22>Select Domain Status</label>" +
                            "<select class=\x22form-control\x22 id=\x22domainStatusSelect\x22 required>" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>Active</option>" +
                            "<option>Inactive</option>" +
                            "<option>Admin Only</option>" +
                            "<option>Testing</option>" +
                            "<option>Development</option>" +
                            "</select>" +
                        "</div>" +
                    "</div>" +
                    extraButtons + 
                "</form><br><br>" +
                itemPics + 
                // keyValues(response.data) +
            "</div>" +                            
        "</div>" +
        "</div>";
        $("#cardrow").html(itemPics);
        $("#cardrow").html(card);
        if (!isEmpty) {
            $("#domainStatusSelect").val(response.domainStatus); //pop the select dropdowns if not new
        }
        $(function() { //shorthand for document.ready
            $('#updateDomainForm').on('submit', function(e) { //use submit action for form validation to work
                e.preventDefault();  
                let domainPictureIDs = !isEmpty ? response.domainPictureIDs : [];
                let domainName = document.getElementById("domainName").value;
                let domainStatus = document.getElementById("domainStatusSelect").value;
                let data = {
                    // _id : response.data._id,
                    domain : domainName,
                    domainStatus: domainStatus,
                    domainPictureIDs: domainPictureIDs
                };
                if (!isEmpty) {
                    data._id = response._id
                }
                let headers = { headers: {
                    appid: appid,
                    }
                };
                $.confirm({
                    title: 'Confirm Domain Update',
                    content: 'Are you sure about this?  Global Domain changes are super risky!',
                    buttons: {
                    confirm: function () {
                        axios.post(submitButtonRoute, data, headers)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("updated")) {
                                    $("#topSuccess").html("Domain Updated!");
                                    $("#topSuccess").show();
                                } else if (response.data.includes("created")) {
                                    window.location.reload();
                                } else {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                            });
                        },
                        cancel: function () {
                            $("#topAlert").html("Update cancelled");
                            $("#topAlert").show();
                        },
                    }
                });
            });
        });         
    }
    function getDomains() {
        var arr = domains; //apps and domains are returned with amirite response, if user is admin
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>Domain Name</th>"+
            "<th>Status</th>"+
            "<th>Created By</th>"+
            "<th>Create Date</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            tableBody = tableBody +
            "<tr>" +
            "<td><button class=\x22btn btn-sm\x22 onclick=\x22getDomain('" + arr[i]._id + "')\x22><i class=\x22far fa-edit\x22></i></button>" + arr[i].domain + "</td>" +
            // "<td>" + arr[i].domain + "</td>" +
            "<td>" + arr[i].domainStatus + "</td>" +
            "<td>" + arr[i].createdByUserName + "</td>" +
            "<td>" + arr[i].dateCreated + "</td>" +
            // "<td>" + convertTimestamp(arr[i].createDate) + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>Domain Name</th>"+
            "<th>Status</th>"+
            "<th>Created By</th>"+
            "<th>Create Date</th>"+

            "</tr>" +
        "</tfoot>" +
        "</table>";
        var resultElement = document.getElementById('table1Data');
        resultElement.innerHTML = tableHead + tableBody + tableFoot;
        $("#table1Data").html(tableHead + tableBody + tableFoot);
        let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22getDomain('new')\x22>Create New Domain</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
        $('#dataTable1').DataTable(
            {"order": [[ 1, "desc" ]]}
        );
    }  
    function getAppDash() {
        appid = getParameterByName("appid", window.location.href);
        $("#cards").show();
        let arr = apps;
        let currentApp = {};
        for (let i = 0; i < apps.length; i++) {
            if (appid === apps[i]._id) {
                currentApp = apps[i];
            }
        }
        $("#pageTitle").html(currentApp.appname);
        var card1 = "<div class=\x22col-xl-3 col-md-6 mb-4\x22>" +
            "<div class=\x22card shadow mb-4 \x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Admin </h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<ul class=\x22list-group list-group-flush\x22>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=users&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Users</span></a></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=apchs&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Purchases</span></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=scores&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Scores</span></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=scores&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Achievements</span></li>" +
                "</ul>" +
                "</div>" +
            "</div>" +
            "</div>";
            var card2 = "<div class=\x22col-xl-3 col-md-6 mb-4\x22>" +
            "<div class=\x22card shadow mb-4 \x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Content </h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<ul class=\x22list-group list-group-flush\x22>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=ascenes&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Scenes</span></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=storeitems&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Store Items</span></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=acts&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Activities</span></li>" +
                    "<li class=\x22list-group-item\x22><a class=\x22collapse-item\x22 href=\x22index.html?type=attr&appid="+ appid +"\x22><i class=\x22fas fa-th-list\x22></i><span> Attributes</span></li>" +
                "</ul>" +
                "</div>" +
            "</div>" +
            "</div>";
            $("#cardrow").html(card1 + card2);
    }
    function getApp(appid) {
        let config = { headers: {
            appid: appid,
            }
        }
        let data = {};
        if (appid != 'new') {
            axios.get('/app/' + appid, config)
            .then(function (response) {
                console.log(response);
                showApp(response);
            }) //end of main fetch
            .catch(function (error) {
            console.log(error);
            });
        } else {
            let response = {};
            let data = {};
            showApp(response.data); //send empty to make a new one
        }
    }  
    function showApp(response) {
            let isEmpty = $.isEmptyObject(response);
            console.log("isEmpty " + isEmpty);
            $("#cards").show();
            let domains = [];
            let submitButtonRoute = "";
            axios.get('/alldomains/') //need updated list of valid domains for selection
            .then(function (dresp) { 
                domains = dresp.data;
                let itemPics = "<div class=\x22row\x22>";
                if (!isEmpty && response.data.appPictures != null && response.data.appPictures != undefined && response.data.appPictures.length > 0 ) {
                for (let i = 0; i < response.data.appPictures.length; i++) {
                    itemPics = itemPics +
                    "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                        "<img class=\x22card-img-top\x22 src=\x22" + response.data.appPictures[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                        "<div class=\x22card-img-overlay\x22>" +
                        "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-right\x22 onclick=\x22removeItem('app','picture','" + response.data._id + "','" + response.data.appPictures[i]._id + "')\x22>Remove</button>" +
                        "</div>" +
                    "</div>";
                }
                itemPics = itemPics +  "</div>";
                }
                let _id = !isEmpty ? response.data._id : "";
                let appName = !isEmpty ? response.data.appname : "";  //ternarys are OK if not nested.  really. 
                let appDomain = !isEmpty ? response.data.appdomain : "";
                let appStatus = !isEmpty ? response.data.appStatus : "";
                let extraButtons = "";
                let submitButtonName = !isEmpty ? "Update" : "Create";
                submitButtonRoute = !isEmpty ? "/updateapp/" + response.data._id : "/createapp/";
                if (!isEmpty) {
                    extraButtons = "<a href=\x22#\x22 id=\x22deleteButton\x22 class=\x22btn btn-danger btn-sm float-left\x22 onclick=\x22deleteItem('holditasecondtherechief','" + response.data._id + "')\x22>Delete App</a>" +
                        "<a class=\x22btn btn-primary btn-sm float-right\x22 href=\x22index.html?appid=" + response.data._id + "&type=pictures&mode=select&parent=app&iid=" + response.data._id + "\x22>Add App Pic</a>";
                } else {

                }
                var card = "<div class=\x22col-lg-12\x22>" +
                    "<div class=\x22card shadow mb-4\x22>" +
                    "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                        "<h6 class=\x22m-0 font-weight-bold text-primary\x22>App Details - "+ appName +" | _id: "+ _id +"</h6>" +
                    "</div>" +
                    "<div class=\x22card-body\x22>" +
                        "<form id=\x22updateAppForm\x22>" +
                            // "submitbutton route " +submitButtonRoute + 
                            "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>"+submitButtonName+"</button>" + //Create vs Update
                            "<div class=\x22row\x22>" +
                                "<div class=\x22col form-group\x22>" +
                                    "<label for=\x22siName\x22>App Name</label>" +
                                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22appName\x22 placeholder=\x22Enter App Name\x22 value=\x22" + appName + "\x22 required>" +
                                "</div>" +
                                "<div class=\x22col form-group\x22>" +
                                    "<label for=\x22appStatusSelect\x22>Select App Status</label>" +
                                    "<select class=\x22form-control\x22 id=\x22appStatusSelect\x22 required>" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>Active</option>" +
                                    "<option>Inactive</option>" +
                                    "<option>Admin Only</option>" +
                                    "<option>Testing</option>" +
                                    "<option>Development</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group\x22>" +
                                    "<label for=\x22appDomainSelect\x22>Select App Domain</label>" +
                                    "<select class=\x22form-control\x22 id=\x22appDomainSelect\x22 required>" +
                                        //pop'd dynamically below
                                    "</select>" +
                                "</div>" +
                            "</div>" +
                        extraButtons + 
                        "</form><br><br>" +
                        itemPics + 
                        // keyValues(response.data) +
                    "</div>" +                            

                "</div>" +
                "</div>";
                // $("#cardrow").html(itemPics);
                $("#cardrow").html(card);
            })
            .then(function () { //populate
                for (let i = 0; i < domains.length; i++) {//populate dropdown options
                    var x = document.getElementById("appDomainSelect");
                    var option = document.createElement("option");
                    option.text = domains[i].domain;
                    x.add(option);
                }
                if (!isEmpty) {
                    $("#appStatusSelect").val(response.data.appStatus); //then pop the values if not new
                    $("#appDomainSelect").val(response.data.appdomain);
                }
                $(function() { //shorthand document.ready function
                    $('#updateAppForm').on('submit', function(e) { //use submit action for form validation to work
                        e.preventDefault();  
                        let appPictureIDs = !isEmpty ? response.data.appPictureIDs : [];
                        let appName = document.getElementById("appName").value;
                        let appStatus = document.getElementById("appStatusSelect").value;
                        let appDomain = document.getElementById("appDomainSelect").value;
                        let data = {
                            // _id : response.data._id,
                            appname : appName,
                            appStatus: appStatus,
                            appdomain: appDomain,
                            appPictureIDs: appPictureIDs
                        };
                        if (!isEmpty) {
                            data._id = response.data._id
                        }
                        let headers = { headers: {
                            appid: appid,
                            }
                        };
                        $.confirm({
                            title: 'Confirm App Update',
                            content: 'Are you sure about this?  Global App changes are risky!',
                            buttons: {
                            confirm: function () {
                            axios.post(submitButtonRoute, data, headers)
                                .then(function (response) {
                                    console.log(response);
                                    if (response.data.includes("updated")) {
                                        $("#topSuccess").html("App Updated!");
                                        $("#topSuccess").show();
                                    } else if (response.data.includes("created")) {
                                        window.location.reload();
                                    } else {
                                        $("#topAlert").html(response.data);
                                        $("#topAlert").show();
                                    }
                                })                      
                                .catch(function (error) {
                                    console.log(error);
                                });
                            },
                            cancel: function () {
                                $("#topAlert").html("Update cancelled");
                                $("#topAlert").show();
                            },
                            }
                        });
                    });
                });
            })
        .catch(function (error) {
            console.log(error);
        });                 
    }
    function newGroup() {
        let card = "<div class=\x22col-lg-12\x22>" +
        "<div class=\x22card shadow\x22>" +
        "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
        "<h6 class=\x22m-0 font-weight-bold text-primary\x22>New Group</h6>" +
        "</div>" +
        "<div class=\x22card-body\x22>" +
            "<form id=\x22newGroupForm\x22>" +
            "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Create</button></div>" + 
            "<div class=\x22form-row\x22>" +
                "<div class=\x22col form-group col-md-4\x22>" +
                    "<label for=\x22locName\x22>Group Name</label>" +
                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22groupName\x22 placeholder=\x22Enter Group Name\x22 required>" +
                "</div>" +
                "<div class=\x22col form-group col-md-3\x22>" +
                    "<label for=\x22groupTypeSelect\x22>Group Type</label>" +
                    "<select class=\x22form-control\x22 id=\x22groupTypeSelect\x22 required>" +
                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                    "<option>Location</option>" +
                    "<option>Audio</option>" +
                    "<option>Video</option>" +
                    "<option>Text</option>" +
                    "<option>People</option>" +
                    "<option>Objects</option>" +
                    "<option>Pictures</option>" +
                    "</select>" +
                "</div>" +
                "<div id=\x22mapElement\x22 style=\x22display:none;\x22 class=\x22col form-group col-md-5\x22>" +
                    //populated when getCurrentLocation clicked below
                "</div>" +
            "</form>" +
            "</div>" +
            "</div>" +
        "</div>";
        $("#cardrow").html(card);        
        $(function() {
            $('#newGroupForm').on('submit', function(e) { //use submit action for form validation to work
                e.preventDefault();  
                let name = document.getElementById("groupName").value;
                let type = document.getElementById("groupTypeSelect").value;
                let data = {
                    name: name,
                    type: type
                }
                axios.post('/newgroup', data)
                .then(function (response) {
                    console.log(response);
                    if (response.data.includes("error")) {
                        // window.location.reload();
                        $("#topAlert").html(response);
                        $("#topAlert").show();
                    } else {
                        // console.log("tryna show new group " + 'index.html?type=group&iid=' + response.data);
                        window.location.href = 'index.html?type=group&iid=' + response.data;
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
            }); 
        });
    };
function showGroup() {
    let tags = [];
    let tagsHtml = "";
    let groupID = itemid;
    console.log("groupID is " + groupID);
    axios.get('/usergroup/' + groupID)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
        $("#pageTitle").html(response.data.type + " group by " + username);
        // var arr = response.data;
        // var html = "<div class=\x22row\x22>";
        let html = "";
        var re = /(?:\.([^.]+))?$/;
        let grouptype = "";
        let pictype =  "<span class=\x22float-left\x22><i class=\x22fas fa-image fa-3x\x22 style=\x22color:#412dcf;\x22></i></span>";
        let loctype = "<span class=\x22float-left\x22><i class=\x22fas fa-globe fa-3x\x22 style=\x22color:#7d9e35;\x22></i></span>";
        let audiotype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-audio fa-3x\x22 style=\x22color:#cf43b8;\x22></i></span>";
        let texttype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-alt fa-3x\x22 style=\x22color:#c0bd41;\x22></i></span>";
        let objtype = "<span class=\x22float-left\x22><i class=\x22fas fa-cubes fa-3x\x22 style=\x22color:#d43027;\x22></i></span>";
        let peopletype = "<span class=\x22float-left\x22><i class=\x22fas fa-user-friends fa-3x\x22 style=\x22color:#48a0d2;\x22></i></span>";
        let vidtype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-video fa-3x\x22 style=\x22color:#ff5e41;\x22></i></span>";
        let addButton = '';
        let arr = [];
        let groupArr = [];
        if (response.data.type.toLowerCase() == "picture") {
            grouptype = pictype;
            responseArr = response.data.image_items;
            refArr = [];
            arr = [];
            idArr = response.data.items;
            groupArr = response.data.groupData;
            if (groupArr != null) { //if there's a groupdata array
                groupArr = groupArr.sort(function(a, b){ //sort groupdata by index #
                    return a.itemIndex > b.itemIndex;
                });
                for (let n = 0; n < groupArr.length; n++) { //copy out a reference array with proper order
                    refArr.push(groupArr[n]._id);
                }
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            } else { //otherwise sort by index #'s added to request by server in the item Array
                for (let n = 0; n < responseArr.length; n++) { //copy out a reference array with proper order, using server assigned indexes
                    refArr.push(responseArr[n]._id);
                }
                arr = responseArr;
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            }
            for (let h = 0; h < idArr.length; h++) {
                // console.log(idArr[h]);
                let hasItem = false;
                for (let i = 0; i < arr.length; i++) {
                    if (idArr[h] == arr[i]._id) {
                    // console.log(idArr[h] + " " + arr[i]._id);    
                    hasItem = true;
                    html = html + 
                        "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                            "<img class=\x22card-img-top\x22 src=\x22" + arr[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                            "<div class=\x22card-body\x22>" +
                                "<div class=\x22 float-left\x22>" + arr[i].filename + "</div>" +
                                    "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                    "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22" + arr[i].itemIndex + "\x22>" +
                                    "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + arr[i]._id + "')\x22>Remove</a>" +
                                    "<a href=\x22index.html?type=picture&iid="+ arr[i]._id +"\x22 class=\x22float-right btn btn-xs btn-info\x22>Edit</a>" +
                            "</div>" +
                        "</div>";
                    break;
                    }
                }
                if (!hasItem) {  //show orphaned elements so they can be removed //TODO clean up references when parents are deleted
                html = html + 
                    "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22card-body\x22>" +
                            "<div class=\x22 float-left\x22>not found</div>" +
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22not found\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + idArr[h] + "')\x22>Remove</a>" +
                        "</div>" +
                    "</div>";        
                }
            }
            addButton = "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type=pictures&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>";
        }
        if (response.data.type.toLowerCase() == "location") {
            grouptype = loctype;
            responseArr = response.data.locations;
            refArr = [];
            arr = [];
            idArr = response.data.items;
            groupArr = response.data.groupData;
            if (groupArr != null) { //if there's a groupdata array
                groupArr = groupArr.sort(function(a, b){ //sort groupdata by index #
                    return a.itemIndex > b.itemIndex;
                });
                for (let n = 0; n < groupArr.length; n++) { //copy out a reference array with proper order
                    refArr.push(groupArr[n]._id);
                }
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            } else { //otherwise sort by index #'s added to request by server in the item Array
                for (let n = 0; n < responseArr.length; n++) { //copy out a reference array with proper order, using server assigned indexes
                    refArr.push(responseArr[n]._id);
                }
                arr = responseArr;
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            }
            for (let h = 0; h < idArr.length; h++) {
                // console.log(idArr[h]);
                let hasItem = false;
                for (let i = 0; i < arr.length; i++) {
                    if (idArr[h] == arr[i]._id) {
                    // console.log(idArr[h] + " " + arr[i]._id);    
                    hasItem = true;
                    let mapSrc = "";
                    if (arr[i].type.toLowerCase() == "geographic") {
                        mapSrc = "https://maps.googleapis.com/maps/api/staticmap?center=" + arr[i].latitude + "," + arr[i].longitude + "&zoom=15&size=600x300&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:" + (i + 1) + "%7C" + arr[i].latitude + "," + arr[i].longitude;
                        detailsPicLink = "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + arr[i].latitude + "," + arr[i].longitude + "\x22>" +
                        "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + arr[i].latitude + "," + arr[i].longitude + 
                        "&zoom=15&size=600x300&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:" + (i + 1) + "%7C" + arr[i].latitude + "," + arr[i].longitude + "\x22>" + 
                        "</a>";
                        location = "latitude: " + arr[i].latitude + "<br>latitude: " + arr[i].longitude;
                    } else {
                        location = "x: " + arr[i].x + "<br>y: " + arr[i].y + "<br>z: " + arr[i].z; 
                    }
                    html = html + 
                        "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                            "<img class=\x22card-img-top\x22 src=\x22" + mapSrc + "\x22 alt=\x22Card image cap\x22>" +
                            "<div class=\x22card-body\x22>" +
                                "<div class=\x22 float-left\x22>" + arr[i].name + "</div><br>" +
                                    "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                    "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22" + arr[i].itemIndex + "\x22>" +
                                    "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + arr[i]._id + "')\x22>Remove</a>" +
                                    "<a href=\x22index.html?type=location&iid="+ arr[i]._id +"\x22 class=\x22float-right btn btn-xs btn-info\x22>Edit</a>" +
                            "</div>" +
                        "</div>";
                    break;
                    }
                }
                if (!hasItem) {  //show orphaned elements so they can be removed //TODO clean up references when parents are deleted
                html = html + 
                    "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22card-body\x22>" +
                            "<div class=\x22 float-left\x22>not found</div>" +
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22not found\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + idArr[h] + "')\x22>Remove</a>" +
                        "</div>" +
                    "</div>";        
                }
            }
            addButton = "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type=locations&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>";
        }
        if (response.data.type.toLowerCase() == "audio") {
            grouptype = audiotype;
            responseArr = response.data.audio_items;
            refArr = [];
            arr = [];
            idArr = response.data.items;
            groupArr = response.data.groupData;
            if (groupArr != null) { //if there's a groupdata array
                groupArr = groupArr.sort(function(a, b){ //sort groupdata by index #
                    return a.itemIndex > b.itemIndex;
                });
                for (let n = 0; n < groupArr.length; n++) { //copy out a reference array with proper order
                    refArr.push(groupArr[n]._id);
                }
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            } else { //otherwise sort by index #'s added to request by server in the item Array
                for (let n = 0; n < responseArr.length; n++) { //copy out a reference array with proper order, using server assigned indexes
                    refArr.push(responseArr[n]._id);
                }
                arr = responseArr;
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            }
            for (let h = 0; h < idArr.length; h++) {
                // console.log(idArr[h]);
                let hasItem = false;
                for (let i = 0; i < arr.length; i++) {
                    if (idArr[h] == arr[i]._id) {
                    // console.log(idArr[h] + " " + arr[i]._id);    
                    hasItem = true;
                    html = html + 
                        "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                            "<img class=\x22card-img-top\x22 src=\x22" + arr[i].URLpng + "\x22 alt=\x22Card image cap\x22>" +
                            "<div class=\x22card-body\x22>" +
                                
                                "<div class=\x22 float-left\x22>" + arr[i].title + "</div><br>" +
                                    "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                    "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22" + arr[i].itemIndex + "\x22>" +
                                    "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + arr[i]._id + "')\x22>Remove</a>" +
                                    "<a href=\x22index.html?type=saudio&iid="+ arr[i]._id +"\x22 class=\x22float-right btn btn-xs btn-info\x22>Edit</a>" +
                            "</div>" +
                        "</div>";
                    break;
                    }
                }
                if (!hasItem) {  //show orphaned elements so they can be removed //TODO clean up references when parents are deleted
                html = html + 
                    "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22card-body\x22>" +
                            "<div class=\x22 float-left\x22>not found</div>" +
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22not found\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + idArr[h] + "')\x22>Remove</a>" +
                        "</div>" +
                    "</div>";        
                }
            }
            addButton = "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type=audio&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>";
        }
        if (response.data.type.toLowerCase() == "text") {
            grouptype = texttype;
        }
        if (response.data.type.toLowerCase() == "video") {
            grouptype = vidtype;
            responseArr = response.data.video_items;
            refArr = [];
            arr = [];
            idArr = response.data.items;
            groupArr = response.data.groupData;
            if (groupArr != null) { //if there's a groupdata array
                groupArr = groupArr.sort(function(a, b){ //sort groupdata by index #
                    return a.itemIndex > b.itemIndex;
                });
                for (let n = 0; n < groupArr.length; n++) { //copy out a reference array with proper order
                    refArr.push(groupArr[n]._id);
                }
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            } else { //otherwise sort by index #'s added to request by server in the item Array
                for (let n = 0; n < responseArr.length; n++) { //copy out a reference array with proper order, using server assigned indexes
                    refArr.push(responseArr[n]._id);
                }
                arr = responseArr;
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            }
            for (let h = 0; h < idArr.length; h++) {
                // console.log(idArr[h]);
                let hasItem = false;
                for (let i = 0; i < arr.length; i++) {
                    if (idArr[h] == arr[i]._id) {
                    // console.log(idArr[h] + " " + arr[i]._id);    
                    hasItem = true;
                    html = html + 
                        "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:320px;\x22>" +
                                "<video width='320' height='240' controls>" +
                                "<source src=" + arr[i].vUrl + " type='video/mp4'>" +
                                "<source src=" + arr[i].vUrl + " type='video/mkv'>" +
                                "Your browser does not support the video tag." +
                                "</video>" +
                            "<div class=\x22card-body\x22>" +
                                
                            "<div class=\x22float-left card-text\x22>" + arr[i].title + "</div><br>" +
                            
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22" + arr[i].itemIndex + "\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + arr[i]._id + "')\x22>Remove</a>" +
                                "<a href=\x22index.html?type=svideo&iid="+ arr[i]._id +"\x22 class=\x22float-right btn btn-xs btn-info\x22>Edit</a>" +
                            "</div>" +
                        "</div>";
                    break;
                    }
                }
                if (!hasItem) {  //show orphaned elements so they can be removed //TODO clean up references when parents are deleted
                html = html + 
                    "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22card-body\x22>" +
                            "<div class=\x22 float-left\x22>not found</div>" +
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22not found\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + idArr[h] + "')\x22>Remove</a>" +
                        "</div>" +
                    "</div>";        
                }
            }
            addButton = "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type=audio&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>";
        }
        if (response.data.type.toLowerCase() == "people") {
            grouptype = peopletype;
        }
        if (response.data.type.toLowerCase() == "objects") {
            grouptype = objtype;
            responseArr = response.data.obj_items;
            refArr = [];
            arr = [];
            idArr = response.data.items;
            groupArr = response.data.groupData;
            if (groupArr != null) { //if there's a groupdata array
                groupArr = groupArr.sort(function(a, b){ //sort groupdata by index #
                    return a.itemIndex > b.itemIndex;
                });
                for (let n = 0; n < groupArr.length; n++) { //copy out a reference array with proper order
                    refArr.push(groupArr[n]._id);
                }
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            } else { //otherwise sort by index #'s added to request by server in the item Array
                for (let n = 0; n < responseArr.length; n++) { //copy out a reference array with proper order, using server assigned indexes
                    refArr.push(responseArr[n]._id);
                }
                arr = responseArr;
                idArr.sort(function(a, b){ //match order
                    return refArr.indexOf(a) - refArr.indexOf(b);
                });
            }
            for (let h = 0; h < idArr.length; h++) {
                // console.log(idArr[h]);
                let hasItem = false;
                for (let i = 0; i < arr.length; i++) {
                    if (idArr[h] == arr[i]._id) {
                    // console.log(idArr[h] + " " + arr[i]._id);    
                    hasItem = true;
                    html = html + 
                        "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                            "<img class=\x22card-img-top\x22 src=\x22" + arr[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                            "<div class=\x22card-body\x22>" +
                                "<div class=\x22 float-left\x22>Object Name: <strong>" + arr[i].name + "</strong></div><br><br>" +
                                    "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                    "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22" + arr[i].itemIndex + "\x22>" +
                                    "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + arr[i]._id + "')\x22>Remove</a>" +
                                    "<a href=\x22index.html?type=picture&iid="+ arr[i]._id +"\x22 class=\x22float-right btn btn-xs btn-info\x22>Edit</a>" +
                            "</div>" +
                        "</div>";
                    break;
                    }
                }
                if (!hasItem) {  //show orphaned elements so they can be removed //TODO clean up references when parents are deleted
                html = html + 
                    "<div class=\x22card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22card-body\x22>" +
                            "<div class=\x22 float-left\x22>not found</div>" +
                                "<label for=\x22itemIndex\x22>Item Index</label>" + //sceneTitle
                                "<input type=\x22text\x22 size=\x224\x22  class=\x22float-right\x22 id=\x22itemIndex\x22 value=\x22not found\x22>" +
                                "<br><a href=\x22#\x22 class=\x22btn btn-xs btn-danger\x22 onclick=\x22removeItem('group','item','" + response.data._id + "','" + idArr[h] + "')\x22>Remove</a>" +
                        "</div>" +
                    "</div>";        
                }
            }
            addButton = "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type=objects&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>";
        }
        // let timestamp = 
        let modtype = response.data.type.toLowerCase();
        if (modtype == "location") {
            modtype = "locations";
        }
        if (modtype == "picture") {
            modtype = "pictures";
        }
        let count = response.data.items ? response.data.items.length : 0;
        var card = "<div class=\x22col-lg-12\x22>" +
        "<div class=\x22card shadow\x22>" +
            "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Details - name: "+ response.data.name +" | _id: "+ response.data._id +" | count: <strong>" + count + "</strong> " + response.data.type + " items"+"</h6>" +
            "</div>" +
            "<div class=\x22card-body\x22>" +
                "<form id=\x22updateGroupForm\x22>" +
                    "<div class=\x22float-right\x22><button type=\x22submit\x22 id=\x22submitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button></div>" + 
                    "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22groupName\x22>Group Name</label>" + //groupName
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22groupName\x22 value=\x22" + response.data.name + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-2\x22>" + 
                            "<label for=\x22sceneTitle\x22>Last Update</label>" + //sceneTitle
                            "<p>" + convertTimestamp(response.data.lastUpdateTimestamp) + "</p>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-6\x22>" +
                            "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                            "<div class=\x22input-group\x22>" +
                            "<div class=\x22input-group-prepend\x22>" +
                            "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                        "</div>" +
                            "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                        "</div>" +
                        "<div class=\x22form-row\x22 id=\x22tagDisplay\x22>" +
                            tagsHtml +
                        "</div>" +    
                    "</div>" +
                    "<div class=\x22form-row\x22>" +
                    html +
                    "</div>" +
                "</form>" +
            "</div>" +
            // addButton +
            "<a class=\x22btn btn-sm btn-primary float-right\x22 href=\x22index.html?type="+modtype+"&mode=select&parent=group&iid=" + response.data._id + "\x22\x22>Add Item</a>" +
            "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-left\x22 onclick=\x22deleteItem('group','" + response.data._id + "')\x22>Delete Group</button>";
            "</div>" +
            "</div>" +
            "<div class=\x22row\x22>" +
            "<pre>"+keyValues(response.data)+"</pre>"
            "</div>" +
        "</div>"+ 

        $("#cardrow").html(card);

        if (response.data.tags != null && response.data.tags.length > 0) {
            tags = response.data.tags;
            for (let i = 0; i < tags.length; i++) {
                tagsHtml = tagsHtml + 
                "<div class=\x22btn btn-light\x22>" +   
                    "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                    "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                "</div>";
            }
            $("#tagDisplay").html(tagsHtml);
        };
        $(function() { //shorthand document.ready function
            $(document).on('click','#addTagButton',function(e){
                e.preventDefault();  
                let newTag = document.getElementById("addTagInput").value;
                console.log("tryna add tag " + newTag);
                if (newTag.length > 2) {
                let html = "";
                tags.push(newTag);
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
                }
            }); 
            $(document).on('click','.remTagButton',function(e){
                e.preventDefault();  
                console.log("tryna remove tag " + this.id);
                let html = "";
                for( var i = 0; i < tags.length; i++){ 
                    if ( tags[i] === this.id) {
                        tags.splice(i, 1); 
                    }
                    }
                for (let i = 0; i < tags.length; i++) {
                    html = html + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").empty();
                $("#tagDisplay").html(html);
            });
            $('#updateGroupForm').on('submit', function(e) { //use submit action for form validation to work
                e.preventDefault();  
                let name = document.getElementById("groupName").value;
                console.log("tryna submit");
                let data = {
                    _id: response.data._id,
                    name: name,
                    tags: tags
                }
                axios.post('/updategroup', data)
                    .then(function (response) {
                        console.log(response);
                        if (response.data.includes("updated")) {
                            $("#topSuccess").html(response.data);
                            $("#topSuccess").show();
                            
                        } else {
                            $("#topAlert").html(response);
                            $("#topAlert").show();
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                });
            });
        })                      
        .catch(function (error) {
            console.log(error);
        });
    }
    function getGroups() {
        axios.get('/usergroups/' + userid)
        .then(function (response) {
            var arr = response.data;
            let select = false;
            let select_grouptype = "";
            if (mode == "picgroup") {
                select = true;
                $("#table1Title").html("Groups");
                $("#pageTitle").html("Select Picture Group for Scene " + itemid); //= route param iid
            }
            if (mode == "paudiogroup") { //primary audio group - todo ambient and trigger
                select = true;
                $("#table1Title").html("Groups");
                $("#pageTitle").html("Select Primary Audio Group for Scene " + itemid); //= route param iid
            }
            if (mode == "objgroup") {
                select = true;
                $("#table1Title").html("Groups");
                $("#pageTitle").html("Select Object Group for Scene " + itemid);
            }
            arr.sort(function(a, b) { //sort groupdata by index #
                // console.log("a.type vs b.type " + a.type + " " + b.type);
                if ( a.type < b.type) //sort string ascending
                    return -1 
                if ( a.type > b.type)
                    return 1
                return 0 //default return value (no sorting)
            });
            let html = "";
            var re = /(?:\.([^.]+))?$/;
            let grouptype = "";
            let pictype =  "<span class=\x22float-left\x22><i class=\x22fas fa-image fa-2x\x22 style=\x22color:#412dcf;\x22></i></span>";
            let loctype = "<span class=\x22float-left\x22><i class=\x22fas fa-globe fa-2x\x22 style=\x22color:#7d9e35;\x22></i></span>";
            let audiotype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-audio fa-2x\x22 style=\x22color:#cf43b8;\x22></i></span>";
            let texttype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-alt fa-2x\x22 style=\x22color:#c0bd41;\x22></i></span>";
            let objtype = "<span class=\x22float-left\x22><i class=\x22fas fa-cubes fa-2x\x22 style=\x22color:#d43027;\x22></i></span>";
            let peopletype = "<span class=\x22float-left\x22><i class=\x22fas fa-user-friends fa-2x\x22 style=\x22color:#48a0d2;\x22></i></span>";
            let vidtype = "<span class=\x22float-left\x22><i class=\x22fas fa-file-video fa-2x\x22 style=\x22color:#ff5e41;\x22></i></span>";
            let picTypeHtml = "<div class=\x22col-md-12\x22><div><h4>Picture Groups</h4></div><hr>";
            let locTypeHtml = "<div class=\x22col-md-12\x22><span><h4>Location Groups</h4><hr>";
            let audioTypeHtml = "<div class=\x22 col-md-12\x22><span><h4>Audio Groups</h4><hr>";
            let textTypeHtml = "<div class=\x22 col-md-12\x22><span><h4>Text Groups</h4><hr>";
            let vidTypeHtml = "<div class=\x22 col-md-12\x22><span><h4>Video Groups</h4><hr>";
            let peopleTypeHtml = "<div class=\x22col-md-12\x22><span><h4>People Groups</h4><hr>";
            let objTypeHtml = "<div class=\x22col-md-12\x22><span><h4>Object Groups</h4><hr>";
            for(var i = 0; i < arr.length; i++) {
            //  console.log(arr[i].type);
                let count = 0;
                if (arr[i].items != null) {
                    if (arr[i].items.length > 0){
                    count = arr[i].items.length;
                    }
                }
                if (!select || (select && (mode == "picgroup"))) {
                    if (arr[i].type.toLowerCase() == "picture") {
                        grouptype = pictype;
                        let selectButton = "";
                        if (mode == "picgroup") {
                            selectButton = "<button type=\x22button\x22 class=\x22btn btn-primary btn-sm float-right\x22 onclick=\x22selectItem('" + parent + "','picgroup','" + itemid + "','" + arr[i]._id + "')\x22>Select</button>";
                            // pictype = "";
                            loctype = "";
                            audiotype = "";
                            texttype = "";
                            objtype = "";
                            peopletype = "";
                            vidtype = "";
                            // picTypeHtml = "";
                            locTypeHtml = "";
                            audioTypeHtml = "";
                            textTypeHtml = "";
                            vidTypeHtml = "";
                            peopleTypeHtml = "";
                            objTypeHtml = "";
                        }
                        picTypeHtml = picTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<div><strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items " + selectButton + "</div>" +
                                // "<div class=\x22float-right\x22><button type=\x22button\x22 class=\x22btn btn-primary btn-sm\x22 onclick=\x22selectItem('" + parent + "','picgroup','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></div>"
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "locgroup"))) {
                    if (arr[i].type.toLowerCase() == "location") {
                        grouptype = loctype;
                        locTypeHtml = locTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "audiogroup"))) {
                    if (arr[i].type.toLowerCase() == "audio") {
                        grouptype = audiotype;
                        audioTypeHtml = audioTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "paudiogroup"))) { //TODO trigger and ambient?
                    if (arr[i].type.toLowerCase() == "audio") {
                        grouptype = audiotype;
                        let selectButton = "";
                        if (mode == "paudiogroup") {
                            selectButton = "<button type=\x22button\x22 class=\x22btn btn-primary btn-sm float-right\x22 onclick=\x22selectItem('" + parent + "','paudiogroup','" + itemid + "','" + arr[i]._id + "')\x22>Select</button>";
                            pictype = "";
                            loctype = "";
                            // audiotype = "";
                            texttype = "";
                            objtype = "";
                            peopletype = "";
                            vidtype = "";
                            picTypeHtml = "";
                            locTypeHtml = "";
                            // audioTypeHtml = "";
                            textTypeHtml = "";
                            vidTypeHtml = "";
                            peopleTypeHtml = "";
                            objTypeHtml = "";
                        }
                        audioTypeHtml = audioTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +

                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items " + selectButton + "</div>" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "textgroup"))) {
                    if (arr[i].type.toLowerCase() == "text") {
                        grouptype = texttype;
                        textTypeHtml = textTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "vidgroup"))) {
                    if (arr[i].type.toLowerCase() == "video") {
                        grouptype = vidtype;
                        let selectButton = "";
                        if (mode == "vidgroup") {
                            selectButton = "<button type=\x22button\x22 class=\x22btn btn-primary btn-sm float-right\x22 onclick=\x22selectItem('" + parent + "','vidgroup','" + itemid + "','" + arr[i]._id + "')\x22>Select</button>";
                            pictype = "";
                            loctype = "";
                            audiotype = "";
                            texttype = "";
                            objtype = "";
                            peopletype = "";
                            // vidtype = "";
                            picTypeHtml = "";
                            locTypeHtml = "";
                            audioTypeHtml = "";
                            textTypeHtml = "";
                            // vidTypeHtml = "";
                            peopleTypeHtml = "";
                            objTypeHtml = "";
                        }
                        vidTypeHtml = vidTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<div><strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items " + selectButton + "</div>" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (arr[i].type.toLowerCase() == "people") {
                    if (!select || (select && (mode == "peoplegroup"))) {
                        grouptype = peopletype;
                        peopleTypeHtml = peopleTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items" +
                            "</div>" +
                        "</div>";
                    }
                }
                if (!select || (select && (mode == "objgroup"))) {
                    if (arr[i].type.toLowerCase() == "objects") {
                        grouptype = objtype;
                        
                        let selectButton = "";
                        if (mode == "objgroup") {
                            selectButton = "<button type=\x22button\x22 class=\x22btn btn-primary btn-sm float-right\x22 onclick=\x22selectItem('" + parent + "','objgroup','" + itemid + "','" + arr[i]._id + "')\x22>Select</button>";
                            pictype = "";
                            loctype = "";
                            audiotype = "";
                            texttype = "";
                            // objtype = "";
                            peopletype = "";
                            vidtype = "";
                            picTypeHtml = "";
                            locTypeHtml = "";
                            audioTypeHtml = "";
                            textTypeHtml = "";
                            vidTypeHtml = "";
                            peopleTypeHtml = "";
                            // objTypeHtml = "";
                        }
                        objTypeHtml = objTypeHtml +
                        "<div class=\x22float-left card ml-1 mr-1 mt-1 mb-1\x22 style=\x22width:250px;\x22>" +
                            "<div class=\x22float-left card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                                grouptype +
                                // "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a onclick=\x22showGroup('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].name + "</a></h6>" +
                                "<h6 class=\x22pull left m-0 font-weight-bold text-primary\x22><a href=\x22index.html?type=group&iid=" + arr[i]._id + "\x22>" + arr[i].name + "</a></h6>" +
                                "</div>" +
                                "<div class=\x22card-body\x22>" +
                                "<strong>" + count + "</strong> " + arr[i].type.toLowerCase() + " items " + selectButton + "</div>" +
                            "</div>" +
                        "</div>";
                    }

                }
                let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22newGroup()\x22>Create New Group</button>";
                $("#newButton").html(newButton);
                $("#newButton").show();
                let card =
                // let card = "<div class=\x22card shadow col-md-12\x22>" +
                    // "<div class=\x22card-header\x22>" +
                    //     "<h6 class=\x22font-weight-bold text-primary\x22>All Groups</h6>" +
                    // "</div>" +
                    // "<div class=\x22card-body\x22>" +
                        "<div class=\x22row\x22>" +
                            "<div class=\x22col col-md-6\x22>" +
                            locTypeHtml +
                            "</div>" +
                            "<div class=\x22col col-md-6\x22>" +
                            audioTypeHtml +
                            "</div>"+
                        "</div>"+
                        "<div class=\x22row\x22>" +
                            "<div class=\x22col col-md-6\x22>" +
                            textTypeHtml +
                            "</div>"+
                            "<div class=\x22col col-md-6\x22>" +
                            vidTypeHtml +
                            "</div>"+
                        "</div>"+
                        "<div class=\x22row\x22>" +
                            "<div class=\x22col col-md-6\x22>" +
                            peopleTypeHtml +
                            "</div>"+
                            "<div class=\x22col col-md-6\x22>" +
                            objTypeHtml +
                            "</div>"+
                        "</div>"+
                        "<div class=\x22row\x22>" +
                            "<div class=\x22col col-md-12\x22>" +
                            picTypeHtml +
                            "</div>" +
                        "</div>" +

                    // "</div>"+ 
                "</div>";
                // $("#cardrow").html(card);

                // $("#cardrow").html(locTypeHtml + "<hr>");
                $("#cardrow1").html(locTypeHtml + "<hr>");

                $("#cardrow2").html(audioTypeHtml + "<hr>");

                $("#cardrow3").html(textTypeHtml + "<hr>");

                $("#cardrow4").html(vidTypeHtml + "<hr>");

                $("#cardrow5").html(objTypeHtml + "<hr>");

                $("#cardrow6").html(peopleTypeHtml + "<hr>");

                $("#cardrow7").html(picTypeHtml + "<hr>");
                // $("#cardrow").html("<hr>" + card + locTypeHtml + "</div>" + audioTypeHtml + "</div>" + textTypeHtml + "</div>" + vidTypeHtml + "</div>" + peopleTypeHtml + "</div>" + objTypeHtml + "</div>" + picTypeHtml + "</div></div></div>");
            }
        })                      
        .catch(function (error) {
            console.log(error);
        });
    }

    function getApps() {
        var arr = apps; //no need to fetch, apps come down with amirite response if admin
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>App Name</th>"+
            "<th>App Domain</th>"+
            "<th>Status</th>"+
            "<th>Created By</th>"+
            "<th>Create Date</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            tableBody = tableBody +
            "<tr>" +
            "<td><button class=\x22btn btn-sm\x22 onclick=\x22getApp('" + arr[i]._id + "')\x22><i class=\x22far fa-edit\x22></i></button>" + arr[i].appname + "</td>" +
            "<td>" + arr[i].appdomain + "</td>" +
            "<td>" + arr[i].appStatus + "</td>" +
            "<td>" + arr[i].createdByUserName + "</td>" +
            "<td>" + arr[i].dateCreated + "</td>" +
            // "<td>" + convertTimestamp(arr[i].createDate) + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>App Name</th>"+
            "<th>App Domain</th>"+
            "<th>Status</th>"+
            "<th>Created By</th>"+
            "<th>Create Date</th>"+

            "</tr>" +
        "</tfoot>" +
        "</table>";
        $("#table1Data").html(tableHead + tableBody + tableFoot);
        let newButton = "<button class=\x22btn btn-info float-right\x22 onclick=\x22getApp('new')\x22>Create New App</button>";
        $("#newButton").html(newButton);
        $("#newButton").show();
        $('#dataTable1').DataTable(
            {"order": [[ 1, "desc" ]]}
        );
    }
        
    function getAllUsers() {
    let config = { headers: {
            appid: appid,
        }
        }
        axios.get('/allusers/', config)
        .then(function (response) {
        // console.log(JSON.stringify(response));
        // var jsonResponse = response.data;
        var arr = response.data;
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>User Name</th>"+
            "<th>Type</th>"+
            "<th>Status</th>"+
            "<th>Email</th>"+
            "<th>Original AppID</th>"+
            "<th>Create Date</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            tableBody = tableBody +
            "<tr>" +
            "<td>" + arr[i].userName + "</td>" +
            "<td>" + arr[i].type + "</td>" +
            "<td>" + arr[i].status + "</td>" +
            "<td>" + arr[i].email + "</td>" +
            "<td>" + arr[i].oappid + "</td>" +
            "<td>" + convertTimestamp(arr[i].createDate) + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>User Name</th>"+ 
            "<th>Type</th>"+
            "<th>Status</th>"+
            "<th>Email</th>"+
            "<th>Original AppID</th>"+
            "<th>Create Date</th>"+
            "</tr>" +
        "</tfoot>" +
        "</table>";
        var resultElement = document.getElementById('table1Data');
        resultElement.innerHTML = tableHead + tableBody + tableFoot;
        $('#dataTable1').DataTable(
            {"order": [[ 1, "desc" ]]}
        );
    })
    .catch(function (error) {
        console.log(error);
    });
    }

    function getUnityAssets() {

    }
    function returnMidis() {
        const midi = "<option>none</option>" +
            "<option>arabescu</option>" +
            "<option>astrixchaos</option>" +
            "<option>atavachron</option>" +
            "<option>bb_igalactic</option>" +
            "<option>bbw772</option>" +
            "<option>bbw773</option>" +
            "<option>bbw774</option>" +
            "<option>brandenburg5</option>" +
            "<option>dansemacabre</option>" +
            "<option>divinemadness</option>" +
            "<option>dsharp_progression1</option>" +
            "<option>funeralmusic</option>" +
            "<option>reflect</option>" +
            "<option>rocksuperstar</option>" +
            "<option>tanhauser</option>" +
            "<option>thesorcerer</option>" +
            "<option>yellowRoseOfTexas</option>";
        return midi;
    }
    function returnGLTFs() {
        console.log("tryna fetch gltfs");
        axios.get('/gltf/' + userid)
        .then(function (response) {
            // console.log(JSON.stringify(response.data.gltfItems));
            return response.data.gltfItems;
        }) //end of main fetch
        .catch(function (error) {
        console.log(error);
            return error;
        });
    }
    function returnObjectTypes(selectedType) {
        console.log("tryna select type " + selectedType);
        let types = "";
        const typesArray = [
        "none",
        "placeholder",
        "callout",
        "target",
        "track face",
        "player spawn",
        "character spawn",
        "waypoint",
        "poi",
        "gltf",
        "car",
        "hotspot",
        "callouthotspot",
        "gatehotspot",
        "spawnhotspot",
        "videohotspot",
        "youtubehotspot",
        "picturehotspot",
        "audiohotspot",
        "availablescenes",
        "nextscene",
        "previousscene",
        "audio",
        "picture",
        "video",
        "youtube",
        "text",
        "textbook",
        "picturebook",
        "link",
        "mailbox",
        "character",
        "pickup",
        "drop",
        "collectible",
        "media",
        "equip - beam",
        "equip - shoot",
        "equip - throw",
        "equip - hit",
        "equip - teleport",
        "equip - consume",
        "callout",
        "lerp",
        "slerp",
        "gate",
        "spawntrigger",
        "light",
        "particlesystem",
        "spawn",
        "flyer",
        "walker"];
        for (let i = 0; i < typesArray.length; i++) {
            if (typesArray[i] == selectedType) {
                types = types +
                "<option selected>" + typesArray[i] + "</option>";
            } else {
                types = types +
                "<option>" + typesArray[i] + "</option>";
            }
        }

        // const types = "<option>hotspot</option>" +
        //     "<option>callouthotspot</option>" +
        //     "<option>gatehotspot</option>" +
        //     "<option>spawnhotspot</option>" +
        //     "<option>videohotspot</option>" +
        //     "<option>youtubehotspot</option>" +
        //     "<option>picturehotspot</option>" +
        //     "<option>audiohotspot</option>" +
        //     "<option>key</option>" +
        //     "<option>audio</option>" +
        //     "<option>picture</option>" +
        //     "<option>movie</option>" +
        //     "<option>youtube</option>" +
        //     "<option>text</option>" +
        //     "<option>textbook</option>" +
        //     "<option>picturebook</option>" +
        //     "<option>link</option>" +
        //     "<option>mailbox</option>" +
        //     "<option>character</option>" +
        //     "<option>pickup</option>" +
        //     "<option>drop</option>" +
        //     "<option>collectible</option>" +
        //     "<option>media</option>" +
        //     "<option>equip - beam</option>" +
        //     "<option>equip - shoot</option>" +
        //     "<option>equip - throw</option>" +
        //     "<option>equip - hit</option>" +
        //     "<option>equip - teleport</option>" +
        //     "<option>equip - consume</option>" +
        //     "<option>callout</option>" +
        //     "<option>lerp</option>" +
        //     "<option>slerp</option>" +
        //     "<option>gate</option>" +
        //     "<option>spawntrigger</option>" +
        //     "<option>light</option>" +
        //     "<option>particlesystem</option>" +
        //     "<option>spawn</option>" +
        //     "<option>flyer</option>" +
        //     "<option>walker</option>";

        return types;
    }
    function returnPatches () {
        const patches = "<option>none</option>" +
        "<option>Arp/CM Kleer Arp</option>" +
        "<option>Arp/CM Tremolo</option>" +
        "<option>Arp/COA Running Toy</option>" +
        "<option>Arp/MT On the Run</option>" +
        "<option>Arp/OZ Prarie Arp</option>" +
        "<option>Arp/SF Arp 1</option>" +
        "<option>Arp/SF Arp 2</option>" +
        "<option>Bass/CM Diddly</option>" +
        "<option>Bass/CM Electro Bass</option>" +
        "<option>Bass/CM Grit Bass</option>" +
        "<option>Bass/CM Subsine</option>" +
        "<option>Bass/COA Hard Bass 1</option>" +
        "<option>Bass/COA Hard Bass 10</option>" +
        "<option>Bass/COA Hard Bass 11</option>" +
        "<option>Bass/COA Hard Bass 2</option>" +
        "<option>Bass/COA Hard Bass 3</option>" +
        "<option>Bass/COA Hard Bass 4</option>" +
        "<option>Bass/COA Hard Bass 5</option>" +
        "<option>Bass/COA Hard Bass 6</option>" +
        "<option>Bass/COA Hard Bass 7</option>" +
        "<option>Bass/COA Hard Bass 8</option>" +
        "<option>Bass/COA Hard Bass 9</option>" +
        "<option>Bass/COA Killer Chipsound Pluck 1</option>" +
        "<option>Bass/COA Killer Chipsound Pluck 2</option>" +
        "<option>Bass/COA Scary Rotten DNB</option>" +
        "<option>Bass/COA Stab Bass Vocal Sound</option>" +
        "<option>Bass/COA Stab Bass</option>" +
        "<option>Bass/COA Sub-Layer for Trap Kick 1</option>" +
        "<option>Bass/COA Sub-Layer for Trap Kick 2</option>" +
        "<option>Bass/COA Sub-Layer for Trap Kick 3</option>" +
        "<option>Bass/COA Sub-Layer for Trap Kick 4</option>" +
        "<option>Bass/COA Sub-Layer for Trap Kick 5</option>" +
        "<option>Bass/COA Terror Bass 1</option>" +
        "<option>Bass/COA Terror Bass 2</option>" +
        "<option>Bass/COA Terror Bass 3</option>" +
        "<option>Bass/COA Terror Bass 4</option>" +
        "<option>Bass/COA Timpani Digital Bass</option>" +
        "<option>Bass/COA Trap Bass 1</option>" +
        "<option>Bass/COA Trap Bass 2</option>" +
        "<option>Bass/COA Trap Bass 3</option>" +
        "<option>Bass/COA Trap Bass 4</option>" +
        "<option>Bass/COA Trap Bass 5</option>" +
        "<option>Bass/COA Trap Bass 6</option>" +
        "<option>Bass/COA Trap Bass 7</option>" +
        "<option>Bass/COA Trap Bass 8</option>" +
        "<option>Bass/COA Trap Bass 9</option>" +
        "<option>Bass/MT Cracklette</option>" +
        "<option>Bass/MT Filtered Bass 1</option>" +
        "<option>Bass/MT Filtered Bass 2</option>" +
        "<option>Bass/MT Spectrum</option>" +
        "<option>Bass/MT Stinky Bass 1</option>" +
        "<option>Bass/MT Stinky Bass 2</option>" +
        "<option>Bass/MT Stinky Bass 3</option>" +
        "<option>Bass/SF Bass Formant</option>" +
        "<option>Bass/SF Bass Picked</option>" +
        "<option>Bass/SF Bass</option>" +
        "<option>Bass/SF Contrabass</option>" +
        "<option>Bass/SF Double Bass</option>" +
        "<option>Bass/UG Can't Afford the Real, You Know</option>" +
        "<option>Bass/UG FM ON and On</option>" +
        "<option>Bass/UG Lately I've Been Using This Bass</option>" +
        "<option>Bass/UG Liebe Ist Moog</option>" +
        "<option>Bass/UG Major Orbits</option>" +
        "<option>Bass/UG Old Minis Drift</option>" +
        "<option>Bass/UG One Note Acid (Draw MIDI)</option>" +
        "<option>Bass/UG Please Hold for Techno</option>" +
        "<option>Bass/UG Ravers Unite!</option>" +
        "<option>Bass/UG Show Me the M1</option>" +
        "<option>Bass/UG Taiko Attacks Bass (Try Vel=74)</option>" +
        "<option>Bass/UG Who Plays the Doctor</option>" +
        "<option>Chip/COA Insane Gamer</option>" +
        "<option>Chip/COA Random Chip Bass</option>" +
        "<option>Chip/MT Bounce</option>" +
        "<option>Chip/MT Chip Waltz</option>" +
        "<option>Chip/MT Easy Vibrato</option>" +
        "<option>Chip/MT Octaves</option>" +
        "<option>Chip/MT Punch</option>" +
        "<option>Chip/MT Wind Up</option>" +
        "<option>Harsh/CM Hard (Style)</option>" +
        "<option>Harsh/CM Skreech Bass</option>" +
        "<option>Harsh/CM Ugly Mess</option>" +
        "<option>Keys/CM Bells</option>" +
        "<option>Keys/CM Pluck Time</option>" +
        "<option>Keys/CM Xylo</option>" +
        "<option>Keys/COA 90 Videogame Pluck</option>" +
        "<option>Keys/COA Alien Ocarina 1</option>" +
        "<option>Keys/COA Alien Ocarina 2</option>" +
        "<option>Keys/COA Broken Digital Organ</option>" +
        "<option>Keys/COA Pluck Digital String 1</option>" +
        "<option>Keys/COA Pluck Digital String 2</option>" +
        "<option>Keys/COA Pluck Digital String 3</option>" +
        "<option>Keys/COA Plucked Digital String</option>" +
        "<option>Keys/COA Post Funk Keys 1</option>" +
        "<option>Keys/COA Post Funk Keys 2</option>" +
        "<option>Keys/COA Steampunk Phantom of the Opera</option>" +
        "<option>Keys/MIDI Demo</option>" +
        "<option>Keys/MT Bouncy Balls</option>" +
        "<option>Keys/MT Duper Saw</option>" +
        "<option>Keys/MT Eighties Science Movie</option>" +
        "<option>Keys/MT Organ 1</option>" +
        "<option>Keys/MT Organ 2</option>" +
        "<option>Keys/MT Striking Discovery</option>" +
        "<option>Keys/MT Stuttering Organ</option>" +
        "<option>Keys/MT Toy Piano</option>" +
        "<option>Keys/Not the M1</option>" +
        "<option>Keys/OZ Drifter 1</option>" +
        "<option>Keys/OZ Drifter 2</option>" +
        "<option>Keys/OZ Drifter 3</option>" +
        "<option>Keys/OZ Homebase</option>" +
        "<option>Keys/OZ Natures Best</option>" +
        "<option>Keys/OZ Portamento One</option>" +
        "<option>Keys/OZ Prarie</option>" +
        "<option>Keys/OZ Skewd with Noise</option>" +
        "<option>Keys/OZ Skewd</option>" +
        "<option>Keys/SF Brass CC2 A</option>" +
        "<option>Keys/SF Brass CC2</option>" +
        "<option>Keys/SF Brass Soft Stutter</option>" +
        "<option>Keys/SF Brass Soft</option>" +
        "<option>Keys/SF Celesta</option>" +
        "<option>Keys/SF Formant 1</option>" +
        "<option>Keys/SF Formant 2</option>" +
        "<option>Keys/SF Piano 1</option>" +
        "<option>Keys/SF Piano 2</option>" +
        "<option>Keys/SF Piano 3</option>" +
        "<option>Keys/SF Piano 4</option>" +
        "<option>Keys/SF Piano Tremolo 1</option>" +
        "<option>Keys/SF Piano Tremolo 2</option>" +
        "<option>Keys/UG I Prepared a Piano for You</option>" +
        "<option>Keys/UG I Want to Move to Canada</option>" +
        "<option>Keys/UG Old Organs Have Their Charms</option>" +
        "<option>Keys/UG Steve Reich Playing 5 Notes</option>" +
        "<option>Keys/UG Synths Can Sing Too</option>" +
        "<option>Keys/UG Your Next Chiptune Track</option>" +
        "<option>Lead/CM Hoboe</option>" +
        "<option>Lead/CM Monstah Lead</option>" +
        "<option>Lead/CM Super(er) Saw</option>" +
        "<option>Lead/CM Supersaw Gate</option>" +
        "<option>Lead/CM Supersaw</option>" +
        "<option>Lead/COA Acid Distorted Lead</option>" +
        "<option>Lead/COA Alien Lead Guitar</option>" +
        "<option>Lead/COA Arabian Android Flute</option>" +
        "<option>Lead/COA Convolution</option>" +
        "<option>Lead/COA Digital Reflected Glass 1</option>" +
        "<option>Lead/COA Digital Reflected Glass 2</option>" +
        "<option>Lead/COA Digital Reflected Glass 3</option>" +
        "<option>Lead/COA Electro Bell</option>" +
        "<option>Lead/COA Hard Lead 1</option>" +
        "<option>Lead/COA Hard Lead 2</option>" +
        "<option>Lead/COA Hard Lead 3</option>" +
        "<option>Lead/COA Hard Terror Lead</option>" +
        "<option>Lead/COA Leadgun</option>" +
        "<option>Lead/COA Tension 1</option>" +
        "<option>Lead/COA Tension 2</option>" +
        "<option>Lead/COA Tension 3</option>" +
        "<option>Lead/COA Tension 4</option>" +
        "<option>Lead/COA Trumpet</option>" +
        "<option>Lead/COA Witchy Lead 1</option>" +
        "<option>Lead/COA Witchy Lead 2</option>" +
        "<option>Lead/COA Witchy Lead 3</option>" +
        "<option>Lead/COA Zap Hard</option>" +
        "<option>Lead/MT Formantish</option>" +
        "<option>Lead/OZ Freedom</option>" +
        "<option>Lead/OZ Gold</option>" +
        "<option>Lead/OZ Platinum Poly</option>" +
        "<option>Lead/OZ Platinum</option>" +
        "<option>Lead/OZ Silverrr</option>" +
        "<option>Lead/SF Brass_Portamento</option>" +
        "<option>Lead/SF Clarinet</option>" +
        "<option>Lead/SF Nasty</option>" +
        "<option>Lead/SF Pizz</option>" +
        "<option>Lead/UG Let's Build a Replicant</option>" +
        "<option>Lead/UG Psycho Marcatos</option>" +
        "<option>Lead/UG Reverb Is in Your Hands</option>" +
        "<option>Lead/UG Welcome to The Solo My Friend</option>" +
        "<option>Lead/UG Write More Tracks in Lydian</option>" +
        "<option>Pad/CM Epic</option>" +
        "<option>Pad/CM Soothing</option>" +
        "<option>Pad/CM Stars</option>" +
        "<option>Pad/COA Ambient Metallic</option>" +
        "<option>Pad/COA Broken Old Analog</option>" +
        "<option>Pad/COA Crispy Pad Organ</option>" +
        "<option>Pad/COA Digital Enigma</option>" +
        "<option>Pad/COA Digital Wind Ensemble 1</option>" +
        "<option>Pad/COA Digital Wind Ensemble 2</option>" +
        "<option>Pad/COA Hard Brass Synth Ensemble</option>" +
        "<option>Pad/COA Lofi Soft Pad 1</option>" +
        "<option>Pad/COA Lofi Soft Pad 2</option>" +
        "<option>Pad/COA Lofi Soft Pad 3</option>" +
        "<option>Pad/COA Pulsating Pad</option>" +
        "<option>Pad/COA Resonant Pad</option>" +
        "<option>Pad/COA Sad Scifi Strings 1</option>" +
        "<option>Pad/COA Sad Scifi Strings 2</option>" +
        "<option>Pad/COA Sad Scifi Strings 3</option>" +
        "<option>Pad/COA Scifi Interference</option>" +
        "<option>Pad/COA Soft Neo Church Organ</option>" +
        "<option>Pad/COA Soft Scifi Pad 1</option>" +
        "<option>Pad/COA Soft Scifi Pad 2</option>" +
        "<option>Pad/COA Soft Scifi Pad 3</option>" +
        "<option>Pad/COA Soft Scifi Pad 4</option>" +
        "<option>Pad/COA Soft Scifi Pad 5</option>" +
        "<option>Pad/COA Soft Scifi Pad 6</option>" +
        "<option>Pad/MT Chamber Chatter</option>" +
        "<option>Pad/MT Electrobike Cruise</option>" +
        "<option>Pad/MT Fluffy Landscape</option>" +
        "<option>Pad/MT Hypnotizing Pulse</option>" +
        "<option>Pad/MT Pulsing Daisies</option>" +
        "<option>Pad/MT Stuck in the Basement</option>" +
        "<option>Pad/MT Talk Radio</option>" +
        "<option>Pad/MT Waiting for Takeoff</option>" +
        "<option>Pad/MT Wandering Lost</option>" +
        "<option>Pad/MT Watching the Clock</option>" +
        "<option>Pad/SF Mandolin</option>" +
        "<option>Pad/SF OSC 2</option>" +
        "<option>Pad/SF Soft Pulse 1</option>" +
        "<option>Pad/SF Soft Pulse 2</option>" +
        "<option>Pad/UG Aren't You Bored with SAW+LPF</option>" +
        "<option>Pad/UG Chorales in Space</option>" +
        "<option>Pad/UG Her Skin Was So Soft</option>" +
        "<option>Pad/UG I Dream of Antarctica</option>" +
        "<option>Pad/UG No String Machine Can Do This</option>" +
        "<option>Pad/UG Obi-Wan Will Help You</option>" +
        "<option>Pad/UG The Earth Pulses with Music</option>" +
        "<option>Percussion/CM House Pluck</option>" +
        "<option>Percussion/CM Lo-Fi Pluck</option>" +
        "<option>Percussion/COA Broken Digital Snare</option>" +
        "<option>Percussion/COA Cinematic Hit</option>" +
        "<option>Percussion/COA Closed Hat</option>" +
        "<option>Percussion/COA Dark Perc 1</option>" +
        "<option>Percussion/COA Dark Perc 2</option>" +
        "<option>Percussion/COA Electro Clsd HH</option>" +
        "<option>Percussion/COA Electro Crash Ride</option>" +
        "<option>Percussion/COA Electro Kick 1</option>" +
        "<option>Percussion/COA Electro Kick 2</option>" +
        "<option>Percussion/COA Electro Kick 3</option>" +
        "<option>Percussion/COA Electro Kick 4</option>" +
        "<option>Percussion/COA Electro Metal Perc 1</option>" +
        "<option>Percussion/COA Electro Metal Perc 2</option>" +
        "<option>Percussion/COA Electro Open HH</option>" +
        "<option>Percussion/COA Electro Semiopen HH</option>" +
        "<option>Percussion/COA Electro Tom 1</option>" +
        "<option>Percussion/COA Electro Tom 2</option>" +
        "<option>Percussion/COA Fat HH Clsd</option>" +
        "<option>Percussion/COA Kung Fu Crash</option>" +
        "<option>Percussion/COA Kung Fu Fight Crash</option>" +
        "<option>Percussion/COA Pluck Tom</option>" +
        "<option>Percussion/COA Toy Snare 1</option>" +
        "<option>Percussion/COA Toy Snare 2</option>" +
        "<option>Percussion/OZ Bass 1</option>" +
        "<option>Percussion/OZ Hat 1</option>" +
        "<option>Percussion/OZ Hat 2</option>" +
        "<option>Percussion/OZ Kick 1</option>" +
        "<option>Percussion/OZ Kick 2</option>" +
        "<option>Percussion/OZ Snare 1</option>" +
        "<option>Percussion/OZ Some Kind of Percussion</option>" +
        "<option>Percussion/OZ Some Kinda Dubby Cycle</option>" +
        "<option>Percussion/OZ Some Kinda Stab</option>" +
        "<option>Percussion/SF AD2 4 Toms</option>" +
        "<option>Percussion/SF Cowbell 1</option>" +
        "<option>Percussion/SF Cowbell 2</option>" +
        "<option>Percussion/SF HH High</option>" +
        "<option>Percussion/SF HH Low Eco 1</option>" +
        "<option>Percussion/SF HH Low Eco 2</option>" +
        "<option>Percussion/SF HH Low</option>" +
        "<option>Percussion/SF HH Silver</option>" +
        "<option>Percussion/SF Horse 1</option>" +
        "<option>Percussion/SF Horse 2</option>" +
        "<option>Percussion/SF Kick 1</option>" +
        "<option>Percussion/SF Kick 2</option>" +
        "<option>Percussion/SF Kick 3</option>" +
        "<option>Percussion/SF Nocky</option>" +
        "<option>Percussion/SF Snare 1</option>" +
        "<option>Percussion/SF Snare 2</option>" +
        "<option>Percussion/SF Snare 3</option>" +
        "<option>Percussion/SF Snare 4</option>" +
        "<option>Percussion/SF Snare Brush</option>" +
        "<option>Percussion/SF Tom 1</option>" +
        "<option>Percussion/SF Tom 2</option>" +
        "<option>Percussion/SF Tom 3</option>" +
        "<option>Percussion/SF Toms Nock 1</option>" +
        "<option>Percussion/SF Toms Nock 2</option>" +
        "<option>SFX/CM Downfall</option>" +
        "<option>SFX/CM Riser</option>" +
        "<option>SFX/COA Alien Creature Crying</option>" +
        "<option>SFX/COA Alien Radio Interferences</option>" +
        "<option>SFX/COA Another Angry Robot</option>" +
        "<option>SFX/COA Chiptune Automatic Gun 1</option>" +
        "<option>SFX/COA Chiptune Automatic Gun 2</option>" +
        "<option>SFX/COA Digital Cello Arp</option>" +
        "<option>SFX/COA Digital Waterdrops</option>" +
        "<option>SFX/COA Lasersword</option>" +
        "<option>SFX/COA Satan in Your Headphones 1</option>" +
        "<option>SFX/COA Satan in Your Headphones 2</option>" +
        "<option>SFX/COA Scifi Gunshot</option>" +
        "<option>SFX/COA Sinister Ambient 1</option>" +
        "<option>SFX/COA Sinister Ambient 2</option>" +
        "<option>SFX/MT Elven Door Stop</option>" +
        "<option>SFX/MT Game Show Clock</option>" +
        "<option>SFX/MT Glitch Power</option>" +
        "<option>SFX/MT Powering On 1</option>" +
        "<option>SFX/MT Powering On 2</option>" +
        "<option>SFX/MT Pulse Alarm</option>" +
        "<option>SFX/MT Rotary Slingshot</option>" +
        "<option>SFX/SF Stutter Teeth</option>" +
        "<option>SFX/SF Whistle 1</option>" +
        "<option>SFX/SF Whistle 2</option>" +
        "<option>SFX/SF Whistle 3</option>" +
        "<option>SFX/SF Wind</option>" +
        "<option>SFX/UG Krell Are Among Us</option>" +
        "<option>SFX/UG Self-Destruct in 5 Minutes</option>";
        return patches;
    }
    function showObject(response) {
        console.log(JSON.stringify(response));
        let tagsHtml = "";
        let tags = [];
        let textID = "";
        let gltfSelect = "";
        if (response.data.textitemID != undefined) {
            textID = response.data.textitemID;
        }
        let picID = "";
        if (response.data.pictureitemID != undefined) {
            picID = response.data.pictureitemID;
        }
        let audioID = "";
        if (response.data.audioitemID != undefined) {
            audioID = response.data.audioitemID;
        }
        let textgrID = "";
        if (response.data.textgroupID != undefined) {
            textgrID = response.data.textgroupID;
        }
        let picgrID = "";
        if (response.data.picturegroupID != undefined) {
            picgrID = response.data.picturegroupID;
        }
        let audiogrID = "";
        if (response.data.audiogroupID != undefined) {
            audiogrID = response.data.audiogroupID;
        }

        let assetName = response.data.assetname != undefined ? response.data.assetname : "";
        let assetID = response.data.assetID != undefined ? response.data.assetID : "";
        let label = response.data.labeltext != undefined ? response.data.labeltext : "";
        let title = response.data.title != undefined ? response.data.title : "";
        let sNotes = response.data.synthNotes != undefined ? response.data.synthNotes : "";
        let sDuration = response.data.synthDuration != undefined ? response.data.synthDuration : "";
        let ival = response.data.intval != undefined ? response.data.intval : "";
        let fval = response.data.floatval != undefined ? response.data.floatval : "";
        let sval = response.data.stringval != undefined ? response.data.stringval : "";
        let desc = response.data.description != undefined ? response.data.description : "";
        let event_data = response.data.eventdata != undefined ? response.data.eventdata : "";
        let maxperscene = response.data.maxPerScene != undefined ? response.data.maxPerScene : "";
        let objscale = response.data.objScale != undefined ? response.data.objScale : "";
        let speedfactor = response.data.speedFactor != undefined ? response.data.speedFactor : "";
        let itemPics = "<div class=\x22row\x22>";
        if (response.data.objectPictures != undefined && response.data.objectPictures != null && response.data.objectPictures.length > 0 ) {
        for (let i = 0; i < response.data.objectPictures.length; i++) {
            itemPics = itemPics +
            "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                "<img class=\x22card-img-top\x22 src=\x22" + response.data.objectPictures[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                "<div class=\x22card-img-overlay\x22>" +
                "<button type=\x22button\x22 class=\x22btn btn-sm btn-danger float-right\x22 onclick=\x22removeItem('app','picture','" + response.data._id + "','" + response.data.objectPictures[i]._id + "')\x22>Remove</button>" +
                "</div>" +
            "</div>";
            }
        itemPics = itemPics +  "</div>";
        }
        $("#pageTitle").html("Object Details");
        extraButtons = "<a href=\x22#\x22 id=\x22deleteButton\x22 class=\x22btn btn-danger btn-sm float-left\x22 onclick=\x22deleteItem('object','" + response.data._id + "')\x22>Delete Object</a>" +
        "<a class=\x22btn btn-primary btn-sm float-right\x22 href=\x22index.html?type=pictures&mode=select&parent=object&iid=" + response.data._id + "\x22>Add Object Pic</a>";
        let card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                    "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Object Details - "+ response.data.name +" | _id: "+ response.data._id +"</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                    "<form id=\x22updateObjectForm\x22>" +
                    "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button>" + //Create vs Update
                    // "<button class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22 data-toggle=x22collapse\x22 data-target=\x22#OptionsSection\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                    // "<h4>Options</h4>" +
                    // "<hr/>" +
                    "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22objname\x22>Object Name</label>" + //name
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22objname\x22 placeholder=\x22Object Name\x22 value=\x22" + response.data.name + "\x22 required>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22objtitle\x22>Object Title</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22objtitle\x22 placeholder=\x22Object Title\x22 value=\x22" + title + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22objtype\x22>Object Type</label>" + //type
                            "<select class=\x22form-control\x22 id=\x22objtype\x22 required>" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>hotspot</option>" +
                                "<option>callouthotspot</option>" +
                                "<option>gatehotspot</option>" +
                                "<option>spawnhotspot</option>" +
                                "<option>videohotspot</option>" +
                                "<option>youtubehotspot</option>" +
                                "<option>picturehotspot</option>" +
                                "<option>audiohotspot</option>" +
                                "<option>key</option>" +
                                "<option>audio</option>" +
                                "<option>picture</option>" +
                                "<option>video</option>" +
                                "<option>youtube</option>" +
                                "<option>text</option>" +
                                "<option>textbook</option>" +
                                "<option>picturebook</option>" +
                                "<option>link</option>" +
                                "<option>mailbox</option>" +
                                "<option>character</option>" +
                                "<option>pickup</option>" +
                                "<option>drop</option>" +
                                "<option>collectible</option>" +
                                "<option>media</option>" +
                                "<option>equip - beam</option>" +
                                "<option>equip - shoot</option>" +
                                "<option>equip - throw</option>" +
                                "<option>equip - hit</option>" +
                                "<option>equip - teleport</option>" +
                                "<option>equip - consume</option>" +
                                "<option>callout</option>" +
                                "<option>lerp</option>" +
                                "<option>slerp</option>" +
                                "<option>gate</option>" +
                                "<option>spawntrigger</option>" +
                                "<option>light</option>" +
                                "<option>particlesystem</option>" +
                                "<option>spawn</option>" +
                                "<option>flyer</option>" +
                                "<option>walker</option>" +
                                "</select>" +
                        "</div>" +

                    "</div>" +
                    "<div class=\x22form-row\x22>" +    
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22assetname\x22>Asset Name</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22assetname\x22 placeholder=\x22Asset Name\x22 value=\x22" + assetName + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22assetID\x22>Asset ID</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22assetID\x22 placeholder=\x22Asset ID\x22 value=\x22" + assetID + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22 id=\x22gltfObjects\x22>" +
                            "<label for=\x22\x22>GLTF Assets: </label>" + 
                                "<select class=\x22form-control\x22 id=\x22gltfSelect\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select : </option>" +
                                    gltfSelect +
                                "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                        "<label for=\x22assettype\x22>Asset Type</label>" +
                        "<select class=\x22form-control\x22 id=\x22assettype\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>Unity</option>" +
                            "<option>.OBJ</option>" +
                            "<option>.GLB</option>" +
                            "<option>Primitive Cube</option>" +
                            "<option>Primative Sphere</option>" +
                            "<option>Primative Capsule</option>" +
                            "</select>" +
                        "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" + 
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22interaction\x22>Interaction</label>" +
                            "<select class=\x22form-control\x22 id=\x22interaction\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>click</option>" +
                                "<option>trigger enter</option>" +
                                "<option>collision enter</option>" +
                                "<option>any</option>" +
                                "<option>none</option>" +
                            "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22eventtype\x22>Event Type</label>" +
                            "<select class=\x22form-control\x22 id=\x22eventtype\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>none</option>" +
                                "<option>scene link (shortcode/title)</option>" +
                                "<option>web link (url)</option>" +
                                "<option>teleport (vector3)</option>" +
                                "<option>next scene</option>" +
                                "<option>previous scene</option>" +
                                "<option>next item</option>" +
                                "<option>previous item</option>" +
                                "<option>play</option>" +
                                "<option>play and go</option>" +
                                "<option>equip</option>" +
                                "<option>collect</option>" +
                                "<option>damage<option>" +
                            "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22eventdata\x22>Event Data</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22eventdata\x22 placeholder=\x22Enter Event Data\x22 value=\x22" + event_data + "\x22 >" +
                        "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22labeltext\x22>Label / Callout</label>" +
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22labeltext\x22 placeholder=\x22Enter Label/Callout\x22 value=\x22" + label + "\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22highlight\x22>Highlight Options</label>" +
                            "<select class=\x22form-control\x22 id=\x22highlight\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>glow</option>" +
                            "<option>showchildren</option>" +
                            "<option>emit</option>" +
                            "<option>none</option>" +
                            "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" +
                            "<label for=\x22callout\x22>Callout Options</label>" +
                            "<select class=\x22form-control\x22 id=\x22callout\x22 >" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            "<option>fixed</option>" +
                            "<option>flying</option>" +
                            "<option>thought bubble</option>" +
                            "<option>speech bubble</option>" +
                            "<option>none</option>" +
                            "</select>" +
                        "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                        "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22maxPerScene\x22>Max / Scene</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22maxPerScene\x22 placeholder=\x221\x22 value=\x22" + maxperscene + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22speedFactor\x22>Speed Factor</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22speedFactor\x22 placeholder=\x221\x22 value=\x22" + speedfactor + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22objScale\x22>Scale Factor</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22objScale\x22 placeholder=\x221\x22 value=\x22" + objscale + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22intval\x22>Int Value(s)</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22intval\x22 placeholder=\x221\x22 value=\x22" + ival + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22floatval\x22>Float Value(s)</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22floatval\x22 placeholder=\x221\x22 value=\x22" + fval + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-3\x22>" + 
                                "<label for=\x22stringval\x22>String Value</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22stringval\x22 placeholder=\x221\x22 value=\x22" + sval + "\x22 >" +
                            "</div>" +
                        "</div>" + 
                        "<div class=\x22form-row\x22>" +    
                        "<div class=\x22col form-group col-md-4\x22>" +
                            "<label for=\x22description\x22>Object Description</label>" + //desc
                            "<textarea class=\x22form-control\x22 id=\x22description\x22 placeholder=\x22Give a full description of the scene\x22>" + desc + "</textarea>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-4\x22>" +
                        "<label for=\x22objTags\x22>Tags</label><br>" + //Tags
                            "<div class=\x22input-group\x22>" +
                                "<div class=\x22input-group-prepend\x22>" +
                                "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                                "</div>" +
                                "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                                "<div id=\x22tagDisplay\x22>" +
                                tagsHtml +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +    
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22scatterToggle\x22>Scatter</label><br>" + 
                                "<input class=\x22float-right\x22 type=\x22checkbox\x22 id=\x22scatterToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22spawnableToggle\x22>User Spawnable</label><br>" + //Sub/Not
                                "<input type=\x22checkbox\x22  id=\x22spawnableToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22randomColorToggle\x22>Random Color</label><br>" + //HPlanes
                                "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22randomColorToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22audioScale\x22>Audio Scale</label><br>" + //HPlanes
                                "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22audioScale\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22audioEmit\x22>Audio Emit</label><br>" + //HPlanes
                                "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22audioEmit\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +    
                            "<div class=\x22col form-group col-md-3\x22>" +
                                "<label for=\x22synthPatchSelect\x22>Synth Patch</label>" +
                                "<select class=\x22form-control\x22 id=\x22synthPatchSelect\x22>" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                returnPatches() +
                                "</select>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22synthNotes\x22>Notes(s)</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22synthNotes\x22 placeholder=\x221\x22 value=\x22" + sNotes + "\x22>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22synthDuration\x22>Duration</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22synthDuration\x22 placeholder=\x221\x22 value=\x22" + sDuration + "\x22>" +
                            "</div>" +
                        "</div>" +
 
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22> " +
                                "<label for=\x22highlightColor\x22>Highlight Color</label>" + //sceneText
                                "<input id=\x22highlightColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22> " +
                                "<label for=\x22color1\x22>Color #1</label>" + //sceneText
                                "<input id=\x22color1\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22> " +
                                "<label for=\x22color2\x22>Color #2</label>" + //sceneText
                                "<input id=\x22color2\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                            "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22textitemID\x22>Text Item</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22textitemID\x22 value=\x22" + textID + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22pictureitemID\x22>Picture Item</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22pictureitemID\x22 value=\x22" + picID + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22audioitemID\x22>Audio Item</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audioitemID\x22 value=\x22" + audioID + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22textgroupID\x22>Text Group</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22textgroupID\x22 value=\x22" + textgrID + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22picturegroupID\x22>Picture Group</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22picturegroupID\x22 value=\x22" + picgrID + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" + 
                                "<label for=\x22audiogroupID\x22>Audio Group</label>" + 
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22audiogroupID\x22 value=\x22" + audiogrID + "\x22 >" +
                            "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22colliderScale\x22>Collider Scale</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22colliderScale\x22 placeholder=\x221\x22 value=\x22" + response.data.colliderScale + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22triggerScale\x22>Trigger Scale</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22triggerScale\x22 placeholder=\x221\x22 value=\x22" + response.data.triggerScale + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<label for=\x22collidertype\x22>Collider Type</label>" +
                                "<select class=\x22form-control\x22 id=\x22collidertype\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>none</option>" +
                                "<option>mesh</option>" +
                                "<option>sphere</option>" +
                                "<option>cube</option>" +
                                "<option>capsule</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22xoffset\x22>Collider Offset X</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22xoffset\x22 placeholder=\x220\x22 value=\x22" + response.data.xoffset + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22yoffset\x22>Collider Offset Y</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22yoffset\x22 placeholder=\x220\x22 value=\x22" + response.data.yoffset + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22zoffset\x22>Collider Offset Z</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22zoffset\x22 placeholder=\x220\x22 value=\x22" + response.data.zoffset + "\x22 >" +
                            "</div>" +
                        "</div>" +
                        "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22eulerx\x22>X Rotation</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulerx\x22 placeholder=\x221\x22 value=\x22" + response.data.eulerx + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22eulery\x22>Y Rotation</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulery\x22 placeholder=\x221\x22 value=\x22" + response.data.eulery + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22eulerz\x22>Z Rotation</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulerz\x22 placeholder=\x221\x22 value=\x22" + response.data.eulerz + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22rotationSpeed\x22>Rotation Speed</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22rotationSpeed\x22 placeholder=\x221\x22 value=\x22" + response.data.rotationSpeed + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" + 
                                "<label for=\x22yPosFudge\x22>Y Axis Fudge</label>" + 
                                "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22yPosFudge\x22 placeholder=\x221\x22 value=\x22" + response.data.yPosFudge + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<label for=\x22rotationaxis\x22>Rotation Axis</label>" +
                                "<select class=\x22form-control\x22 id=\x22rotationaxis\x22 >" +
                                "<option value=\x22\x22 disabled selected>Select:</option>" +
                                "<option>none</option>" +
                                "<option>x</option>" +
                                "<option>y</option>" +
                                "<option>z</option>" +
                                "<option>player</option>" +
                                "</select>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22randomRot\x22>Randomize Rotation</label><br>" + //Sub/Not
                                "<input type=\x22checkbox\x22  id=\x22randomRot\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22\x22><label for=\x22snapToGround\x22>Snap to Ground</label><br>" + //Sub/Not
                                "<input type=\x22checkbox\x22  id=\x22snapToGround\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                            "</div>" +
                        "</div>" +
                        extraButtons +
                    "</form><br><br>" +
                    itemPics +
                "</div>" +
                "</div>" +
            "</div>" +
            "<pre>"+ keyValues(response.data) +"</pre>";
            $("#cards").show();
            // $("#cardrow").html(itemPics);
            $("#cardrow").html(card);
            $("#gltfSelect").val(response.data.gltfAssetName);
            $("#objtype").val(response.data.objtype);
            $("#assettype").val(response.data.assettype);
            $("#eventtype").val(response.data.eventtype);
            $("#interaction").val(response.data.interaction);
            $("#highlight").val(response.data.highlight);
            $("#synthPatchSelect").val(response.data.synthPatch1);
            $("#collidertype").val(response.data.collidertype);
            $("#rotationaxis").val(response.data.rotationAxis);
            $("#callout").val(response.data.callout);
            $("#highlightColor").val(response.data.highlightColor);
            $("#color1").val(response.data.color1);
            $("#color2").val(response.data.color2);
            $("#scatterToggle").bootstrapToggle();
            if (response.data.scatter) {
                $('#scatterToggle').bootstrapToggle('on');
            }
            $("#spawnableToggle").bootstrapToggle();
            if (response.data.userspawnable) {
                $('#spawnableToggle').bootstrapToggle('on');
            }
            $("#randomColorToggle").bootstrapToggle();
            if (response.data.randomColor) {
                $('#randomColorToggle').bootstrapToggle('on');
            }
            $("#audioScale").bootstrapToggle();
            if (response.data.audioScale) {
                $('#audioScale').bootstrapToggle('on');
            }
            $("#audioEmit").bootstrapToggle();
            if (response.data.audioEmit) {
                $('#audioEmit').bootstrapToggle('on');
            }
            $("#randomRot").bootstrapToggle();
            if (response.data.randomRotation) {
                $('#randomRot').bootstrapToggle('on');
            }
            $("#snapToGround").bootstrapToggle();
            if (response.data.snapToGround) {
                $('#snapToGround').bootstrapToggle('on');
            }
            if (response.data.tags != null && response.data.tags.length > 0) {
                tags = response.data.tags;
                for (let i = 0; i < tags.length; i++) {
                    tagsHtml = tagsHtml + 
                    "<div class=\x22btn btn-light\x22>" +   
                        "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                        "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                    "</div>";
                }
                $("#tagDisplay").html(tagsHtml);
            };
            $(function() { 
                axios.get('/gltf/' + userid)
                .then(function (response) {
                    console.log("gltfs " + response);
                    const x = document.getElementById("gltfSelect");
                    for (let i = 0; i < response.data.gltfItems.length; i++) {
                        let nameSplit = response.data.gltfItems[i].name.split("_");
                        let name = nameSplit[1];
                        // let name = response.data.gltfItems[i].name;
                        var option = document.createElement("option"); 
                        // gltfSelect = gltfSelect + "<option>" + name + "</option>";
                        option.text = name;
                        if (name == "sceneAssetBundleName") {
                            // console.log("tryna select option for AssetBundleName " + name);
                            option.selected = true;
                        } 
                        console.log(response.data.gltfItems[i]);
                        x.add(option);
                        }
                    }) //end of main fetch
                    .catch(function (error) {
                        console.log(error);
                });

                $(document).on('click','#addTagButton',function(e){
                    e.preventDefault();  
                    let newTag = document.getElementById("addTagInput").value;
                    console.log("tryna add tag " + newTag);
                    if (newTag.length > 2) {
                    let html = "";
                    tags.push(newTag);
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                    }
                }); 
                $(document).on('click','.remTagButton',function(e){
                    e.preventDefault();  
                    console.log("tryna remove tag " + this.id);
                    let html = "";
                    for( var i = 0; i < tags.length; i++){ 
                        if ( tags[i] === this.id) {
                            tags.splice(i, 1); 
                        }
                        }
                    for (let i = 0; i < tags.length; i++) {
                        html = html + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+tags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+tags[i]+"\x22</span>" +
                        "</div>";
                    }
                    $("#tagDisplay").empty();
                    $("#tagDisplay").html(html);
                });
                $('#updateObjectForm').on('submit', function(e) { 
                    e.preventDefault();  
                    let name = document.getElementById("objname").value;
                    let title = document.getElementById("objtitle").value;
                    let objtype = document.getElementById("objtype").value;
                    let description = document.getElementById("description").value;
                    let interaction = document.getElementById("interaction").value;
                    let eventtype = document.getElementById("eventtype").value;
                    let eventdata = document.getElementById("eventdata").value;
                    let collidertype = document.getElementById("collidertype").value;
                    let highlight = document.getElementById("highlight").value;
                    let callout = document.getElementById("callout").value;
                    let intval = document.getElementById("intval").value;
                    let floatval = document.getElementById("floatval").value;
                    let stringval = document.getElementById("stringval").value;
                    let assetname = document.getElementById("assetname").value;
                    let assettype = document.getElementById("assettype").value;
                    let randomColor = $("#randomColorToggle").prop("checked");
                    let randomRotation = $("#randomRot").prop("checked");
                    let snapToGround = $("#snapToGround").prop("checked");
                    let scatter = $("#scatterToggle").prop("checked");
                    let userspawnable = $("#spawnableToggle").prop("checked");
                    let audioEmit = $("#audioEmit").prop("checked");
                    let audioScale = $("#audioScale").prop("checked");
                    let highlightColor = document.getElementById("highlightColor").value;
                    let color1 = document.getElementById("color1").value;
                    let color2 = document.getElementById("color2").value;
                    let xoffset = document.getElementById("xoffset").value;
                    let yoffset = document.getElementById("yoffset").value;
                    let zoffset = document.getElementById("zoffset").value;
                    let rotationAxis = document.getElementById("rotationaxis").value;
                    let rotationSpeed = document.getElementById("rotationSpeed").value;
                    let objScale = document.getElementById("objScale").value;
                    let maxPerScene = document.getElementById("maxPerScene").value;
                    let speedFactor = document.getElementById("speedFactor").value;
                    let colliderScale = document.getElementById("colliderScale").value;
                    let triggerScale = document.getElementById("triggerScale").value;
                    let yPosFudge = document.getElementById("yPosFudge").value;
                    let eulerx = document.getElementById("eulerx").value;
                    let eulery = document.getElementById("eulery").value;
                    let eulerz = document.getElementById("eulerz").value;
                    let labeltext = document.getElementById("labeltext").value;
                    let synthPatch1 = document.getElementById("synthPatchSelect").value;
                    let synthNotes = document.getElementById("synthNotes").value;                
                    let synthDuration = document.getElementById("synthDuration").value;
                    let textitemID = document.getElementById("textitemID").value;
                    let pictureitemID = document.getElementById("pictureitemID").value;
                    let audioitemID = document.getElementById("audioitemID").value;
                    let textgroupID = document.getElementById("textgroupID").value;
                    let picturegroupID = document.getElementById("picturegroupID").value;
                    let audiogroupID = document.getElementById("audiogroupID").value;

                    let data = {
                        name: name,
                        description: description,
                        objtype: objtype,
                        interaction: interaction != null ? interaction : "none",
                        eventtype: eventtype != null ? eventtype : "none",
                        eventdata: eventdata,
                        collidertype: collidertype != null ? collidertype : "none",
                        highlight: highlight != null ? highlight : "none",
                        callout: callout != null ? callout : "none",
                        tags: tags,
                        title: title,
                        // price: price != null ? price : 0,
                        intval: intval != null ? intval : 0,
                        floatval: floatval != null ? floatval : 0,
                        stringval: stringval != null ? stringval : "",
                        assetname: assetname,
                        assettype: assettype,
                        audioEmit: audioEmit != null ? audioEmit : false,
                        audioScale: audioScale != null ? audioScale : false,
                        randomColor: randomColor != null ? randomColor : false,
                        highlightColor: highlightColor,
                        color1: color1,
                        color2: color2,
                        snapToGround: snapToGround  != null ? snapToGround : false,
                        randomRotation: randomRotation != null ? randomRotation : false,
        //                objectScale: objectScale ? objectScale : 0,
                        xoffset: xoffset != null ? xoffset : 0,
                        yoffset: yoffset != null ? yoffset : 0,
                        zoffset: zoffset != null ? zoffset : 0,
                        rotationAxis: rotationAxis != null ? rotationAxis : 0,
                        rotationSpeed: rotationSpeed != null ? rotationSpeed : 0,
                        objScale: objScale != null ? objScale : 0,
                        maxPerScene: maxPerScene != null ? maxPerScene : 10,
                        speedFactor: speedFactor != null ? speedFactor : 3,
                        colliderScale: colliderScale != null ? colliderScale : 1,
                        triggerScale: triggerScale != null ? triggerScale : 1,
                        yPosFudge: yPosFudge != null ? yPosFudge : 0,
                        // yRotFudge: yRotFudge != null ? yRotFudge : 0,
                        eulerx: eulerx != null ? eulerx : "0",
                        eulery: eulery != null ? eulery : "0",
                        eulerz: eulerz != null ? eulerz : "0",
                        labeltext: labeltext,
                        scatter: scatter != null ? scatter : false,
                        // showcallout: showcallout != null ? showcallout : false,
                        // buyable: buyable != null ? buyable : false,
                        userspawnable: userspawnable != null ? userspawnable : false,
                        textitemID: textitemID != null ? textitemID : "",
                        pictureitemID: pictureitemID  != null ? pictureitemID : "",
                        audioitemID: audioitemID != null ? audioitemID : "",
                        textgroupID: textgroupID != null ? textgroupID : "",
                        picturegroupID: picturegroupID != null ? picturegroupID : "",
                        audiogroupID: audiogroupID != null ? audiogroupID : "",
                        synthPatch1: synthPatch1 != null ? synthPatch1 : "",
                        synthNotes: synthNotes != null ? synthNotes : "",
                        synthDuration: synthDuration != null ? synthDuration : ""
                        // _id : response.data._id
                        // childObjectIDs: childObjectIDs
                    };
                    $.confirm({
                        title: 'Confirm Object Update',
                        content: 'Are you sure you want to change the object?',
                        buttons: {
                        confirm: function () {
                            console.log("data: " + data)
                            axios.post('/update_obj/' + response.data._id,  data)
                                .then(function (response) {
                                    console.log(response);
                                    if (response.data.includes("updated")) {
                                        $("#topSuccess").html("Object Updated!");
                                        $("#topSuccess").show();
                                    } else if (response.data.includes("created")) {
                                        window.location.reload();
                                    } else {
                                        $("#topAlert").html(response.data);
                                        $("#topAlert").show();
                                    }
                                })                      
                                .catch(function (error) {
                                    console.log(error);
                                });
                            },
                            cancel: function () {
                                $("#topAlert").html("Update cancelled");
                                $("#topAlert").show();
                            },
                        }
                    });
            });
        });
    }

    function getObject(objid) {
        let config = { headers: {
            appid: appid,
            }
        }
        let data = {};
        if (objid != 'new') {
            axios.get('/userobj/' + objid)
            .then(function (response) {
                // console.log(response);
                showObject(response);
            }) //end of main fetch
            .catch(function (error) {
            console.log(error);
            });
        } else {
            let response = {};
            let data = {};
            // (response.data); //send empty to make a new one
        }
    }
    function newObject() {
        $("#cards").show();
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Create New Object</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<form id=\x22newObjectForm\x22>" +
                "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>Create</button>" + 
                    "<div class=\x22form-row\x22>" +
                    
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22objname\x22>Object Name</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22objname\x22 required>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22objtitle\x22>Object Title</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22objtitle\x22 >" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-6\x22>" + 
                            "<label for=\x22objdesc\x22>Object Description</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22objdesc\x22 >" +
                        "</div>" +
                    "</div>" +
                "</div>" +
                "</form>" +
            "</div>";
        $("#cardrow").html(card);
        $(function() { //shorthand document.ready function
            $('#newObjectForm').on('submit', function(e) { 
                e.preventDefault();  
                let objname = document.getElementById("objname").value;
                let objtitle = document.getElementById("objtitle").value;
                let objdesc = document.getElementById("objdesc").value;
                let data = {
                    name: objname,
                    title: objtitle,
                    description: objdesc
                }
                $.confirm({
                    title: 'Confirm Object Create',
                    content: 'Are you sure you want to create an new Object?',
                    buttons: {
                    confirm: function () {
                        axios.post(/newobj/, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("created")) {
                                    window.location.reload();
                                    $("#topSuccess").html("New Object Created!");
                                    $("#topSuccess").show();
                                } else {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                            });
                        },
                        cancel: function () {
                            $("#topAlert").html("Update cancelled");
                            $("#topAlert").show();
                        },
                    }
                });
                console.log("tryna submit");
 
            });
        });
    }
    function getObjects() {
        let config = { headers: {
            appid: appid,
            }   
        }
        axios.get('/allobjs/' + userid, config)
        .then(function (response) {
        // var jsonResponse = response.data;
        //  var jsonResponse = response.data;
            var arr = response.data;
            // console.log(JSON.stringify(arr));
            var selectHeader = "";
            var arr = response.data;
        
            if (mode == "select") {
                selectFor = parent;
                selectHeader = "<th>Select</th>";
                $("#pageTitle").html("Select Object for " + parent + " " + itemid);
            }
            var selectButton = "";
            var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                selectHeader +
                "<th>Object Name</th>"+
                "<th>Object Type</th>"+
                "<th>Last Update</th>"+
            "</tr>"+
            "</thead>"+
            "<tbody>";
            var tableBody = "";
            for(var i = 0; i < arr.length; i++) {
                let ts = 0;
                if (mode == "select") {
                    selectButton = "<td><button type=\x22button\x22 class=\x22btn btn-primary\x22 onclick=\x22selectItem('" + parent + "','object','" + itemid + "','" + arr[i]._id + "')\x22>Select</button></td>";
                } 
                if (arr[i].createdTimestamp != undefined && arr[i].createdTimestamp != null) {
                    ts = arr[i].createdTimestamp;
                }
                if (arr[i].lastUpdateTimestamp != undefined && arr[i].lastUpdateTimestamp != null) {
                    ts = arr[i].lastUpdateTimestamp;
                }
                tableBody = tableBody +
                "<tr>" +
                selectButton +
                "<td><a class=\x22btn btn-sm text-primary\x22 href=\x22index.html?type=object&iid="+arr[i]._id+"\x22><i class=\x22far fa-edit\x22></i><strong> " + arr[i].name + "</strong></a></td>" +
                "<td>" + arr[i].objtype + "</td>" +
                "<td>" + convertTimestamp(ts) + "</td>" +
                "</tr>";
            }
            var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                selectHeader +
                "<th>Name</th>"+
                "<th>Type</th>"+
                "<th>Last Update</th>"+
                "</tr>" +
            "</tfoot>" +
            "</table>";
            var resultElement = document.getElementById('table1Data');
            resultElement.innerHTML = tableHead + tableBody + tableFoot;
            let newButton = "<button class=\x22btn btn-info float-right\x22 onclick=\x22newObject()\x22>Create New Object</button>";
            $("#newButton").html(newButton);
            $("#newButton").show();
            $('#dataTable1').DataTable(
                {"order": [[ 2, "desc" ]]}
            );
        })
        .catch(function (error) {
            console.log(error);
        });    
    }
    function showScene(response) {
            // console.log("locations " + JSON.stringify(response.data.sceneLocations));
            $("#pageTitle").html("Scene " + response.data.sceneTitle + " details");
            $("#cards").show();
            let domains = [];
            let submitButtonRoute = "";
            let short_id = response.data.short_id;
            let sceneTitle = response.data.sceneTitle != undefined ? response.data.sceneTitle : "";  //ternarys are OK if not nested.  really. 
            let sceneAppName = response.data.sceneAppName != undefined ? response.data.sceneAppName : "";
            let sceneDomain = response.data.sceneDomain != undefined ? response.data.sceneDomain : ""; 
            let sceneKeynote = response.data.sceneKeynote != undefined ? response.data.sceneKeynote : ""; 
            let sceneDescription = response.data.sceneDescription != undefined ? response.data.sceneDescription : ""; 
            let sceneNextScene = response.data.sceneNextScene != undefined ? response.data.sceneNextScene : "";
            let scenePreviousScene = response.data.scenePreviousScene != undefined ? response.data.scenePreviousScene : ""; 
            let sceneStickyness = response.data.sceneStickyness != undefined ? response.data.sceneStickyness : ""; 
            let sceneLocationRange = response.data.sceneLocationRange != undefined ? response.data.sceneLocationRange : ""; 

            let sceneText = response.data.sceneText != undefined ? response.data.sceneText : ""; 
            let sceneFontFillColor = response.data.sceneFontFillColor != undefined ? response.data.sceneFontFillColor : ""; 
            let sceneFontOutlineColor = response.data.sceneFontOutlineColor != undefined ? response.data.sceneFontOutlineColor : ""; 
            let sceneFontGlowColor = response.data.sceneFontGlowColor != undefined ? response.data.sceneFontGlowColor : ""; 
            let sceneTextBackgroundColor = response.data.sceneTextBackgroundColor != undefined ? response.data.sceneTextBackgroundColor : ""; 
            let scenePrimaryTextFontSize = response.data.scenePrimaryTextFontSize != undefined ? response.data.scenePrimaryTextFontSize : 16;
            let scenePrimaryAudioStreamURL = response.data.scenePrimaryAudioStreamURL != undefined ? response.data.scenePrimaryAudioStreamURL : ""; 
            let scenePrimaryAudioTitle = response.data.scenePrimaryAudioTitle != undefined ? response.data.scenePrimaryAudioTitle : ""; 
            let scenePrimaryVolume = response.data.scenePrimaryVolume != undefined ? response.data.scenePrimaryVolume : 0; 
            let sceneAmbientAudioStreamURL = response.data.sceneAmbientAudioStreamURL != undefined ? response.data.sceneAmbientAudioStreamURL : ""; 
            let sceneTriggerVolume = response.data.sceneTriggerVolume != undefined ? response.data.sceneTriggerVolume : 0; 
            let sceneWeatherAudioVolume = response.data.sceneWeatherAudioVolume != undefined ? response.data.sceneWeatherAudioVolume : 0; 
            let sceneTriggerAudioStreamURL = response.data.sceneTriggerAudioStreamURL != undefined ? response.data.sceneTriggerAudioStreamURL : ""; 
            let sceneAmbientVolume = response.data.sceneAmbientVolume != undefined ? response.data.sceneAmbientVolume : 0; 
            let sceneMasterAudioVolume = response.data.sceneMasterAudioVolume != undefined ? response.data.sceneMasterAudioVolume : 0; 
            let scenePrimarySynth1Volume = response.data.scenePrimarySynth1Volume != undefined ? response.data.scenePrimarySynth1Volume : 0; 
            let scenePrimarySynth2Volume = response.data.scenePrimarySynth2Volume != undefined ? response.data.scenePrimarySynth2Volume : 0; 
            let sceneAmbientSynth1Volume = response.data.sceneAmbientSynth1Volume != undefined ? response.data.sceneAmbientSynth1Volume : 0; 
            let sceneAmbientSynth2Volume = response.data.sceneAmbientSynth2Volume != undefined ? response.data.sceneAmbientSynth2Volume : 0; 
            let sceneTriggerSynth1Volume = response.data.sceneTriggerSynth1Volume != undefined ? response.data.sceneTriggerSynth1Volume : 0; 
            let sceneTriggerSynth2Volume = response.data.sceneTriggerSynth2Volume != undefined ? response.data.sceneTriggerSynth2Volume : 0; 
            let scenePrimaryAudioID = response.data.scenePrimaryAudioID != undefined ? response.data.scenePrimaryAudioID : "";
            let sceneAmbientAudioID = response.data.sceneAmbientAudioID != undefined ? response.data.sceneAmbientAudioID : "";
            let sceneBPM = response.data.sceneBPM != undefined ? response.data.sceneBPM : ""; 
            let sceneStaticObj = response.data.sceneStaticObj != undefined ? response.data.sceneStaticObj : ""; 
            let scenePrimaryTextMode = response.data.scenePrimaryTextMode != undefined ? response.data.scenePrimaryTextMode : "Normal";
            let scenePrimaryTextAlign = response.data.scenePrimaryTextAlign != undefined ? response.data.scenePrimaryTextAlign : "Left";
            let sceneNetworking = response.data.sceneNetworking != undefined ? response.data.sceneNetworking : "None";
            // let sceneFontSize = response.data.sceneFontSize != undefined ? response.data.sceneFontSize : ""; 
            let scenePrimarySequence1Transpose = response.data.scenePrimarySequence1Transpose != undefined ? response.data.scenePrimarySequence1Transpose : 0; 
            let scenePrimarySequence2Transpose = response.data.scenePrimarySequence2Transpose != undefined ? response.data.scenePrimarySequence2Transpose : 0; 
            let sceneTriggerSequence1Transpose = response.data.sceneTriggerSequence1Transpose != undefined ? response.data.sceneTriggerSequence1Transpose : 0; 
            let sceneTriggerSequence2Transpose = response.data.sceneTriggerSequence2Transpose != undefined ? response.data.sceneTriggerSequence2Transpose : 0; 
            let sceneAmbientSequence1Transpose = response.data.sceneAmbientSequence1Transpose != undefined ? response.data.sceneAmbientSequence1Transpose : 0; 
            let sceneAmbientSequence2Transpose = response.data.sceneAmbientSequence2Transpose != undefined ? response.data.sceneAmbientSequence2Transpose : 0; 
            let sceneWindFactor = response.data.sceneWindFactor != undefined ? response.data.sceneWindFactor : 0; 
            let sceneLightningFactor = response.data.sceneLightningFactor != undefined ? response.data.sceneLightningFactor : 0; 
            let sceneGlobalFogDensity = response.data.sceneGlobalFogDensity != undefined ? response.data.sceneGlobalFogDensity : 0; 
            let sceneMapZoom = response.data.sceneMapZoom != undefined ? response.data.sceneMapZoom : 0; 
            let sceneAssetBundleName = response.data.sceneEnvironment != undefined ? response.data.sceneEnvironment.name : ""; //hrm... maybe should flatten this obj
            let sceneWaterLevel = response.data.sceneWater != undefined ? response.data.sceneWater.level : 0;
            let sceneHeightmap = response.data.sceneHeightmap != undefined ? response.data.sceneHeightmap : "";
            let sceneColor1 = response.data.sceneColor1 != undefined ? response.data.sceneColor1 : ""; 
            let sceneColor2 = response.data.sceneColor2 != undefined ? response.data.sceneColor2 : ""; 
            let sceneColor3 = response.data.sceneColor3 != undefined ? response.data.sceneColor3 : ""; 
            let sceneHighlightColor = response.data.sceneHighlightColor != undefined ? response.data.sceneHighlightColor : ""; 
            let sceneYouTubeIDs = (response.data.sceneYouTubeIDs != undefined && response.data.sceneYouTubeIDs != null) ? response.data.sceneYouTubeIDs : "";
            let scenePictureGroups = (response.data.scenePictureGroups != undefined && response.data.scenePictureGroups != null) ? response.data.scenePictureGroups : ""; 
            let scenePictures = (response.data.scenePictures != undefined && response.data.scenePictures != null) ? response.data.scenePictures : ""; //ids
            let scenePostcards = (response.data.scenePostcards != undefined && response.data.scenePostcards != null) ? response.data.scenePostcards : ""; //ids
            let sceneVideos = (response.data.sceneVideos != undefined && response.data.sceneVideos != null) ? response.data.sceneVideos : ""; //ids
            let pictures = (response.data.pictures != undefined && response.data.pictures != null) ? response.data.pictures : ""; 
            let sceneObjex = (response.data.sceneObjex != undefined && response.data.sceneObjex != null) ? response.data.sceneObjex : ""; //munged on server for request
            let sceneTargetObject = (response.data.sceneTargetObject != undefined && response.data.sceneTargetObject != null) ? response.data.sceneTargetObject : "";
            let sceneLocations = (response.data.sceneLocations != undefined && response.data.sceneLocations != null) ? response.data.sceneLocations : "";
            let sceneObjexGroups = (response.data.sceneObjexGroups != undefined && response.data.sceneObjexGroups != null) ? response.data.sceneObjexGroups : "";
            let sceneModelz = (response.data.sceneModelz != undefined && response.data.sceneModelz != null) ? response.data.sceneModelz : ""; //munged on server for request
            let sceneModels = (response.data.sceneModels != undefined && response.data.sceneModels != null) ? response.data.sceneModels : ""; //IDs only, add/remove to update
            let sceneLocationGroups = (response.data.sceneLocationGroups != undefined && response.data.sceneLocationGroups != null) ? response.data.sceneLocationGroups : "";
            let sceneWebLinks = (response.data.sceneWebLinks != undefined && response.data.sceneWebLinks != null) ? response.data.sceneWebLinks : []; 
            let weblinx = (response.data.weblinx != undefined && response.data.weblinx != null) ? response.data.weblinx : []; 
            let picGroupButtons = "";
            let vidGroupButtons = "";
            let objGroupButtons = "";
            let gltfSelect = "";

            // console.log(sceneModelz);
            // axios.get('/gltf/' + userid)
            //     .then(function (response) {
            //         console.log("gltfs " + JSON.stringify(response));
            //         for (let i = 0; i < response.data.gltfItems.length; i++) {
            //             // let nameSplit = response.data.gltfItems[i].name.split("_");
            //             // let name = nameSplit[1];
            //             gltfSelect = gltfSelect + "<option>" + response.data.gltfItems[i].name + "</option>";
            //         }
            //         console.log(gltfSelect);
            //     }) //end of main fetch
            //     .catch(function (error) {
            //         console.log(error);
            // });
            if (response.data.scenePictureGroups != null) {
                for (let i =0; i < response.data.scenePictureGroups.length; i++) {
                    for (let j = 0; j < response.data.sceneGroups.length; j++) {
                        if (response.data.sceneGroups[j].type == "picture" && response.data.scenePictureGroups[i] == response.data.sceneGroups[j]._id) {
                            // picGroups.push(response.data.sceneGroups[j]);
                            picGroupButtons = picGroupButtons + "<div class=\x22btn btn-dark btn-sm float-right\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                            "href=\x22index.html?type=group&iid="+response.data.sceneGroups[j]._id+"\x22>" +
                            "pic group:<strong> " +response.data.sceneGroups[j].name + 
                            "&nbsp;</strong></a><button type=\x22button\x22 class=\x22remPicGroup badge badge-xs badge-danger float-right\x22 id=\x22"+response.data.scenePictureGroups[i] +"\x22>X</button></div>";
                        }
                    }
                }
            }
            if (response.data.sceneVideoGroups != null) {
                for (let i =0; i < response.data.sceneVideoGroups.length; i++) {
                    for (let j = 0; j < response.data.sceneGroups.length; j++) {
                        if (response.data.sceneGroups[j].type == "video" && response.data.sceneVideoGroups[i] == response.data.sceneGroups[j]._id) {
                            // picGroups.push(response.data.sceneGroups[j]);
                            vidGroupButtons = vidGroupButtons + "<div class=\x22btn btn-dark btn-sm float-right\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                            "href=\x22index.html?type=group&iid="+response.data.sceneGroups[j]._id+"\x22>" +
                            "vid group:<strong> " +response.data.sceneGroups[j].name + 
                            "&nbsp;</strong></a><button type=\x22button\x22 class=\x22remVidGroup badge badge-xs badge-danger float-right\x22 id=\x22"+response.data.scenePictureGroups[i] +"\x22>X</button></div>";
                        }
                    }
                }
            }

            let scenePcards = "";
                if (response.data.postcards != null && response.data.postcards != undefined && response.data.postcards.length > 0 ) {
                // console.log("tryna fetch postcards " + JSON.stringify(response.data.postcards));
                for (let i = 0; i < response.data.postcards.length; i++) {
                    scenePcards = scenePcards +
                    "<div class=\x22card\x22 style=\x22width:128px;\x22>" +
                        "<img class=\x22card-img-top\x22 src=\x22" + response.data.postcards[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                        "<div class=\x22card-img-overlay\x22>" +
                        "<a role=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 href=\x22index.html?type=picture&iid="+response.data.postcards[i]._id+"\x22>^</a>" +
                        "<button type=\x22button\x22 class=\x22remScenePic badge badge-xs badge-danger float-right\x22 id=\x22" + response.data.postcards[i]._id + "\x22>X</button>" +
                        // "<button type=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 onclick=\x22removeItem('scene','picture','" + response.data._id + "','" + response.data.postcards[i]._id + "')\x22>^</button>" +    
                        // "<button type=\x22button\x22 class=\x22badge badge-xs badge-danger float-right\x22 onclick=\x22removeItem('scene','postcard','" + response.data._id + "','" + response.data.postcards[i]._id + "')\x22>X</button>" +
                        "<br><br><br><span class=\x22badge badge-pill badge-light float-left\x22>Postcard</span>" +
                        "</div>" +
                    "</div>";
                    }
                }    
            let scenePics = "";    
                if (pictures != null && pictures != undefined && pictures.length > 0 ) {
                // console.log("tryna fetch pics " + JSON.stringify(response.data.pictures));
                for (let i = 0; i < pictures.length; i++) {
                    let orientation = "scene pic";
                    if (pictures[i].orientation != undefined) {
                        orientation = pictures[i].orientation;
                    }
                    scenePics = scenePics +
                    "<div class=\x22card\x22 style=\x22width:128px;\x22>" +
                        "<img class=\x22card-img-top\x22 src=\x22" + pictures[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                        "<div class=\x22card-img-overlay\x22>" +
                        "<a role=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 href=\x22index.html?type=picture&iid="+pictures[i]._id+"\x22>^</a>" +
                        "<button type=\x22button\x22 class=\x22remScenePic badge badge-xs badge-danger float-right\x22 id=\x22" + pictures[i]._id + "\x22>X</button>" +
                        "<br><br><br><span class=\x22badge badge-pill badge-light float-left\x22>"+orientation+"</span>" +
                        "</div>" +
                    "</div>";
                    }
                }                
            let sceneWeblinkPics = "";    
                if (weblinx != null && weblinx != undefined && weblinx.length > 0 ) {
                // console.log("tryna fetch pics " + JSON.stringify(response.data.pictures));
                // if (sceneResponse.sceneWebLinks != null && sceneResponse.sceneWebLinks.length > 0) {
                //     let weblinx = [];
                //     for (var i = 0; i < sceneResponse.sceneWebLinks.length; i++) {

                //         db.weblinks.findOne({'_id': ObjectID(sceneResponse.sceneWebLinks[i])}, function (err, weblink) {
                //             if (err || !weblink) {
                //                 console.log("can't find weblink");
                //             } else {
                //                 let link = {};
                //                 var urlThumb = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i] +"/"+ sceneResponse.sceneWebLinks[i] + ".thumb.jpg", Expires: 6000});
                //                 var urlHalf = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i] +"/"+ sceneResponse.sceneWebLinks[i] + ".half.jpg", Expires: 6000});
                //                 var urlStandard = s3.getSignedUrl('getObject', {Bucket: 'servicemedia.web', Key: sceneResponse.sceneWebLinks[i] +"/"+ sceneResponse.sceneWebLinks[i] + ".standard.jpg", Expires: 6000});
                //                 link.urlThumb = urlThumb;
                //                 link.urlHalf = urlHalf;
                //                 link.urlStandard = urlStandard;
                //                 link.link_url;
                //                 weblinx.push(link);
                //             }
                //         });
                //     }
                //     sceneResponse.weblinx = weblinx;
                // }
                for (let i = 0; i < weblinx.length; i++) {
                    console.log(JSON.stringify(weblinx[i]));
                    sceneWeblinkPics = sceneWeblinkPics +
                    "<div class=\x22card\x22 style=\x22width:128px;\x22>" +
                        "<img class=\x22card-img-top\x22 src=\x22" + weblinx[i].urlHalf + "\x22 alt=\x22Card image cap\x22>" +
                        "<div class=\x22card-img-overlay\x22>" +
                        // "<a role=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 href=\x22"+weblinx[i].link_url+"\x22>^</a>" +
                        "<button type=\x22button\x22 class=\x22refWeblink badge badge-xs badge-info float-left\x22 id=\x22" + weblinx[i]._id + "\x22>^</button>" +
                        "<button type=\x22button\x22 class=\x22remWeblink badge badge-xs badge-danger float-right\x22 id=\x22" + weblinx[i]._id + "\x22>X</button>" +
                        "<br><br><br><span class=\x22badge badge-pill badge-light float-left\x22><a href=\x22"+weblinx[i].link_url+"\x22>"+weblinx[i].link_title+"</a></span>" +
                        "</div>" +
                    "</div>";
                    }
                }
            let sceneLocs = "";    
                if (sceneLocations != null && sceneLocations != undefined && sceneLocations.length > 0 ) {
                // console.log("sceneKLocattionz " + JSON.stringify(sceneLocations));
                for (let i = 0; i < sceneLocations.length; i++) {
                    let locationMap = "";
                    let location = "";
                    let locationFormElements = "";
                    let label = sceneLocations[i].label != undefined ? sceneLocations[i].label : sceneLocations[i].name;
                    let name = sceneLocations[i].name;
                    if (name == null ||name == undefined) {
                        name = sceneLocations[i].timestamp;
                    }
                    if (name == null ||name == undefined) {
                        name = sceneLocations[i].label;
                    }
                    let locationID = "";
                    // if (sceneLocations[i]._id != null && sceneLocations[i]._id != undefined) {
                    //     locationID = sceneLocations[i]._id; 
                    // } else {
                    locationID = sceneLocations[i].timestamp; //go ahead and use timestamp, bc _ids may not be unique here, i.e. if same loc selected
                    if (locationID == undefined) { //some old ones don't have it!
                        locationID = Math.floor(Date.now()/1000);
                        sceneLocations[i].timestamp = locationID;
                    }
                    // }
                    // else {
                    //     if (sceneLocations[i].timestamp != null && sceneLocations[i].timestamp != undefined) {
                    //         locationID = sceneLocations[i].timestamp;
                    //     } else {
                    //         locationID = sceneLocations[i].name;
                    //     }
                        
                    // }
                    let rotations = ""+                        
                    "<label for=\x22eulerx_" + locationID + "\x22>Rotation X</label>" + 
                    "<input type=\x22number\x22 class=\x22form-control locationObjectRotX\x22 id=\x22eulerx_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulerx + "\x22 >" +
                    "<label for=\x22eulery_" + locationID + "\x22>Rotation Y</label>" + 
                    "<input type=\x22number\x22 class=\x22form-control locationObjectRotY\x22 id=\x22eulery_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulery + "\x22 >" +
                    "<label for=\x22eulerz_" + locationID + "\x22>Rotation Z</label>" + 
                    "<input type=\x22number\x22 class=\x22form-control locationObjectRotZ\x22 id=\x22eulerz_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulerz + "\x22 >";
               
                    locationFormElements = ""+
                    "<div class=\x22row\x22>" + 
                    
                        // "<div class=\x22col form-group col-md-1\x22>" + 
                        //     "<label for=\x22eulerx_" + locationID + "\x22>Rotation X</label>" + 
                        //     "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulerx_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulerx + "\x22 >" +
                        // // "</div>" +
                        // // "<div class=\x22form-group col-md-1\x22>" + 
                        //     "<label for=\x22eulery_" + locationID + "\x22>Rotation Y</label>" + 
                        //     "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulery_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulery + "\x22 >" +
                        // // "</div><br><br><br>" +
                        // // "<div class=\x22form-group col-md-1\x22>" + 
                        //     "<label for=\x22eulerz_" + locationID + "\x22>Rotation Z</label>" + 
                        //     "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22eulerz_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eulerz + "\x22 >" +
                        // "</div>" +
                        "<div class=\x22col form-group col-md-4\x22>" +
                            "<label for=\x22label_" + locationID + "\x22>Label</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22label_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + label + "\x22 >" +
                            "<label for=\x22eventData_" + locationID + "\x22>Event Data</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control locationEventData\x22 id=\x22eventData_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].eventData + "\x22 >" +
                            "<label for=\x22markerObjectScale_" + locationID + "\x22>Object Scale</label>" + 
                            "<input type=\x22number\x22 step=\x220.001\x22 class=\x22form-control locationObjectScale\x22 id=\x22scale_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].markerObjScale + "\x22 >" +
                            
                        "</div>" +

                            // "<select style=\x22display: none;\x22 class=\x22locationObjectSelect form-control\x22 id=\x22locobjselect_" + locationID + "\x22>" +
                            // // "<option value=\x22\x22 disabled selected>Select:</option>" +
                            // "</select>" +
                            // "<div class=\x22locationObjects\x22></div>"
                            // "<br><button type=\x22button\x22 class=\x22selectLocationObject btn btn-sm btn-success float-right\x22 id=\x22locobjtype_" + locationID + "\x22>Select Location Object</button>" +
                            // "<div id=\x22locationObjects_" + locationID + "\x22></div>"
                        // "</div>" +
                        "<div class=\x22col form-group col-md-3\x22>" + 

                            "<label for=\x22objtype_" + locationID + "\x22>Object Type</label>" + //type
                            "<select class=\x22locationObjectTypeSelect form-control\x22 id=\x22locobjtypeselect_" + locationID + "\x22>" +
                            "<option value=\x22\x22 disabled selected>Select:</option>" +
                            returnObjectTypes(sceneLocations[i].markerType) +
                            "</select>" +
                            // "<div id=\x22locationObjects_" + locationID + "\x22></div>"
                        "</div>" +
                        "<div class=\x22col form-group col-md-3\x22 id=\x22locationObjects_" + locationID + "\x22>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-6\x22 id=\x22modelObjects_" + locationID + "\x22>" +
                            "<label for=\x22\x22>Location Model: </label>" + 
                            "<select class=\x22form-control modelSelector\x22 id=\x22modelSelect_"+locationID+"\x22>" +
                            "<option value=\x22\x22 disabled selected>Select : </option>" +
                            "<option value=\x22none\x22> none</option>" +
                            "</select>" +
                        "</div>" +
                        "<div class=\x22col form-group col-md-6\x22 id=\x22gltfObjects_" + locationID + "\x22>" +
                            "<label for=\x22\x22>Location GLTF: </label>" + 
                            "<select class=\x22form-control gltfSelector\x22 id=\x22gltfSelect_"+locationID+"\x22>" +
                            "<option value=\x22\x22 disabled selected>Select : </option>" +
                            "<option value=\x22none\x22> none</option>" +
                            "</select>" +
                        "</div>" +

                    "</div>";
                    if (sceneLocations[i].type != undefined && sceneLocations[i].type.toLowerCase() == "geographic") {
                        locationMap = "<a target=\x22_blank\x22 href=\x22http://maps.google.com?q=" + sceneLocations[i].latitude + "," + sceneLocations[i].longitude + "\x22>" +
                        "<img class=\x22img-thumbnail\x22 style=\x22width: 300px;\x22 src=\x22https://maps.googleapis.com/maps/api/staticmap?center=" + sceneLocations[i].latitude + "," + sceneLocations[i].longitude + 
                        "&zoom=15&size=600x300&maptype=roadmap&key=AIzaSyCBlNNHgDBmv-vusmuvG3ylf0XjGoMkkCo&markers=color:blue%7Clabel:" + (i + 1) + "%7C" + sceneLocations[i].latitude + "," + sceneLocations[i].longitude + "\x22>" + 
                        "</a>" + 
                        "<br><br><button type=\x22button\x22 class=\x22remSceneLocation btn btn-xs btn-danger float-left\x22 id=\x22" + i + "\x22>Remove</button>";

                        // location = "latitude: " + sceneLocations[i].latitude + "<br>longitude: " + sceneLocations[i].longitude;
                        location = "<label for=\x22latitude_" + locationID + "\x22>Latitude:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjLatitude\x22 id=\x22latitude_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].latitude + "\x22 >" +
                        "<label for=\x22longitude_" + locationID + "\x22>Longitude:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjLongitude\x22 id=\x22longitude_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].longitude + "\x22 >"+
                        "<label for=\x22elevation_" + locationID + "\x22>Elevation:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjGeoElevation\x22 id=\x22elevation_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].elevation + "\x22 >";

                    } else {

                        // location = "x: " + sceneLocations[i].x + "<br>y: " + sceneLocations[i].y + "<br>z: " + sceneLocations[i].z; 
                        location = "<label for=\x22xposition_" + locationID + "\x22>X Position:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjectX\x22 id=\x22xpos_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].x + "\x22 >" +
                        "<label for=\x22yposition_" + locationID + "\x22>Y Position:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjectY\x22 id=\x22ypos_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].y + "\x22 >" +
                        "<label for=\x22zposition_" + locationID + "\x22>Z Position:</label>" + 
                        "<input type=\x22text\x22 class=\x22form-control locationObjectZ\x22 id=\x22zpos_" + locationID + "\x22 placeholder=\x220\x22 value=\x22" + sceneLocations[i].z + "\x22 >";

                        if (sceneLocations[i].x != undefined && sceneLocations[i].z != undefined) { //svg map values 
                            let scaleString = "";
                            let scaleFactor = 100;
                            let scaleInt = 0;
                            const xMag = Math.abs(sceneLocations[i].x);
                            const zMag = Math.abs(sceneLocations[i].z);
    
                            const scaleMax = Math.max(xMag, zMag); //largest mag of x and z
                            if (scaleMax > 100) {
                                scaleString = String(scaleMax).charAt(0);
                                scaleInt = (Number(scaleString));
                            }
    
                            let xpos =  parseInt(sceneLocations[i].x) + 100;
                            let zpos =  100 - parseInt(sceneLocations[i].z);
                            let scaleText = "100";
    
                            if (scaleInt > 0) {
                            scaleText = ((scaleInt + 1) * 100).toString(); 
                            scaleFactor = scaleInt + 1; //use as scale factor
                            xpos =  (parseInt(sceneLocations[i].x) / scaleFactor) + 100;
                            zpos =  100 - (parseInt(sceneLocations[i].z) / scaleFactor);
                            }
    
                            console.log("pos " + xpos + " " + zpos);
                            console.log(xMag + " " + zMag + " " + scaleInt + " " + scaleString + " " + scaleFactor);
                        //     const scaleInt = Math.max(Math.abs(sceneLocations[i].x), Math.abs(sceneLocations[i].z)); //largest mag of x and z
                        //     const scaleString = String(scaleInt).charAt(0); //take first number
                        //     const scaleFactor = Number(scaleString) * 100; //use as scale factor
    
                        //     // const xpos =  parseInt(sceneLocations[i].x) + scaleFactor;
                        //     // const zpos =  scaleFactor - parseInt(sceneLocations[i].z);
                            
                        // const xpos =  parseInt(sceneLocations[i].x) + 100;
                        // const zpos =  100 - parseInt(sceneLocations[i].z);
                        // console.log("positiosn " + xpos + " " + zpos);
                        //     console.log("scaleInt " + scaleInt + " scaleString " + scaleString + " scaleFactor " + scaleFactor);    
                        
                        locationMap = "<div class=\x22\x22 style=\x22margin: 0 auto; \x22><svg height=\x22200\x22 width=\x22200\x22>" +
                        "<text style=\x22fill:blue;\x22 x=\x220\x22 y=\x22200\x22 class=\x22small\x22>scale "+scaleText+"</text>"+
                            "<line x1=\x220\x22 y1=\x220\x22 x2=\x220\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2210\x22 y1=\x220\x22 x2=\x2210\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2220\x22 y1=\x220\x22 x2=\x2220\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2230\x22 y1=\x220\x22 x2=\x2230\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2240\x22 y1=\x220\x22 x2=\x2240\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2250\x22 y1=\x220\x22 x2=\x2250\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2260\x22 y1=\x220\x22 x2=\x2260\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2270\x22 y1=\x220\x22 x2=\x2270\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2280\x22 y1=\x220\x22 x2=\x2280\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x2290\x22 y1=\x220\x22 x2=\x2290\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22100\x22 y1=\x220\x22 x2=\x22100\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:1.5\x22 />" + 
                            "<line x1=\x22110\x22 y1=\x220\x22 x2=\x22110\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22120\x22 y1=\x220\x22 x2=\x22120\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22130\x22 y1=\x220\x22 x2=\x22130\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22140\x22 y1=\x220\x22 x2=\x22140\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22150\x22 y1=\x220\x22 x2=\x22150\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22160\x22 y1=\x220\x22 x2=\x22160\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22170\x22 y1=\x220\x22 x2=\x22170\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22180\x22 y1=\x220\x22 x2=\x22180\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22190\x22 y1=\x220\x22 x2=\x22190\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x22200\x22 y1=\x220\x22 x2=\x22200\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x220\x22 x2=\x22200\x22 y2=\x220\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2210\x22 x2=\x22200\x22 y2=\x2210\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2220\x22 x2=\x22200\x22 y2=\x2220\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2230\x22 x2=\x22200\x22 y2=\x2230\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2240\x22 x2=\x22200\x22 y2=\x2240\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2250\x22 x2=\x22200\x22 y2=\x2250\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2260\x22 x2=\x22200\x22 y2=\x2260\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2270\x22 x2=\x22200\x22 y2=\x2270\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2280\x22 x2=\x22200\x22 y2=\x2280\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x2290\x22 x2=\x22200\x22 y2=\x2290\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22100\x22 x2=\x22200\x22 y2=\x22100\x22 style=\x22stroke:rgb(0,0,0);stroke-width:1.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22110\x22 x2=\x22200\x22 y2=\x22110\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22120\x22 x2=\x22200\x22 y2=\x22120\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22130\x22 x2=\x22200\x22 y2=\x22130\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22140\x22 x2=\x22200\x22 y2=\x22140\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22150\x22 x2=\x22200\x22 y2=\x22150\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22160\x22 x2=\x22200\x22 y2=\x22160\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22170\x22 x2=\x22200\x22 y2=\x22170\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22180\x22 x2=\x22200\x22 y2=\x22180\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22190\x22 x2=\x22200\x22 y2=\x22190\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<line x1=\x220\x22 y1=\x22200\x22 x2=\x22200\x22 y2=\x22200\x22 style=\x22stroke:rgb(0,0,0);stroke-width:.5\x22 />" + 
                            "<circle cx=\x22"+xpos+"\x22 cy=\x22"+zpos+"\x22 r=\x225\x22 stroke=\x22black\x22 stroke-width=\x221\x22 fill=\x22red\x22 />" +
                            "</svg></div>" +
                            "<br><button type=\x22button\x22 class=\x22remSceneLocation btn btn-xs btn-danger float-left\x22 id=\x22" + i + "\x22>Remove</button>";;
                        }
                    }
                    let id = "";
                    if (sceneLocations[i].location_object != null && sceneLocations[i].location_object != undefined) {
                        id = sceneLocations[i].location_object._id;
                    }
                    let locationType = "";
                    if (sceneLocations[i].type != undefined) {
                        type = sceneLocations[i].type;
                    }
                    sceneLocs = sceneLocs +
                    "<br><hr><div class=\x22form-row\x22>" +   

                        "<div class=\x22col form-group col-md-2\x22>" + 
                        locationMap +
                        "</div>" +
                        "<div class=\x22col form-group col-md-1\x22>" + 
                        //spacer
                        "</div>" +
                        "<div class=\x22col form-group col-md-1\x22>" + 
                        location +
                        "</div>" +
                        "<div class=\x22col form-group col-md-1\x22>" + 
                        rotations + 
                        "</div>" + 
                        "<div class=\x22col form-group col-md-6\x22>" + 
                        locationFormElements +
                        "</div>" +
                        
                    "</div>";
                    }
                }    
            let sceneVids = "";
                if (response.data.sceneVideoItems != null && response.data.sceneVideoItems != undefined && response.data.sceneVideoItems.length > 0 ) {
                // console.log("tryna fetch vids " + JSON.stringify(response.data.videos));
                // sceneVideoItems = response.data.sceneVideoItems;
                for (let i = 0; i < response.data.sceneVideoItems.length; i++) {
                    sceneVids = sceneVids +
                    "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22embed-responsive embed-responsive-16by9\x22>" +
                            "<iframe class=\x22embed-responsive-item\x22 src=\x22" + response.data.sceneVideoItems[i].vUrl +"\x22 allowfullscreen></iframe>" +
                        "</div>" +
                        "<div><a role=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 href=\x22index.html?type=svideo&iid="+response.data.sceneVideoItems[i]._id+"\x22>^</a>" +
                        "<button type=\x22button\x22 class=\x22remSceneVid badge badge-xs badge-danger float-right\x22 id=\x22"+response.data.sceneVideoItems[i]._id +"\x22>X</button></div>" +
                    "</div>";
                    }
                }
            let sceneMdls = "";    
                if (sceneModelz != null && sceneModelz != undefined && sceneModelz.length > 0 ) {
                console.log("sceneMdls " + JSON.stringify(sceneModelz));
                for (let i = 0; i < sceneModelz.length; i++) {
                    sceneMdls = sceneMdls + "<div class=\x22btn btn-secondary btn-sm float-right\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                    "href=\x22index.html?type=model&iid="+ sceneModelz[i]._id +"\x22>" +
                    "model :&nbsp;<strong> " + sceneModelz[i].name + "</strong>&nbsp;</a><button type=\x22button\x22 class=\x22remSceneModel badge badge-xs badge-danger float-right\x22 id=\x22"+ sceneModelz[i]._id +"\x22>X</button></div>";
                    }
                }
            let sceneObjs = "";    
                if (sceneObjex != null && sceneObjex != undefined && sceneObjex.length > 0 ) {
                // console.log("sceneObjs " + JSON.stringify(sceneObjex));
                for (let i = 0; i < sceneObjex.length; i++) {
                    sceneObjs = sceneObjs + "<div class=\x22btn btn-secondary btn-sm float-right\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                    "href=\x22index.html?type=object&iid="+ sceneObjex[i]._id +"\x22>" +
                    "object :<strong> " + sceneObjex[i].name + 
                    "&nbsp;</strong>type: "+sceneObjex[i].objtype+"&nbsp;</a><button type=\x22button\x22 class=\x22remSceneObject badge badge-xs badge-danger float-right\x22 id=\x22"+ sceneObjex[i]._id +"\x22>X</button></div>";
                    }
                }

            let sceneObjGroups = "";    
                if (sceneObjexGroups != null && sceneObjexGroups != undefined && sceneObjexGroups.length > 0 ) {
                // console.log("tryna fetch pics " + JSON.stringify(response.data.pictures));
                for (let i = 0; i < sceneObjexGroups.length; i++) {
                    sceneObjGroups = sceneObjGroups + "<div class=\x22btn btn-dark btn-sm float-right\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                    "href=\x22index.html?type=group&iid="+ sceneObjexGroups[i]._id +"\x22>" +
                    "object group :<strong> " + sceneObjexGroups[i].name + 
                    "&nbsp;</strong></a><button type=\x22button\x22 class=\x22remObjGroup badge badge-xs badge-danger float-right\x22 id=\x22objectGroup_"+ sceneObjexGroups[i]._id +"\x22>X</button></div>";
                    }
                }    
            let youTubes = "";
            if (response.data.sceneYouTubeIDs != null && response.data.sceneYouTubeIDs != undefined && response.data.sceneYouTubeIDs.length > 0 ) {
                // console.log("tryna fetch vids " + JSON.stringify(response.data.videos));
                for (let i = 0; i < sceneYouTubeIDs.length; i++) {
                    youTubes = youTubes +
                    "<div class=\x22card\x22 style=\x22width:256px;\x22>" +
                        "<div class=\x22embed-responsive embed-responsive-16by9\x22>" +
                        "<iframe class=\x22embed-responsive-item\x22 src=\x22https://www.youtube.com/embed/" + sceneYouTubeIDs[i] +"\x22 allowfullscreen></iframe>" +
                        "</div>" +
                        "<div><a role=\x22button\x22 class=\x22badge badge-xs badge-info float-left\x22 href=\x22https://www.youtube.com/watch?v="+response.data.sceneYouTubeIDs[i]+"\x22>^</a>" +
                        "<button type=\x22button\x22 class=\x22remYouTube badge badge-xs badge-danger float-right\x22 id=\x22"+response.data.sceneYouTubeIDs[i] +"\x22>X</button></div>" +
                    "</div>";
                    }
                    // youTubes = youTubes + "</div>";
                }
            let primaryAudio = {};
            let ambientAudio = {};
            let triggerAudio = {};
            for (var a in response.data.audio) {
                if (response.data.audio[a]._id === scenePrimaryAudioID) {
                    primaryAudio = response.data.audio[a];
                }
                if (response.data.audio[a]._id === response.data.sceneAmbientAudioID) {
                    ambientAudio = response.data.audio[a];
                }
                if (response.data.audio[a]._id === response.data.sceneTriggerAudioID) {
                    triggerAudio = response.data.audio[a];
                }
            }
            // for (var a in response.data.audio) {
            //     if (response.data.audio[a]._id === response.data.sceneAmbientAudioID) {
            //         ambientAudio = response.data.audio[a];
            //     }
            // }
            // for (var a in response.data.audio) {
            //     if (response.data.audio[a]._id === response.data.sceneTriggerAudioID) {
            //         triggerAudio = response.data.audio[a];
            //     }
            // }
                // if (!isEmpty && sceneTags)
                let sceneTagsHtml = "";
                let sceneTags = [];
                if (response.data.sceneTags != null && response.data.sceneTags.length > 0) {
                    sceneTags = response.data.sceneTags;
                    for (let i = 0; i < sceneTags.length; i++) {
                        sceneTagsHtml = sceneTagsHtml + 
                        "<div class=\x22btn btn-light\x22>" +   
                            "<button id=\x22"+sceneTags[i]+"\x22 type=\x22button\x22 class=\x22badge badge-sm badge-danger float-right\x22>X</button>" +
                            "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+sceneTags[i]+"\x22</span>" +
                        "</div>";
                    }
                };
                console.log("tags : " + JSON.stringify(response.data.sceneTags));


                // let sceneType = !isEmpty ? response.data.sceneType : "";
                let extraButtons = "";
                    if (primaryAudio.URLpng == null) {primaryAudio.URLpng = "ref/none_selected.png"}
                    if (ambientAudio.URLpng == null) {ambientAudio.URLpng = "ref/none_selected.png"}
                    if (triggerAudio.URLpng == null) {triggerAudio.URLpng = "ref/none_selected.png"}
                    picButtons = "<label for=\x22scenePicButtons\x22>Scene Pictures </label><div id=\x22scenePicButtons\x22 style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=pictures&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=picgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePictures()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    postcardButtons = "<label for=\x22scenePostcardButtons\x22>Postcards </label><div id=\x22scenePostcardButtons\x22 style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=pictures&mode=postselect&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    vidButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=video&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=vidgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    primaryAudioButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary btn-sm\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info btn-sm\x22 href=\x22index.html?type=audio&mode=paudio&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success btn-sm\x22 href=\x22index.html?type=groups&mode=paudiogroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger btn-sm clearScenePrimaryAudio\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    ambientAudioButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary btn-sm\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info btn-sm\x22 href=\x22index.html?type=audio&mode=aaudio&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success btn-sm\x22 href=\x22index.html?type=groups&mode=aaudiogroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger btn-sm\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    triggerAudioButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary btn-sm\x22 href=\x22index.html?type=bulkup\x22><i class=\x22fas fa-file-upload\x22></i> Upload </a>" +
                    "<a class=\x22btn btn-info btn-sm\x22 href=\x22index.html?type=audio&mode=taudio&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success btn-sm\x22 href=\x22index.html?type=groups&mode=taudiogroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger btn-sm\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    modelButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=models\x22><i class=\x22fas fa-file-upload\x22></i> New </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=models&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=modelgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    objButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=objex\x22><i class=\x22fas fa-file-upload\x22></i> New </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=objex&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=objgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    locationButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=locations\x22><i class=\x22fas fa-file-upload\x22></i> New </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=locations&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=locgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    textButtons = " <div style=\x22margin: 0px 10px;\x22  class=\x22btn-group float-right\22 role=\x22group\x22 aria-label=\x22button group\x22>" +
                    "<a class=\x22btn btn-primary\x22 href=\x22index.html?type=texts\x22><i class=\x22fas fa-file-upload\x22></i> New </a>" +
                    "<a class=\x22btn btn-info\x22 href=\x22index.html?type=texts&mode=select&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Select </a>" +
                    "<a class=\x22btn btn-success\x22 href=\x22index.html?type=groups&mode=textgroup&parent=scene&iid="+response.data._id+"\x22><i class=\x22fas fa-hand-pointer\x22></i> Group </a>" +
                    "<button class=\x22btn btn-danger\x22 onclick=\x22ClearScenePostcards()\x22><i class=\x22fas fa-broom\x22></i> Clear </button></div>";
                    extraButtons = "<a href=\x22#\x22 id=\x22deleteButton\x22 class=\x22btn btn-danger btn-sm float-left\x22 onclick=\x22deleteItem('holditasecondtherechief','" + response.data._id + "')\x22>Delete Scene</a>";
                    // "<a class=\x22btn btn-primary btn-sm float-right\x22 href=\x22index.html?appid=" + response.data._id + "&type=pictures&mode=select&parent=app&iid=" + response.data._id + "\x22>Add App Pic</a>";

                var card = "<div class=\x22col-lg-12\x22>" +
                    "<div class=\x22card shadow mb-4\x22>" +
                    "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                        "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Scene Details - "+ sceneTitle +" | _id: "+ response.data._id +" | short id: <a target=\x22_blank\x22 href=\x22../webxr/"+ response.data.short_id +"\x22>"+ response.data.short_id +"</a></h6>" +
                        // "<a class=\x22btn btn-xs\x22 href=\x22../webxr/"+response.data.short_id +">WebXR</a>"+
                        "<button id=\x22showHideAll\x22 class=\x22btn btn-sm btn-light float-right\x22><i class=\x22fas fa-plus-circle\x22></i> show/hide all</button>" +
                        "</div>" +
                    "<div class=\x22card-body\x22>" +
                        "<form id=\x22updateSceneForm\x22>" +
                            // "submitbutton route " +submitButtonRoute + 
                            "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>Update</button>" + //Create vs Update
                            "<button id=\x22optionsSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Options</h4>" +
                            "<hr/>" +
            //
                    "<div style=\x22display:none;\x22 id=\x22optionsSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" + 
                                    "<label for=\x22sceneTitle\x22>Scene Title</label>" + //sceneTitle
                                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sceneTitle\x22 placeholder=\x22Scene Title Name\x22 value=\x22" + sceneTitle + "\x22 required>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" + 
                                    "<label for=\x22sceneAppNameSelect\x22>Parent App</label>" + //parent app - ugh, most only have sceneDomain, need to clean this and select only by appID
                                    "<select class=\x22form-control\x22 id=\x22sceneAppNameSelect\x22>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneKeynote\x22>Scene Keynote</label>" + 
                                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sceneKeynote\x22 placeholder=\x22Scene Keynote\x22 value=\x22" + sceneKeynote + "\x22 >" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneStickyness\x22>Stickyness</label>" + //sceneNext
                                    "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22sceneStickyness\x22 placeholder=\x2210\x22 value=\x22" + sceneStickyness + "\x22 >" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneDescription\x22>Scene Description</label>" + //sceneDescription
                                    "<textarea class=\x22form-control\x22 id=\x22sceneDescription\x22 placeholder=\x22Give a full description of the scene\x22>" + sceneDescription + "</textarea>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneTypeSelect\x22>Scene Type</label>" + //sceneType
                                    "<select class=\x22form-control\x22 id=\x22sceneTypeSelect\x22 required>" +
                                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                                        "<option>AFrame</option>" +
                                        "<option>ThreeJS</option>" +
                                        "<option>BabylonJS</option>" +
                                        "<option>Virtual</option>" +
                                        "<option>Augmented</option>" +
                                        "<option>ARKit</option>" +
                                        "<option>Geographic</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                "<label for=\x22scenePreviousScene\x22>Previous Scene</label>" + //scenePrevious
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22scenePreviousScene\x22 placeholder=\x22Previous Scene\x22 value=\x22" + scenePreviousScene + "\x22 >" +
                            "</div>" +
                            "<div class=\x22col form-group col-md-1\x22>" +
                                "<label for=\x22sceneNextScene\x22>Next Scene</label>" + //sceneNext
                                "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sceneNextScene\x22 placeholder=\x22Next Scene\x22 value=\x22" + sceneNextScene + "\x22 >" +
                            "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneIosOK\x22>iOS Enabled</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneIosOK\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAndroidOK\x22>Android Enabled</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAndroidOK\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneWindowsOK\x22>Windows Enabled</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneWindowsOK\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +

                                "<div class=\x22col form-group col-md-6\x22>" +
                                    "<label for=\x22sceneLinks\x22>Scene Links</label><br>" + //SceneLinks 
                                    "<div class=\x22input-group\x22>" +
                                        "<div class=\x22input-group-prepend\x22>" +
                                        "<a href=\x22#\x22 class=\x22btn input-group-text\x22 id=\x22addSceneLinkButton\x22>+</a>" +
                                        "</div>" +
                                        "<input id=\x22addSceneLinkInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Scene Code or Title\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22x22addSceneLinks\x22>" +
                                        "<div class=\x22float-right\x22 id=\x22sceneLinkDisplay\x22>" +
                                           
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-6\x22>" +
                                    "<label for=\x22sceneTags\x22>Tags</label><br>" + //Tags
                                    "<div class=\x22input-group\x22>" +
                                        "<div class=\x22input-group-prepend\x22>" +
                                        "<button class=\x22btn input-group-text\x22 id=\x22addTagButton\x22>+</button>" +
                                        "</div>" +
                                        "<input id=\x22addTagInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add Tag\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22addTagInput\x22>" +
                                        "<div id=\x22tagDisplay\x22>" +
                                        sceneTagsHtml +
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-8\x22>" +
                                    "<label for=\x22sceneShareWithUsers\x22>Share with People</label>" + //share with people, todo typeahead...
                                    "<textarea class=\x22form-control\x22 id=\x22sceneShareWithUsers\x22 placeholder=\x22delimit usernames or emails with comma\x22></textarea>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-4\x22>" +
                                    "<label for=\x22sceneShareWithGroups\x22>Share with Group</label>" + //share with group
                                    "<select class=\x22form-control\x22 id=\x22sceneShareWithGroups\x22 >" +
                                        "<option>People Groups Here</option>" +
                                        "</select>"+
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +    
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22scenePublicToggle\x22>Available to Public</label><br>" + //Public/Private
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22scenePublicToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneSubscriberToggle\x22>Subscription Only</label><br>" + //Sub/Not
                                    "<input type=\x22checkbox\x22  id=\x22sceneSubscriberToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneRestrictToLocation\x22>Restrict to Location</label><br>" + //geofencing
                                    "<input type=\x22checkbox\x22  id=\x22sceneRestrictToLocation\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneLocationRange\x22>Location Range</label>" + //sceneNext
                                    "<input type=\x22number\x22 class=\x22form-control\x22 id=\x22sceneLocationRange\x22 placeholder=\x2210\x22 value=\x22" + sceneLocationRange + "\x22 >" +
                                "</div>" +
                                "<div class=\x22col form-group\x22> " +
                                "<label for=\x22networkingBtns\x22> Networking </label>" + //alignement
                                "<br><div id=\x22networkingBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                                    "<label class=\x22btn btn-secondary active\x22>" +
                                        "<input type=\x22radio\x22 name=\x22sceneNetworking\x22 value=\x22None\x22 id=\x22None\x22 autocomplete=\x22off\x22 checked> None " +
                                    "</label>" +
                                    "<label class=\x22btn btn-secondary\x22>" +
                                        "<input type=\x22radio\x22 name=\x22sceneNetworking\x22 value=\x22SocketIO\x22 id=\x22SocketIO\x22 autocomplete=\x22off\x22> SocketIO " +
                                    "</label>" +
                                    "<label class=\x22btn btn-secondary\x22>" +
                                        "<input type=\x22radio\x22 name=\x22sceneNetworking\x22 value=\x22WebRTC\x22 id=\x22WebRTC\x22 autocomplete=\x22off\x22> WebRTC " +
                                    "</label>" +
                                    "<label class=\x22btn btn-secondary\x22>" +
                                        "<input type=\x22radio\x22 name=\x22sceneNetworking\x22 value=\x22AudioChat\x22 id=\x22AudioChat\x22 autocomplete=\x22off\x22> AudioChat " +
                                    "</label>" +
                                "</div>" +
                            "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<button class=\x22btn btn-sm btn-info generateLandingPage float-right\x22><i class=\x22fas fa-cog\x22 id=\x22generateLandingPage\x22></i> Generate Landing </button><br><br>" +
                                    "<button class=\x22btn btn-sm btn-info generateWebXRPage float-right\x22><i class=\x22fas fa-cog\x22 id=\x22generateWebXRPage\x22></i> Generate WebXR </button>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    // "<a class=\x22btn btn-sm btn-primary float-right\x22 target=\x22_blank\x22 href=\x22http://"+sceneDomain+"/"+short_id+"/index.html\x22><i class=\x22far fa-file-alt\x22></i> Landing </a><br><br>" +
                                    "<a class=\x22btn btn-sm btn-primary float-right\x22 target=\x22_blank\x22 href=\x22http://"+sceneDomain+"/"+short_id+"/webxr.html\x22><i class=\x22far fa-file-alt\x22></i> Static WebXR </a><br><br>" +
                                    // "<a class=\x22btn btn-sm btn-primary float-right\x22 target=\x22_blank\x22 href=\x22index.html?type=webxr&iid="+short_id+"\x22><i class=\x22far fa-file-alt\x22></i> Dynamic WebXR </a>" +
                                    "<a class=\x22btn btn-sm btn-primary float-right\x22 target=\x22_blank\x22 target=\x22_blank\x22 href=\x22../webxr/"+ response.data.short_id +"\x22><i class=\x22far fa-file-alt\x22></i> Dynamic WebXR </a>" +

                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<a class=\x22btn btn-sm btn-dark float-right\x22 target=\x22_blank\x22 href=\x22/qcode/"+sceneDomain+"/"+short_id+"\x22><i class=\x22far fa-file-alt\x22></i> Landing QRCode</a><br><br>" +
                                    "<a class=\x22btn btn-sm btn-dark float-right\x22 target=\x22_blank\x22 href=\x22/qrcode/"+short_id+"\x22><i class=\x22far fa-file-alt\x22></i> WebXR QRCode</a>" +
                                "</div>" +
                            "</div>" +
                            "<hr/>" +
                "</div>" +
                    
                            "<button id=\x22cameraSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Camera</h4>" +
                            "<hr/>" +
                "<div style=\x22display:none;\x22 id=\x22cameraSection\x22>" +
                            "<div id=\x22cameraSection\x22 class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                "<label for=\x22sceneCameraMode\x22>Camera Mode</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneCameraMode\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>First Person</option>" +
                                    "<option>Third Person</option>" +
                                    "<option>Follow Path</option>" +
                                    "<option>Fixed</option>" +
                                    "<option>First Person / Path</option>" +
                                    "<option>Third Person / Path</option>" +
                                    // "<option>Cubemap</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneFlyable\x22>Flyable</label><br>" + //HPlanes
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneFlyable\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneHPlanesToggle\x22>Detect Horizontal Planes</label><br>" + //HPlanes
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneHPlanesToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneVPlanesToggle\x22>Detect Vertical Planes</label><br>" + //VPlanes
                                    "<input type=\x22checkbox\x22  id=\x22sceneVPlanesToggle\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneFaceTracking\x22>FaceTracking</label><br>" + //VPlanes
                                    "<input type=\x22checkbox\x22  id=\x22sceneFaceTracking\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneCameraPath\x22>Camera Path</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneCameraPath\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>None</option>" +
                                    "<option>Random</option>" +
                                    "<option>Rect</option>" +
                                    "<option>Circle</option>" +
                                    "<option>POIs</option>" +
                                    "<option>Waypoints</option>" +
                                    // "<option>Cubemap</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneCameraLookAtNext\x22>Look At Next</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneCameraLookAtNext\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                    "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22scenePrimaryAudioSync\x22>Primary Audio Sync</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22scenePrimaryAudioSync\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                    "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneCameraOrientToPath\x22>Orient Camera to Path</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneCameraOrientToPath\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  

                            "</div>" + 
                            "<hr/>" +
                "</div>" +                            
                            "<button id=\x22picturesSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Pictures</h4>" +
                            "<hr/>" +
                "<div style=\x22display:none;\x22 id=\x22picturesSection\x22>" +
                            "<div id=\x22picturesSection\x22 class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-8\x22>" +
                                    picButtons + 
                                    postcardButtons + 
                                "</div>" +
                                "<div class=\x22col form-group col-md-4\x22>" +
                                    picGroupButtons + 
                                "</div>" + 
                            "</div>" + 
                            "<div class=\x22form-row\x22>" +
                                scenePcards + 
                                scenePics + 
                            "</div>" +
                            "<hr/>" +
                "</div>" +
                            "<button id=\x22videoSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Video</h4>" +
                            "<hr/>" +
                "<div style=\x22display:none;\x22 id=\x22videoSection\x22>" +

                                "<div class=\x22col form-group\x22>" +
                                vidButtons +
                                vidGroupButtons +
                                "</div>" + 
                                "<div class=\x22col form-group\x22>" +
                                "</div>" +     
                                "<div class=\x22col form-group\x22>" +
                                    "<label for=\x22sceneTags\x22>YouTube Videos</label><br>" + //Tags
                                    "<div class=\x22input-group\x22>" +
                                        "<div class=\x22input-group-prepend\x22>" +
                                        "<a href=\x22#\x22 class=\x22btn input-group-text\x22 id=\x22addYouTubeButton\x22>+</a>" +
                                        "</div>" +
                                        "<input id=\x22addYouTubeInput\x22 type=\x22text\x22 class=\x22form-control\x22 placeholder=\x22Add YouTube ID or URL\x22 aria-label=\x22Input group example\x22 aria-describedby=\x22x22addYouTubeInput\x22>" +
                                        "<div id=\x22ytDisplay\x22>" +
                                        "</div>" +
                                    "</div>" +
                                "</div>" + 
                            "<div class=\x22form-row\x22>" +
                                sceneVids +
                                youTubes +
                            "</div>" +    
                            "<hr/>" +
                "</div>" +
                            "<button id=\x22textSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Text</h4>" +
                            "<hr/>" +
                "<div style=\x22display:none;\x22 id=\x22textSection\x22>" +
                            "<div class=\x22col form-group\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group\x22>" +
                                "</div>" +     
                                textButtons +
                            "<br><div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-9\x22>" +
                                    "<label for=\x22sceneText\x22>Scene Text</label>" + //sceneText
                                    "<textarea class=\x22form-control\x22 id=\x22sceneText\x22 placeholder=\x22Enter main text here - delimit sequence breaks with '~'\x22 value=\x22" + sceneText + "\x22></textarea>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneFontSelect\x22>Font</label>" + //FontSelect
                                    "<select class=\x22form-control\x22 id=\x22sceneFontSelect\x22 >" +
                                        "<option value=\x22\x22 disabled selected>Select:</option>" +
                                        "<option>Oswald Bold SDF</option>" +
                                        "<option>Augusta SDF</option>" +
                                        "<option>eartmbe12 SDF</option>" +
                                        "<option>museosans_500-webfont SDF</option>" +
                                        "<option>Phosphate SDF</option>" +
                                        "<option>Trattatello SDF</option>" +
                                        "<option>Trebuchet MS Bold SDF</option>" +
                                        "<option>LucidaGrande SDF</option>" +
                                        "<option>kimberley bl SDF</option>" +
                                        "<option>Trebuchet MS Bold SDF</option>" +
                                        "<option>Herculanum SDF</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22scenePrimaryTextFontSize\x22>Font Size</label>" + //fontSize
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22priceHelp\x22 id=\x22scenePrimaryTextFontSize\x22 placeholder=\x22Enter Font Size\x22 value=\x22" + scenePrimaryTextFontSize + "\x22 >" +
                                    "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>8 - 200</small>" +
                                "</div>" +
                                "<div class=\x22col form-group\x22> " +
                                    "<label for=\x22textAlignBtns\x22> Alignment </label>" + //alignement
                                    "<br><div id=\x22textAlignBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                                        "<label class=\x22btn btn-secondary active\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextAlign\x22 value=\x22Left\x22 id=\x22Left\x22 autocomplete=\x22off\x22 checked> Left " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextAlign\x22 value=\x22Right\x22 id=\x22Right\x22 autocomplete=\x22off\x22> Right " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextAlign\x22 value=\x22Centered\x22 id=\x22Centered\x22 autocomplete=\x22off\x22> Centered " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextAlign\x22 value=\x22Justified\x22 id=\x22Justified\x22 autocomplete=\x22off\x22> Justified " +
                                        "</label>" +
                                    "</div>" +
                                "</div>" +
                                "<div class=\x22col form-group\x22> " +
                                    "<label for=\x22textModeBtns\x22> Mode </label>" + //mode
                                    "<br><div id=\x22textModeBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                                        "<label class=\x22btn btn-secondary active\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextMode\x22 value=\x22Normal\x22 id=\x22Normal\x22 autocomplete=\x22off\x22 checked> Normal " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextMode\x22 value=\x22Split\x22 id=\x22Split\x22 autocomplete=\x22off\x22> Split " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextMode\x22 value=\x22Paged\x22 id=\x22Paged\x22 autocomplete=\x22off\x22> Paged " +
                                        "</label>" +
                                        "<label class=\x22btn btn-secondary\x22>" +
                                            "<input type=\x22radio\x22 name=\x22scenePrimaryTextMode\x22 value=\x22Scroll\x22 id=\x22Scroll\x22 autocomplete=\x22off\x22> Scroll " +
                                        "</label>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneFontFillColor\x22>Fill Color</label>" + //sceneText
                                    "<input id=\x22sceneFontFillColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneFontOutlineColor\x22>Outline Color</label>" + //sceneText
                                    "<input id=\x22sceneFontOutlineColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneFontGlowColor\x22>Glow Color</label>" + //sceneText
                                    "<input id=\x22sceneFontGlowColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneTextBackgroundColor\x22>Background Color</label>" + //sceneText
                                    "<input id=\x22sceneTextBackgroundColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneTextBackground\x22>Text Background</label>" + //FontSelect
                                    "<select class=\x22form-control\x22 id=\x22sceneTextBackground\x22 >" +
                                        "<option>scifi</option>" +
                                        "<option>parchement</option>" +
                                        "<option>ARKit</option>" +
                                        "<option>Geographic</option>" +
                                    "</select>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22scenePrimaryTextScaleByDistance\x22>Distance Scaling</label><br>" + 
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22scenePrimaryTextScaleByDistance\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" + 
                                    "<div class=\x22\x22><label for=\x22scenePrimaryTextRotate\x22>Billboard</label><br>" +     
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22scenePrimaryTextRotate\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneTextLoop\x22>Loop Text</label><br>" + 
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneTextLoop\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseThreeDeeText\x22>3D Text</label><br>" + 
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseThreeDeeText\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneTextAudioSync\x22>Sync to Audio</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneTextAudioSync\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +    
                            "</div>" +    
                            "<hr/>" +
                "</div>" +
                            "<button id=\x22audioSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Audio</h4>" +
                            "<hr/>" +
                "<div style=\x22display:none;\x22 id=\x22audioSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +
                                        "<label for=\x22sceneMasterAudioVolume\x22>Master Scene Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneMasterAudioVolume\x22 value=\x22" + sceneMasterAudioVolume + "\x22 >" +
                                        // "<small for=\x22sceneMasterAudioVolume\x22 id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>-80 to +20 db</small>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +  
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                "<div class=\x22card-body\x22>" +
                                    "<label for=\x22scenePrimaryAudioVolume\x22>Primary Audio Volume</label>" + 
                                    "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x22"+scenePrimaryVolume+"\x22 id=\x22scenePrimaryVolume\x22 value=\x22" + scenePrimaryVolume + "\x22 >" +
                                    // "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>-80 to +20 db</small>" +
                                "</div>" +  
                                "</div>" +
                            "</div>" +                                  
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                "<div class=\x22card-body\x22>" +
                                    "<label for=\x22sceneAmbientVolume\x22>Ambient Audio Volume</label>" + 
                                    "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x22"+sceneAmbientVolume+"\x22 id=\x22sceneAmbientVolume\x22 value=\x22" + sceneAmbientVolume + "\x22 >" +
                                    // "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>-80 to +20 db</small>" +
                                "</div>" +
                                "</div>" +   
                            "</div>" +                                  
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                "<div class=\x22card-body\x22>" +
                                    "<label for=\x22sceneTriggerVolume\x22>Trigger Audio Volume</label>" + 
                                    "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x22"+sceneTriggerVolume+"\x22 id=\x22sceneTriggerVolume\x22 value=\x22" + scenePrimaryVolume + "\x22 >" +
                                    // "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>-80 to +20 db</small>" +
                                "</div>" +
                                "</div>" +
                            "</div>" +                                  
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                "<div class=\x22card-body\x22>" +  
                                    "<label for=\x22sceneWeatherAudioVolume\x22>Weather Audio Volume</label>" + 
                                    "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneWeatherAudioVolume\x22 value=\x22" + scenePrimaryVolume + "\x22 >" +
                                    // "<small id=\x22typeHelp\x22 class=\x22form-text text-muted\x22>-80 to +20 db</small>" +
                                "</div>" +
                                "</div>" +  
                            "</div>" +                                   
                            "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                "<div class=\x22card-body\x22>" +  
                                    "<label for=\x22sceneMediaAudioVolume\x22>Media Audio Volume</label>" + 
                                    "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneMediaAudioVolume\x22 value=\x22" + scenePrimaryVolume + "\x22 >" +
                                "</div>" + 
                                "</div>" +  
                            "</div>" +  
                            "</div>" +  
                            "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group\x22>" +
                                "<div class=\x22card\x22 style=\x22width:400px;\x22>" +
                                    "<div class=\x22card-header\x22>" +
                                        "Primary Audio" + 
                                    "</div>" +
                                    "<img class=\x22card-img-top\x22 src=\x22" + primaryAudio.URLpng + "\x22 alt=\x22Card image cap\x22>" +
                                    "<div class=\x22card-img-overlay\x22>" +
                                        "<br><br><a href=\x22index.html?type=saudio&iid="+ primaryAudio._id +"\x22 class=\x22badge badge-pill badge-dark float-left\x22>" + primaryAudio.title + "</a>" +
                                    "</div>" +
                                    "<ul class=\x22list-group list-group-flush\x22>"+
                                        "<li class=\x22list-group-item\x22>"+
                                            primaryAudioButtons +
                                        "</li>"+
                                        "<li class=\x22list-group-item\x22>"+
                                        "<label for=\x22scenePrimaryAudioTitle\x22>Audio Title</label>" + //sceneTitle
                                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22scenePrimaryAudioTitle\x22 placeholder=\x22Enter Title\x22 value=\x22" + scenePrimaryAudioTitle + "\x22 >" +
                                        "</li>"+
                                        "<li class=\x22list-group-item\x22>"+
                                        "<label for=\x22scenePrimaryAudioStreamURL\x22>Streaming URL</label>" + //sceneTitle
                                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22scenePrimaryAudioStreamURL\x22 placeholder=\x22Enter Stream URL\x22 value=\x22" + scenePrimaryAudioStreamURL + "\x22 >" +
                                        "</li>"+
                                    "</ul>"+
                                "</div>" +
                            "</div>" +  
                            "<div class=\x22col form-group\x22>" +
                                "<div class=\x22card\x22 style=\x22width:400px;\x22>" +
                                    "<div class=\x22card-header\x22>" +
                                        "Ambient Audio" + 
                                    "</div>" +
                                    "<img class=\x22card-img-top\x22 src=\x22" + ambientAudio.URLpng + "\x22 alt=\x22Card image cap\x22>" +
                                    "<div class=\x22card-img-overlay\x22>" +
                                        "<br><br><a href=\x22index.html?type=saudio&iid="+ ambientAudio._id +"\x22  class=\x22badge badge-pill badge-dark float-left\x22>" + ambientAudio.title + "</a>" +
                                    "</div>" +
                                    "<ul class=\x22list-group list-group-flush\x22>"+
                                        "<li class=\x22list-group-item\x22>"+
                                            ambientAudioButtons +
                                        "</li>"+
                                        "<li class=\x22list-group-item\x22>"+
                                        "<label for=\x22sceneAmbientAudioStreamURL\x22>Streaming URL</label>" + //sceneTitle
                                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sceneAmbientAudioStreamURL\x22 placeholder=\x22Enter Stream URL\x22 value=\x22" + sceneAmbientAudioStreamURL + "\x22 >" +
                                        "</li>"+
                                    "</ul>"+
                                "</div>" +
                            "</div>" +  
                            "<div class=\x22col form-group\x22>" +
                                "<div class=\x22card\x22 style=\x22width:400px;\x22>" +
                                    "<div class=\x22card-header\x22>" +
                                        "Trigger Audio" + 
                                    "</div>" +
                                    "<img class=\x22card-img-top\x22 src=\x22" + triggerAudio.URLpng + "\x22 alt=\x22Card image cap\x22>" +
                                    "<div class=\x22card-img-overlay\x22>" +
                                        "<br><br><a href=\x22index.html?type=saudio&iid="+ triggerAudio._id +"\x22  class=\x22badge badge-pill badge-dark float-left\x22>" + triggerAudio.title + "</a>" +
                                    "</div>" +
                                    "<ul class=\x22list-group list-group-flush\x22>" +
                                        "<li class=\x22list-group-item\x22>" +
                                            triggerAudioButtons +
                                        "</li>" +
                                        "<li class=\x22list-group-item\x22>" +
                                        "<label for=\x22sceneTriggerAudioStreamURL\x22>Streaming URL</label>" + 
                                        "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22sceneTriggerAudioStreamURL\x22 placeholder=\x22Enter Stream URL\x22 value=\x22" + sceneTriggerAudioStreamURL + "\x22 >" +
                                        "</li>" +
                                    "</ul>" +
                                "</div>" +
                            "</div>" + 
                            "</div>" +   
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneLoopPrimaryAudio\x22>Loop Primary</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneLoopPrimaryAudio\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAutoplayPrimaryAudio\x22>Autoplay Primary</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAutoplayPrimaryAudio\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22scenePrimaryAudioVisualizer\x22>Show Visualizer</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22scenePrimaryAudioVisualizer\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseMicrophoneInput\x22>Use Mic Input</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneUseMicrophoneInput\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAttachPrimaryAudioToTarget\x22>Attach to Target</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAttachPrimaryAudioToTarget\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22scenePrimaryAudioTriggerEvents\x22>Trigger Events</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22scenePrimaryAudioTriggerEvents\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                            "</div>" +  
                            "<hr/>" +
                "</div>" +
                            "<button id=\x22synthSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22 ><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Synth</h4>" +
                            "<hr/>" +  
                "<div style=\x22display:none;\x22 id=\x22synthSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22scenePrimarySynth1Volume\x22>Primary Synth 1 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22scenePrimarySynth1Volume\x22 value=\x22" + scenePrimarySynth1Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22scenePrimarySynth2Volume\x22>Primary Synth 2 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22scenePrimarySynth2Volume\x22 value=\x22" + scenePrimarySynth2Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22sceneAmbientSynth1Volume\x22>Ambient Synth 1 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneAmbientSynth1Volume\x22 value=\x22" + sceneAmbientSynth1Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22sceneAmbientSynth1Volume\x22>Ambient Synth 2 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneAmbientSynth2Volume\x22 value=\x22" + sceneAmbientSynth2Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22sceneTriggerSynth1Volume\x22>Trigger Synth 1 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneTriggerSynth1Volume\x22 value=\x22" + sceneTriggerSynth1Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                "<div class=\x22card\x22 style=\x22height:205px; width:175px;\x22>" +
                                    "<div class=\x22card-body\x22>" +  
                                        "<label for=\x22sceneTriggerSynth2Volume\x22>Trigger Synth 2 Volume</label>" + 
                                        "<input type=\x22text\x22 class=\x22knob\x22 data-width=125 data-min=-80 data-max=20 data-angleOffset=-125 data-angleArc=250 data-fgColor=\x22#3544b1\x22 data-rotation=\x22clockwise\x22 value=\x220\x22 id=\x22sceneTriggerSynth2Volume\x22 value=\x22" + sceneTriggerSynth2Volume + "\x22 >" +
                                        "</div>" +
                                        "</div>" +  
                                "</div>" + 
                            "</div>" +
                            "<div class=\x22form-row\x22>" +

                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22scenePrimaryPatch1\x22>Primary Synth #1</label>" + 
                                    "<select class=\x22form-control\x22 id=\x22scenePrimaryPatch1\x22 >" +
                                        returnPatches() +
                                    "</select>" +
                                "</div>" +
                                // "</div>" +  
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22scenePrimaryMidi1\x22>Midi File</label>" + 
                                    "<select class=\x22form-control\x22 id=\x22scenePrimaryMidi1\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGeneratePrimarySequences\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGeneratePrimarySequences\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22scenePrimarySequence1Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22scenePrimarySequence1Transpose\x22 value=\x22" + scenePrimarySequence1Transpose + "\x22 >" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +

                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneBPM\x22>BPM</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneBPM\x22 value=\x22" + sceneBPM + "\x22 >" +
                                "</div>" +   
                            "</div>" +       
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22scenePrimaryPatch2\x22>Primary Synth #2</label>" + 
                                        "<select class=\x22form-control\x22 id=\x22scenePrimaryPatch2\x22 >" +
                                            returnPatches() +
                                        "</select>" +
                                    "</div>" +
                                // "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22scenePrimaryMidi2\x22>Midi File</label>" + 
                                    "<select class=\x22form-control\x22 id=\x22scenePrimaryMidi2\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGeneratePrimarySequence2\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGeneratePrimarySequence2\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22scenePrimarySequence2Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22scenePrimarySequence2Transpose\x22 value=\x22" + scenePrimarySequence2Transpose + "\x22>" +
                                "</div>" + 
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneAmbientPatch1\x22>Ambient Synth #1</label>" + //FontSelect
                                        "<select class=\x22form-control\x22 id=\x22sceneAmbientPatch1\x22 >" +
                                            returnPatches() +
                                        "</select>" +
                                    "</div>" +
                                // "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneAmbientMidi1\x22>Midi File</label>" + //FontSelect
                                    "<select class=\x22form-control\x22 id=\x22sceneAmbientMidi1\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGenerateAmbientSequences\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGenerateAmbientSequences\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneAmbientSequence1Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22sceneAmbientPatch2\x22 id=\x22sceneAmbientSequence1Transpose\x22 value=\x22" + sceneAmbientSequence1Transpose + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAmbientSynth1ModulateByDistanceTarget\x22>Target Distance Mod</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAmbientSynth1ModulateByDistanceTarget\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAmbientSynth1ModulateByDistance\x22>Player Distance Mod</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAmbientSynth1ModulateByDistance\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                            "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneAmbientPatch2\x22>Ambient Synth #2</label>" + 
                                        "<select class=\x22form-control\x22 id=\x22sceneAmbientPatch2\x22 >" +
                                            returnPatches() +
                                        "</select>" +
                                    "</div>" +
                                // "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneAmbientMidi2\x22>Midi File</label>" + 
                                    "<select class=\x22form-control\x22 id=\x22sceneAmbientMidi2\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGenerateAmbientSequence2\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGenerateAmbientSequence2\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneAmbientSequence2Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneAmbientSequence2Transpose\x22 value=\x22" + sceneAmbientSequence2Transpose + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAmbientSynth2ModulateByDistanceTarget\x22>Target Distance Mod</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAmbientSynth2ModulateByDistanceTarget\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneAmbientSynth2ModulateByDistance\x22>Player Distance Mod</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneAmbientSynth2ModulateByDistance\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneTriggerPatch1\x22>Trigger Synth #1</label>" + //FontSelect
                                        "<select class=\x22form-control\x22 id=\x22sceneTriggerPatch1\x22 >" +
                                            returnPatches() +
                                        "</select>" +
                                    "</div>" +
                                // "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneTriggerMidi1\x22>Midi File</label>" + //FontSelect
                                    "<select class=\x22form-control\x22 id=\x22sceneTriggerMidi1\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGenerateTriggerSequences\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGenerateTriggerSequences\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneTriggerSequence1Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneTriggerSequence1Transpose\x22 value=\x22" + sceneTriggerSequence1Transpose + "\x22>" +
                                "</div>" + 
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneTriggerPatch2\x22>Trigger Synth #2</label>" + //FontSelect
                                        "<select class=\x22form-control\x22 id=\x22sceneTriggerPatch2\x22 >" +
                                            returnPatches() +
                                        "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneTriggerMidi2\x22>Midi File</label>" + //FontSelect
                                    "<select class=\x22form-control\x22 id=\x22sceneTriggerMidi2\x22 >" +
                                        returnMidis() +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneGenerateTriggerSequence2\x22>Generate</label><br>" + 
                                    "<input class=\x22float-right\x22 type=\x22checkbox\x22  id=\x22sceneGenerateTriggerSequence2\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\sceneTriggerSequence2Transpose\x22>Transpose</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\sceneTriggerSequence2Transpose\x22 value=\x22" + sceneTriggerSequence2Transpose + "\x22>" +
                                "</div>" + 

                            "</div>" +  
                            "<hr/>" +
                            "</div>" +
                            "<button id=\x22linksSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Web</h4>" +
                            "<hr/>" +  
                            "<div style=\x22display:none;\x22 id=\x22linksSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-5\x22>" +
                                    "<label for=\x22webLinkTitle\x22>Title</label>" + 
                                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22webLinkTitle\x22 placeholder=\x22Web Link Title\x22 >" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-5\x22>" +
                                    "<label for=\x22webLinkURL\x22>URL</label>" + 
                                    "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22webLinkURL\x22 placeholder=\x22Web Link URL\x22 >" +
                                    
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    // "<div class=\x22scrapeWeblink float-right\x22><button class=\x22btn btn-sm btn-info\x22>Scrape</button></div>" +
                                    "<div class=\x22scrapeWeblink float-right\x22><button class=\x22btn btn-sm btn-primary\x22>Add</button></div>" +
                                "</div>" +
                            "</div>" + 
                            "<div class=\x22form-row\x22>" +
                                sceneWeblinkPics +
                            "</div>" +
                            "<hr/>" +
                "</div>" +
                            "<button id=\x22colorsSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Colors</h4>" +
                            "<hr/>" +  
                "<div style=\x22display:none;\x22 id=\x22colorsSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneRandomizeColors\x22>Randomize Colors</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneRandomizeColors\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                    "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneTweakColors\x22>Anim/Tweak Colors</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneTweakColors\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
     
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneHighlightColor\x22>Highlight Color</label>" + 
                                    "<input id=\x22sceneHighlightColor\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneColor1\x22>Scene Color 1</label>" + 
                                    "<input id=\x22sceneColor1\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneColor2\x22>Scene Color 2</label>" + 
                                    "<input id=\x22sceneColor2\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22> " +
                                    "<label for=\x22sceneColor3\x22>Scene Color 3</label>" + 
                                    "<input id=\x22sceneColor3\x22 class=\x22form-control\x22 type=\x22color\x22>" +
                                "</div>" +
                            "</div>" +
                            "<hr/>" +
            "</div>" +
                            "<button id=\x22skySectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Sky</h4>" +
                            "<hr/>" +  
            "<div style=\x22display:none;\x22 id=\x22skySection\x22>" +
                            "<div class=\x22form-row\x22>" +
                               
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseDynamicSky\x22>Dynamic Sky</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseDynamicSky\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseDynamicShadows\x22>Dynamic Shadows</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseDynamicShadows\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseSkybox\x22>Use Skybox</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseSkybox\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneColorizeSky\x22>Colorize Sky</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneColorizeSky\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  

                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneSkyParticles\x22>Sky Particles</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneSkyParticles\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>None</option>" +
                                    "<option>Dust</option>" +
                                    "<option>Smoke</option>" +
                                    "<option>Lights</option>" +
                                    "</select>" +
                                "</div>" +
                            "</div>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneTime\x22>Time of Day</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneTime\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>morning</option>" +
                                    "<option>midday</option>" +
                                    "<option>afternoon</option>" +
                                    "<option>midnight</option>" +
                                    "<option>local</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneTimeSpeed\x22>Time Speed</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneTimeSpeed\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>slow</option>" +
                                    "<option>normal</option>" +
                                    "<option>fast</option>" +
                                    "<option>faster</option>" +
                                    "<option>fastest</option>" +
                                    "<option>fixed</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneWeather\x22>Precipitation</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneWeather\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "<option>rain</option>" +
                                    "<option>thunderstorm</option>" +
                                    "<option>sleet</option>" +
                                    "<option>hail</option>" +
                                    "<option>snow</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneClouds\x22>Clouds</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneClouds\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "<option>light</option>" +
                                    "<option>medium</option>" +
                                    "<option>heavy</option>" +
                                    "<option>storm</option>" +
                                    "</select>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneWindFactor\x22>Wind X</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneWindFactor\x22 value=\x22" + sceneWindFactor + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneLightningFactor\x22>Lightning X</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneLightningFactor\x22 value=\x22" + sceneLightningFactor + "\x22>" +
                                "</div>" + 
                            "</div>" +
                            "<div class=\x22form-row\x22>" +   
                            "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseDynCubeMap\x22>CubeMap Relections</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseDynCubeMap\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseSceneFog\x22>Scene Fog</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseSceneFog\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                // "<div class=\x22col form-group col-md-2\x22>" +
                                //     "<div class=\x22\x22><label for=\x22sceneUseGlobalFog\x22>Global Fog</label><br>" +
                                //     "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseGlobalFog\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                // "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseVolumetricFog\x22>Volumetric Fog</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseVolumetricFog\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseSunShafts\x22>Sun Shafts</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseSunShafts\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneGlobalFogDensity\x22>Fog Density</label>" +
                                    "<input type=\x22number\x22 step=\x220.001\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\sceneGlobalFogDensity\x22 value=\x22" + sceneGlobalFogDensity + "\x22>" +
                                "</div>" + 
                            "</div>" +
                            "<hr/>" +
            "</div>" +
                            "<button id=\x22groundSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Ground</h4>" +
                            "<hr/>" +  
            "<div style=\x22display:none;\x22 id=\x22groundSection\x22>" +
                            "<div class=\x22form-row\x22>" +  

                                // "<div class=\x22col form-group col-md-2\x22>" +
                                    // "<label for=\x22sceneGlobalFogDensity\x22>Water Level</label>" +
                                    // "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\sceneGlobalFogDensity\x22 value=\x22" + sceneGlobalFogDensity + "\x22>" +
                                // "</div>" + 
                            // "</div>" +  
                            // "<div class=\x22form-row\x22>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseMap\x22>Use Map</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseMap\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneMapType\x22>Map Type</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneMapType\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "<option>Streets</option>" +
                                    "<option>Satellite</option>" +
                                    "<option>Terrain</option>" +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneMapZoom\x22>Map Zoom</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22sceneMapZoom\x22 id=\x22sceneMapZoom\x22 value=\x22" + sceneMapZoom + "\x22>" +
                                "</div>" + 

                                "<div class=\x22col form-group col-md-2\x22>" +

                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseHeightmap\x22>Use Terrain Heightmap</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseHeightmap\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneHeightmapSelect\x22>Heightmaps</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneHeightmapSelect\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneHeightmap\x22>Heightmap </label>" +
                                    "<input type=\text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneHeightmap\x22 id=\x22sceneHeightmap\x22 value=\x22" + sceneHeightmap + "\x22>" +
                                "</div>" + 
                            "</div>" +  
                            "<div class=\x22form-row\x22>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseEnvironment\x22>Use Scene Asset Bundle</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseEnvironment\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneAssetBundleName\x22>Scene Asset Bundle Name</label>" +
                                    "<input type=\x22text\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\x22sceneAssetBundleName\x22 value=\x22" + sceneAssetBundleName + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneAssetBundleNameSelect\x22>Scene Asset Bundle</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneAssetBundleNameSelect\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "</select>" +
                                "</div>" +  

                                "<div class=\x22col form-group col-md-1\x22>" +
                                //spacer
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseFloorPlane\x22>Use Floorplane</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseFloorPlane\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneRenderFloorPlane\x22>Render Floorplane</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneRenderFloorPlane\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneFloorplaneTexture\x22>Floorplane Texture</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneFloorplaneTexture\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    // "<option>Water 1 (easy)</option>" +
                                    // "<option>Water 2 (medium)</option>" +
                                    // "<option>Ocean Water (medium)</option>" +
                                    // "<option>Fancy Water (heavy)</option>" +
                                    "</select>" +
                                "</div>" +  
                                // "<div class=\x22col form-group col-md-1\x22>" +
                                //     "<div class=\x22\x22><label for=\x22sceneUseUWFX\x22>Use UWFX</label><br>" +
                                //     "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseUWFX\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                // "</div>" + 
                                // "<div class=\x22col form-group col-md-2\x22>" +
                                //     "<label for=\x22sceneCameraPath\x22>Water Type</label>" +
                                //     "<select class=\x22form-control\x22 id=\x22sceneCameraPath\x22 >" +
                                //     "<option value=\x22\x22 disabled selected>Select:</option>" +
                                //     "<option>none</option>" +
                                //     "<option>Water 1 (easy)</option>" +
                                //     "<option>Water 2 (medium)</option>" +
                                //     "<option>Ocean Water (medium)</option>" +
                                //     "<option>Fancy Water (heavy)</option>" +
                                //     "</select>" +
                                // "</div>" +  
                                // "<div class=\x22col form-group col-md-1\x22>" +
                                //     "<label for=\x22sceneGlobalFogDensity\x22>Water Level</label>" +
                                //     "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22beatsPerMinute\x22 id=\sceneGlobalFogDensity\x22 value=\x22" + sceneGlobalFogDensity + "\x22>" +
                                // "</div>" + 

                            "</div>" +                 

                            "<div class=\x22form-row\x22>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseStaticObj\x22>Use Static Obj</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseStaticObj\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneStaticObjURL\x22>Obj URL</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneStaticObjURL\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneSelectObj\x22>Select Obj </label>" +
                                    "<input type=\text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneSelectObj\x22 id=\x22sceneSelectObj\x22 value=\x22" + sceneStaticObj + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                //spacer
                                "</div>" + 
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<div class=\x22\x22><label for=\x22sceneUseUWFX\x22>Use UWFX</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseUWFX\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneWater\x22>Water Type</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneWater\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select:</option>" +
                                    "<option>none</option>" +
                                    "<option>water1</option>" +
                                    "<option>water2</option>" +
                                    "<option>water3</option>" +
                                    "<option>water4</option>" +
                                    "</select>" +
                                "</div>" +  
                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneWaterLevel\x22>Water Level</label>" +
                                    "<input type=\x22number\x22 class=\x22form-control\x22 aria-describedby=\x22sceneWaterLevel\x22 id=\x22sceneWaterLevel\x22 value=\x22" + sceneWaterLevel + "\x22>" +
                                "</div>" + 
                            "</div>" +  
                            "<div class=\x22form-row\x22>" +  
                                "<div class=\x22col form-group col-md-3\x22>" +
                                    "<label for=\x22sceneWebXREnvironment\x22>WebXR Environment</label>" +
                                    "<select class=\x22form-control\x22 id=\x22sceneWebXREnvironment\x22 >" +
                                    "<option value=\x22\x22 disabled selected>Select Environment : </option>" +
                                    "<option>none</option>" +
                                    "<option>default</option>" +
                                    "<option>contact</option>" +
                                    "<option>egypt</option>" +
                                    "<option>checkerboard</option>" +
                                    "<option>forest</option>" +
                                    "<option>goaland</option>" +
                                    "<option>yavapai</option>" +
                                    "<option>goldmine</option>" +
                                    "<option>arches</option>" +
                                    "<option>threetowers</option>" +
                                    "<option>poison</option>" +
                                    "<option>tron</option>" +
                                    "<option>japan</option>" +
                                    "<option>dream</option>" +
                                    "<option>volcano</option>" +
                                    "<option>starry</option>" +
                                    "<option>osiris</option>" +
                                    "</select>" +
                                "</div>" +
                                // "<div class=\x22col form-group col-md-1\x22>" +
                                //     "<div class=\x22\x22><label for=\x22sceneUseDynCubeMap\x22>Dynamic CubeMap</label><br>" +
                                //     "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneUseDynCubeMap\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22></div>" +
                                // "</div>" + 
                            "</div>" +  
                            "<hr/>" +
            "</div>" +
            "<button id=\x22objectSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Objects</h4>" +
                            "<hr/>" +  
            "<div style=\x22display:none;\x22 id=\x22objectSection\x22>" +
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-4\x22>" +
                                objButtons +     
                                "</div>" + 
                                "<div class=\x22col form-group col-md-2\x22>" +
                                    "<label for=\x22sceneScatterObjects\x22>Scatter Objects</label><br>" +
                                    "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneScatterObjects\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22>" +
                                
                                "</div>" +
                                "<div class=\x22col form-group col-md-1\x22>" +
                                   
                                        // "<div class=\x22col form-group col-md-6\x22>" +
                                        "<label for=\x22sceneScatterOffset\x22>Scatter Offset</label>" +
                                        "<input type=\x22text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneScatterOffset\x22 id=\x22sceneScatterOffset\x22 value=\x22" + response.data.sceneScatterOffset + "\x22>" +
                                    // "</div>" + 
                                
                                    "</div>" + 
                                    "<div class=\x22col form-group col-md-5\x22>" +
                                    sceneObjs +   
                                    // "</div>" +
                                    // "<div class=\x22col form-group col-md-3\x22>" +
                                    sceneObjGroups +      

                                    "</div>" + 
                            "</div>" +
                            
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-11\x22> " +
                                "<label for=\x22scatterMeshLayerBtns\x22> Object Layers </label>" + //alignement
                                "<br><div id=\x22scatterMeshLayerBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                                    "<label class=\x22btn btn-light \x22>" +
                                    "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22picobj\x22 id=\x22sceneScatterObjectLayers.picobj\x22 autocomplete=\x22off\x22> Pictures " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22linkobj\x22 id=\x22sceneScatterObjectLayers.linkobj\x22 autocomplete=\x22off\x22> Links " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22textobj\x22 id=\x22sceneScatterObjectLayers.textobj\x22 autocomplete=\x22off\x22> Text " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22audioobj\x22 id=\x22sceneScatterObjectLayers.audioobj\x22 autocomplete=\x22off\x22> Audio " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22mediaobj\x22 id=\x22sceneScatterObjectLayers.mediaobj\x22 autocomplete=\x22off\x22> Video " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22keys\x22 id=\x22sceneScatterObjectLayers.keys\x22 autocomplete=\x22off\x22> Keys " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22doors\x22 id=\x22sceneScatterObjectLayers.doors\x22 autocomplete=\x22off\x22> Doors " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22mailboxes\x22 id=\x22sceneScatterObjectLayers.mailboxes\x22 autocomplete=\x22off\x22> Mailboxes " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22pickups\x22 id=\x22sceneScatterObjectLayers.pickups\x22 autocomplete=\x22off\x22> Pickups " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22drops\x22 id=\x22sceneScatterObjectLayers.drops\x22 autocomplete=\x22off\x22> Drops " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22players\x22 id=\x22sceneScatterObjectLayers.players\x22 autocomplete=\x22off\x22> Player Locs " +
                                    "</label>" +
                                    "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22characters\x22 id=\x22sceneScatterObjectLayers.characters\x22 autocomplete=\x22off\x22> Character Locs " +
                                    "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                        "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22waypoints\x22 id=\x22sceneScatterObjectLayers.waypoints\x22 autocomplete=\x22off\x22> Waypoint Locs " +
                                    "</label>" +
                                "</div>" +
                                // "</div>" +
                            "</div>" +

                                // "<div class=\x22form-row\x22>" +
                                //     "<div class=\x22col form-group col-md-6\x22>" +
                                //         "<label for=\x22sceneScatterOffset\x22>Scatter Offset</label>" +
                                //         "<input type=\x22text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneScatterOffset\x22 id=\x22sceneScatterOffset\x22 value=\x22" + response.data.sceneScatterOffset + "\x22>" +
                                //     "</div>" + 
                                // "</div>" +
                            "</div>" +
                            "<hr/>" +
                        "</div>" +
                            "<button id=\x22modelSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Models</h4>" +
                            "<hr/>" +  
            "<div style=\x22display:none;\x22 id=\x22modelSection\x22>" +
                            
                            "<div class=\x22form-row\x22>" +
                                "<div class=\x22col form-group col-md-4\x22>" +
                                modelButtons +     
                                "</div>" + 

                                "<div class=\x22col form-group col-md-2\x22>" +
                                   "<label for=\x22sceneScatterMeshes\x22>Scatter Models</label><br>" +
                                        "<input class=\x22\x22 type=\x22checkbox\x22  id=\x22sceneScatterMeshes\x22 data-toggle=\x22toggle\x22 data-size=\x22sm\x22 data-on=\x22<i class='fas fa-check'></i>\x22 data-off=\x22<i class='fas fa-times'></i>\x22 data-onstyle=\x22success\x22 data-offstyle=\x22danger\x22>" +  
                                    // "</div>" + 
                                    // // "<div class=\x22float-left\x22>"
                                    // "<label for=\x22sceneScatterOffset\x22>Scatter Offset</label>" +
                                    // "<input type=\x22text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneScatterOffset\x22 id=\x22sceneScatterOffset\x22 value=\x22" + response.data.sceneScatterOffset + "\x22>" +
                                    // "</div>" + 
                                "</div>" + 

                                "<div class=\x22col form-group col-md-1\x22>" +
                                    "<label for=\x22sceneScatterOffset\x22>Scatter Offset</label>" +
                                    "<input type=\x22text\x22 class=\x22form-control\x22 aria-describedby=\x22sceneScatterOffset\x22 id=\x22sceneScatterOffset\x22 value=\x22" + response.data.sceneScatterOffset + "\x22>" +
                                "</div>" + 
                                "<div class=\x22col form-group col-md-5\x22>" +
                                sceneMdls +
                                "</div>" +
                            "</div>" +

                            "<div class=\x22form-row\x22>" +

                                "<div class=\x22col form-group col-md-12\x22> " +
                                    "<label for=\x22scatterMeshLayerBtns\x22> Model Layers </label><br>" + 
                                    "<div id=\x22scatterMeshLayerBtns\x22 class=\x22btn-group btn-group-toggle flex-wrap\x22 data-toggle=\x22buttons\x22>" +
                                        "<label class=\x22btn btn-light \x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22crystal\x22 id=\x22sceneScatterMeshLayers.crystal\x22 autocomplete=\x22off\x22> Crystal " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22conifer\x22 id=\x22sceneScatterMeshLayers.conifer\x22 autocomplete=\x22off\x22> Conifers " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22rock\x22 id=\x22sceneScatterMeshLayers.rock\x22 autocomplete=\x22off\x22> Rocks " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22tree2\x22 id=\x22sceneScatterMeshLayers.tree2\x22 autocomplete=\x22off\x22> Oaks " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22redflower\x22 id=\x22sceneScatterMeshLayers.redflower\x22 autocomplete=\x22off\x22> Red Flowers " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22fern\x22 id=\x22sceneScatterMeshLayers.fern\x22 autocomplete=\x22off\x22> Ferns " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22grass1\x22 id=\x22sceneScatterMeshLayers.grass1\x22 autocomplete=\x22off\x22> Grass " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22bush\x22 id=\x22sceneScatterMeshLayers.bush\x22 autocomplete=\x22off\x22> Bushes " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22rock2\x22 id=\x22sceneScatterMeshLayers.rock2\x22 autocomplete=\x22off\x22> Moar Rocks " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22palm1\x22 id=\x22sceneScatterMeshLayers.palm1\x22 autocomplete=\x22off\x22> Palms " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22flower1\x22 id=\x22sceneScatterMeshLayers.flower1\x22 autocomplete=\x22off\x22> Flowers 1 " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22flower2\x22 id=\x22sceneScatterMeshLayers.flower2\x22 autocomplete=\x22off\x22> Flowers 2 " +
                                        "</label>" +
                                        "<label class=\x22btn btn-light\x22>" +
                                            "<input type=\x22checkbox\x22 name=\x22sceneMeshLayers\x22 value=\x22flower3\x22 id=\x22sceneScatterMeshLayers.flower3\x22 autocomplete=\x22off\x22> Flowers 3 " +
                                        "</label>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +

                                
                            // "</div>" + 
                            "<hr>" +
                "</div>" +
                "<button id=\x22locationsSectionButton\x22 class=\x22btn btn-sm btn-primary btn-circle btn-light float-left\x22><i class=\x22fas fa-plus-circle\x22></i> </button>" +
                            "<h4>Locations</h4>" +
                            "</hr>" +  
                "<div style=\x22display:none;\x22 id=\x22locationsSection\x22>" +
                            "<div class=\x22form-row\x22>" +  
                                // "<div class=\x22col form-group col-md-3\x22>" +
                                locationButtons +    
                                // sceneLocs +
                            "</div>" + 
                                // "<div class=\x22col form-group col-md-12\x22>" +
                                // locationButtons + 
                                sceneLocs +
                            // "<div class=\x22form-row\x22>" +    
                            //     sceneLocs +
                            //     "</div>" + 
                            
                            "</hr>" +
                            "</div>" +
                            extraButtons + 
                        "</form><br><br>" +
                        "</div>" +
                    "</div>" +                            
                "</div>" +
                "</div>" +
                "<pre>"+ keyValues(response.data) +"</pre>";
                // $("#cardrow").html(itemPics);
                $("#cardrow").html(card);
                //making sure both the app name and domain are set, some old records don't have name///
                if (sceneAppName == null || sceneAppName == undefined || sceneAppName == "") { 
                    if (sceneDomain != null && sceneDomain != undefined) {
                        for (let i = 0; i < apps.length; i++) {
                            if (sceneDomain == apps[i].appdomain) {
                                sceneAppName = apps[i].appname; //might catch it more than once, but whatever
                            }
                        }
                    }
                } else {
                    sceneAppName = response.data.sceneAppName;
                    if (sceneDomain == null || sceneDomain == undefined) {
                        for (let i = 0; i < apps.length; i++) {
                            if (response.data.sceneAppName == apps[i].appname) {
                                sceneDomain = apps[i].appdomain;
                            }
                        }
                    }
                }
                for (let i = 0; i < apps.length; i++) {
                    // console.log("app # " + i + " : " + JSON.stringify(apps[i]));
                    var x = document.getElementById("sceneAppNameSelect");//populate dropdown options (jquery method no workie!?)
                    var option = document.createElement("option");  
                    option.text = apps[i].appname;
                    if (sceneAppName == apps[i].appname) {
                        console.log("appname match! " + sceneAppName);
                        option.selected = true;
                        sceneDomain = apps[i].appdomain;
                    } 
                    x.add(option);
                }
                $("#sceneColor1").val(sceneColor1);
                $("#sceneColor2").val(sceneColor2);
                $("#sceneColor3").val(sceneColor3);
                $("#sceneFontFillColor").val(sceneFontFillColor);
                $("#sceneFontOutlineColor").val(sceneFontOutlineColor);
                $("#sceneFontGlowColor").val(sceneFontGlowColor);
                $("#sceneTextBackgroundColor").val(sceneTextBackgroundColor);

                $("#sceneText").val(sceneText);
                $("#sceneHighlightColor").val(sceneHighlightColor);
                // $("#sceneAppNameSelect").val(); //then pop the values if not new
                $("#sceneFontSelect").val(response.data.sceneFont);
                $("#sceneTypeSelect").val(response.data.sceneType);
                $("#sceneCameraPath").val(response.data.sceneCameraPath);
                $("#sceneCameraMode").val(response.data.sceneCameraMode);
                $("#sceneWater").val(response.data.sceneWater != null ? response.data.sceneWater.name : "");
                $("#sceneTime").val(response.data.sceneTime != null ? response.data.sceneTime.name : "");
                $("#sceneTimeSpeed").val(response.data.sceneTimeSpeed != null ? response.data.sceneTimeSpeed.name : "");
                $("#sceneWeather").val(response.data.sceneWeather != null ? response.data.sceneWeather.name : "");
                $("#sceneClouds").val(response.data.sceneClouds != null ? response.data.sceneClouds.name : "");
                $("#scenePrimaryPatch1").val(response.data.scenePrimaryPatch1);
                $("#scenePrimaryPatch2").val(response.data.scenePrimaryPatch2);
                $("#sceneAmbientPatch1").val(response.data.sceneAmbientPatch1);
                $("#sceneAmbientPatch2").val(response.data.sceneAmbientPatch2);
                $("#sceneTriggerPatch1").val(response.data.sceneTriggerPatch1);
                $("#sceneTriggerPatch2").val(response.data.sceneTriggerPatch2);
                $("#sceneWebXREnvironment").val(response.data.sceneWebXREnvironment);  //aframe enviro component

                // sceneFont : req.body.sceneFont,
                // sceneFontFillColor : req.body.sceneFontFillColor,
                // sceneFontOutlineColor : req.body.sceneFontOutlineColor,
                // sceneFontGlowColor : req.body.sceneFontGlowColor,
                // sceneTextBackground : req.body.sceneTextBackground,
                // sceneTextBackgroundColor : req.body.sceneTextBackgroundColor,
                // sceneText : req.body.sceneText, //this is "primary" tex
                // sceneTextLoop : req.body.sceneTextLoop != null ? req.body.sceneTextLoop : false, //also for "primary" text below
                // scenePrimaryTextFontSize : req.body.scenePrimaryTextFontSize != null ? req.body.scenePrimaryTextFontSize : "12",
                // scenePrimaryTextMode : req.body.scenePrimaryTextMode != null ? req.body.scenePrimaryTextMode : "Normal",
                // scenePrimaryTextAlign : req.body.scenePrimaryTextAlign != null ? req.body.scenePrimaryTextAlign : "Left",
                // scenePrimaryTextRotate : req.body.scenePrimaryTextRotate != null ? req.body.scenePrimaryTextRotate : false,
                // scenePrimaryTextScaleByDistance : req.body.scenePrimaryTextScaleByDistance != null ? req.body.scenePrimaryTextScaleByDistance : false,
                // sceneTextAudioSync : req.body.sceneTextAudioSync != null ? req.body.sceneTextAudioSync : false,
                $('#sceneIosOK').bootstrapToggle();
                if (response.data.sceneIosOK) {
                $('#sceneIosOK').bootstrapToggle('on');
                }
                $('#sceneAndroidOK').bootstrapToggle();
                if (response.data.sceneAndroidOK) {
                $('#sceneAndroidOK').bootstrapToggle('on');
                }
                $('#sceneWindowsOK').bootstrapToggle();
                if (response.data.sceneWindowsOK) {
                $('#sceneWindowsOK').bootstrapToggle('on');
                }
                $('#scenePublicToggle').bootstrapToggle();
                if (response.data.sceneShareWithPublic) {
                $('#scenePublicToggle').bootstrapToggle('on');
                }
                $('#sceneSubscriberToggle').bootstrapToggle();
                if (response.data.sceneShareWithSubscribers) {
                $('#sceneSubscriberToggle').bootstrapToggle('on');
                }
                $('#sceneRestrictToLocation').bootstrapToggle();
                if (response.data.sceneRestrictToLocation) {
                $('#sceneRestrictToLocation').bootstrapToggle('on');
                }
                $('#sceneFlyable').bootstrapToggle();
                if (response.data.sceneFlyable) {
                $('#sceneFlyable').bootstrapToggle('on');
                }
                $('#sceneFaceTracking').bootstrapToggle();
                if (response.data.sceneFaceTracking) {
                $('#sceneFaceTracking').bootstrapToggle('on');
                }
                $('#sceneHPlanesToggle').bootstrapToggle();
                if (response.data.sceneDetectHorizontalPlanes) {
                $('#sceneHPlanesToggle').bootstrapToggle('on');
                }
                $('#sceneVPlanesToggle').bootstrapToggle();
                if (response.data.sceneDetectVerticalPlanes) {
                $('#sceneVPlanesToggle').bootstrapToggle('on');
                }
                $('#sceneCameraLookAtNext').bootstrapToggle();
                if (response.data.sceneCameraLookAtNext) {
                $('#sceneCameraLookAtNext').bootstrapToggle('on');
                }
                $('#scenePrimaryAudioSync').bootstrapToggle();
                if (response.data.scenePrimaryAudioSync) {
                $('#scenePrimaryAudioSync').bootstrapToggle('on');
                }
                $('#sceneCameraOrientToPath').bootstrapToggle();
                if (response.data.sceneCameraOrientToPath) {
                $('#sceneCameraOrientToPath').bootstrapToggle('on');
                }
                $('#sceneRandomizeColors').bootstrapToggle();
                if (response.data.sceneRandomizeColors) {
                $('#sceneRandomizeColors').bootstrapToggle('on');
                }
                $('#sceneTweakColors').bootstrapToggle();
                if (response.data.sceneTweakColors) {
                $('#sceneTweakColors').bootstrapToggle('on');
                }
                $('#sceneColorizeSky').bootstrapToggle();
                if (response.data.sceneColorizeSky) {
                    $('#sceneColorizeSky').bootstrapToggle('on');
                }
                $('#sceneGeneratePrimarySequences').bootstrapToggle();
                if (response.data.sceneGeneratePrimarySequences) {
                    $('#sceneGeneratePrimarySequences').bootstrapToggle('on');
                }
                $('#sceneGeneratePrimarySequence2').bootstrapToggle();
                if (response.data.sceneGeneratePrimarySequence2) {
                    $('#sceneGeneratePrimarySequence2').bootstrapToggle('on');
                }
                $('#sceneGenerateAmbientSequences').bootstrapToggle();
                if (response.data.sceneGenerateAmbientSequences) {
                    $('#sceneGenerateAmbientSequences').bootstrapToggle('on');
                }
                $('#sceneGenerateAmbientSequence2').bootstrapToggle();
                if (response.data.sceneGenerateAmbientSequence2) {
                    $('#sceneGenerateAmbientSequence2').bootstrapToggle('on');
                }
                $('#sceneGenerateTriggerSequences').bootstrapToggle();
                if (response.data.sceneGenerateTriggerSequences) {
                    $('#sceneGenerateTriggerSequences').bootstrapToggle('on');
                }
                $('#sceneGenerateTriggerSequence2').bootstrapToggle();
                if (response.data.sceneGenerateTriggerSequence2) {
                    $('#sceneGenerateTriggerSequence2').bootstrapToggle('on');
                }
                $('#sceneAmbientSynth1ModulateByDistance').bootstrapToggle();
                if (response.data.sceneAmbientSynth1ModulateByDistance) {
                    $('#sceneAmbientSynth1ModulateByDistance').bootstrapToggle('on');
                }
                $('#sceneAmbientSynth1ModulateByDistanceTarget').bootstrapToggle();
                if (response.data.sceneAmbientSynth1ModulateByDistanceTarget) {
                    $('#sceneAmbientSynth1ModulateByDistanceTarget').bootstrapToggle('on');
                }
                $('#sceneAmbientSynth2ModulateByDistance').bootstrapToggle();
                if (response.data.sceneAmbientSynth2ModulateByDistance) {
                    $('#sceneAmbientSynth2ModulateByDistance').bootstrapToggle('on');
                }
                $('#sceneAmbientSynth2ModulateByDistanceTarget').bootstrapToggle();
                if (response.data.sceneAmbientSynth2ModulateByDistanceTarget) {
                    $('#sceneAmbientSynth2ModulateByDistanceTarget').bootstrapToggle('on');
                }
                $('#sceneUseDynamicSky').bootstrapToggle();
                if (response.data.sceneUseDynamicSky) {
                    $('#sceneUseDynamicSky').bootstrapToggle('on');
                }
                $('#sceneUseDynamicShadows').bootstrapToggle();
                if (response.data.sceneUseDynamicShadows) {
                    $('#sceneUseDynamicShadows').bootstrapToggle('on');
                }
                $('#sceneUseSkybox').bootstrapToggle();
                if (response.data.sceneUseSkybox) {
                    $('#sceneUseSkybox').bootstrapToggle('on');
                }
                $('#sceneUseSceneFog').bootstrapToggle();
                if (response.data.sceneUseSceneFog) {
                    $('#sceneUseSceneFog').bootstrapToggle('on');
                }
                // $('#sceneUseGlobalFog').bootstrapToggle();
                // if (response.data.sceneUseGlobalFog) {
                //     $('#sceneUseGlobalFog').bootstrapToggle('on');
                // }
                $('#sceneUseVolumetricFog').bootstrapToggle();
                if (response.data.sceneUseVolumetricFog) {
                    $('#sceneUseVolumetricFog').bootstrapToggle('on');
                }
                $('#sceneUseSunShafts').bootstrapToggle();
                if (response.data.sceneUseSunShafts) {
                    $('#sceneUseSunShafts').bootstrapToggle('on');
                }
                $('#sceneUseUWFX').bootstrapToggle();
                if (response.data.sceneWater != null && response.data.sceneWater.useUWFX) {
                    $('#sceneUseUWFX').bootstrapToggle('on');
                }
                $('#sceneUseDynCubeMap').bootstrapToggle();
                if (response.data.sceneUseDynCubeMap) {
                    $('#sceneUseDynCubeMap').bootstrapToggle('on');
                }
                $('#sceneUseMap').bootstrapToggle();
                if (response.data.sceneUseMap) {
                    $('#sceneUseMap').bootstrapToggle('on');
                }
                $('#sceneUseEnvironment').bootstrapToggle();
                if (response.data.sceneUseEnvironment) {
                    $('#sceneUseEnvironment').bootstrapToggle('on');
                }
                $('#sceneUseHeightmap').bootstrapToggle();
                if (response.data.sceneUseHeightmap) {
                    $('#sceneUseHeightmap').bootstrapToggle('on');
                }
                $('#sceneUseStaticObj').bootstrapToggle();
                if (response.data.sceneUseStaticObj) {
                    $('#sceneUseStaticObj').bootstrapToggle('on');
                }
                $('#sceneUseFloorPlane').bootstrapToggle();
                if (response.data.sceneUseFloorPlane) {
                    $('#sceneUseFloorPlane').bootstrapToggle('on');
                }
                $('#sceneRenderFloorPlane').bootstrapToggle();
                if (response.data.sceneRenderFloorPlane) {
                    $('#sceneRenderFloorPlane').bootstrapToggle('on');
                }
                $('#sceneScatterMeshes').bootstrapToggle();
                if (response.data.sceneScatterMeshes) {
                    $('#sceneScatterMeshes').bootstrapToggle('on');
                }
                $('#sceneScatterObjects').bootstrapToggle();
                if (response.data.sceneScatterObjects) {
                    $('#sceneScatterObjects').bootstrapToggle('on');
                }
                if (sceneNetworking) {
                    let selection = document.getElementById(sceneNetworking); //radio
                    $(selection).closest('.btn').button('toggle');
                }                
                if (scenePrimaryTextAlign) {
                    let selection = document.getElementById(scenePrimaryTextAlign); //radio
                    $(selection).closest('.btn').button('toggle');
                }
                if (scenePrimaryTextMode) {
                    let selection = document.getElementById(scenePrimaryTextMode); //radio
                    $(selection).closest('.btn').button('toggle');
                }
                if (response.data.sceneScatterMeshLayers != undefined) {
                    if (response.data.sceneScatterMeshLayers.crystal) {
                        let selection = document.getElementById('sceneScatterMeshLayers.crystal');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.conifer) {
                        let selection = document.getElementById('sceneScatterMeshLayers.conifer');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.rock) {
                        let selection = document.getElementById('sceneScatterMeshLayers.rock');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.tree2) {
                        let selection = document.getElementById('sceneScatterMeshLayers.tree2');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.redflower) {
                        let selection = document.getElementById('sceneScatterMeshLayers.redflower');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.fern) {
                        let selection = document.getElementById('sceneScatterMeshLayers.fern');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.grass1) {
                        let selection = document.getElementById('sceneScatterMeshLayers.grass1');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.bush) {
                        let selection = document.getElementById('sceneScatterMeshLayers.bush');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.rock2) {
                        let selection = document.getElementById('sceneScatterMeshLayers.rock2');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.palm1) {
                        let selection = document.getElementById('sceneScatterMeshLayers.palm1');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterMeshLayers.flower1) {
                        let selection = document.getElementById('sceneScatterMeshLayers.flower1');
                        $(selection).closest('.btn').button('toggle');
                    }                
                    if (response.data.sceneScatterMeshLayers.flower2) {
                        let selection = document.getElementById('sceneScatterMeshLayers.flower2');
                        $(selection).closest('.btn').button('toggle');
                    }                
                    if (response.data.sceneScatterMeshLayers.flower3) {
                        let selection = document.getElementById('sceneScatterMeshLayers.flower3');
                        $(selection).closest('.btn').button('toggle');
                    }
                }
                if (response.data.sceneScatterObjectLayers != undefined) {
                    if (response.data.sceneScatterObjectLayers.picobj) {
                        let selection = document.getElementById('sceneScatterObjectLayers.picobj');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.linkobj) {
                        let selection = document.getElementById('sceneScatterObjectLayers.linkobj');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.textobj) {
                        let selection = document.getElementById('sceneScatterObjectLayers.textobj');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.audioobj) {
                        let selection = document.getElementById('sceneScatterObjectLayers.audioobj');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.mediaobj) {
                        let selection = document.getElementById('sceneScatterObjectLayers.mediaobj');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.keys) {
                        let selection = document.getElementById('sceneScatterObjectLayers.keys');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.doors) {
                        let selection = document.getElementById('sceneScatterObjectLayers.doors');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.mailboxes) {
                        let selection = document.getElementById('sceneScatterObjectLayers.mailboxes');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.pickups) {
                        let selection = document.getElementById('sceneScatterObjectLayers.pickups');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.drops) {
                        let selection = document.getElementById('sceneScatterObjectLayers.drops');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.players) {
                        let selection = document.getElementById('sceneScatterObjectLayers.players');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.characters) {
                        let selection = document.getElementById('sceneScatterObjectLayers.characters');
                        $(selection).closest('.btn').button('toggle');
                    }
                    if (response.data.sceneScatterObjectLayers.waypoints) {
                        let selection = document.getElementById('sceneScatterObjectLayers.waypoints');
                        $(selection).closest('.btn').button('toggle');
                    }
                }

                ////////////////////////////////////////////////
                $(function() { // document.ready  //populate the gltf dropdown
                axios.get('/gltf/' + userid) //populate gltfs (old way)
                .then(function (response) {
                    // console.log("gltfs " + JSON.stringify(response));
                    for (let l = 0; l < sceneLocations.length; l++) {
                        const x = document.getElementById("gltfSelect_" + sceneLocations[l].timestamp);
                        for (let i = 0; i < response.data.gltfItems.length; i++) {
                            var option = document.createElement("option"); 
                            option.text = response.data.gltfItems[i].name;
                            if (response.data.gltfItems[i].name == sceneLocations[l].gltf) {
                                console.log("gotsa match for location gltf: " + sceneLocations[l].gltf);
                                // console.log("tryna select option for AssetBundleName " + name);
                                option.selected = true;
                            } 
                            x.add(option);
                            }
                        }
                    })//end of main fetch
                    .then(function() { //populate models from db
                        if (sceneModelz != null && sceneModelz != undefined && sceneModelz.length > 0) {

                            // console.log(JSON.stringify(sceneModelz));
                            for (let h = 0; h < sceneLocations.length; h++) {
                                const y = document.getElementById("modelSelect_" + sceneLocations[h].timestamp);
                                for (let j = 0; j < sceneModelz.length; j++) {
                                    // console.log(sceneModelz[j].name);
                                    if (sceneModelz[j].name != undefined) {
                                    var option = document.createElement("option"); 
                                    option.text = sceneModelz[j].name;
                                    option.value = sceneModelz[j]._id;
                                    if (sceneModelz[j].name == sceneLocations[h].model) {
                                        option.selected = true;
                                    } 
                                    y.add(option);
                                    }
                                }
                            }
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                    axios.get('/get_userassets/' + userid)
                    .then(function (response) {
                        let resp = JSON.stringify(response);
                        let json = JSON.parse(resp);
                        // console.log("assets: " + JSON.stringify(json));
                        let nameArray = new Array();
                        json.data.forEach(element => {
                            if (element.scenes_ios != undefined) {
                                for (let i = 0; i < element.scenes_ios.length; i++) {
                                    const name = element.scenes_ios[i].name;
                                    if (nameArray.indexOf(name) == -1) {
                                    nameArray.push(name);
                                    // console.log(name);
                                    const x = document.getElementById("sceneAssetBundleNameSelect");// maybe should not do dom-fu in a loop like this...
                                    var option = document.createElement("option"); 
                                    option.text = name;
                                    if (name == sceneAssetBundleName) {
                                        // console.log("tryna select option for AssetBundleName " + name);
                                        option.selected = true;
                                    } 
                                    x.add(option);
                                    }
                                }
                            }
                        });
                    })
                    .then(function() {
                        $("#sceneAssetBundleNameSelect").val(sceneAssetBundleName);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                    $(document).on('click','.clearScenePrimaryAudio',function(e) {
                        e.preventDefault();  
                        console.log("tryna rem scenePrimaryAudio");
                        scenePrimaryAudioID = "";
                    });                     
                    $(document).on('click','.generateLandingPage',function(e) {
                        e.preventDefault();  
                        axios.get('/update_public_scene/' + response.data._id)
                        .then(function (response) {
                            if (response.data.includes("generated")) {
                                $("#topSuccess").html("Landing Page was Successfully Generated!");
                                $("#topSuccess").show();
                            } else {
                                $("#topAlert").html("wrongness: " + response);
                                $("#topAlert").show();
                            }
                        }) //end of main fetch
                        .catch(function (error) {
                            console.log(error);
                            $("#topAlert").html(error);
                            $("#topAlert").show();
                        });
                    }); 
                    $(document).on('click','.generateWebXRPage',function(e){
                        e.preventDefault();  
                        axios.get('/update_aframe_scene/' + response.data._id)
                        .then(function (response) {
                            if (response.data.includes("generated")) {
                                $("#topSuccess").html("WebXR Page was Successfully Generated!");
                                $("#topSuccess").show();
                            } else {
                                $("#topAlert").html("wrongness: " + JSON.stringify(response));
                                $("#topAlert").show();
                            }
                        }) //end of main fetch
                        .catch(function (error) {
                            console.log(error);
                            $("#topAlert").html(error);
                            $("#topAlert").show();
                        });
                    }); 
                    $(document).on('click', '.scrapeWeblink', function(e) {
                        e.preventDefault();  
                        var stump = {};
                        let title = document.getElementById("webLinkTitle").value;
                        let link = document.getElementById("webLinkURL").value;
                        stump.link_title = title;
                        stump.link_url = link;
                        stump.sceneID = response.data._id;
                        console.log("tryna add scene weblink" + stump.sceneID);
                        axios.post('/weblink/', stump)
                            .then(function (response) {
                                console.log(response);
                                if (response.data != "ok") {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                } else {
                                    $("#topSuccess").html(response.data);
                                    $("#topSuccess").show();
                                    window.location.reload();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                                $("#topAlert").html(error);
                                $("#topAlert").show();
                        });

                    });
                    $(document).on('click','#optionsSectionButton',function(e){
                        e.preventDefault();  
                        $("#optionsSection").toggle();
                    }); 
                    $(document).on('click','#cameraSectionButton',function(e){
                        e.preventDefault();  
                        $("#cameraSection").toggle();
                    }); 
                    $(document).on('click','#picturesSectionButton',function(e){
                        e.preventDefault();  
                        $("#picturesSection").toggle();
                    }); 
                    $(document).on('click','#videoSectionButton',function(e){
                        e.preventDefault();  
                        $("#videoSection").toggle();
                    }); 
                    $(document).on('click','#textSectionButton',function(e){
                        e.preventDefault();  
                        $("#textSection").toggle();
                    }); 
                    $(document).on('click','#audioSectionButton',function(e){
                        e.preventDefault();  
                        $("#audioSection").toggle();
                    }); 
                    $(document).on('click','#synthSectionButton',function(e){
                        e.preventDefault();  
                        $("#synthSection").toggle();
                    }); 
                    $(document).on('click','#linksSectionButton',function(e){
                        e.preventDefault();  
                        $("#linksSection").toggle();
                    }); 
                    $(document).on('click','#colorsSectionButton',function(e){
                        e.preventDefault();  
                        $("#colorsSection").toggle();
                    }); 
                    $(document).on('click','#skySectionButton',function(e){
                        e.preventDefault();  
                        $("#skySection").toggle();
                    }); 
                    $(document).on('click','#groundSectionButton',function(e){
                        e.preventDefault();  
                        $("#groundSection").toggle();
                    }); 
                    $(document).on('click','#objectSectionButton',function(e){
                        e.preventDefault();  
                        $("#objectSection").toggle();
                    }); 
                    $(document).on('click','#modelSectionButton',function(e){
                        e.preventDefault();  
                        $("#modelSection").toggle();
                    });
                    $(document).on('click','#locationsSectionButton',function(e){
                        e.preventDefault();  
                        $("#locationsSection").toggle();
                    });
                    $(document).on('click','#showHideAll',function(e){
                        $("#optionsSection").toggle();
                        $("#cameraSection").toggle();
                        $("#picturesSection").toggle();
                        $("#videoSection").toggle();
                        $("#textSection").toggle();
                        $("#audioSection").toggle();
                        $("#synthSection").toggle();
                        $("#linksSection").toggle();
                        $("#colorsSection").toggle();
                        $("#skySection").toggle();
                        $("#groundSection").toggle();
                        $("#objectSection").toggle();
                        $("#locationsSection").toggle();
                    }); 

                    $(document).on('click','#addTagButton',function(e){
                        e.preventDefault();  
                        let newTag = document.getElementById("addTagInput").value;
                        console.log("tryna add tag " + newTag);
                        let html = "";
                        sceneTags.push(newTag);
                        for (let i = 0; i < sceneTags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+sceneTags[i]+"\x22 type=\x22button\x22 class=\x22remTagButton badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+sceneTags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                    }); 
                    $(document).on('click','.remTagButton',function(e){
                        e.preventDefault();  
                        console.log("tryna remove tag " + this.id);
                        let html = "";
                        for( var i = 0; i < sceneTags.length; i++){ 
                            if ( sceneTags[i] === this.id) {
                                sceneTags.splice(i, 1); 
                            }
                         }
                        for (let i = 0; i < sceneTags.length; i++) {
                            html = html + 
                            "<div class=\x22btn btn-light\x22>" +   
                                "<button id=\x22"+sceneTags[i]+"\x22 type=\x22button\x22 class=\x22badge badge-sm badge-danger float-right\x22>X</button>" +
                                "<span class=\x22badge badge-pill badge-light float-left badge-sm\x22>\x22"+sceneTags[i]+"\x22</span>" +
                            "</div>";
                        }
                        $("#tagDisplay").empty();
                        $("#tagDisplay").html(html);
                    }); 

                    // $(document).on('click','.remSceneVid',function(e){ //redundant
                    //     e.preventDefault();  
                    //     console.log("tryna remove pictureGroup " + this.id);
                    //     for( var i = 0; i < pictures.length; i++){ 
                    //         if ( pictures[i] === this.id) {
                    //             pictures.splice(i, 1); 
                    //         }
                    //     }
                    //     const id = "#" + this.id;
                    //     $(id).parent().parent().hide();
                    // });  
                    $(document).on('click','.refWeblink',function(e){
                        e.preventDefault();  
                        console.log("tryna refresh weblink " + this.id);
                        for( var i = 0; i < sceneWebLinks.length; i++){ 
                            if ( sceneWebLinks[i] === this.id) {
                                console.log('gotsa match to refreshWeblink ' + this.id);

                                var stump = {};
                                // let title = document.getElementById("webLinkTitle").value;
                                // let link = document.getElementById("webLinkURL").value;
                                // stump.link_title = title;
                                // stump.link_url = link;
                                stump.sceneID = response.data._id;
                                console.log("tryna add scene weblink" + stump.sceneID);
                                axios.post('/update_weblink/', stump)
                                .then(function (response) {
                                    console.log(response);
                                    if (response.data != "ok") {
                                        $("#topAlert").html(response.data);
                                        $("#topAlert").show();
                                        // window.location.href=sceneWebLinks.link_url;
                                        // window.open(sceneWebLinks.link_url, '_blank');
                                    } else {
                                        $("#topSuccess").html(response.data);
                                        $("#topSuccess").show();
                                        // window.location.reload();
                                    }
                                })                      
                                .catch(function (error) {
                                    console.log(error);
                                    $("#topAlert").html(error);
                                    $("#topAlert").show();
                                });
                            }
                        }
                    }); 
                    $(document).on('click','.remWeblink',function(e){
                        e.preventDefault();  
                        console.log("tryna remove weblink " + this.id);
                        for( var i = 0; i < sceneWebLinks.length; i++){ 
                            if ( sceneWebLinks[i] === this.id) {
                                console.log('gotsa match to remWeblink ' + this.id);
                                sceneWebLinks.splice(i, 1); 
                                
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().parent().hide(); //not grandparent!
                    }); 
                    $(document).on('click','.remSceneModel',function(e){
                        e.preventDefault();  
                        console.log("tryna remove sceneModel " + this.id);
                        for( var i = 0; i < sceneModels.length; i++){ 
                            if ( sceneModels[i] === this.id) {
                                sceneModels.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().hide(); //not grandparent!
                    }); 
                    $(document).on('click','.remScenePic',function(e){
                        e.preventDefault();  
                        console.log("tryna remove scenePic " + this.id);
                        for( var i = 0; i < pictures.length; i++){ 
                            if ( pictures[i] === this.id) {
                                pictures.splice(i, 1); 
                            }
                        }
                        for( var i = 0; i < scenePictures.length; i++){ 
                            if ( scenePictures[i] === this.id) {
                                scenePictures.splice(i, 1); 
                            }
                        }
                        for( var i = 0; i < response.data.postcards.length; i++){ 
                            if ( response.data.postcards[i] === this.id) {
                                response.data.postcards.splice(i, 1); 
                            }
                        }
                        for( var i = 0; i < scenePostcards.length; i++){ 
                            if ( scenePostcards[i] === this.id) {
                                scenePostcards.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().parent().hide();
                        // console.log("pictures: " + JSON.stringify(pictures));
                    }); 
                    $(document).on('click','.remSceneVid',function(e){
                        e.preventDefault();  
                        console.log("tryna remove sceneVid " + this.id);
                        for( var i = 0; i < sceneVideos.length; i++){ 
                            if ( sceneVideos[i] === this.id) {
                                sceneVideos.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().parent().hide();
                    }); 
                    $(document).on('click','.remSceneLocation',function(e){
                        e.preventDefault();  
                        console.log("tryna remove sceneLocations " + this.id);
                        // for( var i = 0; i < sceneLocations.length; i++){ 
                        //     if ( sceneLocations[i] === this.id) {
                                sceneLocations.splice(this.id, 1); 
                        //     }
                        // }
                        const id = "#" + this.id;
                        $(id).parent().parent().hide();
                    }); 
                    $(document).on('click','.remYouTube',function(e){
                        e.preventDefault();  
                        console.log("tryna remove youtube " + this.id);
                        for( var i = 0; i < sceneYouTubeIDs.length; i++){ 
                            if ( sceneYouTubeIDs[i] === this.id) {
                                sceneYouTubeIDs.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().parent().hide();
                    });  
                    $(document).on('click','.remPicGroup',function(e){
                        e.preventDefault();  
                        console.log("tryna remove pictureGroup " + this.id);
                        for( var i = 0; i < scenePictureGroups.length; i++){ 
                            if ( scenePictureGroups[i] === this.id) {
                                scenePictureGroups.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().hide();
                    });  
                    $(document).on('click','.remVidGroup',function(e){
                        e.preventDefault();  
                        console.log("tryna remove vidGroup " + this.id);
                        for( var i = 0; i < sceneVideoGroups.length; i++){ 
                            if ( sceneVideoGroups[i] === this.id) {
                                sceneVideoGroups.splice(i, 1); 
                            }
                        }
                        const id = "#" + this.id;
                        $(id).parent().hide();
                    });
                    $('#textAlignBtns .btn').on('click', function(event) {
                        event.preventDefault();  
                        var val = $(this).find('input').val();
                        scenePrimaryTextAlign = val;
                        console.log(scenePrimaryTextAlign);
                    });
                    $('#networkingBtns .btn').on('click', function(event) {
                        event.preventDefault();  
                        var val = $(this).find('input').val();
                        sceneNetworking = val;
                        console.log(sceneNetworking);
                    });
                    $('#textModeBtns .btn').on('click', function(event) {
                        event.preventDefault();  
                        var val = $(this).find('input').val();
                        scenePrimaryTextMode = val;
                        console.log(scenePrimaryTextMode);
                    });

                    $('#scenePublicToggle').bootstrapToggle();
                    $('#sceneSubscriberToggle').bootstrapToggle();
                    $('#sceneHPlanesToggle').bootstrapToggle();
                    $('#sceneVPlanesToggle').bootstrapToggle();
                    $('#sceneUseThreeDeeText').bootstrapToggle();
                    if (response.data.sceneUseThreeDeeText) {
                        $('#sceneUseThreeDeeText').bootstrapToggle('on');
                    }
                    $('#sceneTextLoop').bootstrapToggle();
                    if (response.data.sceneTextLoop) {
                        $('#sceneTextLoop').bootstrapToggle('on');
                    }
                    $('#sceneTextAudioSync').bootstrapToggle();
                    if (response.data.sceneTextAudioSync) {
                        $('#sceneTextAudioSync').bootstrapToggle('on');
                    }
                    $('#scenePrimaryTextRotate').bootstrapToggle(); //billboard
                    if (response.data.scenePrimaryTextRotate) {
                        $('#scenePrimaryTextRotate').bootstrapToggle('on');
                    }
                    $('#scenePrimaryTextScaleByDistance').bootstrapToggle();
                    if (response.data.scenePrimaryTextScaleByDistance) {
                        $('#scenePrimaryTextScaleByDistance').bootstrapToggle('on');
                    }
                    // $('#sceneDistanceScaling').bootstrapToggle();
                    $('#sceneLoopPrimaryAudio').bootstrapToggle();
                    if (response.data.sceneLoopPrimaryAudio) {
                        $('#sceneLoopPrimaryAudio').bootstrapToggle('on');
                    }
                    $('#sceneAutoplayPrimaryAudio').bootstrapToggle();
                    if (response.data.sceneAutoplayPrimaryAudio) {
                        $('#sceneAutoplayPrimaryAudio').bootstrapToggle('on');
                    }
                    $('#scenePrimaryAudioVisualizer').bootstrapToggle();
                    if (response.data.scenePrimaryAudioVisualizer) {
                        $('#scenePrimaryAudioVisualizer').bootstrapToggle('on');
                    }
                    $('#sceneUseMicrophoneInput').bootstrapToggle();
                    if (response.data.sceneUseMicrophoneInput) {
                        $('#sceneUseMicrophoneInput').bootstrapToggle('on');
                    }
                    $('#sceneAttachPrimaryAudioToTarget').bootstrapToggle();
                    if (response.data.sceneAttachPrimaryAudioToTarget) {
                        $('#sceneAttachPrimaryAudioToTarget').bootstrapToggle('on');
                    }
                    $('#scenePrimaryAudioTriggerEvents').bootstrapToggle();
                    if (response.data.scenePrimaryAudioTriggerEvents) {
                        $('#scenePrimaryAudioTriggerEvents').bootstrapToggle('on');
                    }
                    $("#sceneMasterAudioVolume").knob({
                    }).val(0).trigger('change');
                    $("#scenePrimaryVolume").knob({
                    }).val(0).trigger('change');
                    $("#sceneAmbientVolume").knob({
                    }).val(0).trigger('change');
                    $("#sceneTriggerVolume").knob({
                    }).val(0).trigger('change');
                    $("#sceneWeatherAudioVolume").knob({
                    }).val(0).trigger('change');
                    $("#sceneMediaAudioVolume").knob({
                    }).val(0).trigger('change');
                    $("#scenePrimarySynth1Volume").knob({
                    }).val(0).trigger('change');
                    $("#scenePrimarySynth2Volume").knob({
                    }).val(0).trigger('change');
                    $("#sceneAmbientSynth1Volume").knob({
                    }).val(0).trigger('change');
                    $("#sceneAmbientSynth2Volume").knob({
                    }).val(0).trigger('change');
                    $("#sceneTriggerSynth1Volume").knob({
                    }).val(0).trigger('change');
                    $("#sceneTriggerSynth2Volume").knob({
                    }).val(0).trigger('change');

                    //prompt to import an object and attach to this location
                    $(document).on('change', '.locationObjectTypeSelect', function() {
                        console.log(this.id + " value " + this.value);
                            let typesplit = (this.id).split("_");
                            let _id = typesplit[1]; 
                            let type = "";
                            let locObjs = "";
                            console.log("locobjID : " + _id); 
                            for (let s = 0; s < sceneLocations.length; s++) {   
                                if (_id == sceneLocations[s].timestamp) {
                                    sceneLocations[s].markerType = this.value;
                                    console.log("markertype set " + sceneLocations[s].markerType);
                                }
                            }
                            // if (this.value != "gltf") {
                                for (let s = 0; s < sceneObjex.length; s++) {  
                                    console.log(this.value +" vs "+ sceneObjex[s].objtype); 
                                    if (this.value == sceneObjex[s].objtype) {
                                        locObjs = locObjs +
                                        "<div class=\x22btn btn-secondary btn-sm\x22><a style=\x22color:white;\x22 target=\x22_blank\x22 role=\x22button\x22" +
                                        "href=\x22index.html?type=object&iid="+ sceneObjex[s]._id +"\x22>" +
                                        "object :<strong> " + sceneObjex[s].name + 
                                        "&nbsp;</strong>type: "+sceneObjex[s].objtype+"&nbsp;</a><button type=\x22button\x22 class=\x22remSceneObject badge badge-xs badge-danger float-right\x22 id=\x22sceneObject_"+ sceneObjex[s]._id +"\x22>X</button></div>";
                                    } 
                                }
                                if (locObjs == "") {
                                    locObjs = "No objects of type <strong>'" + this.value + "'</strong> have yet been selected." +
                                    "<br><a class=\x22btn btn-sm btn-primary\x22 href=\x22index.html?type=objects\x22>Select</a>";
                                }
                            $("#locationObjects_" + _id).html(locObjs);
                    });
                    $(document).on('change', '#sceneAppNameSelect', function() {
                        // console.log("sceneAppNameSelect change : "+ this.value);
                        for (let i = 0; i < apps.length; i++) {
                            if (this.value == apps[i].appname) {
                                console.log("appname match! " + this.value);  
                                sceneDomain = apps[i].appdomain;
                                sceneAppName = this.value;
                            } 
                        }
                    });
                    $(document).on('change', '.modelSelector', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp)   {
                                sceneLocations[s].model = $(this).find('option:selected').text();
                                sceneLocations[s].modelID = this.value;

                                console.log("location gltf set " + $(this).find('option:selected').text());
                            }
                        }
                    });
                    $(document).on('change', '.gltfSelector', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp)   {
                                sceneLocations[s].gltf = this.value;
                                console.log("location gltf set " + sceneLocations[s].gltf);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectX', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].x = this.value;
                                console.log("location x set " + sceneLocations[s].x);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectY', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid== sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].y = this.value;
                                console.log("location x set " + sceneLocations[s].y);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjGeoElevation', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid== sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].elevation = this.value;
                                console.log("locationObjectGeoElevation set " + sceneLocations[s].elevation);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjLatitude', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid== sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].latitude = this.value;
                                console.log("locationObjLatitude set " + sceneLocations[s].latitude);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjLongitude', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid== sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].longitude = this.value;
                                console.log("locationObjLongitude set " + sceneLocations[s].latitude);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectZ', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].z = this.value;
                                console.log("location x set " + sceneLocations[s].z);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectRotX', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].eulerx = this.value;
                                console.log("rotation x set " + sceneLocations[s].eulerx);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectRotY', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].eulery = this.value;
                                console.log("rotation y set " + sceneLocations[s].eulery);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectRotZ', function() {
                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].eulerz = this.value;
                                console.log("rotation z set " + sceneLocations[s].eulerz);
                            }
                        }
                    });
                    $(document).on('change', '.locationObjectScale', function() {

                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].markerObjScale = this.value;
                                console.log("scale set " + JSON.stringify(sceneLocations[s]));
                            }
                        }
                    });
                    $(document).on('change', '.locationEventData', function() {

                        for (let s = 0; s < sceneLocations.length; s++) {   
                            let locid = this.id.split("_")[1];
                            if (locid == sceneLocations[s].timestamp || this.id == sceneLocations[s].timestamp) {
                                sceneLocations[s].eventData = this.value;
                                console.log("eventData set " + JSON.stringify(sceneLocations[s]));
                            }
                        }
                    });
                    $('#updateSceneForm').on('submit', function(e) { //reuse same names as above, for convenience
                        e.preventDefault();  
                        let sceneTitle = document.getElementById("sceneTitle").value;
                        // let sceneAppName = document.getElementById("sceneAppNameSelect").value;
                        // let sceneDomain = document.getElementById("sceneAppNameSelect").value;
                        // let appName = document.getElementById("sceneAppNameSelect").value;
                        // let scenePictureGroups
                        let sceneType = document.getElementById("sceneTypeSelect").value;
                        let sceneCameraPath = document.getElementById("sceneCameraPath").value;
                        let sceneCameraMode = document.getElementById("sceneCameraMode").value;

                        let sceneShareWithPublic = document.getElementById("scenePublicToggle").checked;
                        let sceneShareWithSubscribers = document.getElementById("sceneSubscriberToggle").checked;

                        let sceneKeynote = document.getElementById("sceneKeynote").value;
                        let sceneDescription = document.getElementById("sceneDescription").value;
                        let sceneNextScene = document.getElementById("sceneNextScene").value;
                        let scenePreviousScene = document.getElementById("scenePreviousScene").value;
                        let sceneStickyness = document.getElementById("sceneStickyness").value;
                        let sceneText = document.getElementById("sceneText").value;
                        let scenePrimaryAudioTitle = document.getElementById("scenePrimaryAudioTitle").value;
                        let scenePrimaryAudioStreamURL = document.getElementById("scenePrimaryAudioStreamURL").value;
                    
                        // let scenePrimaryAudioID = scenePrimaryAudioID;
                        let sceneBPM = document.getElementById("sceneBPM").value;
                        let scenePrimaryVolume = document.getElementById("scenePrimaryVolume").value;
                        let sceneAmbientVolume = document.getElementById("sceneAmbientVolume").value;
                        let sceneTriggerVolume = document.getElementById("sceneTriggerVolume").value;
                        let sceneWeatherAudioVolume = document.getElementById("sceneWeatherAudioVolume").value;
                        let sceneMediaAudioVolume = document.getElementById("sceneMediaAudioVolume").value;
                        let sceneMasterAudioVolume = document.getElementById("sceneMasterAudioVolume").value;
                        let scenePrimarySynth1Volume = document.getElementById("scenePrimarySynth1Volume").value;
                        let scenePrimarySynth2Volume = document.getElementById("scenePrimarySynth2Volume").value;
                        let sceneTriggerSynth1Volume = document.getElementById("sceneTriggerSynth1Volume").value;
                        let sceneTriggerSynth2Volume = document.getElementById("sceneTriggerSynth2Volume").value;
                        let sceneAmbientSynth1Volume = document.getElementById("sceneAmbientSynth1Volume").value;
                        let sceneAmbientSynth2Volume = document.getElementById("sceneAmbientSynth2Volume").value;
                        let sceneAmbientAudioStreamURL = document.getElementById("sceneAmbientAudioStreamURL").value;
                        let sceneTriggerAudioStreamURL = document.getElementById("sceneTriggerAudioStreamURL").value;
                        let scenePrimaryTextFontSize = document.getElementById("scenePrimaryTextFontSize").value;
                      
                        let sceneColor1 = document.getElementById("sceneColor1").value;
                        let sceneColor2 = document.getElementById("sceneColor2").value;
                        let sceneColor3 = document.getElementById("sceneColor3").value;
                        let sceneHighlightColor = document.getElementById("sceneHighlightColor").value;
                        let sceneWindFactor = document.getElementById("sceneWindFactor").value;
                        let sceneLightningFactor = document.getElementById("sceneLightningFactor").value;
                        let sceneIosOK = document.getElementById("sceneIosOK").checked;
                        let sceneAndroidOK = document.getElementById("sceneAndroidOK").checked;
                        let sceneWindowsOK = document.getElementById("sceneWindowsOK").checked;
                        let sceneRestrictToLocation = document.getElementById("sceneRestrictToLocation").checked;
                        
                        let sceneFlyable = document.getElementById("sceneFlyable").checked;
                        let sceneFaceTracking = document.getElementById("sceneFaceTracking").checked;
                        let sceneHPlanesToggle = document.getElementById("sceneHPlanesToggle").checked;
                        let sceneVPlanesToggle = document.getElementById("sceneVPlanesToggle").checked;
                        let sceneCameraLookAtNext = document.getElementById("sceneCameraLookAtNext").checked;
                        let scenePrimaryAudioSync = document.getElementById("scenePrimaryAudioSync").checked;
                        let sceneCameraOrientToPath = document.getElementById("sceneCameraOrientToPath").checked;
                        let sceneRandomizeColors = document.getElementById("sceneRandomizeColors").checked;
                        let sceneTweakColors = document.getElementById("sceneTweakColors").checked;
                        let sceneColorizeSky = document.getElementById("sceneColorizeSky").checked;
                        let sceneGeneratePrimarySequences = document.getElementById("sceneGeneratePrimarySequences").checked;
                        let sceneGeneratePrimarySequence2 = document.getElementById("sceneGeneratePrimarySequence2").checked;
                        let sceneGenerateTriggerSequences = document.getElementById("sceneGenerateTriggerSequences").checked;
                        let sceneGenerateTriggerSequence2 = document.getElementById("sceneGenerateTriggerSequence2").checked;
                        let sceneGenerateAmbientSequences = document.getElementById("sceneGenerateAmbientSequences").checked;
                        let sceneGenerateAmbientSequence2 = document.getElementById("sceneGenerateAmbientSequence2").checked;
                        let sceneAmbientSynth1ModulateByDistance = document.getElementById("sceneAmbientSynth1ModulateByDistance").checked;
                        let sceneAmbientSynth1ModulateByDistanceTarget = document.getElementById("sceneAmbientSynth1ModulateByDistanceTarget").checked;
                        let sceneAmbientSynth2ModulateByDistance = document.getElementById("sceneAmbientSynth2ModulateByDistance").checked;
                        let sceneAmbientSynth2ModulateByDistanceTarget = document.getElementById("sceneAmbientSynth2ModulateByDistanceTarget").checked;
                        let sceneUseDynamicSky = document.getElementById("sceneUseDynamicSky").checked;
                        let sceneUseDynamicShadows = document.getElementById("sceneUseDynamicShadows").checked;
                        let sceneUseSkybox = document.getElementById("sceneAmbientSynth2ModulateByDistanceTarget").checked;
                        let sceneUseSceneFog = document.getElementById("sceneUseSceneFog").checked;
                        // let sceneUseGlobalFog = document.getElementById("sceneUseGlobalFog").checked;
                        let sceneUseVolumetricFog = document.getElementById("sceneUseVolumetricFog").checked;
                        let sceneUseSunShafts = document.getElementById("sceneUseSunShafts").checked;
                        let sceneUseUWFX = document.getElementById("sceneUseUWFX").checked;
                        let sceneUseDynCubeMap = document.getElementById("sceneUseDynCubeMap").checked;
                        let sceneUseMap = document.getElementById("sceneUseMap").checked;
                        let sceneUseEnvironment = document.getElementById("sceneUseEnvironment").checked;
                        let sceneUseHeightmap = document.getElementById("sceneUseHeightmap").checked;
                        let sceneUseStaticObj = document.getElementById("sceneUseStaticObj").checked;
                        let sceneUseFloorPlane = document.getElementById("sceneUseFloorPlane").checked;
                        let sceneRenderFloorPlane = document.getElementById("sceneRenderFloorPlane").checked;
                        let sceneScatterMeshes = document.getElementById("sceneScatterMeshes").checked;
                        let sceneScatterObjects = document.getElementById("sceneScatterObjects").checked;

                        let sceneUseThreeDeeText = document.getElementById("sceneUseThreeDeeText").checked;
                        let sceneTextLoop = document.getElementById("sceneTextLoop").checked;
                        let sceneTextAudioSync = document.getElementById("sceneTextAudioSync").checked;
                        let scenePrimaryTextRotate = document.getElementById("scenePrimaryTextRotate").checked;
                        let scenePrimaryTextScaleByDistance = document.getElementById("scenePrimaryTextScaleByDistance").checked;
                        // let sceneDistanceScaling = document.getElementById("sceneDistanceScaling").checked;
                        let sceneLoopPrimaryAudio = document.getElementById("sceneLoopPrimaryAudio").checked;
                        let sceneAutoplayPrimaryAudio = document.getElementById("sceneAutoplayPrimaryAudio").checked;
                        let scenePrimaryAudioVisualizer = document.getElementById("scenePrimaryAudioVisualizer").checked;
                        let sceneUseMicrophoneInput = document.getElementById("sceneUseMicrophoneInput").checked;
                        let sceneAttachPrimaryAudioToTarget = document.getElementById("sceneAttachPrimaryAudioToTarget").checked;
                        let scenePrimaryAudioTriggerEvents = document.getElementById("scenePrimaryAudioTriggerEvents").checked;
                        // let scenePrimaryTextAlign = document.getElementById(response.data.scenePrimaryTextAlign); 
                        // let scenePrimaryTextMode = document.getElementById(response.data.scenePrimaryTextMode); 
                        // let sceneCameraPath = document.getElementById(response.data.sceneCameraPath); 
                        // let sceneCameraMode = document.getElementById(response.data.sceneCameraMode); 
                        let sceneWaterName = document.getElementById("sceneWater").value; 
                        let sceneWaterLevel = document.getElementById("sceneWaterLevel").value;
                        let sceneWeatherName = document.getElementById("sceneWeather").value;
                        let sceneCloudsName = document.getElementById("sceneClouds").value; 
                        let sceneTimeName = document.getElementById("sceneTime").value;
                        let sceneTimeSpeedName = document.getElementById("sceneTimeSpeed").value
                        let sceneAssetBundleName = document.getElementById("sceneAssetBundleName").value; 
                        let sceneAssetBundleNameSelect = document.getElementById("sceneAssetBundleNameSelect").value; 

                        let scenePrimaryPatch1 = document.getElementById("scenePrimaryPatch1").value; 
                        let scenePrimaryPatch2 = document.getElementById("scenePrimaryPatch2").value; 
                        let sceneAmbientPatch1 = document.getElementById("sceneAmbientPatch1").value; 
                        let sceneAmbientPatch2 = document.getElementById("sceneAmbientPatch2").value; 
                        let sceneTriggerPatch1 = document.getElementById("sceneTriggerPatch1").value; 
                        let sceneTriggerPatch2 = document.getElementById("sceneTriggerPatch2").value; 
                        let sceneWebXREnvironment = document.getElementById("sceneWebXREnvironment").value; 
                        if (sceneAssetBundleNameSelect != "") {
                            sceneAssetBundleName = sceneAssetBundleNameSelect;
                        }
                        let sceneScatterMeshLayers = {};
                        let sceneScatterObjectLayers = {};
                        let sceneEnvironment = {};
                        sceneEnvironment.name = sceneAssetBundleName; //to do - flex for gltf
                        let sceneWeather = {};
                        sceneWeather.name = sceneWeatherName;
                        let sceneWater = {};
                        sceneWater.name = sceneWaterName;
                        sceneWater.useUWFX = sceneUseUWFX;
                        sceneWater.level = sceneWaterLevel;
                        let sceneClouds = {};
                        sceneClouds.name = sceneCloudsName;
                        let sceneTime = {};
                        sceneTime.name = sceneTimeName;
                        let sceneTimeSpeed = {};
                        // let sceneUseDynCubeMap =  document.getElementById('sceneUseDynCubeMap').checked;
                        sceneTimeSpeed.name = sceneTimeSpeedName;
                        // let sceneTargetEvent = {};
                        // let sceneTargetObject = {};
                        let scenePlayer = {};
                        sceneScatterMeshLayers.crystal = document.getElementById('sceneScatterMeshLayers.crystal').checked;
                        sceneScatterMeshLayers.conifer = document.getElementById('sceneScatterMeshLayers.conifer').checked;
                        sceneScatterMeshLayers.rock = document.getElementById('sceneScatterMeshLayers.rock').checked;
                        sceneScatterMeshLayers.tree2 = document.getElementById('sceneScatterMeshLayers.tree2').checked;
                        sceneScatterMeshLayers.redflower = document.getElementById('sceneScatterMeshLayers.redflower').checked;
                        sceneScatterMeshLayers.fern = document.getElementById('sceneScatterMeshLayers.fern').checked;
                        sceneScatterMeshLayers.grass1 = document.getElementById('sceneScatterMeshLayers.grass1').checked;
                        sceneScatterMeshLayers.bush = document.getElementById('sceneScatterMeshLayers.bush').checked;
                        sceneScatterMeshLayers.rock2 = document.getElementById('sceneScatterMeshLayers.rock2').checked;
                        sceneScatterMeshLayers.palm1 = document.getElementById('sceneScatterMeshLayers.palm1').checked;
                        sceneScatterMeshLayers.flower1 = document.getElementById('sceneScatterMeshLayers.flower1').checked;
                        sceneScatterMeshLayers.flower2 = document.getElementById('sceneScatterMeshLayers.flower2').checked;
                        sceneScatterMeshLayers.flower3 = document.getElementById('sceneScatterMeshLayers.flower3').checked;

                        sceneScatterObjectLayers.picobj = document.getElementById('sceneScatterObjectLayers.picobj').checked;
                        sceneScatterObjectLayers.linkobj = document.getElementById('sceneScatterObjectLayers.linkobj').checked;
                        sceneScatterObjectLayers.textobj = document.getElementById('sceneScatterObjectLayers.textobj').checked;
                        sceneScatterObjectLayers.audioobj = document.getElementById('sceneScatterObjectLayers.audioobj').checked;
                        sceneScatterObjectLayers.mediaobj = document.getElementById('sceneScatterObjectLayers.mediaobj').checked;
                        sceneScatterObjectLayers.keys = document.getElementById('sceneScatterObjectLayers.keys').checked;
                        sceneScatterObjectLayers.doors = document.getElementById('sceneScatterObjectLayers.doors').checked;
                        sceneScatterObjectLayers.mailboxes = document.getElementById('sceneScatterObjectLayers.mailboxes').checked;
                        sceneScatterObjectLayers.pickups = document.getElementById('sceneScatterObjectLayers.pickups').checked;
                        sceneScatterObjectLayers.drops = document.getElementById('sceneScatterObjectLayers.drops').checked;
                        sceneScatterObjectLayers.players = document.getElementById('sceneScatterObjectLayers.players').checked;
                        sceneScatterObjectLayers.characters = document.getElementById('sceneScatterObjectLayers.characters').checked;
                        sceneScatterObjectLayers.waypoints = document.getElementById('sceneScatterObjectLayers.waypoints').checked;

                        ///////////////////////////
                        //////////////////////////
                        
                        let data = {
                            _id : response.data._id,
                            pictures: pictures,
                            sceneTitle : sceneTitle,
                            sceneAppName: sceneAppName,
                            sceneDomain: sceneDomain,
                            sceneKeynote: sceneKeynote,
                            sceneDescription: sceneDescription,
                            sceneNextScene: sceneNextScene,
                            scenePreviousScene: scenePreviousScene,
                            sceneType: sceneType,
                            sceneShareWithPublic: sceneShareWithPublic,
                            sceneShareWithSubscribers: sceneShareWithSubscribers,
                            sceneStickyness: sceneStickyness,
                            sceneText: sceneText,
                            scenePictures: scenePictures,
                            scenePictureGroups: scenePictureGroups,
                            sceneVideos: sceneVideos,
                            sceneModels: sceneModels,
                            scenePostcards: scenePostcards,
                            scenePrimaryAudioTitle: scenePrimaryAudioTitle,
                            scenePrimaryAudioStreamURL: scenePrimaryAudioStreamURL,
                            scenePrimaryAudioID: scenePrimaryAudioID,
                            sceneAmbientAudioID: sceneAmbientAudioID,
                            // sceneTriggerAudioID: sceneTriggerAudioID,
                            sceneBPM: sceneBPM,
                            scenePrimaryVolume: scenePrimaryVolume,
                            sceneAmbientAudioStreamURL: sceneAmbientAudioStreamURL,
                            sceneAmbientVolume: sceneAmbientVolume,
                            sceneTriggerAudioStreamURL: sceneTriggerAudioStreamURL,
                            sceneTriggerVolume: sceneTriggerVolume,
                            sceneMasterAudioVolume: sceneMasterAudioVolume,
                            sceneWeatherAudioVolume: sceneWeatherAudioVolume,
                            sceneMediaAudioVolume: sceneMediaAudioVolume, 
                            scenePrimarySynth1Volume: scenePrimarySynth1Volume,
                            sceneAmbientSynth1Volume: sceneAmbientSynth1Volume,
                            sceneTriggerSynth1Volume: sceneTriggerSynth1Volume,
                            scenePrimarySynth2Volume: scenePrimarySynth2Volume,
                            sceneAmbientSynth2Volume: sceneAmbientSynth2Volume,
                            sceneTriggerSynth2Volume: sceneTriggerSynth2Volume,       
                            scenePrimaryTextFontSize: scenePrimaryTextFontSize,
                            sceneColor1: sceneColor1,
                            sceneColor2: sceneColor2,
                            sceneColor3: sceneColor3,
                            sceneHighlightColor: sceneHighlightColor,
                            sceneWindFactor: sceneWindFactor,
                            sceneLightningFactor: sceneLightningFactor,
                            sceneIosOK: sceneIosOK,
                            sceneAndroidOK: sceneAndroidOK,
                            sceneWindowsOK: sceneWindowsOK,
                            sceneRestrictToLocation: sceneRestrictToLocation,
                            sceneWebLinks: sceneWebLinks,
                            sceneFlyable: sceneFlyable,
                            sceneFaceTracking: sceneFaceTracking,
                            sceneHPlanesToggle: sceneHPlanesToggle,
                            sceneVPlanesToggle: sceneVPlanesToggle,
                            sceneCameraLookAtNext: sceneCameraLookAtNext,
                            scenePrimaryAudioSync: scenePrimaryAudioSync,
                            sceneCameraOrientToPath: sceneCameraOrientToPath,
                            sceneRandomizeColors: sceneRandomizeColors,
                            sceneTweakColors: sceneTweakColors,
                            sceneColorizeSky: sceneColorizeSky,
                            sceneGeneratePrimarySequences: sceneGeneratePrimarySequences,
                            sceneGeneratePrimarySequence2: sceneGeneratePrimarySequence2,
                            sceneGenerateTriggerSequences: sceneGenerateTriggerSequences,
                            sceneGenerateTriggerSequence2: sceneGenerateTriggerSequence2,
                            sceneGenerateAmbientSequences: sceneGenerateAmbientSequences,
                            sceneGenerateAmbientSequence2: sceneGenerateAmbientSequence2,
                            sceneAmbientSynth1ModulateByDistance: sceneAmbientSynth1ModulateByDistance,
                            sceneAmbientSynth1ModulateByDistanceTarget: sceneAmbientSynth1ModulateByDistanceTarget,
                            sceneAmbientSynth2ModulateByDistance: sceneAmbientSynth2ModulateByDistance,
                            sceneAmbientSynth2ModulateByDistanceTarget: sceneAmbientSynth2ModulateByDistanceTarget,
                            sceneUseDynamicSky: sceneUseDynamicSky,
                            sceneUseDynamicShadows: sceneUseDynamicShadows,
                            sceneUseSkybox: sceneUseSkybox,
                            sceneUseSceneFog: sceneUseSceneFog,
                            // sceneUseGlobalFog: sceneUseGlobalFog,
                            sceneUseVolumetricFog: sceneUseVolumetricFog,
                            sceneUseSunShafts: sceneUseSunShafts,
                            // sceneUseUWFX: sceneUseUWFX,
                            sceneUseDynCubeMap: sceneUseDynCubeMap,
                            sceneUseMap: sceneUseMap,
                            sceneUseEnvironment: sceneUseEnvironment,
                            sceneUseHeightmap: sceneUseHeightmap,
                            sceneUseStaticObj: sceneUseStaticObj,
                            sceneUseFloorPlane: sceneUseFloorPlane,
                            sceneRenderFloorPlane: sceneRenderFloorPlane,
                            sceneScatterMeshes: sceneScatterMeshes,
                            sceneScatterObjects: sceneScatterObjects,
                            sceneUseThreeDeeText: sceneUseThreeDeeText,
                            sceneTextLoop: sceneTextLoop,
                            sceneTextAudioSync: sceneTextAudioSync,
                            scenePrimaryTextRotate: scenePrimaryTextRotate,
                            scenePrimaryTextScaleByDistance: scenePrimaryTextScaleByDistance,
                            // sceneDistanceScaling: sceneDistanceScaling,
                            sceneLoopPrimaryAudio: sceneLoopPrimaryAudio,
                            sceneAutoplayPrimaryAudio: sceneAutoplayPrimaryAudio,
                            scenePrimaryAudioVisualizer: scenePrimaryAudioVisualizer,
                            sceneUseMicrophoneInput: sceneUseMicrophoneInput,
                            sceneAttachPrimaryAudioToTarget: sceneAttachPrimaryAudioToTarget,
                            scenePrimaryAudioTriggerEvents: scenePrimaryAudioTriggerEvents,
                            sceneNetworking: sceneNetworking,
                            scenePrimaryTextAlign: scenePrimaryTextAlign,
                            scenePrimaryTextMode: scenePrimaryTextMode,
                            sceneScatterMeshLayers: sceneScatterMeshLayers,
                            sceneScatterObjectLayers: sceneScatterObjectLayers,
                            sceneWater: sceneWater,
                            sceneWeather: sceneWeather,
                            sceneTime: sceneTime,
                            sceneTimeSpeed: sceneTimeSpeed,
                            sceneClouds: sceneClouds,
                            sceneEnvironment: sceneEnvironment,
                            scenePrimaryPatch1: scenePrimaryPatch1,
                            scenePrimaryPatch2: scenePrimaryPatch2,
                            sceneAmbientPatch1: sceneAmbientPatch1,
                            sceneAmbientPatch2: sceneAmbientPatch2,
                            sceneTriggerPatch1: sceneTriggerPatch1,
                            sceneTriggerPatch2: sceneTriggerPatch2,
                            sceneWebXREnvironment: sceneWebXREnvironment,
                            sceneLocations: sceneLocations
                        };
                        // let headers = { headers: {
                        //     appid: appid,
                        //     }
                        // };
                        $.confirm({
                            title: 'Confirm Scene Update',
                            content: 'Are you sure you want to change the scene?',
                            buttons: {
                            confirm: function () {
                                // console.log("data: " + JSON.stringify(data));   
                                axios.post('/update_scene/' + response.data._id, data)
                                    .then(function (response) {
                                        console.log(response);
                                        if (response.data.includes("updated")) {
                                            // window.location.reload();
                                            $("#topSuccess").html("Scene Updated!");
                                            $("#topSuccess").show();
                                        } else if (response.data.includes("created")) {
                                            window.location.reload();
                                        } else {
                                            $("#topAlert").html(response.data);
                                            $("#topAlert").show();
                                        }
                                    })                      
                                    .catch(function (error) {
                                        console.log(error);
                                    });
                                },
                                cancel: function () {
                                    $("#topAlert").html("Update cancelled");
                                    $("#topAlert").show();
                                },
                            }
                        });
                    });
                });
            // })
        // .catch(function (error) {
        //     console.log(error);
        // });                 
    }

    function getScene(sceneid) {
        axios.get('/uscene/' + userid + '/' + sceneid)
        .then(function (response) {
            // console.log(response);
            showScene(response);
        }) //end of main fetch
        .catch(function (error) {
            console.log(error);
        });
    }
    function newScene() {
        $("#cards").show();
        var card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Create New Scene</h6>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<form id=\x22newSceneForm\x22>" +
                "<button type=\x22submit\x22 id=\x22sumbitButton\x22 class=\x22btn btn-primary float-right\x22>Create</button>" + 
                    "<div class=\x22form-row\x22>" +
                    
                        "<div class=\x22col form-group col-md-3\x22>" + 
                            "<label for=\x22title\x22>Scene Title</label>" + 
                            "<input type=\x22text\x22 class=\x22form-control\x22 id=\x22title\x22 required>" +
                        "</div>" +
                        
                    "</div>" +
                "</div>" +
                "</form>" +
            "</div>";
        $("#cardrow").html(card);
        $(function() { //shorthand document.ready function
            $('#newSceneForm').on('submit', function(e) { 
                e.preventDefault();  
                // let objname = document.getElementById("objname").value;
                let title = document.getElementById("title").value;
                // let objdesc = document.getElementById("objdesc").value;
                let data = {
                    title: title
                }
                $.confirm({
                    title: 'Confirm Text Create',
                    content: 'Are you sure you want to create an new scene?',
                    buttons: {
                    confirm: function () {
                        axios.post(/newscene/, data)
                            .then(function (response) {
                                console.log(response);
                                if (response.data.includes("created")) {
                                    window.location.reload();
                                    // $("#topSuccess").html("New Text Created!");
                                    // $("#topSuccess").show();
                                    window.location.href = "index.html?type=scenes";
                                } else {
                                    $("#topAlert").html(response.data);
                                    $("#topAlert").show();
                                }
                            })                      
                            .catch(function (error) {
                                console.log(error);
                            });
                        },
                        cancel: function () {
                            $("#topAlert").html("Update cancelled");
                            $("#topAlert").show();
                        },
                    }
                });
                console.log("tryna submit");
            });
        });
    }

    function getAppScenes() {
        appid = getParameterByName("appid", window.location.href);
        $("#pageTitle").html("Scenes for " + appName(appid));
        let config = { headers: {
                appid: appid,
            }
        }
        let data = {
            sceneDomain: appDomain(appid)
        }
        axios.post('/appscenes/', data, config)
        .then(function (response) {
        // console.log(JSON.stringify(response));
        // var jsonResponse = response.data;
        //  var jsonResponse = response.data;
        var arr = response.data;
        console.log(JSON.stringify(arr[0]));
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>Scene Title</th>"+
            "<th>Scene Key</th>"+
            "<th>Stickyness</th>"+
            "<th>Public</th>"+
            "<th>Last Update</th>"+
            "<th>Platform</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            var android = arr[i].sceneAndroidOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-android\x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-android \x22></i></a>";
            var ios = arr[i].sceneIosOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-apple \x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-apple\x22></i></a>";
            var windows = arr[i].sceneWindowsOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-windows\x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-windows\x22></i></a>";
            tableBody = tableBody +
            "<tr>" +
            // "<td><button class=\x22btn btn-sm\x22 onclick=\x22getScene('" + arr[i]._id + "')\x22><i class=\x22far fa-edit\x22></i></button><a onclick=\x22getScene('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].sceneTitle + "</a></td>" +
            "<td><a class=\x22btn btn-sm\x22 href=\x22index.html?type=scene&iid=" + arr[i]._id + "\x22><i class=\x22far fa-edit\x22></i></button><a href=\x22index.html?type=scene&iid=" + arr[i]._id + "\x22>" + arr[i].sceneTitle + "</a></td>" +
            "<td><a href=\x22/webxr/" + arr[i].short_id + "\x22 target=\x22_blank\x22>" + arr[i].short_id + "</a></td>" +
            "<td>" + arr[i].sceneStickyness + "</td>" +
            "<td>" + arr[i].sceneShareWithPublic + "</td>" +
            "<td>" + arr[i].sceneLastUpdate + "</td>" +
            "<td>" + android + ios + windows + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>Scene Title</th>"+
            "<th>Scene Key</th>"+
            "<th>Stickyness</th>"+
            "<th>Public</th>"+
            "<th>Last Update</th>"+
            "<th>Platform</th>"+
            "</tr>" +
        "</tfoot>" +
        "</table>";
        var resultElement = document.getElementById('table1Data');
        resultElement.innerHTML = tableHead + tableBody + tableFoot;
        $('#dataTable1').DataTable(
            {"order": [[ 4, "desc" ]]}
        );
        })
        .catch(function (error) {
            console.log(error);
        });

    }

    function getScenes() {
    let config = { headers: {
                appid: appid,
            }
        }
        axios.get('/uscenes/' + userid, config)
        .then(function (response) {
        // console.log(JSON.stringify(response));
        // var jsonResponse = response.data;
        //  var jsonResponse = response.data;
        var arr = response.data;
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>Scene Title</th>"+
            "<th>Scene Key</th>"+
            "<th>App Name</th>"+
            "<th>Public</th>"+
            "<th>Last Update</th>"+
            "<th>Platform</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            var android = arr[i].sceneAndroidOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-android\x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-android \x22></i></a>";
            var ios = arr[i].sceneIosOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-apple \x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-apple\x22></i></a>";
            var windows = arr[i].sceneWindowsOK ? 
            "<a href=\x22#\x22 class=\x22btn btn-success btn-circle \x22><i class=\x22fab fa-windows\x22></i></a>" :
            "<a href=\x22#\x22 class=\x22btn btn-danger btn-circle \x22><i class=\x22fab fa-windows\x22></i></a>";
            tableBody = tableBody +
            "<tr>" +
            // "<td><button class=\x22btn btn-sm\x22 onclick=\x22getScene('" + arr[i]._id + "')\x22><i class=\x22far fa-edit\x22></i></button><a onclick=\x22getScene('" + arr[i]._id + "')\x22 href=\x22#\x22>" + arr[i].sceneTitle + "</a></td>" +
            "<td><a class=\x22btn btn-sm\x22 href=\x22index.html?type=scene&iid=" + arr[i]._id + "\x22><i class=\x22far fa-edit\x22></i></button><a href=\x22index.html?type=scene&iid=" + arr[i]._id + "\x22>" + arr[i].sceneTitle + "</a></td>" +
            "<td><a href=\x22/webxr/" + arr[i].short_id + "\x22>" + arr[i].short_id + "</a></td>" +
            "<td>" + arr[i].sceneDomain + "</td>" +
            "<td>" + arr[i].sceneShareWithPublic + "</td>" +
            "<td>" + arr[i].sceneLastUpdate + "</td>" +
            "<td>" + android + ios + windows + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
            "<tfoot>" +
            // "<tr>" +
            // "<th>Scene Title</th>"+
            // "<th>Scene Key</th>"+
            // "<th>App Name</th>"+
            // "<th>Public</th>"+
            // "<th>Last Update</th>"+
            // "<th>Platform</th>"+
            // "</tr>" +
        "</tfoot>" +
        "</table>";
        var resultElement = document.getElementById('table1Data');
        resultElement.innerHTML = tableHead + tableBody + tableFoot;
        $('#dataTable1').DataTable(
            {"order": [[ 4, "desc" ]]}
        );
    })
    .catch(function (error) {
        console.log(error);
    });
    let newButton = "<button class=\x22btn btn-info  float-right\x22 onclick=\x22newScene()\x22>Create New Scene</button>";
    $("#newButton").html(newButton);
    $("#newButton").show();
    }
    function getProfile() {
        let config = { headers: {
            appid: appid,
        }
        }
        console.log(userid);
        axios.get('/profile/' + userid, config)
        .then(function (response) {
            console.log(JSON.stringify(response));
            showProfilePurchases(response);  //populate datatables
            showProfileActivity(response);
            showProfileScores(response);
            //construct a card..
            let card = "<div class=\x22col-lg-12\x22>" +
            "<div class=\x22card shadow mb-4\x22>" +
                "<div class=\x22card-header py-3 d-flex flex-row align-items-center justify-content-between\x22>" +
                "<h6 class=\x22m-0 font-weight-bold text-primary\x22>Details</h6>" +
                "<div class=\x22dropdown no-arrow\x22>" +
                    "<a class=\x22dropdown-toggle\x22 href=\x22#\x22 role=\x22button\x22 id=\x22dropdownMenuLink\x22 data-toggle=\x22dropdown\x22 aria-haspopup=\x22true\x22 aria-expanded=\x22false\x22>" +
                    "<i class=\x22fas fa-ellipsis-v fa-sm fa-fw text-gray-400\x22></i>" +
                    "</a>" +
                    "<div class=\x22dropdown-menu dropdown-menu-right shadow animated--fade-in\x22 aria-labelledby=\x22dropdownMenuLink\x22>" +
                    "<div class=\x22dropdown-header\x22>Dropdown Header:</div>" +
                    "<a class=\x22dropdown-item\x22 href=\x22#\x22>Edit</a>" +
                    "<a class=\x22dropdown-item\x22 href=\x22#\x22>Another action</a>" +
                    "<div class=\x22dropdown-divider\x22></div>" +
                    "<a class=\x22dropdown-item\x22 href=\x22#\x22>Something else here</a>" +
                    "</div>" +
                "</div>" +
                "</div>" +
                "<div class=\x22card-body\x22>" +
                "<ul class=\x22list-inline\x22>" +
                "<li class=\x22list-inline-item\x22>| userName : <strong>"+ response.data.userName +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| userID : <strong>"+ response.data._id +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| userType : <strong>"+ response.data.type +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| status : <strong>"+ response.data.status +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| email : <strong>"+ response.data.email +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| created : <strong>"+ convertTimestamp(response.data.createDate) +"</strong></li>" +
                "<li class=\x22list-inline-item\x22>| @ IP : <strong>"+ response.data.createIP +"</strong></li>" +
                "</ul>" +
                "</div>" +
            "</div>" +
            "</div>";
            $("#cardrow").html(card);
        })
    .catch(function (error) {
        console.log(error);
    });
    }
    function showProfilePurchases(response) {
    var jsonResponse = response.data;
    var arr = jsonResponse.purchases;
    var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
        "<thead>"+
        "<tr>"+
            "<th>Name</th>"+
            "<th>Price</th>"+
            "<th>Purchase Date</th>"+
        "</tr>"+
        "</thead>"+
        "<tbody>";
    var tableBody = "";
    for(var i = 0; i < arr.length; i++) {
        tableBody = tableBody +
        "<tr>" +
        "<td>" + arr[i].itemName + "</td>" +
        "<td>" + "$ " + (arr[i].itemPrice * .01).toFixed(2)+ "</td>" +
        "<td>" + convertTimestamp(arr[i].purchaseTimestamp) + "</td>" +
        "</tr>";
    }
    var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>Name</th>"+
            "<th>Price</th>"+
            "<th>Purchase Date</th>"+
        "</tr>" +
    "</tfoot>" +
    "</table>";
    var resultElement = document.getElementById('table1Data');
    resultElement.innerHTML = tableHead + tableBody + tableFoot;
    $('#dataTable1').DataTable(
        {"order": [[ 1, "desc" ]]}
    );
    }
    function showProfileActivity(response) {
    var jsonResponse = response.data;
    var arr = jsonResponse.activity;
    var tableHead = "<table id=\x22dataTable2\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>Activity</th>"+
            "<th>Status</th>"+
            "<th>Date</th>"+
        "</tr>"+
    "</thead>"+
    "<tbody>";
    var tableBody = "";
    for(var i = 0; i < arr.length; i++) {
        tableBody = tableBody +
        "<tr>" +
        "<td>" + arr[i].activityType + "</td>" +
        "<td>" + arr[i].activityStatus + "</td>" +
        "<td>" + convertTimestamp(arr[i].activityTimestamp) + "</td>" +
        "</tr>";
    }
    var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>Activity</th>"+
            "<th>Status</th>"+
            "<th>Date</th>"+
        "</tr>" +
    "</tfoot>" +
    "</table>";
    var resultElement = document.getElementById('table2Data');
    resultElement.innerHTML = tableHead + tableBody + tableFoot;
    $('#dataTable2').DataTable(
        {"order": [[ 1, "desc" ]]}
    );
    }
    function showProfileScores(response) {
    var jsonResponse = response.data;
    var arr = jsonResponse.scores;
    var tableHead = "<table id=\x22dataTable3\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
            "<thead>"+
            "<tr>"+
            "<th>App</th>"+
            "<th>Scene</th>"+
            "<th>Type</th>"+
            "<th>Score</th>"+
            "<th>Date</th>"+
        "</tr>"+
    "</thead>"+
    "<tbody>";
    var tableBody = "";
    for(var i = 0; i < arr.length; i++) {
        tableBody = tableBody +
        "<tr>" +
        "<td>" + arr[i].appName + "</td>" +
        "<td>" + arr[i].sceneTitle + "</td>" +
        "<td>" + arr[i].scoreType + "</td>" +
        "<td>" + arr[i].scoreInt + "</td>" +
        "<td>" + convertTimestamp(arr[i].scoreTimestamp) + "</td>" +
        "</tr>";
    }
    var tableFoot =  "</tbody>" +
            "<tfoot>" +
            "<tr>" +
            "<th>App</th>"+
            "<th>Scene</th>"+
            "<th>Score</th>"+
            "<th>Date</th>"+
        "</tr>" +
    "</tfoot>" +
    "</table>";
    var resultElement = document.getElementById('table3Data');
    resultElement.innerHTML = tableHead + tableBody + tableFoot;
    $('#dataTable3').DataTable(
        {"order": [[ 1, "desc" ]]}
    );
    }
    function getTotalScores() {
        var resultElement = document.getElementById('table1Data');
        resultElement.innerHTML = '';
        let config = { headers: {
            appid: appid,
        }
        }
        axios.get('/totalscores_aka/' + appid, config)
        .then(function (response) {
        // console.log(JSON.stringify(response));
        resultElement.innerHTML = showTotalScores(response);
        $('#dataTable1').DataTable(
        {"order": [[ 1, "desc" ]]}
        );
        
    })
    .catch(function (error) {
        console.log(error);
    });
    } 
    function showTotalScores(response) {
        var jsonResponse = response.data;
        var arr = jsonResponse.totalscores;
        var tableHead = "<table id=\x22dataTable1\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>" +
                "<thead>"+
                "<tr>"+
                "<th>Name</th>"+
                "<th>Total</th>"+
                "<th>Rank</th>"+
            "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            tableBody = tableBody +
            "<tr>" +
            "<td>" + arr[i].scoreName + "</td>" +
            "<td>" + arr[i].scoreTotal + "</td>" +
            "<td>" + arr[i].rank + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                "<th>Name</th>" +
                "<th>Total</th>" +
                "<th>Rank</th>" +
            "</tr>" +
        "</tfoot>" +
        "</table>";
        getTopScores(); //call next one
        return tableHead + tableBody + tableFoot;
    }
    function getTopScores() {
    var resultElement = document.getElementById('table2Data');
    resultElement.innerHTML = '';
    let config = { headers: { //this route requires app id in header!
        appid: appid,
        }
    }
    axios.get('/topscores/' + appid, config)
    .then(function (response) {
    // console.log(JSON.stringify(response));
    resultElement.innerHTML = showTopScores(response);
    $('#dataTable2').DataTable(
        {"order": [ 1, "desc" ]}
        );
    })
    .catch(function (error) {
        console.log(error);
        // resultElement.innerHTML = showError(error);
        // datahtml = showError(error);
    });
    } 
    function showTopScores(response) {
        var jsonResponse = response.data;
        var arr = jsonResponse.scores;
        var tableHead = "<table id=\x22dataTable2\x22 class=\x22display table table-striped table-bordered\x22 style=\x22width:100%\x22>"+
                "<thead>"+
                "<tr>"+
                "<th>Name</th>"+
                "<th>Score</th>"+
                "<th>Type</th>"+
                "<th>Scene</th>"+
                "<th>Difficulty</th>"+
                "<th>Date</th>"+
            "</tr>"+
        "</thead>"+
        "<tbody>";
        var tableBody = "";
        for(var i = 0; i < arr.length; i++) {
            tableBody = tableBody +
            "<tr>" +
            "<td>" + arr[i].aka + "</td>" +
            "<td>" + arr[i].scoreInt + "</td>" +
            "<td>" + arr[i].scoreType + "</td>" +
            "<td>" + arr[i].sceneTitle + "</td>" +
            "<td>" + arr[i].difficulty + "</td>" +
            "<td>" + convertTimestamp(arr[i].scoreTimestamp) + "</td>" +
            "</tr>";
        }
        var tableFoot =  "</tbody>" +
                "<tfoot>" +
                "<tr>" +
                "<th>Name</th>"+
                "<th>Score</th>"+
                "<th>Type</th>"+
                "<th>Scene</th>"+
                "<th>Difficulty</th>"+
                "<th>Date</th>"+
            "</tr>" +
        "</tfoot>" +
        "</table>";
        return tableHead + tableBody + tableFoot;
    }
    function logout() {
        Cookies.remove('_id');
        location.reload();
    } 
    function convertTimestamp(unixtimestamp){
        var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var date = new Date(unixtimestamp*1000);
        var year = date.getFullYear();
        var month = months_arr[date.getMonth()];
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
        var convdataTime = month+' '+day+' '+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return convdataTime;
        }

    function getParameterByName(name, url) { //to get querystring params
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
    function timestamp() {
            var d = new Date();
            var n = d.getTime();
            return n;
    }
        //upload and staging stuff
    var selected = [];
    var uppy = Uppy.Core({
            onBeforeFileAdded: (currentFile, files) => {
                const fileNameM = currentFile.name.replace(/\s+/g, '');
                const fileNameMo = fileNameM.replace(/,/g, '');
                const fileNameMod = fileNameMo.toLowerCase();
                console.log(currentFile.name +" vs "+ fileNameMod);
                const modifiedFile = Object.assign(
                {},
                    currentFile,
                    { name: fileNameMod //clean name for bad chars
                })
                uppy.info(modifiedFile);
                return modifiedFile
                }
            })
            .use(Uppy.Dashboard, {
                inline: true,
                target: '#drag-drop-area',
            })
            .use(Uppy.Webcam, {
                target: Uppy.Dashboard,
                modes: [
                    'video-audio',
                    'video-only',
                    'audio-only',
                    'picture'
                ],
                mirror: true,
                facingMode: 'environment',
            })
            .use(Uppy.AwsS3, {
            getUploadParameters (file) {
            return fetch('/stagingputurl/' + cookie._id, {
            method: 'post',
        // Send and receive JSON.
            headers: {
                accept: 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                uid: cookie._id,
                filename: 'staging/' + cookie._id + '/' + timestamp() + '_' + file.name.replace(/,\s+/g, '').toLowerCase(),
                contentType: file.type
            })
            }).then((response) => {
            // Parse the JSON response.

            return response.json()
            }).then((data) => {
                console.log("tryna parse respoonse: " + JSON.stringify(data));
        // Return an object in the correct shape.
            return {
                method: data.method,
                url: data.url,
                fields: data.fields,
                headers: {
                    "Content-Type": file.type
                    }
                }
                })
            }
        });
        uppy.on('complete', (result) => {
        console.log('Upload complete! We’ve uploaded these files:', result.successful);
            window.location.href = "./index.html?type=staging";
        });
        $(document).on("click",".delete",function(){ //because the button is dynamic, must do it via .on
            console.log("delete clicked");
            // alert(this.id);
            var nameKey = this.id; //id css selector has the filename
            $.confirm({
                title: 'Confirm!',
                content: 'Are you sure you want to delete ' + (this.id) + '?',
                buttons: {
                    confirm: function () {
                        // $.alert('Confirmed!');
                        $.ajax({
                        url: "/staging_delete",
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: JSON.stringify({
                                key: nameKey,
                                uid: cookie._id
                            }),
                            success: function( data, textStatus, xhr ){
                                console.log(data);
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });
                            },
                            error: function( xhr, textStatus, errorThrown ){
                                console.log( xhr.responseText );
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });
                            }
                        });

                    },
                    cancel: function () {
                        // $.alert('Canceled!');
                    },
                }
            });
        });
        $(document).on("click","#process_selected",function(){             
            processMe = {};
            pArr = [];
            for( var i = 0; i < selected.length; i++){
                d = {};
                d.key = selected[i].replace(/,\s+/g, '').toLowerCase();
                d.uid = cookie._id;
                pArr.push(d);
            }
            processMe.items = pArr;
            console.log("tryna process " + JSON.stringify(pArr));
            $.confirm({
                title: 'Confirm!',
                content: 'Are you sure you want to process ' + pArr.length + ' items?',
                buttons: {
                    confirm: function () {
                    $.ajax({
                        url: "/process_staging_files",
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: JSON.stringify({
                                processMe
                                // param2: $('#textbox2').val()
                            }),
                            success: function( data, textStatus, xhr ){
                                console.log(data);
                                processMe = {};
                                selected = [];
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });

                            },
                            error: function( xhr, textStatus, errorThrown ){
                                console.log( xhr.responseText );
                                processMe = {};
                                selected = [];
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });
                            }
                        });
                    },
                    cancel: function () {
                        // $.alert('Canceled!');
                    },
                }
            });
        });
        $(document).on("click","#delete_selected",function(){ 
            deleteMe = {};
            dlArr = [];
            for( var i = 0; i < selected.length; i++){
                d = {};
                d.key = selected[i];
                d.uid = cookie._id;
                dlArr.push(d);
            }
            deleteMe.items = dlArr;
            console.log("tryna delete " + JSON.stringify(dlArr));
            $.confirm({
                title: 'Confirm Delete!',
                content: 'Are you sure you want to delete ' + dlArr.length + ' items?',
                buttons: {
                    confirm: function () {
                    $.ajax({
                        url: "/staging_delete_array",
                        type: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        data: JSON.stringify({
                            deleteMe
                                // param2: $('#textbox2').val()
                            }),
                            success: function( data, textStatus, xhr ){
                                console.log(data);
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });
                                deleteMe = {};
                                selected = [];
                            },
                            error: function( xhr, textStatus, errorThrown ){
                                console.log( xhr.responseText );
                                $.get( "/staging/" + cookie._id, function( data ) {
                                    // console.log("tryna get staging data : " + JSON.stringify(data));
                                    $( "#staging-area" ).html( showStaging(data) );
                                });
                                deleteMe = {};
                                selected = [];
                            }
                        });
                    },
                    cancel: function () {
                        // $.alert('Canceled!');
                    },
                }
            });
        });
    let showStagingButtons = false;
    $(document).on("click","input[name='select']",function(){ //because the button is dynamic, must do it via .on
        var extensions = [];
        if (!showStagingButtons) {
        let stagingButtons = "<div id=\x22stagingButtons\x22 class=\x22float-right\x22><button class=\x22btn btn-primary btn-sm float-right\x22 id=\x22process_selected\x22>Process Selected Files</button>" +
        "<button class=\x22btn btn-warning btn-sm  float-right\x22 id=\x22archive_selected\x22>Archive Selected Files</button>"+            
        "<button class=\x22btn btn-danger btn-sm  float-right\x22 id=\x22delete_selected\x22>Delete Selected Files</button></div>";
        $("#pageTitle").append(stagingButtons);
        showStagingButtons = true;
        }
        if ( $(this).is(':checked') ) {
            selected.push(this.id);

            console.log(selected.length + " selected " + this.id);
            if (selected.length > 0) {
                $( "#stagingButtons" ).show();
            } else {
                $( "#stagingButtons" ).hide();
            }
        } else {
            for( var i = 0; i < selected.length; i++){
            if ( selected[i] === this.id) {
                selected.splice(i, 1);
                }
            }
            if (selected.length > 0) {
                $( "#stagingButtons" ).show();
            } else {
                $( "#stagingButtons" ).hide();
            }
            console.log(selected.length + " selected");
        }
    });  
