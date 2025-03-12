
API USED EXPLANTION 

The service.js used RESTful API and build using the Node.js and Express. 
This provides the user authentications using JSON Web Token(JWT) by that it allows acess to a protected route.

The API has a main tree endpoint:
1. /api/register/ - register a new user

example: on this part the username and password to register

        {
        "username": "lyla",
        "password": "ExelangangLoveKo31"
        }


2. /api/login/ - here it let user to login and return JWT tokens

example: to login un and pass also needed to get the tokens

        {
        "username": "lyla",
        "password": "ExelangangLoveKo31"
        }

this how the reponse will look like

        {
            "token": "eyJhbGc..."
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
                "iat": 1741786354,
                "exp": 1741789954
            }
        }

and shows "access denied" if its invalid



Microservices break down a big system into smaller, independent services that can work on their own but still communicate with each other.

We have API which are auth-service.js that focus on authentication and product-service.js that focus on products

The auth-service.js has 2 main points:
1. /api/register/ - here it let user to register
2. /api/login/ - here it let user to login and return JWT tokens

The product-service.js has 1 main points:
1. /api/products/ - here it let user to get all products

example: its a protected route so tokens is needed

        key: Authorization
        value: Bearer your-jwt-token

example reponse if the token is right

    [
        {
            "id":1,
            "name":"Laptop",
            "price":50000
        },
        {
            "id":2,
            "name":"Smartphone",
            "price":25000
        }
    ]








