const express = require("express");
const oculus_router = express.Router();
const axios =  require("axios");

oculus_router.post("/:app/:action", function (req, res) 
{
    console.log("oculus request " + JSON.stringify(req.body));
    if (req.params.action.toString().toLowerCase() != "validate") 
    {
        res.send("No Action");
        return;
    }
    
    let data = {};
    switch(req.params.app.toString().toLowerCase())
    {
        case "cb_rift":
            data.access_token = process.env.CB_OCULUS_RIFT_TOKEN;
        break;
            
        case "cb_quest":
            data.access_token = process.env.CB_OCULUS_QUEST_TOKEN;
        break;
            
        default:
            res.send("Invalid App");
        return;
    
    }
    
    data.nonce = req.body.nonce;
    data.user_id = req.body.oID;
    console.log(JSON.stringify(data));
    axios.post("https://graph.oculus.com/user_nonce_validate/", data) 
    .then((response) => 
    {
        res.send(response);
    })
    .catch(function (error) 
    {
        res.send(error);
    })
});

    oculus_router.get("/test", function (req, res) 
    {
        res.send("OK!");
    });

module.exports = oculus_router;
