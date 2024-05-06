const express = require('express'),
morgan = require('morgan'), 
fs = require('fs'), 
path = require('path'),
bodyParser = require('body-parser'),
uuid = require('uuid'),
mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movies;//importing the movie model from models.js

const Users = Models.Users;

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use(bodyParser.json());
const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
const { check, validationResult } = require('express-validator');
//^^^validation logic here^^^


// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));



//UPDATE: Handle PUT request to update user information
/* We'll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date,
  FavouriteMovies: []
}
*/
app.post('/users', async (req, res) => { // Create a new user
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
      //If the user is found, send a response that it already exists
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});
app.put("/users/:username", [
  //input validation here
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], passport.authenticate('jwt', {session: false}), async (req, res) => {
  
    //check validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }

    //condition to check that username in request matches username in request params
    if(req.user.username !== req.params.username) {
      return res.status(400).send('Permission denied.');
    }
    //condition ends, finds user and updates their info
    await Users.findOneAndUpdate(
      { Username: req.params.username },
      {
        $set: {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
          //FavouriteMovies: req.body.FavouriteMovies,
        },
      },
      { new: true } //this line makes sure the updated document is returned
    )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error:" + err);
      });
  });


// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:movieId', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $push: { FavouriteMovies: req.params.movieId }
     },
     { new: true }) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
  });

  
// DELETE: Handle DELETE request to remove a movie from a user's favorite movies array
app.delete( '/users/:id/:movieTitle', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndUpdate({username: req.params.username}, 
        { $pull: {FavouriteMovies: req.params.movieTitle} }, {new: true})
    .then ((updatedUser) => {
        res.json(updatedUser);
    })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
 })

 
// CREATE: Handle POST request to add/Create a new user
/* We'll expect JSON in this format
{
    ID: Integer,
    Username: String,
    Password: String,
    Email: String,
    Birthday: Date
}
*/


// READ: Handle GET request to retrieve all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


// READ: Handle GET request to retrieve a movie by its title
app.get('/movies/:title', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({ Title: req.params.title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


//READ:  Handle GET request to retrieve a genre by it's name
app.get('/movies/genre/:genreName', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.genreName })
        .then((genre) => {
          if (genre) {
            res.json(genre);
          } else {
            res.status(400).send(req.params.genreName + " genre was not found.");
          }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


//READ: Handle GET request to retrieve a director by name
app.get('/movies/director/:directorName', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({ 'Director.Name': req.params.directorName })
      .then((director) => {
        if (director) {
            res.status(200).json(director);
        } else {
            res.status(404).send('no such director');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
})

// Get all users
app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


app.get('/', (req, res) => {
    res.send('Welcome to my movies app....GETFLIX!!');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

/*app.listen(8080, () => {
    console.log('The movie app has loaded and is listening on port 8080');
});
*/

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
  console.log('Listening on Port ' + port);
});