import React from "react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MoviesList } from "../movies-list/movies-list";
import { MovieView } from "../movie-view/movie-view";
import { LoginView } from "../login-view/login-view";
import { SignupView } from "../signup-view/signup-view";
import { ProfileView } from '../profile-view/profile-view';
import { NavigationBar } from "../navigation-bar/navigation-bar";
import { setMovies } from "../../redux/reducers/movies";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export const MainView = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const storedToken = localStorage.getItem("token");
  const [user, setUser] = useState(storedUser? storedUser : null);
  const [token, setToken] = useState(storedToken? storedToken : null);
  const movies = useSelector((state) => state.movies.list);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if(!token) {
        return;
    }

    fetch("https://my-flix-cf-fd6a3633859c.herokuapp.com/movies", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then((response) => response.json())
        .then((movies) => {
            const moviesApi = movies.map((movie) => {
                return {
                    _id: movie._id,
                    Title: movie.Title,
                    Description: movie.Description,
                    ImagePath: movie.ImagePath,
                    Director: movie.Director
                };
            });
            dispatch(setMovies(moviesApi));
        }).catch((e) => {
            console.log(e);
        });
}, [token]);

const onLoggedOut = () => {
  setUser(null);
  setToken(null);
  localStorage.clear();
}

const onLoggedIn = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
}

const updatedUser = user => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
}


return (
    <BrowserRouter>
    <NavigationBar user={user} onLoggedOut={onLoggedOut} />
        <Row className="justify-content-md-center">
            <Routes>
                <Route
                    path="/login"
                    element={
                        <>
                            {user ? (
                                <Navigate to="/"/>
                            ) : (
                                <Col md={5}>
                                    <LoginView 
                                        onLoggedIn={onLoggedIn} 
                                    />
                                </Col>
                            )}
                        </>
                    }
                    />
                    <Route
                        path="/signup"
                        element={
                            <>
                                {user ? (
                                    <Navigate to="/" />
                                ) : (
                                    <Col md={5}>
                                        <SignupView />
                                    </Col>
                                )}
                            </>
                        }
                    />
                    <Route
                        path="/users/:Username"
                        element={
                            <>
                                {!user ? (
                                    <Navigate to="/login" replace />
                                ) : (
                                    <Col md={5}>
                                        <ProfileView 
                                            user={user}
                                            token={token}
                                            updatedUser={updatedUser}
                                            onLoggedOut={onLoggedOut}
                                        />
                                    </Col>
                                )}
                            </>
                        }
                    />
                    <Route
                        path="/movies/:movieId"
                        element={
                            <>
                                {!user ? (
                                    <Navigate to="/login" replace />
                                    ) : movies.length === 0 ? (
                                        <Col>The list is empty</Col>
                                    ) : (    
                                        <Col md={8}>
                                            <MovieView 
                                            user={user}
                                            token={token}
                                            setUser={setUser}  
                                            />
                                        </Col>
                                )}
                            </>
                        }
                    />
                    <Route
                         path="/"
                         element={
                           <>{!user ? <Navigate to="/login" replace /> : <MoviesList />}</>
                         }
                       />
            </Routes>
        </Row>
    </BrowserRouter>
    );
};