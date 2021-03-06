const passport = require('passport');
const User = require('./user');
const logger = require('../../logs');
const { response } = require('express');

const exhangeCodeForToken = async (ROOT_URL, code)=>{
    if(!code){
        console.error("Bad or no code", code);
        return false;
    }
    var url = 'https://auth.bouncie.com/oauth/token';
    try{
        var response = await fetch(url, {
            method: 'POST',
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: "scheduling",
                client_secret:"9NBi5xLH9MwXAB8VVZ93vvPYiPCJlxmlZjZIyaPfC0Qw78oaX0",
                grant_type: "authorization_code",
                code: code,
                redirect_uri: ROOT_URL + '/bouncieAuth/callback'
            })
        })
        const json = await response.json();
        return json;

    }
    catch(error){
        logger.error("Bouncie (exhangeCodeForToken): " + error);
        return false;
    }
}

function bouncie({ROOT_URL, app, database}) {

    app.get('/bouncieAuth', function(req,res){
        res.redirect('https://auth.bouncie.com/dialog/authorize?response_type=code&client_id=scheduling&redirect_uri=' + ROOT_URL+ '/bouncieAuth/callback');
    })


    

    app.get('/bouncieAuth/callback', async function(req,res){
        //console.log("bouncie auth", req);

        let code = req.query.code;
        if(!code){
            console.error("No Auth code");
        }
        let user_id = req.user.id;
        if(!user_id){
            console.error("No User id");
        }

        try{
            
            exhangeCodeForToken(ROOT_URL,code)
            .then((response)=>{
                if(!response){
                    throw new Error("No access code returned from exhangeCodeForToken");
                }
                console.log("date saved", response.expires_in);
                User.updateUserBouncie(database,code, response.access_token, response.expires_in, user_id)
                .then((data)=>{
                    console.log("code", code)
                    console.log("update response", data);
                    console.log("session",req.session)
                    res.redirect('/');
                })
                .catch((error)=>{
                    console.error("Failed to update Bouncie access token", error);
                    res.redirect('/');
                })

            })
            .catch((error)=>{
                console.error("Failed to exchanged for token.", error);
                res.redirect('/');
            })
            


            
        }
        catch(error){
            console.error("Failed to update bouncie token", error);
            res.redirect('/error');
        }
        
        
    })
}

module.exports = bouncie;

module.exports = {
    bouncie,
    exhangeCodeForToken,
};