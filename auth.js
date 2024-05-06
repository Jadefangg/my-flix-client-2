const jwtSecret='your_jwt_secret'; //this has to be the same key used in the JWTStrategy
const jwt = require('jsonwebtoken'),
passport = require('passport');

require('./passport.js'); //local passport file, 
//this is the relative path for the passport.js file
console.log("this is the passport file,this is a test to see if the passport file is being called.");//this is a test to see if the passport file is being called.

let generateJWTToken=(user) => { //generating a JWT token for the user.
    
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, //username you’re encoding in the JWT
    expiresIn: '7d', //specifying that the token will expire in 7 days.
    algorithm: 'HS256' //algorithm used to “sign” or encode the values of the JWT
  }); 
}

module.exports=(router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            console.log(user); // Log the user object to the console
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right, user might not exist or credentials are incorrect',
                    user: user
                });
            }

             //NEW log in endpoint for the user >>.
            req.login(user, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON()); //TOKEN GENERATION
                return res.json({user, token}); //returning the user object and the token.
            });
        })(req, res);
    })
}



