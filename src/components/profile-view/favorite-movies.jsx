import React from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export const FavoriteMovies = ({ favmov }) => {
  return (
    <div>
      {favmov.length === 0 ? (
        <p>No movies</p>
      ) : (
        favmov.map((movie) => (
          <Card key={movie._id} className="mb-4">
            <Card.Body>
            <Card.Img variant="top" src={movie.ImagePath} />
              <Card.Title>{movie.Title}</Card.Title>
              <Card.Text>{movie.Director.Name}</Card.Text>
              <Link to={`/movies/${movie._id}`}>
                <Button variant="primary">Movie Information</Button>
              </Link>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
};

FavoriteMovies.prototype = {
  FavoriteMovies: PropTypes.array.isRequired
};