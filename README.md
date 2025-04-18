# authapp
An authentication app that currently supports token-based authentication and email verification by OTP. This application utilizes Spring Boot for backend, React for frontend and PostgreSQL for Data Store.

## Prerequisites
* Java 21
* Maven
* NodeJS
* Docker
  
## Step 1
* Rename `.env-sample` to `.env`
* Insert your credentials in the env variables

## Step 2
* Run the following command in the root directory `./mvnw clean package -DskipTests`. This will install dependencies for the spring app. (Note - This command is for Windows)
* Run `docker-compose up --build -d`, to start the docker containers. (PostgreSQL, spring, react).
