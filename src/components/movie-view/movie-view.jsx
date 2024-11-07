import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import "./movie-view.scss";

export const MovieView = ({ user, token, setUser }) => {
  const movies = useSelector((state) => state.movies.list);
  const { movieId } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const movie = movies.find((movie) => movie._id === movieId);

  useEffect(() => {
    if(user && user.FavoriteMovies)  {
        const isFavorite = user.FavoriteMovies.includes(movieId);
        setIsFavorite(isFavorite);
    }
}, [movieId, user]);

const addtoFavorite = () => {
  fetch(`https://my-flix-cf-fd6a3633859c.herokuapp.com/users/${user.Name}/FavoriteMovies/${movieId}`, {
      method: "PUT",
      headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
      }
  })
  .then((response) => {
    console.log(response);
    console.log(movieId)
      if (response.ok) {
          return response.json();
      }
  })
  .then((data) => {
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      setIsFavorite(true);
  })
  .catch((e) => {
      console.log(e);
  });
};

const removefromFavorite = () => {
  fetch(`https://my-flix-cf-fd6a3633859c.herokuapp.com/users/${user.Name}/FavoriteMovies/${movieId}`, {
      method: "DELETE",
      headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
      }
  })
  .then((response) => {
      if (response.ok) {
          return response.json();
      }
  })
  .then((data) => {
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      setIsFavorite(false);
  })
  .catch((e) => {
      console.log(e);
  });
};

   return (
    <div>
      <div>
        <img src={movie.ImagePath} />
        </div>
      <div>
        <span>Title: </span>
        <span>{movie.Title}</span>
      </div>
      <div>
        <span>Description: </span>
        <span>{movie.Description}</span>
      </div>
      <div>
        <span>Director: </span>
        <span>{movie.Director.Name}</span>
      </div>
      <Link to={`/`}>
        <button className="back-button">Back</button>
      </Link>
      <div className="mt-1"> 
        {isFavorite ? (
          <Button variant="danger" onClick={removefromFavorite}>Remove from favorite</Button>
      ) : (
          <Button variant="primary" onClick={addtoFavorite}>Add to favorite</Button>   
      )}
      </div>
    </div>
  );
};