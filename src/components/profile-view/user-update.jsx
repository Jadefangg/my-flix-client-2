import React, { useState } from "react";
import PropTypes from "prop-types";
import {Form, Button} from "react-bootstrap";


export const ProfileUpdate = ({user, updatedUser}) => {
    const token = localStorage.getItem("token");
    
    const [Name, setName] = useState("");
    const [Password, setPassword] = useState("");
    const [Email, setEmail] = useState("");
    const [Birthday, setBirthday] = useState("");
    
    const handleSubmit = (event) => {
        event.preventDefault();
        
        const data = {
            Name: Name,
            Password: Password,
            Email: Email,
            Birthday: Birthday
        }
    
            fetch(`https://my-flix-cf-fd6a3633859c.herokuapp.com/users/${user.Name}`, 
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data),
            }
            ).then((response) => {
                console.log(response);
                if (response.ok) {
                    console.log("Update successful!");
                    return response.json();
                } else {
                alert("Update failed!");
                }
            })
            .then((data) => {
                updatedUser(data);
                setName(data.Name);
                setPassword(data.Password);
                setEmail(data.Email);
                setBirthday(data.Birthday);
                window.location.reload();
            })
            .catch((e) => {
                console.log(e);
            });
    };
  
    return (
        <Form onSubmit={handleSubmit}>
            <h2>Update Info</h2>
            <Form.Group controlId="formUsername">
              <Form.Label>Username:</Form.Label>
              <Form.Control
                  type="text"
                  value={Name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength="3"
              />
            </Form.Group>  
            
            <Form.Group controlId="formPassword">
              <Form.Label>Password:</Form.Label>
              <Form.Control
                  type="password"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
              />
            </Form.Group>
            
            <Form.Group controlId="formEmail">
              <Form.Label>Email:</Form.Label>
              <Form.Control
                  type="email"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />
            </Form.Group>
          
            <Form.Group controlId="formBirthday">
              <Form.Label>Birthday:</Form.Label>
              <Form.Control
                  type="date"
                  value={Birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  required
              />
            </Form.Group>
            <br></br>
            <div>  
                <Button variant="primary" type="submit">
                    Edit Profile
                </Button>
          </div>
        </Form>
    )
};  

ProfileUpdate.propTypes = {
    user: PropTypes.object.isRequired,
    updatedUser: PropTypes.func.isRequired 
};