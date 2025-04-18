# authapp
An authentication app that currently supports token-based authentication and email verification by OTP.

## Step 1
* Rename `.env-sample` to `.env`
* Insert your credentials in the env variables

## Step 2
* Run in the root directory `./mvnw clean package -DskipTests`. This will install dependencies for the spring app.
* Run `docker-compose up --build -d`, to start the docker containers. (PostgreSQL, spring, react).
