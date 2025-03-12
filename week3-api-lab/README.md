
API USED EXPLANTION 

The service.js used RESTful API and build using the Node.js and Express. 
This provides the user authentications using JSON Web Token(JWT) by that it allows acess to a protected route.

The API of server.js have a main tree endpoint:
1. /api/register/ - register a new user
example: on this part the username and password to register

        {
            "username": "lyla",
            "password": "password"
        }

2. /api/login/ - here it let user to login and return JWT tokens
example: to login un and pass also needed to get the tokens

        {
            "username": "lyla",
            "password": "password123"
        }

this how the reponse will look like
        {
             "token": "your-jwt-token"
        }

3. /api/protected/ - if the user has a valid JWT token it allow the access
example: to access this route you need to add the JWT token in the header
    
        key: Authorization
        value: Bearer your-jwt-token

example response if the token given is valid 
        
        {
            "message": "Protected content",
            "user": {
            "username": "lyla",
            "iat": 1710200000,
            "exp": 1710203600
            }
        }

and access denied if its invalid





