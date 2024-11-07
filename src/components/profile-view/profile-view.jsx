import React from 'react';
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useSelector } from "react-redux";

import { UserInfo } from './user-info';
import { ProfileUpdate } from './user-update';
import { NavigationBar } from '../navigation-bar/navigation-bar';
import { FavoriteMovies } from './favorite-movies';

export const ProfileView = ({ user, token, updatedUser, onLoggedOut }) => {
    const movies = useSelector((state) => state.movies.list);
    const favoriteMovies = movies.filter(m => user.FavoriteMovies.includes(m._id));
    const ProfileDelete = () => {
        fetch(`https://frozen-bastion-60513-44d63176384c.herokuapp.com/users/${user.Name}`, 
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            
        }
        ).then((response) => {
            console.log(response);
            if (response.ok) {
                console.log("Account deleted successfully!");
                onLoggedOut();
                NavigationBar("/login");
            } else {
            alert("Failed to delete account!");
            }
        })
    }
    
    return (
        <Container>
            <Row className="justify-content-center">
                <Col>
                    <Card>
                        <Card.Header>
                            <UserInfo name={user.Name} email={user.Email}/>
                        </Card.Header>
                    </Card>
                </Col>
                <Col xs={12}>
                    <Card>
                        <Card.Body>
                        <ProfileUpdate
                            user={user}
                            token={token}
                            updatedUser={updatedUser}
                        />
                        </Card.Body>
                        <Card.Body>
                         <Button 
                            variant="danger"
                            onClick={() => {
                                ProfileDelete();
                            }}>
                                Delete account
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12}>
                    <h3>Your Favorite Movies</h3>
                    <FavoriteMovies favmov={favoriteMovies} />
                </Col>
            </Row>
        </Container>
    );
};