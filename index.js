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
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Database connected successfully'))
.catch(err => console.log('Database connection error: ' + err)); //environment variable for connection URI
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(bodyParser.json());
const cors = require('cors');
let allowedOrigins = ['*']; //CHANGED FOR TESTING <<<
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }//$env:CONNECTION_URI='mongodb+srv://sartajsingh:herokupassword@mplix.yivwrwe.mongodb.net/?retryWrites=true&w=majority&appName=mplix'
    return callback(null, true); //heroku git:remote -a frozen-bastion-60513
  }
}));
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
const { check, validationResult } = require('express-validator');
const { Server } = require('http');
//^^^validation logic here^^^
const TopMovies =
[
 {id:"1", title: 'The Shawshank Redemption', director: 'Frank Darabont', genre: 'Drama', releaseYear: '1994'},
 {id:"2", title: 'The Godfather', director: 'Francis Ford Coppola', genre: 'Drama', releaseYear: '1972'},
 {id:"3", title: 'The Dark Knight', director: 'Christopher Nolan', genre: 'Action', releaseYear: '2008'},
 {id:"4", title: 'The Godfather: Part II', director: 'Francis Ford Coppola', genre: 'Drama', releaseYear: '1974'},
 {id:"5", title: "Schindler's List", director: 'Steven Spielberg', genre: 'Biography', releaseYear: '1993'},
 {id:"6", title: 'The Lord of the Rings: The Return of the King', director: 'Peter Jackson', genre: 'Adventure', releaseYear: '2003'},
 {id:"7", title: 'Pulp Fiction', director: 'Quentin Tarantino', genre: 'Crime', releaseYear: '1994'},
 {id:"8", title: 'The Good, the Bad and the Ugly', director: 'Sergio Leone', genre: 'Western', releaseYear: '1966'},
 {id:"9", title: 'The Lord of the Rings: The Fellowship of the Ring', director: 'Peter Jackson', genre: 'Adventure', releaseYear: '2001'},
 {id:"10", title: 'Fight Club', director: 'David Fincher', genre: 'Drama', releaseYear: '1999'}];

// Read the file, ^ converting into json file so I can execute mongoimport for the movies.
fs.readFile('TopMovies.json', 'utf8', (err, data) => {
  if (err) {
      console.error('Error reading file:', err);
      return;
  }

  // Parse the JSON data
  const TopMovies = JSON.parse(data);

  // Create a write stream
  const writeStream = fs.createWriteStream('TopMovies_new.json');

  // Write each object to the file with a newline after each object
  TopMovies.forEach(movie => {
      writeStream.write(JSON.stringify(movie) + '\n');
  });

  // Close the write stream
  writeStream.end();
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

app.use(morgan('combined', {stream: accessLogStream}));

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
//Update a user's info, by username.
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
      return res.status(400).send('Update to user will be made.');
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
// READ: Handle GET request to retrieve all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
    .then((movies) => {
        res.status(201).json(TopMovies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//mongoimport --uri mongodb+srv://sartajsingh8:how@myflixdb.w89div2.mongodb.net/myflixDB --collection movies --type json --file <FILENAME>

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
    res.send('Welcome to my movies app....myFLIX!!');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
const port = process.env.PORT || 8080; //correctly set up for both local and Heroku deployment.
app.listen(port, '0.0.0.0',() => {
  console.log('Listening on Port ' + port);
});